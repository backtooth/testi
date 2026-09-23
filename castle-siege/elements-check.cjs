const assert=require('node:assert/strict'),E=require('./engine.js');
const target={side:'N',lane:2,depth:2},key='N2:2';
function unit(id,pos=2){return {id,type:'shield',side:'N',lane:2,pos,hp:16,max:16,damage:3};}
function game(){const s=E.create('defend');s.towers={};s.troops=[unit(1)];return s;}
function cast(s,card,t=target){s.phase='defend';s.hands.defend=[card,'repair'];assert(E.play(s,'defend',0,t));}
function fight(s){s.phase='battle';assert(E.battle(s));}
{
 const s=game();assert.equal(s.water.length,0);assert.equal(s.walls[0].hp,10);fight(s);assert.equal(s.walls[1].hp,13,'Dry chasm does not stop attack');
 assert(E.valid(s,'oil',{...target,lane:1}));assert(E.valid(s,'fire',{...target,lane:1}));assert(!E.valid(s,'oil',{...target,depth:1}));assert(!E.valid(s,'fire',{...target,depth:1}));assert(!E.valid(s,'water',{side:'S',lane:3,depth:2}));
}
{
 const s=game();cast(s,'oil');assert(s.troops[0].oily);assert.equal(s.troops[0].skip,1);s.troops.push(unit(2));fight(s);assert.equal(s.walls[1].hp,13);assert(!s.troops[1].oily,'Later arrivals do not inherit dry oil');assert.equal(s.troops[0].skip,0);assert(s.troops[0].oily);
 cast(s,'fire');assert.equal(s.troops[0].hp,13);assert.equal(s.troops[1].hp,13);assert(s.troops[0].burning);assert(!s.troops[1].burning);fight(s);assert.equal(s.troops[0].hp,11);assert.equal(s.troops[1].hp,13);
}
{
 const s=game();cast(s,'oil');cast(s,'fire');cast(s,'water');assert(!s.troops[0].oily);assert(!s.troops[0].burning);assert.equal(s.troops[0].skip,1);fight(s);assert.equal(s.walls[1].hp,16);assert.equal(s.troops[0].hp,13);fight(s);assert.equal(s.walls[1].hp,13);
}
{
 const s=game();s.water=[key];cast(s,'oil');assert(s.oilWater.includes(key));assert(!s.troops[0].oily);assert(!s.troops[0].skip);cast(s,'fire');assert(s.burningTiles.includes(key));assert(s.troops[0].burning);s.troops.push(unit(2,0));fight(s);assert(s.troops[1].burning);assert(s.troops[1].waiting);assert.equal(s.troops[1].hp,14);assert.equal(s.burningTiles.length,0);assert.equal(s.oilWater.length,0);cast(s,'water');assert(s.troops.every(t=>!t.burning&&!t.oily&&t.skip===1));
}
{
 const s=game();s.water=[key];s.troops=[unit(1,0)];fight(s);assert.equal(s.walls[1].hp,16);assert(s.troops[0].waiting);fight(s);assert.equal(s.walls[1].hp,13);
}
{
 const s=game();s.troops[0].burning=true;s.troops[0].hp=2;fight(s);assert.equal(s.troops.length,0);assert.equal(s.walls[1].hp,16);
}
console.log('PASS: chasm, 10 HP towers, oil legality/cohort/skip, fire AoE/DoT, water cleanse/skip, black water, burning water arrivals/expiry, burn death.');

{const s=game();s.troops[0].lane=1;cast(s,'oil',{...target,lane:1});assert(s.troops[0].oily);assert.equal(s.troops[0].skip,1);s.walls[0].hp=0;assert(!E.valid(s,'oil',{...target,lane:1}));}
