/* ═══════════ HS Physics: "Laser Maze: Optics Challenge" ═══════════
   A 2-D ray tracer (1 grid square = 1 cm):
     mirrors        law of reflection: angle of incidence = angle of reflection (measured from the normal)
     glass, water   Snell’s law n₁·sin θ₁ = n₂·sin θ₂; if sin θ₂ would exceed 1 → total internal reflection
                    (critical angle θc = sin⁻¹(n₂/n₁)); a little light also reflects (Fresnel, shown faintly)
     prisms         refract twice; red n = 1.51, green 1.52, violet 1.53 (dispersion)
     thin lens      a ray at height h from the axis turns so parallel rays meet at the focal point: slope′ = slope − h/f
   Walls absorb; targets light up when a beam hits them. */
(() => {
  const K = Kit, f = SimLab.f, D = Math.PI / 180, GX = 20, GY = 60, GW = 640, GH = 500, CM = 20;
  const NCOL = { red: [1.51, '#ff3b4e'], green: [1.52, '#3bff7a'], violet: [1.53, '#b36bff'] };
  /* ── geometry helpers ── */
  const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  function poly(e) { const a = e.a * D; let pts;
    if (e.t === 'block') pts = [[-e.w / 2, -e.h / 2], [e.w / 2, -e.h / 2], [e.w / 2, e.h / 2], [-e.w / 2, e.h / 2]];
    else if (e.t === 'prism') pts = [[-e.s / 2, e.s / 3], [e.s / 2, e.s / 3], [0, -e.s * 2 / 3]];
    else if (e.t === 'rprism') pts = [[-e.s / 2, e.s / 2], [e.s / 2, e.s / 2], [-e.s / 2, -e.s / 2]];
    else if (e.t === 'semi') { pts = []; for (let i = 0; i <= 24; i++) { const t = Math.PI + i / 24 * Math.PI; pts.push([Math.cos(t) * e.r, Math.sin(t) * e.r]); } }
    return pts.map(([x, y]) => { const [u, v] = rot(x, y, a); return [e.x + u, e.y + v]; }); }
  function segs(e) { if (e.t === 'mirror' || e.t === 'lens') { const [u, v] = rot(e.len / 2, 0, e.a * D); return [[e.x - u, e.y - v, e.x + u, e.y + v]]; }
    if (e.t === 'wall') return [[e.x, e.y, e.x + e.w, e.y], [e.x + e.w, e.y, e.x + e.w, e.y + e.h], [e.x + e.w, e.y + e.h, e.x, e.y + e.h], [e.x, e.y + e.h, e.x, e.y]];
    const P = poly(e); return P.map((p, i) => [p[0], p[1], P[(i + 1) % P.length][0], P[(i + 1) % P.length][1]]); }
  function hitSeg(ox, oy, dx, dy, s) { const ex = s[2] - s[0], ey = s[3] - s[1], den = dx * ey - dy * ex; if (Math.abs(den) < 1e-12) return null; const t = ((s[0] - ox) * ey - (s[1] - oy) * ex) / den, u = ((s[0] - ox) * dy - (s[1] - oy) * dx) / den; return t > 1e-6 && u >= 0 && u <= 1 ? { t, u } : null; }
  function hitCirc(ox, oy, dx, dy, c) { const fx = ox - c.x, fy = oy - c.y, b = fx * dx + fy * dy, cc = fx * fx + fy * fy - c.r * c.r, disc = b * b - cc; if (disc < 0) return null; const t = -b - Math.sqrt(disc); return t > 1e-6 ? t : null; }
  const inside = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) c = !c; } return c; };
  /* ── the tracer ── */
  function trace(els, laser, col) {
    const n0 = NCOL[col || 'red'][0], paths = [], hits = new Set(), events = [];
    const beams = laser.beams === 3 ? [-1, 0, 1].map(k => { const [u, v] = rot(0, k * (laser.gap || 1.2), laser.a * D); return [laser.x + u, laser.y + v]; }) : [[laser.x, laser.y]];
    beams.forEach(([sx, sy]) => {
      let ox = sx, oy = sy, dx = Math.cos(laser.a * D), dy = Math.sin(laser.a * D), med = null, I = 1, pts = [[ox, oy]];
      els.forEach((e, ei) => { if (['block', 'prism', 'rprism', 'semi'].includes(e.t) && inside(poly(e), ox, oy)) med = ei; });
      for (let bounce = 0; bounce < 60 && I > .02; bounce++) {
        let best = { t: Infinity };
        els.forEach((e, ei) => { if (e.t === 'target') { const t = hitCirc(ox, oy, dx, dy, e); if (t != null && t < best.t) best = { t, e, ei, target: true }; return; } segs(e).forEach(s => { const h = hitSeg(ox, oy, dx, dy, s); if (h && h.t < best.t) best = { t: h.t, u: h.u, e, ei, s }; }); });
        const bounds = [[0, 0, GW / CM, 0], [GW / CM, 0, GW / CM, GH / CM], [GW / CM, GH / CM, 0, GH / CM], [0, GH / CM, 0, 0]]; bounds.forEach(s => { const h = hitSeg(ox, oy, dx, dy, s); if (h && h.t < best.t) best = { t: h.t, edge: true }; });
        const px = ox + dx * best.t, py = oy + dy * best.t; pts.push([px, py]);
        if (best.edge || best.t === Infinity) break;
        const e = best.e; if (best.target) { hits.add(best.ei); events.push({ e: best.ei, kind: 'target' }); const fx = ox - e.x, fy = oy - e.y, b = fx * dx + fy * dy, t2 = -b + Math.sqrt(Math.max(0, b * b - (fx * fx + fy * fy - e.r * e.r))); ox += dx * t2; oy += dy * t2; pts.push([ox, oy]); continue; }
        if (e.t === 'wall') break;
        const s = best.s, sx2 = s[2] - s[0], sy2 = s[3] - s[1], sl = Math.hypot(sx2, sy2); let nx = -sy2 / sl, ny = sx2 / sl; if (nx * dx + ny * dy > 0) { nx = -nx; ny = -ny; }
        const cosi = -(dx * nx + dy * ny), thI = Math.acos(Math.min(1, cosi)) / D;
        if (e.t === 'mirror') { dx += 2 * cosi * nx; dy += 2 * cosi * ny; events.push({ e: best.ei, kind: 'reflect', thI, thO: thI, x: px, y: py, nx, ny }); ox = px; oy = py; continue; }
        if (e.t === 'lens') { const ax = Math.cos((e.a + 90) * D), ay = Math.sin((e.a + 90) * D), tx = Math.cos(e.a * D), ty = Math.sin(e.a * D), sgn = dx * ax + dy * ay > 0 ? 1 : -1, ua = (dx * ax + dy * ay) * sgn, ut = dx * tx + dy * ty, h = (px - e.x) * tx + (py - e.y) * ty, slope = ut / ua - h / e.f;
          const L = Math.hypot(1, slope); dx = (ax * sgn + tx * slope) / L; dy = (ay * sgn + ty * slope) / L; ox = px; oy = py; events.push({ e: best.ei, kind: 'lens' }); continue; }
        /* a transparent body: entering or leaving? */
        const entering = med !== best.ei;
        const n1 = entering ? 1 : (e.n || n0) + ((e.t === 'prism' || e.t === 'rprism') ? (NCOL[col || 'red'][0] - 1.51) : 0), n2 = entering ? (e.n || n0) + ((e.t === 'prism' || e.t === 'rprism') ? (NCOL[col || 'red'][0] - 1.51) : 0) : 1;
        const eta = n1 / n2, k = 1 - eta * eta * (1 - cosi * cosi);
        if (k < 0) { dx += 2 * cosi * nx; dy += 2 * cosi * ny; events.push({ e: best.ei, kind: 'tir', thI, x: px, y: py, nx, ny, n1, n2 }); ox = px; oy = py; continue; }
        const ct = Math.sqrt(k), rs = ((n1 * cosi - n2 * ct) / (n1 * cosi + n2 * ct)) ** 2, rp = ((n1 * ct - n2 * cosi) / (n1 * ct + n2 * cosi)) ** 2, R = (rs + rp) / 2;
        const tdx = eta * dx + (eta * cosi - ct) * nx, tdy = eta * dy + (eta * cosi - ct) * ny;
        events.push({ e: best.ei, kind: 'refract', thI, thO: Math.acos(Math.min(1, ct)) / D, x: px, y: py, nx, ny, n1, n2, R });
        if (R > .03) paths.push({ pts: [[px, py], [px + (dx + 2 * cosi * nx) * 3, py + (dy + 2 * cosi * ny) * 3]], I: I * R, faint: true });
        I *= 1 - R; dx = tdx; dy = tdy; ox = px; oy = py; med = entering ? best.ei : null;
      }
      paths.push({ pts, I });
    });
    return { paths, hits, events };
  }
  /* ── drawing ── */
  const P = (x, y) => [GX + x * CM, GY + y * CM];
  function drawEl(e, sel) {
    const c = sel ? '#ffd27a' : null;
    if (e.t === 'wall') { const [x, y] = P(e.x, e.y); return `<rect x="${x}" y="${y}" width="${e.w * CM}" height="${e.h * CM}" fill="#3a4250" stroke="#5a6270"/>`; }
    if (e.t === 'target') { const [x, y] = P(e.x, e.y); return `<g transform="translate(${x} ${y})"><circle r="${e.r * CM}" fill="${e.lit ? '#7ee0a1' : 'none'}" fill-opacity="${e.lit ? .5 : 0}" stroke="${e.lit ? '#7ee0a1' : '#ffd27a'}" stroke-width="3"/><circle r="${e.r * CM * .45}" fill="${e.lit ? '#7ee0a1' : '#ffd27a'}"/></g>`; }
    if (e.t === 'mirror' || e.t === 'lens') { const s = segs(e)[0], [x1, y1] = P(s[0], s[1]), [x2, y2] = P(s[2], s[3]);
      if (e.t === 'mirror') return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c || '#cfe0f2'}" stroke-width="7" stroke-linecap="round" data-el/>`;
      const [cx, cy] = P(e.x, e.y), L = e.len * CM / 2; return `<g transform="translate(${cx} ${cy}) rotate(${e.a})"><path d="M${-L},0 Q0,${-14} ${L},0 Q0,14 ${-L},0Z" fill="#9fd0ff" fill-opacity=".35" stroke="${c || '#9fd0ff'}" stroke-width="2.5"/></g>`; }
    const pts = poly(e).map(([x, y]) => P(x, y).join(',')).join(' ');
    return `<polygon points="${pts}" fill="${e.n > 1.4 ? '#9fd0ff' : '#5ab0ff'}" fill-opacity="${e.n > 2 ? .5 : .22}" stroke="${c || '#9fd0ff'}" stroke-width="2.5"/>`;
  }
  function drawLaser(l, col) { const [x, y] = P(l.x, l.y); return `<g transform="translate(${x} ${y}) rotate(${l.a})"><rect x="-44" y="-14" width="44" height="28" rx="5" fill="#5a6270" stroke="#9aa8b8"/><rect x="-6" y="-7" width="8" height="14" fill="${NCOL[col || 'red'][1]}"/></g>`; }
  function scene(state, o = {}) {
    const { els, laser, col } = state, T = trace(els, laser, col); els.forEach((e, i) => { if (e.t === 'target') e.lit = T.hits.has(i); });
    let g = `<rect width="1000" height="620" fill="#0a0f1e"/><rect x="${GX}" y="${GY}" width="${GW}" height="${GH}" fill="#0d1428" stroke="#26314d" stroke-width="2"/>`;
    for (let x = 0; x <= GW / CM; x++) g += `<line x1="${GX + x * CM}" y1="${GY}" x2="${GX + x * CM}" y2="${GY + GH}" stroke="#16213a" stroke-width="${x % 5 ? 1 : 2}"/>`;
    for (let y = 0; y <= GH / CM; y++) g += `<line x1="${GX}" y1="${GY + y * CM}" x2="${GX + GW}" y2="${GY + y * CM}" stroke="#16213a" stroke-width="${y % 5 ? 1 : 2}"/>`;
    if (o.ruler) for (let x = 0; x <= GW / CM; x += 5) g += `<text x="${GX + x * CM}" y="${GY + GH + 16}" font-size="11" fill="#7d8fb0" text-anchor="middle">${x} cm</text>`;
    els.forEach((e, i) => { if (e.mov) { const [mx, my] = P(e.x, e.y); g += `<circle cx="${mx}" cy="${my}" r="${(e.len || e.s || e.w || 2) * CM * .6 + 10}" fill="#ffd27a" fill-opacity="${o.sel === i ? .12 : .05}" stroke="#ffd27a" stroke-opacity=".35" stroke-dasharray="4 5"/>`; } g += drawEl(e, o.sel === i); });
    const c = NCOL[col || 'red'][1];
    T.paths.forEach(p => { const pts = p.pts.map(q => P(q[0], q[1]).join(',')).join(' '); g += `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${p.faint ? 1.5 : 7}" stroke-opacity="${p.faint ? p.I * .8 : .18 * p.I}" stroke-linejoin="round"/><polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${p.faint ? 1 : 2.4}" stroke-opacity="${p.faint ? Math.min(.6, p.I * 2) : Math.max(.25, p.I)}" stroke-linejoin="round"/>`; });
    g += drawLaser(laser, col);
    /* protractor at the first event of the selected element (or the first event) */
    const ev = (o.evPick && T.events.find(o.evPick)) || T.events.find(v => (o.sel != null ? v.e === o.sel : true) && v.x != null);
    if (ev && o.angles !== false) { const [x, y] = P(ev.x, ev.y), nx = ev.nx, ny = ev.ny; g += `<line x1="${x - nx * 70}" y1="${y - ny * 70}" x2="${x + nx * 70}" y2="${y + ny * 70}" stroke="#fff" stroke-dasharray="5 4" stroke-opacity=".7"/><text x="${x + nx * 76}" y="${y + ny * 76}" font-size="11" fill="#fff" text-anchor="middle">normal</text>`; }
    const rows = ev ? [['Event', { reflect: 'reflection', refract: 'refraction', tir: 'total internal reflection' }[ev.kind]], ['Angle of incidence', `${f(ev.thI, 1)}°`, '#ffd27a'], [ev.kind === 'refract' ? 'Angle of refraction' : 'Angle of reflection', `${f(ev.kind === 'tir' ? ev.thI : ev.thO, 1)}°`, '#7ee0a1']].concat(ev.n1 ? [['n₁ → n₂', `${f(ev.n1, 2)} → ${f(ev.n2, 2)}`]] : []).concat(ev.R != null ? [['Light reflected', `${f(ev.R * 100, 1)} %`]] : []) : [['Event', '—']];
    g += SimLab.hud(680, 30, 300, rows, 'Protractor (at the ' + (o.sel != null ? 'selected piece' : 'first surface') + ')');
    const tg = els.filter(e => e.t === 'target'); if (tg.length) g += `<g transform="translate(680 ${50 + rows.length * 20 + 36})"><rect width="300" height="34" rx="8" fill="#0b1020" fill-opacity=".8"/><text x="150" y="22" font-size="14" font-weight="800" fill="${tg.every(e => e.lit) ? '#7ee0a1' : '#ffd27a'}" text-anchor="middle">Targets lit: ${tg.filter(e => e.lit).length} / ${tg.length}</text></g>`;
    return { svg: g + (o.extra ? o.extra(T) : ''), T };
  }
  /* ── interaction: select a movable piece, drag it, rotate with the slider ── */
  function bench(state, o = {}) {
    let sel = null, drag = null, T = null; const st = { a: 0 }; const mov = i => state.els[i] && state.els[i].mov;
    const pick = p => { let best = null, bd = 1.6; state.els.forEach((e, i) => { if (!e.mov) return; const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd + (e.s || e.w || e.len || 0) / 3) { bd = d; best = i; } }); return best; };
    const toG = p => ({ x: (p.x - GX) / CM, y: (p.y - GY) / CM });
    K.on(K.svg, 'pointerdown', e => { const p = toG(K.pt(e)); if (o.laserMov && Math.hypot(p.x - state.laser.x, p.y - state.laser.y) < 2) { drag = { laser: true }; return; } const i = pick(p); sel = i; if (i != null) { drag = { i, dx: state.els[i].x - p.x, dy: state.els[i].y - p.y }; st.a = state.els[i].a; RP && RP.sync(); } o.onSel && o.onSel(i); });
    K.on(window, 'pointermove', e => { if (!drag) return; const p = toG(K.pt(e)); if (drag.laser) { state.laser.y = clamp(Math.round(p.y * 2) / 2, 1, GH / CM - 1); return; } const el = state.els[drag.i]; el.x = clamp(Math.round((p.x + drag.dx) * 2) / 2, 1, GW / CM - 1); el.y = clamp(Math.round((p.y + drag.dy) * 2) / 2, 1, GH / CM - 1); });
    K.on(window, 'pointerup', () => { if (drag) { drag = null; o.change && o.change(T); } });
    const RP = o.noRotate ? null : SimLab.panel(st, [{ k: 'a', label: 'Rotate the selected piece', min: -180, max: 180, step: 1, fmt: v => v + '°' }], () => { if (sel != null && mov(sel)) { state.els[sel].a = st.a; o.change && o.change(T); } });
    SimLab.stage('', g => { const r = scene(state, Object.assign({}, o, { sel })); T = r.T; g.innerHTML = r.svg; o.tick && o.tick(T); });
    return { T: () => T, sel: () => sel };
  }

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'refl', name: 'Reflection', title: 'Angle in, angle out', html: 'Click the mirror to select it, then <b>rotate</b> it until the beam hits the target. Watch the protractor: compare the angle of incidence and the angle of reflection.', hint: 'Both angles are measured from the dashed normal line. They are always equal.' },
    { id: 'snell', name: 'Snell’s law', title: 'Bending light', html: 'The laser shines into a glass block. Rotate the <b>laser</b> to get an angle of incidence near <b>40°</b>, read both angles, and calculate the glass’s <b>refractive index</b>: n = sin θ₁ ÷ sin θ₂.', hint: 'n = sin(angle in air) ÷ sin(angle in glass). Use the protractor values.' },
    { id: 'tir', name: 'Total internal reflection', title: 'Trapped light', html: 'Now the light travels <b>inside</b> a semicircular glass block toward its flat face. Rotate the laser and find the <b>critical angle</b>, where the light stops escaping and reflects completely.', hint: 'θc = sin⁻¹(1/1.5) ≈ 42°. Watch the protractor as you rotate slowly.' },
    { id: 'lens', name: 'Lenses', title: 'Focus!', html: 'Three parallel beams pass through a converging lens. Move the <b>target</b> to where they meet (the <b>focal point</b>), then measure the <b>focal length</b> with the grid.', hint: 'Each grid square is 1 cm. Count from the lens to the point where the beams cross.' }
  ];
  const S = {
    refl: R => { const state = { laser: { x: 3, y: 6, a: 0 }, els: [{ t: 'mirror', x: 18, y: 6, a: 70, len: 4, mov: true, lockMove: true }, { t: 'wall', x: 22, y: 0, w: 1, h: 13 }, { t: 'target', x: 10, y: 20, r: .9 }] }; let lit = false, q = null;
      bench(state, { tick: T => { if (T.hits.size && !lit) { lit = true; const ev = T.events.find(v => v.kind === 'reflect'); XLab.note(`Mirror: angle of incidence ${f(ev.thI, 1)}° = angle of reflection ${f(ev.thO, 1)}°.`); SND.ok(); G.check(); } } });
      state.els[0].x = 18; XLab.choiceIn('If the angle of incidence is 35°, the angle of reflection is…', ['35°', '55°', '70°', '145°'], i => { q = i; if (i !== 0) R.mistake('Law of reflection', 'The angle of reflection equals the angle of incidence (both from the normal).'); G.check(); });
      const G = SimLab.goals(R, { name: 'Reflection', items: () => [[lit, 'Hit the target'], [q === 0, 'Apply the law of reflection']],
        q: { q: 'Angles of incidence and reflection are measured from…', a: ['The normal (a line at 90° to the surface)', 'The mirror surface', 'The floor', 'The laser'], c: 0, e: 'Optics measures angles from the <b>normal</b>, the line perpendicular to the surface where the ray hits.' } }); },
    snell: R => { const state = { laser: { x: 4, y: 3, a: 40 }, els: [{ t: 'block', x: 16, y: 15, a: 0, w: 22, h: 10, n: 1.5 }] }; let nOk = false, at40 = false;
      const lp = { a: 40 }; SimLab.panel(lp, [{ k: 'a', label: 'Laser angle (rotate it)', min: 15, max: 80, step: 1, fmt: v => v + '° below horizontal' }], () => { state.laser.a = lp.a; state.laser.x = 16 - 7 / Math.tan(lp.a * D); });
      state.laser.x = 16 - 7 / Math.tan(40 * D);
      bench(state, { noRotate: true, tick: T => { const ev = T.events.find(v => v.kind === 'refract'); if (ev && Math.abs(ev.thI - 40) < 3 && !at40) { at40 = true; G.check(); } } });
      LabUI.html(XLab.numIn('snN', 'Refractive index of the glass', ''));
      $('#snNB').onclick = () => { const v = +$('#snN').value; if (Math.abs(v - 1.5) <= .06) { nOk = true; XLab.note('From the angles, n = sin θ₁ ÷ sin θ₂ ≈ 1.50 for the glass.'); K.msg('n ≈ 1.50: typical glass.', 'ok', 2200); } else { R.mistake('Snell’s law', 'n = sin θ₁ / sin θ₂ with θ₁ in air and θ₂ in the glass, both from the normal.'); K.msg('Divide sin(angle in air) by sin(angle in glass).', 'bad', 2600); } G.check(); };
      const G = SimLab.goals(R, { name: 'Snell’s law', items: () => [[at40, 'Set an angle of incidence near 40°'], [nOk, 'Calculate n (±0.06)']],
        q: { q: 'Light bends toward the normal when it enters glass because…', a: ['It slows down in glass (n = c ÷ v)', 'Glass attracts light', 'It speeds up in glass', 'The frequency changes'], c: 0, e: 'Light travels at c ÷ n in a material: about 200,000 km/s in glass. Slowing down at an angle turns the wavefront toward the normal.' } }); },
    tir: R => { const state = { laser: { x: 16, y: 18, a: -60 }, els: [{ t: 'semi', x: 16, y: 13, a: 0, r: 10, n: 1.5 }] }; let found = false, saw = false;
      const lp = { a: 20 }; const aim = () => { const a = 90 - lp.a; state.laser.a = a; state.laser.x = 16 - Math.cos(a * D) * 12; state.laser.y = 13 - Math.sin(a * D) * 12; }; aim();
      SimLab.panel(lp, [{ k: 'a', label: 'Angle to the normal (inside the glass)', min: 0, max: 80, step: .5, fmt: v => v + '°' }], aim);
      state.els[0].a = 0;
      bench(state, { noRotate: true, evPick: v => v.n1 > 1.2 && (v.kind === 'tir' || v.kind === 'refract'), tick: T => { const tir = T.events.some(v => v.kind === 'tir'); if (tir && !saw) { saw = true; G.check(); } } });
      LabUI.html(XLab.numIn('tiC', 'Critical angle', '°'));
      $('#tiCB').onclick = () => { const v = +$('#tiC').value; if (!saw) { K.msg('Rotate until the light stops escaping first.', 'bad', 2000); return; } if (Math.abs(v - 41.8) <= 1.5) { found = true; XLab.note('Critical angle of glass (n = 1.5) ≈ 41.8°: above it, total internal reflection.'); K.msg('θc = sin⁻¹(1/1.5) = 41.8°', 'ok', 2400); } else { R.mistake('Critical angle', 'θc = sin⁻¹(n₂/n₁) = sin⁻¹(1/1.5) ≈ 41.8°.'); K.msg('Find the angle where the escaping beam just disappears.', 'bad', 2400); } G.check(); };
      const G = SimLab.goals(R, { name: 'Total internal reflection', items: () => [[saw, 'See total internal reflection'], [found, 'Find the critical angle (±1.5°)']],
        q: { q: 'Optical fibers carry internet signals by…', a: ['Total internal reflection: light hits the walls above the critical angle and stays inside', 'Mirrors coated inside the fiber', 'Electricity', 'Light slowing to zero'], c: 0, e: 'Inside a fiber the light meets the boundary at angles bigger than the critical angle, so it reflects completely, mile after mile.' } }); },
    lens: R => { const state = { laser: { x: 2, y: 12.5, a: 0, beams: 3, gap: 2 }, els: [{ t: 'lens', x: 10, y: 12.5, a: 90, len: 9, f: 12 }, { t: 'target', x: 28, y: 6, r: .6, mov: true }] }; let lit = false, fOk = false;
      bench(state, { noRotate: true, ruler: true, tick: T => { const hitAll = T.events.filter(v => v.kind === 'target').length >= 3; if (hitAll && !lit) { lit = true; SND.ok(); K.msg('All three beams meet at the target: the focal point!', 'ok', 2600); G.check(); } } });
      LabUI.html(XLab.numIn('lnF', 'Focal length', 'cm'));
      $('#lnFB').onclick = () => { const v = +$('#lnF').value; if (Math.abs(v - 12) <= .8) { fOk = true; XLab.note('Converging lens: parallel beams met 12 cm behind it, so f = 12 cm.'); K.msg('f = 12 cm.', 'ok', 1600); } else { R.mistake('Focal length', 'Measure from the lens to where the parallel beams cross: 12 cm.'); K.msg('Count grid squares from the lens to the crossing point.', 'bad', 2200); } G.check(); };
      const G = SimLab.goals(R, { name: 'Lenses', items: () => [[lit, 'Put the target at the focal point'], [fOk, 'Measure the focal length']],
        q: { q: 'Why does a magnifying glass focused on paper in sunlight make a hot spot?', a: ['It bends parallel sunlight to meet at its focal point, concentrating the energy', 'Glass heats up and touches the paper', 'It reflects light back to the sun', 'It makes extra light'], c: 0, e: 'A converging lens refracts parallel rays so they meet at the focal point: all the light energy passing through the lens lands on a tiny spot.' } }); }
  };
  const quiz = [
    { q: 'Light goes from air (n = 1.00) into water (n = 1.33) at 30°. The angle of refraction is about…', a: ['22°', '30°', '42°', '60°'], c: 0, e: 'sin θ₂ = sin 30° ÷ 1.33 = 0.376, so θ₂ ≈ 22° (bent toward the normal).' },
    { q: 'Total internal reflection can only happen when light goes from…', a: ['A higher index to a lower index, above the critical angle', 'Air into glass', 'Any material at any angle', 'A lower index to a higher index'], c: 0, e: 'Only when going into a slower-to-faster boundary (high n to low n) can sin θ₂ exceed 1.' },
    { q: 'A prism splits white light into colors because…', a: ['Each color has a slightly different refractive index (dispersion)', 'The prism adds color', 'Red light travels faster in a vacuum', 'Light reflects inside it'], c: 0, e: 'Violet light slows more in glass than red, so it bends more.' },
    { q: 'Diamond (n = 2.42) sparkles more than glass (n = 1.5) because…', a: ['Its critical angle is much smaller (24°), so more light is trapped and reflected inside', 'It is harder', 'It glows', 'Its critical angle is larger'], c: 0, e: 'θc = sin⁻¹(1/2.42) ≈ 24°, so light bounces around inside and exits from the top.' },
    { q: 'An object is far away. A converging lens with f = 5 cm forms its image about…', a: ['5 cm behind the lens', '10 cm behind the lens', 'At the lens', 'In front of the lens'], c: 0, e: 'Light from a distant object arrives nearly parallel, so it focuses at the focal point.' }
  ];

  /* ═════ Free Investigation: one boundary, exact angles ═════ */
  const MATS = { water: 1.33, glass: 1.50, diamond: 2.42, oil: 1.47, ice: 1.31 };
  const free = {
    intro: 'A laser hits a flat boundary between air and a material. Change the angle, the material or the direction, and record.',
    fresh: () => ({ th: 30, n2: 1.5, dir: 'in' }),
    vars: [{ k: 'th', label: 'Angle of incidence', short: 'θ₁', min: 0, max: 89, step: 1, unit: '°', d: 0, fmt: v => v + '°' }, { k: 'n2', label: 'Refractive index of the material', short: 'n', min: 1, max: 2.5, step: .01, unit: '', d: 2, fmt: v => f(v, 2) + ` (${Object.entries(MATS).find(([, x]) => Math.abs(x - v) < .015)?.[0] || 'custom'})` }],
    cats: [{ k: 'dir', label: 'Light travels', opts: [['in', 'Air → material'], ['out', 'Material → air']] }],
    measures: [{ k: 'th2', label: 'Angle of refraction', short: 'θ₂', unit: '°', d: 1 }, { k: 'R', label: 'Light reflected', short: 'Reflected', unit: '%', d: 1 }, { k: 'sin', label: 'sin θ₁ ÷ sin θ₂', short: 'ratio', unit: '', d: 3 }, { k: 'what', label: 'What happens', text: true }],
    measure: s => { const n1 = s.dir === 'in' ? 1 : s.n2, n2 = s.dir === 'in' ? s.n2 : 1, si = Math.sin(s.th * D), st = n1 * si / n2; if (st > 1) return { th2: NaN, R: 100, sin: NaN, what: 'total internal reflection' }; const ci = Math.cos(s.th * D), ct = Math.sqrt(1 - st * st), rs = ((n1 * ci - n2 * ct) / (n1 * ci + n2 * ct)) ** 2, rp = ((n1 * ct - n2 * ci) / (n1 * ct + n2 * ci)) ** 2; return { th2: Math.asin(st) / D, R: (rs + rp) / 2 * 100, sin: s.th ? si / st : NaN, what: 'refraction' }; },
    ideas: [['How does the angle of incidence affect the angle of refraction?', 'th', 'th2'], ['How does the material’s refractive index affect the angle of refraction?', 'n2', 'th2'], ['How does the angle of incidence affect how much light reflects?', 'th', 'R']],
    expect(x, y) {
      if (x === 'th' && y === 'th2') return { t: 'up', why: 'Snell’s law: sin θ₂ = (n₁/n₂)·sin θ₁. The angle of refraction rises with the angle of incidence, but not in a straight line. Graph sin θ₂ against sin θ₁ for a straight line whose slope is n₁/n₂. Going from material to air, it hits 90° at the critical angle, then total internal reflection takes over.' };
      if (x === 'n2' && y === 'th2') return { t: 'down', why: 'Going into a material, a higher index means the light slows more and bends more toward the normal, so θ₂ gets smaller.' };
      if (x === 'th' && y === 'R') return { t: 'up', why: 'At steep (near-normal) angles only about 4 % of light reflects from glass. At grazing angles almost all of it reflects (Fresnel reflection). That’s why a lake looks like a mirror at sunset.' };
      return null;
    },
    setup(F) {
      SimLab.stage('', g => { const s = F.st, m = free.measure(s), n1 = s.dir === 'in' ? 1 : s.n2, cx = 330, cy = 320, up = s.dir === 'in';
        let h = `<rect width="1000" height="620" fill="#0a0f1e"/><rect x="20" y="${cy}" width="620" height="260" fill="#5ab0ff" fill-opacity="${.12 + (s.n2 - 1) * .2}"/><text x="40" y="${cy - 12}" font-size="14" fill="#9fd0ff">${up ? 'air (n = 1.00)' : `material (n = ${f(s.n2, 2)})`}</text><text x="40" y="${cy + 26}" font-size="14" fill="#9fd0ff">${up ? `material (n = ${f(s.n2, 2)})` : 'air (n = 1.00)'}</text>
          <line x1="${cx}" y1="60" x2="${cx}" y2="580" stroke="#fff" stroke-dasharray="6 5" stroke-opacity=".6"/><line x1="20" y1="${cy}" x2="640" y2="${cy}" stroke="#9fd0ff" stroke-width="2"/>`;
        if (!up) h = h.replace(`fill-opacity="${.12 + (s.n2 - 1) * .2}"`, 'fill-opacity="0"') + `<rect x="20" y="60" width="620" height="${cy - 60}" fill="#5ab0ff" fill-opacity="${.12 + (s.n2 - 1) * .2}"/>`;
        const a = s.th * D, L = 240, ix = cx - Math.sin(a) * L, iy = cy - Math.cos(a) * L;
        h += `<line x1="${ix}" y1="${iy}" x2="${cx}" y2="${cy}" stroke="#ff3b4e" stroke-width="4"/><line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(a) * L}" y2="${cy - Math.cos(a) * L}" stroke="#ff3b4e" stroke-width="${1 + 3 * m.R / 100}" stroke-opacity="${.25 + .75 * m.R / 100}"/>`;
        if (!isNaN(m.th2)) { const b = m.th2 * D; h += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(b) * L}" y2="${cy + Math.cos(b) * L}" stroke="#ff3b4e" stroke-width="4" stroke-opacity="${1 - m.R / 100}"/><path d="M${cx},${cy + 60} A60,60 0 0,0 ${cx + Math.sin(b) * 60},${cy + Math.cos(b) * 60}" fill="none" stroke="#7ee0a1" stroke-width="2"/><text x="${cx + 20}" y="${cy + 90}" font-size="13" fill="#7ee0a1">θ₂</text>`; }
        h += `<path d="M${cx},${cy - 60} A60,60 0 0,0 ${cx - Math.sin(a) * 60},${cy - Math.cos(a) * 60}" fill="none" stroke="#ffd27a" stroke-width="2"/><text x="${cx - 34}" y="${cy - 70}" font-size="13" fill="#ffd27a">θ₁</text>`;
        h += SimLab.hud(680, 30, 300, [['Angle of incidence θ₁', `${s.th}°`, '#ffd27a'], ['Angle of refraction θ₂', isNaN(m.th2) ? '— (TIR)' : `${f(m.th2, 1)}°`, '#7ee0a1'], ['n₁ → n₂', `${f(n1, 2)} → ${f(s.dir === 'in' ? s.n2 : 1, 2)}`], ['Reflected', `${f(m.R, 1)} %`], ['Critical angle', s.dir === 'out' ? `${f(Math.asin(1 / s.n2) / D, 1)}°` : 'none (going into slower)']], 'Boundary');
        g.innerHTML = h; });
    }
  };

  /* ═════ Game: Laser Maze ═════ */
  function maze(G, o) {
    const state = { laser: Object.assign({}, o.laser), col: o.col || 'red', els: o.els.map(e => Object.assign({}, e)) }; let done = false;
    bench(state, { tick: T => { if (done || G.over()) return; const tg = state.els.filter(e => e.t === 'target'); if (tg.length && tg.every(e => e.lit)) { done = true; const used = state.els.filter(e => e.mov && e.moved).length; G.win(G.t() < o.par ? 3 : G.t() < o.par * 2 ? 2 : 1, 2000 - G.t() * 10, o.why); } }, change: () => {}, angles: true });
    G.panel({}, [{ html: '<div class="sim-note">Drag the glowing pieces to move them; select one and use the slider to rotate it.</div>' }]);
  }
  const game = {
    title: 'Laser Maze', intro: 'Steer the laser onto every target using mirrors, glass and prisms. Solve it fast for 3 stars.',
    cover: () => `<rect width="1000" height="620" fill="#0a0f1e"/>${labThumb('laser').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Laser Maze</text><text x="500" y="540" font-size="18" fill="#9fc6e0" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'Around the corner', goal: 'Use the two mirrors to get the beam around the wall.', hint: 'A mirror at 45° turns the beam through 90°.', setup: G => maze(G, { par: 40, why: 'Each mirror reflects at equal angles to the normal: two 45° mirrors make a periscope.', laser: { x: 2, y: 4, a: 0 }, els: [{ t: 'wall', x: 14, y: 0, w: 1, h: 16 }, { t: 'mirror', x: 8, y: 9, a: 0, len: 3, mov: true }, { t: 'mirror', x: 20, y: 12, a: 0, len: 3, mov: true }, { t: 'target', x: 28, y: 20, r: .9 }] }) },
      { name: 'Glass shift', goal: 'The target is just below the beam line. Use the glass block to shift the beam sideways.', hint: 'A tilted glass block bends the beam in, then out again: the beam leaves parallel but shifted.', setup: G => maze(G, { par: 40, why: 'Refraction in and out of a parallel-sided block shifts the beam sideways without changing its direction.', laser: { x: 2, y: 10, a: 0 }, els: [{ t: 'block', x: 14, y: 14, a: 0, w: 5, h: 8, n: 1.5, mov: true }, { t: 'target', x: 29, y: 11.5, r: .6 }, { t: 'wall', x: 22, y: 7, w: 1, h: 3.8 }] }) },
      { name: 'No mirrors allowed', goal: 'Turn the beam 90° using only a <b>right-angle prism</b>. (Hint: total internal reflection!)', hint: 'Light entering a face straight on meets the long face at 45°, above glass’s 42° critical angle.', setup: G => maze(G, { par: 50, why: 'At 45° inside the glass the light exceeds the 42° critical angle and reflects totally: periscopes and binoculars use prisms this way.', laser: { x: 2, y: 6, a: 0 }, els: [{ t: 'rprism', x: 10, y: 16, a: 0, s: 4, n: 1.5, mov: true }, { t: 'wall', x: 0, y: 9, w: 27, h: 1 }, { t: 'target', x: 29, y: 22, r: .8 }] }) },
      { name: 'Double target', goal: 'Light <b>both</b> targets with one beam. Targets let light pass through. Avoid the walls.', hint: 'The beam passes the first target, then needs two 90° turns to reach the second.', setup: G => maze(G, { par: 70, why: 'Planning a ray path one reflection at a time is how engineers design optical instruments.', laser: { x: 2, y: 3, a: 0 }, els: [{ t: 'target', x: 14, y: 3, r: .8 }, { t: 'wall', x: 28, y: 0, w: 1, h: 12 }, { t: 'wall', x: 8, y: 12, w: 14, h: 1 }, { t: 'mirror', x: 10, y: 18, a: 0, len: 3, mov: true }, { t: 'mirror', x: 16, y: 18, a: 0, len: 3, mov: true }, { t: 'mirror', x: 4, y: 20, a: 0, len: 3, mov: true }, { t: 'target', x: 30, y: 22, r: .8 }] }) }
    ]
  };
  const finale = () => { const state = { laser: { x: 2, y: 12.5, a: 0, beams: 3, gap: 2 }, els: [{ t: 'lens', x: 10, y: 12.5, a: 90, len: 9, f: 12 }, { t: 'prism', x: 26, y: 12.5, a: 0, s: 6, n: 1.5 }] }; SimLab.stage('', g => { g.innerHTML = scene(state, { angles: false }).svg; }); };
  XLab.define({ id: 'laser', guided: { steps, S, quiz, finale, finaleMsg: 'Beam on target! Now check your thinking.', summary: () => 'You confirmed the law of reflection, measured a refractive index with Snell’s law, found the critical angle for total internal reflection, and measured a lens’s focal length.' }, free, game });
})();
