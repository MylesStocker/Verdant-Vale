'use strict';

// render-interiors.js — interior furniture rendering for specific buildings
// (inn/tavern, house, hamlet, brewery, harbormaster, wash house, provision
// store, offices, schools) plus the anchor position consts those functions
// (and canWalk() collision in movement.js) key off of.

// ─── Drenwick Tavern Furniture Drawing ───────────────────────────────────────
// Palette: darker and warmer than the inn — more worn wood, less polish.
// Bottle shelf on north wall (row 0 overlay), bar counter along row 1,
// seven tables distributed organically, house-rules notice near south exit.
function drawDrenwichTavernFurniture() {
  if (!inTown || currentTownId !== 'drenwick' || activeMap !== DRENWICK_TAVERN_MAP || townBuilding !== 'tavern') return;

  // ── Bottle shelf (north wall overlay, row 0) ─────────────────────────────
  // Wall-mounted rack, darker and more utilitarian than the inn's counter.
  {
    const sx = 2 * TILE, sy = 4, sw = 11 * TILE;
    // Shelf boards
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(sx - 2, sy, sw + 4, 3);
    ctx.fillRect(sx - 2, sy + 10, sw + 4, 3);
    // Upper shelf bottles — varied widths and colours, packed close
    for (let i = 0; i < 24; i++) {
      const bx2 = sx + Math.floor(i * sw / 24);
      ctx.fillStyle = i % 5 === 0 ? '#1a2814' : (i % 3 === 0 ? '#2a1808' : '#221404');
      ctx.fillRect(bx2, sy - 5, 4, 5);
      ctx.fillStyle = 'rgba(80,60,30,0.4)';
      ctx.fillRect(bx2, sy - 5, 2, 2);
    }
    // Lower shelf bottles — slightly sparser
    for (let i = 0; i < 17; i++) {
      const bx2 = sx + 6 + Math.floor(i * (sw - 6) / 17);
      ctx.fillStyle = i % 4 === 0 ? '#1a2814' : '#221404';
      ctx.fillRect(bx2, sy + 5, 3, 5);
    }
  }

  // ── Bar counter (row 1, cols 1–14) ───────────────────────────────────────
  // Longer and rougher than the inn counter. Dark worn oak with ring stains.
  {
    const bx = TILE, by = TILE;
    const bw = 14 * TILE;
    // Counter top — worn dark oak
    ctx.fillStyle = '#5a3820';
    ctx.fillRect(bx, by + 4, bw, 12);
    ctx.fillStyle = '#3a2410';
    ctx.fillRect(bx, by + 14, bw, 8);
    // Irregular worn highlights — not polished
    ctx.fillStyle = '#6a4428';
    ctx.fillRect(bx + 8,   by + 4, 18, 2);
    ctx.fillRect(bx + 95,  by + 4, 12, 2);
    ctx.fillRect(bx + 205, by + 4, 20, 2);
    ctx.fillRect(bx + 315, by + 4, 14, 2);
    // Ring stains
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (const rx of [28, 70, 145, 215, 258, 328, 375]) {
      ctx.beginPath();
      ctx.arc(bx + rx, by + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    // Counter front face
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(bx, by + 22, bw, 6);
    // Bottles directly on counter — dark glass, no labels
    for (const bp of [20, 58, 118, 182, 228, 268, 338, 395]) {
      ctx.fillStyle = '#1a2814';
      ctx.fillRect(bx + bp, by + 1, 4, 9);
      ctx.fillStyle = '#2a3820';
      ctx.fillRect(bx + bp, by + 1, 2, 2);
    }
  }

  // ── Tables ─────────────────────────────────────────────────────────────────
  for (const t of DRENWICK_TAVERN_TABLES) {
    drawTable(Math.round(t.x) - 16, Math.round(t.y) - 16);
  }

  // ── House rules notice (south wall, col 9, right of exit) ─────────────────
  // Handwritten sign — implied text, house rules the player cannot quite read.
  {
    const nx = 9 * TILE + 3, ny = 12 * TILE + 2;
    ctx.fillStyle = '#c8a840';
    ctx.fillRect(nx, ny, 22, 16);
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(nx + 1, ny + 1, 20, 14);
    // Implied handwritten lines — irregular spacing, slightly ragged edges
    ctx.fillStyle = '#7a6030';
    ctx.fillRect(nx + 2, ny + 3,  16, 1);
    ctx.fillRect(nx + 2, ny + 6,  11, 1);
    ctx.fillRect(nx + 2, ny + 9,  14, 1);
    ctx.fillRect(nx + 2, ny + 12, 8,  1);
    // Pin at top
    ctx.fillStyle = '#808080';
    ctx.fillRect(nx + 9, ny, 2, 3);
  }
}

// Draws house-specific furniture overlays defined in HOUSE_DATA[currentHouseId].
function drawHouseFurniture() {
  const hd = HOUSE_DATA[currentHouseId];
  if (!hd) return;
  if (hd.hearth) {
    const hx = Math.round(hd.hearth.x);
    const hy = Math.round(hd.hearth.y);
    // Mantelpiece — wide dressed stone slab
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(hx - 17, hy - 17, 34, 5);
    // Mantel highlight edge
    ctx.fillStyle = '#c8beb0';
    ctx.fillRect(hx - 17, hy - 17, 34, 2);
    // Stone side pillars
    ctx.fillStyle = '#989080';
    ctx.fillRect(hx - 17, hy - 12, 5, 22);
    ctx.fillRect(hx + 12, hy - 12, 5, 22);
    // Pillar shadow inner edges
    ctx.fillStyle = '#807870';
    ctx.fillRect(hx - 12, hy - 12, 2, 22);
    ctx.fillRect(hx + 12, hy - 12, 2, 22);
    // Firebox interior
    ctx.fillStyle = '#1c1510';
    ctx.fillRect(hx - 12, hy - 12, 24, 18);
    // Hearthstone ledge
    ctx.fillStyle = '#a89888';
    ctx.fillRect(hx - 17, hy +  6, 34, 5);
    // Fire — animated flicker (slow: toggles every 8 frames)
    const fl = (tick >> 3) & 1;
    ctx.fillStyle = '#b82808';                                   // deep red base coals
    ctx.fillRect(hx - 9, hy + 2, 18, 5);
    ctx.fillStyle = '#d85010';                                   // orange body
    ctx.fillRect(hx - 7, hy - 3 + fl, 14, 7);
    ctx.fillStyle = '#f09018';                                   // bright orange upper
    ctx.fillRect(hx - 4, hy - 7 + fl, 8, 6);
    ctx.fillStyle = '#f8d840';                                   // yellow tip
    ctx.fillRect(hx - 2, hy - 10 + fl * 2, 4, 4);
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const dx = player.x - hd.hearth.x;
      const dy = player.y - hd.hearth.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', hx, hy - 24);
        ctx.textAlign = 'left';
      }
    }
  }
  if (hd.rug) {
    const rx = Math.round(hd.rug.x);
    const ry = Math.round(hd.rug.y);
    // Main field — deep canal red
    ctx.fillStyle = '#6a3020';
    ctx.fillRect(rx - 26, ry - 17, 52, 34);
    // Outer border band
    ctx.fillStyle = '#481c10';
    ctx.fillRect(rx - 26, ry - 17, 52,  4);
    ctx.fillRect(rx - 26, ry + 13, 52,  4);
    ctx.fillRect(rx - 26, ry - 17,  4, 34);
    ctx.fillRect(rx + 22, ry - 17,  4, 34);
    // Inner border line
    ctx.fillStyle = '#904030';
    ctx.fillRect(rx - 20, ry - 11, 40,  1);
    ctx.fillRect(rx - 20, ry + 10, 40,  1);
    ctx.fillRect(rx - 20, ry - 11,  1, 22);
    ctx.fillRect(rx + 19, ry - 11,  1, 22);
    // Centre motif — cross with squared ends
    ctx.fillStyle = '#c89850';
    ctx.fillRect(rx -  9, ry -  2, 18,  4);   // horizontal bar
    ctx.fillRect(rx -  2, ry -  9,  4, 18);   // vertical bar
    // Corner squares in motif
    ctx.fillRect(rx - 12, ry -  4,  4,  4);
    ctx.fillRect(rx +  8, ry -  4,  4,  4);
    ctx.fillRect(rx - 12, ry +  0,  4,  4);
    ctx.fillRect(rx +  8, ry +  0,  4,  4);
  }
  if (hd.tables) {
    for (const t of hd.tables) {
      drawTable(Math.round(t.x) - 16, Math.round(t.y) - 16);
    }
  }
  if (hd.chair) {
    const chx = Math.round(hd.chair.x);
    const chy = Math.round(hd.chair.y);
    // Backrest
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(chx - 6, chy - 13, 12, 8);
    // Back rail highlight
    ctx.fillStyle = '#7a5028';
    ctx.fillRect(chx - 6, chy - 13, 12, 2);
    // Back posts
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(chx - 6, chy -  5, 3, 6);
    ctx.fillRect(chx + 3, chy -  5, 3, 6);
    // Seat surface
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(chx - 7, chy -  5, 14, 9);
    // Seat highlight
    ctx.fillStyle = '#8a5828';
    ctx.fillRect(chx - 7, chy -  5, 14, 2);
    // Front face of seat
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(chx - 7, chy +  3, 14, 4);
    // Front legs
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(chx - 6, chy +  6, 3, 5);
    ctx.fillRect(chx + 3, chy +  6, 3, 5);
  }
  if (hd.bed) {
    const bx = Math.round(hd.bed.x) - 16;
    const by = Math.round(hd.bed.y) - 16;
    // Bed frame
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(bx + 3, by + 3, 26, 24);
    // Mattress
    ctx.fillStyle = '#c8c0b0';
    ctx.fillRect(bx + 5, by + 5, 22, 16);
    // Pillow
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(bx + 6, by + 6, 10, 7);
    // Blanket
    ctx.fillStyle = '#4a6888';
    ctx.fillRect(bx + 5, by + 13, 22, 8);
    // Blanket highlight
    ctx.fillStyle = '#5a7898';
    ctx.fillRect(bx + 5, by + 13, 22, 2);
    // Frame legs
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(bx + 3,  by + 25, 4, 4);
    ctx.fillRect(bx + 25, by + 25, 4, 4);
    if (!dialogue.open && !choice.open && !shop.open && !menu.open) {
      const dx = player.x - hd.bed.x;
      const dy = player.y - hd.bed.y;
      const near = Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS;
      if (near && (tick >> 4) & 1) {
        // SPACE prompt when standing next to it
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', bx + 16, by - 4);
        ctx.textAlign = 'left';
      } else if (hd.bed.canRest && !near) {
        // Persistent "can rest here" marker over the player's own (special) bed,
        // so it reads as interactable from across the room. A gentle bobbing Zz.
        const bob = (tick >> 4) & 1;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#e6d68a';
        ctx.font = 'bold 8px "Courier New", monospace';
        ctx.fillText('z', bx + 22, by - 3 - bob);
        ctx.font = 'bold 6px "Courier New", monospace';
        ctx.fillText('z', bx + 16, by - 7 - bob);
        ctx.textAlign = 'left';
      }
    }
  }
  if (hd.stove) {
    const sx = Math.round(hd.stove.x);
    const sy = Math.round(hd.stove.y);
    // Body — dark cast iron
    ctx.fillStyle = '#363028';
    ctx.fillRect(sx - 11, sy - 10, 22, 18);
    // Top surface
    ctx.fillStyle = '#423c34';
    ctx.fillRect(sx - 11, sy - 10, 22, 4);
    // Burner rings
    ctx.fillStyle = '#282420';
    ctx.fillRect(sx - 8, sy -  9, 5, 2);
    ctx.fillRect(sx + 3, sy -  9, 5, 2);
    // Firebox door
    ctx.fillStyle = '#2a1e14';
    ctx.fillRect(sx - 6, sy -  4, 12, 9);
    // Firebox glow
    ctx.fillStyle = 'rgba(190,80,10,0.45)';
    ctx.fillRect(sx - 5, sy -  3, 10, 7);
    // Rust patches
    ctx.fillStyle = '#6a3a18';
    ctx.fillRect(sx +  7, sy -  7, 3, 2);
    ctx.fillRect(sx - 10, sy +  3, 2, 3);
    ctx.fillRect(sx +  5, sy +  5, 3, 2);
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const dx = player.x - hd.stove.x;
      const dy = player.y - hd.stove.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', sx, sy - 18);
        ctx.textAlign = 'left';
      }
    }
  }
  // ── Dresser (chest of drawers) — searchable furniture ──────────────────────
  if (hd.dresser) {
    const dx = Math.round(hd.dresser.x);
    const dy = Math.round(hd.dresser.y);
    // Carcass — dark oak
    ctx.fillStyle = '#4a2e14';
    ctx.fillRect(dx - 13, dy - 16, 26, 32);
    // Top surface + highlight
    ctx.fillStyle = '#6a4420';
    ctx.fillRect(dx - 14, dy - 17, 28, 4);
    ctx.fillStyle = '#8a5c30';
    ctx.fillRect(dx - 14, dy - 17, 28, 1);
    // Right-side shadow
    ctx.fillStyle = '#3a2410';
    ctx.fillRect(dx + 9, dy - 13, 4, 29);
    // Three drawers, each with a top bevel, bottom seam, and a brass pull
    for (let i = 0; i < 3; i++) {
      const ry = dy - 12 + i * 10;
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(dx - 10, ry, 19, 8);
      ctx.fillStyle = '#79512a';
      ctx.fillRect(dx - 10, ry, 19, 1);
      ctx.fillStyle = '#2e1c0c';
      ctx.fillRect(dx - 10, ry + 8, 19, 1);
      ctx.fillStyle = '#c8b060';
      ctx.fillRect(dx - 3, ry + 3, 6, 2);
    }
    // Once searched, the top drawer hangs pulled open
    if (hd.dresser.looted) {
      ctx.fillStyle = '#140c06';
      ctx.fillRect(dx - 10, dy - 12, 19, 4);
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(dx - 12, dy - 9, 23, 5);
      ctx.fillStyle = '#c8b060';
      ctx.fillRect(dx - 3, dy - 8, 6, 2);
    }
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const pdx = player.x - hd.dresser.x;
      const pdy = player.y - hd.dresser.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', dx, dy - 23);
        ctx.textAlign = 'left';
      }
    }
  }
  // ── Floor sparkle — a glint that yields a pickup, drawn until taken ─────────
  if (hd.sparkle && !hd.sparkle.taken) {
    const sx = Math.round(hd.sparkle.x);
    const sy = Math.round(hd.sparkle.y);
    const a  = 0.55 + 0.35 * Math.sin(tick * 0.2);
    const r  = ((tick >> 2) % 8) < 4 ? 5 : 3;   // twinkle: arms pulse in and out
    // Four-point star
    ctx.fillStyle = 'rgba(255,248,200,' + a.toFixed(3) + ')';
    ctx.fillRect(sx - 1, sy - r, 2, r * 2);
    ctx.fillRect(sx - r, sy - 1, r * 2, 2);
    // Faint diagonal glimmers
    ctx.fillStyle = 'rgba(255,240,180,' + (a * 0.5).toFixed(3) + ')';
    ctx.fillRect(sx - 3, sy - 3, 2, 2);
    ctx.fillRect(sx + 1, sy + 1, 2, 2);
    ctx.fillRect(sx - 3, sy + 1, 2, 2);
    ctx.fillRect(sx + 1, sy - 3, 2, 2);
    // Bright core
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(sx - 1, sy - 1, 2, 2);
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const pdx = player.x - hd.sparkle.x;
      const pdy = player.y - hd.sparkle.y;
      if (Math.sqrt(pdx * pdx + pdy * pdy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', sx, sy - 12);
        ctx.textAlign = 'left';
      }
    }
  }
  if (hd.cat) {
    const cx = Math.round(hd.cat.x);
    const cy = Math.round(hd.cat.y);
    // Slow tail-flick animation — toggles every ~32 frames
    const tailRight = (tick >> 5) & 1;
    // Body
    ctx.fillStyle = '#b07848';
    ctx.fillRect(cx - 7, cy - 3, 14, 8);
    // Head
    ctx.fillRect(cx - 4, cy - 9, 9, 7);
    // Ears
    ctx.fillStyle = '#c89058';
    ctx.fillRect(cx - 4, cy - 12, 3, 4);
    ctx.fillRect(cx + 2, cy - 12, 3, 4);
    // Inner ears
    ctx.fillStyle = '#e0a888';
    ctx.fillRect(cx - 3, cy - 11, 2, 3);
    ctx.fillRect(cx + 3, cy - 11, 2, 3);
    // Eyes (closed, content — just thin lines)
    ctx.fillStyle = '#2a1808';
    ctx.fillRect(cx - 2, cy - 6, 3, 1);
    ctx.fillRect(cx + 1, cy - 6, 3, 1);
    // Nose
    ctx.fillStyle = '#d07070';
    ctx.fillRect(cx,     cy - 4, 2, 1);
    // Tail
    ctx.fillStyle = '#b07848';
    ctx.fillRect(tailRight ? cx + 7 : cx + 5, cy + 2, 6, 3);
    ctx.fillRect(tailRight ? cx + 11 : cx + 9, cy - 1, 3, 4);
    // Paws
    ctx.fillStyle = '#c89058';
    ctx.fillRect(cx - 6, cy + 4, 4, 3);
    ctx.fillRect(cx + 3, cy + 4, 4, 3);
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const dx = player.x - hd.cat.x;
      const dy = player.y - hd.cat.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', cx, cy - 18);
        ctx.textAlign = 'left';
      }
    }
  }
  if (hd.chest) {
    const cx = Math.round(hd.chest.x);
    const cy = Math.round(hd.chest.y);
    // Body — dark oak planks
    ctx.fillStyle = '#4a2e10';
    ctx.fillRect(cx - 12, cy - 2, 24, 13);
    // Body front face highlight (top edge catches light)
    ctx.fillStyle = '#5a3a18';
    ctx.fillRect(cx - 12, cy - 2, 24, 2);
    // Body plank lines
    ctx.fillStyle = '#3a2008';
    ctx.fillRect(cx - 12, cy + 5, 24, 1);
    // Lid — slightly lighter, domed slightly taller on one side
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(cx - 12, cy - 12, 24, 10);
    // Lid top edge highlight
    ctx.fillStyle = '#8a5828';
    ctx.fillRect(cx - 12, cy - 12, 24, 2);
    // Lid plank shadow line
    ctx.fillStyle = '#4a2c10';
    ctx.fillRect(cx - 12, cy - 5, 24, 1);
    // Iron hasp / hinge band at lid-body seam
    ctx.fillStyle = '#404040';
    ctx.fillRect(cx - 12, cy - 3, 24, 3);
    // Iron band highlight
    ctx.fillStyle = '#585858';
    ctx.fillRect(cx - 12, cy - 3, 24, 1);
    // Iron corner brackets — four corners
    ctx.fillStyle = '#383838';
    ctx.fillRect(cx - 12, cy - 12, 3, 23);   // left
    ctx.fillRect(cx +  9, cy - 12, 3, 23);   // right
    // Lock hasp — small brass plate on lid centre
    ctx.fillStyle = '#b89030';
    ctx.fillRect(cx - 3, cy - 9, 6, 5);
    // Lock body (darker)
    ctx.fillStyle = '#907020';
    ctx.fillRect(cx - 2, cy - 8, 4, 4);
    // Keyhole
    ctx.fillStyle = '#201808';
    ctx.fillRect(cx - 1, cy - 7, 2, 2);
    // Gold label — how much is in the chest (small text above)
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#c8b060';
    ctx.fillText(hd.chest.gold + 'g', cx, cy - 16);
    ctx.textAlign = 'left';
    // SPACE hint when adjacent
    if (!dialogue.open && !choice.open && !shop.open) {
      const dx = player.x - hd.chest.x;
      const dy = player.y - hd.chest.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', cx, cy - 26);
        ctx.textAlign = 'left';
      }
    }
  }
  if (hd.bookshelf) {
    const bx = Math.round(hd.bookshelf.x);
    const by = Math.round(hd.bookshelf.y);
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
    // Top cap highlight
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
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const dx = player.x - hd.bookshelf.x;
      const dy = player.y - hd.bookshelf.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', bx, by - 25);
        ctx.textAlign = 'left';
      }
    }
  }
  if (hd.window) {
    const wx = Math.round(hd.window.x);
    const wy = Math.round(hd.window.y);
    // Stone window surround / lintel
    ctx.fillStyle = '#989080';
    ctx.fillRect(wx - 14, wy - 13, 28, 22);
    // Inner reveal — shadow depth
    ctx.fillStyle = '#787068';
    ctx.fillRect(wx - 11, wy - 10, 22, 16);
    // Sky through glass — pale blue-grey
    ctx.fillStyle = '#b8ccd4';
    ctx.fillRect(wx - 10, wy -  9, 20, 14);
    // Lead dividers — centre post and horizontal rail
    ctx.fillStyle = '#686058';
    ctx.fillRect(wx -  1, wy -  9,  2, 14);  // vertical
    ctx.fillRect(wx - 10, wy -  2, 20,  2);  // horizontal
    // Light catch — upper pane highlights
    ctx.fillStyle = '#d8e8ee';
    ctx.fillRect(wx -  9, wy -  8,  5,  3);
    ctx.fillRect(wx +  2, wy -  8,  5,  3);
    // Stone sill
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(wx - 14, wy +  9, 28,  4);
    // Sill top highlight
    ctx.fillStyle = '#c8beb0';
    ctx.fillRect(wx - 14, wy +  9, 28,  1);
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const dx = player.x - hd.window.x;
      const dy = player.y - hd.window.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', wx, wy - 20);
        ctx.textAlign = 'left';
      }
    }
  }
  // ── North wall window + morning light beam ────────────────────────────────
  // A window set into the north wall with a shaft of low morning sun fanning
  // down into the room. This is the "morning light through the north window"
  // the intro opens on. The frame is drawn raised onto the wall tiles — sill
  // resting at the wall/floor junction — so it reads as set into the wall,
  // not lying on the boards. The beam is a translucent gradient wedge slanting
  // down-and-west (low sun in the east), with a few drifting dust motes for
  // life. Kept subtle — it's mood, not a light-source system.
  if (hd.northWindow) {
    const wx = Math.round(hd.northWindow.x);
    const wy = Math.round(hd.northWindow.y) - 34;   // raised onto the wall face

    // ── Light shaft (drawn first, so the crisp frame sits on top of it) ─────
    // Origin edge runs along the sill; the far edge spreads wider and drifts
    // west across the boards — a low, early-morning sun angle.
    const oxL = wx - 10, oxR = wx + 10;   // origin edge (at the sill)
    const oy  = wy + 9;
    const fy  = wy + 122;                 // far edge y (deep into the room)
    const fxL = wx - 62;                  // far edge left — light has spread
    const fxR = wx + 24;                  // far edge right — slanted west

    const beam = ctx.createLinearGradient(wx, oy, wx - 18, fy);
    beam.addColorStop(0,   'rgba(255,226,150,0.34)');
    beam.addColorStop(0.45,'rgba(255,224,150,0.17)');
    beam.addColorStop(1,   'rgba(255,224,150,0.0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(oxL, oy);
    ctx.lineTo(oxR, oy);
    ctx.lineTo(fxR, fy);
    ctx.lineTo(fxL, fy);
    ctx.closePath();
    ctx.fill();

    // Brighter inner core of the shaft
    const core = ctx.createLinearGradient(wx, oy, wx - 14, fy - 24);
    core.addColorStop(0, 'rgba(255,240,196,0.30)');
    core.addColorStop(1, 'rgba(255,240,196,0.0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.moveTo(wx - 5, oy);
    ctx.lineTo(wx + 5, oy);
    ctx.lineTo(fxR - 20, fy - 20);
    ctx.lineTo(fxL + 28, fy - 20);
    ctx.closePath();
    ctx.fill();

    // Drifting dust motes riding the shaft — slow fall from window into room
    for (let i = 0; i < 4; i++) {
      const t  = (((tick >> 1) + i * 47) % 200) / 200;   // 0..1 along the beam
      const mx = wx + 4 - t * 46 + Math.sin((tick / 22) + i * 1.7) * 3;
      const my = oy + 4 + t * 100;
      const a  = 0.45 * (1 - t);                          // fade as they travel
      ctx.fillStyle = 'rgba(255,246,214,' + a.toFixed(3) + ')';
      ctx.fillRect(Math.round(mx), Math.round(my), 2, 2);
    }

    // ── Window set into the north wall ──────────────────────────────────────
    // Stone surround / lintel
    ctx.fillStyle = '#989080';
    ctx.fillRect(wx - 14, wy - 13, 28, 22);
    // Inner reveal — shadow depth
    ctx.fillStyle = '#787068';
    ctx.fillRect(wx - 11, wy - 10, 22, 16);
    // Sky through glass — pale, cool up top
    ctx.fillStyle = '#b8ccd4';
    ctx.fillRect(wx - 10, wy -  9, 20, 14);
    // Warm dawn glow low in the pane (sun near the horizon)
    ctx.fillStyle = '#e9d7a0';
    ctx.fillRect(wx - 10, wy -  1, 20,  6);
    // Bright sun catch
    ctx.fillStyle = '#fdf1c6';
    ctx.fillRect(wx -  6, wy,      12,  4);
    // Lead dividers — centre post and horizontal rail
    ctx.fillStyle = '#686058';
    ctx.fillRect(wx -  1, wy -  9,  2, 14);  // vertical post
    ctx.fillRect(wx - 10, wy -  2, 20,  2);  // horizontal rail
    // Upper-pane highlight (cool glass sheen)
    ctx.fillStyle = '#d8e8ee';
    ctx.fillRect(wx -  9, wy -  8,  5,  3);
    ctx.fillRect(wx +  2, wy -  8,  5,  3);
    // Stone sill — rests at the wall/floor junction
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(wx - 14, wy +  9, 28,  4);
    // Sill top highlight
    ctx.fillStyle = '#c8beb0';
    ctx.fillRect(wx - 14, wy +  9, 28,  1);
    // SPACE hint when in range
    if (!dialogue.open && !choice.open && !shop.open) {
      const dx = player.x - hd.northWindow.x;
      const dy = player.y - hd.northWindow.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', wx, wy - 20);
        ctx.textAlign = 'left';
      }
    }
  }
}

