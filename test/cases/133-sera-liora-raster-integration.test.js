'use strict';

// Covers the optional raster seam end to end: authoritative metadata and real
// PNG headers, lazy one-per-id caching, cold-cache wait, close-cutaway actor
// draws, retained general field assets, local bed occlusion, scoped portraits,
// fail-soft fallback, and both the held normal-entry seam and direct debug preview.

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');

const ROOT = path.join(__dirname, '..', '..');

function pngDimensions(relativePath) {
  const data = fs.readFileSync(path.join(ROOT, relativePath));
  assert.equal(data.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20), colorType: data[25] };
}

function installImmediateImages(g, failedPaths) {
  const failures = JSON.stringify(failedPaths || []);
  g.run(`
    window.__imageConstructions = 0;
    window.__failedImagePaths = new Set(${failures});
    window.Image = function() {
      this.onload = null; this.onerror = null; this.naturalWidth = 0; this.naturalHeight = 0;
      this._src = ''; window.__imageConstructions++;
    };
    Object.defineProperty(window.Image.prototype, 'src', {
      set: function(value) {
        this._src = value;
        var id = Object.keys(IMAGE_ASSET_REGISTRY).find(function(key) {
          return IMAGE_ASSET_REGISTRY[key].path === value;
        });
        var meta = id ? IMAGE_ASSET_REGISTRY[id] : null;
        this.naturalWidth = meta ? meta.width : 1;
        this.naturalHeight = meta ? meta.height : 1;
        if (window.__failedImagePaths.has(value)) this.onerror();
        else this.onload();
      },
      get: function() { return this._src; }
    });
  `);
}

function advanceToRoom(g) {
  g.press(' ');
  g.frames(18);
  assert.equal(g.run('seraLioraCutscene.beat'), 1);
  g.press(' ');
  assert.equal(g.run('seraLioraCutscene.phase'), 'room_reveal');
  g.frames(40);
  assert.equal(g.run('seraLioraCutscene.beat'), 2);
}

