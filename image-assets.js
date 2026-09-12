'use strict';

// Small, authoritative registry for optional raster art. Declaring metadata has
// no browser side effects: Image objects are created lazily, once per id, only
// when a scene requests its bundle. Failed entries settle as errors so callers
// can use their code-drawn/portrait-free fallback without waiting forever.
const IMAGE_ASSET_REGISTRY = Object.freeze({
  cutaway_bethany_guest_room_redraw_v1: Object.freeze({
    path: 'assets/backgrounds/cutaways/sera-liora/guest-room-redraw-v1-runtime.png',
    use: 'cutaway_background', width: 512, height: 480,
  }),
  cutaway_liora_bed_lying_under_covers_v1: Object.freeze({
    path: 'Art/generated/sera-liora/liora-bed-lying-under-covers-v1-patch.png',
    use: 'cutaway_bed_state_patch', width: 144, height: 264,
  }),
  cutaway_liora_bed_sitting_under_covers_v1: Object.freeze({
    path: 'Art/generated/sera-liora/liora-bed-sitting-under-covers-v1-patch.png',
    use: 'cutaway_bed_state_patch', width: 144, height: 264,
  }),
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
  cutaway_sera_close_standing_fit_v2: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/sera-standing-fit-v2.png',
    use: 'close_cutaway_pose_fit_test', width: 112, height: 168,
    anchor: Object.freeze({ x: 56, y: 159 }),
  }),
  cutaway_sera_walk_cycle_v1: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/sera-walk-cycle-3x3-v1.png',
    use: 'close_cutaway_walk_sheet', width: 336, height: 504,
    frameWidth: 112, frameHeight: 168,
    anchor: Object.freeze({ x: 56, y: 164 }),
  }),
  cutaway_liora_close_standing_master_v1: Object.freeze({
    path: 'Art/generated/sera-liora/liora-standing-actor-master-v1.png',
    use: 'close_cutaway_pose_highres', width: 1024, height: 1536,
    displayWidth: 112, displayHeight: 168,
    anchor: Object.freeze({ x: 56, y: 163 }),
  }),
  cutaway_liora_close_asleep: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/liora-asleep.png',
    use: 'close_cutaway_pose', width: 120, height: 64,
    anchor: Object.freeze({ x: 86, y: 46 }),
  }),
  cutaway_liora_close_asleep_fit_v1: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/liora-asleep-fit-v1.png',
    use: 'close_cutaway_pose_fit_test', width: 160, height: 80,
    anchor: Object.freeze({ x: 126, y: 45 }),
  }),
  cutaway_liora_close_asleep_north_v1: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/liora-lying-north-v1.png',
    use: 'close_cutaway_pose_highres', width: 1024, height: 1535,
    displayWidth: 112, displayHeight: 168,
    anchor: Object.freeze({ x: 56, y: 159 }),
  }),
  cutaway_liora_close_sitting: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/liora-sitting.png',
    use: 'close_cutaway_pose', width: 80, height: 72,
    anchor: Object.freeze({ x: 40, y: 56 }),
  }),
  cutaway_liora_close_sitting_fit_v1: Object.freeze({
    path: 'assets/sprites/cutaways/sera-liora/close/liora-sitting-fit-v1.png',
    use: 'close_cutaway_pose_fit_test', width: 96, height: 112,
    anchor: Object.freeze({ x: 48, y: 90 }),
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
    'cutaway_bethany_guest_room_redraw_v1',
    'cutaway_liora_bed_lying_under_covers_v1',
    'cutaway_liora_bed_sitting_under_covers_v1',
    'cutaway_sera_close_standing_fit_v2',
    'cutaway_sera_close_standing',
    'cutaway_sera_walk_cycle_v1',
    'cutaway_liora_close_standing_master_v1',
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
