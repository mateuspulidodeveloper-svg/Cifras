/* O Músico — código Android (Sketchware Pro: bloco "add source directly" em MainActivity › onCreate › initializeLogic).
   Requer na tela main um WebView com id "webview1" e View Binding ativo.
   Usa o arquivo Java OMusicoPonte (Java Manager) e a interface em assets/omusico.html (Asset Manager).
   Ponte JavaScript: window.OMusicoApp  |  Botão Voltar: window.App.voltar() */
final android.webkit.WebView omWeb = binding.webview1;
final android.view.Window omWin = getWindow();

/* ---------- janela: tema escuro grafite ---------- */
omWin.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
omWin.setStatusBarColor(0xFF111214);
omWin.setNavigationBarColor(0xFF16171A);
omWeb.setBackgroundColor(0xFF111214);

/* ---------- WebView ---------- */
OMusicoPonte.configurar(omWeb);
final OMusicoPonte omPonte = new OMusicoPonte(this, omWeb);
omWeb.setWebChromeClient(omPonte.cliente());
omWeb.setWebViewClient(new android.webkit.WebViewClient() {
@Override
public boolean shouldOverrideUrlLoading(android.webkit.WebView view, android.webkit.WebResourceRequest req) {
android.net.Uri u = req.getUrl();
if ("omusico.local".equals(u.getHost())) return false;
try { startActivity(new android.content.Intent(android.content.Intent.ACTION_VIEW, u)); } catch (Throwable e) { }
return true;
}
});

/* ---------- botão/gesto Voltar: fecha painéis e volta telas; na tela inicial, sai ---------- */
getOnBackPressedDispatcher().addCallback(this, new androidx.activity.OnBackPressedCallback(true) {
@Override
public void handleOnBackPressed() {
omPonte.js("(window.App ? App.voltar() : OMusicoApp.sair())");
}
});

/* ---------- segundo plano: libera o microfone do afinador quando o app sai da tela ---------- */
getLifecycle().addObserver(new androidx.lifecycle.LifecycleEventObserver() {
@Override
public void onStateChanged(androidx.lifecycle.LifecycleOwner dono, androidx.lifecycle.Lifecycle.Event ev) {
if (ev == androidx.lifecycle.Lifecycle.Event.ON_STOP) omPonte.js("window.App && App.segundoPlano && App.segundoPlano(true)");
else if (ev == androidx.lifecycle.Lifecycle.Event.ON_START) omPonte.js("window.App && App.segundoPlano && App.segundoPlano(false)");
}
});

omWeb.addJavascriptInterface(omPonte, "OMusicoApp");
omPonte.carregar();
