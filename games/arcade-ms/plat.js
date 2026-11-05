/* Cell Quest (middle school, life science): a side-scrolling platformer through an animal cell, then a plant cell.
   Bump the quiz blocks at each organelle to answer a question, stomp germs, collect ATP and reach the exit. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, T = 48, ROWS = 10, OY = H - ROWS * T, COLS = 140;
  const ORG = [
    [['Nucleus', '#b07cff', 'What does the nucleus do?', ['Controls the cell and holds its DNA', 'Makes energy from food', 'Stores water', 'Makes food from sunlight']],
     ['Mitochondria', '#ff8a3d', 'What do mitochondria do?', ['Release energy from food (cellular respiration)', 'Hold the DNA', 'Make the cell wall', 'Trap sunlight']],
     ['Cell membrane', '#3fa9ff', 'What does the cell membrane do?', ['Controls what goes in and out of the cell', 'Makes proteins', 'Stores DNA', 'Digests food']],
     ['Ribosomes', '#3ed17a', 'What do ribosomes do?', ['Make proteins', 'Store water', 'Release energy', 'Control the cell']],
     ['Lysosome', '#ff5d8f', 'What does a lysosome do?', ['Breaks down waste and old cell parts', 'Makes sugar', 'Stores DNA', 'Supports the plant']],
     ['Cytoplasm', '#4fd6e0', 'What is the cytoplasm?', ['The jelly-like fluid that fills the cell', 'The control center', 'The outer wall', 'A kind of protein']]],
    [['Chloroplast', '#3ed17a', 'What does a chloroplast do?', ['Uses sunlight to make food (photosynthesis)', 'Breaks down waste', 'Holds the DNA', 'Lets the cell swim']],
     ['Cell wall', '#c9a14a', 'What does the cell wall do?', ['Gives a plant cell a stiff shape and support', 'Makes proteins', 'Releases energy', 'Controls the cell']],
     ['Large vacuole', '#4fd6e0', 'What does a plant cell’s large vacuole do?', ['Stores water and keeps the cell firm', 'Makes food from sunlight', 'Holds the DNA', 'Fights germs']],
     ['Nucleus', '#b07cff', 'Which part of a plant cell holds its DNA?', ['The nucleus', 'The cell wall', 'The vacuole', 'The chloroplast']],
     ['Mitochondria', '#ff8a3d', 'Do plant cells have mitochondria?', ['Yes, to release energy from the food they make', 'No, only animals do', 'Only in their roots', 'Only at night']],
     ['Plant vs animal', '#ffc93c', 'Which parts do plant cells have that animal cells do not?', ['Cell wall and chloroplasts', 'Nucleus and membrane', 'Mitochondria and ribosomes', 'Cytoplasm and DNA']]]];
  const WHY = { 'Nucleus': 'The nucleus is the control center. It holds the DNA instructions.', 'Mitochondria': 'Mitochondria are the powerhouses: they release energy from food.', 'Cell membrane': 'The membrane is a gatekeeper that lets some things in and keeps others out.', 'Ribosomes': 'Ribosomes are tiny protein factories.', 'Lysosome': 'Lysosomes are the clean-up crew.', 'Cytoplasm': 'Organelles float in the cytoplasm.', 'Chloroplast': 'Chloroplasts contain chlorophyll, which captures sunlight.', 'Cell wall': 'The cell wall surrounds the membrane and holds the plant up.', 'Large vacuole': 'When the vacuole is full of water, the plant stands tall. When it empties, the plant wilts.', 'Plant vs animal': 'Plant cells have a cell wall, chloroplasts and a large vacuole.' };
  function build(lv) { const m = Array.from({ length: ROWS }, () => Array(COLS).fill(' '));
    for (let c = 0; c < COLS; c++) { m[8][c] = m[9][c] = '#'; }
    [18, 35, 53, 71, 91, 112].forEach((g, i) => { for (let k = 0; k < 2 + (i % 2) + lv; k++) { m[8][g + k] = m[9][g + k] = ' '; } });
    [[14, 4], [30, 5], [48, 4], [66, 6], [86, 5], [106, 4], [120, 6]].forEach(([c0, n], i) => { for (let k = 0; k < n; k++) { m[i % 2 ? 4 : 5][c0 + k] = '='; m[(i % 2 ? 4 : 5) - 1][c0 + k] = 'o'; } });
    for (let c = 3; c < COLS - 8; c += 3) if (m[8][c] === '#' && m[7][c] === ' ') m[7][c] = 'o';
    const Q = [9, 27, 45, 63, 83, 103]; Q.forEach((c, i) => { m[5][c] = 'Q'; m[7][c] = ' '; });
    for (let r = 6; r <= 7; r++) for (let c = 128; c < 132; c++) m[r][c] = ' ';
    [126, 127, 128].forEach((c, i) => { for (let r = 7 - i; r < 8; r++) m[r][c] = '#'; });
    return { m, Q, germs: [23, 40, 58, 77, 97, 117].map(c => ({ x: c * T, y: OY + 7 * T, vx: -60 - lv * 15, dead: 0 })), exit: 134 };
  }
  const solid = (L, c, r) => { if (c < 0 || c >= COLS || r < 0) return c < 0 || c >= COLS; if (r >= ROWS) return false; const ch = L.m[r][c]; return ch === '#' || ch === '=' || ch === 'Q' || ch === 'U'; };
  function bot(c, x, y, face, t, run) { c.save(); c.translate(x, y); c.scale(face, 1);
    const leg = run ? Math.sin(t * 18) * 6 : 0; c.fillStyle = '#3b4a7a'; D.rr(c, -11, 10, 8, 14 + leg * .3, 3); c.fill(); D.rr(c, 3, 10, 8, 14 - leg * .3, 3); c.fill();
    D.gloss(c, 0, -4, 18, '#eaf2ff'); c.fillStyle = '#1b2a5a'; D.rr(c, -4, -14, 20, 13, 6); c.fill(); c.fillStyle = '#7ff0ff'; c.beginPath(); c.arc(5, -8, 3, 0, 7); c.arc(12, -8, 3, 0, 7); c.fill();
    c.strokeStyle = '#8a9bc8'; c.lineWidth = 2; c.beginPath(); c.moveTo(-4, -21); c.lineTo(-8, -30); c.stroke(); D.gloss(c, -8, -32, 4, '#ff5d8f'); c.restore(); }
  function flask(c, x, y) { c.save(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - 5, y - 13); c.lineTo(x + 5, y - 13); c.lineTo(x + 5, y - 4); c.lineTo(x + 13, y + 11); c.quadraticCurveTo(x + 14, y + 14, x + 10, y + 14); c.lineTo(x - 10, y + 14); c.quadraticCurveTo(x - 14, y + 14, x - 13, y + 11); c.lineTo(x - 5, y - 4); c.closePath(); c.fill(); c.fillStyle = '#ff7aa8'; c.beginPath(); c.moveTo(x - 9, y + 6); c.lineTo(x + 9, y + 6); c.lineTo(x + 11, y + 11); c.lineTo(x - 11, y + 11); c.fill(); c.restore(); }
  function germ(c, g, t) { c.save(); c.translate(g.x + T / 2, g.y + T - 18); const sq = g.dead > 0 ? .35 : 1; c.scale(1, sq); D.spiky(c, 0, 0, 15, '#9b5de5', 9, t * 2); D.gloss(c, 0, 0, 15, '#b57cf0'); D.face(c, 0, 0, 14, '#2a0a40'); c.restore(); }
  function sky(c, cam, lv) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, lv ? '#8fe08a' : '#7fd3ff'); g.addColorStop(1, lv ? '#e6ffc9' : '#dff4ff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) { const x = ((i * 260 - cam * .3) % (W + 300) + W + 300) % (W + 300) - 150; D.cloud(c, x, 90 + (i % 3) * 40, 26 + (i % 2) * 10, .85); }
    c.save(); c.globalAlpha = .35; for (let i = 0; i < 7; i++) { const x = ((i * 330 - cam * .5) % (W + 400) + W + 400) % (W + 400) - 200; D.gloss(c, x, 330, 70 + (i % 3) * 20, lv ? '#6cc46a' : '#ffb3d1'); } c.restore(); }
  function make(A) {
    const st = { lv: 0, L: build(0), cam: 0, used: {}, asked: 0, coins: 0 };
    const p = { x: 2 * T, y: OY + 6 * T, vx: 0, vy: 0, w: 28, h: 40, on: false, face: 1, inv: 0, coyote: 0 };
    function reset() { Object.assign(p, { x: 2 * T, y: OY + 6 * T, vx: 0, vy: 0 }); st.cam = 0; }
    function hitTile(L, x, y) { return solid(L, Math.floor(x / T), Math.floor((y - OY) / T)); }
    async function bump(c, r) { const L = st.L; L.m[r][c] = 'U'; const qi = L.Q.indexOf(c), O = ORG[Math.min(1, st.lv)][qi]; A.sfx.pick();
      const ok = await A.ask({ q: O[2], opts: O[3], a: 0, why: WHY[O[0]] || '', tag: 'Organelle: ' + O[0], reward: '+300 and a star' }); if (ok) { A.add(300, c * T - st.cam + T / 2, OY + r * T - 10); A.fx.burst(c * T - st.cam + T / 2, OY + r * T, '#ffe066', 26); } }
    return {
      _st: st, _p: p,
      update(dt) {
        const L = st.L, acc = 1900, maxv = 270; let ax = 0; if (A.key('left')) ax -= 1; if (A.key('right')) ax += 1;
        if (A.ptr.down) { const sx = p.x - st.cam; if (A.ptr.x < sx - 30) ax = -1; else if (A.ptr.x > sx + 30) ax = 1; }
        if (ax) { p.vx = A.clamp(p.vx + ax * acc * dt, -maxv, maxv); p.face = ax; } else p.vx *= Math.pow(.0005, dt);
        p.coyote = p.on ? .1 : p.coyote - dt;
        if ((A.hit('up') || A.hit('fire') || (A.ptr.tap && A.ptr.y < H * .6)) && p.coyote > 0) { p.vy = -700; p.coyote = 0; A.sfx.flap(); }
        if (!A.key('up') && !A.key('fire') && !A.ptr.down && p.vy < -250) p.vy += 2600 * dt;
        p.vy = Math.min(900, p.vy + 1800 * dt);
        /* horizontal */ p.x += p.vx * dt; const top = p.y - p.h, edgeX = p.vx > 0 ? p.x + p.w / 2 : p.x - p.w / 2;
        if ([top + 2, top + p.h / 2, p.y - 2].some(yy => hitTile(L, edgeX, yy))) { const c = Math.floor(edgeX / T); p.x = p.vx > 0 ? c * T - p.w / 2 - .01 : (c + 1) * T + p.w / 2 + .01; p.vx = 0; }
        /* vertical */ p.y += p.vy * dt; p.on = false;
        if (p.vy >= 0 && [p.x - p.w / 2 + 3, p.x + p.w / 2 - 3].some(xx => hitTile(L, xx, p.y))) { const r = Math.floor((p.y - OY) / T); p.y = OY + r * T - .01; p.vy = 0; p.on = true; }
        if (p.vy < 0) { const hy = p.y - p.h; for (const xx of [p.x - p.w / 2 + 4, p.x, p.x + p.w / 2 - 4]) { if (hitTile(L, xx, hy)) { const c = Math.floor(xx / T), r = Math.floor((hy - OY) / T); p.y = OY + (r + 1) * T + p.h + .01; p.vy = 60; if (L.m[r] && L.m[r][c] === 'Q') bump(c, r); break; } } }
        p.x = Math.max(p.w / 2, p.x);
        if (p.y > H + 80) { A.hurt('You fell out of the cell! Watch out for the gaps.'); if (A.lives > 0) reset(); return; }
        /* coins */ const pc = Math.floor(p.x / T), pr = Math.floor((p.y - 20 - OY) / T); [[pc, pr], [pc, pr - 1]].forEach(([cc, rr]) => { if (L.m[rr] && L.m[rr][cc] === 'o') { L.m[rr][cc] = ' '; st.coins++; A.add(10); A.sfx.pick(); } });
        /* germs */ if (p.inv > 0) p.inv -= dt;
        L.germs.forEach(g => { if (g.dead) { g.dead -= dt; return; } if (Math.abs(g.x - p.x) > W) return; g.x += g.vx * dt; const ahead = g.vx > 0 ? g.x + T : g.x, fc = Math.floor(ahead / T); if (solid(L, fc, 7) || !solid(L, fc, 8)) g.vx *= -1;
          const gx = g.x + T / 2, gy = g.y + T - 18; if (Math.abs(gx - p.x) < 30 && Math.abs(gy - (p.y - 20)) < 34) {
            if (p.vy > 0 && p.y - gy < 10) { g.dead = 99; p.vy = -480; A.add(100, gx - st.cam, gy - 20); A.sfx.hit(); A.fx.burst(gx - st.cam, gy, '#b57cf0', 16); }
            else if (p.inv <= 0) { p.inv = 1.6; p.vx = (p.x < gx ? -1 : 1) * 320; p.vy = -380; A.hurt('A germ got you! Jump on germs to stop them.'); } } });
        L.germs = L.germs.filter(g => !(g.dead > 0 && g.dead < 98.5));
        /* exit */ if (p.x > L.exit * T) { A.sfx.power(); A.add(1000, W / 2, H / 2); st.lv++;
          if (st.lv >= 2) { A.over(true, `You explored an animal cell and a plant cell and collected <b>${st.coins}</b> ATP.`); return; }
          st.L = build(1); reset(); A.toast('<b>Level 2: a plant cell!</b> Look for the parts animal cells don’t have.', 3.6); }
        st.cam = A.clamp(p.x - W * .4, 0, COLS * T - W);
      },
      draw(c) {
        const L = st.L, cam = st.cam; sky(c, cam, Math.min(1, st.lv));
        L.Q.forEach((qc, i) => { const O = ORG[Math.min(1, st.lv)][i], x = qc * T - cam + T / 2; if (x < -200 || x > W + 200) return; c.save(); c.globalAlpha = .9; D.glow(c, O[1], 16); D.gloss(c, x + 60, OY + 7 * T - 30, 34, O[1]); c.restore(); D.text(c, O[0], x + 60, OY + 7 * T - 76, { size: 14, align: 'center', color: '#1b2a5a' }); });
        const c0 = Math.max(0, Math.floor(cam / T) - 1), c1 = Math.min(COLS, c0 + Math.ceil(W / T) + 3);
        for (let r = 0; r < ROWS; r++) for (let cc = c0; cc < c1; cc++) { const ch = L.m[r][cc], x = cc * T - cam, y = OY + r * T;
          if (ch === '#') { D.glossRect(c, x + 1, y + 1, T - 2, T - 2, 8, r === 8 || L.m[r - 1] && L.m[r - 1][cc] !== '#' ? (st.lv ? '#4caf50' : '#ff7aa8') : (st.lv ? '#8d6e4a' : '#c75b8a')); }
          else if (ch === '=') D.glossRect(c, x + 1, y + 1, T - 2, T * .6, 10, st.lv ? '#6fcf5a' : '#7c8cff');
          else if (ch === 'Q' || ch === 'U') { D.glossRect(c, x + 2, y + 2, T - 4, T - 4, 10, ch === 'Q' ? '#ffb020' : '#b8a48a'); if (ch === 'Q') flask(c, x + T / 2, y + T / 2); }
          else if (ch === 'o') { c.save(); const s = Math.abs(Math.sin(A.t * 3 + cc)); c.translate(x + T / 2, y + T / 2); c.scale(.4 + .6 * s, 1); D.gloss(c, 0, 0, 12, '#ffc93c'); c.restore(); if (s > .6) D.text(c, 'ATP', x + T / 2, y + T / 2 + 3, { size: 8, align: 'center', color: '#7a4a00' }); } }
        /* exit portal */ const ex = L.exit * T - cam; c.save(); D.glow(c, '#7ff0ff', 24); c.strokeStyle = '#7ff0ff'; c.lineWidth = 8; c.beginPath(); c.ellipse(ex + 30, OY + 6 * T, 34, 60, 0, 0, 7); c.stroke(); c.restore(); D.text(c, 'EXIT', ex + 30, OY + 4 * T - 10, { pix: true, size: 12, align: 'center', color: '#1b2a5a' });
        L.germs.forEach(g => { if (g.x - cam > -60 && g.x - cam < W + 60) germ(c, { ...g, x: g.x - cam }, A.t); });
        if (!(p.inv > 0 && Math.floor(A.t * 12) % 2)) bot(c, p.x - cam, p.y - 24, p.face, A.t, Math.abs(p.vx) > 30 && p.on);
        D.text(c, (st.lv ? 'PLANT CELL' : 'ANIMAL CELL') + `  ·  ATP ${st.coins}`, 14, 60, { pix: true, size: 10, color: '#1b2a5a' });
      },
      hud() { return { mid: `LEVEL ${Math.min(2, st.lv + 1)}/2` }; }
    };
  }
  function preview(c, t) { sky(c, t * 40, 0); for (let i = 0; i < 21; i++) { D.glossRect(c, i * T + 1, OY + 8 * T + 1, T - 2, T - 2, 8, '#ff7aa8'); D.glossRect(c, i * T + 1, OY + 9 * T + 1, T - 2, T - 2, 8, '#c75b8a'); }
    for (let i = 0; i < 4; i++) D.glossRect(c, (8 + i) * T + 1, OY + 5 * T + 1, T - 2, T * .6, 10, '#7c8cff'); D.glossRect(c, 13 * T + 2, OY + 4 * T + 2, T - 4, T - 4, 10, '#ffb020'); flask(c, 13 * T + T / 2, OY + 4 * T + T / 2);
    D.gloss(c, 760, OY + 7 * T - 30, 34, '#b07cff'); germ(c, { x: 560 + Math.sin(t) * 60, y: OY + 7 * T }, t); bot(c, 260, OY + 8 * T - 24 - Math.abs(Math.sin(t * 3)) * 70, 1, t, true); }
  AR.reg({ id: 'plat', subject: 'Biology', diff: 'Easy', title: 'Cell Quest', sub: 'Explore a cell and its organelles, level by level', topic: 'Cells & organelles', color: '#7c8cff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="10" cy="10" r="3"/><circle cx="16" cy="15" r="1.6"/></svg>',
    intro: 'Run and jump through an <b>animal cell</b>, then a <b>plant cell</b>. Bump the <b>quiz blocks</b> (the orange flask blocks) at each organelle to answer a question about it.',
    how: ['Move with <b>← →</b>, jump with <b>↑</b> or <b>Space</b>. On touch screens, hold left or right of Cellbot to run and tap high to jump.', 'Jump up into a <b>quiz block</b> to get a question about the organelle next to it.', 'Stomp <b>germs</b> from above, collect <b>ATP</b>, avoid the gaps, and reach the exit.'],
    keys: '<kbd>←</kbd><kbd>→</kbd> run · <kbd>↑</kbd> / <kbd>Space</kbd> jump', pad: { dirs: ['left', 'right'], acts: [['fire', 'JUMP']] },
    recap: 'Both cells have a nucleus, cell membrane, cytoplasm, mitochondria and ribosomes. Plant cells also have a cell wall, chloroplasts and a large vacuole.', winTitle: 'Cell explorer!', loseTitle: 'Lost in the cytoplasm', make, preview });
})();
