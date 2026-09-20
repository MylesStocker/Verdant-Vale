'use strict';

const assert = require('assert/strict');
const fast = require('../balance-report');
const defense = require('../player-defense-balance-report');
const { simulatorScope, scopeLabel } = require('../simulator-scope');
const { createCombatTrace } = require('../combat-trace');

function capture(run) {
  const old = console.log;
  const lines = [];
  try { console.log = (...parts) => lines.push(parts.join(' ')); run(); }
  finally { console.log = old; }
  return lines;
}

module.exports = {
  name: 'simulator authority: approximation metadata, unsupported capabilities, core math checks and Thornback discrepancy',
  run() {
    const t = createCombatTrace();
    const enemies = JSON.parse(t.g.run('JSON.stringify(ENEMY_TEMPLATE_REGISTRY)'));
    for (const model of ['fast','defense']) {
      for (const enemy of Object.values(enemies)) {
        assert.equal(simulatorScope(model,[enemy]).classification, 'approximate');
      }
      const thornback = simulatorScope(model,[enemies.enemy_thornback]);
      assert.ok(thornback.omitted.includes('enemy_thornback.meleeArmor'));
      assert.ok(thornback.omitted.includes('enemy_thornback.counterChance'));
      assert.match(scopeLabel(thornback), /APPROXIMATE.*meleeArmor.*counterChance/);
      // Unknown future fields are never silently classified as supported.
      const future = {...enemies.enemy_marsh_wisp_early,unknownFutureMechanic:false};
      assert.ok(simulatorScope(model,[future]).omitted.some(v => /unknownFutureMechanic/.test(v)));
      assert.ok(simulatorScope(model,[enemies.enemy_rotwood_troll]).omitted.some(v => /regenPerTurn/.test(v)));
      assert.ok(simulatorScope(model,[enemies.enemy_basin_gull]).omitted.some(v => /stealAndFlee/.test(v)));
      assert.ok(simulatorScope(model,[enemies.enemy_polwick]).omitted.some(v => /fire/.test(v)));
      assert.ok(simulatorScope(model,[enemies.enemy_pale_sentry]).omitted.some(v => /persistent/.test(v)));
    }
    assert.throws(() => simulatorScope('unknown', []), /Unknown simulator/);

    // Same primitive arithmetic is useful; it does not imply whole-engine
    // equivalence. Exercise production itself at variance/crit/cap boundaries.
    for (const [atk,def] of [[10,3],[10,8],[52,101],[20,92]]) {
      for (const tape of [[0,0.99],[0.5,0.09],[0.999,0.1]]) {
        let actual;
        t.step('damage primitive', tape, g => {actual=g.run(`rollAttackDamage(${atk},${def}).dmg`);});
        for (const roll of [fast.rolledDamage,defense.damageRoll]) {
          let i=0;
          assert.equal(roll(atk,def,() => tape[i++]), actual);
          assert.equal(i,2);
        }
      }
    }
    for (const [own,other] of [[0,0],[10,5],[1,999],[999,1]]) {
      const actual=t.g.run(`speedWinChance(${own},${other})`);
      assert.equal(fast.speedWinChance(own,other),actual);
      assert.equal(defense.speedWinChance(own,other),actual);
    }
    for (const bypass of [false,true]) {
      const p={def:101,defenseCapBypass:bypass};
      const actual=t.g.run(`playerIncomingMitigation(52,101,${bypass})`);
      assert.equal(fast.incomingMitigation(p,{},52),actual);
      assert.equal(defense.incomingDef(p,52,true),actual);
      assert.equal(defense.incomingDef(p,52,false),101,'historical column deliberately uses uncapped DEF');
    }

    // Independent reproduction of Prompt 1's finding. Production does eighteen
    // real Attack/message exchanges. The approximation must retain its scope
    // even though it still reports a one-turn win with the same fixed RNG.
    const battle=createCombatTrace();
    battle.step('fixture', [], `dialogue.open=false;stats.hp=1000;stats.maxHp=1000;
      stats.atk=20;stats.def=0;stats.spd=10;stats.level=MAX_LEVEL;
      stats.weapon=null;stats.armor=null;stats.shield=null;stats.accessory=null;
      combat.active=true;combat.phase='choose';combat.enemy={...ENEMY_TEMPLATE_REGISTRY.enemy_thornback};`);
    for(let round=1;round<=18;round++) {
      battle.press('Attack '+round, Array(round===18?8:11).fill(0.5));
      battle.drainMessages();
    }
    assert.equal(battle.g.run('combat.phase'),'victory');
    assert.equal(battle.g.run('stats.hp'),592);
    assert.equal(battle.rng.length,195);
    const approximate=fast.simulateFight({atk:20,def:0,spd:10,maxHp:1000},enemies.enemy_thornback,()=>0.5);
    assert.equal(approximate.turns,1);
    assert.equal(approximate.hpFracRemaining,1);
    assert.equal(approximate.scope.classification,'approximate');
    assert.ok(approximate.scope.omitted.some(v=>/meleeArmor/.test(v)));

    const hostRandom=Math.random;
    const smoke=capture(()=>fast.selfCheck()).join('\n');
    assert.match(smoke,/3 fixed-input runtime smoke checks/);
    assert.match(smoke,/NOT simulator-wide/);
    assert.equal(Math.random,hostRandom,'self-check does not patch shared host RNG');
    const lines=capture(()=>fast.runReport());
    const thornbackRows=lines.filter(l=>/^Thornback\s/.test(l));
    assert.ok(thornbackRows.length>0);
    for(const line of thornbackRows) assert.match(line,/APPROXIMATE.*meleeArmor.*counterChance/);
    for(const line of lines.filter(l=>/\d+\.\d+%/.test(l))) assert.match(line,/APPROXIMATE/,'every combat estimate row is classified');

    const historical=defense.runScenario(defense.SCENARIOS[0],false,1000);
    const current=defense.runScenario(defense.SCENARIOS[0],true,1000);
    assert.equal(historical.scope.model,'historical defense comparison');
    assert.equal(current.scope.classification,'approximate');
    assert.throws(()=>defense.runScenario({enemies:['missing']},true,1000),/Unknown defense scenario enemy/);
    const defenseLines=capture(()=>defense.runReport());
    assert.ok(defenseLines.some(l=>/historical uncapped/.test(l)));
    assert.ok(defenseLines.some(l=>/current cap model/.test(l)));
    for(const line of defenseLines.filter(l=>/\d+\.\d+%/.test(l))) assert.match(line,/APPROXIMATE/);
  },
};
