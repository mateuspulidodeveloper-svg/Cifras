/* O Músico — identificador de notas, calculadora de BPM e gravador de ideias */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory;

  /* ---------- identificador de notas ---------- */
  OM.screen("noteid", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Identificador de notas", back: true });
    var el = h("section", bar, content);
    var noteEl = h("div.tn-note", { text: "–" }), info = h("div.tn-hz.num", { text: "Cante ou toque uma nota" });
    var canvas = h("canvas.roll"), status = h("div"), seqEl = h("div.notes-row", { style: { minHeight: "44px" } });
    var listener = null, trail = [], seq = [], curNote = null, curSince = 0, lastAdded = null;
    var refMidi = 69, stopRef = null;
    var inst = OM.inst.current();
    function draw() {
      var c = canvas, w = c.clientWidth, ht = c.clientHeight, dpr = window.devicePixelRatio || 1;
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = ht * dpr; }
      var g = c.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, ht);
      var vals = trail.filter(function (x) { return x != null; });
      var center = vals.length ? vals[vals.length - 1] : 60, lo = center - 7, hi = center + 7;
      var cs = getComputedStyle(document.documentElement);
      for (var m = Math.ceil(lo); m <= hi; m++) {
        var y = ht - (m - lo) / (hi - lo) * ht;
        g.strokeStyle = cs.getPropertyValue("--line"); g.lineWidth = 1;
        g.beginPath(); g.moveTo(28, y); g.lineTo(w, y); g.stroke();
        g.fillStyle = cs.getPropertyValue("--tx3"); g.font = "600 10px sans-serif";
        g.fillText(T.display(T.name(m)), 4, y + 3);
      }
      g.strokeStyle = cs.getPropertyValue("--acc"); g.lineWidth = 3; g.lineJoin = "round"; g.beginPath();
      var started = false;
      trail.forEach(function (v, i) {
        var x = 28 + (i / 150) * (w - 28);
        if (v == null) { started = false; return; }
        var y = ht - (v - lo) / (hi - lo) * ht;
        if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y);
      });
      g.stroke();
    }
    function onPitch(r) {
      trail.push(r.freq ? r.midi + r.cents / 100 : null);
      if (trail.length > 150) trail.shift();
      draw();
      if (!r.freq) { curNote = null; return; }
      var written = inst.kind === "wind" && inst.transp ? r.midi - inst.transp : r.midi;
      noteEl.innerHTML = "";
      var nm = T.name(written);
      noteEl.appendChild(document.createTextNode(T.display(nm[0])));
      if (nm[1]) noteEl.appendChild(h("sup", { text: "♯" }));
      noteEl.appendChild(h("sub", { text: Math.floor(written / 12) - 1 }));
      info.textContent = r.freq.toFixed(1) + " Hz · " + (r.cents > 0 ? "+" : "") + r.cents.toFixed(0) + " cents" + (written !== r.midi ? " · som real " + T.midiName(r.midi) : "");
      /* transcrição: nota sustentada por 160 ms entra na sequência */
      var now = performance.now();
      if (r.midi !== curNote) { curNote = r.midi; curSince = now; }
      else if (now - curSince > 160 && lastAdded !== curSince) {
        lastAdded = curSince;
        seq.push(written); if (seq.length > 24) seq.shift();
        drawSeq();
      }
    }
    function drawSeq() {
      OM.u.clear(seqEl);
      if (!seq.length) { seqEl.appendChild(h("span.dim", { text: "As notas sustentadas aparecem aqui, em sequência.", style: { fontSize: "13px" } })); return; }
      seq.forEach(function (m) { seqEl.appendChild(h("span.notepill", { text: T.display(T.name(m)), onclick: function () { OM.synth.note(m, inst); } }, h("small", { text: Math.floor(m / 12) - 1 }))); });
    }
    function start() {
      OM.u.clear(status);
      listener = new OM.pitch.Listener({ minF: 40, maxF: 2100, onPitch: onPitch, minClarity: 0.85 });
      listener.start().catch(function (e) {
        listener = null;
        status.appendChild(ui.notice(OM.audio.micErrorText(e), true));
        status.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Tentar novamente", "mic", start, "pri")));
      });
    }
    function stop() { if (listener) { listener.stop(); listener = null; } if (stopRef) { stopRef(); stopRef = null; } }
    var refLbl = h("b", { style: { minWidth: "60px", textAlign: "center" } });
    function drawRef() { refLbl.textContent = T.display(T.midiName(refMidi)); }
    var refBtn = ui.btn("Tocar", "sound", function () {
      if (stopRef) { stopRef(); stopRef = null; refBtn.lastChild.textContent = "Tocar"; return; }
      stopRef = OM.synth.refTone(refMidi, 0.25); refBtn.lastChild.textContent = "Parar";
    }, "sm pri");
    function setRef(m) { refMidi = Math.max(36, Math.min(96, m)); drawRef(); if (stopRef) { stopRef(); stopRef = OM.synth.refTone(refMidi, 0.25); } }
    content.appendChild(h("div.tuner", noteEl, info));
    content.appendChild(h("div", { style: { marginTop: "14px" } }, canvas));
    content.appendChild(status);
    content.appendChild(h("div.sec", h("h2", { text: "Sequência detectada" }), h("button.lnk", { text: "Limpar", onclick: function () { seq = []; drawSeq(); } })));
    content.appendChild(seqEl);
    content.appendChild(h("div.lbl", { text: "Gerador de nota de referência" }));
    content.appendChild(h("div.card", h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
      ui.btn("", "minus", function () { setRef(refMidi - 1); }, "sm"), refLbl, ui.btn("", "plus", function () { setRef(refMidi + 1); }, "sm"), h("span", { style: { flex: 1 } }), refBtn),
      h("p.dim", { style: { fontSize: "12px", marginTop: "8px" }, text: "Tom contínuo para afinar de ouvido ou treinar a voz. Lá = " + OM.store.settings().a4 + " Hz." })));
    drawRef(); drawSeq();
    return { el: el, onShow: function () { if (!listener) start(); }, onHide: stop, destroy: stop };
  });

  /* ---------- calculadora de BPM ---------- */
  OM.screen("bpmcalc", function () {
    var bpm = OM.metro.S.bpm;
    var content = h("div.content");
    var bar = ui.topbar({ title: "Calculadora de BPM", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var big = h("div.met-bpm", { text: bpm }), table = h("div.card"), dur = h("div.card"), micRes = h("div");
    var tap = OM.metro.tapper(), tapBtn = h("button.tapbtn", { text: "Toque no ritmo da música" });
    tapBtn.addEventListener("pointerdown", function (e) { e.preventDefault(); var b = tap(); if (b) set(b); tapBtn.textContent = b ? "Tap: " + b + " BPM" : "Continue…"; });
    var inp = h("input.inp", { type: "number", min: 20, max: 400, value: bpm });
    inp.addEventListener("input", function () { var v = +inp.value; if (v >= 20 && v <= 400) set(v, true); });
    function set(v, fromInput) { bpm = v; big.textContent = v; if (!fromInput) inp.value = v; calc(); }
    var bars = 64, num = 4;
    function calc() {
      var q = 60000 / bpm;
      OM.u.clear(table);
      table.appendChild(h("h3", { text: "Duração das figuras (ms) — útil para delay e reverb" }));
      [["Semibreve", 4], ["Mínima", 2], ["Semínima", 1], ["Colcheia", 0.5], ["Semicolcheia", 0.25], ["Fusa", 0.125]].forEach(function (r) {
        table.appendChild(h("div.kv", h("span", { text: r[0] }), h("b.num", { text: (q * r[1]).toFixed(1) + "  ·  pont. " + (q * r[1] * 1.5).toFixed(0) + "  ·  terc. " + (q * r[1] * 2 / 3).toFixed(0) })));
      });
      table.appendChild(h("div.kv", h("span", { text: "Frequência do pulso" }), h("b.num", { text: (bpm / 60).toFixed(3) + " Hz" })));
      OM.u.clear(dur);
      var secs = bars * num * q / 1000;
      dur.appendChild(h("h3", { text: "Duração de uma música" }));
      dur.appendChild(ui.row("Compassos", ui.stepper(bars, 1, 999, 4, null, function (v) { bars = v; calc(); })));
      dur.appendChild(ui.row("Tempos por compasso", ui.stepper(num, 1, 12, 1, null, function (v) { num = v; calc(); })));
      dur.appendChild(h("div.kv", h("span", { text: "Duração total" }), h("b.num", { text: OM.u.fmtTime(secs) + " (" + secs.toFixed(1) + " s)" })));
    }
    /* detecção de andamento pelo microfone: detecção de ataques por energia + histograma de intervalos */
    var det = null;
    function micDetect() {
      if (det) { det.stop(); return; }
      var onsets = [], prevE = 0, avg = 0, last = 0, src, an, raf, stream;
      var ctx = OM.audio.context();
      OM.u.clear(micRes);
      var lbl = h("p.muted", { text: "Ouvindo… toque ou bata palmas no tempo (ou aproxime o aparelho da música)." });
      micRes.appendChild(lbl);
      OM.audio.getMic().then(function (s) {
        stream = s; src = ctx.createMediaStreamSource(s); an = ctx.createAnalyser(); an.fftSize = 1024; src.connect(an);
        var buf = new Float32Array(1024);
        (function loop() {
          raf = requestAnimationFrame(loop);
          an.getFloatTimeDomainData(buf);
          var e = 0; for (var i = 0; i < buf.length; i++) e += buf[i] * buf[i]; e /= buf.length;
          avg = avg * 0.95 + e * 0.05;
          var t = performance.now();
          if (e > avg * 2.2 && e > prevE * 1.3 && e > 1e-4 && t - last > 200) { last = t; onsets.push(t); if (onsets.length > 24) onsets.shift(); estimate(); }
          prevE = e;
        })();
      }).catch(function (e) { lbl.textContent = OM.audio.micErrorText(e); det = null; micBtn.lastChild.textContent = "Detectar pelo microfone"; });
      function estimate() {
        if (onsets.length < 5) { lbl.textContent = "Ataques detectados: " + onsets.length + "…"; return; }
        var hist = {};
        for (var i = 1; i < onsets.length; i++) for (var k = 1; k <= 4 && i - k >= 0; k++) {
          var iv = (onsets[i] - onsets[i - k]) / k, b = 60000 / iv;
          while (b < 60) b *= 2; while (b > 200) b /= 2;
          var key = Math.round(b);
          for (var d = -2; d <= 2; d++) hist[key + d] = (hist[key + d] || 0) + (d === 0 ? 2 : 1) / k;
        }
        var best = 0, bv = 0; Object.keys(hist).forEach(function (k) { if (hist[k] > bv) { bv = hist[k]; best = +k; } });
        lbl.textContent = "Andamento estimado: " + best + " BPM (" + onsets.length + " ataques)";
        set(best);
      }
      det = { stop: function () { cancelAnimationFrame(raf); try { src && src.disconnect(); } catch (e) { } if (stream) OM.audio.releaseMic(); det = null; micBtn.lastChild.textContent = "Detectar pelo microfone"; } };
      micBtn.lastChild.textContent = "Parar detecção";
    }
    var micBtn = ui.btn("Detectar pelo microfone", "mic", micDetect, "ghost");
    content.appendChild(h("div.met", big, h("div.met-it", { text: "BPM" })));
    content.appendChild(h("div", { style: { margin: "14px 0" } }, tapBtn));
    content.appendChild(h("div.btnrow", micBtn, ui.btn("Usar no metrônomo", "metro", function () { OM.metro.set("bpm", bpm); OM.router.push("metronome"); }, "pri")));
    content.appendChild(micRes);
    content.appendChild(h("label.field", { style: { marginTop: "14px" } }, h("span", { text: "Ou digite o BPM" }), inp));
    content.appendChild(table);
    content.appendChild(dur);
    calc();
    return { el: el, destroy: function () { if (det) det.stop(); } };
  });

  /* ---------- gravador de ideias ---------- */
  OM.screen("recorder", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Gravador de ideias", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var timeEl = h("div.rectime", { text: "0:00" }), wave = h("canvas.wave"), recBtn = h("button.recbtn", { "aria-label": "Gravar", onclick: toggle }, h("i"));
    var listEl = h("div"), status = h("div"), withMet = false, filter = "all";
    var ctrl = null, starting = false, timer = 0, peaks = [];
    function drawWave() {
      var c = wave, w = c.clientWidth, ht = c.clientHeight, dpr = window.devicePixelRatio || 1;
      if (!w) return;
      if (c.width !== w * dpr) { c.width = w * dpr; c.height = ht * dpr; }
      var g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, ht);
      g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(ctrl ? "--bad" : "--tx3");
      peaks.slice(-Math.floor(w / 4)).forEach(function (p, i) { var bh = Math.max(2, p * ht * 0.9); g.fillRect(i * 4, (ht - bh) / 2, 2.5, bh); });
    }
    function toggle() { if (ctrl) stopRec(); else startRec(); }
    function startRec() {
      if (starting) return; starting = true;
      OM.u.clear(status); peaks = [];
      OM.recording.start(function (pk) { peaks.push(pk); if (peaks.length > 600) peaks.shift(); drawWave(); }).then(function (c) {
        starting = false; ctrl = c; recBtn.classList.add("on");
        if (withMet) OM.metro.start();
        timer = setInterval(function () { timeEl.textContent = OM.u.fmtTime(c.elapsed()); }, 250);
      }).catch(function (e) { starting = false; status.appendChild(ui.notice(e && e.message && e.name === "Unsupported" ? e.message : OM.audio.micErrorText(e), true)); });
    }
    function stopRec() {
      if (!ctrl) return Promise.resolve();
      var c = ctrl; ctrl = null; clearInterval(timer); recBtn.classList.remove("on");
      if (withMet) OM.metro.stop();
      return c.stop().then(function (r) {
        drawWave();
        return OM.recording.save(r, { bpm: withMet ? OM.metro.S.bpm : 0 }).then(function () { ui.toast("Gravação salva"); drawList(); });
      }).catch(function (e) { ui.toast(e.message || "Não foi possível salvar"); });
    }
    function drawList() {
      OM.store.rec.all().then(function (all) {
        OM.u.clear(listEl);
        var list = filter === "songs" ? all.filter(function (r) { return r.songId; }) : filter === "ideas" ? all.filter(function (r) { return !r.songId; }) : all;
        listEl.appendChild(ui.sec("Minhas gravações (" + all.length + ")"));
        listEl.appendChild(ui.chips([{ v: "all", label: "Todas" }, { v: "ideas", label: "Ideias" }, { v: "songs", label: "Sobre cifras" }], filter, function (v) { filter = v; drawList(); }));
        if (!list.length) { listEl.appendChild(ui.empty("mic", filter === "songs" ? "Grave tocando junto com uma cifra pelo botão “Gravar” na tela da música." : "Grave riffs, melodias e ideias. Elas ficam guardadas só no aparelho.")); return; }
        var l = h("div.list", { style: { marginTop: "10px" } });
        list.forEach(function (r) { l.appendChild(OM.recording.item(r, drawList)); });
        listEl.appendChild(l);
      }).catch(function () { OM.u.clear(listEl); listEl.appendChild(ui.notice("Armazenamento de gravações indisponível neste aparelho.", true)); });
    }
    content.appendChild(timeEl);
    content.appendChild(wave);
    content.appendChild(recBtn);
    content.appendChild(h("div.card", { style: { padding: "2px 14px" } }, ui.row("Gravar com metrônomo (" + OM.metro.S.bpm + " BPM)", ui.toggle(withMet, function (v) { withMet = v; }))));
    content.appendChild(status);
    content.appendChild(listEl);
    drawList();
    setTimeout(drawWave, 50);
    return { el: el, onBack: function () { if (ctrl) { stopRec(); return true; } return false; }, destroy: function () { stopRec(); } };
  });
})(window.OM);
