export const APP_CONFIG={
  name:'PROMT DEX',
  version:'2.0.0',
  storage:'localStorage',
  database:false,
  backend:false,
  botUsername:'PromtDex_bot',
  monetagZone:'11557345',
  monetagSdkUrl:'//libtl.com/sdk.js',
  vpnCheckUrl:'https://iplogs.com/v1/check',
  vpnCheckTimeoutMs:2600
};

export const getMonetagZone=()=>APP_CONFIG.monetagZone;
