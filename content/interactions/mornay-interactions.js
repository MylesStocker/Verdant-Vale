'use strict';

// Repeatable public evidence: no callbacks, triggers, flags, rewards or quests.
const MORNAY_NOTICES = Object.freeze([
  Object.freeze({"mapId":"MORNAY_OLD_FORT_MAP","id":"mornay_watch_cells","type":"inspect","allowUnwalkable":true,"x":10.5,"y":2.8,"radius":44,"label":"Old Fort watch and cells","pages":[["WATCH, HOLDING CELLS AND OLD RECORDS."],["The public shutter is closed. A constable answers enquiries in the yard. No entry beyond the chained door."]]}),
  Object.freeze({"mapId":"MORNAY_NORTH_UPPER_EAST_MAP","id":"mornay_collegium","type":"inspect","allowUnwalkable":true,"x":12.5,"y":6.2,"radius":44,"label":"Mornay Civic Collegium","pages":[["CIVIC COLLEGIUM — upper school."],["Preparation for the Civic Examination, commercial clerkships and junior Imperial service. Fees payable in advance. Admittance by appointment."],["The iron gate is locked. A porter watches through it."]]}),
  Object.freeze({"mapId":"MORNAY_MIDDLE_UPPER_EAST_MAP","id":"mornay_survey","type":"inspect","allowUnwalkable":true,"x":12.5,"y":5.8,"radius":44,"label":"Hydrographic survey office","pages":[["HYDROGRAPHIC SURVEY OFFICE. Public counter closed."],["Sounding and water-level enquiries: Harbour Public Room. No passage to the lake through these premises."]]}),
  Object.freeze({"mapId":"MORNAY_NORTH_UPPER_WEST_MAP","id":"mornay_story_berth","type":"inspect","allowUnwalkable":true,"x":4.5,"y":10.5,"radius":44,"label":"Reserved berth","pages":[["An empty berth, swept and numbered. No passenger service is offered here."]]}),
  Object.freeze({"mapId":"MORNAY_NORTH_LOWER_WEST_MAP","id":"mornay_island_berth","type":"inspect","allowUnwalkable":true,"x":4.5,"y":4.5,"radius":44,"label":"Island ferry notice","pages":[["ISLAND FERRY — no public sailings."],["The planking is maintained. There is no boat to board."]]}),
  Object.freeze({"mapId":"MORNAY_EAST_GATE_MAP","id":"mornay_hiring","type":"inspect","allowUnwalkable":true,"x":2.5,"y":5.8,"radius":44,"label":"Labour hiring board","pages":[["Freight hands: report to Berrit Fane at the cart yard. Work depends on clearance."],["No hiring fee is authorized. Someone has underlined that sentence twice."]]}),
  Object.freeze({"mapId":"MORNAY_NORTH_LOWER_WEST_MAP","id":"mornay_collection","type":"inspect","allowUnwalkable":true,"x":12.5,"y":8.2,"radius":44,"label":"Meal collection notice","pages":[["Bowls and linen for households without a wage this week. Ask Dena at the quay or Nessa at the laundry."],["A smaller line: Contributions are voluntary. Names are not required."]]}),
  Object.freeze({"mapId":"MORNAY_MIDDLE_UPPER_CENTRAL_WEST_MAP","id":"mornay_confiscation","type":"inspect","allowUnwalkable":true,"x":2.5,"y":9.2,"radius":44,"label":"Confiscation notice","pages":[["Unlicensed sheets seized pending review. Queries to Customs Assessor Saye."],["A seller has written: My licence number is on every sheet. The reply has been pasted over it."]]}),
  Object.freeze({"mapId":"MORNAY_MIDDLE_LOWER_CENTRAL_EAST_MAP","id":"mornay_handbill","type":"inspect","allowUnwalkable":true,"x":2.5,"y":5.8,"radius":44,"label":"Overwritten handbill","pages":[["An official levy notice covers a printed demand for safe hoists and wages paid in full."],["Only the words \"who profits\" remain visible underneath."]]}),
  Object.freeze({"mapId":"MORNAY_MIDDLE_LOWER_EAST_MAP","id":"mornay_back_stair","type":"inspect","allowUnwalkable":true,"x":12.5,"y":5.8,"radius":44,"label":"Locked back stair","pages":[["The upper shutter is closed. Clean bowls are stacked beside a scraped patch of paint."],["Someone has scratched a meeting time into the frame, then scraped that away too. The stair door is locked."]]}),
  Object.freeze({"mapId":"MORNAY_MIDDLE_LOWER_WEST_MAP","id":"mornay_whitewash","type":"inspect","allowUnwalkable":true,"x":12.5,"y":9.2,"radius":44,"label":"Fresh whitewash","pages":[["Wet whitewash covers a slogan. A few letters show through: \"...our labour...\""],["A watch notice asks for information about unauthorized printers. There is no name beneath it."]]}),
  Object.freeze({"mapId":"MORNAY_MIDDLE_UPPER_CENTRAL_EAST_MAP","id":"mornay_fees","type":"inspect","allowUnwalkable":true,"x":12.5,"y":5.8,"radius":44,"label":"Regional Office fees","pages":[["Public copying and certification fees are posted by the IJC Office. Private handling charges are excluded."],["An appended warning names Reclaimer agitation. It does not explain why the copying fee has risen."]]}),
  Object.freeze({"mapId":"MORNAY_MIDDLE_UPPER_WEST_MAP","id":"mornay_annex","type":"inspect","allowUnwalkable":true,"x":12.5,"y":5.8,"radius":44,"label":"Bonded warehouse annex","pages":[["BONDED STORE — authorized staff only."],["The shutter is secured. Beneath an old tally, several consignments have been relabelled in a different hand. Nothing here authorizes entry."]]}),
]);
const MORNAY_MAP_FEATURES = Object.fromEntries(MORNAY_TOWN_MAP_IDS.map(id =>
  [id,MORNAY_NOTICES.filter(n => n.mapId === id)]));
