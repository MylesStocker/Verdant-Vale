'use strict';

// render-tiles.js — per-cell base tile rendering: grass/water/path/tree,
// dungeon floors 1-3, the horror branch, town tiles, sluice tiles, and the
// drawTile() dispatcher used once per grid cell every frame.

function drawGrass(x, y) {
  // Subtle checkerboard base — adjacent tiles use slightly different greens
  const alt = ((Math.floor(x / TILE) ^ Math.floor(y / TILE)) & 1);
  ctx.fillStyle = alt ? '#4e6a3c' : '#496438';
  ctx.fillRect(x, y, TILE, TILE);

  // Light blade tufts with pale tips
  ctx.fillStyle = '#5e7a48';
  ctx.fillRect(x +  2, y +  7, 5, 4);
  ctx.fillRect(x + 18, y + 21, 5, 4);
  ctx.fillRect(x + 11, y + 13, 4, 4);
  ctx.fillRect(x + 26, y +  3, 4, 3);
  ctx.fillStyle = '#6e8c54';  // pale tip highlight
  ctx.fillRect(x +  3, y +  6, 3, 2);
  ctx.fillRect(x + 19, y + 20, 3, 2);
  ctx.fillRect(x + 12, y + 12, 2, 2);
  ctx.fillRect(x + 27, y +  2, 2, 2);

  // Mid-tone accent blades
  ctx.fillStyle = '#567040';
  ctx.fillRect(x + 14, y +  5, 3, 5);
  ctx.fillRect(x +  7, y + 17, 3, 5);
  ctx.fillRect(x + 23, y + 18, 3, 4);

  // Dark flecks — soil showing through
  ctx.fillStyle = '#38501e';
  ctx.fillRect(x +  8, y +  4, 3, 2);
  ctx.fillRect(x + 22, y + 13, 3, 2);
  ctx.fillRect(x +  4, y + 25, 2, 2);
  ctx.fillRect(x + 16, y + 28, 2, 2);
  ctx.fillRect(x + 29, y + 11, 2, 2);
}

function drawWater(x, y) {
  // 4-frame animation: ripples bob and sparkle shifts — ~7.5 Hz
  const frame = (tick >> 3) & 3;
  // Base colour alternates between two depths
  ctx.fillStyle = (frame & 1) ? '#2e4860' : '#324f68';
  ctx.fillRect(x, y, TILE, TILE);

  // Ripple bands — offset vertically each frame so they gently bob
  const yo = [0, 1, 1, 0][frame];
  ctx.fillStyle = (frame & 1) ? '#3a5878' : '#3e5c7c';
  ctx.fillRect(x +  4, y +  6 + yo,  13, 2);
  ctx.fillRect(x + 21, y +  6 + yo,   7, 2);
  ctx.fillRect(x +  6, y + 17 - yo,  15, 2);
  ctx.fillRect(x +  2, y + 26 + yo,   8, 2);
  ctx.fillRect(x + 18, y + 26 - yo,   9, 2);

  // Bright sparkle highlight — cycles position each frame
  const sx = [10, 22,  6, 18][frame];
  const sy = [ 3, 14, 22, 10][frame];
  ctx.fillStyle = '#5a7898';
  ctx.fillRect(x + sx, y + sy, 3, 1);
  ctx.fillStyle = '#7090b0';
  ctx.fillRect(x + sx + 1, y + sy, 1, 1);  // brightest pixel

  // Dark depth edges
  ctx.fillStyle = '#1e3448';
  ctx.fillRect(x, y, TILE, 1);
  ctx.fillRect(x, y, 1, TILE);
}

function drawPath(x, y) {
  // Base dirt — alternates subtly for worn/compacted variation
  const alt = ((Math.floor(x / TILE) + Math.floor(y / TILE)) & 1);
  ctx.fillStyle = alt ? '#7a6c50' : '#746650';
  ctx.fillRect(x, y, TILE, TILE);

  // Worn track — slightly lighter centre strip
  ctx.fillStyle = '#887868';
  ctx.fillRect(x + 8, y, 16, TILE);

  // Dark pebbles
  ctx.fillStyle = '#5c5038';
  ctx.fillRect(x +  6, y +  4, 4, 2);
  ctx.fillRect(x + 20, y + 10, 4, 2);
  ctx.fillRect(x + 10, y + 20, 3, 2);
  ctx.fillRect(x + 25, y + 24, 4, 2);
  ctx.fillRect(x +  3, y + 14, 3, 2);
  // Light pebble highlights
  ctx.fillStyle = '#998070';
  ctx.fillRect(x + 15, y +  8, 3, 2);
  ctx.fillRect(x +  4, y + 18, 3, 2);
  ctx.fillRect(x + 28, y + 14, 2, 2);
  ctx.fillRect(x + 12, y + 28, 3, 2);
  // Tiny dust flecks
  ctx.fillStyle = '#a09080';
  ctx.fillRect(x + 22, y +  5, 2, 1);
  ctx.fillRect(x +  8, y + 26, 2, 1);
}

function drawTree(x, y) {
  // Dark mulch floor with ground shadow
  ctx.fillStyle = '#1e261a';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#161e10';
  ctx.fillRect(x + 9, y + 19, 14, 13);  // trunk-base shadow

  // Trunk — with lit left edge and shadow right edge
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(x + 13, y + 20, 6, 11);
  ctx.fillStyle = '#614030';  // lit left
  ctx.fillRect(x + 13, y + 20, 2, 11);
  ctx.fillStyle = '#341a0c';  // shadow right
  ctx.fillRect(x + 17, y + 20, 2, 11);

  // Foliage — 4 tiers; shadow on right side of each
  // Bottom tier (widest, darkest)
  ctx.fillStyle = '#213918';
  ctx.fillRect(x +  3, y + 15, 26, 8);
  ctx.fillStyle = '#182e10';  // shadow right
  ctx.fillRect(x + 22, y + 15,  7, 8);
  // Mid tier
  ctx.fillStyle = '#2c5020';
  ctx.fillRect(x +  5, y +  9, 22, 8);
  ctx.fillStyle = '#213c18';  // shadow right
  ctx.fillRect(x + 20, y +  9,  7, 8);
  // Upper tier
  ctx.fillStyle = '#345c26';
  ctx.fillRect(x +  8, y +  4, 16, 7);
  ctx.fillStyle = '#284818';  // shadow right
  ctx.fillRect(x + 18, y +  4,  6, 7);
  // Tip
  ctx.fillStyle = '#3c6a2c';
  ctx.fillRect(x + 11, y +  2, 10, 4);
  ctx.fillStyle = '#4a7e36';  // tip highlight
  ctx.fillRect(x + 13, y +  1,  6, 3);

  // Left-side sunlight highlights on each tier
  ctx.fillStyle = '#3e6a2e';
  ctx.fillRect(x +  3, y + 15, 3, 8);
  ctx.fillRect(x +  5, y +  9, 3, 8);
  ctx.fillRect(x +  8, y +  4, 3, 7);
}

function drawDungeonFloor(x, y) {
  // Base stone — slightly varied per tile position
  const alt = ((Math.floor(x / TILE) ^ Math.floor(y / TILE)) & 1);
  ctx.fillStyle = alt ? '#1a1420' : '#181222';
  ctx.fillRect(x, y, TILE, TILE);

  // Stone slab grid (two slabs per tile, offset like real stonework)
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  const offset = (row & 1) ? 16 : 0;
  ctx.fillStyle = '#221a2c';
  ctx.fillRect(x + offset,        y,     16, 1);   // horizontal joint
  ctx.fillRect(x + offset + 16,   y,     16, 1);
  ctx.fillRect(x,                  y,      1, TILE); // vertical joint left
  ctx.fillRect(x + ((offset + 16) % TILE), y, 1, TILE);  // vertical joint mid

  // Slab surface shading
  ctx.fillStyle = '#1e1828';
  ctx.fillRect(x + 2 + offset,       y + 2,  12, 13);
  ctx.fillRect(x + 2 + ((offset + 16) % TILE), y + 2,  12, 13);

  // Damp patches — small dark blotches for atmosphere
  ctx.fillStyle = '#100e18';
  ctx.fillRect(x + 26, y +  6, 4, 3);
  ctx.fillRect(x +  6, y + 22, 3, 4);

  // Occasional pale mineral fleck
  if ((col * 7 + row * 13) % 5 === 0) {
    ctx.fillStyle = '#2c2438';
    ctx.fillRect(x + 14, y + 14, 3, 2);
  }
}

function drawDungeonWall(x, y) {
  ctx.fillStyle = '#0a0810';
  ctx.fillRect(x, y, TILE, TILE);

  // Offset stonework — alternating row offsets like real masonry
  const row = Math.floor(y / TILE);
  const off = (row & 1) ? 8 : 0;

  // Four rough stone blocks per tile
  ctx.fillStyle = '#16121e';
  ctx.fillRect(x + off,        y + 1, 14, 14);
  ctx.fillRect(x + off + 16,   y + 1, 14, 14);
  ctx.fillRect(x + off,        y + 17, 14, 13);
  ctx.fillRect(x + off + 16,   y + 17, 14, 13);

  // Top-left highlight on each block (dim light source above)
  ctx.fillStyle = '#221a2e';
  ctx.fillRect(x + off,       y + 1,  14, 1);
  ctx.fillRect(x + off,       y + 1,   1, 14);
  ctx.fillRect(x + off + 16,  y + 1,  14, 1);
  ctx.fillRect(x + off + 16,  y + 1,   1, 14);
  ctx.fillRect(x + off,       y + 17, 14, 1);
  ctx.fillRect(x + off,       y + 17,  1, 13);
  ctx.fillRect(x + off + 16,  y + 17, 14, 1);
  ctx.fillRect(x + off + 16,  y + 17,  1, 13);

  // Crack detail — thin dark lines crossing blocks
  ctx.fillStyle = '#08060c';
  const col = Math.floor(x / TILE);
  if ((col + row) % 3 === 0) {
    ctx.fillRect(x + off + 3,  y + 5,  1, 8);
  }
  if ((col * 3 + row * 2) % 5 === 0) {
    ctx.fillRect(x + off + 17, y + 20, 6, 1);
  }
}

