# O Músico

Plataforma musical para Android (WebView) com cifras, afinador, metrônomo, acordes, escalas,
ferramentas de estudo e biblioteca pessoal. Funciona offline e guarda tudo no aparelho.

**Arquivo para importar no Sketchware Pro:** [`dist/O-Musico.swb`](dist/O-Musico.swb)

## Como importar no Sketchware Pro

1. Copie `dist/O-Musico.swb` para o celular.
2. No Sketchware Pro: menu › **Restaurar backup** (Restore) › selecione `O-Musico.swb`.
3. Abra o projeto **O Músico** (`com.omusico.app`) e compile (Run).

O backup já contém:

| Parte do projeto | Conteúdo |
|---|---|
| Tela `main` | WebView `webview1` em tela cheia (View Binding ativo) |
| Lógica (`onCreate › initializeLogic`) | bloco *add source directly* com `android/MainActivity_initializeLogic.java` |
| Java Manager | `OMusicoPonte.java` (ponte JavaScript ↔ Android) |
| Asset Manager | `omusico.html` (o app inteiro: HTML + CSS + JS) |
| Permissões | `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `VIBRATE` |
| Ícone | `android/res/icon.png` |

### Formato `.swb`

O `.swb` é um ZIP. `project`, `data/file`, `data/view`, `data/library`, `data/resource` e `data/logic`
são criptografados com AES-128-CBC (chave e IV = `sketchwaresecure`). Os demais arquivos de `data/`
são JSON simples. `data/files/assets` e `data/files/java` correspondem ao Asset Manager e ao Java Manager.
`tools/pack-swb.mjs` gera esse formato a partir do código-fonte, usando `tools/swb-template/`.

## Gerar novamente

```bash
node web/build.mjs        # web/src/**  ->  dist/omusico.html (arquivo único)
node tools/pack-swb.mjs   # dist/omusico.html + android/*  ->  dist/O-Musico.swb
```

Para testar no navegador, sirva `dist/` por HTTP (`python3 -m http.server --directory dist`) e abra
`http://localhost:8000/omusico.html`. O microfone só funciona em `localhost` ou em HTTPS.

## Funcionalidades

- **Início:** busca (título, artista, gênero e trechos da letra), atalhos (afinador, metrônomo, biblioteca,
  instrumentos), recentes, favoritas, sugestões e últimas práticas.
- **Cifras:** acervo com filtros (gênero, nível, status), editor e importação de arquivos `.txt` / ChordPro.
  Aceita "acordes sobre a letra" e ChordPro (`[C]letra`, `{soc}`, `{sot}` para tablaturas, `{c:}` para seções).
- **Visualizador:** transposição, capotraste (mostra as formas), fonte, rolagem automática com velocidade,
  diagramas do instrumento escolhido, acorde ampliado ao tocar, partitura com reprodução,
  **modo prática** (metrônomo no BPM da música, acordes destacados no tempo), **modo apresentação**
  (tela limpa e tela sempre ligada, avança para a próxima música do repertório), anotações e status de estudo.
- **Afinador:** análise real do microfone (McLeod Pitch Method / NSDF com FFT, interpolação parabólica,
  mediana). Nota, Hz, cents, ponteiro e confirmação de corda afinada. Modos cromático e por instrumento,
  com detecção automática da corda, afinações alternativas, Lá de referência ajustável (415–466 Hz)
  e tom de referência por corda. Instrumentos de sopro mostram a nota escrita (Si♭, Mi♭, Fá).
- **Metrônomo:** 20–300 BPM, compasso configurável, acento por tempo (acento, normal ou mudo), subdivisões
  (colcheia, tercina, semicolcheia, swing, pontuada), 6 sons, volumes, pulsação visual, tap tempo
  e treino de velocidade. Agendamento no relógio do Web Audio, para manter o tempo preciso.
- **Acordes:** catálogo por tônica e categoria (maiores, menores, com sétima, diminutos, aumentados,
  suspensos, extensões). As digitações são calculadas para qualquer afinação (dedos, pestana, cordas soltas
  ou abafadas) e o piano mostra a composição. Há também gerador de acordes e um identificador de acorde
  a partir das notas.
- **Ferramentas:** gerador de escalas (braço, teclado, campo harmônico), transpositor (texto, capotraste,
  instrumentos transpositores), identificador de notas com transcrição, calculadora de BPM (tap, detecção
  pelo microfone, tempos de delay), gravador de ideias (IndexedDB, exportação), bateria e grooves (sequenciador
  editável), percepção auditiva e dicionário musical.
- **Aprender:** 10 exercícios com níveis liberados por desempenho (80%): acordes, notas no braço,
  leitura de partitura (claves de sol e fá), *toque a nota* (pelo microfone), escalas, ritmo (mede a precisão
  em milissegundos), mudanças de acordes por minuto, intervalos, acordes e notas de ouvido.
- **Biblioteca:** favoritas, repertórios, para aprender, dominadas, minhas cifras e versões pessoais,
  anotações, gravações e histórico.
- **Perfil:** estatísticas, sequência de dias, progresso, tema escuro (padrão) ou claro, destaque laranja ou
  verde-limão, notação C D E ou Dó Ré Mi, modo canhoto, backup e restauração em JSON.

Instrumentos: violão (6 e 7 cordas), guitarra (6 e 7), baixo (4, 5 e 6), ukulele, viola caipira, cavaquinho,
bandolim, banjo, violino, viola, violoncelo, contrabaixo, teclado, piano, bateria, sopros (flauta, flauta doce,
saxofones, trompete, clarinete, trombone, trompa, gaita), voz e instrumentos personalizados
(afinação livre ou transposição).

### Acervo

As letras de músicas comerciais têm direitos autorais, então o acervo embutido traz apenas canções de domínio
público, folclore brasileiro e estudos originais. Outras músicas podem ser cadastradas pelo editor ou por
importação, e ficam salvas só no aparelho.

## Estrutura do código

```
web/src/css/           base, componentes e telas
web/src/js/core/       util, armazenamento (localStorage + IndexedDB), ponte Android, áudio, navegação, biblioteca
web/src/js/music/      teoria, instrumentos, digitações, detecção de pitch, síntese, metrônomo, ChordPro, partitura
web/src/js/ui/         ícones e componentes reutilizáveis (diagramas, teclado, braço, folhas, controles)
web/src/js/screens/    telas
web/src/js/data/       acervo, dicionário e grooves
android/               OMusicoPonte.java, bloco de lógica e ícone
tools/                 empacotador .swb e modelo de projeto Sketchware
```
