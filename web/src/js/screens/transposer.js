/* O Músico — transpositor de tons, calculadora de capotraste e transposição para instrumentos */
(function (OM) {
  "use strict";
  var h = OM.u.h, ui = OM.ui, T = OM.theory;

  OM.screen("transposer", function () {
    var content = h("div.content");
    var bar = ui.topbar({ title: "Transpositor de tons", back: true });
    var el = h("section", bar, content);
    ui.scrollShadow(content, bar);
    var tab = "text", body = h("div");
    content.appendChild(ui.seg([{ v: "text", label: "Cifra / acordes" }, { v: "capo", label: "Capotraste" }, { v: "inst", label: "Instrumentos" }], tab, function (v) { tab = v; draw(); }));
    content.appendChild(body);
    var saved = OM.store.get("transpText", "");
    var semis = 0, from = "", to = "", src = "concert", dst = "trompete";

    function transposeText(text, s, fl) {
      return text.split("\n").map(function (line) {
        if (/\[[^\]]+\]/.test(line)) return line.replace(/\[([^\]]+)\]/g, function (m, c) { return "[" + (T.isChord(c) ? T.transposeChord(c, s, fl) : c) + "]"; });
        if (OM.chordpro.isChordLine(line)) {
          /* mantém o alinhamento das colunas */
          var out = "", re = /(\s*)(\S+)/g, mm, pad = 0;
          while ((mm = re.exec(line))) {
            var sp = mm[1].length - pad; if (sp < 1 && out) sp = 1; if (!out) sp = mm[1].length;
            var tok = mm[2], nt = T.isChord(tok.replace(/^\(|\)$/g, "")) ? T.transposeChord(tok, s, fl) : tok;
            out += " ".repeat(Math.max(0, sp)) + nt;
            pad = nt.length - tok.length;
          }
          return out;
        }
        return line;
      }).join("\n");
    }
    function draw() {
      OM.u.clear(body);
      if (tab === "text") {
        var ta = h("textarea.inp.code", { spellcheck: "false", placeholder: "Cole aqui uma cifra (acordes sobre a letra ou [C]ChordPro) ou só uma sequência de acordes:\n\nC  Am  F  G7", style: { minHeight: "180px" } });
        ta.value = saved;
        var out = h("div.out");
        var keyLbl = h("b");
        var detected = "";
        function upd() {
          saved = ta.value; OM.store.set("transpText", saved);
          var ch = OM.chordpro.chordsOf(OM.chordpro.parse(ta.value || ""));
          detected = ch.length ? ch[0].replace(/^([A-G][#b]?m?)(?!aj).*$/, "$1") : "";
          var target = detected ? T.transposeKey(detected, semis) : "";
          var fl = target ? T.keyUsesFlats(target) : semis < 0;
          keyLbl.textContent = (semis > 0 ? "+" : "") + semis + " semitons" + (detected ? " · " + detected + " → " + target : "");
          out.textContent = ta.value ? transposeText(ta.value, semis, fl) : "O resultado aparece aqui.";
        }
        ta.addEventListener("input", OM.u.debounce(upd, 150));
        body.appendChild(h("div", { style: { marginTop: "12px" } }, ta));
        body.appendChild(h("div", { style: { display: "flex", alignItems: "center", gap: "10px", margin: "12px 0" } },
          ui.btn("", "minus", function () { semis = Math.max(-11, semis - 1); upd(); }, "sm"), keyLbl, h("span", { style: { flex: 1 } }),
          ui.btn("", "plus", function () { semis = Math.min(11, semis + 1); upd(); }, "sm")));
        var keyRow = h("div.keyrow");
        T.ROOTS.forEach(function (r) { keyRow.appendChild(h("button", { text: T.display(r), onclick: function () {
          if (!detected) { ui.toast("Escreva acordes primeiro"); return; }
          var d = T.mod12(T.pc(r) - T.pc(detected)); semis = d > 6 ? d - 12 : d; upd();
        } })); });
        body.appendChild(h("div.lbl", { text: "Ir direto para o tom" }));
        body.appendChild(keyRow);
        body.appendChild(h("div.lbl", { text: "Resultado" }));
        body.appendChild(out);
        body.appendChild(h("div.btnrow", { style: { marginTop: "10px" } },
          ui.btn("Copiar/compartilhar", "share", function () { OM.bridge.share(out.textContent); }, "sm"),
          ui.btn("Salvar como cifra", "plus", function () { OM.router.push("editor", { importText: out.textContent }); }, "sm ghost")));
        upd();
      } else if (tab === "capo") {
        body.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "14px 0" }, text: "Escolha o tom em que a música deve soar. O app mostra em qual casa colocar o capotraste para tocar com formas mais fáceis." }));
        var ks = h("select.inp", T.KEYS.map(function (k) { return h("option", { value: k, text: k }); }), T.KEYS.map(function (k) { return h("option", { value: k + "m", text: k + "m" }); }));
        ks.value = from || "Bb";
        var res = h("div");
        function calc() {
          OM.u.clear(res);
          var key = ks.value, minor = /m$/.test(key), easy = minor ? ["Am", "Em", "Dm"] : ["C", "G", "D", "A", "E"];
          var rows = [];
          for (var capo = 0; capo <= 9; capo++) {
            var shape = T.transposeKey(key, -capo);
            if (easy.indexOf(shape) >= 0) rows.push({ capo: capo, shape: shape });
          }
          var l = h("div.list");
          rows.forEach(function (r) { l.appendChild(ui.item({ lead: h("span.keybadge", { text: r.capo || "0" }), title: r.capo ? "Capotraste na " + r.capo + "ª casa" : "Sem capotraste", sub: "Toque com as formas de " + r.shape, end: null })); });
          if (!rows.length) l.appendChild(h("div.empty", { text: "Nenhuma forma aberta comum para este tom." }));
          res.appendChild(l);
        }
        ks.onchange = function () { from = ks.value; calc(); };
        body.appendChild(h("label.field", h("span", { text: "Tom desejado (som real)" }), ks));
        body.appendChild(res);
        calc();
      } else {
        body.appendChild(h("p.muted", { style: { fontSize: "13.5px", margin: "14px 0" }, text: "Converta tons entre instrumentos transpositores (sax, trompete, clarinete, trompa…) e instrumentos em Dó." }));
        var winds = [{ id: "concert", n: "Som real (Dó / concerto)", transp: 0 }].concat(OM.inst.LIST.filter(function (i) { return i.kind === "wind" && i.transp % 12; }));
        var mk = function (v) { var s = h("select.inp", winds.map(function (w) { return h("option", { value: w.id, text: w.n }); })); s.value = v; return s; };
        var s1 = mk(src), s2 = mk(dst);
        var kin = h("select.inp", T.KEYS.map(function (k) { return h("option", { value: k, text: k }); }), T.KEYS.map(function (k) { return h("option", { value: k + "m", text: k + "m" }); }));
        kin.value = to || "C";
        var r2 = h("div.card", { style: { textAlign: "center", marginTop: "6px" } });
        function tr(id) { var w = winds.filter(function (x) { return x.id === id; })[0]; return w ? w.transp || 0 : 0; }
        function calc2() {
          src = s1.value; dst = s2.value; to = kin.value;
          /* escrito -> som real: + transp; som real -> escrito no destino: - transp */
          var s = tr(src) - tr(dst);
          var k = T.transposeKey(kin.value, s);
          OM.u.clear(r2);
          r2.appendChild(h("div.muted", { text: "Escrito para " + winds.filter(function (x) { return x.id === dst; })[0].n }));
          r2.appendChild(h("div", { style: { fontSize: "42px", fontWeight: 800, color: "var(--chord)" }, text: k }));
          r2.appendChild(h("div.dim", { style: { fontSize: "13px" }, text: (s ? (s > 0 ? "+" : "") + s + " semitons" : "Mesmo tom") }));
        }
        [s1, s2, kin].forEach(function (x) { x.onchange = calc2; });
        body.appendChild(h("label.field", h("span", { text: "Tom escrito para" }), s1));
        body.appendChild(h("label.field", h("span", { text: "Tom" }), kin));
        body.appendChild(h("label.field", h("span", { text: "Converter para" }), s2));
        body.appendChild(r2);
        calc2();
      }
    }
    draw();
    return { el: el };
  });
})(window.OM);
