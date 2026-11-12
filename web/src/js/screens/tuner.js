/* O Músico — afinador cromático e por instrumento (análise real do microfone) */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory;

  function gauge() {
    var s = ['<svg class="tn-gauge" viewBox="0 0 300 170">'];
    s.push('<path class="zone" d="M150 160 L' + (150 + 140 * Math.sin(-7 * Math.PI / 180)) + " " + (160 - 140 * Math.cos(-7 * Math.PI / 180)) + " A140 140 0 0 1 " + (150 + 140 * Math.sin(7 * Math.PI / 180)) + " " + (160 - 140 * Math.cos(7 * Math.PI / 180)) + ' Z"/>');
    for (var c = -50; c <= 50; c += 5) {
      var a = c * 70 / 50 * Math.PI / 180, big = c % 25 === 0, r1 = big ? 118 : 126, r2 = 140;
      s.push('<line class="tick' + (big ? " big" : "") + '" stroke-width="' + (big ? 2 : 1.2) + '" x1="' + (150 + r1 * Math.sin(a)) + '" y1="' + (160 - r1 * Math.cos(a)) + '" x2="' + (150 + r2 * Math.sin(a)) + '" y2="' + (160 - r2 * Math.cos(a)) + '"/>');
      if (big) s.push('<text x="' + (150 + 104 * Math.sin(a)) + '" y="' + (164 - 104 * Math.cos(a)) + '">' + (c > 0 ? "+" + c : c) + "</text>");
    }
    s.push('<line class="needle" x1="150" y1="160" x2="150" y2="30" style="transform-origin:150px 160px"/><circle class="hub" cx="150" cy="160" r="7"/></svg>');
    return OM.u.svg(s.join(""));
  }

  OM.screen("tuner", function (p) {
    var inst = p.inst ? OM.inst.get(p.inst) : OM.inst.current();
    var mode = OM.inst.hasStrings(inst) ? "inst" : "chrom";
    var content = h("div.content");
    var bar = ui.topbar({ title: "Afinador", back: true, actions: [ui.ibtn("settings", settings, "Ajustes")] });
    var el = h("section", bar, content);
    var noteEl = h("div.tn-note", { text: "–" }), hzEl = h("div.tn-hz.num"), centsEl = h("div.tn-cents.num"), lvl = h("i");
    var dirL = h("span", { html: OM.icon("back") + "Abaixo" }), dirR = h("span", { html: "Acima" + OM.icon("chev") }), g = gauge(), needle = g.querySelector(".needle");
    var stringsEl = h("div.strings"), statusEl = h("div"), modeEl = h("div"), tuneBtn = h("div");
    var listener = null, target = -1, done = {}, inTuneSince = 0, lastShown = 0, stopRef = null, holdTimer = 0;

    function tuning() { return OM.inst.hasStrings(inst) ? OM.inst.tuningOf(inst) : null; }
    function strMidis() { var t = tuning(); return t ? OM.inst.tuningMidi(t) : []; }
    function drawMode() {
      OM.u.clear(modeEl);
      var opts = [{ v: "chrom", label: "Cromático" }];
      if (OM.inst.hasStrings(inst)) opts.push({ v: "inst", label: inst.n });
      modeEl.appendChild(ui.seg(opts, mode, function (v) { mode = v; target = -1; drawStrings(); setRange(); }));
      OM.u.clear(tuneBtn);
      tuneBtn.appendChild(h("div.btnrow", { style: { marginTop: "10px" } },
        ui.btn(inst.n, OM.inst.icon(inst), pickInst, "sm ghost"),
        tuning() && mode === "inst" ? ui.btn(tuning().n, "swap", pickTuning, "sm ghost") : null));
    }
    function pickInst() {
      var opts = OM.inst.all().filter(function (i) { return i.kind !== "drums"; }).map(function (i) { return { v: i.id, label: i.n, sub: OM.inst.hasStrings(i) ? OM.inst.tuningOf(i).n : (i.kind === "wind" ? "Cromático com transposição" : "Cromático") }; });
      ui.pick("Instrumento", opts, inst.id).then(function (v) {
        if (!v) return; inst = OM.inst.get(v); mode = OM.inst.hasStrings(inst) ? "inst" : "chrom"; target = -1; done = {};
        drawMode(); drawStrings(); setRange();
      });
    }
    function pickTuning() {
      var opts = inst.tunings.map(function (t) { return { v: t.id, label: t.n, sub: t.s.map(function (x) { return T.display(x.replace(/\d/, "")); }).join(" ") }; });
      ui.pick("Afinação", opts, tuning().id).then(function (v) { if (!v) return; OM.inst.setTuning(inst, v); done = {}; target = -1; drawMode(); drawStrings(); setRange(); });
    }
    function drawStrings() {
      OM.u.clear(stringsEl);
      if (mode !== "inst") { stringsEl.classList.add("hidden"); return; }
      stringsEl.classList.remove("hidden");
      var ms = strMidis(), t = tuning();
      ms.forEach(function (m, i) {
        var b = h("button.strbtn" + (done[i] ? ".done" : "") + (target === i ? ".sel" : ""), { "data-i": i, onclick: function () {
          target = target === i ? -1 : i; drawStrings(); playRef(m);
        } }, h("b", { text: T.display(t.s[i].replace(/-?\d+$/, "")) }), h("small", { text: (ms.length - i) + "ª · " + t.s[i].replace(/^[A-G][#b]?/, "") }));
        stringsEl.appendChild(b);
      });
      stringsEl.appendChild(h("div", { style: { width: "100%", textAlign: "center", fontSize: "12px", color: "var(--tx3)", marginTop: "2px" }, text: target >= 0 ? "Corda travada — toque de novo para modo automático" : "Detecção automática da corda · toque numa corda para ouvir a referência" }));
    }
    function playRef(m) {
      if (stopRef) { stopRef(); stopRef = null; }
      try { stopRef = OM.synth.refTone(m, 0.22); } catch (e) { return; }
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { if (stopRef) { stopRef(); stopRef = null; } }, 1600);
    }
    function setRange() {
      if (!listener) return;
      if (mode === "inst") { var ms = strMidis(); listener.setRange(T.midiToFreq(Math.min.apply(null, ms)) * 0.55, T.midiToFreq(Math.max.apply(null, ms)) * 2.2); }
      else listener.setRange(27, 2100);
    }
    function show(r) {
      var now = performance.now();
      lvl.style.width = Math.min(100, Math.sqrt(r.rms) * 260) + "%";
      if (!r.freq) {
        if (now - lastShown > 1400) { noteEl.classList.remove("ok"); needle.classList.remove("ok"); centsEl.textContent = ""; dirL.className = dirR.className = ""; markCur(-1); if (now - lastShown > 4000) { noteEl.innerHTML = "–"; hzEl.textContent = "Toque uma nota"; } }
        inTuneSince = 0;
        return;
      }
      lastShown = now;
      var cents = r.cents, midi = r.midi, si = -1;
      if (mode === "inst") {
        var ms = strMidis(), rawMidi = r.midi + r.cents / 100;
        if (target >= 0) si = target;
        else { var best = 1e9; ms.forEach(function (m, i) { var d = Math.abs(rawMidi - m); if (d < best) { best = d; si = i; } }); if (best > 3.5) si = -1; }
        if (si >= 0) { midi = ms[si]; cents = (rawMidi - ms[si]) * 100; }
      }
      markCur(si);
      var shown = midi, written = null;
      if (inst.kind === "wind" && inst.transp) written = midi - inst.transp;
      var nm = T.name(written != null ? written : shown, false), oct = Math.floor((written != null ? written : shown) / 12) - 1;
      var acc = nm.length > 1 ? nm[1] : "";
      var disp = T.display(nm[0]);
      noteEl.innerHTML = "";
      noteEl.appendChild(document.createTextNode(disp));
      if (acc) noteEl.appendChild(h("sup", { text: "♯" }));
      noteEl.appendChild(h("sub", { text: oct }));
      hzEl.textContent = r.freq.toFixed(1) + " Hz" + (written != null ? " · som real " + T.display(T.name(shown)) + (Math.floor(shown / 12) - 1) : "") + (si >= 0 ? " · alvo " + T.midiToFreq(midi).toFixed(1) + " Hz" : "");
      var c = Math.max(-60, Math.min(60, cents));
      needle.style.transform = "rotate(" + (c * 70 / 50) + "deg)";
      var ok = Math.abs(cents) < 4;
      centsEl.textContent = Math.abs(cents) > 99 ? (cents < 0 ? "Muito abaixo — aperte a corda" : "Muito acima — afrouxe a corda") : (cents > 0 ? "+" : "") + cents.toFixed(1) + " cents";
      dirL.className = !ok && cents < 0 ? "on" : ""; dirR.className = !ok && cents > 0 ? "on" : "";
      noteEl.classList.toggle("ok", ok); needle.classList.toggle("ok", ok);
      if (ok && r.stable) {
        if (!inTuneSince) inTuneSince = now;
        if (now - inTuneSince > 450 && si >= 0 && !done[si]) {
          done[si] = true; OM.bridge.vibrate(40); drawStrings();
          var all = strMidis().every(function (_, i) { return done[i]; });
          if (all) { ui.toast("Instrumento afinado!"); OM.lib.log({ type: "tool", icon: "tuner", screen: "tuner", title: "Afinação: " + inst.n, detail: tuning().n, minutes: 0 }); }
        }
      } else inTuneSince = 0;
    }
    function markCur(si) {
      [].forEach.call(stringsEl.querySelectorAll(".strbtn"), function (b) { b.classList.toggle("cur", +b.getAttribute("data-i") === si); });
    }
    function start() {
      statusEl.innerHTML = "";
      listener = new OM.pitch.Listener({ minF: 27, maxF: 2100, onPitch: show });
      setRange();
      listener.start().then(function () { hzEl.textContent = "Toque uma nota"; setRange(); }).catch(function (e) {
        listener = null;
        statusEl.appendChild(ui.notice(OM.audio.micErrorText(e), true));
        statusEl.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Tentar novamente", "mic", start, "pri")));
        hzEl.textContent = "";
      });
    }
    function stop() { if (listener) { listener.stop(); listener = null; } if (stopRef) { stopRef(); stopRef = null; } }
    function settings() {
      var box = h("div");
      var a4 = OM.store.settings().a4;
      box.appendChild(ui.row("Referência Lá (A4)", ui.stepper(a4, 415, 466, 1, function (v) { return v + " Hz"; }, function (v) { OM.store.setSetting("a4", v); })));
      box.appendChild(h("p.muted", { style: { fontSize: "13px", marginTop: "10px" }, text: "Padrão: 440 Hz. Orquestras às vezes usam 442 Hz; música barroca, 415 Hz. A referência também vale para os tons de referência e o identificador de notas." }));
      ui.sheet({ title: "Ajustes do afinador", content: box });
    }

    content.appendChild(modeEl);
    content.appendChild(tuneBtn);
    content.appendChild(h("div.tuner", noteEl, hzEl, g, centsEl, h("div.tn-dir", dirL, h("span", { text: "·" }), dirR), h("div.tn-level", lvl)));
    content.appendChild(stringsEl);
    content.appendChild(h("div", { style: { marginTop: "16px" } }, statusEl));
    content.appendChild(h("p.dim", { style: { fontSize: "12px", textAlign: "center", marginTop: "18px" }, text: "Análise em tempo real do microfone (método McLeod/NSDF). Ambiente silencioso melhora a precisão. Referência: Lá = " + OM.store.settings().a4 + " Hz" }));
    drawMode(); drawStrings();
    return {
      el: el,
      onShow: function () { if (!listener) start(); },
      onHide: stop,
      destroy: stop
    };
  });
})(window.OM);
