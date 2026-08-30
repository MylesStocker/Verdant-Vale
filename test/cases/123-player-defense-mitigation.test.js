'use strict';
// Bounded player-incoming mitigation: ordinary equipment is capped at 80% of
// the live enemy ATK, while Cat Armor opts into the legacy uncapped DEF curve
// through validated item metadata. Outgoing damage and combat ordering stay on
// the existing shared roll/turn paths.

const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { createContext } = require('../harness');

const ROOT = path.join(__dirname, '..', '..');

function damageRoll(g, atk, mitigation, varianceRoll, critRoll) {
  return JSON.parse(g.run(`(function(){
    var q=[${varianceRoll},${critRoll}], i=0, old=Math.random;
    Math.random=function(){return q[i++];};
    try{return JSON.stringify(rollAttackDamage(${atk},${mitigation}));}
    finally{Math.random=old;}
  })()`));
}

function incomingDistribution(g, atk, armorExpr) {
  return JSON.parse(g.run(`(function(){
    stats.def=2; stats.shield=null; stats.armor=${armorExpr}; statusEffects=[];
    var variances=[0,0.25,0.5,0.75,0.999999];
    var out=[];
    variances.forEach(function(v){
      [0.99,0].forEach(function(c){
        var q=[v,c],i=0,old=Math.random;Math.random=function(){return q[i++];};
        try{out.push(rollAttackDamage(${atk},effectivePlayerIncomingMitigation(${atk})).dmg);}
        finally{Math.random=old;}
      });
    });
    return JSON.stringify(out);
  })()`));
}

