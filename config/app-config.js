export const APP_CONFIG={
  name:'PROMT DEX',
  version:'2.0.0',
  storage:'localStorage',
  database:false,
  backend:false,
  botUsername:'PromtDex_bot',

  
  monetagZoneParts:['11','55','73','45'],

  monetagSdkUrl:'https://alwingulla.com/88/tag.min.js',
  vpnCheckUrl:'https://iplogs.com/v1/check',
  vpnCheckTimeoutMs:2600
};

export const getMonetagZone=()=>APP_CONFIG.monetagZoneParts.join('');
11480099
