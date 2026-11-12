/* O Músico — instrumentos, afinações e transposição */
(function (OM) {
  "use strict";
  /* kind: string (trastes), bowed (sem trastes), keys (teclas), drums, wind (sopro)
     tunings: notas da corda mais grave para a mais aguda */
  var GUITAR_TUNINGS = [
    { id: "std", n: "Padrão (E A D G B E)", s: ["E2", "A2", "D3", "G3", "B3", "E4"] },
    { id: "half", n: "Meio tom abaixo (Eb)", s: ["Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"] },
    { id: "whole", n: "Um tom abaixo (D)", s: ["D2", "G2", "C3", "F3", "A3", "D4"] },
    { id: "dropd", n: "Drop D", s: ["D2", "A2", "D3", "G3", "B3", "E4"] },
    { id: "dropc", n: "Drop C", s: ["C2", "G2", "C3", "F3", "A3", "D4"] },
    { id: "dadgad", n: "DADGAD", s: ["D2", "A2", "D3", "G3", "A3", "D4"] },
    { id: "openg", n: "Open G", s: ["D2", "G2", "D3", "G3", "B3", "D4"] },
    { id: "opend", n: "Open D", s: ["D2", "A2", "D3", "F#3", "A3", "D4"] },
    { id: "opene", n: "Open E", s: ["E2", "B2", "E3", "G#3", "B3", "E4"] },
    { id: "openc", n: "Open C", s: ["C2", "G2", "C3", "G3", "C4", "E4"] }
  ];
  var LIST = [
    { id: "violao", n: "Violão", kind: "string", frets: 19, tunings: GUITAR_TUNINGS },
    { id: "guitarra", n: "Guitarra 6 cordas", kind: "string", frets: 22, tunings: GUITAR_TUNINGS },
    { id: "guitarra7", n: "Guitarra 7 cordas", kind: "string", frets: 24, tunings: [
      { id: "std", n: "Padrão (B E A D G B E)", s: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"] },
      { id: "dropa", n: "Drop A", s: ["A1", "E2", "A2", "D3", "G3", "B3", "E4"] },
      { id: "half", n: "Meio tom abaixo", s: ["Bb1", "Eb2", "Ab2", "Db3", "Gb3", "Bb3", "Eb4"] }] },
    { id: "violao7", n: "Violão 7 cordas", kind: "string", frets: 19, tunings: [
      { id: "c", n: "Sétima em Dó (C)", s: ["C2", "E2", "A2", "D3", "G3", "B3", "E4"] },
      { id: "b", n: "Sétima em Si (B)", s: ["B1", "E2", "A2", "D3", "G3", "B3", "E4"] }] },
    { id: "baixo4", n: "Baixo 4 cordas", kind: "string", frets: 20, bass: true, tunings: [
      { id: "std", n: "Padrão (E A D G)", s: ["E1", "A1", "D2", "G2"] },
      { id: "dropd", n: "Drop D", s: ["D1", "A1", "D2", "G2"] },
      { id: "half", n: "Meio tom abaixo", s: ["Eb1", "Ab1", "Db2", "Gb2"] },
      { id: "bead", n: "B E A D", s: ["B0", "E1", "A1", "D2"] }] },
    { id: "baixo5", n: "Baixo 5 cordas", kind: "string", frets: 24, bass: true, tunings: [
      { id: "std", n: "Padrão (B E A D G)", s: ["B0", "E1", "A1", "D2", "G2"] },
      { id: "high", n: "Com Dó agudo (E A D G C)", s: ["E1", "A1", "D2", "G2", "C3"] }] },
    { id: "baixo6", n: "Baixo 6 cordas", kind: "string", frets: 24, bass: true, tunings: [
      { id: "std", n: "Padrão (B E A D G C)", s: ["B0", "E1", "A1", "D2", "G2", "C3"] }] },
    { id: "ukulele", n: "Ukulele", kind: "string", frets: 15, reentrant: true, tunings: [
      { id: "std", n: "Padrão (G C E A)", s: ["G4", "C4", "E4", "A4"] },
      { id: "lowg", n: "Low G", s: ["G3", "C4", "E4", "A4"], reentrant: false },
      { id: "d", n: "Em Ré (A D F# B)", s: ["A4", "D4", "F#4", "B4"] },
      { id: "bari", n: "Barítono (D G B E)", s: ["D3", "G3", "B3", "E4"], reentrant: false }] },
    { id: "viola", n: "Viola caipira", kind: "string", frets: 17, courses: true, tunings: [
      { id: "cebolaoe", n: "Cebolão em Mi", s: ["B2", "E3", "G#3", "B3", "E4"] },
      { id: "cebolaod", n: "Cebolão em Ré", s: ["A2", "D3", "F#3", "A3", "D4"] },
      { id: "rioabaixo", n: "Rio Abaixo (Sol)", s: ["G2", "D3", "G3", "B3", "D4"] },
      { id: "natural", n: "Natural (Lá)", s: ["A2", "D3", "G3", "B3", "E4"] },
      { id: "boiadeira", n: "Boiadeira", s: ["A2", "D3", "G3", "C4", "E4"] }] },
    { id: "cavaco", n: "Cavaquinho", kind: "string", frets: 17, tunings: [
      { id: "std", n: "Padrão (D G B D)", s: ["D4", "G4", "B4", "D5"] },
      { id: "natural", n: "Natural (D G B E)", s: ["D4", "G4", "B4", "E5"] },
      { id: "cavaco_e", n: "Em Mi (E A C# E)", s: ["E4", "A4", "C#5", "E5"] }] },
    { id: "bandolim", n: "Bandolim", kind: "string", frets: 17, courses: true, tunings: [
      { id: "std", n: "Padrão (G D A E)", s: ["G3", "D4", "A4", "E5"] }] },
    { id: "banjo", n: "Banjo 5 cordas", kind: "string", frets: 22, reentrant: true, tunings: [
      { id: "openg", n: "Open G (g D G B D)", s: ["G4", "D3", "G3", "B3", "D4"] },
      { id: "dc", n: "Double C", s: ["G4", "C3", "G3", "C4", "D4"] }] },
    { id: "violino", n: "Violino", kind: "bowed", frets: 12, tunings: [{ id: "std", n: "Padrão (G D A E)", s: ["G3", "D4", "A4", "E5"] }] },
    { id: "violaorq", n: "Viola de arco", kind: "bowed", frets: 12, tunings: [{ id: "std", n: "Padrão (C G D A)", s: ["C3", "G3", "D4", "A4"] }] },
    { id: "violoncelo", n: "Violoncelo", kind: "bowed", frets: 12, tunings: [{ id: "std", n: "Padrão (C G D A)", s: ["C2", "G2", "D3", "A3"] }] },
    { id: "contrabaixo", n: "Contrabaixo acústico", kind: "bowed", frets: 12, bass: true, tunings: [{ id: "std", n: "Padrão (E A D G)", s: ["E1", "A1", "D2", "G2"] }] },
    { id: "teclado", n: "Teclado", kind: "keys" },
    { id: "piano", n: "Piano", kind: "keys" },
    { id: "bateria", n: "Bateria", kind: "drums" },
    /* sopros: transp = semitons entre a nota escrita e a nota real (concerto) */
    { id: "flauta", n: "Flauta transversal (Dó)", kind: "wind", transp: 0, range: ["C4", "C7"] },
    { id: "flautadoce", n: "Flauta doce soprano (Dó)", kind: "wind", transp: 12, range: ["C5", "D7"] },
    { id: "saxalto", n: "Sax alto (Mi♭)", kind: "wind", transp: -9, range: ["Db3", "A5"] },
    { id: "saxtenor", n: "Sax tenor (Si♭)", kind: "wind", transp: -14, range: ["Ab2", "E5"] },
    { id: "saxsoprano", n: "Sax soprano (Si♭)", kind: "wind", transp: -2, range: ["Ab3", "E6"] },
    { id: "trompete", n: "Trompete (Si♭)", kind: "wind", transp: -2, range: ["E3", "C6"] },
    { id: "clarinete", n: "Clarinete (Si♭)", kind: "wind", transp: -2, range: ["D3", "Bb6"] },
    { id: "trombone", n: "Trombone (Dó)", kind: "wind", transp: 0, range: ["E2", "F5"] },
    { id: "trompa", n: "Trompa (Fá)", kind: "wind", transp: -7, range: ["B1", "F5"] },
    { id: "gaita", n: "Gaita diatônica (Dó)", kind: "wind", transp: 0, range: ["C4", "C7"] },
    { id: "voz", n: "Voz", kind: "voice" }
  ];
  var GROUPS = [
    { n: "Cordas dedilhadas", ids: ["violao", "violao7", "guitarra", "guitarra7", "baixo4", "baixo5", "baixo6", "ukulele", "viola", "cavaco", "bandolim", "banjo"] },
    { n: "Cordas friccionadas", ids: ["violino", "violaorq", "violoncelo", "contrabaixo"] },
    { n: "Teclas", ids: ["teclado", "piano"] },
    { n: "Percussão", ids: ["bateria"] },
    { n: "Sopros", ids: ["flauta", "flautadoce", "saxalto", "saxtenor", "saxsoprano", "trompete", "clarinete", "trombone", "trompa", "gaita"] },
    { n: "Outros", ids: ["voz"] }
  ];

  function custom() { return OM.store.get("customInst", []); }
  function all() { return LIST.concat(custom()); }
  function get(id) {
    var a = all();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return LIST[0];
  }
  function current() { return get(OM.store.settings().instrument); }
  /* afinação escolhida para um instrumento (lembrada por instrumento) */
  function tuningOf(inst) {
    if (!inst.tunings || !inst.tunings.length) return null;
    var sel = OM.store.get("tuningSel", {})[inst.id];
    var t = inst.tunings.filter(function (x) { return x.id === sel; })[0] || inst.tunings[0];
    return t;
  }
  function setTuning(inst, tid) { OM.store.update("tuningSel", {}, function (m) { m[inst.id] = tid; }); }
  function tuningMidi(t) { return t.s.map(OM.theory.parseNote); }
  function hasStrings(inst) { return inst.kind === "string" || inst.kind === "bowed"; }
  function isReentrant(inst, t) { return t && t.reentrant != null ? t.reentrant : !!inst.reentrant; }
  /* instrumento usado para diagramas de acordes (sopros/voz/bateria não têm diagramas) */
  function chordView(inst) {
    if (inst.kind === "string") return "fret";
    if (inst.kind === "keys") return "piano";
    return "notes";
  }
  function icon(inst) {
    return { keys: "piano", drums: "drum", wind: "wind", voice: "mic", bowed: "violin" }[inst.kind] || "guitar";
  }
  function saveCustom(o) {
    OM.store.update("customInst", [], function (a) {
      var i = a.findIndex(function (x) { return x.id === o.id; });
      if (i >= 0) a[i] = o; else a.push(o);
    });
  }
  function removeCustom(id) {
    OM.store.update("customInst", [], function (a) { return a.filter(function (x) { return x.id !== id; }); });
  }

  OM.inst = { LIST: LIST, GROUPS: GROUPS, all: all, get: get, current: current, tuningOf: tuningOf, setTuning: setTuning, tuningMidi: tuningMidi,
    hasStrings: hasStrings, isReentrant: isReentrant, chordView: chordView, icon: icon, custom: custom, saveCustom: saveCustom, removeCustom: removeCustom };
})(window.OM);
