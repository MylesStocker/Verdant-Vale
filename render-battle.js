'use strict';

// render-battle.js — battle-screen sprite rendering for the player and every
// enemy type, plus drawCombat(), the combat-screen UI (action menu, item
// subscreen, message/victory/defeat overlays).

// ─── Battle: player sprite (right-facing, ~1.5× overworld size) ──────────────
function drawBattlePlayer(cx, cy) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 22, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#384268';
  ctx.fillRect(cx - 8, cy + 6, 16, 14);
  ctx.fillStyle = '#28201a'; // boots
  ctx.fillRect(cx - 9,  cy + 18, 10, 5);
  ctx.fillRect(cx + 2,  cy + 18, 10, 5);

  // Body
  ctx.fillStyle = '#5c7090';
  ctx.fillRect(cx - 12, cy - 10, 24, 19);
  ctx.fillStyle = '#4e6080';
  ctx.fillRect(cx - 12, cy +  4, 24,  6);
  ctx.fillStyle = '#3a2c1c'; // belt
  ctx.fillRect(cx - 12, cy +  6, 24,  4);

  // Back arm (away from enemy)
  ctx.fillStyle = '#5c7090';
  ctx.fillRect(cx - 20, cy - 8, 9, 14);
  ctx.fillStyle = '#a87858';
  ctx.fillRect(cx - 21, cy + 4, 9,  8);

  // Forward arm (toward enemy, slightly raised)
  ctx.fillStyle = '#5c7090';
  ctx.fillRect(cx + 12, cy - 12, 10, 14);
  ctx.fillStyle = '#a87858';
  ctx.fillRect(cx + 17, cy +  0,  8,  8);

  // Head
  ctx.fillStyle = '#a87858';
  ctx.fillRect(cx - 5, cy - 30, 19, 21);
  // Hair
  ctx.fillStyle = '#302418';
  ctx.fillRect(cx - 5, cy - 30, 19,  8); // top
  ctx.fillRect(cx - 7, cy - 30,  4, 16); // back sideburn
  // Eye
  ctx.fillStyle = '#1a1620';
  ctx.fillRect(cx + 7, cy - 19, 3, 3);
}

// ─── Battle: enemy sprites ────────────────────────────────────────────────────

// Marsh Wisp — ethereal floating orb, glowing cyan eye, trailing wisps
function drawBattleWisp(cx, cy) {
  const bob = Math.round(Math.sin(tick * 0.07) * 5);
  const ey  = cy + bob;

  // Glow halo
  ctx.fillStyle = 'rgba(30, 180, 210, 0.09)';
  ctx.beginPath();
  ctx.ellipse(cx, ey, 40, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trailing wisps behind body
  ctx.fillStyle = '#154858';
  ctx.fillRect(cx - 3,  ey + 22, 6,  26);
  ctx.fillRect(cx - 2,  ey + 46, 4,  14);
  ctx.fillStyle = '#1c5e70';
  ctx.fillRect(cx - 20, ey + 8,  6,  20);
  ctx.fillRect(cx - 18, ey + 26, 4,  12);
  ctx.fillRect(cx + 14, ey + 8,  6,  20);
  ctx.fillRect(cx + 14, ey + 26, 4,  12);

  // Orb body
  [
    { dy: -22, w: 14, c: '#186878' },
    { dy: -14, w: 28, c: '#1e9098' },
    { dy:  -6, w: 36, c: '#24a8b8' },
    { dy:   2, w: 36, c: '#1e9098' },
    { dy:  10, w: 26, c: '#186878' },
    { dy:  18, w: 14, c: '#104858' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, ey + dy, w, 8);
  });

  // Inner glow core
  ctx.fillStyle = '#48c8d8';
  ctx.fillRect(cx - 10, ey - 8, 20, 16);
  ctx.fillStyle = '#98eef8';
  ctx.fillRect(cx -  5, ey - 4, 10,  9);

  // Eye
  ctx.fillStyle = '#010a0e';
  ctx.fillRect(cx -  9, ey - 3, 18, 12);
  ctx.fillStyle = '#c8f8ff';
  ctx.fillRect(cx -  7, ey - 1, 14,  8);
  ctx.fillStyle = '#00c0e0';
  ctx.fillRect(cx -  4, ey,      8,  6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx -  2, ey + 1,  3,  3);
}

// Stone Crawler — heavy rock beetle; wide carapace, pincer claws, beady eyes
function drawBattleStoneCrawler(cx, cy) {
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 55, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (3 per side, stubby)
  ctx.fillStyle = '#5e5650';
  ctx.fillRect(cx - 52, cy - 22, 18, 8);   ctx.fillRect(cx - 54, cy - 14, 8, 12);
  ctx.fillRect(cx - 50, cy -  8, 18, 8);   ctx.fillRect(cx - 52, cy,      8, 10);
  ctx.fillRect(cx - 46, cy +  4, 16, 8);
  ctx.fillRect(cx + 34, cy - 22, 18, 8);   ctx.fillRect(cx + 46, cy - 14, 8, 12);
  ctx.fillRect(cx + 32, cy -  8, 18, 8);   ctx.fillRect(cx + 44, cy,      8, 10);
  ctx.fillRect(cx + 30, cy +  4, 16, 8);

  // Shell carapace
  [
    { dy: -52, w: 28,  c: '#505048' },
    { dy: -42, w: 56,  c: '#606058' },
    { dy: -32, w: 78,  c: '#6c6860' },
    { dy: -22, w: 86,  c: '#78746e' },
    { dy: -12, w: 82,  c: '#706c66' },
    { dy:  -2, w: 66,  c: '#605e58' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy + dy, w, 10);
  });

  // Shell crack lines
  ctx.fillStyle = '#484040';
  ctx.fillRect(cx - 12, cy - 48, 4, 24);
  ctx.fillRect(cx +  8, cy - 44, 4, 20);
  ctx.fillRect(cx - 28, cy - 34, 4, 16);
  ctx.fillRect(cx + 24, cy - 34, 4, 14);

  // Shell highlight ridges
  ctx.fillStyle = '#9c9690';
  ctx.fillRect(cx - 22, cy - 46, 16, 4);
  ctx.fillRect(cx +  6, cy - 46, 16, 4);
  ctx.fillRect(cx - 36, cy - 36, 12, 4);

  // Front face / underbelly
  ctx.fillStyle = '#6c6860';
  ctx.fillRect(cx - 34, cy - 20, 68, 22);
  ctx.fillStyle = '#888480';
  ctx.fillRect(cx - 28, cy - 14, 56, 14);

  // Pincers
  ctx.fillStyle = '#565050';
  ctx.fillRect(cx - 58, cy - 16, 26, 10);
  ctx.fillRect(cx - 64, cy - 24, 12, 10);
  ctx.fillRect(cx + 32, cy - 16, 26, 10);
  ctx.fillRect(cx + 52, cy - 24, 12, 10);

  // Eyes
  ctx.fillStyle = '#0a0a08';
  ctx.fillRect(cx - 18, cy - 26, 10, 10);
  ctx.fillRect(cx +  8, cy - 26, 10, 10);
  ctx.fillStyle = '#d0c030';
  ctx.fillRect(cx - 16, cy - 24,  6,  6);
  ctx.fillRect(cx + 10, cy - 24,  6,  6);
  ctx.fillStyle = '#ffff90';
  ctx.fillRect(cx - 15, cy - 23,  3,  3);
  ctx.fillRect(cx + 11, cy - 23,  3,  3);
}

// Briar Hound — thorned wolf; four legs, spine thorns, amber eyes, fangs
function drawBattleBriarHound(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.04) * 1);

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 44, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.fillStyle = '#223a1a';
  ctx.fillRect(cx + 30, cy - 38 + sway, 8, 24);
  ctx.fillRect(cx + 34, cy - 50 + sway, 6, 14);
  ctx.fillStyle = '#385828';
  ctx.fillRect(cx + 36, cy - 56 + sway, 4, 8);

  // Legs (rear pair, front pair)
  ctx.fillStyle = '#1c3216';
  ctx.fillRect(cx + 14, cy - 14, 10, 28);
  ctx.fillRect(cx + 12, cy + 14, 14,  6);
  ctx.fillRect(cx + 26, cy - 10, 10, 24);
  ctx.fillRect(cx + 24, cy + 14, 14,  6);
  ctx.fillRect(cx - 18, cy - 14 + sway, 10, 28);
  ctx.fillRect(cx - 20, cy + 14 + sway, 14,  6);
  ctx.fillRect(cx - 30, cy - 10, 10, 24);
  ctx.fillRect(cx - 32, cy + 14, 14,  6);

  // Body
  [
    { x: cx - 22, dy: -40, w: 50, c: '#263c1c' },
    { x: cx - 26, dy: -32, w: 58, c: '#2e4822' },
    { x: cx - 26, dy: -24, w: 60, c: '#365028' },
    { x: cx - 24, dy: -16, w: 56, c: '#2e4822' },
    { x: cx - 20, dy:  -8, w: 48, c: '#263c1c' },
  ].forEach(({ x, dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, cy + dy, w, 8);
  });

  // Spine thorns
  const thornData = [
    { x: cx - 10, h: 14 }, { x: cx - 2, h: 18 },
    { x: cx +  6, h: 16 }, { x: cx + 14, h: 12 },
    { x: cx + 20, h: 10 },
  ];
  ctx.fillStyle = '#4c6e36';
  thornData.forEach(({ x, h }) => ctx.fillRect(x, cy - 40 - h, 5, h));
  ctx.fillStyle = '#6a9050';
  thornData.forEach(({ x, h }) => ctx.fillRect(x + 1, cy - 40 - h, 3, 4));

  // Neck
  ctx.fillStyle = '#2e4822';
  ctx.fillRect(cx - 32, cy - 44, 22, 14);

  // Head
  ctx.fillStyle = '#263c1c';
  ctx.fillRect(cx - 48, cy - 52, 24, 20);
  // Snout
  ctx.fillStyle = '#1e3018';
  ctx.fillRect(cx - 54, cy - 44, 18, 12);
  ctx.fillStyle = '#0e0c0a';
  ctx.fillRect(cx - 56, cy - 38, 6, 5);

  // Fangs
  ctx.fillStyle = '#e8e0cc';
  ctx.fillRect(cx - 54, cy - 34, 5, 7);
  ctx.fillRect(cx - 46, cy - 34, 4, 6);

  // Ears
  ctx.fillStyle = '#1c3016';
  ctx.fillRect(cx - 48, cy - 62, 7, 12);
  ctx.fillRect(cx - 30, cy - 60, 7, 10);
  ctx.fillStyle = '#385226';
  ctx.fillRect(cx - 46, cy - 66, 4, 6);

  // Eyes (amber)
  ctx.fillStyle = '#0c0c08';
  ctx.fillRect(cx - 46, cy - 50, 9, 8);
  ctx.fillRect(cx - 32, cy - 50, 9, 8);
  ctx.fillStyle = '#c88818';
  ctx.fillRect(cx - 44, cy - 48, 6, 5);
  ctx.fillRect(cx - 30, cy - 48, 6, 5);
  ctx.fillStyle = '#ffe050';
  ctx.fillRect(cx - 43, cy - 47, 3, 3);
  ctx.fillRect(cx - 29, cy - 47, 3, 3);
}

// Bone Guard — armored skeleton warrior; ribcage, pauldrons, great-sword
function drawBattleBoneGuard(cx, cy) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 28, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — bone-white pillars
  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(cx - 20, cy - 30, 14, 34);
  ctx.fillRect(cx +  6, cy - 30, 14, 34);
  // Knee caps
  ctx.fillStyle = '#e0d8c8';
  ctx.fillRect(cx - 22, cy - 12, 18, 8);
  ctx.fillRect(cx +  4, cy - 12, 18, 8);
  // Feet
  ctx.fillStyle = '#a09888';
  ctx.fillRect(cx - 22, cy -  2, 18, 6);
  ctx.fillRect(cx +  4, cy -  2, 18, 6);

  // Pelvis
  ctx.fillStyle = '#d0c8b8';
  ctx.fillRect(cx - 22, cy - 34, 44, 10);

  // Ribcage
  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(cx - 24, cy - 76, 48, 44);
  // Rib lines
  ctx.fillStyle = '#a09888';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(cx - 22, cy - 72 + i * 8, 44, 3);
  }
  // Sternum
  ctx.fillStyle = '#e0d8c8';
  ctx.fillRect(cx -  4, cy - 76, 8, 44);

  // Pauldrons (shoulder armor)
  ctx.fillStyle = '#484040';
  ctx.fillRect(cx - 36, cy - 74, 16, 18);
  ctx.fillRect(cx + 20, cy - 74, 16, 18);
  ctx.fillStyle = '#5e5858';
  ctx.fillRect(cx - 34, cy - 72, 12, 4);
  ctx.fillRect(cx + 22, cy - 72, 12, 4);

  // Arms — bone tubes
  ctx.fillStyle = '#c8c0b0';
  ctx.fillRect(cx - 36, cy - 58, 14, 30);
  ctx.fillRect(cx + 22, cy - 58, 14, 30);
  // Elbow nodes
  ctx.fillStyle = '#e0d8c8';
  ctx.fillRect(cx - 38, cy - 36, 18, 8);
  ctx.fillRect(cx + 20, cy - 36, 18, 8);

  // Great-sword (right side, pointing up)
  ctx.fillStyle = '#888090';
  ctx.fillRect(cx + 36, cy - 100, 8, 80);  // blade
  ctx.fillStyle = '#c0b8cc';
  ctx.fillRect(cx + 37, cy - 100, 6, 4);   // tip
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(cx + 34, cy -  26, 12, 6);  // crossguard
  ctx.fillRect(cx + 37, cy -  20, 6, 16);  // grip
  ctx.fillStyle = '#a07838';
  ctx.fillRect(cx + 36, cy -  4,  8, 6);   // pommel

  // Skull
  ctx.fillStyle = '#e8e0d0';
  ctx.fillRect(cx - 16, cy - 106, 32, 28);
  // Eye sockets (glowing orange)
  ctx.fillStyle = '#0c0a08';
  ctx.fillRect(cx - 14, cy - 100, 10, 10);
  ctx.fillRect(cx +  4, cy - 100, 10, 10);
  ctx.fillStyle = '#e07020';
  ctx.fillRect(cx - 12, cy -  98,  6,  6);
  ctx.fillRect(cx +  6, cy -  98,  6,  6);
  ctx.fillStyle = '#ffe060';
  ctx.fillRect(cx - 11, cy -  97,  3,  3);
  ctx.fillRect(cx +  8, cy -  97,  3,  3);
  // Jaw
  ctx.fillStyle = '#d0c8b8';
  ctx.fillRect(cx - 14, cy -  82, 28, 8);
  ctx.fillStyle = '#e8e0d0';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(cx - 11 + i * 6, cy - 80, 4, 6);  // teeth
  }
}

// Shade Wraith — shadowy spectre; flowing dark form, white hollow eyes, clawed hands
function drawBattleShadeWraith(cx, cy) {
  const pulse = Math.round(Math.sin(tick * 0.08) * 3);
  const drift = Math.round(Math.sin(tick * 0.05) * 4);

  // Outer shadow aura
  ctx.fillStyle = 'rgba(10, 0, 30, 0.20)';
  ctx.beginPath();
  ctx.ellipse(cx + drift, cy - 40, 50 + pulse, 70 + pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // Flowing cloak / body — tattered bottom
  const clkX = cx + drift;
  [
    { dy:  20, w: 14, c: '#0e0818' },
    { dy:  14, w: 18, c: '#120c20' },
    { dy:   6, w: 22, c: '#180e28' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(clkX - w / 2, cy + dy, w, 8);
  });
  // Tattered shreds
  ctx.fillStyle = '#0e0818';
  ctx.fillRect(clkX - 20, cy + 10, 6, 20);
  ctx.fillRect(clkX - 10, cy + 12, 6, 16);
  ctx.fillRect(clkX +  4, cy + 14, 6, 14);
  ctx.fillRect(clkX + 14, cy + 10, 6, 18);

  // Main body pillar
  [
    { dy:  -80, w: 20, c: '#14102a' },
    { dy:  -70, w: 30, c: '#1a1434' },
    { dy:  -60, w: 38, c: '#201840' },
    { dy:  -50, w: 42, c: '#261e4c' },
    { dy:  -40, w: 44, c: '#2c2454' },
    { dy:  -30, w: 42, c: '#261e4c' },
    { dy:  -20, w: 38, c: '#201840' },
    { dy:  -10, w: 30, c: '#1a1434' },
    { dy:    0, w: 22, c: '#14102a' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(clkX - w / 2, cy + dy, w, 10);
  });

  // Clawed arms
  ctx.fillStyle = '#241c3c';
  ctx.fillRect(clkX - 38, cy - 60, 16, 30);
  ctx.fillRect(clkX + 22, cy - 60, 16, 30);
  // Claws (left)
  ctx.fillStyle = '#a090c8';
  ctx.fillRect(clkX - 42, cy - 32,  5, 10);
  ctx.fillRect(clkX - 36, cy - 30,  5, 12);
  ctx.fillRect(clkX - 30, cy - 28,  5, 10);
  // Claws (right)
  ctx.fillRect(clkX + 32, cy - 32,  5, 10);
  ctx.fillRect(clkX + 26, cy - 30,  5, 12);
  ctx.fillRect(clkX + 22, cy - 28,  5, 10);

  // Hood / head
  ctx.fillStyle = '#201840';
  ctx.fillRect(clkX - 20, cy - 98, 40, 22);
  ctx.fillStyle = '#14102a';
  ctx.fillRect(clkX - 18, cy - 92, 36, 16);

  // Eyes — hollow white, then void pupils
  ctx.fillStyle = '#e8e8ff';
  ctx.fillRect(clkX - 14, cy - 88, 10, 10);
  ctx.fillRect(clkX +  4, cy - 88, 10, 10);
  ctx.fillStyle = '#04020a';
  ctx.fillRect(clkX - 12, cy - 86,  6,  6);
  ctx.fillRect(clkX +  6, cy - 86,  6,  6);
  // Purple iris glow
  ctx.fillStyle = `rgba(160,80,255,${0.5 + Math.sin(tick * 0.1) * 0.3})`;
  ctx.fillRect(clkX - 11, cy - 85,  4,  4);
  ctx.fillRect(clkX +  7, cy - 85,  4,  4);
}

// Crypt Fiend — massive hunched brute; rotting dark-green flesh, glowing yellow eyes
function drawBattleCryptFiend(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.035) * 2);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 38, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — stubby and powerful
  ctx.fillStyle = '#1e2810';
  ctx.fillRect(cx - 24, cy - 18, 18, 22);
  ctx.fillRect(cx +  6, cy - 18, 18, 22);
  ctx.fillStyle = '#141c0c';
  ctx.fillRect(cx - 26, cy +  2, 20,  6);
  ctx.fillRect(cx +  6, cy +  2, 20,  6);

  // Body — large hunched mass
  [
    { dy: -60, w: 30, c: '#1e2810' },
    { dy: -52, w: 42, c: '#262e14' },
    { dy: -44, w: 52, c: '#2e3818' },
    { dy: -36, w: 58, c: '#303c1a' },
    { dy: -28, w: 56, c: '#2e3818' },
    { dy: -20, w: 50, c: '#262e14' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy + dy, w, 10);
  });

  // Rot patches (sickly highlights)
  ctx.fillStyle = '#3a4c18';
  ctx.fillRect(cx - 18, cy - 50, 12, 8);
  ctx.fillRect(cx +  8, cy - 38, 10, 6);
  ctx.fillRect(cx - 22, cy - 28,  8, 6);

  // Arms — long, dragging forward
  ctx.fillStyle = '#222c12';
  ctx.fillRect(cx - 46, cy - 50 + sway, 20, 36);
  ctx.fillRect(cx + 26, cy - 48 + sway, 20, 34);
  // Claws
  ctx.fillStyle = '#c8c0a0';
  ctx.fillRect(cx - 52, cy - 16 + sway, 6, 14);
  ctx.fillRect(cx - 46, cy - 14 + sway, 6, 12);
  ctx.fillRect(cx - 40, cy - 12 + sway, 6, 12);
  ctx.fillRect(cx + 46, cy - 16 + sway, 6, 14);
  ctx.fillRect(cx + 40, cy - 14 + sway, 6, 12);
  ctx.fillRect(cx + 34, cy - 12 + sway, 6, 12);

  // Neck / head join
  ctx.fillStyle = '#1e2810';
  ctx.fillRect(cx - 12, cy - 72, 24, 14);

  // Head — wide, low-browed
  ctx.fillStyle = '#262e14';
  ctx.fillRect(cx - 22, cy - 92, 44, 24);
  // Brow ridge
  ctx.fillStyle = '#1a2210';
  ctx.fillRect(cx - 24, cy - 92, 48,  8);
  // Eye sockets
  ctx.fillStyle = '#0a0c04';
  ctx.fillRect(cx - 18, cy - 86, 12, 10);
  ctx.fillRect(cx +  6, cy - 86, 12, 10);
  // Eyes — sickly yellow-green glow
  ctx.fillStyle = '#90a820';
  ctx.fillRect(cx - 16, cy - 84,  8,  6);
  ctx.fillRect(cx +  8, cy - 84,  8,  6);
  ctx.fillStyle = '#d0e040';
  ctx.fillRect(cx - 14, cy - 83,  4,  4);
  ctx.fillRect(cx + 10, cy - 83,  4,  4);
  // Jaw / teeth
  ctx.fillStyle = '#1e2810';
  ctx.fillRect(cx - 18, cy - 74, 36, 8);
  ctx.fillStyle = '#d8d4b8';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(cx - 13 + i * 9, cy - 72, 5, 7);
  }
}