function drawDungeonEntrance(x, y) {
  // Stone floor with a glowing downward staircase symbol
  drawDungeonFloor(x, y);
  // Stairs outline
  ctx.fillStyle = '#2a1e3a';
  ctx.fillRect(x +  8, y + 10, 16, 12);
  // Step lines
  ctx.fillStyle = '#3c2c50';
  ctx.fillRect(x +  8, y + 10,  16, 3);
  ctx.fillRect(x + 10, y + 13,  12, 3);
  ctx.fillRect(x + 12, y + 16,   8, 3);
  ctx.fillRect(x + 14, y + 19,   4, 3);
  // Purple glow
  ctx.fillStyle = 'rgba(100, 50, 180, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Overworld entrance tile — drawn on the world map (brighter version)
function drawEntranceTile(x, y) {
  drawPath(x, y);  // use path tile as base
  // Downward arrow / portal indicator
  ctx.fillStyle = '#6030a0';
  ctx.fillRect(x + 13, y +  6,  6, 14);
  ctx.fillRect(x +  9, y + 14, 14,  6);
  ctx.fillRect(x + 11, y + 20,  4,  6);
  // Glow
  ctx.fillStyle = 'rgba(120, 60, 200, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 13, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  // Label
  ctx.fillStyle = '#c090ff';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25bc', x + 16, y + 10);
  ctx.textAlign = 'left';
}

function drawDungeonExit(x, y) {
  // Stone floor with an upward staircase symbol
  drawDungeonFloor(x, y);
  // Stairs outline
  ctx.fillStyle = '#1a3028';
  ctx.fillRect(x +  8, y + 10, 16, 12);
  // Step lines (ascending)
  ctx.fillStyle = '#2a5040';
  ctx.fillRect(x + 14, y + 10,  4,  3);
  ctx.fillRect(x + 12, y + 13,  8,  3);
  ctx.fillRect(x + 10, y + 16, 12,  3);
  ctx.fillRect(x +  8, y + 19, 16,  3);
  // Green glow
  ctx.fillStyle = 'rgba(30, 180, 100, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Dungeon 2 tile drawing ───────────────────────────────────────────────────

function drawDungeon2Floor(x, y) {
  // Darker, colder stone — deep violet-black
  ctx.fillStyle = '#080610';
  ctx.fillRect(x, y, TILE, TILE);
  // Tile grid lines (barely visible)
  ctx.fillStyle = '#0e0a18';
  ctx.fillRect(x,     y,     TILE, 1);
  ctx.fillRect(x,     y,     1, TILE);
  // Surface cracking
  ctx.fillStyle = '#0c0a16';
  ctx.fillRect(x + 3,  y + 5,  12, 8);
  ctx.fillRect(x + 19, y + 17, 10, 7);
  ctx.fillStyle = '#060410';
  ctx.fillRect(x + 24, y +  4,  4, 4);
  ctx.fillRect(x +  5, y + 22,  4, 4);
  // Faint void-crack highlights
  ctx.fillStyle = '#1a0e28';
  ctx.fillRect(x + 8,  y + 14, 6, 1);
  ctx.fillRect(x + 20, y + 8,  4, 1);
}

function drawDungeon2Wall(x, y) {
  // Near-black with faint violet seam
  ctx.fillStyle = '#040208';
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = '#080412';
  ctx.fillRect(x + 2,  y + 2,  13, 13);
  ctx.fillRect(x + 17, y + 2,  13, 13);
  ctx.fillRect(x + 2,  y + 17, 13, 13);
  ctx.fillRect(x + 17, y + 17, 13, 13);
  // Faint edge highlight
  ctx.fillStyle = '#100818';
  ctx.fillRect(x + 2,  y + 2,  13, 1);
  ctx.fillRect(x + 17, y + 2,  13, 1);
  ctx.fillRect(x + 2,  y + 17, 13, 1);
  ctx.fillRect(x + 17, y + 17, 13, 1);
}

// Stairs down — ominous red/orange glow, on dungeon-1 floor
function drawStairsDown(x, y) {
  drawDungeonFloor(x, y);
  ctx.fillStyle = '#2e0e08';
  ctx.fillRect(x +  8, y + 10, 16, 12);
  // Step lines descending
  ctx.fillStyle = '#501808';
  ctx.fillRect(x +  8, y + 10, 16,  3);
  ctx.fillRect(x + 10, y + 13, 12,  3);
  ctx.fillRect(x + 12, y + 16,  8,  3);
  ctx.fillRect(x + 14, y + 19,  4,  3);
  // Red glow
  ctx.fillStyle = 'rgba(200, 60, 20, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Down arrow label
  ctx.fillStyle = '#e04020';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25bc\u25bc', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// Stairs up — dim teal glow, on dungeon-2 floor
function drawDungeon2StairsUp(x, y) {
  drawDungeon2Floor(x, y);
  ctx.fillStyle = '#081a18';
  ctx.fillRect(x +  8, y + 10, 16, 12);
  // Step lines ascending
  ctx.fillStyle = '#103028';
  ctx.fillRect(x + 14, y + 10,  4,  3);
  ctx.fillRect(x + 12, y + 13,  8,  3);
  ctx.fillRect(x + 10, y + 16, 12,  3);
  ctx.fillRect(x +  8, y + 19, 16,  3);
  // Dim teal glow
  ctx.fillStyle = 'rgba(20, 140, 100, 0.20)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Up arrow label
  ctx.fillStyle = '#308870';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25b2', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// Overworld exit on dungeon-2 floor — same visual as drawDungeonExit but
// rendered on the darker d2 base
function drawDungeon2Exit(x, y) {
  drawDungeon2Floor(x, y);
  ctx.fillStyle = '#081a18';
  ctx.fillRect(x +  8, y + 10, 16, 12);
  ctx.fillStyle = '#103028';
  ctx.fillRect(x + 14, y + 10,  4,  3);
  ctx.fillRect(x + 12, y + 13,  8,  3);
  ctx.fillRect(x + 10, y + 16, 12,  3);
  ctx.fillRect(x +  8, y + 19, 16,  3);
  ctx.fillStyle = 'rgba(30, 180, 100, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ─── South Ruins — Entrance Hall Tile Drawing ─────────────────────────────────
// Distinct from the rest of the dungeon on purpose: this is daylight, not the
// dark below. Pale, weathered, water-stained stone — the top floor of a ruin
// that spent most of its life half-submerged and has only recently dried out.

function drawRuinFloor(x, y) {
  // Base stone — pale, weathered, faintly green with age and damp
  const alt = ((Math.floor(x / TILE) ^ Math.floor(y / TILE)) & 1);
  ctx.fillStyle = alt ? '#4a5648' : '#485242';
  ctx.fillRect(x, y, TILE, TILE);

  // Stone slab grid (same joint pattern as the deep dungeon, lighter colour)
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  const offset = (row & 1) ? 16 : 0;
  ctx.fillStyle = '#3a4638';
  ctx.fillRect(x + offset,        y,     16, 1);
  ctx.fillRect(x + offset + 16,   y,     16, 1);
  ctx.fillRect(x,                  y,      1, TILE);
  ctx.fillRect(x + ((offset + 16) % TILE), y, 1, TILE);

  // Old waterline stain — a pale tidemark ring left by the water that used to
  // sit here, now just a dry ghost of where the flood reached
  if ((col * 5 + row * 7) % 4 === 0) {
    ctx.fillStyle = 'rgba(150, 160, 130, 0.20)';
    ctx.fillRect(x + 3, y + 24, 26, 2);
  }

  // Moss patches — the only green left in a drying building
  ctx.fillStyle = '#3a5a30';
  ctx.fillRect(x + 24, y +  5, 5, 4);
  ctx.fillRect(x +  4, y + 20, 4, 5);

  // Hairline cracks
  ctx.fillStyle = '#2a3324';
  if ((col + row) % 3 === 0) ctx.fillRect(x + offset + 5, y + 4, 1, 9);
}

function drawRuinWall(x, y) {
  ctx.fillStyle = '#302e28';
  ctx.fillRect(x, y, TILE, TILE);

  // Offset ornate stonework — larger, squarer blocks than the deep dungeon's
  const row = Math.floor(y / TILE);
  const off = (row & 1) ? 8 : 0;
  ctx.fillStyle = '#403c34';
  ctx.fillRect(x + off,        y + 1, 14, 14);
  ctx.fillRect(x + off + 16,   y + 1, 14, 14);
  ctx.fillRect(x + off,        y + 17, 14, 13);
  ctx.fillRect(x + off + 16,   y + 17, 14, 13);

  // Weathered highlight (this level still gets daylight)
  ctx.fillStyle = '#54503e';
  ctx.fillRect(x + off,       y + 1,  14, 1);
  ctx.fillRect(x + off + 16,  y + 1,  14, 1);
  ctx.fillRect(x + off,       y + 17, 14, 1);
  ctx.fillRect(x + off + 16,  y + 17, 14, 1);

  // Damp streaks — old waterline running down the stone from above
  ctx.fillStyle = 'rgba(90, 110, 90, 0.30)';
  const col = Math.floor(x / TILE);
  if ((col + row) % 2 === 0) ctx.fillRect(x + off + 4, y + 2, 2, 26);

  // Crumbled corner — a chunk of masonry missing, rubble implied below it
  ctx.fillStyle = '#221f1a';
  if ((col * 3 + row) % 5 === 0) ctx.fillRect(x + off + 17, y + 19, 6, 5);

  // Moss creeping up from the base
  ctx.fillStyle = '#345028';
  ctx.fillRect(x + off + 1, y + 27, 5, 3);
}

// Stairs down — leads into the dark, flooded dungeon proper. Cool blue-green
// glow (water still down there), on the ruin-hall floor base.
function drawRuinStairsDown(x, y) {
  drawRuinFloor(x, y);
  ctx.fillStyle = '#182420';
  ctx.fillRect(x +  8, y + 10, 16, 12);
  ctx.fillStyle = '#243830';
  ctx.fillRect(x +  8, y + 10, 16,  3);
  ctx.fillRect(x + 10, y + 13, 12,  3);
  ctx.fillRect(x + 12, y + 16,  8,  3);
  ctx.fillRect(x + 14, y + 19,  4,  3);
  ctx.fillStyle = 'rgba(40, 130, 140, 0.20)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#40a8b0';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25bc\u25bc', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// Exit — the way back out to daylight and the overworld. Warm pale glow, on
// the ruin-hall floor base.
function drawRuinExit(x, y) {
  drawRuinFloor(x, y);
  ctx.fillStyle = '#2c2a1c';
  ctx.fillRect(x +  8, y + 10, 16, 12);
  ctx.fillStyle = '#463f2a';
  ctx.fillRect(x + 14, y + 10,  4,  3);
  ctx.fillRect(x + 12, y + 13,  8,  3);
  ctx.fillRect(x + 10, y + 16, 12,  3);
  ctx.fillRect(x +  8, y + 19, 16,  3);
  ctx.fillStyle = 'rgba(220, 200, 140, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 12, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e0c878';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25b2', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// ─── Horror Branch Tile Drawing ───────────────────────────────────────────────

// Glutinous wet horror floor — biological, dripping, barely stone
function drawDungeon3Floor(x, y) {
  ctx.fillStyle = '#040a03';
  ctx.fillRect(x, y, TILE, TILE);
  // Wet glistening patches
  ctx.fillStyle = '#0c1a08';
  ctx.fillRect(x + 4,  y + 5,  9, 7);
  ctx.fillRect(x + 19, y + 16, 8, 6);
  ctx.fillStyle = '#061208';
  ctx.fillRect(x + 2,  y + 20, 5, 4);
  ctx.fillRect(x + 24, y +  8, 4, 3);
  // Bioluminescent glints (pale sickly green)
  ctx.fillStyle = '#2a5a10';
  ctx.fillRect(x + 7,  y + 8,  2, 1);
  ctx.fillRect(x + 22, y + 20, 2, 1);
  ctx.fillRect(x + 15, y + 25, 1, 1);
  // Dark reflective drip pool
  ctx.fillStyle = '#081408';
  ctx.fillRect(x + 12, y + 14, 6, 3);
}

// Organic dripping horror wall — glutinous, alive-feeling
function drawDungeon3Wall(x, y) {
  ctx.fillStyle = '#020402';
  ctx.fillRect(x, y, TILE, TILE);
  // Tendril lumps — dark green-brown organic masses
  ctx.fillStyle = '#0c1406';
  ctx.fillRect(x + 2,  y + 2,  12, 11);
  ctx.fillRect(x + 18, y + 3,  11, 10);
  ctx.fillRect(x + 3,  y + 18, 10, 11);
  ctx.fillRect(x + 19, y + 17, 11, 12);
  // Darker centres (deeper mass)
  ctx.fillStyle = '#060a04';
  ctx.fillRect(x + 4,  y + 4,  8,  7);
  ctx.fillRect(x + 20, y + 5,  7,  6);
  ctx.fillRect(x + 5,  y + 20, 6,  7);
  ctx.fillRect(x + 21, y + 19, 7,  8);
  // Drip streaks running down the face
  ctx.fillStyle = '#1a3a0a';
  ctx.fillRect(x + 6,  y + 12, 1, 9);
  ctx.fillRect(x + 14, y + 10, 1, 7);
  ctx.fillRect(x + 24, y + 14, 1, 8);
  // Bioluminescent spots where drips pool
  ctx.fillStyle = '#3a6818';
  ctx.fillRect(x + 6,  y + 20, 2, 2);
  ctx.fillRect(x + 24, y + 22, 2, 2);
}

// Horror branch door — dungeon2 floor with a sinister organic crack/opening
// Floor-3 passage tiles — amber arch, directional arrow, walkable corridor
function drawD3EastPassage(x, y) {
  drawDungeonFloor(x, y);
  // Dark opening in the right wall
  ctx.fillStyle = '#0c0808';
  ctx.fillRect(x + 14, y + 6, 18, 20);
  ctx.fillStyle = '#181010';
  ctx.fillRect(x + 16, y + 8, 14, 16);
  // Amber arch frame (left side of opening)
  ctx.fillStyle = '#604018';
  ctx.fillRect(x + 12, y + 6, 3, 20);
  // Amber glow through passage
  ctx.fillStyle = 'rgba(140, 90, 20, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + 26, y + 16, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c08030';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25ba', x + 24, y + 20);
  ctx.textAlign = 'left';
}

function drawD3WestPassage(x, y) {
  drawDungeonFloor(x, y);
  // Dark opening in the left wall
  ctx.fillStyle = '#0c0808';
  ctx.fillRect(x, y + 6, 18, 20);
  ctx.fillStyle = '#181010';
  ctx.fillRect(x + 2, y + 8, 14, 16);
  // Amber arch frame (right side of opening)
  ctx.fillStyle = '#604018';
  ctx.fillRect(x + 17, y + 6, 3, 20);
  // Amber glow
  ctx.fillStyle = 'rgba(140, 90, 20, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + 6, y + 16, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c08030';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25c4', x + 8, y + 20);
  ctx.textAlign = 'left';
}

function drawD3SouthPassage(x, y) {
  drawDungeonFloor(x, y);
  // Dark opening in the bottom wall
  ctx.fillStyle = '#0c0808';
  ctx.fillRect(x + 6, y + 14, 20, 18);
  ctx.fillStyle = '#181010';
  ctx.fillRect(x + 8, y + 16, 16, 14);
  // Amber arch frame (top of opening)
  ctx.fillStyle = '#604018';
  ctx.fillRect(x + 6, y + 12, 20, 3);
  // Amber glow
  ctx.fillStyle = 'rgba(140, 90, 20, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 26, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c08030';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25bc', x + 16, y + 14);
  ctx.textAlign = 'left';
}

function drawD3NorthPassage(x, y) {
  drawDungeonFloor(x, y);
  // Dark opening in the top wall
  ctx.fillStyle = '#0c0808';
  ctx.fillRect(x + 6, y, 20, 18);
  ctx.fillStyle = '#181010';
  ctx.fillRect(x + 8, y + 2, 16, 14);
  // Amber arch frame (bottom of opening)
  ctx.fillStyle = '#604018';
  ctx.fillRect(x + 6, y + 17, 20, 3);
  // Amber glow
  ctx.fillStyle = 'rgba(140, 90, 20, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 6, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c08030';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25b2', x + 16, y + 20);
  ctx.textAlign = 'left';
}

function drawHorrorDoor(x, y) {
  drawDungeon2Floor(x, y);
  ctx.fillStyle = '#0a2004';
  ctx.fillRect(x + 10, y + 4, 12, 24);
  ctx.fillStyle = '#163a08';
  ctx.fillRect(x + 13, y + 4, 6, 24);
  // Bioluminescent seep bleeding through
  ctx.fillStyle = 'rgba(20, 100, 8, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 7, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a7010';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25ba', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// Horror branch return — dungeon3 floor with a pale glowing arch symbol
function drawHorrorReturn(x, y) {
  drawDungeon3Floor(x, y);
  ctx.fillStyle = '#0a2a08';
  ctx.fillRect(x + 10, y + 4, 12, 24);
  ctx.fillStyle = '#1a4a10';
  ctx.fillRect(x + 13, y + 4, 6, 24);
  ctx.fillStyle = 'rgba(30, 120, 10, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 7, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a8a20';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25c4', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// ─── Town Tile Drawing ────────────────────────────────────────────────────────

// Warm cobblestone street
function drawTownFloor(x, y) {
  ctx.fillStyle = '#a08868';
  ctx.fillRect(x, y, TILE, TILE);
  // Mortar grid
  ctx.fillStyle = '#7a6448';
  ctx.fillRect(x,      y,      TILE, 1);
  ctx.fillRect(x,      y,      1, TILE);
  // Stone slabs — two per tile, slightly lighter
  ctx.fillStyle = '#b09878';
  ctx.fillRect(x + 2,  y + 2,  13, 12);
  ctx.fillRect(x + 17, y + 16, 13, 12);
  ctx.fillStyle = '#988070';
  ctx.fillRect(x + 17, y +  2, 13, 12);
  ctx.fillRect(x +  2, y + 16, 13, 12);
  // Worn edges
  ctx.fillStyle = '#8a7060';
  ctx.fillRect(x + 2,  y + 13, 13, 1);
  ctx.fillRect(x + 17, y + 27, 13, 1);
}

// Building exterior — warm brick/stone
function drawTownBuilding(x, y) {
  ctx.fillStyle = '#9a7050';
  ctx.fillRect(x, y, TILE, TILE);
  // Brick rows
  ctx.fillStyle = '#7a5438';
  for (let row = 0; row < 4; row++) {
    const ry = y + row * 8;
    const offset = (row % 2) * 8;
    ctx.fillRect(x + offset,      ry, 14, 1);
    ctx.fillRect(x + offset + 16, ry, 14, 1);
  }
  ctx.fillStyle = '#b08860';
  ctx.fillRect(x + 3,  y + 2,  10, 5);
  ctx.fillRect(x + 19, y + 10, 10, 5);
  ctx.fillRect(x +  3, y + 18, 10, 5);
  ctx.fillRect(x + 19, y + 26, 10, 5);
  // Shadow at top (overhang)
  ctx.fillStyle = '#6a4828';
  ctx.fillRect(x, y, TILE, 2);
}

// Overworld tile — town gate/archway with warm glow
function drawTownEntranceTile(x, y) {
  drawPath(x, y);
  // Gate posts
  ctx.fillStyle = '#9a7850';
  ctx.fillRect(x +  6, y +  4, 6, 24);
  ctx.fillRect(x + 20, y +  4, 6, 24);
  // Arch lintel
  ctx.fillStyle = '#b09060';
  ctx.fillRect(x +  5, y +  2, 22, 5);
  // Arch underside (darker)
  ctx.fillStyle = '#7a5a38';
  ctx.fillRect(x +  7, y +  5, 18, 2);
  // Warm amber glow
  ctx.fillStyle = 'rgba(200, 150, 50, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 16, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Label
  ctx.fillStyle = '#e8c880';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25b2', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// Town exit tile (south wall of TOWN_MAP)
function drawTownExit(x, y) {
  drawTownFloor(x, y);
  // Archway opening
  ctx.fillStyle = '#9a7050';
  ctx.fillRect(x +  5, y,  6, 20);
  ctx.fillRect(x + 21, y,  6, 20);
  ctx.fillStyle = '#b09060';
  ctx.fillRect(x +  4, y,  24, 5);
  // Green ambient glow (exit)
  ctx.fillStyle = 'rgba(80, 200, 100, 0.20)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 10, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Inn door in building face
function drawInnDoor(x, y) {
  drawTownBuilding(x, y);
  // Door frame
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(x + 8,  y + 8, 16, 22);
  // Door panels (warm wood)
  ctx.fillStyle = '#8a5a28';
  ctx.fillRect(x + 9,  y + 9,  6, 10);
  ctx.fillRect(x + 17, y + 9,  6, 10);
  ctx.fillRect(x + 9,  y + 21, 6,  8);
  ctx.fillRect(x + 17, y + 21, 6,  8);
  // Door knob
  ctx.fillStyle = '#d4a840';
  ctx.fillRect(x + 15, y + 18, 2, 2);
  // Sign above door
  ctx.fillStyle = '#6a4820';
  ctx.fillRect(x + 6, y + 2, 20, 5);
  ctx.fillStyle = '#e8c870';
  ctx.font = 'bold 5px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('INN', x + 16, y + 7);
  ctx.textAlign = 'left';
  // Warm glow hint
  ctx.fillStyle = 'rgba(200, 140, 40, 0.18)';
  ctx.beginPath();
  ctx.ellipse(x + 16, y + 20, 10, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Imperial guard post — small stone hut with battlements and a red pennant
function drawGuardPost(x, y) {
  drawGrass(x, y);
  // Stone walls
  ctx.fillStyle = '#545464';
  ctx.fillRect(x + 4, y + 6, 24, 22);
  // Battlement crenels at top
  ctx.fillStyle = '#3c3c4a';
  ctx.fillRect(x + 4, y + 4,  7, 6);
  ctx.fillRect(x + 21, y + 4, 7, 6);
  ctx.fillRect(x + 4, y + 4, 24, 3);   // base of battlement
  // Stone block highlights
  ctx.fillStyle = '#686878';
  ctx.fillRect(x + 6,  y + 12, 8, 2);
  ctx.fillRect(x + 18, y + 19, 7, 2);
  ctx.fillStyle = '#40404e';
  ctx.fillRect(x + 16, y + 10, 8, 2);
  ctx.fillRect(x + 7,  y + 21, 6, 2);
  // Door opening
  ctx.fillStyle = '#1a1828';
  ctx.fillRect(x + 12, y + 20, 8, 8);
  // Door lintel
  ctx.fillStyle = '#3c3c4a';
  ctx.fillRect(x + 11, y + 18, 10, 3);
  // Flag pole
  ctx.fillStyle = '#a09060';
  ctx.fillRect(x + 15, y + 1, 2, 7);
  // Imperial pennant
  ctx.fillStyle = '#9a2828';
  ctx.fillRect(x + 17, y + 1, 9, 5);
  ctx.fillStyle = '#c03030';
  ctx.fillRect(x + 17, y + 1, 9, 2);
}

// Imperial toll bridge over canal — stone arch with iron gate and pennants
function drawBridgeGate(x, y) {
  // Water base (canal beneath the bridge)
  ctx.fillStyle = '#2a4870';
  ctx.fillRect(x, y, 32, 32);
  ctx.fillStyle = '#1e3a5a';
  ctx.fillRect(x, y + 4, 32, 4);
  ctx.fillStyle = '#3a5a8a';
  ctx.fillRect(x + 4, y + 10, 24, 3);
  // Stone bridge deck
  ctx.fillStyle = '#7a7060';
  ctx.fillRect(x + 2, y + 7, 28, 18);
  // Deck plank joints
  ctx.fillStyle = '#6a6050';
  ctx.fillRect(x + 2, y + 14, 28, 2);  // centre joint
  ctx.fillRect(x + 11, y + 7, 2, 18);  // left joint
  ctx.fillRect(x + 19, y + 7, 2, 18);  // right joint
  // Stone parapets (raised sides)
  ctx.fillStyle = '#5a5868';
  ctx.fillRect(x + 2, y + 4, 5, 5);    // left parapet top cap
  ctx.fillRect(x + 25, y + 4, 5, 5);   // right parapet top cap
  ctx.fillRect(x + 2, y + 23, 5, 6);   // left parapet bottom
  ctx.fillRect(x + 25, y + 23, 5, 6);  // right parapet bottom
  ctx.fillStyle = '#6a6878';
  ctx.fillRect(x + 2, y + 9, 5, 14);   // left parapet body
  ctx.fillRect(x + 25, y + 9, 5, 14);  // right parapet body
  // Iron gate bars (portcullis)
  ctx.fillStyle = '#282830';
  ctx.fillRect(x + 10, y + 3, 3, 26);  // bar left
  ctx.fillRect(x + 15, y + 3, 2, 26);  // bar centre
  ctx.fillRect(x + 19, y + 3, 3, 26);  // bar right
  ctx.fillRect(x + 10, y + 12, 12, 2); // horizontal bar
  // Gate highlight (iron sheen)
  ctx.fillStyle = '#484858';
  ctx.fillRect(x + 10, y + 3, 1, 26);
  ctx.fillRect(x + 19, y + 3, 1, 26);
  // Imperial pennant — left post
  ctx.fillStyle = '#a09060';
  ctx.fillRect(x + 3, y, 2, 6);
  ctx.fillStyle = '#9a2828';
  ctx.fillRect(x + 5, y, 7, 4);
  ctx.fillStyle = '#c03030';
  ctx.fillRect(x + 5, y, 7, 2);
  // Imperial pennant — right post
  ctx.fillStyle = '#a09060';
  ctx.fillRect(x + 27, y, 2, 6);
  ctx.fillStyle = '#9a2828';
  ctx.fillRect(x + 20, y, 7, 4);
  ctx.fillStyle = '#c03030';
  ctx.fillRect(x + 20, y, 7, 2);
}

// Bridge deck plank — wooden planks over water inside BRIDGE_CROSSING_MAP
function drawBridgeDeck(x, y) {
  // Water visible below/beside the planks
  drawWater(x, y);
  // Plank surface
  ctx.fillStyle = '#7a6040';
  ctx.fillRect(x, y, TILE, TILE);
  // Plank grain lines (horizontal)
  ctx.fillStyle = '#6a5030';
  for (let i = 4; i < TILE; i += 8) {
    ctx.fillRect(x, y + i, TILE, 2);
  }
  // Stone parapets on both sides (left col=0, right col=15 of bridge area)
  ctx.fillStyle = '#5a5868';
  ctx.fillRect(x, y, 3, TILE);      // left parapet
  ctx.fillRect(x + TILE - 3, y, 3, TILE); // right parapet
  // Parapet cap
  ctx.fillStyle = '#6a6878';
  ctx.fillRect(x + 1, y, 1, TILE);
  ctx.fillRect(x + TILE - 2, y, 1, TILE);
}

// Bridge exit tile — PATH at the world-map border, inside BRIDGE_CROSSING_MAP
function drawBridgeExit(x, y) {
  drawPath(x, y);
  // Small directional arrow chevron
  ctx.fillStyle = '#5a5040';
  ctx.fillRect(x + 12, y + 10, 8, 2);
  ctx.fillRect(x + 14, y + 8, 4, 2);
  ctx.fillRect(x + 16, y + 6, 2, 2);
  ctx.fillRect(x + 12, y + 20, 8, 2);
  ctx.fillRect(x + 14, y + 22, 4, 2);
  ctx.fillRect(x + 16, y + 24, 2, 2);
}

// Overworld farmhouse tile — small wattle-daub cottage with thatch roof
function drawFarmHouse(x, y) {
  drawGrass(x, y);
  // Walls
  ctx.fillStyle = '#9a8060';
  ctx.fillRect(x + 4, y + 11, 24, 19);
  // Wall texture
  ctx.fillStyle = '#8a7050';
  ctx.fillRect(x +  6, y + 15, 7, 2);
  ctx.fillRect(x + 19, y + 21, 6, 2);
  // Window (left side)
  ctx.fillStyle = '#c8a858';
  ctx.fillRect(x + 5, y + 14, 6, 5);
  ctx.fillStyle = '#8a7038';
  ctx.fillRect(x + 7, y + 14, 1, 5);
  ctx.fillRect(x + 5, y + 16, 6, 1);
  // Door
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(x + 14, y + 21, 6, 9);
  ctx.fillStyle = '#6a5038';
  ctx.fillRect(x + 13, y + 19, 8, 3);
  // Chimney (drawn before roof so roof overlaps its base)
  ctx.fillStyle = '#787068';
  ctx.fillRect(x + 21, y + 4, 4, 9);
  // Thatch roof — stepped rectangles forming a triangle
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(x + 14, y +  3,  4, 3);  // peak
  ctx.fillRect(x + 10, y +  5, 12, 3);  // upper slope
  ctx.fillRect(x +  6, y +  7, 20, 3);  // mid slope
  ctx.fillRect(x +  3, y +  9, 26, 3);  // eave
  // Roof highlight along peak
  ctx.fillStyle = '#6e5040';
  ctx.fillRect(x + 14, y + 3, 4, 1);
  ctx.fillRect(x + 10, y + 5, 12, 1);
  // Chimney cap (above roof)
  ctx.fillStyle = '#5a5450';
  ctx.fillRect(x + 20, y + 2, 6, 3);
}

// Mire vault entrance — sunken stone archway half-swallowed by bog, with a faint
// blue-green glow rising from the chamber below. Drawn on MAP3_N1.
function drawMireEntrance(x, y) {
  drawGrass(x, y);
  // Bog surround — darker muddy patch
  ctx.fillStyle = '#3a3a28';
  ctx.fillRect(x + 3, y + 12, 26, 18);
  // Stone arch sides
  ctx.fillStyle = '#505860';
  ctx.fillRect(x + 5,  y + 14, 5, 14);
  ctx.fillRect(x + 22, y + 14, 5, 14);
  // Stone arch keystone header
  ctx.fillRect(x + 5, y + 12, 22, 5);
  // Stone highlight
  ctx.fillStyle = '#6a7278';
  ctx.fillRect(x + 5,  y + 12, 22, 2);
  ctx.fillRect(x + 5,  y + 14,  2, 10);
  ctx.fillRect(x + 25, y + 14,  2, 10);
  // Interior darkness
  ctx.fillStyle = '#0e1018';
  ctx.fillRect(x + 10, y + 17, 12, 13);
  // Bioluminescent fen-glow at the threshold (animated)
  const gl = (tick >> 4) & 1;
  ctx.fillStyle = gl ? '#1a3828' : '#14302a';
  ctx.fillRect(x + 11, y + 24, 10, 4);
  ctx.fillStyle = gl ? '#1e4432' : '#183a2c';
  ctx.fillRect(x + 13, y + 22, 6, 4);
  // Moss fringe along arch sides
  ctx.fillStyle = '#324028';
  ctx.fillRect(x + 5, y + 24, 3, 4);
  ctx.fillRect(x + 24, y + 26, 3, 4);
}

// Mire vault exit — stone threshold inside the vault, ascending to daylight.
function drawMireExit(x, y) {
  drawDungeon2Floor(x, y);
  // Stone step outline
  ctx.fillStyle = '#4a5260';
  ctx.fillRect(x + 6, y + 22, 20, 8);
  ctx.fillStyle = '#3a4250';
  ctx.fillRect(x + 8, y + 18, 16, 6);
  ctx.fillStyle = '#2a3240';
  ctx.fillRect(x + 10, y + 14, 12, 5);
  // Pale light from above
  const gl = (tick >> 4) & 1;
  ctx.fillStyle = gl ? '#2a3a30' : '#243428';
  ctx.fillRect(x + 12, y + 2, 8, 14);
  // Step highlights
  ctx.fillStyle = '#6a7282';
  ctx.fillRect(x + 6, y + 22, 20, 2);
  ctx.fillRect(x + 8, y + 18, 16, 2);
  ctx.fillRect(x + 10, y + 14, 12, 2);
  // SPACE hint (pale teal)
  if (!dialogue.open && !choice.open) {
    ctx.fillStyle = 'rgba(120,200,170,0.5)';
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[SPC] exit', x + 16, y + 10);
    ctx.textAlign = 'left';
  }
}

// Plain residential door — simpler than inn/office, used for all house entries
function drawHouseDoor(x, y) {
  drawTownBuilding(x, y);
  // Door frame
  ctx.fillStyle = '#4a3010';
  ctx.fillRect(x + 11, y + 10, 10, 20);
  // Door surface
  ctx.fillStyle = '#7a5030';
  ctx.fillRect(x + 12, y + 11, 8, 18);
  // Panel line
  ctx.fillStyle = '#5a3818';
  ctx.fillRect(x + 12, y + 19, 8, 1);
  // Handle
  ctx.fillStyle = '#a07838';
  ctx.fillRect(x + 18, y + 19, 2, 3);
}

// Office door in building face
function drawOfficeDoor(x, y) {
  drawTownBuilding(x, y);
  // Door frame (darker, more formal)
  ctx.fillStyle = '#3a2810';
  ctx.fillRect(x + 8,  y + 8, 16, 22);
  // Door panels
  ctx.fillStyle = '#5a3c18';
  ctx.fillRect(x + 9,  y + 9,  6, 20);
  ctx.fillRect(x + 17, y + 9,  6, 20);
  // Cross bar
  ctx.fillStyle = '#3a2810';
  ctx.fillRect(x + 9,  y + 19, 14, 2);
  // Iron knocker
  ctx.fillStyle = '#707070';
  ctx.fillRect(x + 14, y + 14, 4, 4);
  ctx.fillStyle = '#909090';
  ctx.fillRect(x + 15, y + 15, 2, 2);
  // Sign above door
  ctx.fillStyle = '#3a2c18';
  ctx.fillRect(x + 4, y + 2, 24, 5);
  ctx.fillStyle = '#c8b880';
  ctx.font = 'bold 5px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICE', x + 16, y + 7);
  ctx.textAlign = 'left';
}

// Guild Hall door — like office door but labelled 'GUILD' with green tint
function drawGuildDoor(x, y) {
  drawTownBuilding(x, y);
  // Door frame (deep oak)
  ctx.fillStyle = '#2a1e0c';
  ctx.fillRect(x + 8,  y + 8, 16, 22);
  // Door panels (darker green-brown wood)
  ctx.fillStyle = '#3a4220';
  ctx.fillRect(x + 9,  y + 9,  6, 20);
  ctx.fillRect(x + 17, y + 9,  6, 20);
  // Cross bar
  ctx.fillStyle = '#2a1e0c';
  ctx.fillRect(x + 9,  y + 19, 14, 2);
  // Brass ring knocker
  ctx.fillStyle = '#b08020';
  ctx.fillRect(x + 13, y + 13, 6, 6);
  ctx.fillStyle = '#2a1e0c';
  ctx.fillRect(x + 14, y + 14, 4, 4);
  ctx.fillStyle = '#d4a030';
  ctx.fillRect(x + 15, y + 15, 2, 2);
  // Sign above door
  ctx.fillStyle = '#1e2c10';
  ctx.fillRect(x + 3, y + 2, 26, 5);
  ctx.fillStyle = '#c8d880';
  ctx.font = 'bold 5px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GUILD', x + 16, y + 7);
  ctx.textAlign = 'left';
}

// Reed insignia tile — decorative building face with a reed motif above the guild door
function drawGuildInsignia(x, y) {
  drawTownBuilding(x, y);
  // Stone plaque background
  ctx.fillStyle = '#3a4030';
  ctx.fillRect(x + 6, y + 6, 20, 20);
  ctx.fillStyle = '#4a5040';
  ctx.fillRect(x + 7, y + 7, 18, 18);
  // Reed stem (vertical green line)
  ctx.fillStyle = '#5a8030';
  ctx.fillRect(x + 15, y + 9, 2, 14);
  // Reed head (oval cluster at top)
  ctx.fillStyle = '#6a5020';
  ctx.fillRect(x + 13, y + 9, 6, 4);
  ctx.fillRect(x + 14, y + 8, 4, 2);
  // Left frond
  ctx.fillStyle = '#5a8030';
  ctx.fillRect(x + 10, y + 13, 5, 1);
  ctx.fillRect(x + 9,  y + 14, 3, 1);
  // Right frond
  ctx.fillRect(x + 17, y + 13, 5, 1);
  ctx.fillRect(x + 20, y + 14, 3, 1);
}

// School door in building face
function drawSchoolDoor(x, y) {
  drawTownBuilding(x, y);
  // Door frame (lighter, civic tone)
  ctx.fillStyle = '#3a4828';
  ctx.fillRect(x + 8,  y + 8, 16, 22);
  // Door panels (muted green wood)
  ctx.fillStyle = '#5a6838';
  ctx.fillRect(x + 9,  y + 9,  6, 20);
  ctx.fillRect(x + 17, y + 9,  6, 20);
  // Cross bar
  ctx.fillStyle = '#3a4828';
  ctx.fillRect(x + 9,  y + 19, 14, 2);
  // Brass handle
  ctx.fillStyle = '#b09030';
  ctx.fillRect(x + 14, y + 14, 4, 4);
  ctx.fillStyle = '#d4b840';
  ctx.fillRect(x + 15, y + 15, 2, 2);
  // Sign above door
  ctx.fillStyle = '#2a3818';
  ctx.fillRect(x + 2, y + 2, 28, 5);
  ctx.fillStyle = '#a8c870';
  ctx.font = 'bold 5px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SCHOOL', x + 16, y + 7);
  ctx.textAlign = 'left';
}

// Apartment building door — plain residential entrance, no sign
function drawAptDoor(x, y) {
  drawTownBuilding(x, y);
  // Door frame
  ctx.fillStyle = '#2e2018';
  ctx.fillRect(x + 9,  y + 8, 14, 22);
  // Door surface
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(x + 10, y + 9, 12, 20);
  // Panel divide
  ctx.fillStyle = '#2e2018';
  ctx.fillRect(x + 10, y + 18, 12, 1);
  // Handle
  ctx.fillStyle = '#888888';
  ctx.fillRect(x + 19, y + 17, 2, 4);
}

// Interior apartment door — drawn on top of a wall tile inside the corridor
function drawAptInteriorDoor(x, y) {
  drawInteriorWall(x, y);
  // Door frame
  ctx.fillStyle = '#3a2410';
  ctx.fillRect(x + 9, y + 4, 14, 28);
  // Door panels
  ctx.fillStyle = '#6a4828';
  ctx.fillRect(x + 10, y + 5,  5, 10);
  ctx.fillRect(x + 17, y + 5,  5, 10);
  ctx.fillRect(x + 10, y + 17, 5, 14);
  ctx.fillRect(x + 17, y + 17, 5, 14);
  // Cross bar
  ctx.fillStyle = '#3a2410';
  ctx.fillRect(x + 10, y + 16, 12, 1);
  // Handle
  ctx.fillStyle = '#a08828';
  ctx.fillRect(x + 10, y + 13, 3, 3);
  // Number plate above handle
  ctx.fillStyle = '#c8b060';
  ctx.font = 'bold 5px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25a0', x + 21, y + 4);
  ctx.textAlign = 'left';
}

// Interior floor — warm wooden planks
function drawInteriorFloor(x, y) {
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(x, y, TILE, TILE);
  // Plank lines (horizontal grain)
  ctx.fillStyle = '#6a4428';
  ctx.fillRect(x, y +  8, TILE, 1);
  ctx.fillRect(x, y + 16, TILE, 1);
  ctx.fillRect(x, y + 24, TILE, 1);
  // Plank highlights
  ctx.fillStyle = '#8a6038';
  ctx.fillRect(x + 2,  y +  1, 10, 6);
  ctx.fillRect(x + 18, y +  9, 12, 6);
  ctx.fillRect(x +  4, y + 17, 8,  6);
  ctx.fillRect(x + 20, y + 25, 10, 6);
  // Knot detail
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(x + 14, y + 4,  2, 2);
  ctx.fillRect(x +  8, y + 20, 2, 2);
}

// Interior wall — whitewashed plaster
function drawInteriorWall(x, y) {
  ctx.fillStyle = '#c8b898';
  ctx.fillRect(x, y, TILE, TILE);
  // Plaster texture variation
  ctx.fillStyle = '#d8c8a8';
  ctx.fillRect(x + 4,  y + 4,  12, 10);
  ctx.fillRect(x + 18, y + 18, 10,  8);
  // Shadow at bottom (floor shadow)
  ctx.fillStyle = '#a89878';
  ctx.fillRect(x, y + 26, TILE, 6);
  // Wall seam lines
  ctx.fillStyle = '#b8a888';
  ctx.fillRect(x,      y + 16, TILE, 1);
  ctx.fillRect(x + 16, y,       1, 16);
}

// Interior exit door
function drawInteriorExit(x, y) {
  drawInteriorWall(x, y);
  // Door frame
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(x + 7,  y + 6, 18, 26);
  // Door
  ctx.fillStyle = '#8a5828';
  ctx.fillRect(x + 8,  y + 7,  7, 12);
  ctx.fillRect(x + 17, y + 7,  7, 12);
  ctx.fillRect(x + 8,  y + 20, 7,  11);
  ctx.fillRect(x + 17, y + 20, 7,  11);
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(x + 8,  y + 19, 16, 2);
  // Handle
  ctx.fillStyle = '#d4a840';
  ctx.fillRect(x + 14, y + 16, 2, 3);
  // Light at threshold (warm glow from outside)
  ctx.fillStyle = 'rgba(220, 180, 80, 0.25)';
  ctx.fillRect(x + 8, y + 28, 16, 4);
  // ▼ label
  ctx.fillStyle = '#c8a060';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x + 16, y + 5);
  ctx.textAlign = 'left';
}

// Market square cobblestone — slightly warmer/lighter patterned stone
function drawTownMarket(x, y) {
  ctx.fillStyle = '#b89c7a';
  ctx.fillRect(x, y, TILE, TILE);
  // Decorative grid — wider mortar lines
  ctx.fillStyle = '#8a7050';
  ctx.fillRect(x,      y,      TILE, 2);
  ctx.fillRect(x,      y,      2, TILE);
  // Flagstones
  ctx.fillStyle = '#c8ac88';
  ctx.fillRect(x + 3,  y + 3,  12, 12);
  ctx.fillRect(x + 17, y + 17, 12, 12);
  ctx.fillStyle = '#a89068';
  ctx.fillRect(x + 17, y +  3, 12, 12);
  ctx.fillRect(x +  3, y + 17, 12, 12);
  // Centre pip
  ctx.fillStyle = '#d0b890';
  ctx.fillRect(x + 15, y + 15, 2, 2);
}

// Flashing "SPACE" prompt when player is adjacent to the notice board
function drawNoticeBoardHint() {
  if (dialogue.open) return;
  if (currentTownId === 'drenwick' && activeMap !== DRENWICK_MARKET_MAP) return;
  const boardX = (currentTownId === 'drenwick') ? DRENWICK_MARKET_NOTICE_BOARD_X : NOTICE_BOARD_X;
  const boardY = (currentTownId === 'drenwick') ? DRENWICK_MARKET_NOTICE_BOARD_Y : NOTICE_BOARD_Y;
  const bx = player.x - boardX;
  const by = player.y - boardY;
  if (Math.sqrt(bx * bx + by * by) < TALK_RADIUS && (tick >> 4) & 1) {
    const px = Math.round(boardX);
    const py = Math.round(boardY);
    ctx.fillStyle = '#d8c878';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE', px, py - 20);
    ctx.textAlign = 'left';
  }
}

// Notice board tile — market cobblestone with a small posted board
function drawNoticeBoardTile(x, y) {
  drawTownMarket(x, y);
  // Post
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(x + 14, y + 8, 4, 22);
  // Board
  ctx.fillStyle = '#8a6028';
  ctx.fillRect(x + 6,  y + 8, 20, 14);
  ctx.fillStyle = '#a07838';
  ctx.fillRect(x + 7,  y + 9, 18, 12);
  // "Pinned" paper scraps
  ctx.fillStyle = '#e8e0c8';
  ctx.fillRect(x + 8,  y + 10, 7, 4);
  ctx.fillRect(x + 18, y + 11, 6, 3);
  ctx.fillRect(x + 9,  y + 16, 8, 3);
  // Pin dots
  ctx.fillStyle = '#d04020';
  ctx.fillRect(x + 8,  y + 10, 2, 2);
  ctx.fillRect(x + 18, y + 11, 2, 2);
  ctx.fillRect(x + 9,  y + 16, 2, 2);
}

// ─── Sluice Tile Drawing ─────────────────────────────────────────────────────

// Cold damp stone — pale grey-green slabs with moisture seep
function drawSluiceFloor(x, y) {
  ctx.fillStyle = '#485850';
  ctx.fillRect(x, y, TILE, TILE);
  // Stone joint grid
  ctx.fillStyle = '#384840';
  ctx.fillRect(x,      y,      TILE, 1);
  ctx.fillRect(x,      y,      1, TILE);
  ctx.fillRect(x + 16, y,      1, TILE);
  ctx.fillRect(x,      y + 16, TILE, 1);
  // Slab faces
  ctx.fillStyle = '#505c58';
  ctx.fillRect(x +  2, y +  2, 12, 12);
  ctx.fillRect(x + 18, y + 18, 12, 12);
  // Damp patches
  ctx.fillStyle = '#303c38';
  ctx.fillRect(x + 18, y +  4, 10,  6);
  ctx.fillRect(x +  4, y + 20,  8,  6);
}

// Functional brick — ordered courses, damp base streak
function drawSluiceWall(x, y) {
  ctx.fillStyle = '#4a4438';
  ctx.fillRect(x, y, TILE, TILE);
  // Brick courses
  ctx.fillStyle = '#3a3428';
  for (let row = 0; row < 4; row++) {
    const ry = y + row * 8;
    const off = (row % 2) * 8;
    ctx.fillRect(x + off,      ry, 14, 1);
    ctx.fillRect(x + off + 16, ry, 14, 1);
  }
  // Mortar highlights
  ctx.fillStyle = '#5a5244';
  ctx.fillRect(x +  2, y +  2, 11, 5);
  ctx.fillRect(x + 18, y + 10, 11, 5);
  ctx.fillRect(x +  2, y + 18, 11, 5);
  ctx.fillRect(x + 18, y + 26, 11, 5);
  // Damp streak at base
  ctx.fillStyle = '#2a281e';
  ctx.fillRect(x, y + 28, TILE, 4);
}

// Sealed-room wall — sluice brick carved with markings in no script anyone
// reads. Pale scratches, deliberate but unreadable: curves and crossing lines,
// older than the mortar around them.
function drawSluiceMarkWall(x, y) {
  drawSluiceWall(x, y);
  ctx.fillStyle = '#8a8270';
  // A curving line of short strokes, like a sentence written in cuts
  ctx.fillRect(x +  5, y +  6, 2, 6);
  ctx.fillRect(x +  9, y +  9, 2, 5);
  ctx.fillRect(x + 13, y +  7, 2, 7);
  ctx.fillRect(x + 18, y + 10, 2, 4);
  ctx.fillRect(x + 22, y +  6, 2, 6);
  // Crossing strokes
  ctx.fillRect(x +  7, y + 12, 8, 2);
  ctx.fillRect(x + 17, y +  8, 7, 2);
  // A lone spiral-ish hook, lower course
  ctx.fillRect(x + 12, y + 20, 2, 7);
  ctx.fillRect(x + 12, y + 20, 7, 2);
  ctx.fillRect(x + 17, y + 20, 2, 5);
  ctx.fillRect(x + 14, y + 25, 5, 2);
}

// Sealed-room wall — eleven notches cut into the brick at shoulder height,
// evenly spaced, five then six. Counted by someone. Nothing says why.
function drawSluiceNotchWall(x, y) {
  drawSluiceWall(x, y);
  ctx.fillStyle = '#948a76';
  // Group of five
  for (let i = 0; i < 5; i++) ctx.fillRect(x + 3 + i * 3, y + 12, 1, 8);
  // Group of six
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 19 + i * 2, y + 12, 1, 8);
}

// Sealed-room floor — an old stain soaked into the slab joints. Black-brown,
// scrubbed once at the edges and given up on.
function drawSluiceBloodFloor(x, y) {
  drawSluiceFloor(x, y);
  ctx.fillStyle = '#38201c';
  ctx.fillRect(x +  8, y + 10, 14, 12);
  ctx.fillRect(x +  5, y + 14, 20,  6);
  ctx.fillRect(x + 12, y +  7,  8, 18);
  ctx.fillStyle = '#241410';
  ctx.fillRect(x + 11, y + 12,  9,  8);
  // Thin runs following the slab joints
  ctx.fillStyle = '#38201c';
  ctx.fillRect(x + 16, y + 22,  1,  7);
  ctx.fillRect(x +  6, y + 16,  1,  5);
}

// Sealed-room floor — a small journal lying against the wall, cover warped
// by damp, a strap keeping it shut.
function drawSluiceJournalFloor(x, y) {
  drawSluiceFloor(x, y);
  // Shadow under the book
  ctx.fillStyle = '#2c3834';
  ctx.fillRect(x + 9, y + 13, 15, 11);
  // Cover
  ctx.fillStyle = '#6a5638';
  ctx.fillRect(x + 8, y + 11, 14, 11);
  ctx.fillStyle = '#7a6644';
  ctx.fillRect(x + 9, y + 12, 12,  9);
  // Page edges peeking out
  ctx.fillStyle = '#b0a888';
  ctx.fillRect(x + 21, y + 13,  2,  8);
  // Strap
  ctx.fillStyle = '#3a2e1c';
  ctx.fillRect(x + 13, y + 11,  2, 11);
}

// The dream — featureless pure white. Both DREAM_FLOOR and DREAM_EDGE draw
// through this, so the walkable interior and the blocking boundary ring are
// indistinguishable: the dream simply ends where you can't walk any further.
function drawDreamVoid(x, y) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, TILE, TILE);
}

// Sealed-room exit — the gap the player came in through: sluice floor under a
// deep doorway shadow, reading as "the dark you arrived from".
function drawSluiceSecretExit(x, y) {
  drawSluiceFloor(x, y);
  ctx.fillStyle = 'rgba(10,12,10,0.55)';
  ctx.fillRect(x, y, TILE, 12);
  ctx.fillStyle = 'rgba(10,12,10,0.3)';
  ctx.fillRect(x, y + 12, TILE, 6);
}

// Drainage channel — dark murky standing water, slower shimmer than open water
function drawSluiceChannel(x, y) {
  const a = (tick >> 5) & 1;
  ctx.fillStyle = a ? '#1e2c1c' : '#222e20';
  ctx.fillRect(x, y, TILE, TILE);
  // Murky surface ripples
  ctx.fillStyle = a ? '#283424' : '#2c3828';
  ctx.fillRect(x +  3, y +  5, 10, 2);
  ctx.fillRect(x + 20, y + 13,  8, 2);
  ctx.fillRect(x +  8, y + 22, 14, 2);
  ctx.fillRect(x +  2, y + 28,  7, 2);
  // Algae/slime at edges
  ctx.fillStyle = '#1e3018';
  ctx.fillRect(x,      y,      TILE, 2);
  ctx.fillRect(x,      y,         2, TILE);
  ctx.fillRect(x + 30, y,         2, TILE);
}

// Access hatch in east Calwick reeds — iron-banded wooden cover with ring handle
function drawSluiceEntrance(x, y) {
  drawReeds(x, y);
  // Hatch frame
  ctx.fillStyle = '#3a3028';
  ctx.fillRect(x +  5, y +  6, 22, 18);
  // Hatch planks
  ctx.fillStyle = '#5a4828';
  ctx.fillRect(x +  6, y +  7, 20,  7);
  ctx.fillRect(x +  6, y + 16, 20,  7);
  // Iron bands
  ctx.fillStyle = '#484848';
  ctx.fillRect(x +  5, y + 13, 22,  3);
  ctx.fillRect(x +  5, y + 22, 22,  2);
  // Ring handle
  ctx.fillStyle = '#606060';
  ctx.fillRect(x + 14, y +  8,  4,  4);
  ctx.fillStyle = '#787878';
  ctx.fillRect(x + 15, y +  9,  2,  2);
  // Descent indicator
  ctx.fillStyle = '#a0c890';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25bc', x + 16, y + 5);
  ctx.textAlign = 'left';
}

// Ladder rungs ascending — exit tile back to east Calwick
function drawSluiceExit(x, y) {
  drawSluiceFloor(x, y);
  // Ladder rails
  ctx.fillStyle = '#686058';
  ctx.fillRect(x +  8, y +  2, 3, 28);
  ctx.fillRect(x + 21, y +  2, 3, 28);
  // Rungs
  ctx.fillStyle = '#787068';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(x + 8, y + 4 + i * 7, 16, 2);
  }
  // Ascent indicator
  ctx.fillStyle = '#a0c890';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25b2', x + 16, y + 30);
  ctx.textAlign = 'left';
}

// Wetland reeds — dark muddy base with vertical reed stalks and seed heads
function drawReeds(x, y) {
  ctx.fillStyle = '#384e2c';
  ctx.fillRect(x, y, TILE, TILE);
  // Reed stalks
  ctx.fillStyle = '#6a8848';
  ctx.fillRect(x +  4, y +  2, 2, 22);
  ctx.fillRect(x + 11, y +  6, 2, 20);
  ctx.fillRect(x + 19, y +  1, 2, 24);
  ctx.fillRect(x + 26, y +  5, 2, 18);
  // Lit side of stalk
  ctx.fillStyle = '#7aaa54';
  ctx.fillRect(x +  4, y +  6, 1, 16);
  ctx.fillRect(x + 19, y +  5, 1, 18);
  // Seed heads
  ctx.fillStyle = '#8a7040';
  ctx.fillRect(x +  3, y +  1, 4, 3);
  ctx.fillRect(x + 10, y +  4, 4, 3);
  ctx.fillRect(x + 18, y,      4, 3);
  ctx.fillRect(x + 25, y +  3, 4, 3);
  // Muddy ground patches
  ctx.fillStyle = '#253620';
  ctx.fillRect(x +  8, y + 20, 5, 4);
  ctx.fillRect(x + 20, y + 26, 6, 4);
}

// Drought-cracked wetland mud — marsh floor that used to be underwater and
// isn't anymore. Deliberately not GRASS (walkable, but not encounter-eligible
// — see movement.js's encounter check, which only rolls on GRASS).
function drawBasinMud(x, y) {
  ctx.fillStyle = '#6a5c40';
  ctx.fillRect(x, y, TILE, TILE);
  // Lighter, drier patches — uneven drying
  ctx.fillStyle = '#786848';
  ctx.fillRect(x +  2, y +  3, 12, 10);
  ctx.fillRect(x + 17, y + 16, 13, 11);
  // Crack lines — irregular, branching, the classic drought-mud pattern
  ctx.fillStyle = '#3e3424';
  ctx.fillRect(x +  6, y,      2, 13);
  ctx.fillRect(x +  6, y + 11,  9, 2);
  ctx.fillRect(x + 13, y +  4, 2, 10);
  ctx.fillRect(x + 20, y + 14, 2, 18);
  ctx.fillRect(x + 20, y + 20,  9, 2);
  ctx.fillRect(x + 26, y + 18, 2, 8);
  ctx.fillRect(x,      y + 24, 10, 2);
  // A few wilted, colourless reed stubs — what's left after the water dropped
  ctx.fillStyle = '#4a4230';
  ctx.fillRect(x + 24, y +  3, 1, 8);
  ctx.fillRect(x + 28, y +  6, 1, 6);
  ctx.fillRect(x +  2, y + 18, 1, 7);
}

// Exposed, dried lakebed rock — walkable, not grass (no encounters on it),
// distinct from BASIN_MUD (this is bare stone, not cracked silt).
function drawExposedStone(x, y) {
  ctx.fillStyle = '#8c8678';
  ctx.fillRect(x, y, TILE, TILE);
  // Flatter, paler stone slabs
  ctx.fillStyle = '#9c968a';
  ctx.fillRect(x +  3, y +  4, 14, 9);
  ctx.fillRect(x + 16, y + 15, 12, 10);
  ctx.fillStyle = '#a8a296';
  ctx.fillRect(x +  4, y +  5, 10, 5);
  ctx.fillRect(x + 18, y + 16,  8, 5);
  // Shadow seams between slabs
  ctx.fillStyle = '#605a4e';
  ctx.fillRect(x +  2, y + 13,  16, 2);
  ctx.fillRect(x + 15, y + 14,  2, 12);
  ctx.fillRect(x,      y + 25, 12, 2);
  // Waterline mineral staining — pale, chalky, left behind as the lake dropped
  ctx.fillStyle = 'rgba(210,206,190,0.35)';
  ctx.fillRect(x + 20, y +  2, 9, 3);
  ctx.fillRect(x +  1, y + 20, 8, 3);
}

// Old fence post, half-swallowed by silt — impassable, decorative. What's
// left of a farm/pasture boundary from before the basin started drying out
// and reclaiming this ground.
function drawFencePost(x, y) {
  drawGrass(x, y);
  // Silt drift piled at the base
  ctx.fillStyle = '#6a5c40';
  ctx.beginPath();
  ctx.ellipse(x + TILE / 2, y + TILE - 6, 11, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // The post itself — weathered grey wood, slightly off true (leaning)
  ctx.fillStyle = '#5a5248';
  ctx.fillRect(x + 13, y + 4, 6, TILE - 10);
  ctx.fillStyle = '#6e6458';
  ctx.fillRect(x + 14, y + 4, 2, TILE - 10);
  // Split/weathered top
  ctx.fillStyle = '#3e382e';
  ctx.fillRect(x + 12, y + 3, 8, 3);
  // A snapped-off crossbar stub — this used to be an actual fence
  ctx.fillStyle = '#544c40';
  ctx.fillRect(x + 19, y + 10, 6, 3);
}

// North/south world transition between the Silt Flats and the Badlands
// (NORTH_BASIN_W_MAP) \u2014 bare ground on both sides, not a maintained road,
// so this uses drawGrass() as its base rather than the MAP-style
// drawPath() transitions.
function drawNorthBasinWExit(x, y) {
  drawGrass(x, y);
  ctx.fillStyle = 'rgba(150, 140, 100, 0.25)';
  ctx.fillRect(x, y, TILE, 12);
  ctx.fillStyle = '#c8c0a0';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25b2', x + 16, y + 10);
  ctx.textAlign = 'left';
}

function drawNorthBasinWEntrance(x, y) {
  drawGrass(x, y);
  ctx.fillStyle = 'rgba(150, 140, 100, 0.25)';
  ctx.fillRect(x, y + 20, TILE, 12);
  ctx.fillStyle = '#c8c0a0';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25bc', x + 16, y + 28);
  ctx.textAlign = 'left';
}

// Abandoned trapper's hut \u2014 impassable, decorative, no interior (the North
// Basin is still a skeleton pass; no enterable buildings yet). Rougher and
// smaller than drawFarmHouse(): plank walls instead of proper thatch, a
// lean-to roof, a pelt stretched to dry, and a cold, unused chimney.
function drawTrapperHut(x, y) {
  drawBasinMud(x, y);
  // Walls \u2014 rough, mismatched planks
  ctx.fillStyle = '#5a4a38';
  ctx.fillRect(x + 3, y + 13, 22, 16);
  ctx.fillStyle = '#4e4030';
  ctx.fillRect(x +  5, y + 17, 5, 2);
  ctx.fillRect(x + 14, y + 22, 6, 2);
  ctx.fillRect(x + 21, y + 15, 3, 2);
  // Door \u2014 plain, off-centre, no window (this isn't a home to invite anyone into)
  ctx.fillStyle = '#241c14';
  ctx.fillRect(x + 15, y + 20, 6, 9);
  ctx.fillStyle = '#443628';
  ctx.fillRect(x + 14, y + 18, 8, 3);
  // Lean-to roof \u2014 single sloped plane, not a proper peak
  ctx.fillStyle = '#3a2e20';
  ctx.fillRect(x +  1, y +  9, 26, 4);
  ctx.fillStyle = '#4a3c2c';
  ctx.fillRect(x +  4, y +  6, 20, 4);
  ctx.fillStyle = '#584838';
  ctx.fillRect(x +  8, y +  3, 12, 4);
  // Cold chimney \u2014 no smoke; nobody's home
  ctx.fillStyle = '#605850';
  ctx.fillRect(x + 22, y + 2, 4, 8);
  // A pelt stretched to dry against the wall
  ctx.fillStyle = '#8a7050';
  ctx.fillRect(x - 1, y + 14, 5, 12);
  ctx.fillStyle = '#6e5a40';
  ctx.fillRect(x,     y + 17, 3, 3);
  ctx.fillRect(x + 1, y + 22, 2, 2);
}

// Right-edge world transition — road continues east into MAP2
function drawMap2Exit(x, y) {
  drawPath(x, y);
  // Green shimmer on the right edge
  ctx.fillStyle = 'rgba(80, 200, 100, 0.22)';
  ctx.fillRect(x + 20, y, 12, TILE);
  // Rightward arrow hint
  ctx.fillStyle = '#a0d880';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25ba', x + 27, y + 20);
  ctx.textAlign = 'left';
}

// Left-edge world transition — road re-enters MAP from MAP2
function drawMap2Entrance(x, y) {
  drawPath(x, y);
  // Green shimmer on the left edge
  ctx.fillStyle = 'rgba(80, 200, 100, 0.22)';
  ctx.fillRect(x, y, 12, TILE);
  // Leftward arrow hint
  ctx.fillStyle = '#a0d880';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25c4', x + 5, y + 20);
  ctx.textAlign = 'left';
}

// Right-edge world transition — road continues east from MAP2 into MAP3
function drawMap3Exit(x, y) {
  drawPath(x, y);
  ctx.fillStyle = 'rgba(80, 200, 100, 0.22)';
  ctx.fillRect(x + 20, y, 12, TILE);
  ctx.fillStyle = '#a0d880';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25ba', x + 27, y + 20);
  ctx.textAlign = 'left';
}

// Left-edge world transition — road re-enters MAP2 from MAP3
function drawMap3Entrance(x, y) {
  drawPath(x, y);
  ctx.fillStyle = 'rgba(80, 200, 100, 0.22)';
  ctx.fillRect(x, y, 12, TILE);
  ctx.fillStyle = '#a0d880';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25c4', x + 5, y + 20);
  ctx.textAlign = 'left';
}

// Top-edge world transition — road continues north into MAP_N1 (or MAP_N2)
function drawNorthExitTile(x, y) {
  drawPath(x, y);
  // Green shimmer on the top edge
  ctx.fillStyle = 'rgba(80, 200, 100, 0.22)';
  ctx.fillRect(x, y, TILE, 12);
  // Upward arrow hint
  ctx.fillStyle = '#a0d880';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25b2', x + 16, y + 10);
  ctx.textAlign = 'left';
}

// Bottom-edge world transition — road re-enters from the north (MAP_N1 or MAP_N2 south edge)
function drawNorthEntranceTile(x, y) {
  drawPath(x, y);
  // Green shimmer on the bottom edge
  ctx.fillStyle = 'rgba(80, 200, 100, 0.22)';
  ctx.fillRect(x, y + 20, TILE, 12);
  // Downward arrow hint
  ctx.fillStyle = '#a0d880';
  ctx.font = 'bold 8px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25bc', x + 16, y + 28);
  ctx.textAlign = 'left';
}

// East gateway in main town's right wall — passage leading to east Calwick
function drawEastEntrance(x, y) {
  drawTownFloor(x, y);
  // Gate pillars at top and bottom (wall continues either side)
  ctx.fillStyle = '#9a7050';
  ctx.fillRect(x, y,      TILE, 6);
  ctx.fillRect(x, y + 26, TILE, 6);
  // Lintel strip on the right edge
  ctx.fillStyle = '#b09060';
  ctx.fillRect(x + 26, y + 4, 6, 24);
  // Warm amber glow — matches town entrance style
  ctx.fillStyle = 'rgba(200, 150, 50, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 16, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Directional arrow
  ctx.fillStyle = '#e8c880';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25ba', x + 16, y + 20);
  ctx.textAlign = 'left';
}

// Pub/inn table — overlay drawn on top of the floor tile.
// tx, ty = tile top-left corner (floor already rendered beneath).
function drawTable(tx, ty) {
  // Drop shadow on floor
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(tx + 16, ty + 27, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Table top surface (leaves floor visible at top of tile)
  ctx.fillStyle = '#7a4a22';
  ctx.fillRect(tx + 6, ty + 12, 20, 8);
  // Highlight along top edge
  ctx.fillStyle = '#9a6a38';
  ctx.fillRect(tx + 6, ty + 12, 20, 2);
  // Front face — gives the table depth/thickness
  ctx.fillStyle = '#4a2a10';
  ctx.fillRect(tx + 6, ty + 19, 20, 5);
  // Legs
  ctx.fillStyle = '#3a2008';
  ctx.fillRect(tx + 7,  ty + 22, 3, 6);
  ctx.fillRect(tx + 22, ty + 22, 3, 6);
}

// Draws all inn tables as overlays over the already-rendered floor.
function drawInnTables() {
  for (const t of INN_TABLES) {
    drawTable(Math.round(t.x) - 16, Math.round(t.y) - 16);
  }
}


// West-facing gateway in main town's left wall — passage leading to west Calwick
function drawWestEntrance(x, y) {
  drawTownFloor(x, y);
  // Gate pillars at top and bottom
  ctx.fillStyle = '#9a7050';
  ctx.fillRect(x, y,      TILE, 6);
  ctx.fillRect(x, y + 26, TILE, 6);
  // Lintel strip on the left edge
  ctx.fillStyle = '#b09060';
  ctx.fillRect(x, y + 4, 6, 24);
  // Amber glow
  ctx.fillStyle = 'rgba(200, 150, 50, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 16, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Directional arrow pointing left
  ctx.fillStyle = '#e8c880';
  ctx.font = 'bold 7px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u25c4', x + 16, y + 20);
  ctx.textAlign = 'left';
}

// East-facing gateway in west Calwick's right wall — passage back to main town
function drawWestExit(x, y) {
  drawTownFloor(x, y);
  // Gate pillars
  ctx.fillStyle = '#9a7050';
  ctx.fillRect(x, y,      TILE, 6);
  ctx.fillRect(x, y + 26, TILE, 6);
  // Lintel on right edge
  ctx.fillStyle = '#b09060';
  ctx.fillRect(x + 26, y + 4, 6, 24);
  // Green glow — return to central town
  ctx.fillStyle = 'rgba(80, 200, 100, 0.20)';
  ctx.beginPath();
  ctx.ellipse(x + 14, y + 16, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

// West-facing gateway in east Calwick's left wall — passage back to main town
function drawEastExit(x, y) {
  drawTownFloor(x, y);
  // Gate pillars
  ctx.fillStyle = '#9a7050';
  ctx.fillRect(x, y,      TILE, 6);
  ctx.fillRect(x, y + 26, TILE, 6);
  // Lintel on left edge
  ctx.fillStyle = '#b09060';
  ctx.fillRect(x, y + 4, 6, 24);
  // Green glow — matches town exit style
  ctx.fillStyle = 'rgba(80, 200, 100, 0.20)';
  ctx.beginPath();
  ctx.ellipse(x + 18, y + 16, 8, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawTile(id, x, y) {
  switch (id) {
    case GRASS:               drawGrass(x, y);            break;
    case WATER:               drawWater(x, y);            break;
    case PATH:                drawPath(x, y);             break;
    case TREE:                drawTree(x, y);             break;
    case DUNGEON_FLOOR:       drawDungeonFloor(x, y);     break;
    case DUNGEON_WALL:        drawDungeonWall(x, y);      break;
    case DUNGEON_ENTRANCE:    drawEntranceTile(x, y);     break;
    case DUNGEON_EXIT:
      if (dungeonFloor === 2) drawDungeon2Exit(x, y);
      else                    drawDungeonExit(x, y);
      break;
    case DUNGEON2_FLOOR:      drawDungeon2Floor(x, y);    break;
    case DUNGEON2_WALL:       drawDungeon2Wall(x, y);     break;
    case DUNGEON_STAIRS_DOWN: drawStairsDown(x, y);       break;
    case DUNGEON2_STAIRS_UP:  drawDungeon2StairsUp(x, y); break;
    case TOWN_FLOOR:          drawTownFloor(x, y);        break;
    case TOWN_BUILDING:       drawTownBuilding(x, y);     break;
    case TOWN_ENTRANCE:       drawTownEntranceTile(x, y); break;
    case TOWN_EXIT:           drawTownExit(x, y);         break;
    case INN_DOOR:            drawInnDoor(x, y);          break;
    case OFFICE_DOOR:         drawOfficeDoor(x, y);       break;
    case HOUSE_DOOR:          drawHouseDoor(x, y);        break;
    case SCHOOL_DOOR:         drawSchoolDoor(x, y);       break;
    case APT_DOOR:            drawAptDoor(x, y);          break;
    case APT_INTERIOR_DOOR:   drawAptInteriorDoor(x, y); break;
    case INTERIOR_FLOOR:      drawInteriorFloor(x, y);    break;
    case INTERIOR_WALL:       drawInteriorWall(x, y);     break;
    case INTERIOR_EXIT:       drawInteriorExit(x, y);     break;
    case TOWN_MARKET:         drawTownMarket(x, y);       break;
    case NOTICE_BOARD:        drawNoticeBoardTile(x, y);  break;
    case REEDS:               drawReeds(x, y);            break;
    case EAST_ENTRANCE:       drawEastEntrance(x, y);     break;
    case EAST_EXIT:           drawEastExit(x, y);         break;
    case WEST_ENTRANCE:       drawWestEntrance(x, y);     break;
    case WEST_EXIT:           drawWestExit(x, y);         break;
    case TABLE:               drawTable(x, y);             break;
    case SLUICE_ENTRANCE:     drawSluiceEntrance(x, y);   break;
    case SLUICE_FLOOR:        drawSluiceFloor(x, y);      break;
    case SLUICE_WALL:         drawSluiceWall(x, y);       break;
    case FALSE_WALL:          drawSluiceWall(x, y);       break;
    case SLUICE_MARK_WALL:    drawSluiceMarkWall(x, y);   break;
    case SLUICE_NOTCH_WALL:   drawSluiceNotchWall(x, y);  break;
    case SLUICE_BLOOD_FLOOR:  drawSluiceBloodFloor(x, y); break;
    case SLUICE_JOURNAL_FLOOR: drawSluiceJournalFloor(x, y); break;
    case SLUICE_SECRET_ENTRANCE: drawSluiceWall(x, y);    break;  // deliberately indistinguishable from wall
    case SLUICE_SECRET_EXIT:  drawSluiceSecretExit(x, y); break;
    case DREAM_FLOOR:         drawDreamVoid(x, y);        break;
    case DREAM_EDGE:          drawDreamVoid(x, y);        break;  // boundary is invisible on purpose
    case MAP2_EXIT:           drawMap2Exit(x, y);         break;
    case MAP2_ENTRANCE:       drawMap2Entrance(x, y);     break;
    case MAP3_EXIT:           drawMap3Exit(x, y);         break;
    case MAP3_ENTRANCE:       drawMap3Entrance(x, y);     break;
    case NORTH_EXIT:          drawNorthExitTile(x, y);    break;
    case NORTH_ENTRANCE:      drawNorthEntranceTile(x, y); break;
    case NORTH2_EXIT:         drawNorthExitTile(x, y);    break;
    case NORTH2_ENTRANCE:     drawNorthEntranceTile(x, y); break;
    case MAP4_EXIT:           drawMap3Exit(x, y);          break;
    case MAP4_ENTRANCE:       drawMap3Entrance(x, y);      break;
    case MAP5_EXIT:           drawMap3Exit(x, y);          break;
    case MAP5_ENTRANCE:       drawMap3Entrance(x, y);      break;
    case FEN_N_EXIT:          drawNorthExitTile(x, y);    break;
    case FEN_N_ENTRANCE:      drawNorthEntranceTile(x, y); break;
    case FEN_N2_EXIT:         drawNorthExitTile(x, y);    break;
    case FEN_N2_ENTRANCE:     drawNorthEntranceTile(x, y); break;
    case GUARD_POST:          drawGuardPost(x, y);        break;
    case FARM_HOUSE:          drawFarmHouse(x, y);        break;
    case BRIDGE_GATE:         drawBridgeGate(x, y);       break;
    case BRIDGE_DECK:         drawBridgeDeck(x, y);       break;
    case BRIDGE_EXIT:         drawBridgeExit(x, y);       break;
    case SLUICE_EXIT:         drawSluiceExit(x, y);       break;
    case SLUICE_CHANNEL:      drawSluiceChannel(x, y);    break;
    case MIRE_ENTRANCE:       drawMireEntrance(x, y);     break;
    case MIRE_EXIT:           drawMireExit(x, y);         break;
    case DUNGEON3_FLOOR:      drawDungeon3Floor(x, y);    break;
    case DUNGEON3_WALL:       drawDungeon3Wall(x, y);     break;
    case DUNGEON8_WEST_DOOR:  drawHorrorDoor(x, y);       break;
    case DUNGEON8_WEST_RET:   drawHorrorReturn(x, y);     break;
    case DUNGEON8_EAST_DOOR:  drawHorrorDoor(x, y);       break;
    case DUNGEON8_EAST_RET:   drawHorrorReturn(x, y);     break;
    case D3_EAST_PASSAGE:     drawD3EastPassage(x, y);    break;
    case D3_WEST_PASSAGE:     drawD3WestPassage(x, y);    break;
    case D3_SOUTH_PASSAGE:    drawD3SouthPassage(x, y);   break;
    case D3_NORTH_PASSAGE:    drawD3NorthPassage(x, y);   break;
    case DUNGEON_FALSE_WALL:  drawDungeonWall(x, y);      break;
    case WORLD_HOLLOW:        drawTree(x, y);             break;
    case INTERIOR_FALSE_WALL: drawInteriorWall(x, y);    break;
    case TAKOMO_GATE:         drawTownBuilding(x, y);    break;
    case TAKOMO_EXIT:         drawDungeonExit(x, y);     break;
    case RUIN_FLOOR:          drawRuinFloor(x, y);       break;
    case RUIN_WALL:           drawRuinWall(x, y);        break;
    case RUIN_STAIRS_DOWN:    drawRuinStairsDown(x, y);  break;
    case RUIN_EXIT:           drawRuinExit(x, y);        break;
    case BASIN_MUD:           drawBasinMud(x, y);        break;
    case NORTH_BASIN_EXIT:     drawNorthExitTile(x, y);     break;
    case NORTH_BASIN_ENTRANCE: drawNorthEntranceTile(x, y); break;
    case EXPOSED_STONE:           drawExposedStone(x, y);         break;
    case FENCE_POST:              drawFencePost(x, y);            break;
    case NORTH_BASIN_W_EXIT:      drawNorthBasinWExit(x, y);      break;
    case NORTH_BASIN_W_ENTRANCE:  drawNorthBasinWEntrance(x, y);  break;
    case TRAPPER_HUT:             drawTrapperHut(x, y);           break;
    // Hidden meadow tiles — both deliberately drawn as plain grass. The
    // entrance is a secret (indistinguishable from the nook around it); the
    // exit's visual cue is the gap in the meadow's tree border, not the tile.
    case MEADOW_HIDDEN_ENTRANCE:  drawGrass(x, y);                break;
    case MEADOW_EXIT:             drawGrass(x, y);                break;
  }
}

// Every tile id drawTile() above has a dedicated `case` for -- kept as an
// explicit Set (not derived by parsing this file's source, which isn't
// possible from the browser) purely so validateGameData()'s tile-property
// validation (validation.js) can confirm every tile used in a map is
// actually renderable, the same way BATTLE_SPRITE_NAMES (render-battle.js)
// lets it confirm every enemy has a battle sprite. drawTile() itself is
// unchanged -- this does not add a fallback or alter rendering in any way.
// Keep in sync with the switch above: add a tile id here whenever you add a
// `case` there.
const RENDERABLE_TILE_IDS = new Set([
  GRASS, WATER, PATH, TREE, DUNGEON_FLOOR, DUNGEON_WALL, DUNGEON_ENTRANCE, DUNGEON_EXIT,
  DUNGEON2_FLOOR, DUNGEON2_WALL, DUNGEON_STAIRS_DOWN, DUNGEON2_STAIRS_UP,
  TOWN_FLOOR, TOWN_BUILDING, TOWN_ENTRANCE, TOWN_EXIT, INN_DOOR, OFFICE_DOOR,
  INTERIOR_FLOOR, INTERIOR_WALL, INTERIOR_EXIT, TOWN_MARKET, NOTICE_BOARD, REEDS,
  EAST_ENTRANCE, EAST_EXIT, SLUICE_ENTRANCE, SLUICE_FLOOR, SLUICE_WALL, SLUICE_EXIT,
  SLUICE_CHANNEL, WEST_ENTRANCE, WEST_EXIT, TABLE, HOUSE_DOOR, SCHOOL_DOOR,
  APT_DOOR, APT_INTERIOR_DOOR, FALSE_WALL, MAP2_EXIT, MAP2_ENTRANCE, MAP3_EXIT,
  MAP3_ENTRANCE, NORTH_EXIT, NORTH_ENTRANCE, NORTH2_EXIT, NORTH2_ENTRANCE,
  FEN_N_EXIT, FEN_N_ENTRANCE, FEN_N2_EXIT, FEN_N2_ENTRANCE, MAP4_EXIT, MAP4_ENTRANCE,
  GUARD_POST, FARM_HOUSE, MIRE_ENTRANCE, MIRE_EXIT, BRIDGE_GATE, BRIDGE_DECK,
  BRIDGE_EXIT, MAP5_EXIT, MAP5_ENTRANCE, DUNGEON3_FLOOR, DUNGEON3_WALL,
  DUNGEON8_WEST_DOOR, DUNGEON8_WEST_RET, DUNGEON8_EAST_DOOR, DUNGEON8_EAST_RET,
  D3_EAST_PASSAGE, D3_WEST_PASSAGE, D3_SOUTH_PASSAGE, D3_NORTH_PASSAGE,
  DUNGEON_FALSE_WALL, WORLD_HOLLOW, INTERIOR_FALSE_WALL, TAKOMO_GATE, TAKOMO_EXIT,
  RUIN_FLOOR, RUIN_WALL, RUIN_STAIRS_DOWN, RUIN_EXIT, BASIN_MUD, NORTH_BASIN_EXIT,
  NORTH_BASIN_ENTRANCE, EXPOSED_STONE, FENCE_POST, NORTH_BASIN_W_EXIT,
  NORTH_BASIN_W_ENTRANCE, TRAPPER_HUT, MEADOW_HIDDEN_ENTRANCE, MEADOW_EXIT,
  SLUICE_MARK_WALL, SLUICE_NOTCH_WALL, SLUICE_BLOOD_FLOOR, SLUICE_JOURNAL_FLOOR,
  SLUICE_SECRET_ENTRANCE, SLUICE_SECRET_EXIT, DREAM_FLOOR, DREAM_EDGE,
]);
window.RENDERABLE_TILE_IDS = RENDERABLE_TILE_IDS;

