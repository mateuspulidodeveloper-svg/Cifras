/* O Músico — partitura em SVG (pauta, claves, armadura, figuras, pausas) e reprodução de melodias.
   Formato da melodia: "G4q G4q A4h | B4e. C5s D5q R q ..." (nota+oitava, duração w h q e s, "." pontuada). */
(function (OM) {
  "use strict";
  var T = OM.theory;
  var LETTERS = "CDEFGAB";
  var DUR = { w: 4, h: 2, q: 1, e: 0.5, s: 0.25 };
  var GAP = 8; /* distância entre linhas */
  var SHARP_ORDER = "FCGDAEB", FLAT_ORDER = "BEADGCF";
  var KEY_SIG = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6,
    Am: 0, Em: 1, Bm: 2, "F#m": 3, "C#m": 4, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5 };

  function parseMelody(str) {
    var out = [], bar = 0;
    String(str || "").trim().split(/\s+/).forEach(function (tok) {
      if (tok === "|") { bar++; out.push({ bar: true }); return; }
      var m = /^(R|[A-G][#b]?\d)\s*([whqes])(\.?)$/.exec(tok);
      if (!m) return;
      var d = DUR[m[2]] * (m[3] ? 1.5 : 1);
      if (m[1] === "R") out.push({ rest: true, dur: d, type: m[2], dot: !!m[3] });
      else {
        var nm = /^([A-G])([#b]?)(\d)$/.exec(m[1]);
        out.push({ letter: nm[1], alter: nm[2] === "#" ? 1 : nm[2] === "b" ? -1 : 0, oct: +nm[3], midi: T.parseNote(m[1]), dur: d, type: m[2], dot: !!m[3], name: m[1] });
      }
    });
    return out;
  }
  function keyMap(key) {
    var n = KEY_SIG[key] || 0, map = {};
    for (var i = 0; i < Math.abs(n); i++) map[(n > 0 ? SHARP_ORDER : FLAT_ORDER)[i]] = n > 0 ? 1 : -1;
    return { n: n, map: map };
  }
  /* posição diatônica (0 = linha inferior da pauta) */
  function staffPos(letter, oct, clef) {
    var d = LETTERS.indexOf(letter) + oct * 7;
    return clef === "bass" ? d - (4 + 2 * 7) : d - (2 + 4 * 7); /* G2 ou E4 na 1ª linha */
  }
  function el(tag, attrs) { var e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }

  var TREBLE = "M11 52 C 6 54, 3 49, 6 46 C 8 44, 12 46, 11 49 M11 52 L 13 -10 C 14 -18, 21 -15, 18 -6 C 15 2, 3 9, 3 23 C 3 34, 12 38, 17 34 C 22 29, 19 20, 12 21 C 6 22, 6 30, 11 32";
  var BASS = "M4 8 C 4 1, 19 -1, 20 10 C 20 22, 11 30, 3 35";
  function drawClef(g, clef, x, top) {
    if (clef === "bass") {
      g.appendChild(el("path", { d: BASS, transform: "translate(" + x + "," + top + ") scale(" + GAP / 10 + ")", fill: "none", stroke: "currentColor", "stroke-width": 2.2, "stroke-linecap": "round", class: "clef" }));
      g.appendChild(el("circle", { cx: x + 4.5 * GAP / 10, cy: top + 9 * GAP / 10, r: 2.6, class: "clef" }));
      g.appendChild(el("circle", { cx: x + 24 * GAP / 10, cy: top + 5 * GAP / 10, r: 1.4, class: "clef" }));
      g.appendChild(el("circle", { cx: x + 24 * GAP / 10, cy: top + 15 * GAP / 10, r: 1.4, class: "clef" }));
    } else {
      g.appendChild(el("path", { d: TREBLE, transform: "translate(" + (x - 2) + "," + top + ") scale(" + GAP / 10 + ")", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", class: "clef" }));
    }
  }
  function accGlyph(alter) { return alter === 1 ? "♯" : alter === -1 ? "♭" : "♮"; }

  /* desenha a pauta. opts: {clef, key, time, width, notes (parseMelody), highlight}
     retorna {svg, noteEls[]} */
  function render(opts) {
    var clef = opts.clef || "treble", width = opts.width || 360, notes = opts.notes || [], km = keyMap(opts.key || "C");
    var lineTop = 30, sysH = GAP * 4 + 64, left = 8;
    var svgEl = el("svg", { class: "staff", viewBox: "0 0 " + width + " 100", preserveAspectRatio: "xMinYMin meet" });
    var noteEls = [];
    /* quebra em sistemas por compasso */
    var bars = [[]];
    notes.forEach(function (n) { if (n.bar) bars.push([]); else bars[bars.length - 1].push(n); });
    bars = bars.filter(function (b) { return b.length; });
    var headW = 34 + Math.abs(km.n) * 7 + (opts.time ? 18 : 0);
    function barWidth(b) { return b.reduce(function (a, n) { return a + 14 + Math.sqrt(n.dur) * 16 + (n.alter || n.dot ? 6 : 0); }, 10); }
    var systems = [], cur = [], wsum = 0;
    bars.forEach(function (b) {
      var bw = barWidth(b), avail = width - left - 4 - (systems.length === 0 ? headW : headW - (opts.time ? 18 : 0));
      if (cur.length && wsum + bw > avail) { systems.push(cur); cur = []; wsum = 0; }
      cur.push(b); wsum += bw;
    });
    if (cur.length) systems.push(cur);
    if (!systems.length) systems.push([]);
    var idx = 0;
    systems.forEach(function (sys, si) {
      var top = lineTop + si * sysH, g = el("g", {});
      svgEl.appendChild(g);
      for (var l = 0; l < 5; l++) g.appendChild(el("line", { x1: left, x2: width - 4, y1: top + l * GAP, y2: top + l * GAP, class: "ln" }));
      drawClef(g, clef, left + 4, top);
      var x = left + 30;
      /* armadura */
      var order = km.n > 0 ? SHARP_ORDER : FLAT_ORDER;
      for (var k = 0; k < Math.abs(km.n); k++) {
        var L = order[k];
        var octs = clef === "bass" ? (km.n > 0 ? { F: 3, C: 3, G: 3, D: 3, A: 2, E: 3, B: 2 } : { B: 2, E: 3, A: 2, D: 3, G: 2, C: 3, F: 2 })
          : (km.n > 0 ? { F: 5, C: 5, G: 5, D: 5, A: 4, E: 5, B: 4 } : { B: 4, E: 5, A: 4, D: 5, G: 4, C: 5, F: 4 });
        var p = staffPos(L, octs[L], clef);
        var t = el("text", { x: x, y: top + 4 * GAP - p * GAP / 2 + 4, "font-size": 15, class: "acc" });
        t.textContent = km.n > 0 ? "♯" : "♭"; g.appendChild(t);
        x += 7;
      }
      if (si === 0 && opts.time) {
        var ts = opts.time.split("/");
        var t1 = el("text", { x: x + 6, y: top + GAP * 2 - 1, "font-size": 17, "font-weight": 800, "text-anchor": "middle", class: "ts" }); t1.textContent = ts[0];
        var t2 = el("text", { x: x + 6, y: top + GAP * 4 - 1, "font-size": 17, "font-weight": 800, "text-anchor": "middle", class: "ts" }); t2.textContent = ts[1];
        g.appendChild(t1); g.appendChild(t2); x += 18;
      }
      x += 6;
      var total = sys.reduce(function (a, b) { return a + barWidth(b); }, 0);
      var avail = width - 6 - x, scale = si === systems.length - 1 ? Math.min(1.35, avail / total) : avail / total;
      sys.forEach(function (bar, bi) {
        var shown = {};
        bar.forEach(function (n) {
          var w = (14 + Math.sqrt(n.dur) * 16 + (n.alter || n.dot ? 6 : 0)) * scale;
          var cx = x + 8 * scale + (n.alter != null && needAcc(n, km, shown) ? 6 : 0);
          var ng = el("g", { "data-i": idx });
          drawNote(ng, n, cx, top, clef, km, shown);
          g.appendChild(ng);
          noteEls[idx] = ng; n.i = idx; idx++;
          x += w;
        });
        x += 10 * scale;
        g.appendChild(el("line", { x1: x - 4 * scale, x2: x - 4 * scale, y1: top, y2: top + 4 * GAP, class: "bar" }));
        if (bi === sys.length - 1 && si === systems.length - 1) {
          g.appendChild(el("line", { x1: x - 1, x2: x - 1, y1: top, y2: top + 4 * GAP, class: "bar", "stroke-width": 3 }));
        }
      });
    });
    svgEl.setAttribute("viewBox", "0 0 " + width + " " + (lineTop + systems.length * sysH - 20));
    return { svg: svgEl, noteEls: noteEls, notes: notes.filter(function (n) { return !n.bar; }) };
  }
  function needAcc(n, km, shown) {
    if (n.rest) return false;
    var keyAlt = km.map[n.letter] || 0, k = n.letter + n.oct;
    var prev = k in shown ? shown[k] : keyAlt;
    return n.alter !== prev;
  }
  function drawNote(g, n, cx, top, clef, km, shown) {
    var bottom = top + 4 * GAP, mid = top + 2 * GAP;
    if (n.rest) {
      if (n.type === "w") g.appendChild(el("rect", { x: cx - 5, y: top + GAP, width: 10, height: 4, class: "nh" }));
      else if (n.type === "h") g.appendChild(el("rect", { x: cx - 5, y: mid - 4, width: 10, height: 4, class: "nh" }));
      else if (n.type === "q") g.appendChild(el("path", { d: "M" + (cx - 2) + " " + (mid - 12) + " l5 6 l-4 5 l5 6 c-4 -2 -7 0 -4 5 c-6 -3 -5 -9 1 -7 l-5 -6 l4 -5 z", class: "nh" }));
      else {
        g.appendChild(el("circle", { cx: cx - 2, cy: mid - 4, r: 2.3, class: "nh" }));
        g.appendChild(el("path", { d: "M" + (cx - 2) + " " + (mid - 2) + " Q" + (cx + 2) + " " + (mid - 1) + " " + (cx + 4) + " " + (mid - 6) + " L" + (cx) + " " + (mid + 8), stroke: "currentColor", "stroke-width": 1.4, fill: "none" }));
        if (n.type === "s") g.appendChild(el("circle", { cx: cx - 3, cy: mid + 2, r: 2.3, class: "nh" }));
      }
      if (n.dot) g.appendChild(el("circle", { cx: cx + 8, cy: mid - 2, r: 1.5, class: "nh" }));
      return;
    }
    var p = staffPos(n.letter, n.oct, clef), y = bottom - p * GAP / 2;
    /* linhas suplementares */
    for (var lp = -2; lp >= p; lp -= 2) g.appendChild(el("line", { x1: cx - 8, x2: cx + 8, y1: bottom - lp * GAP / 2, y2: bottom - lp * GAP / 2, class: "ln" }));
    for (var up = 10; up <= p; up += 2) g.appendChild(el("line", { x1: cx - 8, x2: cx + 8, y1: bottom - up * GAP / 2, y2: bottom - up * GAP / 2, class: "ln" }));
    if (needAcc(n, km, shown)) {
      var t = el("text", { x: cx - 15, y: y + 5, "font-size": 15, class: "acc" }); t.textContent = accGlyph(n.alter); g.appendChild(t);
    }
    shown[n.letter + n.oct] = n.alter;
    var open = n.type === "w" || n.type === "h";
    g.appendChild(el("ellipse", { cx: cx, cy: y, rx: 5.3, ry: 3.9, transform: "rotate(-22 " + cx + " " + y + ")", class: "nh" + (open ? " open" : "") }));
    if (n.type !== "w") {
      var upStem = p < 4, sx = upStem ? cx + 4.6 : cx - 4.6, sy2 = upStem ? y - 27 : y + 27;
      g.appendChild(el("line", { x1: sx, x2: sx, y1: y + (upStem ? -1 : 1), y2: sy2, class: "stem" }));
      var flags = n.type === "e" ? 1 : n.type === "s" ? 2 : 0;
      for (var f = 0; f < flags; f++) {
        var fy = sy2 + (upStem ? f * 6 : -f * 6);
        g.appendChild(el("path", { d: "M" + sx + " " + fy + (upStem ? " c 1 6, 9 7, 6 16" : " c 1 -6, 9 -7, 6 -16"), fill: "none", stroke: "currentColor", "stroke-width": 1.8 }));
      }
    }
    if (n.dot) g.appendChild(el("circle", { cx: cx + 9, cy: y - (p % 2 === 0 ? 2.5 : 0), r: 1.6, class: "nh" }));
  }

  /* reprodução da melodia com destaque da nota tocada */
  function play(notes, bpm, onNote, inst) {
    var c = OM.audio.context(), t = c.currentTime + 0.1, beat = 60 / (bpm || 90), timers = [];
    notes.forEach(function (n, i) {
      if (!n.rest) {
        OM.synth.note(n.midi, inst || OM.inst.current(), t, 0.45);
      }
      (function (tt, ii) { timers.push(setTimeout(function () { onNote && onNote(ii); }, (tt - c.currentTime) * 1000)); })(t, i);
      t += n.dur * beat;
    });
    timers.push(setTimeout(function () { onNote && onNote(-1); }, (t - c.currentTime) * 1000 + 100));
    return function () { timers.forEach(clearTimeout); onNote && onNote(-1); };
  }

  OM.staff = { parseMelody: parseMelody, render: render, play: play, staffPos: staffPos, KEY_SIG: KEY_SIG };
})(window.OM);
