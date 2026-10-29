'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const {graph,J}=require('./317-mainland-navigation.test');
const id='EASTERN_FENS_MORNAY_TOWN_APPROACH_MAP';
module.exports={name:'Mornay shifted marker: water prevents lateral entry, both southern gates remain usable',run(){
  const g=createContext(),d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,edges:EDGE_TRANSITIONS,tiles:TILE_PROPERTIES})');
  const c=d.chunks.find(c=>c.mapId===id),m=c.map;
  assert.deepEqual(m.slice(0,3).map(r=>r.slice(7,9)),[[132,131],[133,131],[14,14]]);
  assert.deepEqual([m[2][6],m[2][9]],[1,1],'water closes both lateral gate approaches');
  for(let y=3;y<15;y++)assert.deepEqual(m[y].flatMap((t,x)=>t===2?[x]:[]),[7,8],'southern road stays exactly two tiles wide');
  const net=graph(d),seen=net.flood(id,7,4);
  for(let y=0;y<15;y++)for(let x=0;x<16;x++)if(d.tiles[m[y][x]].walkable)
    assert.ok(seen[net.key(id,x,y)],'no stranded walkable shore at '+x+','+y);
  for(const legacy of [false,true]) {
    for(const [x,key]of [[176,'ArrowRight'],[336,'ArrowLeft']]) {
      const v=createContext();v.press('Enter');v.press('Enter');
      v.run(`forceLegacyRegionalView=${legacy};transitionToLocation({mapId:'${id}',x:${x},y:80});dialogue.open=false;`);
      v.hold(key);v.frames(90);v.release(key);
      assert.equal(v.run('inTown'),false,'sideways input cannot enter either gate');
      assert.equal(v.run('mapIdForRef(activeMap)'),id);
      assert.ok(v.run('player.x')<192||v.run('player.x')>320,'water stops movement outside the gate strip');
    }
    for(const [x,gate]of [[240,'WEST'],[272,'EAST']]) {
      const v=createContext();v.press('Enter');v.press('Enter');
      v.run(`forceLegacyRegionalView=${legacy};transitionToLocation({mapId:'${id}',x:${x},y:144,facing:'up'});dialogue.open=false;`);
      v.hold('ArrowUp');for(let i=0;i<90&&!v.run('inTown');i++)v.frames();v.release('ArrowUp');
      assert.equal(v.run('mapIdForRef(activeMap)'),'MORNAY_'+gate+'_GATE_MAP');
      assert.equal(v.run('saveGame()&&loadGame()'),true);v.run('dialogue.open=false');
      v.hold('ArrowDown');for(let i=0;i<90&&v.run('inTown');i++)v.frames();v.release('ArrowDown');
      assert.deepEqual(J(v,'[mapIdForRef(activeMap),player.x,player.y,player.facing]'),[id,x,144,'down']);
      v.frames(15);assert.equal(v.run('inTown'),false);
    }
  }
}};
