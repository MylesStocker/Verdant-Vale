'use strict';

// Presentation-only painter ordering. Collision, animation and gameplay owners
// supply their views; this primitive never updates them or retains entries.
const SCENE_DEPTH_LAYERS = Object.freeze({ rear: 0, world: 1, foreground: 2, ui: 3 });
function orderedSceneEntries(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Scene entries must be an array');
  const ids = new Set();
  const prepared = entries.map(function(entry, index) {
    if (!entry || Object.getPrototypeOf(entry) !== Object.getPrototypeOf({}))
      throw new TypeError('Scene entry must be a plain record');
    const descriptors = Object.getOwnPropertyDescriptors(entry);
    const fields = ['id', 'layer', 'depth', 'draw'];
    if (Reflect.ownKeys(descriptors).length !== fields.length ||
        fields.some(function(key) { return !descriptors[key] || !('value' in descriptors[key]); }))
      throw new TypeError('Invalid scene entry fields');
    if (typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) ||
        !Object.hasOwn(SCENE_DEPTH_LAYERS, entry.layer) ||
        !Number.isFinite(entry.depth) || typeof entry.draw !== 'function')
      throw new TypeError('Invalid scene entry');
    ids.add(entry.id);
    return { entry: entry, index: index };
  });
  prepared.sort(function(a, b) {
    return SCENE_DEPTH_LAYERS[a.entry.layer] - SCENE_DEPTH_LAYERS[b.entry.layer] ||
      a.entry.depth - b.entry.depth || a.index - b.index;
  });
  return Object.freeze(prepared.map(function(item) { return item.entry; }));
}
function drawLayeredScene(entries) {
  // Validate the entire plan before invoking any draw callback.
  const ordered = orderedSceneEntries(entries);
  for (const entry of ordered) entry.draw();
}
