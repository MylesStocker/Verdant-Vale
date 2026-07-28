'use strict';

// render-entities.js — player sprite, NPC sprites, world-view boss/special-
// enemy sprites, item/chest/world-item drawing, merchant/traveller/shop
// drawing, and small world-feature hint overlays (sluice gate, Drenwick
// north gate, Thornmere standing stone).

// ─── Sluice Gate ──────────────────────────────────────────────────────────────
// Always draws the iron sluice gate frame embedded in the west wall of the
// drainage channel. When the job is active and unfixed, reed debris clogs the
// gate leaf. Once fixed the debris is cleared and flow lines appear.
function drawSluiceGateHint() {
  if (!inSluice || sluiceFloor !== 1) return;
  const gx = Math.round(SLUICE_GATE.x);
  const gy = Math.round(SLUICE_GATE.y);

  // ── Gate frame — iron-riveted stone surround ──────────────────────────────
  ctx.fillStyle = '#484838';
  ctx.fillRect(gx - 15, gy - 14, 30, 28);  // outer frame
  ctx.fillStyle = '#2a2820';
  ctx.fillRect(gx - 12, gy - 11, 24, 22);  // inner recess / channel mouth
  // Frame rivets
  ctx.fillStyle = '#686858';
  for (let ri = 0; ri < 3; ri++) {
    ctx.fillRect(gx - 14 + ri * 14, gy - 13, 3, 3);
    ctx.fillRect(gx - 14 + ri * 14, gy + 11, 3, 3);
  }

  if (sluice_fixed) {
    // ── Clear gate — water flows freely through ─────────────────────────────
    // Water shimmer in the opening
    const shimmer = (tick >> 3) & 1;
    ctx.fillStyle = shimmer ? '#2a5080' : '#305890';
    ctx.fillRect(gx - 12, gy - 11, 24, 22);
    // Flow lines (horizontal ripples)
    ctx.fillStyle = 'rgba(80,140,200,0.5)';
    for (let fl = 0; fl < 3; fl++) {
      ctx.fillRect(gx - 10, gy - 7 + fl * 7 + (shimmer ? 1 : 0), 20, 2);
    }
    // Gate leaf raised to top — iron panel
    ctx.fillStyle = '#4a4a3a';
    ctx.fillRect(gx - 10, gy - 11, 20, 5);
    ctx.fillStyle = '#5a5a48';
    ctx.fillRect(gx - 10, gy - 11, 20, 2);
  } else {
    // ── Blocked gate — reed debris wedged in frame ──────────────────────────
    // Gate leaf (partial, stuck mid-way)
    ctx.fillStyle = '#4a4a3a';
    ctx.fillRect(gx - 10, gy - 6, 20, 9);
    ctx.fillStyle = '#5a5a48';
    ctx.fillRect(gx - 10, gy - 6, 20, 2);
    // Horizontal iron cross-bar
    ctx.fillStyle = '#383828';
    ctx.fillRect(gx - 10, gy - 2, 20, 3);
    // Reed debris — compressed wads of brown plant matter
    ctx.fillStyle = '#5a4820';
    ctx.fillRect(gx - 11, gy +  2, 8,  5);
    ctx.fillRect(gx +  3, gy +  3, 9,  4);
    ctx.fillRect(gx -  6, gy +  7, 13, 4);
    // Reed stalks sticking out
    ctx.fillStyle = '#7a6428';
    ctx.fillRect(gx -  8, gy,      2, 11);
    ctx.fillRect(gx -  2, gy +  1, 2,  9);
    ctx.fillRect(gx +  5, gy +  2, 2,  8);
    ctx.fillRect(gx + 10, gy,      2, 11);
    // SPACE hint when active and adjacent ─────────────────────────────────
    if (sluice_job_started && !dialogue.open && !choice.open) {
      const dx = player.x - SLUICE_GATE.x;
      const dy = player.y - SLUICE_GATE.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', gx, gy - 20);
        ctx.textAlign = 'left';
      }
    }
  }
}

// ─── Drenwick North Gate hint ─────────────────────────────────────────────────
// Shows a SPACE prompt when the player is close to the sealed north gate of
// Drenwick on MAP_N2. The gate itself is rendered as TOWN_BUILDING tiles; this
// draws the hint overlay and a small chain/lock detail so it reads as a gate.
function drawDrenwichNorthGateHint() {
  if (activeMap !== MAP_N2 || dialogue.open) return;
  const gx = Math.round(7.5 * TILE);
  const gy = Math.round(8.5 * TILE);
  const dx = player.x - gx;
  const dy = player.y - gy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Draw chain across the gate gap regardless of distance
  ctx.fillStyle = '#7a6840';
  ctx.fillRect(gx - 10, gy - 2, 20, 4);  // chain bar
  ctx.fillStyle = '#504428';
  ctx.fillRect(gx - 2,  gy - 4, 4,  8);  // padlock body
  ctx.fillStyle = '#6a5830';
  ctx.fillRect(gx - 1,  gy - 7, 2,  4);  // shackle

  // SPACE hint when close enough
  if (dist < TALK_RADIUS * 2 && (tick >> 4) & 1) {
    ctx.fillStyle = '#d8c878';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE', gx, gy - 22);
    ctx.textAlign = 'left';
  }
}

// ─── Thornmere Standing Stone ─────────────────────────────────────────────────
function drawThornmereStone() {
  if (activeMap !== MAP4) return;
  const sx = Math.round(THORNMERE_STONE.x);
  const sy = Math.round(THORNMERE_STONE.y);

  // Stone body — weathered grey slab, slightly wider at top
  ctx.fillStyle = '#7a7a78';
  ctx.fillRect(sx - 7, sy - 14, 14, 18);
  ctx.fillStyle = '#6a6a68';
  ctx.fillRect(sx - 9, sy - 16, 18, 6);

  // Highlight edge
  ctx.fillStyle = '#9a9a98';
  ctx.fillRect(sx - 9, sy - 16, 2, 24);
  ctx.fillRect(sx - 9, sy - 16, 18, 2);

  // Shadow edge
  ctx.fillStyle = '#555553';
  ctx.fillRect(sx + 7, sy - 16, 2, 24);
  ctx.fillRect(sx - 9, sy + 7, 18, 2);

  // Carved rune lines — simple angular marks
  ctx.fillStyle = '#4a4a48';
  ctx.fillRect(sx - 5, sy - 12, 10, 1);
  ctx.fillRect(sx - 5, sy -  8, 10, 1);
  ctx.fillRect(sx - 5, sy -  4, 10, 1);
  ctx.fillRect(sx - 3, sy - 12, 1,  9);
  ctx.fillRect(sx + 2, sy - 12, 1,  9);

  // Stone base
  ctx.fillStyle = '#5a5a58';
  ctx.fillRect(sx - 9, sy + 8, 18, 4);

  // SPACE hint when nearby
  if (!dialogue.open && !choice.open) {
    const dx = player.x - THORNMERE_STONE.x;
    const dy = player.y - THORNMERE_STONE.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', sx, sy - 22);
      ctx.textAlign = 'left';
    }
  }
}

// ─── Player Drawing ───────────────────────────────────────────────────────────
function drawPlayer() {
  const px = Math.round(player.x);
  const py = Math.round(player.y);
  const frame = (player.step >> 3) & 1; // flips every 8 steps
  const f     = player.facing;

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Legs ──────────────────────────────────────────────────────────────────
  const pantColor = '#384268';
  const bootColor = '#28201a';

  if (f === 'down' || f === 'up') {
    // Two legs, one steps forward each frame
    const lH = 9 + (frame === 0 ? 2 : 0);
    const rH = 9 + (frame === 1 ? 2 : 0);
    ctx.fillStyle = pantColor;
    ctx.fillRect(px - 7, py + 4, 6, lH);
    ctx.fillRect(px + 1, py + 4, 6, rH);
    ctx.fillStyle = bootColor;
    ctx.fillRect(px - 8, py + 4 + lH - 1, 7, 3);
    ctx.fillRect(px + 1, py + 4 + rH - 1, 7, 3);
  } else {
    // Side view: leg mass with alternating foot positions
    ctx.fillStyle = pantColor;
    ctx.fillRect(px - 5, py + 4, 10, 9);
    ctx.fillStyle = bootColor;
    const fOff = frame === 0 ? -3 : 3;
    const dir  = f === 'right' ? 1 : -1;
    ctx.fillRect(px - 4 + dir * fOff,  py + 12, 6, 3);
    ctx.fillRect(px - 2 - dir * fOff,  py + 12, 6, 3);
  }

  // ── Body / tunic ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#5c7090'; // blue-grey main
  ctx.fillRect(px - 8, py - 6, 16, 13);
  ctx.fillStyle = '#4e6080'; // darker lower half
  ctx.fillRect(px - 8, py + 2, 16, 5);

  // Collar detail (facing forward)
  if (f === 'down') {
    ctx.fillStyle = '#6e84a0';
    ctx.fillRect(px - 3, py - 6, 6, 4);
  }

  // Belt
  ctx.fillStyle = '#3a2c1c';
  ctx.fillRect(px - 8, py + 4, 16, 3);

  // ── Arms ──────────────────────────────────────────────────────────────────
  const skinColor  = '#a87858';
  const sleeveColor = '#5c7090';

  if (f === 'left') {
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(px - 13, py - 4, 6, 9);
    ctx.fillStyle = skinColor;
    ctx.fillRect(px - 14, py + 3, 6, 5);
  } else if (f === 'right') {
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(px + 7, py - 4, 6, 9);
    ctx.fillStyle = skinColor;
    ctx.fillRect(px + 8, py + 3, 6, 5);
  } else {
    // Front/back: arms swing slightly while moving
    const anim = player.moving ? frame : 0;
    ctx.fillStyle = sleeveColor;
    ctx.fillRect(px - 13, py - 4 + anim, 5, 9);
    ctx.fillRect(px +  8, py - 4 - anim, 5, 9);
    ctx.fillStyle = skinColor;
    ctx.fillRect(px - 13, py + 3 + anim, 5, 5);
    ctx.fillRect(px +  8, py + 3 - anim, 5, 5);
  }

  // ── Head ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = skinColor;
  ctx.fillRect(px - 6, py - 19, 12, 13);

  // Hair
  ctx.fillStyle = '#302418';
  if (f === 'up') {
    // Seen from behind: full hair
    ctx.fillRect(px - 6, py - 19, 12, 10);
  } else {
    // Top band + sideburns
    ctx.fillRect(px - 6, py - 19, 12, 5);
    ctx.fillRect(px - 7, py - 19, 2,  10);
    ctx.fillRect(px + 5, py - 19, 2,  10);
  }

  // Eyes / minimal face features
  ctx.fillStyle = '#1a1620';
  if (f === 'down') {
    ctx.fillRect(px - 4, py - 11, 2, 2);
    ctx.fillRect(px + 2, py - 11, 2, 2);
    // Tiny mouth
    ctx.fillStyle = '#7a3c2c';
    ctx.fillRect(px - 1, py -  7, 2, 1);
  } else if (f === 'left') {
    ctx.fillRect(px - 5, py - 11, 2, 2);
  } else if (f === 'right') {
    ctx.fillRect(px + 3, py - 11, 2, 2);
  }
}

// ─── NPC Sprite Drawing ───────────────────────────────────────────────────────
// Maren: ochre robe, silver hair — always faces south
function drawMarenSprite(npc) {
  const px = Math.round(npc.x);
  const py = Math.round(npc.y);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs / robe hem
  ctx.fillStyle = '#5a4820';
  ctx.fillRect(px - 7, py + 4, 6, 9);
  ctx.fillRect(px + 1, py + 4, 6, 9);
  ctx.fillStyle = '#3a2c10';
  ctx.fillRect(px - 8, py + 12, 7, 3);
  ctx.fillRect(px + 1, py + 12, 7, 3);

  // Robe body — warm ochre
  ctx.fillStyle = '#9a7838';
  ctx.fillRect(px - 8, py - 6, 16, 13);
  ctx.fillStyle = '#7a5c28';
  ctx.fillRect(px - 8, py + 2, 16, 5);

  // Robe collar
  ctx.fillStyle = '#b09050';
  ctx.fillRect(px - 3, py - 6, 6, 4);

  // Belt / sash
  ctx.fillStyle = '#4a3418';
  ctx.fillRect(px - 8, py + 4, 16, 3);

  // Arms
  ctx.fillStyle = '#9a7838';
  ctx.fillRect(px - 13, py - 4, 5, 9);
  ctx.fillRect(px +  8, py - 4, 5, 9);
  // Hands
  ctx.fillStyle = '#c0906a';
  ctx.fillRect(px - 13, py + 3, 5, 5);
  ctx.fillRect(px +  8, py + 3, 5, 5);

  // Head
  ctx.fillStyle = '#c0906a';
  ctx.fillRect(px - 6, py - 19, 12, 13);

  // Silver hair
  ctx.fillStyle = '#b0a898';
  ctx.fillRect(px - 6, py - 19, 12, 5);   // top
  ctx.fillRect(px - 7, py - 19, 2,  10);  // left side
  ctx.fillRect(px + 5, py - 19, 2,  10);  // right side

  // Eyes (facing down)
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(px - 4, py - 11, 2, 2);
  ctx.fillRect(px + 2, py - 11, 2, 2);
  // Smile
  ctx.fillStyle = '#7a4838';
  ctx.fillRect(px - 2, py -  7, 4, 1);

  // Interaction hint — blink when player is in range and dialogue is closed
  if (!dialogue.open) {
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#a8d0d8';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 26);
      ctx.textAlign = 'left';
    }
  }
}

