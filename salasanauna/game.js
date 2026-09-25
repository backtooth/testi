(() => {
  'use strict';
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const $ = s => document.querySelector(s);
  const W = 960, H = 640, duration = 60, margin = 2;
  const shop = {x:390,y:245,w:180,h:150};
  const houses = [
    {x:74,y:58,w:126,h:92,n:'Frank',at:'Frankilla'}, {x:300,y:42,w:126,h:92,n:'Jouko&Sami',at:'Joukolla & Samilla'}, {x:756,y:62,w:126,h:92,n:'Antti',at:'Antilla'},
    {x:66,y:274,w:126,h:92,n:'Nico',at:'Nicolla'}, {x:768,y:274,w:126,h:92,n:'Atte',at:'Atella'},
    {x:70,y:494,w:126,h:92,n:'Tomppa',at:'Tompalla'}, {x:304,y:500,w:126,h:92,n:'Jere',at:'Jerellä'}, {x:756,y:492,w:126,h:92,n:'Jamppa',at:'Jampalla'}
  ];
  const keys = {}, player={x:480,y:420,r:11,speed:178};
  let running=false, ended=false, startTime=0, elapsed=0, target=-1, previousTarget=-1, last=0, score=0, bankRemainder=0, visited=new Set(), toastTimer=0, audio=null;

  function reset(){
    running=false; ended=false; elapsed=0; score=0; bankRemainder=0; visited=new Set();
    do { target=Math.floor(Math.random()*houses.length); } while(target===previousTarget);
    previousTarget=target; player.x=480; player.y=420;
    $('#score').textContent='0'; $('#clock').textContent='17:59:00'; draw();
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
    const wrong=houses.map((_,i)=>i).filter(i=>i!==target);
    const start=(target+visited.size*2)%wrong.length;
    const a=houses[wrong[start]], b=houses[wrong[(start+1)%wrong.length]];
    const jokes=[
      (x,y)=>`${x.n} lämmittää kotonaan mikroa kiukaan sijasta. ${y.n} taas istuu omassa suihkussaan uimalasit päässä ja odottaa löylyä.`,
      (x,y)=>`${x.n} ilmoitti oman löylykauhansa kadonneeksi, vaikka se oli hänen kädessään. ${y.n} etsii kotonaan kiuasta jääkaapista.`,
      (x,y)=>`${x.n} joi kotinsa saunakaljat jo eteisessä ja julisti tiistain alkaneeksi. ${y.n} yrittää avata omalla pihallaan kuudetta kaljaa otsallaan.`,
      (x,y)=>`${x.n} väittää oman vessansa olevan savusauna, koska siellä näkyy huonosti. ${y.n} puhuttelee kotonaan leivänpaahdinta saunatontuksi.`,
      (x,y)=>`${x.n} kadotti omassa kodissaan sekä kiukaan että housut. ${y.n} löysi kotoaan vain lämpimän ämpärin ja kylmän makkaran.`,
      (x,y)=>`${x.n} yritti sytyttää kotonaan kertakäyttögrillin suihkussa. ${y.n} lämmittää omaa kylpyhuonettaan föönillä ja kutsuu sitä puukiukaaksi.`,
      (x,y)=>`${x.n} kuulee kotonaan sihinää vain kaljatölkistä. ${y.n} näkee omalla pihallaan kaksi kuuta eikä kumpikaan lämmitä saunaa.`
    ];
    const joke=jokes[(visited.size+target)%jokes.length](a,b);
    return {text:`Salasauna ei ainakaan ole tänään ${a.at} tai ${b.at}. ${joke}`};
  }
  function knock(){
    if(!running||ended)return; const i=currentHouse();
    if(i<0){showToast(nearRect(shop,28)?'Kauppias: ”Palaa tänne vihjeiden jälkeen hamstraamaan kaljoja.”':'Mene lähemmäs talon ovea.');return;}
    if(visited.has(i)){showToast(`${houses[i].n}: ”Sanoin jo kaiken. Tai ainakin kaiken hyödyllisen.”`);return;}
    visited.add(i); const hint=directionHint(); beep(620,.06); setTimeout(()=>beep(820,.07),70);
    const speakers=['Naapurin Reino','Marjatta verhon takaa','Epäilyttävän iloinen isäntä','Pyyhe päässä seisova vieras','Pihagrillin vartija'];
    const line=`${speakers[i%speakers.length]}: ”${hint.text}”`;
    showToast(line,6000);
  }
  function enter(){
    if(!running||ended)return; const i=currentHouse(); if(i<0){showToast('Mene aivan talon oven eteen.');return;}
    const delta=elapsed-duration;
    if(i!==target) return finish(false,'VÄÄRÄ OVI',`${houses[i].at} oli vain kiusallinen perheillallinen. Oikea sauna oli ${houses[target].at}.`,'🚪');
    if(Math.abs(delta)<=margin) return finish(true,'TÄYDELLINEN AJOITUS',`Saavuit ${formatDelta(delta)}. Kiuas oli kuumana ja paikka oli oikea.`,'♨️');
    if(delta<0) return finish(false,'LIIAN AIKAISIN',`Saavuit ${formatDelta(delta)}. Isäntä ei ollut vielä ehtinyt piilottaa tavallista saunaa salasaunaksi.`,'⏱️');
    finish(false,'MYÖHÄSTYIT',`Saavuit ${formatDelta(delta)}. Löylyt menivät jo, ja viimeinen makkara myös.`,'🌭');
  }
  function formatDelta(d){if(Math.abs(d)<.05)return 'täsmälleen klo 18.00';return `${Math.abs(d).toFixed(1)} sekuntia ${d<0?'etuajassa':'myöhässä'}`;}
  function finish(win,title,text,icon){
    ended=true;running=false; $('#resultIcon').textContent=icon;$('#resultLabel').textContent=win?'SALASAUNA LÖYTYI':'PERJANTAI PERUTTU';$('#resultTitle').textContent=title;$('#resultText').textContent=text;$('#finalScore').textContent=win?`🍺 ${score} KALJAA`:`KERÄSIT ${score} KALJAA`;
    $('#result').classList.add('open');beep(win?523:120,.2,win?'square':'sawtooth');if(win){setTimeout(()=>beep(659,.2),130);setTimeout(()=>beep(784,.3),260);}
  }
  function update(dt){
    elapsed=(performance.now()-startTime)/1000; if(elapsed>duration+margin&&!ended)return finish(false,'MYÖHÄSTYIT','Kello löi jo yli sallitun marginaalin. Oikea sauna ehti jäähtyä.','🌙');
    let dx=(keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),dy=(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0);
    if(dx||dy){const l=Math.hypot(dx,dy);move(dx/l*player.speed*dt,dy/l*player.speed*dt);}
    if(nearRect(shop,24)&&visited.size>0){bankRemainder+=dt;while(bankRemainder>=1){bankRemainder--;score++;$('#score').textContent=score;beep(310,.025);}}
    const total=Math.min(duration+margin,elapsed), sec=Math.floor(total), absolute=17*3600+59*60+sec;
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
    building(shop,'#c35835','#e7dcae');ctx.fillStyle='#171c18';ctx.font='700 20px Oswald';ctx.textAlign='center';ctx.fillText('KAUPPA',480,292);ctx.font='11px DM Mono';ctx.fillText('KALJAT +1 / SEKUNTI',480,314);door(468,363,'#294b3b');
    houses.forEach((h,i)=>{building(h,['#d49a57','#8f6670','#6d8c75','#c07b57'][i%4],'#e9dfc4');ctx.fillStyle='#172019';ctx.font=`700 ${h.n.length>8?17:20}px Oswald`;ctx.textAlign='center';ctx.fillText(h.n.toUpperCase(),h.x+h.w/2,h.y+34);door(h.x+h.w/2-11,h.y+h.h-28,'#382a20');if(visited.has(i)){ctx.fillStyle='#d9ef74';ctx.beginPath();ctx.arc(h.x+h.w-11,h.y+11,7,0,7);ctx.fill();}});
    // player shadow/body
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(player.x,player.y+10,13,6,0,0,7);ctx.fill();ctx.fillStyle='#f16e3a';ctx.beginPath();ctx.arc(player.x,player.y,11,0,7);ctx.fill();ctx.fillStyle='#f1ead8';ctx.fillRect(player.x-5,player.y-7,10,7);ctx.fillStyle='#161b17';ctx.fillRect(player.x-6,player.y-11,12,4);
    // interaction prompt
    const i=currentHouse();if(i>=0){ctx.fillStyle='#101510e8';ctx.fillRect(player.x-64,player.y-48,128,27);ctx.fillStyle='#f1ead8';ctx.font='10px DM Mono';ctx.textAlign='center';ctx.fillText('Q KOPUTA  •  E SISÄÄN',player.x,player.y-31);}
    else if(nearRect(shop,24)&&visited.size){ctx.fillStyle='#d9ef74';ctx.font='600 13px DM Mono';ctx.textAlign='center';ctx.fillText('🍺 KALJOJA KERTYY',480,422);}
  }
  function building(r,wall,roof){ctx.fillStyle='#0004';ctx.fillRect(r.x+7,r.y+8,r.w,r.h);ctx.fillStyle=wall;ctx.fillRect(r.x,r.y+16,r.w,r.h-16);ctx.fillStyle=roof;ctx.beginPath();ctx.moveTo(r.x-8,r.y+19);ctx.lineTo(r.x+r.w/2,r.y-9);ctx.lineTo(r.x+r.w+8,r.y+19);ctx.closePath();ctx.fill();ctx.strokeStyle='#262c27';ctx.lineWidth=3;ctx.stroke();}
  function door(x,y,c){ctx.fillStyle=c;ctx.fillRect(x,y,22,28);ctx.fillStyle='#dbc566';ctx.fillRect(x+16,y+14,3,3);}
  function loop(now){if(!running)return;const dt=Math.min(.04,(now-last)/1000);last=now;update(dt);draw();if(running)requestAnimationFrame(loop);}
  addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key.toLowerCase()==='q')knock();if(e.key.toLowerCase()==='e')enter();});addEventListener('keyup',e=>keys[e.key]=false);
  document.querySelectorAll('[data-key]').forEach(b=>{const k=b.dataset.key;for(const ev of ['pointerdown','pointerenter'])b.addEventListener(ev,e=>{if(ev==='pointerdown'||e.buttons)keys[k]=true});for(const ev of ['pointerup','pointerleave','pointercancel'])b.addEventListener(ev,()=>keys[k]=false);});
  $('[data-action="knock"]').addEventListener('click',knock);$('[data-action="enter"]').addEventListener('click',enter);
  $('#startBtn').addEventListener('click',start);$('#againBtn').addEventListener('click',start);reset();
})();
