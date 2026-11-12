/* O Músico — editor de cifras (nova, importada ou versão pessoal de uma cifra do acervo) */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, L = OM.lib, T = OM.theory;

  OM.screen("editor", function (p) {
    var base = p.id ? L.get(p.id) : null;
    var isNew = !base;
    var data = base ? Object.assign({}, base) : { title: p.title || p.fileName || "", artist: "", album: "", key: "", capo: 0, bpm: 0, time: "4/4", difficulty: 2, genre: "", body: p.importText || "" };
    if (p.importText) {
      var pm = OM.chordpro.parse(p.importText).meta;
      ["title", "artist", "album", "key", "capo", "bpm", "time"].forEach(function (k) { if (pm[k]) data[k] = pm[k]; });
    }
    var content = h("div.content");
    var saveBtn = ui.btn("Salvar", "check", save, "pri sm");
    var bar = ui.topbar({ title: isNew ? "Nova cifra" : base.user ? "Editar cifra" : "Versão pessoal", back: true, actions: [saveBtn, h("span", { style: { width: "8px" } })] });
    var el = h("section", bar, content);
    var dirty = false;

    function field(label, inp) { inp.addEventListener("input", function () { dirty = true; }); return h("label.field", h("span", { text: label }), inp); }
    var fTitle = h("input.inp", { type: "text", value: data.title, maxlength: 120, placeholder: "Nome da música" });
    var fArtist = h("input.inp", { type: "text", value: data.artist, maxlength: 120, placeholder: "Artista / compositor" });
    var fAlbum = h("input.inp", { type: "text", value: data.album || "", maxlength: 120, placeholder: "Opcional" });
    var fGenre = h("input.inp", { type: "text", value: data.genre || "", maxlength: 40, placeholder: "Ex.: MPB, Rock, Sertanejo" });
    var fKey = h("select.inp", h("option", { value: "", text: "Detectar automaticamente" }),
      T.KEYS.map(function (k) { return h("option", { value: k, text: k + " (maior)" }); }), T.KEYS.map(function (k) { return h("option", { value: k + "m", text: k + "m (menor)" }); }));
    fKey.value = data.key || "";
    var fCapo = h("select.inp", Array.from({ length: 12 }, function (_, i) { return h("option", { value: i, text: i ? i + "ª casa" : "Sem capotraste" }); }));
    fCapo.value = data.capo || 0;
    var fBpm = h("input.inp", { type: "number", min: 20, max: 300, value: data.bpm || "", placeholder: "Ex.: 90" });
    var fTime = h("select.inp", ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"].map(function (t) { return h("option", { value: t, text: t }); }));
    fTime.value = data.time || "4/4";
    var fDiff = h("select.inp", [1, 2, 3, 4, 5].map(function (d) { return h("option", { value: d, text: d + " — " + ["", "Iniciante", "Básico", "Intermediário", "Avançado", "Profissional"][d] }); }));
    fDiff.value = data.difficulty || 2;
    var fBody = h("textarea.inp.code", { spellcheck: "false", placeholder: "Cole ou escreva a cifra aqui.\n\nFormato 1 — acordes sobre a letra:\n  G          D\n  Exemplo de letra aqui\n\nFormato 2 — ChordPro:\n  [G]Exemplo de [D]letra aqui\n\nUse [Refrão] ou {c: Refrão} para seções e {sot}…{eot} para tablaturas." });
    fBody.value = data.body || "";
    [fKey, fCapo, fTime, fDiff].forEach(function (s) { s.addEventListener("change", function () { dirty = true; }); });

    var two = function (a, b) { return h("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } }, a, b); };
    content.appendChild(field("Título", fTitle));
    content.appendChild(field("Artista", fArtist));
    content.appendChild(two(field("Tom", fKey), field("Capotraste", fCapo)));
    content.appendChild(two(field("Andamento (BPM)", fBpm), field("Compasso", fTime)));
    content.appendChild(two(field("Dificuldade", fDiff), field("Gênero", fGenre)));
    content.appendChild(field("Álbum", fAlbum));
    var tools = h("div.btnrow", { style: { marginBottom: "10px" } },
      ui.btn("Importar arquivo", "upload", importFile, "sm ghost"),
      ui.btn("Pré-visualizar", "eye", preview, "sm ghost"),
      ui.btn("Converter p/ ChordPro", "swap", function () { fBody.value = OM.chordpro.fromPlain(fBody.value); dirty = true; ui.toast("Convertido"); }, "sm ghost"));
    content.appendChild(h("label.field", h("span", { text: "Cifra" }), fBody));
    fBody.addEventListener("input", function () { dirty = true; });
    content.appendChild(tools);
    content.appendChild(ui.notice("Acordes reconhecidos: maiores, menores, sétimas (7, 7M, m7), diminutos (°), aumentados, sus, add9, inversões (C/E) e extensões como 7(9) e m7(b5). Depois de salvar, a cifra pode ser transposta e exibida em qualquer instrumento."));
    if (!isNew && !base.user) content.appendChild(h("div", { style: { marginTop: "10px" } }, ui.notice("Você está criando uma versão pessoal desta cifra. A original pode ser restaurada a qualquer momento pelo menu ⋮.")));

    function importFile() {
      var f = h("input", { type: "file", accept: ".txt,.cho,.chordpro,.chopro,.pro,.crd,text/plain" });
      f.onchange = function () {
        var file = f.files[0]; if (!file) return;
        var r = new FileReader();
        r.onload = function () {
          fBody.value = String(r.result); dirty = true;
          var m = OM.chordpro.parse(fBody.value).meta;
          if (m.title && !fTitle.value) fTitle.value = m.title;
          if (m.artist && !fArtist.value) fArtist.value = m.artist;
          if (!fTitle.value) fTitle.value = file.name.replace(/\.[^.]+$/, "");
          ui.toast("Arquivo importado");
        };
        r.readAsText(file);
      };
      f.click();
    }
    function guessKey(body) {
      var ch = OM.chordpro.chordsOf(OM.chordpro.parse(body));
      if (!ch.length) return "";
      /* pontua cada tonalidade pela presença dos acordes no campo harmônico; o último acorde pesa mais */
      var best = "", bestSc = -1;
      T.ROOTS.forEach(function (r) {
        [["", [0, 2, 4, 5, 7, 9, 11], ["", "m", "m", "", "", "m", "°"]], ["m", [0, 2, 3, 5, 7, 8, 10], ["m", "°", "", "m", "m", "", ""]]].forEach(function (mode) {
          var sc = 0, rp = T.pc(r);
          ch.forEach(function (c, i) {
            var p = T.parseChord(c); if (!p) return;
            var deg = mode[1].indexOf(T.mod12(p.rootPc - rp));
            var minor = /^m(?!aj)/.test(p.suffix) && !/^m7\(b5\)/.test(p.suffix);
            if (deg >= 0) { var q = mode[2][deg]; sc += (q === "m") === minor ? 2 : 0.5; if (deg === 0) sc += 1.5; }
            if (deg === 4 && mode[0] === "m" && !minor) sc += 1.5; /* V maior em menor harmônica */
            if (i === 0 && deg === 0) sc += 1; if (i === ch.length - 1 && deg === 0) sc += 1;
          });
          if (sc > bestSc) { bestSc = sc; best = (T.keyUsesFlats(r + mode[0]) ? T.FLAT[rp] : T.SHARP[rp]) + mode[0]; }
        });
      });
      return best;
    }
    function collect() {
      var body = fBody.value.replace(/\r/g, "");
      return {
        title: fTitle.value.trim(), artist: fArtist.value.trim() || "Desconhecido", album: fAlbum.value.trim(), genre: fGenre.value.trim(),
        key: fKey.value || guessKey(body), capo: +fCapo.value || 0, bpm: Math.max(0, Math.min(300, +fBpm.value || 0)) || 0, time: fTime.value,
        difficulty: +fDiff.value || 2, body: body
      };
    }
    function preview() {
      var d = collect(), parsed = OM.chordpro.parse(d.body), box = h("div.sheetmusic", { style: { fontSize: "15px" } });
      var n = 0;
      (function walk(bl, parent) {
        bl.forEach(function (b) {
          if (b.type === "chorus") { var c = h("div.chorus"); parent.appendChild(c); walk(b.lines, c); }
          else if (b.type === "comment") parent.appendChild(h("div.sl.cmt", { text: b.text }));
          else if (b.type === "tab") parent.appendChild(h("pre.tabblock", { text: b.text.join("\n") }));
          else if (b.type === "blank") parent.appendChild(h("div.sl.blank"));
          else { var l = h("div.sl"); b.segs.forEach(function (s) { if (s.c) n++; l.appendChild(h("span.seg-c", h("span.c", { text: s.c }), h("span.l", { text: s.l }))); }); parent.appendChild(l); }
        });
      })(parsed.blocks, box);
      ui.sheet({ title: "Pré-visualização", content: h("div", h("p.muted", { style: { fontSize: "13px", marginBottom: "10px" }, text: n + " acordes reconhecidos · tom " + (d.key || "?") }), box) });
    }
    function save() {
      var d = collect();
      if (!d.title) { ui.toast("Informe o título"); fTitle.focus(); return; }
      if (!d.body.trim()) { ui.toast("A cifra está vazia"); fBody.focus(); return; }
      var id;
      if (isNew) { id = OM.u.uid("u"); L.saveUserSong(Object.assign({ id: id, created: Date.now() }, d)); }
      else if (base.user) { id = base.id; L.saveUserSong(Object.assign({}, base, d, { id: id, updated: Date.now() })); }
      else { id = base.id; L.saveEdit(id, d); }
      dirty = false;
      ui.toast("Cifra salva");
      OM.router.replace("song", { id: id });
    }
    return {
      el: el,
      onBack: function () {
        if (!dirty) return false;
        ui.confirm("Sair sem salvar as alterações?", "Descartar", true).then(function (ok) { if (ok) { dirty = false; OM.router.back(); } });
        return true;
      }
    };
  });
})(window.OM);
