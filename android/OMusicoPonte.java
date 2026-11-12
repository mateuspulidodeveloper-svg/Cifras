package com.omusico.app;

/* O Músico — ponte entre a interface (JavaScript, window.OMusicoApp) e o Android.
   A interface completa fica em assets/omusico.html (gerada a partir de web/src).
   Responsável por: configurar o WebView, liberar o microfone (afinador/gravador),
   seletor de arquivos (importar cifras/backup), salvar arquivos em Downloads,
   vibração, compartilhamento e manter a tela ligada. */
public class OMusicoPonte {
static String HTML = null;
public final androidx.appcompat.app.AppCompatActivity act;
public final android.webkit.WebView web;
public final android.os.Handler ui = new android.os.Handler(android.os.Looper.getMainLooper());

/* pedidos pendentes enquanto o Android mostra os diálogos */
android.webkit.PermissionRequest pedidoMic = null;
android.webkit.ValueCallback<android.net.Uri[]> retornoArquivo = null;
androidx.activity.result.ActivityResultLauncher<String> lancadorMic;
androidx.activity.result.ActivityResultLauncher<String> lancadorArquivo;

public OMusicoPonte(androidx.appcompat.app.AppCompatActivity a, android.webkit.WebView w) {
act = a; web = w;
/* precisa ser registrado durante o onCreate */
lancadorMic = act.registerForActivityResult(new androidx.activity.result.contract.ActivityResultContracts.RequestPermission(),
new androidx.activity.result.ActivityResultCallback<Boolean>() {
@Override
public void onActivityResult(Boolean ok) {
if (pedidoMic == null) return;
try {
if (ok != null && ok) pedidoMic.grant(new String[] { android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE });
else { pedidoMic.deny(); aviso("Sem permissão de microfone, o afinador não funciona"); }
} catch (Throwable e) { }
pedidoMic = null;
}
});
lancadorArquivo = act.registerForActivityResult(new androidx.activity.result.contract.ActivityResultContracts.GetContent(),
new androidx.activity.result.ActivityResultCallback<android.net.Uri>() {
@Override
public void onActivityResult(android.net.Uri uri) {
if (retornoArquivo == null) return;
retornoArquivo.onReceiveValue(uri == null ? null : new android.net.Uri[] { uri });
retornoArquivo = null;
}
});
}

/* ---------- configuração do WebView ---------- */
public static void configurar(android.webkit.WebView w) {
android.webkit.WebSettings s = w.getSettings();
s.setJavaScriptEnabled(true);
s.setDomStorageEnabled(true);
s.setDatabaseEnabled(true);
s.setMediaPlaybackRequiresUserGesture(false);
s.setAllowFileAccess(false);
s.setAllowContentAccess(false);
s.setLoadWithOverviewMode(true);
s.setUseWideViewPort(true);
s.setSupportZoom(false);
s.setBuiltInZoomControls(false);
s.setDisplayZoomControls(false);
s.setTextZoom(100);
w.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
w.setVerticalScrollBarEnabled(false);
w.setHorizontalScrollBarEnabled(false);
w.setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
}

/* WebChromeClient: microfone e seletor de arquivos */
public android.webkit.WebChromeClient cliente() {
return new android.webkit.WebChromeClient() {
@Override
public void onPermissionRequest(final android.webkit.PermissionRequest req) {
ui.post(new Runnable() { public void run() {
boolean querMic = false;
for (String r : req.getResources()) if (android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) querMic = true;
if (!querMic) { req.deny(); return; }
if (androidx.core.content.ContextCompat.checkSelfPermission(act, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
req.grant(new String[] { android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE });
} else {
if (pedidoMic != null) { try { pedidoMic.deny(); } catch (Throwable e) { } }
pedidoMic = req;
lancadorMic.launch(android.Manifest.permission.RECORD_AUDIO);
}
} });
}
@Override
public void onPermissionRequestCanceled(android.webkit.PermissionRequest req) {
if (req == pedidoMic) pedidoMic = null;
}
@Override
public boolean onShowFileChooser(android.webkit.WebView v, android.webkit.ValueCallback<android.net.Uri[]> cb, android.webkit.WebChromeClient.FileChooserParams p) {
if (retornoArquivo != null) retornoArquivo.onReceiveValue(null);
retornoArquivo = cb;
try { lancadorArquivo.launch("*/*"); }
catch (Throwable e) { retornoArquivo = null; aviso("Nenhum gerenciador de arquivos disponível"); return false; }
return true;
}
};
}

/* lê assets/omusico.html uma única vez */
public static synchronized String html(android.content.Context c) {
if (HTML != null) return HTML;
try {
java.io.InputStream in = c.getAssets().open("omusico.html");
java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
byte[] buf = new byte[65536];
int n;
while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
in.close();
HTML = out.toString("UTF-8");
} catch (Throwable e) {
HTML = "<html><body style='font-family:sans-serif;padding:40px;background:#111214;color:#eee'>Erro: assets/omusico.html não encontrado. Adicione o arquivo pelo Asset Manager do Sketchware Pro.</body></html>";
}
return HTML;
}

/* origem https fixa: contexto seguro (microfone) e armazenamento local persistente */
public void carregar() {
web.loadDataWithBaseURL("https://omusico.local/", html(act), "text/html", "UTF-8", null);
}

/* executa JavaScript na página */
public void js(final String codigo) {
ui.post(new Runnable() { public void run() {
try { web.evaluateJavascript(codigo, null); } catch (Throwable e) { }
} });
}

/* ---------- chamadas feitas pela página ---------- */
@android.webkit.JavascriptInterface
public void compartilhar(final String texto) {
ui.post(new Runnable() { public void run() {
try {
android.content.Intent it = new android.content.Intent(android.content.Intent.ACTION_SEND);
it.setType("text/plain");
it.putExtra(android.content.Intent.EXTRA_TEXT, texto);
act.startActivity(android.content.Intent.createChooser(it, "Compartilhar"));
} catch (Throwable e) { aviso("Não foi possível compartilhar"); }
} });
}

@android.webkit.JavascriptInterface
public void vibrar(int ms) {
try {
android.os.Vibrator v = (android.os.Vibrator) act.getSystemService(android.content.Context.VIBRATOR_SERVICE);
if (v == null || !v.hasVibrator()) return;
if (android.os.Build.VERSION.SDK_INT >= 26) v.vibrate(android.os.VibrationEffect.createOneShot(Math.max(1, ms), android.os.VibrationEffect.DEFAULT_AMPLITUDE));
else v.vibrate(ms);
} catch (Throwable e) { }
}

/* mantém a tela ligada durante ensaios, rolagem automática e metrônomo */
@android.webkit.JavascriptInterface
public void telaLigada(final boolean ligar) {
ui.post(new Runnable() { public void run() {
if (ligar) act.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
else act.getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
} });
}

/* salva um arquivo (conteúdo em base64) em Downloads/O Musico. Retorna o caminho ou "" */
@android.webkit.JavascriptInterface
public String salvarArquivo(String nome, String mime, String base64) {
try {
byte[] dados = android.util.Base64.decode(base64, android.util.Base64.DEFAULT);
nome = nome.replaceAll("[\\\\/:*?\"<>|]", "_");
if (android.os.Build.VERSION.SDK_INT >= 29) {
android.content.ContentValues cv = new android.content.ContentValues();
cv.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, nome);
cv.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, mime);
cv.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS + "/O Musico");
android.net.Uri uri = act.getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
if (uri == null) return "";
java.io.OutputStream os = act.getContentResolver().openOutputStream(uri);
os.write(dados);
os.close();
return "Downloads/O Musico/" + nome;
} else {
java.io.File dir = new java.io.File(act.getExternalFilesDir(android.os.Environment.DIRECTORY_DOWNLOADS), "O Musico");
dir.mkdirs();
java.io.File f = new java.io.File(dir, nome);
java.io.FileOutputStream os = new java.io.FileOutputStream(f);
os.write(dados);
os.close();
return f.getAbsolutePath();
}
} catch (Throwable e) {
return "";
}
}

@android.webkit.JavascriptInterface
public void aviso(final String msg) {
ui.post(new Runnable() { public void run() {
android.widget.Toast.makeText(act, msg, android.widget.Toast.LENGTH_SHORT).show();
} });
}

@android.webkit.JavascriptInterface
public void sair() {
ui.post(new Runnable() { public void run() { act.finish(); } });
}
}
