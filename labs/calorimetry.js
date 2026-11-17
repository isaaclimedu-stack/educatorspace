/* ═══════════ HS Chemistry: "Thermal Reactor: Calorimetry Lab" ═══════════
   A stirred coffee-cup calorimeter (time accelerated). Heat capacities in J/°C:
     water m·4.184, the cup itself 10 (foam) or 40 (glass), a metal sample m·c (c in J/g·°C:
     copper 0.385, aluminum 0.897, iron 0.449, lead 0.129, mystery = zinc 0.388)
     metal ↔ water heat flow  P = 4·(T_metal − T_water) W           → they meet at the weighted average
     reactions release (or absorb) n·ΔH over ~10 s:  NaOH(s) dissolving −44.5 kJ/mol, NH₄NO₃(s) dissolving +25.7 kJ/mol,
     HCl + NaOH neutralization −57.3 kJ/mol (the solution is treated as water: 4.184 J/g·°C)
     heat leaks to the 22 °C room at 0.25 W/°C through foam, 3 W/°C through a glass beaker.
   Energy is conserved: heat lost by the hot part = heat gained by the cold part (+ a little leak). */
(() => {
  const K = Kit, f = SimLab.f, CW = 4.184, ROOM = 22;
  const MET = { Cu: ['Copper', .385, '#c8743a'], Al: ['Aluminum', .897, '#c9d1d9'], Fe: ['Iron', .449, '#7d8590'], Pb: ['Lead', .129, '#6b7385'], Zn: ['Mystery metal', .388, '#9aa6b2'] };
  const RXN = { NaOH: ['NaOH(s) dissolving', -44.5], NH4NO3: ['NH₄NO₃(s) dissolving', 25.7], neut: ['HCl + NaOH neutralizing', -57.3] };
  const fresh = o => Object.assign({ what: 'hot', mw: 100, Tw: 20, mo: 100, To: 80, n: .05, cup: 'foam' }, o || {});
  function setup(st) {
    const metal = MET[st.what], rxn = RXN[st.what], hot = st.what === 'hot';
    const Cw = st.mw * CW + (st.cup === 'foam' ? 10 : 40);
    return { st, t: 0, Tw: st.Tw, To: metal ? st.To : st.Tw, Cw, Co: metal ? st.mo * metal[1] : 0, hotIn: hot ? 0 : null, added: false, rel: 0, Q: rxn ? st.n * rxn[1] * -1000 : 0, hist: [st.Tw], ext: st.Tw, leak: st.cup === 'foam' ? .25 : 3, done: false };
  }
  function add(c) { c.added = true; c.t0 = c.t; if (c.st.what === 'hot') { /* hot water poured in: instant mixing of heat capacity */ c.Tw = (c.Cw * c.Tw + c.st.mo * CW * c.st.To) / (c.Cw + c.st.mo * CW); c.Cw += c.st.mo * CW; c.mixing = 2; } }
  function step(c, dt) {
    if (c.added) {
      if (c.Co) { const P = 4 * (c.To - c.Tw); c.To -= P * dt / c.Co; c.Tw += P * dt / c.Cw; }
      if (c.Q) { const tt = c.t - c.t0, frac = 1 - Math.exp(-tt / 3.5), dq = c.Q * frac - c.rel; c.rel += dq; c.Tw += dq / c.Cw; }
    }
    c.Tw -= c.leak * (c.Tw - ROOM) * dt / c.Cw; c.t += dt;
    const d = c.Tw - c.st.Tw; if (c.added && Math.abs(d) > Math.abs(c.ext - c.st.Tw)) c.ext = c.Tw;
  }
  const read = T => Math.round(T * 10) / 10;
  /* drawing */
  function draw(c, T, o = {}) {
    const st = c.st, m = MET[st.what], r = RXN[st.what], warm = Math.max(-1, Math.min(1, (c.Tw - 25) / 30));
    let g = `<rect width="1000" height="620" fill="#22313a"/><rect y="520" width="1000" height="100" fill="#3a4a54"/><rect x="40" y="500" width="600" height="22" rx="6" fill="#5a6a74"/>`;
    const cx = 330, top = 170, foam = st.cup === 'foam';
    g += `<path d="M${cx - 150},${top} L${cx - 130},500 L${cx + 130},500 L${cx + 150},${top}Z" fill="${foam ? '#f4f1e8' : '#cfe7f5'}" fill-opacity="${foam ? 1 : .35}" stroke="${foam ? '#cfc8b4' : '#9fc6e0'}" stroke-width="5"/>
      ${foam ? `<path d="M${cx - 132},${top + 10} L${cx - 116},488 L${cx + 116},488 L${cx + 132},${top + 10}Z" fill="#e8e2d2"/>` : ''}
      <path d="M${cx - 128},${290} L${cx - 116},486 L${cx + 116},486 L${cx + 128},${290}Z" fill="rgb(${Math.round(120 + warm * 110)},${Math.round(180 - Math.abs(warm) * 40)},${Math.round(235 - warm * 120)})" opacity="${foam ? .55 : .8}"/>
      <rect x="${cx - 165}" y="${top - 26}" width="330" height="26" rx="8" fill="${foam ? '#e8e2d2' : '#b8cfdd'}"/>`;
    /* stirrer and thermometer */
    g += `<line x1="${cx + 60 + Math.sin(T * 6) * 10}" y1="${top - 80}" x2="${cx + 60 + Math.sin(T * 6) * 10}" y2="470" stroke="#8a95a0" stroke-width="5"/><circle cx="${cx + 60 + Math.sin(T * 6) * 10}" cy="470" r="10" fill="none" stroke="#8a95a0" stroke-width="4"/>
      <rect x="${cx - 30}" y="${top - 120}" width="16" height="340" rx="8" fill="#fff" stroke="#9aa8b8" stroke-width="2"/><rect x="${cx - 26}" y="${top + 210 - Math.max(6, Math.min(320, (c.Tw + 5) / 105 * 320))}" width="8" height="${Math.max(6, Math.min(320, (c.Tw + 5) / 105 * 320))}" fill="#e5484d"/><circle cx="${cx - 22}" cy="${top + 222}" r="12" fill="#e5484d"/>`;
    if (m && c.added) g += `<rect x="${cx - 90}" y="${420}" width="60" height="44" rx="6" fill="${m[2]}" stroke="#fff" stroke-opacity=".5"/>${c.To - c.Tw > 2 ? [0, 1, 2].map(i => `<path d="M${cx - 76 + i * 14},${414} q5,-10 0,-20" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/>`).join('') : ''}`;
    if (m && !c.added) g += `<g transform="translate(${cx - 220} 60)"><rect width="70" height="50" rx="6" fill="${m[2]}"/><text x="35" y="70" font-size="12" fill="#fff" text-anchor="middle">${f(st.mo)} g at ${f(st.To)} °C</text></g>`;
    if (r && c.added) { const fr = c.rel / (c.Q || 1); for (let i = 0; i < Math.round((1 - fr) * 12); i++) g += `<circle cx="${cx - 80 + SimLab.hash(i) * 160}" cy="${470 - ((T * 30 + i * 20) % 140)}" r="4" fill="#fff" opacity=".8"/>`; }
    const dT = c.Tw - st.Tw, q = (c.Cw) * (c.ext - st.Tw);
    g += SimLab.hud(680, 30, 300, [['Thermometer', `${read(c.Tw).toFixed(1)} °C`, '#ff8a8a'], ['Starting water', `${f(st.mw)} g at ${f(st.Tw, 1)} °C`], [m ? 'Metal' : r ? 'Reaction' : 'Added water', m ? `${f(st.mo)} g ${m[0].toLowerCase()} at ${f(st.To)} °C` : r ? `${f(st.n, 3)} mol ${r[0].split('(')[0]}` : `${f(st.mo)} g at ${f(st.To)} °C`], ['Highest / lowest', c.added ? `${read(c.ext).toFixed(1)} °C` : '—', '#ffd27a'], ['Cup', foam ? 'foam (insulated)' : 'glass beaker'], ['Time', `${f(c.t)} s`]], 'Calorimeter')
      + SimLab.chart(696, 230, 268, 140, [{ d: c.hist, c: '#ff8a8a', n: 'temperature (°C)' }], { ymax: Math.max(40, ...c.hist) * 1.08, xs: 121, title: 'Temperature over 120 s' })
      + `<text x="696" y="440" font-size="12" fill="#a9b6cc">ΔT so far: ${c.added ? (dT >= 0 ? '+' : '') + f(read(c.ext) - st.Tw, 1) : '—'} °C</text>`;
    return g + (o.extra || '');
  }
  function cal(st, cfg = {}) {
    let c = setup(st), T = 0, acc = 0;
    SimLab.stage('', (g, dt) => { T += dt; if (c.added && !c.done) { const sdt = dt * 6; for (let k = 0; k < 6; k++) step(c, sdt / 6); acc += sdt; while (acc >= 1) { acc -= 1; c.hist.push(c.Tw); } if (c.t - c.t0 >= 120) { c.done = true; SND.ok(); cfg.onEnd && cfg.onEnd(c); } } g.innerHTML = draw(c, T, { extra: cfg.extra ? cfg.extra(c) : '' }); });
    return { c: () => c, reset() { c = setup(st); }, go() { if (c.added) c = setup(st); add(c); SND.pop(); } };
  }
  const near = (v, want, tol) => Math.abs(v - want) <= tol;

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'mix', name: 'Mixing water', title: 'Hot meets cold', html: 'Heat flows from hot to cold until both are the same temperature. <b>Predict the final temperature</b> when <b>100 g at 80 °C</b> is poured into <b>100 g at 20 °C</b>. Then run it. Then try <b>50 g at 80 °C</b> into <b>150 g at 20 °C</b>.', hint: 'Equal masses of water meet halfway. With unequal masses, the final temperature is closer to the bigger mass’s temperature: (50×80 + 150×20) / 200.' },
    { id: 'metal', name: 'Specific heat', title: 'The mystery metal', html: 'A <b>100 g</b> lump of an unknown metal at <b>100 °C</b> is dropped into <b>100 g</b> of water at <b>20 °C</b>. Run it, then use the data:<br>1. Heat gained by the water: q = m c ΔT (c = 4.18 J/g·°C)<br>2. The metal lost the same heat, so c(metal) = q ÷ (m × ΔT of the metal)', hint: 'ΔT of the water = final − 20. ΔT of the metal = 100 − final. Ignore the cup’s small heat capacity.' },
    { id: 'rxn', name: 'Enthalpy', title: 'Heat of reaction', html: 'Dissolve <b>0.050 mol</b> of solid NaOH in <b>100 g</b> of water at <b>20 °C</b>. Find q for the water, then <b>ΔH in kJ/mol</b> = −q ÷ n. Then dissolve <b>NH₄NO₃</b> and compare.', hint: 'q = 100 × 4.18 × ΔT (in J). Divide by 1000 for kJ, then by 0.050 mol. ΔH is negative if the water warmed up.' },
    { id: 'cup', name: 'Heat loss', title: 'Why a foam cup?', html: 'Repeat the NaOH experiment in a <b>glass beaker</b> and compare the highest temperature with the foam cup. Watch what happens after the peak.', hint: 'Heat leaks out through glass much faster than through foam.' }
  ];
  const S = {
    mix: R => { const st = fresh({ what: 'hot', mw: 100, Tw: 20, mo: 100, To: 80 }); let p1 = false, a = false, b = false;
      LabUI.html(XLab.numIn('mxP', 'Predicted final temperature', '°C'));
      $('#mxPB').onclick = () => { const v = +$('#mxP').value; const want = st.mo === 100 ? 50 : 35; if (near(v, want, 1.5)) { p1 = true; K.msg('Good prediction. Now test it.', 'ok', 2000); } else { R.mistake('Mixing prediction', 'Final T = (m₁T₁ + m₂T₂) ÷ (m₁ + m₂) for water.'); K.msg('Use the weighted average of the two temperatures.', 'bad', 2600); } G.check(); };
      const C = cal(st, { onEnd: c => { const fT = read(c.ext); XLab.note(`${st.mo} g at 80 °C + ${st.mw} g at 20 °C → ${fT.toFixed(1)} °C.`); if (st.mo === 100) a = true; else b = true; G.check(); } });
      SimLab.panel(st, [{ btns: [{ id: 'g1', label: 'Pour 100 g into 100 g', cls: 'primary', fn: () => { Object.assign(st, { mo: 100, mw: 100 }); C.reset(); C.go(); } }, { id: 'g2', label: 'Pour 50 g into 150 g', fn: () => { if (!a) { K.msg('Do the first one first.', 'bad', 1600); return; } Object.assign(st, { mo: 50, mw: 150 }); C.reset(); C.go(); } }] }]);
      const G = SimLab.goals(R, { name: 'Mixing', items: () => [[p1, 'Predict the final temperature for 100 g + 100 g'], [a, 'Run 100 g + 100 g'], [b, 'Run 50 g + 150 g']],
        q: { q: 'In the 50 g + 150 g mix, the hot water cooled by 45 °C but the cold water warmed by only 15 °C. Why?', a: ['The same amount of heat spread over 3× the mass gives 1/3 of the temperature change', 'Heat was lost to the room', 'Cold water absorbs heat poorly', 'Temperature isn’t conserved'], c: 0, e: '<b>Heat lost = heat gained</b>: 50 × 4.18 × 45 = 150 × 4.18 × 15 = 9,400 J. Temperature change depends on how much mass the heat is spread over.' } }); },
    metal: R => { const st = fresh({ what: 'Zn', mw: 100, Tw: 20, mo: 100, To: 100 }); let ran = false, qOk = false, cOk = false, idOk = false, Tf = null;
      const C = cal(st, { onEnd: c => { ran = true; Tf = read(c.ext); XLab.note(`100 g metal at 100 °C + 100 g water at 20 °C → ${Tf.toFixed(1)} °C.`); G.check(); } });
      SimLab.panel(st, [{ btns: [{ id: 'go', label: 'Drop the metal in', cls: 'primary', fn: () => C.go() }] }]);
      LabUI.html(XLab.numIn('mtQ', 'q gained by water', 'J') + XLab.numIn('mtC', 'c of the metal', 'J/g·°C'));
      $('#mtQB').onclick = () => { if (!ran) { K.msg('Run it first.', 'bad', 1500); return; } const want = 100 * 4.184 * (Tf - 20), v = +$('#mtQ').value; if (Math.abs(v - want) <= Math.abs(want) * .06 + 20) { qOk = true; K.msg(`Yes: q = 100 × 4.18 × ${f(Tf - 20, 1)} ≈ ${f(want)} J`, 'ok', 3000); XLab.note(`Water gained q ≈ ${f(want)} J.`); } else { R.mistake('q = mcΔT', 'q = mass × 4.18 × (final − initial temperature of the water).'); K.msg('Use q = m × c × ΔT for the water.', 'bad', 2600); } G.check(); };
      $('#mtCB').onclick = () => { if (!qOk) { K.msg('Find q first.', 'bad', 1500); return; } const want = 100 * 4.184 * (Tf - 20) / (100 * (100 - Tf)), v = +$('#mtC').value; if (Math.abs(v - want) <= want * .1) { cOk = true; K.msg(`c ≈ ${f(want, 3)} J/g·°C`, 'ok', 2600); XLab.note(`Specific heat of the metal ≈ ${f(want, 3)} J/g·°C.`); } else { R.mistake('Specific heat', 'c = q ÷ (m × ΔT) using the metal’s mass and its temperature change (100 − final).'); K.msg('Divide q by (100 g × the metal’s ΔT).', 'bad', 2600); } G.check(); };
      XLab.choiceIn('Which metal is it? (Cu 0.385 · Al 0.897 · Fe 0.449 · Pb 0.129 · Zn 0.388)', ['Copper or zinc', 'Aluminum', 'Iron', 'Lead'], i => { if (!cOk) { K.msg('Calculate c first.', 'bad', 1500); return; } if (i === 0) { idOk = true; K.msg('Right: about 0.39 J/g·°C. (It’s zinc: 0.388.) Copper is so close that this method can’t tell them apart.', 'ok', 4500); } else R.mistake('Identifying the metal', 'Compare your c with the table: about 0.39 matches copper or zinc.'); G.check(); });
      const G = SimLab.goals(R, { name: 'Specific heat', items: () => [[ran, 'Run the experiment'], [qOk, 'Calculate q for the water'], [cOk, 'Calculate c for the metal'], [idOk, 'Identify the metal']],
        q: { q: 'The metal cooled by about 70 °C but the water only warmed by about 7 °C. Why?', a: ['Water has a much higher specific heat, so it needs far more energy per degree', 'The metal was heavier', 'Heat was destroyed', 'Metals don’t hold heat'], c: 0, e: 'Water’s specific heat (4.18 J/g·°C) is about 10× that of most metals, so the same energy changes the water’s temperature far less. That’s why water is used for cooling and why coastal climates are mild.' } }); },
    rxn: R => { const st = fresh({ what: 'NaOH', mw: 100, Tw: 20, n: .05 }); let ran = false, hOk = false, endo = false, dT = null;
      const pk = LabUI.html(`<div class="pl-pred"><label>Solid to dissolve</label><div class="sim-pick"><button class="btn sm on" data-rx="NaOH">NaOH</button><button class="btn sm" data-rx="NH4NO3">NH₄NO₃</button></div></div>`);
      $$('[data-rx]', pk).forEach(b => b.onclick = () => { st.what = b.dataset.rx; $$('[data-rx]', pk).forEach(x => x.classList.toggle('on', x === b)); C.reset(); });
      const C = cal(st, { onEnd: c => { const d = read(c.ext) - 20; if (st.what === 'NaOH') { ran = true; dT = d; XLab.note(`0.050 mol NaOH in 100 g water: ΔT = +${f(d, 1)} °C.`); } else { endo = true; XLab.note(`0.050 mol NH₄NO₃ in 100 g water: ΔT = ${f(d, 1)} °C (it got colder: endothermic).`); } G.check(); } });
      SimLab.panel(st, [{ btns: [{ id: 'go', label: 'Add the solid and stir', cls: 'primary', fn: () => C.go() }] }]);
      LabUI.html(XLab.numIn('rxH', 'ΔH for NaOH dissolving', 'kJ/mol'));
      $('#rxHB').onclick = () => { if (!ran) { K.msg('Run the NaOH experiment first.', 'bad', 1500); return; } const want = -(100 * 4.184 * dT) / 1000 / .05, v = +$('#rxH').value; if (Math.abs(v - want) <= Math.abs(want) * .1) { hOk = true; K.msg(`ΔH ≈ ${f(want, 1)} kJ/mol (accepted value −44.5)`, 'ok', 3200); XLab.note(`Calculated ΔH(NaOH) ≈ ${f(want, 1)} kJ/mol.`); } else { R.mistake('Calculating ΔH', 'ΔH = −q ÷ n, with q = 100 × 4.18 × ΔT in kJ (÷ 1000). Exothermic means negative.'); K.msg(v > 0 && Math.abs(v + want) <= Math.abs(want) * .1 ? 'Check the sign: the water warmed up, so the reaction released heat (negative ΔH).' : 'q = 100 × 4.18 × ΔT J; ÷1000 for kJ; ÷0.050 mol; then make it negative.', 'bad', 3500); } G.check(); };
      const G = SimLab.goals(R, { name: 'Enthalpy', items: () => [[ran, 'Dissolve NaOH'], [hOk, 'Calculate ΔH (within 10 %)'], [endo, 'Dissolve NH₄NO₃']],
        q: { q: 'Dissolving NH₄NO₃ made the water colder. Its ΔH is…', a: ['Positive: the process absorbs heat from the water (endothermic)', 'Negative: it releases heat', 'Zero', 'It depends on the cup'], c: 0, e: 'The system (the dissolving salt) takes energy from its surroundings (the water), so the water cools. Endothermic processes have positive ΔH. Instant cold packs use exactly this.' } }); },
    cup: R => { const st = fresh({ what: 'NaOH', mw: 100, Tw: 20, n: .05, cup: 'foam' }), res = {};
      const pk = LabUI.html(`<div class="pl-pred"><label>Container</label><div class="sim-pick"><button class="btn sm on" data-cp="foam">Foam cup</button><button class="btn sm" data-cp="glass">Glass beaker</button></div></div>`);
      $$('[data-cp]', pk).forEach(b => b.onclick = () => { st.cup = b.dataset.cp; $$('[data-cp]', pk).forEach(x => x.classList.toggle('on', x === b)); C.reset(); });
      const C = cal(st, { onEnd: c => { res[st.cup] = read(c.ext); XLab.note(`${st.cup === 'foam' ? 'Foam cup' : 'Glass beaker'}: highest temperature ${read(c.ext).toFixed(1)} °C, then ${read(c.Tw).toFixed(1)} °C after 2 min.`); G.check(); } });
      SimLab.panel(st, [{ btns: [{ id: 'go', label: 'Add 0.050 mol NaOH and stir', cls: 'primary', fn: () => C.go() }] }]);
      const G = SimLab.goals(R, { name: 'Heat loss', items: () => [[res.foam != null, 'Run in the foam cup'], [res.glass != null, 'Run in the glass beaker']],
        q: { q: 'A student used a glass beaker and calculated ΔH = −38 kJ/mol instead of −44.5. What is the most likely reason?', a: ['Heat escaped to the room, so the measured ΔT (and q) was too small', 'The NaOH was too pure', 'Glass releases extra heat', 'The thermometer read too high'], c: 0, e: 'Calorimetry assumes all the heat stays in the water. Glass conducts heat away (and absorbs some itself), so the temperature rise is smaller and |ΔH| comes out too low. A lid and foam cup reduce this <b>systematic error</b>.' } }); }
  };
  const quiz = [
    { q: 'How much heat warms 200 g of water from 20 °C to 30 °C? (c = 4.18 J/g·°C)', a: ['8,360 J', '836 J', '41.8 J', '25,080 J'], c: 0, e: 'q = mcΔT = 200 × 4.18 × 10 = 8,360 J.' },
    { q: 'Equal masses of aluminum (c = 0.90) and iron (c = 0.45) get the same heat. Which warms more?', a: ['Iron: lower specific heat means a bigger temperature change', 'Aluminum', 'Both the same', 'Neither'], c: 0, e: 'ΔT = q ÷ (mc). Half the specific heat gives double the temperature change.' },
    { q: 'An exothermic reaction in a calorimeter will…', a: ['Raise the water’s temperature; ΔH is negative', 'Lower the water’s temperature; ΔH is negative', 'Raise the temperature; ΔH is positive', 'Not change the temperature'], c: 0, e: 'Exothermic reactions release heat into the water. By convention their ΔH is negative.' },
    { q: 'In a closed calorimeter, heat lost by the hot metal equals…', a: ['Heat gained by the water (and cup)', 'The metal’s mass', 'Zero', 'The heat of the room'], c: 0, e: 'Energy is conserved: q(lost) = −q(gained).' },
    { q: 'Why do we stir the calorimeter?', a: ['So the temperature is the same throughout before reading it', 'To add energy', 'To cool the water', 'To dissolve the thermometer'], c: 0, e: 'Stirring spreads the heat evenly so the thermometer reads the true average temperature.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Choose what to add, set the amounts and temperatures, and run a 2-minute trial. Each trial is <b>recorded automatically</b>.',
    fresh: () => fresh({ what: 'Cu', To: 100 }),
    vars: [{ k: 'mw', label: 'Water in the cup', short: 'Water', min: 50, max: 250, step: 10, unit: 'g', d: 0, fmt: v => v + ' g' }, { k: 'Tw', label: 'Water starting temperature', short: 'T water', min: 5, max: 60, step: 1, unit: '°C', d: 0, fmt: v => v + ' °C' }, { k: 'mo', label: 'Metal or hot-water mass', short: 'Mass added', min: 20, max: 300, step: 10, unit: 'g', d: 0, fmt: v => v + ' g' }, { k: 'To', label: 'Its starting temperature', short: 'T added', min: 20, max: 200, step: 5, unit: '°C', d: 0, fmt: v => v + ' °C' }, { k: 'n', label: 'Moles of reactant', short: 'Moles', min: .01, max: .2, step: .01, unit: 'mol', d: 2, fmt: v => f(v, 2) + ' mol' }],
    cats: [{ k: 'what', label: 'Add', opts: [['hot', 'Hot water'], ['Cu', 'Copper'], ['Al', 'Aluminum'], ['Fe', 'Iron'], ['Pb', 'Lead'], ['NaOH', 'NaOH'], ['NH4NO3', 'NH₄NO₃'], ['neut', 'HCl + NaOH']] }, { k: 'cup', label: 'Cup', opts: [['foam', 'Foam'], ['glass', 'Glass']] }],
    measures: [{ k: 'Tf', label: 'Highest or lowest temperature', short: 'Peak T', unit: '°C', d: 1 }, { k: 'dT', label: 'Water temperature change', short: 'ΔT water', unit: '°C', d: 1 }, { k: 'q', label: 'Heat gained by the water', short: 'q water', unit: 'J', d: 0 }, { k: 'dH', label: 'ΔH (reactions only)', short: 'ΔH', unit: 'kJ/mol', d: 1 }],
    noRecord: true,
    ideas: [['How does the moles of NaOH affect the temperature change?', 'n', 'dT'], ['How does the metal’s starting temperature affect the heat it gives the water?', 'To', 'q'], ['How does the amount of water affect the temperature change?', 'mw', 'dT']],
    expect(x, y) {
      if (x === 'n' && y === 'dH') return { t: 'flat', why: 'ΔH is per mole, so it shouldn’t depend on how much you use. Any change in your data comes from heat loss.' };
      if (x === 'n') return { t: 'up', why: 'Twice the moles release (or absorb) twice the heat, so ΔT doubles: q = n × ΔH. For NH₄NO₃ the change is a drop, so it becomes more negative.' };
      if (x === 'To') return { t: 'up', why: 'A hotter object has more heat to give: q = m c ΔT, and its ΔT (from its start to the final temperature) grows with its starting temperature.' };
      if (x === 'mo') return { t: 'levels', why: 'More metal carries more heat, but the final temperature can never go above the metal’s starting temperature, so the curve bends.' };
      if (x === 'mw') return y === 'q' ? { t: 'flat', why: 'For a reaction, the heat released doesn’t depend on the water: the same q spreads over more mass.' } : { t: 'down', why: 'The same heat spread over more water gives a smaller temperature change: ΔT = q ÷ (m c).' };
      if (x === 'Tw') return { t: 'down', why: 'Warmer water is closer to the hot object’s temperature, so less heat flows into it.' };
      return null;
    },
    setup(F) {
      const C = cal(F.st, { onEnd: c => { const st = F.st, dT = read(c.ext) - st.Tw, q = (st.mw * CW) * dT; F.add({ Tf: read(c.ext), dT, q, dH: RXN[st.what] ? -q / 1000 / st.n : NaN }); } });
      F.onChange(() => C.reset());
      const b = LabUI.html('<div class="row sim-btns"><button class="btn sm primary" id="caGo">Add and stir (2 min)</button><button class="btn sm" id="caRs">Fresh cup</button></div>');
      $('#caGo', b).onclick = () => C.go(); $('#caRs', b).onclick = () => C.reset();
    }
  };

  /* ═════ Game: one-shot design challenges. Calculate, then run; each extra try costs a star ═════ */
  function challenge(G, o) {
    const st = fresh(o.st); let tries = 0;
    const C = cal(st, { onEnd: c => { tries++; const v = o.measure(c); if (Math.abs(v - o.want) <= o.tol) G.win(tries === 1 ? 3 : tries === 2 ? 2 : 1, 1500 - tries * 300 + (o.tol - Math.abs(v - o.want)) * 200, `${o.label}: ${f(v, 1)} ${o.unit} (target ${o.want} ± ${o.tol}). ${o.why}`); else if (tries >= 3) G.lose('Out of tries', `${o.label}: ${f(v, 1)} ${o.unit}, target ${o.want} ± ${o.tol}. ${o.why}`); else K.msg(`${f(v, 1)} ${o.unit}: missed (target ${o.want} ± ${o.tol}). ${3 - tries} tries left.`, 'bad', 3500); },
      extra: () => `<g transform="translate(40 20)"><rect width="600" height="40" rx="10" fill="#0b1020" fill-opacity=".85"/><text x="14" y="26" font-size="15" font-weight="800" fill="#ffd27a">Target: ${o.label} ${o.want} ± ${o.tol} ${o.unit}</text><text x="586" y="26" font-size="14" font-weight="800" fill="#fff" text-anchor="end">Try ${Math.min(3, tries + 1)} of 3</text></g>` });
    if (o.sync) o.sync(st); G.panel(st, o.items.concat([{ btns: [{ id: 'go', label: 'Run it', cls: 'primary', fn: () => { C.reset(); C.go(); } }] }]), () => { if (o.sync) o.sync(st); C.reset(); });
  }
  const game = {
    title: 'Thermal Reactor', intro: 'Design each mixture on paper first, then run it. You get three tries; the first try earns three stars.',
    cover: () => `<rect width="1000" height="620" fill="#22313a"/>${labThumb('calorimetry').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Thermal Reactor</text><text x="500" y="540" font-size="18" fill="#cfe0f2" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Baby’s bath', goal: 'Mix hot water (70 °C) into cold water (15 °C) to make <b>200 g</b> of bath water at <b>37 °C</b>. Choose the amount of hot water; the rest is cold.', hint: 'Heat lost by hot = heat gained by cold: m(70 − 37) = (200 − m)(37 − 15).', setup: G => { const st0 = { what: 'hot', mw: 100, Tw: 15, mo: 100, To: 70 }; challenge(G, { st: st0, sync: s => { s.mw = 200 - s.mo; }, items: [{ k: 'mo', label: 'Hot water (cold = 200 − hot)', min: 10, max: 190, step: 1, fmt: v => `${v} g hot + ${200 - v} g cold` }], want: 37, tol: .6, unit: '°C', label: 'Bath temperature', measure: c => read(c.ext), why: 'm × 33 = (200 − m) × 22 gives m = 80 g of hot water.' }); } },
      { name: 'Hand warmer', goal: 'Design a hot pack: dissolve NaOH in <b>100 g</b> of water at 20 °C to reach <b>32 °C</b>. How many moles?', hint: 'q = 100 × 4.18 × 12 ≈ 5,000 J; n = q ÷ 44,500 J/mol.', setup: G => challenge(G, { st: { what: 'NaOH', mw: 100, Tw: 20, n: .05 }, items: [{ k: 'n', label: 'Moles of NaOH', min: .01, max: .2, step: .002, fmt: v => f(v, 3) + ' mol' }], want: 32, tol: .6, unit: '°C', label: 'Highest temperature', measure: c => read(c.ext), why: 'n = 100 × 4.18 × 12 ÷ 44,500 ≈ 0.113 mol.' }) },
      { name: 'Cold pack', goal: 'Cool <b>100 g</b> of water from 20 °C to <b>8 °C</b> with NH₄NO₃ (ΔH = +25.7 kJ/mol).', hint: 'q = 100 × 4.18 × 12 ≈ 5,000 J absorbed; n = 5,000 ÷ 25,700.', setup: G => challenge(G, { st: { what: 'NH4NO3', mw: 100, Tw: 20, n: .05 }, items: [{ k: 'n', label: 'Moles of NH₄NO₃', min: .01, max: .4, step: .002, fmt: v => f(v, 3) + ' mol' }], want: 8, tol: .6, unit: '°C', label: 'Lowest temperature', measure: c => read(c.ext), why: 'n = 100 × 4.18 × 12 ÷ 25,700 ≈ 0.195 mol.' }) },
      { name: 'Metal quench', goal: 'Drop a <b>150 g</b> aluminum block (c = 0.897) at <b>120 °C</b> into water at 20 °C. Choose the mass of water so it ends at <b>35 °C</b>.', hint: '150 × 0.897 × (120 − 35) = m × 4.18 × (35 − 20).', setup: G => challenge(G, { st: { what: 'Al', mw: 100, Tw: 20, mo: 150, To: 120 }, items: [{ k: 'mw', label: 'Water mass', min: 50, max: 400, step: 5, fmt: v => v + ' g' }], want: 35, tol: .7, unit: '°C', label: 'Final temperature', measure: c => read(c.ext), why: 'm = 150 × 0.897 × 85 ÷ (4.18 × 15) ≈ 182 g.' }) }
    ]
  };
  const finale = () => { const st = fresh({ what: 'Cu', To: 100 }); cal(st).go(); };
  XLab.define({ id: 'calorimetry', guided: { steps, S, quiz, finale, finaleMsg: 'Measurements complete. Now check your thinking.', summary: () => 'You predicted mixing temperatures, used q = mcΔT to find a metal’s specific heat, measured ΔH for exothermic and endothermic processes, and saw how heat loss causes error.' }, free, game });
})();
