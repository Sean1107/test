"use strict";
/* Data-driven Pokémon GO toolkit — no account connection and no LLM API key. */
const Q=s=>document.querySelector(s), QA=s=>[...document.querySelectorAll(s)];
const DATA={}, SOURCES={}, typeNames={};
const LANG={1:"一般",2:"格鬥",3:"飛行",4:"毒",5:"地面",6:"岩石",7:"蟲",8:"幽靈",9:"鋼",10:"火",11:"水",12:"草",13:"電",14:"超能力",15:"冰",16:"龍",17:"惡",18:"妖精"};
const ENTYPE={normal:1,fighting:2,flying:3,poison:4,ground:5,rock:6,bug:7,ghost:8,steel:9,fire:10,water:11,grass:12,electric:13,psychic:14,ice:15,dragon:16,dark:17,fairy:18};
const escaped=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const show=(v,f="—")=>v===null||v===undefined||v===""?f:v;
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const short=n=>typeof n==="string"?escaped(n):Number.isFinite(n)?n.toLocaleString("zh-Hant"):"—";
const BASE="https://raw.githubusercontent.com/WatWowMap/pogo-data-api/main/data/v1/";
const PVP="https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/rankings/all/overall/rankings-";
const POGO="https://pogoapi.net/api/v1/";
let state={tab:"overview",dexLimit:42,moveLimit:70,selectedDex:null,selectedRank:null,league:"1500",teamLeague:"1500",teamIds:["","",""],calcId:null,rankData:{},reportText:"",selectedRaid:null,newsLang:"zh"};
function notify(s){const t=Q("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000);}
function badge(t){return '<span class="type-badge">'+escaped(t)+'</span>';}
function typeName(t){return LANG[Number(t)]||String(t||"未知");}
function pokemonKey(p){return String(p?.pokemonKey||p?.pokedexId||"");}
function pokemonName(p){return p?.localizedName||DATA.names?.["poke_"+p?.pokedexId]||p?.pokemonName||"未知";}
function moveName(id){return DATA.moveNames?.["move_"+id]||DATA.moveMap?.get(id)?.moveName||DATA.moveMap?.get(Number(id))?.moveName||DATA.gmMoveMap?.get(String(id))?.name||String(id);}
function moveType(id){return DATA.moveMap?.get(id)?.type??DATA.moveMap?.get(Number(id))?.type??DATA.gmMoveMap?.get(String(id))?.typeId;}
function allPokemon(){return DATA.pokemon||[];}
function getPokemon(id){return DATA.pokemonMap?.get(String(id))||DATA.pokemonMap?.get(Number(id));}
function sprite(id){return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+Number(id)+".png";}
function pokemonTypes(p){return (p.types||[]).map(typeName);}
function typeBadges(p){return (p.types||[]).map(t=>badge(typeName(t))).join("");}
function makeSelectOptions(){const all=allPokemon().slice().sort((a,b)=>a.pokedexId-b.pokedexId);return '<option value="">選擇寶可夢</option>'+all.map(p=>'<option value="'+p.pokedexId+'">'+escaped(pokemonName(p))+' (#'+p.pokedexId+')</option>').join("");}
function urlData(key){return {
pokemon:BASE+"pokemon.json",moves:BASE+"moves.json",types:BASE+"types.json",names:BASE+"translations/zh-tw/pokemon.json",moveNames:BASE+"translations/zh-tw/moves.json",typeNames:BASE+"translations/zh-tw/types.json",
cpm:POGO+"cp_multiplier.json",powerups:POGO+"pokemon_powerup_requirements.json",raids:POGO+"raid_bosses.json",evolutions:POGO+"pokemon_evolutions.json",
rank1500:PVP+"1500.json",rank2500:PVP+"2500.json",rank10000:PVP+"10000.json"
}[key];}
const REMOTE={
pokemon:BASE+"pokemon.json",moves:BASE+"moves.json",types:BASE+"types.json",names:BASE+"translations/zh-tw/pokemon.json",moveNames:BASE+"translations/zh-tw/moves.json",typeNames:BASE+"translations/zh-tw/types.json",
cpm:POGO+"cp_multiplier.json",powerups:POGO+"pokemon_powerup_requirements.json",raids:POGO+"raid_bosses.json",
rank1500:PVP+"1500.json",rank2500:PVP+"2500.json",rank10000:PVP+"10000.json"
};
const CACHE={};
async function getJSON(url){const res=await fetch(url,{cache:"no-cache"});if(!res.ok)throw Error("HTTP "+res.status);return res.json();}
async function loadResource(key){
if(DATA[key])return DATA[key];if(CACHE[key])return CACHE[key];
CACHE[key]=(async()=>{
const candidates=["./data/"+key+".json",REMOTE[key]];let err;
for(const url of candidates){try{
const obj=await getJSON(url);
if(!obj||typeof obj!=="object"||(Array.isArray(obj)&&!obj.length))throw Error("空白資料");
DATA[key]=obj;SOURCES[key]=url.startsWith("./")?"已同步快照":"即時公開來源";
return obj;
}catch(e){err=e;}}
SOURCES[key]="讀取失敗";throw err||Error("資料來源無法連線");
})();
try{return await CACHE[key];}finally{delete CACHE[key];}
}
async function loadCore(){
const keys=["pokemon","forms","gmMoves","moves","types","names","moveNames","typeNames","cpm","rank1500","rank2500","rank10000","raids","evolutions","events","researchTasks","rocketLineups","eggPool","officialNews","communityNews","zhTranslations"];
await Promise.all(keys.map(k=>loadResource(k).catch(e=>console.warn("Resource",k,e))));
buildIndexes();renderEverything();
}
function buildIndexes(){
const base=Array.isArray(DATA.pokemon)?DATA.pokemon:[];
const forms=Array.isArray(DATA.forms)?DATA.forms:[];
DATA.pokemon=[...base,...forms];
DATA.pokemonMap=new Map();
for(const p of DATA.pokemon){if(!p)continue;DATA.pokemonMap.set(pokemonKey(p),p);if(!forms.includes(p)&&Number.isInteger(Number(p.pokedexId)))DATA.pokemonMap.set(Number(p.pokedexId),p);}
if(Array.isArray(DATA.moves))DATA.moveMap=new Map(DATA.moves.flatMap(m=>[[Number(m.moveId),m],[String(m.proto||""),m]]));
if(Array.isArray(DATA.types))DATA.typeMap=new Map(DATA.types.map(t=>[Number(t.typeId),t]));
if(Array.isArray(DATA.gmMoves))DATA.gmMoveMap=new Map(DATA.gmMoves.map(m=>[String(m.moveId),m]));
}
function parsePvpId(x){const source=String(x||"").toLowerCase();return source.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");}
function rankName(r){
const name=String(r.speciesName||r.speciesId||"");
const p=allPokemon().find(x=>x.speciesId===r.speciesId||x.formId===r.speciesId);
if(p)return pokemonName(p);
const base=name.replace(/\s*\([^)]*\)/g,"").trim();
const match=allPokemon().find(x=>!x.formId&&parsePvpId(x.pokemonName)===parsePvpId(base));
return match?pokemonName(match)+(base!==name?" "+name.slice(base.length).trim():""):name;
}
function rankPokemon(r){
const exact=allPokemon().find(x=>x.speciesId===r.speciesId||x.formId===r.speciesId);
if(exact)return exact;
const name=String(r.speciesName||"").replace(/\s*\([^)]*\)/g,"");
return allPokemon().find(x=>!x.formId&&parsePvpId(x.pokemonName)===parsePvpId(name));
}
function rankEntry(id,limit){const list=DATA["rank"+limit]||[];return list.find(r=>parsePvpId(r.speciesId)===parsePvpId(id))||list.find(r=>parsePvpId(r.speciesName)===parsePvpId(id));}
function typeEffect(attack,defense){
const row=DATA.typeMap?.get(Number(attack));if(!row||!defense?.length)return 1;
return defense.reduce((m,d)=>{
if(row.strengths?.includes(Number(d)))return m*1.6;
if(row.immunes?.includes(Number(d)))return m*.390625;
if(row.weakAgainst?.includes(Number(d)))return m*.625;
return m;
},1);
}
function weakTo(types){const all=[...Array(18)].map((_,i)=>i+1);return all.map(t=>({id:t,m:typeEffect(t,types)})).sort((a,b)=>b.m-a.m);}
function switchTab(tab){const node=Q("#"+tab);if(!node||!node.classList.contains("view"))return;state.tab=tab;QA(".view").forEach(n=>n.classList.toggle("active",n.id===tab));QA("[data-tab]").forEach(n=>n.classList.toggle("active",n.dataset.tab===tab));
Q("#pageTitle").textContent=({overview:"訓練家總覽",pokedex:"寶可夢圖鑑",pvp:"PVP 排名",team:"隊伍分析",calculator:"IV / CP 計算器",moves:"招式圖鑑",raids:"團體戰助手",news:"活動與最新資訊",advisor:"AI 智能分析"})[tab];if(location.hash.slice(1)!==tab)history.replaceState(null,"","#"+tab);scrollTo({top:0,behavior:"instant"});}
function sourceSummary(){
const meta=DATA.meta||{};
Q("#dataPill").innerHTML='<i></i> '+(DATA.pokemon?"已載入公開資料":"部分資料未載入");
Q("#sideDataStatus").textContent=meta.updated_at?"最近同步："+String(meta.updated_at).slice(0,16):"資料快照或遠端載入";
const names={pokemon:"寶可夢",moves:"招式",types:"屬性",rank1500:"超級聯盟排名",rank2500:"高級聯盟排名",rank10000:"大師聯盟排名",raids:"團體戰"};
Q("#sourceStatus").innerHTML=Object.entries(names).map(([k,v])=>'<div class="source-item"><span>'+v+'</span><small>'+escaped(SOURCES[k]||"尚未載入")+'</small></div>').join("");
const stats=[
["圖鑑資料",allPokemon().length||"—","寶可夢 GO 基礎資料"],
["PVP 排名",["1500","2500","10000"].filter(k=>DATA["rank"+k]).length+"/3","超級 / 高級 / 大師"],
["招式資訊",DATA.moves?.length||"—","PVP 威力與能量"],
["同步時間",meta.updated_at?String(meta.updated_at).slice(5,10):"即時","GitHub 公開資料"]];
Q("#overviewStats").innerHTML=stats.map(([a,b,c])=>'<div class="stat-card"><small>'+a+'</small><strong>'+short(b)+'</strong><span>'+c+'</span></div>').join("");
}
function renderEverything(){
sourceSummary();fillFilterTypes();renderDex();renderPvp();fillPokemonControls();renderTeam();renderMoves();renderRaids();renderNews();
}
function fillFilterTypes(){for(const id of ["dexType","moveType"]){const q=Q("#"+id);if(q.options.length>1)continue;Object.entries(LANG).forEach(([k,v])=>q.insertAdjacentHTML("beforeend",'<option value="'+k+'">'+v+'</option>'));}}
function sortPokedex(list){
const sort=Q("#dexSort").value;
if(sort==="attack")return list.sort((a,b)=>num(b.attack)-num(a.attack));
if(sort==="cp")return list.sort((a,b)=>cp(b,[15,15,15],50)-cp(a,[15,15,15],50));
if(sort==="name")return list.sort((a,b)=>pokemonName(a).localeCompare(pokemonName(b),"zh-Hant"));
return list.sort((a,b)=>a.pokedexId-b.pokedexId);
}
function renderDex(){
if(!allPokemon().length){Q("#dexGrid").innerHTML='<div class="loading-card">暫時無法載入圖鑑。請按右上「更新資料」。</div>';return;}
const q=Q("#dexSearch").value.trim().toLowerCase(),type=Q("#dexType").value;
const all=sortPokedex(allPokemon().filter(p=>(!type||p.types?.includes(Number(type)))&&(!q||String(p.pokedexId).includes(q)||pokemonName(p).toLowerCase().includes(q)||String(p.pokemonName).toLowerCase().includes(q)||(p.searchAliases||[]).some(x=>String(x).toLowerCase().includes(q)))));
Q("#dexGrid").innerHTML=all.slice(0,state.dexLimit).map(p=>'<button class="dex-card '+(state.selectedDex===pokemonKey(p)?"selected":"")+'" data-dex="'+escaped(pokemonKey(p))+'"><small class="dex-id">#'+String(p.pokedexId).padStart(4,"0")+(p.formLabel?' · '+escaped(p.formLabel):'')+'</small><img class="dex-sprite" loading="lazy" alt="" src="'+sprite(p.pokedexId)+'"><b>'+escaped(pokemonName(p))+'</b><div class="type-badges">'+typeBadges(p)+'</div></button>').join("")||'<div class="empty-state">找不到符合條件的寶可夢。</div>';
Q("#dexCount").textContent="顯示 "+Math.min(all.length,state.dexLimit)+" / "+all.length+" 隻";
Q("#dexMore").hidden=all.length<=state.dexLimit;
if(state.selectedDex)renderDexDetail(state.selectedDex);
}
function renderDexDetail(id){
const p=getPokemon(id);if(!p)return;state.selectedDex=pokemonKey(p);
const stat=(label,value,max=320)=>'<div class="detail-stat"><small>'+label+'</small><b>'+short(value)+'</b><div class="ability-bar"><span style="width:'+Math.min(100,num(value)/max*100)+'%"></span></div></div>';
const fast=(p.quickMoves||[]).map(id=>moveName(id));
const charged=(p.chargedMoves||[]).map(id=>moveName(id));
const elite=(p.eliteQuickMoves||[]).concat(p.eliteChargedMoves||[]).map(id=>moveName(id));

const weak=weakTo(p.types).filter(t=>t.m>1).slice(0,5),res=weakTo(p.types).filter(t=>t.m<1).slice(-5).reverse();
Q("#dexDetail").innerHTML='<div class="detail-heading"><img src="'+sprite(p.pokedexId)+'" alt=""><div><small>#'+p.pokedexId+(p.formLabel?" · "+escaped(p.formLabel):"")+'</small><h3>'+escaped(pokemonName(p))+'</h3><small>'+escaped(p.pokemonName)+'</small></div></div><div class="type-badges">'+typeBadges(p)+'</div><div class="detail-block"><h4>GO 基礎能力值</h4><div class="detail-grid">'+stat("攻擊",p.attack)+stat("防禦",p.defense)+stat("體力",p.stamina)+stat("等級 50 · 100 IV CP",cp(p,[15,15,15],50),6000)+'</div></div><div class="detail-block"><h4>屬性相剋</h4><small>弱點</small><div class="pill-list">'+weak.map(t=>badge(typeName(t.id)+" ×"+t.m.toFixed(2))).join("")+'</div><small style="display:block;margin-top:10px">抗性</small><div class="pill-list">'+res.map(t=>badge(typeName(t.id)+" ×"+t.m.toFixed(2))).join("")+'</div></div><div class="detail-block"><h4>可學一般招式</h4><p class="detail-list">'+escaped(fast.join("、")||"尚無資料")+'</p></div><div class="detail-block"><h4>可學特殊招式</h4><p class="detail-list">'+escaped(charged.join("、")||"尚無資料")+'</p></div><div class="detail-block"><h4>厲害學習器招式（來源資料）</h4><p class="detail-list">'+escaped(elite.join("、")||"未列出")+'</p></div><div class="detail-block evolution-launch"><h4>進化鏈</h4><p class="detail-list">查看初始形態、目前形態、所有分支進化及所需條件。</p><button class="btn btn-outline btn-block" data-evo-toggle="'+escaped(pokemonKey(p))+'">顯示完整進化鏈 ↓</button><div id="evolutionPanel" class="evolution-panel" hidden></div></div><div class="detail-block"><h4>第二特殊招式</h4><p class="detail-list">星星沙子 '+short(p.thirdMoveStardust)+' ／ 糖果 '+short(p.thirdMoveCandy)+'</p></div><div class="detail-block"><button class="btn btn-primary btn-block" data-use-calc="'+escaped(pokemonKey(p))+'">計算這隻的 IV / CP →</button></div>';
}

const EVO_FORM_ZH={
Normal:"一般形態",Alola:"阿羅拉形態",Galarian:"伽勒爾形態",Hisuian:"洗翠形態",Paldea:"帕底亞形態",
Plant:"草木蓑衣",Sandy:"砂土蓑衣",Trash:"垃圾蓑衣",East_sea:"東海",West_sea:"西海",
Female:"雌性",Male:"雄性",Dusk:"黃昏形態",2020:"2020形態",2021:"2021形態",2022:"2022形態",
};
function evolutionFormForPokemon(p){
if(!p||!p.formId)return "Normal";
const source=String(p.speciesId||p.formId||"").toLowerCase();
const rows=DATA.evolutions||[];
const forms=[...new Set(rows.map(x=>x.form).filter(Boolean))].sort((a,b)=>String(b).length-String(a).length);
for(const form of forms){
if(String(form).toLowerCase()==="normal")continue;
const token=parsePvpId(form);
if(token&&parsePvpId(source).endsWith(token))return form;
}
const raw=String(p.pokemonName||"").match(/\(([^)]+)\)/);
if(raw){
const part=parsePvpId(raw[1]);
const match=forms.find(x=>parsePvpId(x)===part);
if(match)return match;
}
return "Normal";
}
function evolutionNodeKey(id,form){return Number(id)+"|"+(form||"Normal");}
function evolutionCondition(e){
const out=[];
if(Number(e.candy_required)>0)out.push(Number(e.candy_required)+" 顆糖果");
const itemNames={"Sun Stone":"日之石","King's Rock":"王者之證","Metal Coat":"金屬膜","Dragon Scale":"龍之鱗片","Upgrade":"升級資料","Sinnoh Stone":"神奧之石","Unova Stone":"合眾之石","Prism Scale":"美麗鱗片"};
if(e.item_required)out.push(itemNames[e.item_required]||e.item_required);
if(e.lure_required)out.push("需要 "+String(e.lure_required).replace("Lure Module","誘餌模組"));
if(e.buddy_distance_required)out.push("夥伴步行 "+e.buddy_distance_required+" km");
if(e.must_be_buddy_to_evolve&&!e.buddy_distance_required)out.push("需設為夥伴");
if(e.only_evolves_in_daytime)out.push("白天進化");
if(e.only_evolves_in_nighttime)out.push("夜晚進化");
if(e.gender_required)out.push(e.gender_required==="Male"?"雄性限定":e.gender_required==="Female"?"雌性限定":String(e.gender_required));
if(e.no_candy_cost_if_traded)out.push("交換後可免糖果");
if(e.upside_down)out.push("倒轉手機進化");
return out.join(" · ")||"進化條件未提供";
}
function evolutionPokemonForNode(node){
const matches=allPokemon().filter(p=>Number(p.pokedexId)===Number(node.id));
if(node.form&&node.form!=="Normal"){
const exact=matches.find(p=>evolutionFormForPokemon(p)===node.form);
if(exact)return exact;
}
return matches.find(p=>!p.formId)||matches[0]||null;
}
function evolutionNodeName(node,p){
if(p&&evolutionFormForPokemon(p)===node.form)return pokemonName(p);
const base=DATA.names?.["poke_"+node.id]||node.name||("圖鑑 #"+node.id);
return node.form&&node.form!=="Normal"?base+"（"+(EVO_FORM_ZH[node.form]||String(node.form).replace(/_/g," "))+"）":base;
}
function renderEvolutionChain(pokemonId){
const selected=getPokemon(pokemonId);
const panel=Q("#evolutionPanel");
if(!selected||!panel)return;
const rows=DATA.evolutions||[];
const nodes=new Map(),parents=new Map();
const ensure=(id,form,name)=>{
const key=evolutionNodeKey(id,form);
if(!nodes.has(key))nodes.set(key,{key,id:Number(id),form:form||"Normal",name:name||"",edges:[],incoming:[]});
const n=nodes.get(key);if(name&&!n.name)n.name=name;
return n;
};
rows.forEach(row=>{
const source=ensure(row.pokemon_id,row.form||"Normal",row.pokemon_name);
(row.evolutions||[]).forEach(e=>{
const form=e.form||row.form||"Normal";
const target=ensure(e.pokemon_id,form,e.pokemon_name);
const condition=evolutionCondition(e);
if(!source.edges.some(x=>x.to===target.key))source.edges.push({to:target.key,condition});
if(!target.incoming.some(x=>x.from===source.key))target.incoming.push({from:source.key,condition});
});
});
let currentKey=evolutionNodeKey(selected.pokedexId,evolutionFormForPokemon(selected));
if(!nodes.has(currentKey)){
const normalKey=evolutionNodeKey(selected.pokedexId,"Normal");
if(nodes.has(normalKey))currentKey=normalKey;
else ensure(selected.pokedexId,"Normal",selected.pokemonName);
}
function roots(key,seen=new Set()){
if(seen.has(key))return [];
seen.add(key);
const incoming=nodes.get(key)?.incoming||[];
if(!incoming.length)return [key];
return [...new Set(incoming.flatMap(x=>roots(x.from,new Set(seen))))];
}
const rootKeys=roots(currentKey);
const levels=[];let frontier=rootKeys.slice(),visited=new Set();
while(frontier.length&&levels.length<8){
const level=frontier.filter(k=>!visited.has(k));
if(!level.length)break;
level.forEach(k=>visited.add(k));levels.push(level);
frontier=[...new Set(level.flatMap(k=>(nodes.get(k)?.edges||[]).map(x=>x.to)))].filter(k=>!visited.has(k));
}
const hasLinks=levels.some((level,i)=>i>0||level.some(k=>(nodes.get(k)?.edges||[]).length));
if(!hasLinks){
const name=evolutionNodeName(nodes.get(currentKey),selected);
panel.innerHTML='<div class="evo-empty"><b>'+escaped(name)+'</b><span>目前資料沒有記錄這隻寶可夢的初始形態或進化分支。</span></div>';
return;
}
panel.innerHTML='<div class="evo-chain-intro">完整進化路線 · '+nodes.size+' 個形態節點</div>'+levels.map((level,i)=>{
return '<div class="evo-level"><div class="evo-level-title">'+(i===0?"初始形態":("進化階段 "+i))+'</div><div class="evo-level-nodes">'+level.map(key=>{
const node=nodes.get(key),p=evolutionPokemonForNode(node);
const name=evolutionNodeName(node,p);
const target=p?pokemonKey(p):String(node.id);
const isCurrent=key===currentKey;
const incoming=node.incoming.map(x=>x.condition).filter(Boolean);
const conditions=[...new Set(incoming)];
return '<button type="button" class="evo-node '+(isCurrent?"current":"")+'" data-evo-select="'+escaped(target)+'"><img src="'+sprite(node.id)+'" alt=""><span class="evo-node-name">'+escaped(name)+'</span><small>#'+node.id+(node.form!=="Normal"?" · "+escaped(EVO_FORM_ZH[node.form]||node.form):"")+'</small><span class="evo-node-tag">'+(isCurrent?"目前選擇":i===0?"初始形態":"進化形態")+'</span>'+(conditions.length?'<span class="evo-conditions">'+conditions.map(x=>'<small>'+escaped(x)+'</small>').join("")+'</span>':"")+'</button>';
}).join("")+'</div></div>';
}).join('<div class="evo-level-connector">↓</div>');
}

