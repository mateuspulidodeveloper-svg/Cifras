/* O Músico — gravação de áudio reutilizável (gravador de ideias e gravação sobre a cifra).
   Usa MediaRecorder sobre o microfone; as gravações ficam no IndexedDB do aparelho. */
(function (OM) {
  "use strict";
  var h = OM.u.h;

  function supported() { return typeof MediaRecorder !== "undefined"; }
  function mime() {
    var c = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    for (var i = 0; i < c.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c[i])) return c[i];
    return "";
  }

  /* inicia a gravação. onLevel(pico 0..1) é chamado a cada quadro.
     Retorna Promise<ctrl>; ctrl.stop() -> Promise<{blob, type, duration}> */
  function start(onLevel) {
    if (!supported()) return Promise.reject({ name: "Unsupported", message: "Gravação não suportada neste WebView. Atualize o Android System WebView." });
    return OM.audio.getMic().then(function (stream) {
      var ctx = OM.audio.context(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
      an.fftSize = 2048; src.connect(an);
      var buf = new Float32Array(2048), m = mime(), mr, chunks = [], raf = 0, t0 = Date.now(), stopped = false;
      try { mr = m ? new MediaRecorder(stream, { mimeType: m }) : new MediaRecorder(stream); } catch (e) { mr = new MediaRecorder(stream); }
      mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
      mr.start(500);
      (function loop() {
        raf = requestAnimationFrame(loop);
        an.getFloatTimeDomainData(buf);
        var pk = 0; for (var i = 0; i < buf.length; i++) { var a = buf[i] < 0 ? -buf[i] : buf[i]; if (a > pk) pk = a; }
        onLevel && onLevel(Math.min(1, pk * 1.4));
      })();
      function cleanup() { cancelAnimationFrame(raf); try { src.disconnect(); } catch (e) { } OM.audio.releaseMic(); }
      return {
        t0: t0,
        elapsed: function () { return (Date.now() - t0) / 1000; },
        stop: function () {
          if (stopped) return Promise.resolve(null);
          stopped = true;
          return new Promise(function (res) {
            mr.onstop = function () {
              cleanup();
              var type = mr.mimeType || m || "audio/webm";
              res({ blob: new Blob(chunks, { type: type }), type: type, duration: (Date.now() - t0) / 1000 });
            };
            if (mr.state !== "inactive") mr.stop(); else mr.onstop();
          });
        }
      };
    });
  }
  /* salva o resultado; meta: {name, songId, songTitle, key, bpm} */
  function save(r, meta) {
    meta = meta || {};
    if (!r || r.duration < 0.5 || !r.blob.size) return Promise.reject(new Error("Gravação muito curta"));
    var d = new Date();
    var rec = Object.assign({
      id: OM.u.uid("r"), date: Date.now(), duration: r.duration, type: r.type, blob: r.blob,
      name: (meta.songTitle ? meta.songTitle + " — " : "Ideia ") + d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }, meta);
    return OM.store.rec.put(rec).then(function () {
      OM.lib.log({ type: "tool", icon: "mic", screen: "recorder", title: "Gravação: " + rec.name, minutes: Math.round(rec.duration / 6) / 10 });
      return rec;
    });
  }
  function forSong(id) { return OM.store.rec.all().then(function (a) { return a.filter(function (r) { return r.songId === id; }); }); }
  function ext(type) { return /mp4/.test(type) ? "m4a" : /ogg/.test(type) ? "ogg" : "webm"; }

  /* folha com player e ações (renomear, exportar, excluir, abrir cifra) */
  function openSheet(r, onChange) {
    var ui = OM.ui, url = URL.createObjectURL(r.blob);
    var audio = h("audio", { controls: true, src: url });
    var info = h("p.muted", { style: { fontSize: "13px", marginBottom: "8px" }, text: OM.u.fmtDate(r.date) + " · " + OM.u.fmtTime(r.duration) + (r.key ? " · Tom " + r.key : "") + (r.bpm ? " · " + r.bpm + " BPM" : "") });
    var s;
    var box = h("div", info, audio, h("div.btnrow", { style: { marginTop: "14px" } },
      r.songId && OM.lib.get(r.songId) ? ui.btn("Abrir cifra", "cifras", function () { s.close(); OM.router.push("song", { id: r.songId }); }, "sm") : null,
      ui.btn("Renomear", "edit", function () { ui.prompt("Renomear gravação", "Nome", r.name).then(function (n) { if (!n) return; r.name = n; OM.store.rec.put(r).then(function () { s.close(); onChange && onChange(); }); }); }, "sm"),
      ui.btn("Exportar", "download", function () {
        OM.bridge.saveFile(r.name.replace(/[^\w\- ]+/g, "_") + "." + ext(r.type), r.type.split(";")[0], r.blob).then(function (path) { ui.toast(path ? "Salvo em " + path : "Não foi possível exportar"); });
      }, "sm"),
      ui.btn("Excluir", "trash", function () { ui.confirm("Excluir “" + r.name + "”?", "Excluir", true).then(function (ok) { if (ok) OM.store.rec.del(r.id).then(function () { s.close(); onChange && onChange(); }); }); }, "sm danger")));
    s = ui.sheet({ title: r.name, content: box, onClose: function () { audio.pause(); URL.revokeObjectURL(url); } });
    audio.play().catch(function () { });
    return s;
  }
  function item(r, onChange) {
    return OM.ui.item({ icon: "wave", iconCls: "acc", title: r.name, sub: OM.u.fmtDate(r.date) + " · " + OM.u.fmtTime(r.duration) + (r.bpm ? " · " + r.bpm + " BPM" : ""),
      end: h("span", { html: OM.icon("play") }), onClick: function () { openSheet(r, onChange); } });
  }

  OM.recording = { supported: supported, start: start, save: save, forSong: forSong, openSheet: openSheet, item: item };
})(window.OM);
