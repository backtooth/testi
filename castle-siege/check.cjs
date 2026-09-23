const assert=require('node:assert/strict');
const E=require('./engine.js');
const target={side:'N',lane:2,corner:0,depth:2};
function base(){const s=E.create('attack',()=>.5);s.towers={0:0,4:0,20:0,24:0};return s;}
function unit(extra={}){return {id:1,type:'shield',side:'N',lane:2,pos:0,hp:16,max:16,damage:3,crossed:false,...extra};}
for(const corner of [0,4,20,24]){let count=0;for(const side of E.sides)for(let lane=1;lane<=5;lane++)if(E.covers(corner,side,lane))count++;assert.equal(count,8);}
assert(!E.covers(0,'N',5));assert(!E.covers(4,'N',1));assert(!E.covers(20,'W',1));assert(!E.covers(24,'S',1));
{
 const s=base();assert.equal(s.phase,'attack');assert.equal(Object.keys(s.walls).length,16);assert.equal(E.tile('N',1),E.tile('W',1));
 for(let i=0;i<3;i++){assert(E.play(s,'attack',0,target));assert.equal(s.phase,i===2?'aim':'attack');assert.equal(E.battle(s),false);assert(s.troops.every(t=>t.pos===0));}
 assert.equal(s.troops.length,3);assert.equal(s.lastAttack.length,3);assert.equal(s.hands.attack.length,0);assert.equal(s.used.attack,3);assert(!E.play(s,'defend',0,target));
 assert(E.assign(s,0,1));assert(!E.assign(s,24,1));assert(E.confirmDefense(s));assert(E.battle(s));assert.equal(s.phase,'defend');assert.equal(s.used.defend,0);assert(s.troops.every(t=>t.pos===2));
 for(let i=0;i<3;i++){assert(E.play(s,'defend',0,target,true));assert.equal(s.phase,i===2?'attack':'defend');}
 assert.equal(s.round,2);assert.equal(s.hands.attack.length,3);assert.equal(s.hands.defend.length,3);assert.equal(s.used.defend,3);
}
{
 const s=base();s.troops=[unit()];s.moats=['N2'];s.phase='battle';E.battle(s);assert.equal(s.troops[0].pos,2);assert.equal(s.troops[0].waiting,true);assert.equal(s.walls[1].hp,16);
 s.phase='battle';E.battle(s);assert.equal(s.walls[1].hp,13);assert.equal(s.troops[0].waiting,false);
 s.phase='battle';E.battle(s);assert.equal(s.walls[1].hp,10);assert.equal(s.troops[0].pos,2);
}
{
 const s=base();s.troops=[unit({pos:2})];s.moats=['N2'];s.phase='battle';E.battle(s);assert.equal(s.walls[1].hp,13,'New moat does not stop an existing attacker');
 assert(!E.valid(s,'moat',{side:'S',lane:3,depth:2}));assert(!E.valid(s,'moat',{side:'E',lane:2,depth:0}));assert(!E.valid(s,'moat',{side:'E',lane:2,depth:1}));assert(E.valid(s,'moat',{side:'E',lane:2,depth:2}));
}
{
 const s=base();s.towers[0]=9;s.troops=[unit({id:1}),unit({id:2})];s.phase='aim';assert(E.assign(s,0,1));assert(E.assign(s,0,2));E.confirmDefense(s);assert(!E.assign(s,0,1));E.battle(s);assert.equal(s.troops[0].hp,16);assert.equal(s.troops[1].hp,7);assert.equal(s.lastShots.length,1);assert.deepEqual(s.assignments,{});
}
{
 const s=base();s.towers[0]=9;s.towers[4]=9;s.troops=[unit({id:1,hp:7}),unit({id:2})];s.phase='aim';E.assign(s,0,1);E.assign(s,4,1);E.confirmDefense(s);E.battle(s);assert.equal(s.troops.find(t=>t.id===2).hp,16,'No retargeting');
}
{
 const s=base();s.used={attack:12,defend:12};s.hands={attack:[],defend:[]};s.decks={attack:[],defend:[]};s.troops=[unit()];s.phase='battle';E.battle(s);assert.equal(s.phase,'aim');assert.equal(s.winner,null);s.troops=[];E.confirmDefense(s);E.battle(s);assert.equal(s.winner,'defend');
}
{
 const s=base();s.troops=[unit({side:'S',lane:3,damage:12})];s.phase='battle';E.battle(s);assert.equal(s.winner,'attack');assert(!E.play(s,'defend',0,target,true));
}
const wins={attack:0,defend:0};
for(let seed=1;seed<=200;seed++){
 let n=seed;const rng=()=>((n=(1664525*n+1013904223)>>>0)/4294967296);const s=E.create('attack',rng);
 for(let step=0;!s.winner&&step<160;step++){
  if(['attack','defend'].includes(s.phase))assert(E.ai(s,s.phase));else if(s.phase==='aim')assert(E.planDefense(s));else assert(E.battle(s));
  for(const role of ['attack','defend'])assert.equal(s.used[role]+s.hands[role].length+s.decks[role].length,12);
 }
 assert(s.winner,'Game terminates');wins[s.winner]++;
}
console.log('PASS: 3 attack cards → targeting → battle → 3 defense cards; eight lines; one target; 7/16 HP; adjacent moat; one-turn delay; persistent attackers; cleanup; 200 complete games.',wins);
