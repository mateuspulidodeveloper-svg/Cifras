// O Músico — gera o backup do Sketchware Pro (.swb) a partir do código-fonte.
//
// Estrutura de um .swb (ZIP):
//   project                     -> metadados do app (JSON criptografado)
//   data/file, view, library,   -> telas, componentes e bibliotecas (criptografados)
//   data/resource, data/logic   -> recursos e blocos de lógica (criptografados)
//   data/permission, proguard…  -> JSON simples
//   data/files/assets/…         -> Asset Manager (interface HTML)
//   data/files/java/…           -> Java Manager (classe ponte)
//   resources/icons/icon.png    -> ícone
// Criptografia do Sketchware: AES-128-CBC, PKCS5, chave = IV = "sketchwaresecure".
//
// Uso: node web/build.mjs && node tools/pack-swb.mjs  ->  dist/O-Musico.swb
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createCipheriv } from "node:crypto";
import { deflateRawSync, crc32 } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tpl = (p) => readFileSync(join(root, "tools/swb-template", p));
const KEY = Buffer.from("sketchwaresecure");
const enc = (buf) => { const c = createCipheriv("aes-128-cbc", KEY, KEY); return Buffer.concat([c.update(buf), c.final()]); };

const project = {
  custom_icon: true, sc_ver_code: "1", my_ws_name: "OMusico", color_accent: -34278, my_app_name: "O Músico", sc_ver_name: "1.0",
  sc_id: "603", color_primary: -15658476, color_control_highlight: -34278, color_control_normal: -7696491,
  my_sc_reg_dt: "20261112000000", sketchware_ver: 150, isIconAdaptive: false, my_sc_pkg_name: "com.omusico.app", color_primary_dark: -15658476
};

const code = readFileSync(join(root, "android/MainActivity_initializeLogic.java"), "utf8");
const block = JSON.parse(tpl("data/logic.template.json").toString("utf8"));
block.parameters = [code];
const logic = "@MainActivity.java_onCreate_initializeLogic\n" + JSON.stringify(block) + "\n";

const files = [
  ["project", enc(Buffer.from(JSON.stringify(project)))],
  ["data/file", enc(tpl("data/file"))],
  ["data/view", enc(tpl("data/view"))],
  ["data/library", enc(tpl("data/library"))],
  ["data/resource", enc(tpl("data/resource"))],
  ["data/logic", enc(Buffer.from(logic, "utf8"))],
  ["data/permission", tpl("data/permission")],
  ["data/project_config", tpl("data/project_config")],
  ["data/proguard", tpl("data/proguard")],
  ["data/proguard-rules.pro", tpl("data/proguard-rules.pro")],
  ["data/stringfog", tpl("data/stringfog")],
  ["data/custom_blocks", tpl("data/custom_blocks")],
  ["data/Injection/androidmanifest/attributes.json", tpl("data/Injection/androidmanifest/attributes.json")],
  ["data/Injection/androidmanifest/activities_components.json", tpl("data/Injection/androidmanifest/activities_components.json")],
  ["data/Injection/androidmanifest/app_components.txt", tpl("data/Injection/androidmanifest/app_components.txt")],
  ["data/files/assets/omusico.html", readFileSync(join(root, "dist/omusico.html"))],
  ["data/files/java/OMusicoPonte.java", readFileSync(join(root, "android/OMusicoPonte.java"))],
  ["resources/icons/icon.png", readFileSync(join(root, "android/res/icon.png"))],
  ["resources/images/.nomedia", Buffer.alloc(0)],
  ["resources/sounds/.nomedia", Buffer.alloc(0)],
  ["resources/fonts/.nomedia", Buffer.alloc(0)]
];

/* ---------- ZIP (deflate) ---------- */
function zip(entries) {
  const locals = [], centrals = [];
  let offset = 0;
  const DOS_TIME = 0, DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01, como no backup original
  for (const [name, data] of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const comp = deflateRawSync(data, { level: 9 });
    const crc = crc32(data) >>> 0;
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(DOS_TIME, 10); lh.writeUInt16LE(DOS_DATE, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(0x0314, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(DOS_TIME, 12); ch.writeUInt16LE(DOS_DATE, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt16LE(0, 30); ch.writeUInt16LE(0, 32); ch.writeUInt16LE(0, 34); ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE((0o600 << 16) >>> 0, 38); ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const out = join(root, "dist/O-Musico.swb");
mkdirSync(dirname(out), { recursive: true });
const z = zip(files);
writeFileSync(out, z);
console.log("dist/O-Musico.swb", (z.length / 1024).toFixed(1) + " KB,", files.length, "arquivos");
