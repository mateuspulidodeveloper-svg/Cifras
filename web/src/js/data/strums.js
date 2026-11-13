/* O Músico — batidas e dedilhados para acompanhamento.
   Cada caractere é um passo (spb = passos por tempo; beats = tempos do padrão):
   D batida para baixo · d para baixo leve · U para cima · u para cima leve
   x abafada (percussiva) · k acorde curto (staccato) · B baixo (fundamental) · b baixo alternado (quinta)
   i m a cordas agudas (3ª, 2ª, 1ª) · C pinça i+m+a · P baixo + pinça · . pausa/sustenta */
(function (OM) {
  "use strict";
  OM.STRUMS = [
    { id: "pop", cat: "Básicas", n: "Pop", hint: "↓  ↓↑  ↑↓↑", beats: 4, spb: 2, p: "D.DU.UDU", d: "A batida mais usada no pop, rock acústico e gospel." },
    { id: "basica", cat: "Básicas", n: "Iniciante (↓ ↓ ↓ ↓)", beats: 4, spb: 1, p: "DDDD", d: "Uma batida por tempo. Ideal para os primeiros acordes." },
    { id: "rock8", cat: "Básicas", n: "Rock em colcheias", beats: 4, spb: 2, p: "DdDdDdDd", d: "Tudo para baixo, com acento nos tempos." },
    { id: "balada", cat: "Básicas", n: "Balada (baixo + batida)", beats: 4, spb: 2, p: "B.DUb.DU", d: "Polegar no baixo e batida curta. Ótima para músicas lentas." },
    { id: "valsa", cat: "Básicas", n: "Valsa / 3 por 4", beats: 3, spb: 2, p: "B.DUDU", d: "Baixo no 1 e batidas no 2 e no 3." },
    { id: "rancheira", cat: "Básicas", n: "Rancheira / guarânia (3/4)", beats: 3, spb: 2, p: "B.D.D.", d: "Baixo forte e dois acordes." },
    { id: "funk", cat: "Básicas", n: "Funk / soul (semicolcheias)", beats: 4, spb: 4, p: "D.xU.UxUD.xU.UxU", d: "Mão sempre em movimento; as abafadas dão o groove." },
    { id: "shuffle", cat: "Básicas", n: "Blues shuffle", beats: 4, spb: 3, p: "D.uD.uD.uD.u", d: "Colcheias em tercina (swing)." },
    { id: "reggae", cat: "Básicas", n: "Reggae", beats: 4, spb: 2, p: "..k...k.", d: "Acorde curto nos tempos 2 e 4; deixe o resto em silêncio." },
    { id: "ska", cat: "Básicas", n: "Ska / contratempo", beats: 4, spb: 2, p: ".k.k.k.k", d: "Acorde curto em todos os contratempos." },
    { id: "sertanejo", cat: "Brasileiras", n: "Sertanejo", beats: 4, spb: 2, p: "B.xUb.xU", d: "Baixo, abafa e sobe. Base de muitas modas e do sertanejo." },
    { id: "samba", cat: "Brasileiras", n: "Samba (violão)", beats: 2, spb: 4, p: "B.DUb.DU", d: "Baixos alternados (1 e 2) com batida sincopada." },
    { id: "pagode", cat: "Brasileiras", n: "Pagode / cavaco", beats: 2, spb: 4, p: "D.uDu.Du", d: "Levada de cavaquinho em semicolcheias." },
    { id: "bossa", cat: "Brasileiras", n: "Bossa nova", beats: 4, spb: 4, p: "P..Cb.C.B.C.bC..", d: "Polegar nos baixos, dedos sincopados. Toque com os dedos." },
    { id: "baiao", cat: "Brasileiras", n: "Baião", beats: 2, spb: 4, p: "B..bD.U.", d: "O baixo do baião (pontuado) e batida no contratempo." },
    { id: "xote", cat: "Brasileiras", n: "Xote", beats: 4, spb: 2, p: "B.D.b.DU", d: "Dois tempos com baixo e batida." },
    { id: "arpejo", cat: "Dedilhados", n: "Arpejo P-i-m-a", beats: 4, spb: 2, p: "Bimabima", d: "Polegar no baixo, depois indicador, médio e anelar." },
    { id: "arpejo2", cat: "Dedilhados", n: "Arpejo P-i-m-a-m-i", beats: 3, spb: 2, p: "Bimami", d: "Arpejo de ida e volta, ótimo em 3/4." },
    { id: "travis", cat: "Dedilhados", n: "Travis picking (country/folk)", beats: 4, spb: 2, p: "BmbiBmbi", d: "Baixo alternado constante com dedos intercalados." },
    { id: "arpejo68", cat: "Dedilhados", n: "Arpejo 6/8", beats: 2, spb: 3, p: "Bimaim", d: "Para baladas e músicas em 6/8 (dois pulsos de três)." },
    { id: "pinca", cat: "Dedilhados", n: "Baixo e pinça", beats: 4, spb: 2, p: "P.b.P.b.", d: "Polegar e dedos juntos, alternando o baixo." }
  ];
  /* sugere uma batida pelo gênero e compasso da música */
  OM.suggestStrum = function (song) {
    var g = OM.u.norm((song && song.genre) || ""), t = (song && song.time) || "4/4";
    var map = [["bossa", "bossa"], ["samba", "samba"], ["pagode", "pagode"], ["baiao", "baiao"], ["forro", "baiao"], ["xote", "xote"], ["sertanejo", "sertanejo"], ["caipira", "sertanejo"],
      ["reggae", "reggae"], ["ska", "ska"], ["blues", "shuffle"], ["funk", "funk"], ["soul", "funk"], ["valsa", "valsa"], ["country", "travis"], ["folk", "arpejo"], ["erudito", "arpejo"], ["infantil", "basica"], ["cantiga", "basica"], ["natal", "arpejo2"]];
    for (var i = 0; i < map.length; i++) if (g.indexOf(map[i][0]) >= 0) return map[i][1];
    if (/^3\//.test(t)) return "valsa";
    if (/^6\/8/.test(t) || /^12\/8/.test(t)) return "arpejo68";
    if (/^2\//.test(t)) return "samba";
    return "pop";
  };
  /* ritmo de bateria que combina com cada batida */
  var GROOVE_OF = { pop: "pop", basica: "rock", rock8: "rock", balada: "balada", valsa: "valsa", rancheira: "guarania", funk: "funk", shuffle: "shuffle", reggae: "reggae", ska: "reggae",
    sertanejo: "sertanejo", samba: "samba", pagode: "pagode", bossa: "bossa", baiao: "baiao", xote: "xote", arpejo: "balada", arpejo2: "valsa", travis: "country", arpejo68: "gospel68", pinca: "balada" };
  OM.grooveFor = function (strumId) { var id = GROOVE_OF[strumId]; return OM.GROOVES.filter(function (g) { return g.id === id; })[0] || null; };
  OM.getStrum = function (id) { return OM.STRUMS.filter(function (s) { return s.id === id; })[0] || null; };
})(window.OM);
