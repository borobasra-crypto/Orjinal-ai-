const K={fav:'apv_favorites',history:'apv_history',searchHistory:'apv_search_history',unlocked:'apv_unlocked',welcome:'apv_welcome_count',settings:'apv_settings'};
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
welcomeCount:()=>get(K.welcome,0),
incrementWelcome:()=>set(K.welcome,get(K.welcome,0)+1),
settings:()=>get(K.settings,{notifications:true}),
setSettings:v=>set(K.settings,v),
clear:()=>Object.keys(localStorage).filter(k=>k.startsWith('apv_')).forEach(k=>localStorage.removeItem(k))
};
