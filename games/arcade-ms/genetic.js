/* Genetic Detective (middle school, life science): solve six heredity cases. Fill in Punnett squares, predict
   offspring, and work out which parents could have had the mystery offspring. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H;
  const TR = {
    fur: { what: 'puppy fur', D: 'B', dom: 'black', rec: 'brown', col: ['#2b2b2b', '#a0612f'] },
    tall: { what: 'pea plant height', D: 'T', dom: 'tall', rec: 'short', col: ['#3ed17a', '#9be07a'] },
    flower: { what: 'flower color', D: 'P', dom: 'purple', rec: 'white', col: ['#a46bff', '#f2f4f8'] }};
  const CASES = [
    { t: 'fur', title: 'The Brown Puppy', p1: 'Bb', p2: 'bb', ask: 'rec' },
    { t: 'tall', title: 'The Short Pea Plant', p1: 'Tt', p2: 'Tt', ask: 'rec' },
    { t: 'fur', title: 'Who Are the Parents?', kind: 'who', baby: 'bb', pairs: [['Bb', 'Bb'], ['BB', 'Bb'], ['BB', 'BB']], a: 0 },
    { t: 'flower', title: 'The Purple Garden', p1: 'PP', p2: 'pp', ask: 'dom' },
    { t: 'tall', title: 'The Mystery Seed', kind: 'who', baby: 'tt', pairs: [['TT', 'tt'], ['Tt', 'tt'], ['TT', 'TT']], a: 1 },
    { t: 'fur', title: 'The Big Litter', p1: 'Bb', p2: 'Bb', ask: 'dom' }];
  const FR = ['0', '1/4', '1/2', '3/4', 'All 4/4'];
  const norm = g => g[0] === g[0].toUpperCase() ? g : g[1] + g[0];
  const pheno = (T, g) => /[A-Z]/.test(g) ? T.dom : T.rec;
  function bg(c, t) { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2a3f8f'); g.addColorStop(1, '#5a2a8a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = .08; c.strokeStyle = '#fff'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(120 + i * 170, 480, 40 + i * 6, 0, 7); c.stroke(); } c.restore(); }
  function critter(c, T, g, x, y, s, t) { const col = /[A-Z]/.test(g) ? T.col[0] : T.col[1]; c.save(); c.translate(x, y); c.scale(s, s);
    if (T === TR.fur) { D.gloss(c, 0, 0, 26, col); D.gloss(c, -20, -18, 10, col); D.gloss(c, 20, -18, 10, col); D.face(c, 0, -2, 22, '#fff'); c.fillStyle = '#ff8fb0'; c.beginPath(); c.arc(0, 10, 4, 0, 7); c.fill(); }
    else if (T === TR.tall) { const h = /[A-Z]/.test(g) ? 60 : 26; c.strokeStyle = '#2f9a3a'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 26); c.lineTo(0, 26 - h); c.stroke(); for (let i = 0; i < 3; i++) { c.save(); c.translate(0, 20 - i * h / 3); c.rotate(i % 2 ? .6 : -.6); c.fillStyle = col; c.beginPath(); c.ellipse(i % 2 ? 12 : -12, 0, 13, 6, 0, 0, 7); c.fill(); c.restore(); } D.gloss(c, 0, 26 - h, 7, '#9be07a'); }
    else { for (let i = 0; i < 5; i++) { const a = i / 5 * 6.283 + t * .3; D.gloss(c, Math.cos(a) * 14, Math.sin(a) * 14, 12, col); } D.gloss(c, 0, 0, 9, '#ffd23f'); }
    c.restore(); D.text(c, g, x, y + 52 * s, { pix: true, size: 12, align: 'center', color: '#fff' }); }
  function make(A) {
    const st = { i: -1, C: null, boxes: [], cur: 0, phase: 'fill', tl: 50, msg: null, wait: 0, miss: 0 };
    function next() { st.i++; if (st.i >= CASES.length) { A.over(true, `You cracked all ${CASES.length} heredity cases.`); return; }
      const C = st.C = CASES[st.i]; st.tl = 50; st.msg = null; st.miss = 0; st.cur = 0;
      if (C.kind === 'who') { st.phase = 'who'; } else { st.phase = 'fill'; st.boxes = [0, 1].flatMap(r => [0, 1].map(k => ({ g: norm(C.p2[r] + C.p1[k]), got: null }))); } }
    next();
    const opts = () => { const C = st.C, T = TR[C.t], d = T.D, r = d.toLowerCase(); if (st.phase === 'fill') return [d + d, d + r, r + r]; if (st.phase === 'frac') return FR; return C.pairs.map(p => p.join(' × ')); };
    const BR = () => { const o = opts(), w = o.length > 3 ? 150 : 190, x0 = (W - (o.length * w + (o.length - 1) * 12)) / 2; return o.map((_, i) => ({ x: x0 + i * (w + 12), y: H - 84, w, h: 60 })); };
    function choose(i) { if (st.wait > 0) return; const C = st.C, T = TR[C.t], o = opts()[i];
      if (st.phase === 'fill') { const B = st.boxes[st.cur]; if (o === B.g) { B.got = o; st.cur++; A.add(40); A.sfx.pick(); if (st.cur >= 4) { st.phase = 'frac'; A.toast(`Square complete! Now: what fraction of the offspring will be <b>${C.ask === 'rec' ? T.rec : T.dom}</b>?`, 3.4); } }
        else { st.miss++; st.tl -= 3; A.sfx.bad(); A.shake(.2); A.toast(`Combine the letter on top of the column with the letter beside the row: <b>${B.g}</b>.`, 2.4); } }
      else if (st.phase === 'frac') { const n = st.boxes.filter(b => (C.ask === 'rec') === !/[A-Z]/.test(b.g)).length, right = n === 4 ? 4 : n; A.stats.asked++;
        if (i === right) { A.stats.right++; solved(`${n} of 4 boxes are ${C.ask === 'rec' ? T.rec : T.dom}: ${FR[right]}. ${C.ask === 'rec' ? `Only ${T.D.toLowerCase()}${T.D.toLowerCase()} shows the recessive trait.` : `One ${T.D} is enough to show the dominant trait.`}`); }
        else { A.hurt(`Count the boxes: ${C.ask === 'rec' ? `${T.rec} needs two lowercase letters (${T.D.toLowerCase()}${T.D.toLowerCase()})` : `${T.dom} needs at least one capital ${T.D}`}.`); } }
      else { A.stats.asked++; if (i === C.a) { A.stats.right++; solved(`Case closed! ${C.pairs[C.a].join(' × ')} can each pass on a recessive ${T.D.toLowerCase()}, so the offspring can be ${C.baby}.`); }
        else { A.hurt(`To be ${C.baby}, the offspring needs one ${T.D.toLowerCase()} from <b>each</b> parent. Does every parent in that pair have one?`); } } }
    function solved(m) { st.msg = m; st.wait = 3.4; A.sfx.power(); A.add(300 + Math.round(st.tl * 10) - st.miss * 20, W / 2, 200); }
    return {
      _st: st,
      update(dt) {
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) next(); return; }
        st.tl -= dt; if (st.tl <= 0) { A.hurt('Time’s up on this case!'); if (A.lives > 0) { st.msg = 'The case went cold. On to the next one!'; st.wait = 2.4; } return; }
        A.typed().forEach(k => { const n = +k; if (n >= 1 && n <= opts().length) choose(n - 1); });
        if (A.ptr.tap) BR().forEach((r, i) => { if (A.ptr.x > r.x && A.ptr.x < r.x + r.w && A.ptr.y > r.y && A.ptr.y < r.y + r.h) choose(i); });
      },
      draw(c) {
        bg(c, A.t); const C = st.C, T = TR[C.t];
        c.save(); c.fillStyle = '#f7ecd0'; D.rr(c, 24, 50, 300, 386, 14); c.fill(); c.fillStyle = '#e0c98e'; D.rr(c, 24, 50, 120, 26, 8); c.fill(); c.restore();
        D.text(c, `CASE ${st.i + 1}`, 34, 68, { pix: true, size: 9, color: '#5a3a1a' }); D.text(c, C.title, 40, 106, { size: 19, color: '#3a2a1a' });
        D.text(c, `Trait: ${T.what}`, 40, 136, { size: 14, color: '#5a4a3a' }); D.text(c, `${T.D} = ${T.dom} (dominant)`, 40, 160, { size: 14, color: '#3a2a1a' }); D.text(c, `${T.D.toLowerCase()} = ${T.rec} (recessive)`, 40, 182, { size: 14, color: '#3a2a1a' });
        if (C.kind === 'who') { D.text(c, 'Evidence: this offspring', 40, 220, { size: 14, color: '#5a4a3a' }); critter(c, T, C.baby, 174, 290, 1.2, A.t); D.text(c, `Which parents could have`, 40, 376, { size: 14, color: '#3a2a1a' }); D.text(c, `had a ${C.baby} (${T.rec}) offspring?`, 40, 396, { size: 14, color: '#3a2a1a' }); }
        else { D.text(c, 'Parents:', 40, 220, { size: 14, color: '#5a4a3a' }); critter(c, T, C.p1, 110, 290, 1, A.t); D.text(c, '×', 174, 296, { size: 28, align: 'center', color: '#3a2a1a' }); critter(c, T, C.p2, 238, 290, 1, A.t); }
        /* magnifier */ c.save(); c.translate(300, 74); c.rotate(.6); c.strokeStyle = '#6a4a2a'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 14, 0, 7); c.stroke(); c.beginPath(); c.moveTo(14, 0); c.lineTo(34, 0); c.stroke(); c.restore();
        if (C.kind !== 'who') { const gx = 470, gy = 120, s = 130; D.text(c, 'PUNNETT SQUARE', gx + s, gy - 46, { pix: true, size: 10, align: 'center', color: '#e8ecff' });
          [0, 1].forEach(k => D.text(c, C.p1[k], gx + s / 2 + k * s, gy - 12, { pix: true, size: 18, align: 'center', color: '#ffe066' })); [0, 1].forEach(r => D.text(c, C.p2[r], gx - 24, gy + s / 2 + 8 + r * s, { pix: true, size: 18, align: 'center', color: '#ffe066' }));
          st.boxes.forEach((B, i) => { const x = gx + (i % 2) * s, y = gy + Math.floor(i / 2) * s, on = i === st.cur && st.phase === 'fill'; c.save(); c.fillStyle = B.got ? 'rgba(255,255,255,.92)' : 'rgba(255,255,255,.18)'; D.rr(c, x + 4, y + 4, s - 8, s - 8, 14); c.fill(); if (on) { D.glow(c, '#ffe066', 16); c.strokeStyle = '#ffe066'; c.lineWidth = 4; c.stroke(); } c.restore();
            if (B.got) { critter(c, T, B.got, x + s / 2, y + s / 2 - 14, .7, A.t); } else if (on) D.text(c, '?', x + s / 2, y + s / 2 + 10, { pix: true, size: 24, align: 'center', color: '#ffe066' }); }); }
        const q = st.phase === 'fill' ? 'Fill the highlighted box:' : st.phase === 'frac' ? `What fraction will be ${C.ask === 'rec' ? T.rec : T.dom}?` : 'Pick the parent pair:';
        D.text(c, q, W / 2, H - 98, { size: 16, align: 'center', color: '#fff' });
        BR().forEach((r, i) => { D.glossRect(c, r.x, r.y, r.w, r.h, 14, '#5b6cff'); D.text(c, `${i + 1}`, r.x + 14, r.y + 22, { pix: true, size: 9, color: '#cfd6ff' }); D.text(c, opts()[i], r.x + r.w / 2, r.y + 38, { size: opts()[i].length > 6 ? 17 : 20, align: 'center', color: '#fff' }); });
        c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; D.rr(c, W - 230, 50, 210, 12, 6); c.fill(); c.restore(); D.glossRect(c, W - 230, 50, 210 * Math.max(0, st.tl) / 50, 12, 6, st.tl < 12 ? '#ff5d5d' : '#7fd0ff');
        if (st.msg) { c.save(); c.fillStyle = 'rgba(20,110,70,.95)'; D.rr(c, 140, 200, W - 280, 120, 16); c.fill(); c.restore(); const words = st.msg.split(' '); let line = '', y = 244; words.forEach(w => { if ((line + w).length > 62) { D.text(c, line, W / 2, y, { size: 17, align: 'center', color: '#fff' }); line = ''; y += 26; } line += w + ' '; }); D.text(c, line, W / 2, y, { size: 17, align: 'center', color: '#fff' }); }
      },
      hud() { return { mid: `CASE ${Math.min(CASES.length, st.i + 1)}/${CASES.length}` }; }
    };
  }
  function preview(c, t) { bg(c, t); const T = TR.fur, gx = 520, gy = 90, s = 120; ['BB', 'Bb', 'Bb', 'bb'].forEach((g, i) => { const x = gx + (i % 2) * s, y = gy + Math.floor(i / 2) * s; c.save(); c.fillStyle = 'rgba(255,255,255,.9)'; D.rr(c, x + 4, y + 4, s - 8, s - 8, 14); c.fill(); c.restore(); critter(c, T, g, x + s / 2, y + s / 2 - 12, .7, t); });
    c.save(); c.fillStyle = '#f7ecd0'; D.rr(c, 60, 90, 280, 300, 14); c.fill(); c.restore(); critter(c, T, 'Bb', 140, 230, 1.1, t); critter(c, T, 'bb', 260, 230, 1.1, t); }
  AR.reg({ id: 'genetic', subject: 'Biology', diff: 'Medium', title: 'Genetic Detective', sub: 'Crack heredity cases with Punnett squares', topic: 'Heredity', color: '#ffb020',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M8 8h4v4H8z"/></svg>',
    intro: 'Six heredity mysteries! Use <b>Punnett squares</b> to predict offspring, and work out which parents could have had a mystery baby.',
    how: ['Fill each box of the Punnett square: combine the letter above the column with the letter beside the row.', 'Then decide what fraction of offspring show the trait. Capital letter = <b>dominant</b>; it shows if there’s at least one.', 'Answer with keys <b>1–5</b> or tap the buttons. Faster solves score more.'],
    keys: '<kbd>1</kbd>–<kbd>5</kbd> or tap an answer', pad: null,
    recap: 'Each parent passes on one allele for a trait. A dominant allele (capital letter) shows up whenever it’s present; a recessive trait shows only with two recessive alleles.', winTitle: 'Master detective!', loseTitle: 'The case went cold', make, preview });
})();
