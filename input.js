'use strict';

// input.js — keyboard input: the pressed-keys table and the keydown/keyup
// listeners that route input to whichever screen is currently active
// (combat, menu, choice box, shop, debug menu, overlay panels, overworld).

// ─── Input ────────────────────────────────────────────────────────────────────
const keys = Object.create(null);
window.addEventListener('keydown', e => {
  if (e.key.startsWith('Arrow')) e.preventDefault();
  if (!keys[e.key]) {  // fire-once for all action keys
    if (combat.active && combat.flashTimer === 0 && debugMode && e.key === '`') {
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
        // cursor 0..items.length-1 = items, items.length = Back
        const last = inventoryItems().length;
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
            if (menu.saveCursor === 0) saveGame(); else menu.screen = 'main';
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
          if (e.key === 'ArrowUp'   || e.key === 'w') menu.notebookOffset = Math.max(0, menu.notebookOffset - 1);
          if (e.key === 'ArrowDown' || e.key === 's') menu.notebookOffset++;
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
              if (it.curesPoison) {
                removeStatusEffect('poison');
                const idx = stats.items.findIndex(i => i.name === name);
                if (idx !== -1) stats.items.splice(idx, 1);
              } else if (it.curesCursed) {
                removeStatusEffect('cursed');
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
          if (e.key === 'n' || e.key === 'N') { e.preventDefault(); menu.screen = 'notebook'; menu.notebookOffset = 0; }
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
                stats.items.push({ name: it.name, type: it.type, bonus: it.bonus, heals: it.heals, price: it.price });
              }
            }
          }
          if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') { shop.screen = 'main'; shop.cursor = 0; }
        } else if (shop.screen === 'sell') {
          const sellable = inventoryItems();
          const listLen = sellable.length + 1; // +1 for Back
          if (e.key === 'ArrowUp'   || e.key === 'w') shop.cursor = Math.max(0, shop.cursor - 1);
          if (e.key === 'ArrowDown' || e.key === 's') shop.cursor = Math.min(listLen - 1, shop.cursor + 1);
          if (e.key === ' ' || e.key === 'Enter') {
            if (shop.cursor === sellable.length) {
              shop.screen = 'main'; shop.cursor = 0;
            } else {
              const it = sellable[shop.cursor];
              if (it) {
                stats.gold += Math.floor((it.price || 0) / 2);
                // If selling an equipped item, clear its slot
                if (stats.weapon    === it) stats.weapon    = null;
                if (stats.armor     === it) stats.armor     = null;
                if (stats.shield    === it) stats.shield    = null;
                if (stats.accessory === it) stats.accessory = null;
                stats.items.splice(stats.items.indexOf(it), 1);
                shop.cursor = Math.min(shop.cursor, inventoryItems().length);
              }
            }
          }
          if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') { shop.screen = 'main'; shop.cursor = 0; }
        }
      } else if (debugMenu.open) {
        // ── Debug menu navigation ─────────────────────────────────────────
        // Row order must match drawDebugMenu() (render-ui.js) and
        // DEBUG_MENU_ROW_COUNT (state.js): 0 No Enemies, 1 Poison,
        // 2 Muddied, 3 Slither, 4 Heal Full, 5 Day +1, 6 Warp to Map...,
        // 7 Validate Data, 8 Home on Defeat
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
            // Warp to Map... — hand off to the warp menu.
            debugMenu.open       = false;
            warpMenu.open         = true;
            warpMenu.mode         = 'list';
            warpMenu.cursor       = 0;
            warpMenu.scrollOffset = 0;
            warpMenu.mapIds       = Object.keys(MAP_REGISTRY);
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
          }
        }
        if (e.key === 'Escape' || e.key === '`') { debugMenu.open = false; }
      } else if (warpMenu.open) {
        // ── Debug warp menu navigation ──────────────────────────────────────
        e.preventDefault();
        if (warpMenu.mode === 'list') {
          const last = warpMenu.mapIds.length - 1;
          if (e.key === 'ArrowUp'   || e.key === 'w') warpMenu.cursor = Math.max(0, warpMenu.cursor - 1);
          if (e.key === 'ArrowDown' || e.key === 's') warpMenu.cursor = Math.min(last, warpMenu.cursor + 1);
          if (warpMenu.cursor < warpMenu.scrollOffset) warpMenu.scrollOffset = warpMenu.cursor;
          if (warpMenu.cursor >= warpMenu.scrollOffset + WARP_MENU_VISIBLE_ROWS) warpMenu.scrollOffset = warpMenu.cursor - WARP_MENU_VISIBLE_ROWS + 1;
          if (e.key === ' ' || e.key === 'Enter') {
            const mapId = warpMenu.mapIds[warpMenu.cursor];
            const meta  = (typeof MAP_METADATA !== 'undefined') ? MAP_METADATA[mapId] : undefined;
            const targetMap = meta ? meta.map : MAP_REGISTRY[mapId].map;
            // Sensible default coordinate: nearest walkable tile to the
            // map's centre (requirement: "a sensible default coordinate if
            // no coordinate is specified").
            const centre = debugFindNearestWalkableTile(targetMap, Math.floor(COLS / 2), Math.floor(ROWS / 2));
            warpMenu.targetMapId = mapId;
            warpMenu.targetCol   = centre ? centre.col : Math.floor(COLS / 2);
            warpMenu.targetRow   = centre ? centre.row : Math.floor(ROWS / 2);
            warpMenu.mode        = 'coord';
          }
          if (e.key === 'Escape' || e.key === '`') { warpMenu.open = false; }
        } else {
          // 'coord' mode
          if (e.key === 'ArrowUp'    || e.key === 'w') warpMenu.targetRow = Math.max(0, warpMenu.targetRow - 1);
          if (e.key === 'ArrowDown'  || e.key === 's') warpMenu.targetRow = Math.min(ROWS - 1, warpMenu.targetRow + 1);
          if (e.key === 'ArrowLeft'  || e.key === 'a') warpMenu.targetCol = Math.max(0, warpMenu.targetCol - 1);
          if (e.key === 'ArrowRight' || e.key === 'd') warpMenu.targetCol = Math.min(COLS - 1, warpMenu.targetCol + 1);
          if (e.key === ' ' || e.key === 'Enter') {
            const result = debugWarpToMap(warpMenu.targetMapId, warpMenu.targetCol, warpMenu.targetRow);
            showWorldToast(result.message);
            if (result.success) warpMenu.open = false;
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

