/* O Músico — gerador de digitações de acordes para instrumentos de cordas com trastes.
   Funciona com qualquer afinação: procura combinações tocáveis (até 4 dedos, pestana,
   abertura de até 4 casas), valida as notas essenciais e ordena por facilidade. */
(function (OM) {
  "use strict";
  var T = OM.theory;
  var cache = {};

  /* notas que não podem faltar: fundamental, terça (ou sus), sétima e extensões alteradas */
  function essentials(ch) {
    var ints = ch.intervals.map(function (x) { return x % 12; });
    var ess = [0];
    ints.forEach(function (i) {
      if (i === 0) return;
      if (i === 7 && ints.length >= 4) return; /* 5ª justa é opcional em tétrades */
      if (ch.intervals.length >= 5 && (i === 2) && ints.indexOf(10) >= 0 && ch.intervals.indexOf(21) >= 0) return; /* 9ª opcional no 13 */
      ess.push(i);
    });
    return ess.map(function (i) { return T.mod12(ch.rootPc + i); }).filter(function (v, j, a) { return a.indexOf(v) === j; });
  }

  /* atribui dedos 1–4; usa pestana apenas quando há mais de 4 notas presas */
  function fingersFor(frets) {
    var fretted = [];
    frets.forEach(function (f, s) { if (f > 0) fretted.push({ s: s, f: f }); });
    var fingers = frets.map(function () { return 0; });
    if (!fretted.length) return { fingers: fingers, barre: null, count: 0 };
    var minF = Math.min.apply(null, fretted.map(function (x) { return x.f; }));
    var barre = null, rest = fretted, next = 1;
    if (fretted.length > 4) {
      var atMin = fretted.filter(function (x) { return x.f === minF; });
      if (atMin.length < 2) return { fingers: fingers, barre: null, count: 99 };
      var first = atMin[0].s, last = n1(frets) ;
      /* a pestana vai da primeira corda presa na menor casa até a última corda tocada */
      for (var s = first; s <= last; s++) if (frets[s] >= 0 && frets[s] < minF) return { fingers: fingers, barre: null, count: 99 };
      barre = { fret: minF, from: first, to: last };
      atMin.forEach(function (x) { fingers[x.s] = 1; });
      rest = fretted.filter(function (x) { return x.f !== minF; });
      next = 2;
    }
    rest.sort(function (a, b) { return a.f - b.f || a.s - b.s; });
    var count = barre ? 1 : 0;
    rest.forEach(function (x) {
      var want = barre ? x.f - minF + 1 : x.f - minF + 1;
      var fgr = Math.max(next, Math.min(4, want));
      fingers[x.s] = fgr; next = fgr + 1; count++;
      if (fgr > 4) count = 99;
    });
    return { fingers: fingers, barre: barre, count: count };
  }
  function n1(fr) { for (var i = fr.length - 1; i >= 0; i--) if (fr[i] >= 0) return i; return 0; }

  /* digitações consagradas em violão/guitarra (afinação padrão), usadas como primeira opção */
  var OPEN = {
    "C": "x32010", "C7": "x32310", "C7M": "x32000", "Cm": "x35543", "Cadd9": "x32030", "Csus4": "x33010", "C6": "x32210",
    "D": "xx0232", "Dm": "xx0231", "D7": "xx0212", "Dm7": "xx0211", "D7M": "xx0222", "Dsus4": "xx0233", "Dsus2": "xx0230", "D6": "xx0202",
    "E": "022100", "Em": "022000", "E7": "020100", "Em7": "022030", "E7M": "021100", "Esus4": "022200", "E7sus4": "020200", "Eadd9": "024100",
    "F": "133211", "Fm": "133111", "F7": "131211", "F7M": "xx3210", "Fm7": "131111",
    "G": "320003", "G7": "320001", "G7M": "320002", "Gm": "355333", "G6": "320000", "Gsus4": "330013",
    "A": "x02220", "Am": "x02210", "A7": "x02020", "Am7": "x02010", "A7M": "x02120", "Asus4": "x02230", "Asus2": "x02200", "A7sus4": "x02030", "A6": "x02222", "Am6": "x02212",
    "B": "x24442", "Bm": "x24432", "B7": "x21202", "Bm7": "x20202", "Bm7(b5)": "x2323x", "Bb": "x13331", "Bbm": "x13321",
    "Eb": "x68886", "Ab": "466544", "C#m": "x46654", "F#m": "244222", "F#": "244322", "G#m": "466444", "Ebm": "x68876",
    "E°": "0120x0", "A°": "x0121x", "B°": "x2343x", "F#m7(b5)": "2x221x", "Em7(b5)": "x7878x", "Am7(b5)": "x0101x"
  };
  var ALIAS = { "maj7": "7M", "M7": "7M", "min": "m", "mi": "m", "-": "m", "7+": "7M", "sus": "sus4", "4": "sus4", "7/4": "7sus4", "m7b5": "m7(b5)", "ø": "m7(b5)", "dim": "°", "o": "°" };
  function openShape(ch) {
    var suf = ALIAS[ch.suffix] != null ? ALIAS[ch.suffix] : ch.suffix;
    var key = T.name(ch.rootPc, false) + suf, keyF = T.name(ch.rootPc, true) + suf;
    var sh = OPEN[key] || OPEN[keyF];
    if (!sh || ch.bass) return null;
    return sh.split("").map(function (c) { return c === "x" ? -1 : +c; });
  }

  function generate(chordName, tuning, opts) {
    opts = opts || {};
    var key = chordName + "|" + tuning.join(",") + "|" + (opts.reentrant ? 1 : 0) + (opts.std ? "s" : "") + "|" + (opts.max || 8);
    if (cache[key]) return cache[key];
    var ch = T.parseChord(chordName);
    if (!ch) return (cache[key] = []);
    var n = tuning.length, pcs = ch.pcs, ess = essentials(ch);
    var bassPc = ch.bassPc, maxFret = opts.maxFret || 14, span = n <= 4 ? 4 : 3;
    var results = [], seen = {};

    for (var base = 0; base <= maxFret - 1; base++) {
      var opts2 = [];
      for (var s = 0; s < n; s++) {
        var o = [-1];
        var open = tuning[s];
        if (pcs.indexOf(T.mod12(open)) >= 0) o.push(0);
        var lo = Math.max(1, base), hi = base + span;
        for (var f = lo; f <= hi; f++) if (pcs.indexOf(T.mod12(open + f)) >= 0) o.push(f);
        opts2.push(o);
      }
      var cur = new Array(n);
      (function rec(si) {
        if (si === n) { evaluate(cur.slice()); return; }
        for (var k = 0; k < opts2[si].length; k++) { cur[si] = opts2[si][k]; rec(si + 1); }
      })(0);
    }

    function evaluate(fr) {
      var played = [], has = {}, sounding = [];
      for (var s = 0; s < n; s++) if (fr[s] >= 0) { played.push(s); var m = tuning[s] + fr[s]; sounding.push(m); has[T.mod12(m)] = 1; }
      var minPlayed = n <= 4 ? Math.min(3, n) : Math.min(4, n);
      if (ch.intervals.length <= 2) minPlayed = 2;
      if (played.length < minPlayed) return;
      for (var e = 0; e < ess.length; e++) if (!has[ess[e]]) return;
      if (ch.bass && !has[bassPc]) return;
      var fretted = fr.filter(function (f) { return f > 0; });
      var minF = fretted.length ? Math.min.apply(null, fretted) : 0, maxF = fretted.length ? Math.max.apply(null, fretted) : 0;
      if (maxF - minF > span) return;
      /* nota mais grave deve ser a fundamental (ou o baixo indicado) */
      var lowest = Math.min.apply(null, sounding);
      if (!opts.reentrant && T.mod12(lowest) !== bassPc) return;
      if (opts.reentrant && ch.bass && T.mod12(lowest) !== bassPc) return;
      /* cordas abafadas no meio: só uma, e só em instrumentos de 6+ cordas */
      var firstP = played[0], lastP = played[played.length - 1], inner = 0;
      for (var s2 = firstP; s2 <= lastP; s2++) if (fr[s2] < 0) inner++;
      if (inner > (n >= 6 ? 1 : 0)) return;
      if (n <= 5 && lastP !== n - 1) return;
      if (n >= 6 && lastP < n - 2) return;
      var fg = fingersFor(fr);
      if (fg.count > 4) return;
      var id = fr.join(",");
      if (seen[id]) return;
      seen[id] = 1;
      /* pontuação: menor = melhor */
      var score = 0, opens = 0, innerOpen = 0, lowFr = -1;
      for (var s4 = 0; s4 < n; s4++) {
        if (fr[s4] === 0) { opens++; if (lowFr >= 0 && minF >= 1) { for (var s5 = s4 + 1; s5 < n; s5++) if (fr[s5] > 0) { innerOpen++; break; } } }
        if (fr[s4] > 0 && lowFr < 0) lowFr = s4;
      }
      score += minF * 1.4;
      score += (maxF - minF) * 1.2;
      score += fg.count * 0.9;
      score += (n - played.length) * 1.1;
      score += inner * 3 + innerOpen * 1.3;
      if (opens && maxF >= 5) score += (maxF - 4) * 1.6;
      if (fg.barre) score += (fg.barre.to - fg.barre.from >= 4 ? 0.4 : 1.6);
      if (opens && maxF <= 3) score -= 2;
      if (ch.intervals.length === 3 && !has[T.mod12(ch.rootPc + ch.intervals[2])]) score += 2.5;
      results.push({ frets: fr, fingers: fg.fingers, barre: fg.barre, score: score, base: minF });
    }

    results.sort(function (a, b) { return a.score - b.score; });
    if (opts.std) {
      var os = openShape(ch);
      if (os) {
        var oid = os.join(","), fgo = fingersFor(os);
        results = results.filter(function (r) { return r.frets.join(",") !== oid; });
        var fo = os.filter(function (f) { return f > 0; });
        results.unshift({ frets: os, fingers: fgo.fingers, barre: fgo.barre, score: -99, base: fo.length ? Math.min.apply(null, fo) : 0 });
      }
    }
    /* escolhe variações em regiões diferentes do braço */
    var out = [], regions = {};
    for (var i = 0; i < results.length && out.length < (opts.max || 8); i++) {
      var r = results[i], reg = Math.floor(Math.max(0, r.base - 1) / 2);
      if ((regions[reg] || 0) >= 2) continue;
      regions[reg] = (regions[reg] || 0) + 1;
      out.push(r);
    }
    out.sort(function (a, b) { return a.base - b.base || a.score - b.score; });
    /* a melhor fica sempre em primeiro */
    if (results.length) {
      var best = results[0];
      out = [best].concat(out.filter(function (x) { return x !== best; }));
    }
    return (cache[key] = out);
  }

  /* digitações para o instrumento atual */
  function forInstrument(chordName, inst, max) {
    inst = inst || OM.inst.current();
    if (inst.kind !== "string") return [];
    var t = OM.inst.tuningOf(inst);
    if (!t) return [];
    var tm = OM.inst.tuningMidi(t);
    return generate(chordName, tm, { std: tm.join(",") === "40,45,50,55,59,64", reentrant: OM.inst.isReentrant(inst, t), max: max || 8, maxFret: Math.min(15, inst.frets || 15) });
  }

  OM.voicings = { generate: generate, forInstrument: forInstrument };
})(window.OM);