function renderPvp(){
const list=DATA["rank"+state.league]||[];
QA("[data-league]").forEach(n=>n.classList.toggle("active",n.dataset.league===state.league));
const labels={"1500":"超級聯盟","2500":"高級聯盟","10000":"大師聯盟"};
Q("#pvpHeading").textContent=labels[state.league]+" · 模擬排名";
if(!list.length){Q("#pvpList").innerHTML='<div class="empty-state">目前無法取得此聯盟排名。</div>';return;}
const q=Q("#pvpSearch").value.toLowerCase().trim(),max=Number(Q("#pvpLimit").value);
const filtered=list.map((r,i)=>({...r,rank:i+1})).filter(r=>!q||rankName(r).toLowerCase().includes(q)||r.speciesName.toLowerCase().includes(q)).slice(0,max);
Q("#pvpList").innerHTML=filtered.map(r=>{const p=rankPokemon(r);return '<button class="ranking-item '+(state.selectedRank===r.speciesId?"selected":"")+'" data-rank="'+escaped(r.speciesId)+'"><span class="rank-number">#'+r.rank+'</span><img alt="" loading="lazy" src="'+(p?sprite(p.pokedexId):"data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=")+'"><span><b>'+escaped(rankName(r))+'</b><small>'+escaped(r.speciesName)+'</small></span><span class="rank-score">'+short(r.score)+'</span></button>';}).join("")||'<div class="empty-state">沒有符合條件的排名。</div>';
Q("#pvpUpdated").textContent="資料 "+list.length+" 項 · "+(DATA.meta?.updated_at?.slice(0,10)||"公開來源");
if(state.selectedRank)renderPvpDetail(state.selectedRank);
}
function renderPvpDetail(id){
const list=DATA["rank"+state.league]||[];const r=list.find(x=>x.speciesId===id);if(!r)return;state.selectedRank=id;
const p=rankPokemon(r),moves=(r.moveset||[]).map(m=>{const match=DATA.moves?.find(x=>parsePvpId(x.proto)===parsePvpId(m));return match?moveName(match.moveId):m;});
const matching=all=>all?.map(x=>{const rr=rankEntry(x.opponent,state.league);return rr?rankName(rr):x.opponent;}).join("、")||"未提供";
Q("#pvpDetail").innerHTML='<div class="detail-heading">'+(p?'<img src="'+sprite(p.pokedexId)+'" alt="">':"")+'<div><small>PVP RANK #'+(list.indexOf(r)+1)+'</small><h3>'+escaped(rankName(r))+'</h3><small>模擬評分 '+show(r.score)+'</small></div></div><div class="detail-block"><h4>推薦招式</h4><p class="detail-list">'+escaped(moves.join(" ／ ")||"暫無推薦資料")+'</p></div><div class="detail-block"><h4>模擬中較有利的對局</h4><p class="detail-list">'+escaped(matching(r.matchups))+'</p></div><div class="detail-block"><h4>模擬中較不利的對局</h4><p class="detail-list">'+escaped(matching(r.counters))+'</p></div>'+(r.editorNotes?'<div class="detail-block"><h4>PvPoke 原文評語</h4><p class="detail-list">'+escaped(r.editorNotes)+'</p></div>':"")+'<div class="detail-block"><button class="btn btn-primary btn-block" data-use-team="'+(p?escaped(pokemonKey(p)):"")+'">加入隊伍分析 →</button></div>';
}
const pickerState={};
function searchPokemon(query){
const q=String(query||"").trim().toLocaleLowerCase();
if(!q)return [];
const clean=q.replace(/^#/,"").replace(/\s+/g,"");
return allPokemon().map(p=>{
const zh=String(pokemonName(p)||"").toLocaleLowerCase();
const en=String(p.pokemonName||"").toLocaleLowerCase();
const id=String(p.pokedexId),key=pokemonKey(p);
const aliases=(p.searchAliases||[]).map(x=>String(x).toLocaleLowerCase());
const fields=[zh,en,id,"#"+id,key,...aliases].map(x=>x.toLocaleLowerCase());
let score=0;
if(fields.includes(q)||fields.includes(clean))score=100;
else if(zh.startsWith(q)||en.startsWith(q)||id===clean)score=80;
else if(zh.includes(q)||en.includes(q)||id.includes(clean))score=50;
if(p.formId&&String(p.formId).includes(q.replace(/\s+/g,"_")))score=Math.max(score,85);
return {p,score};
}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.p.pokedexId-b.p.pokedexId).slice(0,9).map(x=>x.p);
}
function closePicker(id){
const results=Q("#"+id+"Results"),input=Q("#"+id+"Search");
if(results)results.hidden=true;
if(input)input.setAttribute("aria-expanded","false");
if(pickerState[id])pickerState[id].active=-1;
}
function renderPickerResults(id){
const input=Q("#"+id+"Search"),results=Q("#"+id+"Results");
if(!input||!results)return;
const query=input.value.trim(),matches=searchPokemon(query);
const st=pickerState[id]||(pickerState[id]={active:-1,matches:[]});
st.matches=matches;st.active=matches.length?Math.min(Math.max(st.active,0),matches.length-1):-1;
if(!query){results.innerHTML='<div class="picker-hint">輸入中文或英文名稱開始搜尋</div>';results.hidden=false;input.setAttribute("aria-expanded","true");return;}
if(!matches.length){results.innerHTML='<div class="picker-empty">找不到符合「'+escaped(query)+'」的寶可夢</div>';results.hidden=false;input.setAttribute("aria-expanded","true");return;}
results.innerHTML=matches.map((p,i)=>'<button type="button" class="pokemon-suggestion '+(i===st.active?"active":"")+'" role="option" aria-selected="'+(String(Q("#"+id).value)===pokemonKey(p))+'" data-picker-choice="'+id+'" data-pokemon-id="'+escaped(pokemonKey(p))+'"><img src="'+sprite(p.pokedexId)+'" alt=""><span class="suggestion-name"><b>'+escaped(pokemonName(p))+'</b><small>'+escaped(p.pokemonName)+' · #'+p.pokedexId+'</small></span><span class="suggestion-id">#'+p.pokedexId+'</span></button>').join("");
results.hidden=false;input.setAttribute("aria-expanded","true");
}
function choosePokemon(id,pokemonId){
const p=getPokemon(pokemonId);if(!p)return;
Q("#"+id).value=pokemonKey(p);Q("#"+id+"Search").value=pokemonName(p);closePicker(id);
if(/^team[123]$/.test(id)){state.teamIds[Number(id.slice(-1))-1]=pokemonKey(p);renderTeam();}
}
function setupPokemonPicker(id){
const input=Q("#"+id+"Search"),results=Q("#"+id+"Results");
if(!input||!results||input.dataset.pickerReady==="true")return;
input.dataset.pickerReady="true";pickerState[id]={active:-1,matches:[]};
input.addEventListener("focus",()=>renderPickerResults(id));
input.addEventListener("input",()=>{Q("#"+id).value="";if(/^team[123]$/.test(id)){state.teamIds[Number(id.slice(-1))-1]="";renderTeam();}pickerState[id].active=0;renderPickerResults(id);});
input.addEventListener("keydown",e=>{
const st=pickerState[id];
if(e.key==="ArrowDown"&&st.matches.length){e.preventDefault();st.active=Math.min(st.active+1,st.matches.length-1);renderPickerResults(id);}
else if(e.key==="ArrowUp"&&st.matches.length){e.preventDefault();st.active=Math.max(st.active-1,0);renderPickerResults(id);}
else if(e.key==="Enter"&&!results.hidden&&st.matches.length){e.preventDefault();choosePokemon(id,pokemonKey(st.matches[Math.max(st.active,0)]));}
else if(e.key==="Escape")closePicker(id);
});
results.addEventListener("click",e=>{const option=e.target.closest("[data-picker-choice]");if(option){e.preventDefault();choosePokemon(id,option.dataset.pokemonId);}});
}
function clearPokemonPicker(id){
Q("#"+id).value="";Q("#"+id+"Search").value="";closePicker(id);
if(/^team[123]$/.test(id)){state.teamIds[Number(id.slice(-1))-1]="";renderTeam();}
}
function fillPokemonControls(){
if(!allPokemon().length)return;
for(const id of ["team1","team2","team3","advisorPokemon","advisorOpponent"])setupPokemonPicker(id);
Q("#pokemonOptions").innerHTML=allPokemon().map(p=>'<option value="'+escaped(pokemonName(p))+'">'+escaped(p.pokemonName)+'</option>').join("");
}
function renderTeam(){
QA("[data-team-league]").forEach(x=>x.classList.toggle("active",x.dataset.teamLeague===state.teamLeague));
for(let i=0;i<3;i++){
const id="team"+(i+1),p=getPokemon(state.teamIds[i]),input=Q("#"+id+"Search");
Q("#"+id).value=state.teamIds[i]||"";
if(input&&document.activeElement!==input)input.value=p?pokemonName(p):"";
Q("#"+id+"Card").innerHTML=p?'<img src="'+sprite(p.pokedexId)+'" alt=""><b>'+escaped(pokemonName(p))+'</b><br><span>'+pokemonTypes(p).join(" / ")+'</span><br><small>最高 CP '+cp(p,[15,15,15],50)+'</small>':"尚未選擇";
}
}
function teamIssues(ids,league){
const mons=ids.map(getPokemon).filter(Boolean);
const weak=Array.from({length:18},(_,i)=>i+1).map(t=>({t,weak:mons.filter(p=>typeEffect(t,p.types)>1.01),resist:mons.filter(p=>typeEffect(t,p.types)<.99)})).sort((a,b)=>b.weak.length-a.weak.length);
const ranks=mons.map(p=>({p,r:(DATA["rank"+league]||[]).find(x=>x.speciesId===p.speciesId||x.speciesId===pokemonKey(p))||(DATA["rank"+league]||[]).find(x=>!p.formId&&parsePvpId(x.speciesName?.replace(/\s*\([^)]*\)/g,""))===parsePvpId(p.pokemonName))}));
const coverage=new Set(mons.flatMap(p=>(p.quickMoves||[]).concat(p.chargedMoves||[])).map(moveType).filter(Number.isFinite));
return {mons,weak,ranks,coverage};
}
function analyzeTeam(){
const {mons,weak,ranks,coverage}=teamIssues(state.teamIds,state.teamLeague);
if(!mons.length){Q("#teamAnalysis").innerHTML='<div class="empty-state">請至少選擇一隻寶可夢。</div>';return;}
const dangerous=weak.filter(x=>x.weak.length>=2),noResponse=weak.filter(x=>x.weak.length&&x.resist.length===0).slice(0,7);
const proposed=[...coverage].sort((a,b)=>a-b).map(typeName);
const ranked=ranks.map(x=>'<div class="matchup-item"><span>'+escaped(pokemonName(x.p))+'</span><small>'+(x.r?"模擬評分 "+x.r.score:"未找到直接對應的排名形態")+'</small></div>').join("");
const suggestions=dangerous.length?dangerous.map(x=>typeName(x.t)+"：有 "+x.weak.length+" 隻成員怕此屬性，建議安排抗性替換位。"):[ "目前沒有兩隻以上成員共享的明顯屬性弱點，但招式與 PvP 對局仍可能構成風險。"];
Q("#teamAnalysis").innerHTML='<div class="analysis-grid"><section class="panel"><h3>共同弱點</h3>'+(dangerous.map(x=>'<div class="matchup-item"><strong>'+typeName(x.t)+' · '+x.weak.length+' 隻弱點</strong><small>'+x.weak.map(pokemonName).join("、")+'</small></div>').join("")||'<p class="muted">沒有兩隻以上共享的弱點。</p>')+'</section><section class="panel"><h3>聯盟排名參考</h3>'+ranked+'<p class="muted" style="margin-top:12px;font-size:.78rem">排名以 PvPoke 模擬資料為準，形態不同時不強行匹配。</p></section><section class="panel"><h3>進攻屬性池（可學招式）</h3><div class="pill-list">'+(proposed.map(badge).join("")||"尚未有招式屬性資料")+'</div><p class="muted" style="margin-top:12px;font-size:.78rem">此處顯示全部可學招式的類型，並非目前配招；不能代替完整模擬。</p></section><section class="panel"><h3>改善方向</h3><ul class="tip-list">'+suggestions.map(x=>'<li>'+escaped(x)+'</li>').join("")+'</ul>'+(noResponse.length?'<p class="muted">需留意無抗性替補的屬性：'+noResponse.map(x=>typeName(x.t)).join("、")+'</p>':"")+'</section></div>';
}
function cp(p,ivs,level){
const cpm=DATA.cpm?.find(x=>Math.abs(Number(x.level)-Number(level))<.001)?.multiplier ?? (Number(level)>45&&Number(level)<=50?0.8153+0.005*(Number(level)-45):null);
if(!p||!cpm||![p.attack,p.defense,p.stamina].every(Number.isFinite))return null;
const [a,d,s]=ivs.map(num);
return Math.max(10,Math.floor((p.attack+a)*Math.sqrt(p.defense+d)*Math.sqrt(p.stamina+s)*cpm*cpm/10));
}
function bestLevel(p,ivs,limit){
const levels=DATA.cpm||[];let best=null;
for(const l of levels){if(l.level>50)continue;const value=cp(p,ivs,l.level);if(value===null)continue;if(value<=limit&&(!best||l.level>best.level))best={level:l.level,cp:value,cpm:l.multiplier};}
return best;
}
function findCalcPokemon(){
const q=Q("#calcPokemonSearch").value.trim().toLowerCase();
const p=allPokemon().find(x=>pokemonName(x).toLowerCase()===q||x.pokemonName.toLowerCase()===q||String(x.pokedexId)===q||(x.searchAliases||[]).some(a=>String(a).toLowerCase()===q));
state.calcId=p?.pokedexId||null;return p;
}
function calculate(){
const p=findCalcPokemon();if(!p){Q("#calcResults").innerHTML='<div class="empty-state">請先選擇圖鑑中存在的寶可夢名稱。</div>';return;}
const ivs=["ivAtk","ivDef","ivSta"].map(id=>Number(Q("#"+id).value));
if(ivs.some(v=>!Number.isInteger(v)||v<0||v>15)){notify("IV 需是 0 至 15 的整數");return;}
const level=Number(Q("#calcLevel").value),target=Number(Q("#targetLevel").value),limit=Number(Q("#calcLeague").value);
const current=cp(p,ivs,level),end=cp(p,ivs,target),max40=cp(p,ivs,40),max50=cp(p,ivs,50);
const best=limit===10000?{level:50,cp:max50}:bestLevel(p,ivs,limit);
if(current===null){Q("#calcResults").innerHTML='<div class="empty-state">CP 倍率資料目前不可用，無法計算。</div>';return;}
const raw=calcRank(p,ivs,limit);
const costs=calcCost(level,target);
const costMessage=costs?'<p class="result-small">資料來源估算：星星沙子 '+short(costs.dust)+'、一般糖果 '+short(costs.candy)+'、XL 糖果 '+short(costs.xl)+'。實際費用可能受活動／特殊條件影響。</p>':'<p class="result-small">尚未找到完整可信的強化成本表，請以遊戲畫面為準。</p>';
Q("#calcResults").innerHTML='<div class="result-card"><small>當前 CP · '+escaped(pokemonName(p))+'</small><div class="result-big">'+current+'</div><div class="result-small">等級 '+level+' · IV '+ivs.join("/")+' · IV 完美程度 '+Math.round(100*ivs.reduce((a,b)=>a+b,0)/45)+'%</div></div><div class="result-card"><h3>升級與聯盟</h3><div class="result-grid"><div><small>目標等級 '+target+'</small><strong>CP '+show(end)+'</strong></div><div><small>等級 40 / 50</small><strong>'+show(max40)+' / '+show(max50)+'</strong></div><div><small>聯盟上限</small><strong>'+limit+'</strong></div><div><small>目前 IV 可達</small><strong>'+show(best?.cp)+' (Lv '+show(best?.level)+')</strong></div></div>'+costMessage+'</div><div class="result-card"><h3>PVP IV 評估</h3>'+(raw?'<div class="result-big">#'+raw.rank+' / '+raw.total+'</div><p class="result-small">相同物種 4,096 種 IV 組合的排名。依聯盟 CP 上限最大化等級後，以攻擊 × 防禦 × 體力的實戰能力值乘積估算；不代表實際對戰勝率。計算忽略好友／最佳夥伴加成及特殊形態。</p>':'<p class="muted">缺少計算所需的 CP 倍率或基礎資料。</p>')+'</div>';
}
function calcRank(p,ivs,limit){
if(!DATA.cpm||!p)return null;
const calculateEntry=arr=>{
const item=limit===10000?{level:50,cp:cp(p,arr,50),cpm:DATA.cpm.find(x=>x.level===50)?.multiplier}:bestLevel(p,arr,limit);
if(!item||item.cpm==null)return null;
const [a,d,s]=arr;
const atk=(p.attack+a)*item.cpm,def=(p.defense+d)*item.cpm,hp=Math.max(10,Math.floor((p.stamina+s)*item.cpm));
return atk*def*hp;
};
const target=calculateEntry(ivs);if(target===null)return null;
let rank=1,total=0;
for(let a=0;a<16;a++)for(let d=0;d<16;d++)for(let s=0;s<16;s++){const value=calculateEntry([a,d,s]);if(value!==null){total++;if(value>target+1e-8)rank++;}}
return {rank,total};
}
function calcCost(from,to){
const raw=DATA.powerups;
if(!raw||to<=from)return null;
let entries=Array.isArray(raw)?raw:Object.entries(raw).map(([level,v])=>({level,...v}));
let dust=0,candy=0,xl=0;
for(let lv=from;lv<to;lv+=.5){const e=entries.find(x=>Number(x.level)===lv);if(!e)return null;
const d=e.stardust??e.stardust_to_upgrade??e.stardust_cost??e.stardustCost;
const c=e.candy??e.candy_to_upgrade??e.candy_cost??e.candyCost??0;
const xc=e.xl_candy??e.xl_candy_to_upgrade??e.xlCandy??e.candy_xl??0;
if(!Number.isFinite(Number(d)))return null;dust+=Number(d);candy+=Number(c);xl+=Number(xc);}
return {dust,candy,xl};
}
function renderMoves(){
const list=DATA.moves||[];if(!list.length){Q("#moveList").innerHTML='<div class="empty-state">招式資料無法載入。</div>';return;}
const q=Q("#moveSearch").value.trim().toLowerCase(),kind=Q("#moveKind").value,type=Q("#moveType").value;
const filtered=list.filter(m=>m.type&&(kind==="all"||(kind==="fast"?m.fast:!m.fast))&&(!type||Number(m.type)===Number(type))&&(!q||moveName(m.moveId).toLowerCase().includes(q)||m.moveName.toLowerCase().includes(q)));
const html=filtered.slice(0,state.moveLimit).map(m=>{
const energy=m.pvpEnergyDelta==null?"—":m.fast?"+"+m.pvpEnergyDelta:Math.abs(m.pvpEnergyDelta);
return '<div class="move-row"><span><b>'+escaped(moveName(m.moveId))+'</b><small>'+escaped(m.moveName)+' · '+(m.fast?"一般":"特殊")+'</small></span><span>'+badge(typeName(m.type))+'</span><span>'+show(m.pvpPower)+'</span><span>'+energy+'</span><span>'+show(m.fast?Math.max(1,Math.round((m.pvpDurationTurns??m.durationMs/500)||0)):"—")+'</span></div>';
}).join("");
Q("#moveList").innerHTML=html||'<div class="empty-state">沒有符合條件的招式。</div>';
Q("#moveCount").textContent="顯示 "+Math.min(filtered.length,state.moveLimit)+" / "+filtered.length+" 個招式";
Q("#moveMore").hidden=filtered.length<=state.moveLimit;
}
function currentRaids(){
const r=DATA.raids;
if(Array.isArray(r))return r;
if(r&&r.current&&typeof r.current==="object")return Object.entries(r.current).flatMap(([tier,arr])=>Array.isArray(arr)?arr.map(x=>({...x,raid_level:tier})):[]);
return [];
}
function raidPokemon(r){
const id=r.pokemon_id||r.pokemon_id_number||r.pokemonId||r.id;
if(id){const found=getPokemon(id);if(found)return found;}
const raw=String(r.name||r.pokemon||r.pokemon_name||"").trim();
const norm=parsePvpId(raw);
const forms=allPokemon().filter(p=>p.formId);
const base=allPokemon().filter(p=>!p.formId);
const direct=forms.find(p=>parsePvpId(p.pokemonName)===norm||parsePvpId(p.localizedName)===norm||parsePvpId(p.speciesId)===norm);
if(direct)return direct;
const findForm=name=>forms.find(p=>parsePvpId(p.pokemonName)===parsePvpId(name)||parsePvpId(p.speciesId)===parsePvpId(name)||parsePvpId(p.localizedName)===parsePvpId(name));
if(/^shadow\s+/i.test(raw)){
const name=raw.replace(/^shadow\s+/i,"");
const p=findForm(name+" (Shadow)")||findForm(name+" (Incarnate) (Shadow)");
if(p)return p;
}
if(/^mega\s+/i.test(raw)){const p=findForm(raw.replace(/^mega\s+/i,"")+" (Mega)");if(p)return p;}
if(/^(alolan|galarian|hisuian|paldean)\s+/i.test(raw)){
const match=raw.match(/^(alolan|galarian|hisuian|paldean)\s+(.+)$/i);
const p=findForm(match[2]+" ("+match[1]+")");if(p)return p;
}
const variants=[raw.replace(/\s*\((shadow|mega)\)/i,""),raw.replace(/\s*\((alolan|galarian|hisuian|paldean)\)/i,"")];
for(const v of variants){const p=findForm(v);if(p)return p;}
return base.find(p=>parsePvpId(p.pokemonName)===norm||parsePvpId(DATA.names?.["poke_"+p.pokedexId])===norm)
||base.find(p=>parsePvpId(p.pokemonName)===parsePvpId(raw.replace(/^(shadow|mega|alolan|galarian|hisuian|paldean)\s+/i,"")));
}
function raidTierLabel(t){return ({"1":"1 星","3":"3 星","5":"5 星","6":"精英","mega":"Mega","mega_legendary":"Mega 傳說"})[String(t)]||String(t||"團體戰");}

