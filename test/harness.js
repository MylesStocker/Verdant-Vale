'use strict';
// test/harness.js
//
// Headless runtime environment for the empire-game browser scripts. There is
// no build step and no test framework in this project (plain <script> tags,
// globals shared across files) — so instead of a DOM/browser we give each
// script file a minimal stand-in for `document`/`canvas`/`window` and run
// them, in the exact order index.html loads them, inside one Node `vm`
// context per test. That context is a faithful stand-in for a browser tab:
// top-level `let`/`const`/`function` declared by one script are visible as
// bare globals to every script run afterwards, exactly like real <script>
// tags sharing one global scope.
//
// Each call to createContext() parses index.html for its current script
// order and loads exactly that — so this harness stays correct if files are
// ever added, removed, or reordered there, without needing to be edited.

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

const ROOT = path.join(__dirname, '..');

// ── Canvas 2D context stub ──────────────────────────────────────────────────
// Every drawing call is a no-op; we only care that render code *runs* without
// throwing, not what it would have drawn. Proxy so any ctx.* method the game
// calls (now or in the future) is automatically covered.
function makeCtxStub() {
  const known = {
    canvas: { width: 512, height: 480 },
    measureText: () => ({ width: 40 }),
    createRadialGradient: () => ({ addColorStop: () => {} }),
    createLinearGradient: () => ({ addColorStop: () => {} }),
    createPattern: () => null,
    getImageData: () => ({ data: [] }),
  };
  return new Proxy(known, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') return () => {}; // any other method -> no-op
      return undefined;
    },
    set(target, prop, val) { target[prop] = val; return true; }, // fillStyle, font, etc.
  });
}

// ── In-memory localStorage stub (for save.js) ───────────────────────────────
function makeLocalStorageStub() {
  const store = new Map();
  return {
    getItem:    (k) => (store.has(k) ? store.get(k) : null),
    setItem:    (k, v) => { store.set(k, String(v)); },
    removeItem: (k) => { store.delete(k); },
    clear:      () => { store.clear(); },
  };
}

// Reads index.html and returns the ordered list of local <script src="...">
// files, so the harness always mirrors the real load order.
function scriptOrderFromIndexHtml() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const re = /<script\s+src="([^"]+\.js)"\s*>\s*<\/script>/g;
  const files = [];
  let m;
  while ((m = re.exec(html))) files.push(m[1]);
  if (files.length === 0) {
    throw new Error('harness: found no <script src="*.js"> tags in index.html — is the file layout unchanged?');
  }
  return files;
}

// Creates one fresh, isolated game environment: a new vm context with every
// script loaded into it in index.html order. Each test case should call this
// itself (rather than sharing a context with other cases) so tests can't leak
// state into one another.
function createContext() {
  const ctxStub = makeCtxStub();
  const canvasStub = {
    getContext: () => ctxStub,
    focus: () => {},
    width: 512, height: 480,
    addEventListener: () => {},
  };
  const titleElStub = { textContent: '' };
  const documentStub = {
    getElementById: (id) => {
      if (id === 'game')  return canvasStub;
      if (id === 'title') return titleElStub;
      return { textContent: '' };
    },
  };

  const listeners = { keydown: [], keyup: [] };

  const sandbox = {
    console,
    document: documentStub,
    localStorage: makeLocalStorageStub(),
    Math, JSON, Object, Array, String, Number, Boolean, Date, RegExp, Map, Set,
    Promise, Error, isNaN, parseInt, parseFloat,
  };
  sandbox.window = sandbox; // classic-script semantics: window IS the global scope
  sandbox.window.addEventListener = (type, fn) => {
    if (listeners[type]) listeners[type].push(fn);
  };
  // Don't actually recurse the game loop — tests drive update()/render() by hand.
  sandbox.requestAnimationFrame = (fn) => { sandbox.__rafQueued = fn; return 1; };

  const vmContext = vm.createContext(sandbox);

  for (const file of scriptOrderFromIndexHtml()) {
    const code = fs.readFileSync(path.join(ROOT, file), 'utf8');
    vm.runInContext(code, vmContext, { filename: file });
  }

  // TEST-ONLY fixture helpers, injected as vm globals AFTER production loads — they
  // deliberately do NOT exist in production (regional-position.js). They let a test
  // that hand-assigns activeMap/player.x/y reconcile the canonical position, and are
  // reachable only inside the harness context, never through gameplay/debug/API.
  vm.runInContext(`
    function __setRegionalPositionForTest(regionId, worldPxX, worldPxY) { return commitRegionalWorldPosition(regionId, worldPxX, worldPxY); }
    function __clearRegionalPositionForTest() { clearRegionalPosition(); }
    function __reconcileCanonicalForTest() {
      var mapId = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
      if (mapId) placeAtLocation(mapId, player.x, player.y);
    }
  `, vmContext, { filename: 'harness-test-fixtures' });

  return {
    /** Evaluate an expression/statement inside the game's global scope and return its value. */
    run(code) {
      return vm.runInContext(code, vmContext, { filename: 'harness-eval' });
    },
    /** Fire a real keydown, immediately followed by keyup (a single tap). */
    press(key) {
      for (const fn of listeners.keydown) fn({ key, preventDefault() {} });
      for (const fn of listeners.keyup)   fn({ key });
    },
    /** Fire keydown only (key stays "held" in the `keys` table until release()). */
    hold(key) {
      for (const fn of listeners.keydown) fn({ key, preventDefault() {} });
    },
    /** Fire keyup only. */
    release(key) {
      for (const fn of listeners.keyup) fn({ key });
    },
    /** Call the game's update() n times (default 1). */
    frames(n) {
      n = n === undefined ? 1 : n;
      for (let i = 0; i < n; i++) vm.runInContext('update()', vmContext);
    },
    /** Call the game's render() once. */
    renderFrame() {
      vm.runInContext('render()', vmContext);
    },
  };
}

module.exports = { createContext, scriptOrderFromIndexHtml };
