/* ═══════════ HS Chemistry: "Mole Factory: Stoichiometry Challenge" ═══════════
   Real reactions and molar masses (g/mol). Moles = mass ÷ molar mass. The balanced coefficients give the mole ratio;
   the reactant that makes the least product is limiting, the other is in excess. Theoretical yield = the product
   made if the limiting reactant reacts completely; the factory’s actual yield is a little less (side reactions,
   losses), which gives the percent yield. Mass is conserved: reactants used = products made. */
(() => {
  const K = Kit, f = SimLab.f;
  const MM = { H2: 2.016, O2: 32.00, H2O: 18.02, N2: 28.02, NH3: 17.03, CH4: 16.04, CO2: 44.01, Fe: 55.85, Fe2O3: 159.69, C3H8: 44.10 };
  const NAME = { H2: 'H₂', O2: 'O₂', H2O: 'H₂O', N2: 'N₂', NH3: 'NH₃', CH4: 'CH₄', CO2: 'CO₂', Fe: 'Fe', Fe2O3: 'Fe₂O₃', C3H8: 'C₃H₈' };
  const ATOMS = { H2: { H: 2 }, O2: { O: 2 }, H2O: { H: 2, O: 1 }, N2: { N: 2 }, NH3: { N: 1, H: 3 }, CH4: { C: 1, H: 4 }, CO2: { C: 1, O: 2 }, Fe: { Fe: 1 }, Fe2O3: { Fe: 2, O: 3 }, C3H8: { C: 3, H: 8 } };
  const COL = { H2: '#e8f1ff', O2: '#e5484d', H2O: '#4f8ff7', N2: '#7c5cff', NH3: '#7ee0a1', CH4: '#ffd27a', CO2: '#9aa6b2', Fe: '#8a8f98', Fe2O3: '#c8743a', C3H8: '#ffb347' };
  const RX = {
    water: { n: 'Water', r: ['H2', 'O2'], p: ['H2O'], c: [2, 1, 2] },
    ammonia: { n: 'Ammonia', r: ['N2', 'H2'], p: ['NH3'], c: [1, 3, 2] },
    methane: { n: 'Methane burning', r: ['CH4', 'O2'], p: ['CO2', 'H2O'], c: [1, 2, 1, 2] },
    rust: { n: 'Rusting iron', r: ['Fe', 'O2'], p: ['Fe2O3'], c: [4, 3, 2] },
    propane: { n: 'Propane burning', r: ['C3H8', 'O2'], p: ['CO2', 'H2O'], c: [1, 5, 3, 4] }
  };
  const eqText = (x, c, ph) => x.r.map((s, i) => `${c && c[i] !== 1 ? c[i] : ''}${NAME[s]}`).join(' + ') + ' → ' + x.p.map((s, i) => `${c && c[x.r.length + i] !== 1 ? c[x.r.length + i] : ''}${NAME[s]}`).join(' + ') + (ph || '');
  /* the stoichiometry of a run: masses in, everything out */
  function run(x, mA, mB, eff = 1) {
    const [A, B] = x.r, nA = mA / MM[A], nB = mB / MM[B], ext = Math.min(nA / x.c[0], nB / x.c[1]), lim = nA / x.c[0] <= nB / x.c[1] ? A : B;
    const prods = x.p.map((p, i) => ({ s: p, n: ext * x.c[2 + i], g: ext * x.c[2 + i] * MM[p] }));
    return { nA, nB, ext, lim, ex: lim === A ? B : A, left: lim === A ? (nB - ext * x.c[1]) * MM[B] : (nA - ext * x.c[0]) * MM[A], prods, theo: prods[0].g, actual: prods[0].g * eff };
  }
  /* factory drawing: two hoppers → reactor → product bins; molecule icons show moles; progress p from 0 to 1 */
  function mol(s, x, y, sc = 1) {
    const a = ATOMS[s], parts = []; Object.entries(a).forEach(([el, n]) => { for (let i = 0; i < n; i++) parts.push(el); });
    const ec = { H: '#e8f1ff', O: '#e5484d', N: '#7c5cff', C: '#3a3f4a', Fe: '#8a8f98' }, er = { H: 4.5, O: 7, N: 7, C: 7.5, Fe: 8 };
    return `<g transform="translate(${x} ${y}) scale(${sc})">${parts.map((el, i) => { const ang = i / parts.length * 6.283, rr = parts.length > 1 ? 7 : 0; return `<circle cx="${Math.cos(ang) * rr}" cy="${Math.sin(ang) * rr}" r="${er[el]}" fill="${ec[el]}" stroke="#0005"/>`; }).join('')}</g>`;
  }
  function factory(x, R, p, o = {}) {
    let g = `<rect width="1000" height="620" fill="#2b2f3a"/><rect y="470" width="1000" height="150" fill="#353a47"/><rect y="470" width="1000" height="16" fill="#4a5060"/>${Array.from({ length: 13 }, (_, i) => `<circle cx="${i * 80 + 20}" cy="478" r="7" fill="#2b2f3a" stroke="#7d8597" stroke-width="2"/>`).join('')}`;
    const [A, B] = x.r, per = o.per || .25;
    [[A, R.nA - R.ext * x.c[0] * p, 40], [B, R.nB - R.ext * x.c[1] * p, 210]].forEach(([s, n, X]) => { const cnt = Math.min(36, Math.round(n / per));
      g += `<path d="M${X},60 h140 l-30,110 h-80z" fill="#3e4554" stroke="#9aa8b8" stroke-width="3"/><text x="${X + 70}" y="50" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">${NAME[s]}: ${f(n * MM[s], 1)} g</text><text x="${X + 70}" y="190" font-size="12" fill="#a9b6cc" text-anchor="middle">${f(n, 2)} mol</text>`;
      for (let i = 0; i < cnt; i++) g += mol(s, X + 28 + (i % 6) * 17, 78 + Math.floor(i / 6) * 15, .7); });
    g += `<g transform="translate(400 150)"><rect width="160" height="200" rx="20" fill="#5a6270" stroke="#9aa8b8" stroke-width="4"/><text x="80" y="30" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">Reactor</text>${p > 0 && p < 1 ? Array.from({ length: 5 }, (_, i) => `<circle cx="${40 + i * 20}" cy="${120 + Math.sin(performance.now() / 150 + i) * 20}" r="7" fill="#ffd27a" opacity=".7"/>`).join('') : ''}</g>
      <path d="M180,170 L400,230 M350,170 L400,250" stroke="#7d8597" stroke-width="10"/><path d="M560,250 H640" stroke="#7d8597" stroke-width="10"/>`;
    R.prods.forEach((pr, i) => { const n = pr.n * p * (i === 0 && o.eff ? o.eff : 1), cnt = Math.min(36, Math.round(n / per)), X = 640 + i * 175;
      g += `<rect x="${X}" y="270" width="150" height="190" rx="12" fill="#3e4554" stroke="#9aa8b8" stroke-width="3"/><text x="${X + 75}" y="262" font-size="15" font-weight="800" fill="#7ee0a1" text-anchor="middle">${NAME[pr.s]}: ${f(n * MM[pr.s], 1)} g</text><text x="${X + 75}" y="478" font-size="12" fill="#a9b6cc" text-anchor="middle">${f(n, 2)} mol</text>`;
      for (let k = 0; k < cnt; k++) g += mol(pr.s, X + 20 + (k % 6) * 22, 440 - Math.floor(k / 6) * 26, .8); });
    g += `<g transform="translate(40 520)"><rect width="920" height="70" rx="12" fill="#0b1020" fill-opacity=".8"/><text x="460" y="30" font-size="20" font-weight="800" fill="#fff" text-anchor="middle">${o.eq || eqText(x, x.c)}</text>
      <text x="460" y="56" font-size="13" fill="#ffd27a" text-anchor="middle">${p >= 1 ? `Limiting reactant: ${NAME[R.lim]} · ${NAME[R.ex]} left over: ${f(R.left, 1)} g · mass in ${f(R.nA * MM[A] + R.nB * MM[B], 1)} g = mass out ${f(R.prods.reduce((a, q) => a + q.g, 0) + R.left, 1)} g` : o.sub || ''}</text></g>`;
    return g + (o.extra || '');
  }
  function plant(x0, mass, o = {}) {
    const X = () => o.xf ? o.xf() : x0;
    let p = 0, running = false, R = run(X(), mass.a, mass.b, o.eff || 1);
    SimLab.stage('', (g, dt) => { if (running) { p = Math.min(1, p + dt / 2.5); if (p >= 1) { running = false; SND.ok(); o.onEnd && o.onEnd(R); } } else if (!o.keep && p === 0) R = run(X(), mass.a, mass.b, o.eff || 1); g.innerHTML = factory(X(), R, p, Object.assign({}, o, { eq: o.eqFn ? o.eqFn() : undefined, extra: o.extra ? o.extra(R) : '' })); });
    return { go() { R = run(X(), mass.a, mass.b, o.eff || 1); p = 0; running = true; SND.tone(380, .2, 'square', .04, 520); }, reset() { p = 0; running = false; }, R: () => R };
  }
  /* coefficient balancer in the sheet */
  function balancer(x, onOk, label) {
    const sp = x.r.concat(x.p), co = sp.map(() => 1), box = LabUI.html('');
    const count = side => { const t = {}; side.forEach(i => Object.entries(ATOMS[sp[i]]).forEach(([el, n]) => t[el] = (t[el] || 0) + n * co[i])); return t; };
    const draw = () => { const L = count(x.r.map((_, i) => i)), Rt = count(x.p.map((_, i) => x.r.length + i)), els = [...new Set(Object.keys(L).concat(Object.keys(Rt)))];
      box.innerHTML = `<div class="pl-lab">${label || 'Balance the equation'}</div><div class="sim-pick" style="align-items:center">${sp.map((s, i) => `${i === x.r.length ? '<b style="font-size:18px">→</b>' : i ? '<b>+</b>' : ''}<span style="display:inline-flex;align-items:center;gap:2px"><button class="btn sm" data-cd="${i}" aria-label="less">−</button><b style="min-width:16px;text-align:center;font-family:var(--f-mono)">${co[i]}</b><button class="btn sm" data-cu="${i}" aria-label="more">+</button>${NAME[s]}</span>`).join(' ')}</div>
        <table class="xl-tbl" style="margin-top:6px"><thead><tr><th>Atom</th><th>Left</th><th>Right</th></tr></thead><tbody>${els.map(e => `<tr><td>${e}</td><td>${L[e] || 0}</td><td style="color:${(L[e] || 0) === (Rt[e] || 0) ? 'var(--ok)' : 'var(--warn)'}">${Rt[e] || 0}</td></tr>`).join('')}</tbody></table>`;
      $$('[data-cu]', box).forEach(b => b.onclick = () => { co[+b.dataset.cu] = Math.min(9, co[+b.dataset.cu] + 1); SND.tick(); draw(); chk(); });
      $$('[data-cd]', box).forEach(b => b.onclick = () => { co[+b.dataset.cd] = Math.max(1, co[+b.dataset.cd] - 1); SND.tick(); draw(); chk(); }); };
    const chk = () => { const L = count(x.r.map((_, i) => i)), Rt = count(x.p.map((_, i) => x.r.length + i)); const ok = Object.keys(L).every(e => L[e] === Rt[e]) && Object.keys(Rt).every(e => L[e] === Rt[e]); const g = co.reduce((a, b) => { const gg = (m, n) => n ? gg(n, m % n) : m; return gg(a, b); }); if (ok && g === 1) onOk(co.slice()); };
    draw(); return { co };
  }

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'bal', name: 'Balancing', title: 'Balance the books', html: 'Atoms are never created or destroyed. Use the + and − buttons to <b>balance</b> both equations (smallest whole numbers).', hint: 'Change only coefficients, never subscripts. For water: 2 H₂O needs 2 O atoms, so 1 O₂, and 4 H atoms, so 2 H₂.' },
    { id: 'mole', name: 'Moles', title: 'Count by weighing', html: 'The factory loads <b>8.0 g of H₂</b> and <b>32.0 g of O₂</b>. Convert each mass to <b>moles</b> (H₂ = 2.016 g/mol, O₂ = 32.00 g/mol).', hint: 'moles = mass ÷ molar mass.' },
    { id: 'lim', name: 'Limiting reactant', title: 'Who runs out first?', html: '2H₂ + O₂ → 2H₂O. With 3.97 mol H₂ and 1.00 mol O₂: decide the <b>limiting reactant</b>, predict the <b>theoretical yield</b> of water in grams (H₂O = 18.02 g/mol), then run the factory.', hint: '1.00 mol O₂ needs 2.00 mol H₂: you have more than that, so O₂ runs out first. 1 mol O₂ makes 2 mol H₂O.' },
    { id: 'pct', name: 'Percent yield', title: 'Real factories', html: 'Real factories never get the theoretical yield. Run the ammonia line: <b>28.0 g N₂</b> with <b>8.0 g H₂</b>. Find the theoretical yield, then the <b>percent yield</b> from the actual mass collected.', hint: 'N₂ is limiting: 1.00 mol N₂ → 2.00 mol NH₃ = 34.06 g. Percent yield = actual ÷ theoretical × 100.' }
  ];
  const S = {
    bal: R => { let w = false, a = false;
      const show = { x: RX.water }; SimLab.stage('', g => { g.innerHTML = `<rect width="1000" height="620" fill="#2b2f3a"/><text x="500" y="160" font-size="22" font-weight="800" fill="#fff" text-anchor="middle">Law of conservation of mass</text><text x="500" y="200" font-size="16" fill="#cfe0f2" text-anchor="middle">Every atom on the left must appear on the right.</text>
        <g transform="translate(260 280)">${mol('H2', 0, 0, 2)}${mol('H2', 70, 0, 2)}<text x="120" y="8" font-size="26" fill="#fff">+</text>${mol('O2', 180, 0, 2)}<text x="250" y="8" font-size="26" fill="#ffd27a">→</text>${mol('H2O', 330, 0, 2)}${mol('H2O', 410, 0, 2)}</g>
        <text x="500" y="420" font-size="18" fill="${w ? '#7ee0a1' : '#a9b6cc'}" text-anchor="middle">${w ? '✓ 2H₂ + O₂ → 2H₂O' : 'H₂ + O₂ → H₂O (unbalanced)'}</text><text x="500" y="460" font-size="18" fill="${a ? '#7ee0a1' : '#a9b6cc'}" text-anchor="middle">${a ? '✓ N₂ + 3H₂ → 2NH₃' : 'N₂ + H₂ → NH₃ (unbalanced)'}</text>`; });
      balancer(RX.water, () => { if (!w) { w = true; XLab.note('Balanced 2H₂ + O₂ → 2H₂O.'); K.msg('Balanced!', 'ok', 1600); G.check(); } }, 'Water: H₂ + O₂ → H₂O');
      balancer(RX.ammonia, () => { if (!a) { a = true; XLab.note('Balanced N₂ + 3H₂ → 2NH₃.'); K.msg('Balanced!', 'ok', 1600); G.check(); } }, 'Ammonia: N₂ + H₂ → NH₃');
      const G = SimLab.goals(R, { name: 'Balancing', items: () => [[w, 'Balance the water equation'], [a, 'Balance the ammonia equation']],
        q: { q: 'Why can’t you balance H₂ + O₂ → H₂O by writing H₂ + O₂ → H₂O₂?', a: ['Changing a subscript makes a different substance (hydrogen peroxide)', 'It is the same thing', 'Subscripts can be changed freely', 'Because O₂ is a gas'], c: 0, e: 'Subscripts define the substance. Only coefficients (how many molecules) can change when balancing.' } }); void show; },
    mole: R => { const x = RX.water, mass = { a: 8, b: 32 }; let h = false, o = false;
      plant(x, mass, { sub: 'Convert grams to moles before you run anything.' });
      LabUI.html(XLab.numIn('mlA', 'Moles of H₂', 'mol') + XLab.numIn('mlB', 'Moles of O₂', 'mol'));
      const chk = (id, want, ok) => { $(`#${id}B`).onclick = () => { const v = +$(`#${id}`).value; if (Math.abs(v - want) <= want * .02) { ok(); K.msg('Correct.', 'ok', 1400); G.check(); } else { R.mistake('Grams to moles', 'moles = grams ÷ molar mass.'); K.msg(v > want * 10 ? 'Divide the mass by the molar mass (don’t multiply).' : 'moles = mass ÷ molar mass.', 'bad', 2400); } }; };
      chk('mlA', 8 / 2.016, () => { h = true; XLab.note('8.0 g H₂ ÷ 2.016 g/mol = 3.97 mol.'); }); chk('mlB', 1, () => { o = true; XLab.note('32.0 g O₂ ÷ 32.00 g/mol = 1.00 mol.'); });
      const G = SimLab.goals(R, { name: 'Moles', items: () => [[h, 'Moles of H₂'], [o, 'Moles of O₂']],
        q: { q: '8 g of H₂ has about 4 times more molecules than 32 g of O₂. How can a smaller mass have more molecules?', a: ['Each H₂ molecule is much lighter (2 g/mol vs 32 g/mol)', 'Hydrogen is denser', 'Grams and moles are the same', 'O₂ molecules are hollow'], c: 0, e: 'A mole is a count (6.02 × 10²³ particles). Lighter molecules mean more of them per gram, so we compare reactants in moles, not grams.' } }); },
    lim: R => { const x = RX.water, mass = { a: 8, b: 32 }; let lim = null, yOk = false, ran = false;
      XLab.choiceIn('Which reactant is limiting?', ['H₂', 'O₂'], i => { lim = i; if (i !== 1) { R.mistake('Limiting reactant', '1.00 mol O₂ needs only 2.00 mol H₂; there are 3.97 mol, so O₂ runs out first.'); K.msg('Compare what you have with what the ratio needs: 1 O₂ uses 2 H₂.', 'bad', 3000); } G.check(); });
      LabUI.html(XLab.numIn('lmY', 'Theoretical yield of H₂O', 'g'));
      $('#lmYB').onclick = () => { const v = +$('#lmY').value; if (Math.abs(v - 36.04) <= 1) { yOk = true; K.msg('Yes: 1.00 mol O₂ → 2.00 mol H₂O = 36.0 g.', 'ok', 2600); XLab.note('Limiting O₂ → theoretical yield 36.0 g H₂O.'); } else { R.mistake('Theoretical yield', 'Use the limiting reactant: 1.00 mol O₂ × (2 H₂O / 1 O₂) × 18.02 g/mol = 36.0 g.'); K.msg('Start from the limiting reactant and use the mole ratio.', 'bad', 2800); } G.check(); };
      const P = plant(x, mass, { keep: true, onEnd: Rr => { ran = true; XLab.note(`Ran it: ${f(Rr.theo, 1)} g water and ${f(Rr.left, 2)} g H₂ left over.`); G.check(); } });
      SimLab.panel({}, [{ btns: [{ id: 'go', label: 'Run the factory', cls: 'primary', fn: () => { if (lim == null || !yOk) { K.msg('Predict the limiting reactant and the yield first.', 'bad', 2200); return; } P.go(); } }] }]);
      const G = SimLab.goals(R, { name: 'Limiting reactant', items: () => [[lim === 1, 'Identify the limiting reactant'], [yOk, 'Predict the theoretical yield'], [ran, 'Run the factory']],
        q: { q: 'Why was there 4 g of H₂ left over?', a: ['Once the O₂ was used up, the leftover H₂ had nothing to react with', 'The reactor was too small', 'H₂ doesn’t react', 'Mass was destroyed'], c: 0, e: 'The limiting reactant decides how much product forms. The excess reactant remains unreacted: 3.97 − 2.00 = 1.97 mol H₂ ≈ 4.0 g.' } }); },
    pct: R => { const x = RX.ammonia, mass = { a: 28, b: 8 }; let ran = false, tOk = false, pOk = false, act = null;
      const P = plant(x, mass, { keep: true, eff: .82, onEnd: Rr => { ran = true; act = Rr.actual; XLab.note(`Ammonia line: collected ${f(act, 1)} g NH₃.`); K.msg(`Collected ${f(act, 1)} g of NH₃`, 'ok', 2600); G.check(); } });
      SimLab.panel({}, [{ btns: [{ id: 'go', label: 'Run the ammonia line', cls: 'primary', fn: () => P.go() }] }]);
      LabUI.html(XLab.numIn('pcT', 'Theoretical yield of NH₃', 'g') + XLab.numIn('pcP', 'Percent yield', '%'));
      $('#pcTB').onclick = () => { const v = +$('#pcT').value; if (Math.abs(v - 34.06) <= .8) { tOk = true; K.msg('Right: 34.1 g.', 'ok', 1600); } else { R.mistake('Theoretical yield', '28.0 g N₂ = 1.00 mol, the limiting reactant → 2.00 mol NH₃ × 17.03 = 34.1 g.'); K.msg('Find the limiting reactant first (1.00 mol N₂ needs 3.00 mol H₂).', 'bad', 2800); } G.check(); };
      $('#pcPB').onclick = () => { if (!ran) { K.msg('Run the line first to get the actual yield.', 'bad', 1800); return; } const want = act / 34.06 * 100, v = +$('#pcP').value; if (Math.abs(v - want) <= 1.5) { pOk = true; XLab.note(`Percent yield = ${f(act, 1)} ÷ 34.1 × 100 = ${f(want)} %.`); K.msg(`${f(want)} %`, 'ok', 1600); } else { R.mistake('Percent yield', 'Percent yield = actual ÷ theoretical × 100.'); K.msg('Actual ÷ theoretical × 100.', 'bad', 2000); } G.check(); };
      const G = SimLab.goals(R, { name: 'Percent yield', items: () => [[ran, 'Run the line'], [tOk, 'Theoretical yield'], [pOk, 'Percent yield']],
        q: { q: 'Which is NOT a reason the actual yield is below 100 %?', a: ['Atoms were destroyed in the reaction', 'Some product is lost when transferring it', 'Side reactions make other products', 'The reaction reaches equilibrium before finishing'], c: 0, e: 'Atoms are always conserved. Yields fall short because of losses, side reactions and reversible reactions that don’t go to completion.' } }); }
  };
  const quiz = [
    { q: 'How many moles of O₂ are needed to burn 2.0 mol of CH₄? (CH₄ + 2O₂ → CO₂ + 2H₂O)', a: ['4.0 mol', '2.0 mol', '1.0 mol', '8.0 mol'], c: 0, e: 'The ratio is 1 CH₄ : 2 O₂, so 2.0 × 2 = 4.0 mol.' },
    { q: 'What is the mass of 0.50 mol of CO₂ (44.01 g/mol)?', a: ['22.0 g', '88.0 g', '44.0 g', '0.011 g'], c: 0, e: 'mass = moles × molar mass = 0.50 × 44.01 = 22.0 g.' },
    { q: 'In 4Fe + 3O₂ → 2Fe₂O₃, you have 4 mol Fe and 4 mol O₂. Which is limiting?', a: ['Fe', 'O₂', 'Neither', 'Fe₂O₃'], c: 0, e: '4 mol Fe needs only 3 mol O₂. O₂ is in excess, so Fe runs out first.' },
    { q: 'Theoretical yield is 50.0 g and you collect 42.5 g. Percent yield?', a: ['85.0 %', '117.6 %', '42.5 %', '7.5 %'], c: 0, e: '42.5 ÷ 50.0 × 100 = 85.0 %.' },
    { q: 'One mole of any substance contains…', a: ['6.02 × 10²³ particles', '1 gram', '22.4 g', '6.02 × 10²³ grams'], c: 0, e: 'The mole is a counting unit: Avogadro’s number of particles.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Pick a reaction, load the reactants by mass, and record what the factory makes. Hold one reactant fixed and change the other.',
    fresh: () => ({ rx: 'water', a: 8, b: 32 }),
    vars: [{ k: 'a', label: 'Mass of reactant 1', short: 'Mass 1', min: 1, max: 100, step: 1, unit: 'g', d: 0, fmt: v => v + ' g' }, { k: 'b', label: 'Mass of reactant 2', short: 'Mass 2', min: 1, max: 200, step: 1, unit: 'g', d: 0, fmt: v => v + ' g' }],
    cats: [{ k: 'rx', label: 'Reaction', opts: Object.entries(RX).map(([k, x]) => [k, x.n]) }],
    measures: [{ k: 'nA', label: 'Moles of reactant 1', short: 'mol 1', unit: 'mol', d: 2 }, { k: 'nB', label: 'Moles of reactant 2', short: 'mol 2', unit: 'mol', d: 2 }, { k: 'y', label: 'Main product made', short: 'Product', unit: 'g', d: 1 }, { k: 'left', label: 'Excess left over', short: 'Excess', unit: 'g', d: 1 }, { k: 'lim', label: 'Limiting reactant', text: true }],
    measure: s => { const r = run(RX[s.rx], s.a, s.b); return { nA: r.nA, nB: r.nB, y: r.theo, left: r.left, lim: NAME[r.lim] }; },
    ideas: [['How does the mass of reactant 1 affect the product, when reactant 2 is fixed?', 'a', 'y'], ['How does the mass of reactant 1 affect the leftover excess?', 'a', 'left']],
    expect(x, y) {
      if (y === 'y') return { t: 'levels', why: 'At first reactant 1 is limiting, so the product rises in proportion to it. Once reactant 2 becomes the limiting one, adding more of reactant 1 makes no more product: the line levels off. The bend is where the mole ratio is exactly right.' };
      if (y === 'left') return { t: 'valley', why: 'With too little reactant 1, reactant 2 is left over; with too much, reactant 1 is left over. Waste is smallest (zero) at the exact mole ratio.' };
      return null;
    },
    setup(F) {
      const mass = { a: F.st.a, b: F.st.b };
      const P = plant(null, mass, { xf: () => RX[F.st.rx], sub: 'Press Record to log the stoichiometry, or Run to watch it.' });
      F.onChange(() => { mass.a = F.st.a; mass.b = F.st.b; P.reset(); });
      const b = LabUI.html('<div class="row sim-btns"><button class="btn sm" id="stRun">Run the factory (watch it)</button></div>'); $('#stRun', b).onclick = () => P.go();
    }
  };

  /* ═════ Game: Order Desk ═════ */
  function order(G, o) {
    const x = RX[o.rx], mass = { a: o.a0, b: o.b0 }; let tries = 0, balanced = !o.balanceFirst;
    const done = R => { tries++; const got = R.theo * (o.eff || 1), off = Math.abs(got - o.want) / o.want;
      if (off <= .03) { const st = R.left <= o.want * .03 ? 3 : R.left <= o.want * .15 ? 2 : 1; G.win(Math.max(1, st - (tries > 1 ? 1 : 0)), 1500 - R.left * 10 - tries * 200, `${f(got, 1)} g delivered with ${f(R.left, 1)} g of ${NAME[R.ex]} wasted. ${o.why}`); }
      else if (tries >= 3) G.lose('Order failed', `You made ${f(got, 1)} g; the order was ${o.want} g. ${o.why}`); else K.msg(`${f(got, 1)} g: the order is ${o.want} g (±3 %). ${3 - tries} tries left.`, 'bad', 3500); };
    const P = plant(x, mass, { onEnd: done, eqFn: () => balanced ? eqText(x, x.c) : eqText(x), extra: () => `<g transform="translate(600 20)"><rect width="380" height="40" rx="10" fill="#0b1020" fill-opacity=".85"/><text x="14" y="26" font-size="15" font-weight="800" fill="#ffd27a">Order: ${o.want} g ${NAME[x.p[0]]} · no waste</text><text x="366" y="26" font-size="14" font-weight="800" fill="#fff" text-anchor="end">Try ${Math.min(3, tries + 1)}/3</text></g>` });
    if (o.balanceFirst) balancer(x, co => { if (co.every((v, i) => v === x.c[i])) { balanced = true; K.msg('Balanced! Now plan the masses.', 'ok', 2200); } }, 'First balance the equation');
    G.panel(mass, [{ k: 'a', label: `${NAME[x.r[0]]} (${MM[x.r[0]]} g/mol)`, min: o.amin || 1, max: o.amax || 100, step: o.astep || 1, fmt: v => f(v, 1) + ' g' }, { k: 'b', label: `${NAME[x.r[1]]} (${MM[x.r[1]]} g/mol)`, min: 1, max: o.bmax || 200, step: o.bstep || 1, fmt: v => f(v, 1) + ' g' }, { btns: [{ id: 'go', label: 'Run the order', cls: 'primary', fn: () => { if (!balanced) { K.msg('Balance the equation first: you need the mole ratio.', 'bad', 2200); return; } P.go(); } }] }]);
  }
  const game = {
    title: 'Order Desk', intro: 'Customers order an exact mass of product. Load exactly the right reactant masses: hit the order within 3 % and waste as little as possible.',
    cover: () => `<rect width="1000" height="620" fill="#2b2f3a"/>${labThumb('stoich').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Order Desk</text><text x="500" y="540" font-size="18" fill="#cfe0f2" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Water order', goal: 'Make <b>36 g of water</b> with no leftover reactant. 2H₂ + O₂ → 2H₂O.', hint: '36 g H₂O = 2.0 mol → needs 2.0 mol H₂ (4.0 g) and 1.0 mol O₂ (32 g).', setup: G => order(G, { rx: 'water', want: 36, a0: 10, b0: 10, amax: 20, astep: .1, bmax: 60, bstep: .5, why: '2.00 mol H₂O needs 4.03 g H₂ and 32.0 g O₂.' }) },
      { name: 'Ammonia order', goal: 'Make <b>51 g of NH₃</b> with no waste. N₂ + 3H₂ → 2NH₃.', hint: '51 g ÷ 17.03 = 3.0 mol NH₃ → 1.5 mol N₂ (42 g) and 4.5 mol H₂ (9.1 g).', setup: G => order(G, { rx: 'ammonia', want: 51, a0: 20, b0: 20, amax: 80, astep: .5, bmax: 30, bstep: .1, why: '3.00 mol NH₃ needs 1.50 mol N₂ (42.0 g) and 4.50 mol H₂ (9.07 g).' }) },
      { name: 'Propane burner', goal: 'A torch must make <b>132 g of CO₂</b>. Load propane and oxygen with no waste. C₃H₈ + 5O₂ → 3CO₂ + 4H₂O.', hint: '132 g CO₂ = 3.0 mol → 1.0 mol C₃H₈ (44.1 g) and 5.0 mol O₂ (160 g).', setup: G => order(G, { rx: 'propane', want: 132, a0: 20, b0: 50, amax: 100, astep: .5, bmax: 250, bstep: 1, why: '3.00 mol CO₂ needs 1.00 mol C₃H₈ (44.1 g) and 5.00 mol O₂ (160 g).' }) },
      { name: 'Rust order', goal: 'Balance Fe + O₂ → Fe₂O₃ yourself, then make <b>160 g of Fe₂O₃</b> with no waste.', hint: '4Fe + 3O₂ → 2Fe₂O₃. 160 g ≈ 1.0 mol Fe₂O₃ → 2.0 mol Fe (112 g) and 1.5 mol O₂ (48 g).', setup: G => order(G, { rx: 'rust', want: 160, a0: 50, b0: 20, amax: 200, astep: 1, bmax: 100, bstep: .5, balanceFirst: true, why: '1.00 mol Fe₂O₃ needs 2.00 mol Fe (112 g) and 1.50 mol O₂ (48 g).' }) }
    ]
  };
  const finale = () => { plant(RX.water, { a: 4.03, b: 32 }, {}).go(); };
  XLab.define({ id: 'stoich', guided: { steps, S, quiz, finale, finaleMsg: 'Orders shipped. Now check your thinking.', summary: () => 'You balanced equations, converted grams to moles, found limiting and excess reactants, predicted theoretical yields and calculated percent yield, and saw that mass is always conserved.' }, free, game });
})();
