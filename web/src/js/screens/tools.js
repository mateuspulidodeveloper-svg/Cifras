/* O Músico — aba Ferramentas: essenciais em destaque e o resto agrupado por categoria */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui;
  var ESSENTIAL = [
    { id: "tuner", n: "Afinador", icon: "tuner" },
    { id: "metronome", n: "Metrônomo", icon: "metro" },
    { id: "batidas", n: "Batidas", icon: "pulse" }
  ];
  var GROUPS = [
    { n: "Acordes e escalas", items: [
      { id: "chords", n: "Biblioteca de acordes", d: "Diagramas para cordas e teclado", icon: "grid" },
      { id: "chordgen", n: "Gerador e identificador de acordes", d: "Monte um acorde ou descubra pelas notas", icon: "piano" },
      { id: "fretmap", n: "Mapa do braço / teclado", d: "Notas, intervalos, escalas e acordes", icon: "guitar" },
      { id: "scales", n: "Escalas e campo harmônico", d: "No braço, no teclado e de ouvido", icon: "scale" },
      { id: "transposer", n: "Transpositor e capotraste", d: "Mude o tom de qualquer cifra", icon: "transpose" }] },
    { n: "Ritmo", items: [
      { id: "grooves", n: "Bateria e grooves", d: "30 ritmos editáveis para tocar junto", icon: "drum" },
      { id: "bpmcalc", n: "Calculadora de BPM", d: "Tap tempo, detecção pelo microfone, delays", icon: "clock" }] },
    { n: "Áudio e ouvido", items: [
      { id: "noteid", n: "Identificador de notas", d: "Mostra a nota que você toca ou canta", icon: "target" },
      { id: "recorder", n: "Gravador de ideias", d: "Grave riffs, melodias e ensaios", icon: "mic" },
      { id: "ear", n: "Percepção auditiva", d: "Intervalos, acordes e notas de ouvido", icon: "ear" }] },
    { n: "Músicas e consulta", items: [
      { id: "transfer", n: "Importar / exportar músicas", d: "Arquivos JSON e guia para IA", icon: "upload" },
      { id: "dictionary", n: "Dicionário musical", d: "Termos e conceitos explicados", icon: "book" },
      { id: "instruments", n: "Instrumentos e afinações", d: "Afinações alternativas e personalizados", icon: "settings" }] }
  ];
  OM.TOOLS = ESSENTIAL.concat.apply(ESSENTIAL, GROUPS.map(function (g) { return g.items; }));

  OM.screen("ferramentas", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Ferramentas" });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var q = function (t) { return h("button.qa.big", { onclick: function () { OM.router.push(t.id); } }, h("span", { html: OM.icon(t.icon) }), h("small", { text: t.n })); };
    content.appendChild(h("div.qrow", { style: { gridTemplateColumns: "repeat(3,1fr)", marginTop: "4px" } }, ESSENTIAL.map(q)));
    content.appendChild(h("button.card.hero", { onclick: function () { OM.router.tab("aprender"); } }, h("span.hi", { html: OM.icon("learn") }),
      h("div", { style: { flex: 1, minWidth: 0 } }, h("small", { text: "Aprender" }), h("b", { text: "Cursos, exercícios e guias" })), h("span", { html: OM.icon("chev"), style: { width: "20px" } })));
    GROUPS.forEach(function (g) {
      content.appendChild(h("div.lbl", { text: g.n }));
      content.appendChild(h("div.list", g.items.map(function (t) { return ui.item({ icon: t.icon, iconCls: "acc", title: t.n, sub: t.d, onClick: function () { OM.router.push(t.id); } }); })));
    });
    return { el: el };
  });
})(window.OM);
