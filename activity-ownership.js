'use strict';

// Read-only ownership query. Owners keep their own lifecycle/tokens; this does
// not acquire locks, finalize sessions, or grant a scripted handoff permission.
const activityOwnership = (() => {
  const owners = [
    ['runtime_fault', () => gameRuntimeFailure.isActive()],
    ['promise_preview', () => debugPromisePreview.isOpen()],
    ['water_travel', () => waterTravelController.isActive()],
    ['fine_needlework', () => fineNeedlework.isActive()],
    ['mq5_assignment', () => mq5AssignmentCutscene.isActive()],
    ['camp', () => travellersRiseCamp.blocksInput()],
    ['ambush', () => travellersRiseAmbush.isExclusive()],
    ['cutaway', () => seraLioraCutscene.active],
    ['fishing', () => fishing.active],
    ['river_wrestling', () => riverWrestling.isActive()],
    ['story_battle', () => storyBattle.hasContext()],
    ['canonical', () => canonicalPartyCombat.isActive()],
    ['handoff', () => canonicalPartyCombat.hasPendingHandoff()],
    ['party', () => combatPlayerState.hasParty()],
    ['combat', () => combat.active],
    ['formation_lab', () => formationCombatLab.isOpen()],
    ['party_lab', () => partyCombatLab.isActive() || partyCombatLab.isMenuOpen()],
    ['receiver', () => galleryReceiverEncounter.isLocked()],
    ['checkpoint', () => storyCheckpointLab.isOpen()],
    ['dialogue', () => dialogue.open], ['choice', () => choice.open],
    ['menu', () => menu.open], ['shop', () => shop.open],
    ['debug', () => debugMenu.open], ['warp', () => warpMenu.open],
    ['atlas', () => continentMap.open], ['accord', () => accordPanel.open],
  ];
  const matching = predicate => owners.filter(([id,owns])=>predicate(id)&&owns()).map(([id])=>id);
  const active = () => Object.freeze(matching(()=>true));
  const conflicts = allowed => matching(id=>!allowed.includes(id));
  return Object.freeze({
    active,
    conflicts,
    has:id=>owners.some(([name,owns])=>name===id&&owns()),
    // Older combat controllers authenticate their existing menus, Labs and
    // Receiver handoffs themselves. Add the shared story/travel exclusions
    // without overriding those token-specific policies.
    combatPreparationConflicts(ownDialogue,ownStory=false) {
      return matching(id=>['promise_preview','river_wrestling','runtime_fault','water_travel','fine_needlework','mq5_assignment','camp','checkpoint',
        ...(!ownDialogue?['ambush']:[]),...(!ownStory?['story_battle']:[])].includes(id));
    },
    legacyExecutionConflicts() {
      return matching(id=>['promise_preview','river_wrestling','runtime_fault','water_travel','fine_needlework','mq5_assignment','camp','checkpoint','story_battle'].includes(id));
    },
  });
})();
