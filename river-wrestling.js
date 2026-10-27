'use strict';

// Session-only sport. No combat actors, inventory snapshots, quest flags or
// save fields. The sole persistent write is settlement through stats.gold.
const riverWrestling = (() => {
  let bout=null,accumulator=0;
  const nearbyReferee=()=>activeMap===REEDBANK_VILLAGE_MAP &&
    Math.hypot(player.x-336,player.y-304)<TALK_RADIUS;
  const fighter=x=>({x,stamina:100,footing:100,grip:0,windup:0,recovery:0,action:null,brace:false,flash:0});
  function offer() {
    if(bout||!nearbyReferee()||activityOwnership.conflicts([]).length)return false;
    openDialogue('Tavin',[
      ['First shoulders to the water. Release at once. No punches, kicks or gouging. You can give in at any time.'],
      ['Practice is free. A paid bout costs 10 gold. Win and take the 20-gold purse, including your stake. Lose or give in and the stake stays here.'],
    ],[()=>{
      choice.title='River wrestling';choice.options=['Free practice','Wrestle (10g)','Not now'];choice.cursor=0;
      choice.callbacks=[()=>prepare(0),()=>prepare(10),()=>{}];choice.open=true;
    }]);return true;
  }
  function prepare(stake) {
    if(bout||!nearbyReferee()||activityOwnership.conflicts([]).length||![0,10].includes(stake))return false;
    if(!Number.isSafeInteger(stats.gold)||stats.gold<stake||stats.gold>Number.MAX_SAFE_INTEGER-stake){openDialogue('Tavin',[['Ten gold for a paid bout. Practice costs nothing.']]);return false;}
    bout={phase:'ready',stake,paid:false,winner:null,age:0,resultAge:0,fall:0,frame:0,
      message:'Unbalance, grip, then throw.',you:fighter(190),opponent:fighter(322),decision:75};
    accumulator=0;return true;
  }
  const releaseKeys=()=>releaseRiverWrestlingKeys();
  function finish(winner,forfeit=false){
    if(!bout||bout.phase!=='fight')return;
    bout.phase=forfeit?'result':'fall';bout.winner=winner;bout.fall=0;bout.resultAge=0;
    bout.message=forfeit?'You give in. Tavin calls the bout.':'Shoulders to the water!';
    if(forfeit)settle();
  }
  function settle(){
    if(bout.paid)return;
    if(bout.winner==='you')stats.gold+=bout.stake*2;
    bout.paid=true;
  }
  function action(who,other,name){
    if(who.windup||who.recovery)return false;
    const cost={grip:12,shove:14,throw:26,break:18}[name];
    if(!cost||who.stamina<cost)return false;
    if(name==='throw'&&!who.grip){if(who===bout.you)bout.message='Get a grip with Z before you throw.';return false;}
    who.stamina-=cost;who.brace=false;
    if(name==='break'){
      other.grip=0;who.grip=0;who.x+=Math.sign(who.x-other.x)*16;
      who.recovery=20;who.footing=Math.min(100,who.footing+8);who.action='break';
      return true;
    }
    who.action=name;who.windup={grip:16,shove:18,throw:24}[name];return true;
  }
  function resolve(who,other){
    const close=Math.abs(who.x-other.x)<=64;
    if(!close){who.grip=0;who.recovery=22;return;}
    if(who.action==='grip'){
      who.grip=125;other.flash=8;
      if(who===bout.you)bout.message='Grip secured. Throw at 40 footing or less.';
    } else if(who.action==='shove'){
      other.footing=Math.max(0,other.footing-(other.brace?5:24));
      other.x+=Math.sign(other.x-who.x)*(other.brace?3:12);other.flash=10;
      if(who===bout.you)bout.message=other.brace?'Orren braces against your shove.':'His footing slips!';
    } else if(who.action==='throw'){
      if(who.grip&&other.footing<=40){finish(who===bout.you?'you':'opponent');return;}
      if(who.grip){other.footing=Math.max(0,other.footing-16);other.flash=10;}
      who.grip=0;
      if(who===bout.you)bout.message='He keeps his feet. Unbalance him first.';
    }
    who.recovery=who.action==='throw'?30:18;
  }
  function keyDown(key){
    if(!bout)return false;
    if(bout.phase==='ready'){
      if(key==='Escape'){bout=null;releaseKeys();return true;}
      if(key==='Enter'||key===' '){
        // Recheck at the actual start; merely viewing the rules never costs gold.
        if(!Number.isSafeInteger(stats.gold)||stats.gold<bout.stake||stats.gold>Number.MAX_SAFE_INTEGER-bout.stake){bout=null;releaseKeys();return false;}
        stats.gold-=bout.stake;bout.phase='fight';releaseKeys();
      }return true;
    }
    if(bout.phase==='result'){
      if(bout.resultAge>=45&&(key==='Enter'||key===' '||key==='Escape')){bout=null;releaseKeys();}
      return true;
    }
    if(bout.phase!=='fight')return true;
    if(key==='Escape'){finish('opponent',true);releaseKeys();return true;}
    const a={z:'grip',x:'shove',c:'throw',' ':'break'}[key.toLowerCase()];
    if(a)action(bout.you,bout.opponent,a);
    return true;
  }
  function step(){
    bout.frame++;
    if(bout.phase==='ready')return;
    if(bout.phase==='fall'){
      if(++bout.fall>=42){bout.phase='result';settle();}return;
    }
    if(bout.phase==='result'){bout.resultAge++;return;}
    bout.age++;
    const p=bout.you,o=bout.opponent;
    const controls=riverWrestlingControls();
    p.brace=controls.brace&&!p.windup&&!p.recovery;
    o.brace=!o.windup&&!o.recovery&&bout.decision<24&&o.footing<70;
    for(const f of [p,o]){
      f.flash=Math.max(0,f.flash-1);f.grip=Math.max(0,f.grip-1);f.recovery=Math.max(0,f.recovery-1);
      f.stamina=Math.min(100,f.stamina+(f.windup?0:f.brace?.32:.19));
      f.footing=Math.min(100,f.footing+(f.brace?.22:.025));
    }
    const direction=controls.direction;
    if(!p.brace&&!p.windup&&!p.recovery)p.x+=direction*(o.grip?.5:1.65);
    const distance=o.x-p.x;
    if(!o.brace&&!o.windup&&!o.recovery&&Math.abs(distance)>48)o.x-=Math.sign(distance)*(p.grip?.45:1.05);
    if(--bout.decision<=0&&!o.windup&&!o.recovery){
      bout.decision=64+(Math.floor(bout.age/120)%3)*12;
      if(p.grip>0&&p.grip<65)action(o,p,'break');
      else if(Math.abs(o.x-p.x)<=64){
        if(p.footing<=40)action(o,p,o.grip?'throw':'grip');
        else action(o,p,'shove');
      }
    }
    p.x=Math.max(52,Math.min(418,p.x));o.x=Math.max(94,Math.min(460,o.x));
    if(o.x-p.x<34){const middle=(o.x+p.x)/2;p.x=middle-17;o.x=middle+17;}
    if(Math.abs(p.x-o.x)>72){p.grip=0;o.grip=0;}
    // Both windups advance; if the first shoulder lands the other action stops.
    for(const [f,other] of [[p,o],[o,p]]){
      if(f.windup&&--f.windup===0)resolve(f,other);
      if(bout.phase!=='fight')break;
    }
  }
  return Object.freeze({offer,keyDown,isActive:()=>bout!==null,
    getView:()=>bout?JSON.parse(JSON.stringify(bout)):null,
    update(dt){
      if(!bout)return;
      accumulator+=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:1/60));
      while(bout&&accumulator>=1/60){accumulator-=1/60;step();}
    },
  });
})();
