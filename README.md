# PROMT DEX

Telegram Mini App for a premium AI prompt collection.

## Stack
- HTML5 / CSS3 / Vanilla JavaScript ES6
- Telegram WebApp SDK
- Browser LocalStorage
- No Firebase / Supabase / SQL / Node backend

## Important security behavior

### 1. Telegram-only access
The app checks Telegram WebApp `initData`. A normal browser opening the Vercel/Cloudflare URL is blocked.

This is a client-side gate, not a cryptographic security boundary. A determined attacker can inspect or modify frontend JavaScript. For truly server-enforced access, Telegram `initData` must also be validated on a server.

### 2. VPN / proxy / Tor detection
After the first paint, the app checks the visitor IP through IPLogs' public VPN detection API. A positive VPN/Tor/proxy signal blocks the Mini App.

If the detection service is temporarily unavailable, the app does not lock genuine Telegram users out. This avoids turning an external security service outage into a full app outage.

VPN detection is never 100% perfect; residential proxies and new VPN ranges can evade any IP-based detector.

## Monetag rewarded unlock

The premium unlock uses Monetag Rewarded Interstitial.

The app only unlocks a premium prompt after the Monetag SDK Promise resolves. If the ad cannot load, is rejected, times out, or returns a non-valued reward event, the prompt remains locked and a solution popup appears with:
- Try Again
- YouTube Solution

Monetag recommends using the main zone ID and granting the reward from the confirmed frontend callback. See the current Monetag TMA documentation for the exact tag supplied by your dashboard.

### Change the Monetag Zone ID

Open:

`config/app-config.js`

Find:

```js
monetagZone:'11557345'
```

The parts join together to make the current zone:

`16 + 84 + 68 + 55 = 16846855`

For a new zone, split its digits into several pieces. Example for `12345678`:

```js
monetagZoneParts:['12','34','56','78']
```

Do not change `monetagSdkUrl` unless Monetag gives you a different SDK tag in the dashboard.

## Change bot username

Open:

`config/app-config.js`

Change:

```js
botUsername:'PromtDex_bot'
```

Use the username without `@`.

## Change the app name

The visible name is `PROMT DEX` in:
- `config/app-config.js`
- `index.html`
- `manifest.json`
- `js/app.js`

## Logo

`assets/logo.webp` is the supplied logo reduced from 1536×1536 to 128×128 for fast loading.

For the Telegram bot profile logo itself, upload the same image through BotFather; changing a website file cannot change the bot's Telegram profile photo.

## Categories

Edit:

`js/data.js`

A prompt can belong to multiple categories:

```js
category:['Girl','Cinematic','Trending']
```

Premium category membership is automatic when:

```js
premium:true
```

## LocalStorage

Favorites, history, search history, welcome-popup state and unlocked prompt IDs stay in the browser.

History keeps the last 5 prompts.

## Performance fixes included

- Asynchronous Monetag loading after first paint
- Monetag preload after startup
- Lazy + async image decoding
- No full-page rerender while typing in search
- Horizontal category scroll position is preserved after selecting a category
- Reduced logo asset size
- No unnecessary backend request for the main page
- Premium unlock failure does not unlock content

## Deploy

### Vercel
Import the repository as a static project.

- Framework preset: Other / None
- Build command: empty
- Output directory: `.`

No build step is required.

### Cloudflare Pages
- Framework preset: None
- Build command: empty
- Output directory: `/`

## Telegram setup

Create the Mini App with BotFather and use the deployed HTTPS URL as the Mini App URL.

Test Monetag inside the real Telegram Mini App. Monetag's documentation specifically recommends testing in Telegram rather than only in a normal browser.

## Share

The Share button provides:
- Telegram
- Facebook
- WhatsApp
- Messenger
- Notes / Copy
- More apps (native share sheet when supported)

The exact apps shown by the operating system depend on which apps are installed.

## License

See `LICENSE`.


### Rewarded-ad behavior
Premium unlock uses the ad provider's rewarded result. The app does not force users to click ads or delay/auto-close an ad at a random second. Users can close an ad, but no reward is granted unless the provider confirms the rewarded result.

A persistent LocalStorage checkpoint randomly selects 15–30 successful rewarded unlocks. When that checkpoint is reached, the next unlock attempt shows a small "Continue to Ad" notice. The checkpoint survives app restarts and resets to a new random 15–30 target after it is reached.
