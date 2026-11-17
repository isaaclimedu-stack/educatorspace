/* ═══════════ HS Biology: "Immune Defense: Pathogen Invasion" ═══════════
   Infection model (time in days, dt = 0.02):
     pathogens   dP/dt = r·P·(1 − P/10⁷) − 1.2·I·innate·P·10⁴/(P + 10⁴) − 0.6·A·P   (P per mL; innate killing saturates at high P)
     innate      dI/dt = 3·P/(P + 500)·(1 − I) − 0.4·(I − 0.05)                     (macrophages and neutrophils: fast, not specific)
     adaptive    once P has been seen, after a lag (4 days first time, 1.5 days with memory) plasma cells C expand:
                 dC/dt = 1.1·C while P > 1 and for 5 days after activation (cap 3 first time, 20 with memory), then decays 0.25/day
                 antibodies dA/dt = C − 0.12·A, kept separately for each antigen (an antibody only fights its own antigen)
     memory      after a primary response, memory cells remain: a second meeting with the SAME antigen starts with
                 C = 0.4 and a short lag. A different antigen (a new strain) gets no head start.
     vaccine     shows the antigen without a dividing pathogen: it triggers a primary response and memory, but no illness.
   Illness: P above 10⁴ = symptoms, above 10⁶ = severe. */
