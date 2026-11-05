/* Cell Defender: a boss-rush shooter about the immune system. Two weapons: antibodies (strong on viruses, weak on
   bacteria) and antibiotics (strong on bacteria, useless on viruses). Three sectors, each ending in a giant boss.
   The last boss is MRSA: antibiotic-resistant, so only antibodies hurt it. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H;
  const WEAP = [{ name: 'ANTIBODIES', col: '#5ff4ff', dmg: { virus: 2, bact: 1 } }, { name: 'ANTIBIOTICS', col: '#ffb347', dmg: { virus: 0, bact: 3 } }];
  const QS = [
    { q: 'Why don’t antibiotics work against the flu?', opts: ['The flu is a virus, and antibiotics target bacteria', 'The flu is too small to see', 'The flu has no DNA or RNA', 'Antibiotics only work on fungi'], a: 0, why: 'Antibiotics attack bacterial structures like cell walls and bacterial ribosomes. Viruses don’t have them.' },
    { q: 'What do antibodies do?', opts: ['Bind to specific antigens and tag pathogens for destruction', 'Kill every germ they touch', 'Make more viruses', 'Digest food'], a: 0, why: 'Each antibody fits one antigen. Tagged pathogens are neutralized or eaten by phagocytes.' },
    { q: 'Which cells make antibodies?', opts: ['B cells (plasma cells)', 'Red blood cells', 'Platelets', 'Neurons'], a: 0, why: 'Activated B cells become plasma cells that release antibodies.' },
    { q: 'Memory cells make the second response to a pathogen', opts: ['faster and stronger', 'slower', 'exactly the same', 'impossible'], a: 0, why: 'That’s why vaccines work: they create memory cells without causing the disease.' },
    { q: 'How do bacteria become resistant to an antibiotic?', opts: ['Random mutations; survivors with resistance reproduce', 'They decide to change', 'The antibiotic teaches them', 'They turn into viruses'], a: 0, why: 'Natural selection: the antibiotic kills the non-resistant bacteria, leaving resistant ones to multiply.' },
    { q: 'What part of the immune system responds first and is non-specific?', opts: ['Innate immunity (skin, inflammation, phagocytes)', 'Antibodies', 'Memory B cells', 'Killer T cells only'], a: 0, why: 'Innate defenses respond to anything foreign within minutes to hours.' }];
  const BOSS = [
    { name: 'INFLUENZA PRIME', kind: 'virus', hp: 70, col: '#c46bff', fact: 'A virus covered in spike proteins. Shoot the spikes off first. Antibiotics won’t work: it’s a virus.' },
    { name: 'STREP COLOSSUS', kind: 'bact', hp: 150, col: '#4be37a', fact: 'A giant bacterium that releases toxins and splits off new bacteria. Antibiotics hit it hard.' },
    { name: 'MRSA OVERLORD', kind: 'bact', hp: 190, col: '#ff4d6d', fact: 'Methicillin-resistant Staph aureus. It evolved antibiotic resistance, so only antibodies will hurt it.' }];
  function virus(c, x, y, r, col, t) { c.save(); D.glow(c, col, 14); D.spiky(c, x, y, r, col, 10, t); c.shadowBlur = 0; D.face(c, x, y, r * .9, '#2a0040'); c.restore(); }
  function bact(c, x, y, s, col, t, ang = 0) { c.save(); c.translate(x, y); c.rotate(ang); D.glow(c, col, 14); c.strokeStyle = col; c.lineWidth = 2;
    c.beginPath(); for (let i = 0; i < 12; i++) { const yy = -s * .3 + i * s * .05; c.moveTo(-s * .9, 0); } c.moveTo(s * .9, 0); c.bezierCurveTo(s * 1.2, -8 + Math.sin(t * 9) * 8, s * 1.4, 8, s * 1.7, Math.sin(t * 9 + 2) * 8); c.stroke();
    c.fillStyle = col; D.rr(c, -s, -s * .45, s * 2, s * .9, s * .45); c.fill(); c.shadowBlur = 0; c.fillStyle = 'rgba(255,255,255,.25)'; D.rr(c, -s * .8, -s * .32, s * 1.2, s * .2, s * .1); c.fill(); D.face(c, 0, 0, s * .55, '#00301a'); c.restore(); }
  function make(A) {
    const pl = { x: W / 2, y: H - 70, inv: 0, cool: 0, w: 0, spread: 0 };
    const st = { seq: [], step: -1, foes: [], pb: [], eb: [], boss: null, spawnQ: [], banner: null, sector: 0, kills: 0, qs: A.shuffle(QS), wrongT: 0, done: false };
    for (let s = 0; s < 3; s++) st.seq.push({ t: 'wave', s, n: 10 + s * 4 }, { t: 'wave', s, n: 12 + s * 4 }, { t: 'boss', s }, { t: 'quiz', s });
    function next() {
      st.step++; const it = st.seq[st.step]; if (!it) { st.done = true; A.over(true, `You defeated all three bosses and <b>${st.kills}</b> pathogens.`); return; }
      st.sector = it.s;
      if (it.t === 'wave') { const types = it.s === 0 ? ['virus'] : it.s === 1 ? ['virus', 'bact', 'bact'] : ['virus', 'bact']; for (let i = 0; i < it.n; i++) st.spawnQ.push({ at: i * .55, kind: A.pick(types) }); st.banner = { txt: `SECTOR ${it.s + 1} · WAVE`, t: 1.8 }; }
      else if (it.t === 'boss') { const B = BOSS[it.s]; st.banner = { txt: 'WARNING: ' + B.name, sub: B.fact, t: 3.4, warn: true }; A.sfx.boss();
        st.boss = { ...B, i: it.s, x: W / 2, y: -140, ty: 150, hpMax: B.hp, hp: B.hp, t: 0, fire: 2.5, fire2: 4, spikes: it.s === 0 ? Array.from({ length: 8 }, (_, k) => ({ a: k / 8 * 6.283, hp: 6 })) : [], minion: 4, hit: 0, enter: true }; }
      else if (it.t === 'quiz') { A.ask({ ...st.qs.pop(), tag: `Sector ${it.s + 1} cleared · power-up question`, reward: it.s === 0 ? 'Get Memory B cells: spread shot' : 'Get an extra life' }).then(ok => {
          if (ok) { if (it.s === 0 || pl.spread) { pl.spread = Math.min(2, pl.spread + 1); A.toast('<b>Memory B cells!</b> Your antibodies now fire in a spread.'); } if (it.s > 0) A.lives = Math.min(5, A.lives + 1); A.sfx.power(); } next(); }); }
    }
    next();
    function spawnFoe(kind) { const x = A.rnd(80, W - 80); st.foes.push({ kind, x, y: -30, x0: x, hp: kind === 'virus' ? 2 : 3, t: 0, amp: A.rnd(40, 120), sp: A.rnd(55, 85) + st.sector * 15, fire: A.rnd(1.5, 4) }); }
    function shootE(x, y, ang, sp, col = '#ff6b9d', r = 6) { st.eb.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, col, r }); }
    function damage(target, kind, p) { const d = WEAP[p.w].dmg[kind]; if (st.boss && target === st.boss && st.boss.i === 2 && p.w === 1) return 0; return d; }
    function noEffect(x, y, why) { A.fx.pop(x, y, 'NO EFFECT', '#9aa3c0'); if (st.wrongT <= 0) { A.toast(why, 3.2); st.wrongT = 4; } }
    return {
      _st: st,
      update(dt) {
        if (st.done) return;
        const sp = 330; let mx = 0, my = 0; if (A.key('left')) mx--; if (A.key('right')) mx++; if (A.key('up')) my--; if (A.key('down')) my++;
        pl.x += mx * sp * dt; pl.y += my * sp * dt; if (A.ptr.down) { pl.x += A.clamp(A.ptr.x - pl.x, -sp * dt * 1.3, sp * dt * 1.3); pl.y += A.clamp(A.ptr.y - 40 - pl.y, -sp * dt * 1.3, sp * dt * 1.3); }
        pl.x = A.clamp(pl.x, 26, W - 26); pl.y = A.clamp(pl.y, H * .45, H - 30);
        if (A.hit('alt') || A.hit('alt2')) { pl.w = 1 - pl.w; A.sfx.pick(); }
        if (A.hit('1')) pl.w = 0; if (A.hit('2')) pl.w = 1;
        pl.cool -= dt; const firing = A.key('fire') || A.ptr.down || A.key('up') && false;
        if (firing && pl.cool <= 0) { pl.cool = pl.w ? .2 : .14; A.sfx.shoot(); const n = pl.w === 0 ? 1 + pl.spread * 2 : 1; for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * .16; st.pb.push({ x: pl.x, y: pl.y - 24, vx: Math.sin(a) * 620, vy: -Math.cos(a) * 620, w: pl.w }); } }
        if (pl.inv > 0) pl.inv -= dt; if (st.wrongT > 0) st.wrongT -= dt; if (st.banner) { st.banner.t -= dt; if (st.banner.t <= 0) st.banner = null; }
        st.spawnQ.forEach(q => q.at -= dt); st.spawnQ = st.spawnQ.filter(q => q.at > 0 || (spawnFoe(q.kind), false));
        st.foes.forEach(f => { f.t += dt; f.y += f.sp * dt; f.x = f.x0 + Math.sin(f.t * 1.6) * f.amp; f.fire -= dt; if (f.fire <= 0 && f.y > 20 && f.y < H * .6) { f.fire = A.rnd(2, 4) - st.sector * .4; shootE(f.x, f.y + 10, Math.atan2(pl.y - f.y, pl.x - f.x), 200 + st.sector * 30); } });
        st.foes = st.foes.filter(f => f.y < H + 40 && f.hp > 0);
        const B = st.boss;
        if (B) { B.t += dt; if (B.hit > 0) B.hit -= dt;
          if (B.enter) { B.y += (B.ty - B.y) * Math.min(1, dt * 1.5); if (Math.abs(B.y - B.ty) < 4) B.enter = false; }
          else { B.x = W / 2 + Math.sin(B.t * (.5 + B.i * .15)) * (W / 2 - 160); B.y = B.ty + Math.sin(B.t * 1.3) * 20;
            const rage = B.hp < B.hpMax / 2; B.fire -= dt; B.fire2 -= dt;
            if (B.i === 0) { if (B.fire <= 0) { B.fire = rage ? 1.1 : 1.7; for (let k = 0; k < 12; k++) shootE(B.x, B.y, k / 12 * 6.283 + B.t, 170, '#d58bff'); } if (B.fire2 <= 0) { B.fire2 = 2.6; const a = Math.atan2(pl.y - B.y, pl.x - B.x); [-.18, 0, .18].forEach(o => shootE(B.x, B.y, a + o, 260, '#ff6bd5', 7)); } }
            if (B.i === 1) { if (B.fire <= 0) { B.fire = rage ? .9 : 1.4; const a = Math.atan2(pl.y - B.y, pl.x - B.x); for (let k = -2; k <= 2; k++) shootE(B.x, B.y + 30, a + k * .14, 230, '#b8ff5c', 7); }
              B.minion -= dt; if (B.minion <= 0) { B.minion = rage ? 3 : 4.5; st.foes.push({ kind: 'bact', x: B.x, y: B.y + 40, x0: B.x, hp: 3, t: 0, amp: A.rnd(60, 140), sp: 80, fire: 2 }); A.toast('The bacterium divided by <b>binary fission</b>!', 1.8); } }
            if (B.i === 2) { if (B.fire <= 0) { B.fire = rage ? .09 : .14; shootE(B.x, B.y, B.t * 3.1, 190, '#ff7a8a', 6); if (rage) shootE(B.x, B.y, -B.t * 3.1 + 3.14, 190, '#ffb0ba', 6); }
              if (B.fire2 <= 0) { B.fire2 = 3.5; const a = Math.atan2(pl.y - B.y, pl.x - B.x); for (let k = -3; k <= 3; k++) shootE(B.x, B.y, a + k * .1, 300, '#ffe066', 8); } } }
        }
        /* player bullets */
        st.pb.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt;
          for (const f of st.foes) if (f.hp > 0 && Math.hypot(f.x - p.x, f.y - p.y) < 22) { p.dead = true; const d = damage(f, f.kind, p);
            if (!d) noEffect(f.x, f.y - 20, '<b>Antibiotics don’t work on viruses.</b> Switch to antibodies (Shift).'); else { f.hp -= d; A.fx.burst(p.x, p.y, WEAP[p.w].col, 5, 90); if (f.hp <= 0) { st.kills++; A.add(f.kind === 'virus' ? 50 : 70, f.x, f.y); A.fx.burst(f.x, f.y, f.kind === 'virus' ? '#c46bff' : '#4be37a', 18); A.sfx.hit(); } } break; }
          if (!p.dead && B && !B.enter) {
            if (B.i === 0) { for (const s of B.spikes) { if (s.hp <= 0) continue; const a = s.a + B.t * .4, sx = B.x + Math.cos(a) * 98, sy = B.y + Math.sin(a) * 98; if (Math.hypot(sx - p.x, sy - p.y) < 20) { p.dead = true; const d = damage(B, 'virus', p); if (!d) noEffect(sx, sy, '<b>Antibiotics don’t work on viruses.</b> Switch to antibodies (Shift).'); else { s.hp -= d; A.fx.burst(sx, sy, '#d58bff', 6); if (s.hp <= 0) { A.add(100, sx, sy); A.sfx.hit(); A.fx.burst(sx, sy, '#fff', 14); } } break; } } }
            const r = B.i === 1 ? 0 : 70; const inBody = B.i === 1 ? Math.abs(p.x - B.x) < 130 && Math.abs(p.y - B.y) < 50 : Math.hypot(B.x - p.x, B.y - p.y) < r;
            if (!p.dead && inBody) { p.dead = true; const shield = B.i === 0 && B.spikes.some(s => s.hp > 0);
              if (shield) { A.fx.pop(p.x, p.y - 10, 'SHIELDED', '#d58bff'); if (st.wrongT <= 0) { A.toast('Destroy the <b>spike proteins</b> first. The virus uses them to attach to your cells.', 3); st.wrongT = 4; } }
              else { const d = damage(B, B.kind, p); if (!d) noEffect(p.x, p.y - 10, B.i === 2 ? '<b>MRSA is antibiotic-resistant!</b> Only antibodies can stop it.' : '<b>Antibiotics don’t work on viruses.</b>');
                else { B.hp -= d; B.hit = .08; A.add(d * 5); A.fx.burst(p.x, p.y, WEAP[p.w].col, 4, 80);
                  if (B.hp <= 0) { A.add(2000, B.x, B.y); A.sfx.boom(); A.shake(.8); for (let k = 0; k < 6; k++) setTimeout(() => A.fx.burst(B.x + A.rnd(-80, 80), B.y + A.rnd(-50, 50), B.col, 30, 260), k * 120); st.boss = null; st.eb = []; st.banner = { txt: B.name + ' DEFEATED', t: 2 }; setTimeout(next, 1800); } } } } } });
        st.pb = st.pb.filter(p => !p.dead && p.y > -20 && p.x > -20 && p.x < W + 20);
        /* enemy bullets and contact */
        st.eb.forEach(b => { b.x += b.vx * dt; b.y += b.vy * dt; if (pl.inv <= 0 && Math.hypot(b.x - pl.x, b.y - pl.y) < b.r + 9) { b.dead = true; hitMe(); } });
        st.eb = st.eb.filter(b => !b.dead && b.y < H + 20 && b.y > -40 && b.x > -40 && b.x < W + 40);
        st.foes.forEach(f => { if (pl.inv <= 0 && Math.hypot(f.x - pl.x, f.y - pl.y) < 26) { f.hp = 0; A.fx.burst(f.x, f.y, '#fff', 12); hitMe(); } });
        if (B && pl.inv <= 0 && Math.hypot(B.x - pl.x, B.y - pl.y) < 80) hitMe();
        const it = st.seq[st.step]; if (it && it.t === 'wave' && !st.spawnQ.length && !st.foes.length) next();
        function hitMe() { pl.inv = 2; A.fx.burst(pl.x, pl.y, '#5ff4ff', 26, 220); A.hurt(); if (A.lives > 0) st.eb = st.eb.filter(b => Math.hypot(b.x - pl.x, b.y - pl.y) > 140); }
      },
      draw(c) {
        D.bg(c, '#03141e', '#062a33'); D.stars(c, A.t, 80, 26, '#7ff0e6');
        for (let i = 0; i < 5; i++) { const y = ((A.t * 40 + i * 160) % (H + 200)) - 100; c.save(); c.globalAlpha = .1; c.fillStyle = '#ff4d6d'; c.beginPath(); c.ellipse(80 + i * 200 % W, y, 26, 12, .4, 0, 7); c.fill(); c.restore(); }
        const B = st.boss;
        if (B) { c.save(); if (B.hit > 0) c.globalAlpha = .7;
          if (B.i === 0) { B.spikes.forEach(s => { if (s.hp <= 0) return; const a = s.a + B.t * .4, sx = B.x + Math.cos(a) * 98, sy = B.y + Math.sin(a) * 98; c.save(); D.glow(c, '#ff9bf0', 12); c.strokeStyle = '#ff9bf0'; c.lineWidth = 7; c.beginPath(); c.moveTo(B.x + Math.cos(a) * 68, B.y + Math.sin(a) * 68); c.lineTo(sx, sy); c.stroke(); c.fillStyle = '#ff9bf0'; c.beginPath(); c.arc(sx, sy, 13, 0, 7); c.fill(); c.restore(); });
            c.save(); D.glow(c, B.col, 30); c.fillStyle = B.col; c.beginPath(); c.arc(B.x, B.y, 70, 0, 7); c.fill(); c.fillStyle = '#7a2fb5'; for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(B.x + Math.cos(k * 2.3) * 40, B.y + Math.sin(k * 2.3) * 36, 9, 0, 7); c.fill(); } c.restore(); D.face(c, B.x, B.y + 6, 46, '#2a0040'); }
          else if (B.i === 1) { bact(c, B.x, B.y, 130, B.col, B.t); }
          else { c.save(); D.glow(c, B.col, 30); [[0, 0, 62], [-58, 20, 44], [56, 18, 46], [-20, -48, 40], [30, -44, 38], [0, 52, 40]].forEach(([dx, dy, r]) => { c.fillStyle = B.col; c.beginPath(); c.arc(B.x + dx, B.y + dy, r, 0, 7); c.fill(); }); c.restore();
            c.save(); c.strokeStyle = '#ffe066'; c.lineWidth = 3; c.setLineDash([10, 8]); c.lineDashOffset = -B.t * 40; c.beginPath(); c.arc(B.x, B.y, 112, 0, 7); c.stroke(); c.restore(); D.face(c, B.x, B.y, 46, '#3a0010'); D.text(c, 'RESISTANT', B.x, B.y + 132, { pix: true, size: 9, align: 'center', color: '#ffe066' }); }
          c.restore();
          /* boss bar */ const bw = 420; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(W / 2 - bw / 2, 44, bw, 12); c.save(); D.glow(c, B.col, 10); c.fillStyle = B.col; c.fillRect(W / 2 - bw / 2, 44, bw * Math.max(0, B.hp) / B.hpMax, 12); c.restore();
          D.text(c, B.name, W / 2, 72, { pix: true, size: 10, align: 'center', color: '#fff', glow: B.col }); }
        st.foes.forEach(f => f.kind === 'virus' ? virus(c, f.x, f.y, 14, '#c46bff', A.t * 2) : bact(c, f.x, f.y, 20, '#4be37a', A.t, Math.PI / 2));
        st.eb.forEach(b => { c.save(); D.glow(c, b.col, 10); c.fillStyle = b.col; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 7); c.fill(); c.restore(); });
        st.pb.forEach(p => { c.save(); D.glow(c, WEAP[p.w].col, 10); c.strokeStyle = c.fillStyle = WEAP[p.w].col; c.lineWidth = 3;
          if (p.w === 0) { c.beginPath(); c.moveTo(p.x, p.y + 8); c.lineTo(p.x, p.y); c.lineTo(p.x - 5, p.y - 7); c.moveTo(p.x, p.y); c.lineTo(p.x + 5, p.y - 7); c.stroke(); } else { D.rr(c, p.x - 4, p.y - 9, 8, 18, 4); c.fill(); c.fillStyle = '#fff'; c.fillRect(p.x - 4, p.y, 8, 2); } c.restore(); });
        if (!(pl.inv > 0 && Math.floor(A.t * 12) % 2)) D.ship(c, pl.x, pl.y, 1.05, '#e8fbff', WEAP[pl.w].col);
        /* weapon panel */ c.save(); c.fillStyle = 'rgba(3,20,30,.75)'; D.rr(c, 12, H - 62, 250, 50, 10); c.fill(); c.restore();
        WEAP.forEach((w, i) => { const on = pl.w === i, x = 22 + i * 120; c.save(); if (on) { D.glow(c, w.col, 10); c.strokeStyle = w.col; c.lineWidth = 2; D.rr(c, x - 4, H - 56, 114, 38, 8); c.stroke(); } c.restore(); D.text(c, `${i + 1} ${w.name}`, x + 4, H - 40, { pix: true, size: 8, color: on ? w.col : '#6c8794' }); D.text(c, i ? 'vs bacteria' : 'vs viruses', x + 4, H - 24, { size: 11, color: on ? '#dff' : '#6c8794' }); });
        if (st.banner) { const b = st.banner; c.save(); c.globalAlpha = Math.min(1, b.t * 2); c.fillStyle = b.warn ? 'rgba(80,0,20,.65)' : 'rgba(0,30,40,.6)'; c.fillRect(0, H / 2 - 50, W, b.sub ? 100 : 60);
          D.text(c, b.txt, W / 2, H / 2 - (b.sub ? 10 : -8), { pix: true, size: b.warn ? 20 : 16, align: 'center', color: b.warn && Math.floor(A.t * 4) % 2 ? '#ffe066' : '#fff', glow: b.warn ? '#ff4d6d' : '#28e0d0' });
          if (b.sub) D.text(c, b.sub, W / 2, H / 2 + 28, { size: 15, align: 'center', color: '#ffd9df' }); c.restore(); }
      },
      hud() { const it = st.seq[st.step] || {}; return { mid: `SECTOR ${st.sector + 1}/3` + (it.t === 'boss' ? ' · BOSS' : '') }; }
    };
  }
  function preview(c, t) { D.bg(c, '#03141e', '#062a33'); D.stars(c, t, 70, 26, '#7ff0e6');
    for (let k = 0; k < 4; k++) virus(c, 200 + k * 180 + Math.sin(t + k) * 30, 120 + (k % 2) * 60, 16, '#c46bff', t * 2);
    bact(c, 480 + Math.sin(t * .7) * 200, 260, 26, '#4be37a', t, Math.PI / 2);
    const x = W / 2 + Math.sin(t * 1.3) * 200; for (let k = 0; k < 4; k++) { const y = 440 - ((t * 500 + k * 90) % 360); c.save(); D.glow(c, '#5ff4ff', 10); c.strokeStyle = '#5ff4ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y + 8); c.lineTo(x, y); c.lineTo(x - 5, y - 7); c.moveTo(x, y); c.lineTo(x + 5, y - 7); c.stroke(); c.restore(); }
    D.ship(c, x, 470, 1.3, '#e8fbff', '#5ff4ff'); }
  AR.reg({ id: 'defender', subject: 'Biology', diff: 'Hard', title: 'Cell Defender', sub: 'Defeat giant pathogen bosses', topic: 'Immune system', color: '#28e0d0',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    intro: 'You are a <b>white blood cell</b> fighter. Clear waves of viruses and bacteria, then take down a <b>giant boss</b> at the end of each sector.',
    how: ['Move with <b>arrows / WASD</b>, hold <b>Space</b> to fire (on touch screens, hold and drag).', 'Switch weapons with <b>Shift</b> (or 1 and 2). <b>Antibodies</b> are strong on viruses. <b>Antibiotics</b> are strong on bacteria but do nothing to viruses.', 'Bosses: <b>Influenza Prime</b> (shoot off its spike proteins first), <b>Strep Colossus</b> (it splits into new bacteria) and <b>MRSA Overlord</b> (antibiotic-resistant!).', 'Answer the question after each boss for a power-up.'],
    keys: '<kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> move · <kbd>Space</kbd> fire · <kbd>Shift</kbd> switch weapon', pad: { dirs: [], acts: [['alt', 'SWAP']] },
    recap: 'Antibiotics kill bacteria but not viruses. Antibodies bind specific antigens. Overusing antibiotics selects for resistant bacteria like MRSA.', winTitle: 'Infection cleared!', loseTitle: 'The infection spread', make, preview });
})();
