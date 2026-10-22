'use strict';

// Short, authored water crossings. This owns transient animation progress and
// exclusive input only; route availability and final placement remain with the
// existing story/location authorities. Nothing here is serialized.
const WATER_TRAVEL_ROUTES = Object.freeze({
  causeway_ferry: Object.freeze({
    id: 'causeway_ferry',
    boatId: 'cable_scow',
    durationFrames: 105, // 1.75 seconds at the fixed 60 Hz update rate
    endpoints: Object.freeze([
      Object.freeze({ mapId: 'EAST_CAUSEWAY_MAP', x: 10.5 * TILE, y: 8.5 * TILE, facing: 'left' }),
      Object.freeze({ mapId: 'EASTERN_BANK_MAP', x: 5.5 * TILE, y: 8.5 * TILE, facing: 'right' }),
    ]),
    visual: Object.freeze({ startX: 88, endX: 424, y: 244 }),
  }),
});

const WATER_TRAVEL_AVAILABILITY = Object.freeze({
  causeway_ferry: () => MainQuest >= 5,
});

const waterTravelController = (() => {
  let session = null;
  let diagnostic = null;

  const rejection = (message) => ({ ok: false, reason: message });
  const activeMapId = () => (typeof regionalActiveMapId === 'function')
    ? regionalActiveMapId()
    : mapIdForRef(activeMap);

  function validateRouteRecord(routeId, route) {
    if (!route || !Object.isFrozen(route) ||
        Reflect.ownKeys(route).join(',') !== 'id,boatId,durationFrames,endpoints,visual' ||
        route.id !== routeId || !/^[a-z][a-z0-9_]*$/.test(route.id) ||
        route.boatId !== 'cable_scow' ||
        !Number.isSafeInteger(route.durationFrames) || route.durationFrames < 1 ||
        !Array.isArray(route.endpoints) || !Object.isFrozen(route.endpoints) || route.endpoints.length !== 2 ||
        !route.endpoints.every(endpoint => Object.isFrozen(endpoint) &&
          Reflect.ownKeys(endpoint).join(',') === 'mapId,x,y,facing') ||
        !route.visual || !Object.isFrozen(route.visual) ||
        Reflect.ownKeys(route.visual).join(',') !== 'startX,endX,y' ||
        ![route.visual.startX, route.visual.endX, route.visual.y].every(Number.isSafeInteger) ||
        typeof WATER_TRAVEL_AVAILABILITY[routeId] !== 'function') {
      throw new Error('Water travel route registry is malformed');
    }
  }

  function competingOwnerActive() {
    return dialogue.open || choice.open || menu.open || shop.open || debugMenu.open || warpMenu.open ||
      continentMap.open || accordPanel.open || combat.active || fishing.active || seraLioraCutscene.active ||
      canonicalPartyCombat.isActive() || canonicalPartyCombat.hasPendingHandoff() ||
      combatPlayerState.hasParty() || formationCombatLab.isOpen() || partyCombatLab.isActive() ||
      partyCombatLab.isMenuOpen() || galleryReceiverEncounter.isLocked() ||
      (typeof mq5AssignmentCutscene !== 'undefined' && mq5AssignmentCutscene.isActive()) ||
      (typeof travellersRiseAmbush !== 'undefined' && travellersRiseAmbush.isExclusive()) ||
      (typeof travellersRiseCamp !== 'undefined' && travellersRiseCamp.blocksInput()) ||
      (typeof storyCheckpointLab !== 'undefined' && storyCheckpointLab.isOpen());
  }

  function prepare(routeId) {
    if (session) return rejection('water travel is already active');
    const route = WATER_TRAVEL_ROUTES[routeId];
    if (!route) return rejection('unknown water travel route');
    validateRouteRecord(routeId, route);
    if (!WATER_TRAVEL_AVAILABILITY[routeId]()) return rejection('water travel route is unavailable');
    if (competingOwnerActive()) return rejection('another input owner is active');

    const fromMapId = activeMapId();
    const fromIndex = route.endpoints.findIndex(endpoint => endpoint.mapId === fromMapId);
    if (fromIndex < 0) return rejection('player is not at a route endpoint');
    const toIndex = fromIndex === 0 ? 1 : 0;
    const destination = route.endpoints[toIndex];
    const placement = validatePlacement(destination);
    if (!placement.ok) return rejection(placement.errors.join('; '));

    const proposed = {};
    for (const binding of LOCATION_STATE_BINDINGS) proposed[binding.key] = _neutralValueFor(binding);
    const location = validateLocationState(proposed);
    if (!location.ok) return rejection(location.errors.join('; '));

    return {
      ok: true,
      plan: Object.freeze({
        routeId: route.id,
        boatId: route.boatId,
        durationFrames: route.durationFrames,
        origin: Object.freeze({ ...route.endpoints[fromIndex] }),
        destination: Object.freeze({ ...destination }),
        direction: fromIndex === 0 ? 'east' : 'west',
        visual: Object.freeze({ ...route.visual }),
      }),
    };
  }

  function releaseInput() {
    if (typeof reconcileWaterTravelKeys === 'function') reconcileWaterTravelKeys();
    player.moving = false;
  }

  function fail(message) {
    const failed = session;
    diagnostic = Object.freeze({
      routeId: failed ? failed.plan.routeId : null,
      frame: failed ? failed.frame : null,
      message: String(message || 'water travel failed'),
    });
    session = null;
    releaseInput();
    return false;
  }

  function start(routeId) {
    const prepared = prepare(routeId);
    if (!prepared.ok) return false;
    diagnostic = null;
    if (typeof resetInputForWaterTravel === 'function') resetInputForWaterTravel();
    player.moving = false;
    session = { plan: prepared.plan, frame: 0, arrivalAttempted: false };
    return true;
  }

  function update() {
    if (!session) return false;
    const current = session;
    try {
      if (activeMapId() !== current.plan.origin.mapId) return fail('departure location changed during travel');
      current.frame++;
      if (current.frame < current.plan.durationFrames) return true;
      if (current.arrivalAttempted) return fail('arrival callback repeated');
      current.arrivalAttempted = true;
      const destination = current.plan.destination;
      const arrived = transitionToLocation({
        mapId: destination.mapId,
        x: destination.x,
        y: destination.y,
        facing: destination.facing,
        cooldown: true,
      });
      if (!arrived) return fail('arrival transition rejected');
      session = null;
      diagnostic = null;
      releaseInput();
      return true;
    } catch (error) {
      return fail(error && error.message ? error.message : error);
    }
  }

  function getView() {
    if (!session) return null;
    const plan = session.plan;
    const progress = Math.min(1, session.frame / plan.durationFrames);
    const visualStart = plan.direction === 'east' ? plan.visual.startX : plan.visual.endX;
    const visualEnd = plan.direction === 'east' ? plan.visual.endX : plan.visual.startX;
    return Object.freeze({
      active: true,
      owner: 'water_travel',
      routeId: plan.routeId,
      boatId: plan.boatId,
      direction: plan.direction,
      frame: session.frame,
      durationFrames: plan.durationFrames,
      progress,
      x: Math.round(visualStart + (visualEnd - visualStart) * progress),
      y: plan.visual.y + [0, 0, -1, -1, 0, 0, 1, 1][session.frame & 7],
      originMapId: plan.origin.mapId,
      destinationMapId: plan.destination.mapId,
    });
  }

  return Object.freeze({
    start,
    update,
    isActive() { return session !== null; },
    blocksInput() { return session !== null; },
    blocksSaveLoad() { return session !== null; },
    getView,
    getLastDiagnostic() { return diagnostic; },
    validate(routeId) { return prepare(routeId).ok; },
    emergencyAbort(message) { return session ? fail(message) : false; },
    reset() {
      session = null;
      diagnostic = null;
      player.moving = false;
      if (typeof resetInputForWaterTravel === 'function') resetInputForWaterTravel();
    },
  });
})();

if (typeof window !== 'undefined') {
  window.WATER_TRAVEL_ROUTES = WATER_TRAVEL_ROUTES;
  window.waterTravelController = waterTravelController;
}
