'use strict';

// Small, authoritative registry for optional raster art. Declaring metadata has
// no browser side effects: Image objects are created lazily, once per id, only
// when a scene requests its bundle. Failed entries settle as errors so callers
// can use their code-drawn/portrait-free fallback without waiting forever.
const IMAGE_ASSET_REGISTRY = Object.freeze({
  cutaway_sera_neutral: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/sera-neutral-48x64.png',
    use: 'field_sprite', width: 48, height: 64,
    anchor: Object.freeze({ x: 24, y: 58 }),
  }),
  cutaway_liora_neutral: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/liora-neutral-48x64.png',
    use: 'field_sprite_later', width: 48, height: 64,
    anchor: Object.freeze({ x: 24, y: 58 }),
  }),
  cutaway_liora_asleep: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/liora-asleep-bed.png',
    use: 'bed_pose', width: 104, height: 41,
    anchor: Object.freeze({ x: 80, y: 21 }),
  }),
  cutaway_liora_sitting: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/liora-sitting-bed.png',
    use: 'bed_pose', width: 48, height: 57,
    anchor: Object.freeze({ x: 24, y: 52 }),
  }),
  cutaway_sera_close_standing: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/sera-standing.png',
    use: 'close_cutaway_pose', width: 96, height: 128,
    anchor: Object.freeze({ x: 48, y: 112 }),
  }),
  cutaway_liora_close_asleep: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/liora-asleep.png',
    use: 'close_cutaway_pose', width: 120, height: 64,
    anchor: Object.freeze({ x: 86, y: 46 }),
  }),
  cutaway_liora_close_sitting: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/liora-sitting.png',
    use: 'close_cutaway_pose', width: 80, height: 72,
    anchor: Object.freeze({ x: 40, y: 56 }),
  }),
  cutaway_sera_portrait: Object.freeze({
    path: 'assets/portraits/cutaways/sera-liora/sera-neutral.png',
    use: 'dialogue_portrait', width: 80, height: 96,
  }),
  cutaway_liora_portrait: Object.freeze({
    path: 'assets/portraits/cutaways/sera-liora/liora-neutral.png',
    use: 'dialogue_portrait', width: 80, height: 96,
  }),
});

const IMAGE_ASSET_BUNDLES = Object.freeze({
  sera_liora_opening: Object.freeze([
    'cutaway_sera_close_standing',
    'cutaway_liora_close_asleep',
    'cutaway_liora_close_sitting',
    'cutaway_sera_portrait',
    'cutaway_liora_portrait',
  ]),
});

const _imageAssetCache = Object.create(null);

function imageAssetRuntime(id) {
  if (!IMAGE_ASSET_REGISTRY[id]) return null;
  if (!_imageAssetCache[id]) {
    _imageAssetCache[id] = {
      status: 'idle', image: null, promise: null, error: null, createCount: 0,
    };
  }
  return _imageAssetCache[id];
}

function loadImageAsset(id) {
  const meta = IMAGE_ASSET_REGISTRY[id];
  const runtime = imageAssetRuntime(id);
  if (!meta || !runtime) return Promise.resolve(null);
  if (runtime.status === 'loaded' || runtime.status === 'error') return Promise.resolve(runtime);
  if (runtime.promise) return runtime.promise;

  runtime.status = 'loading';
  runtime.promise = new Promise(function(resolve) {
    if (typeof Image !== 'function') {
      runtime.status = 'error';
      runtime.error = new Error('Image constructor unavailable');
      resolve(runtime);
      return;
    }

    const image = new Image();
    runtime.createCount++;
    runtime.image = image;
    image.onload = function() {
      if (image.naturalWidth && image.naturalHeight &&
          (image.naturalWidth !== meta.width || image.naturalHeight !== meta.height)) {
        runtime.status = 'error';
        runtime.error = new Error('Unexpected dimensions for ' + id);
      } else {
        runtime.status = 'loaded';
      }
      resolve(runtime);
    };
    image.onerror = function() {
      runtime.status = 'error';
      runtime.error = new Error('Failed to load ' + meta.path);
      resolve(runtime);
    };
    image.src = meta.path;
  });
  return runtime.promise;
}

function preloadImageAssetBundle(bundleId) {
  const ids = IMAGE_ASSET_BUNDLES[bundleId] || [];
  return Promise.all(ids.map(loadImageAsset));
}

function imageAssetBundleSettled(bundleId) {
  const ids = IMAGE_ASSET_BUNDLES[bundleId] || [];
  return ids.every(function(id) {
    const runtime = imageAssetRuntime(id);
    return runtime && (runtime.status === 'loaded' || runtime.status === 'error');
  });
}

function loadedImageAsset(id) {
  const runtime = imageAssetRuntime(id);
  return runtime && runtime.status === 'loaded' ? runtime.image : null;
}

window.IMAGE_ASSET_REGISTRY = IMAGE_ASSET_REGISTRY;
window.IMAGE_ASSET_BUNDLES = IMAGE_ASSET_BUNDLES;
window.imageAssetRuntime = imageAssetRuntime;
window.loadImageAsset = loadImageAsset;
window.preloadImageAssetBundle = preloadImageAssetBundle;
window.imageAssetBundleSettled = imageAssetBundleSettled;
window.loadedImageAsset = loadedImageAsset;