// Void Walker — towering void entity; near-black body with bright violet core
function drawBattleVoidWalker(cx, cy) {
  const pulse = Math.round(Math.sin(tick * 0.09) * 4);
  const drift = Math.round(Math.sin(tick * 0.06) * 5);
  const vx = cx + drift;

  // Outer void aura — larger than Shade Wraith
  ctx.fillStyle = 'rgba(8, 0, 20, 0.25)';
  ctx.beginPath();
  ctx.ellipse(vx, cy - 60, 60 + pulse, 90 + pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // Void tendrils at base (replace tattered cloak)
  const tendrilColors = ['#0c0418', '#100520', '#08031a'];
  [
    { ox: -28, h: 30, c: 0 }, { ox: -16, h: 38, c: 1 },
    { ox:  -6, h: 44, c: 2 }, { ox:   4, h: 40, c: 1 },
    { ox:  14, h: 34, c: 0 }, { ox:  24, h: 28, c: 2 },
  ].forEach(({ ox, h, c }) => {
    ctx.fillStyle = tendrilColors[c];
    ctx.fillRect(vx + ox, cy + 8, 8, h);
    ctx.fillRect(vx + ox + 1, cy + 8 + h, 5, 10);
  });

  // Body pillar — taller and darker than Shade Wraith
  [
    { dy: -110, w: 14, c: '#0c0418' },
    { dy:  -98, w: 22, c: '#100520' },
    { dy:  -86, w: 30, c: '#160828' },
    { dy:  -74, w: 36, c: '#1c0a34' },
    { dy:  -62, w: 40, c: '#220c3e' },
    { dy:  -50, w: 44, c: '#280e48' },
    { dy:  -38, w: 44, c: '#220c3e' },
    { dy:  -26, w: 38, c: '#1c0a34' },
    { dy:  -14, w: 28, c: '#140820' },
    { dy:   -2, w: 18, c: '#0c0418' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(vx - w / 2, cy + dy, w, 12);
  });

  // Void core — bright violet light bleeding through the body
  ctx.fillStyle = `rgba(140, 60, 255, ${0.18 + Math.sin(tick * 0.09) * 0.10})`;
  ctx.beginPath();
  ctx.ellipse(vx, cy - 55, 14, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(200, 120, 255, ${0.12 + Math.sin(tick * 0.13) * 0.08})`;
  ctx.beginPath();
  ctx.ellipse(vx, cy - 55, 7, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Long void arms
  ctx.fillStyle = '#180630';
  ctx.fillRect(vx - 50, cy - 80, 16, 44);
  ctx.fillRect(vx + 34, cy - 78, 16, 42);
  // Void-claw fingers (longer than Shade Wraith)
  ctx.fillStyle = '#c090ff';
  ctx.fillRect(vx - 56, cy - 38,  5, 14);
  ctx.fillRect(vx - 50, cy - 36,  5, 16);
  ctx.fillRect(vx - 44, cy - 34,  5, 14);
  ctx.fillRect(vx + 46, cy - 38,  5, 14);
  ctx.fillRect(vx + 40, cy - 36,  5, 16);
  ctx.fillRect(vx + 36, cy - 34,  5, 14);

  // Head / hood — deeper than Shade Wraith's
  ctx.fillStyle = '#140428';
  ctx.fillRect(vx - 22, cy - 114, 44, 20);
  ctx.fillStyle = '#0c0418';
  ctx.fillRect(vx - 20, cy - 108, 40, 14);
  // Eyes — deep void purple, not white like Shade Wraith
  ctx.fillStyle = '#1c0838';
  ctx.fillRect(vx - 16, cy - 104, 12, 12);
  ctx.fillRect(vx +  4, cy - 104, 12, 12);
  ctx.fillStyle = `rgba(160, 80, 255, ${0.7 + Math.sin(tick * 0.11) * 0.3})`;
  ctx.fillRect(vx - 14, cy - 102,  8,  8);
  ctx.fillRect(vx +  6, cy - 102,  8,  8);
  ctx.fillStyle = '#e0c0ff';
  ctx.fillRect(vx - 12, cy - 100,  4,  4);
  ctx.fillRect(vx +  8, cy - 100,  4,  4);
}

// Wrongteeth — the boss. Squat, wide body, enormous head, 3 rows of teeth,
// one huge red eye / one tiny beady eye, one long arm / one stubby arm.
function drawBattleWrongteeth(cx, cy) {
  const breathe = Math.round(Math.sin(tick * 0.04) * 3);

  // Shadow — wide, off-centre
  ctx.fillStyle = 'rgba(0,0,0,0.50)';
  ctx.beginPath();
  ctx.ellipse(cx - 6, cy + 7, 58, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Long left arm — drags near ground ─────────────────────────────────────
  ctx.fillStyle = '#1a0828';
  ctx.fillRect(cx - 74, cy - 44 + breathe, 22, 54);  // upper arm
  ctx.fillRect(cx - 70, cy +  8 + breathe, 18, 20);  // forearm
  // Four long claws
  ctx.fillStyle = '#c0a8e0';
  ctx.fillRect(cx - 76, cy + 26 + breathe,  5, 20);
  ctx.fillRect(cx - 69, cy + 28 + breathe,  5, 17);
  ctx.fillRect(cx - 62, cy + 27 + breathe,  5, 14);
  ctx.fillRect(cx - 55, cy + 24 + breathe,  5, 11);

  // ── Stubby right arm — barely there ───────────────────────────────────────
  ctx.fillStyle = '#1a0828';
  ctx.fillRect(cx + 44, cy - 28 + breathe, 15, 17);  // upper
  ctx.fillRect(cx + 46, cy - 13 + breathe, 11,  9);  // forearm
  // Three small claws
  ctx.fillStyle = '#c0a8e0';
  ctx.fillRect(cx + 46, cy -  6 + breathe, 3,  8);
  ctx.fillRect(cx + 51, cy -  5 + breathe, 3,  7);
  ctx.fillRect(cx + 56, cy -  5 + breathe, 3,  6);

  // ── Legs — uneven ─────────────────────────────────────────────────────────
  ctx.fillStyle = '#14061c';
  ctx.fillRect(cx - 26, cy - 16, 17, 20);   // left leg (slightly longer)
  ctx.fillRect(cx +  8, cy - 12, 15, 16);   // right leg (shorter)
  ctx.fillStyle = '#0e0414';
  ctx.fillRect(cx - 28, cy +  2, 19,  7);   // left foot
  ctx.fillRect(cx +  6, cy +  2, 17,  6);   // right foot

  // ── Body — wide, squat, dark violet-black ─────────────────────────────────
  [
    { dy: -56, w: 58, c: '#12061e' },
    { dy: -46, w: 76, c: '#180a28' },
    { dy: -36, w: 84, c: '#1c0c2e' },
    { dy: -26, w: 80, c: '#180a28' },
    { dy: -16, w: 62, c: '#12061e' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy + dy, w, 12);
  });
  // Fleshy pustules / texture
  ctx.fillStyle = '#2a1040';
  ctx.fillRect(cx - 26, cy - 52, 10,  7);
  ctx.fillRect(cx + 18, cy - 44, 10,  7);
  ctx.fillRect(cx - 34, cy - 30,  8,  6);

  // ── Head — oversized, shifted left (asymmetry) ────────────────────────────
  const hx = cx - 8;
  [
    { dy: -102, w: 50, c: '#14081e' },
    { dy:  -92, w: 68, c: '#1c0c2c' },
    { dy:  -82, w: 78, c: '#220e34' },
    { dy:  -72, w: 78, c: '#220e34' },
    { dy:  -62, w: 70, c: '#1c0c2c' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(hx - w / 2, cy + dy, w, 12);
  });
  // Asymmetric brow ridge — heavy on left, receding on right
  ctx.fillStyle = '#0c0414';
  ctx.fillRect(hx - 40, cy - 102, 58, 14);   // heavy left brow
  ctx.fillRect(hx + 18, cy -  98, 22,  8);   // lighter right brow

  // ── Mouth / teeth — three rows ────────────────────────────────────────────
  // Dark oral cavity
  ctx.fillStyle = '#04010a';
  ctx.fillRect(hx - 36, cy - 68, 72, 18);
  // Lower jaw base (moves with breathe)
  ctx.fillStyle = '#0c0618';
  ctx.fillRect(hx - 34, cy - 52 + breathe, 68, 10);

  // ROW 3 — back/inner row: dim violet, partially hidden
  ctx.fillStyle = '#3a1850';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(hx - 26 + i * 13, cy - 68,            8,  9);  // upper back
    ctx.fillRect(hx - 23 + i * 13, cy - 51 + breathe,  8,  7);  // lower back
  }

  // ROW 2 — middle row: muted bone-grey
  ctx.fillStyle = '#7a6090';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(hx - 32 + i * 11, cy - 70,            7, 11);  // upper mid
    ctx.fillRect(hx - 30 + i * 11, cy - 50 + breathe,  7,  9);  // lower mid
  }

  // ROW 1 — front row: bright ivory, tallest
  ctx.fillStyle = '#ece4f0';
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(hx - 34 + i * 11, cy - 72,            9, 14);  // upper front
    ctx.fillRect(hx - 32 + i * 11, cy - 49 + breathe,  9, 11);  // lower front
  }
  // One cracked/broken tooth — index 3, upper front
  ctx.fillStyle = '#8a7890';
  ctx.fillRect(hx - 34 + 3 * 11, cy - 72, 9, 7);
  // Gum flash / dark wet interior
  ctx.fillStyle = '#3c0828';
  ctx.fillRect(hx - 36, cy - 58, 72, 8);

  // ── Eyes — dramatically asymmetric ────────────────────────────────────────
  // LARGE left eye
  ctx.fillStyle = '#060208';
  ctx.fillRect(hx - 38, cy - 94, 26, 22);
  // Red iris layers
  ctx.fillStyle = '#8a0012';
  ctx.fillRect(hx - 36, cy - 92, 22, 18);
  ctx.fillStyle = '#c40020';
  ctx.fillRect(hx - 34, cy - 90, 18, 14);
  ctx.fillStyle = '#f01c2c';
  ctx.fillRect(hx - 31, cy - 88, 11,  9);
  // Dark slit pupil (vertical)
  ctx.fillStyle = '#020006';
  ctx.fillRect(hx - 28, cy - 90,  5, 16);
  // Angry red glint (highlight)
  ctx.fillStyle = '#ffc8c8';
  ctx.fillRect(hx - 33, cy - 90,  4,  4);

  // TINY right eye — beady, set wrong (too high, too close to centre)
  ctx.fillStyle = '#060208';
  ctx.fillRect(hx + 18, cy - 88, 13, 13);
  ctx.fillStyle = '#700012';
  ctx.fillRect(hx + 19, cy - 87, 11, 11);
  ctx.fillStyle = '#b00020';
  ctx.fillRect(hx + 20, cy - 86,  7,  7);
  ctx.fillStyle = '#ff1828';
  ctx.fillRect(hx + 21, cy - 85,  4,  4);
  // Tiny glint
  ctx.fillStyle = '#ffc8c8';
  ctx.fillRect(hx + 21, cy - 85,  2,  2);
}

// ─── Briar Warden battle sprite ───────────────────────────────────────────────
// Upright, wide-shouldered fen creature. Deep greens, amber eyes, thorn spines.
function drawBattleBriarWarden(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.04) * 2);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — thick, planted
  ctx.fillStyle = '#1a2c10';
  ctx.fillRect(cx - 22, cy - 16, 14, 38);
  ctx.fillRect(cx +  8, cy - 16, 14, 38);
  ctx.fillStyle = '#0e1808';
  ctx.fillRect(cx - 26, cy + 20, 18,  7);
  ctx.fillRect(cx +  8, cy + 20, 18,  7);

  // Body — wide, squat, hunched
  [
    { dy: -48, w: 54, x: cx - 27, c: '#1e3412' },
    { dy: -40, w: 60, x: cx - 30, c: '#263e1a' },
    { dy: -32, w: 62, x: cx - 31, c: '#2e4820' },
    { dy: -24, w: 60, x: cx - 30, c: '#263e1a' },
    { dy: -16, w: 54, x: cx - 27, c: '#1e3412' },
  ].forEach(({ dy, w, x, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, cy + dy + sway, w, 9);
  });

  // Thorn spines from back — irregular heights
  const wardenThorns = [
    { x: cx - 22, h: 16 }, { x: cx - 12, h: 22 },
    { x: cx -  2, h: 28 }, { x: cx +  8, h: 24 },
    { x: cx + 17, h: 18 }, { x: cx + 24, h: 12 },
  ];
  ctx.fillStyle = '#385c22';
  wardenThorns.forEach(({ x, h }) => ctx.fillRect(x, cy - 48 - h + sway, 6, h));
  ctx.fillStyle = '#5a8838';
  wardenThorns.forEach(({ x, h }) => ctx.fillRect(x + 1, cy - 48 - h + sway, 3, 5));

  // Arms — long, clawed
  ctx.fillStyle = '#1a2c10';
  ctx.fillRect(cx - 46, cy - 46 + sway, 16, 48);
  ctx.fillRect(cx + 30,  cy - 46 + sway, 16, 48);
  // Claws — three per hand
  ctx.fillStyle = '#4c7030';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - 48 + i * 5, cy + 2 + sway,  4, 14);
    ctx.fillRect(cx + 32 + i * 5, cy + 2 + sway,  4, 14);
  }

  // Neck
  ctx.fillStyle = '#263e1a';
  ctx.fillRect(cx - 14, cy - 62 + sway, 28, 18);

  // Head — broad and low
  ctx.fillStyle = '#1e3412';
  ctx.fillRect(cx - 20, cy - 90 + sway, 40, 30);
  // Heavy brow ridge
  ctx.fillStyle = '#0e1808';
  ctx.fillRect(cx - 22, cy - 92 + sway, 44, 8);
  // Snout
  ctx.fillStyle = '#162808';
  ctx.fillRect(cx - 16, cy - 68 + sway, 32, 12);
  // Teeth — small and irregular
  ctx.fillStyle = '#b8b090';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(cx - 14 + i * 6, cy - 70 + sway, 4, 6);
  }
  // Eyes — bright amber-orange
  ctx.fillStyle = '#803400';
  ctx.fillRect(cx - 16, cy - 88 + sway, 11, 11);
  ctx.fillRect(cx +  5, cy - 88 + sway, 11, 11);
  ctx.fillStyle = '#c05000';
  ctx.fillRect(cx - 14, cy - 86 + sway,  7,  7);
  ctx.fillRect(cx +  7, cy - 86 + sway,  7,  7);
  ctx.fillStyle = '#e87820';
  ctx.fillRect(cx - 13, cy - 85 + sway,  4,  4);
  ctx.fillRect(cx +  8, cy - 85 + sway,  4,  4);
}

// Reed Grappler — wide armoured crustacean; eye stalks, heavy pincers, muddy shell
function drawBattleReedGrappler(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.04) * 2);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 50, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Walking legs (thin, jointed)
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(cx - 30, cy - 16 + sway,  4, 20);
  ctx.fillRect(cx - 38, cy - 20 + sway,  4, 22);
  ctx.fillRect(cx - 44, cy - 12 + sway,  4, 15);
  ctx.fillRect(cx + 26, cy - 16 + sway,  4, 20);
  ctx.fillRect(cx + 34, cy - 20 + sway,  4, 22);
  ctx.fillRect(cx + 40, cy - 12 + sway,  4, 15);

  // Carapace body — wide oval dome
  [
    { dy: -50, w: 26, c: '#4e3818' },
    { dy: -42, w: 42, c: '#6e5228' },
    { dy: -34, w: 52, c: '#836030' },
    { dy: -26, w: 56, c: '#906838' },
    { dy: -18, w: 52, c: '#846030' },
    { dy: -10, w: 42, c: '#6e5228' },
    { dy:  -2, w: 28, c: '#503a1c' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy + dy + sway, w, 9);
  });

  // Shell highlight (top-left sheen)
  ctx.fillStyle = '#c09858';
  ctx.fillRect(cx - 20, cy - 46 + sway, 16,  5);
  ctx.fillRect(cx - 16, cy - 52 + sway, 10,  4);

  // Left claw arm
  ctx.fillStyle = '#6a4828';
  ctx.fillRect(cx - 54, cy - 38 + sway, 30, 10);
  ctx.fillStyle = '#7a5630';
  ctx.fillRect(cx - 62, cy - 30 + sway, 14,  8);
  // Left pincer blades
  ctx.fillStyle = '#402810';
  ctx.fillRect(cx - 70, cy - 44 + sway, 10, 16);
  ctx.fillRect(cx - 70, cy - 28 + sway, 10, 10);

  // Right claw arm
  ctx.fillStyle = '#6a4828';
  ctx.fillRect(cx + 24, cy - 38 + sway, 30, 10);
  ctx.fillStyle = '#7a5630';
  ctx.fillRect(cx + 48, cy - 30 + sway, 14,  8);
  // Right pincer blades
  ctx.fillStyle = '#402810';
  ctx.fillRect(cx + 60, cy - 44 + sway, 10, 16);
  ctx.fillRect(cx + 60, cy - 28 + sway, 10, 10);

  // Head section (front of carapace)
  ctx.fillStyle = '#7a5a2e';
  ctx.fillRect(cx - 18, cy - 60 + sway, 36, 12);

  // Eye stalks
  ctx.fillStyle = '#5a4020';
  ctx.fillRect(cx - 16, cy - 72 + sway,  5, 14);
  ctx.fillRect(cx + 11, cy - 72 + sway,  5, 14);
  // Eyes — red, glowing
  ctx.fillStyle = '#d81818';
  ctx.fillRect(cx - 17, cy - 76 + sway,  9,  7);
  ctx.fillRect(cx + 10, cy - 76 + sway,  9,  7);
  ctx.fillStyle = `rgba(255,80,60,${0.6 + Math.sin(tick * 0.07) * 0.2})`;
  ctx.fillRect(cx - 15, cy - 75 + sway,  6,  5);
  ctx.fillRect(cx + 11, cy - 75 + sway,  6,  5);
}

// Silt Lurker — sinuous eel-like predator; coiled body, wide maw, yellow slit eyes
function drawBattleSiltLurker(cx, cy) {
  const wave = Math.round(Math.sin(tick * 0.065) * 4);

  // Depth aura at base
  ctx.fillStyle = 'rgba(10,20,30,0.20)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail coil — low to ground, thick rings
  ctx.fillStyle = '#1c2830';
  ctx.fillRect(cx - 22, cy -  8, 44, 16);
  ctx.fillStyle = '#253240';
  ctx.fillRect(cx - 16, cy - 18, 32, 12);

  // Lower body pillar
  ctx.fillStyle = '#2a3c4a';
  ctx.fillRect(cx - 13, cy - 38, 26, 22);

  // Mid-body, slightly offset (S-curve begins)
  ctx.fillStyle = '#324858';
  ctx.fillRect(cx - 6 + wave, cy - 60, 22, 24);

  // Iridescent lateral stripe (mid body)
  ctx.fillStyle = '#3e6070';
  ctx.fillRect(cx - 2,        cy - 36,  8, 14);
  ctx.fillRect(cx + wave,     cy - 58,  6, 10);

  // Upper body — curves back opposite way
  ctx.fillStyle = '#2c4252';
  ctx.fillRect(cx - 10 - wave / 2, cy - 82, 20, 24);

  // Neck taper
  ctx.fillStyle = '#28404e';
  ctx.fillRect(cx - 8 - wave / 2, cy - 100, 16, 20);

  // Head — broad flat jaw
  ctx.fillStyle = '#1e2e3c';
  ctx.fillRect(cx - 24 - wave / 2, cy - 118, 48, 20);
  ctx.fillStyle = '#253848';
  ctx.fillRect(cx - 20 - wave / 2, cy - 132, 40, 16);

  // Jaw line / mouth slot
  ctx.fillStyle = '#141c24';
  ctx.fillRect(cx - 22 - wave / 2, cy - 112, 44,  6);
  // Teeth
  ctx.fillStyle = '#c8d4c8';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(cx - 18 - wave / 2 + i * 7, cy - 112, 4, 5);
  }

  // Eyes — yellow, slit pupils
  ctx.fillStyle = '#d8d800';
  ctx.fillRect(cx - 17 - wave / 2, cy - 130, 10,  8);
  ctx.fillRect(cx +  7 - wave / 2, cy - 130, 10,  8);
  ctx.fillStyle = '#101408';
  ctx.fillRect(cx - 13 - wave / 2, cy - 128,  4,  5);
  ctx.fillRect(cx + 10 - wave / 2, cy - 128,  4,  5);
  // Eye glow
  ctx.fillStyle = `rgba(210,210,0,${0.45 + Math.sin(tick * 0.09) * 0.25})`;
  ctx.fillRect(cx - 16 - wave / 2, cy - 130,  8,  7);
  ctx.fillRect(cx +  8 - wave / 2, cy - 130,  8,  7);
}

function drawBattleMulholland(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.04) * 3);

  // Ground shadow — wider than it should be
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 44, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lower body — bloated, asymmetric
  ctx.fillStyle = '#1e1208';
  ctx.fillRect(cx - 32 + sway, cy - 28, 62, 32);
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(cx - 28 + sway, cy - 32, 54, 12);

  // Pustule clusters — asymmetrically placed
  ctx.fillStyle = '#3a2808';
  ctx.beginPath(); ctx.ellipse(cx - 18 + sway, cy - 18, 8, 6, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 22 + sway,  cy - 8, 6, 5, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx +  5 + sway, cy - 26, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
  // Pustule highlights
  ctx.fillStyle = '#4a3412';
  ctx.fillRect(cx - 22 + sway, cy - 22, 4, 3);
  ctx.fillRect(cx + 20 + sway, cy - 11, 3, 3);

  // Torso — too short, wrong shape
  ctx.fillStyle = '#160e04';
  ctx.fillRect(cx - 18 + sway, cy - 68, 34, 38);
  ctx.fillStyle = '#1e1208';
  ctx.fillRect(cx - 14 + sway, cy - 74, 26, 10);

  // Arms — different lengths; one elbow bends the wrong way
  ctx.fillStyle = '#1a0e06';
  ctx.fillRect(cx - 42 + sway, cy - 62, 24, 8);   // left arm — too long
  ctx.fillRect(cx - 42 + sway, cy - 54, 8,  18);  // left forearm — drooping wrong
  ctx.fillRect(cx + 20 + sway, cy - 60, 18, 8);   // right arm — shorter
  ctx.fillRect(cx + 30 + sway, cy - 64, 8,  12);  // right forearm — angles up oddly

  // Neck — too thin, slightly off-center
  ctx.fillStyle = '#120a04';
  ctx.fillRect(cx - 6 + sway + 4, cy - 86, 10, 16);

  // Head — wrong proportions, too flat, too wide
  ctx.fillStyle = '#1a1008';
  ctx.fillRect(cx - 28 + sway, cy - 108, 54, 24);
  ctx.fillStyle = '#221408';
  ctx.fillRect(cx - 22 + sway, cy - 118, 42, 14);

  // Eyes — three of them; one where it shouldn't be
  // Main left eye — large, bloodshot-pale
  ctx.fillStyle = '#e8d8b8';
  ctx.fillRect(cx - 20 + sway, cy - 114, 12, 9);
  ctx.fillStyle = '#8a0808';
  ctx.fillRect(cx - 16 + sway, cy - 112,  5, 5);
  // Main right eye — smaller, sunken
  ctx.fillStyle = '#c8b898';
  ctx.fillRect(cx +  6 + sway, cy - 112,  9, 7);
  ctx.fillStyle = '#6a0606';
  ctx.fillRect(cx +  9 + sway, cy - 111,  4, 4);
  // Third eye — wrong position, between and below
  ctx.fillStyle = '#d0c080';
  ctx.fillRect(cx -  2 + sway, cy - 101,  7, 6);
  ctx.fillStyle = '#503000';
  ctx.fillRect(cx +  0 + sway, cy -  99,  3, 3);

  // Mouth — too wide, uneven
  ctx.fillStyle = '#0a0604';
  ctx.fillRect(cx - 24 + sway, cy -  91, 46, 5);
  ctx.fillStyle = '#d8c8a8';
  for (let i = 0; i < 7; i++) {
    if (i === 2 || i === 5) continue;  // gaps in the teeth
    ctx.fillRect(cx - 22 + sway + i * 6, cy - 91, 4, 4);
  }

  // Ambient glow — sickly, brownish
  ctx.fillStyle = `rgba(60,30,10,${0.25 + Math.sin(tick * 0.06) * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(cx + sway, cy - 60, 50, 70, 0, 0, Math.PI * 2);
  ctx.fill();
}

// Corpse Slug — enormous pale slug; low to the ground, bloated, slick with rot-smell mucus
function drawBattleCorpseSlug(cx, cy) {
  const pulse = Math.round(Math.sin(tick * 0.03) * 2);

  // Mucus trail — wide, semi-transparent, spreading behind the body
  ctx.fillStyle = 'rgba(160, 180, 100, 0.22)';
  ctx.beginPath(); ctx.ellipse(cx + 30, cy + 4, 48, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(140, 160, 80, 0.15)';
  ctx.beginPath(); ctx.ellipse(cx + 50, cy + 6, 28, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Body shadow
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 6, 60, 12, 0, 0, Math.PI * 2); ctx.fill();

  // Tail taper — pale, streaked grey
  ctx.fillStyle = '#b0b89a';
  ctx.fillRect(cx + 28, cy - 8, 34, 18);
  ctx.fillStyle = '#c4ccaa';
  ctx.fillRect(cx + 36, cy - 4, 22, 10);

  // Lower body — main mass, swollen and uneven
  ctx.fillStyle = '#c8cdb0';
  ctx.fillRect(cx - 20, cy - 22, 56, 30);
  ctx.fillStyle = '#d4d9bc';
  ctx.fillRect(cx - 24, cy - 14, 52, 18);
  // Corpse blotches — dark rot patches on the skin
  ctx.fillStyle = '#8a9070';
  ctx.fillRect(cx +  4, cy - 18, 14,  8);
  ctx.fillRect(cx - 14, cy -  6, 10,  6);
  ctx.fillRect(cx + 20, cy -  4, 12,  5);
  ctx.fillStyle = '#707860';
  ctx.fillRect(cx +  6, cy - 16, 8,  5);

  // Upper body — neck hump, slight pulse
  ctx.fillStyle = '#bfc6a6';
  ctx.fillRect(cx - 36, cy - 38 - pulse, 52, 22);
  ctx.fillStyle = '#cad1b0';
  ctx.fillRect(cx - 32, cy - 44 - pulse, 44, 12);

  // Head — flat, wide, slightly raised
  ctx.fillStyle = '#b8bfa0';
  ctx.fillRect(cx - 48, cy - 50 - pulse, 52, 24);
  ctx.fillStyle = '#c8cfa8';
  ctx.fillRect(cx - 44, cy - 58 - pulse, 44, 12);

  // Mouth — horizontal slit, slightly open
  ctx.fillStyle = '#3a3020';
  ctx.fillRect(cx - 40, cy - 44 - pulse, 46, 5);
  // Mouth mucus gleam
  ctx.fillStyle = 'rgba(180,190,120,0.4)';
  ctx.fillRect(cx - 38, cy - 43 - pulse, 42, 2);

  // Eye stalks — two thin protrusions, angled outward
  ctx.fillStyle = '#a0a888';
  ctx.fillRect(cx - 38, cy - 72 - pulse,  5, 18);  // left stalk
  ctx.fillRect(cx - 16, cy - 68 - pulse,  5, 14);  // right stalk
  // Eyes — dark, wet
  ctx.fillStyle = '#181808';
  ctx.fillRect(cx - 40, cy - 78 - pulse,  9,  8);  // left eye
  ctx.fillRect(cx - 18, cy - 74 - pulse,  9,  8);  // right eye
  // Eye gloss
  ctx.fillStyle = 'rgba(220,230,180,0.55)';
  ctx.fillRect(cx - 39, cy - 77 - pulse,  4,  3);
  ctx.fillRect(cx - 17, cy - 73 - pulse,  4,  3);

  // Slime sheen over body
  ctx.fillStyle = `rgba(170,185,110,${0.12 + Math.sin(tick * 0.05) * 0.06})`;
  ctx.beginPath(); ctx.ellipse(cx - 8, cy - 24 - pulse / 2, 56, 34, 0, 0, Math.PI * 2); ctx.fill();
}

// ─── Rotwood Troll battle sprite (FAR_ENEMY_TEMPLATES) ────────────────────────
// Regenerating swamp brute — very high HP, slow, hits hard. Bark-fused hide,
// hunched knuckle-dragging posture, dim regenerating glow on a wound patch.
function drawBattleRotwoodTroll(cx, cy) {
  const breathe = Math.round(Math.sin(tick * 0.025) * 2); // slow, heavy breathing
  const regen   = 0.15 + Math.sin(tick * 0.05) * 0.10;    // pulsing regen glow

  // Ground shadow — big and heavy
  ctx.fillStyle = 'rgba(0,0,0,0.34)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 46, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — thick, stumpy, planted wide
  ctx.fillStyle = '#3a3222';
  ctx.fillRect(cx - 30, cy - 20, 18, 26);
  ctx.fillRect(cx + 12, cy - 20, 18, 26);
  ctx.fillStyle = '#2c2618';
  ctx.fillRect(cx - 32, cy + 2, 22, 8);   // left foot
  ctx.fillRect(cx + 10, cy + 2, 22, 8);   // right foot

  // Lower body — hunched mass, bark-mottled
  ctx.fillStyle = '#465030';
  ctx.fillRect(cx - 34, cy - 46 + breathe, 68, 32);
  ctx.fillStyle = '#526038';
  ctx.fillRect(cx - 30, cy - 40 + breathe, 60, 20);
  // Bark patches — rough brown plates fused into the hide
  ctx.fillStyle = '#4a3a22';
  ctx.fillRect(cx - 26, cy - 38 + breathe, 16, 12);
  ctx.fillRect(cx + 2,  cy - 30 + breathe, 20, 10);
  ctx.fillRect(cx - 6,  cy - 44 + breathe, 12, 8);
  ctx.fillStyle = '#3a2c18';
  ctx.fillRect(cx - 22, cy - 34 + breathe, 8, 5);
  ctx.fillRect(cx + 8,  cy - 26 + breathe, 8, 4);

  // Regenerating wound — faint pulsing moss-green glow, low on the torso
  ctx.fillStyle = `rgba(140,200,60,${regen})`;
  ctx.beginPath();
  ctx.ellipse(cx - 10, cy - 24 + breathe, 12, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders — broad, uneven
  ctx.fillStyle = '#3e4628';
  ctx.fillRect(cx - 44, cy - 58 + breathe, 24, 20);  // left shoulder
  ctx.fillRect(cx + 20, cy - 56 + breathe, 24, 18);  // right shoulder

  // Long dangling arms — knuckle-dragging
  ctx.fillStyle = '#3a4224';
  ctx.fillRect(cx - 46, cy - 42 + breathe, 12, 40);  // left upper arm
  ctx.fillRect(cx - 50, cy - 4,  16, 14);            // left forearm/fist, reaching low
  ctx.fillRect(cx + 34, cy - 40 + breathe, 12, 36);  // right upper arm
  ctx.fillRect(cx + 32, cy - 6,  16, 14);            // right forearm/fist
  ctx.fillStyle = '#2e3420';
  ctx.fillRect(cx - 50, cy + 6,  16, 6);   // left knuckles
  ctx.fillRect(cx + 32, cy + 4,  16, 6);   // right knuckles

  // Neck / head — small relative to the body, heavy sunken brow
  ctx.fillStyle = '#3e4626';
  ctx.fillRect(cx - 16, cy - 76 + breathe, 32, 22);
  ctx.fillStyle = '#343c20';
  ctx.fillRect(cx - 14, cy - 70 + breathe, 12, 10);  // brow shadow left
  ctx.fillRect(cx +  2, cy - 70 + breathe, 12, 10);  // brow shadow right

  // Jaw — jutting, uneven tusks
  ctx.fillStyle = '#2c3218';
  ctx.fillRect(cx - 12, cy - 58 + breathe, 24, 10);
  ctx.fillStyle = '#c8bc94';
  ctx.fillRect(cx - 10, cy - 54 + breathe, 4, 8);
  ctx.fillRect(cx +  6, cy - 54 + breathe, 4, 8);

  // Eyes — dim, ancient, faintly luminous
  const eyeGlow = 0.45 + Math.sin(tick * 0.04) * 0.15;
  ctx.fillStyle = `rgba(200,210,120,${eyeGlow})`;
  ctx.fillRect(cx - 10, cy - 68 + breathe, 6, 5);
  ctx.fillRect(cx +  4, cy - 68 + breathe, 6, 5);
  ctx.fillStyle = '#0c0e06';
  ctx.fillRect(cx -  9, cy - 67 + breathe, 3, 3);
  ctx.fillRect(cx +  5, cy - 67 + breathe, 3, 3);
}

// ─── Bog Serpent battle sprite (FAR_ENEMY_TEMPLATES) ──────────────────────────
// Massive wetland snake — high HP, good speed, surfaces to strike then sinks
// back under the mud between fights. Long sinuous body, half-submerged base.
function drawBattleBogSerpent(cx, cy) {
  const undulate = (i) => Math.round(Math.sin(tick * 0.07 + i * 0.9) * 6);
  const flick    = Math.round(Math.sin(tick * 0.12) * 3); // tongue flick

  // Mud/water the serpent is rising out of
  ctx.fillStyle = 'rgba(70,60,30,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 14, 56, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(90,110,60,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx + 10, cy + 12, 40, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body — S-curved chain of segments, each offset by its own undulation
  const segments = [
    { dx:  34, dy:   6, w: 20, h: 16 },
    { dx:  18, dy:  -6, w: 22, h: 18 },
    { dx:   0, dy: -16, w: 24, h: 20 },
    { dx: -18, dy: -22, w: 24, h: 20 },
    { dx: -34, dy: -30, w: 22, h: 18 },
  ];
  segments.forEach((s, i) => {
    const sway = undulate(i);
    ctx.fillStyle = i % 2 === 0 ? '#3a5028' : '#324622';
    ctx.fillRect(cx + s.dx - s.w / 2, cy + s.dy + sway - s.h / 2, s.w, s.h);
  });
  // Belly highlight along the underside of the curve
  segments.forEach((s, i) => {
    const sway = undulate(i);
    ctx.fillStyle = '#4a6836';
    ctx.fillRect(cx + s.dx - s.w / 2 + 3, cy + s.dy + sway + s.h / 2 - 6, s.w - 6, 5);
  });
  // Dark diamond scale markings down the spine
  ctx.fillStyle = '#20300f';
  segments.forEach((s, i) => {
    const sway = undulate(i);
    ctx.fillRect(cx + s.dx - 4, cy + s.dy + sway - s.h / 2 + 3, 8, 6);
  });

  // Head — flattened, wide behind the jaw, at the near (front) end of the chain
  const headSway = undulate(segments.length);
  const headX = cx + 34 + 20;
  const headY = cy + 6 + headSway;
  ctx.fillStyle = '#3a5028';
  ctx.fillRect(headX - 6, headY - 10, 26, 20);
  ctx.fillStyle = '#2c4020';
  ctx.fillRect(headX - 8, headY - 6, 10, 12);  // brow ridge

  // Fangs
  ctx.fillStyle = '#e8e2c8';
  ctx.fillRect(headX + 14, headY + 6, 4, 8);
  ctx.fillRect(headX + 18, headY + 4, 4, 7);

  // Forked tongue flick
  ctx.strokeStyle = 'rgba(200,80,90,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(headX + 22, headY);
  ctx.lineTo(headX + 30 + flick, headY - 3);
  ctx.moveTo(headX + 22, headY);
  ctx.lineTo(headX + 30 + flick, headY + 3);
  ctx.stroke();

  // Eyes — narrow, reptilian
  ctx.fillStyle = '#e8d840';
  ctx.fillRect(headX - 4, headY - 4, 5, 4);
  ctx.fillRect(headX + 6, headY - 6, 5, 4);
  ctx.fillStyle = '#100c04';
  ctx.fillRect(headX - 2, headY - 3, 2, 3);
  ctx.fillRect(headX + 8, headY - 5, 2, 3);
}

// ─── Fen Lurker battle sprite (FAR_ENEMY_TEMPLATES) ───────────────────────────
// Ambush predator — high speed, solid attack, moderate HP. Hunts by
// stillness first, then a sudden pounce. Reed-camouflaged, coiled low,
// built to spring.
function drawBattleFenLurker(cx, cy) {
  const twitch = Math.round(Math.sin(tick * 0.09) * 1); // alert, restless

  // Ground shadow — low and wide (crouched stance)
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 36, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Reed camouflage fronds behind it — it's still half-hidden in them
  ctx.fillStyle = 'rgba(80,110,50,0.35)';
  ctx.fillRect(cx - 40, cy - 30, 4, 34);
  ctx.fillRect(cx - 32, cy - 36, 3, 40);
  ctx.fillRect(cx + 30, cy - 32, 4, 36);
  ctx.fillRect(cx + 38, cy - 26, 3, 30);

  // Hind legs — coiled, powerful, ready to spring
  ctx.fillStyle = '#33421e';
  ctx.fillRect(cx + 10, cy - 24, 16, 14);
  ctx.fillRect(cx + 16, cy - 12, 10, 18);
  ctx.fillStyle = '#28351a';
  ctx.fillRect(cx + 14, cy + 2, 14, 6);   // rear foot, planted
  // Front legs — low, close together
  ctx.fillStyle = '#3a4a24';
  ctx.fillRect(cx - 20, cy - 14, 8, 18);
  ctx.fillRect(cx - 22, cy + 2,  12, 6);

  // Body — low, sleek, mottled marsh camouflage
  ctx.fillStyle = '#3c4d26';
  ctx.fillRect(cx - 26, cy - 26, 44, 18);
  ctx.fillStyle = '#48602e';
  ctx.fillRect(cx - 22, cy - 22, 36, 10);
  // Camouflage blotches
  ctx.fillStyle = '#2a3818';
  ctx.fillRect(cx - 18, cy - 24, 8, 6);
  ctx.fillRect(cx - 2,  cy - 18, 10, 5);
  ctx.fillRect(cx + 10, cy - 24, 7, 5);
  ctx.fillStyle = '#5a7238';
  ctx.fillRect(cx - 8, cy - 22, 6, 4);

  // Neck, low and stretched forward
  ctx.fillStyle = '#37461f';
  ctx.fillRect(cx - 38, cy - 24, 16, 12);

  // Head — flattened, forward-facing eyes for ambush hunting
  ctx.fillStyle = '#33421d';
  ctx.fillRect(cx - 52, cy - 26, 18, 14);
  ctx.fillStyle = '#28351a';
  ctx.fillRect(cx - 56, cy - 20, 8, 8);  // snout

  // Eyes — large, alert, forward-facing
  const alert = 0.6 + Math.sin(tick * 0.1) * 0.2;
  ctx.fillStyle = `rgba(220,210,60,${alert})`;
  ctx.fillRect(cx - 46 + twitch, cy - 24, 6, 5);
  ctx.fillRect(cx - 36 + twitch, cy - 24, 6, 5);
  ctx.fillStyle = '#0a0c04';
  ctx.fillRect(cx - 44 + twitch, cy - 22, 2, 3);
  ctx.fillRect(cx - 34 + twitch, cy - 22, 2, 3);

  // Low ridge of dorsal spikes — small, functional not decorative
  ctx.fillStyle = '#243014';
  [cx - 14, cx - 4, cx + 6].forEach(x => ctx.fillRect(x, cy - 30, 4, 6));
}

// ─── Thornback battle sprite (FAR_ENEMY_TEMPLATES) ────────────────────────────
// Armored bog beast — very high defense, moderate attack, slow. Squat,
// heavily plated, low centre of gravity built to brace and absorb hits.
// The dorsal spines are load-bearing weapons, not display.
function drawBattleThornback(cx, cy) {
  const settle = Math.round(Math.sin(tick * 0.02) * 1); // barely moves

  // Ground shadow — heavy and wide
  ctx.fillStyle = 'rgba(0,0,0,0.36)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — four short, thick, planted wide
  ctx.fillStyle = '#4a4432';
  ctx.fillRect(cx - 30, cy - 14, 12, 20);
  ctx.fillRect(cx - 12, cy - 10, 11, 18);
  ctx.fillRect(cx + 2,  cy - 10, 11, 18);
  ctx.fillRect(cx + 18, cy - 14, 12, 20);
  ctx.fillStyle = '#38341f';
  ctx.fillRect(cx - 32, cy + 4, 15, 6);
  ctx.fillRect(cx + 17, cy + 4, 15, 6);

  // Shell — broad, domed, layered armor plating
  ctx.fillStyle = '#5c5638';
  ctx.fillRect(cx - 38, cy - 40 + settle, 76, 26);
  ctx.fillStyle = '#6c6644';
  ctx.fillRect(cx - 32, cy - 46 + settle, 64, 16);
  ctx.fillStyle = '#4c4830';
  ctx.fillRect(cx - 26, cy - 50 + settle, 52, 10);

  // Plate seams
  ctx.fillStyle = '#3a3622';
  ctx.fillRect(cx - 14, cy - 44 + settle, 3, 24);
  ctx.fillRect(cx + 12, cy - 44 + settle, 3, 24);

  // Dorsal spines — the load-bearing weapon row, largest at centre
  const spineHeights = [10, 16, 22, 18, 12];
  ctx.fillStyle = '#7a7250';
  spineHeights.forEach((h, i) => {
    const x = cx - 24 + i * 12;
    ctx.beginPath();
    ctx.moveTo(x - 5, cy - 50 + settle);
    ctx.lineTo(x + 5, cy - 50 + settle);
    ctx.lineTo(x, cy - 50 - h + settle);
    ctx.closePath();
    ctx.fill();
  });
  ctx.fillStyle = '#9a9268';
  spineHeights.forEach((h, i) => {
    const x = cx - 24 + i * 12;
    ctx.fillRect(x - 1, cy - 50 - h + settle, 2, Math.floor(h * 0.4));
  });

  // Head — low, tucked, thick plating
  ctx.fillStyle = '#5c5638';
  ctx.fillRect(cx - 52, cy - 30 + settle, 20, 16);
  ctx.fillStyle = '#4c4830';
  ctx.fillRect(cx - 56, cy - 24 + settle, 8, 8);  // snout, blunt

  // Eyes — small, deep-set
  ctx.fillStyle = '#1c1a10';
  ctx.fillRect(cx - 46, cy - 26 + settle, 4, 4);
  ctx.fillRect(cx - 38, cy - 26 + settle, 4, 4);
  ctx.fillStyle = 'rgba(160,150,90,0.6)';
  ctx.fillRect(cx - 45, cy - 25 + settle, 2, 2);
  ctx.fillRect(cx - 37, cy - 25 + settle, 2, 2);
}

// ─── North Basin — Silt Flats battle sprites (NORTH_BASIN_ENEMY_TEMPLATES) ────
// Silt Crab — small shelled crustacean stranded by the retreating waterline;
// wetter and muddier than Stone Crawler, and noticeably smaller/lower.
function drawBattleSiltCrab(cx, cy) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 38, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (2 per side, short, still dripping wet mud)
  ctx.fillStyle = '#4a4438';
  ctx.fillRect(cx - 36, cy - 12, 14, 7);  ctx.fillRect(cx - 38, cy - 4, 8, 9);
  ctx.fillRect(cx - 32, cy + 2,  12, 7);
  ctx.fillRect(cx + 22, cy - 12, 14, 7);  ctx.fillRect(cx + 30, cy - 4, 8, 9);
  ctx.fillRect(cx + 20, cy + 2,  12, 7);

  // Shell — mottled grey-green, silt-caked
  ctx.fillStyle = '#565a44';
  ctx.fillRect(cx - 30, cy - 34, 60, 26);
  ctx.fillStyle = '#666a50';
  ctx.fillRect(cx - 24, cy - 30, 48, 16);
  // Drying silt patches on the shell
  ctx.fillStyle = '#7a7256';
  ctx.fillRect(cx - 18, cy - 28, 12, 8);
  ctx.fillRect(cx +  6, cy - 22, 10, 6);
  // Shell seam
  ctx.fillStyle = '#3a3c2e';
  ctx.fillRect(cx - 2, cy - 32, 4, 22);

  // Pincers — small, held low and forward
  ctx.fillStyle = '#4e5240';
  ctx.fillRect(cx - 44, cy - 10, 16, 8);
  ctx.fillRect(cx + 28, cy - 10, 16, 8);

  // Eyes on short stalks
  ctx.fillStyle = '#3a3c2e';
  ctx.fillRect(cx - 10, cy - 40, 3, 8);
  ctx.fillRect(cx +  7, cy - 40, 3, 8);
  ctx.fillStyle = '#1a1a10';
  ctx.fillRect(cx - 12, cy - 42, 7, 7);
  ctx.fillRect(cx +  5, cy - 42, 7, 7);
  ctx.fillStyle = '#c8b040';
  ctx.fillRect(cx - 10, cy - 40, 3, 3);
  ctx.fillRect(cx +  7, cy - 40, 3, 3);
}

// Mudflat Strider — long-legged wader adapted to walking exposed lakebed
// without sinking; small body, long probing bill, always slightly twitchy.
function drawBattleMudflatStrider(cx, cy) {
  const step = Math.round(Math.sin(tick * 0.11) * 3); // restless weight-shifting

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — very long and thin, one slightly lifted
  ctx.fillStyle = '#8a7a5c';
  ctx.fillRect(cx - 14 + step, cy - 78, 4, 78);
  ctx.fillRect(cx +  9 - step, cy - 74, 4, 74);
  // Feet — splayed, built for soft ground
  ctx.fillStyle = '#7a6a4e';
  ctx.fillRect(cx - 20 + step, cy - 4, 16, 4);
  ctx.fillRect(cx +  3 - step, cy,     16, 4);

  // Body — small, round, feather-pale grey-brown
  ctx.fillStyle = '#9c9078';
  ctx.fillRect(cx - 18, cy - 96, 36, 24);
  ctx.fillStyle = '#aca088';
  ctx.fillRect(cx - 12, cy - 92, 24, 14);

  // Neck, stretched down toward the mud
  ctx.fillStyle = '#948858';
  ctx.fillRect(cx + 6, cy - 108, 8, 20);

  // Head, small, tilted, probing downward
  ctx.fillStyle = '#948858';
  ctx.fillRect(cx + 2, cy - 118, 18, 14);
  // Long thin bill, buried tip suggesting active probing
  ctx.fillStyle = '#5a5040';
  ctx.fillRect(cx + 16, cy - 112, 20, 4);

  // Eye — small, alert, yellow
  ctx.fillStyle = '#d8c840';
  ctx.fillRect(cx + 8, cy - 116, 4, 4);
  ctx.fillStyle = '#141008';
  ctx.fillRect(cx + 9, cy - 115, 2, 2);
}

// Dispatcher — routes to the right sprite; ground creatures get a cy offset
function drawBattleDenWraith(cx, cy) {
  const drift = Math.round(Math.sin(tick * 0.04) * 3);

  // Ambient glow — cold violet
  ctx.fillStyle = `rgba(80,40,120,${0.18 + Math.sin(tick * 0.05) * 0.08})`;
  ctx.beginPath(); ctx.ellipse(cx, cy - 60 + drift, 30, 70, 0, 0, Math.PI * 2); ctx.fill();

  // Ground shadow — diffuse
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 4, 18, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Lower trailing wisps — dissolve into nothing
  ctx.fillStyle = 'rgba(30,15,50,0.55)';
  ctx.fillRect(cx - 8, cy - 12 + drift, 6, 18);
  ctx.fillRect(cx + 2, cy - 8 + drift, 5, 14);
  ctx.fillStyle = 'rgba(20,10,35,0.35)';
  ctx.fillRect(cx - 12, cy + 0 + drift, 4, 10);
  ctx.fillRect(cx + 8,  cy - 2 + drift, 4, 8);

  // Body — tall, thin, dark
  ctx.fillStyle = '#1a0e28';
  ctx.fillRect(cx - 10, cy - 60 + drift, 20, 68);
  ctx.fillStyle = '#221436';
  ctx.fillRect(cx - 7, cy - 64 + drift, 14, 10);

  // Arms — unnaturally long, hanging low
  ctx.fillStyle = '#160c22';
  ctx.fillRect(cx - 24, cy - 56 + drift, 14, 5);  // left arm
  ctx.fillRect(cx - 28, cy - 52 + drift, 5, 20);  // left forearm — drooping
  ctx.fillRect(cx + 10, cy - 54 + drift, 14, 5);  // right arm
  ctx.fillRect(cx + 23, cy - 50 + drift, 5, 18);  // right forearm

  // Neck — barely there
  ctx.fillStyle = '#120a1e';
  ctx.fillRect(cx - 4, cy - 84 + drift, 8, 20);

  // Head — too long vertically, slightly too wide
  ctx.fillStyle = '#1c1030';
  ctx.fillRect(cx - 14, cy - 116 + drift, 28, 34);
  ctx.fillStyle = '#241840';
  ctx.fillRect(cx - 10, cy - 120 + drift, 20, 8);

  // Eye voids — hollow, faintly luminous
  ctx.fillStyle = 'rgba(160,120,220,0.85)';
  ctx.fillRect(cx - 9, cy - 110 + drift, 7, 10);
  ctx.fillRect(cx + 2, cy - 110 + drift, 7, 10);
  ctx.fillStyle = '#0a0616';
  ctx.fillRect(cx - 7, cy - 108 + drift, 5, 7);
  ctx.fillRect(cx + 4, cy - 108 + drift, 4, 7);
  // Eye pulse
  ctx.fillStyle = `rgba(180,140,255,${0.4 + Math.sin(tick * 0.08) * 0.3})`;
  ctx.fillRect(cx - 8, cy - 110 + drift, 5, 8);
  ctx.fillRect(cx + 3, cy - 110 + drift, 5, 8);

  // Mouth — absent, except a thin horizontal void
  ctx.fillStyle = '#08040e';
  ctx.fillRect(cx - 8, cy - 92 + drift, 16, 3);
}

// Kolm — large heavyset brawler; broad shoulders, thick neck, fists raised
function drawBattleSailorBrawler(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.05) * 2);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 4, 22, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Legs — wide stance, thick
  ctx.fillStyle = '#3b2a1c';
  ctx.fillRect(cx - 16, cy - 26, 13, 30);  // left leg
  ctx.fillRect(cx + 3,  cy - 26, 13, 30);  // right leg
  ctx.fillStyle = '#2e1e10';
  ctx.fillRect(cx - 15, cy - 2, 11, 8);    // left boot
  ctx.fillRect(cx + 4,  cy - 2, 11, 8);    // right boot

  // Belt
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(cx - 18, cy - 30, 36, 5);

  // Torso — very broad
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(cx - 20 + sway, cy - 72, 40, 44);
  // Shirt stripes
  ctx.fillStyle = '#7a5030';
  ctx.fillRect(cx - 20 + sway, cy - 72, 7, 44);
  ctx.fillRect(cx + 5 + sway,  cy - 72, 7, 44);

  // Left arm — raised, fist forward
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(cx - 38 + sway, cy - 70, 18, 10); // upper arm
  ctx.fillRect(cx - 42 + sway, cy - 60, 14, 22); // forearm
  // Left fist
  ctx.fillStyle = '#7a4e2c';
  ctx.fillRect(cx - 46 + sway, cy - 64, 16, 14);

  // Right arm — cocked back
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(cx + 20 + sway, cy - 68, 18, 10); // upper arm
  ctx.fillRect(cx + 24 + sway, cy - 56, 14, 20); // forearm
  // Right fist
  ctx.fillStyle = '#7a4e2c';
  ctx.fillRect(cx + 28 + sway, cy - 60, 14, 12);

  // Neck — thick
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(cx - 8 + sway, cy - 82, 16, 12);

  // Head — square, heavy jaw
  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(cx - 16 + sway, cy - 114, 32, 34);
  // Jaw shadow
  ctx.fillStyle = '#7a4e2c';
  ctx.fillRect(cx - 14 + sway, cy - 90, 28, 12);

  // Short hair — dark
  ctx.fillStyle = '#1e110a';
  ctx.fillRect(cx - 16 + sway, cy - 116, 32, 8);
  ctx.fillRect(cx - 18 + sway, cy - 114, 4, 10); // sideburn L
  ctx.fillRect(cx + 14 + sway, cy - 114, 4, 10); // sideburn R

  // Eyes — small, set deep
  ctx.fillStyle = '#1a0e06';
  ctx.fillRect(cx - 10 + sway, cy - 106, 7, 6);
  ctx.fillRect(cx + 3 + sway,  cy - 106, 7, 6);
  ctx.fillStyle = '#e8c090';
  ctx.fillRect(cx - 9 + sway, cy - 105, 2, 3);  // eye gleam L
  ctx.fillRect(cx + 4 + sway, cy - 105, 2, 3);  // eye gleam R

  // Nose — broad
  ctx.fillStyle = '#7a4e2c';
  ctx.fillRect(cx - 4 + sway, cy - 100, 8, 8);

  // Mouth — wide grin (set teeth)
  ctx.fillStyle = '#1a0e06';
  ctx.fillRect(cx - 9 + sway, cy - 92, 18, 5);
  ctx.fillStyle = '#d4c0a0';
  ctx.fillRect(cx - 7 + sway, cy - 91, 4, 3);  // tooth
  ctx.fillRect(cx - 1 + sway, cy - 91, 4, 3);
  ctx.fillRect(cx + 4 + sway, cy - 91, 3, 3);

  // Knuckle details on left fist
  ctx.fillStyle = '#5a3010';
  ctx.fillRect(cx - 43 + sway, cy - 63, 3, 3);
  ctx.fillRect(cx - 38 + sway, cy - 63, 3, 3);
  ctx.fillRect(cx - 33 + sway, cy - 63, 3, 3);
}

// 23 — the number itself, floating in darkness, pulsing faintly
function drawBattle23(cx, cy) {
  const bob   = Math.sin(tick * 0.06) * 6;
  const pulse = 0.7 + Math.sin(tick * 0.09) * 0.3;
  const ey    = cy - 60 + Math.round(bob);

  // Outer glow — diffuse halo, colour-shifts slowly
  const hue = Math.floor((tick * 0.8) % 360);
  ctx.fillStyle = `hsla(${hue},60%,60%,${0.10 * pulse})`;
  ctx.beginPath(); ctx.ellipse(cx, ey, 52, 38, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `hsla(${hue},60%,70%,${0.08 * pulse})`;
  ctx.beginPath(); ctx.ellipse(cx, ey, 70, 52, 0, 0, Math.PI * 2); ctx.fill();

  // Shadow beneath — always grounded
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 2, 28, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Text shadow layer (depth)
  ctx.save();
  ctx.font = 'bold 72px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(0,0,0,${0.55 * pulse})`;
  ctx.fillText('23', cx + 3, ey + 3);

  // Main number — white-hot core
  ctx.fillStyle = `rgba(255,255,255,${0.92 * pulse})`;
  ctx.fillText('23', cx, ey);

  // Thin colour rim matching hue
  ctx.fillStyle = `hsla(${hue},80%,75%,${0.5 * pulse})`;
  ctx.fillText('23', cx, ey);
  ctx.restore();
}

// Fen Witch — cursed hag; tattered dark-green robes, pointed hat, glowing yellow-green eyes
function drawBattleFenWitch(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.045) * 2);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 10, 22, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cursed aura — faint green haze
  ctx.fillStyle = `rgba(40,80,10,${0.12 + Math.sin(tick * 0.06) * 0.05})`;
  ctx.beginPath();
  ctx.ellipse(cx + sway, cy - 25, 28, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tattered robe skirt — flared hem
  ctx.fillStyle = '#1e2a10';
  ctx.fillRect(cx - 12,       cy - 10, 24, 22);
  ctx.fillRect(cx - 14 + sway, cy - 14, 10, 8);
  ctx.fillRect(cx +  4 + sway, cy - 14, 10, 8);
  // Ragged hem shreds
  ctx.fillStyle = '#162008';
  ctx.fillRect(cx - 15, cy + 8, 5, 8);
  ctx.fillRect(cx -  7, cy + 10, 4, 6);
  ctx.fillRect(cx +  3, cy + 9,  4, 7);
  ctx.fillRect(cx + 10, cy + 8,  5, 8);

  // Torso — hunched
  ctx.fillStyle = '#243018';
  ctx.fillRect(cx - 10 + sway, cy - 32, 20, 22);
  ctx.fillStyle = '#1a2410';
  ctx.fillRect(cx - 14 + sway, cy - 30, 6, 14);  // left shoulder drape
  ctx.fillRect(cx +  8 + sway, cy - 30, 6, 14);  // right shoulder drape

  // Long gnarled arms
  ctx.fillStyle = '#3a4020';
  ctx.fillRect(cx - 22 + sway, cy - 28, 8, 22);
  ctx.fillRect(cx + 14 + sway, cy - 28, 8, 22);
  // Claw fingers
  ctx.fillStyle = '#6a5830';
  ctx.fillRect(cx - 24 + sway, cy - 8, 3, 8);
  ctx.fillRect(cx - 20 + sway, cy - 6, 3, 7);
  ctx.fillRect(cx - 17 + sway, cy - 7, 3, 6);
  ctx.fillRect(cx + 17 + sway, cy - 8, 3, 8);
  ctx.fillRect(cx + 13 + sway, cy - 6, 3, 7);
  ctx.fillRect(cx + 10 + sway, cy - 7, 3, 6);

  // Head
  ctx.fillStyle = '#384028';
  ctx.fillRect(cx - 9 + sway, cy - 52, 18, 20);
  ctx.fillStyle = '#486038';
  ctx.fillRect(cx - 7 + sway, cy - 48, 14, 14);
  // Wild stringy hair
  ctx.fillStyle = '#141008';
  ctx.fillRect(cx - 12 + sway, cy - 56, 5, 14);
  ctx.fillRect(cx -  6 + sway, cy - 58, 4, 12);
  ctx.fillRect(cx +  2 + sway, cy - 58, 4, 12);
  ctx.fillRect(cx +  7 + sway, cy - 56, 5, 14);
  // Pointed hat
  ctx.fillStyle = '#1a2210';
  ctx.fillRect(cx - 10 + sway, cy - 60, 20, 8);   // brim
  ctx.fillRect(cx -  6 + sway, cy - 76, 12, 18);  // cone lower
  ctx.fillRect(cx -  3 + sway, cy - 88, 6, 14);   // cone upper
  ctx.fillStyle = '#080c06';
  ctx.fillRect(cx -  2 + sway, cy - 84, 4, 10);   // tip dark

  // Eyes — glowing yellow-green
  const eyeGlow = 0.5 + Math.sin(tick * 0.09) * 0.3;
  ctx.fillStyle = `rgba(130,190,20,${eyeGlow})`;
  ctx.fillRect(cx - 6 + sway, cy - 44, 5, 4);
  ctx.fillRect(cx + 1 + sway, cy - 44, 5, 4);
  ctx.fillStyle = '#040802';
  ctx.fillRect(cx - 5 + sway, cy - 43, 3, 2);
  ctx.fillRect(cx + 2 + sway, cy - 43, 3, 2);
}

// Hollow — animated empty plate armor; braces often, very high defense.
// "The shell is not empty. Something minimal is animating it. The original
// occupant is not in evidence." Reads as a hollow suit standing upright,
// gaps showing only darkness, with one faint ember deep in the chest void.
function drawBattleHollow(cx, cy) {
  const flicker = 0.4 + Math.sin(tick * 0.12) * 0.25;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Greaves / legs
  ctx.fillStyle = '#585c60';
  ctx.fillRect(cx - 20, cy - 30, 15, 32);
  ctx.fillRect(cx +  5, cy - 30, 15, 32);
  ctx.fillStyle = '#3c4044';
  ctx.fillRect(cx - 22, cy -  2, 18, 6);
  ctx.fillRect(cx +  4, cy -  2, 18, 6);
  // Knee joints
  ctx.fillStyle = '#6c7074';
  ctx.fillRect(cx - 22, cy - 14, 16, 6);
  ctx.fillRect(cx +  6, cy - 14, 16, 6);

  // Empty gap between greaves and cuirass — pure dark
  ctx.fillStyle = '#08090a';
  ctx.fillRect(cx - 14, cy - 38, 28, 8);

  // Cuirass — broad, braced stance
  [
    { dy: -70, w: 40, c: '#54585c' },
    { dy: -60, w: 50, c: '#606468' },
    { dy: -50, w: 54, c: '#686c70' },
    { dy: -40, w: 50, c: '#606468' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy + dy, w, 10);
  });
  // Breastplate ridge / dent highlights
  ctx.fillStyle = '#80868a';
  ctx.fillRect(cx - 4, cy - 68, 8, 34);
  ctx.fillStyle = '#40444a';
  ctx.fillRect(cx - 22, cy - 56, 6, 12);
  ctx.fillRect(cx + 16, cy - 56, 6, 12);

  // Pauldrons
  ctx.fillStyle = '#4a4e52';
  ctx.fillRect(cx - 40, cy - 68, 18, 20);
  ctx.fillRect(cx + 22, cy - 68, 18, 20);
  ctx.fillStyle = '#62666a';
  ctx.fillRect(cx - 38, cy - 66, 14, 5);
  ctx.fillRect(cx + 24, cy - 66, 14, 5);

  // Arms — braced, slightly forward
  ctx.fillStyle = '#54585c';
  ctx.fillRect(cx - 42, cy - 48, 14, 30);
  ctx.fillRect(cx + 28, cy - 48, 14, 30);
  ctx.fillStyle = '#3c4044';
  ctx.fillRect(cx - 42, cy - 20, 14, 8);
  ctx.fillRect(cx + 28, cy - 20, 14, 8);
  // Gauntlets
  ctx.fillStyle = '#6c7074';
  ctx.fillRect(cx - 44, cy - 14, 16, 10);
  ctx.fillRect(cx + 28, cy - 14, 16, 10);

  // Gorget / neck gap — empty dark
  ctx.fillStyle = '#08090a';
  ctx.fillRect(cx - 12, cy - 80, 24, 10);

  // Helm — closed great-helm, no face
  ctx.fillStyle = '#585c60';
  ctx.fillRect(cx - 18, cy - 106, 36, 28);
  ctx.fillStyle = '#686c70';
  ctx.fillRect(cx - 16, cy - 104, 32, 8);
  // Visor slit — empty black
  ctx.fillStyle = '#08090a';
  ctx.fillRect(cx - 14, cy - 90, 28, 7);
  // A single faint ember deep in the slit — "something minimal" inside
  ctx.fillStyle = `rgba(200,120,40,${flicker})`;
  ctx.fillRect(cx - 3, cy - 88, 5, 4);
  // Helm crest ridge
  ctx.fillStyle = '#40444a';
  ctx.fillRect(cx - 3, cy - 110, 6, 6);
}

// Fen Shade — small, fast, seeped-down spectral remnant. Deliberately drawn
// endearing (round, big-eyed) rather than menacing, despite its brutal
// attack stat -- the joke is entirely in that disconnect.
function drawBattleFenShade(cx, cy) {
  const dart = Math.round(Math.sin(tick * 0.14) * 6);
  const bob  = Math.round(Math.sin(tick * 0.1) * 3);
  const sx = cx + dart, sy = cy + bob;

  // Faint trailing wisp (motion blur toward where it darted from)
  ctx.fillStyle = 'rgba(60,150,120,0.12)';
  ctx.beginPath();
  ctx.ellipse(cx - dart * 1.4, cy + bob, 20, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Drippy hem tendrils instead of legs
  ctx.fillStyle = '#1c4636';
  ctx.fillRect(sx - 14, sy + 14, 5, 10 + (tick % 20 < 10 ? 2 : 0));
  ctx.fillRect(sx -  4, sy + 16, 5, 8);
  ctx.fillRect(sx +  6, sy + 15, 5, 9);

  // Round little body
  ctx.fillStyle = '#245a44';
  ctx.beginPath(); ctx.ellipse(sx, sy, 22, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2e6e54';
  ctx.beginPath(); ctx.ellipse(sx - 2, sy - 3, 17, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3c8264';
  ctx.beginPath(); ctx.ellipse(sx - 4, sy - 7, 9, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Tiny stub "arms" -- more cute than threatening
  ctx.fillStyle = '#1c4636';
  ctx.fillRect(sx - 24, sy - 2, 6, 9);
  ctx.fillRect(sx + 18, sy - 2, 6, 9);

  // Big round friendly eyes
  ctx.fillStyle = '#0a1812';
  ctx.beginPath(); ctx.ellipse(sx - 8, sy - 3, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx + 7, sy - 3, 7, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c8f8e0';
  ctx.beginPath(); ctx.ellipse(sx - 8, sy - 5, 4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(sx + 7, sy - 5, 4, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sx - 9, sy - 7, 2, 2);
  ctx.fillRect(sx + 6, sy - 7, 2, 2);
  // Small "o" mouth — startled/eager, not scary
  ctx.fillStyle = '#0a1812';
  ctx.beginPath(); ctx.ellipse(sx, sy + 6, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
}

// Tomb Sentry — petrified-then-reanimated stone guardian. Enormous HP,
// extreme defense, glacially slow; braces on a fixed interval. Monumental,
// cracked granite, moss growth, dim amber glow behind the eye slits.
function drawBattleTombSentry(cx, cy) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 36, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stone legs — thick pillars
  ctx.fillStyle = '#6a6660';
  ctx.fillRect(cx - 24, cy - 34, 20, 36);
  ctx.fillRect(cx +  4, cy - 34, 20, 36);
  ctx.fillStyle = '#54504a';
  ctx.fillRect(cx - 26, cy -  2, 22, 6);
  ctx.fillRect(cx +  4, cy -  2, 22, 6);

  // Stone kilt / waist
  [
    { dy: -78, w: 46, c: '#68645e' },
    { dy: -68, w: 56, c: '#726e66' },
    { dy: -58, w: 60, c: '#7c766c' },
    { dy: -48, w: 58, c: '#726e66' },
    { dy: -38, w: 52, c: '#68645e' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy + dy, w, 10);
  });

  // Cracks — dark fissures through the stone body
  ctx.fillStyle = '#3a3630';
  ctx.fillRect(cx - 16, cy - 74, 4, 30);
  ctx.fillRect(cx + 10, cy - 66, 3, 22);
  ctx.fillRect(cx - 30, cy - 50, 3, 14);
  // Moss patches
  ctx.fillStyle = '#4a5834';
  ctx.fillRect(cx - 24, cy - 60, 10, 6);
  ctx.fillRect(cx + 14, cy - 44, 8, 5);

  // Massive stone arms, held low and braced
  ctx.fillStyle = '#6a6660';
  ctx.fillRect(cx - 46, cy - 66, 20, 36);
  ctx.fillRect(cx + 26, cy - 66, 20, 36);
  ctx.fillStyle = '#54504a';
  ctx.fillRect(cx - 48, cy - 32, 22, 10);
  ctx.fillRect(cx + 26, cy - 32, 22, 10);

  // Neck / shoulder join
  ctx.fillStyle = '#5c5852';
  ctx.fillRect(cx - 20, cy - 90, 40, 16);

  // Head — blocky, weathered
  ctx.fillStyle = '#726e66';
  ctx.fillRect(cx - 22, cy - 116, 44, 28);
  ctx.fillStyle = '#7c766c';
  ctx.fillRect(cx - 20, cy - 116, 40, 8);
  // Brow crack
  ctx.fillStyle = '#3a3630';
  ctx.fillRect(cx - 6, cy - 116, 3, 12);

  // Eye slits — dim amber ember, fixed-interval feel (no flicker, it's calm)
  ctx.fillStyle = '#100e0a';
  ctx.fillRect(cx - 17, cy - 104, 13, 8);
  ctx.fillRect(cx +  4, cy - 104, 13, 8);
  ctx.fillStyle = '#a86818';
  ctx.fillRect(cx - 14, cy - 102, 7, 4);
  ctx.fillRect(cx +  7, cy - 102, 7, 4);

  // Heavy jaw
  ctx.fillStyle = '#68645e';
  ctx.fillRect(cx - 18, cy - 92, 36, 10);
}

// Crypt Revenant — buried-twice reanimated knight; very high attack, high
// speed. Gaunt, fast, lunging -- the opposite silhouette of Tomb Sentry.
function drawBattleCryptRevenant(cx, cy) {
  const lunge = Math.round(Math.sin(tick * 0.09) * 6);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 34, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Torn cloak flaring out behind — drawn first, behind the body, so its
  // silhouette reads clearly rather than getting lost behind the limbs
  ctx.fillStyle = '#1c1710';
  ctx.fillRect(cx - 34 - lunge, cy - 60, 18, 48);
  ctx.fillRect(cx - 24 - lunge, cy - 50, 12, 40);
  ctx.fillStyle = '#241f18';
  ctx.fillRect(cx - 38 - lunge, cy - 30, 10, 26);
  ctx.fillRect(cx - 14 - lunge, cy - 24, 8, 20);

  // Legs, mid-lunge
  ctx.fillStyle = '#3a3428';
  ctx.fillRect(cx - 18 - lunge, cy - 30, 12, 34);
  ctx.fillRect(cx +  6 + lunge, cy - 30, 12, 34);
  ctx.fillStyle = '#26221a';
  ctx.fillRect(cx - 20 - lunge, cy -  2, 14, 6);
  ctx.fillRect(cx +  6 + lunge, cy -  2, 14, 6);

  // Tattered burial wrappings at the waist
  ctx.fillStyle = '#8c8270';
  ctx.fillRect(cx - 14, cy - 14, 9, 16);
  ctx.fillRect(cx +  3, cy - 12, 7, 14);
  ctx.fillRect(cx + 13, cy - 14, 7, 16);

  // Gaunt torso, leaning forward hard into the lunge
  ctx.fillStyle = '#42392c';
  ctx.fillRect(cx - 17 + lunge / 2, cy - 60, 34, 48);
  ctx.fillStyle = '#524436';
  ctx.fillRect(cx - 14 + lunge / 2, cy - 56, 28, 14);
  // Burial-wrap lines, recent stonework markings
  ctx.fillStyle = '#8c8270';
  ctx.fillRect(cx - 12 + lunge / 2, cy - 46, 24, 5);
  ctx.fillRect(cx - 12 + lunge / 2, cy - 32, 24, 5);

  // Back arm, trailing behind
  ctx.fillStyle = '#3a3228';
  ctx.fillRect(cx - 38, cy - 54, 20, 10);

  // Forward arm and a single unified curved claw-blade, reaching out fast
  ctx.fillStyle = '#3a3228';
  ctx.fillRect(cx + 13 + lunge, cy - 58, 26, 12);
  ctx.fillStyle = '#8a7c60';
  ctx.beginPath();
  ctx.moveTo(cx + 37 + lunge, cy - 60);
  ctx.lineTo(cx + 58 + lunge, cy - 66);
  ctx.lineTo(cx + 56 + lunge, cy - 56);
  ctx.lineTo(cx + 40 + lunge, cy - 48);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b0a488';
  ctx.beginPath();
  ctx.moveTo(cx + 40 + lunge, cy - 58);
  ctx.lineTo(cx + 54 + lunge, cy - 62);
  ctx.lineTo(cx + 40 + lunge, cy - 52);
  ctx.closePath();
  ctx.fill();

  // Head — gaunt skull-face, low hood remnant
  ctx.fillStyle = '#4a4030';
  ctx.fillRect(cx - 12 + lunge / 2, cy - 80, 26, 24);
  ctx.fillStyle = '#241f18';
  ctx.fillRect(cx - 14 + lunge / 2, cy - 82, 30, 9); // hood remnant

  // Eyes — furious red-orange, fast reacting
  const glow = 0.6 + Math.sin(tick * 0.15) * 0.3;
  ctx.fillStyle = `rgba(220,70,20,${glow})`;
  ctx.fillRect(cx - 7 + lunge / 2, cy - 68, 7, 6);
  ctx.fillRect(cx + 5 + lunge / 2, cy - 68, 7, 6);
  ctx.fillStyle = '#100a06';
  ctx.fillRect(cx - 14 + lunge / 2, cy - 60, 28, 6); // snarling jaw shadow
  ctx.fillStyle = '#d8d0b8';
  for (let i = 0; i < 4; i++) ctx.fillRect(cx - 10 + lunge / 2 + i * 7, cy - 59, 5, 5);
}

// Wall Tendril — grows from the wall itself, no discrete body. Extreme
// attack, extreme speed, almost no defense. Drawn anchored to a broken
// chunk of masonry with the tendril doing all the whip-fast motion.
function drawBattleWallTendril(cx, cy) {
  const whip  = Math.sin(tick * 0.16);
  const flexX = Math.round(whip * 26);
  const flexY = Math.round(Math.cos(tick * 0.13) * 8);

  // Shadow under the wall chunk
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 46, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Anchor: a large, clearly-broken slab of masonry, still standing
  ctx.fillStyle = '#3e3a34';
  ctx.fillRect(cx - 46, cy - 46, 92, 50);
  ctx.fillStyle = '#4c473f';
  ctx.fillRect(cx - 46, cy - 46, 92, 10);
  // Brick coursing lines, so it reads as masonry rather than a blob
  ctx.fillStyle = '#322e29';
  for (let row = 0; row < 3; row++) {
    const ry = cy - 32 + row * 14;
    const shift = row % 2 === 0 ? 0 : 14;
    for (let bx = -46 + shift; bx < 46; bx += 28) {
      ctx.fillRect(cx + bx, ry, 26, 3);
    }
  }
  // Crumbled rubble at the base
  ctx.fillStyle = '#2c2822';
  ctx.fillRect(cx - 54, cy - 4, 14, 12);
  ctx.fillRect(cx + 40, cy - 8, 16, 14);
  ctx.fillRect(cx - 20, cy + 2, 10, 6);
  // Jagged broken-off top edge
  ctx.fillStyle = '#26221d';
  ctx.fillRect(cx - 40, cy - 50, 10, 6);
  ctx.fillRect(cx - 12, cy - 52, 8, 8);
  ctx.fillRect(cx + 18, cy - 50, 10, 6);

  // The ragged hole the tendril bursts through
  ctx.fillStyle = '#0a0806';
  ctx.beginPath(); ctx.ellipse(cx, cy - 24, 17, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1c0a14';
  ctx.beginPath(); ctx.ellipse(cx, cy - 24, 12, 10, 0, 0, Math.PI * 2); ctx.fill();

  // Tendril — whipping segments, thick and fleshy, fast and fragile
  const segs = 6;
  let px = cx, py = cy - 24;
  for (let i = 1; i <= segs; i++) {
    const t     = i / segs;
    const nx    = cx + flexX * t;
    const ny    = cy - 24 - i * 15 + flexY * (t * 0.6);
    const width = 15 - t * 6;
    ctx.fillStyle = i % 2 === 0 ? '#7a3860' : '#8a4270';
    ctx.beginPath();
    ctx.ellipse((px + nx) / 2, (py + ny) / 2, width, 12, Math.atan2(ny - py, nx - px), 0, Math.PI * 2);
    ctx.fill();
    px = nx; py = ny;
  }
  // Highlight vein running along the tendril's outer curve
  ctx.fillStyle = '#c878a8';
  ctx.beginPath(); ctx.ellipse(cx + flexX * 0.55, cy - 58 + flexY * 0.5, 4, 26, whip * 0.35, 0, Math.PI * 2); ctx.fill();

  // Tip — a wide toothed maw wrapped around a single wet eye
  ctx.fillStyle = '#4a1834';
  ctx.beginPath(); ctx.ellipse(px, py, 15, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8c8b8';
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    ctx.fillRect(px + Math.cos(ang) * 11 - 2, py + Math.sin(ang) * 11 - 2, 4, 4);
  }
  ctx.fillStyle = '#1c0a14';
  ctx.beginPath(); ctx.ellipse(px, py, 9, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d8a0c0';
  ctx.beginPath(); ctx.ellipse(px, py, 6, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#180010';
  ctx.beginPath(); ctx.ellipse(px, py, 3, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px - 2, py - 3, 2, 2);
  // Wet gleam drip off the tip
  ctx.fillStyle = 'rgba(180,60,120,0.5)';
  ctx.fillRect(px - 1, py + 12, 2, 8);
}

// Dripping Maw — not a separate creature, a feature of the horror branch's
// ceiling. Drawn hanging from ABOVE rather than standing on the ground --
// the acid puddle below stands in for the usual base shadow. Massive HP,
// heavy attack, slow (it doesn't need to chase anything).
function drawBattleDrippingMaw(cx, cy) {
  const drip = tick % 90;
  const gape = 0.5 + Math.sin(tick * 0.05) * 0.5;

  // Acid puddle on the ground below (stands in for a shadow)
  ctx.fillStyle = 'rgba(140,180,20,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 40, 34, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(170,210,30,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 40, 14, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Falling acid droplet, looping
  if (drip < 60) {
    const dy = cy - 30 + drip;
    ctx.fillStyle = '#a8c828';
    ctx.beginPath(); ctx.ellipse(cx + 6, dy, 3, 5, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Ceiling anchor — a ragged fleshy patch the maw grows from, at the top
  ctx.fillStyle = '#2a2418';
  ctx.fillRect(cx - 40, cy - 110, 80, 20);
  ctx.fillStyle = '#3a3220';
  ctx.fillRect(cx - 34, cy - 106, 68, 10);
  // Root tendrils gripping the ceiling
  ctx.fillStyle = '#241e14';
  ctx.fillRect(cx - 46, cy - 100, 10, 16);
  ctx.fillRect(cx + 36, cy - 100, 10, 16);

  // Drooping fleshy neck the maw hangs from
  ctx.fillStyle = '#4a3828';
  ctx.fillRect(cx - 20, cy - 92, 40, 24);
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(cx - 16, cy - 88, 32, 14);

  // The maw itself — wide gaping mouth, hangs at the bottom of the growth
  ctx.fillStyle = '#3a2c1e';
  ctx.fillRect(cx - 32, cy - 68, 64, 26);
  // Upper lip
  ctx.fillStyle = '#5a4432';
  ctx.fillRect(cx - 34, cy - 70, 68, 10);
  // Gaping interior — pulses open/closed
  ctx.fillStyle = '#160e08';
  ctx.fillRect(cx - 26, cy - 60, 52, 8 + gape * 10);
  // Rows of teeth, upper and lower
  ctx.fillStyle = '#d8d0b0';
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(cx - 26 + i * 8, cy - 60, 5, 6);
    ctx.fillRect(cx - 26 + i * 8, cy - 50 + gape * 10, 5, 6);
  }
  // Wet gleam
  ctx.fillStyle = 'rgba(200,220,120,0.35)';
  ctx.fillRect(cx - 22, cy - 58, 44, 3);

  // Acid glow ambience, sickly yellow-green
  ctx.fillStyle = `rgba(150,190,20,${0.10 + Math.sin(tick * 0.04) * 0.05})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 55, 46, 40, 0, 0, Math.PI * 2);
  ctx.fill();
}

// The Seep — no fixed form, uses mass instead of structure. Catastrophic
// attack, zero defense, extreme speed. Drawn as a cheerful, eager little
// ooze bouncing straight at the player -- the horror is entirely
// mechanical (it hits first, it hits enormously hard); the sprite itself
// is deliberately adorable.
function drawBattleTheSeep(cx, cy) {
  const bounce = Math.abs(Math.sin(tick * 0.15)) * 14;
  const squish = 1 - Math.abs(Math.sin(tick * 0.15)) * 0.25;
  const sy = cy - bounce;

  // Puddle shadow that widens as it flattens on landing
  ctx.fillStyle = 'rgba(20,60,40,0.28)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 26 + bounce * 0.6, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trailing goo drips left behind mid-bounce
  ctx.fillStyle = 'rgba(80,200,140,0.25)';
  ctx.beginPath(); ctx.ellipse(cx - 4, cy + 2, 8, 3, 0, 0, Math.PI * 2); ctx.fill();

  // Glossy round body, squishing with the bounce
  ctx.fillStyle = '#1c7850';
  ctx.beginPath();
  ctx.ellipse(cx, sy, 30, 26 * squish, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a9868';
  ctx.beginPath();
  ctx.ellipse(cx, sy - 4, 24, 20 * squish, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3cbc80';
  ctx.beginPath();
  ctx.ellipse(cx - 6, sy - 10, 12, 9 * squish, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glossy highlight — makes it read as cute/wet rather than menacing
  ctx.fillStyle = 'rgba(220,255,230,0.7)';
  ctx.beginPath();
  ctx.ellipse(cx - 10, sy - 12, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tiny excited nub-arms reaching forward
  ctx.fillStyle = '#1c7850';
  ctx.beginPath(); ctx.ellipse(cx - 26, sy + 2, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 26, sy + 2, 7, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Big cute eyes, always wide open — "eager", not sinister
  ctx.fillStyle = '#0a2418';
  ctx.beginPath(); ctx.ellipse(cx - 9, sy - 2, 6.5, 7.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 9, sy - 2, 6.5, 7.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 11, sy - 5, 3, 3);
  ctx.fillRect(cx +  7, sy - 5, 3, 3);
  // Big happy open-mouth grin — it is, genuinely, having a great time
  ctx.fillStyle = '#0a2418';
  ctx.beginPath(); ctx.ellipse(cx, sy + 8, 7, 5, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#e88898';
  ctx.fillRect(cx - 4, sy + 9, 8, 3);
}

// Pale Drowned — spectral fen-drowning victim. Fast, light armor, fragile.
// Pale fen-water-saturated colouring, waterweed hair, tattered clothes.
function drawBattlePaleDrowned(cx, cy) {
  const drift = Math.round(Math.sin(tick * 0.06) * 4);
  const bob   = Math.round(Math.sin(tick * 0.08) * 3);
  const dx = cx + drift, dy = cy + bob;

  // Faint pale aura, waterlogged
  ctx.fillStyle = 'rgba(140,180,200,0.10)';
  ctx.beginPath();
  ctx.ellipse(dx, dy - 30, 30, 46, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tattered lower hem, dissolving into nothing rather than legs
  ctx.fillStyle = '#7898a0';
  ctx.fillRect(dx - 12, dy - 6, 6, 14);
  ctx.fillRect(dx -  3, dy - 4, 6, 12);
  ctx.fillRect(dx +  7, dy - 6, 6, 14);
  ctx.fillStyle = 'rgba(120,160,180,0.4)';
  ctx.fillRect(dx - 14, dy + 4, 30, 6);

  // Torso — pale, translucent-looking
  ctx.fillStyle = '#8ca8b0';
  ctx.fillRect(dx - 13, dy - 32, 26, 28);
  ctx.fillStyle = '#a0bcc4';
  ctx.fillRect(dx - 11, dy - 30, 22,  8);
  // Torn wrap details
  ctx.fillStyle = '#6c8890';
  ctx.fillRect(dx - 13, dy - 20, 8, 4);
  ctx.fillRect(dx +  5, dy - 14, 8, 4);

  // Thin drifting arms
  ctx.fillStyle = '#7898a0';
  ctx.fillRect(dx - 22, dy - 28, 8, 22);
  ctx.fillRect(dx + 14, dy - 28, 8, 22);
  ctx.fillStyle = '#5c7880';
  ctx.fillRect(dx - 22, dy - 8, 8, 6);
  ctx.fillRect(dx + 14, dy - 8, 8, 6);

  // Head — pale, waterlogged
  ctx.fillStyle = '#94b0b8';
  ctx.fillRect(dx - 10, dy - 52, 20, 20);
  // Waterweed hair strands, drifting
  ctx.fillStyle = '#385048';
  ctx.fillRect(dx - 12 + drift / 2, dy - 56, 4, 14);
  ctx.fillRect(dx -  4,             dy - 58, 3, 12);
  ctx.fillRect(dx +  4,             dy - 58, 3, 12);
  ctx.fillRect(dx +  9 - drift / 2, dy - 56, 4, 14);

  // Hollow dark eyes, no glow — just absence
  ctx.fillStyle = '#182428';
  ctx.fillRect(dx - 7, dy - 42, 6, 7);
  ctx.fillRect(dx + 2, dy - 42, 6, 7);
  // Faint waterlogged tear-tracks
  ctx.fillStyle = 'rgba(140,180,200,0.4)';
  ctx.fillRect(dx - 6, dy - 35, 2, 6);
  ctx.fillRect(dx + 4, dy - 35, 2, 6);
  // Small open mouth, slack
  ctx.fillStyle = '#182428';
  ctx.fillRect(dx - 3, dy - 32, 6, 4);
}

// Silt Hag — bog-curse made solid, condensing from silt where the vault
// floor meets the water. High attack, moderate defense, very slow. Hunched
// hag shape, muddy robes, curse-glow eyes, drips of muck.
function drawBattleSiltHag(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.035) * 2);

  // Silt puddle shadow
  ctx.fillStyle = 'rgba(40,32,16,0.4)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 8, 26, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cursed murky aura
  ctx.fillStyle = `rgba(60,80,20,${0.12 + Math.sin(tick * 0.05) * 0.05})`;
  ctx.beginPath();
  ctx.ellipse(cx + sway, cy - 24, 30, 44, 0, 0, Math.PI * 2);
  ctx.fill();

  // Muddy robe hem, dripping
  ctx.fillStyle = '#463620';
  ctx.fillRect(cx - 15, cy - 8, 30, 20);
  ctx.fillStyle = '#382a18';
  ctx.fillRect(cx - 17, cy + 6, 8, 8);
  ctx.fillRect(cx -  4, cy + 8, 6, 6);
  ctx.fillRect(cx +  9, cy + 6, 8, 8);
  // Muck drips
  ctx.fillStyle = 'rgba(90,72,30,0.6)';
  ctx.fillRect(cx - 14, cy + 12, 3, 6);
  ctx.fillRect(cx + 12, cy + 12, 3, 6);

  // Hunched torso
  ctx.fillStyle = '#524030';
  ctx.fillRect(cx - 13 + sway, cy - 34, 26, 28);
  ctx.fillStyle = '#463620';
  ctx.fillRect(cx - 16 + sway, cy - 32, 8, 16);
  ctx.fillRect(cx +  8 + sway, cy - 32, 8, 16);

  // Long gnarled silt-caked arms, one raised
  ctx.fillStyle = '#5c4832';
  ctx.fillRect(cx - 26 + sway, cy - 30, 9, 24);
  ctx.fillRect(cx + 17 + sway, cy - 44, 9, 26);
  // Claw fingers, muddy
  ctx.fillStyle = '#786040';
  ctx.fillRect(cx - 28 + sway, cy - 8, 3, 8);
  ctx.fillRect(cx - 23 + sway, cy - 6, 3, 7);
  ctx.fillRect(cx + 17 + sway, cy - 20, 3, 8);
  ctx.fillRect(cx + 22 + sway, cy - 18, 3, 7);

  // Hooded head, hunched forward
  ctx.fillStyle = '#3a2e1a';
  ctx.fillRect(cx - 12 + sway, cy - 54, 24, 20);
  ctx.fillStyle = '#241c10';
  ctx.fillRect(cx - 14 + sway, cy - 58, 28, 10); // hood brim
  ctx.fillRect(cx -  4 + sway, cy - 68, 8, 12);  // hood peak

  // Curse-glow eyes deep in the hood shadow
  const eyeGlow = 0.55 + Math.sin(tick * 0.08) * 0.3;
  ctx.fillStyle = `rgba(150,190,40,${eyeGlow})`;
  ctx.fillRect(cx - 7 + sway, cy - 46, 5, 4);
  ctx.fillRect(cx +  2 + sway, cy - 46, 5, 4);
  ctx.fillStyle = '#100c04';
  ctx.fillRect(cx - 6 + sway, cy - 45, 3, 2);
  ctx.fillRect(cx +  3 + sway, cy - 45, 3, 2);
}

// Pale Sentry — "It rose from the fen grass and has not left." Boss-scale
// (500 HP, the game's toughest single fight): towering, fen-grown, eerily
// motionless. Drawn largest and most detailed of this batch, on purpose.
function drawBattlePaleSentry(cx, cy) {
  // No sway, no bob, no flicker on the main frame -- it does not react.
  const reedShift = Math.round(Math.sin(tick * 0.02) * 2); // only the grass moves

  // Ground shadow — wide, ancient
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 6, 54, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Reed/grass growth at the base, gently moving (the only motion allowed)
  ctx.fillStyle = '#4a5c2c';
  for (let i = -3; i <= 3; i++) {
    ctx.fillRect(cx + i * 14 + reedShift, cy - 8, 4, 16);
  }
  ctx.fillStyle = '#5c7038';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(cx + i * 16 - reedShift, cy - 14, 3, 14);
  }

  // Massive legs, root-like, fused with fen growth
  ctx.fillStyle = '#5a5648';
  ctx.fillRect(cx - 34, cy - 46, 26, 40);
  ctx.fillRect(cx +  8, cy - 46, 26, 40);
  ctx.fillStyle = '#464236';
  ctx.fillRect(cx - 36, cy -  6, 28,  8);
  ctx.fillRect(cx +  8, cy -  6, 28,  8);
  // Reeds growing directly out of the legs
  ctx.fillStyle = '#5c7038';
  ctx.fillRect(cx - 28, cy - 50, 3, 12);
  ctx.fillRect(cx + 20, cy - 50, 3, 12);

  // Vast torso — layered like ancient bound armor grown over
  [
    { dy: -128, w: 62, c: '#565246' },
    { dy: -116, w: 78, c: '#605c4e' },
    { dy: -104, w: 90, c: '#6a6656' },
    { dy:  -92, w: 96, c: '#726e5c' },
    { dy:  -80, w: 92, c: '#6a6656' },
    { dy:  -68, w: 80, c: '#605c4e' },
    { dy:  -56, w: 66, c: '#565246' },
  ].forEach(({ dy, w, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx - w / 2, cy + dy, w, 12);
  });

  // Fen grass growing across the chest and shoulders
  ctx.fillStyle = '#4a5c2c';
  ctx.fillRect(cx - 40, cy - 118, 6, 20);
  ctx.fillRect(cx - 24, cy - 126, 5, 16);
  ctx.fillRect(cx + 16, cy - 124, 5, 18);
  ctx.fillRect(cx + 34, cy - 116, 6, 20);
  ctx.fillStyle = '#5c7038';
  ctx.fillRect(cx - 6, cy - 130, 12, 10);

  // Binding straps / ancient contract-markings across the torso
  ctx.fillStyle = '#2e2a20';
  ctx.fillRect(cx - 46, cy - 100, 92, 5);
  ctx.fillRect(cx - 40, cy - 78, 80, 5);
  ctx.fillStyle = '#8a7838';
  ctx.fillRect(cx - 6, cy - 100, 12, 5); // a single sigil clasp, dull gold

  // Enormous arms, held perfectly still at its sides
  ctx.fillStyle = '#5a5648';
  ctx.fillRect(cx - 66, cy - 108, 24, 54);
  ctx.fillRect(cx + 42, cy - 108, 24, 54);
  ctx.fillStyle = '#464236';
  ctx.fillRect(cx - 68, cy - 56, 26, 12);
  ctx.fillRect(cx + 42, cy - 56, 26, 12);
  // Long still claws
  ctx.fillStyle = '#8c8874';
  ctx.fillRect(cx - 64, cy - 46, 6, 16);
  ctx.fillRect(cx - 54, cy - 44, 6, 14);
  ctx.fillRect(cx + 48, cy - 46, 6, 16);
  ctx.fillRect(cx + 58, cy - 44, 6, 14);

  // Neck
  ctx.fillStyle = '#524e42';
  ctx.fillRect(cx - 16, cy - 142, 32, 16);

  // Head — broad, ancient, expressionless
  ctx.fillStyle = '#605c4e';
  ctx.fillRect(cx - 26, cy - 172, 52, 32);
  ctx.fillStyle = '#6a6656';
  ctx.fillRect(cx - 24, cy - 172, 48, 10);
  // Grass crown, still growing from the skull
  ctx.fillStyle = '#4a5c2c';
  ctx.fillRect(cx - 20 + reedShift, cy - 180, 4, 12);
  ctx.fillRect(cx -  6,             cy - 184, 4, 14);
  ctx.fillRect(cx +  8,             cy - 182, 4, 13);
  ctx.fillRect(cx + 18 - reedShift, cy - 180, 4, 12);

  // Eyes — pale, perfectly steady, no reaction to anything
  ctx.fillStyle = '#0e0c08';
  ctx.fillRect(cx - 20, cy - 158, 15, 11);
  ctx.fillRect(cx +  5, cy - 158, 15, 11);
  ctx.fillStyle = '#d8d8c8';
  ctx.fillRect(cx - 17, cy - 155, 9, 6);
  ctx.fillRect(cx +  8, cy - 155, 9, 6);
  ctx.fillStyle = '#f4f4ec';
  ctx.fillRect(cx - 15, cy - 154, 3, 3);
  ctx.fillRect(cx + 10, cy - 154, 3, 3);

  // Sealed mouth — a single flat, ancient line, never moves
  ctx.fillStyle = '#3a362a';
  ctx.fillRect(cx - 14, cy - 144, 28, 4);
}

// Smuggler Guard — a rank-and-file fort guard. Trained but not personally
// invested ("this is a job to them, not a conviction"). Standard-issue
// metal armor, a straight sword held ready, no flourish.
function drawBattleSmugglerGuard(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.045) * 2);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 4, 24, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Legs — plain trousers, boots
  ctx.fillStyle = '#3a3630';
  ctx.fillRect(cx - 14, cy - 28, 12, 30);
  ctx.fillRect(cx +  2, cy - 28, 12, 30);
  ctx.fillStyle = '#241f1a';
  ctx.fillRect(cx - 15, cy -  2, 13, 7);
  ctx.fillRect(cx +  2, cy -  2, 13, 7);

  // Studded leather belt
  ctx.fillStyle = '#4a3620';
  ctx.fillRect(cx - 17, cy - 32, 34, 6);
  ctx.fillStyle = '#7a6440';
  ctx.fillRect(cx - 13, cy - 31, 3, 3);
  ctx.fillRect(cx +  1, cy - 31, 3, 3);
  ctx.fillRect(cx + 10, cy - 31, 3, 3);

  // Torso — plain steel cuirass, no ornamentation
  ctx.fillStyle = '#585c5e';
  ctx.fillRect(cx - 18 + sway, cy - 66, 36, 34);
  ctx.fillStyle = '#686c6e';
  ctx.fillRect(cx - 15 + sway, cy - 63, 30, 8);
  // Centre seam
  ctx.fillStyle = '#484c4e';
  ctx.fillRect(cx - 2 + sway, cy - 64, 4, 30);

  // Shoulder plates — simple, riveted
  ctx.fillStyle = '#4c5052';
  ctx.fillRect(cx - 28 + sway, cy - 64, 14, 16);
  ctx.fillRect(cx + 14 + sway, cy - 64, 14, 16);
  ctx.fillStyle = '#787c7e';
  ctx.fillRect(cx - 24 + sway, cy - 62, 3, 3);
  ctx.fillRect(cx + 21 + sway, cy - 62, 3, 3);

  // Back (shield) arm
  ctx.fillStyle = '#3a3630';
  ctx.fillRect(cx - 34 + sway, cy - 56, 12, 24);
  ctx.fillStyle = '#5a4a34';
  ctx.beginPath(); ctx.ellipse(cx - 34 + sway, cy - 30, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#463a28';
  ctx.beginPath(); ctx.ellipse(cx - 34 + sway, cy - 30, 5, 8, 0, 0, Math.PI * 2); ctx.fill();

  // Sword arm — forward, blade raised and ready
  ctx.fillStyle = '#3a3630';
  ctx.fillRect(cx + 16 + sway, cy - 60, 22, 11);
  ctx.fillStyle = '#a8a4a0';
  ctx.fillRect(cx + 34 + sway, cy - 84, 8, 44);   // blade
  ctx.fillStyle = '#d8d4d0';
  ctx.fillRect(cx + 35 + sway, cy - 84, 3, 40);   // edge gleam
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(cx + 30 + sway, cy - 42, 16, 6);   // crossguard
  ctx.fillRect(cx + 34 + sway, cy - 38, 8, 12);   // grip
  ctx.fillStyle = '#7a5a2a';
  ctx.fillRect(cx + 33 + sway, cy - 28, 10, 6);   // pommel

  // Neck
  ctx.fillStyle = '#c8a888';
  ctx.fillRect(cx - 7 + sway, cy - 76, 14, 12);

  // Head — open-faced steel cap, plain human face
  ctx.fillStyle = '#c8a888';
  ctx.fillRect(cx - 12 + sway, cy - 100, 24, 24);
  ctx.fillStyle = '#585c5e';
  ctx.fillRect(cx - 14 + sway, cy - 102, 28, 10); // cap brim
  ctx.fillRect(cx -  9 + sway, cy - 112, 18, 12); // cap dome
  ctx.fillStyle = '#484c4e';
  ctx.fillRect(cx -  2 + sway, cy - 112, 4, 12);  // cap ridge

  // Eyes — plain, watching, unremarkable
  ctx.fillStyle = '#241f1a';
  ctx.fillRect(cx - 8 + sway, cy - 92, 6, 5);
  ctx.fillRect(cx + 2 + sway, cy - 92, 6, 5);

  // Mouth — flat, unbothered
  ctx.fillStyle = '#6a4a38';
  ctx.fillRect(cx - 6 + sway, cy - 82, 12, 3);
}

// Polwick — the fort's charismatic, half-drunk enforcer. Young-ish, medium-
// length copper-red hair (the Firelit marker — unmistakable, out of place
// against the grubby tunic), swaggering rather than armored. Fights
// bare-handed, confidently — and sometimes with fire.
function drawBattlePolwick(cx, cy) {
  const sway = Math.round(Math.sin(tick * 0.06) * 3);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 4, 22, 7, 0, 0, Math.PI * 2); ctx.fill();

  // Legs — worn trousers, scuffed boots
  ctx.fillStyle = '#4a4438';
  ctx.fillRect(cx - 13, cy - 28, 11, 30);
  ctx.fillRect(cx +  2, cy - 28, 11, 30);
  ctx.fillStyle = '#2c281e';
  ctx.fillRect(cx - 14, cy -  2, 12, 7);
  ctx.fillRect(cx +  2, cy -  2, 12, 7);

  // Tunic — dirty, untucked, uneven hem
  ctx.fillStyle = '#8a7c58';
  ctx.fillRect(cx - 17 + sway, cy - 62, 34, 34);
  ctx.fillStyle = '#7a6c48';
  ctx.fillRect(cx - 17 + sway, cy - 32, 8, 6);
  ctx.fillRect(cx +  9 + sway, cy - 30, 8, 6);
  // Dirt/stain patches
  ctx.fillStyle = '#5c5238';
  ctx.fillRect(cx - 10 + sway, cy - 52, 9, 7);
  ctx.fillRect(cx +  4 + sway, cy - 40, 7, 6);
  ctx.fillStyle = '#3a3424';
  ctx.fillRect(cx - 4 + sway, cy - 46, 5, 4);
  // Loose belt, slightly askew
  ctx.fillStyle = '#3a2c1a';
  ctx.fillRect(cx - 16 + sway, cy - 34, 32, 5);

  // Back arm, loose at his side
  ctx.fillStyle = '#8a7c58';
  ctx.fillRect(cx - 30 + sway, cy - 56, 12, 26);
  ctx.fillStyle = '#c8a888';
  ctx.fillRect(cx - 30 + sway, cy - 32, 11, 10);

  // Forward arm — cocked, fist ready, confident stance
  ctx.fillStyle = '#8a7c58';
  ctx.fillRect(cx + 16 + sway, cy - 60, 18, 11);
  ctx.fillStyle = '#c8a888';
  ctx.fillRect(cx + 30 + sway, cy - 54, 13, 13);
  // Knuckles
  ctx.fillStyle = '#a8886c';
  ctx.fillRect(cx + 32 + sway, cy - 52, 3, 3);
  ctx.fillRect(cx + 37 + sway, cy - 52, 3, 3);

  // Neck
  ctx.fillStyle = '#c8a888';
  ctx.fillRect(cx - 6 + sway, cy - 72, 12, 12);

  // Head — young face, faint flush from drink
  ctx.fillStyle = '#c8a888';
  ctx.fillRect(cx - 12 + sway, cy - 96, 24, 24);
  ctx.fillStyle = '#d4a898';
  ctx.fillRect(cx - 9 + sway, cy - 84, 8, 6); // flushed cheek

  // Copper-red hair — medium length, a little unkempt. Firelit: red/copper is
  // the thread's hair marker (LORE.md, The Eight Threads), matching his fire
  // attack and the Observe text.
  ctx.fillStyle = '#c05a20';
  ctx.fillRect(cx - 14 + sway, cy - 100, 28, 12); // top
  ctx.fillRect(cx - 16 + sway, cy - 92, 5, 18);   // left side, past the jaw
  ctx.fillRect(cx + 11 + sway, cy - 92, 5, 16);   // right side
  ctx.fillStyle = '#e08040';
  ctx.fillRect(cx - 10 + sway, cy - 100, 20, 5);  // highlight

  // Eyes — half-lidded, sure of himself
  ctx.fillStyle = '#241f1a';
  ctx.fillRect(cx - 8 + sway, cy - 86, 6, 4);
  ctx.fillRect(cx + 2 + sway, cy - 86, 6, 4);
  // Eyebrow tilt, cocky
  ctx.fillStyle = '#3a2c1a';
  ctx.fillRect(cx - 9 + sway, cy - 89, 7, 2);
  ctx.fillRect(cx + 2 + sway, cy - 89, 7, 2);

  // Mouth — smirking
  ctx.fillStyle = '#8a4838';
  ctx.fillRect(cx - 5 + sway, cy - 78, 10, 3);
  ctx.fillStyle = '#6a3828';
  ctx.fillRect(cx + 2 + sway, cy - 78, 3, 3);
}

// Essa — fighting for something she believes in, with nothing left to
// lose. Long brown hair, fire-red eyes, a drawn bow. Lean, fast, precise.
function drawBattleEssa(cx, cy) {
  const draw = 0.5 + Math.sin(tick * 0.07) * 0.5; // bowstring draw tension

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 4, 20, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Legs — mid-stride archer's stance
  ctx.fillStyle = '#3a2e2a';
  ctx.fillRect(cx - 15, cy - 28, 10, 30);
  ctx.fillRect(cx +  4, cy - 26, 10, 28);
  ctx.fillStyle = '#241a16';
  ctx.fillRect(cx - 16, cy -  2, 11, 6);
  ctx.fillRect(cx +  4, cy -  2, 11, 6);

  // Tunic/vest — lean, practical
  ctx.fillStyle = '#5c4636';
  ctx.fillRect(cx - 15, cy - 60, 30, 32);
  ctx.fillStyle = '#4a3828';
  ctx.fillRect(cx - 15, cy - 34, 30, 6); // belt line
  ctx.fillStyle = '#6a5240';
  ctx.fillRect(cx - 12, cy - 58, 8, 4); // collar detail

  // Quiver on her back
  ctx.fillStyle = '#3a2c20';
  ctx.fillRect(cx + 10, cy - 66, 9, 26);
  ctx.fillStyle = '#8a6c48';
  ctx.fillRect(cx + 11, cy - 72, 2, 10);
  ctx.fillRect(cx + 14, cy - 74, 2, 12);
  ctx.fillRect(cx + 17, cy - 72, 2, 10);

  // Back arm, drawing the string to her cheek
  ctx.fillStyle = '#5c4636';
  ctx.fillRect(cx - 10, cy - 62, 22, 9);
  ctx.fillStyle = '#c89078';
  ctx.fillRect(cx - 16, cy - 60, 10, 9);

  // Bow arm, extended forward, steady
  ctx.fillStyle = '#5c4636';
  ctx.fillRect(cx + 14, cy - 58, 20, 9);
  ctx.fillStyle = '#c89078';
  ctx.fillRect(cx + 32, cy - 56, 9, 9);

  // The bow itself — curved, drawn
  ctx.strokeStyle = '#4a3420';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx + 40, cy - 84);
  ctx.quadraticCurveTo(cx + 46 - draw * 6, cy - 52, cx + 40, cy - 20);
  ctx.stroke();
  // Bowstring, drawn back toward her cheek
  ctx.strokeStyle = '#d8d0c0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx + 40, cy - 84);
  ctx.lineTo(cx + 12 - draw * 8, cy - 55);
  ctx.lineTo(cx + 40, cy - 20);
  ctx.stroke();
  // Nocked arrow
  ctx.strokeStyle = '#6a5030';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + 12 - draw * 8, cy - 55);
  ctx.lineTo(cx + 48, cy - 55);
  ctx.stroke();
  ctx.fillStyle = '#a8a4a0';
  ctx.beginPath();
  ctx.moveTo(cx + 48, cy - 58); ctx.lineTo(cx + 56, cy - 55); ctx.lineTo(cx + 48, cy - 52);
  ctx.closePath(); ctx.fill();

  // Neck
  ctx.fillStyle = '#c89078';
  ctx.fillRect(cx - 5, cy - 70, 10, 10);

  // Head
  ctx.fillStyle = '#c89078';
  ctx.fillRect(cx - 11, cy - 92, 22, 22);

  // Long brown hair, unmistakably falling well past the shoulders
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(cx - 13, cy - 96, 26, 12);      // top/crown
  ctx.fillRect(cx - 16, cy - 86, 7, 52);       // left length, past the waistline
  ctx.fillRect(cx + 11, cy - 86, 7, 56);       // right length, longer still
  ctx.fillStyle = '#3e2a18';
  ctx.fillRect(cx - 15, cy - 40, 5, 14);       // left tapered tail-end
  ctx.fillRect(cx + 12, cy - 36, 5, 14);       // right tapered tail-end
  ctx.fillStyle = '#5c4028';
  ctx.fillRect(cx - 9, cy - 96, 18, 5);        // hair highlight
  ctx.fillRect(cx - 15, cy - 78, 3, 24);       // strand highlight, left
  ctx.fillRect(cx + 12, cy - 78, 3, 26);       // strand highlight, right

  // Eyes — fire-red, focused down the shaft
  const eyeGlow = 0.7 + Math.sin(tick * 0.1) * 0.25;
  ctx.fillStyle = '#1c0e08';
  ctx.fillRect(cx - 8, cy - 82, 7, 6);
  ctx.fillRect(cx + 2, cy - 82, 7, 6);
  ctx.fillStyle = `rgba(230,40,20,${eyeGlow})`;
  ctx.fillRect(cx - 7, cy - 81, 5, 4);
  ctx.fillRect(cx + 3, cy - 81, 5, 4);
  ctx.fillStyle = '#ffb0a0';
  ctx.fillRect(cx - 6, cy - 80, 2, 2);
  ctx.fillRect(cx + 4, cy - 80, 2, 2);

  // Mouth — set, focused
  ctx.fillStyle = '#8a5040';
  ctx.fillRect(cx - 4, cy - 72, 8, 2);
}

// Rainfish — one representative of the school. Translucent, drippy,
// hovering in place with a quizzical expression -- the fight is desperate
// and fast in mechanical terms (extreme speed, fragile), but the sprite
// itself just looks politely confused to be here.
function drawBattleRainfish(cx, cy) {
  const bob  = Math.round(Math.sin(tick * 0.09) * 5);
  const tilt = Math.sin(tick * 0.05) * 0.15; // quizzical head-tilt
  const sy = cy + bob;

  // Ripple shadow on the water below
  ctx.fillStyle = 'rgba(60,120,140,0.2)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 10, 24, 6, 0, 0, Math.PI * 2); ctx.fill();

  // Drip droplets, falling from the body
  ctx.fillStyle = 'rgba(140,210,220,0.5)';
  ctx.beginPath(); ctx.ellipse(cx - 6, sy + 22, 2, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 10, sy + 26, 2, 4, 0, 0, Math.PI * 2); ctx.fill();

  ctx.save();
  ctx.translate(cx, sy);
  ctx.rotate(tilt);

  // Translucent tail fin
  ctx.fillStyle = 'rgba(120,200,215,0.55)';
  ctx.beginPath();
  ctx.moveTo(-28, -4); ctx.lineTo(-42, -16); ctx.lineTo(-42, 8); ctx.closePath();
  ctx.fill();

  // Translucent dorsal fin
  ctx.fillStyle = 'rgba(120,200,215,0.5)';
  ctx.beginPath();
  ctx.moveTo(-6, -22); ctx.lineTo(8, -34); ctx.lineTo(14, -20); ctx.closePath();
  ctx.fill();

  // Body — glossy, see-through
  ctx.fillStyle = 'rgba(150,215,225,0.55)';
  ctx.beginPath(); ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(190,235,238,0.5)';
  ctx.beginPath(); ctx.ellipse(4, -6, 20, 12, 0, 0, Math.PI * 2); ctx.fill();
  // A faint hint of visible innards/bones through the translucent body
  ctx.fillStyle = 'rgba(90,150,160,0.35)';
  ctx.fillRect(-14, -3, 22, 3);
  ctx.fillRect(-10, 3, 16, 3);

  // Glossy highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.ellipse(-6, -10, 8, 4, -0.3, 0, Math.PI * 2); ctx.fill();

  // Side fin, small
  ctx.fillStyle = 'rgba(120,200,215,0.5)';
  ctx.beginPath(); ctx.ellipse(6, 12, 10, 6, 0.5, 0, Math.PI * 2); ctx.fill();

  // Quizzical face -- one eyebrow-equivalent (a small raised fin-brow)
  // raised higher than the other, eyes slightly asymmetric, mouth in a
  // small "?" pucker rather than a threat display.
  ctx.fillStyle = 'rgba(30,60,60,0.7)';
  ctx.beginPath(); ctx.ellipse(16, -4, 5, 6, 0, 0, Math.PI * 2); ctx.fill();  // lower/left eye
  ctx.beginPath(); ctx.ellipse(24, -9, 4.5, 5.5, 0, 0, Math.PI * 2); ctx.fill(); // higher/right eye -- asymmetry reads as "quizzical"
  ctx.fillStyle = 'rgba(230,250,250,0.9)';
  ctx.fillRect(15, -6, 2, 2);
  ctx.fillRect(23, -11, 2, 2);
  // Little raised brow-fin over the higher eye
  ctx.fillStyle = 'rgba(120,200,215,0.6)';
  ctx.fillRect(21, -17, 6, 2);

  // Small "o" mouth, pursed in confusion rather than aggression
  ctx.fillStyle = 'rgba(30,60,60,0.6)';
  ctx.beginPath(); ctx.ellipse(26, 4, 3, 3, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Tallyman — the thing in the Deep Works sealed room. Tall past the point of
// sense, stooped as if the ceiling has always been too low for it. Brick-dust
// grey, a pale flat face with no features but a horizontal seam, and hands of
// long thin fingers held slightly apart -- the kind of fingers that cut
// notches. It sways very slowly. It is not in a hurry. It has never been in
// a hurry.
function drawBattleTallyman(cx, cy) {
  const sway  = Math.sin(tick * 0.03) * 3;          // slow, patient sway
  const breath = Math.sin(tick * 0.05) * 1.5;
  const bx = cx + sway;

  // Shadow pooled at its feet
  ctx.fillStyle = 'rgba(10,12,10,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2, 30, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs — too thin, too long
  ctx.fillStyle = '#3a3a36';
  ctx.fillRect(bx - 9, cy - 46, 5, 48);
  ctx.fillRect(bx + 4, cy - 46, 5, 48);

  // Torso — a narrow slab, stooped forward at the top
  ctx.fillStyle = '#46443e';
  ctx.fillRect(bx - 13, cy - 96 + breath, 26, 54);
  ctx.fillStyle = '#52504a';
  ctx.fillRect(bx - 10, cy - 92 + breath, 20, 44);
  // Brick-dust streaks down the body
  ctx.fillStyle = '#3a382f';
  ctx.fillRect(bx - 6, cy - 88 + breath, 2, 34);
  ctx.fillRect(bx + 3, cy - 82 + breath, 2, 28);

  // Stooped shoulders and a forward-hung neck
  ctx.fillStyle = '#46443e';
  ctx.fillRect(bx - 17, cy - 100 + breath, 34, 10);
  ctx.fillRect(bx - 3, cy - 112 + breath, 8, 16);

  // Head — hung low, pale, flat. No eyes. A single horizontal seam.
  ctx.fillStyle = '#b8b2a0';
  ctx.fillRect(bx - 8, cy - 126 + breath, 18, 17);
  ctx.fillStyle = '#a49e8c';
  ctx.fillRect(bx - 8, cy - 126 + breath, 18, 4);
  ctx.fillStyle = '#2a2822';
  ctx.fillRect(bx - 6, cy - 117 + breath, 14, 1);   // the seam

  // Arms — hanging past the knees, swaying a half-beat behind the body
  const armSway = Math.sin(tick * 0.03 - 0.6) * 4;
  ctx.fillStyle = '#3a3a36';
  ctx.fillRect(bx - 20 + armSway * 0.4, cy - 92 + breath, 5, 62);
  ctx.fillRect(bx + 15 + armSway * 0.4, cy - 92 + breath, 5, 62);

  // Hands — splayed fans of long thin fingers, held slightly open
  ctx.fillStyle = '#b8b2a0';
  for (let i = 0; i < 4; i++) {
    ctx.fillRect(bx - 22 + i * 3 + armSway * 0.4, cy - 30, 1, 12 + (i % 2) * 4);
    ctx.fillRect(bx + 13 + i * 3 + armSway * 0.4, cy - 30, 1, 12 + ((i + 1) % 2) * 4);
  }
}

// Every name drawBattleEnemy() below has a dedicated case for. Kept as an
// explicit Set (not derived by parsing this file's source, which isn't
// possible from the browser) so validateEnemies() (validation.js) can catch
// an enemy template with no battle sprite mapping -- exactly the bug class
// that used to leave enemies rendering nothing at all in combat before the
// generic fallback (drawBattleGenericEnemy(), below) was added as a safety
// net. Hollow/Fen Shade/Tomb Sentry/Crypt Revenant/Wall Tendril/Dripping
// Maw/The Seep/Pale Drowned/Silt Hag/Pale Sentry/Smuggler Guard/Polwick/
// Essa/Rainfish all got dedicated sprites after initially relying on that
// fallback. The last four (scripted stat objects in combat.js, outside any
// *_ENEMY_TEMPLATES pool) are structurally invisible to validateEnemies()
// (see architecture.md's "Validation" section) -- they're covered here
// only because someone checked render-battle.js's dispatch by hand, not
// because the linter ever warned about them. If you add a new scripted
// enemy the same way, do the same manual check; don't assume a clean
// validateGameData() run means every enemy has a sprite. Keep this Set in
// sync with the if/else chain in drawBattleEnemy() -- add a name
// here whenever you add a dedicated `else if` case there.
const BATTLE_SPRITE_NAMES = new Set([
  'Marsh Wisp', 'Stone Crawler', 'Briar Hound', 'Bone Guard', 'Shade Wraith',
  'Crypt Fiend', 'Void Walker', 'Fen Witch', 'Wrongteeth', 'Briar Warden',
  'Reed Grappler', 'Silt Lurker', 'Mulholland', 'Corpse Slug', 'Den Wraith',
  'Kolm', '23', 'Rotwood Troll', 'Bog Serpent', 'Fen Lurker', 'Thornback',
  'Silt Crab', 'Mudflat Strider', 'Hollow', 'Fen Shade', 'Tomb Sentry',
  'Crypt Revenant', 'Wall Tendril', 'Dripping Maw', 'The Seep',
  'Pale Drowned', 'Silt Hag', 'Pale Sentry', 'Smuggler Guard', 'Polwick',
  'Essa', 'Rainfish', 'Tallyman',
]);
window.BATTLE_SPRITE_NAMES = BATTLE_SPRITE_NAMES;

// Generic fallback silhouette -- used for any enemy name not covered by a
// dedicated sprite above, so an enemy is never literally invisible in
// combat. Deliberately plain/featureless (a name-plate is still shown
// elsewhere in the combat UI) rather than trying to look bespoke; add a
// real sprite (and a name to BATTLE_SPRITE_NAMES) for any enemy that
// deserves its own look instead of leaning on this long-term.
function drawBattleGenericEnemy(cx, cy) {
  ctx.fillStyle = 'rgba(0,0,0,0.30)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + 4, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#6a6a72';
  ctx.fillRect(cx - 20, cy - 70, 40, 62); // body
  ctx.fillStyle = '#7a7a82';
  ctx.fillRect(cx - 14, cy - 96, 28, 28); // head
  ctx.fillStyle = '#3a3a40';
  ctx.fillRect(cx - 8,  cy - 86, 6, 6);   // eyes
  ctx.fillRect(cx + 2,  cy - 86, 6, 6);
}

function drawBattleEnemy(cx, cy) {
  if (!combat.enemy) return;
  const n = combat.enemy.name;
  if      (n === 'Marsh Wisp')    drawBattleWisp(cx, cy);
  else if (n === 'Stone Crawler') drawBattleStoneCrawler(cx, cy + 62);
  else if (n === 'Briar Hound')   drawBattleBriarHound(cx, cy + 58);
  else if (n === 'Bone Guard')    drawBattleBoneGuard(cx, cy + 62);
  else if (n === 'Shade Wraith')  drawBattleShadeWraith(cx, cy + 30);
  else if (n === 'Crypt Fiend')   drawBattleCryptFiend(cx, cy + 62);
  else if (n === 'Void Walker')   drawBattleVoidWalker(cx, cy + 30);
  else if (n === 'Fen Witch')     drawBattleFenWitch(cx, cy + 40);
  else if (n === 'Wrongteeth')    drawBattleWrongteeth(cx, cy + 40);
  else if (n === 'Briar Warden')  drawBattleBriarWarden(cx, cy + 55);
  else if (n === 'Reed Grappler') drawBattleReedGrappler(cx, cy + 62);
  else if (n === 'Silt Lurker')   drawBattleSiltLurker(cx, cy + 30);
  else if (n === 'Mulholland')    drawBattleMulholland(cx, cy + 55);
  else if (n === 'Corpse Slug')   drawBattleCorpseSlug(cx, cy + 62);
  else if (n === 'Den Wraith')    drawBattleDenWraith(cx, cy + 30);
  else if (n === 'Kolm')          drawBattleSailorBrawler(cx, cy + 62);
  else if (n === '23')            drawBattle23(cx, cy);
  else if (n === 'Rotwood Troll') drawBattleRotwoodTroll(cx, cy + 60);
  else if (n === 'Bog Serpent')   drawBattleBogSerpent(cx, cy + 50);
  else if (n === 'Fen Lurker')    drawBattleFenLurker(cx, cy + 40);
  else if (n === 'Thornback')     drawBattleThornback(cx, cy + 55);
  else if (n === 'Silt Crab')         drawBattleSiltCrab(cx, cy + 50);
  else if (n === 'Mudflat Strider')   drawBattleMudflatStrider(cx, cy + 20);
  else if (n === 'Hollow')            drawBattleHollow(cx, cy + 62);
  else if (n === 'Fen Shade')         drawBattleFenShade(cx, cy + 20);
  else if (n === 'Tomb Sentry')       drawBattleTombSentry(cx, cy + 62);
  else if (n === 'Crypt Revenant')    drawBattleCryptRevenant(cx, cy + 40);
  else if (n === 'Wall Tendril')      drawBattleWallTendril(cx, cy + 20);
  else if (n === 'Dripping Maw')      drawBattleDrippingMaw(cx, cy + 10);
  else if (n === 'The Seep')          drawBattleTheSeep(cx, cy + 30);
  else if (n === 'Pale Drowned')      drawBattlePaleDrowned(cx, cy + 30);
  else if (n === 'Silt Hag')          drawBattleSiltHag(cx, cy + 40);
  else if (n === 'Pale Sentry')       drawBattlePaleSentry(cx, cy + 58);
  else if (n === 'Smuggler Guard')    drawBattleSmugglerGuard(cx, cy + 62);
  else if (n === 'Polwick')           drawBattlePolwick(cx, cy + 58);
  else if (n === 'Essa')              drawBattleEssa(cx, cy + 55);
  else if (n === 'Rainfish')          drawBattleRainfish(cx, cy + 20);
  else if (n === 'Tallyman')          drawBattleTallyman(cx, cy + 62);
  else                            drawBattleGenericEnemy(cx, cy + 40);
}


// ─── Fire-cast animation (Polwick) ───────────────────────────────────────────
// A layered flame blob: outer glow → orange body → yellow inner → white core,
// with a small per-frame flicker in radius. Used both for the travelling
// fireball and the tongues of flame in the burst.
function drawFlameBall(x, y, r, alpha) {
  const fr = r * (0.85 + 0.15 * Math.sin(tick * 0.5 + x));
  ctx.fillStyle = `rgba(200,60,20,${(0.45 * alpha).toFixed(3)})`;
  ctx.beginPath(); ctx.arc(x, y, fr * 1.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(240,130,30,${(0.85 * alpha).toFixed(3)})`;
  ctx.beginPath(); ctx.arc(x, y, fr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(250,200,70,${alpha.toFixed(3)})`;
  ctx.beginPath(); ctx.arc(x, y, fr * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,246,222,${alpha.toFixed(3)})`;
  ctx.beginPath(); ctx.arc(x, y, fr * 0.28, 0, Math.PI * 2); ctx.fill();
}

// Plays while combat.fireCastTimer > 0: Polwick gathers fire at his hand, hurls
// it across the field, and it blooms over the player. Progress runs 0→1 as the
// timer counts down.
function drawFireCast() {
  if (combat.fireCastTimer <= 0) return;
  const t  = 1 - combat.fireCastTimer / FIRE_CAST_FRAMES;   // 0..1
  const sx = 338, sy = 206;   // Polwick's outstretched hand
  const tx = 122, ty = 236;   // the player

  if (t < 0.35) {
    // Charge — a flame gathers and grows at the hand.
    const c = t / 0.35;
    drawFlameBall(sx, sy, 4 + c * 9, 0.6 + 0.4 * c);
  } else if (t < 0.82) {
    // Fly — the fireball streaks toward the player with a fading ember tail.
    const f  = (t - 0.35) / 0.47;
    const bx = sx + (tx - sx) * f;
    const by = sy + (ty - sy) * f;
    for (let i = 5; i >= 1; i--) {
      const tf = Math.max(0, f - i * 0.05);
      const ex = sx + (tx - sx) * tf;
      const ey = sy + (ty - sy) * tf;
      ctx.fillStyle = `rgba(240,150,40,${(0.32 * (1 - i / 6)).toFixed(3)})`;
      ctx.beginPath(); ctx.arc(ex, ey, 9 - i, 0, Math.PI * 2); ctx.fill();
    }
    drawFlameBall(bx, by, 12, 1);
  } else {
    // Burst — flames bloom over the player and fade.
    const b = (t - 0.82) / 0.18;
    const R = 10 + b * 26;
    ctx.fillStyle = `rgba(255,120,30,${(0.5 * (1 - b)).toFixed(3)})`;
    ctx.beginPath(); ctx.arc(tx, ty, R, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + tick * 0.2;
      const fr  = R * (0.5 + 0.4 * Math.sin(tick * 0.4 + i));
      drawFlameBall(tx + Math.cos(ang) * fr, ty + Math.sin(ang) * fr * 0.7,
                    5 * (1 - b) + 2, 1 - b * 0.5);
    }
    drawFlameBall(tx, ty, 12 * (1 - b) + 4, 1 - b * 0.6);
  }
}

// ─── Text wrapping (combat message box) ───────────────────────────────────────
// Wraps text to fit maxWidth, breaking on spaces. Uses the *current*
// ctx.font, so callers must set that first. A single token wider than
// maxWidth on its own (shouldn't happen with real dialogue, but cheap to
// guard) is hard-broken character by character so nothing can ever measure
// wider than maxWidth.
function wrapMonospaceText(ctx, text, maxWidth) {
  const tokens = [];
  for (const word of text.split(' ')) {
    if (ctx.measureText(word).width <= maxWidth) {
      tokens.push(word);
      continue;
    }
    let chunk = '';
    for (const ch of word) {
      if (chunk && ctx.measureText(chunk + ch).width > maxWidth) {
        tokens.push(chunk);
        chunk = ch;
      } else {
        chunk += ch;
      }
    }
    if (chunk) tokens.push(chunk);
  }
  const lines = [];
  let current = '';
  for (const tok of tokens) {
    const candidate = current ? current + ' ' + tok : tok;
    if (!current || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      lines.push(current);
      current = tok;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── Combat Screen ────────────────────────────────────────────────────────────
function drawCombat() {
  const W = 512, H = 480;

  // White-flash transition for the first 8 frames
  if (combat.flashTimer > 0) {
    ctx.fillStyle = '#dceef8';
    ctx.fillRect(0, 0, W, H);
    return;
  }

  // ── Battle field (y = 0..295) ──────────────────────────────────────────────

  // Sky — gradient bands deepening toward zenith
  ctx.fillStyle = '#070e18';  ctx.fillRect(0,   0, W,  50);
  ctx.fillStyle = '#09121e';  ctx.fillRect(0,  50, W,  50);
  ctx.fillStyle = '#0d1826';  ctx.fillRect(0, 100, W,  50);
  ctx.fillStyle = '#111e2e';  ctx.fillRect(0, 150, W,  38);

  // Stars — fixed positions, some twinkle asynchronously
  const STARS = [
    {x:  28, y: 15}, {x:  68, y:  7}, {x: 115, y: 30}, {x: 158, y: 11},
    {x: 204, y: 24}, {x: 248, y:  5}, {x: 288, y: 38}, {x: 332, y: 14},
    {x: 374, y:  9}, {x: 418, y: 28}, {x: 456, y: 18}, {x: 490, y: 42},
    {x:  52, y: 50}, {x: 138, y: 55}, {x: 196, y: 46}, {x: 274, y: 62},
    {x: 348, y: 44}, {x: 438, y: 58}, {x:  88, y: 66}, {x: 308, y: 76},
    {x: 174, y: 80}, {x: 388, y: 82}, {x:  14, y: 72}, {x: 500, y: 22},
    {x: 228, y: 98}, {x: 462, y: 92}, {x:  76, y: 94}, {x: 326, y:100},
  ];
  STARS.forEach(s => {
    // Each star twinkles on a different cycle offset
    const phase = ((tick >> 4) + (s.x * 7 + s.y * 3)) & 7;
    const bright = phase < 6;
    ctx.fillStyle = bright ? '#9ac8d8' : '#d4eef8';
    const sz = phase === 0 ? 2 : 1;
    ctx.fillRect(s.x, s.y, sz, sz);
  });

  // Crescent moon — upper right
  const mx = 434, my = 12;
  // Soft glow halo
  ctx.fillStyle = 'rgba(180,220,240,0.08)';
  ctx.beginPath();
  ctx.ellipse(mx + 8, my + 9, 20, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  // Moon disc
  ctx.fillStyle = '#ccdce8';
  ctx.fillRect(mx + 1, my,     14, 2);
  ctx.fillRect(mx,     my + 2, 16, 12);
  ctx.fillRect(mx + 1, my + 14, 14, 2);
  // Bite — sky colour overlay creates crescent
  ctx.fillStyle = '#09121e';
  ctx.fillRect(mx + 5, my - 2, 14, 20);
  // Inner crescent rim (soft shadow)
  ctx.fillStyle = '#a8c0d0';
  ctx.fillRect(mx + 1, my + 4,  2, 8);
  ctx.fillRect(mx + 2, my + 2,  2, 2);
  ctx.fillRect(mx + 2, my + 12, 2, 2);

  // Horizon glow — warmer tint
  ctx.fillStyle = '#1e3448';  ctx.fillRect(0, 184, W, 3);
  ctx.fillStyle = '#182c40';  ctx.fillRect(0, 187, W, 3);
  ctx.fillStyle = '#142438';  ctx.fillRect(0, 190, W, 2);

  // Ground — perspective stripes (narrow at horizon, wider in foreground)
  const stripes = [3,3,3,4,4,5,5,6,6,7,8,9,10,11,13,15];
  let gy = 192;
  for (let i = 0; i < stripes.length && gy < 296; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#18283a' : '#1c3044';
    ctx.fillRect(0, gy, W, stripes[i]);
    gy += stripes[i];
  }
  if (gy < 296) { ctx.fillStyle = '#1c3044'; ctx.fillRect(0, gy, W, 296 - gy); }

  // Ground scatter — faint pebble flecks near foreground
  ctx.fillStyle = '#243850';
  [[62,272],[140,284],[255,268],[338,278],[430,264],[190,290],[480,282]].forEach(([sx,sy]) => {
    ctx.fillRect(sx, sy, 3, 1);
  });

  // Enemy sprite — right side, elevated (floating)
  drawBattleEnemy(358, 168);

  // Player battle sprite — left side, on the ground
  drawBattlePlayer(108, 254);

  // Polwick's fire cast — drawn over the sprites while the animation runs
  drawFireCast();

  // Enemy name + HP (top-left of battle field)
  ctx.fillStyle = '#c0dcd0';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText(combat.enemy.name, 16, 22);

  const ehpW = 130, ehpH = 7;
  ctx.fillStyle = '#0a1e18';
  ctx.fillRect(16, 26, ehpW, ehpH);
  const ehpFill = Math.round(ehpW * combat.enemy.hp / combat.enemy.maxHp);
  ctx.fillStyle = '#3a8a5a';
  ctx.fillRect(16, 26, ehpFill, ehpH);
  ctx.fillStyle = '#7ab898';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(`${combat.enemy.hp} / ${combat.enemy.maxHp}`, 16 + ehpW + 6, 33);

  // ── Combat UI panel (y = 297..477) ────────────────────────────────────────
  const PX = 8, PY = 297, PW = 496, PH = 175;
  const PAD = 14;

  ctx.fillStyle = '#08121e';
  ctx.fillRect(PX, PY, PW, PH);

  // Outer border
  ctx.strokeStyle = '#5a8a9a';
  ctx.lineWidth = 2;
  ctx.strokeRect(PX + 1, PY + 1, PW - 2, PH - 2);
  // Inner border
  ctx.strokeStyle = '#2a4e5e';
  ctx.lineWidth = 1;
  ctx.strokeRect(PX + 5, PY + 5, PW - 10, PH - 10);
  // Corner accents
  ctx.fillStyle = '#8ac8d8';
  ctx.fillRect(PX + 1,      PY + 1,      2, 2);
  ctx.fillRect(PX + PW - 3, PY + 1,      2, 2);
  ctx.fillRect(PX + 1,      PY + PH - 3, 2, 2);
  ctx.fillRect(PX + PW - 3, PY + PH - 3, 2, 2);

  // Message — word-wrapped to fit the panel. A single fillText() call here
  // used to let long lines (e.g. status-effect text like "Slithered! (SPD
  // randomized each turn)") run straight past the right edge of the box.
  // Capped at 2 lines (truncated with an ellipsis beyond that, though no
  // message in this game is currently long enough to hit it) so the layout
  // below can never grow without bound.
  const MSG_LINE_HEIGHT = 16;
  const MSG_MAX_LINES   = 2;
  const msgMaxWidth = PW - PAD * 2;
  ctx.fillStyle = '#ccd8cc';
  ctx.font = '14px "Courier New", monospace';
  let msgLines = wrapMonospaceText(ctx, combat.message, msgMaxWidth);
  if (msgLines.length > MSG_MAX_LINES) {
    const kept = msgLines.slice(0, MSG_MAX_LINES - 1);
    let rest = msgLines.slice(MSG_MAX_LINES - 1).join(' ');
    while (rest.length > 0 && ctx.measureText(rest + '\u2026').width > msgMaxWidth) {
      rest = rest.slice(0, -1);
    }
    kept.push(rest + '\u2026');
    msgLines = kept;
  }
  msgLines.forEach((line, i) => {
    ctx.fillText(line, PX + PAD, PY + 28 + i * MSG_LINE_HEIGHT);
  });
  // Everything below the message shifts down by however many extra lines it
  // took, so a wrapped 2-line message can't overlap the HP bar/status/menu.
  const shift = (msgLines.length - 1) * MSG_LINE_HEIGHT;

  // Rule
  ctx.fillStyle = '#1e3040';
  ctx.fillRect(PX + PAD, PY + 34 + shift, PW - PAD * 2, 1);

  // Player name + HP bar
  ctx.fillStyle = '#d0e0d0';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText(stats.name, PX + PAD, PY + 56 + shift);

  ctx.fillStyle = '#5a8898';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillText('HP', PX + PAD + 54, PY + 56 + shift);

  const pSegs = 12, pSegW = 10, pSegGap = 2;
  const pBarX = PX + PAD + 80, pBarY = PY + 45 + shift;
  const pFilled    = Math.round(pSegs * stats.hp / stats.maxHp);
  const pPoisoned  = hasStatusEffect('poison');
  const pMuddied   = hasStatusEffect('muddied');
  const pSlithered = hasStatusEffect('slither');
  const pBurning   = hasStatusEffect('burn');
  const pFillColor = pFilled <= 3 ? '#a06820'
                   : pBurning      ? '#c85028'
                   : pPoisoned     ? '#7a9820'
                   : pMuddied      ? '#9a8430'
                   : pSlithered    ? '#4a9aaa'
                   :                 '#4a9a62';
  for (let i = 0; i < pSegs; i++) {
    ctx.fillStyle = i < pFilled ? pFillColor : '#112820';
    ctx.fillRect(pBarX + i * (pSegW + pSegGap), pBarY, pSegW, 8);
  }
  ctx.fillStyle = '#8aaa98';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(`${stats.hp} / ${stats.maxHp}`, pBarX + pSegs * (pSegW + pSegGap) + 5, PY + 55 + shift);
  let pStatusY = PY + 68 + shift;
  if (pPoisoned) {
    ctx.fillStyle = '#a0c830';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('PSN', PX + PAD + 54, pStatusY);
    pStatusY += 11;
  }
  if (pMuddied) {
    ctx.fillStyle = '#c8a840';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('MUD', PX + PAD + 54, pStatusY);
    pStatusY += 11;
  }
  if (pSlithered) {
    ctx.fillStyle = '#40c8c8';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('SLI', PX + PAD + 54, pStatusY);
    pStatusY += 11;
  }
  if (pBurning) {
    // Flicker the burn tag warm so it reads as active fire.
    ctx.fillStyle = ((tick >> 3) & 1) ? '#f08028' : '#f0b040';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('BRN', PX + PAD + 54, pStatusY);
  }

  // Rule
  ctx.fillStyle = '#1e3040';
  ctx.fillRect(PX + PAD, PY + 68 + shift, PW - PAD * 2, 1);

  if (combat.phase === 'choose') {
    // ── Action menu ──────────────────────────────────────────────────────────
    const actionLabels = { attack: 'Attack', item: 'Item', observe: 'Observe', run: 'Run' };
    const options  = combatOptions();
    const actions  = options.map(id => actionLabels[id]);
    const optionW  = Math.floor((PW - PAD * 2) / options.length);
    const boxTop   = PY + 82 + shift;
    const boxH     = 40;

    actions.forEach((label, i) => {
      const ox       = PX + PAD + i * optionW;
      const selected = combat.cursor === i;
      ctx.fillStyle   = selected ? '#0e2434' : '#080f1a';
      ctx.fillRect(ox, boxTop, optionW - 6, boxH);
      ctx.strokeStyle = selected ? '#5a9aaa' : '#1e3040';
      ctx.lineWidth   = 1;
      ctx.strokeRect(ox, boxTop, optionW - 6, boxH);
      if (selected) {
        ctx.fillStyle = '#8ac8d8';
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.fillText('\u25b6', ox + 6, boxTop + 26);
      }
      ctx.fillStyle = selected ? '#e0f0e8' : '#4a7888';
      ctx.font = selected ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
      ctx.fillText(label, ox + (selected ? 22 : 14), boxTop + 26);
    });

    ctx.fillStyle = '#2a4858';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('\u2190 \u2192 select  \u00b7  enter confirm', PX + PW - PAD, PY + PH - 10);
    ctx.textAlign = 'left';

  } else if (combat.phase === 'item') {
    // ── Item subscreen ───────────────────────────────────────────────────────
    ctx.fillStyle = '#0a1a28';
    ctx.fillRect(PX + PAD, PY + 74 + shift, PW - PAD * 2, PH - 88 - shift);

    ctx.fillStyle = '#5a8898';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText('ITEMS', PX + PAD + 8, PY + 90 + shift);

    ctx.fillStyle = '#1e3040';
    ctx.fillRect(PX + PAD + 8, PY + 94 + shift, PW - PAD * 2 - 16, 1);

    const battleItems = inventoryItems();
    if (battleItems.length === 0) {
      ctx.fillStyle = '#2a4848';
      ctx.font = '12px "Courier New", monospace';
      ctx.fillText('no items', PX + PAD + 24, PY + 110 + shift);
    } else {
      battleItems.forEach((item, i) => {
        const iy       = PY + 110 + shift + i * 22;
        const selected = i === combat.itemCursor;
        if (selected) {
          ctx.fillStyle = '#0e2434';
          ctx.fillRect(PX + PAD + 6, iy - 13, PW - PAD * 2 - 12, 18);
          ctx.fillStyle = '#8ac8d8';
          ctx.font = 'bold 12px "Courier New", monospace';
          ctx.fillText('\u25b6', PX + PAD + 10, iy);
        }
        ctx.fillStyle = selected ? '#e0f0e8' : '#8aaaa0';
        ctx.font = selected ? 'bold 12px "Courier New", monospace' : '12px "Courier New", monospace';
        ctx.fillText(item.name, PX + PAD + 24, iy);
        ctx.fillStyle = '#4a8858';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText(`(${itemStatLabel(item)})`, PX + PAD + 24 + item.name.length * 7 + 4, iy);
      });
    }

    // [ Back ] entry at bottom of list
    const backIY    = PY + 110 + shift + battleItems.length * 22;
    const backSel   = combat.itemCursor === battleItems.length;
    if (backSel) {
      ctx.fillStyle = '#0e2434';
      ctx.fillRect(PX + PAD + 6, backIY - 13, PW - PAD * 2 - 12, 18);
      ctx.fillStyle = '#8ac8d8';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText('\u25b6', PX + PAD + 10, backIY);
    }
    ctx.fillStyle = backSel ? '#e0f0e8' : '#4a7888';
    ctx.font      = backSel ? 'bold 12px "Courier New", monospace' : '12px "Courier New", monospace';
    ctx.fillText('[ Back ]', PX + PAD + 24, backIY);

    ctx.fillStyle = '#2a4858';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('\u2191\u2193 select  \u00b7  enter confirm', PX + PW - PAD, PY + PH - 10);
    ctx.textAlign = 'left';

  } else if (combat.phase === 'message') {
    // ── Message: show advance prompt ─────────────────────────────────────────
    if ((tick >> 4) & 1) {
      ctx.fillStyle = '#8ac8d8';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('\u25b6 press ENTER', PX + PW - PAD, PY + PH - 10);
      ctx.textAlign = 'left';
    }

  } else if (combat.phase === 'victory') {
    // ── Victory overlay ──────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,30,10,0.82)';
    ctx.fillRect(PX + PAD, PY + 76 + shift, PW - PAD * 2, PH - 90 - shift);
    ctx.fillStyle = '#78e888';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VICTORY', PX + PW / 2, PY + 112 + shift);
    ctx.fillStyle = '#b0d8b8';
    ctx.font = '13px "Courier New", monospace';
    const _nxt = xpForNextLevel();
    const _xpStr = _nxt !== null ? `XP: ${stats.xp} / ${_nxt}` : `XP: ${stats.xp}  (max level)`;
    ctx.fillText(`Lv. ${stats.level}   ${_xpStr}`, PX + PW / 2, PY + 136 + shift);
    if ((tick >> 4) & 1) {
      ctx.fillStyle = '#5aaa6a';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('[ press ENTER to continue ]', PX + PW / 2, PY + PH - 14);
    }
    ctx.textAlign = 'left';

  } else if (combat.phase === 'defeat') {
    // ── Defeat overlay ───────────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(30,0,0,0.82)';
    ctx.fillRect(PX + PAD, PY + 76 + shift, PW - PAD * 2, PH - 90 - shift);
    ctx.fillStyle = '#e06060';
    ctx.font = 'bold 20px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEATED', PX + PW / 2, PY + 112 + shift);
    ctx.fillStyle = '#c09898';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('Gold lost. A day has passed.', PX + PW / 2, PY + 136 + shift);
    if ((tick >> 4) & 1) {
      ctx.fillStyle = '#aa5050';
      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillText('[ press ENTER to continue ]', PX + PW / 2, PY + PH - 14);
    }
    ctx.textAlign = 'left';
  }
}
