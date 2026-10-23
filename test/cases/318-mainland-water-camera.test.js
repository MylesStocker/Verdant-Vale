'use strict';
const assert=require('assert/strict');const {createContext}=require('../harness');const {J,held}=require('./317-mainland-navigation.test');
module.exports={name:'Mainland water and presentation: river-to-lake continuity, impassable open Valmere, encounter ownership, Zolom warning approaches and zero camera void',
 run(){const g=createContext(),d=J(g,'({chunks:_REGIONAL_CHUNK_DEFINITIONS,tiles:TILE_PROPERTIES})'),byCoord=new Map(d.chunks.map(c=>[c.chunkX+','+c.chunkY,c]));
  const tile=(x,y)=>{const c=byCoord.get(Math.floor(x/16)+','+Math.floor(y/15));return c?.map[y-Math.floor(y/15)*15][x-Math.floor(x/16)*16];};
  const water=t=>t===1||t===58||d.tiles[t]?.isWater;
  const q=[[22*16,-8*15]],seen=new Set([q[0].join(',')]);for(let n=0;n<q.length;n++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=q[n][0]+dx,y=q[n][1]+dy,k=x+','+y;if(!seen.has(k)&&water(tile(x,y))){seen.add(k);q.push([x,y]);}}
  for(const [x,y]of [[28,12],[27,10],[25,8],[25,6],[23,4],[22,2],[22,0],[20,8.5],[28,6]]){let connected=false;for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++)if(seen.has((Math.floor(x*16)+dx)+','+(Math.floor(y*15)+dy)))connected=true;assert.ok(connected,'continuous drainage to lake near '+x+','+y);}
  for(const c of d.chunks)if(c.chunkX>=12&&c.chunkY<=-8){assert.ok(c.map.flat().every(t=>t===1),'no opposite shore in open lake '+c.mapId);assert.equal(c.playerAccessible,false);assert.equal(c.allowRandomEncounters,false);}
  for(const c of d.chunks.filter(c=>c.mapId.startsWith('MAINLAND_')&&c.playerAccessible!==false)){assert.equal(c.encounterProfileId,'eastern_fens_mornay_hard');assert.equal(c.allowRandomEncounters,true);assert.equal(c.allowSave,true);}
  g.press('Enter');g.press('Enter');g.run('debugMode=true');
  for(const legacy of [false,true])for(const col of [7,8]){g.run(`forceLegacyRegionalView=${legacy};`);const source=col===7?'EASTERN_FENS_REEDBELT_N_MAP':'EASTERN_FENS_REEDBELT_E_MAP',gate='EASTERN_FENS_ENVELOPE_C'+col+'R0_MAP';
   assert.equal(g.run(`transitionToLocation({mapId:'${source}',x:${(col+.5)*32},y:144,facing:'up'})`),true);g.run('dialogue.open=false');assert.equal(g.run('isEncounterEligibleTile(tileAt(player.x,player.y))'),false,'safe warning/retreat ground before entry');
   held(g,'ArrowUp',()=>g.run('mapIdForRef(activeMap)')===gate);assert.equal(g.run('currentEncounterPool()===FEN_ZOLOM_ENEMY_TEMPLATES'),true);held(g,'ArrowDown',()=>g.run('mapIdForRef(activeMap)')===source);
  }
  const voids=J(g,`(()=>{let checked=0;const errors=[];
   for(const c of _REGIONAL_CHUNK_DEFINITIONS){if(c.playerAccessible===false||c.presentation==='legacy_screen')continue;
    for(let r=0;r<15;r++)for(let x=0;x<16;x++){if(!WALKABLE[c.map[r][x]])continue;
     // Cover the centre and conservative movement extrema, so an intermediate
     // player position cannot expose a gap hidden by centre-only sampling.
     for(const [dx,dy]of [[.5,.5],[0,0],[1,0],[0,1],[1,1]]){checked++;
     const p=buildContinuousWorldPlanFromWorld('overworld',(c.chunkX*16+x+dx)*32,(c.chunkY*15+r+dy)*32,512,480);let area=0;
     for(const v of p.visibleChunks){const l=Math.max(p.camPxX,v.worldPxX),t=Math.max(p.camPxY,v.worldPxY),rr=Math.min(p.camPxX+512,v.worldPxX+512),b=Math.min(p.camPxY+480,v.worldPxY+480);area+=Math.max(0,rr-l)*Math.max(0,b-t);}
     if(area!==512*480&&errors.length<10)errors.push([c.mapId,x,r,dx,dy,area]);
     }
    }
   }return {checked,errors};})()`);
  assert.deepEqual(voids.errors,[],'all accessible centre/extrema camera viewports are fully authored');assert.ok(voids.checked>400000,'whole-world camera coverage, including earlier routes');
 }
};
