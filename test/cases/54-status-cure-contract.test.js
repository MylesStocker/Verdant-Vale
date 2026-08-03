'use strict';
// Covers: the shared status-cure contract (combat.js) — status-restoring items
// never advertise which status they cure, and when used they cure an active
// matching status (with the existing confirmation) or report "…nothing happens"
// while still consuming the item and the combat turn.
//
//   • itemStatLabel()/itemStatParen() return blank for Reed Remedy and Amethyst
//     Dust (no cured-status leak, no empty "()"); ordinary heal/equipment labels
//     are unchanged.
//   • applyStatusCure() (the one authoritative path) removes only active matching
//     statuses; a future/temporary curesX property routes through it automatically
//     with no new combat branch.
//   • In combat, a no-effect use still spends the turn and the enemy responds.
//   • validateGameData() flags a curesX property not registered in the contract.

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Drive a real combat item-use of the first inventory item, following the proven
// pattern of test 12 (flashTimer must run out before input.js accepts combat
// keys). `setup` is g.run code that seeds stats.items + statusEffects.
function useFirstItemInCombat(g, setup) {
  g.run('startCombat()');
  g.run(`
    ${setup}
    stats.hp = 100; stats.maxHp = 100; stats.def = 100; stats.armor = null; stats.shield = null;
    combat.enemy = { name: 'Test Dummy', hp: 999, maxHp: 999, atk: 1, def: 100, spd: 0 };
    combat.phase = 'choose'; combat.cursor = 1; // combatOptions()[1] === 'item'
  `);
  g.frames(10);          // let flashTimer expire
  g.press('Enter');      // open the item subscreen
  g.press('Enter');      // use item at itemCursor 0
}

