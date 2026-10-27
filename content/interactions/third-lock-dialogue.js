'use strict';
// Content only; the expedition owner filters absent Esla and owns all receipts.
const STRUCK_ENTRY_DIALOGUE = Object.freeze({
 lead:[
  ['struck_iswen','Corvin? We used to race scraps of wood down the sluice. He stopped one race to correct the score. Nobody had been keeping a score.'],
  ['struck_iswen','My mother Heddra cooked for the Drenwick canal crews. When that work ended, she saved papers as they emptied the old office. His father’s tally may be among them.'],
  ['struck_iswen','She moved to Sedge Hollow with her pots, blankets and those papers. Peat cutters, reed harvesters, eel fishers. No word since the attacks. She stayed to help Belric with his bad leg.'],
  ['struck_iswen','I mend nets here now. Between the shifts and the children, I cannot go looking. From North Fen, follow the Great Fen’s eastern gravel spur north. A board marks the footpath to Sedge Hollow.'],
  ['esla','We will look for people first. The paper can wait.'],
 ],
 shelter:[
  ['struck_heddra','Mind the loose board. Belric tried to mend it with one leg and nearly gave me two patients.'],
  ['struck_belric','It was a sensible repair until the stool broke.'],
  ['struck_heddra','The creatures came through the gardens. I stayed. Someone had to change his dressing and boil the water.'],
  ['esla','The splint can stay. We will pad it and support his weight. Bloommarked or not, I cannot make a broken leg ready for a long walk.'],
  ['struck_heddra','There is a handcart by the abandoned cottage. Clear the reed cut and the footbridge, and we can reach the supply scow. Come back for us when it is safe.'],
 ],
 ready:[
  ['struck_heddra','The crossing too? Then help me with the cart. Belric, you are cargo today. No arguing with the crew.'],
  ['struck_belric','I used to charge extra for difficult cargo.'],
  ['esla','Slowly over the boards. Keep the leg supported. I will take this side.'],
  [null,'You pad the cart and take the cleared reed cut to the crossing. The scow crew helps the two neighbours aboard.'],
  ['struck_heddra','Iswen will put me up in Mornay. Belric needs the infirmary. I will not have him trying another roof yet.'],
  [null,'Before the scow leaves, Heddra opens the little chest she brought from the cottage. Beneath folded aprons lies a tally from the third lock on the Drenwick canal.'],
  ['struck_heddra','His father turned the page with his left thumb. See that dark corner? He would not touch a clean page until he had finished the last load.'],
  ['struck_heddra','These were people I fed in Drenwick. When I moved here, their names came with me. Tell him his father’s name was never missing in this house.'],
  [null,'She adds a small carved toy boat. One side bears a clumsy repair, rubbed smooth by years of handling.'],
  ['struck_heddra','His father made that. Corvin tried weighing it with a stone in it. Tell him it still floats without the stone.'],
 ],
 resolution:[
  ['corvin','First: did Heddra come back? Is she safe?'],
  [null,'You tell him where Heddra is staying in Mornay, and that Belric is recovering at the infirmary.'],
  ['corvin','Good. She used to feed anyone who stood still long enough. Even when there was barely enough in the pot.'],
  [null,'He finds the thumb-darkened corner before he reads the tally.'],
  ['corvin','He always finished a page. Even if he had to write sideways at the bottom.'],
  [null,'You set the boat beside it. Corvin turns the repaired side towards the light.'],
  ['corvin','I split that trying to make it carry more. He said a boat was allowed to be a boat.'],
  ['esla','Heddra said his name was never missing in her house.'],
  [null,'You relay Heddra’s message and attest the original tally. Corvin leaves the restoration line untouched for your hand. You enter his father’s name against the recovered record.'],
  ['corvin','There. A man who worked here. That is all it ever needed to say.'],
  [null,'He puts the boat safely inside his coat, and closes the tally.'],
 ],
});

const THIRD_LOCK_MAP_FEATURES = {
 GREAT_FEN_C8RN3_MAP:[{id:'third_lock_towpath',type:'inspect',sparkle:true,x:7.5,y:4.5,radius:44,name:'Hamlet footpath',pages:[['A wooden board marks the footpath to Sedge Hollow.']]}],
 DRENWICK_OFFICE_MAP:[{id:'third_lock_old_office_lead',type:'inspect',sparkle:true,x:12.5,y:2.5,radius:44,name:'Old canal-office papers',condition:()=>corvin_favor_started&&!corvin_favor_done,pages:[['Closure records from the old canal office.']]}],
 THIRD_LOCK_COMMON_MAP:[{id:'third_lock_relief',type:'inspect',sparkle:true,x:12.5,y:2.5,radius:44,allowUnwalkable:true,name:'Relief chest',pages:[['Supplies set aside for the rescue.']]}],
 THIRD_LOCK_LANDING_MAP:[{id:'third_lock_cache',type:'inspect',sparkle:true,allowUnwalkable:true,x:8.5,y:2.5,radius:44,name:'Supply box',pages:[['A sealed box wrapped in oiled cloth.']]}],
};
