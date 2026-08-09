'use strict';
// Regional layout (data.js): the additive, behaviour-neutral authority for map
// GEOMETRY on a future continuous overworld -- REGIONAL_LAYOUT + its derived
// indexes + the side-effect-free coordinate helpers (regionPlacementForMapId,
// mapIdForChunk, localToWorld, worldToLocal, tileAtWorld). Deterministic; no RNG.
//
// Covers the brief's required cases: known map ids + correct outdoor dimensions,
// unique chunk positions, no map placed twice, local<->world round trips incl.
// chunk edges, negative / out-of-range / missing-chunk (void) behaviour, and
// derived-index consistency. Also asserts the extended transition audit's
// continuous-seam-readiness report has no hard incompatibilities.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'regional layout: continuous-overworld chunk placement, helpers, round trips, seam readiness',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter');

    const COLS = g.run('COLS'), ROWS = g.run('ROWS');
    assert.equal(COLS, 16, 'outdoor chunk width is 16');
    assert.equal(ROWS, 15, 'outdoor chunk height is 15');

    const region = 'overworld';
    const placements = JSON.parse(g.run(
      `JSON.stringify(REGIONAL_LAYOUT['${region}'].placements)`));
    assert.ok(placements.length >= 15, 'the principal wilderness has all its chunks placed');

    // ── 1. Known map ids + correct OUTDOOR dimensions ───────────────────────
    for (const p of placements) {
      const entry = JSON.parse(g.run(`JSON.stringify(mapEntryForId(${JSON.stringify(p.mapId)}) || null)`));
      assert.ok(entry, `${p.mapId} is a real MAP_CATALOG map`);
      assert.equal(entry.type, 'outdoor', `${p.mapId} is an outdoor map`);
      const dims = JSON.parse(g.run(`(()=>{const m=mapRefForId(${JSON.stringify(p.mapId)});return JSON.stringify({r:m.length,c:m[0].length});})()`));
      assert.equal(dims.r, ROWS, `${p.mapId} has ${ROWS} rows`);
      assert.equal(dims.c, COLS, `${p.mapId} has ${COLS} cols`);
      assert.ok(Number.isInteger(p.chunkX) && Number.isInteger(p.chunkY), `${p.mapId} has integer chunk coords`);
    }

    // ── 2. Unique chunk positions; no map placed twice ──────────────────────
    const chunkSeen = new Set(), mapSeen = new Set();
    for (const p of placements) {
      const ck = p.chunkX + ',' + p.chunkY;
      assert.ok(!chunkSeen.has(ck), `chunk ${ck} is occupied by only one map`);
      chunkSeen.add(ck);
      assert.ok(!mapSeen.has(p.mapId), `${p.mapId} is placed at most once`);
      mapSeen.add(p.mapId);
    }

    // ── 3. Derived-index consistency (both directions) ──────────────────────
    for (const p of placements) {
      const back = JSON.parse(g.run(`JSON.stringify(regionPlacementForMapId(${JSON.stringify(p.mapId)}))`));
      assert.deepEqual(back, { region, mapId: p.mapId, chunkX: p.chunkX, chunkY: p.chunkY },
        `regionPlacementForMapId round-trips ${p.mapId}`);
      assert.equal(g.run(`mapIdForChunk('${region}', ${p.chunkX}, ${p.chunkY})`), p.mapId,
        `mapIdForChunk resolves back to ${p.mapId}`);
    }
    // Excluded pocket/special maps must NOT be in the layout.
    for (const excluded of ['MEADOW_MAP', 'DUNGEON_MAP', 'DRENWICK_CIVIC_MAP', 'BASIN_CHAMBER_MAP']) {
      assert.equal(g.run(`regionPlacementForMapId(${JSON.stringify(excluded)})`), null,
        `${excluded} is kept off the continuous grid`);
    }

    // ── 4. local <-> world round trips, including chunk edges ───────────────
    // Spot-check every placement's four local corners round-trip exactly.
    const corners = [[0, 0], [COLS - 1, 0], [0, ROWS - 1], [COLS - 1, ROWS - 1], [8, 7]];
    for (const p of placements) {
      for (const [lx, ly] of corners) {
        const w = JSON.parse(g.run(`JSON.stringify(localToWorld(${JSON.stringify(p.mapId)}, ${lx}, ${ly}))`));
        assert.deepEqual(w, { region, worldX: p.chunkX * COLS + lx, worldY: p.chunkY * ROWS + ly },
          `localToWorld(${p.mapId},${lx},${ly})`);
        const back = JSON.parse(g.run(`JSON.stringify(worldToLocal('${region}', ${w.worldX}, ${w.worldY}))`));
        assert.deepEqual(back, { mapId: p.mapId, chunkX: p.chunkX, chunkY: p.chunkY, localX: lx, localY: ly },
          `worldToLocal round-trips ${p.mapId} local (${lx},${ly})`);
      }
    }

    // Explicit chunk-edge seam: MAP (0,5) east edge (worldX 15) abuts MAP2 (worldX 16).
    assert.equal(g.run(`worldToLocal('${region}', 15, 75).mapId`), 'MAP', 'worldX 15 is MAP east edge');
    assert.equal(g.run(`worldToLocal('${region}', 15, 75).localX`), 15, 'MAP east edge is local col 15');
    assert.equal(g.run(`worldToLocal('${region}', 16, 75).mapId`), 'MAP2', 'worldX 16 crosses into MAP2');
    assert.equal(g.run(`worldToLocal('${region}', 16, 75).localX`), 0, 'MAP2 west edge is local col 0');

    // ── 5. tileAtWorld matches a direct tile read (a real placed tile) ──────
    const sample = JSON.parse(g.run(`(()=>{
      var w = localToWorld('MAP', 8, 8);
      return JSON.stringify({ world: tileAtWorld('${region}', w.worldX, w.worldY), direct: mapRefForId('MAP')[8][8] });
    })()`));
    assert.equal(sample.world, sample.direct, 'tileAtWorld equals the direct map tile at that world coord');

    // ── 6. Negative / out-of-range / missing-chunk => documented void ───────
    const VOID = g.run('REGION_VOID_TILE');
    assert.ok(VOID < 0, 'REGION_VOID_TILE is not a real (non-negative) tile id');
    // negative
    assert.equal(g.run(`worldToLocal('${region}', -1, 0)`), null, 'negative worldX -> null');
    assert.equal(g.run(`tileAtWorld('${region}', -1, 0)`), VOID, 'negative worldX -> void');
    assert.equal(g.run(`tileAtWorld('${region}', 0, -5)`), VOID, 'negative worldY -> void');
    // out of range (beyond the bounding box)
    assert.equal(g.run(`tileAtWorld('${region}', 99999, 99999)`), VOID, 'far out-of-range -> void');
    // missing chunk INSIDE the bounding box: chunk (0,0) is a documented gap
    // (MAP_N2 is the northernmost col-0 map, at chunkY 3).
    assert.equal(g.run(`mapIdForChunk('${region}', 0, 0)`), null, 'chunk (0,0) is an unplaced gap');
    assert.equal(g.run(`worldToLocal('${region}', 5, 5)`), null, 'a gap chunk -> null local');
    assert.equal(g.run(`tileAtWorld('${region}', 5, 5)`), VOID, 'a gap chunk reads as void');
    // unknown region
    assert.equal(g.run(`worldToLocal('nope', 0, 0)`), null, 'unknown region -> null');
    assert.equal(g.run(`tileAtWorld('nope', 0, 0)`), VOID, 'unknown region -> void');
    // unknown map id
    assert.equal(g.run(`localToWorld('NOT_A_MAP', 0, 0)`), null, 'unknown map id -> null');

    // ── 7. Extended transition audit: continuous-seam-readiness report ──────
    // Read-only. No hard incompatibilities (the layout was derived FROM the
    // current transitions, so nothing should conflict or point out of region);
    // every ALIGNS edge is a broad crossing.
    const audit = require('../transition-audit.js');
    const seam = audit.seamReadiness;
    assert.ok(seam && seam.available, 'the audit produced a seam-readiness report');
    assert.equal(seam.region, region, 'seam report covers the overworld region');
    assert.equal(seam.totals.CONFLICT || 0, 0, 'no edge conflicts with the layout');
    assert.equal(seam.totals.OUTSIDE_REGION || 0, 0, 'no wilderness edge leaks outside the region');
    assert.ok((seam.totals.ALIGNS || 0) > 0 && (seam.totals.NEEDS_REMAP || 0) > 0,
      'the report distinguishes already-continuous seams from point seams needing remap');
    for (const e of seam.edges) {
      if (e.verdict === 'ALIGNS') assert.equal(e.type, 'broad', `${e.mapId} ${e.dir} ALIGNS via a broad edge`);
      if (e.verdict === 'BLOCKED') assert.ok(e.neighbor, `${e.mapId} ${e.dir} BLOCKED has a placed neighbour`);
    }
  },
};
