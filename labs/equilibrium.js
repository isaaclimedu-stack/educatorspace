/* ═══════════ HS Chemistry: "Equilibrium Shift: Chemical Chaos" ═══════════
   Two real systems, simulated with mass-action rates (forward and reverse run all the time; equilibrium = equal rates):
     solution  Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺ (blood red)    Kc = 0.2 mM⁻¹ at 25 °C (≈ 200 M⁻¹), ΔH ≈ −8 kJ/mol
               rf = kf[Fe³⁺][SCN⁻], rr = kr[FeSCN²⁺]; "Ag⁺" removes SCN⁻ as AgSCN(s)
     gas       2NO₂ (brown) ⇌ N₂O₄ (colorless)      Kc = 170 M⁻¹ at 25 °C, ΔH = −57.2 kJ/mol
               in a sealed syringe: concentration = moles / volume, so squeezing raises every concentration
     K(T) = K₂₉₈·exp(−ΔH/R·(1/T − 1/298))  (van ’t Hoff): only temperature changes K
   Game: the Haber process N₂ + 3H₂ ⇌ 2NH₃, ΔH = −92 kJ/mol, Kp(673 K) = 1.64×10⁻⁴ atm⁻²; the plant’s pass
   reaches y_eq·(1 − e^(−k·t)), where k rises with temperature (Ea ≈ 100 kJ/mol) and ×30 with an iron catalyst. */