// ─── Falls Hamlet Interior Furniture ─────────────────────────────────────────
// Three small hearths (one per room, NW corner) and three straw pallets (NE corner).
// TABLE tiles at row 5 (cols 2, 7, 12) are drawn by the tile renderer.
function drawHamletInteriorFurniture() {
  if (!inHamletInterior) return;

  // Room offsets: A=col1, B=col6, C=col11
  const roomLeftCols = [1, 6, 11];

  for (const lc of roomLeftCols) {
    // ── Hearth — NW corner of each room ────────────────────────────────────
    const hx = Math.round((lc + 0.5) * TILE);
    const hy = Math.round(1.5 * TILE);
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(hx - 17, hy - 17, 34, 5);
    ctx.fillStyle = '#c8beb0';
    ctx.fillRect(hx - 17, hy - 17, 34, 2);
    ctx.fillStyle = '#989080';
    ctx.fillRect(hx - 17, hy - 12, 5, 22);
    ctx.fillRect(hx + 12, hy - 12, 5, 22);
    ctx.fillStyle = '#1c1510';
    ctx.fillRect(hx - 12, hy - 12, 24, 18);
    ctx.fillStyle = '#a89888';
    ctx.fillRect(hx - 17, hy +  6, 34, 5);
    const fl = (tick >> 3) & 1;
    ctx.fillStyle = '#b82808';
    ctx.fillRect(hx - 9, hy + 2, 18, 5);
    ctx.fillStyle = '#d85010';
    ctx.fillRect(hx - 7, hy - 3 + fl, 14, 7);
    ctx.fillStyle = '#f09018';
    ctx.fillRect(hx - 4, hy - 7 + fl, 8, 6);
    ctx.fillStyle = '#f8d840';
    ctx.fillRect(hx - 2, hy - 10 + fl * 2, 4, 4);

    // ── Sleeping pallet — NE corner of each room (col+3) ───────────────────
    const bx = Math.round((lc + 3.5) * TILE);
    const by = Math.round(2.5 * TILE);
    ctx.fillStyle = '#8c7840';
    ctx.fillRect(bx - 14, by - 12, 28, 20);
    ctx.fillStyle = '#6e5e30';
    ctx.fillRect(bx - 14, by - 12, 28,  2);
    ctx.fillRect(bx - 14, by +  6, 28,  2);
    ctx.fillRect(bx - 14, by - 12,  2, 20);
    ctx.fillRect(bx + 12, by - 12,  2, 20);
    ctx.fillStyle = '#5a4c28';
    ctx.fillRect(bx - 7, by - 9, 1, 16);
    ctx.fillRect(bx + 6, by - 9, 1, 16);
  }
}

