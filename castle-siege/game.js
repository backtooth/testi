(() => {
 'use strict';
 const E=window.Siege,$=id=>document.getElementById(id);
 let s=null,selected=0,target={side:'S',lane:3,corner:0};
 function start(role){s=E.create(role);selected=0;target={side:'S',lane:3,corner:0};$('start').hidden=true;$('game').hidden=false;if(role==='defend')E.ai(s,'attack');render();}
 document.querySelectorAll('[data-role]').forEach(b=>b.onclick=()=>start(b.dataset.role));
 $('new-game').onclick=()=>{if(s&&!s.winner&&!confirm('Keskeytetäänkö nykyinen piiritys?'))return;s=null;$('game').hidden=true;$('start').hidden=false;};
 ['side','lane','corner'].forEach(id=>$(id).onchange=()=>{target[id]=id==='side'?$(id).value:Number($(id).value);render();});
 function use(fallback=false){if(!E.play(s,s.role,selected,target,fallback))return;selected=0;if(s.role==='attack')E.ai(s,'defend');render();}
 $('play').onclick=()=>use();$('fallback').onclick=()=>use(true);
 $('resolve').onclick=()=>{E.battle(s);if(!s.winner&&s.phase==='attack'&&s.role==='defend')E.ai(s,'attack');selected=0;render();};
 function laneAt(x,y){if(y<=1&&x>=2&&x<=6)return {side:'N',lane:x-1};if(y>=7&&x>=2&&x<=6)return {side:'S',lane:x-1};if(x<=1&&y>=2&&y<=6)return {side:'W',lane:y-1};if(x>=7&&y>=2&&y<=6)return {side:'E',lane:y-1};return null;}
 function map(){const board=$('board');board.replaceChildren();for(let y=0;y<9;y++)for(let x=0;x<9;x++){
   let lane=laneAt(x,y),id=null;const castle=x>=2&&x<=6&&y>=2&&y<=6,edge=castle&&(x===2||x===6||y===2||y===6);
   if(edge){id=(y-2)*5+x-2;lane=y===2?{side:'N',lane:x-1}:y===6?{side:'S',lane:x-1}:x===2?{side:'W',lane:y-1}:{side:'E',lane:y-1};}
   const cell=document.createElement(lane?'button':'div');if(lane)cell.type='button';cell.className='cell';
   if(edge){const wall=s.walls[id],tower=Object.hasOwn(s.towers,id);cell.classList.add('wall');if(id===22)cell.classList.add('gate');if(wall.hp<wall.max)cell.classList.add('damaged');const sym=document.createElement('span');sym.textContent=tower?'♜':id===22?'▥':'▤';const hp=document.createElement('small');hp.textContent=wall.hp+'/'+wall.max;cell.append(sym,hp);cell.setAttribute('aria-label',(tower?'Kulmatorni, ':id===22?'Portti, ':'Muuri, ')+E.sideNames[lane.side]+' '+lane.lane+', kestävyys '+wall.hp+'/'+wall.max+(tower?', tornin vahinko '+s.towers[id]:''));}
   else if(castle){cell.classList.add('court');if(x===4&&y===4)cell.textContent='⚑';}
   else if(lane){cell.classList.add('path');const outer=x===0||x===8||y===0||y===8;cell.textContent=outer?({N:'↓',E:'←',S:'↑',W:'→'}[lane.side]+lane.lane):'·';if(outer)cell.classList.add('arrow');if(!outer&&s.moats.includes(E.laneKey(lane.side,lane.lane))){cell.classList.add('moat');cell.textContent='≈';}cell.setAttribute('aria-label',E.sideNames[lane.side]+' linja '+lane.lane);}
   else cell.classList.add('empty');
   if(lane){const chosen=edge?E.tile(target.side,target.lane)===id:target.side===lane.side&&target.lane===lane.lane;if(chosen)cell.classList.add('chosen');cell.onclick=()=>{target={...target,...lane};if(id!==null&&Object.hasOwn(s.towers,id))target.corner=id;render();};const troops=s.troops.filter(t=>edge?E.tile(t.side,t.lane)===id&&t.pos===3:t.side===lane.side&&t.lane===lane.lane&&((x===0||x===8||y===0||y===8)?t.pos===0:t.pos===1||t.pos===2));if(troops.length){cell.classList.add('has-troops');cell.dataset.count=troops.length;cell.setAttribute('aria-label',cell.getAttribute('aria-label')+', joukkoja '+troops.length);}}
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
  $('phase').textContent=s.winner?'PIIRITYS PÄÄTTYI':s.phase==='cleanup'?'KORTIT KÄYTETTY · JOUKOT TAISTELEVAT':active?'VALITSE KORTTI JA KOHDE':'MOLEMMAT KORTIT PELATTU';
  const hand=$('hand');hand.replaceChildren();s.hands[s.role].forEach((key,i)=>{const b=document.createElement('button');b.className='card'+(i===selected?' selected':'');b.type='button';b.disabled=!active;b.setAttribute('aria-pressed',String(i===selected));const strong=document.createElement('strong');strong.textContent=E.cards[key].name;const small=document.createElement('small');small.textContent=E.cards[key].text;b.append(strong,small);b.onclick=()=>{selected=i;render();};hand.appendChild(b);});
  $('corner-wrap').hidden=!(active&&card==='upgrade');$('play').hidden=!active;$('play').disabled=!card||!E.valid(s,card,target);$('fallback').hidden=!(active&&s.role==='defend');
  $('help').textContent=!active?'':card==='moat'&&!E.valid(s,card,target)?'Valitse linja ilman vallihautaa. Portin kulkutie on jätettävä avoimeksi.':card==='upgrade'?'Valitse parannettava kulmatorni kentältä tai valikosta. Nykyinen vahinko: '+s.towers[target.corner]+'.':'Valitse kortti, valitse kohdelinja ja pelaa.';
  $('resolve').hidden=s.winner||!['battle','cleanup'].includes(s.phase);$('resolve').textContent=s.phase==='cleanup'?'Jatka joukkojen taistelua':'Ratkaise taisteluvaihe';
  $('result').hidden=!s.winner;$('result').textContent=s.winner?(s.winner===s.role?'Voitit! ':'Hävisit. ')+(s.winner==='attack'?'Linnan puolustus murtui.':'Linna kesti piirityksen.') :'';
  const list=$('log');list.replaceChildren();s.logs.slice(0,12).forEach(message=>{const li=document.createElement('li');li.textContent=message;list.appendChild(li);});
  const onLine=s.troops.filter(t=>t.side===target.side&&t.lane===target.lane);$('troops').textContent=onLine.length?'Tämän linjan joukot: '+onLine.map(t=>E.cards[t.type].name+' '+t.hp+' HP ('+(t.pos===3?'muurilla':t.crossed&&t.pos===2?'ylittää vallihautaa': 'etäisyys '+(3-t.pos))+')').join(' · '):'Valitulla linjalla ei ole joukkoja.';
  map();
 }
})();
