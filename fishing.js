'use strict';

// fishing.js — the real-time fishing minigame (a modal that replaces the screen
// while active, exactly like combat). It is a timed button-prompt (QTE) game: a
// short sequence of key prompts appears one at a time and each must be pressed,
// correctly and within a shrinking window, or the fish escapes. Rod power scales
// the difficulty (see bestFishingPower(), items.js): a stronger rod means a
// SHORTER sequence and a WIDER timing window. Casting costs one Bait (spent by
// the caller in the fishing-spot interaction before startFishing() is called).
//
// State is battle-local ONLY — never serialized (like `combat`, it is not part of
// the save payload). update()/render()/input.js all gate on `fishing.active` the
// same way they gate on `combat.active`, and updateFishing()/drawFishing()/
// handleFishingKey() are their fishing counterparts.

const fishing = {
  active:       false,
  phase:        'play',   // 'play' | 'result'
  seq:          [],       // prompt keys: 'left'|'right'|'up'|'down'|'space'
  idx:          0,        // index of the current prompt
  timer:        0,        // frames left to hit the current prompt
  windowFrames: 40,       // frames allowed per prompt (scales with rod power)
  power:        1,        // rod power this cast
  flash:        0,        // hit/miss flash frames remaining
  flashType:    null,     // 'hit' | 'miss'
  result:       null,     // { win, title, lines } once resolved
};

// Difficulty from rod power. Old Fishing Rod (power 1): 7 prompts, ~0.57s each —
// deliberately punishing. Each rod tier trims a prompt and widens the window.
function fishingSeqLength(power)    { return Math.max(3, 8 - power); }   // p1:7 p2:6 p3:5
function fishingWindowFrames(power) { return 24 + 10 * power; }          // p1:34 p2:44 p3:54

const FISHING_KEYS = ['left', 'right', 'up', 'down', 'space'];
// Raw keydown value -> prompt token.
const FISHING_KEY_MAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', ' ': 'space' };

// Begin a cast. `power` is the player's best rod power (>= 1). The Bait has
// already been consumed by the caller.
function startFishing(power) {
  const p = Math.max(1, power || 1);
  const len = fishingSeqLength(p);
  const seq = [];
  for (let i = 0; i < len; i++) seq.push(FISHING_KEYS[Math.floor(Math.random() * FISHING_KEYS.length)]);
  fishing.active       = true;
  fishing.phase        = 'play';
  fishing.seq          = seq;
  fishing.idx          = 0;
  fishing.power        = p;
  fishing.windowFrames = fishingWindowFrames(p);
  fishing.timer        = fishing.windowFrames;
  fishing.flash        = 0;
  fishing.flashType    = null;
  fishing.result       = null;
}

// Per-frame advance (called from update() while fishing.active). Only the timeout
// clock lives here; hits/misses are driven by input (handleFishingKey).
function updateFishing() {
  if (fishing.flash > 0) fishing.flash--;
  if (fishing.phase !== 'play') return;
  if (fishing.timer > 0) fishing.timer--;
  if (fishing.timer <= 0) fishingMiss('Too slow — the line goes slack.');
}

// A keydown while fishing.active. In the play phase it is a prompt attempt; in the
// result phase any confirm/cancel dismisses the minigame.
function handleFishingKey(key) {
  if (fishing.phase === 'result') {
    if (key === ' ' || key === 'Enter' || key === 'Escape') endFishing();
    return;
  }
  if (key === 'Escape') { fishingMiss('You give up on the cast.'); return; }
  const pressed = FISHING_KEY_MAP[key];
  if (!pressed) return;                       // a non-game key: ignored, no penalty
  if (pressed === fishing.seq[fishing.idx]) {
    fishing.idx++;
    fishing.flash = 6; fishing.flashType = 'hit';
    if (fishing.idx >= fishing.seq.length) fishingSuccess();
    else fishing.timer = fishing.windowFrames;
  } else {
    fishingMiss('Wrong move — it thrashes off the hook.');
  }
}

function fishingMiss(reason) {
  fishing.phase = 'result';
  fishing.flash = 8; fishing.flashType = 'miss';
  fishing.result = { win: false, title: 'IT GOT AWAY', lines: [reason, 'The bait is gone.'] };
}

function fishingSuccess() {
  fishing.phase = 'result';
  fishing.flash = 8; fishing.flashType = 'hit';
  fishing.result = resolveFishingCatch(fishing.power);
}

// Decide the catch on a successful reel-in. A better rod tilts toward the Canal
// Eel (the valuable catch); the Sealed Letter is the rare one-time flavour find.
function resolveFishingCatch(power) {
  if (Math.random() < 0.04 && !stats.items.some(i => i.name === 'Sealed Letter')) {
    grantItem('Sealed Letter');
    return { win: true, title: 'CAUGHT!', lines: ['A sealed letter, snagged and mostly dry.', 'Added to items.'] };
  }
  const r = Math.random();
  const eelChance = 0.15 + 0.12 * power;      // p1: 27%  p2: 39%  p3: 51%
  if (r < 0.10) {
    grantItem('Old Boot');
    return { win: true, title: '…A BOOT', lines: ['You reel up an Old Boot.', 'Added to items.'] };
  }
  if (r < 0.10 + eelChance) {
    grantItem('Canal Eel');
    return { win: true, title: 'CAUGHT!', lines: ['A Canal Eel — long, dark, and furious.', 'Added to items.'] };
  }
  grantItem('River Smelt');
  return { win: true, title: 'CAUGHT!', lines: ['A River Smelt — small, cold, indignant.', 'Added to items.'] };
}

