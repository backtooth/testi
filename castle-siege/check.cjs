const assert=require('node:assert/strict');
const E=require('./engine.js');
const target={side:'N',lane:2,corner:0};
function base(){const s=E.create('attack',()=>.5);s.towers={0:0,4:0,20:0,24:0};return s;}
function unit(extra={}){return {id:1,type:'ram',side:'N',lane:2,pos:2,hp:19,max:19,damage:5,speed:1,crossed:false,...extra};}
{
 const s=base();assert.equal(Object.keys(s.walls).length,16);assert.equal(s.walls[22].hp,12);assert.equal(s.hands.attack.length+s.decks.attack.length,12);assert.equal(s.hands.defend.length+s.decks.defend.length,12);
 assert.equal(E.valid(s,'moat',{side:'S',lane:3}),false);
 assert.equal(E.tile('N',1),E.tile('W',1));
 assert.equal(E.valid(s,'upgrade',{...target,corner:1}),false);
 assert.equal(E.play(s,'defend',0,target),false);
 assert.equal(E.play(s,'attack',0,target),true);assert.equal(s.phase,'defend');assert.equal(s.used.attack,1);
}
{
 const s=base();s.moats=['N2'];s.troops=[unit()];s.phase='battle';E.battle(s);assert.equal(s.troops[0].pos,2);assert.equal(s.walls[1].hp,16);
 s.phase='battle';E.battle(s);assert.equal(s.troops[0].pos,3);assert.equal(s.walls[1].hp,11);
 s.phase='battle';E.battle(s);assert.equal(s.walls[1].hp,6);
}
{
 const s=base();s.moats=['N2'];s.troops=[unit({pos:3})];s.phase='battle';E.battle(s);assert.equal(s.walls[1].hp,11);
}
{
 const s=base();s.troops=[unit({side:'S',lane:3,pos:3,damage:12})];s.phase='battle';E.battle(s);assert.equal(s.winner,'attack');assert.equal(s.walls[22].hp,0);
 assert.equal(E.battle(s),false);
}
{
 const s=base();s.used={attack:12,defend:12};s.phase='battle';s.troops=[unit({pos:0})];E.battle(s);assert.equal(s.phase,'cleanup');assert.equal(s.winner,null);
 s.troops=[];E.battle(s);assert.equal(s.winner,'defend');
}
{
 const s=base();s.phase='battle';E.battle(s);assert.equal(s.winner,null);
 s.phase='defend';s.hands.defend=['moat'];assert.equal(E.play(s,'defend',0,{side:'S',lane:3},true),true);assert.equal(s.walls[22].hp,13);
}
let wins={attack:0,defend:0};
for(let seed=1;seed<=200;seed++){
 let n=seed;const rng=()=>((n=(1664525*n+1013904223)>>>0)/4294967296);const s=E.create('attack',rng);
 for(let step=0;!s.winner&&step<100;step++){
  if(['attack','defend'].includes(s.phase))assert(E.ai(s,s.phase));else assert(E.battle(s));
  for(const role of ['attack','defend'])assert.equal(s.used[role]+s.hands[role].length+s.decks[role].length,12);
 }
 assert(s.winner,'Every game must terminate');wins[s.winner]++;
}
assert(wins.attack>0&&wins.defend>0);
console.log('PASS: turns, decks, shared corners, gate, moat delay, existing troops, fallback, wins, cleanup, 200 complete seeded games.',wins);
