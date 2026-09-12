'use strict';

// Binary-preservation and orientation coverage for the reversible guest-room
// visual trial. Runtime scene flow remains covered by tests 131–133.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { createContext } = require('../harness');

const ROOT = path.join(__dirname, '..', '..');
const rel = (name) => path.join(ROOT, name);
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

function decodeRgbaPng(relativePath) {
  const png = fs.readFileSync(rel(relativePath));
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  let offset = 8;
  let width = 0;
  let height = 0;
  const idat = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString('ascii');
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      assert.equal(data[8], 8, 'rotation sources use 8-bit channels');
      assert.equal(data[9], 6, 'rotation sources are RGBA');
      assert.equal(data[12], 0, 'rotation sources are non-interlaced');
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    offset += length + 12;
  }
  const packed = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  let packedOffset = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
  };
  for (let y = 0; y < height; y++) {
    const filter = packed[packedOffset++];
    for (let x = 0; x < stride; x++) {
      const raw = packed[packedOffset++];
      const left = x >= 4 ? pixels[y * stride + x - 4] : 0;
      const up = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      let value;
      if (filter === 0) value = raw;
      else if (filter === 1) value = raw + left;
      else if (filter === 2) value = raw + up;
      else if (filter === 3) value = raw + Math.floor((left + up) / 2);
      else if (filter === 4) value = raw + paeth(left, up, upperLeft);
      else assert.fail('unsupported PNG filter ' + filter);
      pixels[y * stride + x] = value & 255;
    }
  }
  return { width, height, pixels };
}

function alphaBounds(image) {
  let minX = image.width, minY = image.height, maxX = -1, maxY = -1, count = 0;
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      if (image.pixels[(y * image.width + x) * 4 + 3] === 0) continue;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); count++;
    }
  }
  return { bounds: [minX, minY, maxX + 1, maxY + 1], count };
}

module.exports = {
  name: 'Sera/Liora guest-room trial: preserved masters, lossless north rotation, scoped runtime references',
  run() {
    const oldRoomSource = fs.readFileSync(rel('render-interiors.js'));
    const roomMaster = fs.readFileSync(rel('Art/generated/sera-liora/guest-room-redraw-v1-master.png'));
    const original = fs.readFileSync(rel('Art/generated/sera-liora/liora-lying-side-head-right-waist-hair-v3.png'));
    const runtimeRoom = fs.readFileSync(rel('assets/backgrounds/cutaways/sera-liora/guest-room-redraw-v1-runtime.png'));
    const viewportPreview = fs.readFileSync(rel('Art/generated/sera-liora/guest-room-redraw-v1-viewport-preview.png'));

    assert.equal(sha256(oldRoomSource), 'aa4f4fe0e17e3d59111fbb69d3e4207d5592622c99e31491b80c733d4d22909f',
      'the complete code-native fallback room source remains byte-identical');
    assert.equal(sha256(roomMaster), '7f70e1752b094f15cd62b7defeff2719c845e0517ec3a4112acdd04da3075827',
      'the generated full-resolution room master remains byte-identical');
    assert.equal(sha256(original), 'e2cdf9bf2e2ddcb862c62e169e3cfb2ffd1480f6f2e4e75ad4cb6d773b2385df',
      'the approved lying Liora master remains byte-identical');
    assert.equal(sha256(runtimeRoom), sha256(viewportPreview),
      'the runtime room is an exact copy of the reviewed 512x480 derivative');

    const source = decodeRgbaPng('Art/generated/sera-liora/liora-lying-side-head-right-waist-hair-v3.png');
    const north = decodeRgbaPng('assets/sprites/cutaways/sera-liora/close/liora-lying-north-v1.png');
    assert.deepEqual([source.width, source.height], [1535, 1024]);
    assert.deepEqual([north.width, north.height], [1024, 1535]);

    // Exact 90° counter-clockwise transpose: dst(x,y) = src(width-1-y,x).
    for (let y = 0; y < north.height; y++) {
      for (let x = 0; x < north.width; x++) {
        const dst = (y * north.width + x) * 4;
        const src = (x * source.width + (source.width - 1 - y)) * 4;
        assert.equal(north.pixels.readUInt32BE(dst), source.pixels.readUInt32BE(src));
      }
    }
    const sourceAlpha = alphaBounds(source);
    const northAlpha = alphaBounds(north);
    assert.deepEqual(sourceAlpha.bounds, [25, 192, 1449, 844]);
    assert.deepEqual(northAlpha.bounds, [192, 86, 844, 1510]);
    assert.equal(northAlpha.count, sourceAlpha.count, 'every non-transparent silhouette pixel is retained');

    // The visually confirmed head/hair at source-right is mechanically mapped
    // into the top portion of the north-oriented derivative.
    let warmHairTop = 0, warmHairBottom = 0;
    for (let y = 0; y < north.height; y++) {
      for (let x = 0; x < north.width; x++) {
        const i = (y * north.width + x) * 4;
        const r = north.pixels[i], g = north.pixels[i + 1], b = north.pixels[i + 2], a = north.pixels[i + 3];
        if (a && r > 170 && g > 45 && g < 190 && b < 80) {
          if (y < north.height / 2) warmHairTop++;
          else warmHairBottom++;
        }
      }
    }
    assert.ok(warmHairTop > warmHairBottom * 3, 'orange/red head hair is concentrated at the top');

    const g = createContext();
    assert.equal(g.run('SAVE_VERSION'), 4);
    assert.equal(g.run("IMAGE_ASSET_REGISTRY.cutaway_liora_close_asleep_north_v1.use"), 'close_cutaway_pose_highres');
    assert.equal(g.run("IMAGE_ASSET_BUNDLES.sera_liora_opening.filter(function(id){return id==='cutaway_liora_close_asleep_north_v1';}).length"), 0,
      'the preserved north cutout is no longer preloaded for the opening');
    assert.equal(g.run("Object.values(IMAGE_ASSET_BUNDLES).filter(function(ids){return ids.indexOf('cutaway_liora_close_asleep_north_v1')>=0;}).length"), 0,
      'the preserved north cutout is dormant in every runtime bundle');

    const saveAndState = fs.readFileSync(rel('save.js'), 'utf8') + fs.readFileSync(rel('state.js'), 'utf8');
    assert.doesNotMatch(saveAndState, /guest-room-redraw|liora-lying-north|cutaway_liora_close_asleep_north/,
      'the visual trial introduces no save or persistent-state binding');

    const productionJs = fs.readdirSync(ROOT).filter((name) => name.endsWith('.js'));
    const referenceFiles = (assetId) => productionJs
      .filter((name) => fs.readFileSync(rel(name), 'utf8').includes(assetId)).sort();
    assert.deepEqual(referenceFiles('cutaway_bethany_guest_room_redraw_v1'),
      ['image-assets.js', 'render-entities.js', 'render.js']);
    assert.deepEqual(referenceFiles('cutaway_liora_close_asleep_north_v1'),
      ['image-assets.js'],
      'the preserved north pose remains registered but has no active renderer reference');
  },
};