// Wen — survivor/explorer, faces south
function drawWenSprite(npc) {
  const px = Math.round(npc.x);
  const py = Math.round(npc.y);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — rough canvas trousers
  ctx.fillStyle = '#4a3c2c';
  ctx.fillRect(px - 7, py + 4, 6, 9);
  ctx.fillRect(px + 1, py + 4, 6, 9);
  ctx.fillStyle = '#2c2018';
  ctx.fillRect(px - 8, py + 12, 7, 3);
  ctx.fillRect(px + 1, py + 12, 7, 3);

  // Body — worn grey-brown coat
  ctx.fillStyle = '#5c5040';
  ctx.fillRect(px - 8, py - 6, 16, 13);
  ctx.fillStyle = '#4a3e30';
  ctx.fillRect(px - 8, py + 2, 16, 5);
  // Collar
  ctx.fillStyle = '#6c6050';
  ctx.fillRect(px - 3, py - 6, 6, 4);
  // Belt
  ctx.fillStyle = '#3a2c1c';
  ctx.fillRect(px - 8, py + 4, 16, 3);

  // Pack strapped to left side
  ctx.fillStyle = '#4a3c24';
  ctx.fillRect(px - 16, py - 5, 8, 14);
  ctx.fillStyle = '#5a4c30';
  ctx.fillRect(px - 15, py - 3, 6, 10);
  ctx.fillStyle = '#6a5838'; // buckle strap
  ctx.fillRect(px - 16, py + 1, 8, 2);

  // Right arm
  ctx.fillStyle = '#5c5040';
  ctx.fillRect(px + 8, py - 4, 5, 9);
  ctx.fillStyle = '#b09060';
  ctx.fillRect(px + 8, py + 3, 5, 5);
  // Left hand (pack side, barely visible)
  ctx.fillStyle = '#b09060';
  ctx.fillRect(px - 15, py + 5, 4, 4);

  // Head
  ctx.fillStyle = '#b09060';
  ctx.fillRect(px - 6, py - 19, 12, 13);
  // Dark brown hair, unkempt
  ctx.fillStyle = '#3c2c18';
  ctx.fillRect(px - 6, py - 19, 12, 5);
  ctx.fillRect(px - 7, py - 19, 2, 10);
  ctx.fillRect(px + 5, py - 19, 2, 10);
  ctx.fillRect(px + 3, py - 17, 3,  4); // loose lock on right

  // Eyes (facing down) — tired, narrowed
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(px - 4, py - 11, 2, 2);
  ctx.fillRect(px + 2, py - 11, 2, 2);

  // SPACE hint when in range
  if (!dialogue.open) {
    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#a8d0d8';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 26);
      ctx.textAlign = 'left';
    }
  }
}