// ─── Fen Brewery Furniture ────────────────────────────────────────────────────
// Hearth (northwest living corner), bed, living table, and labels on the
// fermentation vats embedded in the map tile pass (TABLE at cols 8,10,12 rows 2-3
// and drying shelves at cols 10,12 row 7) — TABLE tiles are already non-walkable.
function drawFenBreweryFurniture() {
  if (!inFenBrewery) return;

  // ── Hearth (col 1 row 1 corner) ───────────────────────────────────────────
  {
    const hx = Math.round(1.5 * TILE);
    const hy = Math.round(1.5 * TILE);
    // Stone mantel
    ctx.fillStyle = '#b0a898';
    ctx.fillRect(hx - 17, hy - 17, 34, 5);
    ctx.fillStyle = '#c8beb0';
    ctx.fillRect(hx - 17, hy - 17, 34, 2);
    // Side pillars
    ctx.fillStyle = '#989080';
    ctx.fillRect(hx - 17, hy - 12, 5, 22);
    ctx.fillRect(hx + 12, hy - 12, 5, 22);
    // Firebox
    ctx.fillStyle = '#1c1510';
    ctx.fillRect(hx - 12, hy - 12, 24, 18);
    // Hearthstone ledge
    ctx.fillStyle = '#a89888';
    ctx.fillRect(hx - 17, hy +  6, 34, 5);
    // Fire — animated flicker
    const fl = (tick >> 3) & 1;
    ctx.fillStyle = '#b82808';
    ctx.fillRect(hx - 9, hy + 2, 18, 5);
    ctx.fillStyle = '#d85010';
    ctx.fillRect(hx - 7, hy - 3 + fl, 14, 7);
    ctx.fillStyle = '#f09018';
    ctx.fillRect(hx - 4, hy - 7 + fl, 8, 6);
    ctx.fillStyle = '#f8d840';
    ctx.fillRect(hx - 2, hy - 10 + fl * 2, 4, 4);
  }

  // ── Sleeping pallet (col 4 row 1) — rough straw sacking ──────────────────
  {
    const bx = Math.round(4.5 * TILE);
    const by = Math.round(1.5 * TILE);
    ctx.fillStyle = '#8c7840';           // straw-brown sacking
    ctx.fillRect(bx - 14, by - 12, 28, 20);
    ctx.fillStyle = '#6e5e30';           // darker border
    ctx.fillRect(bx - 14, by - 12, 28,  2);
    ctx.fillRect(bx - 14, by +  6, 28,  2);
    ctx.fillRect(bx - 14, by - 12,  2, 20);
    ctx.fillRect(bx + 12, by - 12,  2, 20);
    // Rough stitching lines
    ctx.fillStyle = '#5a4c28';
    ctx.fillRect(bx - 7, by - 9, 1, 16);
    ctx.fillRect(bx + 6, by - 9, 1, 16);
  }

  // ── Living table (col 2 row 9) — rough plank on trestles ─────────────────
  {
    const tx = Math.round(2.5 * TILE);
    const ty = Math.round(9.5 * TILE);
    drawTable(tx - 16, ty - 16);
  }

  // ── Chair (col 1 row 9) ───────────────────────────────────────────────────
  {
    const cx = Math.round(1.5 * TILE);
    const cy = Math.round(9.5 * TILE);
    ctx.fillStyle = '#6e5030';
    ctx.fillRect(cx - 8, cy - 8, 16, 14);
    ctx.fillStyle = '#8c6840';
    ctx.fillRect(cx - 8, cy - 12, 16, 6);
    ctx.fillStyle = '#5a3c20';
    ctx.fillRect(cx - 8, cy +  6,  4, 6);
    ctx.fillRect(cx + 4, cy +  6,  4, 6);
  }

  // ── Vat labels — faint chalk marks on the TABLE tiles ────────────────────
  // The TABLE tiles at cols 8,10,12 rows 2-3 are drawn by the tile renderer.
  // We add a small bung-mark to each vat top to identify them as casks.
  ctx.fillStyle = 'rgba(200,180,140,0.35)';
  for (const vc of [8, 10, 12]) {
    const vx = Math.round(vc * TILE + TILE / 2);
    const vy = Math.round(2 * TILE + TILE / 2);
    ctx.beginPath();
    ctx.arc(vx, vy, 6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Drenwick Harbormaster Office Furniture ───────────────────────────────────
// Drawn over the tile pass: east counter (col 12 TABLE), north shelves (row 3
// cols 9-12 TABLE), west archive (col 2 TABLE rows 4-6), crates (row 9 TABLE).
function drawHarbormasterFurniture() {
  if (!inTown || townBuilding !== 'harbormaster') return;

  // ── East counter surface (col 12 = TABLE rows 3-8) ────────────────────────
  {
    const cx = 12 * TILE, cy = 3 * TILE, ch = 6 * TILE;
    // Dark oak counter top
    ctx.fillStyle = '#4a2c10';
    ctx.fillRect(cx + 2, cy + 4, TILE - 4, ch - 8);
    // Highlight strip along left edge (facing the player)
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(cx + 2, cy + 4, 4, ch - 8);
    // Inset panel lines — one every two tile rows
    ctx.fillStyle = '#3a1e08';
    for (let r = 0; r < 3; r++) {
      ctx.fillRect(cx + 4, cy + 4 + r * 2 * TILE + TILE - 2, TILE - 6, 2);
    }
  }

  // ── Balance scale on counter (at weighmaster position, row 5) ─────────────
  {
    const sx = 12 * TILE + 10, sy = 5 * TILE + 8;
    // Scale beam
    ctx.fillStyle = '#c8a838';
    ctx.fillRect(sx, sy, 14, 2);
    // Pivot post
    ctx.fillStyle = '#a88a28';
    ctx.fillRect(sx + 6, sy - 8, 2, 8);
    // Left pan
    ctx.fillStyle = '#b8983a';
    ctx.fillRect(sx - 2, sy + 6, 6, 2);
    ctx.fillRect(sx - 1, sy + 2, 1, 4);
    // Right pan
    ctx.fillRect(sx + 10, sy + 6, 6, 2);
    ctx.fillRect(sx + 14, sy + 2, 1, 4);
    // Weight block on right pan
    ctx.fillStyle = '#888';
    ctx.fillRect(sx + 11, sy + 2, 4, 4);
  }

  // ── North document shelves (row 3, cols 9-12) ─────────────────────────────
  {
    const sx = 9 * TILE, sy = 3 * TILE;
    // Shelf board
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(sx + 2, sy + 6, 4 * TILE - 4, 3);
    // Rolled charts and documents
    const colours = ['#c8b880', '#b0a070', '#d0c898', '#a89860'];
    for (let i = 0; i < 8; i++) {
      const rx = sx + 4 + i * 14;
      ctx.fillStyle = colours[i % 4];
      ctx.fillRect(rx, sy + 2, 8, 4);
      // End cap
      ctx.fillStyle = colours[(i + 2) % 4];
      ctx.fillRect(rx, sy + 2, 2, 4);
      // Ribbon tie
      ctx.fillStyle = '#c03020';
      ctx.fillRect(rx + 3, sy + 1, 2, 6);
    }
    // Second shelf board lower in the row
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(sx + 2, sy + 18, 4 * TILE - 4, 3);
    // Ledgers flat on lower shelf
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#2a5028' : '#3a3a7a';
      ctx.fillRect(sx + 6 + i * 22, sy + 13, 18, 5);
    }
  }

  // ── West archive shelves (col 2, rows 4-6) ────────────────────────────────
  {
    const wx = 2 * TILE, wy = 4 * TILE;
    // Shelf unit surround
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(wx, wy, TILE, 3 * TILE);
    // Shelf boards
    ctx.fillStyle = '#4a2c10';
    for (let r = 0; r < 3; r++) {
      ctx.fillRect(wx + 2, wy + 2 + r * TILE, TILE - 4, 4);
    }
    // Ledger spines — varied colours
    const lc = ['#6a3010', '#283058', '#1a4818', '#584808', '#702010'];
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = lc[(r * 4 + i) % 5];
        ctx.fillRect(wx + 3 + i * 7, wy + 7 + r * TILE, 5, TILE - 10);
      }
    }
  }

  // ── Crate/barrel stack (row 9, cols 4-6) ──────────────────────────────────
  {
    const bx = 4 * TILE, by = 9 * TILE;
    // Three crates side by side
    for (let i = 0; i < 3; i++) {
      const cx = bx + i * TILE;
      // Crate body
      ctx.fillStyle = '#7a5230';
      ctx.fillRect(cx + 2, by + 4, TILE - 4, TILE - 6);
      // Crate top
      ctx.fillStyle = '#8a6240';
      ctx.fillRect(cx + 2, by + 4, TILE - 4, 5);
      // Slat lines
      ctx.fillStyle = '#5a3820';
      ctx.fillRect(cx + 2, by + 12, TILE - 4, 1);
      ctx.fillRect(cx + 2, by + 20, TILE - 4, 1);
      // Corner braces
      ctx.fillStyle = '#888';
      ctx.fillRect(cx + 2, by + 4, 2, TILE - 6);
      ctx.fillRect(cx + TILE - 4, by + 4, 2, TILE - 6);
    }
  }

  // ── SPACE hints ───────────────────────────────────────────────────────────
  if (!dialogue.open && !choice.open && !shop.open) {
    const hints = [
      { pos: DRENWICK_WEIGHMASTER_COUNTER, lx: 12 * TILE + 8, ly: 5 * TILE },
      { pos: HARBOR_CHARTS,               lx: 10.5 * TILE,   ly: 3 * TILE + 2 },
      { pos: HARBOR_MOORING_LOG,          lx: 12 * TILE + 8, ly: 7 * TILE },
    ];
    ctx.fillStyle = '#d8c878';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    for (const h of hints) {
      const dx = player.x - h.pos.x, dy = player.y - h.pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillText('SPACE', Math.round(h.lx), Math.round(h.ly));
      }
    }
    ctx.textAlign = 'left';
  }
}

// ─── Drenwick Wash House Furniture ────────────────────────────────────────────
// Drawn over the tile pass: communal north basins (row 3 cols 3-9), supply
// shelf (col 2 rows 4-5), stone benches (row 10 cols 3-5 and 9-11), and two
// private bath stalls in the east corner (tubs at col 12 rows 6 & 8, behind
// INTERIOR_WALL partitions, open only to the west aisle).
function drawWashHouseFurniture() {
  if (!inTown || townBuilding !== 'wash_house') return;

  // ── Wash basins along north wall (row 3, cols 3-9) ────────────────────────
  {
    const bx = 3 * TILE, by = 3 * TILE;
    const totalW = 7 * TILE;
    // Stone trough surround
    ctx.fillStyle = '#8a8278';
    ctx.fillRect(bx, by + 2, totalW, TILE - 2);
    // Basin dividers — one every tile
    ctx.fillStyle = '#6a6260';
    for (let i = 1; i < 7; i++) {
      ctx.fillRect(bx + i * TILE - 1, by + 6, 2, TILE - 10);
    }
    // Water in each basin
    for (let i = 0; i < 7; i++) {
      const wx2 = bx + i * TILE + 3;
      // Water surface — pale grey-blue
      ctx.fillStyle = '#9ab8c8';
      ctx.fillRect(wx2, by + 8, TILE - 6, TILE - 14);
      // Rim highlight
      ctx.fillStyle = '#a8c8d8';
      ctx.fillRect(wx2, by + 8, TILE - 6, 2);
      // Slight ripple line (animated)
      if ((tick >> 5) & 1) {
        ctx.fillStyle = 'rgba(200,230,240,0.4)';
        ctx.fillRect(wx2 + 2, by + 12, TILE - 10, 1);
      }
    }
    // Drain plugs — small dark circles
    ctx.fillStyle = '#3a3230';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc(bx + i * TILE + TILE / 2, by + TILE - 4, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Supply/linen shelf (col 2, rows 4-5) ──────────────────────────────────
  {
    const sx = 2 * TILE, sy = 4 * TILE;
    // Shelf unit
    ctx.fillStyle = '#5a4830';
    ctx.fillRect(sx, sy, TILE, 2 * TILE);
    // Shelf board
    ctx.fillStyle = '#6a5838';
    ctx.fillRect(sx + 2, sy + TILE - 2, TILE - 4, 4);
    // Folded towels stacked upper shelf
    const towelColours = ['#e8e0d0', '#d8cfc0', '#e0d8c8'];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = towelColours[i];
      ctx.fillRect(sx + 3, sy + 4 + i * 7, TILE - 6, 5);
      // Fold line
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(sx + 3, sy + 5 + i * 7, TILE - 6, 1);
    }
    // Soap block on lower shelf
    ctx.fillStyle = '#c8b88a';
    ctx.fillRect(sx + 4, sy + TILE + 4, 8, 6);
    ctx.fillStyle = '#d8c8a0';
    ctx.fillRect(sx + 4, sy + TILE + 4, 8, 2);
  }

  // ── Stone benches (row 10: cols 3-5 and cols 9-11) ────────────────────────
  for (const startCol of [3, 9]) {
    const bx = startCol * TILE, by = 10 * TILE;
    // Bench top — rough stone
    ctx.fillStyle = '#8a8278';
    ctx.fillRect(bx + 1, by + 3, 3 * TILE - 2, 10);
    // Highlight
    ctx.fillStyle = '#9a9288';
    ctx.fillRect(bx + 1, by + 3, 3 * TILE - 2, 2);
    // Front face — darker stone
    ctx.fillStyle = '#6a6260';
    ctx.fillRect(bx + 1, by + 13, 3 * TILE - 2, 6);
    // Legs
    ctx.fillStyle = '#5a5250';
    ctx.fillRect(bx + 2, by + 13, 5, 8);
    ctx.fillRect(bx + 3 * TILE - 7, by + 13, 5, 8);
  }

  // ── Private bath stalls (tubs at col 12 rows 6 & 8, behind wall partitions) ─
  for (const bath of [WASH_BASIN, WASH_BASIN_2]) {
    const tx = Math.round(bath.x - TILE / 2), ty = Math.round(bath.y - TILE / 2); // tile origin
    // Stone tub surround
    ctx.fillStyle = '#7a736a';
    ctx.fillRect(tx + 2, ty + 3, TILE - 4, TILE - 5);
    ctx.fillStyle = '#6a6260';
    ctx.fillRect(tx + 2, ty + 3, TILE - 4, 2);
    // Water
    ctx.fillStyle = '#9ab8c8';
    ctx.fillRect(tx + 4, ty + 6, TILE - 8, TILE - 11);
    // Rim highlight
    ctx.fillStyle = '#a8c8d8';
    ctx.fillRect(tx + 4, ty + 6, TILE - 8, 2);
    // Ripple (animated)
    if ((tick >> 5) & 1) {
      ctx.fillStyle = 'rgba(200,230,240,0.4)';
      ctx.fillRect(tx + 6, ty + 11, TILE - 12, 1);
    }
    // Privacy curtain across the west opening (aisle side), hanging partway down
    ctx.fillStyle = '#5a6a78';
    ctx.fillRect(tx - 1, ty + 1, 3, TILE - 3);       // curtain rail on the opening edge
    ctx.fillStyle = 'rgba(120,140,155,0.85)';
    ctx.fillRect(tx - 1, ty + 1, 2, Math.round(TILE / 2)); // cloth, half-drawn
    // Steam wisps rising from the tub (animated)
    const t = tick >> 3;
    ctx.fillStyle = 'rgba(200,220,230,0.18)';
    for (let i = 0; i < 3; i++) {
      const phase = (t + i * 7) % 24;
      const w2    = 4 - Math.floor(phase / 8);
      if (w2 > 0) ctx.fillRect(tx + 6 + i * 7, ty - phase + 4, w2, 6);
    }
  }

  // ── SPACE hints ───────────────────────────────────────────────────────────
  if (!dialogue.open && !choice.open && !shop.open) {
    const hints = [
      { pos: WASH_BASIN,   lx: WASH_BASIN.x,   ly: WASH_BASIN.y - 14 },
      { pos: WASH_BASIN_2, lx: WASH_BASIN_2.x, ly: WASH_BASIN_2.y - 14 },
      { pos: WASH_NOTICE,  lx: 10.5 * TILE,     ly: 3 * TILE - 4 },
    ];
    ctx.fillStyle = '#d8c878';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    for (const h of hints) {
      const dx = player.x - h.pos.x, dy = player.y - h.pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillText('SPACE', Math.round(h.lx), Math.round(h.ly));
      }
    }
    ctx.textAlign = 'left';
  }
}

