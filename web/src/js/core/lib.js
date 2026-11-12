/* O Músico — biblioteca: acervo + cifras do usuário, favoritos, repertórios,
   status de estudo, anotações, edições pessoais, histórico de prática */
(function (OM) {
  "use strict";
  var S = OM.store, u = OM.u;

  function userSongs() { return S.get("userSongs", []); }
  function edits() { return S.get("edits", {}); }
  function all() {
    var ed = edits();
    return OM.SONGS.map(function (s) { return ed[s.id] ? Object.assign({}, s, ed[s.id], { edited: true }) : s; })
      .concat(userSongs().map(function (s) { return Object.assign({ user: true }, s); }));
  }
  function get(id) {
    var a = all();
    for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
    return null;
  }
  function original(id) { return OM.SONGS.filter(function (s) { return s.id === id; })[0] || null; }
  /* texto pesquisável (título, artista, álbum, gênero e letra sem acordes) */
  var idx = null, idxVer = -1, ver = 0;
  function bump() { ver++; }
  function index() {
    if (idx && idxVer === ver) return idx;
    idx = all().map(function (s) {
      var lyr = String(s.body || "").replace(/\[[^\]]*\]/g, "").replace(/\{[^}]*\}/g, " ");
      return { s: s, head: u.norm(s.title + " " + s.artist + " " + (s.album || "") + " " + (s.genre || "")), body: u.norm(lyr) };
    });
    idxVer = ver;
    return idx;
  }
  function search(q, filter) {
    var n = u.norm(q), terms = n.split(" ").filter(Boolean);
    var res = [];
    index().forEach(function (it) {
      if (filter && !filter(it.s)) return;
      if (!terms.length) { res.push({ s: it.s, sc: 0 }); return; }
      var sc = 0;
      for (var i = 0; i < terms.length; i++) {
        var t = terms[i];
        if (it.head.indexOf(t) >= 0) sc += it.head.indexOf(t) === 0 || it.head.indexOf(" " + t) >= 0 ? 3 : 2;
        else if (it.body.indexOf(t) >= 0) sc += 1;
        else return;
      }
      res.push({ s: it.s, sc: sc });
    });
    res.sort(function (a, b) { return b.sc - a.sc || a.s.title.localeCompare(b.s.title); });
    return res.map(function (r) { return r.s; });
  }
  function saveUserSong(song) {
    S.update("userSongs", [], function (a) {
      var i = a.findIndex(function (x) { return x.id === song.id; });
      if (i >= 0) a[i] = song; else a.unshift(song);
    });
    bump();
  }
  function deleteUserSong(id) {
    S.update("userSongs", [], function (a) { return a.filter(function (x) { return x.id !== id; }); });
    S.update("favorites", [], function (a) { return a.filter(function (x) { return x !== id; }); });
    S.update("lists", [], function (ls) { ls.forEach(function (l) { l.songs = l.songs.filter(function (x) { return x !== id; }); }); });
    bump();
  }
  /* alteração pessoal de uma cifra do acervo */
  function saveEdit(id, patch) { S.update("edits", {}, function (e) { e[id] = Object.assign({}, e[id] || {}, patch); }); bump(); }
  function revertEdit(id) { S.update("edits", {}, function (e) { delete e[id]; }); bump(); }

  /* favoritos */
  function favs() { return S.get("favorites", []); }
  function isFav(id) { return favs().indexOf(id) >= 0; }
  function toggleFav(id) {
    var on;
    S.update("favorites", [], function (a) { var i = a.indexOf(id); if (i >= 0) { a.splice(i, 1); on = false; } else { a.unshift(id); on = true; } });
    return on;
  }
  /* repertórios */
  function lists() { return S.get("lists", []); }
  function getList(id) { return lists().filter(function (l) { return l.id === id; })[0]; }
  function createList(name) { var l = { id: u.uid("l"), name: name, songs: [], created: Date.now() }; S.update("lists", [], function (a) { a.unshift(l); }); return l; }
  function saveList(l) { S.update("lists", [], function (a) { var i = a.findIndex(function (x) { return x.id === l.id; }); if (i >= 0) a[i] = l; }); }
  function deleteList(id) { S.update("lists", [], function (a) { return a.filter(function (x) { return x.id !== id; }); }); }
  function addToList(lid, sid) { var l = getList(lid); if (!l) return false; if (l.songs.indexOf(sid) >= 0) return false; l.songs.push(sid); saveList(l); return true; }
  /* status de estudo: "learn" (para aprender) | "mastered" (dominada) */
  function status(id) { return S.get("status", {})[id] || null; }
  function setStatus(id, v) { S.update("status", {}, function (m) { if (v) m[id] = v; else delete m[id]; }); }
  function byStatus(v) { var m = S.get("status", {}); return Object.keys(m).filter(function (k) { return m[k] === v; }).map(get).filter(Boolean); }
  /* anotações */
  function note(id) { return S.get("notes", {})[id] || ""; }
  function setNote(id, t) { S.update("notes", {}, function (m) { if (t) m[id] = { text: t, date: Date.now() }; else delete m[id]; }); }
  function noteText(id) { var n = S.get("notes", {})[id]; return n ? (typeof n === "string" ? n : n.text) : ""; }
  /* preferências por música (tom, capo, fonte, rolagem) */
  function prefs(id) { return S.get("songPrefs", {})[id] || {}; }
  function setPref(id, k, v) { S.update("songPrefs", {}, function (m) { m[id] = m[id] || {}; m[id][k] = v; }); }
  /* recentes */
  function touch(id) { S.update("recent", [], function (a) { a = a.filter(function (x) { return x !== id; }); a.unshift(id); return a.slice(0, 30); }); }
  function recent() { return S.get("recent", []).map(get).filter(Boolean); }
  /* histórico de prática */
  function log(entry) {
    entry.date = entry.date || Date.now();
    S.update("history", [], function (a) { a.unshift(entry); return a.slice(0, 400); });
    if (entry.minutes) S.update("practiceDays", {}, function (m) { var k = u.dayKey(entry.date); m[k] = Math.round(((m[k] || 0) + entry.minutes) * 10) / 10; });
  }
  function history(type) { var a = S.get("history", []); return type ? a.filter(function (e) { return e.type === type; }) : a; }
  function streak() {
    var m = S.get("practiceDays", {}), d = new Date(), n = 0;
    if (!m[u.dayKey(d.getTime())]) d.setDate(d.getDate() - 1);
    while (m[u.dayKey(d.getTime())]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function totalMinutes() { var m = S.get("practiceDays", {}); return Object.keys(m).reduce(function (a, k) { return a + m[k]; }, 0); }

  /* sugestões: prioriza músicas ainda não tocadas, compatíveis com o nível do usuário */
  function suggestions(n) {
    var played = {}; history("song").forEach(function (e) { played[e.id] = (played[e.id] || 0) + 1; });
    var mastered = byStatus("mastered").map(function (s) { return s.id; });
    var lvl = Math.max(1, Math.min(5, 1 + Math.floor(mastered.length / 3)));
    var c = all().filter(function (s) { return mastered.indexOf(s.id) < 0; });
    c.sort(function (a, b) {
      var sa = (played[a.id] ? 3 : 0) + Math.abs((a.difficulty || 2) - lvl) + (isFav(a.id) ? 1 : 0);
      var sb = (played[b.id] ? 3 : 0) + Math.abs((b.difficulty || 2) - lvl) + (isFav(b.id) ? 1 : 0);
      return sa - sb || (hashDay(a.id) - hashDay(b.id));
    });
    return c.slice(0, n || 8);
  }
  function hashDay(id) { var s = id + u.dayKey(), x = 0; for (var i = 0; i < s.length; i++) x = (x * 33 + s.charCodeAt(i)) % 9973; return x; }

  OM.lib = { all: all, get: get, original: original, search: search, saveUserSong: saveUserSong, deleteUserSong: deleteUserSong, saveEdit: saveEdit,
    revertEdit: revertEdit, favs: favs, isFav: isFav, toggleFav: toggleFav, lists: lists, getList: getList, createList: createList, saveList: saveList,
    deleteList: deleteList, addToList: addToList, status: status, setStatus: setStatus, byStatus: byStatus, note: noteText, setNote: setNote,
    prefs: prefs, setPref: setPref, touch: touch, recent: recent, log: log, history: history, streak: streak, totalMinutes: totalMinutes,
    suggestions: suggestions, bump: bump };
})(window.OM);
