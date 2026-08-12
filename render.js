'use strict';

// render.js — pre-computed vignette gradient and the top-level render()
// orchestrator that draws the world, entities, and overlays each frame.

// ─── Pre-computed vignette ────────────────────────────────────────────────────
const vignette = (function() {
  const g = ctx.createRadialGradient(256, 240, 150, 256, 240, 340);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.42)');
  return g;
})();

// Stable debug void colour behind the continuous terrain. Camera clamping keeps
// the viewport inside the region's rectangular pixel bounds, so this shows through
// only at SPARSE UNPLACED cells within that envelope (gaps in the sparse grid) —
// not "beyond the region": the clamp makes outside-the-rectangle unreachable for
// any region larger than the 512×480 viewport (the overworld is 2560×2880).
const CONTINUOUS_VOID_COLOR = '#0a0a12';

// Is the DEBUG continuous-view path active RIGHT NOW? Only when the toggle is on
// AND the current physical map is placed in REGIONAL_LAYOUT under regionId
// 'overworld'. Every non-placed map (towns, interiors, dungeons, bridge, special
// maps, the hidden meadow) returns false and uses the legacy renderer even with
// the flag on. Never consulted in combat (render() returns before the world
// section when combat.active).
function continuousWorldViewActive() {
  if (!continuousWorldViewEnabled) return false;
  const id = (typeof mapIdForRef === 'function') ? mapIdForRef(activeMap) : null;
  if (!id) return false;
  const p = (typeof regionPlacementForMapId === 'function') ? regionPlacementForMapId(id) : null;
  return !!(p && p.regionId === 'overworld');
}

