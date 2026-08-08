# AI Prompt Vault

Static Telegram Mini App. No database, backend, Firebase, Supabase, MongoDB, MySQL, PostgreSQL, Node.js backend, PHP or Express.

## Stack
- HTML5
- CSS3
- Vanilla JavaScript ES modules
- Telegram WebApp SDK
- Browser LocalStorage

## Deploy with GitHub + Cloudflare Pages
1. Create a GitHub repository.
2. Upload all files preserving folders.
3. In Cloudflare Pages, connect the repository.
4. Framework preset: None.
5. Build command: leave empty.
6. Output directory: `/` (root).
7. Deploy.
8. Use the deployed HTTPS URL in Telegram BotFather Mini App/Web App configuration.

## Data
Favorites, history, theme, language, settings and unlocked prompt IDs are stored only in the user's browser LocalStorage. Clearing browser/site data clears them.

## Important
This version intentionally has no coins, daily bonus, points or database.
Ads are represented by a clearly labeled demo unlock flow; real ad-network integration requires the provider's current SDK/policy and cannot be faked as a guaranteed rewarded ad.

## How to post into a specific category
Open `js/data.js`. Add a new object inside the `prompts` array. The key field is:
`category:['AI Girl','Cinematic','Trending']`
Put every category where the post should appear. No database is required.

Example:
```js
{id:'p5',title:'My New Prompt',category:['AI Girl','Cinematic','Trending'],rating:0,uses:'0',premium:false,unlock:0,tags:['Girl','Cinematic'],image:'https://example.com/image.jpg',description:'Short description.',prompt:'Your full AI prompt here.',youtube:'https://www.youtube.com/watch?v=VIDEO_ID'}
```
Use **1280 × 720 px (16:9)** for the thumbnail.
Each category/search page starts with **5 posts** and loads **3 more** when the user reaches the bottom.
Favorites use LocalStorage. History stores the last **5 viewed posts**.


## UI update
- Profile navigation and profile drawer option removed.
- Premium prompts keep the complete prompt text in the page but blur it until unlock.
- Search input updates results without replacing the input element, so deleting text does not hide the mobile keyboard after one character.
- Search history is saved in LocalStorage (up to 8 recent searches).
- Prompt cards are single-column YouTube-style 16:9 thumbnails.
- Category labels use Girl/Boy instead of AI Girl/AI Boy and include visual icons.
- The welcome message is shown as a premium popup for the first 10 app opens, controlled by LocalStorage.
- Added animated mesh gradients, glass surfaces, micro-interactions and premium motion styling.
