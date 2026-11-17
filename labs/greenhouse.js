/* ═══════════ HS Biology: "Photosynthesis: Greenhouse Tycoon" ═══════════
   Model (per plant bench, rates in O₂ bubbles per minute, like counting bubbles from pondweed):
     light factor  fL = I/(I + 250)·1.25      (I = light intensity in µmol photons/m²/s, 0–1500; saturates)
     CO₂ factor    fC = C/(C + 380)·1.4       (C = CO₂ in ppm, 0–1500; air is about 420)
     water factor  fW = min(1, W/45)          (W = soil water %; dry soil closes the stomata, so less CO₂ gets in)
     temperature   fT = enzyme curve: peaks at 25 °C, falls on both sides, near 0 above 42 °C (enzymes denature)
     gross photosynthesis  P = 60·min(fL, fC, fW, 1)·fT     → the factor in shortest supply limits the rate (Blackman)
     respiration           R = 4·2^((T − 20)/10)            → goes on day and night, faster when warm (Q₁₀ ≈ 2)
     net O₂ release        N = P − R                        (negative in the dark: the plant uses O₂)
   Overall: 6CO₂ + 6H₂O --light--> C₆H₁₂O₆ + 6O₂. */
(() => {
  const K = Kit, f = SimLab.f;
  const fL = I => Math.min(1.2, I / (I + 250) * 1.25), fC = C => Math.min(1.2, C / (C + 380) * 1.4), fW = W => Math.min(1, W / 45);
  const fT = T => T >= 45 ? 0 : Math.exp(-(((T - 25) / (T > 25 ? 8.5 : 11)) ** 2)) * (T > 38 ? Math.max(0, (45 - T) / 7) : 1);
  function rates(s) {
    const L = fL(s.I), C = fC(s.C), W = fW(s.W), lim = Math.min(L, C, W, 1), T = fT(s.T);
    const P = 60 * lim * T, R = 4 * 2 ** ((s.T - 20) / 10), by = [['light', L], ['CO₂', C], ['water', W]].sort((a, b) => a[1] - b[1])[0];
    const limName = T < .5 && lim * T < .6 * Math.max(.01, lim) ? 'temperature' : by[1] >= 1 ? (T < .9 ? 'temperature' : 'none (enzymes at full speed)') : by[0];
    return { P, R, N: P - R, L, C, W, T, lim: limName };
  }
  const fresh = o => Object.assign({ I: 600, C: 420, T: 22, W: 70 }, o || {});
  const noisy = v => v * (1 + (Math.random() - .5) * .06) + (Math.random() - .5) * .4;

  /* the greenhouse: sun or lamps, plants whose size follows their biomass, O₂ bubbles at the net rate */
  function house(s, r, o) {
    const T = o.t, sun = Math.min(1, s.I / 1200), bm = o.bm || 1, hot = s.T > 32, cold = s.T < 12;
    let g = `<defs><linearGradient id="ghSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.I < 60 ? '#0b1a33' : `hsl(205 ${40 + sun * 30}% ${30 + sun * 42}%)`}"/><stop offset="1" stop-color="${s.I < 60 ? '#14284a' : '#cfe9ff'}"/></linearGradient></defs>
      <rect width="1000" height="620" fill="url(#ghSky)"/>`;
    if (s.I >= 60) g += `<circle cx="120" cy="90" r="${34 + sun * 16}" fill="#ffd34d" opacity="${.35 + sun * .65}"/>${Array.from({ length: 6 }, (_, i) => `<line x1="120" y1="90" x2="${200 + i * 70}" y2="${200 + i * 28}" stroke="#ffd34d" stroke-width="${2 + sun * 4}" opacity="${sun * .35}"/>`).join('')}`;
    else g += Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 137) % 1000}" cy="${(i * 71) % 200}" r="1.4" fill="#fff" opacity=".7"/>`).join('');
    g += `<path d="M40,560 L40,230 L330,110 L620,230 L620,560Z" fill="#e8f7ff" fill-opacity=".28" stroke="#9cc2dc" stroke-width="5"/><line x1="330" y1="110" x2="330" y2="560" stroke="#9cc2dc" stroke-width="3"/><line x1="40" y1="300" x2="620" y2="300" stroke="#9cc2dc" stroke-width="2"/>
      <rect y="556" width="1000" height="64" fill="#6d4a30"/><rect x="60" y="500" width="540" height="56" rx="6" fill="#8a5a3a"/><rect x="60" y="500" width="540" height="14" fill="#5b3b24" opacity="${1 - Math.min(1, s.W / 100) * .7}"/>`;
    /* plants: 5 stems, height from biomass, droop when dry or cooked */
    const droop = s.W < 25 ? (25 - s.W) / 25 : s.T > 40 ? .6 : 0, hgt = 60 + Math.min(1, Math.log(1 + bm) / Math.log(30)) * 200, col = r.T < .3 ? '#8a9a3a' : '#2f9a3f';
    for (let i = 0; i < 5; i++) { const x = 120 + i * 105, h = hgt * (.85 + SimLab.hash(i) * .3), bend = droop * 40 * (i % 2 ? 1 : -1), sw = Math.sin(T * 1.2 + i) * 3;
      g += `<path d="M${x},500 Q${x + bend * .3 + sw},${500 - h * .5} ${x + bend + sw},${500 - h}" stroke="${col}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      for (let k = 1; k <= 4; k++) { const ly = 500 - h * k / 4.6, lx = x + bend * (k / 4) + sw, side = k % 2 ? 1 : -1;
        g += `<ellipse cx="${lx + side * 22}" cy="${ly}" rx="${22 + bm * .1 > 30 ? 30 : 22}" ry="9" fill="${col}" transform="rotate(${side * (25 + droop * 40)} ${lx + side * 22} ${ly})"/>`; }
      if (bm > 8) g += `<circle cx="${x + bend + sw}" cy="${500 - h - 6}" r="9" fill="#ff6b8a"/>`; }
    /* O₂ bubbles: one stream per plant, rate = net O₂ */
    const n = Math.max(0, r.N);
    if (n > .3) for (let i = 0; i < 5; i++) for (let k = 0; k < Math.min(6, 1 + n / 8); k++) { const ph = ((T * (.25 + n / 120) + k / 6 + i * .17) % 1), x = 120 + i * 105 + Math.sin(ph * 9 + i) * 8, y = 500 - hgt * .8 - ph * 180;
      g += `<circle cx="${x}" cy="${y}" r="${3 + ph * 3}" fill="#fff" fill-opacity="${.85 - ph * .6}" stroke="#9fd0ea" stroke-width="1"/>`; }
    if (r.N < -.3) g += `<text x="330" y="270" font-size="15" font-weight="800" fill="#ffd27a" text-anchor="middle">No light: the plants only respire (they take in O₂)</text>`;
    /* equipment */
    if (o.lamps) g += `<g transform="translate(150 240)">${[0, 1, 2].map(i => `<rect x="${i * 130}" y="0" width="90" height="12" rx="4" fill="#444"/><rect x="${i * 130 + 6}" y="12" width="78" height="6" fill="#fff6c4" opacity="${Math.min(1, o.lamps / 3)}"/>`).join('')}</g>`;
    g += `<g transform="translate(560 420)"><rect width="34" height="80" rx="8" fill="#7d8fa3"/><text x="17" y="46" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">CO₂</text><rect x="10" y="-12" width="14" height="12" fill="#555"/></g>
      <g transform="translate(70 330)"><rect x="-6" y="0" width="12" height="120" rx="6" fill="#fff" stroke="#7a8a9a"/><rect x="-3" y="${120 - Math.max(4, Math.min(116, (s.T + 5) / 55 * 116))}" width="6" height="${Math.max(4, Math.min(116, (s.T + 5) / 55 * 116))}" fill="${hot ? '#e5484d' : cold ? '#4f8ff7' : '#ff8a3c'}"/><circle cy="124" r="10" fill="${hot ? '#e5484d' : cold ? '#4f8ff7' : '#ff8a3c'}"/></g>`;
    if (o.extra) g += o.extra;
    return g;
  }
  function panelHud(s, r, extra = '') {
    const bars = [['Light', r.L, '#ffd34d'], ['CO₂', r.C, '#9fb0c2'], ['Water', r.W, '#4f8ff7'], ['Enzymes (temp.)', r.T, '#ff8a3c']];
    const minI = bars.slice(0, 3).reduce((a, b, i) => b[1] < bars[a][1] ? i : a, 0);
    return SimLab.hud(650, 30, 330, [['Light', `${f(s.I)} µmol/m²/s`], ['CO₂', `${f(s.C)} ppm`], ['Temperature', `${f(s.T)} °C`], ['Soil water', `${f(s.W)} %`], ['Photosynthesis', `${f(r.P, 1)} /min`, '#7ee0a1'], ['Respiration', `${f(r.R, 1)} /min`, '#ffb37a'], ['Net O₂ bubbles', `${f(r.N, 1)} /min`, r.N >= 0 ? '#7ee0a1' : '#ff8a8a']], 'Greenhouse sensors')
      + `<g transform="translate(650 228)"><rect width="330" height="${40 + bars.length * 30}" rx="8" fill="#0b1020" fill-opacity=".74"/><text x="12" y="22" font-size="13" font-weight="700" fill="#fff">What’s limiting the rate?</text>
        ${bars.map(([n, v, c], i) => SimLab.bar(12, 50 + i * 30, 230, Math.min(1, v), c, n + (i === minI && r.lim === bars[minI][0].replace('Light', 'light').replace('Water', 'water') ? '  ◀ LIMITING' : i === 3 && r.lim === 'temperature' ? '  ◀ LIMITING' : ''), f(Math.min(1, v) * 100) + '%')).join('')}</g>` + extra;
  }

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'light', name: 'Light', title: 'Count the bubbles', html: 'Your greenhouse plants give off <b>oxygen</b> as they photosynthesize. The sensor counts <b>O₂ bubbles per minute</b>.<br><br><b>Predict</b> how the rate changes with light, then record the rate at <b>at least four</b> light levels, including one above 1000.', hint: 'Move the light slider, then press Record. Try 100, 300, 600 and 1200.' },
    { id: 'limit', name: 'Limiting factor', title: 'Find the limiting factor', html: 'The lamps are at full power, but the plants are slow. Look at the <b>limiting</b> bars. <b>Fix the greenhouse</b> so the plants make at least <b>40 bubbles/min</b>.', hint: 'Only raising the factor in shortest supply speeds things up. The CO₂ is very low.' },
    { id: 'temp', name: 'Temperature', title: 'Too hot to work', html: 'Photosynthesis is run by <b>enzymes</b>. Set the temperature to <b>42 °C or more</b> and watch. Then find the temperature that gives the <b>highest net O₂</b> (at least 44 bubbles/min).', hint: 'Enzymes work fastest near their optimum, around 25 °C. Above about 40 °C they start to denature.' },
    { id: 'dark', name: 'Respiration', title: 'Lights out', html: 'Turn the light <b>off (0)</b>. What does the net O₂ do? Then find the <b>compensation point</b>: the light level where net O₂ is about <b>zero</b> (photosynthesis = respiration).', hint: 'In the dark plants still respire, so they take in O₂. Raise the light slowly until net O₂ is between −1 and +1.' },
    { id: 'eq', name: 'Equation', title: 'Write the recipe', html: 'Build the overall equation for photosynthesis. Tap each substance to put it on the correct side.', hint: 'Plants take in carbon dioxide and water, and use light energy to make glucose and oxygen.' }
  ];
  function scene(R, st, opt = {}) {
    let t = 0; const items = opt.sliders.map(k => ({ I: { k: 'I', label: 'Light intensity', min: 0, max: 1500, step: opt.fine ? 5 : 25, fmt: v => v + ' µmol/m²/s' }, C: { k: 'C', label: 'CO₂ level', min: 0, max: 1500, step: 20, fmt: v => v + ' ppm' }, T: { k: 'T', label: 'Temperature', min: 0, max: 50, step: 1, fmt: v => v + ' °C' }, W: { k: 'W', label: 'Soil water', min: 0, max: 100, step: 5, fmt: v => v + ' %' } }[k]));
    const P = SimLab.panel(st, items.concat(opt.btns ? [{ btns: opt.btns }] : []), () => opt.change && opt.change());
    SimLab.stage('', (g, dt) => { t += dt; const r = rates(st); g.innerHTML = house(st, r, { t, bm: 6, lamps: st.I > 900 ? 3 : 0 }) + panelHud(st, r, opt.hud ? opt.hud(r) : ''); });
    return P;
  }
  const tbl = (rows, cols) => `<g transform="translate(650 400)"><rect width="330" height="${34 + Math.max(1, rows.length) * 20}" rx="8" fill="#0b1020" fill-opacity=".74"/><text x="12" y="22" font-size="13" font-weight="700" fill="#fff">Your data</text>
    ${rows.map((r, i) => `<text x="12" y="${44 + i * 20}" font-size="12.5" fill="#a9b6cc" style="font-family:var(--f-mono)">${cols[0](r)}</text><text x="318" y="${44 + i * 20}" font-size="12.5" font-weight="700" fill="#7ee0a1" text-anchor="end" style="font-family:var(--f-mono)">${cols[1](r)}</text>`).join('')}</g>`;
  const S = {
    light: R => { const st = fresh({ I: 100, C: 1000, T: 25, W: 80 }), data = []; let pred = null;
      XLab.choiceIn('Prediction: as light gets brighter, the rate will…', ['Keep rising in a straight line', 'Rise, then level off', 'Stay the same'], i => { pred = i; G.check(); });
      scene(R, st, { sliders: ['I'], btns: [{ id: 'rec', label: 'Record', cls: 'primary', fn: () => { if (pred == null) { K.msg('Make your prediction first.', 'bad', 2400); return; } const r = rates(st); if (data.some(d => d.I === st.I)) { K.msg('You already recorded that light level.', 'bad', 2000); return; } data.push({ I: st.I, n: noisy(r.N) }); data.sort((a, b) => a.I - b.I); SND.tick(); G.check(); } }],
        hud: () => tbl(data.slice(-8), [d => `${d.I} µmol`, d => `${f(d.n, 1)} /min`]) });
      const G = SimLab.goals(R, { name: 'Light', items: () => [[pred != null, 'Predict the pattern'], [data.length >= 4, `Record 4 light levels (${data.length})`], [data.some(d => d.I > 1000), 'Include one above 1000']],
        q: { q: 'Your data shows the rate rising, then leveling off at high light. Why does it level off?', a: ['Another factor (CO₂ or the enzymes) can’t keep up, so it becomes the limit', 'The plant runs out of chlorophyll', 'Bright light kills the plant', 'The bubbles get too big to count'], c: 0, e: 'At low light, light is the <b>limiting factor</b>. Once there is plenty of light, the rate is limited by something else (CO₂ supply or how fast the Calvin cycle enzymes work), so extra light adds nothing.' } });
      const o = G.check; G.check = () => { o(); if (data.length >= 4 && pred != null && !G._noted) { G._noted = 1; if (pred !== 1) R.mistake('Light prediction', 'Rate rises with light and then levels off once another factor becomes limiting.'); XLab.note('Light vs. net O₂: ' + data.map(d => `${d.I}→${f(d.n, 1)}`).join(', ') + ' bubbles/min.'); } }; G.check(); },
    limit: R => { const st = fresh({ I: 1400, C: 80, T: 25, W: 80 }); let wasted = false, lastLim = 'CO₂';
      scene(R, st, { sliders: ['I', 'C', 'T', 'W'], change: () => { const r = rates(st); if (lastLim === 'CO₂' && r.lim === 'CO₂' && st.C <= 120 && (st.I !== 1400 || st.W !== 80 || st.T !== 25)) wasted = true; G.check(); } });
      const G = SimLab.goals(R, { name: 'Limiting factor', items: () => { const r = rates(st); return [[r.N >= 40, `Reach 40 bubbles/min (now ${f(r.N, 1)})`]]; },
        q: { q: 'Which factor was limiting the rate at the start?', a: ['Carbon dioxide', 'Light', 'Water', 'Temperature'], c: 0, e: 'With only 80 ppm of CO₂, the Calvin cycle had too little carbon to fix. Raising light or water did nothing; raising CO₂ did. Greenhouse growers add CO₂ (often to about 1000 ppm) for this reason.' } });
      const o = G.check; G.check = () => { o(); if (rates(st).N >= 40 && !G._n) { G._n = 1; if (wasted) K.msg('Notice: changing the other factors first didn’t help. Only the limiting factor matters.', 'ok', 4200); XLab.note(`Raised CO₂ to ${st.C} ppm: net O₂ ${f(rates(st).N, 1)} bubbles/min.`); } }; },
    temp: R => { const st = fresh({ I: 1200, C: 1000, T: 30, W: 80 }); let hot = false;
      scene(R, st, { sliders: ['T'], change: () => { if (st.T >= 42) { if (!hot) { hot = true; K.msg('At this temperature the enzymes start to lose their shape (denature).', 'bad', 3800); XLab.note(`At ${st.T} °C net O₂ fell to ${f(rates(st).N, 1)} bubbles/min.`); } } G.check(); } });
      const G = SimLab.goals(R, { name: 'Temperature', items: () => { const r = rates(st); return [[hot, 'Try 42 °C or more'], [hot && r.N >= 44, `Reach at least 44 net bubbles/min (now ${f(r.N, 1)})`]]; },
        q: { q: 'Why does the rate fall above about 30 °C even though the enzymes move faster?', a: ['Enzymes start to denature, and respiration uses more of the O₂', 'There is less light when it is hot', 'CO₂ can’t dissolve in hot water at all', 'Plants stop needing glucose'], c: 0, e: 'Photosynthesis has an <b>optimum temperature</b> (around 25 °C here). Above it, enzymes such as RuBisCO lose their shape, and respiration speeds up, so the <b>net</b> O₂ falls.' } });
      const o = G.check; G.check = () => { o(); if (hot && rates(st).N >= 44 && !G._n) { G._n = 1; XLab.note(`Best temperature found: ${st.T} °C (${f(rates(st).N, 1)} bubbles/min).`); } }; },
    dark: R => { const st = fresh({ I: 600, C: 600, T: 25, W: 80 }); let dark = false, comp = null;
      scene(R, st, { sliders: ['I'], fine: true, change: () => { const r = rates(st); if (st.I === 0) dark = true; if (dark && st.I > 0 && Math.abs(r.N) <= 1) { comp = st.I; } G.check(); } });
      const G = SimLab.goals(R, { name: 'Respiration', items: () => [[dark, 'Turn the light off'], [comp != null, 'Find the compensation point (net O₂ ≈ 0)']],
        q: { q: 'At the compensation point, which is true?', a: ['Photosynthesis makes O₂ exactly as fast as respiration uses it', 'The plant has stopped photosynthesizing', 'The plant has stopped respiring', 'The plant is growing as fast as it can'], c: 0, e: 'Plants respire all the time. At the compensation point the O₂ made by photosynthesis exactly balances the O₂ used in respiration, so there is no net gain: the plant can’t grow.' } });
      const o = G.check; G.check = () => { o(); if (comp != null && !G._n) { G._n = 1; XLab.note(`In the dark net O₂ was negative. Compensation point ≈ ${comp} µmol/m²/s.`); } }; },
    eq: R => { const st = fresh({ I: 900, C: 900, T: 25, W: 80 }); let eqOk = false; const items = [['CO₂', 'in'], ['H₂O', 'in'], ['C₆H₁₂O₆', 'out'], ['O₂', 'out'], ['N₂', 'none'], ['ATP from the mitochondria', 'none']]; const side = {};
      SimLab.stage('', (g) => { const r = rates(st); const ins = items.filter(x => side[x[0]] === 'in').map(x => x[0]), outs = items.filter(x => side[x[0]] === 'out').map(x => x[0]);
        g.innerHTML = house(st, r, { t: performance.now() / 1000, bm: 10 }) + `<g transform="translate(650 60)"><rect width="330" height="200" rx="10" fill="#0b1020" fill-opacity=".8"/><text x="165" y="34" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">Photosynthesis</text>
          <text x="165" y="86" font-size="18" font-weight="800" fill="#9fd0ff" text-anchor="middle">${ins.length ? ins.join(' + ') : '?'}</text><text x="165" y="120" font-size="14" fill="#ffd34d" text-anchor="middle">— light energy, chlorophyll →</text>
          <text x="165" y="156" font-size="18" font-weight="800" fill="#7ee0a1" text-anchor="middle">${outs.length ? outs.join(' + ') : '?'}</text></g>`; });
      const box = LabUI.html(`<div class="pl-lab">Tap to cycle: reactant → product → not involved</div><div class="sim-pick">${items.map(([n]) => `<button class="btn sm" data-eq="${n}">${n}</button>`).join('')}</div>`);
      $$('[data-eq]', box).forEach(b => b.onclick = () => { const n = b.dataset.eq, c = side[n]; side[n] = c === 'in' ? 'out' : c === 'out' ? 'none' : 'in'; b.textContent = n + (side[n] === 'in' ? ' (in)' : side[n] === 'out' ? ' (out)' : ' (–)'); SND.tick(); });
      const chk = LabUI.button('Check my equation', () => { const ok = items.every(([n, w]) => (side[n] || 'none') === w); if (ok) { eqOk = true; XLab.note('Built the equation 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂.'); G.check(); } else { R.mistake('Photosynthesis equation', 'Reactants: CO₂ and H₂O. Products: glucose (C₆H₁₂O₆) and O₂. N₂ and ATP from mitochondria are not part of it.'); K.msg('Not quite. Which gases does a plant take in, and which does it give off in light?', 'bad', 3500); } }); chk.classList.add('sm');
      const G = SimLab.goals(R, { name: 'Equation', items: () => [[eqOk, 'Put every substance on the right side']],
        q: { q: 'Where does the oxygen gas given off in photosynthesis come from?', a: ['Water molecules that are split using light energy', 'Carbon dioxide', 'Glucose', 'The air spaces in the leaf'], c: 0, e: 'Experiments with labeled oxygen (¹⁸O) showed that the O₂ comes from <b>water</b>, split in the light-dependent reactions. The carbon and oxygen of CO₂ end up in glucose.' } }); }
  };
  const quiz = [
    { q: 'Which is the balanced equation for photosynthesis?', a: ['6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂', 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O', 'CO₂ + H₂O → C₆H₁₂O₆ + O₂', '6O₂ + 6H₂O → C₆H₁₂O₆ + 6CO₂'], c: 0, e: 'Six CO₂ and six water make one glucose and six O₂. The reverse is cellular respiration.' },
    { q: 'A plant has bright light and warm temperature, but its rate barely changes when you add more light. What should a grower add?', a: ['CO₂, because it is probably the limiting factor', 'More light', 'Less water', 'Nothing can increase the rate'], c: 0, e: 'If more light changes nothing, light is not limiting. CO₂ is the usual limit in a sealed greenhouse.' },
    { q: 'Why does the photosynthesis rate drop sharply above about 40 °C?', a: ['The enzymes denature', 'Chlorophyll melts', 'Light can’t pass through warm air', 'CO₂ turns into a liquid'], c: 0, e: 'High temperature changes the shape of enzymes like RuBisCO, so they stop working.' },
    { q: 'In the energy conversion of photosynthesis, light energy is stored as…', a: ['Chemical energy in the bonds of glucose', 'Heat in the leaf', 'Kinetic energy of water', 'Nuclear energy'], c: 0, e: 'Light energy is captured by chlorophyll and stored as chemical energy in glucose.' },
    { q: 'Photosynthesis and respiration both cycle carbon. Which statement is correct?', a: ['Photosynthesis removes CO₂ from the air; respiration returns it', 'Both remove CO₂ from the air', 'Only animals respire', 'Respiration only happens at night'], c: 0, e: 'Plants fix CO₂ into sugars, and all living things (plants included) release CO₂ when they respire those sugars.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Set the conditions, wait for the sensors to settle, and press <b>Record</b>. The readings have a little natural variation, like real measurements.',
    fresh: () => fresh(),
    vars: [{ k: 'I', label: 'Light intensity', short: 'Light', min: 0, max: 1500, step: 25, unit: 'µmol/m²/s', d: 0, fmt: v => v + ' µmol/m²/s' }, { k: 'C', label: 'CO₂ level', short: 'CO₂', min: 0, max: 1500, step: 20, unit: 'ppm', d: 0, fmt: v => v + ' ppm' }, { k: 'T', label: 'Temperature', short: 'Temp.', min: 0, max: 50, step: 1, unit: '°C', d: 0, fmt: v => v + ' °C' }, { k: 'W', label: 'Soil water', short: 'Water', min: 0, max: 100, step: 5, unit: '%', d: 0, fmt: v => v + ' %' }],
    measures: [{ k: 'N', label: 'Net O₂ bubbles', short: 'Net O₂', unit: '/min', d: 1 }, { k: 'P', label: 'Photosynthesis rate', short: 'Photo.', unit: '/min', d: 1 }, { k: 'R', label: 'Respiration rate', short: 'Resp.', unit: '/min', d: 1 }, { k: 'lim', label: 'Limiting factor', short: 'Limit', text: true }],
    measure: s => { const r = rates(s); return { N: noisy(r.N), P: noisy(r.P), R: r.R, lim: r.lim }; },
    ideas: [['How does light intensity affect the rate of photosynthesis?', 'I', 'N'], ['How does CO₂ concentration affect the rate?', 'C', 'N'], ['What is the optimum temperature for photosynthesis?', 'T', 'N'], ['How does temperature affect respiration?', 'T', 'R'], ['How does soil water affect the rate?', 'W', 'N']],
    expect(x, y) {
      if (y === 'R') return x === 'T' ? { t: 'up', why: 'Respiration is enzyme-controlled and speeds up about 2× for every 10 °C (Q₁₀ ≈ 2). It does not depend on light, CO₂ or water in this model.' } : { t: 'flat', why: 'Respiration goes on whatever the light, CO₂ or water. It depends on temperature.' };
      if (x === 'I') return { t: 'levels', why: 'At low light, light limits the light-dependent reactions, so more light means more O₂. At high light another factor (CO₂ or enzyme speed) becomes limiting, so the curve levels off. At 0 light net O₂ is negative because the plant still respires.' };
      if (x === 'C') return { t: 'levels', why: 'CO₂ is the raw material for the Calvin cycle. More CO₂ raises the rate until light or enzymes become limiting, then it levels off.' };
      if (x === 'T') return { t: 'peak', why: 'Enzymes speed up as temperature rises, up to an optimum (about 25 °C here). Above it they denature and respiration increases, so net O₂ falls.' };
      if (x === 'W') return { t: 'levels', why: 'With dry soil the stomata close to save water, so less CO₂ enters the leaf. Once there is enough water (about 45 %), more water doesn’t help.' };
      return null;
    },
    setup(F) { let t = 0; SimLab.stage('', (g, dt) => { t += dt; const r = rates(F.st); g.innerHTML = house(F.st, r, { t, bm: 6, lamps: F.st.I > 900 ? 3 : 0 }) + panelHud(F.st, r); }); }
  };

  /* ═════ Game: Greenhouse Tycoon. Grow a crop for a season; every setting costs money per day ═════ */
  function tycoon(G, o) {
    const st = fresh(o.start), cost = s => Math.max(0, s.I - o.sun) * .0045 + Math.max(0, s.C - 420) * .0028 + Math.abs(s.T - o.air) * .055 + s.W * .004;
    let day = 0, bm = 1, cash = o.cash, spent = 0, t = 0, ended = false;
    const PN = G.panel(st, [{ k: 'I', label: `Grow lamps (sun gives ${o.sun})`, min: o.sun, max: 1500, step: 25, fmt: v => v + ' µmol' }, { k: 'C', label: 'CO₂ pump', min: 420, max: 1500, step: 20, fmt: v => v + ' ppm' }, { k: 'T', label: `Heater / cooler (outside ${o.air} °C)`, min: 0, max: 45, step: 1, fmt: v => v + ' °C' }, { k: 'W', label: 'Sprinklers', min: 0, max: 100, step: 5, fmt: v => v + ' %' },
      { html: `<div class="sim-note">Every setting above the free outdoor conditions costs coins per day. Spend where it raises growth: the <b>limiting factor</b>. Grow <b>${o.target} kg</b> in ${o.days} days.</div>` }]);
    SimLab.stage('', (g, dt) => { t += dt;
      if (!G.over() && !ended) { const r = rates(st), dd = dt * o.days / o.secs; day += dd; const c = cost(st) * dd; cash -= c; spent += c; bm += Math.max(0, r.N) * .0038 * bm ** .62 * dd;
        if (o.drain) { st.W = Math.max(0, st.W - o.drain * dd); PN.sync(); }
        if (cash <= 0) { ended = true; G.lose('Bankrupt!', 'You ran out of coins. Spending on a factor that <b>isn’t</b> limiting wastes money: check the “What’s limiting” bars and only boost the shortest one.'); }
        else if (bm >= o.target) { ended = true; const sp = 1 - day / o.days, left = cash / o.cash, stars = left > .45 ? 3 : left > .2 ? 2 : 1; G.win(stars, bm * 40 + cash * 3 + sp * 600, `Harvested ${f(bm, 1)} kg on day ${Math.ceil(day)} with ${Math.round(cash)} coins left.`); }
        else if (day >= o.days) { ended = true; G.lose('Season over', `Your crop reached only ${f(bm, 1)} of ${o.target} kg. Growth needs a high <b>net</b> rate: plenty of light and CO₂, a temperature near 25 °C, and enough water. Find the limiting factor first.`); } }
      const r = rates(st);
      g.innerHTML = house(st, r, { t, bm, lamps: st.I > o.sun + 50 ? Math.ceil((st.I - o.sun) / 400) : 0 }) + panelHud(st, r)
        + `<g transform="translate(650 400)"><rect width="330" height="120" rx="8" fill="#0b1020" fill-opacity=".8"/><text x="12" y="24" font-size="13" font-weight="700" fill="#fff">Day ${Math.min(o.days, Math.ceil(day))} of ${o.days}</text>
          ${SimLab.bar(12, 50, 306, bm / o.target, '#7ee0a1', 'Crop', `${f(bm, 1)} / ${o.target} kg`)}${SimLab.bar(12, 82, 306, cash / o.cash, cash / o.cash < .2 ? '#ff6b6b' : '#ffd34d', 'Coins', `${Math.round(cash)} (−${f(cost(st), 1)}/day)`)}
          <text x="12" y="112" font-size="11.5" fill="#a9b6cc">Spent so far: ${Math.round(spent)} coins</text></g>`; });
  }
  const game = {
    title: 'Greenhouse Tycoon', intro: 'Grow the crop before the season ends without going bankrupt. Lamps, CO₂, heating and water all cost coins, so invest in the <b>limiting factor</b>.',
    cover: () => `<rect width="1000" height="620" fill="#0f2a1b"/>${labThumb('greenhouse').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Greenhouse Tycoon</text><text x="500" y="540" font-size="18" fill="#a9e0b5" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Spring start', goal: 'Mild weather and good sun. Grow <b>18 kg</b> in 30 days.', hint: 'Sun and temperature are fine. In a closed greenhouse, CO₂ is often the limit.', setup: G => tycoon(G, { sun: 700, air: 22, cash: 300, target: 18, days: 30, secs: 50, start: { I: 700, C: 420, T: 22, W: 50 } }) },
      { name: 'Cloudy summer', goal: 'Cloudy skies all season. Grow <b>18 kg</b> in 30 days on a tight budget.', hint: 'With little sun, light limits first. Add lamps, then CO₂ once light is no longer the shortest bar.', setup: G => tycoon(G, { sun: 150, air: 24, cash: 260, target: 18, days: 30, secs: 50, start: { I: 150, C: 420, T: 24, W: 50 } }) },
      { name: 'Winter crop', goal: 'Cold outside (6 °C) and weak sun. Grow <b>16 kg</b> in 30 days.', hint: 'At 6 °C the enzymes barely work. Heat to about 25 °C before buying anything else.', setup: G => tycoon(G, { sun: 300, air: 6, cash: 360, target: 16, days: 30, secs: 50, start: { I: 300, C: 420, T: 6, W: 50 } }) },
      { name: 'Heatwave', goal: 'A heatwave pushes the greenhouse toward 40 °C and dries the soil. Grow <b>18 kg</b> in 30 days.', hint: 'Keep it cool (about 25 °C) and watered: hot, dry plants close their stomata and their enzymes denature.', setup: G => tycoon(G, { sun: 1100, air: 38, cash: 340, target: 18, days: 30, secs: 50, drain: 2.5, start: { I: 1100, C: 420, T: 38, W: 40 } }) }
    ]
  };
  const finale = () => { const st = fresh({ I: 1100, C: 1000, T: 25, W: 80 }); let t = 0; SimLab.stage('', (g, dt) => { t += dt; g.innerHTML = house(st, rates(st), { t, bm: 25, lamps: 3 }); }); };
  XLab.define({ id: 'greenhouse', guided: { steps, S, quiz, finale, finaleMsg: 'Your greenhouse is in full bloom. Now check your thinking.', summary: () => 'You measured photosynthesis by counting O₂, showed that the rate levels off with light, found and fixed a limiting factor, saw enzymes fail in the heat, met the compensation point, and built the equation.' }, free, game });
})();