// The current active map's existing world content, in its EXACT legacy draw order
// (items, furniture, NPCs, special entities, landmarks, hints, then the player).
// Drawn using the active map's own LOCAL coordinates — unchanged. In legacy mode
// it is called with no transform (pixel-identical to before); in continuous mode
// the caller translates into the active chunk's world origin first. This helper
// is a pure extraction of render()'s former inline block — same calls, same order.
function drawActiveMapContent() {
  drawWorldItems();
  if (inTown && townBuilding === 'office' && currentTownId === 'calwick')  drawOfficeFurniture();
  if (inTown && townBuilding === 'office' && currentTownId === 'drenwick') drawDrenwickOfficeFurniture();
  if (inTown && townBuilding === 'school' && currentTownId !== 'drenwick') drawSchoolFurniture();
  if (inTown && currentTownId === 'drenwick' &&
      (activeMap === DRENWICK_SCHOOL_GROUND_MAP || activeMap === DRENWICK_SCHOOL_UPPER_MAP || activeMap === DRENWICK_SCHOOL_BASEMENT_MAP))
    drawDrenwichSchoolFurniture();
  if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_MARKET_MAP) {
    drawGuildDoor(5 * TILE, 2 * TILE);
    drawGuildInsignia(5 * TILE, 1 * TILE);
    drawDrenwwickMarketStalls();
  }
  if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_CIVIC_MAP) {
    drawDrenwwickCustomsArch();
  }
  if (inMireVault) drawMireVaultPillars();
  if (inDungeonEntrance) drawSouthRuinsEntranceDecor();
  if (inTakomo && !TAKOMO.defeated) drawTakomo();
  if (inSunkenGallery) drawSunkenGalleryFeatures();
  if (inSunkenGallery && activeMap === SUNKEN_GALLERY_R2C4 && !SUNKEN_GALLERY_CHEST.opened) drawChest(SUNKEN_GALLERY_CHEST);
  if (inTown) drawSupervisorSprite();
  if (inTown) drawEslaSprite();
  drawSimpleNPCs();
  if (inDungeon && dungeonFloor === 4 && !MULHOLLAND.defeated) drawMulholland();
  if (inDungeon && dungeonFloor === 5)   drawBoss();
  if (inTown && townBuilding === 'house' && currentHouseId === 'west_i' && den_wraith_quest_started && !den_wraith_defeated) drawDenWraith();
  if (!inDungeon && !inTown && activeMap === MEADOW_MAP) {
    drawBriarWarden();                                       // self-gates on quest state
    if (!MEADOW_CHEST.opened) drawChest(MEADOW_CHEST);
  }
  if (inTown && !townBuilding)           drawNoticeBoardHint();
  if (inTown && !townBuilding && currentTownId === 'drenwick' && activeMap === DRENWICK_WATERFRONT_MAP)
    drawDrenwichFishingSpot();
  if (inTown && !townBuilding)           drawMerchantSprite();
  if (inTown && !townBuilding)           drawTravellerSprite();
  if (inTown && townBuilding === 'inn')    drawInnTables();
  if (inTown && townBuilding === 'inn' && currentTownId !== 'drenwick') drawInnkeeper();
  if (inTown && townBuilding === 'inn' && currentTownId === 'drenwick') drawDrenwichInnkeeper();
  if (inTown && currentTownId === 'drenwick' && activeMap === DRENWICK_TAVERN_MAP && townBuilding === 'tavern')
    drawDrenwichTavernFurniture();
  if (inTown && townBuilding === 'house')             drawHouseFurniture();
  if (inTown && townBuilding === 'house' && currentHouseId === 'player_house' && day >= 2 && !CAT_ARMOR_CHEST.opened) drawInvisibleChest(CAT_ARMOR_CHEST);
  if (inHamletInterior)                              drawHamletInteriorFurniture();
  if (inFenBrewery)                                  drawFenBreweryFurniture();
  if (inTown && townBuilding === 'harbormaster')      drawHarbormasterFurniture();
  if (inTown && townBuilding === 'wash_house')        drawWashHouseFurniture();
  if (inTown && townBuilding === 'infirmary' && currentTownId === 'drenwick') drawInfirmaryFurniture();
  if (inTown && townBuilding === 'provision_store')   drawProvisionStoreFurniture();
  if (inTown && townBuilding === 'guild_hall')        drawGuildHallFurniture();
  if (inSluice) drawSluiceGateHint();
  if (activeMap === MAP4) drawThornmereStone();
  if (activeMap === MAP_N2) drawDrenwichNorthGateHint();
  drawPlayer();
}

