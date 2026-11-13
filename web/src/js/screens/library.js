/* O Músico — Biblioteca pessoal e repertórios */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, L = OM.lib;

  OM.screen("biblioteca", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Biblioteca", actions: [ui.ibtn("plus", newList, "Novo repertório")] });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function newList() {
      ui.prompt("Novo repertório", "Nome (ex.: Show de sábado, Missa, Ensaio)", "").then(function (n) { if (!n) return; var l = L.createList(n); OM.router.push("list", { id: l.id }); });
    }
    function draw() {
      OM.u.clear(content);
      var nNotes = Object.keys(OM.store.get("notes", {})).length;
      var tile = function (icon, t, n, fn) { return h("button.tile", { onclick: fn }, h("span.ti", { html: OM.icon(icon) }), h("div", h("b", { text: t }), h("small", { text: n }))); };
      content.appendChild(h("div.grid2", { style: { marginTop: "4px" } },
        tile("heart", "Favoritas", L.favs().length + " músicas", function () { OM.router.push("songlist", { kind: "fav" }); }),
        tile("star", "Para aprender", L.byStatus("learn").length + " músicas", function () { OM.router.push("songlist", { kind: "learn" }); }),
        tile("trophy", "Dominadas", L.byStatus("mastered").length + " músicas", function () { OM.router.push("songlist", { kind: "mastered" }); }),
        tile("edit", "Minhas cifras", L.all().filter(function (s) { return s.user || s.edited; }).length + " cifras", function () { OM.router.push("mysongs"); }),
        tile("notes", "Anotações", nNotes + (nNotes === 1 ? " música" : " músicas"), function () { OM.router.push("notes"); }),
        tile("history", "Histórico", L.history().length + " sessões", function () { OM.router.push("history"); })));
      content.appendChild(ui.sec("Repertórios", "Novo", newList));
      var ls = L.lists();
      if (!ls.length) content.appendChild(ui.empty("list", "Crie repertórios para ensaios e apresentações. No modo apresentação, avance de uma música para a próxima.", ui.btn("Criar repertório", "plus", newList, "pri")));
      else {
        var l = h("div.list");
        ls.forEach(function (x) { l.appendChild(ui.item({ icon: "list", iconCls: "acc", title: x.name, sub: x.songs.length + (x.songs.length === 1 ? " música" : " músicas"), onClick: function () { OM.router.push("list", { id: x.id }); } })); });
        content.appendChild(l);
      }
      content.appendChild(ui.sec("Importar e exportar"));
      content.appendChild(h("div.list", ui.item({ icon: "upload", iconCls: "acc", title: "Músicas em JSON", sub: "Importar arquivos, exportar cifras e guia para IA", onClick: function () { OM.router.push("transfer"); } })));
      content.appendChild(ui.sec("Gravações"));
      content.appendChild(h("div.list", ui.item({ icon: "mic", iconCls: "acc", title: "Gravador de ideias", sub: "Suas gravações guardadas no aparelho", onClick: function () { OM.router.push("recorder"); } })));
      content.appendChild(ui.sec("Recentes", "Ver todas", function () { OM.router.push("songlist", { kind: "recent" }); }));
      var rec = L.recent().slice(0, 5);
      if (rec.length) { var rl = h("div.list"); rec.forEach(function (s) { rl.appendChild(OM.homeHelpers.songItem(s)); }); content.appendChild(rl); }
      else content.appendChild(h("p.muted", { text: "Nenhuma cifra aberta ainda.", style: { fontSize: "14px" } }));
    }
    return { el: el, onShow: draw };
  });

  OM.screen("mysongs", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Minhas cifras", back: true, actions: [ui.ibtn("plus", function () { OM.router.push("editor", {}); }, "Nova cifra")] });
    var el = h("section", bar, content);
    function draw() {
      OM.u.clear(content);
      var mine = L.all().filter(function (s) { return s.user; }), ed = L.all().filter(function (s) { return s.edited; });
      content.appendChild(ui.sec("Criadas ou importadas"));
      if (mine.length) { var l = h("div.list"); mine.forEach(function (s) { l.appendChild(OM.homeHelpers.songItem(s)); }); content.appendChild(l); }
      else content.appendChild(ui.empty("edit", "Escreva ou importe cifras de qualquer música.", ui.btn("Nova cifra", "plus", function () { OM.router.push("editor", {}); }, "pri")));
      content.appendChild(ui.sec("Cifras do acervo com alterações pessoais"));
      if (ed.length) { var l2 = h("div.list"); ed.forEach(function (s) { l2.appendChild(OM.homeHelpers.songItem(s, s.artist + " · editada")); }); content.appendChild(l2); }
      else content.appendChild(h("p.muted", { style: { fontSize: "14px" }, text: "Use “Editar (versão pessoal)” no menu ⋮ de uma cifra." }));
    }
    return { el: el, onShow: draw };
  });

  OM.screen("notes", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Anotações", back: true });
    var el = h("section", bar, content);
    function draw() {
      OM.u.clear(content);
      var m = OM.store.get("notes", {}), ids = Object.keys(m).filter(function (id) { return L.get(id); });
      ids.sort(function (a, b) { return (m[b].date || 0) - (m[a].date || 0); });
      if (!ids.length) { content.appendChild(ui.empty("notes", "Suas anotações em cifras aparecem aqui.")); return; }
      ids.forEach(function (id) {
        var s = L.get(id), t = typeof m[id] === "string" ? m[id] : m[id].text;
        content.appendChild(h("button.card", { style: { display: "block", width: "100%", textAlign: "left", marginTop: "10px" }, onclick: function () { OM.router.push("song", { id: id }); } },
          h("b", { text: s.title }), h("div.muted", { style: { fontSize: "12.5px", marginBottom: "6px" }, text: s.artist + (m[id].date ? " · " + OM.u.fmtDate(m[id].date) : "") }),
          h("p", { style: { whiteSpace: "pre-wrap", fontSize: "14px" }, text: t })));
      });
    }
    return { el: el, onShow: draw };
  });

  /* ---------- repertório ---------- */
  OM.screen("list", function (p) {
    var content = h("div.content");
    var titleBar = ui.topbar({ title: "Repertório", back: true, actions: [ui.ibtn("more", menu, "Opções")] });
    var el = h("section", titleBar, content);
    var editing = false;
    function list() { return L.getList(p.id); }
    function menu() {
      var l = list(); if (!l) return;
      ui.menu(l.name, [
        { icon: "edit", label: "Renomear", onClick: function () { ui.prompt("Renomear repertório", "Nome", l.name).then(function (n) { if (n) { l.name = n; L.saveList(l); draw(); } }); } },
        { icon: "swap", label: editing ? "Concluir reorganização" : "Reorganizar / remover músicas", onClick: function () { editing = !editing; draw(); } },
        { icon: "download", label: "Exportar repertório (JSON)", onClick: function () { OM.transfer.exportFile(l.songs, l.name, l.name); } },
        { icon: "share", label: "Compartilhar lista", onClick: function () { OM.bridge.share(l.name + "\n\n" + l.songs.map(function (id, i) { var s = L.get(id); return s ? (i + 1) + ". " + s.title + " — " + s.artist + (s.key ? " (" + s.key + ")" : "") : ""; }).filter(Boolean).join("\n")); } },
        { icon: "trash", label: "Excluir repertório", danger: true, onClick: function () { ui.confirm("Excluir “" + l.name + "”? As cifras não serão apagadas.", "Excluir", true).then(function (ok) { if (ok) { L.deleteList(l.id); OM.router.back(); } }); } }
      ]);
    }
    function addSongs() {
      var l = list(), box = h("div"), input = h("input", { type: "search", placeholder: "Buscar no acervo" }), res = h("div.list", { style: { marginTop: "10px" } });
      function upd() {
        OM.u.clear(res);
        L.search(input.value).slice(0, 60).forEach(function (s) {
          var inL = l.songs.indexOf(s.id) >= 0;
          res.appendChild(ui.item({ lead: h("span.keybadge", { text: s.key || "–" }), title: s.title, sub: s.artist, end: h("span", { html: OM.icon(inL ? "check" : "plus"), style: { color: inL ? "var(--ok)" : "var(--tx2)" } }),
            onClick: function () { if (inL) l.songs.splice(l.songs.indexOf(s.id), 1); else l.songs.push(s.id); L.saveList(l); upd(); } }));
        });
      }
      input.addEventListener("input", OM.u.debounce(upd, 120));
      box.appendChild(h("div.search", { html: OM.icon("search") }, input)); box.appendChild(res); upd();
      ui.sheet({ title: "Adicionar músicas", content: box, onClose: draw });
    }
    function draw() {
      var l = list();
      OM.u.clear(content);
      if (!l) { content.appendChild(ui.empty("alert", "Repertório não encontrado.")); return; }
      titleBar.querySelector("h1").textContent = l.name;
      var songs = l.songs.map(L.get).filter(Boolean);
      var mins = songs.length;
      content.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "2px 0 12px" }, text: songs.length + (songs.length === 1 ? " música" : " músicas") }));
      content.appendChild(h("div.btnrow", songs.length ? ui.btn("Apresentar", "present", function () { OM.router.push("song", { id: songs[0].id, list: l.id, present: true }); }, "pri") : null,
        ui.btn("Adicionar", "plus", addSongs, songs.length ? "" : "pri")));
      void mins;
      if (!songs.length) { content.appendChild(ui.empty("list", "Repertório vazio. Adicione músicas do acervo ou suas cifras.")); return; }
      var lst = h("div.list", { style: { marginTop: "14px" } });
      songs.forEach(function (s, i) {
        var end = editing ? h("span", { style: { display: "flex", gap: "2px" } },
          ui.ibtn("chevd", function (e) { e.stopPropagation(); if (i < l.songs.length - 1) { var t = l.songs[i]; l.songs[i] = l.songs[i + 1]; l.songs[i + 1] = t; L.saveList(l); draw(); } }, "Descer", "sm"),
          ui.ibtn("trash", function (e) { e.stopPropagation(); l.songs.splice(i, 1); L.saveList(l); draw(); }, "Remover", "sm")) : undefined;
        lst.appendChild(ui.item({ lead: h("span.keybadge", { text: i + 1 }), title: s.title, sub: s.artist + (s.key ? " · Tom " + s.key : "") + (s.bpm ? " · " + s.bpm + " BPM" : ""), end: end,
          onClick: function () { if (!editing) OM.router.push("song", { id: s.id, list: l.id }); } }));
      });
      content.appendChild(lst);
      if (editing) content.appendChild(h("div.btnrow", { style: { marginTop: "12px" } }, ui.btn("Concluir", "check", function () { editing = false; draw(); }, "sm")));
    }
    return { el: el, onShow: draw };
  });
})(window.OM);
