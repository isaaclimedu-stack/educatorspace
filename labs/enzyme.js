/* ═══════════ HS Biology: "Enzyme Rush: Reaction Factory" ═══════════
   Model (one reaction vat; concentrations in mM, time in s):
     each enzyme: substrate it fits, optimum pH, the temperature where it starts to denature (T₀), and Km
     rate v = kcat·E·S/(Km′ + S) · fT · fpH · (1 − d) · inhibitor
       fT  = 2^((T − Tref)/10)              collisions and enzyme speed rise with temperature (Q₁₀ = 2)
       fpH = exp(−((pH − pHopt)/1.4)²)       wrong pH changes charges in the active site
       d   = fraction denatured: dd/dt = 0.015·e^((T − T₀)/2.6)·(1 − d) once T > T₀ − 2  → heat damage is permanent
       competitive inhibitor:    Km′ = 4·Km  (it blocks the active site; lots of substrate can outcompete it)
       noncompetitive inhibitor: ×0.35       (it changes the enzyme’s shape elsewhere; more substrate doesn’t help)
     S is used up as product P forms. A 30 s assay reports P and the average rate P/30 (as mM/min). */
(() => {
  const K = Kit, f = SimLab.f;
  const ENZ = {
    amylase: { n: 'Amylase', sub: 'starch', prod: 'maltose', pH: 7, T0: 40, Tref: 37, Km: 5, col: '#7c5cff', shape: 'tri' },
    pepsin: { n: 'Pepsin', sub: 'protein', prod: 'peptides', pH: 2, T0: 40, Tref: 37, Km: 5, col: '#ff7a59', shape: 'sq' },
    catalase: { n: 'Catalase', sub: 'hydrogen peroxide', prod: 'water + O₂', pH: 7, T0: 40, Tref: 37, Km: 8, col: '#21b3a4', shape: 'dot' },
    thermase: { n: 'Thermase (from hot-spring bacteria)', sub: 'starch', prod: 'maltose', pH: 7, T0: 80, Tref: 72, Km: 5, col: '#e0a21b', shape: 'tri' }
  };
  const SUBS = { starch: 'tri', protein: 'sq', 'hydrogen peroxide': 'dot' };
  const fresh = o => Object.assign({ enz: 'amylase', sub: 'starch', T: 37, pH: 7, E: 5, S: 20, inh: 'none' }, o || {});
  const vat = st => ({ st, P: 0, S: st.S, d: 0, t: 0, run: false, hist: [0] });
  function rate(v) {
    const s = v.st, e = ENZ[s.enz]; if (e.sub !== s.sub) return 0;
    const Km = e.Km * (s.inh === 'competitive' ? 4 : 1), fT = 2 ** ((s.T - e.Tref) / 10), fpH = Math.exp(-(((s.pH - e.pH) / 1.4) ** 2));
    return .05 * s.E * v.S / (Km + v.S) * fT * fpH * (1 - v.d) * (s.inh === 'noncompetitive' ? .35 : 1);
  }
  function tick(v, dt) {
    const s = v.st, e = ENZ[s.enz]; v.t += dt;
    if (s.T > e.T0 - 2) v.d += .015 * Math.exp((s.T - e.T0) / 2.6) * (1 - v.d) * dt; v.d = Math.min(1, v.d);
    const r = rate(v), dp = Math.min(v.S, r * dt); v.P += dp; v.S -= dp; return r;
  }
  /* the factory vat: enzymes (with active sites), substrate pieces drifting in, products drifting out */
  function draw(v, T, o = {}) {
    const s = v.st, e = ENZ[s.enz], r = rate(v), fit = e.sub === s.sub, nE = Math.min(14, Math.max(1, Math.round(s.E * 1.4))), dn = v.d;
    let g = `<rect width="1000" height="620" fill="#241c3a"/><rect y="470" width="1000" height="150" fill="#30264d"/><rect y="470" width="1000" height="14" fill="#4b3d78"/>
      ${Array.from({ length: 12 }, (_, i) => `<circle cx="${i * 90 + 30}" cy="540" r="16" fill="#241c3a" stroke="#6f61a3" stroke-width="3"/><line x1="${i * 90 + 30}" y1="524" x2="${i * 90 + 30 + Math.cos(T * 3) * 14}" y2="${540 + Math.sin(T * 3) * 14}" stroke="#6f61a3" stroke-width="3"/>`).join('')}
      <rect x="40" y="70" width="560" height="380" rx="26" fill="${s.pH < 5 ? '#4a2b3a' : s.pH > 9 ? '#2b3a4a' : '#2d3550'}" stroke="#8a7bb5" stroke-width="6"/>
      <rect x="40" y="70" width="560" height="380" rx="26" fill="${s.T > e.T0 ? '#ff5a3c' : s.T < 15 ? '#5ab0ff' : 'transparent'}" opacity="${s.T > e.T0 ? Math.min(.3, (s.T - e.T0) / 40) : s.T < 15 ? (15 - s.T) / 60 : 0}"/>`;
    const shp = (k, x, y, sz, c) => k === 'tri' ? `<path d="M${x - sz},${y + sz * .8} L${x + sz},${y + sz * .8} L${x},${y - sz}Z" fill="${c}"/>` : k === 'sq' ? `<rect x="${x - sz * .8}" y="${y - sz * .8}" width="${sz * 1.6}" height="${sz * 1.6}" rx="2" fill="${c}"/>` : `<circle cx="${x}" cy="${y}" r="${sz * .85}" fill="${c}"/>`;
    /* substrate: count shows concentration */
    const nS = Math.min(40, Math.round(v.S * 1.2)), sk = SUBS[s.sub];
    for (let i = 0; i < nS; i++) { const h = SimLab.hash(i + 3), x = 70 + ((h * 500 + T * (20 + h * 30) * (i % 2 ? 1 : -1)) % 500 + 500) % 500, y = 100 + ((SimLab.hash(i * 7) * 320 + Math.sin(T + i) * 20) % 320 + 320) % 320; g += shp(sk, x, y, 9, '#ffd27a'); }
    /* products */
    const nP = Math.min(40, Math.round(v.P * 1.2));
    for (let i = 0; i < nP; i++) { const x = 70 + SimLab.hash(i * 3 + 11) * 500, y = 100 + ((SimLab.hash(i + 99) * 320 - T * 18 * (1 + SimLab.hash(i))) % 320 + 320) % 320; g += `<g opacity=".9">${shp(sk, x - 5, y, 5, '#7ee0a1')}${shp(sk, x + 6, y + 2, 5, '#7ee0a1')}</g>`; }
    /* enzymes: Pac-Man-like proteins whose mouth (active site) matches one substrate shape */
    for (let i = 0; i < nE; i++) { const cx = 110 + (i % 5) * 105, cy = 150 + Math.floor(i / 5) * 110 + Math.sin(T * 1.5 + i) * 6, dead = SimLab.hash(i * 13) < dn;
      const ph = (T * Math.max(.05, r / Math.max(.001, s.E) * 6) + i * .37) % 1, busy = !dead && fit && r > .002 && ph < .5;
      if (dead) g += `<path d="M${cx - 30},${cy} q10,-30 22,-4 t20,6 t14,-18 t-6,30 t-30,4 t-22,-16" fill="none" stroke="#8a8aa0" stroke-width="6" stroke-linecap="round"/>`;
      else { g += `<path d="M${cx},${cy} L${cx + 34},${cy - 14} A36,36 0 1,0 ${cx + 34},${cy + 14}Z" fill="${e.col}" stroke="#fff" stroke-opacity=".5" stroke-width="2"/><circle cx="${cx - 8}" cy="${cy - 16}" r="4" fill="#fff"/>`;
        g += e.shape === 'tri' ? `<path d="M${cx + 8},${cy} L${cx + 34},${cy - 13} L${cx + 34},${cy + 13}Z" fill="#241c3a"/>` : e.shape === 'sq' ? `<rect x="${cx + 10}" y="${cy - 11}" width="26" height="22" fill="#241c3a"/>` : `<circle cx="${cx + 24}" cy="${cy}" r="11" fill="#241c3a"/>`;
        if (busy) g += shp(sk, cx + 22, cy, 9, '#ffd27a'); } }
    if (!fit) g += `<text x="320" y="430" font-size="17" font-weight="800" fill="#ffd27a" text-anchor="middle">✗ ${e.n.split(' (')[0]} doesn’t fit ${s.sub}: wrong active-site shape</text>`;
    g += SimLab.hud(630, 70, 350, [['Enzyme', e.n.split(' (')[0], e.col], ['Substrate', s.sub], ['Temperature', `${f(s.T)} °C`, s.T > e.T0 ? '#ff8a8a' : '#fff'], ['pH', f(s.pH, 1), Math.abs(s.pH - e.pH) > 2 ? '#ff8a8a' : '#fff'], ['Enzyme amount', `${f(s.E, 1)} units`], ['Substrate left', `${f(v.S, 1)} mM`], ['Product made', `${f(v.P, 1)} mM`, '#7ee0a1'], ['Rate now', `${f(r * 60, 1)} mM/min`, '#7ee0a1'], ['Denatured', `${f(dn * 100)} %`, dn > .2 ? '#ff8a8a' : '#a9b6cc'], ['Inhibitor', s.inh]], 'Vat monitor');
    g += SimLab.chart(646, 340, 318, 100, [{ d: v.hist, c: '#7ee0a1', n: 'product (mM)' }], { ymax: Math.max(10, ...v.hist) * 1.1, xs: 31, title: o.title || 'Product over the 30 s assay' });
    return g + (o.extra || '');
  }
  /* a vat scene for guided and free modes: runs 30 s assays at 5× speed */
  function vatScene(st, cfg = {}) {
    const v = vat(st); let T = 0, acc = 0;
    SimLab.stage('', (g, dt) => { T += dt;
      if (v.run) { const sdt = dt * 5; for (let k = 0; k < 4; k++) tick(v, sdt / 4); acc += sdt; while (acc >= 1) { acc -= 1; v.hist.push(v.P); }
        if (v.t >= 30) { v.run = false; SND.ok(); cfg.onEnd && cfg.onEnd(v); } }
      g.innerHTML = draw(v, T, cfg); });
    return { v, go(keepEnzyme) { if (v.run) return; const d = keepEnzyme ? v.d : 0; Object.assign(v, vat(st), { d }); v.run = true; SND.tone(420, .15, 'sine', .05, 640); }, reset() { Object.assign(v, vat(st)); } };
  }

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'fit', name: 'Lock and key', title: 'Hire the right workers', html: 'Each enzyme has an <b>active site</b> with a particular shape. Load each substrate with the enzyme that fits it, and run a 30 s assay for all three.', hint: 'Match the shapes: amylase has a triangle-shaped active site (starch), pepsin a square one (protein), catalase a round one (hydrogen peroxide).' },
    { id: 'temp', name: 'Temperature', title: 'Turn up the heat', html: 'Amylase breaks starch into maltose. Run 30 s assays at <b>four or more</b> temperatures, including one at <b>55 °C or hotter</b>. Then, without adding fresh enzyme, <b>cool the cooked vat back to 37 °C</b> and run it again.', hint: 'Use “Run again with the same enzyme” after the hot run. Denatured enzymes don’t recover.' },
    { id: 'ph', name: 'pH', title: 'The stomach shift', html: 'Pepsin works in your stomach; amylase works in your mouth. Find a pH where <b>pepsin</b> makes at least <b>4 mM</b> of product in 30 s, then a pH where <b>amylase</b> does.', hint: 'Stomach acid is around pH 2. Saliva is close to neutral (pH 7).' },
    { id: 'sat', name: 'Saturation', title: 'More, more, more!', html: 'Run assays with substrate at <b>2, 10, 25 and 50 mM</b> (enzyme stays at 3 units). Then double the enzyme to <b>6 units</b> at 50 mM.', hint: 'When every active site is busy, adding substrate can’t speed things up. Only more enzyme can.' }
  ];
  const sl = { T: { k: 'T', label: 'Temperature', min: 0, max: 80, step: 1, fmt: v => v + ' °C' }, pH: { k: 'pH', label: 'pH', min: 1, max: 13, step: .5, fmt: v => f(v, 1) }, E: { k: 'E', label: 'Enzyme amount', min: 1, max: 10, step: 1, fmt: v => v + ' units' }, S: { k: 'S', label: 'Substrate', min: 0, max: 50, step: 1, fmt: v => v + ' mM' } };
  const pick = (label, opts, st, k, cb) => { const b = LabUI.html(`<div class="pl-pred"><label>${label}</label><div class="sim-pick">${opts.map(([v, t]) => `<button class="btn sm ${st[k] === v ? 'on' : ''}" data-pk="${v}">${t}</button>`).join('')}</div></div>`); $$('[data-pk]', b).forEach(x => x.onclick = () => { st[k] = x.dataset.pk; $$('[data-pk]', b).forEach(y => y.classList.toggle('on', y === x)); cb && cb(); }); return b; };
  const S = {
    fit: R => { const st = fresh({ S: 15 }), done = {}; let tries = 0;
      pick('Substrate in the vat', [['starch', '▲ Starch'], ['protein', '■ Protein'], ['hydrogen peroxide', '● H₂O₂']], st, 'sub', () => A.reset());
      pick('Enzyme', [['amylase', 'Amylase'], ['pepsin', 'Pepsin'], ['catalase', 'Catalase']], st, 'enz', () => A.reset());
      const A = vatScene(st, { onEnd: v => { tries++; if (v.P > 1) { done[st.sub] = 1; XLab.note(`${ENZ[st.enz].n} + ${st.sub}: ${f(v.P, 1)} mM product.`); K.msg(`It fits! ${ENZ[st.enz].n} made ${f(v.P, 1)} mM of ${ENZ[st.enz].prod}.`, 'ok', 3000); } else { K.msg('No product: this enzyme’s active site doesn’t fit that substrate.', 'bad', 3000); if (tries > 5) R.mistake('Enzyme specificity', 'Each enzyme only fits the substrate that matches its active site.'); } G.check(); } });
      st.pH = 7; SimLab.panel(st, [{ html: '<div class="sim-note">For this test the pH is set to suit each enzyme.</div>' }, { btns: [{ id: 'go', label: 'Run 30 s assay', cls: 'primary', fn: () => { st.pH = ENZ[st.enz].pH; A.go(); } }] }]);
      const G = SimLab.goals(R, { name: 'Specificity', items: () => [[done.starch, 'Starch digested'], [done.protein, 'Protein digested'], [done['hydrogen peroxide'], 'Hydrogen peroxide broken down']],
        q: { q: 'Why can’t amylase break down protein?', a: ['Protein doesn’t fit amylase’s active site', 'Amylase is too small', 'Protein is not a molecule', 'Amylase only works in the stomach'], c: 0, e: 'Enzymes are <b>specific</b>: the substrate must fit the shape of the active site (the lock-and-key / induced-fit model).' } }); },
    temp: R => { const st = fresh({ S: 25 }), runs = []; let hot = false, cooled = false;
      const A = vatScene(st, { onEnd: v => { runs.push({ T: st.T, P: v.P, reuse: v.reused }); if (st.T >= 55 && !v.reused) { hot = true; K.msg(`${f(v.d * 100)} % of the enzyme denatured!`, 'bad', 3200); }
          if (v.reused && hot && st.T <= 40) { cooled = true; K.msg(`Cooled back to ${st.T} °C, but only ${f(v.P, 1)} mM: the enzyme stayed denatured.`, 'bad', 4200); }
          XLab.note(`${st.T} °C${v.reused ? ' (same cooked enzyme)' : ''}: ${f(v.P, 1)} mM in 30 s.`); G.check(); },
        extra: '' });
      SimLab.panel(st, [sl.T, { btns: [{ id: 'go', label: 'Run 30 s assay (fresh enzyme)', cls: 'primary', fn: () => { A.go(); A.v.reused = false; } }, { id: 'again', label: 'Run again with the same enzyme', fn: () => { A.go(true); A.v.reused = true; } }] }]);
      const G = SimLab.goals(R, { name: 'Temperature', items: () => [[new Set(runs.filter(r => !r.reuse).map(r => r.T)).size >= 4, `Assays at 4 temperatures (${new Set(runs.filter(r => !r.reuse).map(r => r.T)).size})`], [hot, 'One assay at 55 °C or hotter'], [cooled, 'Cool the cooked enzyme to 37 °C and run it again']],
        q: { q: 'Why didn’t the amylase recover when you cooled it?', a: ['Heat permanently changed the shape of its active site (denaturation)', 'It was used up in the reaction', 'Cold enzymes never work', 'The starch had all turned into maltose'], c: 0, e: 'Heat breaks the weak bonds holding the protein in shape. Once the active site loses its shape, cooling doesn’t restore it: <b>denaturation is permanent</b>. Cold only slows enzymes down, reversibly.' } }); },
    ph: R => { const st = fresh({ enz: 'pepsin', sub: 'protein', pH: 7, S: 20, E: 4 }), ok = {};
      pick('Enzyme (and its substrate)', [['pepsin', 'Pepsin + protein'], ['amylase', 'Amylase + starch']], st, 'enz', () => { st.sub = ENZ[st.enz].sub; A.reset(); });
      const A = vatScene(st, { onEnd: v => { XLab.note(`${ENZ[st.enz].n} at pH ${st.pH}: ${f(v.P, 1)} mM.`); if (v.P >= 4) { ok[st.enz] = st.pH; K.msg(`${ENZ[st.enz].n} works well at pH ${st.pH}.`, 'ok', 2600); } else K.msg(`Only ${f(v.P, 1)} mM. Try a different pH.`, 'bad', 2400); G.check(); } });
      SimLab.panel(st, [sl.pH, { btns: [{ id: 'go', label: 'Run 30 s assay', cls: 'primary', fn: () => A.go() }] }], () => A.reset());
      const G = SimLab.goals(R, { name: 'pH', items: () => [[ok.pepsin != null, 'Pepsin working (4 mM or more)'], [ok.amylase != null, 'Amylase working (4 mM or more)']],
        q: { q: 'Swallowed amylase reaches the stomach (pH 2). What happens to it?', a: ['It stops working: the acid changes the charges and shape of its active site', 'It works faster', 'It turns into pepsin', 'It digests the stomach acid'], c: 0, e: 'Every enzyme has an <b>optimum pH</b>. Far from it, H⁺ ions change the charges on amino acids in the active site, so the substrate no longer binds. Pepsin is adapted to the acid stomach; amylase is not.' } }); },
    sat: R => { const st = fresh({ S: 2, E: 3 }), runs = {};
      const A = vatScene(st, { onEnd: v => { const r = v.hist[2] != null ? (v.hist[2] - v.hist[0]) / 2 * 60 : 0; runs[`${st.S}|${st.E}`] = r; XLab.note(`Substrate ${st.S} mM, enzyme ${st.E}: starting rate ${f(r, 1)} mM/min.`); K.msg(`Starting rate: ${f(r, 1)} mM/min`, 'ok', 2400); G.check(); } });
      SimLab.panel(st, [sl.S, sl.E, { btns: [{ id: 'go', label: 'Run 30 s assay', cls: 'primary', fn: () => A.go() }] }], () => A.reset());
      const has = (S, E) => runs[`${S}|${E}`] != null;
      const G = SimLab.goals(R, { name: 'Saturation', items: () => [[has(2, 3), 'Substrate 2 mM'], [has(10, 3), 'Substrate 10 mM'], [has(25, 3), 'Substrate 25 mM'], [has(50, 3), 'Substrate 50 mM'], [has(50, 6), 'Enzyme 6 units at 50 mM']],
        q: { q: 'Going from 25 to 50 mM substrate barely raised the rate, but doubling the enzyme nearly doubled it. Why?', a: ['The active sites were all busy (saturated); more enzyme means more active sites', 'The substrate was used up', 'The enzyme denatured at high substrate', 'More substrate always slows reactions'], c: 0, e: 'At high substrate every active site is occupied, so the enzyme is <b>saturated</b> and the rate reaches its maximum (Vmax). Only adding more enzyme, and so more active sites, raises it.' } }); }
  };
  const quiz = [
    { q: 'What does an enzyme do to a reaction?', a: ['Lowers the activation energy so it goes faster', 'Raises the activation energy', 'Changes which products form', 'Gets used up as a reactant'], c: 0, e: 'Enzymes are biological catalysts: they lower the activation energy and are not used up.' },
    { q: 'A competitive inhibitor’s effect can be overcome by…', a: ['Adding much more substrate', 'Raising the temperature to 70 °C', 'Removing the substrate', 'Lowering the enzyme concentration'], c: 0, e: 'A competitive inhibitor competes for the active site. With lots of substrate, the substrate usually wins.' },
    { q: 'A fever of 42 °C is dangerous partly because…', a: ['Some body enzymes begin to denature', 'Enzymes stop moving completely', 'pH falls to 2', 'Substrates become too small'], c: 0, e: 'Human enzymes work best near 37 °C. Well above that, their shapes start to change.' },
    { q: 'Which graph shape shows rate against substrate concentration (enzyme amount fixed)?', a: ['Rises, then levels off', 'A straight line forever', 'Rises to a peak, then falls', 'Falls steadily'], c: 0, e: 'The rate rises until the active sites are saturated, then levels off at Vmax.' },
    { q: 'Enzymes are made of…', a: ['Proteins (chains of amino acids folded into a shape)', 'Lipids', 'Carbohydrates', 'DNA'], c: 0, e: 'Almost all enzymes are proteins. Their folded 3-D shape forms the active site.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Choose an enzyme and its conditions, then run 30-second assays. Each finished assay is <b>recorded automatically</b>.',
    fresh: () => fresh(),
    vars: [Object.assign({ short: 'Temp.', unit: '°C', d: 0 }, sl.T), Object.assign({ unit: '', d: 1 }, sl.pH), Object.assign({ short: 'Enzyme', unit: 'units', d: 0 }, sl.E), Object.assign({ short: 'Substrate', unit: 'mM', d: 0 }, sl.S)],
    cats: [{ k: 'enz', label: 'Enzyme', opts: [['amylase', 'Amylase'], ['pepsin', 'Pepsin'], ['catalase', 'Catalase'], ['thermase', 'Thermase']] }, { k: 'inh', label: 'Inhibitor', opts: [['none', 'None'], ['competitive', 'Competitive'], ['noncompetitive', 'Noncompetitive']] }],
    measures: [{ k: 'P', label: 'Product after 30 s', short: 'Product', unit: 'mM', d: 1 }, { k: 'rate', label: 'Starting rate', short: 'Start rate', unit: 'mM/min', d: 1 }, { k: 'dn', label: 'Enzyme denatured', short: 'Denatured', unit: '%', d: 0 }],
    noRecord: true,
    ideas: [['How does temperature affect amylase activity?', 'T', 'P'], ['What is pepsin’s optimum pH?', 'pH', 'P'], ['How does substrate concentration affect the rate?', 'S', 'rate'], ['How does enzyme concentration affect the rate?', 'E', 'rate'], ['How does temperature affect how much enzyme denatures?', 'T', 'dn']],
    expect(x, y) {
      if (x === 'T' && y === 'dn') return { t: 'up', why: 'Above about 38 °C (80 °C for thermase) heat starts breaking the bonds that hold the enzyme’s shape. The hotter it gets, the faster it denatures.' };
      if (x === 'T') return { t: 'peak', why: 'Warmer particles collide more often and with more energy, so the rate rises (about 2× per 10 °C). Past the optimum (around 37–40 °C for human enzymes, about 75 °C for thermase from hot-spring bacteria) the enzyme denatures and the rate crashes.' };
      if (x === 'pH') return { t: 'peak', why: 'Each enzyme has an optimum pH: about 2 for pepsin (stomach) and about 7 for amylase and catalase. Away from it, H⁺ or OH⁻ ions change the charges in the active site.' };
      if (x === 'S') return { t: 'levels', why: 'More substrate means more enzyme–substrate collisions, until every active site is busy (saturation). Then the rate levels off at Vmax. A competitive inhibitor shifts the curve to the right; a noncompetitive one lowers the plateau.' };
      if (x === 'E') return { t: 'up', why: 'With plenty of substrate, the rate is proportional to the number of active sites, so doubling the enzyme doubles the rate.' };
      return null;
    },
    setup(F) {
      const A = vatScene(F.st, { onEnd: v => F.add({ P: v.P, rate: (v.hist[2] - v.hist[0]) / 2 * 60, dn: v.d * 100 }) });
      F.onChange(k => { if (k === 'enz') F.st.sub = ENZ[F.st.enz].sub; A.reset(); });
      F.st.sub = ENZ[F.st.enz].sub;
      const b = LabUI.html('<div class="row sim-btns"><button class="btn sm primary" id="enGo">Run 30 s assay</button><button class="btn sm" id="enRs">Fresh vat</button></div>');
      $('#enGo', b).onclick = () => A.go(); $('#enRs', b).onclick = () => A.reset();
    }
  };

  /* ═════ Game: Reaction Factory. Fill orders before the shift ends; enzyme costs coins, and cooked enzyme must be replaced ═════ */
  function factory(G, o) {
    const st = fresh(Object.assign({ T: 20, pH: 7, E: 2, S: 30 }, o.start)), v = vat(st); let oi = 0, T = 0, cash = o.cash, left = o.time, made = 0;
    const order = () => o.orders[oi];
    const setOrder = () => { const od = order(); st.sub = od.sub; st.inh = od.inh || 'none'; Object.assign(v, vat(st)); v.S = 50; if (od.T != null) { st.T = od.T; PN && PN.sync(); } };
    let PN = null;
    const ePick = LabUI.html(`<div class="pl-pred"><label>Enzyme to load</label><div class="sim-pick">${Object.entries(ENZ).filter(([k]) => o.enz.includes(k)).map(([k, e]) => `<button class="btn sm ${st.enz === k ? 'on' : ''}" data-en="${k}">${e.n.split(' (')[0]}</button>`).join('')}</div></div>`);
    $$('[data-en]', ePick).forEach(b => b.onclick = () => { st.enz = b.dataset.en; v.d = 0; cash -= 10; SND.pop(); $$('[data-en]', ePick).forEach(x => x.classList.toggle('on', x === b)); K.msg('New enzyme loaded (−10 coins)', 'ok', 1400); });
    PN = G.panel(st, [{ k: 'T', label: 'Vat temperature', min: 0, max: 90, step: 1, fmt: x => x + ' °C', lock: o.lockT }, { k: 'pH', label: 'pH', min: 1, max: 13, step: .5, fmt: x => f(x, 1) }, { k: 'E', label: 'Enzyme (0.1 coin per unit per second)', min: 1, max: 10, step: 1, fmt: x => x + ' units' }, { btns: [{ id: 'fresh', label: 'Replace cooked enzyme (−15)', fn: () => { v.d = 0; cash -= 15; SND.pop(); } }] }]);
    setOrder();
    SimLab.stage('', (g, dt) => { T += dt;
      if (!G.over()) { left -= dt; cash -= st.E * .1 * dt; const before = v.P; for (let k = 0; k < 4; k++) tick(v, dt * 2 / 4); made += v.P - before; v.S = 50; if (Math.floor(T) !== Math.floor(T - dt)) { v.hist.push(made); if (v.hist.length > 31) v.hist.shift(); }
        if (made >= order().amt) { made = 0; v.hist = [0]; v.P = 0; oi++; SND.win(); K.sparkle({ x: 320, y: 260 }, 40); if (oi >= o.orders.length) { const st3 = cash / o.cash > .55 ? 3 : cash / o.cash > .3 ? 2 : 1; G.win(st3, cash * 5 + left * 20, `All ${o.orders.length} orders filled with ${Math.round(left)} s and ${Math.round(cash)} coins left.`); } else { setOrder(); K.msg(`Order done! Next: ${order().amt} mM of ${ENZ[Object.keys(ENZ).find(k => ENZ[k].sub === order().sub)].prod}`, 'ok', 3000); } }
        else if (cash <= 0) G.lose('Out of coins', 'Enzyme costs money every second, and cooked (denatured) enzyme must be replaced. Keep the vat near the enzyme’s optimum temperature and pH so a small amount works fast.');
        else if (left <= 0) G.lose('The shift ended', `Too slow. Check three things: the enzyme must <b>fit</b> the substrate, the <b>pH</b> must suit it (pepsin ≈ 2, amylase ≈ 7), and the <b>temperature</b> should be near its optimum without denaturing it.${order().inh === 'competitive' ? ' A competitive inhibitor is in this batch: more substrate or more enzyme helps.' : ''}`); }
      const od = order() || o.orders[o.orders.length - 1];
      g.innerHTML = draw(v, T, { title: 'Product (mM)', extra: `<g transform="translate(40 18)"><rect width="560" height="40" rx="10" fill="#0b1020" fill-opacity=".85"/><text x="14" y="26" font-size="15" font-weight="800" fill="#ffd27a">Order ${Math.min(oi + 1, o.orders.length)}/${o.orders.length}: ${od.amt} mM from ${od.sub}${od.inh ? ' ⚠ contains an inhibitor' : ''}</text><text x="546" y="26" font-size="14" font-weight="800" fill="#fff" text-anchor="end">⏱ ${Math.max(0, Math.ceil(left))} s · 🪙 ${Math.round(cash)}</text></g>
        <g transform="translate(650 510)"><rect x="-12" y="-26" width="342" height="48" rx="8" fill="#0b1020" fill-opacity=".8"/>${SimLab.bar(0, 0, 318, made / od.amt, '#7ee0a1', 'This order', `${f(made, 1)} / ${od.amt} mM`)}</g>` }); });
  }
  const game = {
    title: 'Reaction Factory', intro: 'Customers order products. Load the enzyme that fits the substrate, set the temperature and pH, and fill each order before the shift ends. Enzyme costs coins every second, and cooked enzyme has to be replaced.',
    cover: () => `<rect width="1000" height="620" fill="#241c3a"/>${labThumb('enzyme').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Reaction Factory</text><text x="500" y="540" font-size="18" fill="#c9b8ff" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'First shift', goal: 'One order: <b>12 mM of maltose from starch</b>. The vat starts cold.', hint: 'Amylase fits starch. Warm the vat to about 37 °C at pH 7.', setup: G => factory(G, { cash: 120, time: 70, enz: ['amylase', 'pepsin', 'catalase'], start: { enz: 'pepsin' }, orders: [{ sub: 'starch', amt: 12 }] }) },
      { name: 'Stomach line', goal: 'Digest protein, then break down hydrogen peroxide.', hint: 'Pepsin for protein at pH 2. Catalase for H₂O₂ at pH 7. Changing enzyme costs 10 coins.', setup: G => factory(G, { cash: 140, time: 90, enz: ['amylase', 'pepsin', 'catalase'], orders: [{ sub: 'protein', amt: 10 }, { sub: 'hydrogen peroxide', amt: 10 }] }) },
      { name: 'Sabotage', goal: 'A rival slipped a <b>competitive inhibitor</b> into the starch. Fill two starch orders anyway.', hint: 'A competitive inhibitor blocks active sites. Using more enzyme units helps, and so does keeping conditions at the optimum.', setup: G => factory(G, { cash: 160, time: 90, enz: ['amylase', 'pepsin', 'catalase'], start: { enz: 'amylase', T: 37 }, orders: [{ sub: 'starch', amt: 10, inh: 'competitive' }, { sub: 'starch', amt: 10, inh: 'competitive' }] }) },
      { name: 'Hot line', goal: 'The sterile line runs at <b>75 °C</b> and you can’t change it. Make <b>15 mM of maltose</b>.', hint: 'Human enzymes denature at 75 °C. Use the enzyme from hot-spring bacteria.', setup: G => factory(G, { cash: 140, time: 70, lockT: true, enz: ['amylase', 'pepsin', 'catalase', 'thermase'], start: { enz: 'amylase', T: 75 }, orders: [{ sub: 'starch', amt: 15, T: 75 }] }) }
    ]
  };
  const finale = () => { const st = fresh({ S: 30 }), A = vatScene(st, {}); A.go(); };
  XLab.define({ id: 'enzyme', guided: { steps, S, quiz, finale, finaleMsg: 'The factory is running smoothly. Now check your thinking.', summary: () => 'You showed that enzymes are specific, found the temperature and pH where they work best, saw that heat damage is permanent, and discovered saturation.' }, free, game });
})();
