/* O Músico — relógio de áudio preciso (agendamento antecipado no AudioContext)
   e motor global do metrônomo. */
(function (OM) {
  "use strict";

  /* Clock genérico: chama onStep(time, stepIndex) para cada passo, com
     intervalo dado por getInterval(stepIndex). Usado pelo metrônomo e pela bateria. */
  function Clock(getInterval, onStep) {
    this.getInterval = getInterval; this.onStep = onStep;
    this.timer = null; this.running = false;
  }
  Clock.prototype.start = function (delay) {
    if (this.running) return;
    var c = OM.audio.context();
    this.running = true;
    this.step = 0;
    this.next = c.currentTime + (delay || 0.06);
    var self = this;
    var tick = function () {
      if (!self.running) return;
      var now = c.currentTime;
      if (self.next < now - 0.25) self.next = now + 0.02; /* recupera após pausa do sistema */
      while (self.next < now + 0.12) {
        self.onStep(self.next, self.step);
        self.next += self.getInterval(self.step);
        self.step++;
      }
    };
    tick();
    this.timer = setInterval(tick, 25);
  };
  Clock.prototype.stop = function () { this.running = false; clearInterval(this.timer); };

  /* chama fn no momento (aprox.) em que o som agendado em t é ouvido */
  function at(t, fn) {
    var c = OM.audio.context();
    var ms = (t - c.currentTime) * 1000 + (c.outputLatency || c.baseLatency || 0) * 1000;
    setTimeout(fn, Math.max(0, ms));
  }

  /* ---------- metrônomo global ---------- */
  var SUBDIV = [
    { id: 1, n: "♩", d: "Semínima" }, { id: 2, n: "♪♪", d: "Colcheias" }, { id: 3, n: "3", d: "Tercinas" },
    { id: 4, n: "♬♬", d: "Semicolcheias" }, { id: "sw", n: "Swing", d: "Colcheias swing" }, { id: "dot", n: "♪.♬", d: "Pontuada" }
  ];
  var listeners = [];
  var st = OM.store.get("metro", null) || {};
  var M = {
    bpm: st.bpm || 100, num: st.num || 4, den: st.den || 4, sub: st.sub || 1, sound: st.sound || "click",
    vol: st.vol == null ? 0.8 : st.vol, subVol: st.subVol == null ? 0.5 : st.subVol,
    accents: st.accents || null, accentFirst: st.accentFirst !== false,
    trainer: st.trainer || { on: false, step: 5, every: 4, max: 160 },
    running: false, beat: -1, bar: 0, startBpm: 0, visual: true
  };
  function accents() {
    if (!M.accents || M.accents.length !== M.num) {
      M.accents = [];
      for (var i = 0; i < M.num; i++) M.accents.push(i === 0 && M.accentFirst ? 2 : 1);
    }
    return M.accents;
  }
  function save() {
    OM.store.set("metro", { bpm: M.bpm, num: M.num, den: M.den, sub: M.sub, sound: M.sound, vol: M.vol, subVol: M.subVol,
      accents: M.accents, accentFirst: M.accentFirst, trainer: M.trainer });
  }
  function emit(ev, data) { listeners.slice().forEach(function (f) { try { f(ev, data); } catch (e) { } }); }
  function beatDur() { return 60 / M.bpm; } /* BPM = pulsos (unidade do denominador) por minuto */
  /* subdivisões de um tempo, como frações da duração */
  function subPattern() {
    var s = M.sub;
    if (s === "sw") return [0, 2 / 3];
    if (s === "dot") return [0, 0.75];
    var a = []; for (var i = 0; i < s; i++) a.push(i / s); return a;
  }
  var clock = null, events = [];
  function build() {
    /* passo = cada clique (tempos e subdivisões) */
    var pat = subPattern();
    clock = new Clock(function (i) {
      var k = i % pat.length;
      var nxt = k + 1 < pat.length ? pat[k + 1] : 1;
      return (nxt - pat[k]) * beatDur();
    }, function (t, i) {
      var k = i % pat.length;
      var beatIdx = Math.floor(i / pat.length);
      var b = beatIdx % M.num;
      if (k === 0) {
        if (b === 0 && beatIdx > 0) {
          M.bar++;
          if (M.trainer.on && M.bar % M.trainer.every === 0 && M.bpm < M.trainer.max) {
            M.bpm = Math.min(M.trainer.max, M.bpm + M.trainer.step);
            at(t, function () { emit("bpm", M.bpm); });
          }
        }
        var lv = accents()[b];
        if (lv > 0) OM.synth.click(M.sound, lv, t, M.vol);
        (function (bb, bar) { at(t, function () { if (M.running) { M.beat = bb; emit("beat", { beat: bb, bar: bar, accent: accents()[bb] }); } }); })(b, M.bar);
      } else if (M.subVol > 0 && accents()[b] > 0) {
        OM.synth.click(M.sound, 0.5, t, M.vol * M.subVol);
        (function (kk) { at(t, function () { if (M.running) emit("sub", kk); }); })(k);
      }
    });
  }
  var metro = {
    S: M, SUBDIV: SUBDIV,
    on: function (f) { listeners.push(f); return function () { listeners = listeners.filter(function (x) { return x !== f; }); }; },
    start: function () {
      if (M.running) return;
      OM.audio.context();
      M.running = true; M.bar = 0; M.beat = -1; M.startBpm = M.bpm;
      build(); clock.start(0.08);
      emit("state", true);
      if (OM.store.settings().keepAwake) OM.bridge.keepAwake(true);
    },
    stop: function () {
      if (!M.running) return;
      M.running = false; clock && clock.stop(); M.beat = -1;
      emit("state", false);
      OM.bridge.keepAwake(false);
    },
    toggle: function () { M.running ? metro.stop() : metro.start(); },
    restart: function () { if (M.running) { clock.stop(); M.bar = 0; build(); clock.start(0.05); } },
    set: function (k, v) {
      M[k] = v;
      if (k === "bpm") M.bpm = Math.max(20, Math.min(320, Math.round(v)));
      if (k === "num") { M.accents = null; accents(); }
      if (k === "accentFirst") { M.accents = null; accents(); }
      save();
      if (k === "num" || k === "den" || k === "sub") metro.restart();
      emit("change", k);
    },
    cycleAccent: function (i) {
      var a = accents(); a[i] = a[i] === 2 ? 1 : a[i] === 1 ? 0 : 2; save(); emit("change", "accents");
    },
    accents: accents,
    beatDur: beatDur,
    tapper: function () {
      /* Tap tempo: média dos intervalos recentes, descarta pausas longas */
      var taps = [];
      return function () {
        var t = performance.now();
        if (taps.length && t - taps[taps.length - 1] > 2000) taps = [];
        taps.push(t);
        if (taps.length > 8) taps.shift();
        if (taps.length < 2) return 0;
        var iv = [];
        for (var i = 1; i < taps.length; i++) iv.push(taps[i] - taps[i - 1]);
        iv.sort(function (a, b) { return a - b; });
        var med = iv[Math.floor(iv.length / 2)];
        var good = iv.filter(function (x) { return Math.abs(x - med) < med * 0.25; });
        var avg = good.reduce(function (a, b) { return a + b; }, 0) / good.length;
        return Math.round(60000 / avg);
      };
    }
  };

  OM.Clock = Clock; OM.at = at; OM.metro = metro;
})(window.OM);
