/* O Músico — acervo inicial: canções de domínio público / folclore e estudos originais.
   Cifras em ChordPro. Novas cifras do usuário ficam no armazenamento local. */
(function (OM) {
  "use strict";
  OM.SONGS = [
    {
      id: "amazing-grace", title: "Amazing Grace", artist: "John Newton (hino tradicional)", album: "Domínio público", genre: "Gospel",
      key: "G", bpm: 80, time: "3/4", difficulty: 1,
      melody: { clef: "treble", key: "G", time: "3/4", label: "Melodia — 1ª frase", notes: "D4q | G4h B4e G4e | B4h A4q | G4h E4q | D4h D4q | G4h B4e G4e | B4h A4q | D5h." },
      body: `{c: Verso 1}
A[G]mazing [G7]grace, how [C]sweet the [G]sound
That saved a wretch like [D]me
I [G]once was [G7]lost, but [C]now am [G]found
Was [Em]blind, but [D]now I [G]see

{c: Verso 2}
'Twas [G]grace that [G7]taught my [C]heart to [G]fear
And grace my fears re[D]lieved
How [G]precious [G7]did that [C]grace ap[G]pear
The [Em]hour I [D]first be[G]lieved

{c: Verso 3}
Through [G]many [G7]dangers, [C]toils and [G]snares
I have already [D]come
'Tis [G]grace hath [G7]brought me [C]safe thus [G]far
And [Em]grace will [D]lead me [G]home

{c: Verso 4}
When [G]we've been [G7]there ten [C]thousand [G]years
Bright shining as the [D]sun
We've [G]no less [G7]days to [C]sing God's [G]praise
Than [Em]when we'd [D]first be[G]gun`
    },
    {
      id: "ode-alegria", title: "Ode à Alegria", artist: "Ludwig van Beethoven", album: "Sinfonia nº 9 (tema)", genre: "Erudito",
      key: "C", bpm: 100, time: "4/4", difficulty: 1,
      melody: { clef: "treble", key: "C", time: "4/4", label: "Tema completo", notes: "E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | E4q. D4e D4h | E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | D4q. C4e C4h | D4q D4q E4q C4q | D4q E4e F4e E4q C4q | D4q E4e F4e E4q D4q | C4q D4q G3h | E4q E4q F4q G4q | G4q F4q E4q D4q | C4q C4q D4q E4q | D4q. C4e C4h" },
      body: `{c: Tema (instrumental)}
[C] Mi Mi Fá Sol   [G] Sol Fá Mi Ré
[C] Dó Dó Ré Mi    [G] Mi . Ré Ré
[C] Mi Mi Fá Sol   [G] Sol Fá Mi Ré
[C] Dó Dó Ré Mi    [G] Ré . [C] Dó Dó

{c: Parte B}
[G] Ré Ré Mi Dó    [G] Ré Mi-Fá Mi Dó
[G] Ré Mi-Fá Mi Ré [C] Dó Ré [G] Sol
[C] Mi Mi Fá Sol   [G] Sol Fá Mi Ré
[C] Dó Dó Ré Mi    [G] Ré . [C] Dó Dó

{c: Tablatura (violão/guitarra, 1ª e 2ª cordas)}
{sot}
e|-0-0-1-3-|-3-1-0----|-----------|-0---------|
B|---------|-------3--|-1-1-3-----|---3-3-----|
G|---------|----------|-----------|-----------|

e|-0-0-1-3-|-3-1-0----|-----------|-----------|
B|---------|-------3--|-1-1-3-----|-3--1-1----|
G|---------|----------|-----------|-----------|
{eot}`
    },
    {
      id: "saints", title: "When the Saints Go Marching In", artist: "Tradicional (spiritual)", album: "Domínio público", genre: "Jazz / Gospel",
      key: "C", bpm: 110, time: "4/4", difficulty: 1,
      melody: { clef: "treble", key: "C", time: "4/4", label: "Melodia", notes: "R q C4q E4q F4q | G4w | R q C4q E4q F4q | G4w | R q C4q E4q F4q | G4h E4h | C4h E4h | D4w | R q E4q E4q D4q | C4h. C4q | E4h G4q G4q | F4w | R q E4q F4q G4q | E4h C4h | D4h D4h | C4w" },
      body: `Oh, when the [C]saints go marching in
Oh, when the saints go marching [G7]in
Oh Lord, I [C]want to [C7]be in that [F]number
When the [C]saints go [G7]marching [C]in

Oh, when the [C]sun refuse to shine
Oh, when the sun refuse to [G7]shine
Oh Lord, I [C]want to [C7]be in that [F]number
When the [C]sun re[G7]fuse to [C]shine

Oh, when the [C]stars fall from the sky
Oh, when the stars fall from the [G7]sky
Oh Lord, I [C]want to [C7]be in that [F]number
When the [C]stars fall [G7]from the [C]sky`
    },
    {
      id: "twinkle", title: "Twinkle, Twinkle, Little Star", artist: "Jane Taylor / melodia tradicional francesa", album: "Domínio público", genre: "Infantil",
      key: "C", bpm: 96, time: "4/4", difficulty: 1,
      melody: { clef: "treble", key: "C", time: "4/4", label: "Melodia", notes: "C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h | G4q G4q F4q F4q | E4q E4q D4h | G4q G4q F4q F4q | E4q E4q D4h | C4q C4q G4q G4q | A4q A4q G4h | F4q F4q E4q E4q | D4q D4q C4h" },
      body: `[C]Twinkle, twinkle, [F]little [C]star
[F]How I [C]wonder [G7]what you [C]are
[C]Up a[F]bove the [C]world so [G7]high
[C]Like a [F]diamond [C]in the [G7]sky
[C]Twinkle, twinkle, [F]little [C]star
[F]How I [C]wonder [G7]what you [C]are`
    },
    {
      id: "frere-jacques", title: "Frère Jacques", artist: "Tradicional francesa", album: "Domínio público", genre: "Infantil",
      key: "C", bpm: 100, time: "4/4", difficulty: 1,
      melody: { clef: "treble", key: "C", time: "4/4", label: "Melodia (cânone)", notes: "C4q D4q E4q C4q | C4q D4q E4q C4q | E4q F4q G4h | E4q F4q G4h | G4e A4e G4e F4e E4q C4q | G4e A4e G4e F4e E4q C4q | C4q G3q C4h | C4q G3q C4h" },
      body: `[C]Frère Jacques, [G7]frère [C]Jacques
Dormez-[G7]vous? Dor[C]mez-vous?
Sonnez les ma[G7]tines! Sonnez les ma[C]tines!
Ding, [G7]dang, [C]dong. Ding, [G7]dang, [C]dong.`
    },
    {
      id: "ciranda", title: "Ciranda, Cirandinha", artist: "Folclore brasileiro", album: "Domínio público", genre: "Cantiga de roda",
      key: "C", bpm: 104, time: "2/4", difficulty: 1,
      body: `[C]Ciranda, cirandinha
Vamos todos ciran[G7]dar
Vamos dar a meia volta
Volta e meia vamos [C]dar

[C]O anel que tu me deste
Era vidro e se que[G7]brou
O amor que tu me tinhas
Era pouco e se aca[C]bou`
    },
    {
      id: "marcha-soldado", title: "Marcha Soldado", artist: "Folclore brasileiro", album: "Domínio público", genre: "Cantiga de roda",
      key: "C", bpm: 112, time: "2/4", difficulty: 1,
      body: `[C]Marcha soldado
Cabeça de pa[G7]pel
Se não marchar direito
Vai preso pro quar[C]tel

[C]O quartel pegou fogo
A polícia deu si[G7]nal
Acode, acode, acode
A bandeira nacio[C]nal`
    },
    {
      id: "peixe-vivo", title: "Peixe Vivo", artist: "Folclore mineiro", album: "Domínio público", genre: "Folclore",
      key: "G", bpm: 92, time: "2/4", difficulty: 1,
      body: `[G]Como pode o peixe vivo
Viver fora da água [D7]fria?
Como pode o peixe vivo
Viver fora da água [G]fria?

[G]Como poderei viver
[G7]Como poderei vi[C]ver
Sem a [G]tua, sem a [D7]tua
Sem a tua compa[G]nhia?

[G]Os pastores desta aldeia
Já me fazem zomba[D7]ria
Por me verem assim chorando
Sem a tua compa[G]nhia`
    },
    {
      id: "cravo-rosa", title: "O Cravo Brigou com a Rosa", artist: "Folclore brasileiro", album: "Domínio público", genre: "Cantiga de roda",
      key: "G", bpm: 100, time: "3/4", difficulty: 1,
      body: `O [G]cravo brigou com a rosa
De[D7]baixo de uma sacada
O cravo saiu ferido
E a [G]rosa despedaçada

O [G]cravo ficou doente
A [D7]rosa foi visitar
O cravo teve um desmaio
E a [G]rosa pôs-se a chorar`
    },
    {
      id: "se-essa-rua", title: "Se Essa Rua Fosse Minha", artist: "Folclore brasileiro", album: "Domínio público", genre: "Cantiga",
      key: "Am", bpm: 84, time: "3/4", difficulty: 2,
      body: `Se essa [Am]rua, se essa rua fosse [E7]minha
Eu man[E7]dava, eu mandava ladri[Am]lhar
Com pe[A7]drinhas, com pedrinhas de bri[Dm]lhante
Para o [Am]meu, para o [E7]meu amor pas[Am]sar

Nesta [Am]rua, nesta rua tem um [E7]bosque
Que se [E7]chama, que se chama soli[Am]dão
Dentro [A7]dele, dentro dele mora um [Dm]anjo
Que rou[Am]bou, que rou[E7]bou meu cora[Am]ção`
    },
    {
      id: "terezinha", title: "Terezinha de Jesus", artist: "Folclore brasileiro", album: "Domínio público", genre: "Cantiga de roda",
      key: "C", bpm: 96, time: "3/4", difficulty: 1,
      body: `Tere[C]zinha de Jesus
De uma queda foi ao [G7]chão
Acudiram três cava[G7]lheiros
Todos três, chapéu na [C]mão

O pri[C]meiro foi seu pai
O segundo, seu ir[G7]mão
O terceiro foi a[G7]quele
A quem Tereza deu a [C]mão`
    },
    {
      id: "escravos-jo", title: "Escravos de Jó", artist: "Folclore brasileiro", album: "Domínio público", genre: "Cantiga de roda",
      key: "Am", bpm: 116, time: "2/4", difficulty: 1,
      body: `Es[Am]cravos de Jó jogavam caxan[E7]gá
Tira, põe, deixa fi[Am]car
Guerreiros com guerreiros fazem [Dm]zigue-zigue-[Am]zá
Guerreiros com guerreiros fazem [E7]zigue-zigue-[Am]zá`
    },
    {
      id: "greensleeves", title: "Greensleeves", artist: "Tradicional inglesa (séc. XVI)", album: "Domínio público", genre: "Folk",
      key: "Am", bpm: 92, time: "3/4", difficulty: 2,
      body: `{c: Verso}
A[Am]las, my [G]love, you [Am]do me [E]wrong
To [Am]cast me [G]off dis[Am]court[E]eous[Am]ly
For [Am]I have [G]loved you [Am]well and [E]long
De[Am]lighting [E]in your [Am]compa[Am]ny

{soc}
[C]Greensleeves was [G]all my [Am]joy, [E]
[C]Greensleeves was [G]my de[Am]light, [E]
[C]Greensleeves was my [G]heart of [Am]gold, [E]
And [Am]who but my [E]lady [Am]Greensleeves
{eoc}

{c: Dedilhado sugerido (Am)}
{sot}
e|-------0-----------0-----|
B|-----1---1-------1---1---|
G|---2-------2---2-------2-|
D|-------------------------|
A|-0-----------0-----------|
E|-------------------------|
{eot}`
    },
    {
      id: "scarborough", title: "Scarborough Fair", artist: "Balada tradicional inglesa", album: "Domínio público", genre: "Folk",
      key: "Am", bpm: 96, time: "3/4", difficulty: 2,
      body: `[Am]Are you going to [G]Scarborough [Am]Fair?
[C]Parsley, [Am]sage, rose[D]mary and [Am]thyme
Re[Am]member [C]me to one who [G]lives there
[Am]She once [G]was a true [Em]love of [Am]mine

[Am]Tell her to make me a [G]cambric [Am]shirt
[C]Parsley, [Am]sage, rose[D]mary and [Am]thyme
With[Am]out no [C]seams nor [G]needlework
[Am]Then she'll [G]be a true [Em]love of [Am]mine`
    },
    {
      id: "oh-susanna", title: "Oh! Susanna", artist: "Stephen Foster (1848)", album: "Domínio público", genre: "Folk / Country",
      key: "G", bpm: 120, time: "2/4", difficulty: 1,
      body: `Oh, I [G]come from Alabama with my [D7]banjo on my knee
I'm [G]going to Louisiana, my [D7]true love for to [G]see
It [G]rained all night the day I left, the [D7]weather it was dry
The [G]sun so hot I froze to death, Su[D7]sanna, don't you [G]cry

{soc}
[C]Oh! Su[C]sanna, [G]oh don't you cry for [D7]me
For I [G]come from Alabama with my [D7]banjo on my [G]knee
{eoc}`
    },
    {
      id: "auld-lang-syne", title: "Auld Lang Syne", artist: "Robert Burns / tradicional escocesa", album: "Domínio público", genre: "Folk",
      key: "G", bpm: 84, time: "4/4", difficulty: 2,
      body: `Should [G]auld acquaintance [D7]be forgot
And [G]never brought to [C]mind?
Should [G]auld acquaintance [D7]be forgot
And [Em]days of [D7]auld lang [G]syne?

{soc}
For [G]auld lang syne, my [D7]dear
For [G]auld lang [C]syne
We'll [G]tak a cup o' [D7]kindness yet
For [Em]auld [D7]lang [G]syne
{eoc}`
    },
    {
      id: "silent-night", title: "Silent Night", artist: "Franz Gruber / Joseph Mohr", album: "Domínio público", genre: "Natal",
      key: "C", bpm: 72, time: "3/4", difficulty: 1,
      body: `[C]Silent night, holy night
[G7]All is calm, [C]all is bright
[F]Round yon virgin [C]mother and child
[F]Holy infant so [C]tender and mild
[G7]Sleep in heavenly [C]peace
[C]Sleep in [G7]heavenly [C]peace`
    },
    {
      id: "danny-boy", title: "Danny Boy", artist: "Frederic Weatherly / melodia irlandesa", album: "Domínio público", genre: "Folk",
      key: "C", bpm: 66, time: "4/4", difficulty: 3,
      body: `Oh [C]Danny boy, the [C7]pipes, the pipes are [F]calling
From [C]glen to glen, and [Am]down the mountain [D7]side [G7]
The [C]summer's gone, and [C7]all the roses [F]falling
It's [C]you, it's you must [G7]go and I must [C]bide

But [G7]come ye back when [C]summer's in the [F]meadow
Or [C]when the valley's [Am]hushed and white with [D7]snow [G7]
It's [C]I'll be here in [C7]sunshine or in [F]shadow
Oh [C]Danny boy, oh [Am]Danny boy, I [G7]love you [C]so`
    },
    {
      id: "blues-la", title: "Blues em Lá — 12 compassos", artist: "Estudo O Músico", album: "Estudos", genre: "Blues",
      key: "A", bpm: 88, time: "4/4", difficulty: 2,
      body: `{c: Forma (cada acorde = 1 compasso, ritmo shuffle)}
[A7] | [D7] | [A7] | [A7] |
[D7] | [D7] | [A7] | [A7] |
[E7] | [D7] | [A7] | [E7] |

{c: Riff de base (shuffle) — sobre A7}
{sot}
e|-----------------|-----------------|
B|-----------------|-----------------|
G|-----------------|-----------------|
D|-----------------|-----------------|
A|-0--0--0--0--0--0-|-0--0--0--0--0--0-|
E|-2--2--4--4--5--4-|-2--2--4--4--5--4-|
{eot}
{c: Mova o mesmo desenho uma corda abaixo para D7 e duas casas acima para E7}

{c: Escala sugerida para improviso: pentatônica menor de Lá (blues)}`
    },
    {
      id: "pop-progressao", title: "Progressão Pop I–V–vi–IV", artist: "Estudo O Músico", album: "Estudos", genre: "Pop",
      key: "G", bpm: 100, time: "4/4", difficulty: 1,
      body: `{c: Batida: ↓ ↓↑ ↑↓↑ (1 compasso por acorde)}
[G] | [D] | [Em] | [C] |
[G] | [D] | [Em] | [C] |

{c: Variação com baixos}
[G] | [D/F#] | [Em] | [C] |
[Am7] | [D7/4] | [G] | [G] |

{c: Use o transpositor para praticar a mesma sequência em outros tons}`
    },
    {
      id: "bossa-251", title: "Estudo de Bossa — ii–V–I", artist: "Estudo O Músico", album: "Estudos", genre: "Bossa nova",
      key: "C", bpm: 76, time: "2/4", difficulty: 4,
      body: `{c: Cadência ii–V–I com tensões}
[Dm7(9)] | [G7(13)] | [C7M(9)] | [C7M(9)] |
[Em7] | [A7(b13)] | [Dm7(9)] | [G7(13)] |
[Cm7] | [F7(9)] | [Bb7M] | [Bb6] |
[Em7(b5)] | [A7(b9)] | [Dm7(9)] | [G7(13)] |
[C7M(9)] | [C6(9)] |

{c: Levada: polegar nos baixos em tempo, dedos sincopados}`
    },
    {
      id: "arpejo-do", title: "Arpejos em Dó — Dedilhado", artist: "Estudo O Músico", album: "Estudos", genre: "Técnica",
      key: "C", bpm: 70, time: "4/4", difficulty: 2,
      body: `{c: Padrão P-i-m-a (polegar, indicador, médio, anelar)}
[C] | [Am] | [Dm] | [G7] |

{sot}
     C           Am          Dm          G7
e|-------0---|-------0---|-------1---|-------1---|
B|-----1---1-|-----1---1-|-----3---3-|-----0---0-|
G|---0-------|---2-------|---2-------|---0-------|
D|-----------|-----------|-0---------|-----------|
A|-3---------|-0---------|-----------|-----------|
E|-----------|-----------|-----------|-3---------|
{eot}`
    }
  ];
})(window.OM);
