// ==UserScript==
// @name         Pocket Memo 💜
// @namespace    pocket-memo-independent
// @version      1.0.10
// @updateURL    https://raw.githubusercontent.com/qwerty1816/pocket-memo/main/pocket-memo.user.js
// @downloadURL  https://raw.githubusercontent.com/qwerty1816/pocket-memo/main/pocket-memo.user.js
// @description  라벤더 레이스 메모장 · 편지지 위젯 · 리본 접기 · 방별 저장
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
#pm-launch{position:fixed;right:14px;bottom:90px;width:48px;height:48px;touch-action:none;user-select:none;-webkit-user-select:none;border-radius:50%!important;background:#8152ba!important;color:white!important;font-size:23px!important;z-index:2147483003;box-shadow:0 4px 16px #0004}
#pm-panel{position:fixed;right:14px;top:7vh;width:min(380px,calc(100vw - 20px));max-height:70dvh;overflow:auto;background:#fffafd;border:1px solid #d8c3ed;border-radius:18px;padding:14px;box-shadow:0 12px 38px #0004;z-index:2147483004}
#pm-panel[hidden],.pm-widget[hidden]{display:none!important}.pm-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0}.pm-row.space{justify-content:space-between}.pm-muted{font-size:12px;color:#7b7086}.pm-input{width:100%;border:1px solid #d2bee3;border-radius:9px;padding:9px;background:#fff;color:#34264a}.pm-card{padding:10px;border:1px solid #e6d9ef;border-radius:12px;background:white;margin:7px 0}.pm-card.active{border-color:#9362c3;background:#faf3ff}.pm-card-title{font-weight:700;font-size:14px}.pm-small{font-size:12px}.pm-label{font-size:12px;font-weight:650;display:block;margin:9px 0 4px}.pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pm-grid input{min-width:0}.pm-separator{border:0;border-top:1px solid #eadff2;margin:13px 0}
.pm-widget{position:fixed;z-index:2147483002;border:1px solid #c9a6e7;box-shadow:0 6px 25px #0003;padding:9px;display:flex;flex-direction:column;overflow:hidden;min-width:170px;min-height:120px;max-width:100vw;max-height:100dvh}.pm-widget-head{display:flex;align-items:center;justify-content:space-between;gap:4px;touch-action:none;cursor:move;user-select:none}.pm-drag-handle{touch-action:none!important;user-select:none;-webkit-user-select:none;cursor:grab!important;min-width:49px}.pm-widget-head strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:13px}.pm-widget-actions{display:flex;flex-shrink:0;gap:3px}.pm-widget-actions button{font-size:12px;padding:4px 6px!important;background:#ffffffb8!important;color:#34264a!important}.pm-widget textarea{flex:1;width:100%;min-height:45px;border:0;background:transparent;outline:none;resize:none;margin-top:7px;line-height:1.5}.pm-resize{position:absolute;bottom:0;right:0;width:23px;height:23px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 60%,#9c75bf 61%,#9c75bf 67%,transparent 68%)}
@media(max-width:650px){#pm-panel{top:auto;bottom:8px;left:3%;right:3%;width:94%;max-height:calc(100dvh - 24px);border-radius:18px}#pm-launch{right:12px;bottom:90px}}

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
.pm-widget.pm-folded{min-width:0!important;min-height:0!important;width:48px!important;height:48px!important;border-radius:50%!important;overflow:visible!important;box-shadow:0 3px 14px #0004;background:var(--pm-header,#d7b9ed)!important;opacity:1!important}
.pm-fold-button{display:flex;align-items:center;justify-content:center;width:100%;height:100%;border:0!important;border-radius:50%!important;background:transparent!important;font-size:25px!important;padding:0!important;cursor:pointer;touch-action:manipulation}
.pm-fold-handle{position:absolute;right:51px;top:5px;width:36px;height:36px;border-radius:50%!important;background:#fff7ff!important;color:#795c9a!important;box-shadow:0 2px 8px #0003;touch-action:none!important;cursor:grab!important;padding:0!important}
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
document.head.appendChild(style);
root.innerHTML='<button id="pm-launch" title="Pocket Memo">📝</button><section id="pm-panel" hidden></section><div id="pm-widgets"></div>';
const panel=$('#pm-panel',root),widgets=$('#pm-widgets',root);
function update(n,fields){Object.assign(n,fields,{updated:Date.now()});persist()}
function changeRoom(){const next=room();if(next===current)return;current=next;data=read(current);selected='';filter='';folderFilter='';viewMode='read';render();}
function render(){renderPanel();renderWidgets()}
function renderPanel(){panel.hidden=!panelOpen;if(!panelOpen)return;
if(!current){panel.innerHTML='<div class="pm-row space"><b>📒 Pocket Memo</b><button data-action="close">닫기</button></div><p>RP 채팅방에서 메모를 사용할 수 있어요.</p>';bindPanel();return}
const visible=data.notes.filter(n=>(!folderFilter||n.folder===folderFilter)&&(n.title+' '+n.text+' '+n.tags.join(' ')).toLocaleLowerCase().includes(filter.toLocaleLowerCase())).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updated-a.updated);
const n=noteById(selected);
panel.innerHTML=`<div class="pm-titlebar"><div class="pm-row space"><b class="pm-brand">🎀 포켓 메모</b><button data-action="close">닫기 ×</button></div><div class="pm-muted">나만의 작은 기록장 ♡ · 메모 ${data.notes.length}개 · 자동 저장</div><div class="pm-lace">✿ ୨୧ ✿ ୨୧ ✿</div></div>
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
${editorTab==='settings'?`<label class="pm-switch">📌 상단 고정 <input id="pm-pinned" type="checkbox" ${n.pinned?'checked':''}></label><label class="pm-switch">💌 위젯 표시 <input id="pm-shown" type="checkbox" ${n.shown?'checked':''}></label><label class="pm-switch">🔑 위치·크기 잠금 <input id="pm-poslock" type="checkbox" ${n.positionLocked?'checked':''}></label><label class="pm-switch">📄🔒 위젯 내용 수정 잠금 <input id="pm-contentlock" type="checkbox" ${n.contentLocked?'checked':''}></label><label class="pm-switch">🎀 쪽지로 접기 <input id="pm-folded" type="checkbox" ${n.folded?'checked':''}></label>${n.folded&&!n.positionLocked?`<button data-action="move-folded">✥ 접힌 쪽지 이동 손잡이 ${foldMoveId===n.id?'숨기기':'표시'}</button>`:''}<div class="pm-muted">잠금 기능은 서로 독립적이에요. 접힌 쪽지 이동은 위치 잠금 해제 시 가능합니다.</div>`:''}
` }
</div>`:''}
<input id="pm-import-file" type="file" accept=".json,application/json" hidden>`;
bindPanel();}
function bindPanel(){panel.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action,id=b.dataset.id;if(a==='close'){panelOpen=false;renderPanel()}else if(a==='back'){viewMode='read';renderPanel()}else if(a==='edit'){viewMode='edit';editorTab='content';renderPanel()}else if(a==='move-folded'){foldMoveId=foldMoveId===selected?'':selected;render()}else if(a==='new'){const n=newNote();data.notes.unshift(n);selected=n.id;editorTab='content';viewMode='edit';persist();render()}else if(a==='select'){const wasOpen=selected===id&&viewMode==='read';const oldScroll=panel.scrollTop;selected=wasOpen?'':id;viewMode='read';renderPanel();panel.scrollTop=oldScroll}else if(a==='edit-note'){const oldScroll=panel.scrollTop;selected=id;viewMode='edit';editorTab='content';renderPanel();panel.scrollTop=oldScroll;const editor=$('.pm-editor',panel);if(editor)editor.scrollIntoView({block:'nearest',behavior:'instant'})}else if(a==='delete'){if(!confirm('이 메모를 삭제할까요?'))return;data.notes=data.notes.filter(n=>n.id!==id);selected='';persist();render()}else if(a==='folder'){const name=prompt('새 폴더 이름');if(!name?.trim())return;data.folders.push({id:uid(),name:name.trim()});persist();renderPanel()}else if(a==='rename-folder'){const f=data.folders.find(x=>x.id===id);if(!f)return;const name=prompt('폴더 이름 (빈칸 입력 시 삭제)',f.name);if(name===null)return;if(!name.trim()){if(!confirm('폴더를 삭제할까요? 메모는 미분류로 이동합니다.'))return;data.folders=data.folders.filter(x=>x.id!==id);data.notes.forEach(n=>{if(n.folder===id)n.folder=''});if(folderFilter===id)folderFilter='';}else f.name=name.trim();persist();renderPanel()}else if(a==='export')exportFile();else if(a==='import')$('#pm-import-file',panel).click()});
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
const dp=getDevicePos(n)||n;const w=Math.max(170,Math.min(innerWidth-12,Number(dp.width)||270)),h=Math.max(120,Math.min(innerHeight-12,Number(dp.height)||210));const x=Math.max(0,Math.min(innerWidth-(n.folded?48:Math.min(w,60)),Number(dp.x)||0)),y=Math.max(0,Math.min(innerHeight-(n.folded?48:Math.min(h,50)),Number(dp.y)||0));
el.style.cssText=`left:${x}px;top:${y}px;width:${n.folded?48:w}px;height:${n.folded?48:h}px;${n.folded?`background:${bg};`:paperCss(n.style)}color:${fg};opacity:${n.folded?1:n.style.opacity/100};border-radius:${n.folded?50:n.style.radius}px;font-size:${n.style.fontSize}px;--pm-header:${header}`;
if(n.folded){
 el.innerHTML=`<button class="pm-fold-button" type="button" title="메모 펼치기">🎀</button><button class="pm-fold-handle" type="button" title="끌어서 위치 이동" ${n.positionLocked?'disabled':''} ${foldMoveId===n.id&&!n.positionLocked?'':'hidden'}>✥</button>`;
 const fold=$('.pm-fold-button',el),handle=$('.pm-fold-handle',el);
 // A tap opens the note; a secondary long-press or right click exposes a drag handle.
 let holdTimer=0,held=false;
 fold.addEventListener('touchstart',()=>{held=false;holdTimer=setTimeout(()=>{held=true;if(!n.positionLocked){foldMoveId=n.id;renderWidgets()}},550)},{passive:true});
 fold.addEventListener('touchend',()=>clearTimeout(holdTimer),{passive:true});
 fold.addEventListener('touchmove',()=>clearTimeout(holdTimer),{passive:true});
 fold.onclick=e=>{if(held){e.preventDefault();held=false;return}foldMoveId='';update(n,{folded:false});render()};
 fold.oncontextmenu=e=>{e.preventDefault();if(n.positionLocked)return;foldMoveId=foldMoveId===n.id?'':n.id;renderWidgets()};
 if(!n.positionLocked){attachDrag(handle,el,n,'move',false);}
}else{
 el.innerHTML=`<div class="pm-widget-head"><strong>${esc(n.emoji||'💌')} ${esc(n.title)}</strong><div class="pm-widget-actions"><button data-action="read-toggle" title="읽기 / 내용 수정 전환">🖍️</button><button data-action="fold" title="리본으로 접기">▾</button><button class="pm-drag-handle" type="button" title="누른 채 이동" ${n.positionLocked?'disabled':''}>✥</button><button data-action="position" title="위치·크기 잠금">${n.positionLocked?'🔐':'🔓'}</button><button data-action="content" title="위젯 내용 수정 잠금">${n.contentLocked?'📄🔒':'📝'}</button><button data-action="hide" title="위젯 숨기기">×</button></div></div><div class="pm-paperline">✉ ───── ♡ ───── ✉</div><div class="pm-widget-read" hidden></div><textarea placeholder="메모 내용" ${n.contentLocked?'readonly':''}></textarea>${n.positionLocked?'':'<div class="pm-resize" title="크기 조절"></div>'}`;
 const ta=$('textarea',el),readEl=$('.pm-widget-read',el);ta.value=n.text;ta.style.color=fg;readEl.innerHTML=highlightedHtml(n);readEl.hidden=false;ta.hidden=true;ta.oninput=()=>{update(n,{text:ta.value});readEl.innerHTML=highlightedHtml(n);const editor=$('#pm-text',panel);if(editor&&selected===n.id&&document.activeElement!==editor)editor.value=n.text};
 el.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==='hide')update(n,{shown:false});if(a==='position')update(n,{positionLocked:!n.positionLocked});if(a==='content')update(n,{contentLocked:!n.contentLocked});if(a==='fold')update(n,{folded:true});if(a==='read-toggle'){const showing=readEl.hidden;readEl.hidden=!showing;ta.hidden=showing;return}render()});
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
      el.style.left=Math.max(0,Math.min(innerWidth-50,active.left+dx))+'px';
      el.style.top=Math.max(0,Math.min(innerHeight-40,active.top+dy))+'px';
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
const launcherKey=PREFIX+'launcher-position';
let launcherPosition=null, launcherDrag=null, suppressLauncherClick=false;
try{const saved=JSON.parse(localStorage.getItem(launcherKey)||'null');if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y))launcherPosition=saved}catch(e){}
function launcherBounds(){
  const vv=window.visualViewport;
  return {w:vv?.width||innerWidth,h:vv?.height||innerHeight,
    x:vv?.offsetLeft||0,y:vv?.offsetTop||0};
}
function placeLauncher(){
  const b=launcherBounds(),size=48,margin=8;
  let x=launcherPosition?b.x+launcherPosition.x*Math.max(0,b.w-size):b.x+b.w-size-14;
  let y=launcherPosition?b.y+launcherPosition.y*Math.max(0,b.h-size):b.y+b.h-size-90;
  x=Math.max(b.x+margin,Math.min(b.x+b.w-size-margin,x));
  y=Math.max(b.y+margin,Math.min(b.y+b.h-size-margin,y));
  launcher.style.left=x+'px';launcher.style.top=y+'px';
  launcher.style.right='auto';launcher.style.bottom='auto';
}
function saveLauncherPosition(){
  const b=launcherBounds(),r=launcher.getBoundingClientRect();
  launcherPosition={x:Math.max(0,Math.min(1,(r.left-b.x)/Math.max(1,b.w-48))),
    y:Math.max(0,Math.min(1,(r.top-b.y)/Math.max(1,b.h-48)))};
  try{localStorage.setItem(launcherKey,JSON.stringify(launcherPosition))}catch(e){console.warn('[Pocket Memo] launcher position',e)}
}
function isChatTyping(){
  const a=document.activeElement;
  if(!a||root.contains(a))return false;
  return a.matches?.('textarea,input:not([type=checkbox]):not([type=radio]),[contenteditable="true"],[role="textbox"]')||!!a.closest?.('[contenteditable="true"]');
}
function syncLauncherVisibility(){
  launcher.style.display=isChatTyping()?'none':'';
  if(!isChatTyping())placeLauncher();
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
  launcher.style.left=Math.max(b.x+8,Math.min(b.x+b.w-56,a.left+dx))+'px';
  launcher.style.top=Math.max(b.y+8,Math.min(b.y+b.h-56,a.top+dy))+'px';
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
placeLauncher();
data=read(current);render();setInterval(changeRoom,900);
})();