// ─── Drenwick Infirmary Furniture ─────────────────────────────────────────────
// Draws the institutional fen palette (scrubbed grey-brown floorboards, aged-
// ivory upper wall with a deep-teal wainscot) and every zone of the infirmary
// over the base floor/wall tile pass. All ward beds are angled the same way,
// foot toward the central-right stove — a repeated, matching-linen ward look
// that reads instantly differently from Drenwick's warm, cluttered houses.
function drawInfirmaryFurniture() {
  if (!inTown || townBuilding !== 'infirmary' || currentTownId !== 'drenwick') return;
  const T = TILE;

  // ── Palette overlay ──────────────────────────────────────────────────────
  // Scrubbed grey-brown floorboards across the interior (rows 3-11, cols 2-13).
  ctx.fillStyle = '#6c6353';
  ctx.fillRect(2 * T, 3 * T, 12 * T, 9 * T);
  ctx.fillStyle = 'rgba(0,0,0,0.10)';               // board seams
  for (let y = 3 * T + 6; y < 12 * T; y += 11) ctx.fillRect(2 * T, y, 12 * T, 1);
  ctx.fillStyle = 'rgba(210,200,180,0.05)';         // faint scrub sheen
  for (let y = 3 * T + 12; y < 12 * T; y += 22) ctx.fillRect(2 * T, y, 12 * T, 1);
  // Aged-ivory back wall (row 2) with a deep-teal wainscot cap where it meets
  // the floor — the infirmary's cool, clean upper/lower wall banding.
  ctx.fillStyle = '#d7cdb6';
  ctx.fillRect(2 * T, 2 * T, 12 * T, T);
  ctx.fillStyle = '#33514b';
  ctx.fillRect(2 * T, 3 * T - 7, 12 * T, 7);
  ctx.fillStyle = '#4a6e66';
  ctx.fillRect(2 * T, 3 * T - 7, 12 * T, 1);
  // Thin teal skirting down the visible interior side walls (cols 2 & 13 edges).
  ctx.fillStyle = '#33514b';
  ctx.fillRect(2 * T, 3 * T, 3, 9 * T);
  ctx.fillRect(14 * T - 3, 3 * T, 3, 9 * T);

  // Rear service door on the back wall (c11-12) — depicted only, not an exit.
  ctx.fillStyle = '#2a2016';
  ctx.fillRect(11 * T + 4, 2 * T + 4, 2 * T - 8, T - 4);
  ctx.fillStyle = '#3a2c1c';
  ctx.fillRect(11 * T + 6, 2 * T + 6, 2 * T - 12, T - 6);
  ctx.fillStyle = '#20201e';                        // iron latch
  ctx.fillRect(12 * T - 2, 2 * T + 16, 4, 4);

  // Big treatment-room window on the back wall (c2-4), bright fen daylight.
  ctx.fillStyle = '#2a2016';
  ctx.fillRect(2 * T + 3, 2 * T + 3, 3 * T - 6, T - 8);
  ctx.fillStyle = '#b7cdc8';
  ctx.fillRect(2 * T + 5, 2 * T + 5, 3 * T - 10, T - 12);
  ctx.fillStyle = '#2a2016';                        // muntins
  ctx.fillRect(3 * T + 1, 2 * T + 5, 2, T - 12);
  ctx.fillRect(4 * T + 1, 2 * T + 5, 2, T - 12);
  ctx.fillRect(2 * T + 5, 2 * T + 11, 3 * T - 10, 2);

  // ── Treatment room (upper-left): counter c2-4 + exam table c3 ────────────
  {
    const cx = 2 * T, cy = 3 * T;                   // counter across cols 2-4
    ctx.fillStyle = '#3a2c1a';                      // dark varnished wood
    ctx.fillRect(cx + 1, cy + 2, 3 * T - 2, T - 4);
    ctx.fillStyle = '#4a3824';
    ctx.fillRect(cx + 1, cy + 2, 3 * T - 2, 3);
    // Instrument cabinet (c2): glass front, steel tools
    ctx.fillStyle = '#20201e';
    ctx.fillRect(cx + 3, cy + 5, T - 6, T - 10);
    ctx.fillStyle = '#8a9a9a';
    for (let i = 0; i < 3; i++) ctx.fillRect(cx + 6 + i * 5, cy + 8, 2, T - 16);
    // Rolled bandages + splints (c3-4)
    ctx.fillStyle = '#e6ddc8';
    for (let i = 0; i < 3; i++) ctx.fillRect(cx + T + 4 + i * 8, cy + 6, 6, 6);
    ctx.fillStyle = '#8a6a42';                      // splint slats
    for (let i = 0; i < 3; i++) ctx.fillRect(cx + 2 * T + 4, cy + 6 + i * 5, T - 8, 2);
    // High examination table (row4 c3) — dark slate top, tall iron legs
    const ex = 3 * T, ey = 4 * T;
    ctx.fillStyle = '#20201e';
    ctx.fillRect(ex + 3, ey + 12, 3, T - 12);
    ctx.fillRect(ex + T - 6, ey + 12, 3, T - 12);
    ctx.fillStyle = '#3a4448';                      // slate
    ctx.fillRect(ex + 1, ey + 4, T - 2, 9);
    ctx.fillStyle = '#e6ddc8';                       // paper sheet
    ctx.fillRect(ex + 3, ey + 5, T - 6, 4);
  }

  // ── Private room (upper-right): partition, proper door, one bed ──────────
  {
    // West + south partition (drawn over the wall tiles for the panelled look)
    ctx.fillStyle = '#d7cdb6';
    ctx.fillRect(10 * T, 3 * T, T, 2 * T + 8);       // west partition c10 rows3-5
    ctx.fillRect(10 * T, 5 * T, 4 * T, T);           // south partition row5
    ctx.fillStyle = '#33514b';                        // teal wainscot on partition
    ctx.fillRect(10 * T, 5 * T - 4, 4 * T, 4);
    // Proper door (row5 c12) — dark leaf, ajar
    ctx.fillStyle = '#2a2016';
    ctx.fillRect(12 * T + 2, 5 * T + 2, T - 4, T - 4);
    ctx.fillStyle = '#3a2c1c';
    ctx.fillRect(12 * T + 4, 5 * T + 3, T - 8, T - 6);
    ctx.fillStyle = '#20201e';
    ctx.fillRect(12 * T + 5, 5 * T + 14, 3, 4);
    // The one private bed (row3 c12-13), headboard left toward the door side
    drawInfirmaryBed(12 * T, 3 * T, 2);
  }

  // ── Main ward: three matching narrow beds, all angled toward the stove ───
  // Beds occupy cols 5-6 at rows 4, 6, 8; headboard on the left (col 5), foot
  // to the right (col 6) pointing at the stove; a small bedside stool at col 7.
  for (const br of [4, 6, 8]) {
    drawInfirmaryBed(5 * T, br * T, 2);
    // bedside stool in the aisle
    ctx.fillStyle = '#2a2016';
    ctx.fillRect(7 * T + 6, br * T + 10, 10, 3);
    ctx.fillStyle = '#3a2c1c';
    ctx.fillRect(7 * T + 8, br * T + 13, 3, 8);
    ctx.fillRect(7 * T + 14, br * T + 13, 3, 8);
  }

  // ── Intake (lower-left): infirmarer's desk + ledger, two waiting benches ─
  {
    const dx = 2 * T, dy = 8 * T;                   // desk c2-3
    ctx.fillStyle = '#3a2c1a';
    ctx.fillRect(dx + 1, dy + 4, 2 * T - 2, T - 8);
    ctx.fillStyle = '#4a3824';
    ctx.fillRect(dx + 1, dy + 4, 2 * T - 2, 3);
    ctx.fillStyle = '#e6ddc8';                       // patient ledger (open)
    ctx.fillRect(dx + 6, dy + 9, T - 8, T - 16);
    ctx.fillStyle = 'rgba(60,50,40,0.5)';
    for (let i = 0; i < 3; i++) ctx.fillRect(dx + 9, dy + 12 + i * 4, T - 14, 1);
    ctx.fillStyle = '#181410';                       // inkwell
    ctx.fillRect(dx + 2 * T - 10, dy + 10, 5, 5);
    // Waiting benches (rows 10-11 c2-3) — plain dark wood
    for (const brow of [10, 11]) {
      ctx.fillStyle = '#3a2c1c';
      ctx.fillRect(2 * T + 2, brow * T + 8, 2 * T - 4, 8);
      ctx.fillStyle = '#4a3824';
      ctx.fillRect(2 * T + 2, brow * T + 8, 2 * T - 4, 2);
    }
  }

  // ── Service / dispensary (right): stove + copper pot, cupboards, counter ──
  {
    // Utility stove (rows 7-8, cols 10-11) — black iron, warm firebox glow
    const sx = 10 * T, sy = 7 * T;
    ctx.fillStyle = '#20201e';
    ctx.fillRect(sx + 2, sy + 2, 2 * T - 4, 2 * T - 4);
    ctx.fillStyle = '#33302c';
    ctx.fillRect(sx + 4, sy + 4, 2 * T - 8, 2 * T - 8);
    const glow = (tick >> 4) & 1 ? '#d86a28' : '#c05a22';
    ctx.fillStyle = glow;                            // firebox
    ctx.fillRect(sx + 8, sy + 2 * T - 14, 2 * T - 16, 8);
    // Copper boiling pot on top, faint steam
    ctx.fillStyle = '#b06a3a';
    ctx.fillRect(sx + T - 8, sy + 6, 16, 12);
    ctx.fillStyle = '#c88248';
    ctx.fillRect(sx + T - 8, sy + 6, 16, 3);
    if ((tick >> 5) & 1) {
      ctx.fillStyle = 'rgba(220,220,215,0.35)';
      ctx.fillRect(sx + T - 2, sy - 2, 3, 8);
    }
    // Locked medicine cupboard + linen store (col 13, rows 6-9)
    ctx.fillStyle = '#3a2c1a';
    ctx.fillRect(13 * T + 1, 6 * T + 2, T - 2, 2 * T - 4); // med cupboard c13 r6-7
    ctx.fillStyle = '#4a3824';
    ctx.fillRect(13 * T + 2, 6 * T + 4, T - 4, 3);
    ctx.fillStyle = '#20201e';                        // lock bar
    ctx.fillRect(13 * T + 4, 7 * T - 2, T - 8, 3);
    // amber/green medicine bottles on a ledge
    ctx.fillStyle = '#c8922e';
    ctx.fillRect(13 * T + 4, 6 * T + 9, 4, 7);
    ctx.fillStyle = '#5a8a4a';
    ctx.fillRect(13 * T + 10, 6 * T + 10, 4, 6);
    // Clean-linen store (col 13, row 9) — stacked cream linens
    const lc = ['#e6ddc8', '#dcd2bc', '#e2d8c2'];
    for (let i = 0; i < 3; i++) { ctx.fillStyle = lc[i]; ctx.fillRect(13 * T + 3, 9 * T + 5 + i * 6, T - 6, 4); }
    // Dispensary counter (row10 c11-12) — mortar & pestle, and the letter
    const px = 11 * T, py = 10 * T;
    ctx.fillStyle = '#3a2c1a';
    ctx.fillRect(px + 1, py + 4, 2 * T - 2, T - 8);
    ctx.fillStyle = '#4a3824';
    ctx.fillRect(px + 1, py + 4, 2 * T - 2, 3);
    ctx.fillStyle = '#8a8278';                        // stone mortar
    ctx.beginPath(); ctx.arc(px + T + 8, py + T - 8, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6a6260';
    ctx.fillRect(px + T + 11, py + 6, 2, 9);          // pestle
  }

  // ── The Doctor's Letter on the dispensary counter (until picked up) ──────
  if (!stats.items.some(it => it.name === "Doctor's Letter")) {
    const lx = 11 * T + 6, ly = 10 * T + 8;
    ctx.fillStyle = '#efe7d2';
    ctx.fillRect(lx, ly, 15, 11);
    ctx.fillStyle = '#d8ceb4';                        // fold shadow
    ctx.fillRect(lx, ly + 6, 15, 1);
    ctx.fillStyle = '#8a2a2a';                        // broken wax seal
    ctx.beginPath(); ctx.arc(lx + 12, ly + 8, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(70,55,40,0.5)';             // lines of writing
    for (let i = 0; i < 3; i++) ctx.fillRect(lx + 2, ly + 2 + i * 3, 10, 1);
    if ((tick >> 4) & 1) {                            // faint "take me" glint
      ctx.fillStyle = 'rgba(240,230,180,0.6)';
      ctx.fillRect(lx + 5, ly - 3, 5, 1);
    }
  }

  // ── Bottom-centre mud vestibule: reed mat, boot scraper, pegs, wash basin ─
  {
    // Reed mat in front of the door (rows 10-11, cols 6-8)
    ctx.fillStyle = '#7a6a44';
    ctx.fillRect(6 * T, 10 * T + 6, 3 * T, 2 * T - 8);
    ctx.fillStyle = 'rgba(50,40,24,0.4)';            // reed weave
    for (let x = 6 * T; x < 9 * T; x += 4) ctx.fillRect(x, 10 * T + 6, 1, 2 * T - 8);
    // Boot scraper (iron) by the door
    ctx.fillStyle = '#20201e';
    ctx.fillRect(7 * T + 10, 11 * T + 20, 12, 3);
    ctx.fillRect(7 * T + 14, 11 * T + 16, 4, 4);
    // Cloak pegs on the left vestibule wall (col 4 edge), a hung cloak
    ctx.fillStyle = '#20201e';
    for (let i = 0; i < 3; i++) ctx.fillRect(4 * T + 2, 10 * T + 6 + i * 8, 5, 2);
    ctx.fillStyle = '#3a4a48';
    ctx.fillRect(4 * T + 1, 10 * T + 16, 8, 14);
    // Hand-wash basin (row 11 col 8) — copper bowl over a dark slate stand
    const wx = 8 * T, wy = 11 * T;
    ctx.fillStyle = '#3a4448';
    ctx.fillRect(wx + 3, wy + 10, T - 6, T - 12);
    ctx.fillStyle = '#b06a3a';
    ctx.fillRect(wx + 4, wy + 5, T - 8, 8);
    ctx.fillStyle = '#9ab8c0';                        // water
    ctx.fillRect(wx + 6, wy + 6, T - 12, 4);
  }
}

// A single narrow infirmary bed at pixel (bx, by) spanning `wcols` tiles wide,
// drawn horizontally: dark iron frame, unbleached cream sheet, muted-teal
// blanket, pillow at the LEFT (headboard) so every bed faces the same way
// (toward the stove on the right — see drawInfirmaryFurniture).
function drawInfirmaryBed(bx, by, wcols) {
  const w = wcols * TILE;
  // Iron frame + legs
  ctx.fillStyle = '#20201e';
  ctx.fillRect(bx + 2, by + 4, w - 4, TILE - 8);
  ctx.fillStyle = '#2a2a26';
  ctx.fillRect(bx + 2, by + 4, 3, TILE - 8);         // headboard rail (left)
  // Cream sheet / mattress
  ctx.fillStyle = '#e6ddc8';
  ctx.fillRect(bx + 5, by + 6, w - 9, TILE - 12);
  // Muted-teal blanket over the foot (right two-thirds)
  ctx.fillStyle = '#4a6e66';
  ctx.fillRect(bx + Math.round(w * 0.42), by + 6, Math.round(w * 0.55) - 4, TILE - 12);
  ctx.fillStyle = '#557a72';
  ctx.fillRect(bx + Math.round(w * 0.42), by + 6, Math.round(w * 0.55) - 4, 2);
  // Pillow at the head (left)
  ctx.fillStyle = '#f0e9d6';
  ctx.fillRect(bx + 6, by + 8, 12, TILE - 16);
}

// ─── Drenwick Provision Store Furniture ───────────────────────────────────────
// Drawn over the tile pass: north shelving (row 3), east shelf (col 12),
// crate stack (rows 7-8 cols 3-5), ledger shelf (col 2 rows 9-10).
function drawProvisionStoreFurniture() {
  if (!inTown || townBuilding !== 'provision_store') return;

  // ── North wall shelving (row 3, cols 2-11) ────────────────────────────────
  {
    const sx = 2 * TILE, sy = 3 * TILE, sw = 10 * TILE;
    // Back board — deep planks
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(sx, sy, sw, TILE);
    // Three shelf boards
    ctx.fillStyle = '#5a3820';
    ctx.fillRect(sx + 1, sy + 4,  sw - 2, 3);
    ctx.fillRect(sx + 1, sy + 14, sw - 2, 3);
    ctx.fillRect(sx + 1, sy + 24, sw - 2, 3);
    // Goods on shelves — sacks, jars, bundles
    const goods = [
      { w: 8, h: 6, c: '#c8a068' }, // sack
      { w: 5, h: 8, c: '#8a9870' }, // jar
      { w: 9, h: 5, c: '#c89848' }, // flat bundle
      { w: 6, h: 7, c: '#a86838' }, // round jar
    ];
    for (let row = 0; row < 2; row++) {
      let xOff = 3;
      while (xOff < sw - 14) {
        const g = goods[(xOff + row * 5) % 4];
        ctx.fillStyle = g.c;
        ctx.fillRect(sx + xOff, sy + 7 + row * 10, g.w, g.h);
        // Highlight on goods
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(sx + xOff, sy + 7 + row * 10, g.w, 1);
        xOff += g.w + 2 + (xOff % 3);
      }
    }
  }

  // ── East shelving (col 12, rows 4-10) ─────────────────────────────────────
  {
    const ex = 12 * TILE, ey = 4 * TILE, eh = 7 * TILE;
    // Back board
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(ex, ey, TILE, eh);
    // Shelf boards every tile
    ctx.fillStyle = '#5a3820';
    for (let r = 0; r <= 7; r++) {
      ctx.fillRect(ex + 1, ey + r * TILE, TILE - 2, 3);
    }
    // Order ledger (at rows 5-6 = ledger area)
    ctx.fillStyle = '#283058';
    ctx.fillRect(ex + 4, ey + TILE + 4, TILE - 8, TILE - 8);
    ctx.fillStyle = '#c8b888';
    ctx.fillRect(ex + 6, ey + TILE + 8, TILE - 12, 2);
    ctx.fillRect(ex + 6, ey + TILE + 12, TILE - 12, 1);
    ctx.fillRect(ex + 6, ey + TILE + 15, TILE - 16, 1);
  }

  // ── Central stock crates (rows 7-8, cols 3-5) ─────────────────────────────
  {
    const bx = 3 * TILE, by = 7 * TILE;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const cx2 = bx + col * TILE, cy2 = by + row * TILE;
        // Crate
        ctx.fillStyle = '#7a5230';
        ctx.fillRect(cx2 + 2, cy2 + 2, TILE - 4, TILE - 4);
        ctx.fillStyle = '#8a6240';
        ctx.fillRect(cx2 + 2, cy2 + 2, TILE - 4, 4);
        // Stencilled mark (imperial stamp)
        ctx.fillStyle = '#c03020';
        ctx.fillRect(cx2 + 8, cy2 + 10, 4, 5);
        ctx.fillRect(cx2 + 10, cy2 + 8, 2, 9);
        // Slat
        ctx.fillStyle = '#5a3820';
        ctx.fillRect(cx2 + 2, cy2 + 17, TILE - 4, 2);
      }
    }
  }

  // ── Ledger shelf (col 2, rows 9-10) ───────────────────────────────────────
  {
    const lx = 2 * TILE, ly = 9 * TILE;
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(lx, ly, TILE, 2 * TILE);
    ctx.fillStyle = '#5a3820';
    ctx.fillRect(lx + 2, ly + TILE - 2, TILE - 4, 4);
    // Upright ledgers
    const lc2 = ['#2a5028', '#3a3a7a', '#582808', '#384820'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = lc2[i];
      ctx.fillRect(lx + 3 + i * 7, ly + 4, 5, TILE - 10);
    }
    // Rolled scroll on lower shelf
    ctx.fillStyle = '#c8b880';
    ctx.fillRect(lx + 3, ly + TILE + 6, TILE - 6, 5);
    ctx.fillStyle = '#a89860';
    ctx.fillRect(lx + 3, ly + TILE + 6, TILE - 6, 2);
  }

  // ── SPACE hints ───────────────────────────────────────────────────────────
  if (!dialogue.open && !choice.open && !shop.open) {
    const hints = [
      { pos: DRENWICK_PROVISION_LEDGER, lx: 12 * TILE + 8, ly: 5 * TILE },
      { pos: PROVISION_STOCK_CRATE,       lx: 4.5 * TILE,    ly: 7 * TILE - 2 },
    ];
    ctx.fillStyle = '#d8c878';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    for (const h of hints) {
      const dx = player.x - h.pos.x, dy = player.y - h.pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillText('SPACE', Math.round(h.lx), Math.round(h.ly));
      }
    }
    ctx.textAlign = 'left';
  }
}


