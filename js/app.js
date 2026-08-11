ector('#app');
let route='home',query='',cat='All',visibleCount=5,lastListKey='';
let categoryScrollLeft=0;
let monetagPromise=null;
const startParam=tg?.initDataUnsafe?.start_param;

if(startParam && prompts.some(p=>p.id===startParam)) route='details:'+startParam;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const icon={New:'✨',All:'✨',Trending:'🔥',Boy:'👨‍🎨',Girl:'👩‍🎨',Premium:'👑',Thumbnail:'▶️',Outfit:'👗',Filter:'🎨',Cinematic:'🎬',Realistic:'📷'};

const bookmarkIcon=filled=>filled
?`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5A2.5 2.5 0 0 1 8.5 1h7A2.5 2.5 0 0 1 18 3.5V22l-6-3.5L6 22V3.5Z" fill="currentColor"/></svg>`
:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 2h7A1.5 1.5 0 0 1 17 3.5v15.9l-5-2.92-5 2.92V3.5A1.5 1.5 0 0 1 8.5 2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

const shareIcon=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0 4.5 4.5M12 3 7.5 7.5M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function header(){
 return `<header class="header">
 <button class="icon" onclick="openDrawer()" aria-label="Menu">☰</button>
 <div class="brand"><img class="brand-logo" src="assets/logo.webp" alt=""><span>PROMT DEX</span></div>
 <button class="icon" onclick="go('search')" aria-label="Search">⌕</button>
 </header>`;
}
function nav(){
 return `<div class="bottom"><nav class="nav">
 <button class="${route==='home'?'active':''}" onclick="go('home')"><span>⌂</span>Home</button>
 <button class="${route==='search'?'active':''}" onclick="go('search')"><span>⌕</span>Explore</button>
 <button class="${route==='favorites'?'active':''}" onclick="go('favorites')"><span class="nav-save-icon">${bookmarkIcon(route==='favorites')}</span>Saved</button>
 
 <button class="${route==='history'?'active':''}" onclick="go('history')"><span>◷</span>History</button>
 </nav></div>`;
}
function categoryChips(){
 return `<div class="chips" id="categoryChips">${categories.map(x=>`<button class="chip ${cat===x?'active':''}" onclick="filterCat('${esc(x)}')"><span>${icon[x]||'•'}</span>${esc(x)}</button>`).join('')}</div>`;
}
function card(p){
 const fav=store.favorites().includes(p.id);
 return `<article class="card" onclick="openPrompt('${esc(p.id)}')">
 <div class="thumbwrap"><img class="thumb" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" decoding="async">
 <button class="favorite-btn ${fav?'saved':''}" onclick="event.stopPropagation();toggleFav('${esc(p.id)}')" aria-label="${fav?'Remove from saved':'Save prompt'}">${bookmarkIcon(fav)}</button></div>
 <div class="cardbody"><div class="title">${esc(p.title)}</div><div class="meta">${p.category.slice(0,2).map(x=>esc(x)).join(' • ')}</div><div class="post-date">📅 ${esc(p.date||'')}</div>${p.premium?'<span class="badge">👑 Premium</span>':''}</div>
 </article>`;
}
function resetPagination(key){if(lastListKey!==key){lastListKey=key;visibleCount=5}}

function loadMore(){
  const items = route === 'search'
    ? listFor()
    : prompts.filter(inCategory);

  if(visibleCount >= items.length) return;

  visibleCount += 3;
  render();
}

