(function(){
  const EMAIL_WEB_APP='https://script.google.com/macros/s/AKfycbxe02z3UaVyMFzNdbnlrAQ4rAyTRFtnwwQ8Fdd8WSVD1cEHGrk2he7PXLHemKNPo5k5/exec';

  function safeName(s){
    return String(s||'Soil-Profile-Field-Notes').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,120)||'Soil-Profile-Field-Notes';
  }

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
    return data;
  }

  async function sendReport(){
    const btn=document.getElementById('saveJson');
    const data=reportData();
    const base=safeName(data.lotTract);
    const payload={
      fileName:base+'.json',
      subject:'Soil Profile Field Notes - '+base,
      report:JSON.stringify(data,null,2)
    };
    try{
      if(btn){btn.disabled=true;btn.textContent='Sending…';}
      if(window.voiceStatus)voiceStatus.textContent='Sending report with attachment…';
      await fetch(EMAIL_WEB_APP,{
        method:'POST',
        mode:'no-cors',
        cache:'no-store',
        body:JSON.stringify(payload)
      });
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
    if(!btn)return;
    btn.textContent='Export / Email Report';
    btn.onclick=sendReport;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
  setTimeout(install,500);
})();