const MORNAY_INNS = Object.freeze({gate_inn:30,commercial_inn:40});

function interactMornay() {
  if (!inTown || currentTownId !== 'mornay') return false;
  if (interactSimpleNPCs()) return true;
  return tryMapFeatures();
}
function mornayServiceMessage(name, lines) { openDialogue(name,[lines]); }
function mornayRest(service) {
  const fee=MORNAY_INNS[service],building=mornayBuilding('mornay_'+service);
  if (!building || !Number.isSafeInteger(fee)) return false;
  if (stats.gold < fee) {mornayServiceMessage(building.name,['You need '+fee+' gold for the room.']);return false;}
  // Gold participates in the owner's receipt seal. Apply the validated overnight
  // receipt before deducting the checked fee, synchronously in this callback.
  const receipt=persistentParty.prepareOvernightRest();
  persistentParty.applyOvernightRest(receipt);
  stats.gold-=fee;
  mornayServiceMessage(building.name,['The party rests until morning.','Paid '+fee+' gold.']);
  return true;
}
function mornayTreatmentChoices(npc) {
  const members=persistentParty.getView().members;
  choice.title='Infirmary — one gold per HP';
  choice.options=members.map(m=>m.name+' ('+m.hp+'/'+m.maxHp+' HP)');
  choice.options.push('Leave');choice.cursor=0;
  choice.callbacks=members.map(m=>()=>{
    const result=persistentParty.treatMember(m.characterId);
    mornayServiceMessage(npc.name,result.restored
      ? ['They clean and bind what needs care.',m.name+': restored '+result.restored+' HP. Paid '+result.paid+' gold.']
      : [result.hp===result.maxHp ? 'No further health needs restoring today.' : 'You need some coin for treatment.']);
  });
  choice.callbacks.push(()=>{});choice.open=true;
}
NPC_ACTIONS.mornayService = function(npc) {
  if (!inTown || currentTownId !== 'mornay' || npc.map !== currentContentLocationKey()) return false;
  dialogue.name=npc.name;setNpcDialoguePages(npc);dialogue.page=0;dialogue.open=true;
  dialogue.callbacks=[()=>{
    const stock=MORNAY_SHOPS[npc.service];
    if (stock) {shop.title=stock.label;shop.stock=stock.stock;shop.screen='main';shop.cursor=0;shop.open=true;return;}
    if (Object.hasOwn(MORNAY_INNS,npc.service)) {
      const fee=MORNAY_INNS[npc.service];choice.title=mornayBuilding('mornay_'+npc.service).name;
      choice.options=['Rest ('+fee+'g)','Leave'];choice.cursor=0;
      choice.callbacks=[()=>mornayRest(npc.service),()=>{}];choice.open=true;return;
    }
    if (npc.service==='treatment') mornayTreatmentChoices(npc);
  }];
  return true;
};
