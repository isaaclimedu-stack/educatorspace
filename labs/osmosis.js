/* ═══════════ HS Biology: "Osmosis Crisis: Save the Cell" ═══════════
   Model (osmotic concentrations in mOsm/L; a normal cell's inside is 300, like 0.9 % saline):
     the cell holds a fixed amount of solutes that can't cross the membrane (n = 1 in units of 300 mOsm at normal volume)
     plus any amount u of a solute that can cross (urea). V = volume (1 = normal).
     water flow  dV/dt = 0.07·Lp·((n + u)/V − Co − P)      Lp = water permeability (aquaporins), Co = outside concentration / 300
     solute flow du/dt = 0.04·Ps·(Co − u/V)                 only for a crossing solute (urea); NaCl and sucrose can't cross
     plant cells: the wall pushes back once the cell fills it, P = 6·(V − 1) for V > 1 (turgor pressure), so they never burst.
   Animal cells burst (lysis) at V ≥ 1.6 and shrivel too far (crenation) at V ≤ 0.55. Plant cells plasmolyze below V = 0.85
   (the membrane pulls away from the wall) and die below 0.33. */
(() => {
  const K = Kit, f = SimLab.f;
  const BURST = 1.6, SHRIVEL = .55, PLASMO = .85, PDEAD = .33;
  const cell = (o = {}) => Object.assign({ V: 1, u: 0, t: 0, dead: '', hist: [1], Co: 300, Lp: 1, Ps: .5, sol: 'nacl', type: 'animal', ci: 300, flow: 0 }, o);
  const perm = c => c.sol === 'urea';
  function step(c, dt) {
    if (c.dead) { c.flow = 0; return; }
    const Co = c.Co / 300, n = c.ci / 300, P = c.type === 'plant' && c.V > 1 ? 6 * (c.V - 1) : 0;
    const dV = .07 * c.Lp * ((n + c.u) / c.V - Co - P), du = perm(c) ? .04 * c.Ps * (Co - c.u / c.V) : 0;
    c.flow = dV; c.V = Math.max(.3, c.V + dV * dt); c.u = Math.max(0, c.u + du * dt); c.t += dt;
    if (c.type === 'animal' && c.V >= BURST) { c.dead = 'burst'; c.V = BURST; }
    else if (c.type === 'animal' && c.V <= SHRIVEL) c.dead = 'shrivel';
    else if (c.type === 'plant' && c.V <= PDEAD) c.dead = 'plasmo';
  }
  const status = c => c.dead === 'burst' ? ['BURST (lysis)', '#ff6b6b'] : c.dead === 'shrivel' ? ['SHRIVELED (crenated)', '#ff6b6b'] : c.dead === 'plasmo' ? ['DEAD (severe plasmolysis)', '#ff6b6b']
    : c.type === 'plant' ? (c.V < PLASMO ? ['Plasmolyzed (wilting)', '#ffd27a'] : c.V > 1.02 ? ['Turgid (firm, healthy)', '#7ee0a1'] : ['Flaccid (limp)', '#ffd27a'])
    : c.V > 1.15 ? [Math.abs(c.flow) > .002 ? 'Swelling: danger!' : 'Swollen: danger!', '#ffd27a'] : c.V < .85 ? [Math.abs(c.flow) > .002 ? 'Shrinking: danger!' : 'Shrunken (crenated)', '#ffd27a'] : ['Normal', '#7ee0a1'];
  const tonic = c => { const d = c.Co - (c.ci + (perm(c) ? 0 : 0)); return perm(c) ? 'contains urea (crosses the membrane)' : Math.abs(d) <= 10 ? 'isotonic' : d < 0 ? 'hypotonic' : 'hypertonic'; };
  /* water and solute particles for the beaker view (drawn on the canvas) */
  function particles() { const P = []; for (let i = 0; i < 520; i++) P.push({ x: Math.random(), y: Math.random(), a: Math.random() * 6.3, k: i % 4 === 0 ? 's' : 'w', r: Math.random() }); return P; }
  const CX = 350, CY = 320;
  function ellR(c) { const s = Math.sqrt(c.V); return c.type === 'plant' ? [128 * Math.min(1.04, s), 96 * Math.min(1.04, s)] : [140 * s, 102 * s]; }
  function inCell(c, x, y) { const [a, b] = ellR(c); return ((x - CX) / a) ** 2 + ((y - CY) / b) ** 2 < 1; }
  function drawBeaker(g, c, P, dt, T) {
    g.clearRect(0, 0, 1000, 620);
    const bg = g.createLinearGradient(0, 0, 0, 620); bg.addColorStop(0, '#0e3550'); bg.addColorStop(1, '#0a2238'); g.fillStyle = bg; g.fillRect(0, 0, 1000, 620);
    /* the solution */
    g.fillStyle = c.sol === 'urea' ? 'rgba(160,220,140,.10)' : `rgba(255,180,90,${Math.min(.22, c.Co / 4500)})`; g.fillRect(30, 70, 640, 500);
    g.strokeStyle = 'rgba(200,230,255,.5)'; g.lineWidth = 4; g.strokeRect(30, 70, 640, 500);
    /* particles: solute density matches the concentrations; water dots everywhere */
    const outS = c.Co / 300, inS = (c.ci / 300 + c.u) / c.V, [ra, rb] = ellR(c);
    let nOut = 0, nIn = 0; const capOut = Math.round(outS * 52), capIn = Math.round(inS * 22);
    P.forEach(p => {
      p.a += (p.r - .5) * 2 * dt; const sp = p.k === 's' ? .018 : .03; p.x += Math.cos(p.a) * sp * dt; p.y += Math.sin(p.a) * sp * dt;
      if (p.x < 0 || p.x > 1) { p.x = Math.min(1, Math.max(0, p.x)); p.a = Math.PI - p.a; } if (p.y < 0 || p.y > 1) { p.y = Math.min(1, Math.max(0, p.y)); p.a = -p.a; }
      const x = 36 + p.x * 628, y = 76 + p.y * 488, inside = !c.dead && inCell(c, x, y);
      if (p.k === 's') { if (inside) { if (nIn++ >= capIn) return; } else { if (nOut++ >= capOut) return; } g.fillStyle = inside ? (c.sol === 'urea' && nIn > Math.round(c.ci / 300 / c.V * 22) ? '#9be38a' : '#d58cff') : c.sol === 'urea' ? '#9be38a' : '#ffb347'; g.beginPath(); g.arc(x, y, 4.2, 0, 6.29); g.fill(); }
      else { g.fillStyle = 'rgba(127,211,255,.55)'; g.beginPath(); g.arc(x, y, 2.2, 0, 6.29); g.fill(); }
    });
    /* water crossing the membrane: arrows in the direction of net flow */
    if (!c.dead && Math.abs(c.flow) > .0015) { const n = Math.min(14, Math.ceil(Math.abs(c.flow) * 260)), dir = c.flow > 0 ? -1 : 1;
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + T * .3, k = ((T * 1.4 + i * .37) % 1), r0 = 1 + dir * (.35 - k * .7) * -1, x = CX + Math.cos(a) * ra * (1 + dir * (k - .5) * .5), y = CY + Math.sin(a) * rb * (1 + dir * (k - .5) * .5); void r0;
        g.fillStyle = 'rgba(160,230,255,.95)'; g.beginPath(); g.arc(x, y, 3.4, 0, 6.29); g.fill(); } }
    /* the cell */
    g.save(); g.translate(CX, CY);
    if (c.type === 'plant') { g.strokeStyle = '#3f9a3f'; g.lineWidth = 12; g.fillStyle = 'rgba(80,160,80,.12)'; rr(g, -150, -114, 300, 228, 26); g.fill(); g.stroke(); }
    if (c.dead === 'burst') { g.strokeStyle = '#ff7aa2'; g.lineWidth = 5; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283, s = 1.25 + (T % 30) * .01; g.beginPath(); g.arc(Math.cos(a) * 30 * s, Math.sin(a) * 26 * s, 26, a - .5, a + .3); g.stroke(); } }
    else {
      g.beginPath(); for (let i = 0; i <= 72; i++) { const a = i / 72 * 6.283, crn = c.type === 'animal' && c.V < .85 ? (1 - (c.V - SHRIVEL) / (.85 - SHRIVEL)) * .09 * Math.sin(a * 14) : 0, w = Math.sin(a * 5 + T * 1.3) * .012 + crn;
        const x = Math.cos(a) * ra * (1 + w), y = Math.sin(a) * rb * (1 + w); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.closePath(); g.fillStyle = c.type === 'plant' ? 'rgba(170,230,150,.28)' : 'rgba(255,170,200,.25)'; g.fill(); g.strokeStyle = c.dead ? '#a77' : c.type === 'plant' ? '#9be38a' : '#ff7aa2'; g.lineWidth = 5; g.setLineDash([12, 5]); g.stroke(); g.setLineDash([]);
      if (c.type === 'plant') { for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + .4; g.fillStyle = '#3fae4a'; g.beginPath(); g.ellipse(Math.cos(a) * ra * .7, Math.sin(a) * rb * .7, 13, 7, a, 0, 6.29); g.fill(); } }
      g.fillStyle = c.type === 'plant' ? 'rgba(90,120,200,.55)' : 'rgba(150,70,130,.7)'; g.beginPath(); g.arc(ra * .18, -rb * .1, 26 * Math.min(1, Math.sqrt(c.V)), 0, 6.29); g.fill();
    }
    g.restore();
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  /* the readouts on the right (SVG) */
  function hud(c, extra = '') {
    const [st, col] = status(c), fl = c.flow * 100;
    return SimLab.hud(690, 70, 290, [['Outside', `${f(c.Co)} mOsm/L`], ['Inside', `${f((c.ci / 300 + c.u) / c.V * 300)} mOsm/L`], ['Solution is', tonic(c), '#ffd27a'], ['Cell volume', `${f(c.V * 100)} %`, col], ['Water flow', c.dead ? '—' : Math.abs(fl) < .05 ? 'balanced (0)' : `${fl > 0 ? 'IN' : 'OUT'} ${f(Math.abs(fl), 2)} %/s`, '#7fd3ff'], ['Time', `${f(c.t)} s`]], 'Cell monitor')
      + `<g transform="translate(690 268)"><rect width="290" height="34" rx="8" fill="${col}" fill-opacity=".9"/><text x="145" y="22" font-size="14" font-weight="800" fill="#10202a" text-anchor="middle">${st}</text></g>`
      + SimLab.chart(706, 350, 258, 120, [{ d: c.hist.map(v => v * 100), c: '#ff7aa2', n: 'volume %' }, { d: c.hist.map(() => 100), c: '#7ee0a1', n: 'normal', dash: '4 4', w: 1.5 }], { ymax: 170, xs: 62, title: 'Cell volume (%) over 60 s' }) + extra
      + `<g transform="translate(120 596)" font-size="13" fill="#cfe7f5"><circle cx="0" cy="-4" r="3" fill="#7fd3ff"/><text x="8" y="0">water</text><circle cx="70" cy="-4" r="5" fill="${c.sol === 'urea' ? '#9be38a' : '#ffb347'}"/><text x="80" y="0">${c.sol === 'urea' ? 'urea (can cross)' : c.sol === 'sucrose' ? 'sucrose (outside)' : 'salt ions (outside)'}</text><circle cx="232" cy="-4" r="5" fill="#d58cff"/><text x="242" y="0">solutes inside the cell</text></g>`;
  }
  /* one beaker scene: controls a cell, runs 60 s trials at 4× speed. cfg.onEnd(c) when a trial finishes */
  function beaker(c, cfg = {}) {
    const P = particles(), g = XLab.cv(); let T = 0, acc = 0; c.run = false;
    const svg = SimLab.stage('', (el, dt) => {
      T += dt; if (c.run) { const sdt = dt * (cfg.speed || 4); for (let i = 0; i < 4; i++) step(c, sdt / 4); acc += sdt; if (acc >= 1) { acc -= 1; c.hist.push(c.V); }
        if (c.dead || c.t >= (cfg.dur || 60)) { c.run = false; if (c.dead) { const at = { x: CX, y: CY - 40 }; if (c.dead === 'burst') { K.fx.burst.call(K, at); } else SND.wah(); } cfg.onEnd && cfg.onEnd(c); } }
      drawBeaker(g, c, P, dt, T); el.innerHTML = hud(c, cfg.hud ? cfg.hud(c) : '');
    });
    return { svg, reset() { Object.assign(c, { V: 1, u: 0, t: 0, dead: '', hist: [1], flow: 0, run: false }); acc = 0; K.stains = []; K.parts = []; }, go() { if (c.run) return; if (c.t > 0 || c.dead) this.reset(); c.flow = 0; c.run = true; SND.tone(500, .2, 'sine', .06, 700); } };
  }
  const solName = { nacl: 'salt (NaCl)', sucrose: 'sucrose', urea: 'urea' };

  /* ═════ Guided ═════ */
  const C = (id, name, title, html, hint) => ({ id, name, title, html, hint });
  const steps = [
    C('hypo', 'Hypotonic', 'Crisis 1: a cell in fresh water', 'A red blood cell (inside: <b>300 mOsm/L</b> of solutes) is dropped into a solution of only <b>100 mOsm/L</b>. Water moves by <b>osmosis</b>: across the membrane, toward the side with <b>more solute</b>.<br><br><b>Predict</b> what happens to the cell, then run the trial.', 'Inside has more solute (300) than outside (100). Water moves toward more solute.'),
    C('iso', 'Find isotonic', 'Crisis 2: find the safe solution', 'Now the cell is in a <b>hypertonic</b> 600 mOsm/L solution. Run it and watch. Then find the outside concentration where the cell <b>keeps its normal volume</b> (water in = water out) and run a 60 s trial there.', 'The cell stays the same when the outside concentration equals the inside concentration.'),
    C('rate', 'Aquaporins', 'Investigate: water channels', 'Water crosses membranes quickly through protein channels called <b>aquaporins</b>. The cell is in a 200 mOsm/L solution.<br><br>Run a trial with <b>few aquaporins</b> (0.5) and one with <b>many</b> (2.0 or more). Compare the <b>starting water flow</b> and the <b>volume after 60 s</b>.', 'More channels let water through faster, but the concentration difference decides where the volume ends up.'),
    C('plant', 'Plant cells', 'Crisis 4: plant cells', 'This is a <b>plant cell</b>, with a stiff <b>cell wall</b>. Put it in <b>pure water (0)</b> and run it. Then put it in <b>800 mOsm/L</b> salt water and run it.', 'The wall pushes back (turgor pressure) when the cell is full. In strong salt water the membrane pulls away from the wall.'),
    C('urea', 'Urea trap', 'Crisis 5: the urea trap', 'Some solutes <b>can</b> cross the membrane. Urea at <b>300 mOsm/L</b> has the same concentration as the cell. <b>Predict</b> what happens, then run it.', 'Urea diffuses into the cell. Then the inside has more solute than the outside, so water follows.')
  ];
  function guidedScene(R, init, cfg) {
    const c = cell(init), B = beaker(c, { onEnd: x => { cfg.onEnd && cfg.onEnd(x); G.check(); } });
    const items = (cfg.sliders || []).map(k => ({ Co: { k: 'Co', label: 'Outside concentration', min: 0, max: 1000, step: 10, unit: ' mOsm/L' }, Lp: { k: 'Lp', label: 'Aquaporins (water permeability)', min: .25, max: 3, step: .25, fmt: v => f(v, 2) + '×' } }[k]));
    const ctl = SimLab.panel(c, items.concat([{ btns: [{ id: 'go', label: 'Run 60 s trial', cls: 'primary', fn: () => { if (cfg.before && cfg.before(c) === false) return; B.go(); } }, { id: 'rs', label: 'Reset cell', fn: () => B.reset() }] }]), () => { B.reset(); });
    const G = SimLab.goals(R, { items: () => cfg.goal(c), q: cfg.q, name: cfg.name });
    return { c, B, ctl, G };
  }
  const S = {
    hypo: R => { let pred = null, ran = false;
      XLab.choiceIn('Prediction: what will the cell do?', ['Swell up', 'Shrink', 'Stay the same'], i => { pred = i; W.G.check(); });
      const W = guidedScene(R, { Co: 100 }, { name: 'Hypotonic', before: () => { if (pred == null) { K.msg('Make your prediction first.', 'bad', 2500); return false; } },
        onEnd: c => { ran = true; if (pred !== 0) R.mistake('Hypotonic prediction', 'In a hypotonic solution (less solute outside), water moves into the cell, so it swells and can burst.'); XLab.note(`In 100 mOsm/L the cell ${c.dead === 'burst' ? 'swelled and burst' : `swelled to ${f(c.V * 100)} %`}. I predicted: ${['swell', 'shrink', 'stay the same'][pred]}.`); K.msg(c.dead === 'burst' ? 'The cell swelled until its membrane burst (lysis)!' : 'The cell swelled.', 'bad', 3500); },
        goal: () => [[pred != null, 'Predict what the cell will do'], [ran, 'Run the trial']],
        q: { q: 'Why did the red blood cell burst?', a: ['Water moved in by osmosis, toward the higher solute concentration inside', 'Salt moved into the cell', 'Solutes left the cell', 'The cell made extra water'], c: 0, e: 'The solution was <b>hypotonic</b> (less solute than the cell). Water diffuses across the membrane toward the side with more solute, so it flowed in until the membrane broke. Animal cells have no wall to stop them.' } }); },
    iso: R => { let saw = false, iso = false;
      const W = guidedScene(R, { Co: 600 }, { name: 'Isotonic', sliders: ['Co'],
        onEnd: c => { if (c.Co >= 600 && (c.dead || c.V < .8)) { saw = true; XLab.note(`In 600 mOsm/L the cell shrank to ${f(c.V * 100)} %${c.dead ? ' and shriveled (crenation)' : ''}.`); }
          if (Math.abs(c.V - 1) < .04 && !c.dead) { iso = true; XLab.note(`At ${c.Co} mOsm/L the volume stayed at ${f(c.V * 100)} %: isotonic.`); K.msg(`Isotonic! At ${c.Co} mOsm/L water in = water out.`, 'ok', 3500); }
          else if (saw && c.Co < 600) K.msg(`Volume ended at ${f(c.V * 100)} %. ${c.V > 1 ? 'Water came in: the outside is still hypotonic.' : 'Water left: the outside is still hypertonic.'}`, 'bad', 3800); },
        goal: () => [[saw, 'Watch the cell in 600 mOsm/L'], [iso, 'Find a concentration where the volume stays normal (±4 %)']],
        q: { q: 'Doctors give patients IV fluid of 0.9 % saline (about 300 mOsm/L), not pure water. Why?', a: ['It is isotonic, so blood cells neither swell nor shrink', 'Salt kills bacteria in the blood', 'Pure water is too heavy', 'It makes cells grow bigger'], c: 0, e: 'An <b>isotonic</b> fluid has the same solute concentration as the cells, so water moves in and out at the same rate and the cells keep their shape. Pure water would make blood cells swell and burst.' } }); void W; },
    rate: R => { const runs = {};
      const W = guidedScene(R, { Co: 200, Lp: 1 }, { name: 'Aquaporins', sliders: ['Lp'],
        onEnd: c => { const r0 = (c.hist[1] - c.hist[0]) * 100; runs[c.Lp] = { r0, v: c.V }; runs.last = 1; XLab.note(`Aquaporins ${c.Lp}×: starting flow ${f(r0, 2)} %/s, volume after 60 s ${f(c.V * 100)} %.`);
          K.msg(`Aquaporins ${c.Lp}×: volume after 60 s = ${f(c.V * 100)} %`, 'ok', 3000); },
        goal: () => { const ks = Object.keys(runs).filter(k => k !== 'last').map(Number); return [[ks.some(k => k <= .5), 'Run with few aquaporins (0.5× or less)'], [ks.some(k => k >= 2), 'Run with many aquaporins (2× or more)']]; },
        q: { q: 'What did adding aquaporins change?', a: ['How fast water moved, not the volume the cell was heading for', 'Which direction water moved', 'The concentration of the solution', 'Nothing at all'], c: 0, e: 'Aquaporins are channels: more of them make osmosis <b>faster</b>, but the direction and the final (equilibrium) volume depend only on the <b>concentration difference</b>. With few channels the cell hadn’t finished swelling after 60 s.' } }); void W; },
    plant: R => { let water = false, salt = false;
      const W = guidedScene(R, { Co: 300, type: 'plant' }, { name: 'Plant cells', sliders: ['Co'],
        onEnd: c => { if (c.Co <= 20) { water = true; XLab.note(`Plant cell in ${c.Co} mOsm/L: turgid at ${f(c.V * 100)} %, the wall stopped it bursting.`); K.msg('Turgid! The cell wall stopped the cell from bursting.', 'ok', 3500); }
          if (c.Co >= 800) { salt = true; XLab.note(`Plant cell in ${c.Co} mOsm/L: plasmolyzed at ${f(c.V * 100)} %.`); K.msg('Plasmolysis: the membrane pulled away from the cell wall.', 'bad', 3500); } },
        goal: () => [[water, 'Plant cell in pure water (0 mOsm/L)'], [salt, 'Plant cell in 800 mOsm/L salt water']],
        q: { q: 'Why don’t plant cells burst in pure water?', a: ['The cell wall pushes back (turgor pressure) and stops more water coming in', 'Plant cells don’t have membranes', 'Water can’t enter plant cells', 'Chloroplasts absorb the extra water'], c: 0, e: 'As the cell fills, its stiff <b>cell wall</b> pushes back. This <b>turgor pressure</b> balances the osmotic pull, so water in = water out. It’s why watered plants stand up straight and dry or salty soil makes them wilt.' } }); void W; },
    urea: R => { let pred = null, ran = false;
      XLab.choiceIn('Prediction: in 300 mOsm/L urea the cell will…', ['Stay the same (it’s isotonic)', 'Swell', 'Shrink'], i => { pred = i; W.G.check(); });
      const W = guidedScene(R, { Co: 300, sol: 'urea', Ps: .6 }, { name: 'Urea trap', before: () => { if (pred == null) { K.msg('Make your prediction first.', 'bad', 2500); return false; } },
        onEnd: c => { ran = true; if (pred !== 1) R.mistake('Urea prediction', 'Urea crosses the membrane, so it enters the cell; then water follows it in and the cell swells.'); XLab.note(`In 300 mOsm/L urea the cell ${c.dead ? 'swelled and burst' : `swelled to ${f(c.V * 100)} %`}.`); },
        goal: () => [[pred != null, 'Predict'], [ran, 'Run the trial']],
        q: { q: 'Why did the cell swell in a solution with the same concentration as its inside?', a: ['Urea crossed the membrane, raised the inside concentration, and water followed', 'Urea is a type of water', 'Urea broke the cell wall', 'The thermometer was wrong'], c: 0, e: 'Tonicity depends on solutes that <b>can’t</b> cross the membrane. Urea diffuses in, so the inside ends up with more total solute than the outside, and water follows by osmosis. A urea solution acts hypotonic even at 300 mOsm/L.' } }); }
  };
  const quiz = [
    { q: 'A cell with 300 mOsm/L inside is placed in a 450 mOsm/L solution. The solution is…', a: ['Hypertonic: water leaves and the cell shrinks', 'Hypotonic: water enters and the cell swells', 'Isotonic: nothing changes', 'Hypertonic: water enters the cell'], c: 0, e: 'Hypertonic means more solute outside. Water moves out toward the higher solute concentration.' },
    { q: 'Osmosis is the diffusion of…', a: ['Water across a selectively permeable membrane', 'Solutes from low to high concentration', 'Any molecule using ATP', 'Proteins through channels'], c: 0, e: 'Osmosis is water diffusing across a membrane that blocks some solutes, toward the side with more solute (less free water).' },
    { q: 'Salting a road in winter kills nearby grass. Why?', a: ['The salty soil is hypertonic, so water leaves the root cells (plasmolysis)', 'Salt is poisonous to cell walls', 'Salt freezes the roots', 'The grass absorbs too much water'], c: 0, e: 'Water moves out of root cells into the salty (hypertonic) soil, so the cells plasmolyze and the plant wilts.' },
    { q: 'Which change makes osmosis faster but does NOT change the cell’s final volume?', a: ['More aquaporins in the membrane', 'A bigger concentration difference', 'Changing salt to urea', 'Making the solution isotonic'], c: 0, e: 'Aquaporins only change the rate. The concentration difference decides the direction and the final volume.' },
    { q: 'Freshwater protists pump out water with contractile vacuoles. Their surroundings must be…', a: ['Hypotonic, so water keeps entering by osmosis', 'Hypertonic, so water keeps leaving', 'Isotonic', 'Free of solutes inside the cell too'], c: 0, e: 'Fresh water has less solute than the cell, so water constantly enters. The contractile vacuole removes it to keep homeostasis.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Put a cell in any solution and run 60-second trials. Each finished trial is <b>recorded automatically</b>.',
    fresh: () => ({ Co: 300, Lp: 1, Ps: .5, sol: 'nacl', type: 'animal' }),
    vars: [{ k: 'Co', label: 'Outside concentration', short: 'Outside', min: 0, max: 1000, step: 10, unit: 'mOsm/L', d: 0, fmt: v => v + ' mOsm/L' }, { k: 'Lp', label: 'Aquaporins', min: .25, max: 3, step: .25, unit: '×', d: 2, fmt: v => f(v, 2) + '×' }, { k: 'Ps', label: 'Urea permeability', short: 'Urea perm.', min: 0, max: 1, step: .1, d: 1, fmt: v => f(v, 1) }],
    cats: [{ k: 'type', label: 'Cell', opts: [['animal', 'Animal cell'], ['plant', 'Plant cell']] }, { k: 'sol', label: 'Solute outside', opts: [['nacl', 'Salt (NaCl)'], ['sucrose', 'Sucrose'], ['urea', 'Urea (crosses)']] }],
    measures: [{ k: 'r0', label: 'Starting water flow', short: 'Start flow', unit: '%/s', d: 2 }, { k: 'vEnd', label: 'Volume after 60 s', short: 'Vol. 60 s', unit: '%', d: 0 }, { k: 'vChg', label: 'Volume change', short: 'Change', unit: '%', d: 0 }, { k: 'out', label: 'Outcome', text: true }],
    noRecord: true,
    ideas: [['How does the outside concentration affect the starting water flow?', 'Co', 'r0'], ['How does the outside concentration affect the cell’s volume after 60 s?', 'Co', 'vEnd'], ['How do aquaporins affect how fast water moves?', 'Lp', 'r0'], ['How does urea permeability affect swelling?', 'Ps', 'vChg']],
    expect(x, y) {
      if (x === 'Co' && y === 'r0') return { t: 'down', why: 'Water moves toward the higher solute concentration. Below 300 mOsm/L (hypotonic) water flows <b>in</b> (positive), above 300 (hypertonic) it flows <b>out</b> (negative), and the further from 300, the faster. The flow is proportional to the concentration difference.' };
      if (x === 'Co' && (y === 'vEnd' || y === 'vChg')) return { t: 'down', why: 'The more concentrated the outside, the more water leaves, so the smaller the cell ends up. In very dilute solutions animal cells burst (the curve flattens at the burst volume); plant cell walls stop them swelling past about 115 %.' };
      if (x === 'Lp' && y === 'r0') return { t: 'up', why: 'Aquaporins are water channels. Doubling them doubles the water flow for the same concentration difference (the flow is proportional to permeability). In an isotonic solution the flow is 0 however many channels there are.' };
      if (x === 'Lp') return { t: 'levels', why: 'More aquaporins make the cell reach its final volume sooner. Once it gets there within 60 s, adding more channels doesn’t change the volume: that depends only on the concentrations.' };
      if (x === 'Ps') return { t: 'up', why: 'Only urea can cross. The more permeable the membrane is to urea, the faster urea enters, and water follows it in, so the cell swells more. For salt or sucrose this slider does nothing (they can’t cross).' };
      return null;
    },
    setup(F) {
      const c = cell(F.st), B = beaker(c, { onEnd: x => { const r0 = (x.hist[1] - x.hist[0]) * 100;
        F.add({ r0, vEnd: x.V * 100, vChg: (x.V - 1) * 100, out: status(x)[0].replace(': danger!', '') }); } });
      const sync = () => { Object.assign(c, { Co: F.st.Co, Lp: F.st.Lp, Ps: F.st.Ps, sol: F.st.sol, type: F.st.type }); B.reset(); };
      F.onChange(sync); sync();
      const b = LabUI.html(''); b.className = 'row sim-btns'; b.innerHTML = '<button class="btn sm primary" id="osGo">Run 60 s trial</button><button class="btn sm" id="osRs">Reset cell</button>';
      $('#osGo').onclick = () => B.go(); $('#osRs').onclick = () => B.reset();
    }
  };

  /* ═════ Game: four dishes, each with a cell. Keep every cell alive while the baths change ═════ */
  function dishGame(G, o) {
    const n = o.cells.length, W = n <= 2 ? 440 : 440, H = n <= 2 ? 520 : 270, pos = o.cells.map((_, i) => n <= 2 ? [30 + i * 470, 60] : [30 + (i % 2) * 470, 50 + Math.floor(i / 2) * 285]);
    const cs = o.cells.map((d, i) => Object.assign(cell({ Co: d.Co, Lp: d.Lp || 1.3, type: d.type || 'animal', ci: d.ci || 300, sol: d.sol || 'nacl', Ps: d.Ps || 0 }), { i, nextEv: rnd(4, 9), ok: 0, ev: '' }));
    let sel = 0, score = 0, lost = 0, T = 0, last = 0; const DUR = o.dur || 60, AMT = 40;
    const adj = (i, s) => { const c = cs[i]; if (c.dead) return; if (s === 'salt' && c.sol === 'urea') { c.sol = 'nacl'; c.Co += AMT; } else c.Co = clamp(c.Co + (s === 'salt' ? AMT : -AMT), 0, 1200); SND.tick(); };
    G.panel({}, [{ html: `<div class="sim-note">Click a dish to select it, then add <b>salt</b> (raises the outside concentration) or <b>water</b> (dilutes it). Keys: <b>S</b> = salt, <b>W</b> = water, <b>1–4</b> = pick a dish.</div>` }, { btns: [{ id: 'salt', label: '🧂 Add salt (+40)', cls: 'primary', fn: () => adj(sel, 'salt') }, { id: 'water', label: '💧 Add water (−40)', fn: () => adj(sel, 'water') }] }]);
    K.on(window, 'keydown', e => { if (G.over()) return; const k = e.key.toLowerCase(); if (k === 's') adj(sel, 'salt'); else if (k === 'w') adj(sel, 'water'); else if (/^[1-4]$/.test(k) && +k <= n) sel = +k - 1; });
    SimLab.stage(`<rect width="1000" height="620" fill="#0b2033"/>`, (g, dt) => {
      if (!G.over()) { T += dt;
        cs.forEach(c => { for (let k = 0; k < 3; k++) step(c, dt * 1.6 / 3);
          if (!c.dead) { c.nextEv -= dt; if (c.nextEv <= 0) { c.nextEv = rnd(o.evMin || 5, o.evMax || 9); const e = o.event(c, T); if (e) { c.ev = e; c.evT = 2.2; SND.pop(); } }
            const good = c.type === 'plant' ? c.V >= PLASMO && c.V <= 1.2 : c.V >= .85 && c.V <= 1.15; if (good) score += dt * 10; }
          else if (!c.lostSaid) { c.lostSaid = true; lost++; K.fx[c.dead === 'burst' ? 'burst' : 'cloud'].call(K, { x: pos[c.i][0] + W / 2, y: pos[c.i][1] + H / 2 }); } });
        if (Math.floor(T) !== last) { last = Math.floor(T); }
        if (lost >= (o.lives || 2)) { const d = cs.find(c => c.dead); G.lose('Too many cells lost', d.dead === 'burst' ? `A cell burst. Its bath was <b>hypotonic</b> (below ${d.ci} mOsm/L), so water rushed in by osmosis. Add salt to raise the outside concentration toward the inside concentration.` : `A cell shriveled. Its bath was <b>hypertonic</b>, so water left the cell by osmosis. Add water to dilute the bath toward ${d.ci} mOsm/L.`); }
        else if (T >= DUR) { const alive = cs.filter(c => !c.dead).length, st = lost === 0 && score >= o.three ? 3 : lost === 0 ? 2 : 1; G.win(st, score + alive * 200, `${alive} of ${n} cells saved. Every second a cell spent in the safe zone scored points.`); } }
      let s = '';
      cs.forEach((c, i) => { const [x, y] = pos[i], cx = x + W / 2, cy = y + H / 2 + 6, sc = n <= 2 ? 1.25 : .85, [st, col] = status(c), sv = Math.sqrt(c.V);
        s += `<g data-dish="${i}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${W}" height="${H}" rx="18" fill="${c.sol === 'urea' ? '#173a2a' : '#123049'}" stroke="${i === sel ? '#ffd27a' : '#2d5574'}" stroke-width="${i === sel ? 5 : 2}"/>
          <rect x="${x}" y="${y}" width="${W}" height="${H}" rx="18" fill="#ffb347" fill-opacity="${Math.min(.25, c.Co / 4000)}"/>`;
        if (c.type === 'plant') s += `<rect x="${cx - 92 * sc}" y="${cy - 66 * sc}" width="${184 * sc}" height="${132 * sc}" rx="16" fill="none" stroke="#3f9a3f" stroke-width="8"/>`;
        if (c.dead === 'burst') s += `<g stroke="#ff7aa2" stroke-width="4" fill="none">${[0, 1, 2, 3, 4, 5].map(k => `<path d="M${cx + Math.cos(k) * 60 * sc},${cy + Math.sin(k) * 40 * sc} q10,-14 24,-6"/>`).join('')}</g>`;
        else { const rx = (c.type === 'plant' ? 80 * Math.min(1.04, sv) : 84 * sv) * sc, ry = (c.type === 'plant' ? 56 * Math.min(1.04, sv) : 60 * sv) * sc, crn = c.type === 'animal' && c.V < .85;
          s += `<path d="${Array.from({ length: 49 }, (_, k) => { const a = k / 48 * 6.283, w = crn ? 1 + .08 * Math.sin(a * 12) : 1 + .015 * Math.sin(a * 5 + T * 2); return `${k ? 'L' : 'M'}${(cx + Math.cos(a) * rx * w).toFixed(1)},${(cy + Math.sin(a) * ry * w).toFixed(1)}`; }).join(' ')}Z" fill="${c.dead ? '#5a4a50' : c.type === 'plant' ? '#7cc96a' : '#ff9fbb'}" fill-opacity=".55" stroke="${c.dead ? '#888' : c.type === 'plant' ? '#9be38a' : '#ff7aa2'}" stroke-width="4"/><circle cx="${cx + 14 * sc}" cy="${cy - 6 * sc}" r="${15 * sc}" fill="#8e3b6c" opacity=".6"/>`; }
        const fl = c.flow; if (!c.dead && Math.abs(fl) > .002) s += `<text x="${cx}" y="${y + H - 16}" font-size="13" font-weight="800" fill="#7fd3ff" text-anchor="middle">${fl > 0 ? '💧 water IN ⟶' : '⟵ water OUT 💧'}</text>`;
        s += `<text x="${x + 16}" y="${y + 28}" font-size="14" font-weight="800" fill="#fff">Dish ${i + 1}${c.type === 'plant' ? ' · plant' : ''}${c.ci !== 300 ? ` · inside ${c.ci}` : ''}</text>
          <text x="${x + W - 16}" y="${y + 28}" font-size="14" font-weight="800" fill="${c.sol === 'urea' ? '#9be38a' : '#ffd27a'}" text-anchor="end">${f(c.Co)} mOsm/L${c.sol === 'urea' ? ' urea' : ''}</text>
          <rect x="${x + 16}" y="${y + 40}" width="150" height="10" rx="5" fill="#fff" fill-opacity=".15"/><rect x="${x + 16 + clamp((c.V - .5) / 1.1, 0, 1) * 150 - 2}" y="${y + 36}" width="4" height="18" fill="${col}"/><rect x="${x + 16 + (.35 / 1.1) * 150}" y="${y + 40}" width="${.3 / 1.1 * 150}" height="10" fill="#7ee0a1" fill-opacity=".45"/>
          <text x="${x + 176}" y="${y + 50}" font-size="12" fill="${col}">${st}</text>
          ${c.evT > 0 ? `<text x="${cx}" y="${y + 80}" font-size="16" font-weight="800" fill="#ffd27a" text-anchor="middle" opacity="${Math.min(1, c.evT)}">${c.ev}</text>` : ''}</g>`;
        if (c.evT > 0) c.evT -= dt; });
      s += `<g transform="translate(500 22)"><rect x="-150" y="-16" width="300" height="30" rx="15" fill="#0b1020" fill-opacity=".8"/><text y="5" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">⏱ ${Math.max(0, Math.ceil(DUR - T))} s · ${Math.round(score)} pts · lost ${lost}/${o.lives || 2}</text></g>`;
      g.innerHTML = s; });
    K.on(K.svg, 'pointerdown', e => { const d = e.target.closest && e.target.closest('[data-dish]'); if (d) { sel = +d.dataset.dish; SND.tick(); } });
  }
  const rain = c => { c.Co = Math.max(0, c.Co - rnd(90, 160)); return '🌧 Rain! Diluted'; }, sun = c => { c.Co = c.Co + rnd(90, 160); return '☀ Evaporation! Saltier'; };
  const game = {
    title: 'Cell Rescue', intro: 'Rain dilutes the dishes and evaporation makes them saltier. Keep every cell in the <b>safe zone</b> (green on its gauge) by adding salt or water. Lose too many cells and the level ends.',
    cover: () => `<rect width="1000" height="620" fill="#0b2033"/>${labThumb('osmosis').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Cell Rescue</text><text x="500" y="540" font-size="18" fill="#9fc6e0" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'First aid', goal: 'Two red blood cells. Keep both in the safe zone for <b>45 s</b>.', hint: 'Rain makes the bath hypotonic (water rushes in). Add salt. Evaporation makes it hypertonic. Add water.', setup: G => dishGame(G, { dur: 45, lives: 1, three: 700, cells: [{ Co: 300 }, { Co: 300 }], evMin: 6, evMax: 10, event: (c) => Math.random() < .5 ? rain(c) : sun(c) }) },
      { name: 'Ward rounds', goal: 'Four cells, and storms come faster. Keep them alive for <b>60 s</b>.', hint: 'Keep an eye on the water-flow arrows: water flowing IN means the bath is too dilute.', setup: G => dishGame(G, { dur: 60, lives: 2, three: 1900, cells: [{ Co: 300 }, { Co: 260 }, { Co: 340 }, { Co: 300 }], evMin: 4, evMax: 8, event: c => Math.random() < .5 ? rain(c) : sun(c) }) },
      { name: 'Mixed patients', goal: 'Two plant cells and two animal cells with <b>different insides</b> (250 and 380 mOsm/L). Each one is isotonic at its own concentration.', hint: 'A cell is safe when the outside matches ITS inside. Plant cells can’t burst, but they wilt (plasmolyze) in salty water.', setup: G => dishGame(G, { dur: 60, lives: 2, three: 1900, cells: [{ Co: 300, type: 'plant' }, { Co: 250, ci: 250 }, { Co: 380, ci: 380, Lp: 1.6 }, { Co: 300, type: 'plant' }], evMin: 4, evMax: 8, event: c => Math.random() < .5 ? rain(c) : sun(c) }) },
      { name: 'The urea trap', goal: 'Some storms dump <b>urea</b> into a dish. Urea crosses membranes, so it doesn’t protect the cell. Adding salt replaces the urea with salt.', hint: 'A urea dish at 300 still makes cells swell: urea leaks in and water follows. Add salt (which can’t cross) to stop the swelling.', setup: G => dishGame(G, { dur: 60, lives: 2, three: 1800, cells: [{ Co: 300 }, { Co: 300 }, { Co: 300 }, { Co: 300 }], evMin: 5, evMax: 9, event: c => { const r = Math.random(); if (r < .35 && c.sol !== 'urea') { c.sol = 'urea'; c.Ps = .8; return '☣ Urea spill!'; } return r < .7 ? rain(c) : sun(c); } }) }
    ]
  };

  const finale = () => { const c = cell({ Co: 300 }), B = beaker(c, {}); B.go(); };
  XLab.define({ id: 'osmosis', guided: { steps, S, quiz, finale, finaleMsg: 'All five crises solved. Now check your thinking.', summary: () => 'You saw osmosis move water toward higher solute concentration, found the isotonic point, measured how aquaporins change the rate, compared plant and animal cells, and discovered that only solutes that can’t cross the membrane control tonicity.' }, free, game });
})();
