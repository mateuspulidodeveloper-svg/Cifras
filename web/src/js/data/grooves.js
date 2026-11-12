/* O Músico — ritmos de bateria para prática (16 passos = 1 compasso de 4/4 em semicolcheias).
   x = toque, o = toque fraco, . = pausa */
(function (OM) {
  "use strict";
  OM.GROOVES = [
    { id: "rock", n: "Rock básico", bpm: 100, steps: 16, tracks: { hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x.......x.x....." } },
    { id: "pop", n: "Pop", bpm: 96, steps: 16, tracks: { hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x..x....x.x....." } },
    { id: "balada", n: "Balada", bpm: 72, steps: 16, tracks: { hat: "x.x.x.x.x.x.x.x.", snare: "....x.......x...", kick: "x.........x....." } },
    { id: "funk", n: "Funk", bpm: 98, steps: 16, tracks: { hat: "xxxxxxxxxxxxxxxx", snare: "....x..o.o..x..o", kick: "x.x.......x..x.." } },
    { id: "samba", n: "Samba", bpm: 100, steps: 16, tracks: { shaker: "xoxxxoxxxoxxxoxx", rim: "x..x..x...x..x..", kick: "x..xx..xx..xx..x" } },
    { id: "bossa", n: "Bossa nova", bpm: 128, steps: 16, tracks: { hat: "xxxxxxxxxxxxxxxx", rim: "x..x..x...x..x..", kick: "x..xx..xx..xx..x" } },
    { id: "baiao", n: "Baião", bpm: 92, steps: 16, tracks: { hat: "x.x.x.x.x.x.x.x.", rim: "....x.......x...", kick: "x..x....x..x...." } },
    { id: "xote", n: "Xote", bpm: 88, steps: 16, tracks: { hat: "x.x.x.x.x.x.x.x.", snare: "..x...x...x...x.", kick: "x.......x......." } },
    { id: "sertanejo", n: "Sertanejo (vanerão)", bpm: 120, steps: 16, tracks: { hat: "..x...x...x...x.", snare: "....x.......x...", kick: "x.......x......." } },
    { id: "reggae", n: "Reggae (one drop)", bpm: 76, steps: 16, tracks: { hat: "x.x.x.x.x.x.x.x.", rim: "........x.......", kick: "........x......." } },
    { id: "shuffle", n: "Shuffle / Blues", bpm: 90, steps: 12, beats: 4, tracks: { hat: "x.xx.xx.xx.x", snare: "...x.....x..", kick: "x.....x....." } },
    { id: "valsa", n: "Valsa (3/4)", bpm: 120, steps: 12, beats: 3, tracks: { hat: "x.x.x.x.x.x.", snare: "....x...x...", kick: "x..........." } },
    { id: "gospel68", n: "6/8 (balada)", bpm: 60, steps: 12, beats: 2, tracks: { hat: "x.x.x.x.x.x.", snare: "......x.....", kick: "x..........." } },
    { id: "metal", n: "Rock pesado (bumbo duplo)", bpm: 140, steps: 16, tracks: { ride: "x...x...x...x...", snare: "....x.......x...", kick: "xxxxxxxxxxxxxxxx" } }
  ];
  OM.DRUM_ROWS = ["ride", "open", "hat", "shaker", "rim", "snare", "tom", "kick"];
})(window.OM);
