/* Science Arcade engine: one canvas (960×540 logical), keyboard + mouse + touch input, a quiz card, sounds,
   best scores, and the hub. Each game registers with AR.reg({ id, title, ..., make(api), preview(ctx, t) }). */
const AR = (() => {
  const W = 960, H = 540, LIST = [];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = { get(k, d) { try { const v = localStorage.getItem('arcade.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('arcade.' + k, JSON.stringify(v)); } catch (e) {} } };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ── progress: XP, levels and badges, saved only in this browser (shared by every arcade page on the site) ── */
  const BADGES = [
    ['explorer', 'Science Explorer', 'Play 3 different games', '🧭', p => Object.keys(p.played).length >= 3],
    ['bio', 'Biology Pro', 'Win 2 biology games', '🌿', p => Object.values(p.wins).filter(s => s === 'Biology').length >= 2],
    ['chem', 'Chemistry Whiz', 'Win 2 chemistry games', '⚗️', p => Object.values(p.wins).filter(s => s === 'Chemistry').length >= 2],
    ['phys', 'Physics Ace', 'Win 2 physics games', '🚀', p => Object.values(p.wins).filter(s => s === 'Physics').length >= 2],
    ['earth', 'Space Cadet', 'Win an Earth & space game', '🌍', p => Object.values(p.wins).some(s => s === 'Earth & Space')],
    ['quiz', 'Quiz Champ', 'Answer 25 questions right', '💡', p => p.qright >= 25],
    ['score', 'High Scorer', 'Score 3,000 in one game', '⭐', p => p.top >= 3000],
    ['master', 'Lab Master', 'Reach level 5', '🏆', p => Math.floor(p.xp / 1000) + 1 >= 5]];
  const PROG = {
    get() { return Object.assign({ xp: 0, played: {}, wins: {}, qright: 0, top: 0, badges: [] }, store.get('prog', {})); },
    level(xp) { return { lv: Math.floor(xp / 1000) + 1, at: xp % 1000 }; },
    record(g, A, won) { const p = PROG.get(), gain = Math.round(A.score / 10) + (won ? 100 : 20) + A.stats.right * 10;
      p.xp += gain; p.played[g.id] = 1; if (won) p.wins[g.id] = g.subject || 'Biology'; p.qright += A.stats.right; p.top = Math.max(p.top, A.score);
      const fresh = BADGES.filter(b => !p.badges.includes(b[0]) && b[4](p)); fresh.forEach(b => p.badges.push(b[0])); store.set('prog', p); return { gain, fresh, p }; }
  };

  /* ── sound: tiny square-wave bleeps ── */
  let actx = null, muted = store.get('muted', false);
  function tone(f, d = .08, type = 'square', vol = .05, slide = 0) {
    if (muted) return; try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02); } catch (e) {} }
  const SFX = { shoot: () => tone(880, .05, 'square', .025, -400), hit: () => tone(220, .09, 'square', .04, -120), boom: () => { tone(120, .3, 'sawtooth', .06, -90); tone(60, .35, 'square', .04, -20); },
    good: () => { tone(660, .07); setTimeout(() => tone(990, .09), 70); }, bad: () => tone(160, .22, 'sawtooth', .05, -60), pick: () => tone(1200, .04, 'triangle', .04),
    power: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, .08, 'triangle', .05), i * 60)), boss: () => [110, 104, 98].forEach((f, i) => setTimeout(() => tone(f, .25, 'sawtooth', .06), i * 220)), flap: () => tone(500, .05, 'triangle', .03, 200) };

  /* ── drawing helpers shared by the games ── */
  const shade = (hex, f) => { const n = parseInt(hex.slice(1, 7), 16), ch = k => { const v = (n >> k) & 255; return Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f); }; return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
  const D = {
    shade,
    /* glossy, toy-like shapes for the brighter middle school games */
    gloss(c, x, y, r, col) { const g = c.createRadialGradient(x - r * .35, y - r * .4, r * .08, x, y, r * 1.05); g.addColorStop(0, shade(col, .75)); g.addColorStop(.35, col); g.addColorStop(1, shade(col, -.45)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); },
    glossRect(c, x, y, w, h, r, col) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, shade(col, .45)); g.addColorStop(.5, col); g.addColorStop(1, shade(col, -.35)); c.fillStyle = g; D.rr(c, x, y, w, h, r); c.fill(); c.fillStyle = 'rgba(255,255,255,.28)'; D.rr(c, x + 4, y + 3, w - 8, Math.min(h * .3, 10), r / 2); c.fill(); },
    cloud(c, x, y, s, a = .9) { c.save(); c.globalAlpha = a; c.fillStyle = '#fff'; [[0, 0, 1], [.9, .15, .8], [-.9, .2, .75], [.4, -.45, .7]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); }); c.restore(); },
    sparkle(c, x, y, r, col = '#fff') { c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill(); c.restore(); },
    text(c, s, x, y, o = {}) { c.save(); c.font = `${o.bold === false ? '' : '700 '}${o.size || 16}px ${o.pix ? "'Press Start 2P', monospace" : "'Atkinson Hyperlegible', system-ui, sans-serif"}`; c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
      if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 12; } c.fillStyle = o.color || '#fff'; c.fillText(s, x, y); c.restore(); },
    rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); },
    glow(c, col, b = 14) { c.shadowColor = col; c.shadowBlur = b; },
    stars(c, t, n = 70, sp = 20, col = '#9fb6ff') { c.save(); for (let i = 0; i < n; i++) { const x = (i * 137.5) % W, y = ((i * 71.3) + t * sp * (1 + (i % 3))) % H, r = i % 5 ? 1 : 1.8; c.globalAlpha = .25 + (i % 4) * .15; c.fillStyle = col; c.fillRect(x, y, r, r); } c.restore(); },
    bg(c, top, bot) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, 0, W, H); },
    /* a cute blob with eyes, used for germs and molecules */
    face(c, x, y, r, col = '#111') { c.fillStyle = '#fff'; c.beginPath(); c.arc(x - r * .32, y - r * .1, r * .22, 0, 7); c.arc(x + r * .32, y - r * .1, r * .22, 0, 7); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x - r * .28, y - r * .06, r * .1, 0, 7); c.arc(x + r * .36, y - r * .06, r * .1, 0, 7); c.fill(); },
    spiky(c, x, y, r, col, spikes = 10, t = 0, inner = '#fff3') { c.save(); c.translate(x, y); c.rotate(t); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = r * .14; c.lineCap = 'round';
      for (let i = 0; i < spikes; i++) { const a = i / spikes * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * r * .8, Math.sin(a) * r * .8); c.lineTo(Math.cos(a) * r * 1.3, Math.sin(a) * r * 1.3); c.stroke(); c.beginPath(); c.arc(Math.cos(a) * r * 1.34, Math.sin(a) * r * 1.34, r * .14, 0, 7); c.fill(); }
      c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); c.fillStyle = inner; c.beginPath(); c.arc(-r * .3, -r * .3, r * .35, 0, 7); c.fill(); c.restore(); },
    ship(c, x, y, s = 1, col = '#bfe3ff', acc = '#28e0d0') { c.save(); c.translate(x, y); c.scale(s, s); D.glow(c, acc, 16);
      c.fillStyle = col; c.beginPath(); c.moveTo(0, -26); c.lineTo(10, -4); c.lineTo(24, 14); c.lineTo(8, 10); c.lineTo(0, 18); c.lineTo(-8, 10); c.lineTo(-24, 14); c.lineTo(-10, -4); c.closePath(); c.fill();
      c.shadowBlur = 0; c.fillStyle = acc; c.beginPath(); c.ellipse(0, -6, 5, 9, 0, 0, 7); c.fill(); c.fillStyle = '#ff9f40'; c.beginPath(); c.moveTo(-5, 18); c.lineTo(0, 28 + Math.random() * 8); c.lineTo(5, 18); c.fill(); c.restore(); }
  };

  /* ── particles and floating text, drawn on top of every game ── */
  let FX = [];
  const fx = {
    burst(x, y, col, n = 14, sp = 160) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = rnd(sp * .3, sp); FX.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: rnd(.35, .8), col, r: rnd(1.5, 3.5) }); } },
    pop(x, y, s, col = '#fff') { FX.push({ x, y, vx: 0, vy: -40, t: 0, life: 1, col, s }); },
    update(dt) { FX.forEach(p => { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (!p.s) { p.vx *= .96; p.vy *= .96; } }); FX = FX.filter(p => p.t < p.life); },
    draw(c) { FX.forEach(p => { c.globalAlpha = Math.max(0, 1 - p.t / p.life); if (p.s) D.text(c, p.s, p.x, p.y, { size: 15, align: 'center', color: p.col, glow: p.col, blur: 8 }); else { c.fillStyle = p.col; c.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r); } }); c.globalAlpha = 1; }
  };

  /* ── input ── */
  const KMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ' ': 'fire', Enter: 'enter', Shift: 'alt', e: 'alt', E: 'alt', x: 'alt', X: 'alt', q: 'alt2', Q: 'alt2', z: 'alt2', Z: 'alt2', '1': '1', '2': '2', '3': '3', '4': '4' };
  let held = {}, hitNow = {}, typed = [], ptr = { x: 0, y: 0, down: false, tap: false, moved: false };
  function bindInput(stage) {
    window.onkeydown = e => { if (e.target.closest && e.target.closest('input,textarea')) return; const k = KMAP[e.key];
      if ((e.key === 'p' || e.key === 'P' || e.key === 'Escape') && S.state === 'play') { pause(true); e.preventDefault(); return; }
      if (S.onKey && S.onKey(e)) { e.preventDefault(); return; }
      if (S.state === 'play' && e.key.length === 1) typed.push(e.key.toLowerCase());
      if (k) { if (!held[k]) hitNow[k] = true; held[k] = true; if (S.state === 'play' && /^(Arrow| )/.test(e.key)) e.preventDefault(); } };
    window.onkeyup = e => { const k = KMAP[e.key]; if (k) held[k] = false; };
    const pos = e => { const r = stage.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width * W; ptr.y = (e.clientY - r.top) / r.height * H; };
    stage.onpointerdown = e => { if (e.target.closest('.ov, .pad')) return; pos(e); ptr.down = true; ptr.tap = true; held.ptr = true; };
    stage.onpointermove = e => { pos(e); ptr.moved = true; };
    window.onpointerup = () => { ptr.down = false; held.ptr = false; };
    window.onblur = () => { held = {}; if (S.state === 'play') pause(true); };
    document.onvisibilitychange = () => { if (document.hidden && S.state === 'play') pause(true); };
  }

  /* ── one game session ── */
  const S = { state: 'none', g: null, game: null, onKey: null };
  let cv, ctx, raf = 0, lastT = 0, toastT = 0;
  function api(g) {
    return {
      W, H, D, fx, rnd, pick, clamp, shuffle, sfx: SFX,
      key: k => !!held[k], hit: k => !!hitNow[k], typed: () => typed, ptr,
      score: 0, lives: 3, t: 0, stats: { right: 0, asked: 0 },
      add(n, x, y, col) { this.score = Math.max(0, this.score + n); if (x !== undefined) fx.pop(x, y, (n > 0 ? '+' : '') + n, col || (n > 0 ? '#ffe066' : '#ff6b81')); },
      hurt(msg) { this.lives--; SFX.bad(); S.shake = .35; if (msg) this.toast(msg); if (this.lives <= 0) this.over(false); },
      toast(msg, sec = 2.6) { const el = $('#toast'); if (!el) return; el.innerHTML = msg; el.hidden = false; toastT = sec; },
      ask(q) { return quiz(q, this); },
      over(won, line) { if (S.state === 'over') return; S.state = 'over'; setTimeout(() => gameOver(won, line), won ? 500 : 900); },
      shake(s = .3) { S.shake = s; }
    };
  }
  function frame(t) {
    raf = requestAnimationFrame(frame); const dt = Math.min(.05, (t - lastT) / 1000 || 0); lastT = t;
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    ctx.setTransform(w / W, 0, 0, h / H, 0, 0);
    const A = S.api, G = S.game;
    if (S.state === 'play') { A.t += dt; G.update(dt); fx.update(dt); if (S.shake) S.shake = Math.max(0, S.shake - dt); }
    else if (S.state === 'title' || S.state === 'over') { if (G.idle) G.idle(dt); fx.update(dt); }
    ctx.save(); if (S.shake && S.state === 'play') ctx.translate(rnd(-6, 6) * S.shake, rnd(-6, 6) * S.shake);
    ctx.clearRect(-20, -20, W + 40, H + 40); G.draw(ctx); fx.draw(ctx); ctx.restore();
    if (S.state !== 'title') hud(ctx, A, G);
    hitNow = {}; typed = []; ptr.tap = false; ptr.moved = false;
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) { const el = $('#toast'); if (el) el.hidden = true; } }
  }
  function hud(c, A, G) {
    const col = S.g.color, h = G.hud ? G.hud() : {};
    c.save(); c.fillStyle = 'rgba(5,10,28,.6)'; c.fillRect(0, 0, W, 34); c.fillStyle = col; c.globalAlpha = .6; c.fillRect(0, 34, W, 1.5); c.globalAlpha = 1;
    D.text(c, 'SCORE ' + String(A.score).padStart(5, '0'), 14, 23, { pix: true, size: 12, color: '#fff', glow: col, blur: 6 });
    if (h.mid) D.text(c, h.mid, W / 2, 23, { pix: true, size: 11, align: 'center', color: col, glow: col, blur: 6 });
    if (!h.noLives) for (let i = 0; i < Math.max(0, A.lives); i++) { const x = W - 24 - i * 26, y = 17; c.fillStyle = '#ff5d7a'; c.beginPath(); c.moveTo(x, y + 7); c.bezierCurveTo(x - 12, y - 2, x - 6, y - 10, x, y - 4); c.bezierCurveTo(x + 6, y - 10, x + 12, y - 2, x, y + 7); c.fill(); }
    if (h.right) D.text(c, h.right, W - 24 - (h.noLives ? 0 : Math.max(0, A.lives) * 26), 23, { pix: true, size: 10, align: 'right', color: '#cfe0ff' });
    c.restore();
  }

  /* ── overlay cards ── */
  function card(html, onBind) { const ov = $('#ov'); ov.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`; ov.hidden = false; onBind && onBind(ov); const f = ov.querySelector('[data-first]') || ov.querySelector('button'); f && f.focus({ preventScroll: true }); }
  function closeCard() { const ov = $('#ov'); ov.hidden = true; ov.innerHTML = ''; S.onKey = null; }
  function titleCard() {
    const g = S.g; S.state = 'title';
    card(`<span class="eyebrow">${esc(g.topic)}</span><h3>${esc(g.title)}</h3><p>${g.intro}</p><ul>${g.how.map(h => `<li>${h}</li>`).join('')}</ul>
      <p class="small" style="color:var(--muted)">Best score: <b style="color:#fff">${store.get('best.' + g.id, 0)}</b></p>
      <div class="row"><button class="btn primary" data-first id="goBtn">Start game</button><button class="btn" id="hubBtn">All games</button></div>`, ov => {
      $('#goBtn', ov).onclick = start; $('#hubBtn', ov).onclick = () => nav(null); });
    S.onKey = e => { if (e.key === 'Enter' || e.key === ' ') { start(); return true; } return false; };
  }
  function start() { closeCard(); FX = []; held = {}; S.api = api(S.g); S.game = S.g.make(S.api); S.state = 'play'; setPad(); }
  function pause(on) {
    if (on) { S.state = 'pause'; card(`<span class="eyebrow">Paused</span><h3>Take a breath</h3><p>Press <b>P</b> or <b>Resume</b> to keep playing.</p><div class="row"><button class="btn primary" data-first id="resBtn">Resume</button><button class="btn" id="rsBtn">Restart</button><button class="btn" id="hubBtn">All games</button></div>`, ov => {
      $('#resBtn', ov).onclick = () => pause(false); $('#rsBtn', ov).onclick = () => { closeCard(); titleCard(); }; $('#hubBtn', ov).onclick = () => nav(null); });
      S.onKey = e => { if (/^(p|P|Escape|Enter)$/.test(e.key)) { pause(false); return true; } return false; }; }
    else { closeCard(); held = {}; S.state = 'play'; lastT = performance.now(); }
  }
  function quiz(q, A) {
    return new Promise(res => {
      const prev = S.state; S.state = 'quiz'; held = {};
      const order = shuffle(q.opts.map((o, i) => i));
      card(`<span class="eyebrow">${esc(q.tag || 'Quick question')}</span><h3 style="font-size:14px">${esc(q.q)}</h3><div class="opts">${order.map((i, n) => `<button data-i="${i}"><kbd>${n + 1}</kbd>${esc(q.opts[i])}</button>`).join('')}</div><div id="qWhy"></div>`, ov => {
        let done = false;
        const choose = i => { if (done) return; done = true; const ok = i === q.a; A.stats.asked++; if (ok) { A.stats.right++; SFX.good(); } else SFX.bad();
          ov.querySelectorAll('.opts button').forEach(b => { b.disabled = true; const bi = +b.dataset.i; if (bi === q.a) b.classList.add('right'); else if (bi === i) b.classList.add('wrong'); });
          $('#qWhy', ov).innerHTML = `<div class="why"><b>${ok ? 'Correct!' : 'Not quite.'}</b> ${esc(q.why || '')}</div><div class="row"><button class="btn primary" id="qGo">${ok ? (q.reward || 'Continue') : 'Continue'}</button></div>`;
          const go = () => { closeCard(); S.state = prev === 'quiz' ? 'play' : prev; lastT = performance.now(); res(ok); };
          $('#qGo', ov).onclick = go; $('#qGo', ov).focus({ preventScroll: true });
          S.onKey = e => { if (e.key === 'Enter' || e.key === ' ') { go(); return true; } return true; }; };
        ov.querySelectorAll('.opts button').forEach(b => b.onclick = () => choose(+b.dataset.i));
        S.onKey = e => { const n = +e.key; if (n >= 1 && n <= order.length) { choose(order[n - 1]); return true; } return false; };
      });
    });
  }
  function gameOver(won, line) {
    const g = S.g, A = S.api, best = store.get('best.' + g.id, 0), nb = A.score > best; if (nb) store.set('best.' + g.id, A.score);
    S.state = 'over'; setPad(true); const tEl = $('#toast'); if (tEl) tEl.hidden = true; toastT = 0;
    const pr = PROG.record(g, A, won), L = PROG.level(pr.p.xp);
    card(`<span class="eyebrow">${won ? 'You win!' : 'Game over'}</span><h3>${won ? esc(g.winTitle || 'Mission complete') : esc(g.loseTitle || 'Out of lives')}</h3>
      <div class="big">${A.score}</div><p>${nb ? '<b style="color:#ffe066">New best score!</b>' : `Best: <b>${Math.max(best, A.score)}</b>`}${A.stats.asked ? ` · Questions: <b>${A.stats.right}/${A.stats.asked}</b>` : ''}</p>
      <p class="xpline"><b>+${pr.gain} XP</b> · Level ${L.lv} (${L.at}/1000 XP)</p>${pr.fresh.map(b => `<p class="newbadge"><span>${b[3]}</span> New badge: <b>${esc(b[1])}</b></p>`).join('')}
      ${line ? `<p>${line}</p>` : ''}${g.recap ? `<div class="why"><b>Remember:</b> ${g.recap}</div>` : ''}
      <div class="row"><button class="btn primary" data-first id="agBtn">Play again</button><button class="btn" id="hubBtn">All games</button></div>`, ov => {
      $('#agBtn', ov).onclick = start; $('#hubBtn', ov).onclick = () => nav(null); });
    S.onKey = e => { if (e.key === 'Enter') { start(); return true; } return false; };
  }
  /* on-screen buttons for touch screens */
  const coarse = () => window.matchMedia && matchMedia('(pointer: coarse)').matches;
  function setPad(hide) {
    const pad = $('#pad'); if (!pad) return; const p = S.g.pad; if (hide || !p || !coarse()) { pad.className = 'pad'; pad.innerHTML = ''; return; }
    const b = (k, l, act) => `<button data-k="${k}" class="${act ? 'act' : ''}" aria-label="${l}">${l}</button>`;
    pad.innerHTML = `<div class="grp">${(p.dirs || []).map(k => b(k, { left: '◀', right: '▶', up: '▲', down: '▼' }[k])).join('')}</div><div class="grp">${(p.acts || []).map(([k, l]) => b(k, l, true)).join('')}</div>`; pad.className = 'pad on';
    pad.querySelectorAll('button').forEach(el => { const k = el.dataset.k; el.onpointerdown = e => { e.preventDefault(); if (!held[k]) hitNow[k] = true; held[k] = true; }; el.onpointerup = el.onpointerleave = el.onpointercancel = () => { held[k] = false; }; });
  }

  /* ── pages ── */
  let hubRaf = 0;
  function stopAll() { cancelAnimationFrame(raf); cancelAnimationFrame(hubRaf); raf = hubRaf = 0; S.state = 'none'; S.onKey = null; window.onkeydown = window.onkeyup = null; }
  function nav(id, replace) {
    const u = new URL(location.href); if (id) u.searchParams.set('g', id); else u.searchParams.delete('g');
    try { history[replace ? 'replaceState' : 'pushState']({}, '', u); } catch (e) {} render();
  }
  function render() {
    stopAll(); const id = new URLSearchParams(location.search).get('g'), g = LIST.find(x => x.id === id), app = $('#app');
    document.body.classList.toggle('ingame', !!g);
    if (!g) { document.title = 'Science Arcade'; hub(app); return; }
    document.title = g.title + ' · Science Arcade';
    app.innerHTML = `<div class="stage" id="stage" style="--c:${g.color}"><canvas id="cv" aria-label="${esc(g.title)} game"></canvas><div class="toast" id="toast" hidden></div><div class="pad" id="pad"></div><div class="ov" id="ov" hidden></div></div>
      <div class="under"><span class="keys">${g.keys}</span><span><kbd style="font:10px var(--pix)">P</kbd> pause</span></div><p class="rotate">Turn your phone sideways for a bigger screen.</p>`;
    document.body.style.setProperty('--c', g.color);
    cv = $('#cv'); ctx = cv.getContext('2d'); S.g = g; S.api = api(g); S.game = g.make(S.api); bindInput($('#stage'));
    lastT = performance.now(); raf = requestAnimationFrame(frame); titleCard();
  }
  const CFG = { title: 'Science Arcade', lead: 'Play, learn and master key science ideas.', foot: 'SCIENCE HAS NEVER BEEN MORE FUN' };
  const DIFF = { Easy: '#4be37a', Medium: '#ffd23f', Hard: '#ff5d7a' };
  let filt = 'All';
  function progPanel() { const p = PROG.get(), L = PROG.level(p.xp);
    return `<aside class="prog" aria-label="Your progress"><h2><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 20v-6M12 20V8M19 20V4"/></svg>Your progress</h2>
      <div class="lvl"><b>Level ${L.lv}</b><span class="star">★</span></div><div class="bar"><i style="width:${L.at / 10}%"></i></div><p class="small">${L.at} / 1000 XP</p>
      <h3>Badges <span class="small">${p.badges.length}/${BADGES.length}</span></h3><div class="badges">${BADGES.map(b => `<span class="bdg ${p.badges.includes(b[0]) ? 'on' : ''}" title="${esc(b[1])}: ${esc(b[2])}"><i>${b[3]}</i><small>${esc(b[1])}</small></span>`).join('')}</div>
      <p class="small note">Saved in this browser only.</p><div class="keep"><span>🏆</span><b>Keep playing!</b><small>${p.badges.length ? 'You’re on a roll!' : 'Win a game to earn your first badge.'}</small></div></aside>`; }
  function hub(app) {
    const subs = ['All', ...new Set(LIST.map(g => g.subject).filter(Boolean))], vis = LIST.filter(g => filt === 'All' || g.subject === filt);
    app.innerHTML = `<div class="hubwrap"><div class="hubmain"><section class="banner"><h1>${CFG.title.replace(/^(\S+)/, '<em>$1</em>')}</h1><p>${esc(CFG.lead)}</p></section>
      ${subs.length > 2 ? `<div class="chips" role="tablist">${subs.map(s => `<button role="tab" aria-selected="${s === filt}" data-f="${esc(s)}">${esc(s === 'All' ? 'All games' : s)}</button>`).join('')}</div>` : ''}
      <div class="grid ${CFG.cards ? 'v2' : ''}">${vis.map(g => CFG.cards ? `<button class="tile v2" data-g="${g.id}" style="--c:${g.color}" aria-label="Play ${esc(g.title)}: ${esc(g.sub)}"><canvas width="480" height="270" aria-hidden="true"></canvas>
      <div class="tb"><h2>${esc(g.title)}</h2><p>${esc(g.sub)}</p><div class="tf">${g.diff ? `<span class="diff" style="--d:${DIFF[g.diff]}"><i></i>${g.diff}</span>` : '<span></span>'}<span class="playb">Play ▶</span></div></div>${store.get('best.' + g.id, 0) ? `<span class="best">BEST<b>${store.get('best.' + g.id, 0)}</b></span>` : ''}</button>` : `<button class="tile" data-g="${g.id}" style="--c:${g.color}" aria-label="Play ${esc(g.title)}: ${esc(g.sub)}">
      <div class="th"><span class="ti">${g.icon}</span><div><h2>${esc(g.title)}</h2><div class="sub">${esc(g.sub)}</div></div></div>
      <canvas width="480" height="270" aria-hidden="true"></canvas>${store.get('best.' + g.id, 0) ? `<span class="best">BEST<b>${store.get('best.' + g.id, 0)}</b></span>` : ''}<span class="topic">${esc(g.topic)}</span>${g.diff ? `<span class="diff" style="--d:${DIFF[g.diff]}"><i></i>${g.diff}</span>` : ''}<span class="playb">Play ▶</span></button>`).join('')}</div>
      <p class="foot">${CFG.foot}</p></div>${progPanel()}</div>`;
    app.querySelectorAll('.tile').forEach(b => b.onclick = () => nav(b.dataset.g));
    app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filt = b.dataset.f; cancelAnimationFrame(hubRaf); hub(app); });
    const cvs = [...app.querySelectorAll('.tile canvas')], cs = cvs.map(c => c.getContext('2d')), still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = t => { cvs.forEach((c, i) => { const x = cs[i]; x.setTransform(c.width / W, 0, 0, c.height / H, 0, 0); x.clearRect(0, 0, W, H); try { vis[i].preview(x, t / 1000); } catch (e) {} }); if (!still) hubRaf = requestAnimationFrame(draw); };
    hubRaf = requestAnimationFrame(draw);
  }
  function boot() {
    let emb = false; try { emb = window.self !== window.top; } catch (e) { emb = true; } if (emb && new URLSearchParams(location.search).get('g')) document.body.classList.add('embed');
    $('#home').onclick = () => nav(null); $('#backBtn').onclick = () => nav(null);
    const mb = $('#muteBtn'), ms = () => { mb.textContent = muted ? 'Sound off' : 'Sound on'; mb.setAttribute('aria-pressed', String(muted)); };
    mb.onclick = () => { muted = !muted; store.set('muted', muted); ms(); }; ms();
    window.onpopstate = render; render();
  }
  return { reg: g => LIST.push(g), boot, config: o => Object.assign(CFG, o), D, W, H, list: LIST, _S: S, PROG, BADGES };
})();