(() => {
  const K = Kit, f = SimLab.f, Rg = 8.314;
  const SYS = {
    fe: { n: 'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺', K298: .2, dH: -8000, kf: .12 },
    no2: { n: '2NO₂ ⇌ N₂O₄', K298: 170, dH: -57200, kf: 6 }
  };
  const Kof = (sys, T) => SYS[sys].K298 * Math.exp(-SYS[sys].dH / Rg * (1 / (T + 273.15) - 1 / 298.15));
  /* state: fe → a = [Fe³⁺], b = [SCN⁻], c = [FeSCN²⁺] in mM;  no2 → nA = mol NO₂, nC = mol N₂O₄ (mmol) in V mL */
  const fresh = o => Object.assign({ sys: 'fe', T: 25, V: 50, a: 2, b: 2, c: 0, nA: 2, nC: 0, t: 0, hist: [] }, o || {});
  function conc(s) { return s.sys === 'fe' ? { A: s.a, B: s.b, C: s.c } : { A: s.nA / s.V * 1000 / 1000, C: s.nC / s.V }; } /* gas: mmol/mL = M */
  function rates(s) {
    const k = Kof(s.sys, s.T), kf = SYS[s.sys].kf * 2 ** ((s.T - 25) / 10), kr = kf / k;
    if (s.sys === 'fe') return { rf: kf * s.a * s.b, rr: kr * s.c, K: k, Q: s.a * s.b > 1e-9 ? s.c / (s.a * s.b) : Infinity };
    const A = s.nA / s.V, C = s.nC / s.V; return { rf: kf * A * A, rr: kr * C, K: k, Q: A > 1e-9 ? C / (A * A) : Infinity };
  }
  function step(s, dt) {
    for (let i = 0; i < 20; i++) { const r = rates(s), h = dt / 20, x = (r.rf - r.rr) * h;
      if (s.sys === 'fe') { const d = Math.max(-s.c, Math.min(x, Math.min(s.a, s.b))); s.a -= d; s.b -= d; s.c += d; }
      else { const d = Math.max(-s.nC / s.V, Math.min(x, s.nA / s.V / 2)) * s.V; s.nA -= 2 * d; s.nC += d; } }
    s.t += dt;
  }
  const atEq = s => { const r = rates(s); return Math.abs(r.rf - r.rr) <= .015 * Math.max(r.rf, r.rr, 1e-6); };
  /* drawing */
  function draw(s, T, o = {}) {
    const r = rates(s); let g = `<rect width="1000" height="620" fill="#14233f"/><rect y="520" width="1000" height="100" fill="#1d2f52"/>`;
    if (s.sys === 'fe') {
      const red = Math.min(1, s.c / 1.6), fe = Math.min(1, s.a / 6);
      g += `<path d="M150,90 L150,470 Q150,510 190,510 L450,510 Q490,510 490,470 L490,90" fill="none" stroke="#cfe0f2" stroke-width="7"/>
        <rect x="154" y="160" width="332" height="346" rx="30" fill="rgb(${Math.round(250 - red * 70 + fe * 5)},${Math.round(235 - red * 205 + fe * 10)},${Math.round(200 - red * 170 - fe * 120)})" opacity=".92"/>`;
      const P = [['#ffb347', Math.round(s.a * 5)], ['#e8f1ff', Math.round(s.b * 5)], ['#c4102a', Math.round(s.c * 6)]];
      let n = 0; P.forEach(([c, k]) => { for (let i = 0; i < Math.min(40, k); i++) { const h = SimLab.hash(n++), x = 180 + ((h * 280 + T * 25 * (n % 2 ? 1 : -1)) % 280 + 280) % 280, y = 190 + ((SimLab.hash(n * 7) * 300 + T * 14) % 300); g += c === '#c4102a' ? `<circle cx="${x}" cy="${y}" r="6" fill="#ffb347"/><circle cx="${x + 8}" cy="${y}" r="5" fill="#c4102a"/>` : `<circle cx="${x}" cy="${y}" r="${c === '#ffb347' ? 6 : 4.5}" fill="${c}" stroke="#0004"/>`; } });
      g += `<text x="320" y="560" font-size="15" fill="#cfe0f2" text-anchor="middle"><tspan fill="#ffb347">● Fe³⁺</tspan>   <tspan fill="#e8f1ff">● SCN⁻</tspan>   <tspan fill="#ff6b6b">●● FeSCN²⁺ (red)</tspan></text>`;
    } else {
      const A = s.nA / s.V, brown = Math.min(1, A / .05), len = 120 + s.V * 5.2;
      g += `<g transform="translate(70 230)"><rect x="0" y="0" width="${len}" height="150" rx="14" fill="rgb(${Math.round(225 - brown * 85)},${Math.round(215 - brown * 140)},${Math.round(205 - brown * 175)})" stroke="#cfe0f2" stroke-width="6"/>
        <rect x="${len}" y="-30" width="22" height="210" rx="6" fill="#7d8fa3"/><rect x="${len + 22}" y="65" width="${560 - len}" height="20" fill="#9aa8b8"/><rect x="${582}" y="20" width="26" height="110" rx="8" fill="#7d8fa3"/>
        <rect x="-26" y="62" width="26" height="26" fill="#7d8fa3"/></g>`;
      const nA = Math.round(s.nA * 18), nC = Math.round(s.nC * 18); let n = 0;
      for (let i = 0; i < Math.min(60, nA); i++) { const h = SimLab.hash(n++), x = 90 + ((h * (len - 40) + T * 40 * (i % 2 ? 1 : -1)) % (len - 40) + (len - 40)) % (len - 40), y = 250 + ((SimLab.hash(n * 5) * 110 + T * 30) % 110); g += `<g transform="translate(${x} ${y})"><circle r="5" fill="#2f6fd6"/><circle cx="-6" cy="5" r="4" fill="#e5484d"/><circle cx="6" cy="5" r="4" fill="#e5484d"/></g>`; }
      for (let i = 0; i < Math.min(40, nC); i++) { const h = SimLab.hash(n++), x = 95 + ((h * (len - 50) - T * 20 * (i % 2 ? 1 : -1)) % (len - 50) + (len - 50)) % (len - 50), y = 255 + ((SimLab.hash(n * 3) * 100 + T * 18) % 100); g += `<g transform="translate(${x} ${y})"><circle r="5" fill="#2f6fd6"/><circle cx="9" r="5" fill="#2f6fd6"/><circle cx="-5" cy="7" r="3.5" fill="#e5484d"/><circle cx="14" cy="7" r="3.5" fill="#e5484d"/></g>`; }
      g += `<g transform="translate(70 440)"><rect width="560" height="40" rx="10" fill="${s.T > 50 ? '#e5484d' : s.T < 5 ? '#4f8ff7' : '#2d4470'}" opacity=".7"/><text x="280" y="26" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${s.T > 50 ? '♨ hot water bath' : s.T < 5 ? '❄ ice bath' : 'room temperature'} · ${f(s.T)} °C</text></g>
        <text x="350" y="200" font-size="15" fill="#cfe0f2" text-anchor="middle">Sealed syringe: ${f(s.V)} mL · <tspan fill="#ffb37a">NO₂ (brown)</tspan> and <tspan fill="#e8f1ff">N₂O₄ (colorless)</tspan></text>`;
    }
    const sysR = s.sys === 'fe' ? [['[Fe³⁺]', `${f(s.a, 2)} mM`, '#ffb347'], ['[SCN⁻]', `${f(s.b, 2)} mM`], ['[FeSCN²⁺]', `${f(s.c, 2)} mM`, '#ff8a8a']] : [['[NO₂]', `${f(s.nA / s.V * 1000, 1)} mM`, '#ffb37a'], ['[N₂O₄]', `${f(s.nC / s.V * 1000, 1)} mM`]];
    g += SimLab.hud(660, 40, 320, sysR.concat([['K at this T', r.K < 10 ? f(r.K, 3) : f(r.K, 0), '#ffd27a'], ['Q now', isFinite(r.Q) ? (r.Q < 10 ? f(r.Q, 3) : f(r.Q, 0)) : '∞', Math.abs(r.Q - r.K) / r.K < .03 ? '#7ee0a1' : '#ffb37a'], ['Status', atEq(s) ? 'at equilibrium' : r.Q < r.K ? 'shifting → right' : 'shifting ← left', atEq(s) ? '#7ee0a1' : '#ffd27a']]), SYS[s.sys].n);
    const mx = Math.max(r.rf, r.rr, 1e-9);
    g += `<g transform="translate(660 ${s.sys === 'fe' ? 238 : 218})"><rect width="320" height="88" rx="8" fill="#0b1020" fill-opacity=".74"/><text x="12" y="22" font-size="13" font-weight="700" fill="#fff">Reaction rates</text>${SimLab.bar(12, 46, 296, r.rf / mx, '#4f8ff7', 'forward →', '')}${SimLab.bar(12, 74, 296, r.rr / mx, '#ff8a3c', '← reverse', '')}</g>`;
    const h = s.hist; g += SimLab.chart(676, s.sys === 'fe' ? 380 : 360, 288, 110, s.sys === 'fe' ? [{ d: h.map(x => x[0]), c: '#ffb347', n: 'Fe³⁺' }, { d: h.map(x => x[1]), c: '#e8f1ff', n: 'SCN⁻' }, { d: h.map(x => x[2]), c: '#ff6b6b', n: 'FeSCN²⁺' }] : [{ d: h.map(x => x[0]), c: '#ffb37a', n: 'NO₂ (mM)' }, { d: h.map(x => x[1]), c: '#e8f1ff', n: 'N₂O₄ (mM)' }], { xs: 60, title: 'Concentrations over time', marks: o.marks || [] });
    return g + (o.extra || '');
  }
  function sim(s, cfg = {}) {
    let T = 0, acc = 0, marks = []; const hist = () => s.hist.push(s.sys === 'fe' ? [s.a, s.b, s.c] : [s.nA / s.V * 1000, s.nC / s.V * 1000]);
    SimLab.stage('', (g, dt) => { T += dt; step(s, dt * (cfg.speed || 1)); acc += dt; if (acc > .25) { acc = 0; hist(); if (s.hist.length > 60) { s.hist.shift(); marks.forEach(m => m.i--); marks = marks.filter(m => m.i >= 0); } cfg.tick && cfg.tick(s); }
      g.innerHTML = draw(s, T, { marks, extra: cfg.extra ? cfg.extra(s) : '' }); });
    return { mark: t => marks.push({ i: s.hist.length - 1, t }) };
  }

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'dyn', name: 'Dynamic equilibrium', title: 'Mix and wait', html: 'Iron(III) ions and thiocyanate ions react to make a <b>blood-red</b> complex. Press <b>Mix</b>, watch the forward and reverse rates, and wait for <b>equilibrium</b>. Then calculate <b>K</b> from the concentrations: K = [FeSCN²⁺] / ([Fe³⁺][SCN⁻]).', hint: 'Use the three concentrations in the monitor once the status says “at equilibrium”.' },
    { id: 'conc', name: 'Concentration', title: 'Stress test', html: 'Now <b>predict</b>, then test: add extra <b>Fe³⁺</b>. After it settles, add <b>Ag⁺</b>, which removes SCN⁻ as a solid (AgSCN).', hint: 'Adding a reactant makes Q smaller than K, so the reaction shifts right. Removing a reactant makes Q bigger than K, so it shifts left.' },
    { id: 'temp', name: 'Temperature', title: 'Hot and cold', html: 'This syringe holds brown NO₂ in equilibrium with colorless N₂O₄. The forward reaction is <b>exothermic</b> (ΔH = −57 kJ/mol). <b>Predict</b> the color in a hot bath, then heat it to <b>80 °C or more</b>, then cool it in ice (<b>0 °C or less</b>).', hint: 'For an exothermic reaction, heat acts like a product. Adding heat shifts the equilibrium left (toward brown NO₂).' },
    { id: 'press', name: 'Pressure', title: 'Squeeze it', html: 'At 25 °C, push the syringe in to <b>half the volume (25 mL)</b> or less and watch the color closely: first, and a few seconds later. Note the <b>K</b> value before and after.', hint: 'Squeezing raises every concentration at once (darker), then the reaction shifts toward fewer gas molecules: 2NO₂ → N₂O₄.' }
  ];
  const S = {
    dyn: R => { const s = fresh({ a: 0, b: 0 }); let mixed = false, eq = false, kOk = false;
      sim(s, { tick: x => { if (mixed && atEq(x) && !eq) { eq = true; SND.ok(); K.msg('Forward rate = reverse rate: equilibrium!', 'ok', 3000); G.check(); } } });
      SimLab.panel(s, [{ btns: [{ id: 'mix', label: 'Mix 2 mM Fe³⁺ + 2 mM SCN⁻', cls: 'primary', fn: () => { if (mixed) return; mixed = true; s.a = 2; s.b = 2; SND.pop(); } }] }]);
      LabUI.html(XLab.numIn('eqK', 'K =', 'mM⁻¹', 'from the monitor'));
      $('#eqKB').onclick = () => { if (!eq) { K.msg('Wait for equilibrium first.', 'bad', 2000); return; } const v = +$('#eqK').value, k = s.c / (s.a * s.b); if (Math.abs(v - k) / k <= .1) { kOk = true; XLab.note(`At equilibrium [Fe³⁺] = ${f(s.a, 2)}, [SCN⁻] = ${f(s.b, 2)}, [FeSCN²⁺] = ${f(s.c, 2)} mM, so K = ${f(k, 2)} mM⁻¹.`); K.msg(`Yes: K = ${f(s.c, 2)} / (${f(s.a, 2)} × ${f(s.b, 2)}) = ${f(k, 2)} mM⁻¹`, 'ok', 3500); } else { R.mistake('Calculating K', 'K = [products] / [reactants]: [FeSCN²⁺] ÷ ([Fe³⁺] × [SCN⁻]) using equilibrium concentrations.'); K.msg('Not quite. Divide [FeSCN²⁺] by the product of the two reactant concentrations.', 'bad', 3500); } G.check(); };
      const G = SimLab.goals(R, { name: 'Dynamic equilibrium', items: () => [[mixed, 'Mix the solutions'], [eq, 'Reach equilibrium'], [kOk, 'Calculate K (within 10 %)']],
        q: { q: 'At equilibrium, what is happening to the molecules?', a: ['Both reactions continue at equal rates, so concentrations stay constant', 'All reactions have stopped', 'Only the forward reaction is happening', 'The amounts of reactants and products are equal'], c: 0, e: 'Equilibrium is <b>dynamic</b>: Fe³⁺ and SCN⁻ keep combining and FeSCN²⁺ keeps breaking apart, at the same rate. The concentrations stay constant but are not usually equal.' } }); },
    conc: R => { const s = fresh({ a: 2, b: 2 }); for (let i = 0; i < 400; i++) step(s, .05); let p1 = null, p2 = null, fe = false, ag = false; const sm = sim(s, { tick: () => G.check() });
      XLab.choiceIn('Prediction: adding Fe³⁺ will make the solution…', ['Redder (shift right)', 'Paler (shift left)', 'No change'], i => { p1 = i; G.check(); });
      XLab.choiceIn('Prediction: adding Ag⁺ (removes SCN⁻) will make it…', ['Redder (shift right)', 'Paler (shift left)', 'No change'], i => { p2 = i; G.check(); });
      SimLab.panel(s, [{ btns: [{ id: 'fe', label: '+ Fe³⁺ (3 mM)', cls: 'primary', fn: () => { if (p1 == null) { K.msg('Predict first.', 'bad', 1800); return; } s.a += 3; fe = true; sm.mark('+Fe³⁺'); SND.pop(); if (p1 !== 0) R.mistake('Adding a reactant', 'Adding a reactant makes Q < K, so the reaction shifts right, making more red FeSCN²⁺.'); XLab.note('Added Fe³⁺: Q dropped below K, so the equilibrium shifted right (redder).'); G.check(); } },
        { id: 'ag', label: '+ Ag⁺ (removes SCN⁻)', fn: () => { if (p2 == null) { K.msg('Predict first.', 'bad', 1800); return; } if (!fe || !atEq(s)) { K.msg('Add Fe³⁺ first and let it settle.', 'bad', 2200); return; } s.b *= .25; ag = true; sm.mark('+Ag⁺'); SND.pop(); if (p2 !== 1) R.mistake('Removing a reactant', 'Removing SCN⁻ makes Q > K, so FeSCN²⁺ breaks apart (shift left) and the color fades.'); XLab.note('Removed SCN⁻ with Ag⁺: Q rose above K, so the equilibrium shifted left (paler).'); G.check(); } }] }]);
      const G = SimLab.goals(R, { name: 'Concentration', items: () => [[fe && atEq(s) || ag, 'Add Fe³⁺ and let it re-equilibrate'], [ag && atEq(s), 'Remove SCN⁻ and let it re-equilibrate']],
        q: { q: 'After adding Fe³⁺ and waiting, the value of K is…', a: ['The same: the concentrations rearranged so Q = K again', 'Bigger', 'Smaller', 'Zero'], c: 0, e: 'Concentration changes make Q ≠ K. The system shifts until Q equals the same K again. <b>Le Châtelier’s principle</b>: a system at equilibrium partly undoes a change imposed on it.' } }); },
    temp: R => { const s = fresh({ sys: 'no2', V: 50, nA: 2, nC: 0 }); for (let i = 0; i < 400; i++) step(s, .05); let pred = null, hot = false, cold = false; const k25 = rates(s).K;
      XLab.choiceIn('Prediction: in a hot bath the gas will look…', ['Browner', 'Paler', 'The same'], i => { pred = i; G.check(); });
      SimLab.panel(s, [{ k: 'T', label: 'Water bath temperature', min: -10, max: 100, step: 5, fmt: v => v + ' °C' }], () => { if (pred == null) K.msg('Make your prediction first.', 'bad', 1800); });
      sim(s, { tick: x => { if (pred != null && x.T >= 80 && atEq(x) && !hot) { hot = true; if (pred !== 0) R.mistake('Temperature prediction', 'The forward reaction is exothermic, so heating shifts it left: more brown NO₂.'); XLab.note(`At ${x.T} °C: K = ${f(rates(x).K, 2)} (it was ${f(k25, 0)} at 25 °C). The gas turned browner.`); G.check(); } if (pred != null && x.T <= 0 && atEq(x) && !cold) { cold = true; XLab.note(`At ${x.T} °C: K = ${f(rates(x).K, 0)}. The gas turned almost colorless.`); G.check(); } } });
      const G = SimLab.goals(R, { name: 'Temperature', items: () => [[pred != null, 'Predict'], [hot, 'Heat to 80 °C or more (wait for equilibrium)'], [cold, 'Cool to 0 °C or less (wait for equilibrium)']],
        q: { q: 'What happened to K when you heated the syringe?', a: ['K got smaller: for an exothermic reaction, heating favors the reactants', 'K got bigger', 'K stayed the same', 'K became negative'], c: 0, e: 'Temperature is the only stress that changes <b>K</b>. For an exothermic forward reaction, K decreases as temperature rises (heat is like a product), so the mixture shifts toward brown NO₂.' } }); },
    press: R => { const s = fresh({ sys: 'no2', V: 50, nA: 2, nC: 0 }); for (let i = 0; i < 400; i++) step(s, .05); let squeezed = false, settled = false, k0 = rates(s).K;
      SimLab.panel(s, [{ k: 'V', label: 'Syringe volume', min: 10, max: 60, step: 1, fmt: v => v + ' mL' }], () => { if (s.V <= 25) squeezed = true; });
      sim(s, { tick: x => { if (squeezed && x.V <= 25 && atEq(x) && !settled) { settled = true; XLab.note(`Squeezed to ${x.V} mL: it darkened at first, then paled as NO₂ formed N₂O₄. K stayed ${f(rates(x).K, 0)}.`); G.check(); } } });
      const G = SimLab.goals(R, { name: 'Pressure', items: () => [[squeezed, 'Squeeze to 25 mL or less'], [settled, 'Wait for equilibrium']],
        q: { q: 'Why did the color fade a little after the first darkening?', a: ['The higher pressure shifted the reaction toward fewer gas molecules (N₂O₄)', 'K increased', 'NO₂ escaped from the syringe', 'Squeezing cooled the gas'], c: 0, e: `Squeezing raises all concentrations (darker at first). Then Q &lt; K, so 2NO₂ → N₂O₄ until Q = K again: <b>2 molecules become 1</b>, lowering the pressure. K stayed ${f(k0, 0)}: pressure doesn’t change K.` } }); }
  };
  const quiz = [
    { q: 'For N₂ + 3H₂ ⇌ 2NH₃ (exothermic), which change increases the equilibrium yield of NH₃?', a: ['Raising the pressure', 'Raising the temperature', 'Adding a catalyst', 'Removing N₂'], c: 0, e: '4 gas molecules → 2, so higher pressure shifts right. Higher temperature shifts left; a catalyst changes only the rate.' },
    { q: 'What does a catalyst do to a system at equilibrium?', a: ['Nothing to the position; it only reaches equilibrium faster', 'Shifts it to the right', 'Shifts it to the left', 'Increases K'], c: 0, e: 'A catalyst speeds up the forward and reverse reactions equally.' },
    { q: 'If Q < K, the reaction will…', a: ['Shift right (make more products)', 'Shift left', 'Stay the same', 'Stop'], c: 0, e: 'Q < K means too few products compared with equilibrium, so the forward reaction wins until Q = K.' },
    { q: 'K for a reaction is 1 × 10⁻⁵. At equilibrium the mixture contains…', a: ['Mostly reactants', 'Mostly products', 'Equal amounts', 'Only products'], c: 0, e: 'A small K means [products] ≪ [reactants] at equilibrium.' },
    { q: 'Blood carries O₂ as Hb + O₂ ⇌ HbO₂. In the lungs, where O₂ is high, the equilibrium…', a: ['Shifts right: hemoglobin picks up O₂', 'Shifts left: O₂ is released', 'Doesn’t change', 'Stops'], c: 0, e: 'High [O₂] pushes the equilibrium right. In tissues where O₂ is low, it shifts left and releases O₂: Le Châtelier at work in your body.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Choose a system and its conditions, wait for <b>equilibrium</b>, then record. The record button only works at equilibrium.',
    fresh: () => ({ sys: 'fe', T: 25, V: 50, a0: 2, b0: 2 }),
    vars: [{ k: 'T', label: 'Temperature', short: 'Temp.', min: -10, max: 100, step: 5, unit: '°C', d: 0, fmt: v => v + ' °C' }, { k: 'V', label: 'Gas volume (NO₂ system)', short: 'Volume', min: 10, max: 60, step: 1, unit: 'mL', d: 0, fmt: v => v + ' mL' }, { k: 'a0', label: 'Fe³⁺ added (Fe system)', short: 'Fe³⁺ in', min: 0, max: 8, step: .5, unit: 'mM', d: 1, fmt: v => v + ' mM' }, { k: 'b0', label: 'SCN⁻ added (Fe system)', short: 'SCN⁻ in', min: 0, max: 8, step: .5, unit: 'mM', d: 1, fmt: v => v + ' mM' }],
    cats: [{ k: 'sys', label: 'System', opts: [['fe', 'Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺'], ['no2', '2NO₂ ⇌ N₂O₄']] }],
    measures: [{ k: 'K', label: 'Equilibrium constant K', short: 'K', unit: '', d: 2 }, { k: 'prod', label: 'Product concentration', short: '[Product]', unit: 'mM', d: 2 }, { k: 'conv', label: 'Reactant converted', short: 'Converted', unit: '%', d: 0 }],
    measure: s => { const x = s._s; if (!x || !atEq(x)) return null; const r = rates(x); return x.sys === 'fe' ? { K: r.K, prod: x.c, conv: x.c / Math.max(1e-9, Math.min(s.a0, s.b0)) * 100 } : { K: r.K, prod: x.nC / x.V * 1000, conv: 2 * x.nC / 2 * 100 }; },
    notReady: 'Wait until the status says “at equilibrium”, then record.',
    ideas: [['How does temperature affect K for the exothermic 2NO₂ ⇌ N₂O₄?', 'T', 'K'], ['How does the volume (pressure) affect how much N₂O₄ forms?', 'V', 'conv'], ['How does the amount of Fe³⁺ added affect the amount of red product?', 'a0', 'prod']],
    expect(x, y) {
      if (x === 'T') return { t: 'down', why: 'Both reactions here are exothermic, so raising the temperature lowers K (van ’t Hoff) and shifts the equilibrium toward the reactants. The effect is much bigger for NO₂/N₂O₄ (ΔH = −57 kJ) than for FeSCN²⁺ (ΔH ≈ −8 kJ).' };
      if (x === 'V' && y === 'K') return { t: 'flat', why: 'Volume (pressure) changes Q, not K. Only temperature changes K.' };
      if (x === 'V') return { t: 'down', why: 'A bigger volume means lower pressure, so the equilibrium shifts toward more gas molecules (2NO₂). Less N₂O₄ forms. Squeezing does the opposite.' };
      if ((x === 'a0' || x === 'b0') && y === 'K') return { t: 'flat', why: 'Adding reactant changes the position of equilibrium, not K.' };
      if (x === 'a0' || x === 'b0') return { t: y === 'conv' ? 'down' : 'levels', why: 'More of one reactant pushes the equilibrium right, making more FeSCN²⁺, until the other reactant runs low, so the curve levels off.' };
      return null;
    },
    setup(F) {
      let s = null; const reset = () => { const st = F.st; s = fresh({ sys: st.sys, T: st.T, V: st.V, a: st.sys === 'fe' ? st.a0 : 0, b: st.b0, nA: 2 }); F.st._s = s; };
      reset(); F.onChange(k => { if (!s) return; if (k === 'sys' || k === 'a0' || k === 'b0') reset(); else { s.T = F.st.T; if (s.sys === 'no2') s.V = F.st.V; } });
      let T = 0, acc = 0; SimLab.stage('', (g, dt) => { T += dt; step(s, dt * 2); acc += dt; if (acc > .25) { acc = 0; s.hist.push(s.sys === 'fe' ? [s.a, s.b, s.c] : [s.nA / s.V * 1000, s.nC / s.V * 1000]); if (s.hist.length > 60) s.hist.shift(); } g.innerHTML = draw(s, T); });
    }
  };

  /* ═════ Game: Haber plant ═════ */
  const Kp = T => 1.64e-4 * Math.exp(92000 / Rg * (1 / (T + 273.15) - 1 / 673.15));
  function yEq(T, P) { const k = Kp(T); let lo = 0, hi = .999; for (let i = 0; i < 60; i++) { const x = (lo + hi) / 2, n = 4 - 2 * x, yN = 2 * x / n, yN2 = (1 - x) / n, yH = 3 * (1 - x) / n, q = yN * yN / (yN2 * yH ** 3 * P * P); if (q > k) hi = x; else lo = x; } const x = (lo + hi) / 2; return 2 * x / (4 - 2 * x); }
  const kRate = (T, cat) => 1.13e6 * Math.exp(-100000 / (Rg * (T + 273.15))) * (cat ? 30 : 1);
  function plant(G, o) {
    const st = { T: 350, P: 100, cat: 0 }; let t = 0, made = 0, cash = o.cash, T0 = 0;
    G.panel(st, [{ k: 'T', label: 'Reactor temperature', min: 250, max: 650, step: 10, fmt: v => v + ' °C' }, { k: 'P', label: 'Pressure', min: 20, max: 350, step: 10, fmt: v => v + ' atm' }, { html: '<div class="sim-note">Running costs: pressure (compressors) and heat. Iron catalyst costs 2 coins per second when on.</div>' }, { btns: [{ id: 'cat', label: '⚙ Iron catalyst: off', fn: () => { st.cat = 1 - st.cat; $('[data-sb="cat"]').textContent = `⚙ Iron catalyst: ${st.cat ? 'on' : 'off'}`; $('[data-sb="cat"]').classList.toggle('primary', !!st.cat); SND.tick(); } }] }]);
    SimLab.stage('', (g, dt) => { T0 += dt;
      const ye = yEq(st.T, st.P), k = kRate(st.T, st.cat), y = ye * (1 - Math.exp(-k * 1)), rate = y * 4, cost = st.P * .012 + (st.T - 200) * .006 + st.cat * 2;
      if (!G.over()) { t += dt; made += rate * dt; cash -= cost * dt;
        if (made >= o.target) G.win(cash > o.cash * o.s3 ? 3 : cash > o.cash * o.s2 ? 2 : 1, cash * 5 + (o.time - t) * 30, `${o.target} t of ammonia in ${Math.round(t)} s. Real plants use about 450 °C, 200 atm and an iron catalyst: a compromise between yield, rate and cost.`);
        else if (cash <= 0) G.lose('Out of money', 'Very high pressure and temperature are expensive. Find a compromise: enough pressure for a good yield, a temperature high enough for speed (with the catalyst), but not so high that the equilibrium yield collapses.');
        else if (t >= o.time) G.lose('Too slow', `At low temperature the equilibrium yield is high but the reaction is far too slow to get there. At high temperature it is fast but the equilibrium yield is low (exothermic). The catalyst lets you run cooler and still be fast.`); }
      g.innerHTML = `<rect width="1000" height="620" fill="#1c2733"/><rect y="500" width="1000" height="120" fill="#27323f"/>
        <g transform="translate(80 120)"><rect width="200" height="340" rx="40" fill="#5a6a7c" stroke="#9aa8b8" stroke-width="5"/><rect x="20" y="40" width="160" height="260" rx="20" fill="rgb(${Math.round(60 + (st.T - 250) / 400 * 190)},70,60)"/>${st.cat ? Array.from({ length: 12 }, (_, i) => `<rect x="${40 + (i % 4) * 32}" y="${80 + Math.floor(i / 4) * 60}" width="20" height="20" fill="#8a8f98" stroke="#c0c4cc"/>`).join('') : ''}<text x="100" y="330" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">Reactor</text></g>
        <path d="M280,200 H420 V300 H560" stroke="#9aa8b8" stroke-width="16" fill="none"/><g transform="translate(560 220)"><rect width="120" height="200" rx="20" fill="#4f8ff7" opacity=".7"/><rect x="10" y="${190 - Math.min(180, made / o.target * 180)}" width="100" height="${Math.min(180, made / o.target * 180)}" rx="10" fill="#bfe0ff"/><text x="60" y="230" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">NH₃ tank</text></g>
        ${Array.from({ length: 8 }, (_, i) => `<circle cx="${290 + ((T0 * 60 * (1 + rate) + i * 17) % 125)}" cy="${200 + Math.sin(i) * 3}" r="4" fill="#e8f1ff" opacity="${Math.min(1, rate)}"/>`).join('')}
        ${SimLab.hud(720, 40, 260, [['Equilibrium yield', `${f(ye * 100, 1)} % NH₃`, '#7ee0a1'], ['Reached per pass', `${f(y * 100, 1)} %`, '#7ee0a1'], ['Speed (rate constant)', k > 3 ? 'fast' : k > 1 ? 'moderate' : k > .2 ? 'slow' : 'very slow'], ['Production', `${f(rate, 2)} t/s`], ['Running cost', `${f(cost, 1)} coins/s`, '#ffb37a']], 'Haber plant: N₂ + 3H₂ ⇌ 2NH₃')}
        <g transform="translate(720 230)"><rect width="260" height="130" rx="8" fill="#0b1020" fill-opacity=".8"/>${SimLab.bar(12, 34, 236, made / o.target, '#7ee0a1', 'Ammonia', `${f(made, 1)} / ${o.target} t`)}${SimLab.bar(12, 74, 236, cash / o.cash, cash / o.cash > .3 ? '#ffd27a' : '#ff6b6b', 'Coins', Math.round(cash))}${SimLab.bar(12, 114, 236, 1 - t / o.time, '#9fd0ff', 'Time left', `${Math.max(0, Math.round(o.time - t))} s`)}</g>`; });
  }
  /* Game: Le Châtelier quick-fire. A target color/side is shown; choose the stress that gets there */
  function quick(G) {
    const Qs = [['2NO₂ (brown) ⇌ N₂O₄ (colorless), ΔH < 0', 'Make it <b>browner</b>', ['Heat it', 'Cool it', 'Squeeze it (smaller volume)', 'Add a catalyst'], 0],
      ['N₂ + 3H₂ ⇌ 2NH₃, ΔH < 0', 'Make <b>more NH₃</b>', ['Raise the pressure', 'Raise the temperature', 'Add a catalyst', 'Remove some H₂'], 0],
      ['Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺ (red)', 'Make it <b>paler</b>', ['Add Ag⁺ (removes SCN⁻)', 'Add Fe³⁺', 'Add SCN⁻', 'Add a catalyst'], 0],
      ['CaCO₃(s) ⇌ CaO(s) + CO₂(g), ΔH > 0', 'Make <b>more CO₂</b>', ['Heat it', 'Cool it', 'Raise the pressure', 'Add more CaCO₃ (solid)'], 0],
      ['H₂(g) + I₂(g) ⇌ 2HI(g)', 'What does <b>raising the pressure</b> do?', ['No shift: 2 gas molecules on each side', 'Shift right', 'Shift left', 'K increases'], 0],
      ['Co(H₂O)₆²⁺ (pink) + 4Cl⁻ ⇌ CoCl₄²⁻ (blue) + 6H₂O, ΔH > 0', 'Make it <b>blue</b>', ['Heat it', 'Cool it', 'Add water', 'Add a catalyst'], 0],
      ['2SO₂ + O₂ ⇌ 2SO₃, ΔH < 0', 'Increase <b>K</b>', ['Lower the temperature', 'Raise the pressure', 'Add more O₂', 'Add a catalyst'], 0],
      ['CO₂(aq) + H₂O ⇌ H⁺ + HCO₃⁻', 'Make the soda <b>less acidic</b>', ['Let CO₂ escape (open the bottle)', 'Add CO₂', 'Add HCl', 'Squeeze the bottle'], 0]];
    let i = 0, score = 0, streak = 0, t = 0; const ord = Qs.map((q, k) => k).sort(() => Math.random() - .5);
    const box = LabUI.html('');
    const show = () => { const q = Qs[ord[i]], o = q[2].map((x, k) => k).sort(() => Math.random() - .5); box.innerHTML = `<div class="pl-pred"><label>Question ${i + 1} of ${Qs.length} · ${q[0]}<br>${q[1]}</label><div class="sim-pick" style="flex-direction:column;align-items:stretch">${o.map(k => `<button class="btn sm" data-q="${k}">${q[2][k]}</button>`).join('')}</div></div>`;
      $$('[data-q]', box).forEach(b => b.onclick = () => { if (G.over()) return; if (+b.dataset.q === q[3]) { streak++; score += 100 + streak * 25 + Math.max(0, 20 - t) * 5; SND.ok(); } else { streak = 0; SND.nope(); K.addMistake({ title: q[1].replace(/<[^>]+>/g, ''), why: `Answer: ${q[2][q[3]]}`, step: 'Quick-fire' }); K.mistakeCount(); K.msg(`Answer: ${q[2][q[3]]}`, 'bad', 2500); } i++; t = 0; if (i >= Qs.length) { const right = K.mistakes.length; G.win(right === 0 ? 3 : right <= 2 ? 2 : 1, score, `${Qs.length - right} of ${Qs.length} correct.`); } else show(); }); };
    show();
    SimLab.stage('', (g, dt) => { t += dt; g.innerHTML = `<rect width="1000" height="620" fill="#14233f"/><text x="500" y="200" font-size="34" font-weight="800" fill="#ffd27a" text-anchor="middle">Le Châtelier Quick-Fire</text><text x="500" y="260" font-size="20" fill="#cfe0f2" text-anchor="middle">${i < Qs.length ? Qs[ord[i]][0] : ''}</text><text x="500" y="330" font-size="26" font-weight="800" fill="#fff" text-anchor="middle">${i < Qs.length ? Qs[ord[i]][1].replace(/<[^>]+>/g, '') : ''}</text><text x="500" y="420" font-size="22" font-weight="800" fill="#7ee0a1" text-anchor="middle">${score} pts${streak > 1 ? ` · streak ×${streak}` : ''}</text><text x="500" y="470" font-size="15" fill="#a9b6cc" text-anchor="middle">Answer in the lab sheet. Faster answers score more.</text>`; });
  }
  const game = {
    title: 'Chemical Chaos', intro: 'Predict how equilibria respond to stress, then run an ammonia plant where yield, speed and cost all pull in different directions.',
    cover: () => `<rect width="1000" height="620" fill="#14233f"/>${labThumb('equilibrium').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Chemical Chaos</text><text x="500" y="540" font-size="18" fill="#9fc6e0" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Quick-fire', goal: 'Eight equilibria, eight stresses. Choose the change that does what’s asked.', hint: 'Heat acts like a product for exothermic reactions and like a reactant for endothermic ones. Pressure favors the side with fewer gas molecules. Catalysts never shift equilibrium.', setup: G => quick(G) },
      { name: 'Ammonia plant', goal: 'Produce <b>60 t</b> of ammonia in 90 s.', hint: 'Low temperature gives a high equilibrium yield but the reaction is too slow. Use the catalyst and a compromise temperature.', setup: G => plant(G, { target: 60, time: 90, cash: 800, s3: .45, s2: .2 }) },
      { name: 'Tight budget', goal: 'Produce <b>80 t</b> in 110 s with less money.', hint: 'Every atmosphere costs money. Find the pressure where extra yield stops paying for itself.', setup: G => plant(G, { target: 80, time: 110, cash: 700, s3: .25, s2: .1 }) }
    ]
  };
  const finale = () => { const s = fresh({ a: 2, b: 2 }); sim(s); };
  XLab.define({ id: 'equilibrium', guided: { steps, S, quiz, finale, finaleMsg: 'Equilibrium restored. Now check your thinking.', summary: () => 'You watched forward and reverse rates become equal, calculated K, and used Le Châtelier’s principle to predict shifts from concentration, temperature and pressure, finding that only temperature changes K.' }, free, game });
})();
