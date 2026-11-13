// O Músico — empacota os módulos (CSS + JS) em um único HTML para o WebView (assets/omusico.html)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => join(root, "src", p);
const CSS = ["css/base.css", "css/components.css", "css/screens.css"];
const JS = [
  "js/core/util.js", "js/core/store.js", "js/core/bridge.js", "js/core/audio.js",
  "js/music/theory.js", "js/music/instruments.js", "js/music/voicings.js", "js/music/pitch.js", "js/music/synth.js",
  "js/music/metro.js", "js/music/recording.js", "js/music/accomp.js", "js/music/chordpro.js", "js/music/staff.js",
  "js/data/songs.js", "js/data/dictionary.js", "js/data/grooves.js", "js/data/lessons.js", "js/data/strums.js",
  "js/ui/icons.js", "js/ui/components.js", "js/core/router.js", "js/core/lib.js", "js/core/transfer.js",
  "js/screens/home.js", "js/screens/cifras.js", "js/screens/song.js", "js/screens/editor.js", "js/screens/tools.js",
  "js/screens/tuner.js", "js/screens/metronome.js", "js/screens/chords.js", "js/screens/scales.js", "js/screens/transposer.js",
  "js/screens/audio-tools.js", "js/screens/extras.js", "js/screens/learn.js", "js/screens/library.js", "js/screens/profile.js", "js/screens/lessons.js", "js/screens/setup.js", "js/screens/batidas.js",
  "js/app.js"
];
const css = CSS.map((f) => readFileSync(src(f), "utf8")).join("\n");
const js = JS.map((f) => `/* ===== ${f} ===== */\n` + readFileSync(src(f), "utf8")).join("\n");
if (js.includes("</script")) throw new Error("JS contém </script>");
const html = readFileSync(src("index.html"), "utf8").replace("/*@@CSS@@*/", () => css).replace("/*@@JS@@*/", () => js);
const out = join(root, "..", "dist", "omusico.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log("dist/omusico.html", (html.length / 1024).toFixed(1) + " KB");
