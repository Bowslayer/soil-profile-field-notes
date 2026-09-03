(function(){
  const EMAIL_WEB_APP='https://script.google.com/macros/s/AKfycbxe02z3UaVyMFzNdbnlrAQ4rAyTRFtnwwQ8Fdd8WSVD1cEHGrk2he7PXLHemKNPo5k5/exec';

  function safeName(s){
    return String(s||'Soil-Profile-Field-Notes').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,120)||'Soil-Profile-Field-Notes';
  }

  function fixedLotTract(value){
    const numberWords={zero:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9'};
    let s=String(value||'').trim();
    s=s.replace(/\b(?:tracked|track|tract|traced|trace|trak)\b/gi,'Tract');
    s=s.replace(/\b(?:parcel|partial)\b/gi,'Parcel');
    s=s.replace(/\blot\b/gi,'Lot');
    s=s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine)\b/gi,m=>numberWords[m.toLowerCase()]);
    s=s.replace(/\b(Tract|Parcel|Lot)\s+([a-z0-9](?:[\s-]*[a-z0-9])*)/gi,function(_,type,id){
      const compact=id.replace(/[\s-]+/g,'').toUpperCase();
      return type.charAt(0).toUpperCase()+type.slice(1).toLowerCase()+' '+compact;
    });
    return s;
  }

  window.normalizeLotTract=fixedLotTract;

  async function fetchJson(url,ms){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),ms||8000);
    try{
      const r=await fetch(url,{signal:controller.signal,cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      return await r.json();
    }finally{clearTimeout(timer);}
  }

  function cleanCounty(name){
    return String(name||'').replace(/\s+County$/i,'').replace(/^County\s+/i,'').trim();
  }

  async function lookupCounty(lat,lon){
    // Primary: BigDataCloud's free browser-side reverse geocoder. This endpoint
    // is designed for direct client-side GPS lookups and supports browser CORS.
    try{
      const u='https://api.bigdatacloud.net/data/reverse-geocode-client?latitude='+encodeURIComponent(lat)+'&longitude='+encodeURIComponent(lon)+'&localityLanguage=en';
      const d=await fetchJson(u,9000);
      const admins=(d&&d.localityInfo&&Array.isArray(d.localityInfo.administrative))?d.localityInfo.administrative:[];
      let entry=admins.find(a=>/county/i.test(String(a.description||'')))||admins.find(a=>/county/i.test(String(a.name||'')));
      if(entry&&entry.name){
        const c=cleanCounty(entry.name);
        if(c)return c;
      }
    }catch(e){}

    // Fallback: US Census Geocoder.
    try{
      const u='https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x='+encodeURIComponent(lon)+'&y='+encodeURIComponent(lat)+'&benchmark=Public_AR_Current&vintage=Current_Current&format=json';
      const d=await fetchJson(u,9000);
      const name=d&&d.result&&d.result.geographies&&d.result.geographies.Counties&&d.result.geographies.Counties[0]&&d.result.geographies.Counties[0].NAME;
      if(name)return cleanCounty(name);
    }catch(e){}

    // Last fallback: FCC area API.
    try{
      const u='https://geo.fcc.gov/api/census/area?lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon)+'&format=json';
      const d=await fetchJson(u,9000);
      const r=d&&Array.isArray(d.results)&&d.results[0];
      if(r&&r.county_name)return cleanCounty(r.county_name);
    }catch(e){}

    return '';
  }

  window.autoGPS=async function(){
    if(!navigator.geolocation){
      if(window.voiceStatus)voiceStatus.textContent='GPS is unavailable on this device.';
      return;
    }
    return new Promise(resolve=>navigator.geolocation.getCurrentPosition(async p=>{
      const lat=p.coords.latitude,lon=p.coords.longitude;
      const latEl=document.getElementById('latitude'),lonEl=document.getElementById('longitude');
      if(latEl)latEl.value=lat.toFixed(6);
      if(lonEl)lonEl.value=lon.toFixed(6);

      try{
        const d=await fetchJson('https://epqs.nationalmap.gov/v1/json?x='+encodeURIComponent(lon)+'&y='+encodeURIComponent(lat)+'&units=Feet&wkid=4326',9000);
        if(Number.isFinite(+d.value))document.getElementById('elevation').value=Math.round(+d.value);
      }catch(e){}

      const countyEl=document.getElementById('county');
      if(countyEl)countyEl.value='';
      const county=await lookupCounty(lat,lon);
      if(countyEl&&county)countyEl.value=county;
      if(typeof save==='function')save();
      if(window.voiceStatus)voiceStatus.textContent=county?'GPS, elevation, and county updated: '+county+'.':'GPS updated, but county lookup failed. Tap Refresh GPS + Elevation + County to retry.';
      resolve();
    },err=>{
      if(window.voiceStatus)voiceStatus.textContent='GPS permission or location lookup failed.';
      resolve();
    },{enableHighAccuracy:true,timeout:15000,maximumAge:0}));
  };

  function reportData(){
    const horizons=(typeof state!=='undefined'&&state.horizons?state.horizons:[]).map((h,i,arr)=>{
      const x={...h};
      if(i===arr.length-1)delete x.boundaryDistinctness;
      return x;
    });
    const data={horizons,depthsSet:!!(typeof state!=='undefined'&&state.depthsSet)};
    ['location','lotTract','date','time','elevation','aspect','county','vegetation','describedBy','latitude','longitude'].forEach(k=>{
      const el=document.getElementById(k);data[k]=el?el.value:'';
    });
    if(data.lotTract)data.lotTract=fixedLotTract(data.lotTract);
    return data;
  }

  async function sendReport(){
    const btn=document.getElementById('saveJson');
    const lot=document.getElementById('lotTract');
    if(lot)lot.value=fixedLotTract(lot.value);
    if(typeof save==='function')save();
    const data=reportData();
    const base=safeName(data.lotTract);
    const payload={fileName:base+'.json',subject:'Soil Profile Field Notes - '+base,report:JSON.stringify(data,null,2)};
    try{
      if(btn){btn.disabled=true;btn.textContent='Sending…';}
      if(window.voiceStatus)voiceStatus.textContent='Sending report with attachment…';
      await fetch(EMAIL_WEB_APP,{method:'POST',mode:'no-cors',cache:'no-store',body:JSON.stringify(payload)});
      if(window.voiceStatus)voiceStatus.textContent='Report submitted to the email service.';
      alert('Report submitted. Check your email for '+payload.fileName+'.');
    }catch(e){
      if(window.voiceStatus)voiceStatus.textContent='The report could not be submitted. Please try again.';
      alert('The report could not be submitted. Please try again.');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Export / Email Report';}
    }
  }

  function install(){
    const btn=document.getElementById('saveJson');
    if(btn){btn.textContent='Export / Email Report';btn.onclick=sendReport;}
    const gps=document.getElementById('gpsBtn');
    if(gps)gps.onclick=window.autoGPS;
    const lot=document.getElementById('lotTract');
    if(lot){
      lot.addEventListener('change',()=>{lot.value=fixedLotTract(lot.value);if(typeof save==='function')save();});
      lot.addEventListener('blur',()=>{lot.value=fixedLotTract(lot.value);if(typeof save==='function')save();});
    }
    // Re-run GPS after this override is installed so the County field is populated
    // by the browser-safe lookup even if the original inline lookup failed earlier.
    setTimeout(()=>window.autoGPS(),700);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setTimeout(install,500);
})();
