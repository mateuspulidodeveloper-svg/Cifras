/* O Músico — gerador de escalas (braço, teclado, campo harmônico, reprodução) */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory;

  OM.screen("scales", function (p) {
    var root = p.root || "C", sid = p.scale || "major", inst = OM.inst.current();
    if (!OM.inst.hasStrings(inst) && inst.kind !== "keys") inst = OM.inst.get("violao");
    var label = "note", bpm = 90, stopPlay = null;
    var content = h("div.content");
    var bar = ui.topbar({ title: "Gerador de escalas", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var body = h("div");
    var kr = h("div.keyrow");
    T.ROOTS.forEach(function (r) { kr.appendChild(h("button" + (r === root ? ".on" : ""), { text: T.display(r), onclick: function () { root = r; [].forEach.call(kr.children, function (b) { b.classList.toggle("on", b.textContent === T.display(r)); }); draw(); } })); });
    var sel = h("select.inp", T.SCALES.map(function (s) { return h("option", { value: s.id, text: s.n }); }));
    sel.value = sid; sel.onchange = function () { sid = sel.value; draw(); };
    content.appendChild(h("div.lbl", { text: "Tônica" }));
    content.appendChild(kr);
    content.appendChild(h("div.lbl", { text: "Escala" }));
    content.appendChild(sel);
    content.appendChild(body);

    function draw() {
      if (stopPlay) { stopPlay(); stopPlay = null; }
      OM.u.clear(body);
      var sc = T.SCALES.filter(function (s) { return s.id === sid; })[0], rp = T.pc(root);
      var spelledRoot = (sid === "major" || sid === "lydian" || sid === "mixolydian" || sid === "pentmaj" || sid === "nordestina") ? ({ "C#": "Db", "D#": "Eb", "G#": "Ab", "A#": "Bb" }[root] || root) : root;
      var names = T.spellScale(spelledRoot, sc.i);
      body.appendChild(h("div.lbl", { text: "Notas" }));
      body.appendChild(h("div.notes-row", names.map(function (n, i) {
        return h("span.notepill" + (i === 0 ? ".rt" : ""), { text: T.display(n), onclick: function () { OM.synth.note(60 + T.mod12(rp + sc.i[i]) + (T.mod12(rp + sc.i[i]) < T.mod12(rp) ? 12 : 0), inst); } }, h("small", { text: T.SCALE_INT[sc.i[i]] }));
      })));
      var steps = sc.i.map(function (v, i) { var nx = i + 1 < sc.i.length ? sc.i[i + 1] : 12; return nx - v === 1 ? "S" : nx - v === 2 ? "T" : nx - v === 3 ? "T½" : "?"; });
      body.appendChild(h("p.muted", { style: { fontSize: "13px", marginTop: "8px" }, text: "Estrutura: " + steps.join(" – ") }));
      /* reprodução */
      var playBtn = ui.btn("Tocar escala", "play", function () {
        if (stopPlay) { stopPlay(); stopPlay = null; playBtn.lastChild.textContent = "Tocar escala"; return; }
        var base = 60 + rp - (rp > 6 ? 12 : 0), seq = sc.i.map(function (v) { return base + v; }).concat([base + 12]);
        seq = seq.concat(seq.slice(0, -1).reverse());
        var c = OM.audio.context(), t = c.currentTime + 0.05, beat = 60 / bpm, timers = [];
        seq.forEach(function (m, i) { OM.synth.note(m, inst, t + i * beat / 2, 0.4); });
        playBtn.lastChild.textContent = "Parar";
        timers.push(setTimeout(function () { stopPlay = null; playBtn.lastChild.textContent = "Tocar escala"; }, seq.length * beat / 2 * 1000 + 300));
        stopPlay = function () { timers.forEach(clearTimeout); };
      }, "pri sm");
      body.appendChild(h("div", { style: { display: "flex", gap: "10px", alignItems: "center", marginTop: "12px" } }, playBtn,
        ui.stepper(bpm, 40, 220, 10, function (v) { return v + " bpm"; }, function (v) { bpm = v; })));
      /* braço / teclado */
      var pcs = sc.i.map(function (v) { return T.mod12(rp + v); });
      function lbl(pc) { var k = pcs.indexOf(pc); return label === "note" ? T.display(names[k]).replace("♯", "#").replace("♭", "b") : label === "deg" ? T.SCALE_INT[sc.i[k]] : ""; }
      if (OM.inst.hasStrings(inst)) {
        var t = OM.inst.tuningOf(inst), tm = OM.inst.tuningMidi(t);
        body.appendChild(h("div.lbl", { text: inst.n + " · " + t.n }));
        body.appendChild(ui.seg([{ v: "note", label: "Notas" }, { v: "deg", label: "Intervalos" }, { v: "none", label: "Pontos" }], label, function (v) { label = v; draw(); }));
        body.appendChild(h("div", { style: { height: "10px" } }));
        body.appendChild(ui.fretboard({ tuning: tm, frets: Math.min(15, inst.frets || 15), marks: function (s, f) {
          var pc = T.mod12(tm[s] + f); if (pcs.indexOf(pc) < 0) return null;
          return { label: lbl(pc), root: pc === rp };
        }, onTap: function (s, f) { OM.synth.note(tm[s] + f, inst); } }));
      }
      body.appendChild(h("div.lbl", { text: "Teclado" }));
      var from = 48, hl = []; for (var m = from; m <= 76; m++) if (pcs.indexOf(T.mod12(m)) >= 0) hl.push(m);
      body.appendChild(h("div.card", { style: { padding: "10px" } }, ui.piano({ from: from, to: 76, hl: hl, roots: [rp], labels: true, flats: names.some(function (n) { return n.indexOf("b") > 0; }), onKey: function (m) { OM.synth.piano(m); } })));
      /* campo harmônico */
      var hf = T.harmonicField(spelledRoot, sc.i);
      if (hf.length) {
        body.appendChild(h("div.lbl", { text: "Campo harmônico" }));
        var g = h("div.harm");
        hf.forEach(function (c) { g.appendChild(h("button", { onclick: function () { OM.router.push("chord", { name: c.tetrad }); } }, h("small", { text: c.degree }), h("b", { text: c.triad }), h("small", { text: c.tetrad, style: { color: "var(--tx2)" } }))); });
        body.appendChild(g);
        body.appendChild(h("p.dim", { style: { fontSize: "12px", marginTop: "8px" }, text: "Toque num acorde para ver as digitações." }));
      }
      body.appendChild(h("div.btnrow", { style: { marginTop: "16px" } }, ui.btn("Praticar no exercício de escalas", "learn", function () { OM.router.push("exercise", { id: "scales" }); }, "ghost sm")));
    }
    draw();
    return { el: el, destroy: function () { if (stopPlay) stopPlay(); } };
  });
})(window.OM);
