'use strict';

// Bits are stable claim identities, not positions inferred from array order.
// Dates use the global calendar, inclusive; later opportunities never expire.
const MORNAY_CALENDAR_OPPORTUNITIES = Object.freeze([
  Object.freeze({bit:1,npc:'mornay_maelin_rook',title:'The Last Rope Basket',lastDay:10,
    place:'Maelin at North Upper West; on Dayoff, South Rows, second floor, room 13',
    action:'Search the discarded rope',items:Object.freeze(['Swift Bangle']),
    dayOffOffer:'I brought one of the condemned rope baskets home to sort. The hauler takes the lot tomorrow. Anything useful tangled in this rope is yours; I have already checked it against the cargo claims.',
    offer:'I am clearing the old rope baskets before the hauler comes. Anything useful in that condemned lot is yours. No cargo, mind; the numbered crates belong to somebody. I have enough claims to answer already.',
    found:'You ease apart the discarded coils. A Swift Bangle has caught beneath a broken basket handle. Maelin checks the cleared-lot tag and nods: yours to keep.',
    after:'That basket would have gone with the condemned rope. At least something useful came out of a morning of sweeping.',
    expired:'The hauler has taken the old rope baskets. Just a clean patch on the quay now. Nothing left to pick through.'}),
  Object.freeze({bit:2,npc:'mornay_jessa_fallow',title:'Before the Rag Cart',lastDay:14,
    place:'Jessa, the harness maker on Middle Lower West',
    action:'Check the ruined saddlebags',items:Object.freeze(['Elixir','Elixir']),
    offer:'Rurik has finally replaced those saddlebags. He told me to keep anything left in the lining, but my fingers will not fit the little pockets. Have a look before the rag cart takes them. You can have whatever he missed.',
    found:'Behind the torn lining are two sealed Elixirs. Jessa wipes the labels clean. Rurik bought replacements months ago; he will be glad somebody can use these.',
    after:'Two good bottles in a bag fit for rags. Rurik could lose his mule if it stood still long enough.',
    expired:'The rag cart has been. Rurik’s old saddlebags went with it. I am keeping the new ones away from him until he stops overloading them.'}),
  Object.freeze({bit:4,npc:'mornay_fennel_ashe',title:'The Dry Seed Trays',firstDay:16,
    before:'The seed trays are still damp. Come back from Day 16 and help me sort the sound seeds; you can take a handful for the road.',
    place:'Fennel at North Upper West; on Dayoff, South Rows, ground floor, room 5',
    action:'Help sort the dry seeds',items:Object.freeze(Array(8).fill('Dart Seed')),
    offer:'The seed trays are dry at last. Help me separate the sound dart seeds from the husks and take a handful for the road. Mrs Vale pays for a tidy garden, not for useful things growing in it.',
    found:'You sort the brittle husks while Fennel gathers the sound seeds. Received: eight Dart Seeds.',
    after:'The trays are put away. A few useful seeds saved, and the hedge still looks respectable enough for Mrs Vale.'}),
  Object.freeze({bit:8,npc:'mornay_ressa_muir',title:'A Basket for the Landing',firstDay:21,
    before:'Niva has put aside fish for the households on our landing. It should be smoked by Day 21. If you can help me wrap the portions then, I will keep some for you.',
    place:'Ressa, outside the shops on Middle Upper Central West',
    action:'Help wrap the supper portions',items:Object.freeze(Array(3).fill('Smoked Lake Fish')),
    offer:'Niva’s share of the catch is smoked and ready. Hold these wrappers while I divide it for the households on our landing. Three portions are yours for helping. The children can count; make them equal.',
    found:'You fold the wrappers while Ressa divides the fish. Three portions remain for your journey. Received: three Smoked Lake Fish.',
    after:'Everybody on the landing got a portion. Even the fellow who insists he never asks his neighbours for anything.'}),
  Object.freeze({bit:16,npc:'mornay_enna_quist',title:'The Swollen Cupboard',firstDay:26,
    before:'The leak above my cupboard is being patched. Give the boards until Day 26 to dry, then perhaps somebody can help me open it without pulling the hinges off.',
    place:'Enna in Dock Steps, flat 1',
    action:'Ease the cupboard open',items:Object.freeze(['Reed Remedy','Reed Remedy']),
    offer:'The leak above my cupboard has finally been patched. The wood has dried enough to move. Would you ease the door while I lift the latch? No kicking. I live downstairs from quite enough kicking.',
    found:'The cupboard opens without splitting. Two sealed Reed Remedies lie behind a stack of plates. Enna has already replaced them and insists you take the spare bottles.',
    after:'The cupboard shuts again. A modest ambition for a piece of furniture, but it has taken most of the month.'})
]);

