'use strict';

// Navigation only. Persistent character records, inventory and equipment never
// live here; every read/mutation goes through persistentParty.
const partyFieldMenu = (() => {
  let selectedId='lely', pendingItem=null, targetId=null, equipmentCursor=0, equipmentScroll=0;
  const memberScreens=['partyTarget','partyEquipment','partyStatus'];
  const equipmentItems=()=>groupItems().filter(g=>['weapon','armor','shield','accessory'].includes(g.item.type));
  const rowCount=()=>groupItems().length+4;
  const clampMain=()=>{
    menu.itemCursor=Math.max(0,Math.min(menu.itemCursor,rowCount()-1));
    menu.scrollOffset=Math.max(0,Math.min(menu.scrollOffset,Math.max(0,rowCount()-4)));
    if(menu.itemCursor<menu.scrollOffset)menu.scrollOffset=menu.itemCursor;
    if(menu.itemCursor>=menu.scrollOffset+4)menu.scrollOffset=menu.itemCursor-3;
  };
  const reset=()=>{selectedId='lely';pendingItem=null;targetId=null;equipmentCursor=0;equipmentScroll=0;};
  const targets=()=>pendingItem ? persistentParty.fieldItemTargets(pendingItem) : [];
  const selected=members=>members.find(m=>m.characterId===selectedId)||members.find(m=>m.characterId==='lely')||members[0];
  const reconcile=members=>{selectedId=selected(members).characterId;};
  const moveId=(current,members,delta,valid=members.map(m=>m.characterId))=>{
    const ids=members.filter(m=>valid.includes(m.characterId)).map(m=>m.characterId);
    if(!ids.length)return current;
    const at=ids.indexOf(current);
    return ids[((at<0?0:at)+delta+ids.length)%ids.length];
  };
  const getView=()=>{
    const party=persistentParty.getFieldView(),current=selected(party.members),gear=equipmentItems();
    const option=gear[equipmentCursor];
    return Object.freeze({...party,screen:menu.screen,selectedId:current.characterId,pendingItem,selectedTargetId:targetId,
      validTargets:Object.freeze(menu.screen==='partyTarget'?targets():[]),
      equipmentCursor,equipmentScroll,
      equipmentItems:Object.freeze(gear.map(g=>Object.freeze({id:g.name,count:g.count}))),
      preview:menu.screen==='partyEquipment'&&option?persistentParty.previewEquipment(current.characterId,option.name):null});
  };
  const handleInput=e=>{
    const party=persistentParty.getView();
    if(!menu.open||party.members.length<2)return false;
    // Reuse the outer physical-key latch; native repeats also fail closed.
    if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return true;
    if(dialogue.open||choice.open||shop.open||seraLioraCutscene.active||combat.active||
        combatPlayerState.hasParty()||persistentParty.isCombatPending()||fishing.active||
        galleryReceiverEncounter.isLocked()||continentMap.open||accordPanel.open)return true;
    if(!['main',...memberScreens].includes(menu.screen))return false; // original save/notebook handlers
    reconcile(party.members);
    const key=e.key,confirm=key==='Enter'||key===' ',cancel=['Escape','b','B','m','M'].includes(key);
    const up=key==='ArrowUp'||key==='w',down=key==='ArrowDown'||key==='s';
    const left=key==='ArrowLeft'||key==='a',right=key==='ArrowRight'||key==='d';
    if(confirm||cancel||up||down||left||right)e.preventDefault();
    if(menu.screen==='main'){
      clampMain();
      if(up||down){menu.itemCursor=Math.max(0,Math.min(rowCount()-1,menu.itemCursor+(down?1:-1)));clampMain();}
      else if(left||right)selectedId=moveId(selectedId,party.members,right?1:-1);
      else if(cancel)toggleMenu();
      else if(key==='n'||key==='N'){e.preventDefault();menu.screen='notebook';menu.notebookOffset=0;menu.notebookCursor=0;}
      else if(confirm){
        const groups=groupItems(),entry=groups[menu.itemCursor],extra=menu.itemCursor-groups.length;
        if(entry){
          const valid=persistentParty.fieldItemTargets(entry.name);
          if(valid.length){pendingItem=entry.name;targetId=valid[0];menu.screen='partyTarget';}
        }else if(extra===0){menu.screen='saveConfirm';menu.saveCursor=0;}
        else if(extra===1){menu.screen='loadConfirm';menu.loadCursor=0;}
        else if(extra===2){menu.screen='partyEquipment';equipmentCursor=0;equipmentScroll=0;}
        else if(extra===3)menu.screen='partyStatus';
      }
    }else if(menu.screen==='partyTarget'){
      if(cancel){menu.screen='main';pendingItem=null;targetId=null;}
      else if(up||down||left||right)targetId=moveId(targetId,party.members,down||right?1:-1,targets());
      else if(confirm && targets().includes(targetId) && groupItems().some(g=>g.name===pendingItem)){
        persistentParty.useFieldItem(targetId,pendingItem);pendingItem=null;targetId=null;menu.screen='main';clampMain();
      }
    }else if(menu.screen==='partyStatus'){
      if(left||right)selectedId=moveId(selectedId,party.members,right?1:-1);
      else if(cancel)menu.screen='main';
    }else if(menu.screen==='partyEquipment'){
      const gear=equipmentItems();
      if(cancel)menu.screen='main';
      else if(up||down){equipmentCursor=Math.max(0,Math.min(gear.length-1,equipmentCursor+(down?1:-1)));}
      else if(confirm&&gear[equipmentCursor])persistentParty.useFieldItem(selectedId,gear[equipmentCursor].name);
      const n=equipmentItems().length;equipmentCursor=Math.max(0,Math.min(equipmentCursor,n-1));
      equipmentScroll=Math.max(0,Math.min(equipmentScroll,Math.max(0,n-4)));
      if(equipmentCursor<equipmentScroll)equipmentScroll=equipmentCursor;
      if(equipmentCursor>=equipmentScroll+4)equipmentScroll=equipmentCursor-3;
    }
    return true;
  };
  return Object.freeze({reset,getView,handleInput});
})();

