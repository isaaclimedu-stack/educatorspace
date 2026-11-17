/* ═══════════ HS Physics: "Wave Lab: Interference Playground" ═══════════
   String: the 1-D wave equation  ∂²y/∂t² = v²·∂²y/∂x²  solved by finite differences (N points over L = 6 m),
     driven at the left end by y = A·sin(2πft). The right end is fixed (reflects inverted), loose (reflects upright)
     or a damper (absorbs, so you see a pure traveling wave). Reflected waves superpose with incoming ones, so
     standing waves build up at resonance:  f_n = n·v / (2L)  for a fixed end.  v = fλ always.
   Ripple tank: two point sources in phase; the water height is the sum A·cos(k·r₁ − ωt) + A·cos(k·r₂ − ωt)/√r.
     Path difference |r₁ − r₂| = whole wavelengths → constructive; half wavelengths → destructive (nodal lines). */
(() => {
  const K = Kit, f = SimLab.f, L = 6, N = 241, DX = L / (N - 1), X0 = 60, XW = 560, Y0 = 300, YS = 70;
  function string(st) { return { y: new Float64Array(N), yp: new Float64Array(N), t: 0, peak: new Float64Array(N), st }; }
  function stepS(s, dt) {
    const st = s.st, v = st.v, sub = Math.max(1, Math.ceil(dt / (.9 * DX / v))), h = dt / sub, c2 = (v * h / DX) ** 2, damp = st.damp != null ? st.damp : .15;
    for (let k = 0; k < sub; k++) { const y = s.y, yp = s.yp, yn = new Float64Array(N);
      for (let i = 1; i < N - 1; i++) yn[i] = (2 * y[i] - yp[i] * (1 - damp * h / 2) + c2 * (y[i + 1] - 2 * y[i] + y[i - 1])) / (1 + damp * h / 2);
      s.t += h; yn[0] = (st.on === false ? 0 : st.A * Math.sin(2 * Math.PI * st.f * s.t + (st.ph || 0))) * Math.min(1, s.t * 2);
      if (st.end === 'fixed') yn[N - 1] = 0; else if (st.end === 'loose') yn[N - 1] = yn[N - 2]; else { const r = v * h / DX; yn[N - 1] = y[N - 2] + (r - 1) / (r + 1) * (yn[N - 2] - y[N - 1]); }
      s.yp = y; s.y = yn; }
    for (let i = 0; i < N; i++) s.peak[i] = Math.max(s.peak[i] * Math.exp(-dt * .5), Math.abs(s.y[i]));
  }
  const px = i => X0 + i / (N - 1) * XW;
  function drawString(s, o = {}) {
    const st = s.st; let g = `<rect width="1000" height="620" fill="#0d2238"/>`;
    for (let m = 0; m <= L; m++) g += `<line x1="${X0 + m / L * XW}" y1="${Y0 - 150}" x2="${X0 + m / L * XW}" y2="${Y0 + 150}" stroke="#fff" stroke-opacity="${o.ruler ? .16 : .06}"/>${o.ruler ? `<text x="${X0 + m / L * XW}" y="${Y0 + 172}" font-size="12" fill="#9fc6e0" text-anchor="middle">${m} m</text>` : ''}`;
    if (o.ruler) for (let m = 0; m < L * 4; m++) g += `<line x1="${X0 + m / (L * 4) * XW}" y1="${Y0 + 150}" x2="${X0 + m / (L * 4) * XW}" y2="${Y0 + 158}" stroke="#9fc6e0" stroke-opacity=".6"/>`;
    g += `<line x1="${X0}" y1="${Y0}" x2="${X0 + XW}" y2="${Y0}" stroke="#fff" stroke-opacity=".2" stroke-dasharray="4 6"/>`;
    if (o.env) g += `<path d="M${Array.from({ length: N }, (_, i) => `${px(i).toFixed(1)},${(Y0 - s.peak[i] * YS).toFixed(1)}`).join(' L')} L${Array.from({ length: N }, (_, i) => `${px(N - 1 - i).toFixed(1)},${(Y0 + s.peak[N - 1 - i] * YS).toFixed(1)}`).join(' L')}Z" fill="#7ee0a1" fill-opacity=".12"/>`;
    if (o.target) g += `<polyline points="${Array.from(o.target).map((v, i) => `${px(i).toFixed(1)},${(Y0 - v * YS).toFixed(1)}`).join(' ')}" fill="none" stroke="#ffd27a" stroke-width="3" stroke-dasharray="6 5"/>`;
    g += `<polyline points="${Array.from({ length: N }, (_, i) => `${px(i).toFixed(1)},${(Y0 - Math.max(-2.1, Math.min(2.1, s.y[i])) * YS).toFixed(1)}`).join(' ')}" fill="none" stroke="${o.col || '#4f8ff7'}" stroke-width="4" stroke-linejoin="round"/>`;
    if (o.sum) g += `<polyline points="${Array.from(o.sum).map((v, i) => `${px(i).toFixed(1)},${(Y0 - v * YS).toFixed(1)}`).join(' ')}" fill="none" stroke="#7ee0a1" stroke-width="4"/>`;
    g += `<g transform="translate(${X0 - 30} ${Y0 - s.y[0] * YS})"><rect x="-14" y="-14" width="28" height="28" rx="6" fill="#ff9a3c"/></g><rect x="${X0 - 40}" y="${Y0 - 160}" width="10" height="320" fill="#5a6a7c"/>`;
    g += st.end === 'fixed' ? `<rect x="${X0 + XW}" y="${Y0 - 160}" width="14" height="320" fill="#5a6a7c"/>` : st.end === 'loose' ? `<line x1="${X0 + XW + 6}" y1="${Y0 - 160}" x2="${X0 + XW + 6}" y2="${Y0 + 160}" stroke="#5a6a7c" stroke-width="4"/><circle cx="${X0 + XW + 6}" cy="${Y0 - s.y[N - 1] * YS}" r="8" fill="#9aa8b8"/>` : `<rect x="${X0 + XW}" y="${Y0 - 40}" width="40" height="80" rx="8" fill="#3a4a5c"/><text x="${X0 + XW + 20}" y="${Y0 + 5}" font-size="10" fill="#cfe0f2" text-anchor="middle">damper</text>`;
    const lam = st.v / st.f;
    g += SimLab.hud(680, 30, 300, [['Frequency f', `${f(st.f, 2)} Hz`], ['Period T = 1/f', `${f(1 / st.f, 2)} s`], ['Amplitude', `${f(st.A, 2)} m`], ['Wave speed v', o.hideV ? '?' : `${f(st.v, 1)} m/s`], ['Wavelength λ', o.hideLam ? 'measure it!' : `${f(lam, 2)} m`, '#7ee0a1'], ['Far end', st.end === 'fixed' ? 'fixed (reflects)' : st.end === 'loose' ? 'loose (reflects)' : 'absorbed'], ['Time', `${f(s.t, 1)} s`]], 'Wave generator');
    return g + (o.extra || '');
  }
  function stringScene(st, o = {}) { const s = string(st); SimLab.stage('', (g, dt) => { if (!o.paused || !o.paused()) stepS(s, Math.min(dt, .04)); g.innerHTML = drawString(s, Object.assign({}, o, { extra: o.extra ? o.extra(s) : '', target: o.target ? o.target(s) : null })); }); return s; }
  /* resonance: drive for a while (offline) and return the steady amplitude at the loudest point */
  function resonance(st, secs = 16) { const s = string(Object.assign({}, st, { damp: .15 })); for (let t = 0; t < secs; t += .02) stepS(s, .02); let m = 0; for (let k = 0; k < 120; k++) { stepS(s, .02); for (let i = 0; i < N; i++) m = Math.max(m, Math.abs(s.y[i])); } return m; }
  /* ripple tank */
  function tank(c, st, T, probe) {
    const W = 150, H = 110, sc = 4, lam = st.lam, k = 2 * Math.PI / lam, w = 2 * Math.PI * st.f, img = c.createImageData(W, H), S1 = { x: 30, y: H / 2 - st.d / 2 }, S2 = { x: 30, y: H / 2 + st.d / 2 };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const r1 = Math.hypot(i - S1.x, j - S1.y) + .5, r2 = Math.hypot(i - S2.x, j - S2.y) + .5, h = Math.cos(k * r1 - w * T) / Math.sqrt(r1 / 8 + 1) + (st.two ? Math.cos(k * r2 - w * T + (st.phase || 0)) / Math.sqrt(r2 / 8 + 1) : 0), v = Math.max(0, Math.min(255, 128 + h * 70)), p = (j * W + i) * 4;
      img.data[p] = v * .35; img.data[p + 1] = v * .65; img.data[p + 2] = 90 + v * .65; img.data[p + 3] = 255; }
    const off = document.createElement('canvas'); off.width = W; off.height = H; off.getContext('2d').putImageData(img, 0, 0);
    c.clearRect(0, 0, 1000, 620); c.fillStyle = '#0d2238'; c.fillRect(0, 0, 1000, 620); c.imageSmoothingEnabled = true; c.drawImage(off, 30, 70, W * sc, H * sc);
    const P = { x: (probe.x - 30) / sc, y: (probe.y - 70) / sc }, r1 = Math.hypot(P.x - S1.x, P.y - S1.y), r2 = Math.hypot(P.x - S2.x, P.y - S2.y), a1 = 1 / Math.sqrt(r1 / 8 + 1), a2 = st.two ? 1 / Math.sqrt(r2 / 8 + 1) : 0;
    const amp = Math.sqrt(a1 * a1 + a2 * a2 + 2 * a1 * a2 * Math.cos(k * (r1 - r2) - (st.phase || 0)));
    return { S1, S2, sc, d1: r1 * .02, d2: r2 * .02, pd: Math.abs(r1 - r2) * .02, lamM: lam * .02, amp, ampMax: a1 + a2, rel: (a1 + a2) ? amp / (a1 + a2) : 0 };
  }
  function tankScene(st, o = {}) {
    const c = XLab.cv(), probe = { x: 500, y: 290 }; let T = 0, info = null, drag = false;
    K.on(K.svg, 'pointerdown', e => { const p = K.pt(e); if (p.x > 30 && p.x < 630 && p.y > 70 && p.y < 510) { drag = true; probe.x = p.x; probe.y = p.y; } });
    K.on(window, 'pointermove', e => { if (!drag) return; const p = K.pt(e); probe.x = clamp(p.x, 32, 628); probe.y = clamp(p.y, 72, 508); });
    K.on(window, 'pointerup', () => { if (drag) { drag = false; o.onProbe && o.onProbe(info); } });
    SimLab.stage('', (g, dt) => { T += dt; info = tank(c, st, T, probe);
      const s1 = [30 + info.S1.x * info.sc, 70 + info.S1.y * info.sc], s2 = [30 + info.S2.x * info.sc, 70 + info.S2.y * info.sc], q = info.rel;
      g.innerHTML = `<rect x="28" y="68" width="604" height="444" fill="none" stroke="#5a7a9a" stroke-width="4"/><circle cx="${s1[0]}" cy="${s1[1]}" r="8" fill="#ff9a3c"/>${st.two ? `<circle cx="${s2[0]}" cy="${s2[1]}" r="8" fill="#ff9a3c"/>` : ''}
        <line x1="${s1[0]}" y1="${s1[1]}" x2="${probe.x}" y2="${probe.y}" stroke="#ffd27a" stroke-dasharray="4 4"/>${st.two ? `<line x1="${s2[0]}" y1="${s2[1]}" x2="${probe.x}" y2="${probe.y}" stroke="#ffb3c4" stroke-dasharray="4 4"/>` : ''}
        <g transform="translate(${probe.x} ${probe.y})"><circle r="14" fill="none" stroke="#fff" stroke-width="3"/><circle r="3" fill="#fff"/></g>
        ${SimLab.hud(660, 30, 320, [['Wavelength λ', `${f(info.lamM, 2)} m`], ['Distance from source 1', `${f(info.d1, 2)} m`, '#ffd27a'], ['Distance from source 2', st.two ? `${f(info.d2, 2)} m` : '—', '#ffb3c4'], ['Path difference', st.two ? `${f(info.pd, 2)} m = ${f(info.pd / info.lamM, 2)} λ` : '—', '#7ee0a1'], ['Wave height at probe', `${f(q * 100)} % of max`, q > .8 ? '#7ee0a1' : q < .25 ? '#ff8a8a' : '#fff']], 'Ripple tank')}
        <g transform="translate(660 230)"><rect width="320" height="60" rx="8" fill="#0b1020" fill-opacity=".8"/>${SimLab.bar(12, 34, 296, q, q > .8 ? '#7ee0a1' : q < .25 ? '#ff6b6b' : '#ffd27a', 'Probe reading', q > .8 ? 'constructive' : q < .25 ? 'destructive' : 'in between')}</g>
        <text x="330" y="540" font-size="13" fill="#9fc6e0" text-anchor="middle">Drag the probe (white ring). Bright and dark bands = big waves; gray lines = still water (nodal lines).</text>${o.extra ? o.extra(info) : ''}`; });
    return { info: () => info, probe };
  }

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'lam', name: 'Wavelength', title: 'Measure a wave', html: 'The far end absorbs the wave, so you see a clean <b>traveling wave</b>. Use the meter grid to <b>measure the wavelength</b> (crest to crest) at 2 Hz. Then <b>predict</b> what happens to λ if you double the frequency, and try it.', hint: 'Count how many meters there are between two neighboring crests.' },
    { id: 'speed', name: 'v = fλ', title: 'How fast?', html: 'A new, heavier rope. The speed is hidden. Measure the wavelength at <b>1.5 Hz</b> and calculate the <b>wave speed</b> with v = f × λ.', hint: 'Measure crest to crest on the grid, then multiply by 1.5 Hz.' },
    { id: 'stand', name: 'Standing waves', title: 'Find the harmonics', html: 'Now the far end is <b>fixed</b>, so waves reflect and <b>superpose</b>. The string is 6 m long and v = 4 m/s. Find frequencies that make <b>big standing waves</b> (resonance). Find <b>two different harmonics</b>.', hint: 'Fixed at both ends: f = n × v ÷ (2L) = n × 4 ÷ 12. Try 0.33, 0.67, 1.0 Hz…' },
    { id: 'tank', name: 'Interference', title: 'Two sources', html: 'Two speakers vibrate in step in a ripple tank. Drag the <b>probe</b> to find a spot of <b>destructive</b> interference (under 15 %) and one of <b>constructive</b> interference (over 90 %). Compare the path differences.', hint: 'Constructive where the path difference is a whole number of wavelengths; destructive where it’s ½, 1½, 2½… wavelengths.' }
  ];
  const sl = { f: { k: 'f', label: 'Frequency', min: .2, max: 4, step: .01, fmt: v => f(v, 2) + ' Hz' }, A: { k: 'A', label: 'Amplitude', min: .1, max: 1, step: .05, fmt: v => f(v, 2) + ' m' }, v: { k: 'v', label: 'Wave speed (rope tension)', min: 1, max: 8, step: .5, fmt: v => f(v, 1) + ' m/s' } };
  const S = {
    lam: R => { const st = { f: 2, A: .5, v: 4, end: 'absorb' }; let m1 = false, pred = null, m2 = false;
      stringScene(st, { ruler: true, hideLam: true });
      LabUI.html(XLab.numIn('lmA', 'Wavelength at 2 Hz', 'm'));
      $('#lmAB').onclick = () => { const v = +$('#lmA').value; if (Math.abs(v - 2) <= .15) { m1 = true; XLab.note('At 2 Hz the wavelength was 2.0 m.'); K.msg('Yes: 2 m from crest to crest.', 'ok', 2000); } else { R.mistake('Measuring wavelength', 'λ is the distance between two neighboring crests: 2 m here.'); K.msg('Measure from one crest to the very next crest.', 'bad', 2400); } G.check(); };
      XLab.choiceIn('Prediction: at 4 Hz the wavelength will be…', ['Halved (1 m)', 'Doubled (4 m)', 'The same'], i => { pred = i; if (i !== 0) R.mistake('Frequency and wavelength', 'Same speed, double the frequency → half the wavelength (v = fλ).'); G.check(); });
      SimLab.panel(st, [sl.f], () => { if (Math.abs(st.f - 4) < .05 && pred != null) { m2 = true; XLab.note('At 4 Hz the wavelength halved to 1.0 m (same speed).'); G.check(); } });
      const G = SimLab.goals(R, { name: 'Wavelength', items: () => [[m1, 'Measure λ at 2 Hz'], [pred != null, 'Predict λ at 4 Hz'], [m2, 'Set the frequency to 4 Hz and look']],
        q: { q: 'Why did doubling the frequency halve the wavelength?', a: ['The speed is set by the rope, so v = fλ means f × λ stays the same', 'Faster waves are shorter', 'The amplitude changed', 'Energy was lost'], c: 0, e: 'Wave speed depends on the <b>medium</b> (tension and mass of the rope), not on the source. With v fixed, v = fλ means doubling f halves λ.' } }); },
    speed: R => { const st = { f: 1.5, A: .5, v: 3, end: 'absorb' }; let lOk = false, vOk = false;
      stringScene(st, { ruler: true, hideLam: true, hideV: true });
      LabUI.html(XLab.numIn('spL', 'Measured wavelength', 'm') + XLab.numIn('spV', 'Wave speed', 'm/s'));
      $('#spLB').onclick = () => { const v = +$('#spL').value; if (Math.abs(v - 2) <= .15) { lOk = true; K.msg('Good measurement.', 'ok', 1500); } else { R.mistake('Measuring wavelength', 'Crest to crest is 2.0 m at 1.5 Hz on this rope.'); K.msg('Measure crest to crest on the grid.', 'bad', 2000); } G.check(); };
      $('#spVB').onclick = () => { const v = +$('#spV').value; if (Math.abs(v - 3) <= .25) { vOk = true; XLab.note('Heavy rope: λ = 2.0 m at 1.5 Hz, so v = 1.5 × 2.0 = 3.0 m/s.'); K.msg('v = 1.5 Hz × 2.0 m = 3.0 m/s', 'ok', 2400); } else { R.mistake('v = fλ', 'Multiply frequency by wavelength.'); K.msg('v = f × λ.', 'bad', 2000); } G.check(); };
      const G = SimLab.goals(R, { name: 'v = fλ', items: () => [[lOk, 'Measure λ'], [vOk, 'Calculate v']],
        q: { q: 'Sound travels at 343 m/s in air. What is the wavelength of a 686 Hz note?', a: ['0.5 m', '2 m', '235,000 m', '343 m'], c: 0, e: 'λ = v ÷ f = 343 ÷ 686 = 0.5 m.' } }); },
    stand: R => { const st = { f: .5, A: .15, v: 4, end: 'fixed' }, found = new Set();
      const s = stringScene(st, { ruler: true, env: true, extra: () => found.size ? `<text x="340" y="80" font-size="15" font-weight="800" fill="#7ee0a1" text-anchor="middle">Harmonics found: ${[...found].sort().map(n => `n = ${n} (${f(n / 3, 2)} Hz)`).join(', ')}</text>` : '' });
      SimLab.panel(st, [sl.f, { btns: [{ id: 'chk', label: 'Is this a standing wave?', cls: 'primary', fn: () => { const n = st.f * 12 / 4, rn = Math.round(n); if (rn >= 1 && Math.abs(n - rn) < .04) { if (!found.has(rn)) { found.add(rn); XLab.note(`Standing wave with ${rn} loop${rn > 1 ? 's' : ''} at ${f(st.f, 2)} Hz (n·v/2L = ${f(rn * 4 / 12, 2)} Hz).`); } K.msg(`Resonance! Harmonic n = ${rn}: ${rn} loop${rn > 1 ? 's' : ''}, ${rn + 1} nodes.`, 'ok', 3000); } else { K.msg('Not resonating: the reflected waves don’t line up. Try f = n × 4 ÷ 12.', 'bad', 2800); } G.check(); } }] }], () => { s.peak.fill(0); });
      const G = SimLab.goals(R, { name: 'Standing waves', items: () => [[found.size >= 2, `Find two harmonics (${found.size}/2)`]],
        q: { q: 'At the nodes of a standing wave…', a: ['The incoming and reflected waves always cancel, so the string doesn’t move', 'The string moves the most', 'Energy is created', 'The wave stops traveling'], c: 0, e: 'Standing waves are <b>superposition</b>: two waves traveling in opposite directions. At nodes they are always opposite and cancel; at antinodes they add. Only frequencies where a whole number of half-wavelengths fit (L = nλ/2) build up.' } }); },
    tank: R => { const st = { lam: 20, f: 1, d: 40, two: true }; let de = false, co = false;
      tankScene(st, { onProbe: info => { if (!info) return; if (info.rel < .15 && info.d1 > .4) { if (!de) XLab.note(`Destructive spot: path difference ${f(info.pd, 2)} m = ${f(info.pd / info.lamM, 2)} λ.`); de = true; } if (info.rel > .9 && info.d1 > .4) { if (!co) XLab.note(`Constructive spot: path difference ${f(info.pd, 2)} m = ${f(info.pd / info.lamM, 2)} λ.`); co = true; } G.check(); } });
      const G = SimLab.goals(R, { name: 'Interference', items: () => [[de, 'Find a destructive spot (under 15 %)'], [co, 'Find a constructive spot (over 90 %)']],
        q: { q: 'At the destructive spot, the path difference was about…', a: ['An odd number of half-wavelengths (½λ, 1½λ, …)', 'A whole number of wavelengths', 'Exactly zero', 'Equal to the distance between the sources'], c: 0, e: 'When one wave travels half a wavelength farther, a crest from one source meets a trough from the other: they cancel. Noise-cancelling headphones use this.' } }); }
  };
  const quiz = [
    { q: 'A wave has frequency 5 Hz and wavelength 3 m. Its speed is…', a: ['15 m/s', '0.6 m/s', '1.67 m/s', '8 m/s'], c: 0, e: 'v = fλ = 5 × 3 = 15 m/s.' },
    { q: 'Two waves of amplitude 2 cm meet crest to crest. The resulting amplitude is…', a: ['4 cm', '0 cm', '2 cm', '1 cm'], c: 0, e: 'Superposition: displacements add. Crest + crest = constructive.' },
    { q: 'A guitar string is 0.65 m long and waves travel along it at 286 m/s. Its fundamental frequency is…', a: ['220 Hz', '440 Hz', '186 Hz', '110 Hz'], c: 0, e: 'f₁ = v ÷ 2L = 286 ÷ 1.3 = 220 Hz.' },
    { q: 'Which property of a wave does NOT change when it passes into a new medium?', a: ['Frequency', 'Speed', 'Wavelength', 'Direction (in general)'], c: 0, e: 'The source sets the frequency. Speed and wavelength change with the medium.' },
    { q: 'Increasing the amplitude of a wave increases its…', a: ['Energy', 'Speed', 'Frequency', 'Wavelength'], c: 0, e: 'Energy carried grows with the square of the amplitude; speed depends on the medium.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Change the wave and the rope. Press <b>Record</b> to log the wave’s measurements and its standing-wave amplitude (a 16 s test with a fixed end).',
    fresh: () => ({ f: 1, A: .3, v: 4, end: 'absorb' }),
    vars: [{ k: 'f', label: 'Frequency', short: 'f', min: .2, max: 4, step: .01, unit: 'Hz', d: 2, fmt: v => f(v, 2) + ' Hz' }, { k: 'A', label: 'Amplitude', short: 'A', min: .1, max: 1, step: .05, unit: 'm', d: 2, fmt: v => f(v, 2) + ' m' }, { k: 'v', label: 'Wave speed (rope tension)', short: 'v', min: 1, max: 8, step: .5, unit: 'm/s', d: 1, fmt: v => f(v, 1) + ' m/s' }],
    cats: [{ k: 'end', label: 'Far end (for the view)', opts: [['absorb', 'Damper'], ['fixed', 'Fixed'], ['loose', 'Loose']] }],
    measures: [{ k: 'lam', label: 'Wavelength', short: 'λ', unit: 'm', d: 2 }, { k: 'T', label: 'Period', short: 'T', unit: 's', d: 2 }, { k: 'res', label: 'Standing-wave amplitude (fixed end)', short: 'Resonance', unit: 'm', d: 2 }],
    measure: s => ({ lam: s.v / s.f, T: 1 / s.f, res: resonance(Object.assign({}, s, { end: 'fixed' })) }),
    ideas: [['How does frequency affect wavelength?', 'f', 'lam'], ['How does the rope’s wave speed affect wavelength?', 'v', 'lam'], ['How does frequency affect the standing-wave amplitude (resonance)?', 'f', 'res']],
    expect(x, y) {
      if (x === 'f' && y === 'lam') return { t: 'levelsdown', why: 'λ = v ÷ f: wavelength is inversely proportional to frequency (a curve, not a straight line). Try graphing λ against 1/f to get a straight line.' };
      if (x === 'v' && y === 'lam') return { t: 'up', why: 'λ = v ÷ f: at a fixed frequency, a faster rope stretches each wave out proportionally.' };
      if (x === 'f' && y === 'res') return { t: 'peak', why: 'Only at the resonant frequencies f = n·v/(2L) do the reflected waves line up with new waves, so the amplitude builds up. Between them it stays small. Use small frequency steps near n × v/12 Hz to see sharp peaks.' };
      if (x === 'A' && y === 'res') return { t: 'up', why: 'The standing wave’s size is proportional to the driving amplitude (the system is linear).' };
      if (x === 'A') return { t: 'flat', why: 'Amplitude doesn’t change speed, frequency or wavelength.' };
      return null;
    },
    setup(F) { stringScene(F.st, { ruler: true, env: true }); }
  };

  /* ═════ Game ═════ */
  function matcher(G, o) {
    const st = { f: o.f0, A: o.A0, v: 4, end: 'absorb', on: true }, phase = o.phase || 0; let held = 0, t0 = 0;
    const tgt = s => { const out = new Float64Array(N); for (let i = 0; i < N; i++) { const x = i * DX, d = s.t - x / o.v; out[i] = d > 0 ? o.A * Math.sin(2 * Math.PI * (o.f * d) + phase) : 0; } return out; };
    const s = stringScene(st, { ruler: true, target: o.cancel ? null : tgt, extra: s2 => { const T = tgt(s2); let err = 0, n = 0, sum = new Float64Array(N); for (let i = 40; i < N; i++) { const a = o.cancel ? s2.y[i] + T[i] : s2.y[i] - T[i]; err += a * a; n++; sum[i] = s2.y[i] + T[i]; } const rms = Math.sqrt(err / n), q = Math.max(0, 1 - rms / (o.A * .9));
        if (!G.over() && s2.t > 4) { held = q > .85 ? held + .016 : Math.max(0, held - .03); if (held >= 3) G.win(s2.t < 20 ? 3 : s2.t < 40 ? 2 : 1, 1000 + q * 500 - s2.t * 5, o.why); else if (s2.t > 70) G.lose('Out of time', o.why); }
        return `${o.cancel ? `<polyline points="${Array.from(T).map((v, i) => `${px(i).toFixed(1)},${(Y0 - v * YS).toFixed(1)}`).join(' ')}" fill="none" stroke="#ffd27a" stroke-width="2.5" stroke-dasharray="6 5"/><polyline points="${Array.from(sum).map((v, i) => `${px(i).toFixed(1)},${(Y0 + 170 - v * 30).toFixed(1)}`).join(' ')}" fill="none" stroke="#7ee0a1" stroke-width="3"/><text x="${X0}" y="${Y0 + 135}" font-size="12" fill="#7ee0a1">sum of both waves (make it flat)</text>` : ''}
          <g transform="translate(680 300)"><rect width="300" height="90" rx="8" fill="#0b1020" fill-opacity=".8"/>${SimLab.bar(12, 34, 276, q, q > .85 ? '#7ee0a1' : '#ffd27a', o.cancel ? 'Cancellation' : 'Match', f(q * 100) + ' %')}${SimLab.bar(12, 72, 276, held / 3, '#9fd0ff', 'Hold above 85 % for 3 s', f(held, 1) + ' s')}</g>`; } });
    void s; void t0;
    G.panel(st, [sl.f, sl.A].concat(o.cancel ? [{ btns: [{ id: 'ph', label: 'Flip phase (start with a trough)', fn: () => { st.ph = st.ph ? 0 : Math.PI; K.msg(st.ph ? 'Phase flipped: your wave now starts with a trough.' : 'Phase back to normal.', 'ok', 1600); } }] }] : []));
  }
  function tuner(G, o) {
    const st = { f: .3, A: .12, v: o.v, end: 'fixed' }; let tries = 0;
    stringScene(st, { ruler: true, env: true, hideLam: true, extra: () => `<text x="340" y="80" font-size="16" font-weight="800" fill="#ffd27a" text-anchor="middle">Make harmonic n = ${o.n}: ${o.n} loops on a ${L} m string, v = ${o.v} m/s</text>` });
    G.panel(st, [sl.f, { btns: [{ id: 'lock', label: 'Lock in this frequency', cls: 'primary', fn: () => { tries++; const want = o.n * o.v / (2 * L), err = Math.abs(st.f - want) / want; if (err < .025) G.win(tries === 1 ? 3 : tries === 2 ? 2 : 1, 1500 - tries * 300, `f = n·v/2L = ${o.n} × ${o.v} ÷ 12 = ${f(want, 2)} Hz.`); else if (tries >= 3) G.lose('Out of tries', `For n = ${o.n}: f = n·v/(2L) = ${o.n} × ${o.v} ÷ ${2 * L} = ${f(want, 2)} Hz.`); else K.msg(`Not quite (${3 - tries} tries left). Calculate f = n·v/(2L).`, 'bad', 2600); } }] }]);
  }
  function quiet(G) {
    const st = { lam: 20, f: 1, d: 30, two: true }; let tries = 0;
    const T = tankScene(st, { extra: () => `<text x="330" y="52" font-size="16" font-weight="800" fill="#ffd27a" text-anchor="middle">Seat the audience member where it’s QUIET (under 10 %), at least 1.5 m from the speakers</text>` });
    G.panel(st, [{ k: 'd', label: 'Speaker spacing', min: 10, max: 70, step: 1, fmt: v => f(v * .02, 2) + ' m' }, { btns: [{ id: 'seat', label: 'Seat them here', cls: 'primary', fn: () => { tries++; const i = T.info(); if (i.rel < .1 && i.d1 >= 1.5) G.win(tries === 1 ? 3 : 2, 1200 - tries * 200, `Path difference ${f(i.pd, 2)} m = ${f(i.pd / i.lamM, 2)} λ: a half-wavelength odd multiple, so the waves cancel.`); else if (tries >= 4) G.lose('Still noisy', 'Quiet spots are where the path difference is ½λ, 1½λ, 2½λ… Find a gray (still) band and drag the probe onto it.'); else K.msg(i.d1 < 1.5 ? 'Too close to the speakers: move at least 1.5 m away.' : `Reading ${f(i.rel * 100)} %: still too loud. ${4 - tries} tries left.`, 'bad', 2400); } }] }]);
  }
  const game = {
    title: 'Wave Mixer', intro: 'Use superposition and v = fλ to match, cancel and tune waves.',
    cover: () => `<rect width="1000" height="620" fill="#0d2238"/>${labThumb('waves').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Wave Mixer</text><text x="500" y="540" font-size="18" fill="#9fc6e0" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Copy cat', goal: 'Match the dashed gold wave: same frequency and amplitude. Hold the match for 3 s.', hint: 'Count the target’s crests: the speed is 4 m/s, so f = 4 ÷ λ.', setup: G => matcher(G, { f0: .6, A0: .2, f: 1.5, A: .6, v: 4, why: 'Matching wavelength means matching frequency here: λ = v/f = 4 ÷ 1.5 ≈ 2.7 m.' }) },
      { name: 'Noise cancel', goal: 'A noise wave (dashed) travels along the rope. Make a wave that <b>cancels</b> it: the green sum should be flat.', hint: 'Same frequency and amplitude, but upside down (flip the phase).', setup: G => matcher(G, { f0: .7, A0: .3, f: 1.25, A: .5, v: 4, cancel: true, why: 'Destructive interference: an equal wave that is half a cycle out of step cancels the noise. That’s how noise-cancelling headphones work.' }) },
      { name: 'Tune the string', goal: 'Make the <b>3rd harmonic</b> (3 loops) on a 6 m string with v = 5 m/s. Calculate first; you have 3 tries.', hint: 'f = n·v/(2L) = 3 × 5 ÷ 12.', setup: G => tuner(G, { n: 3, v: 5 }) },
      { name: 'Quiet seat', goal: 'Two speakers play the same note. Drag the probe to a <b>quiet</b> seat (under 10 %).', hint: 'Look for the gray, still bands between bright ones.', setup: G => quiet(G) }
    ]
  };
  const finale = () => stringScene({ f: 1, A: .25, v: 4, end: 'fixed' }, { env: true });
  XLab.define({ id: 'waves', guided: { steps, S, quiz, finale, finaleMsg: 'Good vibrations! Now check your thinking.', summary: () => 'You measured wavelength, used v = fλ, built standing waves at the harmonic frequencies, and found constructive and destructive interference from path differences.' }, free, game });
})();