// Continuous-view world render (DEBUG prototype): fill the void, then draw every
// visible placed chunk's terrain ONCE at its stable region-world pixel origin
// under a single camera transform, then the active map's content at its chunk
// origin, then restore before any screen-space layer. The camera is applied ONLY
// as ctx.translate — never subtracted from tile coordinates — so procedural tile
// patterns receive stable world coords and don't crawl as the camera moves.
// Draw order under the camera transform: (1) all visible terrain, row-major; (2)
// each NEIGHBOUR chunk's READ-ONLY outdoor content (items/NPCs/landmarks), row-
// major; (3) the ACTIVE chunk's full content + player LAST, at its world origin,
// so the active layering (and player-on-top) is preserved exactly. Neighbour
// content is read-only — no updates/interactions/collection/triggers; activeMap
// remains the behaviour authority (see continuous-content.js).
function drawContinuousWorld() {
  ctx.fillStyle = CONTINUOUS_VOID_COLOR;
  ctx.fillRect(0, 0, 512, 480);

  const plan = buildContinuousWorldPlan('overworld', mapIdForRef(activeMap), player.x, player.y, 512, 480);
  if (!plan) { drawMapTiles(activeMap); drawActiveMapContent(); return; } // defensive; active map is placed
  const activeId = plan.activeMapId;

  ctx.save();
  ctx.translate(-plan.camPxX, -plan.camPxY);          // camera as a SEPARATE transform
  // (1) terrain — each placed chunk once, row-major.
  for (const ch of plan.visibleChunks) {
    const chunkMap = mapRefForId(ch.mapId);
    if (!chunkMap) continue;
    drawMapTiles(chunkMap, ch.worldPxX, ch.worldPxY,  // stable world-pixel origin; NOT camera-relative
      { startCol: ch.startCol, endCol: ch.endCol, startRow: ch.startRow, endRow: ch.endRow });
  }
  // (2) neighbour outdoor content — each NON-active placed chunk once, row-major,
  //     at its stable world origin (read-only; no player, no active-only hints).
  if (typeof drawNeighbourOutdoorContent === 'function') {
    for (const ch of plan.visibleChunks) {
      if (ch.mapId === activeId) continue;
      ctx.save();
      ctx.translate(ch.worldPxX, ch.worldPxY);
      drawNeighbourOutdoorContent(outdoorChunkContentContext(ch.mapId, false));
      ctx.restore();
    }
  }
  // (3) active map's full content + player LAST, at the active chunk's world origin.
  ctx.save();
  ctx.translate(plan.activePlacement.chunkX * COLS * TILE, plan.activePlacement.chunkY * ROWS * TILE);
  drawActiveMapContent();
  ctx.restore();
  // (4) cross-seam interaction prompt — at most ONE SPACE hint above the neighbour
  //     NPC the interact press would target, still inside the camera transform so
  //     the NPC's world-pixel position maps to screen. Read-only.
  if (typeof drawCrossSeamInteractPrompt === 'function') drawCrossSeamInteractPrompt();
  ctx.restore();                                        // back to screen space before UI
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
  titleEl.textContent = locationName();

  if (combat.active) {
    // Combat screen replaces the world entirely
    drawCombat();
    tick++;
    return;
  }

  // ── World (overworld or dungeon) ───────────────────────────────────────────
  if (continuousWorldViewActive()) {
    // DEBUG continuous scrolling camera (placed overworld maps only).
    drawContinuousWorld();
  } else {
    // Legacy path — pixel-identical to before: full-map terrain at origin (0,0),
    // no camera transform, then the active map's content in its exact order.
    drawMapTiles(activeMap);
    drawActiveMapContent();
  }

  // ── Screen-space layers (fixed to the viewport, OUTSIDE any camera transform) ──
  // No vignette in the dream — the white is meant to be total. Same in the
  // unmarked chamber — flat light with no darkened corners is part of the
  // room's wrongness (see BASIN_CHAMBER_MAP, maps.js).
  if (activeMap !== DREAM_MAP && activeMap !== BASIN_CHAMBER_MAP) {
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 512, 480);
  }

  drawDialogue();
  drawChoice();
  drawShop();
  drawContinentMapPanel();
  drawAccordPanel();
  drawMenu();
  drawDebugMenu();
  drawWarpMenu();

  // ── World toast (non-blocking auto-fade) ──────────────────────────────────
  if (worldToastTimer > 0 && !dialogue.open && !menu.open && !choice.open) {
    const alpha = Math.min(1, worldToastTimer / 25);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 12px "Courier New", monospace';
    const tw = ctx.measureText(worldToast).width + 20;
    const tx = Math.round((512 - tw) / 2);
    ctx.fillStyle = 'rgba(10, 10, 10, 0.75)';
    ctx.fillRect(tx, 198, tw, 24);
    ctx.fillStyle = '#e8c060';
    ctx.textAlign = 'center';
    ctx.fillText(worldToast, 256, 214);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  // ── Debug menu hint (overworld only, no overlays active) ──────────────────
  if (!menu.open && !dialogue.open && !shop.open && !choice.open && !debugMenu.open) {
    ctx.fillStyle = 'rgba(80,120,100,0.45)';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[ ` ] debug', 508, 476);
    ctx.textAlign = 'left';
  }

  // ── Debug map inspector overlay (drawn last, on top of everything) ────────
  drawDebugInspector();

  tick++;
}