// Drenwick tavern keeper position — col 7 row 2, behind the bar in DRENWICK_TAVERN_MAP.
const DRENWICK_TAVERN_KEEPER = { x: 7.5 * TILE, y: 2.5 * TILE };

// Drenwick tavern tables — seven tables distributed organically across the floor.
// Table 7 (far east corner) is slightly separated from the main cluster.
// Used for both canWalk() collision and drawDrenwichTavernFurniture().
const DRENWICK_TAVERN_TABLES = [
  { x:  3.5 * TILE, y:  4.5 * TILE },  // table 1 — west, near bar
  { x:  6.5 * TILE, y:  5.5 * TILE },  // table 2 — center-west, offset south
  { x: 10.5 * TILE, y:  4.5 * TILE },  // table 3 — east, near bar
  { x:  3.5 * TILE, y:  8.5 * TILE },  // table 4 — west mid
  { x:  7.5 * TILE, y:  8.5 * TILE },  // table 5 — center mid (barge crew table)
  { x:  4.5 * TILE, y: 11.5 * TILE },  // table 6 — west south (regular's table)
  { x: 12.5 * TILE, y: 10.5 * TILE },  // table 7 — far east corner (off-note figures)
];

// Drenwick school ground floor interactable objects.
// The Ancient Textbook lives on a bookshelf against the west wall (col 2, rows
// 4-5), NOT on a student desk. It used to sit at col 5 row 6, the exact tile
// where student drenwick_gs_2 stands, so inspecting it shadowed that student's
// own dialogue; moving it to the shelf frees the student and gives the textbook
// a sensible home.
const DRENWICK_SCHOOL_GROUND_SHELF = { x: 2.5 * TILE, y: 4.5 * TILE }; // bookshelf, ground floor col 2 rows 4-5 (ancient textbook)

// Drenwick school upper floor interactable objects.
const DRENWICK_SCHOOL_CABINET   = { x:  2.5 * TILE, y: 3.5 * TILE }; // document cabinet, upper floor col 2 row 3
const DRENWICK_SCHOOL_BOARD     = { x: 13.5 * TILE, y: 6.5 * TILE }; // apprenticeship board, upper floor col 13 row 6

// Drenwick school basement interactable objects.
const DRENWICK_SCHOOL_BOOKSHELF      = { x:  8.5 * TILE, y: 2.5 * TILE }; // archive bookshelf, basement cols 6-10 row 2 (approach from row 3)
const DRENWICK_SCHOOL_ACCORD_DISPLAY = { x:  4.5 * TILE, y: 1.5 * TILE }; // north-wall document display (basement), approached from row 2-3

// Calwick office wall map — inspectable continent map on north wall (cols 6-9 row 1).
// Hotspot at row-1 centre (y = 1.5*TILE) so distance from row-2 floor is 1 tile = 32px,
// within TALK_RADIUS * 1.5 (42px).
const CALWICK_OFFICE_WALL_MAP = { x: 8 * TILE, y: 1.5 * TILE };

// Drenwick harbormaster interior objects.
const DRENWICK_WEIGHMASTER_COUNTER = { x: 11.5 * TILE, y: 5.5 * TILE }; // weighmaster scale, col 11 row 5
const HARBOR_CHARTS      = { x: 10.5 * TILE, y: 4 * TILE };  // navigation charts, north shelf area (approach from row 4)
const HARBOR_MOORING_LOG = { x: 12 * TILE,   y: 7.5 * TILE }; // mooring/traffic log, east counter row 7

// Drenwick wash house interior objects.
const WASH_NOTICE        = { x: 10.5 * TILE, y: 3.5 * TILE }; // posted hours/rules notice (col 10 row 3 = floor)

// Drenwick provision store interior objects.
const DRENWICK_PROVISION_LEDGER    = { x: 11.5 * TILE, y: 5.5 * TILE }; // order ledger, col 11 row 5
const PROVISION_STOCK_CRATE = { x: 6 * TILE, y: 7.5 * TILE }; // stock crate inspection (approach from east face of crates)


// ─── Drenwick Office Furniture Drawing ───────────────────────────────────────
// Adds desks, a counter, shelves, and a filing cabinet to the Drenwick office.
// Does not block any important paths. No map data changes needed.
function drawDrenwickOfficeFurniture() {
  if (!inTown || townBuilding !== 'office' || currentTownId !== 'drenwick') return;

  // ── Notice board / posting board (north wall, cols 4-6, row 1) ─────────────
  {
    const bx = 4 * TILE + 4, by = TILE + 6, bw = 3 * TILE - 8, bh = 20;
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
    ctx.fillStyle = '#c8a060';
    ctx.fillRect(bx, by, bw, bh);
    // Posted notices (tan slips)
    ctx.fillStyle = '#f0e0b0';
    ctx.fillRect(bx + 3,  by + 3, 28, 13);
    ctx.fillRect(bx + 36, by + 3, 22, 10);
    ctx.fillStyle = '#e0c890';
    ctx.fillRect(bx + 33, by + 8,  25, 10);
    // Pin dots
    ctx.fillStyle = '#8a3020';
    ctx.fillRect(bx + 3,  by + 3,  2, 2);
    ctx.fillRect(bx + 36, by + 3,  2, 2);
    ctx.fillRect(bx + 57, by + 3,  2, 2);
    // Label
    ctx.fillStyle = '#3a1e08';
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DISTRICT BOARD', bx + bw / 2, by + bh + 9);
    ctx.textAlign = 'left';
  }

  // helper: simple desk with papers
  function drenwDesk(tx, ty) {
    ctx.fillStyle = '#7a4a20';
    ctx.fillRect(tx + 3, ty + 3, 26, 13);
    ctx.fillStyle = '#9a6830';
    ctx.fillRect(tx + 3, ty + 3, 26, 3);
    ctx.fillStyle = '#3a1e08';
    ctx.fillRect(tx + 3, ty + 15, 26, 2);
    ctx.fillStyle = '#f0ecdc';
    ctx.fillRect(tx + 5, ty + 6, 9, 7);
    ctx.fillStyle = '#e0d8c0';
    ctx.fillRect(tx + 17, ty + 7, 8, 5);
    ctx.fillStyle = '#181018';
    ctx.fillRect(tx + 24, ty + 5, 3, 5);
    ctx.fillStyle = '#8a5528';
    ctx.fillRect(tx + 5, ty + 19, 22, 7);
    ctx.fillStyle = '#6a3a18';
    ctx.fillRect(tx + 5, ty + 17, 22, 4);
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(tx + 6,  ty + 25, 3, 5);
    ctx.fillRect(tx + 22, ty + 25, 3, 5);
  }

  // Three clerk desks (row 4, cols 3, 6, 9)
  drenwDesk(3 * TILE, 4 * TILE);
  drenwDesk(6 * TILE, 4 * TILE);
  drenwDesk(9 * TILE, 4 * TILE);

  // ── Officer alcove desk (col 12, rows 3-4) ─────────────────────────────────
  {
    const tx = 12 * TILE, ty = 3 * TILE;
    ctx.fillStyle = '#4a2808';
    ctx.fillRect(tx + 2, ty + 3, 28, 13);
    ctx.fillStyle = '#6a3a18';
    ctx.fillRect(tx + 2, ty + 3, 28, 3);
    ctx.fillStyle = '#200c04';
    ctx.fillRect(tx + 2, ty + 15, 28, 2);
    ctx.fillStyle = '#f0ecdc';
    ctx.fillRect(tx + 4,  ty + 6, 10, 7);
    ctx.fillStyle = '#e0d8c0';
    ctx.fillRect(tx + 18, ty + 5, 10, 6);
    ctx.fillStyle = '#b09030';
    ctx.fillRect(tx + 10, ty + 13, 12, 4);
    ctx.fillStyle = '#6a3808';
    ctx.fillRect(tx + 4, ty + 19, 24, 8);
    ctx.fillStyle = '#4a2408';
    ctx.fillRect(tx + 4, ty + 17, 24, 4);
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(tx + 5,  ty + 26, 4, 4);
    ctx.fillRect(tx + 21, ty + 26, 4, 4);
  }

  // ── Low shelving unit (east wall, col 13, rows 6-10) ──────────────────────
  {
    const sx = 13 * TILE + 4, sy = 6 * TILE + 4;
    const sw = 24, sh = 5 * TILE - 8;
    // Shelf body
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = '#8a5830';
    ctx.fillRect(sx, sy, sw, 3);
    // Individual shelves
    for (let i = 1; i <= 4; i++) {
      const sby = sy + i * Math.floor(sh / 5);
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(sx, sby, sw, 2);
      // Books on each shelf
      ctx.fillStyle = '#8a3020';
      ctx.fillRect(sx + 2, sby - 10, 4, 10);
      ctx.fillStyle = '#205848';
      ctx.fillRect(sx + 7, sby - 12, 4, 12);
      ctx.fillStyle = '#684020';
      ctx.fillRect(sx + 12, sby - 9, 4, 9);
      ctx.fillStyle = '#404060';
      ctx.fillRect(sx + 17, sby - 11, 5, 11);
    }
  }

  // ── Counter / intake bench (col 3-4, rows 8-9) ─────────────────────────────
  {
    const cx = 3 * TILE, cy = 8 * TILE;
    ctx.fillStyle = '#7a5030';
    ctx.fillRect(cx + 2, cy + 4, 2 * TILE - 4, 12);
    ctx.fillStyle = '#9a6840';
    ctx.fillRect(cx + 2, cy + 4, 2 * TILE - 4, 3);
    ctx.fillStyle = '#3a1e08';
    ctx.fillRect(cx + 2, cy + 15, 2 * TILE - 4, 2);
    // Logbook on counter
    ctx.fillStyle = '#3a3028';
    ctx.fillRect(cx + 8,  cy + 5, 18, 9);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(cx + 9,  cy + 6, 16, 7);
    // Stamp
    ctx.fillStyle = '#7a3018';
    ctx.fillRect(cx + 30, cy + 6, 10, 8);
    ctx.fillStyle = '#c84820';
    ctx.fillRect(cx + 31, cy + 9, 8, 3);
    // Counter legs
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(cx + 3, cy + 17, 4, 10);
    ctx.fillRect(cx + 2 * TILE - 9, cy + 17, 4, 10);
  }
}

