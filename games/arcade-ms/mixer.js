/* Molecule Mixer (middle school, physical science): catch exactly the right atoms in your flask to build each
   molecule. A wrong or extra atom makes a different substance, and too many mistakes spill the flask. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, FY = 470;
  const AT = { H: { name: 'Hydrogen', col: '#f2f4f8', ink: '#333', r: 15 }, O: { name: 'Oxygen', col: '#ff4d4d', ink: '#fff', r: 19 }, C: { name: 'Carbon', col: '#4a4f5c', ink: '#fff', r: 19 }, N: { name: 'Nitrogen', col: '#3f7bff', ink: '#fff', r: 18 }, Na: { name: 'Sodium', col: '#a46bff', ink: '#fff', r: 21 }, Cl: { name: 'Chlorine', col: '#3ed17a', ink: '#fff', r: 20 } };
  const MOL = [
    { f: 'H₂O', name: 'Water', need: { H: 2, O: 1 }, fact: 'Water: two hydrogen atoms bonded to one oxygen atom.' },
    { f: 'O₂', name: 'Oxygen gas', need: { O: 2 }, fact: 'The oxygen we breathe is two oxygen atoms bonded together.' },
    { f: 'CO₂', name: 'Carbon dioxide', need: { C: 1, O: 2 }, fact: 'You breathe out CO₂, and plants use it to make food.' },
    { f: 'CH₄', name: 'Methane', need: { C: 1, H: 4 }, fact: 'Methane is natural gas, used for cooking and heating.' },
    { f: 'NH₃', name: 'Ammonia', need: { N: 1, H: 3 }, fact: 'Ammonia is used to make fertilizer for crops.' },
    { f: 'NaCl', name: 'Table salt', need: { Na: 1, Cl: 1 }, fact: 'Sodium is a reactive metal and chlorine is a toxic gas, but together they make salt!' },
    { f: 'H₂O₂', name: 'Hydrogen peroxide', need: { H: 2, O: 2 }, fact: 'Same atoms as water, but one more oxygen makes a totally different substance.' }];
  const QS = [
    { q: 'What is a molecule?', opts: ['Two or more atoms bonded together', 'One single atom', 'A kind of cell', 'A mixture of liquids'], a: 0, why: 'H₂O is a molecule made of 3 atoms.' },
    { q: 'Which is a chemical change?', opts: ['Iron rusting', 'Ice melting', 'Cutting paper', 'Dissolving sugar in water'], a: 0, why: 'Rusting makes a new substance (iron oxide). The others don’t make new substances.' },
    { q: 'H₂O and H₂O₂ have the same kinds of atoms. Are they the same substance?', opts: ['No, a different number of atoms makes a different substance', 'Yes, always', 'Only when frozen', 'Only in plants'], a: 0, why: 'The number and arrangement of atoms decides the substance and its properties.' }];
  function atom(c, x, y, k, s = 1) { const A0 = AT[k]; D.gloss(c, x, y, A0.r * s, A0.col); D.text(c, k, x, y + 6 * s, { size: 16 * s, align: 'center', color: A0.ink }); }
  function flask(c, x, t, fill, col) { c.save(); c.translate(x, FY); const g = c.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(.5, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,.4)');
    c.beginPath(); c.moveTo(-18, -70); c.lineTo(-18, -30); c.lineTo(-58, 40); c.quadraticCurveTo(-62, 52, -48, 52); c.lineTo(48, 52); c.quadraticCurveTo(62, 52, 58, 40); c.lineTo(18, -30); c.lineTo(18, -70); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    c.save(); c.clip(); c.fillStyle = col; c.globalAlpha = .55; c.fillRect(-70, 50 - fill * 70, 140, 80); c.restore(); c.fillStyle = '#fff'; c.fillRect(-24, -76, 48, 8); c.restore(); }
  function lab(c, t) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a3fd8'); g.addColorStop(1, '#2b7fe0'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = .12; for (let i = 0; i < 12; i++) { const x = (i * 97) % W, y = (i * 61 + t * 15) % H; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; c[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * 26, y + Math.sin(a) * 26); } c.closePath(); c.stroke(); } c.restore();
    c.fillStyle = '#2a2470'; c.fillRect(0, FY + 52, W, H); }
  function make(A) {
    const st = { i: 0, x: W / 2, got: {}, atoms: [], spawn: .5, mess: 0, build: 0, qs: A.shuffle(QS) };
    const M = () => MOL[Math.min(MOL.length - 1, st.i)];
    const left = () => Object.entries(M().need).filter(([k, n]) => (st.got[k] || 0) < n).map(([k]) => k);
    async function done() { const m = M(); A.sfx.power(); A.add(300, st.x, FY - 120); st.build = 2; A.toast(`<b>${m.name} (${m.f})!</b> ${m.fact}`, 3.6);
      await new Promise(r => setTimeout(r, 1600)); if (st.i === 2 || st.i === 5) { const ok = await A.ask({ ...st.qs.pop(), tag: 'Chemistry check', reward: 'Bonus +250' }); if (ok) A.add(250); }
      st.i++; st.got = {}; st.mess = 0; st.build = 0; if (st.i >= MOL.length) A.over(true, `You built all ${MOL.length} molecules.`); }
    return {
      _st: st,
      update(dt) {
        if (st.build > 0) { st.build -= dt; return; }
        const sp = 470; if (A.key('left')) st.x -= sp * dt; if (A.key('right')) st.x += sp * dt; if (A.ptr.down) st.x += A.clamp(A.ptr.x - st.x, -sp * dt, sp * dt); st.x = A.clamp(st.x, 70, W - 70);
        st.spawn -= dt; if (st.spawn <= 0) { const need = left(), pool = Object.keys(AT), k = need.length && Math.random() < .55 ? A.pick(need) : A.pick(pool); st.atoms.push({ k, x: A.rnd(50, W - 50), y: 40, vy: A.rnd(110, 150) + st.i * 12, wob: Math.random() * 6 }); st.spawn = Math.max(.45, .8 - st.i * .04); }
        st.atoms.forEach(a => { a.y += a.vy * dt; a.x += Math.sin(A.t * 2 + a.wob) * 30 * dt;
          if (a.y > FY - 80 && a.y < FY - 50 && Math.abs(a.x - st.x) < 30) { a.dead = true; const n = M().need[a.k] || 0, have = st.got[a.k] || 0;
            if (have < n) { st.got[a.k] = have + 1; A.add(40, st.x, FY - 100); A.sfx.pick(); A.fx.burst(st.x, FY - 60, AT[a.k].col, 10); if (!left().length) done(); }
            else { st.mess++; A.sfx.bad(); A.shake(.2); A.toast(n ? `Too many <b>${AT[a.k].name.toLowerCase()}</b> atoms! ${M().f} has exactly ${n}.` : `${M().f} has no <b>${AT[a.k].name.toLowerCase()}</b>. That would make a different substance!`, 2.6);
              if (st.mess >= 3) { st.got = {}; st.mess = 0; A.hurt('The flask spilled! Start this molecule again.'); } } } });
        st.atoms = st.atoms.filter(a => !a.dead && a.y < H + 30);
      },
      draw(c) {
        lab(c, A.t); const m = M();
        flask(c, st.x, A.t, Object.values(st.got).reduce((s, n) => s + n, 0) / Object.values(m.need).reduce((s, n) => s + n, 0), '#7fd0ff');
        const inside = Object.entries(st.got).flatMap(([k, n]) => Array(n).fill(k)); inside.forEach((k, i) => atom(c, st.x - 30 + (i % 4) * 20, FY + 30 - Math.floor(i / 4) * 22, k, .6));
        /* target card */ c.save(); c.fillStyle = 'rgba(255,255,255,.92)'; D.rr(c, 14, 44, 300, 96, 16); c.fill(); c.restore();
        D.text(c, 'BUILD', 30, 66, { pix: true, size: 8, color: '#5a6a8a' }); D.text(c, `${m.name}  ${m.f}`, 30, 92, { size: 20, color: '#1b2a5a' });
        Object.entries(m.need).forEach(([k, n], i) => { const x = 46 + i * 120; atom(c, x, 116, k, .7); D.text(c, `${st.got[k] || 0}/${n}`, x + 20, 122, { size: 16, color: (st.got[k] || 0) >= n ? '#1f9d6b' : '#1b2a5a' }); });
        st.atoms.forEach(a => atom(c, a.x, a.y, a.k));
        for (let i = 0; i < 3; i++) { c.save(); c.globalAlpha = i < st.mess ? 1 : .25; D.gloss(c, W - 30 - i * 26, 62, 9, '#ff8a3d'); c.restore(); } D.text(c, 'SPILLS', W - 110, 66, { pix: true, size: 8, align: 'right', color: '#fff' });
        if (st.build > 0) { const n = inside.length; inside.forEach((k, i) => { const a = i / n * 6.283 + A.t * 2; atom(c, W / 2 + Math.cos(a) * 50, 240 + Math.sin(a) * 30, k); }); D.text(c, m.f, W / 2, 330, { size: 34, align: 'center', color: '#fff', glow: '#7fd0ff' }); }
      },
      hud() { return { mid: `MOLECULE ${Math.min(MOL.length, st.i + 1)}/${MOL.length}` }; }
    };
  }
  function preview(c, t) { lab(c, t); ['H', 'O', 'C', 'N', 'Na', 'Cl', 'H'].forEach((k, i) => atom(c, 120 + i * 120, 80 + ((t * 70 + i * 60) % 300), k)); flask(c, 480 + Math.sin(t) * 120, t, .5, '#7fd0ff'); }
  AR.reg({ id: 'mixer', subject: 'Chemistry', diff: 'Easy', title: 'Molecule Mixer', sub: 'Catch the right atoms to build molecules', topic: 'Atoms & molecules', color: '#a46bff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/></svg>',
    intro: 'Atoms are raining into the lab. Catch <b>exactly</b> the atoms you need in your flask to build each molecule.',
    how: ['Move the flask with <b>← →</b> (or drag).', 'The card shows the molecule and how many of each atom it needs: H₂O needs <b>2 hydrogen</b> and <b>1 oxygen</b>.', 'Catching a wrong or extra atom is a spill. Three spills and the flask empties.'],
    keys: '<kbd>←</kbd><kbd>→</kbd> move the flask', pad: { dirs: ['left', 'right'] },
    recap: 'Molecules are atoms bonded together. The kinds of atoms, how many of each, and how they are arranged decide what the substance is (H₂O vs. H₂O₂).', winTitle: 'Master mixer!', loseTitle: 'Lab cleanup time', make, preview });
})();
