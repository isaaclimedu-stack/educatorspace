/* Atom Blaster (middle school, physical science): shoot capture beams at protons, neutrons and electrons to build
   each element exactly. The number of protons decides which element it is. Dodge the gamma rays. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, SY = H - 50, AX = 820, AY = 300;
  const EL = [['H', 'Hydrogen', 1, 0], ['He', 'Helium', 2, 2], ['Li', 'Lithium', 3, 4], ['Be', 'Beryllium', 4, 5], ['C', 'Carbon', 6, 6]];
  const NAMES = ['', 'Hydrogen', 'Helium', 'Lithium', 'Beryllium', 'Boron', 'Carbon', 'Nitrogen', 'Oxygen'];
  const P = { p: { name: 'proton', col: '#ff4d4d', r: 14, sign: '+' }, n: { name: 'neutron', col: '#9aa3b8', r: 14, sign: '' }, e: { name: 'electron', col: '#3fa9ff', r: 9, sign: '−' } };
  const QS = [
    { q: 'What decides which element an atom is?', opts: ['The number of protons', 'The number of neutrons', 'Its color', 'Its size'], a: 0, why: 'Every carbon atom has 6 protons. Change the protons and you change the element.' },
    { q: 'In a neutral atom, the number of electrons equals the number of', opts: ['protons', 'neutrons', 'shells', 'molecules'], a: 0, why: 'Protons are positive and electrons are negative, so equal numbers cancel out.' },
    { q: 'Where are protons and neutrons found?', opts: ['In the nucleus', 'Orbiting outside the nucleus', 'Only in electrons', 'In molecules only'], a: 0, why: 'The nucleus holds protons and neutrons. Electrons move around it.' }];
  function part(c, x, y, k, s = 1) { const T = P[k]; D.gloss(c, x, y, T.r * s, T.col); if (T.sign) D.text(c, T.sign, x, y + 6 * s, { size: 16 * s, align: 'center', color: '#fff' }); }
  function model(c, got, t, s = 1) { const n = got.p + got.n, pts = []; for (let i = 0; i < n; i++) { const a = i * 2.4, r = Math.sqrt(i) * 9 * s; pts.push([AX + Math.cos(a) * r, AY + Math.sin(a) * r, i % 2 === 0 && pts.filter(p => p[2] === 'p').length < got.p || pts.filter(p => p[2] === 'n').length >= got.n ? 'p' : 'n']); }
    c.save(); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 2; [70, 115].forEach(r => { c.beginPath(); c.arc(AX, AY, r * s, 0, 7); c.stroke(); }); c.restore();
    pts.forEach(([x, y, k]) => part(c, x, y, k, .75 * s)); for (let i = 0; i < got.e; i++) { const shell = i < 2 ? 70 : 115, cnt = i < 2 ? Math.min(2, got.e) : got.e - 2, j = i < 2 ? i : i - 2, a = j / cnt * 6.283 + t * (i < 2 ? 1.2 : .8); part(c, AX + Math.cos(a) * shell * s, AY + Math.sin(a) * shell * s, 'e', s); } }
  function space(c, t) { const g = c.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 700); g.addColorStop(0, '#3b2a9a'); g.addColorStop(1, '#0c0a3a'); c.fillStyle = g; c.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { c.globalAlpha = .3 + (i % 4) * .15; D.sparkle(c, (i * 137.5) % W, (i * 71.3 + t * 6) % H, i % 6 ? 1.4 : 3, '#fff'); } c.globalAlpha = 1; }
  function make(A) {
    const st = { i: 0, x: 330, got: { p: 0, n: 0, e: 0 }, parts: [], beams: [], rays: [], cool: 0, bad: 0, inv: 0, wait: 0, qs: A.shuffle(QS) };
    const E = () => EL[Math.min(EL.length - 1, st.i)], need = () => ({ p: E()[2], n: E()[3], e: E()[2] });
    function fill() { while (st.parts.length < 9) { const ks = Object.entries(need()).filter(([k, v]) => st.got[k] < v).map(([k]) => k); const k = ks.length && Math.random() < .6 ? A.pick(ks) : A.pick(['p', 'n', 'e']); st.parts.push({ k, x: A.rnd(40, 620), y: A.rnd(70, 300), vx: A.rnd(-90, 90), vy: A.rnd(-60, 60) }); } }
    fill(); A.toast(`Build <b>${E()[1]}</b>: ${E()[2]} proton, ${E()[3]} neutrons, ${E()[2]} electron.`, 3.4);
    async function complete() { A.sfx.power(); A.add(400, AX, AY - 150); A.fx.burst(AX, AY, '#ffe066', 30, 240); st.wait = 1.6;
      setTimeout(async () => { if (st.i === 1 || st.i === 3) { const ok = await A.ask({ ...st.qs.pop(), tag: 'Atom check', reward: 'Bonus +250' }); if (ok) A.add(250); }
        st.i++; st.got = { p: 0, n: 0, e: 0 }; st.bad = 0; if (st.i >= EL.length) { A.over(true, 'You built hydrogen, helium, lithium, beryllium and carbon.'); return; } const e = E(); A.toast(`Next: <b>${e[1]}</b> — ${e[2]} protons, ${e[3]} neutrons, ${e[2]} electrons.`, 3.4); }, 1500); }
    return {
      _st: st,
      update(dt) {
        if (st.wait > 0) { st.wait -= dt; return; }
        const sp = 420; if (A.key('left')) st.x -= sp * dt; if (A.key('right')) st.x += sp * dt; if (A.ptr.down) st.x += A.clamp(A.ptr.x - st.x, -sp * dt, sp * dt); st.x = A.clamp(st.x, 30, 640);
        st.cool -= dt; if ((A.key('fire') || A.ptr.down) && st.cool <= 0) { st.cool = .35; st.beams.push({ x: st.x, y: SY - 30 }); A.sfx.shoot(); }
        if (st.inv > 0) st.inv -= dt;
        st.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x < 20 || p.x > 640) p.vx *= -1; if (p.y < 60 || p.y > 330) p.vy *= -1; });
        st.beams.forEach(b => { b.y -= 560 * dt; for (const p of st.parts) if (!p.dead && Math.hypot(p.x - b.x, p.y - b.y) < P[p.k].r + 10) { p.dead = b.dead = true; const nd = need();
          if (st.got[p.k] < nd[p.k]) { st.got[p.k]++; A.add(30, p.x, p.y - 20); A.sfx.pick(); A.fx.burst(p.x, p.y, P[p.k].col, 10); if (st.got.p === nd.p && st.got.n === nd.n && st.got.e === nd.e) complete(); }
          else { st.bad++; A.sfx.bad(); A.shake(.2);
            const msg = p.k === 'p' ? `Too many protons! With ${st.got.p + 1} protons it would be <b>${NAMES[st.got.p + 1] || 'a different element'}</b>, not ${E()[1]}.` : p.k === 'n' ? `Too many neutrons. ${E()[1]} usually has ${nd.n}. Extra neutrons make an unstable isotope.` : `Too many electrons! The atom would get a negative charge (an ion).`;
            A.toast(msg, 3); if (st.bad >= 3) { st.got = { p: 0, n: 0, e: 0 }; st.bad = 0; A.hurt('The atom became unstable and fell apart!'); } } break; } });
        st.parts = st.parts.filter(p => !p.dead); st.beams = st.beams.filter(b => !b.dead && b.y > 40); fill();
        if (Math.random() < dt * (.35 + st.i * .12)) st.rays.push({ x: A.rnd(30, 640), y: 40, vy: A.rnd(180, 260) });
        st.rays.forEach(r => { r.y += r.vy * dt; if (st.inv <= 0 && Math.abs(r.x - st.x) < 24 && Math.abs(r.y - SY) < 30) { r.dead = true; st.inv = 1.5; A.hurt('A gamma ray hit you! Dodge the yellow zigzags.'); } });
        st.rays = st.rays.filter(r => !r.dead && r.y < H + 20);
      },
      draw(c) {
        space(c, A.t);
        c.save(); c.fillStyle = 'rgba(255,255,255,.06)'; D.rr(c, 676, 60, 270, 470, 20); c.fill(); c.restore();
        model(c, st.got, A.t); const e = E(), nd = need();
        D.text(c, `${e[1]} (${e[0]})`, AX, 92, { size: 22, align: 'center', color: '#fff' });
        [['p', 'Protons'], ['n', 'Neutrons'], ['e', 'Electrons']].forEach(([k, l], i) => { const y = 448 + i * 26; part(c, 704, y - 5, k, .55); D.text(c, `${l}: ${st.got[k]}/${nd[k]}`, 722, y, { size: 15, color: st.got[k] >= nd[k] ? '#7dffb0' : '#fff' }); });
        for (let i = 0; i < 3; i++) { c.save(); c.globalAlpha = i < st.bad ? 1 : .25; D.gloss(c, 900 - i * 22, 460, 8, '#ff8a3d'); c.restore(); }
        st.parts.forEach(p => part(c, p.x, p.y, p.k));
        st.rays.forEach(r => { c.save(); D.glow(c, '#ffe066', 12); c.strokeStyle = '#ffe066'; c.lineWidth = 3; c.beginPath(); for (let k = 0; k < 6; k++) c[k ? 'lineTo' : 'moveTo'](r.x + (k % 2 ? 7 : -7), r.y - 30 + k * 6); c.stroke(); c.restore(); });
        st.beams.forEach(b => { c.save(); D.glow(c, '#7fffd4', 12); c.fillStyle = '#7fffd4'; D.rr(c, b.x - 3, b.y - 14, 6, 22, 3); c.fill(); c.restore(); });
        if (!(st.inv > 0 && Math.floor(A.t * 12) % 2)) { D.glossRect(c, st.x - 30, SY - 10, 60, 26, 12, '#5b6cff'); D.gloss(c, st.x, SY - 14, 14, '#7fffd4'); }
      },
      hud() { return { mid: `ELEMENT ${Math.min(EL.length, st.i + 1)}/${EL.length}` }; }
    };
  }
  function preview(c, t) { space(c, t); model(c, { p: 3, n: 4, e: 3 }, t, .8); ['p', 'n', 'e', 'p', 'e', 'n'].forEach((k, i) => part(c, 100 + i * 90 + Math.sin(t + i) * 20, 120 + (i % 3) * 70 + Math.cos(t * 1.3 + i) * 20, k)); D.glossRect(c, 300 + Math.sin(t) * 100, SY - 10, 60, 26, 12, '#5b6cff'); }
  AR.reg({ id: 'atom', subject: 'Chemistry', diff: 'Medium', title: 'Atom Blaster', sub: 'Capture protons, neutrons and electrons to build atoms', topic: 'Atomic structure', color: '#3fa9ff',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/></svg>',
    intro: 'Build atoms one particle at a time. Shoot capture beams at <b>protons</b> (+), <b>neutrons</b> and <b>electrons</b> (−) to build each element exactly.',
    how: ['Move with <b>← →</b> and fire with <b>Space</b> (or hold and drag on a touch screen).', 'The card on the right shows what you need. The number of <b>protons</b> decides the element!', 'Extra particles make the atom unstable; three and it falls apart. Dodge the yellow <b>gamma rays</b>.'],
    keys: '<kbd>←</kbd><kbd>→</kbd> move · <kbd>Space</kbd> capture', pad: { dirs: ['left', 'right'], acts: [['fire', 'BEAM']] },
    recap: 'Atoms have protons and neutrons in the nucleus and electrons around it. The number of protons is the atomic number and decides the element. A neutral atom has as many electrons as protons.', winTitle: 'Atom architect!', loseTitle: 'Atoms fell apart', make, preview });
})();
