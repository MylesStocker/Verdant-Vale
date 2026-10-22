'use strict';

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');

const ROOT = path.join(__dirname, '..', '..');
const LYING_PATH = 'assets/sprites/cutaways/sera-liora/depth-v2/liora-lying.png';
const SITTING_PATH = 'assets/sprites/cutaways/sera-liora/depth-v2/liora-sitting.png';
const ROOM_PATH = 'assets/backgrounds/cutaways/sera-liora/guest-room-redraw-v1-runtime.png';
const hash = (relativePath) => crypto.createHash('sha256')
  .update(fs.readFileSync(path.join(ROOT, relativePath))).digest('hex');

function installImmediateImages(g) {
  g.run(`
    window.__imageConstructions = 0;
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
        this.naturalWidth = IMAGE_ASSET_REGISTRY[id].width;
        this.naturalHeight = IMAGE_ASSET_REGISTRY[id].height;
        this.onload();
      },
      get: function() { return this._src; }
    });
  `);
}

function advanceToRoom(g) {
  g.press(' ');
  g.frames(18);
  g.press(' ');
  g.frames(40);
  assert.equal(g.run('seraLioraCutscene.beat'), 2);
}

function drawPaths(g) {
  g.run(`
    window.__patchDraws = [];
    ctx.drawImage = function() {
      __patchDraws.push(Array.from(arguments).map(function(value) {
        return value && value._src ? value._src : value;
      }));
    };
    render();
  `);
  return JSON.parse(g.run('JSON.stringify(__patchDraws)'));
}

