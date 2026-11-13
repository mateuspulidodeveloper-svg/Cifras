/* O Músico — Início */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, L = OM.lib;

  function songCard(s) {
    return h("button.scard", { onclick: function () { OM.router.push("song", { id: s.id }); } },
      ui.cover(s), h("div.t", { text: s.title }), h("div.s", { text: s.artist }));
  }
  function songItem(s, extra) {
    return ui.item({ lead: h("span.keybadge", { text: s.key || "–" }), title: s.title, sub: extra || s.artist,
      onClick: function () { OM.router.push("song", { id: s.id }); } });
  }
  function histText(e) {
    var t = { song: "Música", exercise: "Exercício", tool: "Ferramenta" }[e.type] || "Prática";
    return t + " · " + OM.u.fmtDate(e.date) + (e.minutes ? " · " + OM.u.fmtDur(e.minutes) : "") + (e.detail ? " · " + e.detail : "");
  }
  function histIcon(e) { return e.type === "exercise" ? "learn" : e.type === "tool" ? (e.icon || "tools") : "note"; }
  function openHist(e) {
    if (e.type === "song" && L.get(e.id)) OM.router.push("song", { id: e.id });
    else if (e.type === "exercise") OM.router.push("exercise", { id: e.id });
    else if (e.screen) OM.router.push(e.screen, e.params || {});
  }

  OM.screen("inicio", function () {
    var content = h("div.content");
    var brand = h("div.brand", h("span.logo", { html: OM.icon("note") }), h("b", { text: "O Músico" }));
    var bar = ui.topbar({ brand: brand, actions: [ui.ibtn("user", function () { OM.router.push("perfil"); }, "Perfil")] });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var input = h("input", { type: "search", placeholder: "Buscar músicas, artistas, letras…", enterkeyhint: "search" });
    var clr = h("button.clr.hidden", { html: OM.icon("close"), "aria-label": "Limpar", onclick: function () { input.value = ""; update(); input.focus(); } });
    var results = h("div"), main = h("div");
    input.addEventListener("input", OM.u.debounce(update, 120));
    function update() {
      var q = input.value.trim();
      clr.classList.toggle("hidden", !q);
      main.classList.toggle("hidden", !!q);
      OM.u.clear(results);
      if (!q) return;
      var r = L.search(q);
      results.appendChild(ui.sec(r.length + (r.length === 1 ? " resultado" : " resultados")));
      if (!r.length) {
        results.appendChild(ui.empty("search", "Nada encontrado para “" + q + "”. Você pode criar sua própria cifra.",
          ui.btn("Nova cifra", "plus", function () { OM.router.push("editor", { title: q }); }, "pri")));
        return;
      }
      var list = h("div.list");
      r.slice(0, 40).forEach(function (s) { list.appendChild(songItem(s)); });
      results.appendChild(list);
    }
    function render() {
      var st = OM.store.settings(), inst = OM.inst.current();
      OM.u.clear(main);
      var hr = new Date().getHours(), greet = hr < 5 ? "Boa noite" : hr < 12 ? "Bom dia" : hr < 18 ? "Boa tarde" : "Boa noite";
      var streak = L.streak();
      main.appendChild(h("div.hello", h("h1", { text: greet + (st.name ? ", " + st.name.split(" ")[0] : "") }),
        h("p", { text: streak ? "Você pratica há " + streak + (streak === 1 ? " dia seguido" : " dias seguidos") + ". Continue assim!" : "O que vamos tocar hoje?" })));
      main.appendChild(ui.instSwitch({ onChange: render }));
      /* aprender em destaque */
      var nx = OM.lessons.nextLesson();
      main.appendChild(h("button.card.hero", { onclick: function () { if (nx) OM.router.push("lesson", { course: nx.course.id, id: nx.lesson.id }); else OM.router.tab("aprender"); } },
        h("span.hi", { html: OM.icon(nx ? "play" : "learn") }),
        h("div", { style: { flex: 1, minWidth: 0 } }, h("small", { text: nx ? "Continue aprendendo · " + nx.course.n : "Aprender" }), h("b", { text: nx ? nx.lesson.n : "Exercícios, guias e mapa do braço" })),
        h("span", { html: OM.icon("chev"), style: { width: "20px" } })));
      /* atalhos essenciais */
      var q = function (icon, t, fn) { return h("button.qa", { onclick: fn }, h("span", { html: OM.icon(icon) }), h("small", { text: t })); };
      main.appendChild(h("div.qrow",
        q("tuner", "Afinador", function () { OM.router.push("tuner"); }),
        q("metro", "Metrônomo", function () { OM.router.push("metronome"); }),
        q("pulse", "Batidas", function () { OM.router.push("batidas"); }),
        q("grid", "Acordes", function () { OM.router.push("chords"); })));

      var rec = L.recent().slice(0, 10);
      if (rec.length) {
        main.appendChild(ui.sec("Continue tocando"));
        main.appendChild(h("div.hscroll", rec.map(songCard)));
      }
      var favs = L.favs().map(L.get).filter(Boolean);
      if (favs.length) {
        main.appendChild(ui.sec("Favoritas", "Ver todas", function () { OM.router.push("songlist", { kind: "fav" }); }));
        main.appendChild(h("div.hscroll", favs.slice(0, 10).map(songCard)));
      }
      main.appendChild(ui.sec("Sugestões para você", "Ver cifras", function () { OM.router.tab("cifras"); }));
      main.appendChild(h("div.hscroll", L.suggestions(8).map(songCard)));

      var hist = L.history().slice(0, 3);
      if (hist.length) {
        main.appendChild(ui.sec("Últimas práticas", "Histórico", function () { OM.router.push("history"); }));
        var hl = h("div.list");
        hist.forEach(function (e) { hl.appendChild(ui.item({ icon: histIcon(e), title: e.title, sub: histText(e), onClick: function () { openHist(e); } })); });
        main.appendChild(hl);
      }
    }
    content.appendChild(h("div.search", { html: OM.icon("search") }, input, clr));
    content.appendChild(results);
    content.appendChild(main);
    return { el: el, onShow: function () { if (!input.value) render(); } };
  });

  OM.homeHelpers = { songItem: songItem, songCard: songCard, histText: histText, histIcon: histIcon, openHist: openHist };
})(window.OM);
