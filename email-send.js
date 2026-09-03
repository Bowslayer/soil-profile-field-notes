(function(){
  const RECIPIENT='jcbowstring@hotmail.com';

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

  async function shareAttached(data,name){
    const json=JSON.stringify(data,null,2);
    // Android/Gmail is more reliable when the JSON file is shared as text/plain.
    const file=new File([json],name,{type:'text/plain'});
    try{if(navigator.clipboard)await navigator.clipboard.writeText(RECIPIENT)}catch(e){}
    if(!navigator.share)return false;
    try{
      if(window.voiceStatus)voiceStatus.textContent='Opening share sheet with report attached…';
      await navigator.share({
        files:[file],
        title:'Soil Profile Field Notes - '+safeName(data.lotTract),
        text:'Send this report to '+RECIPIENT+'. The recipient address has been copied.'
      });
      return true;
    }catch(e){
      if(e&&e.name==='AbortError')return true;
      return false;
    }
  }

  async function fallbackDownload(data,name){
    const json=JSON.stringify(data,null,2);
    const b=new Blob([json],{type:'application/json'}),a=document.createElement('a');
    a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    if(window.voiceStatus)voiceStatus.textContent='Your browser could not attach the file automatically. Report saved to Downloads.';
    alert('This browser could not attach the file automatically. The report was saved to Downloads as '+name+'.');
  }

  async function sendReport(){
    const data=reportData();
    const name=safeName(data.lotTract)+'.json';
    const shared=await shareAttached(data,name);
    if(shared)return;
    await fallbackDownload(data,name);
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
