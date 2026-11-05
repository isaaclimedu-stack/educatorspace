/* Enzyme Blast: you are an enzyme with a turret. Let substrate molecules reach your active site (they turn into
   products), and shoot down inhibitors and denaturing hazards before they reach you. Three enzymes, three levels. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, EX = W / 2, EY = H - 40;
  const LV = [
    { enz: 'Lactase', sub: 'Lactose', prod: 'glucose + galactose', col: '#4be37a', sh: 'two', haz: 'Boiling 90 °C', hazWhy: 'High heat breaks the bonds that hold an enzyme’s shape, so it denatures.' },
    { enz: 'Amylase', sub: 'Starch', prod: 'maltose', col: '#ffd23f', sh: 'chain', haz: 'Stomach acid pH 2', hazWhy: 'Amylase works best near neutral pH (about 7). Strong acid changes its shape.' },
    { enz: 'Catalase', sub: 'H₂O₂', prod: 'water + O₂', col: '#5fb7ff', sh: 'h2o2', haz: 'Heavy metal (Hg²⁺)', hazWhy: 'Heavy metal ions bind enzymes and change their shape, poisoning them.' }];
  const QS = [
    { q: 'A competitive inhibitor works by', opts: ['binding the active site so the substrate can’t', 'binding a different site and changing the shape', 'speeding up the reaction', 'turning into the product'], a: 0, why: 'It competes with the substrate for the active site. Adding more substrate can outcompete it.' },
    { q: 'A noncompetitive inhibitor binds', opts: ['a site other than the active site (an allosteric site)', 'only to the product', 'the active site only', 'nothing at all'], a: 0, why: 'Binding elsewhere changes the enzyme’s shape so the active site no longer fits the substrate.' },
    { q: 'What happens to an enzyme that is denatured?', opts: ['It loses its shape and stops working', 'It works faster', 'It becomes a substrate', 'It copies itself'], a: 0, why: 'An enzyme’s function depends on its 3-D shape. Heat or extreme pH can unfold it.' },
    { q: 'Enzymes speed up reactions by', opts: ['lowering the activation energy', 'adding energy to the reaction', 'being used up in the reaction', 'raising the temperature'], a: 0, why: 'Enzymes are catalysts: they lower the activation energy and are reused again and again.' }];
  function mol(c, m, t) { c.save(); c.translate(m.x, m.y); c.rotate(Math.sin(t * 2 + m.wob) * .3); const col = m.type === 'comp' ? '#ff5d7a' : m.type === 'non' ? '#c46bff' : m.type === 'haz' ? '#ff9a3c' : m.col; D.glow(c, col, 14);
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = 3;
    const hex = (x, y, r) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); };
    if (m.type === 'non') { D.spiky(c, 0, 0, 13, col, 7, t * 2); }
    else if (m.type === 'haz') { c.beginPath(); c.moveTo(0, -18); c.lineTo(17, 13); c.lineTo(-17, 13); c.closePath(); c.fill(); c.shadowBlur = 0; D.text(c, '!', 0, 10, { pix: true, size: 14, align: 'center', color: '#3a1600' }); }
    else if (m.sh === 'two') { hex(-10, 0, 11); hex(11, 0, 11); }
    else if (m.sh === 'chain') { for (let i = -2; i <= 2; i++) hex(i * 12, Math.sin(i) * 4, 7); }
    else { c.beginPath(); c.arc(-9, 0, 9, 0, 7); c.arc(9, 0, 9, 0, 7); c.fill(); c.fillStyle = '#fff'; [[-20, -7], [20, 7]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); }); }
    if (m.type === 'comp') { c.shadowBlur = 0; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-6, -6); c.lineTo(6, 6); c.moveTo(6, -6); c.lineTo(-6, 6); c.stroke(); }
    c.restore(); D.text(c, m.label, m.x, m.y - 26, { size: 12, align: 'center', color: m.type === 'sub' ? '#fff' : '#ffc9d2' }); }
  function enzyme(c, L, ang, t, bad, hot) { c.save(); const col = bad > 0 ? '#8a8fa8' : L.col; D.glow(c, col, hot ? 30 : 18); c.fillStyle = col;
    c.beginPath(); c.moveTo(EX - 110, H + 10); c.bezierCurveTo(EX - 120, EY - 70, EX - 40, EY - 70, EX - 28, EY - 50); c.lineTo(EX - 14, EY - 30); c.lineTo(EX + 14, EY - 30); c.lineTo(EX + 28, EY - 50); c.bezierCurveTo(EX + 40, EY - 70, EX + 120, EY - 70, EX + 110, H + 10); c.closePath();
    if (bad > 0) { c.translate(Math.sin(t * 30) * 2, 0); } c.fill(); c.shadowBlur = 0; c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.arc(EX + 70, EY - 10, 10, 0, 7); c.fill(); c.restore();
    D.text(c, 'active site', EX, EY - 54, { size: 11, align: 'center', color: '#e8fff0' }); D.text(c, L.enz.toUpperCase(), EX, H - 8, { pix: true, size: 10, align: 'center', color: '#06240f' });
    /* turret on the shoulder */ [-1, 1].forEach(sd => { const bx = EX + sd * 78, by = EY - 44; c.save(); c.translate(bx, by); c.rotate(ang); c.fillStyle = '#e8fff0'; D.glow(c, '#e8fff0', 8); D.rr(c, -5, -32, 10, 30, 4); c.fill(); c.restore(); c.fillStyle = '#e8fff0'; c.beginPath(); c.arc(bx, by, 10, 0, 7); c.fill(); }); }
  function make(A) {
    const st = { lv: 0, ms: [], shots: [], ang: 0, cool: 0, spawn: 1, made: 0, need: 12, bad: 0, hot: 0, prods: [], qs: A.shuffle(QS) };
    const L = () => LV[Math.min(2, st.lv)];
    function spawn() { const r = Math.random(), Lv = L(), x = A.rnd(60, W - 60), base = { x, y: 56, wob: Math.random() * 6, vy: A.rnd(42, 62) + st.lv * 12 };
      let m; if (r < .5) m = { type: 'sub', label: Lv.sub, col: Lv.col, sh: Lv.sh }; else if (r < .72) m = { type: 'comp', label: 'Competitive inhibitor', sh: Lv.sh }; else if (r < .9) m = { type: 'non', label: 'Noncompetitive inhibitor' }; else m = { type: 'haz', label: Lv.haz };
      st.ms.push(Object.assign(m, base)); }
    async function levelDone() {
      A.sfx.power(); A.add(600, W / 2, H / 2); const ok = await A.ask({ ...st.qs.pop(), tag: `${L().enz} level cleared`, reward: 'Extra life' }); if (ok) A.lives = Math.min(5, A.lives + 1);
      st.lv++; if (st.lv >= 3) { A.over(true, 'You kept three enzymes working: lactase, amylase and catalase.'); return; }
      st.ms = []; st.shots = []; st.made = 0; st.bad = 0; A.toast(`<b>${L().enz}</b> breaks down <b>${L().sub}</b> into ${L().prod}. Protect it!`, 3.6);
    }
    A.toast(`<b>Lactase</b> breaks down <b>lactose</b> into glucose + galactose. Let lactose in; shoot everything else.`, 4);
    return {
      _st: st,
      update(dt) {
        if (A.key('left')) st.ang -= 2.6 * dt; if (A.key('right')) st.ang += 2.6 * dt;
        if (A.ptr.moved || A.ptr.down) { st.ang = Math.atan2(A.ptr.x - EX, -(A.ptr.y - (EY - 44))); }
        st.ang = A.clamp(st.ang, -1.35, 1.35); st.cool -= dt;
        if ((A.key('fire') || A.ptr.down) && st.cool <= 0) { st.cool = .16; A.sfx.shoot(); [-1, 1].forEach(sd => st.shots.push({ x: EX + sd * 78 + Math.sin(st.ang) * 30, y: EY - 44 - Math.cos(st.ang) * 30, vx: Math.sin(st.ang) * 640, vy: -Math.cos(st.ang) * 640 })); }
        if (st.bad > 0) st.bad -= dt; if (st.hot > 0) st.hot -= dt;
        st.spawn -= dt; if (st.spawn <= 0) { spawn(); st.spawn = Math.max(.55, 1.25 - st.lv * .2 - st.made * .015); }
        st.ms.forEach(m => { const dx = EX - m.x, dy = (EY - 40) - m.y, d = Math.hypot(dx, dy); m.x += dx / d * m.vy * .35 * dt + Math.sin(A.t + m.wob) * 14 * dt; m.y += m.vy * dt;
          if (d < 46) { m.dead = true;
            if (m.type === 'sub') { if (st.bad > 0) { A.toast('The enzyme is out of shape and can’t bind the substrate!'); A.sfx.bad(); } else { st.made++; st.hot = .3; A.add(120, EX, EY - 80); A.sfx.good(); A.fx.burst(EX, EY - 40, L().col, 20); st.prods.push({ t: 0, txt: L().prod }); } }
            else if (m.type === 'comp') { st.bad = 2.5; A.hurt('A <b>competitive inhibitor</b> plugged the active site.'); }
            else if (m.type === 'non') { st.bad = 2.5; A.hurt('A <b>noncompetitive inhibitor</b> bound elsewhere and bent the active site out of shape.'); }
            else { st.bad = 3.5; A.hurt(`<b>${m.label}!</b> ${L().hazWhy}`); } } });
        st.shots.forEach(s => { s.x += s.vx * dt; s.y += s.vy * dt; for (const m of st.ms) if (!m.dead && Math.hypot(m.x - s.x, m.y - s.y) < 22) { s.dead = true; m.dead = true;
          if (m.type === 'sub') { A.add(-60, m.x, m.y); A.sfx.bad(); A.toast(`Don’t shoot the <b>${m.label}</b>: it’s your substrate! Let it reach the active site.`); }
          else { A.add(m.type === 'haz' ? 80 : 50, m.x, m.y); A.sfx.hit(); A.fx.burst(m.x, m.y, m.type === 'comp' ? '#ff5d7a' : m.type === 'non' ? '#c46bff' : '#ff9a3c', 14); } break; } });
        st.ms = st.ms.filter(m => !m.dead && m.y < H + 20); st.shots = st.shots.filter(s => !s.dead && s.y > -20 && s.x > -20 && s.x < W + 20);
        st.prods.forEach(p => p.t += dt); st.prods = st.prods.filter(p => p.t < 1.4);
        if (st.made >= st.need && A.lives > 0) { st.made = -99; levelDone(); }
      },
      draw(c) {
        D.bg(c, '#041a10', '#0a3a20'); D.stars(c, A.t, 50, 8, '#9af0b4');
        for (let i = 0; i < 9; i++) { c.save(); c.globalAlpha = .07; c.fillStyle = '#4be37a'; c.beginPath(); c.arc((i * 173 + A.t * 6) % W, (i * 97) % (H - 120) + 60, 20 + i * 5, 0, 7); c.fill(); c.restore(); }
        st.shots.forEach(s => { c.save(); D.glow(c, '#e8fff0', 10); c.fillStyle = '#e8fff0'; c.beginPath(); c.arc(s.x, s.y, 4, 0, 7); c.fill(); c.restore(); });
        st.ms.forEach(m => mol(c, m, A.t));
        enzyme(c, L(), st.ang, A.t, st.bad, st.hot > 0);
        st.prods.forEach(p => D.text(c, '→ ' + p.txt, EX, EY - 90 - p.t * 60, { size: 14, align: 'center', color: L().col, glow: L().col, blur: 6 }));
        if (st.bad > 0) D.text(c, 'ENZYME BLOCKED', EX, EY - 110, { pix: true, size: 11, align: 'center', color: '#ff6b81', glow: '#ff6b81' });
        /* progress */ c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; D.rr(c, 14, H - 40, 220, 26, 8); c.fill(); c.fillStyle = L().col; D.rr(c, 14, H - 40, 220 * Math.max(0, st.made) / st.need, 26, 8); c.fill(); c.restore();
        D.text(c, `${L().sub} broken down: ${Math.max(0, st.made)}/${st.need}`, 24, H - 22, { size: 12, color: '#fff' });
      },
      hud() { return { mid: `LEVEL ${st.lv + 1}/3 · ${L().enz.toUpperCase()}` }; }
    };
  }
  function preview(c, t) { D.bg(c, '#041a10', '#0a3a20'); D.stars(c, t, 40, 8, '#9af0b4'); enzyme(c, LV[0], Math.sin(t) * .6, t, 0, false);
    [[220, 'sub'], [420, 'comp'], [640, 'non'], [800, 'sub']].forEach(([x, ty], i) => mol(c, { x: x + Math.sin(t + i) * 20, y: 80 + ((t * 50 + i * 90) % 300), type: ty, col: '#4be37a', sh: 'two', wob: i, label: '' }, t));
    for (let k = 0; k < 3; k++) { const y = EY - 80 - ((t * 400 + k * 90) % 300); c.save(); D.glow(c, '#e8fff0', 10); c.fillStyle = '#e8fff0'; c.beginPath(); c.arc(EX + 78 + Math.sin(t) * (EY - y) * .6, y, 4, 0, 7); c.fill(); c.restore(); } }
  AR.reg({ id: 'enzyme', subject: 'Biology', diff: 'Medium', title: 'Enzyme Blast', sub: 'Shoot the inhibitors', topic: 'Enzymes', color: '#4be37a',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/></svg>',
    intro: 'You are an <b>enzyme</b> with two turrets. Let your <b>substrate</b> reach the active site, and blast everything that would stop you working.',
    how: ['Aim with the <b>mouse</b> (or ← →) and fire with <b>click</b> or <b>Space</b>.', '<b>Don’t shoot your substrate</b> (lactose, then starch, then H₂O₂). Let it in to make products.', 'Shoot <b>competitive inhibitors</b> (red, ✕), <b>noncompetitive inhibitors</b> (purple, spiky) and orange <b>hazards</b> like heat and acid that denature you.', 'Break down 12 substrate molecules to clear each level.'],
    keys: 'Mouse aim + click, or <kbd>←</kbd><kbd>→</kbd> aim · <kbd>Space</kbd> fire', pad: { dirs: ['left', 'right'], acts: [['fire', 'FIRE']] },
    recap: 'Each enzyme fits one substrate (lock and key). Competitive inhibitors block the active site; noncompetitive inhibitors bind elsewhere and change its shape; heat and extreme pH denature enzymes.', winTitle: 'Reactions running!', loseTitle: 'Enzyme shut down', make, preview });
})();
