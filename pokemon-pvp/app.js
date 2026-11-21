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
let state={tab:"overview",dexLimit:42,moveLimit:70,selectedDex:null,selectedRank:null,league:"1500",teamLeague:"1500",teamIds:["","",""],calcId:null,rankData:{},reportText:"",selectedRaid:null};
function notify(s){const t=Q("#toast");t.textContent=s;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),3000);}
function badge(t){return '<span class="type-badge">'+escaped(t)+'</span>';}
function typeName(t){return LANG[Number(t)]||String(t||"未知");}
function pokemonName(p){return DATA.names?.["poke_"+p.pokedexId]||p.pokemonName||"未知";}
function moveName(id){return DATA.moveNames?.["move_"+id]||DATA.moveMap?.get(Number(id))?.moveName||String(id);}
function allPokemon(){return DATA.pokemon||[];}
function getPokemon(id){return DATA.pokemonMap?.get(Number(id));}
function sprite(id){return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+Number(id)+".png";}
function pokemonTypes(p){return (p.types||[]).map(typeName);}
function typeBadges(p){return (p.types||[]).map(t=>badge(typeName(t))).join("");}
function makeSelectOptions(){const all=allPokemon().slice().sort((a,b)=>a.pokedexId-b.pokedexId);return '<option value="">選擇寶可夢</option>'+all.map(p=>'<option value="'+p.pokedexId+'">'+escaped(pokemonName(p))+' (#'+p.pokedexId+')</option>').join("");}
function urlData(key){return {
pokemon:BASE+"pokemon.json",moves:BASE+"moves.json",types:BASE+"types.json",names:BASE+"translations/zh-tw/pokemon.json",moveNames:BASE+"translations/zh-tw/moves.json",typeNames:BASE+"translations/zh-tw/types.json",
cpm:POGO+"cp_multiplier.json",powerups:POGO+"pokemon_powerup_requirements.json",raids:POGO+"raid_bosses.json",
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
const keys=["pokemon","moves","types","names","moveNames","typeNames","cpm","rank1500","rank2500","rank10000","raids"];
await Promise.all(keys.map(k=>loadResource(k).catch(e=>console.warn("Resource",k,e))));
buildIndexes();renderEverything();
}
function buildIndexes(){
if(Array.isArray(DATA.pokemon))DATA.pokemonMap=new Map(DATA.pokemon.filter(p=>p&&Number.isInteger(Number(p.pokedexId))).map(p=>[Number(p.pokedexId),p]));
if(Array.isArray(DATA.moves))DATA.moveMap=new Map(DATA.moves.map(m=>[Number(m.moveId),m]));
if(Array.isArray(DATA.types))DATA.typeMap=new Map(DATA.types.map(t=>[Number(t.typeId),t]));
}
function parsePvpId(x){const source=String(x||"").toLowerCase();return source.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]/g,"");}
function rankName(r){
const name=String(r.speciesName||r.speciesId||"");
const base=name.replace(/\s*\([^)]*\)/g,"").trim();
const p=allPokemon().find(x=>parsePvpId(x.pokemonName)===parsePvpId(base));
return p?pokemonName(p)+(base!==name?" "+name.slice(base.length).trim():""):name;
}
function rankPokemon(r){
const name=String(r.speciesName||"").replace(/\s*\([^)]*\)/g,"");
return allPokemon().find(x=>parsePvpId(x.pokemonName)===parsePvpId(name));
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
Q("#pageTitle").textContent=({overview:"訓練家總覽",pokedex:"寶可夢圖鑑",pvp:"PVP 排名",team:"隊伍分析",calculator:"IV / CP 計算器",moves:"招式圖鑑",raids:"團體戰助手",advisor:"AI 智能分析"})[tab];if(location.hash.slice(1)!==tab)history.replaceState(null,"","#"+tab);scrollTo({top:0,behavior:"instant"});}
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
sourceSummary();fillFilterTypes();renderDex();renderPvp();fillPokemonControls();renderTeam();renderMoves();renderRaids();
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
const all=sortPokedex(allPokemon().filter(p=>(!type||p.types?.includes(Number(type)))&&(!q||String(p.pokedexId).includes(q)||pokemonName(p).toLowerCase().includes(q)||String(p.pokemonName).toLowerCase().includes(q))));
Q("#dexGrid").innerHTML=all.slice(0,state.dexLimit).map(p=>'<button class="dex-card '+(state.selectedDex===p.pokedexId?"selected":"")+'" data-dex="'+p.pokedexId+'"><small class="dex-id">#'+String(p.pokedexId).padStart(4,"0")+'</small><img class="dex-sprite" loading="lazy" alt="" src="'+sprite(p.pokedexId)+'"><b>'+escaped(pokemonName(p))+'</b><div class="type-badges">'+typeBadges(p)+'</div></button>').join("")||'<div class="empty-state">找不到符合條件的寶可夢。</div>';
Q("#dexCount").textContent="顯示 "+Math.min(all.length,state.dexLimit)+" / "+all.length+" 隻";
Q("#dexMore").hidden=all.length<=state.dexLimit;
if(state.selectedDex)renderDexDetail(state.selectedDex);
}
function renderDexDetail(id){
const p=getPokemon(id);if(!p)return;state.selectedDex=p.pokedexId;
const stat=(label,value,max=320)=>'<div class="detail-stat"><small>'+label+'</small><b>'+short(value)+'</b><div class="ability-bar"><span style="width:'+Math.min(100,num(value)/max*100)+'%"></span></div></div>';
const fast=(p.quickMoves||[]).map(id=>moveName(id));
const charged=(p.chargedMoves||[]).map(id=>moveName(id));
const elite=(p.eliteQuickMoves||[]).concat(p.eliteChargedMoves||[]).map(id=>moveName(id));
const weak=weakTo(p.types).filter(t=>t.m>1).slice(0,5),res=weakTo(p.types).filter(t=>t.m<1).slice(-5).reverse();
Q("#dexDetail").innerHTML='<div class="detail-heading"><img src="'+sprite(id)+'" alt=""><div><small>#'+id+'</small><h3>'+escaped(pokemonName(p))+'</h3><small>'+escaped(p.pokemonName)+'</small></div></div><div class="type-badges">'+typeBadges(p)+'</div><div class="detail-block"><h4>GO 基礎能力值</h4><div class="detail-grid">'+stat("攻擊",p.attack)+stat("防禦",p.defense)+stat("體力",p.stamina)+stat("等級 50 · 100 IV CP",cp(p,[15,15,15],50),6000)+'</div></div><div class="detail-block"><h4>屬性相剋</h4><small>弱點</small><div class="pill-list">'+weak.map(t=>badge(typeName(t.id)+" ×"+t.m.toFixed(2))).join("")+'</div><small style="display:block;margin-top:10px">抗性</small><div class="pill-list">'+res.map(t=>badge(typeName(t.id)+" ×"+t.m.toFixed(2))).join("")+'</div></div><div class="detail-block"><h4>可學一般招式</h4><p class="detail-list">'+escaped(fast.join("、")||"尚無資料")+'</p></div><div class="detail-block"><h4>可學特殊招式</h4><p class="detail-list">'+escaped(charged.join("、")||"尚無資料")+'</p></div><div class="detail-block"><h4>厲害學習器招式（來源資料）</h4><p class="detail-list">'+escaped(elite.join("、")||"未列出")+'</p></div><div class="detail-block"><h4>第二特殊招式</h4><p class="detail-list">星星沙子 '+short(p.thirdMoveStardust)+' ／ 糖果 '+short(p.thirdMoveCandy)+'</p></div><div class="detail-block"><button class="btn btn-primary btn-block" data-use-calc="'+id+'">計算這隻的 IV / CP →</button></div>';
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
Q("#pvpDetail").innerHTML='<div class="detail-heading">'+(p?'<img src="'+sprite(p.pokedexId)+'" alt="">':"")+'<div><small>PVP RANK #'+(list.indexOf(r)+1)+'</small><h3>'+escaped(rankName(r))+'</h3><small>模擬評分 '+show(r.score)+'</small></div></div><div class="detail-block"><h4>推薦招式</h4><p class="detail-list">'+escaped(moves.join(" ／ ")||"暫無推薦資料")+'</p></div><div class="detail-block"><h4>模擬中較有利的對局</h4><p class="detail-list">'+escaped(matching(r.matchups))+'</p></div><div class="detail-block"><h4>模擬中較不利的對局</h4><p class="detail-list">'+escaped(matching(r.counters))+'</p></div>'+(r.editorNotes?'<div class="detail-block"><h4>PvPoke 原文評語</h4><p class="detail-list">'+escaped(r.editorNotes)+'</p></div>':"")+'<div class="detail-block"><button class="btn btn-primary btn-block" data-use-team="'+(p?p.pokedexId:"")+'">加入隊伍分析 →</button></div>';
}
function fillPokemonControls(){
if(!allPokemon().length)return;const opts=makeSelectOptions();
for(const id of ["team1","team2","team3","advisorPokemon","advisorOpponent"]){const el=Q("#"+id),before=el.value;el.innerHTML=opts;el.value=before||"";}
Q("#pokemonOptions").innerHTML=allPokemon().map(p=>'<option value="'+escaped(pokemonName(p))+'">'+escaped(p.pokemonName)+'</option>').join("");
}
function renderTeam(){
QA("[data-team-league]").forEach(x=>x.classList.toggle("active",x.dataset.teamLeague===state.teamLeague));
for(let i=0;i<3;i++){
const p=getPokemon(state.teamIds[i]);Q("#team"+(i+1)).value=state.teamIds[i]||"";
Q("#team"+(i+1)+"Card").innerHTML=p?'<img src="'+sprite(p.pokedexId)+'" alt=""><b>'+escaped(pokemonName(p))+'</b><br><span>'+pokemonTypes(p).join(" / ")+'</span><br><small>最高 CP '+cp(p,[15,15,15],50)+'</small>':"尚未選擇";
}
}
function teamIssues(ids,league){
const mons=ids.map(getPokemon).filter(Boolean);
const weak=Array.from({length:18},(_,i)=>i+1).map(t=>({t,weak:mons.filter(p=>typeEffect(t,p.types)>1.01),resist:mons.filter(p=>typeEffect(t,p.types)<.99)})).sort((a,b)=>b.weak.length-a.weak.length);
const ranks=mons.map(p=>({p,r:(DATA["rank"+league]||[]).find(x=>parsePvpId(x.speciesName?.replace(/\s*\([^)]*\)/g,""))===parsePvpId(p.pokemonName))}));
const coverage=new Set(mons.flatMap(p=>(p.quickMoves||[]).concat(p.chargedMoves||[])).map(x=>DATA.moveMap?.get(Number(x))?.type).filter(Number.isFinite));
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
const p=allPokemon().find(x=>pokemonName(x).toLowerCase()===q||x.pokemonName.toLowerCase()===q||String(x.pokedexId)===q);
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
function currentRaids(){const r=DATA.raids;if(Array.isArray(r))return r;if(r&&r.current&&typeof r.current==="object")return Object.entries(r.current).flatMap(([tier,arr])=>Array.isArray(arr)?arr.map(x=>({...x,raid_level:tier})):[]);return [];}
function raidPokemon(r){
const id=r.pokemon_id||r.pokemon_id_number||r.pokemonId||r.id;
return getPokemon(id)||allPokemon().find(p=>parsePvpId(p.pokemonName)===parsePvpId(r.pokemon||r.pokemon_name||r.name));
}
function renderRaids(){
const r=currentRaids();
if(!r.length){Q("#raidBosses").innerHTML='<div class="empty-state">目前公開團體戰 Boss 清單無法取得或格式未被支援。你仍可在圖鑑選擇任何寶可夢查詢其弱點。</div>';return;}
const selected=r.map((x,i)=>({i,x,p:raidPokemon(x)})).filter(v=>v.p).slice(0,40);
if(!selected.length){Q("#raidBosses").innerHTML='<div class="empty-state">團體戰來源目前未提供可匹配的 Boss 清單，請使用圖鑑查詢克制。</div>';return;}
Q("#raidBosses").innerHTML=selected.map(({i,x,p})=>'<button class="raid-card" data-raid="'+i+'"><img src="'+sprite(p.pokedexId)+'" alt=""><b>'+escaped(pokemonName(p))+'</b><small>團體戰 · '+escaped(x.raid_level||x.tier||"Boss")+'</small><div class="type-badges">'+typeBadges(p)+'</div></button>').join("");
}
function raidAdvice(p){
const weak=weakTo(p.types).filter(x=>x.m>1.01);
const candidates=allPokemon().map(a=>{
if(a.pokedexId===p.pokedexId)return null;
const moves=(a.quickMoves||[]).concat(a.chargedMoves||[]).map(id=>DATA.moveMap?.get(Number(id))).filter(m=>m?.type);
const max=Math.max(...moves.map(m=>typeEffect(m.type,p.types)*(a.types?.includes(m.type)?1.2:1)),0);
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
const dex=e.target.closest("[data-dex]");if(dex){state.selectedDex=Number(dex.dataset.dex);renderDex();if(innerWidth<620)Q("#dexDetail").scrollIntoView({behavior:"smooth"});return;}
const rk=e.target.closest("[data-rank]");if(rk){state.selectedRank=rk.dataset.rank;renderPvp();if(innerWidth<620)Q("#pvpDetail").scrollIntoView({behavior:"smooth"});return;}
const lg=e.target.closest("[data-league]");if(lg){state.league=lg.dataset.league;state.selectedRank=null;renderPvp();return;}
const tl=e.target.closest("[data-team-league]");if(tl){state.teamLeague=tl.dataset.teamLeague;renderTeam();return;}
const raid=e.target.closest("[data-raid]");if(raid){showRaid(Number(raid.dataset.raid));return;}
const calc=e.target.closest("[data-use-calc]");if(calc){const p=getPokemon(calc.dataset.useCalc);if(p){Q("#calcPokemonSearch").value=pokemonName(p);state.calcId=p.pokedexId;switchTab("calculator");calculate();}return;}
const tt=e.target.closest("[data-use-team]");if(tt){if(tt.dataset.useTeam){state.teamIds[0]=tt.dataset.useTeam;switchTab("team");renderTeam();}return;}
});
for(const id of ["dexSearch","dexType","dexSort"]){Q("#"+id).addEventListener(id==="dexSearch"?"input":"change",()=>{state.dexLimit=42;renderDex();});}
for(const id of ["pvpSearch","pvpLimit"]){Q("#"+id).addEventListener(id==="pvpSearch"?"input":"change",renderPvp);}
for(let i=0;i<3;i++)Q("#team"+(i+1)).addEventListener("change",e=>{state.teamIds[i]=e.target.value;renderTeam();});
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
(function init(){const hash=location.hash.slice(1);if(hash&&Q("#"+hash)?.classList.contains("view"))switchTab(hash);advisorVisibility();getJSON("./data/meta.json").then(meta=>{DATA.meta=meta;sourceSummary();}).catch(()=>{});loadCore();})();
