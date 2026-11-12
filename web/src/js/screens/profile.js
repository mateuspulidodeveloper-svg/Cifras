/* O Músico — Perfil, estatísticas, configurações e backup */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, L = OM.lib, S = OM.store;

  function applyTheme() {
    var st = S.settings();
    document.documentElement.setAttribute("data-theme", st.theme === "light" ? "light" : "dark");
    document.documentElement.setAttribute("data-accent", st.accent === "lime" ? "lime" : "orange");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", st.theme === "light" ? "#f3f3f1" : "#111214");
  }
  OM.applyTheme = applyTheme;

  OM.screen("perfil", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Perfil", actions: [ui.ibtn("settings", function () { OM.router.push("settings"); }, "Configurações")] });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function draw() {
      OM.u.clear(content);
      var st = S.settings(), inst = OM.inst.current();
      var initials = (st.name || "Músico").split(" ").map(function (x) { return x[0]; }).slice(0, 2).join("").toUpperCase();
      content.appendChild(h("div", { style: { display: "flex", alignItems: "center", gap: "14px", margin: "6px 0 16px" } }, h("div.avatar", { text: initials }),
        h("div", { style: { flex: 1, minWidth: 0 } }, h("h2", { text: st.name || "Músico", style: { fontSize: "20px" } }), h("p.muted", { style: { fontSize: "14px" }, text: inst.n + " · " + OM.EX.totalXp() + " XP" })),
        ui.btn("Editar", "edit", function () { ui.prompt("Seu nome", "Como prefere ser chamado?", st.name).then(function (n) { if (n != null) { S.setSetting("name", n); draw(); } }); }, "sm ghost")));
      content.appendChild(h("div.grid3",
        h("div.card.stat", h("b", { text: Math.round(L.totalMinutes()) }), h("span", { text: "min praticados" })),
        h("div.card.stat", h("b", { text: L.streak() }), h("span", { text: "dias seguidos" })),
        h("div.card.stat", h("b", { text: L.byStatus("mastered").length }), h("span", { text: "dominadas" }))));
      /* últimos 14 dias */
      var days = S.get("practiceDays", {}), strk = h("div.streak");
      for (var i = 13; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var m = days[OM.u.dayKey(d.getTime())] || 0;
        strk.appendChild(h("i" + (m >= 30 ? ".l3" : m >= 10 ? ".l2" : m > 0 ? ".l1" : ""), { title: d.toLocaleDateString("pt-BR") + ": " + Math.round(m) + " min" }));
      }
      content.appendChild(h("div.card", { style: { marginTop: "10px" } }, h("h3", { text: "Últimos 14 dias" }), strk, h("p.dim", { style: { fontSize: "12px", marginTop: "6px" }, text: "Cada quadrado é um dia; quanto mais forte, mais minutos de prática." })));
      content.appendChild(ui.sec("Progresso nos exercícios", "Aprender", function () { OM.router.push("learn"); }));
      var pl = h("div.card");
      OM.EX.list().forEach(function (x) {
        var pr = OM.EX.progress(x.id), done = Object.keys(pr.best).filter(function (k) { return pr.best[k] >= (x.changes ? x.levels[k].goal : 80); }).length;
        pl.appendChild(h("div", { style: { marginBottom: "10px" } }, h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "4px" } }, h("span", { text: x.n }), h("span.dim", { text: done + "/" + x.levels.length })),
          h("div.prog", h("i", { style: { width: done / x.levels.length * 100 + "%" } }))));
      });
      content.appendChild(pl);
      content.appendChild(ui.sec("Atalhos"));
      content.appendChild(h("div.list",
        ui.item({ icon: OM.inst.icon(inst), iconCls: "acc", title: "Instrumento principal", sub: inst.n, onClick: function () { OM.router.push("instruments"); } }),
        ui.item({ icon: "history", iconCls: "acc", title: "Histórico de prática", onClick: function () { OM.router.push("history"); } }),
        ui.item({ icon: "settings", iconCls: "acc", title: "Configurações", sub: "Tema, notação, afinação de referência", onClick: function () { OM.router.push("settings"); } }),
        ui.item({ icon: "download", iconCls: "acc", title: "Backup dos dados", sub: "Exportar ou restaurar", onClick: function () { OM.router.push("settings", { focus: "backup" }); } })));
    }
    return { el: el, onShow: draw };
  });

  OM.screen("settings", function (p) {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Configurações", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function draw() {
      OM.u.clear(content);
      var st = S.settings();
      content.appendChild(h("div.lbl", { text: "Aparência" }));
      content.appendChild(h("div.card", { style: { padding: "4px 14px" } },
        ui.row("Tema", ui.seg([{ v: "dark", label: "Escuro" }, { v: "light", label: "Claro" }], st.theme, function (v) { S.setSetting("theme", v); applyTheme(); })),
        ui.row("Cor de destaque", ui.seg([{ v: "orange", label: "Laranja" }, { v: "lime", label: "Verde-limão" }], st.accent, function (v) { S.setSetting("accent", v); applyTheme(); })),
        ui.row("Fonte padrão das cifras", ui.stepper(st.fontSize, 12, 30, 1, function (v) { return v + " px"; }, function (v) { S.setSetting("fontSize", v); })),
        ui.row("Mostrar diagramas nas cifras", ui.toggle(st.showDiagrams !== false, function (v) { S.setSetting("showDiagrams", v); }))));
      content.appendChild(h("div.lbl", { text: "Música" }));
      content.appendChild(h("div.card", { style: { padding: "4px 14px" } },
        ui.row("Notação", ui.seg([{ v: "letters", label: "C D E" }, { v: "solfege", label: "Dó Ré Mi" }], st.notation, function (v) { S.setSetting("notation", v); OM.router.refreshRoots(); })),
        ui.row("Lá de referência (A4)", ui.stepper(st.a4, 415, 466, 1, function (v) { return v + " Hz"; }, function (v) { S.setSetting("a4", v); })),
        ui.row("Diagramas para canhotos", ui.toggle(st.leftHanded, function (v) { S.setSetting("leftHanded", v); })),
        ui.row("Manter tela ligada ao tocar", ui.toggle(st.keepAwake, function (v) { S.setSetting("keepAwake", v); }))));
      content.appendChild(h("div.lbl", { id: "backup", text: "Backup" }));
      content.appendChild(h("div.card",
        h("p.muted", { style: { fontSize: "13.5px", marginBottom: "12px" }, text: "Seus dados ficam apenas neste aparelho. Exporte um arquivo de backup para guardar ou levar a outro aparelho (gravações de áudio não entram no backup; exporte-as pelo gravador)." }),
        h("div.btnrow", ui.btn("Exportar", "download", function () {
          var blob = new Blob([S.exportData()], { type: "application/json" });
          var name = "o-musico-backup-" + new Date().toISOString().slice(0, 10) + ".json";
          OM.bridge.saveFile(name, "application/json", blob).then(function (path) { ui.toast(path ? "Backup salvo em " + path : "Não foi possível salvar"); });
        }, "pri"), ui.btn("Restaurar", "upload", function () {
          var f = h("input", { type: "file", accept: ".json,application/json" });
          f.onchange = function () {
            var file = f.files[0]; if (!file) return;
            var r = new FileReader();
            r.onload = function () {
              ui.confirm("Restaurar o backup substitui suas configurações, cifras e listas atuais. Continuar?", "Restaurar", true).then(function (ok) {
                if (!ok) return;
                try { S.importData(String(r.result)); ui.toast("Backup restaurado"); setTimeout(function () { location.reload(); }, 700); }
                catch (e) { ui.toast(e.message || "Arquivo inválido"); }
              });
            };
            r.readAsText(file);
          };
          f.click();
        }))));
      content.appendChild(h("div.lbl", { text: "Dados" }));
      content.appendChild(h("div.list",
        ui.item({ icon: "trash", title: "Limpar histórico de prática", onClick: function () { ui.confirm("Apagar todo o histórico e as estatísticas de prática?", "Apagar", true).then(function (ok) { if (ok) { S.set("history", []); S.set("practiceDays", {}); ui.toast("Histórico apagado"); } }); } }),
        ui.item({ icon: "trash", title: "Zerar progresso dos exercícios", onClick: function () { ui.confirm("Zerar níveis e pontuação de todos os exercícios?", "Zerar", true).then(function (ok) { if (ok) { S.set("ex", {}); ui.toast("Progresso zerado"); } }); } })));
      content.appendChild(h("div.lbl", { text: "Sobre" }));
      content.appendChild(h("div.card", h("b", { text: "O Músico 1.0" }),
        h("p.muted", { style: { fontSize: "13px", marginTop: "4px" }, text: "Plataforma musical: cifras, afinador, metrônomo, acordes, escalas e exercícios. Funciona sem internet; nada é enviado a servidores. Afinador por análise de frequência em tempo real (McLeod Pitch Method)." })));
      if (p.focus === "backup") setTimeout(function () { var b = content.querySelector("#backup"); if (b) b.scrollIntoView(); }, 50);
    }
    draw();
    return { el: el };
  });
})(window.OM);
