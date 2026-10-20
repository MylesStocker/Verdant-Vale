'use strict';

// Lab ownership stays here; drawing is shared with canonical encounters.
function drawPartyCombatLabBattle() {
  if(arguments.length)throw new Error('Party Combat Lab renderer takes no arguments');
  return drawPartyBattle(partyCombatLab.getView());
}
