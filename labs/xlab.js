/* ═══════════ Educator Space · the engine for the interactive labs in /labs/ (loaded when a lab is first opened) ═══════════
   Every lab here runs on the same lab player as the labs in index.html (Kit, SimLab, makeLab) and has three modes:
     Guided Experiment   step-by-step challenges with predictions and instant feedback, a short quiz, and results
                         (sent to the teacher in a class, exactly like the other labs)
     Free Investigation  the student's own experiment: change variables, record data, graph any variable against
                         another, test a written prediction against the data, check it was a fair test,
                         write a claim–evidence–reasoning conclusion, and download a report (HTML/PDF) or the data (CSV)
     Game Challenge      levels with points and stars; best scores are kept in this browser
   A lab file calls XLab.define({ id, guided, free, game }) — see define() at the bottom for what each part holds. */
const XLab = (() => {
  const K = Kit, f = SimLab.f;
  const MODES = { guided: 'Guided Experiment', free: 'Free Investigation', game: 'Game Challenge' };
  const metaOf = id => LABS.find(l => l.id === id);

  /* ── styles for the parts this file adds (the lab player's own styles are in index.html) ── */
  if (!document.getElementById('xlCss')) { const s = document.createElement('style'); s.id = 'xlCss'; s.textContent = `
.xl-sec { display: grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 10px; }
.xl-sec > .pl-lab { margin-bottom: -2px; }
.xl-row { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: center; font-size: 13px; }
.xl-row select { width: auto; flex: 0 1 auto; }
.xl-row select, .xl-in select, .xl-cer textarea, .xl-q input { font: inherit; font-size: 13px; padding: 5px 7px; border: 1px solid var(--line); border-radius: 8px; background: var(--panel); color: var(--ink); max-width: 100%; }
.xl-cer { display: grid; gap: 6px; }
.xl-cer label { display: grid; gap: 3px; font-size: 12.5px; font-weight: 650; color: var(--muted); }
.xl-cer textarea { min-height: 52px; resize: vertical; font-size: 13px; line-height: 1.4; }
.xl-q input { width: 100%; }
.xl-tbl-w { max-height: 190px; overflow: auto; border: 1px solid var(--line); border-radius: 8px; }
.xl-tbl { width: 100%; border-collapse: collapse; font-size: 12px; font-family: var(--f-mono); }
.xl-tbl th, .xl-tbl td { padding: 4px 6px; border-bottom: 1px solid var(--line); text-align: right; white-space: nowrap; }
.xl-tbl th { position: sticky; top: 0; background: var(--panel-2); color: var(--muted); font-family: var(--f-body, inherit); font-weight: 650; font-size: 11.5px; text-align: right; }
.xl-tbl td:first-child, .xl-tbl th:first-child { text-align: left; }
.xl-tbl button { border: 0; background: none; color: var(--muted); cursor: pointer; font-size: 14px; padding: 0 2px; }
.xl-graph svg { width: 100%; height: auto; display: block; }
.xl-graph .ax { stroke: var(--muted); stroke-opacity: .55; }
.xl-graph .gr { stroke: var(--line); }
.xl-graph text { fill: var(--muted); font-size: 10.5px; font-family: var(--f-mono); }
.xl-graph .lab { fill: var(--ink); font-family: var(--f-body, inherit); font-weight: 650; font-size: 11.5px; }
.xl-fb { font-size: 13px; border-radius: 9px; padding: 9px 11px; background: var(--panel-2); line-height: 1.45; }
.xl-fb.ok { background: var(--ok-soft); } .xl-fb.bad { background: var(--warn-soft); }
.xl-fb b { color: var(--ink); }
.xl-ideas { display: grid; gap: 4px; }
.xl-ideas button { text-align: left; font-size: 12.5px; border: 1px dashed var(--line); background: none; color: var(--ink); border-radius: 8px; padding: 6px 8px; cursor: pointer; }
.xl-ideas button:hover { border-color: var(--accent); }
.xl-score { display: flex; gap: 8px; flex-wrap: wrap; }
.xl-lv { display: grid; gap: 6px; }
.xl-lvb { display: grid; grid-template-columns: 26px 1fr auto; gap: 8px; align-items: center; text-align: left; border: 1px solid var(--line); background: var(--panel-2); border-radius: 10px; padding: 8px 10px; cursor: pointer; color: var(--ink); font: inherit; }
.xl-lvb:hover:not([disabled]) { border-color: var(--accent); }
.xl-lvb[disabled] { opacity: .5; cursor: not-allowed; }
.xl-lvb .n { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: var(--accent-ink); font-weight: 800; font-size: 13px; }
.xl-lvb small { display: block; color: var(--muted); font-size: 12px; }
.xl-st { color: #e0a21b; letter-spacing: 1px; font-size: 15px; white-space: nowrap; }
.xl-st i { color: var(--line); font-style: normal; }
.xl-modes { display: grid; gap: 8px; }
.xl-mb { display: grid; grid-template-columns: 34px 1fr; gap: 10px; align-items: center; text-align: left; border: 1px solid var(--line); background: var(--panel); border-radius: 12px; padding: 10px 12px; cursor: pointer; color: var(--ink); font: inherit; }
.xl-mb:hover, .xl-mb.on { border-color: var(--accent); background: var(--accent-soft); }
.xl-mb .ic { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--accent); color: var(--accent-ink); }
.xl-mb .ic svg { width: 19px; height: 19px; }
.xl-mb small { display: block; color: var(--muted); font-size: 12.5px; }
.xl-tag { font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 99px; background: var(--ok-soft); color: var(--ok); margin-left: 6px; }
.lab-top #xMode { white-space: nowrap; }
.xl-load { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(8, 20, 36, .35); z-index: 90; }
.xl-load div { background: var(--panel); color: var(--ink); padding: 16px 22px; border-radius: 14px; font-weight: 650; box-shadow: var(--shadow); }
`; document.head.appendChild(s); }

  /* ── a canvas under the stage's SVG, for labs with many moving particles (the SVG stays on top for readouts) ── */
  function cv() {
    let c = document.getElementById('xCv');
    if (!c || !c.isConnected) { c = document.createElement('canvas'); c.id = 'xCv'; c.width = 2000; c.height = 1240; K.stage.insertBefore(c, K.svg); }
    const g = c.getContext('2d'); g.setTransform(2, 0, 0, 2, 0, 0); return g;
  }
  function cvClear() { const c = document.getElementById('xCv'); if (c) { const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); } }

  /* ── numbers ── */
  const fmt = (v, d) => v == null || v === '' || !isFinite(v) ? '—' : (d == null ? (Math.abs(v) >= 100 ? f(v, 0) : Math.abs(v) >= 10 ? f(v, 1) : f(v, 2)) : f(v, d));
  function niceTicks(lo, hi, n = 5) {
    if (!(hi > lo)) { hi = lo + 1; lo = lo - (lo === 0 ? 0 : 1); }
    const span = hi - lo, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw)), st = [1, 2, 2.5, 5, 10].map(x => x * mag).find(x => span / x <= n) || 10 * mag;
    const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st, t = []; for (let v = a; v <= b + st * .001; v += st) t.push(+v.toPrecision(10));
    return { lo: a, hi: b, t };
  }
  function fit(pts) { const n = pts.length; if (n < 2) return null; let sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0; pts.forEach(([x, y]) => { sx += x; sy += y; sxx += x * x; sxy += x * y; syy += y * y; });
    const d = n * sxx - sx * sx; if (Math.abs(d) < 1e-12) return null; const m = (n * sxy - sx * sy) / d, b = (sy - m * sx) / n, vy = n * syy - sy * sy, r = vy > 1e-12 ? (n * sxy - sx * sy) / Math.sqrt(d * vy) : 0; return { m, b, r2: r * r, r }; }
  /* the shape of the data: up, down, levels (rises then levels off), peak (rises then falls), valley, flat. null = not enough data */
  function trend(pts) {
    const byX = new Map(); pts.forEach(([x, y]) => { if (!isFinite(x) || !isFinite(y)) return; const a = byX.get(x) || []; a.push(y); byX.set(x, a); });
    const P = [...byX].map(([x, ys]) => [x, ys.reduce((a, b) => a + b, 0) / ys.length]).sort((a, b) => a[0] - b[0]); if (P.length < 3) return null;
    const ys = P.map(p => p[1]), lo = Math.min(...ys), hi = Math.max(...ys), rng = hi - lo, scale = Math.max(Math.abs(hi), Math.abs(lo), 1e-9);
    if (rng <= .06 * scale || rng < 1e-9) return 'flat';
    const iM = ys.indexOf(hi), im = ys.indexOf(lo), n = ys.length;
    if (iM > 0 && iM < n - 1 && hi - ys[0] > .2 * rng && hi - ys[n - 1] > .2 * rng) return 'peak';
    if (im > 0 && im < n - 1 && ys[0] - lo > .2 * rng && ys[n - 1] - lo > .2 * rng) return 'valley';
    const F = fit(P); if (!F || Math.abs(F.r) < .5) return 'flat';
    if (F.m > 0 && n >= 4) { const h = Math.floor(n / 2), a = (ys[h] - ys[0]) / (P[h][0] - P[0][0]), b = (ys[n - 1] - ys[h]) / (P[n - 1][0] - P[h][0]); if (a > 0 && b < .3 * a && ys[n - 1] - ys[h] < .25 * rng) return 'levels'; }
    if (F.m < 0 && n >= 4) { const h = Math.floor(n / 2), a = (ys[h] - ys[0]) / (P[h][0] - P[0][0]), b = (ys[n - 1] - ys[h]) / (P[n - 1][0] - P[h][0]); if (a < 0 && b > .3 * a && ys[h] - ys[n - 1] < .25 * rng) return 'levelsdown'; }
    return F.m > 0 ? 'up' : 'down';
  }
  const TREND = { up: 'increases', down: 'decreases', levels: 'increases, then levels off', levelsdown: 'decreases, then levels off', peak: 'rises to a peak, then falls', valley: 'falls, then rises again', flat: 'stays about the same' };
  const PRED = [['up', 'increase'], ['down', 'decrease'], ['levels', 'increase, then level off'], ['peak', 'rise to a peak, then fall'], ['flat', 'stay about the same']];
  /* how close a prediction is to what the data showed: 2 = right, 1 = partly right, 0 = wrong */
  const match = (p, t) => p === t ? 2 : (p === 'up' && t === 'levels') || (p === 'levels' && t === 'up') || (p === 'down' && t === 'levelsdown') ? 1 : 0;

  /* ── a graph as SVG. cols are {k, label, unit}. opt: { w, h, fit, color, theme: 'print' } ── */
  function graph(rows, xc, yc, opt = {}) {
    const W = opt.w || 320, H = opt.h || 210, L = 46, B = 34, T = 10, R = 12, pw = W - L - R, ph = H - T - B, pr = opt.theme === 'print';
    const pts = rows.map(r => [+r[xc.k], +r[yc.k]]).filter(p => isFinite(p[0]) && isFinite(p[1]));
    const xl = `${xc.label}${xc.unit ? ` (${xc.unit})` : ''}`, yl = `${yc.label}${yc.unit ? ` (${yc.unit})` : ''}`;
    const ax = pr ? 'stroke="#8a97a8"' : 'class="ax"', gr = pr ? 'stroke="#e3e8ef"' : 'class="gr"', tx = pr ? 'fill="#55677d" font-size="10.5" font-family="monospace"' : '', lb = pr ? 'fill="#0f2238" font-size="11.5" font-weight="600" font-family="sans-serif"' : 'class="lab"';
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Graph of ${esc(yl)} against ${esc(xl)}">`;
    if (!pts.length) return s + `<rect x="${L}" y="${T}" width="${pw}" height="${ph}" fill="none" ${ax} stroke-dasharray="4 4"/><text x="${L + pw / 2}" y="${T + ph / 2}" text-anchor="middle" ${lb}>Record data to see the graph</text></svg>`;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const X = niceTicks(Math.min(...xs, opt.x0 != null ? opt.x0 : Infinity), Math.max(...xs), 5), Y = niceTicks(Math.min(0, ...ys), Math.max(...ys), 5);
    const px = v => L + (v - X.lo) / (X.hi - X.lo) * pw, py = v => T + ph - (v - Y.lo) / (Y.hi - Y.lo) * ph;
    X.t.forEach(v => { s += `<line x1="${px(v)}" y1="${T}" x2="${px(v)}" y2="${T + ph}" ${gr}/><text x="${px(v)}" y="${T + ph + 13}" text-anchor="middle" ${tx}>${+v.toPrecision(4)}</text>`; });
    Y.t.forEach(v => { s += `<line x1="${L}" y1="${py(v)}" x2="${L + pw}" y2="${py(v)}" ${gr}/><text x="${L - 5}" y="${py(v) + 3.5}" text-anchor="end" ${tx}>${+v.toPrecision(4)}</text>`; });
    s += `<line x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}" ${ax}/><line x1="${L}" y1="${T}" x2="${L}" y2="${T + ph}" ${ax}/>`;
    s += `<text x="${L + pw / 2}" y="${H - 4}" text-anchor="middle" ${lb}>${esc(xl)}</text><text transform="translate(11 ${T + ph / 2}) rotate(-90)" text-anchor="middle" ${lb}>${esc(yl)}</text>`;
    const c = opt.color || '#1686e8', srt = pts.slice().sort((a, b) => a[0] - b[0]);
    if (srt.length > 1) s += `<polyline points="${srt.map(p => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="1.5"/>`;
    const F = opt.fit !== false ? fit(pts) : null;
    if (F && new Set(xs).size > 2) { const a = X.lo, b = X.hi, ya = F.m * a + F.b, yb = F.m * b + F.b; s += `<clipPath id="xgc${W}${H}"><rect x="${L}" y="${T}" width="${pw}" height="${ph}"/></clipPath><line clip-path="url(#xgc${W}${H})" x1="${px(a)}" y1="${py(ya)}" x2="${px(b)}" y2="${py(yb)}" stroke="#e5484d" stroke-width="1.6" stroke-dasharray="5 4"/>`; }
    pts.forEach(p => { s += `<circle cx="${px(p[0]).toFixed(1)}" cy="${py(p[1]).toFixed(1)}" r="3.6" fill="${c}" stroke="${pr ? '#fff' : 'var(--panel)'}" stroke-width="1.2"/>`; });
    return s + '</svg>';
  }
  const fitText = (rows, xc, yc) => { const pts = rows.map(r => [+r[xc.k], +r[yc.k]]).filter(p => isFinite(p[0]) && isFinite(p[1])); const F = fit(pts); if (!F || new Set(pts.map(p => p[0])).size < 3) return '';
    return `Best-fit line: ${yc.label} = ${fmt(F.m, Math.abs(F.m) < 1 ? 3 : 2)} × ${xc.label} ${F.b < 0 ? '−' : '+'} ${fmt(Math.abs(F.b))} · R² = ${f(F.r2, 2)}`; };

  /* ── downloads ── */
  function download(name, text, type) { const b = new Blob([text], { type }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  function printHtml(html) { const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr); const d = fr.contentWindow.document; d.open(); d.write(html); d.close(); setTimeout(() => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) {} setTimeout(() => fr.remove(), 60000); }, 350); }
  const day = () => new Date().toISOString().slice(0, 10), slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  /* the report: a stand-alone page the student can keep, print or hand in */
  function reportHtml(m, o) {
    const h = s => esc(s == null ? '' : s).replace(/\n/g, '<br>');
    const sec = (t, b) => b ? `<h2>${t}</h2>${b}` : '';
    const tbl = (cols, rows) => rows.length ? `<table><thead><tr><th>#</th>${cols.map(c => `<th>${h(c.label)}${c.unit ? ` (${h(c.unit)})` : ''}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td>${cols.map(c => `<td>${typeof r[c.k] === 'number' ? fmt(r[c.k], c.d) : h(r[c.k])}</td>`).join('')}</tr>`).join('')}</tbody></table>` : '';
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${h(m.title)}: lab report</title><style>
body{font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f2238;max-width:760px;margin:28px auto;padding:0 20px}h1{font-size:24px;margin:0 0 2px}h2{font-size:16px;margin:22px 0 6px;color:#0a355f;border-bottom:2px solid #dcecfc;padding-bottom:3px}
.meta{color:#55677d;font-size:13.5px}table{border-collapse:collapse;width:100%;font-size:13px;margin:6px 0}th,td{border:1px solid #d5dfea;padding:4px 8px;text-align:right}th{background:#f5f9fd}td:first-child,th:first-child{text-align:left}
.box{background:#f5f9fd;border-radius:8px;padding:8px 12px;margin:6px 0}.g{max-width:520px}ul{margin:4px 0 4px 20px;padding:0}.ok{color:#23824f;font-weight:600}.no{color:#b9343a;font-weight:600}
@media print{body{margin:0}h2{break-after:avoid}table,.g{break-inside:avoid}}</style></head><body>
<h1>${h(m.title)}</h1><div class="meta">${o.student ? `Student: <b>${h(o.student)}</b> · ` : ''}${h(o.mode)} · ${new Date().toLocaleString()} · ${h(m.grade || '')} · Educator Space</div>
${sec('Learning objectives', `<ul>${(m.objectives || [m.objective]).map(x => `<li>${h(x)}</li>`).join('')}</ul>`)}
${sec('Research question', o.question ? `<div class="box">${h(o.question)}</div>` : '')}
${sec('Prediction (hypothesis)', o.prediction ? `<div class="box">${h(o.prediction)}</div>` : '')}
${o.extra || ''}
${sec('Data', tbl(o.cols || [], o.rows || []))}
${sec('Graph', o.graph ? `<div class="g">${o.graph}</div>${o.fit ? `<p class="meta">${h(o.fit)}</p>` : ''}` : '')}
${sec('Testing the prediction', o.check ? `<div class="box">${o.check}</div>` : '')}
${o.cer && (o.cer.c || o.cer.e || o.cer.r) ? `<h2>Conclusion</h2><p><b>Claim.</b> ${h(o.cer.c)}</p><p><b>Evidence.</b> ${h(o.cer.e)}</p><p><b>Reasoning.</b> ${h(o.cer.r)}</p>` : ''}
${sec('Standards', `<ul>${(m.ngss || []).map(n => `<li><b>${h(n[0])}</b>: ${h(n[1])}</li>`).join('')}</ul>`)}
</body></html>`;
  }

  /* ── the in-lab mode switcher (a button in the lab's top bar) ── */
  function modeBtn(L, r, cur) {
    const st = $('.lab-top .stats'); if (!st || $('#xMode')) return;
    const b = document.createElement('button'); b.className = 'btn sm'; b.id = 'xMode'; b.innerHTML = `${ico('list')}<span>${MODES[cur]}</span>`; b.title = 'Change mode'; st.insertBefore(b, st.firstChild);
    b.onclick = () => pickMode(L, r, cur);
  }
  const MICO = { guided: 'list', free: 'chart', game: 'trophy' };
  const MDESC = { guided: 'Step-by-step challenges with predictions, feedback and a short quiz.', free: 'Design your own experiment: record data, graph it, test a prediction and download a report.', game: 'Beat the levels using the science. Earn up to 3 stars per level.' };
  function pickMode(L, r, cur) {
    if ($('#xmPick')) return; const o = document.createElement('div'); o.className = 'oops'; o.id = 'xmPick';
    o.innerHTML = `<div class="box"><h3>Choose a mode</h3><div class="xl-modes">${Object.keys(MODES).filter(k => L[k]).map(k => `<button class="xl-mb ${k === cur ? 'on' : ''}" data-xm="${k}"><span class="ic">${ico(MICO[k])}</span><span><b>${MODES[k]}</b>${k === 'guided' && APP.student ? '<span class="xl-tag">Sends results</span>' : ''}<small>${MDESC[k]}</small></span></button>`).join('')}</div>
      <p class="small muted">${cur === 'guided' ? 'Switching starts the new mode from the beginning. Progress in this guided run won’t be saved.' : cur === 'free' ? 'Your investigation notes and data are kept on this computer.' : 'Your best scores are kept on this computer.'}</p><div class="row"><button class="btn" id="xmX">Cancel</button></div></div>`;
    K.stage.appendChild(o); $('#xmX').onclick = () => o.remove();
    $$('[data-xm]', o).forEach(b => b.onclick = () => { o.remove(); const m = b.dataset.xm; if (m === cur && m === 'free') return; start(L, Object.assign({}, r, { mode: m })); });
  }

  /* ═════ Guided Experiment: built with makeLab, so it records and sends results like every other lab ═════ */
  function runGuided(L, r) {
    const G = L.guided, m = metaOf(L.id);
    if (!L._lab) {
      const wrap = fn => R => { cvClear(); fn(R); };
      const meta = Object.assign({}, m);
      L._lab = makeLab({ noSetup: true, fit: true, bg: () => '', fresh: G.fresh || (() => ({})), defs: G.defs || '',
        steps: G.steps, S: Object.fromEntries(Object.entries(G.S).map(([k, fn]) => [k, wrap(fn)])), quiz: G.quiz,
        finale: R => { cvClear(); G.finale && G.finale(R); }, finaleMsg: G.finaleMsg,
        verdicts: G.verdicts || [['Lab complete', 'You ran the experiments and used the evidence. Great science.'], ['Almost there', 'Good work. Look over the items below.'], ['Practice again', 'Run the guided experiment once more and watch the readouts.']],
        reviewLabel: 'Review these',
        summary: R => `${G.summary ? G.summary(R) : ''}<div class="row" style="margin-top:8px"><button class="btn sm" data-xrep="html">Download lab report</button><button class="btn sm ghost" data-xrep="print">Print / save as PDF</button></div>`,
        meta });
      const i = LABS.indexOf(meta); if (i >= 0) LABS.splice(i, 1); /* makeLab registers its meta: the card is already in LABS */
    }
    L.log = []; L.mode = 'guided'; L.run = r;
    L._lab.start(r); modeBtn(L, r, 'guided');
  }
  function guidedReport(L, html) {
    const m = metaOf(L.id), mis = uniqMistakes(K.mistakes || []);
    const extra = `<h2>What I did</h2>${L.log.length ? `<ul>${L.log.map(x => `<li><b>${esc(x.step)}:</b> ${esc(x.t)}</li>`).join('')}</ul>` : '<p>—</p>'}
      <h2>Results</h2><p>Quiz: <b>${esc(L._lab.R.quizScore)}/${L.guided.quiz.length}</b> · Mistakes: <b>${mis.length}</b>${mis.length ? `</p><ul>${mis.map(x => `<li>${esc(x.step)}: ${esc(x.title)}</li>`).join('')}</ul>` : '</p>'}`;
    const doc = reportHtml(m, { student: L.run.student, mode: MODES.guided, extra });
    if (html) download(`${slug(m.short)}-guided-report-${day()}.html`, doc, 'text/html'); else printHtml(doc);
  }
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-xrep]'); if (!b || !XLab.cur) return; if (XLab.cur.mode === 'guided') guidedReport(XLab.cur, b.dataset.xrep === 'html'); });

  /* ═════ Free Investigation ═════
     L.free = {
       intro: html shown at the top,
       vars: [{ k, label, min, max, step, unit, fmt, d }]    the variables the student controls (sliders bound to F.st)
       measures: [{ k, label, unit, d }]                     what can be measured
       fresh(): starting state,  setup(F): build the stage (and any extra controls) — called once,
       measure(st): the current measurements {k: value} (used by the Record button), or null if nothing to record yet,
       noRecord: true if the lab adds rows itself with F.add() after each trial (e.g. a collision),
       recordLabel: text on the Record button,
       ideas: [[question, xk, yk]], expect(xk, yk): { t: 'up'|'down'|'levels'|'peak'|'flat'|…, why: html } or null
     }  F: { st, add(row), rows, panel, onChange(fn), msg } */
  function runFree(L, r) {
    const FR = L.free, m = metaOf(L.id), key = 'xl.nb.' + L.id + '.' + slug(r.student || 'me');
    K.mount({ title: m.title, back: r.back, fit: true, ppe: [] }); K.phase('Free Investigation'); L.mode = 'free'; L.run = r; modeBtn(L, r, 'free');
    const cats = FR.cats || [], cols = FR.vars.map(v => Object.assign({ iv: true }, v)).concat(cats.map(c => Object.assign({ iv: true, text: true }, c)), FR.measures);
    const num = cols.filter(c => !c.text);
    const colOf = k => cols.find(c => c.k === k);
    const saved = LS.get(key, null);
    const nb = Object.assign({ rows: [], q: '', px: FR.ideas && FR.ideas[0] ? FR.ideas[0][1] : FR.vars[0].k, py: FR.ideas && FR.ideas[0] ? FR.ideas[0][2] : FR.measures[0].k, pt: '', gx: '', gy: '', c: '', e: '', r: '', check: '' }, saved || {});
    const okK = k => cols.some(c => c.k === k && !c.text);
    if (!FR.vars.some(v => v.k === nb.px)) nb.px = FR.vars[0].k; if (!FR.measures.some(v => v.k === nb.py && !v.text)) nb.py = FR.measures.find(v => !v.text).k;
    if (!okK(nb.gx)) nb.gx = nb.px; if (!okK(nb.gy)) nb.gy = nb.py;
    const save = () => LS.set(key, nb);
    const F = { st: FR.fresh ? FR.fresh() : {}, rows: nb.rows, L, cols,
      add(row) { const full = {}; cols.forEach(c => { full[c.k] = row[c.k] != null ? row[c.k] : F.st[c.k]; }); if (row.note) full.note = row.note; nb.rows.push(full); save(); SND.tick(); K.msg(`Data point ${nb.rows.length} recorded`, 'ok', 1400); drawData(); return full; },
      msg: (t, k, ms) => K.msg(t, k, ms), changed: [] };
    K.sheet({ title: 'Free Investigation', html: `<h3 style="margin-bottom:4px">Design your own experiment</h3>${FR.intro || ''}` });
    /* 1 · question and prediction */
    const ivs = FR.vars, dvs = FR.measures.filter(c => !c.text), opt = (list, sel) => list.map(c => `<option value="${c.k}" ${c.k === sel ? 'selected' : ''}>${esc(c.label)}</option>`).join('');
    const qBox = LabUI.html(`<div class="xl-sec"><div class="pl-lab">1 · Question and prediction</div>
      ${FR.ideas ? `<div class="xl-ideas">${FR.ideas.map((x, i) => `<button data-xi="${i}">💡 ${esc(x[0])}</button>`).join('')}</div>` : ''}
      <div class="xl-q"><input id="xlQ" placeholder="My question: how does … affect …?" value="${esc(nb.q)}" aria-label="Research question"></div>
      <div class="xl-row">If I increase <select id="xlPx" aria-label="Variable I change">${opt(ivs, nb.px)}</select> then <select id="xlPy" aria-label="Variable I measure">${opt(dvs, nb.py)}</select> will
        <select id="xlPt" aria-label="Predicted result"><option value="">choose…</option>${PRED.map(([k, t]) => `<option value="${k}" ${k === nb.pt ? 'selected' : ''}>${t}</option>`).join('')}</select>.</div></div>`);
    const syncQ = () => { nb.q = $('#xlQ').value; nb.px = $('#xlPx').value; nb.py = $('#xlPy').value; nb.pt = $('#xlPt').value; save(); };
    ['#xlQ', '#xlPx', '#xlPy', '#xlPt'].forEach(s => $(s).addEventListener('change', () => { syncQ(); if (s !== '#xlQ' && s !== '#xlPt') { nb.gx = nb.px; nb.gy = nb.py; drawData(); } }));
    $$('[data-xi]', qBox).forEach(b => b.onclick = () => { const x = FR.ideas[+b.dataset.xi]; $('#xlQ').value = x[0]; $('#xlPx').value = x[1]; $('#xlPy').value = x[2]; syncQ(); nb.gx = x[1]; nb.gy = x[2]; drawData(); $('#xlPt').focus(); });
    /* 2 · controls (the lab's own controls follow the sliders) */
    LabUI.html('<div class="xl-sec" style="padding-bottom:0;border-bottom:0"><div class="pl-lab">2 · Run the experiment</div><div class="small muted">Change one variable at a time, and keep the others the same.</div></div>');
    const listeners = []; F.onChange = fn => listeners.push(fn);
    if (cats.length) { const cb = LabUI.html(cats.map(c => `<div class="pl-pred"><label>${esc(c.label)}</label><div class="sim-pick">${c.opts.map(([v, t]) => `<button class="btn sm ${F.st[c.k] === v ? 'on' : ''}" data-xcat="${c.k}" data-v="${v}">${t}</button>`).join('')}</div></div>`).join(''));
      $$('[data-xcat]', cb).forEach(b => b.onclick = () => { F.st[b.dataset.xcat] = b.dataset.v; $$(`[data-xcat="${b.dataset.xcat}"]`, cb).forEach(x => x.classList.toggle('on', x === b)); listeners.forEach(fn => fn(b.dataset.xcat)); }); }
    F.panel = SimLab.panel(F.st, FR.vars, k => { listeners.forEach(fn => fn(k)); });
    FR.setup(F);
    if (!FR.noRecord) { const b = LabUI.button(FR.recordLabel || 'Record data point', () => { const v = FR.measure(F.st, F); if (!v) { K.msg(FR.notReady || 'Run the experiment first, then record.', 'bad', 2600); return; } F.add(v); }); b.classList.add('sm'); }
    /* 3 · data table and graph */
    const dBox = LabUI.html('');
    const tBox = LabUI.html('');
    function drawData() {
      if (!dBox.isConnected) return; const rows = nb.rows;
      dBox.innerHTML = `<div class="xl-sec"><div class="pl-lab">3 · Data (${rows.length} point${rows.length === 1 ? '' : 's'})</div>
        ${rows.length ? `<div class="xl-tbl-w"><table class="xl-tbl"><thead><tr><th>#</th>${cols.map(c => `<th>${esc(c.short || c.label)}${c.unit ? `<br>${esc(c.unit)}` : ''}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td>${cols.map(c => `<td>${typeof r[c.k] === 'number' ? fmt(r[c.k], c.d) : esc(r[c.k] == null ? '' : r[c.k])}</td>`).join('')}<td><button data-xd="${i}" aria-label="Delete row ${i + 1}" title="Delete">×</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="small muted">No data yet. Set up a trial, then record it.</div>'}
        <div class="xl-row">Graph <select id="xlGy" aria-label="Y axis">${opt(num, nb.gy)}</select> against <select id="xlGx" aria-label="X axis">${opt(num, nb.gx)}</select></div>
        <div class="xl-graph">${graph(rows, colOf(nb.gx), colOf(nb.gy))}</div><div class="small muted" style="margin-top:-4px">${esc(fitText(rows, colOf(nb.gx), colOf(nb.gy)))}</div>
        <div class="xl-row"><button class="btn sm primary" id="xlChk">Check my prediction</button>${rows.length ? '<button class="btn sm ghost" id="xlClr">Clear data</button>' : ''}</div><div id="xlFb">${nb.check || ''}</div></div>`;
      $$('[data-xd]', dBox).forEach(b => b.onclick = () => { nb.rows.splice(+b.dataset.xd, 1); nb.check = ''; save(); drawData(); });
      $('#xlGx').onchange = e => { nb.gx = e.target.value; save(); drawData(); }; $('#xlGy').onchange = e => { nb.gy = e.target.value; save(); drawData(); };
      $('#xlChk').onclick = checkPred;
      const cl = $('#xlClr'); if (cl) cl.onclick = () => { if (!cl.dataset.sure) { cl.dataset.sure = 1; cl.textContent = 'Click again to clear'; return; } nb.rows.length = 0; nb.check = ''; save(); drawData(); };
    }
    function checkPred() {
      syncQ(); const xc = colOf(nb.px), yc = colOf(nb.py), fb = $('#xlFb');
      if (!nb.pt) { fb.innerHTML = '<div class="xl-fb bad">Choose your prediction in part 1 first (what will happen to ' + esc(yc.label.toLowerCase()) + ').</div>'; return; }
      const rows = nb.rows.filter(r => isFinite(r[xc.k]) && isFinite(r[yc.k])), nx = new Set(rows.map(r => r[xc.k])).size;
      if (nx < 3) { fb.innerHTML = `<div class="xl-fb bad">You need data at <b>at least 3 different values</b> of ${esc(xc.label.toLowerCase())} (you have ${nx}). Change it, run a trial, and record each one.</div>`; return; }
      /* fair test: did any other controlled variable change between these rows? */
      const others = ivs.concat(cats).filter(v => v.k !== xc.k && new Set(rows.map(r => r[v.k])).size > 1);
      const t = trend(rows.map(r => [r[xc.k], r[yc.k]])), mk = match(nb.pt, t), ex = FR.expect ? FR.expect(xc.k, yc.k, F.st) : null;
      const pText = PRED.find(p => p[0] === nb.pt)[1];
      let h = `<b>${mk === 2 ? '✓ Your data supports your prediction.' : mk === 1 ? '◐ Your prediction is partly supported.' : '✗ Your data does not support your prediction.'}</b> You predicted ${esc(yc.label.toLowerCase())} would <b>${pText}</b>. In your data it <b>${TREND[t]}</b>.`;
      if (others.length) h += `<br><br>⚠ <b>Not a fair test:</b> you also changed ${others.map(v => esc(v.label.toLowerCase())).join(' and ')} between these data points, so you can’t be sure what caused the change. Delete those points or keep ${others.length > 1 ? 'them' : 'it'} the same.`;
      if (ex && ex.why) h += `<br><br><b>The science:</b> ${ex.why}`;
      if (ex && ex.t && match(ex.t, t) < 2 && !others.length) h += `<br><br>💡 Try a wider range of ${esc(xc.label.toLowerCase())}, or more data points: the full pattern is ${TREND[ex.t]}.`;
      if (mk < 2 && !others.length) h += '<br><br>That’s fine: scientists revise their hypotheses when the evidence disagrees. Write what you found in your conclusion.';
      nb.check = `<div class="xl-fb ${mk === 2 && !others.length ? 'ok' : mk ? '' : 'bad'}">${h}</div>`; save(); fb.innerHTML = nb.check; mk === 2 ? SND.ok() : SND.nope();
    }
    drawData();
    /* 4 · conclusion and report */
    tBox.innerHTML = `<div class="xl-sec"><div class="pl-lab">4 · Conclusion</div><div class="xl-cer">
      <label>Claim: what did you find out?<textarea id="xlC" placeholder="As … increased, … ">${esc(nb.c)}</textarea></label>
      <label>Evidence: which data shows it?<textarea id="xlE" placeholder="When … was …, … was …">${esc(nb.e)}</textarea></label>
      <label>Reasoning: why does it happen? Use the science.<textarea id="xlR" placeholder="This happens because …">${esc(nb.r)}</textarea></label></div>
      <div class="row"><button class="btn sm primary" id="xlRep">Download report</button><button class="btn sm" id="xlPr">Print / PDF</button><button class="btn sm ghost" id="xlCsv">Data (CSV)</button></div>
      <div class="row"><button class="btn sm ghost" id="xlNew">Start a new investigation</button></div></div>`;
    [['#xlC', 'c'], ['#xlE', 'e'], ['#xlR', 'r']].forEach(([s, k]) => $(s).addEventListener('input', e => { nb[k] = e.target.value; save(); }));
    const rep = () => { syncQ(); const xc = colOf(nb.gx), yc = colOf(nb.gy), px = colOf(nb.px), py = colOf(nb.py);
      return reportHtml(m, { student: r.student, mode: MODES.free, question: nb.q, prediction: nb.pt ? `If I increase ${px.label.toLowerCase()}, then ${py.label.toLowerCase()} will ${PRED.find(p => p[0] === nb.pt)[1]}.` : '',
        cols, rows: nb.rows, graph: nb.rows.length ? graph(nb.rows, xc, yc, { w: 520, h: 320, theme: 'print' }) : '', fit: fitText(nb.rows, xc, yc), check: nb.check ? nb.check.replace(/<\/?div[^>]*>/g, '') : '', cer: { c: nb.c, e: nb.e, r: nb.r } }); };
    $('#xlRep').onclick = () => download(`${slug(m.short)}-investigation-${day()}.html`, rep(), 'text/html');
    $('#xlPr').onclick = () => printHtml(rep());
    $('#xlCsv').onclick = () => download(`${slug(m.short)}-data-${day()}.csv`, [cols.map(c => c.label + (c.unit ? ` (${c.unit})` : '')).map(csvCell).join(',')].concat(nb.rows.map(rw => cols.map(c => csvCell(typeof rw[c.k] === 'number' ? +(+rw[c.k]).toFixed(c.d != null ? c.d : 4) : rw[c.k])).join(','))).join('\n'), 'text/csv');
    $('#xlNew').onclick = e => { const b = e.target; if (!b.dataset.sure) { b.dataset.sure = 1; b.textContent = 'Click again: clears your data and notes'; return; } LS.del(key); runFree(L, r); };
  }

  /* ═════ Game Challenge ═════
     L.game = { intro, cover(): stage SVG for the level menu, levels: [{ name, goal: html, hint, setup(G) }] }
     G: { lv, i, st, win(stars, score, msg), lose(title, why), panel(items), score(n), t() seconds in the level } */
  function runGame(L, r) {
    const GM = L.game, m = metaOf(L.id), key = 'xl.game.' + L.id;
    K.mount({ title: m.title, back: r.back, fit: true, ppe: [] }); L.mode = 'game'; L.run = r; modeBtn(L, r, 'game');
    const best = () => LS.get(key, {}), stars = n => `<span class="xl-st" aria-label="${n} of 3 stars">${'★'.repeat(n)}<i>${'★'.repeat(3 - n)}</i></span>`;
    function menu() {
      K.clear(); cvClear(); K.phase('Game Challenge · Choose a level'); K.setBg(GM.cover ? GM.cover() : `<rect width="1000" height="620" fill="#12304f"/>`);
      const b = best(), total = GM.levels.reduce((a, _, i) => a + ((b[i] || {}).stars || 0), 0), pts = GM.levels.reduce((a, _, i) => a + ((b[i] || {}).score || 0), 0);
      K.sheet({ title: 'Game Challenge', html: `<h3 style="margin-bottom:4px">${esc(GM.title || m.short)}</h3>${GM.intro || ''}` });
      LabUI.html(`<div class="xl-score"><span class="chip">★ ${total} / ${GM.levels.length * 3}</span><span class="chip mono">${pts.toLocaleString()} pts</span></div>
        <div class="xl-lv">${GM.levels.map((lv, i) => { const s = (b[i] || {}), open = i === 0 || (b[i - 1] || {}).stars > 0; return `<button class="xl-lvb" data-lv="${i}" ${open ? '' : 'disabled'}><span class="n">${open ? i + 1 : '🔒'}</span><span><b>${esc(lv.name)}</b><small>${s.score ? `Best ${s.score.toLocaleString()} pts` : open ? 'Not played yet' : 'Finish the level before to unlock'}</small></span>${stars(s.stars || 0)}</button>`; }).join('')}</div>`);
      $$('[data-lv]').forEach(x => x.onclick = () => play(+x.dataset.lv));
    }
    function play(i) {
      const lv = GM.levels[i]; K.clear(); cvClear(); K.mistakes = []; K.mistakeCount(); K.phase(`Game Challenge · Level ${i + 1} of ${GM.levels.length}`);
      K.sheet({ title: `Level ${i + 1} · ${lv.name}`, html: lv.goal, hint: lv.hint });
      const t0 = performance.now(); let over = false;
      const G = { lv, i, st: {}, t: () => (performance.now() - t0) / 1000, over: () => over,
        panel: (st, items, fn) => SimLab.panel(st, items, fn),
        win(n, score, msg) { if (over) return; over = true; n = clamp(Math.round(n), 1, 3); const b = best(), o = b[i] || {}; b[i] = { stars: Math.max(o.stars || 0, n), score: Math.max(o.score || 0, Math.round(score)) }; LS.set(key, b);
          SND.win(); if (n === 3) confetti(1800); K.sparkle({ x: 500, y: 300 }, 50);
          overlay(`Level ${i + 1} complete!`, `${stars(n)}<div style="font-size:22px;font-weight:800;margin:4px 0">${Math.round(score).toLocaleString()} pts</div>${msg ? `<p>${msg}</p>` : ''}${b[i].score > (o.score || 0) && o.score ? '<p class="small"><b>New best score!</b></p>' : ''}`,
            [i + 1 < GM.levels.length ? ['Next level', () => play(i + 1), 'primary'] : ['All levels done!', menu, 'primary'], ['Play again', () => play(i)], ['Levels', menu]]); },
        lose(title, why) { if (over) return; over = true; K.addMistake({ title, why: why.replace(/<[^>]+>/g, ''), step: lv.name }); SND.wah(); K.stage.classList.remove('shake'); void K.stage.offsetWidth; K.stage.classList.add('shake');
          setTimeout(() => overlay(title, `<div class="why"><b>The science</b>${why}</div>`, [['Try again', () => play(i), 'primary'], ['Levels', menu]], true), 700); } };
      lv.setup(G);
    }
    function overlay(t, body, btns, bad) {
      if (!K.live) return; const o = document.createElement('div'); o.className = 'oops';
      o.innerHTML = `<div class="box">${bad ? `<div class="pip-row">${pipFace('oops', 52)}<span class="eyebrow" style="color:var(--warn)">Not this time</span></div>` : `<div class="pip-row">${pipFace('happy', 52)}<span class="eyebrow">Game Challenge</span></div>`}<h3>${t}</h3>${body}<div class="row">${btns.map((b, j) => `<button class="btn ${b[2] || ''}" data-ob="${j}">${b[0]}</button>`).join('')}</div></div>`;
      K.stage.appendChild(o); $$('[data-ob]', o).forEach(x => x.onclick = () => { o.remove(); btns[+x.dataset.ob][1](); }); $('[data-ob]', o).focus();
    }
    menu();
  }

  function start(L, r) { XLab.cur = L; APP.curLab = L.id; const mode = L[r.mode] ? r.mode : 'guided'; (mode === 'free' ? runFree : mode === 'game' ? runGame : runGuided)(L, Object.assign({}, r, { mode })); }

  /* a prediction box inside a guided step: a number with a unit. check(v) → true/false */
  function numIn(id, label, unit, ph) { return `<div class="sim-in"><label for="${id}">${label}</label><input type="number" id="${id}" step="any" placeholder="${ph || unit || ''}"><span>${unit || ''}</span><button class="btn sm" id="${id}B">Check</button></div>`; }
  /* a choice prediction inside a guided step (answered before the test). onPick(i) */
  function choiceIn(q, opts, onPick) {
    const box = LabUI.html(`<div class="pl-pred"><label>${q}</label><div class="sim-pick">${opts.map((o, i) => `<button class="btn sm" data-xc="${i}">${o}</button>`).join('')}</div></div>`);
    $$('[data-xc]', box).forEach(b => b.onclick = () => { $$('[data-xc]', box).forEach(x => x.classList.toggle('on', x === b)); onPick(+b.dataset.xc); });
    return box;
  }
  const note = t => { const L = XLab.cur; if (!L || L.mode !== 'guided') return; const s = L.guided.steps[L._lab.R.i]; L.log.push({ step: s ? s.name : '', t }); };

  /* XLab.define(L): L = { id, guided: { steps, S, quiz, fresh?, finale?, summary?, verdicts? }, free: {...}, game: {...} } */
  function define(L) { XLAB.mods[L.id] = { start: r => start(L, r), L }; return L; }
  return { define, cv, cvClear, graph, trend, fit, fmt, numIn, choiceIn, note, niceTicks, MODES };
})();