// Calendar availability is derived. Only completed claims and the accepted
// neighbourhood errand are saved; visiting or reading a notice changes nothing.
const mornayCalendar = (() => {
  const musician='mornay_vessa_kest', neighbour='mornay_enna_quist', patron='mornay_hessa_vane';
  const nearby=n=>inTown && currentTownId==='mornay' && n &&
    n.map===currentContentLocationKey() && Math.hypot(player.x-n.x,player.y-n.y)<TALK_RADIUS;
  function invariantErrors(source) {
    const stage=source ? source.mornay_dayoff_music??0 : mornay_dayoff_music;
    const claims=source ? source.mornay_calendar_claims??0 : mornay_calendar_claims;
    const errors=[];
    if(!Number.isInteger(stage)||stage<0||stage>4)errors.push('Mornay Dayoff music: invalid stage');
    if(!Number.isInteger(claims)||claims<0||claims>31)errors.push('Mornay calendar: invalid claims');
    return errors;
  }
  function say(n,entries,done) {
    dialogue.name=n.name;
    setSpeakerDialoguePages(entries.filter(([id])=>id!=='esla'||persistentParty.isAvailable('esla'))
      .map(([speakerId,line])=>({speakerId,lines:[line]})));
    dialogue.page=0;dialogue.callbacks=done?[done]:null;dialogue.open=true;
  }
  function notes() {
    const body=[null,
      'Ask Enna in Dock Steps, flat 1, which canal song the neighbours can bear. Then ask Hessa at Pate House about the supper. Vessa lives in South Rows, ground floor, room 2. Accepted on Dayoff; finish on any day.',
      'Ask Hessa at Pate House what the neighbours need for their supper. Enna wants the quiet canal song, without stamping.',
      'Return to Vessa in South Rows, ground floor, room 2. Quiet canal song; children eat first. Fee: 60 gold.',
      'Vessa has the neighbours’ requests: a quiet canal song and supper before the dancing. Paid 60 gold.'][mornay_dayoff_music];
    const entries=body ? [{title:'A Song the Floor Can Bear',body}] : [];
    for(const opportunity of MORNAY_CALENDAR_OPPORTUNITIES) {
      if(mornay_calendar_claims & opportunity.bit)
        entries.push({title:opportunity.title,body:opportunity.found+' Collected; no further reward.'});
    }
    return entries;
  }
  const inWindow=o=>(!o.firstDay||day>=o.firstDay)&&(!o.lastDay||day<=o.lastDay);
  const claimable=(n,o)=>nearby(n)&&!invariantErrors().length&&inWindow(o)&&!(mornay_calendar_claims&o.bit);
  function opportunity(n) {
    const o=MORNAY_CALENDAR_OPPORTUNITIES.find(o=>o.npc===n.id);
    if(!o)return false;
    if(mornay_calendar_claims&o.bit){say(n,[[n.id,o.after]]);return true;}
    if(!inWindow(o)) {
      say(n,[[n.id,day>o.lastDay ? o.expired : o.before]]);return true;
    }
    const timing=o.lastDay ? `You have through Day ${o.lastDay}. After that this lot is gone.` : 'There is no hurry now it is ready.';
    say(n,[[n.id,isDayOff()&&o.dayOffOffer?o.dayOffOffer:o.offer],[n.id,timing]],()=>{
      if(!claimable(n,o))return;
      choice.title=o.title;choice.options=[o.action,'Leave it for now'];choice.cursor=0;
      choice.callbacks=[()=>{
        if(!claimable(n,o))return;
        const items=o.items.map(createItem);
        stats.items.push(...items);mornay_calendar_claims|=o.bit;syncQuestFlagsToWindow();
        say(n,[[null,o.found]]);
      },()=>{}];choice.open=true;
    });return true;
  }
  function interact(n) {
    if(!nearby(n)||invariantErrors().length)return false;
    const stage=mornay_dayoff_music;
    if(n.id===musician && stage===0) {
      if(!isDayOff()) {
        say(n,[[n.id,'Come round on Dayoff if you want a small job. Ansel and I are arranging songs for the neighbours’ supper. First I need a whole day when nobody is calling me back to work.']]);return true;
      }
      say(n,[[n.id,'The neighbours have put aside sixty gold for someone to gather the supper requests. Enna at Dock Steps, flat one, has strong opinions about dancing overhead. Then ask Hessa at Pate House what the families need.'],
        ['esla','A meeting where someone asks the people downstairs first. Mornay may yet surprise me.']],()=>{
        if(!nearby(n)||!isDayOff()||mornay_dayoff_music!==0)return;
        choice.title='A Song the Floor Can Bear';choice.options=['Help the neighbours','Not now'];choice.cursor=0;
        choice.callbacks=[()=>{
          if(!nearby(n)||!isDayOff()||mornay_dayoff_music!==0)return;
          mornay_dayoff_music=1;syncQuestFlagsToWindow();
          say(n,[[n.id,'Ask Enna first, then Hessa, and bring their answers back here. No deadline once you have agreed. We can always use the next Dayoff. I have written the addresses in your notebook.']]);
        },()=>{}];choice.open=true;
      });return true;
    }
    const turn=stage===1&&n.id===neighbour ? {next:2,entries:[
      [n.id,'The quiet canal song. All the verses, if you must. No stamping. The floor shakes soot into my dinner. Tell Hessa I will lend bowls if she sends them back washed.'],
      ['esla','A perfectly reasonable treaty between two floors.']]} : stage===2&&n.id===patron ? {next:3,entries:[
      [n.id,'Tell Vessa the little ones eat before the dancing. Some have minded a stove all week while their parents worked. Dayoff should belong to them too. I will collect Enna’s bowls and wash them myself.']]} : stage===3&&n.id===musician ? {next:4,entries:[
      [n.id,'Quiet song, no stamping, children eat first. I can manage that. Ansel can argue with the verses instead of the neighbours. Here is your sixty gold.'],
      ['esla','No stamps, no copies, and somebody gets supper. I prefer this sort of administration.']]} : null;
    if(turn) {
      say(n,turn.entries,()=>{
        if(!nearby(n)||mornay_dayoff_music!==stage)return;
        if(turn.next===4)stats.gold+=60;
        mornay_dayoff_music=turn.next;syncQuestFlagsToWindow();
      });return true;
    }
    if(n.id===musician && stage>0) {say(n,[[n.id,notes()[0].body]]);return true;}
    return opportunity(n);
  }
  function boardPages() {
    const pages=[[null,'Dayoff help wanted: sixty gold for gathering the neighbours’ supper requests. Speak to Vessa in South Rows, ground floor, room 2, on any Dayoff. Once accepted, the job can be finished on any day.']];
    for(const o of MORNAY_CALENDAR_OPPORTUNITIES) {
      if(mornay_calendar_claims&o.bit)continue;
      const timing=o.lastDay ? (day>o.lastDay?'Notice crossed out; clearance finished.':`Available through Day ${o.lastDay} only.`) : `Ready from Day ${o.firstDay}; no collection deadline.`;
      pages.push([null,`${o.title}. ${o.place}. ${timing}`]);
    }
    return pages;
  }
  return Object.freeze({interact,notes,boardPages,invariantErrors});
})();
