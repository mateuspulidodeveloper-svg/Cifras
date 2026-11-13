/* O Músico — acompanhamento: toca uma sequência de acordes com batida/dedilhado,
   bateria (groove) e clique, no relógio de áudio. Usado em "Batidas" e no modo prática da cifra.
   Resolução: 12 passos por tempo (aceita 1, 2, 3, 4, 6 e 12 subdivisões). */
(function (OM) {
  "use strict";
  var T = OM.theory, RES = 12;

  /* notas de um acorde no instrumento (cordas: digitação real; demais: posição fechada) */
  function chordNotes(name, inst) {
    var ch = T.parseChord(name);
    if (!ch) return null;
    if (inst.kind === "string") {
      var vs = OM.voicings.forInstrument(name, inst, 1);
      if (vs.length) {
        var tm = OM.inst.tuningMidi(OM.inst.tuningOf(inst));
        var notes = vs[0].frets.map(function (f, i) { return f < 0 ? null : tm[i] + f; }).filter(function (x) { return x != null; });
        if (notes.length >= 2) {
          var sorted = notes.slice().sort(function (a, b) { return a - b; });
          return finish(ch, sorted, true);
        }
      }
    }
    var base = 52 + T.mod12(ch.rootPc - 4);
    var m = ch.intervals.map(function (i) { return base + i; }).filter(function (x) { return x <= base + 16; });
    return finish(ch, [base - 12].concat(m), false);
  }
  function finish(ch, notes, real) {
    var low = notes[0], bassPc = ch.bassPc;
    var bass = low;
    if (T.mod12(low) !== bassPc) { bass = low - T.mod12(low - bassPc); }
    var fifthPc = T.mod12(ch.rootPc + 7), alt = null;
    for (var i = 0; i < notes.length; i++) if (T.mod12(notes[i]) === fifthPc && notes[i] < 60 && notes[i] !== bass) { alt = notes[i]; break; }
    if (alt == null) { alt = bass + T.mod12(fifthPc - T.mod12(bass)); if (alt - bass < 5) alt += 12; if (alt > bass + 12) alt -= 12; }
    var top = notes.slice(-3);
    while (top.length < 3) top.unshift(top[0] || notes[0]);
    return { all: notes, bass: bass, alt: alt, i: top[0], m: top[1], a: top[2], real: real };
  }

  function Accomp(o) {
    this.o = Object.assign({ bpm: 90, beats: 4, chords: [], strum: null, groove: null, click: false, strumVol: 0.8, drumVol: 0.7, clickVol: 0.8, loop: true, countIn: 0 }, o);
    this.cache = {};
    this.running = false;
  }
  Accomp.prototype.notes = function (name) {
    var inst = this.o.inst || OM.inst.pref(["string"]);
    var key = name + "@" + inst.id;
    if (!(key in this.cache)) this.cache[key] = chordNotes(name, inst);
    return this.cache[key];
  };
  Accomp.prototype.totalBeats = function () { return this.o.chords.reduce(function (a, c) { return a + (c.beats || 4); }, 0); };
  Accomp.prototype.chordAt = function (beat) {
    var tot = this.totalBeats(); if (!tot) return { idx: -1, inChord: 0 };
    if (this.o.loop) beat = beat % tot; else if (beat >= tot) return { idx: -1, inChord: 0 };
    var acc = 0;
    for (var i = 0; i < this.o.chords.length; i++) { var b = this.o.chords[i].beats || 4; if (beat < acc + b) return { idx: i, inChord: beat - acc }; acc += b; }
    return { idx: -1, inChord: 0 };
  };
  Accomp.prototype.startBeatOf = function (idx) { var acc = 0; for (var i = 0; i < idx; i++) acc += this.o.chords[i].beats || 4; return acc; };
  Accomp.prototype.set = function (k, v) { this.o[k] = v; if (k === "inst") this.cache = {}; };
  Accomp.prototype.jump = function (idx) { this.tick = this.startBeatOf(Math.max(0, Math.min(this.o.chords.length - 1, idx))) * RES; this.countLeft = 0; };

  /* barramento por voz: a batida seguinte abafa a anterior (como a mão no violão) */
  Accomp.prototype.bus = function (kind, t, fade) {
    var c = OM.audio.context(), g = c.createGain();
    g.gain.value = 1; g.connect(OM.audio.out());
    var prev = this["_" + kind];
    if (prev) { try { prev.gain.setTargetAtTime(0, t, fade || 0.025); } catch (e) { } }
    this["_" + kind] = g;
    return g;
  };
  Accomp.prototype.play = function (tok, name, t) {
    if (!tok || tok === "." || tok === "-") return;
    var n = this.notes(name); if (!n) return;
    var inst = this.o.inst || OM.inst.pref(["string"]), v = this.o.strumVol, self = this;
    var keys = !n.real;
    function pl(m, tt, vol, dest) { if (keys) OM.synth.piano(m, tt, vol * 0.7, 1.1); else OM.synth.pluck(m, tt, vol, dest); }
    var up = tok === "U" || tok === "u", light = tok === "d" || tok === "u";
    if ("DdUu".indexOf(tok) >= 0) {
      var g = this.bus("chord", t);
      var list = light || up ? n.all.slice(-Math.min(4, n.all.length)) : n.all.slice();
      if (up) list.reverse();
      var spread = keys ? 0 : (up ? 0.011 : 0.014);
      list.forEach(function (m, k) { pl(m, t + k * spread, v * (light ? 0.42 : up ? 0.5 : 0.62) * (k === 0 && !up ? 1.1 : 1), g); });
      return;
    }
    if (tok === "k") {
      var gk = this.bus("chord", t);
      n.all.slice(-4).forEach(function (m, k) { pl(m, t + k * 0.006, v * 0.5, gk); });
      gk.gain.setTargetAtTime(0, t + 0.09, 0.03);
      return;
    }
    if (tok === "x") {
      if (this._chord) try { this._chord.gain.setTargetAtTime(0, t, 0.01); } catch (e) { }
      OM.synth.drum("rim", t, v * 0.35);
      OM.synth.drum("shaker", t, v * 0.25);
      return;
    }
    if (tok === "B" || tok === "b" || tok === "P") {
      var gb = this.bus("bass", t, 0.04);
      pl(tok === "b" ? n.alt : n.bass, t, v * 0.7, gb);
      if (tok === "P") { var gp = this.bus("chord", t); [n.i, n.m, n.a].forEach(function (m) { pl(m, t, v * 0.42, gp); }); }
      return;
    }
    if (tok === "C") { var gc = this.bus("chord", t); [n.i, n.m, n.a].forEach(function (m) { pl(m, t, v * 0.42, gc); }); return; }
    if (tok === "i" || tok === "m" || tok === "a") { pl(n[tok], t, v * 0.5, self.bus("pick" + tok, t, 0.2)); }
  };

  Accomp.prototype.start = function () {
    if (this.running) return;
    var self = this, o = this.o;
    OM.audio.context();
    this.running = true;
    this.tick = this.tick || 0;
    this.countLeft = (o.countIn || 0) * o.beats * RES;
    var cIdx = 0;
    this.clock = new OM.Clock(function () { return 60 / o.bpm / RES; }, function (t) {
      if (self.countLeft > 0) {
        var ci = (o.countIn * o.beats * RES - self.countLeft);
        if (ci % RES === 0) { var cb = ci / RES; OM.synth.click("wood", cb % o.beats === 0 ? 2 : 1, t, 0.9); OM.at(t, function () { o.onCount && o.onCount(o.beats - (cb % o.beats)); }); }
        self.countLeft--; return;
      }
      var tick = self.tick++, beat = Math.floor(tick / RES), sub = tick % RES;
      var pos = self.chordAt(beat);
      if (pos.idx < 0) { OM.at(t, function () { self.stop(); o.onEnd && o.onEnd(); }); self.running = false; self.clock.stop(); return; }
      var name = o.chords[pos.idx].sound || o.chords[pos.idx].name;
      if (sub === 0 && o.click) OM.synth.click(o.clickSound || "click", beat % o.beats === 0 ? 2 : 1, t, o.clickVol);
      if (o.strum) {
        var per = RES / o.strum.spb;
        if (sub % per === 0) {
          var si = (beat % o.strum.beats) * o.strum.spb + sub / per;
          self.play(o.strum.p[si], name, t);
          if (o.onStep) (function (s) { OM.at(t, function () { if (self.running) o.onStep(s); }); })(si);
        }
      }
      if (o.groove) {
        var gb = o.groove.beats || 4, gs = o.groove.steps / gb, gper = RES / gs;
        if (gper === Math.round(gper) && sub % gper === 0) {
          var gi = (beat % gb) * gs + sub / gper;
          Object.keys(o.groove.tracks).forEach(function (r) { var c = o.groove.tracks[r][gi]; if (c && c !== ".") OM.synth.drum(r, t, c === "o" ? o.drumVol * 0.45 : o.drumVol); });
        }
      }
      if (sub === 0) {
        var info = { beat: beat, idx: pos.idx, inChord: pos.inChord, chordBeats: o.chords[pos.idx].beats || 4, bar: Math.floor(beat / o.beats), beatInBar: beat % o.beats };
        OM.at(t, function () { if (self.running) o.onBeat && o.onBeat(info); });
      }
      cIdx = pos.idx;
    });
    this.clock.start(0.08);
    if (OM.store.settings().keepAwake) OM.bridge.keepAwake(true);
  };
  Accomp.prototype.stop = function () {
    if (!this.clock) return;
    this.running = false; this.clock.stop();
    var c = OM.audio.context(), t = c.currentTime;
    ["_chord", "_bass", "_picki", "_pickm", "_picka"].forEach(function (k) { if (this[k]) try { this[k].gain.setTargetAtTime(0, t, 0.05); } catch (e) { } this[k] = null; }, this);
    if (!OM.metro.S.running) OM.bridge.keepAwake(false);
  };

  OM.Accomp = Accomp;
  OM.chordNotes = chordNotes;
})(window.OM);
