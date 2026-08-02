'use strict';
// East Sluice Sealed Room (SLUICE_SECRET_MAP): two consecutive FALSE_WALLs at
// Deep Works r7 c12-c13 (the east pocket's dead end — no visual or interactive
// hint, and the entrance tile itself renders as plain wall) lead to a separate
// hidden map holding carved markings, eleven notches, an old blood stain, and
// a works clerk's journal — all MAP_FEATURES inspects anchored to their own
// visible tiles. Encounters on the secret map roll at
// SLUICE_SECRET_ENCOUNTER_CHANCE (1/64) and draw exclusively from
// SLUICE_SECRET_ENEMY_TEMPLATES (the Tallyman). Deep Works itself keeps its
// original look and its normal SLUICE_ENEMY_TEMPLATES encounters everywhere.
// Also asserts the East Sluice difficulty curve: the top floor (sluiceFloor 1)
// draws the gentle SLUICE_TOP_ENEMY_TEMPLATES (Marsh Wisp + the easy Sluice
// Slime, overworld-tier) while floors 2-3 use the tougher SLUICE_ENEMY_TEMPLATES.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Opens whatever the interact press hits at the player's current position,
// pages all the way through, and returns the pages as one lowercase string.
function inspectHere(g) {
  g.press('Enter');
  assert.equal(g.run('dialogue.open'), true, 'an inspect dialogue should open');
  const text = JSON.stringify(g.run('dialogue.pages')).toLowerCase();
  const pageCount = g.run('dialogue.pages.length');
  for (let i = 0; i < pageCount; i++) g.press('Enter');
  assert.equal(g.run('dialogue.open'), false);
  return text;
}

