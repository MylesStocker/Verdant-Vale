'use strict';
// West Outfall visual revision: stable blocking HILLS terrain and one boat-scale,
// world-locked canal-tunnel portal, without changing scenery-only gameplay rules.

const assert = require('assert/strict');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');
const GRID_FP = require('../fixtures/regional-grid-fingerprints');

const ROOT = path.join(__dirname, '..', '..');
const ID = 'DRENWICK_WEST_OUTFALL_MAP';
const OLD_FP = 'bf9292a99442a4dedd583a1cc07544aabeed663efd97055a848935bcd451be9d';
const FP = 'ba1ab2ab813db74a65a342d6b89232f17a43ec092b12096d06124d9172ab6334';
const OLD_TILE_ID_HASH = 'e0700e295c651ac771e3bcd999db359afbb01609251f3617265a85647e74058e';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Reviewed East Causeway baseline. The outfall is deliberately omitted: it is
// the one grid this increment is allowed to change.
const BASELINE_26 = {
  MAP: 'f9078c4716256a2b879a905a5aa8bb0bc90ce9a80b8704ba8cb12980d9bc93f6',
  MAP2: 'f7c253c495451b51adab13a9a884064f0aab96298376749010d6e506043de46d',
  MAP3: '14cb9111d171454cba60c986e8bd06974ab3023652ce036017bb0c4f13abca17',
  MAP4: '4e64a4a814b1fb4c4729a651fd6b34e6dc96e03950fd322339054407a2b4dca9',
  MAP5: '230b3da3362be36d5f026d684809879ab96aabcc1ce19c16fed064773d63ec19',
  MAP_N1: '871d5dacd91e1421557554d830e8d64108a5d1d920165ff1bc2094cca090e770',
  MAP_N2: '39f4bcce6707c439384674c021ef18acf552221ef9e1c57f7435413aeaaeb963',
  RODDON_WAY_MAP: '835e3050e45a3bcd74454fc411f006ea0556b08c9fea6d7e31795a4908eba2bc',
  MAP3_N1: '0a0c5f3751b0b4a50653a3af58e992781a1b6ffdadfc37e7d61a8bc38b9b3290',
  MAP3_N2: '06664d7a4ef0485e2a605a71932fd15364029fa59def6cb75acf206288568039',
  DRENWICK_EAST_CANAL_MAP: '2e74d8cd14fa6e022cba316f1d18d4409a2d5b886ed6c5e2df9392933f5ecad6',
  THORNMERE_NORTH_FEN_MAP: '0f1fc88a9c3ddfffb6116e59bd4420e332eb84f9b0133062eb2f4c3bc5d3862c',
  THORNMERE_CANAL_HEAD_MAP: '924d982ac990944db3808a749533fd1ce2fd713ca3899ed1d77252ec14151cf0',
  THORNMERE_UPPER_SHALLOWS_MAP: 'fe6eaa3e73a470e8a1cf4a959d285dd26a34214f814373d0518cd4bc156fb7d5',
  NORTH_BASIN_S_MAP: '41d3b38d9932ad5ed3fea54ed787aece91375e88e7cc7c4e0a69cb9bed36b240',
  NORTH_BASIN_SE_MAP: '96ac86bdc402728eab845a9cd6250609787d4ed0994affe294fce8f3d578a2b3',
  EAST_CAUSEWAY_MAP: '4ce6d248fbf6fa13b02fccd81785d0a44923ac6c9a0f9c37b4e9d0df851e1f16',
  NORTH_BASIN_C_MAP: '562b1d6e9b79fcc2a2b1b3092538094ec31ff280733acc326ec8c2f90b257668',
  NORTH_BASIN_SW_MAP: 'e7e1f2217d674e6219c82764ce283be3fca272a7996a48a63a10aaa2b428d251',
  NORTH_BASIN_W_MAP: 'df88364722dc6e4cd77a3c95182165c3ecff777d9c37e290b4810c6d2da3a1f3',
  NORTH_BASIN_NW_MAP: 'cb2c59ab15d4b87c2ce758025b2f6bfd85fe8abae5c34cc1438131c8605edfe8',
  NORTH_BASIN_N_MAP: 'e59e5fa33fbc7e6388e707d1ef4a96282c446c6aead0f2cc24e935426e960bc7',
  NORTH_BASIN_NE_MAP: '97af356c23d758f6d396afb57e1fd152c4b0701dd6f66839248cf7350b6d0954',
  NORTH_BASIN_NE2_MAP: '3e6f5754052438f40b9f560db8d6321e9e0ab72aeaf94f2b7874cff149021417',
  NORTH_BASIN_E2_MAP: '74353043788878bfd753cc5e3382a6e758e7e652ce3452e222a196d3279c96ff',
  NORTH_BASIN_E_MAP: '8241adef3dc0fd37a2b85cc02d50ec8fa0446bded9ca5fc9bdfd4314f6390f9c',
};

