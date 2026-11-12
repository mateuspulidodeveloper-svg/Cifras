/* O Músico — síntese sonora: cordas (Karplus-Strong), piano, tons de referência,
   cliques de metrônomo e peças de bateria. Tudo gerado localmente, sem arquivos de áudio. */
(function (OM) {
  "use strict";
  var pluckCache = {}, pianoCache = {}, noiseBuf = null;

  function ctx() { return OM.audio.context(); }
  function now() { return ctx().currentTime; }
  function freq(m) { return 440 * Math.pow(2, (m - 69) / 12); } /* timbre: sempre em lá 440 relativo; afinação usa a4 */

  /* corda dedilhada: Karplus-Strong pré-calculado em AudioBuffer */
  function pluckBuffer(midi) {
    var key = midi + "@" + OM.theory.a4();
    if (pluckCache[key]) return pluckCache[key];
    var c = ctx(), sr = c.sampleRate, f = OM.theory.midiToFreq(midi);
    var dur = 2.6, len = Math.floor(sr * dur), b = c.createBuffer(1, len, sr), d = b.getChannelData(0);
    var period = sr / f, N = Math.floor(period), frac = period - N;
    var ring = new Float32Array(N + 2);
    for (var i = 0; i < ring.length; i++) ring[i] = Math.random() * 2 - 1;
    /* suaviza o ruído inicial (som mais quente) */
    for (var p = 0; p < 2; p++) for (i = 1; i < ring.length; i++) ring[i] = (ring[i] + ring[i - 1]) * 0.5;
    var decay = midi < 45 ? 0.998 : midi < 60 ? 0.996 : 0.994, idx = 0, prev = 0, L = N + 1;
    for (i = 0; i < len; i++) {
      var a = ring[idx], bb = ring[(idx + 1) % L];
      var v = a + frac * (bb - a);
      var nv = decay * 0.5 * (v + prev);
      prev = v;
      ring[idx] = nv;
      d[i] = v;
      idx = (idx + 1) % L;
    }
    var fade = Math.floor(sr * 0.05);
    for (i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
    pluckCache[key] = b;
    return b;
  }
  function pluck(midi, t, vol, dest) {
    var c = ctx(); t = t || c.currentTime;
    var s = c.createBufferSource(); s.buffer = pluckBuffer(midi);
    var g = c.createGain(); g.gain.value = (vol == null ? 0.5 : vol);
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 4200;
    s.connect(lp); lp.connect(g); g.connect(dest || OM.audio.out());
    s.start(t);
    return s;
  }
  /* piano simples: parciais com decaimento */
  function piano(midi, t, vol, dur) {
    var c = ctx(); t = t || c.currentTime; dur = dur || 1.6;
    var f = OM.theory.midiToFreq(midi), g = c.createGain(), v = (vol == null ? 0.35 : vol);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.006);
    g.gain.exponentialRampToValueAtTime(v * 0.35, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    var parts = [[1, 1], [2, 0.45], [3, 0.22], [4, 0.12], [5, 0.06]];
    parts.forEach(function (p) {
      var o = c.createOscillator(), og = c.createGain();
      o.type = "sine"; o.frequency.value = f * p[0] * (1 + (p[0] - 1) * 0.0007);
      og.gain.value = p[1];
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + dur + 0.05);
    });
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(9000, f * 8);
    g.connect(lp); lp.connect(OM.audio.out());
  }
  /* tom de referência sustentado (afinador). Retorna função para parar. */
  function refTone(midi, vol) {
    var c = ctx(), t = c.currentTime, f = OM.theory.midiToFreq(midi);
    var g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || 0.25, t + 0.04);
    var o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
    o1.type = "triangle"; o1.frequency.value = f;
    o2.type = "sine"; o2.frequency.value = f * 2; g2.gain.value = 0.25;
    o1.connect(g); o2.connect(g2); g2.connect(g); g.connect(OM.audio.out());
    o1.start(t); o2.start(t);
    return function () {
      var t2 = c.currentTime;
      g.gain.cancelScheduledValues(t2); g.gain.setValueAtTime(g.gain.value, t2); g.gain.linearRampToValueAtTime(0, t2 + 0.06);
      o1.stop(t2 + 0.08); o2.stop(t2 + 0.08);
    };
  }
  /* toca uma nota com o timbre adequado ao instrumento */
  function note(midi, inst, t, vol) {
    inst = inst || OM.inst.current();
    if (inst.kind === "string" || inst.kind === "bowed") return pluck(midi, t, vol);
    piano(midi, t, vol);
  }
  /* acorde: arpejo rápido (cordas) ou bloco (teclas) */
  function chord(midis, inst, t, opts) {
    opts = opts || {};
    var c = ctx(); t = t || c.currentTime;
    inst = inst || OM.inst.current();
    var spread = opts.spread != null ? opts.spread : (inst.kind === "keys" ? 0 : 0.035);
    var list = midis.slice().sort(function (a, b) { return a - b; });
    if (opts.up) list.reverse();
    list.forEach(function (m, i) { note(m, inst, t + i * spread, opts.vol || (inst.kind === "keys" ? 0.22 : 0.32)); });
  }
  function sequence(midis, gap, inst) {
    var t = now() + 0.05;
    midis.forEach(function (m, i) { note(m, inst, t + i * gap, 0.4); });
    return t + midis.length * gap;
  }

  /* ---------- metrônomo ---------- */
  function noise() {
    if (noiseBuf) return noiseBuf;
    var c = ctx(), len = c.sampleRate, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (noiseBuf = b);
  }
  var CLICKS = [{ id: "click", n: "Clique" }, { id: "wood", n: "Bloco de madeira" }, { id: "beep", n: "Bipe" }, { id: "cow", n: "Cowbell" }, { id: "rim", n: "Aro" }, { id: "hat", n: "Chimbal" }];
  /* level: 2 acento, 1 normal, 0.5 subdivisão */
  function click(type, level, t, vol) {
    var c = ctx(), out = OM.audio.out();
    vol = (vol == null ? 0.8 : vol) * (level >= 2 ? 1 : level >= 1 ? 0.72 : 0.42);
    var g = c.createGain(); g.connect(out);
    var hi = level >= 2;
    if (type === "beep") {
      var o = c.createOscillator(); o.type = "sine"; o.frequency.value = hi ? 1760 : level >= 1 ? 1320 : 990;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.07);
      o.connect(g); o.start(t); o.stop(t + 0.08);
    } else if (type === "wood") {
      var o2 = c.createOscillator(); o2.type = "sine"; o2.frequency.setValueAtTime(hi ? 1250 : level >= 1 ? 880 : 700, t);
      var bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = hi ? 1250 : 880; bp.Q.value = 3;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 1.3, t + 0.001); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.06);
      o2.connect(bp); bp.connect(g); o2.start(t); o2.stop(t + 0.07);
    } else if (type === "cow") {
      [540, 800].forEach(function (f) {
        var o3 = c.createOscillator(); o3.type = "square"; o3.frequency.value = f * (hi ? 1.18 : 1);
        var bp2 = c.createBiquadFilter(); bp2.type = "bandpass"; bp2.frequency.value = 900; bp2.Q.value = 1.5;
        o3.connect(bp2); bp2.connect(g); o3.start(t); o3.stop(t + 0.2);
      });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * 0.5, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);
    } else if (type === "rim" || type === "hat" || type === "click") {
      var s = c.createBufferSource(); s.buffer = noise();
      var f2 = c.createBiquadFilter();
      if (type === "hat") { f2.type = "highpass"; f2.frequency.value = hi ? 6000 : 8000; }
      else if (type === "rim") { f2.type = "bandpass"; f2.frequency.value = hi ? 2200 : 1700; f2.Q.value = 6; }
      else { f2.type = "bandpass"; f2.frequency.value = hi ? 3800 : level >= 1 ? 2600 : 2000; f2.Q.value = 1.2; }
      var len = type === "hat" ? 0.05 : 0.03;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * (type === "rim" ? 3 : 1.6), t + 0.001); g.gain.exponentialRampToValueAtTime(0.0005, t + len);
      s.connect(f2); f2.connect(g); s.start(t, Math.random() * 0.5); s.stop(t + len + 0.01);
      if (type === "click") {
        var o4 = c.createOscillator(); o4.frequency.value = hi ? 2400 : 1600; var g4 = c.createGain();
        g4.gain.setValueAtTime(vol * 0.5, t); g4.gain.exponentialRampToValueAtTime(0.0005, t + 0.02);
        o4.connect(g4); g4.connect(out); o4.start(t); o4.stop(t + 0.03);
      }
    }
  }

  /* ---------- bateria ---------- */
  var DRUMS = [{ id: "kick", n: "Bumbo" }, { id: "snare", n: "Caixa" }, { id: "hat", n: "Chimbal" }, { id: "open", n: "Chimbal aberto" },
    { id: "rim", n: "Aro" }, { id: "tom", n: "Tom" }, { id: "ride", n: "Prato de condução" }, { id: "shaker", n: "Ganzá" }];
  function drum(id, t, vol) {
    var c = ctx(), out = OM.audio.out(), g = c.createGain(); vol = vol == null ? 0.8 : vol;
    g.connect(out);
    function nz(filterType, f, q, dur, v) {
      var s = c.createBufferSource(); s.buffer = noise();
      var fl = c.createBiquadFilter(); fl.type = filterType; fl.frequency.value = f; if (q) fl.Q.value = q;
      var gg = c.createGain(); gg.gain.setValueAtTime(v, t); gg.gain.exponentialRampToValueAtTime(0.0005, t + dur);
      s.connect(fl); fl.connect(gg); gg.connect(g); s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.02);
    }
    g.gain.value = vol;
    if (id === "kick") {
      var o = c.createOscillator(), og = c.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      og.gain.setValueAtTime(1.4, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(og); og.connect(g); o.start(t); o.stop(t + 0.4);
    } else if (id === "snare") {
      nz("highpass", 1500, 0, 0.18, 0.9);
      var o2 = c.createOscillator(), g2 = c.createGain(); o2.type = "triangle";
      o2.frequency.setValueAtTime(220, t); o2.frequency.exponentialRampToValueAtTime(160, t + 0.08);
      g2.gain.setValueAtTime(0.7, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o2.connect(g2); g2.connect(g); o2.start(t); o2.stop(t + 0.12);
    } else if (id === "hat") nz("highpass", 7500, 0, 0.045, 0.5);
    else if (id === "open") nz("highpass", 7000, 0, 0.3, 0.45);
    else if (id === "shaker") nz("bandpass", 5500, 1.5, 0.06, 0.6);
    else if (id === "ride") { nz("bandpass", 9000, 0.8, 0.5, 0.25); nz("highpass", 4000, 0, 0.08, 0.2); }
    else if (id === "rim") nz("bandpass", 2000, 8, 0.04, 2.2);
    else if (id === "tom") {
      var o3 = c.createOscillator(), g3 = c.createGain();
      o3.frequency.setValueAtTime(190, t); o3.frequency.exponentialRampToValueAtTime(110, t + 0.25);
      g3.gain.setValueAtTime(0.9, t); g3.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o3.connect(g3); g3.connect(g); o3.start(t); o3.stop(t + 0.4);
    }
  }

  OM.synth = { now: now, pluck: pluck, piano: piano, note: note, chord: chord, sequence: sequence, refTone: refTone,
    click: click, CLICKS: CLICKS, drum: drum, DRUMS: DRUMS, freq: freq };
})(window.OM);
