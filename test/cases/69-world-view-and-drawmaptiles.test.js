'use strict';
// Continuous-overworld prework (behaviour-neutral):
//   • world-view.js — PURE camera / chunk-visibility calculations (region pixel
//     bounds, clamped camera origin, viewport→visible-chunk intersection with
//     half-open no-duplicate semantics, per-chunk local tile slice).
//   • render-tiles.js drawMapTiles() — the extracted, parameterized tile-map
//     draw loop (explicit map, optional origin, optional local row/col range).
//
// Deterministic; no RNG. drawMapTiles is verified by spying on the global
// drawTile() (reassignable function declaration) and comparing the exact
// (id,x,y) call sequence — no real canvas needed.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Capture drawMapTiles(...args) as an array of [id, x, y] draw calls, in order.
function captureDraw(g, argsExpr) {
  return JSON.parse(g.run(`(function(){
    var calls=[]; var orig=drawTile;
    drawTile=function(id,x,y){ calls.push([id,x,y]); };
    try { drawMapTiles(${argsExpr}); } finally { drawTile=orig; }
    return JSON.stringify(calls);
  })()`));
}

module.exports = {
  name: 'world-view + drawMapTiles: pure camera/visibility calc and parameterized tile draw',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    const TILE = g.run('TILE'), COLS = g.run('COLS'), ROWS = g.run('ROWS');
    assert.equal(TILE, 32); assert.equal(COLS, 16); assert.equal(ROWS, 15);
    const CW = COLS * TILE, CH = ROWS * TILE; // 512 × 480 chunk px
    const regionId = 'overworld';

    // ── drawMapTiles: default output == former complete row-major loop ───────
    {
      const expected = JSON.parse(g.run(`(function(){
        var e=[]; for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++)e.push([activeMap[r][c], c*TILE, r*TILE]);
        return JSON.stringify(e);
      })()`));
      const actual = captureDraw(g, 'activeMap');
      assert.equal(actual.length, ROWS * COLS, 'draws exactly ROWS*COLS tiles');
      assert.deepEqual(actual, expected, 'default drawMapTiles matches the old inline loop exactly (ids, coords, order)');
    }

    // ── Non-zero origin shifts every tile coordinate; ids/order unchanged ────
    {
      const base = captureDraw(g, 'activeMap');
      const shifted = captureDraw(g, 'activeMap, 100, 40');
      assert.equal(shifted.length, base.length, 'same number of tiles');
      for (let i = 0; i < base.length; i++) {
        assert.equal(shifted[i][0], base[i][0], 'tile id unchanged at index ' + i);
        assert.equal(shifted[i][1], base[i][1] + 100, 'x shifted by origin at index ' + i);
        assert.equal(shifted[i][2], base[i][2] + 40, 'y shifted by origin at index ' + i);
      }
    }

    // ── Restricted local row/col range draws exactly the expected cells ──────
    {
      const calls = captureDraw(g, 'activeMap, 0, 0, { startCol:2, endCol:5, startRow:1, endRow:3 }');
      const expected = JSON.parse(g.run(`(function(){
        var e=[]; for(var r=1;r<3;r++)for(var c=2;c<5;c++)e.push([activeMap[r][c], c*TILE, r*TILE]);
        return JSON.stringify(e);
      })()`));
      assert.deepEqual(calls, expected, 'range draws exactly rows [1,3) cols [2,5) in row-major order');
      assert.equal(calls.length, 2 * 3, 'a 2×3 slice = 6 cells');
    }

    // ── Region pixel bounds for the current 5×6 envelope ────────────────────
    {
      const b = JSON.parse(g.run(`JSON.stringify(regionPixelBounds('${regionId}'))`));
      assert.deepEqual(
        { minChunkX: b.minChunkX, minChunkY: b.minChunkY, maxChunkX: b.maxChunkX, maxChunkY: b.maxChunkY },
        { minChunkX: 0, minChunkY: 0, maxChunkX: 4, maxChunkY: 5 }, 'chunk extents span the 5×6 envelope');
      assert.equal(b.leftPx, 0); assert.equal(b.topPx, 0);
      assert.equal(b.rightPx, 5 * CW, 'right px exclusive = 5 chunks wide');
      assert.equal(b.bottomPx, 6 * CH, 'bottom px exclusive = 6 chunks tall');
      assert.equal(b.widthPx, 2560); assert.equal(b.heightPx, 2880);
      assert.equal(g.run(`regionPixelBounds('nope')`), null, 'unknown regionId -> null bounds');
    }

    // ── Camera origin: centered, and clamped at both edges (integer/aligned) ─
    {
      const center = JSON.parse(g.run(`JSON.stringify(cameraOriginForTarget('${regionId}', 1280, 1440, 512, 480))`));
      assert.deepEqual(center, { camPxX: 1280 - 256, camPxY: 1440 - 240 }, 'centred camera origin');
      const low = JSON.parse(g.run(`JSON.stringify(cameraOriginForTarget('${regionId}', 0, 0, 512, 480))`));
      assert.deepEqual(low, { camPxX: 0, camPxY: 0 }, 'clamped to top-left edge (no negative origin)');
      const high = JSON.parse(g.run(`JSON.stringify(cameraOriginForTarget('${regionId}', 999999, 999999, 512, 480))`));
      assert.deepEqual(high, { camPxX: 2560 - 512, camPxY: 2880 - 480 }, 'clamped to bottom-right edge');
      for (const v of [center.camPxX, center.camPxY, high.camPxX, high.camPxY])
        assert.ok(Number.isInteger(v), 'camera origin is integer/pixel-aligned');
      assert.equal(g.run(`cameraOriginForTarget('nope', 0, 0, 512, 480)`), null, 'unknown regionId -> null');
    }

    // Helper: assert a visibleChunks result is row-major and has valid ranges.
    const assertValid = (chunks, label) => {
      for (const ch of chunks) {
        assert.ok(ch.startCol >= 0 && ch.endCol <= COLS && ch.startCol < ch.endCol, label + ': valid col range');
        assert.ok(ch.startRow >= 0 && ch.endRow <= ROWS && ch.startRow < ch.endRow, label + ': valid row range');
        assert.equal(ch.worldPxX, ch.chunkX * CW, label + ': stable world px X');
        assert.equal(ch.worldPxY, ch.chunkY * CH, label + ': stable world px Y');
      }
      for (let i = 1; i < chunks.length; i++) {
        const a = chunks[i - 1], b = chunks[i];
        assert.ok(a.chunkY < b.chunkY || (a.chunkY === b.chunkY && a.chunkX < b.chunkX),
          label + ': deterministic row-major order');
      }
    };
    const vis = (cx, cy, w, h) => JSON.parse(g.run(`JSON.stringify(visibleChunks('${regionId}', ${cx}, ${cy}, ${w}, ${h}))`));

    // ── One-chunk viewport (aligned exactly to MAP's chunk) ─────────────────
    {
      const chunks = vis(0, 5 * CH, 512, 480);
      assert.deepEqual(chunks.map(c => c.mapId), ['MAP'], 'exactly one chunk');
      assert.deepEqual(
        { sc: chunks[0].startCol, ec: chunks[0].endCol, sr: chunks[0].startRow, er: chunks[0].endRow },
        { sc: 0, ec: COLS, sr: 0, er: ROWS }, 'full-chunk slice');
      assertValid(chunks, 'one-chunk');
    }

    // ── Horizontal two-chunk (tile-aligned half shift) ──────────────────────
    {
      const chunks = vis(256, 5 * CH, 512, 480); // 256px = 8 tiles across the x0|x1 seam
      assert.deepEqual(chunks.map(c => c.mapId), ['MAP', 'MAP2'], 'two chunks side by side');
      assert.deepEqual([chunks[0].startCol, chunks[0].endCol], [8, 16], 'MAP shows its east half');
      assert.deepEqual([chunks[1].startCol, chunks[1].endCol], [0, 8], 'MAP2 shows its west half');
      assertValid(chunks, 'h2');
    }

    // ── Vertical two-chunk (tile-aligned shift across the y4|y5 seam) ────────
    {
      const camY = 5 * CH - 224; // 224px = 7 tiles up into MAP_N1 (chunkY 4)
      const chunks = vis(0, camY, 512, 480);
      assert.deepEqual(chunks.map(c => c.mapId), ['MAP_N1', 'MAP'], 'two chunks stacked, north first (row-major)');
      assert.deepEqual([chunks[0].startRow, chunks[0].endRow], [8, 15], 'MAP_N1 shows its south rows (7)');
      assert.deepEqual([chunks[1].startRow, chunks[1].endRow], [0, 8], 'MAP shows its north rows (8)');
      assertValid(chunks, 'v2');
    }

    // ── Four-chunk viewport (straddles both the x and y seams) ───────────────
    {
      const chunks = vis(256, 5 * CH - 224, 512, 480);
      assert.deepEqual(chunks.map(c => c.mapId), ['MAP_N1', 'RODDON_WAY_MAP', 'MAP', 'MAP2'],
        'four chunks in row-major order (NW, NE, SW, SE)');
      assertValid(chunks, 'four');
    }

    // ── Exact-boundary: no zero-width / duplicate chunk ─────────────────────
    {
      const chunks = vis(512, 5 * CH, 512, 480); // camera exactly on the x0|x1 seam
      assert.deepEqual(chunks.map(c => c.mapId), ['MAP2'], 'only the chunk the viewport actually covers');
      // the abutting chunk (MAP at x0) contributes NO slice (half-open, not duplicated)
      assert.equal(g.run(`chunkVisibleTileRange(512, ${5 * CH}, 512, 480, 0, 5)`), null,
        'the exactly-abutting chunk yields no (zero-width) slice');
      assertValid(chunks, 'boundary');
    }

    // ── Sparse holes and out-of-region camera rectangles ────────────────────
    {
      assert.deepEqual(vis(0, 0, 512, 480).map(c => c.mapId), ['NORTH_BASIN_NW2_MAP'], 'the newly placed Flooded Rim fills chunk (0,0)');
      assert.deepEqual(vis(999999, 999999, 512, 480), [], 'far out-of-regionId camera -> no chunks');
      assert.deepEqual(vis(-512, -480, 512, 480), [], 'negative/out-of-regionId camera -> no chunks');
      // A viewport spanning the final gap (chunkY 2, at col 0) and a placed map (MAP_N2 at 0,3)
      // returns ONLY the placed one — the hole is omitted, not invented.
      const straddle = vis(0, 3 * CH - 224, 512, 480); // 7 tiles up from MAP_N2 into the (0,2) gap
      assert.deepEqual(straddle.map(c => c.mapId), ['MAP_N2'], 'gap omitted; only the placed chunk returned');
      assert.deepEqual([straddle[0].startRow, straddle[0].endRow], [0, 8], 'placed chunk shows its intersecting rows');
      assertValid(straddle, 'straddle-gap');
    }

    assert.equal(g.run(`JSON.stringify(visibleChunks('nope', 0, 0, 512, 480))`), '[]', 'unknown regionId -> []');
  },
};
