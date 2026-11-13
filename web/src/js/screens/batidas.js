/* O Músico — Batidas: acompanhamento com batida/dedilhado, bateria e clique sobre uma progressão de acordes */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory;

  var PROGS = [
    { id: "pop", n: "I – V – vi – IV", deg: [[0, ""], [7, ""], [9, "m"], [5, ""]] },
    { id: "classic", n: "I – IV – V – I", deg: [[0, ""], [5, ""], [7, "7"], [0, ""]] },
    { id: "sad", n: "vi – IV – I – V", deg: [[9, "m"], [5, ""], [0, ""], [7, ""]] },
    { id: "doowop", n: "I – vi – IV – V", deg: [[0, ""], [9, "m"], [5, ""], [7, ""]] },
    { id: "jazz", n: "ii – V – I", deg: [[2, "m7"], [7, "7"], [0, "7M"], [0, "7M"]] },
    { id: "blues", n: "Blues 12 compassos", deg: [[0, "7"], [5, "7"], [0, "7"], [0, "7"], [5, "7"], [5, "7"], [0, "7"], [0, "7"], [7, "7"], [5, "7"], [0, "7"], [7, "7"]] },
    { id: "minor", n: "i – iv – V – i (menor)", deg: [[0, "m"], [5, "m"], [7, "7"], [0, "m"]], minor: true },
    { id: "andaluz", n: "Cadência andaluza", deg: [[0, "m"], [10, ""], [8, ""], [7, ""]], minor: true }
  ];
  function progChords(pr, key) {
    var r = T.pc(key), fl = T.keyUsesFlats(key + (pr.minor ? "m" : ""));
    return pr.deg.map(function (d) { return T.name(r + d[0], fl) + d[1]; });
  }
  var GLYPH = { D: "↓", d: "↓", U: "↑", u: "↑", x: "✕", k: "•", B: "P", b: "p", i: "i", m: "m", a: "a", C: "C", P: "P+", ".": "" };
  function stepRow(strum) {
    var row = h("div.strum", { style: { gridTemplateColumns: "repeat(" + strum.p.length + ",1fr)" } });
    strum.p.split("").forEach(function (c, i) {
      var cell = h("div.st" + (c === "." ? ".rest" : "") + ("du".indexOf(c) >= 0 ? ".light" : "") + ("BbP".indexOf(c) >= 0 ? ".bass" : ""), { "data-i": i },
        h("b", { text: GLYPH[c] || c }), h("small", { text: i % strum.spb === 0 ? String(i / strum.spb + 1) : strum.spb === 2 ? "e" : strum.spb === 3 ? (i % 3 === 1 ? "e" : "a") : ["", "e", "&", "a"][i % 4] }));
      row.appendChild(cell);
    });
    return row;
  }
  OM.strumRow = stepRow;

  OM.screen("batidas", function (p) {
    var st = OM.store.get("batidas", {});
    var strum = OM.getStrum(p.strum || st.strum || "pop"), key = st.key || "G", progId = st.prog || "pop", custom = st.custom || "";
    var bpm = st.bpm || 90, bpc = st.bpc || 4, useStrum = st.useStrum !== false, useDrums = !!st.useDrums, useClick = !!st.useClick;
    var inst = OM.inst.pref(["string", "keys"]);
    var acc = null, cat = strum.cat;
    var content = h("div.content");
    var bar = ui.topbar({ title: "Batidas", sub: "Acompanhamento para praticar", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function save() { OM.store.set("batidas", { strum: strum.id, key: key, prog: progId, custom: custom, bpm: bpm, bpc: bpc, useStrum: useStrum, useDrums: useDrums, useClick: useClick }); }
    function chords() {
      if (progId === "custom") return custom.split(/[\s,|]+/).filter(function (c) { return T.parseChord(c); });
      return progChords(PROGS.filter(function (x) { return x.id === progId; })[0], key);
    }
    var playBtn = h("button.bigplay", { style: { width: "64px", height: "64px" }, "aria-label": "Tocar/parar", onclick: toggle });
    var curEl = h("div.bt-cur"), nextEl = h("div.bt-next"), patBox = h("div"), progBox = h("div"), diagBox = h("div.chordstrip", { style: { margin: "6px -16px 0" } }), descEl = h("p.muted", { style: { fontSize: "13px", margin: "6px 0 0" } });
    function drawPattern() {
      OM.u.clear(patBox);
      patBox.appendChild(stepRow(strum));
      descEl.textContent = strum.d + " (" + strum.beats + " tempos)";
    }
    function drawProg() {
      OM.u.clear(progBox); OM.u.clear(diagBox);
      var list = chords();
      list.forEach(function (c, i) {
        var d = ui.chordView(c, inst, { size: inst.kind === "keys" ? 64 : 70, max: 1 });
        d.setAttribute("data-i", i); d.style.cursor = "pointer";
        d.onclick = function () { if (acc) acc.jump(i); else ui.playChord(c, inst); };
        diagBox.appendChild(d);
      });
      curEl.textContent = list[0] || "–"; nextEl.textContent = list[1] ? "depois: " + list[1] : "";
    }
    function toggle() { acc ? stop() : start(); }
    function start() {
      var list = chords();
      if (!list.length) { ui.toast("Escreva acordes válidos na progressão"); return; }
      acc = new OM.Accomp({ bpm: bpm, beats: strum.beats === 3 ? 3 : 4, chords: list.map(function (c) { return { name: c, beats: bpc }; }), strum: useStrum ? strum : null,
        groove: useDrums ? OM.grooveFor(strum.id) : null, click: useClick || (!useStrum && !useDrums), inst: inst, countIn: 1,
        onCount: function (n) { curEl.textContent = n; nextEl.textContent = "prepare-se"; },
        onStep: function (s) { [].forEach.call(patBox.querySelectorAll(".st"), function (c) { c.classList.toggle("on", +c.getAttribute("data-i") === s); }); },
        onBeat: function (b) {
          curEl.textContent = list[b.idx]; nextEl.textContent = "depois: " + list[(b.idx + 1) % list.length] + " · tempo " + (b.inChord + 1) + "/" + b.chordBeats;
          [].forEach.call(diagBox.children, function (d) { d.classList.toggle("cur", +d.getAttribute("data-i") === b.idx); });
        } });
      acc.start(); playBtn.innerHTML = OM.icon("stop");
      acc.t0 = Date.now();
    }
    function stop() {
      if (!acc) return;
      var min = (Date.now() - acc.t0) / 60000;
      acc.stop(); acc = null; playBtn.innerHTML = OM.icon("play");
      [].forEach.call(patBox.querySelectorAll(".st.on"), function (c) { c.classList.remove("on"); });
      if (min >= 1) OM.lib.log({ type: "tool", icon: "guitar", screen: "batidas", title: "Batida: " + strum.n, detail: bpm + " BPM", minutes: Math.round(min * 10) / 10 });
    }
    function restart() { if (acc) { stop(); start(); } }

    content.appendChild(h("div.bt-stage", h("div", { style: { flex: 1, minWidth: 0 } }, curEl, nextEl), playBtn));
    content.appendChild(patBox);
    content.appendChild(descEl);
    var bpmSt = ui.stepper(bpm, 40, 220, 2, function (v) { return v + " BPM"; }, function (v) { bpm = v; save(); if (acc) acc.set("bpm", v); });
    var tapF = OM.metro.tapper();
    content.appendChild(h("div", { style: { display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", flexWrap: "wrap" } }, bpmSt,
      ui.btn("Tap tempo", "tap", function () { var b = tapF(); if (b) { bpm = Math.max(40, Math.min(220, b)); bpmSt.set(bpm); save(); if (acc) acc.set("bpm", bpm); } }, "sm ghost")));

    content.appendChild(h("div.lbl", { text: "Batida" }));
    var cats = OM.STRUMS.map(function (s) { return s.cat; }).filter(function (c, i, a) { return a.indexOf(c) === i; });
    var listBox = h("div");
    function drawList() {
      OM.u.clear(listBox);
      listBox.appendChild(ui.seg(cats.map(function (c) { return { v: c, label: c }; }), cat, function (v) { cat = v; drawList(); }));
      listBox.appendChild(h("div.chips.wrap", { style: { marginTop: "10px" } }, OM.STRUMS.filter(function (s) { return s.cat === cat; }).map(function (s) {
        return h("button.chip" + (s.id === strum.id ? ".on" : ""), { text: s.n, onclick: function () { strum = s; save(); drawPattern(); drawList(); restart(); } });
      })));
    }
    drawList();
    content.appendChild(listBox);

    content.appendChild(h("div.lbl", { text: "Acordes" }));
    var kr = h("div.keyrow");
    T.ROOTS.forEach(function (r) { kr.appendChild(h("button" + (r === key ? ".on" : ""), { text: T.display(r), onclick: function () { key = r; save(); [].forEach.call(kr.children, function (b) { b.classList.toggle("on", b.textContent === T.display(r)); }); drawProg(); restart(); } })); });
    var customInp = h("input.inp", { type: "text", value: custom, placeholder: "Ex.: G D/F# Em C Am7 D" });
    customInp.addEventListener("input", OM.u.debounce(function () { custom = customInp.value; save(); drawProg(); }, 300));
    var customField = h("div", { style: { marginTop: "8px" } }, customInp);
    var progSel = h("select.inp", PROGS.map(function (x) { return h("option", { value: x.id, text: x.n }); }), h("option", { value: "custom", text: "Minha sequência…" }));
    progSel.value = progId;
    progSel.onchange = function () { progId = progSel.value; save(); customField.classList.toggle("hidden", progId !== "custom"); kr.classList.toggle("hidden", progId === "custom"); drawProg(); restart(); };
    customField.classList.toggle("hidden", progId !== "custom"); kr.classList.toggle("hidden", progId === "custom");
    content.appendChild(progSel);
    content.appendChild(customField);
    content.appendChild(h("div", { style: { marginTop: "8px" } }, kr));
    content.appendChild(diagBox);
    content.appendChild(h("div.card", { style: { padding: "4px 14px", marginTop: "10px" } },
      ui.row("Tempos por acorde", ui.stepper(bpc, 1, 16, 1, null, function (v) { bpc = v; save(); restart(); })),
      ui.row("Som da batida (" + (inst.kind === "keys" ? "teclado" : inst.n) + ")", ui.toggle(useStrum, function (v) { useStrum = v; save(); restart(); })),
      ui.row("Bateria junto", ui.toggle(useDrums, function (v) { useDrums = v; save(); restart(); })),
      ui.row("Clique do metrônomo", ui.toggle(useClick, function (v) { useClick = v; save(); restart(); }))));
    content.appendChild(h("div", { style: { marginTop: "10px" } }, ui.instSwitch({ kinds: ["string", "keys"], current: inst, onChange: function (i) { inst = i; drawProg(); if (acc) acc.set("inst", i); } })));
    content.appendChild(h("div.card", { style: { marginTop: "14px" } }, h("h3", { text: "Como ler" }),
      h("p.muted", { style: { fontSize: "13px", lineHeight: 1.6 }, text: "↓ para baixo · ↑ para cima (pequeno = leve) · ✕ abafada · • acorde curto · P/p polegar no baixo (fundamental/alternado) · i m a dedos indicador, médio e anelar · C pinça (três dedos juntos). Números = tempos; “e” = contratempo." })));
    drawPattern(); drawProg();
    return { el: el, destroy: stop, onHide: stop };
  });
})(window.OM);