// Draw-function lookup keyed by NPC id. Add an entry here when adding a new
// simple NPC; the sprite function receives the full NPC data entry.
// Calwick schoolhouse bookshelf. Registered as a SIMPLE_NPC (id
// 'calwick_school_bookshelf') so it inherits the standard proximity
// interaction and solid-body collision, but drawn as furniture rather than a
// person. Sprite mirrors the house bookshelf (render-interiors.js).
function drawSchoolBookshelf(npc) {
  const bx = Math.round(npc.x), by = Math.round(npc.y);
  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(bx, by + 15, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Back panel — dark wood
  ctx.fillStyle = '#1e1208';
  ctx.fillRect(bx - 11, by - 16, 22, 30);
  // Side frame boards
  ctx.fillStyle = '#4a2e10';
  ctx.fillRect(bx - 11, by - 16,  2, 30);
  ctx.fillRect(bx +  9, by - 16,  2, 30);
  // Top cap
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(bx - 12, by - 18, 24,  3);
  ctx.fillStyle = '#5a3818';
  ctx.fillRect(bx - 12, by - 18, 24,  1);
  // Bottom board
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(bx - 12, by + 13, 24,  2);
  // Shelf dividers
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(bx - 11, by -  5, 20,  2);
  ctx.fillRect(bx - 11, by +  6, 20,  2);
  // Top shelf books
  const bkc = ['#7a2e18','#28485a','#2a5030','#6a4810','#4a2858','#1e3a5a','#5a3418'];
  let bkx = bx - 9;
  [4, 3, 5, 4].forEach(function(w, i) {
    ctx.fillStyle = bkc[i % bkc.length];
    ctx.fillRect(bkx, by - 15, w, 9);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(bkx + w - 1, by - 15, 1, 9);
    bkx += w + 1;
  });
  // Middle shelf books
  bkx = bx - 9;
  [3, 4, 3, 3, 3].forEach(function(w, i) {
    ctx.fillStyle = bkc[(i + 3) % bkc.length];
    ctx.fillRect(bkx, by -  4, w, 9);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(bkx + w - 1, by - 4, 1, 9);
    bkx += w + 1;
  });
  // Bottom shelf — small objects
  ctx.fillStyle = '#786040';          // small urn
  ctx.fillRect(bx - 9, by + 7, 5, 6);
  ctx.fillStyle = '#484840';          // tin box
  ctx.fillRect(bx - 3, by + 8, 5, 5);
  ctx.fillStyle = '#7a3020';          // book lying flat
  ctx.fillRect(bx + 3, by + 9, 6, 3);
  // SPACE prompt when in range (drawn above the shelf)
  drawNPCSpaceHint(npc, bx, by - 8);
}

// Calwick schoolhouse world map. Registered as a SIMPLE_NPC
// ('calwick_school_map') like the bookshelf; drawn as a framed wall map rather
// than a person. Examining it opens the continent-map overlay (render-ui.js).
function drawSchoolWorldMap(npc) {
  const bx = Math.round(npc.x), by = Math.round(npc.y);
  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.beginPath();
  ctx.ellipse(bx, by + 15, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dark wood frame
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(bx - 13, by - 16, 26, 30);
  ctx.fillStyle = '#5a3818';
  ctx.fillRect(bx - 13, by - 16, 26, 2);
  // Parchment sea field (desaturated blue, matches the full survey panel)
  ctx.fillStyle = '#7d99b3';
  ctx.fillRect(bx - 11, by - 14, 22, 26);
  // Equatorial resonance storm hazing the north edge (violet, not a wall)
  ctx.fillStyle = 'rgba(120,80,150,0.75)';
  ctx.fillRect(bx - 11, by - 14, 22, 3);
  // One coherent, irregular landmass (sage lowlands)
  ctx.fillStyle = '#8fa86a';
  ctx.beginPath();
  ctx.moveTo(bx - 8, by - 9);
  ctx.lineTo(bx - 2, by - 10);
  ctx.lineTo(bx + 5, by - 8);
  ctx.lineTo(bx + 9, by - 3);
  ctx.lineTo(bx + 7, by + 4);
  ctx.lineTo(bx + 9, by + 9);   // south-east cape
  ctx.lineTo(bx + 2, by + 10);
  ctx.lineTo(bx - 5, by + 8);
  ctx.lineTo(bx - 9, by + 1);
  ctx.closePath();
  ctx.fill();
  // Grey-brown mountain spine down the west
  ctx.fillStyle = '#8a7c68';
  ctx.fillRect(bx - 8, by - 7, 2, 12);
  // Pale ice tint across the cold south
  ctx.fillStyle = 'rgba(206,220,230,0.6)';
  ctx.fillRect(bx - 6, by + 6, 15, 4);
  // Two inland seas (Cyrmere NE, Valmere / fens SW)
  ctx.fillStyle = '#6f92b0';
  ctx.beginPath(); ctx.ellipse(bx + 4, by - 3, 2.4, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(bx - 3, by + 3, 2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  // Twin capitals (red) on the north-east
  ctx.fillStyle = '#b83030';
  ctx.fillRect(bx + 1, by - 6, 2, 2);
  ctx.fillRect(bx + 5, by - 5, 2, 2);
  // You-are-here home marker (blue) in the SW fens
  ctx.fillStyle = '#3060a0';
  ctx.fillRect(bx - 6, by + 4, 2, 2);
  // Frame corner bolts
  ctx.fillStyle = '#2a1008';
  ctx.fillRect(bx - 13, by - 16, 3, 3);
  ctx.fillRect(bx + 10, by - 16, 3, 3);
  ctx.fillRect(bx - 13, by + 11, 3, 3);
  ctx.fillRect(bx + 10, by + 11, 3, 3);
  // SPACE prompt when in range
  drawNPCSpaceHint(npc, bx, by - 8);
}

// Polwick's overworld sprite (smuggler fort). Copper-red Firelit hair — the
// same marker as his battle sprite (render-battle.js drawBattlePolwick) —
// on a grubby, untucked tunic. Worker body proportions.
function drawPolwickSprite(npc) {
  const px = Math.round(npc.x), py = Math.round(npc.y);
  // Tunic — dirty tan, matching the battle sprite's palette
  ctx.fillStyle = '#8a7c58';
  ctx.fillRect(px - 7, py - 10, 14, 10);         // torso
  ctx.fillRect(px - 3, py - 10, 6, 5);           // no contrast collar
  ctx.fillRect(px - 12, py - 6, 6, 5);           // left arm
  ctx.fillRect(px +  6, py - 6, 6, 5);           // right arm
  // Dirt/stain patch
  ctx.fillStyle = '#5c5238';
  ctx.fillRect(px - 4, py - 6, 4, 3);
  // Hands
  ctx.fillStyle = '#c09070';
  ctx.fillRect(px - 13, py - 3, 6, 4);
  ctx.fillRect(px +  7, py - 3, 6, 4);
  // Head
  ctx.fillStyle = '#c09070';
  ctx.fillRect(px - 5, py - 22, 10, 13);
  // Copper-red hair — medium length, a little unkempt, past the jaw
  ctx.fillStyle = '#c05a20';
  ctx.fillRect(px - 5, py - 23, 10, 6);          // top, a touch taller/messier
  ctx.fillRect(px - 6, py - 21, 2, 8);           // left side, past the jaw
  ctx.fillRect(px + 4, py - 21, 2, 7);           // right side
  ctx.fillStyle = '#e08040';
  ctx.fillRect(px - 4, py - 23, 8, 2);           // highlight
  // Eyes — half-lidded, sure of himself
  ctx.fillStyle = '#241f1a';
  ctx.fillRect(px - 3, py - 15, 2, 2);
  ctx.fillRect(px + 1, py - 15, 2, 2);
  // Legs — worn trousers, scuffed boots
  ctx.fillStyle = '#4a4438';
  ctx.fillRect(px - 5, py,      4, 8);
  ctx.fillRect(px + 1, py,      4, 8);
  ctx.fillStyle = '#2c281e';
  ctx.fillRect(px - 6, py + 6,  5, 3);
  ctx.fillRect(px + 1, py + 6,  5, 3);
  drawNPCSpaceHint(npc, px, py);
}

const NPC_DRAW_FNS = {
  maren: drawMarenSprite,
  wen:   drawWenSprite,
  calwick_school_bookshelf: drawSchoolBookshelf,
  calwick_school_map: drawSchoolWorldMap,
  polwick: drawPolwickSprite,
};

// Shared SPACE prompt drawn above an NPC when the player is in range.
function drawNPCSpaceHint(npc, px, py) {
  if (dialogue.open || choice.open || shop.open) return;
  const dx = player.x - npc.x;
  const dy = player.y - npc.y;
  if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
    ctx.fillStyle = '#a8d0d8';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE', px, py - 28);
    ctx.textAlign = 'left';
  }
}

// Seated clerk — dark jacket, cream collar, dark hair (original default style).
function drawGenericClerk(npc) {
  const px = Math.round(npc.x), py = Math.round(npc.y);
  ctx.fillStyle = '#3a404e';
  ctx.fillRect(px - 7, py - 10, 14, 10);        // jacket/shoulders
  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(px - 3, py - 10, 6, 5);           // shirt collar
  ctx.fillStyle = '#3a404e';
  ctx.fillRect(px - 12, py - 6, 6, 5);           // left arm
  ctx.fillRect(px +  6, py - 6, 6, 5);           // right arm
  ctx.fillStyle = '#c09070';
  ctx.fillRect(px - 13, py - 3, 6, 4);           // left hand
  ctx.fillRect(px +  7, py - 3, 6, 4);           // right hand
  ctx.fillStyle = '#c09070';
  ctx.fillRect(px - 5, py - 22, 10, 13);         // head
  ctx.fillStyle = '#2a1c10';
  ctx.fillRect(px - 5, py - 22, 10, 4);          // dark hair
  ctx.fillStyle = '#181620';
  ctx.fillRect(px - 3, py - 15, 2, 2);           // left eye
  ctx.fillRect(px + 1, py - 15, 2, 2);           // right eye
  ctx.fillStyle = '#2a303c';
  ctx.fillRect(px - 5, py,      4, 8);            // left leg
  ctx.fillRect(px + 1, py,      4, 8);            // right leg
  ctx.fillStyle = '#1a1814';
  ctx.fillRect(px - 6, py + 6,  5, 3);            // left shoe
  ctx.fillRect(px + 1, py + 6,  5, 3);            // right shoe
  drawNPCSpaceHint(npc, px, py);
}

// Patron — warm vest over white shirt, auburn hair. Inn/tavern visitor feel.
function drawGenericPatron(npc) {
  const px = Math.round(npc.x), py = Math.round(npc.y);
  ctx.fillStyle = '#5a3828';
  ctx.fillRect(px - 7, py - 10, 14, 10);        // vest
  ctx.fillStyle = '#e8d8c0';
  ctx.fillRect(px - 3, py - 10, 6, 5);           // white shirt collar
  ctx.fillStyle = '#5a3828';
  ctx.fillRect(px - 12, py - 6, 6, 5);           // left arm
  ctx.fillRect(px +  6, py - 6, 6, 5);           // right arm
  ctx.fillStyle = '#b88060';
  ctx.fillRect(px - 13, py - 3, 6, 4);           // left hand
  ctx.fillRect(px +  7, py - 3, 6, 4);           // right hand
  ctx.fillStyle = '#b88060';
  ctx.fillRect(px - 5, py - 22, 10, 13);         // head (slightly warmer skin)
  ctx.fillStyle = '#7a3a18';
  ctx.fillRect(px - 5, py - 22, 10, 4);          // auburn hair
  ctx.fillStyle = '#181620';
  ctx.fillRect(px - 3, py - 15, 2, 2);
  ctx.fillRect(px + 1, py - 15, 2, 2);
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(px - 5, py,      4, 8);            // left leg
  ctx.fillRect(px + 1, py,      4, 8);            // right leg
  ctx.fillStyle = '#1a1814';
  ctx.fillRect(px - 6, py + 6,  5, 3);            // left shoe
  ctx.fillRect(px + 1, py + 6,  5, 3);            // right shoe
  drawNPCSpaceHint(npc, px, py);
}

// CalwickChild — gender-neutral child sprite; shorter with a proportionally larger head.
// Total height ~22px vs adult ~31px. Head:body ratio intentionally big (child proportions).
function drawCalwickChild(npc) {
  const px = Math.round(npc.x), py = Math.round(npc.y);
  // Torso — muted teal-grey tunic
  ctx.fillStyle = '#5a7060';
  ctx.fillRect(px - 5, py - 6, 10, 6);  // body
  ctx.fillRect(px - 8, py - 5,  3, 4);  // left arm
  ctx.fillRect(px + 5, py - 5,  3, 4);  // right arm
  // Hands
  ctx.fillStyle = '#b88060';
  ctx.fillRect(px - 9, py - 3,  3, 3);  // left hand
  ctx.fillRect(px + 6, py - 3,  3, 3);  // right hand
  // Head (large relative to body — child proportions)
  ctx.fillStyle = '#b88060';
  ctx.fillRect(px - 4, py - 16, 8, 10); // head
  // Hair — optional npc.hairColor lets a child show a visible thread colour
  // (e.g. a Rosebound child's pink); defaults to ordinary brown.
  ctx.fillStyle = npc.hairColor || '#4a3020';
  ctx.fillRect(px - 4, py - 16, 8,  3); // hair
  if (npc.hairColor) {                  // a little fringe, so the colour reads clearly
    ctx.fillRect(px - 4, py - 13, 2, 2);
    ctx.fillRect(px + 2, py - 13, 2, 2);
  }
  // Eyes
  ctx.fillStyle = '#181620';
  ctx.fillRect(px - 2, py - 11, 2,  2); // left eye
  ctx.fillRect(px + 1, py - 11, 2,  2); // right eye
  // Legs
  ctx.fillStyle = '#3a2c1c';
  ctx.fillRect(px - 4, py,      3,  5); // left leg
  ctx.fillRect(px + 1, py,      3,  5); // right leg
  // Shoes
  ctx.fillStyle = '#1a1814';
  ctx.fillRect(px - 5, py + 3,  4,  3); // left shoe
  ctx.fillRect(px + 1, py + 3,  4,  3); // right shoe
  drawNPCSpaceHint(npc, px, py);
}

// Worker — rough grey-green tunic, no formal collar, dark messy hair.
function drawGenericWorker(npc) {
  const px = Math.round(npc.x), py = Math.round(npc.y);
  ctx.fillStyle = '#4a5638';
  ctx.fillRect(px - 7, py - 10, 14, 10);        // rough tunic
  ctx.fillStyle = '#4a5638';                      // no contrast collar
  ctx.fillRect(px - 3, py - 10, 6, 5);
  ctx.fillStyle = '#4a5638';
  ctx.fillRect(px - 12, py - 6, 6, 5);
  ctx.fillRect(px +  6, py - 6, 6, 5);
  ctx.fillStyle = '#a07858';
  ctx.fillRect(px - 13, py - 3, 6, 4);
  ctx.fillRect(px +  7, py - 3, 6, 4);
  ctx.fillStyle = '#a07858';
  ctx.fillRect(px - 5, py - 22, 10, 13);         // head
  ctx.fillStyle = '#3a2820';
  ctx.fillRect(px - 5, py - 22, 10, 5);          // thick dark hair (1px taller = messier)
  ctx.fillRect(px - 6, py - 20, 2, 3);           // rough sideburn left
  ctx.fillRect(px + 4, py - 20, 2, 3);           // rough sideburn right
  ctx.fillStyle = '#181620';
  ctx.fillRect(px - 3, py - 15, 2, 2);
  ctx.fillRect(px + 1, py - 15, 2, 2);
  ctx.fillStyle = '#3a4030';
  ctx.fillRect(px - 5, py,      4, 8);            // left leg
  ctx.fillRect(px + 1, py,      4, 8);            // right leg
  ctx.fillStyle = '#1a1814';
  ctx.fillRect(px - 6, py + 6,  5, 3);            // left boot
  ctx.fillRect(px + 1, py + 6,  5, 3);            // right boot
  drawNPCSpaceHint(npc, px, py);
}

// Traveler — blue-grey cloak, hood pulled up (no bare hair), lighter build.
function drawGenericTraveler(npc) {
  const px = Math.round(npc.x), py = Math.round(npc.y);
  ctx.fillStyle = '#3a4850';
  ctx.fillRect(px - 8, py - 10, 16, 10);        // wide cloak shoulders
  ctx.fillStyle = '#2a3840';
  ctx.fillRect(px - 3, py - 10, 6, 5);           // cloak front/clasp area
  ctx.fillStyle = '#3a4850';
  ctx.fillRect(px - 13, py - 6, 7, 5);           // left arm (wider cloak sleeve)
  ctx.fillRect(px +  6, py - 6, 7, 5);           // right arm
  ctx.fillStyle = '#9a8068';
  ctx.fillRect(px - 12, py - 3, 6, 4);
  ctx.fillRect(px +  6, py - 3, 6, 4);
  ctx.fillStyle = '#c09878';
  ctx.fillRect(px - 5, py - 22, 10, 13);         // face (lighter complexion)
  ctx.fillStyle = '#2a3840';
  ctx.fillRect(px - 6, py - 23, 12, 5);          // hood rim overhanging head
  ctx.fillRect(px - 6, py - 22, 2, 8);           // hood left edge
  ctx.fillRect(px + 4, py - 22, 2, 8);           // hood right edge
  ctx.fillStyle = '#181620';
  ctx.fillRect(px - 3, py - 15, 2, 2);
  ctx.fillRect(px + 1, py - 15, 2, 2);
  ctx.fillStyle = '#2a3840';
  ctx.fillRect(px - 5, py,      4, 8);            // left leg (cloak hem)
  ctx.fillRect(px + 1, py,      4, 8);            // right leg
  ctx.fillStyle = '#1a2028';
  ctx.fillRect(px - 6, py + 6,  5, 3);            // left boot
  ctx.fillRect(px + 1, py + 6,  5, 3);            // right boot
  drawNPCSpaceHint(npc, px, py);
}

// Dispatcher: reads npc.spriteType (optional) and calls the matching variant.
// Defaults to 'clerk' when spriteType is absent or unrecognised.
function drawGenericNPC(npc) {
  const style = npc.spriteType || 'clerk';
  if      (style === 'patron')   drawGenericPatron(npc);
  else if (style === 'child')    drawCalwickChild(npc);
  else if (style === 'worker')   drawGenericWorker(npc);
  else if (style === 'traveler') drawGenericTraveler(npc);
  else                           drawGenericClerk(npc);
}

// Iterates SIMPLE_NPCS, draws those on the current map.
function drawSimpleNPCs() {
  const mapId = currentMapId();
  for (const npc of SIMPLE_NPCS) {
    if (npc.map !== mapId) continue;
    const fn = NPC_DRAW_FNS[npc.id];
    if (fn) fn(npc); else drawGenericNPC(npc);
  }
}

// ─── Innkeeper Drawing (inside inn) ──────────────────────────────────────────
function drawInnkeeper() {
  const px = Math.round(INNKEEPER.x);
  const py = Math.round(INNKEEPER.y);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#3a2c18';
  ctx.fillRect(px - 7, py + 4, 6, 9);
  ctx.fillRect(px + 1, py + 4, 6, 9);
  ctx.fillStyle = '#2a1c10';
  ctx.fillRect(px - 8, py + 12, 7, 3);
  ctx.fillRect(px + 1, py + 12, 7, 3);

  // Apron over tunic
  ctx.fillStyle = '#7a5c38';   // brown tunic
  ctx.fillRect(px - 8, py - 6, 16, 13);
  ctx.fillStyle = '#e8dcc8';   // cream apron
  ctx.fillRect(px - 5, py - 4, 10, 11);
  ctx.fillStyle = '#c8b8a0';
  ctx.fillRect(px - 5, py + 3,  10, 4);

  // Belt
  ctx.fillStyle = '#4a3018';
  ctx.fillRect(px - 8, py + 4, 16, 3);

  // Arms
  ctx.fillStyle = '#7a5c38';
  ctx.fillRect(px - 13, py - 4, 5, 9);
  ctx.fillRect(px +  8, py - 4, 5, 9);
  // Hands
  ctx.fillStyle = '#c0906a';
  ctx.fillRect(px - 13, py + 3, 5, 5);
  ctx.fillRect(px +  8, py + 3, 5, 5);

  // Head
  ctx.fillStyle = '#c0906a';
  ctx.fillRect(px - 6, py - 19, 12, 13);

  // Dark brown hair
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(px - 6, py - 19, 12, 4);
  ctx.fillRect(px - 7, py - 19, 2,  8);
  ctx.fillRect(px + 5, py - 19, 2,  8);

  // Eyes (facing down)
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(px - 4, py - 11, 2, 2);
  ctx.fillRect(px + 2, py - 11, 2, 2);

  // SPACE hint when in range and no overlay open
  if (!dialogue.open && !choice.open) {
    const ix = player.x - INNKEEPER.x;
    const iy = player.y - INNKEEPER.y;
    if (Math.sqrt(ix * ix + iy * iy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 26);
      ctx.textAlign = 'left';
    }
    // Reserved table hint
    const rtx = player.x - RESERVED_TABLE.x;
    const rty = player.y - RESERVED_TABLE.y;
    if (Math.sqrt(rtx * rtx + rty * rty) < TALK_RADIUS && (tick >> 4) & 1) {
      const rpx = Math.round(RESERVED_TABLE.x);
      const rpy = Math.round(RESERVED_TABLE.y);
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', rpx, rpy - 18);
      ctx.textAlign = 'left';
    }
  }
}

// Drenwick waterfront fishing spot — col 3 row 3, dock edge facing water.
const DRENWICK_FISHING_SPOT = { x: 3.5 * TILE, y: 3.5 * TILE };

const BRIAR_WARDEN_SPAWN  = { x: 8.5 * TILE, y: 3.5 * TILE }; // col 8 row 3 — beside the spring pool in the hidden meadow (MEADOW_MAP)
const OVERSEER_MAULT_POS  = { x: 11.5 * TILE, y:  7.5 * TILE }; // col 11 row 7, Calwick main square

// ─── Drenwick Waterfront Fishing Spot ────────────────────────────────────────
// Draws a mooring cleat at the dock edge (col 3 row 3) with an animated bobber
// hanging into the water tiles above. SPACE hint appears when player is close.
function drawDrenwichFishingSpot() {
  const sx = Math.round(DRENWICK_FISHING_SPOT.x);
  const sy = Math.round(DRENWICK_FISHING_SPOT.y);

  // Mooring cleat — weathered dock wood
  ctx.fillStyle = '#6a4820';
  ctx.fillRect(sx - 5, sy - 10, 10, 8);     // cleat body
  ctx.fillStyle = '#4a2c10';
  ctx.fillRect(sx - 8, sy - 12, 4, 5);      // left horn
  ctx.fillRect(sx + 4, sy - 12, 4, 5);      // right horn
  ctx.fillStyle = '#8a6038';
  ctx.fillRect(sx - 4, sy - 9, 8, 2);       // worn highlight

  // Fishing line from cleat up into the water
  ctx.strokeStyle = 'rgba(210,205,180,0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sx + 1, sy - 10);
  ctx.lineTo(sx + 6, sy - 54);
  ctx.stroke();

  // Cork bobber — bobs on the two-frame water animation
  const bob = (tick >> 3) & 1;
  ctx.fillStyle = '#c03020';
  ctx.fillRect(sx + 4, sy - 56 + bob, 5, 6);
  ctx.fillStyle = '#f0f0e8';
  ctx.fillRect(sx + 4, sy - 56 + bob, 5, 3);

  // SPACE hint when player is near
  if (!dialogue.open) {
    const dx = player.x - DRENWICK_FISHING_SPOT.x;
    const dy = player.y - DRENWICK_FISHING_SPOT.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', sx, sy - 66);
      ctx.textAlign = 'left';
    }
  }
}

// ─── Drenwick Customs Arch ────────────────────────────────────────────────────
// Decorative stone arch at the south exit of Drenwick Civic (DRENWICK_CIVIC_MAP
// col 7 rows 11-12). Spans the funnel that leads down to the TOWN_EXIT at row 13.
// Features two flanking pillar piers, a keystone arch, and an Imperial eagle
// in relief above the opening.
function drawDrenwwickCustomsArch() {
  if (!inTown || townBuilding || currentTownId !== 'drenwick') return;
  if (activeMap !== DRENWICK_CIVIC_MAP) return;

  const ax = 7 * TILE;   // col 7 left edge
  const ay = 11 * TILE;  // row 11 top edge  (arch spans rows 11-12)

  // ── West pier ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#7a7068';   // weathered ashlar
  ctx.fillRect(ax - 14, ay, 14, 64);
  ctx.fillStyle = '#9a9080';   // highlight face
  ctx.fillRect(ax - 14, ay, 3, 64);
  ctx.fillStyle = '#5a5048';   // shadow face
  ctx.fillRect(ax - 1, ay, 1, 64);
  // Course lines (horizontal stone joints)
  ctx.fillStyle = '#6a6058';
  for (let j = 0; j < 4; j++) ctx.fillRect(ax - 14, ay + 16 * j, 14, 1);

  // ── East pier ──────────────────────────────────────────────────────────────
  ctx.fillStyle = '#7a7068';
  ctx.fillRect(ax + 32, ay, 14, 64);
  ctx.fillStyle = '#9a9080';
  ctx.fillRect(ax + 32, ay, 3, 64);
  ctx.fillStyle = '#5a5048';
  ctx.fillRect(ax + 44, ay, 1, 64);
  ctx.fillStyle = '#6a6058';
  for (let j = 0; j < 4; j++) ctx.fillRect(ax + 32, ay + 16 * j, 14, 1);

  // ── Arch lintel + semi-circular soffit ────────────────────────────────────
  // Lintel beam across the top
  ctx.fillStyle = '#6a6058';
  ctx.fillRect(ax - 14, ay, 60, 14);
  ctx.fillStyle = '#8a8070';
  ctx.fillRect(ax - 14, ay, 60, 3);
  ctx.fillStyle = '#4a4038';
  ctx.fillRect(ax - 14, ay + 13, 60, 1);
  // Keystone — slightly lighter wedge at centre
  ctx.fillStyle = '#b0a888';
  ctx.fillRect(ax + 12, ay, 8, 14);
  ctx.fillStyle = '#c8c0a0';
  ctx.fillRect(ax + 12, ay, 8, 3);

  // ── Imperial Eagle in relief (centre of lintel) ───────────────────────────
  const ex = ax + 16, ey = ay + 3;  // eagle pixel origin
  // Body
  ctx.fillStyle = '#585040';
  ctx.fillRect(ex, ey + 2, 4, 5);
  // Wings spread (left / right)
  ctx.fillRect(ex - 5, ey + 3, 5, 2);
  ctx.fillRect(ex + 4, ey + 3, 5, 2);
  ctx.fillRect(ex - 7, ey + 2, 3, 1);
  ctx.fillRect(ex + 8, ey + 2, 3, 1);
  // Head
  ctx.fillRect(ex + 1, ey, 3, 3);
  // Beak
  ctx.fillRect(ex + 3, ey + 1, 2, 1);
  // Talons
  ctx.fillRect(ex,     ey + 7, 2, 2);
  ctx.fillRect(ex + 2, ey + 7, 2, 2);

  // ── Passage opening (just the arch shadow framing the path below) ─────────
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(ax, ay + 14, 32, 50);
}

// ─── Mirethyst's Vault — Ancient Rareborn Pillars ────────────────────────────
// Draws decorative column capitals on the DUNGEON2_WALL tiles that form the
// pillar row (MIRE_VAULT_MAP row 3, cols 3 & 5 on west side; cols 9 & 12 on east).
// The capitals glow faintly — bioluminescent fungal growth in the carved grooves,
// a pre-Empire building technique.
function drawMireVaultPillars() {
  if (!inMireVault) return;

  // Pillar positions in MIRE_VAULT_MAP row 3
  const pillarCols = [3, 5, 9, 12];
  const row = 3;

  for (const col of pillarCols) {
    const px = col * TILE + 16;    // pixel centre x
    const py = row * TILE + 16;    // pixel centre y

    // Plinth (base block — sits on the floor tile below)
    ctx.fillStyle = '#4a4860';
    ctx.fillRect(px - 12, py + 8, 24, 10);
    ctx.fillStyle = '#5a5870';
    ctx.fillRect(px - 12, py + 8, 24, 3);

    // Shaft (cylindrical column body — tall strip)
    ctx.fillStyle = '#3a3850';
    ctx.fillRect(px - 7, py - 20, 14, 30);
    ctx.fillStyle = '#4a4860';
    ctx.fillRect(px - 7, py - 20, 3, 30);   // highlight rib
    ctx.fillStyle = '#2a2838';
    ctx.fillRect(px + 5, py - 20, 2, 30);   // shadow rib

    // Capital (carved top block — wider)
    ctx.fillStyle = '#5a5870';
    ctx.fillRect(px - 11, py - 24, 22, 8);
    ctx.fillStyle = '#7a7898';
    ctx.fillRect(px - 11, py - 24, 22, 3);

    // Rune grooves carved into the shaft — glowing blue-green
    const glowPulse = Math.sin(tick * 0.04 + col * 1.2) * 0.5 + 0.5;  // 0-1
    const glowAlpha = 0.4 + glowPulse * 0.4;
    ctx.fillStyle = `rgba(80,200,160,${glowAlpha})`;
    // Three horizontal rune bands
    ctx.fillRect(px - 5, py - 15, 10, 2);
    ctx.fillRect(px - 5, py -  8, 10, 2);
    ctx.fillRect(px - 5, py -  1, 10, 2);
    // Vertical crossing mark (center rune glyph)
    ctx.fillRect(px - 1, py - 17, 2,  6);
    ctx.fillRect(px - 1, py - 10, 2,  6);
    ctx.fillRect(px - 1, py -  3, 2,  6);

    // Soft halo around capital
    ctx.fillStyle = `rgba(80,200,160,${glowAlpha * 0.25})`;
    ctx.fillRect(px - 14, py - 27, 28, 14);
  }
}

// ─── South Ruins — Entrance Hall decoration ──────────────────────────────────
// Broken pillar stumps (drawn over the RUIN_WALL collision tiles at col 4 and
// col 11, rows 6 and 9 of DUNGEON_ENTRANCE_MAP) and a stone rim + waterline
// mark around the drained basin (rows 7-8, cols 7-8). Pure decoration —
// collision comes from the tile grid itself, same pattern as
// drawMireVaultPillars() above.
function drawSouthRuinsEntranceDecor() {
  if (!inDungeonEntrance) return;

  // ── Broken pillar stumps ──────────────────────────────────────────────────
  const pillarTiles = [[4, 6], [11, 6], [4, 9], [11, 9]];
  for (const [col, row] of pillarTiles) {
    const px = col * TILE + 16;
    const py = row * TILE + 16;

    // Plinth (base block)
    ctx.fillStyle = '#3a3830';
    ctx.fillRect(px - 13, py + 6, 26, 11);
    ctx.fillStyle = '#4a4838';
    ctx.fillRect(px - 13, py + 6, 26, 3);

    // Broken shaft — short, uneven, snapped off partway up (not a full column)
    ctx.fillStyle = '#48463c';
    ctx.fillRect(px - 8, py - 10, 16, 17);
    ctx.fillStyle = '#585444';
    ctx.fillRect(px - 8, py - 10, 3, 17);   // highlight rib
    ctx.fillStyle = '#302e26';
    ctx.fillRect(px + 5, py - 10, 2, 17);   // shadow rib

    // Jagged broken top — irregular silhouette instead of a capital
    ctx.fillStyle = '#3a3830';
    ctx.fillRect(px - 8, py - 14, 5, 4);
    ctx.fillRect(px - 2, py - 17, 6, 7);
    ctx.fillRect(px + 3, py - 12, 3, 2);

    // Moss on the broken edge
    ctx.fillStyle = '#3a5a30';
    ctx.fillRect(px - 2, py - 16, 4, 2);

    // A little rubble scattered at the base
    ctx.fillStyle = '#302e26';
    ctx.fillRect(px - 16, py + 15, 5, 3);
    ctx.fillRect(px + 12, py + 16, 4, 3);
  }

  // ── Drained basin rim ─────────────────────────────────────────────────────
  // Basin occupies DUNGEON_ENTRANCE_MAP rows 7-8, cols 7-8 (WATER tiles).
  const bx = 7 * TILE, by = 7 * TILE, bw = 2 * TILE, bh = 2 * TILE;
  ctx.fillStyle = '#403e34';
  ctx.fillRect(bx - 3, by - 3, bw + 6, 3);           // top rim
  ctx.fillRect(bx - 3, by + bh, bw + 6, 3);          // bottom rim
  ctx.fillRect(bx - 3, by - 3, 3, bh + 6);           // left rim
  ctx.fillRect(bx + bw, by - 3, 3, bh + 6);          // right rim
  // Old tideline stained into the rim itself, just above the current water —
  // a pale mineral ring marking how much higher the flood used to sit
  ctx.fillStyle = 'rgba(150, 170, 140, 0.30)';
  ctx.fillRect(bx - 3, by - 2, bw + 6, 2);
}

// ─── Drenwick Market Stalls ───────────────────────────────────────────────────
// Three canopied market stalls inside the DRENWICK_MARKET_MAP market square
// (rows 5-7, cols 3-11). Each stall has a striped awning, a trestle table,
// and a handful of goods. Drawn as a static overlay above the TOWN_MARKET tiles.
function drawDrenwwickMarketStalls() {
  // Called only when inTown && !townBuilding && drenwick && DRENWICK_MARKET_MAP

  // Stall definitions: [pixel-x, pixel-y, awning stripe colour, goods label]
  // Stalls avoid col 7 row 6 (notice board). Three stalls spread across market.
  const stalls = [
    { x: 3 * TILE, y: 5 * TILE, stripe: '#7a3010', goods: 'CLOTH'  },
    { x: 8 * TILE, y: 5 * TILE, stripe: '#184a18', goods: 'GRAIN'  },
    { x:10 * TILE, y: 5 * TILE, stripe: '#1a1a5a', goods: 'TOOLS'  },
  ];

  for (const s of stalls) {
    const sx = s.x, sy = s.y;

    // ── Trestle table (two rows tall, 2 tiles wide) ──────────────────────
    // Table legs
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(sx + 3,  sy + 20, 4, 40);
    ctx.fillRect(sx + 25, sy + 20, 4, 40);
    // Table top surface
    ctx.fillStyle = '#7a5028';
    ctx.fillRect(sx, sy + 16, 32, 8);
    ctx.fillStyle = '#9a6838';
    ctx.fillRect(sx, sy + 16, 32, 2);   // top highlight

    // ── Goods on table ───────────────────────────────────────────────────
    if (s.goods === 'CLOTH') {
      // Bolt of fabric — layered roll
      ctx.fillStyle = '#c84040';
      ctx.fillRect(sx + 4, sy + 10, 10, 7);
      ctx.fillStyle = '#e06060';
      ctx.fillRect(sx + 4, sy + 10, 10, 2);
      ctx.fillStyle = '#4060a0';
      ctx.fillRect(sx + 17, sy + 11, 10, 6);
      ctx.fillStyle = '#6080c0';
      ctx.fillRect(sx + 17, sy + 11, 10, 2);
    } else if (s.goods === 'GRAIN') {
      // Small sacks piled up
      ctx.fillStyle = '#a07830';
      ctx.fillRect(sx + 4,  sy + 12, 10, 7);
      ctx.fillRect(sx + 16, sy + 12, 10, 7);
      ctx.fillRect(sx + 10, sy +  8, 10, 7);
      // Sack ties
      ctx.fillStyle = '#786020';
      ctx.fillRect(sx + 8,  sy + 11, 3, 2);
      ctx.fillRect(sx + 20, sy + 11, 3, 2);
      ctx.fillRect(sx + 14, sy +  7, 3, 2);
    } else if (s.goods === 'TOOLS') {
      // A hammer and a coil of rope
      ctx.fillStyle = '#808080';  // hammerhead
      ctx.fillRect(sx + 4, sy + 10, 8, 5);
      ctx.fillStyle = '#5a3818';  // handle
      ctx.fillRect(sx + 7, sy + 14, 3, 6);
      // Rope coil
      ctx.fillStyle = '#c09848';
      ctx.fillRect(sx + 17, sy + 11, 10, 8);
      ctx.fillStyle = '#a07838';
      ctx.fillRect(sx + 18, sy + 12, 8, 6);
      ctx.fillStyle = '#c09848';
      ctx.fillRect(sx + 20, sy + 13, 4, 4);
    }

    // ── Awning frame posts ───────────────────────────────────────────────
    ctx.fillStyle = '#6a4820';
    ctx.fillRect(sx + 1, sy - 16, 3, 36);   // left post
    ctx.fillRect(sx + 28, sy - 16, 3, 36);  // right post

    // ── Striped awning canopy ─────────────────────────────────────────────
    // Base awning colour (cream)
    ctx.fillStyle = '#d8c898';
    ctx.fillRect(sx - 2, sy - 18, 36, 12);
    // Coloured stripes
    ctx.fillStyle = s.stripe;
    for (let stripe = 0; stripe < 4; stripe++) {
      ctx.fillRect(sx - 2 + stripe * 9, sy - 18, 5, 12);
    }
    // Awning drape (scalloped fringe — three rectangles hanging down)
    ctx.fillStyle = '#c8b880';
    ctx.fillRect(sx - 2, sy - 6, 10, 5);
    ctx.fillRect(sx + 11, sy - 6, 10, 5);
    ctx.fillRect(sx + 24, sy - 6, 10, 5);
    ctx.fillStyle = s.stripe;
    ctx.fillRect(sx - 2, sy - 6, 10, 2);
    ctx.fillRect(sx + 11, sy - 6, 10, 2);
    ctx.fillRect(sx + 24, sy - 6, 10, 2);

    // ── Goods label ───────────────────────────────────────────────────────
    ctx.fillStyle = '#d8d0b0';
    ctx.font = '6px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(s.goods, sx + 16, sy - 21);
    ctx.textAlign = 'left';
  }
}

// ─── Drenwick Innkeeper Drawing (inside Drenwick inn) ────────────────────────
// Palette: cool slate jacket (#485058) and pewter apron (#d8dce0) over
// darker trousers (#2c3038) — professional efficiency vs. Calwick's warm browns.
// Skin tone slightly cooler (#b89878). Near-black hair (#1a1820).
function drawDrenwichInnkeeper() {
  const px = Math.round(DRENWICK_INNKEEPER.x);
  const py = Math.round(DRENWICK_INNKEEPER.y);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (dark slate trousers)
  ctx.fillStyle = '#2c3038';
  ctx.fillRect(px - 7, py + 4, 6, 9);
  ctx.fillRect(px + 1, py + 4, 6, 9);
  ctx.fillStyle = '#1a2028';
  ctx.fillRect(px - 8, py + 12, 7, 3);
  ctx.fillRect(px + 1, py + 12, 7, 3);

  // Jacket (cool slate grey — professional, not warm)
  ctx.fillStyle = '#485058';
  ctx.fillRect(px - 8, py - 6, 16, 13);
  // Apron (pewter — cooler than Calwick's cream)
  ctx.fillStyle = '#d8dce0';
  ctx.fillRect(px - 5, py - 4, 10, 11);
  ctx.fillStyle = '#b8bcc0';
  ctx.fillRect(px - 5, py + 3, 10, 4);

  // Belt (dark slate)
  ctx.fillStyle = '#2a3038';
  ctx.fillRect(px - 8, py + 4, 16, 3);

  // Arms (jacket sleeves)
  ctx.fillStyle = '#485058';
  ctx.fillRect(px - 13, py - 4, 5, 9);
  ctx.fillRect(px +  8, py - 4, 5, 9);
  // Hands (cooler skin tone)
  ctx.fillStyle = '#b89878';
  ctx.fillRect(px - 13, py + 3, 5, 5);
  ctx.fillRect(px +  8, py + 3, 5, 5);

  // Head (cooler skin tone)
  ctx.fillStyle = '#b89878';
  ctx.fillRect(px - 6, py - 19, 12, 13);

  // Near-black hair — practical, close-cropped
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(px - 6, py - 19, 12,  4);
  ctx.fillRect(px - 7, py - 19,  2,  8);
  ctx.fillRect(px + 5, py - 19,  2,  8);

  // Eyes (facing down)
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(px - 4, py - 11, 2, 2);
  ctx.fillRect(px + 2, py - 11, 2, 2);

  // SPACE hint when in range and no overlay open
  if (!dialogue.open && !choice.open) {
    const ix = player.x - DRENWICK_INNKEEPER.x;
    const iy = player.y - DRENWICK_INNKEEPER.y;
    if (Math.sqrt(ix * ix + iy * iy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 26);
      ctx.textAlign = 'left';
    }
  }
}


// ─── Item list helper ─────────────────────────────────────────────────────────
function currentItemList() {
  return inDungeon    ? (dungeonFloor === 1  ? DUNGEON_ITEMS :
                         dungeonFloor === 2  ? DUNGEON2_ITEMS :
                         dungeonFloor === 3  ? (activeMap === DUNGEON3_TL_MAP ? DUNGEON3_TL_ITEMS :
                                                activeMap === DUNGEON3_TR_MAP ? DUNGEON3_TR_ITEMS :
                                                activeMap === DUNGEON3_ML_MAP ? DUNGEON3_ML_ITEMS :
                                                activeMap === DUNGEON3_MC_MAP ? DUNGEON3_MC_ITEMS :
                                                activeMap === DUNGEON3_MR_MAP ? DUNGEON3_MR_ITEMS :
                                                activeMap === DUNGEON3_BL_MAP ? DUNGEON3_BL_ITEMS :
                                                activeMap === DUNGEON3_BC_MAP ? DUNGEON3_BC_ITEMS :
                                                activeMap === DUNGEON3_BR_MAP ? DUNGEON3_BR_ITEMS :
                                                DUNGEON3_TC_ITEMS) :
                         dungeonFloor === 4  ? DUNGEON4_ITEMS :
                         dungeonFloor === 5  ? DUNGEON5_ITEMS :
                         dungeonFloor === 6  ? DUNGEON6_ITEMS :
                         dungeonFloor === 7  ? DUNGEON7_ITEMS :
                         dungeonFloor === 8  ? DUNGEON8_ITEMS :
                         dungeonFloor === 9  ? DUNGEON8_WEST_ITEMS :
                         DUNGEON8_EAST_ITEMS)
       : inSluice     ? (sluiceFloor === 1 ? SLUICE_ITEMS : sluiceFloor === 2 ? SLUICE_LEVEL2_ITEMS : sluiceFloor === 3 ? SLUICE_LEVEL3_ITEMS : SLUICE_SECRET_ITEMS)
       : inMireVault  ? MIRE_VAULT_ITEMS
       : inTown       ? []
       : inLorraHouse    ? []
       : inMarenPost     ? []
       : inDrenwrickPost ? []
       : inBridgePost    ? []
       : inSmugglerFort  ? []
       : inFenBrewery      ? []
       : inHamletInterior  ? []
       : inDungeonEntrance ? DUNGEON_ENTRANCE_ITEMS
       // Plain overworld maps (MAP2, MAP3, the North Basin maps, etc.) --
       // this used to be one "activeMap === X ? X_ITEMS :" clause per map;
       // a new outdoor map now needs zero changes here, just a
       // MAP_METADATA entry with an `items` array (even if empty). The same
       // fall-through also serves flag-based areas whose flag has no branch
       // above but whose activeMap is registered with metadata items (the
       // unmarked chamber and the Sunken Gallery resolve here). Falls
       // back to WORLD_ITEMS only if activeMap has no metadata at all
       // (shouldn't happen for a registered map -- see validateGameData()'s
       // MAP_METADATA section -- but this keeps the function from ever
       // returning undefined).
       : (MAP_METADATA[mapRegistryId(activeMap)] ? MAP_METADATA[mapRegistryId(activeMap)].items : WORLD_ITEMS);
}

// ─── Chest Drawing Helper ─────────────────────────────────────────────────────
function drawChest(chest) {
  const px  = Math.round(chest.x);
  const py  = Math.round(chest.y);
  const bob = Math.round(Math.sin(tick * 0.06) * 2);
  const cy2 = py + bob;
  // Body (lower half)
  ctx.fillStyle = '#6a4820';
  ctx.fillRect(px - 12, cy2 - 1, 24, 13);
  // Lid
  ctx.fillStyle = '#7a5828';
  ctx.fillRect(px - 12, cy2 - 8, 24, 9);
  // Metal band across lid/body seam
  ctx.fillStyle = '#a89030';
  ctx.fillRect(px - 12, cy2 - 2, 24, 3);
  // Vertical center band
  ctx.fillRect(px - 2, cy2 - 8, 4, 21);
  // Corner studs
  ctx.fillStyle = '#c0a840';
  ctx.fillRect(px - 11, cy2 - 7, 3, 3);
  ctx.fillRect(px +  8, cy2 - 7, 3, 3);
  ctx.fillRect(px - 11, cy2 +  8, 3, 3);
  ctx.fillRect(px +  8, cy2 +  8, 3, 3);
  // Lock hasp
  ctx.fillStyle = '#c0a840';
  ctx.fillRect(px - 3, cy2 + 1, 6, 5);
  ctx.fillStyle = '#0a0808';
  ctx.fillRect(px - 1, cy2 + 2, 2, 3);
  // Golden ambient glow
  ctx.fillStyle = 'rgba(190, 150, 20, 0.15)';
  ctx.beginPath();
  ctx.ellipse(px, cy2 + 6, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // Label
  ctx.fillStyle = '#d8c878';
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Chest', px, cy2 - 14);
  ctx.textAlign = 'left';
  // SPACE hint when adjacent
  const dx = player.x - chest.x;
  const dy = player.y - chest.y;
  if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
    ctx.fillStyle = '#c8d898';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE', px, cy2 - 26);
    ctx.textAlign = 'left';
  }
}

// Invisible chest — renders nothing; only shows the SPACE prompt when adjacent.
// Use by setting chest.sprite = 'invisible' on any chest object.
function drawInvisibleChest(chest) {
  const dx = player.x - chest.x;
  const dy = player.y - chest.y;
  if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
    const px = Math.round(chest.x);
    const py = Math.round(chest.y);
    ctx.fillStyle = '#c8d898';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE', px, py - 10);
    ctx.textAlign = 'left';
  }
}

// ─── World Items Drawing ──────────────────────────────────────────────────────
function drawWorldItems() {
  const list = currentItemList();
  for (const wi of list) {
    if (wi.picked) continue;
    const px = Math.round(wi.x);
    const py = Math.round(wi.y);
    // Gentle float
    const bob = Math.round(Math.sin(tick * 0.07) * 2);
    const iy = py + bob - 8;

    if (wi.type === 'weapon') {
      // Sword icon
      ctx.fillStyle = '#a0b8c8';
      ctx.fillRect(px - 1, iy - 8, 3, 14);   // blade
      ctx.fillStyle = '#c8a040';
      ctx.fillRect(px - 5, iy + 3, 11, 3);   // guard
      ctx.fillStyle = '#8a5830';
      ctx.fillRect(px - 1, iy + 6, 3, 5);    // grip
    } else if (wi.type === 'armor') {
      // Chest-armor icon (rectangular breastplate)
      ctx.fillStyle = '#5a7878';
      ctx.fillRect(px - 6, iy - 7, 12, 14);  // body
      ctx.fillStyle = '#3a5858';
      ctx.fillRect(px - 6, iy + 4, 12, 4);   // lower
      ctx.fillStyle = '#7aaa9a';
      ctx.fillRect(px - 3, iy - 5, 6, 5);    // emblem
    } else if (wi.type === 'shield') {
      // Shield icon (rounded-top silhouette)
      ctx.fillStyle = '#6a7898';
      ctx.fillRect(px - 6, iy - 7, 12, 10);  // upper body
      ctx.fillRect(px - 4, iy + 3,  8,  5);  // lower taper
      ctx.fillRect(px - 2, iy + 8,  4,  3);  // point
      ctx.fillStyle = '#9ab8c8';
      ctx.fillRect(px - 1, iy - 5,  2,  6);  // cross bar vertical
      ctx.fillRect(px - 4, iy - 2,  8,  2);  // cross bar horizontal
    } else if (wi.type === 'accessory') {
      // Trinket icon (small gem/ring)
      ctx.fillStyle = '#7040a0';
      ctx.fillRect(px - 4, iy - 4,  8,  8);  // gem body
      ctx.fillStyle = '#b070e0';
      ctx.fillRect(px - 2, iy - 2,  4,  4);  // gem highlight
      ctx.fillStyle = '#c8a030';
      ctx.fillRect(px - 5, iy - 6,  10, 3);  // setting / band top
      ctx.fillRect(px - 5, iy + 4,  10, 3);  // band bottom
    } else if (wi.type === 'potion') {
      // Flask icon
      ctx.fillStyle = '#6a1428';
      ctx.fillRect(px - 5, iy - 2, 10, 11);  // body outline
      ctx.fillStyle = '#c02848';
      ctx.fillRect(px - 4, iy - 1, 8,  9);   // body fill
      ctx.fillStyle = '#f05070';
      ctx.fillRect(px - 3, iy,      4,  4);   // shine
      ctx.fillStyle = '#801830';
      ctx.fillRect(px - 2, iy - 6,  4,  5);   // neck
      ctx.fillStyle = '#6a400e';
      ctx.fillRect(px - 2, iy - 9,  4,  4);   // cork
      // Red glow
      ctx.fillStyle = 'rgba(200, 40, 60, 0.18)';
      ctx.beginPath();
      ctx.ellipse(px, iy + 4, 9, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (wi.type === 'quest_item') {
      // Fen sickle — weathered iron crescent blade, worn wood handle
      ctx.fillStyle = '#7a8060';          // weathered iron
      ctx.fillRect(px - 5, iy - 7, 11, 2);   // blade spine
      ctx.fillRect(px - 7, iy - 5,  3, 5);   // blade hook left
      ctx.fillRect(px + 4, iy - 5,  3, 5);   // blade hook right
      ctx.fillStyle = '#6a4820';          // wood handle
      ctx.fillRect(px - 1, iy - 1,  3, 8);   // handle shaft
      ctx.fillStyle = '#4a3012';          // leather grip wrap
      ctx.fillRect(px - 1, iy - 1,  3, 2);   // top wrap
      // Faint amber glow to mark quest significance
      ctx.fillStyle = 'rgba(160, 130, 30, 0.18)';
      ctx.beginPath();
      ctx.ellipse(px, iy, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (wi.type === 'inscription') {
      // Ancient rune slab — flat stone tablet, amber glow
      ctx.fillStyle = '#28262e';
      ctx.fillRect(px - 10, iy - 6, 20, 14);  // slab body
      ctx.fillStyle = '#38364a';
      ctx.fillRect(px - 8,  iy - 4, 16, 10);  // slab face
      // Rune lines
      ctx.fillStyle = '#a07820';
      ctx.fillRect(px - 6, iy - 1, 12, 1);
      ctx.fillRect(px - 4, iy + 1,  8, 1);
      ctx.fillRect(px - 6, iy + 3,  5, 1);
      ctx.fillRect(px + 1, iy + 3,  5, 1);
      // Amber glow
      ctx.fillStyle = 'rgba(160, 120, 20, 0.22)';
      ctx.beginPath();
      ctx.ellipse(px, iy + 2, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pick-up hint label (suppressed for quest items — they identify themselves via dialogue)
    if (wi.type !== 'quest_item') {
      ctx.fillStyle = '#c8e8d8';
      ctx.font = '9px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(wi.name, px, iy - 12);
      ctx.textAlign = 'left';
    }
  }

  // ── Sluice chest (level 1) ────────────────────────────────────────────────
  if (inSluice && sluiceFloor === 1 && !SLUICE_CHEST.opened) {
    drawChest(SLUICE_CHEST);
  }

  // ── Sluice chest (level 2) ────────────────────────────────────────────────
  if (inSluice && sluiceFloor === 2 && !SLUICE_LEVEL2_CHEST.opened) {
    drawChest(SLUICE_LEVEL2_CHEST);
  }

  // ── Sluice secret chest (level 2 secret area, r10 c13) ───────────────────
  if (inSluice && sluiceFloor === 2 && !SLUICE_SECRET_CHEST.opened) {
    drawChest(SLUICE_SECRET_CHEST);
  }

  // ── Sluice level 3 chest (south chamber, r10 c7) ──────────────────────────
  if (inSluice && sluiceFloor === 3 && !SLUICE_LEVEL3_CHEST.opened) {
    drawChest(SLUICE_LEVEL3_CHEST);
  }

  // ── Dungeon chest (floor 1 only) ──────────────────────────────────────────
  if (inDungeon && dungeonFloor === 1 && !DUNGEON_CHEST.opened) {
    drawChest(DUNGEON_CHEST);
  }

  // ── Dungeon alcove chest (floor 1 secret alcove) ───────────────────────────
  if (inDungeon && dungeonFloor === 1 && !DUNGEON_ALCOVE_CHEST.opened) {
    drawChest(DUNGEON_ALCOVE_CHEST);
  }

  // ── Sluice deep chest (level 3 secret annex) ──────────────────────────────
  if (inSluice && sluiceFloor === 3 && !SLUICE_DEEP_CHEST.opened) {
    drawChest(SLUICE_DEEP_CHEST);
  }
}

// ─── Merchant Drawing ────────────────────────────────────────────────────────
function drawMerchantSprite() {
  if (!inTown || townBuilding || currentTownId === 'drenwick') return;
  const px = Math.round(MERCHANT.x);
  const py = Math.round(MERCHANT.y);
  const bob = Math.round(Math.sin(tick * 0.04) * 1);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(px, py + 16, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Robe — deep burgundy, slightly wider than innkeeper
  ctx.fillStyle = '#6a1e2a';
  ctx.fillRect(px - 8, py - 4 + bob, 16, 16);
  // Robe hem
  ctx.fillStyle = '#4a1018';
  ctx.fillRect(px - 9, py + 8 + bob, 18, 6);

  // Belt
  ctx.fillStyle = '#8a6020';
  ctx.fillRect(px - 8, py - 1 + bob, 16, 3);
  // Belt buckle
  ctx.fillStyle = '#c8a030';
  ctx.fillRect(px - 2, py - 2 + bob, 4, 4);

  // Arms
  ctx.fillStyle = '#6a1e2a';
  ctx.fillRect(px - 13, py - 6 + bob, 6, 12);
  ctx.fillRect(px + 7,  py - 6 + bob, 6, 12);
  // Hands
  ctx.fillStyle = '#c89868';
  ctx.fillRect(px - 14, py + 4 + bob, 6, 4);
  ctx.fillRect(px + 8,  py + 4 + bob, 6, 4);

  // Torso / shirt collar
  ctx.fillStyle = '#8a2e3a';
  ctx.fillRect(px - 6, py - 10 + bob, 12, 8);

  // Head
  ctx.fillStyle = '#c89868';
  ctx.fillRect(px - 6, py - 20 + bob, 12, 12);

  // Hat — wide brim merchant's hat
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(px - 9, py - 22 + bob, 18, 4);   // brim
  ctx.fillRect(px - 5, py - 28 + bob, 10, 8);   // crown
  // Hat band
  ctx.fillStyle = '#c8a030';
  ctx.fillRect(px - 5, py - 22 + bob, 10, 2);

  // Eyes
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(px - 3, py - 15 + bob, 2, 2);
  ctx.fillRect(px + 1, py - 15 + bob, 2, 2);

  // SPACE hint when in range
  if (!dialogue.open && !choice.open && !shop.open) {
    const dx = player.x - MERCHANT.x;
    const dy = player.y - MERCHANT.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 34 + bob);
      ctx.textAlign = 'left';
    }
  }
}

// ─── Traveller Drawing ────────────────────────────────────────────────────────
function drawTravellerSprite() {
  if (!inTown || townBuilding || !travellerPresent || currentTownId === 'drenwick') return;
  const px  = Math.round(TRAVELLER.x);
  const py  = Math.round(TRAVELLER.y);
  const bob = Math.round(Math.sin(tick * 0.05) * 1);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(px, py + 16, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Long travel cloak — deep teal/green
  ctx.fillStyle = '#1a5040';
  ctx.fillRect(px - 8, py - 4 + bob, 16, 18);
  // Cloak hem with a slightly lighter edge
  ctx.fillStyle = '#0e3828';
  ctx.fillRect(px - 9, py + 10 + bob, 18, 4);
  ctx.fillStyle = '#246050';
  ctx.fillRect(px - 9, py + 10 + bob, 18, 1);

  // Cloak clasp (brooch)
  ctx.fillStyle = '#d0a830';
  ctx.fillRect(px - 2, py - 6 + bob, 4, 4);
  ctx.fillStyle = '#f0c840';
  ctx.fillRect(px - 1, py - 5 + bob, 2, 2);

  // Arms — wrapped in cloak
  ctx.fillStyle = '#1a5040';
  ctx.fillRect(px - 13, py - 5 + bob, 6, 13);
  ctx.fillRect(px +  7, py - 5 + bob, 6, 13);
  // Hands holding pack strap
  ctx.fillStyle = '#b88060';
  ctx.fillRect(px - 14, py + 5 + bob, 6, 4);
  ctx.fillRect(px +  8, py + 5 + bob, 6, 4);

  // Torso / inner tunic visible at collar
  ctx.fillStyle = '#2a7060';
  ctx.fillRect(px - 5, py - 10 + bob, 10, 7);

  // Head
  ctx.fillStyle = '#b88060';
  ctx.fillRect(px - 5, py - 20 + bob, 10, 11);

  // Hair — dark auburn, slightly long
  ctx.fillStyle = '#5a2810';
  ctx.fillRect(px - 6, py - 20 + bob, 12, 3);  // top
  ctx.fillRect(px - 6, py - 18 + bob, 2,  9);  // left side
  ctx.fillRect(px +  4, py - 18 + bob, 2, 9);  // right side

  // Hood pushed back (resting on shoulders)
  ctx.fillStyle = '#0e3828';
  ctx.fillRect(px - 7, py - 22 + bob, 14, 4);
  ctx.fillStyle = '#1a5040';
  ctx.fillRect(px - 6, py - 22 + bob, 12, 3);

  // Eyes
  ctx.fillStyle = '#1a1820';
  ctx.fillRect(px - 3, py - 14 + bob, 2, 2);
  ctx.fillRect(px + 1, py - 14 + bob, 2, 2);

  // Pack / bundle on her back (drawn offset to imply depth)
  ctx.fillStyle = '#7a5030';
  ctx.fillRect(px + 8, py - 8 + bob, 8, 14);
  ctx.fillStyle = '#9a6840';
  ctx.fillRect(px + 9, py - 7 + bob, 6, 12);
  // Pack strap
  ctx.fillStyle = '#5a3818';
  ctx.fillRect(px + 6, py - 4 + bob, 3, 10);

  // SPACE hint when in range
  if (!dialogue.open && !choice.open && !shop.open) {
    const dx = player.x - TRAVELLER.x;
    const dy = player.y - TRAVELLER.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 30 + bob);
      ctx.textAlign = 'left';
    }
  }
}

// ─── Shop Drawing ─────────────────────────────────────────────────────────────
function drawShop() {
  if (!shop.open) return;

  // Dim world
  ctx.fillStyle = 'rgba(0,0,0,0.60)';
  ctx.fillRect(0, 0, 512, 480);

  const BW = 320, BH = 300;
  const BX = Math.floor((512 - BW) / 2);
  const BY = Math.floor((480 - BH) / 2);
  const PAD = 16;

  // Panel background
  ctx.fillStyle = '#08121e';
  ctx.fillRect(BX, BY, BW, BH);

  // Outer border
  ctx.strokeStyle = '#9a6830';
  ctx.lineWidth = 2;
  ctx.strokeRect(BX + 1, BY + 1, BW - 2, BH - 2);

  // Inner border
  ctx.strokeStyle = '#4a3010';
  ctx.lineWidth = 1;
  ctx.strokeRect(BX + 5, BY + 5, BW - 10, BH - 10);

  // Corner accents
  ctx.fillStyle = '#c8a040';
  ctx.fillRect(BX + 1,        BY + 1,        2, 2);
  ctx.fillRect(BX + BW - 3,   BY + 1,        2, 2);
  ctx.fillRect(BX + 1,        BY + BH - 3,   2, 2);
  ctx.fillRect(BX + BW - 3,   BY + BH - 3,   2, 2);

  // Title
  ctx.fillStyle = '#c8a040';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(shop.title, BX + PAD, BY + 22);

  // Gold display (right-aligned in header)
  const goldStr = `\u25cf ${stats.gold} g`;
  ctx.fillStyle = '#c8a830';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText(goldStr, BX + BW - PAD, BY + 22);
  ctx.textAlign = 'left';

  // Separator
  ctx.fillStyle = '#4a3010';
  ctx.fillRect(BX + PAD, BY + 28, BW - PAD * 2, 1);

  if (shop.screen === 'main') {
    // ── Main menu ─────────────────────────────────────────────────────────
    const opts = ['Buy', 'Sell', 'Leave'];
    ctx.font = '13px "Courier New", monospace';
    opts.forEach((opt, i) => {
      const sel = i === shop.cursor;
      ctx.fillStyle = sel ? '#f0e090' : '#aac4c4';
      ctx.fillText((sel ? '\u25b6 ' : '  ') + opt, BX + PAD, BY + 56 + i * 26);
    });

  } else if (shop.screen === 'buy') {
    // ── Buy screen ────────────────────────────────────────────────────────
    ctx.fillStyle = '#5a8898';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText('BUY', BX + PAD, BY + 44);

    shop.stock.forEach((it, i) => {
      const sel = i === shop.cursor;
      const iy  = BY + 60 + i * 22;
      ctx.fillStyle = sel ? '#f0e090' : '#aac4c4';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText((sel ? '\u25b6 ' : '  ') + it.name, BX + PAD, iy);
      // Stat label
      ctx.fillStyle = sel ? '#c8d898' : '#5a7868';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(itemStatLabel(it), BX + PAD + 134, iy);
      // Price — red if can't afford
      ctx.fillStyle = stats.gold >= it.price ? (sel ? '#f0d050' : '#a08020') : '#a04040';
      ctx.textAlign = 'right';
      ctx.fillText(`${it.price} g`, BX + BW - PAD, iy);
      ctx.textAlign = 'left';
    });

    // Back option
    const backI   = shop.stock.length;
    const backSel = shop.cursor === backI;
    const backY   = BY + 60 + backI * 22;
    ctx.fillStyle = backSel ? '#f0e090' : '#5a7878';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText((backSel ? '\u25b6 ' : '  ') + '\u2190 Back', BX + PAD, backY);

    // Footer hint
    ctx.fillStyle = '#3a5060';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('ENTER buy \u00b7 ESC back', BX + PAD, BY + BH - 12);

  } else if (shop.screen === 'sell') {
    // ── Sell screen ───────────────────────────────────────────────────────
    ctx.fillStyle = '#5a8898';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText('SELL  (50% of value)', BX + PAD, BY + 44);

    const sellable = inventoryItems();
    if (sellable.length === 0) {
      ctx.fillStyle = '#3a5060';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('  No items to sell.', BX + PAD, BY + 60);
    } else {
      sellable.forEach((it, i) => {
        const sel      = i === shop.cursor;
        const iy       = BY + 60 + i * 22;
        const sellVal  = Math.floor((it.price || 0) / 2);
        ctx.fillStyle  = sel ? '#f0e090' : '#aac4c4';
        ctx.font       = '12px "Courier New", monospace';
        ctx.fillText((sel ? '\u25b6 ' : '  ') + it.name, BX + PAD, iy);
        ctx.fillStyle  = sel ? '#c8d898' : '#5a7868';
        ctx.font       = '11px "Courier New", monospace';
        ctx.fillText(itemStatLabel(it), BX + PAD + 134, iy);
        ctx.fillStyle  = sel ? '#f0d050' : '#a08020';
        ctx.textAlign  = 'right';
        ctx.fillText(`${sellVal} g`, BX + BW - PAD, iy);
        ctx.textAlign  = 'left';
      });
    }

    // Back option — placed at least one row below the item list (or empty message)
    const backI   = sellable.length;
    const backSel = shop.cursor === backI;
    const backY   = BY + 60 + Math.max(backI, 1) * 22;
    ctx.fillStyle = backSel ? '#f0e090' : '#5a7878';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText((backSel ? '\u25b6 ' : '  ') + '\u2190 Back', BX + PAD, backY);

    // Footer hint
    ctx.fillStyle = '#3a5060';
    ctx.font = '10px "Courier New", monospace';
    ctx.fillText('ENTER sell \u00b7 ESC back', BX + PAD, BY + BH - 12);
  }
}


// ─── Supervisor Sprite ────────────────────────────────────────────────────────
function drawSupervisorSprite() {
  if (!inTown || currentTownId !== 'calwick') return;
  const atInnDayoff = townBuilding === 'inn' && isDayOff();
  if (townBuilding !== 'office' && !atInnDayoff) return;
  const pos = atInnDayoff ? SUPERVISOR_DAYOFF : SUPERVISOR;
  const px = Math.round(pos.x);
  const py = Math.round(pos.y);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(px, py + (atInnDayoff ? 10 : 4), 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (atInnDayoff) {
    // Standing legs (not seated at desk)
    ctx.fillStyle = '#1e2028';
    ctx.fillRect(px - 5, py,     4, 8);
    ctx.fillRect(px + 1, py,     4, 8);
    ctx.fillStyle = '#101018';
    ctx.fillRect(px - 6, py + 6, 5, 3);
    ctx.fillRect(px + 1, py + 6, 5, 3);
  }

  // Upper torso — dark charcoal formal jacket
  ctx.fillStyle = '#2a2c34';
  ctx.fillRect(px - 8, py - 12, 16, 12);
  ctx.fillStyle = '#1e2028';
  ctx.fillRect(px - 8, py - 4,  16,  4);
  // Shirt / cravat at collar
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(px - 3, py - 12, 6, 6);
  // Lapels
  ctx.fillStyle = '#3a3c48';
  ctx.fillRect(px - 8, py - 12, 4, 8);
  ctx.fillRect(px + 4, py - 12, 4, 8);

  if (!atInnDayoff) {
    // Arms resting on desk (office only)
    ctx.fillStyle = '#2a2c34';
    ctx.fillRect(px - 15, py - 8, 8, 6);
    ctx.fillRect(px + 7,  py - 8, 8, 6);
    ctx.fillStyle = '#c09878';
    ctx.fillRect(px - 16, py - 4, 8, 5);
    ctx.fillRect(px + 8,  py - 4, 8, 5);
  }

  // Head
  ctx.fillStyle = '#c09878';
  ctx.fillRect(px - 5, py - 26, 10, 14);
  // Grey-streaked hair — authority, not old
  ctx.fillStyle = '#505060';
  ctx.fillRect(px - 5, py - 26, 10,  4);
  ctx.fillStyle = '#9898a8';
  ctx.fillRect(px - 4, py - 26,  3,  4);
  // Eyes — level, direct
  ctx.fillStyle = '#181620';
  ctx.fillRect(px - 3, py - 19, 2, 2);
  ctx.fillRect(px + 1, py - 19, 2, 2);

  // SPACE hint when in range
  if (!dialogue.open && !choice.open && !shop.open) {
    const dx = player.x - pos.x;
    const dy = player.y - pos.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 32);
      ctx.textAlign = 'left';
    }
  }
}

// ─── Esla Sprite ──────────────────────────────────────────────────────────────
function drawEslaSprite() {
  if (!inTown || currentTownId !== 'calwick') return;
  const atInnDayoff = townBuilding === 'inn' && isDayOff();
  if (townBuilding !== 'office' && !atInnDayoff) return;
  const pos = atInnDayoff ? ESLA_DAYOFF : ESLA;
  const px = Math.round(pos.x);
  const py = Math.round(pos.y);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(px, py + 10, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#2a3848';
  ctx.fillRect(px - 5, py,      4, 8);
  ctx.fillRect(px + 1, py,      4, 8);
  // Shoes
  ctx.fillStyle = '#181820';
  ctx.fillRect(px - 6, py + 6,  5, 3);
  ctx.fillRect(px + 1, py + 6,  5, 3);

  // Body — muted teal office blouse
  ctx.fillStyle = '#3a6868';
  ctx.fillRect(px - 7, py - 12, 14, 13);
  // Collar
  ctx.fillStyle = '#d0c8b8';
  ctx.fillRect(px - 2, py - 12, 4, 5);

  // Head
  ctx.fillStyle = '#c09878';
  ctx.fillRect(px - 5, py - 24, 10, 13);

  // Long kelly green hair — flows well past the shoulders
  ctx.fillStyle = '#2a9a28';
  // Top / sides of head
  ctx.fillRect(px - 6, py - 26, 12, 5);
  // Left side flowing down
  ctx.fillRect(px - 7, py - 22, 3, 20);
  // Right side flowing down
  ctx.fillRect(px + 4, py - 22, 3, 20);
  // Hair tips (slightly darker for depth)
  ctx.fillStyle = '#1e7820';
  ctx.fillRect(px - 7, py - 4,  3,  4);
  ctx.fillRect(px + 4, py - 4,  3,  4);

  // Eyes
  ctx.fillStyle = '#181620';
  ctx.fillRect(px - 3, py - 18, 2, 2);
  ctx.fillRect(px + 1, py - 18, 2, 2);

  // SPACE hint when in range
  if (!dialogue.open && !choice.open && !shop.open) {
    const dx = player.x - pos.x;
    const dy = player.y - pos.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#d8c878';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 32);
      ctx.textAlign = 'left';
    }
  }
}


// ─── Den Wraith Drawing (world view, west_i house) ───────────────────────────
function drawDenWraith() {
  const px = Math.round(DEN_WRAITH.x);
  const py = Math.round(DEN_WRAITH.y);
  const drift = Math.round(Math.sin(tick * 0.04) * 2);
  // Shadow pool
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(px, py + 10, 10, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Body — wispy vertical mass
  ctx.fillStyle = '#1a1020';
  ctx.fillRect(px - 5, py - 22 + drift, 10, 28);
  ctx.fillStyle = '#241830';
  ctx.fillRect(px - 3, py - 30 + drift, 6, 12);
  // Head — oval, featureless
  ctx.fillStyle = '#181020';
  ctx.fillRect(px - 6, py - 44 + drift, 12, 14);
  // Eye voids
  ctx.fillStyle = 'rgba(180,160,220,0.7)';
  ctx.fillRect(px - 4, py - 40 + drift, 3, 4);
  ctx.fillRect(px + 1, py - 40 + drift, 3, 4);
  // Trailing wisps
  ctx.fillStyle = 'rgba(60,30,80,0.4)';
  ctx.fillRect(px - 8, py - 10 + drift, 4, 12);
  ctx.fillRect(px + 4, py - 14 + drift, 4, 12);
}

// ─── Boss Drawing (world view) ───────────────────────────────────────────────
// ─── Mulholland Drawing (world view, floor 4) ────────────────────────────────
function drawMulholland() {
  if (!inDungeon || dungeonFloor !== 4 || MULHOLLAND.defeated) return;
  const px = Math.round(MULHOLLAND.x);
  const py = Math.round(MULHOLLAND.y);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(px, py + 14, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bloated lower body — asymmetric, too wide
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(px - 16, py + 2, 32, 14);
  ctx.fillStyle = '#3a2010';
  ctx.fillRect(px - 13, py,     26, 4);

  // Legs — wrong length, different from each other
  ctx.fillStyle = '#1e1208';
  ctx.fillRect(px - 10, py + 14, 7, 10);  // short leg
  ctx.fillRect(px +  4, py + 14, 5, 14);  // longer leg

  // Upper body — narrower but hunched
  ctx.fillStyle = '#322010';
  ctx.fillRect(px - 10, py - 10, 20, 14);

  // Arms — one large, one vestigial
  ctx.fillStyle = '#281808';
  ctx.fillRect(px - 22, py -  8, 12, 6);   // long arm
  ctx.fillRect(px - 28, py -  4, 8,  4);   // reaching further
  ctx.fillRect(px +  9, py -  6, 5,  4);   // stubby arm

  // Head — too large, off-centre on body
  ctx.fillStyle = '#3a2418';
  ctx.fillRect(px - 14, py - 24, 24, 18);
  ctx.fillStyle = '#4a3020';
  ctx.fillRect(px - 12, py - 22, 20, 6);

  // Eye cluster — three irregular eyes
  ctx.fillStyle = '#c8a040';
  ctx.fillRect(px -  8, py - 18, 5, 4);
  ctx.fillRect(px -  1, py - 20, 4, 3);
  ctx.fillStyle = '#e0b848';
  ctx.fillRect(px +  4, py - 16, 3, 3);

  // Mouth — too many teeth, wrong angle
  ctx.fillStyle = '#100808';
  ctx.fillRect(px - 10, py - 10, 18, 5);
  ctx.fillStyle = '#d8d0c0';
  for (let i = 0; i < 5; i++) ctx.fillRect(px - 9 + i * 4, py - 10, 3, 3);
  for (let i = 0; i < 4; i++) ctx.fillRect(px - 7 + i * 4, py - 7,  2, 2);

  // Pustule details
  ctx.fillStyle = '#503818';
  ctx.fillRect(px +  2, py -  2, 4, 4);
  ctx.fillRect(px - 14, py +  6, 3, 3);
  ctx.fillRect(px + 10, py +  4, 4, 4);
}

function drawTakomo() {
  if (!inTakomo || TAKOMO.defeated) return;
  const px  = Math.round(TAKOMO.x);
  const py  = Math.round(TAKOMO.y);
  const bob = Math.round(Math.sin(tick * 0.05) * 2);
  const cy  = py + bob;

  // Ground shadow — wide, hot orange tint
  ctx.fillStyle = 'rgba(180, 60, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(px, cy + 18, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — thick, planted
  ctx.fillStyle = '#5a2808';
  ctx.fillRect(px - 12, cy + 4,  10, 16);
  ctx.fillRect(px +  2, cy + 4,  10, 16);

  // Body — broad, squat, iron-clad
  ctx.fillStyle = '#3a1a06';
  ctx.fillRect(px - 16, cy - 14, 32, 20);

  // Chest plate — hot iron, cracked orange seams
  ctx.fillStyle = '#7a3010';
  ctx.fillRect(px - 14, cy - 12, 28, 17);
  ctx.fillStyle = '#e05010';
  ctx.fillRect(px -  2, cy - 12,  4, 17); // vertical crack glow
  ctx.fillRect(px - 14, cy -  4, 28,  3); // horizontal crack glow

  // Arms — heavy, slightly too long
  ctx.fillStyle = '#4a2006';
  ctx.fillRect(px - 26, cy - 10, 12, 22); // left arm
  ctx.fillRect(px + 14, cy - 10, 12, 22); // right arm

  // Fists — bright ember
  ctx.fillStyle = '#c04008';
  ctx.fillRect(px - 27, cy + 10, 13, 10);
  ctx.fillRect(px + 14, cy + 10, 13, 10);

  // Neck
  ctx.fillStyle = '#3a1a06';
  ctx.fillRect(px - 6, cy - 20,  12, 8);

  // Head — wide, forward-set jaw
  ctx.fillStyle = '#2a1204';
  ctx.fillRect(px - 12, cy - 36, 24, 18);

  // Jaw protrusion
  ctx.fillStyle = '#200e02';
  ctx.fillRect(px -  9, cy - 22, 18,  6);

  // Eyes — two deep orange coals
  ctx.fillStyle = '#ff6010';
  ctx.fillRect(px -  8, cy - 32,  5,  4);
  ctx.fillRect(px +  3, cy - 32,  5,  4);

  // Eye inner glow
  ctx.fillStyle = '#ffb840';
  ctx.fillRect(px -  7, cy - 31,  3,  2);
  ctx.fillRect(px +  4, cy - 31,  3,  2);

  // Heat shimmer — faint column above head
  const shimmer = Math.sin(tick * 0.13) * 3;
  ctx.fillStyle = 'rgba(230, 80, 10, 0.10)';
  ctx.fillRect(px - 10, cy - 56 + shimmer,  20,  18);
  ctx.fillStyle = 'rgba(230, 80, 10, 0.06)';
  ctx.fillRect(px -  6, cy - 70 + shimmer,  12,  16);

  // SPACE prompt when adjacent
  if (!dialogue.open) {
    const dx = player.x - TAKOMO.x;
    const dy = player.y - TAKOMO.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#c8d898';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, cy - 80);
      ctx.textAlign = 'left';
    }
  }
}

// The trapped Pale Drowned snared in the pool of Sunken Gallery room R1C2 — a
// pale arm and hand thrashing up out of the deep water, the marking cord and
// its chalked tag tangled at the wrist. Drawn on the map (not just in dialogue)
// so the player can SEE there is something in the water to examine. Gated by
// render.js on !freed && !slain, so once you free or kill it the pool is empty.
function drawTrappedDrowned() {
  const cx   = 8 * TILE + 16;              // pool centre (col 8)
  const sway = Math.sin(tick * 0.06);
  const dx   = Math.round(sway * 3);       // slow, tireless thrash
  const handY = 7 * TILE + 18;             // south part of the pool, toward the player

  // Disturbed water — this pool is not still where it's caught
  ctx.strokeStyle = 'rgba(150,172,166,0.40)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, handY, 20 + Math.round(sway * 2), 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Submerged form, dim under the surface (deeper, to the north)
  ctx.fillStyle = 'rgba(150,162,150,0.28)';
  ctx.fillRect(cx - 13, 6 * TILE + 6, 26, 22);
  ctx.fillStyle = 'rgba(120,132,122,0.34)';
  ctx.fillRect(cx - 7,  6 * TILE + 0, 14, 10);   // a bowed head, just under

  // Pale straining arm up out of the water
  ctx.fillStyle = '#adb5a6';
  ctx.fillRect(cx - 3 + dx, 6 * TILE + 22, 7, handY - (6 * TILE + 22));

  // Hand breaking the surface, fingers splayed
  ctx.fillStyle = '#c4cabb';
  ctx.fillRect(cx - 7 + dx, handY - 3, 14, 7);
  ctx.fillStyle = '#adb5a6';
  for (let i = 0; i < 4; i++) ctx.fillRect(cx - 7 + i * 4 + dx, handY - 8, 2, 6);

  // Marking cord tangled at the wrist, tied to a small chalked wooden tag
  ctx.strokeStyle = '#8a7d5a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + dx, handY + 2);
  ctx.lineTo(cx + 13, handY + 9);
  ctx.stroke();
  ctx.fillStyle = '#d8ceac';
  ctx.fillRect(cx + 12, handY + 8, 5, 4);
}

// ─── Sunken Gallery: little graphics for the investigative finds ──────────────
// Each observer clue sits on an ordinary gallery tile (a column, a silt patch,
// standing water) and would otherwise be indistinguishable scenery. These small
// map overlays draw the actual FOUND OBJECT at each feature's spot so the player
// can tell there's something to examine. Dispatched by room from render.js
// whenever inSunkenGallery. Positions match the inspect coordinates in
// interactions.js / the tiles placed in maps.js.
function drawSunkenGalleryFeatures() {
  const m = activeMap;
  if      (m === SUNKEN_GALLERY_R4C1) drawGallerySiltPatch();
  else if (m === SUNKEN_GALLERY_R3C0) drawGallerySatchel();
  else if (m === SUNKEN_GALLERY_R4C2) drawGallerySurveyMarks();
  else if (m === SUNKEN_GALLERY_R3C1) drawGalleryGauge();
  else if (m === SUNKEN_GALLERY_R2C1) drawGalleryReliefs();
  else if (m === SUNKEN_GALLERY_R2C2) drawGalleryRecess();
  else if (m === SUNKEN_GALLERY_R1C2) {
    if (!window.sunken_gallery_drowned_freed && !window.sunken_gallery_drowned_slain) drawTrappedDrowned();
  }
  else if (m === SUNKEN_GALLERY_R1C3) drawGalleryBootprint();
  else if (m === SUNKEN_GALLERY_R0C2) drawGalleryNotebook();
  else if (m === SUNKEN_GALLERY_R0C4) drawGallerySubmergedStair();
  else if (m === SUNKEN_GALLERY_R1C4) drawGalleryBody();
}

// R4C1 — a pressed handprint and a dragged heel-mark in the disturbed silt.
function drawGallerySiltPatch() {
  const hx = 8 * TILE + 16, hy = 8 * TILE + 16;
  ctx.fillStyle = 'rgba(38,42,32,0.55)';
  ctx.fillRect(hx - 5, hy - 2, 10, 8);                    // palm
  for (let i = 0; i < 4; i++) ctx.fillRect(hx - 6 + i * 4, hy - 8, 2, 6); // fingers
  ctx.fillRect(hx - 9, hy - 1, 4, 5);                     // thumb
  ctx.strokeStyle = 'rgba(38,42,32,0.5)'; ctx.lineWidth = 4; // dragged heel-mark leading away
  ctx.beginPath(); ctx.moveTo(hx + 8, hy + 6); ctx.lineTo(9 * TILE + 22, 8 * TILE + 28); ctx.stroke();
}

// R3C0 — the field satchel caught at the base of the column (row 7, col 8).
function drawGallerySatchel() {
  const x = 8 * TILE + 5, y = 7 * TILE + 15;
  ctx.fillStyle = '#5a4a32'; ctx.fillRect(x, y, 18, 14);   // leather body
  ctx.fillStyle = '#4a3c28'; ctx.fillRect(x - 1, y - 3, 20, 7); // flap
  ctx.fillStyle = '#3a2f1e'; ctx.fillRect(x + 7, y - 3, 4, 12); // strap
  ctx.fillStyle = '#c8b06a'; ctx.fillRect(x + 7, y + 4, 4, 3);  // brass buckle
  ctx.strokeStyle = '#4a3c28'; ctx.lineWidth = 2;               // strap snagged up the column
  ctx.beginPath(); ctx.moveTo(x + 2, y); ctx.lineTo(x - 2, y - 11); ctx.stroke();
}

// R4C2 — chalk ticks and scratched dates climbing the survey columns.
function drawGallerySurveyMarks() {
  for (const col of [4, 8, 12]) {
    const x = col * TILE + 4, y0 = 6 * TILE + 5;
    ctx.fillStyle = 'rgba(232,234,222,0.85)';
    for (let i = 0; i < 5; i++) ctx.fillRect(x, y0 + i * 4, 8 - (i % 2) * 3, 1); // descending ticks
    ctx.fillRect(x + 12, y0 + 1, 1, 19);                                          // scored vertical
    ctx.fillStyle = 'rgba(220,222,210,0.7)';
    ctx.fillRect(x + 2, y0 + 22, 9, 1);                                           // a scrawled date
  }
}

// R3C1 — the broken Imperial depth gauge bolted to the masonry (row 7, col 8).
function drawGalleryGauge() {
  const x = 8 * TILE + 8, y = 7 * TILE + 4;
  ctx.fillStyle = '#7a6a3a'; ctx.fillRect(x, y, 14, 24);   // mounting plate
  ctx.fillStyle = '#c8b45a'; ctx.fillRect(x + 4, y + 2, 6, 20); // brass scale
  ctx.fillStyle = '#4a4020';
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 4, y + 3 + i * 3, 6, 1); // ticks
  ctx.fillStyle = '#d05030'; ctx.fillRect(x + 3, y + 19, 8, 2);         // snapped float marker (low)
  ctx.fillStyle = '#3a3018';                                            // bolts
  ctx.fillRect(x + 1, y + 1, 2, 2); ctx.fillRect(x + 11, y + 1, 2, 2);
  ctx.fillRect(x + 1, y + 21, 2, 2); ctx.fillRect(x + 11, y + 21, 2, 2);
}

// R2C1 — carved relief figures on the wall run (row 7, cols 7-9).
function drawGalleryReliefs() {
  for (const col of [7, 8, 9]) {
    const x = col * TILE, y = 7 * TILE;
    ctx.fillStyle = 'rgba(58,64,52,0.6)'; ctx.fillRect(x + 3, y + 4, TILE - 6, TILE - 8); // sunk panel
    ctx.fillStyle = '#7a8068';
    for (let i = 0; i < 3; i++) { ctx.fillRect(x + 6 + i * 8, y + 12, 3, 10); ctx.fillRect(x + 6 + i * 8, y + 9, 3, 3); }
  }
}

// R2C2 — the maintenance recess; a fallen fragment leans across it until opened.
function drawGalleryRecess() {
  const x = 8 * TILE + 6, y = 7 * TILE + 6;
  ctx.fillStyle = '#14170f'; ctx.fillRect(x, y, 20, 18);   // dark recess
  if (window.sunken_gallery_recess_opened) {
    ctx.fillStyle = '#3a4234'; ctx.fillRect(x + 19, y + 9, 10, 9); // fragment shoved aside; recess empty
  } else {
    ctx.fillStyle = '#4a5240'; ctx.fillRect(x + 3, y + 3, 8, 16);  // fragment leaning across
    ctx.fillStyle = '#3a4234'; ctx.fillRect(x + 4, y + 1, 6, 4);
  }
}

// R1C3 — a single hard-heeled boot print, wrong for either observer (silt col 8).
function drawGalleryBootprint() {
  const x = 8 * TILE + 16, y = 7 * TILE + 16;
  ctx.fillStyle = 'rgba(34,38,28,0.6)';
  ctx.fillRect(x - 4, y - 8, 9, 10);                        // ball
  ctx.fillRect(x - 3, y + 3, 7, 6);                         // heel
  ctx.fillStyle = 'rgba(72,78,62,0.5)';                     // tread lines
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 4, y - 6 + i * 3, 9, 1);
}

// R0C2 — the notebook, oilcloth-wrapped and tied, on the ledge above the water.
function drawGalleryNotebook() {
  const x = 8 * TILE + 8, y = 6 * TILE + 17;
  ctx.fillStyle = '#6a6250'; ctx.fillRect(x, y, 16, 12);   // oilcloth wrap
  ctx.fillStyle = '#585040'; ctx.fillRect(x, y + 5, 16, 3); // fold shadow
  ctx.strokeStyle = '#3a3226'; ctx.lineWidth = 1;           // tie cords
  ctx.beginPath(); ctx.moveTo(x + 8, y - 1); ctx.lineTo(x + 8, y + 13); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 1, y + 6); ctx.lineTo(x + 17, y + 6); ctx.stroke();
}

// R0C4 — worked steps descending into the dark water, dimming with depth.
function drawGallerySubmergedStair() {
  const x0 = 6 * TILE, w = 4 * TILE;
  for (let i = 0; i < 4; i++) {
    const y = 6 * TILE + 6 + i * 7;
    ctx.fillStyle = `rgba(120,142,142,${0.5 - i * 0.11})`;
    ctx.fillRect(x0 + 6 + i * 6, y, w - 12 - i * 12, 3);   // each step narrower + dimmer deeper down
  }
  ctx.fillStyle = 'rgba(172,192,192,0.4)';                  // glint on the top step
  ctx.fillRect(x0 + 8, 6 * TILE + 5, w - 16, 1);
}

// R1C4 — Dreyfuss's body, face-down on the silt bar (greatcoat, one pale hand).
function drawGalleryBody() {
  const cx = 7 * TILE + 16, cy = 7 * TILE + 20;
  ctx.fillStyle = '#2a2c26'; ctx.fillRect(cx - 16, cy - 6, 32, 16); // sodden greatcoat
  ctx.fillStyle = '#232520'; ctx.fillRect(cx - 16, cy + 2, 32, 5);  // fold shadow
  ctx.fillStyle = '#9aa08a'; ctx.fillRect(cx - 22, cy - 4, 8, 8);   // pale head, turned
  ctx.fillStyle = '#2a2c26'; ctx.fillRect(cx + 12, cy - 2, 12, 5);  // reaching sleeve
  ctx.fillStyle = '#9aa08a'; ctx.fillRect(cx + 22, cy - 1, 5, 4);   // pale hand on the silt
  ctx.strokeStyle = '#4a3c28'; ctx.lineWidth = 2;                    // empty satchel-strap
  ctx.beginPath(); ctx.moveTo(cx - 8, cy - 6); ctx.lineTo(cx + 6, cy + 9); ctx.stroke();
}

function drawBoss() {
  if (!inDungeon || dungeonFloor !== 5 || BOSS.defeated) return;
  const px = Math.round(BOSS.x);
  const py = Math.round(BOSS.y);

  if (BOSS.knockedDown) {
    // ── Wrongteeth lying defeated on the ground ──────────────────────────────
    // Body now horizontal, head to the left, long arm splayed out, small breath.
    const heave = (tick >> 5) & 1;  // slow, laboured chest heave

    // Ground shadow — wider and flatter than standing shadow
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(px, py + 14, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Long arm — splayed out to the left along ground
    ctx.fillStyle = '#150820';
    ctx.fillRect(px - 36, py + 4, 20, 8);   // upper arm (horizontal)
    ctx.fillRect(px - 50, py + 5, 16, 6);   // forearm
    // Claws spread on ground
    ctx.fillStyle = '#9878c0';
    ctx.fillRect(px - 60, py + 3, 4, 10);
    ctx.fillRect(px - 56, py + 5, 4,  8);
    ctx.fillRect(px - 52, py + 6, 4,  7);
    ctx.fillRect(px - 48, py + 7, 4,  6);

    // Stubby arm — tucked awkwardly upward
    ctx.fillStyle = '#150820';
    ctx.fillRect(px + 14, py - 4, 7, 9);
    ctx.fillStyle = '#9878c0';
    ctx.fillRect(px + 14, py - 9, 3, 5);
    ctx.fillRect(px + 18, py - 8, 3, 4);
    ctx.fillRect(px + 22, py - 7, 3, 4);

    // Body — wide rectangle lying sideways (horizontal mass)
    [
      { ox: -18, w: 10, h: 14, c: '#12061e' },
      { ox:  -8, w: 16, h: 16, c: '#180a28' },
      { ox:   8, w: 14, h: 15, c: '#1c0c2e' },
      { ox:  22, w: 10, h: 13, c: '#180a28' },
    ].forEach(({ ox, w, h, c }) => {
      ctx.fillStyle = c;
      ctx.fillRect(px + ox, py - h / 2 + 4 + heave, w, h);
    });

    // Legs — limp, slightly curled, right side up
    ctx.fillStyle = '#14061c';
    ctx.fillRect(px + 8, py + 8,  9, 10);   // one leg
    ctx.fillRect(px + 4, py + 9,  7,  8);   // other leg, overlapping
    ctx.fillStyle = '#0e0414';
    ctx.fillRect(px + 8, py + 16, 11,  4);  // feet together

    // Head — lying on its side, tilted, facing left, resting on ground
    const hx = px - 22;
    [
      { dy: -12, w: 44, c: '#14081e' },
      { dy:  -8, w: 52, c: '#1c0c2c' },
      { dy:  -2, w: 56, c: '#220e34' },
      { dy:   4, w: 52, c: '#1c0c2c' },
      { dy:   9, w: 44, c: '#14081e' },
    ].forEach(({ dy, w, c }) => {
      ctx.fillStyle = c;
      ctx.fillRect(hx - w / 2, py + dy, w, 6);
    });
    // Heavy brow ridge, now sideways — rests near ground
    ctx.fillStyle = '#0c0414';
    ctx.fillRect(hx - 26, py - 14, 38, 8);

    // Mouth — open slightly, jaw resting on floor, teeth visible
    ctx.fillStyle = '#04010a';
    ctx.fillRect(hx - 22, py + 3, 44, 8);
    // Front teeth — upper row against ground
    ctx.fillStyle = '#ece4f0';
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(hx - 18 + i * 9, py + 3, 6, 5);
    }
    // Lower teeth — limply parted
    ctx.fillStyle = '#c8c0d8';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(hx - 14 + i * 9, py + 7, 5, 4);
    }
    // Gum colour
    ctx.fillStyle = '#3c0828';
    ctx.fillRect(hx - 22, py + 6, 44, 3);

    // Large eye — half-closed, dim, looking up
    ctx.fillStyle = '#060208';
    ctx.fillRect(hx - 20, py - 10, 22, 14);
    ctx.fillStyle = '#560010';  // red faded, not blazing
    ctx.fillRect(hx - 18, py -  9, 18, 11);
    ctx.fillStyle = '#880018';
    ctx.fillRect(hx - 15, py -  8, 11,  7);
    // Half-closed lid — dark strip over top half of eye
    ctx.fillStyle = '#1a0828';
    ctx.fillRect(hx - 18, py -  9, 18,  5);
    // Dim glint — barely there
    ctx.fillStyle = 'rgba(255,180,180,0.4)';
    ctx.fillRect(hx - 16, py -  7,  3,  2);

    // Tiny eye — barely visible, pressed against brow ridge
    ctx.fillStyle = '#060208';
    ctx.fillRect(hx +  8, py - 11,  8,  8);
    ctx.fillStyle = '#4a000c';
    ctx.fillRect(hx +  9, py - 10,  6,  6);

    // Slow tear-trace from large eye — single dark line
    if ((tick >> 4) & 1) {
      ctx.fillStyle = 'rgba(80,40,100,0.5)';
      ctx.fillRect(hx - 18, py - 3, 2, 5);
    }

    // SPACE hint
    if (!dialogue.open && !choice.open) {
      const dx = player.x - BOSS.x;
      const dy = player.y - BOSS.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8b8e0';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', px, py - 26);
        ctx.textAlign = 'left';
      }
    }
    return;
  }

  // ── Standing sprite (pre-defeat) ─────────────────────────────────────────
  const breathe = Math.round(Math.sin(tick * 0.04) * 2);

  // Drop shadow — wide, off-centre (lopsided stance)
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(px - 3, py + 17, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — uneven lengths
  ctx.fillStyle = '#1a0828';
  ctx.fillRect(px - 11, py + 4,  7, 13);  // left (longer)
  ctx.fillRect(px +  3, py + 4,  7,  9);  // right (shorter)
  ctx.fillStyle = '#0e0418';
  ctx.fillRect(px - 13, py + 16, 9, 4);   // left foot
  ctx.fillRect(px +  2, py + 12, 9, 4);   // right foot

  // Body — wide and hunched, offset so it looks unbalanced
  ctx.fillStyle = '#1c0c2e';
  ctx.fillRect(px - 13, py - 9, 23, 15);
  ctx.fillStyle = '#12061e';
  ctx.fillRect(px - 13, py + 3, 23,  5);

  // Long left arm — drags almost to foot level
  ctx.fillStyle = '#150820';
  ctx.fillRect(px - 21, py - 6, 9, 20);
  // Claws on long arm
  ctx.fillStyle = '#9878c0';
  ctx.fillRect(px - 23, py + 13, 3, 7);
  ctx.fillRect(px - 19, py + 14, 3, 6);
  ctx.fillRect(px - 15, py + 13, 3, 5);

  // Stubby right arm — barely a nub
  ctx.fillStyle = '#150820';
  ctx.fillRect(px + 10, py - 5, 7, 7);
  ctx.fillStyle = '#9878c0';
  ctx.fillRect(px + 10, py +  1, 3, 4);
  ctx.fillRect(px + 14, py +  2, 3, 3);

  // Head — oversized, tilted left, wider than body
  ctx.fillStyle = '#220e34';
  ctx.fillRect(px - 15, py - 26, 24, 19);
  // Heavy left brow (asymmetric)
  ctx.fillStyle = '#0e0416';
  ctx.fillRect(px - 16, py - 28, 18,  6);
  ctx.fillRect(px +  2, py - 26, 10,  4);  // lighter right brow

  // Mouth — wide dark slash
  ctx.fillStyle = '#04010a';
  ctx.fillRect(px - 13, py - 13 + breathe, 22, 6);
  // Front teeth row — bright ivory
  ctx.fillStyle = '#e8dce8';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(px - 11 + i * 6, py - 15,  4, 5);  // upper
    ctx.fillRect(px -  9 + i * 6, py - 10 + breathe, 4, 4);  // lower
  }
  // Back row — dim violet, slightly shorter
  ctx.fillStyle = '#5a2878';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(px -  8 + i * 7, py - 15,  3, 3);
    ctx.fillRect(px -  7 + i * 7, py - 10 + breathe, 3, 3);
  }

  // Large left eye socket
  ctx.fillStyle = '#060208';
  ctx.fillRect(px - 14, py - 24, 9,  8);
  ctx.fillStyle = '#c00018';
  ctx.fillRect(px - 13, py - 23, 7,  6);
  ctx.fillStyle = '#ff2020';
  ctx.fillRect(px - 12, py - 22, 3,  3);  // glint
  // Tiny right eye — wrong position (set higher, inward)
  ctx.fillStyle = '#060208';
  ctx.fillRect(px +  5, py - 26, 5,  5);
  ctx.fillStyle = '#880010';
  ctx.fillRect(px +  6, py - 25, 3,  3);

  // SPACE hint when in range
  if (!dialogue.open) {
    const dx = player.x - BOSS.x;
    const dy = player.y - BOSS.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#e080a0';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 34);
      ctx.textAlign = 'left';
    }
  }
}

