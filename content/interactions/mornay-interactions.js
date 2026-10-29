'use strict';

// Repeatable public evidence: no callbacks, triggers, flags, rewards or quests.
const MORNAY_NOTICES = Object.freeze([
  Object.freeze({mapId:'MORNAY_FLECK_HOUSE_MAP',id:'mornay_fleck_rents',type:'inspect',allowUnwalkable:true,x:1.5,y:5.5,radius:42,label:'Rent card',pages:[['Main floor: twelve gold a week. Lower rooms: three. The cheap rooms are below the storm-water line.'],['A tenant has added: A dry week costs the same as a wet one.']]}),
  Object.freeze({mapId:'MORNAY_FLECK_CELLAR_MAP',id:'mornay_fleck_watermarks',type:'inspect',allowUnwalkable:true,x:2.5,y:8.5,radius:42,label:'Bailing tubs',pages:[['A dark waterline runs above the bed-height marks scratched into the plaster. The tubs are never put away.'],['Boards lift bedding above the damp. Even during the drought, an onshore storm can push Valmere into these rooms.']]}),
  Object.freeze({"mapId":"MORNAY_WATCHHOUSE_MAP","id":"mornay_jail_booking_notices","type":"inspect","allowUnwalkable":true,"x":14.5,"y":4.5,"radius":40,"label":"Custody notices","pages":[["Visitors must give a name and wait on the bench. Property must be listed and witnessed. No payment is required to record an arrest."],["A later notice requests information about Reclaimer printers. Someone has underlined: evidence, not neighbourhood quarrels."]]}),
  Object.freeze({"mapId":"MORNAY_WATCHHOUSE_MAP","id":"mornay_jail_property","type":"inspect","allowUnwalkable":true,"x":13.5,"y":2.5,"radius":40,"label":"Confiscated property","pages":[["A locked chest holds numbered bundles. A cracked lantern, a belt knife, and a pair of work boots lie beneath a receipt book. Nothing is available to take."]]}),
  Object.freeze({"mapId":"MORNAY_WATCHHOUSE_MAP","id":"mornay_jail_records","type":"inspect","allowUnwalkable":true,"x":1.5,"y":2.5,"radius":40,"label":"Records cupboard","pages":[["Water has swollen the bottom drawer. Arrest lists occupy the dry shelves; repair requests are tied into a much older bundle. The drawers stay shut."]]}),
  Object.freeze({"mapId":"MORNAY_WATCHHOUSE_MAP","id":"mornay_jail_rear_screen","type":"inspect","allowUnwalkable":true,"x":9.5,"y":6.5,"radius":40,"label":"Guarded rear door","pages":[["Through the iron screen: two communal cells with four narrow beds apiece, and two single cells. Damp streaks run beneath the barred windows."],["A locked side gate leads to a small exercise and delivery yard. Beyond its bench stands a leaning privy. The smell reaches the booking desk."],["The custody door is bolted. There are no visits or property releases available here."]]}),

  Object.freeze({"mapId":"MORNAY_OLD_FORT_MAP","id":"mornay_watch_cells","type":"inspect","allowUnwalkable":true,"x":10.5,"y":2.8,"radius":44,"label":"Old Fort records and disused lockup","pages":[["OLD RECORDS. FORMER LOCKUP. CLOSED TO THE PUBLIC."],["Bookings and custody enquiries: South Mornay Watchhouse, just north of the East Gate. This chained door is no longer the public entrance."]]}),
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
  Object.freeze({"mapId": "MORNAY_SOUTH_ROWS_FLOOR_3_MAP", "id": "mornay_attic_seam", "type": "inspect", "allowUnwalkable": true, "x": 1.5, "y": 6.5, "radius": 44, "label": "Draught at the landing", "pages": [["A cord hangs behind the loose ceiling panel. The boards below are scuffed by the feet of a folding ladder."], ["Step beneath the panel to climb through the concealed hatch."]]}),
  Object.freeze({"mapId": "MORNAY_SOUTH_ROWS_ATTIC_MAP", "id": "mornay_attic_press", "type": "inspect", "allowUnwalkable": true, "x": 5.5, "y": 5.5, "radius": 44, "label": "Ink-stained workbench", "pages": [["Loose type, ink pads, and a small hand press. A drying sheet reads: RECLAIMERS \u2014 bread, wages, a voice."], ["A draft calls for blocking a bonded shipment. In a different hand: No fire. The night crew sleeps above the store."], ["Another reply: And how long do we ask politely?"]]}),
  Object.freeze({"mapId": "MORNAY_SOUTH_ROWS_ATTIC_MAP", "id": "mornay_attic_aid", "type": "inspect", "allowUnwalkable": true, "x": 12.5, "y": 3.5, "radius": 44, "label": "Sacks and folded bedding", "pages": [["Meal, patched blankets, clean bandages. Beside them: households to receive help, listed by door number rather than name."], ["A crate has two freight labels, one pasted over the other. This is more than a neighbour keeping spare blankets."]]}),
  Object.freeze({"mapId": "MORNAY_SOUTH_ROWS_ATTIC_MAP", "id": "mornay_attic_routes", "type": "inspect", "allowUnwalkable": true, "x": 3.5, "y": 9.5, "radius": 44, "label": "Folded instructions", "pages": [["Meeting notes in several hands. Use the back landings. Keep names off the sheets. Never bring an officer upstairs."], ["The room is empty now. Nothing here identifies what happened to Dreyfuss or where Garrick went."]]}),
  Object.freeze({"mapId": "MORNAY_SOUTH_ROWS_MAP", "id": "mornay_tenement_laundry", "type": "inspect", "allowUnwalkable": true, "x": 1.5, "y": 8.5, "radius": 44, "label": "Washday roster", "pages": [["SOUTH ROWS. Eight doors on each of three floors. Four workdays, then Dayoff."], ["Half the units stand quiet while their occupants work. Several other doors have a child listed for washing, minding the stove, or watching younger children."]]}),
]);
// Separate from inert public notices: the quest owns this cache transaction.
const MORNAY_TWO_JORANS_SUPPLY = Object.freeze({mapId:'MORNAY_OLD_FORT_MAP',id:'two_jorans_supply_box',type:'inspect',allowUnwalkable:true,x:9.5,y:11.5,radius:44,label:'Joran Beck’s supply box',pages:[['A locked iron box stamped J. BECK.']]});
const MORNAY_MAP_FEATURES = Object.fromEntries([...MORNAY_TOWN_MAP_IDS,...MORNAY_BUILDINGS.map(b=>b.mapId)].map(id =>
  [id,[...MORNAY_NOTICES,MORNAY_TWO_JORANS_SUPPLY].filter(n => n.mapId === id)]));
