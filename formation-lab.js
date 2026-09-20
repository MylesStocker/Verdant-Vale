'use strict';

// Developer laboratory only: no encounter, progression, reward or save data.
// The session controller owns all combat phases, targets and playback.
const FORMATION_LAB_SCENARIOS = Object.freeze([
  {label:'Two distinct enemies', ids:['enemy_marsh_wisp','enemy_briar_hound']},
  {label:'Three distinct enemies', ids:['enemy_reed_grappler','enemy_silt_lurker','enemy_sluice_slime']},
  {label:'Three duplicate enemies', ids:['enemy_marsh_wisp','enemy_marsh_wisp','enemy_marsh_wisp']},
].map(s => Object.freeze({label:s.label, ids:Object.freeze(s.ids)})));

const formationCombatLab = (() => {
  let lab = null; // sole lab authority: submenu selection and minimal restoration
  const active = () => !!lab && lab.restore !== null;
  const stable = () => !combat.active && combat.mode === null && combat.enemies.length === 0 &&
    formationSessionController.getView() === null && !dialogue.open && !seraLioraCutscene.active &&
    !fishing.active && !menu.open && !choice.open && !shop.open && !warpMenu.open &&
    !accordPanel.open && !continentMap.open && regionalInvariantErrors().length === 0;
  const restoreSubmenu = () => {
    // The same collection authority clears session/playback on normal exits
    // and emergency aborts. No singleton finalizer or combat rollback runs.
    setSingleCombatEnemy(null);
    stats.hp = lab.restore.hp;
    tick = lab.restore.tick;
    lab.restore = null;
    lab.scenario = null;
    debugMenu.open = true;
    debugMenu.cursor = lab.debugCursor;
    reconcileFormationLabKeys();
  };
  return Object.freeze({
    isOpen:() => lab !== null,
    isActive:active,
    isMenuOpen:() => !!lab && !active(),
    getView() {
      return lab ? Object.freeze({active:active(), cursor:lab.cursor, scenario:lab.scenario, error:lab.error}) : null;
    },
    open() {
      if (lab || !debugMenu.open || !stable()) return false;
      lab = {cursor:0, scenario:null, error:'', debugCursor:debugMenu.cursor, restore:null};
      reconcileFormationLabKeys();
      return true;
    },
    move(direction) {
      if (!lab || active() || !['previous','next'].includes(direction)) return false;
      lab.cursor = (lab.cursor + (direction === 'next' ? 1 : 2)) % 3;
      lab.error = '';
      return true;
    },
    closeMenu() {
      if (!lab || active()) return false;
      debugMenu.cursor = lab.debugCursor;
      lab = null;
      reconcileFormationLabKeys();
      return true;
    },
    start() {
      if (!lab || active() || !debugMenu.open || !stable()) return false;
      const scenario = FORMATION_LAB_SCENARIOS[lab.cursor];
      const restore = {hp:stats.hp, tick};
      // Preserve unsupported/stale mechanics rather than clearing or repairing
      // them for a demo. The real session preflight is the capability authority.
      try {
        prepareFormationEntry();
        initializeFormationState(scenario.ids.map((enemyId, slot) => ({enemyId,slot})));
        formationSessionController.begin();
      } catch (error) {
        if (combat.mode === 'formation') setSingleCombatEnemy(null);
        if (!/Unsupported formation|Formation state|Template is not approved|Invalid formation|Unknown formation/.test(error.message)) throw error;
        lab.error = 'Requires idle combat, positive HP, no statuses, and ordinary gear.';
        return false;
      }
      lab.restore = restore;
      lab.scenario = lab.cursor;
      lab.error = '';
      debugMenu.open = false;
      reconcileFormationLabKeys();
      return true;
    },
    runOperation(operation) {
      if (!active() || typeof operation !== 'function') throw new Error('Formation Lab operation requires an active lab');
      try {
        return operation();
      } catch (error) {
        // The round may already have spent RNG and changed HP. Never retry it
        // or roll gameplay back: abandon this lab session and restore only the
        // lab's authorized pre-entry snapshot. Outside-lab errors still throw.
        restoreSubmenu();
        lab.error = 'Lab aborted safely. ' + String(error?.message || error).slice(0,120);
        console.error('[Formation Combat Lab] Emergency abort:', error);
        return false;
      }
    },
    exit() {
      if (!active() || combat.mode !== 'formation') return false;
      const view = formationSessionController.getView();
      if (!view || !['awaiting_action','victory','defeat'].includes(view.phase)) return false;
      // The collection cleanup authority also clears the private session. Do
      // not run singleton finalizers/endCombat: they alter cooldown/statuses.
      restoreSubmenu();
      return true;
    },
  });
})();
