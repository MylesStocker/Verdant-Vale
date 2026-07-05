'use strict';

// game-loop.js — the fixed-step (60fps-capped) update/render loop.

// ─── Game Loop (capped at 60 fps) ─────────────────────────────────────────────
let lastTime = 0;

function loop(timestamp) {
  const elapsed = timestamp - lastTime;
  if (elapsed >= MS_PER_FRAME) {
    // Absorb any lag without spiraling: only advance by the frame remainder
    lastTime = timestamp - (elapsed % MS_PER_FRAME);
    update();
    render();
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

