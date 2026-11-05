/* Persistent storage is optional; essential behavior has an in-memory fallback. */
(function () {
  const memory = {local:new Map(), session:new Map()};
  function store(area) { return area === 'session' ? window.sessionStorage : window.localStorage; }
  window.tdStorage = Object.freeze({
    get(area, key) {
      if (memory[area].has(key)) return memory[area].get(key);
      try { return store(area).getItem(key); } catch (_) { return null; }
    },
    set(area, key, value) {
      const text = String(value); memory[area].set(key, text);
      try { store(area).setItem(key, text); } catch (_) {}
    },
    remove(area, key) {
      memory[area].set(key, null);
      try { store(area).removeItem(key); } catch (_) {}
    }
  });
  window.addEventListener('storage', event => { if (event.key) memory.local.delete(event.key); else memory.local.clear(); });
})();