// ─── Briar Warden (hidden meadow, side quest) ─────────────────────────────────
// Drawn only when quest is active and the Warden has not yet been defeated.
// Palette: deep fen greens, orange eyes, thorn protrusions from back.
function drawBriarWarden() {
  if (activeMap !== MEADOW_MAP || inTown || inDungeon || !warden_quest_started || warden_quest_defeated) return;
  const px = Math.round(BRIAR_WARDEN_SPAWN.x);
  const py = Math.round(BRIAR_WARDEN_SPAWN.y);
  const breathe = Math.round(Math.sin(tick * 0.05) * 1);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(px, py + 15, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — thick, firmly planted
  ctx.fillStyle = '#1e3012';
  ctx.fillRect(px - 10, py +  4, 8, 13);
  ctx.fillRect(px +  2, py +  4, 8, 13);
  ctx.fillStyle = '#0e1808';
  ctx.fillRect(px - 12, py + 16, 10, 3);
  ctx.fillRect(px +  2, py + 16, 10, 3);

  // Body — squat and wide
  ctx.fillStyle = '#253c16';
  ctx.fillRect(px - 13, py - 8 + breathe, 26, 14);
  ctx.fillStyle = '#1a2c10';
  ctx.fillRect(px - 13, py + 3 + breathe, 26,  4);

  // Arms — long, hanging low with claws
  ctx.fillStyle = '#1e3012';
  ctx.fillRect(px - 20, py - 6 + breathe, 8, 20);
  ctx.fillRect(px + 12,  py - 6 + breathe, 8, 20);
  ctx.fillStyle = '#4a7028';
  ctx.fillRect(px - 22, py + 13 + breathe, 4, 6);
  ctx.fillRect(px - 18, py + 14 + breathe, 3, 5);
  ctx.fillRect(px + 15,  py + 13 + breathe, 4, 6);
  ctx.fillRect(px + 12,  py + 14 + breathe, 3, 5);

  // Thorn spines from shoulders/back
  ctx.fillStyle = '#3a5820';
  ctx.fillRect(px - 8,  py - 17 + breathe, 4, 10);
  ctx.fillRect(px - 2,  py - 20 + breathe, 5, 13);
  ctx.fillRect(px + 4,  py - 16 + breathe, 4,  9);
  ctx.fillStyle = '#5a7830';
  ctx.fillRect(px - 7,  py - 17 + breathe, 2, 4);
  ctx.fillRect(px - 1,  py - 20 + breathe, 2, 4);
  ctx.fillRect(px + 5,  py - 16 + breathe, 2, 3);

  // Head — blocky, low-set
  ctx.fillStyle = '#1e3012';
  ctx.fillRect(px - 10, py - 24 + breathe, 20, 18);
  ctx.fillStyle = '#162808';
  ctx.fillRect(px -  8, py - 13 + breathe, 16,  7);
  // Eyes — orange-amber
  ctx.fillStyle = '#c04808';
  ctx.fillRect(px -  8, py - 22 + breathe, 5, 5);
  ctx.fillRect(px +  3, py - 22 + breathe, 5, 5);
  ctx.fillStyle = '#e06010';
  ctx.fillRect(px -  7, py - 21 + breathe, 3, 3);
  ctx.fillRect(px +  4, py - 21 + breathe, 3, 3);

  // SPACE hint when near
  if (!dialogue.open) {
    const dx = player.x - BRIAR_WARDEN_SPAWN.x;
    const dy = player.y - BRIAR_WARDEN_SPAWN.y;
    if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
      ctx.fillStyle = '#c08040';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SPACE', px, py - 32);
      ctx.textAlign = 'left';
    }
  }
}

