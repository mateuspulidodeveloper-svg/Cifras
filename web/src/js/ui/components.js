/* O Músico — componentes de interface reutilizáveis */
(function (OM) {
  "use strict";
  var h = OM.u.h, T = OM.theory;
  var layers = []; /* folhas/diálogos abertos (fechados pelo botão Voltar) */

  function ibtn(icon, onClick, title, cls) {
    return h("button.ibtn" + (cls ? "." + cls.split(" ").join(".") : ""), { "aria-label": title || icon, title: title || "", html: OM.icon(icon), onclick: onClick });
  }
  function btn(label, icon, onClick, cls) {
    var b = h("button.btn" + (cls ? "." + cls.split(" ").join(".") : ""), { onclick: onClick });
    if (icon) b.insertAdjacentHTML("beforeend", OM.icon(icon));
    if (label) b.appendChild(document.createTextNode(label));
    return b;
  }
  function toast(msg, ms) {
    var old = document.querySelector(".toast"); if (old) old.remove();
    var t = h("div.toast", { text: msg });
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, ms || 2200);
  }
  function topbar(o) {
    var bar = h("header.topbar");
    if (o.back) bar.appendChild(ibtn("back", function () { OM.router.back(); }, "Voltar"));
    if (o.brand) bar.appendChild(o.brand);
    else {
      var tw = h("div.titlewrap", h("h1", { text: o.title || "" }));
      if (o.sub) tw.appendChild(h("span.sub", { text: o.sub }));
      if (!o.back) tw.style.paddingLeft = "10px";
      bar.appendChild(tw);
    }
    (o.actions || []).forEach(function (a) { if (a) bar.appendChild(a); });
    return bar;
  }
  /* liga a borda inferior do topo ao rolar */
  function scrollShadow(content, bar) {
    content.addEventListener("scroll", function () { bar.classList.toggle("scrolled", content.scrollTop > 4); }, { passive: true });
  }

  /* ---------- folha inferior ---------- */
  function sheet(o) {
    var scrim = h("div.scrim"), sh = h("div.sheet", { role: "dialog" });
    var body = h("div.sb");
    sh.appendChild(h("div.grab"));
    var head = h("div.sh", h("h3", { text: o.title || "" }));
    head.appendChild(ibtn("close", function () { api.close(); }, "Fechar"));
    sh.appendChild(head);
    if (o.content) body.appendChild(o.content);
    sh.appendChild(body);
    scrim.onclick = function () { api.close(); };
    document.body.appendChild(scrim); document.body.appendChild(sh);
    var closed = false;
    var api = {
      el: sh, body: body,
      close: function (silent) {
        if (closed) return; closed = true;
        layers = layers.filter(function (l) { return l !== api; });
        sh.classList.add("out"); scrim.style.opacity = 0; scrim.style.transition = "opacity .18s";
        setTimeout(function () { sh.remove(); scrim.remove(); }, 190);
        if (o.onClose && !silent) o.onClose();
      }
    };
    layers.push(api);
    return api;
  }
  function closeTopLayer() { if (!layers.length) return false; layers[layers.length - 1].close(); return true; }

  function menu(title, items) {
    var list = h("div.list.menu");
    var s;
    items.filter(Boolean).forEach(function (it) {
      list.appendChild(item({ icon: it.icon, title: it.label, sub: it.sub, iconCls: it.danger ? "" : "acc", end: it.end,
        onClick: function () { s.close(true); setTimeout(it.onClick, 10); } }));
    });
    s = sheet({ title: title, content: list });
    return s;
  }
  function confirm(text, okLabel, danger) {
    return new Promise(function (res) {
      var done = false;
      var c = h("div", h("p.muted", { text: text, style: { marginBottom: "18px" } }),
        h("div.btnrow", btn("Cancelar", null, function () { done = true; s.close(true); res(false); }, "ghost"),
          btn(okLabel || "Confirmar", null, function () { done = true; s.close(true); res(true); }, danger ? "danger" : "pri")));
      var s = sheet({ title: "Confirmar", content: c, onClose: function () { if (!done) res(false); } });
    });
  }
  function prompt(title, label, value, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      var done = false;
      var inp = opts.multiline ? h("textarea.inp" + (opts.code ? ".code" : ""), { placeholder: opts.placeholder || "", spellcheck: "false" })
        : h("input.inp", { type: "text", placeholder: opts.placeholder || "", maxlength: opts.max || 120 });
      inp.value = value || "";
      function ok() { var v = inp.value.trim(); if (!v && !opts.allowEmpty) { inp.focus(); return; } done = true; s.close(true); res(v); }
      if (!opts.multiline) inp.addEventListener("keydown", function (e) { if (e.key === "Enter") ok(); });
      var c = h("div", h("label.field", h("span", { text: label || "" }), inp),
        h("div.btnrow", btn("Cancelar", null, function () { done = true; s.close(true); res(null); }, "ghost"), btn(opts.ok || "Salvar", null, ok, "pri")));
      var s = sheet({ title: title, content: c, onClose: function () { if (!done) res(null); } });
      setTimeout(function () { inp.focus(); }, 280);
    });
  }
  function pick(title, options, current) {
    return new Promise(function (res) {
      var done = false, list = h("div.list.menu");
      options.forEach(function (o) {
        list.appendChild(item({ title: o.label, sub: o.sub, end: o.v === current ? h("span", { html: OM.icon("check"), style: { color: "var(--acc)" } }) : null,
          onClick: function () { done = true; s.close(true); res(o.v); } }));
      });
      var s = sheet({ title: title, content: list, onClose: function () { if (!done) res(undefined); } });
      var on = list.querySelector(".end svg"); if (on) setTimeout(function () { on.closest(".item").scrollIntoView({ block: "center" }); }, 50);
    });
  }

  /* ---------- controles ---------- */
  function seg(options, value, onChange) {
    var el = h("div.seg");
    function draw() {
      OM.u.clear(el);
      options.forEach(function (o) {
        el.appendChild(h("button" + (o.v === value ? ".on" : ""), { text: o.label, onclick: function () { value = o.v; draw(); onChange(o.v); } }));
      });
    }
    draw(); el.set = function (v) { value = v; draw(); };
    return el;
  }
  function chips(options, value, onChange, wrap) {
    var el = h("div.chips" + (wrap ? ".wrap" : ""));
    function draw() {
      OM.u.clear(el);
      options.forEach(function (o) {
        var c = h("button.chip" + (o.v === value ? ".on" : ""), { onclick: function () { value = o.v; draw(); onChange(o.v); } });
        if (o.icon) c.insertAdjacentHTML("beforeend", OM.icon(o.icon));
        c.appendChild(document.createTextNode(o.label));
        el.appendChild(c);
      });
    }
    draw(); el.set = function (v) { value = v; draw(); };
    return el;
  }
  function toggle(checked, onChange) {
    var inp = h("input", { type: "checkbox", checked: checked, onchange: function () { onChange(inp.checked); } });
    return h("label.sw", inp, h("i"));
  }
  function stepper(value, min, max, step, fmt, onChange) {
    var b = h("b", { text: fmt ? fmt(value) : value });
    function setV(v) { value = Math.max(min, Math.min(max, v)); b.textContent = fmt ? fmt(value) : value; onChange(value); }
    var el = h("div.stepper", h("button", { html: OM.icon("minus"), "aria-label": "Diminuir", onclick: function () { setV(value - step); } }), b,
      h("button", { html: OM.icon("plus"), "aria-label": "Aumentar", onclick: function () { setV(value + step); } }));
    el.set = function (v) { value = v; b.textContent = fmt ? fmt(v) : v; };
    return el;
  }
  function range(min, max, step, value, onInput) {
    var r = h("input", { type: "range", min: min, max: max, step: step, value: value });
    OM.u.rangeFill(r);
    r.addEventListener("input", function () { OM.u.rangeFill(r); onInput(+r.value); });
    r.set = function (v) { r.value = v; OM.u.rangeFill(r); };
    return r;
  }
  function row(label, control) { return h("div.kv", h("span", { text: label }), control); }
  function item(o) {
    var el = h("button.item", { onclick: o.onClick });
    if (o.icon) el.appendChild(h("div.ic" + (o.iconCls ? "." + o.iconCls : ""), { html: OM.icon(o.icon) }));
    if (o.lead) el.appendChild(o.lead);
    var tx = h("div.tx", h("div.t", { text: o.title }));
    if (o.sub) tx.appendChild(h("div.s", { text: o.sub }));
    el.appendChild(tx);
    if (o.end !== null) el.appendChild(h("div.end", o.end || h("span", { html: OM.icon("chev") })));
    return el;
  }
  function empty(icon, text, button) {
    var e = h("div.empty", { html: OM.icon(icon) });
    e.appendChild(h("p", { text: text }));
    if (button) e.appendChild(button);
    return e;
  }
  function sec(title, link, onLink) {
    var s = h("div.sec", h("h2", { text: title }));
    if (link) s.appendChild(h("button.lnk", { text: link, onclick: onLink }));
    return s;
  }
  function diff(n) {
    var d = h("span.diff", { title: "Dificuldade " + n + "/5" });
    for (var i = 1; i <= 5; i++) d.appendChild(h("i" + (i <= n ? ".on" : "")));
    return d;
  }
  function notice(text, err, icon) { return h("div.notice" + (err ? ".err" : ""), { html: OM.icon(icon || (err ? "alert" : "info")) }, h("span", { text: text })); }

  /* ---------- diagrama de acorde (cordas) ---------- */
  function chordDiagram(name, v, opts) {
    opts = opts || {};
    var n = v.frets.length, sx = n > 6 ? 11 : n <= 4 ? 15 : 13, sy = 16, rows = n <= 4 ? 5 : 5;
    var lefty = OM.store.settings().leftHanded;
    var frets = v.frets.slice(), fingers = v.fingers.slice();
    if (lefty) { frets.reverse(); fingers.reverse(); }
    var fretted = frets.filter(function (f) { return f > 0; });
    var maxF = fretted.length ? Math.max.apply(null, fretted) : 0, minF = fretted.length ? Math.min.apply(null, fretted) : 0;
    var start = maxF <= rows ? 1 : minF;
    var W = (n - 1) * sx, H = rows * sy, ox = 16, oy = 18;
    var tuningPcs = opts.tuning ? (lefty ? opts.tuning.slice().reverse() : opts.tuning) : null;
    var ch = T.parseChord(name);
    var s = ['<svg viewBox="0 0 ' + (W + ox + 10) + " " + (H + oy + (opts.labels ? 16 : 6)) + '" width="' + (opts.size || 96) * (W + ox + 10) / 100 + '">'];
    s.push('<g transform="translate(' + ox + "," + oy + ')">');
    for (var r = 0; r <= rows; r++) s.push('<line class="dg-grid" x1="0" x2="' + W + '" y1="' + r * sy + '" y2="' + r * sy + '" stroke-width="' + (r === 0 && start === 1 ? 0 : 1) + '"/>');
    if (start === 1) s.push('<rect class="dg-nut" x="-1" y="-3" width="' + (W + 2) + '" height="4" rx="1"/>');
    else s.push('<text class="dg-txt" x="-6" y="' + (sy / 2 + 3) + '" text-anchor="end">' + start + "</text>");
    for (var i = 0; i < n; i++) s.push('<line class="dg-grid" x1="' + i * sx + '" x2="' + i * sx + '" y1="0" y2="' + H + '"/>');
    if (v.barre) {
      var b0 = lefty ? n - 1 - v.barre.to : v.barre.from, b1 = lefty ? n - 1 - v.barre.from : v.barre.to;
      var by = (v.barre.fret - start + 0.5) * sy;
      s.push('<rect class="dg-dot" x="' + (b0 * sx - 6) + '" y="' + (by - 6) + '" width="' + ((b1 - b0) * sx + 12) + '" height="12" rx="6"/>');
    }
    frets.forEach(function (f, si) {
      var x = si * sx;
      if (f < 0) s.push('<path class="dg-x" d="M' + (x - 3.5) + " -12.5l7 7m0 -7l-7 7" + '" stroke-width="1.6"/>');
      else if (f === 0) s.push('<circle class="dg-ox" cx="' + x + '" cy="-9" r="3.6" stroke-width="1.5"/>');
      else {
        var y = (f - start + 0.5) * sy;
        var midi = tuningPcs ? tuningPcs[si] + f : null;
        var isRoot = ch && midi != null && T.mod12(midi) === ch.rootPc;
        var onBarre = v.barre && f === v.barre.fret && fingers[si] === 1;
        if (!onBarre || isRoot) s.push('<circle class="' + (isRoot ? "dg-root" : "dg-dot") + '" cx="' + x + '" cy="' + y + '" r="6"/>');
        if (fingers[si] && !onBarre) s.push('<text class="dg-fn" x="' + x + '" y="' + (y + 3) + '" text-anchor="middle">' + fingers[si] + "</text>");
        else if (onBarre && isRoot) s.push('<text class="dg-fn" x="' + x + '" y="' + (y + 3) + '" text-anchor="middle">1</text>');
      }
      if (opts.labels && tuningPcs) {
        var nm = f >= 0 ? T.display(T.name(tuningPcs[si] + f, ch && T.keyUsesFlats(ch.root))) : "";
        s.push('<text class="dg-txt" x="' + x + '" y="' + (H + 12) + '" text-anchor="middle">' + nm + "</text>");
      }
    });
    s.push("</g></svg>");
    var wrap = h("div.cdiag");
    if (!opts.noName) wrap.appendChild(h("div.cn", { text: name }));
    wrap.insertAdjacentHTML("beforeend", s.join(""));
    return wrap;
  }

  /* ---------- teclado ---------- */
  /* o: {from, to (midi), hl: [midi], roots: [pc], labels: bool, onKey(midi)} */
  function piano(o) {
    var from = o.from || 48, to = o.to || 71, ww = 14, wh = 56, bw = 9, bh = 34;
    var whites = [], blacks = [];
    for (var m = from; m <= to; m++) { if ([1, 3, 6, 8, 10].indexOf(T.mod12(m)) >= 0) blacks.push(m); else whites.push(m); }
    var W = whites.length * ww, hl = o.hl || [], s = ['<svg class="piano" viewBox="0 0 ' + W + " " + (wh + 1) + '">'];
    var xOf = {};
    whites.forEach(function (m, i) { xOf[m] = i * ww; });
    whites.forEach(function (m) {
      var on = hl.indexOf(m) >= 0, rt = on && o.roots && o.roots.indexOf(T.mod12(m)) >= 0;
      s.push('<rect data-m="' + m + '" class="wk' + (on ? " hl" : "") + (rt ? " rt" : "") + '" x="' + xOf[m] + '" y="0" width="' + ww + '" height="' + wh + '" rx="1.5"/>');
      if (o.labels && (on || T.mod12(m) === 0 || o.labelsAll)) s.push('<text class="kl" x="' + (xOf[m] + ww / 2) + '" y="' + (wh - 5) + '">' + T.display(T.name(m, o.flats)) + (T.mod12(m) === 0 && !on ? (Math.floor(m / 12) - 1) : "") + "</text>");
    });
    blacks.forEach(function (m) {
      var x = xOf[m - 1] + ww - bw / 2, on = hl.indexOf(m) >= 0;
      s.push('<rect data-m="' + m + '" class="bk' + (on ? " hl" : "") + '" x="' + x + '" y="0" width="' + bw + '" height="' + bh + '" rx="1.2"/>');
      if (o.labels && (on || o.labelsAll)) s.push('<text class="kl b" x="' + (x + bw / 2) + '" y="' + (bh - 5) + '" style="font-size:6px">' + T.display(T.name(m, o.flats)) + "</text>");
    });
    s.push("</svg>");
    var el = OM.u.svg(s.join(""));
    if (o.onKey) el.addEventListener("pointerdown", function (e) { var m = e.target.getAttribute && e.target.getAttribute("data-m"); if (m) { e.preventDefault(); o.onKey(+m); } });
    return el;
  }

  /* ---------- braço do instrumento ---------- */
  /* o: {tuning:[midi], frets, marks: fn(string, fret) -> {label, root} | null, onTap(s,f), from} */
  function fretboard(o) {
    var tuning = o.tuning, n = tuning.length, frets = o.frets || 12, lefty = OM.store.settings().leftHanded;
    var fw = 34, sh = 20, ox = 22, oy = 12, W = ox + fw * (frets + 1) + 8, H = oy * 2 + sh * (n - 1) + 12;
    var s = ['<svg class="fretboard" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">'];
    s.push('<rect class="fb-bg" x="' + (ox + fw) + '" y="' + (oy - 6) + '" width="' + (fw * frets) + '" height="' + (sh * (n - 1) + 12) + '" rx="3"/>');
    [3, 5, 7, 9, 15, 17, 19, 21].forEach(function (f) { if (f <= frets) s.push('<circle class="fb-mark" cx="' + (ox + fw * f + fw / 2) + '" cy="' + (oy + sh * (n - 1) / 2) + '" r="4"/>'); });
    [12, 24].forEach(function (f) { if (f <= frets) { s.push('<circle class="fb-mark" cx="' + (ox + fw * f + fw / 2) + '" cy="' + (oy + sh * (n - 1) / 4) + '" r="4"/>'); s.push('<circle class="fb-mark" cx="' + (ox + fw * f + fw / 2) + '" cy="' + (oy + sh * (n - 1) * 3 / 4) + '" r="4"/>'); } });
    for (var f = 1; f <= frets + 1; f++) s.push('<line class="' + (f === 1 ? "fb-nut" : "fb-fret") + '" x1="' + (ox + fw * f) + '" x2="' + (ox + fw * f) + '" y1="' + (oy - 6) + '" y2="' + (oy + sh * (n - 1) + 6) + '"/>');
    for (var i = 0; i < n; i++) {
      /* corda mais aguda em cima (visão do músico) */
      var si = lefty ? i : n - 1 - i, y = oy + sh * i;
      s.push('<line class="fb-str" x1="' + (ox + fw) + '" x2="' + (ox + fw * (frets + 1)) + '" y1="' + y + '" y2="' + y + '" stroke-width="' + (0.8 + (si < n / 2 ? (n / 2 - si) * 0.35 : 0)) + '"/>');
      s.push('<text class="fb-sn" x="9" y="' + y + '">' + T.display(T.name(tuning[si])) + "</text>");
      for (var fr = 0; fr <= frets; fr++) {
        var cx = fr === 0 ? ox + fw / 2 + 2 : ox + fw * fr + fw / 2;
        var mk = o.marks ? o.marks(si, fr) : null;
        if (mk) {
          s.push('<circle class="fb-n' + (mk.root ? " rt" : mk.on === false ? "" : " on") + (mk.q ? " q" : "") + '" cx="' + cx + '" cy="' + y + '" r="8.5"/>');
          s.push('<text class="fb-l" x="' + cx + '" y="' + y + '">' + (mk.label || "") + "</text>");
        }
        if (o.onTap) s.push('<rect class="hit" data-s="' + si + '" data-f="' + fr + '" x="' + (cx - fw / 2) + '" y="' + (y - sh / 2) + '" width="' + fw + '" height="' + sh + '"/>');
      }
    }
    for (var k = 1; k <= frets; k++) if ([3, 5, 7, 9, 12, 15, 17, 19, 21, 24].indexOf(k) >= 0) s.push('<text class="fb-fn" x="' + (ox + fw * k + fw / 2) + '" y="' + (H - 1) + '">' + k + "</text>");
    s.push("</svg>");
    var el = h("div.fretwrap");
    el.innerHTML = s.join("");
    if (o.onTap) el.addEventListener("click", function (e) { var t = e.target; if (t.getAttribute && t.getAttribute("data-s") != null) o.onTap(+t.getAttribute("data-s"), +t.getAttribute("data-f")); });
    return el;
  }

  /* ---------- visualização de acorde conforme o instrumento ---------- */
  function chordView(name, inst, opts) {
    opts = opts || {};
    inst = inst || OM.inst.current();
    var ch = T.parseChord(name);
    if (!ch) return h("div.cdiag", h("div.cn", { text: name }), h("small.dim", { text: "?" }));
    var view = OM.inst.chordView(inst);
    if (view === "fret") {
      var vs = OM.voicings.forInstrument(name, inst, opts.max || 8);
      var t = OM.inst.tuningOf(inst), tm = OM.inst.tuningMidi(t);
      if (!vs.length) return h("div.cdiag", h("div.cn", { text: name }), h("small.dim", { text: "sem digitação" }));
      var idx = Math.min(opts.variant || 0, vs.length - 1);
      return chordDiagram(name, vs[idx], { size: opts.size, tuning: tm, labels: opts.labels, noName: opts.noName });
    }
    var mids = chordMidis(ch, 60);
    if (view === "piano") {
      var w = h("div.cdiag", { style: { width: (opts.size || 96) * 1.5 + "px" } });
      if (!opts.noName) w.appendChild(h("div.cn", { text: name }));
      w.appendChild(piano({ from: 48, to: 76, hl: mids, roots: [ch.rootPc], labels: !!opts.labels, flats: T.keyUsesFlats(ch.root) }));
      return w;
    }
    /* sopros / voz: notas do acorde (escritas para o instrumento) */
    var tr = inst.transp ? -inst.transp : 0;
    var notes = mids.map(function (m) { return T.display(T.name(m + tr, T.keyUsesFlats(ch.root))); }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var w2 = h("div.cdiag");
    if (!opts.noName) w2.appendChild(h("div.cn", { text: name }));
    w2.appendChild(h("div.notes-row", notes.map(function (nn, i) { return h("span.notepill" + (i === 0 ? ".rt" : ""), { text: nn }); })));
    return w2;
  }
  /* notas MIDI de um acorde em posição fechada a partir de uma oitava base */
  function chordMidis(ch, base) {
    var r = base + T.mod12(ch.rootPc - T.mod12(base)); if (r > base + 6) r -= 12;
    var out = ch.intervals.map(function (i) { return r + i; });
    if (ch.bass && ch.bassPc !== ch.rootPc) { var b = r - 12 + T.mod12(ch.bassPc - ch.rootPc); out.unshift(b); }
    return out;
  }
  function playChord(name, inst) {
    var ch = T.parseChord(name); if (!ch) return;
    inst = inst || OM.inst.current();
    if (inst.kind === "string") {
      var vs = OM.voicings.forInstrument(name, inst, 1);
      if (vs.length) {
        var tm = OM.inst.tuningMidi(OM.inst.tuningOf(inst));
        OM.synth.chord(vs[0].frets.map(function (f, i) { return f < 0 ? null : tm[i] + f; }).filter(function (x) { return x != null; }), inst);
        return;
      }
    }
    OM.synth.chord(chordMidis(ch, inst.kind === "string" ? 48 : 60), inst.kind === "string" ? inst : OM.inst.get("piano"));
  }
  function cover(song, big) {
    var hue = OM.u.hue(song.title + song.artist);
    return h("div.cov", { style: { background: "linear-gradient(135deg, hsl(" + hue + ",42%,30%), hsl(" + ((hue + 40) % 360) + ",48%,18%))" } },
      h("span", { text: (song.title || "?").replace(/^(o|a|the|os|as)\s+/i, "").slice(0, 2) }), h("small", { text: song.key || "", style: { fontSize: "12px", opacity: .85 } }));
  }

  /* seletor rápido de instrumento: só os instrumentos do usuário (Meus instrumentos) + "Outros".
     o: {kinds: ["string","keys"] (opcional), current: inst, onChange(inst), global: true (troca o principal)} */
  function instSwitch(o) {
    var el = h("div.instsw");
    function draw() {
      OM.u.clear(el);
      var cur = o.current || OM.inst.current();
      var mine = OM.inst.mine().filter(function (i) { return !o.kinds || o.kinds.indexOf(i.kind) >= 0; });
      if (mine.length && !mine.some(function (i) { return i.id === cur.id; })) mine.push(cur);
      if (!mine.length) mine = [cur];
      mine.forEach(function (i) {
        var b = h("button.chip" + (i.id === cur.id ? ".on" : ""), { onclick: function () {
          if (i.id === cur.id) return;
          o.current = i;
          if (o.global !== false && OM.inst.mine().some(function (x) { return x.id === i.id; })) OM.inst.setCurrent(i.id);
          draw(); o.onChange && o.onChange(i);
        } });
        b.insertAdjacentHTML("beforeend", OM.icon(OM.inst.icon(i)));
        b.appendChild(document.createTextNode(i.n));
        el.appendChild(b);
      });
      var more = h("button.chip", { onclick: function () {
        var opts = OM.inst.all().filter(function (i) { return !o.kinds || o.kinds.indexOf(i.kind) >= 0; }).map(function (i) { return { v: i.id, label: i.n, sub: OM.inst.tuningOf(i) ? OM.inst.tuningOf(i).n : null }; });
        opts.push({ v: "__edit", label: "Editar meus instrumentos…" });
        pick("Escolher instrumento", opts, cur.id).then(function (v) {
          if (!v) return;
          if (v === "__edit") { OM.router.push("myinst"); return; }
          o.current = OM.inst.get(v); draw(); o.onChange && o.onChange(o.current);
        });
      } });
      more.insertAdjacentHTML("beforeend", OM.icon("plus"));
      more.appendChild(document.createTextNode("Outros"));
      el.appendChild(more);
    }
    draw();
    el.set = function (i) { o.current = i; draw(); };
    return el;
  }

  OM.ui = { instSwitch: instSwitch, ibtn: ibtn, btn: btn, toast: toast, topbar: topbar, scrollShadow: scrollShadow, sheet: sheet, closeTopLayer: closeTopLayer, menu: menu,
    confirm: confirm, prompt: prompt, pick: pick, seg: seg, chips: chips, toggle: toggle, stepper: stepper, range: range, row: row, item: item,
    empty: empty, sec: sec, diff: diff, notice: notice, chordDiagram: chordDiagram, piano: piano, fretboard: fretboard, chordView: chordView,
    chordMidis: chordMidis, playChord: playChord, cover: cover, layers: function () { return layers.length; } };
})(window.OM);
