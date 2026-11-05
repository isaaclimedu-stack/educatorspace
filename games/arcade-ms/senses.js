/* Receptor Rush 2.0 (middle school, life science): stimuli fall toward the body. Switch your sense receptor to the
   one that detects each stimulus, catch it, and the nerve carries the signal to the brain. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, BY = 470;
  const SENSE = [
    { k: 'eye', name: 'Eye', rec: 'light receptors in the retina', col: '#ffb020', stim: ['Flash of light', 'Rainbow', 'Lightning'] },
    { k: 'ear', name: 'Ear', rec: 'hair cells in the inner ear', col: '#3fa9ff', stim: ['Sound wave', 'Thunder clap', 'Music'] },
    { k: 'nose', name: 'Nose', rec: 'smell receptors in the nose', col: '#b76bff', stim: ['Smell of pizza', 'Smoke', 'Flower scent'] },
    { k: 'tongue', name: 'Tongue', rec: 'taste buds', col: '#ff5d8f', stim: ['Sour lemon', 'Sweet candy', 'Salty chip'] },
    { k: 'skin', name: 'Skin', rec: 'touch, heat and pain receptors in the skin', col: '#ff8a3d', stim: ['Hot stove', 'Ice cube', 'Poke'] }];
  const QS = [
    { q: 'What carries signals from your sense receptors to your brain?', opts: ['Nerves (neurons)', 'Blood vessels', 'Bones', 'Muscles'], a: 0, why: 'Sensory neurons carry electrical signals to the brain, which processes them.' },
    { q: 'You touch a hot pan and pull away before you feel pain. This is a', opts: ['reflex', 'memory', 'habit', 'dream'], a: 0, why: 'Reflexes go through the spinal cord, so they are faster than thinking.' },
    { q: 'Which part of the body processes information from all your senses?', opts: ['Brain', 'Heart', 'Stomach', 'Lungs'], a: 0, why: 'The brain turns signals into what you see, hear, smell, taste and feel.' },
    { q: 'A stimulus is', opts: ['something in the environment your body responds to', 'a kind of muscle', 'a type of food', 'a bone in the ear'], a: 0, why: 'Light, sound, heat and chemicals are all stimuli.' }];
  function icon(c, k, x, y, s, col) { c.save(); c.translate(x, y); c.lineWidth = s * .12; c.lineCap = 'round'; c.strokeStyle = '#fff'; c.fillStyle = '#fff';
    if (k === 'eye') { c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * .9, s, 0); c.quadraticCurveTo(0, s * .9, -s, 0); c.fill(); D.gloss(c, 0, 0, s * .42, col); c.fillStyle = '#1a1a2a'; c.beginPath(); c.arc(0, 0, s * .2, 0, 7); c.fill(); }
    else if (k === 'ear') { c.beginPath(); c.arc(0, -s * .1, s * .6, Math.PI * 1.05, Math.PI * 2.2); c.quadraticCurveTo(s * .2, s * .7, -s * .2, s * .8); c.stroke(); c.beginPath(); c.arc(0, -s * .05, s * .25, Math.PI, Math.PI * 2.1); c.stroke(); }
    else if (k === 'nose') { c.beginPath(); c.moveTo(0, -s * .8); c.quadraticCurveTo(s * .25, 0, s * .55, s * .45); c.quadraticCurveTo(0, s * .75, -s * .55, s * .45); c.stroke(); }
    else if (k === 'tongue') { c.fillStyle = '#ff8fb0'; c.beginPath(); c.moveTo(-s * .6, -s * .3); c.lineTo(s * .6, -s * .3); c.quadraticCurveTo(s * .6, s * .9, 0, s * .9); c.quadraticCurveTo(-s * .6, s * .9, -s * .6, -s * .3); c.fill(); c.strokeStyle = '#d94c7b'; c.beginPath(); c.moveTo(0, -s * .2); c.lineTo(0, s * .5); c.stroke(); }
    else { c.beginPath(); c.moveTo(-s * .3, s * .8); c.lineTo(-s * .3, -s * .3); c.quadraticCurveTo(-s * .3, -s * .7, 0, -s * .7); c.quadraticCurveTo(s * .3, -s * .7, s * .3, -s * .3); c.lineTo(s * .3, s * .8); c.stroke(); for (let i = -1; i <= 1; i += 2) { c.beginPath(); c.moveTo(i * s * .55, s * .1); c.lineTo(i * s * .55, s * .8); c.stroke(); } }
    c.restore(); }
  function stim(c, s, t) { const S = SENSE[s.k]; c.save(); D.glow(c, S.col, 14); D.gloss(c, s.x, s.y, 22, S.col); c.restore();
    c.save(); c.translate(s.x, s.y); c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round';
    if (S.k === 'eye') { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 + t; c.beginPath(); c.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); c.stroke(); } }
    else if (S.k === 'ear') { [6, 11, 16].forEach(r => { c.beginPath(); c.arc(-8, 0, r, -.7, .7); c.stroke(); }); }
    else if (S.k === 'nose') { c.beginPath(); for (let i = 0; i < 3; i++) { c.moveTo(-8 + i * 8, 10); c.quadraticCurveTo(-14 + i * 8, 0, -8 + i * 8, -10); } c.stroke(); }
    else if (S.k === 'tongue') { c.beginPath(); c.arc(0, 0, 9, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-9, 0); c.lineTo(9, 0); c.stroke(); }
    else { c.beginPath(); c.moveTo(-8, 10); c.quadraticCurveTo(-12, -2, 0, -12); c.quadraticCurveTo(4, -2, 8, 10); c.stroke(); }
    c.restore(); D.text(c, s.name, s.x, s.y - 32, { size: 13, align: 'center', color: '#fff' }); }
  function bodyBg(c, t) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7fd3ff'); g.addColorStop(.6, '#b9e8ff'); g.addColorStop(1, '#ffe2c9'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    D.cloud(c, (180 + t * 12) % (W + 200) - 100, 120, 30, .8); D.cloud(c, (620 + t * 8) % (W + 200) - 100, 90, 24, .7);
    c.save(); const sk = c.createLinearGradient(0, BY - 30, 0, H); sk.addColorStop(0, '#ffc9a8'); sk.addColorStop(1, '#f0a37e'); c.fillStyle = sk; c.beginPath(); c.moveTo(0, BY - 10); for (let x = 0; x <= W; x += 40) c.quadraticCurveTo(x + 20, BY - 24, x + 40, BY - 10); c.lineTo(W, H); c.lineTo(0, H); c.fill(); c.restore(); }
  function brain(c, x, y, glow) { c.save(); if (glow > 0) D.glow(c, '#ffe066', 30 * glow); const g = c.createRadialGradient(x - 10, y - 10, 4, x, y, 40); g.addColorStop(0, '#ffd1e3'); g.addColorStop(1, '#e77aa6'); c.fillStyle = g;
    [[-14, -6, 22], [10, -8, 22], [-2, 8, 22], [20, 8, 16], [-22, 8, 15]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); }); c.restore();
    c.save(); c.strokeStyle = '#c8507f'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 20, y - 10); c.quadraticCurveTo(x - 6, y - 2, x - 18, y + 10); c.moveTo(x + 6, y - 20); c.quadraticCurveTo(x + 14, y - 4, x + 2, y + 12); c.stroke(); c.restore(); D.text(c, 'BRAIN', x, y + 50, { pix: true, size: 9, align: 'center', color: '#7a2a52' }); }
  function make(A) {
    const st = { x: W / 2, k: 0, items: [], spawn: .8, time: 75, sig: [], glow: 0, combo: 0, caught: 0, qAt: [50, 25], qs: A.shuffle(QS) };
    const setK = k => { if (k !== st.k) { st.k = (k + 5) % 5; A.sfx.pick(); } };
    return {
      _st: st,
      update(dt) {
        st.time -= dt; if (st.time <= 0) { A.over(true, `Signals sent to the brain: <b>${st.caught}</b>`); return; }
        if (st.qAt.length && st.time <= st.qAt[0]) { st.qAt.shift(); A.ask({ ...st.qs.pop(), tag: 'Brain check', reward: 'Bonus +300' }).then(ok => { if (ok) A.add(300, W / 2, 200); }); return; }
        const sp = 460; if (A.key('left')) st.x -= sp * dt; if (A.key('right')) st.x += sp * dt; if (A.ptr.down && A.ptr.y < BY - 60) st.x += A.clamp(A.ptr.x - st.x, -sp * dt, sp * dt); st.x = A.clamp(st.x, 50, W - 50);
        if (A.hit('fire') || A.hit('up')) setK(st.k + 1); if (A.hit('alt') || A.hit('down')) setK(st.k - 1); ['1', '2', '3', '4', '5'].forEach((n, i) => { if (A.typed().includes(n)) setK(i); });
        if (A.ptr.tap && A.ptr.y > BY - 40) { const i = Math.floor(A.ptr.x / (W / 5)); setK(i); }
        st.spawn -= dt; if (st.spawn <= 0) { const k = Math.floor(Math.random() * 5); st.items.push({ k, name: A.pick(SENSE[k].stim), x: A.rnd(60, W - 60), y: 40, vy: A.rnd(70, 95) + (75 - st.time) * 1.3 }); st.spawn = Math.max(.7, 1.5 - (75 - st.time) / 80); }
        st.items.forEach(s => { s.y += s.vy * dt; if (s.bounce) s.vy += 300 * dt;
          if (!s.bounce && s.y > BY - 60 && s.y < BY - 20 && Math.abs(s.x - st.x) < 46) {
            if (s.k === st.k) { s.dead = true; st.combo++; st.caught++; A.add(100 * Math.min(4, st.combo), s.x, s.y - 30); A.sfx.good(); st.sig.push({ x: st.x, t: 0, col: SENSE[s.k].col }); A.fx.burst(s.x, s.y, SENSE[s.k].col, 16); }
            else { s.bounce = true; s.vy = -200; st.combo = 0; A.sfx.hit(); A.toast(`<b>${s.name}</b> is detected by the <b>${SENSE[s.k].name.toLowerCase()}</b> (${SENSE[s.k].rec}).`, 2.8); } }
          if (s.y > BY && !s.dead) { s.dead = true; if (!s.bounce) { st.combo = 0; A.hurt(`You missed the <b>${s.name.toLowerCase()}</b>! Your ${SENSE[s.k].name.toLowerCase()} should catch it.`); } } });
        st.items = st.items.filter(s => !s.dead && s.y < H + 40);
        st.sig.forEach(s => s.t += dt * 1.4); if (st.sig.some(s => s.t >= 1 && !s.hit)) { st.sig.forEach(s => { if (s.t >= 1) s.hit = true; }); st.glow = 1; } st.sig = st.sig.filter(s => s.t < 1.05); st.glow = Math.max(0, st.glow - dt * 2);
      },
      draw(c) {
        bodyBg(c, A.t); brain(c, 70, 100, st.glow);
        /* nerve from the receptor to the brain */ c.save(); c.strokeStyle = 'rgba(255,230,120,.8)'; c.lineWidth = 4; c.setLineDash([2, 8]); c.lineDashOffset = -A.t * 30; c.beginPath(); c.moveTo(st.x, BY - 40); c.bezierCurveTo(st.x, 260, 120, 300, 80, 150); c.stroke(); c.restore();
        st.sig.forEach(s => { const u = Math.min(1, s.t), bx = (1 - u) ** 3 * s.x + 3 * (1 - u) ** 2 * u * s.x + 3 * (1 - u) * u * u * 120 + u ** 3 * 80, by = (1 - u) ** 3 * (BY - 40) + 3 * (1 - u) ** 2 * u * 260 + 3 * (1 - u) * u * u * 300 + u ** 3 * 150; c.save(); D.glow(c, '#ffe066', 16); D.gloss(c, bx, by, 8, '#ffe066'); c.restore(); });
        st.items.forEach(s => stim(c, s, A.t));
        const S = SENSE[st.k]; c.save(); D.glow(c, S.col, 20); D.gloss(c, st.x, BY - 40, 36, S.col); c.restore(); icon(c, S.k, st.x, BY - 40, 22, S.col);
        SENSE.forEach((s, i) => { const x = i * (W / 5) + W / 10, on = i === st.k; c.save(); c.globalAlpha = on ? 1 : .75; D.glossRect(c, x - 80, BY + 18, 160, 44, 14, on ? s.col : '#8a95b8'); c.restore(); D.text(c, `${i + 1}  ${s.name}`, x, BY + 46, { size: 15, align: 'center', color: '#fff' }); });
      },
      hud() { return { mid: 'TIME ' + Math.ceil(Math.max(0, st.time)) + (st.combo > 1 ? ' · COMBO ×' + Math.min(4, st.combo) : '') }; }
    };
  }
  function preview(c, t) { bodyBg(c, t); brain(c, 70, 100, .5); SENSE.forEach((S, i) => { const y = 120 + ((t * 60 + i * 70) % 300); stim(c, { k: i, x: 180 + i * 150, y, name: '' }, t); }); c.save(); D.glow(c, '#ffb020', 20); D.gloss(c, 480, BY - 40, 36, '#ffb020'); c.restore(); icon(c, 'eye', 480, BY - 40, 22, '#ffb020'); }
  AR.reg({ id: 'senses', subject: 'Biology', diff: 'Hard', title: 'Receptor Rush 2.0', sub: 'Catch each stimulus with the right sense', topic: 'Senses & nerves', color: '#ff5d8f',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    intro: 'Light, sound, smells, tastes and touches rain down. Switch to the <b>sense receptor</b> that detects each one and catch it. The nerve sends the signal to your <b>brain</b>.',
    how: ['Move with <b>← →</b> (or drag). Switch receptors with keys <b>1–5</b>, <b>Space</b>, or tap the buttons at the bottom.', 'Eye = light · Ear = sound · Nose = smells · Tongue = tastes · Skin = touch and temperature.', 'Missing a stimulus costs a life. Last 75 seconds to win.'],
    keys: '<kbd>←</kbd><kbd>→</kbd> move · <kbd>1</kbd>–<kbd>5</kbd> or <kbd>Space</kbd> switch sense', pad: { dirs: ['left', 'right'], acts: [['fire', 'NEXT']] },
    recap: 'Sense receptors detect stimuli and send signals along nerves to the brain, which decides how the body responds.', winTitle: 'Your senses are sharp!', loseTitle: 'Signal lost', make, preview });
})();