const MORNAY_INNS = Object.freeze({gate_inn:30,commercial_inn:40});

function interactMornay() {
  if (!inTown || currentTownId !== 'mornay') return false;
  if(interactFleckFishing())return true;
  if (twoJorans.tryCache()) return true;
  if (interactSimpleNPCs()) return true;
  return tryMapFeatures();
}
const FLECK_FISHING_SPOT=Object.freeze({mapId:'MORNAY_FLECK_POINT_MAP',x:11.5*TILE,y:11.5*TILE});
function interactFleckFishing(){
  const s=FLECK_FISHING_SPOT;
  if(mapIdForRef(activeMap)!==s.mapId||Math.hypot(player.x-s.x,player.y-s.y)>=TALK_RADIUS)return false;
  if(!bestFishingPower()){
    openDialogue('',[['Perch and pike turn below the uneven steps. You need a fishing rod.']]);return true;
  }
  choice.title='The Fleck — rough water';choice.options=['Cast line (1 bait)','Leave'];choice.cursor=0;
  choice.callbacks=[()=>{
    if(fishing.active||mapIdForRef(activeMap)!==s.mapId||Math.hypot(player.x-s.x,player.y-s.y)>=TALK_RADIUS||!bestFishingPower())return;
    const bait=stats.items.findIndex(i=>i.name==='Bait');
    if(bait<0){openDialogue('',[['You have no bait. Nerys sells it at the smoking shed.']]);return;}
    if(startFishing(bestFishingPower(),'fleck'))stats.items.splice(bait,1);
  },()=>{}];choice.open=true;return true;
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
