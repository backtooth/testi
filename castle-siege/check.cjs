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
 const s=base();s.used={attack:12,defend:12};s.phase='battle';s.troops=[unit({pos:0})];E.battle(s);assert.equal(s.phase,'aim');assert.equal(s.winner,null);
 s.troops=[];E.confirmDefense(s);E.battle(s);assert.equal(s.winner,'defend');
}
{
 const s=base();s.phase='battle';E.battle(s);assert.equal(s.winner,null);
 s.phase='defend';s.hands.defend=['moat'];assert.equal(E.play(s,'defend',0,{side:'S',lane:3},true),true);assert.equal(s.walls[22].hp,13);
}
let wins={attack:0,defend:0};
// Every tower has exactly eight legal lines; the far corner is excluded.
for(const corner of [0,4,20,24]){
 const seen=[];for(const side of E.sides)for(let lane=1;lane<=5;lane++)if(E.covers(corner,side,lane))seen.push(side+lane);
 const expected={0:['N1','N2','N3','N4','W1','W2','W3','W4'],4:['N2','N3','N4','N5','E1','E2','E3','E4'],20:['S1','S2','S3','S4','W2','W3','W4','W5'],24:['E2','E3','E4','E5','S2','S3','S4','S5']}[corner];
 assert.deepEqual(seen,expected);assert(!E.covers(corner,'N',0));assert(!E.covers(corner,'N',6));
}
{
 const s=base();s.hands.attack=['ram'];assert.equal(s.phase,'attack');E.play(s,'attack',0,target);
 const before=JSON.stringify(s.troops);assert.equal(E.battle(s),false);assert.equal(JSON.stringify(s.troops),before);
 assert.equal(E.assign(s,4,s.troops[0].id),true);assert.equal(E.assign(s,24,s.troops[0].id),false);
 s.hands.defend=['repair'];E.play(s,'defend',0,target);assert.equal(s.phase,'aim');assert.equal(E.battle(s),false);
 assert(E.confirmDefense(s));assert.equal(s.phase,'battle');assert(!E.assign(s,4,null));
}
{
 const s=base();s.towers[0]=9;s.troops=[unit({id:1,hp:7,pos:0}),unit({id:2,hp:7,pos:0})];s.phase='aim';
 assert(E.assign(s,0,1));assert(E.assign(s,0,2));E.confirmDefense(s);E.battle(s);
 assert.deepEqual(s.troops.map(t=>t.id),[1]);assert.equal(s.troops[0].hp,7);assert.equal(s.lastShots.length,1);
 assert.deepEqual(s.assignments,{});
}
{
 const s=base();s.towers[0]=9;s.towers[4]=9;s.troops=[unit({id:1,hp:7}),unit({id:2,hp:19})];s.phase='aim';
 E.assign(s,0,1);E.assign(s,4,1);E.confirmDefense(s);E.battle(s);
 assert.equal(s.troops.find(t=>t.id===2).hp,19,'No automatic retargeting after chosen target dies');
}
{
 const s=base();s.towers[0]=9;s.troops=[unit()];s.phase='aim';E.confirmDefense(s);E.battle(s);assert.equal(s.troops[0].hp,19,'Unassigned towers do not shoot');
}
for(let seed=1;seed<=200;seed++){
 let n=seed;const rng=()=>((n=(1664525*n+1013904223)>>>0)/4294967296);const s=E.create('attack',rng);
 for(let step=0;!s.winner&&step<100;step++){
  if(['attack','defend'].includes(s.phase))assert(E.ai(s,s.phase));else if(s.phase==='aim')assert(E.planDefense(s));else assert(E.battle(s));
  for(const role of ['attack','defend'])assert.equal(s.used[role]+s.hands[role].length+s.decks[role].length,12);
 }
 assert(s.winner,'Every game must terminate');wins[s.winner]++;
}

console.log('PASS: eight sight lines per tower, defense before battle, explicit targets, one shot per tower, no retargeting, turns, decks, gate, moat, cleanup, 200 complete seeded games.',wins);
