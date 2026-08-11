import {prompts,categories} from './data.js';
import {store} from './storage.js';
import {APP_CONFIG} from '../config/app-config.js';

const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand()}
const app=document.querySelector('#app');
let route='home',query='',cat='All',visibleCount=5,lastListKey='';
const startParam=tg?.initDataUnsafe?.start_param;

if(startParam && prompts.some(p=>p.id===startParam)){
 route='details:'+startParam;
}
const user=tg?.initDataUnsafe?.user;

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const icon={All:'✨',Boy:'👨‍🎨',Girl:'👩‍🎨',Premium:'👑',Thumbnail:'▶️',Outfit:'👗',Filter:'🎨',Cinematic:'🎬',Realistic:'📷',Trending:'🔥'};

function header(){return `<header class="header"><button class="icon" onclick="openDrawer()" aria-label="Menu">☰</button><div class="brand"><span class="brandmark">✦</span><span>AI Prompt Vault</span></div><button class="icon" onclick="go('search')" aria-label="Search">⌕</button></header>`}
function nav(){return `<div class="bottom"><nav class="nav">
<button class="${route==='home'?'active':''}" onclick="go('home')"><span>⌂</span>Home</button>
<button class="${route==='search'?'active':''}" onclick="go('search')"><span>⌕</span>Explore</button>
<button class="${route==='favorites'?'active':''}" onclick="go('favorites')"><span>♥</span>Saved</button>
<button class="${route==='history'?'active':''}" onclick="go('history')"><span>◷</span>History</button>
</nav></div>`}

function categoryChips(){return `<div class="chips">${categories.map(x=>`<button class="chip ${cat===x?'active':''}" onclick="filterCat('${x}')"><span>${icon[x]||'•'}</span>${esc(x)}</button>`).join('')}</div>`}

function card(p){const fav=store.favorites().includes(p.id);return `<article class="card" onclick="openPrompt('${p.id}')">
<div class="thumbwrap"><img class="thumb" src="${p.image}" alt="${esc(p.title)}" loading="lazy">
<button class="favorite-btn" onclick="event.stopPropagation();toggleFav('${p.id}')" aria-label="Favorite">${fav?'♥':'♡'}</button></div>
<div class="cardbody"><div class="title">${esc(p.title)}</div><div class="meta">${p.category.slice(0,2).map(x=>esc(x)).join(' • ')}</div>${p.premium?'<span class="badge">👑 Premium</span>':''}</div></article>`}

function resetPagination(key){if(lastListKey!==key){lastListKey=key;visibleCount=5}}
function loadMore(){visibleCount+=3;render()}
function moreButton(list){return visibleCount<list.length?`<button class="btn secondary" style="width:100%;margin-top:14px" onclick="loadMore()">Load 3 more</button>`:''}
function listFor(){return prompts.filter(p=>(cat==='All'||p.category.includes(cat))&&(p.title+' '+p.tags.join(' ')+' '+p.description).toLowerCase().includes(query.toLowerCase()))}

function home(){
 const list=cat==='All'?prompts:prompts.filter(p=>p.category.includes(cat));resetPagination('home|'+cat);
 return `<section class="page"><div class="hero"><div class="eyebrow">Premium AI prompt collection</div><h1>Create better with ready-to-use prompts.</h1><p class="muted">Browse, save and unlock prompts. Favorites and history stay in your browser.</p></div>${categoryChips()}<div class="sectionhead"><h2>${icon[cat]||'✦'} ${cat==='All'?'Trending Today':esc(cat)}</h2></div><div class="grid">${list.slice(0,visibleCount).map(card).join('')||'<div class="empty">No posts in this category.</div>'}</div>${moreButton(list)}</section>`
}

function searchResultsHtml(){
 const list=listFor();resetPagination('search|'+cat+'|'+query);
 const shown=list.slice(0,visibleCount);
 return `${shown.map(card).join('')||'<div class="empty">No prompts found.</div>'}${moreButton(list)}`
}