module.exports = {
  name: 'sluice sealed room: unmarked false-wall passage to a separate map with its own deadly rare pool',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue
    g.run(`
      inTown = false;
      inSluice = true;
      sluiceFloor = 3;
      activeMap = SLUICE_LEVEL3_MAP;
    `);

    // ── Deep Works: passage present, floor otherwise back to its old look ──
    assert.equal(g.run('SLUICE_LEVEL3_MAP[7][12]'), g.run('FALSE_WALL'), 'passage tile 1 is a FALSE_WALL');
    assert.equal(g.run('SLUICE_LEVEL3_MAP[7][13]'), g.run('FALSE_WALL'), 'passage tile 2 is a FALSE_WALL');
    assert.equal(g.run('SLUICE_LEVEL3_MAP[7][14]'), g.run('SLUICE_SECRET_ENTRANCE'), 'entrance tile past the false walls');
    assert.equal(g.run('WALKABLE[SLUICE_SECRET_ENTRANCE]'), true);
    // The room tiles must NOT appear anywhere on Deep Works any more, and the
    // rows the old in-map alcove occupied are solid wall again.
    const l3Special = g.run(`
      SLUICE_LEVEL3_MAP.flat().filter(t =>
        [SLUICE_MARK_WALL, SLUICE_NOTCH_WALL, SLUICE_BLOOD_FLOOR, SLUICE_JOURNAL_FLOOR].includes(t)).length
    `);
    assert.equal(l3Special, 0, 'Deep Works carries none of the sealed-room tiles');
    for (let r = 12; r <= 14; r++) {
      assert.equal(g.run(`SLUICE_LEVEL3_MAP[${r}].every(t => t === SLUICE_WALL)`), true, `Deep Works row ${r} is solid wall again`);
    }
    // No MAP_FEATURES on Deep Works at all — nothing hints at the passage.
    assert.equal(g.run('MAP_FEATURES.SLUICE_LEVEL3_MAP === undefined'), true, 'no features (hence no hints) on Deep Works');
    // Deep Works rolls the normal sluice pool wherever the player stands.
    g.run('player.x = 10.5 * TILE; player.y = 7.5 * TILE;'); // east pocket
    assert.equal(g.run('inSluiceSealedRoom()'), false);
    assert.equal(g.run('currentEncounterPool() === SLUICE_ENEMY_TEMPLATES'), true, 'normal sluice pool on Deep Works');

    // ── Difficulty curve: the TOP floor is as gentle as the overworld ───────
    // sluiceFloor 1 draws SLUICE_TOP_ENEMY_TEMPLATES — an overworld-tier pool
    // of sluice-appropriate creatures (Marsh Wisp + Sluice Slime, no Vale-only
    // Briar Hound); descending spikes to the tougher sluice pool. Restores the
    // floor-3 Deep Works state afterwards so the rest of the test is unaffected.
    g.run('sluiceFloor = 1; activeMap = SLUICE_MAP;');
    assert.equal(g.run('currentEncounterPool() === SLUICE_TOP_ENEMY_TEMPLATES'), true, 'top floor draws the gentle top-floor pool');
    assert.equal(g.run('MAP_METADATA.SLUICE_MAP.encounterPool === SLUICE_TOP_ENEMY_TEMPLATES'), true, 'SLUICE_MAP metadata mirrors the runtime top-floor pool');
    const topNames = g.run('JSON.stringify(currentEncounterPool().map(t => t.name).sort())');
    assert.equal(topNames, JSON.stringify(['Marsh Wisp', 'Sluice Slime']), 'top floor is Marsh Wisp + Sluice Slime');
    assert.equal(g.run("currentEncounterPool().some(t => t.name === 'Briar Hound')"), false, 'no Briar Hound in the sluice (it is a Vale creature)');
    // The Sluice Slime is on par with the Marsh Wisp: same easy tier, distinct id.
    const wisp  = JSON.parse(g.run("JSON.stringify(SLUICE_TOP_ENEMY_TEMPLATES.find(t => t.name === 'Marsh Wisp'))"));
    const slime = JSON.parse(g.run("JSON.stringify(SLUICE_TOP_ENEMY_TEMPLATES.find(t => t.name === 'Sluice Slime'))"));
    assert.ok(slime, 'Sluice Slime exists in the top-floor pool');
    assert.equal(slime.id, 'enemy_sluice_slime', 'Sluice Slime has its stable id');
    assert.notEqual(wisp.id, slime.id, 'the two top-floor enemies have distinct ids');
    assert.equal(slime.atk, wisp.atk, 'Sluice Slime hits as softly as the Marsh Wisp');
    assert.ok(Math.abs(slime.hp - wisp.hp) <= 4, 'Sluice Slime HP is within a first-fight margin of the Marsh Wisp');
    assert.ok(slime.hp <= 16, 'Sluice Slime is low-HP (easy tier)');
    assert.equal(g.run("BATTLE_SPRITE_NAMES.has('Sluice Slime')"), true, 'Sluice Slime has a dedicated battle sprite');
    assert.equal(g.run("window.ENEMY_TEMPLATE_REGISTRY['enemy_sluice_slime'] === SLUICE_TOP_ENEMY_TEMPLATES[1]"), true, 'Sluice Slime is in the enemy registry');
    g.run('sluiceFloor = 2; activeMap = SLUICE_LEVEL2_MAP;');
    assert.equal(g.run('currentEncounterPool() === SLUICE_ENEMY_TEMPLATES'), true, 'Lower Works (floor 2) spikes to the tough sluice pool');
    g.run('sluiceFloor = 3; activeMap = SLUICE_LEVEL3_MAP; player.x = 10.5 * TILE; player.y = 7.5 * TILE;'); // restore Deep Works

    // ── Registration: the secret map is a real, first-class map ────────────
    assert.equal(g.run("MAP_REGISTRY.SLUICE_SECRET_MAP.map === SLUICE_SECRET_MAP"), true);
    assert.equal(g.run("MAP_METADATA.SLUICE_SECRET_MAP.encounterPool === SLUICE_SECRET_ENEMY_TEMPLATES"), true);

    // ── Through the passage: enterSluiceSecret() lands on the new map ──────
    g.run('enterSluiceSecret();');
    assert.equal(g.run('activeMap === SLUICE_SECRET_MAP'), true);
    assert.equal(g.run('sluiceFloor'), 4);
    assert.equal(g.run('inSluiceSealedRoom()'), true);
    assert.equal(g.run('SLUICE_SECRET_MAP[2][7]'), g.run('SLUICE_SECRET_EXIT'), 'exit tile at the corridor head');
    assert.equal(g.run('SLUICE_SECRET_MAP[9][7]'), g.run('SLUICE_BLOOD_FLOOR'));
    assert.equal(g.run('SLUICE_SECRET_MAP[10][5]'), g.run('SLUICE_JOURNAL_FLOOR'));
    assert.equal(g.run('SLUICE_SECRET_MAP[9][10]'), g.run('SLUICE_MARK_WALL'));
    assert.equal(g.run('SLUICE_SECRET_MAP[11][7]'), g.run('SLUICE_NOTCH_WALL'));
    assert.equal(g.run('WALKABLE[SLUICE_MARK_WALL]'), false, 'marked wall blocks');
    assert.equal(g.run('WALKABLE[SLUICE_NOTCH_WALL]'), false, 'notched wall blocks');
    for (const t of ['SLUICE_MARK_WALL', 'SLUICE_NOTCH_WALL', 'SLUICE_BLOOD_FLOOR', 'SLUICE_JOURNAL_FLOOR',
                     'SLUICE_SECRET_ENTRANCE', 'SLUICE_SECRET_EXIT']) {
      assert.equal(g.run(`RENDERABLE_TILE_IDS.has(${t})`), true, `${t} renderable`);
      assert.equal(g.run(`TILE_PROPERTIES[${t}] !== undefined`), true, `${t} has tile properties`);
    }

    // ── Encounters: rare and lethal ─────────────────────────────────────────
    assert.equal(g.run('SLUICE_SECRET_ENCOUNTER_CHANCE'), 1 / 64, 'sealed room rolls at 1/64');
    assert.equal(g.run('currentEncounterPool() === SLUICE_SECRET_ENEMY_TEMPLATES'), true, 'sealed-room pool inside');
    assert.equal(g.run('SLUICE_SECRET_ENEMY_TEMPLATES.length'), 1);
    assert.equal(g.run('SLUICE_SECRET_ENEMY_TEMPLATES[0].name'), 'Tallyman');
    assert.ok(g.run('SLUICE_SECRET_ENEMY_TEMPLATES[0].atk') > 50, 'the Tallyman should out-hit everything in the sluice');
    assert.equal(g.run("BATTLE_SPRITE_NAMES.has('Tallyman')"), true, 'Tallyman has a dedicated battle sprite');
    // A rolled encounter here is the Tallyman (Math.random stubbed above the
    // 1/256 "23" override threshold so the roll stays deterministic).
    g.run('const _rand = Math.random; Math.random = () => 0.5; startCombat(); Math.random = _rand;');
    assert.equal(g.run('combat.enemy.name'), 'Tallyman');
    assert.ok(/unfolds/.test(g.run('combat.message')), 'Tallyman gets its own intro line');
    g.run('combat.active = false; combat.enemy = null;');

    // ── The four inspectables ───────────────────────────────────────────────
    // Blood stain (standing on it):
    g.run('player.x = 7.5 * TILE; player.y = 9.5 * TILE;');
    assert.ok(/scrubbed/.test(inspectHere(g)), 'blood stain text');
    // Journal (standing on it):
    g.run('player.x = 5.5 * TILE; player.y = 10.5 * TILE;');
    const journal = inspectHere(g);
    assert.ok(/laid around these/.test(journal), 'journal questions the room predating the sluice');
    assert.ok(/what was this for/.test(journal), 'journal questions the purpose of the place');
    // Carved markings (from the floor tile beside the east wall):
    g.run('player.x = 9.5 * TILE; player.y = 9.5 * TILE;');
    assert.ok(/script/.test(inspectHere(g)), 'markings text');
    // Eleven notches (from the floor tile above the south wall):
    g.run('player.x = 7.5 * TILE; player.y = 10.5 * TILE;');
    const notches = inspectHere(g);
    assert.ok(/eleven, both times/.test(notches), 'notches count to eleven');
    assert.ok(/twelfth/.test(notches), 'and leave room for a twelfth');

    // ── And back out ────────────────────────────────────────────────────────
    g.run('exitSluiceSecret();');
    assert.equal(g.run('activeMap === SLUICE_LEVEL3_MAP'), true, 'exit returns to Deep Works');
    assert.equal(g.run('sluiceFloor'), 3);
    assert.equal(g.run('inSluiceSealedRoom()'), false);
    assert.equal(g.run('currentEncounterPool() === SLUICE_ENEMY_TEMPLATES'), true, 'normal pool again after leaving');
    // Landing spot is real east-pocket floor, not inside the false walls.
    assert.equal(g.run('SLUICE_LEVEL3_MAP[Math.floor(player.y / TILE)][Math.floor(player.x / TILE)]'), g.run('SLUICE_FLOOR'));
  },
};
