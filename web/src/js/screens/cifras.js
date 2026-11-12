/* O Músico — aba Cifras (acervo, busca, filtros) e lista genérica de músicas */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, L = OM.lib;

  OM.screen("cifras", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Cifras", actions: [ui.ibtn("upload", importFile, "Importar arquivo"), ui.ibtn("plus", function () { OM.router.push("editor", {}); }, "Nova cifra")] });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var input = h("input", { type: "search", placeholder: "Música, artista, gênero ou trecho da letra", enterkeyhint: "search" });
    var filter = "all", sort = "az", diff = 0;
    var listEl = h("div");
    input.addEventListener("input", OM.u.debounce(draw, 120));
    var genres = {};
    function filters() {
      var gs = {}; L.all().forEach(function (s) { if (s.genre) gs[s.genre] = 1; });
      genres = Object.keys(gs).sort();
      return [{ v: "all", label: "Todas" }, { v: "mine", label: "Minhas cifras" }, { v: "fav", label: "Favoritas" }, { v: "learn", label: "Para aprender" }, { v: "mastered", label: "Dominadas" }]
        .concat(genres.map(function (g) { return { v: "g:" + g, label: g }; }));
    }
    var chipsEl = ui.chips(filters(), filter, function (v) { filter = v; draw(); });
    var sortSeg = ui.seg([{ v: "az", label: "A–Z" }, { v: "artist", label: "Artista" }, { v: "diff", label: "Dificuldade" }], sort, function (v) { sort = v; draw(); });
    var diffChips = ui.chips([{ v: 0, label: "Qualquer nível" }, { v: 1, label: "Iniciante" }, { v: 2, label: "Básico" }, { v: 3, label: "Intermediário" }, { v: 4, label: "Avançado" }], 0, function (v) { diff = v; draw(); });
    function pass(s) {
      if (diff && (diff === 4 ? (s.difficulty || 2) < 4 : (s.difficulty || 2) !== diff)) return false;
      if (filter === "all") return true;
      if (filter === "mine") return !!s.user;
      if (filter === "fav") return L.isFav(s.id);
      if (filter === "learn" || filter === "mastered") return L.status(s.id) === filter;
      if (filter.indexOf("g:") === 0) return s.genre === filter.slice(2);
      return true;
    }
    function draw() {
      var q = input.value.trim();
      var r = L.search(q, pass);
      if (!q) r.sort(function (a, b) {
        if (sort === "artist") return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
        if (sort === "diff") return (a.difficulty || 2) - (b.difficulty || 2) || a.title.localeCompare(b.title);
        return a.title.localeCompare(b.title);
      });
      OM.u.clear(listEl);
      listEl.appendChild(h("div.lbl", { text: r.length + (r.length === 1 ? " cifra" : " cifras") }));
      if (!r.length) {
        listEl.appendChild(ui.empty("cifras", q ? "Nenhuma cifra para “" + q + "”." : "Nenhuma cifra neste filtro.",
          ui.btn("Escrever nova cifra", "plus", function () { OM.router.push("editor", { title: q }); }, "pri")));
        return;
      }
      var list = h("div.list");
      r.forEach(function (s) {
        var st = L.status(s.id);
        list.appendChild(ui.item({ lead: h("span.keybadge", { text: s.key || "–" }), title: s.title,
          sub: s.artist + (s.user ? " · minha" : "") + (s.edited ? " · editada" : "") + (st === "mastered" ? " · dominada" : st === "learn" ? " · aprendendo" : ""),
          end: h("span", ui.diff(s.difficulty || 2)), onClick: function () { OM.router.push("song", { id: s.id }); } }));
      });
      listEl.appendChild(list);
    }
    function importFile() {
      var f = h("input", { type: "file", accept: ".txt,.cho,.chordpro,.chopro,.pro,.crd,text/plain" });
      f.onchange = function () {
        var file = f.files[0]; if (!file) return;
        var r = new FileReader();
        r.onload = function () { OM.router.push("editor", { importText: String(r.result), fileName: file.name.replace(/\.[^.]+$/, "") }); };
        r.readAsText(file);
      };
      f.click();
    }
    content.appendChild(h("div.search", { html: OM.icon("search") }, input));
    content.appendChild(h("div", { style: { marginTop: "12px" } }, chipsEl));
    content.appendChild(h("div", { style: { marginTop: "6px" } }, diffChips));
    content.appendChild(h("div", { style: { marginTop: "8px" } }, sortSeg));
    content.appendChild(listEl);
    content.appendChild(h("div.notice", { style: { marginTop: "16px" }, html: OM.icon("info") },
      h("span", { text: "O acervo inclui canções de domínio público e estudos. Para outras músicas, crie ou importe cifras (texto com acordes sobre a letra, ou ChordPro). Tudo fica salvo no aparelho." })));
    return { el: el, onShow: function (o) { chipsEl.set(filter); draw(); if (o && o.focus) setTimeout(function () { input.focus(); }, 100); } };
  });

  /* lista de músicas: favoritas, para aprender, dominadas, minhas cifras */
  OM.screen("songlist", function (p) {
    var titles = { fav: "Favoritas", learn: "Para aprender", mastered: "Dominadas", mine: "Minhas cifras", recent: "Recentes" };
    var content = h("div.content");
    var bar = ui.topbar({ title: titles[p.kind] || "Músicas", back: true });
    var el = h("section", bar, content);
    function get() {
      if (p.kind === "fav") return L.favs().map(L.get).filter(Boolean);
      if (p.kind === "learn" || p.kind === "mastered") return L.byStatus(p.kind);
      if (p.kind === "mine") return L.all().filter(function (s) { return s.user; });
      if (p.kind === "recent") return L.recent();
      return [];
    }
    function draw() {
      OM.u.clear(content);
      var a = get();
      if (!a.length) {
        content.appendChild(ui.empty(p.kind === "fav" ? "heart" : "note", {
          fav: "Nenhuma favorita ainda. Abra uma cifra e toque no coração.",
          learn: "Marque cifras como “Para aprender” no menu ⋮ da cifra.",
          mastered: "Quando dominar uma música, marque-a como “Dominada”.",
          mine: "Você ainda não criou cifras.", recent: "Nada aberto recentemente."
        }[p.kind], p.kind === "mine" ? ui.btn("Nova cifra", "plus", function () { OM.router.push("editor", {}); }, "pri") : ui.btn("Ver acervo", "cifras", function () { OM.router.tab("cifras"); })));
        return;
      }
      var list = h("div.list", { style: { marginTop: "6px" } });
      a.forEach(function (s) { list.appendChild(OM.homeHelpers.songItem(s)); });
      content.appendChild(list);
    }
    return { el: el, onShow: draw };
  });
})(window.OM);
