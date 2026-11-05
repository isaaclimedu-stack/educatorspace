/* DNA Builder (middle school, life science): build the matching strand of DNA base by base (A–T, G–C) before the
   timer runs out, then hunt for mutations: find the one base in a copied strand that doesn't pair correctly. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H;
  const COL = { A: '#ff5d5d', T: '#ffc93c', G: '#3ed17a', C: '#3fa9ff' }, PAIR = { A: 'T', T: 'A', G: 'C', C: 'G' };
  const GENES = ['fur color in a rabbit', 'an eye color protein', 'a plant’s flower color', 'the enzyme that digests milk', 'how tall a pea plant grows', 'a fish’s fin shape', 'hemoglobin, which carries oxygen', 'a butterfly’s wing pattern', 'a dog’s ear shape'];
  const ROUNDS = [['build', 8, 16], ['build', 8, 14], ['build', 9, 13], ['mut', 10, 12], ['mut', 10, 11], ['mut', 12, 10], ['build', 10, 12], ['build', 11, 12], ['build', 12, 12]];
  const BTN = ['A', 'T', 'G', 'C'].map((b, i) => ({ b, x: W / 2 - 230 + i * 120, y: H - 86, w: 100, h: 62 }));
  function base(c, x, y, b, up, s = 1) { const h = 54 * s; D.glossRect(c, x - 15 * s, up ? y : y - h, 30 * s, h, 9 * s, COL[b]); D.text(c, b, x, up ? y + h - 12 * s : y - h + 24 * s, { pix: true, size: 14 * s, align: 'center', color: '#fff', glow: 'rgba(0,0,0,.5)', blur: 4 }); }
  function bg(c, t) { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#2d1b8f'); g.addColorStop(1, '#0d3a8a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = .16; for (let i = 0; i < 30; i++) { const x = ((i * 40 + t * 20) % (W + 40)) - 20, a = i * .45 + t; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 470 + Math.sin(a) * 20); c.lineTo(x, 520 - Math.sin(a) * 20); c.stroke(); } c.restore(); }
  function wrap(c, s, y) { const words = s.split(' '); let line = ''; words.forEach(w => { if ((line + w).length > 66) { D.text(c, line, W / 2, y, { size: 17, align: 'center', color: '#fff' }); line = ''; y += 26; } line += w + ' '; }); D.text(c, line, W / 2, y, { size: 17, align: 'center', color: '#fff' }); }
  function make(A) {
    const st = { r: -1, tmpl: [], built: [], cur: 0, tl: 1, per: 1, gene: '', mut: null, sel: 0, msg: null, wait: 0 };
    function next() {
      st.r++; if (st.r >= ROUNDS.length) { A.over(true, `You built and checked <b>${ROUNDS.length}</b> genes.`); return; }
      const [kind, n, per] = ROUNDS[st.r]; st.tmpl = Array.from({ length: n }, () => A.pick('ATGC')); st.built = []; st.cur = 0; st.per = st.tl = per; st.gene = A.pick(GENES); st.sel = 0; st.msg = null;
      if (kind === 'mut') { const i = Math.floor(A.rnd(1, n - 1)), copy = st.tmpl.map(b => PAIR[b]); copy[i] = A.pick('ATGC'.replace(PAIR[st.tmpl[i]], '').split('')); st.mut = { copy, i }; } else st.mut = null;
      if (st.r === 3) A.toast('<b>Mutation hunt!</b> The cell copied this gene, but one base doesn’t pair correctly. Find it.', 3.6); if (st.r === 6) A.toast('<b>Final round:</b> longer genes, less time!', 3);
    }
    next();
    const rx = i => W / 2 + (i - (st.tmpl.length - 1) / 2) * 62;
    const done = (ok, msg) => { st.msg = { ok, msg }; st.wait = ok ? 2.4 : 3; if (ok) { A.sfx.power(); A.add(200 + Math.round(st.tl * 20), W / 2, 260); } };
    function place(b) { if (st.wait > 0 || st.mut) return; const need = PAIR[st.tmpl[st.cur]];
      if (b === need) { st.built.push(b); st.cur++; A.add(20); A.sfx.pick(); A.fx.burst(rx(st.cur - 1), 360, COL[b], 8, 90); if (st.cur >= st.tmpl.length) done(true, `Gene complete! This gene is the code for ${st.gene}.`); }
      else { st.tl = Math.max(0, st.tl - 2); A.sfx.bad(); A.shake(.2); A.toast(`${st.tmpl[st.cur]} pairs with <b>${need}</b>, not ${b}.`, 1.8); } }
    function pickMut(i) { if (st.wait > 0 || !st.mut) return; A.stats.asked++;
      if (i === st.mut.i) { A.stats.right++; done(true, `Found it! ${st.tmpl[i]} should pair with ${PAIR[st.tmpl[i]]}, but the copy has ${st.mut.copy[i]}. A copying mistake like this is a mutation, and it can change the trait.`); }
      else { A.hurt(); st.tl = Math.max(0, st.tl - 3); if (A.lives > 0) A.toast(`${st.tmpl[i]}–${st.mut.copy[i]} is a correct pair. Keep looking!`, 2); } }
    return {
      _st: st,
      update(dt) {
        if (st.wait > 0) { st.wait -= dt; if (st.wait <= 0) next(); return; }
        st.tl -= dt; if (st.tl <= 0) { A.hurt(st.mut ? 'Time’s up! The mutation slipped through.' : 'Time’s up! The strand wasn’t finished.'); if (A.lives > 0) { st.msg = { ok: false, msg: st.mut ? `The mutation was base ${st.mut.i + 1}: ${st.tmpl[st.mut.i]} paired with ${st.mut.copy[st.mut.i]}.` : 'Remember: A pairs with T, and G pairs with C.' }; st.wait = 2.8; } return; }
        if (!st.mut) A.typed().forEach(k => { const b = k.toUpperCase(); if ('ATGC'.includes(b)) place(b); });
        if (st.mut) { if (A.hit('left')) st.sel = Math.max(0, st.sel - 1); if (A.hit('right')) st.sel = Math.min(st.tmpl.length - 1, st.sel + 1); if (A.hit('fire') || A.hit('enter')) pickMut(st.sel); }
        if (A.ptr.tap) { if (!st.mut) BTN.forEach(B => { if (A.ptr.x > B.x && A.ptr.x < B.x + B.w && A.ptr.y > B.y && A.ptr.y < B.y + B.h) place(B.b); });
          else st.tmpl.forEach((_, i) => { if (Math.abs(A.ptr.x - rx(i)) < 28 && A.ptr.y > 180 && A.ptr.y < 420) { st.sel = i; pickMut(i); } }); }
      },
      draw(c) {
        bg(c, A.t);
        D.text(c, st.mut ? 'MUTATION HUNT: WHICH PAIR IS WRONG?' : 'BUILD THE MATCHING STRAND', W / 2, 72, { pix: true, size: 13, align: 'center', color: '#fff', glow: '#7fd0ff' });
        D.text(c, `Gene for ${st.gene}`, W / 2, 102, { size: 16, align: 'center', color: '#cfe0ff' });
        c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; D.rr(c, W / 2 - 200, 120, 400, 12, 6); c.fill(); c.restore(); D.glossRect(c, W / 2 - 200, 120, 400 * Math.max(0, st.tl) / st.per, 12, 6, st.tl / st.per < .3 ? '#ff5d5d' : '#7fd0ff');
        const x0 = rx(0) - 30, x1 = rx(st.tmpl.length - 1) + 30; c.save(); c.strokeStyle = '#e6e9ff'; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, 186); c.lineTo(x1, 186); c.moveTo(x0, 414); c.lineTo(x1, 414); c.stroke(); c.restore();
        D.text(c, 'TEMPLATE', x0, 172, { pix: true, size: 8, color: '#cfe0ff' }); D.text(c, st.mut ? 'COPY' : 'NEW STRAND', x0, 440, { pix: true, size: 8, color: '#cfe0ff' });
        st.tmpl.forEach((b, i) => { base(c, rx(i), 190, b, true);
          if (st.mut) { base(c, rx(i), 410, st.mut.copy[i], false); if (i === st.sel) { c.save(); D.glow(c, '#ffe066', 14); c.strokeStyle = '#ffe066'; c.lineWidth = 3; D.rr(c, rx(i) - 26, 178, 52, 244, 12); c.stroke(); c.restore(); } }
          else if (i < st.built.length) base(c, rx(i), 410, st.built[i], false);
          else if (i === st.cur) { c.save(); D.glow(c, '#ffe066', 16); c.strokeStyle = '#ffe066'; c.lineWidth = 3; c.setLineDash([6, 6]); D.rr(c, rx(i) - 18, 356, 36, 56, 9); c.stroke(); c.restore(); D.text(c, '?', rx(i), 392, { pix: true, size: 14, align: 'center', color: '#ffe066' }); } });
        if (!st.mut) BTN.forEach(B => { D.glossRect(c, B.x, B.y, B.w, B.h, 16, COL[B.b]); D.text(c, B.b, B.x + B.w / 2, B.y + 42, { pix: true, size: 20, align: 'center', color: '#fff', glow: 'rgba(0,0,0,.4)', blur: 4 }); });
        else D.text(c, '← → choose a pair · Space to pick (or tap it)', W / 2, H - 46, { size: 16, align: 'center', color: '#fff' });
        if (st.msg) { c.save(); c.fillStyle = st.msg.ok ? 'rgba(20,120,70,.94)' : 'rgba(140,30,50,.94)'; D.rr(c, 90, 236, W - 180, 116, 16); c.fill(); c.restore(); wrap(c, st.msg.msg, 280); }
      },
      hud() { return { mid: `GENE ${Math.min(ROUNDS.length, st.r + 1)}/${ROUNDS.length}` }; }
    };
  }
  function preview(c, t) { bg(c, t); const s = 'ATGCGTA', x = i => W / 2 + (i - 3) * 70; c.save(); c.strokeStyle = '#e6e9ff'; c.lineWidth = 8; c.beginPath(); c.moveTo(x(0) - 30, 150); c.lineTo(x(6) + 30, 150); c.moveTo(x(0) - 30, 380); c.lineTo(x(6) + 30, 380); c.stroke(); c.restore();
    const k = Math.floor(t * 2) % 9; for (let i = 0; i < 7; i++) { base(c, x(i), 154, s[i], true); if (i < k) base(c, x(i), 376, PAIR[s[i]], false); } BTN.forEach(B => D.glossRect(c, B.x, B.y + 20, B.w, B.h - 10, 14, COL[B.b])); }
  AR.reg({ id: 'dna', subject: 'Biology', diff: 'Hard', title: 'DNA Builder', sub: 'Build DNA strands and hunt down mutations', topic: 'DNA & genes', color: '#3ed17a',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 3c0 6 10 6 10 12s-10 3-10 6"/><path d="M17 3c0 6-10 6-10 12s10 3 10 6"/><path d="M9 7h6M8 12h8M9 17h6"/></svg>',
    intro: 'Genes are made of DNA. Build the matching strand base by base before the timer runs out, then find the <b>mutations</b> hiding in copied genes.',
    how: ['Type <b>A T G C</b> on the keyboard, or tap the big buttons, to add the matching base.', 'Rules: <b>A pairs with T</b> and <b>G pairs with C</b>. A wrong base costs 2 seconds.', 'Mutation hunts: use <b>← →</b> and <b>Space</b> (or tap) to pick the pair that doesn’t match.'],
    keys: '<kbd>A</kbd><kbd>T</kbd><kbd>G</kbd><kbd>C</kbd> add a base · <kbd>←</kbd><kbd>→</kbd> <kbd>Space</kbd> on mutation hunts', pad: null,
    recap: 'DNA is a ladder of base pairs: A–T and G–C. The order of bases in a gene is the code for a protein, and a mutation (a changed base) can change the trait.', winTitle: 'Master gene builder!', loseTitle: 'Too many errors in the code', make, preview });
})();
