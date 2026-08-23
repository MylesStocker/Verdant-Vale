'use strict';
// Regression coverage for the Sunken Gallery + Pale Sentry repairs.
//
// Root cause of the Gallery defects: tryEdgeTransition() (world-transitions.js)
// crossed an edge seam with NO location-state, resetting inSunkenGallery to
// neutral on every room↔room crossing. That broke THREE things at once — the
// location NAME (fell through to "Verdant Vale"), the exit UP-STAIR (gated on
// inSunkenGallery), and the trapped-Pale-Drowned interaction (dispatch gated on
// `match: () => inSunkenGallery`). The fix: an edge seam continues the current
// location mode when its DESTINATION is non-outdoor (the Gallery's dungeon-type
// rooms), and lands neutral on an outdoor destination.
//
// Pale Sentry: its combat-startup dispatch now keys off the CANONICAL physical
// map id (regionalActiveMapId()) rather than the activeMap projection.

const assert = require('assert/strict');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

function fresh() {
  const g = createContext();
  g.press('Enter'); g.press('Enter');
  g.run('debugMode=true;dialogue.open=false;choice.open=false;menu.open=false;');
  return g;
}
const R = (g, c) => g.run(c);
// Cross a single gallery seam by standing on the given edge and firing it.
function crossSeam(g, dir, x, y) {
  g.run(`player.x=${x}*TILE;player.y=${y}*TILE;combat.cooldown=0;`);
  return g.run(`tryEdgeTransition('${dir}')`);
}