module.exports = {
  name: 'player defense mitigation: 80%-ATK cap with declarative Cat Armor bypass',
  run() {
    const g = createContext();
    g.press('Enter'); g.press('Enter');

    // 1. Below the cap, mitigation and the complete controlled damage
    // distribution are byte-for-byte identical to the legacy raw-DEF input.
    g.run("stats.def=2;stats.armor=createItem('Leather Armor');stats.shield=null;statusEffects=[];");
    assert.equal(g.run('effectiveDef()'), 5);
    assert.equal(g.run('effectivePlayerIncomingMitigation(10)'), 5, 'DEF 5 is below the ATK-10 cap of 8');
    for (const variance of [0, 0.25, 0.5, 0.75, 0.999999]) {
      for (const crit of [0.99, 0]) {
        assert.deepEqual(
          damageRoll(g, 10, g.run('effectivePlayerIncomingMitigation(10)'), variance, crit),
          damageRoll(g, 10, g.run('effectiveDef()'), variance, crit),
          `below-cap roll is unchanged (variance=${variance}, critRoll=${crit})`,
        );
      }
    }

    // 2–3. Above the cap, the live numeric enemy ATK alone sets mitigation.
    // Names, maps, pools, and display values are not inputs to this helper.
    g.run("stats.def=20;stats.armor=null;stats.shield=null;statusEffects=[];");
    assert.equal(g.run('playerIncomingMitigation(10,20,false)'), 8, 'pure helper applies the cap');
    assert.equal(g.run('playerIncomingMitigation(10,20,true)'), 20, 'pure helper honors an explicit bypass');
    assert.equal(g.run('effectivePlayerIncomingMitigation(10)'), 8);
    assert.equal(g.run('effectivePlayerIncomingMitigation(13)'), 10);
    assert.equal(g.run('effectivePlayerIncomingMitigation(52)'), 20);

    // 4. Existing roll ordering is retained: variance -> DEF subtraction ->
    // critical multiplier -> rounding -> minimum 1. A landed hit applies its
    // existing on-hit status; an evade (including Bullet Time) blocks both.
    assert.deepEqual(damageRoll(g, 10, 8, 0, 0.99), { dmg: 1, crit: false });
    assert.deepEqual(damageRoll(g, 10, 8, 0.999999, 0), { dmg: 6, crit: true });
    const landed = JSON.parse(g.run(`(function(){
      stats.hp=30;stats.maxHp=30;stats.def=20;stats.armor=null;stats.shield=null;stats.spd=7;statusEffects=[];
      combat.evadeTurns=0;combat.enemy={id:'enemy_fen_witch',name:'Anything',atk:10,def:0,spd:7};combat.messageQueue=[];
      var q=[0.5,0.99,0.99,0],i=0,old=Math.random;Math.random=function(){return q[i++];};
      try{var hit=enemyTurnResponse(function(d){return 'hit '+d;});hit.apply();return JSON.stringify({hp:stats.hp,poison:hasStatusEffect('poison'),text:hit.text});}
      finally{Math.random=old;}
    })()`));
    assert.deepEqual(landed, { hp: 28, poison: true, text: 'hit 2' }, 'landed capped hit deals damage before applying the existing status hook');
    const dodged = JSON.parse(g.run(`(function(){
      stats.hp=30;statusEffects=[];combat.evadeTurns=3;combat.messageQueue=[];
      var q=[0.5,0.99,0.5],i=0,old=Math.random;Math.random=function(){return q[i++];};
      try{var hit=enemyTurnResponse(function(d){return 'hit '+d;});hit.apply();return JSON.stringify({hp:stats.hp,poison:hasStatusEffect('poison'),text:hit.text,turns:combat.evadeTurns});}
      finally{Math.random=old;}
    })()`));
    assert.equal(dodged.hp, 30);
    assert.equal(dodged.poison, false);
    assert.match(dodged.text, /evades!/);

    // 5. Representative player-to-enemy rolls retain the committed formula;
    // the incoming helper is not consulted by these calls.
    for (const [weapon, baseAtk, enemyDef, expected] of [
      ['Iron Sword', 8, 0, 12],
      ['Steel Sword', 12, 8, 11],
      ['Dragon Blade', 18, 12, 18],
    ]) {
      g.run(`stats.atk=${baseAtk};stats.weapon=createItem('${weapon}');`);
      const atk = g.run('effectiveAtk()');
      const roll = damageRoll(g, atk, enemyDef, 0.5, 0.99);
      assert.equal(roll.dmg, expected, `${weapon} outgoing mid-roll remains ATK - enemy DEF`);
    }

    // 6. Starter gear remains unchanged against an early enemy whose ATK cap
    // is above its DEF (Stone Crawler: ATK 13, cap 10, starter DEF 5).
    g.run("stats.def=2;stats.armor=createItem('Leather Armor');stats.shield=null;statusEffects=[];");
    assert.equal(g.run("ENEMY_TEMPLATE_REGISTRY['enemy_stone_crawler'].atk"), 13);
    assert.equal(g.run('effectivePlayerIncomingMitigation(13)'), 5);

    // 7. Normal high second-tier defenses no longer force these representative
    // enemies to universal 1-damage hits: the exhaustive controlled set has at
    // least one floor hit and at least one hit above the floor.
    for (const id of ['enemy_basin_gull', 'enemy_silt_hag_vault', 'enemy_crypt_fiend']) {
      const atk = g.run(`ENEMY_TEMPLATE_REGISTRY['${id}'].atk`);
      const dist = incomingDistribution(g, atk, "Object.assign(createItem('Shadow Cloak'),{bonus:20})");
      assert.ok(dist.includes(1), `${id} retains the minimum-damage floor at low rolls`);
      assert.ok(dist.some((d) => d > 1), `${id} is not a universal 1-damage attacker after the cap`);
    }

    // 8–11. Cat Armor is the sole declarative bypass. Its controlled damage
    // distribution exactly equals legacy raw-DEF behavior; ordinary synthetic
    // +99 armor is capped. Falsifying/removing the capability demonstrably
    // breaks the secret behavior (Takomo rises above 1 on the high crit roll).
    const bypassUsers = JSON.parse(g.run("JSON.stringify(Object.values(ITEM_REGISTRY).filter(function(i){return i.defenseCapBypass===true;}).map(function(i){return i.name;}))"));
    assert.deepEqual(bypassUsers, ['Cat Armor']);
    g.run("stats.def=2;stats.armor=createItem('Cat Armor');stats.shield=null;statusEffects=[];");
    assert.equal(g.run('effectiveDef()'), 101);
    assert.equal(g.run('effectivePlayerIncomingMitigation(52)'), 101);
    const catDist = incomingDistribution(g, 52, "createItem('Cat Armor')");
    assert.deepEqual(catDist, Array(10).fill(1), 'Cat Armor keeps Takomo at the exact legacy 1-damage distribution');
    assert.deepEqual(incomingDistribution(g, 14, "createItem('Cat Armor')"), Array(10).fill(1), 'Cat Armor still floors ordinary enemy attacks');
    const synthetic = incomingDistribution(g, 52, "{name:'Synthetic +99',type:'armor',bonus:99,price:0}");
    assert.ok(synthetic.some((d) => d > 1), 'synthetic +99 ordinary armor is capped');
    const falsified = incomingDistribution(g, 52, "Object.assign(createItem('Cat Armor'),{defenseCapBypass:false})");
    assert.ok(falsified.some((d) => d > 1), 'falsifying the capability removes Cat Armor secret behavior');

    // 12. The item validator rejects malformed non-boolean capability metadata
    // and capability use on a non-armor, then returns clean after restoration.
    g.run("ITEM_REGISTRY['Cat Armor'].defenseCapBypass='yes';");
    let validation = JSON.parse(g.run('JSON.stringify(validateGameData())'));
    assert.ok(validation.errorList.some((e) => /defenseCapBypass must be boolean/.test(e.message)));
    g.run("ITEM_REGISTRY['Cat Armor'].defenseCapBypass=true;ITEM_REGISTRY.Potion.defenseCapBypass=true;");
    validation = JSON.parse(g.run('JSON.stringify(validateGameData())'));
    assert.ok(validation.errorList.some((e) => /only valid on armor/.test(e.message)));
    g.run('delete ITEM_REGISTRY.Potion.defenseCapBypass;');
    validation = JSON.parse(g.run('JSON.stringify(validateGameData())'));
    assert.equal(validation.errors, 0, 'restored authored metadata validates cleanly');

    // 13. Equip/unequip and save/load need no new persistent state. The armor
    // clone carries the registry capability, and load rehydrates it by name.
    g.run("stats.items=[createItem('Cat Armor'),createItem('Leather Armor')];stats.armor=null;stats.shield=null;stats.def=2;equipItem(stats.items[0]);");
    assert.equal(g.run('effectivePlayerIncomingMitigation(52)'), 101);
    g.run("equipItem(stats.items.find(function(i){return i.name==='Leather Armor';}));");
    assert.equal(g.run('effectivePlayerIncomingMitigation(52)'), 5, 'unequipping Cat Armor restores ordinary capped calculation');
    g.run("equipItem(stats.items.find(function(i){return i.name==='Cat Armor';}));");
    assert.equal(g.run('saveGame()'), true);
    const saved = JSON.parse(g.run("localStorage.getItem('verdantVale_save')"));
    assert.equal(saved.version, 4);
    assert.equal(saved.stats.armor.name, 'Cat Armor');
    assert.equal(saved.stats.armor.defenseCapBypass, true);
    assert.equal(Object.prototype.hasOwnProperty.call(saved, 'defenseCapBypass'), false, 'no separate save-state field was added');
    g.run("stats.armor={name:'Cat Armor',type:'armor',bonus:99,price:0,defenseCapBypass:false};");
    assert.equal(g.run('loadGame()'), true);
    assert.equal(g.run('stats.armor.defenseCapBypass'), true, 'load rehydrates canonical capability metadata');
    assert.equal(g.run('effectivePlayerIncomingMitigation(52)'), 101);

    // 14–15. Authored secret content and the v4 save contract remain exact.
    assert.deepEqual(JSON.parse(g.run("JSON.stringify(TAKOMO_TEMPLATE)")), {
      id: 'enemy_takomo', name: 'Takomo', hp: 280, maxHp: 280,
      atk: 52, def: 12, spd: 4, xp: 420, goldMin: 140, goldMax: 260,
    });
    assert.deepEqual(JSON.parse(g.run("JSON.stringify({x:TAKOMO.x/TILE,y:TAKOMO.y/TILE,gate:TAKOMO_GATE,exit:TAKOMO_EXIT,map:mapIdForRef(TAKOMO_MAP)})")),
      { x: 8.5, y: 7.5, gate: 75, exit: 76, map: 'TAKOMO_MAP' });
    assert.deepEqual(JSON.parse(g.run("JSON.stringify({bonus:CAT_ARMOR_CHEST.item.bonus,price:CAT_ARMOR_CHEST.item.price,x:CAT_ARMOR_CHEST.x/TILE,y:CAT_ARMOR_CHEST.y/TILE,id:CAT_ARMOR_CHEST.id})")),
      { bonus: 99, price: 0, x: 2.5, y: 4.5, id: 'chest_cat_armor' });
    assert.equal(g.run('SAVE_VERSION'), 4);

    // Static choke-point guard: every live enemy-ATK damage roll uses the one
    // mitigation helper; the formula path contains no Cat Armor/Takomo name case.
    const combatSource = fs.readFileSync(path.join(ROOT, 'combat.js'), 'utf8');
    assert.equal((combatSource.match(/rollAttackDamage\(combat\.enemy\.atk, effectivePlayerIncomingMitigation\(combat\.enemy\.atk\)\)/g) || []).length, 5);
    assert.doesNotMatch(combatSource, /rollAttackDamage\(combat\.enemy\.atk, effectiveDef\(\)\)/);
    const helperBody = combatSource.slice(combatSource.indexOf('function playerIncomingMitigation'), combatSource.indexOf('// Accessories contribute'));
    assert.doesNotMatch(helperBody, /Cat Armor|Takomo|enemy_|activeMap|\.name/);
  },
};
