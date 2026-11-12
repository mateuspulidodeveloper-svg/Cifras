/* O Músico — armazenamento local
   localStorage: configurações, biblioteca pessoal, histórico (JSON pequeno)
   IndexedDB:    gravações de áudio (blobs) */
(function (OM) {
  "use strict";
  var P = "om.";
  var mem = {};
  var listeners = {};

  function get(k, def) {
    if (k in mem) return mem[k];
    var v = def;
    try { var raw = localStorage.getItem(P + k); if (raw != null) v = JSON.parse(raw); } catch (e) { }
    mem[k] = v;
    return v;
  }
  function set(k, v) {
    mem[k] = v;
    try { localStorage.setItem(P + k, JSON.stringify(v)); } catch (e) { OM.ui && OM.ui.toast("Armazenamento cheio: não foi possível salvar"); }
    (listeners[k] || []).forEach(function (f) { try { f(v); } catch (e) { } });
  }
  function update(k, def, fn) { var v = get(k, def); var r = fn(v); set(k, r === undefined ? v : r); return get(k); }
  function on(k, f) { (listeners[k] = listeners[k] || []).push(f); return function () { listeners[k] = listeners[k].filter(function (x) { return x !== f; }); }; }
  function keys() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(P) === 0) out.push(k.slice(P.length)); } } catch (e) { }
    return out;
  }

  var DEFAULTS = {
    name: "", instrument: "violao", notation: "letters", a4: 440, theme: "dark", accent: "orange",
    fontSize: 16, keepAwake: true, leftHanded: false, showDiagrams: true
  };
  function settings() { return Object.assign({}, DEFAULTS, get("settings", {})); }
  function setSetting(k, v) { update("settings", {}, function (s) { s[k] = v; }); }

  /* ---------- IndexedDB (gravações) ---------- */
  var dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error("IndexedDB indisponível")); return; }
      var r = indexedDB.open("omusico", 1);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains("rec")) d.createObjectStore("rec", { keyPath: "id" });
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction("rec", mode), st = t.objectStore("rec"), out;
        var r = fn(st);
        if (r) r.onsuccess = function () { out = r.result; };
        t.oncomplete = function () { res(out); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  var rec = {
    all: function () { return tx("readonly", function (s) { return s.getAll(); }).then(function (a) { return (a || []).sort(function (x, y) { return y.date - x.date; }); }); },
    put: function (o) { return tx("readwrite", function (s) { return s.put(o); }); },
    del: function (id) { return tx("readwrite", function (s) { return s.delete(id); }); }
  };

  /* ---------- backup ---------- */
  var BACKUP_KEYS = ["settings", "userSongs", "edits", "songPrefs", "favorites", "lists", "status", "notes", "history", "recent", "ex", "customInst", "practiceDays", "drumUser", "tuningSel", "metro"];
  function exportData() {
    var o = { app: "O Músico", version: 1, date: new Date().toISOString(), data: {} };
    BACKUP_KEYS.forEach(function (k) { var v = get(k, undefined); if (v !== undefined) o.data[k] = v; });
    return JSON.stringify(o, null, 1);
  }
  function importData(text) {
    var o = JSON.parse(text);
    if (!o || o.app !== "O Músico" || !o.data) throw new Error("Arquivo não é um backup do O Músico");
    Object.keys(o.data).forEach(function (k) { if (BACKUP_KEYS.indexOf(k) >= 0) set(k, o.data[k]); });
  }

  OM.store = { get: get, set: set, update: update, on: on, keys: keys, settings: settings, setSetting: setSetting, rec: rec,
    exportData: exportData, importData: importData };
})(window.OM);
