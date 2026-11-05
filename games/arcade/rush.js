/* Receptor Rush: slide a receptor along the cell membrane and switch its binding site to match falling ligands.
   Steroid hormones are lipid-soluble: let them pass straight through the membrane. Antagonists block the receptor. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, MEM = 430;
  const KIND = [
    { sh: 'tri', col: '#ff9a3c', lig: ['Epinephrine', 'Glucagon', 'Serotonin'], rec: 'G protein–coupled receptor' },
    { sh: 'cir', col: '#4be3c0', lig: ['Acetylcholine', 'GABA', 'Glutamate'], rec: 'Ligand-gated ion channel' },
    { sh: 'sq', col: '#6fa8ff', lig: ['Insulin', 'Growth factor', 'EGF'], rec: 'Receptor tyrosine kinase' }];
  const STER = ['Estrogen', 'Testosterone', 'Cortisol', 'Aldosterone'], ANTA = ['Beta blocker', 'Antihistamine', 'Curare'];
  const QS = [
    { q: 'Why can steroid hormones like estrogen pass straight through the cell membrane?', opts: ['They are nonpolar (lipid-soluble)', 'They are very large proteins', 'They carry a strong charge', 'They are pumped in by ATP'], a: 0, why: 'Nonpolar molecules dissolve through the phospholipid bilayer and bind receptors inside the cell.' },
    { q: 'An antagonist drug binds a receptor but does not activate it. What happens to the signal?', opts: ['It is blocked', 'It gets stronger', 'It switches to a different receptor', 'Nothing changes'], a: 0, why: 'The antagonist occupies the binding site, so the real ligand can’t bind and no response starts.' },
    { q: 'Receptors are specific because', opts: ['the shape of the binding site fits only certain ligands', 'every receptor binds every ligand', 'ligands enter the nucleus first', 'receptors are made of DNA'], a: 0, why: 'Like a lock and key, the binding site’s shape and charges match the ligand.' },
    { q: 'In signal transduction, what usually happens right after a ligand binds its receptor?', opts: ['The receptor changes shape and starts a relay inside the cell', 'The cell divides', 'The ligand is copied', 'The membrane dissolves'], a: 0, why: 'The shape change triggers relay molecules (second messengers, kinases) that amplify the signal.' },
    { q: 'Which ligand opens a ligand-gated ion channel at a nerve–muscle synapse?', opts: ['Acetylcholine', 'Estrogen', 'Insulin', 'Cortisol'], a: 0, why: 'Acetylcholine opens Na⁺ channels on muscle cells, which triggers contraction.' }];
  function shape(c, sh, x, y, r, col, fill = true) { c.beginPath(); if (sh === 'tri') { c.moveTo(x, y - r); c.lineTo(x + r * .95, y + r * .7); c.lineTo(x - r * .95, y + r * .7); c.closePath(); } else if (sh === 'cir') c.arc(x, y, r * .85, 0, 7); else if (sh === 'sq') c.rect(x - r * .78, y - r * .78, r * 1.56, r * 1.56); else { for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + Math.PI / 6; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); }
    if (fill) { c.fillStyle = col; c.fill(); } else { c.strokeStyle = col; c.stroke(); } }
  function membrane(c, t) {
    const g = c.createLinearGradient(0, MEM, 0, H); g.addColorStop(0, '#1a2a6b'); g.addColorStop(1, '#0a1240'); c.fillStyle = g; c.fillRect(0, MEM + 34, W, H);
    for (let x = 0; x < W + 20; x += 17) { const y = MEM + Math.sin(x * .03 + t) * 2;
      c.strokeStyle = '#f3c37a'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 3, y + 6); c.lineTo(x - 3, y + 15); c.moveTo(x + 3, y + 6); c.lineTo(x + 3, y + 15); c.moveTo(x - 3, y + 21); c.lineTo(x - 3, y + 28); c.moveTo(x + 3, y + 21); c.lineTo(x + 3, y + 28); c.stroke();
      c.fillStyle = '#5fb7ff'; c.beginPath(); c.arc(x, y + 3, 6, 0, 7); c.arc(x, y + 31, 6, 0, 7); c.fill(); }
    D.text(c, 'OUTSIDE THE CELL', W - 14, MEM - 44, { pix: true, size: 8, align: 'right', color: '#7f95d6' }); D.text(c, 'CYTOPLASM', 14, H - 12, { pix: true, size: 8, color: '#7f95d6' });
  }
  function receptor(c, x, k, blocked, flash) { const K = KIND[k], col = blocked ? '#666e8a' : K.col; c.save(); D.glow(c, col, flash ? 30 : 14);
    c.fillStyle = col; D.rr(c, x - 9, MEM - 2, 18, 60, 6); c.fill(); c.beginPath(); c.moveTo(x - 9, MEM + 2); c.lineTo(x - 30, MEM - 40); c.lineTo(x - 16, MEM - 44); c.lineTo(x, MEM - 14); c.lineTo(x + 16, MEM - 44); c.lineTo(x + 30, MEM - 40); c.lineTo(x + 9, MEM + 2); c.closePath(); c.fill();
    c.shadowBlur = 0; shape(c, K.sh, x, MEM - 34, 12, '#0b1440'); c.lineWidth = 2.5; shape(c, K.sh, x, MEM - 34, 12, '#ffffffaa', false); c.restore(); }
  function make(A) {
    const st = { x: W / 2, k: 0, ligs: [], spawn: 0, time: 90, block: 0, combo: 0, flash: 0, casc: [], qAt: [60, 30], qs: A.shuffle(QS), caught: 0, passed: 0 };
    function spawn() {
      const r = Math.random(), lvl = (90 - st.time) / 30, x = A.rnd(70, W - 70);
      let L; if (r < .16) L = { type: 'ster', name: A.pick(STER), sh: 'hex', col: '#ffd23f' };
      else if (r < .27 + lvl * .04) { const k = Math.floor(Math.random() * 3); L = { type: 'anta', name: A.pick(ANTA), sh: KIND[k].sh, col: '#9aa3c0', k }; }
      else { const k = Math.floor(Math.random() * 3); L = { type: 'lig', name: A.pick(KIND[k].lig), sh: KIND[k].sh, col: KIND[k].col, k }; }
      st.ligs.push(Object.assign(L, { x, y: 40, vy: A.rnd(60, 90) + lvl * 24, wob: Math.random() * 6 }));
    }
    const setK = k => { if (k !== st.k) { st.k = k; A.sfx.pick(); } };
    return {
      _st: st,
      update(dt) {
        st.time -= dt; if (st.time <= 0) { A.over(true, `Signals relayed: <b>${st.caught}</b> · Steroids let through: <b>${st.passed}</b>`); return; }
        if (st.qAt.length && st.time <= st.qAt[0]) { st.qAt.shift(); A.ask({ ...st.qs.pop(), tag: 'Signal check', reward: 'Bonus +300' }).then(ok => { if (ok) A.add(300, W / 2, 200); }); return; }
        const sp = 430; if (A.key('left')) st.x -= sp * dt; if (A.key('right')) st.x += sp * dt; if (A.ptr.down && A.ptr.y < MEM - 60) st.x += A.clamp(A.ptr.x - st.x, -sp * dt * 1.2, sp * dt * 1.2); st.x = A.clamp(st.x, 40, W - 40);
        if (A.hit('fire') || A.hit('alt') || A.hit('up')) setK((st.k + 1) % 3); ['1', '2', '3'].forEach((n, i) => { if (A.hit(n)) setK(i); });
        if (A.ptr.tap && A.ptr.y > MEM - 60) setK((st.k + 1) % 3);
        if (st.block > 0) st.block -= dt; if (st.flash > 0) st.flash -= dt;
        st.spawn -= dt; if (st.spawn <= 0) { spawn(); st.spawn = Math.max(.5, 1.3 - (90 - st.time) / 110); }
        st.ligs.forEach(L => {
          if (L.inside) { L.y += 45 * dt; if (L.y > H - 10) L.gone = true; return; }
          L.y += L.vy * dt; L.x += Math.sin(A.t * 2 + L.wob) * 18 * dt; if (L.bounce) L.vy = Math.min(L.vy + 320 * dt, 110);
          if (L.y > MEM - 46 && L.y < MEM - 20 && Math.abs(L.x - st.x) < 30 && L.vy > 0) {
            if (L.type === 'ster') { if (!L.warned) { L.warned = true; A.add(-50, L.x, L.y); A.sfx.bad(); st.combo = 0; A.toast(`<b>${L.name}</b> is a steroid. It’s lipid-soluble, so it doesn’t need a membrane receptor. Let it pass!`, 3.4); } }
            else if (L.type === 'anta') { L.gone = true; st.block = 2.2; st.combo = 0; A.fx.burst(L.x, L.y, '#9aa3c0', 16); A.hurt(`<b>${L.name}</b> is an antagonist: it blocks the receptor without activating it.`); }
            else if (st.block <= 0 && L.k === st.k) { L.gone = true; st.combo++; st.caught++; A.add(100 * Math.min(5, st.combo), L.x, L.y - 20); A.sfx.good(); st.flash = .3; A.fx.burst(L.x, MEM - 34, L.col, 18);
              for (let i = 0; i < 3; i++) st.casc.push({ x: st.x, y: MEM + 50, vy: 90 + i * 30, t: 0, col: L.col }); }
            else if (st.block <= 0) { A.sfx.hit(); L.vy = -140; L.bounce = true; st.combo = 0; A.toast(`Wrong shape. <b>${L.name}</b> fits a ${KIND[L.k].rec.toLowerCase()}.`, 2.4); } }
          if (L.y > MEM + 6) { if (L.type === 'ster') { L.inside = true; st.passed++; A.add(75, L.x, MEM - 10, '#ffd23f'); } else { L.gone = true; if (L.type === 'lig') st.combo = 0; } } });
        st.ligs = st.ligs.filter(L => !L.gone);
        st.casc.forEach(p => { p.t += dt; p.y += p.vy * dt; }); st.casc = st.casc.filter(p => p.t < 1);
      },
      draw(c) {
        D.bg(c, '#0c0a36', '#1b0f4f'); D.stars(c, A.t, 50, 6, '#c9b6ff');
        membrane(c, A.t);
        st.ligs.filter(L => L.inside).forEach(L => { c.save(); c.globalAlpha = .8; D.glow(c, L.col, 10); shape(c, L.sh, L.x, L.y, 11, L.col); c.restore(); });
        st.casc.forEach(p => { c.save(); c.globalAlpha = 1 - p.t; D.glow(c, p.col, 10); c.fillStyle = p.col; c.beginPath(); c.arc(p.x + Math.sin(p.t * 9) * 14, p.y, 5, 0, 7); c.fill(); c.restore(); });
        receptor(c, st.x, st.k, st.block > 0, st.flash > 0);
        D.text(c, KIND[st.k].rec, st.x, MEM + 78, { size: 13, align: 'center', color: st.block > 0 ? '#9aa3c0' : KIND[st.k].col });
        if (st.block > 0) D.text(c, 'BLOCKED', st.x, MEM - 60, { pix: true, size: 10, align: 'center', color: '#ff6b81', glow: '#ff6b81' });
        st.ligs.filter(L => !L.inside).forEach(L => { c.save(); D.glow(c, L.col, 14); shape(c, L.sh, L.x, L.y, 13, L.col); c.shadowBlur = 0;
          if (L.type === 'anta') { c.strokeStyle = '#ff5d7a'; c.lineWidth = 3; c.beginPath(); c.moveTo(L.x - 7, L.y - 7); c.lineTo(L.x + 7, L.y + 7); c.moveTo(L.x + 7, L.y - 7); c.lineTo(L.x - 7, L.y + 7); c.stroke(); }
          c.restore(); D.text(c, L.name, L.x, L.y - 20, { size: 12, align: 'center', color: L.type === 'anta' ? '#c8cde0' : '#fff' }); });
        c.save(); c.fillStyle = 'rgba(5,10,28,.65)'; D.rr(c, 10, 44, 250, 104, 10); c.fill(); c.restore();
        KIND.forEach((K, i) => { shape(c, K.sh, 28, 64 + i * 22, 8, K.col); D.text(c, `${i + 1}  ${K.rec}`, 44, 69 + i * 22, { size: 12, color: i === st.k ? '#fff' : '#a9b4d8' }); });
        shape(c, 'hex', 28, 130, 8, '#ffd23f'); D.text(c, 'Steroid: let it pass through', 44, 135, { size: 12, color: '#ffe8a0' });
      },
      hud() { return { mid: 'TIME ' + Math.ceil(Math.max(0, st.time)) + (st.combo > 1 ? '  ·  COMBO ×' + Math.min(5, st.combo) : '') }; }
    };
  }
  function preview(c, t) { D.bg(c, '#0c0a36', '#1b0f4f'); D.stars(c, t, 40, 6, '#c9b6ff'); membrane(c, t); [0, 1, 2].forEach(k => receptor(c, 200 + k * 280, k, false, false));
    [0, 1, 2].forEach(k => { const y = 70 + ((t * 70 + k * 110) % 320); c.save(); D.glow(c, KIND[k].col, 14); shape(c, KIND[k].sh, 200 + k * 280, Math.min(y, MEM - 34), 14, KIND[k].col); c.restore(); });
    c.save(); D.glow(c, '#ffd23f', 12); shape(c, 'hex', 620, 60 + ((t * 60) % 440), 12, '#ffd23f'); c.restore(); }
  AR.reg({ id: 'rush', subject: 'Biology', diff: 'Medium', title: 'Receptor Rush', sub: 'Match ligands to their receptors', topic: 'Cell signaling', color: '#b46bff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 21v-8M12 13L6 4M12 13l6-9"/><path d="M3 21h18"/></svg>',
    intro: 'Ligands rain down on the cell. Slide your <b>receptor</b> under each one and switch its binding site to the matching shape to relay the signal.',
    how: ['Move with <b>← →</b> (or drag above the membrane). Switch the binding site with <b>Space</b> or keys <b>1 2 3</b> (or tap the membrane).', 'Each shape is a receptor family: <b>▲</b> G protein–coupled receptor, <b>●</b> ligand-gated ion channel, <b>■</b> receptor tyrosine kinase.', '<b>Yellow hexagons are steroids.</b> They’re lipid-soluble, so step aside and let them pass through the membrane.', 'Dodge grey <b>antagonists</b> marked ✕. They block your receptor and cost a life. Survive 90 seconds.'],
    keys: '<kbd>←</kbd><kbd>→</kbd> move · <kbd>Space</kbd> or <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> switch shape', pad: { dirs: ['left', 'right'], acts: [['fire', 'SWAP']] },
    recap: 'Receptors are specific to their ligand’s shape. Polar signals bind membrane receptors; nonpolar steroids cross the membrane and bind receptors inside the cell. Antagonists block receptors.', winTitle: 'Signals delivered', loseTitle: 'Receptors blocked', make, preview });
})();