// ─── Office Furniture Drawing ─────────────────────────────────────────────────
function drawOfficeFurniture() {
  if (!inTown || townBuilding !== 'office' || currentTownId !== 'calwick') return;

  // ── Wall primer (hung on north wall, row 1, cols 6–9) ─────────────────────
  // A framed service manual explaining agent stats — inspecting it opens the
  // stats primer dialogue (interactCalwickOffice). The continent map moved to
  // the school.
  {
    const wx = 6 * TILE + 4;   // x = 196
    const wy = TILE + 6;       // y = 38  (within row-1 wall tile)
    const ww = 4 * TILE - 8;   // 120 px wide
    const wh = 20;             // 20 px tall
    // Wooden frame
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
    // Parchment surface
    ctx.fillStyle = '#e2d6a4';
    ctx.fillRect(wx, wy, ww, wh);
    // Heading bar
    ctx.fillStyle = '#8a3030';
    ctx.fillRect(wx + 4, wy + 3, ww - 8, 3);
    // Ruled text lines (a manual, not a map)
    ctx.fillStyle = '#5a4a30';
    for (let i = 0; i < 3; i++) ctx.fillRect(wx + 4, wy + 9 + i * 3, ww - 40, 1);
    // A small stat bar motif on the right
    ctx.fillStyle = '#3a6a4a';
    ctx.fillRect(wx + ww - 30, wy + 9, 22, 2);
    ctx.fillStyle = '#6a3a3a';
    ctx.fillRect(wx + ww - 30, wy + 13, 16, 2);
    // Frame corner bolts
    ctx.fillStyle = '#2a1008';
    ctx.fillRect(wx - 3, wy - 3, 4, 4);
    ctx.fillRect(wx + ww - 1, wy - 3, 4, 4);
    ctx.fillRect(wx - 3, wy + wh - 1, 4, 4);
    ctx.fillRect(wx + ww - 1, wy + wh - 1, 4, 4);
    // Label strip below frame
    ctx.fillStyle = '#8a6030';
    ctx.font = 'bold 7px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FIELD MANUAL', wx + ww / 2, wy + wh + 9);
    ctx.textAlign = 'left';
  }

  // ── Regular desk helper: desk top + chair, fits in one 32×32 tile ─────────
  function drawDesk(tx, ty) {
    // Desk surface
    ctx.fillStyle = '#7a4a20';
    ctx.fillRect(tx + 3, ty + 3, 26, 13);
    // Top-edge highlight
    ctx.fillStyle = '#9a6830';
    ctx.fillRect(tx + 3, ty + 3, 26, 3);
    // Front-edge shadow
    ctx.fillStyle = '#3a1e08';
    ctx.fillRect(tx + 3, ty + 15, 26, 2);
    // Papers
    ctx.fillStyle = '#f0ecdc';
    ctx.fillRect(tx + 5, ty + 6, 9, 7);
    ctx.fillStyle = '#e0d8c0';
    ctx.fillRect(tx + 17, ty + 7, 8, 5);
    // Inkwell
    ctx.fillStyle = '#181018';
    ctx.fillRect(tx + 24, ty + 5, 3, 5);
    ctx.fillStyle = '#2a1828';
    ctx.fillRect(tx + 25, ty + 4, 2, 2);
    // Chair seat
    ctx.fillStyle = '#8a5528';
    ctx.fillRect(tx + 5, ty + 19, 22, 7);
    // Chair back (thin strip above seat)
    ctx.fillStyle = '#6a3a18';
    ctx.fillRect(tx + 5, ty + 17, 22, 4);
    // Chair-seat highlight
    ctx.fillStyle = '#a06a34';
    ctx.fillRect(tx + 5, ty + 19, 22, 2);
    // Chair legs
    ctx.fillStyle = '#5a3010';
    ctx.fillRect(tx + 6,  ty + 25, 3, 5);
    ctx.fillRect(tx + 22, ty + 25, 3, 5);
  }

  // Three regular desks (row 3)
  drawDesk(3 * TILE, 3 * TILE);
  drawDesk(6 * TILE, 3 * TILE);
  drawDesk(9 * TILE, 3 * TILE);

  // ── Supervisor partition (thin vertical divider, col 10, rows 2–7) ────────
  {
    const px = 10 * TILE + 1;          // x = 321
    const pt = 2 * TILE;               // top y = 64
    const ph = 6 * TILE;               // 192 px tall (rows 2–7)
    ctx.fillStyle = '#7a5030';
    ctx.fillRect(px, pt, 4, ph);
    ctx.fillStyle = '#9a6840';
    ctx.fillRect(px, pt, 2, ph);       // left highlight
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(px + 3, pt, 1, ph);   // right shadow
    // Cap finials at top and bottom
    ctx.fillStyle = '#c8a060';
    ctx.fillRect(px - 1, pt,          6, 3);
    ctx.fillRect(px - 1, pt + ph - 3, 6, 3);
  }

  // ── Supervisor desk (wider, darker — cols 11–12, row 2) ───────────────────
  {
    const tx = 11 * TILE, ty = 2 * TILE;
    const dw = 57;   // spans almost 2 tiles
    // Desk surface
    ctx.fillStyle = '#4a2808';
    ctx.fillRect(tx + 3, ty + 3, dw, 13);
    // Top-edge highlight
    ctx.fillStyle = '#6a3a18';
    ctx.fillRect(tx + 3, ty + 3, dw, 3);
    // Front-edge shadow
    ctx.fillStyle = '#200c04';
    ctx.fillRect(tx + 3, ty + 15, dw, 2);
    // Papers (spread across the wide surface)
    ctx.fillStyle = '#f0ecdc';
    ctx.fillRect(tx + 5,  ty + 6, 10, 7);
    ctx.fillRect(tx + 20, ty + 5,  9, 6);
    ctx.fillStyle = '#e0d8c0';
    ctx.fillRect(tx + 34, ty + 6, 12, 7);
    ctx.fillRect(tx + 50, ty + 7,  7, 5);
    // Brass nameplate
    ctx.fillStyle = '#b09030';
    ctx.fillRect(tx + 18, ty + 13, 24, 5);
    ctx.fillStyle = '#d8b040';
    ctx.fillRect(tx + 19, ty + 14, 22, 2);
    // Inkwell + quill pen
    ctx.fillStyle = '#181018';
    ctx.fillRect(tx + 55, ty + 5, 3, 6);
    ctx.fillStyle = '#c89820';
    ctx.fillRect(tx + 54, ty + 4, 1, 9);   // quill shaft
    ctx.fillStyle = '#e8d880';
    ctx.fillRect(tx + 53, ty + 3, 2, 2);   // feather tip
    // Wide chair seat
    ctx.fillStyle = '#6a3808';
    ctx.fillRect(tx + 7, ty + 19, 46, 8);
    // Chair back
    ctx.fillStyle = '#4a2408';
    ctx.fillRect(tx + 7, ty + 17, 46, 4);
    // Seat highlight
    ctx.fillStyle = '#8a4a10';
    ctx.fillRect(tx + 7, ty + 19, 46, 2);
    // Chair legs
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(tx + 8,  ty + 26, 4, 4);
    ctx.fillRect(tx + 48, ty + 26, 4, 4);
  }

  // ── Filing cabinet (col 12, row 6) ────────────────────────────────────────
  {
    const fx = 12 * TILE + 4;   // x = 388
    const fy = 6 * TILE + 2;    // y = 194
    // Cabinet body
    ctx.fillStyle = '#788898';
    ctx.fillRect(fx, fy, 23, 27);
    // Top lid / face
    ctx.fillStyle = '#9ab0c0';
    ctx.fillRect(fx, fy, 23, 4);
    // Right-side shadow
    ctx.fillStyle = '#506070';
    ctx.fillRect(fx + 21, fy, 2, 27);
    // Three drawers
    for (let d = 0; d < 3; d++) {
      const dy = fy + 5 + d * 7;
      // Drawer recess
      ctx.fillStyle = '#687888';
      ctx.fillRect(fx + 2, dy, 19, 5);
      // Handle
      ctx.fillStyle = '#c8d0d8';
      ctx.fillRect(fx + 7, dy + 2, 8, 2);
      ctx.fillStyle = '#a0b0b8';
      ctx.fillRect(fx + 7, dy + 3, 8, 1);
    }
    // Label on top drawer
    ctx.fillStyle = '#384858';
    ctx.font = '5px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FILES', fx + 11, fy + 9);
    ctx.textAlign = 'left';
  }

  // ── Esla's filing cabinet (col 3, row 9 — lower-left area, Calwick only) ──
  if (currentTownId === 'calwick') {
    const fx = 3 * TILE + 4;   // x = 100
    const fy = 9 * TILE + 2;   // y = 290
    // Cabinet body
    ctx.fillStyle = '#788898';
    ctx.fillRect(fx, fy, 23, 27);
    // Top lid / face
    ctx.fillStyle = '#9ab0c0';
    ctx.fillRect(fx, fy, 23, 4);
    // Right-side shadow
    ctx.fillStyle = '#506070';
    ctx.fillRect(fx + 21, fy, 2, 27);
    // Three drawers
    for (let d = 0; d < 3; d++) {
      const dy = fy + 5 + d * 7;
      ctx.fillStyle = '#687888';
      ctx.fillRect(fx + 2, dy, 19, 5);
      ctx.fillStyle = '#c8d0d8';
      ctx.fillRect(fx + 7, dy + 2, 8, 2);
      ctx.fillStyle = '#a0b0b8';
      ctx.fillRect(fx + 7, dy + 3, 8, 1);
    }
    // Label on top drawer
    ctx.fillStyle = '#384858';
    ctx.font = '5px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FILES', fx + 11, fy + 9);
    ctx.textAlign = 'left';
  } // end calwick-only Esla cabinet

  // ── Imperial Rank Chart (east wall, col 13, rows 3–8) ─────────────────────
  // A framed organizational hierarchy showing the five tiers of IJC field staff.
  // Painted on linen pinned to a board — visible from across the office.
  if (currentTownId === 'calwick') {
    const rx = 13 * TILE + 2;   // x = 418
    const ry =  3 * TILE + 4;   // y = 100  (starts just inside the interior)
    const rw = 26;              // chart width
    const rh = 5 * TILE - 8;   // ~152 px tall
    // Wooden backing board
    ctx.fillStyle = '#3a2008';
    ctx.fillRect(rx - 2, ry - 2, rw + 4, rh + 4);
    // Linen surface — aged cream
    ctx.fillStyle = '#d8c898';
    ctx.fillRect(rx, ry, rw, rh);
    // Title band at top
    ctx.fillStyle = '#8a1010';
    ctx.fillRect(rx, ry, rw, 10);
    ctx.fillStyle = '#f0d0d0';
    ctx.font = '5px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('IJC STAFF', rx + rw / 2, ry + 7);
    ctx.textAlign = 'left';
    // Hierarchy boxes — five tiers (top to bottom)
    const tiers = [
      { label: 'DIR',   col: '#9a3010', y: ry + 13 },
      { label: 'SUP',   col: '#7a4820', y: ry + 33 },
      { label: 'CLK',   col: '#5a5a30', y: ry + 53 },
      { label: 'AST',   col: '#405040', y: ry + 73 },
      { label: 'FLD',   col: '#384858', y: ry + 93 },
    ];
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const bw2 = 18, bh2 = 14;
      const bx2 = rx + (rw - bw2) / 2;
      // Connecting line to previous tier
      if (i > 0) {
        ctx.fillStyle = '#886040';
        ctx.fillRect(bx2 + bw2 / 2 - 1, tiers[i - 1].y + 14, 2, t.y - tiers[i - 1].y - 14);
      }
      // Box
      ctx.fillStyle = t.col;
      ctx.fillRect(bx2, t.y, bw2, bh2);
      // Box highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(bx2, t.y, bw2, 2);
      // Label
      ctx.fillStyle = '#f0e8d0';
      ctx.font = '5px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.label, bx2 + bw2 / 2, t.y + 9);
      ctx.textAlign = 'left';
    }
    // Corner tack pins
    ctx.fillStyle = '#c09030';
    ctx.fillRect(rx,          ry,          3, 3);
    ctx.fillRect(rx + rw - 3, ry,          3, 3);
    ctx.fillRect(rx,          ry + rh - 3, 3, 3);
    ctx.fillRect(rx + rw - 3, ry + rh - 3, 3, 3);
  }
}

