'use strict';

// Authored opening builds, separate from the canonical roster/progression and
// from the reusable story adapter. Equipment names/numbers remain balance data.
const STORY_CHARACTER_DEFINITIONS=Object.freeze({
  sera:Object.freeze({id:'sera',name:'Sera',rareBorn:true,affinity:'voidborn',knownTechniques:Object.freeze(['null','eclipse']),spriteId:'sera'}),
  liora:Object.freeze({id:'liora',name:'Liora',rareBorn:true,affinity:'prismborn',knownTechniques:Object.freeze(['rainbow','eclipse']),spriteId:'liora'}),
});
const SERA_LIORA_OPENING_PROFILES=copyFormationData([
  {characterId:'sera',name:STORY_CHARACTER_DEFINITIONS.sera.name,hp:220,maxHp:220,
    atk:22,def:12,spd:16,statuses:[],slitherSpeed:1,
    equipment:{weapon:'Fine Sabre',armor:'Reinforced Travel Coat',shield:null,accessory:null}},
  {characterId:'liora',name:STORY_CHARACTER_DEFINITIONS.liora.name,hp:290,maxHp:290,
    atk:20,def:14,spd:14,statuses:[],slitherSpeed:1,
    equipment:{weapon:'Balanced Staff',armor:'Woven Guard Coat',shield:null,accessory:null}},
]);
// This data is not granted on script load; no playable caller is connected.
const SERA_LIORA_OPENING_INVENTORY=Object.freeze(['Elixir','Elixir','Reed Remedy']);

// Opt-in authored capabilities; the private story bridge validates their source.
const SERA_LIORA_OPENING_RESONANCE=copyFormationData([
  {slot:0,characterId:'sera',source:'story'},
  {slot:1,characterId:'liora',source:'story'},
]);
