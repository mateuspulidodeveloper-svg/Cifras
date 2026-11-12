/* O Músico — ponte com o Android (window.OMusicoApp, definida em OMusicoPonte.java).
   No navegador comum, cada função tem uma alternativa web equivalente. */
(function (OM) {
  "use strict";
  var NAT = window.OMusicoApp || null;
  function call(fn) {
    if (!NAT || typeof NAT[fn] !== "function") return undefined;
    try { return NAT[fn].apply(NAT, [].slice.call(arguments, 1)); } catch (e) { return undefined; }
  }
  var wakeLock = null;

  OM.bridge = {
    native: !!NAT,
    vibrate: function (ms) {
      if (NAT) call("vibrar", ms | 0);
      else if (navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { }
    },
    share: function (text) {
      if (NAT) { call("compartilhar", text); return; }
      if (navigator.share) navigator.share({ text: text }).catch(function () { });
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { OM.ui.toast("Copiado para a área de transferência"); });
    },
    /* manter a tela ligada (ensaios/apresentações) */
    keepAwake: function (on) {
      if (NAT) { call("telaLigada", !!on); return; }
      try {
        if (on && navigator.wakeLock && !wakeLock) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; w.addEventListener("release", function () { wakeLock = null; }); }).catch(function () { });
        if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
      } catch (e) { }
    },
    /* salva um arquivo (base64) na pasta Downloads / Música do aparelho */
    saveFile: function (name, mime, blob) {
      return new Promise(function (res) {
        if (NAT && typeof NAT.salvarArquivo === "function") {
          var fr = new FileReader();
          fr.onload = function () {
            var b64 = String(fr.result).split(",")[1] || "";
            var r = call("salvarArquivo", name, mime, b64);
            res(r || "");
          };
          fr.onerror = function () { res(""); };
          fr.readAsDataURL(blob);
        } else {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob); a.download = name;
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
          res("Downloads/" + name);
        }
      });
    },
    exit: function () { call("sair"); }
  };
})(window.OM);
