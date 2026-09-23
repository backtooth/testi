(() => {
 'use strict';
 const E=window.Siege,$=id=>document.getElementById(id);
 let s=null,selected=0,target={side:'S',lane:3,corner:0};
 function start(role){s=E.create(role);selected=0;target={side:'S',lane:3,corner:0};$('start').hidden=true;$('game').hidden=false;if(role==='defend')E.ai(s,'attack');render();}
 document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>start(b.dataset.role));
 $('new-game').onclick=()=>{if(s&&!s.winner&&!confirm('Keskeytetäänkö nykyinen piiritys?'))return;s=null;$('game').hidden=true;$('start').hidden=false;};
 ['side','lane','corner'].forEach(id=>$(id).onchange=()=>{target[id]=id==='side'?$(id).value:Number($(id).value);render();});
 function use(fallback=false){if(!E.play(s,s.role,selected,target,fallback))return;selected=0;render();}
 $('play').onclick=()=>use();$('fallback').onclick=()=>use(true);
 $('resolve').onclick=()=>{E.battle(s);if(!s.winner&&s.phase==='attack'&&s.role==='defend')E.ai(s,'attack');selected=0;render();};
 $('ai-response').onclick=()=>{if(s.phase==='defend')E.ai(s,'defend');else if(s.phase==='aim')E.planDefense(s);render();};
 $('confirm-defense').onclick=()=>{E.confirmDefense(s);render();};
 const colors={0:'#e8bd70',4:'#80d5e5',20:'#c5a5ef',24:'#9ed692'};
 function route(side,lane,depth){const v=(lane+1)*100+50;return side==='N'?[v,depth*100+50]:side==='S'?[v,850-depth*100]:side==='W'?[depth*100+50,v]:[850-depth*100,v];}
 function defenseUI(){
  const editable=s.role==='defend'&&['defend','aim'].includes(s.phase)&&!s.winner;
  $('defense-panel').hidden=!editable;const host=$('assignments');host.replaceChildren();
  for(const [corner,name] of Object.entries(E.towerNames)){
   const label=document.createElement('label');label.className='tower-order';label.style.borderLeftColor=colors[corner];label.textContent=name+' · '+s.towers[corner]+' vahinkoa';const sight=document.createElement('small');sight.textContent={0:'Näkyvyys: pohjoinen 1–4, länsi 1–4',4:'Näkyvyys: pohjoinen 2–5, itä 1–4',20:'Näkyvyys: etelä 1–4, länsi 2–5',24:'Näkyvyys: etelä 2–5, itä 2–5'}[corner];label.appendChild(sight);const select=document.createElement('select');select.id='assign-'+corner;select.setAttribute('aria-label',name+' torjuntakohde');
   const empty=document.createElement('option');empty.value='';empty.textContent='Ei torjuntakohdetta';select.appendChild(empty);
   s.troops.filter(t=>E.covers(Number(corner),t.side,t.lane)).forEach(t=>{const option=document.createElement('option');option.value=t.id;option.textContent='#'+t.id+' '+E.sideNames[t.side]+' '+t.lane+' · '+E.cards[t.type].name+' ('+t.hp+' HP)';select.appendChild(option);});
   select.value=s.assignments[corner]??'';select.onchange=()=>{E.assign(s,Number(corner),select.value?Number(select.value):null);render();};label.appendChild(select);host.appendChild(label);
  }
  const summary=$('defense-summary');summary.replaceChildren();
  const orders=Object.entries(s.assignments).map(([c,id])=>{const t=s.troops.find(t=>t.id===id);return t?{corner:c,troopId:id,side:t.side,lane:t.lane}:null;}).filter(Boolean);
  const shown=orders.length?orders:s.phase==='attack'?s.lastShots:[];
  shown.forEach(o=>{const div=document.createElement('div');div.style.borderLeftColor=colors[o.corner];div.className='order-key';div.textContent=(orders.length?'':'Edellinen: ')+E.towerNames[o.corner]+' → #'+o.troopId+' '+E.sideNames[o.side]+' '+o.lane;summary.appendChild(div);});
  if(!shown.length)summary.textContent='Torjuntakohteita ei ole valittu.';
  const overlay=$('orders-overlay');overlay.replaceChildren();const ns='http://www.w3.org/2000/svg';
  function line(from,to,color,dash,width){const l=document.createElementNS(ns,'line');Object.entries({x1:from[0],y1:from[1],x2:to[0],y2:to[1],stroke:color,'stroke-width':width,'stroke-dasharray':dash}).forEach(([k,v])=>l.setAttribute(k,v));overlay.appendChild(l);const dot=document.createElementNS(ns,'circle');dot.setAttribute('cx',to[0]);dot.setAttribute('cy',to[1]);dot.setAttribute('r','9');dot.setAttribute('fill',color);overlay.appendChild(dot);}
  s.troops.filter(t=>s.lastAttack.includes(t.id)).forEach(t=>line(route(t.side,t.lane,0),route(t.side,t.lane,2),'#f19a7b','12 9',7));
  orders.forEach(o=>{const t=s.troops.find(t=>t.id===o.troopId);const corner=Number(o.corner);line([(corner%5+2)*100+50,(Math.floor(corner/5)+2)*100+50],route(t.side,t.lane,t.pos===3?2:t.pos===0?0:1),colors[corner],'',5);});
 }
 function laneAt(x,y){if(y<=1&&x>=2&&x<=6)return {side:'N',lane:x-1};if(y>=7&&x>=2&&x<=6)return {side:'S',lane:x-1};if(x<=1&&y>=2&&y<=6)return {side:'W',lane:y-1};if(x>=7&&y>=2&&y<=6)return {side:'E',lane:y-1};return null;}
 function map(){const board=$('board');board.replaceChildren();for(let y=0;y<9;y++)for(let x=0;x<9;x++){
   let lane=laneAt(x,y),id=null;const castle=x>=2&&x<=6&&y>=2&&y<=6,edge=castle&&(x===2||x===6||y===2||y===6);
   if(edge){id=(y-2)*5+x-2;lane=y===2?{side:'N',lane:x-1}:y===6?{side:'S',lane:x-1}:x===2?{side:'W',lane:y-1}:{side:'E',lane:y-1};}
   const cell=document.createElement(lane?'button':'div');if(lane)cell.type='button';cell.className='cell';
   if(edge){const wall=s.walls[id],tower=Object.hasOwn(s.towers,id);cell.classList.add('wall');if(id===22)cell.classList.add('gate');if(wall.hp<wall.max)cell.classList.add('damaged');const sym=document.createElement('span');sym.textContent=tower?'♜':id===22?'▥':'▤';const hp=document.createElement('small');hp.textContent=wall.hp+'/'+wall.max;cell.append(sym,hp);cell.setAttribute('aria-label',(tower?'Kulmatorni, ':id===22?'Portti, ':'Muuri, ')+E.sideNames[lane.side]+' '+lane.lane+', kestävyys '+wall.hp+'/'+wall.max+(tower?', tornin vahinko '+s.towers[id]:''));}
   else if(castle){cell.classList.add('court');if(x===4&&y===4)cell.textContent='⚑';}
   else if(lane){cell.classList.add('path');const outer=x===0||x===8||y===0||y===8;cell.textContent=outer?({N:'↓',E:'←',S:'↑',W:'→'}[lane.side]+lane.lane):'·';if(outer)cell.classList.add('arrow');if(!outer&&s.moats.includes(E.laneKey(lane.side,lane.lane))){cell.classList.add('moat');cell.textContent='≈';}cell.setAttribute('aria-label',E.sideNames[lane.side]+' linja '+lane.lane);}
   else cell.classList.add('empty');
   if(lane){const chosen=edge?E.tile(target.side,target.lane)===id:target.side===lane.side&&target.lane===lane.lane;if(chosen)cell.classList.add('chosen');if(s.troops.some(t=>s.lastAttack.includes(t.id)&&t.side===lane.side&&t.lane===lane.lane))cell.classList.add('incoming-lane');cell.onclick=()=>{target={...target,...lane};if(id!==null&&Object.hasOwn(s.towers,id))target.corner=id;render();};const troops=s.troops.filter(t=>edge?E.tile(t.side,t.lane)===id&&t.pos===3:t.side===lane.side&&t.lane===lane.lane&&((x===0||x===8||y===0||y===8)?t.pos===0:t.pos===1||t.pos===2));if(troops.length){cell.classList.add('has-troops');cell.dataset.count=troops.map(t=>'#'+t.id).join(',');cell.setAttribute('aria-label',cell.getAttribute('aria-label')+', hyökkääjät '+cell.dataset.count);}}
   board.appendChild(cell);
 }}
 function render(){
  $('role-label').textContent=s.role==='attack'?'Sinä hyökkäät · tietokone puolustaa':'Sinä puolustat · tietokone hyökkää';$('round').textContent='Vuoro '+s.round;
  $('counts').textContent='Käytetty: hyökkääjä '+s.used.attack+'/12 · puolustaja '+s.used.defend+'/12';
  $('side').value=target.side;$('lane').value=target.lane;$('corner').value=target.corner;
  const wall=s.walls[E.tile(target.side,target.lane)],gate=E.tile(target.side,target.lane)===22;
  $('selection').textContent=E.sideNames[target.side]+' · linja '+target.lane;
  $('target-info').textContent=(gate?'Portti':'Muuri')+' '+wall.hp+'/'+wall.max+' · '+(gate?'Ei vallihautaa':s.moats.includes(E.laneKey(target.side,target.lane))?'Vallihauta: +1 vuoron viive':'Ei vallihautaa');
  const active=s.phase===s.role&&!s.winner,card=s.hands[s.role][selected];
  $('phase').textContent=s.winner?'PIIRITYS PÄÄTTYI':s.phase==='attack'?'HYÖKKÄÄJÄN VUORO':s.phase==='battle'?'TORJUNTA VAHVISTETTU · TAISTELU VALMIS':s.used.defend===12?'LOPPUTAISTELU · VALITSE TORJUNTA':'PUOLUSTAJAN VUORO';
  for(const part of ['attack','defend','battle'])$('step-'+part).classList.toggle('current',!s.winner&&(s.phase==='aim'?'defend':s.phase)===part);
  const incoming=s.troops.filter(t=>s.lastAttack.includes(t.id));$('incoming').textContent=incoming.length?'HYÖKKÄYS ILMOITETTU: '+incoming.map(t=>'#'+t.id+' '+E.cards[t.type].name+' → '+E.sideNames[t.side]+' '+t.lane).join(' · ')+(s.phase==='battle'?' · Torjunta vahvistettu.':' · Odottaa puolustajan vastausta.'):s.phase==='aim'?'Kentällä olevat joukot odottavat tornien uusia torjuntakohteita.':'Hyökkääjä aloittaa jokaisen korttivuoron.';
  const hand=$('hand');hand.replaceChildren();s.hands[s.role].forEach((key,i)=>{const b=document.createElement('button');b.className='card'+(i===selected?' selected':'');b.type='button';b.disabled=!active;b.setAttribute('aria-pressed',String(i===selected));const strong=document.createElement('strong');strong.textContent=E.cards[key].name;const small=document.createElement('small');small.textContent=E.cards[key].text;b.append(strong,small);b.onclick=()=>{selected=i;render();};hand.appendChild(b);});
  $('corner-wrap').hidden=!(active&&card==='upgrade');$('play').hidden=!active;$('play').disabled=!card||!E.valid(s,card,target);$('fallback').hidden=!(active&&s.role==='defend');
  $('help').textContent=!active?'':card==='moat'&&!E.valid(s,card,target)?'Valitse linja ilman vallihautaa. Portin kulkutie on jätettävä avoimeksi.':card==='upgrade'?'Valitse parannettava kulmatorni kentältä tai valikosta. Nykyinen vahinko: '+s.towers[target.corner]+'.':'Valitse kortti, valitse kohdelinja ja pelaa.';
  $('resolve').hidden=!!s.winner||s.phase!=='battle';$('resolve').textContent='Aloita taistelu';
  $('ai-response').hidden=!!s.winner||s.role!=='attack'||!['defend','aim'].includes(s.phase);
  $('confirm-defense').hidden=!!s.winner||s.role!=='defend'||s.phase!=='aim';
  if(s.phase==='aim'&&s.role==='defend')$('help').textContent='Valitse torjuntakohteet ja vahvista puolustusvuoro. Ilman kohdetta torni ei ammu.';
  $('result').hidden=!s.winner;$('result').textContent=s.winner?(s.winner===s.role?'Voitit! ':'Hävisit. ')+(s.winner==='attack'?'Linnan puolustus murtui.':'Linna kesti piirityksen.') :'';
  const list=$('log');list.replaceChildren();s.logs.slice(0,12).forEach(message=>{const li=document.createElement('li');li.textContent=message;list.appendChild(li);});
  const onLine=s.troops.filter(t=>t.side===target.side&&t.lane===target.lane);$('troops').textContent=onLine.length?'Tämän linjan joukot: '+onLine.map(t=>E.cards[t.type].name+' '+t.hp+' HP ('+(t.pos===3?'muurilla':t.crossed&&t.pos===2?'ylittää vallihautaa': 'etäisyys '+(3-t.pos))+')').join(' · '):'Valitulla linjalla ei ole joukkoja.';
  map();defenseUI();
 }
})();
