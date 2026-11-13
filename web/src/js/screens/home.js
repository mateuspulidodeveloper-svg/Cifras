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
    var bar = ui.topbar({ brand: brand, actions: [ui.ibtn("learn", function () { OM.router.push("learn"); }, "Aprender"), ui.ibtn("settings", function () { OM.router.push("settings"); }, "Configurações")] });
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
      var tile = function (icon, t, sub, fn) { return h("button.tile", { onclick: fn }, h("span.ti", { html: OM.icon(icon) }), h("div", h("b", { text: t }), h("small", { text: sub }))); };
      var g = h("div.grid2", { style: { marginTop: "14px" } },
        tile("tuner", "Afinador", OM.inst.hasStrings(inst) ? inst.n : "Cromático", function () { OM.router.push("tuner"); }),
        tile("metro", "Metrônomo", OM.metro.S.bpm + " BPM · " + OM.metro.S.num + "/" + OM.metro.S.den, function () { OM.router.push("metronome"); }),
        tile("library", "Biblioteca", L.favs().length + " favoritas · " + L.lists().length + " repertórios", function () { OM.router.tab("biblioteca"); }),
        tile(OM.inst.icon(inst), "Instrumentos", inst.n, function () { OM.router.push("instruments"); }));
      main.appendChild(g);
      var nx = OM.lessons.nextLesson();
      main.appendChild(h("button.card", { style: { display: "flex", alignItems: "center", gap: "14px", width: "100%", textAlign: "left", marginTop: "10px", background: "var(--acc-soft)", borderColor: "var(--acc)" },
        onclick: function () { if (nx) OM.router.push("lesson", { course: nx.course.id, id: nx.lesson.id }); else OM.router.push("learn"); } },
        h("span.ti", { html: OM.icon("learn"), style: { width: "42px", height: "42px", borderRadius: "12px", display: "grid", placeItems: "center", background: "var(--acc)", color: "var(--acc-ink)", flex: "none" } }),
        h("div", { style: { flex: 1, minWidth: 0 } }, h("b", { text: nx ? "Continue aprendendo" : "Aprender música", style: { display: "block" } }),
          h("small.muted", { text: nx ? nx.course.n + " · " + nx.lesson.n : "Cursos concluídos! Explore exercícios, guias e o mapa do braço." })),
        h("span", { html: OM.icon("chev"), style: { width: "20px", color: "var(--acc)" } })));
      main.appendChild(h("div.chips", { style: { marginTop: "10px" } },
        h("button.chip", { text: "Cursos", onclick: function () { OM.router.push("learn"); } }),
        h("button.chip", { text: "Instrumentos", onclick: function () { OM.router.push("instguides"); } }),
        h("button.chip", { text: "Mapa do braço", onclick: function () { OM.router.push("fretmap"); } }),
        h("button.chip", { text: "Acordes", onclick: function () { OM.router.push("chords"); } }),
        h("button.chip", { text: "Importar JSON", onclick: function () { OM.router.push("transfer"); } })));

      var rec = L.recent().slice(0, 10);
      if (rec.length) {
        main.appendChild(ui.sec("Recentes"));
        main.appendChild(h("div.hscroll", rec.map(songCard)));
      }
      var favs = L.favs().map(L.get).filter(Boolean);
      main.appendChild(ui.sec("Favoritas", favs.length > 4 ? "Ver todas" : null, function () { OM.router.push("songlist", { kind: "fav" }); }));
      if (favs.length) { var fl = h("div.list"); favs.slice(0, 4).forEach(function (s) { fl.appendChild(songItem(s)); }); main.appendChild(fl); }
      else main.appendChild(h("div.card", h("p.muted", { text: "Toque no coração de uma cifra para guardá-la aqui." })));

      main.appendChild(ui.sec("Sugestões para você", "Ver acervo", function () { OM.router.tab("cifras"); }));
      main.appendChild(h("div.hscroll", L.suggestions(8).map(songCard)));

      var hist = L.history().slice(0, 4);
      main.appendChild(ui.sec("Últimas práticas", hist.length ? "Histórico" : null, function () { OM.router.push("history"); }));
      if (hist.length) {
        var hl = h("div.list");
        hist.forEach(function (e) { hl.appendChild(ui.item({ icon: histIcon(e), title: e.title, sub: histText(e), onClick: function () { openHist(e); } })); });
        main.appendChild(hl);
      } else {
        main.appendChild(h("div.card", h("p.muted", { text: "Suas sessões de prática (cifras, exercícios e ferramentas) aparecerão aqui." }),
          h("div.btnrow", { style: { marginTop: "12px" } }, ui.btn("Começar a aprender", "learn", function () { OM.router.push("learn"); }, "sm"))));
      }
    }
    content.appendChild(h("div.search", { html: OM.icon("search") }, input, clr));
    content.appendChild(results);
    content.appendChild(main);
    return { el: el, onShow: function () { if (!input.value) render(); } };
  });

  OM.homeHelpers = { songItem: songItem, songCard: songCard, histText: histText, histIcon: histIcon, openHist: openHist };
})(window.OM);