module.exports = {
  name: 'Sunken Gallery naming/exit/Pale-Drowned + Pale Sentry: seam-crossing regressions',
  run() {
    const g = fresh();
    const J = (e) => JSON.parse(g.run(e));

    // ══ A. NAMING: every genuine Gallery map/state reports "Sunken Gallery" ══
    // Descend, then cross real room↔room seams — the mode and name must persist.
    g.run('resetLocationState();descendSunkenGallery();');
    assert.equal(g.run('inSunkenGallery'), true, 'descend sets the Gallery mode');
    assert.equal(g.run('locationName()'), 'Sunken Gallery', 'entrance hall name');
    // Entrance north doorway (cols 4-6) -> R3C0
    assert.equal(crossSeam(g, 'north', 5.5, 0.5), true, 'N seam crosses');
    assert.equal(g.run("mapIdForRef(activeMap)"), 'SUNKEN_GALLERY_R3C0');
    assert.equal(g.run('inSunkenGallery'), true, 'mode preserved across the N seam (was the bug)');
    assert.equal(g.run('locationName()'), 'Sunken Gallery', 'destination room name (not "Verdant Vale")');
    // R3C0 north -> R2C0, then east -> R2C1
    assert.equal(crossSeam(g, 'north', 5.5, 0.5), true);
    assert.equal(g.run('locationName()'), 'Sunken Gallery', 'R2C0 name');
    assert.equal(crossSeam(g, 'east', 15.5, 7.5), true);
    assert.equal(g.run("mapIdForRef(activeMap)"), 'SUNKEN_GALLERY_R2C1');
    assert.equal(g.run('locationName()'), 'Sunken Gallery', 'R2C1 name after an E seam');

    // Debug warp to EVERY Gallery map id resolves the correct name immediately.
    const galleryIds = ['SUNKEN_GALLERY_MAP'].concat(
      J("JSON.stringify(Object.keys(MAP_CATALOG).filter(function(k){return /^SUNKEN_GALLERY_R\\dC\\d$/.test(k);}))"));
    assert.equal(galleryIds.length, 25, 'entrance + 24 rooms');
    for (const id of galleryIds) {
      g.run(`resetLocationState();activeMap=${id};inSunkenGallery=true;player.x=8.5*TILE;player.y=8.5*TILE;`);
      assert.equal(g.run('locationName()'), 'Sunken Gallery', `${id} reports Sunken Gallery`);
    }
    // Non-Gallery names unchanged.
    g.run('resetLocationState();placeAtLocation("MAP",8.5*TILE,8.5*TILE);__reconcileCanonicalForTest();');
    assert.equal(g.run('locationName()'), 'Verdant Vale', 'the start overworld is still Verdant Vale');
    g.run('resetLocationState();placeAtLocation("MAP2",6.5*TILE,6.5*TILE);__reconcileCanonicalForTest();');
    assert.notEqual(g.run('locationName()'), 'Sunken Gallery', 'a neighbouring overworld map is not the Gallery');

    // ══ B. EXIT STAIR reciprocity + connectivity + no soft-lock ══
    // Entrance works; the up-stair exits to the Upper Reach on a walkable, faced tile.
    g.run('resetLocationState();descendSunkenGallery();');
    // wander out via a seam and back, THEN use the up-stair (proves it survives crossings)
    crossSeam(g, 'north', 5.5, 0.5);            // -> R3C0
    crossSeam(g, 'south', 5.5, 14.5);           // -> entrance hall
    assert.equal(g.run("mapIdForRef(activeMap)"), 'SUNKEN_GALLERY_MAP', 'seams are reciprocal (returned to entrance)');
    assert.equal(g.run('inSunkenGallery'), true, 'mode still set back in the entrance');
    g.run('player.x=2.5*TILE;player.y=2.5*TILE;player.facing="up";combat.cooldown=0;');
    assert.equal(g.run('tileAt(player.x,player.y)===GALLERY_STAIR_UP'), true, 'up-stair tile at r2 c2');
    g.run('ascendSunkenGallery();');
    assert.equal(g.run("mapIdForRef(activeMap)"), 'NORTH_BASIN_NW_MAP', 'up-stair exits to the Upper Reach');
    assert.equal(g.run('inSunkenGallery'), false, 'Gallery mode cleared on exit');
    assert.equal(g.run('canWalk(player.x,player.y)'), true, 'exterior landing is walkable');
    assert.equal(g.run('player.facing'), 'down', 'exterior landing faces down');
    assert.equal(g.run('locationName()'), 'North Basin — Upper Reach', 'exterior name');
    // Reciprocal re-entry works.
    g.run('resetLocationState();placeAtLocation("NORTH_BASIN_NW_MAP",12.5*TILE,4.5*TILE);descendSunkenGallery();');
    assert.equal(g.run('inSunkenGallery') && g.run('locationName()') === 'Sunken Gallery', true, 're-descend works');
    // Every Gallery room is connected to the entrance hall via the seam graph
    // (so every section retains a route to the exit up-stair).
    const reachable = J(`(function(){
      var start='SUNKEN_GALLERY_MAP', seen={}, q=[start]; seen[start]=1;
      while(q.length){ var m=q.shift(); var dirs=EDGE_TRANSITIONS[m]||{};
        for(var d in dirs){ dirs[d].forEach(function(s){ var t=s.targetMap; if(t&&!seen[t]){seen[t]=1;q.push(t);} }); } }
      return JSON.stringify(Object.keys(seen).filter(function(k){return /^SUNKEN_GALLERY/.test(k);}).sort());
    })()`);
    assert.equal(reachable.length, 25, 'all 25 Gallery maps are reachable from the entrance (route to the exit exists)');
    // Defeat recovery from a deep room does not strand the player in the Gallery.
    g.run('resetLocationState();descendSunkenGallery();');
    crossSeam(g, 'north', 5.5, 0.5);
    g.run('defeatWakeAtHome=true;combat.active=true;combat.phase="defeat";combat.enemy={name:"D",hp:1,maxHp:1,atk:1,def:0,spd:1};stats.hp=0;handleCombatAction();');
    assert.equal(g.run('inSunkenGallery'), false, 'defeat clears the Gallery mode (not stranded)');
    assert.equal(g.run("currentMapId()"), 'house:player_house', 'defeat recovery relocates home');
    g.run('dialogue.open=false;');

    // ══ C. PALE DROWNED interaction restored (dispatch gated on inSunkenGallery) ══
    // Reach R1C2 by crossing a seam (mode preserved), then examine at (8.5,8.5).
    g.run('debugWarpToDestination("special:sunken_gallery_room");'); // inSunkenGallery=true
    g.run('activeMap=SUNKEN_GALLERY_R1C1;player.x=15.5*TILE;player.y=8.5*TILE;combat.cooldown=0;tryEdgeTransition("east");');
    assert.equal(g.run("mapIdForRef(activeMap)==='SUNKEN_GALLERY_R1C2' && inSunkenGallery"), true, 'crossed into the Pale Drowned room, mode preserved');
    g.run('window.sunken_gallery_drowned_freed=false;window.sunken_gallery_drowned_slain=false;window.sunken_gallery_gift_taken=false;');
    // out of range: no prompt (fails closed on range)
    g.run('player.x=2.5*TILE;player.y=2.5*TILE;dialogue.open=false;');
    assert.equal(g.run('interactSunkenGallery()'), false, 'out of range: no Pale Drowned prompt');
    // in range: the prompt appears and the dispatch fires (via handleInteract)
    g.run('player.x=8.5*TILE;player.y=8.5*TILE;dialogue.open=false;choice.open=false;handleInteract();');
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /Pale Drowned is caught here/, 'eligible: the saving-event prompt shows');
    g.run('handleInteract();handleInteract();'); // advance to the choice
    assert.equal(g.run('choice.open') && g.run('choice.options.length') === 3, true, 'free / put down / back away');
    g.run('choice.open=false;choice.callbacks[0]();'); // Work it free
    assert.equal(g.run('window.sunken_gallery_drowned_freed') === true && g.run('window.sunken_gallery_drowned_slain') === false, true, 'freed once, not slain');
    // resolved revisit is idempotent (fails closed to the spared text)
    g.run('dialogue.open=false;player.x=8.5*TILE;player.y=8.5*TILE;handleInteract();');
    assert.match(g.run("dialogue.pages.flat().join(' ')"), /let a dangerous thing go free|somewhere under it/, 'resolved revisit: spared text, no duplicate event');
    // wrong room: the handler returns false (fails closed)
    g.run('dialogue.open=false;activeMap=SUNKEN_GALLERY_R3C3;player.x=8.5*TILE;player.y=8.5*TILE;');
    assert.equal(g.run('interactSunkenGallery()'), false, 'wrong room: no Pale Drowned event');
    // the freed flag is persistent (save-bound)
    assert.equal(g.run("QUEST_FLAG_SCHEMA.includes('sunken_gallery_drowned_freed')"), true, 'freed state is save-bound');

    // ══ D. PALE SENTRY dispatch (canonical authority), quest-gated, one roll ══
    // Before acceptance: no Sentry even on MAP_N2.
    g.run('sentry_seen_on_board=true;sentry_quest_started=false;sentry_quest_done=false;syncQuestFlagsToWindow();');
    g.run('resetLocationState();placeAtLocation("MAP_N2",1.5*TILE,9.5*TILE);__reconcileCanonicalForTest();combat.active=false;startCombat();');
    assert.equal(g.run('combat.isPaleSentry'), false, 'no accepted quest: no Sentry');
    g.run('endCombat();');
    // Accepted + on MAP_N2: the registered Sentry is selected, in BOTH view modes.
    g.run('sentry_quest_started=true;pale_sentry_hp=500;syncQuestFlagsToWindow();');
    for (const legacy of ['false', 'true']) {
      g.run(`forceLegacyRegionalView=${legacy};resetLocationState();placeAtLocation("MAP_N2",1.5*TILE,9.5*TILE);__reconcileCanonicalForTest();combat.active=false;startCombat();`);
      assert.equal(g.run("combat.isPaleSentry && combat.enemy.id==='enemy_pale_sentry'"), true, `Sentry eligible (legacy=${legacy})`);
      assert.equal(g.run('combat.enemy.hp'), 500, 'seeded from pale_sentry_hp');
      g.run('endCombat();');
    }
    assert.equal(g.run('!!ENEMY_TEMPLATE_REGISTRY.enemy_pale_sentry && !!ENEMY_SPRITE_DISPATCH.enemy_pale_sentry'), true, 'registered template + dedicated sprite');
    // Its probabilistic ENCOUNTER GATE selects the Sentry with at most one roll and
    // one dispatch (drive one eligible step; count startCombat calls).
    g.run('forceLegacyRegionalView=false;resetLocationState();placeAtLocation("MAP_N2",1.5*TILE,9.5*TILE);__reconcileCanonicalForTest();');
    const oneRoll = J(`(function(){
      debugMode=false;combat.active=false;combat.cooldown=0;player.step=15;for(var k in keys)delete keys[k];keys.ArrowRight=true;
      var starts=0,calls=0,_s=startCombat,_r=Math.random;
      startCombat=function(){starts++;_s();};Math.random=function(){calls++;return 0;};
      update();
      Math.random=_r;startCombat=_s;for(var k in keys)delete keys[k];
      return JSON.stringify({starts:starts,rand:calls,isSentry:combat.isPaleSentry});
    })()`);
    assert.deepEqual(oneRoll, { starts: 1, rand: 1, isSentry: true }, 'one encounter roll, one dispatch, Sentry selected');
    g.run('debugMode=true;endCombat();');
    // Wrong map / completed quest: no Sentry.
    g.run('resetLocationState();placeAtLocation("MAP_N1",7.5*TILE,7.5*TILE);__reconcileCanonicalForTest();combat.active=false;startCombat();');
    assert.equal(g.run('combat.isPaleSentry'), false, 'wrong map (MAP_N1): no Sentry');
    g.run('combat.active=false;sentry_quest_done=true;syncQuestFlagsToWindow();resetLocationState();placeAtLocation("MAP_N2",1.5*TILE,9.5*TILE);__reconcileCanonicalForTest();combat.active=false;startCombat();');
    assert.equal(g.run('combat.isPaleSentry'), false, 'completed quest: Sentry suppressed');
    g.run('combat.active=false;');
    // Save/load preserves eligibility + completion flags.
    assert.equal(g.run("['sentry_quest_started','sentry_quest_done','sentry_seen_on_board','pale_sentry_hp'].every(function(k){return QUEST_FLAG_SCHEMA.includes(k);})"), true, 'Sentry quest flags are save-bound');

    // ══ E. HARDENED mode propagation: destination-declared locationMode ══
    // The Gallery maps declare their location mode; the rule keys off that, not the
    // destination's bare type. (No hardcoded Gallery id list in transition code.)
    assert.equal(g.run("MAP_CATALOG.SUNKEN_GALLERY_MAP.locationMode"), 'inSunkenGallery', 'entrance declares its mode');
    assert.equal(g.run("MAP_CATALOG.SUNKEN_GALLERY_R0C4.locationMode"), 'inSunkenGallery', 'far room declares its mode');
    // (6) A non-outdoor destination that does NOT declare inSunkenGallery cannot
    //     inherit it — it lands neutral. (Synthetically strip a room's declaration.)
    g.run('resetLocationState();descendSunkenGallery();');
    g.run('window.__savedMode=MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode; delete MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode;');
    const crossedInto = crossSeam(g, 'north', 5.5, 0.5);
    assert.equal(crossedInto && g.run("mapIdForRef(activeMap)") === 'SUNKEN_GALLERY_R3C0', true, 'still crosses into the (now mode-less) non-outdoor room');
    assert.equal(g.run('inSunkenGallery'), false, 'a mode-less non-outdoor destination does NOT inherit inSunkenGallery');
    g.run('MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode=window.__savedMode;'); // restore
    // (7) A destination declaring a mode that cannot form a valid state on its own
    //     (inDungeon needs dungeonFloor) fails CLOSED — no move, no partial mutation.
    g.run('resetLocationState();descendSunkenGallery();');
    g.run('window.__savedMode2=MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode; MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode="inDungeon";');
    g.run('player.x=5.5*TILE;player.y=0.5*TILE;player.facing="up";combat.cooldown=0;');
    const beforeMap = g.run("mapIdForRef(activeMap)");
    const crossedBad = g.run("tryEdgeTransition('north')");
    assert.equal(crossedBad, false, 'incompatible declared mode: crossing fails closed');
    assert.equal(g.run("mapIdForRef(activeMap)"), beforeMap, '... and activeMap is untouched (atomic)');
    assert.equal(g.run('inSunkenGallery') === true && g.run('inDungeon') === false, true, '... source mode intact, no inDungeon leak');
    g.run('MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode=window.__savedMode2;'); // restore
    // Validation rejects a bad locationMode value (fail-closed metadata authority).
    g.run('window.__vm=MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode; MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode="notAFlag";');
    const badVal = J('JSON.stringify(validateGameData())');
    assert.ok(badVal.errors > 0 && badVal.errorList.some(e => /locationMode "notAFlag"/.test(e.message)), 'validation flags an unknown locationMode');
    g.run('MAP_CATALOG.SUNKEN_GALLERY_R3C0.locationMode=window.__vm;'); // restore
    // (8) Non-Gallery DISCRETE (point) transitions are unaffected — they own their
    //     state explicitly and keep their established behaviour.
    g.run('resetLocationState();descendToDungeon1();');
    assert.equal(g.run('inDungeon') === true && g.run('dungeonFloor') === 1 && g.run('inSunkenGallery') === false, true, 'dungeon point-transition state intact');
    g.run('resetLocationState();placeAtLocation("MAP5",7.5*TILE,9.5*TILE);enterLighthouse();');
    assert.equal(g.run('inLighthouse') === true && g.run('inSunkenGallery') === false, true, 'lighthouse point-transition state intact');

    // ══ F. No regression to grids/fingerprints; validation clean ══
    const crypto = require('crypto');
    const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
    for (const [id, fp] of Object.entries(GRID_FP.fingerprints)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG[${JSON.stringify(id)}].map)`)), fp, `${id} grid unchanged`);
    }
    const validation = J('JSON.stringify(validateGameData())');
    assert.equal(validation.errors, 0, 'validation clean');
  },
};
