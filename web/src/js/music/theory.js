/* O Músico — teoria musical: notas, frequências, acordes, escalas, transposição */
(function (OM) {
  "use strict";
  var SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  var FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  var SOLF = { C: "Dó", D: "Ré", E: "Mi", F: "Fá", G: "Sol", A: "Lá", B: "Si" };
  var LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function mod12(n) { return ((n % 12) + 12) % 12; }

  /* "C#", "Db", "Bb" -> classe de altura 0..11 */
  function pc(name) {
    var m = /^([A-Ga-g])([#b♯♭]*)/.exec(name || "");
    if (!m) return -1;
    var v = LETTER_PC[m[1].toUpperCase()];
    for (var i = 0; i < m[2].length; i++) v += (m[2][i] === "#" || m[2][i] === "♯") ? 1 : -1;
    return mod12(v);
  }
  function settingsNotation() { try { return OM.store.settings().notation; } catch (e) { return "letters"; } }
  /* nome para exibição respeitando a notação escolhida (C D E… ou Dó Ré Mi…) */
  function display(name, notation) {
    notation = notation || settingsNotation();
    if (notation !== "solfege" || !name) return name.replace("#", "♯").replace(/([A-G])b/, "$1♭");
    return name.replace(/^([A-G])([#b]?)/, function (_, l, a) { return SOLF[l] + (a === "#" ? "♯" : a === "b" ? "♭" : ""); });
  }
  function name(p, flats) { return (flats ? FLAT : SHARP)[mod12(p)]; }

  /* ---------- frequência ---------- */
  function a4() { try { return OM.store.settings().a4 || 440; } catch (e) { return 440; } }
  function midiToFreq(m, ref) { return (ref || a4()) * Math.pow(2, (m - 69) / 12); }
  function freqToMidi(f, ref) { return 69 + 12 * Math.log2(f / (ref || a4())); }
  function midiName(m, flats) { return name(m, flats) + (Math.floor(m / 12) - 1); }
  /* "E2", "F#3", "Bb1" -> número MIDI */
  function parseNote(s) {
    var m = /^([A-Ga-g][#b]?)(-?\d)$/.exec(String(s).trim());
    if (!m) return null;
    var p = pc(m[1]);
    var oct = parseInt(m[2], 10);
    var base = LETTER_PC[m[1][0].toUpperCase()];
    var acc = p - base; if (acc > 6) acc -= 12; if (acc < -6) acc += 12;
    return (oct + 1) * 12 + base + acc;
  }

  /* ---------- acordes ---------- */
  /* converte a parte após a fundamental ("m7(9)", "7M", "°", "7/4", "sus2", "6/9"…) em intervalos */
  function chordIntervals(suffix) {
    var s = String(suffix || "").replace(/\s+/g, "").replace(/♭/g, "b").replace(/♯/g, "#");
    var third = 4, fifth = 7, ext = {}, sev = 0, dim = false;
    var m;
    if ((m = /^(maj|M|Δ)(?=\d|$)/.exec(s)) && m[1] !== "") {
      s = s.slice(m[1].length); sev = 11; ext[11] = 1;
      if (s[0] === "7") s = s.slice(1);
    } else if ((m = /^(min|mi|m|-)(?!aj)/.exec(s))) { third = 3; s = s.slice(m[1].length); }
    if ((m = /^(dim|°|º|o)/.exec(s))) { third = 3; fifth = 6; dim = true; s = s.slice(m[1].length); }
    else if ((m = /^(ø)/.exec(s))) { third = 3; fifth = 6; ext[10] = 1; s = s.slice(1); }
    else if ((m = /^(aug|\+)(?!\d)/.exec(s)) || (m = /^(aug)/.exec(s))) { fifth = 8; s = s.slice(m[1].length); }
    if (/^5$/.test(s)) return [0, 7];
    var paren = false, i = 0, guard = 0;
    while (i < s.length && guard++ < 60) {
      var r = s.slice(i), t;
      if (r[0] === "(") { paren = true; i++; continue; }
      if (r[0] === ")") { paren = false; i++; continue; }
      if (r[0] === "," || r[0] === "/" || r[0] === "." ) { i++; continue; }
      if ((t = /^(7M|M7|maj7|Δ7|7\+(?!5)|maj)/.exec(r))) { ext[11] = 1; sev = 11; i += t[0].length; continue; }
      if ((t = /^(maj9|M9|7M9)/.exec(r))) { ext[11] = 1; ext[14] = 1; sev = 11; i += t[0].length; continue; }
      if ((t = /^(sus2|sus4|sus)/.exec(r))) { third = t[0] === "sus2" ? 2 : 5; i += t[0].length; continue; }
      if ((t = /^add(\d+)/.exec(r))) { var a = +t[1]; ext[a === 2 ? 14 : a === 4 ? 17 : a === 9 ? 14 : a === 11 ? 17 : a === 13 ? 21 : 14] = 1; i += t[0].length; continue; }
      if ((t = /^(b|-)(5|9|13|6)/.exec(r))) {
        var n = +t[2]; if (n === 5) fifth = 6; else if (n === 9) ext[13] = 1; else ext[20] = 1; i += t[0].length; continue;
      }
      if ((t = /^(#|\+)(5|9|11|4)/.exec(r))) {
        var n2 = +t[2]; if (n2 === 5) fifth = 8; else if (n2 === 9) ext[15] = 1; else ext[18] = 1; i += t[0].length; continue;
      }
      if ((t = /^alt/.exec(r))) { ext[10] = 1; ext[13] = 1; ext[15] = 1; i += 3; continue; }
      if ((t = /^(\d+)/.exec(r))) {
        var d = +t[1]; i += t[1].length;
        if (d === 69) { ext[9] = 1; ext[14] = 1; continue; }
        if (d === 6) { ext[9] = 1; continue; }
        if (d === 7) { if (dim) ext[9] = 1; else if (!ext[11]) { ext[10] = 1; sev = 10; } continue; }
        if (d === 2) { if (paren) ext[14] = 1; else third = 2; continue; }
        if (d === 4) { if (paren) ext[17] = 1; else third = 5; continue; }
        if (d === 9) { if (!paren && !sev && !ext[9]) { ext[10] = 1; sev = 10; } ext[14] = 1; continue; }
        if (d === 11) { if (!paren && !sev) { ext[10] = 1; sev = 10; ext[14] = 1; } ext[17] = 1; continue; }
        if (d === 13) { if (!paren && !sev) { ext[10] = 1; sev = 10; ext[14] = 1; } ext[21] = 1; continue; }
        continue;
      }
      i++;
    }
    var out = [0];
    if (third != null) out.push(third);
    out.push(fifth);
    Object.keys(ext).forEach(function (k) { out.push(+k); });
    return out.filter(function (v, j, a) { return a.indexOf(v) === j; }).sort(function (a, b) { return a - b; });
  }

  var CHORD_RE = /^([A-G][#b♯♭]?)((?:[^/\s]|\/(?=\d))*)(?:\/([A-G][#b♯♭]?))?$/;
  /* "F#m7(b5)/E" -> {root, suffix, bass, pcs} */
  function parseChord(str) {
    var s = String(str || "").trim();
    var m = CHORD_RE.exec(s);
    if (!m) return null;
    var suf = m[2] || "";
    if (suf) {
      var rest = suf.replace(/maj|min|dim|aug|sus|add|alt|mi|m|M|o|Δ|ø|°|º/g, "");
      if (!/^[\d()+\-#b♭♯,.\/]*$/.test(rest)) return null;
    }
    var root = m[1].replace("♯", "#").replace("♭", "b");
    var ints = chordIntervals(suf);
    var r = pc(root);
    return {
      root: root, suffix: suf, bass: m[3] ? m[3].replace("♯", "#").replace("♭", "b") : null,
      rootPc: r, bassPc: m[3] ? pc(m[3]) : r, intervals: ints,
      pcs: ints.map(function (x) { return mod12(r + x); }).filter(function (v, j, a) { return a.indexOf(v) === j; })
    };
  }
  function isChord(tok) {
    if (!tok) return false;
    tok = tok.replace(/^\(|\)$/g, "");
    if (/^N\.?C\.?$/i.test(tok) || tok === "%" || tok === "|" || tok === "||" || /^x\d+$/i.test(tok)) return true;
    return !!parseChord(tok);
  }

  var FLAT_KEYS = { F: 1, Bb: 1, Eb: 1, Ab: 1, Db: 1, Gb: 1, Dm: 1, Gm: 1, Cm: 1, Fm: 1, Bbm: 1, Ebm: 1 };
  function keyUsesFlats(key) {
    if (!key) return false;
    var k = parseChord(key); if (!k) return /b/.test(key);
    if (k.root.indexOf("#") > 0) return false;
    if (k.root.indexOf("b") > 0) return true;
    var minor = /^m(?!aj)/.test(k.suffix);
    var nm = (minor ? FLAT : SHARP)[k.rootPc];
    var fl = FLAT[k.rootPc] + (minor ? "m" : "");
    if (FLAT_KEYS[fl]) return true;
    if (k.root.indexOf("b") > 0) return true;
    return !!FLAT_KEYS[nm + (minor ? "m" : "")];
  }
  function transposeNote(n, semi, flats) { var p = pc(n); return p < 0 ? n : name(p + semi, flats); }
  function transposeChord(ch, semi, flats) {
    if (!semi) return ch;
    var m = /^(\(?)([A-G][#b♯♭]?)([^/]*?)(?:\/([A-G][#b♯♭]?))?(\)?)$/.exec(ch);
    if (!m) return ch;
    return m[1] + transposeNote(m[2], semi, flats) + m[3] + (m[4] ? "/" + transposeNote(m[4], semi, flats) : "") + m[5];
  }
  function transposeKey(key, semi) {
    if (!key) return key;
    var k = parseChord(key); if (!k) return key;
    var minor = /^m(?!aj)/.test(k.suffix);
    var p = mod12(k.rootPc + semi);
    var sharpName = SHARP[p] + (minor ? "m" : ""), flatName = FLAT[p] + (minor ? "m" : "");
    if (FLAT_KEYS[flatName]) return flatName;
    if (sharpName.indexOf("#") > 0 && !minor && (p === 1 || p === 3 || p === 8 || p === 10)) return flatName;
    return sharpName;
  }

  /* ---------- tipos de acorde (catálogo e gerador) ---------- */
  var CHORD_TYPES = [
    { id: "", n: "Maior", cat: "maior" }, { id: "m", n: "Menor", cat: "menor" },
    { id: "7", n: "Sétima (dominante)", cat: "setima" }, { id: "7M", n: "Sétima maior", cat: "setima" },
    { id: "m7", n: "Menor com sétima", cat: "setima" }, { id: "m7M", n: "Menor com sétima maior", cat: "setima" },
    { id: "°", n: "Diminuto", cat: "dim" }, { id: "°7", n: "Diminuto com sétima", cat: "dim" },
    { id: "m7(b5)", n: "Meio-diminuto", cat: "dim" }, { id: "aug", n: "Aumentado", cat: "aug" },
    { id: "7(#5)", n: "Sétima com 5ª aumentada", cat: "aug" },
    { id: "sus2", n: "Suspenso 2", cat: "sus" }, { id: "sus4", n: "Suspenso 4", cat: "sus" }, { id: "7sus4", n: "Sétima suspenso 4 (7/4)", cat: "sus" },
    { id: "6", n: "Sexta", cat: "ext" }, { id: "m6", n: "Menor com sexta", cat: "ext" }, { id: "6(9)", n: "Sexta e nona", cat: "ext" },
    { id: "add9", n: "Com nona adicionada", cat: "ext" }, { id: "madd9", n: "Menor com nona adicionada", cat: "ext" },
    { id: "9", n: "Nona (dominante)", cat: "ext" }, { id: "7M(9)", n: "Sétima maior com nona", cat: "ext" }, { id: "m7(9)", n: "Menor com sétima e nona", cat: "ext" },
    { id: "7(b9)", n: "Sétima com nona menor", cat: "ext" }, { id: "7(#9)", n: "Sétima com nona aumentada", cat: "ext" },
    { id: "11", n: "Décima primeira", cat: "ext" }, { id: "m7(11)", n: "Menor com sétima e 11ª", cat: "ext" },
    { id: "13", n: "Décima terceira", cat: "ext" }, { id: "7(13)", n: "Sétima com 13ª", cat: "ext" }, { id: "5", n: "Power chord (quinta)", cat: "maior" }
  ];
  var CHORD_CATS = [{ id: "all", n: "Todos" }, { id: "maior", n: "Maiores" }, { id: "menor", n: "Menores" }, { id: "setima", n: "Com sétima" },
    { id: "dim", n: "Diminutos" }, { id: "aug", n: "Aumentados" }, { id: "sus", n: "Suspensos" }, { id: "ext", n: "Extensões" }];
  var INT_NAMES = { 0: "T", 1: "b9", 2: "9", 3: "3m", 4: "3M", 5: "4J", 6: "5dim", 7: "5J", 8: "5aum", 9: "6M", 10: "7m", 11: "7M", 13: "b9", 14: "9", 15: "#9", 17: "11", 18: "#11", 20: "b13", 21: "13" };
  function intervalLabel(i, ints) {
    if (i === 2 && ints && ints.indexOf(3) < 0 && ints.indexOf(4) < 0) return "2";
    if (i === 9 && ints && ints.indexOf(6) >= 0 && ints.indexOf(3) >= 0 && ints.indexOf(10) < 0 && ints.indexOf(11) < 0) return "7dim";
    return INT_NAMES[i] || String(i);
  }

  /* ---------- escalas ---------- */
  var SCALES = [
    { id: "major", n: "Maior (jônio)", i: [0, 2, 4, 5, 7, 9, 11] },
    { id: "minor", n: "Menor natural (eólio)", i: [0, 2, 3, 5, 7, 8, 10] },
    { id: "harmonic", n: "Menor harmônica", i: [0, 2, 3, 5, 7, 8, 11] },
    { id: "melodic", n: "Menor melódica", i: [0, 2, 3, 5, 7, 9, 11] },
    { id: "pentmaj", n: "Pentatônica maior", i: [0, 2, 4, 7, 9] },
    { id: "pentmin", n: "Pentatônica menor", i: [0, 3, 5, 7, 10] },
    { id: "blues", n: "Blues", i: [0, 3, 5, 6, 7, 10] },
    { id: "dorian", n: "Dórico", i: [0, 2, 3, 5, 7, 9, 10] },
    { id: "phrygian", n: "Frígio", i: [0, 1, 3, 5, 7, 8, 10] },
    { id: "lydian", n: "Lídio", i: [0, 2, 4, 6, 7, 9, 11] },
    { id: "mixolydian", n: "Mixolídio", i: [0, 2, 4, 5, 7, 9, 10] },
    { id: "locrian", n: "Lócrio", i: [0, 1, 3, 5, 6, 8, 10] },
    { id: "chromatic", n: "Cromática", i: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { id: "wholetone", n: "Tons inteiros", i: [0, 2, 4, 6, 8, 10] },
    { id: "dimhw", n: "Diminuta (semitom-tom)", i: [0, 1, 3, 4, 6, 7, 9, 10] },
    { id: "nordestina", n: "Nordestina (mixolídio #4)", i: [0, 2, 4, 6, 7, 9, 10] }
  ];
  var SCALE_INT = ["T", "2m", "2M", "3m", "3M", "4J", "4aum", "5J", "6m", "6M", "7m", "7M"];
  /* nomes das notas de uma escala com grafia correta (cada letra uma vez, quando heptatônica) */
  function spellScale(rootName, ints) {
    var r = pc(rootName);
    if (ints.length !== 7) {
      var flats = rootName.indexOf("b") > 0 || (rootName === "F" && ints.indexOf(3) < 0) || ints.indexOf(3) >= 0 && /^(C|F|G|D|Bb|Eb|Ab)$/.test(rootName) && rootName !== "D" && rootName !== "G";
      return ints.map(function (i) { return name(r + i, flats); });
    }
    var letters = ["C", "D", "E", "F", "G", "A", "B"];
    var li = letters.indexOf(rootName[0]);
    return ints.map(function (iv, k) {
      var L = letters[(li + k) % 7], target = mod12(r + iv), base = LETTER_PC[L];
      var d = mod12(target - base); if (d > 6) d -= 12;
      if (Math.abs(d) > 2) return name(target, false);
      return L + (d > 0 ? "#".repeat(d) : "b".repeat(-d));
    });
  }
  /* campo harmônico (tríades e tétrades) */
  function harmonicField(rootName, ints) {
    if (ints.length !== 7) return [];
    var notes = spellScale(rootName, ints), r = pc(rootName), roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
    var out = [];
    for (var k = 0; k < 7; k++) {
      var a = ints[k], b = ints[(k + 2) % 7] + (k + 2 >= 7 ? 12 : 0), c = ints[(k + 4) % 7] + (k + 4 >= 7 ? 12 : 0), d = ints[(k + 6) % 7] + (k + 6 >= 7 ? 12 : 0);
      var t3 = b - a, t5 = c - a, t7 = d - a, suf, suf7;
      if (t3 === 4 && t5 === 7) suf = ""; else if (t3 === 3 && t5 === 7) suf = "m"; else if (t3 === 3 && t5 === 6) suf = "°"; else if (t3 === 4 && t5 === 8) suf = "aug"; else suf = "?";
      if (suf === "") suf7 = t7 === 11 ? "7M" : "7"; else if (suf === "m") suf7 = t7 === 10 ? "m7" : "m7M"; else if (suf === "°") suf7 = t7 === 10 ? "m7(b5)" : "°7"; else suf7 = t7 === 11 ? "7M(#5)" : "7(#5)";
      var rn = roman[k]; if (suf === "m" || suf === "°") rn = rn.toLowerCase(); if (suf === "°") rn += "°";
      out.push({ degree: rn, triad: notes[k] + suf, tetrad: notes[k] + suf7, pc: mod12(r + a) });
    }
    return out;
  }

  /* ---------- intervalos (percepção) ---------- */
  var INTERVALS = [
    { s: 1, n: "2ª menor" }, { s: 2, n: "2ª maior" }, { s: 3, n: "3ª menor" }, { s: 4, n: "3ª maior" }, { s: 5, n: "4ª justa" },
    { s: 6, n: "Trítono" }, { s: 7, n: "5ª justa" }, { s: 8, n: "6ª menor" }, { s: 9, n: "6ª maior" }, { s: 10, n: "7ª menor" },
    { s: 11, n: "7ª maior" }, { s: 12, n: "Oitava" }
  ];

  var TEMPO_NAMES = [[40, "Grave"], [60, "Largo"], [66, "Larghetto"], [76, "Adagio"], [108, "Andante"], [120, "Moderato"], [156, "Allegro"], [176, "Vivace"], [200, "Presto"], [999, "Prestissimo"]];
  function tempoName(bpm) { for (var i = 0; i < TEMPO_NAMES.length; i++) if (bpm < TEMPO_NAMES[i][0]) return TEMPO_NAMES[i][1]; return "Prestissimo"; }

  var KEYS = ["C", "C#", "Db", "D", "Eb", "E", "F", "F#", "Gb", "G", "Ab", "A", "Bb", "B"];
  var ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

  OM.theory = {
    SHARP: SHARP, FLAT: FLAT, ROOTS: ROOTS, KEYS: KEYS, CHORD_TYPES: CHORD_TYPES, CHORD_CATS: CHORD_CATS, SCALES: SCALES, SCALE_INT: SCALE_INT,
    INTERVALS: INTERVALS, mod12: mod12, pc: pc, name: name, display: display, midiToFreq: midiToFreq, freqToMidi: freqToMidi, midiName: midiName,
    parseNote: parseNote, chordIntervals: chordIntervals, parseChord: parseChord, isChord: isChord, keyUsesFlats: keyUsesFlats,
    transposeChord: transposeChord, transposeKey: transposeKey, transposeNote: transposeNote, intervalLabel: intervalLabel,
    spellScale: spellScale, harmonicField: harmonicField, tempoName: tempoName, a4: a4
  };
})(window.OM);
