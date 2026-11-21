// ==UserScript==
// @name         Pocket Memo 💜
// @namespace    pocket-memo-independent
// @version      1.1.12
// @updateURL    https://raw.githubusercontent.com/qwerty1816/pocket-memo/main/pocket-memo.user.js
// @downloadURL  https://raw.githubusercontent.com/qwerty1816/pocket-memo/main/pocket-memo.user.js
// @icon         https://raw.githubusercontent.com/qwerty1816/pocket-memo/main/pocket-memo-icon.png
// @description  라벤더 레이스 메모장 · 편지지 위젯 · 리본 접기 · 방별 저장 · 스토리 달력
// @match        https://crack.wrtn.ai/*
// @run-at       document-idle
// @grant        none
// @noframes
// ==/UserScript==
(() => {
'use strict';
if (window.__pocketMemoV1) return;
window.__pocketMemoV1 = true;
const PREFIX='pocket-memo:v1:';
const $=(s,base=document)=>base.querySelector(s);
const uid=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const room=()=>{const p=location.pathname;return (p.match(/^\/stories\/[^/]+\/episodes\/([^/?#]+)/)||p.match(/^\/characters\/[^/]+\/chats\/([^/?#]+)/)||p.match(/^\/u\/[^/]+\/c\/([^/?#]+)/)||[])[1]||''};
const initial=()=>({version:1,folders:[],notes:[]});
let calendarTab='memo';
let current=room(),data=initial(),selected='',filter='',folderFilter='',panelOpen=false,editorTab='content',foldMoveId='',viewMode='read',saveFailed=false;
const key=id=>PREFIX+'room:'+id;
function read(id){if(!id)return initial();try{const x=JSON.parse(localStorage.getItem(key(id))||'null');if(x&&Array.isArray(x.notes)&&Array.isArray(x.folders)){if(x.version>1){alert('이 메모는 더 최신 버전에서 저장되었습니다. 덮어쓰지 않도록 주의하세요.');}return x;}}catch(e){console.warn('[Pocket Memo] read',e)}return initial()}
function persist(){if(!current)return false;try{localStorage.setItem(key(current),JSON.stringify(data));saveFailed=false;return true}catch(e){saveFailed=true;console.error('[Pocket Memo] save failed',e);showSaveWarning();return false}}
function showSaveWarning(){let w=$('#pm-save-warning',root);if(!w){w=document.createElement('div');w.id='pm-save-warning';w.style.cssText='position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483646;background:#fff1f2;color:#9f1239;border:2px solid #fb7185;padding:12px;border-radius:12px;max-width:90vw;font-size:14px;box-shadow:0 5px 20px #0004';root.appendChild(w)}w.textContent='⚠️ 메모 저장 실패! 이 페이지를 닫거나 새로고침하지 마세요. 포켓 메모의 백업 버튼으로 먼저 데이터를 내보내 주세요.';w.hidden=false}
const noteById=id=>data.notes.find(n=>n.id===id);
const deviceClass=()=>innerWidth<=650?'mobile':'desktop';const posKey=id=>PREFIX+'positions:'+deviceClass()+':'+id;function getDevicePos(n){try{return JSON.parse(localStorage.getItem(posKey(current))||'{}')[n.id]||null}catch{return null}}function saveDevicePos(n){try{const k=posKey(current),p=JSON.parse(localStorage.getItem(k)||'{}');p[n.id]={x:n.x,y:n.y,width:n.width,height:n.height};localStorage.setItem(k,JSON.stringify(p))}catch(e){console.warn('[Pocket Memo] position save',e)}}
// Pattern backgrounds are generated locally with CSS. No remote images or assets.
const PAPER_PATTERNS=[['plain','기본 단색'],['lines','클래식 줄노트'],['grid','파스텔 모눈'],['lace','레이스 편지지'],['vintage','빈티지 양피지'],['floral','잔꽃 패턴'],['frame','클래식 프레임'],['gingham','깅엄 체크'],['moon','달빛 별자리'],['watercolor','수채화 번짐']];
function paperBackground(st){
 const bg=/^#[0-9a-f]{6}$/i.test(st?.bg||'')?st.bg:'#fff8fe';
 const k=Math.max(0,Math.min(100,Number(st?.patternStrength??35)))/100;
 const a=(v)=>Math.min(.9,v*k).toFixed(3);
 const violet=(v)=>`rgba(157,112,194,${a(v)})`;
 const pink=(v)=>`rgba(236,142,186,${a(v)})`;
 const blue=(v)=>`rgba(133,164,223,${a(v)})`;
 const green=(v)=>`rgba(130,178,151,${a(v)})`;
 let layers='';
 switch(st?.patternEnabled===false?'plain':(st?.pattern||'plain')){
  case 'lines': layers=`repeating-linear-gradient(0deg,transparent 0px,transparent 27px,${violet(.55)} 28px,transparent 29px)`;break;
  case 'grid': layers=`linear-gradient(${violet(.42)} 1px,transparent 1px),linear-gradient(90deg,${violet(.42)} 1px,transparent 1px)`;break;
  case 'lace': layers=`radial-gradient(circle at 9px 9px,transparent 5px,${violet(.42)} 5.8px,transparent 7px),radial-gradient(circle at 20px 20px,${pink(.28)} 2px,transparent 3px)`;break;
  case 'vintage': layers=`radial-gradient(ellipse at 12% 10%,rgba(191,151,88,${a(.48)}),transparent 65%),radial-gradient(ellipse at 88% 90%,rgba(175,126,73,${a(.45)}),transparent 70%),linear-gradient(125deg,rgba(232,198,143,${a(.38)}),transparent)`;break;
  case 'floral': layers=`radial-gradient(circle at 12px 12px,${pink(.8)} 2px,transparent 3px),radial-gradient(circle at 16px 12px,${pink(.65)} 2px,transparent 3px),radial-gradient(circle at 14px 16px,${pink(.65)} 2px,transparent 3px),radial-gradient(ellipse at 22px 23px,${green(.7)} 3px,transparent 4px)`;break;
  case 'frame': layers=`linear-gradient(90deg,${violet(.65)},${violet(.65)}) left 11px top 12px / calc(100% - 22px) 1px no-repeat,linear-gradient(90deg,${violet(.65)},${violet(.65)}) left 11px bottom 12px / calc(100% - 22px) 1px no-repeat,linear-gradient(${violet(.65)},${violet(.65)}) left 11px top 12px / 1px calc(100% - 24px) no-repeat,linear-gradient(${violet(.65)},${violet(.65)}) right 11px top 12px / 1px calc(100% - 24px) no-repeat`;break;
  case 'gingham': layers=`linear-gradient(90deg,${pink(.33)} 50%,transparent 50%),linear-gradient(${pink(.33)} 50%,transparent 50%)`;break;
  case 'moon': layers=`radial-gradient(circle at 15px 12px,${violet(.8)} 1.5px,transparent 2px),radial-gradient(circle at 35px 35px,${blue(.7)} 1px,transparent 2px),radial-gradient(circle at 44px 15px,${violet(.5)} 2px,transparent 3px)`;break;
  case 'watercolor': layers=`radial-gradient(ellipse at 12% 17%,${pink(.8)},transparent 55%),radial-gradient(ellipse at 85% 24%,${violet(.8)},transparent 60%),radial-gradient(ellipse at 46% 87%,${blue(.7)},transparent 65%),radial-gradient(ellipse at 75% 77%,${pink(.45)},transparent 55%)`;break;
 }
 const sizes={grid:'22px 22px,22px 22px',lace:'28px 28px,28px 28px',floral:'64px 64px,64px 64px,64px 64px,64px 64px',gingham:'24px 24px,24px 24px',moon:'58px 58px,58px 58px,58px 58px'};
 return {background:layers?layers+','+bg:bg,backgroundSize:st?.patternEnabled===false?'auto':(sizes[st?.pattern]||'auto')};
}
function paperCss(st){const p=paperBackground(st);return `background:${p.background};background-size:${p.backgroundSize};`}
const MARK_COLORS=[['레몬','#FFE878'],['핑크','#FFC0D5'],['라벤더','#D9C5FF'],['민트','#B9EBD5'],['하늘','#B9DEFF'],['피치','#FFD4B2']];
const EMOJI_CATEGORIES={'기본':['💌','🎀','🌷','🐰','🧸','🦋','🌙','🪻'],'러블리':['🩰','🪞','🪮','💗','💕','💞','💓','💝','💋','🪽','🫧'],'꽃·자연':['🌸','🌹','🥀','💐','🌼','🌺','🪷','🍀','🌿','🪴','🍃'],'몽환':['🌛','🌜','🌚','🌝','⭐','🌟','✨','💫','🌌','🪐','☁️','🌈','❄️'],'빈티지':['🕯️','🗝️','🔐','🪶','🕰️','⏳','🪄','🔮','🏺','🪙','🧿','🪡','🧵'],'기록':['📖','📚','📜','📝','📔','📓','📒','📕','📌','📎','🖇️','✒️','🖋️','🗒️'],'일상':['☕','🍵','🫖','🍰','🧁','🍮','🍪','🍓','🍒','🍑','🍯','🥐','🥛','🍬'],'동물':['🐈','🐈‍⬛','🐇','🦢','🦌','🐻','🐼','🦊','🐿️','🐾','🕊️','🦭','🐚','🪼'],'장식':['💎','💍','👑','🪩','🩷','🤍','💜','🩵','🖤','🩶','💛','🧡','❤️']};
let emojiCategory='기본',emojiSearch='';
const validHex=c=>/^#[0-9a-fA-F]{6}$/.test(String(c||''));
const markColor=n=>validHex(n.style?.markColor)?n.style.markColor:'#FFE878';
const FORMAT_DEFAULTS={'==':{highlight:true,bold:false,underline:false,color:'#FFE878'},'**':{highlight:false,bold:true,underline:false,color:'#D9C5FF'}};
function noteFormats(n){const src=n.formats||{};return Object.fromEntries(['==','**'].map(k=>[k,{...FORMAT_DEFAULTS[k],...(src[k]||{})}]));}
function formatSpan(text,fmt){const color=validHex(fmt.color)?fmt.color:'#FFE878';let css='';if(fmt.bold)css+='font-weight:700;';if(fmt.underline)css+='text-decoration:underline;text-underline-offset:2px;';if(fmt.highlight)css+=`background:${color};box-decoration-break:clone;-webkit-box-decoration-break:clone;`;return css?`<span class="pm-formatted" style="${css}">${esc(text)}</span>`:esc(text)}
function highlightedHtml(n){
 const raw=String(n.text||'');const formats=noteFormats(n);const rules=Array.isArray(n.highlights)?n.highlights:[];
 const plain=(text)=>{const candidates=[];for(const r of rules){if(!r||!r.phrase)continue;const term=String(r.phrase).slice(0,300);if(!term)continue;let at=0,count=0;while((at=text.indexOf(term,at))!==-1&&count++<500){candidates.push({start:at,end:at+term.length,fmt:r.format||{highlight:true,bold:false,underline:false,color:r.color||'#FFE878'}});at+=term.length}}candidates.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));let out='',last=0;for(const c of candidates){if(c.start<last)continue;out+=esc(text.slice(last,c.start))+formatSpan(text.slice(c.start,c.end),c.fmt);last=c.end}return out+esc(text.slice(last))};
 let out='',cursor=0;const re=/(==|\*\*)([^\n]+?)\1/g;let m;while((m=re.exec(raw))){out+=plain(raw.slice(cursor,m.index))+formatSpan(m[2],formats[m[1]]);cursor=re.lastIndex}return out+plain(raw.slice(cursor));
}
function rememberEmoji(emoji){try{const k=PREFIX+'recent-emoji',a=JSON.parse(localStorage.getItem(k)||'[]');localStorage.setItem(k,JSON.stringify([emoji,...a.filter(x=>x!==emoji)].slice(0,16)))}catch{}}
function recentEmojis(){try{return JSON.parse(localStorage.getItem(PREFIX+'recent-emoji')||'[]')}catch{return []}}
function emojiPicker(n){const cats={...EMOJI_CATEGORIES};const recent=recentEmojis();if(recent.length)cats['최근 사용']=recent;const all=[...new Set(Object.values(cats).flat())];const chosen=emojiSearch.trim()?all.filter(x=>x.includes(emojiSearch.trim())):(cats[emojiCategory]||cats['기본']);return `<label class="pm-label">메모 이모지</label><input id="pm-emoji-search" class="pm-input" placeholder="🔎 이모지 검색 (예: 🌷)" value="${esc(emojiSearch)}"><div class="pm-emoji-tabs">${Object.keys(cats).map(cat=>`<button type="button" data-emoji-category="${esc(cat)}" class="${cat===emojiCategory?'active':''}">${esc(cat)}</button>`).join('')}</div><div class="pm-emoji-grid">${chosen.map(e=>`<button type="button" data-emoji="${esc(e)}" class="${n.emoji===e?'pm-primary':''}" title="${esc(e)}">${esc(e)}</button>`).join('')||'<span class="pm-muted">일치하는 이모지가 없어요.</span>'}</div>`}
function markerEditor(n){const fmts=noteFormats(n);return `<div class="pm-marker"><label class="pm-label">🖍️ 텍스트 강조 · 메모별 설정</label><div class="pm-muted">==문구== 또는 **문구**를 입력하세요. 두 기호 모두 아래에서 원하는 서식을 복수 선택할 수 있어요.</div>${['==','**'].map(k=>{const f=fmts[k],key=k==='=='?'eq':'star';return `<div class="pm-format-group"><b>${esc(k)} 기호</b><div class="pm-row">${[['highlight','🖍️ 형광펜'],['bold','굵게'],['underline','밑줄']].map(([field,label])=>`<label class="pm-format-check"><input type="checkbox" data-format-toggle="${field}" data-format-key="${key}" ${f[field]?'checked':''}> ${label}</label>`).join('')}</div><div class="pm-muted">형광펜 색상</div><div class="pm-palette">${MARK_COLORS.map(([name,hex])=>`<button type="button" data-format-color="${hex}" data-format-key="${key}" title="${name}" style="background:${hex};${f.color.toLowerCase()===hex.toLowerCase()?'outline:2px solid #8255ad;outline-offset:2px;':''}"></button>`).join('')}</div><div class="pm-row"><input type="color" data-format-custom="${key}" value="${validHex(f.color)?f.color:'#FFE878'}" aria-label="${esc(k)} 직접 색상 지정"><span class="pm-muted">${esc(f.color)}</span></div><div class="pm-muted">미리보기: ${formatSpan('머리카락 넘기기',f)}</div></div>`}).join('')}<label class="pm-label">🔎 문구 입력으로 강조</label><div class="pm-row"><input id="pm-mark-phrase" class="pm-input" placeholder="예: 머리카락 넘기기" style="flex:1;min-width:130px" ${n.contentLocked?'disabled':''}><select id="pm-phrase-format" class="pm-input" style="width:auto"><option value="==">== 설정 사용</option><option value="**">** 설정 사용</option></select><button type="button" data-action="add-highlight" ${n.contentLocked?'disabled':''}>＋ 강조</button></div><div class="pm-muted">같은 문구는 모두 적용돼요. 한 곳만 지정하려면 본문에 기호를 사용하세요.</div>${(n.highlights||[]).map((h,i)=>`<div class="pm-row pm-highlight-rule"><span>${formatSpan(h.phrase,h.format||{highlight:true,color:h.color||'#FFE878'})}</span><button type="button" data-remove-highlight="${i}" ${n.contentLocked?'disabled':''}>삭제</button></div>`).join('')}</div>`}
const newNote=()=>({id:uid(),title:'새 메모',text:'',folder:'',tags:[],pinned:false,shown:false,positionLocked:false,contentLocked:false,x:20,y:Math.round(innerHeight*.22),width:270,height:210,folded:false,emoji:'💌',style:{bg:'#fff8fe',fg:'#34264a',header:'#f1ddf5',opacity:100,fontSize:14,radius:14,pattern:'plain',patternEnabled:false,patternStrength:35,markColor:'#FFE878'},formats:JSON.parse(JSON.stringify(FORMAT_DEFAULTS)),highlights:[],updated:Date.now()});
const root=document.createElement('div');root.id='pocket-memo-root';document.documentElement.appendChild(root);
const style=document.createElement('style');style.textContent=`
#pocket-memo-root{font-family:system-ui,-apple-system,sans-serif;color:#382a49;position:relative;z-index:2147483000}#pocket-memo-root *{box-sizing:border-box}
#pocket-memo-root button,#pocket-memo-root input,#pocket-memo-root textarea,#pocket-memo-root select{font:inherit}#pocket-memo-root button{border:1px solid #d5bfe8;border-radius:9px;padding:7px 9px;background:#f5edfc;color:#59367d;cursor:pointer}#pocket-memo-root button:disabled{opacity:.5;cursor:not-allowed}
#pm-launch{position:fixed;right:14px;bottom:180px;width:40px;height:40px;touch-action:none;user-select:none;-webkit-user-select:none;border-radius:50%!important;background:#8152ba!important;color:white!important;font-size:19px!important;padding:0!important;z-index:2147483003;box-shadow:0 4px 16px #0004}
#pm-panel{position:fixed;right:14px;top:7vh;width:min(380px,calc(100vw - 20px));max-height:70dvh;overflow:auto;background:#fffafd;border:1px solid #d8c3ed;border-radius:18px;padding:14px;box-shadow:0 12px 38px #0004;z-index:2147483004}
#pm-panel[hidden],.pm-widget[hidden]{display:none!important}.pm-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0}.pm-row.space{justify-content:space-between}.pm-muted{font-size:12px;color:#7b7086}.pm-input{width:100%;border:1px solid #d2bee3;border-radius:9px;padding:9px;background:#fff;color:#34264a}.pm-card{padding:10px;border:1px solid #e6d9ef;border-radius:12px;background:white;margin:7px 0}.pm-card.active{border-color:#9362c3;background:#faf3ff}.pm-card-title{font-weight:700;font-size:14px}.pm-small{font-size:12px}.pm-label{font-size:12px;font-weight:650;display:block;margin:9px 0 4px}.pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pm-grid input{min-width:0}.pm-separator{border:0;border-top:1px solid #eadff2;margin:13px 0}
.pm-widget{position:fixed;z-index:2147483002;border:1px solid #c9a6e7;box-shadow:0 6px 25px #0003;padding:9px;display:flex;flex-direction:column;overflow:hidden;min-width:170px;min-height:120px;max-width:100vw;max-height:100dvh}.pm-widget-head{display:flex;align-items:center;justify-content:space-between;gap:4px;touch-action:none;cursor:move;user-select:none}.pm-drag-handle{touch-action:none!important;user-select:none;-webkit-user-select:none;cursor:grab!important;min-width:49px}.pm-widget-head strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:13px}.pm-widget-actions{display:flex;flex-shrink:0;gap:3px}.pm-widget-actions button{font-size:12px;padding:4px 6px!important;background:#ffffffb8!important;color:#34264a!important}.pm-widget textarea{flex:1;width:100%;min-height:45px;border:0;background:transparent;outline:none;resize:none;margin-top:7px;line-height:1.5}.pm-resize{position:absolute;bottom:0;right:0;width:23px;height:23px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 60%,#9c75bf 61%,#9c75bf 67%,transparent 68%)}
@media(max-width:650px){#pm-panel{top:auto;bottom:8px;left:3%;right:3%;width:94%;max-height:calc(100dvh - 24px);border-radius:18px}#pm-launch{right:14px;bottom:180px}}

/* 1.0.2 Lavender Lace redesign */
#pm-panel{background:#f9f4ff;border:1px solid #dbc7ec;box-shadow:0 14px 46px #35204745;padding:16px;color:#634b7d;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
#pm-panel .pm-titlebar{background:#fffaff;border:1px solid #e7d8f0;border-radius:15px;padding:12px;margin-bottom:10px}
#pm-panel .pm-brand{font-size:17px;color:#694b87;letter-spacing:.1px}
#pm-panel .pm-lace{text-align:center;color:#b48bc8;font-size:14px;margin:7px 0}
#pm-panel button{border:1px solid #e2d3ee;background:#fffafd;color:#755995;border-radius:12px;min-height:35px}
#pm-panel button:hover{background:#f0e5fa}
#pm-panel .pm-primary{background:#a58acb;color:#fff;border-color:#a58acb}
#pm-panel .pm-input{border-color:#e3d7ee;background:#fff;border-radius:12px}
#pm-panel .pm-card{background:#fffdfd;border:1px solid #ecdef4;border-radius:14px;padding:12px;margin:8px 0}
#pm-panel .pm-card.active{background:#f5eafb;border-color:#bca0d9}
#pm-panel .pm-card-title{color:#644b80}
#pm-panel .pm-editor{background:#fffdfd;border:1px solid #e6d5f0;border-radius:15px;padding:12px;margin-top:10px}
#pm-panel .pm-tabs{display:flex;gap:5px;margin:10px 0}
#pm-panel .pm-tabs button{flex:1;padding:7px 3px;font-size:12px;white-space:nowrap}
#pm-panel .pm-tabs button.active{background:#a58acb;color:#fff;border-color:#a58acb}
#pm-panel .pm-switch{display:flex;justify-content:space-between;align-items:center;padding:10px 3px;border-bottom:1px solid #f0e6f5;gap:10px}
#pm-panel .pm-switch input{width:19px;height:19px;accent-color:#a58acb}
#pm-panel .pm-palette{display:flex;gap:7px;flex-wrap:wrap;margin:7px 0}
#pm-panel .pm-palette button{width:27px;height:27px;min-height:27px;padding:0;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #d9c7e8}
#pm-panel .pm-preview{padding:14px;border:1px solid #e5d2ef;margin:9px 0;white-space:pre-wrap;overflow-wrap:anywhere}
.pm-widget{padding:0!important;border:1px solid #dcc4e7!important;box-shadow:0 6px 25px #0003;min-width:170px;min-height:120px}
.pm-widget:not(.pm-folded) .pm-widget-head{background:var(--pm-header,#f1ddf5);padding:7px 8px;border-bottom:1px solid #e5d5ee;min-height:39px;cursor:default}
.pm-widget .pm-widget-head strong{font-weight:650;font-size:13px}
.pm-widget .pm-widget-actions button{border-radius:7px!important;min-width:25px;min-height:27px;padding:3px 4px!important}
.pm-widget .pm-widget-actions{gap:3px}
.pm-widget .pm-drag-handle{min-width:30px!important}
.pm-widget .pm-paperline{padding:1px 9px;text-align:center;font-size:10px;opacity:.65;pointer-events:none}
.pm-widget textarea{margin:0!important;padding:8px 11px 20px;min-height:0!important;line-height:1.55}
.pm-widget.pm-folded{min-width:0!important;min-height:0!important;width:40px!important;height:40px!important;border-radius:50%!important;overflow:visible!important;box-shadow:0 3px 14px #0004;background:var(--pm-header,#d7b9ed)!important;opacity:1!important}
.pm-fold-button{display:flex;align-items:center;justify-content:center;width:100%;height:100%;border:0!important;border-radius:50%!important;background:transparent!important;font-size:21px!important;padding:0!important;cursor:grab;touch-action:none}
.pm-fold-handle{position:absolute;left:43px;right:auto;top:4px;width:32px;height:32px;border-radius:50%!important;background:#fff7ff!important;color:#795c9a!important;box-shadow:0 2px 8px #0003;touch-action:none!important;cursor:grab!important;padding:0!important}
.pm-folded .pm-fold-handle[hidden]{display:none!important}
@media(max-width:650px){#pm-panel{max-height:calc(100dvh - 24px);padding:12px}#pm-panel .pm-row{gap:5px}#pm-panel button{font-size:12px}#pm-panel .pm-tabs button{font-size:11px}}
.pm-read-body{height:auto;max-height:none;overflow:visible;white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.7;padding:12px;background:#fff;border:1px solid #e8d8f1;border-radius:12px;user-select:text;-webkit-user-select:text}.pm-read-body:empty:before{content:'내용이 없어요';color:#887b92}.pm-read-head{display:flex;justify-content:space-between;gap:8px;align-items:center;flex-wrap:wrap}.pm-editor textarea{max-height:none}#pm-panel{overscroll-behavior:contain}@media(max-width:650px){#pm-panel{max-height:calc(100dvh - 24px)!important}}

#pm-panel .pm-paper-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0 12px}
#pm-panel .pm-paper-choice{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;padding:7px 5px;border:1px solid #e2d3ee;border-radius:12px;font-size:11px;line-height:1.3}
#pm-panel .pm-paper-choice.active{border:2px solid #a58acb;background:#f2e8fa}
#pm-panel .pm-paper-swatch{width:100%;height:52px;border-radius:7px;border:1px solid #e9daed;display:block}
`;style.textContent+=`
#pm-panel .pm-format-group{border:1px solid #eadcf3;border-radius:10px;padding:10px;margin:10px 0;background:#fff}#pm-panel .pm-format-check{font-size:12px;display:inline-flex;gap:4px;align-items:center}#pm-panel .pm-marker{margin:12px 0;padding:12px;border:1px solid #e7d5f1;border-radius:13px;background:#fffafd}
#pm-panel .pm-emoji-tabs{display:flex;gap:5px;overflow-x:auto;margin:8px 0;padding-bottom:5px;-webkit-overflow-scrolling:touch}
#pm-panel .pm-emoji-tabs button{flex:none;font-size:12px;white-space:nowrap}
#pm-panel .pm-emoji-tabs button.active{background:#d7b8ee;color:#45215e}
#pm-panel .pm-emoji-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:5px;margin:7px 0}
#pm-panel .pm-emoji-grid button{min-height:37px;font-size:20px;padding:5px}
#pm-panel .pm-highlight-rule{justify-content:space-between;gap:10px}
#pm-panel .pm-highlight-rule mark{padding:2px 5px;border-radius:3px;overflow-wrap:anywhere}
#pocket-memo-root .pm-highlight{color:inherit;padding:0 1px;border-radius:2px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
#pocket-memo-root .pm-widget-read{flex:1;min-height:0;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:7px;line-height:1.5;user-select:text;-webkit-user-select:text}
#pocket-memo-root .pm-widget-read[hidden],#pocket-memo-root .pm-widget textarea[hidden]{display:none!important}
`;
style.textContent+=`#pocket-memo-root .pm-widget-edit-actions{display:flex;justify-content:flex-end;gap:6px;padding:5px 8px 8px}#pocket-memo-root .pm-widget-edit-actions[hidden]{display:none!important}#pocket-memo-root .pm-widget textarea:not([hidden]){display:block!important;flex:1;min-height:0!important;overflow:auto!important;user-select:text!important;-webkit-user-select:text!important;touch-action:auto!important}#pocket-memo-root .pm-widget textarea[hidden]{display:none!important}`;
document.head.appendChild(style);
root.innerHTML='<button id="pm-launch" title="Pocket Memo">📝</button><section id="pm-panel" hidden></section><div id="pm-widgets"></div>';
const panel=$('#pm-panel',root),widgets=$('#pm-widgets',root);
function update(n,fields){Object.assign(n,fields,{updated:Date.now()});persist()}
function changeRoom(){const next=room();if(next===current){syncLauncherVisibility();return;}current=next;calLoad();checkLoad();pcRenderWidget();checkRenderSeparateWidget();calendarTab='memo';data=read(current);selected='';filter='';folderFilter='';viewMode='read';foldMoveId='';panelOpen=false;render();syncLauncherVisibility();}
function render(){renderPanel();renderWidgets();checkRenderSeparateWidget();syncLauncherVisibility()}
function renderPanel(){panel.hidden=!panelOpen||!current;if(!panelOpen)return;
if(!current){panel.innerHTML='<div class="pm-row space"><b>📒 Pocket Memo</b><button data-action="close">닫기</button></div><p>RP 채팅방에서 메모를 사용할 수 있어요.</p>';bindPanel();return}
if(calendarTab==='calendar'){renderCalendar();return;}
 if(calendarTab==='checklist'){renderChecklist();return;}
const visible=data.notes.filter(n=>(!folderFilter||n.folder===folderFilter)&&(n.title+' '+n.text+' '+n.tags.join(' ')).toLocaleLowerCase().includes(filter.toLocaleLowerCase())).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updated-a.updated);
const n=noteById(selected);
panel.innerHTML=`<div class="pm-titlebar"><div class="pm-row space"><b class="pm-brand">🎀 포켓 메모</b><button data-action="close">닫기 ×</button></div><div class="pm-muted">나만의 작은 기록장 ♡ · 메모 ${data.notes.length}개 · 자동 저장</div><div class="pm-lace">✿ ୨୧ ✿ ୨୧ ✿</div></div>
<div class="pc-switch"><button type="button" data-pc-tab="memo" class="active">💌 메모</button><button type="button" data-pc-tab="calendar">📅 달력</button><button type="button" data-pc-tab="checklist">☑️ 체크</button></div>
<div class="pm-row"><button data-action="new">＋ 새 메모 🌷</button><button data-action="folder">📁 폴더 추가</button><button data-action="export">⬇ 백업</button><button data-action="import">⬆ 복원</button></div>
<div class="pm-grid"><input class="pm-input" id="pm-search" placeholder="🔎 메모·태그 검색" value="${esc(filter)}"><select class="pm-input" id="pm-folder-filter"><option value="">전체 폴더</option><option value="__none__" ${folderFilter==='__none__'?'selected':''}>미분류</option>${data.folders.map(f=>`<option value="${esc(f.id)}" ${folderFilter===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>
<div class="pm-row">${data.folders.map(f=>`<button data-action="rename-folder" data-id="${esc(f.id)}" title="폴더 이름 수정">📁 ${esc(f.name)}</button>`).join('')}</div>
<div id="pm-list">${visible.filter(x=>folderFilter!=='__none__'||!x.folder).map(x=>{const opened=selected===x.id&&viewMode==='read';return `<div class="pm-card ${opened?'active':''}" data-note-card="${esc(x.id)}" style="${paperCss(x.style||{})}"><div class="pm-row space"><span class="pm-card-title">${x.pinned?'📌 ':''}${esc(x.title||'제목 없음')}</span><button data-action="select" data-id="${esc(x.id)}">${opened?'접기 ⌃':'펼치기 ❯'}</button></div>${opened?`<div class="pm-read-body">${highlightedHtml(x)}</div><div class="pm-muted" style="margin-top:8px">${x.tags.map(t=>'#'+esc(t)).join(' ')} ${esc(data.folders.find(f=>f.id===x.folder)?.name||'')}</div><div class="pm-row" style="justify-content:flex-end"><button data-action="edit-note" data-id="${esc(x.id)}">✏️ 수정하기</button></div>`:`<div class="pm-muted" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:70dvh;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:3px 0">${highlightedHtml(x)}</div><div class="pm-muted">${x.tags.map(t=>'#'+esc(t)).join(' ')} ${x.shown?'· 위젯 표시 중':''}</div>`}</div>`}).join('')||'<p class="pm-muted">메모가 없어요.</p>'}</div>
${n&&viewMode==='edit'?`<div class="pm-editor"><div class="pm-row space"><b>💌 ${esc(n.title||'메모')}</b><div><button data-action="back">← 목록</button> <button data-action="delete" data-id="${esc(n.id)}">삭제</button></div></div>
<div class="pm-lace">✿ ୨୧ ─── ♡ ─── ୨୧ ✿</div>
${viewMode==='read'?`<div class="pm-read-head"><span class="pm-muted">${n.tags.map(t=>'#'+esc(t)).join(' ')} ${esc(data.folders.find(f=>f.id===n.folder)?.name||'')}</span><button data-action="edit">✏️ 수정하기</button></div><div class="pm-read-body">${highlightedHtml(n)}</div>`:`<div class="pm-tabs"><button data-tab="content" class="${editorTab==='content'?'active':''}">💌 내용·분류</button><button data-tab="style" class="${editorTab==='style'?'active':''}">🎨 꾸미기</button><button data-tab="settings" class="${editorTab==='settings'?'active':''}">🔐 설정</button></div>
${editorTab==='content'?`<label class="pm-label">제목</label><input id="pm-title" class="pm-input" value="${esc(n.title)}" ${n.contentLocked?'disabled':''}>
<label class="pm-label">내용</label><textarea id="pm-text" class="pm-input" rows="12" ${n.contentLocked?'disabled':''}>${esc(n.text)}</textarea>
<label class="pm-label">🌷 폴더</label><select id="pm-note-folder" class="pm-input" ${n.contentLocked?'disabled':''}><option value="">미분류</option>${data.folders.map(f=>`<option value="${esc(f.id)}" ${n.folder===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select>
<label class="pm-label">🏷️ 태그 (쉼표로 구분)</label><input id="pm-tags" class="pm-input" value="${esc(n.tags.join(', '))}" ${n.contentLocked?'disabled':''}>`:''}
${editorTab==='style'?`<div class="pm-muted">각 메모를 원하는 색으로 자유롭게 꾸밀 수 있어요 ♡</div><div class="pm-preview" style="${paperCss(n.style)}color:${esc(n.style.fg)};border-radius:${Number(n.style.radius)||0}px;font-size:${Number(n.style.fontSize)||14}px">${esc(n.emoji||'💌')} ${esc(n.title)}<div class="pm-lace">✉ ─── ♡ ─── ✉</div>${highlightedHtml({...n,text:n.text.slice(0,180)})}</div>
${markerEditor(n)}${emojiPicker(n)}
<div class="pm-grid"><label class="pm-label">배경색<input id="pm-bg" class="pm-input" type="color" value="${esc(n.style.bg)}"></label><label class="pm-label">글씨색<input id="pm-fg" class="pm-input" type="color" value="${esc(n.style.fg)}"></label><label class="pm-label">제목줄 색상<input id="pm-header-color" class="pm-input" type="color" value="${esc(n.style.header||'#f1ddf5')}"></label></div>
<div class="pm-label">추천 메모지 색상</div><div class="pm-palette">${['#fff8fe','#f2e8ff','#ffebf3','#fff2d8','#e6f4ec','#ffffff','#30283b'].map(c=>`<button data-palette="bg" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
<div class="pm-label">추천 글씨색</div><div class="pm-palette">${['#34264a','#684c73','#ad638b','#6b80ac','#ffffff','#90673d'].map(c=>`<button data-palette="fg" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
<div class="pm-label" style="margin-top:12px">🎀 메모지 배경 패턴 (선택 사항)</div>
<label class="pm-switch">배경 패턴 사용 <input id="pm-pattern-enabled" type="checkbox" ${n.style.patternEnabled===false||(n.style.pattern||'plain')==='plain'&&n.style.patternEnabled!==true?'':'checked'}></label>
<div class="pm-muted">끄면 선택한 배경색만 표시돼요. 패턴을 꺼도 기존 패턴 선택과 진하기는 기억해요 ♡</div>
<div id="pm-pattern-controls" style="${n.style.patternEnabled===false||(n.style.pattern||'plain')==='plain'&&n.style.patternEnabled!==true?'display:none;':''}">
<div class="pm-paper-options">${PAPER_PATTERNS.filter(([id])=>id!=='plain').map(([id,name])=>`<button type="button" class="pm-paper-choice ${((n.style.pattern||'plain')===id)?'active':''}" data-paper="${id}" title="${name}"><span class="pm-paper-swatch" style="${paperCss({...n.style,pattern:id,patternEnabled:true,patternStrength:65})}"></span><span>${name}</span></button>`).join('')}</div>
<label class="pm-label">무늬 진하기 (${Math.max(0,Math.min(100,Number(n.style.patternStrength??35)))}%)<input id="pm-pattern-strength" class="pm-input" type="range" min="0" max="100" step="5" value="${Math.max(0,Math.min(100,Number(n.style.patternStrength??35)))}"></label>
</div>
<label class="pm-label">투명도 (${n.style.opacity}%)<input id="pm-opacity" class="pm-input" type="range" min="30" max="100" value="${n.style.opacity}"></label><label class="pm-label">글자 크기 (${n.style.fontSize}px)<input id="pm-fontsize" class="pm-input" type="range" min="11" max="24" value="${n.style.fontSize}"></label><label class="pm-label">모서리 (${n.style.radius}px)<input id="pm-radius" class="pm-input" type="range" min="0" max="30" value="${n.style.radius}"></label>`:''}
${editorTab==='settings'?`<label class="pm-switch">📌 상단 고정 <input id="pm-pinned" type="checkbox" ${n.pinned?'checked':''}></label><label class="pm-switch">💌 위젯 표시 <input id="pm-shown" type="checkbox" ${n.shown?'checked':''}></label><label class="pm-switch">🔑 위치·크기 잠금 <input id="pm-poslock" type="checkbox" ${n.positionLocked?'checked':''}></label><label class="pm-switch">📄🔒 위젯 내용 수정 잠금 <input id="pm-contentlock" type="checkbox" ${n.contentLocked?'checked':''}></label><label class="pm-switch">🎀 쪽지로 접기 <input id="pm-folded" type="checkbox" ${n.folded?'checked':''}></label><div class="pm-muted">잠금 기능은 서로 독립적이에요. 접힌 쪽지는 위치 잠금이 꺼져 있으면 리본을 직접 끌어서 이동할 수 있어요.</div>`:''}
` }
</div>`:''}
<input id="pm-import-file" type="file" accept=".json,application/json" hidden>`;
bindPanel();}
function bindPanel(){panel.querySelectorAll('[data-pc-tab]').forEach(b=>b.onclick=()=>{calendarTab=b.dataset.pcTab;renderPanel()});panel.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action,id=b.dataset.id;if(a==='close'){panelOpen=false;renderPanel()}else if(a==='back'){viewMode='read';renderPanel()}else if(a==='edit'){viewMode='edit';editorTab='content';renderPanel()}else if(a==='move-folded'){foldMoveId=foldMoveId===selected?'':selected;render()}else if(a==='new'){const n=newNote();data.notes.unshift(n);selected=n.id;editorTab='content';viewMode='edit';persist();render()}else if(a==='select'){const wasOpen=selected===id&&viewMode==='read';const oldScroll=panel.scrollTop;selected=wasOpen?'':id;viewMode='read';renderPanel();panel.scrollTop=oldScroll}else if(a==='edit-note'){const oldScroll=panel.scrollTop;selected=id;viewMode='edit';editorTab='content';renderPanel();panel.scrollTop=oldScroll;const editor=$('.pm-editor',panel);if(editor)editor.scrollIntoView({block:'nearest',behavior:'instant'})}else if(a==='delete'){if(!confirm('이 메모를 삭제할까요?'))return;data.notes=data.notes.filter(n=>n.id!==id);selected='';persist();render()}else if(a==='folder'){const name=prompt('새 폴더 이름');if(!name?.trim())return;data.folders.push({id:uid(),name:name.trim()});persist();renderPanel()}else if(a==='rename-folder'){const f=data.folders.find(x=>x.id===id);if(!f)return;const name=prompt('폴더 이름 (빈칸 입력 시 삭제)',f.name);if(name===null)return;if(!name.trim()){if(!confirm('폴더를 삭제할까요? 메모는 미분류로 이동합니다.'))return;data.folders=data.folders.filter(x=>x.id!==id);data.notes.forEach(n=>{if(n.folder===id)n.folder=''});if(folderFilter===id)folderFilter='';}else f.name=name.trim();persist();renderPanel()}else if(a==='export')exportFile();else if(a==='import')$('#pm-import-file',panel).click()});
panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{editorTab=b.dataset.tab;renderPanel()});
const search=$('#pm-search',panel);if(search)search.oninput=e=>{filter=e.target.value;const pos=e.target.selectionStart;renderPanel();const next=$('#pm-search',panel);next.focus();next.setSelectionRange(pos,pos)};
const ff=$('#pm-folder-filter',panel);if(ff)ff.onchange=e=>{folderFilter=e.target.value;renderPanel()};
const file=$('#pm-import-file',panel);if(file)file.onchange=async e=>{const f=e.target.files?.[0];if(f)await importFile(f)};
const n=noteById(selected);if(!n)return;
const bind=(id,event,fn,refresh=false)=>{const el=$('#'+id,panel);if(el)el.addEventListener(event,e=>{fn(e.target);if(refresh)render();else syncWidgets()})};
bind('pm-title','input',e=>update(n,{title:e.value}));bind('pm-text','input',e=>update(n,{text:e.value}));bind('pm-tags','change',e=>update(n,{tags:[...new Set(e.value.split(',').map(s=>s.trim().replace(/^#/, '')).filter(Boolean))]}),true);
bind('pm-note-folder','change',e=>update(n,{folder:e.value}),true);bind('pm-pinned','change',e=>update(n,{pinned:e.checked}),true);bind('pm-shown','change',e=>update(n,{shown:e.checked}),true);bind('pm-poslock','change',e=>update(n,{positionLocked:e.checked}),true);bind('pm-contentlock','change',e=>update(n,{contentLocked:e.checked}),true);bind('pm-folded','change',e=>update(n,{folded:e.checked}),true);
panel.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{rememberEmoji(b.dataset.emoji);update(n,{emoji:b.dataset.emoji});render()});
panel.querySelectorAll('[data-emoji-category]').forEach(b=>b.onclick=()=>{emojiCategory=b.dataset.emojiCategory;emojiSearch='';renderPanel()});
const emojiInput=$('#pm-emoji-search',panel);if(emojiInput)emojiInput.oninput=e=>{emojiSearch=e.target.value;const pos=e.target.selectionStart;renderPanel();const el=$('#pm-emoji-search',panel);el?.focus();el?.setSelectionRange(pos,pos)};
const formatKey=v=>v==='star'?'**':'==';
panel.querySelectorAll('[data-format-toggle]').forEach(el=>el.onchange=()=>{const k=formatKey(el.dataset.formatKey);n.formats=noteFormats(n);n.formats[k][el.dataset.formatToggle]=el.checked;update(n,{});renderPanel();syncWidgets()});
panel.querySelectorAll('[data-format-color]').forEach(el=>el.onclick=()=>{const k=formatKey(el.dataset.formatKey);n.formats=noteFormats(n);n.formats[k].color=el.dataset.formatColor;update(n,{});renderPanel();syncWidgets()});
panel.querySelectorAll('[data-format-custom]').forEach(el=>el.oninput=()=>{if(!validHex(el.value))return;const k=formatKey(el.dataset.formatCustom);n.formats=noteFormats(n);n.formats[k].color=el.value;update(n,{});const label=el.nextElementSibling;if(label)label.textContent=el.value;syncWidgets()});
const addHighlight=panel.querySelector('[data-action="add-highlight"]');if(addHighlight)addHighlight.onclick=()=>{if(n.contentLocked)return;const phrase=$('#pm-mark-phrase',panel)?.value.trim();if(!phrase)return;if(!n.text.includes(phrase)){alert('메모 내용에서 해당 문구를 찾지 못했어요.');return}const k=$('#pm-phrase-format',panel)?.value==='**'?'**':'==';n.highlights=Array.isArray(n.highlights)?n.highlights:[];n.highlights=n.highlights.filter(h=>h.phrase!==phrase);n.highlights.push({phrase,format:{...noteFormats(n)[k]}});update(n,{});renderPanel();syncWidgets()};
panel.querySelectorAll('[data-remove-highlight]').forEach(el=>el.onclick=()=>{if(n.contentLocked)return;n.highlights=(n.highlights||[]).filter((_,i)=>i!==Number(el.dataset.removeHighlight));update(n,{});renderPanel();syncWidgets()});
const patternToggle=$('#pm-pattern-enabled',panel);if(patternToggle)patternToggle.onchange=e=>{n.style.patternEnabled=e.target.checked;if(e.target.checked&&(!n.style.pattern||n.style.pattern==='plain'))n.style.pattern='watercolor';update(n,{});renderPanel();syncWidgets()};
panel.querySelectorAll('[data-paper]').forEach(b=>b.onclick=()=>{n.style.pattern=b.dataset.paper;n.style.patternEnabled=true;update(n,{});renderPanel();syncWidgets()});
const patternSlider=$('#pm-pattern-strength',panel);if(patternSlider)patternSlider.oninput=e=>{n.style.patternStrength=Number(e.target.value);update(n,{});const preview=$('.pm-preview',panel);if(preview){const p=paperBackground(n.style);preview.style.background=p.background;preview.style.backgroundSize=p.backgroundSize}const label=e.target.closest('label');if(label)label.firstChild.textContent='무늬 진하기 ('+n.style.patternStrength+'%)';syncWidgets();};
panel.querySelectorAll('[data-palette]').forEach(b=>b.onclick=()=>{n.style[b.dataset.palette]=b.dataset.color;update(n,{});render()});
for(const [id,prop] of [['pm-bg','bg'],['pm-fg','fg'],['pm-header-color','header'],['pm-opacity','opacity'],['pm-fontsize','fontSize'],['pm-radius','radius']])bind(id,'input',e=>{n.style[prop]=['bg','fg','header'].includes(prop)?e.value:Number(e.value);update(n,{})});
}
function renderWidgets(){widgets.replaceChildren();if(!current)return;for(const n of data.notes.filter(n=>n.shown)){
const el=document.createElement('section');el.className='pm-widget'+(n.folded?' pm-folded':'');el.dataset.id=n.id;
const bg=n.style?.bg||'#fff8fe',fg=n.style?.fg||'#34264a',header=n.style?.header||'#f1ddf5';
const dp=getDevicePos(n)||n;const w=Math.max(170,Math.min(innerWidth-12,Number(dp.width)||270)),h=Math.max(120,Math.min(innerHeight-12,Number(dp.height)||210));const x=Math.max(0,Math.min(innerWidth-(n.folded?40:Math.min(w,60)),Number(dp.x)||0)),y=Math.max(0,Math.min(innerHeight-(n.folded?40:Math.min(h,50)),Number(dp.y)||0));
el.style.cssText=`left:${x}px;top:${y}px;width:${n.folded?40:w}px;height:${n.folded?40:h}px;${n.folded?`background:${bg};`:paperCss(n.style)}color:${fg};opacity:${n.folded?1:n.style.opacity/100};border-radius:${n.folded?50:n.style.radius}px;font-size:${n.style.fontSize}px;--pm-header:${header}`;
if(n.folded){
 el.innerHTML=`<button class="pm-fold-button" type="button" title="메모 펼치기">🎀</button><button class="pm-fold-handle" type="button" title="끌어서 위치 이동" ${n.positionLocked?'disabled':''} ${foldMoveId===n.id&&!n.positionLocked?'':'hidden'}>✥</button>`;
 const fold=$('.pm-fold-button',el),handle=$('.pm-fold-handle',el);
 // Drag the folded ribbon itself; a short tap still unfolds it.
 let activeFold=null, suppressFoldClick=false;
 const foldStart=(x,y,type,id)=>{
   if(n.positionLocked)return;
   const r=el.getBoundingClientRect();
   activeFold={x,y,type,id,left:r.left,top:r.top,moved:false};
 };
 const foldMove=(x,y)=>{
   if(!activeFold)return;
   const dx=x-activeFold.x,dy=y-activeFold.y;
   if(!activeFold.moved&&Math.hypot(dx,dy)<7)return;
   activeFold.moved=true;
   el.style.left=Math.max(0,Math.min(innerWidth-40,activeFold.left+dx))+'px';
   el.style.top=Math.max(0,Math.min(innerHeight-40,activeFold.top+dy))+'px';
 };
 const foldFinish=()=>{
   if(!activeFold)return;
   const moved=activeFold.moved;
   activeFold=null;
   if(moved){
     suppressFoldClick=true;
     update(n,{x:parseFloat(el.style.left)||0,y:parseFloat(el.style.top)||0});
     saveDevicePos(n);
   }
 };
 fold.addEventListener('touchstart',e=>{
   if(e.touches.length!==1)return;
   const t=e.changedTouches[0];foldStart(t.clientX,t.clientY,'touch',t.identifier);
 },{passive:true});
 fold.addEventListener('touchmove',e=>{
   if(activeFold?.type!=='touch')return;
   const t=[...e.changedTouches].find(t=>t.identifier===activeFold.id);
   if(!t)return;
   if(e.cancelable)e.preventDefault();
   foldMove(t.clientX,t.clientY);
 },{passive:false});
 fold.addEventListener('touchend',e=>{
   if(activeFold?.type==='touch'&&[...e.changedTouches].some(t=>t.identifier===activeFold.id))foldFinish();
 });
 fold.addEventListener('touchcancel',foldFinish);
 fold.addEventListener('pointerdown',e=>{
   if(e.pointerType==='touch'||e.button!==0)return;
   foldStart(e.clientX,e.clientY,'pointer',e.pointerId);
   try{fold.setPointerCapture(e.pointerId)}catch{}
 });
 fold.addEventListener('pointermove',e=>{
   if(activeFold?.type==='pointer'&&activeFold.id===e.pointerId)foldMove(e.clientX,e.clientY);
 });
 fold.addEventListener('pointerup',e=>{
   if(activeFold?.type==='pointer'&&activeFold.id===e.pointerId)foldFinish();
 });
 fold.addEventListener('pointercancel',foldFinish);
 fold.onclick=e=>{
   if(suppressFoldClick){e.preventDefault();suppressFoldClick=false;return}
   foldMoveId='';update(n,{folded:false});render();
 };
 fold.oncontextmenu=e=>e.preventDefault();

}else{
 el.innerHTML=`<div class="pm-widget-head"><strong>${esc(n.emoji||'💌')} ${esc(n.title)}</strong><div class="pm-widget-actions"><button data-action="read-toggle" title="위젯에서 내용 수정">✏️</button><button data-action="fold" title="리본으로 접기">▾</button><button class="pm-drag-handle" type="button" title="누른 채 이동" ${n.positionLocked?'disabled':''}>✥</button><button data-action="position" title="위치·크기 잠금">${n.positionLocked?'🔐':'🔓'}</button><button data-action="content" title="위젯 내용 수정 잠금">${n.contentLocked?'📄🔒':'📝'}</button><button data-action="hide" title="위젯 숨기기">×</button></div></div><div class="pm-paperline">✉ ───── ♡ ───── ✉</div><div class="pm-widget-read"></div><textarea placeholder="메모 내용" hidden></textarea><div class="pm-widget-edit-actions" hidden><button type="button" data-action="cancel-edit">취소</button><button type="button" data-action="save-edit">💾 저장</button></div>${n.positionLocked?'':'<div class="pm-resize" title="크기 조절"></div>'}`;
 // Calendar and memo share the ORIGINAL floating note frame, its drag handle and resize grip.
 if(true){
  const line=el.querySelector('.pm-paperline');
  const tabs=document.createElement('div');tabs.className='pm-pc-widget-tabs';
  tabs.innerHTML='<button type="button" data-pmw-tab="memo">💌 메모</button>'+(cal.settings?.widgetShown&&cal.settings?.widgetInMemo!==false?'<button type="button" data-pmw-tab="calendar">📅 달력</button>':'')+(checklist.settings?.inMemo!==false?'<button type="button" data-pmw-tab="checklist">☑️ 체크</button>':'');
  line.before(tabs);
  const calendarPane=document.createElement('div');calendarPane.className='pm-pc-widget-calendar';
  const readPane=el.querySelector('.pm-widget-read');
  const textareaPane=el.querySelector('textarea');
  const editPane=el.querySelector('.pm-widget-edit-actions');
  const applyTab=()=>{
   const mode=window.__pmCalendarWidgetTab===n.id?'calendar':window.__pmChecklistWidgetTab===n.id&&checklist.settings?.inMemo!==false?'checklist':'memo';
   const on=mode!=='memo';
   tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.pmwTab===mode));
   line.hidden=on;readPane.hidden=on;textareaPane.hidden=on||textareaPane.hidden;
   editPane.hidden=on||editPane.hidden;
   calendarPane.hidden=!on;
   el.querySelectorAll('.pm-widget-actions [data-action="read-toggle"],.pm-widget-actions [data-action="content"]').forEach(b=>b.hidden=on);
   if(mode==='checklist'){
    calendarPane.innerHTML=pmChecklistHtml(true);
    pmBindChecklist(calendarPane,true);
   }
   if(mode==='calendar'){
    const t=cal.timelines.find(x=>x.id===calTimeline);
    const items=pcDateEvents(calDate).filter(e=>!e.widgetHidden&&!e.hidden);
    const widgetEvents=pcDateEvents(calDate).filter(e=>!e.widgetHidden&&!e.hidden);
    const timelines=cal.timelines.map(t=>'<button type="button" data-pmw-timeline="'+pcEsc(t.id)+'" class="'+(t.id===calTimeline?'active':'')+'">'+pcEsc(t.name)+'</button>').join('');
    const eventRows=widgetEvents.map(e=>'<div class="pcw-item"><button type="button" data-pmw-edit="'+pcEsc(e.id)+'">✏️ '+pcEsc(e.emoji||'💌')+' '+pcEsc(e.title||'제목 없음')+'</button></div>').join('')||'<div class="pcw-item">미기록</div>';
    calendarPane.innerHTML='<div class="pm-pc-widget-cal-title">📅 시간선별 달력</div><div class="pmw-timelines">'+timelines+'</div><div class="pmw-cal-nav"><button type="button" data-pmw-month="prev">‹</button><b>'+pcEsc(calMonth)+'</b><button type="button" data-pmw-month="next">›</button></div>'+pcCalendarBody()+'<div class="pmw-date-head"><b>📅 '+pcEsc(calDate)+'</b><button type="button" data-pmw-new>＋ 일정 추가</button></div><div class="pm-pc-widget-cal-events">'+eventRows+'</div><button type="button" data-pmw-compare>🔀 시간선 비교</button> <button type="button" class="pm-pc-widget-open">달력 관리 열기</button><div class="pmw-inline-editor" hidden></div>';
    const inline=calendarPane.querySelector('.pmw-inline-editor');
    const openInline=(event)=>{
      const isNew=!event;
      const draft=isNew?pcNew():{...event};
      inline.hidden=false;
      inline.innerHTML='<div class="pmw-edit-title">'+(isNew?'＋ 새 일정':'✏️ 일정 수정')+'</div><label>제목<input data-pmw-field="title" value="'+pcEsc(draft.title||'')+'"></label><label>날짜<input type="date" data-pmw-field="date" value="'+pcEsc(draft.date||calDate)+'"></label><label>시간<input type="time" data-pmw-field="time" value="'+pcEsc(draft.time||'')+'"></label><label>내용<textarea data-pmw-field="text" rows="3">'+pcEsc(draft.text||'')+'</textarea></label><label>상태<select data-pmw-field="status">'+Object.entries(pcStatus).map(([k,v])=>'<option value="'+k+'" '+(draft.status===k?'selected':'')+'>'+pcEsc(v)+'</option>').join('')+'</select></label><label>시간선<select data-pmw-field="timeline">'+cal.timelines.map(t=>'<option value="'+pcEsc(t.id)+'" '+(draft.timeline===t.id?'selected':'')+'>'+pcEsc(t.name)+'</option>').join('')+'</select></label><div class="pmw-edit-actions"><button type="button" data-pmw-save>💾 저장</button><button type="button" data-pmw-cancel>취소</button></div>';
      inline.querySelector('[data-pmw-cancel]').onclick=()=>{inline.hidden=true;inline.innerHTML=''};
      inline.querySelector('[data-pmw-save]').onclick=()=>{
        if(event?.locked){alert('잠긴 일정입니다. 달력 관리에서 잠금을 해제해 주세요.');return}
        inline.querySelectorAll('[data-pmw-field]').forEach(field=>{draft[field.dataset.pmwField]=field.value});
        if(!draft.title.trim()){alert('일정 제목을 입력해 주세요.');return}
        if(isNew)cal.events.push(draft);else Object.assign(event,draft);
        calDate=draft.date;calTimeline=draft.timeline;calMonth=calDate.slice(0,7);calSave();applyTab();
      };
    };
    calendarPane.querySelectorAll('[data-pmw-timeline]').forEach(b=>b.onclick=()=>{calTimeline=b.dataset.pmwTimeline;applyTab()});
    calendarPane.querySelectorAll('[data-pc-day]').forEach(b=>b.onclick=()=>{calDate=b.dataset.pcDay;applyTab()});
    calendarPane.querySelectorAll('[data-pmw-month]').forEach(b=>b.onclick=()=>{const [y,m]=calMonth.split('-').map(Number);const d=new Date(y,m-1+(b.dataset.pmwMonth==='next'?1:-1),1);calMonth=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');calDate=calMonth+'-01';applyTab()});
    calendarPane.querySelector('[data-pmw-new]').onclick=()=>openInline(null);
    calendarPane.querySelectorAll('[data-pmw-edit]').forEach(b=>b.onclick=()=>openInline(cal.events.find(e=>e.id===b.dataset.pmwEdit)));
    calendarPane.querySelector('[data-pmw-compare]').onclick=()=>{
      const compare=cal.timelines.map(t=>{const ev=cal.events.filter(e=>e.timeline===t.id&&e.date===calDate);return t.name+': '+(ev.length?ev.map(e=>e.title+' ('+(pcStatus[e.status]||'미정')+')').join(', '):'미기록')}).join('\n');
      alert(calDate+' 시간선 비교\n\n'+compare);
    };
    calendarPane.querySelector('.pm-pc-widget-open').onclick=()=>{calendarTab='calendar';calEdit='';panelOpen=true;renderPanel()};
   }
  };
  line.after(calendarPane);
  tabs.querySelectorAll('button').forEach(b=>b.onclick=()=>{window.__pmCalendarWidgetTab=b.dataset.pmwTab==='calendar'?n.id:null;window.__pmChecklistWidgetTab=b.dataset.pmwTab==='checklist'?n.id:null;renderWidgets()});
  applyTab();
 }
 const ta=$('textarea',el),readEl=$('.pm-widget-read',el),editActions=$('.pm-widget-edit-actions',el),editButton=$('[data-action="read-toggle"]',el);
 let editing=false;
 ta.value=n.text;ta.style.color=fg;readEl.innerHTML=highlightedHtml(n);
 const setEditing=on=>{editing=on;readEl.hidden=on;ta.hidden=!on;editActions.hidden=!on;editButton.textContent=on?'📖':'✏️';editButton.title=on?'읽기로 돌아가기':'위젯에서 내용 수정';if(on){ta.value=n.text;ta.focus()}else{readEl.innerHTML=highlightedHtml(n)}};
 el.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{
  const a=b.dataset.action;
  if(a==='read-toggle'){
   if(editing){if(ta.value!==n.text&&!confirm('저장하지 않은 수정 내용을 버릴까요?'))return;setEditing(false)}
   else{if(n.contentLocked){alert('내용 수정 잠금이 켜져 있어요. 📝 버튼으로 잠금을 해제해 주세요.');return}setEditing(true)}
   return;
  }
  if(a==='save-edit'){
   if(n.contentLocked){alert('내용 수정 잠금이 켜져 있어요.');return}
   if(ta.value!==n.text){const previous=n.text;update(n,{text:ta.value});if(saveFailed){n.text=previous;return}}
   setEditing(false);
   const editor=$('#pm-text',panel);if(editor&&selected===n.id&&document.activeElement!==editor)editor.value=n.text;
   return;
  }
  if(a==='cancel-edit'){if(ta.value!==n.text&&!confirm('수정 내용을 버릴까요?'))return;setEditing(false);return}
  if(editing&&ta.value!==n.text&&!confirm('저장하지 않은 수정 내용이 있어요. 계속할까요?'))return;
  if(a==='hide')update(n,{shown:false});
  if(a==='position')update(n,{positionLocked:!n.positionLocked});
  if(a==='content')update(n,{contentLocked:!n.contentLocked});
  if(a==='fold')update(n,{folded:true});
  render();
 });
 if(!n.positionLocked){attachDrag($('.pm-drag-handle',el),el,n,'move',false);const grip=$('.pm-resize',el);if(grip)attachDrag(grip,el,n,'resize',false)}
}
widgets.appendChild(el);
}}
function syncWidgets(){const expected=new Set(data.notes.filter(n=>n.shown).map(n=>n.id));const existing=[...widgets.querySelectorAll('.pm-widget')];if(existing.length!==expected.size||existing.some(el=>!expected.has(el.dataset.id))){renderWidgets();return}for(const el of existing){const n=noteById(el.dataset.id);if(!n)continue;const ta=$('textarea',el);if(ta&&document.activeElement!==ta&&ta.value!==n.text)ta.value=n.text;const readEl=$('.pm-widget-read',el);if(readEl)readEl.innerHTML=highlightedHtml(n);const title=$('.pm-widget-head strong',el);if(title)title.textContent=(n.emoji||'💌')+' '+n.title;if(!n.folded){const p=paperBackground(n.style);el.style.background=p.background;el.style.backgroundSize=p.backgroundSize}}}
// Touch Events are used explicitly for iOS STAY compatibility. Pointer Events handle mouse/pen.
function attachDrag(handle,el,n,kind,ignoreButtons){
  if(!handle)return;
  let active=null;
  const begin=(x,y,type,id)=>{
    if(active||n.positionLocked)return;
    const rect=el.getBoundingClientRect();
    active={type,id,x,y,left:rect.left,top:rect.top,width:rect.width,height:rect.height,moved:false};
  };
  const move=(x,y)=>{
    if(!active)return;
    const dx=x-active.x,dy=y-active.y;
    if(Math.abs(dx)+Math.abs(dy)>3)active.moved=true;
    if(kind==='move'){
      el.style.left=Math.max(0,Math.min(innerWidth-(n.folded?40:50),active.left+dx))+'px';
      el.style.top=Math.max(0,Math.min(innerHeight-(n.folded?40:40),active.top+dy))+'px';
    }else{
      el.style.width=Math.max(170,Math.min(innerWidth-active.left,active.width+dx))+'px';
      el.style.height=Math.max(120,Math.min(innerHeight-active.top,active.height+dy))+'px';
    }
  };
  const finish=()=>{
    if(!active)return;
    const changed=active.moved;active=null;
    if(changed){
      update(n,{x:parseFloat(el.style.left)||0,y:parseFloat(el.style.top)||0,...(n.folded?{}:{width:el.offsetWidth,height:el.offsetHeight})});saveDevicePos(n);
    }
  };
  handle.addEventListener('touchstart',e=>{
    if(ignoreButtons&&e.target.closest('button'))return;
    if(e.touches.length!==1)return;
    const t=e.changedTouches[0];begin(t.clientX,t.clientY,'touch',t.identifier);
  },{passive:true});
  handle.addEventListener('touchmove',e=>{
    if(!active||active.type!=='touch')return;
    const t=[...e.changedTouches].find(t=>t.identifier===active.id);
    if(!t)return;
    if(e.cancelable)e.preventDefault();
    move(t.clientX,t.clientY);
  },{passive:false});
  handle.addEventListener('touchend',e=>{
    if(active?.type==='touch'&&[...e.changedTouches].some(t=>t.identifier===active.id))finish();
  });
  handle.addEventListener('touchcancel',()=>finish());
  handle.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||e.button!==0)return;
    if(ignoreButtons&&e.target.closest('button'))return;
    e.preventDefault();begin(e.clientX,e.clientY,'pointer',e.pointerId);
    try{handle.setPointerCapture(e.pointerId)}catch{}
  });
  handle.addEventListener('pointermove',e=>{
    if(active?.type==='pointer'&&active.id===e.pointerId)move(e.clientX,e.clientY);
  });
  handle.addEventListener('pointerup',e=>{if(active?.type==='pointer'&&active.id===e.pointerId)finish()});
  handle.addEventListener('pointercancel',()=>finish());
  if(handle.classList.contains('pm-drag-handle'))handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()});
}
function exportFile(){if(!current)return;const backup={format:'pocket-memo-backup',version:1,roomId:current,exportedAt:new Date().toISOString(),data};const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='PocketMemo-'+current.slice(0,24)+'-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
async function importFile(file){if(file.size>5*1024*1024){alert('백업 파일이 5MB를 초과해요.');return}let parsed;try{parsed=JSON.parse(await file.text())}catch{alert('JSON 파일을 읽을 수 없어요.');return}if(parsed?.format!=='pocket-memo-backup'||parsed.version!==1||!Array.isArray(parsed.data?.notes)||!Array.isArray(parsed.data?.folders)){alert('Pocket Memo v1 백업 파일이 아니에요.');return}if(parsed.roomId!==current){alert('이 백업은 다른 RP방의 파일이에요. 방별 분리를 위해 가져오지 않았어요.');return}const incoming=parsed.data;if(incoming.notes.length>10000||incoming.folders.length>1000){alert('백업 항목이 너무 많아요.');return}const duplicateCount=incoming.notes.filter(n=>data.notes.some(x=>x.id===n.id)).length;const preview='백업 미리보기\n현재 '+data.notes.length+'개 / 백업 '+incoming.notes.length+'개\n중복 ID '+duplicateCount+'개 / 새 메모 '+(incoming.notes.length-duplicateCount)+'개\n\n';const mode=prompt(preview+'백업 복원 방법을 선택해 주세요.\n1 = 기존 메모와 병합 (같은 ID는 기존 메모 유지)\n2 = 현재 방 메모를 백업으로 교체\n취소 = 복원하지 않음','1');if(mode!=='1'&&mode!=='2')return;if(mode==='2'&&!confirm('현재 방 메모가 백업 내용으로 교체됩니다. 계속할까요?'))return;
const normalize=n=>{const base=newNote();return {...base,...n,id:String(n.id||uid()),title:String(n.title||''),text:String(n.text||''),folder:String(n.folder||''),tags:Array.isArray(n.tags)?n.tags.map(String):[],style:{...base.style,...(n.style&&typeof n.style==='object'?n.style:{})},formats:{...base.formats,...(n.formats&&typeof n.formats==='object'?n.formats:{})},highlights:Array.isArray(n.highlights)?n.highlights.filter(h=>h&&typeof h.phrase==='string'&&(h.format||validHex(h.color))).slice(0,500):[],folded:!!n.folded,emoji:String(n.emoji||'💌'),shown:!!n.shown,positionLocked:!!n.positionLocked,contentLocked:!!n.contentLocked}};
const folders=incoming.folders.filter(f=>f&&typeof f.id==='string'&&typeof f.name==='string').map(f=>({id:f.id,name:f.name}));const notes=incoming.notes.filter(n=>n&&typeof n==='object').map(normalize);
const oldData=JSON.parse(JSON.stringify(data));if(mode==='2'){data={version:1,folders,notes}}else{const folderIds=new Set(data.folders.map(f=>f.id)),noteIds=new Set(data.notes.map(n=>n.id));for(const f of folders)if(!folderIds.has(f.id)){data.folders.push(f);folderIds.add(f.id)}for(const n of notes)if(!noteIds.has(n.id)){data.notes.push(n);noteIds.add(n.id)}}if(!persist()){data=oldData;alert('복원 저장에 실패했습니다. 기존 데이터를 유지합니다.');return}selected='';viewMode='read';render();alert('메모 복원이 완료됐어요.')}
// v1.0.3: movable launcher, separately stored from room notes.
// Hide it while typing in the chat so iOS desktop-site mode cannot cover the input.
const launcher=$('#pm-launch',root);
const launcherKey=PREFIX+'launcher-position:v2';
let launcherPosition=null, launcherDrag=null, suppressLauncherClick=false;
try{const saved=JSON.parse(localStorage.getItem(launcherKey)||'null');if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))launcherPosition=saved}catch(e){}
function launcherBounds(){
  const vv=window.visualViewport;
  return {w:vv?.width||innerWidth,h:vv?.height||innerHeight,
    x:vv?.offsetLeft||0,y:vv?.offsetTop||0};
}
function placeLauncher(){
  const b=launcherBounds(),size=40,margin=8;
  let x=launcherPosition?b.x+launcherPosition.x*Math.max(0,b.w-size):b.x+b.w-size-14;
  let y=launcherPosition?b.y+launcherPosition.y*Math.max(0,b.h-size):b.y+b.h-size-180;
  x=Math.max(b.x+margin,Math.min(b.x+b.w-size-margin,x));
  y=Math.max(b.y+margin,Math.min(b.y+b.h-size-margin,y));
  launcher.style.left=x+'px';launcher.style.top=y+'px';
  launcher.style.right='auto';launcher.style.bottom='auto';
}
function saveLauncherPosition(){
  const b=launcherBounds(),r=launcher.getBoundingClientRect();
  launcherPosition={x:Math.max(0,Math.min(1,(r.left-b.x)/Math.max(1,b.w-40))),
    y:Math.max(0,Math.min(1,(r.top-b.y)/Math.max(1,b.h-40)))};
  try{localStorage.setItem(launcherKey,JSON.stringify(launcherPosition))}catch(e){console.warn('[Pocket Memo] launcher position',e)}
}
function isChatTyping(){
  const a=document.activeElement;
  if(!a||root.contains(a))return false;
  return a.matches?.('textarea,input:not([type=checkbox]):not([type=radio]),[contenteditable="true"],[role="textbox"]')||!!a.closest?.('[contenteditable="true"]');
}
function syncLauncherVisibility(){
  launcher.style.display=(!current||isChatTyping())?'none':'';
  if(current&&!isChatTyping())placeLauncher();
}
function launcherBegin(x,y,type,id){
  if(launcherDrag)return;
  const r=launcher.getBoundingClientRect();
  launcherDrag={x,y,left:r.left,top:r.top,type,id,moved:false};
}
function launcherMove(x,y){
  const a=launcherDrag;if(!a)return;
  const dx=x-a.x,dy=y-a.y;
  if(Math.abs(dx)+Math.abs(dy)>5)a.moved=true;
  if(!a.moved)return;
  const b=launcherBounds();
  launcher.style.left=Math.max(b.x+8,Math.min(b.x+b.w-48,a.left+dx))+'px';
  launcher.style.top=Math.max(b.y+8,Math.min(b.y+b.h-48,a.top+dy))+'px';
}
function launcherFinish(){
  if(!launcherDrag)return;
  if(launcherDrag.moved){saveLauncherPosition();suppressLauncherClick=true;}
  launcherDrag=null;
}
launcher.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const t=e.changedTouches[0];launcherBegin(t.clientX,t.clientY,'touch',t.identifier)},{passive:true});
launcher.addEventListener('touchmove',e=>{if(launcherDrag?.type!=='touch')return;const t=[...e.changedTouches].find(t=>t.identifier===launcherDrag.id);if(!t)return;launcherMove(t.clientX,t.clientY);if(launcherDrag?.moved&&e.cancelable)e.preventDefault()},{passive:false});
launcher.addEventListener('touchend',e=>{if(launcherDrag?.type==='touch'&&[...e.changedTouches].some(t=>t.identifier===launcherDrag.id))launcherFinish()});
launcher.addEventListener('touchcancel',launcherFinish);
launcher.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.button!==0)return;launcherBegin(e.clientX,e.clientY,'pointer',e.pointerId);try{launcher.setPointerCapture(e.pointerId)}catch(err){}});
launcher.addEventListener('pointermove',e=>{if(launcherDrag?.type==='pointer'&&launcherDrag.id===e.pointerId)launcherMove(e.clientX,e.clientY)});
launcher.addEventListener('pointerup',e=>{if(launcherDrag?.type==='pointer'&&launcherDrag.id===e.pointerId)launcherFinish()});
launcher.addEventListener('pointercancel',launcherFinish);
launcher.addEventListener('click',e=>{
  if(suppressLauncherClick){suppressLauncherClick=false;e.preventDefault();return;}
  changeRoom();panelOpen=!panelOpen;renderPanel();
});
document.addEventListener('focusin',syncLauncherVisibility,true);
document.addEventListener('focusout',()=>setTimeout(syncLauncherVisibility,80),true);
window.addEventListener('resize',()=>{syncLauncherVisibility();renderWidgets()},{passive:true});
window.addEventListener('orientationchange',syncLauncherVisibility,{passive:true});
window.visualViewport?.addEventListener('resize',syncLauncherVisibility,{passive:true});
window.visualViewport?.addEventListener('scroll',syncLauncherVisibility,{passive:true});

// Calendar data lives outside original Pocket Memo storage.
const PC_PREFIX='pocket-story-calendar:v2:room:';
let checklist={lists:[]},checklistSelected='',checklistFilter='',checklistTimeline='original',checklistWidgetEnabled=true;
const PM_CHECK_PREFIX='pocket-checklist:v1:room:';
function checkLoad(){checklist={lists:[],settings:{inMemo:true,separate:false}};try{const v=JSON.parse(localStorage.getItem(PM_CHECK_PREFIX+current)||'null');if(v&&Array.isArray(v.lists))checklist=v}catch(e){console.warn('[Pocket Checklist] read',e)}checklistSelected='';checklistTimeline=calTimeline||'original';checkCustomEmojis=checklist.customEmojis||[]}
function checkSave(){try{localStorage.setItem(PM_CHECK_PREFIX+current,JSON.stringify(checklist));return true}catch(e){alert('체크리스트 저장에 실패했어요. 저장 공간을 확인해 주세요.');return false}}
let cal={timelines:[{id:'original',name:'원래 시간선'}],events:[],settings:{weekStart:0,view:'month'}},calTimeline='original',calDate='',calMonth='',calEdit='',calEditTab='content',calFilter='',calWidgetShown=false;
const pcToday=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function calLoad(){cal={timelines:[{id:'original',name:'원래 시간선'}],events:[],settings:{weekStart:0,view:'month'}};try{const x=JSON.parse(localStorage.getItem(PC_PREFIX+current)||'null');if(x&&Array.isArray(x.timelines)&&Array.isArray(x.events)&&x.timelines.length)cal=x;}catch(e){console.warn('[Story Calendar] load',e)}if(cal.settings.widgetFolded===undefined)cal.settings.widgetFolded=true;if(!cal.settings.widgetMode)cal.settings.widgetMode='companion';if(cal.settings.widgetInMemo===undefined)cal.settings.widgetInMemo=!!cal.settings.widgetShown&&cal.settings.widgetMode!=='independent';if(cal.settings.widgetSeparate===undefined)cal.settings.widgetSeparate=!!cal.settings.widgetShown&&cal.settings.widgetMode==='independent';calTimeline=cal.timelines.some(t=>t.id===calTimeline)?calTimeline:cal.timelines[0].id;calDate=pcToday();calMonth=calDate.slice(0,7);calEdit='';}
function calSave(){try{localStorage.setItem(PC_PREFIX+current,JSON.stringify(cal));return true}catch(e){alert('달력 저장에 실패했습니다. 저장 공간을 확인해 주세요.');return false}}
const pcEsc=v=>esc(String(v??''));
const pcEvents=()=>cal.events.filter(e=>e.timeline===calTimeline);
const pcEmojiDefaults=['💌','🎀','🌷','💍','💜','💕','🦋','🌙','⭐','🎂','🎁','📖','📍','🗓️','🕊️','🥀','🌸','🧸','🍀','☕','✈️','🏠','💐','✨'];
function pcEmojiChoices(){return [...new Set([...pcEmojiDefaults,...(cal.settings.customEmojis||[])])]}
function pcTimelineChips(){return `<div class="pc-timeline-chips">${cal.timelines.map(t=>`<button type="button" data-pc-timeline="${pcEsc(t.id)}" class="${t.id===calTimeline?'active':''}">${pcEsc(t.name)} ${t.id===calTimeline?'✓':''}</button>`).join('')}</div><div class="pm-muted">선택: ${pcEsc(cal.timelines.find(t=>t.id===calTimeline)?.name||'')} · 시간선별 일정은 서로 독립 저장</div>`}
const pcStatus={planned:'예정',ongoing:'진행 중',confirmed:'확정',done:'완료',unknown:'미정',cancelled:'취소',na:'해당 없음'};
function pcStyle(e){const s=e.style||{};return `background:${/^#[0-9a-f]{6}$/i.test(s.bg||'')?s.bg:'#fff8fe'};color:${/^#[0-9a-f]{6}$/i.test(s.fg||'')?s.fg:'#34264a'};border-radius:${Math.max(0,Math.min(30,Number(s.radius)||12))}px;font-size:${Math.max(11,Math.min(24,Number(s.fontSize)||14))}px;opacity:${Math.max(.3,Math.min(1,(Number(s.opacity)||100)/100))};${s.pattern==='dots'?'background-image:radial-gradient(#d5b9e155 1px,transparent 1px);background-size:13px 13px;':s.pattern==='lines'?'background-image:repeating-linear-gradient(0deg,transparent 0px,transparent 23px,#d5b9e155 24px);':''}`}
function pcDateEvents(day){return pcEvents().filter(e=>e.date===day).sort((a,b)=>(a.time||'').localeCompare(b.time||''))}
function pcCalendarBody(){const [year,month]=calMonth.split('-').map(Number);const first=new Date(year,month-1,1).getDay();const offset=(first-(Number(cal.settings.weekStart)||0)+7)%7;const days=new Date(year,month,0).getDate();const names=['일','월','화','수','목','금','토'];const header=Array.from({length:7},(_,i)=>`<span>${names[(i+(Number(cal.settings.weekStart)||0))%7]}</span>`).join('');const cells=Array.from({length:Math.ceil((offset+days)/7)*7},(_,i)=>{const d=i-offset+1;if(d<1||d>days)return '<span class="pc-empty"></span>';const date=calMonth+'-'+String(d).padStart(2,'0');const events=pcDateEvents(date).filter(e=>!e.hidden);return `<button class="pc-day ${date===calDate?'active':''}" data-pc-day="${date}"><b>${d}</b>${events.length?`<small>${events.slice(0,3).map(e=>pcEsc(e.emoji||'💌')).join('')}${events.length>3?'+':''}</small>`:''}</button>`}).join('');return `<div class="pc-week">${header}</div><div class="pc-days">${cells}</div>`}
function pcFormat(text,style){const fm=style.formats||{};let out=pcEsc(text);for(const key of ['==','**']){const f=fm[key]||{highlight:key==='==',bold:key==='**',underline:false,color:key==='=='?(style.highlight||'#FFE878'):'#D9C5FF'};let st='';if(f.highlight)st+='background:'+pcSafeColor(f.color,'#FFE878')+';';if(f.bold)st+='font-weight:700;';if(f.underline)st+='text-decoration:underline;';const rx=key==='=='?/==([^\n]+?)==/g:/\*\*([^\n]+?)\*\*/g;out=out.replace(rx,(_,v)=>'<span style="'+st+'">'+v+'</span>')}return out.replace(/__([^\n]+?)__/g,'<u>$1</u>')}
function pcEventCard(e){return `<div class="pc-event" style="${pcStyle(e)}"><div class="pm-row space"><strong style="color:${/^#[0-9a-f]{6}$/i.test(e.style?.titleColor||'')?e.style.titleColor:'#765591'}">${pcEsc(e.emoji||'💌')} ${pcEsc(e.title||'제목 없음')}</strong><span>${pcEsc(pcStatus[e.status]||'미정')}</span></div><div class="pm-muted">${pcEsc(e.date||'날짜 미정')} ${pcEsc(e.time||'')} ${pcEsc(e.category||'')} ${pcEsc((e.tags||[]).map(t=>'#'+t).join(' '))}</div><div style="white-space:pre-wrap;overflow-wrap:anywhere">${pcFormat(e.text||'',e.style||{})}</div><div class="pm-row"><button data-pc-edit="${pcEsc(e.id)}">✏️ 수정</button><button data-pc-copy="${pcEsc(e.id)}">복사</button><button data-pc-delete="${pcEsc(e.id)}">삭제</button></div></div>`}
function pcDecorationFields(e){const s=e.style||{};const fmt=s.formats||{};const palettes=['#FFE878','#F4BCD2','#D9C5FF','#BCE8D6','#B8D9FF','#F8D5B2'];const preview=(key)=>{const f=fmt[key]||{highlight:key==='==',bold:key==='**',underline:false,color:key==='=='?'#FFE878':'#D9C5FF'};let st='';if(f.highlight)st+='background:'+pcSafeColor(f.color,key==='=='?'#FFE878':'#D9C5FF')+';';if(f.bold)st+='font-weight:700;';if(f.underline)st+='text-decoration:underline;';return '<span style="'+st+'">머리카락 넘기기</span>'};const group=(key)=>{const f=fmt[key]||{highlight:key==='==',bold:key==='**',underline:false,color:key==='=='?'#FFE878':'#D9C5FF'};return `<div class="pm-format-group"><b>${key} 기호</b><div class="pm-row">${[['highlight','🖍️ 형광펜'],['bold','굵게'],['underline','밑줄']].map(([k,label])=>`<label class="pm-format-check"><input type="checkbox" data-pc-fmt="${key}" data-pc-fmt-key="${k}" ${f[k]?'checked':''}> ${label}</label>`).join('')}</div><div class="pm-muted">형광펜 색상</div><div class="pm-palette">${palettes.map(c=>`<button type="button" data-pc-fmt-color="${key}" data-pc-color="${c}" title="${c}" style="background:${c};${(f.color||'').toLowerCase()===c.toLowerCase()?'outline:2px solid #8255ad;outline-offset:2px':''}"></button>`).join('')}</div><div class="pm-row"><input type="color" data-pc-fmt-custom="${key}" value="${pcSafeColor(f.color,key==='=='?'#FFE878':'#D9C5FF')}"><span class="pm-muted">${pcEsc(f.color||'')}</span></div><div class="pm-muted">미리보기: ${preview(key)}</div></div>`};return `<div class="pm-muted">각 일정을 원하는 색으로 자유롭게 꾸밀 수 있어요 ♡</div><div class="pc-event" style="${pcStyle(e)}"><strong style="color:${pcSafeColor(s.titleColor,'#765591')}">${pcEsc(e.emoji||'💌')} ${pcEsc(e.title||'일정 미리보기')}</strong><div class="pm-muted">${pcEsc(e.date||'')} ${pcEsc(pcStatus[e.status]||'')}</div><div>${pcFormat(e.text||'==머리카락 넘기기==',s)}</div></div><label class="pm-label">🎨 일정 카드 색상</label><div class="pc-date-time"><label class="pm-label">배경색<input class="pm-input" type="color" data-pc-style="bg" value="${pcSafeColor(s.bg,'#fff8fe')}"></label><label class="pm-label">글씨색<input class="pm-input" type="color" data-pc-style="fg" value="${pcSafeColor(s.fg,'#34264a')}"></label></div><label class="pm-label">제목줄 색상<input class="pm-input" type="color" data-pc-style="titleColor" value="${pcSafeColor(s.titleColor,'#765591')}"></label><label class="pm-label">이모티콘 선택</label><div class="pc-emoji-list">${pcEmojiChoices().map(x=>`<button type="button" data-pc-emoji="${pcEsc(x)}" class="${e.emoji===x?'active':''}">${pcEsc(x)}</button>`).join('')}</div><div class="pm-row"><input class="pm-input" id="pc-custom-emoji" placeholder="직접 이모티콘 추가 (예: 🪻)"><button type="button" data-pc-action="emoji-add">＋ 추가</button></div><label class="pm-label">🖍️ 텍스트 강조 · 일정별 설정</label><div class="pm-muted">본문에 ==문구== 또는 **문구**를 입력하세요. 두 기호 모두 아래에서 원하는 서식을 복수 선택할 수 있어요.</div>${group('==')}${group('**')}<label class="pm-label">🔎 문구 입력으로 강조</label><div class="pm-row"><input class="pm-input" id="pc-mark-phrase" placeholder="예: 머리카락 넘기기" style="flex:1;min-width:110px"><select class="pm-input" id="pc-mark-kind" style="width:auto"><option value="==">== 설정 사용</option><option value="**">** 설정 사용</option></select><button type="button" data-pc-action="phrase-add">＋ 강조</button></div><div class="pm-muted">본문에 있는 같은 문구를 강조 기호로 감싸요.</div><label class="pm-label">글자 크기 (${Number(s.fontSize)||14}px)<input class="pm-input" type="range" min="11" max="24" data-pc-style="fontSize" value="${Number(s.fontSize)||14}"></label><label class="pm-label">투명도 (${Number(s.opacity)||100}%)<input class="pm-input" type="range" min="30" max="100" data-pc-style="opacity" value="${Number(s.opacity)||100}"></label><label class="pm-label">모서리<input class="pm-input" type="range" min="0" max="30" data-pc-style="radius" value="${Number(s.radius)||12}"></label>`}
function pcSafeColor(c,def){return /^#[0-9a-f]{6}$/i.test(c||'')?c:def}
function pcEditor(e){const s=e.style||{};const tab=`<div class="pm-tabs"><button data-pc-etab="content" class="${calEditTab==='content'?'active':''}">💌 내용·분류</button><button data-pc-etab="style" class="${calEditTab==='style'?'active':''}">🎨 꾸미기</button><button data-pc-etab="settings" class="${calEditTab==='settings'?'active':''}">🔒 설정</button></div>`;let fields='';if(calEditTab==='content')fields=`<label class="pm-label">제목</label><input class="pm-input" data-pc-field="title" value="${pcEsc(e.title)}" ${e.locked?'disabled':''}><div class="pc-date-time"><label class="pm-label">날짜<input class="pm-input" type="date" data-pc-field="date" value="${pcEsc(e.date)}" ${e.locked?'disabled':''}></label><label class="pm-label">시간<input class="pm-input" type="time" data-pc-field="time" value="${pcEsc(e.time)}" ${e.locked?'disabled':''}></label></div><label class="pm-label">상세 내용</label><textarea class="pm-input" rows="8" data-pc-field="text" ${e.locked?'disabled':''}>${pcEsc(e.text)}</textarea><label class="pm-label">분류</label><input class="pm-input" data-pc-field="category" value="${pcEsc(e.category)}" placeholder="결혼식, 약속, 사건 등"><label class="pm-label">태그 (쉼표 구분)</label><input class="pm-input" data-pc-field="tags" value="${pcEsc((e.tags||[]).join(', '))}"><label class="pm-label">시간선</label><select class="pm-input" data-pc-field="timeline">${cal.timelines.map(t=>`<option value="${pcEsc(t.id)}" ${t.id===e.timeline?'selected':''}>${pcEsc(t.name)}</option>`).join('')}</select><label class="pm-label">진행 상태</label><select class="pm-input" data-pc-field="status">${Object.entries(pcStatus).map(([k,v])=>`<option value="${k}" ${e.status===k?'selected':''}>${v}</option>`).join('')}</select>`;
if(calEditTab==='style')fields=pcDecorationFields(e);

if(calEditTab==='settings')fields=`<div class="pc-setting-card"><label class="pc-setting-row">🔒 일정 수정 잠금 <input type="checkbox" data-pc-field="locked" ${e.locked?'checked':''}></label><label class="pc-setting-row">📌 일정 고정 <input type="checkbox" data-pc-field="pinned" ${e.pinned?'checked':''}></label><label class="pc-setting-row">👁️ 달력에서 일정 숨기기 <input type="checkbox" data-pc-field="hidden" ${e.hidden?'checked':''}></label><label class="pc-setting-row">📅 위젯에서 일정 숨기기 <input type="checkbox" data-pc-field="widgetHidden" ${e.widgetHidden?'checked':''}></label></div><div class="pm-muted">잠금 상태에서는 일정 수정이 제한돼요. 잠금 해제는 여기서 할 수 있어요.</div><div class="pc-setting-card"><b>🎀 달력 위젯 공통 설정</b><label class="pc-setting-row">📅 메모 위젯 안에 달력 탭 표시 <input type="checkbox" id="pc-widget-enabled" ${cal.settings.widgetInMemo?'checked':''}></label><label class="pc-setting-row">🪟 별도 달력 위젯도 표시 (선택) <input type="checkbox" id="pc-widget-independent" ${cal.settings.widgetSeparate?'checked':''}></label><label class="pc-setting-row">🎀 리본처럼 접힌 상태로 시작 <input type="checkbox" id="pc-widget-folded" ${cal.settings.widgetFolded?'checked':''}></label><label class="pc-setting-row">🔑 위젯 위치·크기 잠금 <input type="checkbox" id="pc-widget-poslocked" ${cal.settings.widgetPositionLocked?'checked':''}></label></div>`;
return `<div class="pm-editor"><div class="pm-row space"><b>🎀 일정 편집</b><button data-pc-action="back">← 달력</button></div>${tab}${fields}<div class="pm-row"><button data-pc-action="save">💾 저장</button></div></div>`}
function renderCalendar(){panel.innerHTML=`<div class="pm-titlebar"><div class="pm-row space"><b class="pm-brand">🎀 포켓 메모</b><button data-pc-action="close">닫기 ×</button></div><div class="pm-muted">나만의 작은 기록장 ♡ · 자동 저장</div><div class="pm-lace">✿ ୨୧ ✿ ୨୧ ✿</div></div><div class="pc-switch"><button data-pc-tab="memo">💌 메모</button><button class="active" data-pc-tab="calendar">📅 달력</button><button data-pc-tab="checklist">☑️ 체크</button></div><div class="pm-row space"><select class="pm-input" id="pc-timeline">${cal.timelines.map(t=>`<option value="${pcEsc(t.id)}" ${calTimeline===t.id?'selected':''}>${pcEsc(t.name)}</option>`).join('')}</select><button data-pc-action="timeline-add">＋ 시간선</button><button data-pc-action="timeline-rename">이름 변경</button></div>${pcTimelineChips()}${calEdit?pcEditor(cal.events.find(e=>e.id===calEdit)||{}):`<div class="pm-row space"><button data-pc-action="prev">‹ 이전</button><b>${pcEsc(calMonth)} </b><button data-pc-action="next">다음 ›</button></div>${pcCalendarBody()}<div class="pm-row space"><b>📅 ${pcEsc(calDate)}</b><button data-pc-action="new">＋ 새 일정</button></div><div class="pm-grid"><input class="pm-input" id="pc-filter" placeholder="🔎 일정·태그 검색" value="${pcEsc(calFilter)}"><select class="pm-input" id="pc-view"><option value="day" ${cal.settings.view!=='list'?'selected':''}>선택 날짜</option><option value="list" ${cal.settings.view==='list'?'selected':''}>시간선 전체 목록</option></select></div>${(cal.settings.view==='list'?pcEvents():pcDateEvents(calDate)).filter(e=>(e.title+' '+e.text+' '+(e.tags||[]).join(' ')).toLowerCase().includes(calFilter.toLowerCase())).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||(a.date||'').localeCompare(b.date||'')||(a.time||'').localeCompare(b.time||'')).map(pcEventCard).join('')||'<p class="pm-muted">등록된 일정이 없어요. (미기록)</p>'}<div class="pm-row"><button data-pc-action="compare">🔀 같은 날짜 비교</button><label class="pc-widget-toggle"><input type="checkbox" id="pc-widget-enabled" ${cal.settings.widgetShown?'checked':''}> 📅 메모 위젯 안에 달력 탭 표시</label><label class="pc-widget-toggle"><input type="checkbox" id="pc-widget-independent" ${cal.settings.widgetSeparate?'checked':''}> 별도 달력 위젯도 표시</label><button data-pc-action="backup">⬇ 달력 백업</button><button data-pc-action="restore">⬆ 달력 복원</button></div><div class="pm-row"><label class="pm-label">시작 요일 <select id="pc-weekstart" class="pm-input"><option value="0" ${!cal.settings.weekStart?'selected':''}>일요일</option><option value="1" ${cal.settings.weekStart===1?'selected':''}>월요일</option></select></label></div>`}<input type="file" id="pc-import" accept=".json,application/json" hidden>`;bindCalendar()}
function pcNew(){return {id:uid(),timeline:calTimeline,title:'',date:calDate,time:'',text:'',category:'',tags:[],emoji:'💌',status:'planned',style:{bg:'#fff8fe',fg:'#34264a',fontSize:14,opacity:100,radius:12},locked:false,pinned:false}}
function pcExport(){const backup={format:'pocket-story-calendar-backup',version:2,roomId:current,exportedAt:new Date().toISOString(),data:cal};const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='PocketStoryCalendar-'+current.slice(0,20)+'-'+pcToday()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function pcCompare(){const msg=cal.timelines.map(t=>{const ev=cal.events.filter(e=>e.timeline===t.id&&e.date===calDate);return t.name+'\n'+(ev.length?ev.map(e=>'• '+(e.title||'제목 없음')+' ['+(pcStatus[e.status]||'미정')+']').join('\n'):'미기록')}).join('\n\n');alert(calDate+' 시간선 비교\n\n'+msg)}
function bindCalendar(){panel.querySelectorAll('[data-pc-tab]').forEach(b=>b.onclick=()=>{calendarTab=b.dataset.pcTab;renderPanel()});panel.querySelectorAll('[data-pc-timeline]').forEach(b=>b.onclick=()=>{calTimeline=b.dataset.pcTimeline;renderPanel();pcRenderWidget()});panel.querySelectorAll('[data-pc-emoji]').forEach(b=>b.onclick=()=>{const e=cal.events.find(x=>x.id===calEdit);if(!e||e.locked)return;e.emoji=b.dataset.pcEmoji;calSave();renderPanel()});panel.querySelectorAll('[data-pc-day]').forEach(b=>b.onclick=()=>{calDate=b.dataset.pcDay;renderPanel()});panel.querySelectorAll('[data-pc-edit]').forEach(b=>b.onclick=()=>{calEdit=b.dataset.pcEdit;calEditTab='content';renderPanel()});panel.querySelectorAll('[data-pc-copy]').forEach(b=>b.onclick=()=>{const e=cal.events.find(x=>x.id===b.dataset.pcCopy);if(!e)return;cal.events.push({...JSON.parse(JSON.stringify(e)),id:uid(),title:e.title+' (복사)',locked:false});calSave();renderPanel()});panel.querySelectorAll('[data-pc-delete]').forEach(b=>b.onclick=()=>{const e=cal.events.find(x=>x.id===b.dataset.pcDelete);if(!e||!confirm('이 일정을 삭제할까요?'))return;cal.events=cal.events.filter(x=>x.id!==e.id);calSave();renderPanel()});panel.querySelectorAll('[data-pc-etab]').forEach(b=>b.onclick=()=>{calEditTab=b.dataset.pcEtab;renderPanel()});panel.querySelectorAll('[data-pc-field]').forEach(el=>{el.onchange=()=>{const e=cal.events.find(x=>x.id===calEdit);if(!e)return;const f=el.dataset.pcField;if(e.locked&&f!=='locked')return;if(f==='tags')e.tags=el.value.split(',').map(x=>x.trim()).filter(Boolean);else if(['locked','pinned','hidden','widgetHidden'].includes(f))e[f]=el.checked;else e[f]=el.value;calSave();pcRenderWidget()}});panel.querySelectorAll('[data-pc-fmt]').forEach(el=>el.onchange=()=>{const e=cal.events.find(x=>x.id===calEdit);if(!e||e.locked)return;e.style=e.style||{};e.style.formats=e.style.formats||{};const k=el.dataset.pcFmt;const f=e.style.formats[k]||(e.style.formats[k]={highlight:k==='==',bold:k==='**',underline:false,color:k==='=='?'#FFE878':'#D9C5FF'});f[el.dataset.pcFmtKey]=el.checked;calSave();renderPanel()});panel.querySelectorAll('[data-pc-fmt-color],[data-pc-fmt-custom]').forEach(el=>{const fn=()=>{const e=cal.events.find(x=>x.id===calEdit);if(!e||e.locked)return;e.style=e.style||{};e.style.formats=e.style.formats||{};const k=el.dataset.pcFmtColor||el.dataset.pcFmtCustom;const f=e.style.formats[k]||(e.style.formats[k]={highlight:k==='==',bold:k==='**',underline:false});f.color=el.dataset.pcColor||el.value;calSave();renderPanel()};el.addEventListener('click',()=>{if(el.dataset.pcFmtColor)fn()});if(el.dataset.pcFmtCustom)el.addEventListener('change',fn)});panel.querySelectorAll('[data-pc-style]').forEach(el=>el.onchange=()=>{const e=cal.events.find(x=>x.id===calEdit);if(!e||e.locked)return;e.style=e.style||{};e.style[el.dataset.pcStyle]=el.value;calSave();renderPanel()});panel.querySelectorAll('[data-pc-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.pcAction;if(a==='close'){panelOpen=false;renderPanel()}else if(a==='back'){calEdit='';renderPanel()}else if(a==='save'){calEdit='';calSave();renderPanel()}else if(a==='new'){const e=pcNew();cal.events.push(e);calEdit=e.id;calEditTab='content';calSave();renderPanel()}else if(a==='prev'||a==='next'){const [y,m]=calMonth.split('-').map(Number);const d=new Date(y,m-1+(a==='next'?1:-1),1);calMonth=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');calDate=calMonth+'-01';renderPanel()}else if(a==='timeline-add'){const name=prompt('새 시간선 이름 (예: 1차 회귀)');if(!name?.trim())return;const t={id:uid(),name:name.trim()};cal.timelines.push(t);calTimeline=t.id;calSave();pcRenderWidget();renderPanel()}else if(a==='timeline-rename'){const t=cal.timelines.find(x=>x.id===calTimeline);if(!t)return;const name=prompt('시간선 이름 변경',t.name);if(!name?.trim())return;t.name=name.trim();calSave();renderPanel()}else if(a==='phrase-add'){const e=cal.events.find(x=>x.id===calEdit);const phrase=panel.querySelector('#pc-mark-phrase')?.value.trim();const kind=panel.querySelector('#pc-mark-kind')?.value||'==';if(!e||e.locked||!phrase)return;const body=e.text||'';if(!body.includes(phrase)){alert('상세 내용에 해당 문구가 없습니다.');return}e.text=body.split(phrase).join(kind+phrase+kind);calSave();renderPanel()}else if(a==='emoji-add'){const v=panel.querySelector('#pc-custom-emoji')?.value.trim();if(!v)return;cal.settings.customEmojis=cal.settings.customEmojis||[];if(!cal.settings.customEmojis.includes(v))cal.settings.customEmojis.push(v);const e=cal.events.find(x=>x.id===calEdit);if(e&&!e.locked)e.emoji=v;calSave();renderPanel()}else if(a==='widget'){cal.settings.widgetShown=!cal.settings.widgetShown;calSave();renderWidgets();pcRenderWidget();renderPanel()}else if(a==='compare')pcCompare();else if(a==='backup')pcExport();else if(a==='restore')panel.querySelector('#pc-import').click()});const sel=panel.querySelector('#pc-timeline');if(sel)sel.onchange=()=>{calTimeline=sel.value;renderPanel()};const view=panel.querySelector('#pc-view');if(view)view.onchange=()=>{cal.settings.view=view.value;calSave();renderPanel()};const start=panel.querySelector('#pc-weekstart');if(start)start.onchange=()=>{cal.settings.weekStart=Number(start.value);calSave();renderPanel()};const f=panel.querySelector('#pc-filter');if(f)f.onchange=()=>{calFilter=f.value;renderPanel()};const foldInput=panel.querySelector('#pc-widget-folded');if(foldInput)foldInput.onchange=()=>{cal.settings.widgetFolded=foldInput.checked;calSave();pcRenderWidget()};const lockInput=panel.querySelector('#pc-widget-poslocked');if(lockInput)lockInput.onchange=()=>{cal.settings.widgetPositionLocked=lockInput.checked;calSave();pcRenderWidget()};const wEnabled=panel.querySelector('#pc-widget-enabled');if(wEnabled)wEnabled.onchange=()=>{cal.settings.widgetInMemo=wEnabled.checked;cal.settings.widgetShown=!!(cal.settings.widgetInMemo||cal.settings.widgetSeparate);calSave();renderWidgets();pcRenderWidget();renderPanel()};const wIndependent=panel.querySelector('#pc-widget-independent');if(wIndependent)wIndependent.onchange=()=>{cal.settings.widgetSeparate=wIndependent.checked;cal.settings.widgetShown=!!(cal.settings.widgetInMemo||cal.settings.widgetSeparate);calSave();renderWidgets();pcRenderWidget();renderPanel()};const imp=panel.querySelector('#pc-import');if(imp)imp.onchange=async()=>{const file=imp.files?.[0];if(!file)return;try{const x=JSON.parse(await file.text());if(x.format!=='pocket-story-calendar-backup'||!Array.isArray(x.data?.events)||!Array.isArray(x.data?.timelines))throw Error('달력 백업 파일이 아닙니다');if(x.roomId!==current&&!confirm('다른 채팅방에서 만든 백업입니다. 현재 방에 복원할까요?'))return;if(!confirm('현재 방의 달력 데이터를 백업 내용으로 교체합니다. 계속할까요?'))return;cal=x.data;calTimeline=cal.timelines[0]?.id||'original';calSave();renderPanel()}catch(e){alert('복원 실패: '+e.message)}}}

// Checklist: room-local, with independent or event-linked lists.
function pmCheckLists(){return checklist.lists.filter(x=>x.timeline===checklistTimeline)}
let checkEditorTab='content',checkCreating=false,checkEditingItem=-1,checkEditingTitle=false,checkCustomEmojis=[],checkItemEmojiPicker=false,checkContentDecorOpen=false;
const checkEmojiBase=['💌','🎀','🌷','💍','💜','💕','🦋','🌙','⭐','🎂','🎁','📖','📍','🗓️','🕊️','🥀','🌸','🧸','🍀','☕','✈️','🏠','💐','✨','🔎','🏥','📜','⚖️','🗝️'];
const checkFmtDefaults=()=>({'==':{highlight:true,bold:false,underline:false,color:'#FFE878'},'**':{highlight:false,bold:true,underline:false,color:'#D9C5FF'}});
function checkFormats(l){return {'==':{...checkFmtDefaults()['=='],...(l.formats?.['==']||{})},'**':{...checkFmtDefaults()['**'],...(l.formats?.['**']||{})}}}
function checkFormatText(text,l){const formats=checkFormats(l);return pcEsc(text).replace(/(==|\*\*)([^\n]+?)\1/g,(_,key,content)=>{const f=formats[key];let css='';if(f.highlight)css+='background:'+pcSafeColor(f.color,'#FFE878')+';';if(f.bold)css+='font-weight:700;';if(f.underline)css+='text-decoration:underline;text-underline-offset:2px;';return '<span style="'+css+'">'+content+'</span>'})}
function checkSelected(){return pmCheckLists().find(x=>x.id===checklistSelected)||pmCheckLists()[0]}
function pmCheckItemHtml(l){return (l.items||[]).map((it,i)=>`<div class="pm-check-item"><label><input type="checkbox" data-check-toggle="${pcEsc(l.id)}" data-check-index="${i}" ${it.done?'checked':''} ${l.locked?'disabled':''}> <span class="${it.done?'pm-check-done':''}">${it.emoji?pcEsc(it.emoji)+' ':''}${checkFormatText(it.text,l)}</span></label>${!l.locked?`<button type="button" data-check-edit-item="${i}" title="수정">✏️</button><button type="button" data-check-remove="${pcEsc(l.id)}" data-check-index="${i}" title="삭제">×</button>`:''}</div>${checkEditingItem===i&&!l.locked?`<div class="pm-check-item-editor"><div class="pm-row"><input class="pm-input pm-check-new-input" data-check-edit-value value="${pcEsc(it.text)}"><button data-check-action="save-item">저장</button><button data-check-action="cancel-item">취소</button></div><div class="pm-row"><button type="button" data-check-action="toggle-item-emoji">${it.emoji?pcEsc(it.emoji):'😀'} 항목 이모티콘 ${checkItemEmojiPicker?'▴':'▾'}</button>${it.emoji?'<button type="button" data-check-action="clear-item-emoji">이모티콘 제거</button>':''}</div>${checkItemEmojiPicker?`<div class="pc-emoji-list">${[...new Set([...checkEmojiBase,...checkCustomEmojis])].map(e=>`<button type="button" data-check-item-emoji="${pcEsc(e)}" class="${it.emoji===e?'active':''}">${pcEsc(e)}</button>`).join('')}</div><div class="pm-row"><input class="pm-input pm-check-new-input" data-check-item-custom-emoji placeholder="직접 이모티콘 추가 (예: 🧳)"><button type="button" data-check-action="add-item-emoji">＋ 추가</button></div>`:''}</div>`:''}`).join('')||'<div class="pm-muted">아직 항목이 없어요.</div>'}
function checkDecorHtml(l){const fm=checkFormats(l),pal=['#FFE878','#FFC0D5','#D9C5FF','#B9EBD5','#B9DEFF','#FFD4B2'];const fmtHtml=key=>{const f=fm[key];return `<div class="pm-format-group"><b>${key} 기호</b><div class="pm-row">${[['highlight','🖍️ 형광펜'],['bold','굵게'],['underline','밑줄']].map(([k,label])=>`<label class="pm-format-check"><input type="checkbox" data-check-format="${key}" data-check-prop="${k}" ${f[k]?'checked':''} ${l.locked?'disabled':''}> ${label}</label>`).join('')}</div><div class="pm-palette">${pal.map(c=>`<button type="button" data-check-color="${key}" data-check-color-value="${c}" style="background:${c};${f.color===c?'outline:2px solid #8255ad;outline-offset:2px':''}" ${l.locked?'disabled':''}></button>`).join('')}</div><label class="pm-label">형광펜 색상 <input type="color" data-check-custom-color="${key}" value="${pcSafeColor(f.color,'#FFE878')}" ${l.locked?'disabled':''}></label><div class="pm-muted">미리보기: ${checkFormatText(key+'머리카락 넘기기'+key,l)}</div></div>`};return `<label class="pm-label">이모티콘 선택</label><div class="pc-emoji-list">${[...new Set([...checkEmojiBase,...checkCustomEmojis])].map(e=>`<button type="button" data-check-emoji="${pcEsc(e)}" class="${l.emoji===e?'active':''}" ${l.locked?'disabled':''}>${pcEsc(e)}</button>`).join('')}</div><div class="pm-row"><input class="pm-input pm-check-new-input" data-check-custom-emoji placeholder="직접 이모티콘 추가 (예: 🪻)" ${l.locked?'disabled':''}><button data-check-action="add-emoji" ${l.locked?'disabled':''}>＋ 추가</button></div><label class="pm-label">🖍️ 텍스트 강조 · 목록별 설정</label><div class="pm-muted">항목에 ==문구== 또는 **문구**를 입력하면 선택한 강조 효과가 적용돼요.</div>${fmtHtml('==')}${fmtHtml('**')}<label class="pm-label">🔎 문구 입력으로 강조</label><div class="pm-row"><input class="pm-input pm-check-new-input" data-check-phrase placeholder="예: 목격자 진술" ${l.locked?'disabled':''}><select class="pm-input" data-check-phrase-kind style="width:auto"><option value="==">== 설정 사용</option><option value="**">** 설정 사용</option></select><button data-check-action="mark-phrase" ${l.locked?'disabled':''}>＋ 강조</button></div><div class="pm-muted">해당 목록의 항목에 포함된 같은 문구를 강조해요.</div>`}
function pmChecklistHtml(widget=false){
 const lists=pmCheckLists().filter(x=>(!widget||!x.widgetHidden)&&(!checklistFilter||(x.title+' '+(x.items||[]).map(i=>i.text).join(' ')).toLowerCase().includes(checklistFilter.toLowerCase()))).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned));
 const selected=lists.find(x=>x.id===checklistSelected)||lists[0];
 if(!cal.timelines.some(t=>t.id===checklistTimeline))checklistTimeline=cal.timelines[0]?.id||'original';
 const timelines=cal.timelines.map(t=>`<option value="${pcEsc(t.id)}" ${t.id===checklistTimeline?'selected':''}>${pcEsc(t.name)}</option>`).join('');
 const options=cal.events.filter(e=>e.timeline===checklistTimeline).map(e=>`<option value="${pcEsc(e.id)}" ${selected?.eventId===e.id?'selected':''}>${pcEsc(e.date+' · '+(e.title||'제목 없음'))}</option>`).join('');
 const done=selected?(selected.items||[]).filter(x=>x.done).length:0,total=selected?.items?.length||0;
 return `<div class="pm-row space"><b>☑️ 체크리스트</b><button type="button" data-check-action="new">＋ 새 목록</button></div>
 ${checkCreating?`<div class="pm-card"><label class="pm-label">새 체크리스트 이름</label><input class="pm-input" data-check-new-title placeholder="예: 실종 사건, 여행 준비"><div class="pm-row"><button data-check-action="save-new">💾 만들기</button><button data-check-action="cancel-new">취소</button></div></div>`:''}
 ${widget?'':`<div class="pm-row"><button type="button" data-check-action="backup">⬇ 체크리스트 백업</button><button type="button" data-check-action="restore">⬆ 체크리스트 복원</button><input type="file" accept=".json,application/json" data-check-import hidden></div>`}
 <label class="pm-label">시간선</label><select class="pm-input" data-check-timeline style="appearance:auto;-webkit-appearance:menulist;cursor:pointer;padding-right:28px">${timelines}</select><div class="pm-muted">📅 달력에 등록된 시간선 중 선택 · 시간선별 체크리스트 분리</div>
 ${widget?'':`<input class="pm-input" data-check-search placeholder="🔎 목록·항목 검색" value="${pcEsc(checklistFilter)}">`}
 <div class="pm-check-listbar">${lists.map(x=>`<button type="button" class="${x.id===selected?.id?'active':''}" data-check-select="${pcEsc(x.id)}">${pcEsc(x.emoji||'☑️')} ${pcEsc(x.title)}</button>`).join('')||'<span class="pm-muted">등록된 목록이 없어요.</span>'}</div>
 ${selected?`<div class="pm-card"><div class="pm-row space"><b>${pcEsc(selected.emoji||'☑️')} ${pcEsc(selected.title)}</b><span class="pm-muted">${done}/${total} 완료</span></div><div class="pm-check-progress"><div style="width:${total?done/total*100:0}%"></div></div>
 <div class="pm-muted">${selected.eventId?'📅 '+pcEsc(cal.events.find(e=>e.id===selected.eventId)?.title||'연결된 일정 없음'):'📝 독립형 체크리스트'}</div>
 ${widget?'':`<div class="pm-tabs"><button data-check-tab="content" class="${checkEditorTab==='content'?'active':''}">💌 내용·분류</button><button data-check-tab="style" class="${checkEditorTab==='style'?'active':''}">🎨 꾸미기</button><button data-check-tab="settings" class="${checkEditorTab==='settings'?'active':''}">🔐 설정</button></div>`}
 ${widget||checkEditorTab==='content'?`${pmCheckItemHtml(selected)}${!selected.locked?`<div class="pm-row"><input class="pm-input pm-check-new-input" data-check-new-input placeholder="새 항목 입력"><button type="button" data-check-action="add-item">＋ 추가</button></div>`:''}
 ${widget?'':`<div class="pm-row"><button type="button" data-check-action="toggle-content-decor" aria-expanded="${checkContentDecorOpen?'true':'false'}">🎨 이모티콘 · 텍스트 꾸미기 ${checkContentDecorOpen?'▴':'▾'}</button></div>${checkContentDecorOpen?`<div class="pm-check-inline-decor">${checkDecorHtml(selected)}</div>`:''}<label class="pm-label">달력 일정 연결 (선택)</label><select class="pm-input" data-check-event ${selected.locked?'disabled':''}><option value="">연결하지 않음</option>${options}</select><div class="pm-row"><button data-check-action="edit-title" ${selected.locked?'disabled':''}>✏️ 목록 이름</button><button data-check-action="delete">🗑️ 목록 삭제</button></div>${checkEditingTitle?`<div class="pm-row"><input class="pm-input pm-check-new-input" data-check-title-value value="${pcEsc(selected.title)}"><button data-check-action="save-title">저장</button><button data-check-action="cancel-title">취소</button></div>`:''}`}`:''}
 ${!widget&&checkEditorTab==='style'?checkDecorHtml(selected):''}
 ${!widget&&checkEditorTab==='settings'?`<label class="pm-switch">🔒 목록 수정 잠금 <input type="checkbox" data-check-setting="locked" ${selected.locked?'checked':''}></label><label class="pm-switch">📌 목록 상단 고정 <input type="checkbox" data-check-setting="pinned" ${selected.pinned?'checked':''}></label><label class="pm-switch">🙈 위젯에서 이 목록 숨기기 <input type="checkbox" data-check-setting="widgetHidden" ${selected.widgetHidden?'checked':''}></label><hr class="pm-separator"><b>🎀 체크리스트 위젯 공통 설정</b><label class="pm-switch">☑️ 메모 위젯 안에 체크 탭 표시 <input type="checkbox" data-check-global="inMemo" ${checklist.settings?.inMemo!==false?'checked':''}></label><label class="pm-switch">📋 별도 체크리스트 위젯 표시 (선택) <input type="checkbox" data-check-global="separate" ${checklist.settings?.separate?'checked':''}></label><label class="pm-switch">🎀 별도 위젯을 접힌 상태로 시작 <input type="checkbox" data-check-global="folded" ${checklist.settings?.folded?'checked':''}></label><label class="pm-switch">🔑 별도 위젯 위치·크기 잠금 <input type="checkbox" data-check-global="positionLocked" ${checklist.settings?.positionLocked?'checked':''}></label><div class="pm-muted">체크리스트를 숨겨도 저장된 목록은 삭제되지 않아요.</div>`:''}</div>`:''}
 ${widget?'<button type="button" data-check-action="open">체크리스트 관리 열기</button>':''}`;
}
function pmBindChecklist(host,widget=false){
 const repaint=()=>{if(widget){host.innerHTML=pmChecklistHtml(true);pmBindChecklist(host,true)}else renderPanel()};
 const chosen=()=>checkSelected();
 const timeline=host.querySelector('[data-check-timeline]');if(timeline)timeline.onchange=()=>{checklistTimeline=timeline.value;checklistSelected='';repaint()};
 const search=host.querySelector('[data-check-search]');if(search)search.oninput=()=>{checklistFilter=search.value;repaint();host.querySelector('[data-check-search]')?.focus()};
 host.querySelectorAll('[data-check-select]').forEach(b=>b.onclick=()=>{checklistSelected=b.dataset.checkSelect;checkEditingItem=-1;checkItemEmojiPicker=false;checkEditorTab='content';repaint()});
 host.querySelectorAll('[data-check-tab]').forEach(b=>b.onclick=()=>{checkEditorTab=b.dataset.checkTab;repaint()});
 host.querySelectorAll('[data-check-toggle]').forEach(b=>b.onchange=()=>{const l=checklist.lists.find(x=>x.id===b.dataset.checkToggle);const item=l?.items?.[Number(b.dataset.checkIndex)];if(!item||l.locked)return;item.done=b.checked;checkSave();repaint()});
 host.querySelectorAll('[data-check-edit-item]').forEach(b=>b.onclick=()=>{checkEditingItem=Number(b.dataset.checkEditItem);checkItemEmojiPicker=false;repaint();host.querySelector('[data-check-edit-value]')?.focus()});
 host.querySelectorAll('[data-check-remove]').forEach(b=>b.onclick=()=>{const l=checklist.lists.find(x=>x.id===b.dataset.checkRemove);if(!l||l.locked)return;l.items.splice(Number(b.dataset.checkIndex),1);checkSave();repaint()});
 host.querySelectorAll('[data-check-item-emoji]').forEach(b=>b.onclick=()=>{const l=chosen(),it=l?.items?.[checkEditingItem];if(!it||l.locked)return;it.emoji=b.dataset.checkItemEmoji;checkSave();repaint()});
 const event=host.querySelector('[data-check-event]');if(event)event.onchange=()=>{const l=chosen();if(!l||l.locked)return;l.eventId=event.value;checkSave();repaint()};
 host.querySelectorAll('[data-check-setting]').forEach(e=>e.onchange=()=>{const l=chosen();if(!l)return;l[e.dataset.checkSetting]=e.checked;checkSave();repaint()});
 host.querySelectorAll('[data-check-global]').forEach(e=>e.onchange=()=>{checklist.settings=checklist.settings||{};checklist.settings[e.dataset.checkGlobal]=e.checked;checkSave();renderWidgets();checkRenderSeparateWidget();repaint()});
 host.querySelectorAll('[data-check-emoji]').forEach(b=>b.onclick=()=>{const l=chosen();if(!l||l.locked)return;l.emoji=b.dataset.checkEmoji;checkSave();repaint()});
 host.querySelectorAll('[data-check-format]').forEach(e=>e.onchange=()=>{const l=chosen();if(!l||l.locked)return;l.formats=checkFormats(l);l.formats[e.dataset.checkFormat][e.dataset.checkProp]=e.checked;checkSave();repaint()});
 host.querySelectorAll('[data-check-color]').forEach(e=>e.onclick=()=>{const l=chosen();if(!l||l.locked)return;l.formats=checkFormats(l);l.formats[e.dataset.checkColor].color=e.dataset.checkColorValue;checkSave();repaint()});
 host.querySelectorAll('[data-check-custom-color]').forEach(e=>e.oninput=()=>{const l=chosen();if(!l||l.locked)return;l.formats=checkFormats(l);l.formats[e.dataset.checkCustomColor].color=e.value;checkSave()});
 host.querySelectorAll('[data-check-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.checkAction,l=chosen();
 if(a==='toggle-content-decor'){checkContentDecorOpen=!checkContentDecorOpen;repaint()}
 else if(a==='new'){checkCreating=true;repaint();host.querySelector('[data-check-new-title]')?.focus()}
 else if(a==='cancel-new'){checkCreating=false;repaint()}
 else if(a==='save-new'){const v=host.querySelector('[data-check-new-title]')?.value.trim();if(!v)return;const x={id:uid(),title:v,emoji:'☑️',timeline:checklistTimeline,eventId:'',items:[],formats:checkFmtDefaults()};checklist.lists.push(x);checklistSelected=x.id;checkCreating=false;checkEditorTab='content';checkSave();repaint()}
 else if(a==='add-item'){const input=host.querySelector('[data-check-new-input]');const v=input?.value.trim();if(!l||l.locked||!v)return;l.items.push({id:uid(),text:v,done:false});checkSave();repaint()}
 else if(a==='toggle-item-emoji'){checkItemEmojiPicker=!checkItemEmojiPicker;repaint()}
 else if(a==='clear-item-emoji'){const it=l?.items?.[checkEditingItem];if(!it||l.locked)return;delete it.emoji;checkSave();repaint()}
 else if(a==='add-item-emoji'){const v=host.querySelector('[data-check-item-custom-emoji]')?.value.trim(),it=l?.items?.[checkEditingItem];if(!v||!it||l.locked)return;checkCustomEmojis=[...new Set([...checkCustomEmojis,v])];checklist.customEmojis=checkCustomEmojis;it.emoji=v;checkSave();repaint()}
 else if(a==='save-item'){const v=host.querySelector('[data-check-edit-value]')?.value.trim();if(!l||l.locked||!v||!l.items[checkEditingItem])return;l.items[checkEditingItem].text=v;checkEditingItem=-1;checkItemEmojiPicker=false;checkSave();repaint()}
 else if(a==='cancel-item'){checkEditingItem=-1;checkItemEmojiPicker=false;repaint()}
 else if(a==='edit-title'){checkEditingTitle=true;repaint()}
 else if(a==='save-title'){const v=host.querySelector('[data-check-title-value]')?.value.trim();if(!l||l.locked||!v)return;l.title=v;checkEditingTitle=false;checkSave();repaint()}
 else if(a==='cancel-title'){checkEditingTitle=false;repaint()}
 else if(a==='delete'){if(!l||l.locked||!confirm('이 체크리스트를 삭제할까요?'))return;checklist.lists=checklist.lists.filter(x=>x.id!==l.id);checklistSelected='';checkSave();repaint()}
 else if(a==='add-emoji'){const v=host.querySelector('[data-check-custom-emoji]')?.value.trim();if(!v||!l||l.locked)return;checkCustomEmojis=[...new Set([...checkCustomEmojis,v])];checklist.customEmojis=checkCustomEmojis;l.emoji=v;checkSave();repaint()}
 else if(a==='mark-phrase'){const phrase=host.querySelector('[data-check-phrase]')?.value.trim();const kind=host.querySelector('[data-check-phrase-kind]')?.value;if(!phrase||!l||l.locked)return;let count=0;for(const it of l.items){if(it.text.includes(phrase)&&!it.text.includes(kind+phrase+kind)){it.text=it.text.split(phrase).join(kind+phrase+kind);count++}}if(!count){alert('일치하는 문구가 없거나 이미 강조되어 있어요.');return}checkSave();repaint()}
 else if(a==='backup'){const blob=new Blob([JSON.stringify({format:'pocket-checklist-backup',version:1,roomId:current,data:checklist},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='PocketChecklist-'+current.slice(0,20)+'-'+pcToday()+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
 else if(a==='restore'){host.querySelector('[data-check-import]')?.click()}
 else if(a==='open'){calendarTab='checklist';panelOpen=true;renderPanel()}
 });
 const file=host.querySelector('[data-check-import]');if(file)file.onchange=async()=>{const f=file.files?.[0];if(!f)return;try{const v=JSON.parse(await f.text());if(v.format!=='pocket-checklist-backup'||!Array.isArray(v.data?.lists))throw Error('형식 오류');if(!confirm('현재 체크리스트를 백업 파일 내용으로 교체할까요? 먼저 현재 목록을 백업해 주세요.'))return;checklist=v.data;checklistSelected='';checkSave();repaint()}catch(e){alert('올바른 체크리스트 백업 파일이 아니에요.')}};
 for(const [selector,action] of [['[data-check-new-input]','add-item'],['[data-check-new-title]','save-new'],['[data-check-edit-value]','save-item'],['[data-check-title-value]','save-title']]){const el=host.querySelector(selector);if(el)el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();host.querySelector('[data-check-action="'+action+'"]')?.click()}}}
}
function renderChecklist(){panel.innerHTML=`<div class="pm-titlebar"><div class="pm-row space"><b class="pm-brand">🎀 포켓 메모</b><button type="button" data-check-close>닫기 ×</button></div><div class="pm-muted">나만의 작은 기록장 ♡ · 자동 저장</div></div><div class="pc-switch"><button type="button" data-pc-tab="memo">💌 메모</button><button type="button" data-pc-tab="calendar">📅 달력</button><button type="button" class="active" data-pc-tab="checklist">☑️ 체크</button></div>${pmChecklistHtml(false)}`;panel.querySelector('[data-check-close]').onclick=()=>{panelOpen=false;renderPanel()};panel.querySelectorAll('[data-pc-tab]').forEach(b=>b.onclick=()=>{calendarTab=b.dataset.pcTab;renderPanel()});pmBindChecklist(panel,false)}
function checkRenderSeparateWidget(){let el=document.getElementById('pm-check-separate');if(!current||!checklist.settings?.separate){el?.remove();return}if(!el){el=document.createElement('section');el.id='pm-check-separate';document.body.appendChild(el)}const folded=!!checklist.settings.folded;el.className='pm-check-separate-widget';el.style.cssText='position:fixed;left:'+(checklist.settings.x??24)+'px;top:'+(checklist.settings.y??160)+'px;width:'+(folded?'48px':(checklist.settings.width??300)+'px')+';height:'+(folded?'48px':(checklist.settings.height??350)+'px')+';z-index:2147483002;background:#fffafd;border:1px solid #d8c3ed;border-radius:15px;box-shadow:0 6px 25px #0003;overflow:auto;padding:10px;';el.innerHTML=folded?'<button type="button" data-check-unfold>☑️</button>':'<div class="pm-row space"><b>☑️ 체크리스트</b><button type="button" data-check-fold>🎀 접기</button></div><div data-check-separate-body>'+pmChecklistHtml(true)+'</div><div data-check-resize style="height:14px;cursor:nwse-resize;text-align:right">◢</div>';
 const fold=el.querySelector('[data-check-fold],[data-check-unfold]');if(fold)fold.onclick=()=>{checklist.settings.folded=!folded;checkSave();checkRenderSeparateWidget()};const body=el.querySelector('[data-check-separate-body]');if(body)pmBindChecklist(body,true);
 if(!checklist.settings.positionLocked){const head=el.querySelector('b');if(head){head.style.cursor='move';head.onpointerdown=e=>{if(e.button!==0)return;const x=e.clientX,y=e.clientY,l=el.offsetLeft,t=el.offsetTop;head.setPointerCapture(e.pointerId);head.onpointermove=ev=>{el.style.left=Math.max(0,l+ev.clientX-x)+'px';el.style.top=Math.max(0,t+ev.clientY-y)+'px'};head.onpointerup=()=>{head.onpointermove=null;checklist.settings.x=el.offsetLeft;checklist.settings.y=el.offsetTop;checkSave()}}}const grip=el.querySelector('[data-check-resize]');if(grip)grip.onpointerdown=e=>{const x=e.clientX,y=e.clientY,w=el.offsetWidth,h=el.offsetHeight;grip.setPointerCapture(e.pointerId);grip.onpointermove=ev=>{el.style.width=Math.max(220,w+ev.clientX-x)+'px';el.style.height=Math.max(180,h+ev.clientY-y)+'px'};grip.onpointerup=()=>{grip.onpointermove=null;checklist.settings.width=el.offsetWidth;checklist.settings.height=el.offsetHeight;checkSave()}}}
}

function pcRenderWidget(){
 let el=document.getElementById('pc-calendar-widget');
 const settings=cal.settings||{};
 // A companion calendar follows the visibility of the original memo widget.
 const memoVisible=!!widgets.querySelector('.pm-widget:not([hidden])');
 if(!settings.widgetShown||!current||!settings.widgetSeparate){if(el)el.remove();return}
 if(!el){el=document.createElement('section');el.id='pc-calendar-widget';document.body.appendChild(el)}
 const folded=!!settings.widgetFolded;
 el.classList.toggle('pcw-folded',folded);
 el.classList.toggle('pcw-position-locked',!!settings.widgetPositionLocked);
 const t=cal.timelines.find(x=>x.id===calTimeline);
 const list=pcDateEvents(calDate).filter(e=>!e.widgetHidden&&!e.hidden);
 const timelineTabs=cal.timelines.map(t=>`<button type="button" data-pcw-timeline="${pcEsc(t.id)}" class="${calTimeline===t.id?'active':''}">${pcEsc(t.name)}</button>`).join('');
 const timelineCompare=cal.timelines.map(t=>{const events=cal.events.filter(e=>e.timeline===t.id&&e.date===calDate&&!e.hidden&&!e.widgetHidden);return `<div class="pcw-compare-row"><b>${pcEsc(t.name)}</b><span>${events.length?events.map(e=>pcEsc((e.emoji||'💌')+' '+(e.title||'제목 없음')+' · '+(pcStatus[e.status]||'미정'))).join('<br>'):'미기록'}</span></div>`}).join('');
 el.innerHTML=`<div class="pcw-head"><b>📅 ${pcEsc(t?.name||'달력')}</b><div class="pcw-actions"><button type="button" id="pcw-fold" title="접기/펼치기">${folded?'📅':'▾'}</button><button type="button" id="pcw-open" title="달력 관리창 열기">${folded?'':'✏️'}</button><button type="button" id="pcw-lock" title="위치·크기 잠금">${settings.widgetPositionLocked?'🔒':'🔓'}</button><button type="button" id="pcw-close" title="위젯 숨기기">×</button></div></div>${folded?'':`<div class="pcw-content"><div class="pcw-timelines">${timelineTabs}</div><div class="pcw-date">${pcEsc(calDate)}</div><div class="pcw-month">${pcCalendarBody()}</div><details class="pcw-compare"><summary>🔀 같은 날짜 시간선 비교</summary>${timelineCompare}</details>${list.map(e=>`<div class="pcw-item">${pcEsc(e.emoji||'💌')} ${pcEsc(e.title||'제목 없음')} · ${pcEsc(pcStatus[e.status]||'미정')}</div>`).join('')||'<div class="pcw-item">미기록</div>'}</div>`}${settings.widgetPositionLocked?'':'<span class="pcw-resize" title="크기 조절"></span>'}`;
 el.querySelectorAll('[data-pc-day]').forEach(b=>b.onclick=()=>{calDate=b.dataset.pcDay;pcRenderWidget()});
 el.querySelectorAll('[data-pcw-timeline]').forEach(b=>b.onclick=()=>{calTimeline=b.dataset.pcwTimeline;pcRenderWidget()});
 let pcwDragged=false;
 el.querySelector('#pcw-fold').onclick=ev=>{ev.stopPropagation();if(pcwDragged){pcwDragged=false;return}settings.widgetFolded=!settings.widgetFolded;calSave();pcRenderWidget()};
 // Folded launcher: drag anywhere on the icon; a stationary tap still expands it.
 if(folded&&!settings.widgetPositionLocked){
   const foldBtn=el.querySelector('#pcw-fold');
   foldBtn.style.touchAction='none';
   foldBtn.onpointerdown=ev=>{
     if(ev.button!==0&&ev.pointerType==='mouse')return;
     const startX=ev.clientX,startY=ev.clientY,rect=el.getBoundingClientRect(),left=rect.left,top=rect.top;
     let moved=false;
     foldBtn.setPointerCapture(ev.pointerId);
     foldBtn.onpointermove=e=>{
       if(!foldBtn.hasPointerCapture(e.pointerId))return;
       if(Math.hypot(e.clientX-startX,e.clientY-startY)>5)moved=true;
       if(!moved)return;
       pcwDragged=true;
       el.style.left=Math.max(0,Math.min(innerWidth-40,left+e.clientX-startX))+'px';
       el.style.top=Math.max(0,Math.min(innerHeight-40,top+e.clientY-startY))+'px';
       el.style.right='auto';
     };
     foldBtn.onpointerup=e=>{
       foldBtn.onpointermove=null;foldBtn.onpointerup=null;
       if(moved){settings.widgetPos={left:el.style.left,top:el.style.top};calSave();setTimeout(()=>{pcwDragged=false},350)}
     };
   };
 }
 el.querySelector('#pcw-open').onclick=()=>{calendarTab='calendar';calEdit='';panelOpen=true;render()};
 el.querySelector('#pcw-lock').onclick=()=>{settings.widgetPositionLocked=!settings.widgetPositionLocked;calSave();pcRenderWidget()};
 el.querySelector('#pcw-close').onclick=()=>{settings.widgetShown=false;calSave();pcRenderWidget()};
 const head=el.querySelector('.pcw-head');
 head.onpointerdown=ev=>{if(ev.target.closest('button')||settings.widgetPositionLocked)return;const x=ev.clientX,y=ev.clientY,r=el.getBoundingClientRect(),sx=r.left,sy=r.top;head.setPointerCapture(ev.pointerId);head.onpointermove=e=>{if(!head.hasPointerCapture(e.pointerId))return;el.style.left=Math.max(0,Math.min(innerWidth-45,sx+e.clientX-x))+'px';el.style.top=Math.max(0,Math.min(innerHeight-45,sy+e.clientY-y))+'px';el.style.right='auto'};head.onpointerup=()=>{head.onpointermove=null;settings.widgetPos={left:el.style.left,top:el.style.top};calSave()}};
 const handle=el.querySelector('.pcw-resize');if(handle)handle.onpointerdown=ev=>{ev.preventDefault();ev.stopPropagation();const x=ev.clientX,y=ev.clientY,r=el.getBoundingClientRect(),w=r.width,h=r.height;handle.setPointerCapture(ev.pointerId);handle.onpointermove=e=>{if(!handle.hasPointerCapture(e.pointerId))return;el.style.width=Math.max(190,Math.min(innerWidth-20,w+e.clientX-x))+'px';el.style.height=Math.max(150,Math.min(innerHeight-30,h+e.clientY-y))+'px'};handle.onpointerup=()=>{handle.onpointermove=null;settings.widgetSize={width:el.style.width,height:el.style.height};calSave()}};
 if(settings.widgetPos){el.style.left=settings.widgetPos.left;el.style.top=settings.widgetPos.top;el.style.right='auto'}
 if(settings.widgetSize&&!folded){el.style.width=settings.widgetSize.width;el.style.height=settings.widgetSize.height}
}
// Keep the companion widget in sync when a memo is opened, hidden or folded.
let pcWidgetRefreshQueued=false;
new MutationObserver(()=>{if(pcWidgetRefreshQueued)return;pcWidgetRefreshQueued=true;queueMicrotask(()=>{pcWidgetRefreshQueued=false;const shouldShow=!!cal.settings?.widgetShown&&!!cal.settings.widgetSeparate;if(shouldShow!==!!document.getElementById('pc-calendar-widget'))pcRenderWidget()})}).observe(widgets,{childList:true,subtree:false});
const checkCss=document.createElement('style');checkCss.textContent=`#pm-panel .pc-emoji-list{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px}#pm-panel .pc-emoji-list button.active{background:#e5cff5;border:2px solid #9a6cb7}#pm-check-separate .pm-check-item{font-size:13px}#pm-check-separate button{border:1px solid #d5bfe8;border-radius:9px;padding:5px;background:#f5edfc;color:#59367d}#pm-check-separate .pm-input{border:1px solid #d2bee3;border-radius:9px;padding:8px;max-width:100%}#pm-check-separate .pm-check-listbar{display:flex;gap:5px;overflow:auto}#pm-check-separate .pm-check-listbar button{flex:none}#pm-panel .pm-check-listbar,.pm-pc-widget-calendar .pm-check-listbar{display:flex;gap:5px;overflow-x:auto;padding:7px 0}#pm-panel .pm-check-listbar button,.pm-pc-widget-calendar .pm-check-listbar button{flex:none}#pm-panel .pm-check-listbar button.active,.pm-pc-widget-calendar .pm-check-listbar button.active{background:#d8b8e5;color:#342342}.pm-check-item{display:flex;align-items:center;gap:4px;padding:6px 0;border-bottom:1px solid #eee3f5}.pm-check-item label{flex:1;display:flex;gap:6px;align-items:center;min-width:0;overflow-wrap:anywhere}.pm-check-item input{accent-color:#a58acb}.pm-check-item button{padding:3px 6px!important;min-height:25px!important}.pm-check-done{text-decoration:line-through;opacity:.55}.pm-check-progress{height:7px;background:#eee5f5;border-radius:10px;overflow:hidden;margin:8px 0}.pm-check-progress>div{height:100%;background:#a58acb;transition:width .15s}.pm-check-new-input{flex:1;min-width:100px;width:100px!important}.pm-pc-widget-calendar .pm-input{max-width:100%}.pm-pc-widget-tabs button{flex:1}`;document.head.appendChild(checkCss);
const pcCss=document.createElement('style');pcCss.textContent=`#pm-panel .pc-switch{display:flex;gap:8px;margin:10px 0 14px}#pm-panel .pc-switch button{flex:1;padding:11px 8px;border-radius:14px;border:1px solid #b99cbd;background:#f7eef9;color:#5c426a;font-weight:700}#pm-panel .pc-switch button.active{background:#d8b8e5;color:#342342}#pm-panel .pc-week,#pm-panel .pc-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;text-align:center}#pm-panel .pc-week{margin-top:10px;color:#95789e;font-size:12px}#pm-panel .pc-day{min-width:0;min-height:48px;padding:3px 1px;border:1px solid #e9d9ed;border-radius:9px;background:#fff9fe;color:#493454;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px}#pm-panel .pc-day.active{border:2px solid #b17bce;background:#f0e2fa}#pm-panel .pc-day small{font-size:10px;overflow:hidden;max-width:100%}#pm-panel .pc-empty{min-height:48px}#pm-panel .pc-event{border:1px solid #dbc4e3;padding:12px;margin:10px 0;overflow-wrap:anywhere}#pm-panel .pc-event .pm-muted{margin:6px 0}#pm-panel .pc-date-time{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:end;margin:10px 0}#pm-panel .pc-date-time>*{min-width:0;width:100%;box-sizing:border-box}#pm-panel .pc-date-time input{display:block;width:100%;min-width:0;max-width:100%;box-sizing:border-box;font-size:14px;padding:8px 4px}#pm-panel .pc-timeline-chips{display:flex;gap:7px;flex-wrap:wrap;margin:8px 0}#pm-panel .pc-timeline-chips button{border:1px solid #d6c1e8;border-radius:18px;padding:7px 11px;background:#fff9fe;color:#624a79}#pm-panel .pc-timeline-chips button.active{background:#aa8ac8;color:white}#pm-panel .pc-emoji-list{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}#pm-panel .pc-emoji-list button{font-size:21px;border:1px solid #dec7e7;background:#fff;border-radius:12px;padding:6px;min-width:41px}#pm-panel .pc-emoji-list button.active{background:#dfc8f1;border-color:#9670b4}#pc-calendar-widget{position:fixed;z-index:2147483600;top:23%;right:16px;width:min(310px,80vw);min-width:190px;resize:both;overflow:auto;max-height:65vh;border:2px solid #c9a9db;border-radius:16px;background:#fff8fe;color:#4d3861;box-shadow:0 8px 28px #0004;font:14px system-ui,sans-serif}#pc-calendar-widget .pcw-head{touch-action:none;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;background:#eddef5;cursor:move}#pc-calendar-widget button{border:1px solid #c8acd9;border-radius:8px;background:white;color:#63477b;padding:5px 8px;margin-left:4px}#pc-calendar-widget .pcw-content{padding:12px}#pc-calendar-widget .pcw-date{font-weight:700;margin-bottom:8px}#pc-calendar-widget .pc-week,#pc-calendar-widget .pc-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;text-align:center}#pc-calendar-widget .pc-day{min-width:0;min-height:31px;border:1px solid #e4cdec;border-radius:5px;background:white;color:#513961;padding:2px;font-size:11px}#pc-calendar-widget .pc-day.active{background:#dfc8f1}#pc-calendar-widget .pc-day small{display:block;font-size:8px}#pc-calendar-widget .pc-week{font-size:10px;margin-bottom:4px}#pc-calendar-widget .pcw-item{padding:6px 0;border-bottom:1px solid #eadbed;overflow-wrap:anywhere}@media(max-width:430px){#pm-panel .pc-date-time{gap:7px}#pm-panel .pc-date-time input{font-size:13px}}`;pcCss.textContent+=`#pm-panel .pc-date-time{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:12px!important}#pm-panel .pc-date-time>label{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;overflow:hidden!important}#pm-panel .pc-date-time input[type=date],#pm-panel .pc-date-time input[type=time]{display:block!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;-webkit-appearance:none;appearance:none;font-size:16px!important;padding:12px!important;border-radius:12px!important}#pm-panel .pc-setting-card{padding:10px;border:1px solid #e4d2ed;border-radius:14px;margin:12px 0}#pm-panel .pc-setting-row,#pm-panel .pc-widget-toggle{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 4px;border-bottom:1px solid #eee0f1;line-height:1.5}#pm-panel .pc-widget-toggle{flex-wrap:wrap}#pm-panel .pc-setting-row input,#pm-panel .pc-widget-toggle input{width:19px;height:19px;flex-shrink:0;accent-color:#a285c8}#pc-calendar-widget.pcw-folded{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;border-radius:50%!important;resize:none!important;overflow:visible!important;background:#e9d4f1!important}#pc-calendar-widget.pcw-folded .pcw-head{height:100%;padding:0!important;justify-content:center;border-radius:50%;cursor:grab}#pc-calendar-widget.pcw-folded .pcw-head>b,#pc-calendar-widget.pcw-folded .pcw-head .pcw-actions button:not(#pcw-fold){display:none!important}#pc-calendar-widget.pcw-folded #pcw-fold{background:transparent;border:0;font-size:23px;margin:0;padding:0}#pc-calendar-widget.pcw-position-locked{resize:none!important}#pc-calendar-widget .pcw-resize{position:absolute;right:0;bottom:0;width:24px;height:24px;touch-action:none;cursor:nwse-resize;background:linear-gradient(135deg,transparent 57%,#aa8ac8 58%,#aa8ac8 67%,transparent 68%)}#pc-calendar-widget.pcw-folded .pcw-resize{display:none!important}#pc-calendar-widget .pcw-actions{display:flex;align-items:center;gap:2px}#pc-calendar-widget .pcw-actions button{padding:4px 5px;font-size:12px}`;pcCss.textContent+=` .pm-pc-widget-tabs{display:flex;gap:4px;padding:5px 7px;border-bottom:1px solid #e8d5ee}.pm-pc-widget-tabs button{flex:1;min-width:0;border:1px solid #d6bfe4;border-radius:8px;background:#fff9fe;color:#624779;padding:5px 3px;font-size:12px}.pm-pc-widget-tabs button.active{background:#cdaedf;color:#3e2c55;font-weight:700}.pm-pc-widget-calendar{padding:6px 9px;overflow-y:auto;max-height:calc(100% - 105px);font-size:12px}.pm-pc-widget-cal-title{margin:5px 0 9px;font-weight:700}.pm-pc-widget-calendar .pc-week,.pm-pc-widget-calendar .pc-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px;text-align:center}.pm-pc-widget-calendar .pc-day{min-width:0;min-height:27px;padding:1px;border:1px solid #e5d6ee;border-radius:5px;background:#fffafd;color:#503a62;font-size:10px}.pm-pc-widget-calendar .pc-day.active{background:#dfc8f1}.pm-pc-widget-calendar .pc-day small{display:block;font-size:8px}.pm-pc-widget-calendar .pc-week{font-size:10px}.pm-pc-widget-calendar .pcw-item{padding:5px 0;border-bottom:1px solid #eadbed}.pm-pc-widget-open{margin:8px 0;padding:6px;border:1px solid #c7abda;border-radius:8px;background:#f7eef9;color:#543d69} `;pcCss.textContent+=` .pm-pc-widget-calendar .pmw-timelines{display:flex;gap:4px;flex-wrap:wrap;margin:5px 0}.pm-pc-widget-calendar .pmw-timelines button{border:1px solid #d7bee6;border-radius:9px;padding:4px 7px;background:#fff9fe;color:#624779;font-size:11px}.pm-pc-widget-calendar .pmw-timelines button.active{background:#bb9dd6;color:#fff}.pm-pc-widget-calendar .pmw-cal-nav,.pm-pc-widget-calendar .pmw-date-head{display:flex;align-items:center;justify-content:space-between;gap:5px;margin:7px 0}.pm-pc-widget-calendar .pmw-cal-nav button,.pm-pc-widget-calendar .pmw-date-head button,.pm-pc-widget-calendar [data-pmw-compare],.pm-pc-widget-calendar .pcw-item button{border:1px solid #d7bee6;border-radius:7px;padding:4px 7px;background:#fff9fe;color:#624779;font-size:11px}.pm-pc-widget-calendar .pmw-inline-editor{margin-top:9px;padding:8px;border:1px solid #d7bee6;border-radius:10px;background:#fffaff}.pm-pc-widget-calendar .pmw-inline-editor label{display:block;font-size:11px;margin:6px 0}.pm-pc-widget-calendar .pmw-inline-editor input,.pm-pc-widget-calendar .pmw-inline-editor textarea,.pm-pc-widget-calendar .pmw-inline-editor select{display:block;width:100%;min-width:0;box-sizing:border-box;padding:7px;border:1px solid #d7bee6;border-radius:7px;background:#fff;color:#493454;font:12px system-ui}.pm-pc-widget-calendar .pmw-edit-actions{display:flex;gap:6px}.pm-pc-widget-calendar .pmw-edit-actions button{padding:6px;border:1px solid #d7bee6;border-radius:8px;background:#f3e7fa}`;pcCss.textContent+=`#pm-panel .pc-decoration-inline{margin:16px 0;padding:12px;border:1px solid #dfc9ed;border-radius:12px;background:#fffaff}#pm-panel .pc-decoration-inline summary{cursor:pointer;font-weight:700;color:#6c4b83;margin-bottom:12px}#pm-panel .pc-decoration-inline .pc-date-time{grid-template-columns:minmax(0,1fr)!important}`;pcCss.textContent+=`#pc-calendar-widget.pcw-folded{width:40px!important;height:40px!important;min-width:40px!important;min-height:40px!important;max-width:40px!important;max-height:40px!important;padding:0!important}#pc-calendar-widget.pcw-folded .pcw-head{width:100%;height:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:center}#pc-calendar-widget.pcw-folded #pcw-fold{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:19px;cursor:pointer}#pm-panel .pc-decoration-inline{display:none!important}`;pcCss.textContent+=`#pc-calendar-widget .pcw-timelines{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}#pc-calendar-widget .pcw-timelines button{margin:0;border-radius:14px;padding:5px 8px;font-size:11px}#pc-calendar-widget .pcw-timelines button.active{background:#ad8cc7;color:#fff}#pc-calendar-widget .pcw-compare{margin:10px 0;border:1px solid #e4cdec;border-radius:9px;padding:8px;font-size:11px}#pc-calendar-widget .pcw-compare summary{cursor:pointer}#pc-calendar-widget .pcw-compare-row{display:flex;flex-direction:column;gap:3px;padding:7px 0;border-bottom:1px solid #e8d9ee}#pc-calendar-widget .pcw-compare-row:last-child{border-bottom:0}#pc-calendar-widget.pcw-folded #pcw-fold{touch-action:none;cursor:grab}#pc-calendar-widget.pcw-folded #pcw-fold:active{cursor:grabbing}`;document.head.appendChild(pcCss);

data=read(current);calLoad();checkLoad();render();pcRenderWidget();checkRenderSeparateWidget();setInterval(changeRoom,500);window.addEventListener('popstate',changeRoom);window.addEventListener('hashchange',changeRoom);
})();

