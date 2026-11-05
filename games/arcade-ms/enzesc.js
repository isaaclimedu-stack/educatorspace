/* Enzyme Escape (middle school, life science): digestive enzymes are like locks, food molecules like keys.
   Turn each falling food molecule so its key fits, and drop it on the enzyme that breaks it down. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, EY = 430;
  const ENZ = [
    { name: 'Amylase', food: 'Starch', prod: 'sugars', sh: 'tri', col: '#ffc93c', where: 'in your saliva' },
    { name: 'Protease', food: 'Protein', prod: 'amino acids', sh: 'sq', col: '#ff6f91', where: 'in your stomach' },
    { name: 'Lipase', food: 'Fat', prod: 'fatty acids', sh: 'semi', col: '#4fc3f7', where: 'from your pancreas' }];
  const EX = [190, 480, 770];
  const QS = [
    { q: 'What do digestive enzymes do?', opts: ['Break big food molecules into smaller ones', 'Make food bigger', 'Pump blood', 'Store fat'], a: 0, why: 'Small molecules like sugars and amino acids can pass into the blood.' },
    { q: 'Why does each enzyme work on only one kind of molecule?', opts: ['Its shape fits only that molecule, like a lock and key', 'It is too small', 'It changes color', 'It only works at night'], a: 0, why: 'The active site has a specific shape that matches its substrate.' },
    { q: 'What happens to an enzyme if it gets too hot?', opts: ['It changes shape and stops working', 'It works faster forever', 'It turns into food', 'Nothing happens'], a: 0, why: 'Too much heat “denatures” an enzyme: its shape falls apart.' }];
  /* the key shape that sticks out of a food molecule, pointing in direction d (0 down, 1 left, 2 up, 3 right) */
  function keyPath(c, sh, s) { c.beginPath(); if (sh === 'tri') { c.moveTo(-s, 0); c.lineTo(0, s * 1.3); c.lineTo(s, 0); } else if (sh === 'sq') { c.moveTo(-s, 0); c.lineTo(-s, s * 1.2); c.lineTo(s, s * 1.2); c.lineTo(s, 0); } else { c.moveTo(-s, 0); c.arc(0, 0, s, 0, Math.PI, false); } c.closePath(); }
  function food(c, x, y, k, rot, t, s = 1) { const E = ENZ[k]; c.save(); c.translate(x, y); c.scale(s, s); c.save(); c.rotate(rot * Math.PI / 2); c.translate(0, 26); const g = c.createLinearGradient(-14, 0, 14, 30); g.addColorStop(0, D.shade(E.col, .5)); g.addColorStop(1, D.shade(E.col, -.3)); c.fillStyle = g; keyPath(c, E.sh, 14); c.fill(); c.restore();
    if (k === 0) { [-22, 0, 22].forEach((dx, i) => D.gloss(c, dx, Math.sin(t * 3 + i) * 2, 15, E.col)); } else if (k === 1) { [[-18, -6], [0, 6], [18, -6]].forEach(([dx, dy]) => D.gloss(c, dx, dy, 15, E.col)); } else { D.gloss(c, 0, 0, 26, E.col); }
    c.restore(); D.text(c, E.food, x, y - 34 * s, { size: 14 * s, align: 'center', color: '#fff', glow: 'rgba(0,0,0,.6)', blur: 4 }); }
  function enzyme(c, i, hot, flash, t) { const E = ENZ[i], x = EX[i]; c.save(); if (flash > 0) D.glow(c, '#fff', 30); const g = c.createLinearGradient(0, EY, 0, EY + 90); g.addColorStop(0, D.shade(E.col, .35)); g.addColorStop(1, D.shade(E.col, -.4)); c.fillStyle = g;
    c.restore(); c.save(); c.fillStyle = g; c.beginPath(); c.moveTo(x - 85, EY + 95); c.quadraticCurveTo(x - 95, EY - 4, x - 30, EY); c.lineTo(x + 30, EY); c.quadraticCurveTo(x + 95, EY - 4, x + 85, EY + 95); c.closePath(); c.fill();
    c.fillStyle = '#ffa0bd'; c.translate(x, EY - 1); keyPath(c, E.sh, 16); c.fill(); c.restore();
    c.save(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 2; c.translate(x, EY - 1); keyPath(c, E.sh, 16); c.stroke(); c.restore();
    D.face(c, x, EY + 52, 26, '#2a1a3a'); D.text(c, E.name, x, EY + 88, { size: 14, align: 'center', color: '#fff' }); }
  function bg(c, t, heat = 0) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, heat > 70 ? '#ff9a7a' : '#ffb3c8'); g.addColorStop(1, '#ff7aa2'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = .25; for (let i = 0; i < 12; i++) { c.fillStyle = '#fff'; c.beginPath(); c.arc((i * 151 + t * 10) % W, (i * 89) % 360 + 40, 10 + (i % 4) * 8, 0, 7); c.fill(); } c.restore();
    c.fillStyle = 'rgba(160,40,90,.35)'; c.fillRect(0, EY + 70, W, H); }
  function make(A) {
    const st = { lv: 0, piece: null, x: W / 2, done: 0, need: 8, heat: 10, flash: [0, 0, 0], bits: [], qs: A.shuffle(QS) };
    const newPiece = () => { st.piece = { k: Math.floor(Math.random() * 3), rot: 1 + Math.floor(Math.random() * 3), x: A.rnd(150, W - 150), y: 60, vy: 0 }; };
    newPiece();
    async function levelDone() { A.sfx.power(); A.add(400, W / 2, 200); const ok = await A.ask({ ...st.qs.pop(), tag: `Level ${st.lv + 1} complete`, reward: 'Cool down the enzymes' }); if (ok) st.heat = 0;
      st.lv++; if (st.lv >= 3) { A.over(true, 'You digested 24 food molecules: starch, protein and fat.'); return; } st.done = 0; newPiece(); A.toast(`Level ${st.lv + 1}: the food falls faster!`); }
    return {
      _st: st,
      update(dt) {
        const P = st.piece; if (!P) return;
        const sp = 380; if (A.key('left')) P.x -= sp * dt; if (A.key('right')) P.x += sp * dt;
        if (A.ptr.down) P.x += A.clamp(A.ptr.x - P.x, -sp * dt, sp * dt); P.x = A.clamp(P.x, 60, W - 120);
        if (A.hit('up') || A.hit('fire') || (A.ptr.tap && A.ptr.y < EY - 60 && Math.abs(A.ptr.x - P.x) < 70)) { P.rot = (P.rot + 1) % 4; A.sfx.pick(); }
        if (A.hit('alt')) { P.rot = (P.rot + 3) % 4; A.sfx.pick(); }
        const fall = 55 + st.lv * 25 + st.done * 3; P.y += (A.key('down') ? 360 : fall) * dt;
        st.heat = Math.max(0, st.heat - dt * 1.5);
        if (P.y > EY - 60) { const i = EX.findIndex(x => Math.abs(x - P.x) < 50);
          if (i < 0) { st.heat += 12; A.sfx.bad(); A.toast(`The <b>${ENZ[P.k].food.toLowerCase()}</b> missed every enzyme. Line it up over one!`); newPiece(); }
          else if (i !== P.k) { st.heat += 25; A.sfx.bad(); A.shake(.3); A.toast(`<b>${ENZ[i].name}</b> only breaks down ${ENZ[i].food.toLowerCase()}. ${ENZ[P.k].food} needs <b>${ENZ[P.k].name.toLowerCase()}</b>.`, 3.2); P.y = 120; }
          else if (P.rot !== 0) { A.sfx.hit(); A.toast('Right enzyme, but the key doesn’t fit. <b>Turn</b> the molecule so the key points down!', 2.6); P.y = 140; st.heat += 6; }
          else { st.done++; st.flash[i] = .4; A.add(150 + Math.round((100 - st.heat)), EX[i], EY - 60); A.sfx.good(); A.fx.burst(EX[i], EY - 30, ENZ[i].col, 22);
            for (let k = 0; k < 6; k++) st.bits.push({ x: EX[i], y: EY - 20, vx: A.rnd(-140, 140), vy: A.rnd(-260, -120), t: 0, col: ENZ[i].col, lab: k === 0 ? ENZ[i].prod : '' });
            if (st.done >= st.need) { st.piece = null; levelDone(); } else newPiece(); } }
        if (st.heat >= 100) { st.heat = 30; A.hurt('Too hot! The enzymes <b>denatured</b> (lost their shape). Wrong drops heat them up.'); }
        st.flash = st.flash.map(f => Math.max(0, f - dt)); st.bits.forEach(b => { b.t += dt; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 400 * dt; }); st.bits = st.bits.filter(b => b.t < 1.3);
      },
      draw(c) {
        bg(c, A.t, st.heat); ENZ.forEach((_, i) => enzyme(c, i, st.heat, st.flash[i], A.t));
        st.bits.forEach(b => { c.save(); c.globalAlpha = 1 - b.t / 1.3; D.gloss(c, b.x, b.y, 7, b.col); c.restore(); if (b.lab) D.text(c, '→ ' + b.lab, b.x, b.y - 14, { size: 14, align: 'center', color: '#fff', glow: 'rgba(0,0,0,.5)', blur: 4 }); });
        const P = st.piece; if (P) { const i = EX.findIndex(x => Math.abs(x - P.x) < 50); if (i >= 0) { c.save(); c.globalAlpha = .25; c.fillStyle = '#fff'; c.fillRect(EX[i] - 50, P.y, 100, EY - P.y); c.restore(); } food(c, P.x, P.y, P.k, P.rot, A.t); }
        /* thermometer */ c.save(); c.fillStyle = 'rgba(255,255,255,.6)'; D.rr(c, W - 44, 60, 22, 220, 11); c.fill(); D.glossRect(c, W - 40, 64 + 212 * (1 - st.heat / 100), 14, 212 * st.heat / 100, 7, st.heat > 70 ? '#ff3b3b' : '#ff8a3d'); D.gloss(c, W - 33, 290, 18, st.heat > 70 ? '#ff3b3b' : '#ff8a3d'); c.restore(); D.text(c, 'HEAT', W - 33, 326, { pix: true, size: 8, align: 'center', color: '#7a1a3a' });
        D.text(c, `Molecules digested: ${st.done}/${st.need}`, 16, 62, { size: 15, color: '#5a0f30' });
      },
      hud() { return { mid: `LEVEL ${Math.min(3, st.lv + 1)}/3` }; }
    };
  }
  function preview(c, t) { bg(c, t); ENZ.forEach((_, i) => enzyme(c, i, 0, 0, t)); food(c, 480 + Math.sin(t) * 40, 120 + (t * 60) % 220, 1, Math.floor(t) % 4, t); food(c, 190, 250, 0, 0, t, .9); }
  AR.reg({ id: 'enzesc', subject: 'Biology', diff: 'Medium', title: 'Enzyme Escape', sub: 'Fit each food molecule into the right enzyme', topic: 'Digestion & enzymes', color: '#ff6f91',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 14c0-5 4-9 9-9s9 4 9 9H14l-2 3-2-3z"/></svg>',
    intro: 'Your digestive enzymes are like <b>locks</b>, and food molecules are like <b>keys</b>. Turn each falling molecule so it fits, and drop it on the enzyme that breaks it down.',
    how: ['Move with <b>← →</b>, turn with <b>↑</b> or <b>Space</b>, drop faster with <b>↓</b>. On touch screens, drag to move and tap the molecule to turn it.', '<b>Amylase</b> breaks down starch, <b>protease</b> breaks down protein, <b>lipase</b> breaks down fat.', 'The key must point <b>down</b> into the active site. Wrong drops heat the enzymes up; at 100 they denature and you lose a life.'],
    keys: '<kbd>←</kbd><kbd>→</kbd> move · <kbd>↑</kbd> turn · <kbd>↓</kbd> drop', pad: { dirs: ['left', 'right', 'down'], acts: [['fire', 'TURN']] },
    recap: 'Enzymes speed up the breakdown of food. Each one has an active site shaped for one kind of molecule. Too much heat changes the shape, so the enzyme stops working.', winTitle: 'Dinner digested!', loseTitle: 'The enzymes overheated', make, preview });
})();
