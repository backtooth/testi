(function (root) {
  'use strict';
  const cards = {
    infantry: { name: 'Jalkaväki', text: '1 sotilas · 7 HP · 2 isku · nopeus 1', hp: 7, damage: 2, speed: 1, count: 1 },
    shield: { name: 'Kilpimiehet', text: '1 suojattu sotilas · 16 HP · 3 isku · nopeus 1', hp: 16, damage: 3, speed: 1, count: 1 },
    ram: { name: 'Muurinmurtaja', text: '1 pässi · 19 HP · 5 isku · nopeus 1', hp: 19, damage: 5, speed: 1, count: 1 },
    scout: { name: 'Rynnäkköjoukot', text: '1 nopea sotilas · 6 HP · 2 isku · nopeus 2', hp: 6, damage: 2, speed: 2, count: 1 },
    moat: { name: 'Kaiva vallihauta', text: 'Valitun linjan ylitys viivästyy yhden vuoron. Ei portille.' },
    upgrade: { name: 'Paranna tornia', text: 'Valittu kulmatorni tekee +1 vahinkoa joka vuoro.' },
    reinforce: { name: 'Vahvista muuria', text: 'Valittu muuri tai portti: +5 nykyistä ja enimmäiskestävyyttä.' },
    repair: { name: 'Korjaa muuria', text: 'Palauttaa 8 kestävyyttä. Ehjään muuriin: +2 kestävyyttä ja enimmäiskestävyyttä.' }
  };
  const sides = ['N', 'E', 'S', 'W'];
  const sideNames = { N: 'Pohjoinen', E: 'Itä', S: 'Etelä', W: 'Länsi' };
  function tile(side, lane) { return side === 'N' ? lane - 1 : side === 'S' ? 20 + lane - 1 : side === 'W' ? (lane - 1) * 5 : (lane - 1) * 5 + 4; }
  function laneKey(side, lane) { return side + lane; }
  function shuffle(a, random) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function create(role, random = Math.random) {
    const walls = {};
    sides.forEach(s => { for (let l = 1; l <= 5; l++) { const id = tile(s, l); walls[id] = { hp: id === 22 ? 12 : 16, max: id === 22 ? 12 : 16 }; } });
    const attack = shuffle(['infantry','shield','ram','scout','infantry','shield','ram','scout','infantry','shield','ram','scout'], random);
    const defend = shuffle(['moat','upgrade','reinforce','repair','moat','upgrade','reinforce','repair','moat','upgrade','reinforce','repair'], random);
    return { role, walls, towers: {0:9,4:9,20:9,24:9}, moats: [], troops: [], decks: {attack, defend}, hands: {attack: attack.splice(0,3), defend: defend.splice(0,3)}, used: {attack:0,defend:0}, round:1, phase:'attack', winner:null, nextId:1, logs:['Piiritys alkaa. Etelän linja 3 johtaa portille.'] };
  }
  function log(s, message) { s.logs.unshift(message); s.logs.length = Math.min(s.logs.length, 40); }
  function covers(corner, side, lane) {
    return (corner === 0 && ((side === 'N' || side === 'W') && lane <= 3)) ||
      (corner === 4 && ((side === 'N' && lane >= 3) || (side === 'E' && lane <= 3))) ||
      (corner === 20 && ((side === 'S' && lane <= 3) || (side === 'W' && lane >= 3))) ||
      (corner === 24 && ((side === 'S' || side === 'E') && lane >= 3));
  }
  function valid(s, card, target) {
    if (!target || !sides.includes(target.side) || !Number.isInteger(target.lane) || target.lane < 1 || target.lane > 5) return false;
    if (card === 'upgrade') return Object.hasOwn(s.towers, target.corner);
    if (card === 'moat') return tile(target.side,target.lane)!==22 && !s.moats.includes(laneKey(target.side,target.lane));
    return !!cards[card];
  }
  function play(s, role, index, target, fallback = false) {
    if (s.winner || s.phase !== role || !Number.isInteger(index) || !s.hands[role][index]) return false;
    const card = s.hands[role][index];
    if (!valid(s, fallback ? 'reinforce' : card, target)) return false;
    const id=tile(target.side,target.lane), wall=s.walls[id], label=sideNames[target.side]+' '+target.lane;
    if (role === 'attack') {
      const spec=cards[card];
      for(let i=0;i<spec.count;i++)s.troops.push({id:s.nextId++,type:card,side:target.side,lane:target.lane,pos:0,hp:spec.hp,max:spec.hp,damage:spec.damage,speed:spec.speed,crossed:false});
    } else if(fallback) { wall.hp++;wall.max++; }
    else if(card==='moat')s.moats.push(laneKey(target.side,target.lane));
    else if(card==='upgrade')s.towers[target.corner]++;
    else if(card==='reinforce'){wall.hp+=5;wall.max+=5;}
    else if(card==='repair'){if(wall.hp===wall.max){wall.hp+=2;wall.max+=2;}else wall.hp=Math.min(wall.max,wall.hp+8);}
    log(s,(role==='attack'?'Hyökkääjä: ':'Puolustaja: ')+(fallback?'Hätälinnoitus':cards[card].name)+' → '+(card==='upgrade'&&!fallback?'kulmatorni':label));
    s.hands[role].splice(index,1);s.used[role]++;
    s.phase=role==='attack'?'defend':'battle';return true;
  }
  function battle(s) {
    if(s.winner||!['battle','cleanup'].includes(s.phase))return false;
    for(const [key,power] of Object.entries(s.towers)){
      const targets=s.troops.filter(t=>t.hp>0&&t.pos>=1&&covers(Number(key),t.side,t.lane)).sort((a,b)=>b.pos-a.pos||a.id-b.id);
      if(targets.length)targets[0].hp-=power;
    }
    const dead=s.troops.filter(t=>t.hp<=0).length;
    s.troops=s.troops.filter(t=>t.hp>0);if(dead)log(s,'Tornit tuhosivat '+dead+' joukkoa.');
    for(const t of s.troops){
      if(t.pos<3){const next=Math.min(3,t.pos+t.speed);if(next===3&&!t.crossed&&s.moats.includes(laneKey(t.side,t.lane))){t.pos=2;t.crossed=true;log(s,'Vallihauta pysäytti joukon: '+sideNames[t.side]+' '+t.lane+'.');continue;}t.pos=next;}
      if(t.pos===3){const w=s.walls[tile(t.side,t.lane)];w.hp=Math.max(0,w.hp-t.damage);log(s,sideNames[t.side]+' '+t.lane+': '+t.damage+' vahinkoa '+(tile(t.side,t.lane)===22?'porttiin.':'muuriin.'));if(w.hp===0){s.winner='attack';s.phase='over';log(s,'Puolustus murtui. Hyökkääjä voitti!');return true;}}
    }
    if(s.used.attack===12&&s.used.defend===12){s.phase='cleanup';if(!s.troops.length){s.winner='defend';s.phase='over';log(s,'Kaikki hyökkääjät on torjuttu. Puolustaja voitti!');}}
    else {for(const role of ['attack','defend'])if(s.decks[role].length)s.hands[role].push(s.decks[role].shift());s.phase='attack';}
    s.round++;return true;
  }
  function ai(s, role) {
    const candidates=[];
    sides.forEach(side=>{for(let lane=1;lane<=5;lane++)candidates.push({side,lane,corner:0});});
    if(role==='attack'){
      const score=t=>{const id=tile(t.side,t.lane);const fire=Object.entries(s.towers).reduce((n,[c,p])=>n+(covers(Number(c),t.side,t.lane)?p:0),0);const allies=s.troops.filter(u=>u.side===t.side&&u.lane===t.lane).length;return 25-s.walls[id].hp-fire*2+allies*3-(s.moats.includes(laneKey(t.side,t.lane))?4:0);};
      candidates.sort((a,b)=>score(b)-score(a));
      const index=s.hands.attack.indexOf('ram');return play(s,role,index<0?0:index,candidates[0]);
    }
    const threat=t=>s.troops.filter(u=>u.side===t.side&&u.lane===t.lane).reduce((n,u)=>n+u.damage*(u.pos+1),0)+(s.walls[tile(t.side,t.lane)].max-s.walls[tile(t.side,t.lane)].hp);
    candidates.sort((a,b)=>threat(b)-threat(a));
    let best=null;
    s.hands.defend.forEach((card,index)=>candidates.forEach(target=>{
      const options=card==='upgrade'?Object.keys(s.towers).map(c=>({...target,corner:Number(c)})):[target];
      options.forEach(t=>{if(!valid(s,card,t))return;const wall=s.walls[tile(t.side,t.lane)],danger=threat(t);let score=0;
        if(card==='repair')score=Math.min(8,wall.max-wall.hp)*3+danger*.1;
        if(card==='reinforce')score=4+danger*.55;
        if(card==='moat')score=3+s.troops.filter(u=>u.side===t.side&&u.lane===t.lane&&u.pos<3&&!u.crossed).length*5;
        if(card==='upgrade')score=5+s.troops.filter(u=>covers(t.corner,u.side,u.lane)).length*3;
        if(!best||score>best.score)best={score,index,target:t};
      });
    }));
    return best?play(s,role,best.index,best.target):play(s,role,0,candidates[0],true);
  }
  const api={cards,sides,sideNames,tile,laneKey,create,covers,valid,play,battle,ai};
  if(typeof module!=='undefined')module.exports=api;else root.Siege=api;
})(typeof window!=='undefined'?window:globalThis);

