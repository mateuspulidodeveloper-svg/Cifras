/* O Músico — biblioteca de acordes, detalhe de acorde e gerador/identificador de acordes */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory;

  function instPicker(inst, onChange) {
    var b = ui.btn(inst.n, OM.inst.icon(inst), function () {
      var opts = OM.inst.all().filter(function (i) { return i.kind === "string" || i.kind === "keys"; }).map(function (i) { return { v: i.id, label: i.n, sub: i.kind === "keys" ? "Teclado" : OM.inst.tuningOf(i).n }; });
      ui.pick("Instrumento", opts, inst.id).then(function (v) { if (v) onChange(OM.inst.get(v)); });
    }, "sm ghost");
    return b;
  }

  /* ---------- catálogo ---------- */
  OM.screen("chords", function () {
    var inst = OM.inst.current();
    if (inst.kind !== "string" && inst.kind !== "keys") inst = OM.inst.get("violao");
    var root = "C", cat = "all", q = "";
    var content = h("div.content");
    var bar = ui.topbar({ title: "Biblioteca de acordes", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var instBox = h("div"), grid = h("div.voicings", { style: { gridTemplateColumns: "repeat(auto-fill,minmax(" + (inst.kind === "keys" ? 150 : 100) + "px,1fr))" } });
    var input = h("input", { type: "search", placeholder: "Buscar acorde (ex.: F#m7, Bb7(9), G/B)" });
    input.addEventListener("input", OM.u.debounce(function () { q = input.value.trim(); draw(); }, 150));
    var keys = h("div.keyrow");
    T.ROOTS.forEach(function (r) { keys.appendChild(h("button" + (r === root ? ".on" : ""), { text: T.display(r), onclick: function () { root = r; [].forEach.call(keys.children, function (b) { b.classList.toggle("on", b.textContent === T.display(r)); }); draw(); } })); });
    var catChips = ui.chips(T.CHORD_CATS.map(function (c) { return { v: c.id, label: c.n }; }), cat, function (v) { cat = v; draw(); });
    function drawInst() { OM.u.clear(instBox); instBox.appendChild(h("div.btnrow", instPicker(inst, function (i) { inst = i; drawInst(); grid.style.gridTemplateColumns = "repeat(auto-fill,minmax(" + (inst.kind === "keys" ? 150 : 100) + "px,1fr))"; draw(); }))); }
    function cell(name, label) {
      var c = h("button.vc", { onclick: function () { OM.router.push("chord", { name: name, inst: inst.id }); } });
      c.appendChild(ui.chordView(name, inst, { size: inst.kind === "keys" ? 90 : 84, max: 1 }));
      c.appendChild(h("small", { text: label }));
      return c;
    }
    function draw() {
      OM.u.clear(grid);
      if (q) {
        var ch = T.parseChord(q);
        if (!ch) { grid.appendChild(h("p.muted", { text: "Acorde não reconhecido. Exemplos: Am, C7M, F#m7(b5), G/B, Dsus4, E7(#9)." })); return; }
        grid.appendChild(cell(q, ch.pcs.map(function (x) { return T.display(T.name(x, T.keyUsesFlats(ch.root))); }).join(" ")));
        return;
      }
      T.CHORD_TYPES.filter(function (t) { return cat === "all" || t.cat === cat; }).forEach(function (t) { grid.appendChild(cell(root + t.id, t.n)); });
    }
    content.appendChild(instBox);
    content.appendChild(h("div.search", { style: { marginTop: "12px" }, html: OM.icon("search") }, input));
    content.appendChild(h("div.lbl", { text: "Tônica" }));
    content.appendChild(keys);
    content.appendChild(h("div", { style: { margin: "12px 0" } }, catChips));
    content.appendChild(grid);
    drawInst(); draw();
    return { el: el };
  });

  /* ---------- detalhe do acorde ---------- */
  OM.screen("chord", function (p) {
    var inst = p.inst ? OM.inst.get(p.inst) : OM.inst.current();
    if (inst.kind !== "string" && inst.kind !== "keys") inst = OM.inst.get("violao");
    var name = p.name, ch = T.parseChord(name);
    var content = h("div.content");
    var bar = ui.topbar({ title: name, sub: "Acorde", back: true });
    var el = h("section", bar, content);
    function draw() {
      OM.u.clear(content);
      if (!ch) { content.appendChild(ui.empty("alert", "Acorde não reconhecido.")); return; }
      var fl = T.keyUsesFlats(ch.root) || ch.root.indexOf("b") > 0;
      content.appendChild(h("div.btnrow", instPicker(inst, function (i) { inst = i; draw(); }), ui.btn("Ouvir", "sound", function () { ui.playChord(name, inst); }, "sm pri")));
      content.appendChild(h("div.lbl", { text: "Notas e intervalos" }));
      content.appendChild(h("div.notes-row", ch.intervals.map(function (iv, i) {
        return h("span.notepill" + (i === 0 ? ".rt" : ""), { text: T.display(T.name(ch.rootPc + iv, fl)), onclick: function () { OM.synth.note(60 + T.mod12(ch.rootPc + iv - 0), inst); } }, h("small", { text: T.intervalLabel(iv, ch.intervals) }));
      })));
      if (ch.bass && ch.bassPc !== ch.rootPc) content.appendChild(h("p.muted", { style: { fontSize: "13px", marginTop: "8px" }, text: "Baixo: " + T.display(ch.bass) + " (inversão)" }));
      content.appendChild(h("div.lbl", { text: "Teclado" }));
      content.appendChild(h("div.card", { style: { padding: "10px" } }, ui.piano({ from: 48, to: 76, hl: ui.chordMidis(ch, 60), roots: [ch.rootPc], labels: true, flats: fl, onKey: function (m) { OM.synth.piano(m); } })));
      if (inst.kind === "string") {
        var vs = OM.voicings.forInstrument(name, inst, 12), tm = OM.inst.tuningMidi(OM.inst.tuningOf(inst));
        content.appendChild(h("div.lbl", { text: "Digitações — " + inst.n + " (" + OM.inst.tuningOf(inst).n + ")" }));
        if (!vs.length) content.appendChild(h("p.muted", { text: "Nenhuma digitação tocável encontrada nesta afinação." }));
        var g = h("div.voicings");
        vs.forEach(function (v, i) {
          var c = h("button.vc", { onclick: function () { OM.synth.chord(v.frets.map(function (f, k) { return f < 0 ? null : tm[k] + f; }).filter(function (x) { return x != null; }), inst); } },
            ui.chordDiagram(name, v, { size: 92, tuning: tm, labels: true, noName: true }), h("small", { text: (i === 0 ? "Principal · " : "") + (v.base ? "casa " + v.base : "posição aberta") }));
          g.appendChild(c);
        });
        content.appendChild(g);
        content.appendChild(h("p.dim", { style: { fontSize: "12px", marginTop: "10px" }, text: "Toque num diagrama para ouvir. Ponto laranja = fundamental · ○ corda solta · × corda abafada · número = dedo." }));
      }
    }
    draw();
    return { el: el };
  });

  /* ---------- gerador / identificador ---------- */
  OM.screen("chordgen", function () {
    var inst = OM.inst.current();
    if (inst.kind !== "string" && inst.kind !== "keys") inst = OM.inst.get("violao");
    var root = "C", type = "", bass = "", mode = "build", picked = [];
    var content = h("div.content");
    var bar = ui.topbar({ title: "Gerador de acordes", back: true });
    var el = h("section", bar, content);
    var body = h("div");
    content.appendChild(ui.seg([{ v: "build", label: "Montar acorde" }, { v: "ident", label: "Identificar pelas notas" }], mode, function (v) { mode = v; draw(); }));
    content.appendChild(body);
    function name() { return root + type + (bass && bass !== root ? "/" + bass : ""); }
    function draw() {
      OM.u.clear(body);
      if (mode === "build") {
        body.appendChild(h("div.lbl", { text: "Fundamental" }));
        var kr = h("div.keyrow");
        T.ROOTS.forEach(function (r) { kr.appendChild(h("button" + (r === root ? ".on" : ""), { text: T.display(r), onclick: function () { root = r; draw(); } })); });
        body.appendChild(kr);
        body.appendChild(h("div.lbl", { text: "Tipo" }));
        var sel = h("select.inp", T.CHORD_TYPES.map(function (t) { return h("option", { value: t.id, text: (t.id || "(maior)") + " — " + t.n }); }));
        sel.value = type; sel.onchange = function () { type = sel.value; draw(); };
        body.appendChild(sel);
        body.appendChild(h("div.lbl", { text: "Baixo (inversão)" }));
        var bs = h("select.inp", h("option", { value: "", text: "Fundamental no baixo" }), T.ROOTS.map(function (r) { return h("option", { value: r, text: "/" + r }); }));
        bs.value = bass; bs.onchange = function () { bass = bs.value; draw(); };
        body.appendChild(bs);
        var nm = name();
        body.appendChild(h("div.card", { style: { marginTop: "16px", textAlign: "center" } },
          h("div", { style: { fontSize: "34px", fontWeight: 800, color: "var(--chord)" }, text: nm }),
          h("div", { style: { display: "flex", justifyContent: "center", margin: "10px 0" } }, ui.chordView(nm, inst, { size: 130, labels: true, noName: true })),
          h("div.btnrow", ui.btn("Ouvir", "sound", function () { ui.playChord(nm, inst); }, "pri"), ui.btn("Todas as digitações", "grid", function () { OM.router.push("chord", { name: nm, inst: inst.id }); }))));
      } else {
        body.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "12px 0" }, text: "Toque nas teclas para escolher as notas. O app identifica o acorde formado." }));
        body.appendChild(h("div.card", { style: { padding: "10px" } }, ui.piano({ from: 48, to: 71, hl: picked, labels: true, onKey: function (m) {
          var i = picked.indexOf(m); if (i >= 0) picked.splice(i, 1); else { picked.push(m); OM.synth.piano(m); } draw();
        } })));
        var res = identify(picked);
        body.appendChild(h("div.lbl", { text: "Resultado" }));
        if (picked.length < 2) body.appendChild(h("p.muted", { text: "Escolha pelo menos 2 notas." }));
        else if (!res.length) body.appendChild(h("p.muted", { text: "Nenhum acorde conhecido com essas notas." }));
        else {
          var l = h("div.list");
          res.slice(0, 6).forEach(function (r, i) { l.appendChild(ui.item({ lead: h("span.keybadge", { text: i === 0 ? "★" : "" + (i + 1) }), title: r.name, sub: r.desc, onClick: function () { OM.router.push("chord", { name: r.name }); } })); });
          body.appendChild(l);
        }
        body.appendChild(h("div.btnrow", { style: { marginTop: "12px" } }, ui.btn("Ouvir notas", "sound", function () { OM.synth.chord(picked, OM.inst.get("piano")); }, "sm"), ui.btn("Limpar", "trash", function () { picked = []; draw(); }, "sm ghost")));
      }
    }
    /* identificação: testa todas as fundamentais e tipos; prioriza baixo = fundamental e menos notas extras */
    function identify(ms) {
      if (ms.length < 2) return [];
      var pcs = ms.map(T.mod12).filter(function (v, i, a) { return a.indexOf(v) === i; });
      var low = T.mod12(Math.min.apply(null, ms)), out = [];
      T.ROOTS.forEach(function (r) {
        var rp = T.pc(r);
        T.CHORD_TYPES.forEach(function (t) {
          var ch = T.parseChord(r + t.id); if (!ch) return;
          var cp = ch.pcs;
          var missing = cp.filter(function (x) { return pcs.indexOf(x) < 0; }), extra = pcs.filter(function (x) { return cp.indexOf(x) < 0; });
          if (extra.length) return;
          var miss5 = missing.length === 1 && missing[0] === T.mod12(rp + 7) && cp.length >= 4;
          if (missing.length && !miss5) return;
          var sc = cp.length + (low === rp ? 0 : 3) + (miss5 ? 1 : 0) + (t.id.length * 0.05);
          var nm = r + t.id + (low !== rp ? "/" + T.name(low, T.keyUsesFlats(r)) : "");
          out.push({ name: nm, sc: sc, desc: t.n + (low !== rp ? " com baixo em " + T.display(T.name(low)) : "") + (miss5 ? " (sem a 5ª)" : "") });
        });
      });
      out.sort(function (a, b) { return a.sc - b.sc; });
      return out.filter(function (x, i, a) { return a.findIndex(function (y) { return y.name === x.name; }) === i; });
    }
    draw();
    return { el: el };
  });
})(window.OM);
