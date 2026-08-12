const K={
  fav:'apv_favorites',
  history:'apv_history',
  searchHistory:'apv_search_history',
  unlocked:'apv_unlocked',
  unlockTimes:'apv_unlock_times',
  welcome:'apv_welcome_state',
  settings:'apv_settings',
  adCycle:'apv_ad_cycle',
  promptAds:'apv_prompt_ads',
  firstSeen:'apv_first_seen',
  dailyOpens:'apv_daily_opens'
};

const MAX_STORAGE_BYTES=4.5*1024*1024;

const bytesUsed=()=>{
  try{
    let n=0;
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i)||'';
      const v=localStorage.getItem(k)||'';
      n+=(k.length+v.length)*2;
    }
    return n;
  }catch{return 0}
};

const pruneHistory=()=>{
  try{
    localStorage.removeItem(K.history);
    localStorage.removeItem(K.searchHistory);
  }catch{}
};

const get=(k,d)=>{
  try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}
};

const set=(k,v)=>{
  const value=JSON.stringify(v);
  try{
    if(bytesUsed()+((k.length+value.length)*2)>MAX_STORAGE_BYTES){
      pruneHistory();
    }
    localStorage.setItem(k,value);
  }catch(e){
    // If storage is full, history/search are disposable. Preserve unlock/favorites.
    pruneHistory();
    try{localStorage.setItem(k,value)}catch{}
  }
};

const localDateKey=()=>{
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

export const store={
  favorites:()=>get(K.fav,[]),
  toggleFavorite:id=>{
    let a=get(K.fav,[]);
    a=a.includes(id)?a.filter(x=>x!==id):[...a,id];
    set(K.fav,a);return a.includes(id)
  },

  history:()=>get(K.history,[]),
  addHistory:id=>{
    const a=get(K.history,[]).filter(x=>x!==id);
    set(K.history,[id,...a].slice(0,5));
  },

  searchHistory:()=>get(K.searchHistory,[]),
  addSearch:q=>{
    const a=get(K.searchHistory,[]).filter(x=>x.toLowerCase()!==q.toLowerCase());
    set(K.searchHistory,[q,...a].slice(0,8));
  },
  clearSearchHistory:()=>localStorage.removeItem(K.searchHistory),

  // Premium unlocks expire 6 hours after the prompt was unlocked.
  // Expired unlocks AND their ad progress are removed automatically.
  unlocked:()=>{
    const a=get(K.unlocked,[]);
    const times=get(K.unlockTimes,{});
    const ads=get(K.promptAds,{});
    const now=Date.now();
    const SIX_HOURS=6*60*60*1000;
    let changed=false;

    const active=a.filter(id=>{
      const t=Number(times[id]||0);

      // Migrate old unlocks that were saved before the 6-hour system.
      if(!t){
        times[id]=now;
        changed=true;
        return true;
      }

      if(now-t>=SIX_HOURS){
        delete times[id];
        delete ads[id];
        changed=true;
        return false;
      }
      return true;
    });

    // Remove stale timestamps that no longer have an unlock.
    for(const id of Object.keys(times)){
      if(!active.includes(id)){
        delete times[id];
        changed=true;
      }
    }

    if(changed){
      set(K.unlocked,active);
      set(K.unlockTimes,times);
      set(K.promptAds,ads);
    }
    return active;
  },

  unlock:id=>{
    const a=store.unlocked();
    const times=get(K.unlockTimes,{});
    if(!a.includes(id))a.push(id);
    times[id]=Date.now();
    set(K.unlocked,a);
    set(K.unlockTimes,times);
  },

  getPromptAdCount:id=>{
    // Also triggers 6-hour expiry cleanup for this prompt.
    store.unlocked();
    return Number(get(K.promptAds,{})[id]||0);
  },
  incrementPromptAd:id=>{
    const a=get(K.promptAds,{});
    a[id]=Number(a[id]||0)+1;
    set(K.promptAds,a);
    return a[id];
  },

  welcomeState:()=>get(K.welcome,{count:0,lastShownDate:null}),
  markWelcomeShown:date=>{
    const s=get(K.welcome,{count:0,lastShownDate:null});
    const next={count:Math.min(10,(Number(s.count)||0)+1),lastShownDate:date};
    set(K.welcome,next);return next;
  },

  settings:()=>get(K.settings,{notifications:true}),
  setSettings:v=>set(K.settings,v),

  // Global rewarded-ad checkpoint. It persists across app restarts.
  adCycle:()=>{
    const d=get(K.adCycle,null);
    if(d&&Number.isInteger(d.target)&&d.target>=15&&d.target<=30&&Number.isInteger(d.count)&&d.count>=0)return d;
    const fresh={target:15+Math.floor(Math.random()*16),count:0};
    set(K.adCycle,fresh);return fresh;
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
    set(K.adCycle,fresh);return fresh;
  },

  // "Account age" here means first use of this Mini App on this browser.
  // Telegram does not expose the real Telegram-account creation date to a Mini App.
  firstSeen:()=>{
    let t=Number(localStorage.getItem(K.firstSeen)||0);
    if(!t||!Number.isFinite(t)){
      t=Date.now();
      try{localStorage.setItem(K.firstSeen,String(t))}catch{}
    }
    return t;
  },
  appAgeDays:()=>Math.floor((Date.now()-store.firstSeen())/86400000),

  // Count app opens per local calendar day. First two opens are ad-free.
  dailyOpenState:()=>{
    const today=localDateKey();
    const d=get(K.dailyOpens,{date:today,count:0});
    if(d.date!==today)return {date:today,count:0};
    return {date:today,count:Number(d.count)||0};
  },
  recordDailyOpen:()=>{
    const today=localDateKey();
    const d=store.dailyOpenState();
    const next={date:today,count:d.date===today?d.count+1:1};
    set(K.dailyOpens,next);
    return next;
  },

  storageBytes:bytesUsed,
  clear:()=>Object.keys(localStorage).filter(k=>k.startsWith('apv_')).forEach(k=>localStorage.removeItem(k))
};
