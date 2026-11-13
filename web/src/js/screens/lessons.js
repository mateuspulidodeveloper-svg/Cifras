/* O Músico — cursos e lições, guias de instrumentos, mapa do braço e importação/exportação JSON */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory, L = OM.lib;

  function done() { return OM.store.get("lessons", {}); }
  function markDone(id) { OM.store.update("lessons", {}, function (m) { m[id] = Date.now(); }); }
  function courseProgress(c) { var d = done(); return c.lessons.filter(function (l) { return d[l.id]; }).length; }
  function nextLesson() {
    var d = done();
    for (var i = 0; i < OM.COURSES.length; i++) for (var j = 0; j < OM.COURSES[i].lessons.length; j++) {
      var l = OM.COURSES[i].lessons[j]; if (!d[l.id]) return { course: OM.COURSES[i], lesson: l };
    }
    return null;
  }
  OM.lessons = { nextLesson: nextLesson, courseProgress: courseProgress };
  function chordInst() { return OM.inst.pref(["string", "keys"]); }
  function stringInst() { return OM.inst.pref(["string", "bowed"]); }

  /* ---------- curso ---------- */
  OM.screen("course", function (p) {
    var c = OM.COURSES.filter(function (x) { return x.id === p.id; })[0];
    var content = h("div.content");
    var bar = ui.topbar({ title: c.n, back: true });
    var el = h("section", bar, content);
    function draw() {
      OM.u.clear(content);
      var n = courseProgress(c), d = done();
      content.appendChild(h("p.muted", { style: { fontSize: "14px", margin: "4px 0 10px" }, text: c.d }));
      content.appendChild(h("div.card", h("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "13.5px", marginBottom: "6px" } }, h("span", { text: "Progresso" }), h("b", { text: n + " de " + c.lessons.length + " lições" })),
        h("div.prog", h("i", { style: { width: n / c.lessons.length * 100 + "%" } }))));
      var l = h("div.list", { style: { marginTop: "12px" } });
      c.lessons.forEach(function (ls, i) {
        l.appendChild(ui.item({ lead: h("span.keybadge", { text: d[ls.id] ? "✓" : i + 1, style: d[ls.id] ? { color: "var(--ok)" } : null }), title: ls.n, sub: d[ls.id] ? "Concluída" : "Lição " + (i + 1),
          onClick: function () { OM.router.push("lesson", { course: c.id, id: ls.id }); } }));
      });
      content.appendChild(l);
    }
    return { el: el, onShow: draw };
  });

  /* ---------- lição ---------- */
  function renderBlock(b, stops) {
    var inst = chordInst();
    switch (b.t) {
      case "p": return h("p", { text: b.text, style: { margin: "10px 0", lineHeight: 1.6 } });
      case "h": return h("div.lbl", { text: b.text });
      case "tip": return h("div", { style: { margin: "12px 0" } }, ui.notice(b.text, false, "star"));
      case "list": return h("ul", { style: { paddingLeft: "20px", margin: "10px 0", lineHeight: 1.6 } }, b.items.map(function (x) { return h("li", { text: x, style: { marginBottom: "4px" } }); }));
      case "table": return h("div.card", { style: { margin: "10px 0", padding: "4px 14px" } }, b.rows.map(function (r) { return h("div.kv", h("b", { text: r[0], style: { textAlign: "left", color: "var(--chord)" } }), h("span", { text: r[1], style: { textAlign: "right" } })); }));
      case "chords": {
        var g = h("div.voicings", { style: { margin: "10px 0", gridTemplateColumns: "repeat(auto-fill,minmax(" + (inst.kind === "keys" ? 150 : b.big ? 130 : 96) + "px,1fr))" } });
        b.names.forEach(function (n) {
          var c = h("button.vc", { onclick: function () { ui.playChord(n, inst); } }, ui.chordView(n, inst, { size: inst.kind === "keys" ? 90 : b.big ? 120 : 84, max: 1, labels: !!b.big }));
          c.appendChild(h("small", { text: "Toque para ouvir" }));
          g.appendChild(c);
        });
        return h("div", g, h("p.dim", { style: { fontSize: "12px" }, text: "Diagramas para: " + inst.n + (inst.id !== OM.inst.current().id ? " (seu instrumento não usa diagramas de acordes)" : "") }));
      }
      case "piano": return h("div.card", { style: { padding: "10px", margin: "10px 0" } }, ui.piano({ from: b.from || 48, to: b.to || 71, hl: b.notes, roots: b.roots, labels: b.labels !== false, onKey: function (m) { OM.synth.piano(m); } }));
      case "play": return h("div", { style: { margin: "8px 0" } }, ui.btn(b.label, "sound", function () {
        if (b.chord) ui.playChord(b.chord, inst);
        else OM.synth.sequence(b.seq, 0.42, inst.kind === "string" ? inst : OM.inst.get("piano"));
      }, "sm"));
      case "prog": {
        var chipsEl = h("div.chips", b.chords.map(function (c) { return h("span.chip", { text: c }); }));
        var btn = ui.btn(b.label, "play", function () {
          var timers = stops.prog || [];
          timers.forEach(clearTimeout);
          stops.prog = b.chords.map(function (c, i) {
            return setTimeout(function () {
              [].forEach.call(chipsEl.children, function (x, k) { x.classList.toggle("on", k === i); });
              ui.playChord(c, inst);
            }, i * 1100);
          });
          stops.prog.push(setTimeout(function () { [].forEach.call(chipsEl.children, function (x) { x.classList.remove("on"); }); }, b.chords.length * 1100 + 200));
        }, "sm");
        return h("div", { style: { margin: "10px 0" } }, btn, h("div", { style: { marginTop: "8px" } }, chipsEl));
      }
      case "staff": {
        var notes = OM.staff.parseMelody(b.notes), r = OM.staff.render({ clef: b.clef || "treble", key: b.key || "C", time: b.time, notes: notes, width: 340 });
        return h("div.card", { style: { margin: "10px 0" } }, r.svg, h("div", { style: { marginTop: "8px" } }, ui.btn("Ouvir", "play", function () {
          if (stops.staff) stops.staff();
          stops.staff = OM.staff.play(r.notes, 80, function (i) { r.noteEls.forEach(function (n) { n && n.classList.remove("cur"); }); if (i >= 0 && r.noteEls[i]) r.noteEls[i].classList.add("cur"); }, OM.inst.get("piano"));
        }, "sm")));
      }
      case "fret": {
        var si = stringInst(), tm = OM.inst.tuningMidi(OM.inst.tuningOf(si));
        return h("div", { style: { margin: "10px 0" } }, ui.fretboard({ tuning: tm, frets: b.frets || 12, marks: function (s, f) {
          var n = T.name(tm[s] + f); return { label: T.display(n).replace("♯", "#"), on: n.length === 1, root: n === "C" };
        }, onTap: function (s, f) { OM.synth.note(tm[s] + f, si); } }), h("p.dim", { style: { fontSize: "12px", marginTop: "4px" }, text: si.n + ": cada casa sobe um semitom. Toque para ouvir." }));
      }
      case "link": return h("div", { style: { margin: "8px 0" } }, ui.btn(b.label, "chev", function () { OM.router.push(b.screen, b.params || {}); }, "sm ghost"));
    }
    return null;
  }
  OM.screen("lesson", function (p) {
    var c = OM.COURSES.filter(function (x) { return x.id === p.course; })[0];
    var idx = c.lessons.findIndex(function (l) { return l.id === p.id; }), ls = c.lessons[idx];
    var content = h("div.content"), stops = {};
    var bar = ui.topbar({ title: ls.n, sub: c.n + " · Lição " + (idx + 1) + " de " + c.lessons.length, back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var t0 = Date.now();
    ls.b.forEach(function (b) { var e = renderBlock(b, stops); if (e) content.appendChild(e); });
    var nxt = c.lessons[idx + 1];
    content.appendChild(h("div.btnrow", { style: { marginTop: "22px" } }, ui.btn(nxt ? "Concluir e ir para a próxima" : "Concluir curso", "check", function () {
      var first = !done()[ls.id];
      markDone(ls.id);
      if (first) L.log({ type: "tool", icon: "learn", screen: "lesson", params: { course: c.id, id: ls.id }, title: "Lição: " + ls.n, detail: c.n, minutes: Math.round((Date.now() - t0) / 6000) / 10 });
      if (nxt) OM.router.replace("lesson", { course: c.id, id: nxt.id });
      else { ui.toast("Curso concluído! Parabéns."); OM.router.back(); }
    }, "pri block")));
    return { el: el, destroy: function () { (stops.prog || []).forEach(clearTimeout); if (stops.staff) stops.staff(); } };
  });

  /* ---------- guias de instrumentos ---------- */
  OM.screen("instguides", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Conheça os instrumentos", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    content.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "4px 0" }, text: "Partes, afinação, primeiros acordes, mapa do braço e dicas para começar." }));
    OM.inst.GROUPS.forEach(function (g) {
      content.appendChild(h("div.lbl", { text: g.n }));
      var l = h("div.list");
      g.ids.forEach(function (id) {
        var i = OM.inst.get(id), t = OM.inst.tuningOf(i);
        l.appendChild(ui.item({ icon: OM.inst.icon(i), iconCls: "acc", title: i.n, sub: t ? t.n : { keys: "Teclas", drums: "Percussão", wind: "Sopro", voice: "Voz" }[i.kind], onClick: function () { OM.router.push("instguide", { id: id }); } }));
      });
      content.appendChild(l);
    });
    return { el: el };
  });
  OM.screen("instguide", function (p) {
    var inst = OM.inst.get(p.id);
    var info = OM.INST_INFO[inst.id] || (inst.kind === "wind" ? OM.INST_INFO._wind : { d: "Instrumento personalizado.", partes: [], dicas: [], first: [] });
    var content = h("div.content");
    var bar = ui.topbar({ title: inst.n, sub: "Guia do instrumento", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function draw() {
      OM.u.clear(content);
      var isMain = OM.store.settings().instrument === inst.id;
      content.appendChild(h("div", { style: { display: "flex", gap: "14px", alignItems: "center", margin: "4px 0 6px" } }, h("div.avatar", { html: OM.icon(OM.inst.icon(inst)), style: { padding: "16px" } }),
        h("div", { style: { flex: 1 } }, h("h2", { text: inst.n, style: { fontSize: "20px" } }), isMain ? h("span.badge.acc", { text: "Seu instrumento principal" }) : null)));
      content.appendChild(h("p", { text: info.d, style: { lineHeight: 1.6, margin: "10px 0" } }));
      if (!isMain) content.appendChild(h("div.btnrow", ui.btn("Usar como principal", "star", function () { OM.store.setSetting("instrument", inst.id); OM.router.refreshRoots(); ui.toast(inst.n + " é seu instrumento principal"); draw(); }, "pri sm")));
      if (info.partes && info.partes.length) { content.appendChild(h("div.lbl", { text: "Partes" })); content.appendChild(h("ul", { style: { paddingLeft: "20px", lineHeight: 1.6 } }, info.partes.map(function (x) { return h("li", { text: x }); }))); }
      if (inst.tunings) {
        var t = OM.inst.tuningOf(inst), tm = OM.inst.tuningMidi(t);
        content.appendChild(h("div.lbl", { text: "Afinação — " + t.n }));
        content.appendChild(h("div.notes-row", tm.map(function (m, i) {
          return h("span.notepill", { text: T.display(T.name(m)), onclick: function () { OM.synth.note(m, inst); } }, h("small", { text: (tm.length - i) + "ª · " + T.midiToFreq(m).toFixed(0) + " Hz" }));
        })));
        content.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Afinar", "tuner", function () { OM.router.push("tuner", { inst: inst.id }); }, "sm"),
          ui.btn("Mapa do braço", "guitar", function () { OM.router.push("fretmap", { inst: inst.id }); }, "sm"),
          ui.btn("Outras afinações", "swap", function () { OM.router.push("instrument", { id: inst.id }); }, "sm ghost")));
        content.appendChild(h("div.lbl", { text: "Notas naturais no braço" }));
        content.appendChild(ui.fretboard({ tuning: tm, frets: 12, marks: function (s, f) { var n = T.name(tm[s] + f); return n.length === 1 ? { label: T.display(n).slice(0, 3), root: n === "C" } : null; }, onTap: function (s, f) { OM.synth.note(tm[s] + f, inst); } }));
      }
      if (inst.kind === "keys") {
        content.appendChild(h("div.lbl", { text: "Localize as notas" }));
        content.appendChild(h("div.card", { style: { padding: "10px" } }, ui.piano({ from: 48, to: 83, hl: [60], roots: [0], labels: true, labelsAll: true, onKey: function (m) { OM.synth.piano(m); } })));
        content.appendChild(h("p.dim", { style: { fontSize: "12px", marginTop: "6px" }, text: "Destacado: Dó central (C4). Toque nas teclas para ouvir." }));
        content.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Mapa do teclado", "piano", function () { OM.router.push("fretmap", { inst: inst.id }); }, "sm")));
      }
      if (inst.kind === "wind") {
        var tr = inst.transp || 0;
        content.appendChild(h("div.lbl", { text: "Transposição" }));
        content.appendChild(h("div.card", h("p", { text: tr % 12 ? "Quando você lê Dó, soa " + T.display(T.name(60 + tr, true)) + ". O app mostra cifras, afinador e notas já escritos para o seu instrumento." : "Instrumento em Dó: a nota escrita é a nota real" + (tr ? " (soa uma oitava acima)." : ".") }),
          inst.range ? h("p.muted", { style: { marginTop: "6px", fontSize: "13px" }, text: "Extensão aproximada (som real): " + inst.range.join(" – ") }) : null));
        content.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Ouvir escala de Dó escrita", "sound", function () { OM.synth.sequence([60, 62, 64, 65, 67, 69, 71, 72].map(function (m) { return m + tr % 12; }), 0.4, OM.inst.get("piano")); }, "sm"),
          ui.btn("Afinador", "tuner", function () { OM.router.push("tuner", { inst: inst.id }); }, "sm")));
      }
      if (inst.kind === "drums") {
        content.appendChild(h("div.lbl", { text: "Ouça as peças" }));
        content.appendChild(h("div.chips.wrap", OM.synth.DRUMS.map(function (d) { return h("button.chip", { text: d.n, onclick: function () { OM.synth.drum(d.id, OM.audio.context().currentTime + 0.01); } }); })));
        content.appendChild(h("div.btnrow", { style: { marginTop: "12px" } }, ui.btn("Grooves para praticar", "drum", function () { OM.router.push("grooves"); }, "sm"), ui.btn("Metrônomo", "metro", function () { OM.router.push("metronome"); }, "sm")));
      }
      if (info.first && info.first.length && (inst.kind === "string" || inst.kind === "keys")) {
        content.appendChild(h("div.lbl", { text: "Primeiros acordes" }));
        var g = h("div.voicings", { style: { gridTemplateColumns: "repeat(auto-fill,minmax(" + (inst.kind === "keys" ? 150 : 96) + "px,1fr))" } });
        info.first.forEach(function (n) { g.appendChild(h("button.vc", { onclick: function () { ui.playChord(n, inst); } }, ui.chordView(n, inst, { size: inst.kind === "keys" ? 90 : 84, max: 1 }))); });
        content.appendChild(g);
        content.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Curso: aprender acordes", "learn", function () { OM.router.push("course", { id: "acordes" }); }, "sm ghost")));
      }
      if (info.dicas && info.dicas.length) { content.appendChild(h("div.lbl", { text: "Dicas para começar" })); content.appendChild(h("ul", { style: { paddingLeft: "20px", lineHeight: 1.6 } }, info.dicas.map(function (x) { return h("li", { text: x, style: { marginBottom: "4px" } }); }))); }
    }
    draw();
    return { el: el };
  });

  /* ---------- mapa do braço / teclado ---------- */
  OM.screen("fretmap", function (p) {
    var inst = p.inst ? OM.inst.get(p.inst) : OM.inst.current();
    if (!OM.inst.hasStrings(inst) && inst.kind !== "keys") inst = OM.inst.pref(["string", "bowed", "keys"]);
    var mode = "all", root = "C", scaleId = "major", chordT = "", sel = null;
    var content = h("div.content");
    var bar = ui.topbar({ title: "Mapa do braço", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var MODES = [{ v: "all", label: "Todas as notas" }, { v: "nat", label: "Naturais" }, { v: "note", label: "Encontrar nota" }, { v: "int", label: "Intervalos" }, { v: "scale", label: "Escala" }, { v: "chord", label: "Acorde" }];
    function pickInst() {
      var opts = OM.inst.all().filter(function (i) { return OM.inst.hasStrings(i) || i.kind === "keys"; }).map(function (i) { return { v: i.id, label: i.n, sub: i.kind === "keys" ? "Teclado" : OM.inst.tuningOf(i).n }; });
      ui.pick("Instrumento", opts, inst.id).then(function (v) { if (v) { inst = OM.inst.get(v); sel = null; draw(); } });
    }
    function pickTuning() {
      ui.pick("Afinação", inst.tunings.map(function (t) { return { v: t.id, label: t.n }; }), OM.inst.tuningOf(inst).id).then(function (v) { if (v) { OM.inst.setTuning(inst, v); sel = null; draw(); } });
    }
    function pcsSel() {
      var rp = T.pc(root);
      if (mode === "scale") return T.SCALES.filter(function (s) { return s.id === scaleId; })[0].i.map(function (i) { return T.mod12(rp + i); });
      if (mode === "chord") return T.parseChord(root + chordT).pcs;
      if (mode === "note") return [rp];
      return null;
    }
    function label(m) {
      var pc = T.mod12(m), rp = T.pc(root), fl = T.keyUsesFlats(root);
      if (mode === "int" || mode === "chord") return T.SCALE_INT[T.mod12(pc - rp)];
      return T.display(T.name(pc, fl)).replace("♯", "#").replace("♭", "b");
    }
    function mark(m) {
      var pc = T.mod12(m), rp = T.pc(root), nat = T.name(pc).length === 1, set = pcsSel();
      if (sel != null && m === sel) return { label: label(m), q: true, on: false };
      if (mode === "all") return { label: label(m), on: nat, root: false };
      if (mode === "nat") return nat ? { label: label(m), root: pc === 0 } : null;
      if (mode === "int") return { label: label(m), root: pc === rp, on: true };
      if (set && set.indexOf(pc) >= 0) return { label: label(m), root: pc === rp };
      return null;
    }
    function draw() {
      OM.u.clear(content);
      var isKeys = inst.kind === "keys";
      content.appendChild(ui.instSwitch({ kinds: ["string", "bowed", "keys"], current: inst, onChange: function (i) { inst = i; sel = null; draw(); } }));
      if (!isKeys) content.appendChild(h("div.btnrow", { style: { marginTop: "6px" } }, ui.btn(OM.inst.tuningOf(inst).n, "swap", pickTuning, "sm ghost")));
      content.appendChild(h("div", { style: { marginTop: "12px" } }, ui.chips(MODES, mode, function (v) { mode = v; draw(); })));
      if (mode !== "all" && mode !== "nat") {
        var kr = h("div.keyrow", { style: { marginTop: "10px" } });
        T.ROOTS.forEach(function (r) { kr.appendChild(h("button" + (r === root ? ".on" : ""), { text: T.display(r), onclick: function () { root = r; draw(); } })); });
        content.appendChild(kr);
      }
      if (mode === "scale") {
        var ss = h("select.inp", { style: { marginTop: "10px" } }, T.SCALES.map(function (s) { return h("option", { value: s.id, text: s.n }); }));
        ss.value = scaleId; ss.onchange = function () { scaleId = ss.value; draw(); };
        content.appendChild(ss);
      }
      if (mode === "chord") {
        var cs = h("select.inp", { style: { marginTop: "10px" } }, T.CHORD_TYPES.map(function (t) { return h("option", { value: t.id, text: root + t.id + " — " + t.n }); }));
        cs.value = chordT; cs.onchange = function () { chordT = cs.value; draw(); };
        content.appendChild(cs);
      }
      var desc = { all: "Todas as notas. As naturais aparecem em destaque.", nat: "Só as notas naturais (sem acidentes). O Dó aparece em laranja.", note: "Todas as posições de " + T.display(root) + " no instrumento.",
        int: "Cada posição mostra o intervalo em relação a " + T.display(root) + ": T = tônica, 3M = terça maior, 5J = quinta justa…",
        scale: "Notas da escala; a tônica em laranja.", chord: "Notas do acorde " + root + chordT + " (T, 3ª, 5ª, 7ª…) em todo o braço." }[mode];
      content.appendChild(h("p.muted", { style: { fontSize: "13px", margin: "10px 0" }, text: desc + " Toque numa posição para ouvir; as notas de mesma altura (uníssonos) são marcadas." }));
      var info = h("div.card", { style: { marginTop: "10px", minHeight: "56px" } });
      function showInfo(m, where) {
        if (m == null) { info.appendChild(h("p.dim", { style: { fontSize: "13px" }, text: "Toque numa nota do mapa." })); return; }
        info.appendChild(h("div", { style: { display: "flex", alignItems: "baseline", gap: "10px" } }, h("b", { text: T.display(T.midiName(m, T.keyUsesFlats(root))), style: { fontSize: "24px", color: "var(--chord)" } }),
          h("span.muted", { text: T.midiToFreq(m).toFixed(2) + " Hz" + (where ? " · " + where : "") })));
      }
      if (isKeys) {
        var from = 48, to = 83, hl = [];
        for (var m = from; m <= to; m++) { var mk = mark(m); if (mk && (mk.on !== false || mk.q) && mode !== "all") hl.push(m); }
        if (sel != null && hl.indexOf(sel) < 0) hl.push(sel);
        var rootsArr = mode === "all" || mode === "nat" ? [] : [T.pc(root)];
        content.appendChild(h("div.card", { style: { padding: "10px", overflowX: "auto" } }, h("div", { style: { minWidth: "560px" } }, ui.piano({ from: from, to: to, hl: hl, roots: rootsArr, labels: true, labelsAll: mode === "all" || mode === "nat", flats: T.keyUsesFlats(root),
          onKey: function (mm) { sel = mm; OM.synth.piano(mm); draw(); } }))));
        content.appendChild(info);
        showInfo(sel, sel != null ? "oitava " + (Math.floor(sel / 12) - 1) : "");
        return;
      }
      var tm = OM.inst.tuningMidi(OM.inst.tuningOf(inst));
      content.appendChild(ui.fretboard({ tuning: tm, frets: Math.min(24, inst.frets || 15), marks: function (s, f) { return mark(tm[s] + f); },
        onTap: function (s, f) { sel = tm[s] + f; OM.synth.note(sel, inst); draw(); OM.u.clear(info); showInfo(sel, (tm.length - s) + "ª corda, " + (f ? f + "ª casa" : "solta")); } }));
      if (inst.kind === "bowed") content.appendChild(h("p.dim", { style: { fontSize: "12px", marginTop: "4px" }, text: "Instrumento sem trastes: as linhas indicam as posições de cada semitom." }));
      content.appendChild(info);
      showInfo(sel, "");
      if (sel != null) {
        var pos = []; tm.forEach(function (o, s) { var f = sel - o; if (f >= 0 && f <= (inst.frets || 15)) pos.push((tm.length - s) + "ª corda casa " + f); });
        info.appendChild(h("p.dim", { style: { fontSize: "12.5px", marginTop: "4px" }, text: "Mesma nota em: " + pos.join(" · ") }));
      }
    }
    draw();
    return { el: el };
  });

  /* ---------- importar / exportar músicas (JSON) e guia para IA ---------- */
  OM.screen("transfer", function (p) {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Importar e exportar músicas", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var preview = h("div"), parsed = null, fileBase = "";
    function readText(text, name) {
      OM.u.clear(preview); parsed = null;
      try { parsed = OM.transfer.parse(text); }
      catch (e) { preview.appendChild(h("div", { style: { marginTop: "12px" } }, ui.notice(e.message, true))); return; }
      fileBase = name || "";
      showPreview();
    }
    function showPreview() {
      OM.u.clear(preview);
      var it = parsed.items;
      preview.appendChild(h("div.lbl", { text: "Prévia: " + it.length + (it.length === 1 ? " música válida" : " músicas válidas") + (parsed.errors.length ? " · " + parsed.errors.length + " com erro" : "") }));
      if (it.length) {
        var l = h("div.list");
        it.forEach(function (x) { l.appendChild(ui.item({ lead: h("span.keybadge", { text: x.song.key || "–" }), title: x.song.title, sub: x.song.artist + " · " + x.chordCount + " acordes" + (x.song.bpm ? " · " + x.song.bpm + " BPM" : "") + (x.song.melody ? " · partitura" : ""), end: null })); });
        preview.appendChild(l);
      }
      parsed.errors.forEach(function (e) { preview.appendChild(h("div", { style: { marginTop: "8px" } }, ui.notice("Item " + e.i + (e.title ? " (" + e.title + ")" : "") + ": " + e.msg, true))); });
      if (!it.length) return;
      var mkList = !!parsed.repertoire || it.length > 1;
      var nameInp = h("input.inp", { type: "text", value: parsed.repertoire || (fileBase ? fileBase : "Importadas " + new Date().toLocaleDateString("pt-BR")), maxlength: 80 });
      var nameField = h("label.field", { style: { marginTop: "8px" } }, h("span", { text: "Nome do repertório" }), nameInp);
      if (!mkList) nameField.classList.add("hidden");
      preview.appendChild(h("div.card", { style: { marginTop: "12px", padding: "4px 14px 4px" } }, ui.row("Criar repertório com estas músicas", ui.toggle(mkList, function (v) { mkList = v; nameField.classList.toggle("hidden", !v); })), nameField));
      preview.appendChild(h("div", { style: { marginTop: "12px" } }, ui.btn("Importar " + it.length + (it.length === 1 ? " música" : " músicas"), "download", function () {
        var r = OM.transfer.importItems(it, mkList ? nameInp.value.trim() || "Importadas" : null);
        ui.toast(r.created + " nova(s), " + r.updated + " atualizada(s)", 3000);
        OM.u.clear(preview);
        preview.appendChild(h("div", { style: { marginTop: "12px" } }, ui.notice("Importação concluída: " + r.created + " música(s) nova(s) e " + r.updated + " atualizada(s)." + (r.list ? " Repertório “" + r.list.name + "” criado." : ""), false, "check")));
        var l2 = h("div.list", { style: { marginTop: "10px" } });
        r.ids.forEach(function (id) { var s = L.get(id); if (s) l2.appendChild(OM.homeHelpers.songItem(s)); });
        preview.appendChild(l2);
        if (r.list) preview.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Abrir repertório", "list", function () { OM.router.push("list", { id: r.list.id }); }, "sm")));
        parsed = null;
      }, "pri block")));
    }
    function chooseFile() {
      var f = h("input", { type: "file", accept: ".json,application/json,text/plain" });
      f.onchange = function () {
        var file = f.files[0]; if (!file) return;
        var r = new FileReader();
        r.onload = function () { readText(String(r.result), file.name.replace(/\.omusico\.json$|\.json$/i, "")); };
        r.readAsText(file);
      };
      f.click();
    }
    var paste = h("textarea.inp.code", { spellcheck: "false", placeholder: "Cole aqui o JSON (por exemplo, a resposta de uma IA)…", style: { minHeight: "120px" } });

    content.appendChild(h("div.lbl", { text: "Importar" }));
    content.appendChild(h("p.muted", { style: { fontSize: "13.5px", marginBottom: "10px" }, text: "Traga músicas prontas de um arquivo JSON: uma música ou várias, de outro aparelho, de um amigo ou geradas por uma IA a partir do guia abaixo." }));
    content.appendChild(h("div.btnrow", ui.btn("Escolher arquivo JSON", "upload", chooseFile, "pri"), ui.btn("Arquivo de texto / ChordPro", "notes", function () {
      var f = h("input", { type: "file", accept: ".txt,.cho,.chordpro,.chopro,.pro,.crd,text/plain" });
      f.onchange = function () { var file = f.files[0]; if (!file) return; var r = new FileReader(); r.onload = function () { OM.router.push("editor", { importText: String(r.result), fileName: file.name.replace(/\.[^.]+$/, "") }); }; r.readAsText(file); };
      f.click();
    }, "ghost")));
    content.appendChild(h("div", { style: { marginTop: "12px" } }, paste));
    content.appendChild(h("div.btnrow", { style: { marginTop: "8px" } }, ui.btn("Ler JSON colado", "check", function () { if (!paste.value.trim()) { ui.toast("Cole o JSON primeiro"); return; } readText(paste.value, ""); }, "sm")));
    content.appendChild(preview);

    content.appendChild(h("div.lbl", { text: "Criar músicas com uma IA" }));
    content.appendChild(h("div.card",
      h("p", { style: { fontSize: "14px", lineHeight: 1.55 }, text: "O app gera um guia em JSON que explica a uma IA (ChatGPT, Claude, Gemini…) como montar cifras no formato que ele importa: campos, notação de acordes, seções, tablaturas, partitura e um exemplo completo." }),
      h("ol", { style: { paddingLeft: "20px", fontSize: "13.5px", color: "var(--tx2)", lineHeight: 1.6, margin: "10px 0" } },
        h("li", { text: "Exporte ou copie o guia." }), h("li", { text: "Envie o guia à IA e peça a música (use o prompt sugerido)." }), h("li", { text: "Salve a resposta como .json ou cole-a no campo acima e importe." })),
      h("div.btnrow", ui.btn("Exportar guia (.json)", "download", OM.transfer.exportGuide, "pri sm"), ui.btn("Copiar / compartilhar", "share", function () { OM.bridge.share(OM.transfer.guideText()); }, "sm")),
      h("div.btnrow", { style: { marginTop: "8px" } }, ui.btn("Ver guia", "eye", function () {
        ui.sheet({ title: "Guia para IA", content: h("pre.out", { text: OM.transfer.guideText(), style: { fontSize: "11.5px", maxHeight: "60vh", overflow: "auto" } }) });
      }, "sm ghost"), ui.btn("Baixar modelo vazio", "notes", OM.transfer.exportTemplate, "sm ghost"))));
    var prompt = OM.transfer.guide().prompt_sugerido;
    content.appendChild(h("div.card", { style: { marginTop: "10px" } }, h("h3", { text: "Prompt sugerido" }), h("p.out", { text: prompt, style: { fontSize: "13px" } }),
      h("div.btnrow", { style: { marginTop: "8px" } }, ui.btn("Copiar prompt + guia", "copy", function () { OM.bridge.share(prompt + "\n\n" + OM.transfer.guideText()); }, "sm"))));

    content.appendChild(h("div.lbl", { text: "Exportar" }));
    var exl = h("div.list");
    var mine = L.all().filter(function (s) { return s.user || s.edited; }).map(function (s) { return s.id; });
    exl.appendChild(ui.item({ icon: "edit", iconCls: "acc", title: "Minhas cifras", sub: mine.length + " músicas (criadas, importadas e editadas)", onClick: function () { OM.transfer.exportFile(mine, "minhas-cifras"); } }));
    exl.appendChild(ui.item({ icon: "heart", iconCls: "acc", title: "Favoritas", sub: L.favs().length + " músicas", onClick: function () { OM.transfer.exportFile(L.favs().filter(L.get), "favoritas"); } }));
    exl.appendChild(ui.item({ icon: "cifras", iconCls: "acc", title: "Todo o acervo", sub: L.all().length + " músicas", onClick: function () { OM.transfer.exportFile(L.all().map(function (s) { return s.id; }), "acervo-o-musico"); } }));
    L.lists().forEach(function (l) { exl.appendChild(ui.item({ icon: "list", iconCls: "acc", title: "Repertório: " + l.name, sub: l.songs.length + " músicas", onClick: function () { OM.transfer.exportFile(l.songs, l.name, l.name); } })); });
    content.appendChild(exl);
    content.appendChild(h("p.dim", { style: { fontSize: "12px", marginTop: "8px" }, text: "Arquivos salvos em Downloads/O Musico. Use-os para levar músicas a outro aparelho ou pedir a uma IA que revise, transponha ou complete as cifras." }));
    if (p.text) readText(p.text, p.name || "");
    return { el: el };
  });
})(window.OM);