module.exports = {
  name: 'West Outfall: contiguous hills and a deterministic boat-scale canal tunnel',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (expr) => JSON.parse(g.run(expr));
    const map = J(`JSON.stringify(REGIONAL_CHUNK_CATALOG['${ID}'].map)`);
    const HILLS = g.run('HILLS'), WATER = g.run('WATER'), TREE = g.run('TREE');

    // 1-3. Stable tile allocation, collision/encounter contract, full registration,
    // and deterministic coordinate-derived rendering with zero random consumption.
    assert.equal(HILLS, 119, 'HILLS receives the next safe stable tile id');
    assert.equal(g.run('WALKABLE[HILLS]'), false);
    assert.equal(g.run('isTileWalkable(HILLS)'), false);
    assert.equal(g.run('isTileEncounterEligible(HILLS)'), false);
    assert.equal(g.run('isTransitionTile(HILLS)'), false);
    assert.equal(g.run('TILE_PROPERTIES[HILLS].isTransition'), undefined);
    assert.equal(g.run('TILE_PROPERTIES[HILLS].debugName'), 'HILLS');
    assert.equal(g.run('DEBUG_TILE_NAMES.includes("HILLS")'), true);
    assert.equal(g.run('RENDERABLE_TILE_IDS.has(HILLS)'), true);
    assert.equal(g.run('DEBUG_TILE_NAMES.length'), g.run('new Set(DEBUG_TILE_NAMES.map(function(n){return window[n];})).size'), 'all exported tile ids remain unique');
    const oldIds = g.run("JSON.stringify(DEBUG_TILE_NAMES.filter(function(n){return n!=='HILLS'&&n!=='TREE_IN_WATER'&&n!=='ROCKS_IN_WATER'&&n!=='LIGHTHOUSE';}).map(function(n){return [n,window[n]];}).sort(function(a,b){return a[0].localeCompare(b[0]);}))");
    assert.equal(sha256(oldIds), OLD_TILE_ID_HASH, 'every pre-HILLS tile constant retains its reviewed numeric id');
    const hillRender = J(`(function(){
      var oldFill=ctx.fillRect, oldRandom=Math.random, randomCalls=0;
      function once(){var calls=[];ctx.fillRect=function(x,y,w,h){calls.push([ctx.fillStyle,x,y,w,h]);};drawTile(HILLS,7*TILE,9*TILE);return calls;}
      Math.random=function(){randomCalls++;return 0.25;};
      var a=once(),b=once();ctx.fillRect=oldFill;Math.random=oldRandom;
      return JSON.stringify({a:a,b:b,randomCalls:randomCalls});
    })()`);
    assert.deepEqual(hillRender.a, hillRender.b, 'same world tile coordinates produce byte-identical draw commands');
    assert.equal(hillRender.randomCalls, 0, 'HILLS rendering consumes no randomness');
    assert.ok(hillRender.a.length >= 10, 'HILLS has layered rock, shadow, and vegetation detail');

    // 4-9. Exactly the outfall grid changed: 15 reviewed cells become one
    // four-directionally connected interior ridge, while all borders/canal matches stay exact.
    assert.equal(sha256(JSON.stringify(map)), FP);
    assert.equal(GRID_FP.fingerprints[ID], FP);
    assert.equal(Object.keys(BASELINE_26).length, 26);
    for (const [id, fp] of Object.entries(BASELINE_26)) {
      assert.equal(sha256(g.run(`JSON.stringify(REGIONAL_CHUNK_CATALOG[${JSON.stringify(id)}].map)`)), fp, `${id}: baseline fingerprint unchanged`);
      assert.equal(GRID_FP.fingerprints[id], fp, `${id}: fixture unchanged`);
    }
    const oldValues = new Map([
      ['2,2',0],['2,3',3],['3,1',0],['3,2',88],['3,3',0],['3,4',0],
      ['4,2',0],['4,3',0],['4,4',3],['5,3',1],['6,2',0],['6,3',0],
      ['6,4',23],['7,2',0],['7,3',88],
    ]);
    const hills = [];
    for (let r=0;r<15;r++) for (let c=0;c<16;c++) if (map[r][c]===HILLS) hills.push([r,c]);
    assert.equal(hills.length, 15, '15 HILLS cells, within the requested 8-16 range');
    assert.deepEqual(hills.map(([r,c])=>`${r},${c}`).sort(), [...oldValues.keys()].sort(), 'only the approved interior ridge cells use HILLS');
    const reconstructed = map.map((row)=>row.slice());
    for (const [key,val] of oldValues) { const [r,c]=key.split(',').map(Number); reconstructed[r][c]=val; }
    assert.equal(sha256(JSON.stringify(reconstructed)), OLD_FP, 'restoring exactly the 15 cells recreates the former outfall fingerprint');
    const hillSet = new Set(hills.map(([r,c])=>`${r},${c}`)), seen = new Set(), queue = [hills[0]];
    while (queue.length) { const [r,c]=queue.shift(), k=`${r},${c}`; if(seen.has(k))continue; seen.add(k); for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]])if(hillSet.has(`${r+dr},${c+dc}`))queue.push([r+dr,c+dc]); }
    assert.equal(seen.size, hills.length, 'all HILLS cells form one contiguous ridge');
    assert.ok(hills.every(([r,c])=>r>0&&r<14&&c>0&&c<15), 'ridge changes are interior only');
    assert.ok(hills.filter(([r])=>r===3||r===4||r===6).length >= 10, 'portal shoulders are multiple tiles thick');
    assert.deepEqual(map[0], Array(16).fill(TREE), 'north border byte-identical TREE x16');
    assert.deepEqual(map[14], Array(16).fill(TREE), 'south border byte-identical TREE x16');
    assert.deepEqual(map.map(r=>r[0]), Array(15).fill(TREE), 'west border byte-identical TREE x15');
    const eastWaterRows = new Set([2, 4, 5, 6, 9, 11]); // canal at row 5 + irregular bank pockets
    assert.deepEqual(map.map(r=>r[15]), Array.from({length:15},(_,r)=>eastWaterRows.has(r)?WATER:TREE), 'east border: irregular non-walkable canal bank (WATER rows 2,4,5,6,9,11; TREE elsewhere)');
    assert.ok(map.map(r=>r[15]).every((t)=>t===WATER||t===TREE), 'east bank is only WATER/TREE (no HILLS, no walkable)');
    const eastNeighbour = J("JSON.stringify(REGIONAL_CHUNK_CATALOG.MAP3_N2.map.map(function(r){return r[0];}))");
    assert.deepEqual(map.map(r=>r[15]), eastNeighbour, 'east-edge canal still matches MAP3_N2 exactly');
    for(let c=4;c<16;c++) assert.equal(map[5][c], WATER, `surface canal uninterrupted at row5 col${c}`);
    for(let c=0;c<4;c++) assert.notEqual(map[5][c], WATER, `no surface water west of the hill face at row5 col${c}`);

    // 10-12. One registry entry serves active and neighbour paths. The body is
    // world-locked, approximately three rows tall, broad/recessed, and read-only.
    assert.equal(g.run(`Object.keys(OUTDOOR_MAP_DECOR).filter(function(k){return k==='${ID}';}).length`), 1);
    assert.equal(g.run('typeof drawWestOutfallCanalTunnelBody'), 'function');
    assert.equal(g.run('typeof drawWestOutfallCulvertBody'), 'undefined', 'former production symbol removed');
    const drawCounts = J(`(function(){
      var calls=0, original=drawWestOutfallCanalTunnelBody, savedMap=activeMap;
      drawWestOutfallCanalTunnelBody=function(){calls++;return original();};
      activeMap=mapRefForId('${ID}'); drawActiveMapContent(); var activeCalls=calls;
      calls=0; drawNeighbourOutdoorContent(outdoorChunkContentContext('${ID}',false)); var neighbourCalls=calls;
      activeMap=savedMap;drawWestOutfallCanalTunnelBody=original;
      return JSON.stringify({active:activeCalls,neighbour:neighbourCalls});
    })()`);
    assert.deepEqual(drawCounts, {active:1,neighbour:1}, 'active and neighbour dispatch each draw exactly one portal');
    const portal = J(`(function(){
      var oldFill=ctx.fillRect,calls=[];ctx.fillRect=function(x,y,w,h){calls.push([ctx.fillStyle,x,y,w,h]);};
      var before=JSON.stringify({map:mapIdForRef(activeMap),canon:regionalWorldPosition(),x:player.x,y:player.y,f:player.facing,tick:tick,flags:[inTown,inDungeon,inSluice],items:stats.items,npcs:SIMPLE_NPCS.map(function(n){return[n.id,n.x,n.y];})});
      drawWestOutfallCanalTunnelBody();
      var after=JSON.stringify({map:mapIdForRef(activeMap),canon:regionalWorldPosition(),x:player.x,y:player.y,f:player.facing,tick:tick,flags:[inTown,inDungeon,inSluice],items:stats.items,npcs:SIMPLE_NPCS.map(function(n){return[n.id,n.x,n.y];})});
      ctx.fillRect=oldFill;return JSON.stringify({calls:calls,unchanged:before===after});
    })()`);
    const minX=Math.min(...portal.calls.map(c=>c[1])), maxX=Math.max(...portal.calls.map(c=>c[1]+c[3]));
    const minY=Math.min(...portal.calls.map(c=>c[2])), maxY=Math.max(...portal.calls.map(c=>c[2]+c[4]));
    const dark=portal.calls.filter(c=>c[0]==='#100f0e');
    assert.ok(maxY-minY>=88 && maxY-minY<=96, 'facade spans approximately rows 4-6');
    assert.ok(maxX-minX>=40 && maxX-minX<=55, 'facade is substantial without hiding unrelated scenery');
    assert.ok(dark.some(c=>c[3]>=29&&c[4]>=49), 'broad recessed opening has boat-scale clearance');
    assert.ok(portal.calls.some(c=>c[0]==='#2e4860'||c[0]==='#324f68'), 'shared water palette continues beneath the arch');
    assert.equal(portal.unchanged, true, 'portal rendering mutates no gameplay or water state');
    g.run("placeAtLocation('MAP3_N2',0.5*TILE,5.5*TILE);forceLegacyRegionalView=false;");
    const neighbourFrame = J(`(function(){var n=0,trans=[],o=drawWestOutfallCanalTunnelBody,t=ctx.translate;drawWestOutfallCanalTunnelBody=function(){n++;return o();};ctx.translate=function(x,y){trans.push([x,y]);return t.apply(ctx,arguments);};render();drawWestOutfallCanalTunnelBody=o;ctx.translate=t;return JSON.stringify({n:n,trans:trans});})()`);
    assert.equal(neighbourFrame.n, 1, 'full neighbour frame draws one portal');
    assert.ok(neighbourFrame.trans.some(([x,y])=>x===16*32&&y===3*15*32), 'portal chunk translated to stable regional world origin');

    // 13-16. No gameplay authority changed; all shared placement/load paths keep
    // rejecting the scenery chunk atomically and SAVE_VERSION stays 4.
    assert.equal(g.run(`typeof EDGE_TRANSITIONS['${ID}']`), 'undefined');
    assert.equal(g.run(`typeof MAP_FEATURES['drenwick_west_outfall']`), 'undefined');
    assert.equal(g.run(`mapEntryForId('${ID}').items.length`), 0);
    assert.equal(g.run(`mapEntryForId('${ID}').allowRandomEncounters`), false);
    assert.equal(g.run(`mapEntryForId('${ID}').allowSave`), false);
    assert.equal(g.run(`mapPlayerAccessible('${ID}')`), false);
    assert.equal(g.run(`REGIONAL_CHUNK_CATALOG['${ID}'].playerAccessible`), false);
    assert.equal(g.run(`SIMPLE_NPCS.filter(function(n){return n.map==='drenwick_west_outfall'||n.physicalMapId==='${ID}';}).length`), 0);
    assert.equal(g.run(`continuousSeamEntries().filter(function(e){return e.from==='${ID}'||e.to==='${ID}';}).length`), 0);
    assert.equal(g.run(`debugDestinationById('outdoor:${ID}').disabledReason`), 'Scenery-only; no player access');
    g.run("placeAtLocation('MAP3_N2',0.5*TILE,5.5*TILE);forceLegacyRegionalView=false;");
    assert.equal(g.run(`nearbySimulationMapSet().has('${ID}')`), false, 'scenery chunk excluded from regional NPC simulation');
    assert.equal(g.run(`crossSeamNeighbourFor('MAP3_N2',${1*16*32+15*32+16},${3*15*32+5*32+16})`), null, 'cross-seam content authorization cannot enter the blocked outfall');
    assert.equal(g.run(`typeof window['${ID}']`), 'undefined');
    g.run("placeAtLocation('MAP3_N2',8*TILE,7*TILE);player.facing='down';saveGame();");
    const live = g.run("JSON.stringify({map:mapIdForRef(activeMap),canon:regionalWorldPosition(),x:player.x,y:player.y,f:player.facing,loc:[inTown,inDungeon,inSluice]})");
    const stored = g.run("localStorage.getItem('verdantVale_save')");
    const wx=1*16*32+8*32+16, wy=3*15*32+8*32+16;
    assert.equal(g.run(`placeAtLocation('${ID}',8*TILE,8*TILE)`), false);
    assert.equal(g.run(`commitRegionalWorldPosition('overworld',${wx},${wy})`), false);
    assert.equal(g.run(`transitionToLocation({mapId:'${ID}',x:8*TILE,y:8*TILE,facing:'up'})`), false);
    assert.equal(g.run(`debugWarpToDestination('outdoor:${ID}').success`), false);
    assert.equal(g.run("JSON.stringify({map:mapIdForRef(activeMap),canon:regionalWorldPosition(),x:player.x,y:player.y,f:player.facing,loc:[inTown,inDungeon,inSluice]})"), live, 'placement rejections leave live state atomic');
    assert.equal(g.run("localStorage.getItem('verdantVale_save')"), stored, 'placement rejections leave stored save untouched');
    g.run(`(function(){var s=JSON.parse(localStorage.getItem('verdantVale_save'));s.location={kind:'regional',regionId:'overworld',worldPxX:${wx},worldPxY:${wy}};localStorage.setItem('verdantVale_save',JSON.stringify(s));})()`);
    const edited = g.run("localStorage.getItem('verdantVale_save')");
    assert.equal(g.run('loadGame()'), false);
    assert.equal(g.run("JSON.stringify({map:mapIdForRef(activeMap),canon:regionalWorldPosition(),x:player.x,y:player.y,f:player.facing,loc:[inTown,inDungeon,inSluice]})"), live, 'edited-save rejection leaves live state atomic');
    assert.equal(g.run("localStorage.getItem('verdantVale_save')"), edited, 'edited invalid save remains byte-identical');
    assert.equal(g.run('SAVE_VERSION'), 4);

    // 17. Production naming is wholly canal-tunnel terminology for this feature.
    const prod = ['render-entities.js','continuous-content.js','content/maps/drenwick-maps.js']
      .map(f=>fs.readFileSync(path.join(ROOT,f),'utf8')).join('\n');
    assert.equal(/culvert|grate/i.test(prod), false, 'no stale production small-drain terminology');
    assert.equal(/drawWestOutfallCulvertBody/.test(prod), false, 'former symbol removed');
    assert.ok(/drawWestOutfallCanalTunnelBody/.test(prod), 'new portal symbol is production-registered');

    // Aggregate invariants remain unchanged except the test count and tile type.
    const audit = require('../transition-audit.js');
    assert.deepEqual(audit.seamReadiness.totals,{INTENTIONAL_DISCRETE:4,BORDER:22,ALIGNS:48,BLOCKED:46});
    assert.equal(audit.seamReadiness.edges.length,120);
    assert.equal(g.run('Object.keys(MAP_METADATA).length'),120);
    assert.equal(g.run('Object.keys(REGIONAL_CHUNK_CATALOG).length'),30);
    assert.equal(Object.keys(GRID_FP.fingerprints).length,30);
  },
};
