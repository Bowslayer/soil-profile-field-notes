const CACHE_NAME='soil-profile-field-notes-v25';

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    try{
      const response=await fetch('./',{cache:'no-store'});
      if(response.ok){
        const html=patchApp(await response.text());
        await cache.put('./',new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}}));
        await cache.put('./index.html',new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}}));
      }
    }catch(e){}
    try{await cache.add('./manifest.webmanifest')}catch(e){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function patchApp(html){
  html=html.replace('Build 2026-09-08 · Version 20','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 21','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 22','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 23','Build 2026-09-09 · Version 25');
  html=html.replace('Build 2026-09-08 · Version 24','Build 2026-09-09 · Version 25');

  // Keep the current Subdivision Name wording while preserving the saved/report key.
  html=html.replace('<label>Location</label><input id="location">','<label>Subdivision Name</label><input id="location">');
  html=html.replace("['location','What is the test pit location?']","['location','What is the Subdivision Name?']");
  html=html.replace("location:'For example, Test Pit 1, north test pit, or replacement area test pit.'","location:'For example, Smith Subdivision, Mountain View Subdivision, or the subdivision name for this site.'");

  // Preserve the Version 24 Munsell voice parsing.
  const oldColorFn="function normalizeColor(t){const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/[’']/g,' ').replace(/-/g,'/').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');let n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/);if(!n){const compact=s.replace(/\\D/g,'');if(/^\\d{2}$/.test(compact))n=[compact,compact[0],compact[1]]}if(!n)n=s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  const newColorFn="function normalizeColor(t){const numberWords={zero:'0',oh:'0',one:'1',won:'1',two:'2',to:'2',too:'2',three:'3',tree:'3',four:'4',for:'4',fore:'4',five:'5',six:'6',seven:'7',eight:'8',ate:'8',nine:'9',ten:'10'};let s=String(t).toLowerCase().replace(/ten\\s*y\\s*r|10\\s*y\\s*r|10yr/g,'').replace(/slash|dash|hyphen/g,'/').replace(/[’']/g,' ').replace(/-/g,'/').trim();s=s.split(/\\s+/).map(v=>numberWords[v]??v).join(' ');let n=s.match(/(\\d+(?:\\.\\d+)?)\\s*\\/\\s*(\\d+(?:\\.\\d+)?)/)||s.match(/(\\d+(?:\\.\\d+)?)\\s+(\\d+(?:\\.\\d+)?)/);if(!n){const compact=s.replace(/\\D/g,'');if(/^\\d{2}$/.test(compact))n=[compact,compact[0],compact[1]]}if(!n)n=s.match(/(\\d+(?:\\.\\d+)?)\\D+(\\d+(?:\\.\\d+)?)/);return n?`10YR ${n[1]}/${n[2]}`:'10YR'}";
  html=html.replace(oldColorFn,newColorFn);

  // Preserve the lab-sample pending workflow.
  html=html.replace('.active-field{outline:3px solid currentColor;outline-offset:2px}', '.active-field{outline:3px solid currentColor;outline-offset:2px}.sample-pending{background:#c8f7c5!important;border-color:#2e7d32!important}');
  html=html.replace("texture:'Options are sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, or clay.'", "texture:'Options are sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, clay, or say sample if a lab sample is needed.'");
  html=html.replace("if(key==='rockSize')return normalizeRockSize(t);if(key==='rootsNotes')return String(t).replace(/\\bmini\\b/gi,'many');if(vocab[key])return closest(t,vocab[key]);return t", "if(key==='rockSize')return normalizeRockSize(t);if(key==='rootsNotes')return String(t).replace(/\\bmini\\b/gi,'many');if(key==='texture'&&words(t)==='sample')return 'Sample';if(vocab[key])return closest(t,vocab[key]);return t");

  // Preserve texture-driven Wet Consistence and Stickiness, plus Sample pending behavior.
  const marker="const pad=n=>String(n).padStart(2,'0');";
  const textureHelper="const textureWetStick={'sand':['nonplastic','nonsticky'],'loamy sand':['nonplastic','nonsticky'],'sandy loam':['slightly plastic','slightly sticky'],'loam':['slightly plastic','slightly sticky'],'silt loam':['moderately plastic','moderately sticky'],'silt':['moderately plastic','moderately sticky'],'sandy clay loam':['moderately plastic','moderately sticky'],'clay loam':['very plastic','very sticky'],'silty clay loam':['very plastic','very sticky'],'sandy clay':['very plastic','very sticky'],'silty clay':['very plastic','very sticky'],'clay':['very plastic','very sticky']};function applyTextureDefaults(i,t){if(!state.horizons[i])return;const h=state.horizons[i];const texture=document.querySelector('[data-h=\"'+i+'\"][data-k=\"texture\"]');const wet=document.querySelector('[data-h=\"'+i+'\"][data-k=\"wetConsistence\"]');const sticky=document.querySelector('[data-h=\"'+i+'\"][data-k=\"stickiness\"]');const pending=words(t)==='sample';[texture,wet,sticky].forEach(e=>{if(e)e.classList.toggle('sample-pending',pending)});if(pending){h.wetConsistence='';h.stickiness='';if(wet)wet.value='';if(sticky)sticky.value='';return;}const tex=closest(t,vocab.texture);const pair=textureWetStick[tex];if(!pair)return;h.wetConsistence=pair[0];h.stickiness=pair[1];if(wet)wet.value=pair[0];if(sticky)sticky.value=pair[1];}";
  if(!html.includes('const textureWetStick=')) html=html.replace(marker,textureHelper+marker);
  html=html.replace("x.value=h[k]||'';x.oninput=()=>{h[k]=x.value;save()};", "x.value=h[k]||'';if((k==='texture'||k==='wetConsistence'||k==='stickiness')&&words(h.texture)==='sample')x.classList.add('sample-pending');x.oninput=()=>{h[k]=x.value;if(k==='texture')applyTextureDefaults(i,x.value);save()};");
  html=html.replace("x.oninput=()=>{h[k]=x.value;save()};","x.oninput=()=>{h[k]=x.value;if(k==='texture')applyTextureDefaults(i,x.value);save()};");
  html=html.replace("if(q.scope==='detail')$(q.key).value=v;else state.horizons[q.i][q.key]=v;const e=elem(q);","if(q.scope==='detail')$(q.key).value=v;else{state.horizons[q.i][q.key]=v;if(q.key==='texture')applyTextureDefaults(q.i,v)}const e=elem(q);");
  html=html.replace("const v=String(val(qs[i])||'').trim();if(!v||", "const v=String(val(qs[i])||'').trim();if((qs[i].key==='wetConsistence'||qs[i].key==='stickiness')&&words(state.horizons[qs[i].i]?.texture)==='sample')continue;if(!v||");

  // Version 25 workflow change only: ask horizon count, then ask each horizon depth separately.
  const oldNextStep="function nextStep(delay=120){setTimeout(()=>{if(!state.voiceActive)return;const ib=firstIntroBlank();if(ib>=0){state.qIndex=ib;return ask()}if(!state.depthsSet)return askDepths();const hb=firstHorizonBlank();if(hb>=0){state.qIndex=hb;return ask()}voiceStatus.textContent='All questions are filled.';currentQuestion.textContent='All questions are filled.'},delay)}";
  const newNextStep="function nextStep(delay=120){setTimeout(()=>{if(!state.voiceActive)return;const ib=firstIntroBlank();if(ib>=0){state.qIndex=ib;return ask()}if(!state.depthsSet)return askHorizonCount();const hb=firstHorizonBlank();if(hb>=0){state.qIndex=hb;return ask()}voiceStatus.textContent='All questions are filled.';currentQuestion.textContent='All questions are filled.'},delay)}";
  html=html.replace(oldNextStep,newNextStep);

  const oldAskDepths="function askDepths(){state.mode='depths';state.pending=null;currentQuestion.textContent='What are the depths of all the soil horizons?';document.querySelectorAll('.active-field').forEach(x=>x.classList.remove('active-field'));$('horizons').scrollIntoView({behavior:'smooth',block:'center'});speak('What are the depths of all the soil horizons?',()=>setTimeout(listen,100))}";
  const newDepthWorkflow="function askHorizonCount(){state.mode='horizonCount';state.pending=null;state.depthIndex=0;currentQuestion.textContent='How many soil horizons are there?';document.querySelectorAll('.active-field').forEach(x=>x.classList.remove('active-field'));$('horizons').scrollIntoView({behavior:'smooth',block:'center'});speak('How many soil horizons are there?',()=>setTimeout(listen,100))}function setHorizonCount(t){const n=Number(spokenNumber(t));if(!Number.isInteger(n)||n<1||n>20){speak('Please say the number of soil horizons.',()=>setTimeout(listen,100));return}state.pending=n;state.mode='horizonCountConfirm';speak(n+' soil horizons. Is that correct?',()=>setTimeout(listen,100))}function beginHorizonDepths(n){state.horizons=Array.from({length:n},()=>blank());state.depthIndex=0;state.depthsSet=false;render();save();askOneHorizonDepth()}function askOneHorizonDepth(){const i=state.depthIndex||0;if(i>=state.horizons.length){state.depthsSet=true;render();save();state.mode='answer';state.pending=null;return nextStep()}state.mode='horizonDepth';state.pending=null;currentQuestion.textContent='What is the depth for Horizon '+(i+1)+'?';const e=document.querySelector('[data-h=\"'+i+'\"][data-k=\"top\"]');if(e){document.querySelectorAll('.active-field').forEach(x=>x.classList.remove('active-field'));e.classList.add('active-field');e.scrollIntoView({behavior:'smooth',block:'center'})}speak('What is the depth for Horizon '+(i+1)+'?',()=>setTimeout(listen,100))}function parseHorizonDepth(t){const n=(String(t).match(/\\d+(?:\\.\\d+)?/g)||[]);if(n.length<2){speak('Please say the top and bottom depth for Horizon '+((state.depthIndex||0)+1)+'. For example, 0 to 9.',()=>setTimeout(listen,100));return}const pair=[n[0],n[1]];state.pending=pair;state.mode='horizonDepthConfirm';speak(pair[0]+' to '+pair[1]+' inches. Is that correct?',()=>setTimeout(listen,100))}function saveHorizonDepth(pair){const i=state.depthIndex||0;if(!state.horizons[i])return askHorizonCount();state.horizons[i].top=pair[0];state.horizons[i].bottom=pair[1];state.depthIndex=i+1;render();save();askOneHorizonDepth()}";
  html=html.replace(oldAskDepths,newDepthWorkflow);

  const oldGiveExample="function giveExample(){const q=currentQ();const text=q?(examples[q.key]||'Give the field observation for this item.'):'For horizon depths, say each range, for example 0 to 10, 10 to 55, 55 to 72.';voiceStatus.textContent='Reading options…';speak(text,()=>setTimeout(listen,120))}";
  const newGiveExample="function giveExample(){let text;if(state.mode==='horizonCount'||state.mode==='horizonCountConfirm')text='For example, say 3 if there are three soil horizons.';else if(state.mode==='horizonDepth'||state.mode==='horizonDepthConfirm')text='For example, say 0 to 9, or 9 to 45.';else{const q=currentQ();text=q?(examples[q.key]||'Give the field observation for this item.'):'Give the field observation for this item.'}voiceStatus.textContent='Reading options…';speak(text,()=>setTimeout(listen,120))}";
  html=html.replace(oldGiveExample,newGiveExample);

  const oldHandle="function handle(t){closeMic();const x=words(t);if(isExample(x)){if(state.mode==='confirm'){state.mode='answer';state.pending=null}return giveExample()}if(state.mode==='depths')return setDepths(t);if(state.mode==='depthConfirm'){if(yes(x)){state.mode='answer';return nextStep()}if(no(x)){state.depthsSet=false;state.horizons=[];render();save();return askDepths()}return setDepths(t)}if(state.mode==='confirm'){if(no(x)){state.mode='correct';voiceStatus.textContent='Listening for correction…';return setTimeout(listen,80)}if(yes(x)){state.mode='answer';state.pending=null;return nextStep()}const v=apply(t);state.pending=v;return speak(v+'. Is that correct?',()=>setTimeout(listen,100))}if(state.mode==='correct'){const v=apply(t);state.pending=v;state.mode='confirm';return speak(v+'. Is that correct?',()=>setTimeout(listen,100))}if(x==='next')return nextStep();const v=apply(t);state.pending=v;state.mode='confirm';speak(v+'. Is that correct?',()=>setTimeout(listen,100))}";
  const newHandle="function handle(t){closeMic();const x=words(t);if(isExample(x)){if(state.mode==='confirm'){state.mode='answer';state.pending=null}return giveExample()}if(state.mode==='horizonCount')return setHorizonCount(t);if(state.mode==='horizonCountConfirm'){if(yes(x)){const n=state.pending;state.pending=null;return beginHorizonDepths(n)}if(no(x)){state.pending=null;return askHorizonCount()}return setHorizonCount(t)}if(state.mode==='horizonDepth')return parseHorizonDepth(t);if(state.mode==='horizonDepthConfirm'){if(yes(x)){const pair=state.pending;state.pending=null;return saveHorizonDepth(pair)}if(no(x)){state.pending=null;return askOneHorizonDepth()}return parseHorizonDepth(t)}if(state.mode==='confirm'){if(no(x)){state.mode='correct';voiceStatus.textContent='Listening for correction…';return setTimeout(listen,80)}if(yes(x)){state.mode='answer';state.pending=null;return nextStep()}const v=apply(t);state.pending=v;return speak(v+'. Is that correct?',()=>setTimeout(listen,100))}if(state.mode==='correct'){const v=apply(t);state.pending=v;state.mode='confirm';return speak(v+'. Is that correct?',()=>setTimeout(listen,100))}if(x==='next')return nextStep();const v=apply(t);state.pending=v;state.mode='confirm';speak(v+'. Is that correct?',()=>setTimeout(listen,100))}";
  html=html.replace(oldHandle,newHandle);

  // Keep the established voice timing unchanged.
  html=html.replaceAll('setTimeout(listen,100)','setTimeout(listen,250)');
  return html;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const req=event.request;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(async response=>{
      const html=patchApp(await response.text());
      const patched=new Response(html,{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8'}});
      const copy=patched.clone();
      caches.open(CACHE_NAME).then(cache=>{
        cache.put('./',copy.clone());
        cache.put('./index.html',copy);
      }).catch(()=>{});
      return patched;
    }).catch(async()=>{
      const cached=await caches.match(req);
      return cached||await caches.match('./')||await caches.match('./index.html');
    }));
    return;
  }
  event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{
    if(response.ok&&new URL(req.url).origin===self.location.origin){
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>cache.put(req,copy)).catch(()=>{});
    }
    return response;
  }).catch(()=>caches.match(req)));
});
