'use strict';
// GEOGRAPHIC RANDOM-ENCOUNTER AUTHORITY (encounter-geography.js + combat.js
// currentEncounterPool + movement.js roll gate).
//
// For the placed regional wilderness, the encounter pool is owned by the PHYSICAL
// CHUNK beneath the player's STANDING POINT in world space — not a logical content
// key, the shared 'overworld' key, visible/neighbour chunks, or the NPC simulation
// set. Behaviour-neutral with the current maps. The roll stays at its single
// update() choke point at the same cadence; nonregional contexts keep legacy
// selection.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function ctx() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run("debugMode=true;");
  return g;
}
const CW = 512, CH = 480; // COLS*TILE, ROWS*TILE

module.exports = {
  name: 'geographic encounters: physical-chunk pool authority, seam handoff, fail-closed, behaviour-neutral',
  run() {
    const g = ctx();
    const J = (e) => JSON.parse(g.run(e));

    // ── 1. Pure resolution for ALL placed regional maps + pool identity ─────
    const all = J(`(function(){
      var out=[];
      for (var region in REGIONAL_LAYOUT){ var pl=REGIONAL_LAYOUT[region].placements;
        for (var i=0;i<pl.length;i++){ var p=pl[i];
          var wx=p.chunkX*${CW}+${CW/2}, wy=p.chunkY*${CH}+${CH/2};
          var c=geographicEncounterContext(region, wx, wy);
          var canon=mapEntryForId(p.mapId).encounterPool; if(canon===undefined)canon=null;
          out.push({mapId:p.mapId, ok: !!c, right: c&&c.mapId===p.mapId, poolMatch: c&&c.encounterPool===canon});
        }
      }
      return JSON.stringify(out);
    })()`);
    assert.equal(all.length, 19, 'all 19 placed regional maps considered');
    for (const r of all) {
      assert.ok(r.ok && r.right, `${r.mapId} resolves from its own chunk centre to itself`);
      assert.ok(r.poolMatch, `${r.mapId} resolves to the exact canonical MAP_CATALOG encounter pool (incl. empty/absent)`);
    }

    // ── 2. Pixel-unit contract + no runtime mutation ────────────────────────
    // A world point in MAP3_N1 (chunk 2,4): worldPx (2*512+100, 4*480+100).
    const r1 = J("JSON.stringify(geographicEncounterContext('overworld', 2*512+100, 4*480+100))");
    assert.equal(r1.mapId, 'MAP3_N1', 'a world PIXEL point resolves to the containing chunk');
    const before = g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y");
    g.run("geographicEncounterContext('overworld', 2*512+100, 4*480+100); regionalStandingEncounterContext(); encounterGeographyOk();");
    assert.equal(g.run("mapIdForRef(activeMap)+'|'+player.x+'|'+player.y"), before, 'resolver + selectors mutate no runtime state');

    // ── 3. Chunk centres and edge pixels ────────────────────────────────────
    assert.equal(J("JSON.stringify(geographicEncounterContext('overworld', 2*512, 4*480))").mapId, 'MAP3_N1', 'the top-left corner pixel belongs to that chunk');
    assert.equal(J("JSON.stringify(geographicEncounterContext('overworld', 2*512-1, 4*480+100))").mapId, 'RODDON_WAY_MAP', 'one pixel west of the boundary belongs to the west chunk');
    assert.equal(J("JSON.stringify(geographicEncounterContext('overworld', 3*512-1, 4*480+100))").mapId, 'MAP3_N1', 'the last pixel column still belongs to the same chunk');

    // ── 4. Both sides of a horizontal + a vertical seam ─────────────────────
    // Horizontal seam RODDON(1,4) | MAP3_N1(2,4) at worldX = 2*512.
    assert.equal(J("JSON.stringify(geographicEncounterContext('overworld', 2*512-1, 4*480+200))").mapId, 'RODDON_WAY_MAP', 'west of the E/W seam -> RODDON');
    assert.equal(J("JSON.stringify(geographicEncounterContext('overworld', 2*512+1, 4*480+200))").mapId, 'MAP3_N1', 'east of the E/W seam -> MAP3_N1');
    // Vertical seam MAP3_N2(2,3) | MAP3_N1(2,4) at worldY = 4*480.
    assert.equal(J("JSON.stringify(geographicEncounterContext('overworld', 2*512+200, 4*480-1))").mapId, 'MAP3_N2', 'north of the N/S seam -> MAP3_N2');
    assert.equal(J("JSON.stringify(geographicEncounterContext('overworld', 2*512+200, 4*480+1))").mapId, 'MAP3_N1', 'south of the N/S seam -> MAP3_N1');

    // ── 5. Source pool before handoff, destination pool after ───────────────
    // North Basin W(1,1) pool != NW(1,0) pool. Set the standing point on each and
    // read currentEncounterPool() (the exact selector the real roll uses).
    const poolOn = (mapId, cont) => g.run(`(function(){
      resetLocationState(); activeMap=mapRefForId('${mapId}'); forceLegacyRegionalView=${!cont};
      player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest();
      return currentEncounterPool()===mapEntryForId('${mapId}').encounterPool;
    })()`);
    assert.equal(poolOn('NORTH_BASIN_W_MAP', false), true, 'before handoff: the source (W) chunk owns the pool');
    assert.equal(poolOn('NORTH_BASIN_NW_MAP', false), true, 'after handoff: the destination (NW) chunk owns the pool');
    assert.equal(g.run("mapEntryForId('NORTH_BASIN_W_MAP').encounterPool !== mapEntryForId('NORTH_BASIN_NW_MAP').encounterPool"), true, 'the two seam-adjacent chunks have distinct pools (ownership is observable)');

    // ── 6. No double roll / double combat start; no roll at a seamless handoff ─
    // (a) A seamless handoff (continuousSeamMove) itself rolls NOTHING.
    {
      const h = g.run(`(function(){
        debugWarpToDestination('outdoor:RODDON_WAY_MAP'); resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP');
        forceLegacyRegionalView = false; debugMode=false; combat.active=false;
        player.x=15.5*TILE; player.y=6.5*TILE; player.step=0; combat.cooldown=0; __reconcileCanonicalForTest();
        for (var k in keys) delete keys[k];
        player.moving=true;
        var sc=0,_sc=startCombat; startCombat=function(){sc++;};
        var before=mapIdForRef(activeMap), crossed=false;
        for (var i=0;i<14;i++){ continuousSeamMove(2,0); if(mapIdForRef(activeMap)!==before){crossed=true; continuousSeamMove(2,0); break;} }
        startCombat=_sc;
        return JSON.stringify({sc:sc, handoff: crossed});
      })()`);
      const hh = JSON.parse(h);
      assert.equal(hh.sc, 0, 'a seamless handoff (continuousSeamMove) starts no combat');
      assert.ok(hh.handoff, 'the walk did cross the seam (activeMap changed)');
    }
    // (b) A single moving update() frame fires the roll AT MOST once.
    {
      const eligible = J(`(function(){
        // find a RODDON interior tile that is encounter-eligible + walkable
        for (var r=3;r<12;r++) for (var c=3;c<13;c++){
          var t=tileAtWorld('overworld', 16+c, 60+r);
          if (isEncounterEligibleTile(t) && isTileWalkable(t)) return JSON.stringify([c,r]);
        }
        return 'null';
      })()`);
      assert.ok(eligible, 'a RODDON encounter-eligible tile exists for the roll test');
      const [ec, er] = eligible;
      const n = g.run(`(function(){
        resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP'); forceLegacyRegionalView = true; debugMode=false;
        combat.active=false; combat.cooldown=0; player.x=${ec + 0.5}*TILE; player.y=${er + 0.5}*TILE; player.step=15;
        for (var k in keys) delete keys[k]; keys['ArrowRight']=true;
        var sc=0,_sc=startCombat; startCombat=function(){sc++; combat.active=true;};
        var _r=Math.random; Math.random=function(){return 0;}; // always below the chance
        update();
        Math.random=_r; startCombat=_sc; for (var k in keys) delete keys[k];
        return sc;
      })()`);
      assert.ok(n <= 1, 'the roll fires at most once on a single moving frame (no double roll)');
    }

    // ── 7/8. Neighbour visibility + NPC simulation do not influence the pool ─
    // Continuous View on (all neighbours visible + simulated) vs off must give the
    // SAME pool for the SAME physical position.
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP3_N1'); player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest(); forceLegacyRegionalView = true; var a=currentEncounterPool(); forceLegacyRegionalView = false; var b=currentEncounterPool(); return a===b && a===mapEntryForId('MAP3_N1').encounterPool;})()"), true,
      'neighbour visibility / NPC simulation / Continuous View toggle never change the pool for a fixed physical position');
    // A neighbouring NPC being simulated does not shift the pool.
    assert.equal(g.run("(function(){ SIMPLE_NPCS.push({id:'geo_npc', map:'map3_n1', x:5*TILE, y:5*TILE, movement:{type:'patrol',autoStart:true,speed:2,waypoints:[{x:5,y:5},{x:6,y:5}]}}); MOVEMENT_HOMES['geo_npc']={x:5*TILE,y:5*TILE,facing:'right'}; resetLocationState(); activeMap=mapRefForId('MAP3_N1'); player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest(); forceLegacyRegionalView = false; var p=currentEncounterPool(); SIMPLE_NPCS.pop(); delete MOVEMENT_HOMES['geo_npc']; return p===mapEntryForId('MAP3_N1').encounterPool;})()"), true,
      'a simulated neighbour NPC does not influence the encounter pool');

    // ── 10. MAP / MAP5 / RODDON_WAY_MAP remain physically distinct ('overworld') ─
    const ow = J(`(function(){
      function m(id){ var p=regionPlacementForMapId(id); var c=geographicEncounterContext('overworld', p.chunkX*${CW}+50, p.chunkY*${CH}+50); return {mapId:c&&c.mapId, own: c&&c.encounterPool===mapEntryForId(id).encounterPool}; }
      return JSON.stringify({MAP:m('MAP'), MAP5:m('MAP5'), ROD:m('RODDON_WAY_MAP')});
    })()`);
    assert.equal(ow.MAP.mapId, 'MAP', "MAP resolves to MAP despite the shared 'overworld' key");
    assert.equal(ow.MAP5.mapId, 'MAP5', 'MAP5 resolves to MAP5 (physically distinct)');
    assert.equal(ow.ROD.mapId, 'RODDON_WAY_MAP', 'RODDON resolves to RODDON (physically distinct)');
    assert.ok(ow.MAP.own && ow.MAP5.own && ow.ROD.own, "each shared-'overworld' map keeps its OWN physical pool");

    // ── 11. Void / sparse / unknown region / invalid coords / inconsistency ──
    assert.equal(g.run("geographicEncounterContext('overworld', 4*512+100, 2*480+100)"), null, 'a sparse/void chunk (4,2) fails closed');
    assert.equal(g.run("geographicEncounterContext('overworld', -1, 100)"), null, 'a negative coordinate fails closed');
    assert.equal(g.run("geographicEncounterContext('overworld', NaN, 100)"), null, 'a non-finite coordinate fails closed');
    assert.equal(g.run("geographicEncounterContext('nope', 100, 100)"), null, 'an unknown region fails closed');
    // Inconsistent placement: active map RODDON but the standing point is off-chunk
    // -> encounterGeographyOk() fails closed (no random encounter).
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP'); player.x=999999; player.y=7.5*TILE; __reconcileCanonicalForTest(); return encounterGeographyOk();})()"), false, 'an off-chunk standing point fails closed (no roll)');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP'); player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest(); return encounterGeographyOk();})()"), true, 'a normal standing point on a placed map passes');

    // ── 15. POOL SELECTION itself fails closed (shared authority, not just gate) ─
    // (1) Valid placed regional state -> the canonical geographic pool.
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MAP3_N1'); player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest(); return currentEncounterPool()===mapEntryForId('MAP3_N1').encounterPool;})()"), true, 'valid placed regional: currentEncounterPool() returns the canonical geographic pool');
    // (2) INCONSISTENT: a valid canonical position with a CORRUPTED projection
    // (player.x diverged) is a broken invariant -> fail-closed: NO standing
    // geography, the empty/no-pool result, NEVER the stale active-map pool. (In the
    // canonical model geography can't silently disagree with a valid position; the
    // only inconsistency is a broken canonical/projection invariant.)
    const inc = JSON.parse(g.run(`(function(){
      resetLocationState(); placeAtLocation('RODDON_WAY_MAP', 8.5*TILE, 6.5*TILE); // valid canonical
      player.x = 999999; // corrupt the compatibility projection -> canonical/projection disagree
      var p=currentEncounterPool();
      return JSON.stringify({ geoMap:((regionalStandingEncounterContext()||{}).mapId)||null,
        hasInvErr: regionalInvariantErrors().length>0,
        empty:(p===EMPTY_ENCOUNTER_POOL)||(Array.isArray(p)&&p.length===0),
        stale:(p===mapEntryForId('RODDON_WAY_MAP').encounterPool) });
    })()`));
    assert.ok(inc.hasInvErr, 'a corrupted projection is a broken canonical invariant');
    assert.equal(inc.geoMap, null, 'a broken invariant yields NO standing geography (fail-closed, not a stale/derived map)');
    assert.ok(inc.empty, 'broken invariant -> the empty/no-pool result');
    assert.equal(inc.stale, false, 'broken invariant NEVER returns the stale activeMap pool');
    // (3) Unresolved / void standing geography -> the same empty result.
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP'); player.x=999999; player.y=7.5*TILE; __reconcileCanonicalForTest(); var p=currentEncounterPool(); return Array.isArray(p)&&p.length===0;})()"), true, 'unresolved/void regional geography -> empty/no-pool result');
    // (4) startCombat() in the invalid state: no combat, no enemy, no randomness.
    const sc = JSON.parse(g.run(`(function(){
      resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP'); player.x=999999; player.y=7.5*TILE; __reconcileCanonicalForTest();
      combat.active=false; combat.enemy=null;
      var rc=0,_r=Math.random; Math.random=function(){rc++; return _r();};
      startCombat();
      Math.random=_r;
      return JSON.stringify({active:combat.active, enemy:!!combat.enemy, rc:rc});
    })()`));
    assert.equal(sc.active, false, 'startCombat() in invalid regional geography does not activate combat');
    assert.equal(sc.enemy, false, 'no enemy is selected');
    assert.equal(sc.rc, 0, 'no enemy-selection randomness is consumed');
    // (5) The roll gate stays false in that state.
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('RODDON_WAY_MAP'); player.x=999999; player.y=7.5*TILE; __reconcileCanonicalForTest(); return encounterGeographyOk();})()"), false, 'encounterGeographyOk() remains false before the encounter-chance roll');
    // (6) BOTH APIs derive from the one shared authority — and a broken canonical
    // invariant (corrupted projection) makes it fail closed (regional but not ok).
    assert.equal(g.run("(function(){resetLocationState(); placeAtLocation('RODDON_WAY_MAP', 8.5*TILE, 6.5*TILE); player.x=999999; var r=regionalEncounterResolution(); return r.regional && r.ok===false;})()"), true, 'currentEncounterPool() + encounterGeographyOk() share regionalEncounterResolution()');

    // ── 12. Legacy selection/exclusion preserved for nonregional contexts ────
    assert.equal(g.run("(function(){resetLocationState(); inDungeon=true; dungeonFloor=1; return currentEncounterPool()===DUNGEON_ENEMY_TEMPLATES;})()"), true, 'dungeon floor 1 keeps its legacy pool');
    assert.equal(g.run("(function(){resetLocationState(); inSluice=true; sluiceFloor=1; return currentEncounterPool()===SLUICE_TOP_ENEMY_TEMPLATES;})()"), true, 'sluice top floor keeps its legacy pool');
    assert.equal(g.run("(function(){resetLocationState(); inMireVault=true; return currentEncounterPool()===MIRE_VAULT_ENEMY_TEMPLATES;})()"), true, "Mirethyst's Vault keeps its legacy pool");
    assert.equal(g.run("(function(){resetLocationState(); inTown=true; activeMap=mapRefForId('TOWN_MAP'); return encounterGeographyOk();})()"), true, 'a town (nonregional) is not geographically gated (legacy roll)');
    assert.equal(g.run("(function(){resetLocationState(); activeMap=mapRefForId('MEADOW_MAP'); return encounterGeographyOk();})()"), true, 'the meadow (special, unplaced) is not geographically gated (legacy)');

    // ── 13. No randomness in the resolver / selection ───────────────────────
    assert.equal(g.run(`(function(){
      resetLocationState(); activeMap=mapRefForId('MAP3_N1'); player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest();
      var rc=0,_r=Math.random; Math.random=function(){rc++; return _r();};
      geographicEncounterContext('overworld', 2*512+100, 4*480+100);
      regionalStandingEncounterContext(); encounterGeographyOk(); currentEncounterPool();
      Math.random=_r; return rc;
    })()`), 0, 'the geographic resolver and selection consume no randomness');

    // ── 14. SAVE_VERSION stays 3; no geographic/debug encounter state saved ──
    {
      const gg = ctx();
      gg.run("resetLocationState(); activeMap=mapRefForId('MAP3_N1'); player.x=8.5*TILE; player.y=7.5*TILE; __reconcileCanonicalForTest(); saveGame();");
      const saved = JSON.parse(gg.run("localStorage.getItem('verdantVale_save')"));
      assert.equal(saved.version, 4, 'SAVE_VERSION stays 4');
      const keys = Object.keys(saved).join(',');
      assert.ok(!/encounterGeo|geographic|standingChunk|encounterChunk/i.test(keys), 'no geographic/debug encounter state enters the save');
    }
  },
};
