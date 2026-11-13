/* O Músico — navegação: 5 abas raiz + pilha de telas, botão Voltar do Android */
(function (OM) {
  "use strict";
  var h = OM.u.h;
  var TABS = [
    { id: "inicio", n: "Início", icon: "home" },
    { id: "cifras", n: "Cifras", icon: "cifras" },
    { id: "aprender", n: "Aprender", icon: "learn" },
    { id: "ferramentas", n: "Ferramentas", icon: "tools" },
    { id: "biblioteca", n: "Biblioteca", icon: "library" }
  ];
  var screens = {};
  var roots = {}, stack = [], current = null;
  var viewsEl, navEl;

  function register(name, fn) { screens[name] = fn; }
  function make(name, params, isRoot) {
    var fn = screens[name];
    if (!fn) throw new Error("Tela inexistente: " + name);
    var s = fn(params || {}) || {};
    s.name = name; s.params = params;
    s.el.classList.add("view");
    if (isRoot) s.el.classList.add("tabroot");
    return s;
  }
  function init(app) {
    viewsEl = h("div.views");
    navEl = h("nav.bnav");
    TABS.forEach(function (t) {
      navEl.appendChild(h("button", { "data-tab": t.id, onclick: function () { tab(t.id); } }, h("span", { html: OM.icon(t.icon) }), t.n));
    });
    app.appendChild(viewsEl);
    app.appendChild(navEl);
  }
  function syncNav() {
    [].forEach.call(navEl.children, function (b) { b.classList.toggle("on", b.getAttribute("data-tab") === current); });
    navEl.classList.toggle("off", stack.length > 0);
    document.dispatchEvent(new CustomEvent("om:nav", { detail: { tab: current, depth: stack.length, name: stack.length ? stack[stack.length - 1].name : current } }));
  }
  function popAll() {
    while (stack.length) { var s = stack.pop(); s.onHide && s.onHide(); s.destroy && s.destroy(); s.el.remove(); }
  }
  function tab(id, opts) {
    popAll();
    if (current && roots[current] && current !== id) { roots[current].el.classList.add("hidden"); roots[current].onHide && roots[current].onHide(); }
    var fresh = false;
    if (!roots[id]) { roots[id] = make(id, {}, true); viewsEl.appendChild(roots[id].el); fresh = true; }
    var r = roots[id];
    r.el.classList.remove("hidden");
    if (current !== id) { r.el.classList.remove("tabview"); void r.el.offsetWidth; r.el.classList.add("tabview"); }
    current = id;
    if (!fresh || true) r.onShow && r.onShow(opts || {});
    syncNav();
  }
  function push(name, params) {
    var top = stack.length ? stack[stack.length - 1] : roots[current];
    top && top.onHide && top.onHide();
    var s = make(name, params, false);
    s.el.classList.add("enter");
    viewsEl.appendChild(s.el);
    stack.push(s);
    setTimeout(function () { s.el.classList.remove("enter"); }, 300);
    s.onShow && s.onShow();
    syncNav();
    return s;
  }
  function replace(name, params) {
    if (stack.length) { var s = stack.pop(); s.onHide && s.onHide(); s.destroy && s.destroy(); s.el.remove(); }
    return push(name, params);
  }
  function back() {
    if (OM.ui.closeTopLayer()) return true;
    if (stack.length) {
      var s = stack[stack.length - 1];
      if (s.onBack && s.onBack() === true) return true;
      stack.pop();
      s.onHide && s.onHide(); s.destroy && s.destroy();
      s.el.classList.add("leave");
      setTimeout(function () { s.el.remove(); }, 200);
      var top = stack.length ? stack[stack.length - 1] : roots[current];
      top && top.onShow && top.onShow({ back: true });
      syncNav();
      return true;
    }
    if (current !== "inicio") { tab("inicio"); return true; }
    return false;
  }
  /* app em segundo plano: pausa a tela visível (libera microfone) e retoma ao voltar */
  function suspend(on) {
    var top = stack.length ? stack[stack.length - 1] : roots[current];
    if (!top) return;
    if (on) top.onHide && top.onHide(); else top.onShow && top.onShow({ resume: true });
  }
  function refreshRoots() { Object.keys(roots).forEach(function (k) { if (k !== current) { roots[k].destroy && roots[k].destroy(); roots[k].el.remove(); delete roots[k]; } }); }

  OM.router = { TABS: TABS, register: register, init: init, tab: tab, push: push, replace: replace, back: back, refreshRoots: refreshRoots, suspend: suspend,
    current: function () { return current; }, depth: function () { return stack.length; } };
  OM.screen = register;
})(window.OM);
