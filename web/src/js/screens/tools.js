/* O Músico — aba Ferramentas */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui;
  var TOOLS = [
    { id: "tuner", n: "Afinador", d: "Cromático e por instrumento, via microfone", icon: "tuner" },
    { id: "metronome", n: "Metrônomo", d: "Compassos, acentos, subdivisões, tap tempo", icon: "metro" },
    { id: "chords", n: "Biblioteca de acordes", d: "Diagramas para cordas e teclado", icon: "grid" },
    { id: "chordgen", n: "Gerador de acordes", d: "Monte, ouça e identifique acordes", icon: "piano" },
    { id: "scales", n: "Gerador de escalas", d: "Escalas no braço e no teclado, campo harmônico", icon: "scale" },
    { id: "transposer", n: "Transpositor de tons", d: "Transponha cifras e calcule o capotraste", icon: "transpose" },
    { id: "noteid", n: "Identificador de notas", d: "Mostra a nota tocada ou cantada", icon: "target" },
    { id: "bpmcalc", n: "Calculadora de BPM", d: "Tap tempo, delays, duração de música", icon: "clock" },
    { id: "recorder", n: "Gravador de ideias", d: "Grave riffs e melodias no aparelho", icon: "mic" },
    { id: "ear", n: "Percepção auditiva", d: "Intervalos, acordes e notas de ouvido", icon: "ear" },
    { id: "grooves", n: "Bateria e grooves", d: "Ritmos para praticar com banda", icon: "drum" },
    { id: "dictionary", n: "Dicionário musical", d: "Termos e conceitos explicados", icon: "book" }
  ];
  OM.TOOLS = TOOLS;

  OM.screen("ferramentas", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Ferramentas" });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var g = h("div.grid2", { style: { marginTop: "6px" } });
    TOOLS.forEach(function (t) {
      g.appendChild(h("button.tile", { onclick: function () { OM.router.push(t.id); } }, h("span.ti", { html: OM.icon(t.icon) }), h("div", h("b", { text: t.n }), h("small", { text: t.d }))));
    });
    content.appendChild(g);
    content.appendChild(ui.sec("Aprendizagem"));
    content.appendChild(h("div.list", ui.item({ icon: "learn", iconCls: "acc", title: "Exercícios progressivos", sub: "Acordes, notas, escalas, ritmo, percepção e leitura", onClick: function () { OM.router.push("learn"); } }),
      ui.item({ icon: OM.inst.icon(OM.inst.current()), iconCls: "acc", title: "Instrumentos e afinações", sub: OM.inst.current().n, onClick: function () { OM.router.push("instruments"); } })));
    return { el: el };
  });
})(window.OM);
