export const APP_CONFIG={
  name:'PROMT DEX',
  version:'2.0.0',
  storage:'localStorage',
  database:false,
  backend:false,
  botUsername:'PromtDex_bot',

  // Monetag main zone. It is assembled at runtime so the full number is not
  // sitting as a plain-text literal in the source. This is obfuscation only,
  // not a security boundary.
  monetagZoneParts:['16','84','68','55'],

  monetagSdkUrl:'https://alwingulla.com/88/tag.min.js',
  vpnCheckUrl:'https://iplogs.com/v1/check',
  vpnCheckTimeoutMs:2600
};

export const getMonetagZone=()=>APP_CONFIG.monetagZoneParts.join('');
