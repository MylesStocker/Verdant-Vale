'use strict';

// One encounter owner, not a second combat engine. Only the session controller
// owns battle phases, targeting and playback. Nothing here is serialized.
const galleryReceiverEncounter = (() => {
  const descriptors = Object.freeze(GALLERY_RECEIVER_TEMPLATES.map((e, slot) => Object.freeze({enemyId:e.id, slot})));
  const anchor = Object.freeze({x:3.5*TILE, y:4.5*TILE, facing:'up'});
  const actors = Object.freeze([
    Object.freeze({kind:'receiver', x:3.5*TILE, y:3.5*TILE}),
    Object.freeze({kind:'caller', x:2.5*TILE, y:5.5*TILE}),
    Object.freeze({kind:'keeper', x:4.5*TILE, y:5.5*TILE}),
  ]);
  let encounter = null;
  let backedAway = false; // permits walking OFF the automatic stair trigger
  const armed = () => reservoir_quest_started && gallery_deeper_stair_seen && !gallery_receiver_defeated;
  const onStair = () => inSunkenGallery && activeMap === SUNKEN_GALLERY_MAP &&
    activeMap[Math.floor(player.y/TILE)]?.[Math.floor(player.x/TILE)] === GALLERY_STAIR_UP;
  const ownsCombat = () => !!encounter && ['battle','fault'].includes(encounter.phase) &&
    encounter.members === combat.enemies && combat.mode === 'formation';
  const show = (pages, callback = null) => {
    dialogue.name = ''; dialogue.pages = pages; dialogue.page = 0;
    dialogue.callbacks = callback ? [callback] : null;
    dialogue.open = true;
  };
  const validateEntry = () => {
    if (!armed() || !inSunkenGallery || activeMap !== SUNKEN_GALLERY_MAP || formationCombatLab.isOpen() ||
        debugMenu.open) throw new Error('Receiver encounter is not ready');
    validateFormationEntry();
    const templates = validateFormationDescriptors(descriptors);
    validateFormationPlayerBasicState(true);
    if (templates.some(e => !formationBasicStatsValid(e) || e.hp <= 0 ||
        !formationAttackNumbersAreSafe(effectiveAtk(),e.def) ||
        !formationAttackNumbersAreSafe(e.atk,effectivePlayerIncomingMitigation(e.atk),
          e===GALLERY_RECEIVER_TEMPLATES[0] ? RECEIVER_HEAVY_MULTIPLIER : 1)))
      throw new Error('Unsupported formation basic Attack state');
    for (const p of [anchor,...actors]) {
      if (!validatePlacement({mapId:'SUNKEN_GALLERY_MAP',x:p.x,y:p.y,facing:'up'}).ok)
        throw new Error('Receiver staging position is not safe');
    }
  };
  const abortEntry = error => {
    const origin = encounter?.origin;
    encounter = null;
    dialogue.open = false; dialogue.callbacks = null; dialogue.triggerEncounterId = null;
    choice.open = false;
    if (origin) { placeAtLocation('SUNKEN_GALLERY_MAP',origin.x,origin.y); player.facing=origin.facing; }
    backedAway = true;
    reconcileFormationLabKeys();
    showWorldToast('Cannot begin this battle: unsupported combat state.');
    console.warn('[Receiver entry rejected]',error);
  };
  const backAway = () => {
    if (encounter?.phase !== 'warning') return false;
    encounter = null; choice.open = false; backedAway = true;
    reconcileFormationLabKeys();
    return true;
  };
  const commit = () => {
    if (encounter?.phase !== 'warning' || !onStair()) return false;
    try { validateEntry(); } catch (error) { abortEntry(error); return false; }
    encounter = {phase:'staging', origin:{x:player.x,y:player.y,facing:player.facing}, members:null};
    placeAtLocation('SUNKEN_GALLERY_MAP',anchor.x,anchor.y); player.facing=anchor.facing;
    player.moving = false;
    reconcileFormationLabKeys();
    show([
      ['Something rises between you and the stair.', 'Water runs from its shoulders. It does not move aside.'],
      ['Behind you, a narrow shape pulls itself upright.', 'Another plants its forelimbs against the stone.'],
      ['The narrow one gives a broken call.', 'The larger creature turns.'],
      ['They have not followed you here.', 'They were waiting for you to leave.'],
    ]);
    queueDialogueEncounter('gallery_receiver');
    return true;
  };
  const finish = view => {
    if (view.phase === 'victory') {
      if (gallery_receiver_defeated || !combat.enemies.every(e => e.hp === 0) || stats.hp <= 0)
        throw new Error('Invalid Receiver victory');
      encounter.phase = 'aftermath';
      endCombat();
      gallery_receiver_defeated = true;
      syncQuestFlagsToWindow();
      show([
        ['The larger creature collapses across the foot of the stair.'],
        ['Beneath the folds of its throat, something catches the light: a bronze bridle, driven through the bone and grown over by centuries of flesh.'],
        ['The smaller creatures carry matching thorns at the bases of their skulls. Fine black filaments trail from all three bodies into seams in the old floor.'],
        ['They were not guarding the way in.'],
        ['They were guarding the way out.'],
      ], () => { encounter=null; reconcileFormationLabKeys(); });
    } else if (view.phase === 'defeat') {
      if (stats.hp !== 0) throw new Error('Invalid Receiver defeat');
      encounter = null; // recovery may now perform its ordinary home transition
      recoverCombatDefeat();
      reconcileFormationLabKeys();
    }
  };
  return Object.freeze({
    ownsCombat,
    isLocked:() => encounter !== null,
    blocksWorldInput:() => !!encounter && encounter.phase !== 'battle',
    blocksPlayerRetreat:() => inSunkenGallery && armed(),
    noteArrival(mapId) {
      if (!gallery_deeper_stair_seen && mapId === 'SUNKEN_GALLERY_R0C4' && inSunkenGallery && activeMap === mapRefForId(mapId)) {
        gallery_deeper_stair_seen = true;
        syncQuestFlagsToWindow();
      }
    },
    updateStairLatch() { if (!onStair()) backedAway = false; },
    interceptExit() {
      if (!onStair() || !armed()) return false;
      if (encounter || backedAway) return true;
      if (combat.active || combat.mode !== null || dialogue.open || dialogue.callbacks || dialogue.triggerEncounterId ||
          menu.open || choice.open || shop.open || warpMenu.open || debugMenu.open || fishing.active ||
          seraLioraCutscene.active || accordPanel.open || continentMap.open) return true;
      encounter = {phase:'warning',members:null};
      show([['The stair is only a few steps away.'],['Behind you, something heavy moves in the water.']], () => {
        choice.title = ''; choice.options = ['Go to the stair.','Back away.']; choice.cursor=0;
        choice.callbacks = [commit,backAway]; choice.open=true;
      });
      return true;
    },
    cancelWarning:backAway,
    startBattle() {
      if (encounter?.phase !== 'staging') return false;
      try { validateEntry(); } catch (error) { abortEntry(error); return false; }
      try {
        prepareFormationEntry();
        // Ordinary formation policy; registry boss metadata locks this whole
        // encounter for its lifetime, even after its boss member is defeated.
        initializeFormationState(descriptors, {escape:'fastest_living'});
        formationSessionController.begin();
      } catch (error) {
        // Validated entry has not resolved any damage. An unexpected startup
        // fault abandons only this newly constructed state, never another fight.
        if (combat.mode === 'formation') setSingleCombatEnemy(null);
        abortEntry(error);
        return false;
      }
      encounter.members = combat.enemies; encounter.phase = 'battle';
      combat.active = true;
      reconcileFormationLabKeys();
      return true;
    },
    runOperation(operation) {
      if (!ownsCombat() || encounter.phase !== 'battle') throw new Error('No active Receiver battle');
      try {
        const result = operation();
        finish(formationSessionController.getView());
        return result;
      } catch (error) {
        // Never repeat spent RNG, refund HP or claim completion. The last
        // explicit save remains the recovery authority for an unexpected fault.
        encounter.phase = 'fault';
        console.error('[Receiver combat stopped; reload the last save]',error);
        return false;
      }
    },
    combatCleared() {
      if (!encounter || encounter.phase === 'aftermath') return;
      if (['warning','staging'].includes(encounter.phase)) {
        const origin=encounter.origin;
        if (origin) { placeAtLocation('SUNKEN_GALLERY_MAP',origin.x,origin.y); player.facing=origin.facing; }
        dialogue.open=false; dialogue.callbacks=null; dialogue.triggerEncounterId=null; choice.open=false;
        backedAway=true;
        reconcileFormationLabKeys();
      }
      encounter=null;
    },
    getView() {
      if (!encounter || encounter.phase === 'warning' || encounter.phase === 'battle') return null;
      // Dialogue advances the reveal, not rendering/timers. All three remain
      // visible together before the final page hands control straight to combat.
      const stage=encounter.phase==='staging' ? dialogue.page : null;
      return Object.freeze({phase:encounter.phase, actors:stage===0 ? Object.freeze(actors.slice(0,1)) : actors,
        signalling:stage===2, collapsed:encounter.phase === 'aftermath'});
    },
  });
})();
