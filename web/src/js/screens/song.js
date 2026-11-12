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
      speed: pr.speed || 3, scrolling: false, inst: OM.inst.current(), present: false
    };
    var parsed = OM.chordpro.parse(song.body);
    var openedAt = Date.now(), practiceMs = 0;
    L.touch(song.id);

    var content = h("div.content"), favBtn, view;
    var titleWrap = { title: song.title, sub: song.artist, back: true };
    favBtn = ui.ibtn(L.isFav(song.id) ? "heartf" : "heart", function () {
      var on = L.toggleFav(song.id);
      favBtn.innerHTML = OM.icon(on ? "heartf" : "heart"); favBtn.classList.toggle("on", on);
      ui.toast(on ? "Adicionada às favoritas" : "Removida das favoritas");
    }, "Favorita", L.isFav(song.id) ? "on" : "");
    var bar = ui.topbar(Object.assign(titleWrap, { actions: [favBtn, ui.ibtn("more", moreMenu, "Mais opções")] }));
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
    function tc(c) { return T.transposeChord(c, ((shift() % 12) + 12) % 12 === 0 ? 0 : shift(), flats()); }

    /* ---------- barra de ferramentas ---------- */
    var keyLbl = h("b"), fsLbl = h("b");
    function tb(icon, label, fn, cls) { var b = h("button.tb" + (cls ? "." + cls : ""), { onclick: fn, html: OM.icon(icon) }); b.appendChild(document.createTextNode(label)); return b; }
    var capoBtn = tb("capo", "Capo", pickCapo), instBtn = tb(OM.inst.icon(state.inst), state.inst.n.split(" ")[0], pickInst);
    var scrollBtn = tb("scroll", "Rolagem", toggleScroll), metBtn = tb("metro", "", toggleMetro), pracBtn = tb("target", "Praticar", togglePractice);
    tbar.appendChild(h("div.grp", ui.ibtn("minus", function () { setTr(state.tr - 1); }, "Meio tom abaixo"), h("span", { style: { display: "flex", flexDirection: "column", alignItems: "center", minWidth: "40px" } }, h("small", { text: "Tom", style: { fontSize: "9.5px", color: "var(--tx3)", fontWeight: 700, lineHeight: 1 } }), keyLbl), ui.ibtn("plus", function () { setTr(state.tr + 1); }, "Meio tom acima")));
    tbar.appendChild(h("div.grp", ui.ibtn("minus", function () { setFs(state.fs - 1); }, "Diminuir fonte"), h("span", { html: OM.icon("font"), style: { width: "20px", color: "var(--tx2)" } }), ui.ibtn("plus", function () { setFs(state.fs + 1); }, "Aumentar fonte")));
    tbar.appendChild(scrollBtn);
    tbar.appendChild(pracBtn);
    tbar.appendChild(metBtn);
    tbar.appendChild(capoBtn);
    tbar.appendChild(instBtn);
    tbar.appendChild(tb("present", "Apresentar", function () { setPresent(true); }));
    tbar.appendChild(tb("tuner", "Afinar", function () { OM.router.push("tuner"); }));

    function setTr(v) { state.tr = v; if (state.tr > 11) state.tr -= 12; if (state.tr < -11) state.tr += 12; L.setPref(song.id, "tr", state.tr); render(); }
    function setFs(v) { state.fs = Math.max(11, Math.min(40, v)); L.setPref(song.id, "fs", state.fs); sheet.style.setProperty("--fs", state.fs + "px"); }
    function pickCapo() {
      var opts = []; for (var i = 0; i <= 11; i++) opts.push({ v: i, label: i ? i + "ª casa" : "Sem capotraste", sub: i && song.key ? "Formas em " + T.transposeKey(song.key, state.tr - i) : null });
      ui.pick("Capotraste", opts, state.capo).then(function (v) { if (v == null) return; state.capo = v; L.setPref(song.id, "capo", v); render(); });
    }
    function pickInst() {
      var opts = OM.inst.all().map(function (i) { return { v: i.id, label: i.n, sub: { string: "Diagramas no braço", keys: "Teclas do piano", wind: "Cifra transposta para o instrumento", bowed: "Notas dos acordes", drums: "Cifra + metrônomo", voice: "Notas dos acordes" }[i.kind] }; });
      ui.pick("Instrumento de referência", opts, state.inst.id).then(function (v) {
        if (!v) return; state.inst = OM.inst.get(v);
        instBtn.innerHTML = OM.icon(OM.inst.icon(state.inst)); instBtn.appendChild(document.createTextNode(state.inst.n.split(" ")[0]));
        render();
      });
    }

    /* ---------- conteúdo ---------- */
    var head = h("div.song-head"), strip = h("div.chordstrip"), sheet = h("div.sheetmusic"), extra = h("div.songextra");
    sheet.style.setProperty("--fs", state.fs + "px");
    content.appendChild(head); content.appendChild(strip); content.appendChild(sheet); content.appendChild(extra);
    var chordEls = [];

    function render() {
      var fl = flats();
      keyLbl.textContent = song.key ? soundingKey() : (state.tr > 0 ? "+" + state.tr : state.tr);
      capoBtn.classList.toggle("on", state.capo > 0 && state.inst.kind === "string");
      capoBtn.lastChild.textContent = state.capo ? "Capo " + state.capo : "Capo";
      capoBtn.classList.toggle("hidden", state.inst.kind !== "string");
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
      if (st.showDiagrams !== false && state.inst.kind !== "drums") chords.forEach(function (c) {
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
              line.appendChild(h("span.seg-c", cEl, h("span.l", { text: sg.l })));
            });
            if (!hasLyric && hasChord) line.classList.add("chordonly");
            if (!hasChord) line.classList.add("lyriconly");
            parent.appendChild(line);
          }
        });
      })(parsed.blocks, sheet);
      if (practice) practice.refresh();
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
    function syncMet() {
      metBtn.innerHTML = OM.icon(OM.metro.S.running ? "stop" : "metro");
      metBtn.appendChild(document.createTextNode((song.bpm || OM.metro.S.bpm) + " BPM"));
      metBtn.classList.toggle("on", OM.metro.S.running);
    }
    function applySongTempo() {
      if (song.bpm && OM.metro.S.bpm !== song.bpm) OM.metro.set("bpm", song.bpm);
      if (song.time) { var ts = song.time.split("/"); if (+ts[0] !== OM.metro.S.num) OM.metro.set("num", +ts[0]); if (+ts[1] !== OM.metro.S.den) OM.metro.set("den", +ts[1]); }
    }
    function toggleMetro() { if (OM.metro.S.running) OM.metro.stop(); else { applySongTempo(); OM.metro.start(); } }
    var offMet = OM.metro.on(function (ev, d) {
      if (ev === "state") syncMet();
      if (ev === "beat" && state.present) { flash.classList.add("hit"); setTimeout(function () { flash.classList.remove("hit"); }, 60); }
      if (practice && ev === "beat") practice.beat(d);
    });

    /* ---------- modo prática: destaca o acorde atual no andamento ---------- */
    var practice = null;
    function togglePractice() { practice ? practice.stop() : startPractice(); }
    function startPractice() {
      if (!chordEls.length) { ui.toast("Esta cifra não tem acordes para praticar"); return; }
      var bpc = (song.time ? +song.time.split("/")[0] : 4) || 4, idx = 0, count = 0, t0 = Date.now();
      var cur = h("b"), nxt = h("small"), beats = h("div.beats");
      var pbtn = ui.ibtn("pause", function () { toggleMetro(); }, "Pausar/continuar");
      var stepper = ui.stepper(bpc, 1, 16, 1, null, function (v) { bpc = v; drawBeats(); });
      var barEl = h("div.practicebar",
        h("div.prow", h("div.pc", cur, nxt, beats), ui.ibtn("close", function () { practice.stop(); }, "Encerrar prática")),
        h("div.prow", ui.ibtn("back", function () { jump(idx - 1); }, "Acorde anterior"), pbtn, ui.ibtn("chev", function () { jump(idx + 1); }, "Próximo acorde"),
          h("span", { style: { flex: 1 } }), h("small.dim", { text: "Tempos" }), stepper));
      function drawBeats() { OM.u.clear(beats); for (var i = 0; i < bpc; i++) beats.appendChild(h("i" + (i < count ? ".on" : ""))); }
      function jump(k) {
        idx = Math.max(0, Math.min(chordEls.length - 1, k)); count = 0;
        chordEls.forEach(function (e) { e.classList.remove("cur"); });
        var e = chordEls[idx]; e.classList.add("cur");
        cur.textContent = e.textContent;
        nxt.textContent = chordEls[idx + 1] ? "Próximo: " + chordEls[idx + 1].textContent : "Fim da música";
        var r = e.getBoundingClientRect(), cr = content.getBoundingClientRect();
        if (r.top < cr.top + 60 || r.bottom > cr.bottom - 140) content.scrollTo({ top: content.scrollTop + r.top - cr.top - cr.height * 0.3, behavior: "smooth" });
        drawBeats();
      }
      practice = {
        jump: jump,
        beat: function () {
          count++;
          if (count > bpc) { if (idx + 1 >= chordEls.length) { practice.stop(true); return; } jump(idx + 1); count = 1; }
          drawBeats();
          pbtn.innerHTML = OM.icon("pause");
        },
        refresh: function () { jump(Math.min(idx, chordEls.length - 1)); },
        stop: function (finished) {
          var min = (Date.now() - t0) / 60000;
          practiceMs += Date.now() - t0;
          chordEls.forEach(function (e) { e.classList.remove("cur"); });
          barEl.remove(); practice = null; pracBtn.classList.remove("on");
          OM.metro.stop();
          if (finished) ui.toast("Música concluída! Prática registrada.");
          else if (min > 0.2) ui.toast("Prática de " + OM.u.fmtDur(Math.max(1, min)) + " registrada");
        }
      };
      pracBtn.classList.add("on");
      view.appendChild(barEl);
      if (scrollCtl) stopScroll();
      jump(0);
      count = 0;
      applySongTempo();
      if (!OM.metro.S.running) OM.metro.start();
      var unsub = OM.metro.on(function (ev, on) { if (ev === "state" && practice) pbtn.innerHTML = OM.icon(on ? "pause" : "play"); });
      var oldStop = practice.stop; practice.stop = function (f) { unsub(); oldStop(f); };
    }

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
        ui.toast("Toque na tela para mostrar os controles");
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
    content.addEventListener("click", function () { if (state.present) showPresBar(); });

    /* ---------- menu ---------- */
    function moreMenu() {
      ui.menu(song.title, [
        { icon: "list", label: "Adicionar a repertório", onClick: addToList },
        { icon: "edit", label: song.user ? "Editar cifra" : "Editar (versão pessoal)", sub: song.user ? null : "O original continua disponível", onClick: function () { OM.router.push("editor", { id: song.id }); } },
        song.edited ? { icon: "reset", label: "Restaurar cifra original", onClick: function () { ui.confirm("Descartar suas alterações nesta cifra?", "Restaurar", true).then(function (ok) { if (ok) { L.revertEdit(song.id); OM.router.replace("song", { id: song.id }); } }); } } : null,
        { icon: "notes", label: "Anotações", onClick: editNote },
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
      onShow: function () { state.inst = state.inst.id === OM.store.settings().instrument ? OM.inst.current() : state.inst; syncMet(); },
      onBack: function () { if (state.present) { setPresent(false); return true; } if (practice) { practice.stop(); return true; } return false; },
      destroy: function () {
        offMet(); stopScroll(); if (stopMelody) stopMelody();
        if (practice) practice.stop();
        var spent = (Date.now() - openedAt) / 60000;
        if (spent >= 0.75 || practiceMs > 20000) L.log({ type: "song", id: song.id, title: song.title, minutes: Math.round(Math.max(spent, practiceMs / 60000) * 10) / 10, detail: soundingKey() ? "Tom " + soundingKey() : "" });
      }
    };
  });
})(window.OM);
