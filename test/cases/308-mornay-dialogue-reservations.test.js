'use strict';
const assert=require('assert/strict');
const fs=require('fs');
const path=require('path');
const {scriptOrderFromIndexHtml}=require('../harness');
const {J,fresh,place,reachable,talk,dismiss}=require('./301-mornay-manifest.test');
function persistent(g){return g.run('JSON.stringify({party:persistentParty.getView(),day,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),MainQuest})');}
module.exports={
 name:'Mornay dialogue: inert Reclaimer evidence, no public member disclosure or reserved access; companion membership and paginated green speaker ownership',
 run(){
  const g=fresh();g.run('MainQuest=5;');const residents=J(g,'MORNAY_RESIDENTS');
  for(const r of residents.filter(r=>r.network||['mornay_marit_voss','mornay_edrin_saye','mornay_jessa_nair'].includes(r.id))){
   place(g,r.mapId);const before=persistent(g);talk(g,r.id);
   assert.doesNotMatch(J(g,'dialogue.pages').flat().join(' '),/confirmed member|I (?:am|joined|belong to) (?:the )?Reclaimers|our headquarters|join (?:us|the Reclaimers)/i);
   dismiss(g);if(g.run('shop.open'))g.press('Escape');assert.equal(persistent(g),before,r.id+' dialogue is repeatable and inert');talk(g,r.id);dismiss(g);if(g.run('shop.open'))g.press('Escape');assert.equal(persistent(g),before);
  }
  assert.equal(residents.filter(r=>['mornay_marit_voss','mornay_edrin_saye','mornay_jessa_nair'].includes(r.id)).length,3);
  for(const notice of J(g,'MORNAY_NOTICES')){
   place(g,notice.mapId);const points=reachable(g);
   const p=points.find(([x,y])=>Math.hypot(x-notice.x*32,y-notice.y*32)<notice.radius&&!g.run(`SIMPLE_NPCS.some(n=>n.map===currentContentLocationKey()&&Math.hypot(n.x-${x},n.y-${y})<TALK_RADIUS)`));
   assert.ok(p,notice.id+' reachable without another interaction shadowing it');place(g,notice.mapId,...p);
   const before=persistent(g),location=J(g,'[mapIdForRef(activeMap),snapshotLocationState()]');g.press(' ');assert.equal(g.run('dialogue.open'),true,notice.id);assert.deepEqual(J(g,'dialogue.pages'),notice.pages,notice.id+' authored notice content');dismiss(g);
   assert.equal(persistent(g),before);assert.deepEqual(J(g,'[mapIdForRef(activeMap),snapshotLocationState()]'),location,notice.id+' grants no access');
   assert.ok(!Object.hasOwn(notice,'onInteract'));assert.ok(!Object.hasOwn(notice,'flag_sets'));
  }
  const keys=J(g,'Object.keys(MORNAY_COMPANION_EXCHANGES)');assert.equal(keys.length,5);
  for(const recruited of [false,true]){
   if(recruited)g.run('persistentParty.joinEsla();');
   // Explicit Courier New model: harness fixed width is not pagination evidence.
   g.run('ctx.measureText=text=>({width:Array.from(text).length*8.4});');
   for(const id of keys){
    const r=residents.find(r=>r.id===id);place(g,r.mapId);talk(g,id);g.run('drawDialogue();');
    const pages=J(g,'dialogue.pages'),speakers=J(g,'dialogue.pageSpeakers');assert.equal(pages.length,speakers.length);
    assert.ok(pages.every(p=>p.length<=3));assert.ok(pages.flat().every(s=>s.length*8.4<=464));
    assert.equal(speakers.includes('esla'),recruited);
    let sawGreen=false;
    while(g.run('dialogue.open')){
     const presentation=J(g,'dialoguePagePresentation()');
     if(presentation.speakerId==='esla'){assert.equal(presentation.name,'Esla');assert.equal(presentation.styleId,'esla_light_green');assert.equal(g.run('dialogueTextStyle(dialoguePagePresentation().styleId).bodyColor'),'#a8e89c');sawGreen=true;}
     else{assert.equal(presentation.speakerId,id);assert.equal(presentation.styleId,null);}
     g.press(' ');
    }
    assert.equal(sawGreen,recruited);
   }
  }
  for(const file of scriptOrderFromIndexHtml())assert.doesNotMatch(fs.readFileSync(path.join(__dirname,'../..',file),'utf8'),/Returners/i,file+' canonical runtime term');
 }
};