function searchHistoryHtml(){
 const h=store.searchHistory();
 if(!h.length)return '';
 return `<div class="sectionhead"><h2>Recent searches</h2><button class="chip" onclick="clearSearchHistory()">Clear</button></div><div class="chips">${h.map(q=>`<button class="chip" onclick="useSearch(${JSON.stringify(q).replace(/</g,'\\u003c')})">⌕ ${esc(q)}</button>`).join('')}</div>`
}

function searchPage(){
 return `<section class="page"><div class="hero" style="padding-bottom:8px"><div class="eyebrow">Explore the vault</div><h1 style="font-size:30px">Find your next prompt.</h1></div>
<div class="searchwrap"><input id="searchInput" class="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Search AI prompts..." value="${esc(query)}" oninput="search(this.value)" onkeydown="if(event.key==='Enter')saveCurrentSearch()"><span class="searchicon">⌕</span></div>
${categoryChips()}${searchHistoryHtml()}<div id="search-results" class="grid">${searchResultsHtml()}</div></section>`
}

function details(id){
 let p=prompts.find(x=>x.id===id);if(!p)return '<section class="page"><div class="empty">Prompt not found.</div></section>';
 
 const shareLink=`https://t.me/${APP_CONFIG.botUsername}?startapp=${p.id}`;
 
 
 store.addHistory(id);let unlocked=store.unlocked().includes(id);
 return `<section class="page detail"><button class="btn secondary" onclick="goBack()">← Back</button><div style="height:12px"></div>
<img src="${p.image}" alt="${esc(p.title)}"><h1>${esc(p.title)}</h1><div class="meta">${p.category.map(x=>esc(x)).join(' • ')}</div><p class="muted">${esc(p.description)}</p>
<div class="tags">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
${p.premium&&!unlocked?`<div class="lock"><h3>🔐 Premium Prompt</h3><p class="muted">The complete prompt is here, but protected with a premium blur. Unlock it to reveal and copy the text.</p>
<div class="blurred-prompt">${esc(p.prompt)}<div class="blur-cover">🔒 Unlock to reveal</div></div><div class="progress"><i style="width:72%"></i></div><button class="btn" onclick="unlockPrompt('${p.id}')">▶ Watch Ad to Unlock</button></div>`
:`<div class="lock"><h3>📋 Full Prompt</h3><p style="line-height:1.7">${esc(p.prompt)}</p><div class="actions"><button class="btn" onclick="copyPrompt('${p.id}')">📋 Copy Prompt</button><button class="btn secondary" onclick="sharePrompt('${p.id}')">📤 Share</button><button class="btn secondary" onclick="toggleFav('${p.id}')">♥ ${store.favorites().includes(p.id)?'Saved':'Save'}</button><a class="btn secondary" href="${p.youtube}" target="_blank" rel="noopener">▶ YouTube Guide</a></div></div>`}
</section>`
}

function favorites(){let a=store.favorites();return `<section class="page"><div class="hero"><div class="eyebrow">Your collection</div><h1 style="font-size:30px">Saved prompts.</h1><p class="muted">Favorites are stored only in this browser.</p></div><div class="grid">${prompts.filter(p=>a.includes(p.id)).map(card).join('')||'<div class="empty">♡ No saved prompts yet.</div>'}</div></section>`}
function historyPage(){let a=store.history().slice(0,5);let list=a.map(id=>prompts.find(p=>p.id===id)).filter(Boolean);return `<section class="page"><div class="hero"><div class="eyebrow">Recently viewed</div><h1 style="font-size:30px">Your history.</h1><p class="muted">The last five viewed prompts are saved only in this browser.</p></div><div class="grid">${list.map(card).join('')||'<div class="empty">◷ No history yet.</div>'}</div></section>`}