module.exports = {
  name: 'Sera/Liora normalized wake poses: preload, authored coordinates, atomic pose selection, no obsolete cutouts',
  async run() {
    assert.equal(hash('Art/generated/sera-liora/liora-bed-lying-under-covers-v1-patch.png'), 'a3e7cc3b1f58a106e69bcf43c4a53cfa7f8dc22bc79c53d5306cdd77179442c2');
    assert.equal(hash('Art/generated/sera-liora/liora-bed-sitting-under-covers-v1-patch.png'), '842f6b209339a6ad53f5fcfef232c021141f8c33a4dafe9add49d28ce0dafd3b');
    assert.equal(hash(ROOM_PATH), 'd69e8d3170a9ed8c1a54b8eef1e9110b97b760b4d3f79b99ee19bbc56cd2632f');

    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const patch = { lyingAssetId: 'cutaway_liora_lying_depth_v2', sittingAssetId: 'cutaway_liora_sitting_depth_v2' };
    for (const [id,path] of [[patch.lyingAssetId,LYING_PATH],[patch.sittingAssetId,SITTING_PATH]]) {
      const meta=JSON.parse(g.run('JSON.stringify(IMAGE_ASSET_REGISTRY["'+id+'"])'));
      assert.deepEqual(meta,{path,use:'cutaway_depth_scene',width:192,height:216});
    }

    const openingBundle = JSON.parse(g.run('JSON.stringify(IMAGE_ASSET_BUNDLES.sera_liora_opening)'));
    assert.equal(openingBundle.filter((id) => id === patch.lyingAssetId).length, 1);
    assert.equal(openingBundle.filter((id) => id === patch.sittingAssetId).length, 1);
    for (const obsolete of [
      'cutaway_liora_close_asleep_north_v1',
      'cutaway_liora_close_asleep_fit_v1',
      'cutaway_liora_close_asleep',
      'cutaway_liora_close_sitting_fit_v1',
      'cutaway_liora_close_sitting',
    ]) {
      assert.equal(openingBundle.includes(obsolete), false, obsolete + ' is not preloaded');
    }

    installImmediateImages(g);
    g.run('debugPlaySeraLioraCutaway()');
    assert.equal(g.run('__imageConstructions'), 10);
    assert.equal(g.run("IMAGE_ASSET_BUNDLES.sera_liora_opening.every(function(id){return imageAssetRuntime(id).status==='loaded';})"), true);
    advanceToRoom(g);

    for (let beat = 2; beat <= 19; beat++) {
      assert.equal(g.run('seraLioraCutscene.beat'), beat);
      const draws = drawPaths(g);
      assert.equal(draws.filter((args) => args[0] === ROOM_PATH).length, 1, 'one stable room at beat ' + beat);
      assert.equal(draws.filter((args) => args[0] === LYING_PATH).length, 1, 'one lying pose at beat ' + beat);
      assert.equal(draws.filter((args) => args[0] === SITTING_PATH).length, 0, 'no sitting patch at beat ' + beat);
      assert.deepEqual(draws.find((args) => args[0] === LYING_PATH).slice(1), [347, 169]);
      assert.equal(draws.filter((args) => /liora-(lying-north|asleep)/.test(args[0])).length, 0);
      assert.deepEqual(
        draws.find((args) => args[0].endsWith('/depth-v2/sera-walk.png')).slice(1),
        [128, 0, 128, 192, 286, 161, 128, 192],
        'Sera uses the shared frame canvas and unchanged ground anchor'
      );
      if (beat < 19) g.press(' ');
    }

    g.press(' ');
    assert.equal(g.run('seraLioraCutscene.beat'), 20);
    assert.equal(g.run('seraLioraCutscene.lioraPose'), 'sitting');
    let draws = drawPaths(g);
    assert.equal(draws.filter((args) => args[0] === ROOM_PATH).length, 1);
    assert.equal(draws.filter((args) => args[0] === LYING_PATH).length, 0);
    assert.equal(draws.filter((args) => args[0] === SITTING_PATH).length, 1);
    assert.deepEqual(draws.find((args) => args[0] === SITTING_PATH).slice(1), [347, 149]);

    g.press(' ');
    assert.equal(g.run('seraLioraCutscene.beat'), 21);
    draws = drawPaths(g);
    assert.equal(draws.filter((args) => args[0] === LYING_PATH).length, 0);
    assert.equal(draws.filter((args) => args[0] === SITTING_PATH).length, 1);

    const cold = createContext();
    cold.press('Enter'); cold.press('Enter');
    cold.run(`
      window.__pendingImages = [];
      window.Image = function() {
        this.onload = null; this.onerror = null; this.naturalWidth = 0; this.naturalHeight = 0; this._src = '';
      };
      Object.defineProperty(window.Image.prototype, 'src', {
        set: function(value) {
          this._src = value;
          var id = Object.keys(IMAGE_ASSET_REGISTRY).find(function(key) {
            return IMAGE_ASSET_REGISTRY[key].path === value;
          });
          this.naturalWidth = IMAGE_ASSET_REGISTRY[id].width;
          this.naturalHeight = IMAGE_ASSET_REGISTRY[id].height;
          __pendingImages.push(this);
        },
        get: function() { return this._src; }
      });
      debugPlaySeraLioraCutaway();
    `);
    cold.press(' ');
    cold.frames(18);
    cold.press(' ');
    assert.equal(cold.run('seraLioraCutscene.phase'), 'asset_wait');
    assert.equal(cold.run('activeMap === DREAM_MAP'), true);
    assert.equal(cold.run("__pendingImages.some(function(image){return image._src==='" + LYING_PATH + "';})"), true);
    assert.equal(cold.run("__pendingImages.some(function(image){return image._src==='" + SITTING_PATH + "';})"), true);

    cold.run("__pendingImages.filter(function(image){return image._src!=='" + SITTING_PATH + "';}).forEach(function(image){image.onload();});");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(cold.run('seraLioraCutscene.phase'), 'asset_wait', 'white remains until the sitting patch is ready too');
    cold.run("__pendingImages.find(function(image){return image._src==='" + SITTING_PATH + "';}).onload();");
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(cold.run('seraLioraCutscene.phase'), 'room_reveal');
    assert.equal(cold.run('activeMap === BETHANY_GUEST_ROOM_MAP'), true);
    assert.equal(cold.run("imageAssetRuntime('cutaway_liora_lying_depth_v2').status"), 'loaded');
    assert.equal(cold.run("imageAssetRuntime('cutaway_liora_sitting_depth_v2').status"), 'loaded');
  },
};
