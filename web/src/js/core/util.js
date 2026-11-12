/* O Músico — utilitários de DOM e formatação */
window.OM = window.OM || {};
(function (OM) {
  "use strict";

  /* h("div.cls#id", {props}, ...filhos) — cria elementos */
  function h(sel, props) {
    var m = /^([a-z0-9]+)?([^]*)$/i.exec(sel || "div");
    var tag = m[1] || "div", rest = m[2] || "";
    var el = /^(svg|path|circle|rect|line|text|g|polyline|polygon|ellipse)$/.test(tag)
      ? document.createElementNS("http://www.w3.org/2000/svg", tag) : document.createElement(tag);
    rest.replace(/([.#])([\w-]+)/g, function (_, t, v) {
      if (t === ".") el.classList.add(v); else el.id = v;
    });
    var start = 1;
    if (props && typeof props === "object" && !(props instanceof Node) && !Array.isArray(props)) {
      start = 2;
      for (var k in props) {
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === "class") v.split(/\s+/).forEach(function (c) { if (c) el.classList.add(c); });
        else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
        else if (k === "html") el.innerHTML = v;
        else if (k === "text") el.textContent = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") el.addEventListener(k.slice(2), v);
        else if (k === "value" && "value" in el) el.value = v;
        else if (k === "checked") el.checked = !!v;
        else el.setAttribute(k, v === true ? "" : v);
      }
    }
    for (var i = start; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, c) {
    if (c == null || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { add(el, x); }); return; }
    el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  function svg(markup, cls) {
    var d = document.createElement("div");
    d.innerHTML = markup;
    var s = d.firstChild;
    if (cls) s.setAttribute("class", cls);
    return s;
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function uid(p) { return (p || "id") + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function debounce(fn, ms) {
    var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); };
  }
  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function fmtDur(min) {
    min = Math.round(min);
    if (min < 60) return min + " min";
    return Math.floor(min / 60) + " h " + (min % 60 ? (min % 60) + " min" : "");
  }
  function fmtDate(ts) {
    var d = new Date(ts), now = new Date();
    var day = 864e5, t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var hm = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    if (ts >= t0) return "Hoje, " + hm;
    if (ts >= t0 - day) return "Ontem, " + hm;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) + ", " + hm;
  }
  function dayKey(ts) { var d = new Date(ts || Date.now()); return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate(); }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rangeFill(input) {
    var p = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.setProperty("--p", p + "%");
  }
  /* cor estável a partir de um texto (capas) */
  function hue(s) { var x = 0; for (var i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) % 360; return x; }

  OM.u = { h: h, svg: svg, clear: clear, esc: esc, norm: norm, clamp: clamp, uid: uid, debounce: debounce, fmtTime: fmtTime,
    fmtDur: fmtDur, fmtDate: fmtDate, dayKey: dayKey, shuffle: shuffle, pick: pick, rangeFill: rangeFill, hue: hue };
})(window.OM);
