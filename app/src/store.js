/* Giri Garden — kho dữ liệu: bọc `db` của artifact, tự lùi về bộ nhớ khi kho không dùng được.
   Bố cục: app/projects = {projects}; months/<YYYY-MM> = {todos, days}. */
(function () {
  'use strict';
  var GG = globalThis.GG || (typeof require !== 'undefined' ? require('./logic.js') : null);

  function create(opts) {
    var db = opts.db || null, delay = opts.delay == null ? 300 : opts.delay;
    var onChange = opts.onChange || function () {}, onStatus = opts.onStatus || function () {};
    var state = GG.emptyState(), written = {}, remote = { projects: null, months: {} };
    var timer = null, pending = Promise.resolve(), dirty = false, loaded = false, subscribed = false, status = null;

    function setStatus(s) { if (s !== status) { status = s; onStatus(s); } }
    function clone(x) { return JSON.parse(JSON.stringify(x)); }
    function docsOf(st) {
      var parts = GG.splitState(st), out = { 'app/projects': JSON.stringify(parts.projects) };
      Object.keys(parts.months).forEach(function (k) { out['months/' + k] = JSON.stringify(parts.months[k]); });
      return out;
    }

    /* ghi nhận điều ta biết chắc về một tài liệu trong kho, để một bản chụp của nửa kia không kéo nó về bản cũ */
    function known(path, body) {
      if (path === 'app/projects') remote.projects = body;
      else if (body === null) delete remote.months[path.slice(7)];
      else remote.months[path.slice(7)] = body;
    }

    function write() {
      if (!db) { setStatus('offline'); return Promise.resolve(); }
      if (!loaded) { setStatus('error'); return Promise.resolve(); }
      var want = docsOf(state), ops = [];
      Object.keys(want).forEach(function (p) {
        if (written[p] !== want[p]) ops.push(db.doc(p).set(JSON.parse(want[p])).then(function () { written[p] = want[p]; known(p, JSON.parse(want[p])); }));
      });
      Object.keys(written).forEach(function (p) {
        if (!(p in want)) ops.push(db.doc(p).delete().then(function () { delete written[p]; known(p, null); }));
      });
      if (!ops.length) { dirty = !!timer; setStatus(timer ? 'saving' : 'saved'); return Promise.resolve(); }
      setStatus('saving');
      return Promise.all(ops.map(function (o) { return o.then(function () { return true; }, function () { return false; }); })).then(function (res) {
        if (res.every(Boolean)) { dirty = !!timer; setStatus(timer ? 'saving' : 'saved'); }
        else setStatus('error');
      });
    }
    function schedule() {
      if (!db) { setStatus('offline'); return; }
      if (!loaded) { setStatus('error'); return; }
      setStatus('saving');
      clearTimeout(timer);
      timer = setTimeout(function () { timer = null; pending = write(); }, delay);
    }

    function adopt() {
      var st = GG.joinState(remote), docs = docsOf(st);
      if (JSON.stringify(docs) === JSON.stringify(docsOf(state))) { written = docs; return; }
      state = st; written = docs; onChange(state);
    }
    function busy(snap) { return dirty || timer || (snap.metadata && snap.metadata.hasPendingWrites); }
    function unsure(snap) { return !!(snap.metadata && snap.metadata.fromCache); }
    function subscribe() {
      if (subscribed) return; subscribed = true;
      db.doc('app/projects').onSnapshot(function (snap) {
        if (unsure(snap)) return;
        remote.projects = snap.exists ? clone(snap.data()) : null;
        if (busy(snap)) return;
        adopt();
      }, function () {});
      db.collection('months').onSnapshot(function (qs) {
        if (unsure(qs)) return;
        remote.months = {};
        qs.docs.forEach(function (d) { remote.months[d.id] = clone(d.data()); });
        if (busy(qs)) return;
        adopt();
      }, function () {});
    }
    function load() {
      if (!db) { loaded = true; setStatus('offline'); onChange(state); return Promise.resolve(); }
      return Promise.all([db.doc('app/projects').get(), db.collection('months').get()]).then(function (r) {
        remote.projects = r[0].exists ? clone(r[0].data()) : null;
        remote.months = {};
        r[1].docs.forEach(function (d) { remote.months[d.id] = clone(d.data()); });
        var kept = dirty ? state : null;                   // thay đổi làm trong lúc chưa tải được
        state = GG.joinState(remote); written = docsOf(state); loaded = true;
        onChange(state); setStatus('saved'); subscribe();
        if (kept) { dirty = false; }
      }, function () { loaded = false; onChange(state); setStatus('error'); });
    }

    var api = {
      ready: null,
      state: function () { return state; },
      status: function () { return status; },
      apply: function (fn) {
        var next = fn(state);
        if (next === state) return;
        state = next; dirty = true; onChange(state); schedule();
      },
      replaceAll: function (st) {
        clearTimeout(timer); timer = null;
        state = st; dirty = true; onChange(state);
        pending = write();
        return pending.then(function () { return status; });
      },
      retry: function () {
        if (db && !loaded) { api.ready = load(); return; }
        clearTimeout(timer); timer = null; pending = write();
      },
      flush: function () {
        if (timer) { clearTimeout(timer); timer = null; pending = write(); }
        return pending;
      }
    };
    api.ready = load();
    return api;
  }

  var GGStore = { create: create };
  globalThis.GGStore = GGStore;
  if (typeof module !== 'undefined') module.exports = GGStore;
})();
