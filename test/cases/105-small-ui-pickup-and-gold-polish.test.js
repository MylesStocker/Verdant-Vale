'use strict';
// Three bounded polish fixes: debug-menu fit, the Verdant Vale potion's
// examine-only sparkle, and Aldric's defeat/gold-storage lampshade.

const assert = require('assert/strict');
const { createContext } = require('../harness');

module.exports = {
  name: 'small polish: debug-menu fit, grass-potion sparkle, Aldric monster economy guidance',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');
    const J = (expr) => JSON.parse(g.run(expr));

    // 1. The widest debug row and its separate ON pill fit inside the enlarged
    // panel under the menu's real 12px Courier-New layout.
    assert.equal(g.run('DEBUG_MENU_PANEL_WIDTH'), 300);
    const menuText = J(`(function(){
      var out=[],old=ctx.fillText;ctx.fillText=function(s,x,y){out.push({s:String(s),x:x,y:y,font:ctx.font});};
      debugMenu.open=true;debugMenu.cursor=9;forceLegacyRegionalView=true;drawDebugMenu();
      ctx.fillText=old;debugMenu.open=false;forceLegacyRegionalView=false;return JSON.stringify(out);
    })()`);
    const fallback = menuText.find((t) => t.s.includes('Legacy Regional Fallback'));
    const pill = menuText.find((t) => t.s === 'ON' && t.y === fallback.y);
    assert.ok(fallback && pill, 'fallback label and toggle pill both render');
    const courier12 = 12 * 0.6;
    const panelRight = (512 + 300) / 2;
    assert.ok(fallback.x + fallback.s.length * courier12 < pill.x, 'label does not overlap ON/OFF pill');
    assert.ok(pill.x + pill.s.length * courier12 < panelRight - 4, 'pill remains inside panel frame');

    // 2. The one Verdant Vale potion uses the shared examine-only pickup path:
    // sparkle rendering, no proximity auto-collection, one interaction grant,
    // and exactly the requested grounded and acquisition messages.
    const potion = J('JSON.stringify(WORLD_ITEMS[0])');
    assert.deepEqual({id:potion.id,name:potion.name,examine:potion.examine,pages:potion.examinePages}, {
      id:'pickup_world_potion', name:'Potion', examine:true,
      pages:[['Someone must have dropped a potion in the grass!'],['Got Potion.']],
    });
    const drawStyles = J(`(function(){
      var p=WORLD_ITEMS[0],out=[],old=ctx.fillRect;p.picked=false;tick=8;
      ctx.fillRect=function(){out.push(ctx.fillStyle);};drawMapWorldItems([p]);ctx.fillRect=old;
      return JSON.stringify(out);
    })()`);
    assert.ok(drawStyles.some((s) => /^rgba\(255,248,200,/.test(s)), 'sparkle body rendered');
    assert.ok(drawStyles.includes('#ffffff'), 'sparkle centre rendered');
    assert.equal(drawStyles.includes('#c02848'), false, 'floating potion flask is not rendered');
    g.run("WORLD_ITEMS[0].picked=false;stats.items=[];collectWorldItemNear(WORLD_ITEMS[0],WORLD_ITEMS[0].x,WORLD_ITEMS[0].y,{crossSeam:false});");
    assert.equal(g.run('WORLD_ITEMS[0].picked'), false, 'walking over sparkle does not auto-collect it');
    assert.equal(g.run('stats.items.length'), 0);
    g.run("resetLocationState();placeAtLocation('MAP',WORLD_ITEMS[0].x,WORLD_ITEMS[0].y);dialogue.open=false;menu.open=false;choice.open=false;shop.open=false;handleInteract();");
    assert.equal(g.run('WORLD_ITEMS[0].picked'), true); assert.equal(g.run('stats.items.length'),1);
    assert.equal(g.run("stats.items[0].name"),'Potion');
    assert.deepEqual(J('JSON.stringify(dialogue.pages)'),[
      ['Someone must have dropped a potion in the grass!'],
      ['Got Potion.'],
    ]);

    // 3. Aldric explicitly links monster loot to defeated travellers, total
    // carried-gold loss, home-chest storage, and stronger monsters' larger purses.
    const aldric = J("JSON.stringify(SIMPLE_NPCS.find(function(n){return n.id==='aldric';}).dialogue.slice(0,3))");
    const text = aldric.flat().join(' ');
    assert.match(text,/take it from people they defeat/i);
    assert.match(text,/lose a fight.*whatever coin you were carrying goes with them/i);
    assert.match(text,/chest at home/i);
    assert.match(text,/stronger the monster.*more gold/i);
    assert.match(text,/what is this monster economy, and why does it exist\?/i);
    assert.match(text,/filed four reports.*none has been acknowledged/i);

    const validation=J('JSON.stringify(validateGameData())');
    assert.equal(validation.errors,0); assert.equal(validation.warnings,4); assert.equal(g.run('SAVE_VERSION'),4);
  },
};