const NEWS_UI={
zh:{
title:"活動與最新資訊",description:"集中查看目前及未來活動、團體戰、極巨化、田野調查、火箭隊、蛋池與最新公告。",
language:"顯示語言",autoSync:"自動同步",eventEyebrow:"活動日曆",eventTitle:"活動日曆",
allEvents:"所有活動",upcoming:"即將開始",activeFilter:"進行中",ended:"已結束",active:"進行中",
researchEyebrow:"FIELD RESEARCH",researchTitle:"田野調查與任務獎勵",rocketEyebrow:"TEAM GO ROCKET",rocketTitle:"火箭隊陣容",
eggEyebrow:"EGG POOLS",eggTitle:"目前蛋池",officialEyebrow:"OFFICIAL UPDATES",officialTitle:"官方公告",
communityEyebrow:"COMMUNITY COVERAGE",communityTitle:"社群攻略新聞",footnote:"活動時間依公開來源提供的當地時間或官方公告顯示；實際地區、時區及遊戲內安排可能不同。官方公告與第三方攻略分開顯示，重要資訊請以遊戲內公告為準。",
missingNote:"若資料來源未提供中文翻譯，系統會保留英文原文並標示，避免錯誤翻譯。",
noEvents:"目前沒有符合條件的活動資料。",noData:"目前沒有可顯示的資料。",noNews:"暫時沒有可顯示的新聞；資料來源無法連線時會保留上一份快照。",
readEvent:"查看活動詳情",encounter:"遭遇",rarity:"稀有度",shiny:"可色違",team:"第 {n} 隊",encounterReward:"遭遇獎勵",
officialLink:"查看官方公告",communityLink:"閱讀報導",snapshot:"資料快照",eventCount:"活動",lastUpdate:"最近來源更新",hourly:"每小時自動同步"
},
en:{
title:"Events & Latest Information",description:"Explore current and upcoming events, raids, Max Battles, Field Research, Team GO Rocket lineups, Egg Pools and the latest news.",
language:"Language",autoSync:"Auto-sync",eventEyebrow:"EVENT CALENDAR",eventTitle:"Event Calendar",
allEvents:"All Events",upcoming:"Upcoming",activeFilter:"Active Now",ended:"Ended",active:"Active",
researchEyebrow:"FIELD RESEARCH",researchTitle:"Field Research & Rewards",rocketEyebrow:"TEAM GO ROCKET",rocketTitle:"Team GO Rocket Lineups",
eggEyebrow:"EGG POOLS",eggTitle:"Current Egg Pools",officialEyebrow:"OFFICIAL UPDATES",officialTitle:"Official News",
communityEyebrow:"COMMUNITY COVERAGE",communityTitle:"Community News & Guides",footnote:"Event times follow the local times or announcements provided by public sources. Actual availability may vary by region and in-game schedule. Official announcements and third-party guides are shown separately; always check in-game notices for important details.",
missingNote:"If a source has no Traditional Chinese translation, its original English text is retained and marked.",
noEvents:"No events match the selected filter.",noData:"No data is currently available.",noNews:"No news is currently available. The previous snapshot is retained when a source is unreachable.",
readEvent:"View event details",encounter:"Encounter",rarity:"Rarity",shiny:"Shiny eligible",team:"Team {n}",encounterReward:"Encounter reward",
officialLink:"Read official update",communityLink:"Read article",snapshot:"Snapshot",eventCount:"Events",lastUpdate:"Latest source update",hourly:"Syncs every hour"
}
};
const NEWS_MANUAL_ZH={
"Pokémon Spotlight Hour":"焦點時刻","Event":"活動","Max Battles":"極巨化對戰","Community Day":"社群日",
"Twitch Drops":"Twitch 掉寶獎勵","Max Mondays":"極巨化星期一","Raid Battles":"團體戰","GO Battle League":"GO 對戰聯盟",
"Raid Hour":"團體戰時段","Raid Day":"團體戰日","Season":"賽季","GO Pass":"GO Pass","Timed Research":"限時調查",
"Research":"調查","Pokémon GO Tour":"Pokémon GO 巡迴賽","Giovanni":"喬瓦尼","Cliff":"克里夫","Arlo":"亞洛","Sierra":"席拉",
"1 km Eggs":"1 公里蛋","2 km Eggs":"2 公里蛋","5 km Eggs":"5 公里蛋","7 km Eggs (From Friend Gifts)":"好友禮物 7 公里蛋",
"7 km Eggs (From Route Gift)":"路線禮物 7 公里蛋","10 km Eggs":"10 公里蛋","12 km Eggs":"12 公里蛋",
"5 km Eggs (Adventure Sync Rewards)":"冒險同步獎勵 5 公里蛋","10 km Eggs (Adventure Sync Rewards)":"冒險同步獎勵 10 公里蛋"
};
function infoText(value){
const raw=String(value??"");
if(state.newsLang==="en"||!raw)return raw;
if(NEWS_MANUAL_ZH[raw])return NEWS_MANUAL_ZH[raw];
const pokemon=allPokemon().find(p=>String(p.pokemonName||"").toLowerCase()===raw.toLowerCase());
if(pokemon)return pokemonName(pokemon);
const translated=DATA.zhTranslations?.[raw];
return translated||raw+"（原文）";
}
function newsUi(){return NEWS_UI[state.newsLang]||NEWS_UI.zh;}
function infoDate(value){
if(value===undefined||value===null)return state.newsLang==="en"?"Time TBA":"時間未公布";
let d;
if(typeof value==="number")d=new Date(value*1000);else d=new Date(value);
if(Number.isNaN(d.getTime()))return String(value);
return new Intl.DateTimeFormat(state.newsLang==="en"?"en-US":"zh-TW",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(d);
}
function eventStatusKey(e){
const now=Date.now(),start=typeof e.start_time==="number"?e.start_time*1000:new Date(e.start_time).getTime(),end=typeof e.end_time==="number"?e.end_time*1000:new Date(e.end_time).getTime();
if(Number.isFinite(start)&&now<start)return "upcoming";
if(Number.isFinite(end)&&now<=end)return "active";
return "ended";
}
function flattenEvents(){
return Object.entries(DATA.events||{}).flatMap(([category,items])=>(Array.isArray(items)?items:[]).map(e=>({...e,category:e.category||category})));
}
function updateNewsLanguageUI(){
const ui=newsUi();
const textMap={
newsTitle:ui.title,newsDescription:ui.description,newsLanguageLabel:ui.language,newsAutoSync:ui.autoSync,
eventEyebrow:ui.eventEyebrow,eventSectionTitle:ui.eventTitle,researchEyebrow:ui.researchEyebrow,
researchSectionTitle:ui.researchTitle,rocketEyebrow:ui.rocketEyebrow,rocketSectionTitle:ui.rocketTitle,
eggEyebrow:ui.eggEyebrow,eggSectionTitle:ui.eggTitle,officialNewsEyebrow:ui.officialEyebrow,
officialNewsTitle:ui.officialTitle,communityNewsEyebrow:ui.communityEyebrow,communityNewsTitle:ui.communityTitle,
newsFootnote:ui.footnote,newsMissingNote:ui.missingNote
};
for(const [id,value] of Object.entries(textMap)){const node=Q("#"+id);if(node)node.textContent=value;}
QA("[data-news-lang]").forEach(button=>{
const active=button.dataset.newsLang===state.newsLang;
button.classList.toggle("active",active);button.setAttribute("aria-pressed",active?"true":"false");
});
const select=Q("#infoCategory");
if(select){
const previous=select.value||"all";
const options=[["all",ui.allEvents],["upcoming",ui.upcoming],["active",ui.activeFilter],...Object.keys(DATA.events||{}).sort().map(category=>[category,infoText(category)])];
select.innerHTML=options.map(([value,label])=>'<option value="'+escaped(value)+'">'+escaped(label)+'</option>').join("");
select.value=options.some(([value])=>value===previous)?previous:"all";
}
}
function renderEvents(){
const box=Q("#eventList");if(!box)return;
const ui=newsUi(),filter=Q("#infoCategory").value,all=flattenEvents();
const list=all.filter(e=>{
const status=eventStatusKey(e);
if(filter==="upcoming")return status==="upcoming";
if(filter==="active")return status==="active";
return filter==="all"||e.category===filter;
}).sort((x,y)=>{
const order={active:0,upcoming:1,ended:2};
return order[eventStatusKey(x)]-order[eventStatusKey(y)]||new Date(typeof x.start_time==="number"?x.start_time*1000:x.start_time)-new Date(typeof y.start_time==="number"?y.start_time*1000:y.start_time);
});
if(!list.length){box.innerHTML='<div class="empty-state">'+escaped(ui.noEvents)+'</div>';return;}
box.innerHTML=list.slice(0,50).map(e=>{
const status=eventStatusKey(e),statusLabel=status==="active"?ui.active:status==="upcoming"?ui.upcoming:ui.ended;
const start=infoDate(e.start_time),end=infoDate(e.end_time),desc=infoText(String(e.description||"").slice(0,900));
return '<article class="info-event-card">'+(e.banner_url?'<img class="info-banner" loading="lazy" src="'+escaped(e.banner_url)+'" alt="">':"")+'<div class="info-event-body"><div class="info-chip-row"><span class="info-chip">'+escaped(infoText(e.category||"Event"))+'</span><span class="info-status '+(status==="active"?"active":status==="upcoming"?"upcoming":"ended")+'">'+escaped(statusLabel)+'</span></div><h4>'+escaped(infoText(e.title||"Untitled event"))+'</h4><small>'+escaped(start)+' – '+escaped(end)+'</small><p>'+escaped(desc)+'</p>'+(e.article_url?'<a class="text-link" href="'+escaped(e.article_url)+'" target="_blank" rel="noopener">'+escaped(ui.readEvent)+' ↗</a>':"")+'</div></article>';
}).join("");
}
function renderResearch(){
const root=Q("#researchList");if(!root)return;
const ui=newsUi(),groups=DATA.researchTasks||{};
root.innerHTML=Object.entries(groups).map(([group,tasks])=>'<details class="info-details"><summary>'+escaped(infoText(group))+' <span>'+tasks.length+(state.newsLang==="en"?" tasks":" 項")+'</span></summary>'+tasks.map(t=>'<div class="info-task"><b>'+escaped(infoText(t.task))+'</b><div class="info-rewards">'+(t.rewards||[]).map(r=>'<span class="info-reward">'+(r.type==="encounter"?escaped(ui.encounter)+"：":"")+escaped(infoText(r.name))+(r.quantity?" ×"+r.quantity:"")+(r.shiny_available?" ✨ "+escaped(ui.shiny):"")+'</span>').join("")+'</div></div>').join("")+'</details>').join("")||'<p class="muted">'+escaped(ui.noData)+'</p>';
}
function renderRocket(){
const root=Q("#rocketList");if(!root)return;
const ui=newsUi(),data=DATA.rocketLineups||{};
root.innerHTML=Object.entries(data).map(([leader,slots])=>'<details class="info-details"><summary>'+escaped(infoText(leader))+'</summary>'+slots.map(slot=>'<div class="info-task"><b>'+escaped(ui.team.replace("{n}",slot.slot))+(slot.is_encounter?" · "+escaped(ui.encounterReward):"")+'</b><div class="info-rewards">'+(slot.pokemons||[]).map(p=>'<span class="info-reward">'+escaped(infoText(p.name))+(p.shiny_available?" ✨":"")+'</span>').join("")+'</div></div>').join("")+'</details>').join("")||'<p class="muted">'+escaped(ui.noData)+'</p>';
}
function renderEggs(){
const root=Q("#eggList");if(!root)return;
const ui=newsUi(),data=DATA.eggPool||{};
root.innerHTML=Object.entries(data).map(([group,items])=>'<details class="info-details"><summary>'+escaped(infoText(group))+' <span>'+items.length+(state.newsLang==="en"?" species":" 種")+'</span></summary><div class="info-egg-grid">'+items.map(p=>'<div class="info-egg-item">'+(p.asset_url?'<img loading="lazy" src="'+escaped(p.asset_url)+'" alt="">':"")+'<span>'+escaped(infoText(p.name))+'</span><small>'+escaped(ui.rarity)+" "+escaped(p.rarity_tier??"—")+(p.shiny_available?" · "+escaped(ui.shiny):"")+'</small></div>').join("")+'</div></details>').join("")||'<p class="muted">'+escaped(ui.noData)+'</p>';
}
function renderNewsList(id,items,official){
const root=Q("#"+id);if(!root)return;
const ui=newsUi();
if(!Array.isArray(items)||!items.length){root.innerHTML='<p class="muted">'+escaped(ui.noNews)+'</p>';return;}
root.innerHTML=items.slice(0,20).map(n=>{
const date=n.published_at?infoDate(n.published_at):"";
return '<article class="info-news-item"><b>'+escaped(infoText(n.title))+'</b>'+(date?'<small>'+escaped(date)+'</small>':"")+(n.description?'<p>'+escaped(infoText(n.description.slice(0,600)))+'</p>':"")+'<a class="text-link" href="'+escaped(n.url||n.article_url||"#")+'" target="_blank" rel="noopener">'+escaped(official?ui.officialLink:ui.communityLink)+' ↗</a></article>';
}).join("");
}
function renderNews(){
updateNewsLanguageUI();
renderEvents();renderResearch();renderRocket();renderEggs();
renderNewsList("officialNewsList",DATA.officialNews,true);
renderNewsList("communityNewsList",DATA.communityNews,false);
const ui=newsUi(),meta=DATA.meta||{},feeds=meta.feed_updated_at||{};
const eventCount=meta.event_count??(DATA.events?Object.values(DATA.events).reduce((n,x)=>n+(x||[]).length,0):"—");
Q("#infoMeta").textContent=ui.snapshot+": "+(meta.updated_at||"—")+" · "+ui.eventCount+": "+eventCount+" · "+ui.lastUpdate+": "+(feeds.events||"—")+" · "+ui.hourly;
}

function renderRaids(){
const r=currentRaids();
if(!r.length){Q("#raidBosses").innerHTML='<div class="empty-state">目前團體戰公開資料無法取得。請稍後重新整理。</div>';return;}
const selected=r.map((x,i)=>({i,x,p:raidPokemon(x)})).filter(v=>v.p);
if(!selected.length){Q("#raidBosses").innerHTML='<div class="empty-state">團體戰資料已載入，但寶可夢形態尚未匹配成功。</div>';return;}
const order={"1":0,"3":1,"5":2,"6":3,"mega":4,"mega_legendary":5};
selected.sort((a,b)=>(order[String(a.x.raid_level||a.x.tier)]??9)-(order[String(b.x.raid_level||b.x.tier)]??9)||Number(!!a.x.is_shadow)-Number(!!b.x.is_shadow));
const meta=DATA.meta||{};
const groups=[...new Set(selected.map(v=>String(v.x.raid_level||v.x.tier||"其他")))];
const heading='<div class="raid-source-note">資料來源：Leek Duck · 最近更新：'+escaped(meta.raid_updated_at||"來源未提供時間")+' · 共 '+selected.length+' 個 Boss</div>';
Q("#raidBosses").innerHTML=heading+groups.map(tier=>'<section class="raid-tier-group"><h3>'+escaped(raidTierLabel(tier))+'</h3><div class="raid-grid-inner">'+selected.filter(v=>String(v.x.raid_level||v.x.tier||"其他")===tier).map(({i,x,p})=>{
const cpRange=x.cp_range||{},boost=x.boosted_cp_range||{};
const cpText=cpRange.min&&cpRange.max?'捕捉 CP '+cpRange.min+'–'+cpRange.max+(boost.min&&boost.max?' · 天氣加成 '+boost.min+'–'+boost.max:""):"";
const shadow=x.is_shadow?'<span class="raid-tag shadow">暗影</span>':"";
const form=p.formLabel?'<span class="raid-tag">'+escaped(p.formLabel)+'</span>':"";
return '<button class="raid-card" data-raid="'+i+'"><img src="'+escaped(x.asset_url||sprite(p.pokedexId))+'" alt=""><b>'+escaped(pokemonName(p))+'</b><small>'+escaped(x.name||p.pokemonName)+'</small><div class="raid-tags">'+shadow+form+'</div><small>'+escaped(cpText)+'</small><div class="type-badges">'+typeBadges(p)+'</div></button>';
}).join("")+'</div></section>').join("");
}
function raidAdvice(p){
const weak=weakTo(p.types).filter(x=>x.m>1.01);
const candidates=allPokemon().map(a=>{
if(a.pokedexId===p.pokedexId)return null;
const moves=(a.quickMoves||[]).concat(a.chargedMoves||[]).map(id=>moveType(id)).filter(Number.isFinite);
const max=Math.max(...moves.map(t=>typeEffect(t,p.types)*(a.types?.includes(t)?1.2:1)),0);
return {a,score:max*num(a.attack),max};
}).filter(x=>x&&x.max>1).sort((a,b)=>b.score-a.score).slice(0,12);
return {weak,candidates};
}
function showRaid(index){
const raid=currentRaids()[index],p=raid&&raidPokemon(raid);if(!p)return;
const {weak,candidates}=raidAdvice(p);
Q("#raidDetail").innerHTML='<h3>團體戰 · '+escaped(pokemonName(p))+'</h3><div class="pill-list">'+weak.map(t=>badge(typeName(t.id)+" ×"+t.m.toFixed(2))).join("")+'</div><h4 style="margin:22px 0 11px">簡易克制攻擊手（非 DPS 模擬）</h4><div class="ranking-list">'+candidates.map((x,i)=>'<div class="ranking-item"><span class="rank-number">#'+(i+1)+'</span><img src="'+sprite(x.a.pokedexId)+'" alt=""><span><b>'+escaped(pokemonName(x.a))+'</b><small>基礎攻擊 '+x.a.attack+' · 最大屬性加成 ×'+x.max.toFixed(2)+'</small></span></div>').join("")+'</div><p class="muted" style="font-size:.8rem;margin-top:15px">推介使用具克制屬性、同屬性加成及較高攻擊能力的寶可夢。實際有效傷害高度依賴招式、速度、耐久、隊伍及形態。</p>';
Q("#raidDetail").scrollIntoView({behavior:"smooth",block:"start"});
}
function advisorVisibility(){const which=Q("#advisorTarget").value;Q("#advisorPokemonField").hidden=which!=="pokemon";Q("#advisorOpponentField").hidden=which!=="counter";}
function generateAdvice(){
const mode=Q("#advisorTarget").value,league=Q("#advisorLeague").value,question=Q("#advisorQuestion").value.trim();
const tips=[],evidence=[],heading={team:"隊伍組合建議",counter:"對手克制分析",pokemon:"寶可夢培養價值分析"}[mode];
if(mode==="team"){
const {mons,weak,ranks}=teamIssues(state.teamIds,league);
if(!mons.length){notify("請先在「隊伍分析」選擇寶可夢");return;}
const doubles=weak.filter(x=>x.weak.length>=2);
tips.push("目前隊伍："+mons.map(pokemonName).join("、")+"。");
if(doubles.length)tips.push("主要共同弱點："+doubles.slice(0,6).map(x=>typeName(x.t)+"（"+x.weak.length+" 隻）").join("、")+"。建議避免讓多隻成員同時無法應對這些屬性。");
else tips.push("這支隊伍沒有明顯的雙重共同屬性弱點，但仍需確認招式和能量對局。");
for(const x of ranks){if(x.r)tips.push(pokemonName(x.p)+" 在此聯盟 PvPoke 模擬評分 "+x.r.score+"。");}
evidence.push("使用公開寶可夢屬性及 PvPoke 聯盟排名；這不是完整 1v1 或 3v3 戰鬥模擬。");
}else if(mode==="counter"){
const p=getPokemon(Q("#advisorOpponent").value);if(!p){notify("請先選擇對手寶可夢");return;}
const r=weakTo(p.types).filter(x=>x.m>1).slice(0,8);
tips.push(pokemonName(p)+" 的主要弱點："+r.map(x=>typeName(x.id)+" ×"+x.m.toFixed(2)).join("、")+"。");
const ranked=(DATA["rank"+league]||[]).slice(0,250).map(rr=>({rr,p:rankPokemon(rr)})).filter(x=>x.p&&x.p.pokedexId!==p.pokedexId).map(x=>({...x,coverage:Math.max(...(x.p.quickMoves||[]).concat(x.p.chargedMoves||[]).map(id=>typeEffect(DATA.moveMap?.get(Number(id))?.type,p.types)),0)})).filter(x=>x.coverage>1).sort((a,b)=>b.coverage-a.coverage||b.rr.score-a.rr.score).slice(0,6);
tips.push("優先考慮具有效克制招式且排名較高的候選："+(ranked.map(x=>rankName(x.rr)).join("、")||"目前無足夠排名資料")+"。");
evidence.push("從 PvPoke 前 250 名中尋找具屬性克制招式的候選；未考慮雙方特定技能組和護盾，所以不能視為保證勝利。");
}else{
const p=getPokemon(Q("#advisorPokemon").value);if(!p){notify("請先選擇寶可夢");return;}
const rr=(DATA["rank"+league]||[]).find(x=>parsePvpId(x.speciesName?.replace(/\s*\([^)]*\)/g,""))===parsePvpId(p.pokemonName));
tips.push(pokemonName(p)+" 的基礎攻擊／防禦／體力為 "+p.attack+"／"+p.defense+"／"+p.stamina+"，屬性："+pokemonTypes(p).join("、")+"。");
if(rr){const ix=DATA["rank"+league].indexOf(rr)+1;tips.push("PvPoke 此聯盟模擬排名第 "+ix+" 名、評分 "+rr.score+"。"+(ix<=50?"具競技潛力，值得評估技能與養成成本。":ix<=150?"屬於可考慮的候選，但需視隊伍配置。":"排名較後，建議先確認它是否能解決特定對局。"));}else tips.push("此形態未能直接匹配 PvPoke 排名；暫不能下培養優先級定論。");
const elite=(p.eliteQuickMoves||[]).concat(p.eliteChargedMoves||[]).map(moveName);
if(elite.length)tips.push("厲害學習器招式池包含："+elite.join("、")+"。使用前先核對目前實際可取得招式。");
evidence.push("依據 GO 基礎能力值、招式池和 PvPoke 排名；個人 IV、現有星星沙子及糖果未知，無法直接判定你應否投入資源。");
}
if(question)evidence.push("你的補充問題：「"+question+"」。本機規則引擎不能真正理解所有自由文字；請以已計算的項目為主要依據。");
evidence.push("分析方法：公開資料＋規則式推理，非雲端大型語言模型；不會自動讀取 Pokémon GO 帳戶。");
const container=Q("#advisorReport");container.replaceChildren();const root=document.createElement("div");root.className="analysis-report";
const h=document.createElement("h3");h.textContent=heading;root.append(h);
const ul=document.createElement("ul");tips.forEach(t=>{const li=document.createElement("li");li.textContent=t;ul.append(li);});root.append(ul);
const h2=document.createElement("h3");h2.textContent="資料依據與限制";root.append(h2);
const ul2=document.createElement("ul");evidence.forEach(t=>{const li=document.createElement("li");li.textContent=t;ul2.append(li);});root.append(ul2);container.append(root);
state.reportText=heading+"\n\n"+tips.map(x=>"• "+x).join("\n")+"\n\n資料依據與限制\n"+evidence.map(x=>"• "+x).join("\n");
Q("#copyAdvisor").disabled=false;
}
document.addEventListener("click",e=>{
const tab=e.target.closest("[data-tab],[data-jump]");if(tab){switchTab(tab.dataset.tab||tab.dataset.jump);return;}
const evoToggle=e.target.closest("[data-evo-toggle]");if(evoToggle){const panel=Q("#evolutionPanel");if(panel){const opening=panel.hidden;panel.hidden=!opening;evoToggle.textContent=opening?"隱藏完整進化鏈 ↑":"顯示完整進化鏈 ↓";if(opening)renderEvolutionChain(evoToggle.dataset.evoToggle);}return;}
const evoPick=e.target.closest("[data-evo-select]");if(evoPick){state.selectedDex=evoPick.dataset.evoSelect;Q("#dexSearch").value="";Q("#dexType").value="";state.dexLimit=42;renderDex();if(innerWidth<620)Q("#dexDetail").scrollIntoView({behavior:"smooth"});return;}
const dex=e.target.closest("[data-dex]");if(dex){state.selectedDex=dex.dataset.dex;renderDex();if(innerWidth<620)Q("#dexDetail").scrollIntoView({behavior:"smooth"});return;}
const rk=e.target.closest("[data-rank]");if(rk){state.selectedRank=rk.dataset.rank;renderPvp();if(innerWidth<620)Q("#pvpDetail").scrollIntoView({behavior:"smooth"});return;}
const lg=e.target.closest("[data-league]");if(lg){state.league=lg.dataset.league;state.selectedRank=null;renderPvp();return;}
const tl=e.target.closest("[data-team-league]");if(tl){state.teamLeague=tl.dataset.teamLeague;renderTeam();return;}
const raid=e.target.closest("[data-raid]");if(raid){showRaid(Number(raid.dataset.raid));return;}
const infoLink=e.target.closest("[data-info-link]");if(infoLink){window.open(infoLink.dataset.infoLink,"_blank","noopener");return;}
const calc=e.target.closest("[data-use-calc]");if(calc){const p=getPokemon(calc.dataset.useCalc);if(p){Q("#calcPokemonSearch").value=pokemonName(p);state.calcId=pokemonKey(p);switchTab("calculator");calculate();}return;}
const tt=e.target.closest("[data-use-team]");if(tt){if(tt.dataset.useTeam){state.teamIds[0]=tt.dataset.useTeam;switchTab("team");renderTeam();}return;}
});
for(const id of ["dexSearch","dexType","dexSort"]){Q("#"+id).addEventListener(id==="dexSearch"?"input":"change",()=>{state.dexLimit=42;renderDex();});}
for(const id of ["pvpSearch","pvpLimit"]){Q("#"+id).addEventListener(id==="pvpSearch"?"input":"change",renderPvp);}
for(const id of ["team1","team2","team3","advisorPokemon","advisorOpponent"])setupPokemonPicker(id);
for(const id of ["team1","team2","team3","advisorPokemon","advisorOpponent"])Q("[data-clear-picker='"+id+"']").addEventListener("click",()=>clearPokemonPicker(id));
document.addEventListener("click",e=>{if(!e.target.closest(".pokemon-picker"))for(const id of ["team1","team2","team3","advisorPokemon","advisorOpponent"])closePicker(id);});
Q("#infoCategory").addEventListener("change",renderEvents);
Q("#newsLangToggle").addEventListener("click",e=>{const button=e.target.closest("[data-news-lang]");if(!button)return;state.newsLang=button.dataset.newsLang==="en"?"en":"zh";try{localStorage.setItem("goNewsLang",state.newsLang);}catch(err){}renderNews();});
for(const id of ["moveSearch","moveKind","moveType"])Q("#"+id).addEventListener(id==="moveSearch"?"input":"change",()=>{state.moveLimit=70;renderMoves();});
Q("#dexMore").addEventListener("click",()=>{state.dexLimit+=42;renderDex();});
Q("#moveMore").addEventListener("click",()=>{state.moveLimit+=70;renderMoves();});
Q("#analyzeTeamBtn").addEventListener("click",analyzeTeam);
Q("#calculateBtn").addEventListener("click",calculate);
for(const id of ["calcLevel","targetLevel"])Q("#"+id).addEventListener("input",()=>{Q("#levelLabel").textContent=Q("#calcLevel").value;Q("#targetLevelLabel").textContent=Q("#targetLevel").value;});
Q("#advisorTarget").addEventListener("change",advisorVisibility);
Q("#advisorRun").addEventListener("click",generateAdvice);
Q("#copyAdvisor").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(state.reportText);notify("分析報告已複製");}catch(e){notify("複製失敗，請手動選取報告");}});
Q("#refreshBtn").addEventListener("click",()=>{location.reload();});
window.addEventListener("hashchange",()=>{const tab=location.hash.slice(1);if(tab&&tab!==state.tab)switchTab(tab);});
(function init(){try{state.newsLang=localStorage.getItem("goNewsLang")==="en"?"en":"zh";}catch(err){}const hash=location.hash.slice(1);if(hash&&Q("#"+hash)?.classList.contains("view"))switchTab(hash);advisorVisibility();getJSON("./data/meta.json").then(meta=>{DATA.meta=meta;sourceSummary();}).catch(()=>{});loadCore();})();