// ─── School Furniture Drawing ─────────────────────────────────────────────────
function drawSchoolFurniture() {
  if (!inTown || townBuilding !== 'school') return;

  // ── Blackboard (hung on north wall, row 1, cols 3–12) ─────────────────────
  {
    const bx = 3 * TILE + 2;   // x = 98
    const by = TILE + 4;       // y = 36
    const bw = 10 * TILE - 4;  // 316 px wide
    const bh = 22;
    // Wooden frame
    ctx.fillStyle = '#4a2e10';
    ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
    // Board surface (dark green)
    ctx.fillStyle = '#1e3a28';
    ctx.fillRect(bx, by, bw, bh);
    // Chalk writing (white-ish lines simulating text)
    ctx.fillStyle = 'rgba(240, 240, 220, 0.75)';
    // Header underline
    ctx.fillRect(bx + 4,  by + 4, bw - 8, 1);
    // Simulated chalk text lines
    ctx.fillRect(bx + 10, by + 8,  60, 2);
    ctx.fillRect(bx + 76, by + 8,  48, 2);
    ctx.fillRect(bx + 130, by + 8, 55, 2);
    ctx.fillRect(bx + 192, by + 8, 40, 2);
    ctx.fillRect(bx + 240, by + 8, 60, 2);
    ctx.fillRect(bx + 10, by + 14, 45, 2);
    ctx.fillRect(bx + 64, by + 14, 70, 2);
    ctx.fillRect(bx + 144, by + 14, 35, 2);
    ctx.fillRect(bx + 188, by + 14, 50, 2);
    // Chalk dust tray at bottom of frame
    ctx.fillStyle = '#6a4a20';
    ctx.fillRect(bx - 3, by + bh + 3, bw + 6, 4);
    ctx.fillStyle = 'rgba(240, 240, 220, 0.4)';
    ctx.fillRect(bx,     by + bh + 4, bw,     2);
    // Frame corner bolts
    ctx.fillStyle = '#2a1008';
    ctx.fillRect(bx - 3, by - 3, 4, 4);
    ctx.fillRect(bx + bw - 1, by - 3, 4, 4);
    ctx.fillRect(bx - 3, by + bh - 1, 4, 4);
    ctx.fillRect(bx + bw - 1, by + bh - 1, 4, 4);
  }

  // ── Teacher lectern (col 7, row 3) ────────────────────────────────────────
  {
    const tx = 7 * TILE, ty = 3 * TILE;
    // Lectern top surface (angled reading stand)
    ctx.fillStyle = '#5a3818';
    ctx.fillRect(tx + 4, ty + 4, 24, 14);
    ctx.fillStyle = '#7a5028';
    ctx.fillRect(tx + 4, ty + 4, 24, 4);
    // Papers on lectern
    ctx.fillStyle = '#f0ecdc';
    ctx.fillRect(tx + 6, ty + 6, 14, 9);
    // Stand support
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(tx + 12, ty + 18, 8, 6);
    ctx.fillRect(tx + 8,  ty + 22, 16, 3);
  }

  // ── Student desks — row 1 (y = row 5, four desks) ─────────────────────────
  for (const dx of [3, 5, 8, 10]) {
    const tx = dx * TILE, ty = 5 * TILE;
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(tx + 3, ty + 5, 26, 10);
    ctx.fillStyle = '#8a5830';
    ctx.fillRect(tx + 3, ty + 5, 26, 3);
    ctx.fillStyle = '#f0ecdc';
    ctx.fillRect(tx + 5, ty + 7,  8, 6);
  }

  // ── Student desks — row 2 (y = row 8, four desks) ─────────────────────────
  for (const dx of [3, 5, 8, 10]) {
    const tx = dx * TILE, ty = 8 * TILE;
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(tx + 3, ty + 5, 26, 10);
    ctx.fillStyle = '#8a5830';
    ctx.fillRect(tx + 3, ty + 5, 26, 3);
    ctx.fillStyle = '#f0ecdc';
    ctx.fillRect(tx + 5, ty + 7,  8, 6);
  }
}

// ─── Drenwick School Furniture Drawing ───────────────────────────────────────
// Draws furniture for whichever Drenwick school floor is currently active.
// Ground floor: blackboard, wider lectern (slightly bigger than Calwick's),
//   two rows of four student desks at cols 3,5,8,10.
// Upper floor: teacher desk (not lectern — older cohort), same desk rows,
//   Imperial hierarchy chart on north wall, locked document cabinet on west
//   wall (col 2 row 3 is already INTERIOR_WALL so tile blocks passage too),
//   apprenticeship posting board on east wall (visibly sparse — half-empty).
function drawDrenwichSchoolFurniture() {
  if (!inTown || currentTownId !== 'drenwick') return;

  if (activeMap === DRENWICK_SCHOOL_GROUND_MAP) {
    // ── Blackboard (north wall row 1, cols 2–13 — wider than Calwick) ─────────
    {
      const bx = 2 * TILE + 2;
      const by = TILE + 4;
      const bw = 12 * TILE - 4;
      const bh = 22;
      ctx.fillStyle = '#4a2e10';
      ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
      ctx.fillStyle = '#1e3a28';
      ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = 'rgba(240, 240, 220, 0.75)';
      ctx.fillRect(bx + 4,   by + 4,  bw - 8, 1);
      ctx.fillRect(bx + 10,  by + 8,  70, 2);
      ctx.fillRect(bx + 90,  by + 8,  55, 2);
      ctx.fillRect(bx + 155, by + 8,  60, 2);
      ctx.fillRect(bx + 225, by + 8,  50, 2);
      ctx.fillRect(bx + 285, by + 8,  60, 2);
      ctx.fillRect(bx + 10,  by + 14, 50, 2);
      ctx.fillRect(bx + 70,  by + 14, 75, 2);
      ctx.fillRect(bx + 155, by + 14, 40, 2);
      ctx.fillRect(bx + 205, by + 14, 55, 2);
      ctx.fillStyle = '#6a4a20';
      ctx.fillRect(bx - 3, by + bh + 3, bw + 6, 4);
      ctx.fillStyle = 'rgba(240, 240, 220, 0.4)';
      ctx.fillRect(bx, by + bh + 4, bw, 2);
      ctx.fillStyle = '#2a1008';
      ctx.fillRect(bx - 3, by - 3, 4, 4);
      ctx.fillRect(bx + bw - 1, by - 3, 4, 4);
      ctx.fillRect(bx - 3, by + bh - 1, 4, 4);
      ctx.fillRect(bx + bw - 1, by + bh - 1, 4, 4);
    }

    // ── Teacher lectern (col 7, row 3) ─────────────────────────────────────
    // Slightly wider than Calwick's (28px vs 24px) — better resourced school
    {
      const tx = 7 * TILE, ty = 3 * TILE;
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(tx + 2, ty + 4, 28, 14);
      ctx.fillStyle = '#7a5028';
      ctx.fillRect(tx + 2, ty + 4, 28, 4);
      ctx.fillStyle = '#f0ecdc';
      ctx.fillRect(tx + 4, ty + 6, 16, 9);
      ctx.fillStyle = '#3a2010';
      ctx.fillRect(tx + 11, ty + 18, 10, 6);
      ctx.fillRect(tx + 7,  ty + 22, 18, 3);
    }

    // ── Student desks — row 1 (y = row 6, four desks at cols 3,5,8,10) ────
    for (const dx of [3, 5, 8, 10]) {
      const tx = dx * TILE, ty = 6 * TILE;
      ctx.fillStyle = '#6a4020';
      ctx.fillRect(tx + 3, ty + 5, 26, 10);
      ctx.fillStyle = '#8a5830';
      ctx.fillRect(tx + 3, ty + 5, 26, 3);
      ctx.fillStyle = '#f0ecdc';
      ctx.fillRect(tx + 5, ty + 7, 8, 6);
    }

    // ── Student desks — row 2 (y = row 9, four desks at cols 3,5,8,10) ────
    for (const dx of [3, 5, 8, 10]) {
      const tx = dx * TILE, ty = 9 * TILE;
      ctx.fillStyle = '#6a4020';
      ctx.fillRect(tx + 3, ty + 5, 26, 10);
      ctx.fillStyle = '#8a5830';
      ctx.fillRect(tx + 3, ty + 5, 26, 3);
      ctx.fillStyle = '#f0ecdc';
      ctx.fillRect(tx + 5, ty + 7, 8, 6);
    }

    // ── Bookshelf (west wall, col 2, rows 4-5) — holds the Ancient Textbook ───
    // Interaction hotspot is DRENWICK_SCHOOL_GROUND_SHELF (col 2 row 4-5); the
    // player reads it from the adjacent floor. Replaces the old student-desk
    // placement that shadowed drenwick_gs_2.
    {
      const bx = 2 * TILE, by = 4 * TILE, bw = TILE, bh = 2 * TILE;
      // Case back
      ctx.fillStyle = '#3a2412';
      ctx.fillRect(bx + 1, by + 2, bw - 2, bh - 2);
      // Shelf boards (top, middle, bottom)
      ctx.fillStyle = '#5a3a1e';
      ctx.fillRect(bx + 1, by + 2,      bw - 2, 3);
      ctx.fillRect(bx + 1, by + TILE,   bw - 2, 3);
      ctx.fillRect(bx + 1, by + bh - 4, bw - 2, 3);
      // Upright books on the two shelves
      const shelfBooks = ['#7a2c20', '#2a4a6a', '#5a4a1a', '#3a5a30', '#602a4a'];
      for (let shelf = 0; shelf < 2; shelf++) {
        let xo = 4, i = shelf;
        while (xo < bw - 6) {
          const w = 4 + (i % 3);
          ctx.fillStyle = shelfBooks[i % shelfBooks.length];
          ctx.fillRect(bx + xo, by + 7 + shelf * TILE, w, TILE - 12);
          xo += w + 2; i++;
        }
      }
      // The open Ancient Textbook, lying flat on the lower shelf, edges darkened
      ctx.fillStyle = '#d8c8a0';
      ctx.fillRect(bx + 6, by + bh - 9, bw - 12, 4);
      ctx.fillStyle = '#8a6a3a';
      ctx.fillRect(bx + 6, by + bh - 9, bw - 12, 1);
    }

    // ── SPACE hint for the bookshelf ──────────────────────────────────────────
    if (!dialogue.open && !choice.open && !shop.open) {
      const dxh = player.x - DRENWICK_SCHOOL_GROUND_SHELF.x;
      const dyh = player.y - DRENWICK_SCHOOL_GROUND_SHELF.y;
      if (Math.sqrt(dxh * dxh + dyh * dyh) < TALK_RADIUS && (tick >> 4) & 1) {
        ctx.fillStyle = '#d8c878';
        ctx.font = 'bold 11px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SPACE', Math.round(DRENWICK_SCHOOL_GROUND_SHELF.x), Math.round(3.5 * TILE));
        ctx.textAlign = 'left';
      }
    }

  } else if (activeMap === DRENWICK_SCHOOL_UPPER_MAP) {
    // ── Imperial hierarchy chart (north wall row 1, cols 2–9) ─────────────
    // Framed document — horizontal rule lines imply columns of ranked titles.
    // Slightly worn, clearly been here for years (faded frame colour).
    {
      const cx2 = 2 * TILE + 4;
      const cy2 = TILE + 3;
      const cw  = 8 * TILE - 8;
      const ch  = 24;
      // Aged wooden frame (slightly lighter/greyer than blackboard frame)
      ctx.fillStyle = '#7a6040';
      ctx.fillRect(cx2 - 3, cy2 - 3, cw + 6, ch + 6);
      // Parchment background
      ctx.fillStyle = '#e8e0c8';
      ctx.fillRect(cx2, cy2, cw, ch);
      // Title line
      ctx.fillStyle = '#2a2010';
      ctx.font = 'bold 5px "Courier New", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('IMPERIAL ADMINISTRATION', cx2 + 3, cy2 + 7);
      // Hierarchy lines (implied columns of ranked text)
      ctx.fillStyle = 'rgba(42, 32, 16, 0.7)';
      ctx.fillRect(cx2 + 3,  cy2 + 10, 35, 1);
      ctx.fillRect(cx2 + 45, cy2 + 10, 35, 1);
      ctx.fillRect(cx2 + 88, cy2 + 10, 30, 1);
      ctx.fillRect(cx2 + 3,  cy2 + 14, 28, 1);
      ctx.fillRect(cx2 + 38, cy2 + 14, 28, 1);
      ctx.fillRect(cx2 + 73, cy2 + 14, 28, 1);
      ctx.fillRect(cx2 + 3,  cy2 + 18, 20, 1);
      ctx.fillRect(cx2 + 30, cy2 + 18, 20, 1);
      ctx.fillRect(cx2 + 57, cy2 + 18, 20, 1);
      ctx.fillRect(cx2 + 84, cy2 + 18, 20, 1);
      // Corner frame details
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(cx2 - 3, cy2 - 3, 4, 4);
      ctx.fillRect(cx2 + cw - 1, cy2 - 3, 4, 4);
      ctx.fillRect(cx2 - 3, cy2 + ch - 1, 4, 4);
      ctx.fillRect(cx2 + cw - 1, cy2 + ch - 1, 4, 4);
    }

    // ── Teacher desk (col 7, row 3) — desk rather than lectern ────────────
    // Wider flat surface; papers laid out rather than angled for lecturing
    {
      const tx = 7 * TILE, ty = 3 * TILE;
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(tx + 1, ty + 4, 30, 16);
      ctx.fillStyle = '#5a4020';
      ctx.fillRect(tx + 2, ty + 5, 28, 14);
      // Papers and a ledger on the desk
      ctx.fillStyle = '#f0ecdc';
      ctx.fillRect(tx + 3, ty + 6, 12, 10);
      ctx.fillRect(tx + 17, ty + 6, 10, 10);
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(tx + 18, ty + 7, 8, 1);
      ctx.fillRect(tx + 18, ty + 9, 8, 1);
      ctx.fillRect(tx + 18, ty + 11, 5, 1);
    }

    // ── Student desks — row 1 (y = row 6, four desks at cols 3,5,8,10) ────
    for (const dx of [3, 5, 8, 10]) {
      const tx = dx * TILE, ty = 6 * TILE;
      ctx.fillStyle = '#6a4020';
      ctx.fillRect(tx + 3, ty + 5, 26, 10);
      ctx.fillStyle = '#8a5830';
      ctx.fillRect(tx + 3, ty + 5, 26, 3);
      ctx.fillStyle = '#f0ecdc';
      ctx.fillRect(tx + 5, ty + 7, 8, 6);
    }

    // ── Student desks — row 2 (y = row 9, four desks at cols 3,5,8,10) ────
    for (const dx of [3, 5, 8, 10]) {
      const tx = dx * TILE, ty = 9 * TILE;
      ctx.fillStyle = '#6a4020';
      ctx.fillRect(tx + 3, ty + 5, 26, 10);
      ctx.fillStyle = '#8a5830';
      ctx.fillRect(tx + 3, ty + 5, 26, 3);
      ctx.fillStyle = '#f0ecdc';
      ctx.fillRect(tx + 5, ty + 7, 8, 6);
    }

    // ── Document cabinet (west wall, col 2 row 3) ─────────────────────────
    // Drawn at INTERIOR_WALL tile position — tile is already impassable (19).
    // An ordinary school records cabinet of student report cards.
    {
      const cx3 = 2 * TILE, cy3 = 3 * TILE;
      ctx.fillStyle = '#2a2012';
      ctx.fillRect(cx3 + 2,  cy3 + 4,  28, 26);
      ctx.fillStyle = '#3a2c18';
      ctx.fillRect(cx3 + 3,  cy3 + 5,  26, 24);
      // Two drawer divides + small drawer handles
      ctx.fillStyle = '#1e1808';
      ctx.fillRect(cx3 + 3,  cy3 + 13, 26,  1);
      ctx.fillRect(cx3 + 3,  cy3 + 22, 26,  1);
      ctx.fillStyle = '#8a7048';
      ctx.fillRect(cx3 + 14, cy3 + 9,   4,  2);
      ctx.fillRect(cx3 + 14, cy3 + 18,  4,  2);
      ctx.fillRect(cx3 + 14, cy3 + 26,  4,  2);
      // Label
      ctx.fillStyle = '#a09060';
      ctx.font = 'bold 4px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('REPORTS', cx3 + 16, cy3 + 3);
      ctx.textAlign = 'left';
    }

    // ── Apprenticeship posting board (east wall, col 13 rows 4–7) ─────────
    // Cork board with only two or three papers pinned — visibly sparse.
    // Half-empty appearance is intentional: local economy is thin on placements.
    {
      const bx2 = 13 * TILE + 2, by2 = 4 * TILE + 4;
      const bw2 = 24, bh2 = 50;
      // Cork board surface
      ctx.fillStyle = '#a07840';
      ctx.fillRect(bx2, by2, bw2, bh2);
      ctx.fillStyle = '#b08850';
      ctx.fillRect(bx2 + 1, by2 + 1, bw2 - 2, bh2 - 2);
      // Board frame
      ctx.fillStyle = '#5a3810';
      ctx.fillRect(bx2 - 2, by2 - 2, bw2 + 4, 2);
      ctx.fillRect(bx2 - 2, by2 + bh2, bw2 + 4, 2);
      ctx.fillRect(bx2 - 2, by2 - 2, 2, bh2 + 4);
      ctx.fillRect(bx2 + bw2, by2 - 2, 2, bh2 + 4);
      // Two pinned papers (sparse — half-empty board)
      ctx.fillStyle = '#f0ecdc';
      ctx.fillRect(bx2 + 3,  by2 + 5,  16, 14);
      ctx.fillRect(bx2 + 4,  by2 + 25, 15, 12);
      // Pin dots
      ctx.fillStyle = '#c04030';
      ctx.fillRect(bx2 + 10, by2 + 5,  2, 2);
      ctx.fillRect(bx2 + 11, by2 + 25, 2, 2);
      // Implied text lines on papers
      ctx.fillStyle = 'rgba(42,32,16,0.6)';
      ctx.fillRect(bx2 + 4,  by2 + 8,  12, 1);
      ctx.fillRect(bx2 + 4,  by2 + 11, 10, 1);
      ctx.fillRect(bx2 + 4,  by2 + 14, 8,  1);
      ctx.fillRect(bx2 + 5,  by2 + 28, 11, 1);
      ctx.fillRect(bx2 + 5,  by2 + 31, 8,  1);
      // Label
      ctx.fillStyle = '#3a2810';
      ctx.font = 'bold 4px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLACEMENTS', bx2 + 12, by2 - 3);
      ctx.textAlign = 'left';
    }

  } else if (activeMap === DRENWICK_SCHOOL_BASEMENT_MAP) {
    // ── Wall display: Accord of Threads (north wall, cols 3–5, row 1) ────────
    // Framed document under glass; formerly held by the lower bookshelf.
    {
      const dx = 3 * TILE + 4, dy = TILE + 4;
      const dw = 3 * TILE - 8, dh = 22;
      // Glass/metal frame (dark grey)
      ctx.fillStyle = '#303840';
      ctx.fillRect(dx - 3, dy - 3, dw + 6, dh + 6);
      // Glass surface — slightly blue-tinted
      ctx.fillStyle = '#b8c8d4';
      ctx.fillRect(dx, dy, dw, dh);
      // Document behind glass (cream with text lines)
      ctx.fillStyle = '#e8e0c8';
      ctx.fillRect(dx + 3, dy + 2, dw - 6, dh - 4);
      // Simulated text lines
      ctx.fillStyle = 'rgba(30,20,10,0.6)';
      ctx.fillRect(dx + 5, dy + 5,  dw - 12, 2);
      ctx.fillRect(dx + 5, dy + 9,  dw - 10, 1);
      ctx.fillRect(dx + 5, dy + 12, dw - 14, 1);
      ctx.fillRect(dx + 5, dy + 15, dw - 11, 1);
      ctx.fillRect(dx + 5, dy + 18, dw - 13, 1);
      // Imperial seal impression (small red circle, top-right of document)
      ctx.fillStyle = '#8a1818';
      ctx.beginPath();
      ctx.arc(dx + dw - 10, dy + 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c03030';
      ctx.beginPath();
      ctx.arc(dx + dw - 10, dy + 8, 2, 0, Math.PI * 2);
      ctx.fill();
      // Metal corner bolts
      ctx.fillStyle = '#8090a0';
      ctx.fillRect(dx - 3, dy - 3, 4, 4);
      ctx.fillRect(dx + dw - 1, dy - 3, 4, 4);
      ctx.fillRect(dx - 3, dy + dh - 1, 4, 4);
      ctx.fillRect(dx + dw - 1, dy + dh - 1, 4, 4);
      // Label strip below frame
      ctx.fillStyle = '#303840';
      ctx.font = 'bold 5px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ACCORD OF THREADS', dx + Math.floor(dw / 2), dy + dh + 8);
      ctx.textAlign = 'left';
    }

    // ── Bookshelf (north wall row 2, cols 6–10) ─────────────────────────────
    // Tall double-shelf unit; old documents, rolled maps, labelled boxes.
    // No longer holds the Accord — general archive material only.
    {
      const bsx = 6 * TILE + 2;
      const bsy = 2 * TILE + 2;
      const bsw = 5 * TILE - 4;
      const bsh = 22;
      // Back panel
      ctx.fillStyle = '#2e1e0c';
      ctx.fillRect(bsx - 2, bsy - 2, bsw + 4, bsh + 4);
      // Shelf surface (two shelves)
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(bsx, bsy, bsw, bsh);
      // Upper shelf divider
      ctx.fillStyle = '#3a2410';
      ctx.fillRect(bsx, bsy + 10, bsw, 2);
      // Books and document boxes — upper shelf
      const shelfColors = ['#8a3020','#3a5a28','#284870','#7a6820','#5a2a40','#3a3a30'];
      for (let i = 0; i < 9; i++) {
        const bkx = bsx + 3 + i * 8;
        const bkw = i % 3 === 1 ? 5 : 6;
        ctx.fillStyle = shelfColors[i % shelfColors.length];
        ctx.fillRect(bkx, bsy + 1, bkw, 8);
        ctx.fillStyle = 'rgba(255,255,220,0.25)';
        ctx.fillRect(bkx + 1, bsy + 2, 1, 6);
      }
      // Lower shelf — thicker rolled documents and boxes
      ctx.fillStyle = '#d4c4a0';
      ctx.fillRect(bsx + 4,  bsy + 13, 10, 7); // rolled scroll
      ctx.fillRect(bsx + 18, bsy + 13, 10, 7);
      ctx.fillRect(bsx + 32, bsy + 13, 10, 7);
      ctx.fillStyle = '#a09070';
      ctx.fillRect(bsx + 4,  bsy + 13, 10, 2); // top edge
      ctx.fillRect(bsx + 18, bsy + 13, 10, 2);
      ctx.fillRect(bsx + 32, bsy + 13, 10, 2);
      ctx.fillStyle = '#6a4820';
      ctx.fillRect(bsx + 46, bsy + 13, 14, 7); // flat box
      ctx.fillRect(bsx + 62, bsy + 13, 10, 7);
      // Shelf feet
      ctx.fillStyle = '#2a1808';
      ctx.fillRect(bsx,          bsy + bsh, 4, 4);
      ctx.fillRect(bsx + bsw - 4, bsy + bsh, 4, 4);
      // Label
      ctx.fillStyle = '#6a4820';
      ctx.font = 'bold 4px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ARCHIVE', bsx + Math.floor(bsw / 2), bsy - 3);
      ctx.textAlign = 'left';
    }

    // ── Filing cabinets (east wall, cols 11–13 row 4-8) ─────────────────────
    for (let r = 4; r <= 8; r += 2) {
      const fcx = 11 * TILE + 3, fcy = r * TILE + 4;
      ctx.fillStyle = '#384858';
      ctx.fillRect(fcx, fcy, 26, 20);
      ctx.fillStyle = '#2a3848';
      ctx.fillRect(fcx + 1, fcy + 1, 24, 9);
      ctx.fillRect(fcx + 1, fcy + 11, 24, 8);
      ctx.fillStyle = '#a0b0b8';
      ctx.fillRect(fcx + 9, fcy + 5, 8, 2);
      ctx.fillRect(fcx + 9, fcy + 15, 8, 2);
    }

    // ── Low table (center, cols 6-8, row 7) ─────────────────────────────────
    {
      const tx = 6 * TILE + 4, ty = 7 * TILE + 6;
      ctx.fillStyle = '#3a2810';
      ctx.fillRect(tx, ty, 38, 14);
      ctx.fillStyle = '#5a3818';
      ctx.fillRect(tx + 1, ty + 1, 36, 12);
      // Papers on the table
      ctx.fillStyle = '#e8e0c8';
      ctx.fillRect(tx + 4, ty + 3, 12, 8);
      ctx.fillRect(tx + 20, ty + 4, 10, 7);
      ctx.fillStyle = 'rgba(42,32,16,0.5)';
      ctx.fillRect(tx + 5, ty + 5, 8, 1);
      ctx.fillRect(tx + 5, ty + 7, 6, 1);
      ctx.fillRect(tx + 21, ty + 6, 7, 1);
    }
  }
}

