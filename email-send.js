(function(){
  const RECIPIENT='jcbowstring@hotmail.com';

  function safeName(s){
    return String(s||'Soil-Profile-Field-Notes').trim().replace(/[\\/:*?"<>|]+/g,'-').replace(/\s+/g,' ').slice(0,120)||'Soil-Profile-Field-Notes';
  }

  function reportData(){
    const data={horizons:(window.state&&state.horizons?state.horizons:[]).map((h,i,arr)=>{
      const x={...h};
      if(i===arr.length-1)delete x.boundaryDistinctness;
      return x;
    }),depthsSet:!!(window.state&&state.depthsSet)};
    ['location','lotTract','date','time','elevation','aspect','county','vegetation','describedBy','latitude','longitude'].forEach(k=>{
      const el=document.getElementById(k);data[k]=el?el.value:'';
    });
    return data;
  }

  async function readEndpoint(){
    try{
      const r=await fetch('email-config.json',{cache:'no-store'});
      if(!r.ok)return '';
      const d=await r.json();
      return String(d.endpoint||'').trim();
    }catch(e){return ''}
  }

  async function fallbackShare(data,name){
    const json=JSON.stringify(data,null,2);
    const file=new File([json],name,{type:'application/json'});
    try{if(navigator.clipboard)await navigator.clipboard.writeText(RECIPIENT)}catch(e){}
    try{
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        if(window.voiceStatus)voiceStatus.textContent='Choose Gmail. Report is attached; recipient address copied.';
        await navigator.share({files:[file],title:'Soil Profile Field Notes - '+safeName(data.lotTract),text:'Send this report to '+RECIPIENT});
        return;
      }
    }catch(e){if(e&&e.name==='AbortError')return}
    const b=new Blob([json],{type:'application/json'}),a=document.createElement('a');
    a.href=URL.createObjectURL(b);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
    if(window.voiceStatus)voiceStatus.textContent='Automatic email failed. Report saved to Downloads.';
    location.href='mailto:'+RECIPIENT+'?subject='+encodeURIComponent('Soil Profile Field Notes - '+safeName(data.lotTract))+'&body='+encodeURIComponent('Please attach '+name+' from Downloads.');
  }

  async function sendReport(){
    const data=reportData();
    const name=safeName(data.lotTract)+'.json';
    const json=JSON.stringify(data,null,2);
    const endpoint=await readEndpoint();
    if(endpoint){
      try{
        if(window.voiceStatus)voiceStatus.textContent='Emailing report…';
        const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fileName:name,subject:'Soil Profile Field Notes - '+safeName(data.lotTract),body:'Attached is the exported Soil Profile Field Notes report.',report:json,content:json})});
        const text=await r.text();
        let result={};try{result=JSON.parse(text)}catch(e){}
        if(r.ok&&result.ok){
          if(window.voiceStatus)voiceStatus.textContent='Report emailed with attachment to '+RECIPIENT+'.';
          alert('Report emailed with attachment to '+RECIPIENT+'.');
          return;
        }
        throw new Error(result.error||'Email service did not confirm delivery.');
      }catch(e){
        if(window.voiceStatus)voiceStatus.textContent='Automatic email failed; opening attachment/share fallback.';
      }
    }
    await fallbackShare(data,name);
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
