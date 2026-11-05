/* Mitosis Master: cells roll in one at a time. Four stages: name the phase, pick what comes next, count chromosomes,
   then spot the cell-division errors. Answer before the timer ring runs out. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H;
  const PH = ['Interphase', 'Prophase', 'Metaphase', 'Anaphase', 'Telophase'];
  const PAIRC = [['#ff6fb5', '#ff9fd0'], ['#5fb7ff', '#9fd4ff'], ['#ffd23f', '#ffe68a'], ['#4be37a', '#9af0b4']];
  /* one chromosome: an X (two sister chromatids) or a single chromatid (anaphase) */
  function chrom(c, x, y, s, col, single, ang = 0) { c.save(); c.translate(x, y); c.rotate(ang); c.strokeStyle = col; c.lineWidth = s * .32; c.lineCap = 'round';
    if (single) { c.beginPath(); c.moveTo(-s * .5, -s * .7); c.quadraticCurveTo(0, 0, -s * .5, s * .7); c.stroke(); }
    else { c.beginPath(); c.moveTo(-s * .45, -s * .8); c.quadraticCurveTo(0, 0, -s * .45, s * .8); c.moveTo(s * .45, -s * .8); c.quadraticCurveTo(0, 0, s * .45, s * .8); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, 0, s * .16, 0, 7); c.fill(); }
    c.restore(); }
  /* draw a cell in a phase. n = number of chromosomes (2n). err: 'plate' | 'nondis' | 'uneven' */
  function cell(c, x, y, R, ph, n = 4, err = null, t = 0) {
    c.save(); const el = ph >= 3 ? 1.25 : 1; D.glow(c, '#8fd0ff', 18);
    c.fillStyle = 'rgba(120,180,255,.13)'; c.strokeStyle = '#8fd0ff'; c.lineWidth = 3;
    if (ph === 4) { c.beginPath(); c.ellipse(x - R * .56, y, R * .6, R * .74, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(x + R * .56, y, R * .6, R * .74, 0, 0, 7); c.fill(); c.stroke(); }
    else { c.beginPath(); c.ellipse(x, y, R * el, R, 0, 0, 7); c.fill(); c.stroke(); }
    c.shadowBlur = 0; const cols = i => PAIRC[Math.floor(i / 2) % 4][i % 2], sz = R * .17;
    if (ph === 0) { c.strokeStyle = '#c99bff'; c.fillStyle = 'rgba(185,140,255,.18)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, R * .45, 0, 7); c.fill(); c.stroke();
      for (let i = 0; i < n; i++) { c.strokeStyle = cols(i); c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 9; k++) { const a = i * 1.7 + k * .5, rr = R * (.1 + k * .03); c[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.stroke(); }
      c.fillStyle = '#c99bff'; c.beginPath(); c.arc(x + R * .12, y - R * .1, R * .09, 0, 7); c.fill(); }
    const pole = (px) => { c.fillStyle = '#ffe066'; c.beginPath(); c.arc(px, y, R * .07, 0, 7); c.fill(); };
    const fibers = (px, pts) => { c.strokeStyle = 'rgba(255,230,120,.45)'; c.lineWidth = 1.3; pts.forEach(([qx, qy]) => { c.beginPath(); c.moveTo(px, y); c.lineTo(qx, qy); c.stroke(); }); };
    if (ph === 1) { c.strokeStyle = '#c99bff'; c.setLineDash([6, 7]); c.lineWidth = 2; c.beginPath(); c.arc(x, y, R * .55, 0, 7); c.stroke(); c.setLineDash([]);
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + .4; chrom(c, x + Math.cos(a) * R * .3, y + Math.sin(a) * R * .3, sz, cols(i), false, a); }
      pole(x - R * .78); pole(x + R * .78); }
    if (ph === 2) { const pl = x - R * .85, pr = x + R * .85, ys = i => y + (i - (n - 1) / 2) * R * 1.5 / n;
      const pts = Array.from({ length: n }, (_, i) => [err === 'plate' && i === 0 ? x - R * .42 : x, ys(i)]); fibers(pl, pts); fibers(pr, pts.filter((p, i) => !(err === 'plate' && i === 0)));
      pts.forEach(([qx, qy], i) => chrom(c, qx, qy, sz, cols(i), false, Math.PI / 2)); pole(pl); pole(pr);
      c.strokeStyle = 'rgba(255,255,255,.15)'; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(x, y - R * .85); c.lineTo(x, y + R * .85); c.stroke(); c.setLineDash([]); }
    if (ph === 3) { const pl = x - R * 1.1, pr = x + R * 1.1, ys = i => y + (i - (n - 1) / 2) * R * 1.4 / n;
      for (let i = 0; i < n; i++) { const yy = ys(i); let toL = true, toR = true; if (err === 'nondis' && i === 0) toR = false;
        if (toL) { const lx = x - R * .55 - (err === 'nondis' && i === 0 ? R * .05 : 0); fibers(pl, [[lx, yy]]); chrom(c, lx, yy, sz, cols(i), true, 0); if (!toR) chrom(c, lx + sz * .6, yy + sz * .5, sz, cols(i), true, 0); }
        if (toR) { const rx = x + R * .55; fibers(pr, [[rx, yy]]); chrom(c, rx, yy, sz, cols(i), true, Math.PI); } }
      pole(pl); pole(pr); }
    if (ph === 4) { [-1, 1].forEach(sd => { const cx = x + sd * R * .56; c.strokeStyle = '#c99bff'; c.lineWidth = 2; c.beginPath(); c.arc(cx, y, R * .4, 0, 7); c.stroke();
      const m = err === 'uneven' ? (sd < 0 ? n + 1 : n - 1) : n, cols2 = Math.ceil(m / 2);
      for (let i = 0; i < m; i++) { const row = i < cols2 ? 0 : 1, k = row ? i - cols2 : i, cnt = row ? m - cols2 : cols2; chrom(c, cx + (k - (cnt - 1) / 2) * R * .19, y + (row ? 1 : -1) * R * .15, sz * .85, cols(i % n), true, 0); } }); }
    c.restore(); }
  const ERRS = [['plate', 2, 'A chromosome isn’t lined up at the metaphase plate. The spindle checkpoint should stop division here.'], ['nondis', 3, 'Nondisjunction: two sister chromatids went to the same pole.'], ['uneven', 4, 'The daughter cells got different chromosome numbers.']];
  function make(A) {
    const st = { stage: 0, idx: 0, per: 8, cur: null, prev: null, tl: 8, lock: 0, combo: 0, fb: null, opts: [], right: 0 };
    const STG = [{ name: 'NAME THAT PHASE', help: 'What phase is this cell in?' }, { name: 'WHAT COMES NEXT?', help: 'Which phase comes right after this one?' }, { name: 'COUNT THE CHROMOSOMES', help: '' }, { name: 'SPOT THE ERROR', help: 'Is this cell dividing correctly?' }];
    function newCell() {
      st.prev = st.cur; const s = st.stage, n = A.pick([4, 4, 6]);
      let cur;
      if (s === 0) { const ph = A.pick([0, 1, 2, 3, 4]); cur = { ph, n, ask: STG[0].help, opts: PH.slice(), a: ph, why: ['Chromatin is loose inside an intact nucleus. The cell grows and copies its DNA.', 'Chromosomes condense into X shapes and the nuclear envelope breaks down.', 'Chromosomes line up single file in the middle (the metaphase plate).', 'Sister chromatids are pulled apart toward opposite poles.', 'Two new nuclei form and the cell pinches in two (cytokinesis).'][ph] }; }
      else if (s === 1) { const ph = A.pick([0, 1, 2, 3]); cur = { ph, n, ask: STG[1].help, opts: PH.slice(), a: ph + 1, why: `${PH[ph]} is followed by ${PH[ph + 1].toLowerCase()}. Order: interphase → prophase → metaphase → anaphase → telophase.` }; }
      else if (s === 2) { const ph = A.pick([1, 2, 4]), kind = A.pick(ph === 4 ? ['chrom'] : ['chrom', 'chromatid', 'daughter']); const ans = kind === 'chromatid' ? n * 2 : n;
        const q = { chrom: ph === 4 ? 'How many chromosomes are in EACH new nucleus?' : 'How many chromosomes are in this cell?', chromatid: 'How many chromatids are in this cell?', daughter: 'After mitosis, how many chromosomes will each daughter cell have?' }[kind];
        const set = [...new Set([ans, ans * 2, ans / 2, ans + 2, ans - 2].filter(v => v > 0 && Number.isInteger(v)))].slice(0, 4); while (set.length < 4) set.push(set.length * 3 + 1);
        cur = { ph, n, ask: q, opts: set.map(String), a: 0, why: kind === 'chromatid' ? `Each X-shaped chromosome has 2 sister chromatids: ${n} × 2 = ${n * 2}.` : `Count each X (or each single strand in a new nucleus) as one chromosome. Mitosis keeps the number the same: ${n}.` }; }
      else { const e = Math.random() < .5 ? A.pick(ERRS) : null, ph = e ? e[1] : A.pick([2, 3, 4]); cur = { ph, n, err: e && e[0], ask: STG[3].help, opts: ['Normal division', 'Something’s wrong'], a: e ? 1 : 0, why: e ? e[2] : 'Everything checks out: chromosomes split evenly so each daughter gets a full set.' }; }
      /* shuffle answer options but keep track of the right one */
      const order = s === 0 || s === 1 ? cur.opts.map((_, i) => i) : A.shuffle(cur.opts.map((_, i) => i)); cur.opts = order.map(i => cur.opts[i]); cur.a = order.indexOf(cur.a);
      st.cur = cur; st.tl = st.per; st.fb = null;
    }
    newCell();
    const optRects = () => { const n = st.cur.opts.length, w = Math.min(176, (W - 60 - (n - 1) * 12) / n), x0 = (W - (n * w + (n - 1) * 12)) / 2; return st.cur.opts.map((_, i) => ({ x: x0 + i * (w + 12), y: H - 92, w, h: 62 })); };
    function answer(i) {
      if (st.lock > 0 || !st.cur) return; const ok = i === st.cur.a; st.fb = { ok, i, why: st.cur.why, t: ok ? 1.1 : 2.6 }; st.lock = st.fb.t;
      if (ok) { st.combo++; st.right++; A.add(100 + Math.round(st.tl * 20) * Math.min(4, st.combo), W / 2, 150); A.sfx.good(); A.fx.burst(W / 2, 270, '#c77dff', 20); }
      else { st.combo = 0; A.hurt(); }
    }
    return {
      _st: st,
      update(dt) {
        if (st.lock > 0) { st.lock -= dt; if (st.lock <= 0 && A.lives > 0) { st.idx++; if (st.idx >= 6) { st.idx = 0; st.stage++; st.per = Math.max(5, st.per - .8); A.sfx.power();
          if (st.stage >= 4) { A.over(true, `You answered <b>${st.right}</b> of 24 cells correctly.`); return; } A.toast(`<b>Stage ${st.stage + 1}: ${STG[st.stage].name.toLowerCase()}</b>`, 2.4); } newCell(); } return; }
        st.tl -= dt; if (st.tl <= 0) { st.fb = { ok: false, i: -1, why: 'Time’s up! ' + st.cur.why, t: 2.6 }; st.lock = 2.6; st.combo = 0; A.hurt(); return; }
        st.cur.opts.forEach((_, i) => { if (A.hit(String(i + 1))) answer(i); });
        if (st.cur.opts.length === 2) { if (A.hit('left')) answer(0); if (A.hit('right')) answer(1); }
        if (A.ptr.tap) optRects().forEach((r, i) => { if (A.ptr.x > r.x && A.ptr.x < r.x + r.w && A.ptr.y > r.y && A.ptr.y < r.y + r.h) answer(i); });
      },
      draw(c) {
        D.bg(c, '#120a33', '#24104f'); D.stars(c, A.t, 40, 4, '#e3c9ff');
        D.text(c, STG[Math.min(3, st.stage)].name, W / 2, 70, { pix: true, size: 14, align: 'center', color: '#e3c9ff', glow: '#c77dff' });
        D.text(c, st.cur.ask, W / 2, 98, { size: 17, align: 'center', color: '#fff' });
        if (st.prev) { c.save(); c.globalAlpha = .4; cell(c, 150, 280, 62, st.prev.ph, st.prev.n, st.prev.err); c.restore(); }
        c.save(); c.globalAlpha = .35; cell(c, W - 150, 280, 62, 0, 4); c.restore(); D.text(c, '?', W - 150, 292, { pix: true, size: 24, align: 'center', color: '#e3c9ff' });
        [[250, '›'], [W - 250, '›']].forEach(([x, s]) => D.text(c, s, x, 296, { size: 46, align: 'center', color: '#8f73c9' }));
        cell(c, W / 2, 280, 116, st.cur.ph, st.cur.n, st.cur.err, A.t);
        /* timer ring */ c.save(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 6; c.beginPath(); c.arc(W / 2, 280, 158, 0, 7); c.stroke(); const f = Math.max(0, st.tl / st.per);
        D.glow(c, f < .3 ? '#ff5d7a' : '#c77dff', 12); c.strokeStyle = f < .3 ? '#ff5d7a' : '#c77dff'; c.beginPath(); c.arc(W / 2, 280, 158, -Math.PI / 2, -Math.PI / 2 + f * 6.283); c.stroke(); c.restore();
        optRects().forEach((r, i) => { const fb = st.fb, right = fb && i === st.cur.a, wrong = fb && i === fb.i && !fb.ok; c.save(); c.fillStyle = right ? 'rgba(75,227,122,.25)' : wrong ? 'rgba(255,93,122,.25)' : 'rgba(255,255,255,.06)'; D.rr(c, r.x, r.y, r.w, r.h, 12); c.fill();
          c.strokeStyle = right ? '#4be37a' : wrong ? '#ff5d7a' : 'rgba(199,125,255,.6)'; c.lineWidth = 2; c.stroke(); c.restore();
          D.text(c, String(i + 1), r.x + 12, r.y + 22, { pix: true, size: 9, color: '#a993d6' }); D.text(c, st.cur.opts[i], r.x + r.w / 2, r.y + 40, { size: st.cur.opts[i].length > 12 ? 15 : 18, align: 'center', color: '#fff' }); });
        if (st.fb) { c.save(); c.fillStyle = 'rgba(10,5,30,.88)'; D.rr(c, 120, 120, W - 240, 52, 12); c.fill(); c.restore(); D.text(c, (st.fb.ok ? 'Correct! ' : 'Not quite. ') + st.fb.why, W / 2, 152, { size: 15, align: 'center', color: st.fb.ok ? '#9af0b4' : '#ffb3c1' }); }
        /* stage dots */ for (let i = 0; i < 4; i++) { c.save(); const x = W / 2 - 60 + i * 40, on = i <= st.stage; if (i === st.stage) D.glow(c, '#ffd23f', 12); c.fillStyle = i === st.stage ? '#ffd23f' : on ? '#c77dff' : 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(x, H - 14, 6, 0, 7); c.fill(); c.restore(); }
      },
      hud() { return { mid: `STAGE ${Math.min(4, st.stage + 1)}/4 · CELL ${st.idx + 1}/6`, right: st.combo > 1 ? 'COMBO ×' + Math.min(4, st.combo) : '' }; }
    };
  }
  function preview(c, t) { D.bg(c, '#120a33', '#24104f'); D.stars(c, t, 40, 4, '#e3c9ff'); const p = Math.floor(t / 1.5) % 5;
    [0, 1, 2].forEach(i => { const ph = (p + i) % 5; c.save(); if (i !== 1) c.globalAlpha = .55; cell(c, 180 + i * 300, 280, i === 1 ? 110 : 80, ph, 4); c.restore(); if (i < 2) D.text(c, '›', 330 + i * 300, 296, { size: 50, align: 'center', color: '#c77dff' }); });
    for (let i = 0; i < 4; i++) { c.fillStyle = i === 1 ? '#ffd23f' : '#c77dff'; c.beginPath(); c.arc(420 + i * 40, 480, 7, 0, 7); c.fill(); } }
  AR.reg({ id: 'mitosis', subject: 'Biology', diff: 'Medium', title: 'Mitosis Master', sub: 'Guide the cell through mitosis', topic: 'Cell division', color: '#c77dff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><ellipse cx="7.5" cy="12" rx="5" ry="6"/><ellipse cx="16.5" cy="12" rx="5" ry="6"/></svg>',
    intro: 'Cells roll in one at a time. Read each cell before the <b>timer ring</b> runs out. Four stages, six cells each, and the clock gets faster.',
    how: ['Stage 1: <b>name the phase</b>. Stage 2: <b>what comes next?</b> Stage 3: <b>count chromosomes</b> and chromatids. Stage 4: <b>spot the error</b>.', 'Answer with keys <b>1–5</b> or click the answer cards.', 'Fast answers and streaks score more. A wrong answer or running out of time costs a life.'],
    keys: '<kbd>1</kbd>–<kbd>5</kbd> or click an answer · <kbd>←</kbd><kbd>→</kbd> on stage 4', pad: null,
    recap: 'Interphase → prophase → metaphase → anaphase → telophase (+ cytokinesis). Each X is one chromosome made of two sister chromatids. Mitosis gives two identical daughter cells with the same chromosome number.', winTitle: 'Master of mitosis!', loseTitle: 'The cell cycle stalled', make, preview });
})();
