'use strict';
const assert = require('assert/strict');
const { createContext } = require('../harness');
const json = (g, expression) => JSON.parse(g.run('JSON.stringify(' + expression + ')'));
module.exports = {
  name: 'overworld ownership: bounded hot-path work, exact physical-owner semantics and automatic binding invalidation',
  run() {
    const g = createContext();
    // Independent reference grouping, computed once rather than inside each NPC lookup.
    const bindings = json(g, 'OUTDOOR_CONTENT_KEYS');
    const owners = new Map();
    for (const [id, key] of Object.entries(bindings)) {
      if (!owners.has(key)) owners.set(key, []);
      owners.get(key).push(id);
    }
    for (const npc of json(g, 'SIMPLE_NPCS.map(n=>({map:n.map,physicalMapId:n.physicalMapId}))')) {
      let expected = null;
      if (typeof npc.map === 'string') {
        if (npc.physicalMapId != null) {
          if (typeof npc.physicalMapId === 'string' && bindings[npc.physicalMapId] === npc.map) expected = npc.physicalMapId;
        } else {
          const ids = owners.get(npc.map) || [];
          if (ids.length === 1) expected = ids[0];
        }
      }
      assert.equal(g.run('physicalMapIdForNpc(' + JSON.stringify(npc) + ')'), expected);
    }
    for (const npc of [null, {}, {map:9}, {map:'toString'}, {map:'overworld'}, {map:'map2',physicalMapId:'MAP3'}, {map:'map2',physicalMapId:123}, {map:'map2',physicalMapId:'HOUSE_INTERIOR_MAP'}]) {
      assert.equal(g.run('physicalMapIdForNpc(' + JSON.stringify(npc) + ')'), null, 'invalid/ambiguous owner fails closed');
    }
    assert.equal(g.run("physicalMapIdForNpc({map:'overworld',physicalMapId:'MAP5'})"), 'MAP5');

    // Editing the authoritative object refreshes both directions without a manual
    // cache clear, including changes to previously cached misses/unique keys.
    g.run("unambiguousOutdoorMapIdForContentKey('__later_key')");
    g.run("OUTDOOR_CONTENT_KEYS.MAP2='__later_key'");
    assert.equal(g.run("unambiguousOutdoorMapIdForContentKey('__later_key')"), 'MAP2');
    assert.equal(g.run("physicalMapIdForNpc({map:'map2'})"), null);
    g.run("OUTDOOR_CONTENT_KEYS.MAP2='map2';OUTDOOR_CONTENT_KEYS.MAP3='map2'");
    assert.equal(g.run("physicalMapIdForNpc({map:'map2'})"), null, 'new alias invalidates unique owner');
    assert.equal(g.run("outdoorContentKeyInfo('MAP2').unambiguous"), false);
    assert.equal(g.run("physicalMapIdForNpc({map:'map2',physicalMapId:'MAP2'})"), 'MAP2');
    g.run('delete OUTDOOR_CONTENT_KEYS.MAP3');
    assert.equal(g.run("physicalMapIdForNpc({map:'map2'})"), 'MAP2', 'deleting alias restores uniqueness');
    g.run("Object.defineProperty(OUTDOOR_CONTENT_KEYS,'MAP3',{value:'map3',writable:true,enumerable:true,configurable:true})");
    assert.equal(g.run("physicalMapIdForNpc({map:'map3'})"), 'MAP3');
    g.run("Object.defineProperty(OUTDOOR_CONTENT_KEYS,'MAP3',{enumerable:false})");
    assert.equal(g.run("physicalMapIdForNpc({map:'map3'})"), null, 'enumerability follows diagnostic ownership contract');
    g.run("Object.defineProperty(OUTDOOR_CONTENT_KEYS,'MAP3',{enumerable:true})");
    assert.equal(g.run("physicalMapIdForNpc({map:'map3'})"), 'MAP3');
    assert.deepEqual(json(g, 'OUTDOOR_CONTENT_KEYS'), bindings, 'all authored bindings restored');
    g.run("var detached=outdoorContentKeyEntries().find(e=>e.mapId==='MAP2');detached.key='poison';detached.unambiguous=false");
    assert.equal(g.run("physicalMapIdForNpc({map:'map2'})"), 'MAP2', 'diagnostic results cannot poison the reverse lookup');

    // Add a large unrelated catalogue tail with read counters. After one cold
    // build, normal lookups/update/render must neither read it nor enumerate the
    // bindings. This catches the actual regression without wall-clock thresholds.
    g.run(`
      storyCheckpointLab.apply('mq5_assignment_ready');
      transitionToLocation({mapId:'MAP3',x:352,y:240,facing:'right'});
      dialogue.open=false;debugMode=true;
      var tailReads=0;
      for(let i=0;i<2048;i++)Object.defineProperty(OUTDOOR_CONTENT_KEYS,'__perf_map_'+i,{
        get(){tailReads++;return '__perf_key_'+i;},enumerable:true,configurable:true
      });
      unambiguousOutdoorMapIdForContentKey('map3');
      tailReads=0;
      var originalKeys=Object.keys,originalEntries=outdoorContentKeyEntries,enumerations=0;
      Object.keys=function(value){if(value===OUTDOOR_CONTENT_KEYS)enumerations++;return originalKeys(value);};
      outdoorContentKeyEntries=function(){throw Error('Whole-world ownership enumeration entered hot path');};
      var bindingRevision=_OUTDOOR_CONTENT_KEYS_REVISION;
      var beforeLookup=JSON.stringify({flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),party:persistentParty.serialize(),position:regionalWorldPosition(),stats,day});
      try {
        for(let i=0;i<2000;i++){
          if(physicalMapIdForNpc({map:'map3'})!=='MAP3')throw Error('Lost owner');
          if(physicalMapIdForNpc({map:'overworld'})!==null)throw Error('Ambiguous owner leaked');
          if(physicalMapIdForNpc({map:'unknown'})!==null)throw Error('Unknown owner leaked');
        }
        var afterLookup=JSON.stringify({flags:QUEST_FLAG_BINDINGS.map(b=>[b.key,b.get()]),party:persistentParty.serialize(),position:regionalWorldPosition(),stats,day});
        keys.ArrowRight=true;
        for(let i=0;i<12;i++){update();render();}
        var afterFrameRevision=_OUTDOOR_CONTENT_KEYS_REVISION;
      } finally {
        delete keys.ArrowRight;Object.keys=originalKeys;outdoorContentKeyEntries=originalEntries;
        for(let i=0;i<2048;i++)delete OUTDOOR_CONTENT_KEYS['__perf_map_'+i];
      }
    `);
    assert.equal(g.run('tailReads'), 0, 'frame work ignores unrelated world-size growth');
    assert.equal(g.run('enumerations'), 0, 'warm path never enumerates bindings');
    assert.equal(g.run('bindingRevision===afterFrameRevision'), true, 'frames do not invalidate binding metadata');
    assert.equal(g.run('beforeLookup===afterLookup'), true, 'lookups leave gameplay state untouched');
    assert.equal(g.run('player.x'), 376, 'held grass movement remains two pixels per update');
    assert.equal(g.run('SAVE_VERSION'), 5);
    assert.deepEqual(json(g, 'regionalInvariantErrors()'), []);
    assert.equal(g.run("physicalMapIdForNpc({map:'map3'})"), 'MAP3', 'tail removal invalidates cleanly');
  },
};
