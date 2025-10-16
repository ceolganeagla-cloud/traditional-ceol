
(function(){
  // Splash
  window.addEventListener('load',()=>{ const s=document.getElementById('splash'); if(s) setTimeout(()=>s.classList.add('hide'),300); });

  // Router
  const pages={search:ge('page-search'),tune:ge('page-tune'),songs:ge('page-songs'),learn:ge('page-learn'),tools:ge('page-tools')};
  const navs={search:ge('nav-search'),tune:ge('nav-tunes'),songs:ge('nav-songs'),learn:ge('nav-learn'),tools:ge('nav-tools')};
  function route(name){ Object.values(pages).forEach(p=>p.classList.add('hidden')); Object.values(navs).forEach(n=>n.removeAttribute('aria-current')); (pages[name]||pages.search).classList.remove('hidden'); (navs[name]||navs.search).setAttribute('aria-current','page'); window.scrollTo({top:0,behavior:'instant'}); }
  function sync(){ route((location.hash||'#search').slice(1)); }
  window.addEventListener('hashchange', sync); sync();
  document.getElementById('yy').textContent=(new Date()).getFullYear();

  // Data & Library
  const LIB_KEY='cge.library.v1';
  function loadLib(){ try{ return JSON.parse(localStorage.getItem(LIB_KEY)||'[]'); }catch(e){ return []; } }
  function saveLib(data){ localStorage.setItem(LIB_KEY, JSON.stringify(data)); document.querySelector('#libSize').textContent=String(data.length); }
  function addTune(obj){ const lib=loadLib(); if(!obj.id) obj.id=slug(obj.title)+'-'+Date.now(); lib.push(obj); saveLib(lib); }
  function slug(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
  document.querySelector('#libSize').textContent=String(loadLib().length);
  if(loadLib().length===0){
    [{title:"Róisín Dubh",type:"Air",level:"Beginner",source:"Traditional",summary:"A haunting slow air, “Dark Rosaleen.”",abc:`X:1
T:Róisín Dubh
R:air
M:3/4
L:1/8
K:Dmix
A2 | d2 c2 A2 | G2 A2 B2 | A2 F2 D2 | E4 A2 | d2 c2 A2 | G2 A2 B2 | A2 F2 D2 | E6 ||`},
    {title:"The Kesh",type:"Jig",level:"General",source:"Traditional",summary:"Session favourite jig in G.",abc:`X:1
T:The Kesh
R:jig
M:6/8
L:1/8
K:G
D|GFG BAB|gfg dBG|GFG BAB|dAG FGD|GFG BAB|gfg dBG|cAF GFE|DG F G3||`},
    {title:"The Silver Spear",type:"Reel",level:"General",source:"Traditional",summary:"A well-known reel.",abc:`X:1
T:The Silver Spear
R:reel
M:4/4
L:1/8
K:D
A2 | d2 AD FA dA | d2 AD FA dA | g2 fg edef | g2 fg edB A | d2 AD FA dA | d2 AD FA dA | g2 fg edef | g2 fg e2 d2 ||`}].forEach(t=>addTune({...t,id:slug(t.title)}));
  }

  const SONGS=[{id:"oro-se-do",title:"Óró Sé Do Bheatha Abhaile",tags:["traditional song","Irish","General"],blurb:"A welcoming song associated with Gráinne Mhaol.",lyrics:`Óró, sé do bheatha ‘bhaile,
Óró, sé do bheatha ‘bhaile,
Óró, sé do bheatha ‘bhaile,
Anois ar theacht an tsamhraidh.`}];

  // Search
  const q=ge('q'); const scopeP=[...qs('#scopePills .pill')]; const kindP=[...qs('#kindPills .pill')];
  let scope='all', kind='All Types';
  scopeP.forEach(b=>b.addEventListener('click',()=>{ scope=b.dataset.scope; setPressed(scopeP,b); render(); }));
  kindP.forEach(b=>b.addEventListener('click',()=>{ kind=b.dataset.kind; setPressed(kindP,b); render(); }));
  q.addEventListener('input', render);

  function render(){
    const term=(q.value||'').toLowerCase(); const list=ge('results'); const lib=loadLib(); let out=[];
    if(scope==='all' || scope==='tunes'){
      out = out.concat(lib.filter(t =>
        (kind==='All Types' || t.type===kind) &&
        (!term || (t.title||'').toLowerCase().includes(term) || (t.summary||'').toLowerCase().includes(term) || (t.type||'').toLowerCase().includes(term))
      ).map(t => ({ kind:'tune', id:t.id, title:t.title, meta:[t.type||'', t.level||'', t.source||''], blurb:t.summary||'' })));
    }
    if(scope==='all' || scope==='songs'){
      out = out.concat(SONGS.filter(s => !term || s.title.toLowerCase().includes(term) || (s.blurb||'').toLowerCase().includes(term))
        .map(s=>({kind:'song', id:s.id, title:s.title, meta:s.tags, blurb:s.blurb})));
    }
    list.innerHTML = out.map(it => `<a class="item" href="#${it.kind==='tune'?'tune':'songs'}" data-kind="${it.kind}" data-id="${it.id}">
      <h3 style="margin:0">${it.title}</h3>
      <div class="badges">${(it.meta||[]).map(m=>`<span class="badge">${m}</span>`).join('')}</div>
      <div style="color:var(--muted)">${it.blurb||''}</div>
    </a>`).join('') || '<div style="padding:14px;color:#6b7d72">No results.</div>';
    [...qs('#results a.item')].forEach(a=>a.addEventListener('click',()=>{
      const k=a.getAttribute('data-kind'), id=a.getAttribute('data-id'); openItem(k,id);
    }));
  }
  render();

  // Tune view
  let visualObj=null, synthControl=null, current=null;
  function openItem(kind,id){
    if(kind==='tune'){
      const t=loadLib().find(x=>x.id===id); if(!t) return;
      current=t; ge('t-title').textContent=t.title; ge('t-badges').innerHTML=`<span class="badge air">${t.type||''}</span><span class="badge">${t.level||''}</span><span class="badge">${t.source||''}</span>`; ge('t-blurb').textContent=t.summary||''; ge('paper').innerHTML='';
      try{ visualObj = ABCJS.renderAbc('paper', t.abc, {responsive:'resize', add_classes:true})[0]; }catch(e){ ge('paper').innerHTML='<div class="note">ABCJS render error: '+e.message+'</div>'; }
      location.hash='tune';
    } else {
      renderSongs(); location.hash='songs'; setTimeout(()=>{ const el=ge(id); if(el) el.open=true; },60);
    }
  }

  on('t-play','click', async ()=>{
    if(!window.ABCJS || !ABCJS.synth || !visualObj) return;
    sh('audioNote', false);
    try{
      const synth = new ABCJS.synth.CreateSynth(); await synth.init({visualObj});
      const ctrl = new ABCJS.synth.SynthController(); const target = document.createElement('div'); target.style.margin='10px 0'; ge('paper').prepend(target);
      ctrl.load(target, null, { displayLoop:false, displayRestart:false, displayPlay:false, displayProgress:true });
      await synth.prime(); ctrl.setTune(visualObj, false); ctrl.play(); synthControl=ctrl;
    }catch(e){ ge('paper').insertAdjacentHTML('afterbegin','<div class="note">Audio init failed: '+e.message+'</div>'); }
  });
  on('t-stop','click', ()=> synthControl && synthControl.pause());
  on('t-print','click', ()=> window.print());
  on('t-save','click', ()=>{ if(!current) return; addTune(current); alert('Saved to library.'); });

  function renderSongs(){
    ge('songlist').innerHTML = SONGS.map(s=>`<details class="item" id="${s.id}"><summary><strong>${s.title}</strong><div class="badges" style="margin-top:6px">${s.tags.map(t=>`<span class="badge">${t}</span>`).join('')}</div></summary><div style="white-space:pre-wrap;margin-top:8px">${s.lyrics}</div></details>`).join('');
  }

  // Library Drawer
  const drawer = ge('libDrawer'); on('libOpen','click',()=>drawer.classList.toggle('hidden'));
  on('importPaste','click', ()=>{ const text=ge('abcPaste').value.trim(); const tunes=parseABC(text); tunes.forEach(addTune); alert('Imported '+tunes.length+' tune(s).'); render(); });
  on('importFile','click', ()=>{ const f=ge('abcFile').files[0]; if(!f) return; f.text().then(t=>{ const tunes=parseABC(t); tunes.forEach(addTune); alert('Imported '+tunes.length+' tune(s).'); render(); }); });
  on('importUrl','click', async ()=>{ const url=ge('abcUrl').value.trim(); if(!url) return; try{ const r=await fetch(url); const tx=await r.text(); const tunes=parseABC(tx); tunes.forEach(addTune); alert('Imported '+tunes.length+' tune(s) from URL.'); render(); }catch(e){ alert('Fetch failed (CORS?): '+e.message); } });
  on('exportLib','click', ()=>{ const blob=new Blob([JSON.stringify(loadLib(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='cge-library.json'; a.click(); });
  on('importJson','click', ()=>{ const f=ge('importJsonFile').files[0]; if(!f) return; f.text().then(j=>{ try{ const data=JSON.parse(j); if(Array.isArray(data)){ saveLib(data); alert('Library imported: '+data.length+' items.'); render(); } }catch(e){ alert('Bad JSON: '+e.message);} }); });

  function parseABC(text){
    if(!text) return [];
    const blocks=text.split(/\\n(?=X:\\s*\\d+)/g).map(b=>b.trim()).filter(Boolean);
    const out=[];
    blocks.forEach((b,i)=>{
      const mT=b.match(/T:(.*)/); const mR=b.match(/R:(.*)/);
      const title=(mT?mT[1].trim():'Tune '+(i+1));
      out.push({id:slug(title)+'-'+Date.now()+'-'+i,title, type:(mR?mR[1].trim():''), level:'General', source:'Imported', summary:'Imported from ABC', abc:b});
    });
    if(out.length===0){ out.push({id:'import-'+Date.now(), title:'Imported Tune', type:'', level:'General', source:'Imported', summary:'Imported from ABC', abc:text}); }
    return out;
  }

  // Tools
  const host=ge('toolhost'); on('studioBtn','click', studio); on('mBtn','click', metronome); on('rBtn','click', recorder); on('tuneBtn','click', tuner); studio();

  function studio(){
    host.innerHTML=`<h3 style="margin-top:0">ABC Studio</h3>
    <textarea id="abcsrc" style="width:100%;height:160px">X:1
T:New Tune
R:jig
M:6/8
L:1/8
K:G
D|GFG BAB|gfg dBG|</textarea>
    <div class="actions"><button class="btn play" id="renderBtn">Render</button><button class="btn" id="saveBtn">Save to Library</button><button class="btn pdf" id="printBtn">Print / PDF</button></div>
    <div id="studioPaper" style="margin-top:10px"></div>`;
    ge('renderBtn').addEventListener('click',()=>{ if(!window.ABCJS){ ge('studioPaper').innerHTML='<div class="note">ABCJS not loaded.</div>'; return; } ABCJS.renderAbc('studioPaper', ge('abcsrc').value, {responsive:'resize'}); });
    ge('saveBtn').addEventListener('click',()=>{ const t=ge('abcsrc').value; const tunes=parseABC(t); tunes.forEach(addTune); alert('Saved '+tunes.length+' to library.'); });
    ge('printBtn').addEventListener('click',()=>window.print());
  }

  function metronome(){
    host.innerHTML=`<h3 style="margin-top:0">Metronome</h3>
    <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:8px 0">
      <label>BPM <input id="bpm" type="number" value="96" min="30" max="240" style="width:80px"></label>
      <label>Signature 
        <select id="sig">
          <option>2/4</option><option>3/4</option><option selected>4/4</option><option>5/4</option>
          <option>6/8</option><option>7/8</option><option>9/8</option><option>12/8</option>
        </select>
      </label>
      <label>Custom accents <input id="pattern" placeholder="100100 (1=accent)" style="width:140px"></label>
      <button id="mToggle" class="btn play">Start</button>
    </div>
    <canvas id="rail" width="700" height="140" style="width:100%;background:#fff;border:1px solid var(--line);border-radius:14px"></canvas>`;
    const ctx=ge('rail').getContext('2d'); const bpm=ge('bpm'), sig=ge('sig'), pat=ge('pattern'); const toggle=ge('mToggle');
    let ac, running=false, last=0, beat=0;
    function setup(){ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); }
    function beats(){
      const s=sig.value;
      if(pat.value.trim()) return pat.value.trim().length;
      if(s==='6/8') return 6; if(s==='7/8') return 7; if(s==='9/8') return 9; if(s==='12/8') return 12;
      return Number(s.split('/')[0])||4;
    }
    function isAccent(i){
      const s=sig.value;
      if(pat.value.trim()) return pat.value.trim()[i]==='1';
      if(s==='6/8') return i%3===0;
      if(s==='9/8') return i%3===0;
      if(s==='12/8') return i%3===0;
      return i===0;
    }
    function draw(progress,n){
      const w=ctx.canvas.width,h=ctx.canvas.height; ctx.clearRect(0,0,w,h);
      const pad=30,usable=w-2*pad; ctx.strokeStyle='#cfe6d6'; ctx.lineWidth=8; ctx.beginPath(); ctx.moveTo(pad,h/2); ctx.lineTo(w-pad,h/2); ctx.stroke();
      for(let i=0;i<n;i++){ const x=pad+usable*(i/(n-1||1)); ctx.fillStyle=isAccent(i)?'#1d7f3b':'#9fbda8'; ctx.beginPath(); ctx.arc(x,h/2,8,0,6.28); ctx.fill(); }
      const x=pad+usable*progress; ctx.fillStyle='#1d7f3b'; ctx.beginPath(); ctx.arc(x,h/2,18,0,6.28); ctx.fill();
    }
    function tick(accent=false){
      const o=ac.createOscillator(), g=ac.createGain(), t=ac.currentTime; o.type='square'; o.frequency.value=accent?1760:880; g.gain.setValueAtTime(0.001,t);
      g.gain.exponentialRampToValueAtTime(0.4,t+0.005); g.gain.exponentialRampToValueAtTime(0.001,t+0.08);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t+0.09);
    }
    function loop(t){ if(!running) return; if(!last) last=t; const spb=60/Number(bpm.value); const elapsed=(t-last)/1000; if(elapsed>=spb){ last=t; tick(isAccent(beat)); beat=(beat+1)%beats(); } const prog=Math.min(elapsed/(60/Number(bpm.value)),1); draw(prog,beats()); requestAnimationFrame(loop); }
    toggle.addEventListener('click',()=>{ running=!running; toggle.textContent=running?'Stop':'Start'; toggle.className=running?'btn':'btn play'; if(running){ setup(); last=0; beat=0; requestAnimationFrame(loop);} });
  }

  function recorder(){
    host.innerHTML=`<h3 style="margin-top:0">Record Yourself</h3>
    <div class="actions"><button id="rStart" class="btn play">● Start</button><button id="rStop" class="btn">■ Stop</button><a id="rDL" class="btn pdf" href="#" download="take.webm" style="pointer-events:none;opacity:.6">Download</a></div>
    <div class="note">If the mic button doesn’t work, run from a local server (http://localhost) to enable permissions.</div>
    <audio id="rPlayer" controls style="width:100%;margin-top:10px"></audio><div id="rLog" style="margin-top:6px;color:var(--muted)"></div>`;
    const start=ge('rStart'), stop=ge('rStop'), player=ge('rPlayer'), dl=ge('rDL'), log=ge('rLog'); let media, rec, chunks=[];
    start.addEventListener('click', async ()=>{ try{ media=await navigator.mediaDevices.getUserMedia({audio:true}); rec=new MediaRecorder(media); chunks=[]; rec.ondataavailable=e=>chunks.push(e.data); rec.onstop=()=>{ const blob=new Blob(chunks,{type:'audio/webm'}); const url=URL.createObjectURL(blob); player.src=url; dl.href=url; dl.style.opacity=1; dl.style.pointerEvents='auto'; }; rec.start(); log.textContent='Recording…'; }catch(e){ log.textContent='Mic error: '+e.message; } });
    stop.addEventListener('click', ()=>{ if(rec && rec.state!=='inactive'){ rec.stop(); log.textContent='Stopped.'; if(media){ media.getTracks().forEach(t=>t.stop()); } } });
  }

  function tuner(){
    host.innerHTML=`<h3 style="margin-top:0">Tuner</h3>
    <div class="actions"><button id="tStart" class="btn play">Start Mic</button><button id="tStop" class="btn">Stop</button><label style="margin-left:8px">A4 <input id="a4" type="number" value="440" min="400" max="460" step="1" style="width:80px"></label></div>
    <div class="note">Mic access may require running from http://localhost.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
      <div class="tri-border section"><div style="font-size:48px;font-weight:900" id="nNote">--</div><div id="nFreq" style="color:var(--muted)">0 Hz</div></div>
      <div class="tri-border section"><div>Detune (cents)</div><div id="nCents" style="font-size:36px;font-weight:800">0</div></div>
    </div>`;
    const nNote=ge('nNote'), nFreq=ge('nFreq'), nCents=ge('nCents'), a4=ge('a4'); let ctx, media, src, analyser, raf;
    function autoCorrelate(buf, sr){ let SIZE=buf.length; let rms=0; for(let i=0;i<SIZE;i++){ let v=buf[i]; rms+=v*v; } rms=Math.sqrt(rms/SIZE); if(rms<0.01) return -1; let c=new Array(SIZE).fill(0); for(let i=0;i<SIZE;i++) for(let j=0;j<SIZE-i;j++) c[i]+=buf[j]*buf[j+i]; let d=0; while(c[d]>c[d+1]) d++; let maxval=-1,maxpos=-1; for(let i=d;i<SIZE;i++){ if(c[i]>maxval){ maxval=c[i]; maxpos=i; } } return sr/maxpos; }
    const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    function nf(freq,A4){ return Math.round(12*Math.log2(freq/A4))+69; }
    function fFrom(n,A4){ return A4*Math.pow(2,(n-69)/12); }
    function cents(freq,n,A4){ return Math.floor(1200*Math.log2(freq/fFrom(n,A4))); }
    ge('tStart').addEventListener('click', async ()=>{ try{ ctx=ctx||new (window.AudioContext||window.webkitAudioContext)(); media=await navigator.mediaDevices.getUserMedia({audio:true}); src=ctx.createMediaStreamSource(media); analyser=ctx.createAnalyser(); analyser.fftSize=2048; src.connect(analyser); tick(); }catch(e){ nFreq.textContent='Mic error: '+e.message; } });
    ge('tStop').addEventListener('click', ()=>{ cancelAnimationFrame(raf); if(media){ media.getTracks().forEach(t=>t.stop()); } });
    function tick(){ raf=requestAnimationFrame(tick); let data=new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data); const f=autoCorrelate(data, ctx.sampleRate); if(f>0){ const A=Number(a4.value)||440; const n=nf(f,A); nNote.textContent=names[n%12]+(Math.floor(n/12)-1); nFreq.textContent=f.toFixed(1)+' Hz'; nCents.textContent=cents(f,n,A); } }
  }

  // Helpers
  function ge(id){return document.getElementById(id)}
  function qs(sel,el=document){return [...el.querySelectorAll(sel)]}
  function on(id,ev,fn){ge(id).addEventListener(ev,fn)}
  function setPressed(group, el){ group.forEach(b=>b.setAttribute('aria-pressed','false')); el.setAttribute('aria-pressed','true'); }
  function sh(id,hide){ ge(id).hidden=hide; }
})();
