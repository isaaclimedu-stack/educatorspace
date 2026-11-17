/* ═══════════ HS Chemistry: "Collision Lab: Reaction Accelerator" ═══════════
   A real 2-D hard-sphere gas (drawn on the canvas). Particles A (blue) and B (orange) bounce elastically; when an
   A and a B collide, the reaction A + B → AB happens only if
     1. the kinetic energy of their collision along the line of centers ≥ Ea   (energy condition), and
     2. they hit in a suitable orientation (a 50 % chance here: the steric factor)     (orientation condition).
   Speeds start from a Maxwell–Boltzmann distribution for the chosen temperature; energies are reported in kJ/mol
   (1 unit of simulation energy = RT at 300 K = 2.49 kJ/mol). A catalyst gives an easier path: Ea × 0.55.
   The box sits in a water bath (a thermostat keeps the average kinetic energy at the set temperature).
   So the fraction of successful collisions ≈ ½·e^(−Ea/RT): heating helps a lot, concentration raises the number
   of collisions, and a catalyst lowers the bar. */
(() => {
  const K = Kit, f = SimLab.f, BOX = { x: 30, y: 70, w: 600, h: 470 }, RAD = 9, E1 = 2.494;
  const fresh = o => Object.assign({ T: 300, N: 30, Ea: 9, cat: 'off' }, o || {});
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  function gas(st) {
    const g = { P: [], coll: 0, succ: 0, wrongE: 0, wrongO: 0, made: 0, t: 0, log: [], flashes: [] };
    const sd = Math.sqrt(st.T / 300) * 120;
    for (let i = 0; i < st.N * 2; i++) g.P.push({ k: i < st.N ? 'A' : 'B', x: BOX.x + RAD + Math.random() * (BOX.w - 2 * RAD), y: BOX.y + RAD + Math.random() * (BOX.h - 2 * RAD), vx: gauss() * sd, vy: gauss() * sd, m: 1, r: RAD });
    return g;
  }
  function retemp(g, T, T0) { const s = Math.sqrt(T / T0); g.P.forEach(p => { p.vx *= s; p.vy *= s; }); }
  function step(g, st, dt) {
    const P = g.P, Ea = st.Ea * (st.cat === 'on' ? .55 : 1);
    P.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < BOX.x + p.r) { p.x = BOX.x + p.r; p.vx = Math.abs(p.vx); } if (p.x > BOX.x + BOX.w - p.r) { p.x = BOX.x + BOX.w - p.r; p.vx = -Math.abs(p.vx); }
      if (p.y < BOX.y + p.r) { p.y = BOX.y + p.r; p.vy = Math.abs(p.vy); } if (p.y > BOX.y + BOX.h - p.r) { p.y = BOX.y + BOX.h - p.r; p.vy = -Math.abs(p.vy); } });
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j]; if (a.dead || b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, rr = a.r + b.r; if (d2 >= rr * rr || d2 === 0) continue;
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (vn >= 0) continue;
      const mu = a.m * b.m / (a.m + b.m), En = .5 * mu * (vn / 120) ** 2 * E1;   /* collision energy along the line of centers, kJ/mol */
      const ab = (a.k === 'A' && b.k === 'B') || (a.k === 'B' && b.k === 'A');
      if (ab) { g.coll++; const okE = En >= Ea, okO = Math.random() < .5;
        if (okE && okO) { g.succ++; g.made++; a.dead = b.dead = true; const m = a.m + b.m; P.push({ k: 'C', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, vx: (a.vx * a.m + b.vx * b.m) / m, vy: (a.vy * a.m + b.vy * b.m) / m, m, r: RAD * 1.3 }); g.flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: .5, ok: true }); continue; }
        if (!okE) g.wrongE++; else g.wrongO++; if (g.flashes.length < 30) g.flashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, t: .3, ok: false }); }
      const J = 2 * mu * vn; a.vx += J / a.m * nx; a.vy += J / a.m * ny; b.vx -= J / b.m * nx; b.vy -= J / b.m * ny;
      const ov = (rr - d) / 2; a.x -= nx * ov; a.y -= ny * ov; b.x += nx * ov; b.y += ny * ov;
    }
    if (P.some(p => p.dead)) g.P = P.filter(p => !p.dead);
    /* thermostat (the water bath): nudge the average kinetic energy back to the set temperature, as heat flows in or out */
    let ke = 0; g.P.forEach(p => ke += .5 * p.m * (p.vx * p.vx + p.vy * p.vy)); ke /= Math.max(1, g.P.length);
    const want = st.T / 300 * 120 * 120, lam = Math.sqrt(Math.max(.5, 1 + dt / .4 * (want / Math.max(1, ke) - 1))); g.P.forEach(p => { p.vx *= lam; p.vy *= lam; });
    g.t += dt; g.flashes.forEach(x => x.t -= dt); g.flashes = g.flashes.filter(x => x.t > 0);
  }
  function paint(c, g, st) {
    c.clearRect(0, 0, 1000, 620); c.fillStyle = '#101a2e'; c.fillRect(0, 0, 1000, 620);
    c.fillStyle = st.T > 450 ? `rgba(255,90,60,${Math.min(.18, (st.T - 450) / 2000)})` : st.T < 250 ? 'rgba(90,170,255,.12)' : '#16243f'; c.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
    c.strokeStyle = '#2d4470'; c.lineWidth = 4; c.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h);
    if (st.cat === 'on') { c.fillStyle = 'rgba(160,170,190,.35)'; for (let i = 0; i < 10; i++) c.fillRect(BOX.x + 20 + i * 58, BOX.y + BOX.h - 16, 36, 12); }
    g.P.forEach(p => { c.fillStyle = p.k === 'A' ? '#4f8ff7' : p.k === 'B' ? '#ff9a3c' : '#7ee0a1'; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.29); c.fill();
      if (p.k === 'C') { c.fillStyle = '#4f8ff7'; c.beginPath(); c.arc(p.x - 4, p.y, 5, 0, 6.29); c.fill(); c.fillStyle = '#ff9a3c'; c.beginPath(); c.arc(p.x + 4, p.y, 5, 0, 6.29); c.fill(); } });
    g.flashes.forEach(x => { c.strokeStyle = x.ok ? `rgba(255,210,122,${x.t * 2})` : `rgba(255,255,255,${x.t * 1.5})`; c.lineWidth = x.ok ? 4 : 2; c.beginPath(); c.arc(x.x, x.y, x.ok ? 30 - x.t * 30 : 16, 0, 6.29); c.stroke(); });
  }
  /* Maxwell–Boltzmann curve of collision energies with Ea marked; and the energy diagram */
  function mbCurve(st, x, y, w, h, gg) {
    const RT = E1 * st.T / 300, Ea = st.Ea * (st.cat === 'on' ? .55 : 1), Em = 50, pts = [], sh = [];
    for (let i = 0; i <= 60; i++) { const E = i / 60 * Em, p = Math.exp(-E / RT) / RT, X = x + i / 60 * w, Y = y + h - Math.min(1, p / (1 / (E1 * 200 / 300))) * h; pts.push(`${X.toFixed(1)},${Y.toFixed(1)}`); if (E >= Ea) sh.push(`${X.toFixed(1)},${Y.toFixed(1)}`); }
    const xe = x + Math.min(1, Ea / Em) * w;
    return `<rect x="${x - 10}" y="${y - 32}" width="${w + 20}" height="${h + 58}" rx="10" fill="#0b1020" fill-opacity=".8"/><text x="${x}" y="${y - 12}" font-size="13" font-weight="700" fill="#fff">Collision energies (Maxwell–Boltzmann)</text>
      ${sh.length ? `<polygon points="${xe},${y + h} ${sh.join(' ')} ${x + w},${y + h}" fill="#ffd27a" fill-opacity=".45"/>` : ''}<polyline points="${pts.join(' ')}" fill="none" stroke="#9fd0ff" stroke-width="2.4"/>
      <line x1="${x}" y1="${y + h}" x2="${x + w}" y2="${y + h}" stroke="#fff" stroke-opacity=".3"/><line x1="${xe}" y1="${y}" x2="${xe}" y2="${y + h}" stroke="#ffd27a" stroke-width="2" stroke-dasharray="4 3"/><text x="${xe + 4}" y="${y + 12}" font-size="11" fill="#ffd27a">Ea ${f(Ea)} kJ/mol</text>
      <text x="${x}" y="${y + h + 16}" font-size="11" fill="#a9b6cc">0</text><text x="${x + w}" y="${y + h + 16}" font-size="11" fill="#a9b6cc" text-anchor="end">${Em} kJ/mol</text><text x="${x + w}" y="${y + 12}" font-size="11" fill="#ffd27a" text-anchor="end">${gg && gg.coll >= 20 ? `measured: ${f((gg.coll - gg.wrongE) / gg.coll * 100, 1)} % had enough` : 'shaded = enough energy'}</text>`;
  }
  function eDiagram(st, x, y, w, h) {
    const Ea = st.Ea, Ec = Ea * .55, sc = (h - 30) / 40, y0 = y + h - 10, yR = y0 - 14 * sc * .5, yP = y0, top = yR - Ea * sc, topc = yR - Ec * sc;
    return `<rect x="${x - 10}" y="${y - 30}" width="${w + 20}" height="${h + 40}" rx="10" fill="#0b1020" fill-opacity=".8"/><text x="${x}" y="${y - 10}" font-size="13" font-weight="700" fill="#fff">Energy diagram (ΔH = −14 kJ/mol)</text>
      <path d="M${x},${yR} H${x + w * .25} Q${x + w * .5},${(4 * top - yR - yP) / 2} ${x + w * .75},${yP} H${x + w}" fill="none" stroke="#9fd0ff" stroke-width="2.6"/>
      ${st.cat === 'on' ? `<path d="M${x + w * .25},${yR} Q${x + w * .5},${(4 * topc - yR - yP) / 2} ${x + w * .75},${yP}" fill="none" stroke="#7ee0a1" stroke-width="2.6" stroke-dasharray="6 4"/>` : ''}
      <text x="${x + 4}" y="${yR - 6}" font-size="11" fill="#a9b6cc">A + B</text><text x="${x + w - 4}" y="${yP - 6}" font-size="11" fill="#a9b6cc" text-anchor="end">AB</text>
      <line x1="${x + w * .5}" y1="${yR}" x2="${x + w * .5}" y2="${top}" stroke="#ffd27a" stroke-dasharray="3 3"/><text x="${x + w * .5 + 6}" y="${(yR + top) / 2 + 4}" font-size="11" fill="#ffd27a">Ea ${f(Ea)}</text>${st.cat === 'on' ? `<text x="${x + w * .5 - 6}" y="${topc + 30}" font-size="11" fill="#7ee0a1" text-anchor="end">with catalyst</text>` : ''}`;
  }
  function hud(g, st, rate) {
    const pct = g.coll ? g.succ / g.coll * 100 : 0;
    return SimLab.hud(650, 30, 330, [['Temperature', `${f(st.T)} K`], ['A and B particles', `${g.P.filter(p => p.k === 'A').length} + ${g.P.filter(p => p.k === 'B').length}`], ['A–B collisions', `${g.coll}`], ['Too little energy', `${g.wrongE}`, '#a9b6cc'], ['Wrong orientation', `${g.wrongO}`, '#a9b6cc'], ['Successful', `${g.succ} (${f(pct, 1)} %)`, '#ffd27a'], ['Products made', `${g.made}`, '#7ee0a1'], ['Rate', `${f(rate, 2)} per s`, '#7ee0a1']], 'Collision counter')
      + mbCurve(st, 670, 262, 290, 90, g) + eDiagram(st, 670, 418, 290, 110);
  }
  /* the shared scene: canvas gas + SVG readouts. Measures the rate over a sliding 5 s window */
  function chamber(st, cfg = {}) {
    const c = XLab.cv(); let g = gas(st), T0 = st.T, hist = [], run = !cfg.paused;
    SimLab.stage('', (el, dt) => { if (run) { const h = dt / 4; for (let k = 0; k < 4; k++) step(g, st, h); if (st.T !== T0) { retemp(g, st.T, T0); T0 = st.T; } hist.push([g.t, g.made]); while (hist.length && hist[0][0] < g.t - 5) hist.shift(); cfg.tick && cfg.tick(g); }
      paint(c, g, st); const rate = hist.length > 1 ? (hist[hist.length - 1][1] - hist[0][1]) / Math.max(.5, hist[hist.length - 1][0] - hist[0][0]) : 0; el.innerHTML = hud(g, st, rate) + (cfg.extra ? cfg.extra(g) : ''); });
    return { g: () => g, reset() { g = gas(st); T0 = st.T; hist = []; XLab.cvClear(); }, pause(v) { run = !v; } };
  }
  const trial = (ch, secs, cb) => { ch.reset(); const g0 = ch.g(); const chk = () => { if (!K.live || ch.g() !== g0) return; if (g0.t >= secs) cb(g0); else setTimeout(chk, 150); }; setTimeout(chk, 150); };

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'watch', name: 'Collision theory', title: 'Not every hit counts', html: 'Blue A and orange B particles react to make green AB, but only some collisions work. Watch the counter until there have been <b>40 A–B collisions</b>.', hint: 'Look at the two reasons collisions fail in the counter.' },
    { id: 'temp', name: 'Temperature', title: 'Turn up the heat', html: '<b>Predict</b>, then run a <b>10-second trial at 300 K</b> and one at <b>600 K</b>. Compare successful collisions. Watch the shaded area of the energy curve.', hint: 'Set the temperature, then press “Run 10 s trial”.' },
    { id: 'conc', name: 'Concentration', title: 'Crowd the box', html: 'At 400 K, run a 10-second trial with <b>15</b> of each particle and one with <b>45</b> of each. Compare the <b>number of collisions</b>.', hint: 'More particles in the same space bump into each other more often.' },
    { id: 'cat', name: 'Catalyst', title: 'Take a shortcut', html: 'Add a <b>catalyst</b>. Compare the energy diagram and the % of successful collisions with and without it (10-second trials at 350 K).', hint: 'A catalyst gives the reaction a different path with a lower activation energy. ΔH stays the same.' }
  ];
  const S = {
    watch: R => { const st = fresh({ T: 400, N: 30 }); let done = false;
      chamber(st, { tick: g => { if (g.coll >= 40 && !done) { done = true; XLab.note(`Of the first ${g.coll} A–B collisions, ${g.succ} worked; ${g.wrongE} had too little energy and ${g.wrongO} hit in the wrong orientation.`); G.check(); } } });
      const G = SimLab.goals(R, { name: 'Collision theory', items: () => [[done, 'Watch 40 A–B collisions']],
        q: { q: 'For a collision to make product, the particles must…', a: ['Collide with at least the activation energy, in the right orientation', 'Simply touch', 'Be the same color', 'Move slowly'], c: 0, e: 'Collision theory: particles must collide, with <b>enough energy</b> (≥ Ea) to break bonds, and with the <b>right orientation</b>. Most collisions fail one test or the other.' } }); },
    temp: R => { const st = fresh({ T: 300, N: 30 }), res = {}; let pred = null;
      XLab.choiceIn('Prediction: at 600 K the number of successful collisions will…', ['Roughly double', 'Increase many times over', 'Stay the same'], i => { pred = i; G.check(); });
      const ch = chamber(st, { paused: true });
      SimLab.panel(st, [{ k: 'T', label: 'Temperature', min: 200, max: 800, step: 50, fmt: v => v + ' K' }, { btns: [{ id: 'go', label: 'Run 10 s trial', cls: 'primary', fn: () => { if (pred == null) { K.msg('Predict first.', 'bad', 1800); return; } ch.pause(false); const T = st.T; trial(ch, 10, g => { res[T] = g.succ; ch.pause(true); XLab.note(`${T} K: ${g.coll} collisions, ${g.succ} successful in 10 s.`); K.msg(`${T} K: ${g.succ} successful collisions in 10 s`, 'ok', 3000); G.check(); }); } }] }], () => ch.reset());
      const G = SimLab.goals(R, { name: 'Temperature', items: () => [[pred != null, 'Predict'], [res[300] != null, 'Trial at 300 K'], [res[600] != null, 'Trial at 600 K']],
        q: { q: 'Doubling the temperature barely doubled the collisions, yet the successful ones went up much more. Why?', a: ['A much bigger fraction of collisions now have at least the activation energy', 'Hot particles are bigger', 'The activation energy got smaller', 'Hot particles always have the right orientation'], c: 0, e: 'Faster particles collide a little more often, but the big effect is energy: the fraction of collisions with energy ≥ Ea grows roughly as e^(−Ea/RT), so it rises steeply with temperature (the shaded tail of the curve).' } });
      const o = G.check; G.check = () => { o(); if (res[300] != null && res[600] != null && pred != null && !G._n) { G._n = 1; if (pred !== 1) R.mistake('Temperature prediction', 'Successful collisions rise steeply (several times) because many more have enough energy.'); } }; },
    conc: R => { const st = fresh({ T: 400, N: 15 }), res = {};
      const ch = chamber(st, { paused: true });
      SimLab.panel(st, [{ k: 'N', label: 'Particles of each kind', min: 5, max: 50, step: 5, fmt: v => v + ' A + ' + v + ' B' }, { btns: [{ id: 'go', label: 'Run 10 s trial', cls: 'primary', fn: () => { ch.pause(false); const N = st.N; trial(ch, 10, g => { res[N] = g.coll; ch.pause(true); XLab.note(`${N} of each: ${g.coll} A–B collisions, ${g.succ} successful in 10 s.`); K.msg(`${N} of each: ${g.coll} collisions in 10 s`, 'ok', 3000); G.check(); }); } }] }], () => ch.reset());
      const G = SimLab.goals(R, { name: 'Concentration', items: () => [[res[15] != null, 'Trial with 15 of each'], [res[45] != null, 'Trial with 45 of each']],
        q: { q: 'Tripling both concentrations multiplied the A–B collisions by about…', a: ['9 (3 × 3), because collisions depend on both concentrations', '3', '1 (no change)', '6'], c: 0, e: 'The collision frequency is proportional to [A] × [B]. Three times more of each gives about 3 × 3 = 9 times as many A–B collisions, so the rate rises too (the rate law rate = k[A][B]).' } }); },
    cat: R => { const st = fresh({ T: 350, N: 30, cat: 'off' }), res = {};
      const ch = chamber(st, { paused: true });
      const box = LabUI.html(`<div class="pl-pred"><label>Catalyst</label><div class="sim-pick"><button class="btn sm on" data-ct="off">Off</button><button class="btn sm" data-ct="on">On</button></div></div>`);
      $$('[data-ct]', box).forEach(b => b.onclick = () => { st.cat = b.dataset.ct; $$('[data-ct]', box).forEach(x => x.classList.toggle('on', x === b)); ch.reset(); ch.pause(true); });
      SimLab.panel(st, [{ btns: [{ id: 'go', label: 'Run 10 s trial', cls: 'primary', fn: () => { ch.pause(false); const c = st.cat; trial(ch, 10, g => { res[c] = g.coll ? g.succ / g.coll * 100 : 0; ch.pause(true); XLab.note(`Catalyst ${c}: ${f(res[c], 1)} % of collisions successful.`); K.msg(`Catalyst ${c}: ${f(res[c], 1)} % successful`, 'ok', 3000); G.check(); }); } }] }]);
      const G = SimLab.goals(R, { name: 'Catalyst', items: () => [[res.off != null, 'Trial without catalyst'], [res.on != null, 'Trial with catalyst']],
        q: { q: 'How does the catalyst speed up the reaction?', a: ['It provides a path with a lower activation energy, so more collisions succeed', 'It heats the particles', 'It adds more particles', 'It changes ΔH'], c: 0, e: 'A catalyst offers an alternative mechanism with a <b>lower Ea</b>, so a larger fraction of collisions have enough energy. It is not used up, and the energies of the reactants and products (ΔH) don’t change.' } }); }
  };
  const quiz = [
    { q: 'Why does food keep longer in a fridge?', a: ['Lower temperature means far fewer collisions with enough energy, so spoilage reactions slow down', 'Cold kills all bacteria', 'Cold air has no oxygen', 'Reactions stop completely below 10 °C'], c: 0, e: 'Decay reactions (many enzyme-catalyzed) slow sharply as fewer particles reach the activation energy.' },
    { q: 'Powdered sugar can burn explosively, but a sugar cube burns slowly. Why?', a: ['Larger surface area gives many more collisions with oxygen', 'Powder has a lower activation energy', 'Powder is hotter', 'Cubes contain no sugar'], c: 0, e: 'Surface area works like concentration: more exposed particles, more collisions per second.' },
    { q: 'Raising the temperature by 10 °C often roughly doubles a reaction rate. This is mainly because…', a: ['Many more collisions exceed the activation energy', 'Particles get heavier', 'Twice as many collisions happen', 'ΔH doubles'], c: 0, e: 'The collision frequency rises only a few percent; the fraction with energy ≥ Ea roughly doubles.' },
    { q: 'On an energy diagram, the activation energy is measured from…', a: ['The reactants to the top of the hill', 'The reactants to the products', 'The products to the top of the hill only', 'Zero to the products'], c: 0, e: 'Ea is the energy barrier between reactants and the transition state. Reactants to products is ΔH.' },
    { q: 'Which change does NOT increase the rate of A + B → AB?', a: ['Removing the catalyst', 'Raising the temperature', 'Increasing [A]', 'Grinding solid B into powder'], c: 0, e: 'Removing a catalyst raises the activation energy again, so the rate falls.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Set the conditions, then run a 10-second trial. Each trial is <b>recorded automatically</b>.',
    fresh: () => fresh(),
    vars: [{ k: 'T', label: 'Temperature', short: 'Temp.', min: 200, max: 800, step: 50, unit: 'K', d: 0, fmt: v => v + ' K' }, { k: 'N', label: 'Particles of each kind', short: 'N each', min: 5, max: 50, step: 5, unit: '', d: 0, fmt: v => v + ' + ' + v }, { k: 'Ea', label: 'Activation energy', short: 'Ea', min: 4, max: 24, step: 1, unit: 'kJ/mol', d: 0, fmt: v => v + ' kJ/mol' }],
    cats: [{ k: 'cat', label: 'Catalyst', opts: [['off', 'Off'], ['on', 'On']] }],
    measures: [{ k: 'coll', label: 'A–B collisions in 10 s', short: 'Collisions', unit: '', d: 0 }, { k: 'succ', label: 'Successful collisions in 10 s', short: 'Successful', unit: '', d: 0 }, { k: 'pct', label: 'Percent successful', short: '% success', unit: '%', d: 1 }],
    noRecord: true,
    ideas: [['How does temperature affect the number of successful collisions?', 'T', 'succ'], ['How does concentration affect the number of collisions?', 'N', 'coll'], ['How does activation energy affect the percent of successful collisions?', 'Ea', 'pct']],
    expect(x, y) {
      if (x === 'T' && y === 'coll') return { t: 'up', why: 'Faster particles meet more often, but only slightly: collision frequency rises with √T.' };
      if (x === 'T') return { t: 'up', why: 'The fraction of collisions with energy ≥ Ea rises roughly as e^(−Ea/RT), so successful collisions climb steeply with temperature (an upward curve, not a straight line). As reactants are used up in a long trial, the count can level off.' };
      if (x === 'N') return { t: 'up', why: 'Collisions depend on [A] × [B], so doubling both concentrations gives about four times as many A–B collisions (an upward curve).' };
      if (x === 'Ea' && y === 'coll') return { t: 'flat', why: 'Activation energy doesn’t change how often particles collide, only how many succeed.' };
      if (x === 'Ea') return { t: 'down', why: 'A higher barrier means fewer collisions have enough energy. The fraction falls exponentially: ½·e^(−Ea/RT).' };
      return null;
    },
    setup(F) {
      const ch = chamber(F.st, { paused: true }); F.onChange(() => { ch.reset(); ch.pause(true); });
      const b = LabUI.html('<div class="row sim-btns"><button class="btn sm primary" id="clGo">Run 10 s trial</button></div>');
      $('#clGo', b).onclick = () => { ch.pause(false); trial(ch, 10, g => { ch.pause(true); F.add({ coll: g.coll, succ: g.succ, pct: g.coll ? g.succ / g.coll * 100 : 0 }); }); };
    }
  };

  /* ═════ Game: Reaction Accelerator ═════ */
  function reactor(G, o) {
    const st = fresh(Object.assign({ T: 300, N: 25, Ea: o.Ea || 9 }, o.start)); let left = o.time, cash = o.cash, band = 0, dmg = 0, lastN = st.N;
    const ch = chamber(st, { extra: g => { const r = g.made; return `<g transform="translate(30 18)"><rect width="600" height="40" rx="10" fill="#0b1020" fill-opacity=".85"/><text x="14" y="26" font-size="15" font-weight="800" fill="#ffd27a">${o.band ? `Keep the rate between ${o.band[0]} and ${o.band[1]} per s: ${f(band, 1)} / ${o.hold} s` : `Products: ${r} / ${o.target}`}${o.maxT ? ` · product breaks down above ${o.maxT} K` : ''}</text><text x="586" y="26" font-size="14" font-weight="800" fill="#fff" text-anchor="end">⏱ ${Math.max(0, Math.ceil(left))} s · 🪙 ${Math.round(cash)}</text></g>`; },
      tick: g => { if (G.over()) return; },
    });
    const items = [{ k: 'T', label: 'Heater (costs more when hotter)', min: 200, max: 800, step: 25, fmt: v => v + ' K' }, { k: 'N', label: 'Reactant loaded (resets the chamber)', min: 5, max: 50, step: 5, fmt: v => v + ' of each' }];
    G.panel(st, items.concat([{ btns: [{ id: 'cat', label: `⚙ Catalyst (${o.catCost} coins)`, fn: () => { if (st.cat === 'on') return; if (cash < o.catCost) { K.msg('Not enough coins.', 'bad', 1500); return; } cash -= o.catCost; st.cat = 'on'; SND.pop(); K.msg('Catalyst added: lower activation energy.', 'ok', 2000); } }] }]), k => { if (k === 'N') { cash -= Math.max(0, st.N - lastN) * 1.5; lastN = st.N; ch.reset(); } });
    let last = performance.now(), hist = [];
    K.loop(() => { if (G.over()) return; const now = performance.now(), dt = Math.min(.05, (now - last) / 1000); last = now; left -= dt; cash -= Math.max(0, st.T - 300) * .004 * dt;
      const g = ch.g(); hist.push([g.t, g.made]); while (hist.length && hist[0][0] < g.t - 4) hist.shift(); const rate = hist.length > 1 ? (hist[hist.length - 1][1] - hist[0][1]) / Math.max(.5, hist[hist.length - 1][0] - hist[0][0]) : 0;
      if (o.maxT && st.T > o.maxT) { dmg += dt; if (dmg > 2) G.lose('The product broke down', `Above ${o.maxT} K the product decomposes. To go faster without heating, raise the <b>concentration</b> (more collisions) or add a <b>catalyst</b> (lower Ea).`); }
      if (o.band) { if (rate >= o.band[0] && rate <= o.band[1]) band += dt; if (rate > o.band[1] * 1.6) G.lose('Runaway reaction!', 'The rate shot far above the safe band. Rate depends on temperature (strongly), concentration and catalysts: make small changes and wait for the rate to settle.'); if (band >= o.hold) G.win(cash > o.cash * .6 ? 3 : 2, cash * 5 + left * 20, 'You held the reaction in the safe band.'); }
      else if (g.made >= o.target) G.win(cash > o.cash * .5 ? 3 : cash > o.cash * .2 ? 2 : 1, cash * 5 + left * 30, `${o.target} products with ${Math.round(left)} s to spare.`);
      if (!G.over() && (left <= 0 || cash <= 0)) G.lose(cash <= 0 ? 'Out of coins' : 'Time’s up', 'Too few successful collisions. Faster particles (temperature), more particles (concentration) and a lower barrier (catalyst) all help; find the cheapest mix.'); });
  }
  const game = {
    title: 'Reaction Accelerator', intro: 'Run the reactor to order. Heating costs coins every second, loading reactant costs coins, and the catalyst is expensive. Use collision theory to find the cheapest way.',
    cover: () => `<rect width="1000" height="620" fill="#101a2e"/>${labThumb('collision').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Reaction Accelerator</text><text x="500" y="540" font-size="18" fill="#9fc6e0" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Warm-up', goal: 'Make <b>15 products</b> in 40 s.', hint: 'At 300 K almost no collisions have enough energy. Heat it up.', setup: G => reactor(G, { target: 15, time: 40, cash: 100, catCost: 60, Ea: 12 }) },
      { name: 'Fragile product', goal: 'Make <b>15 products</b> in 40 s, but the product breaks down above <b>450 K</b>.', hint: 'You can’t just heat it. A catalyst lowers Ea; more reactant means more collisions.', setup: G => reactor(G, { target: 15, time: 40, cash: 120, catCost: 40, maxT: 450, Ea: 14 }) },
      { name: 'Steady does it', goal: 'An exothermic reaction can run away. Keep the rate between <b>0.6 and 1.4 products per second</b> for 12 s in total.', hint: 'Small temperature changes make big rate changes. Change one thing at a time and wait a few seconds.', setup: G => reactor(G, { band: [.6, 1.4], hold: 12, time: 60, cash: 150, catCost: 50, Ea: 12, start: { N: 40, T: 250 } }) }
    ]
  };
  const finale = () => chamber(fresh({ T: 500, N: 30 }));
  XLab.define({ id: 'collision', guided: { steps, S, quiz, finale, finaleMsg: 'Reactions complete. Now check your thinking.', summary: () => 'You saw that only collisions with enough energy and the right orientation react, measured the steep effect of temperature, showed that concentration raises collision frequency, and lowered the activation energy with a catalyst.' }, free, game });
})();