module.exports = {
  name: 'Sera/Liora raster integration: cache, anchors, bed layers, portraits, cold wait, fallback',
  async run() {
    const expected = {
      cutaway_sera_neutral: ['assets/sprites/cutaways/sera-liora/sera-neutral-48x64.png', 48, 64, 24, 58],
      cutaway_liora_neutral: ['assets/sprites/cutaways/sera-liora/liora-neutral-48x64.png', 48, 64, 24, 58],
      cutaway_liora_asleep: ['assets/sprites/cutaways/sera-liora/liora-asleep-bed.png', 104, 41, 80, 21],
      cutaway_liora_sitting: ['assets/sprites/cutaways/sera-liora/liora-sitting-bed.png', 48, 57, 24, 52],
      cutaway_sera_close_standing: ['assets/sprites/cutaways/sera-liora/close/sera-standing.png', 96, 128, 48, 112],
      cutaway_liora_close_asleep: ['assets/sprites/cutaways/sera-liora/close/liora-asleep.png', 120, 64, 86, 46],
      cutaway_liora_close_sitting: ['assets/sprites/cutaways/sera-liora/close/liora-sitting.png', 80, 72, 40, 56],
      cutaway_sera_portrait: ['assets/portraits/cutaways/sera-liora/sera-neutral.png', 80, 96, null, null],
      cutaway_liora_portrait: ['assets/portraits/cutaways/sera-liora/liora-neutral.png', 80, 96, null, null],
    };

    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const registry = JSON.parse(g.run('JSON.stringify(IMAGE_ASSET_REGISTRY)'));
    assert.deepEqual(Object.keys(registry).sort(), Object.keys(expected).sort());
    assert.equal(new Set(Object.values(registry).map((entry) => entry.path)).size, 9, 'paths are unique');
    for (const [id, [assetPath, width, height, ax, ay]] of Object.entries(expected)) {
      const meta = registry[id];
      assert.equal(meta.path, assetPath);
      assert.deepEqual(pngDimensions(assetPath), { width, height, colorType: 6 }, id + ' is the expected RGBA PNG');
      if (ax !== null) assert.deepEqual(meta.anchor, { x: ax, y: ay });
    }
    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(g.run('SERA_LIORA_NORMAL_ENTRY_ENABLED'), false, 'normal entry remains held by default');
    assert.equal(g.run('Object.keys(_imageAssetCache).length'), 0, 'module import creates no Image objects/cache entries');
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(IMAGE_ASSET_BUNDLES.sera_liora_opening)')), [
      'cutaway_sera_close_standing',
      'cutaway_liora_close_asleep',
      'cutaway_liora_close_sitting',
      'cutaway_sera_portrait',
      'cutaway_liora_portrait',
    ], 'the room bundle omits retained but unused general-field assets');

    installImmediateImages(g);
    g.run('debugPlaySeraLioraCutaway()');
    assert.equal(g.run('__imageConstructions'), 5, 'the requested bundle constructs only its five close-scene images');
    assert.equal(g.run("IMAGE_ASSET_BUNDLES.sera_liora_opening.every(function(id){return imageAssetRuntime(id).status==='loaded';})"), true);
    assert.equal(g.run('dialogue.portraitId'), null, 'first white line has no portrait');
    assert.equal(g.run('dialogue.portraitSide'), null);
    g.run('__drawImages=[];ctx.drawImage=function(){__drawImages.push(Array.from(arguments).map(function(v){return v&&v._src?v._src:v;}));};render();');
    assert.equal(g.run('__drawImages.length'), 0, 'white-screen opening draws no field sprite or portrait');

    advanceToRoom(g);
    assert.equal(g.run('dialogue.pages[0][0]'), 'I am awake.');
    assert.equal(g.run('dialogue.portraitId'), null, 'eyes-closed first response remains portrait-free');

    g.run(`
      window.__layerOrder=[]; window.__drawImages=[];
      ctx.drawImage=function(){ window.__drawImages.push(Array.from(arguments).map(function(v){return v&&v._src?v._src:v;})); };
      window.__roomDraw=drawBethanyGuestRoom; drawBethanyGuestRoom=function(){window.__layerOrder.push('bed-base');return window.__roomDraw();};
      window.__actorDraw=drawSeraLioraCutawayActors; drawSeraLioraCutawayActors=function(){window.__layerOrder.push('actors');return window.__actorDraw();};
      window.__blanketDraw=drawBethanyGuestBedForeground; drawBethanyGuestBedForeground=function(){window.__layerOrder.push('blanket');return window.__blanketDraw();};
      window.__dialogueDraw=drawDialogue; drawDialogue=function(){window.__layerOrder.push('dialogue');return window.__dialogueDraw();};
      render();
    `);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(__layerOrder)')).slice(0, 4), ['bed-base', 'actors', 'blanket', 'dialogue']);
    let draws = JSON.parse(g.run('JSON.stringify(__drawImages)'));
    assert.equal(draws.filter((args) => args[0].endsWith('/close/sera-standing.png')).length, 1);
    assert.equal(draws.filter((args) => args[0].endsWith('/close/liora-asleep.png')).length, 1);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-neutral-48x64.png')), false, 'neutral Liora is not drawn in bed');
    assert.equal(draws.some((args) => args[0].endsWith('/sera-neutral-48x64.png')), false, 'general Sera field sprite is not used at close-cutaway scale');
    assert.equal(draws.some((args) => args[0].endsWith('/liora-asleep-bed.png')), false, 'small Liora bed pose is retained but not used in the close cutaway');
    assert.deepEqual(draws.find((args) => args[0].endsWith('/close/sera-standing.png')).slice(1), [246, 223]);
    assert.deepEqual(draws.find((args) => args[0].endsWith('/close/liora-asleep.png')).slice(1), [359, 216]);
    assert.equal(draws.every((args) => args.length === 3), true, 'all sprite draws use source plus integer x/y only');
    assert.equal(g.run('ctx.imageSmoothingEnabled'), false);

    g.press(' '); // beat 3: first room Sera portrait
    assert.equal(g.run('seraLioraCutscene.beat'), 3);
    assert.equal(g.run('dialogue.portraitId'), 'cutaway_sera_portrait');
    assert.equal(g.run('dialogue.portraitSide'), 'left');
    assert.match(g.run('dialogueTextStyle(dialogue.styleId).bodyFont'), /Georgia/);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(dialoguePortraitLayout(8,358,496,114,14))')),
      { portrait: { naturalWidth: 80, naturalHeight: 96, _src: 'assets/portraits/cutaways/sera-liora/sera-neutral.png' }, portraitX: 22, portraitY: 367, textX: 110, textW: 380 });

    while (g.run('seraLioraCutscene.beat') < 10) g.press(' ');
    assert.equal(g.run('dialogue.pages[0][0]'), 'Have they?');
    assert.equal(g.run('dialogue.portraitId'), 'cutaway_liora_portrait', 'Liora portrait begins only after her eyes open');
    assert.equal(g.run('dialogue.portraitSide'), 'right');
    const rightLayout = JSON.parse(g.run(`JSON.stringify((function(){var x=dialoguePortraitLayout(8,358,496,114,14);return {portraitX:x.portraitX,portraitY:x.portraitY,textX:x.textX,textW:x.textW};})())`));
    assert.deepEqual(rightLayout, { portraitX: 410, portraitY: 367, textX: 22, textW: 380 });
    assert.ok(rightLayout.textX + rightLayout.textW < rightLayout.portraitX, 'text and prompt stay clear of right portrait');

    while (g.run('seraLioraCutscene.beat') < 20) g.press(' ');
    g.run('__drawImages=[];render();');
    draws = JSON.parse(g.run('JSON.stringify(__drawImages)'));
    assert.equal(draws.filter((args) => args[0].endsWith('/close/liora-sitting.png')).length, 1);
    assert.deepEqual(draws.find((args) => args[0].endsWith('/close/liora-sitting.png')).slice(1), [399, 206]);
    assert.equal(draws.some((args) => args[0].endsWith('/close/liora-asleep.png')), false);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-sitting-bed.png')), false);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-neutral-48x64.png')), false);
    assert.equal(draws.every((args) => args.length === 3 && Number.isInteger(args[1]) && Number.isInteger(args[2])), true);

    // A legacy page has the exact pre-portrait text rectangle and no image.
    g.run("seraLioraCutscene.active=false;openDialogue('Legacy',[['unchanged']]);");
    assert.deepEqual(JSON.parse(g.run(`JSON.stringify((function(){var x=dialoguePortraitLayout(8,358,496,114,14);return {portrait:x.portrait,portraitX:x.portraitX,portraitY:x.portraitY,textX:x.textX,textW:x.textW};})())`)),
      { portrait: null, portraitX: null, portraitY: null, textX: 22, textW: 468 });
    assert.equal(g.run('dialogue.styleId'), null);

    // Cold cache: the second white line closes into a still-white locked wait,
    // then the same room reveal begins after every image settles.
    const cold = createContext(); cold.press('Enter'); cold.press('Enter');
    cold.run(`
      window.__pendingImages=[];
      window.Image=function(){this.onload=null;this.onerror=null;this.naturalWidth=0;this.naturalHeight=0;this._src='';};
      Object.defineProperty(window.Image.prototype,'src',{set:function(value){this._src=value;var id=Object.keys(IMAGE_ASSET_REGISTRY).find(function(k){return IMAGE_ASSET_REGISTRY[k].path===value;});this.naturalWidth=IMAGE_ASSET_REGISTRY[id].width;this.naturalHeight=IMAGE_ASSET_REGISTRY[id].height;window.__pendingImages.push(this);},get:function(){return this._src;}});
      debugPlaySeraLioraCutaway();
    `);
    cold.press(' '); cold.frames(18); cold.press(' ');
    assert.equal(cold.run('seraLioraCutscene.phase'), 'asset_wait');
    assert.equal(cold.run('activeMap === DREAM_MAP'), true);
    assert.equal(cold.run('dialogue.open'), false);
    cold.press('m'); cold.hold('ArrowRight'); cold.frames(2); cold.release('ArrowRight');
    assert.equal(cold.run('menu.open'), false, 'asset wait remains fully input-locked');
    cold.run('__pendingImages.forEach(function(image){image.onload();});');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(cold.run('seraLioraCutscene.phase'), 'room_reveal');
    assert.equal(cold.run('activeMap === BETHANY_GUEST_ROOM_MAP'), true);

    // Dormant normal entry uses the same white field and loader seam without
    // changing the default release gate.
    const normal = createContext(); normal.press('Enter'); normal.press('Enter'); installImmediateImages(normal);
    normal.run('SERA_LIORA_NORMAL_ENTRY_ENABLED=true;inTown=false;inBasinChamber=true;activeMap=BASIN_CHAMBER_MAP;dialogue.open=false;basinChamberDreamSequence();');
    const pageCount = normal.run('dialogue.pages.length');
    for (let i = 0; i < pageCount; i++) normal.press(' ');
    assert.equal(normal.run('seraLioraCutscene.active'), true);
    assert.equal(normal.run('activeMap === DREAM_MAP'), true);
    assert.equal(normal.run('dialogue.pages[0][0]'), 'Liora.');
    assert.equal(normal.run('dialogue.portraitId'), null);

    // One field failure uses one code-drawn actor; one portrait failure removes
    // only its side reservation. Both failures settle, and replay reuses cache.
    const failed = createContext(); failed.press('Enter'); failed.press('Enter');
    installImmediateImages(failed, [
      'assets/sprites/cutaways/sera-liora/close/sera-standing.png',
      'assets/portraits/cutaways/sera-liora/liora-neutral.png',
    ]);
    failed.run('debugPlaySeraLioraCutaway()'); advanceToRoom(failed);
    failed.run('__seraFallbacks=0;window.__oldSera=drawCutawaySera;drawCutawaySera=function(){__seraFallbacks++;return __oldSera();};render();');
    assert.equal(failed.run('__seraFallbacks'), 1, 'failed Sera raster draws exactly one code-native fallback');
    assert.equal(failed.run("imageAssetRuntime('cutaway_sera_close_standing').status"), 'error');
    while (failed.run('seraLioraCutscene.beat') < 10) failed.press(' ');
    assert.equal(failed.run('dialogue.portraitId'), 'cutaway_liora_portrait');
    assert.deepEqual(JSON.parse(failed.run(`JSON.stringify((function(){var x=dialoguePortraitLayout(8,358,496,114,14);return {portrait:x.portrait,textX:x.textX,textW:x.textW};})())`)),
      { portrait: null, textX: 22, textW: 468 }, 'failed portrait falls back to ordinary geometry');
    while (failed.run('seraLioraCutscene.beat') < 21) failed.press(' ');
    failed.press(' '); failed.frames(30);
    assert.equal(failed.run('activeMap === DRENWICK_INFIRMARY_MAP'), true, 'asset failures do not interrupt hospital handoff');
    failed.run('debugPlaySeraLioraCutaway()');
    assert.equal(failed.run('__imageConstructions'), 5, 'warm replay constructs no replacement images');
    assert.equal(failed.run('seraLioraCutscene.startCount'), 2);

    const saveCtx = createContext(); saveCtx.press('Enter'); saveCtx.press('Enter');
    saveCtx.run('saveGame();');
    const saved = JSON.parse(saveCtx.run("localStorage.getItem('verdantVale_save')"));
    assert.equal(saved.version, 4);
    assert.equal(Object.keys(saved).some((key) => /image|asset|portrait|sera|liora/i.test(key)), false);
  },
};
