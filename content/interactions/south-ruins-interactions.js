'use strict';

// South Ruins interactions: entrance hall, dungeon floors, Mulholland, Wrongteeth.
// Interaction functions moved verbatim from interactions.js by the regional-content-split.
// Loaded BEFORE interactions.js, which keeps the generic engine, MAP_FEATURES merge,
// and the INTERACT_HANDLERS / OVERWORLD_INTERACT_HANDLERS tables that reference these.

// ── Dungeon floor 1 — chests and floor NPCs (the Briar Warden no longer dens here) ─
function interactDungeonFloor1() {
  // Chest: open it if adjacent and not yet opened
  if (!DUNGEON_CHEST.opened) {
    const cx = player.x - DUNGEON_CHEST.x;
    const cy = player.y - DUNGEON_CHEST.y;
    if (Math.sqrt(cx * cx + cy * cy) < TALK_RADIUS) {
      DUNGEON_CHEST.opened = true;
      const it = DUNGEON_CHEST.item;
      if (hasStatusEffect('cursed')) {
        dialogue.name  = '';
        dialogue.pages = [['You yank the latch too hard.', `The ${it.name} flies out and shatters on the stone floor.`, 'Pieces everywhere. It\u2019s ruined.']];
      } else {
        grantItem(it.name);
        dialogue.name  = '';
        dialogue.pages = [['Chest opened.', `${it.name}  ${itemStatParen(it)}  \u2014 added to items.`]];
      }
      dialogue.open  = true;
      dialogue.page  = 0;
      return true;
    }
  }
  // Alcove chest: hidden behind the false wall on the left side of the main hall
  if (!DUNGEON_ALCOVE_CHEST.opened) {
    const acx = player.x - DUNGEON_ALCOVE_CHEST.x;
    const acy = player.y - DUNGEON_ALCOVE_CHEST.y;
    if (Math.sqrt(acx * acx + acy * acy) < TALK_RADIUS) {
      DUNGEON_ALCOVE_CHEST.opened = true;
      const it = DUNGEON_ALCOVE_CHEST.item;
      if (hasStatusEffect('cursed')) {
        dialogue.name  = '';
        dialogue.pages = [['You yank the latch too hard.', `The ${it.name} flies out and shatters on the stone floor.`, 'Pieces everywhere. It\u2019s ruined.']];
      } else {
        grantItem(it.name);
        dialogue.name  = '';
        dialogue.pages = [['Chest opened.', `${it.name}  ${itemStatParen(it)}  \u2014 added to items.`]];
      }
      dialogue.open = true;
      dialogue.page = 0;
      return true;
    }
  }
  // (The Briar Warden used to den here; it now waits in the hidden meadow —
  // see interactWildsAndOutposts.)
  interactSimpleNPCs();
  return interactionUiOpened();
}

function interactRuinsEntranceHall() {
  // ── South Ruins Entrance Hall — lore NPCs only, no chests/quests here ───
  interactSimpleNPCs();
  return interactionUiOpened();
}

// ── Dungeon floor 4 — Mulholland ─────────────────────────────────────────────
function interactMulhollandFloor() {
  if (!MULHOLLAND.defeated) {
    const mx = player.x - MULHOLLAND.x;
    const my = player.y - MULHOLLAND.y;
    if (Math.sqrt(mx * mx + my * my) < TALK_RADIUS) {
      dialogue.name  = '';
      dialogue.pages = MULHOLLAND_DIALOGUE;
      dialogue.open  = true;
      dialogue.page  = 0;
      queueDialogueEncounter('mulholland');
    }
  }
  return interactionUiOpened();
}