function endFishing() {
  fishing.active = false;
  fishing.phase  = 'play';
  fishing.result = null;
  fishing.seq    = [];
}

// ─── Rendering (full-screen modal, drawn instead of the world) ───────────────
const FISHING_GLYPH = { left: '◄', right: '►', up: '▲', down: '▼', space: 'SPACE' };
const FISHING_LABEL = { left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', space: 'SPACE' };

function drawFishing() {
  // Backdrop — deep water.
  ctx.fillStyle = '#0a1c28';
  ctx.fillRect(0, 0, 512, 480);
  ctx.fillStyle = 'rgba(30, 80, 110, 0.25)';
  for (let y = 40; y < 480; y += 40) ctx.fillRect(0, y, 512, 2);

  ctx.textAlign = 'center';

  if (fishing.phase === 'result') { drawFishingResult(); ctx.textAlign = 'left'; return; }

  // Title + rod power.
  ctx.fillStyle = '#cfe8f2';
  ctx.font = 'bold 20px "Courier New", monospace';
  ctx.fillText('F I S H I N G', 256, 60);
  ctx.fillStyle = '#7fb0c4';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('Hit the prompt shown — before the bar runs out. One miss and it’s gone.', 256, 84);

  // Sequence dots (progress).
  const n = fishing.seq.length;
  const dotGap = 26, dotY = 150;
  const startX = 256 - ((n - 1) * dotGap) / 2;
  for (let i = 0; i < n; i++) {
    const dx = startX + i * dotGap;
    if (i < fishing.idx)      ctx.fillStyle = '#3fbf6f';   // done
    else if (i === fishing.idx) ctx.fillStyle = '#ffd24a'; // current
    else                       ctx.fillStyle = '#274a5a';  // upcoming
    ctx.beginPath(); ctx.arc(dx, dotY, i === fishing.idx ? 7 : 5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#9fc4d4';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(`${fishing.idx} / ${n}`, 256, dotY + 26);

  // The big current prompt.
  const cur = fishing.seq[fishing.idx];
  const hit = fishing.flash > 0 && fishing.flashType === 'hit';
  ctx.fillStyle = hit ? '#3fbf6f' : '#123243';
  ctx.fillRect(196, 210, 120, 90);
  ctx.strokeStyle = hit ? '#8fffb8' : '#4a8aa4';
  ctx.lineWidth = 3;
  ctx.strokeRect(196, 210, 120, 90);
  ctx.fillStyle = '#eaf6fb';
  if (cur === 'space') {
    ctx.font = 'bold 26px "Courier New", monospace';
    ctx.fillText('SPACE', 256, 265);
  } else {
    ctx.font = 'bold 54px "Courier New", monospace';
    ctx.fillText(FISHING_GLYPH[cur], 256, 275);
  }
  ctx.fillStyle = '#7fb0c4';
  ctx.font = '10px "Courier New", monospace';
  ctx.fillText('press  ' + FISHING_LABEL[cur], 256, 315);

  // Timing bar for the current prompt.
  const barW = 260, barX = 256 - barW / 2, barY = 345;
  ctx.fillStyle = '#0d2531';
  ctx.fillRect(barX, barY, barW, 16);
  const frac = Math.max(0, fishing.timer / fishing.windowFrames);
  ctx.fillStyle = frac > 0.5 ? '#3fbf6f' : frac > 0.25 ? '#ffd24a' : '#e0533a';
  ctx.fillRect(barX, barY, Math.round(barW * frac), 16);
  ctx.strokeStyle = '#4a8aa4'; ctx.lineWidth = 2;
  ctx.strokeRect(barX, barY, barW, 16);

  ctx.fillStyle = '#6a94a6';
  ctx.font = '10px "Courier New", monospace';
  ctx.fillText('Esc to cut the line', 256, 400);
  ctx.textAlign = 'left';
}

function drawFishingResult() {
  const res = fishing.result || { win: false, title: '', lines: [] };
  ctx.fillStyle = res.win ? '#3fbf6f' : '#e0533a';
  ctx.font = 'bold 30px "Courier New", monospace';
  ctx.fillText(res.title, 256, 190);
  ctx.fillStyle = '#dbeaf1';
  ctx.font = '13px "Courier New", monospace';
  let ly = 235;
  for (const line of res.lines) { ctx.fillText(line, 256, ly); ly += 24; }
  ctx.fillStyle = '#7fb0c4';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('Press SPACE', 256, ly + 20);
}

if (typeof window !== 'undefined') {
  window.fishing          = fishing;
  window.startFishing     = startFishing;
  window.updateFishing    = updateFishing;
  window.handleFishingKey = handleFishingKey;
  window.endFishing       = endFishing;
  window.drawFishing      = drawFishing;
  window.resolveFishingCatch = resolveFishingCatch;
  window.fishingSeqLength  = fishingSeqLength;
}
