/* O Músico — bateria/grooves, dicionário, percepção (atalho), instrumentos, histórico */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory;

  /* ---------- bateria e grooves ---------- */
  OM.screen("grooves", function () {
    var user = OM.store.get("drumUser", []);
    function all() { return OM.GROOVES.concat(user); }
    var cur = JSON.parse(JSON.stringify(all()[0])), bpm = cur.bpm, playing = false, clock = null, vol = 0.8, curStep = -1;
    var content = h("div.content");
    var bar = ui.topbar({ title: "Bateria e grooves", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var gridEl = h("div.seqgrid"), sel = h("select.inp"), bpmLbl = h("b.num");
    var playBtn = h("button.bigplay", { style: { width: "64px", height: "64px" }, onclick: toggle, "aria-label": "Tocar/parar" });
    function fillSel() {
      OM.u.clear(sel);
      all().forEach(function (g, i) { sel.appendChild(h("option", { value: i, text: g.n + (g.user ? " (meu)" : "") })); });
    }
    sel.onchange = function () { cur = JSON.parse(JSON.stringify(all()[+sel.value])); bpm = cur.bpm; bpmSt.set(bpm); draw(); if (playing) { stop(); start(); } };
    var bpmSt = ui.stepper(bpm, 40, 240, 2, function (v) { return v + " BPM"; }, function (v) { bpm = v; });
    function rows() { return OM.DRUM_ROWS.filter(function (r) { return cur.tracks[r] != null || ["kick", "snare", "hat"].indexOf(r) >= 0; }); }
    function draw() {
      OM.u.clear(gridEl);
      var n = cur.steps, per = n / (cur.beats || 4);
      rows().forEach(function (r) {
        var pat = (cur.tracks[r] || ".".repeat(n)).split("");
        var steps = h("div.seqsteps", { style: { gridTemplateColumns: "repeat(" + n + ",1fr)" } });
        pat.forEach(function (c, i) {
          steps.appendChild(h("button" + (c !== "." ? ".on" : "") + (Math.floor(i / per) % 2 ? ".q" : ""), { "data-i": i, style: c === "o" ? { opacity: .55 } : null, onclick: function () {
            var p = (cur.tracks[r] || ".".repeat(n)).split(""); p[i] = p[i] === "." ? "x" : p[i] === "x" ? "o" : "."; cur.tracks[r] = p.join(""); draw();
            if (p[i] !== ".") OM.synth.drum(r, OM.audio.context().currentTime, p[i] === "o" ? vol * 0.5 : vol);
          } }));
        });
        gridEl.appendChild(h("div.seqrow", h("span", { text: (OM.synth.DRUMS.filter(function (d) { return d.id === r; })[0] || {}).n }), steps));
      });
      playBtn.innerHTML = OM.icon(playing ? "stop" : "play");
    }
    function start() {
      var n = cur.steps, per = n / (cur.beats || 4), t0 = Date.now();
      clock = new OM.Clock(function () { return 60 / bpm / per; }, function (t, i) {
        var s = i % n;
        Object.keys(cur.tracks).forEach(function (r) { var c = cur.tracks[r][s]; if (c && c !== ".") OM.synth.drum(r, t, c === "o" ? vol * 0.45 : vol); });
        OM.at(t, function () { curStep = s; [].forEach.call(gridEl.querySelectorAll(".seqsteps button"), function (b) { b.classList.toggle("play", +b.getAttribute("data-i") === s); }); });
      });
      clock.start(0.08); playing = true; clock.t0 = t0; draw();
      if (OM.store.settings().keepAwake) OM.bridge.keepAwake(true);
    }
    function stop() {
      if (!clock) return;
      var min = (Date.now() - clock.t0) / 60000;
      clock.stop(); clock = null; playing = false; draw();
      [].forEach.call(gridEl.querySelectorAll(".play"), function (b) { b.classList.remove("play"); });
      if (min >= 1) OM.lib.log({ type: "tool", icon: "drum", screen: "grooves", title: "Groove: " + cur.n, detail: bpm + " BPM", minutes: Math.round(min * 10) / 10 });
      if (!OM.metro.S.running) OM.bridge.keepAwake(false);
    }
    function toggle() { playing ? stop() : start(); }
    function saveMine() {
      ui.prompt("Salvar groove", "Nome", cur.user ? cur.n : cur.n + " (variação)").then(function (n) {
        if (!n) return;
        var g = { id: cur.user ? cur.id : OM.u.uid("g"), n: n, bpm: bpm, steps: cur.steps, beats: cur.beats, tracks: cur.tracks, user: true };
        user = user.filter(function (x) { return x.id !== g.id; }); user.push(g); OM.store.set("drumUser", user);
        cur = JSON.parse(JSON.stringify(g)); fillSel(); sel.value = all().findIndex(function (x) { return x.id === g.id; }); ui.toast("Groove salvo");
      });
    }
    content.appendChild(h("label.field", h("span", { text: "Ritmo" }), sel));
    content.appendChild(h("div", { style: { display: "flex", alignItems: "center", gap: "14px", justifyContent: "space-between" } }, bpmSt, playBtn));
    content.appendChild(gridEl);
    content.appendChild(h("div.range", { style: { marginTop: "14px" } }, h("span", { html: OM.icon("sound"), style: { width: "20px", color: "var(--tx2)" } }), ui.range(0, 1, 0.05, vol, function (v) { vol = v; })));
    content.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Salvar como meu", "plus", saveMine, "sm ghost"),
      ui.btn("Limpar", "trash", function () { Object.keys(cur.tracks).forEach(function (k) { cur.tracks[k] = ".".repeat(cur.steps); }); draw(); }, "sm ghost")));
    content.appendChild(h("p.dim", { style: { fontSize: "12px", marginTop: "10px" }, text: "Toque nas células para editar: forte → fraco → vazio. Cada linha é um compasso; colunas sombreadas marcam os tempos." }));
    fillSel(); draw();
    return { el: el, destroy: stop, onHide: stop };
  });

  /* ---------- dicionário ---------- */
  OM.screen("dictionary", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Dicionário musical", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var input = h("input", { type: "search", placeholder: "Buscar termo…" }), dl = h("dl.dict");
    input.addEventListener("input", OM.u.debounce(draw, 100));
    function draw() {
      var q = OM.u.norm(input.value);
      OM.u.clear(dl);
      var r = OM.DICT.filter(function (d) { return !q || OM.u.norm(d[0]).indexOf(q) >= 0 || OM.u.norm(d[1]).indexOf(q) >= 0; });
      r.sort(function (a, b) { var qa = OM.u.norm(a[0]).indexOf(q) === 0 ? 0 : 1, qb = OM.u.norm(b[0]).indexOf(q) === 0 ? 0 : 1; return qa - qb || a[0].localeCompare(b[0]); });
      if (!r.length) dl.appendChild(h("p.muted", { text: "Nenhum termo encontrado.", style: { marginTop: "14px" } }));
      r.forEach(function (d) { dl.appendChild(h("dt", { text: d[0] })); dl.appendChild(h("dd", { text: d[1] })); });
    }
    content.appendChild(h("div.search", { html: OM.icon("search") }, input));
    content.appendChild(h("p.dim", { style: { fontSize: "12px", marginTop: "8px" }, text: OM.DICT.length + " termos" }));
    content.appendChild(dl);
    draw();
    return { el: el };
  });

  /* ---------- instrumentos ---------- */
  OM.screen("instruments", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Instrumentos", back: true, actions: [ui.ibtn("plus", function () { OM.router.push("custominst", {}); }, "Instrumento personalizado")] });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function draw() {
      OM.u.clear(content);
      var cur = OM.store.settings().instrument;
      content.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "4px 0 6px" }, text: "O instrumento principal define os diagramas das cifras, o modo do afinador e os exercícios." }));
      var groups = OM.inst.GROUPS.slice();
      var custom = OM.inst.custom();
      if (custom.length) groups.push({ n: "Personalizados", ids: custom.map(function (c) { return c.id; }) });
      groups.forEach(function (g) {
        content.appendChild(h("div.lbl", { text: g.n }));
        var l = h("div.list");
        g.ids.forEach(function (id) {
          var i = OM.inst.get(id); if (i.id !== id) return;
          var t = OM.inst.tuningOf(i);
          l.appendChild(ui.item({ icon: OM.inst.icon(i), iconCls: i.id === cur ? "acc" : "", title: i.n, sub: t ? t.n : i.kind === "wind" ? (i.transp % 12 ? "Instrumento transpositor" : "Afinado em Dó") : i.kind === "keys" ? "Acordes no teclado" : i.kind === "drums" ? "Metrônomo e grooves" : "Afinador cromático",
            end: i.id === cur ? h("span.badge.acc", { text: "Principal" }) : undefined, onClick: function () { OM.router.push("instrument", { id: i.id }); } }));
        });
        content.appendChild(l);
      });
    }
    return { el: el, onShow: draw };
  });

  OM.screen("instrument", function (p) {
    var inst = OM.inst.get(p.id);
    var content = h("div.content");
    var bar = ui.topbar({ title: inst.n, back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function draw() {
      OM.u.clear(content);
      var isMain = OM.store.settings().instrument === inst.id;
      content.appendChild(h("div.btnrow", ui.btn(isMain ? "Instrumento principal" : "Usar como principal", isMain ? "check" : "star", function () {
        OM.store.setSetting("instrument", inst.id); OM.router.refreshRoots(); ui.toast(inst.n + " é seu instrumento principal"); draw();
      }, isMain ? "ghost" : "pri")));
      if (inst.tunings) {
        content.appendChild(h("div.lbl", { text: "Afinações" }));
        var sel = OM.inst.tuningOf(inst), l = h("div.list");
        inst.tunings.forEach(function (t) {
          l.appendChild(ui.item({ title: t.n, sub: t.s.map(function (x) { return T.display(x.replace(/-?\d+$/, "")); }).join(" · "), end: t.id === sel.id ? h("span", { html: OM.icon("check"), style: { color: "var(--acc)" } }) : null,
            onClick: function () { OM.inst.setTuning(inst, t.id); draw(); } }));
        });
        content.appendChild(l);
        var tm = OM.inst.tuningMidi(sel);
        content.appendChild(h("div.lbl", { text: "Cordas (da mais grave para a mais aguda)" }));
        content.appendChild(h("div.notes-row", tm.map(function (m, i) {
          return h("span.notepill", { text: T.display(T.name(m)), onclick: function () { OM.synth.note(m, inst); } }, h("small", { text: (tm.length - i) + "ª · " + T.midiToFreq(m).toFixed(1) + " Hz" }));
        })));
        if (inst.kind === "string") {
          content.appendChild(h("div.lbl", { text: "Notas no braço" }));
          content.appendChild(ui.fretboard({ tuning: tm, frets: 12, marks: function (s, f) { var n = T.name(tm[s] + f); return n.length === 1 ? { label: T.display(n).slice(0, 3), root: n === "C" } : null; }, onTap: function (s, f) { OM.synth.note(tm[s] + f, inst); } }));
        }
      }
      if (inst.kind === "wind") {
        content.appendChild(h("div.lbl", { text: "Transposição" }));
        var tr = inst.transp || 0;
        content.appendChild(h("div.card", h("p", { text: tr % 12 ? "Nota escrita Dó soa " + T.display(T.name(60 + tr)) + ". Cifras, afinador e identificador mostram a nota escrita para este instrumento." : "Instrumento em Dó: a nota escrita é a nota real" + (tr ? " (uma oitava acima/abaixo)." : ".") }),
          inst.range ? h("p.muted", { style: { marginTop: "6px", fontSize: "13px" }, text: "Extensão aproximada (som real): " + inst.range.join(" – ") }) : null));
      }
      if (inst.custom) content.appendChild(h("div.btnrow", { style: { marginTop: "16px" } },
        ui.btn("Editar", "edit", function () { OM.router.push("custominst", { id: inst.id }); }, "sm"),
        ui.btn("Excluir", "trash", function () { ui.confirm("Excluir “" + inst.n + "”?", "Excluir", true).then(function (ok) { if (ok) { OM.inst.removeCustom(inst.id); if (OM.store.settings().instrument === inst.id) OM.store.setSetting("instrument", "violao"); OM.router.back(); } }); }, "sm danger")));
      content.appendChild(h("div.lbl", { text: "Ferramentas" }));
      var tl = h("div.list");
      if (inst.kind !== "drums" && inst.kind !== "keys") tl.appendChild(ui.item({ icon: "tuner", iconCls: "acc", title: "Afinar " + inst.n, onClick: function () { OM.router.push("tuner", { inst: inst.id }); } }));
      if (inst.kind === "string" || inst.kind === "keys") tl.appendChild(ui.item({ icon: "grid", iconCls: "acc", title: "Acordes para " + inst.n, onClick: function () { OM.router.push("chords"); } }));
      if (inst.kind !== "drums") tl.appendChild(ui.item({ icon: "scale", iconCls: "acc", title: "Escalas", onClick: function () { OM.router.push("scales"); } }));
      if (inst.kind === "drums") tl.appendChild(ui.item({ icon: "drum", iconCls: "acc", title: "Bateria e grooves", onClick: function () { OM.router.push("grooves"); } }));
      tl.appendChild(ui.item({ icon: "metro", iconCls: "acc", title: "Metrônomo", onClick: function () { OM.router.push("metronome"); } }));
      content.appendChild(tl);
    }
    draw();
    return { el: el };
  });

  /* instrumento personalizado: cordas com afinação livre ou sopro com transposição */
  OM.screen("custominst", function (p) {
    var base = p.id ? OM.inst.get(p.id) : null;
    var d = base ? JSON.parse(JSON.stringify(base)) : { id: OM.u.uid("ci"), n: "", kind: "string", frets: 15, custom: true, tunings: [{ id: "c", n: "Personalizada", s: ["E2", "A2", "D3", "G3", "B3", "E4"] }], transp: 0 };
    var content = h("div.content");
    var bar = ui.topbar({ title: base ? "Editar instrumento" : "Novo instrumento", back: true, actions: [ui.btn("Salvar", "check", save, "pri sm"), h("span", { style: { width: "8px" } })] });
    var el = h("section", bar, content);
    var name = h("input.inp", { type: "text", value: d.n, placeholder: "Ex.: Violão de 12 cordas, Viola em Rio Abaixo…", maxlength: 50 });
    var strs = h("div"), body = h("div");
    var kindSeg = ui.seg([{ v: "string", label: "Cordas com trastes" }, { v: "bowed", label: "Cordas sem trastes" }, { v: "wind", label: "Sopro" }], d.kind, function (v) { d.kind = v; drawBody(); });
    function drawBody() {
      OM.u.clear(body);
      if (d.kind === "wind") {
        var sel = h("select.inp", [0, -2, -3, -5, -7, -9, -14, -21, 12, 2].map(function (t) { return h("option", { value: t, text: t ? "Escrito Dó soa " + T.name(60 + t, true) + " (" + (t > 0 ? "+" : "") + t + " st)" : "Em Dó (não transpositor)" }); }));
        sel.value = d.transp || 0; sel.onchange = function () { d.transp = +sel.value; };
        body.appendChild(h("label.field", h("span", { text: "Transposição" }), sel));
        return;
      }
      if (!d.tunings) d.tunings = [{ id: "c", n: "Personalizada", s: ["E2", "A2", "D3", "G3", "B3", "E4"] }];
      var t = d.tunings[0];
      body.appendChild(h("div.lbl", { text: "Cordas — da mais grave para a mais aguda" }));
      var list = h("div.list");
      t.s.forEach(function (nt, i) {
        var m = T.parseNote(nt);
        list.appendChild(h("div.item", h("span.keybadge", { text: (t.s.length - i) + "ª" }), h("div.tx", h("div.t", { text: T.display(nt) })),
          h("div.stepper", h("button", { html: OM.icon("minus"), onclick: function () { t.s[i] = T.midiName(Math.max(12, m - 1)); drawBody(); } }),
            h("button", { html: OM.icon("plus"), onclick: function () { t.s[i] = T.midiName(Math.min(100, m + 1)); drawBody(); } }),
            h("button", { html: OM.icon("sound"), onclick: function () { OM.synth.pluck(m); } }),
            h("button", { html: OM.icon("trash"), onclick: function () { if (t.s.length > 1) { t.s.splice(i, 1); drawBody(); } } }))));
      });
      body.appendChild(list);
      body.appendChild(h("div.btnrow", { style: { marginTop: "10px" } }, ui.btn("Adicionar corda aguda", "plus", function () { if (t.s.length < 12) { t.s.push(T.midiName(T.parseNote(t.s[t.s.length - 1]) + 5)); drawBody(); } }, "sm ghost")));
      if (d.kind === "string") body.appendChild(h("label.field", { style: { marginTop: "14px" } }, h("span", { text: "Número de casas" }), ui.stepper(d.frets || 15, 5, 24, 1, null, function (v) { d.frets = v; })));
    }
    function save() {
      d.n = name.value.trim();
      if (!d.n) { ui.toast("Dê um nome ao instrumento"); name.focus(); return; }
      d.custom = true;
      if (d.kind === "wind") delete d.tunings;
      OM.inst.saveCustom(d); ui.toast("Instrumento salvo"); OM.router.back();
    }
    content.appendChild(h("label.field", h("span", { text: "Nome" }), name));
    content.appendChild(kindSeg);
    content.appendChild(body);
    content.appendChild(strs);
    drawBody();
    return { el: el };
  });

  /* ---------- histórico ---------- */
  OM.screen("history", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Histórico de prática", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var f = "all";
    function draw() {
      OM.u.clear(content);
      content.appendChild(ui.chips([{ v: "all", label: "Tudo" }, { v: "song", label: "Músicas" }, { v: "exercise", label: "Exercícios" }, { v: "tool", label: "Ferramentas" }], f, function (v) { f = v; draw(); }));
      var a = OM.lib.history(f === "all" ? null : f);
      content.appendChild(h("div.grid3", { style: { margin: "14px 0" } },
        h("div.card.stat", h("b", { text: Math.round(OM.lib.totalMinutes()) }), h("span", { text: "minutos" })),
        h("div.card.stat", h("b", { text: OM.lib.streak() }), h("span", { text: "dias seguidos" })),
        h("div.card.stat", h("b", { text: OM.lib.history().length }), h("span", { text: "sessões" }))));
      if (!a.length) { content.appendChild(ui.empty("history", "Nenhum registro ainda.")); return; }
      var day = "", l = null;
      a.slice(0, 200).forEach(function (e) {
        var d = new Date(e.date).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
        if (d !== day) { day = d; content.appendChild(h("div.lbl", { text: d })); l = h("div.list"); content.appendChild(l); }
        l.appendChild(ui.item({ icon: OM.homeHelpers.histIcon(e), title: e.title, sub: OM.homeHelpers.histText(e), onClick: function () { OM.homeHelpers.openHist(e); } }));
      });
    }
    return { el: el, onShow: draw };
  });

  /* ---------- percepção auditiva (atalho para os exercícios de ouvido) ---------- */
  OM.screen("ear", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Percepção auditiva", back: true });
    var el = h("section", bar, content);
    function draw() {
      OM.u.clear(content);
      content.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "4px 0 12px" }, text: "Ouça e responda. Os níveis liberam conforme você acerta 80% ou mais." }));
      var l = h("div.list");
      OM.EX.list().filter(function (x) { return x.ear; }).forEach(function (x) {
        var pr = OM.EX.progress(x.id);
        l.appendChild(ui.item({ icon: x.icon, iconCls: "acc", title: x.n, sub: "Nível " + (pr.level + 1) + " de " + x.levels.length + " · " + x.levels[pr.level].n, onClick: function () { OM.router.push("exercise", { id: x.id }); } }));
      });
      content.appendChild(l);
    }
    return { el: el, onShow: draw };
  });
})(window.OM);
