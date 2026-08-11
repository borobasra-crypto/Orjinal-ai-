const K={fav:'apv_favorites',history:'apv_history',searchHistory:'apv_search_history',unlocked:'apv_unlocked',welcome:'apv_welcome_state',settings:'apv_settings',adCycle:'apv_ad_cycle'};
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const set=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
export const store={
favorites:()=>get(K.fav,[]),
toggleFavorite:id=>{let a=get(K.fav,[]);a=a.includes(id)?a.filter(x=>x!==id):[...a,id];set(K.fav,a);return a.includes(id)},
history:()=>get(K.history,[]),
addHistory:id=>{let a=get(K.history,[]).filter(x=>x!==id);set(K.history,[id,...a].slice(0,5))},
searchHistory:()=>get(K.searchHistory,[]),
addSearch:q=>{let a=get(K.searchHistory,[]).filter(x=>x.toLowerCase()!==q.toLowerCase());set(K.searchHistory,[q,...a].slice(0,8))},
clearSearchHistory:()=>localStorage.removeItem(K.searchHistory),
unlocked:()=>get(K.unlocked,[]),
unlock:id=>{let a=get(K.unlocked,[]);if(!a.includes(id))a.push(id);set(K.unlocked,a)},
welcomeState:()=>get(K.welcome,{count:0,lastShownDate:null}),
markWelcomeShown:date=>{const s=get(K.welcome,{count:0,lastShownDate:null});const next={count:Math.min(10,(Number(s.count)||0)+1),lastShownDate:date};set(K.welcome,next);return next;},
settings:()=>get(K.settings,{notifications:true}),
setSettings:v=>set(K.settings,v),
adCycle:()=>{
  const d=get(K.adCycle,null);
  if(d && Number.isInteger(d.target) && d.target>=15 && d.target<=30 && Number.isInteger(d.count) && d.count>=0) return d;
  const fresh={target:15+Math.floor(Math.random()*16),count:0};
  set(K.adCycle,fresh);
  return fresh;
},
recordRewardedUnlock:()=>{
  const d=store.adCycle();
  const next={...d,count:d.count+1};
  if(next.count>=next.target){
    const fresh={target:15+Math.floor(Math.random()*16),count:0,lastTarget:d.target};
    set(K.adCycle,fresh);
    return {reached:true,previousTarget:d.target,state:fresh};
  }
  set(K.adCycle,next);
  return {reached:false,previousTarget:d.target,state:next};
},
resetAdCycle:()=>{
  const fresh={target:15+Math.floor(Math.random()*16),count:0};
  set(K.adCycle,fresh);
  return fresh;
},
clear:()=>Object.keys(localStorage).filter(k=>k.startsWith('apv_')).forEach(k=>localStorage.removeItem(k))
};
