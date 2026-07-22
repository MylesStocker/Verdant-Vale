'use strict';

// render-ui.js — overlay panel rendering: continent map, Accord panel,
// choice box, dialogue box, main/pause menu, and the debug menu.

// ─── Continent Map Panel ──────────────────────────────────────────────────────
// Full-screen inspection panel opened when the player examines the wall map in
// the Calwick Empire office. Flavor/worldbuilding only — not the playable map.
function drawContinentMapPanel() {
  if (!continentMap.open) return;

  // Dim background
  ctx.fillStyle = 'rgba(0,0,0,0.80)';
  ctx.fillRect(0, 0, 512, 480);

  const PX = 20, PY = 16, PW = 472, PH = 448;

  // Parchment background
  ctx.fillStyle = '#c8b870';
  ctx.fillRect(PX, PY, PW, PH);
  ctx.fillStyle = '#d4c47a';
  ctx.fillRect(PX + 2, PY + 2, PW - 4, PH - 4);

  // Outer frame — dark wood
  ctx.strokeStyle = '#3a1e08';
  ctx.lineWidth   = 4;
  ctx.strokeRect(PX, PY, PW, PH);
  ctx.strokeStyle = '#7a5020';
  ctx.lineWidth   = 2;
  ctx.strokeRect(PX + 5, PY + 5, PW - 10, PH - 10);

  // Frame corner bolts
  ctx.fillStyle = '#2a1008';
  for (const [bx, by] of [[PX, PY], [PX + PW - 8, PY], [PX, PY + PH - 8], [PX + PW - 8, PY + PH - 8]]) {
    ctx.fillRect(bx, by, 8, 8);
    ctx.fillStyle = '#a07030';
    ctx.fillRect(bx + 2, by + 2, 4, 4);
    ctx.fillStyle = '#2a1008';
  }

  // Title
  ctx.fillStyle = '#2a1008';
  ctx.font      = 'bold 13px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('IMPERIAL DOMAIN \u2014 SURVEY OF YEAR 700', 256, PY + 26);
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText('Cartographic Office of the Council of Thirty-Three', 256, PY + 40);

  // Separator line
  ctx.fillStyle = '#8a6030';
  ctx.fillRect(PX + 10, PY + 46, PW - 20, 1);

  // ── Continent outline ──────────────────────────────────────────────────────
  // Main landmass — a large irregular polygon covering ~80% of the map panel
  const MX = PX + 18, MY = PY + 55, MW = PW - 36, MH = PH - 80;

  // Sea background
  ctx.fillStyle = '#7a9ab8';
  ctx.fillRect(MX, MY, MW, MH);

  // Light wave lines on sea
  ctx.fillStyle = 'rgba(120, 160, 200, 0.4)';
  for (let wy = MY + 18; wy < MY + MH; wy += 14) {
    ctx.fillRect(MX + 4, wy, MW - 8, 1);
  }

  // Main continent (Empire-controlled — gold-green)
  ctx.fillStyle = '#8aaa60';
  ctx.beginPath();
  ctx.moveTo(MX + 30,       MY + 10);
  ctx.lineTo(MX + MW - 60,  MY + 8);
  ctx.lineTo(MX + MW - 30,  MY + 30);
  ctx.lineTo(MX + MW - 10,  MY + 80);
  ctx.lineTo(MX + MW - 5,   MY + MH * 0.55);
  ctx.lineTo(MX + MW - 30,  MY + MH - 30);
  ctx.lineTo(MX + MW - 80,  MY + MH - 10);
  ctx.lineTo(MX + 60,       MY + MH - 8);
  ctx.lineTo(MX + 20,       MY + MH - 50);
  ctx.lineTo(MX + 10,       MY + MH * 0.60);
  ctx.lineTo(MX + 15,       MY + MH * 0.35);
  ctx.lineTo(MX + 8,        MY + 50);
  ctx.closePath();
  ctx.fill();

  // Terrain shading (slightly darker interior — gives relief impression)
  ctx.fillStyle = 'rgba(60,90,30,0.15)';
  ctx.beginPath();
  ctx.moveTo(MX + 80,       MY + 40);
  ctx.lineTo(MX + MW - 100, MY + 38);
  ctx.lineTo(MX + MW - 60,  MY + MH * 0.50);
  ctx.lineTo(MX + MW - 110, MY + MH - 50);
  ctx.lineTo(MX + 100,      MY + MH - 55);
  ctx.lineTo(MX + 60,       MY + MH * 0.50);
  ctx.closePath();
  ctx.fill();

  // Unmapped fringe — grey, at edges of continent
  ctx.fillStyle = '#9a9a88';
  // North-west fringe
  ctx.beginPath();
  ctx.moveTo(MX + 8,  MY + 50);
  ctx.lineTo(MX + 30, MY + 10);
  ctx.lineTo(MX + 60, MY + 22);
  ctx.lineTo(MX + 30, MY + 60);
  ctx.lineTo(MX + 15, MY + 65);
  ctx.closePath();
  ctx.fill();
  // South-east fringe
  ctx.beginPath();
  ctx.moveTo(MX + MW - 30, MY + MH - 30);
  ctx.lineTo(MX + MW - 10, MY + MH - 80);
  ctx.lineTo(MX + MW - 5,  MY + MH * 0.55);
  ctx.lineTo(MX + MW - 20, MY + MH - 15);
  ctx.closePath();
  ctx.fill();

  // Canal zone / river system (thin blue lines)
  ctx.strokeStyle = '#5888a8';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(MX + 140, MY + MH * 0.55);
  ctx.lineTo(MX + 200, MY + MH * 0.48);
  ctx.lineTo(MX + 260, MY + MH * 0.52);
  ctx.lineTo(MX + 310, MY + MH * 0.44);
  ctx.stroke();
  ctx.lineWidth = 1;

  // Road network (thin tan lines)
  ctx.strokeStyle = 'rgba(160, 120, 60, 0.6)';
  ctx.beginPath();
  ctx.moveTo(MX + 180, MY + MH - 55);
  ctx.lineTo(MX + 210, MY + MH * 0.55);
  ctx.lineTo(MX + 230, MY + 50);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(MX + 230, MY + MH * 0.55);
  ctx.lineTo(MX + 310, MY + MH * 0.50);
  ctx.stroke();

  // ── Location markers ───────────────────────────────────────────────────────
  function placeMarker(x, y, label, color, dotSize) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, dotSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1008';
    ctx.font = 'bold 8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y - dotSize - 3);
    ctx.textAlign = 'left';
  }

  // Halcyra — imperial capital (center-right of continent)
  placeMarker(MX + 280, MY + MH * 0.40, 'Halcyra \u2605', '#b83030', 5);
  // Verdant Vale region — player's area (lower-left)
  placeMarker(MX + 160, MY + MH * 0.62, 'Verdant Vale', '#3060a0', 4);
  // Ardwick — north province
  placeMarker(MX + 220, MY + 55,        'Ardwick',      '#2a1008', 3);
  // Eastern reaches
  placeMarker(MX + MW - 90, MY + MH * 0.38, 'Eastern Reaches', '#2a1008', 3);

  // Imperial boundary line — dashed outer ring showing full territorial extent
  ctx.strokeStyle = '#b83030';
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(MX + 35,       MY + 14);
  ctx.lineTo(MX + MW - 65,  MY + 12);
  ctx.lineTo(MX + MW - 32,  MY + 34);
  ctx.lineTo(MX + MW - 14,  MY + 84);
  ctx.lineTo(MX + MW - 8,   MY + MH * 0.55);
  ctx.lineTo(MX + MW - 32,  MY + MH - 34);
  ctx.lineTo(MX + MW - 82,  MY + MH - 14);
  ctx.lineTo(MX + 64,       MY + MH - 12);
  ctx.lineTo(MX + 24,       MY + MH - 54);
  ctx.lineTo(MX + 12,       MY + MH * 0.60);
  ctx.lineTo(MX + 16,       MY + MH * 0.35);
  ctx.lineTo(MX + 10,       MY + 54);
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);

  // ── Legend ─────────────────────────────────────────────────────────────────
  const LX = PX + 14, LY = PY + PH - 26;
  ctx.fillStyle = '#8aaa60';
  ctx.fillRect(LX, LY - 6, 10, 8);
  ctx.fillStyle = '#2a1008';
  ctx.font = '8px "Courier New", monospace';
  ctx.fillText('Empire', LX + 13, LY);

  ctx.fillStyle = '#9a9a88';
  ctx.fillRect(LX + 58, LY - 6, 10, 8);
  ctx.fillStyle = '#2a1008';
  ctx.fillText('Unmapped', LX + 71, LY);

  ctx.fillStyle = '#b83030';
  ctx.fillRect(LX + 136, LY - 6, 10, 3);
  ctx.fillStyle = '#2a1008';
  ctx.fillText('Imperial boundary', LX + 149, LY);

  // Close hint
  ctx.fillStyle = '#5a3810';
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('[ SPACE / ESC ] close', PX + PW - 12, PY + PH - 6);
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

  const BW = 220, BH = 20 + choice.options.length * 24 + 20;
  const BX = Math.floor((512 - BW) / 2);
  const BY = 280;
  const PAD = 14;

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
  ctx.fillRect(BX + PAD, BY + 24, BW - PAD * 2, 1);

  // Options
  ctx.font = '13px "Courier New", monospace';
  choice.options.forEach((opt, i) => {
    const selected = i === choice.cursor;
    ctx.fillStyle = selected ? '#f0e090' : '#aac4c4';
    const label = (selected ? '\u25b6 ' : '  ') + opt;
    ctx.fillText(label, BX + PAD, BY + 44 + i * 24);
  });
}


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

  // Word-wrap a single string to fit within maxW pixels, returning sub-lines.
  function wrapLine(text, maxW) {
    if (ctx.measureText(text).width <= maxW) return [text];
    const words = text.split(' ');
    const out = [];
    let cur = '';
    for (const word of words) {
      const candidate = cur ? cur + ' ' + word : word;
      if (ctx.measureText(candidate).width <= maxW) {
        cur = candidate;
      } else {
        if (cur) out.push(cur);
        cur = word;
      }
    }
    if (cur) out.push(cur);
    return out.length ? out : [text];
  }

  // Lazily preprocess authored pages into height-safe visual pages.
  // Replaces dialogue.pages in-place; identity check avoids reprocessing each frame.
  if (dialogue._preprocessedFor !== dialogue.pages) {
    const LINE_H = 22;
    const maxVisLines = Math.max(1, Math.floor((BH - 40) / LINE_H));
    const visualPages = [];
    for (const page of dialogue.pages) {
      const sublines = [];
      for (const line of page) {
        for (const sub of wrapLine(line, maxLineW)) sublines.push(sub);
      }
      for (let i = 0; i < sublines.length; i += maxVisLines) {
        visualPages.push(sublines.slice(i, i + maxVisLines));
      }
    }
    dialogue.pages = visualPages;
    dialogue._preprocessedFor = visualPages;
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
      'Tweezers':           'A small pair of steel tweezers, found in an abandoned Drenwick apartment.',
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
      ctx.fillText(`(${itemStatLabel(item)})`, CX + 14 + label.length * 8, iy);
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


