// Prompt categories stay in this module.
// Individual prompt posts are stored as separate JSON files in ./data/.
// Add the JSON filename to ./data/index.json when publishing a new post.
export const categories=['New','All','Trending','Boy','Girl','Premium','Thumbnail','Outfit','Filter','Cinematic','Realistic'];

const DATA_INDEX_URL='./data/index.json';



const normalizePrompt=(raw,source)=>{
  if(!raw || typeof raw!=='object' || Array.isArray(raw)){
    throw new Error(`Invalid prompt JSON: ${source}`);
  }

  const id=String(raw.id??'').trim();
  if(!id) throw new Error(`Prompt id is missing: ${source}`);

  return {
    ...raw,
    id,
    title:String(raw.title??'').trim(),
    date:String(raw.date??'').trim(),
    category:Array.isArray(raw.category)?raw.category.map(String):[],
    tags:Array.isArray(raw.tags)?raw.tags.map(String):[],
    image:String(raw.image??''),
    description:String(raw.description??''),
    prompt:String(raw.prompt??''),
    youtube:raw.youtube?String(raw.youtube):'',
    premium:Boolean(raw.premium),
    adLimit:Math.max(1,Number(raw.adLimit)||1)
  };
};

export async function loadPrompts(){
  const indexResponse=await fetch(DATA_INDEX_URL,{cache:'no-store'});
  if(!indexResponse.ok) throw new Error(`Prompt index failed: ${indexResponse.status}`);

  const indexData=await indexResponse.json();
  const files=Array.isArray(indexData)
    ? indexData
    : Array.isArray(indexData?.files) ? indexData.files : [];

  if(!files.length) return [];

  const posts=await Promise.all(files.map(async file=>{
    const name=String(file||'').trim();
    if(!name || !/^[a-zA-Z0-9._-]+\.json$/.test(name)){
      throw new Error(`Invalid prompt filename: ${name}`);
    }

    const response=await fetch(`./js/data/${encodeURIComponent(name)}`,{cache:'no-store'});

    if(!response.ok) throw new Error(`Prompt file failed: ${name}`);

    const data=await response.json();
    return normalizePrompt(data,name);
  }));

  const ids=new Set();
  for(const post of posts){
    if(ids.has(post.id)) throw new Error(`Duplicate prompt id: ${post.id}`);
    ids.add(post.id);
  }

  return posts;
}
