'use strict';

// All room poses use these measured character metrics. Runtime draws normalized
// pixels at 1:1, never independently fitting a master into a shot rectangle.
const SERA_LIORA_SCENE_METRICS = Object.freeze({
  canvas: Object.freeze({ width: 128, height: 192 }),
  foot: Object.freeze({ x: 64, y: 184 }),
  Sera: Object.freeze({ height: 146, faceWidth: 19.8, faceHeight: 20.2 }),
  Liora: Object.freeze({ height: 148, faceWidth: 20.2, faceHeight: 20.2 }),
  wake: Object.freeze({ width: 192, height: 216, headX: 96, headY: 28,
    faceWidth: 20, faceHeight: 20.2 }),
  cycle: Object.freeze([0, 1, 2, 1]),
  frameSeconds: 0.14,
  approach: Object.freeze({
    frames: 40, facing: 'down',
    from: Object.freeze({ x: 350, y: 285 }),
    to: Object.freeze({ x: 350, y: 345 }),
  }),
  beds: Object.freeze([
    Object.freeze({ id: 'left-bed', assetId: 'cutaway_left_bed_depth_v2', depth: 350 }),
    Object.freeze({ id: 'right-bed', assetId: 'cutaway_right_bed_depth_v2', depth: 350 }),
  ]),
});

function validateSeraLioraSceneMetrics() {
  const m = SERA_LIORA_SCENE_METRICS;
  const ratio = m.Liora.height / m.Sera.height;
  if (![m.canvas.width, m.canvas.height, m.foot.x, m.foot.y, m.approach.frames].every(Number.isSafeInteger) ||
      m.canvas.width <= 0 || m.canvas.height <= 0 || m.foot.x < 0 || m.foot.x >= m.canvas.width ||
      m.foot.y < 0 || m.foot.y >= m.canvas.height || !(m.frameSeconds > 0) ||
      m.beds.some(function(bed) { return !Number.isFinite(bed.depth); }))
    throw new Error('Invalid cutaway anchor/animation metrics');
  if (ratio < 1.01 || ratio > 1.02 ||
      ['faceWidth', 'faceHeight'].some(function(key) {
        return Math.abs(m.Sera[key] / m.Liora[key] - 1) > 0.05 ||
          Math.abs(m.wake[key] / m.Sera[key] - 1) > 0.05;
      })) throw new Error('Inconsistent cutaway character metrics');
  return true;
}
validateSeraLioraSceneMetrics();

function seraLioraApproachIsWalkable() {
  const a = SERA_LIORA_SCENE_METRICS.approach;
  for (let step = 0; step <= a.frames; step++) {
    const t = step / a.frames;
    if (!seraLioraFootprintWalkable(a.from.x + (a.to.x - a.from.x) * t,
        a.from.y + (a.to.y - a.from.y) * t)) return false;
  }
  return true;
}

// Animation derives from the existing timed reveal or actual movement owner.
// Drawing never advances a clock and spoken pages always select idle.
function seraLioraSceneSeraView() {
  const m = SERA_LIORA_SCENE_METRICS, a = m.approach;
  if (seraLioraCutscene.phase === 'free_walk') {
    const w = seraLioraGuestRoomWalk;
    return Object.freeze({ x: w.x, y: w.y, facing: w.facing,
      frame: w.moving && !dialogue.open ? w.animationFrame : 1 });
  }
  const revealing = seraLioraCutscene.phase === 'room_reveal';
  const moving = revealing && !dialogue.open;
  const elapsed = revealing ? Math.max(0, Math.min(a.frames, a.frames - seraLioraCutscene.waitFrames)) : a.frames;
  const t = elapsed / a.frames;
  return Object.freeze({ x: a.from.x + (a.to.x - a.from.x) * t,
    y: a.from.y + (a.to.y - a.from.y) * t, facing: a.facing,
    frame: moving ? m.cycle[Math.floor(elapsed * MS_PER_FRAME / 1000 / m.frameSeconds) % m.cycle.length] : 1 });
}

function drawSeraLioraSceneSera(view) {
  const m = SERA_LIORA_SCENE_METRICS;
  const image = loadedImageAsset('cutaway_sera_walk_depth_v2');
  if (!image) return;
  const row = ({ down: 0, up: 1, right: 2, left: 2 })[view.facing];
  const w = m.canvas.width, h = m.canvas.height;
  const x = Math.round(view.x - m.foot.x), y = Math.round(view.y - m.foot.y);
  ctx.save();
  if (view.facing === 'left') { ctx.translate(x + w, y); ctx.scale(-1, 1); }
  ctx.drawImage(image, view.frame * w, row * h, w, h,
    view.facing === 'left' ? 0 : x, view.facing === 'left' ? 0 : y, w, h);
  ctx.restore();
}

function drawSeraLioraDepthRoomActors() {
  const m = SERA_LIORA_SCENE_METRICS, sera = seraLioraSceneSeraView();
  const entries = m.beds.map(function(bed) {
    return { id: bed.id, layer: 'world', depth: bed.depth,
      draw: function() {
        ctx.drawImage(loadedImageAsset(bed.assetId), 0, 0);
        if (bed.id === 'right-bed') drawSeraLioraWakePose();
      } };
  });
  entries.push({ id: 'sera', layer: 'world', depth: sera.y,
    draw: function() { drawSeraLioraSceneSera(sera); } });
  if (seraLioraCutscene.lioraPose === 'standing') {
    const w = seraLioraGuestRoomWalk;
    entries.push({ id: 'liora', layer: 'world', depth: w.lioraY, draw: function() {
      ctx.drawImage(loadedImageAsset('cutaway_liora_standing_depth_v2'),
        Math.round(w.lioraX - m.foot.x), Math.round(w.lioraY - m.foot.y));
    } });
  }
  drawLayeredScene(entries);
}

function drawSeraLioraWakePose() {
  if (seraLioraCutscene.lioraPose === 'standing') return;
  const m = SERA_LIORA_SCENE_METRICS.wake;
  const sitting = seraLioraCutscene.lioraPose === 'sitting';
  const image = loadedImageAsset(sitting ? 'cutaway_liora_sitting_depth_v2' : 'cutaway_liora_lying_depth_v2');
  // Pose head anchors lie on the existing right pillow. Existing cover pixels
  // occlude legs; no room, mattress or furniture is synthesized or resized.
  ctx.save();
  ctx.beginPath(); ctx.rect(378, 150, 134, 88); ctx.clip();
  ctx.drawImage(image, 443 - m.headX, (sitting ? 177 : 197) - m.headY);
  ctx.restore();
  ctx.drawImage(loadedImageAsset('cutaway_right_cover_depth_v2'), 0, 0);
}