// Draw only the inside of drawMenu's unchanged frame. Save/load overlays and
// Notebook retain their established renderer. No UI owns mutable member copies.
function drawPartyFieldMenu() {
  const v=partyFieldMenu.getView(),CX=62,W=388;
  if(!menu.open||v.members.length<2)return;
  const text=(s,x,y,color='#d8e4d0',size=13,bold=false)=>{
    ctx.fillStyle=color;ctx.font=(bold?'bold ':'')+size+'px "Courier New", monospace';ctx.fillText(s,x,y);
  };
  const rule=y=>{ctx.fillStyle='#1e3040';ctx.fillRect(CX,y,W,1);};
  const label=(s,y)=>text(s,CX,y,'#5a8898',11,true);
  const status=m=>[...(m.hp===0?['Fallen']:[]),...m.statuses.map(s=>({poison:'Poison',muddied:'Muddied',slither:'Slither',cursed:'Curse',burn:'Burn',dazzled:'Dazzle'})[s]||s)].join(' · ')||'Normal';
  const fit=(value,max)=>{const s=String(value);return s.length>max?s.slice(0,max-1)+'…':s;};
  const row=(m,y,highlight=false,valid=true)=>{
    if(highlight){ctx.fillStyle='#102c38';ctx.fillRect(CX-4,y-18,W+8,48);}
    text(m.name,CX+14,y,valid?'#e0e8e0':'#53646a',15,true);
    if(highlight)text('▶',CX,y,'#8ac8d8',12,true);
    text('Lv. '+m.level,CX+124,y,'#6abcac',12,true);
    text(fit(status(m),26),CX+194,y,m.hp===0?'#d07050':'#c8a840',11);
    text('HP',CX+14,y+20,'#8aacaa',11,true);
    const filled=Math.round(15*m.hp/m.maxHp);
    for(let i=0;i<15;i++){ctx.fillStyle=i>=filled?'#112820':m.hp/m.maxHp<=.25?'#a06820':'#4a9a62';ctx.fillRect(CX+42+i*9,y+11,7,9);}
    text(m.hp+' / '+m.maxHp,CX+192,y+20,'#9ab8aa',12);
  };
  const hint=s=>text(s,CX,452,'#3a6878',10,true);
  const listRow=(s,y,chosen,enabled=true)=>{
    if(chosen)text('▶',CX,y,'#8ac8d8',13,true);
    text(s,CX+16,y,enabled?(chosen?'#e0f0e8':'#d8e4d0'):'#53646a',13,chosen);
  };
  const scroll=(offset,total,y)=>{
    if(offset>0)text('▲',CX+W-12,y,'#4a8898',10);
    if(offset+4<total)text('▼',CX+W-12,y+70,'#4a8898',10);
  };
  const selected=v.members.find(m=>m.characterId===v.selectedId),selectedIndex=v.members.indexOf(selected);
  if(['partyEquipment','partyStatus'].includes(v.screen)){
    label(v.screen==='partyEquipment'?'EQUIPMENT':'STATUS',76);rule(81);row(selected,106);
    const progress=selected.progression;
    text(progress.nextLevelXp===null?'XP '+selected.xp+' MAX':'XP '+selected.xp+' · NEXT '+progress.progress+'/'+progress.required,CX+14,151,'#6a9ab8',11);
    ['atk','def','spd'].forEach((key,i)=>{
      text(key.toUpperCase()+' '+selected.effective[key],CX+i*125,177,'#d8e4d0',13,true);
      if(v.preview&&v.preview.effective[key]!==selected.effective[key])text('→ '+v.preview.effective[key],CX+i*125+60,177,'#78d888',12);
    });
    rule(190);
    Object.entries(selected.equipment).forEach(([slot,id],i)=>{
      text(slot[0].toUpperCase()+slot.slice(1),CX,211+i*22,'#6a9898',12);
      text(fit(id||'[ empty ]',34),CX+94,211+i*22,id?'#d8e4d0':'#2e5252',12);
    });
    if(v.screen==='partyEquipment'){
      rule(293);label('SHARED EQUIPMENT',311);
      const entries=v.equipmentItems.slice(v.equipmentScroll,v.equipmentScroll+4);
      if(!entries.length)text('no equipment',CX,336,'#53646a');
      entries.forEach((g,i)=>listRow(g.id+(g.count>1?' '+g.count:''),336+i*22,v.equipmentScroll+i===v.equipmentCursor));
      scroll(v.equipmentScroll,v.equipmentItems.length,330);
      hint('↑↓ select · ENTER equip · B / ESC back');
    }else{
      rule(301);text('Base ATK '+selected.atk+'  DEF '+selected.def+'  SPD '+selected.spd,CX,324,'#6a9898',12);
      text(fit(status(selected),42),CX,348,selected.hp===0?'#d07050':'#9ab8aa',12);
      hint('←/→ Member · B / ESC back');
    }
    return;
  }
  const targeting=v.screen==='partyTarget';
  if(targeting){
    label('USE '+v.pendingItem,76);rule(81);
    v.members.forEach((m,i)=>row(m,108+i*54,m.characterId===v.selectedTargetId,v.validTargets.includes(m.characterId)));
    text('Select a character.',CX,302,'#8aacaa',13);
    text('In bag: '+v.inventory.filter(id=>id===v.pendingItem).length,CX,328,'#6a9898',12);
    hint('↑↓ select · ENTER confirm · B / ESC back');return;
  }
  text('◀ '+selected.name.toUpperCase()+' '+(selectedIndex+1)+'/'+v.members.length+' ▶',CX,76,'#e0e8e0',15,true);
  text('←/→ Member',CX+292,76,'#3a6878',10,true);rule(84);
  text('Lv. '+selected.level,CX,104,'#6abcac',12,true);text('Status  '+fit(status(selected),33),CX+92,104,selected.hp===0?'#d07050':'#c8a840',11);
  text('HP',CX,128,'#8aacaa',11,true);
  const hpFilled=Math.round(15*selected.hp/selected.maxHp);
  for(let i=0;i<15;i++){ctx.fillStyle=i>=hpFilled?'#112820':selected.hp/selected.maxHp<=.25?'#a06820':'#4a9a62';ctx.fillRect(CX+28+i*9,117,7,9);}
  text(selected.hp+' / '+selected.maxHp,CX+176,128,'#9ab8aa',11);
  text('XP',CX,151,'#5a8898',11,true);
  const prog=selected.progression,progLabel=prog.nextLevelXp===null?'XP '+selected.xp+' · MAX':'XP '+selected.xp+' · NEXT '+prog.progress+'/'+prog.required;
  const xpFraction=prog.nextLevelXp===null?1:Math.min(1,prog.progress/prog.required);
  ctx.fillStyle='#0a1a24';ctx.fillRect(CX+28,140,135,8);ctx.fillStyle=prog.nextLevelXp===null?'#5a8a6a':'#4878a8';ctx.fillRect(CX+28,140,Math.round(135*xpFraction),8);
  text(progLabel,CX+176,151,'#6a9ab8',10);
  ['atk','def','spd'].forEach((key,i)=>text(key.toUpperCase()+' '+selected.effective[key],CX+i*126,176,'#d8e4d0',13,true));
  rule(187);label('EQUIPMENT',202);
  Object.entries(selected.equipment).forEach(([slot,id],i)=>{
    text(slot[0].toUpperCase()+slot.slice(1),CX,221+i*18,'#6a9898',11);
    text(fit(id||'[ empty ]',34),CX+94,221+i*18,id?'#d8e4d0':'#2e5252',11);
  });
  text('● '+v.gold+' g',CX,296,'#c8a830',11,true);text('Day '+day,CX+260,296,'#8a9aac',11);
  rule(304);label('ITEMS',320);
  const groups=groupItems(),extras=['[ Save Game ]','[ Load Game ]','[ Equipment ]','[ Status ]'];
  const entries=[...groups.map(g=>({label:g.name+(g.count>1?' '+g.count:''),enabled:persistentParty.fieldItemTargets(g.name).length>0})),...extras.map(label=>({label,enabled:true}))];
  const offset=Math.min(menu.scrollOffset,Math.max(0,entries.length-4));
  entries.slice(offset,offset+4).forEach((r,i)=>listRow(fit(r.label,42),341+i*21,offset+i===menu.itemCursor,r.enabled));
  scroll(offset,entries.length,335);
  hint('↑↓ select · ENTER confirm · N notebook · ←/→ Member');
  text('[ M / ESC ]',CX+300,468,'#3a6878',10,true);
}
