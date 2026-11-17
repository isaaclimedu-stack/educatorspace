/* ═══════════ HS Biology: "Genetic Architect: Creature Creator" ═══════════
   Fictional "Blorbs" with five genes on different chromosomes (so they assort independently):
     body  B > b        complete dominance       BB/Bb blue, bb orange
     horn  H > h        complete dominance       HH/Hh horns, hh none
     spot  R, W         incomplete dominance     RR red, RW pink, WW white
     eye   G, P         codominance              GG green, PP purple, GP one of each
     glow  Xᴳ > Xᵍ      X-linked recessive       females need XᵍXᵍ to glow, males (XᵍY) need one copy
   Each parent gives one allele per gene at random (segregation); fathers give X or Y, which sets the sex.
   Mutation: each allele passed on has a small chance (the mutation rate) of switching to the other allele. */
(() => {
  const K = Kit, f = SimLab.f;
  const GENES = {
    body: { n: 'Body color', al: ['B', 'b'], ph: a => a.includes('B') ? 'blue' : 'orange' },
    horn: { n: 'Horns', al: ['H', 'h'], ph: a => a.includes('H') ? 'horns' : 'no horns' },
    spot: { n: 'Spots', al: ['R', 'W'], ph: a => a[0] === a[1] ? (a[0] === 'R' ? 'red spots' : 'white spots') : 'pink spots' },
    eye: { n: 'Eyes', al: ['G', 'P'], ph: a => a[0] === a[1] ? (a[0] === 'G' ? 'green eyes' : 'purple eyes') : 'green + purple eyes' },
    glow: { n: 'Tail glow (X-linked)', al: ['Xᴳ', 'Xᵍ'], ph: (a, sex) => (sex === 'M' ? a[0] === 'Xᵍ' : a[0] === 'Xᵍ' && a[1] === 'Xᵍ') ? 'glowing tail' : 'plain tail' }
  };
  const IDS = Object.keys(GENES);
  const blorb = (sex, g) => { const c = { sex }; IDS.forEach(k => c[k] = k === 'glow' && sex === 'M' ? [g[k][0], 'Y'] : g[k].slice()); return c; };
  const phen = (c, k) => GENES[k].ph(c[k], c.sex);
  const gt = (c, k) => k === 'glow' && c.sex === 'M' ? c[k][0] + 'Y' : c[k].join('').replace(/^([a-z])([A-Z])$/, '$2$1').replace(/^bB$/, 'Bb');
  const order = (k, a) => { const al = GENES[k].al; return a.slice().sort((x, y) => (x === 'Y') - (y === 'Y') || al.indexOf(x) - al.indexOf(y)); };
  const gtxt = (c, k) => k === 'glow' ? (c.sex === 'M' ? c.glow[0] + 'Y' : order(k, c.glow).join('')) : order(k, c[k]).join('');
  function gamete(c, mut) { const g = {}; IDS.forEach(k => { let a = c[k][Math.random() < .5 ? 0 : 1]; if (a !== 'Y' && mut && Math.random() < mut) { const al = GENES[k].al; a = al[1 - al.indexOf(a)]; g.mut = (g.mut || 0) + 1; } g[k] = a; }); return g; }
  function child(m, d, mut) { const e = gamete(m, mut), s = gamete(d, mut), c = { sex: s.glow === 'Y' ? 'M' : 'F', mut: (e.mut || 0) + (s.mut || 0) }; IDS.forEach(k => c[k] = k === 'glow' ? (s.glow === 'Y' ? [e.glow, 'Y'] : [e.glow, s.glow]) : [e[k], s[k]]); return c; }
  /* expected phenotype fractions for one gene (from the Punnett square), sexes counted together */
  function expect(m, d, k) { const out = {}; m[k].forEach(a => d[k].forEach(b => { const sex = b === 'Y' ? 'M' : 'F', p = GENES[k].ph(k === 'glow' ? (b === 'Y' ? [a, 'Y'] : [a, b]) : [a, b], sex); out[p] = (out[p] || 0) + .25; })); return out; }
  function expect2(m, d, k1, k2) { const a = expect(m, d, k1), b = expect(m, d, k2), o = {}; Object.entries(a).forEach(([p, x]) => Object.entries(b).forEach(([q, y]) => o[p + ', ' + q] = x * y)); return o; }
  const tally = (kids, fn) => { const o = {}; kids.forEach(c => { const p = fn(c); o[p] = (o[p] || 0) + 1; }); return o; };

  /* ── drawing a blorb ── */
  function draw(c, x, y, s = 1, o = {}) {
    const blue = phen(c, 'body') === 'blue', bc = blue ? '#4f8ff7' : '#ff9a3c', sp = { 'red spots': '#e5484d', 'pink spots': '#ff9fc4', 'white spots': '#ffffff' }[phen(c, 'spot')], glow = phen(c, 'glow') === 'glowing tail';
    const ec = c.eye[0] === c.eye[1] ? [c.eye[0], c.eye[0]] : ['G', 'P'], ecol = a => a === 'G' ? '#2fbf5a' : '#9b59d0';
    let g = `<g transform="translate(${x} ${y}) scale(${s})" ${o.dim ? 'opacity=".35"' : ''}>`;
    g += `<path d="M30,10 q36,-4 44,-30" stroke="${glow ? '#e9ff6b' : bc}" stroke-width="9" fill="none" stroke-linecap="round"/>${glow ? `<circle cx="74" cy="-22" r="13" fill="#e9ff6b" opacity=".45"/><circle cx="74" cy="-22" r="7" fill="#f6ffb0"/>` : ''}`;
    if (phen(c, 'horn') === 'horns') g += `<path d="M-20,-34 l-8,-26 l16,18z M20,-34 l8,-26 l-16,18z" fill="#f2e3c6" stroke="#8a6d4a" stroke-width="2"/>`;
    g += `<ellipse rx="44" ry="38" fill="${bc}" stroke="#1b2540" stroke-opacity=".35" stroke-width="3"/>`;
    [[-22, 12, 6], [18, 18, 7], [28, -6, 5], [-30, -8, 4], [0, 26, 5]].forEach(([a, b, r]) => g += `<circle cx="${a}" cy="${b}" r="${r}" fill="${sp}" stroke="#0003" stroke-width="1"/>`);
    g += `<circle cx="-14" cy="-10" r="10" fill="#fff"/><circle cx="14" cy="-10" r="10" fill="#fff"/><circle cx="-12" cy="-9" r="5.5" fill="${ecol(ec[0])}"/><circle cx="16" cy="-9" r="5.5" fill="${ecol(ec[1])}"/><path d="M-10,10 q10,8 20,0" stroke="#1b2540" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="-24" cy="38" rx="11" ry="6" fill="${bc}"/><ellipse cx="22" cy="38" rx="11" ry="6" fill="${bc}"/><text x="-40" y="-26" font-size="16" font-weight="800" fill="${c.sex === 'F' ? '#ff6b9a' : '#4fb0ff'}">${c.sex === 'F' ? '♀' : '♂'}</text>`;
    if (c.mut) g += `<text x="34" y="34" font-size="16">⚡</text>`;
    return g + '</g>';
  }
  /* the Punnett square for one gene */
  function punnett(m, d, k, x, y, w = 230) {
    const cs = w / 3, hm = m[k], hd = d[k];
    let g = `<g transform="translate(${x} ${y})"><rect width="${w}" height="${w + 26}" rx="10" fill="#0b1020" fill-opacity=".8"/><text x="${w / 2}" y="20" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">Punnett square: ${GENES[k].n.replace(' (X-linked)', '')}</text><g transform="translate(0 26)">`;
    g += `<text x="${cs / 2}" y="${cs / 2 + 4}" font-size="11" fill="#a9b6cc" text-anchor="middle">♀ \\ ♂</text>`;
    hd.forEach((a, i) => g += `<text x="${cs * (i + 1.5)}" y="${cs / 2 + 6}" font-size="18" font-weight="800" fill="#4fb0ff" text-anchor="middle">${a}</text>`);
    hm.forEach((a, j) => { g += `<text x="${cs / 2}" y="${cs * (j + 1.5) + 6}" font-size="18" font-weight="800" fill="#ff6b9a" text-anchor="middle">${a}</text>`;
      hd.forEach((b, i) => { const sex = b === 'Y' ? 'M' : 'F', al = k === 'glow' ? (b === 'Y' ? [a, 'Y'] : [a, b]) : [a, b], ph = GENES[k].ph(al, sex);
        g += `<rect x="${cs * (i + 1) + 3}" y="${cs * (j + 1) + 3}" width="${cs - 6}" height="${cs - 6}" rx="6" fill="#fff" fill-opacity=".1" stroke="#fff" stroke-opacity=".25"/><text x="${cs * (i + 1.5)}" y="${cs * (j + 1.5) - 2}" font-size="15" font-weight="800" fill="#fff" text-anchor="middle">${order(k, al).join('')}</text><text x="${cs * (i + 1.5)}" y="${cs * (j + 1.5) + 14}" font-size="9" fill="#a9b6cc" text-anchor="middle">${ph}</text>`; }); });
    return g + '</g></g>';
  }
  function results(kids, ex, fn, x, y, w = 270, title = 'Litter results') {
    const obs = tally(kids, fn), keys = [...new Set(Object.keys(ex).concat(Object.keys(obs)))], n = kids.length;
    let g = `<g transform="translate(${x} ${y})"><rect width="${w}" height="${44 + keys.length * 22}" rx="10" fill="#0b1020" fill-opacity=".8"/><text x="12" y="20" font-size="13" font-weight="700" fill="#fff">${title} (${n})</text><text x="${w - 12}" y="20" font-size="11" fill="#a9b6cc" text-anchor="end">observed · expected</text>`;
    keys.forEach((k, i) => { const o = obs[k] || 0, e = (ex[k] || 0) * 100; g += `<text x="12" y="${44 + i * 22}" font-size="12" fill="#d7dfee">${k}</text><text x="${w - 12}" y="${44 + i * 22}" font-size="12" font-weight="700" fill="#fff" text-anchor="end" style="font-family:var(--f-mono)">${n ? f(o / n * 100) : '–'} % · ${f(e)} %</text>`; });
    return g + '</g>';
  }
  function litter(kids, x, y, cols = 12, rows = 2, s = .42) { let g = ''; kids.slice(0, cols * rows).forEach((c, i) => g += draw(c, x + (i % cols) * (100 * s * 1.9) + 40 * s, y + Math.floor(i / cols) * 105 * s * 1.4 + 50 * s, s)); return g; }
  const bg = `<rect width="1000" height="620" fill="#183528"/><rect y="560" width="1000" height="60" fill="#22472f"/>${Array.from({ length: 14 }, (_, i) => `<circle cx="${i * 80 + 20}" cy="${590 + (i % 2) * 8}" r="${10 + (i % 3) * 4}" fill="#2c5a3a"/>`).join('')}`;

  /* ── the parent editor in the sheet: allele buttons for ♀ and ♂ ── */
  function editor(m, d, genes, onChange, lock) {
    const box = LabUI.html(''); box.className = 'pl-ctl';
    const row = k => `<div class="ga-row"><b>${GENES[k].n}</b><span>♀ ${[0, 1].map(i => `<button class="btn sm ga-a" data-p="m" data-k="${k}" data-i="${i}">${m[k][i]}</button>`).join('')}</span><span>♂ ${[0, 1].map(i => i === 1 && k === 'glow' ? '<button class="btn sm ga-a" disabled>Y</button>' : `<button class="btn sm ga-a" data-p="d" data-k="${k}" data-i="${i}">${d[k][i]}</button>`).join('')}</span></div>`;
    const draw = () => { box.innerHTML = `<style>.ga-row{display:grid;grid-template-columns:1fr auto auto;gap:6px;align-items:center;font-size:12.5px}.ga-a{min-width:34px;padding:4px 6px!important;font-family:var(--f-mono)}</style><div class="pl-lab">Parents’ alleles (tap to switch)</div>${genes.map(row).join('')}`;
      $$('[data-p]', box).forEach(b => b.onclick = () => { if (lock && lock(b.dataset.p, b.dataset.k)) { K.msg('That parent is fixed for this challenge.', 'bad', 1800); return; } const c = b.dataset.p === 'm' ? m : d, k = b.dataset.k, i = +b.dataset.i, al = GENES[k].al; c[k][i] = al[1 - al.indexOf(c[k][i])]; SND.tick(); draw(); onChange && onChange(k); }); };
    draw(); return { redraw: draw };
  }
  const allG = (o = {}) => Object.assign({ body: ['B', 'b'], horn: ['H', 'h'], spot: ['R', 'W'], eye: ['G', 'P'], glow: ['Xᴳ', 'Xᵍ'] }, o);

  /* ═════ Guided ═════ */
  const steps = [
    { id: 'build', name: 'Genotype', title: 'Design to order', html: 'A <b>genotype</b> is the pair of alleles; the <b>phenotype</b> is what you see. Build the ♀ creature for each order below (the ♂ doesn’t matter yet).', hint: 'Capital letters are dominant: one copy is enough to show the trait. Lowercase traits only show with two copies.' },
    { id: 'punnett', name: 'Probability', title: 'Predict, then breed', html: 'Both parents are <b>Bb</b> (blue). Use the Punnett square to <b>predict the % of orange babies</b>. Then breed a litter of <b>8</b> and a litter of <b>400</b>.', hint: 'Count the bb boxes out of 4.' },
    { id: 'blend', name: 'Incomplete dominance', title: 'Pink from red and white', html: 'Spot color shows <b>incomplete dominance</b>. Breed <b>RR × WW</b>, then breed two of their babies (<b>RW × RW</b>).', hint: 'Set the spot alleles of both parents, breed, then switch both parents to RW.' },
    { id: 'xlink', name: 'Sex-linked', title: 'The glowing sons', html: 'Tail glow is on the <b>X chromosome</b> and recessive. Breed a <b>carrier mother (XᴳXᵍ)</b> with a <b>plain father (XᴳY)</b> in a litter of 200, and compare sons and daughters.', hint: 'The mother’s glow alleles: one Xᴳ and one Xᵍ. The father has Xᴳ.' },
    { id: 'mut', name: 'Mutation', title: 'Something new', html: 'Both parents are <b>bb</b> (orange), so no blue babies are possible… unless a <b>mutation</b> happens in an egg or sperm. Turn up the mutation rate and breed until a <b>blue baby</b> appears.', hint: 'Set the mutation rate to 5 % and breed litters of 100.' }
  ];
  function lab(R, m, d, cfg) {
    const st = { n: cfg.n || 20, mu: 0 }; let kids = [];
    const ed = editor(m, d, cfg.genes, () => { kids = []; cfg.change && cfg.change(); }, cfg.lock);
    const items = [{ k: 'n', label: 'Litter size', min: 4, max: 400, step: 4, fmt: v => v + ' babies' }];
    if (cfg.mut) items.push({ k: 'mu', label: 'Mutation rate', min: 0, max: 5, step: .5, fmt: v => v + ' % per allele' });
    SimLab.panel(st, items.concat([{ btns: [{ id: 'br', label: '💞 Breed', cls: 'primary', fn: () => { kids = Array.from({ length: st.n }, () => child(m, d, st.mu / 100)); SND.pop(); cfg.bred && cfg.bred(kids, st); } }] }]));
    SimLab.stage(bg, g => { const k = cfg.focus();
      g.innerHTML = `<g transform="translate(20 20)"><rect width="440" height="230" rx="14" fill="#0b1020" fill-opacity=".35"/>${draw(m, 110, 120, 1.2)}${draw(d, 330, 120, 1.2)}
          <text x="110" y="214" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${IDS.map(x => gtxt(m, x)).join(' ')}</text><text x="330" y="214" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${IDS.map(x => gtxt(d, x)).join(' ')}</text><text x="220" y="124" font-size="26" fill="#fff" text-anchor="middle">×</text></g>
        ${punnett(m, d, k, 480, 20, 230)}${results(kids, cfg.ex ? cfg.ex() : expect(m, d, k), cfg.fn || (c => phen(c, k)), 724, 20, 262)}
        ${kids.length ? litter(kids, 30, 300, 10, 3, .5) : `<text x="500" y="420" font-size="18" fill="#cfe7d6" text-anchor="middle">Press Breed to make a litter</text>`}${cfg.extra ? cfg.extra(kids) : ''}`; });
    return { st, kids: () => kids, ed };
  }
  const S = {
    build: R => { const m = blorb('F', allG({ body: ['b', 'b'], horn: ['h', 'h'], spot: ['W', 'W'], eye: ['G', 'G'], glow: ['Xᴳ', 'Xᴳ'] })), d = blorb('M', allG());
      const orders = [['Blue, but carries the orange allele (heterozygous)', c => gtxt(c, 'body') === 'Bb'], ['Horned and homozygous for horns', c => gtxt(c, 'horn') === 'HH'], ['Pink spots', c => phen(c, 'spot') === 'pink spots'], ['One green eye and one purple eye', c => phen(c, 'eye') === 'green + purple eyes']];
      lab(R, m, d, { genes: ['body', 'horn', 'spot', 'eye'], focus: () => 'body', change: () => G.check(), lock: p => p === 'd' });
      const G = SimLab.goals(R, { name: 'Genotype', items: () => orders.map(([t, fn]) => [fn(m), t]),
        q: { q: 'Two blue creatures, one BB and one Bb, look exactly the same. Why?', a: ['B is dominant, so one copy is enough to make the body blue', 'The b allele was deleted', 'Body color isn’t genetic', 'Bb creatures are always half blue'], c: 0, e: 'With complete dominance, the <b>dominant allele</b> hides the recessive one. Same phenotype (blue), different genotypes (BB, Bb). Only a cross can reveal which is which.' } });
      const o = G.check; G.check = () => { o(); if (orders.every(([, fn]) => fn(m)) && !G._n) { G._n = 1; XLab.note(`Built a ♀ with genotype ${IDS.slice(0, 4).map(x => gtxt(m, x)).join(' ')}.`); } }; },
    punnett: R => { const m = blorb('F', allG({ body: ['B', 'b'] })), d = blorb('M', allG({ body: ['B', 'b'] })); let pred = null, small = false, big = false, res = {};
      LabUI.html(XLab.numIn('gPred', 'Predicted orange babies', '%', 'e.g. 50'));
      $('#gPredB').onclick = () => { const v = +$('#gPred').value; if (!$('#gPred').value) return; pred = v; if (Math.abs(v - 25) <= 1) { K.msg('Right: 1 of 4 boxes is bb, so 25 %.', 'ok', 2600); } else { R.mistake('Punnett prediction', 'Bb × Bb gives BB, Bb, Bb, bb: 1 in 4 (25 %) are orange.'); K.msg('Count the bb boxes in the Punnett square. Try again.', 'bad', 3000); pred = null; } G.check(); };
      lab(R, m, d, { genes: ['body'], focus: () => 'body', lock: () => true, n: 8, bred: (kids, st) => { const o = kids.filter(c => phen(c, 'body') === 'orange').length / kids.length * 100; res[st.n] = o; if (st.n <= 12) small = true; if (st.n >= 400) big = true; XLab.note(`Litter of ${st.n}: ${f(o)} % orange (expected 25 %).`); G.check(); } });
      const G = SimLab.goals(R, { name: 'Probability', items: () => [[pred != null, 'Predict % orange'], [small, 'Breed a litter of 8 (or fewer than 12)'], [big, 'Breed a litter of 400']],
        q: { q: 'Which litter came closer to 25 % orange, and why?', a: ['The big litter: chance differences even out with a larger sample', 'The small litter: fewer babies are more accurate', 'Both are always exactly 25 %', 'Neither: Punnett squares are wrong'], c: 0, e: 'A Punnett square gives <b>probabilities</b>. Each baby is a separate coin-toss, so a litter of 8 can easily be 0 % or 50 % orange. With hundreds of babies, the result gets close to the expected 25 % (the law of large numbers).' } }); },
    blend: R => { const m = blorb('F', allG({ spot: ['R', 'R'] })), d = blorb('M', allG({ spot: ['R', 'R'] })); let f1 = false, f2 = false;
      lab(R, m, d, { genes: ['spot'], focus: () => 'spot', n: 40, bred: () => { const a = gtxt(m, 'spot'), b = gtxt(d, 'spot'); if ((a === 'RR' && b === 'WW') || (a === 'WW' && b === 'RR')) { f1 = true; XLab.note('RR × WW: all babies pink (RW).'); } if (a === 'RW' && b === 'RW') { f2 = true; XLab.note('RW × RW: about 1 red : 2 pink : 1 white.'); } G.check(); } });
      const G = SimLab.goals(R, { name: 'Incomplete dominance', items: () => [[f1, 'Breed RR × WW'], [f2, 'Breed RW × RW']],
        q: { q: 'Pink × pink gave red, pink and white babies. What does this show?', a: ['The red and white alleles were not blended away; they separate again in the gametes', 'Pink is a new allele', 'The white allele is dominant', 'Mutations happened'], c: 0, e: 'In <b>incomplete dominance</b> the heterozygote (RW) shows an in-between phenotype. The alleles stay separate and are passed on unchanged, so RW × RW gives 1 RR : 2 RW : 1 WW, the same 1:2:1 genotype ratio as any monohybrid cross.' } }); },
    xlink: R => { const m = blorb('F', allG({ glow: ['Xᴳ', 'Xᴳ'] })), d = blorb('M', allG({ glow: ['Xᴳ', 'Xᴳ'] })); let ok = false;
      const bySex = c => `${c.sex === 'M' ? 'son' : 'daughter'}, ${phen(c, 'glow')}`;
      lab(R, m, d, { genes: ['glow'], focus: () => 'glow', n: 200, fn: bySex, ex: () => { const o = {}; m.glow.forEach(a => d.glow.forEach(b => { const c = { sex: b === 'Y' ? 'M' : 'F', glow: b === 'Y' ? [a, 'Y'] : [a, b] }; const k = bySex(c); o[k] = (o[k] || 0) + .25; })); return o; },
        bred: (kids, st) => { if (gtxt(m, 'glow') === 'XᴳXᵍ' && gtxt(d, 'glow') === 'XᴳY' && st.n >= 100) { ok = true; const sons = kids.filter(c => c.sex === 'M'); XLab.note(`Carrier ♀ × plain ♂ (${st.n}): ${f(sons.filter(c => phen(c, 'glow') === 'glowing tail').length / Math.max(1, sons.length) * 100)} % of sons glowed, 0 % of daughters.`); } G.check(); } });
      const G = SimLab.goals(R, { name: 'Sex-linked', items: () => [[ok, 'Breed XᴳXᵍ × XᴳY with a litter of 100 or more']],
        q: { q: 'Why did only sons glow?', a: ['Sons get their only X from their mother, so one Xᵍ is enough; daughters also get the father’s Xᴳ', 'The glow gene is on the Y chromosome', 'Daughters are immune to mutations', 'Glowing is dominant in males only'], c: 0, e: 'A son gets his <b>X from his mother</b> and his Y from his father, so half the sons of a carrier mother get Xᵍ and glow. Every daughter gets the father’s Xᴳ, so she can be a carrier but not glow. This is why X-linked recessive conditions like color blindness are more common in males.' } }); },
    mut: R => { const m = blorb('F', allG({ body: ['b', 'b'] })), d = blorb('M', allG({ body: ['b', 'b'] })); let seen = false, tries = 0;
      const L = lab(R, m, d, { genes: ['body'], focus: () => 'body', lock: () => true, mut: true, n: 100, bred: (kids, st) => { tries++; if (kids.some(c => phen(c, 'body') === 'blue')) { if (!seen) { seen = true; XLab.note(`At a mutation rate of ${st.mu} %, ${kids.filter(c => phen(c, 'body') === 'blue').length} of ${st.n} babies were blue.`); K.msg('A blue baby! A b → B mutation happened in an egg or sperm (⚡).', 'ok', 3800); } } else if (st.mu === 0 && tries > 1) K.msg('With a mutation rate of 0, bb × bb can only make bb.', 'bad', 3000); G.check(); } });
      const G = SimLab.goals(R, { name: 'Mutation', items: () => [[seen, 'Get a blue baby from two orange parents']],
        q: { q: 'For a mutation to be passed on to offspring, it must happen in…', a: ['Cells that make gametes (eggs or sperm)', 'Any skin cell', 'Muscle cells', 'Red blood cells'], c: 0, e: 'Only mutations in the <b>germ line</b> (cells that make eggs and sperm) are inherited. Mutations are a source of new alleles, and so of new variation for natural selection to act on.' } }); void L; }
  };
  const quiz = [
    { q: 'Hh × hh. What fraction of offspring are expected to have no horns?', a: ['1/2', '1/4', '3/4', '0'], c: 0, e: 'The Hh parent gives H or h; the hh parent always gives h: Hh, Hh, hh, hh. Half are hh.' },
    { q: 'A dihybrid cross BbHh × BbHh gives which phenotype ratio?', a: ['9 : 3 : 3 : 1', '3 : 1', '1 : 2 : 1', '1 : 1 : 1 : 1'], c: 0, e: 'Genes on different chromosomes assort independently: (3:1) × (3:1) = 9:3:3:1.' },
    { q: 'A test cross (with a homozygous recessive) gives some recessive-looking offspring. The tested parent must be…', a: ['Heterozygous', 'Homozygous dominant', 'Homozygous recessive', 'A mutant'], c: 0, e: 'A homozygous dominant parent can only pass on the dominant allele. Any recessive offspring prove the parent carries a recessive allele.' },
    { q: 'Human blood type AB (both A and B antigens fully shown) is an example of…', a: ['Codominance', 'Incomplete dominance', 'Sex linkage', 'Complete dominance'], c: 0, e: 'In codominance both alleles are fully expressed, like the green + purple eyes of a GP blorb.' },
    { q: 'Which process makes each gamete get only one allele of each gene?', a: ['Meiosis (segregation of homologous chromosomes)', 'Mitosis', 'Fertilization', 'Transcription'], c: 0, e: 'In meiosis homologous chromosomes separate, so each gamete gets one allele per gene: Mendel’s law of segregation.' }
  ];

  /* ═════ Free Investigation ═════ */
  const free = {
    intro: 'Set both parents’ alleles, choose which trait to study, and breed. Each litter is recorded with its observed and expected percentages.',
    fresh: () => ({ n: 20, mu: 0, focus: 'body' }),
    vars: [{ k: 'n', label: 'Litter size', min: 4, max: 1000, step: 4, unit: 'babies', d: 0, fmt: v => v + ' babies' }, { k: 'mu', label: 'Mutation rate', short: 'Mut. rate', min: 0, max: 5, step: .5, unit: '%', d: 1, fmt: v => v + ' %' }],
    cats: [{ k: 'focus', label: 'Trait to study', opts: [['body', 'Body'], ['horn', 'Horns'], ['spot', 'Spots'], ['eye', 'Eyes'], ['glow', 'Glow']] }],
    measures: [{ k: 'obs', label: '% with the first phenotype', short: 'Observed', unit: '%', d: 1 }, { k: 'exp', label: 'Expected % (Punnett)', short: 'Expected', unit: '%', d: 1 }, { k: 'dev', label: 'Difference from expected', short: 'Difference', unit: '% pts', d: 1 }, { k: 'mut', label: 'Babies with a mutation', short: 'Mutants', unit: '%', d: 1 }, { k: 'ph', label: 'Phenotype counted', text: true }, { k: 'cross', label: 'Cross', text: true }],
    noRecord: true,
    ideas: [['How does litter size affect how close results are to the Punnett square?', 'n', 'dev'], ['How does the mutation rate affect the number of mutant babies?', 'mu', 'mut']],
    expect(x, y) {
      if (x === 'n' && y === 'dev') return { t: 'levelsdown', why: 'Each baby is an independent chance event. Small litters often land far from the expected ratio; as the sample grows, the observed % gets closer to the Punnett square prediction (the difference shrinks roughly as 1/√n). Repeat each litter size a few times: the spread is the point.' };
      if (x === 'mu' && y === 'mut') return { t: 'up', why: 'Each baby inherits 10 alleles (5 genes × 2 parents). The chance that at least one mutated is about 10 × the mutation rate when it is small, so mutants rise in proportion to the rate.' };
      if (x === 'n') return { t: 'flat', why: 'Litter size doesn’t change the probabilities, only how closely a litter matches them.' };
      return null;
    },
    setup(F) {
      const m = blorb('F', allG()), d = blorb('M', allG()); let kids = [];
      editor(m, d, IDS, () => { kids = []; });
      F.onChange(() => { kids = []; });
      const b = LabUI.html('<div class="row sim-btns"><button class="btn sm primary" id="gBr">💞 Breed and record</button></div>');
      $('#gBr', b).onclick = () => { const k = F.st.focus; kids = Array.from({ length: F.st.n }, () => child(m, d, F.st.mu / 100)); const ex = expect(m, d, k), first = Object.keys(ex).sort()[0], obs = kids.filter(c => phen(c, k) === first).length / kids.length * 100;
        F.add({ obs, exp: ex[first] * 100, dev: Math.abs(obs - ex[first] * 100), mut: kids.filter(c => c.mut).length / kids.length * 100, ph: first, cross: `${gtxt(m, k)} × ${gtxt(d, k)}` }); SND.pop(); };
      SimLab.stage(bg, g => { const k = F.st.focus; g.innerHTML = `<g transform="translate(20 20)"><rect width="440" height="230" rx="14" fill="#0b1020" fill-opacity=".35"/>${draw(m, 110, 120, 1.2)}${draw(d, 330, 120, 1.2)}<text x="110" y="214" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${IDS.map(x => gtxt(m, x)).join(' ')}</text><text x="330" y="214" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">${IDS.map(x => gtxt(d, x)).join(' ')}</text><text x="220" y="124" font-size="26" fill="#fff" text-anchor="middle">×</text></g>
        ${punnett(m, d, k, 480, 20, 230)}${results(kids, expect(m, d, k), c => phen(c, k), 724, 20, 262)}${kids.length ? litter(kids, 30, 300, 10, 3, .5) : ''}`; });
    }
  };

  /* ═════ Game: Breeder’s Guild. Fill orders by choosing parents from the stable ═════ */
  function stableLevel(G, o) {
    const pure = { body: ['B', 'B'], horn: ['H', 'H'], spot: ['W', 'W'], eye: ['G', 'G'], glow: ['Xᴳ', 'Xᴳ'] }, stable = o.stable.map(([sex, g, hide], i) => Object.assign(blorb(sex, Object.assign({}, pure, g)), { id: i, hide })); let mom = null, dad = null, kids = [], breeds = 0, guessed = false;
    const box = LabUI.html('');
    const render = () => { box.innerHTML = `<div class="pl-lab">Your stable (tap to choose parents)</div><div class="sim-pick">${stable.map(c => `<button class="btn sm ${c === mom || c === dad ? 'on' : ''}" data-cr="${c.id}">${c.sex === 'F' ? '♀' : '♂'} ${c.hide ? '???' : IDS.filter(k => o.genes.includes(k)).map(k => gtxt(c, k)).join(' ')}</button>`).join('')}</div>
      <div class="row sim-btns"><button class="btn sm primary" id="gbB" ${mom && dad ? '' : 'disabled'}>💞 Breed a litter of ${o.n} (−${o.cost} coins)</button></div>${o.ask ? `<div class="pl-pred"><label>${o.ask.q}</label><div class="sim-pick">${o.ask.a.map((a, i) => `<button class="btn sm" data-ga="${i}">${a}</button>`).join('')}</div></div>` : ''}`;
      $$('[data-cr]', box).forEach(b => b.onclick = () => { const c = stable[+b.dataset.cr]; if (c.sex === 'F') mom = c; else dad = c; kids = []; SND.tick(); render(); });
      const bb = $('#gbB', box); if (bb) bb.onclick = () => { breeds++; kids = Array.from({ length: o.n }, () => child(mom, dad, 0)); SND.pop(); const sc = o.score(kids, mom, dad); if (sc != null && !o.ask) { const st3 = sc.stars - (breeds > o.par ? 1 : 0); G.win(Math.max(1, st3), 1000 - breeds * 100 + sc.bonus, sc.msg); } else if (breeds >= o.max && !o.ask) G.lose('Out of tries', o.fail); render(); };
      $$('[data-ga]', box).forEach(b => b.onclick = () => { if (guessed) return; if (!breeds) { K.msg('Breed at least one litter first: collect evidence before you decide.', 'bad', 2600); return; } guessed = true; const i = +b.dataset.ga; if (i === o.ask.c(stable)) G.win(breeds <= 1 ? 3 : breeds <= 2 ? 2 : 1, 1200 - breeds * 150, o.ask.ok); else G.lose('Wrong call', o.ask.why); }); };
    render();
    SimLab.stage(bg, g => { const k = o.focus; g.innerHTML = `${stable.map((c, i) => draw(c, 80 + i * 150, 110, .9, { dim: !(c === mom || c === dad) && (mom || dad) })).join('')}${stable.map((c, i) => `<text x="${80 + i * 150}" y="180" font-size="13" font-weight="800" fill="#fff" text-anchor="middle">${c.hide ? '? ? ?' : IDS.filter(x => o.genes.includes(x)).map(x => gtxt(c, x)).join(' ')}</text>`).join('')}
      ${mom && dad && !o.hidePunnett ? punnett(mom, dad, k, 740, 210, 220) : ''}${kids.length ? litter(kids, 30, 290, 7, 2, .5) + results(kids, mom && dad && !o.hideExpected ? expect(mom, dad, k) : {}, o.fn || (c => phen(c, k)), 30, 470, 300, 'Last litter') : ''}
      <g transform="translate(500 588)"><rect x="-220" y="-20" width="440" height="30" rx="15" fill="#0b1020" fill-opacity=".8"/><text y="1" font-size="14" font-weight="800" fill="#ffd27a" text-anchor="middle">Litters bred: ${breeds}${o.par ? ` · par ${o.par}` : ''}</text></g>`; });
  }
  const game = {
    title: 'Breeder’s Guild', intro: 'Customers want creatures with exact traits. Pick parents from your stable and breed as few litters as possible.',
    cover: () => `${bg}${labThumb('genetics').replace('<svg', '<svg x="200" y="60" width="600" height="360"')}<text x="500" y="500" font-size="40" font-weight="800" fill="#fff" text-anchor="middle">Breeder’s Guild</text><text x="500" y="540" font-size="18" fill="#cfe7d6" text-anchor="middle">Pick a level in the lab sheet →</text>`,
    levels: [
      { name: 'All pink', goal: 'A customer wants a litter where <b>every baby has pink spots</b>.', hint: 'Pink is the heterozygote (RW). Which cross makes RW every time?', setup: G => stableLevel(G, { genes: ['spot'], focus: 'spot', n: 12, cost: 10, par: 1, max: 4, stable: [['F', { spot: ['R', 'W'] }], ['F', { spot: ['R', 'R'] }], ['M', { spot: ['R', 'W'] }], ['M', { spot: ['W', 'W'] }], ['F', { spot: ['W', 'W'] }]],
        score: k => k.every(c => phen(c, 'spot') === 'pink spots') ? { stars: 3, bonus: 0, msg: 'RR × WW: every baby gets one R and one W.' } : null, fail: 'Only RR × WW (homozygous × the other homozygous) gives 100 % RW pink babies.' }) },
      { name: 'Mystery horns', goal: 'This horned ♀ has an unknown genotype. Breed her as few times as possible, then decide: <b>HH or Hh</b>?', hint: 'Do a test cross with a hornless (hh) male. Any hornless baby means she carries h.', setup: G => { const het = Math.random() < .6; stableLevel(G, { genes: ['horn'], focus: 'horn', n: 10, cost: 10, hidePunnett: true, hideExpected: true, stable: [['F', { horn: het ? ['H', 'h'] : ['H', 'H'] }, true], ['M', { horn: ['H', 'H'] }], ['M', { horn: ['h', 'h'] }], ['M', { horn: ['H', 'h'] }]],
        score: () => null, ask: { q: 'Your verdict on the mystery ♀', a: ['HH', 'Hh'], c: s => gtxt(s[0], 'horn') === 'Hh' ? 1 : 0, ok: 'Correct! A test cross with hh reveals hidden recessive alleles.', why: 'Breed her with the hh male. HH × hh gives only horned (Hh) babies; Hh × hh gives about half hornless. One hornless baby proves she is Hh. (With 10 babies from HH × hh, you can be fairly sure she is HH.)' } }); } },
      { name: 'Glowing daughters', goal: 'A collector wants <b>glowing daughters</b>. Breed a litter where at least one daughter glows.', hint: 'A daughter glows only with two Xᵍ: one from her mother AND the father’s only X.', setup: G => stableLevel(G, { genes: ['glow'], focus: 'glow', n: 12, cost: 10, par: 1, max: 4, fn: c => `${c.sex === 'M' ? 'son' : 'daughter'}, ${phen(c, 'glow')}`, stable: [['F', { glow: ['Xᴳ', 'Xᵍ'] }], ['F', { glow: ['Xᴳ', 'Xᴳ'] }], ['M', { glow: ['Xᴳ', 'Xᴳ'] }], ['M', { glow: ['Xᵍ', 'Xᵍ'] }]],
        score: k => k.some(c => c.sex === 'F' && phen(c, 'glow') === 'glowing tail') ? { stars: 3, bonus: 0, msg: 'XᴳXᵍ × XᵍY: half the daughters get Xᵍ from mom and Xᵍ from dad.' } : null, fail: 'The father must be a glowing male (XᵍY), and the mother must carry Xᵍ (XᴳXᵍ).' }) },
      { name: 'Designer order', goal: 'Breed a litter with an <b>orange, hornless</b> baby. Only these creatures are available, and every litter costs.', hint: 'Orange (bb) and hornless (hh) are both recessive. Choose parents that carry b AND h.', setup: G => stableLevel(G, { genes: ['body', 'horn'], focus: 'body', n: 8, cost: 15, par: 2, max: 5, fn: c => `${phen(c, 'body')}, ${phen(c, 'horn')}`, stable: [['F', { body: ['B', 'B'], horn: ['H', 'h'] }], ['F', { body: ['B', 'b'], horn: ['H', 'h'] }], ['M', { body: ['B', 'b'], horn: ['H', 'H'] }], ['M', { body: ['B', 'b'], horn: ['H', 'h'] }], ['M', { body: ['b', 'b'], horn: ['h', 'h'] }]],
        score: (k, m, d) => k.some(c => phen(c, 'body') === 'orange' && phen(c, 'horn') === 'no horns') ? { stars: gtxt(d, 'body') === 'bb' ? 3 : 2, bonus: 0, msg: gtxt(d, 'body') === 'bb' ? 'BbHh × bbhh: 1/4 of babies are bbhh. The best cross available.' : 'BbHh × BbHh works (1/16), but BbHh × bbhh gives 1/4.' } : null, fail: 'Both parents must carry b and h. The best is BbHh × bbhh: a 1 in 4 chance per baby.' }) }
    ]
  };
  const finale = () => { SimLab.stage(bg, g => { const k = Array.from({ length: 24 }, () => child(blorb('F', allG()), blorb('M', allG()), 0)); g.innerHTML = litter(k, 40, 120, 8, 3, .9); }); };
  XLab.define({ id: 'genetics', guided: { steps, S, quiz, finale: () => { const kids = Array.from({ length: 24 }, () => child(blorb('F', allG()), blorb('M', allG()), 0)); SimLab.stage(bg, g => { g.innerHTML = litter(kids, 40, 120, 8, 3, .9); }); }, finaleMsg: 'What a litter! Now check your thinking.', summary: () => 'You linked genotype to phenotype, used Punnett squares to predict and tested them with litters, saw incomplete dominance and X-linked inheritance, and made new alleles by mutation.' }, free, game });
  void finale;
})();
