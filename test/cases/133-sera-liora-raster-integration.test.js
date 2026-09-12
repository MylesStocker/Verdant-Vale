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
      cutaway_bethany_guest_room_redraw_v1: ['assets/backgrounds/cutaways/sera-liora/guest-room-redraw-v1-runtime.png', 512, 480, null, null, 2],
      cutaway_liora_bed_lying_under_covers_v1: ['Art/generated/sera-liora/liora-bed-lying-under-covers-v1-patch.png', 144, 264, null, null, 2],
      cutaway_liora_bed_sitting_under_covers_v1: ['Art/generated/sera-liora/liora-bed-sitting-under-covers-v1-patch.png', 144, 264, null, null, 2],
      cutaway_sera_neutral: ['assets/sprites/cutaways/sera-liora/sera-neutral-48x64.png', 48, 64, 24, 58],
      cutaway_liora_neutral: ['assets/sprites/cutaways/sera-liora/liora-neutral-48x64.png', 48, 64, 24, 58],
      cutaway_liora_asleep: ['assets/sprites/cutaways/sera-liora/liora-asleep-bed.png', 104, 41, 80, 21],
      cutaway_liora_sitting: ['assets/sprites/cutaways/sera-liora/liora-sitting-bed.png', 48, 57, 24, 52],
      cutaway_sera_close_standing: ['assets/sprites/cutaways/sera-liora/close/sera-standing.png', 96, 128, 48, 112],
      cutaway_sera_close_standing_fit_v2: ['assets/sprites/cutaways/sera-liora/close/sera-standing-fit-v2.png', 112, 168, 56, 159],
      cutaway_sera_walk_cycle_v1: ['assets/sprites/cutaways/sera-liora/close/sera-walk-cycle-3x3-v1.png', 336, 504, 56, 164],
      cutaway_liora_close_standing_master_v1: ['Art/generated/sera-liora/liora-standing-actor-master-v1.png', 1024, 1536, 56, 163, 6, 112, 168],
      cutaway_liora_close_asleep: ['assets/sprites/cutaways/sera-liora/close/liora-asleep.png', 120, 64, 86, 46],
      cutaway_liora_close_asleep_fit_v1: ['assets/sprites/cutaways/sera-liora/close/liora-asleep-fit-v1.png', 160, 80, 126, 45],
      cutaway_liora_close_asleep_north_v1: ['assets/sprites/cutaways/sera-liora/close/liora-lying-north-v1.png', 1024, 1535, 56, 159, 6, 112, 168],
      cutaway_liora_close_sitting: ['assets/sprites/cutaways/sera-liora/close/liora-sitting.png', 80, 72, 40, 56],
      cutaway_liora_close_sitting_fit_v1: ['assets/sprites/cutaways/sera-liora/close/liora-sitting-fit-v1.png', 96, 112, 48, 90],
      cutaway_sera_portrait: ['assets/portraits/cutaways/sera-liora/sera-neutral.png', 80, 96, null, null],
      cutaway_liora_portrait: ['assets/portraits/cutaways/sera-liora/liora-neutral.png', 80, 96, null, null],
    };

    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const registry = JSON.parse(g.run('JSON.stringify(IMAGE_ASSET_REGISTRY)'));
    assert.deepEqual(Object.keys(registry).sort(), Object.keys(expected).sort());
    assert.equal(new Set(Object.values(registry).map((entry) => entry.path)).size, Object.keys(expected).length, 'paths are unique');
    for (const [id, [assetPath, width, height, ax, ay, colorType = 6, displayWidth = null, displayHeight = null]] of Object.entries(expected)) {
      const meta = registry[id];
      assert.equal(meta.path, assetPath);
      assert.deepEqual(pngDimensions(assetPath), { width, height, colorType }, id + ' has the expected PNG header');
      if (ax !== null) assert.deepEqual(meta.anchor, { x: ax, y: ay });
      if (displayWidth !== null) {
        assert.equal(meta.displayWidth, displayWidth);
        assert.equal(meta.displayHeight, displayHeight);
      }
    }
    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.deepEqual(
      JSON.parse(g.run("JSON.stringify([IMAGE_ASSET_REGISTRY.cutaway_sera_close_standing_fit_v2.width,IMAGE_ASSET_REGISTRY.cutaway_sera_close_standing_fit_v2.height,IMAGE_ASSET_REGISTRY.cutaway_liora_close_asleep_north_v1.displayWidth,IMAGE_ASSET_REGISTRY.cutaway_liora_close_asleep_north_v1.displayHeight])")),
      [112, 168, 112, 168], 'standing Sera and lying Liora share one environmental scale canvas');
    assert.deepEqual(
      JSON.parse(g.run("JSON.stringify([IMAGE_ASSET_REGISTRY.cutaway_sera_walk_cycle_v1.frameWidth,IMAGE_ASSET_REGISTRY.cutaway_sera_walk_cycle_v1.frameHeight])")),
      [112, 168], 'walking frames retain the established Guest Room actor scale');
    assert.equal(g.run('SERA_LIORA_NORMAL_ENTRY_ENABLED'), false, 'normal entry remains held by default');
    assert.equal(g.run('Object.keys(_imageAssetCache).length'), 0, 'module import creates no Image objects/cache entries');
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(IMAGE_ASSET_BUNDLES.sera_liora_opening)')), [
      'cutaway_bethany_guest_room_redraw_v1',
      'cutaway_liora_bed_lying_under_covers_v1',
      'cutaway_liora_bed_sitting_under_covers_v1',
      'cutaway_sera_close_standing_fit_v2',
      'cutaway_sera_close_standing',
      'cutaway_sera_walk_cycle_v1',
      'cutaway_liora_close_standing_master_v1',
      'cutaway_sera_portrait',
      'cutaway_liora_portrait',
    ], 'the opening preloads both bed states and omits every obsolete Liora cutout');

    installImmediateImages(g);
    g.run('debugPlaySeraLioraCutaway()');
    assert.equal(g.run('__imageConstructions'), 9, 'the bundle constructs the room, bed states, standing/walking actors, fallback, and portraits');
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
      window.__patchDraw=drawSeraLioraBedStatePatch; drawSeraLioraBedStatePatch=function(){window.__layerOrder.push('bed-patch');return window.__patchDraw();};
      window.__actorDraw=drawSeraLioraCutawayActors; drawSeraLioraCutawayActors=function(){window.__layerOrder.push('actors');return window.__actorDraw();};
      window.__blanketDraw=drawBethanyGuestBedForeground; drawBethanyGuestBedForeground=function(){window.__layerOrder.push('blanket');return window.__blanketDraw();};
      window.__dialogueDraw=drawDialogue; drawDialogue=function(){window.__layerOrder.push('dialogue');return window.__dialogueDraw();};
      render();
    `);
    assert.deepEqual(JSON.parse(g.run('JSON.stringify(__layerOrder)')), ['bed-patch', 'actors', 'dialogue'],
      'the stable raster room draws first, then one bed patch, Sera, and dialogue');
    let draws = JSON.parse(g.run('JSON.stringify(__drawImages)'));
    assert.deepEqual(draws.find((args) => args[0].endsWith('/guest-room-redraw-v1-runtime.png')).slice(1), [0, 0]);
    assert.equal(draws.filter((args) => args[0].endsWith('/close/sera-standing-fit-v2.png')).length, 1);
    assert.equal(draws.some((args) => args[0].endsWith('/close/sera-standing.png')), false, 'former Sera sprite is reserved for load failure');
    assert.equal(draws.filter((args) => args[0].endsWith('/liora-bed-lying-under-covers-v1-patch.png')).length, 1);
    assert.deepEqual(draws.find((args) => args[0].endsWith('/liora-bed-lying-under-covers-v1-patch.png')).slice(1), [368, 112]);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-bed-sitting-under-covers-v1-patch.png')), false);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-lying-north-v1.png')), false,
      'the mechanically rotated cutout is never drawn');
    assert.equal(draws.some((args) => args[0].endsWith('/close/liora-asleep-fit-v1.png')), false, 'east-west sleeping pose is retained only for the legacy-room fallback');
    assert.equal(draws.some((args) => args[0].endsWith('/close/liora-asleep.png')), false, 'former sleeping sprite is reserved for legacy fallback failure');
    assert.equal(draws.some((args) => args[0].endsWith('/liora-neutral-48x64.png')), false, 'neutral Liora is not drawn in bed');
    assert.equal(draws.some((args) => args[0].endsWith('/sera-neutral-48x64.png')), false, 'general Sera field sprite is not used at close-cutaway scale');
    assert.equal(draws.some((args) => args[0].endsWith('/liora-asleep-bed.png')), false, 'small Liora bed pose is retained but not used in the close cutaway');
    assert.deepEqual(draws.find((args) => args[0].endsWith('/close/sera-standing-fit-v2.png')).slice(1), [294, 186]);
    assert.equal(draws.every((args) => args.slice(1).every(Number.isInteger)), true, 'background and actor draws use stable integer geometry');
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
    assert.equal(draws.filter((args) => args[0].endsWith('/liora-bed-sitting-under-covers-v1-patch.png')).length, 1);
    assert.deepEqual(draws.find((args) => args[0].endsWith('/liora-bed-sitting-under-covers-v1-patch.png')).slice(1), [368, 112]);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-bed-lying-under-covers-v1-patch.png')), false,
      'the lying patch is atomically replaced at the established sitting beat');
    assert.equal(draws.some((args) => args[0].endsWith('/close/liora-sitting-fit-v1.png')), false,
      'the malformed independent sitting cutout is never drawn');
    assert.equal(draws.some((args) => args[0].endsWith('/close/liora-sitting.png')), false, 'former sitting sprite is reserved for load failure');
    assert.equal(draws.some((args) => args[0].endsWith('/close/liora-asleep-fit-v1.png')), false);
    assert.equal(draws.some((args) => args[0].endsWith('/close/liora-asleep.png')), false);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-sitting-bed.png')), false);
    assert.equal(draws.some((args) => args[0].endsWith('/liora-neutral-48x64.png')), false);
    assert.equal(draws.every((args) => args.slice(1).every(Number.isInteger)), true);

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

    // A failed approved room set falls back coherently to the code-native room
    // and actors without reviving obsolete raster cutouts. A portrait failure
    // removes only its side reservation. All failures settle and replay reuses cache.
    const failed = createContext(); failed.press('Enter'); failed.press('Enter');
    installImmediateImages(failed, [
      'assets/backgrounds/cutaways/sera-liora/guest-room-redraw-v1-runtime.png',
      'assets/sprites/cutaways/sera-liora/close/sera-standing-fit-v2.png',
      'assets/sprites/cutaways/sera-liora/close/sera-standing.png',
      'assets/portraits/cutaways/sera-liora/liora-neutral.png',
    ]);
    failed.run('debugPlaySeraLioraCutaway()'); advanceToRoom(failed);
    failed.run('__seraFallbacks=0;window.__drawImages=[];ctx.drawImage=function(){window.__drawImages.push(Array.from(arguments).map(function(v){return v&&v._src?v._src:v;}));};window.__oldSera=drawCutawaySera;drawCutawaySera=function(){__seraFallbacks++;return __oldSera();};render();');
    assert.equal(failed.run('__seraFallbacks'), 1, 'failed Sera raster draws exactly one code-native fallback');
    assert.equal(failed.run("imageAssetRuntime('cutaway_sera_close_standing_fit_v2').status"), 'error');
    assert.equal(failed.run("imageAssetRuntime('cutaway_sera_close_standing').status"), 'error');
    assert.equal(failed.run("__drawImages.some(function(args){return /liora-(lying-north|asleep|sitting)/.test(args[0]);})"), false,
      'failure fallback draws no obsolete Liora raster cutout');
    while (failed.run('seraLioraCutscene.beat') < 10) failed.press(' ');
    assert.equal(failed.run('dialogue.portraitId'), 'cutaway_liora_portrait');
    assert.deepEqual(JSON.parse(failed.run(`JSON.stringify((function(){var x=dialoguePortraitLayout(8,358,496,114,14);return {portrait:x.portrait,textX:x.textX,textW:x.textW};})())`)),
      { portrait: null, textX: 22, textW: 468 }, 'failed portrait falls back to ordinary geometry');
    while (failed.run('seraLioraCutscene.beat') < 20) failed.press(' ');
    failed.run('__drawImages=[];render();');
    assert.equal(failed.run("__drawImages.some(function(args){return /liora-(lying-north|asleep|sitting)/.test(args[0]);})"), false,
      'sitting failure fallback still draws no obsolete Liora raster cutout');
    while (failed.run('seraLioraCutscene.beat') < 21) failed.press(' ');
    failed.press(' '); failed.frames(30);
    assert.equal(failed.run('activeMap === DRENWICK_INFIRMARY_MAP'), true, 'asset failures do not interrupt hospital handoff');
    failed.run('debugPlaySeraLioraCutaway()');
    assert.equal(failed.run('__imageConstructions'), 9, 'warm replay constructs no replacement images');
    assert.equal(failed.run('seraLioraCutscene.startCount'), 2);

    const saveCtx = createContext(); saveCtx.press('Enter'); saveCtx.press('Enter');
    saveCtx.run('saveGame();');
    const saved = JSON.parse(saveCtx.run("localStorage.getItem('verdantVale_save')"));
    assert.equal(saved.version, 4);
    assert.equal(Object.keys(saved).some((key) => /image|asset|portrait|sera|liora/i.test(key)), false);
  },
};
