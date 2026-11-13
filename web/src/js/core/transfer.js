/* O Músico — importação e exportação de músicas em JSON e guia do formato para IAs.
   Formato "omusico-cifras" (versão 1):
   { "formato": "omusico-cifras", "versao": 1, "repertorio": "opcional", "musicas": [ { "titulo", "artista", "cifra", ... } ] }
   Também aceita: uma música sozinha, uma lista de músicas e campos em inglês (title, artist, body…). */
(function (OM) {
  "use strict";
  var L = OM.lib, T = OM.theory, u = OM.u;
  var FORMAT = "omusico-cifras", VERSION = 1;

  function pickField(o, names) {
    for (var i = 0; i < names.length; i++) if (o[names[i]] != null && o[names[i]] !== "") return o[names[i]];
    return null;
  }
  function str(v) {
    if (v == null) return "";
    if (Array.isArray(v)) return v.map(str).join("\n");
    return String(v);
  }
  /* converte um objeto qualquer (pt/en) em música do app; lança erro descritivo */
  function normalize(o) {
    if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("item não é um objeto JSON");
    var title = str(pickField(o, ["titulo", "título", "title", "nome", "name", "musica", "música"])).trim();
    var body = pickField(o, ["cifra", "body", "chordpro", "letra", "conteudo", "conteúdo", "content", "lyrics", "chords", "texto", "text"]);
    if (body && typeof body === "object" && !Array.isArray(body)) throw new Error("“cifra” deve ser texto ou lista de linhas");
    body = str(body).replace(/\r/g, "").replace(/\t/g, "    ");
    if (!title) {
      var meta = OM.chordpro.parse(body).meta;
      title = meta.title || "";
    }
    if (!title) throw new Error("falta o campo “titulo”");
    if (!body.trim()) throw new Error("falta o campo “cifra” (letra com acordes)");
    var parsed = OM.chordpro.parse(body), meta2 = parsed.meta;
    var chords = OM.chordpro.chordsOf(parsed);
    var key = str(pickField(o, ["tom", "key", "tonalidade"]) || meta2.key || "").trim();
    if (key && !T.parseChord(key)) key = "";
    var diff = +pickField(o, ["dificuldade", "difficulty", "nivel", "nível", "level"]) || 2;
    var time = str(pickField(o, ["compasso", "time", "time_signature", "metrica"]) || meta2.time || "4/4").trim();
    if (!/^\d{1,2}\/(2|4|8|16)$/.test(time)) time = "4/4";
    var song = {
      title: title.slice(0, 120),
      artist: str(pickField(o, ["artista", "artist", "autor", "author", "compositor", "composer", "interprete", "intérprete"]) || meta2.artist || "Desconhecido").trim().slice(0, 120),
      album: str(pickField(o, ["album", "álbum"]) || meta2.album || "").trim().slice(0, 120),
      genre: str(pickField(o, ["genero", "gênero", "genre", "estilo", "style"]) || "").trim().slice(0, 40),
      key: key || OM.chordpro.guessKey(body),
      capo: Math.max(0, Math.min(11, +pickField(o, ["capotraste", "capo"]) || meta2.capo || 0)),
      bpm: Math.max(0, Math.min(300, Math.round(+pickField(o, ["bpm", "andamento", "tempo"]) || meta2.bpm || 0))),
      time: time,
      difficulty: Math.max(1, Math.min(5, Math.round(diff))),
      body: body
    };
    var mel = pickField(o, ["melodia", "melody", "partitura"]);
    if (mel && typeof mel === "object") {
      var notes = str(pickField(mel, ["notas", "notes"]));
      if (notes && OM.staff.parseMelody(notes).filter(function (n) { return !n.bar; }).length) {
        song.melody = { clef: /bass|fa|fá/i.test(str(pickField(mel, ["clave", "clef"]))) ? "bass" : "treble", key: str(pickField(mel, ["tom", "key"]) || song.key || "C").replace(/m$/, "") || "C",
          time: str(pickField(mel, ["compasso", "time"]) || song.time), label: str(pickField(mel, ["rotulo", "rótulo", "label", "titulo"]) || "Melodia"), notes: notes };
      }
    }
    var note = str(pickField(o, ["anotacoes", "anotações", "observacoes", "observações", "notas_pessoais", "comments"])).trim();
    return { song: song, note: note, chordCount: chords.length };
  }

  /* lê o texto de um arquivo JSON -> {items:[{song, note}], errors:[{i, title, msg}], repertoire} */
  function parse(text) {
    var data;
    try { data = JSON.parse(String(text).replace(/^﻿/, "")); }
    catch (e) {
      /* tolera blocos de código vindos de IAs (```json … ```) */
      var m = /```(?:json)?\s*([\s\S]*?)```/.exec(String(text));
      if (!m) throw new Error("O arquivo não é um JSON válido: " + e.message);
      data = JSON.parse(m[1]);
    }
    if (data && data.app === "O Músico" && data.data) throw new Error("Este arquivo é um backup completo do app. Use Perfil › Configurações › Restaurar.");
    var list, repertoire = null;
    if (Array.isArray(data)) list = data;
    else if (data && (Array.isArray(data.musicas) || Array.isArray(data.songs) || Array.isArray(data.músicas))) { list = data.musicas || data.músicas || data.songs; repertoire = data.repertorio || data.repertório || data.setlist || null; }
    else if (data && typeof data === "object") list = [data];
    else throw new Error("Formato não reconhecido");
    var items = [], errors = [];
    list.forEach(function (o, i) {
      try { items.push(normalize(o)); }
      catch (e) { errors.push({ i: i + 1, title: o && (o.titulo || o.title) || "", msg: e.message }); }
    });
    return { items: items, errors: errors, repertoire: repertoire ? String(repertoire).slice(0, 80) : null };
  }

  /* grava no app: atualiza cifra do usuário com mesmo título+artista ou cria nova */
  function importItems(items, repertoireName) {
    var created = 0, updated = 0, ids = [];
    var mine = L.all().filter(function (s) { return s.user; });
    items.forEach(function (it) {
      var k = u.norm(it.song.title + "|" + it.song.artist);
      var ex = mine.filter(function (s) { return u.norm(s.title + "|" + s.artist) === k; })[0];
      var id;
      if (ex) { id = ex.id; L.saveUserSong(Object.assign({}, ex, it.song, { id: id, updated: Date.now(), imported: true })); updated++; }
      else { id = u.uid("u"); L.saveUserSong(Object.assign({ id: id, created: Date.now(), imported: true }, it.song)); created++; }
      if (it.note) L.setNote(id, it.note);
      ids.push(id);
    });
    var list = null;
    if (repertoireName && ids.length) { list = L.createList(repertoireName); list.songs = ids.slice(); L.saveList(list); }
    return { created: created, updated: updated, ids: ids, list: list };
  }

  /* ---------- exportação ---------- */
  function songToJson(s) {
    var o = { titulo: s.title, artista: s.artist };
    if (s.album) o.album = s.album;
    if (s.genre) o.genero = s.genre;
    if (s.key) o.tom = s.key;
    if (s.capo) o.capotraste = s.capo;
    if (s.bpm) o.bpm = s.bpm;
    if (s.time) o.compasso = s.time;
    o.dificuldade = s.difficulty || 2;
    o.cifra = s.body;
    if (s.melody) o.melodia = { clave: s.melody.clef === "bass" ? "fa" : "sol", tom: s.melody.key, compasso: s.melody.time, rotulo: s.melody.label, notas: s.melody.notes };
    var n = L.note(s.id); if (n) o.anotacoes = n;
    return o;
  }
  function exportJson(ids, repertoire) {
    var o = { formato: FORMAT, versao: VERSION, gerado_por: "O Músico", data: new Date().toISOString() };
    if (repertoire) o.repertorio = repertoire;
    o.musicas = ids.map(L.get).filter(Boolean).map(songToJson);
    return JSON.stringify(o, null, 2);
  }
  function fileName(base) { return (u.norm(base || "musicas").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "musicas") + ".omusico.json"; }
  function exportFile(ids, name, repertoire) {
    if (!ids.length) { OM.ui.toast("Nenhuma música para exportar"); return; }
    var blob = new Blob([exportJson(ids, repertoire)], { type: "application/json" });
    OM.bridge.saveFile(fileName(name), "application/json", blob).then(function (p) { OM.ui.toast(p ? "Exportado para " + p : "Não foi possível salvar o arquivo", 3500); });
  }

  /* ---------- guia do formato para IAs ---------- */
  function guide() {
    var ex = ["amazing-grace", "ciranda"].map(L.get).filter(Boolean).map(songToJson);
    return {
      "guia": "O Músico — formato de importação de cifras (omusico-cifras v1)",
      "para_quem": "Este arquivo explica a uma IA (ou a uma pessoa) como montar um arquivo JSON que o app O Músico importa. Envie este guia para a IA junto com o pedido.",
      "instrucoes_para_ia": [
        "Responda SOMENTE com um JSON válido (UTF-8), sem comentários e sem texto fora do JSON.",
        "Use a estrutura de “estrutura_do_arquivo”: um objeto com \"formato\": \"omusico-cifras\", \"versao\": 1 e a lista \"musicas\".",
        "Cada música precisa de \"titulo\" e \"cifra\". Os outros campos são opcionais, mas preencha tom, bpm e compasso quando souber.",
        "No campo \"cifra\", escreva a letra com os acordes entre colchetes imediatamente antes da sílaba em que mudam (formato ChordPro), por exemplo: \"[G]Asa [D]branca\". Quebras de linha são \\n dentro da string, ou use uma lista de linhas.",
        "Marque seções com {c: Nome da seção} (Intro, Verso, Refrão, Ponte, Solo, Final). Refrões podem ficar entre {soc} e {eoc}. Tablaturas ficam entre {sot} e {eot}.",
        "Use só a notação de acordes listada em “notacao_de_acordes”. Não invente símbolos.",
        "Se a música tiver direitos autorais, só inclua a letra se o usuário tiver o direito de usá-la (por exemplo, composição própria ou domínio público). Caso contrário, envie apenas a sequência de acordes por seção.",
        "O tom deve ser o tom real da gravação ou da composição; se usar capotraste, informe \"capotraste\" e escreva os acordes no tom real (o app calcula as formas)."
      ],
      "estrutura_do_arquivo": {
        "formato": "\"omusico-cifras\" (obrigatório para identificar o arquivo)",
        "versao": "1",
        "repertorio": "texto opcional — se presente, o app cria um repertório com todas as músicas importadas, na ordem do arquivo",
        "musicas": "lista de objetos música (ver “campos_da_musica”). Também é aceito um único objeto música ou uma lista sem o envelope."
      },
      "campos_da_musica": {
        "titulo": { "tipo": "texto", "obrigatorio": true, "exemplo": "Minha Canção" },
        "artista": { "tipo": "texto", "obrigatorio": false, "exemplo": "Nome do artista ou compositor" },
        "album": { "tipo": "texto", "obrigatorio": false },
        "genero": { "tipo": "texto", "obrigatorio": false, "exemplo": "MPB, Rock, Sertanejo, Gospel, Samba…" },
        "tom": { "tipo": "texto", "obrigatorio": false, "exemplo": "G, Am, Bb, F#m", "observacao": "Se ausente, o app estima o tom pelos acordes." },
        "capotraste": { "tipo": "inteiro 0–11", "obrigatorio": false },
        "bpm": { "tipo": "inteiro 20–300", "obrigatorio": false, "observacao": "Usado no metrônomo e no modo prática." },
        "compasso": { "tipo": "texto", "obrigatorio": false, "valores": ["2/4", "3/4", "4/4", "5/4", "6/8", "7/8", "9/8", "12/8"], "padrao": "4/4" },
        "dificuldade": { "tipo": "inteiro 1–5", "obrigatorio": false, "significado": "1 iniciante, 2 básico, 3 intermediário, 4 avançado, 5 profissional" },
        "cifra": { "tipo": "texto (ou lista de linhas)", "obrigatorio": true, "observacao": "Letra com acordes em ChordPro, ou no formato de acordes em uma linha e letra na linha de baixo (o app converte sozinho)." },
        "melodia": { "tipo": "objeto", "obrigatorio": false, "campos": { "clave": "\"sol\" ou \"fa\"", "tom": "armadura, ex.: \"G\"", "compasso": "\"4/4\"", "rotulo": "título exibido", "notas": "sequência de notas (ver “formato_da_melodia”)" } },
        "anotacoes": { "tipo": "texto", "obrigatorio": false, "observacao": "Vira a anotação pessoal da música (dicas de batida, dedilhado, dinâmica)." }
      },
      "nomes_alternativos_aceitos": { "titulo": ["title", "nome"], "artista": ["artist", "autor", "compositor"], "cifra": ["body", "chordpro", "letra", "conteudo"], "tom": ["key"], "compasso": ["time"], "dificuldade": ["difficulty", "nivel"], "genero": ["genre", "estilo"] },
      "formatos_de_cifra": {
        "chordpro_recomendado": {
          "acordes": "[C]Letra com [G]acordes — o acorde fica antes da sílaba onde muda",
          "linha_so_de_acordes": "[C] | [G] | [Am] | [F] |",
          "secao": "{c: Refrão}  ou uma linha só com [Refrão]",
          "refrao": "{soc} … linhas do refrão … {eoc}",
          "tablatura": "{sot}\ne|---0---3---|\nB|---1---0---|\n{eot}",
          "metadados_opcionais_no_texto": "{title: …} {artist: …} {key: …} {tempo: …} {time: …} {capo: …}"
        },
        "acordes_sobre_a_letra": {
          "descricao": "Uma linha só com acordes alinhados por espaços, seguida da linha da letra. O app detecta e converte.",
          "exemplo": "G          D\nAsa branca no céu\nEm       C\nVoando pelo sertão"
        }
      },
      "notacao_de_acordes": {
        "fundamentais": "C D E F G A B, com # (sustenido) ou b (bemol): C#, Db, F#, Bb…",
        "tipos_reconhecidos": {
          "": "maior (C)", "m": "menor (Cm)", "7": "sétima dominante (C7)", "7M ou maj7": "sétima maior (C7M)", "m7": "menor com sétima (Cm7)",
          "m7M": "menor com sétima maior", "° ou dim": "diminuto (C°)", "°7": "diminuto com sétima", "m7(b5)": "meio-diminuto",
          "aug ou +": "aumentado (C+)", "sus2 / sus4 / 4": "suspensos (Csus4 = C4)", "7/4 ou 7sus4": "sétima com quarta",
          "6, m6, 6(9)": "com sexta", "add9 ou (9)": "com nona adicionada", "9, 7(9), m7(9), 7M(9)": "com nona",
          "7(b9), 7(#9), 7(13), 7(b13), 11, m7(11), 13": "outras tensões", "5": "power chord (C5)"
        },
        "inversoes": "Barra seguida da nota do baixo: C/E, D/F#, G/B",
        "evitar": "Não use nomes por extenso (\"Dó maior\"), graus romanos ou símbolos fora desta lista dentro dos colchetes."
      },
      "formato_da_melodia": {
        "descricao": "Notas separadas por espaço; \"|\" separa compassos. Cada nota = nome + oitava + duração. Pausa = R + duração.",
        "duracoes": { "w": "semibreve (4 tempos)", "h": "mínima (2)", "q": "semínima (1)", "e": "colcheia (1/2)", "s": "semicolcheia (1/4)", ".": "depois da duração = pontuada (×1,5)" },
        "oitavas": "C4 é o Dó central; A4 = Lá 440 Hz",
        "exemplo": "E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | E4q. D4e D4h"
      },
      "exemplo_completo": { "formato": FORMAT, "versao": VERSION, "repertorio": "Exemplo de repertório", "musicas": ex },
      "prompt_sugerido": "Usando o guia JSON em anexo do app O Músico, crie um arquivo no formato omusico-cifras com a música <NOME DA MÚSICA / sua composição>, com tom, bpm, compasso, seções marcadas e acordes em ChordPro. Responda apenas com o JSON.",
      "como_importar": "No app: Cifras › botão Importar › Arquivo JSON (ou cole o JSON no campo de texto). O app mostra uma prévia e informa os erros de cada música."
    };
  }
  function guideText() { return JSON.stringify(guide(), null, 2); }
  function exportGuide() {
    var blob = new Blob([guideText()], { type: "application/json" });
    OM.bridge.saveFile("o-musico-guia-para-ia.json", "application/json", blob).then(function (p) { OM.ui.toast(p ? "Guia salvo em " + p : "Não foi possível salvar o arquivo", 3500); });
  }
  /* exemplo pronto (modelo para preencher) */
  function exportTemplate() {
    var o = { formato: FORMAT, versao: VERSION, repertorio: "Meu repertório", musicas: [{ titulo: "Nome da música", artista: "Artista", tom: "G", bpm: 90, compasso: "4/4", dificuldade: 2, genero: "Pop",
      cifra: "{c: Intro}\n[G] | [D] | [Em] | [C] |\n\n{c: Verso}\n[G]Primeira linha da [D]letra\n[Em]Segunda linha da [C]letra\n\n{soc}\n[C]Refrão com [D]acordes [G]aqui\n{eoc}",
      anotacoes: "Batida: baixo, cima-baixo, cima." }] };
    var blob = new Blob([JSON.stringify(o, null, 2)], { type: "application/json" });
    OM.bridge.saveFile("modelo.omusico.json", "application/json", blob).then(function (p) { OM.ui.toast(p ? "Modelo salvo em " + p : "Não foi possível salvar", 3500); });
  }

  OM.transfer = { FORMAT: FORMAT, parse: parse, normalize: normalize, importItems: importItems, exportJson: exportJson, exportFile: exportFile,
    guide: guide, guideText: guideText, exportGuide: exportGuide, exportTemplate: exportTemplate, songToJson: songToJson };
})(window.OM);
