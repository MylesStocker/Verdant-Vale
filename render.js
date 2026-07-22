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
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      drawTile(activeMap[r][c], c * TILE, r * TILE);
    }
  }

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
  if (inMireVault && !MIRE_VAULT_CHEST.opened) drawChest(MIRE_VAULT_CHEST);
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
  if (inTown && townBuilding === 'provision_store')   drawProvisionStoreFurniture();
  if (inTown && townBuilding === 'guild_hall')        drawGuildHallFurniture();
  if (inSluice) drawSluiceGateHint();
  if (activeMap === MAP4) drawThornmereStone();
  if (activeMap === MAP_N2) drawDrenwichNorthGateHint();
  drawPlayer();

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

