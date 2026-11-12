/* O Músico — leitura de cifras.
   Aceita ChordPro ([C]letra, {title: …}, {soc}/{eoc}, {sot}/{eot}, {c: …})
   e o formato popular "acordes acima da letra", convertendo para uma estrutura única. */
(function (OM) {
  "use strict";
  var T = OM.theory;

  var CHORD_TOKEN_EXTRA = /^(\||\|\||\/|-|\(|\)|x\d+|\d+x|%|N\.?C\.?|\.\.\.?)$/i;
  function isChordLine(line) {
    var toks = line.trim().split(/\s+/).filter(Boolean);
    if (!toks.length) return false;
    var chords = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i].replace(/^\(|\)$/g, "");
      if (CHORD_TOKEN_EXTRA.test(toks[i]) || !t) continue;
      if (T.parseChord(t)) { chords++; continue; }
      return false;
    }
    return chords > 0;
  }
  var TAB_RE = /^\s*[A-Ga-g]?[#b]?\s*[|:]?[-\d|hpbrx\/\\~()^.sv<>*]{6,}\s*$/;
  function isTabLine(line) { return TAB_RE.test(line) && (line.match(/-/g) || []).length >= 4; }
  var SECTION_RE = /^\s*\[?\s*(intro|introdução|refrão|refrao|coro|verso|estrofe|ponte|pré-refrão|pre-refrão|solo|final|outro|interlúdio|interludio|primeira parte|segunda parte|parte \d+|riff|base|chorus|verse|bridge)\b[^\]]*\]?\s*:?\s*$/i;

  /* converte "acordes acima da letra" em ChordPro */
  function fromPlain(text) {
    var lines = String(text).replace(/\r/g, "").replace(/\t/g, "    ").split("\n");
    var out = [], i = 0;
    while (i < lines.length) {
      var ln = lines[i];
      if (/^\s*\{.*\}\s*$/.test(ln)) { out.push(ln.trim()); i++; continue; }
      if (isTabLine(ln)) {
        out.push("{sot}");
        while (i < lines.length && (isTabLine(lines[i]) || (lines[i].trim() === "" && i + 1 < lines.length && isTabLine(lines[i + 1])))) { out.push(lines[i]); i++; }
        out.push("{eot}");
        continue;
      }
      if (SECTION_RE.test(ln) && !isChordLine(ln)) { out.push("{c: " + ln.trim().replace(/^\[|\]$/g, "").replace(/:$/, "") + "}"); i++; continue; }
      if (isChordLine(ln)) {
        var next = lines[i + 1];
        if (next != null && next.trim() !== "" && !isChordLine(next) && !isTabLine(next) && !/^\s*\{/.test(next) && !SECTION_RE.test(next)) {
          out.push(merge(ln, next)); i += 2; continue;
        }
        out.push(ln.trim().split(/\s+/).map(function (t) { return T.isChord(t) && !CHORD_TOKEN_EXTRA.test(t) ? "[" + t + "]" : t; }).join(" "));
        i++; continue;
      }
      out.push(ln);
      i++;
    }
    return out.join("\n");
  }
  function merge(chordLine, lyric) {
    var pos = [], re = /\S+/g, m;
    while ((m = re.exec(chordLine))) pos.push({ c: m.index, t: m[0] });
    var l = lyric;
    var maxC = pos.length ? pos[pos.length - 1].c : 0;
    while (l.length < maxC) l += " ";
    for (var k = pos.length - 1; k >= 0; k--) {
      var p = pos[k], tok = p.t;
      var ins = T.isChord(tok.replace(/^\(|\)$/g, "")) && !CHORD_TOKEN_EXTRA.test(tok) ? "[" + tok + "]" : "";
      if (!ins) continue;
      l = l.slice(0, p.c) + ins + l.slice(p.c);
    }
    return l.replace(/\s+$/, "");
  }
  function looksLikeChordPro(text) { return /\[[A-G][^\]\s]*\]/.test(text) || /^\s*\{(title|t|soc|start_of_chorus|c|comment)\b/m.test(text); }

  /* ChordPro -> {meta, blocks} */
  function parse(text) {
    text = String(text || "");
    if (!looksLikeChordPro(text)) text = fromPlain(text);
    var lines = text.replace(/\r/g, "").split("\n");
    var meta = {}, blocks = [], chorus = null, tab = null;
    function push(b) { (chorus ? chorus.lines : blocks).push(b); }
    lines.forEach(function (ln) {
      var d = /^\s*\{\s*([\w_]+)\s*(?::\s*(.*?))?\s*\}\s*$/.exec(ln);
      if (tab && !(d && /^(eot|end_of_tab)$/i.test(d[1]))) { tab.text.push(ln); return; }
      if (d) {
        var k = d[1].toLowerCase(), v = d[2] || "";
        if (k === "t" || k === "title") meta.title = v;
        else if (k === "st" || k === "subtitle" || k === "artist") meta.artist = v;
        else if (k === "album") meta.album = v;
        else if (k === "key") meta.key = v;
        else if (k === "capo") meta.capo = +v || 0;
        else if (k === "tempo" || k === "bpm") meta.bpm = +v || 0;
        else if (k === "time") meta.time = v;
        else if (k === "soc" || k === "start_of_chorus") { chorus = { type: "chorus", lines: [] }; blocks.push(chorus); if (v) chorus.lines.push({ type: "comment", text: v }); }
        else if (k === "eoc" || k === "end_of_chorus") chorus = null;
        else if (k === "sot" || k === "start_of_tab") { tab = { type: "tab", text: [] }; push(tab); }
        else if (k === "eot" || k === "end_of_tab") { tab = null; }
        else if (k === "c" || k === "comment" || k === "ci" || k === "comment_italic" || k === "cb") push({ type: "comment", text: v });
        return;
      }
      if (!ln.trim()) { push({ type: "blank" }); return; }
      var sec = /^\s*\[([^\]]+)\]\s*$/.exec(ln);
      if (sec && !T.isChord(sec[1])) { push({ type: "comment", text: sec[1] }); return; }
      push({ type: "line", segs: segments(ln) });
    });
    while (blocks.length && blocks[blocks.length - 1].type === "blank") blocks.pop();
    while (blocks.length && blocks[0].type === "blank") blocks.shift();
    return { meta: meta, blocks: blocks };
  }
  /* "[G]Amazing [C]grace" -> [{c:"G", l:"Amazing "}, {c:"C", l:"grace"}] (palavras extras viram segmentos sem acorde, para quebrar linha) */
  function segments(ln) {
    var segs = [], re = /\[([^\]]*)\]/g, last = 0, m, curC = "";
    function addText(c, txt) {
      if (!txt && !c) return;
      var words = txt.match(/\S+\s*|\s+/g) || [""];
      words.forEach(function (w, i) { segs.push({ c: i === 0 ? c : "", l: w }); });
    }
    while ((m = re.exec(ln))) {
      var txt = ln.slice(last, m.index);
      if (last === 0 && m.index > 0) addText("", txt);
      else if (last > 0) addText(curC, txt);
      curC = m[1];
      last = re.lastIndex;
    }
    if (last === 0) addText("", ln);
    else addText(curC, ln.slice(last));
    /* acorde no meio da palavra: junta com o restante para alinhar */
    return segs;
  }
  /* lista ordenada de acordes únicos da música */
  function chordsOf(parsed) {
    var seen = {}, out = [];
    (function walk(bl) {
      bl.forEach(function (b) {
        if (b.type === "chorus") walk(b.lines);
        else if (b.type === "line") b.segs.forEach(function (s) { if (s.c && T.parseChord(s.c) && !seen[s.c]) { seen[s.c] = 1; out.push(s.c); } });
      });
    })(parsed.blocks);
    return out;
  }
  /* converte de volta para texto "acordes acima da letra" (compartilhar / exportar) */
  function toPlain(parsed, tr) {
    var out = [];
    tr = tr || function (c) { return c; };
    (function walk(bl) {
      bl.forEach(function (b) {
        if (b.type === "chorus") { walk(b.lines); out.push(""); return; }
        if (b.type === "blank") { out.push(""); return; }
        if (b.type === "comment") { out.push("[" + b.text + "]"); return; }
        if (b.type === "tab") { out.push(b.text.join("\n")); return; }
        var cl = "", ll = "";
        b.segs.forEach(function (s) {
          var c = s.c ? tr(s.c) : "";
          if (c) { while (cl.length < ll.length) cl += " "; if (cl.length > ll.length) ll += " ".repeat(cl.length - ll.length); cl += c + " "; }
          ll += s.l;
        });
        if (cl.trim()) out.push(cl.replace(/\s+$/, ""));
        if (ll.trim()) out.push(ll);
      });
    })(parsed.blocks);
    return out.join("\n");
  }

  OM.chordpro = { parse: parse, fromPlain: fromPlain, isChordLine: isChordLine, chordsOf: chordsOf, toPlain: toPlain };
})(window.OM);
