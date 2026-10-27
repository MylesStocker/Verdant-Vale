'use strict';
// Revisable local content. Full names distinguish the case; dialogue headers
// retain first names. Esla's optional pages use her established speaker style.
const TWO_JORANS_CONTENT = {
 offer:[
  ['mornay_anric_fell','A small case, if you have the patience. Two men called Joran. Someone copied both complaints onto Beck’s booking sheet. The poorer man was easier to fetch.'],
  ['mornay_anric_fell','I know the sheet is wrong. I cannot just guess which statements belong to which man. Beck is here for his booking interview. Will you follow the originals?'],
 ],
 accepted:[
  ['mornay_anric_fell','Talk to Joran Beck here. Perris supervises his stonework at the Old Fort. At Fen Warehouse, ask Varda about the wage complaint and speak to Joran Alden himself. Bring me names, work and the actual statements.'],
  ['esla','Two men, two statements, one first name. Wonderful. We have discovered a counting problem.'],
 ],
 beck:[
  ['two_jorans_beck','Beck. Joran Beck. I break old footing stone for Perris, up at the Old Fort. I have never handled a freight payroll.'],
  ['two_jorans_beck','Yes, there was a complaint about my charge box. I left it at the repair site after the job. And I called the neighbour a prying old crow. That was stupid. It does not make me a wage thief.'],
  ['esla','An address and an occupation. Already this is more information than your arrest sheet managed.'],
 ],
 perris:[
  ['mornay_perris_dun','Beck worked here when the wages went missing. Here is my day book: his full name, the hours and my signature. He was splitting foundation stone, not unloading freight.'],
  ['mornay_perris_dun','I bought five spare Sapper Charges for the job and settled them to him when it ended. His receipt is clipped to the book. The box is locked against the south wall.'],
  ['mornay_perris_dun','He should have cleared it away. I have told him often enough. The neighbour reported leftover blasting supplies, not a threat to blow up a warehouse. Beck is careless. He is not that man.'],
 ],
 varda:[
  ['mornay_varda_fen','My complaint named Joran Alden, the contractor standing over there. I watched him put the pay purse back in his coat and strike a carter who tried to stop him.'],
  ['mornay_varda_fen','I wrote “Alden, freight contractor” on the original. The watch copy says “Joran, labourer”. Apparently the rest of his name was taking up valuable ink.'],
  ['mornay_varda_fen','He calls it recovering an advance. Three men are owed wages. I signed for the consignment before checking they had been paid. I will not make that mistake again.'],
  ['esla','A full name, a witness and the original statement. We shall try not to lose two of those on the way back.'],
 ],
 alden:[
  ['two_jorans_alden','Alden. I contract freight; I do not break stones. Yes, I kept the purse. They owed me for an advance. My own customers have not paid me either.'],
  ['two_jorans_alden','And yes, I hit the carter. He caught my coat. It was one blow, not whatever story you have been told. I paid for his dressing.'],
  ['esla','Paying for the dressing does not convert the blow into a clerical error.'],
  ['two_jorans_alden','I know. I should not have hit him. But I did not tell the watch to arrest some other Joran. Put my statement under my name this time.'],
 ],
 correction:[
  ['mornay_anric_fell','Beck: stonework at the fort, witnessed by Perris. A complaint about leftover supplies, with a receipt. Alden: freight pay withheld and a carter struck, witnessed by Varda and admitted in his own statement.'],
  ['esla','Separate sheets. Full names. Attach the originals. And take “threat to destroy the warehouse” out of the space where someone combined two unrelated sentences.'],
  ['mornay_anric_fell','Agreed. The theft and assault allegations come off Beck’s record. There is no basis to hold him on the storage complaint. I am recording his release. Alden’s case will proceed under Alden’s name.'],
  ['esla','Look at that. The forms work when they describe things that happened.'],
  ['mornay_anric_fell','I will sign the correction myself. Beck can collect his tools at the Old Fort. Thank you for doing the legwork.'],
 ],
 released:[
  ['two_jorans_beck','Anric let me out. Perris gave me an earful before he gave me my tools. Fair enough. I left him to answer for that box.'],
  ['two_jorans_beck','Here. The key to my supply box against the fort’s south wall, east of the opening. Five Sapper Charges. They are yours. I do not want any more trouble; I will take hammer work for a while.'],
  ['esla','I shall enter that as a gift, with the giver’s full name. We have had a useful demonstration of why.'],
 ],
 thanks:[['two_jorans_beck','The key fits the box against the south wall, east of the opening. Please take the lot. I want this finished.']],
 finished:[['two_jorans_beck','No box, no charges, no borrowed accusations. Just a wall to mend. I can manage a wall.']],
 officerDone:[['mornay_anric_fell','The corrected sheets have their own names and statements now. Beck is released. Alden has been summoned about his own conduct. No fee for correcting our mistake.']],
 aldenDone:[['two_jorans_alden','I have a summons with my entire name on it. And a pay account to settle. You have made your point.']],
};
