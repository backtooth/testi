(function(){
'use strict';
const P={grass:'#476b3a',grassLight:'#628947',grassDark:'#34532e',water:'#28658c',wave:'#69b5c2',stone:'#9ca5a0',stoneLight:'#d5d5b6',stoneDark:'#515e65',outline:'#202b35',wood:'#8b583e',gold:'#efc478',red:'#d87565'};
const E=window.Siege;
function unitPos(t){const v=t.lane+2;return t.side==='N'?{x:v,y:t.pos}:t.side==='S'?{x:v,y:10-t.pos}:t.side==='W'?{x:t.pos,y:v}:{x:10-t.pos,y:v};}
function info(s,x,y){
 const castle=x>=3&&x<=7&&y>=3&&y<=7,edge=castle&&(x===3||x===7||y===3||y===7);let side=null,lane=null,depth=null;
 if(y<3&&x>=3&&x<=7){side='N';lane=x-2;depth=y;}else if(y>7&&x>=3&&x<=7){side='S';lane=x-2;depth=10-y;}else if(x<3&&y>=3&&y<=7){side='W';lane=y-2;depth=x;}else if(x>7&&y>=3&&y<=7){side='E';lane=y-2;depth=10-x;}
 const id=edge?(y-3)*5+x-3:null;let kind=castle?'court':'grass';
 if(edge)kind=Object.hasOwn(E.towerNames,id)?(s.walls[id].hp?'tower':'ruin'):id===22?'gate':'wall';
 else if(side){const key=side+lane;kind=(depth===2&&s.moats.includes(key))||(depth===1&&s.widened.includes(key))?'chasm':'road';if((s.water||[]).includes(E.cellKey(side,lane,depth)))kind='water';}
 else if((x===2||x===8)&&(y===2||y===8))kind='chasm';
 return {x,y,id,kind,side,lane,depth,oil:(s.oilWater||[]).includes(E.cellKey(side,lane,depth)),fire:(s.burningTiles||[]).includes(E.cellKey(side,lane,depth)),troops:s.troops.filter(t=>{const p=unitPos(t);return p.x===x&&p.y===y;})};
}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
function flame(c,x,y){rect(c,'#c43d30',x,y+5,9,10);rect(c,'#ec7135',x+2,y+2,5,11);rect(c,'#ec7135',x+6,y,2,10);rect(c,'#ffdb71',x+3,y+7,3,7);}
function soldier(c,type,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);rect(c,'#263332',1,13,14,3);
 if(type==='ram'){rect(c,P.outline,0,7,18,6);rect(c,P.wood,1,6,17,5);rect(c,'#bb8d53',2,6,15,2);rect(c,P.stone,15,5,5,7);rect(c,P.outline,2,12,4,4);rect(c,P.outline,12,12,4,4);rect(c,P.gold,3,13,2,2);rect(c,P.gold,13,13,2,2);rect(c,'#c5b28a',4,1,2,6);rect(c,'#c5b28a',12,1,2,6);rect(c,P.red,4,0,10,2);}
 else{const cloth=type==='shield'?'#668fc0':type==='scout'?'#d69c53':'#bb6262';rect(c,P.outline,4,1,7,6);rect(c,'#d5bea0',5,3,5,4);rect(c,P.stoneLight,3,0,9,3);rect(c,P.stone,4,2,8,2);rect(c,P.outline,9,4,2,1);rect(c,cloth,3,7,10,6);rect(c,'#edd59d',2,7,2,5);rect(c,P.outline,4,13,3,4);rect(c,P.outline,10,13,3,4);rect(c,P.gold,3,11,10,2);if(type==='shield'){rect(c,P.outline,0,8,7,8);rect(c,'#608bba',1,8,5,6);rect(c,P.gold,3,8,1,6);}else{rect(c,P.stoneLight,15,0,1,12);rect(c,P.gold,13,9,5,1);}}
 c.restore();}
function unitSprite(c,t,x,y,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);soldier(c,t.type,0,0);if(t.oily){rect(c,'#110e20',4,3,7,3);rect(c,'#110e20',3,8,10,4);rect(c,'#110e20',5,12,3,4);rect(c,'#a497bd',4,8,7,1);rect(c,'#a497bd',5,3,3,1);rect(c,'#110e20',16,13,3,4);rect(c,'#c1afd6',17,13,1,1);}if(t.burning){c.save();c.translate(-2,4);c.scale(.65,.8);flame(c,0,0);flame(c,23,-4);c.restore();}c.restore();}
function tile(c,s,x,y,size=32,units=true){const f=info(s,x,y);c.save();c.scale(size/32,size/32);rect(c,P.grass,0,0,32,32);for(let i=0;i<14;i++){const a=(x*7+y*13+i*11)%30,b=(x*19+y*3+i*7)%30;rect(c,i%2?P.grassLight:P.grassDark,a,b,2,1);}
 if(f.kind==='road'){rect(c,'#87764e',5,0,22,32);for(let i=0;i<8;i++)rect(c,'#a08e60',(i*7+x)%20+6,(i*11+y)%30,3,1);}
 if(f.kind==='court'){rect(c,'#52674e',0,0,32,32);for(let a=0;a<32;a+=8)for(let b=0;b<32;b+=8){rect(c,'#64795e',a+1,b+1,6,6);rect(c,'#43533e',a,b,1,8);}}
 if(f.kind==='chasm'){rect(c,'#493f42',0,0,32,32);rect(c,'#85725a',0,0,32,3);rect(c,'#282834',3,3,26,26);rect(c,'#111c2d',7,7,18,25);for(let i=0;i<4;i++)rect(c,'#655744',i*7,3+i*4,4,3);}
 if(f.kind==='water'){rect(c,P.water,0,0,32,32);rect(c,'#173f66',0,0,32,3);for(let i=0;i<6;i++){rect(c,P.wave,(i*7+x*3)%25,(i*9+y*2)%28+3,6,1);rect(c,'#3b829e',(i*11)%25,(i*5)%29,4,2);}}
 if(f.oil){rect(c,'#11131e',0,3,32,29);for(let i=0;i<5;i++)rect(c,'#555064',i*6,6+i*5,7,1);}
 if(['wall','tower','gate'].includes(f.kind)){rect(c,P.outline,2,6,29,24);rect(c,P.stoneDark,3,4,26,24);rect(c,P.stone,3,3,24,22);for(let row=0;row<4;row++){const yy=5+row*5;rect(c,P.stoneDark,3,yy+4,24,1);for(let xx=3+(row%2)*5;xx<26;xx+=10)rect(c,P.stoneLight,xx,yy,1,4);}for(let a=3;a<27;a+=8){rect(c,P.stoneLight,a,0,5,5);rect(c,P.stoneDark,a+4,1,1,4);}rect(c,P.stoneLight,3,3,24,1);
 if(f.kind==='tower'){rect(c,P.outline,11,9,8,11);rect(c,'#243a45',12,10,5,9);rect(c,P.gold,14,11,1,6);rect(c,'#705446',22,0,1,10);rect(c,P.red,23,0,7,5);}
 if(f.kind==='gate'){rect(c,P.outline,8,11,17,18);rect(c,P.wood,9,12,14,16);for(let a=11;a<23;a+=4)rect(c,'#583b31',a,12,1,16);rect(c,P.gold,9,16,14,2);rect(c,P.gold,9,23,14,2);}
 if(s.walls[f.id].hp<s.walls[f.id].max){rect(c,P.outline,5,12,2,4);rect(c,P.outline,7,15,2,5);rect(c,P.outline,5,19,3,2);}}
 if(f.kind==='ruin'){for(let i=0;i<8;i++)rect(c,i%2?P.stone:P.stoneDark,3+(i*9)%22,12+(i*5)%15,6,4);}
 if(units&&f.troops.length){const shown=f.troops.slice(0,3);shown.forEach((t,i)=>{unitSprite(c,t,3+i*6,8-i*3,.85);if(t.skip){rect(c,'#ffe088',3+i*7,2,5,5);rect(c,'#443828',5+i*7,2,1,3);}});}
 if(f.fire){flame(c,2,13);flame(c,13,7);flame(c,23,13);}
 c.restore();return f;}
