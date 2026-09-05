'use strict';

// input.js — keyboard input: the pressed-keys table and the keydown/keyup
// listeners that route input to whichever screen is currently active
// (combat, menu, choice box, shop, debug menu, overlay panels, overworld).

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = Object.create(null);
window.addEventListener('keydown', e => {
  if (e.key.startsWith('Arrow')) e.preventDefault();
  if (!keys[e.key]) {  // fire-once for all action keys
    if (seraLioraCutscene.active) {
      // Fully scripted cutaway: only the established dialogue advance action
      // is accepted. Movement, menu/Notebook, save/load, debug inspector/menu,
      // warp, choices, shops, inventory, and every player-mode command stay
      // unavailable through both spoken and silent transition beats.
      if (dialogue.open && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        handleInteract();
      }
    } else if (combat.active && combat.flashTimer === 0 && debugMode && e.key === '`') {
      // ── Debug-only: exit the current battle safely ────────────────────────
      // The debug menu itself can't open during combat (combat input always
      // takes priority — see the outer if/else below), so this is a direct,
      // debug-gated key instead of a menu row. endCombat() resets every
      // combat.* flag with no victory/defeat rewards or penalties applied.
      // (Falls through to `keys[e.key] = true` below like every other key —
      // no early return, so key-repeat while held can't double-fire anything.)
      e.preventDefault();
      endCombat();
    } else if (combat.active && combat.flashTimer === 0) {
      // ── Combat input ──────────────────────────────────────────────────────
      if (combat.phase === 'choose') {
        const nOpts = combatOptions().length;
        if (e.key === 'ArrowLeft'  || e.key === 'a') combat.cursor = (combat.cursor + nOpts - 1) % nOpts;
        if (e.key === 'ArrowRight' || e.key === 'd') combat.cursor = (combat.cursor + 1) % nOpts;
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleCombatAction(); }
      } else if (combat.phase === 'item') {
        // cursor 0..groups.length-1 = grouped item rows, groups.length = Back
        const last = groupItems().length;
        if (e.key === 'ArrowUp'   || e.key === 'w') combat.itemCursor = Math.max(0, combat.itemCursor - 1);
        if (e.key === 'ArrowDown' || e.key === 's') combat.itemCursor = Math.min(last, combat.itemCursor + 1);
        if (e.key === 'b' || e.key === 'B' || e.key === 'Escape') { e.preventDefault(); combat.phase = 'choose'; }
        if (e.key === ' ' || e.key === 'Enter')     { e.preventDefault(); handleCombatAction(); }
      } else {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleCombatAction(); }
      }
    } else if (!combat.active) {
      if (menu.open) {
        if (menu.screen === 'saveConfirm') {
          // ── Save-confirm navigation ─────────────────────────────────────
          if (e.key === 'ArrowLeft'  || e.key === 'a') menu.saveCursor = 0;
          if (e.key === 'ArrowRight' || e.key === 'd') menu.saveCursor = 1;
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (menu.saveCursor === 0) {
              // canSaveHere() (save.js) is the single authoritative check --
              // consulted here for the banner, and again inside saveGame()
              // itself so a save can never be written from a blocked map by
              // any path. Maps flagged allowSave: false (the unmarked
              // chamber, the Sunken Gallery — no town/bed/healing/shelter
              // there) refuse with a banner instead of writing a save.
              if (!canSaveHere()) {
                menu.saveBlockedMessage = 120;
                menu.screen = 'main';
              } else {
                saveGame();
              }
            } else {
              menu.screen = 'main';
            }
          }
          if (e.key === 'Escape' || e.key === 'm' || e.key === 'M' || e.key === 'b' || e.key === 'B') {
            e.preventDefault(); menu.screen = 'main';
          }
        } else if (menu.screen === 'loadConfirm') {
          // ── Load-confirm navigation ─────────────────────────────────────
          if (e.key === 'ArrowLeft'  || e.key === 'a') menu.loadCursor = 0;
          if (e.key === 'ArrowRight' || e.key === 'd') menu.loadCursor = 1;
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (menu.loadCursor === 0) {
              const ok = loadGame();
              menu.loadMessage = 120;
              menu.loadStatus  = ok ? 'loaded' : 'nosave';
              menu.screen      = 'main';
              // Keep menu open so the banner is visible; player closes with M / Esc.
            } else {
              menu.screen = 'main';
            }
          }
          if (e.key === 'Escape' || e.key === 'm' || e.key === 'M' || e.key === 'b' || e.key === 'B') {
            e.preventDefault(); menu.screen = 'main';
          }
        } else if (menu.screen === 'notebook') {
          // ── Notebook navigation ─────────────────────────────────────────
          // A cursor moves over every row (so quest notes still scroll into
          // view); rows in the SPECIAL ITEMS section are inspectable — ENTER
          // opens the item's read (its description, or the full letter).
          const nbNotes = (typeof getActiveQuestNotes === 'function') ? getActiveQuestNotes() : [];
          const nbSpecialStart = nbNotes.findIndex(n => n.header === 'SPECIAL ITEMS');
          const isInspectable = (i) => nbSpecialStart >= 0 && i > nbSpecialStart && !nbNotes[i].header;
          if (e.key === 'ArrowUp'   || e.key === 'w') menu.notebookCursor = Math.max(0, menu.notebookCursor - 1);
          if (e.key === 'ArrowDown' || e.key === 's') menu.notebookCursor = Math.min(Math.max(0, nbNotes.length - 1), menu.notebookCursor + 1);
          if ((e.key === ' ' || e.key === 'Enter') && isInspectable(menu.notebookCursor)) {
            e.preventDefault();
            const it = nbNotes[menu.notebookCursor];
            menu.open = false; menu.screen = 'main';
            // Some special items DO something on inspect (e.g. the Warp Stone
            // opens the warp menu); the rest just read (their description/letter).
            const action = (typeof getSpecialItemInspectAction === 'function') ? getSpecialItemInspectAction(it.title) : null;
            if (action === 'warp') {
              warpMenu.open         = true;
              warpMenu.mode         = 'list';
              warpMenu.cursor       = 0;
              warpMenu.scrollOffset = 0;
              warpMenu.playerMode   = true;    // curated destinations, direct warp
              warpMenu.destinations = (typeof getPlayerWarpDestinations === 'function')
                ? getPlayerWarpDestinations() : getDebugWarpDestinations();
            } else {
              openDialogue(it.title, getSpecialItemInspectPages(it.title));
            }
          }
          if (e.key === 'Escape' || e.key === 'm' || e.key === 'M' || e.key === 'b' || e.key === 'B') {
            e.preventDefault(); menu.screen = 'main';
          }
        } else {
          // ── Main menu navigation ──────────────────────────────────────
          if (e.key === 'ArrowUp'   || e.key === 'w') {
            menu.itemCursor = Math.max(0, menu.itemCursor - 1);
            if (menu.itemCursor < menu.scrollOffset)
              menu.scrollOffset = menu.itemCursor;
          }
          if (e.key === 'ArrowDown' || e.key === 's') {
            const gLen = groupItems().length; // Save Game at gLen, Load Game at gLen+1
            menu.itemCursor = Math.min(gLen + 1, menu.itemCursor + 1);
            if (menu.itemCursor >= menu.scrollOffset + 4)
              menu.scrollOffset = menu.itemCursor - 3;
          }
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            const grouped = groupItems();
            if (menu.itemCursor < grouped.length) {
              const { name, item: it } = grouped[menu.itemCursor];
              if (it.battleOnly) {
                // Combat-only consumable (e.g. Bullet Time): not usable from the
                // field menu. Do nothing — it is neither consumed nor equipped
                // here, so it stays in the bag for the next fight.
              } else if (isStatusCureItem(it)) {
                // Same shared status-cure path as combat: clears an active
                // matching status (if any), else nothing happens. Either way the
                // item is consumed (the field menu shows no message).
                applyStatusCure(it);
                const idx = stats.items.findIndex(i => i.name === name);
                if (idx !== -1) stats.items.splice(idx, 1);
              } else if (it.type === 'potion') {
                stats.hp = Math.min(stats.maxHp, stats.hp + it.heals);
                // Remove one instance from the underlying array
                const idx = stats.items.findIndex(i => i.name === name);
                if (idx !== -1) stats.items.splice(idx, 1);
              } else {
                equipItem(it);
              }
              const newGLen = groupItems().length;
              menu.itemCursor = Math.min(menu.itemCursor, newGLen);
              if (menu.itemCursor < menu.scrollOffset)
                menu.scrollOffset = menu.itemCursor;
            } else if (menu.itemCursor === grouped.length) {
              menu.screen = 'saveConfirm'; menu.saveCursor = 0;
            } else if (menu.itemCursor === grouped.length + 1) {
              menu.screen = 'loadConfirm'; menu.loadCursor = 0;
            }
          }
          if (e.key === 'n' || e.key === 'N') { e.preventDefault(); menu.screen = 'notebook'; menu.notebookOffset = 0; menu.notebookCursor = 0; }
          if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') { e.preventDefault(); toggleMenu(); }
        }
      } else if (choice.open) {
        // ── Choice-box navigation ─────────────────────────────────────────
        e.preventDefault();
        if (e.key === 'ArrowUp'   || e.key === 'w') choice.cursor = Math.max(0, choice.cursor - 1);
        if (e.key === 'ArrowDown' || e.key === 's') choice.cursor = Math.min(choice.options.length - 1, choice.cursor + 1);
        if (e.key === ' ' || e.key === 'Enter') {
          const cb = choice.callbacks[choice.cursor];
          choice.open = false;
          if (cb) cb();
        }
        if (e.key === 'Escape') { choice.open = false; }
      } else if (shop.open) {
        // ── Shop navigation ───────────────────────────────────────────────
        e.preventDefault();
        if (shop.screen === 'main') {
          if (e.key === 'ArrowUp'   || e.key === 'w') shop.cursor = Math.max(0, shop.cursor - 1);
          if (e.key === 'ArrowDown' || e.key === 's') shop.cursor = Math.min(2, shop.cursor + 1);
          if (e.key === ' ' || e.key === 'Enter') {
            if (shop.cursor === 0)      { shop.screen = 'buy';  shop.cursor = 0; }
            else if (shop.cursor === 1) { shop.screen = 'sell'; shop.cursor = 0; }
            else                        { shop.open = false; }
          }
          if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') shop.open = false;
        } else if (shop.screen === 'buy') {
          const listLen = shop.stock.length + 1; // +1 for Back
          if (e.key === 'ArrowUp'   || e.key === 'w') shop.cursor = Math.max(0, shop.cursor - 1);
          if (e.key === 'ArrowDown' || e.key === 's') shop.cursor = Math.min(listLen - 1, shop.cursor + 1);
          if (e.key === ' ' || e.key === 'Enter') {
            if (shop.cursor === shop.stock.length) {
              shop.screen = 'main'; shop.cursor = 0;
            } else {
              const it = shop.stock[shop.cursor];
              if (stats.gold >= it.price) {
                stats.gold -= it.price;
                grantItem(it.name);
              }
            }
          }
          if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') { shop.screen = 'main'; shop.cursor = 0; }
        } else if (shop.screen === 'sell') {
          // Grouped view: multiples of the same item share one row (groupItems()),
          // like the pause menu. The cursor indexes groups; selling removes the
          // group's representative instance.
          const sellable = groupItems();
          const listLen = sellable.length + 1; // +1 for Back
          if (e.key === 'ArrowUp'   || e.key === 'w') shop.cursor = Math.max(0, shop.cursor - 1);
          if (e.key === 'ArrowDown' || e.key === 's') shop.cursor = Math.min(listLen - 1, shop.cursor + 1);
          if (e.key === ' ' || e.key === 'Enter') {
            if (shop.cursor === sellable.length) {
              shop.screen = 'main'; shop.cursor = 0;
            } else {
              const it = sellable[shop.cursor] && sellable[shop.cursor].item;
              if (it) {
                stats.gold += Math.floor((it.price || 0) / 2);
                // If selling an equipped item, clear its slot
                if (stats.weapon    === it) stats.weapon    = null;
                if (stats.armor     === it) stats.armor     = null;
                if (stats.shield    === it) stats.shield    = null;
                if (stats.accessory === it) stats.accessory = null;
                stats.items.splice(stats.items.indexOf(it), 1);
                shop.cursor = Math.min(shop.cursor, groupItems().length);
              }
            }
          }
          if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') { shop.screen = 'main'; shop.cursor = 0; }
        }
      } else if (debugMenu.open) {
        // ── Debug menu navigation ─────────────────────────────────────────
        // Row order must match drawDebugMenu() (render-ui.js) and
        // DEBUG_MENU_ROW_COUNT (state.js): 0 No Enemies, 1 Poison,
        // 2 Muddied, 3 Slither, 4 Heal Full, 5 Day +1, 6 Warp to...,
        // 7 Validate Data, 8 Home on Defeat, 9 Legacy Regional Fallback,
        // 10 Play Sera/Liora Cutaway
        e.preventDefault();
        if (e.key === 'ArrowUp'   || e.key === 'w') debugMenu.cursor = Math.max(0, debugMenu.cursor - 1);
        if (e.key === 'ArrowDown' || e.key === 's') debugMenu.cursor = Math.min(DEBUG_MENU_ROW_COUNT - 1, debugMenu.cursor + 1);
        if (e.key === ' ' || e.key === 'Enter') {
          if (debugMenu.cursor === 0) {
            debugMode = !debugMode;
          } else if (debugMenu.cursor === 1) {
            if (hasStatusEffect('poison'))  removeStatusEffect('poison');
            else triggerPoison();
          } else if (debugMenu.cursor === 2) {
            if (hasStatusEffect('muddied')) removeStatusEffect('muddied');
            else triggerMuddied();
          } else if (debugMenu.cursor === 3) {
            if (hasStatusEffect('slither')) removeStatusEffect('slither');
            else triggerSlither();
          } else if (debugMenu.cursor === 4) {
            // Heal Full — stats only; does not touch quests/inventory/gold.
            stats.hp = stats.maxHp;
          } else if (debugMenu.cursor === 5) {
            // Advance Day +1 — same plain increment used elsewhere (e.g.
            // combat.js's defeat penalty); no other state is tied to it.
            day++;
          } else if (debugMenu.cursor === 6) {
            // Warp to... — hand off to the warp menu, populated from the logical
            // destination catalog (debug-warp.js): outdoor-first, deterministic
            // order. Each entry is a coherent logical destination, not a bare
            // map id.
            debugMenu.open       = false;
            warpMenu.open         = true;
            warpMenu.mode         = 'list';
            warpMenu.cursor       = 0;
            warpMenu.scrollOffset = 0;
            warpMenu.playerMode   = false;   // full debug catalog + coord picker
            warpMenu.destinations = getDebugWarpDestinations();
          } else if (debugMenu.cursor === 7) {
            // Validate Data — runs the content linter (validation.js) and
            // surfaces just the summary here; the full grouped report
            // (every error/warning message) always goes to the console,
            // matching how validateGameData() has always been used from
            // the browser console. Menu stays open, same as Heal Full/Day+1.
            const result = validateGameData();
            showWorldToast(
              (result.errors ? '✗' : '✓') + ' ' + result.errors + ' error' + (result.errors === 1 ? '' : 's') +
              ', ' + (result.warnings ? '⚠' : '✓') + ' ' + result.warnings + ' warning' + (result.warnings === 1 ? '' : 's') +
              ' — see console'
            );
          } else if (debugMenu.cursor === 8) {
            // Home on Defeat — losing a fight relocates the player to their
            // bed in the Calwick player house (default ON); off = the old
            // behavior of waking on the spot where they fell.
            defeatWakeAtHome = !defeatWakeAtHome;
          } else if (debugMenu.cursor === 9) {
            // Legacy Regional Fallback — DEBUG emergency/comparison switch. Continuous
            // regional presentation is the production default (render.js); ON forces
            // coherent legacy single-screen regional behaviour for the whole shared
            // choke point. Session-only, never saved; no effect on movement/collision/
            // transitions/content/canonical position/encounter ownership.
            forceLegacyRegionalView = !forceLegacyRegionalView;
          } else if (debugMenu.cursor === 10) {
            // Direct cutscene preview. This deliberately bypasses the warp
            // destination catalog, so neither the debug warp list nor the
            // player-facing Warp Stone exposes the guest room.
            debugPlaySeraLioraCutaway();
          }
        }
        if (e.key === 'Escape' || e.key === '`') { debugMenu.open = false; }
      } else if (warpMenu.open) {
        // ── Debug warp menu navigation ──────────────────────────────────────
        e.preventDefault();
        if (warpMenu.mode === 'list') {
          const last = warpMenu.destinations.length - 1;
          if (e.key === 'ArrowUp'   || e.key === 'w') warpMenu.cursor = Math.max(0, warpMenu.cursor - 1);
          if (e.key === 'ArrowDown' || e.key === 's') warpMenu.cursor = Math.min(last, warpMenu.cursor + 1);
          if (warpMenu.cursor < warpMenu.scrollOffset) warpMenu.scrollOffset = warpMenu.cursor;
          if (warpMenu.cursor >= warpMenu.scrollOffset + WARP_MENU_VISIBLE_ROWS) warpMenu.scrollOffset = warpMenu.cursor - WARP_MENU_VISIBLE_ROWS + 1;
          if (e.key === ' ' || e.key === 'Enter') {
            const dest = warpMenu.destinations[warpMenu.cursor];
            if (dest && !dest.disabled) {
              // Default coordinate: the destination's own known-walkable landing,
              // nudged to the nearest walkable tile on ITS map if needed.
              const targetMap = (typeof mapRefForId === 'function') ? mapRefForId(dest.mapId) : null;
              const centre = targetMap ? debugFindNearestWalkableTile(targetMap, dest.defaultCol, dest.defaultRow) : null;
              const dCol = centre ? centre.col : dest.defaultCol;
              const dRow = centre ? centre.row : dest.defaultRow;
              if (warpMenu.playerMode) {
                // Player Warp Stone: no tile-picker — warp straight to the landing.
                const result = debugWarpToDestination(dest.id, dCol, dRow);
                showWorldToast(result.success ? ('Warped to ' + dest.label + '.') : result.message);
                if (result.success) warpMenu.open = false;
              } else {
                warpMenu.targetDestId = dest.id;
                warpMenu.targetCol    = dCol;
                warpMenu.targetRow    = dRow;
                warpMenu.mode         = 'coord';
              }
            } else if (dest && dest.disabled) {
              showWorldToast('Disabled: ' + (dest.disabledReason || 'unsupported location'));
            }
          }
          if (e.key === 'Escape' || e.key === '`') { warpMenu.open = false; }
        } else {
          // 'coord' mode — clamp arrow movement using the DESTINATION's own map
          // dimensions, not global ROWS/COLS (interiors/dungeons can differ, and
          // conceptually a destination's map is its own coordinate space).
          const dest = (typeof debugDestinationById === 'function') ? debugDestinationById(warpMenu.targetDestId) : null;
          const targetMap = (dest && typeof mapRefForId === 'function') ? mapRefForId(dest.mapId) : null;
          const dRows = (targetMap && targetMap.length) ? targetMap.length : ROWS;
          const dCols = (targetMap && targetMap[0]) ? targetMap[0].length : COLS;
          if (e.key === 'ArrowUp'    || e.key === 'w') warpMenu.targetRow = Math.max(0, warpMenu.targetRow - 1);
          if (e.key === 'ArrowDown'  || e.key === 's') warpMenu.targetRow = Math.min(dRows - 1, warpMenu.targetRow + 1);
          if (e.key === 'ArrowLeft'  || e.key === 'a') warpMenu.targetCol = Math.max(0, warpMenu.targetCol - 1);
          if (e.key === 'ArrowRight' || e.key === 'd') warpMenu.targetCol = Math.min(dCols - 1, warpMenu.targetCol + 1);
          if (e.key === ' ' || e.key === 'Enter') {
            const result = debugWarpToDestination(warpMenu.targetDestId, warpMenu.targetCol, warpMenu.targetRow);
            showWorldToast(result.message);
            if (result.success) warpMenu.open = false; // close ONLY on success
          }
          if (e.key === 'Escape') { warpMenu.mode = 'list'; }
          if (e.key === '`') { warpMenu.open = false; }
        }
      } else if (accordPanel.open) {
        // ── Accord reading panel ──────────────────────────────────────────
        e.preventDefault();
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' ||
            e.key === ' ' || e.key === 'Enter') {
          if (accordPanel.page < accordPanel.pages.length - 1) {
            accordPanel.page++;
          } else {
            accordPanel.open = false;
          }
        }
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          if (accordPanel.page > 0) accordPanel.page--;
        }
        if (e.key === 'Escape') {
          accordPanel.open = false;
        }
      } else if (continentMap.open) {
        // ── Continent map panel ───────────────────────────────────────────
        if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
          e.preventDefault();
          continentMap.open = false;
        }
      } else {
        // ── Overworld input ───────────────────────────────────────────────
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleInteract(); }
        if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') { e.preventDefault(); toggleMenu(); }
        if (e.key === '`') { e.preventDefault(); toggleDebugMenu(); }
        // Debug map inspector — a read-only HUD overlay, not a modal, so it
        // doesn't need any of the guard conditions toggleMenu()/
        // toggleDebugMenu() have (see toggleDebugInspector(), state.js).
        if (e.key === 'i' || e.key === 'I') { e.preventDefault(); toggleDebugInspector(); }
      }
    }
  }
  keys[e.key] = true;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });
