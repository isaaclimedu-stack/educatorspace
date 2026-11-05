/* Immune Defense (middle school, life science): a tower-defense game. Germs travel through a blood vessel toward
   the heart. Place white blood cells, antibody makers and fever along the path to stop them. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H;
  const PATH = [[-30, 150], [240, 150], [240, 390], [500, 390], [500, 150], [760, 150], [760, 400], [990, 400]];
  const SLOTS = [[120, 230], [170, 80], [320, 300], [330, 455], [420, 230], [420, 80], [580, 250], [600, 455], [680, 80], [690, 300], [860, 300], [870, 458]];
  const TW = [
    { k: 'phago', name: 'Phagocyte', cost: 50, range: 95, rate: .7, dmg: 1.2, col: '#f4f6ff', info: 'A white blood cell that swallows germs.' },
    { k: 'anti', name: 'Antibody maker', cost: 70, range: 160, rate: .45, dmg: .7, col: '#3fa9ff', info: 'B cells shoot Y-shaped antibodies that stick to germs and slow them.' },
    { k: 'fever', name: 'Fever', cost: 90, range: 120, rate: 1.2, dmg: .9, col: '#ff6b3d', info: 'A higher body temperature slows germs and hurts all of them nearby.' }];
  const GERM = { bact: { name: 'Bacteria', hp: 4, sp: 52, col: '#3ed17a', pay: 8 }, virus: { name: 'Virus', hp: 2.6, sp: 82, col: '#b57cf0', pay: 6 }, fung: { name: 'Fungus', hp: 10, sp: 32, col: '#ffb020', pay: 15 } };
  const WAVES = [['bact', 8], ['virus', 10], ['bact', 10, 'virus', 6], ['fung', 4, 'bact', 8], ['virus', 14, 'fung', 4], ['fung', 7, 'bact', 10, 'virus', 10]];
  const QS = [
    { q: 'What is the body’s first line of defense against germs?', opts: ['Skin and mucus', 'Antibodies', 'Fever', 'Bones'], a: 0, why: 'Skin blocks germs, and mucus traps them before they get inside.' },
    { q: 'What do white blood cells do?', opts: ['Find and destroy germs', 'Carry oxygen', 'Help blood clot', 'Digest food'], a: 0, why: 'Red blood cells carry oxygen. White blood cells fight infection.' },
    { q: 'How does a vaccine help you?', opts: ['It trains your immune system to recognize a germ', 'It kills every germ in your body', 'It works like a bandage', 'It makes your blood thicker'], a: 0, why: 'The body makes memory cells, so it fights the real germ faster next time.' },
    { q: 'Antibiotics can treat infections caused by', opts: ['bacteria', 'viruses', 'both bacteria and viruses', 'neither'], a: 0, why: 'Antibiotics don’t work on viruses like colds and flu.' },
    { q: 'Which of these is a pathogen?', opts: ['A virus that causes the flu', 'A red blood cell', 'Vitamin C', 'A white blood cell'], a: 0, why: 'A pathogen is a germ that causes disease.' }];
  const segs = PATH.slice(1).map((p, i) => { const a = PATH[i]; return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) }; }), TOTAL = segs.reduce((s, x) => s + x.len, 0);
  const at = d => { for (const s of segs) { if (d <= s.len) { const u = d / s.len; return [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u]; } d -= s.len; } return PATH[PATH.length - 1]; };
  function vessel(c) { c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = '#a3123a'; c.lineWidth = 66; c.beginPath(); PATH.forEach(([x, y], i) => c[i ? 'lineTo' : 'moveTo'](x, y)); c.stroke(); c.strokeStyle = '#e8425f'; c.lineWidth = 54; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 10; c.translate(-6, -8); c.stroke(); c.restore(); }
  function bg(c, t) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffd9cf'); g.addColorStop(1, '#ffb4a6'); c.fillStyle = g; c.fillRect(0, 0, W, H); c.save(); c.globalAlpha = .25; for (let i = 0; i < 14; i++) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse((i * 173) % W, (i * 97) % H, 40, 18, i, 0, 7); c.fill(); } c.restore(); }
  function heart(c, x, y, s, beat) { c.save(); c.translate(x, y); c.scale(s * beat, s * beat); const g = c.createRadialGradient(-6, -8, 2, 0, 0, 30); g.addColorStop(0, '#ff9aa8'); g.addColorStop(1, '#c2183a'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 22); c.bezierCurveTo(-34, 0, -20, -26, 0, -10); c.bezierCurveTo(20, -26, 34, 0, 0, 22); c.fill(); c.restore(); }
  function tower(c, T, x, y, t, sel, icon) { c.save(); if (sel) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.setLineDash([6, 6]); c.beginPath(); c.arc(x, y, T.range, 0, 7); c.stroke(); c.setLineDash([]); }
    if (T.k === 'phago') { D.gloss(c, x, y, 24, '#f4f6ff'); D.gloss(c, x + 5, y + 3, 9, '#b57cf0'); }
    else if (T.k === 'anti') { D.gloss(c, x, y, 22, '#3fa9ff'); c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x, y); c.lineTo(x - 7, y - 9); c.moveTo(x, y); c.lineTo(x + 7, y - 9); c.stroke(); }
    else { D.gloss(c, x, y, 22, '#ff6b3d'); c.fillStyle = '#fff'; D.rr(c, x - 3, y - 14, 6, 20, 3); c.fill(); c.beginPath(); c.arc(x, y + 9, 6, 0, 7); c.fill(); if (!icon) { c.globalAlpha = .25 + Math.sin(t * 5) * .1; c.fillStyle = '#ff6b3d'; c.beginPath(); c.arc(x, y, T.range * .6, 0, 7); c.fill(); } }
    c.restore(); }
  function germ(c, g, t) { const G = GERM[g.k], [x, y] = at(g.d); c.save(); if (g.slow > 0) { c.globalAlpha = .85; }
    if (g.k === 'virus') D.spiky(c, x, y, 13, G.col, 9, t * 2); else if (g.k === 'bact') { c.translate(x, y); c.rotate(.4); D.glossRect(c, -18, -10, 36, 20, 10, G.col); c.rotate(-.4); c.translate(-x, -y); } else { D.gloss(c, x - 8, y, 13, G.col); D.gloss(c, x + 8, y - 4, 12, G.col); D.gloss(c, x, y + 8, 11, G.col); }
    D.face(c, x, y, 11, '#2a1a1a'); c.restore(); if (g.hp < g.max) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - 16, y - 26, 32, 5); c.fillStyle = '#4be37a'; c.fillRect(x - 16, y - 26, 32 * g.hp / g.max, 5); } }
  function make(A) {
    A.lives = 1;
    const st = { energy: 130, hp: 10, wave: -1, between: true, queue: [], germs: [], towers: [], shots: [], pick: 0, qs: A.shuffle(QS), beat: 1 };
    const barRects = TW.map((T, i) => ({ x: 14 + i * 190, y: H - 52, w: 178, h: 44 })), goR = { x: W - 200, y: H - 52, w: 186, h: 44 };
    async function startWave() { if (!st.between) return; st.wave++; if (st.wave >= WAVES.length) return; st.between = false; const w = WAVES[st.wave]; let tm = 0; for (let i = 0; i < w.length; i += 2) for (let n = 0; n < w[i + 1]; n++) { st.queue.push({ k: w[i], t: tm }); tm += GERM[w[i]].sp > 60 ? .55 : .9; } A.sfx.boss(); }
    function place(i) { const T = TW[st.pick], s = SLOTS[i]; if (st.towers.some(x => x.slot === i)) return; if (st.energy < T.cost) { A.toast(`You need <b>${T.cost}</b> energy for a ${T.name.toLowerCase()}. Stop germs to earn more.`); A.sfx.bad(); return; }
      st.energy -= T.cost; st.towers.push({ ...T, slot: i, x: s[0], y: s[1], cd: 0 }); A.sfx.pick(); A.fx.burst(s[0], s[1], T.col, 14); A.toast(`<b>${T.name}:</b> ${T.info}`, 2.4); }
    return {
      _st: st,
      update(dt) {
        st.beat = 1 + Math.max(0, Math.sin(A.t * 7)) * .08;
        ['1', '2', '3'].forEach((n, i) => { if (A.typed().includes(n)) st.pick = i; });
        if (A.hit('fire') || A.hit('enter')) startWave();
        if (A.ptr.tap) { const P = A.ptr; barRects.forEach((r, i) => { if (P.x > r.x && P.x < r.x + r.w && P.y > r.y && P.y < r.y + r.h) st.pick = i; });
          if (P.x > goR.x && P.y > goR.y) startWave(); SLOTS.forEach((s, i) => { if (Math.hypot(P.x - s[0], P.y - s[1]) < 28) place(i); }); }
        if (!st.between) {
          st.queue.forEach(q => q.t -= dt); st.queue = st.queue.filter(q => { if (q.t > 0) return true; const G = GERM[q.k]; st.germs.push({ k: q.k, d: 0, hp: G.hp * (1 + st.wave * .12), max: G.hp * (1 + st.wave * .12), slow: 0 }); return false; });
          st.germs.forEach(g => { const G = GERM[g.k]; g.d += G.sp * (g.slow > 0 ? .55 : 1) * dt; if (g.slow > 0) g.slow -= dt; if (g.d >= TOTAL) { g.gone = true; st.hp--; A.sfx.bad(); A.shake(.3); if (st.hp <= 0) { A.over(false, `The infection reached the heart on wave <b>${st.wave + 1}</b>.`); } } });
          st.towers.forEach(T => { T.cd -= dt; if (T.cd > 0) return; const near = st.germs.filter(g => !g.gone && g.hp > 0 && Math.hypot(at(g.d)[0] - T.x, at(g.d)[1] - T.y) < T.range).sort((a, b) => b.d - a.d);
            if (!near.length) return; T.cd = T.rate;
            if (T.k === 'fever') { near.forEach(g => { g.hp -= T.dmg; g.slow = .8; }); A.fx.burst(T.x, T.y, '#ff6b3d', 10, 120); }
            else { const g = near[0]; st.shots.push({ x: T.x, y: T.y, g, k: T.k, dmg: T.k === 'anti' && g.k === 'virus' ? T.dmg * 1.8 : T.dmg }); } });
          st.shots.forEach(s => { const [gx, gy] = at(s.g.d), dx = gx - s.x, dy = gy - s.y, L = Math.hypot(dx, dy); if (L < 12 || s.g.gone || s.g.hp <= 0) { s.dead = true; if (!s.g.gone) { s.g.hp -= s.dmg; if (s.k === 'anti') s.g.slow = 1.2; } return; } s.x += dx / L * 520 * dt; s.y += dy / L * 520 * dt; });
          st.shots = st.shots.filter(s => !s.dead);
          st.germs.forEach(g => { if (g.hp <= 0 && !g.paid) { g.paid = true; const [x, y] = at(g.d); st.energy += GERM[g.k].pay; A.add(25, x, y - 20); A.fx.burst(x, y, GERM[g.k].col, 12); } });
          st.germs = st.germs.filter(g => !g.gone && g.hp > 0);
          if (!st.queue.length && !st.germs.length && st.hp > 0) { st.between = true; A.sfx.power(); A.add(200 + st.hp * 20, W / 2, H / 2);
            if (st.wave >= WAVES.length - 1) { A.over(true, `You stopped all ${WAVES.length} waves with <b>${st.hp}</b>/10 heart health left.`); return; }
            if (st.wave % 2 === 1) A.ask({ ...st.qs.pop(), tag: 'Immune system check', reward: '+60 energy' }).then(ok => { if (ok) st.energy += 60; }); }
        }
      },
      draw(c) {
        bg(c, A.t); vessel(c); heart(c, 930, 400, 1.3, st.beat); D.text(c, 'HEART', 930, 460, { pix: true, size: 9, align: 'center', color: '#7a0f2a' });
        SLOTS.forEach((s, i) => { if (st.towers.some(T => T.slot === i)) return; c.save(); c.fillStyle = 'rgba(255,255,255,.55)'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.setLineDash([5, 5]); c.beginPath(); c.arc(s[0], s[1], 24, 0, 7); c.fill(); c.stroke(); c.restore(); D.text(c, '+', s[0], s[1] + 8, { size: 22, align: 'center', color: '#c2183a' }); });
        st.towers.forEach(T => tower(c, T, T.x, T.y, A.t, false));
        st.germs.forEach(g => germ(c, g, A.t));
        st.shots.forEach(s => { c.save(); c.fillStyle = s.k === 'anti' ? '#3fa9ff' : '#fff'; c.beginPath(); c.arc(s.x, s.y, 5, 0, 7); c.fill(); c.restore(); });
        barRects.forEach((r, i) => { const T = TW[i], on = i === st.pick; D.glossRect(c, r.x, r.y, r.w, r.h, 14, on ? '#5b6cff' : '#8a95b8'); c.save(); c.translate(r.x + 26, r.y + 22); c.scale(.7, .7); tower(c, T, 0, 0, A.t, false, true); c.restore(); D.text(c, `${i + 1} ${T.name}`, r.x + 54, r.y + 19, { size: 14, color: '#fff' }); D.text(c, `${T.cost} energy`, r.x + 54, r.y + 36, { size: 12, color: '#e0e6ff' }); });
        D.glossRect(c, goR.x, goR.y, goR.w, goR.h, 14, st.between ? '#3ed17a' : '#8a95b8'); D.text(c, st.between ? (st.wave < 0 ? 'Start wave ▶' : 'Next wave ▶') : 'Wave in progress', goR.x + goR.w / 2, goR.y + 28, { size: 16, align: 'center', color: '#fff' });
        D.text(c, `⚡ ${st.energy} energy`, 14, 62, { size: 17, color: '#7a0f2a' });
        c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; D.rr(c, 180, 48, 160, 16, 8); c.fill(); c.restore(); D.glossRect(c, 180, 48, 16 * st.hp, 16, 8, '#ff3b5c'); D.text(c, 'Heart health', 350, 61, { size: 13, color: '#7a0f2a' });
      },
      hud() { return { mid: `WAVE ${Math.max(1, Math.min(WAVES.length, st.wave + 1))}/${WAVES.length}`, noLives: true }; }
    };
  }
  function preview(c, t) { bg(c, t); vessel(c); heart(c, 930, 400, 1.3, 1 + Math.max(0, Math.sin(t * 7)) * .08); tower(c, TW[0], 320, 300, t); tower(c, TW[1], 580, 250, t); tower(c, TW[2], 690, 300, t);
    ['bact', 'virus', 'bact', 'fung', 'virus'].forEach((k, i) => germ(c, { k, d: ((t * 60 + i * 120) % TOTAL), hp: 1, max: 1 }, t)); }
  AR.reg({ id: 'immune', subject: 'Biology', diff: 'Medium', title: 'Immune Defense', sub: 'Defend the body against invading germs', topic: 'Immune system', color: '#ff3b5c',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
    intro: 'Germs are swimming through a blood vessel toward the <b>heart</b>. Build your immune defenses along the path to stop them.',
    how: ['Pick a defender with <b>1 2 3</b> (or tap the buttons), then click a <b>+</b> spot to place it.', '<b>Phagocytes</b> swallow germs. <b>Antibody makers</b> shoot antibodies that slow germs (great on viruses). <b>Fever</b> hurts every germ nearby.', 'Press <b>Space</b> or <b>Start wave</b> when ready. Stopping germs earns energy for more defenders. Survive 6 waves.'],
    keys: '<kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> pick · click a spot · <kbd>Space</kbd> start wave', pad: null,
    recap: 'Skin and mucus keep most germs out. White blood cells (like phagocytes) destroy germs, B cells make antibodies, and a fever helps slow germs down. Vaccines train the immune system ahead of time.', winTitle: 'Infection stopped!', loseTitle: 'The infection spread', make, preview });
})();
