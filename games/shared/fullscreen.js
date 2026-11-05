/* Educator Space · Full screen button shared by the games in /games (Gene Detectives, Chem Detectives, Contaminated,
   Element Wars, Build an Atom). It adds itself to the right end of the page's header.top. Works in its own tab and inside
   the Educator Space frame (the frame allows full screen). Hidden where the browser can't go full screen. */
(function () {
  const el = document.documentElement, head = document.querySelector('header.top');
  const can = (document.fullscreenEnabled || document.webkitFullscreenEnabled) && (el.requestFullscreen || el.webkitRequestFullscreen);
  if (!can || !head) return;
  const st = document.createElement('style');
  st.textContent = '.fsbtn{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:inherit;font:600 .8rem system-ui,-apple-system,"Segoe UI",sans-serif;cursor:pointer;white-space:nowrap}.fsbtn:hover{border-color:currentColor}.fsbtn svg{width:16px;height:16px;flex:none}@media (max-width:560px){.fsbtn span{display:none}}@media print{.fsbtn{display:none}}';
  document.head.appendChild(st);
  const on = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const ic = f => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${f ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'}"/></svg>`;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'fsbtn';
  const sync = () => { const f = on(); b.innerHTML = ic(f) + `<span>${f ? 'Exit full screen' : 'Full screen'}</span>`; b.title = f ? 'Exit full screen (Esc)' : 'Full screen'; b.setAttribute('aria-label', f ? 'Exit full screen' : 'Full screen'); };
  b.onclick = () => { try { if (on()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else { const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (p && p.catch) p.catch(() => {}); } } catch (e) {} };
  document.addEventListener('fullscreenchange', sync); document.addEventListener('webkitfullscreenchange', sync); sync();
  /* sit right after the last header item (before a full-width turn bar, if there is one), pushed to the right */
  const kids = [...head.children].filter(c => c.id !== 'turnbar'), last = kids[kids.length - 1];
  if (last && last !== head.firstElementChild) last.style.marginLeft = 'auto'; else b.style.marginLeft = 'auto';
  head.insertBefore(b, last ? last.nextSibling : null);
})();
