/* ═══════════ HS Physics: "Bridge Breaker: Engineering Challenge" ═══════════
   A real 2-D truss solver (direct stiffness method). Joints are pins; members carry only tension or compression.
     supports: left = pin (holds x and y), right = roller (holds y)
     load: a truck of weight W on the deck, shared between the two nearest deck joints
     member force F = (EA/L)·(change in length); + = tension (red), − = compression (blue)
     capacity: tension T; compression min(T, B/L²)  (long members buckle: Euler buckling ∝ 1/L²)
       wood  T = 40 kN, B = 60 kN·m², $6 per m      steel  T = 100 kN, B = 150 kN·m², $15 per m; each extra joint $3
   Because the model is linear, the failure load is the load at which the most-stressed member reaches its capacity.
   A structure without enough triangles is a mechanism: the stiffness matrix is singular and it collapses. */
(() => {
  const K = Kit, f = SimLab.f, SC = 78, OX = 90, OY = 330;
  const MAT = { wood: { n: 'Wood', T: 40, B: 60, cost: 6, col: '#c8a06a' }, steel: { n: 'Steel', T: 100, B: 150, cost: 15, col: '#9aa8b8' } };
  const P2 = (x, y) => [OX + x * SC, OY - y * SC];
  /* ── the structure ── */
  function make(span) { const J = [], M = []; for (let x = 0; x <= span; x++) J.push({ x, y: 0, deck: true }); for (let x = 0; x < span; x++) M.push({ a: x, b: x + 1, mat: 'wood', deck: true }); return { span, J, M }; }
  const len = (B, m) => Math.hypot(B.J[m.b].x - B.J[m.a].x, B.J[m.b].y - B.J[m.a].y);
  const cap = (B, m) => { const L = len(B, m), t = MAT[m.mat]; return { t: t.T, c: Math.min(t.T, t.B / (L * L)) }; };
  const cost = B => B.M.reduce((a, m) => a + len(B, m) * MAT[m.mat].cost, 0) + B.J.filter(j => !j.deck).length * 3;
  const jIdx = (B, x, y) => B.J.findIndex(j => j.x === x && j.y === y);
  function preset(span, kind, h, mat) {
    const B = make(span), top = []; mat = mat || 'wood'; B.M.forEach(m => m.mat = mat);
    const add = (a, b) => { if (a !== b && !B.M.some(m => (m.a === a && m.b === b) || (m.a === b && m.b === a))) B.M.push({ a, b, mat }); };
    const J = (x, y) => { let i = jIdx(B, x, y); if (i < 0) { B.J.push({ x, y }); i = B.J.length - 1; } return i; };
    if (kind === 'kingpost') { const t = J(span / 2, h); add(0, t); add(span, t); add(span / 2, t); for (let x = 1; x < span / 2; x++) add(x, t); for (let x = span / 2 + 1; x < span; x++) add(x, t); return B; }
    if (kind === 'warren') { for (let x = .5; x < span; x += 1) top.push(J(x, h)); top.forEach((t, i) => { add(i, t); add(i + 1, t); if (i) add(top[i - 1], t); }); return B; }
    for (let x = 1; x < span; x++) top.push(J(x, h)); add(0, top[0]); add(span, top[top.length - 1]); top.forEach((t, i) => { add(i + 1, t); if (i) add(top[i - 1], t); });
    top.forEach((t, i) => { const x = i + 1; if (kind === 'pratt') { if (x < span / 2) add(t, x + 1); else if (x > span / 2) add(t, x - 1); } else { if (x <= span / 2) add(t, x - 1 >= 0 ? x - 1 : 0); if (x >= span / 2) add(t, x + 1); } });
    return B;
  }
  /* ── the solver: unit truck load at position px → member forces per kN, joint displacements per kN ── */
  function solve(B, px) {
    const n = B.J.length, N = 2 * n, Kg = Array.from({ length: N }, () => new Float64Array(N)), F = new Float64Array(N), EA = 2e5;
    B.M.forEach(m => { const a = B.J[m.a], b = B.J[m.b], L = Math.hypot(b.x - a.x, b.y - a.y), c = (b.x - a.x) / L, s = (b.y - a.y) / L, k = EA * (m.mat === 'steel' ? 2 : 1) / L, kk = [[c * c, c * s], [c * s, s * s]];
      [[m.a, m.a, 1], [m.b, m.b, 1], [m.a, m.b, -1], [m.b, m.a, -1]].forEach(([i, j, sg]) => { for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) Kg[2 * i + r][2 * j + q] += sg * k * kk[r][q]; }); });
    const x0 = Math.max(0, Math.min(B.span, px)), i0 = Math.min(B.span - 1, Math.floor(x0)), fr = x0 - i0; F[2 * i0 + 1] -= 1 - fr; F[2 * (i0 + 1) + 1] -= fr;
    const fixed = new Set([0, 1, 2 * B.span + 1]), free = []; for (let i = 0; i < N; i++) if (!fixed.has(i)) free.push(i);
    const A = free.map(i => free.map(j => Kg[i][j])), bb = free.map(i => F[i]), m = free.length; let maxd = 0; for (let i = 0; i < m; i++) maxd = Math.max(maxd, Math.abs(A[i][i]));
    for (let c = 0; c < m; c++) { let p = c; for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; if (Math.abs(A[p][c]) < maxd * 1e-9) return null; [A[c], A[p]] = [A[p], A[c]]; [bb[c], bb[p]] = [bb[p], bb[c]];
      for (let r = c + 1; r < m; r++) { const fct = A[r][c] / A[c][c]; if (!fct) continue; for (let q = c; q < m; q++) A[r][q] -= fct * A[c][q]; bb[r] -= fct * bb[c]; } }
    const u = new Float64Array(m); for (let r = m - 1; r >= 0; r--) { let s = bb[r]; for (let q = r + 1; q < m; q++) s -= A[r][q] * u[q]; u[r] = s / A[r][r]; }
    const U = new Float64Array(N); free.forEach((g, i) => U[g] = u[i]);
    const force = B.M.map(mm => { const a = B.J[mm.a], b = B.J[mm.b], L = Math.hypot(b.x - a.x, b.y - a.y), c = (b.x - a.x) / L, s = (b.y - a.y) / L; return EA * (mm.mat === 'steel' ? 2 : 1) / L * (c * (U[2 * mm.b] - U[2 * mm.a]) + s * (U[2 * mm.b + 1] - U[2 * mm.a + 1])); });
    /* mechanism check: huge displacements mean a near-singular (wobbly) structure */
    let umax = 0; for (let i = 0; i < N; i++) umax = Math.max(umax, Math.abs(U[i])); if (umax > 1) return null;
    return { force, U, R: { lx: 0, ly: 1 - x0 / B.span, ry: x0 / B.span } };
  }
  /* failure load for a truck at px: the smallest W that makes some member reach capacity */
  function strength(B, px) { const S = solve(B, px); if (!S) return { W: 0, unstable: true }; let W = Infinity, mi = -1; S.force.forEach((fu, i) => { if (Math.abs(fu) < 1e-9) return; const c = cap(B, B.M[i]), w = fu > 0 ? c.t / fu : c.c / -fu; if (w < W) { W = w; mi = i; } }); return { W, mi, S }; }
  /* worst case: the truck can be anywhere on the deck */
  function worst(B) { let best = { W: Infinity }; for (let px = 0; px <= B.span; px += .5) { const s = strength(B, px); if (s.W < best.W) best = Object.assign(s, { px }); if (s.unstable) return Object.assign(s, { px }); } return best; }

  /* ── drawing ── */
  function scene(B, o = {}) {
    const S = o.S, W = o.W || 0, span = B.span, sag = o.sag || 0;
    let g = `<rect width="1000" height="620" fill="#a9d8f5"/><rect y="${OY + 140}" width="1000" height="200" fill="#3f8fd6" opacity=".55"/>
      <path d="M0,${OY + 6} L${OX + 6},${OY + 6} L${OX - 30},620 L0,620Z M1000,${OY + 6} L${OX + span * SC - 6},${OY + 6} L${OX + span * SC + 30},620 L1000,620Z" fill="#8a6d55"/>`;
    if (o.grid) for (let x = 0; x <= span; x++) for (let y = -3; y <= 3; y++) { const [X, Y] = P2(x, y); g += `<circle cx="${X}" cy="${Y}" r="3" fill="#fff" opacity=".55"/>`; }
    if (o.grid) for (let x = .5; x < span; x++) for (let y = -2.5; y <= 3; y += 1) { const [X, Y] = P2(x, y); g += `<circle cx="${X}" cy="${Y}" r="2" fill="#fff" opacity=".3"/>`; }
    const pos = i => { const j = B.J[i], [X, Y] = P2(j.x, j.y); if (!S || !W) return [X, Y]; return [X + S.U[2 * i] * W * SC * 120 * sag, Y - S.U[2 * i + 1] * W * SC * 120 * sag]; };
    B.M.forEach((m, i) => { if (m.broken) return; const [x1, y1] = pos(m.a), [x2, y2] = pos(m.b), F = S && W ? S.force[i] * W : 0, c = cap(B, m), r = F > 0 ? F / c.t : -F / c.c;
      const col = !S || !W || Math.abs(F) < .05 ? MAT[m.mat].col : F > 0 ? `rgb(${Math.round(200 + 55 * Math.min(1, r))},${Math.round(120 - 100 * Math.min(1, r))},${Math.round(120 - 100 * Math.min(1, r))})` : `rgb(${Math.round(110 - 90 * Math.min(1, r))},${Math.round(150 - 80 * Math.min(1, r))},${Math.round(230)})`;
      g += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.sel === i ? '#ffd27a' : col}" stroke-width="${(m.mat === 'steel' ? 9 : 7) + (S && W ? Math.min(6, Math.abs(F) / 8) : 0)}" stroke-linecap="round" data-mem="${i}"/>`;
      if (o.labels && S && W && Math.abs(F) > .5) g += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 8}" font-size="11" font-weight="800" fill="#0b1020" text-anchor="middle" paint-order="stroke" stroke="#fff" stroke-width="3">${f(Math.abs(F), 1)}</text>`; });
    B.J.forEach((j, i) => { const [X, Y] = pos(i); g += `<circle cx="${X}" cy="${Y}" r="${o.pick === i ? 9 : 6}" fill="${o.pick === i ? '#ffd27a' : '#fff'}" stroke="#333" stroke-width="2"/>`; });
    const [a0, b0] = P2(0, 0), [a1, b1] = P2(span, 0);
    g += `<path d="M${a0},${b0 + 6} l-14,24 h28z" fill="#5a6270"/><circle cx="${a1}" cy="${b1 + 16}" r="10" fill="#5a6270"/><rect x="${a1 - 18}" y="${b1 + 26}" width="36" height="6" fill="#5a6270"/>`;
    if (o.truck != null) { const [tx] = P2(o.truck, 0), dx = S && W ? 0 : 0; g += `<g transform="translate(${tx + dx - 34} ${b0 - 62})"><rect width="68" height="40" rx="6" fill="#e5484d"/><rect x="44" y="6" width="18" height="14" fill="#cfe7f5"/><circle cx="14" cy="44" r="9" fill="#222"/><circle cx="54" cy="44" r="9" fill="#222"/><text x="30" y="27" font-size="12" font-weight="800" fill="#fff" text-anchor="middle">${f(W)} kN</text></g>`; }
    return g + (o.extra || '');
  }
  const hudB = (B, rows, title) => SimLab.hud(700, 24, 285, rows, title || 'Bridge report');
  const legend = `<g transform="translate(700 430)"><rect width="285" height="62" rx="8" fill="#0b1020" fill-opacity=".8"/><line x1="14" y1="22" x2="54" y2="22" stroke="#e5484d" stroke-width="7"/><text x="62" y="26" font-size="12" fill="#fff">tension (pulled)</text><line x1="14" y1="46" x2="54" y2="46" stroke="#2f6fd6" stroke-width="7"/><text x="62" y="50" font-size="12" fill="#fff">compression (pushed)</text><text x="272" y="38" font-size="11" fill="#a9b6cc" text-anchor="end">numbers in kN</text></g>`;

  /* ── the builder: click two points to add a member; delete mode removes; shared by guided, free and game ── */
  function builder(B, cfg = {}) {
    let tool = 'build', pick = null, mat = 'wood', test = null; const st = { tool };
    const ui = LabUI.html(''); const redrawUI = () => { ui.innerHTML = `<div class="pl-pred"><label>Tools</label><div class="sim-pick"><button class="btn sm ${tool === 'build' ? 'on' : ''}" data-bt="build">✏ Build</button><button class="btn sm ${tool === 'del' ? 'on' : ''}" data-bt="del">🗑 Delete</button>${cfg.inspect ? `<button class="btn sm ${tool === 'look' ? 'on' : ''}" data-bt="look">🔍 Inspect</button>` : ''}</div></div>
      <div class="pl-pred"><label>Material</label><div class="sim-pick">${Object.entries(MAT).map(([k, m]) => `<button class="btn sm ${mat === k ? 'on' : ''}" data-bm="${k}">${m.n} ($${m.cost}/m)</button>`).join('')}</div></div>
      <div class="row sim-btns"><button class="btn sm primary" id="brTest">🚚 Load test</button><button class="btn sm" id="brClr">Clear</button>${cfg.presets ? '<button class="btn sm ghost" id="brEx">Example truss</button>' : ''}</div>
      <div class="sim-note">Click two dots to place a member (max 3 m). Long members in compression buckle more easily.</div>`;
      $$('[data-bt]', ui).forEach(b => b.onclick = () => { tool = b.dataset.bt; pick = null; redrawUI(); });
      $$('[data-bm]', ui).forEach(b => b.onclick = () => { mat = b.dataset.bm; redrawUI(); });
      $('#brTest', ui).onclick = () => runTest(); $('#brClr', ui).onclick = () => { const nb = make(B.span); B.J = nb.J; B.M = nb.M; test = null; pick = null; cfg.change && cfg.change(); };
      const ex = $('#brEx', ui); if (ex) ex.onclick = () => { const nb = preset(B.span, 'pratt', 1, mat); B.J = nb.J; B.M = nb.M; test = null; cfg.change && cfg.change(); }; };
    redrawUI();
    const nearPt = p => { let best = null, bd = 22; for (let x = 0; x <= B.span; x += .5) for (let y = -3; y <= 3; y += .5) { if ((x % 1 !== 0) !== (y % 1 !== 0) && !(x % 1 !== 0 && y % 1 !== 0)) continue; const [X, Y] = P2(x, y), d = Math.hypot(X - p.x, Y - p.y); if (d < bd) { bd = d; best = { x, y }; } } return best; };
    K.on(K.svg, 'pointerdown', e => { if (test && test.running) return; const p = K.pt(e);
      if (tool === 'del' || tool === 'look') { const t = e.target.closest && e.target.closest('[data-mem]'); if (!t) return; const i = +t.dataset.mem; if (tool === 'look') { cfg.inspect && cfg.inspect(i); return; } if (B.M[i].deck) { K.msg('The road deck can’t be removed.', 'bad', 1600); return; } B.M.splice(i, 1); const used = new Set(B.M.flatMap(m => [m.a, m.b])); const keep = B.J.map((j, k) => j.deck || used.has(k)); const map = []; let n = 0; keep.forEach((k, i2) => map[i2] = k ? n++ : -1); B.J = B.J.filter((_, k) => keep[k]); B.M.forEach(m => { m.a = map[m.a]; m.b = map[m.b]; }); test = null; SND.tick(); cfg.change && cfg.change(); return; }
      const q = nearPt(p); if (!q) return;
      if (!pick) { pick = q; SND.tick(); return; }
      if (pick.x === q.x && pick.y === q.y) { pick = null; return; }
      const L = Math.hypot(q.x - pick.x, q.y - pick.y); if (L > 3.01) { K.msg('Members can be at most 3 m long.', 'bad', 1600); pick = q; return; }
      const gi = (x, y) => { let i = jIdx(B, x, y); if (i < 0) { B.J.push({ x, y }); i = B.J.length - 1; } return i; };
      const a = gi(pick.x, pick.y), b = gi(q.x, q.y); if (!B.M.some(m => (m.a === a && m.b === b) || (m.a === b && m.b === a))) { B.M.push({ a, b, mat }); SND.pop(); }
      pick = q; test = null; cfg.change && cfg.change(); });
    function runTest() { const w = worst(B); test = { w, t: 0, running: true, px: 0 }; cfg.testStart && cfg.testStart(w); SND.tone(200, .4, 'sawtooth', .04, 120); }
    return { B, test: () => test, pick: () => pick ? jIdx(B, pick.x, pick.y) : null, mat: () => mat, setTest: t => test = t, clearPick: () => pick = null, run: runTest };
  }
  /* animate a load test: the truck drives across while the load grows; failure at the weakest position */
  function testLoop(Bd, cfg) {
    return (g, dt) => { const B = Bd.B, t = Bd.test(); let o = { grid: !t, pick: Bd.pick() };
      if (t) { if (t.running) { t.t += dt; } const target = cfg.target || 0, w = t.w;
        if (w.unstable) { const fall = Math.min(1, t.t / 1.2); o = { grid: false, truck: Math.min(B.span, t.t * 3), W: target || 20, extra: `<text x="350" y="140" font-size="22" font-weight="800" fill="#e5484d" text-anchor="middle">✗ Unstable: the frame folds up (not enough triangles)</text>` };
          void fall; g.innerHTML = scene(B, o) + (cfg.hud ? cfg.hud(B, w, 0) : ''); if (t.running && t.t > 1.4) { t.running = false; K.stage.classList.remove('shake'); void K.stage.offsetWidth; K.stage.classList.add('shake'); SND.wah(); cfg.end && cfg.end(t); } return; }
        const lim = target ? Math.min(w.W, target) : w.W, ramp = Math.min(1, t.t / 2.4), W = lim * ramp, px = target ? w.px : w.px, S = strength(B, px).S, broke = !target ? ramp >= 1 : (w.W < target && ramp >= 1);
        o = { truck: px, W, S, sag: 1, labels: cfg.labels, sel: cfg.sel ? cfg.sel() : null, extra: legend };
        if (broke && w.mi >= 0) { B.M[w.mi].broken = true; }
        g.innerHTML = scene(B, o) + (cfg.hud ? cfg.hud(B, w, W) : '') + (broke ? `<text x="350" y="140" font-size="22" font-weight="800" fill="#e5484d" text-anchor="middle">✗ A ${w.S.force[w.mi] > 0 ? 'tension member snapped' : 'compression member buckled'} at ${f(w.W, 1)} kN</text>` : ramp >= 1 && target ? `<text x="350" y="140" font-size="22" font-weight="800" fill="#2f8a3a" text-anchor="middle">✓ Held ${f(target)} kN (could take ${f(w.W, 1)} kN)</text>` : '');
        if (t.running && ramp >= 1) { t.running = false; if (broke) { K.stage.classList.remove('shake'); void K.stage.offsetWidth; K.stage.classList.add('shake'); SND.wah(); } else SND.ok(); setTimeout(() => { B.M.forEach(m => delete m.broken); }, 2500); cfg.end && cfg.end(t); }
      } else g.innerHTML = scene(B, o) + (cfg.hud ? cfg.hud(B, null, 0) : '');
    };
  }
  const report = (B, w, W) => hudB(B, [['Members', B.M.length], ['Cost', `$${f(cost(B))}`, '#ffd27a'], ['Current load', `${f(W, 1)} kN`], ['Strength (worst spot)', w ? (w.unstable ? 'unstable!' : `${f(w.W, 1)} kN`) : 'press Load test', w && !w.unstable ? '#7ee0a1' : '#ff8a8a'], ['Weakest member', w && w.mi >= 0 && !w.unstable ? `${w.S.force[w.mi] > 0 ? 'tension' : 'compression'}, ${f(len(B, B.M[w.mi]), 2)} m` : '—']]);

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'tri', name: 'Triangles', title: 'Why triangles?', html: 'The road deck alone is a chain of hinged beams. <b>Load test it</b> as it is. Then add members to build a bridge that holds at least <b>20 kN</b> wherever the truck is.', hint: 'Try “Example truss”, or connect each deck joint to joints 1 m above so that every panel is split into triangles.' },
    { id: 'tc', name: 'Tension & compression', title: 'Pulled or pushed?', html: 'This is a <b>Pratt truss</b> with a 20 kN truck. Use 🔍 <b>Inspect</b>: click a <b>red</b> member and a <b>blue</b> member to see their forces. Which chord is squeezed and which is stretched?', hint: 'Red = tension (pulled apart), blue = compression (pushed together). Look at the top chord and the bottom (deck) chord.' },
    { id: 'eq', name: 'Equilibrium', title: 'Forces balance', html: 'A <b>40 kN</b> truck stands at the <b>middle</b> of a 6 m bridge. The bridge isn’t moving, so the forces on it add to zero. How much does each support push up?', hint: 'The load is in the middle, so by symmetry the two supports share it equally.' },
    { id: 'design', name: 'Design', title: 'Engineer it', html: 'Design a bridge that holds <b>40 kN</b> anywhere on the deck for <b>under $300</b>. Test, look at the weakest member, improve, and test again.', hint: 'Taller trusses have smaller chord forces. Short members resist buckling. Use steel only where it’s needed.' }
  ];
  const S = {
    tri: R => { const B = make(6); let unstable = false, ok = false;
      const Bd = builder(B, { presets: true, testStart: w => { if (w.unstable) { unstable = true; XLab.note('The deck alone was unstable: a chain of hinged beams folds up.'); } else if (w.W >= 20) { ok = true; XLab.note(`Built a ${B.M.length}-member truss that holds ${f(w.W, 1)} kN (cost $${f(cost(B))}).`); } else K.msg(`It holds only ${f(w.W, 1)} kN. Strengthen the weakest member.`, 'bad', 2600); G.check(); } });
      SimLab.stage('', testLoop(Bd, { hud: report }));
      const G = SimLab.goals(R, { name: 'Triangles', items: () => [[unstable, 'Load test the bare deck'], [ok, 'Build a bridge that holds 20 kN']],
        q: { q: 'Why are trusses made of triangles?', a: ['A triangle can’t change shape without changing a side’s length, so it is rigid', 'Triangles use less material than any other shape', 'Triangles look stronger', 'Squares can’t be built from beams'], c: 0, e: 'With pinned joints, a rectangle can fold into a parallelogram without any member stretching. A triangle’s shape is fixed by its three side lengths, so a framework of triangles is <b>rigid</b>.' } }); },
    tc: R => { const B = preset(6, 'pratt', 1, 'wood'); let red = false, blue = false, sel = null; const W = 20;
      const Bd = builder(B, { inspect: i => { sel = i; const S = strength(B, 3).S; const F = S.force[i] * W; if (F > .5) red = true; else if (F < -.5) blue = true; const m = B.M[i], j1 = B.J[m.a], j2 = B.J[m.b]; K.msg(`${F > .5 ? 'Tension' : F < -.5 ? 'Compression' : 'Almost no force'}: ${f(Math.abs(F), 1)} kN (${j1.y || j2.y ? (j1.y && j2.y ? 'top chord' : 'diagonal or vertical') : 'deck chord'})`, F > .5 ? 'bad' : 'ok', 3000); G.check(); } });
      Bd.setTest({ w: Object.assign(strength(B, 3), { px: 3 }), t: 3, running: false });
      SimLab.stage('', testLoop(Bd, { target: W, labels: true, sel: () => sel, hud: (b, w, Wn) => hudB(b, [['Truck', `${W} kN at the middle`], ['Top chord', 'compression'], ['Bottom chord', 'tension']], 'Pratt truss') }));
      $$('[data-bt="look"]').forEach(b => b.click());
      const G = SimLab.goals(R, { name: 'Tension & compression', items: () => [[red, 'Inspect a member in tension (red)'], [blue, 'Inspect a member in compression (blue)']],
        q: { q: 'When a bridge sags under a load, the top chord is…', a: ['Squeezed (compression) and the bottom chord is stretched (tension)', 'Stretched and the bottom is squeezed', 'Both in tension', 'Both force-free'], c: 0, e: 'Like a bending ruler, the top shortens (compression) and the bottom lengthens (tension). Engineers make compression members thick or short so they don’t <b>buckle</b>.' } }); },
    eq: R => { const B = preset(6, 'warren', 1, 'steel'); let ok = false; const W = 40;
      const Bd = builder(B, {}); Bd.setTest({ w: Object.assign(strength(B, 3), { px: 3 }), t: 3, running: false });
      SimLab.stage('', testLoop(Bd, { target: W, hud: () => hudB(B, [['Truck', `${W} kN at x = 3 m`], ['Left support', ok ? '20 kN ↑' : '? ↑', '#7ee0a1'], ['Right support', ok ? '20 kN ↑' : '? ↑', '#7ee0a1'], ['Sum of forces', ok ? '20 + 20 − 40 = 0' : '?']], 'Free-body diagram') + `<g stroke="#7ee0a1" stroke-width="5" fill="#7ee0a1"><line x1="${OX}" y1="${OY + 110}" x2="${OX}" y2="${OY + 40}"/><path d="M${OX - 9},${OY + 50} L${OX},${OY + 34} L${OX + 9},${OY + 50}Z"/><line x1="${OX + 6 * SC}" y1="${OY + 110}" x2="${OX + 6 * SC}" y2="${OY + 40}"/><path d="M${OX + 6 * SC - 9},${OY + 50} L${OX + 6 * SC},${OY + 34} L${OX + 6 * SC + 9},${OY + 50}Z"/></g>` }));
      LabUI.html(XLab.numIn('eqR', 'Each support pushes up with', 'kN'));
      $('#eqRB').onclick = () => { const v = +$('#eqR').value; if (Math.abs(v - 20) <= .5) { ok = true; XLab.note('Truck of 40 kN at midspan: each support pushes up 20 kN (ΣF = 0).'); K.msg('Yes: 20 + 20 − 40 = 0.', 'ok', 2400); } else { R.mistake('Support reactions', 'ΣF = 0: the two upward support forces add up to the 40 kN load; by symmetry 20 kN each.'); K.msg('The supports together must balance 40 kN.', 'bad', 2400); } G.check(); };
      const G = SimLab.goals(R, { name: 'Equilibrium', items: () => [[ok, 'Find the support forces']],
        q: { q: 'If the truck moves to 1 m from the left end, the left support pushes…', a: ['More than the right support', 'Less than the right support', 'The same as before', 'Nothing'], c: 0, e: 'Balancing torques about the right support: R_left × 6 m = 40 kN × 5 m, so R_left ≈ 33 kN and R_right ≈ 7 kN. The nearer support carries more.' } }); },
    design: R => { const B = make(6); let best = null;
      const Bd = builder(B, { presets: true, testStart: w => { if (!w.unstable && w.W >= 40 && cost(B) < 300) { best = cost(B); XLab.note(`Final design: holds ${f(w.W, 1)} kN for $${f(cost(B))} (${B.M.length} members).`); } else if (!w.unstable) K.msg(w.W < 40 ? `Holds ${f(w.W, 1)} kN; needs 40.` : `Strong enough, but $${f(cost(B))} is over budget.`, 'bad', 2800); G.check(); } });
      SimLab.stage('', testLoop(Bd, { hud: report }));
      const G = SimLab.goals(R, { name: 'Design', items: () => [[best != null, 'Hold 40 kN for under $300']],
        q: { q: 'Engineers repeat “design → test → improve”. What is this called?', a: ['Iterative design (the engineering design process)', 'Trial and error with no plan', 'The scientific law of bridges', 'Static equilibrium'], c: 0, e: 'Engineering design is <b>iterative</b>: build a solution, test it against the criteria and constraints (strength, cost), find the weakest point, and refine.' } }); }
  };
  const quiz = [
    { q: 'A long, thin member in compression fails by…', a: ['Buckling (bending sideways)', 'Snapping in tension', 'Melting', 'Getting longer'], c: 0, e: 'Slender compression members buckle. The buckling load falls with the square of the length.' },
    { q: 'For a bridge that is not moving, the net force on every joint is…', a: ['Zero', 'Equal to the load', 'Pointing down', 'Pointing up'], c: 0, e: 'Static equilibrium: ΣF = 0 for the whole bridge and for every joint (Newton’s first law).' },
    { q: 'Doubling the height of a truss (same span) does what to the chord forces?', a: ['Roughly halves them', 'Doubles them', 'No change', 'Makes them zero'], c: 0, e: 'The chords resist bending like a pair: force × height = bending moment, so a taller truss needs smaller chord forces.' },
    { q: 'Why is steel used for the most heavily loaded members only?', a: ['It is stronger but costs more: a trade-off between strength and cost', 'Steel is weaker', 'Wood can’t carry tension', 'Steel is lighter than wood'], c: 0, e: 'Engineers balance criteria (strength, safety) against constraints (cost, weight).' },
    { q: 'A 60 kN truck is 2 m from the left end of a 6 m bridge. The right support force is…', a: ['20 kN', '40 kN', '30 kN', '60 kN'], c: 0, e: 'Torques about the left support: R_right × 6 = 60 × 2, so R_right = 20 kN (and R_left = 40 kN).' }
  ];

  /* ═════ Free Investigation (standard truss designs, analyzed exactly) ═════ */
  const free = {
    intro: 'Pick a standard truss and test it. Change one variable at a time and record its strength.',
    fresh: () => ({ kind: 'pratt', mat: 'wood', h: 1, px: 3 }),
    vars: [{ k: 'h', label: 'Truss height', short: 'Height', min: .5, max: 3, step: .5, unit: 'm', d: 1, fmt: v => v + ' m' }, { k: 'px', label: 'Truck position', short: 'Position', min: 0, max: 6, step: .5, unit: 'm', d: 1, fmt: v => v + ' m from left' }],
    cats: [{ k: 'kind', label: 'Truss type', opts: [['pratt', 'Pratt'], ['howe', 'Howe'], ['warren', 'Warren'], ['kingpost', 'King post']] }, { k: 'mat', label: 'Material', opts: [['wood', 'Wood'], ['steel', 'Steel']] }],
    measures: [{ k: 'W', label: 'Failure load', short: 'Fails at', unit: 'kN', d: 1 }, { k: 'tmax', label: 'Biggest tension per 10 kN', short: 'Max T', unit: 'kN', d: 1 }, { k: 'cmax', label: 'Biggest compression per 10 kN', short: 'Max C', unit: 'kN', d: 1 }, { k: 'cost', label: 'Cost', unit: '$', d: 0 }, { k: 'how', label: 'Fails by', text: true }],
    measure: st => { const B = preset(6, st.kind, st.h, st.mat), s = strength(B, st.px); if (s.unstable) return { W: 0, tmax: NaN, cmax: NaN, cost: cost(B), how: 'unstable' }; const F = s.S.force; return { W: s.W, tmax: Math.max(0, ...F) * 10, cmax: -Math.min(0, ...F) * 10, cost: cost(B), how: F[s.mi] > 0 ? 'tension' : 'buckling' }; },
    ideas: [['How does the truss height affect its strength?', 'h', 'W'], ['How does the truss height affect the biggest compression force?', 'h', 'cmax'], ['Where on the bridge is a truck most dangerous?', 'px', 'W']],
    expect(x, y) {
      if (x === 'h' && (y === 'cmax' || y === 'tmax')) return { t: 'down', why: 'The chords form a couple that resists bending: chord force ≈ bending moment ÷ height. Doubling the height roughly halves the chord forces.' };
      if (x === 'h' && y === 'W') return { t: 'peak', why: 'Taller trusses have smaller chord forces, so they get stronger at first. But tall diagonals and verticals are long, and long compression members buckle (capacity ∝ 1/L²), so very tall trusses get weaker again: an optimum height.' };
      if (x === 'px' && y === 'W') return { t: 'valley', why: 'A load near a support goes almost straight into it. At midspan the bending moment is largest (M = W·a·b/L), so the bridge is weakest there.' };
      if (x === 'h' && y === 'cost') return { t: 'up', why: 'Taller trusses use longer diagonals and verticals, so they cost more.' };
      return null;
    },
    setup(F) {
      let B = preset(6, F.st.kind, F.st.h, F.st.mat); F.onChange(() => { B = preset(6, F.st.kind, F.st.h, F.st.mat); });
      SimLab.stage('', g => { const s = strength(B, F.st.px), W = s.unstable ? 0 : Math.min(30, s.W); g.innerHTML = scene(B, { truck: F.st.px, W, S: s.S, sag: 1, labels: true, extra: legend }) + hudB(B, [['Truss', `${F.st.kind}, ${F.st.h} m tall`], ['Cost', `$${f(cost(B))}`, '#ffd27a'], ['Shown load', `${f(W)} kN`], ['Fails at', s.unstable ? 'unstable' : `${f(s.W, 1)} kN`, '#7ee0a1'], ['Fails by', s.unstable ? '—' : s.S.force[s.mi] > 0 ? 'tension (snaps)' : 'compression (buckles)']], 'Truss analysis'); });
    }
  };

  /* ═════ Game: build to spec ═════ */
  function contract(G, o) {
    const B = make(o.span); let tries = 0;
    const Bd = builder(B, { presets: false, testStart: w => { tries++; } });
    SimLab.stage('', testLoop(Bd, { target: o.load, hud: (b, w) => hudB(b, [['Truck', `${o.load} kN, anywhere`], ['Budget', `$${o.budget}`], ['Cost now', `$${f(cost(b))}`, cost(b) > o.budget ? '#ff8a8a' : '#7ee0a1'], ['Tests used', tries]], `Contract: ${o.span} m span`),
      end: t => { const w = t.w; if (w.unstable || w.W < o.load) { if (tries >= o.maxTries) G.lose('Bridge failed', w.unstable ? 'The frame folded: every panel needs triangles.' : `It gave way at ${f(w.W, 1)} kN. Find the weakest member (the report says which) and strengthen it: use shorter members in compression, add depth, or use steel there.`); else K.msg(`Failed at ${w.unstable ? 'once (unstable)' : f(w.W, 1) + ' kN'}. ${o.maxTries - tries} tests left.`, 'bad', 3000); return; }
        const c = cost(B); if (c > o.budget) { if (tries >= o.maxTries) G.lose('Over budget', `It held, but cost $${f(c)}; the budget is $${o.budget}. Remove members that carry little force.`); else K.msg(`Strong enough, but $${f(c)} is over the $${o.budget} budget.`, 'bad', 3000); return; }
        G.win(c <= o.budget * .8 ? 3 : c <= o.budget * .92 ? 2 : 1, (o.budget - c) * 10 + w.W * 5, `Held ${o.load} kN (strength ${f(w.W, 1)} kN) for $${f(c)}.`); } }));
  }
  const game = {
    title: 'Bridge Breaker', intro: 'Win construction contracts: hold the truck anywhere on the deck, stay under budget, and use as few tests as possible.',
    cover: () => `<rect width="1000" height="620" fill="#a9d8f5"/>${labThumb('bridge').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#0b2a4a" text-anchor="middle">Bridge Breaker</text><text x="500" y="540" font-size="18" fill="#0b2a4a" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Creek crossing', goal: 'Span 6 m. Hold a <b>25 kN</b> pickup for under <b>$200</b>.', hint: 'A row of triangles 1 m tall works. Make sure every panel is triangulated.', setup: G => contract(G, { span: 6, load: 25, budget: 200, maxTries: 4 }) },
      { name: 'Delivery route', goal: 'Span 6 m. Hold a <b>40 kN</b> delivery truck for under <b>$300</b>.', hint: 'Wood chords can’t take it. Put steel only in the busiest members (the chords) and keep the rest wood.', setup: G => contract(G, { span: 6, load: 40, budget: 300, maxTries: 4 }) },
      { name: 'River span', goal: 'Span <b>8 m</b>. Hold a <b>35 kN</b> truck for under <b>$400</b>.', hint: 'Longer spans mean bigger bending moments in the middle. Use steel in the busiest chords, short members in compression.', setup: G => contract(G, { span: 8, load: 35, budget: 400, maxTries: 4 }) },
      { name: 'Heavy haul', goal: 'Span 6 m. Hold a <b>60 kN</b> crane for under <b>$420</b>.', hint: 'Wood can’t take 60 kN anywhere busy. Use steel, and keep compression members short (1 m) so they don’t buckle.', setup: G => contract(G, { span: 6, load: 60, budget: 420, maxTries: 5 }) }
    ]
  };
  const finale = () => { const B = preset(6, 'pratt', 1.5, 'steel'), s = strength(B, 3); SimLab.stage('', g => { g.innerHTML = scene(B, { truck: 3, W: 40, S: s.S, sag: 1, extra: legend }); }); };
  XLab.define({ id: 'bridge', guided: { steps, S, quiz, finale, finaleMsg: 'Bridge open to traffic! Now check your thinking.', summary: () => 'You found that triangles make structures rigid, identified tension and compression, used equilibrium to find support forces, and iterated a design to meet strength and cost constraints.' }, free, game });
})();
