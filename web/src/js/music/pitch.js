/* O Músico — detecção de frequência fundamental (afinador / identificador de notas).
   Algoritmo: McLeod Pitch Method (NSDF) com autocorrelação via FFT, picos-chave,
   interpolação parabólica e filtro de mediana. Análise real do sinal do microfone. */
(function (OM) {
  "use strict";

  /* ---------- FFT radix-2 in-place ---------- */
  function fft(re, im, inverse) {
    var n = re.length, i, j, k, l;
    for (i = 1, j = 0; i < n; i++) {
      var bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { var t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (l = 2; l <= n; l <<= 1) {
      var ang = (inverse ? 2 : -2) * Math.PI / l, wr = Math.cos(ang), wi = Math.sin(ang), half = l >> 1;
      for (i = 0; i < n; i += l) {
        var cr = 1, ci = 0;
        for (k = 0; k < half; k++) {
          var a = i + k, b = a + half;
          var xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
          var nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
  }

  function Detector(sampleRate, size) {
    this.sr = sampleRate;
    this.n = size;
    this.re = new Float64Array(size * 2);
    this.im = new Float64Array(size * 2);
    this.nsdf = new Float64Array(size);
  }
  /* retorna {freq, clarity, rms} ou null */
  Detector.prototype.detect = function (buf, minF, maxF) {
    var n = this.n, sr = this.sr, re = this.re, im = this.im, nsdf = this.nsdf, i;
    var mean = 0, rms = 0;
    for (i = 0; i < n; i++) mean += buf[i];
    mean /= n;
    for (i = 0; i < n; i++) { var v = buf[i] - mean; re[i] = v; im[i] = 0; rms += v * v; }
    rms = Math.sqrt(rms / n);
    for (i = n; i < 2 * n; i++) { re[i] = 0; im[i] = 0; }
    if (rms < 0.0025) return { freq: 0, clarity: 0, rms: rms };
    fft(re, im, false);
    for (i = 0; i < 2 * n; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; }
    fft(re, im, true);
    var scale = 1 / (2 * n);
    /* m(tau) incremental */
    var m = 0;
    for (i = 0; i < n; i++) { var x = buf[i] - mean; m += x * x; }
    m *= 2;
    var tauMin = Math.max(2, Math.floor(sr / maxF)), tauMax = Math.min(n - 2, Math.ceil(sr / minF));
    nsdf[0] = 1;
    for (var tau = 1; tau <= tauMax + 1 && tau < n; tau++) {
      var a = buf[tau - 1] - mean, b = buf[n - tau] - mean;
      m -= a * a + b * b;
      nsdf[tau] = m > 1e-9 ? 2 * re[tau] * scale / m : 0;
    }
    /* picos-chave: máximos entre cruzamentos positivos de zero */
    var peaks = [], pos = false, best = -1, bestV = -1;
    for (tau = 1; tau <= tauMax; tau++) {
      var cur = nsdf[tau], prev = nsdf[tau - 1];
      if (!pos && prev <= 0 && cur > 0) { pos = true; best = -1; bestV = -1; }
      else if (pos && cur <= 0) { pos = false; if (best >= tauMin) peaks.push(best); }
      if (pos && tau >= tauMin && cur > bestV) { bestV = cur; best = tau; }
    }
    if (pos && best >= tauMin && best < tauMax) peaks.push(best);
    if (!peaks.length) return { freq: 0, clarity: 0, rms: rms };
    var maxV = 0;
    peaks.forEach(function (p) { if (nsdf[p] > maxV) maxV = nsdf[p]; });
    var thr = 0.9 * maxV, chosen = peaks[0];
    for (i = 0; i < peaks.length; i++) if (nsdf[peaks[i]] >= thr) { chosen = peaks[i]; break; }
    /* interpolação parabólica */
    var y0 = nsdf[chosen - 1], y1 = nsdf[chosen], y2 = nsdf[chosen + 1];
    var den = y0 - 2 * y1 + y2, shift = den ? 0.5 * (y0 - y2) / den : 0;
    if (Math.abs(shift) > 1) shift = 0;
    var period = chosen + shift;
    var clarity = y1 - 0.25 * (y0 - y2) * shift;
    return { freq: sr / period, clarity: Math.min(1, clarity), rms: rms };
  };

  /* ---------- escuta contínua do microfone ---------- */
  /* opts: {minF, maxF, onPitch(res), onError(msg)}; res = {freq, midi, cents, clarity, rms, stable} */
  function Listener(opts) {
    this.o = opts;
    this.running = false;
    this.hist = [];
  }
  Listener.prototype.start = function () {
    var self = this;
    if (this.running) return Promise.resolve();
    this.running = true;
    var ctx;
    try { ctx = OM.audio.context(); } catch (e) { this.running = false; return Promise.reject(e); }
    return OM.audio.getMic().then(function (stream) {
      if (!self.running) { OM.audio.releaseMic(); return; }
      self.stream = stream;
      self.src = ctx.createMediaStreamSource(stream);
      var size = ctx.sampleRate > 50000 ? 8192 : 4096;
      self.an = ctx.createAnalyser();
      self.an.fftSize = size;
      self.an.smoothingTimeConstant = 0;
      /* filtro passa-altas leve para remover ruído de manuseio */
      self.hp = ctx.createBiquadFilter();
      self.hp.type = "highpass"; self.hp.frequency.value = 22; self.hp.Q.value = 0.5;
      self.src.connect(self.hp); self.hp.connect(self.an);
      self.buf = new Float32Array(size);
      self.det = new Detector(ctx.sampleRate, size);
      self.last = 0;
      self.loop();
    }).catch(function (e) {
      self.running = false;
      throw e;
    });
  };
  Listener.prototype.loop = function () {
    var self = this;
    if (!this.running) return;
    this.raf = requestAnimationFrame(function (t) {
      if (!self.running) return;
      if (t - self.last >= 40) { self.last = t; self.tick(); }
      self.loop();
    });
  };
  Listener.prototype.tick = function () {
    var o = this.o;
    if (this.an.getFloatTimeDomainData) this.an.getFloatTimeDomainData(this.buf);
    else { var b8 = new Uint8Array(this.buf.length); this.an.getByteTimeDomainData(b8); for (var i = 0; i < b8.length; i++) this.buf[i] = (b8[i] - 128) / 128; }
    var r = this.det.detect(this.buf, o.minF || 27, o.maxF || 2100);
    var out = { freq: 0, rms: r.rms, clarity: r.clarity };
    if (r.freq && r.clarity >= (o.minClarity || 0.82)) {
      var midiF = OM.theory.freqToMidi(r.freq);
      this.hist.push(midiF);
      if (this.hist.length > 5) this.hist.shift();
      /* mediana para estabilidade; descarta saltos de oitava isolados */
      var s = this.hist.slice().sort(function (a, b) { return a - b; });
      var med = s[Math.floor(s.length / 2)];
      var use = Math.abs(midiF - med) > 0.6 ? med : (midiF + med) / 2;
      var midi = Math.round(use);
      out.freq = OM.theory.midiToFreq(use);
      out.midi = midi;
      out.cents = (use - midi) * 100;
      out.raw = r.freq;
      out.stable = this.hist.length >= 3 && (s[s.length - 1] - s[0]) < 0.25;
    } else if (r.rms < 0.004) {
      this.hist.length = 0;
    }
    o.onPitch && o.onPitch(out);
  };
  Listener.prototype.setRange = function (minF, maxF) { this.o.minF = minF; this.o.maxF = maxF; this.hist.length = 0; };
  Listener.prototype.stop = function () {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    try { this.src && this.src.disconnect(); this.hp && this.hp.disconnect(); } catch (e) { }
    if (this.stream) OM.audio.releaseMic();
    this.stream = null;
  };

  OM.pitch = { Detector: Detector, Listener: Listener, fft: fft };
})(window.OM);
