'use strict';
// Covers the "accidental dialogue line-break" fix. Root cause: a dialogue page
// is an array of authored strings; the renderer wraps each string independently
// and treats the boundary between strings as a HARD line break. Older dialogue
// sometimes split one continuous sentence into two strings; when the first is
// slightly too wide it wraps again and orphans its final word before the second
// string begins (the confirmed "Oswin / polite" defect).
//
// The fix stores each continuous sentence as ONE string. The wrap + height-safe
// pagination logic was extracted into pure helpers (wrapDialogueLine /
// paginateDialoguePages, render-ui.js) so it is testable with the real
// dialogue-box width and a Courier-New monospace model. (The harness canvas
// stub's measureText is a no-op, so these tests supply the font model directly.)

const assert = require('assert/strict');
const { createContext } = require('../harness');

// Dialogue box: BW 496, PAD 14 -> maxLineW 468px. Font 14px "Courier New"
// (monospace, 0.6em advance = 8.4px/char). 3 visible lines per box.
const MAX_W = 468;
const MAX_VIS_LINES = 3;
const measure = (s) => s.length * 8.4;
const norm = (s) => s.replace(/\s+/g, ' ').trim();

module.exports = {
  name: 'Dialogue wrapping: continuous prose is one string; no orphaned words; intentional breaks preserved',
  run() {
    const g = createContext();
    g.press('Enter');
    g.press('Enter'); // close intro dialogue

    const wrap     = (t) => g.run('wrapDialogueLine')(t, MAX_W, measure);
    const paginate = (pages) => g.run('paginateDialoguePages')(pages, MAX_W, MAX_VIS_LINES, measure);

    // ── 1. Oswin's complete sentence is stored as ONE continuous string ──────
    const oswinPages = g.run("SIMPLE_NPCS.find(function(n){return n.id==='oswin'}).dialogue");
    const oswinPage = oswinPages.find((p) => p.join(' ').includes('perfectly polite'));
    assert.ok(oswinPage, "Oswin should have a page mentioning 'perfectly polite'");
    assert.equal(oswinPage.length, 1, 'Oswin’s sentence must be a single authored string (continuous prose)');
    const oswin = oswinPage[0];
    assert.ok(
      oswin.includes('perfectly polite') && oswin.includes('to just walk'),
      'the two former fragments must now be joined into one sentence'
    );

    // ── 2. Rendered output no longer produces 'polite' as an isolated line ───
    const oswinLines = wrap(oswin);
    assert.ok(oswinLines.length >= 2, 'the long Oswin sentence should wrap across multiple visual lines');
    for (const ln of oswinLines) {
      assert.notEqual(ln.trim(), 'polite', "'polite' must never be an isolated wrapped line");
    }

    // ── 3. Normalizing spaces across the wrapped lines reconstructs the whole
    //       sentence with no lost or duplicated words ─────────────────────────
    assert.equal(norm(oswinLines.join(' ')), norm(oswin), 'wrapped lines must reconstruct the original sentence exactly');
    // Every wrapped line fits within the box width.
    for (const ln of oswinLines) assert.ok(measure(ln) <= MAX_W, 'each wrapped line must fit the dialogue width');

    // ── 4. A representative long paragraph wraps naturally across many lines ─
    const para =
      'The reservoir has been dropping for years, long before anyone thought to ' +
      'call it a drought, and the old waterlines stranded up the bank are the ' +
      'proof of it if you know where to look for them.';
    const paraLines = wrap(para);
    assert.ok(paraLines.length >= 3, 'a long paragraph should wrap into several lines');
    for (const ln of paraLines) assert.ok(measure(ln) <= MAX_W, 'wrapped paragraph lines must fit the width');
    assert.equal(norm(paraLines.join(' ')), norm(para), 'wrapped paragraph must reconstruct exactly');

    // ── 5. Height-safe pagination splits a paragraph that needs more lines
    //       than fit in one box (3 lines) into multiple visual pages ──────────
    const visPages = paginate([[para]]);
    assert.ok(visPages.length >= 2, 'a >3-line paragraph must be paginated into multiple visual pages');
    for (const vp of visPages) assert.ok(vp.length <= MAX_VIS_LINES, 'each visual page must fit within 3 lines');
    // Pagination preserves the full text in order (no loss across page breaks).
    const flat = visPages.reduce((acc, vp) => acc.concat(vp), []);
    assert.equal(norm(flat.join(' ')), norm(para), 'paginated text must reconstruct the paragraph in order');

    // ── 6. An intentional poem/rhyme keeps its authored hard line breaks ─────
    const rhyme = g.run("SIMPLE_NPCS.find(function(n){return n.id==='student_b2'}).dialogue");
    const couplet = rhyme.find((p) => p.join(' ').includes('If hair burns red'));
    assert.ok(couplet, 'the rareborn rhyme should be present');
    assert.equal(couplet.length, 2, 'a rhyming couplet must keep its two authored lines (intentional break)');
    assert.ok(/green,”?$/.test(couplet[0]) || couplet[0].includes('blue or green'),
      'first rhyme line preserved verbatim');

    // ── 7. A deliberate short dramatic sequence keeps its intended structure ─
    const cat = g.run('JSON.stringify(CAT_PET_RESPONSES[1])');
    assert.equal(cat, JSON.stringify(['It bumps its head against your hand.', 'Twice.', 'Then walks away.']),
      "the deliberate 'Twice.' beat must remain three separate fragments");

    // ── 8. Opening Oswin through the REAL interaction/input path, then
    //       rendering the affected page, does not throw or alter progression ──
    g.run(
      'inDungeon=false; inSluice=false; inTown=true; townBuilding="house"; currentHouseId="west_b"; ' +
      'menu.open=false; shop.open=false; accordPanel.open=false; continentMap.open=false; ' +
      'dialogue.open=false; dialogue.page=0; dialogue._preprocessedFor=null; cat_quest_stage=0; ' +
      'player.x=5.5*TILE; player.y=4.5*TILE+22; player.facing="up";'
    );
    const before = g.run('JSON.stringify({flags: QUEST_FLAG_SCHEMA.map(function(k){return window[k]}), day: day, mq: MainQuest})');

    g.press(' ');  // interact with Oswin
    assert.equal(g.run('dialogue.open'), true, 'interacting with Oswin opens dialogue via the real input path');

    // Step through every page, rendering each (including the joined Oswin page),
    // confirming no throw and that progression advances then closes normally.
    let guard = 0;
    while (g.run('dialogue.open') && guard++ < 40) {
      assert.doesNotThrow(function () { g.renderFrame(); }, 'rendering an Oswin dialogue page must not throw');
      g.press(' ');
    }
    assert.equal(g.run('dialogue.open'), false, 'advancing through the pages closes the dialogue');

    const after = g.run('JSON.stringify({flags: QUEST_FLAG_SCHEMA.map(function(k){return window[k]}), day: day, mq: MainQuest})');
    assert.equal(after, before, 'reading Oswin’s dialogue must not change any save/progression state');

    // Different speaker fonts must govern actual rendered lines, rather than
    // wrapping the entire conversation using whichever page appeared first.
    // The VM's usual fixed-width stub cannot expose that mismatch.
    g.run(`
      ctx.measureText=function(text){return {width:String(text).length*(ctx.font.includes('Georgia')?6:10)};};
      window.__mixedPaint=[];
      ctx.fillText=function(text,x,y){__mixedPaint.push({text,font:ctx.font,x,y,width:ctx.measureText(text).width});};
    `);
    const sentence='Then let’s eat. I’d like to see it before you arrange a private showing.';
    for(const ids of [['sera','liora',null,'esla'],['liora','sera',null,'esla']]){
      const records=ids.map(speakerId=>({speakerId,lines:[sentence]}));
      // Include a long page to check metadata survives additional visual pages.
      records.push({speakerId:'sera',lines:[Array(9).fill(sentence).join(' ')]});
      g.run('openDialogue("",[[]]);setSpeakerDialoguePages('+JSON.stringify(records)+');tick=0');
      let cursor=0;
      while(cursor<g.run('dialogue.pages.length')){
        g.run('dialogue.page='+cursor+';__mixedPaint=[];drawDialogue()');
        const speaker=g.run('dialoguePagePresentation().speakerId');
        const font=g.run('dialogueTextStyle(dialoguePagePresentation().styleId).bodyFont');
        const paint=JSON.parse(g.run('JSON.stringify(__mixedPaint)')).filter(v=>v.y>=410&&v.y<=456);
        assert.ok(paint.length>0);
        for(const line of paint){
          assert.equal(line.font,font,'draw font matches the active speaker on the first and later frames');
          assert.ok(line.width<=468,'actual painted line fits for '+speaker+': '+line.text);
        }
        assert.ok(g.run('dialogue.pages[dialogue.page].length')<=3,'visual page remains height-safe');
        cursor++;
      }
      const flat=JSON.parse(g.run('JSON.stringify(dialogue.pages)')).flat().join(' ');
      assert.equal(norm(flat),norm(records.map(r=>r.lines.join(' ')).join(' ')),'no prose lost or duplicated');
      const speakers=JSON.parse(g.run('JSON.stringify(dialogue.pageSpeakers)'));
      assert.deepEqual(speakers.slice(0,4),ids,'mixed speaker identity survives wrapping');
      assert.ok(speakers.slice(4).every(id=>id==='sera'),'pagination retains the long-page speaker');
    }

  },
};
