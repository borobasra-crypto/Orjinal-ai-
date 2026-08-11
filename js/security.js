import {APP_CONFIG} from '../config/app-config.js';

const wait=ms=>new Promise(r=>setTimeout(r,ms));

function telegramIsRealEnough(tg){
  // A normal browser can load telegram-web-app.js, but it does not receive
  // Telegram's signed initData. This is therefore a useful Mini-App gate.
  return !!(tg && typeof tg.initData==='string' && tg.initData.length>0);
}

export function isTelegramMiniApp(tg){
  return telegramIsRealEnough(tg);
}

export async function runVpnCheck(){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),APP_CONFIG.vpnCheckTimeoutMs);
  try{
    const r=await fetch(APP_CONFIG.vpnCheckUrl,{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        user_agent:navigator.userAgent,
        timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||'',
        language:navigator.language||''
      }),
      signal:controller.signal,
      cache:'no-store',
      credentials:'omit'
    });
    if(!r.ok) return {checked:false,blocked:false};
    const d=await r.json();
    const matched=(Array.isArray(d.signals)?d.signals:[]).filter(x=>x?.matched).map(x=>x.type);
    const blocked=Boolean(
      d.is_vpn===true ||
      d.verdict==='vpn_detected' ||
      matched.some(x=>['known_vpn_exact','known_vpn_cidr','vpn_asn','vpn_org_keyword','tor_exit','ja3_known_vpn','active_probe_openvpn','active_probe_wireguard','active_probe_ikev2','active_probe_reality'].includes(x))
    );
    return {checked:true,blocked,verdict:d.verdict||'',signals:matched};
  }catch{
    // Security APIs can be temporarily unavailable. Do not lock out genuine
    // Telegram users just because the external detector is down.
    return {checked:false,blocked:false};
  }finally{
    clearTimeout(timer);
  }
}

export async function checkAccess(tg){
  if(!telegramIsRealEnough(tg)){
    return {allowed:false,reason:'telegram'};
  }
  // Let Telegram paint the first frame before the external security request.
  await wait(250);
  const vpn=await runVpnCheck();
  if(vpn.blocked) return {allowed:false,reason:'vpn',details:vpn};
  return {allowed:true,reason:'ok',details:vpn};
}