function moreButton(list){
  return '';
}
function inCategory(p){

if(cat==='New'){
  if(!p.date) return false;

  const today = new Date();
  today.setHours(0,0,0,0);

  const postDate = new Date(p.date+'T00:00:00');
  postDate.setHours(0,0,0,0);

  const days = Math.floor(
    (today - postDate) / (1000*60*60*24)
  );

  return days >= 0 && days < 7;
}

 if(cat==='Premium') return p.premium;
 if(cat==='All') return true;

 return p.category.includes(cat);
}
function listFor(){
 return prompts.filter(p=>inCategory(p)&&(p.title+' '+p.tags.join(' ')+' '+p.description+' '+p.prompt).toLowerCase().includes(query.toLowerCase()));
}
function home(){
 const list=prompts.filter(inCategory);resetPagination('home|'+cat);
 return `<section class="page">${categoryChips()}<div class="sectionhead"><h2>${icon[cat]||'✦'} ${cat==='All'?'Trending Today':esc(cat)}</h2></div><div class="grid">${list.slice(0,visibleCount).map(card).join('')||'<div class="empty">No posts in this category.</div>'}</div>${moreButton(list)}</section>`;
}
function searchResultsHtml(){
 const list=listFor();resetPagination('search|'+cat+'|'+query);
 return `${list.slice(0,visibleCount).map(card).join('')||'<div class="empty">No prompts found.</div>'}${moreButton(list)}`;
}
function searchHistoryHtml(){
 const h=store.searchHistory();if(!h.length)return '';
 return `<div class="sectionhead"><h2>Recent searches</h2><button class="chip" onclick="clearSearchHistory()">Clear</button></div><div class="chips">${h.map(q=>`<button class="chip" onclick="useSearch(${JSON.stringify(q).replace(/</g,'\\u003c')})">⌕ ${esc(q)}</button>`).join('')}</div>`;
}
function searchPage(){
 return `<section class="page"><div class="hero" style="padding-bottom:8px"><div class="eyebrow">Explore the vault</div><h1 style="font-size:30px">Find your next prompt.</h1></div>
 <div class="searchwrap"><input id="searchInput" class="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Search AI prompts..." value="${esc(query)}" oninput="search(this.value)" onkeydown="if(event.key==='Enter')saveCurrentSearch()"><span class="searchicon">⌕</span></div>
 ${categoryChips()}${searchHistoryHtml()}<div id="search-results" class="grid">${searchResultsHtml()}</div></section>`;
}
function details(id){
 const p=prompts.find(x=>x.id===id);
 if(!p)return '<section class="page"><div class="empty">Prompt not found.</div></section>';
 const shareLink=`https://t.me/${APP_CONFIG.botUsername}?startapp=${encodeURIComponent(p.id)}`;
 store.addHistory(id);
 const unlocked=store.unlocked().includes(id);
 return `<section class="page detail"><button class="btn secondary" onclick="goBack()">← Back</button><div style="height:12px"></div>
 <img src="${esc(p.image)}" alt="${esc(p.title)}" decoding="async"><h1>${esc(p.title)}</h1><div class="meta">${p.category.map(x=>esc(x)).join(' • ')}</div><p class="muted">${esc(p.description)}</p>
 <div class="tags">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
 ${p.premium&&!unlocked?`<div class="lock"><h3>🔐 Premium Prompt</h3><p class="muted">Watch the rewarded ad to reveal the complete prompt. If an ad is unavailable, the prompt stays locked.</p>
 <div class="blurred-prompt">${esc(p.prompt)}<div class="blur-cover">🔒 Unlock to reveal</div></div><div class="progress"><i style="width:72%"></i></div>
 <button id="unlockBtn" class="btn" onclick="unlockPrompt('${esc(p.id)}')">▶ Watch Ad to Unlock</button></div>`
 :`<div class="lock"><h3>📋 Full Prompt</h3><p style="line-height:1.7">${esc(p.prompt)}</p><div class="actions">
 <button class="btn" onclick="copyPrompt('${esc(p.id)}')">📋 Copy Prompt</button>
 <button class="btn secondary" onclick="sharePrompt('${esc(p.id)}')">${shareIcon} Share</button>
 <button class="btn secondary save-action" onclick="toggleFav('${esc(p.id)}')">${bookmarkIcon(store.favorites().includes(p.id))}<span>${store.favorites().includes(p.id)?'Saved':'Save'}</span></button>
 <a class="btn secondary" href="${esc(p.youtube)}" target="_blank" rel="noopener noreferrer">▶ YouTube Guide</a>
 </div></div>`}
 </section>`;
}
function favorites(){
 const a=store.favorites();
 return `<section class="page"><div class="hero"><div class="eyebrow">Your collection</div><h1 style="font-size:30px">Saved prompts.</h1><p class="muted">Favorites are stored only in this browser.</p></div><div class="grid">${prompts.filter(p=>a.includes(p.id)).map(card).join('')||'<div class="empty">♡ No saved prompts yet.</div>'}</div></section>`;
}
function historyPage(){
 const a=store.history().slice(0,5),list=a.map(id=>prompts.find(p=>p.id===id)).filter(Boolean);
 return `<section class="page"><div class="hero"><div class="eyebrow">Recently viewed</div><h1 style="font-size:30px">Your history.</h1><p class="muted">The last five viewed prompts are saved only in this browser.</p></div><div class="grid">${list.map(card).join('')||'<div class="empty">◷ No history yet.</div>'}</div></section>`;
}
function render(){
 const content=route==='home'?home():route==='search'?searchPage():route==='favorites'?favorites():route==='history'?historyPage():details(route.split(':')[1]);
 app.innerHTML=`<div class="app">${header()}${content}${nav()}</div>
 <div id="drawer" class="drawer" onclick="closeDrawer()"><aside class="drawerbox" onclick="event.stopPropagation()"><div class="brand" style="margin-bottom:18px"><img class="brand-logo" src="assets/logo.webp" alt="">PROMT DEX</div>
 <a href="#" onclick="event.preventDefault();go('home')">🏠 Home</a><a href="#" onclick="event.preventDefault();go('search')">🔍 Explore</a><a href="#" onclick="event.preventDefault();go('favorites')">❤️ Favorites</a><a href="#" onclick="event.preventDefault();go('history')">🕐 History</a><a href="#" onclick="event.preventDefault();closeDrawer()">✕ Close</a></aside></div>`;
}
function localDateKey(){
 const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function maybeShowWelcome(){
 const today=localDateKey(),state=store.welcomeState();
 if((Number(state.count)||0)>=10||state.lastShownDate===today||document.querySelector('.popup-backdrop'))return;
 store.markWelcomeShown(today);
 const el=document.createElement('div');el.className='popup-backdrop';el.innerHTML=`<div class="popup" role="dialog" aria-modal="true">
 <div class="popup-orb"><img src="assets/logo.webp" alt=""></div><h2>Welcome to PROMT DEX</h2><p class="muted">Premium ready-to-use AI prompts. Save your favorites, explore categories and unlock premium prompts by watching a rewarded ad.</p>
 <button class="btn" onclick="closeWelcome()">Got it — Explore</button></div>`;document.body.appendChild(el);
}
function securityBlock(reason){
 const title=reason==='vpn'?'VPN / Proxy Detected':'Telegram Only';
 const text=reason==='vpn'
 ?'PROMT DEX is available only from a normal Telegram connection. Turn off VPN, proxy or Tor and reopen the Mini App.'
 :'This app can only be opened inside the official Telegram Mini App. Please open PROMT DEX from Telegram.';
 document.body.innerHTML=`<main class="security-screen"><div class="security-card"><img src="assets/logo.webp" class="security-logo" alt="PROMT DEX"><div class="eyebrow">${esc(title)}</div><h1>Access blocked</h1><p class="muted">${esc(text)}</p><button class="btn" onclick="location.reload()">↻ Try again</button></div></main>`;
}
function adProblem(id){
 const p=prompts.find(x=>x.id===id);
 const el=document.createElement('div');el.className='popup-backdrop';el.innerHTML=`<div class="popup" role="dialog" aria-modal="true">
 <button class="popup-close" onclick="closeAdProblem()">×</button>
 <div class="popup-orb">!</div><h2>Ad is not available right now</h2>
 <p class="muted">The rewarded ad could not be loaded or confirmed. Your prompt was not unlocked. Please try again later or open the guide below for help.</p>
 <div class="actions popup-actions"><button class="btn" onclick="closeAdProblem()">Try Again</button><a class="btn secondary" href="${esc(p?.youtube||'#')}" target="_blank" rel="noopener noreferrer">▶ YouTube Solution</a></div></div>`;
 document.body.appendChild(el);
}
function closeAdProblem(){document.querySelector('.popup-backdrop')?.remove();}

function showAdCheckpoint(id){
 const p=prompts.find(x=>x.id===id);
 const state=store.adCycle();
 const el=document.createElement('div');
 el.className='popup-backdrop';
 el.id='adCheckpoint';
 el.innerHTML=`<div class="popup" role="dialog" aria-modal="true">
   <div class="popup-orb">▶</div>
   <div class="eyebrow">Rewarded Ad</div>
   <h2>Continue to unlock</h2>
   <p class="muted">You have reached this ad checkpoint. Continue to the rewarded ad to unlock the prompt. You may close the ad at any time, but closing early will not grant the reward.</p>
   <p class="ad-cycle-note">Next checkpoint: ${Math.max(0,state.target-state.count)} rewarded unlocks.</p>
   <div class="actions popup-actions">
     <button class="btn" onclick="continueCheckpoint('${esc(id)}')">Continue to Ad</button>
     <button class="btn secondary" onclick="closeCheckpoint()">Cancel</button>
   </div>
 </div>`;
 document.body.appendChild(el);
}
function closeCheckpoint(){document.querySelector('#adCheckpoint')?.remove();}
async function continueCheckpoint(id){
 closeCheckpoint();
 await unlockPrompt(id,true);
}
function showShareSheet(id){
 const p=prompts.find(x=>x.id===id);if(!p)return;
 const link=`https://t.me/${APP_CONFIG.botUsername}?startapp=${encodeURIComponent(p.id)}`;
 const text=`${p.title}\n\n${p.description}\n\n${link}`;
 const u=encodeURIComponent(link),t=encodeURIComponent(text);
 const el=document.createElement('div');el.className='popup-backdrop';el.id='shareSheet';el.innerHTML=`<div class="popup share-popup" role="dialog" aria-modal="true">
 <div class="share-head"><div><div class="eyebrow">Share prompt</div><h2>${esc(p.title)}</h2></div><button class="icon" onclick="closeShareSheet()">✕</button></div>
 <div class="share-grid">
 <button class="share-option" onclick="openShareUrl('https://t.me/share/url?url=${u}&text=${t}')"><b>✈</b><span>Telegram</span></button>
 <button class="share-option" onclick="openShareUrl('https://www.facebook.com/sharer/sharer.php?u=${u}')"><b>f</b><span>Facebook</span></button>
 <button class="share-option" onclick="openShareUrl('https://wa.me/?text=${t}')"><b>◉</b><span>WhatsApp</span></button>
 <button class="share-option" onclick="openShareUrl('fb-messenger://share/?link=${u}')"><b>⌁</b><span>Messenger</span></button>
 <button class="share-option" onclick="copyShareText(${JSON.stringify(text).replace(/</g,'\\u003c')})"><b>▣</b><span>Notes / Copy</span></button>
 <button class="share-option" onclick="nativeShare(${JSON.stringify(p.title).replace(/</g,'\\u003c')},${JSON.stringify(text).replace(/</g,'\\u003c')})"><b>↗</b><span>More apps</span></button>
 </div></div>`;
 document.body.appendChild(el);
}
function renderShareClose(){document.querySelector('#shareSheet')?.remove();}
window.closeShareSheet=renderShareClose;
window.openShareUrl=url=>{renderShareClose();window.open(url,'_blank','noopener,noreferrer');};
window.copyShareText=async text=>{try{await navigator.clipboard.writeText(text)}catch{}renderShareClose();alert('Share text copied. Paste it into Notes or any app.');};
window.nativeShare=async(title,text)=>{try{if(navigator.share)await navigator.share({title,text})}catch{}renderShareClose();};
window.sharePrompt=id=>showShareSheet(id);

async function loadMonetagSdk(){
 if(monetagPromise)return monetagPromise;
 const zone=getMonetagZone();
 monetagPromise=new Promise(resolve=>{
   const existing=document.getElementById('monetag-sdk');
   if(existing){resolve();return;}
   const s=document.createElement('script');
   s.id='monetag-sdk';s.async=true;s.src=APP_CONFIG.monetagSdkUrl;
   s.dataset.zone=zone;s.dataset.sdk=`show_${zone}`;s.dataset.cfasync='false';
   s.onload=()=>resolve();
   s.onerror=()=>resolve();
   document.head.appendChild(s);
 });
 return monetagPromise;
}
async function getAdFunction(){
 const zone=getMonetagZone(),name=`show_${zone}`;
 await loadMonetagSdk();
 if(typeof window[name]==='function')return window[name];
 const until=Date.now()+4000;
 while(Date.now()<until){
   await new Promise(r=>setTimeout(r,150));
   if(typeof window[name]==='function')return window[name];
 }
 return null;
}
async function preloadMonetag(){
 const fn=await getAdFunction();if(!fn)return;
 try{await fn({type:'preload',ymid:`preload_${Date.now()}`,requestVar:'premium_unlock'})}catch{}
}
async function unlockPrompt(id,skipCheckpoint=false){
 const btn=document.querySelector('#unlockBtn');
 if(!skipCheckpoint){
   const cycle=store.adCycle();
   if(cycle.count>=cycle.target){showAdCheckpoint(id);return;}
 }
 if(btn){btn.disabled=true;btn.textContent='⏳ Loading rewarded ad…';}
 const fn=await getAdFunction();
 if(!fn){if(btn){btn.disabled=false;btn.textContent='▶ Watch Ad to Unlock'}adProblem(id);return;}
 try{
   const event=await fn({ymid:`unlock_${id}_${Date.now()}`,requestVar:'premium_unlock'});
   // Never unlock merely because the ad was opened/closed. A provider
   // non-valued result is explicitly rejected.
   if(event?.reward_event_type==='non_valued'){adProblem(id);return;}
   store.unlock(id);
   store.recordRewardedUnlock();
   render();
 }catch{
   if(btn){btn.disabled=false;btn.textContent='▶ Watch Ad to Unlock';}
   adProblem(id);
 }
}
window.unlockPrompt=unlockPrompt;

window.closeWelcome=()=>document.querySelector('.popup-backdrop')?.remove();
window.go=r=>{route=r;query=r==='search'?'':query;visibleCount=5;lastListKey='';render();scrollTo({top:0,behavior:'auto'});};
window.openPrompt=id=>go('details:'+id);
window.goBack=()=>go('home');
window.filterCat=c=>{
 const chipWrap=document.querySelector('#categoryChips');
 if(chipWrap)categoryScrollLeft=chipWrap.scrollLeft;
 const pageY=window.scrollY;
 cat=c;query='';
 render();
 requestAnimationFrame(()=>{
   const wrap=document.querySelector('#categoryChips');
   if(wrap)wrap.scrollLeft=categoryScrollLeft;
   window.scrollTo({top:pageY,left:0,behavior:'auto'});
 });
};
window.search=q=>{
 query=q;
 const out=document.querySelector('#search-results');
 if(out)out.innerHTML=searchResultsHtml();
};
window.saveCurrentSearch=()=>{
 if(query.trim())store.addSearch(query.trim());
 render();
 requestAnimationFrame(()=>{const i=document.querySelector('#searchInput');i?.focus();i?.setSelectionRange(i.value.length,i.value.length)});
};
window.useSearch=q=>{query=q;render();requestAnimationFrame(()=>document.querySelector('#searchInput')?.focus())};
window.clearSearchHistory=()=>{store.clearSearchHistory();render()};
window.openDrawer=()=>document.querySelector('#drawer')?.classList.add('open');
window.closeDrawer=()=>document.querySelector('#drawer')?.classList.remove('open');
window.toggleFav=id=>{store.toggleFavorite(id);render()};
window.copyPrompt=async id=>{
 const p=prompts.find(x=>x.id===id);if(!p)return;
 try{await navigator.clipboard.writeText(p.prompt);alert('Prompt copied!')}catch{alert('Copy failed. Please select the prompt manually.')}
};

function init(){
 if(!isTelegramMiniApp(tg)){securityBlock('telegram');return;}
 render();
 maybeShowWelcome();
 // Monetag is loaded asynchronously after the first paint to reduce initial
 // load time. Preloading makes the unlock click faster.
 setTimeout(()=>{loadMonetagSdk().then(preloadMonetag).catch(()=>{})},650);
 // VPN check runs after first paint. A positive detection blocks the UI.
 import('./security.js').then(({runVpnCheck})=>runVpnCheck().then(result=>{if(result.blocked)securityBlock('vpn')}).catch(()=>{}));
 
 window.addEventListener('scroll',()=>{
  const list = route === 'search'
    ? listFor()
    : route === 'home'
      ? prompts.filter(inCategory)
      : [];

  const scrollBottom =
    window.scrollY + window.innerHeight;

  const pageHeight =
    document.documentElement.scrollHeight;

  if(
    scrollBottom >= pageHeight - 300 &&
    visibleCount < list.length
  ){
    loadMore();
  }
},{passive:true});
}
init();



