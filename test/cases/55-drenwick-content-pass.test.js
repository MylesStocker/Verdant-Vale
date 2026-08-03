'use strict';
// Covers: the bounded Drenwick content-correction pass. One focused file for
// the eight contracts that pass introduced, since none of them had a natural
// home in an existing test:
//
//   1. Holt's early (pre-reservoir) office dialogue mentions BOTH field
//      investigators being away, without pre-revealing their disappearance --
//      and the later reservoir_quest_started-gated Garrick/Dreyfuss material
//      is untouched and only appears once the assignment has begun.
//   2. Sera resolves to the formerly-vacant apartment (house:drenwick_apt_b2_u3)
//      at valid, non-overlapping coordinates, is no longer in the civic square,
//      and her Dayoff line no longer claims she is "just out" while indoors.
//   3. Ossel's dialogue no longer contains the rareborn-captain reference or
//      the watered-down-drink joke.
//   4. The Drenwick inn charges DRENWICK_INN_PRICE (30g) consistently across the
//      spoken price, the choice label, the affordability check and the deduction;
//      Calwick's inn still charges 20g.
//   5. The Ancient Textbook is reachable at the ground-floor bookshelf and no
//      longer consumes the interaction at the student's desk (that student's
//      own dialogue now reaches).
//   6. The civic-square fountain line is replaced by the canal-lock line and no
//      Drenwick student dialogue still claims a civic fountain.
//   7. Exactly one Harbormaster Renn is active on a workday (interior) and on a
//      Dayoff (exterior) -- never both, never neither.
//   8. The provision store reads as paid commerce: the "Order Ledger" (renamed
//      from "Allocation Manifest") and Oda's lines describe purchase/account/
//      billing, not a free civic allocation for existing in the district.

const assert = require('assert/strict');
const { createContext } = require('../harness');

const flat = (g, id) =>
  g.run(`SIMPLE_NPCS.find(n => n.id === '${id}').dialogue.flat().join(' ')`);

