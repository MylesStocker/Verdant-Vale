'use strict';
const assert=require('assert/strict');
const {createContext}=require('../harness');
const J=(g,e)=>JSON.parse(g.run('JSON.stringify('+e+')'));
function paint(g,page){
 g.run('dialogue.page='+page+';var wordPaint=[];ctx.fillText=function(text,x,y){wordPaint.push({text:String(text),x,y,color:ctx.fillStyle})};drawDialogue()');
 return J(g,'wordPaint');
}
const body=rows=>rows.filter(row=>row.y>=410&&row.y<=454);
module.exports={
 name:'Esla styling: green speech only, neutral narration/chrome, wrapped continuation and read-only paint',
 run(){
  const g=createContext();
  g.run('ctx.measureText=function(text){return {width:String(text).length*7}}');
  g.run('openDialogue("",[[]]);setSpeakerDialoguePages([{speakerId:"esla",lines:["“Yes.” She sets down her pen. “Go on.”"]}]);tick=32');
  let rows=paint(g,0),runs=body(rows);
  assert.deepEqual(runs.map(r=>[r.text,r.color]),[['“Yes.”','#a8e89c'],[' She sets down her pen. ','#ccd8cc'],['“Go on.”','#a8e89c']]);
  assert.equal(rows.find(r=>r.text==='Esla').color,'#8ac8d8');
  assert.equal(rows.find(r=>r.text==='[ close ]').color,'#8ac8d8');
  g.run('ctx.font=DIALOGUE_TEXT_STYLES.esla_light_green.bodyFont');
  for(let i=1;i<runs.length;i++)assert.equal(runs[i].x,g.run('22+ctx.measureText('+JSON.stringify(runs.slice(0,i).map(r=>r.text).join(''))+').width'));
  // A long open quotation spans wraps, authored hard lines, and height pages.
  // Its final closing quote precedes narration on a later visual page.
  const line='“'+Array(120).fill('forward').join(' ');
  const pages=[{speakerId:'esla',lines:[line,'the road stays dry.” She folds the map.']},
   {speakerId:'esla',lines:['Plain unquoted speech.']},{speakerId:null,lines:['“Narration page quoting somebody.”']},
   {speakerId:'sera',lines:['“Other style.” Narration in Sera’s existing style.']}];
  g.run('openDialogue("",[[]]);setSpeakerDialoguePages('+JSON.stringify(pages)+');tick=32');
  paint(g,0);
  const count=g.run('dialogue.pages.length');assert.ok(count>5);
  let foundContinuation=false,foundNarration=false;
  for(let i=0;i<count;i++){
   rows=paint(g,i);runs=body(rows);const speaker=g.run('dialoguePagePresentation().speakerId');
   if(speaker==='esla'){
    for(const run of runs){
     if(run.text.includes('She folds the map.')){assert.equal(run.color,'#ccd8cc');foundNarration=true;}
     else assert.equal(run.color,'#a8e89c',run.text);
    }
    if(i>0&&runs.some(r=>r.text.startsWith('forward')))foundContinuation=true;
   }
   if(speaker===null)assert.ok(runs.every(r=>r.color==='#ccd8cc'),'null speaker never infers Esla from quotes');
   if(speaker==='sera')assert.ok(runs.every(r=>r.color==='#40243f'),'other authored style unchanged');
  }
  assert.ok(foundContinuation);assert.ok(foundNarration);
  // Quotation context can also cross adjacent Esla authored pages.
  g.run('openDialogue("",[[]]);setSpeakerDialoguePages([{speakerId:"esla",lines:["“Not finished"]},{speakerId:"esla",lines:["yet.” She nods."]}]);tick=32');
  paint(g,0);runs=body(paint(g,1));
  assert.deepEqual(runs.map(r=>[r.text,r.color]),[['yet.”','#a8e89c'],[' She nods.','#ccd8cc']]);
  const before=g.run('JSON.stringify({dialogue,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),day,player,party:persistentParty.serialize()})');
  paint(g,1);paint(g,0);paint(g,1);
  assert.equal(g.run('JSON.stringify({dialogue,flags:QUEST_FLAG_BINDINGS.map(b=>b.get()),day,player,party:persistentParty.serialize()})'),before,'repeated rendering does not alter dialogue or gameplay state');
  // The helper derives paint data without changing frozen authored inputs.
  const authored=Object.freeze(['“Hello.” She nods.']);
  const beforeHelper=JSON.stringify(authored);
  g.run('eslaDialogueVisualRuns('+JSON.stringify(authored)+',[['+JSON.stringify(authored[0])+']])');
  assert.equal(JSON.stringify(authored),beforeHelper);
 }
};
