/* Gene Flight: fly a polymerase ship through gates of nucleotides. Each gate has three openings; fly through the one
   that pairs with the template base. Level 1 DNA replication, level 2 transcription (U instead of T), level 3 translation. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, PX = 210;
  const BCOL = { A: '#ff6b6b', T: '#ffd23f', G: '#4be37a', C: '#5fb7ff', U: '#ff9a3c' };
  const DNA = { A: 'T', T: 'A', G: 'C', C: 'G' }, RNA = { A: 'U', T: 'A', G: 'C', C: 'G' };
  const COD = { AUG: 'Met (start)', UUU: 'Phe', GGC: 'Gly', UAA: 'STOP', UGG: 'Trp', AAA: 'Lys', GAA: 'Glu', UAC: 'Tyr' };
  const LV = [{ name: 'DNA REPLICATION', tip: 'Build the new DNA strand: A pairs with T, G pairs with C.', n: 10 }, { name: 'TRANSCRIPTION', tip: 'Make mRNA from DNA: RNA uses U instead of T, so A on the template pairs with U.', n: 10 }, { name: 'TRANSLATION', tip: 'Read each mRNA codon and fly to its amino acid. Use the codon key on the right.', n: 10 }];
  const GAPS = [150, 292, 434], GAPH = 92, GW = 58;
  function make(A) {
    const pl = { y: 290, vy: 0, inv: 0 };
    const st = { lv: 0, gates: [], spawn: 1.2, made: 0, passed: 0, speed: 210, strand: [], built: [] };
    function newGate() {
      const lv = st.lv; let prompt, right, opts;
      if (lv < 2) { const b = A.pick('ATGC'); right = (lv ? RNA : DNA)[b]; prompt = b; const pool = lv ? ['A', 'U', 'G', 'C'] : ['A', 'T', 'G', 'C']; opts = A.shuffle([right, ...A.shuffle(pool.filter(x => x !== right)).slice(0, 2)]); if (lv === 1 && !opts.includes('T') && Math.random() < .5) opts[opts.indexOf(opts.find(o => o !== right))] = 'T'; }
      else { const cod = A.pick(Object.keys(COD)); prompt = cod; right = COD[cod]; opts = A.shuffle([right, ...A.shuffle(Object.values(COD).filter(v => v !== right)).slice(0, 2)]); }
      st.gates.push({ x: W + 40, prompt, right, opts, done: false }); st.made++; st.strand.push(prompt);
    }
    const why = g => st.lv === 0 ? `${g.prompt} pairs with ${g.right} in DNA.` : st.lv === 1 ? `In RNA, ${g.prompt} on the DNA template pairs with ${g.right}.${g.prompt === 'A' ? ' RNA has U, not T.' : ''}` : `The codon ${g.prompt} codes for ${g.right}.`;
    async function levelDone() {
      st.lv++; A.sfx.power(); A.add(500, W / 2, H / 2);
      if (st.lv >= 3) { A.over(true, `You built <b>${st.passed}</b> correct pairs and codons.`); return; }
      await A.ask(st.lv === 1 ? { q: 'How is transcription different from DNA replication?', opts: ['It makes RNA, which uses U (uracil) instead of T', 'It copies the whole genome', 'It happens at the ribosome', 'It makes protein directly'], a: 0, why: 'Transcription copies one gene into mRNA. RNA has uracil (U) where DNA has thymine (T).', tag: 'Level up', reward: 'On to transcription' }
        : { q: 'What is a codon?', opts: ['Three mRNA bases that code for one amino acid', 'One base of DNA', 'A kind of protein', 'The start of a chromosome'], a: 0, why: 'Ribosomes read mRNA three bases at a time. AUG is the start codon; UAA, UAG and UGA are stop codons.', tag: 'Level up', reward: 'On to translation' });
      st.gates = []; st.built = []; st.spawn = 1; st.made = 0; st.speed += 25; pl.y = 290; pl.vy = 0; A.toast(`<b>Level ${st.lv + 1}: ${LV[st.lv].name.toLowerCase()}</b>. ${LV[st.lv].tip}`, 4);
    }
    A.toast(LV[0].tip, 4);
    return {
      _st: st, _pl: pl,
      update(dt) {
        if (A.hit('fire') || A.hit('up') || A.ptr.tap) { pl.vy = -330; A.sfx.flap(); }
        pl.vy += 900 * dt; pl.y += pl.vy * dt; if (pl.inv > 0) pl.inv -= dt;
        if (pl.y < 50 || pl.y > H - 14) { pl.y = A.clamp(pl.y, 60, H - 30); pl.vy = -120; if (pl.inv <= 0) { pl.inv = 1.5; A.hurt('Careful! Stay between the top and bottom of the helix.'); } }
        st.spawn -= dt; if (st.spawn <= 0 && st.made < LV[st.lv].n) { newGate(); st.spawn = 560 / st.speed; }
        st.gates.forEach(g => { g.x -= st.speed * dt;
          if (!g.done && g.x < PX + 14 && g.x + GW > PX - 14) {
            const gi = GAPS.findIndex(y => Math.abs(pl.y - y) < GAPH / 2 - 10), inGap = gi >= 0;
            if (!inGap) { const near = GAPS.findIndex(y => Math.abs(pl.y - y) < GAPH / 2 + 6); if (near < 0 && pl.inv <= 0) { g.done = true; pl.inv = 1.5; A.fx.burst(PX, pl.y, '#fff', 16); A.hurt('You hit a sugar-phosphate pillar! Aim for an opening.'); } }
            else if (g.x + GW < PX + 16 || g.x < PX - 20) { g.done = true; const pickd = g.opts[gi];
              if (pickd === g.right) { st.passed++; A.add(150, PX + 30, pl.y - 20); A.sfx.good(); A.fx.burst(PX, pl.y, BCOL[pickd] || '#c9b6ff', 14); st.built.push(st.lv === 2 ? pickd.replace(' (start)', '') : pickd); if (st.built.length > 14) st.built.shift(); }
              else { pl.inv = 1; A.hurt(`Wrong match: ${why(g)}`); } } } });
        st.gates = st.gates.filter(g => g.x > -GW - 20);
        if (st.made >= LV[st.lv].n && !st.gates.length && A.lives > 0) { st.made = -99; levelDone(); }
      },
      draw(c) {
        D.bg(c, '#0a1450', '#1c2f8a'); D.stars(c, A.t, 60, 10, '#c9d6ff');
        /* city-like helix in the background */ c.save(); c.globalAlpha = .35; for (let i = 0; i < 26; i++) { const x = (((i * 44 - A.t * 30) % (W + 80)) + W + 80) % (W + 80) - 20, y1 = 300 + Math.sin(i * .5 + A.t * .3) * 90, y2 = 300 - Math.sin(i * .5 + A.t * .3) * 90; c.strokeStyle = '#7f8cff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y1); c.lineTo(x, y2); c.stroke(); c.fillStyle = '#ff6fb5'; c.beginPath(); c.arc(x, y1, 4, 0, 7); c.fill(); c.fillStyle = '#5fb7ff'; c.beginPath(); c.arc(x, y2, 4, 0, 7); c.fill(); } c.restore();
        st.gates.forEach(g => { const ed = [44, ...GAPS.flatMap(y => [y - GAPH / 2, y + GAPH / 2]), H];
          for (let k = 0; k < ed.length; k += 2) { const y0 = ed[k], y1 = ed[k + 1]; c.save(); D.glow(c, '#9aa8ff', 10); const gr = c.createLinearGradient(g.x, 0, g.x + GW, 0); gr.addColorStop(0, '#6b78d8'); gr.addColorStop(.5, '#b6c0ff'); gr.addColorStop(1, '#6b78d8'); c.fillStyle = gr; D.rr(c, g.x, y0, GW, Math.max(4, y1 - y0), 8); c.fill(); c.restore(); }
          g.opts.forEach((o, i) => { const col = BCOL[o] || '#ffe066'; D.text(c, o, g.x + GW / 2, GAPS[i] + (o.length > 2 ? 5 : 9), { pix: o.length <= 2, size: o.length <= 2 ? 22 : 13, align: 'center', color: col, glow: col, blur: 10 }); }); });
        /* ship */ if (!(pl.inv > 0 && Math.floor(A.t * 12) % 2)) { c.save(); c.translate(PX, pl.y); c.rotate(A.clamp(pl.vy / 700, -.5, .6) + Math.PI / 2); D.ship(c, 0, 0, .85, '#f0f4ff', '#ff6fb5'); c.restore(); }
        /* template strip */ const g0 = st.gates.find(g => !g.done); c.save(); c.fillStyle = 'rgba(5,10,40,.75)'; D.rr(c, 14, 44, 300, 64, 10); c.fill(); c.restore();
        D.text(c, st.lv === 2 ? 'mRNA CODON' : 'TEMPLATE BASE', 28, 64, { pix: true, size: 8, color: '#9fb0ff' });
        if (g0) D.text(c, g0.prompt, 28, 98, { pix: true, size: 22, color: BCOL[g0.prompt] || '#ffe066', glow: BCOL[g0.prompt] || '#ffe066' });
        D.text(c, st.lv === 2 ? '→ amino acid?' : '→ pairs with?', 140, 96, { size: 15, color: '#dfe5ff' });
        if (st.lv === 2) { c.save(); c.fillStyle = 'rgba(5,10,40,.75)'; D.rr(c, W - 196, 44, 182, 186, 10); c.fill(); c.restore(); D.text(c, 'CODON KEY', W - 182, 64, { pix: true, size: 8, color: '#9fb0ff' }); Object.entries(COD).forEach(([k, v], i) => D.text(c, `${k}  ${v}`, W - 182, 86 + i * 18, { size: 13, color: '#e8ecff' })); }
        if (st.built.length) { D.text(c, (st.lv === 2 ? 'PROTEIN: ' : 'NEW STRAND: ') + st.built.join(st.lv === 2 ? '–' : ''), 14, H - 14, { pix: true, size: 9, color: '#c9d6ff' }); }
      },
      hud() { return { mid: `LEVEL ${Math.min(3, st.lv + 1)}: ${LV[Math.min(2, st.lv)].name}` }; }
    };
  }
  function preview(c, t) { D.bg(c, '#0a1450', '#1c2f8a'); D.stars(c, t, 50, 10, '#c9d6ff');
    for (let i = 0; i < 18; i++) { const y = 40 + i * 28, x1 = 150 + Math.sin(i * .6 + t) * 60, x2 = 150 - Math.sin(i * .6 + t) * 60; c.strokeStyle = '#9aa8ff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke(); c.fillStyle = '#ff6fb5'; c.beginPath(); c.arc(x1, y, 6, 0, 7); c.fill(); c.fillStyle = '#5fb7ff'; c.beginPath(); c.arc(x2, y, 6, 0, 7); c.fill(); }
    [560, 820].forEach((gx, j) => { const ed = [44, ...GAPS.flatMap(y => [y - GAPH / 2, y + GAPH / 2]), H]; for (let k = 0; k < ed.length; k += 2) { c.fillStyle = '#9aa8ff'; D.rr(c, gx, ed[k], GW, ed[k + 1] - ed[k], 8); c.fill(); } ['A', 'G', 'T'].forEach((b, i) => D.text(c, b, gx + GW / 2, GAPS[i] + 9, { pix: true, size: 22, align: 'center', color: BCOL[b], glow: BCOL[b] })); });
    c.save(); c.translate(390, 290 + Math.sin(t * 3) * 60); c.rotate(Math.PI / 2); D.ship(c, 0, 0, 1, '#f0f4ff', '#ff6fb5'); c.restore(); }
  AR.reg({ id: 'gene', subject: 'Biology', diff: 'Medium', title: 'Gene Flight', sub: 'Fly through the genome', topic: 'DNA, RNA & protein', color: '#6d8cff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 3c0 6 10 6 10 12s-10 3-10 6"/><path d="M17 3c0 6-10 6-10 12s10 3 10 6"/><path d="M9 7h6M8 12h8M9 17h6"/></svg>',
    intro: 'You pilot a <b>polymerase ship</b> along a strand of DNA. Every gate has three openings: fly through the one that matches.',
    how: ['Tap <b>Space</b>, <b>↑</b> or the screen to thrust. Let go to drop.', 'Level 1, <b>replication</b>: A–T and G–C. Level 2, <b>transcription</b>: RNA uses U, so A pairs with U.', 'Level 3, <b>translation</b>: read the mRNA codon and fly to its amino acid (codon key on screen).', 'Hitting a pillar or picking the wrong base costs a life.'],
    keys: '<kbd>Space</kbd> or <kbd>↑</kbd> thrust', pad: null,
    recap: 'DNA: A–T, G–C. RNA swaps T for U. Ribosomes read mRNA three bases (one codon) at a time; AUG starts, UAA/UAG/UGA stop.', winTitle: 'Gene expressed!', loseTitle: 'Mutation overload', make, preview });
})();