module.exports = {
  name: 'Drenwick content pass: absent investigators, Sera, Ossel, inn price, textbook, fountain, Renn, provision store',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. Holt: both field investigators away early; Garrick/Dreyfuss later ──
    g.run('day = 11; reservoir_quest_started = false; window.gallery_body_found = false;');
    const holtEarly = flat(g, 'drenwick_clerk');
    assert.ok(/both.*field investigators/i.test(holtEarly),
      'Holt should mention both field investigators being away before the reservoir assignment');
    assert.ok(!holtEarly.includes('Garrick') && !holtEarly.includes('Dreyfuss'),
      'the early ambient line must not pre-reveal Garrick/Dreyfuss');
    g.run('reservoir_quest_started = true;');
    const holtLater = flat(g, 'drenwick_clerk');
    assert.ok(holtLater.includes('Garrick') && holtLater.includes('Dreyfuss'),
      'the later reservoir-gated Garrick/Dreyfuss material must remain intact');
    assert.ok(!/both our field investigators are out/i.test(holtLater),
      'the early ambient line is gated to !reservoir_quest_started and should be gone once the quest starts');
    g.run('reservoir_quest_started = false;');

    // ── 2. Sera relocated to the vacant apartment, valid non-overlapping spot ─
    const sera = g.run(`(function(){
      const n = SIMPLE_NPCS.find(x => x.id === 'drenwick_market_2');
      return JSON.stringify({ map: n.map, x: n.x, y: n.y });
    })()`);
    const s = JSON.parse(sera);
    assert.equal(s.map, 'house:drenwick_apt_b2_u3', 'Sera lives in the formerly-vacant B2/U3 apartment');
    assert.equal(s.x, g.run('7.5 * TILE'), 'Sera x is the walkable centre tile');
    assert.equal(s.y, g.run('6.5 * TILE'), 'Sera y is the walkable centre tile');
    // No one is left standing as drenwick_market_2 in the civic square, and no
    // other NPC shares her apartment or her tile.
    assert.equal(
      g.run(`SIMPLE_NPCS.filter(n => n.id === 'drenwick_market_2' && n.map === 'drenwick_civic').length`), 0,
      'Sera must not still be placed on the civic-square map');
    const b2u3 = JSON.parse(g.run(`JSON.stringify(
      SIMPLE_NPCS.filter(n => { try { return n.map === 'house:drenwick_apt_b2_u3'; } catch(e){ return false; } })
        .map(n => n.id + '@' + n.x + ',' + n.y))`));
    assert.equal(b2u3.length, 1, 'exactly one NPC (Sera) occupies b2_u3: ' + b2u3.join(' | '));
    // Her tile overlaps neither the b2_u3 furniture nor the entry/exit tiles.
    const forbidden = new Set([
      g.run('5.5 * TILE') + ',' + g.run('5.5 * TILE'), // bed
      g.run('9.5 * TILE') + ',' + g.run('8.5 * TILE'), // stove
      g.run('7.5 * TILE') + ',' + g.run('8.5 * TILE'), // player landing
      g.run('7.5 * TILE') + ',' + g.run('9.5 * TILE'), // exit tile
    ]);
    assert.ok(!forbidden.has(s.x + ',' + s.y), 'Sera must not overlap furniture, landing, or exit');
    // Dayoff line: indoors and still waiting, never "just out".
    g.run('day = 10;');
    const seraDayoff = flat(g, 'drenwick_market_2');
    assert.ok(!/just out/i.test(seraDayoff), 'Sera\'s Dayoff line must not claim she is "just out" while indoors');
    assert.ok(/midday/i.test(seraDayoff), 'Sera still reads as waiting for someone due before midday');
    g.run('day = 11;');

    // ── 3. Ossel: rareborn captain + watered-down joke gone ──────────────────
    const ossel = flat(g, 'retired_dockworker');
    assert.ok(!/rareborn/i.test(ossel), 'Ossel must no longer reference a rareborn captain');
    assert.ok(!/water(ed)? it down|watered down/i.test(ossel), 'Ossel must no longer make the watered-down-drink joke');

    // ── 4. Inn pricing: Drenwick = DRENWICK_INN_PRICE (30g), Calwick = 20g ────
    assert.equal(g.run('DRENWICK_INN_PRICE'), 30, 'the authoritative Drenwick inn price constant is 30');

    function openDrenwickInn(g, gold) {
      g.run(`
        inDungeon = false; inSluice = false; inTown = true;
        currentTownId = 'drenwick'; townBuilding = 'inn';
        activeMap = DRENWICK_INN_MAP;
        dialogue.open = false; choice.open = false;
        player.x = DRENWICK_INNKEEPER.x; player.y = DRENWICK_INNKEEPER.y;
        stats.gold = ${gold}; stats.hp = 5; stats.maxHp = 20;
        statusEffects = ['poison'];
        day = 11;
      `);
      g.press('Enter'); // innkeeper greeting
    }

    // 30g: spoken price and label both show 30, rest succeeds, deducts exactly 30.
    openDrenwickInn(g, 30);
    assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('30 gold'), 'spoken price shows 30 gold');
    g.run('dialogue.callbacks[0]();'); // open the Rest/Leave choice
    assert.equal(g.run('choice.options[0]'), 'Rest  (30g)', 'choice label shows 30g');
    g.run('choice.open = false; choice.callbacks[0]();'); // Rest
    assert.equal(g.run('stats.gold'), 0, '30g rest deducts exactly 30');
    assert.equal(g.run('stats.hp'), 20, 'rest restores HP to max');
    assert.equal(g.run('day'), 12, 'rest advances the day by one');
    assert.equal(g.run("hasStatusEffect('poison')"), false, 'rest clears status effects');

    // 29g: cannot afford, rest deducts nothing and changes nothing.
    openDrenwickInn(g, 29);
    g.run('dialogue.callbacks[0]();');
    g.run('choice.open = false; choice.callbacks[0]();'); // Rest attempt
    assert.equal(g.run('stats.gold'), 29, '29g is refused and deducts nothing');
    assert.equal(g.run('stats.hp'), 5, 'a refused rest leaves HP unchanged');
    assert.equal(g.run('day'), 11, 'a refused rest does not advance the day');
    assert.equal(g.run("hasStatusEffect('poison')"), true, 'a refused rest leaves status effects in place');

    // Calwick still 20g.
    g.run(`
      inTown = true; currentTownId = 'calwick'; townBuilding = 'inn';
      activeMap = INN_MAP; dialogue.open = false; choice.open = false;
      player.x = INNKEEPER.x; player.y = INNKEEPER.y;
      stats.gold = 20; stats.hp = 5; stats.maxHp = 20; statusEffects = [];
      day = 11;
    `);
    g.press('Enter');
    g.run('dialogue.callbacks[0]();');
    assert.equal(g.run('choice.options[0]'), 'Rest  (20g)', 'Calwick inn still labels 20g');
    g.run('choice.open = false; choice.callbacks[0]();');
    assert.equal(g.run('stats.gold'), 0, 'Calwick rest deducts 20, unchanged from before');
    g.run('dialogue.open = false; choice.open = false;');

    // ── 5. Ancient Textbook at the bookshelf; student desk no longer shadowed ─
    g.run(`
      inTown = true; currentTownId = 'drenwick'; townBuilding = 'school';
      inDungeon = false; inSluice = false;
      activeMap = DRENWICK_SCHOOL_GROUND_MAP;
      dialogue.open = false; choice.open = false; day = 11;
      player.x = 2.5 * TILE; player.y = 4.5 * TILE; player.facing = 'left';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Ancient Textbook', 'the bookshelf yields the Ancient Textbook');
    assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('BLUE JAY'),
      'the Ancient Textbook prose is intact at the bookshelf');
    // At the old desk tile (col 5 row 6) the student\'s own dialogue now reaches.
    g.run(`
      dialogue.open = false; choice.open = false;
      player.x = 5.5 * TILE; player.y = 6.5 * TILE; player.facing = 'up';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Student', 'the former textbook desk now reaches the student');
    assert.ok(g.run('dialogue.pages.flat().join(" ")').includes('lost my lunch'),
      'the student at the old desk speaks their own line, not the textbook');
    g.run('dialogue.open = false; choice.open = false;');

    // ── 6. Fountain line replaced by the canal-lock line ─────────────────────
    const gs1 = flat(g, 'drenwick_gs_1');
    assert.ok(gs1.includes('canal lock'), 'the student now asks about a canal lock');
    assert.ok(!/fountain/i.test(gs1), 'the student no longer claims a civic-square fountain');
    // No Drenwick student dialogue still claims a civic fountain.
    const anyFountain = g.run(`SIMPLE_NPCS
      .filter(n => { try { return typeof n.map === 'string' && n.map.startsWith('drenwick'); } catch(e){ return false; } })
      .some(n => { try { return JSON.stringify(n.dialogue).toLowerCase().includes('fountain'); } catch(e){ return false; } })`);
    assert.equal(anyFountain, false, 'no Drenwick NPC dialogue references a fountain');

    // ── 7. Exactly one Harbormaster Renn active on a workday and on a Dayoff ──
    const workdayRenn = JSON.parse(g.run(`JSON.stringify((function(){
      day = 11;
      return SIMPLE_NPCS.filter(n => n.name === 'Harbormaster Renn' && n.map !== null).map(n => n.id);
    })())`));
    assert.deepEqual(workdayRenn, ['harbormaster_interior'],
      'on a workday exactly the interior Renn is active: ' + JSON.stringify(workdayRenn));
    const dayoffRenn = JSON.parse(g.run(`JSON.stringify((function(){
      day = 10;
      return SIMPLE_NPCS.filter(n => n.name === 'Harbormaster Renn' && n.map !== null).map(n => n.id);
    })())`));
    assert.deepEqual(dayoffRenn, ['harbormaster'],
      'on a Dayoff exactly the exterior Renn is active: ' + JSON.stringify(dayoffRenn));
    g.run('day = 11;');

    // ── 8. Provision store reads as paid commerce ────────────────────────────
    const oda = flat(g, 'provision_clerk');
    assert.ok(!/allocation|draw against/i.test(oda),
      'Oda must not use allocation/draw-against entitlement language');
    assert.ok(/cash at the counter|priced on the board/i.test(oda),
      'Oda describes goods as purchased for cash');
    assert.ok(/not a claim on free goods/i.test(oda),
      'Oda makes clear the registry card is not a free entitlement');
    assert.ok(/on account/i.test(oda),
      'Oda offers registered households an account/order option');
    // The renamed Order Ledger prop.
    g.run(`
      inTown = true; currentTownId = 'drenwick'; townBuilding = 'provision_store';
      inDungeon = false; inSluice = false;
      activeMap = DRENWICK_PROVISION_STORE_MAP;
      dialogue.open = false; choice.open = false; day = 11;
      player.x = 11.5 * TILE; player.y = 5.5 * TILE; player.facing = 'right';
    `);
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Order Ledger', 'the manifest prop is now the Order Ledger');
    const ledger = g.run('dialogue.pages.flat().join(" ")');
    assert.ok(ledger.includes('ORDER LEDGER'), 'the ledger header reads ORDER LEDGER');
    assert.ok(!/allocat/i.test(ledger), 'the ledger no longer uses allocation language');
    g.run('dialogue.open = false; choice.open = false;');

    g.renderFrame();
  },
};
