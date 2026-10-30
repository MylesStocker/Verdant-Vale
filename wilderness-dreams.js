'use strict';

// Five optional waking visions. Coordinates are local TILE indices, resolved
// only from canonical regional position after an actual walking tile crossing.
// No inspect prompt, reward, quest stage, terrain mutation or neighbour dispatch.
const WILDERNESS_DREAMS = Object.freeze([
  {
    id:'shingle', mapId:'VALMERE_EXPANSE_C14RN3_MAP', col:10, row:9,
    flag:'wilderness_dream_shingle_seen', title:'The weight of water',
    pages:[
      ['A stone turns under your boot. The sound of the lake stops before the stone does.'],
      ['There is no shore. Only white, and a wet stone resting in your palm. It is warm.'],
      ['You put it down. Somewhere very far below you, a door closes.'],
      ['You pick it up again. Someone on the other side begins to knock.'],
      ['You are still holding nothing when the water starts making noise again.'],
    ],
    aftermath:'A wave breaks over the stones. Esla puts a hand against your shoulder.',
    esla:'Lély? Are you all right? You stopped in the middle of a step. Come back from the water a little.',
  },
  {
    id:'fen', mapId:'GREAT_FEN_C3RN3_MAP', col:8, row:5,
    flag:'wilderness_dream_fen_seen', title:'The missing footstep',
    pages:[
      ['Something walks through the reeds beside you. It stops when you stop.'],
      ['The reeds are gone. The ground is white. You can still hear them brushing against a coat.'],
      ['You take three steps. Beside you, four.'],
      ['You wait for the extra footstep to go away. Instead, you remember taking it.'],
      ['The smell of peat returns. You cannot remember which way you were looking.'],
    ],
    aftermath:'Esla waits on the firmer ground, watching your face.',
    esla:'Are you all right, Lély? You were listening to something. We can stop here if you need a moment.',
  },
  {
    id:'river', mapId:'MAINLAND_C25R2_MAP', col:5, row:8,
    flag:'wilderness_dream_river_seen', title:'The other bank',
    pages:[
      ['A river crosses a room you almost recognise. The walls are white. There is no ceiling.'],
      ['On the other bank, an open cabinet stands knee-deep in the current. Its drawers are full of dry paper.'],
      ['You can read the writing from here. Every page is an account of your crossing.'],
      ['You have not crossed. You turn a page anyway.'],
      ['Mud pulls at your boot. You are standing on the same bank as before.'],
    ],
    aftermath:'Esla crouches beside you, then stands when you look at her.',
    esla:'Lély, are you all right? You went very pale. Tell me if it happens again; you do not have to walk it off.',
  },
  {
    id:'woods', mapId:'MAINLAND_C6R11_MAP', col:5, row:9,
    flag:'wilderness_dream_woods_seen', title:'A light between the trees',
    pages:[
      ['Between the trunks, a square of yellow light. You know the window. You do not know the house.'],
      ['You reach it. The trees have become white. The window is the only thing with an edge.'],
      ['Inside, someone is setting a table. They pause with a plate in each hand.'],
      ['You wait for them to turn. They wait for you to leave. Neither of you moves. The plates grow heavier.'],
      ['A branch taps against another branch. There is no light between them now.'],
    ],
    aftermath:'Esla has stopped a few paces ahead. She comes back rather than calling across the trees.',
    esla:'Are you all right? You looked as though you recognised someone. Stay beside me for a bit, Lély.',
  },
  {
    id:'pasture', mapId:'MAINLAND_C5R8_MAP', col:13, row:8,
    flag:'wilderness_dream_pasture_seen', title:'Counted twice',
    pages:[
      ['A bell rings in the hollow. There are no animals in the grass.'],
      ['A fence runs through the white. You count its posts so you will know how far you have come.'],
      ['At the seventh, someone begins counting with you. Their voice is very patient. They start at one.'],
      ['You reach the gate together. There is only room for one of you to pass. The counting continues on the other side.'],
      ['Wind moves over the hollow. Your mouth is open, but you have not been speaking.'],
    ],
    aftermath:'Esla looks back across the hollow, then at you.',
    esla:'Lély? Are you all right? Take a breath. Whatever you were looking at, you are here with me now.',
  },
].map(d=>Object.freeze({...d,pages:Object.freeze(d.pages.map(p=>Object.freeze(p)))})));

const wildernessDreams=(()=>{
  const byMap=new Map(WILDERNESS_DREAMS.map(d=>[d.mapId,d]));
  let active=false; // session-only; never serialized, saving/loading blocked while white
  function tryStep(from) {
    if(active || !from || dialogue.open || combat.active || choice.open || menu.open || shop.open) return false;
    const to=regionalPlayerWorldPoint();
    if(!to || from.regionId!==to.regionId ||
       (Math.floor(from.worldPxX/TILE)===Math.floor(to.worldPxX/TILE) &&
        Math.floor(from.worldPxY/TILE)===Math.floor(to.worldPxY/TILE))) return false;
    const d=byMap.get(to.mapId);
    if(!d || window[d.flag]) return false;
    const local=regionWorldPxToLocal(to.regionId,to.worldPxX,to.worldPxY);
    if(!local || Math.floor(local.localPxX/TILE)!==d.col || Math.floor(local.localPxY/TILE)!==d.row) return false;
    const withEsla=persistentParty.isAvailable('esla');
    // The existing dream gateway preserves the waking location and facing.
    enterDream();
    active=true;
    window[d.flag]=true;
    player.moving=false;
    openDialogue('',d.pages,[()=>{
      exitDream();
      active=false;
      if(withEsla && persistentParty.isAvailable('esla')) {
        // An empty callback array is deliberate: finishDialogue is still
        // draining the dream callback when this new conversation opens.
        openDialogue('',[],[]);
        setSpeakerDialoguePages([
          {speakerId:null,lines:[d.aftermath]},
          {speakerId:'esla',lines:[d.esla]},
        ]);
      }
    }]);
    return true;
  }
  return Object.freeze({tryStep,isActive:()=>active});
})();