function boardTile(s,x,y){const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;canvas.className='pixel-tile';canvas.setAttribute('aria-hidden','true');tile(canvas.getContext('2d'),s,x,y);return canvas;}
const names={grass:'Nurmikenttä',road:'Hyökkäyslinja',chasm:'Kuiva rotko',water:'Vesi',court:'Linnan sisäpiha',wall:'Muuri',tower:'Kulmatorni',gate:'Portti',ruin:'Tornin rauniot'};
function inspect(s,active){const canvas=document.getElementById('tile-scene'),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.clearRect(0,0,288,192);const f=info(s,active.x,active.y);
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=active.x+dx,y=active.y+dy;c.save();c.translate((dx+1)*96,(dy+1)*64);if(x<0||x>10||y<0||y>10){rect(c,'#1c2939',0,0,96,64);}else{c.scale(3,2);tile(c,s,x,y); }c.restore();}
 c.strokeStyle=P.gold;c.lineWidth=2;c.strokeRect(97,65,94,62);c.fillStyle=P.gold;[[96,64],[185,64],[96,121],[185,121]].forEach(([x,y])=>c.fillRect(x,y,7,7));
 const title=document.getElementById('inspect-title');title.textContent='X'+(active.x+1)+', Y'+(active.y+1)+' · '+(f.fire?'Palava öljyvesi':f.oil?'Öljyinen vesi':names[f.kind]);
 canvas.setAttribute('aria-label',title.textContent+'. Keskellä aktiivinen ruutu, ympärillä viereiset ruudut.');
 const content=document.getElementById('inspect-stats');content.replaceChildren();
 function stat(label,value){const div=document.createElement('div');div.className='inspect-stat';const small=document.createElement('span');small.textContent=label;const strong=document.createElement('strong');strong.textContent=value;div.append(small,strong);content.appendChild(div);}
 if(f.id!==null){stat('Kestävyys',s.walls[f.id].hp+' / '+s.walls[f.id].max+' HP');if(f.kind==='tower')stat('Tulivoima',s.towers[f.id]+' / laukaus');if(f.kind==='ruin')stat('Tila','Tuhoutunut');}
 if(f.kind==='chasm')stat('Kuiva rotko','Ei vaikutusta liikkeeseen');
 if(f.fire)stat('Palo','Seuraavan taistelun loppuun');
 if(f.oil&&!f.fire)stat('Öljypinta','Syttyy Tuli-kortilla');
 if(f.kind==='water'){stat('Ylitys','1 odotusvuoro / vesiruutu');if(f.side)stat('Rotkon leveys',s.widened.includes(f.side+f.lane)?'2 ruutua':'1 ruutu');}
 if(f.troops.length){stat('Joukkoja',f.troops.length);stat('Hyökkäysvoima',f.troops.reduce((n,t)=>n+t.damage,0)+' / vuoro');}
 const list=document.getElementById('inspect-units');list.replaceChildren();
 f.troops.forEach(t=>{const row=document.createElement('div');row.className='inspect-unit';const icon=document.createElement('canvas');icon.width=24;icon.height=22;icon.setAttribute('aria-hidden','true');unitSprite(icon.getContext('2d'),t,2,2);const name=document.createElement('strong');name.textContent='#'+t.id+' '+E.cards[t.type].name;const values=document.createElement('span');values.textContent=t.hp+'/'+t.max+' HP · isku '+t.damage+(E.status(t)?' · '+E.status(t):'');const bar=document.createElement('progress');bar.max=t.max;bar.value=t.hp;bar.setAttribute('aria-label','#'+t.id+' kestävyys');const text=document.createElement('div');text.append(name,values,bar);row.append(icon,text);list.appendChild(row);});
 if(!f.troops.length){const p=document.createElement('p');p.className='hint';p.textContent='Ruudussa ei ole hyökkääjiä.';list.appendChild(p);}
 const adjacent=[];for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=active.x+dx,y=active.y+dy;if(x<0||x>10||y<0||y>10)continue;const n=info(s,x,y);if(n.id!==null)adjacent.push(names[n.kind]+' X'+(x+1)+', Y'+(y+1)+' · '+s.walls[n.id].hp+'/'+s.walls[n.id].max+' HP');}
 document.getElementById('inspect-neighbors').textContent=adjacent.length?'Vieressä: '+adjacent.join(' | '):'Lähikuva näyttää myös viereiset ruudut.';
}
function icon(type){const canvas=document.createElement('canvas');canvas.width=32;canvas.height=32;canvas.className='card-sprite';canvas.setAttribute('aria-hidden','true');const c=canvas.getContext('2d');if(E.cards[type]?.hp)soldier(c,type,7,8);else if(type==='fire'){flame(c,5,10);flame(c,16,5);}else if(type==='oil'||type==='water'){rect(c,'#cdbb8d',8,7,16,20);rect(c,type==='oil'?'#171323':P.water,10,9,12,15);rect(c,'#f5db9f',8,5,16,3);rect(c,'#67523d',7,25,18,3);}else{const demo={walls:{0:{hp:16,max:16},1:{hp:16,max:16}},towers:{0:9},troops:[],moats:['N2'],widened:[]};tile(c,demo,type==='upgrade'?3:4,type==='moat'?2:3);}return canvas;}
window.PixelSiege={boardTile,inspect,info,unitPos,icon};
})();
