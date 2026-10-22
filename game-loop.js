'use strict';

// Transient fail-stop boundary. Preserve the FIRST fault and live state for
// diagnosis; never replay a partially applied update or save it automatically.
// Reloading the page is the recovery route. This is not a saved game field.
const gameRuntimeFailure = (() => {
  let diagnostic = null;
  const draw = () => {
    // Independent of the failed world renderer. The DOM title is a fallback
    // if the Canvas/context itself failed. Neither path changes gameplay state.
    try { titleEl.textContent = 'Game paused after an error. Reload to recover your last save.'; } catch (_) {}
    try {
      ctx.save();
      try {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#0c121c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#e0d0c0'; ctx.font = '14px "Courier New", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const lines = ['Game paused after an error.', 'Reload to recover your last save.', 'Diagnostic retained in the console.'];
        lines.forEach((line, i) => ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (i - 1) * 22, canvas.width - 24));
      } finally { ctx.restore(); }
    } catch (_) {} // Do not replace the original diagnostic with a fallback fault.
  };
  return Object.freeze({
    isActive: () => diagnostic !== null,
    getDiagnostic: () => diagnostic,
    capture(phase, error) {
      if (!diagnostic) {
        diagnostic = Object.freeze({ phase, error });
        console.error('[game-loop] Gameplay paused; reload required.', diagnostic);
      }
    },
    draw,
  });
})();

// Existing 60fps cap and update timing are unchanged.
function presentationFrameDelta(deltaSeconds) {
  if(deltaSeconds===undefined)return 1; // direct deterministic/headless tick
  if(!Number.isFinite(deltaSeconds)||deltaSeconds<0)throw new Error('Invalid presentation delta');
  return deltaSeconds * (1000 / MS_PER_FRAME);
}
let lastTime = 0;
let lastPresentationTime = 0;
function loop(timestamp) {
  let phase = 'update';
  try {
    if (gameRuntimeFailure.isActive()) { gameRuntimeFailure.draw(); return; }
    const elapsed = timestamp - lastTime;
    if (elapsed >= MS_PER_FRAME) {
      lastTime = timestamp - (elapsed % MS_PER_FRAME);
      const presentationSeconds=(timestamp-lastPresentationTime)/1000;
      lastPresentationTime=timestamp;
      update(elapsed / 1000,presentationSeconds);
      phase = 'render';
      render();
    }
  } catch (error) {
    gameRuntimeFailure.capture(phase, error);
    gameRuntimeFailure.draw();
  } finally {
    requestAnimationFrame(loop);
  }
}
requestAnimationFrame(loop);
