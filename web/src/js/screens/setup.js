/* O Músico — boas-vindas (primeira abertura) e "Meus instrumentos" */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui;

  /* escolha de instrumentos: grupos de chips (múltipla escolha) + principal */
  function picker(selected, principal, onChange) {
    var box = h("div");
    function draw() {
      OM.u.clear(box);
      OM.inst.GROUPS.concat(OM.inst.custom().length ? [{ n: "Personalizados", ids: OM.inst.custom().map(function (c) { return c.id; }) }] : []).forEach(function (g) {
        box.appendChild(h("div.lbl", { text: g.n }));
        var row = h("div.chips.wrap");
        g.ids.forEach(function (id) {
          var i = OM.inst.find(id); if (!i) return;
          var on = selected.indexOf(id) >= 0;
          var b = h("button.chip" + (on ? ".on" : ""), { onclick: function () {
            if (on) { selected.splice(selected.indexOf(id), 1); if (principal === id) principal = selected[0] || ""; }
            else { selected.push(id); if (!principal) principal = id; }
            draw(); onChange(selected, principal);
          } });
          b.insertAdjacentHTML("beforeend", OM.icon(on ? "check" : OM.inst.icon(i)));
          b.appendChild(document.createTextNode(i.n));
          row.appendChild(b);
        });
        box.appendChild(row);
      });
      if (selected.length > 1) {
        box.appendChild(h("div.lbl", { text: "Qual é o principal?" }));
        box.appendChild(h("p.dim", { style: { fontSize: "12.5px", marginBottom: "8px" }, text: "Ele aparece primeiro nas cifras, no afinador e nos exercícios. Dá para trocar a qualquer momento com um toque." }));
        box.appendChild(ui.chips(selected.map(function (id) { return { v: id, label: OM.inst.find(id).n, icon: "star" }; }), principal, function (v) { principal = v; onChange(selected, principal); }, true));
      }
    }
    draw();
    return box;
  }

  OM.screen("welcome", function () {
    var st = OM.store.settings();
    var selected = (st.myInst || []).slice(), principal = st.instrument && selected.indexOf(st.instrument) >= 0 ? st.instrument : selected[0] || "";
    var content = h("div.content");
    var el = h("section", content);
    var btn = ui.btn("Começar", "check", finish, "pri block");
    var nameInp = h("input.inp", { type: "text", placeholder: "Seu nome (opcional)", value: st.name || "", maxlength: 40 });
    function sync() { btn.disabled = !selected.length; btn.lastChild.textContent = selected.length ? "Começar com " + selected.length + (selected.length === 1 ? " instrumento" : " instrumentos") : "Escolha pelo menos 1 instrumento"; }
    function finish() {
      if (!selected.length) return;
      OM.store.setSetting("name", nameInp.value.trim());
      OM.inst.setMine(selected, principal || selected[0]);
      OM.router.refreshRoots();
      OM.router.tab("inicio");
      ui.toast("Pronto! Você pode mudar seus instrumentos em Perfil.");
    }
    content.appendChild(h("div", { style: { textAlign: "center", padding: "calc(28px + var(--safeT)) 0 10px" } },
      h("div.logo", { html: OM.icon("note"), style: { width: "64px", height: "64px", borderRadius: "20px", background: "var(--acc)", color: "var(--acc-ink)", display: "grid", placeItems: "center", margin: "0 auto 14px", padding: "16px" } }),
      h("h1", { text: "Bem-vindo ao O Músico", style: { fontSize: "24px" } }),
      h("p.muted", { text: "Cifras, afinador, batidas e aulas no mesmo lugar. Conte para nós o que você toca.", style: { marginTop: "6px", fontSize: "14.5px" } })));
    content.appendChild(h("label.field", { style: { marginTop: "14px" } }, h("span", { text: "Como podemos te chamar?" }), nameInp));
    content.appendChild(h("h2", { text: "Quais instrumentos você toca ou quer aprender?", style: { fontSize: "17px", marginTop: "10px" } }));
    content.appendChild(picker(selected, principal, function (sel, pr) { selected = sel; principal = pr; sync(); }));
    content.appendChild(h("div", { style: { position: "sticky", bottom: "0", padding: "16px 0 calc(8px + var(--safeB))", background: "linear-gradient(transparent, var(--bg) 30%)" } }, btn));
    sync();
    return { el: el, onBack: function () { return true; } };
  });

  OM.screen("myinst", function () {
    var st = OM.store.settings();
    var selected = (st.myInst || []).slice(), principal = st.instrument;
    var content = h("div.content");
    var save = ui.btn("Salvar", "check", function () {
      if (!selected.length) { ui.toast("Escolha pelo menos 1 instrumento"); return; }
      OM.inst.setMine(selected, selected.indexOf(principal) >= 0 ? principal : selected[0]);
      OM.router.refreshRoots(); ui.toast("Instrumentos atualizados"); OM.router.back();
    }, "pri sm");
    var bar = ui.topbar({ title: "Meus instrumentos", back: true, actions: [save, h("span", { style: { width: "8px" } })] });
    var el = h("section", bar, content);
    content.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "4px 0" }, text: "Marque os instrumentos que você tem. Só eles aparecem nos seletores rápidos das cifras, do afinador e das aulas." }));
    content.appendChild(picker(selected, principal, function (sel, pr) { selected = sel; principal = pr; }));
    content.appendChild(h("div.btnrow", { style: { marginTop: "16px" } }, ui.btn("Criar instrumento personalizado", "plus", function () { OM.router.push("custominst", {}); }, "sm ghost")));
    return { el: el };
  });
})(window.OM);
