// ==UserScript==
// @name         Pocket Memo 💜
// @namespace    pocket-memo-independent
// @version      1.0.2
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
let current=room(),data=initial(),selected='',filter='',folderFilter='',panelOpen=false,editorTab='content',foldMoveId='';
const key=id=>PREFIX+'room:'+id;
function read(id){if(!id)return initial();try{const x=JSON.parse(localStorage.getItem(key(id))||'null');if(x&&Array.isArray(x.notes)&&Array.isArray(x.folders))return x;}catch(e){console.warn('[Pocket Memo] read',e)}return initial()}
function persist(){if(!current)return false;try{localStorage.setItem(key(current),JSON.stringify(data));return true}catch(e){alert('Pocket Memo 저장 실패. 저장 공간을 확인하고 백업해 주세요.');return false}}
const noteById=id=>data.notes.find(n=>n.id===id);
const newNote=()=>({id:uid(),title:'새 메모',text:'',folder:'',tags:[],pinned:false,shown:false,positionLocked:false,contentLocked:false,x:20,y:Math.round(innerHeight*.22),width:270,height:210,folded:false,emoji:'💌',style:{bg:'#fff8fe',fg:'#34264a',header:'#f1ddf5',opacity:100,fontSize:14,radius:14},updated:Date.now()});
const root=document.createElement('div');root.id='pocket-memo-root';document.documentElement.appendChild(root);
const style=document.createElement('style');style.textContent=`
#pocket-memo-root{font-family:system-ui,-apple-system,sans-serif;color:#382a49;position:relative;z-index:2147483000}#pocket-memo-root *{box-sizing:border-box}
#pocket-memo-root button,#pocket-memo-root input,#pocket-memo-root textarea,#pocket-memo-root select{font:inherit}#pocket-memo-root button{border:1px solid #d5bfe8;border-radius:9px;padding:7px 9px;background:#f5edfc;color:#59367d;cursor:pointer}#pocket-memo-root button:disabled{opacity:.5;cursor:not-allowed}
#pm-launch{position:fixed;right:14px;bottom:90px;width:48px;height:48px;border-radius:50%!important;background:#8152ba!important;color:white!important;font-size:23px!important;z-index:2147483003;box-shadow:0 4px 16px #0004}
#pm-panel{position:fixed;right:14px;top:7vh;width:min(430px,calc(100vw - 20px));max-height:84dvh;overflow:auto;background:#fffafd;border:1px solid #d8c3ed;border-radius:18px;padding:14px;box-shadow:0 12px 38px #0004;z-index:2147483004}
#pm-panel[hidden],.pm-widget[hidden]{display:none!important}.pm-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:8px 0}.pm-row.space{justify-content:space-between}.pm-muted{font-size:12px;color:#7b7086}.pm-input{width:100%;border:1px solid #d2bee3;border-radius:9px;padding:9px;background:#fff;color:#34264a}.pm-card{padding:10px;border:1px solid #e6d9ef;border-radius:12px;background:white;margin:7px 0}.pm-card.active{border-color:#9362c3;background:#faf3ff}.pm-card-title{font-weight:700;font-size:14px}.pm-small{font-size:12px}.pm-label{font-size:12px;font-weight:650;display:block;margin:9px 0 4px}.pm-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.pm-grid input{min-width:0}.pm-separator{border:0;border-top:1px solid #eadff2;margin:13px 0}
.pm-widget{position:fixed;z-index:2147483002;border:1px solid #c9a6e7;box-shadow:0 6px 25px #0003;padding:9px;display:flex;flex-direction:column;overflow:hidden;min-width:170px;min-height:120px;max-width:100vw;max-height:100dvh}.pm-widget-head{display:flex;align-items:center;justify-content:space-between;gap:4px;touch-action:none;cursor:move;user-select:none}.pm-drag-handle{touch-action:none!important;user-select:none;-webkit-user-select:none;cursor:grab!important;min-width:49px}.pm-widget-head strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:13px}.pm-widget-actions{display:flex;flex-shrink:0;gap:3px}.pm-widget-actions button{font-size:12px;padding:4px 6px!important;background:#ffffffb8!important;color:#34264a!important}.pm-widget textarea{flex:1;width:100%;min-height:45px;border:0;background:transparent;outline:none;resize:none;margin-top:7px;line-height:1.5}.pm-resize{position:absolute;bottom:0;right:0;width:23px;height:23px;cursor:nwse-resize;touch-action:none;background:linear-gradient(135deg,transparent 60%,#9c75bf 61%,#9c75bf 67%,transparent 68%)}
@media(max-width:650px){#pm-panel{top:auto;bottom:0;left:0;right:0;width:100%;max-height:80dvh;border-radius:18px 18px 0 0}#pm-launch{right:12px;bottom:90px}}

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
@media(max-width:650px){#pm-panel{max-height:85dvh;padding:12px}#pm-panel .pm-row{gap:5px}#pm-panel button{font-size:12px}#pm-panel .pm-tabs button{font-size:11px}}
`;document.head.appendChild(style);
root.innerHTML='<button id="pm-launch" title="Pocket Memo">📝</button><section id="pm-panel" hidden></section><div id="pm-widgets"></div>';
const panel=$('#pm-panel',root),widgets=$('#pm-widgets',root);
function update(n,fields){Object.assign(n,fields,{updated:Date.now()});persist()}
function changeRoom(){const next=room();if(next===current)return;current=next;data=read(current);selected='';filter='';folderFilter='';render();}
function render(){renderPanel();renderWidgets()}
function renderPanel(){panel.hidden=!panelOpen;if(!panelOpen)return;
if(!current){panel.innerHTML='<div class="pm-row space"><b>📒 Pocket Memo</b><button data-action="close">닫기</button></div><p>RP 채팅방에서 메모를 사용할 수 있어요.</p>';bindPanel();return}
const visible=data.notes.filter(n=>(!folderFilter||n.folder===folderFilter)&&(n.title+' '+n.text+' '+n.tags.join(' ')).toLocaleLowerCase().includes(filter.toLocaleLowerCase())).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updated-a.updated);
const n=noteById(selected);
panel.innerHTML=`<div class="pm-titlebar"><div class="pm-row space"><b class="pm-brand">🎀 포켓 메모</b><button data-action="close">닫기 ×</button></div><div class="pm-muted">나만의 작은 기록장 ♡ · 메모 ${data.notes.length}개 · 자동 저장</div><div class="pm-lace">✿ ୨୧ ✿ ୨୧ ✿</div></div>
<div class="pm-row"><button data-action="new">＋ 새 메모 🌷</button><button data-action="folder">📁 폴더 추가</button><button data-action="export">⬇ 백업</button><button data-action="import">⬆ 복원</button></div>
<div class="pm-grid"><input class="pm-input" id="pm-search" placeholder="🔎 메모·태그 검색" value="${esc(filter)}"><select class="pm-input" id="pm-folder-filter"><option value="">전체 폴더</option><option value="__none__" ${folderFilter==='__none__'?'selected':''}>미분류</option>${data.folders.map(f=>`<option value="${esc(f.id)}" ${folderFilter===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></div>
<div class="pm-row">${data.folders.map(f=>`<button data-action="rename-folder" data-id="${esc(f.id)}" title="폴더 이름 수정">📁 ${esc(f.name)}</button>`).join('')}</div>
<div id="pm-list">${visible.filter(x=>folderFilter!=='__none__'||!x.folder).map(x=>`<div class="pm-card ${selected===x.id?'active':''}"><div class="pm-row space"><span class="pm-card-title">${x.pinned?'📌 ':''}${esc(x.title||'제목 없음')}</span><button data-action="select" data-id="${esc(x.id)}">펼치기 ❯</button></div><div class="pm-muted" style="white-space:pre-wrap;overflow-wrap:anywhere;max-height:45px;overflow:hidden">${esc(x.text.slice(0,110))}</div><div class="pm-muted">${x.tags.map(t=>'#'+esc(t)).join(' ')} ${x.shown?'· 위젯 표시 중':''}</div></div>`).join('')||'<p class="pm-muted">메모가 없어요.</p>'}</div>
${n?`<div class="pm-editor"><div class="pm-row space"><b>💌 ${esc(n.title||'메모 편집')}</b><div><button data-action="back">← 목록</button> <button data-action="delete" data-id="${esc(n.id)}">삭제</button></div></div>
<div class="pm-lace">✿ ୨୧ ─── ♡ ─── ୨୧ ✿</div>
<div class="pm-tabs"><button data-tab="content" class="${editorTab==='content'?'active':''}">💌 내용·분류</button><button data-tab="style" class="${editorTab==='style'?'active':''}">🎨 꾸미기</button><button data-tab="settings" class="${editorTab==='settings'?'active':''}">🔐 설정</button></div>
${editorTab==='content'?`<label class="pm-label">제목</label><input id="pm-title" class="pm-input" value="${esc(n.title)}" ${n.contentLocked?'disabled':''}>
<label class="pm-label">내용</label><textarea id="pm-text" class="pm-input" rows="7" ${n.contentLocked?'disabled':''}>${esc(n.text)}</textarea>
<label class="pm-label">🌷 폴더</label><select id="pm-note-folder" class="pm-input" ${n.contentLocked?'disabled':''}><option value="">미분류</option>${data.folders.map(f=>`<option value="${esc(f.id)}" ${n.folder===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select>
<label class="pm-label">🏷️ 태그 (쉼표로 구분)</label><input id="pm-tags" class="pm-input" value="${esc(n.tags.join(', '))}" ${n.contentLocked?'disabled':''}>`:''}
${editorTab==='style'?`<div class="pm-muted">각 메모를 원하는 색으로 자유롭게 꾸밀 수 있어요 ♡</div><div class="pm-preview" style="background:${esc(n.style.bg)};color:${esc(n.style.fg)};border-radius:${Number(n.style.radius)||0}px;font-size:${Number(n.style.fontSize)||14}px">${esc(n.emoji||'💌')} ${esc(n.title)}<div class="pm-lace">✉ ─── ♡ ─── ✉</div>${esc(n.text.slice(0,180))}</div>
<label class="pm-label">메모 이모지</label><div class="pm-row">${['💌','🎀','🌷','🐰','🧸','🦋','🌙','🪻'].map(e=>`<button data-emoji="${e}" ${n.emoji===e?'class="pm-primary"':''}>${e}</button>`).join('')}</div>
<div class="pm-grid"><label class="pm-label">배경색<input id="pm-bg" class="pm-input" type="color" value="${esc(n.style.bg)}"></label><label class="pm-label">글씨색<input id="pm-fg" class="pm-input" type="color" value="${esc(n.style.fg)}"></label><label class="pm-label">제목줄 색상<input id="pm-header-color" class="pm-input" type="color" value="${esc(n.style.header||'#f1ddf5')}"></label></div>
<div class="pm-label">추천 메모지 색상</div><div class="pm-palette">${['#fff8fe','#f2e8ff','#ffebf3','#fff2d8','#e6f4ec','#ffffff','#30283b'].map(c=>`<button data-palette="bg" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
<div class="pm-label">추천 글씨색</div><div class="pm-palette">${['#34264a','#684c73','#ad638b','#6b80ac','#ffffff','#90673d'].map(c=>`<button data-palette="fg" data-color="${c}" style="background:${c}" title="${c}"></button>`).join('')}</div>
<label class="pm-label">투명도 (${n.style.opacity}%)<input id="pm-opacity" class="pm-input" type="range" min="30" max="100" value="${n.style.opacity}"></label><label class="pm-label">글자 크기 (${n.style.fontSize}px)<input id="pm-fontsize" class="pm-input" type="range" min="11" max="24" value="${n.style.fontSize}"></label><label class="pm-label">모서리 (${n.style.radius}px)<input id="pm-radius" class="pm-input" type="range" min="0" max="30" value="${n.style.radius}"></label>`:''}
${editorTab==='settings'?`<label class="pm-switch">📌 상단 고정 <input id="pm-pinned" type="checkbox" ${n.pinned?'checked':''}></label><label class="pm-switch">💌 위젯 표시 <input id="pm-shown" type="checkbox" ${n.shown?'checked':''}></label><label class="pm-switch">🔑 위치·크기 잠금 <input id="pm-poslock" type="checkbox" ${n.positionLocked?'checked':''}></label><label class="pm-switch">📄🔒 위젯 내용 수정 잠금 <input id="pm-contentlock" type="checkbox" ${n.contentLocked?'checked':''}></label><label class="pm-switch">🎀 쪽지로 접기 <input id="pm-folded" type="checkbox" ${n.folded?'checked':''}></label>${n.folded&&!n.positionLocked?`<button data-action="move-folded">✥ 접힌 쪽지 이동 손잡이 ${foldMoveId===n.id?'숨기기':'표시'}</button>`:''}<div class="pm-muted">잠금 기능은 서로 독립적이에요. 접힌 쪽지 이동은 위치 잠금 해제 시 가능합니다.</div>`:''}
</div>`:''}
<input id="pm-import-file" type="file" accept=".json,application/json" hidden>`;
bindPanel();}
function bindPanel(){panel.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action,id=b.dataset.id;if(a==='close'){panelOpen=false;renderPanel()}else if(a==='back'){selected='';renderPanel()}else if(a==='move-folded'){foldMoveId=foldMoveId===selected?'':selected;render()}else if(a==='new'){const n=newNote();data.notes.unshift(n);selected=n.id;editorTab='content';persist();render()}else if(a==='select'){selected=id;editorTab='content';renderPanel()}else if(a==='delete'){if(!confirm('이 메모를 삭제할까요?'))return;data.notes=data.notes.filter(n=>n.id!==id);selected='';persist();render()}else if(a==='folder'){const name=prompt('새 폴더 이름');if(!name?.trim())return;data.folders.push({id:uid(),name:name.trim()});persist();renderPanel()}else if(a==='rename-folder'){const f=data.folders.find(x=>x.id===id);if(!f)return;const name=prompt('폴더 이름 (빈칸 입력 시 삭제)',f.name);if(name===null)return;if(!name.trim()){if(!confirm('폴더를 삭제할까요? 메모는 미분류로 이동합니다.'))return;data.folders=data.folders.filter(x=>x.id!==id);data.notes.forEach(n=>{if(n.folder===id)n.folder=''});if(folderFilter===id)folderFilter='';}else f.name=name.trim();persist();renderPanel()}else if(a==='export')exportFile();else if(a==='import')$('#pm-import-file',panel).click()});
panel.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{editorTab=b.dataset.tab;renderPanel()});
const search=$('#pm-search',panel);if(search)search.oninput=e=>{filter=e.target.value;const pos=e.target.selectionStart;renderPanel();const next=$('#pm-search',panel);next.focus();next.setSelectionRange(pos,pos)};
const ff=$('#pm-folder-filter',panel);if(ff)ff.onchange=e=>{folderFilter=e.target.value;renderPanel()};
const file=$('#pm-import-file',panel);if(file)file.onchange=async e=>{const f=e.target.files?.[0];if(f)await importFile(f)};
const n=noteById(selected);if(!n)return;
const bind=(id,event,fn,refresh=false)=>{const el=$('#'+id,panel);if(el)el.addEventListener(event,e=>{fn(e.target);if(refresh)render();else renderWidgets()})};
bind('pm-title','input',e=>update(n,{title:e.value}));bind('pm-text','input',e=>update(n,{text:e.value}));bind('pm-tags','change',e=>update(n,{tags:[...new Set(e.value.split(',').map(s=>s.trim().replace(/^#/, '')).filter(Boolean))]}),true);
bind('pm-note-folder','change',e=>update(n,{folder:e.value}),true);bind('pm-pinned','change',e=>update(n,{pinned:e.checked}),true);bind('pm-shown','change',e=>update(n,{shown:e.checked}),true);bind('pm-poslock','change',e=>update(n,{positionLocked:e.checked}),true);bind('pm-contentlock','change',e=>update(n,{contentLocked:e.checked}),true);bind('pm-folded','change',e=>update(n,{folded:e.checked}),true);
panel.querySelectorAll('[data-emoji]').forEach(b=>b.onclick=()=>{update(n,{emoji:b.dataset.emoji});render()});
panel.querySelectorAll('[data-palette]').forEach(b=>b.onclick=()=>{n.style[b.dataset.palette]=b.dataset.color;update(n,{});render()});
for(const [id,prop] of [['pm-bg','bg'],['pm-fg','fg'],['pm-header-color','header'],['pm-opacity','opacity'],['pm-fontsize','fontSize'],['pm-radius','radius']])bind(id,'input',e=>{n.style[prop]=['bg','fg','header'].includes(prop)?e.value:Number(e.value);update(n,{})});
}
function renderWidgets(){widgets.replaceChildren();if(!current)return;for(const n of data.notes.filter(n=>n.shown)){
const el=document.createElement('section');el.className='pm-widget'+(n.folded?' pm-folded':'');el.dataset.id=n.id;
const bg=n.style?.bg||'#fff8fe',fg=n.style?.fg||'#34264a',header=n.style?.header||'#f1ddf5';
const x=Math.max(0,Math.min(innerWidth-(n.folded?48:60),Number(n.x)||0)),y=Math.max(0,Math.min(innerHeight-(n.folded?48:50),Number(n.y)||0));
el.style.cssText=`left:${x}px;top:${y}px;width:${n.folded?48:n.width}px;height:${n.folded?48:n.height}px;background:${bg};color:${fg};opacity:${n.folded?1:n.style.opacity/100};border-radius:${n.folded?50:n.style.radius}px;font-size:${n.style.fontSize}px;--pm-header:${header}`;
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
 el.innerHTML=`<div class="pm-widget-head"><strong>${esc(n.emoji||'💌')} ${esc(n.title)}</strong><div class="pm-widget-actions"><button data-action="fold" title="리본으로 접기">▾</button><button class="pm-drag-handle" type="button" title="누른 채 이동" ${n.positionLocked?'disabled':''}>✥</button><button data-action="position" title="위치·크기 잠금">${n.positionLocked?'🔐':'🔓'}</button><button data-action="content" title="위젯 내용 수정 잠금">${n.contentLocked?'📄🔒':'📝'}</button><button data-action="hide" title="위젯 숨기기">×</button></div></div><div class="pm-paperline">✉ ───── ♡ ───── ✉</div><textarea placeholder="메모 내용" ${n.contentLocked?'readonly':''}></textarea>${n.positionLocked?'':'<div class="pm-resize" title="크기 조절"></div>'}`;
 const ta=$('textarea',el);ta.value=n.text;ta.style.color=fg;ta.oninput=()=>{update(n,{text:ta.value});const editor=$('#pm-text',panel);if(editor&&selected===n.id&&document.activeElement!==editor)editor.value=n.text};
 el.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>{const a=b.dataset.action;if(a==='hide')update(n,{shown:false});if(a==='position')update(n,{positionLocked:!n.positionLocked});if(a==='content')update(n,{contentLocked:!n.contentLocked});if(a==='fold')update(n,{folded:true});render()});
 if(!n.positionLocked){attachDrag($('.pm-drag-handle',el),el,n,'move',false);const grip=$('.pm-resize',el);if(grip)attachDrag(grip,el,n,'resize',false)}
}
widgets.appendChild(el);
}}
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
      update(n,{x:parseFloat(el.style.left)||0,y:parseFloat(el.style.top)||0,...(n.folded?{}:{width:el.offsetWidth,height:el.offsetHeight})});
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
async function importFile(file){if(file.size>5*1024*1024){alert('백업 파일이 5MB를 초과해요.');return}let parsed;try{parsed=JSON.parse(await file.text())}catch{alert('JSON 파일을 읽을 수 없어요.');return}if(parsed?.format!=='pocket-memo-backup'||parsed.version!==1||!Array.isArray(parsed.data?.notes)||!Array.isArray(parsed.data?.folders)){alert('Pocket Memo v1 백업 파일이 아니에요.');return}if(parsed.roomId!==current){alert('이 백업은 다른 RP방의 파일이에요. 방별 분리를 위해 가져오지 않았어요.');return}const incoming=parsed.data;if(incoming.notes.length>10000||incoming.folders.length>1000){alert('백업 항목이 너무 많아요.');return}const mode=prompt('백업 복원 방법을 선택해 주세요.\n1 = 기존 메모와 병합 (같은 ID는 기존 메모 유지)\n2 = 현재 방 메모를 백업으로 교체\n취소 = 복원하지 않음','1');if(mode!=='1'&&mode!=='2')return;if(mode==='2'&&!confirm('현재 방 메모가 백업 내용으로 교체됩니다. 계속할까요?'))return;
const normalize=n=>{const base=newNote();return {...base,...n,id:String(n.id||uid()),title:String(n.title||''),text:String(n.text||''),folder:String(n.folder||''),tags:Array.isArray(n.tags)?n.tags.map(String):[],style:{...base.style,...(n.style&&typeof n.style==='object'?n.style:{})},folded:!!n.folded,emoji:String(n.emoji||'💌'),shown:!!n.shown,positionLocked:!!n.positionLocked,contentLocked:!!n.contentLocked}};
const folders=incoming.folders.filter(f=>f&&typeof f.id==='string'&&typeof f.name==='string').map(f=>({id:f.id,name:f.name}));const notes=incoming.notes.filter(n=>n&&typeof n==='object').map(normalize);
if(mode==='2'){data={version:1,folders,notes}}else{const folderIds=new Set(data.folders.map(f=>f.id)),noteIds=new Set(data.notes.map(n=>n.id));for(const f of folders)if(!folderIds.has(f.id)){data.folders.push(f);folderIds.add(f.id)}for(const n of notes)if(!noteIds.has(n.id)){data.notes.push(n);noteIds.add(n.id)}}persist();selected='';render();alert('메모 복원이 완료됐어요.')}
$('#pm-launch',root).onclick=()=>{changeRoom();panelOpen=!panelOpen;renderPanel()};
data=read(current);render();setInterval(changeRoom,900);
})();
