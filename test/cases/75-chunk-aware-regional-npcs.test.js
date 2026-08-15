'use strict';
// CHUNK-AWARE REGIONAL NPC RUNTIME (regional-npc-runtime.js + movement.js
// lifecycle/occupancy + continuous-content/render-entities + world-point-content
// moving_simple_dialogue + validation).
//
// Regional outdoor NPCs on NEARBY chunks get explicit physical-map ownership and
// keep updating/rendering/colliding/prompting/interacting while visible from
// another chunk; crossing the player's active-map boundary must not reset,
// duplicate, freeze, teleport, or redraw them. No authored outdoor NPC exercises
// this — SYNTHETIC fixtures only; no gameplay content is added or moved.
//
// Geometry: RODDON_WAY_MAP at chunk (1,4); MAP3_N1 at (2,4) is its east neighbour
// (unambiguous key 'map3_n1'). 'overworld' is the ambiguous key (MAP/MAP5/RODDON).
// CW=512, CH=480, TILE=32, TALK_RADIUS 28. MAP3_N1 walkable pair at cols (3,4)
// row 0; blocked tile (0,0); transition tile (1,3) — discovered at runtime below.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function ctxRoddon() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run(`debugWarpToDestination('outdoor:RODDON_WAY_MAP');
         dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
         combat.active=false; debugMode=true; continuousWorldViewEnabled=true;
         for (var k in keys) delete keys[k];
         player.x=8.5*TILE; player.y=7.5*TILE; player.moving=false;; __reconcileCanonicalForTest();`);
  return g;
}
// Discover MAP3_N1 (chunk 2,4) tiles once; static map data.
function discover(g) {
  return JSON.parse(g.run(`(function(){
    function walk(c,r){ return isTileWalkable(tileAtWorld('overworld', 32+c, 60+r)); }
    function trans(c,r){ var p=TILE_PROPERTIES[tileAtWorld('overworld',32+c,60+r)]; return !!(p&&p.isTransition); }
    var pair=null, blocked=null, transition=null;
    for (var r=0;r<15&&!pair;r++) for (var c=0;c<15;c++){ if(walk(c,r)&&walk(c+1,r)&&!trans(c,r)&&!trans(c+1,r)){pair=[c,r];break;} }
    for (var r=0;r<15&&!blocked;r++) for (var c=0;c<16;c++){ if(!walk(c,r)){blocked=[c,r];break;} }
    for (var r=0;r<15&&!transition;r++) for (var c=0;c<16;c++){ if(trans(c,r)){transition=[c,r];break;} }
    return JSON.stringify({pair:pair,blocked:blocked,transition:transition});
  })()`));
}
function addPatrol(g, id, c, r, opts) {
  opts = opts || {};
  g.run(`(function(){
    var npc={id:'${id}', name:'${opts.name || 'Walker'}', map:'map3_n1', spriteType:'clerk',
      x:${c + 0.5}*TILE, y:${r + 0.5}*TILE, facing:'right', solid:${opts.solid ? 'true' : 'false'},
      movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:${c + 0.5},y:${r + 0.5}},{x:${c + 1.5},y:${r + 0.5}}]}${opts.extra || ''}};
    SIMPLE_NPCS.push(npc);
    MOVEMENT_HOMES['${id}']={x:npc.x,y:npc.y,facing:npc.facing};
    return null;
  })()`);
}

module.exports = {
  name: 'chunk-aware regional NPCs: ownership, pose, nearby simulation, lifecycle, collision, moving interaction',
  run() {
    const g0 = ctxRoddon();
    const D = discover(g0);
    const [pc, pr] = D.pair;         // walkable pair start col/row
    const [bc, br] = D.blocked;      // blocked tile
    const T = D.transition;          // transition tile [c,r] or null

    // ── A. Physical ownership authority ─────────────────────────────────────
    const pm = (lit) => g0.run("physicalMapIdForNpc(" + lit + ")");
    assert.equal(pm("{map:'map3_n1', x:0, y:0}"), 'MAP3_N1', 'unique logical key derives the physical map');
    assert.equal(pm("{map:'overworld', x:0, y:0}"), null, 'ambiguous overworld without physicalMapId fails closed');
    assert.equal(pm("{map:'overworld', physicalMapId:'MAP', x:0, y:0}"), 'MAP', 'ambiguous key + explicit MAP resolves');
    assert.equal(pm("{map:'overworld', physicalMapId:'MAP5', x:0, y:0}"), 'MAP5', 'ambiguous key + explicit MAP5 resolves');
    assert.equal(pm("{map:'overworld', physicalMapId:'RODDON_WAY_MAP', x:0, y:0}"), 'RODDON_WAY_MAP', 'ambiguous key + explicit RODDON resolves');
    assert.equal(pm("{map:'map3_n1', physicalMapId:'MAP', x:0, y:0}"), null, 'explicit physical/logical mismatch fails closed');
    assert.equal(pm("{map:'map3_n1', physicalMapId:'NO_SUCH_MAP', x:0, y:0}"), null, 'unknown/unplaced physical map fails closed');
    assert.equal(pm("{map:'inn', x:0, y:0}"), null, 'a nonregional (town) key has no physical outdoor owner');

    // ── B. Runtime pose authority (read-only) ───────────────────────────────
    // NPC on MAP3_N1 (chunk 2,4) at local (5.5,5.5) tiles -> world (1200,2096).
    const pose = JSON.parse(g0.run(`(function(){
      var n={id:'__pose', map:'map3_n1', x:5.5*TILE, y:5.5*TILE, facing:'down'};
      var am=mapIdForRef(activeMap), px=player.x, py=player.y;
      var p=regionalNpcPose(n);
      return JSON.stringify({p:p, mutated:(mapIdForRef(activeMap)!==am||player.x!==px||player.y!==py)});
    })()`));
    assert.equal(pose.p.mapId, 'MAP3_N1', 'pose reports the physical map');
    assert.equal(pose.p.localPxX, 176, 'pose local px X');            // 5.5*32
    assert.equal(pose.p.worldPxX, 1200, 'pose world px X (2*512 + 176)');
    assert.equal(pose.p.worldPxY, 2096, 'pose world px Y (4*480 + 176)');
    assert.equal(pose.mutated, false, 'pose resolution performs no state mutation');

    // ── C. Nearby simulation set ────────────────────────────────────────────
    const set = JSON.parse(g0.run("JSON.stringify(nearbySimulationMapSet().mapIds)"));
    // RODDON (1,4) 3x3, row-major, sparse (1,3) omitted, legacy_screen MAP (0,5) excluded.
    assert.deepEqual(set, ['MAP_N2', 'MAP3_N2', 'MAP_N1', 'RODDON_WAY_MAP', 'MAP3_N1', 'MAP2', 'MAP3'],
      'nearby set = active + placed 3x3 (row-major), sparse omitted, legacy_screen MAP excluded');
    assert.ok(set.indexOf('RODDON_WAY_MAP') !== -1 && set.indexOf('MAP3_N1') !== -1, 'active + east neighbour both present');
    // Continuous View off -> legacy (null set).
    assert.equal(g0.run("(function(){continuousWorldViewEnabled=false; var s=nearbySimulationMapSet(); continuousWorldViewEnabled=true; return s;})()"), null,
      'Continuous View off -> null (legacy active-only lifecycle)');

    // ── C2. Shared 'overworld' key: PHYSICAL ownership protects MAP/MAP5/RODDON ─
    // A synthetic NPC on the ambiguous key with an explicit physicalMapId:'MAP5'
    // must be owned by MAP5 alone — never by MAP or RODDON_WAY_MAP (which share the
    // 'overworld' key). Logical-key equality must NEVER establish eligibility.
    {
      const g = createContext(); g.press('Enter'); g.press('Enter');
      g.run("debugMode=true;");
      // MAP5 (4,5); NPC local (2.5,2.5) = a walkable MAP tile too, so the interact/
      // collide checks below share the same local coordinate.
      g.run("SIMPLE_NPCS.push({id:'ow_map5', name:'FiveWalker', map:'overworld', physicalMapId:'MAP5', spriteType:'clerk', x:2.5*TILE, y:2.5*TILE, facing:'down', solid:true, dialogue:[['From map five.']], flag_required:null, flag_sets:null, action:null, movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:2.5,y:2.5},{x:3.5,y:2.5}]}}); MOVEMENT_HOMES['ow_map5']={x:2.5*TILE,y:2.5*TILE,facing:'down'};");
      const setActive = (mapId, cont) => g.run(`resetLocationState(); activeMap = mapRefForId('${mapId}'); continuousWorldViewEnabled=${cont}; debugMode=true; dialogue.open=false; combat.active=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false; for (var k in keys) delete keys[k]; __reconcileCanonicalForTest();`);
      const sim = () => g.run("npcShouldSimulate(SIMPLE_NPCS.find(function(x){return x.id==='ow_map5';}))");
      const renderCount = () => g.run(`(function(){ var n=0, _g=drawGenericNPC, _w=drawWalkingGenericNPC;
        drawGenericNPC=function(npc){ if(npc&&npc.id==='ow_map5')n++; return _g.apply(null,arguments); };
        drawWalkingGenericNPC=function(npc){ if(npc&&npc.id==='ow_map5')n++; return _w.apply(null,arguments); };
        render(); drawGenericNPC=_g; drawWalkingGenericNPC=_w; return n; })()`);

      // (a) Continuous OFF, MAP active -> no simulate / route / render / interact / collide.
      setActive('MAP', false);
      const snap = JSON.parse(g.run("JSON.stringify({x:SIMPLE_NPCS.find(function(x){return x.id==='ow_map5';}).x, y:SIMPLE_NPCS.find(function(x){return x.id==='ow_map5';}).y, f:SIMPLE_NPCS.find(function(x){return x.id==='ow_map5';}).facing, am:mapIdForRef(activeMap)})"));
      assert.equal(sim(), false, "MAP5-owned NPC does NOT simulate on MAP (off) despite the shared 'overworld' key");
      g.frames(2);
      assert.equal(g.run("!!NPC_ROUTES['ow_map5']"), false, 'no route starts/updates on MAP (off)');
      assert.equal(renderCount(), 0, 'not rendered on MAP (off)');
      g.run("player.x=2.5*TILE; player.y=2.5*TILE; player.moving=false;; __reconcileCanonicalForTest();");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'not interactable on MAP (off) — physical ownership, not logical key');
      assert.equal(g.run("crossSeamInteractPromptTarget()"), null, 'no cross-seam prompt on MAP (off)');
      assert.equal(g.run("canWalk(2.5*TILE, 2.5*TILE)"), true, 'the solid MAP5 NPC does not block the player on MAP (off)');
      // Negative checks mutated nothing.
      const snap2 = JSON.parse(g.run("JSON.stringify({x:SIMPLE_NPCS.find(function(x){return x.id==='ow_map5';}).x, y:SIMPLE_NPCS.find(function(x){return x.id==='ow_map5';}).y, f:SIMPLE_NPCS.find(function(x){return x.id==='ow_map5';}).facing, am:mapIdForRef(activeMap)})"));
      assert.deepEqual(snap2, snap, 'negative MAP-active checks mutate no NPC pose / activeMap');
      assert.equal(g.run("!!NPC_ROUTES['ow_map5']"), false, 'negative checks left no route');

      // (b) Continuous OFF, RODDON active -> still no simulate / render.
      setActive('RODDON_WAY_MAP', false);
      assert.equal(sim(), false, 'does NOT simulate on RODDON_WAY_MAP (off)');
      assert.equal(renderCount(), 0, 'not rendered on RODDON_WAY_MAP (off)');

      // (c) MAP5 active -> simulate + render exactly once (its OWN physical map).
      setActive('MAP5', false);
      assert.equal(sim(), true, 'simulates on its own map MAP5');
      g.frames(1);
      assert.equal(g.run("!!NPC_ROUTES['ow_map5']"), true, 'route started on MAP5');
      assert.equal(renderCount(), 1, 'rendered exactly once on MAP5');
      g.run("resetMovementNpc('ow_map5');");

      // (d) Continuous ON: physical proximity (nearbySimulationMapSet), NOT logical key.
      setActive('RODDON_WAY_MAP', true);   // RODDON key === 'overworld' == npc.map, but MAP5 (4,5) not in RODDON's 3x3
      assert.equal(sim(), false, 'continuous on + RODDON active: shared key does NOT establish eligibility');
      setActive('MAP5', true);
      assert.equal(sim(), true, 'continuous on + MAP5 active: eligible (own chunk in the nearby set)');
      setActive('MAP4', true);             // MAP4 (3,5): MAP5 (4,5) IS in its 3x3; MAP4 key !== 'overworld'
      assert.equal(sim(), true, 'continuous on + MAP4 active: eligible by PHYSICAL proximity, not logical key');
      g.run("resetMovementNpc('ow_map5');");
    }

    // ── D. Lifecycle: neighbour patrol starts, updates once/frame, no reset ──
    {
      const g = ctxRoddon();
      addPatrol(g, 'synth_patrol', pc, pr);
      g.frames(1);
      assert.ok(g.run("!!NPC_ROUTES['synth_patrol']"), 'a neighbouring patrol STARTS (chunk in the nearby set)');
      // advance, capturing per-frame delta -> proves exactly one step per frame.
      const adv = JSON.parse(g.run(`(function(){
        var n=SIMPLE_NPCS.find(function(x){return x.id==='synth_patrol';});
        var maxD=0, moved=false, prev=n.x;
        for (var i=0;i<16;i++){ update(); var d=Math.abs(n.x-prev); if(d>maxD)maxD=d; if(n.x!==prev)moved=true; prev=n.x; }
        return JSON.stringify({maxD:maxD, moved:moved, x:n.x});
      })()`));
      assert.ok(adv.moved, 'the neighbouring patrol UPDATES (advances) while only visible from the active chunk');
      assert.ok(adv.maxD <= 2, 'it advances at most one step (speed) per frame — updated exactly once/frame');
      // Player crosses into the NPC's chunk (atomic activeMap handoff, exactly what
      // continuousSeamMove does): no reset, no jump.
      const beforeX = g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_patrol';}).x");
      const beforeRoute = g.run("!!NPC_ROUTES['synth_patrol']");
      g.run("activeMap = mapRefForId('MAP3_N1'); dialogue.open=false; player.x=8.5*TILE; player.y=12.5*TILE; player.moving=false; for (var k in keys) delete keys[k];; __reconcileCanonicalForTest();");
      g.frames(1);
      assert.equal(g.run("!!NPC_ROUTES['synth_patrol']"), beforeRoute, 'handoff into the NPC chunk does NOT drop its route');
      const afterX = g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_patrol';}).x");
      assert.ok(Math.abs(afterX - beforeX) <= 2, 'handoff does not teleport/reset the NPC (position continuous, no jump)');
    }

    // ── E. Freezes under every existing global UI/combat freeze ──────────────
    {
      const g = ctxRoddon();
      addPatrol(g, 'synth_freeze', pc, pr);
      g.frames(4);
      for (const freeze of ['dialogue.open=true', 'combat.active=true', 'menu.open=true', 'choice.open=true', 'shop.open=true', 'debugMenu.open=true', 'warpMenu.open=true']) {
        const x0 = g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_freeze';}).x");
        g.run(freeze); g.frames(2); g.run(freeze.split('=')[0] + '=false');
        const x1 = g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_freeze';}).x");
        assert.equal(x1, x0, 'the neighbour mover is frozen under ' + freeze.split('=')[0]);
      }
    }

    // ── F. Reset by the home policy once the chunk leaves the neighbourhood ──
    {
      const g = ctxRoddon();
      addPatrol(g, 'synth_leave', pc, pr);
      g.frames(6);
      assert.ok(g.run("!!NPC_ROUTES['synth_leave']"), 'route running while in the nearby set');
      const home = JSON.parse(g.run("JSON.stringify(MOVEMENT_HOMES['synth_leave'])"));
      // Move 2+ chunks away (MAP5 at (4,5)); MAP3_N1 (2,4) leaves the 3x3.
      g.run("activeMap = mapRefForId('MAP5'); dialogue.open=false; player.x=8.5*TILE; player.y=7.5*TILE; for (var k in keys) delete keys[k];; __reconcileCanonicalForTest();");
      g.frames(1);
      assert.equal(g.run("!!NPC_ROUTES['synth_leave']"), false, 'the route is SUSPENDED once its chunk leaves the neighbourhood');
      const n = JSON.parse(g.run("JSON.stringify({x:SIMPLE_NPCS.find(function(x){return x.id==='synth_leave';}).x, y:SIMPLE_NPCS.find(function(x){return x.id==='synth_leave';}).y})"));
      assert.equal(n.x, home.x, 'the NPC is reset to its authored home (x)');
      assert.equal(n.y, home.y, 'the NPC is reset to its authored home (y)');
    }

    // ── G. Save/load + defeat reset to authored home; SAVE_VERSION stays 3 ───
    {
      const g = ctxRoddon();
      addPatrol(g, 'synth_save', pc, pr);
      g.frames(8);
      const home = JSON.parse(g.run("JSON.stringify(MOVEMENT_HOMES['synth_save'])"));
      g.run("saveGame();");
      assert.equal(JSON.parse(g.run("localStorage.getItem('verdantVale_save')")).version, 4, 'SAVE_VERSION stays 4');
      g.run("loadGame();");
      assert.equal(g.run("!!NPC_ROUTES['synth_save']"), false, 'load resets the mover (route dropped)');
      assert.equal(g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_save';}).x"), home.x, 'load restores the authored home');
      // defeat/reset path (resetAllMovers) also returns it home
      g.frames(4); g.run("resetAllMovers();");
      assert.equal(g.run("!!NPC_ROUTES['synth_save']"), false, 'resetAllMovers() (defeat/reset) drops the route');
      assert.equal(g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_save';}).x"), home.x, 'resetAllMovers() restores the authored home');
    }

    // ── H. World-aware occupancy: owner map, confinement, blocks ─────────────
    {
      const g = ctxRoddon();
      addPatrol(g, 'synth_occ', pc, pr, { solid: true });
      const can = (lx, ly) => g.run(`regionalNpcRouteCanOccupy(SIMPLE_NPCS.find(function(x){return x.id==='synth_occ';}), ${lx}, ${ly})`);
      assert.equal(can(`${pc + 0.5}*TILE`, `${pr + 0.5}*TILE`), true, 'a walkable owner-map tile is occupiable');
      assert.equal(can(`${bc + 0.5}*TILE`, `${br + 0.5}*TILE`), false, 'a BLOCKED owner-map tile is rejected (collision reads the NPC owner map, not activeMap)');
      if (T) assert.equal(can(`${T[0] + 0.5}*TILE`, `${T[1] + 0.5}*TILE`), false, 'a TRANSITION owner-map tile is rejected');
      assert.equal(can('511', `${pr + 0.5}*TILE`), false, 'a step whose footprint leaves the owner chunk is rejected (NPC cannot leave its map)');
      // Distant/unrelated solid NPC does not block.
      g.run("SIMPLE_NPCS.push({id:'synth_distant', map:'north_basin_nw', x:5.5*TILE, y:5.5*TILE, solid:true});");
      assert.equal(can(`${pc + 0.5}*TILE`, `${pr + 0.5}*TILE`), true, 'a solid NPC on a distant chunk does not block');
      // Another solid regional NPC on the SAME chunk, overlapping the target, blocks.
      g.run(`SIMPLE_NPCS.push({id:'synth_other', map:'map3_n1', x:${pc + 0.5}*TILE, y:${pr + 0.5}*TILE, solid:true});`);
      assert.equal(can(`${pc + 0.5}*TILE`, `${pr + 0.5}*TILE`), false, 'overlapping another solid regional NPC (world pixels) is rejected');
    }

    // ── I. Player blocked by a solid neighbouring NPC across an eligible seam ─
    {
      const g = ctxRoddon();
      // Solid NPC on MAP3_N1 just across the RODDON->MAP3_N1 east seam (row 6).
      g.run("SIMPLE_NPCS.push({id:'synth_wall', map:'map3_n1', x:1*TILE, y:6.5*TILE, solid:true});"); // world ~ (1024+32, 2128)
      const blocked = g.run(`(function(){
        var p=regionPlacementForMapId('RODDON_WAY_MAP'); var stand={chunkX:p.chunkX,chunkY:p.chunkY,mapId:'RODDON_WAY_MAP'};
        // a player world point within 18px of the NPC world center (1056,2128)
        return continuousFootprintWalkable('overworld', stand, 1050, 2128);
      })()`);
      assert.equal(blocked, false, 'the player is blocked by a solid neighbouring NPC whose body overlaps reachable space across the seam');
      const clear = g.run(`(function(){
        var p=regionPlacementForMapId('RODDON_WAY_MAP'); var stand={chunkX:p.chunkX,chunkY:p.chunkY,mapId:'RODDON_WAY_MAP'};
        return continuousFootprintWalkable('overworld', stand, 900, 2128);
      })()`);
      assert.equal(clear, true, 'the player is not blocked where the neighbour NPC body does not reach');
    }

    // ── J. Moving cross-seam interaction + prompt (explicit capability) ───────
    // Player parked just inside RODDON's east edge (row 6): world (1010,2128).
    function ctxRoddonSeam() {
      const g = createContext();
      g.press('Enter'); g.press('Enter');
      g.run(`debugWarpToDestination('outdoor:RODDON_WAY_MAP');
             dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
             combat.active=false; debugMode=true; continuousWorldViewEnabled=true;
             for (var k in keys) delete keys[k];
             player.x=498; player.y=208; player.moving=false;; __reconcileCanonicalForTest();`);
      return g;
    }
    // A MAP3_N1 mover (unambiguous key 'map3_n1'); moving_simple_dialogue still
    // requires an EXPLICIT physicalMapId that AGREES with the key.
    const movingNpc = (id, extra) => `{id:'${id}', name:'Rambler', map:'map3_n1', physicalMapId:'MAP3_N1', spriteType:'clerk', x:12, y:208, facing:'right', dialogue:[['On the move.']], flag_required:null, flag_sets:null, action:null, movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:0.5,y:6.5},{x:1.5,y:6.5}]}, crossSeamInteraction:'moving_simple_dialogue'${extra || ''}}`;
    {
      const g = ctxRoddonSeam();
      g.run("SIMPLE_NPCS.push(" + movingNpc('synth_mover') + "); MOVEMENT_HOMES['synth_mover']={x:12,y:208,facing:'right'};; __reconcileCanonicalForTest();");
      g.run("startNpcRoute('synth_mover');"); // establish a live route at the current position (no movement)
      // exactly one prompt at the live pose
      const promptN = g.run(`(function(){ var n=0,_ft=ctx.fillText; ctx.fillText=function(t){if(t==='SPACE')n++; return _ft&&_ft.apply(ctx,arguments);}; tick=16; drawCrossSeamInteractPrompt(); ctx.fillText=_ft; return n; })()`);
      assert.equal(promptN, 1, 'a permitted moving neighbour shows exactly one prompt at its live pose');
      // interact: opens dialogue, freezes route at live position, faces the player
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), true, 'interacting with the moving neighbour opens dialogue');
      assert.equal(g.run("dialogue.name"), 'Rambler', 'the moving neighbour is the interaction target');
      assert.equal(g.run("!!(NPC_ROUTES['synth_mover'] && NPC_ROUTES['synth_mover'].frozen)"), true, 'interaction FREEZES the live route (not restarted/teleported)');
      assert.equal(g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_mover';}).facing"), 'left', 'the NPC turns to face the player (world-delta: player is west of it)');
      const frozenX = g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_mover';}).x");
      // resume after dialogue closes (advance dialogue to the end)
      g.run("handleInteract();"); // closes the single-page dialogue
      assert.equal(g.run("dialogue.open"), false, 'dialogue closed');
      g.frames(40);
      assert.equal(g.run("!!(NPC_ROUTES['synth_mover'] && NPC_ROUTES['synth_mover'].frozen)"), false, 'the route THAWS after the dialogue closes');
      assert.ok(g.run("SIMPLE_NPCS.find(function(x){return x.id==='synth_mover';}).x") !== frozenX, 'the NPC RESUMES its route (not reset to home)');
    }
    // Fail-closed variants.
    {
      const g = ctxRoddonSeam();
      // moving NPC WITHOUT capability -> not targeted
      g.run("SIMPLE_NPCS.push(" + movingNpc('synth_nocap').replace(", crossSeamInteraction:'moving_simple_dialogue'", "") + "); MOVEMENT_HOMES['synth_nocap']={x:12,y:208,facing:'left'};");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'a moving neighbour without the capability is not interactable');
    }
    {
      const g = ctxRoddonSeam();
      g.run("SIMPLE_NPCS.push(" + movingNpc('synth_unk', ", crossSeamInteraction2:1").replace("'moving_simple_dialogue'", "'teleport'") + "); MOVEMENT_HOMES['synth_unk']={x:12,y:208,facing:'left'};");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'an unknown moving capability fails closed');
    }
    {
      const g = ctxRoddonSeam();
      // moving_simple_dialogue with an action -> blocked
      g.run("SIMPLE_NPCS.push(" + movingNpc('synth_act', ", action:function(){dialogue.name='NO';dialogue.pages=[['x']];dialogue.open=true;}") + "); MOVEMENT_HOMES['synth_act']={x:12,y:208,facing:'left'};");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'a moving_simple_dialogue NPC with an action fails closed');
    }
    {
      const g = ctxRoddonSeam();
      // ambiguous ownership: overworld mover WITHOUT physicalMapId -> blocked
      g.run("SIMPLE_NPCS.push({id:'synth_amb', name:'Amb', map:'overworld', x:12, y:208, dialogue:[['.']], flag_required:null, flag_sets:null, action:null, movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:0.5,y:6.5},{x:1.5,y:6.5}]}, crossSeamInteraction:'moving_simple_dialogue'});");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'a moving neighbour with ambiguous (undeclared) ownership fails closed');
    }
    // Active-map interaction priority is unchanged.
    {
      const g = ctxRoddonSeam();
      g.run("SIMPLE_NPCS.push({id:'synth_active', name:'ActiveGuy', map:'overworld', x:498, y:208, dialogue:[['active']], flag_required:null, flag_sets:null, action:null});");
      g.run("SIMPLE_NPCS.push(" + movingNpc('synth_mover2') + "); MOVEMENT_HOMES['synth_mover2']={x:12,y:208,facing:'left'};");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.name"), 'ActiveGuy', 'an active-map target still wins over a moving neighbour');
    }

    // ── K. VALIDATION of regional ownership + moving capability ──────────────
    const vErrs = (lit, re) => JSON.parse(g0.run(`(function(){
      var it=${lit}; SIMPLE_NPCS.push(it); var v=validateGameData(); SIMPLE_NPCS.pop();
      return (v.errorList||[]).filter(function(e){return ${re}.test(e.message);}).length;
    })()`));
    assert.ok(vErrs("{id:'v_mismatch', name:'M', map:'map3_n1', physicalMapId:'MAP', x:0, y:0}", "/physicalMapId/") > 0, 'physical/logical mismatch fails validation');
    assert.ok(vErrs("{id:'v_unplaced', name:'M', map:'map3_n1', physicalMapId:'NO_SUCH_MAP', x:0, y:0}", "/physicalMapId/") > 0, 'unknown/unplaced physical map fails validation');
    assert.ok(vErrs("{id:'v_ambmove', name:'M', map:'overworld', x:0, y:0, movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:1,y:1},{x:2,y:1}]}}", "/ambiguous/") > 0, 'a regional mover on the ambiguous key without physicalMapId fails validation');
    assert.ok(vErrs("{id:'v_movact', name:'M', map:'map3_n1', physicalMapId:'MAP3_N1', x:0, y:0, dialogue:[['.']], movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:1,y:1},{x:2,y:1}]}, crossSeamInteraction:'moving_simple_dialogue', action:'x'}", "/crossSeamInteraction/") > 0, 'moving_simple_dialogue + action fails validation');
    assert.ok(vErrs("{id:'v_simplemove', name:'M', map:'map3_n1', x:0, y:0, dialogue:[['.']], movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:1,y:1},{x:2,y:1}]}, crossSeamInteraction:'simple_dialogue'}", "/crossSeamInteraction/") > 0, 'simple_dialogue on a mover fails validation');
    assert.equal(vErrs("{id:'v_ok', name:'M', map:'map3_n1', physicalMapId:'MAP3_N1', x:0, y:0, dialogue:[['.']], movement:{type:'patrol', autoStart:true, speed:2, waypoints:[{x:1,y:1},{x:2,y:1}]}, crossSeamInteraction:'moving_simple_dialogue'}", "/crossSeamInteraction|physicalMapId/"), 0, 'a well-formed moving cross-seam NPC validates clean');
  },
};
