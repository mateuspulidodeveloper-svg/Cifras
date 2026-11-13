/* O Músico — metrônomo profissional */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory, MT = OM.metro, M = OM.metro.S;

  OM.screen("metronome", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Metrônomo", back: true });
    var flash = h("div.flash");
    var el = h("section", bar, content, flash);
    var bpmEl = h("div.met-bpm", { text: M.bpm }), itEl = h("div.met-it"), beatsEl = h("div.met-beats"), pulse = h("i");
    var playBtn = h("button.bigplay", { "aria-label": "Iniciar/parar", onclick: function () { MT.toggle(); } });
    var slider = ui.range(20, 300, 1, M.bpm, function (v) { MT.set("bpm", v); });
    var visual = OM.store.get("metroVisual", true);
    var tap = MT.tapper(), tapBtn = h("button.tapbtn", { text: "Toque aqui no ritmo (Tap Tempo)" });
    tapBtn.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      var b = tap();
      if (b) { MT.set("bpm", Math.max(20, Math.min(300, b))); tapBtn.textContent = "Tap: " + b + " BPM"; }
      else tapBtn.textContent = "Continue tocando…";
      OM.synth.click(M.sound, 1, OM.audio.context().currentTime, M.vol * 0.7);
    });
    function hold(btn, fn) {
      var t, iv;
      btn.addEventListener("pointerdown", function (e) { e.preventDefault(); fn(); t = setTimeout(function () { iv = setInterval(fn, 70); }, 420); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function (ev) { btn.addEventListener(ev, function () { clearTimeout(t); clearInterval(iv); }); });
      return btn;
    }
    var minus = hold(h("button.roundbtn", { html: OM.icon("minus"), "aria-label": "Diminuir BPM" }), function () { MT.set("bpm", M.bpm - 1); });
    var plus = hold(h("button.roundbtn", { html: OM.icon("plus"), "aria-label": "Aumentar BPM" }), function () { MT.set("bpm", M.bpm + 1); });

    function drawBeats() {
      OM.u.clear(beatsEl);
      MT.accents().forEach(function (a, i) {
        beatsEl.appendChild(h("button", { "data-a": a, "data-i": i, "aria-label": "Tempo " + (i + 1), onclick: function () { MT.cycleAccent(i); } }));
      });
    }
    function sync() {
      bpmEl.textContent = M.bpm; itEl.textContent = T.tempoName(M.bpm) + " · " + M.num + "/" + M.den;
      slider.set(M.bpm);
      playBtn.innerHTML = OM.icon(M.running ? "stop" : "play");
    }
    var off = MT.on(function (ev, d) {
      if (ev === "beat") {
        [].forEach.call(beatsEl.children, function (b) { b.classList.toggle("on", +b.getAttribute("data-i") === d.beat); });
        pulse.classList.add("hit"); setTimeout(function () { pulse.classList.remove("hit"); }, 40);
        if (visual) { flash.style.background = d.accent === 2 ? "var(--acc)" : "var(--tx)"; flash.classList.add("hit"); setTimeout(function () { flash.classList.remove("hit"); }, 40); }
        if (M.trainer.on) trainInfo.textContent = "Compasso " + (d.bar + 1) + " · " + M.bpm + " BPM";
      }
      if (ev === "state") {
        if (!d) [].forEach.call(beatsEl.children, function (b) { b.classList.remove("on"); });
        sync();
      }
      if (ev === "bpm" || ev === "change") { sync(); if (d === "accents" || d === "num" || d === "accentFirst") drawBeats(); }
    });
    content.appendChild(h("div.met", h("div", { style: { height: "6px" } }), bpmEl, itEl));
    content.appendChild(h("div.met-row", minus, playBtn, plus));
    content.appendChild(slider);
    content.appendChild(h("div.met-pulse", pulse));
    content.appendChild(beatsEl);
    content.appendChild(h("p.dim", { style: { fontSize: "12px", textAlign: "center", marginBottom: "12px" }, text: "Toque num tempo para alternar: acento · normal · mudo" }));
    content.appendChild(h("div.chips", { style: { justifyContent: "center", marginBottom: "14px" } },
      [-10, -5, +5, +10].map(function (d) { return h("button.chip", { text: (d > 0 ? "+" : "") + d, onclick: function () { MT.set("bpm", M.bpm + d); } }); })));
    content.appendChild(tapBtn);

    /* predefinições salvas (ex.: "Música X", "Aquecimento 60") */
    var presetBox = h("div");
    function drawPresets() {
      OM.u.clear(presetBox);
      var pr = OM.store.get("metroPresets", []);
      presetBox.appendChild(h("div.sec", h("h2", { text: "Predefinições", style: { fontSize: "14px" } }), h("button.lnk", { text: "+ Salvar atual", onclick: function () {
        ui.prompt("Salvar predefinição", "Nome (ex.: Aquecimento, nome da música)", M.bpm + " BPM " + M.num + "/" + M.den).then(function (n) {
          if (!n) return;
          OM.store.update("metroPresets", [], function (a) { a.unshift({ n: n, bpm: M.bpm, num: M.num, den: M.den, sub: M.sub, sound: M.sound, accents: MT.accents().slice() }); return a.slice(0, 20); });
          drawPresets();
        });
      } })));
      if (!pr.length) { presetBox.appendChild(h("p.dim", { style: { fontSize: "12.5px" }, text: "Salve combinações de andamento, compasso e som para trocar com um toque." })); return; }
      presetBox.appendChild(h("div.chips.wrap", pr.map(function (x, i) {
        var c = h("button.chip", { text: x.n + " · " + x.bpm, onclick: function () {
          MT.set("num", x.num); MT.set("den", x.den); MT.set("bpm", x.bpm); MT.set("sub", x.sub); MT.set("sound", x.sound);
          if (x.accents && x.accents.length === x.num) { M.accents = x.accents.slice(); MT.set("accents", M.accents); }
          drawBeats(); sync(); ui.toast("“" + x.n + "” carregada");
        } });
        c.addEventListener("contextmenu", function (e) { e.preventDefault(); ui.confirm("Excluir a predefinição “" + x.n + "”?", "Excluir", true).then(function (ok) { if (ok) { OM.store.update("metroPresets", [], function (a) { a.splice(i, 1); }); drawPresets(); } }); });
        return c;
      })));
      presetBox.appendChild(h("p.dim", { style: { fontSize: "11.5px", marginTop: "4px" }, text: "Toque e segure para excluir." }));
    }
    drawPresets();
    content.appendChild(presetBox);
    content.appendChild(h("div.lbl", { text: "Compasso" }));
    var numSt = ui.stepper(M.num, 1, 12, 1, function (v) { return v; }, function (v) { MT.set("num", v); });
    var denSeg = ui.seg([{ v: 2, label: "/2" }, { v: 4, label: "/4" }, { v: 8, label: "/8" }], M.den, function (v) { MT.set("den", v); sync(); });
    content.appendChild(h("div", { style: { display: "flex", gap: "12px", alignItems: "center" } }, numSt, h("div", { style: { flex: 1 } }, denSeg)));
    content.appendChild(h("div.chips", { style: { marginTop: "10px" } }, ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "12/8"].map(function (s) {
      return h("button.chip", { text: s, onclick: function () { var a = s.split("/"); MT.set("num", +a[0]); MT.set("den", +a[1]); numSt.set(+a[0]); denSeg.set(+a[1]); sync(); } });
    })));
    content.appendChild(h("div.card", { style: { marginTop: "12px", padding: "4px 14px" } }, ui.row("Acentuar o primeiro tempo", ui.toggle(M.accentFirst, function (v) { MT.set("accentFirst", v); })),
      ui.row("Pulsação visual (tela pisca)", ui.toggle(visual, function (v) { visual = v; OM.store.set("metroVisual", v); }))));

    content.appendChild(h("div.lbl", { text: "Subdivisão" }));
    content.appendChild(ui.chips(MT.SUBDIV.map(function (s) { return { v: s.id, label: s.d }; }), M.sub, function (v) { MT.set("sub", v); }, true));
    content.appendChild(h("div.lbl", { text: "Som" }));
    content.appendChild(ui.chips(OM.synth.CLICKS.map(function (c) { return { v: c.id, label: c.n }; }), M.sound, function (v) { MT.set("sound", v); OM.synth.click(v, 2, OM.audio.context().currentTime + 0.02, M.vol); }, true));
    content.appendChild(h("div.lbl", { text: "Volume" }));
    content.appendChild(h("div.card", { style: { padding: "6px 14px" } },
      h("div.range", h("span", { html: OM.icon("sound"), style: { width: "20px", color: "var(--tx2)" } }), ui.range(0, 1, 0.05, M.vol, function (v) { MT.set("vol", v); }), h("small.dim", { text: "Geral" })),
      h("div.range", h("span", { html: OM.icon("note"), style: { width: "20px", color: "var(--tx2)" } }), ui.range(0, 1, 0.05, M.subVol, function (v) { MT.set("subVol", v); }), h("small.dim", { text: "Subdiv." }))));

    content.appendChild(h("div.lbl", { text: "Treino de velocidade" }));
    var trainInfo = h("p.muted", { style: { fontSize: "13px" } });
    var tr = M.trainer;
    function saveTr() { MT.set("trainer", tr); trainInfo.textContent = tr.on ? "Aumenta " + tr.step + " BPM a cada " + tr.every + " compassos, até " + tr.max + " BPM." : "Desligado"; }
    content.appendChild(h("div.card", { style: { padding: "4px 14px 12px" } },
      ui.row("Aumentar o andamento automaticamente", ui.toggle(tr.on, function (v) { tr.on = v; saveTr(); })),
      ui.row("Aumento (BPM)", ui.stepper(tr.step, 1, 20, 1, null, function (v) { tr.step = v; saveTr(); })),
      ui.row("A cada (compassos)", ui.stepper(tr.every, 1, 32, 1, null, function (v) { tr.every = v; saveTr(); })),
      ui.row("Limite (BPM)", ui.stepper(tr.max, 40, 300, 5, null, function (v) { tr.max = v; saveTr(); })), trainInfo));
    saveTr();

    drawBeats(); sync();
    return { el: el, destroy: function () { off(); } };
  });
})(window.OM);
