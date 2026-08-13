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
  dailyOpens:'apv_daily_opens',
  promptResetDate:'apv_prompt_reset_date'
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

  // Premium unlocks + per-prompt ad progress reset once per local calendar day.
  // All prompts unlocked/watched today are cleared together on the next day.
  // Other LocalStorage data (favorites, history, settings, welcome, ad cycle, etc.)
  // is intentionally preserved.
  resetDailyPromptState:()=>{
    const today=localDateKey();
    const last=localStorage.getItem(K.promptResetDate);

    if(last===today)return false;

    // First run: establish the current day without deleting anything.
    if(!last){
      try{localStorage.setItem(K.promptResetDate,today)}catch{}
      return false;
    }

    // New day: reset ONLY prompt unlock/ad-progress state.
    try{
      localStorage.removeItem(K.unlocked);
      localStorage.removeItem(K.unlockTimes);
      localStorage.removeItem(K.promptAds);
      localStorage.setItem(K.promptResetDate,today);
    }catch{}
    return true;
  },

  unlocked:()=>{
    store.resetDailyPromptState();
    return get(K.unlocked,[]);
  },

  unlock:id=>{
    store.resetDailyPromptState();
    const a=get(K.unlocked,[]);
    const times=get(K.unlockTimes,{});
    if(!a.includes(id))a.push(id);
    times[id]=Date.now();
    set(K.unlocked,a);
    set(K.unlockTimes,times);
  },

  getPromptAdCount:id=>{
    store.resetDailyPromptState();
    return Number(get(K.promptAds,{})[id]||0);
  },

  incrementPromptAd:id=>{
    store.resetDailyPromptState();
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

  if(
    d &&
    Number.isInteger(d.target) &&
    d.target>=15 &&
    d.target<=30 &&
    Number.isInteger(d.count) &&
    d.count>=0
  ){
    // 2-hour cooldown check
    if(d.cooldownUntil && Date.now() < d.cooldownUntil){
      return d;
    }

    // Cooldown finished → start a new cycle
    if(d.cooldownUntil && Date.now() >= d.cooldownUntil){
      const fresh={
        target:15+Math.floor(Math.random()*16),
        count:0,
        cooldownUntil:0
      };
      set(K.adCycle,fresh);
      return fresh;
    }

    return d;
  }

  const fresh={
    target:15+Math.floor(Math.random()*16),
    count:0,
    cooldownUntil:0
  };

  set(K.adCycle,fresh);
  return fresh;
},

recordRewardedUnlock:()=>{
  const d=store.adCycle();

  // Already in cooldown
  if(d.cooldownUntil && Date.now() < d.cooldownUntil){
    return {
      reached:true,
      cooldown:true,
      previousTarget:d.target,
      state:d
    };
  }

  const next={
    ...d,
    count:d.count+1
  };

  if(next.count>=next.target){

    // 2-hour cooldown starts now
    const cooldownUntil=Date.now()+(2*60*60*1000);

    const locked={
      ...next,
      cooldownUntil
    };

    set(K.adCycle,locked);

    return {
      reached:true,
      cooldown:true,
      previousTarget:d.target,
      state:locked
    };
  }

  set(K.adCycle,next);

  return {
    reached:false,
    cooldown:false,
    previousTarget:d.target,
    state:next
  };
},

resetAdCycle:()=>{
  const fresh={
    target:15+Math.floor(Math.random()*16),
    count:0,
    cooldownUntil:0
  };

  set(K.adCycle,fresh);
  return fresh;
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
