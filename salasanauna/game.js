(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const $ = s => document.querySelector(s);
  const W = 960, H = 640, duration = 120, margin = 2;
  const shop = {x:390,y:245,w:180,h:150};
  const houses = [
    {x:74,y:58,w:126,h:92,n:'Koivula'}, {x:300,y:42,w:126,h:92,n:'Mäkelä'}, {x:756,y:62,w:126,h:92,n:'Rantala'},
    {x:66,y:274,w:126,h:92,n:'Kuusela'}, {x:768,y:274,w:126,h:92,n:'Virtala'},
    {x:70,y:494,w:126,h:92,n:'Kivistö'}, {x:304,y:500,w:126,h:92,n:'Peltola'}, {x:756,y:492,w:126,h:92,n:'Harjula'}
  ];
  const keys = {}, player={x:480,y:420,r:11,speed:178};
  let running=false, ended=false, startTime=0, elapsed=0, target=0, last=0, score=0, bankRemainder=0, visited=new Set(), toastTimer=0, audio=null;
  let constraints=[];

  function reset(){
    running=false; ended=false; elapsed=0; score=0; bankRemainder=0; visited=new Set(); constraints=[];
    target=Math.floor(Math.random()*houses.length); player.x=480; player.y=420;
    $('#score').textContent='0'; $('#clock').textContent='17:58:00'; $('#clueCount').textContent='0/8';
    $('#clueList').innerHTML='<p>Ei vihjeitä. Koputa talon ovella.</p>'; draw();
  }
  function start(){
    reset(); running=true; startTime=performance.now(); last=startTime; $('#modal').classList.remove('open'); $('#result').classList.remove('open');
    audio = audio || new (window.AudioContext||window.webkitAudioContext)(); beep(220,.07); requestAnimationFrame(loop);
    showToast('Kello käy! Etsi sauna, mutta älä astu sisään ennen kuutta.');
  }
  function beep(freq=440,len=.08,type='square'){
    if(!audio)return; const o=audio.createOscillator(),g=audio.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+len);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+len);
  }
  function showToast(text, ms=3400){ const t=$('#toast');t.textContent=text;t.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add('hidden'),ms); }
  function nearRect(r,range=30){const cx=Math.max(r.x,Math.min(player.x,r.x+r.w)),cy=Math.max(r.y,Math.min(player.y,r.y+r.h));return Math.hypot(player.x-cx,player.y-cy)<range;}
  function currentHouse(){return houses.findIndex(h=>nearRect(h,35));}
  function directionHint(){
    const t=houses[target], tc={x:t.x+t.w/2,y:t.y+t.h/2};
    const choices=[];
    if(tc.x<430) choices.push({text:'Saunatalo on kaupan länsipuolella.',ok:i=>houses[i].x+houses[i].w/2<430});
    else if(tc.x>530) choices.push({text:'Saunatalo on kaupan itäpuolella.',ok:i=>houses[i].x+houses[i].w/2>530});
    else choices.push({text:'Saunatalo on pohjois–etelä-keskilinjalla.',ok:i=>{let x=houses[i].x+houses[i].w/2;return x>=430&&x<=530}});
    if(tc.y<215) choices.push({text:'Löylyt ovat kartan pohjoisreunalla.',ok:i=>houses[i].y<200});
    else if(tc.y>430) choices.push({text:'Löylyt ovat kartan eteläreunalla.',ok:i=>houses[i].y>430});
    else choices.push({text:'Sauna on samalla korkeudella kuin kauppa.',ok:i=>houses[i].y>200&&houses[i].y<430});
    const parity=target%2; choices.push({text:`Nimikyltin kirjainten määrä on ${houses[target].n.length%2?'pariton':'parillinen'}.`,ok:i=>houses[i].n.length%2===houses[target].n.length%2});
    choices.push({text:`Saunatalon nimi alkaa kirjaimella, joka on aakkosissa ${houses[target].n[0]<'P'?'ennen P:tä':'P:n kohdalla tai sen jälkeen'}.`,ok:i=>(houses[i].n[0]<'P')===(houses[target].n[0]<'P')});
    choices.push({text:`Sauna ei ole ${houses.filter((_,i)=>i!==target)[(target+visited.size*3)%7].n}ssa.`,ok:i=>i!==houses.findIndex(h=>h.n===houses.filter((_,j)=>j!==target)[(target+visited.size*3)%7].n)});
    return choices[visited.size%choices.length];
  }
  function knock(){
    if(!running||ended)return; const i=currentHouse();
    if(i<0){showToast(nearRect(shop,28)?'Kauppias: ”Palaa tänne vihjeiden jälkeen hamstraamaan pulloja.”':'Mene lähemmäs talon ovea.');return;}
    if(visited.has(i)){showToast(`${houses[i].n}: ”Sanoin jo kaiken. Tai ainakin kaiken hyödyllisen.”`);return;}
    visited.add(i); const hint=directionHint(); constraints.push(hint); beep(620,.06); setTimeout(()=>beep(820,.07),70);
    const speakers=['Naapurin Reino','Marjatta verhon takaa','Epäilyttävän iloinen isäntä','Pyyhe päässä seisova vieras','Pihagrillin vartija'];
    const line=`${speakers[i%speakers.length]}: ”${hint.text}”`;
    showToast(line,5000); updateClues(line);
  }
  function updateClues(line){
    const list=$('#clueList'); if(visited.size===1)list.innerHTML=''; const p=document.createElement('p');p.textContent=line;list.prepend(p);$('#clueCount').textContent=`${visited.size}/8`;
  }
  function enter(){
    if(!running||ended)return; const i=currentHouse(); if(i<0){showToast('Mene aivan talon oven eteen.');return;}
    const delta=elapsed-duration;
    if(i!==target) return finish(false,'VÄÄRÄ OVI',`${houses[i].n}ssa oli vain kiusallinen perheillallinen. Oikea sauna oli ${houses[target].n}ssa.`,'🚪');
    if(Math.abs(delta)<=margin) return finish(true,'TÄYDELLINEN AJOITUS',`Saavuit ${formatDelta(delta)}. Kiuas oli kuumana ja paikka oli oikea.`,'♨️');
    if(delta<0) return finish(false,'LIIAN AIKAISIN',`Saavuit ${formatDelta(delta)}. Isäntä ei ollut vielä ehtinyt piilottaa tavallista saunaa salasaunaksi.`,'⏱️');
    finish(false,'MYÖHÄSTYIT',`Saavuit ${formatDelta(delta)}. Löylyt menivät jo, ja viimeinen makkara myös.`,'🌭');
  }
  function formatDelta(d){if(Math.abs(d)<.05)return 'täsmälleen klo 18.00';return `${Math.abs(d).toFixed(1)} sekuntia ${d<0?'etuajassa':'myöhässä'}`;}
  function finish(win,title,text,icon){
    ended=true;running=false; $('#resultIcon').textContent=icon;$('#resultLabel').textContent=win?'SALASAUNA LÖYTYI':'PERJANTAI PERUTTU';$('#resultTitle').textContent=title;$('#resultText').textContent=text;$('#finalScore').textContent=win?`🍺 ${score} PULLOA`:`KERÄSIT ${score} PULLOA`;
    $('#result').classList.add('open');beep(win?523:120,.2,win?'square':'sawtooth');if(win){setTimeout(()=>beep(659,.2),130);setTimeout(()=>beep(784,.3),260);}
  }
  function update(dt){
    elapsed=(performance.now()-startTime)/1000; if(elapsed>duration+margin&&!ended)return finish(false,'MYÖHÄSTYIT','Kello löi jo yli sallitun marginaalin. Oikea sauna ehti jäähtyä.','🌙');
    let dx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),dy=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
    if(dx||dy){const l=Math.hypot(dx,dy);move(dx/l*player.speed*dt,dy/l*player.speed*dt);}
    if(nearRect(shop,24)&&visited.size>0){bankRemainder+=dt;while(bankRemainder>=1){bankRemainder--;score++;$('#score').textContent=score;beep(310,.025);}}
    const total=Math.min(120+margin,elapsed), sec=Math.floor(total), absolute=17*3600+58*60+sec;
    const hh=Math.floor(absolute/3600),mm=Math.floor((absolute%3600)/60),ss=absolute%60;
    $('#clock').textContent=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }
  function move(dx,dy){
    const nx=Math.max(15,Math.min(W-15,player.x+dx)),ny=Math.max(15,Math.min(H-15,player.y+dy));
    const blocks=[shop,...houses]; const collide=(x,y,r)=>x>r.x-12&&x<r.x+r.w+12&&y>r.y-12&&y<r.y+r.h+12;
    if(!blocks.some(r=>collide(nx,player.y,r)))player.x=nx;if(!blocks.some(r=>collide(player.x,ny,r)))player.y=ny;
  }
  function draw(){
    ctx.fillStyle='#263c2e';ctx.fillRect(0,0,W,H);
    // paths
    ctx.fillStyle='#b7a982';ctx.fillRect(0,210,W,56);ctx.fillRect(0,410,W,50);ctx.fillRect(445,0,70,H);
    ctx.globalAlpha=.18;ctx.fillStyle='#161d18';for(let x=0;x<W;x+=34)for(let y=0;y<H;y+=30){ctx.beginPath();ctx.arc(x+(y%60),y,2,0,7);ctx.fill();}ctx.globalAlpha=1;
    // shop
    building(shop,'#c35835','#e7dcae');ctx.fillStyle='#171c18';ctx.font='700 20px Oswald';ctx.textAlign='center';ctx.fillText('KAUPPA',480,292);ctx.font='11px DM Mono';ctx.fillText('PULLOT +1 / SEKUNTI',480,314);door(468,363,'#294b3b');
    houses.forEach((h,i)=>{building(h,['#d49a57','#8f6670','#6d8c75','#c07b57'][i%4],'#e9dfc4');ctx.fillStyle='#172019';ctx.font='600 15px Oswald';ctx.textAlign='center';ctx.fillText(h.n.toUpperCase(),h.x+h.w/2,h.y+31);door(h.x+h.w/2-11,h.y+h.h-28,'#382a20');if(visited.has(i)){ctx.fillStyle='#d9ef74';ctx.beginPath();ctx.arc(h.x+h.w-11,h.y+11,7,0,7);ctx.fill();}});
    // player shadow/body
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(player.x,player.y+10,13,6,0,0,7);ctx.fill();ctx.fillStyle='#f16e3a';ctx.beginPath();ctx.arc(player.x,player.y,11,0,7);ctx.fill();ctx.fillStyle='#f1ead8';ctx.fillRect(player.x-5,player.y-7,10,7);ctx.fillStyle='#161b17';ctx.fillRect(player.x-6,player.y-11,12,4);
    // interaction prompt
    const i=currentHouse();if(i>=0){ctx.fillStyle='#101510e8';ctx.fillRect(player.x-64,player.y-48,128,27);ctx.fillStyle='#f1ead8';ctx.font='10px DM Mono';ctx.textAlign='center';ctx.fillText('Q KOPUTA  •  E SISÄÄN',player.x,player.y-31);}
    else if(nearRect(shop,24)&&visited.size){ctx.fillStyle='#d9ef74';ctx.font='600 13px DM Mono';ctx.textAlign='center';ctx.fillText('🍺 PULLOJA KERTYY',480,422);}
  }
  function building(r,wall,roof){ctx.fillStyle='#0004';ctx.fillRect(r.x+7,r.y+8,r.w,r.h);ctx.fillStyle=wall;ctx.fillRect(r.x,r.y+16,r.w,r.h-16);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(r.x-8,r.y+19);ctx.lineTo(r.x+r.w/2,r.y-9);ctx.lineTo(r.x+r.w+8,r.y+19);ctx.closePath();ctx.fill();ctx.strokeStyle='#262c27';ctx.lineWidth=3;ctx.stroke();}
  function door(x,y,c){ctx.fillStyle=c;ctx.fillRect(x,y,22,28);ctx.fillStyle='#dbc566';ctx.fillRect(x+16,y+14,3,3);}
  function loop(now){if(!running)return;const dt=Math.min(.04,(now-last)/1000);last=now;update(dt);draw();if(running)requestAnimationFrame(loop);}
  addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='q')knock();if(e.key.toLowerCase()==='e')enter();});addEventListener('keyup',e=>keys[e.key]=false);
  document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;for(const ev of ['pointerdown','pointerenter'])b.addEventListener(ev,e=>{if(ev==='pointerdown'||e.buttons)keys[k]=true});for(const ev of ['pointerup','pointerleave','pointercancel'])b.addEventListener(ev,()=>keys[k]=false);});
  $('[data-action="knock"]').addEventListener('click',knock);$('[data-action="enter"]').addEventListener('click',enter);
  $('#notebookToggle').addEventListener('click',()=>{const n=$('#notebook'),open=n.classList.toggle('open');$('#notebookToggle').setAttribute('aria-expanded',open)});
  $('#startBtn').addEventListener('click',start);$('#againBtn').addEventListener('click',start);reset();
})();
