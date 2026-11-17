/* ═══════════ HS Physics: "Crash Test Lab: Momentum" ═══════════
   Two carts on a frictionless track. While their bumpers touch, a spring–damper force acts:
     F = k·δ + c·δ̇   (δ = overlap, only pushing), with c set from the coefficient of restitution e:
     ζ = −ln e / √(π² + ln² e), c = 2ζ√(k·μ)  (μ = reduced mass). e = 1 elastic, e = 0 → velcro (they stick).
   Equal and opposite forces (Newton’s 3rd law) mean total momentum p = m₁v₁ + m₂v₂ is conserved in every
   collision; kinetic energy is conserved only when e = 1. Impulse J = ∫F dt = Δp: a softer bumper (smaller k,
   longer contact time) gives the same impulse with a smaller peak force: the idea behind crumple zones and airbags.
   A "wall" is a cart of enormous mass. */
(() => {
  const K = Kit, f = SimLab.f, PX = 150, X0 = 40, TRACK = 4.2, W = .5;
  const fresh = o => Object.assign({ mA: 1, mB: 1, vA: 2, vB: 0, e: 1, k: 2000, wall: false, egg: false, len: .05 }, o || {});
  function setup(st) {
    const A = { m: st.mA, v: st.vA, x: .3, w: W }, B = st.wall ? { m: 1e9, v: 0, x: 3.6, w: .1, wall: true } : { m: st.mB, v: st.vB, x: 2.1, w: W };
    return { st, A, B, t: 0, Fh: [], peak: 0, touch: false, t0: null, t1: null, J: 0, stuck: false, done: false, pA: [A.m * A.v, B.m * B.v], keA: .5 * A.m * A.v * A.v + (B.wall ? 0 : .5 * B.m * B.v * B.v), maxComp: 0, broke: false };
  }
  function step(s, dt) {
    const { A, B, st } = s, mu = B.wall ? A.m : A.m * B.m / (A.m + B.m), e = Math.max(0, Math.min(1, st.e)), z = e <= .001 ? 1 : -Math.log(e) / Math.sqrt(Math.PI ** 2 + Math.log(e) ** 2), c = 2 * z * Math.sqrt(st.k * mu);
    const n = 40, h = dt / n;
    for (let i = 0; i < n; i++) {
      if (s.stuck) { const v = B.wall ? 0 : (A.m * A.v + B.m * B.v) / (A.m + B.m); A.v = v; B.v = v; }
      const gap = B.x - (A.x + A.w), d = -gap, dd = A.v - B.v; let F = 0;
      if (d > 0 && !s.stuck) { F = Math.max(0, st.k * d + c * dd); if (!s.touch) { s.touch = true; s.t0 = s.t; } s.maxComp = Math.max(s.maxComp, d);
        if (e <= .001 && dd <= 0) { s.stuck = true; } }
      else if (s.touch && s.t1 == null && (d <= 0 || s.stuck)) s.t1 = s.t;
      A.v -= F / A.m * h; if (!B.wall) B.v += F / B.m * h; s.J += F * h; s.peak = Math.max(s.peak, F); s.curF = F;
      A.x += A.v * h; if (!B.wall) B.x += B.v * h; s.t += h;
      if (A.x < 0) { A.x = 0; A.v = Math.abs(A.v) * 0; } if (!B.wall && B.x + B.w > TRACK) { B.x = TRACK - B.w; B.v = 0; }
    }
    if (st.egg && st.len && s.maxComp > st.len) s.bottom = true;
    s.Fh.push(s.touch && s.t1 == null ? s.curF || 0 : 0); if (s.Fh.length > 240) s.Fh.shift();
  }
  const pTot = s => s.A.m * s.A.v + (s.B.wall ? 0 : s.B.m * s.B.v), ke = s => .5 * s.A.m * s.A.v ** 2 + (s.B.wall ? 0 : .5 * s.B.m * s.B.v ** 2);
  function cart(c, col, label, egg, broke) { const x = X0 + c.x * PX, w = c.w * PX, y = 330;
    if (c.wall) return `<rect x="${x}" y="${y - 160}" width="${w + 30}" height="200" fill="#6b7a88"/><text x="${x + 20}" y="${y - 170}" font-size="13" fill="#2b3640" text-anchor="middle">wall</text>`;
    const h = 46 + c.m * 6;
    return `<g><rect x="${x}" y="${y - h}" width="${w}" height="${h}" rx="8" fill="${col}"/><circle cx="${x + 16}" cy="${y + 4}" r="9" fill="#222"/><circle cx="${x + w - 16}" cy="${y + 4}" r="9" fill="#222"/><text x="${x + w / 2}" y="${y - h / 2 + 5}" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${label} ${f(c.m, 1)} kg</text>
      ${egg ? (broke ? `<path d="M${x + w / 2 - 14},${y - h - 2} l6,-10 l6,6 l6,-12 l6,8 l4,-4" stroke="#d9c9a0" stroke-width="3" fill="#fff6e0"/><ellipse cx="${x + w / 2}" cy="${y - h - 2}" rx="20" ry="5" fill="#ffd54d"/>` : `<ellipse cx="${x + w / 2}" cy="${y - h - 16}" rx="12" ry="16" fill="#fff6e0" stroke="#d9c9a0" stroke-width="2"/>`) : ''}</g>`; }
  function scene(s, o = {}) {
    const st = s.st, { A, B } = s, bump = Math.max(0, Math.min(st.len || .05, -(B.x - (A.x + A.w)))), crush = st.len ? bump / st.len : 0;
    let g = `<rect width="1000" height="620" fill="#dfe8f0"/><rect y="342" width="1000" height="14" fill="#6b7a88"/><rect y="356" width="1000" height="264" fill="#c5d0da"/>${Array.from({ length: 9 }, (_, i) => `<line x1="${X0 + i * .5 * PX}" y1="356" x2="${X0 + i * .5 * PX}" y2="368" stroke="#5a6a7c"/><text x="${X0 + i * .5 * PX}" y="384" font-size="11" fill="#5a6a7c" text-anchor="middle">${i * .5} m</text>`).join('')}`;
    g += cart(A, '#2f6fd6', 'A', st.egg, s.broke) + `<rect x="${X0 + (A.x + A.w) * PX - 2}" y="${300}" width="${Math.max(4, (st.len || .05) * PX * (1 - crush))}" height="22" rx="4" fill="${st.e <= .001 ? '#7ee0a1' : st.k < 600 ? '#ffd27a' : '#9aa8b8'}"/>` + cart(B, '#e5484d', 'B');
    if (s.touch && s.t1 == null) g += `<g transform="translate(${X0 + (A.x + A.w) * PX} 270)">${[0, 60, 120, 180, 240, 300].map(a => `<line x1="0" y1="0" x2="${Math.cos(a * Math.PI / 180) * 18}" y2="${Math.sin(a * Math.PI / 180) * 18}" stroke="#ff9a3c" stroke-width="3"/>`).join('')}</g>`;
    const arrow = (c, y, col) => c.wall || Math.abs(c.v) < .02 ? '' : `<g transform="translate(${X0 + (c.x + c.w / 2) * PX} ${y})"><line x1="0" y1="0" x2="${c.v * 40}" y2="0" stroke="${col}" stroke-width="5"/><path d="M${c.v * 40},0 l${-Math.sign(c.v) * 12},-8 v16z" fill="${col}"/><text x="${c.v * 20}" y="-10" font-size="12" font-weight="800" fill="${col}" text-anchor="middle">${f(c.v, 2)} m/s</text></g>`;
    g += arrow(A, 200, '#2f6fd6') + arrow(B, 170, '#e5484d');
    const [pa, pb] = s.pA, p0 = pa + pb, p1 = pTot(s), k1 = ke(s);
    g += SimLab.hud(660, 410, 320, [['', 'before → after'], ['Momentum A', `${f(pa, 2)} → ${f(A.m * A.v, 2)} kg·m/s`, '#2f6fd6'], ['Momentum B', B.wall ? 'wall (Earth absorbs it)' : `${f(pb, 2)} → ${f(B.m * B.v, 2)} kg·m/s`, '#e5484d'], B.wall ? ['Cart’s change Δp', `${f(p1 - p0, 2)} kg·m/s (= −J)`, '#7ee0a1'] : ['Total momentum', `${f(p0, 2)} → ${f(p1, 2)}`, '#7ee0a1'], ['Kinetic energy', `${f(s.keA, 2)} → ${f(k1, 2)} J`, '#ffd27a'], ['Peak force · contact', s.peak ? `${f(s.peak)} N · ${s.t1 != null ? f((s.t1 - s.t0) * 1000) : '…'} ms` : '—'], ['Impulse J', s.J ? `${f(s.J, 2)} N·s` : '—']], 'Crash data');
    g += SimLab.chart(36, 440, 580, 120, [{ d: s.Fh, c: '#ff6b6b', n: 'force on A (N)' }], { ymax: Math.max(10, s.peak * 1.1), xs: 240, title: 'Force during the collision' });
    if (s.broke) g += `<text x="330" y="120" font-size="22" font-weight="800" fill="#e5484d" text-anchor="middle">✗ The egg broke! Peak force ${f(s.peak)} N</text>`;
    else if (st.egg && s.t1 != null) g += `<text x="330" y="120" font-size="22" font-weight="800" fill="#2f8a3a" text-anchor="middle">✓ The egg survived (peak ${f(s.peak)} N)</text>`;
    if (s.bottom) g += `<text x="330" y="150" font-size="16" font-weight="800" fill="#e5484d" text-anchor="middle">The bumper bottomed out (crushed flat)!</text>`;
    return g + (o.extra || '');
  }
  function track(st, cfg = {}) {
    let s = setup(st), run = false;
    SimLab.stage('', (g, dt) => { if (run) { step(s, dt * (s.touch && s.t1 == null ? .25 : 1)); if (st.egg && !s.broke && (s.peak > (cfg.eggMax || 60) || s.bottom)) { s.broke = true; SND.wah(); } if (!s.done && s.t1 != null && s.t - s.t1 > .6) { s.done = true; cfg.onEnd && cfg.onEnd(s); } if (s.t > 6) run = false; } g.innerHTML = scene(s, { extra: cfg.extra ? cfg.extra(s) : '' }); });
    return { go() { s = setup(st); if (st.egg && st.len) s.bottom = false; run = true; SND.tone(300, .1, 'square', .04, 420); }, reset() { s = setup(st); run = false; }, s: () => s };
  }
  const COLL = [['1', 'Elastic (springy)'], ['0.5', 'Partly elastic'], ['0', 'Velcro (stick)']];

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'stick', name: 'Conservation', title: 'Stick together', html: 'Cart A (1 kg, 2 m/s) hits cart B (1 kg, at rest) and they <b>stick together</b> (velcro). <b>Predict</b> their speed afterwards, then crash them.', hint: 'Momentum before = momentum after: 1 × 2 + 1 × 0 = (1 + 1) × v.' },
    { id: 'elastic', name: 'Elastic', title: 'Bounce!', html: 'Now the bumpers are springy (elastic). <b>Predict</b> what happens when equal carts collide, then try a <b>3 kg</b> cart hitting a 1 kg cart.', hint: 'With equal masses in an elastic collision, the carts swap velocities.' },
    { id: 'energy', name: 'Kinetic energy', title: 'Where did the energy go?', html: 'Run the same crash (1 kg at 2 m/s into 1 kg at rest) with <b>elastic</b> bumpers and with <b>velcro</b>. Compare total momentum and total kinetic energy before and after.', hint: 'Momentum is always conserved. Kinetic energy is only conserved if the collision is elastic.' },
    { id: 'egg', name: 'Impulse', title: 'Save the egg', html: 'Cart A carries an egg and hits a wall at 2 m/s. The egg breaks above <b>60 N</b>. Choose a bumper that saves it, and compare the <b>impulse</b> and <b>peak force</b> with the stiff bumper.', hint: 'Impulse = Δp is the same either way. A softer bumper makes the contact time longer, so the force is smaller: F = Δp ÷ Δt.' }
  ];
  const S = {
    stick: R => { const st = fresh({ e: 0 }); let pOk = false, ran = false;
      const T = track(st, { onEnd: s => { ran = true; XLab.note(`Velcro: 1 kg at 2 m/s + 1 kg at rest → both at ${f(s.A.v, 2)} m/s. Momentum ${f(s.pA[0] + s.pA[1], 2)} → ${f(pTot(s), 2)} kg·m/s.`); G.check(); } });
      LabUI.html(XLab.numIn('stV', 'Predicted speed after', 'm/s'));
      $('#stVB').onclick = () => { const v = +$('#stV').value; if (Math.abs(v - 1) <= .05) { pOk = true; K.msg('Right: 2 kg·m/s shared by 2 kg = 1 m/s.', 'ok', 2200); } else { R.mistake('Inelastic collision', 'Total momentum 2 kg·m/s is shared by 2 kg: v = 1 m/s.'); K.msg('Total momentum before ÷ total mass.', 'bad', 2200); } G.check(); };
      SimLab.panel({}, [{ btns: [{ id: 'go', label: 'Crash!', cls: 'primary', fn: () => { if (!pOk) { K.msg('Predict first.', 'bad', 1500); return; } T.go(); } }] }]);
      const G = SimLab.goals(R, { name: 'Conservation', items: () => [[pOk, 'Predict the final speed'], [ran, 'Run the crash']],
        q: { q: 'Why is momentum conserved in the collision?', a: ['The carts push on each other with equal and opposite forces for the same time', 'The carts are the same color', 'Kinetic energy is conserved', 'Velcro adds momentum'], c: 0, e: 'Newton’s 3rd law: F on A = −F on B for the same Δt, so A loses exactly the momentum B gains. With no outside force, the total stays the same.' } }); },
    elastic: R => { const st = fresh({ e: 1 }); let pred = null, eq = false, heavy = false;
      XLab.choiceIn('Prediction: 1 kg at 2 m/s hits 1 kg at rest, elastic. Afterwards…', ['A stops; B moves at 2 m/s', 'Both move at 1 m/s', 'A bounces back at 2 m/s', 'B moves at 4 m/s'], i => { pred = i; if (i !== 0) R.mistake('Elastic, equal masses', 'Equal masses in an elastic collision swap velocities: A stops, B leaves at 2 m/s.'); G.check(); });
      const T = track(st, { onEnd: s => { if (st.mA === 1) { eq = true; XLab.note(`Elastic, equal masses: A ${f(s.A.v, 2)} m/s, B ${f(s.B.v, 2)} m/s (they swapped).`); } if (st.mA === 3) { heavy = true; XLab.note(`Elastic, 3 kg into 1 kg: A ${f(s.A.v, 2)} m/s, B ${f(s.B.v, 2)} m/s.`); } G.check(); } });
      SimLab.panel({}, [{ btns: [{ id: 'a', label: 'Crash 1 kg into 1 kg', cls: 'primary', fn: () => { if (pred == null) { K.msg('Predict first.', 'bad', 1500); return; } st.mA = 1; T.go(); } }, { id: 'b', label: 'Crash 3 kg into 1 kg', fn: () => { st.mA = 3; T.go(); } }] }]);
      const G = SimLab.goals(R, { name: 'Elastic', items: () => [[pred != null, 'Predict'], [eq, 'Equal masses'], [heavy, '3 kg into 1 kg']],
        q: { q: 'When the 3 kg cart hit the 1 kg cart, the 1 kg cart left at 3 m/s, faster than the 3 kg cart arrived. Is that allowed?', a: ['Yes: momentum and kinetic energy are both still conserved', 'No: nothing can go faster than what hit it', 'Only if friction helps', 'Only in space'], c: 0, e: 'Check: before p = 3 × 2 = 6, after 3 × 1 + 1 × 3 = 6 kg·m/s. KE before ½·3·2² = 6 J, after ½·3·1² + ½·1·3² = 6 J. A heavy object hitting a light one elastically can launch it at up to twice its own speed.' } }); },
    energy: R => { const st = fresh({ e: 1 }); const res = {};
      const pk = LabUI.html(`<div class="pl-pred"><label>Bumpers</label><div class="sim-pick">${COLL.map(([v, t]) => `<button class="btn sm ${+v === st.e ? 'on' : ''}" data-cl="${v}">${t}</button>`).join('')}</div></div>`);
      $$('[data-cl]', pk).forEach(b => b.onclick = () => { st.e = +b.dataset.cl; $$('[data-cl]', pk).forEach(x => x.classList.toggle('on', x === b)); T.reset(); });
      const T = track(st, { onEnd: s => { res[st.e] = { p: pTot(s), k: ke(s) }; XLab.note(`e = ${st.e}: momentum ${f(s.pA[0] + s.pA[1], 2)} → ${f(pTot(s), 2)} kg·m/s; KE ${f(s.keA, 2)} → ${f(ke(s), 2)} J.`); G.check(); } });
      SimLab.panel({}, [{ btns: [{ id: 'go', label: 'Crash!', cls: 'primary', fn: () => T.go() }] }]);
      const G = SimLab.goals(R, { name: 'Kinetic energy', items: () => [[res[1] != null, 'Elastic crash'], [res[0] != null, 'Velcro crash']],
        q: { q: 'In the velcro crash, half the kinetic energy disappeared. Where did it go?', a: ['Into heat, sound and bending the bumpers (other forms of energy)', 'It was destroyed', 'Into extra momentum', 'Into the track’s gravity'], c: 0, e: 'Energy is always conserved overall, but in an inelastic collision kinetic energy is transformed into internal energy (heat), sound and deformation. Momentum is still fully conserved.' } }); },
    egg: R => { const st = fresh({ wall: true, egg: true, e: .2, k: 3000, len: .05, vA: 2, mA: .5 }), res = {};
      const pk = LabUI.html(`<div class="pl-pred"><label>Bumper</label><div class="sim-pick"><button class="btn sm on" data-bp="hard">Stiff steel</button><button class="btn sm" data-bp="foam">Foam</button><button class="btn sm" data-bp="crumple">Crumple zone</button></div></div>`);
      const BP = { hard: [3000, .05], foam: [300, .15], crumple: [50, .4] };
      $$('[data-bp]', pk).forEach(b => b.onclick = () => { st.k = BP[b.dataset.bp][0]; st.len = BP[b.dataset.bp][1]; st.kind = b.dataset.bp; $$('[data-bp]', pk).forEach(x => x.classList.toggle('on', x === b)); T.reset(); });
      st.kind = 'hard';
      const T = track(st, { eggMax: 60, onEnd: s => { res[st.kind] = { J: s.J, F: s.peak, dt: (s.t1 - s.t0) }; XLab.note(`${st.kind} bumper: impulse ${f(s.J, 2)} N·s, peak force ${f(s.peak)} N over ${f((s.t1 - s.t0) * 1000)} ms → egg ${s.broke ? 'broke' : 'survived'}.`); if (!s.broke) res.saved = true; G.check(); } });
      SimLab.panel({}, [{ btns: [{ id: 'go', label: 'Crash into the wall', cls: 'primary', fn: () => T.go() }] }]);
      const G = SimLab.goals(R, { name: 'Impulse', items: () => [[res.hard != null, 'Crash with the stiff bumper'], [!!res.saved, 'Save the egg']],
        q: { q: 'Both bumpers gave nearly the same impulse. Why did the soft one save the egg?', a: ['It stretched the contact time, so the same change in momentum needed a smaller force', 'It reduced the egg’s momentum change', 'It made the cart lighter', 'It increased the impulse'], c: 0, e: 'Impulse F·Δt = Δp. The cart’s momentum change is fixed by its mass and speed, so a longer Δt means a smaller F. Crumple zones, airbags, helmets and bending your knees when you land all use this.' } }); }
  };
  const quiz = [
    { q: 'A 2 kg ball moving at 3 m/s has momentum…', a: ['6 kg·m/s', '1.5 kg·m/s', '9 kg·m/s', '18 kg·m/s'], c: 0, e: 'p = mv = 2 × 3 = 6 kg·m/s.' },
    { q: 'A 60 kg skater pushes off a 40 kg skater (both at rest). The 60 kg skater moves at 2 m/s. The other moves at…', a: ['3 m/s the other way', '2 m/s the other way', '1.3 m/s the other way', '0 m/s'], c: 0, e: 'Total momentum stays 0: 60 × 2 = 40 × v, so v = 3 m/s in the opposite direction.' },
    { q: 'Which collision conserves kinetic energy?', a: ['Elastic', 'Perfectly inelastic', 'Any collision with velcro', 'None ever'], c: 0, e: 'Momentum is conserved in all collisions; kinetic energy only in elastic ones.' },
    { q: 'An airbag reduces injury because it…', a: ['Increases the time the head takes to stop, lowering the force', 'Reduces the head’s change in momentum', 'Increases the impulse', 'Makes the car lighter'], c: 0, e: 'The head must lose the same momentum either way; more time means less force (F = Δp/Δt).' },
    { q: 'A 1,000 kg car at 10 m/s stops in 0.1 s. The average force is…', a: ['100,000 N', '10,000 N', '1,000 N', '100 N'], c: 0, e: 'F = Δp/Δt = (1,000 × 10) ÷ 0.1 = 100,000 N.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Set up any crash, run it, and it is <b>recorded automatically</b>.',
    fresh: () => fresh({ e: 1 }),
    vars: [{ k: 'mA', label: 'Mass of cart A', short: 'mA', min: .5, max: 4, step: .5, unit: 'kg', d: 1, fmt: v => v + ' kg' }, { k: 'mB', label: 'Mass of cart B', short: 'mB', min: .5, max: 4, step: .5, unit: 'kg', d: 1, fmt: v => v + ' kg' }, { k: 'vA', label: 'Velocity of A', short: 'vA', min: 0, max: 3, step: .25, unit: 'm/s', d: 2, fmt: v => v + ' m/s' }, { k: 'vB', label: 'Velocity of B', short: 'vB', min: -3, max: 0, step: .25, unit: 'm/s', d: 2, fmt: v => v + ' m/s' }, { k: 'e', label: 'Bounciness (coefficient of restitution)', short: 'e', min: 0, max: 1, step: .1, unit: '', d: 1, fmt: v => f(v, 1) + (v == 0 ? ' (sticks)' : v == 1 ? ' (elastic)' : '') }, { k: 'k', label: 'Bumper stiffness', short: 'k', min: 50, max: 4000, step: 50, unit: 'N/m', d: 0, fmt: v => v + ' N/m' }],
    measures: [{ k: 'vA2', label: 'A’s velocity after', short: 'vA after', unit: 'm/s', d: 2 }, { k: 'vB2', label: 'B’s velocity after', short: 'vB after', unit: 'm/s', d: 2 }, { k: 'p0', label: 'Total momentum before', short: 'p before', unit: 'kg·m/s', d: 2 }, { k: 'p1', label: 'Total momentum after', short: 'p after', unit: 'kg·m/s', d: 2 }, { k: 'keLost', label: 'Kinetic energy lost', short: 'KE lost', unit: '%', d: 0 }, { k: 'F', label: 'Peak force', short: 'Peak F', unit: 'N', d: 0 }, { k: 'dt', label: 'Contact time', short: 'Contact', unit: 'ms', d: 0 }],
    noRecord: true,
    ideas: [['How does bounciness (e) affect the kinetic energy lost?', 'e', 'keLost'], ['How does bumper stiffness affect the peak force?', 'k', 'F'], ['How does cart A’s mass affect B’s velocity after an elastic crash?', 'mA', 'vB2'], ['Does total momentum change with the velocity of A?', 'vA', 'p1']],
    expect(x, y) {
      if (y === 'p1' || y === 'p0') return { t: x === 'vA' || x === 'mA' ? 'up' : 'flat', why: 'Total momentum after always equals total momentum before (compare the two columns): it changes only because the starting momentum changes.' };
      if (x === 'e' && y === 'keLost') return { t: 'down', why: 'Kinetic energy lost = (1 − e²) × the energy available in the carts’ relative motion. e = 1 loses nothing; e = 0 (sticking) loses the most.' };
      if (x === 'k' && y === 'F') return { t: 'up', why: 'A stiffer bumper stops the carts in less time. The impulse (Δp) is the same, so F = Δp/Δt is larger. Peak force grows with √k.' };
      if (x === 'k' && y === 'dt') return { t: 'down', why: 'Contact time ≈ π√(μ/k): stiffer springs bounce back sooner.' };
      if (x === 'mA' && y === 'vB2') return { t: 'levels', why: 'Elastic: v_B′ = 2m_A·v_A/(m_A + m_B). Heavier A launches B faster, up to a limit of twice A’s speed.' };
      if (x === 'k') return { t: 'flat', why: 'Stiffness changes the force and time, not the momentum or velocities afterwards.' };
      return null;
    },
    setup(F) {
      const T = track(F.st, { onEnd: s => F.add({ vA2: s.A.v, vB2: s.B.v, p0: s.pA[0] + s.pA[1], p1: pTot(s), keLost: s.keA ? (1 - ke(s) / s.keA) * 100 : 0, F: s.peak, dt: (s.t1 - s.t0) * 1000 }) });
      F.onChange(() => T.reset());
      const b = LabUI.html('<div class="row sim-btns"><button class="btn sm primary" id="crGo">Crash!</button><button class="btn sm" id="crRs">Reset</button></div>'); $('#crGo', b).onclick = () => T.go(); $('#crRs', b).onclick = () => T.reset();
    }
  };

  /* ═════ Game ═════ */
  function shot(G, o) {
    const st = fresh(o.st); let tries = 0;
    const T = track(st, { eggMax: o.eggMax || 60, onEnd: s => { tries++; const r = o.check(s); if (r.ok) G.win(tries === 1 ? 3 : tries === 2 ? 2 : 1, 1500 - tries * 300, r.msg); else if (tries >= 3) G.lose('Out of tries', r.msg + ' ' + o.why); else K.msg(`${r.msg} ${3 - tries} tries left.`, 'bad', 3500); },
      extra: () => `<g transform="translate(36 20)"><rect width="580" height="40" rx="10" fill="#0b1020" fill-opacity=".85"/><text x="14" y="26" font-size="15" font-weight="800" fill="#ffd27a">${o.target}</text><text x="566" y="26" font-size="14" font-weight="800" fill="#fff" text-anchor="end">Try ${Math.min(3, tries + 1)}/3</text></g>` });
    G.panel(st, o.items.concat([{ btns: [{ id: 'go', label: 'Crash!', cls: 'primary', fn: () => T.go() }] }]), () => T.reset());
  }
  const game = {
    title: 'Crash Course', intro: 'Calculate first, then crash. Each level gives you three tries; get it on the first for three stars.',
    cover: () => `<rect width="1000" height="620" fill="#dfe8f0"/>${labThumb('crash').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#0b2a4a" text-anchor="middle">Crash Course</text><text x="500" y="540" font-size="18" fill="#0b2a4a" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Perfect launch', goal: 'Elastic bumpers. Your 1 kg cart must send the <b>2 kg</b> cart off at exactly <b>1.5 m/s</b>. Choose A’s speed.', hint: 'Elastic: v_B′ = 2m_A·v_A/(m_A + m_B) = 2·1·v/3.', setup: G => shot(G, { st: { mA: 1, mB: 2, vA: 1, e: 1 }, target: 'Target: B leaves at 1.50 m/s (±0.05)', items: [{ k: 'vA', label: 'A’s speed', min: .25, max: 3, step: .05, fmt: v => f(v, 2) + ' m/s' }], check: s => ({ ok: Math.abs(s.B.v - 1.5) <= .05, msg: `B left at ${f(s.B.v, 2)} m/s.` }), why: 'v_A = 1.5 × 3 ÷ 2 = 2.25 m/s.' }) },
      { name: 'Dead stop', goal: 'Velcro bumpers. A (2 kg at 1.5 m/s) meets B (1.5 kg) coming the other way. Make the stuck-together pair <b>stop dead</b>.', hint: 'Total momentum must be zero: 2 × 1.5 + 1.5 × v_B = 0.', setup: G => shot(G, { st: { mA: 2, mB: 1.5, vA: 1.5, vB: -1, e: 0 }, target: 'Target: the joined carts end at 0.00 m/s (±0.04)', items: [{ k: 'vB', label: 'B’s velocity', min: -3, max: 0, step: .05, fmt: v => f(v, 2) + ' m/s' }], check: s => ({ ok: Math.abs(s.A.v) <= .04, msg: `The pair moved at ${f(s.A.v, 2)} m/s.` }), why: 'v_B = −(2 × 1.5) ÷ 1.5 = −2.00 m/s.' }) },
      { name: 'Egg crate', goal: 'Your 0.5 kg cart carries an egg into a wall at <b>2.5 m/s</b>. Design the bumper: soft enough that the egg survives (under 60 N), but long enough that it doesn’t crush flat.', hint: 'Peak force ≈ v√(k·m). The bumper compresses about v√(m/k). You need both small enough.', setup: G => shot(G, { st: { mA: .5, vA: 2.5, wall: true, egg: true, e: .2, k: 2000, len: .1 }, items: [{ k: 'k', label: 'Bumper stiffness', min: 50, max: 3000, step: 25, fmt: v => v + ' N/m' }, { k: 'len', label: 'Bumper length (costs space)', min: .05, max: .3, step: .01, fmt: v => f(v * 100) + ' cm' }], target: 'Target: egg survives, bumper doesn’t bottom out', check: s => ({ ok: !s.broke && !s.bottom, msg: s.bottom ? 'The bumper crushed flat.' : s.broke ? `Peak force ${f(s.peak)} N: the egg broke.` : 'The egg survived!' }), why: 'Softer springs lower the peak force but compress further. Try k around 300–500 N/m with a bumper of 12 cm or more: the squeeze is about v√(m/k).' }) }
    ]
  };
  const finale = () => { track(fresh({ mA: 3, mB: 1, vA: 1.5, e: 1 })).go(); };
  XLab.define({ id: 'crash', guided: { steps, S, quiz, finale, finaleMsg: 'Crash tests complete! Now check your thinking.', summary: () => 'You showed that total momentum is conserved in every collision, that kinetic energy is conserved only in elastic ones, and that a longer collision time lowers the force for the same impulse.' }, free, game });
})();
