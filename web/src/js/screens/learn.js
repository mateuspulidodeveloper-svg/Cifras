/* O Músico — sistema de aprendizagem: exercícios progressivos com níveis, pontuação e histórico */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory, u = OM.u;
  var NAT = ["C", "D", "E", "F", "G", "A", "B"];

  function stringInst() { var i = OM.inst.current(); return i.kind === "string" ? i : OM.inst.get("violao"); }
  function tm(inst) { return OM.inst.tuningMidi(OM.inst.tuningOf(inst)); }
  function opts(correct, pool, n) {
    var o = [correct], p = u.shuffle(pool.filter(function (x) { return x !== correct; }));
    for (var i = 0; o.length < (n || 4) && i < p.length; i++) if (o.indexOf(p[i]) < 0) o.push(p[i]);
    u.shuffle(o);
    return { options: o, answer: o.indexOf(correct) };
  }
  function nm(pc, fl) { return T.display(T.name(pc, fl)); }

  /* ---------- definição dos exercícios ---------- */
  var EXS = [
    {
      id: "chords", n: "Aprender acordes", icon: "grid", d: "Reconheça diagramas de acordes no seu instrumento e encontre a forma certa.",
      levels: [
        { n: "Maiores abertos", set: ["C", "G", "D", "A", "E"] },
        { n: "Menores", set: ["Am", "Em", "Dm", "C", "G", "D"] },
        { n: "Com sétima", set: ["G7", "C7", "D7", "A7", "E7", "B7"] },
        { n: "Pestanas", set: ["F", "Bm", "F#m", "Bb", "C#m", "Fm"] },
        { n: "Sétimas maiores e menores", set: ["C7M", "Am7", "Dm7", "Em7", "F7M", "G7M", "Bm7"] },
        { n: "Tensões e suspensos", set: ["Dsus4", "Asus2", "C(9)", "Em7(11)", "A7/4", "Bm7(b5)", "G6"] }
      ],
      gen: function (lv) {
        var inst = OM.inst.current(); if (inst.kind !== "string" && inst.kind !== "keys") inst = OM.inst.get("violao");
        var set = this.levels[lv].set, c = u.pick(set), pool = set.concat(["C", "G", "Am", "Em", "D7", "F", "E"]);
        if (Math.random() < 0.5) {
          var o = opts(c, pool);
          return { ask: "Qual é este acorde?", show: function () { return ui.chordView(c, inst, { size: 150, noName: true, max: 1 }); }, options: o.options, answer: o.answer, play: function () { ui.playChord(c, inst); } };
        }
        var o2 = opts(c, pool, 3);
        return { ask: "Qual diagrama é " + c + "?", show: function () { return h("div.big", { text: c, style: { color: "var(--chord)" } }); }, cols: 3,
          options: o2.options.map(function (x) { return { label: x, el: ui.chordView(x, inst, { size: 76, noName: true, max: 1 }) }; }), answer: o2.answer, play: function () { ui.playChord(c, inst); } };
      }
    },
    {
      id: "fretnotes", n: "Notas no braço", icon: "guitar", d: "Descubra o nome da nota em cada posição do braço.",
      levels: [{ n: "Naturais até a 5ª casa", max: 5, nat: true }, { n: "Naturais até a 12ª casa", max: 12, nat: true }, { n: "Todas as notas até a 12ª", max: 12, nat: false }],
      gen: function (lv) {
        var inst = stringInst(), t = tm(inst), L = this.levels[lv], s, f, m, guard = 0;
        do { s = Math.floor(Math.random() * t.length); f = Math.floor(Math.random() * (L.max + 1)); m = t[s] + f; } while (L.nat && T.name(m).length > 1 && guard++ < 50);
        var pc = T.mod12(m), pool = (L.nat ? NAT.map(T.pc) : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).map(function (x) { return nm(x); });
        var o = opts(nm(pc), pool);
        return { ask: "Que nota é esta? (" + (t.length - s) + "ª corda, " + (f ? f + "ª casa" : "solta") + ")",
          show: function () { return ui.fretboard({ tuning: t, frets: Math.max(5, L.max), marks: function (ss, ff) { return ss === s && ff === f ? { label: "?", root: true } : null; } }); },
          options: o.options, answer: o.answer, play: function () { OM.synth.note(m, inst); } };
      }
    },
    {
      id: "staff", n: "Leitura de partitura", icon: "notes", d: "Leia notas na pauta: clave de sol, clave de fá e acidentes.",
      levels: [{ n: "Clave de sol — na pauta", clef: "treble", lo: "E4", hi: "F5" }, { n: "Clave de sol — linhas suplementares", clef: "treble", lo: "A3", hi: "C6" },
        { n: "Clave de fá", clef: "bass", lo: "G2", hi: "A3" }, { n: "Ambas as claves com acidentes", clef: "mix", acc: true }],
      gen: function (lv) {
        var L = this.levels[lv], clef = L.clef === "mix" ? u.pick(["treble", "bass"]) : L.clef;
        var lo = T.parseNote(L.lo || (clef === "treble" ? "C4" : "E2")), hi = T.parseNote(L.hi || (clef === "treble" ? "A5" : "C4"));
        var cands = []; for (var m = lo; m <= hi; m++) if (T.name(m).length === 1) cands.push(m);
        var m0 = u.pick(cands), letter = T.name(m0), alter = 0;
        if (L.acc && Math.random() < 0.5) alter = u.pick([1, -1]);
        var note = { letter: letter, alter: alter, oct: Math.floor(m0 / 12) - 1, midi: m0 + alter, dur: 4, type: "w" };
        var label = T.display(letter + (alter === 1 ? "#" : alter === -1 ? "b" : ""));
        var pool = L.acc ? NAT.reduce(function (a, n) { return a.concat([n, n + "#", n + "b"]); }, []).map(function (x) { return T.display(x); }) : NAT.map(function (x) { return T.display(x); });
        var o = opts(label, pool);
        return { ask: "Que nota é esta? (clave de " + (clef === "treble" ? "sol" : "fá") + ")",
          show: function () { var r = OM.staff.render({ clef: clef, key: "C", notes: [note], width: 150 }); r.svg.style.maxWidth = "220px"; return r.svg; },
          options: o.options, answer: o.answer, play: function () { OM.synth.piano(note.midi); } };
      }
    },
    {
      id: "playnote", n: "Toque a nota", icon: "target", d: "O app pede uma nota e escuta pelo microfone se você tocou certo.", mic: true,
      levels: [{ n: "Notas naturais", pool: NAT }, { n: "Com sustenidos e bemóis", pool: ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"] }],
      gen: function (lv) { var n = u.pick(this.levels[lv].pool); return { target: T.pc(n), ask: "Toque ou cante a nota", label: T.display(n) }; }
    },
    {
      id: "scales", n: "Treinar escalas", icon: "scale", d: "Memorize as notas das escalas maiores, menores e pentatônicas.",
      levels: [{ n: "Maiores (até 1 acidente)", roots: ["C", "G", "F"], sc: "major" }, { n: "Todas as maiores", roots: ["C", "G", "D", "A", "E", "B", "F", "Bb", "Eb", "Ab", "Db"], sc: "major" },
        { n: "Menores naturais", roots: ["A", "E", "D", "B", "G", "C", "F#"], sc: "minor" }, { n: "Pentatônicas", roots: ["A", "E", "C", "G", "D"], sc: "pentmin" }],
      gen: function (lv) {
        var L = this.levels[lv], r = u.pick(L.roots), sc = T.SCALES.filter(function (s) { return s.id === L.sc; })[0];
        var notes = T.spellScale(r, sc.i), title = r + (L.sc === "major" ? " maior" : L.sc === "minor" ? " menor" : " (" + sc.n.toLowerCase() + ")");
        var allN = T.KEYS.concat(["E#", "B#", "Cb", "Fb"]).map(T.display);
        if (Math.random() < 0.5 && notes.length === 7) {
          var k = 1 + Math.floor(Math.random() * 6), c = T.display(notes[k]);
          var o = opts(c, notes.map(T.display).concat(allN));
          return { ask: "Qual é o " + (k + 1) + "º grau de " + title + "?", show: function () { return h("div.big", { text: title }); }, options: o.options, answer: o.answer };
        }
        var inScale = T.display(u.pick(notes.slice(1))), outs = allN.filter(function (x) { return notes.map(T.display).indexOf(x) < 0 && T.pc(x.replace("♯", "#").replace("♭", "b")) >= 0 && notes.map(function (n) { return T.pc(n); }).indexOf(T.pc(x.replace("♯", "#").replace("♭", "b"))) < 0; });
        var o2 = { options: u.shuffle([inScale].concat(u.shuffle(outs).slice(0, 3))) };
        o2.answer = o2.options.indexOf(inScale);
        return { ask: "Qual destas notas pertence a " + title + "?", show: function () { return h("div.big", { text: title }); }, options: o2.options, answer: o2.answer,
          play: function () { var b = 60 + T.pc(r); OM.synth.sequence(sc.i.map(function (x) { return b + x; }).concat([b + 12]), 0.22, OM.inst.get("piano")); } };
      }
    },
    {
      id: "rhythm", n: "Desenvolver ritmo", icon: "metro", d: "Toque no tempo do metrônomo. O app mede sua precisão em milissegundos.", rhythm: true,
      levels: [{ n: "60 BPM — semínimas", bpm: 60, sub: 1, tol: 90 }, { n: "90 BPM — semínimas", bpm: 90, sub: 1, tol: 70 }, { n: "120 BPM — semínimas", bpm: 120, sub: 1, tol: 55 },
        { n: "80 BPM — colcheias", bpm: 80, sub: 2, tol: 50 }, { n: "100 BPM — compassos em silêncio", bpm: 100, sub: 1, tol: 60, gap: true }]
    },
    {
      id: "changes", n: "Mudanças de acordes", icon: "swap", d: "Quantas trocas entre dois acordes você faz em 1 minuto? Meça e evolua.", changes: true,
      levels: [{ n: "Meta: 30 trocas/min", goal: 30, pairs: [["C", "G"], ["G", "D"], ["Am", "E"], ["D", "A"], ["Em", "C"]] },
        { n: "Meta: 45 trocas/min", goal: 45, pairs: [["C", "F"], ["G", "Em"], ["Am", "Dm"], ["D", "G7"], ["A", "E7"]] },
        { n: "Meta: 60 trocas/min", goal: 60, pairs: [["F", "C"], ["Bm", "G"], ["F#m", "D"], ["B7", "Em"], ["Bb", "F"]] }]
    },
    {
      id: "intervals", n: "Intervalos de ouvido", icon: "ear", d: "Ouça duas notas e identifique a distância entre elas.", ear: true,
      levels: [{ n: "3ª maior, 5ª justa, oitava", s: [4, 7, 12] }, { n: "+ 2ª maior, 3ª menor, 4ª justa", s: [2, 3, 4, 5, 7, 12] }, { n: "+ 6ª maior, 7ª menor, 2ª menor", s: [1, 2, 3, 4, 5, 7, 9, 10, 12] },
        { n: "Todos os intervalos", s: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] }, { n: "Harmônicos (simultâneos)", s: [3, 4, 5, 7, 8, 9, 12], harm: true }],
      gen: function (lv) {
        var L = this.levels[lv], s = u.pick(L.s), base = 55 + Math.floor(Math.random() * 12);
        var names = L.s.map(function (x) { return T.INTERVALS.filter(function (i) { return i.s === x; })[0].n; });
        var c = T.INTERVALS.filter(function (i) { return i.s === s; })[0].n, o = opts(c, names, Math.min(4, names.length));
        var play = function () { var piano = OM.inst.get("piano"); if (L.harm) OM.synth.chord([base, base + s], piano, null, { spread: 0 }); else OM.synth.sequence([base, base + s], 0.6, piano); };
        return { ask: "Que intervalo é este?", show: function () { return h("div.big", { html: OM.icon("ear"), style: { width: "54px", color: "var(--acc)" } }); }, options: o.options, answer: o.answer, play: play, autoplay: true };
      }
    },
    {
      id: "chordear", n: "Acordes de ouvido", icon: "piano", d: "Diferencie acordes maiores, menores, diminutos, aumentados e com sétima.", ear: true,
      levels: [{ n: "Maior × menor", t: ["", "m"] }, { n: "+ diminuto e aumentado", t: ["", "m", "°", "aug"] }, { n: "Tétrades: 7, 7M, m7", t: ["7", "7M", "m7", ""] }, { n: "Todos", t: ["", "m", "°", "aug", "7", "7M", "m7", "m7(b5)", "sus4"] }],
      gen: function (lv) {
        var L = this.levels[lv], t = u.pick(L.t), root = 52 + Math.floor(Math.random() * 10);
        var label = function (x) { return (T.CHORD_TYPES.filter(function (c) { return c.id === x || (x === "aug" && c.id === "aug"); })[0] || { n: x }).n; };
        var o = opts(label(t), L.t.map(label), Math.min(4, L.t.length));
        var ch = T.parseChord(T.name(root) + t);
        var play = function () { OM.synth.chord(ch.intervals.map(function (i) { return root + i; }), OM.inst.get("piano")); };
        return { ask: "Que tipo de acorde é este?", show: function () { return h("div.big", { html: OM.icon("ear"), style: { width: "54px", color: "var(--acc)" } }); }, options: o.options, answer: o.answer, play: play, autoplay: true };
      }
    },
    {
      id: "earnotes", n: "Notas de ouvido", icon: "note", d: "Ouça a referência Dó e descubra qual nota soou em seguida.", ear: true,
      levels: [{ n: "Dó, Mi, Sol", p: [0, 4, 7] }, { n: "Notas naturais", p: [0, 2, 4, 5, 7, 9, 11] }, { n: "Todas as notas", p: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }],
      gen: function (lv) {
        var L = this.levels[lv], p = u.pick(L.p), o = opts(nm(p), L.p.map(function (x) { return nm(x); }), Math.min(4, L.p.length));
        var play = function () { var piano = OM.inst.get("piano"), c = OM.audio.context(), t = c.currentTime + 0.05; OM.synth.piano(60, t, 0.35); OM.synth.piano(60 + p + (p === 0 ? 12 : 0), t + 0.9, 0.4); void piano; };
        return { ask: "Referência: Dó. Qual foi a segunda nota?", show: function () { return h("div.big", { html: OM.icon("ear"), style: { width: "54px", color: "var(--acc)" } }); }, options: o.options, answer: o.answer, play: play, autoplay: true };
      }
    }
  ];

  function progress(id) { var p = OM.store.get("ex", {})[id] || {}; return { level: p.level || 0, unlocked: p.unlocked || 0, best: p.best || {}, sessions: p.sessions || 0, xp: p.xp || 0, last: p.last || [] }; }
  function saveProgress(id, pr) { OM.store.update("ex", {}, function (m) { m[id] = pr; }); }
  function totalXp() { var m = OM.store.get("ex", {}); return Object.keys(m).reduce(function (a, k) { return a + (m[k].xp || 0); }, 0); }
  OM.EX = { list: function () { return EXS; }, get: function (id) { return EXS.filter(function (x) { return x.id === id; })[0]; }, progress: progress, totalXp: totalXp };

  /* registra o resultado de uma sessão e libera o próximo nível com 80%+ */
  function finish(ex, lv, score, xp, minutes, detail, goal) {
    var pr = progress(ex.id);
    pr.best[lv] = Math.max(pr.best[lv] || 0, score);
    pr.sessions++; pr.xp += xp;
    pr.last.unshift({ lv: lv, score: score, date: Date.now() }); pr.last = pr.last.slice(0, 20);
    var unlockedNow = false;
    if (score >= (goal || 80) && lv + 1 < ex.levels.length && pr.unlocked < lv + 1) { pr.unlocked = lv + 1; unlockedNow = true; }
    pr.level = lv;
    saveProgress(ex.id, pr);
    OM.lib.log({ type: "exercise", id: ex.id, title: ex.n, detail: "Nível " + (lv + 1) + " · " + (detail || score + "%"), minutes: Math.round(minutes * 10) / 10 });
    return unlockedNow;
  }

  /* ---------- hub ---------- */
  OM.screen("learn", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Aprender", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    function draw() {
      OM.u.clear(content);
      var ex = OM.lib.history("exercise");
      content.appendChild(h("div.grid3", { style: { margin: "4px 0 6px" } },
        h("div.card.stat", h("b", { text: totalXp() }), h("span", { text: "pontos (XP)" })),
        h("div.card.stat", h("b", { text: ex.length }), h("span", { text: "sessões" })),
        h("div.card.stat", h("b", { text: OM.lib.streak() }), h("span", { text: "dias seguidos" }))));
      content.appendChild(ui.sec("Cursos e guias"));
      var cl = h("div.list");
      OM.COURSES.forEach(function (c) {
        var n = OM.lessons.courseProgress(c);
        var it = ui.item({ icon: c.icon, iconCls: "acc", title: c.n, sub: n + " de " + c.lessons.length + " lições · " + c.d, onClick: function () { OM.router.push("course", { id: c.id }); } });
        it.querySelector(".tx").appendChild(h("div.prog", { style: { marginTop: "6px" } }, h("i", { style: { width: Math.round(n / c.lessons.length * 100) + "%" } })));
        cl.appendChild(it);
      });
      cl.appendChild(ui.item({ icon: OM.inst.icon(OM.inst.current()), iconCls: "acc", title: "Conheça os instrumentos", sub: "Partes, afinação, primeiros acordes e dicas", onClick: function () { OM.router.push("instguides"); } }));
      cl.appendChild(ui.item({ icon: "guitar", iconCls: "acc", title: "Mapa do braço e do teclado", sub: "Notas, intervalos, escalas e acordes em todo o instrumento", onClick: function () { OM.router.push("fretmap"); } }));
      content.appendChild(cl);
      content.appendChild(ui.sec("Exercícios"));
      [["Teoria e leitura", ["chords", "fretnotes", "staff", "scales"]], ["Prática com o instrumento", ["playnote", "rhythm", "changes"]], ["Percepção musical", ["intervals", "chordear", "earnotes"]]].forEach(function (grp) {
        content.appendChild(ui.sec(grp[0]));
        var l = h("div.list");
        grp[1].forEach(function (id) {
          var x = OM.EX.get(id), pr = progress(id), done = Object.keys(pr.best).filter(function (k) { return pr.best[k] >= 80; }).length;
          var it = ui.item({ icon: x.icon, iconCls: "acc", title: x.n, sub: "Nível " + (pr.unlocked + 1) + "/" + x.levels.length + " · " + x.levels[pr.unlocked].n, onClick: function () { OM.router.push("exercise", { id: id }); } });
          it.querySelector(".tx").appendChild(h("div.prog", { style: { marginTop: "6px" } }, h("i", { style: { width: Math.round(done / x.levels.length * 100) + "%" } })));
          l.appendChild(it);
        });
        content.appendChild(l);
      });
      if (ex.length) {
        content.appendChild(ui.sec("Últimos exercícios", "Histórico", function () { OM.router.push("history"); }));
        var hl = h("div.list");
        ex.slice(0, 5).forEach(function (e) { hl.appendChild(ui.item({ icon: "learn", title: e.title, sub: OM.homeHelpers.histText(e), onClick: function () { OM.router.push("exercise", { id: e.id }); } })); });
        content.appendChild(hl);
      }
    }
    return { el: el, onShow: draw };
  });

  /* ---------- tela de exercício ---------- */
  OM.screen("exercise", function (p) {
    var ex = OM.EX.get(p.id);
    var pr = progress(ex.id), lv = Math.min(pr.unlocked, ex.levels.length - 1);
    var content = h("div.content");
    var bar = ui.topbar({ title: ex.n, back: true });
    var el = h("section", bar, content);
    var cleanup = null;
    function stopAll() { if (cleanup) { cleanup(); cleanup = null; } }

    function intro() {
      stopAll();
      pr = progress(ex.id);
      OM.u.clear(content);
      content.appendChild(h("p.muted", { style: { margin: "4px 0 14px", fontSize: "14px" }, text: ex.d }));
      content.appendChild(h("div.lbl", { text: "Nível" }));
      var lvls = h("div.lvls");
      ex.levels.forEach(function (L, i) {
        var lock = i > pr.unlocked;
        var b = h("button.lvl" + (i === lv ? ".on" : "") + (lock ? ".lock" : ""), { onclick: function () { if (lock) { ui.toast("Faça 80% ou mais no nível anterior para liberar"); return; } lv = i; intro(); } });
        if (lock) b.insertAdjacentHTML("beforeend", OM.icon("lock"));
        b.appendChild(document.createTextNode(i + 1));
        lvls.appendChild(b);
      });
      content.appendChild(lvls);
      content.appendChild(h("div.card", { style: { marginTop: "14px" } }, h("h3", { text: ex.levels[lv].n }),
        h("p.muted", { style: { fontSize: "13.5px" }, text: pr.best[lv] != null ? "Melhor resultado: " + pr.best[lv] + (ex.changes ? " trocas/min" : "%") : "Ainda não praticado." })));
      if (ex.mic) content.appendChild(h("div", { style: { marginTop: "10px" } }, ui.notice("Usa o microfone. Afine o instrumento antes para melhores resultados.")));
      content.appendChild(h("div.btnrow", { style: { marginTop: "16px" } }, ui.btn("Começar", "play", function () {
        if (ex.rhythm) rhythm(); else if (ex.changes) changes(); else if (ex.mic) micQuiz(); else quiz();
      }, "pri block")));
      if (pr.last.length) {
        content.appendChild(ui.sec("Evolução"));
        var l = h("div.list");
        pr.last.slice(0, 8).forEach(function (r) { l.appendChild(ui.item({ lead: h("span.keybadge", { text: r.lv + 1 }), title: r.score + (ex.changes ? " trocas/min" : "%"), sub: OM.u.fmtDate(r.date), end: r.score >= (ex.changes ? ex.levels[r.lv].goal : 80) ? h("span.badge.ok", { text: "✓" }) : null })); });
        content.appendChild(l);
      }
    }
    function result(score, detail, xp, minutes, goal) {
      var unlocked = finish(ex, lv, score, xp, minutes, detail, goal);
      OM.u.clear(content);
      var ok = score >= (goal || 80);
      content.appendChild(h("div.result", h("div", { html: OM.icon(ok ? "trophy" : "target"), style: { width: "54px", margin: "0 auto 8px", color: ok ? "var(--ok)" : "var(--acc)" } }),
        h("div.score", { text: detail || score + "%" }), h("p.muted", { text: ok ? (unlocked ? "Excelente! Nível " + (lv + 2) + " liberado." : "Muito bem!") : "Continue praticando: a meta é " + (goal ? goal + " trocas/min" : "80%") + "." }),
        h("p.dim", { style: { fontSize: "13px", marginTop: "6px" }, text: "+" + xp + " XP" })));
      content.appendChild(h("div.btnrow", ui.btn("Repetir", "reset", function () { intro(); content.querySelector(".btn.pri").click(); }), unlocked ? ui.btn("Próximo nível", "chev", function () { lv++; intro(); }, "pri") : ui.btn("Concluir", "check", intro, "pri")));
    }

    /* questionário genérico (10 perguntas) */
    function quiz() {
      var N = 10, i = 0, right = 0, t0 = Date.now(), q = null, locked = false;
      function next() {
        if (i >= N) { result(Math.round(right / N * 100), null, right * 10, (Date.now() - t0) / 60000); return; }
        q = ex.gen(lv); locked = false;
        OM.u.clear(content);
        content.appendChild(h("div.qhead", h("b.num", { text: (i + 1) + "/" + N }), h("div.prog", h("i", { style: { width: (i / N * 100) + "%" } })), h("span.badge.ok", { text: right + " ✓" })));
        var card = h("div.qcard", h("div.ask", { text: q.ask }), q.show());
        if (q.play) card.appendChild(ui.btn(q.autoplay ? "Ouvir novamente" : "Ouvir", "sound", q.play, "sm"));
        content.appendChild(card);
        var grid = h("div.qopts" + (q.cols === 3 ? ".three" : ""));
        q.options.forEach(function (o, k) {
          var b = h("button.qopt", { onclick: function () { pick(k, b); } });
          if (typeof o === "string") b.textContent = o; else b.appendChild(o.el);
          grid.appendChild(b);
        });
        content.appendChild(grid);
        if (q.autoplay) setTimeout(q.play, 250);
      }
      function pick(k, b) {
        if (locked) return; locked = true;
        var good = k === q.answer;
        if (good) { right++; b.classList.add("ok"); OM.bridge.vibrate(15); }
        else { b.classList.add("bad"); content.querySelectorAll(".qopt")[q.answer].classList.add("ok"); OM.bridge.vibrate(60); if (q.play && !q.autoplay) q.play(); }
        i++;
        setTimeout(next, good ? 650 : 1500);
      }
      next();
    }

    /* toque a nota (microfone) */
    function micQuiz() {
      var N = 8, i = 0, right = 0, t0 = Date.now(), q, qStart = 0, hold = 0, timer = 0, listener = null, done = false;
      OM.u.clear(content);
      var status = h("div"), card = h("div.qcard"), heard = h("p.muted", { style: { minHeight: "22px" } }), prog = h("div.qhead");
      content.appendChild(prog); content.appendChild(card); content.appendChild(heard); content.appendChild(status);
      listener = new OM.pitch.Listener({ minF: 40, maxF: 2000, onPitch: onPitch });
      listener.start().then(next).catch(function (e) { status.appendChild(ui.notice(OM.audio.micErrorText(e), true)); });
      cleanup = function () { done = true; clearInterval(timer); if (listener) listener.stop(); };
      function next() {
        if (i >= N) { cleanup(); cleanup = null; result(Math.round(right / N * 100), null, right * 15, (Date.now() - t0) / 60000); return; }
        q = ex.gen(lv); qStart = performance.now(); hold = 0;
        OM.u.clear(prog); prog.appendChild(h("b.num", { text: (i + 1) + "/" + N })); prog.appendChild(h("div.prog", h("i", { style: { width: (i / N * 100) + "%" } }))); prog.appendChild(h("span.badge.ok", { text: right + " ✓" }));
        OM.u.clear(card);
        card.appendChild(h("div.ask", { text: q.ask }));
        card.appendChild(h("div.big", { text: q.label, style: { fontSize: "64px", color: "var(--chord)" } }));
        var tl = h("div.prog", { style: { width: "70%" } }, h("i")); card.appendChild(tl);
        card.appendChild(ui.btn("Pular", "chev", function () { i++; heard.textContent = "Pulada."; next(); }, "sm ghost"));
        clearInterval(timer);
        timer = setInterval(function () {
          var el2 = (performance.now() - qStart) / 15000; tl.firstChild.style.width = Math.min(100, el2 * 100) + "%";
          if (el2 >= 1) { clearInterval(timer); i++; heard.textContent = "Tempo esgotado."; OM.bridge.vibrate(60); next(); }
        }, 100);
      }
      function onPitch(r) {
        if (done || !q) return;
        if (!r.freq) { hold = 0; return; }
        heard.textContent = "Ouvindo: " + T.display(T.midiName(r.midi));
        if (T.mod12(r.midi) === q.target) {
          if (!hold) hold = performance.now();
          if (performance.now() - hold > 300) { right++; i++; heard.textContent = "Certo! " + T.display(T.midiName(r.midi)); OM.bridge.vibrate(20); q = null; setTimeout(next, 500); }
        } else hold = 0;
      }
    }

    /* ritmo: tocar junto com o metrônomo e medir o desvio */
    function rhythm() {
      var L = ex.levels[lv], beat = 60 / L.bpm, step = beat / L.sub, bars = 4, num = 4;
      var total = bars * num * L.sub, ctx = OM.audio.context(), start = ctx.currentTime + 0.3 + num * beat;
      var expected = [], taps = [], timers = [];
      OM.u.clear(content);
      var info = h("p.muted", { text: "Contagem: 1 compasso. Depois toque na área abaixo " + (L.sub === 2 ? "em cada colcheia (2 por tempo)" : "em cada tempo") + " durante 4 compassos." + (L.gap ? " Nos compassos 3 e 4 o metrônomo fica em silêncio: mantenha o tempo!" : "") });
      var zone = h("button.tapzone", { text: "Prepare-se…" }), offs = h("div.offsets");
      content.appendChild(info); content.appendChild(zone); content.appendChild(offs);
      for (var c = 0; c < num; c++) OM.synth.click("wood", c === 0 ? 2 : 1, ctx.currentTime + 0.3 + c * beat, 0.9);
      for (var k = 0; k < total; k++) {
        var t = start + k * step; expected.push(t);
        var barN = Math.floor(k / (num * L.sub));
        if (!(L.gap && barN >= 2)) OM.synth.click("wood", k % (num * L.sub) === 0 ? 2 : k % L.sub === 0 ? 1 : 0.5, t, 0.8);
      }
      timers.push(setTimeout(function () { zone.textContent = "Toque aqui no tempo!"; }, (start - ctx.currentTime) * 1000 - 100));
      var lat = (ctx.outputLatency || ctx.baseLatency || 0);
      zone.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        var t = ctx.currentTime - lat;
        if (t < start - step / 2) return;
        taps.push(t); zone.style.background = "var(--acc-soft)"; setTimeout(function () { zone.style.background = ""; }, 80);
        var near = expected.reduce(function (a, x) { return Math.abs(x - t) < Math.abs(a - t) ? x : a; }, expected[0]);
        var d = (t - near) * 1000;
        offs.appendChild(h("i", { style: { height: Math.min(28, Math.abs(d) / 4) + 2 + "px", transform: "translateY(" + (d < 0 ? "-" : "") + (Math.min(28, Math.abs(d) / 4) / 2 + 1) + "px)", background: Math.abs(d) <= L.tol ? "var(--ok)" : "var(--bad)" } }));
      });
      var endMs = (start - ctx.currentTime + total * step + 0.6) * 1000;
      timers.push(setTimeout(score, endMs));
      cleanup = function () { timers.forEach(clearTimeout); };
      function score() {
        cleanup = null;
        /* cada batida esperada casa com o toque mais próximo (uma vez) */
        var used = {}, hits = 0, devs = [];
        expected.forEach(function (x) {
          var bi = -1, bd = 1e9;
          taps.forEach(function (t, i) { if (used[i]) return; var d = Math.abs(t - x); if (d < bd) { bd = d; bi = i; } });
          if (bi >= 0 && bd * 1000 <= Math.max(L.tol * 2.5, step * 450)) { used[bi] = 1; devs.push((taps[bi] - x) * 1000); if (bd * 1000 <= L.tol) hits++; }
        });
        var extra = taps.length - Object.keys(used).length;
        var sc = Math.max(0, Math.round((hits - extra * 0.5) / expected.length * 100));
        var mean = devs.length ? devs.reduce(function (a, b) { return a + b; }, 0) / devs.length : 0;
        var sd = devs.length ? Math.sqrt(devs.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / devs.length) : 0;
        result(sc, sc + "%", hits * 5, (total * step + num * beat) / 60);
        content.insertBefore(h("div.card", h("div.kv", h("span", { text: "Toques no tempo (±" + L.tol + " ms)" }), h("b", { text: hits + " de " + expected.length })),
          h("div.kv", h("span", { text: "Tendência" }), h("b", { text: Math.abs(mean) < 10 ? "No tempo" : (mean < 0 ? "Adiantado " : "Atrasado ") + Math.abs(mean).toFixed(0) + " ms" })),
          h("div.kv", h("span", { text: "Regularidade (desvio padrão)" }), h("b", { text: sd.toFixed(0) + " ms" }))), content.lastChild);
      }
    }

    /* mudanças de acordes: 1 minuto contando trocas */
    function changes() {
      var L = ex.levels[lv], pair = L.pairs[0], inst = OM.inst.current(); if (inst.kind !== "string" && inst.kind !== "keys") inst = OM.inst.get("violao");
      OM.u.clear(content);
      var pairBox = h("div");
      function drawPair() {
        OM.u.clear(pairBox);
        pairBox.appendChild(h("div.lbl", { text: "Escolha o par de acordes" }));
        pairBox.appendChild(ui.chips(L.pairs.map(function (pp, i) { return { v: i, label: pp.join(" ↔ ") }; }), L.pairs.indexOf(pair), function (v) { pair = L.pairs[v]; drawPair(); }, true));
        pairBox.appendChild(h("div", { style: { display: "flex", justifyContent: "center", gap: "24px", margin: "16px 0" } }, pair.map(function (c) { return ui.chordView(c, inst, { size: 100, max: 1 }); })));
      }
      drawPair();
      content.appendChild(pairBox);
      content.appendChild(h("p.muted", { style: { fontSize: "13.5px" }, text: "Toque o botão a cada troca de acorde. Você tem 60 segundos. Meta do nível: " + L.goal + " trocas." }));
      var startB = ui.btn("Iniciar 1 minuto", "play", go, "pri block");
      content.appendChild(h("div", { style: { marginTop: "14px" } }, startB));
      function go() {
        var n = 0, t0 = Date.now(), iv;
        OM.u.clear(content);
        var timeEl = h("div.rectime", { text: "1:00" }), cnt = h("div.met-bpm", { text: "0" }), cur = h("div", { style: { fontSize: "28px", fontWeight: 800, color: "var(--chord)", textAlign: "center" }, text: pair[0] });
        var zone = h("button.tapzone", { text: "Toquei a troca!" });
        zone.addEventListener("pointerdown", function (e) { e.preventDefault(); n++; cnt.textContent = n; cur.textContent = pair[n % 2]; OM.bridge.vibrate(10); });
        content.appendChild(timeEl); content.appendChild(h("div.met", cnt, h("div.met-it", { text: "trocas" }))); content.appendChild(cur); content.appendChild(zone);
        iv = setInterval(function () {
          var left = 60 - (Date.now() - t0) / 1000;
          timeEl.textContent = OM.u.fmtTime(Math.ceil(left));
          if (left <= 0) { clearInterval(iv); cleanup = null; OM.bridge.vibrate(200); result(n, n + " trocas/min", n, 1, L.goal); content.insertBefore(h("p.muted", { style: { textAlign: "center", marginBottom: "12px" }, text: pair.join(" ↔ ") }), content.lastChild); }
        }, 200);
        cleanup = function () { clearInterval(iv); };
      }
    }
    intro();
    return { el: el, destroy: stopAll, onHide: function () { } };
  });
})(window.OM);