function render(){
 let content=route==='home'?home():route==='search'?searchPage():route==='favorites'?favorites():route==='history'?historyPage():details(route.split(':')[1]);
 app.innerHTML=`<div class="app">${header()}${content}${nav()}</div>
 <div id="drawer" class="drawer" onclick="closeDrawer()"><aside class="drawerbox" onclick="event.stopPropagation()"><div class="brand" style="margin-bottom:18px"><span class="brandmark">✦</span>AI Prompt Vault</div>
 <a href="#" onclick="go('home')">🏠 Home</a><a href="#" onclick="go('search')">🔍 Explore</a><a href="#" onclick="go('favorites')">❤️ Favorites</a><a href="#" onclick="go('history')">🕐 History</a><a href="#" onclick="closeDrawer()">✕ Close</a></aside></div>`;
}

// The welcome popup is an entry-only experience: it can appear at most once per
// calendar day, and for at most 10 unique days for a browser's localStorage.
function localDateKey(){
 const d=new Date();
 const y=d.getFullYear();
 const m=String(d.getMonth()+1).padStart(2,'0');
 const day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
}

function maybeShowWelcome(){
 const today=localDateKey();
 const state=store.welcomeState();
 if((Number(state.count)||0)>=10 || state.lastShownDate===today || document.querySelector('.popup-backdrop'))return;
 store.markWelcomeShown(today);
 const el=document.createElement('div');el.className='popup-backdrop';el.innerHTML=`<div class="popup" role="dialog" aria-modal="true">
 <div class="popup-orb">✦</div><h2>Premium AI prompt collection</h2><p class="muted">Create better with ready-to-use prompts.<br>Browse, save and unlock prompts. Favorites and history stay in your browser.</p>
 <button class="btn" onclick="closeWelcome()">Got it — Explore</button></div>`;
 document.body.appendChild(el);
}
window.closeWelcome=()=>document.querySelector('.popup-backdrop')?.remove();

window.go=r=>{route=r;query=r==='search'?'':query;render();scrollTo(0,0)};
window.openPrompt=id=>go('details:'+id);
window.goBack=()=>go('home');
window.filterCat=c=>{cat=c;query='';route='search';render();requestAnimationFrame(()=>document.querySelector('.chips')?.scrollIntoView({block:'nearest'}))};
window.search=q=>{
 query=q;
 const out=document.querySelector('#search-results');
 if(out){out.innerHTML=searchResultsHtml();}
 // Do not rerender the input: this keeps focus and the Android keyboard open.
};
window.saveCurrentSearch=()=>{if(query.trim())store.addSearch(query.trim());render();requestAnimationFrame(()=>{const i=document.querySelector('#searchInput');i?.focus();i?.setSelectionRange(i.value.length,i.value.length)})};
window.useSearch=q=>{query=q;render();requestAnimationFrame(()=>document.querySelector('#searchInput')?.focus())};
window.clearSearchHistory=()=>{store.clearSearchHistory();render()};
window.openDrawer=()=>document.querySelector('#drawer')?.classList.add('open');window.closeDrawer=()=>document.querySelector('#drawer')?.classList.remove('open');
window.toggleFav=id=>{store.toggleFavorite(id);render()};
window.copyPrompt=async id=>{let p=prompts.find(x=>x.id===id);try{await navigator.clipboard.writeText(p.prompt);alert('Prompt copied!')}catch{alert('Copy failed. Please select the prompt manually.')}};
window.unlockPrompt=id=>{if(confirm('Demo rewarded-ad step: press OK to simulate ad completion and reveal this premium prompt.')){store.unlock(id);render()}};
window.sharePrompt=async id=>{
 const p=prompts.find(x=>x.id===id);
 const link=`https://t.me/${APP_CONFIG.botUsername}?startapp=${p.id}`;
 const text=`${p.title}\n\n${p.description}\n\n${link}`;

 if(navigator.share){
   try{
     await navigator.share({
       title:p.title,
       text:text
     });
   }catch{}
 }else{
   await navigator.clipboard.writeText(text);
   alert('Share link copied!');
 }
};
render();
// Show the welcome popup only once when the app is first opened for the day.
maybeShowWelcome();
window.addEventListener('scroll',()=>{if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-160){let list=route==='search'?listFor():(route==='home'?(cat==='All'?prompts:prompts.filter(p=>p.category.includes(cat))):[]);if(visibleCount<list.length)loadMore()}},{passive:true});