// ── Dungeon floor 5 — Wrongteeth (the boss) ──────────────────────────────────
function interactWrongteethFloor() {
  if (BOSS.knockedDown && !BOSS.defeated) {
    const bx = player.x - BOSS.x;
    const by = player.y - BOSS.y;
    if (Math.sqrt(bx * bx + by * by) < TALK_RADIUS) {
      choice.title   = 'Wrongteeth';
      choice.options = ['Kill it', 'Let it hold you'];
      choice.cursor  = 0;
      choice.callbacks = [
        function killWrongteeth() {
          BOSS.defeated    = true;
          BOSS.knockedDown = false;
          const kPages = [
            ['You raise your weapon.',
             'It doesn\u2019t flinch. It keeps looking at you.',
             'Then it\u2019s over.'],
          ];
          // Award the bear even if the player never met Pip — resolving
          // Wrongteeth first must not lock the Schilling quest.
          if (!schilling_returned) {
            kPages.push([
              'On the ground beside it, half-buried in the mud,',
              'is a small cloth bear.',
              'Damp. One ear bent.',
              'You pick it up.',
            ]);
            dialogue.callbacks = [function() {
              grantItem('Schilling');
            }];
          } else {
            dialogue.callbacks = null;
          }
          dialogue.name  = '';
          dialogue.pages = kPages;
          dialogue.open  = true;
          dialogue.page  = 0;
        },
        function hugWrongteeth() {
          BOSS.defeated    = true;
          BOSS.knockedDown = false;
          const hPages = [
            ['The claws come up slowly.',
             'They wrap around your shoulders.',
             'You are very aware of how large they are. Of what they could do.',
             'They don\u2019t.'],
            ['It is warm.',
             'That surprises you more than anything else.',
             'The body pressed against you is warm, and it trembles slightly, and the sound it makes is very small for something so large.'],
            ['You think: this is a child.',
             'Not a human child. But something young, and frightened, and lost somewhere it has no language for.',
             'You think about what it must be like to be hungry and enormous and unable to explain yourself to anything.'],
            ['You think about the claw marks on the dungeon walls.',
             'Deep ones. Spaced wrong for any person.',
             'You think about what happened to the people who came here before you.',
             'The ones who didn\u2019t come back.'],
            ['The claws tighten very slightly.',
             'You stay still.',
             'After a while, it lets go.',
             'The big eye finds yours. The tiny eye finds yours.',
             'Then it curls smaller, and is quiet.'],
          ];
          // Same as the kill branch: award the bear regardless of whether the
          // player has met Pip yet.
          if (!schilling_returned) {
            hPages.push([
              'When it lets go, something drops from the tangle of its arms.',
              'A small cloth bear.',
              'It lands in the mud between you.',
              'It looks at the bear. It looks at you.',
              'You pick it up.',
            ]);
            dialogue.callbacks = [function() {
              grantItem('Schilling');
            }];
          } else {
            dialogue.callbacks = null;
          }
          dialogue.name  = 'Wrongteeth';
          dialogue.pages = hPages;
          dialogue.open  = true;
          dialogue.page  = 0;
        },
      ];
      choice.open = true;
    }
  } else if (!BOSS.defeated) {
    const bx = player.x - BOSS.x;
    const by = player.y - BOSS.y;
    if (Math.sqrt(bx * bx + by * by) < TALK_RADIUS) {
      dialogue.name              = 'Wrongteeth';
      dialogue.pages             = BOSS_DIALOGUE;
      dialogue.open              = true;
      dialogue.page              = 0;
      queueDialogueEncounter('boss');
    }
  }
  return interactionUiOpened();
}

// ── SOUTH_RUINS_MAP_FEATURES: region-owned MAP_FEATURES entries (merged in interactions.js) ──
const SOUTH_RUINS_MAP_FEATURES = {
  // \u2500\u2500 South Ruins \u2014 floor 1 (no inscription content yet) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Marker placed near where descendToDungeon1() (world-transitions.js)
  // lands the player (7.5, 12.5) -- "near the entrance" from the player's
  // actual point of view on this floor, not the stairs-down tile at the
  // opposite end that leads further in.
  DUNGEON_MAP: [
    {
      id: 'south_ruins_floor1_marker', type: 'inspect', x: 5.5, y: 12.5, label: 'First-threshold carving',
      pages: [
        ['A shallow carving near the entrance, easy to miss in the dark.'],
        ['FIRST THRESHOLD',
         'Those who mapped this level numbered the floors as they went.',
         'The numbering does not continue past what they found on the third.'],
      ],
    },
  ],

  // \u2500\u2500 South Ruins \u2014 floor 6 (ties into Fen Shade's own observed lore: it
  // "seeped down from the wetlands above through the drainage cracks") \u2500\u2500
  DUNGEON6_MAP: [
    {
      id: 'south_ruins_floor6_seep_mark', type: 'inspect', x: 3.5, y: 6.5, label: 'Damp stain',
      pages: [
        ['A dark stain runs down the wall here, following a crack toward the floor.'],
        ['The stone is damp to the touch, though nothing overhead should be able to reach this deep.'],
        ['Whatever seeped down through here did not come from a normal source of water.'],
      ],
    },
  ],

};
