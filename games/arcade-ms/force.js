/* Force & Motion (middle school, physical science): launch a ball to hit the target. Choose a light or heavy ball,
   aim, and set the force. Heavier balls need more force to move but push crates farther (Newton's laws). */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, GY = 480, LX = 90, LY = 440, G = 620;
  const LEVELS = [
    { tip: 'Aim and launch the ball at the target.', target: [620, GY - 24], rects: [] },
    { tip: 'The target is up on a ledge. Aim higher!', target: [740, 236], rects: [[680, 260, 140, 22, 'wall'], [520, 330, 26, 150, 'wall']] },
    { tip: 'A heavy crate is in the way. A light ball just bounces off it. Try the <b>heavy ball</b> (key 2).', target: [820, GY - 24], rects: [[560, 380, 260, 22, 'wall']], crates: [[700, GY - 60, 60, 60, 4]] },
    { tip: 'The target is under a low roof. Roll the ball across the <b>ice</b>: less friction means it keeps going (Newton’s 1st law).', target: [880, GY - 24], rects: [[420, 400, 520, 18, 'wall'], [300, GY - 6, 640, 6, 'ice']] },
    { tip: 'Bounce the ball off the wall to reach the target behind it.', target: [690, GY - 24], rects: [[600, 200, 26, 280, 'wall'], [900, 60, 26, 420, 'wall']] },
    { tip: 'Final challenge! Push the crate off the ledge with the heavy ball.', target: [860, GY - 24], rects: [[520, 300, 30, 180, 'wall'], [600, 300, 230, 22, 'wall']], crates: [[680, 240, 60, 60, 4]], blocks: true }];
  const QS = [
    { q: 'Newton’s 2nd law says that with the same force, a heavier object', opts: ['speeds up less', 'speeds up more', 'stops moving', 'gets lighter'], a: 0, why: 'Acceleration = force ÷ mass. More mass means less acceleration for the same push.' },
    { q: 'Why does a ball roll farther on ice than on grass?', opts: ['Ice has less friction', 'Ice has more gravity', 'Ice pushes the ball', 'Grass is magnetic'], a: 0, why: 'Friction is a force that slows motion. Less friction, less slowing.' },
    { q: 'When the ball hits the crate, the crate pushes back on the ball. This is Newton’s', opts: ['3rd law (action and reaction)', '1st law (inertia)', 'law of gravity', '2nd law only'], a: 0, why: 'For every action force there is an equal and opposite reaction force.' }];
  const BALL = [{ name: 'Light ball', m: 1, r: 13, col: '#3fa9ff' }, { name: 'Heavy ball', m: 3, r: 17, col: '#7a5af8' }];
  function bg(c) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9be7ff'); g.addColorStop(1, '#e8fbff'); c.fillStyle = g; c.fillRect(0, 0, W, H); D.cloud(c, 260, 110, 30, .9); D.cloud(c, 700, 80, 24, .8);
    const gr = c.createLinearGradient(0, GY, 0, H); gr.addColorStop(0, '#6fcf5a'); gr.addColorStop(1, '#3c9a3c'); c.fillStyle = gr; c.fillRect(0, GY, W, H - GY); }
  function launcher(c, ang, pow, b) { c.save(); c.translate(LX, LY); D.glossRect(c, -30, 18, 60, 22, 8, '#5b6cff'); c.rotate(-ang); D.glossRect(c, -6, -12, 70, 24, 10, '#ff7a59'); c.restore(); D.gloss(c, LX, LY + 18, 16, '#3a4a8a');
    if (pow > 0) { c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; D.rr(c, LX - 40, LY + 50, 80, 10, 5); c.fill(); c.restore(); D.glossRect(c, LX - 40, LY + 50, 80 * pow, 10, 5, pow > .8 ? '#ff5d5d' : '#ffb020'); } }
  function target(c, x, y, t) { [22, 15, 8].forEach((r, i) => D.gloss(c, x, y, r, i % 2 ? '#ffffff' : '#ff4d6d')); D.sparkle(c, x + 18, y - 18, 6 + Math.sin(t * 5) * 2, '#ffe066'); }
  function make(A) {
    const st = { lv: 0, ang: .6, pow: 0, charging: false, ball: null, shots: 3, b: 0, crates: [], drag: null, wait: 0 };
    function load() { const L = LEVELS[st.lv]; st.shots = 3; st.ball = null; st.crates = (L.crates || []).map(([x, y, w, h, m]) => ({ x, y, w, h, m, vx: 0, vy: 0 })); A.toast(L.tip, 4.2); }
    load();
    function fire() { const B = BALL[st.b], sp = (380 + st.pow * 620) / Math.sqrt(B.m) * (B.m > 1 ? 1.25 : 1); st.ball = { x: LX + Math.cos(st.ang) * 60, y: LY - Math.sin(st.ang) * 60, vx: Math.cos(st.ang) * sp, vy: -Math.sin(st.ang) * sp, r: B.r, m: B.m, t: 0, still: 0 }; st.shots--; st.pow = 0; A.sfx.shoot(); }
    function collideRect(b, R, rest = .55) { const [x, y, w, h, type] = R; const cx = A.clamp(b.x, x, x + w), cy = A.clamp(b.y, y, y + h), dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
      if (d < b.r && d > 0) { const nx = dx / d, ny = dy / d; b.x = cx + nx * b.r; b.y = cy + ny * b.r; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= (1 + rest) * vn * nx; b.vy -= (1 + rest) * vn * ny; if (Math.abs(ny) > .7) b.vx *= type === 'ice' ? .999 : .9; if (Math.abs(vn) > 120) A.sfx.hit(); } return type; } return null; }
    async function next() { A.sfx.power(); A.add(300 + st.shots * 200, W / 2, 200); A.fx.burst(LEVELS[st.lv].target[0], LEVELS[st.lv].target[1], '#ffe066', 30, 260);
      if (st.lv === 1 || st.lv === 3 || st.lv === 4) { const ok = await A.ask({ ...QS[[1, 3, 4].indexOf(st.lv)], tag: 'Physics check', reward: '+200' }); if (ok) A.add(200); }
      st.lv++; if (st.lv >= LEVELS.length) { A.over(true, 'You solved all 6 physics puzzles.'); return; } load(); }
    return {
      _st: st, _fire: fire, _LV: LEVELS,
      update(dt) {
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) next(); return; }
        if (A.typed().includes('1')) st.b = 0; if (A.typed().includes('2')) st.b = 1; if (A.hit('alt')) st.b = 1 - st.b;
        if (A.ptr.tap && A.ptr.x > 14 && A.ptr.x < 254 && A.ptr.y > 44 && A.ptr.y < 84) { st.b = A.ptr.x < 134 ? 0 : 1; }
        if (!st.ball) {
          if (A.key('up')) st.ang = Math.min(1.45, st.ang + 1.2 * dt); if (A.key('down')) st.ang = Math.max(0, st.ang - 1.2 * dt);
          if (A.key('fire')) { st.charging = true; st.pow = Math.min(1, st.pow + dt * .8); } else if (st.charging) { st.charging = false; fire(); }
          /* drag to aim: pull back from the launcher like a slingshot */
          if (A.ptr.down && !(A.ptr.y < 90 && A.ptr.x < 260)) { if (!st.drag) st.drag = true; const dx = LX - A.ptr.x, dy = A.ptr.y - LY; if (Math.hypot(dx, dy) > 10) { st.ang = A.clamp(Math.atan2(dy, dx), 0, 1.45); st.pow = A.clamp(Math.hypot(dx, dy) / 260, 0, 1); } }
          else if (st.drag) { st.drag = false; if (st.pow > .05) fire(); }
        } else {
          const b = st.ball, L = LEVELS[Math.min(5, st.lv)]; b.t += dt; b.vy += G * dt; const steps = 3;
          for (let s = 0; s < steps; s++) { b.x += b.vx * dt / steps; b.y += b.vy * dt / steps; let onIce = false;
            if (b.y > GY - b.r) { b.y = GY - b.r; if (b.vy > 0) { b.vy *= -.45; if (Math.abs(b.vy) < 40) b.vy = 0; } b.vx *= .985; }
            L.rects.forEach(R => { if (collideRect(b, R) === 'ice') onIce = true; }); if (onIce) b.vx /= .985;
            if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * .5; } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * .5; }
            st.crates.forEach(C => { const cx = A.clamp(b.x, C.x, C.x + C.w), cy = A.clamp(b.y, C.y, C.y + C.h); if (Math.hypot(b.x - cx, b.y - cy) < b.r) { const push = 2 * b.m / (b.m + C.m) * b.vx; C.vx += push * .9; b.vx = b.vx * (b.m - C.m) / (b.m + C.m); b.x += b.vx > 0 ? 2 : -3; A.sfx.hit(); if (b.m < 2 && Math.abs(push) > 20 && !st.lightHint) { st.lightHint = true; A.toast('The light ball bounced off! It doesn’t have enough momentum to push the heavy crate.', 3.4); } } }); }
          const [tx, ty] = L.target; if (Math.hypot(b.x - tx, b.y - ty) < 22 + b.r && !(L.blocks && st.crates.some(C => C.x < tx && C.x + C.w > tx))) { st.ball = null; st.wait = .7; A.sfx.good(); return; }
          const sp = Math.hypot(b.vx, b.vy); b.still = sp < 15 ? b.still + dt : 0;
          if (b.still > .6 || b.t > 9 || b.y > H + 50) { st.ball = null; if (st.shots <= 0) { A.hurt('Out of shots! Try a new angle or more force.'); if (A.lives > 0) load(); } }
        }
        st.crates.forEach(C => { C.vy += G * dt; C.x += C.vx * dt; C.y += C.vy * dt; C.vx *= Math.pow(.25, dt); let sup = false;
          LEVELS[Math.min(5, st.lv)].rects.forEach(([x, y, w, h]) => { if (C.x + C.w > x + 4 && C.x < x + w - 4 && C.y + C.h > y && C.y + C.h < y + 30 && C.vy >= 0) { C.y = y - C.h; C.vy = 0; sup = true; } });
          if (C.y + C.h > GY) { C.y = GY - C.h; C.vy = 0; } });
      },
      draw(c) {
        const L = LEVELS[Math.min(5, st.lv)]; bg(c);
        L.rects.forEach(([x, y, w, h, type]) => type === 'ice' ? D.glossRect(c, x, y, w, h + 4, 3, '#bff1ff') : D.glossRect(c, x, y, w, h, 6, '#8d6e4a'));
        target(c, L.target[0], L.target[1], A.t);
        st.crates.forEach(C => { D.glossRect(c, C.x, C.y, C.w, C.h, 6, '#d99a4e'); c.strokeStyle = '#8a5a2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(C.x + 6, C.y + 6); c.lineTo(C.x + C.w - 6, C.y + C.h - 6); c.moveTo(C.x + C.w - 6, C.y + 6); c.lineTo(C.x + 6, C.y + C.h - 6); c.stroke(); D.text(c, C.m + ' kg', C.x + C.w / 2, C.y - 8, { size: 12, align: 'center', color: '#5a3a1a' }); });
        if (!st.ball) { const B = BALL[st.b], sp = (380 + Math.max(.3, st.pow) * 620) / Math.sqrt(B.m) * (B.m > 1 ? 1.25 : 1); let x = LX + Math.cos(st.ang) * 60, y = LY - Math.sin(st.ang) * 60, vx = Math.cos(st.ang) * sp, vy = -Math.sin(st.ang) * sp;
          for (let i = 0; i < 14; i++) { x += vx * .05; y += vy * .05; vy += G * .05; c.fillStyle = `rgba(255,255,255,${.8 - i * .05})`; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); } }
        launcher(c, st.ang, st.pow, st.b);
        if (st.ball) D.gloss(c, st.ball.x, st.ball.y, st.ball.r, BALL[st.b].col); else D.gloss(c, LX + Math.cos(st.ang) * 56, LY - Math.sin(st.ang) * 56, BALL[st.b].r, BALL[st.b].col);
        BALL.forEach((B, i) => { D.glossRect(c, 14 + i * 120, 44, 112, 40, 12, i === st.b ? '#5b6cff' : '#8a95b8'); D.gloss(c, 34 + i * 120, 64, B.r * .8, B.col); D.text(c, `${i + 1} ${B.name.split(' ')[0]}`, 52 + i * 120, 61, { size: 13, color: '#fff' }); D.text(c, `${B.m} kg`, 52 + i * 120, 77, { size: 11, color: '#e0e6ff' }); });
        D.text(c, `Shots left: ${st.shots}`, W - 20, 64, { size: 16, align: 'right', color: '#1b2a5a' });
        D.text(c, `Angle ${Math.round(st.ang * 57.3)}°   Force ${Math.round(st.pow * 100)}%`, LX - 60, H - 14, { size: 13, color: '#fff' });
      },
      hud() { return { mid: `PUZZLE ${Math.min(6, st.lv + 1)}/6` }; }
    };
  }
  function preview(c, t) { bg(c); D.glossRect(c, 680, 260, 140, 22, 6, '#8d6e4a'); target(c, 740, 236, t); launcher(c, .7, 0, 0); const u = (t % 2) / 2, x = LX + 60 + u * 640, y = LY - 40 - Math.sin(u * Math.PI) * 260; D.gloss(c, x, y, 14, '#3fa9ff');
    for (let i = 1; i < 8; i++) { const uu = Math.max(0, u - i * .03), xx = LX + 60 + uu * 640, yy = LY - 40 - Math.sin(uu * Math.PI) * 260; c.fillStyle = `rgba(255,255,255,${.6 - i * .07})`; c.beginPath(); c.arc(xx, yy, 4, 0, 7); c.fill(); } }
  AR.reg({ id: 'force', subject: 'Physics', diff: 'Easy', title: 'Force & Motion', sub: 'Launch the ball and solve physics puzzles', topic: 'Forces & Newton’s laws', color: '#ff7a59',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="6" cy="17" r="3"/><path d="M8 14c3-6 8-9 13-9"/><path d="M17 4l4 1-1 4"/></svg>',
    intro: 'Launch a ball to hit the target. Pick the right <b>mass</b>, aim and <b>force</b>, and use friction and bounces to your advantage.',
    how: ['Aim with <b>↑ ↓</b>, then hold <b>Space</b> to build up force and let go to launch. Or drag back from the launcher like a slingshot and let go.', 'Switch balls with <b>1</b> (light, 1 kg) and <b>2</b> (heavy, 3 kg). The same force moves the light ball faster, but the heavy ball pushes crates farther.', 'You get 3 shots per puzzle. Fewer shots = more points.'],
    keys: '<kbd>↑</kbd><kbd>↓</kbd> aim · hold <kbd>Space</kbd> for force · <kbd>1</kbd><kbd>2</kbd> ball', pad: { dirs: ['up', 'down'], acts: [['fire', 'HOLD'], ['alt', 'BALL']] },
    recap: 'Newton’s 1st law: objects keep moving unless a force (like friction) acts. 2nd law: more mass needs more force to speed up. 3rd law: every push has an equal push back.', winTitle: 'Physics pro!', loseTitle: 'Out of shots', make, preview });
})();
