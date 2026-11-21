"use strict";
/* GO Battle Lab — zero-dependency, locally stored Pokémon GO training log.
   Initial values are editable historical notes, NOT live account data. */
const KEY="go-battle-lab-v1";
const TYPES=["一般","火","水","電","草","冰","格鬥","毒","地面","飛行","超能力","蟲","岩石","幽靈","龍","惡","鋼","妖精"];
const TYPE_ATTACK={
"一般":{岩石:.625,幽靈:.39,鋼:.625},"火":{火:.625,水:.625,草:1.6,冰:1.6,蟲:1.6,岩石:.625,龍:.625,鋼:1.6},
"水":{火:1.6,水:.625,草:.625,地面:1.6,岩石:1.6,龍:.625},
"電":{水:1.6,電:.625,草:.625,地面:.39,飛行:1.6,龍:.625},
"草":{火:.625,水:1.6,草:.625,毒:.625,地面:1.6,飛行:.625,蟲:.625,岩石:1.6,龍:.625,鋼:.625},
"冰":{火:.625,水:.625,草:1.6,冰:.625,地面:1.6,飛行:1.6,龍:1.6,鋼:.625},
"格鬥":{一般:1.6,冰:1.6,毒:.625,飛行:.625,超能力:.625,蟲:.625,岩石:1.6,幽靈:.39,惡:1.6,鋼:1.6,妖精:.625},
"毒":{草:1.6,毒:.625,地面:.625,岩石:.625,幽靈:.625,鋼:.39,妖精:1.6},
"地面":{火:1.6,電:1.6,草:.625,毒:1.6,飛行:.39,蟲:.625,岩石:1.6,鋼:1.6},
"飛行":{電:.625,草:1.6,格鬥:1.6,蟲:1.6,岩石:.625,鋼:.625},
"超能力":{格鬥:1.6,毒:1.6,超能力:.625,惡:.39,鋼:.625},
"蟲":{火:.625,草:1.6,格鬥:.625,毒:.625,飛行:.625,超能力:1.6,幽靈:.625,惡:1.6,鋼:.625,妖精:.625},
"岩石":{火:1.6,冰:1.6,格鬥:.625,地面:.625,飛行:1.6,蟲:1.6,鋼:.625},
"幽靈":{一般:.39,超能力:1.6,幽靈:1.6,惡:.625},
"龍":{龍:1.6,鋼:.625,妖精:.39},"惡":{格鬥:.625,超能力:1.6,幽靈:1.6,惡:.625,妖精:.625},
"鋼":{火:.625,水:.625,電:.625,冰:1.6,岩石:1.6,鋼:.625,妖精:1.6},
"妖精":{火:.625,格鬥:1.6,毒:.625,龍:1.6,惡:1.6,鋼:.625}
};
const INITIAL={
version:1, snapshot:"2026/11/20",
resources:{rareCandy:234,stardust:null,eliteFast:0,eliteCharged:null,regularFast:null,regularCharged:null,otherCandy:null},
rank:{season:"本季（請填寫）",current:null,currentWins:0,neededWins:null,target:19,dailyLimit:25,extraToday:0,notes:"請參考遊戲內 Rank 顯示更新每級的實際勝場要求。"},
pokemon:[
{id:"p-kyurem",name:"焰白酋雷姆",league:"master",types:["龍","冰"],cp:4046,level:null,ivs:[15,15,15],candy:null,xlcandy:null,stardustCost:null,candyCost:null,quickMove:"龍息",quickType:"龍",chargeMove1:"",charge1Type:"",chargeMove2:"",charge2Type:"",secondUnlocked:false,needsElite:false,fusion:"焰白合體",status:"待培養",priority:1,notes:"從先前紀錄得知為合體、100 IV、CP 4046、已改龍息。其他招式請核對。"},
{id:"p-zacian",name:"蒼響（劍之王）",league:"master",types:["妖精","鋼"],cp:null,level:null,ivs:[null,null,null],candy:null,xlcandy:null,stardustCost:null,candyCost:null,quickMove:"",quickType:"",chargeMove1:"",charge1Type:"",chargeMove2:"",charge2Type:"",secondUnlocked:false,needsElite:false,fusion:"非合體（形態）",status:"待測試",priority:2,notes:"招式及 IV 待你確認。"},
{id:"p-metagross",name:"巨金怪",league:"master",types:["鋼","超能力"],cp:null,level:null,ivs:[null,null,null],candy:null,xlcandy:null,stardustCost:null,candyCost:null,quickMove:"",quickType:"",chargeMove1:"",charge1Type:"",chargeMove2:"",charge2Type:"",secondUnlocked:false,needsElite:false,fusion:"",status:"待培養",priority:3,notes:"是否開第二招式及實際 IV 待確認。"},
{id:"p-kingdra",name:"刺龍王",league:"ultra",types:["水","龍"],cp:null,level:null,ivs:[null,null,null],candy:null,xlcandy:null,stardustCost:null,candyCost:null,quickMove:"",quickType:"",chargeMove1:"",charge1Type:"",chargeMove2:"",charge2Type:"",secondUnlocked:false,needsElite:false,fusion:"",status:"待測試",priority:3,notes:"暫列高級聯盟候選，請按實際配置核對。"},
{id:"p-greninja",name:"甲賀忍蛙",league:"ultra",types:["水","惡"],cp:null,level:null,ivs:[null,null,null],candy:null,xlcandy:null,stardustCost:null,candyCost:null,quickMove:"",quickType:"",chargeMove1:"",charge1Type:"",chargeMove2:"",charge2Type:"",secondUnlocked:false,needsElite:false,fusion:"",status:"待測試",priority:3,notes:"暫列候選，數值待核對。"},
{id:"p-ferrothorn",name:"堅果啞鈴",league:"ultra",types:["草","鋼"],cp:null,level:null,ivs:[null,null,null],candy:null,xlcandy:null,stardustCost:null,candyCost:null,quickMove:"",quickType:"",chargeMove1:"",charge1Type:"",chargeMove2:"",charge2Type:"",secondUnlocked:false,needsElite:false,fusion:"",status:"待測試",priority:3,notes:"暫列候選，數值待核對。"}
],
teams:[{id:"t-master",name:"大師聯盟主力（待核對）",league:"master",members:["p-kyurem","p-zacian","p-metagross"],status:"待測試",notes:"此為暫存的候選陣容，請與遊戲內實際隊伍核對。"}, {id:"t-ultra",name:"高級聯盟候選（待核對）",league:"ultra",members:["p-kingdra","p-greninja","p-ferrothorn"],status:"待測試",notes:"此為候選陣容，非已確認的最強隊伍。"}],
battles:[],notes:[
{id:"n-1",title:"記錄對戰失誤",category:"操作",status:"待測試",content:"每次敗北後，記下是否因為護盾分配、換人時機或能量管理失誤，並制定一個下場可以嘗試的改進方法。"},
{id:"n-2",title:"培養前先核對資源",category:"養成",status:"待培養",content:"先核對 IV、CP、學習器、第二招式需求，以及遊戲內顯示的星星沙子和糖果成本，避免一次消耗所有神奇糖果。"}
]};
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
function deepClone(x){return JSON.parse(JSON.stringify(x));}
function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return deepClone(INITIAL);const x=JSON.parse(raw);if(!valid(x))throw Error("格式不符");return x;}catch(e){console.warn(e);return deepClone(INITIAL);}}
function valid(x){return !!(x&&x.version===1&&Array.isArray(x.pokemon)&&Array.isArray(x.teams)&&Array.isArray(x.battles)&&Array.isArray(x.notes)&&x.resources&&x.rank);}
let data=load(),activeLeague="master",activeTeam=null,editing=null;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));$("#snapshotBadge").textContent="已儲存至本機";}catch(e){notify("儲存失敗，請匯出備份");}}
function txt(v,f="待核對"){return v===null||v===undefined||v===""?f:String(v);}
function num(v){if(v===null||v===undefined||v==="")return null;const n=Number(v);return Number.isFinite(n)?n:null;}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function e(v){return esc(txt(v));}
function league(x){return x==="master"?"大師聯盟":"高級聯盟";}
function statusTag(s){const c=s==="已完成"?"success":s==="待培養"?"warn":s==="需替換"?"danger":"purple";return '<span class="tag '+c+'">'+esc(s||"待核對")+"</span>";}
function pkm(id){return data.pokemon.find(p=>p.id===id);}
function team(id){return data.teams.find(t=>t.id===id);}
function newid(){return "id-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8);}
function today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function notify(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600);}
function safeDate(x){if(!x)return "";const d=String(x).slice(0,10);return /^\d{4}-\d{2}-\d{2}$/.test(d)?d:"";}
function resultCounts(list){const wins=list.filter(b=>b.outcome==="勝").length;return {wins,total:list.length,losses:list.filter(b=>b.outcome==="負").length};}
function stat(label,value,foot,cls=""){return '<div class="stat '+cls+'"><div class="stat-label">'+esc(label)+'</div><div class="stat-number">'+esc(value)+'</div><div class="stat-foot">'+esc(foot)+'</div></div>';}
function statPercent(a,b){return b?Math.round(100*a/b)+"%":"--";}
function todayBattles(){return data.battles.filter(b=>safeDate(b.date)===today());}
function render(){
const battles=resultCounts(data.battles),d=resultCounts(todayBattles()),rank=data.rank,remaining=rank.neededWins===null||rank.neededWins===""?null:Math.max(0,Number(rank.neededWins)-(Number(rank.currentWins)||0));
$("#stats").innerHTML=stat("目前 Rank",txt(rank.current,"待設定"),"目標 Rank "+txt(rank.target,19),"accent")+stat("還需勝場",remaining===null?"待設定":remaining,"本級設定的所需勝場")+stat("累積勝率",statPercent(battles.wins,battles.total),battles.wins+" 勝 / "+battles.total+" 場","violet")+stat("神奇糖果",txt(data.resources.rareCandy),"請手動更新庫存");
let pct=rank.neededWins?Math.max(0,Math.min(100,Math.round((Number(rank.currentWins)||0)/Number(rank.neededWins)*100))):0;
let steps=[15,16,17,18,19].map(n=>'<span class="rank-step '+(rank.current===n?"current":rank.current>n?"past":"")+'">'+n+'</span>').join("");
$("#rankCard").innerHTML='<div class="progress-label"><strong>Rank '+e(rank.current)+'</strong><small>'+esc(rank.season||"")+'</small></div><div class="bar"><span style="width:'+pct+'%"></span></div><div class="hint">本級勝場：'+esc(txt(rank.currentWins,0))+" / "+e(rank.neededWins)+"　·　還需 "+esc(txt(remaining))+" 勝</div><div class='rank-steps'>"+steps+'</div><p class="hint">每級條件可能不同，請按遊戲內顯示填寫。達成門檻後更新 Rank。</p>';
const used=d.total+(num(rank.extraToday)||0),limit=Math.max(1,num(rank.dailyLimit)||25),usedPct=Math.min(used,limit);
$("#dailyCard").innerHTML='<div class="today-count">'+used+' <small>/ '+limit+' 場（手動設定每日上限）</small></div><div class="daily-circles">'+Array.from({length:Math.min(50,limit)},(_,i)=>'<span class="'+(i<usedPct?"done":"")+'"></span>').join("")+'</div><p class="hint">今日已記錄：'+d.wins+' 勝 '+d.losses+' 負。其他未逐場記錄的場次，可在 Rank 設定中補填。</p>';
$("#quickTeams").innerHTML=data.teams.slice(0,4).map(teamCard).join("")||empty("尚未建立隊伍");
const prioritized=data.pokemon.filter(p=>p.status!=="已完成"&&p.status!=="需替換").sort((a,b)=>(num(a.priority)||99)-(num(b.priority)||99)).slice(0,4);
$("#priorityCard").innerHTML=prioritized.map(p=>'<div class="priority-row"><div><strong>'+esc(p.name)+'</strong><small>CP '+e(p.cp)+' · 優先級 '+e(p.priority)+'</small></div><button class="btn btn-sm btn-outline" data-action="edit-mon" data-id="'+esc(p.id)+'">修改</button></div>').join("")||empty("沒有待培養項目");
$("#resourcesCard").innerHTML=[["神奇糖果",data.resources.rareCandy],["星星沙子",data.resources.stardust],["厲害特殊招式學習器",data.resources.eliteCharged],["厲害一般招式學習器",data.resources.eliteFast]].map(([a,b])=>'<div class="resource-row"><span>'+esc(a)+'</span><strong>'+e(b)+'</strong></div>').join("");
renderTeams();renderRoster();renderBattles();renderNotes();
}
function empty(message){return '<div class="empty">'+esc(message)+'</div>';}
function teamCard(t){
const mons=t.members.map(id=>pkm(id)).filter(Boolean);
return '<article class="team-card"><div class="team-title"><div><div class="eyebrow">'+esc(league(t.league).toUpperCase())+'</div><h3>'+esc(t.name)+'</h3></div>'+statusTag(t.status)+'</div>'+
mons.map(p=>'<div class="pokemon-row"><span class="poke-mark">✦</span><div><strong>'+esc(p.name)+'</strong><small>'+esc(p.types.join(" / ")||"屬性待核對")+'</small></div><div class="right"><strong>CP '+e(p.cp)+'</strong><small>'+e(p.ivs.map(n=>n===null?"?":n).join("/"))+' IV</small></div></div>').join("")+
'<div class="team-actions"><span class="team-meta">'+mons.length+'/3 隻 · '+esc(t.notes||"已建立配置").slice(0,30)+'</span><button class="btn btn-sm btn-outline" data-action="edit-team" data-id="'+esc(t.id)+'">編輯隊伍</button></div></article>';
}
function typeMultiplier(atk,def){return def.reduce((m,t)=>m*((TYPE_ATTACK[atk]||{})[t]||1),1);}
function renderTeams(){
$$("[data-league]").forEach(b=>b.classList.toggle("active",b.dataset.league===activeLeague));
const list=data.teams.filter(t=>t.league===activeLeague);
$("#teamsList").innerHTML=list.map(t=>teamCard(t).replace('</div></article>','<button class="btn btn-sm btn-outline" data-action="analyze-team" data-id="'+esc(t.id)+'">分析</button></div></article>')).join("")||empty("這個聯盟尚未有隊伍，按「新增隊伍」開始。");
const t=team(activeTeam)||list[0];if(t&&t.league!==activeLeague){activeTeam=null;}
const selected=(t&&t.league===activeLeague)?t:list[0];
if(!selected){$("#typeAnalysis").innerHTML=empty("請先新增隊伍");return;}
const mons=selected.members.map(pkm).filter(Boolean);const eligible=mons.filter(p=>p.types&&p.types.length);
const weak=TYPES.map(type=>({type,items:eligible.filter(p=>typeMultiplier(type,p.types)>1.01).map(p=>p.name)})).filter(x=>x.items.length).sort((a,b)=>b.items.length-a.items.length);
const covers=[...new Set(mons.flatMap(p=>[p.quickType,p.charge1Type,p.charge2Type]).filter(t=>TYPES.includes(t)))];
const weakRows=weak.map(x=>'<div class="analysis-type"><b class="analysis-tag">'+esc(x.type)+' · '+x.items.length+' 隻弱點</b><small>'+esc(x.items.join("、"))+'</small></div>').join("");
$("#typeAnalysis").innerHTML='<p class="hint">分析陣容：<strong>'+esc(selected.name)+'</strong>。弱點按 Pokémon GO 屬性克制倍數估計；實戰還取決於護盾、招式和能量。</p><div class="analysis-columns"><div><h4>全隊防守弱點</h4>'+(weakRows||'<p class="muted">未偵測到明顯弱點（請確認屬性）。</p>')+'</div><div><h4>已填寫的進攻招式屬性</h4><div class="coverage-list">'+(covers.map(t=>'<span class="type-pill">'+esc(t)+'</span>').join("")||'<p class="muted">尚未填寫招式屬性。</p>')+'</div><p class="hint">只有已填寫招式類型才計入覆蓋。請為每隻寶可夢更新招式及屬性。</p><div class="button-group"><button class="btn btn-sm btn-outline" data-action="edit-team" data-id="'+esc(selected.id)+'">編輯此隊</button></div></div></div>';
}
function renderRoster(){
const q=($("#rosterSearch").value||"").trim().toLowerCase(),l=$("#rosterLeague").value,s=$("#rosterStatus").value;
const ps=data.pokemon.filter(p=>(l==="all"||p.league===l)&&(s==="all"||p.status===s)&&[p.name,p.quickMove,p.chargeMove1,p.chargeMove2,p.notes].join(" ").toLowerCase().includes(q));
$("#rosterGrid").innerHTML=ps.map(p=>{
const ivs=p.ivs.map(v=>v===null?"?":v).join("/");const cost=(p.stardustCost===null&&p.candyCost===null)?"待填寫":txt(p.stardustCost,"?")+" 沙 + "+txt(p.candyCost,"?")+" 糖";
return '<article class="mon-card"><div class="mon-top"><div class="mon-glyph">✦</div><div><h3>'+esc(p.name)+'</h3><small>'+esc(league(p.league))+' · '+esc(p.types.join(" / ")||"未知屬性")+'</small></div></div><div class="mon-cp"><span>CP </span>'+e(p.cp)+'</div><div class="mon-tags">'+statusTag(p.status)+(p.fusion?'<span class="tag purple">'+esc(p.fusion)+'</span>':"")+(p.secondUnlocked?'<span class="tag success">已開第二招</span>':'<span class="tag warn">第二招未確認／未開</span>')+'</div><div class="mon-fields"><div><small>IV 攻/防/體</small><strong>'+esc(ivs)+'</strong></div><div><small>等級</small><strong>'+e(p.level)+'</strong></div><div><small>糖果 / XL</small><strong>'+e(p.candy)+' / '+e(p.xlcandy)+'</strong></div><div><small>預估升級成本</small><strong>'+esc(cost)+'</strong></div></div><div class="mon-moves">一般：'+e(p.quickMove)+'<br>特殊 1：'+e(p.chargeMove1)+'<br>特殊 2：'+e(p.chargeMove2)+'</div><div class="mon-actions"><button class="btn btn-sm btn-outline" data-action="edit-mon" data-id="'+esc(p.id)+'">修改數值</button><button class="btn btn-sm btn-outline" data-action="delete-mon" data-id="'+esc(p.id)+'">刪除</button></div></article>';
}).join("")||empty("沒有符合條件的寶可夢");
}
function renderBattles(){
const all=data.battles,scope=$("#battleLeague").value,list=all.filter(b=>scope==="all"||b.league===scope).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
const r=resultCounts(list);
$("#battleMetrics").innerHTML=stat("記錄場次",r.total,"逐場對戰總數")+stat("勝率",statPercent(r.wins,r.total),"勝場 "+r.wins+" / 負場 "+r.losses,"accent")+stat("今日對戰",todayBattles().length,"僅計算逐場紀錄");
$("#battleList").innerHTML=list.map(b=>'<article class="battle-item"><div><div class="battle-head">'+statusTag(b.outcome==="勝"?"已完成":b.outcome==="負"?"需替換":"待測試")+'<strong>'+esc(b.opponent||"對手未記錄")+'</strong><span class="tag">'+esc(b.outcome)+'</span></div><div class="battle-meta">'+esc(b.date)+' · '+esc(league(b.league))+' · '+esc(team(b.teamId)?.name||"未指定隊伍")+'</div>'+(b.opponentTeam?'<p>對手陣容：'+esc(b.opponentTeam)+'</p>':"")+(b.issue?'<p>問題：'+esc(b.issue)+'</p>':"")+(b.improvement?'<p>改進：'+esc(b.improvement)+'</p>':"")+'</div><div class="battle-right"><button class="btn btn-sm btn-outline" data-action="edit-battle" data-id="'+esc(b.id)+'">編輯</button><button class="btn btn-sm btn-outline" data-action="delete-battle" data-id="'+esc(b.id)+'">刪除</button></div></article>').join("")||empty("尚未記錄對戰。每場輸贏與失誤都可以在這裡保存。");
}
function renderNotes(){
$("#noteList").innerHTML=data.notes.map(n=>'<article class="note-card"><span class="tag">'+esc(n.category||"技術")+'</span><h3 style="margin-top:12px">'+esc(n.title)+'</h3><p>'+esc(n.content||"")+'</p><div class="note-bottom">'+statusTag(n.status)+'<button class="btn btn-sm btn-outline" data-action="edit-note" data-id="'+esc(n.id)+'">編輯</button><button class="btn btn-sm btn-outline" data-action="delete-note" data-id="'+esc(n.id)+'">刪除</button></div></article>').join("")||empty("還沒有筆記，按新增筆記開始。");
}
function switchTab(which){
if(!$("#"+which)||!$("#"+which).classList.contains("view"))return;
$$(".view").forEach(x=>x.classList.toggle("active",x.id===which));$$("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===which));
const titles={overview:"戰鬥總覽",teams:"隊伍分析",roster:"寶可夢倉庫",battles:"對戰日誌",notes:"技術筆記",settings:"設定與備份"};
$("#pageTitle").textContent=titles[which];location.hash=which;window.scrollTo({top:0,behavior:"instant"});
}
function field(name,label,value,type="text",opts=null,help="",wide=false){
const attrs='name="'+esc(name)+'" id="f-'+esc(name)+'"';let control="";
if(type==="textarea")control='<textarea '+attrs+' rows="3">'+esc(value??"")+'</textarea>';
else if(type==="select")control='<select '+attrs+'>'+opts.map(o=>{const v=Array.isArray(o)?o[0]:o,lab=Array.isArray(o)?o[1]:o;return '<option value="'+esc(v)+'" '+(String(value??"")===String(v)?"selected":"")+'>'+esc(lab)+'</option>';}).join("")+'</select>';
else if(type==="checkbox")control='<input '+attrs+' type="checkbox" style="width:19px;height:19px;min-height:19px" '+(value?"checked":"")+'>';
else control='<input '+attrs+' type="'+type+'" value="'+esc(value??"")+'" '+(type==="number"?'step="any" min="0"':"")+'>';
return '<div class="field '+(wide?"wide":"")+'"><label for="f-'+esc(name)+'">'+esc(label)+'</label>'+control+(help?'<small class="form-help">'+esc(help)+'</small>':"")+'</div>';
}
function section(title){return '<div class="form-section field wide">'+esc(title)+'</div>';}
function showDialog(title,html,kind,id=null){
editing={kind,id};$("#dialogTitle").textContent=title;$("#dialogFields").innerHTML='<div class="form-grid">'+html+'</div>';// Values are prefilled in the generated controls; do not reset them.
$("#editor").showModal();
}
function showForm(kind,id=null){
if(kind==="rank"){
const r=data.rank;
showDialog("Rank 與每日進度",section("本季追蹤")+field("season","賽季名稱",r.season)+field("current","目前 Rank",r.current,"number")+field("target","目標 Rank",r.target,"number")+field("currentWins","目前 Rank 已勝場數",r.currentWins,"number")+field("neededWins","目前 Rank 升下一級所需勝場",r.neededWins,"number",null,"每升一級請更新門檻")+section("今日追蹤")+field("dailyLimit","每日對戰上限",r.dailyLimit,"number")+field("extraToday","今日其他未逐場記錄的場次",r.extraToday,"number")+field("notes","備註",r.notes,"textarea",null,"實際升 Rank 條件以遊戲畫面為準",true),kind);return;
}
if(kind==="resources"){
const labels={rareCandy:"神奇糖果",stardust:"星星沙子",eliteFast:"厲害一般招式學習器",eliteCharged:"厲害特殊招式學習器",regularFast:"一般招式學習器",regularCharged:"特殊招式學習器",otherCandy:"其他糖果（自訂）"};
showDialog("更新資源",Object.entries(labels).map(([k,label])=>field(k,label,data.resources[k],"number")).join(""),kind);return;
}
if(kind==="mon"){
const p=data.pokemon.find(x=>x.id===id)||{id:null,name:"",league:"master",types:[],cp:null,level:null,ivs:[null,null,null],candy:null,xlcandy:null,stardustCost:null,candyCost:null,quickMove:"",quickType:"",chargeMove1:"",charge1Type:"",chargeMove2:"",charge2Type:"",secondUnlocked:false,needsElite:false,fusion:"",status:"待培養",priority:3,notes:""};
const typeOpts=[["","未選擇"],...TYPES.map(t=>[t,t])],type1=p.types[0]||"",type2=p.types[1]||"";
let h=section("基本資料")+field("name","名稱",p.name)+field("league","適用聯盟",p.league,"select",[["master","大師聯盟"],["ultra","高級聯盟"]])+field("type1","屬性一",type1,"select",typeOpts)+field("type2","屬性二（可留空）",type2,"select",typeOpts)+field("cp","目前 CP",p.cp,"number")+field("level","目前等級",p.level,"number")+section("個體值與資源")+field("ivAtk","攻擊 IV (0–15)",p.ivs[0],"number")+field("ivDef","防禦 IV (0–15)",p.ivs[1],"number")+field("ivSta","體力 IV (0–15)",p.ivs[2],"number")+field("candy","目前該寶可夢糖果",p.candy,"number")+field("xlcandy","目前 XL 糖果",p.xlcandy,"number")+field("candyCost","預計培養所需糖果",p.candyCost,"number")+field("stardustCost","預計培養所需星星沙子",p.stardustCost,"number")+section("招式與形態")+field("quickMove","一般招式",p.quickMove)+field("quickType","一般招式屬性",p.quickType,"select",typeOpts)+field("chargeMove1","特殊招式一",p.chargeMove1)+field("charge1Type","特殊一屬性",p.charge1Type,"select",typeOpts)+field("chargeMove2","特殊招式二",p.chargeMove2)+field("charge2Type","特殊二屬性",p.charge2Type,"select",typeOpts)+field("secondUnlocked","已開啟第二招式",p.secondUnlocked,"checkbox")+field("needsElite","仍需厲害招式學習器",p.needsElite,"checkbox")+field("fusion","合體／形態狀態",p.fusion)+section("養成決策")+field("status","養成狀態",p.status,"select",["已完成","待培養","待測試","需替換"])+field("priority","優先級（1 最高）",p.priority,"number")+field("notes","養成備註",p.notes,"textarea",null,"費用請以遊戲實際數值為準",true);
showDialog(p.id?"編輯寶可夢":"新增寶可夢",h,kind,id);return;
}
if(kind==="team"){
const t=data.teams.find(x=>x.id===id)||{id:null,name:"",league:activeLeague,members:[],status:"待測試",notes:""};
const choices=[["","未選擇"],...data.pokemon.map(p=>[p.id,p.name+"（"+league(p.league)+"）"])];
let h=field("name","隊伍名稱",t.name,null,null,"",true)+field("league","聯盟",t.league,"select",[["master","大師聯盟"],["ultra","高級聯盟"]])+field("status","隊伍狀態",t.status,"select",["已完成","待培養","待測試","需替換"])+section("出戰順序")+field("mon1","首發",t.members[0],"select",choices)+field("mon2","第二隻",t.members[1],"select",choices)+field("mon3","第三隻",t.members[2],"select",choices)+field("notes","戰術備註",t.notes,"textarea",null,"最多三隻，成員不可重複",true);
showDialog(t.id?"編輯隊伍":"新增隊伍",h,kind,id);return;
}
if(kind==="battle"){
const b=data.battles.find(x=>x.id===id)||{id:null,date:today(),league:activeLeague,teamId:"",opponent:"",opponentTeam:"",outcome:"勝",issue:"",improvement:"",notes:""};
const teamOpts=[["","未指定"],...data.teams.map(x=>[x.id,x.name])];
let h=field("date","對戰日期",b.date,"date")+field("league","聯盟",b.league,"select",[["master","大師聯盟"],["ultra","高級聯盟"]])+field("teamId","使用隊伍",b.teamId,"select",teamOpts)+field("outcome","結果",b.outcome,"select",["勝","負","平"])+field("opponent","對手／主要威脅",b.opponent)+field("opponentTeam","對手三隻寶可夢",b.opponentTeam)+field("issue","遇到的問題",b.issue,"textarea",null,"例如：擋盾失誤、首發不利",true)+field("improvement","下一場改進方式",b.improvement,"textarea",null,"記錄一項可執行的行動",true)+field("notes","其他戰術筆記",b.notes,"textarea",null,"",true);
showDialog(b.id?"編輯對戰":"記錄一場對戰",h,kind,id);return;
}
if(kind==="note"){
const n=data.notes.find(x=>x.id===id)||{id:null,title:"",category:"操作",content:"",status:"待測試"};
let h=field("title","筆記標題",n.title,null,null,"",true)+field("category","分類",n.category,"select",["操作","隊伍","養成","對戰觀察","其他"])+field("status","狀態",n.status,"select",["已完成","待培養","待測試","需替換"])+field("content","筆記內容",n.content,"textarea",null,"",true);
showDialog(n.id?"編輯筆記":"新增技術筆記",h,kind,id);
}
}
function getForm(){const f=new FormData($("#editorForm"));const obj=Object.fromEntries(f.entries());for(const [k,v] of Object.entries(obj))if(typeof v==="string")obj[k]=v.trim();return obj;}
function requireName(v,label){if(!v||!String(v).trim()){notify("請填寫"+label);return false;}return true;}
function saveDialog(ev){
ev.preventDefault();const x=getForm();const {kind,id}=editing||{};let newItem;
if(kind==="rank"){
data.rank={season:x.season,current:num(x.current),target:num(x.target)||19,currentWins:num(x.currentWins)||0,neededWins:num(x.neededWins),dailyLimit:num(x.dailyLimit)||25,extraToday:num(x.extraToday)||0,notes:x.notes};
}else if(kind==="resources"){
Object.keys(data.resources).forEach(k=>data.resources[k]=num(x[k]));
}else if(kind==="mon"){
if(!requireName(x.name,"寶可夢名稱"))return;
const ivs=[num(x.ivAtk),num(x.ivDef),num(x.ivSta)];
if(ivs.some(v=>v!==null&&(v>15||v<0))){notify("IV 必須介乎 0 至 15");return;}
newItem={id:id||newid(),name:x.name,league:x.league,types:[x.type1,x.type2].filter((s,i,a)=>s&&a.indexOf(s)===i),cp:num(x.cp),level:num(x.level),ivs,candy:num(x.candy),xlcandy:num(x.xlcandy),stardustCost:num(x.stardustCost),candyCost:num(x.candyCost),quickMove:x.quickMove,quickType:x.quickType,chargeMove1:x.chargeMove1,charge1Type:x.charge1Type,chargeMove2:x.chargeMove2,charge2Type:x.charge2Type,secondUnlocked:!!x.secondUnlocked,needsElite:!!x.needsElite,fusion:x.fusion,status:x.status,priority:num(x.priority)||3,notes:x.notes};
if(id)data.pokemon=data.pokemon.map(p=>p.id===id?newItem:p);else data.pokemon.push(newItem);
}else if(kind==="team"){
if(!requireName(x.name,"隊伍名稱"))return;
const members=[x.mon1,x.mon2,x.mon3].filter(Boolean);
if(new Set(members).size!==members.length){notify("同一隊伍不可重複使用同一隻寶可夢");return;}
if(members.some(mid=>pkm(mid)?.league!==x.league)){notify("隊伍成員的聯盟欄位必須與隊伍相符");return;}
newItem={id:id||newid(),name:x.name,league:x.league,members,status:x.status,notes:x.notes};
if(id)data.teams=data.teams.map(t=>t.id===id?newItem:t);else data.teams.push(newItem);
activeLeague=x.league;activeTeam=newItem.id;
}else if(kind==="battle"){
if(!safeDate(x.date)){notify("請填寫正確的對戰日期");return;}
newItem={id:id||newid(),date:x.date,league:x.league,teamId:x.teamId,opponent:x.opponent,opponentTeam:x.opponentTeam,outcome:x.outcome,issue:x.issue,improvement:x.improvement,notes:x.notes};
if(id)data.battles=data.battles.map(b=>b.id===id?newItem:b);else data.battles.push(newItem);
}else if(kind==="note"){
if(!requireName(x.title,"筆記標題"))return;
newItem={id:id||newid(),title:x.title,category:x.category,content:x.content,status:x.status};
if(id)data.notes=data.notes.map(n=>n.id===id?newItem:n);else data.notes.push(newItem);
}
persist();$("#editor").close();render();notify("資料已儲存");
}
function remove(kind,id){
const types={mon:["pokemon","寶可夢"],battle:["battles","對戰紀錄"],note:["notes","技術筆記"],team:["teams","隊伍"]},def=types[kind];if(!def||!confirm("確定刪除這筆"+def[1]+"？"))return;
data[def[0]]=data[def[0]].filter(x=>x.id!==id);
if(kind==="mon")data.teams.forEach(t=>t.members=t.members.filter(x=>x!==id));
persist();render();notify("已刪除");
}
function exportData(){
const file=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(file),a=document.createElement("a");a.href=url;a.download="go-battle-lab-"+today()+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify("備份已下載");
}
async function importData(file){
if(!file)return;try{if(file.size>3000000)throw Error("檔案過大");const obj=JSON.parse(await file.text());if(!valid(obj))throw Error("無法識別格式");if(!confirm("匯入資料將覆蓋本機目前所有紀錄，繼續嗎？"))return;data=obj;persist();render();notify("匯入完成");}catch(e){notify("匯入失敗："+e.message);}$("#importFile").value="";
}
document.addEventListener("click",ev=>{
const tab=ev.target.closest("[data-tab],[data-link-tab]");
if(tab){switchTab(tab.dataset.tab||tab.dataset.linkTab);return;}
const l=ev.target.closest("[data-league]");
if(l){activeLeague=l.dataset.league;activeTeam=null;renderTeams();return;}
const b=ev.target.closest("[data-action]");
if(!b)return;const a=b.dataset.action,id=b.dataset.id;
if(a==="new-mon")showForm("mon");else if(a==="edit-mon")showForm("mon",id);
else if(a==="new-team")showForm("team");else if(a==="edit-team")showForm("team",id);
else if(a==="analyze-team"){activeTeam=id;renderTeams();$("#typeAnalysis").scrollIntoView({behavior:"smooth"});}
else if(a==="add-battle")showForm("battle");else if(a==="edit-battle")showForm("battle",id);
else if(a==="new-note")showForm("note");else if(a==="edit-note")showForm("note",id);
else if(a==="edit-rank")showForm("rank");else if(a==="edit-resources")showForm("resources");
else if(a==="delete-mon")remove("mon",id);else if(a==="delete-team")remove("team",id);
else if(a==="delete-battle")remove("battle",id);else if(a==="delete-note")remove("note",id);
else if(a==="export")exportData();else if(a==="import")$("#importFile").click();
else if(a==="reset"){if(confirm("確定重設全部數據？先前修改將無法復原。")){data=deepClone(INITIAL);persist();render();notify("已重設初始資料");}}
});
$("#dialogClose").addEventListener("click",()=>$("#editor").close());
$("#dialogCancel").addEventListener("click",()=>$("#editor").close());
$("#editorForm").addEventListener("submit",saveDialog);
$("#importFile").addEventListener("change",ev=>importData(ev.target.files?.[0]));
$("#rosterSearch").addEventListener("input",renderRoster);
$("#rosterLeague").addEventListener("change",renderRoster);
$("#rosterStatus").addEventListener("change",renderRoster);
$("#battleLeague").addEventListener("change",renderBattles);
window.addEventListener("hashchange",()=>{const hash=location.hash.slice(1);if(hash&&$("#"+hash)?.classList.contains("view"))switchTab(hash);});
render();
if(location.hash&&$("#"+location.hash.slice(1))?.classList.contains("view"))switchTab(location.hash.slice(1));
