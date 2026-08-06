'use strict';

// render-ui.js — overlay panel rendering: continent map, Accord panel,
// choice box, dialogue box, main/pause menu, and the debug menu.

// ─── Continent Map Panel ─────────────────────────────────────────────────────
// Full-screen inspection panel opened when the player examines the wall map in
// the Calwick school (and, for continuity, the Calwick office). A stylised but
// professional Imperial school survey of the Continent, dated 1072 AC. Flavour /
// worldbuilding only -- not the playable map. Geography follows LORE.md: a
// southern-hemisphere continent (warm north, cold south) angling south-east
// toward its polar cape, laid out on the A-D / 1-4 development grid.
//
// Rendering is split into small helpers that share a projection object `m`
// ({ MX, MY, MW, MH, px(col), py(row) }) mapping grid coordinates -- columns
// A..D as 0..4, rows 1..4 as 0..4 -- to canvas pixels on the 512x480 `ctx`.

// Irregular coastline traced clockwise from the north-west, in [col,row] grid
// fractions. Corner squares stay mostly ocean; a westward notch near row 2.5
// is the Tidewave Chasm, and the south-east finger is Cape Denial.
const CM_COAST = [
  [0.75,0.62],[0.95,0.55],[1.12,0.61],[1.33,0.53],[1.55,0.60],[1.74,0.51],
  [1.98,0.56],[2.22,0.50],[2.48,0.58],[2.72,0.52],[2.93,0.61],[3.13,0.72],
  [3.30,0.92],[3.46,1.12],[3.55,1.36],[3.49,1.60],[3.62,1.84],[3.50,2.08],
  [3.64,2.30],[3.57,2.48],[3.18,2.54],[3.55,2.63],
  [3.72,2.82],[3.95,3.06],[3.90,3.30],[3.60,3.40],
  [3.30,3.52],[3.02,3.62],[2.74,3.86],[2.45,3.72],[2.14,3.52],[1.83,3.36],
  [1.52,3.20],[1.24,3.03],[1.03,2.83],
  [0.86,2.58],[0.71,2.33],[0.76,2.08],[0.64,1.84],[0.71,1.58],[0.60,1.34],
  [0.72,1.09],[0.67,0.84],
];

// Offshore island groups: [col, row, rx, ry] (radii in px).
const CM_ISLES = {
  fishing:  [[0.30,0.55,5,4],[0.46,0.76,4,3],[0.50,0.40,3,3],[0.22,0.66,3,2]],
  sugar:    [[2.40,0.28,3,3],[2.70,0.33,3,2]],
  trading:  [[3.52,0.50,4,3],[3.72,0.74,3,3],[3.38,0.38,3,2]],
  subpolar: [[0.40,3.42,4,3],[0.60,3.66,3,3],[0.28,3.14,3,2]],
  spindler: [[3.80,2.38,2,4],[3.86,2.60,2,3]],
};

function _cmProject(MX, MY, MW, MH) {
  return {
    MX: MX, MY: MY, MW: MW, MH: MH,
    px: function (col) { return MX + (col / 4) * MW; },
    py: function (row) { return MY + (row / 4) * MH; },
  };
}

// Trace (but do not fill) the mainland outline, so callers may fill or clip.
function _cmLandPath(m) {
  ctx.beginPath();
  for (let i = 0; i < CM_COAST.length; i++) {
    const x = m.px(CM_COAST[i][0]), y = m.py(CM_COAST[i][1]);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// A soft, slightly irregular blob (used for terrain patches and islands).
function _cmBlob(cx, cy, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + rx * 0.4, cy + ry * 0.2, rx * 0.7, ry * 0.7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.5, cy - ry * 0.3, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2); ctx.fill();
}

// Irregular inland-sea water body with a soft highlight.
function _cmWater(cx, cy, rx, ry) {
  ctx.fillStyle = '#6f92b0';
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.55, cy + ry * 0.25, rx * 0.5, ry * 0.55, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + rx * 0.5, cy - ry * 0.4, rx * 0.45, ry * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(150,185,215,0.4)';
  ctx.beginPath(); ctx.ellipse(cx - rx * 0.2, cy - ry * 0.2, rx * 0.45, ry * 0.35, 0, 0, Math.PI * 2); ctx.fill();
}

// A single hachured mountain caret: shaded right face + a couple of ridge lines.
function _cmMountain(x, y, s) {
  ctx.fillStyle = '#9b8f7c';
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.9, y + s * 0.6); ctx.lineTo(x - s * 0.9, y + s * 0.6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7c6f5c';
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.9, y + s * 0.6); ctx.lineTo(x, y + s * 0.6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(60,50,35,0.5)'; ctx.lineWidth = 0.6;
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x - s * 0.3, y + s * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.35, y + s * 0.5); ctx.stroke();
  ctx.lineWidth = 1;
}

// A labelled place-name with a parchment halo for legibility over terrain.
function _cmLabel(text, x, y, o) {
  o = o || {};
  const weight = o.bold ? 'bold ' : (o.italic ? 'italic ' : '');
  ctx.font = weight + (o.size || 7) + 'px "Courier New", monospace';
  ctx.textAlign = o.align || 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = o.halo || 'rgba(240,232,205,0.9)';
  const offs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1]];
  for (let i = 0; i < offs.length; i++) ctx.fillText(text, x + offs[i][0], y + offs[i][1]);
  ctx.fillStyle = o.color || '#2a1a0a';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