// ─── Drenwick Guild Hall furniture ────────────────────────────────────────────
// Canal Engineers' Guild. Draws over the TABLE (33) blockers placed in
// DRENWICK_GUILD_HALL_MAP: the north archive shelf (r1 c1-c5), the posting
// board (r2 c13 — read from GUILD_HALL_BOARD one tile south), the
// registrar's desk (r4 c1-c2, beside Foss), and the long members' table
// (r8 c5-c8, below Cae's dayoff spot).
function drawGuildHallFurniture() {
  if (!inTown || townBuilding !== 'guild_hall') return;

  // ── North archive shelf (r1, c1-c5): ledger spines + rolled drawings ──────
  {
    const sx = 1 * TILE, sy = 1 * TILE;
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(sx + 1, sy + 2, 5 * TILE - 2, TILE - 6);
    ctx.fillStyle = '#2a1608';
    ctx.fillRect(sx + 1, sy + TILE - 6, 5 * TILE - 2, 2);
    // Ledger spines, guild colours faded by damp
    const spines = ['#7a2c20', '#5a5030', '#37507b', '#6a6258', '#7a2c20', '#44603c'];
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = spines[i % spines.length];
      ctx.fillRect(sx + 5 + i * 8, sy + 6, 6, 16);
    }
    // Rolled gate drawings stacked at the right end
    ctx.fillStyle = '#c8b880';
    ctx.fillRect(sx + 5 * TILE - 14, sy + 8, 10, 3);
    ctx.fillRect(sx + 5 * TILE - 12, sy + 13, 10, 3);
    ctx.fillStyle = '#a89860';
    ctx.fillRect(sx + 5 * TILE - 13, sy + 18, 10, 3);
  }

  // ── Posting board (r2, c13): freestanding, papers pinned both tidy and not ─
  {
    const bx = 13 * TILE, by = 2 * TILE;
    // Post legs
    ctx.fillStyle = '#3a2010';
    ctx.fillRect(bx + 6,  by + 22, 4, 8);
    ctx.fillRect(bx + 22, by + 22, 4, 8);
    // Board face + frame
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(bx + 2, by + 2, 28, 22);
    ctx.fillStyle = '#7a5a30';
    ctx.fillRect(bx + 4, by + 4, 24, 18);
    // Members' notices (left, straight) and guild business (right, one askew)
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(bx + 6,  by + 6, 7, 9);
    ctx.fillRect(bx + 6,  by + 16, 7, 4);
    ctx.fillRect(bx + 15, by + 6, 7, 12);
    ctx.save();
    ctx.translate(bx + 26, by + 8);
    ctx.rotate(0.22);
    ctx.fillRect(-3, -2, 6, 8); // the handwritten survey-rod complaint, pinned at an angle
    ctx.restore();
    // Pin dots
    ctx.fillStyle = '#802818';
    ctx.fillRect(bx + 9,  by + 6, 1, 1);
    ctx.fillRect(bx + 18, by + 6, 1, 1);
  }

  // ── Registrar's desk (r4, c1-c2): counter, open dues ledger, inkwell ──────
  {
    const dx = 1 * TILE, dy = 4 * TILE;
    ctx.fillStyle = '#4a2c10';
    ctx.fillRect(dx + 2, dy + 4, 2 * TILE - 4, TILE - 8);
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(dx + 2, dy + 4, 2 * TILE - 4, 4);
    // Open ledger, ruled columns
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(dx + 8, dy + 10, 18, 12);
    ctx.fillStyle = '#8a8268';
    ctx.fillRect(dx + 17, dy + 10, 1, 12);
    for (let r = 0; r < 4; r++) ctx.fillRect(dx + 9, dy + 12 + r * 3, 16, 1);
    // Inkwell
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(dx + 32, dy + 12, 5, 5);
    ctx.fillStyle = '#3a3a48';
    ctx.fillRect(dx + 33, dy + 12, 3, 1);
  }

  // ── Members' table (r8, c5-c8): long table, papers, two abandoned mugs ────
  {
    const tx = 5 * TILE, ty = 8 * TILE;
    ctx.fillStyle = '#4a2c10';
    ctx.fillRect(tx + 2, ty + 4, 4 * TILE - 4, TILE - 8);
    ctx.fillStyle = '#6a4020';
    ctx.fillRect(tx + 2, ty + 4, 4 * TILE - 4, 4);
    ctx.fillStyle = '#3a1e08';
    ctx.fillRect(tx + 2 * TILE - 1, ty + 6, 2, TILE - 12); // joint between the two boards
    // Spread of working papers
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(tx + 10, ty + 10, 14, 10);
    ctx.fillStyle = '#d0c898';
    ctx.save();
    ctx.translate(tx + 30, ty + 15);
    ctx.rotate(-0.15);
    ctx.fillRect(-7, -5, 14, 10);
    ctx.restore();
    // Mugs
    ctx.fillStyle = '#5a5048';
    ctx.fillRect(tx + 3 * TILE + 6, ty + 10, 6, 7);
    ctx.fillRect(tx + 3 * TILE + 12, ty + 12, 2, 3);
    ctx.fillRect(tx + 52, ty + 18, 6, 7);
  }
}
