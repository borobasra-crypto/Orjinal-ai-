const _x = (() => {
  const a = [
    108, 104, 102, 102,
    100, 96, 97, 96
  ];

  const b = [
    5, 7, 3, 3,
    3, 3, 3, 5
  ];

  const c = a.map((v, i) => v + b[i]);

  return String.fromCharCode(...c);
})();


export const APP_CONFIG = Object.freeze({
  name: 'PROMT DEX',
  version: '2.0.0',
  storage: 'localStorage',
  database: false,
  backend: false,
  botUsername: 'PromtDex_bot',

  monetagZone: _x,

  monetagSdkUrl: '//libtl.com/sdk.js',
  vpnCheckUrl: 'https://iplogs.com/v1/check',
  vpnCheckTimeoutMs: 2600
});


export const getMonetagZone = () => APP_CONFIG.monetagZone;
