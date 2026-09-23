(() => {
 'use strict';
 const E=window.Siege,$=id=>document.getElementById(id);
 let s=null,selected=0,viewTower=null,target={side:'S',lane:3,corner:0,depth:2};
 const colors={0:'#e8bd70',4:'#80d5e5',20:'#c5a5ef',24:'#9ed692'};
 function aiHand(role){let guard=0;while(!s.winner&&s.phase===role&&guard++<3)if(!E.ai(s,role))break;}
 function start(role){s=E.create(role);selected=0;viewTower=null;target={side:'S',lane:3,corner:0,depth:2};$('start').hidden=true;$('game').hidden=false;if(role==='defend')aiHand('attack');render();}
 document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>start(b.dataset.role));
 $('new-game').onclick=()=>{if(s&&!s.winner&&!confirm('Keskeytetäänkö nykyinen piiritys?'))return;s=null;$('game').hidden=true;$('start').hidden=false;};
 ['side','lane','corner'].forEach(id=>$(id).onchange=()=>{target[id]=id==='side'?$(id).value:Number($(id).value);target.depth=2;if(id==='corner')viewTower=target.corner;render();});
 function use(fallback=false){if(!E.play(s,s.role,selected,target,fallback))return;selected=0;if(s.role==='defend'&&s.phase==='attack')aiHand('attack');render();}
 $('play').onclick=()=>use();$('fallback').onclick=()=>use(true);
 $('resolve').onclick=()=>{E.battle(s);selected=0;render();};
 $('ai-response').onclick=()=>{if(s.phase==='aim')E.planDefense(s);else if(s.phase==='defend')aiHand('defend');render();};
 $('confirm-defense').onclick=()=>{E.confirmDefense(s);render();};
 function route(side,lane,depth){const v=(lane+2)*100+50;return side==='N'?[v,depth*100+50]:side==='S'?[v,1050-depth*100]:side==='W'?[depth*100+50,v]:[1050-depth*100,v];}
 function defenseUI(){
  const editable=s.role==='defend'&&s.phase==='aim'&&!s.winner;
  $('defense-panel').hidden=!editable;const host=$('assignments');host.replaceChildren();
  for(const [corner,name] of Object.entries(E.towerNames)){
   const label=document.createElement('label');label.className='tower-order';label.style.borderLeftColor=colors[corner];label.textContent=name+' · '+s.towers[corner]+' vahinkoa';const sight=document.createElement('small');sight.textContent={0:'Näkyvyys: pohjoinen 1–4, länsi 1–4',4:'Näkyvyys: pohjoinen 2–5, itä 1–4',20:'Näkyvyys: etelä 1–4, länsi 2–5',24:'Näkyvyys: etelä 2–5, itä 2–5'}[corner];label.appendChild(sight);const select=document.createElement('select');select.id='assign-'+corner;select.setAttribute('aria-label',name+' torjuntakohde');
   const empty=document.createElement('option');empty.value='';empty.textContent='Ei torjuntakohdetta';select.appendChild(empty);
   s.troops.filter(t=>E.covers(Number(corner),t.side,t.lane)).forEach(t=>{const option=document.createElement('option');option.value=t.id;option.textContent='#'+t.id+' '+E.sideNames[t.side]+' '+t.lane+' · '+E.cards[t.type].name+' ('+t.hp+'/'+t.max+' HP)';select.appendChild(option);});
   select.value=s.assignments[corner]??'';select.onchange=()=>{viewTower=Number(corner);E.assign(s,viewTower,select.value?Number(select.value):null);render();};label.appendChild(select);host.appendChild(label);
  }
  const summary=$('defense-summary');summary.replaceChildren();
  const orders=Object.entries(s.assignments).map(([c,id])=>{const t=s.troops.find(t=>t.id===id);return t?{corner:c,troopId:id,side:t.side,lane:t.lane}:null;}).filter(Boolean);
  const shown=orders.length?orders:['attack','defend'].includes(s.phase)?s.lastShots:[];
  shown.forEach(o=>{const div=document.createElement('div');div.style.borderLeftColor=colors[o.corner];div.className='order-key';div.textContent=(orders.length?'':'Edellinen: ')+E.towerNames[o.corner]+' → #'+o.troopId+' '+E.sideNames[o.side]+' '+o.lane;summary.appendChild(div);});
  if(!shown.length)summary.textContent='Torjuntakohteita ei ole valittu.';
  const overlay=$('orders-overlay');overlay.replaceChildren();const ns='http://www.w3.org/2000/svg';
  function line(from,to,color,dash,width){const l=document.createElementNS(ns,'line');Object.entries({x1:from[0],y1:from[1],x2:to[0],y2:to[1],stroke:color,'stroke-width':width,'stroke-dasharray':dash}).forEach(([k,v])=>l.setAttribute(k,v));overlay.appendChild(l);const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',to[0]);dot.setAttribute('cy',to[1]);dot.setAttribute('r','8');dot.setAttribute('fill',color);overlay.appendChild(dot);}
  const announced=new Set();s.troops.filter(t=>s.lastAttack.includes(t.id)).forEach(t=>{const key=t.side+t.lane;if(!announced.has(key)){line(route(t.side,t.lane,0),route(t.side,t.lane,3),'#f19a7b','12 9',6);announced.add(key);}});
  orders.forEach(o=>{const t=s.troops.find(t=>t.id===o.troopId),corner=Number(o.corner);line([(corner%5+3)*100+50,(Math.floor(corner/5)+3)*100+50],route(t.side,t.lane,t.pos),colors[corner],'',4);});
 }
 function laneAt(x,y){if(y<3&&x>=3&&x<=7)return {side:'N',lane:x-2,depth:y};if(y>7&&x>=3&&x<=7)return {side:'S',lane:x-2,depth:10-y};if(x<3&&y>=3&&y<=7)return {side:'W',lane:y-2,depth:x};if(x>7&&y>=3&&y<=7)return {side:'E',lane:y-2,depth:10-x};return null;}
 function selectCell(lane,id){target={...target,...lane};if(id!==null&&Object.hasOwn(s.towers,id)){target.corner=id;viewTower=viewTower===id?null:id;}render();}
 function map(){
  const board=$('board');board.replaceChildren();
  for(let y=0;y<11;y++)for(let x=0;x<11;x++){
   let lane=laneAt(x,y),id=null;const castle=x>=3&&x<=7&&y>=3&&y<=7,edge=castle&&(x===3||x===7||y===3||y===7);
   if(edge){id=(y-3)*5+x-3;lane=y===3?{side:'N',lane:x-2,depth:2}:y===7?{side:'S',lane:x-2,depth:2}:x===3?{side:'W',lane:y-2,depth:2}:{side:'E',lane:y-2,depth:2};}
   const cell=document.createElement(lane?'button':'div');if(lane)cell.type='button';cell.className='cell';cell.dataset.x=x;cell.dataset.y=y;
   if(edge){const wall=s.walls[id],tower=Object.hasOwn(s.towers,id);cell.classList.add('wall');if(tower){cell.dataset.corner=id;if(viewTower===id)cell.classList.add('selected-tower');}if(id===22)cell.classList.add('gate');if(wall.hp<wall.max)cell.classList.add('damaged');const sym=document.createElement('span');sym.textContent=tower?'♜':id===22?'▥':'▤';const hp=document.createElement('small');hp.textContent=wall.hp+'/'+wall.max;cell.append(sym,hp);cell.setAttribute('aria-label',(tower?E.towerNames[id]+' kulmatorni, ':id===22?'Portti, ':'Muuri, ')+E.sideNames[lane.side]+' '+lane.lane+', kestävyys '+wall.hp+'/'+wall.max);}
   else if(castle){cell.classList.add('court');if(x===5&&y===5)cell.textContent='⚑';}
   else if(lane){cell.classList.add('path');cell.dataset.side=lane.side;cell.dataset.lane=lane.lane;cell.dataset.depth=lane.depth;cell.textContent=lane.depth===0?({N:'↓',E:'←',S:'↑',W:'→'}[lane.side]+lane.lane):'·';if(lane.depth===0)cell.classList.add('arrow');if(lane.depth===2&&s.moats.includes(E.laneKey(lane.side,lane.lane))){cell.classList.add('moat');cell.textContent='≈';}cell.setAttribute('aria-label',E.sideNames[lane.side]+' linja '+lane.lane+', '+(3-lane.depth)+' ruutua muurista');}
   else cell.classList.add('empty');
   if(lane){
    const chosen=edge?E.tile(target.side,target.lane)===id:target.side===lane.side&&target.lane===lane.lane;if(chosen)cell.classList.add('chosen');
    if(!edge&&viewTower!==null&&E.covers(viewTower,lane.side,lane.lane)){cell.classList.add('reachable');cell.setAttribute('aria-label',cell.getAttribute('aria-label')+', valitun tornin puolustusalue');}
    if(s.troops.some(t=>s.lastAttack.includes(t.id)&&t.side===lane.side&&t.lane===lane.lane))cell.classList.add('incoming-lane');
    cell.onclick=()=>selectCell(lane,id);
    if(!edge){const troops=s.troops.filter(t=>t.side===lane.side&&t.lane===lane.lane&&t.pos===lane.depth);if(troops.length){cell.classList.add('occupied');cell.replaceChildren();const marker=document.createElement('span');marker.textContent=troops.length===1?'#'+troops[0].id:troops.length+'×';cell.appendChild(marker);const hp=document.createElement('small');hp.className='unit-hp';hp.textContent=troops.length===1?troops[0].hp+'/'+troops[0].max:troops.reduce((n,t)=>n+t.hp,0)+'/'+troops.reduce((n,t)=>n+t.max,0);cell.appendChild(hp);cell.setAttribute('aria-label',cell.getAttribute('aria-label')+', '+troops.map(t=>'hyökkääjä #'+t.id+' HP '+t.hp+'/'+t.max).join(', '));}}
   }
   board.appendChild(cell);
  }
  $('sight-info').textContent=viewTower===null?'Klikkaa kulmatornia nähdäksesi sen kahdeksan puolustuslinjaa.':E.towerNames[viewTower]+': korostetut ruudut ovat tornin puolustusalue. Klikkaa samaa tornia piilottaaksesi alueen.';
 }
 function render(){
  $('role-label').textContent=s.role==='attack'?'Sinä hyökkäät · tietokone puolustaa':'Sinä puolustat · tietokone hyökkää';$('round').textContent='Kierros '+s.round;
  $('counts').textContent='Käytetty: hyökkääjä '+s.used.attack+'/12 · puolustaja '+s.used.defend+'/12';$('side').value=target.side;$('lane').value=target.lane;$('corner').value=target.corner;
  const wall=s.walls[E.tile(target.side,target.lane)],gate=E.tile(target.side,target.lane)===22;
  $('selection').textContent=E.sideNames[target.side]+' · linja '+target.lane;
  $('target-info').textContent=(gate?'Portti':'Muuri')+' '+wall.hp+'/'+wall.max+' · '+(gate?'Ei vallihautaa':s.moats.includes(E.laneKey(target.side,target.lane))?'Vallihauta muurin viereisessä ruudussa':'Ei vallihautaa');
  const active=s.phase===s.role&&!s.winner,card=s.hands[s.role][selected];
  $('phase').textContent=s.winner?'PIIRITYS PÄÄTTYI':s.phase==='attack'?'HYÖKKÄÄJÄ: '+s.hands.attack.length+' KORTTIA JÄLJELLÄ':s.phase==='battle'?'TAISTELUVAIHE':s.phase==='defend'?'PUOLUSTAJA: '+s.hands.defend.length+' KORTTIA JÄLJELLÄ':'VALITSE TORNIEN TORJUNTAKOHTEET';
  for(const part of ['attack','aim','battle','defend'])$('step-'+part).classList.toggle('current',!s.winner&&s.phase===part);
  const incoming=s.troops.filter(t=>s.lastAttack.includes(t.id));$('incoming').textContent=incoming.length?'HYÖKKÄYS ILMOITETTU: '+incoming.map(t=>'#'+t.id+' '+E.cards[t.type].name+' '+t.hp+'/'+t.max+' HP → '+E.sideNames[t.side]+' '+t.lane).join(' · ')+(s.phase==='attack'?' · Pelaa loput käden kortit.':s.phase==='battle'?' · Torjunta vahvistettu.':' · Odottaa torjuntavalintoja.'):s.phase==='defend'?'Taistelu päättyi. Puolustaja pelaa nyt kolme korttiaan.':s.phase==='aim'?'Kentällä olevat joukot odottavat tornien torjuntakohteita.':'Hyökkääjä aloittaa ja pelaa kaikki kolme korttia.';
  const hand=$('hand');hand.replaceChildren();s.hands[s.role].forEach((key,i)=>{const b=document.createElement('button');b.className='card'+(i===selected?' selected':'');b.type='button';b.disabled=!active;b.setAttribute('aria-pressed',String(i===selected));const strong=document.createElement('strong');strong.textContent=E.cards[key].name;const small=document.createElement('small');small.textContent=E.cards[key].text;b.append(strong,small);b.onclick=()=>{selected=i;render();};hand.appendChild(b);});
  $('corner-wrap').hidden=!(active&&card==='upgrade');$('play').hidden=!active;$('play').disabled=!card||!E.valid(s,card,target);$('fallback').hidden=!(active&&s.role==='defend');
  $('help').textContent=!active?'':card==='moat'&&!E.valid(s,card,target)?'Vallihauta vain muurin viereiseen ruutuun (1 ruutu muurista). Ei portille tai olemassa olevan vallihaudan päälle.':card==='upgrade'?'Valitse parannettava kulmatorni kentältä tai valikosta.':'Pelaa kaikki kolme korttia yksi kerrallaan. Voit valita jokaiselle oman kohteen.';
  $('resolve').hidden=!!s.winner||s.phase!=='battle';$('resolve').textContent='Ratkaise taistelu';
  $('ai-response').hidden=!!s.winner||s.role!=='attack'||!['defend','aim'].includes(s.phase);$('ai-response').textContent=s.phase==='aim'?'Näytä tietokoneen torjuntavalinnat':'Puolustaja pelaa kolme korttia';
  $('confirm-defense').hidden=!!s.winner||s.role!=='defend'||s.phase!=='aim';
  if(s.phase==='aim'&&s.role==='defend')$('help').textContent='Valitse enintään yksi hyökkääjä jokaiselle tornille. Korttisi pelataan vasta taistelun jälkeen.';
  $('result').hidden=!s.winner;$('result').textContent=s.winner?(s.winner===s.role?'Voitit! ':'Hävisit. ')+(s.winner==='attack'?'Linnan puolustus murtui.':'Linna kesti piirityksen.') :'';
  const list=$('log');list.replaceChildren();s.logs.slice(0,12).forEach(message=>{const li=document.createElement('li');li.textContent=message;list.appendChild(li);});
  const roster=$('troops');roster.replaceChildren();const heading=document.createElement('strong');heading.textContent='Hyökkääjät kentällä ('+s.troops.length+')';roster.appendChild(heading);
  s.troops.forEach(t=>{const b=document.createElement('button');b.className='troop-row';b.type='button';const canAssign=s.role==='defend'&&s.phase==='aim'&&viewTower!==null&&E.covers(viewTower,t.side,t.lane);b.textContent='#'+t.id+' '+E.cards[t.type].name+' · '+t.hp+'/'+t.max+' HP · '+E.sideNames[t.side]+' '+t.lane+' · '+(t.waiting?'vallihaudassa':t.pos===2?'muurin edessä':'saapumassa')+(canAssign?' · Valitse kohteeksi':'');b.onclick=()=>{target={...target,side:t.side,lane:t.lane,depth:2};if(canAssign)E.assign(s,viewTower,t.id);render();};roster.appendChild(b);});
  map();defenseUI();
 }
})();
