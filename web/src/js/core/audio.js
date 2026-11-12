/* O Músico — contexto de áudio compartilhado e acesso ao microfone */
(function (OM) {
  "use strict";
  var ctx = null, master = null;

  function context() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error("Web Audio não suportado neste aparelho");
      ctx = new AC({ latencyHint: "interactive" });
      master = ctx.createGain();
      master.gain.value = 0.9;
      var comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10; comp.ratio.value = 4;
      master.connect(comp); comp.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function out() { context(); return master; }

  /* desbloqueia o áudio no primeiro toque (exigência dos navegadores) */
  function unlock() {
    try { var c = context(); var b = c.createBuffer(1, 1, 22050); var s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) { }
    document.removeEventListener("pointerdown", unlock, true);
  }
  document.addEventListener("pointerdown", unlock, true);

  /* microfone: áudio cru, sem filtros de voz (essencial para a análise de afinação) */
  var mic = { stream: null, users: 0 };
  function micErrorText(e) {
    var n = e && e.name;
    if (n === "NotAllowedError" || n === "SecurityError" || n === "PermissionDeniedError")
      return "Permissão de microfone negada. Libere o microfone para o O Músico nas configurações do Android (Apps › O Músico › Permissões).";
    if (n === "NotFoundError" || n === "DevicesNotFoundError") return "Nenhum microfone encontrado neste aparelho.";
    if (n === "NotReadableError") return "O microfone está sendo usado por outro aplicativo.";
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return "Este WebView não oferece acesso ao microfone. Atualize o Android System WebView.";
    return "Não foi possível acessar o microfone (" + (e && (e.message || e.name) || "erro") + ").";
  }
  function getMic() {
    if (mic.stream && mic.stream.active) { mic.users++; return Promise.resolve(mic.stream); }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject({ name: "Unsupported" });
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
      video: false
    }).then(function (s) { mic.stream = s; mic.users = 1; return s; });
  }
  function releaseMic() {
    mic.users = Math.max(0, mic.users - 1);
    if (mic.users === 0 && mic.stream) { mic.stream.getTracks().forEach(function (t) { t.stop(); }); mic.stream = null; }
  }

  OM.audio = { context: context, out: out, getMic: getMic, releaseMic: releaseMic, micErrorText: micErrorText };
})(window.OM);