module.exports = {
  name: 'status-cure contract: no cured-status label, cure-or-nothing-happens, turn spent, shared path',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue
    const G = (code) => g.run(code);

    // ── 1-3, 10. Displays never reveal the cured status; others unchanged ────
    assert.equal(G("itemStatLabel(ITEM_REGISTRY['Reed Remedy'])"), '', 'Reed Remedy has a blank stat label');
    assert.equal(G("itemStatLabel(ITEM_REGISTRY['Amethyst Dust'])"), '', 'Amethyst Dust has a blank stat label');
    // No empty parens / doubled artefacts from either.
    assert.equal(G("itemStatParen(ITEM_REGISTRY['Reed Remedy'])"), '', 'Reed Remedy renders no "()"');
    assert.equal(G("itemStatParen(ITEM_REGISTRY['Amethyst Dust'])"), '', 'Amethyst Dust renders no "()"');
    // No status-cure label mentions the status anywhere.
    assert.equal(G("['poison','cursed','curse','Cures'].some(function(w){return itemStatLabel(ITEM_REGISTRY['Reed Remedy']).indexOf(w)!==-1 || itemStatLabel(ITEM_REGISTRY['Amethyst Dust']).indexOf(w)!==-1;})"), false, 'no cured-status word leaks into the labels');
    // Ordinary labels are untouched.
    assert.equal(G("itemStatLabel(ITEM_REGISTRY['Potion'])"), 'HP  +20', 'ordinary potion still shows its heal');
    assert.equal(G("itemStatLabel(ITEM_REGISTRY['Iron Sword'])"), 'ATK +4', 'weapon label unchanged');
    assert.equal(G("itemStatParen(ITEM_REGISTRY['Potion'])"), '(HP  +20)', 'ordinary potion still parenthesised');

    // ── Contract shape ──────────────────────────────────────────────────────
    assert.equal(G("isStatusCureItem(ITEM_REGISTRY['Reed Remedy'])"), true, 'Reed Remedy is a status-cure item');
    assert.equal(G("isStatusCureItem(ITEM_REGISTRY['Amethyst Dust'])"), true, 'Amethyst Dust is a status-cure item');
    assert.equal(G("isStatusCureItem(ITEM_REGISTRY['Potion'])"), false, 'a plain potion is not a status-cure item');
    assert.deepEqual(JSON.parse(G("JSON.stringify(itemCuredStatuses(ITEM_REGISTRY['Reed Remedy']))")), ['poison'], 'Reed Remedy cures poison');
    assert.deepEqual(JSON.parse(G("JSON.stringify(itemCuredStatuses(ITEM_REGISTRY['Amethyst Dust']))")), ['cursed'], 'Amethyst Dust cures cursed');

    // ── 4. Reed Remedy WITH poison: cured + existing success message ────────
    useFirstItemInCombat(g, "stats.items=[createItem('Reed Remedy')]; statusEffects=['poison'];");
    assert.equal(G('combat.phase'), 'message', 'using the cure enters the message phase');
    assert.match(G('combat.message'), /poison cured!/, 'poison-cure confirmation shown');
    assert.equal(G("hasStatusEffect('poison')"), false, 'poison removed');
    assert.equal(G('stats.items.length'), 0, 'Reed Remedy consumed');
    assert.equal(G('combat.enemy.hp'), 999, 'the cure does not damage the enemy');

    // ── 5 + 8. Reed Remedy WITHOUT poison: nothing happens, still consumed,
    //          turn spent, enemy acts ──────────────────────────────────────
    useFirstItemInCombat(g, "stats.items=[createItem('Reed Remedy')]; statusEffects=[];");
    assert.equal(G('combat.message'), 'Used Reed Remedy — nothing happens.', 'exact no-effect message');
    assert.equal(G("hasStatusEffect('poison')"), false, 'poison NOT added by a failed cure');
    assert.equal(G('stats.items.length'), 0, 'Reed Remedy still consumed');
    assert.equal(G('stats.hp'), 100, 'no HP healed');
    const hpBeforeEnemy = G('stats.hp');
    g.press('Enter'); // advance to the deferred enemy response
    assert.match(G('combat.message'), /attacks for \d+!/, 'the enemy still acts after a no-effect item');
    assert.ok(G('stats.hp') < hpBeforeEnemy, 'the enemy dealt damage — the turn was spent');

    // ── 6. Amethyst Dust WITH cursed: cured + existing success message ──────
    useFirstItemInCombat(g, "stats.items=[createItem('Amethyst Dust')]; statusEffects=['cursed'];");
    assert.match(G('combat.message'), /the curse lifts!/, 'curse-lifting confirmation shown');
    assert.equal(G("hasStatusEffect('cursed')"), false, 'cursed removed');
    assert.equal(G('stats.items.length'), 0, 'Amethyst Dust consumed');

    // ── 7. Amethyst Dust WITHOUT cursed: nothing happens, still consumed ────
    useFirstItemInCombat(g, "stats.items=[createItem('Amethyst Dust')]; statusEffects=[];");
    assert.equal(G('combat.message'), 'Used Amethyst Dust — nothing happens.', 'exact no-effect message');
    assert.equal(G("hasStatusEffect('cursed')"), false, 'cursed NOT added');
    assert.equal(G('stats.items.length'), 0, 'Amethyst Dust still consumed');

    // ── 9. A cure removes ONLY its matching status, not unrelated ones ──────
    useFirstItemInCombat(g, "stats.items=[createItem('Reed Remedy')]; statusEffects=['poison','muddied'];");
    assert.equal(G("hasStatusEffect('poison')"), false, 'poison cured');
    assert.equal(G("hasStatusEffect('muddied')"), true, 'unrelated muddied status is preserved');

    // ── 11. A future/temporary status-cure routes through the SAME path ─────
    // Register a new cure property with no new combat branch; a fixture item with
    // it must get the identical no-status behavior automatically.
    G("window.__save = window.STATUS_CURE_PROPERTIES.curesConfusion; window.STATUS_CURE_PROPERTIES.curesConfusion = { status: 'confusion', success: function(n){ return 'Used ' + n + ' — head clears!'; } };");
    try {
      // absent → nothing happens (through the shared path, no bespoke branch)
      const absent = JSON.parse(G("JSON.stringify(applyStatusCure({ name: 'Clarity Draught', curesConfusion: true }))"));
      assert.deepEqual(absent, { cured: false, message: 'Used Clarity Draught — nothing happens.' }, 'future cure item, status absent → nothing happens via shared path');
      // and it shows no label
      assert.equal(G("itemStatLabel({ name:'Clarity Draught', type:'potion', heals:0, curesConfusion:true })"), '', 'future cure item also has a blank label');
      // present → cured + its message
      G("statusEffects=['confusion'];");
      const present = JSON.parse(G("JSON.stringify(applyStatusCure({ name: 'Clarity Draught', curesConfusion: true }))"));
      assert.deepEqual(present, { cured: true, message: 'Used Clarity Draught — head clears!' }, 'future cure item, status present → success via shared path');
      assert.equal(G("hasStatusEffect('confusion')"), false, 'confusion removed');
    } finally {
      G("window.STATUS_CURE_PROPERTIES.curesConfusion = window.__save; if (window.__save === undefined) delete window.STATUS_CURE_PROPERTIES.curesConfusion; delete window.__save; statusEffects=[];");
    }

    // ── 12. An unregistered curesX property is caught by validation ─────────
    G("window.__fake = ITEM_REGISTRY['__contract_probe']; ITEM_REGISTRY['__contract_probe'] = { name: '__contract_probe', type: 'potion', heals: 0, curesBewilderment: true, price: 1 };");
    try {
      const errs = JSON.parse(G("(function(){ var v = validateGameData(); return JSON.stringify(v.errorList.filter(function(e){ return /curesBewilderment/.test(e.message); }).map(function(e){return e.message;})); })()"));
      assert.equal(errs.length, 1, 'an unregistered curesX property is a validation error');
      assert.match(errs[0], /not registered in STATUS_CURE_PROPERTIES/, 'the error names the contract');
    } finally {
      G("delete ITEM_REGISTRY['__contract_probe']; delete window.__fake;");
    }
    assert.equal(G('validateGameData().errors'), 0, 'validation is clean again once the probe is removed');

    g.renderFrame();
  },
};