// ── Place-marker glyphs (all take pixel coordinates) ──────────────────────────
function _cmCapital(x, y) {
  ctx.fillStyle = '#a02020';
  ctx.beginPath(); ctx.moveTo(x, y - 4.5); ctx.lineTo(x + 4.5, y); ctx.lineTo(x, y + 4.5); ctx.lineTo(x - 4.5, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8c040'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
}
function _cmCity(x, y) {
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(x, y, 2.7, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f2e8ca'; ctx.beginPath(); ctx.arc(x, y, 1, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 1;
}
function _cmTown(x, y) {
  ctx.fillStyle = '#f2e8ca'; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
  ctx.strokeStyle = '#3a2410'; ctx.lineWidth = 0.8; ctx.strokeRect(x - 1.5, y - 1.5, 3, 3); ctx.lineWidth = 1;
}
function _cmFort(x, y) {
  ctx.fillStyle = '#4a3018';
  ctx.beginPath(); ctx.moveTo(x, y - 4.5); ctx.lineTo(x + 3, y + 2); ctx.lineTo(x - 3, y + 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a3018'; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(x, y - 4.5); ctx.lineTo(x, y - 7); ctx.stroke();
  ctx.fillStyle = '#a02020'; ctx.fillRect(x, y - 7, 3, 2); ctx.lineWidth = 1;
}
function _cmAcademyGlyph(x, y) {
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath(); ctx.moveTo(x - 5, y - 1); ctx.lineTo(x, y - 6); ctx.lineTo(x + 5, y - 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#cbb47a'; ctx.fillRect(x - 4, y - 1, 8, 5);
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 2.5, y + 0.5, 1.6, 3); ctx.fillRect(x + 1, y + 0.5, 1.6, 3);
}

function drawContinentMapPanel() {
  if (!continentMap.open) return;

  // ── Backdrop + framed parchment ───────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, 512, 480);

  const PX = 14, PY = 10, PW = 484, PH = 460;

  ctx.fillStyle = '#c9ba84';
  ctx.fillRect(PX, PY, PW, PH);
  ctx.fillStyle = '#d7c88c';
  ctx.fillRect(PX + 3, PY + 3, PW - 6, PH - 6);
  // Faint parchment mottling
  ctx.fillStyle = 'rgba(150,120,60,0.06)';
  for (let i = 0; i < 26; i++) {
    const rx = PX + 6 + ((i * 97) % (PW - 12));
    const ry = PY + 6 + ((i * 173) % (PH - 12));
    ctx.beginPath(); ctx.ellipse(rx, ry, 14, 9, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Institutional double frame + corner bolts
  ctx.strokeStyle = '#3a1e08'; ctx.lineWidth = 4; ctx.strokeRect(PX, PY, PW, PH);
  ctx.strokeStyle = '#7a5020'; ctx.lineWidth = 2; ctx.strokeRect(PX + 5, PY + 5, PW - 10, PH - 10);
  ctx.fillStyle = '#2a1008';
  const bolts = [[PX, PY], [PX + PW - 8, PY], [PX, PY + PH - 8], [PX + PW - 8, PY + PH - 8]];
  for (let i = 0; i < bolts.length; i++) {
    ctx.fillStyle = '#2a1008'; ctx.fillRect(bolts[i][0], bolts[i][1], 8, 8);
    ctx.fillStyle = '#a07030'; ctx.fillRect(bolts[i][0] + 2, bolts[i][1] + 2, 4, 4);
  }

  // ── Title block ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#2a1008'; ctx.textAlign = 'center';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.fillText('THE CONTINENT', 256, PY + 24);
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText('Imperial School Survey — 1072 AC', 256, PY + 38);
  ctx.fillStyle = '#8a6030'; ctx.fillRect(PX + 12, PY + 44, PW - 24, 1);
  ctx.textAlign = 'left';

  // ── Map field geometry + projection ───────────────────────────────────────
  const MX = 28, MY = 58, MW = 300, MH = 390;
  const m = _cmProject(MX, MY, MW, MH);

  // Ocean (desaturated blue, cool toward the south)
  const seaGrad = ctx.createLinearGradient(0, MY, 0, MY + MH);
  seaGrad.addColorStop(0, '#7d99b3');
  seaGrad.addColorStop(1, '#8fa7bd');
  ctx.fillStyle = seaGrad;
  ctx.fillRect(MX, MY, MW, MH);
  ctx.fillStyle = 'rgba(120,160,195,0.28)';
  for (let wy = MY + 20; wy < MY + MH - 6; wy += 16) ctx.fillRect(MX + 4, wy, MW - 8, 1);

  // ── Equatorial resonance storm: a violet-gold disturbance ABOVE the north
  //    coast, fading into clear ocean before it reaches land (not a wall). ─────
  const stormH = m.py(0.44) - MY;
  const stormGrad = ctx.createLinearGradient(0, MY, 0, MY + stormH);
  stormGrad.addColorStop(0, 'rgba(96,58,120,0.85)');
  stormGrad.addColorStop(0.55, 'rgba(150,96,168,0.45)');
  stormGrad.addColorStop(1, 'rgba(150,96,168,0)');
  ctx.fillStyle = stormGrad;
  ctx.fillRect(MX, MY, MW, stormH);
  ctx.strokeStyle = 'rgba(232,204,120,0.5)'; ctx.lineWidth = 1;
  for (let sx = MX - 8; sx < MX + MW; sx += 15) {
    ctx.beginPath();
    ctx.moveTo(sx, MY + 2);
    ctx.quadraticCurveTo(sx + 6, MY + stormH * 0.4, sx + 2, MY + stormH * 0.72);
    ctx.stroke();
  }
  _cmLabel('Equatorial Resonance Storm', MX + MW / 2, MY + 12, { size: 7, italic: true, color: '#e8d0a0', halo: 'rgba(60,30,80,0.7)' });

  // ── Mainland: sage lowland base, then layered terrain clipped to the coast ──
  _cmLandPath(m);
  ctx.fillStyle = '#8fa86a'; ctx.fill();

  ctx.save();
  _cmLandPath(m); ctx.clip();

  // Warm-north tint / cold-south tint
  ctx.fillStyle = 'rgba(206,158,70,0.12)'; ctx.fillRect(MX, m.py(0.4), MW, m.py(1.4) - m.py(0.4));
  ctx.fillStyle = 'rgba(150,180,210,0.16)'; ctx.fillRect(MX, m.py(2.9), MW, m.py(4) - m.py(2.9));

  // Ochre uplands: western spine skirts + southern (C3) uplands
  _cmBlob(m.px(0.82), m.py(1.7), 26, 62, '#c2a05e');
  _cmBlob(m.px(0.8), m.py(2.35), 24, 34, '#bd9a58');
  _cmBlob(m.px(2.55), m.py(2.45), 40, 30, '#c2a05e');

  // Granite shield (D2-D3): grey-green bedrock + conifer stipple
  _cmBlob(m.px(3.35), m.py(1.85), 34, 60, '#7f8a6e');
  ctx.fillStyle = '#3f5a34';
  for (let i = 0; i < 46; i++) {
    const fx = m.px(3.05 + ((i * 0.11) % 0.62));
    const fy = m.py(1.25 + ((i * 0.29) % 1.35));
    ctx.beginPath(); ctx.moveTo(fx, fy - 2.2); ctx.lineTo(fx + 1.6, fy + 1.4); ctx.lineTo(fx - 1.6, fy + 1.4); ctx.closePath(); ctx.fill();
  }

  // Great Fens (B3): reed/marsh texture around the Thornmere & Valmere
  ctx.fillStyle = 'rgba(96,132,86,0.5)';
  ctx.fillRect(m.px(0.95), m.py(2.2), m.px(1.95) - m.px(0.95), m.py(3.05) - m.py(2.2));
  ctx.strokeStyle = 'rgba(70,104,74,0.6)'; ctx.lineWidth = 0.7;
  for (let i = 0; i < 60; i++) {
    const rx = m.px(1.0 + ((i * 0.13) % 0.9));
    const ry = m.py(2.28 + ((i * 0.19) % 0.72));
    ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry - 3); ctx.stroke();
  }
  ctx.lineWidth = 1;

  // Cold south: coastal ice & glacial texture (pale blue-grey), plus Ariel's
  // small residual green refuge amid the ice.
  ctx.fillStyle = 'rgba(206,220,230,0.7)';
  ctx.fillRect(MX, m.py(3.25), MW, m.py(4) - m.py(3.25));
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1;
  for (let i = 0; i < 22; i++) {
    const gx = m.px(1.6 + ((i * 0.17) % 2.1));
    const gy = m.py(3.35 + ((i * 0.11) % 0.55));
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 8, gy); ctx.stroke();
  }
  _cmBlob(m.px(2.72), m.py(3.74), 7, 6, 'rgba(120,168,96,0.9)');

  // Western spine / the Arc: hachured mountains down the west
  const spine = [[0.74,1.08],[0.81,1.28],[0.72,1.5],[0.8,1.72],[0.71,1.95],[0.79,2.16],[0.72,2.36]];
  for (let i = 0; i < spine.length; i++) _cmMountain(m.px(spine[i][0]), m.py(spine[i][1]), 6);
  // A lighter southern (C3) range
  const srange = [[2.35,2.28],[2.55,2.4],[2.75,2.3]];
  for (let i = 0; i < srange.length; i++) _cmMountain(m.px(srange[i][0]), m.py(srange[i][1]), 4);

  // Mercury Lake (A3): a tiny dark metallic anomaly in a minute barren zone.
  _cmBlob(m.px(0.66), m.py(2.4), 5, 4, '#8a7d74');
  ctx.fillStyle = '#2a2630';
  ctx.beginPath(); ctx.ellipse(m.px(0.66), m.py(2.4), 2, 1.6, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();

  // Coastline stroke
  _cmLandPath(m);
  ctx.strokeStyle = '#4a3418'; ctx.lineWidth = 1.3; ctx.stroke(); ctx.lineWidth = 1;

  // ── Islands ───────────────────────────────────────────────────────────────
  const isleGroups = ['fishing', 'sugar', 'trading', 'subpolar', 'spindler'];
  for (let g = 0; g < isleGroups.length; g++) {
    const arr = CM_ISLES[isleGroups[g]];
    for (let i = 0; i < arr.length; i++) {
      const ix = m.px(arr[i][0]), iy = m.py(arr[i][1]);
      _cmBlob(ix, iy, arr[i][2], arr[i][3], '#8aa564');
      ctx.strokeStyle = 'rgba(74,52,24,0.7)'; ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.ellipse(ix, iy, arr[i][2], arr[i][3], 0, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
    }
  }

  // ── Inland seas ───────────────────────────────────────────────────────────
  _cmWater(m.px(2.56), m.py(1.56), 26, 21);   // Cyrmere
  _cmWater(m.px(1.92), m.py(2.46), 33, 27);   // Valmere
  _cmWater(m.px(1.22), m.py(2.73), 14, 10);   // Thornmere

  // ── Rivers (branching): the Lume, the Brinne, the Cyr ─────────────────────
  ctx.strokeStyle = '#5f8db0'; ctx.lineJoin = 'round';
  function river(pts, w) {
    ctx.lineWidth = w; ctx.beginPath();
    ctx.moveTo(m.px(pts[0][0]), m.py(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(m.px(pts[i][0]), m.py(pts[i][1]));
    ctx.stroke();
  }
  river([[2.35,2.12],[2.15,1.9],[1.92,1.75],[1.72,1.62],[1.76,1.42],[1.85,1.2]], 2);   // Lume
  river([[1.3,1.6],[1.45,1.5],[1.62,1.42],[1.72,1.5]], 1.4);                            // Brinne -> Lume (the Bowl)
  river([[2.58,1.02],[2.62,1.2],[2.52,1.34],[2.4,1.42]], 1.6);                          // Cyr -> Cyrmere
  ctx.lineWidth = 1;

  // The Bowl / Junior Academy: a small unlabelled crater ring at the Brinne-Lume
  // confluence, kept visually distinct from THE ACADEMY on the capital ridge.
  ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(m.px(1.65), m.py(1.43), 3, 0, Math.PI * 2); ctx.stroke();

  // ── Subtle A-D / 1-4 grid ─────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(90,66,34,0.22)'; ctx.lineWidth = 1;
  for (let c = 1; c <= 3; c++) { ctx.beginPath(); ctx.moveTo(m.px(c), MY); ctx.lineTo(m.px(c), MY + MH); ctx.stroke(); }
  for (let r = 1; r <= 3; r++) { ctx.beginPath(); ctx.moveTo(MX, m.py(r)); ctx.lineTo(MX + MW, m.py(r)); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(90,66,34,0.5)'; ctx.lineWidth = 1.2; ctx.strokeRect(MX, MY, MW, MH); ctx.lineWidth = 1;
  ctx.fillStyle = 'rgba(70,50,26,0.5)';
  ctx.font = 'bold 8px "Courier New", monospace'; ctx.textAlign = 'center';
  const cols = ['A', 'B', 'C', 'D'];
  for (let c = 0; c < 4; c++) ctx.fillText(cols[c], m.px(c + 0.5), MY + 9);
  for (let r = 0; r < 4; r++) ctx.fillText(String(r + 1), MX + 7, m.py(r + 0.5) + 3);
  ctx.textAlign = 'left';

  // ── Palefall Line: the climatic/ecological transition across northern C4,
  //    bending south-east toward the base of Cape Denial (a boundary, not a
  //    border; drawn faint, unlabelled). ──────────────────────────────────────
  ctx.strokeStyle = 'rgba(150,178,206,0.75)'; ctx.lineWidth = 1.1; ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(m.px(2.0), m.py(3.02));
  ctx.lineTo(m.px(2.45), m.py(3.08));
  ctx.lineTo(m.px(2.9), m.py(3.2));
  ctx.lineTo(m.px(3.28), m.py(3.46));
  ctx.stroke();
  ctx.setLineDash([]); ctx.lineWidth = 1;

  // ── Roads (fen settlement chain) — distinct from rail: dotted tan ─────────
  ctx.strokeStyle = '#9a7038'; ctx.lineWidth = 1.4; ctx.setLineDash([1.5, 2.5]);
  ctx.beginPath();
  ctx.moveTo(m.px(1.28), m.py(2.72));   // Calwick
  ctx.lineTo(m.px(1.45), m.py(2.58));   // Drenwick
  ctx.lineTo(m.px(1.6), m.py(2.42));    // unnamed town
  ctx.lineTo(m.px(1.55), m.py(2.22));   // Drynport
  ctx.stroke();
  ctx.setLineDash([]); ctx.lineWidth = 1;

  // ── Aetherrail: thin red mainline + spur + south-western line ─────────────
  ctx.strokeStyle = '#b22a2a'; ctx.lineWidth = 1.6;
  ctx.beginPath();                                   // Lumina <-> Halcyra mainline
  ctx.moveTo(m.px(1.85), m.py(1.15)); ctx.lineTo(m.px(2.32), m.py(1.4)); ctx.stroke();
  ctx.beginPath();                                   // spur to THE ACADEMY (Senior)
  ctx.moveTo(m.px(2.05), m.py(1.27)); ctx.lineTo(m.px(2.08), m.py(1.42)); ctx.stroke();
  ctx.beginPath();                                   // Halcyra <-> Drynport
  ctx.moveTo(m.px(2.32), m.py(1.4)); ctx.lineTo(m.px(2.05), m.py(1.75)); ctx.lineTo(m.px(1.7), m.py(2.05)); ctx.lineTo(m.px(1.55), m.py(2.2)); ctx.stroke();
  // Rail tick marks along the mainline
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(m.px(2.05), m.py(1.24)); ctx.lineTo(m.px(2.07), m.py(1.31)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(m.px(2.18), m.py(1.29)); ctx.lineTo(m.px(2.2), m.py(1.36)); ctx.stroke();

  // ── Silver Vein: a warm current flowing SOUTH outside the east coast ──────
  ctx.strokeStyle = 'rgba(224,142,58,0.85)'; ctx.lineWidth = 1.6;
  const vein = [[3.72,1.45],[3.86,1.9],[3.96,2.35],[3.9,2.78],[3.78,3.02]];
  ctx.beginPath(); ctx.moveTo(m.px(vein[0][0]), m.py(vein[0][1]));
  for (let i = 1; i < vein.length; i++) ctx.lineTo(m.px(vein[i][0]), m.py(vein[i][1]));
  ctx.stroke();
  // Southward arrowheads (must always point south / down-coast)
  const arrowsAt = [[3.9,1.7],[3.94,2.55]];
  ctx.fillStyle = 'rgba(224,142,58,0.95)';
  for (let i = 0; i < arrowsAt.length; i++) {
    const ax = m.px(arrowsAt[i][0]), ay = m.py(arrowsAt[i][1]);
    ctx.beginPath(); ctx.moveTo(ax, ay + 4); ctx.lineTo(ax - 3, ay - 2); ctx.lineTo(ax + 3, ay - 2); ctx.closePath(); ctx.fill();
  }
  ctx.lineWidth = 1;

  // ── Place markers ─────────────────────────────────────────────────────────
  _cmCapital(m.px(1.85), m.py(1.15));            // Lumina
  _cmCapital(m.px(2.32), m.py(1.4));             // Halcyra
  _cmAcademyGlyph(m.px(2.08), m.py(1.43));       // The Academy (Senior, capital ridge)
  _cmCity(m.px(1.4), m.py(0.7));                 // Calivar
  _cmCity(m.px(2.5), m.py(0.6));                 // Merovar
  _cmCity(m.px(2.8), m.py(1.75));               // Litorra
  _cmCity(m.px(3.55), m.py(1.4));               // Stonehaven
  _cmCity(m.px(1.55), m.py(2.2));               // Drynport
  _cmTown(m.px(1.28), m.py(2.72));              // Calwick
  _cmTown(m.px(1.45), m.py(2.58));              // Drenwick
  _cmTown(m.px(1.6), m.py(2.42));               // unnamed town (no label)
  _cmFort(m.px(2.28), m.py(3.12));              // Fort Orrivar
  _cmFort(m.px(2.5), m.py(3.48));               // Fort Drenn
  _cmFort(m.px(2.72), m.py(3.74));              // Fort Ariel

  // ── Labels (halo'd; capital-ridge cluster uses a smaller font) ────────────
  _cmLabel('Calivar',       m.px(1.4),  m.py(0.7) - 6);
  _cmLabel('Merovar',       m.px(2.5),  m.py(0.6) - 6);
  _cmLabel('Lumina',        m.px(1.85), m.py(1.15) - 7, { bold: true });
  _cmLabel('Halcyra',       m.px(2.36), m.py(1.4) - 7,  { bold: true });
  _cmLabel('THE ACADEMY',   m.px(1.98), m.py(1.62),      { size: 6, color: '#6a2a1a' });
  _cmLabel('Litorra',       m.px(2.86), m.py(1.75) + 11);
  _cmLabel('Stonehaven',    m.px(3.5),  m.py(1.4) - 6,   { align: 'right' });
  _cmLabel('Drynport',      m.px(1.55), m.py(2.2) - 6);
  _cmLabel('Drenwick',      m.px(1.5),  m.py(2.58) - 5,  { align: 'left' });
  _cmLabel('Calwick',       m.px(1.24), m.py(2.72) + 8,  { align: 'right' });
  _cmLabel('Cyrmere',       m.px(2.62), m.py(1.72),      { italic: true, color: '#1f3648' });
  _cmLabel('Valmere',       m.px(1.92), m.py(2.46) + 2,  { italic: true, color: '#1f3648' });
  _cmLabel('Thornmere',     m.px(1.22), m.py(2.9),       { italic: true, color: '#1f3648' });
  _cmLabel('Great Fens',    m.px(1.12), m.py(2.28),      { italic: true, color: '#3a4a2a' });
  _cmLabel('Tidewave Chasm', m.px(3.35), m.py(2.5) + 12, { size: 6 });
  _cmLabel("Spindler's Coast", MX + MW - 2, m.py(2.35), { size: 6, align: 'right' });
  _cmLabel('Cape Denial',   m.px(3.66), m.py(3.12) - 6,  { size: 6 });
  _cmLabel('Polar Verge',   m.px(2.05), m.py(2.98),      { italic: true, size: 6, color: '#3a4656' });
  _cmLabel('Frostward Reach', m.px(2.98), m.py(3.28),    { italic: true, size: 6, color: '#3a4656' });
  _cmLabel('Fort Orrivar',  m.px(2.28) + 7, m.py(3.12) + 2, { size: 6, align: 'left' });
  _cmLabel('Fort Drenn',    m.px(2.5) + 7,  m.py(3.48) + 2, { size: 6, align: 'left' });
  _cmLabel('Fort Ariel',    m.px(2.72) + 7, m.py(3.74) + 2, { size: 6, align: 'left' });

  // ── Right column: compass, scale bar, legend, seal ────────────────────────
  const RX = MX + MW + 12, RW = (PX + PW - 12) - RX;

  // Compass (warm north / cold south)
  const ccx = RX + RW / 2, ccy = MY + 30;
  ctx.strokeStyle = '#2a1008'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(ccx, ccy - 16); ctx.lineTo(ccx, ccy + 16); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ccx - 12, ccy); ctx.lineTo(ccx + 12, ccy); ctx.stroke();
  ctx.fillStyle = '#a02020';
  ctx.beginPath(); ctx.moveTo(ccx, ccy - 22); ctx.lineTo(ccx - 4, ccy - 13); ctx.lineTo(ccx + 4, ccy - 13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2a1008'; ctx.font = '7px "Courier New", monospace'; ctx.textAlign = 'center';
  ctx.fillText('N', ccx, ccy - 24); ctx.fillText('S', ccx, ccy + 24);
  ctx.fillText('warm', ccx, ccy - 32); ctx.fillText('cold', ccx, ccy + 33);
  ctx.fillText('W', ccx - 18, ccy + 3); ctx.fillText('E', ccx + 18, ccy + 3);

  // Scale bar (~800 km per grid column)
  const kmPerPx = 800 / (MW / 4);
  const barPx = Math.round(500 / kmPerPx);
  const sbx = RX + (RW - barPx) / 2, sby = MY + 74;
  ctx.strokeStyle = '#2a1008'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(sbx, sby); ctx.lineTo(sbx + barPx, sby); ctx.stroke();
  for (const t of [0, 0.5, 1]) { ctx.beginPath(); ctx.moveTo(sbx + barPx * t, sby - 3); ctx.lineTo(sbx + barPx * t, sby + 3); ctx.stroke(); }
  ctx.lineWidth = 1; ctx.fillStyle = '#2a1008'; ctx.font = '7px "Courier New", monospace'; ctx.textAlign = 'center';
  ctx.fillText('0', sbx, sby + 12); ctx.fillText('500 km', sbx + barPx, sby + 12);
  ctx.textAlign = 'left';

  // Legend
  let ly = MY + 104; const lx = RX + 4;
  ctx.font = 'bold 8px "Courier New", monospace'; ctx.fillStyle = '#2a1008';
  ctx.fillText('LEGEND', lx, ly); ly += 13;
  ctx.font = '7px "Courier New", monospace';
  function legend(drawGlyph, text) {
    drawGlyph(lx + 5, ly - 2);
    ctx.fillStyle = '#2a1008'; ctx.textAlign = 'left'; ctx.fillText(text, lx + 14, ly);
    ly += 13;
  }
  legend(function (x, y) { _cmCapital(x, y); }, 'Capital');
  legend(function (x, y) { _cmCity(x, y); }, 'City');
  legend(function (x, y) { _cmTown(x, y); }, 'Town / village');
  legend(function (x, y) { _cmAcademyGlyph(x, y + 2); }, 'The Academy');
  legend(function (x, y) { _cmFort(x, y + 1); }, 'Imperial fort');
  legend(function (x, y) { ctx.strokeStyle = '#b22a2a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.stroke(); ctx.lineWidth = 1; }, 'Aetherrail');
  legend(function (x, y) { ctx.strokeStyle = '#9a7038'; ctx.lineWidth = 1.4; ctx.setLineDash([1.5, 2.5]); ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.stroke(); ctx.setLineDash([]); ctx.lineWidth = 1; }, 'Road');
  legend(function (x, y) { ctx.strokeStyle = 'rgba(224,142,58,0.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 5, y - 2); ctx.lineTo(x + 5, y - 2); ctx.stroke(); ctx.fillStyle = 'rgba(224,142,58,0.95)'; ctx.beginPath(); ctx.moveTo(x + 5, y + 2); ctx.lineTo(x + 1, y - 3); ctx.lineTo(x + 6, y - 3); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1; }, 'Silver Vein');
  legend(function (x, y) { ctx.fillStyle = 'rgba(120,80,150,0.7)'; ctx.fillRect(x - 5, y - 4, 11, 5); ctx.fillStyle = 'rgba(232,204,120,0.7)'; ctx.fillRect(x - 5, y - 4, 11, 1); }, 'Resonance storm');

  // Imperial seal (subtle): double ring + eight-point motif (the eight threads)
  const sx = RX + RW / 2, sy = MY + MH - 34;
  ctx.strokeStyle = '#6a2a1a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(sx, sy, 16, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(106,42,26,0.8)';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * 11, sy + Math.sin(a) * 11); ctx.stroke();
  }
  ctx.fillStyle = '#6a2a1a'; ctx.beginPath(); ctx.arc(sx, sy, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#5a3010'; ctx.font = '6px "Courier New", monospace'; ctx.textAlign = 'center';
  ctx.fillText('IMPERIAL SURVEY OFFICE', sx, sy + 26);
  ctx.textAlign = 'left';

  // ── Close hint ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#5a3810'; ctx.font = '9px "Courier New", monospace'; ctx.textAlign = 'right';
  ctx.fillText('[ SPACE / ESC ] close', PX + PW - 12, PY + PH - 7);
  ctx.textAlign = 'left';
}

// ─── Accord Panel Drawing ─────────────────────────────────────────────────────
// Near-full-screen reading panel for the Accord of Threads.
// Pages are stored in accordPanel.pages (same string[] shape as dialogue.pages).
// Each page is an array of paragraph strings; paragraphs are word-wrapped to fit.
function drawAccordPanel() {
  if (!accordPanel.open) return;

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, 512, 480);

  const PX = 18, PY = 12, PW = 476, PH = 456;

  // Parchment — slightly warmer than the continent map (aged document feel)
  ctx.fillStyle = '#cdbf80';
  ctx.fillRect(PX, PY, PW, PH);
  ctx.fillStyle = '#d8cc8a';
  ctx.fillRect(PX + 3, PY + 3, PW - 6, PH - 6);

  // Outer frame
  ctx.strokeStyle = '#2a1408';
  ctx.lineWidth   = 3;
  ctx.strokeRect(PX, PY, PW, PH);
  ctx.strokeStyle = '#6a4010';
  ctx.lineWidth   = 1;
  ctx.strokeRect(PX + 6, PY + 6, PW - 12, PH - 12);

  // ── Title bar ───────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1e0c04';
  ctx.fillRect(PX + 7, PY + 7, PW - 14, 26);
  ctx.fillStyle = '#d8c070';
  ctx.font      = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(accordPanel.title || 'IMPERIAL INSTRUMENT NO. 7 OF YEAR 700 \u2014 ACCORD OF THREADS', 256, PY + 23);
  ctx.textAlign = 'left';

  // Imperial seal — small embossed circle, top-right of title bar
  ctx.fillStyle = '#8a1818';
  ctx.beginPath();
  ctx.arc(PX + PW - 20, PY + 19, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c03030';
  ctx.beginPath();
  ctx.arc(PX + PW - 20, PY + 19, 4, 0, Math.PI * 2);
  ctx.fill();

  // ── Text area ───────────────────────────────────────────────────────────────
  const TX  = PX + 20;         // text left margin
  const TW  = PW - 40;         // text column width
  const TY0 = PY + 46;         // first text line y
  const TYB = PY + PH - 28;    // bottom of text area (above footer)
  const LH  = 16;              // line height px
  const FONT_BODY = '12px "Courier New", monospace';

  // Word-wrap a single string to fit TW pixels
  function wrapString(str) {
    ctx.font = FONT_BODY;
    const words = str.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > TW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // Render the current page
  const page = accordPanel.pages[accordPanel.page] || [];
  let cy = TY0;
  ctx.font      = FONT_BODY;
  ctx.fillStyle = '#1e0c04';
  ctx.textAlign = 'left';

  for (let pi = 0; pi < page.length; pi++) {
    const para = page[pi];

    // Section headers (ALL-CAPS lines starting with known keywords) in bold
    const isHeader = /^(IMPERIAL INSTRUMENT|PREAMBLE|ARTICLE|SEAL AND DATING)/.test(para);
    if (isHeader) {
      ctx.font = 'bold 12px "Courier New", monospace';
    } else {
      ctx.font = FONT_BODY;
    }

    const wrapped = wrapString(para);
    for (const line of wrapped) {
      if (cy + LH > TYB) break;  // clip to text area — page is long enough
      ctx.fillText(line, TX, cy);
      cy += LH;
    }

    // Paragraph gap (skip one half-line between paragraphs)
    if (pi < page.length - 1) cy += 6;
  }

  // ── Footer ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1e0c04';
  ctx.fillRect(PX + 7, PY + PH - 25, PW - 14, 1);

  const total = accordPanel.pages.length;
  const cur   = accordPanel.page + 1;

  ctx.font      = '10px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#5a3810';
  ctx.fillText('\u2190 A / \u2192 D  turn page', TX, PY + PH - 10);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#2a1408';
  ctx.fillText(`Page ${cur} of ${total}`, 256, PY + PH - 10);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#5a3810';
  ctx.fillText('[ ESC ] close', PX + PW - 12, PY + PH - 10);
  ctx.textAlign = 'left';
}


// ─── Choice Box Drawing ───────────────────────────────────────────────────────
function drawChoice() {
  if (!choice.open) return;

  const PAD    = 14;
  const lineH  = 20;   // height of a single (possibly wrapped) option line
  const optGap = 8;    // extra gap between separate options
  const arrow  = '\u25b6 ';

  // Measure with the option font so width/height math matches what's drawn.
  ctx.font = '13px "Courier New", monospace';
  const measure = (s) => ctx.measureText(s).width;
  const indent  = measure(arrow);   // continuation lines align under the option text

  // Box width: fit the content, clamped to the screen. Options longer than the
  // clamp wrap onto continuation lines instead of overflowing the box (which is
  // what used to happen at the old fixed 220px width).
  const MINW = 200, MAXW = 470;
  let naturalW = measure(choice.title || '');
  for (const o of choice.options) naturalW = Math.max(naturalW, indent + measure(o));
  const BW    = Math.max(MINW, Math.min(MAXW, Math.ceil(naturalW) + PAD * 2));
  const textW = BW - PAD * 2 - indent;                    // width available to wrapped text
  const wrapped = choice.options.map((o) => wrapDialogueLine(o, textW, measure));

  // Height derives from the wrapped line counts, so a two-line option grows the box.
  const headerH = 40, bottomPad = 12;
  let contentH = 0;
  wrapped.forEach((w, i) => { contentH += w.length * lineH; if (i < wrapped.length - 1) contentH += optGap; });
  const BH = headerH + contentH + bottomPad;

  const BX = Math.floor((512 - BW) / 2);
  const BY = Math.max(8, 350 - BH);   // sit just above the dialogue box, growing upward

  // Background
  ctx.fillStyle = '#08121e';
  ctx.fillRect(BX, BY, BW, BH);

  // Outer border
  ctx.strokeStyle = '#5a8a9a';
  ctx.lineWidth = 2;
  ctx.strokeRect(BX + 1, BY + 1, BW - 2, BH - 2);

  // Inner border
  ctx.strokeStyle = '#2a4e5e';
  ctx.lineWidth = 1;
  ctx.strokeRect(BX + 5, BY + 5, BW - 10, BH - 10);

  // Corner accents
  ctx.fillStyle = '#8ac8d8';
  ctx.fillRect(BX + 1,        BY + 1,        2, 2);
  ctx.fillRect(BX + BW - 3,   BY + 1,        2, 2);
  ctx.fillRect(BX + 1,        BY + BH - 3,   2, 2);
  ctx.fillRect(BX + BW - 3,   BY + BH - 3,   2, 2);

  // Title
  ctx.fillStyle = '#8ac8d8';
  ctx.font = 'bold 13px "Courier New", monospace';
  ctx.fillText(choice.title, BX + PAD, BY + 20);

  // Separator
  ctx.fillStyle = '#2a4e5e';
  ctx.fillRect(BX + PAD, BY + 26, BW - PAD * 2, 1);

  // Options \u2014 the cursor arrow marks only the first line of the selected option;
  // continuation lines indent to align under the option text.
  ctx.font = '13px "Courier New", monospace';
  let y = BY + headerH + 6;
  wrapped.forEach((lines, i) => {
    const selected = i === choice.cursor;
    ctx.fillStyle = selected ? '#f0e090' : '#aac4c4';
    lines.forEach((ln, j) => {
      const prefix = j === 0 ? (selected ? arrow : '  ') : '';
      const x      = BX + PAD + (j === 0 ? 0 : indent);
      ctx.fillText(prefix + ln, x, y);
      y += lineH;
    });
    y += optGap;
  });
}


// ─── Dialogue text layout (pure, testable) ───────────────────────────────────
// FORMATTING CONTRACT: within a dialogue page, each string is a hard authored
// line. Continuous prose that should wrap naturally must be stored as ONE
// string; use multiple strings only for intentional line breaks (verse, signs,
// lists, deliberate dramatic fragments, separate speakers/quotes). See
// architecture.md.
//
// `measure(str)` returns the rendered pixel width of a string. drawDialogue()
// passes ctx.measureText; tests pass a Courier-New monospace model. Behaviour
// is identical to the previous inline logic — these are extractions, not a
// redesign.

// Greedy word-wrap of a single authored string to fit within maxW pixels.
function wrapDialogueLine(text, maxW, measure) {
  if (measure(text) <= maxW) return [text];
  const words = text.split(' ');
  const out = [];
  let cur = '';
  for (const word of words) {
    const candidate = cur ? cur + ' ' + word : word;
    if (measure(candidate) <= maxW) {
      cur = candidate;
    } else {
      if (cur) out.push(cur);
      cur = word;
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [text];
}

// Preprocess authored pages (array of pages; each page an array of authored
// line-strings) into height-safe visual pages of at most maxVisLines wrapped
// sub-lines each. Each authored string wraps independently — its boundary with
// the next authored string is a hard line break.
function paginateDialoguePages(pages, maxW, maxVisLines, measure) {
  const visualPages = [];
  for (const page of pages) {
    const sublines = [];
    for (const line of page) {
      for (const sub of wrapDialogueLine(line, maxW, measure)) sublines.push(sub);
    }
    for (let i = 0; i < sublines.length; i += maxVisLines) {
      visualPages.push(sublines.slice(i, i + maxVisLines));
    }
  }
  return visualPages;
}
window.wrapDialogueLine = wrapDialogueLine;
window.paginateDialoguePages = paginateDialoguePages;

// ─── Dialogue Box Drawing ─────────────────────────────────────────────────────
function drawDialogue() {
  if (!dialogue.open) return;

  const BX = 8, BY = 358, BW = 496, BH = 114;
  const PAD = 14;

  // Background fill
  ctx.fillStyle = '#08121e';
  ctx.fillRect(BX, BY, BW, BH);

  // Outer border (lighter blue-grey)
  ctx.strokeStyle = '#5a8a9a';
  ctx.lineWidth = 2;
  ctx.strokeRect(BX + 1, BY + 1, BW - 2, BH - 2);

  // Inner border (dimmer, inset)
  ctx.strokeStyle = '#2a4e5e';
  ctx.lineWidth = 1;
  ctx.strokeRect(BX + 5, BY + 5, BW - 10, BH - 10);

  // Corner accents — bright 2×2 squares at each corner of outer border
  ctx.fillStyle = '#8ac8d8';
  ctx.fillRect(BX + 1,        BY + 1,        2, 2);
  ctx.fillRect(BX + BW - 3,   BY + 1,        2, 2);
  ctx.fillRect(BX + 1,        BY + BH - 3,   2, 2);
  ctx.fillRect(BX + BW - 3,   BY + BH - 3,   2, 2);

  // Name plate (omitted for system messages like chest opened)
  if (dialogue.name) {
    ctx.fillStyle = '#8ac8d8';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.fillText(dialogue.name, BX + PAD, BY + 24);
  }

  // Separator line under name
  ctx.fillStyle = '#2a4e5e';
  ctx.fillRect(BX + PAD, BY + 28, BW - PAD * 2, 1);

  // Dialogue lines
  ctx.fillStyle = '#ccd8cc';
  ctx.font = '14px "Courier New", monospace';
  const maxLineW = BW - PAD * 2;

  // Lazily preprocess authored pages into height-safe visual pages via the
  // shared pure helpers (wrapDialogueLine / paginateDialoguePages), so the exact
  // layout is unit-testable. Replaces dialogue.pages in-place; the identity
  // check avoids reprocessing each frame.
  if (dialogue._preprocessedFor !== dialogue.pages) {
    const LINE_H = 22;
    const maxVisLines = Math.max(1, Math.floor((BH - 40) / LINE_H));
    const measure = (s) => ctx.measureText(s).width;
    dialogue.pages = paginateDialoguePages(dialogue.pages, maxLineW, maxVisLines, measure);
    dialogue._preprocessedFor = dialogue.pages;
  }

  // Guard against a dialogue opened with zero pages (or a cursor past the
  // end): render an empty box rather than throwing. An exception here kills
  // the render loop — the whole game hard-freezes on a content mistake like
  // an NPC dialogue getter returning []. (That exact bug shipped once, via
  // the fort Essa's stage-0 fallback.)
  const lines = dialogue.pages[dialogue.page] || [];
  let lineY = BY + 52;
  for (const subline of lines) {
    ctx.fillText(subline, BX + PAD, lineY);
    lineY += 22;
  }

  // Advance / close prompt — blinks every 30 frames
  if ((tick >> 5) & 1) {
    const isLast = dialogue.page === dialogue.pages.length - 1;
    ctx.fillStyle = '#8ac8d8';
    ctx.font = 'bold 12px "Courier New", monospace';
    const label = isLast ? '[ close ]' : '\u25bc more';
    ctx.textAlign = 'right';
    ctx.fillText(label, BX + BW - PAD, BY + BH - 10);
    ctx.textAlign = 'left';
  }
}

// ─── Menu Drawing ────────────────────────────────────────────────────────────
function drawMenu() {
  if (!menu.open) return;

  // Dim the world behind the panel
  ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
  ctx.fillRect(0, 0, 512, 480);

  const BX = 60, BY = 50, BW = 392, BH = 430;
  const PAD = 18;
  const CX  = BX + PAD; // left edge of content

  // ── Panel background ──────────────────────────────────────────────────────
  ctx.fillStyle = '#08121e';
  ctx.fillRect(BX, BY, BW, BH);

  // Outer border
  ctx.strokeStyle = '#5a8a9a';
  ctx.lineWidth = 2;
  ctx.strokeRect(BX + 1, BY + 1, BW - 2, BH - 2);

  // Inner border
  ctx.strokeStyle = '#2a4e5e';
  ctx.lineWidth = 1;
  ctx.strokeRect(BX + 5, BY + 5, BW - 10, BH - 10);

  // Corner accents
  ctx.fillStyle = '#8ac8d8';
  ctx.fillRect(BX + 1,      BY + 1,      2, 2);
  ctx.fillRect(BX + BW - 3, BY + 1,      2, 2);
  ctx.fillRect(BX + 1,      BY + BH - 3, 2, 2);
  ctx.fillRect(BX + BW - 3, BY + BH - 3, 2, 2);

  // ── Helper: horizontal rule ───────────────────────────────────────────────
  function rule(y) {
    ctx.fillStyle = '#1e3040';
    ctx.fillRect(CX, y, BW - PAD * 2, 1);
  }

  // ── Helper: section label ─────────────────────────────────────────────────
  function sectionLabel(text, y) {
    ctx.fillStyle = '#5a8898';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(text, CX, y);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NOTEBOOK SCREEN — full panel override
  // ─────────────────────────────────────────────────────────────────────────
  if (menu.screen === 'notebook') {
    sectionLabel('NOTEBOOK', BY + 26);
    rule(BY + 31);

    // Build active quest notes from quest flags
    const notes = [];
    // Dispatch quest
    if (dispatch_quest_started && !dispatch_delivered) {
      notes.push({ title: "Supervisor's Errand", body: "Deliver the Dispatch Letter to Officer Veth at the Drenwick district office." });
    } else if (dispatch_delivered && !dispatch_pay_ticket_ready && !dispatch_rewarded) {
      notes.push({ title: "Supervisor's Errand", body: "Return to your supervisor in Calwick — the letter reached Drenwick." });
    } else if (dispatch_pay_ticket_ready && !dispatch_rewarded) {
      notes.push({ title: "Supervisor's Errand", body: "Take the pay chit to Petra at the Calwick market." });
    }
    // Sluice job
    if (sluice_job_started && !sluice_fixed) {
      notes.push({ title: 'Sluice Repair', body: "Fix the flow valve in the East Sluice beneath Calwick." });
    } else if (sluice_fixed && !sluice_pay_ticket_ready && !sluice_reward_given) {
      notes.push({ title: 'Sluice Repair', body: "Report back — the East Sluice valve is repaired." });
    } else if (sluice_pay_ticket_ready && !sluice_reward_given) {
      notes.push({ title: 'Sluice Repair', body: "Take the work chit to Petra at the Calwick market." });
    }
    // Briar Warden contract
    if (warden_quest_started && !warden_quest_defeated) {
      notes.push({ title: 'Warden Contract', body: "Defeat the Briar Warden in the Calwick dungeon (floor 1)." });
    } else if (warden_quest_defeated && !warden_quest_rewarded) {
      notes.push({ title: 'Warden Contract', body: "Return to Mault — the Briar Warden is dead." });
    }
    // Fort investigation
    if (fort_quest_started && fort_quest_stage < 4 && fort_quest_stage !== 5) {
      notes.push({ title: 'Fort Investigation', body: "Investigate the old fort south of Drenwick in the western fen." });
    } else if (fort_quest_stage === 4 || fort_quest_stage === 5) {
      notes.push({ title: 'Fort Investigation', body: "Report your findings to your supervisor in Calwick." });
    } else if (fort_quest_stage === 6 && fort_pay_ticket_ready) {
      notes.push({ title: 'Fort Investigation', body: "Take the pay ticket to Petra at the Calwick market." });
    }
    // Rest week after the fen post case, then the reservoir bed assignment
    if (mq4_available_day > 0 && day < mq4_available_day) {
      notes.push({ title: 'Stood Down', body: "The fen post matter is closed. The supervisor has taken you off the roster — rest until after Dayoff." });
    } else if (mq4_available_day > 0 && !reservoir_quest_started) {
      notes.push({ title: 'Stood Down', body: "The rest week is over. Report to the supervisor at the Calwick office for the next assignment." });
    }
    if (reservoir_quest_started) {
      notes.push({ title: 'Reservoir Bed', body: "The drought has uncovered old stonework in the reservoir bed north of Drenwick. Investigate it — in daylight. A basin observer already went out and did not come back." });
    }
    // Schilling
    if (schilling_quest_started && !schilling_returned) {
      notes.push({ title: 'Missing Person', body: "Find Schilling and bring him back." });
    }
    // Pale Sentry
    if (sentry_quest_started && !sentry_quest_done) {
      notes.push({ title: 'Pale Sentry', body: "Defeat the Pale Sentry blocking the fen road near Drenwick." });
    } else if (sentry_quest_done && !sentry_quest_rewarded) {
      notes.push({ title: 'Pale Sentry', body: "Collect the bounty from Constable Tarvec at the Drenwick guard post." });
    }
    // Mabel's sickle
    if (sickle_quest_stage === 1) {
      notes.push({ title: "Mabel's Sickle", body: "Find the lost fen sickle near the north bank of the bog." });
    }
    // Den Wraith
    if (den_wraith_quest_started && !den_wraith_defeated) {
      notes.push({ title: 'Den Wraith', body: "Defeat the Den Wraith." });
    } else if (den_wraith_defeated && !den_wraith_rewarded) {
      notes.push({ title: 'Den Wraith', body: "Return to claim the wraith bounty." });
    }
    // A Bottle for Her Father
    if (wine_quest_started && !wine_quest_delivered) {
      notes.push({ title: "Fenna's Father", body: "Buy mushroom wine at Wend's brewery in the fen and bring it to Sael, Fenna's father, in Drenwick." });
    } else if (wine_quest_delivered && !wine_quest_rewarded) {
      notes.push({ title: "Fenna's Father", body: "Bring Sael's note back to Fenna in Calwick." });
    }

    // Special Items — quest-flagged items (stats.items with questItem: true)
    // get their own section here so they don't just blend into the regular
    // ITEMS list above with everything else being carried.
    const specialItemNotes = {
      'Letter from Netto':  'A letter from home.',
      'Dispatch Letter':    "Routine correspondence for the Drenwick district office.",
      'Sealed Letter':      'A redacted transit authorization, fished from the canal. Sender unknown.',
      'Mushroom Wine':      "Wend's brew, from the fen settlements.",
      'Schilling':          "Pip's teddy bear. He's waiting for it back.",
      'Cat-Shaped Key':     "Doesn't fit anything you own. Yet.",
      'Old Fishing Rod':    'A battered rod found in an abandoned Drenwick apartment. The worst rod there is — but it casts. Needed to fish the Drenwick waterfront.',
      'Bottle of Mushroom Wine': "Fresh from Wend's brewery. Meant for Sael, not for drinking on the road.",
      'Case of Mushroom Wine':   "A full case from Wend's brewery. Heavy, but Sael will appreciate it.",
      'Thank-You Note':          "From Sael. Fenna will want to see this.",
    };
    const seenSpecial = new Set();
    const specialItems = stats.items.filter(it => it.questItem && !seenSpecial.has(it.name) && seenSpecial.add(it.name));
    if (specialItems.length > 0) {
      notes.push({ header: 'SPECIAL ITEMS' });
      specialItems.forEach(it => {
        notes.push({ title: it.name, body: specialItemNotes[it.name] || 'A quest item.' });
      });
    }

    const NOTE_H   = 42;  // px per note entry (title + body + gap)
    const NOTES_Y0 = BY + 50;
    const PANEL_H  = BH - 70;
    const visCount = Math.floor(PANEL_H / NOTE_H);

    // Clamp scroll
    menu.notebookOffset = Math.max(0, Math.min(menu.notebookOffset, Math.max(0, notes.length - visCount)));

    if (notes.length === 0) {
      ctx.fillStyle = '#2a4848';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillText('No active quests.', CX, NOTES_Y0 + 20);
    } else {
      for (let ni = 0; ni < visCount; ni++) {
        const i = menu.notebookOffset + ni;
        if (i >= notes.length) break;
        const ny = NOTES_Y0 + ni * NOTE_H;
        // Separator
        if (ni > 0) {
          ctx.fillStyle = '#1a2e3e';
          ctx.fillRect(CX, ny - 6, BW - PAD * 2, 1);
        }
        if (notes[i].header) {
          // Section divider (e.g. "SPECIAL ITEMS") \u2014 no body, just a label.
          ctx.fillStyle = '#4a8898';
          ctx.font = 'bold 11px "Courier New", monospace';
          ctx.fillText(notes[i].header, CX, ny + 12);
          continue;
        }
        // Title
        ctx.fillStyle = '#7ab8c8';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.fillText('\u25aa ' + notes[i].title, CX, ny + 12);
        // Body
        ctx.fillStyle = '#c8d8c8';
        ctx.font = '12px "Courier New", monospace';
        // Wrap body at ~52 chars
        const words = notes[i].body.split(' ');
        let line = '', lines = [];
        for (const w of words) {
          if ((line + (line ? ' ' : '') + w).length > 52) { lines.push(line); line = w; }
          else { line = line ? line + ' ' + w : w; }
        }
        if (line) lines.push(line);
        lines.forEach((l, li) => ctx.fillText(l, CX + 10, ny + 26 + li * 13));
      }
      // Scroll indicators
      if (menu.notebookOffset > 0) {
        ctx.fillStyle = '#4a8898'; ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('\u25b2 more', BX + BW - PAD, NOTES_Y0 + 2);
        ctx.textAlign = 'left';
      }
      if (menu.notebookOffset + visCount < notes.length) {
        ctx.fillStyle = '#4a8898'; ctx.font = '10px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('\u25bc more', BX + BW - PAD, NOTES_Y0 + visCount * NOTE_H - 4);
        ctx.textAlign = 'left';
      }
    }

    // Bottom hint
    ctx.fillStyle = '#3a6878';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('\u2191\u2193 scroll  \u00b7  B / ESC back', CX, BY + BH - 14);
    return;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Section 1 — CHARACTER
  // ─────────────────────────────────────────────────────────────────────────
  sectionLabel('CHARACTER', BY + 26);
  rule(BY + 31);

  // Name + level + gold
  ctx.fillStyle = '#e0e8e0';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.fillText(stats.name, CX, BY + 60);
  ctx.fillStyle = '#6abcac';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText(`Lv. ${stats.level}`, CX + 90, BY + 60);
  ctx.fillStyle = '#c8a830';
  ctx.fillText(`\u25cf ${stats.gold} g`, CX + 168, BY + 60);
  ctx.fillStyle = '#8a9aac';
  ctx.fillText(`Day ${day}`, CX + 258, BY + 60);

  // HP label
  ctx.fillStyle = '#8aacaa';
  ctx.font = 'bold 12px "Courier New", monospace';
  ctx.fillText('HP', CX, BY + 86);

  // Segmented HP bar
  const BAR_X = CX + 28, BAR_Y = BY + 75, BAR_H = 10;
  const SEGS = 15, SEG_GAP = 2;
  const SEG_W = 9; // each segment is 9 px wide
  const filledSegs  = Math.round(SEGS * stats.hp / stats.maxHp);
  const poisoned    = hasStatusEffect('poison');
  const muddied     = hasStatusEffect('muddied');
  const slithered   = hasStatusEffect('slither');
  const hpFillColor = filledSegs <= 4 ? '#a06820'
                    : poisoned          ? '#7a9820'
                    : muddied           ? '#9a8430'
                    : slithered         ? '#4a9aaa'
                    :                     '#4a9a62';
  for (let i = 0; i < SEGS; i++) {
    ctx.fillStyle = i >= filledSegs ? '#112820' : hpFillColor;
    ctx.fillRect(BAR_X + i * (SEG_W + SEG_GAP), BAR_Y, SEG_W, BAR_H);
  }
  // HP numbers beside bar
  ctx.fillStyle = '#9ab8aa';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText(`${stats.hp} / ${stats.maxHp}`, BAR_X + SEGS * (SEG_W + SEG_GAP) + 4, BY + 85);
  let statusLabelY = BY + 85;
  if (poisoned) {
    ctx.fillStyle = '#a0c830';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('PSN', CX + 170, statusLabelY);
    statusLabelY += 12;
  }
  if (muddied) {
    ctx.fillStyle = '#c8a840';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('MUD', CX + 170, statusLabelY);
    statusLabelY += 12;
  }
  if (slithered) {
    ctx.fillStyle = '#40c8c8';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('SLI', CX + 170, statusLabelY);
    statusLabelY += 12;
  }
  if (hasStatusEffect('cursed')) {
    ctx.fillStyle = '#b060d8';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('CRS', CX + 170, statusLabelY);
  }

  // XP bar
  ctx.fillStyle = '#5a8898';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.fillText('XP', CX, BY + 104);
  const nextXp  = xpForNextLevel();
  const xpLabel = nextXp !== null ? `${stats.xp} / ${nextXp}` : `${stats.xp}  MAX`;
  const xpFrac  = nextXp !== null ? Math.min(1, stats.xp / nextXp) : 1;
  const XP_W    = BAR_X + SEGS * (SEG_W + SEG_GAP) - (CX + 28); // match HP bar width
  ctx.fillStyle = '#0a1a24';
  ctx.fillRect(CX + 28, BY + 93, XP_W, 8);
  ctx.fillStyle = stats.level >= MAX_LEVEL ? '#5a8a6a' : '#4878a8';
  ctx.fillRect(CX + 28, BY + 93, Math.round(XP_W * xpFrac), 8);
  ctx.fillStyle = '#6a9ab8';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText(xpLabel, CX + 28 + XP_W + 4, BY + 101);

  // ATK / DEF / SPD — show effective values with bonus indicators
  const eAtk = effectiveAtk();
  const eDef = effectiveDef();
  const eSpd = effectiveSpd();
  const statDefs = [
    ['ATK', stats.atk, eAtk],
    ['DEF', stats.def, eDef],
    ['SPD', stats.spd, eSpd],
  ];
  statDefs.forEach(([label, base, eff], i) => {
    const sx = CX + i * 112;
    ctx.fillStyle = '#5a8898';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.fillText(label, sx, BY + 114);
    ctx.fillStyle = eff > base ? '#78d888' : (eff < base ? '#d07050' : '#d8e4d0');
    ctx.font = 'bold 17px "Courier New", monospace';
    ctx.fillText(String(eff), sx, BY + 134);
    if (eff > base) {
      ctx.fillStyle = '#4aaa5a';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(`+${eff - base}`, sx + 18, BY + 134);
    } else if (eff < base) {
      ctx.fillStyle = '#c05838';
      ctx.font = '10px "Courier New", monospace';
      ctx.fillText(`-${base - eff}`, sx + 18, BY + 134);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 2 — EQUIPMENT
  // ─────────────────────────────────────────────────────────────────────────
  rule(BY + 152);
  sectionLabel('EQUIPMENT', BY + 166);

  const eqSlots = [
    ['Weapon',    stats.weapon],
    ['Armor',     stats.armor],
    ['Shield',    stats.shield],
    ['Accessory', stats.accessory],
  ];
  eqSlots.forEach(([label, item], i) => {
    const ry = BY + 188 + i * 22;
    ctx.fillStyle = '#6a9898';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText(label, CX, ry);
    if (item) {
      ctx.fillStyle = '#d8e4d0';
      ctx.fillText(item.name, CX + 90, ry);
      ctx.fillStyle = '#4aaa5a';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(itemStatLabel(item), CX + 90 + item.name.length * 8, ry);
    } else {
      ctx.fillStyle = '#2e5252';
      ctx.font = '13px "Courier New", monospace';
      ctx.fillText('[ empty ]', CX + 90, ry);
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Section 3 — ITEMS
  // ─────────────────────────────────────────────────────────────────────────
  rule(BY + 278);
  sectionLabel('ITEMS', BY + 292);

  // Scrollable list: grouped items + Save Game + Load Game. 4 rows visible.
  const VISIBLE_ROWS  = 4;
  const grouped       = groupItems();
  const totalEntries  = grouped.length + 2;  // +1 Save Game, +1 Load Game
  // Clamp scrollOffset in case items were removed
  menu.scrollOffset = Math.max(0, Math.min(menu.scrollOffset, Math.max(0, totalEntries - VISIBLE_ROWS)));

  if (grouped.length === 0) {
    ctx.fillStyle = '#2a4848';
    ctx.font = '13px "Courier New", monospace';
    ctx.fillText('no items', CX, BY + 312);
  }
  // When the item list is empty, the loop below still draws the Save Game /
  // Load Game rows starting at the same row slot the "no items" placeholder
  // occupies above — push them down one slot so the two don't overlap.
  const emptyListRowOffset = grouped.length === 0 ? 22 : 0;

  for (let vi = 0; vi < VISIBLE_ROWS; vi++) {
    const idx = menu.scrollOffset + vi;
    if (idx >= totalEntries) break;
    const iy       = BY + 312 + emptyListRowOffset + vi * 22;
    const selected = idx === menu.itemCursor;

    if (idx < grouped.length) {
      // ── Item row ────────────────────────────────────────────────────────
      const { item, count } = grouped[idx];
      if (selected) {
        ctx.fillStyle = '#8ac8d8';
        ctx.font = 'bold 13px "Courier New", monospace';
        ctx.fillText('\u25b6', CX, iy);
      }
      ctx.fillStyle = selected ? '#e0f0e8' : '#d8e4d0';
      ctx.font = selected ? 'bold 13px "Courier New", monospace' : '13px "Courier New", monospace';
      const label = count > 1 ? `${item.name} ${count}` : item.name;
      ctx.fillText(label, CX + 14, iy);
      ctx.fillStyle = '#4aaa5a';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(`${itemStatParen(item)}`, CX + 14 + label.length * 8, iy);
    } else if (idx === grouped.length) {
      // ── Save Game row ───────────────────────────────────────────────────
      if (selected) {
        ctx.fillStyle = '#0a1e2e';
        ctx.fillRect(CX - 2, iy - 14, BW - PAD * 2, 18);
      }
      ctx.fillStyle = selected ? '#8ac8d8' : '#4a7888';
      ctx.font      = selected ? 'bold 13px "Courier New", monospace' : '13px "Courier New", monospace';
      ctx.fillText((selected ? '\u25b6 ' : '  ') + '[ Save Game ]', CX, iy);
    } else if (idx === grouped.length + 1) {
      // ── Load Game row ───────────────────────────────────────────────────
      const hasSave = !!localStorage.getItem('verdantVale_save');
      if (selected) {
        ctx.fillStyle = '#0a1e2e';
        ctx.fillRect(CX - 2, iy - 14, BW - PAD * 2, 18);
      }
      ctx.fillStyle = selected ? (hasSave ? '#8ac8d8' : '#4a6870') : (hasSave ? '#4a7888' : '#2e5060');
      ctx.font      = selected ? 'bold 13px "Courier New", monospace' : '13px "Courier New", monospace';
      ctx.fillText((selected ? '\u25b6 ' : '  ') + '[ Load Game ]', CX, iy);
      if (!hasSave) {
        ctx.fillStyle = '#2e4850';
        ctx.font = '11px "Courier New", monospace';
        ctx.fillText('no save', CX + 120, iy);
      }
    }
  }

  // Scroll indicators
  if (menu.scrollOffset > 0) {
    ctx.fillStyle = '#4a8898';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('\u25b2 more', BX + BW - PAD, BY + 308);
    ctx.textAlign = 'left';
  }
  if (menu.scrollOffset + VISIBLE_ROWS < totalEntries) {
    ctx.fillStyle = '#4a8898';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('\u25bc more', BX + BW - PAD, BY + 312 + VISIBLE_ROWS * 22 - 6);
    ctx.textAlign = 'left';
  }

  // ── Bottom hints ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#3a6878';
  ctx.font = 'bold 10px "Courier New", monospace';
  ctx.fillText('\u2191\u2193 select  \u00b7  enter confirm  \u00b7  N notebook', CX, BY + BH - 28);
  if ((tick >> 5) & 1) {
    ctx.textAlign = 'right';
    ctx.fillText('[ M / ESC ]', BX + BW - PAD, BY + BH - 12);
    ctx.textAlign = 'left';
  }

  // ── "Game Saved" banner ───────────────────────────────────────────────────
  if (menu.saveMessage > 0) {
    menu.saveMessage--;
    const alpha = Math.min(1, menu.saveMessage / 20);  // fade out over last 20 frames
    ctx.fillStyle = `rgba(8,18,30,${(0.90 * alpha).toFixed(2)})`;
    ctx.fillRect(BX + 8, BY + 8, BW - 16, 34);
    ctx.strokeStyle = `rgba(80,160,100,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(BX + 9, BY + 9, BW - 18, 32);
    ctx.fillStyle = `rgba(120,220,140,${alpha.toFixed(2)})`;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Game Saved', BX + BW / 2, BY + 31);
    ctx.textAlign = 'left';
  }

  // ── "Won't hold" banner (save refused: MAP_METADATA allowSave: false) ─────
  if (menu.saveBlockedMessage > 0) {
    menu.saveBlockedMessage--;
    const alpha = Math.min(1, menu.saveBlockedMessage / 20);
    ctx.fillStyle = `rgba(8,18,30,${(0.90 * alpha).toFixed(2)})`;
    ctx.fillRect(BX + 8, BY + 8, BW - 16, 34);
    ctx.strokeStyle = `rgba(160,100,60,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(BX + 9, BY + 9, BW - 18, 32);
    ctx.fillStyle = `rgba(220,160,80,${alpha.toFixed(2)})`;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('The record won’t hold here.', BX + BW / 2, BY + 31);
    ctx.textAlign = 'left';
  }

  // ── Load result banner (shown after load attempt, menu may be closed) ─────
  if (menu.loadMessage > 0) {
    menu.loadMessage--;
    const alpha = Math.min(1, menu.loadMessage / 20);
    const isLoaded = menu.loadStatus === 'loaded';
    ctx.fillStyle = `rgba(8,18,30,${(0.90 * alpha).toFixed(2)})`;
    ctx.fillRect(BX + 8, BY + 8, BW - 16, 34);
    ctx.strokeStyle = isLoaded ? `rgba(80,160,100,${alpha.toFixed(2)})` : `rgba(160,100,60,${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(BX + 9, BY + 9, BW - 18, 32);
    ctx.fillStyle = isLoaded ? `rgba(120,220,140,${alpha.toFixed(2)})` : `rgba(220,160,80,${alpha.toFixed(2)})`;
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isLoaded ? 'Game Loaded' : 'No Save Found', BX + BW / 2, BY + 31);
    ctx.textAlign = 'left';
  }

  // ── Save confirm overlay ──────────────────────────────────────────────────
  if (menu.screen === 'saveConfirm') {
    // Dim the menu
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(BX + 4, BY + 4, BW - 8, BH - 8);

    // Dialog box
    const cbX = BX + 56, cbY = BY + 128, cbW = BW - 112, cbH = 124;
    ctx.fillStyle = '#08121e';
    ctx.fillRect(cbX, cbY, cbW, cbH);
    ctx.strokeStyle = '#5a8a9a'; ctx.lineWidth = 2;
    ctx.strokeRect(cbX + 1, cbY + 1, cbW - 2, cbH - 2);
    ctx.strokeStyle = '#2a4e5e'; ctx.lineWidth = 1;
    ctx.strokeRect(cbX + 4, cbY + 4, cbW - 8, cbH - 8);
    // Corner accents
    ctx.fillStyle = '#8ac8d8';
    [[cbX+1,cbY+1],[cbX+cbW-3,cbY+1],[cbX+1,cbY+cbH-3],[cbX+cbW-3,cbY+cbH-3]]
      .forEach(([x,y]) => ctx.fillRect(x, y, 2, 2));

    const midX = cbX + Math.floor(cbW / 2);
    ctx.fillStyle = '#c8dcd4';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Save game?', midX, cbY + 38);

    // Yes / No buttons
    const btnW = 80, btnH = 32, btnY = cbY + 56;
    const yesX = midX - 94, noX = midX + 14;
    const yesSel = menu.saveCursor === 0, noSel = menu.saveCursor === 1;

    ctx.fillStyle   = yesSel ? '#0a2818' : '#080f1a';
    ctx.fillRect(yesX, btnY, btnW, btnH);
    ctx.strokeStyle = yesSel ? '#4aaa5a' : '#1e3040'; ctx.lineWidth = 1;
    ctx.strokeRect(yesX, btnY, btnW, btnH);
    ctx.fillStyle = yesSel ? '#78e888' : '#2a5040';
    ctx.font      = yesSel ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
    ctx.fillText('Yes', yesX + btnW / 2, btnY + 21);

    ctx.fillStyle   = noSel ? '#280a0a' : '#080f1a';
    ctx.fillRect(noX, btnY, btnW, btnH);
    ctx.strokeStyle = noSel ? '#aa4a4a' : '#1e3040'; ctx.lineWidth = 1;
    ctx.strokeRect(noX, btnY, btnW, btnH);
    ctx.fillStyle = noSel ? '#e06060' : '#502a2a';
    ctx.font      = noSel ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
    ctx.fillText('No', noX + btnW / 2, btnY + 21);

    ctx.fillStyle = '#2a4858';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('\u2190 \u2192 select  \u00b7  enter confirm  \u00b7  B cancel', midX, cbY + cbH - 12);
    ctx.textAlign = 'left';
  }

  // ── Load confirm overlay ──────────────────────────────────────────────────
  if (menu.screen === 'loadConfirm') {
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(BX + 4, BY + 4, BW - 8, BH - 8);

    const cbX = BX + 56, cbY = BY + 108, cbW = BW - 112, cbH = 144;
    ctx.fillStyle = '#08121e';
    ctx.fillRect(cbX, cbY, cbW, cbH);
    ctx.strokeStyle = '#5a8a9a'; ctx.lineWidth = 2;
    ctx.strokeRect(cbX + 1, cbY + 1, cbW - 2, cbH - 2);
    ctx.strokeStyle = '#2a4e5e'; ctx.lineWidth = 1;
    ctx.strokeRect(cbX + 4, cbY + 4, cbW - 8, cbH - 8);
    ctx.fillStyle = '#8ac8d8';
    [[cbX+1,cbY+1],[cbX+cbW-3,cbY+1],[cbX+1,cbY+cbH-3],[cbX+cbW-3,cbY+cbH-3]]
      .forEach(([x,y]) => ctx.fillRect(x, y, 2, 2));

    const midX = cbX + Math.floor(cbW / 2);
    ctx.fillStyle = '#c8dcd4';
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Load saved game?', midX, cbY + 32);
    ctx.fillStyle = '#5a7878';
    ctx.font = '11px "Courier New", monospace';
    ctx.fillText('Unsaved progress will be lost.', midX, cbY + 52);

    const btnW = 80, btnH = 32, btnY = cbY + 68;
    const yesX = midX - 94, noX = midX + 14;
    const yesSel = menu.loadCursor === 0, noSel = menu.loadCursor === 1;

    ctx.fillStyle   = yesSel ? '#0a2818' : '#080f1a';
    ctx.fillRect(yesX, btnY, btnW, btnH);
    ctx.strokeStyle = yesSel ? '#4aaa5a' : '#1e3040'; ctx.lineWidth = 1;
    ctx.strokeRect(yesX, btnY, btnW, btnH);
    ctx.fillStyle = yesSel ? '#78e888' : '#2a5040';
    ctx.font      = yesSel ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
    ctx.fillText('Yes', yesX + btnW / 2, btnY + 21);

    ctx.fillStyle   = noSel ? '#280a0a' : '#080f1a';
    ctx.fillRect(noX, btnY, btnW, btnH);
    ctx.strokeStyle = noSel ? '#aa4a4a' : '#1e3040'; ctx.lineWidth = 1;
    ctx.strokeRect(noX, btnY, btnW, btnH);
    ctx.fillStyle = noSel ? '#e06060' : '#502a2a';
    ctx.font      = noSel ? 'bold 14px "Courier New", monospace' : '13px "Courier New", monospace';
    ctx.fillText('No', noX + btnW / 2, btnY + 21);

    ctx.fillStyle = '#2a4858';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.fillText('\u2190 \u2192 select  \u00b7  enter confirm  \u00b7  B cancel', midX, cbY + cbH - 12);
    ctx.textAlign = 'left';
  }
}


// ─── Debug Menu ───────────────────────────────────────────────────────────────
// Rows are either 'toggle' (shows an ON/OFF pill, value is a boolean) or
// 'action' (shows a plain arrow-cue, fires once on Enter/Space -- see
// input.js). Row count/order here must match DEBUG_MENU_ROW_COUNT (state.js)
// and input.js's debugMenu.cursor handling.
function drawDebugMenu() {
  if (!debugMenu.open) return;

  const W = 512, H = 480;
  const PW = 200, PH = 268;
  const PX = Math.floor((W - PW) / 2);
  const PY = Math.floor((H - PH) / 2);

  // Panel background
  ctx.fillStyle = '#08121e';
  ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = '#e8a030';
  ctx.lineWidth = 2;
  ctx.strokeRect(PX + 1, PY + 1, PW - 2, PH - 2);
  ctx.strokeStyle = '#6a4010';
  ctx.lineWidth = 1;
  ctx.strokeRect(PX + 4, PY + 4, PW - 8, PH - 8);

  // Title
  ctx.fillStyle = '#e8a030';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DEBUG', PX + Math.floor(PW / 2), PY + 20);
  ctx.textAlign = 'left';

  const rows = [
    { type: 'toggle', label: '[ No Enemies ]', value: debugMode,                 onColor: '#78e888', offColor: '#3a5858' },
    { type: 'toggle', label: '[ Poison ]',     value: hasStatusEffect('poison'),  onColor: '#a0c830', offColor: '#3a5858' },
    { type: 'toggle', label: '[ Muddied ]',    value: hasStatusEffect('muddied'), onColor: '#c8a840', offColor: '#3a5858' },
    { type: 'toggle', label: '[ Slither ]',    value: hasStatusEffect('slither'), onColor: '#40c8c8', offColor: '#3a5858' },
    { type: 'action', label: '[ Heal Full ]' },
    { type: 'action', label: '[ Day +1 ]  (day ' + day + ')' },
    { type: 'action', label: '[ Warp to Map... ]' },
    { type: 'action', label: '[ Validate Data ]' },
    { type: 'toggle', label: '[ Home on Defeat ]', value: defeatWakeAtHome,      onColor: '#78e888', offColor: '#3a5858' },
  ];

  rows.forEach((row, i) => {
    const ry      = PY + 42 + i * 24;
    const sel     = debugMenu.cursor === i;
    if (sel) {
      ctx.fillStyle = '#0a1e2e';
      ctx.fillRect(PX + 8, ry - 13, PW - 16, 18);
    }
    ctx.fillStyle = sel ? '#8ac8d8' : '#4a7888';
    ctx.font      = sel ? 'bold 12px "Courier New", monospace' : '12px "Courier New", monospace';
    ctx.fillText((sel ? '\u25b6 ' : '  ') + row.label, PX + 12, ry);
    if (row.type === 'toggle') {
      ctx.fillStyle = row.value ? row.onColor : row.offColor;
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText(row.value ? 'ON' : 'OFF', PX + PW - 38, ry);
    }
  });

  // Hint
  ctx.fillStyle = '#3a6050';
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[ \u0060 / ESC ] close   [ I ] inspector', PX + Math.floor(PW / 2), PY + PH - 8);
  ctx.textAlign = 'left';
}

// ─── Debug Warp Menu ────────────────────────────────────────────────────────
// Reached from the debug menu's "Warp to Map..." row (never from the normal
// player menu -- see requirement in the task this was built for). Two
// modes: 'list' (pick any MAP_REGISTRY-listed map, scrollable) then 'coord'
// (nudge the landing tile before confirming). All list/selection state
// lives in warpMenu (state.js); navigation is handled in input.js.
const WARP_MENU_VISIBLE_ROWS = 11;

function drawWarpMenu() {
  if (!warpMenu.open) return;

  const W = 512, H = 480;
  const PW = 320, PH = 300;
  const PX = Math.floor((W - PW) / 2);
  const PY = Math.floor((H - PH) / 2);

  ctx.fillStyle = '#08121e';
  ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = '#e8a030';
  ctx.lineWidth = 2;
  ctx.strokeRect(PX + 1, PY + 1, PW - 2, PH - 2);
  ctx.strokeStyle = '#6a4010';
  ctx.lineWidth = 1;
  ctx.strokeRect(PX + 4, PY + 4, PW - 8, PH - 8);

  ctx.fillStyle = '#e8a030';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(warpMenu.mode === 'coord' ? 'WARP \u2014 TARGET' : 'WARP \u2014 SELECT MAP', PX + Math.floor(PW / 2), PY + 18);
  ctx.textAlign = 'left';

  if (warpMenu.mode === 'list') {
    const visible = warpMenu.mapIds.slice(warpMenu.scrollOffset, warpMenu.scrollOffset + WARP_MENU_VISIBLE_ROWS);
    visible.forEach((mapId, i) => {
      const idx = warpMenu.scrollOffset + i;
      const meta = (typeof MAP_METADATA !== 'undefined') ? MAP_METADATA[mapId] : undefined;
      const label = meta ? meta.displayName : (MAP_REGISTRY[mapId] ? MAP_REGISTRY[mapId].label : mapId);
      const tag = meta ? ' [' + meta.type + ']' : '';
      const ry  = PY + 34 + i * 20;
      const sel = warpMenu.cursor === idx;
      if (sel) {
        ctx.fillStyle = '#0a1e2e';
        ctx.fillRect(PX + 8, ry - 13, PW - 16, 18);
      }
      ctx.fillStyle = sel ? '#8ac8d8' : '#4a7888';
      ctx.font = sel ? 'bold 11px "Courier New", monospace' : '11px "Courier New", monospace';
      const line = (sel ? '\u25b6 ' : '  ') + label + tag;
      ctx.fillText(line.length > 42 ? line.slice(0, 39) + '...' : line, PX + 12, ry);
    });
    ctx.fillStyle = '#3a6050';
    ctx.font = '9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      (warpMenu.cursor + 1) + ' / ' + warpMenu.mapIds.length + '   [ \u2191\u2193 ] move   [ Enter ] select   [ Esc/\u0060 ] cancel',
      PX + Math.floor(PW / 2), PY + PH - 10
    );
    ctx.textAlign = 'left';
  } else {
    // 'coord' mode
    const meta = (typeof MAP_METADATA !== 'undefined') ? MAP_METADATA[warpMenu.targetMapId] : undefined;
    const label = meta ? meta.displayName : warpMenu.targetMapId;
    ctx.fillStyle = '#8ac8d8';
    ctx.font = '12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, PX + Math.floor(PW / 2), PY + 50);

    ctx.fillStyle = '#e8a030';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('col ' + warpMenu.targetCol + ' , row ' + warpMenu.targetRow, PX + Math.floor(PW / 2), PY + 90);

    const targetMap = meta ? meta.map : (MAP_REGISTRY[warpMenu.targetMapId] ? MAP_REGISTRY[warpMenu.targetMapId].map : null);
    if (targetMap) {
      const tile = targetMap[warpMenu.targetRow] ? targetMap[warpMenu.targetRow][warpMenu.targetCol] : undefined;
      const walkable = tile !== undefined && WALKABLE[tile];
      ctx.fillStyle = walkable ? '#78e888' : '#e86868';
      ctx.font = '11px "Courier New", monospace';
      ctx.fillText(walkable ? 'walkable' : 'blocked \u2014 will land on nearest open tile', PX + Math.floor(PW / 2), PY + 112);
    }

    ctx.fillStyle = '#3a6050';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('[ arrows ] move target   [ Enter ] warp   [ Esc ] back', PX + Math.floor(PW / 2), PY + PH - 10);
    ctx.textAlign = 'left';
  }
}

// ─── Debug Map Inspector ────────────────────────────────────────────────────
// A read-only HUD overlay (NOT a modal -- never blocks input) toggled with
// the 'I' key. Shows current map/tile/encounter state for fast manual
// testing (map transitions, edge transitions, coordinates, encounter
// eligibility, day-gated geography). See debugInspector (state.js) and
// toggleDebugInspector(); drawn on top of everything else in render().
function drawDebugInspector() {
  if (!debugInspector.open) return;

  const mapId = (typeof mapRegistryId === 'function') ? mapRegistryId(activeMap) : null;
  const meta  = (mapId && typeof MAP_METADATA !== 'undefined') ? MAP_METADATA[mapId] : undefined;

  const col = Math.floor(player.x / TILE), row = Math.floor(player.y / TILE);
  const tile = activeMap[row] ? activeMap[row][col] : undefined;
  const tileProps = (tile !== undefined && typeof getTileProperties === 'function') ? getTileProperties(tile) : null;
  const tileName = (tile !== undefined && typeof getTileName === 'function') ? getTileName(tile) : null;
  const walkable = tile !== undefined && typeof isTileWalkable === 'function' && isTileWalkable(tile);
  const encounterEligible = (typeof isEncounterEligibleTile === 'function') ? isEncounterEligibleTile(tile) : false;

  const encountersOn = !debugMode;
  const mapAllowsEncounters = meta ? meta.allowRandomEncounters : null;
  let poolLine;
  if (!encountersOn) poolLine = 'none (No Enemies debug toggle is ON)';
  else if (!encounterEligible) poolLine = 'none (not on encounter-eligible tile)';
  else {
    const pool = (typeof currentEncounterPool === 'function') ? currentEncounterPool() : null;
    poolLine = (pool && pool.length) ? pool.map(t => t.name).join(', ') : 'none';
  }

  const nearby = (typeof debugNearbyTransitionInfo === 'function') ? debugNearbyTransitionInfo() : 'n/a';
  const featureInfo = (typeof debugMapFeatureInfo === 'function') ? debugMapFeatureInfo() : { count: 0, nearbyInspect: null, activeTrigger: null };

  // Tile-property flags, compact -- only lists the ones that are true for
  // this specific tile, so a plain GRASS/PATH tile doesn't print a wall of
  // "no" flags. Falls back to a plain "no TILE_PROPERTIES entry" note for an
  // unknown tile id (validateGameData() is where that becomes an error).
  let propsLine;
  if (!tileProps) {
    propsLine = tile !== undefined ? 'no TILE_PROPERTIES entry' : 'n/a';
  } else {
    const flagTags = [
      tileProps.isWater && 'water', tileProps.isRoad && 'road', tileProps.isWall && 'wall',
      tileProps.isInterior && 'interior', tileProps.isDungeon && 'dungeon',
      tileProps.isTransition && 'transition', tileProps.isDecorative && 'decorative',
      tileProps.isSecret && 'secret', tileProps.isHazard && 'hazard', tileProps.deprecated && 'DEPRECATED',
    ].filter(Boolean);
    propsLine = 'CAT: ' + (tileProps.category || '?') +
      (Array.isArray(tileProps.tags) && tileProps.tags.length ? '   TAGS: ' + tileProps.tags.join(',') : '') +
      (flagTags.length ? '   [' + flagTags.join(' ') + ']' : '');
  }

  const lines = [
    'MAP: ' + (mapId || '?') + (meta ? '  [' + meta.region + ' / ' + meta.type + ']' : ''),
    'NAME: ' + (meta ? meta.displayName : locationName()),
    'POS: col ' + col + ', row ' + row + '   FACING: ' + player.facing,
    'TILE: ' + (tile !== undefined ? tile : '?') + (tileName ? ' (' + tileName + ')' : '') +
      '   WALK: ' + (walkable ? 'yes' : 'no') + '   ENC-TILE: ' + (encounterEligible ? 'yes' : 'no'),
    'PROPS: ' + propsLine,
    'POOL: ' + poolLine,
    'ENCOUNTERS: ' + (encountersOn ? 'ON' : 'OFF') +
      (meta ? '  (map allows: ' + (mapAllowsEncounters ? 'yes' : 'no') + ')' : '') +
      '   DAY: ' + day,
    'NEARBY: ' + nearby,
    'FEATURES: ' + featureInfo.count + ' on map' +
      (featureInfo.nearbyInspect
        ? '   inspect: ' + featureInfo.nearbyInspect.label +
          (featureInfo.nearbyInspect.onceFlag ? ' (seen: ' + (featureInfo.nearbyInspect.seen ? 'yes' : 'no') + ')' : '')
        : '') +
      (featureInfo.activeTrigger
        ? '   trigger: ' + featureInfo.activeTrigger.label +
          (featureInfo.activeTrigger.onceFlag ? ' (seen: ' + (featureInfo.activeTrigger.seen ? 'yes' : 'no') + ')' : '')
        : ''),
  ];

  const PX = 4, PY = 4;
  const lineHeight = 12;
  const PW = 300, PH = 10 + lines.length * lineHeight;

  ctx.fillStyle = 'rgba(6,14,10,0.82)';
  ctx.fillRect(PX, PY, PW, PH);
  ctx.strokeStyle = 'rgba(120,200,150,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PX + 0.5, PY + 0.5, PW - 1, PH - 1);

  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = '#a8e8b8';
  lines.forEach((line, i) => {
    ctx.fillText(line, PX + 6, PY + 12 + i * lineHeight);
  });
}


