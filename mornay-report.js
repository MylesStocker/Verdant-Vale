'use strict';

// The signed request is owned by MQ5 assignment, not an inventory object.
// Only the final audience callback writes its registered completion flag.
// Companion presentation is transient: no NPC, party or save position is moved.
const mornayReport=(()=>{
  const officialId='mornay_marit_voss';
  let audience=null,generation=0;
  const inOffice=()=>inTown&&currentTownId==='mornay'&&townBuilding==='mornay_office'&&
    activeMap===mapRefForId('MORNAY_OFFICE_MAP');
  const issued=(s={MainQuest,fort_quest_stage,reservoir_quest_started,reservoir_report_filed,
    gallery_body_found:!!window.gallery_body_found,gallery_receiver_defeated,sera_liora_opening_complete})=>
    Number.isInteger(s.MainQuest)&&s.MainQuest>=5&&s.fort_quest_stage===6&&
    s.reservoir_quest_started===true&&s.reservoir_report_filed===true&&s.gallery_body_found===true&&
    s.gallery_receiver_defeated===true&&s.sera_liora_opening_complete===true;
  const eligible=()=>MainQuest===5&&!mq5_report_delivered&&issued();
  const invariantErrors=source=>{
    const delivered=source?source.mq5_report_delivered:mq5_report_delivered;
    return delivered===true&&!issued(source)?['MQ5 delivery requires the assigned Calwick request']:[];
  };
  const page=(speakerId,text)=>({speakerId,lines:[text]});
  const pages=withEsla=>{
    const result=[
      page(officialId,'“Calwick’s request for assistance. Please, I’m Marit Voss. Your Supervisor’s signature, and the seal intact. Thank you for bringing it.”'),
      page(null,'Lély hands over the report. Voss breaks the seal and reads the covering account.'),
      page(officialId,'“Dreyfuss dead. Garrick still missing. I’m sorry. You were in the Gallery yourself?”'),
      page('lely','“I found Dreyfuss below the reservoir. There were marks in the silt around him. I didn’t find Garrick.”'),
      page('lely','“There are rooms beneath the Gallery. Something attacked me there. I survived it. I can’t tell you what the whole place was built to do.”'),
    ];
    if(window.gallery_clue_notebook)result.push(page('lely','“I found Garrick’s notebook. He wrote that heat and drainage couldn’t account for the water loss. His last page was torn out.”'));
    else if(window.gallery_clue_satchel)result.push(page('lely','“I found Garrick’s kit caught below. That tells us he reached the place. It doesn’t tell us where he is now.”'));
    if(window.gallery_clue_survey)result.push(page('lely','“The survey marks showed the water falling in steps, with pauses between them. Then a much larger fall.”'));
    result.push(page(officialId,'“Quite right to bring this to us. Calwick and Drenwick cannot be expected to supply specialists they don’t have.”'));
    if(withEsla)result.push(page('esla','“No. We’re short of people at home too. We need someone qualified to judge what it is safe to do.”'));
    result.push(
      page(officialId,'“Naturally. Unfortunately, the relevant specialists are away, and our investigators have existing commitments. I cannot responsibly promise their time.”'),
      page('lely','“Can someone at least look for Garrick?”'),
      page(officialId,'“I shall record the urgency. We also have harbour claims and appointments with the district’s principal employers. Those obligations cannot simply be set aside.”'),
      page('lely','“When should the Supervisor expect an answer?”'),
      page(officialId,'“I would rather give him a dependable answer than an encouraging date. You understand.”'),
    );
    if(withEsla)result.push(page('esla','“Then I’ll be careful not to mistake an acknowledgement for an answer.”'));
    result.push(page(officialId,'“Very sensible. The request is received, and your firsthand account is on record. No personnel have been assigned. Keep yourselves available.”'));
    return result;
  };
  // A stationary field-party projection beside Lély, as opposed to a new
  // persistent resident. Validate feet, furniture, occupants and spacing before
  // taking dialogue ownership. There is no walking route or player relocation.
  const clear=(x,y)=>{
    for(const [dx,dy]of [[-9,-9],[9,-9],[-9,9],[9,9]]){
      const tile=tileAt(x+dx,y+dy);
      if(!isTileWalkable(tile)||TILE_PROPERTIES[tile]?.isTransition)return false;
    }
    return !npcRouteCustomSolidBlocks(x,y)&&
      !SIMPLE_NPCS.some(n=>n.map===currentContentLocationKey()&&n.solid&&Math.abs(x-n.x)<22&&Math.abs(y-n.y)<22);
  };
  const stage=npc=>{
    for(const [dx,dy]of [[0,32],[32,0],[-32,0],[0,-32],[32,32],[-32,32]]){
      const x=player.x+dx,y=player.y+dy;
      if(clear(x,y))return Object.freeze({x,y,facing:Math.abs(npc.x-x)>Math.abs(npc.y-y)?(npc.x<x?'left':'right'):(npc.y<y?'up':'down')});
    }
    return null;
  };
  const interact=npc=>{
    if(npc.id!==officialId||!eligible()||!inOffice()||audience||
        Math.hypot(player.x-npc.x,player.y-npc.y)>=TALK_RADIUS||activityOwnership.conflicts([]).length)return false;
    const withEsla=persistentParty.isAvailable('esla');
    const companion=withEsla?stage(npc):null;
    if(withEsla&&!companion)return false; // fail before handoff; ordinary conversation remains available
    const authored=pages(withEsla);validateSpeakerDialoguePages(authored);
    const token=++generation;
    audience={token,companion,withEsla,x:player.x,y:player.y};
    dialogue.name=npc.name;setSpeakerDialoguePages(authored);dialogue.page=0;dialogue.open=true;
    dialogue.callbacks=[()=>{
      if(!audience||audience.token!==token)return;
      const valid=inOffice()&&eligible()&&player.x===audience.x&&player.y===audience.y&&
        persistentParty.isAvailable('esla')===audience.withEsla;
      audience=null;
      if(valid)mq5_report_delivered=true;
    }];
    return true;
  };
  return Object.freeze({eligible,interact,pages,invariantErrors,
    isActive:()=>audience!==null,
    companion:()=>audience&&inOffice()?audience.companion:null,
    reset(){audience=null;generation++;},
  });
})();
