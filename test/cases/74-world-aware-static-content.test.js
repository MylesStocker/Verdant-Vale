'use strict';
// WORLD-AWARE STATIC CONTENT ACROSS SEAMS (world-point-content.js +
// continuous-seams.js authorization + movement.js pickup + interactions.js +
// the cross-seam interaction prompt + validation.js capability checks).
//
// Under Continuous View a NARROW, explicitly-safe set of nearby STATIC outdoor
// content resolves across ONE directly adjacent eligible seam: ordinary
// registry-backed item pickups, and EXPLICITLY opted-in stationary simple-
// dialogue NPC interaction targets. Everything else fails closed. Neighbouring
// NPC movement/schedules/AI and encounters are NOT changed. No authored outdoor
// NPC opts in and no authored item sits within pickup radius of a seam, so this
// test uses SYNTHETIC OPTED-IN fixtures; it never adds or moves gameplay content.
//
// Geometry (production authorities): RODDON_WAY_MAP is placed at chunk (1,4); its
// eligible EAST seam reaches MAP3_N1 at chunk (2,4), reciprocal, over tile-rows
// [4,9]. RODDON's content key 'overworld' is AMBIGUOUS (shared with MAP/MAP5);
// MAP3_N1's key 'map3_n1' is UNAMBIGUOUS. CW=512, CH=480, TILE=32, pickup radius
// 20 px, TALK_RADIUS 28 px. Player parked just inside RODDON's east edge at row 6:
// world (1010, 2128).

const assert = require('assert/strict');
const { createContext } = require('../harness');

function onRoddon() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run(`debugWarpToDestination('outdoor:RODDON_WAY_MAP');
         dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
         debugMode = true; continuousWorldViewEnabled = true;
         for (var k in keys) delete keys[k];
         player.x = 498; player.y = 208; player.moving = false; player.facing = 'right';; __reconcileCanonicalForTest();`);
  return g;
}
// A synthetic opted-in stationary simple-dialogue NPC literal (map3_n1 owner).
function optedInNpc(id, name, x, extra) {
  return `{id:'${id}', name:'${name}', map:'map3_n1', x:${x}, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, action:null, crossSeamInteraction:'simple_dialogue'${extra || ''}}`;
}
// A synthetic ordinary registry-grant pickup literal, opted in to cross a seam.
// x defaults to 4 (world 1028, ~18 px from the player -> inside 20 px radius).
function ordinaryPickup(id, opts) {
  opts = opts || {};
  const x = opts.x === undefined ? 4 : opts.x;
  return `{id:'${id}', name:'${opts.name || 'Potion'}', type:'${opts.type || 'potion'}', heals:20, price:30, x:${x}, y:208, picked:false, crossSeamPickup:'registry_grant'${opts.extra || ''}}`;
}

