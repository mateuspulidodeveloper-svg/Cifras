/* O Músico — inicialização */
(function (OM) {
  "use strict";
  var h = OM.u.h;

  function metPill(app) {
    var dot = h("span.dot"), lbl = h("span.num"), pill = h("div.metpill.hidden", { onclick: function () { OM.router.push("metronome"); } }, dot, lbl,
      h("button", { html: OM.icon("stop"), "aria-label": "Parar metrônomo", onclick: function (e) { e.stopPropagation(); OM.metro.stop(); } }));
    app.appendChild(pill);
    var depth = 0, onMet = false, started = 0;
    function sync() {
      pill.classList.toggle("hidden", !OM.metro.S.running || onMet);
      pill.classList.toggle("lifted", depth > 0);
      lbl.textContent = OM.metro.S.bpm + " BPM";
    }
    document.addEventListener("om:nav", function (e) { depth = e.detail.depth; onMet = e.detail.name === "metronome" || e.detail.name === "song"; sync(); });
    OM.metro.on(function (ev, d) {
      if (ev === "beat") { dot.classList.add("beat"); setTimeout(function () { dot.classList.remove("beat"); }, 90); }
      if (ev === "state") {
        /* registra sessões de metrônomo de 1 min ou mais no histórico */
        if (d) started = Date.now();
        else if (started) {
          var min = (Date.now() - started) / 60000; started = 0;
          if (min >= 1) OM.lib.log({ type: "tool", icon: "metro", screen: "metronome", title: "Metrônomo", detail: OM.metro.S.bpm + " BPM · " + OM.metro.S.num + "/" + OM.metro.S.den, minutes: Math.round(min * 10) / 10 });
        }
      }
      sync();
    });
  }

  function start() {
    OM.applyTheme();
    var app = document.getElementById("app");
    OM.router.init(app);
    metPill(app);
    OM.router.tab("inicio");
    /* botão Voltar do Android chama App.voltar() */
    window.App = {
      voltar: function () { if (!OM.router.back()) OM.bridge.exit(); },
      pausar: function () { if (OM.metro.S.running) OM.metro.stop(); },
      segundoPlano: function (on) { OM.router.suspend(!!on); }
    };
    if (!OM.bridge.native) document.addEventListener("visibilitychange", function () { OM.router.suspend(document.hidden); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") window.App.voltar(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})(window.OM);
