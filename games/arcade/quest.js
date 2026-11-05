/* Cell Quest: a maze game inside a cell. You are a transport vesicle. Eat nutrients, pick up cargo and deliver it
   to the organelle that uses it. Free radicals chase you; an antioxidant lets you neutralize them for a few seconds. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H;
  const MAP = [
    '#########################',
    '#N..........#..........M#',
    '#.###.#####.#.#####.###.#',
    '#o###.#####.#.#####.###o#',
    '#.......................#',
    '#.###.#.#########.#.###.#',
    '#.....#..... .....#.....#',
    '#.###.#.#########.#.###.#',
    '#.......................#',
    '#o###.#####.#.#####.###o#',
    '#.###.#####.#.#####.###.#',
    '#R..........#..........G#',
    '#########################'];
  const COLS = 25, ROWS = 13, T = 36, OX = (W - COLS * T) / 2, OY = 52;
  const px = c => OX + c * T + T / 2, py = r => OY + r * T + T / 2;
  const wall = (c, r) => r < 0 || r >= ROWS || c < 0 || c >= COLS || MAP[r][c] === '#';
  const ORG = { N: { name: 'Nucleus', col: '#b98cff' }, M: { name: 'Mitochondrion', col: '#ff9a3c' }, R: { name: 'Ribosome', col: '#4be3c0' }, G: { name: 'Golgi body', col: '#ff6fb5' } };
  const POS = {}; MAP.forEach((row, r) => [...row].forEach((ch, c) => { if (ORG[ch]) POS[ch] = { c, r }; }));
  const CARGO = [
    ['mRNA', 'R', 'Ribosomes read mRNA and build the protein it codes for.'],
    ['Amino acids', 'R', 'Ribosomes link amino acids together into a protein chain.'],
    ['Glucose + O₂', 'M', 'Mitochondria use glucose and oxygen in cellular respiration to make ATP.'],
    ['Pyruvate', 'M', 'Pyruvate from glycolysis enters the mitochondrion for the Krebs cycle.'],
    ['New protein', 'G', 'The Golgi body modifies, sorts and packages proteins to ship out.'],
    ['Unsorted protein', 'G', 'The Golgi tags proteins with “address labels” so they reach the right place.'],
    ['Nucleotides', 'N', 'DNA is copied in the nucleus, so new nucleotides go there.'],
    ['RNA polymerase', 'N', 'Transcription (DNA → mRNA) happens in the nucleus.']];
  const QS = [
    { q: 'Which organelle makes most of a cell’s ATP?', opts: ['Mitochondrion', 'Ribosome', 'Golgi body', 'Nucleus'], a: 0, why: 'Cellular respiration in the mitochondria produces most of the ATP.' },
    { q: 'Where are proteins assembled from amino acids?', opts: ['Ribosomes', 'Lysosomes', 'Nucleus', 'Cell membrane'], a: 0, why: 'Ribosomes translate mRNA and join amino acids into proteins.' },
    { q: 'What does the Golgi body do?', opts: ['Modifies, sorts and ships proteins', 'Stores DNA', 'Makes glucose', 'Breaks down old organelles'], a: 0, why: 'Think of the Golgi as the cell’s post office.' },
    { q: 'Free radicals damage cells because they', opts: ['have an unpaired electron and steal electrons from molecules', 'are viruses', 'block all ATP production', 'are made only by plants'], a: 0, why: 'Antioxidants donate an electron and neutralize them.' },
    { q: 'Where does transcription (DNA → mRNA) take place in a eukaryotic cell?', opts: ['Nucleus', 'Ribosome', 'Golgi body', 'Mitochondrion'], a: 0, why: 'DNA stays in the nucleus; the mRNA copy travels out to the ribosomes.' },
    { q: 'Which structure controls what enters and leaves the cell?', opts: ['Cell membrane', 'Ribosome', 'Nucleolus', 'Cytoplasm'], a: 0, why: 'The selectively permeable membrane lets some substances through and blocks others.' }];

  /* walls drawn once into an offscreen canvas */
  let WALLS = null;
  function walls() {
    if (WALLS) return WALLS; const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.lineWidth = 3; c.strokeStyle = '#2e8bff'; c.shadowColor = '#2e8bff'; c.shadowBlur = 10; c.lineCap = 'round';
    for (let r = 0; r < ROWS; r++) for (let cc = 0; cc < COLS; cc++) { if (!wall(cc, r)) continue; const x = OX + cc * T, y = OY + r * T, i = 6;
      c.beginPath(); if (!wall(cc, r - 1) && r > 0) { c.moveTo(x, y + i); c.lineTo(x + T, y + i); } if (!wall(cc, r + 1) && r < ROWS - 1) { c.moveTo(x, y + T - i); c.lineTo(x + T, y + T - i); }
      if (!wall(cc - 1, r) && cc > 0) { c.moveTo(x + i, y); c.lineTo(x + i, y + T); } if (!wall(cc + 1, r) && cc < COLS - 1) { c.moveTo(x + T - i, y); c.lineTo(x + T - i, y + T); } c.stroke(); }
    c.shadowBlur = 0; c.strokeStyle = '#5fb0ff'; c.lineWidth = 3; D.rr(c, OX + 4, OY + 4, COLS * T - 8, ROWS * T - 8, 16); c.stroke();
    WALLS = cv; return cv;
  }
  function organelle(c, k, t, hl) {
    const o = ORG[k], p = POS[k], x = px(p.c), y = py(p.r); c.save(); D.glow(c, o.col, hl ? 24 : 12);
    c.strokeStyle = o.col; c.fillStyle = o.col + '33'; c.lineWidth = 3;
    if (k === 'N') { c.beginPath(); c.arc(x, y, 15, 0, 7); c.fill(); c.stroke(); c.fillStyle = o.col; c.beginPath(); c.arc(x + 3, y - 2, 5, 0, 7); c.fill(); }
    else if (k === 'M') { c.beginPath(); c.ellipse(x, y, 17, 10, -.5, 0, 7); c.fill(); c.stroke(); c.beginPath(); for (let i = -2; i <= 2; i++) { c.moveTo(x + i * 5 - 3, y + i * 2.6 - 5); c.lineTo(x + i * 5 + 3, y + i * 2.6 + 5); } c.stroke(); }
    else if (k === 'R') { c.fillStyle = o.col; c.beginPath(); c.arc(x - 3, y + 4, 9, 0, 7); c.fill(); c.beginPath(); c.arc(x + 4, y - 6, 7, 0, 7); c.fill(); }
    else { for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(x, y - 8 + i * 8, 16 - i * 2, 3.5, 0, 0, 7); c.stroke(); } }
    c.restore();
    D.text(c, o.name.toUpperCase(), x + (p.c < 12 ? -6 : 6), p.r < 6 ? OY - 6 : OY + ROWS * T + 14, { pix: true, size: 8, align: p.c < 12 ? 'left' : 'right', color: o.col, glow: o.col, blur: 6 });
  }
  function vesicle(c, x, y, t, carry) { c.save(); D.glow(c, '#7fe8ff', 16); c.fillStyle = '#7fe8ff'; c.beginPath(); c.arc(x, y, 13, 0, 7); c.fill(); c.shadowBlur = 0; c.fillStyle = '#d9fbff'; c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill();
    c.strokeStyle = '#0e4d75'; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.lineDashOffset = -t * 20; c.beginPath(); c.arc(x, y, 11, 0, 7); c.stroke(); c.setLineDash([]); D.face(c, x, y, 11, '#0e2a4a');
    if (carry) { c.fillStyle = '#ffe066'; D.glow(c, '#ffe066', 10); c.beginPath(); c.moveTo(x, y - 25); c.lineTo(x + 6, y - 19); c.lineTo(x, y - 13); c.lineTo(x - 6, y - 19); c.fill(); } c.restore(); }
  const RCOL = ['#ff4d6d', '#ff8c42', '#e05bff', '#ffd23f'];
  function radical(c, x, y, i, t, scared, blink) { const col = scared ? (blink ? '#ffffff' : '#4a6cff') : RCOL[i % 4]; c.save(); D.glow(c, col, 12); D.spiky(c, x, y, 10, col, 9, t * (i % 2 ? 1.5 : -1.5)); c.shadowBlur = 0; D.face(c, x, y, 10, scared ? '#1b2a6b' : '#2a0010');
    if (!scared) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 12, y - 12, 2.6, 0, 7); c.fill(); } c.restore(); }

  function make(A) {
    const st = { level: 1, dots: new Set(), pow: new Set(), cargo: null, carry: null, task: 0, delivered: 0, power: 0, combo: 0, msgT: 0 };
    const pl = { x: 12, y: 8, tx: 12, ty: 8, dx: 0, dy: 0, wx: 0, wy: 0 };
    let ens = []; const ORDER = A.shuffle(CARGO);
    function reset(full) {
      if (full) { st.dots.clear(); st.pow.clear(); MAP.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '.') st.dots.add(c + ',' + r); if (ch === 'o') st.pow.add(c + ',' + r); })); st.dots.delete('12,8'); }
      Object.assign(pl, { x: 12, y: 8, tx: 12, ty: 8, dx: 0, dy: 0, wx: 0, wy: 0 });
      const n = Math.min(4, 2 + st.level); ens = Array.from({ length: n }, (_, i) => ({ x: 10 + i * 1.5 | 0, y: 6, tx: 10 + i * 1.5 | 0, ty: 6, dx: 0, dy: 0, i, wait: 1.2 + i * 1.3, dead: 0 }));
      st.power = 0;
    }
    function newCargo() { const free = [...st.dots].filter(k => { const [c, r] = k.split(',').map(Number); return Math.abs(c - Math.round(pl.x)) + Math.abs(r - Math.round(pl.y)) > 6; });
      const k = A.pick(free.length ? free : [...st.dots, '12,4']); const [c, r] = k.split(',').map(Number); st.cargo = { c, r, item: ORDER[st.task % ORDER.length] }; st.task++; }
    reset(true); newCargo();
    function move(e, amt, decide) {
      let d = amt, guard = 0;
      while (d > 1e-6 && guard++ < 8) { const rx = e.tx - e.x, ry = e.ty - e.y, L = Math.abs(rx) + Math.abs(ry);
        if (L <= d) { e.x = e.tx; e.y = e.ty; d -= L; decide(e); if ((e.dx || e.dy) && !wall(e.x + e.dx, e.y + e.dy)) { e.tx = e.x + e.dx; e.ty = e.y + e.dy; } else { e.dx = e.dy = 0; return; } }
        else { e.x += Math.sign(rx) * d; e.y += Math.sign(ry) * d; d = 0; } }
    }
    const decideP = e => { if ((e.wx || e.wy) && !wall(e.x + e.wx, e.y + e.wy)) { e.dx = e.wx; e.dy = e.wy; } else if (wall(e.x + e.dx, e.y + e.dy)) { e.dx = e.dy = 0; } };
    const decideE = e => { const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => !wall(e.x + a, e.y + b) && !(a === -e.dx && b === -e.dy && (e.dx || e.dy)));
      const all = opts.length ? opts : [[-e.dx, -e.dy]]; const dist = ([a, b]) => Math.hypot(e.x + a - pl.x, e.y + b - pl.y);
      let ch; if (st.power > 0) ch = all.slice().sort((p, q) => dist(q) - dist(p))[0]; else if (Math.random() < .55 + st.level * .1 && e.i !== 3) ch = all.slice().sort((p, q) => dist(p) - dist(q))[0]; else ch = A.pick(all);
      e.dx = ch[0]; e.dy = ch[1]; };
    async function levelUp() {
      A.sfx.power(); A.add(500, W / 2, H / 2); st.level++;
      const ok = await A.ask({ ...A.pick(QS), tag: 'Bonus question · level ' + (st.level - 1) + ' cleared', reward: 'Collect an extra life' });
      if (ok) A.lives = Math.min(5, A.lives + 1);
      if (st.level > 3) { A.over(true, `You delivered <b>${st.delivered}</b> cargo loads to the right organelles.`); return; }
      reset(true); newCargo(); A.toast(`Level ${st.level}: more free radicals, and they’re faster!`);
    }
    return {
      _st: st,
      update(dt) {
        if (A.key('left')) { pl.wx = -1; pl.wy = 0; } else if (A.key('right')) { pl.wx = 1; pl.wy = 0; } else if (A.key('up')) { pl.wx = 0; pl.wy = -1; } else if (A.key('down')) { pl.wx = 0; pl.wy = 1; }
        if (A.ptr.tap) { const dx = A.ptr.x - px(pl.x), dy = A.ptr.y - py(pl.y); if (Math.abs(dx) > Math.abs(dy)) { pl.wx = Math.sign(dx); pl.wy = 0; } else { pl.wx = 0; pl.wy = Math.sign(dy); } }
        if ((pl.wx && pl.wx === -pl.dx) || (pl.wy && pl.wy === -pl.dy)) { pl.tx -= pl.dx; pl.ty -= pl.dy; pl.dx = pl.wx; pl.dy = pl.wy; }
        move(pl, 5.6 * dt, decideP);
        const pc = Math.round(pl.x), pr = Math.round(pl.y), key = pc + ',' + pr;
        if (st.dots.delete(key)) { A.add(10); if (Math.random() < .3) A.sfx.pick(); }
        if (st.pow.delete(key)) { st.power = 7; st.combo = 0; A.sfx.power(); A.toast('<b>Antioxidant!</b> It gives free radicals an electron. Catch them now!'); }
        if (st.cargo && !st.carry && pc === st.cargo.c && pr === st.cargo.r) { st.carry = st.cargo.item; st.cargo = null; A.sfx.pick(); A.toast(`Picked up <b>${st.carry[0]}</b>. Which organelle needs it?`, 3.2); }
        const here = MAP[pr][pc];
        if (ORG[here] && st.carry && Math.abs(pl.x - pc) + Math.abs(pl.y - pr) < .2) {
          if (here === st.carry[1]) { A.add(250, px(pc), py(pr) - 20); A.sfx.good(); A.toast(`<b>Delivered!</b> ${st.carry[2]}`, 3.4); st.carry = null; st.delivered++; newCargo(); }
          else if (st.wrongAt !== here) { st.wrongAt = here; A.add(-50, px(pc), py(pr) - 20); A.sfx.bad(); A.toast(`The ${ORG[here].name.toLowerCase()} doesn’t use <b>${st.carry[0]}</b>. Try another organelle.`); }
        }
        if (!ORG[here]) st.wrongAt = null;
        if (st.power > 0) st.power -= dt;
        const sp = (st.power > 0 ? 3 : 3.9 + st.level * .45);
        ens.forEach(e => { if (e.dead > 0) { e.dead -= dt; return; } if (e.wait > 0) { e.wait -= dt; return; } move(e, sp * dt, decideE);
          if (Math.hypot(e.x - pl.x, e.y - pl.y) < .7) { if (st.power > 0) { st.combo++; const pts = 200 * st.combo; A.add(pts, px(e.x), py(e.y)); A.fx.burst(px(e.x), py(e.y), '#9fb4ff', 18); A.sfx.hit(); Object.assign(e, { x: 12, y: 6, tx: 12, ty: 6, dx: 0, dy: 0, dead: 3 }); }
            else { A.fx.burst(px(pl.x), py(pl.y), '#7fe8ff', 24); A.hurt('A free radical stole an electron from you! Grab an antioxidant to fight back.'); if (A.lives > 0) reset(false); } } });
        if (!st.dots.size && A.lives > 0) { st.dots.add('x'); levelUp(); }
      },
      draw(c) {
        D.bg(c, '#040a22', '#071338'); c.drawImage(walls(), 0, 0);
        st.dots.forEach(k => { const [cc, r] = k.split(',').map(Number); if (isNaN(r)) return; c.fillStyle = '#ffe9a8'; c.fillRect(px(cc) - 2.5, py(r) - 2.5, 5, 5); });
        st.pow.forEach(k => { const [cc, r] = k.split(',').map(Number); c.save(); D.glow(c, '#4be37a', 14); c.fillStyle = '#4be37a'; c.beginPath(); c.arc(px(cc), py(r), 7 + Math.sin(A.t * 6) * 1.5, 0, 7); c.fill(); c.restore(); });
        Object.keys(ORG).forEach(k => organelle(c, k, A.t, st.carry && st.carry[1] === k && false));
        if (st.cargo) { const x = px(st.cargo.c), y = py(st.cargo.r); c.save(); D.glow(c, '#ffe066', 18); c.fillStyle = '#ffe066'; c.translate(x, y); c.rotate(A.t * 2); c.fillRect(-7, -7, 14, 14); c.restore(); D.text(c, st.cargo.item[0], x, y - 15, { size: 12, align: 'center', color: '#ffe066' }); }
        ens.forEach(e => { if (e.dead > 0) return; radical(c, px(e.x), py(e.y), e.i, A.t, st.power > 0, st.power > 0 && st.power < 2 && Math.floor(A.t * 8) % 2); });
        vesicle(c, px(pl.x), py(pl.y), A.t, !!st.carry);
      },
      hud() { return { mid: st.carry ? `CARRYING: ${st.carry[0]} → ?` : st.cargo ? `FIND THE CARGO: ${st.cargo.item[0]}` : '', right: 'LV ' + Math.min(3, st.level) }; },
      idle() {}
    };
  }
  function preview(c, t) {
    D.bg(c, '#040a22', '#071338'); c.drawImage(walls(), 0, 0);
    MAP.forEach((row, r) => [...row].forEach((ch, cc) => { if (ch === '.') { c.fillStyle = '#ffe9a8'; c.fillRect(px(cc) - 2.5, py(r) - 2.5, 5, 5); } }));
    Object.keys(ORG).forEach(k => organelle(c, k, t));
    const x = 1 + ((t * 3) % 22); c.fillStyle = '#040a22'; c.fillRect(px(1) - 8, py(4) - 8, px(x) - px(1), 16);
    vesicle(c, px(x), py(4), t, true); [0, 1, 2].forEach(i => radical(c, px(x - 4 - i * 2.2), py(4), i, t, false));
    radical(c, px(12 + Math.sin(t) * 4), py(8), 3, t, true);
  }
  AR.reg({ id: 'quest', title: 'Cell Quest', sub: 'Deliver cargo to the right organelle', topic: 'Cells & organelles', color: '#39a0ff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="10" cy="10" r="3"/><circle cx="16" cy="15" r="1.6"/><circle cx="8" cy="16" r="1.2"/></svg>',
    intro: 'You are a <b>transport vesicle</b> zipping through the cytoplasm. Pick up cargo and deliver it to the organelle that uses it.',
    how: ['Move with the <b>arrow keys</b> or <b>WASD</b> (or tap where you want to go).', 'Grab the glowing <b>cargo</b>, then carry it to the right corner organelle: nucleus, mitochondrion, ribosome or Golgi body.', '<b>Free radicals</b> chase you. Eat a green <b>antioxidant</b> to neutralize them for a few seconds.', 'Eat every nutrient to clear the level. Clear 3 levels to win.'],
    keys: '<kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> move', pad: { dirs: ['left', 'up', 'down', 'right'] },
    recap: 'Nucleus = DNA and transcription · Ribosome = builds proteins · Golgi = packages and ships · Mitochondrion = ATP from respiration.', winTitle: 'The cell is running smoothly', loseTitle: 'Too much oxidative damage', make, preview });
})();
