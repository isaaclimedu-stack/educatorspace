/* Photosynthesis Sim (middle school, life science): run a greenhouse. Set light, water and carbon dioxide to make
   enough glucose each day. The lowest one limits the rate, and every setting costs money, so balance them. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H;
  const DIAL = [{ k: 'light', name: 'Light', col: '#ffc93c', cost: .55, up: 'q', dn: 'a' }, { k: 'water', name: 'Water', col: '#3fa9ff', cost: .35, up: 'w', dn: 's' }, { k: 'co2', name: 'CO₂', col: '#9aa7bf', cost: .45, up: 'e', dn: 'd' }];
  const DAYS = [{ goal: 100, len: 40, ev: null }, { goal: 115, len: 40, ev: ['light', 4, 12, 26, 'Clouds roll in! Light is limited to 4 for a while.'] }, { goal: 110, len: 40, ev: ['water', 3, 12, 26, 'A drought! Water is limited to 3 for a while.'] }];
  const QS = [
    { q: 'What does a plant make during photosynthesis?', opts: ['Glucose (sugar) and oxygen', 'Carbon dioxide and water', 'Only water', 'Protein and fat'], a: 0, why: 'Light + water + CO₂ → glucose + oxygen.' },
    { q: 'If a plant has lots of water and CO₂ but little light, what limits photosynthesis?', opts: ['Light', 'Water', 'Carbon dioxide', 'Nothing'], a: 0, why: 'The factor in shortest supply is the limiting factor.' },
    { q: 'Where in the plant cell does photosynthesis happen?', opts: ['Chloroplasts', 'Mitochondria', 'Nucleus', 'Cell wall'], a: 0, why: 'Chloroplasts contain chlorophyll, the green pigment that captures light.' }];
  const BTN = []; DIAL.forEach((d, i) => { const x = 40 + i * 140; BTN.push({ i, dir: 1, x: x + 70, y: 170, w: 44, h: 40 }, { i, dir: -1, x: x + 70, y: 420, w: 44, h: 40 }); });
  function plant(c, x, y, size, t, wilt) { c.save(); const s = .6 + size * .7; c.fillStyle = '#c96a3a'; D.rr(c, x - 50, y, 100, 70, 10); c.fill(); c.fillStyle = '#a8522a'; c.fillRect(x - 56, y - 6, 112, 16);
    c.strokeStyle = '#3c9a3c'; c.lineWidth = 8; c.lineCap = 'round'; const top = y - 180 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.sin(t) * 6, (y + top) / 2, x, top); c.stroke();
    for (let i = 0; i < 6; i++) { const ly = y - (i + 1) * 30 * s, sd = i % 2 ? 1 : -1, droop = wilt * 30; c.save(); c.translate(x, ly); c.rotate(sd * (.6 + droop / 60) + Math.sin(t * 1.5 + i) * .05); const g = c.createLinearGradient(0, 0, sd * 70 * s, 0); g.addColorStop(0, '#2f9a3a'); g.addColorStop(1, '#7fdc6a'); c.fillStyle = g; c.beginPath(); c.ellipse(sd * 34 * s, -6, 36 * s, 15 * s, 0, 0, 7); c.fill(); c.restore(); }
    if (size > .5) { D.gloss(c, x + 10, top - 4, 12 * s, '#ff5d5d'); D.gloss(c, x - 18, top + 20, 10 * s, '#ff5d5d'); } c.restore(); }
  function bg(c, light) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, light > 0 ? '#c9f0ff' : '#2a3a6a'); g.addColorStop(1, '#eaffd6'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; for (let x = 470; x < W; x += 80) { c.beginPath(); c.moveTo(x, 60); c.lineTo(x, H); c.stroke(); } c.beginPath(); c.moveTo(450, 60); c.lineTo(W, 60); c.stroke(); c.restore(); c.fillStyle = '#9ed36a'; c.fillRect(450, H - 70, W, 70); }
  function make(A) {
    const st = { day: 0, t: 0, v: { light: 5, water: 5, co2: 5 }, cap: {}, money: 120, glu: 0, total: 0, rate: 0, bubbles: [], evOn: false, done: false };
    const D0 = () => DAYS[Math.min(2, st.day)];
    function setV(i, dir) { const d = DIAL[i]; st.v[d.k] = A.clamp(st.v[d.k] + dir, 0, 10); A.sfx.pick(); }
    async function endDay() {
      const Dd = D0(); if (st.glu >= Dd.goal) { A.sfx.power(); A.add(Math.round(st.glu) + Math.max(0, Math.round(st.money)), W / 2, 200); const ok = await A.ask({ ...QS[st.day], tag: `Day ${st.day + 1} complete`, reward: '+50 money' }); if (ok) st.money += 50;
        st.day++; if (st.day >= DAYS.length) { A.over(true, `Your greenhouse made <b>${Math.round(st.total)}</b> glucose in 3 days.`); return; } A.toast(`<b>Day ${st.day + 1}:</b> make ${D0().goal} glucose.`, 3); }
      else { A.hurt(`You made ${Math.round(st.glu)} of ${Dd.goal} glucose. Raise the lowest factor, the one limiting the plant!`); if (A.lives <= 0) return; }
      st.t = 0; st.glu = 0; st.cap = {}; st.evOn = false; st.done = false; }
    A.toast('Make <b>100 glucose</b> today. The <b>lowest</b> setting limits how fast the plant works.', 4);
    return {
      _st: st,
      update(dt) {
        if (st.done) return; const Dd = D0(); st.t += dt;
        A.typed().forEach(k => DIAL.forEach((d, i) => { if (k === d.up) setV(i, 1); if (k === d.dn) setV(i, -1); }));
        if (A.ptr.tap) BTN.forEach(B => { if (A.ptr.x > B.x - B.w / 2 && A.ptr.x < B.x + B.w / 2 && A.ptr.y > B.y - B.h / 2 && A.ptr.y < B.y + B.h / 2) setV(B.i, B.dir); });
        const ev = Dd.ev; st.cap = {}; if (ev && st.t > ev[2] && st.t < ev[3]) { st.cap[ev[0]] = ev[1]; if (!st.evOn) { st.evOn = true; A.toast(ev[4], 3.6); A.sfx.bad(); } }
        const eff = k => Math.min(st.v[k], st.cap[k] ?? 10), lim = Math.min(eff('light'), eff('water'), eff('co2'));
        st.rate = lim * .42; st.glu += st.rate * dt; st.total += st.rate * dt;
        st.money += st.rate * 1.15 * dt - DIAL.reduce((s, d) => s + st.v[d.k] * d.cost, 0) * dt * .3;
        if (st.money < 0) { st.money = 20; A.hurt('You ran out of money! Turning a setting higher than the limiting factor wastes money.'); }
        if (Math.random() < st.rate * dt * .8) st.bubbles.push({ x: 680 + A.rnd(-40, 40), y: 250, t: 0 }); st.bubbles.forEach(b => { b.t += dt; b.y -= 50 * dt; b.x += Math.sin(b.t * 4) * 20 * dt; }); st.bubbles = st.bubbles.filter(b => b.t < 3);
        if (st.t >= Dd.len) { st.done = true; endDay(); }
      },
      draw(c) {
        const Dd = D0(), eff = k => Math.min(st.v[k], st.cap[k] ?? 10), lim = Math.min(eff('light'), eff('water'), eff('co2'));
        bg(c, eff('light')); c.save(); c.globalAlpha = eff('light') / 10; D.glow(c, '#ffe066', 60); D.gloss(c, 880, 110, 40, '#ffd23f'); c.restore(); if (st.cap.light) { D.cloud(c, 860, 110, 40, .95); D.cloud(c, 800, 130, 30, .9); }
        plant(c, 680, H - 140, Math.min(1, st.glu / Dd.goal), A.t, st.cap.water ? 1 : 0);
        st.bubbles.forEach(b => { c.save(); c.globalAlpha = 1 - b.t / 3; c.strokeStyle = '#3fa9ff'; c.lineWidth = 2; c.beginPath(); c.arc(b.x, b.y, 7, 0, 7); c.stroke(); c.restore(); D.text(c, 'O₂', b.x, b.y + 4, { size: 9, align: 'center', color: '#1a5a9a' }); });
        D.text(c, 'light + water + CO₂  →  glucose + O₂', 700, 82, { size: 16, align: 'center', color: '#1b4a2a' });
        DIAL.forEach((d, i) => { const x = 40 + i * 140, v = eff(d.k), isLim = v === lim; c.save(); c.fillStyle = 'rgba(255,255,255,.75)'; D.rr(c, x, 120, 140 - 12, 380, 18); c.fill(); if (isLim) { c.strokeStyle = '#ff5d5d'; c.lineWidth = 3; c.stroke(); } c.restore();
          D.text(c, d.name, x + 64, 150, { size: 16, align: 'center', color: '#1b2a4a' });
          for (let k = 0; k < 10; k++) { const on = k < st.v[d.k], capped = st.cap[d.k] !== undefined && k >= st.cap[d.k] && on; c.save(); c.globalAlpha = on ? 1 : .2; D.glossRect(c, x + 30, 380 - k * 18, 68, 14, 6, capped ? '#c8c8c8' : d.col); c.restore(); }
          D.glossRect(c, x + 48, 150 + 4, 36, 32, 10, '#3ed17a'); D.text(c, '+', x + 66, 178, { size: 22, align: 'center', color: '#fff' }); D.glossRect(c, x + 48, 404, 36, 32, 10, '#ff8a3d'); D.text(c, '−', x + 66, 428, { size: 22, align: 'center', color: '#fff' });
          D.text(c, `${d.up.toUpperCase()} / ${d.dn.toUpperCase()}`, x + 64, 460, { pix: true, size: 8, align: 'center', color: '#5a6a8a' }); if (isLim) D.text(c, 'LIMITING', x + 64, 486, { pix: true, size: 8, align: 'center', color: '#d83a3a' }); });
        /* goal + money */ c.save(); c.fillStyle = 'rgba(255,255,255,.85)'; D.rr(c, 470, 100, 220, 92, 14); c.fill(); c.restore();
        D.text(c, `Glucose: ${Math.floor(st.glu)} / ${Dd.goal}`, 486, 128, { size: 16, color: '#1b4a2a' }); D.glossRect(c, 486, 138, 188 * Math.min(1, st.glu / Dd.goal), 12, 6, '#3ed17a');
        D.text(c, `Money: $${Math.floor(st.money)}`, 486, 176, { size: 15, color: st.money < 20 ? '#d83a3a' : '#1b2a4a' });
        D.text(c, `Rate: ${st.rate.toFixed(1)}/s`, 600, 176, { size: 13, color: '#5a6a8a' });
        c.save(); c.fillStyle = 'rgba(0,0,0,.15)'; D.rr(c, 470, 50, 470, 8, 4); c.fill(); c.restore(); D.glossRect(c, 470, 50, 470 * Math.min(1, st.t / Dd.len), 8, 4, '#ffb020');
      },
      hud() { return { mid: `DAY ${Math.min(3, st.day + 1)}/3 · ${Math.max(0, Math.ceil(D0().len - st.t))}s LEFT` }; }
    };
  }
  function preview(c, t) { bg(c, 1); D.glow(c, '#ffe066', 40); D.gloss(c, 880, 110, 40, '#ffd23f'); c.shadowBlur = 0; plant(c, 680, H - 140, .9, t, 0);
    DIAL.forEach((d, i) => { const x = 40 + i * 140; c.save(); c.fillStyle = 'rgba(255,255,255,.75)'; D.rr(c, x, 120, 128, 380, 18); c.fill(); c.restore(); const n = 4 + Math.round(3 + Math.sin(t + i) * 3); for (let k = 0; k < 10; k++) { c.save(); c.globalAlpha = k < n ? 1 : .2; D.glossRect(c, x + 30, 380 - k * 18, 68, 14, 6, d.col); c.restore(); } }); }
  AR.reg({ id: 'photo', subject: 'Biology', diff: 'Medium', title: 'Photosynthesis Sim', sub: 'Balance light, water and CO₂ to grow your plant', topic: 'Photosynthesis', color: '#3ed17a',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21V11"/><path d="M12 13C8 13 5 10 5 6c4 0 7 3 7 7zM12 11c0-4 3-7 7-7 0 4-3 7-7 7z"/></svg>',
    intro: 'Run a greenhouse for 3 days. Set <b>light</b>, <b>water</b> and <b>carbon dioxide</b> so your plant makes enough <b>glucose</b> each day.',
    how: ['Raise or lower each setting with the <b>+ / −</b> buttons, or keys <b>Q/A</b> (light), <b>W/S</b> (water), <b>E/D</b> (CO₂).', 'The plant can only go as fast as its <b>lowest</b> setting, the <b>limiting factor</b> (outlined in red).', 'Every setting costs money, and glucose earns money. Don’t waste money on settings higher than the limiting factor!', 'Watch out for clouds and droughts.'],
    keys: '<kbd>Q</kbd>/<kbd>A</kbd> light · <kbd>W</kbd>/<kbd>S</kbd> water · <kbd>E</kbd>/<kbd>D</kbd> CO₂', pad: null,
    recap: 'Photosynthesis: light + water + carbon dioxide → glucose + oxygen, in the chloroplasts. The factor in shortest supply limits the rate.', winTitle: 'Greenhouse champion!', loseTitle: 'The plant wilted', make, preview });
})();
