/* O Músico — visualizador de cifra: transposição, capotraste, fonte, rolagem automática,
   diagramas por instrumento, modo prática (acordes destacados no tempo), apresentação e partitura */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, L = OM.lib, T = OM.theory;

  OM.screen("song", function (p) {
    var song = L.get(p.id);
    if (!song) {
      return { el: h("section", ui.topbar({ title: "Cifra", back: true }), h("div.content", ui.empty("alert", "Cifra não encontrada."))) };
    }
    var pr = L.prefs(song.id), st = OM.store.settings();
    var state = {
      tr: pr.tr || 0, capo: pr.capo != null ? pr.capo : (song.capo || 0), fs: pr.fs || st.fontSize || 16,
      speed: pr.speed || 3, scrolling: false, inst: OM.inst.current(), present: false,
      simple: !!pr.simple, noChords: !!pr.noChords, diagrams: pr.diagrams != null ? pr.diagrams : st.showDiagrams !== false
    };
    var parsed = OM.chordpro.parse(song.body), lastMain = OM.inst.current().id;
    var openedAt = Date.now(), practiceMs = 0;
    L.touch(song.id);

    var content = h("div.content"), favBtn, view;
    var titleWrap = { title: song.title, sub: song.artist, back: true };
    favBtn = ui.ibtn(L.isFav(song.id) ? "heartf" : "heart", function () {
      var on = L.toggleFav(song.id);
      favBtn.innerHTML = OM.icon(on ? "heartf" : "heart"); favBtn.classList.toggle("on", on);
      ui.toast(on ? "Adicionada às favoritas" : "Removida das favoritas");
    }, "Favorita", L.isFav(song.id) ? "on" : "");
    var bar = ui.topbar(Object.assign(titleWrap, { actions: [favBtn, ui.ibtn("present", function () { setPresent(true); }, "Modo apresentação"), ui.ibtn("more", moreMenu, "Mais opções")] }));
    var tbar = h("div.tbar");
    var flash = h("div.flash");
    view = h("section", bar, tbar, content, flash);
    ui.scrollShadow(content, bar);

    /* ---------- cálculo de transposição ---------- */
    function shift() {
      var s = state.tr;
      if (state.inst.kind === "string") s -= state.capo;
      if (state.inst.kind === "wind" && state.inst.transp) s -= state.inst.transp;
      return s;
    }
    function soundingKey() { return song.key ? T.transposeKey(song.key, state.tr) : ""; }
    function shapeKey() { return song.key ? T.transposeKey(song.key, shift()) : ""; }
    function flats() { var k = shapeKey(); return k ? T.keyUsesFlats(k) : false; }
    /* acorde simplificado (tríade) para iniciantes: C7M(9) -> C, Am7 -> Am, F#m7(b5) -> F#° */
    function simplify(c) {
      var ch = T.parseChord(c); if (!ch) return c;
      var ints = ch.intervals.map(function (x) { return x % 12; }), suf = "";
      if (ints.indexOf(3) >= 0 && ints.indexOf(6) >= 0 && ints.indexOf(7) < 0) suf = "°";
      else if (ints.indexOf(3) >= 0 && ints.indexOf(4) < 0) suf = "m";
      else if (ints.indexOf(8) >= 0 && ints.indexOf(7) < 0) suf = "aug";
      else if (ch.intervals.length === 2) suf = "5";
      return ch.root + suf;
    }
    function tc(c) { var r = T.transposeChord(c, ((shift() % 12) + 12) % 12 === 0 ? 0 : shift(), flats()); return state.simple ? simplify(r) : r; }
    /* acorde real (som) a partir do que aparece na tela: desfaz capotraste e transposição de sopro */
    function soundOf(display) { var d = state.tr - shift(); return d ? T.transposeChord(display, d, T.keyUsesFlats(soundingKey())) : display; }

    /* ---------- barra de ferramentas ---------- */
    var keyLbl = h("b"), fsLbl = h("b");
    function tb(icon, label, fn, cls) { var b = h("button.tb" + (cls ? "." + cls : ""), { onclick: fn, html: OM.icon(icon) }); b.appendChild(document.createTextNode(label)); return b; }
    var scrollBtn = tb("scroll", "Rolagem", toggleScroll), karaBtn = tb("mic", "Karaokê", toggleKaraoke), pracBtn = tb("target", "Praticar", togglePractice);
    karaBtn.innerHTML = OM.icon("pulse"); karaBtn.appendChild(document.createTextNode("Karaokê"));
    tbar.appendChild(h("div.grp", ui.ibtn("minus", function () { setTr(state.tr - 1); }, "Meio tom abaixo"), h("span", { style: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: "40px" } }, h("small", { text: "Tom", style: { fontSize: "9.5px", color: "var(--tx3)", fontWeight: 700, lineHeight: 1 } }), keyLbl), ui.ibtn("plus", function () { setTr(state.tr + 1); }, "Meio tom acima")));
    tbar.appendChild(pracBtn);
    tbar.appendChild(karaBtn);
    tbar.appendChild(scrollBtn);
    var recTbBtn = tb("mic", "Gravar", toggleRec);
    tbar.appendChild(recTbBtn);
    var setBtn = tb("settings", "Ajustes", settingsSheet);
    tbar.appendChild(setBtn);

    function setTr(v) { state.tr = v; if (state.tr > 11) state.tr -= 12; if (state.tr < -11) state.tr += 12; L.setPref(song.id, "tr", state.tr); render(); }
    function setFs(v) { state.fs = Math.max(11, Math.min(40, v)); L.setPref(song.id, "fs", state.fs); sheet.style.setProperty("--fs", state.fs + "px"); }
    /* painel de ajustes: fonte, instrumento, capotraste, exibição dos acordes, metrônomo */
    function settingsSheet() {
      var box = h("div");
      var fsSt = ui.stepper(state.fs, 11, 40, 1, function (v) { return v + " px"; }, function (v) { setFs(v); });
      box.appendChild(h("div.lbl", { text: "Instrumento", style: { marginTop: "0" } }));
      box.appendChild(ui.instSwitch({ current: state.inst, onChange: function (i) { state.inst = i; render(); } }));
      var card = h("div.card", { style: { padding: "4px 14px", marginTop: "12px" } },
        ui.row("Tamanho da letra", fsSt),
        state.inst.kind === "string" ? ui.row("Capotraste", ui.stepper(state.capo, 0, 11, 1, function (v) { return v ? v + "ª casa" : "sem"; }, function (v) { state.capo = v; L.setPref(song.id, "capo", v); render(); })) : null,
        ui.row("Diagramas dos acordes", ui.toggle(state.diagrams, function (v) { state.diagrams = v; L.setPref(song.id, "diagrams", v); render(); })),
        ui.row("Acordes simplificados", ui.toggle(state.simple, function (v) { state.simple = v; L.setPref(song.id, "simple", v); render(); })),
        ui.row("Ocultar acordes (só letra)", ui.toggle(state.noChords, function (v) { state.noChords = v; L.setPref(song.id, "noChords", v); render(); })));
      box.appendChild(card);
      box.appendChild(h("p.dim", { style: { fontSize: "12px", margin: "8px 0 0" }, text: "Dica: na cifra, junte ou afaste dois dedos para mudar o tamanho da letra. “Acordes simplificados” troca acordes como C7M(9) por C, bom para quem está começando." }));
      box.appendChild(h("div.btnrow", { style: { marginTop: "14px" } },
        ui.btn((OM.metro.S.running ? "Parar " : "") + "Metrônomo " + (song.bpm || OM.metro.S.bpm), "metro", function () { toggleMetro(); s2.close(); }, "sm"),
        ui.btn("Afinar", "tuner", function () { s2.close(); OM.router.push("tuner"); }, "sm"),
        ui.btn("Batidas", "guitar", function () { s2.close(); OM.router.push("batidas", { strum: L.prefs(song.id).strum || OM.suggestStrum(song) }); }, "sm")));
      var s2 = ui.sheet({ title: "Ajustes da cifra", content: box });
    }

    /* ---------- conteúdo ---------- */
    var head = h("div.song-head"), strip = h("div.chordstrip"), sheet = h("div.sheetmusic"), extra = h("div.songextra");
    sheet.style.setProperty("--fs", state.fs + "px");
    content.appendChild(head); content.appendChild(strip); content.appendChild(sheet); content.appendChild(extra);
    var chordEls = [];

    function render() {
      var fl = flats();
      keyLbl.textContent = song.key ? soundingKey() : (state.tr > 0 ? "+" + state.tr : state.tr);
      sheet.classList.toggle("nochords", state.noChords);
      /* cabeçalho */
      OM.u.clear(head);
      head.appendChild(h("h2", { text: song.title }));
      head.appendChild(h("div.by", { text: song.artist + (song.album ? " · " + song.album : "") }));
      var meta = h("div.meta");
      if (song.key) meta.appendChild(h("span.badge", { text: "Tom original: " + song.key }));
      if (state.tr) meta.appendChild(h("span.badge.acc", { text: "Tom atual: " + soundingKey() }));
      if (state.capo && state.inst.kind === "string") meta.appendChild(h("span.badge.acc", { text: "Capo " + state.capo + "ª · formas em " + shapeKey() }));
      if (state.inst.kind === "wind" && state.inst.transp && state.inst.transp % 12) meta.appendChild(h("span.badge.acc", { text: "Escrito para " + state.inst.n + " · " + shapeKey() }));
      if (song.bpm) meta.appendChild(h("span.badge", { text: song.bpm + " BPM" }));
      if (song.time) meta.appendChild(h("span.badge", { text: "Compasso " + song.time }));
      if (song.genre) meta.appendChild(h("span.badge", { text: song.genre }));
      meta.appendChild(h("span.badge", ui.diff(song.difficulty || 2), h("span", { text: " " + ["", "Iniciante", "Básico", "Intermediário", "Avançado", "Profissional"][song.difficulty || 2], style: { marginLeft: "6px" } })));
      var stt = L.status(song.id);
      if (stt) meta.appendChild(h("span.badge.ok", { text: stt === "mastered" ? "Dominada" : "Aprendendo" }));
      head.appendChild(meta);
      /* diagramas */
      OM.u.clear(strip);
      var chords = OM.chordpro.chordsOf(parsed).map(tc).filter(function (c, i, a) { return a.indexOf(c) === i; });
      if (state.diagrams && !state.noChords && state.inst.kind !== "drums") chords.forEach(function (c) {
        var d = ui.chordView(c, state.inst, { size: state.inst.kind === "keys" ? 70 : 80, max: 6 });
        d.style.cursor = "pointer"; d.onclick = function () { chordSheet(c); };
        strip.appendChild(d);
      });
      strip.classList.toggle("hidden", !strip.children.length);
      /* letra + acordes */
      OM.u.clear(sheet);
      chordEls = [];
      (function walk(blocks, parent) {
        blocks.forEach(function (b) {
          if (b.type === "blank") parent.appendChild(h("div.sl.blank"));
          else if (b.type === "comment") parent.appendChild(h("div.sl.cmt", { text: b.text }));
          else if (b.type === "tab") parent.appendChild(h("pre.tabblock", { text: b.text.join("\n") }));
          else if (b.type === "chorus") { var c = h("div.chorus"); parent.appendChild(c); walk(b.lines, c); }
          else {
            var line = h("div.sl"), hasLyric = false, hasChord = false;
            b.segs.forEach(function (sg) {
              var cname = sg.c ? (T.isChord(sg.c) ? tc(sg.c) : sg.c) : "";
              var cEl = h("span.c", { text: cname });
              if (cname && T.parseChord(cname)) {
                hasChord = true;
                cEl.setAttribute("data-k", chordEls.length);
                chordEls.push(cEl);
                cEl.onclick = function (e) { e.stopPropagation(); if (practice) practice.jump(+cEl.getAttribute("data-k")); else chordSheet(cname); };
              } else if (cname) hasChord = true;
              if (sg.l.trim()) hasLyric = true;
              var lEl = h("span.l", { text: sg.l });
              if (sg.l.trim()) lEl.onclick = function (e) { if (kara) { e.stopPropagation(); kara.jumpTo(lEl); } };
              line.appendChild(h("span.seg-c", cEl, lEl));
            });
            if (!hasLyric && hasChord) line.classList.add("chordonly");
            if (!hasChord) line.classList.add("lyriconly");
            parent.appendChild(line);
          }
        });
      })(parsed.blocks, sheet);
      if (practice) practice.refresh();
      if (kara) kara.rebuild();
      renderExtra();
    }

    /* partitura, anotações e status */
    var stopMelody = null;
    function renderExtra() {
      OM.u.clear(extra);
      if (song.melody) {
        extra.appendChild(ui.sec("Partitura", null));
        var mel = OM.staff.parseMelody(song.melody.notes);
        var semis = state.tr;
        if (semis) mel = mel.map(function (n) { if (n.bar || n.rest) return n; var m = n.midi + semis, nm = T.midiName(m, T.keyUsesFlats(soundingKey())); var x = /^([A-G])([#b]?)(-?\d)$/.exec(nm); return Object.assign({}, n, { midi: m, letter: x[1], alter: x[2] === "#" ? 1 : x[2] === "b" ? -1 : 0, oct: +x[3] }); });
        var r = OM.staff.render({ clef: song.melody.clef, key: semis ? T.transposeKey(song.melody.key, semis) : song.melody.key, time: song.melody.time, notes: mel, width: 360 });
        var card = h("div.card", h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" } },
          h("b", { text: song.melody.label || "Melodia", style: { fontSize: "14px" } }), ui.btn("Ouvir", "play", function (e) {
            var b = e.currentTarget;
            if (stopMelody) { stopMelody(); stopMelody = null; b.lastChild.textContent = "Ouvir"; return; }
            b.lastChild.textContent = "Parar";
            stopMelody = OM.staff.play(r.notes, song.bpm || 90, function (i) {
              r.noteEls.forEach(function (n) { n && n.classList.remove("cur"); });
              if (i >= 0 && r.noteEls[i]) r.noteEls[i].classList.add("cur");
              if (i < 0) { stopMelody = null; b.lastChild.textContent = "Ouvir"; }
            }, state.inst.kind === "string" || state.inst.kind === "keys" ? state.inst : OM.inst.get("piano"));
          }, "sm")), r.svg);
        extra.appendChild(card);
      }
      extra.appendChild(ui.sec("Minhas gravações desta música"));
      var recBox = h("div");
      extra.appendChild(recBox);
      OM.recording.forSong(song.id).then(function (list) {
        if (!list.length) { recBox.appendChild(h("div.card", h("p.muted", { style: { fontSize: "14px" }, text: "Toque em “Gravar” na barra acima para gravar você tocando ou cantando enquanto lê a cifra." }))); return; }
        var l = h("div.list");
        list.forEach(function (r) { l.appendChild(OM.recording.item(r, renderExtra)); });
        recBox.appendChild(l);
      }).catch(function () { });
      extra.appendChild(ui.sec("Anotações"));
      var note = L.note(song.id);
      var nc = h("div.card", { style: { cursor: "pointer" }, onclick: editNote }, note ? h("p", { text: note, style: { whiteSpace: "pre-wrap", fontSize: "14px" } }) : h("p.muted", { text: "Toque para adicionar anotações pessoais (dedilhado, dinâmica, lembretes de ensaio…)." }));
      extra.appendChild(nc);
      extra.appendChild(ui.sec("Meu estudo"));
      var stt = L.status(song.id);
      extra.appendChild(ui.seg([{ v: null, label: "—" }, { v: "learn", label: "Para aprender" }, { v: "mastered", label: "Dominada" }], stt, function (v) {
        L.setStatus(song.id, v); ui.toast(v === "mastered" ? "Marcada como dominada" : v === "learn" ? "Adicionada a “Para aprender”" : "Status removido"); render();
      }));
      var plays = L.history("song").filter(function (e) { return e.id === song.id; });
      if (plays.length) extra.appendChild(h("p.muted", { style: { fontSize: "13px", marginTop: "10px" }, text: "Praticada " + plays.length + (plays.length === 1 ? " vez" : " vezes") + " · última: " + OM.u.fmtDate(plays[0].date) }));
      extra.appendChild(h("div", { style: { height: "90px" } }));
    }
    function editNote() {
      ui.prompt("Anotações", "Visíveis só para você", L.note(song.id), { multiline: true, allowEmpty: true }).then(function (v) { if (v == null) return; L.setNote(song.id, v); renderExtra(); });
    }

    /* ---------- folha de acorde ---------- */
    function chordSheet(name) {
      var box = h("div"), variant = 0;
      var vs = state.inst.kind === "string" ? OM.voicings.forInstrument(name, state.inst, 8) : [];
      function draw() {
        OM.u.clear(box);
        box.appendChild(h("div", { style: { display: "flex", justifyContent: "center", padding: "6px 0 10px" } }, ui.chordView(name, state.inst, { size: 150, variant: variant, labels: true, noName: true })));
        if (vs.length > 1) box.appendChild(h("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" } },
          ui.ibtn("back", function () { variant = (variant - 1 + vs.length) % vs.length; draw(); }, "Anterior"), h("span.muted", { text: "Posição " + (variant + 1) + " de " + vs.length }),
          ui.ibtn("chev", function () { variant = (variant + 1) % vs.length; draw(); }, "Próxima")));
        var ch = T.parseChord(name);
        if (ch) box.appendChild(h("p.muted", { style: { textAlign: "center", fontSize: "13px", margin: "8px 0 14px" }, text: "Notas: " + ch.pcs.map(function (x) { return T.display(T.name(x, T.keyUsesFlats(ch.root))); }).join(" · ") }));
        box.appendChild(h("div.btnrow", ui.btn("Ouvir", "sound", function () {
          if (vs[variant]) { var tm = OM.inst.tuningMidi(OM.inst.tuningOf(state.inst)); OM.synth.chord(vs[variant].frets.map(function (f, i) { return f < 0 ? null : tm[i] + f; }).filter(function (x) { return x != null; }), state.inst); }
          else ui.playChord(name, state.inst);
        }, "pri"), ui.btn("Detalhes", "grid", function () { s.close(true); OM.router.push("chord", { name: name }); })));
      }
      draw();
      var s = ui.sheet({ title: name, content: box });
    }

    /* ---------- rolagem automática ---------- */
    var raf = 0, acc = 0, lastT = 0, scrollCtl = null, touchPause = 0;
    function toggleScroll() { state.scrolling ? stopScroll() : startScroll(); }
    function startScroll() {
      state.scrolling = true; scrollBtn.classList.add("on");
      if (!scrollCtl) {
        var spd = h("b", { text: state.speed });
        var pp = ui.ibtn("pause", function () { if (raf) { cancelAnimationFrame(raf); raf = 0; pp.innerHTML = OM.icon("play"); } else { pp.innerHTML = OM.icon("pause"); lastT = 0; loop(); } }, "Pausar");
        scrollCtl = h("div.scrollctl", ui.ibtn("minus", function () { state.speed = Math.max(1, state.speed - 1); spd.textContent = state.speed; L.setPref(song.id, "speed", state.speed); }, "Mais lento"),
          spd, ui.ibtn("plus", function () { state.speed = Math.min(20, state.speed + 1); spd.textContent = state.speed; L.setPref(song.id, "speed", state.speed); }, "Mais rápido"), pp,
          ui.ibtn("close", stopScroll, "Parar rolagem"));
        view.appendChild(scrollCtl);
      }
      if (OM.store.settings().keepAwake) OM.bridge.keepAwake(true);
      lastT = 0; loop();
    }
    function loop() {
      raf = requestAnimationFrame(function (t) {
        if (!state.scrolling) return;
        if (lastT && t - touchPause > 1200) {
          acc += (t - lastT) / 1000 * (state.speed * 7);
          if (acc >= 1) { var px = Math.floor(acc); content.scrollTop += px; acc -= px; }
        }
        lastT = t;
        if (content.scrollTop + content.clientHeight >= content.scrollHeight - 2) { stopScroll(); return; }
        loop();
      });
    }
    content.addEventListener("touchstart", function () { touchPause = performance.now(); }, { passive: true });
    content.addEventListener("touchmove", function () { touchPause = performance.now(); }, { passive: true });
    function stopScroll() {
      state.scrolling = false; scrollBtn.classList.remove("on"); cancelAnimationFrame(raf); raf = 0;
      if (scrollCtl) { scrollCtl.remove(); scrollCtl = null; }
      if (!OM.metro.S.running) OM.bridge.keepAwake(false);
    }

    /* ---------- metrônomo integrado ---------- */
    function syncMet() { }
    function applySongTempo() {
      if (song.bpm && OM.metro.S.bpm !== song.bpm) OM.metro.set("bpm", song.bpm);
      if (song.time) { var ts = song.time.split("/"); if (+ts[0] !== OM.metro.S.num) OM.metro.set("num", +ts[0]); if (+ts[1] !== OM.metro.S.den) OM.metro.set("den", +ts[1]); }
    }
    function toggleMetro() { if (OM.metro.S.running) OM.metro.stop(); else { applySongTempo(); OM.metro.start(); } }
    var offMet = OM.metro.on(function (ev, d) {
      if (ev === "state") syncMet();
      if (ev === "beat" && state.present) { flash.classList.add("hit"); setTimeout(function () { flash.classList.remove("hit"); }, 60); }
    });

    /* ---------- modo prática: acordes destacados no tempo, com metrônomo, batida e/ou bateria ---------- */
    var practice = null;
    function togglePractice() { practice ? practice.stop() : practiceSheet(); }
    function practiceSheet() {
      if (!chordEls.length) { ui.toast("Esta cifra não tem acordes para praticar"); return; }
      var pp = L.prefs(song.id), num = (song.time ? +song.time.split("/")[0] : 4) || 4;
      var o = { mode: pp.pmode || "strum", strum: pp.strum || OM.suggestStrum(song), drums: pp.pdrums != null ? pp.pdrums : false, bpc: pp.bpc || num, bpm: pp.pbpm || song.bpm || 80 };
      var box = h("div"), strumBox = h("div");
      function drawStrum() {
        OM.u.clear(strumBox);
        if (o.mode !== "strum") return;
        var sel = h("select.inp", OM.STRUMS.map(function (x) { return h("option", { value: x.id, text: x.cat + " · " + x.n }); }));
        sel.value = o.strum; sel.onchange = function () { o.strum = sel.value; drawStrum(); };
        strumBox.appendChild(h("label.field", { style: { marginTop: "12px" } }, h("span", { text: "Batida" + (o.strum === OM.suggestStrum(song) ? " (sugerida para esta música)" : "") }), sel));
        strumBox.appendChild(OM.strumRow(OM.getStrum(o.strum)));
        strumBox.appendChild(h("div.card", { style: { padding: "2px 14px", marginTop: "10px" } }, ui.row("Bateria junto", ui.toggle(o.drums, function (v) { o.drums = v; }))));
      }
      box.appendChild(ui.seg([{ v: "strum", label: "Com batida" }, { v: "click", label: "Metrônomo" }, { v: "silent", label: "Só visual" }], o.mode, function (v) { o.mode = v; drawStrum(); }));
      box.appendChild(strumBox);
      box.appendChild(h("div.card", { style: { padding: "2px 14px", marginTop: "10px" } },
        ui.row("Andamento", ui.stepper(o.bpm, 30, 240, 2, function (v) { return v + " BPM"; }, function (v) { o.bpm = v; })),
        ui.row("Tempos por acorde", ui.stepper(o.bpc, 1, 16, 1, null, function (v) { o.bpc = v; }))));
      box.appendChild(h("p.dim", { style: { fontSize: "12px", margin: "8px 0 14px" }, text: "Cada acorde da cifra dura o número de tempos escolhido. Toque num acorde para pular até ele. Comece devagar e aumente o andamento aos poucos." }));
      box.appendChild(ui.btn("Começar a praticar", "play", function () {
        L.setPref(song.id, "pmode", o.mode); L.setPref(song.id, "strum", o.strum); L.setPref(song.id, "pdrums", o.drums); L.setPref(song.id, "bpc", o.bpc); L.setPref(song.id, "pbpm", o.bpm);
        sh.close(true); startPractice(o);
      }, "pri block"));
      drawStrum();
      var sh = ui.sheet({ title: "Praticar " + song.title, content: box });
    }
    function startPractice(o) {
      if (kara) kara.stop();
      var num = (song.time ? +song.time.split("/")[0] : 4) || 4, idx = 0, t0 = Date.now(), paused = false;
      var cur = h("b"), nxt = h("small"), beats = h("div.beats");
      var strum = o.mode === "strum" ? OM.getStrum(o.strum) : null;
      var acc = new OM.Accomp({
        bpm: o.bpm, beats: num, loop: false, countIn: 1, inst: state.inst.kind === "string" || state.inst.kind === "keys" ? state.inst : OM.inst.pref(["string"]),
        chords: chordEls.map(function (e) { return { name: e.textContent, sound: soundOf(e.textContent), beats: o.bpc }; }),
        strum: strum, groove: strum && o.drums ? OM.grooveFor(strum.id) : null, click: o.mode === "click",
        onCount: function (n) { cur.textContent = n; nxt.textContent = "Contagem…"; },
        onBeat: function (b) {
          if (b.idx !== idx || b.inChord === 0) show(b.idx);
          drawBeats(b.inChord + 1, b.chordBeats);
          if (state.present) { flash.classList.add("hit"); setTimeout(function () { flash.classList.remove("hit"); }, 60); }
        },
        onEnd: function () { if (practice) practice.stop(true); }
      });
      var pbtn = ui.ibtn("pause", function () {
        if (paused) { acc.start(); paused = false; pbtn.innerHTML = OM.icon("pause"); }
        else { acc.stop(); paused = true; pbtn.innerHTML = OM.icon("play"); }
      }, "Pausar/continuar");
      var bpmLbl = h("b.num", { text: o.bpm });
      var barEl = h("div.practicebar",
        h("div.prow", h("div.pc", cur, nxt, beats), ui.ibtn("close", function () { practice.stop(); }, "Encerrar prática")),
        h("div.prow", ui.ibtn("back", function () { jump(idx - 1); }, "Acorde anterior"), pbtn, ui.ibtn("chev", function () { jump(idx + 1); }, "Próximo acorde"),
          h("span", { style: { flex: 1 } }),
          h("div.stepper", h("button", { html: OM.icon("minus"), onclick: function () { o.bpm = Math.max(30, o.bpm - 4); bpmLbl.textContent = o.bpm; acc.set("bpm", o.bpm); } }), bpmLbl,
            h("button", { html: OM.icon("plus"), onclick: function () { o.bpm = Math.min(240, o.bpm + 4); bpmLbl.textContent = o.bpm; acc.set("bpm", o.bpm); } })), h("small.dim", { text: "BPM" })));
      function drawBeats(n, tot) { OM.u.clear(beats); for (var i = 0; i < tot; i++) beats.appendChild(h("i" + (i < n ? ".on" : ""))); }
      function show(k) {
        idx = k;
        chordEls.forEach(function (e) { e.classList.remove("cur"); });
        var e = chordEls[idx]; if (!e) return;
        e.classList.add("cur");
        cur.textContent = e.textContent;
        nxt.textContent = chordEls[idx + 1] ? "Próximo: " + chordEls[idx + 1].textContent : "Último acorde";
        var r = e.getBoundingClientRect(), cr = content.getBoundingClientRect();
        if (r.top < cr.top + 60 || r.bottom > cr.bottom - 160) content.scrollTo({ top: content.scrollTop + r.top - cr.top - cr.height * 0.3, behavior: "smooth" });
      }
      function jump(k) { k = Math.max(0, Math.min(chordEls.length - 1, k)); acc.jump(k); show(k); drawBeats(0, o.bpc); }
      practice = {
        jump: jump,
        refresh: function () { show(Math.min(idx, chordEls.length - 1)); },
        stop: function (finished) {
          var min = (Date.now() - t0) / 60000;
          practiceMs += Date.now() - t0;
          acc.stop();
          chordEls.forEach(function (e) { e.classList.remove("cur"); });
          barEl.remove(); practice = null; pracBtn.classList.remove("on");
          if (finished) ui.toast("Música concluída! Prática registrada.");
          else if (min > 0.2) ui.toast("Prática de " + OM.u.fmtDur(Math.max(1, min)) + " registrada");
        }
      };
      pracBtn.classList.add("on");
      view.appendChild(barEl);
      if (scrollCtl) stopScroll();
      if (OM.metro.S.running) OM.metro.stop();
      show(0); drawBeats(0, o.bpc);
      acc.start();
    }

    /* ---------- karaokê: a letra muda de cor no ritmo escolhido ---------- */
    var kara = null;
    function toggleKaraoke() { kara ? kara.stop() : startKaraoke(); }
    function startKaraoke() {
      if (practice) practice.stop();
      if (state.scrolling) stopScroll();
      var wpm = L.prefs(song.id).wpm || Math.round((song.bpm || 90) * 0.9);
      var items = [], pos = 0, elapsed = 0, last = 0, raf2 = 0, playing = true;
      function build() {
        items = [];
        [].forEach.call(sheet.querySelectorAll(".sl"), function (line) {
          if (line.classList.contains("cmt") || line.classList.contains("blank")) { items.push({ pause: line.classList.contains("cmt") ? 1.2 : 0.6, line: line }); return; }
          var words = [].filter.call(line.querySelectorAll(".l"), function (l) { return l.textContent.trim(); });
          if (words.length) words.forEach(function (w) { items.push({ el: w, line: line, len: w.textContent.trim().length }); });
          else items.push({ pause: line.querySelectorAll(".c").length * 1.2 * 60 / (song.bpm || 90) * 2, line: line });
        });
      }
      function dur(it) { return it.pause != null ? it.pause : (60 / wpm) * Math.max(0.6, Math.min(1.8, it.len / 5)); }
      function paint() {
        items.forEach(function (it, i) { if (it.el) { it.el.classList.toggle("k-done", i < pos); it.el.classList.toggle("k-cur", i === pos); } });
        var it = items[pos]; if (!it) return;
        var r = it.line.getBoundingClientRect(), cr = content.getBoundingClientRect();
        var target = content.scrollTop + r.top - cr.top - cr.height * 0.35;
        if (Math.abs(r.top - cr.top - cr.height * 0.35) > 30) content.scrollTo({ top: target, behavior: "smooth" });
      }
      function loop(t) {
        raf2 = requestAnimationFrame(loop);
        if (!playing) { last = 0; return; }
        if (last) elapsed += (t - last) / 1000;
        last = t;
        var changed = false;
        while (items[pos] && elapsed >= dur(items[pos])) { elapsed -= dur(items[pos]); pos++; changed = true; }
        if (changed) paint();
        if (pos >= items.length) { kara.stop(); ui.toast("Fim da letra"); }
      }
      var spd = h("b.num", { text: wpm });
      var pp = ui.ibtn("pause", function () { playing = !playing; pp.innerHTML = OM.icon(playing ? "pause" : "play"); }, "Pausar");
      function setW(v) { wpm = Math.max(30, Math.min(240, v)); spd.textContent = wpm; L.setPref(song.id, "wpm", wpm); }
      var ctl = h("div.scrollctl.karactl", ui.ibtn("back", function () { pos = Math.max(0, pos - 4); elapsed = 0; paint(); }, "Voltar"), ui.ibtn("minus", function () { setW(wpm - 10); }, "Mais devagar"),
        h("span", { style: { display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1 } }, spd, h("small.dim", { text: "pal/min", style: { fontSize: "9.5px" } })),
        ui.ibtn("plus", function () { setW(wpm + 10); }, "Mais rápido"), pp, ui.ibtn("close", function () { kara.stop(); }, "Sair do karaokê"));
      view.appendChild(ctl);
      sheet.classList.add("karaoke");
      karaBtn.classList.add("on");
      build(); paint();
      raf2 = requestAnimationFrame(loop);
      if (OM.store.settings().keepAwake) OM.bridge.keepAwake(true);
      ui.toast("Toque numa palavra para começar dali");
      kara = {
        jumpTo: function (el) { var i = items.findIndex(function (x) { return x.el === el; }); if (i >= 0) { pos = i; elapsed = 0; playing = true; pp.innerHTML = OM.icon("pause"); paint(); } },
        rebuild: function () { var p0 = pos; build(); pos = Math.min(p0, items.length - 1); paint(); },
        stop: function () {
          cancelAnimationFrame(raf2); ctl.remove(); sheet.classList.remove("karaoke"); karaBtn.classList.remove("on");
          [].forEach.call(sheet.querySelectorAll(".k-done,.k-cur"), function (e) { e.classList.remove("k-done", "k-cur"); });
          kara = null;
          if (!state.scrolling && !OM.metro.S.running) OM.bridge.keepAwake(false);
        }
      };
    }

    /* ---------- pinça com dois dedos muda o tamanho da letra ---------- */
    var pinch = null;
    content.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) { var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); pinch = { d: d, fs: currentFs() }; }
    }, { passive: true });
    content.addEventListener("touchmove", function (e) {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      var fs = Math.round(Math.max(11, Math.min(40, pinch.fs * d / pinch.d)));
      sheet.style.setProperty("--fs", fs + "px"); pinch.cur = fs;
    }, { passive: false });
    content.addEventListener("touchend", function (e) {
      if (pinch && e.touches.length < 2) { if (pinch.cur) { if (state.present) state.presFs = pinch.cur; else setFs(pinch.cur); ui.toast("Letra: " + pinch.cur + " px", 900); } pinch = null; }
    }, { passive: true });
    content.addEventListener("wheel", function (e) { if (e.ctrlKey) { e.preventDefault(); var f = currentFs() + (e.deltaY < 0 ? 1 : -1); if (state.present) { state.presFs = f; sheet.style.setProperty("--fs", f + "px"); } else setFs(f); } }, { passive: false });
    function currentFs() { return parseInt(getComputedStyle(sheet).getPropertyValue("--fs"), 10) || state.fs; }

    /* ---------- modo apresentação ---------- */
    var presBar = null, presTimer = 0;
    function setPresent(on) {
      state.present = on;
      view.classList.toggle("present", on);
      if (on) {
        if (OM.store.settings().keepAwake) OM.bridge.keepAwake(true);
        var listCtx = p.list ? L.getList(p.list) : null, pos = listCtx ? listCtx.songs.indexOf(song.id) : -1;
        presBar = h("div.presbar",
          ui.btn("Sair", "close", function () { setPresent(false); }),
          ui.btn("", "minus", function () { setFs(state.fs - 2); }), ui.btn("", "plus", function () { setFs(state.fs + 2); }),
          ui.btn(state.scrolling ? "Parar" : "Rolar", "scroll", function (e) { toggleScroll(); e.currentTarget.lastChild.textContent = state.scrolling ? "Parar" : "Rolar"; }),
          listCtx && pos >= 0 && pos < listCtx.songs.length - 1 ? ui.btn("Próxima", "chev", function () { OM.router.replace("song", { id: listCtx.songs[pos + 1], list: p.list, present: true }); }) : null);
        view.appendChild(presBar);
        if (state.fs < 22) sheet.style.setProperty("--fs", Math.max(state.fs, 22) + "px");
        showPresBar();
        ui.toast("Toque embaixo para avançar, em cima para voltar e no meio para os controles", 3500);
      } else {
        if (presBar) presBar.remove(); presBar = null;
        sheet.style.setProperty("--fs", state.fs + "px");
        if (!state.scrolling && !OM.metro.S.running) OM.bridge.keepAwake(false);
      }
    }
    function showPresBar() {
      if (!presBar) return;
      presBar.classList.add("show"); clearTimeout(presTimer);
      presTimer = setTimeout(function () { presBar && presBar.classList.remove("show"); }, 3500);
    }
    /* no modo apresentação: toque embaixo avança a página, em cima volta, no meio mostra os controles */
    content.addEventListener("click", function (e) {
      if (!state.present || kara) return;
      var r = content.getBoundingClientRect(), y = (e.clientY - r.top) / r.height;
      if (y > 0.62) content.scrollBy({ top: r.height * 0.7, behavior: "smooth" });
      else if (y < 0.22) content.scrollBy({ top: -r.height * 0.7, behavior: "smooth" });
      else showPresBar();
    });

    /* ---------- gravação de áudio sobre a cifra ---------- */
    var rec = null, recStarting = false, recPill = null, recTimer = 0;
    function toggleRec() { if (rec) stopRec(); else startRec(); }
    function startRec() {
      if (recStarting) return; recStarting = true;
      var lvl = h("i"), tm = h("b.num", { text: "0:00" });
      OM.recording.start(function (pk) { lvl.style.transform = "scaleX(" + Math.max(0.05, pk) + ")"; }).then(function (c) {
        recStarting = false; rec = c;
        recTbBtn.classList.add("on"); recTbBtn.lastChild.textContent = "Parar";
        recPill = h("div.recpill", h("span.rdot"), tm, h("span.rlvl", lvl), h("button", { html: OM.icon("stop"), "aria-label": "Parar gravação", onclick: function (e) { e.stopPropagation(); stopRec(); } }));
        view.appendChild(recPill);
        recTimer = setInterval(function () { tm.textContent = OM.u.fmtTime(c.elapsed()); }, 250);
        if (OM.store.settings().keepAwake) OM.bridge.keepAwake(true);
        ui.toast("Gravando… a cifra continua na tela");
      }).catch(function (e) { recStarting = false; ui.toast(e && e.name === "Unsupported" ? e.message : OM.audio.micErrorText(e), 4000); });
    }
    function stopRec() {
      if (!rec) return;
      var c = rec; rec = null; clearInterval(recTimer);
      if (recPill) { recPill.remove(); recPill = null; }
      recTbBtn.classList.remove("on"); recTbBtn.lastChild.textContent = "Gravar";
      c.stop().then(function (r) {
        return OM.recording.save(r, { songId: song.id, songTitle: song.title, key: soundingKey(), bpm: OM.metro.S.running ? OM.metro.S.bpm : 0 });
      }).then(function () { ui.toast("Gravação salva em “Minhas gravações desta música”"); renderExtra(); })
        .catch(function (e) { ui.toast(e.message || "Não foi possível salvar"); });
      if (!state.scrolling && !OM.metro.S.running) OM.bridge.keepAwake(false);
    }

    /* ---------- menu ---------- */
    function moreMenu() {
      ui.menu(song.title, [
        { icon: "list", label: "Adicionar a repertório", onClick: addToList },
        { icon: "edit", label: song.user ? "Editar cifra" : "Editar (versão pessoal)", sub: song.user ? null : "O original continua disponível", onClick: function () { OM.router.push("editor", { id: song.id }); } },
        song.edited ? { icon: "reset", label: "Restaurar cifra original", onClick: function () { ui.confirm("Descartar suas alterações nesta cifra?", "Restaurar", true).then(function (ok) { if (ok) { L.revertEdit(song.id); OM.router.replace("song", { id: song.id }); } }); } } : null,
        { icon: "notes", label: "Anotações", onClick: editNote },
        { icon: "download", label: "Exportar como arquivo JSON", sub: "Para backup, outro aparelho ou edição por IA", onClick: function () { OM.transfer.exportFile([song.id], song.title); } },
        { icon: "share", label: "Compartilhar cifra (texto)", onClick: function () { OM.bridge.share(song.title + " — " + song.artist + (soundingKey() ? "\nTom: " + soundingKey() : "") + "\n\n" + OM.chordpro.toPlain(parsed, tc)); } },
        { icon: "reset", label: "Voltar ao tom original", onClick: function () { setTr(0); } },
        song.user ? { icon: "trash", label: "Excluir cifra", danger: true, onClick: function () { ui.confirm("Excluir “" + song.title + "” definitivamente?", "Excluir", true).then(function (ok) { if (ok) { L.deleteUserSong(song.id); OM.router.back(); ui.toast("Cifra excluída"); } }); } } : null
      ]);
    }
    function addToList() {
      var ls = L.lists();
      var opts = ls.map(function (l) { return { v: l.id, label: l.name, sub: l.songs.length + " músicas" + (l.songs.indexOf(song.id) >= 0 ? " · já contém" : "") }; });
      opts.push({ v: "__new", label: "+ Novo repertório" });
      ui.pick("Adicionar a repertório", opts).then(function (v) {
        if (!v) return;
        if (v === "__new") { ui.prompt("Novo repertório", "Nome (ex.: Ensaio sábado, Casamento…)", "").then(function (n) { if (!n) return; var l = L.createList(n); L.addToList(l.id, song.id); ui.toast("Adicionada a “" + n + "”"); }); return; }
        ui.toast(L.addToList(v, song.id) ? "Adicionada ao repertório" : "Já está neste repertório");
      });
    }

    render(); syncMet();
    if (p.present) setTimeout(function () { setPresent(true); }, 50);
    return {
      el: view,
      onShow: function () { var c = OM.inst.current(); if (c.id !== lastMain) { lastMain = c.id; if (c.id !== state.inst.id) { state.inst = c; render(); } } },
      onBack: function () { if (state.present) { setPresent(false); return true; } if (practice) { practice.stop(); return true; } if (kara) { kara.stop(); return true; } return false; },
      destroy: function () {
        stopRec();
        offMet(); stopScroll(); if (stopMelody) stopMelody();
        if (practice) practice.stop();
        if (kara) kara.stop();
        var spent = (Date.now() - openedAt) / 60000;
        if (spent >= 0.75 || practiceMs > 20000) L.log({ type: "song", id: song.id, title: song.title, minutes: Math.round(Math.max(spent, practiceMs / 60000) * 10) / 10, detail: soundingKey() ? "Tom " + soundingKey() : "" });
      }
    };
  });
})(window.OM);