(() => {
  const K = Kit, f = SimLab.f;
  const lg = x => Math.log10(Math.max(1, x));
  function body(o = {}) { return Object.assign({ t: 0, P: 0, I: .05, C: 0, A: 0, seen: null, mem: {}, ag: 'tri', r: 1.6, innate: 1, peakP: 0, peakA: 0, tPeakA: 0, tClear: null, sick: 0, Ab: {}, hist: [], log: [] }, o); }
  function infect(b, dose, ag) { b.P += dose; b.ag = ag; b.seen = null; b.actT = null; b.memNow = !!b.mem[ag]; b.C = b.memNow ? .4 : 0; b.tClear = null; b.inf = b.t; b.peakP = 0; b.A = b.Ab[ag] || 0; b.peakA = b.A; b.tPeakA = b.t; }
  function vaccinate(b, ag) { b.mem[ag] = 'vax'; b.vaxT = b.t; b.ag = ag; b.C = .05; b.vaxing = ag; }
  let KI = 1.2, KA = .6;
  function step(b, dt) {
    const P = b.P, ag = b.ag;
    if (P > 1 && b.seen == null) b.seen = b.t;
    const lag = b.memNow ? 1.5 : 4, active = b.seen != null && b.t - b.seen >= lag, cap = b.memNow ? 20 : 3;
    if (active && b.actT == null) b.actT = b.t;
    if (b.vaxing) { if (b.t - b.vaxT < 5) b.C = Math.min(1, b.C * (1 + .8 * dt) + .01 * dt); else b.vaxing = null; }
    else if (b.adaptiveOff) b.C = 0;
    else if (active && (P > 1 || b.t - b.actT < 5)) { b.C = Math.min(cap, Math.max(b.C, .02) * (1 + 1.1 * dt)); } else b.C = Math.max(0, b.C - .25 * b.C * dt);
    Object.keys(b.Ab).forEach(k => { if (k !== ag) b.Ab[k] *= 1 - .12 * dt; }); b.Ab[ag] = Math.max(0, (b.Ab[ag] || 0) + (b.C - .12 * (b.Ab[ag] || 0)) * dt); b.A = b.Ab[ag];
    if (active && P > 1 && !b.mem[ag] && !b.adaptiveOff) b.mem[ag] = 'mem';
    if (P > 1e4) b.sick += dt;
    b.I += (3 * P / (P + 500) * (1 - b.I) - .4 * (b.I - .05)) * dt;
    const dP = b.r * P * (1 - P / 1e7) - KI * b.I * b.innate * P * 1e4 / (P + 1e4) - KA * b.A * P;
    b.P = Math.max(0, P + dP * dt); if (b.P < .5 && P >= .5) { b.P = 0; if (b.tClear == null && b.inf != null) b.tClear = b.t - b.inf; }
    if (b.P > b.peakP) b.peakP = b.P; if (b.A > b.peakA) { b.peakA = b.A; b.tPeakA = b.t; }
    b.t += dt;
  }
  const status = b => b.P > 1e6 ? ['Severe illness', '#ff6b6b'] : b.P > 1e4 ? ['Feeling sick (symptoms)', '#ffd27a'] : b.P > 0 ? ['Infected, no symptoms', '#9fd0ff'] : ['Healthy', '#7ee0a1'];
  /* drawing: a blood vessel with pathogens, innate cells and antibodies; plus the graph */
  const shp = (k, x, y, s, c) => k === 'tri' ? `<path d="M${x - s},${y + s * .8}L${x + s},${y + s * .8}L${x},${y - s}Z" fill="${c}"/>` : k === 'sq' ? `<rect x="${x - s * .8}" y="${y - s * .8}" width="${s * 1.6}" height="${s * 1.6}" fill="${c}"/>` : k === 'star' ? `<path d="M${x},${y - s} L${x + s * .3},${y - s * .3} L${x + s},${y} L${x + s * .3},${y + s * .3} L${x},${y + s} L${x - s * .3},${y + s * .3} L${x - s},${y} L${x - s * .3},${y - s * .3}Z" fill="${c}"/>` : `<circle cx="${x}" cy="${y}" r="${s * .85}" fill="${c}"/>`;
  function bug(x, y, ag, virus, s = 1, tag) {
    let g = `<g transform="translate(${x} ${y}) scale(${s})">`;
    if (virus) g += `<circle r="13" fill="#7ee081" stroke="#3a9a46" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * 6.283; return `<line x1="${Math.cos(a) * 13}" y1="${Math.sin(a) * 13}" x2="${Math.cos(a) * 20}" y2="${Math.sin(a) * 20}" stroke="#3a9a46" stroke-width="2"/>${shp(ag, Math.cos(a) * 22, Math.sin(a) * 22, 4, '#ffd27a')}`; }).join('')}`;
    else g += `<rect x="-22" y="-11" width="44" height="22" rx="11" fill="#d9465f" stroke="#ff8a9a" stroke-width="2"/>${[-14, 0, 14].map(d => shp(ag, d, -15, 4.5, '#ffd27a') + shp(ag, d, 15, 4.5, '#ffd27a')).join('')}`;
    if (tag) g += `<path d="M-6,-26 l6,8 l6,-8 M0,-18 v10" stroke="#9fd0ff" stroke-width="3" fill="none"/>`;
    return g + '</g>';
  }
  const antibody = (x, y, ag, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0,14 V0 L-9,-11 M0,0 L9,-11" stroke="#9fd0ff" stroke-width="4" fill="none" stroke-linecap="round"/>${shp(ag, -11, -15, 4, '#9fd0ff')}${shp(ag, 11, -15, 4, '#9fd0ff')}</g>`;
  const macro = (x, y, s = 1, T = 0) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="${Array.from({ length: 13 }, (_, i) => { const a = i / 12 * 6.283, r = 26 + Math.sin(a * 3 + T * 2) * 5; return `${i ? 'L' : 'M'}${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(' ')}Z" fill="#e8f1ff" stroke="#9fc2ff" stroke-width="2"/><circle cx="4" cy="-2" r="10" fill="#7c9cff"/></g>`;
  function vessel(T) { return `<rect width="1000" height="620" fill="#4a0f22"/><path d="M0,120 Q250,90 500,120 T1000,120 L1000,470 Q750,500 500,470 T0,470Z" fill="#7a1c34"/>${Array.from({ length: 14 }, (_, i) => { const x = ((i * 83 + T * 40) % 1100) - 50, y = 150 + SimLab.hash(i) * 300; return `<ellipse cx="${x}" cy="${y}" rx="16" ry="10" fill="#c43a52" opacity=".55"/>`; }).join('')}`; }
  function scene(b, T, opt = {}) {
    let g = vessel(T); const nP = Math.min(30, Math.round(lg(b.P) * 4.2)), nI = Math.min(8, Math.round(b.I * 9)), nA = Math.min(26, Math.round(Math.sqrt(b.A) * 5));
    for (let i = 0; i < nP; i++) { const x = 60 + ((SimLab.hash(i) * 600 + T * 30 * (1 + SimLab.hash(i + 9))) % 600), y = 160 + SimLab.hash(i * 3) * 280 + Math.sin(T * 2 + i) * 6; g += bug(x, y, b.ag, opt.virus, .8, nA > 4 && i % 3 === 0); }
    for (let i = 0; i < nI; i++) g += macro(90 + i * 75, 200 + (i % 2) * 180 + Math.sin(T + i) * 10, .9, T + i);
    for (let i = 0; i < nA; i++) g += antibody(70 + SimLab.hash(i + 40) * 600, 150 + ((SimLab.hash(i + 70) * 300 + T * 25) % 300), b.ag, .8, Math.sin(T + i) * 30);
    const [st, col] = status(b), h = b.hist;
    g += SimLab.hud(690, 20, 290, [['Day', f(b.t, 1)], ['Pathogens', b.P >= 1 ? `10^${f(lg(b.P), 1)} /mL` : '0', '#ff8a9a'], ['Innate cells', `${f(b.I * 100)} %`, '#e8f1ff'], ['Antibodies', f(b.A, 1), '#9fd0ff'], ['Memory for ▲■★●', ['tri', 'sq', 'star', 'circ'].map(a => b.mem[a] ? '✓' : '·').join(' ')]], 'Patient chart')
      + `<g transform="translate(690 152)"><rect width="290" height="32" rx="8" fill="${col}" fill-opacity=".9"/><text x="145" y="21" font-size="14" font-weight="800" fill="#10202a" text-anchor="middle">${st}</text></g>`
      + SimLab.chart(706, 226, 258, 150, [{ d: h.map(x => x[0]), c: '#ff8a9a', n: 'pathogens (log)' }, { d: h.map(x => Math.min(8, x[1] / 8)), c: '#9fd0ff', n: 'antibodies' }, { d: h.map(() => 4), c: '#ffd27a', n: 'symptoms', dash: '4 4', w: 1.2 }], { ymax: 8, xs: Math.max(30, h.length), title: 'Infection over time (days)', marks: opt.marks || [] });
    return g + (opt.extra || '');
  }
  /* runs a timeline of events (infect / vaccinate) through D days at ~6 days per second */
  function runner(b, cfg = {}) {
    let T = 0, run = false, events = [], acc = 0;
    SimLab.stage('', (g, dt) => { T += dt;
      if (run) { const days = dt * (cfg.speed || 4); for (let k = 0; k < 10; k++) { step(b, days / 10); events.filter(e => !e.done && b.t >= e.t).forEach(e => { e.done = 1; e.fn(b); }); } acc += days; while (acc >= .5) { acc -= .5; b.hist.push([lg(b.P), b.A]); }
        if (b.t >= cfg.days) { run = false; SND.ok(); cfg.onEnd && cfg.onEnd(b); } }
      g.innerHTML = scene(b, T, { virus: cfg.virus, marks: events.map(e => ({ i: e.t * 2, t: e.label, c: e.c })), extra: cfg.extra ? cfg.extra(b) : '' }); });
    return { go(evts) { const mem = cfg.keepMemory ? b.mem : {}; Object.assign(b, body({ r: b.r, innate: b.innate, mem: Object.assign({}, mem) })); events = evts.map(e => Object.assign({}, e)); run = true; acc = 0; SND.tone(520, .15, 'sine', .05, 700); }, running: () => run };
  }

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'innate', name: 'Innate vs adaptive', title: 'First responders', html: 'Bacteria get into a cut. Run the infection with <b>only innate immunity</b> (macrophages and neutrophils), then with <b>innate + adaptive</b> (B cells and antibodies). Watch the graph for 25 days.', hint: 'Use the two run buttons. Compare when the pathogen line falls back to 0.' },
    { id: 'match', name: 'Antibodies', title: 'Lock on', html: 'Antibodies are shaped to fit one <b>antigen</b> (a molecule on the pathogen’s surface). Pick the antibody that fits each invader.', hint: 'Match the shape on the antibody’s tips to the knobs on the pathogen.' },
    { id: 'memory', name: 'Immune memory', title: 'The second attack', html: 'Run a 60-day timeline: the <b>same</b> bacteria infect on <b>day 0</b> and again on <b>day 30</b>. Compare the antibody response and how sick the patient gets each time.', hint: 'Look at how fast the blue antibody line rises after each infection.' },
    { id: 'vaccine', name: 'Vaccines', title: 'Train the army', html: 'Give a <b>vaccine</b> (harmless antigen) on day 0, then infect with the real pathogen on day 20. Then try a <b>new strain</b> with a different antigen.', hint: 'A vaccine makes memory cells for one antigen only.' }
  ];
  const S = {
    innate: R => { const b = body(); let only = null, both = null;
      const run = runner(b, { days: 25, onEnd: x => { const r = { peak: x.peakP, clear: x.tClear }; if (x.innate && x.adaptiveOff) { only = r; XLab.note(`Innate only: peak 10^${f(lg(r.peak), 1)} bacteria/mL, ${r.clear ? `cleared on day ${f(r.clear, 1)}` : 'not cleared in 25 days'}.`); } else { both = r; XLab.note(`Innate + adaptive: peak 10^${f(lg(r.peak), 1)}/mL, cleared on day ${r.clear ? f(r.clear, 1) : '–'}.`); } G.check(); } });
      SimLab.panel(b, [{ btns: [{ id: 'a', label: 'Run: innate only', cls: 'primary', fn: () => { run.go([{ t: 0, fn: x => { x.adaptiveOff = true; infect(x, 50, 'tri'); }, label: 'cut' }]); } }, { id: 'b', label: 'Run: innate + adaptive', fn: () => { run.go([{ t: 0, fn: x => infect(x, 50, 'tri'), label: 'cut' }]); } }] }]);
      const G = SimLab.goals(R, { name: 'Innate vs adaptive', items: () => [[!!only, 'Run with innate immunity only'], [!!both, 'Run with innate + adaptive immunity']],
        q: { q: 'What did the adaptive response add?', a: ['Specific antibodies that finally cleared the infection, after a delay of several days', 'A faster first response in the first hours', 'Nothing: innate immunity alone is enough', 'It made the bacteria grow faster'], c: 0, e: 'Innate defenses act within hours but are general and can only hold bacteria back. The <b>adaptive</b> response takes about a week to start (B cells must be selected and multiply), but its antibodies are specific and clear the infection.' } }); },
    match: R => { const bugs = [['tri', false], ['star', true], ['circ', false]]; let i = 0, wrong = 0;
      SimLab.stage(vessel(0), g => { const [ag, v] = bugs[Math.min(i, 2)]; g.innerHTML = i < 3 ? `${bug(330, 300, ag, v, 3.2)}<text x="330" y="470" font-size="18" font-weight="800" fill="#fff" text-anchor="middle">Invader ${i + 1} of 3: ${v ? 'virus' : 'bacterium'}</text>` : `<text x="500" y="300" font-size="24" font-weight="800" fill="#7ee0a1" text-anchor="middle">All three tagged!</text>`; });
      const box = LabUI.html(''); const draw = () => { box.innerHTML = `<div class="pl-lab">Choose the antibody</div><div class="sim-pick">${['tri', 'sq', 'star', 'circ'].map(a => `<button class="btn sm" data-ab="${a}" style="padding:6px"><svg viewBox="-20 -25 40 45" width="40" height="44">${antibody(0, 0, a, 1)}</svg></button>`).join('')}</div>`;
        $$('[data-ab]', box).forEach(x => x.onclick = () => { if (i >= 3) return; if (x.dataset.ab === bugs[i][0]) { SND.ok(); K.msg('It fits! The antibody binds the antigen.', 'ok', 1800); i++; G.check(); } else { wrong++; SND.nope(); R.mistake('Antibody choice', 'Each antibody only binds the antigen whose shape matches its binding sites.'); K.msg('That antibody doesn’t fit this antigen.', 'bad', 2000); } }); };
      draw();
      const G = SimLab.goals(R, { name: 'Antibodies', items: () => [[i >= 3, `Tag all three invaders (${i}/3)`]],
        q: { q: 'Once antibodies bind a bacterium, what happens?', a: ['It is marked for destruction: macrophages engulf it more easily, and toxins or viruses are neutralized', 'The antibody digests it by itself', 'It turns into a memory cell', 'Nothing happens until a fever starts'], c: 0, e: 'Antibodies don’t kill directly. They <b>tag</b> pathogens (making phagocytes eat them faster), clump them together, and block viruses and toxins from entering cells.' } }); },
    memory: R => { const b = body(); let done = null;
      const run = runner(b, { days: 60, onEnd: x => { done = x.log.slice(); XLab.note(done.map(d => `${d.n}: antibodies peaked ${f(d.tA, 1)} days after infection; pathogens peaked at 10^${f(d.lp, 1)}/mL`).join('. ') + '.'); G.check(); } });
      const ev = [{ t: 0, fn: x => infect(x, 50, 'tri'), label: '1st', c: '#ffd27a' }, { t: 30, fn: x => { x.log.push({ n: 'First infection', tA: x.tPeakA - x.inf, lp: lg(x.peakP) }); infect(x, 50, 'tri'); }, label: '2nd', c: '#ffd27a' }, { t: 59.9, fn: x => x.log.push({ n: 'Second infection', tA: x.tPeakA - x.inf, lp: lg(x.peakP) }), label: '' }];
      SimLab.panel(b, [{ btns: [{ id: 'go', label: 'Run 60 days', cls: 'primary', fn: () => run.go(ev) }] }]);
      const G = SimLab.goals(R, { name: 'Memory', items: () => [[!!done, 'Run both infections']],
        q: { q: 'Why was the second response faster and stronger?', a: ['Memory B cells from the first infection recognized the antigen right away', 'The bacteria were weaker the second time', 'Innate immunity learned the antigen', 'Antibodies from the first infection lasted forever'], c: 0, e: 'After the first (primary) response, <b>memory B and T cells</b> stay in the body. On a second meeting they multiply within a day or two and make far more antibody, often clearing the pathogen before symptoms appear. This is immunity.' } }); },
    vaccine: R => { const b = body(); const res = {};
      const run = runner(b, { days: 45, onEnd: x => { res[x.kind] = lg(x.peakP); XLab.note(`${x.kind === 'vax' ? 'Vaccinated, same strain' : x.kind === 'none' ? 'No vaccine' : 'Vaccinated, new strain'}: pathogens peaked at 10^${f(lg(x.peakP), 1)}/mL (${status({ P: x.peakP })[0].toLowerCase()}).`); G.check(); } });
      const mk = (kind, vax, ag) => [{ t: 0, fn: x => { x.kind = kind; if (vax) vaccinate(x, 'tri'); }, label: vax ? 'vaccine' : '', c: '#7ee0a1' }, { t: 20, fn: x => infect(x, 50, ag), label: 'infection', c: '#ffd27a' }];
      SimLab.panel(b, [{ btns: [{ id: 'n', label: 'No vaccine', fn: () => run.go(mk('none', false, 'tri')) }, { id: 'v', label: 'Vaccine ▲, then ▲ strain', cls: 'primary', fn: () => run.go(mk('vax', true, 'tri')) }, { id: 's', label: 'Vaccine ▲, then new ★ strain', fn: () => run.go(mk('new', true, 'star')) }] }]);
      const G = SimLab.goals(R, { name: 'Vaccines', items: () => [[res.none != null, 'Unvaccinated patient'], [res.vax != null, 'Vaccinated patient, same strain'], [res.new != null, 'Vaccinated patient, new strain']],
        q: { q: 'Why didn’t the ▲ vaccine protect against the ★ strain?', a: ['Memory cells are specific: the new strain’s antigen has a different shape', 'Vaccines wear off after 20 days', 'The ★ strain is a virus', 'The patient’s innate immunity was turned off'], c: 0, e: 'A vaccine trains memory cells against particular antigens. When a pathogen <b>mutates</b> its surface antigens (as flu does every year), old memory cells don’t recognize it, which is why some vaccines are updated.' } }); }
  };
  const quiz = [
    { q: 'Which cells make antibodies?', a: ['Plasma cells (activated B cells)', 'Red blood cells', 'Macrophages', 'Platelets'], c: 0, e: 'B cells that recognize an antigen multiply and become plasma cells, which release antibodies.' },
    { q: 'Killer (cytotoxic) T cells destroy…', a: ['Body cells infected by viruses', 'Antibodies', 'Memory B cells', 'Healthy red blood cells'], c: 0, e: 'Viruses hide inside cells, where antibodies can’t reach. Killer T cells recognize viral antigens displayed on infected cells and destroy them.' },
    { q: 'Which is part of innate (non-specific) immunity?', a: ['Skin, inflammation and phagocytes', 'Antibodies against measles', 'Memory B cells', 'Vaccination'], c: 0, e: 'Innate defenses are the same for every pathogen and act within minutes to hours.' },
    { q: 'Herd immunity protects unvaccinated people because…', a: ['The pathogen can’t spread easily when most people are immune', 'Vaccines spread through the air', 'Unvaccinated people inherit antibodies', 'Pathogens stop mutating'], c: 0, e: 'If most of a population is immune, chains of transmission break, so the pathogen rarely reaches those who can’t be vaccinated.' },
    { q: 'Antibiotics cure bacterial infections but not the flu because…', a: ['Antibiotics target bacterial structures; viruses don’t have them', 'Flu viruses are too big', 'Antibiotics only work on fungi', 'The flu is not an infection'], c: 0, e: 'Antibiotics attack features like bacterial cell walls and ribosomes. Viruses use the host’s cell machinery, so antibiotics don’t affect them.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Design an infection and run 40 days. Each run is <b>recorded automatically</b>.',
    fresh: () => ({ dose: 50, r: 1.6, innate: 1, prior: 'none' }),
    vars: [{ k: 'dose', label: 'Infecting dose', short: 'Dose', min: 10, max: 2000, step: 10, unit: 'cells', d: 0, fmt: v => v + ' cells' }, { k: 'r', label: 'Pathogen growth rate', short: 'Growth', min: .6, max: 3, step: .1, unit: '/day', d: 1, fmt: v => f(v, 1) + ' per day' }, { k: 'innate', label: 'Innate immunity strength', short: 'Innate', min: 0, max: 2, step: .1, unit: '×', d: 1, fmt: v => f(v, 1) + '×' }],
    cats: [{ k: 'prior', label: 'Before the infection', opts: [['none', 'Never exposed'], ['vax', 'Vaccinated (same antigen)'], ['strain', 'Vaccinated (other strain)']] }],
    measures: [{ k: 'peak', label: 'Peak pathogens (log₁₀ per mL)', short: 'Peak log', unit: '', d: 1 }, { k: 'clear', label: 'Days to clear the infection', short: 'Clear', unit: 'days', d: 1 }, { k: 'abT', label: 'Days to antibody peak', short: 'Ab peak', unit: 'days', d: 1 }, { k: 'sick', label: 'Days with symptoms', short: 'Sick days', unit: 'days', d: 1 }, { k: 'out', label: 'Outcome', text: true }],
    noRecord: true,
    ideas: [['How does the infecting dose affect how sick the patient gets?', 'dose', 'peak'], ['How does pathogen growth rate affect days with symptoms?', 'r', 'sick'], ['How does innate immunity strength affect the peak?', 'innate', 'peak']],
    expect(x, y) {
      if (x === 'dose') return { t: 'up', why: 'A bigger dose gives the pathogens a head start before the adaptive response arrives (about 5 days), so the peak is higher. Vaccinated patients respond within a day or two, so the dose matters much less.' };
      if (x === 'r') return { t: 'up', why: 'Faster-dividing pathogens grow further during the lag before antibodies appear, so peaks are higher and symptoms last longer.' };
      if (x === 'innate') return { t: 'down', why: 'Innate cells kill pathogens from the first hours. Stronger innate defenses hold the numbers down until the adaptive response takes over; with very weak innate immunity even a small dose explodes.' };
      return null;
    },
    setup(F) {
      const b = body();
      const run = runner(b, { days: 40, onEnd: x => { F.add({ peak: lg(x.peakP), clear: x.tClear != null ? x.tClear : 40, abT: x.tPeakA - x.inf, sick: x.sick, out: x.peakP > 1e6 ? 'severe illness' : x.peakP > 1e4 ? 'sick, recovered' : 'no symptoms' }); } });
      const go = () => { const s = F.st, ev = []; if (s.prior !== 'none') ev.push({ t: 0, fn: x => vaccinate(x, s.prior === 'vax' ? 'tri' : 'star'), label: 'vaccine', c: '#7ee0a1' });
        ev.push({ t: s.prior !== 'none' ? 15 : 0, fn: x => { x.r = s.r; x.innate = s.innate; infect(x, s.dose, 'tri'); }, label: 'infection', c: '#ffd27a' });
        if (s.prior !== 'none') ev.push({ t: 39.99, fn: () => {}, label: '' }); run.go(ev); };
      const bx = LabUI.html('<div class="row sim-btns"><button class="btn sm primary" id="imGo">Run 40 days</button></div>'); $('#imGo', bx).onclick = go;
    }
  };

  /* ═════ Game: Pathogen Invasion (real time) ═════ */
  function defense(G, o) {
    let T = 0, hp = 100, en = 60, wi = 0, spawned = 0, nextAt = 1.5, tool = 'mac', pick = null; const bugs = [], macs = [], tcells = [], cells = [], known = Object.assign({}, o.memory || {}), resp = {};
    for (let i = 0; i < 8; i++) cells.push({ x: 80 + i * 115, y: 535, inf: 0, dead: false });
    G.panel({}, [{ html: `<div class="sim-note"><b>Macrophage</b> (20 ⚡): click the vessel to place one. It eats nearby invaders, faster if they are tagged with antibodies.<br><b>Identify</b>: click an invader, then pick the matching antibody. B cells take time to respond the first time${o.virus ? '; then click infected tissue cells to send <b>killer T cells</b> (15 ⚡)' : ''}.</div>` },
      { btns: [{ id: 'mac', label: '🔵 Macrophage', cls: 'primary', fn: () => setTool('mac') }, { id: 'id', label: '🔎 Identify', fn: () => setTool('id') }] }]);
    const setTool = t => { tool = t; $$('[data-sb="mac"],[data-sb="id"]').forEach(b => b.classList.toggle('primary', b.dataset.sb === t)); };
    const wave = () => o.waves[wi];
    K.on(K.svg, 'pointerdown', e => { if (G.over() || pick) return; const p = K.pt(e);
      if (o.virus && p.y > 500) { const c = cells.find(c => Math.abs(c.x - p.x) < 50 && c.inf > 0 && !c.dead); if (c) { if (!resp[c.ag] || resp[c.ag].t < resp[c.ag].ready) { K.msg('Identify this virus’s antigen first, so T cells know what to look for.', 'bad', 2400); return; } if (en < 15) { K.msg('Not enough energy.', 'bad', 1400); return; } en -= 15; tcells.push({ x: p.x, y: 470, c }); SND.pop(); } return; }
      if (tool === 'mac') { if (p.y < 130 || p.y > 480) return; if (en < 20) { K.msg('Not enough energy (⚡ regenerates over time).', 'bad', 1400); return; } en -= 20; macs.push({ x: p.x, y: p.y, cd: 0 }); SND.pop(); }
      else { const b = bugs.find(b => Math.hypot(b.x - p.x, b.y - p.y) < 30); if (b) { if (resp[b.ag]) { K.msg('Already identified: B cells are on it.', 'ok', 1400); return; } pick = b.ag; openPick(); } } });
    function openPick() { const ov = document.createElement('div'); ov.className = 'oops'; ov.innerHTML = `<div class="box"><h3>Which antibody fits?</h3><p>Look at the knobs (antigens) on the invader.</p><div class="sim-pick">${['tri', 'sq', 'star', 'circ'].map(a => `<button class="btn" data-ab="${a}" style="padding:8px"><svg viewBox="-20 -25 40 45" width="56" height="62">${antibody(0, 0, a, 1)}</svg></button>`).join('')}</div></div>`; K.stage.appendChild(ov);
      $$('[data-ab]', ov).forEach(x => x.onclick = () => { ov.remove(); if (x.dataset.ab === pick) { const mem = known[pick]; resp[pick] = { t: 0, ready: mem ? 1.5 : 7 }; SND.ok(); K.msg(mem ? 'Memory B cells recognize it: antibodies in about 1.5 s!' : 'Correct! B cells are multiplying: antibodies in about 7 s.', 'ok', 3000); } else { SND.nope(); en = Math.max(0, en - 10); K.addMistake({ title: 'Wrong antibody', why: 'Antibodies only bind the antigen with the matching shape.', step: G.lv.name }); K.mistakeCount(); K.msg('Wrong shape: it can’t bind (−10 ⚡).', 'bad', 2000); } pick = null; }); }
    SimLab.stage('', (g, dt) => { if (!G.over()) { T += dt; en = Math.min(100, en + 6 * dt);
        const w = wave(); if (w) { nextAt -= dt; if (nextAt <= 0 && spawned < w.n) { spawned++; nextAt = w.gap; bugs.push({ x: -20, y: 160 + Math.random() * 290, ag: w.ag, v: o.virus, hp: 1, sp: w.sp || 38, tag: false }); }
          if (spawned >= w.n && !bugs.length) { known[w.ag] = true; wi++; spawned = 0; nextAt = 3; if (wi < o.waves.length) K.msg(`Wave ${wi + 1} incoming${o.waves[wi].ag === w.ag ? ' (same pathogen: memory cells are ready)' : ' (a NEW antigen!)'}`, 'ok', 3000); } }
        Object.entries(resp).forEach(([ag, r]) => { r.t += dt; if (r.t >= r.ready) bugs.forEach(b => { if (b.ag === ag) b.tag = true; }); if (r.t >= r.ready && !r.mem) { r.mem = 1; known[ag] = true; } });
        bugs.forEach(b => { b.x += b.sp * (b.tag ? .45 : 1) * dt; b.y += Math.sin(T * 2 + b.x * .02) * 12 * dt;
          if (o.virus && b.x > 200 && !b.tag && Math.random() < .25 * dt) { const c = cells.find(c => !c.dead && Math.abs(c.x - b.x) < 60); if (c) { c.inf = Math.max(c.inf, .01); c.ag = b.ag; b.hp = 0; } } });
        macs.forEach(m => { m.cd -= dt; if (m.cd > 0) return; const t = bugs.find(b => b.hp > 0 && Math.hypot(b.x - m.x, b.y - m.y) < 95); if (t) { t.hp = 0; m.cd = t.tag ? .35 : 1.5; K.sparkle({ x: t.x, y: t.y }, 8); } });
        for (let i = bugs.length - 1; i >= 0; i--) { const b = bugs[i]; if (b.hp <= 0) bugs.splice(i, 1); else if (b.x > 990) { bugs.splice(i, 1); hp -= o.dmg || 8; SND.wah(); } }
        cells.forEach(c => { if (c.inf > 0 && !c.dead) { c.inf += dt / 6; if (c.inf >= 1) { c.dead = true; hp -= 6; for (let k = 0; k < 3; k++) bugs.push({ x: c.x, y: 470, ag: c.ag, v: true, hp: 1, sp: 30, tag: !!(resp[c.ag] && resp[c.ag].t >= resp[c.ag].ready) }); } } });
        tcells.forEach(t => { t.y += 60 * dt; if (t.y >= 525 && !t.done) { t.done = 1; t.c.dead = true; t.c.inf = 0; t.c.killed = true; K.sparkle({ x: t.c.x, y: 535 }, 18); } });
        if (hp <= 0) G.lose('The infection spread', `Untagged pathogens got through. Place <b>macrophages</b> early (innate immunity buys time), and <b>identify</b> each new antigen quickly: the first (primary) antibody response takes days to build up${o.virus ? '. Viruses hide inside cells, where only killer T cells can reach them' : ''}.`);
        else if (wi >= o.waves.length) G.win(hp > 80 ? 3 : hp > 50 ? 2 : 1, hp * 20 + en * 2, `The body is defended with ${Math.round(hp)} % health left.`); }
      let s = vessel(T) + `<rect y="480" width="1000" height="140" fill="#5a1a2c"/>`;
      if (o.virus) cells.forEach(c => s += `<g transform="translate(${c.x} 540)"><rect x="-44" y="-26" width="88" height="52" rx="12" fill="${c.dead ? (c.killed ? '#3a2a30' : '#2a1a20') : c.inf > 0 ? `rgb(${200 - c.inf * 60},${120 - c.inf * 80},${140 - c.inf * 60})` : '#d98aa0'}" stroke="#ffb3c4" stroke-width="2"/><circle r="10" fill="#7a3a52"/>${c.inf > 0 && !c.dead ? shp(c.ag, 26, -14, 6, '#ffd27a') + `<rect x="-40" y="30" width="${80 * c.inf}" height="5" fill="#ffd27a"/>` : ''}${c.dead && !c.killed ? '<text y="5" font-size="11" fill="#ff8a9a" text-anchor="middle">burst</text>' : ''}</g>`);
      macs.forEach(m => s += `<circle cx="${m.x}" cy="${m.y}" r="95" fill="#9fc2ff" fill-opacity=".05" stroke="#9fc2ff" stroke-opacity=".2"/>` + macro(m.x, m.y, 1, T));
      bugs.forEach(b => s += bug(b.x, b.y, b.ag, b.v, .9, b.tag));
      tcells.filter(t => !t.done).forEach(t => s += `<g transform="translate(${t.x} ${t.y})"><circle r="16" fill="#7ee0a1" stroke="#2f8a3a" stroke-width="3"/><text y="5" font-size="13" font-weight="800" fill="#123" text-anchor="middle">T</text></g>`);
      s += `<rect x="0" y="0" width="1000" height="36" fill="#0b1020" fill-opacity=".8"/><text x="16" y="24" font-size="14" font-weight="800" fill="#fff">Wave ${Math.min(wi + 1, o.waves.length)}/${o.waves.length}</text>
        ${SimLab.bar(160, 22, 200, hp / 100, hp > 50 ? '#7ee0a1' : '#ff6b6b', '', '')}<text x="370" y="26" font-size="13" font-weight="800" fill="#fff">❤ ${Math.max(0, Math.round(hp))} %</text>
        ${SimLab.bar(470, 22, 160, en / 100, '#ffd27a', '', '')}<text x="640" y="26" font-size="13" font-weight="800" fill="#ffd27a">⚡ ${Math.round(en)}</text>
        ${Object.entries(resp).map(([ag, r], i) => `<g transform="translate(${740 + i * 84} 18)">${shp(ag, 0, 0, 7, '#9fd0ff')}<text x="12" y="5" font-size="12" font-weight="800" fill="${r.t >= r.ready ? '#7ee0a1' : '#ffd27a'}">${r.t >= r.ready ? 'tagging' : Math.ceil(r.ready - r.t) + ' s'}</text></g>`).join('')}
        <text x="985" y="26" font-size="12" fill="#a9b6cc" text-anchor="end">tool: ${tool === 'mac' ? 'macrophage' : 'identify'}</text>`;
      g.innerHTML = s; });
  }
  const game = {
    title: 'Pathogen Invasion', intro: 'Invaders flow through the blood vessel toward the body’s organs (right side). Use <b>innate</b> defenders right away and train the <b>adaptive</b> response by identifying each antigen. Memory makes later waves easier.',
    cover: () => `${vessel(0)}${labThumb('immune').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Pathogen Invasion</text><text x="500" y="540" font-size="18" fill="#ffc2cf" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'First infection', goal: 'One wave of bacteria. Place macrophages, then identify the bacteria so B cells can make antibodies.', hint: 'Identify early: the first antibody response takes about 7 seconds to arrive.', setup: G => defense(G, { dmg: 6, waves: [{ ag: 'tri', n: 16, gap: 1.1 }] }) },
      { name: 'It’s back', goal: 'Two waves of the <b>same</b> bacteria. After the first wave, memory cells remember the antigen.', hint: 'In wave 2, identify again: memory B cells answer in about 1.5 s.', setup: G => defense(G, { dmg: 6, waves: [{ ag: 'sq', n: 14, gap: 1 }, { ag: 'sq', n: 26, gap: .55, sp: 46 }] }) },
      { name: 'Viral attack', goal: 'Viruses <b>infect tissue cells</b> (bottom). Infected cells burst and release more virus. Identify the virus, then click infected cells to send killer T cells.', hint: 'Antibodies stop viruses in the blood; killer T cells destroy infected cells before they burst.', setup: G => defense(G, { virus: true, dmg: 7, waves: [{ ag: 'star', n: 18, gap: 1.2 }] }) },
      { name: 'Vaccinated, but…', goal: 'The patient was vaccinated against ▲. Wave 1 is ▲, but wave 2 is a <b>new strain</b>.', hint: 'The vaccine gives memory only for ▲. The new strain needs a fresh (slow) primary response, so identify it immediately and place macrophages.', setup: G => defense(G, { dmg: 7, memory: { tri: true }, waves: [{ ag: 'tri', n: 20, gap: .7, sp: 44 }, { ag: 'circ', n: 20, gap: .9, sp: 42 }] }) }
    ]
  };
  const finale = () => { const b = body({ mem: { tri: 'mem' } }); runner(b, { days: 20 }).go([{ t: 0, fn: x => infect(x, 50, 'tri'), label: 'infection' }]); };
  XLab.define({ id: 'immune', guided: { steps, S, quiz, finale, finaleMsg: 'Infection cleared! Now check your thinking.', summary: () => 'You compared innate and adaptive immunity, matched antibodies to antigens, saw memory make the second response faster and stronger, and tested how vaccines work and why new strains get past them.' }, free, game });
})();
