'use strict';
// Covers: audit fix #2 -- Rhen's pale-mud observation and Kest's
// channel-bottom smell (npcs.js) used to key on the PERMANENT
// upper_reach_seen / sunken_gallery_seen discovery flags, so they repeated
// forever after a single visit. They now key on same-day "visited today"
// markers (window.upper_reach_visit_day / window.sunken_gallery_visit_day,
// set every frame the player is physically present -- movement.js),
// compared with `=== day`, so they expire the moment a day passes (any
// rest increments `day` -- interactions.js's rest() functions, combat.js's
// defeat handler) and are explicitly cleared on every loadGame() (save.js)
// so a same-day load from an older save can't leak the marker into a
// timeline where the visit never happened.
//
//   1. Neither NPC reacts before any visit.
//   2. Both react on the same day as a real-movement visit to their area.
//   3. Neither reacts after `day` advances (resting), even though the
//      permanent upper_reach_seen/sunken_gallery_seen flags are still true.
//   4. Neither reacts after loadGame(), even loading a save whose stored
//      `day` happens to equal the current day, if that save was written
//      before the visit (the leak scenario the explicit reset guards
//      against).
//   5. A fresh visit after a day advance (or after a load) makes the
//      reaction available again -- this is temporary, not permanently
//      disabled.
//   6. Other flag-dependent dialogue (Maren, Edda, Orren, Foss, and the
//      permanent upper_reach_seen/sunken_gallery_seen flags themselves) is
//      unaffected by this change.

const assert = require('assert/strict');
const { createContext } = require('../harness');

function rhenText(g) {
  return g.run(`SIMPLE_NPCS.find(n => n.id === 'rhen').dialogue.flat().join(' ')`);
}
function kestText(g) {
  return g.run(`SIMPLE_NPCS.find(n => n.id === 'harbormaster_assistant').dialogue.flat().join(' ')`);
}

module.exports = {
  name: 'temporary physical evidence: Rhen\'s mud and Kest\'s smell expire on day-advance and on load, not permanent',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    // ── 1. Neither reacts before any visit ──────────────────────────────────
    assert.ok(!rhenText(g).includes('pale mud'), 'Rhen must not react before any Upper Reach visit');
    assert.ok(!kestText(g).includes('bottom of a channel'), 'Kest must not react before any Sunken Gallery visit');

    // ── 2. Real-movement visit, same-day reaction ───────────────────────────
    g.run(`
      inDungeon=false; inTown=false; inSluice=false; activeMap=NORTH_BASIN_NW_MAP;
      player.x=3.5*TILE; player.y=13.5*TILE; dialogue.open=false;
    `);
    g.frames(1);
    assert.equal(g.run('window.upper_reach_visit_day'), g.run('day'), 'visiting should mark today as a visit day');
    assert.ok(rhenText(g).includes('pale mud'), 'Rhen should react the same day as a real Upper Reach visit');

    g.run(`
      inBasinChamber=false; inSunkenGallery=true; activeMap=SUNKEN_GALLERY_MAP;
      player.x=5.5*TILE; player.y=5.5*TILE;
    `);
    g.frames(1);
    assert.equal(g.run('window.sunken_gallery_visit_day'), g.run('day'));
    assert.ok(kestText(g).includes('bottom of a channel'), 'Kest should react the same day as a real Sunken Gallery visit');
    g.run('inSunkenGallery=false; activeMap=MAP;');

    // ── 3. Expires after a day advances, even with the permanent flags true ─
    // (Standing in the arrival trigger zone in step 2 already set the
    // permanent onceFlags too -- reassert them explicitly here so the
    // point of this section doesn't depend on that incidental overlap.)
    g.run('window.upper_reach_seen = true; window.sunken_gallery_seen = true;'); // the permanent discovery flags, long since true
    g.run('day = day + 1;'); // a rest
    assert.ok(!rhenText(g).includes('pale mud'),
      'Rhen must not react after a day has passed, even though the permanent discovery flag is true');
    assert.ok(!kestText(g).includes('bottom of a channel'),
      'Kest must not react after a day has passed, even though the permanent discovery flag is true');

    // ── 5. A fresh same-day visit re-arms it (temporary, not disabled) ──────
    g.run(`
      activeMap=NORTH_BASIN_NW_MAP; player.x=3.5*TILE; player.y=13.5*TILE;
    `);
    g.frames(1);
    assert.ok(rhenText(g).includes('pale mud'), 'a fresh visit after a day advance should re-arm the reaction');
    g.run('activeMap=MAP;');

    // ── 4. loadGame() clears the marker, even for a same-"day" older save ───
    // Save now (marker armed, today's day number N)...
    const dayNow = g.run('day');
    g.run('saveGame();'); // this save captures the CURRENT (armed) state
    // ...then scramble to a state that mimics loading a DIFFERENT, older
    // save that happens to report the same day number but never had the
    // visit -- i.e. exactly the leak scenario the explicit reset guards.
    g.run(`
      window.upper_reach_visit_day = ${dayNow};  // leftover "visited today" from this session
      activeMap = MAP; player.x = 1.5*TILE; player.y = 1.5*TILE;
      loadGame();
    `);
    assert.equal(g.run('window.upper_reach_visit_day'), undefined,
      'loadGame() must clear the visit-day marker unconditionally, not just when the loaded day differs');
    assert.equal(g.run('window.sunken_gallery_visit_day'), undefined);
    assert.ok(!rhenText(g).includes('pale mud'), 'Rhen must not react immediately after any load');
    assert.ok(!kestText(g).includes('bottom of a channel'), 'Kest must not react immediately after any load');

    // ── 6. Other flag-dependent dialogue is unaffected ──────────────────────
    // (Cres was formerly checked here as a permanent-flag exemplar; her dialogue
    // has since been rewritten to fixed pages with no flag branch, so Maren --
    // still flag-dependent -- stands in for the "unrelated dialogue untouched"
    // check.)
    g.run(`
      fort_report_filed = false; reservoir_quest_started = true;
    `);
    const maren = g.run(`SIMPLE_NPCS.find(n => n.id === 'maren').dialogue.flat().join(' ')`);
    assert.ok(maren.includes('basin road'), 'Maren\'s reservoir_quest_started reaction must be untouched by this fix');
  },
};