module.exports = {
  name: 'world-aware static content across seams: cross-seam pickups + opt-in NPC targets + prompt, fail-closed',
  run() {
    const g0 = onRoddon();
    const J = (e) => JSON.parse(g0.run(e));

    // ── A. PURE world-point content resolver ────────────────────────────────
    const inN1 = J("JSON.stringify(worldPointContentContext('overworld', 1028, 2128))");
    assert.equal(inN1.mapId, 'MAP3_N1', 'resolver maps a MAP3_N1 world point to MAP3_N1');
    assert.equal(inN1.localPxX, 4, 'resolver returns LOCAL pixel X (1028 - 1024)');
    assert.equal(inN1.localPxY, 208, 'resolver returns LOCAL pixel Y (2128 - 1920)');
    assert.equal(inN1.contentKey, 'map3_n1', 'resolver returns the OUTDOOR_CONTENT_KEYS content key');
    assert.equal(inN1.contentKeyUnambiguous, true, 'map3_n1 is owned by exactly one map -> unambiguous');
    const inRod = J("JSON.stringify(worldPointContentContext('overworld', 1010, 2128))");
    assert.equal(inRod.mapId, 'RODDON_WAY_MAP', 'resolver maps a RODDON world point to RODDON');
    assert.equal(inRod.contentKey, 'overworld', 'RODDON content key is overworld');
    assert.equal(inRod.contentKeyUnambiguous, false, "'overworld' is shared -> ambiguous");
    assert.equal(g0.run("worldPointContentContext('overworld', -5, 100)"), null, 'negative point -> null');
    assert.equal(g0.run("worldPointContentContext('overworld', 999999, 100)"), null, 'off-region/void point -> null');
    assert.equal(g0.run("worldPointContentContext('nope', 1028, 2128)"), null, 'unknown region -> null');
    assert.equal(g0.run("worldPointContentContext('overworld', NaN, 2128)"), null, 'non-finite point -> null');
    const beforeMap = g0.run("mapIdForRef(activeMap)");
    const beforeXY = J("JSON.stringify([player.x, player.y])");
    g0.run("worldPointContentContext('overworld', 1028, 2128); worldPointContentContext('overworld', 1010, 2128);");
    assert.equal(g0.run("mapIdForRef(activeMap)"), beforeMap, 'resolver leaves activeMap unchanged');
    assert.deepEqual(J("JSON.stringify([player.x, player.y])"), beforeXY, 'resolver leaves player position unchanged');

    // ── B. Cross-seam AUTHORIZATION (fail-closed geometry) ──────────────────
    const cross = (mapId, x, y) => g0.run(`(function(){var s=continuousSeamCrossingAt('${mapId}', ${x}, ${y}); return s? s.to : null;})()`);
    assert.equal(cross('RODDON_WAY_MAP', 1028, 2128), 'MAP3_N1', 'in-range east crossing authorizes MAP3_N1');
    assert.equal(cross('RODDON_WAY_MAP', 1010, 2128), null, 'a point on the active map -> no seam crossing');
    assert.equal(cross('RODDON_WAY_MAP', 1030, 1450), null, 'diagonal chunk -> not authorized');
    assert.equal(cross('RODDON_WAY_MAP', 1028, 2000), null, 'out-of-range crossing -> not authorized');
    assert.equal(cross('RODDON_WAY_MAP', 1600, 2128), null, 'void/unplaced target chunk -> not authorized');
    g0.run('continuousWorldViewEnabled = false;');
    assert.equal(cross('RODDON_WAY_MAP', 1028, 2128), null, 'Continuous View off -> no cross-seam authorization');
    g0.run('continuousWorldViewEnabled = true;');
    const nb = J("JSON.stringify(crossSeamNeighbourFor('RODDON_WAY_MAP', 1028, 2128))");
    assert.equal(nb.ctx.mapId, 'MAP3_N1', 'crossSeamNeighbourFor resolves the neighbour context');
    assert.equal(nb.seam.to, 'MAP3_N1', 'crossSeamNeighbourFor returns the crossed seam');

    // ── C. Cross-seam ITEM PICKUP + EXPLICIT item CAPABILITY (allowlist) ─────
    // The classifier is an ALLOWLIST capability, not "not quest_item/inscription".
    const cap = (lit) => JSON.parse(g0.run("JSON.stringify(crossSeamItemCapability(" + lit + "))"));
    // Recognized ordinary registry grant, opted in -> ok.
    assert.equal(cap(ordinaryPickup('pickup_ok')).ok, true, 'an opted-in ordinary registry grant satisfies the capability');
    // No opt-in at all -> fail closed by default (the core of this hardening).
    assert.equal(cap("{id:'pickup_noopt', name:'Potion', type:'potion', x:4, y:208, picked:false}").ok, false, 'a registry item WITHOUT crossSeamPickup fails closed by default');
    // Unknown capability -> fail closed.
    assert.equal(cap("{id:'pickup_unkcap', name:'Potion', type:'potion', x:4, y:208, picked:false, crossSeamPickup:'teleport_grant'}").ok, false, 'an unknown crossSeamPickup capability fails closed');
    // Missing id / unregistered name -> fail closed.
    assert.equal(cap("{name:'Potion', type:'potion', picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'a pickup with no stable id fails closed');
    assert.equal(cap("{id:'pickup_unreg', name:'No Such Item', type:'potion', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'an unregistered name fails closed');
    // Registry-def markers: questItem / keyItem -> fail closed even though the
    // TYPE is ordinary (Mushroom Wine = potion+questItem; Sealed Letter = accessory+questItem+keyItem).
    assert.equal(cap("{id:'pickup_quest_def', name:'Mushroom Wine', type:'potion', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'a registry questItem definition fails closed');
    assert.equal(cap("{id:'pickup_key_def', name:'Sealed Letter', type:'accessory', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'a registry keyItem definition fails closed');
    // quest_item / inscription pickup TYPES -> not ordinary -> fail closed.
    assert.equal(cap("{id:'pickup_qtype', name:'Potion', type:'quest_item', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'a quest_item pickup type fails closed');
    assert.equal(cap("{id:'pickup_insc', name:'Potion', type:'inscription', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'an inscription pickup type fails closed');
    // Non-ordinary registry types (rod/buff/reagent) -> fail closed.
    assert.equal(cap("{id:'pickup_rod', name:'Old Fishing Rod', type:'rod', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'a rod (key item) fails closed');
    assert.equal(cap("{id:'pickup_buff', name:'Bullet Time', type:'buff', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'a battle-only buff fails closed');
    assert.equal(cap("{id:'pickup_reagent', name:'Henbane Sprig', type:'reagent', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'a combat reagent fails closed');
    // Behaviour-bearing pickup properties (callback/onCollect/scriptedPickup) -> fail closed.
    assert.equal(cap(ordinaryPickup('pickup_cb', { extra: ", callback:1" })).ok, false, 'a callback-bearing pickup fails closed');
    assert.equal(cap(ordinaryPickup('pickup_onc', { extra: ", onCollect:1" })).ok, false, 'an onCollect-bearing pickup fails closed');
    assert.equal(cap(ordinaryPickup('pickup_scr', { extra: ", scriptedPickup:1" })).ok, false, 'a scriptedPickup-bearing pickup fails closed');
    // A newly invented property cannot silently authorize collection.
    assert.equal(cap(ordinaryPickup('pickup_future', { extra: ", futureThing:{}" })).ok, false, 'a newly invented pickup property fails closed');
    // Unknown REGISTRY type fails closed (inject a future-typed registry entry).
    g0.run("ITEM_REGISTRY['Future Widget'] = {name:'Future Widget', type:'future_type', price:0};");
    assert.equal(cap("{id:'pickup_ftype', name:'Future Widget', type:'future_type', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'}").ok, false, 'an unknown registry TYPE fails closed');
    g0.run("delete ITEM_REGISTRY['Future Widget'];");

    // (1) An opted-in ordinary item within radius, authorized, is GRANTED once,
    // marked picked (disappears immediately), and cannot re-grant.
    {
      const g = onRoddon();
      g.run("MAP3_N1_ITEMS.push(" + ordinaryPickup('pickup_synth_a') + ");");
      const itemsBefore = g.run("stats.items.length");
      g.frames(1);
      assert.equal(g.run("MAP3_N1_ITEMS.find(function(i){return i.id==='pickup_synth_a';}).picked"), true, 'neighbour item is marked picked across the seam');
      assert.equal(g.run("stats.items.filter(function(i){return i.name==='Potion';}).length"), 1, 'neighbour item granted exactly once');
      g.frames(1);
      assert.equal(g.run("stats.items.length"), itemsBefore + 1, 'a later frame cannot re-grant the picked item');
      assert.equal(g.run("mapIdForRef(activeMap)"), 'RODDON_WAY_MAP', 'pickup did not switch activeMap');
      assert.equal(g.run("player.x"), 498, 'pickup did not move the player (x)');
      assert.equal(g.run("combat.active"), false, 'cross-seam pickup query never starts combat');
    }
    // (2) Just OUTSIDE the pickup radius -> not collected (opted in, but far).
    {
      const g = onRoddon();
      g.run("MAP3_N1_ITEMS.push(" + ordinaryPickup('pickup_far', { x: 24 }) + ");"); // world 1048, 38px
      g.frames(1);
      assert.equal(g.run("MAP3_N1_ITEMS.find(function(i){return i.id==='pickup_far';}).picked"), false, 'item beyond 20 px is not collected across the seam');
    }
    // (3) A registry item WITHOUT the opt-in does NOT cross (default fail-closed).
    {
      const g = onRoddon();
      g.run("MAP3_N1_ITEMS.push({id:'pickup_noopt2', name:'Potion', type:'potion', heals:20, price:30, x:4, y:208, picked:false});");
      g.frames(1);
      assert.equal(g.run("MAP3_N1_ITEMS.find(function(i){return i.id==='pickup_noopt2';}).picked"), false, 'an un-opted-in ordinary item does not cross a seam');
    }
    // (4) quest_item FAILS CLOSED across a seam even if it opts in.
    {
      const g = onRoddon();
      g.run("sickle_quest_stage = 1; MAP3_N1_ITEMS.push({id:'pickup_quest', name:'Fen Sickle', type:'quest_item', x:4, y:208, picked:false, crossSeamPickup:'registry_grant'});");
      g.frames(1);
      assert.equal(g.run("MAP3_N1_ITEMS.find(function(i){return i.id==='pickup_quest';}).picked"), false, 'quest_item is not picked across a seam');
      assert.equal(g.run("sickle_quest_stage"), 1, 'quest_item pickup did not advance quest state across a seam');
      assert.equal(g.run("dialogue.open"), false, 'quest_item pickup opened no dialogue across a seam');
    }
    // (5) inscription FAILS CLOSED across a seam even if it opts in.
    {
      const g = onRoddon();
      g.run("MAP3_N1_ITEMS.push({id:'pickup_insc2', name:'Old Notice', type:'inscription', lore:[['lore']], x:4, y:208, picked:false, crossSeamPickup:'registry_grant'});");
      g.frames(1);
      assert.equal(g.run("MAP3_N1_ITEMS.find(function(i){return i.id==='pickup_insc2';}).picked"), false, 'inscription is not collected across a seam');
      assert.equal(g.run("dialogue.open"), false, 'inscription opened no lore dialogue across a seam');
    }
    // (6) Continuous View OFF -> no cross-seam pickup.
    {
      const g = onRoddon();
      g.run("continuousWorldViewEnabled = false; MAP3_N1_ITEMS.push(" + ordinaryPickup('pickup_off') + ");");
      g.frames(1);
      assert.equal(g.run("MAP3_N1_ITEMS.find(function(i){return i.id==='pickup_off';}).picked"), false, 'no cross-seam pickup when Continuous View is off');
    }
    // (7) The ACTIVE map's own pickup path is UNCHANGED — an ordinary item with NO
    // crossSeamPickup opt-in is still collected normally on its own map.
    {
      const g = onRoddon();
      g.run("RODDON_WAY_ITEMS.push({id:'pickup_active', name:'Potion', type:'potion', heals:20, price:30, x:498, y:208, picked:false});");
      g.frames(1);
      assert.equal(g.run("RODDON_WAY_ITEMS.find(function(i){return i.id==='pickup_active';}).picked"), true, 'active-map item still collected normally (no opt-in needed)');
    }

    // ── D. Cross-seam INTERACTION via EXPLICIT opt-in capability ─────────────
    // (1) An opted-in simple-dialogue NPC, in reach and authorized, is talked to.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_npc_a', 'Reedcutter', 12) + ");");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), true, 'opted-in cross-seam simple NPC opens dialogue');
      assert.equal(g.run("dialogue.name"), 'Reedcutter', 'the resolved neighbour NPC is the one opened');
      assert.equal(g.run("mapIdForRef(activeMap)"), 'RODDON_WAY_MAP', 'talk did not switch activeMap');
      assert.equal(g.run("SIMPLE_NPCS.find(function(n){return n.id==='synth_npc_a';}).x"), 12, 'NPC not moved/cloned by cross-seam talk');
    }
    // (2) flag_sets is applied on cross-seam talk.
    {
      const g = onRoddon();
      g.run("window.synth_talked = false; SIMPLE_NPCS.push({id:'synth_npc_flag', name:'Warden', map:'map3_n1', x:12, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:{flag:'synth_talked', value:true}, action:null, crossSeamInteraction:'simple_dialogue'});");
      g.run("handleInteract();");
      assert.equal(g.run("window.synth_talked"), true, 'authored flag_sets is applied on cross-seam talk');
    }
    // (3) A PLAIN NPC WITHOUT the explicit capability is rejected (no absence-based eligibility).
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_plain', name:'Plain', map:'map3_n1', x:12, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, action:null});");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'a plain NPC without crossSeamInteraction is NOT cross-seam-dispatched');
    }
    // (4) An UNKNOWN capability fails closed.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_unknowncap', name:'Unknown', map:'map3_n1', x:12, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, action:null, crossSeamInteraction:'teleport_and_fight'});");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'an unknown crossSeamInteraction capability fails closed');
    }
    // (5) An opted-in NPC that ALSO has an action is runtime-rejected (defence in depth).
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_optaction', name:'ScriptedOptIn', map:'map3_n1', x:12, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, crossSeamInteraction:'simple_dialogue', action:function(){ dialogue.name='SHOULD_NOT'; dialogue.pages=[['x']]; dialogue.open=true; }});");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'an opted-in NPC with an action is not cross-seam-dispatched');
    }
    // (6) An opted-in NPC that ALSO has movement/route is runtime-rejected.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_optmove', name:'MoverOptIn', map:'map3_n1', x:12, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, crossSeamInteraction:'simple_dialogue', movement:{type:'patrol', waypoints:[{x:2,y:2}], speed:1}});");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'an opted-in NPC with movement is not cross-seam-dispatched');
    }
    // (7) An opted-in NPC on an AMBIGUOUS neighbour key forfeits ownership.
    // Active=MAP3_N1, neighbour west=RODDON (key 'overworld', ambiguous).
    {
      const g = createContext();
      g.press('Enter'); g.press('Enter');
      g.run(`debugWarpToDestination('outdoor:MAP3_N1');
             dialogue.open=false; menu.open=false; choice.open=false; shop.open=false; debugMenu.open=false; warpMenu.open=false;
             debugMode = true; continuousWorldViewEnabled = true;
             for (var k in keys) delete keys[k];
             player.x = 14; player.y = 208; player.moving = false; player.facing='left';; __reconcileCanonicalForTest();`);
      g.run("SIMPLE_NPCS.push({id:'synth_amb', name:'Ambiguous', map:'overworld', x:500, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, action:null, crossSeamInteraction:'simple_dialogue'});");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'an opted-in ambiguous-key neighbour NPC is never cross-seam-targeted');
    }
    // (8) An opted-in NPC beyond TALK_RADIUS is not targeted.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_far_npc', 'TooFar', 40) + ");"); // world 1064, 54px
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'an opted-in neighbour NPC beyond TALK_RADIUS is not targeted');
    }
    // (9) Continuous View OFF -> no cross-seam interaction.
    {
      const g = onRoddon();
      g.run("continuousWorldViewEnabled = false; SIMPLE_NPCS.push(" + optedInNpc('synth_off_npc', 'Off', 12) + ");");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'no cross-seam interaction when Continuous View is off');
    }
    // (10) ACTIVE-map interaction has PRIORITY over an eligible neighbour.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_active_npc', name:'ActiveGuy', map:'overworld', x:498, y:208, facing:'down', dialogue:[['active']], flag_required:null, flag_sets:null, action:null});");
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_neighbour_npc', 'NeighbourGuy', 12) + ");");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), true, 'the active-map NPC consumes the press');
      assert.equal(g.run("dialogue.name"), 'ActiveGuy', 'active-map target wins over the cross-seam neighbour');
    }
    // (11) resolveCrossSeamInteractTarget is READ-ONLY.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_ro', 'RO', 12) + ");");
      const id = g.run("(function(){var n=resolveCrossSeamInteractTarget(); return n? n.id : null;})()");
      assert.equal(id, 'synth_ro', 'resolver selects the reachable opted-in neighbour NPC');
      assert.equal(g.run("dialogue.open"), false, 'resolving a target does not open dialogue by itself');
      assert.equal(g.run("mapIdForRef(activeMap)"), 'RODDON_WAY_MAP', 'resolving a target does not switch activeMap');
    }

    // ── E. VALIDATION: mis-opted-in NPCs are hard errors; future metadata safe ─
    const validateWith = (npcLiteral) => JSON.parse(g0.run(`(function(){
      SIMPLE_NPCS.push(${npcLiteral});
      var v = validateGameData();
      SIMPLE_NPCS.pop();
      var errs = (v.errorList||[]).filter(function(e){ return /crossSeamInteraction/.test(e.message); });
      return JSON.stringify({errors: errs.length, sample: errs[0] ? errs[0].message : null});
    })()`));
    // A well-formed opted-in NPC on an unambiguous key produces NO error.
    assert.equal(validateWith(optedInNpc('vf_ok', 'OK', 12)).errors, 0, 'a well-formed opted-in NPC validates clean');
    // Unknown capability -> validation error.
    assert.ok(validateWith("{id:'vf_unknown', name:'U', map:'map3_n1', x:12, y:208, dialogue:[['.']], flag_required:null, flag_sets:null, action:null, crossSeamInteraction:'future_behavior'}").errors > 0, 'unknown capability is a validation error');
    // Opted-in + action -> validation error.
    assert.ok(validateWith("{id:'vf_action', name:'A', map:'map3_n1', x:12, y:208, dialogue:[['.']], flag_required:null, flag_sets:null, crossSeamInteraction:'simple_dialogue', action:'someAction'}").errors > 0, 'opted-in NPC with an action is a validation error');
    // Opted-in on an ambiguous key -> validation error.
    assert.ok(validateWith("{id:'vf_amb', name:'A', map:'overworld', x:12, y:208, dialogue:[['.']], flag_required:null, flag_sets:null, action:null, crossSeamInteraction:'simple_dialogue'}").errors > 0, 'opted-in NPC on an ambiguous key is a validation error');
    // Future unknown BEHAVIOUR metadata cannot silently become safe: an NPC that
    // carries some future field but NO recognized capability is never eligible.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_future', name:'Future', map:'map3_n1', x:12, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, action:null, someFutureBehavior:{kind:'cutscene'}});");
      g.run("handleInteract();");
      assert.equal(g.run("dialogue.open"), false, 'future behaviour metadata without an opt-in capability is never cross-seam-safe');
    }
    // validateGameData() also errors on a mis-opted-in PICKUP (registered with a
    // crossSeamPickup that does not satisfy the ordinary registry_grant contract).
    const pickupErrs = (lit) => JSON.parse(g0.run(`(function(){
      var it = ${lit}; MAP3_N1_ITEMS.push(it); PICKUP_REGISTRY[it.id] = it; PICKUP_REGISTRY_IDS.push(it.id);
      var v = validateGameData();
      MAP3_N1_ITEMS.pop(); delete PICKUP_REGISTRY[it.id]; PICKUP_REGISTRY_IDS.pop();
      return (v.errorList||[]).filter(function(e){ return /crossSeamPickup/.test(e.message); }).length;
    })()`));
    assert.ok(pickupErrs("{id:'pickup_bad_cap', name:'Potion', type:'potion', picked:false, x:4, y:208, crossSeamPickup:'nope'}") > 0, 'a pickup with an unknown crossSeamPickup capability is a validation error');
    assert.ok(pickupErrs("{id:'pickup_bad_quest', name:'Mushroom Wine', type:'potion', picked:false, x:4, y:208, crossSeamPickup:'registry_grant'}") > 0, 'a questItem-registry pickup that opts in is a validation error');
    assert.ok(pickupErrs("{id:'pickup_bad_prop', name:'Potion', type:'potion', picked:false, x:4, y:208, crossSeamPickup:'registry_grant', onCollect:1}") > 0, 'an opted-in pickup with a behaviour-bearing property is a validation error');
    assert.equal(pickupErrs("{id:'pickup_good', name:'Potion', type:'potion', picked:false, x:4, y:208, heals:20, price:30, crossSeamPickup:'registry_grant'}"), 0, 'a well-formed opted-in pickup validates clean');

    // ── F. PROMPT selection + rendering (same authority as the press) ────────
    // Count SPACE draws emitted by drawCrossSeamInteractPrompt() in isolation.
    const promptCount = (g) => g.run(`(function(){
      var n=0, _ft=ctx.fillText; ctx.fillText=function(t){ if(t==='SPACE') n++; return _ft&&_ft.apply(ctx,arguments); };
      tick = 16;                              // (tick>>4)&1 === 1 -> hint is drawn this frame
      drawCrossSeamInteractPrompt();
      ctx.fillText=_ft; return n;
    })()`);
    // (1) An explicitly safe selected neighbour displays EXACTLY ONE prompt.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_prompt', 'Prompted', 12) + ");");
      assert.equal(g.run("(function(){var n=crossSeamInteractPromptTarget(); return n?n.id:null;})()"), 'synth_prompt', 'prompt authority selects the safe neighbour');
      assert.equal(promptCount(g), 1, 'a safe selected neighbour displays exactly one prompt');
      // no state mutation from prompt resolution/render
      assert.equal(g.run("mapIdForRef(activeMap)"), 'RODDON_WAY_MAP', 'prompt resolution does not switch activeMap');
      assert.equal(g.run("dialogue.open"), false, 'prompt resolution does not open dialogue');
    }
    // (2) A visible-but-UNAUTHORIZED NPC (not opted in) displays no prompt.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_vis', name:'Visible', map:'map3_n1', x:12, y:208, facing:'down', dialogue:[['.']], flag_required:null, flag_sets:null, action:null});");
      assert.equal(g.run("crossSeamInteractPromptTarget()"), null, 'an unauthorized neighbour yields no prompt target');
      assert.equal(promptCount(g), 0, 'a visible but unauthorized neighbour displays no prompt');
    }
    // (3) A nearer/higher-priority ACTIVE target suppresses the neighbour prompt.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push({id:'synth_active2', name:'ActiveGuy2', map:'overworld', x:498, y:208, facing:'down', dialogue:[['a']], flag_required:null, flag_sets:null, action:null});");
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_neighbour2', 'NeighbourGuy2', 12) + ");");
      assert.equal(g.run("crossSeamInteractPromptTarget()"), null, 'an active target suppresses the neighbour prompt target');
      assert.equal(promptCount(g), 0, 'a higher-priority active target suppresses the neighbour prompt');
    }
    // (4) The prompt does not duplicate during activeMap handoff: once the former
    // neighbour becomes the ACTIVE map it is no longer a cross-seam neighbour.
    {
      const g = onRoddon();
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_handoff', 'Handoff', 12) + ");");
      assert.equal(promptCount(g), 1, 'before handoff: one neighbour prompt');
      g.run(`debugWarpToDestination('outdoor:MAP3_N1');
             dialogue.open=false; continuousWorldViewEnabled=true; debugMode=true;
             for (var k in keys) delete keys[k]; player.x = 12; player.y = 208;; __reconcileCanonicalForTest();`);
      assert.equal(g.run("crossSeamInteractPromptTarget()"), null, 'after handoff the former neighbour is active -> no cross-seam prompt');
      assert.equal(promptCount(g), 0, 'after handoff: the prompt does not persist/duplicate');
    }

    // ── G. SAVE / LOAD of a cross-seam-collected generic item ───────────────
    {
      const g = onRoddon();
      // Register a synthetic pickup so the existing stable-id persistence covers it.
      g.run(`(function(){
        var it = {id:'synth_persist', name:'Potion', type:'potion', heals:20, price:30, x:4, y:208, picked:false, crossSeamPickup:'registry_grant'};
        MAP3_N1_ITEMS.push(it);
        PICKUP_REGISTRY['synth_persist'] = it;
        PICKUP_REGISTRY_IDS.push('synth_persist');
      })()`);
      const before = g.run("stats.items.length");
      g.frames(1);
      assert.equal(g.run("PICKUP_REGISTRY['synth_persist'].picked"), true, 'granted once & marked picked across the seam');
      assert.equal(g.run("stats.items.length"), before + 1, 'granted exactly once');
      g.run("__reconcileCanonicalForTest(); saveGame();");
      // Saved id set contains it; simulate a fresh session then load.
      assert.ok(JSON.parse(g.run("localStorage.getItem('verdantVale_save')")).collectedPickupIds.indexOf('synth_persist') >= 0, 'the collected id is written to the save');
      g.run("PICKUP_REGISTRY['synth_persist'].picked = false;");   // pretend uncollected in a new runtime
      g.run("loadGame();");
      assert.equal(g.run("PICKUP_REGISTRY['synth_persist'].picked"), true, 'the item survives save/load as picked');
      // After load, standing on RODDON again, it stays absent and cannot re-grant.
      g.run(`for (var k in keys) delete keys[k]; player.x=498; player.y=208; dialogue.open=false;; __reconcileCanonicalForTest();`);
      const afterLoadItems = g.run("stats.items.filter(function(i){return i.name==='Potion';}).length");
      g.frames(1);
      assert.equal(g.run("stats.items.filter(function(i){return i.name==='Potion';}).length"), afterLoadItems, 'a picked item cannot be re-granted after loading + handoff');
    }

    // ── H. ENCOUNTER ownership + pickup/interaction never roll ───────────────
    // Source vs destination pool ownership is the active map's own metadata pool —
    // the exact selector startCombat() uses. Use a pair with DIFFERENT pools.
    {
      const g = createContext();
      g.press('Enter'); g.press('Enter');
      g.run("debugWarpToDestination('outdoor:NORTH_BASIN_W_MAP'); debugMode=true; continuousWorldViewEnabled=true;");
      assert.equal(g.run("currentEncounterPool() === MAP_METADATA['NORTH_BASIN_W_MAP'].encounterPool"), true, 'the source map owns its encounter pool before handoff');
      g.run("debugWarpToDestination('outdoor:NORTH_BASIN_NW_MAP');");
      assert.equal(g.run("currentEncounterPool() === MAP_METADATA['NORTH_BASIN_NW_MAP'].encounterPool"), true, 'the destination map owns its encounter pool after handoff');
      assert.equal(g.run("MAP_METADATA['NORTH_BASIN_W_MAP'].encounterPool !== MAP_METADATA['NORTH_BASIN_NW_MAP'].encounterPool"), true, 'the two seam-adjacent maps have distinct pools (ownership is observable)');
    }
    // Pickup and interaction resolution NEVER roll (consume no RNG, start no combat).
    {
      const g = onRoddon();
      g.run("MAP3_N1_ITEMS.push(" + ordinaryPickup('pickup_noroll') + ");");
      g.run("SIMPLE_NPCS.push(" + optedInNpc('synth_noroll_npc', 'NoRoll', 12) + ");");
      const rolls = g.run(`(function(){
        var rc=0, _r=Math.random; Math.random=function(){ rc++; return _r(); };
        var sc=0, _sc=startCombat; startCombat=function(){ sc++; };
        crossSeamStaticPickup();
        resolveCrossSeamInteractTarget();
        crossSeamInteractPromptTarget();
        tryCrossSeamNeighbourInteract();
        Math.random=_r; startCombat=_sc;
        return rc + '|' + sc;
      })()`);
      assert.equal(rolls, '0|0', 'cross-seam pickup + interaction + prompt resolution roll no RNG and start no combat');
    }
  },
};
