/* O Músico — conteúdo didático: cursos, lições e guias de instrumentos.
   Tipos de bloco: p (parágrafo), h (subtítulo), tip (destaque), list (itens), table (linhas),
   chords (diagramas no instrumento atual), piano (teclas destacadas), play (tocar notas/acordes),
   prog (progressão de acordes tocada em sequência), staff (pauta), fret (braço), link (abrir tela). */
(function (OM) {
  "use strict";
  OM.COURSES = [
    {
      id: "fundamentos", n: "Fundamentos da música", icon: "book", d: "Notas, tons e semitons, escala maior e ritmo.",
      lessons: [
        { id: "f1", n: "As 7 notas e os acidentes", b: [
          { t: "p", text: "A música ocidental usa sete notas naturais: Dó, Ré, Mi, Fá, Sol, Lá e Si. Nas cifras elas são escritas com letras: C (Dó), D (Ré), E (Mi), F (Fá), G (Sol), A (Lá) e B (Si)." },
          { t: "table", rows: [["C", "Dó"], ["D", "Ré"], ["E", "Mi"], ["F", "Fá"], ["G", "Sol"], ["A", "Lá"], ["B", "Si"]] },
          { t: "piano", from: 48, to: 71, notes: [60, 62, 64, 65, 67, 69, 71], labels: true },
          { t: "play", label: "Ouvir Dó, Ré, Mi, Fá, Sol, Lá, Si", seq: [60, 62, 64, 65, 67, 69, 71, 72] },
          { t: "p", text: "Entre algumas notas existem notas intermediárias, as teclas pretas do piano. Elas recebem acidentes: sustenido (#) sobe meio tom e bemol (b) desce meio tom. C# e Db são o mesmo som com nomes diferentes." },
          { t: "tip", text: "Depois do Si vem outro Dó, mais agudo. A distância entre os dois é uma oitava, e o ciclo das notas se repete." }
        ] },
        { id: "f2", n: "Tons e semitons", b: [
          { t: "p", text: "O semitom é a menor distância entre duas notas. No violão, é uma casa; no piano, a tecla vizinha (branca ou preta). Um tom são dois semitons." },
          { t: "list", items: ["Mi–Fá e Si–Dó são semitons naturais: não há tecla preta entre eles.", "Dó–Ré, Ré–Mi, Fá–Sol, Sol–Lá e Lá–Si são tons.", "Em instrumentos de corda, cada casa sobe um semitom; 12 casas = uma oitava."] },
          { t: "fret", frets: 12, mode: "string1" },
          { t: "play", label: "Ouvir semitom (Mi–Fá)", seq: [64, 65] },
          { t: "play", label: "Ouvir tom (Dó–Ré)", seq: [60, 62] },
          { t: "link", label: "Explorar o mapa do braço", screen: "fretmap" }
        ] },
        { id: "f3", n: "A escala maior", b: [
          { t: "p", text: "Uma escala é uma sequência organizada de notas. A escala maior segue sempre o mesmo desenho de distâncias: tom, tom, semitom, tom, tom, tom, semitom (T-T-S-T-T-T-S)." },
          { t: "piano", from: 60, to: 72, notes: [60, 62, 64, 65, 67, 69, 71, 72], roots: [0], labels: true },
          { t: "play", label: "Ouvir Dó maior", seq: [60, 62, 64, 65, 67, 69, 71, 72] },
          { t: "p", text: "Começando de outra nota e respeitando o mesmo desenho, aparecem sustenidos ou bemóis. Sol maior, por exemplo, precisa do Fá#: G A B C D E F# G." },
          { t: "play", label: "Ouvir Sol maior", seq: [67, 69, 71, 72, 74, 76, 78, 79] },
          { t: "link", label: "Abrir o gerador de escalas", screen: "scales" },
          { t: "link", label: "Treinar escalas", screen: "exercise", params: { id: "scales" } }
        ] },
        { id: "f4", n: "Ritmo: pulso, compasso e figuras", b: [
          { t: "p", text: "O pulso é a batida regular da música: a que você marca com o pé. O andamento mede quantos pulsos acontecem por minuto (BPM)." },
          { t: "p", text: "O compasso agrupa os pulsos: em 4/4 contamos 1-2-3-4, em 3/4 (valsa) 1-2-3, em 2/4 1-2. O primeiro tempo costuma ser o mais forte." },
          { t: "h", text: "Figuras de duração (em 4/4)" },
          { t: "staff", notes: "C5w | C5h C5h | C5q C5q C5q C5q | C5e C5e C5e C5e C5e C5e C5e C5e", time: "4/4" },
          { t: "table", rows: [["Semibreve", "4 tempos"], ["Mínima", "2 tempos"], ["Semínima", "1 tempo"], ["Colcheia", "½ tempo"], ["Semicolcheia", "¼ de tempo"]] },
          { t: "tip", text: "Pratique sempre com metrônomo, começando devagar. A velocidade vem com a precisão." },
          { t: "link", label: "Abrir o metrônomo", screen: "metronome" },
          { t: "link", label: "Exercício de ritmo", screen: "exercise", params: { id: "rhythm" } }
        ] }
      ]
    },
    {
      id: "acordes", n: "Aprender acordes", icon: "grid", d: "Do primeiro acorde à pestana e ao campo harmônico.",
      lessons: [
        { id: "a1", n: "O que é um acorde", b: [
          { t: "p", text: "Acorde é um conjunto de três ou mais notas tocadas juntas. O mais simples é a tríade: fundamental (dá o nome), terça (define se é maior ou menor) e quinta (dá corpo)." },
          { t: "piano", from: 48, to: 71, notes: [60, 64, 67], roots: [0], labels: true },
          { t: "play", label: "Ouvir as notas de Dó maior separadas", seq: [60, 64, 67] },
          { t: "play", label: "Ouvir o acorde C (juntas)", chord: "C" },
          { t: "p", text: "Em qualquer instrumento, o acorde C é formado pelas notas Dó, Mi e Sol, repetidas em várias alturas." },
          { t: "chords", names: ["C"] }
        ] },
        { id: "a2", n: "Como ler um diagrama", b: [
          { t: "p", text: "O diagrama mostra o braço do instrumento de frente, na vertical. As linhas verticais são as cordas (a mais grave à esquerda) e as horizontais são os trastes. A linha grossa no topo é a pestana do instrumento (a casa zero)." },
          { t: "chords", names: ["C", "G"], big: true },
          { t: "table", rows: [["Bolinha com número", "onde apertar e qual dedo usar"], ["1, 2, 3, 4", "indicador, médio, anelar e mínimo"], ["○ acima do braço", "corda solta: toca sem apertar"], ["× acima do braço", "corda abafada: não toque"], ["Bolinha laranja", "a fundamental do acorde"], ["Barra horizontal", "pestana: um dedo prende várias cordas"], ["Número ao lado", "casa onde o desenho começa"]] },
          { t: "tip", text: "Toque num diagrama para ouvir o acorde. Se você toca teclado ou piano, os acordes aparecem como teclas destacadas." }
        ] },
        { id: "a3", n: "Maior × menor", b: [
          { t: "p", text: "A diferença entre um acorde maior e um menor está na terça: no menor ela fica meio tom abaixo. O maior soa aberto e alegre; o menor, mais introspectivo." },
          { t: "piano", from: 48, to: 71, notes: [60, 63, 67], roots: [0], labels: true },
          { t: "play", label: "Ouvir C (maior)", chord: "C" },
          { t: "play", label: "Ouvir Cm (menor)", chord: "Cm" },
          { t: "p", text: "Na cifra, o menor leva um “m” minúsculo: Am, Em, Dm." },
          { t: "chords", names: ["A", "Am", "E", "Em", "D", "Dm"] },
          { t: "link", label: "Acordes de ouvido: maior × menor", screen: "exercise", params: { id: "chordear" } }
        ] },
        { id: "a4", n: "Seus primeiros acordes", b: [
          { t: "p", text: "Comece com estes seis acordes. Com eles você já toca centenas de músicas." },
          { t: "chords", names: ["Em", "Am", "C", "G", "D", "E"] },
          { t: "list", items: ["Aperte com a ponta dos dedos, bem perto do traste (não em cima dele).", "Mantenha os dedos arqueados para não encostar nas cordas vizinhas.", "Toque corda por corda para conferir se todas soam limpas.", "Dor na ponta dos dedos é normal nas primeiras semanas; pratique pouco e todos os dias."] },
          { t: "prog", label: "Ouvir Em – Am – D – G", chords: ["Em", "Am", "D", "G"] },
          { t: "link", label: "Treinar: aprender acordes", screen: "exercise", params: { id: "chords" } },
          { t: "link", label: "Treinar: mudanças de acordes", screen: "exercise", params: { id: "changes" } }
        ] },
        { id: "a5", n: "Lendo os símbolos da cifra", b: [
          { t: "p", text: "Depois da letra da fundamental, a cifra diz o tipo do acorde. Os símbolos mais usados no Brasil:" },
          { t: "table", rows: [["C", "Dó maior"], ["Cm", "Dó menor"], ["C7", "Dó com sétima (dominante)"], ["C7M", "Dó com sétima maior (também Cmaj7)"], ["Cm7", "Dó menor com sétima"], ["C°", "Dó diminuto"], ["Cm7(b5)", "meio-diminuto (também Cø)"], ["C+ / Caug", "aumentado"], ["C4 / Csus4", "suspenso com quarta"], ["C(9) / Cadd9", "com nona adicionada"], ["C6", "com sexta"], ["C/E", "Dó maior com Mi no baixo (inversão)"]] },
          { t: "chords", names: ["C7M", "Cm7", "Csus4", "C/E"] },
          { t: "link", label: "Abrir a biblioteca de acordes", screen: "chords" }
        ] },
        { id: "a6", n: "Acordes com sétima", b: [
          { t: "p", text: "Somar a sétima menor a um acorde maior cria o acorde dominante (G7), que pede resolução: ele “puxa” para o acorde uma quarta acima (G7 → C)." },
          { t: "chords", names: ["G7", "C7", "D7", "A7", "E7", "B7"] },
          { t: "prog", label: "Ouvir G7 → C (resolução)", chords: ["G7", "C"] },
          { t: "prog", label: "Ouvir E7 → Am", chords: ["E7", "Am"] },
          { t: "tip", text: "Muitas músicas no tom de Mi menor usam B7 antes de voltar ao Em; no tom de Lá, E7 antes de A." }
        ] },
        { id: "a7", n: "Pestana", b: [
          { t: "p", text: "Na pestana, o indicador prende várias cordas na mesma casa enquanto os outros dedos formam o desenho. A vantagem: o mesmo desenho, movido pelo braço, gera acordes de qualquer tom." },
          { t: "chords", names: ["F", "Bm", "F#m", "Bb"] },
          { t: "list", items: ["Use a lateral do indicador, levemente girado para fora.", "Mantenha o polegar atrás do braço, mais ou menos na altura do dedo médio.", "Não force: o peso do braço ajuda mais que a força da mão.", "Os dois desenhos principais têm a fundamental na 6ª corda (forma de Mi) e na 5ª corda (forma de Lá)."] },
          { t: "link", label: "Ver todas as posições de F no braço", screen: "chord", params: { name: "F" } }
        ] },
        { id: "a8", n: "Campo harmônico e progressões", b: [
          { t: "p", text: "Os acordes formados com as notas de uma escala maior formam o campo harmônico. Em Dó maior: C, Dm, Em, F, G, Am e B°. Músicas de um mesmo tom usam principalmente esses acordes." },
          { t: "table", rows: [["I", "C"], ["ii", "Dm"], ["iii", "Em"], ["IV", "F"], ["V", "G (G7)"], ["vi", "Am"], ["vii°", "B°"]] },
          { t: "prog", label: "Ouvir I – V – vi – IV (C G Am F)", chords: ["C", "G", "Am", "F"] },
          { t: "prog", label: "Ouvir ii – V – I (Dm7 G7 C7M)", chords: ["Dm7", "G7", "C7M"] },
          { t: "tip", text: "Conhecendo os graus, você transpõe qualquer música: em Sol maior, I–V–vi–IV vira G–D–Em–C." },
          { t: "link", label: "Ver o campo harmônico no gerador de escalas", screen: "scales" },
          { t: "link", label: "Transpositor de tons", screen: "transposer" }
        ] }
      ]
    }
  ];

  /* guias de instrumentos */
  OM.INST_INFO = {
    violao: { d: "Instrumento de 6 cordas de nylon (clássico) ou aço (folk), base da música popular brasileira. Acompanha voz com acordes, batidas e dedilhados.",
      partes: ["Mão (cabeça) com tarraxas: afinam as cordas", "Braço com trastes: cada casa é um semitom", "Boca e tampo: projetam o som", "Rastilho e cavalete: apoiam e prendem as cordas"],
      dicas: ["Afine antes de cada estudo", "Comece pelos acordes Em, Am, C, G, D e E", "Pratique batidas simples com metrônomo a 60–80 BPM", "Estude 15 a 20 minutos por dia, todos os dias"], first: ["Em", "Am", "C", "G", "D", "E"] },
    violao7: { d: "Violão com uma sétima corda grave, muito usado no choro e no samba para fazer as “baixarias” (linhas de baixo).", partes: ["7ª corda grave (Dó ou Si)", "Mesmo braço e trastes do violão de 6"], dicas: ["Domine primeiro o violão de 6 cordas", "Estude escalas na região grave para criar contrapontos"], first: ["C", "G", "Am", "D7"] },
    guitarra: { d: "Instrumento elétrico de 6 cordas de aço. Precisa de amplificador; os captadores transformam a vibração em sinal elétrico. Rock, blues, pop, jazz e gospel.",
      partes: ["Captadores e chave seletora", "Controles de volume e tonalidade", "Ponte (fixa ou com alavanca)", "Saída para o cabo do amplificador"],
      dicas: ["Comece com power chords (E5, A5, D5)", "Use palheta e treine palhetada alternada com metrônomo", "Aprenda a pentatônica menor: a escala mais usada em solos"], first: ["E5", "A5", "G", "D", "Em", "C"] },
    guitarra7: { d: "Guitarra com uma corda grave extra (Si). Comum no metal e no jazz para ampliar a região grave.", partes: ["7ª corda Si grave", "Braço mais largo"], dicas: ["Abafe a 7ª corda com a palma quando não usá-la"], first: ["E5", "B5", "Em", "G"] },
    baixo4: { d: "O contrabaixo elétrico liga harmonia e ritmo: toca a nota fundamental dos acordes junto com o bumbo da bateria. Afinação igual às 4 cordas graves do violão, uma oitava abaixo.",
      partes: ["4 cordas: E A D G", "Captadores e controles", "Braço longo (escala de 34\")"],
      dicas: ["Toque as fundamentais dos acordes em semínimas com o metrônomo", "Use dois dedos alternados (indicador e médio)", "Aprenda as notas das cordas E e A: elas dão a posição de qualquer fundamental"], first: [] },
    baixo5: { d: "Baixo com uma corda Si grave a mais, para notas abaixo do Mi.", partes: ["5 cordas: B E A D G"], dicas: ["Abafe a corda Si quando não usá-la"], first: [] },
    baixo6: { d: "Baixo com cordas Si grave e Dó agudo; amplia graves e permite acordes e solos.", partes: ["6 cordas: B E A D G C"], dicas: ["Atenção ao abafamento: mais cordas, mais ruídos"], first: [] },
    ukulele: { d: "Pequeno instrumento havaiano de 4 cordas de nylon. Afinação G C E A reentrante: a corda Sol é aguda, o que dá o som brilhante característico.",
      partes: ["4 cordas: G C E A", "Corpo pequeno (soprano, concerto, tenor ou barítono)"], dicas: ["Primeiros acordes: C, Am, F, G", "Batida básica: baixo, baixo-cima, cima-baixo-cima"], first: ["C", "Am", "F", "G"] },
    viola: { d: "A viola caipira tem 10 cordas em 5 pares (ordens) e é o som da música caipira e sertaneja raiz. As afinações mais comuns são Cebolão (em Mi ou em Ré) e Rio Abaixo.",
      partes: ["5 pares de cordas; os graves são oitavados", "10 tarraxas", "Boca com rosácea"], dicas: ["Aprenda primeiro em Cebolão em Mi ou em Ré", "Muitos ponteados usam terças paralelas nos pares agudos"], first: ["E", "A", "B7"] },
    cavaco: { d: "O cavaquinho, de 4 cordas de aço, é o centro do samba, do pagode e do choro. Afinação tradicional: Ré, Sol, Si, Ré.",
      partes: ["4 cordas: D G B D", "Corpo pequeno e escala curta"], dicas: ["A palhetada de samba usa movimentos curtos e constantes", "Primeiros acordes: D, G, A7, Bm, E7"], first: ["D", "G", "A7", "Bm", "E7"] },
    bandolim: { d: "Instrumento de 8 cordas em 4 pares, afinado como o violino (G D A E). É o solista do choro.", partes: ["4 pares de cordas", "Tocado com palheta"], dicas: ["Use a mesma digitação de escalas do violino", "Treine trêmulo (palhetada rápida e contínua)"], first: ["G", "D", "C", "Am"] },
    banjo: { d: "Banjo de 5 cordas, com a 5ª corda curta e aguda (reentrante). Pele no lugar do tampo de madeira; som brilhante do bluegrass e do folk.", partes: ["Pele (como a de um tambor)", "5ª corda curta presa no meio do braço"], dicas: ["Afinação Open G: as cordas soltas já formam o acorde G", "Aprenda o padrão de dedilhado rolado (roll)"], first: ["G", "C", "D7"] },
    violino: { d: "Instrumento de arco de 4 cordas (G D A E) afinadas em quintas. Não tem trastes: a afinação de cada nota depende do ouvido e da posição exata do dedo.",
      partes: ["Arco com crina de cavalo (passe breu)", "Espelho sem trastes", "Cavalete e alma", "Microafinadores no estandarte"], dicas: ["Use o afinador nas cordas soltas e o identificador de notas para conferir as posições", "Comece com cordas soltas e arcadas longas", "Estude a escala de Ré maior na 1ª posição"], first: [] },
    violaorq: { d: "A viola de arco é um pouco maior que o violino e soa uma quinta abaixo (C G D A). Lê na clave de Dó.", partes: ["Mesmas partes do violino, em tamanho maior"], dicas: ["Treine leitura em clave de Dó na 3ª linha"], first: [] },
    violoncelo: { d: "O violoncelo é tocado sentado, apoiado no chão, com cordas C G D A uma oitava abaixo da viola. Lê principalmente em clave de Fá.", partes: ["Espigão de apoio", "Arco mais pesado"], dicas: ["Postura: costas retas, instrumento levemente inclinado", "Comece com cordas soltas e escalas de Dó e Sol maior"], first: [] },
    contrabaixo: { d: "O maior instrumento de cordas da orquestra, afinado em quartas (E A D G). No jazz é tocado em pizzicato (beliscado).", partes: ["Tocado de pé ou em banqueta", "Arco francês ou alemão"], dicas: ["No jazz, aprenda a fazer walking bass sobre o blues"], first: [] },
    teclado: { d: "Instrumento eletrônico de teclas com vários timbres e ritmos. Permite tocar acordes com a mão esquerda e melodia com a direita.",
      partes: ["Teclas brancas (notas naturais) e pretas (acidentes)", "O Dó fica à esquerda de cada grupo de 2 teclas pretas", "Controles de timbre e ritmo"], dicas: ["Dedilhado: polegar = 1, mínimo = 5", "Comece com C, F, G e Am na mão esquerda", "Toque a escala de Dó maior com as duas mãos"], first: ["C", "F", "G", "Am"] },
    piano: { d: "Instrumento de teclas com cordas percutidas por martelos. 88 teclas, do Lá0 ao Dó8; o som depende da força do toque. Base da teoria musical.",
      partes: ["88 teclas", "Pedal de sustentação (direita)", "Pedal surdina (esquerda)"], dicas: ["Encontre o Dó central (C4)", "Pratique mãos separadas antes de juntar", "Estude escalas e arpejos todos os dias"], first: ["C", "G", "Am", "F"] },
    bateria: { d: "A bateria reúne tambores e pratos tocados com baquetas e pedais. O baterista mantém o tempo e dá o groove.",
      partes: ["Bumbo (pedal)", "Caixa", "Chimbal (hi-hat, com pedal)", "Tons e surdo", "Pratos de ataque e de condução"], dicas: ["Comece com o groove de rock: chimbal em colcheias, caixa no 2 e no 4, bumbo no 1 e no 3", "Use o metrônomo sempre", "Estude rudimentos: toque simples, toque duplo e paradiddle"], first: [] },
    voz: { d: "A voz é um instrumento: cantar afinado depende de ouvir bem e de controlar respiração e ressonância.", partes: ["Diafragma e respiração", "Pregas vocais", "Ressonadores (boca, nariz)"], dicas: ["Aqueça a voz antes de cantar", "Use o identificador de notas para conferir sua afinação", "Treine percepção de intervalos"], first: [] },
    _wind: { d: "Instrumento de sopro: o som nasce da vibração do ar (palheta, bocal ou aresta). Saxofones, clarinete, trompete e trompa são transpositores: a nota escrita é diferente da nota real.",
      partes: ["Bocal ou boquilha", "Corpo com chaves ou pistos", "Campana"], dicas: ["Respiração diafragmática e notas longas todos os dias", "Use o afinador: ele mostra a nota escrita para o seu instrumento", "Nas cifras, escolha seu instrumento para ver os acordes transpostos"], first: [] }
  };
})(window.OM);
