const K={
  fav:'apv_favorites',
  history:'apv_history',
  searchHistory:'apv_search_history',
  unlocked:'apv_unlocked',
  welcome:'apv_welcome_state',
  settings:'apv_settings',
  adCycle:'apv_ad_cycle',
  promptAds:'apv_prompt_ads',
  userMeta:'apv_user_meta',
  inApp:'apv_inapp_state',
  rewardedLimits:'apv_rewarded_limits',
  launch:'apv_launch_state'
};

const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const bytes=()=>{let n=0;for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i),v=localStorage.getItem(k)||'';n+=(k?.length||0)+v.length}return n*2};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{cleanupStorage();try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const cleanupStorage=()=>{try{localStorage.removeItem(K.searchHistory)}catch{};try{set(K.history,get(K.history,[]).slice(0,5))}catch{}};

const userMeta=()=>{const e=get(K.userMeta,null);if(e&&Number(e.firstSeenAt)>0)return e;const now=Date.now(),fresh={firstSeenAt:now,lastSeenAt:now};set(K.userMeta,fresh);return fresh};

const launchState=()=>get(K.launch,{seq:0,lastAt:0});
const beginLaunch=()=>{
  const now=Date.now();
  const s=launchState();
  const next={seq:Number(s.seq||0)+1,lastAt:now};
  set(K.launch,next);
  return next;
};

// A premium unlock survives exactly one later app launch. On the following
// launch the unlock/progress for that prompt is cleared as requested.
const applyUnlockExpiry=()=>{
  const launch=launchState();
  const unlocked=get(K.unlocked,[]);
  const meta=get(K.unlockMeta,{});
  if(!unlocked.length)return;
  const keep=[];
  const progress=get(K.promptAds,{});
  let changed=false;
  unlocked.forEach(id=>{
    const u=meta[id];
    if(!u){keep.push(id);return}
    const unlockLaunch=Number(u.launchSeq||0);
    if(Number(launch.seq||0)>=unlockLaunch+2){delete meta[id];delete progress[id];changed=true}
    else keep.push(id);
  });
  if(changed){set(K.unlocked,keep);set(K.unlockMeta,meta);set(K.promptAds,progress)}
};
K.unlockMeta='apv_unlock_meta';

const touchSession=()=>{
  const now=Date.now(),meta=userMeta(),day=new Date().toISOString().slice(0,10);
  let state=get(K.inApp,{day,opens:0,lastShownAt:0});
  if(state.day!==day)state={day,opens:0,lastShownAt:0};
  state.opens=Number(state.opens||0)+1;state.lastOpenAt=now;set(K.inApp,state);set(K.userMeta,{...meta,lastSeenAt:now});
  return {meta,state,ageMs:now-Number(meta.firstSeenAt)};
};
const markInAppShown=()=>{const now=Date.now(),state=get(K.inApp,{day:new Date().toISOString().slice(0,10),opens:0,lastShownAt:0});set(K.inApp,{...state,lastShownAt:now})};

const hourBucket=()=>Math.floor(Date.now()/3600000);
const rewardedLimits=()=>{
  const b=hourBucket(),d=get(K.rewardedLimits,null);
  if(!d||Number(d.bucket)!==b)return {bucket:b,interstitial:0,popup:0,blockedUntil:0};
  return {bucket:b,interstitial:Number(d.interstitial||0),popup:Number(d.popup||0),blockedUntil:Number(d.blockedUntil||0)};
};
const saveRewardedLimits=d=>set(K.rewardedLimits,d);

export const store={
  favorites:()=>get(K.fav,[]),
  toggleFavorite:id=>{let a=get(K.fav,[]);a=a.includes(id)?a.filter(x=>x!==id):[...a,id];set(K.fav,a);return a.includes(id)},
  history:()=>get(K.history,[]),
  addHistory:id=>{const a=get(K.history,[]).filter(x=>x!==id);set(K.history,[id,...a].slice(0,5))},
  searchHistory:()=>get(K.searchHistory,[]),
  addSearch:q=>{const a=get(K.searchHistory,[]).filter(x=>x.toLowerCase()!==q.toLowerCase());set(K.searchHistory,[q,...a].slice(0,8))},
  clearSearchHistory:()=>localStorage.removeItem(K.searchHistory),
  unlocked:()=>get(K.unlocked,[]),
  unlock:id=>{const a=get(K.unlocked,[]);if(!a.includes(id))a.push(id);set(K.unlocked,a);const m=get(K.unlockMeta,{});m[id]={launchSeq:Number(launchState().seq||0),unlockedAt:Date.now()};set(K.unlockMeta,m)},
  getPromptAdCount:id=>Number(get(K.promptAds,{})[id]||0),
  incrementPromptAd:id=>{const a=get(K.promptAds,{});a[id]=Number(a[id]||0)+1;set(K.promptAds,a);return a[id]},
  welcomeState:()=>get(K.welcome,{count:0,lastShownDate:null}),
  markWelcomeShown:date=>{const s=get(K.welcome,{count:0,lastShownDate:null}),next={count:Math.min(10,(Number(s.count)||0)+1),lastShownDate:date};set(K.welcome,next);return next},
  settings:()=>get(K.settings,{notifications:true}),setSettings:v=>set(K.settings,v),
  adCycle:()=>{const d=get(K.adCycle,null);if(d&&Number.isInteger(d.target)&&d.target>=15&&d.target<=30&&Number.isInteger(d.count)&&d.count>=0)return d;const fresh={target:15+Math.floor(Math.random()*16),count:0};set(K.adCycle,fresh);return fresh},
  recordRewardedUnlock:()=>{const d=store.adCycle(),next={...d,count:d.count+1};if(next.count>=next.target){const fresh={target:15+Math.floor(Math.random()*16),count:0,lastTarget:d.target};set(K.adCycle,fresh);return {reached:true,previousTarget:d.target,state:fresh}}set(K.adCycle,next);return {reached:false,previousTarget:d.target,state:next}},
  resetAdCycle:()=>{const fresh={target:15+Math.floor(Math.random()*16),count:0};set(K.adCycle,fresh);return fresh},
  rewardedStatus:()=>{const d=rewardedLimits();return {...d,remainingInterstitial:Math.max(0,15-d.interstitial),remainingPopup:Math.max(0,15-d.popup),blockedUntil:Number(d.blockedUntil||0)}},
  canUseRewarded:type=>{const d=rewardedLimits();if(d.blockedUntil&&Date.now()<d.blockedUntil)return false;return Number(d[type]||0)<15},
  recordRewarded:type=>{const d=rewardedLimits();d[type]=Number(d[type]||0)+1;if(d.interstitial>=15&&d.popup>=15){d.blockedUntil=Date.now()+2*60*60*1000}saveRewardedLimits(d);return {...d,exhausted:d.interstitial>=15&&d.popup>=15}},
  rewardedBlockedUntil:()=>Number(rewardedLimits().blockedUntil||0),
  touchSession, inAppState:()=>get(K.inApp,{day:new Date().toISOString().slice(0,10),opens:0,lastShownAt:0}),markInAppShown,
  userAgeMs:()=>Date.now()-Number(userMeta().firstSeenAt||Date.now()),
  beginLaunch,
  applyUnlockExpiry,
  storageBytes:bytes,
  enforceStorageBudget:()=>{if(bytes()>4.5*1024*1024)cleanupStorage();return bytes()},
  clear:()=>{Object.keys(localStorage).filter(k=>k.startsWith('apv_')).forEach(k=>localStorage.removeItem(k))}
};

store.beginLaunch();
store.applyUnlockExpiry();
store.enforceStorageBudget();
