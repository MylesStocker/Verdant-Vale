'use strict';
// Covers: the starting-kit requisition flow. The player no longer starts
// with equipment in stats.items -- the Supervisor issues a requisition
// ticket alongside the first assignment (the sluice job), Aldric exchanges
// it for the Iron Sword + Leather Armor on next visit, and reverts to his
// normal dialogue on every visit after that.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'starting kit: Supervisor issues a requisition ticket, Aldric exchanges it once',
  run() {
    const g = createContext();
    // Compare via JSON, not assert.deepEqual: arrays pulled out of the vm
    // context have a different Array prototype than host-literal arrays.
    assert.equal(g.run('stats.items.length'), 0, 'player should start with an empty inventory now');

    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // Talk to the Supervisor for the first time.
    g.run(`
      inTown = true; currentTownId = 'calwick'; townBuilding = 'office';
      player.x = 12 * TILE; player.y = 2.5 * TILE;
    `);
    g.press('Enter'); // opens (page 0 of 4)
    assert.equal(g.run('dialogue.name'), 'Supervisor');
    // 4 pages: the once-per-day "good morning" greeting (this IS the first
    // conversation of the day) + the 3 assignment pages (sluice job +
    // requisition slip).
    assert.equal(g.run('dialogue.pages.length'), 4, 'first conversation: greeting + 3 assignment pages');
    assert.ok(JSON.stringify(g.run('dialogue.pages[0]')).includes('Good morning'), 'first page of the day is the greeting');
    g.press('Enter');
    g.press('Enter');
    g.press('Enter');
    g.press('Enter'); // advance through all 4 pages -> closes, runs callback

    assert.equal(g.run('sluice_job_started'), true);
    assert.equal(g.run('equipment_ticket_ready'), true, 'Supervisor should issue the requisition ticket alongside the job');

    // Talk to Aldric with the ticket.
    g.run('player.x = 3.5 * TILE; player.y = 3.5 * TILE;');
    g.press('Enter'); // opens (page 0)
    assert.equal(g.run('dialogue.name'), 'Aldric');
    const pages = g.run('dialogue.pages.length');
    for (let i = 0; i < pages; i++) g.press('Enter'); // advance through all pages -> closes, runs callback

    const items = g.run('stats.items');
    assert.equal(items.length, 2, 'should have received exactly the starting kit');
    assert.ok(items.some(it => it.name === 'Iron Sword' && it.type === 'weapon' && it.bonus === 4));
    assert.ok(items.some(it => it.name === 'Leather Armor' && it.type === 'armor' && it.bonus === 3));
    assert.equal(g.run('equipment_ticket_ready'), false, 'ticket should be consumed');

    // Visit Aldric again -- should now be his ordinary dialogue, not the
    // requisition exchange repeating.
    g.press('Enter');
    assert.equal(g.run('dialogue.name'), 'Aldric');
    const secondVisitText = JSON.stringify(g.run('dialogue.pages'));
    assert.ok(
      !secondVisitText.includes('Requisition'),
      `second visit to Aldric should show his normal dialogue, not the requisition exchange again; got: ${secondVisitText}`
    );

    // Items are equippable exactly like before -- confirm the equip flow
    // still works with the newly-issued kit (menu equip, same as any item).
    g.press('Enter'); // close Aldric's normal dialogue
    g.run('equipItem(stats.items.find(it => it.name === "Iron Sword"));');
    assert.equal(g.run('stats.weapon.name'), 'Iron Sword');

    g.renderFrame();
  },
};
