/* Rocket Run (middle school, Earth & space): fly from Earth to Neptune. Dodge asteroids, grab stars, and fly through
   the ring with the right answer to refuel. Run out of fuel or lives and the trip ends. */
(() => {
  const { D } = AR, W = AR.W, H = AR.H, PX = 170, LANES = [150, 290, 430];
  const PLANETS = [['Mercury', '#b9a79a', 16], ['Venus', '#f2c46d', 22], ['Mars', '#e2673a', 18], ['Jupiter', '#e0a46c', 46], ['Saturn', '#ead08c', 40], ['Uranus', '#8fe3e8', 30], ['Neptune', '#4f7df2', 30]];
  const QS = [
    ['Which planet is closest to the Sun?', ['Mercury', 'Venus', 'Mars'], 'Mercury is the first planet from the Sun.'],
    ['What is the largest planet?', ['Jupiter', 'Saturn', 'Neptune'], 'Jupiter is so big that all the other planets could fit inside it.'],
    ['What causes day and night on Earth?', ['Earth spinning on its axis', 'Earth orbiting the Sun', 'The Moon blocking the Sun'], 'One full spin (rotation) takes about 24 hours.'],
    ['What causes Earth’s seasons?', ['The tilt of Earth’s axis', 'Distance from the Sun', 'The Moon’s phases'], 'The tilt changes how directly sunlight hits each hemisphere during the year.'],
    ['How long does Earth take to orbit the Sun?', ['About 365 days', 'About 24 hours', 'About 30 days'], 'One trip around the Sun (revolution) is one year.'],
    ['What keeps the planets in orbit around the Sun?', ['Gravity', 'Magnetism', 'Wind'], 'The Sun’s gravity pulls on the planets and keeps them in orbit.'],
    ['The Sun is a…', ['Star', 'Planet', 'Moon'], 'The Sun is a medium-sized star, the closest star to Earth.'],
    ['Why does the Moon seem to change shape?', ['We see different amounts of its lit half', 'Earth’s shadow covers it every night', 'It really changes shape'], 'As the Moon orbits Earth, we see more or less of its sunlit side. These are the phases.'],
    ['Which planet has the most famous rings?', ['Saturn', 'Mars', 'Mercury'], 'Saturn’s rings are made of ice and rock.'],
    ['Our solar system is part of which galaxy?', ['The Milky Way', 'Andromeda', 'The Big Dipper'], 'The Milky Way has hundreds of billions of stars.'],
    ['Where would you weigh the least?', ['On the Moon', 'On Earth', 'On Jupiter'], 'The Moon has less mass, so its gravity is weaker (about 1/6 of Earth’s).'],
    ['What is a light-year?', ['The distance light travels in a year', 'The time it takes to reach the Sun', 'A very bright year'], 'It measures distance, not time: about 9.5 trillion km.']];
  function rocket(c, x, y, tilt, t, flame = true) { c.save(); c.translate(x, y); c.rotate(tilt);
    if (flame) { const f = 18 + Math.sin(t * 40) * 5; const g = c.createLinearGradient(-40 - f, 0, -24, 0); g.addColorStop(0, 'rgba(255,90,40,0)'); g.addColorStop(1, '#ffd23f'); c.fillStyle = g; c.beginPath(); c.moveTo(-24, -9); c.lineTo(-40 - f, 0); c.lineTo(-24, 9); c.fill(); }
    c.fillStyle = '#e8463c'; c.beginPath(); c.moveTo(-18, -12); c.lineTo(-30, -24); c.lineTo(-8, -12); c.fill(); c.beginPath(); c.moveTo(-18, 12); c.lineTo(-30, 24); c.lineTo(-8, 12); c.fill();
    const g = c.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, '#ffffff'); g.addColorStop(.6, '#dfe6f2'); g.addColorStop(1, '#9aa7bf'); c.fillStyle = g; c.beginPath(); c.moveTo(34, 0); c.quadraticCurveTo(18, -16, -24, -12); c.lineTo(-24, 12); c.quadraticCurveTo(18, 16, 34, 0); c.fill();
    c.fillStyle = '#e8463c'; c.beginPath(); c.moveTo(34, 0); c.quadraticCurveTo(28, -8, 20, -10); c.lineTo(20, 10); c.quadraticCurveTo(28, 8, 34, 0); c.fill();
    D.gloss(c, 4, 0, 6.5, '#3fa9ff'); c.restore(); }
  function rock(c, a) { c.save(); c.translate(a.x, a.y); c.rotate(a.rot); const g = c.createRadialGradient(-a.r * .3, -a.r * .3, 2, 0, 0, a.r); g.addColorStop(0, '#c9b3a0'); g.addColorStop(1, '#6b5444'); c.fillStyle = g; c.beginPath(); for (let i = 0; i < 9; i++) { const ang = i / 9 * 6.283, rr = a.r * (.8 + (i * 37 % 7) / 25); c[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * rr, Math.sin(ang) * rr); } c.closePath(); c.fill(); c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.arc(a.r * .2, a.r * .1, a.r * .25, 0, 7); c.fill(); c.restore(); }
  function sky(c, t) { const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1a2a8a'); g.addColorStop(.5, '#3a2a9a'); g.addColorStop(1, '#120a4a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = .35; const n = c.createRadialGradient(700, 160, 10, 700, 160, 300); n.addColorStop(0, '#ff7ad9'); n.addColorStop(1, 'rgba(255,122,217,0)'); c.fillStyle = n; c.fillRect(0, 0, W, H); c.restore();
    for (let i = 0; i < 90; i++) { const x = ((i * 137.5 - t * (20 + (i % 3) * 25)) % W + W) % W, y = (i * 71.3) % H; c.globalAlpha = .4 + (i % 4) * .15; D.sparkle(c, x, y, i % 7 ? 1.6 : 3.5); } c.globalAlpha = 1; }
  function make(A) {
    const pl = { y: 290, inv: 0 }, st = { fuel: 100, rocks: [], stars: [], q: null, qT: 3, done: 0, need: 12, pi: 0, qs: A.shuffle(QS), rings: null, px: W + 200, planet: null };
    function newQ() { const q = st.qs[st.done % st.qs.length], opts = A.shuffle(q[1].map((o, i) => ({ o, ok: i === 0 }))); st.q = { text: q[0], why: q[2] }; st.rings = { x: W + 60, opts }; }
    return {
      _st: st, _pl: pl,
      update(dt) {
        const sp = 300; if (A.key('up')) pl.y -= sp * dt; if (A.key('down')) pl.y += sp * dt; if (A.ptr.down) pl.y += A.clamp(A.ptr.y - pl.y, -sp * dt * 1.3, sp * dt * 1.3); pl.y = A.clamp(pl.y, 70, H - 30);
        if (pl.inv > 0) pl.inv -= dt;
        st.fuel -= dt * (2.6 + st.done * .12); if (st.fuel <= 0) { st.fuel = 0; A.lives = 0; A.over(false, `You made it past <b>${st.done}</b> checkpoints. Answer questions to refuel!`); return; }
        const speed = 220 + st.done * 9;
        if (!st.rings) { st.qT -= dt; if (st.qT <= 0) newQ(); }
        if (Math.random() < dt * (.9 + st.done * .07)) st.rocks.push({ x: W + 40, y: A.rnd(70, H - 30), r: A.rnd(14, 30), rot: 0, vr: A.rnd(-2, 2), v: A.rnd(.8, 1.3) });
        if (Math.random() < dt * 1.2) st.stars.push({ x: W + 20, y: A.rnd(70, H - 30) });
        st.rocks.forEach(a => { a.x -= speed * a.v * dt; a.rot += a.vr * dt; if (pl.inv <= 0 && Math.hypot(a.x - PX, a.y - pl.y) < a.r + 14) { a.dead = true; pl.inv = 1.6; A.fx.burst(PX, pl.y, '#ffb36b', 20); A.hurt('Ouch! An asteroid hit the rocket.'); } });
        st.stars.forEach(s => { s.x -= speed * dt; if (Math.hypot(s.x - PX, s.y - pl.y) < 26) { s.dead = true; A.add(10); A.sfx.pick(); } });
        st.rocks = st.rocks.filter(a => !a.dead && a.x > -50); st.stars = st.stars.filter(s => !s.dead && s.x > -20);
        if (st.rings) { const R = st.rings; R.x -= speed * .8 * dt; st.rocks = st.rocks.filter(a => Math.abs(a.x - R.x) > 70);
          if (!R.done && R.x < PX + 10) { R.done = true; const lane = LANES.reduce((b, y, i) => Math.abs(pl.y - y) < Math.abs(pl.y - LANES[b]) ? i : b, 0), pick = R.opts[lane];
            if (Math.abs(pl.y - LANES[lane]) > 70) { A.toast(`You missed the rings! ${st.q.why}`, 3); st.fuel -= 8; }
            else if (pick.ok) { st.done++; st.fuel = Math.min(100, st.fuel + 30); A.add(200, PX + 40, pl.y - 30); A.sfx.good(); A.fx.burst(PX, pl.y, '#7dffb0', 24); A.stats.right++; A.stats.asked++; A.toast(`<b>Correct!</b> ${st.q.why}`, 2.6); if (st.done % 2 === 0 && st.pi < PLANETS.length) st.planet = { ...PLANETS[st.pi++], x: W + 120 }; }
            else { A.stats.asked++; st.fuel -= 15; A.sfx.bad(); A.shake(.3); A.toast(`Not quite. ${st.q.why}`, 3.2); }
            if (st.done >= st.need) { A.over(true, `You flew all the way to Neptune and answered <b>${A.stats.right}</b> questions right.`); return; } }
          if (R.x < -80) { st.rings = null; st.q = null; st.qT = 2.2; } }
        if (st.planet) { st.planet.x -= 50 * dt; if (st.planet.x < -150) st.planet = null; }
      },
      draw(c) {
        sky(c, A.t);
        if (st.planet) { const P = st.planet; c.save(); D.glow(c, P[1], 30); D.gloss(c, P.x, 200, P[2] * 2.4, P[1]); c.restore(); if (P[0] === 'Saturn') { c.save(); c.strokeStyle = '#f5e3b0'; c.lineWidth = 8; c.globalAlpha = .8; c.beginPath(); c.ellipse(P.x, 200, P[2] * 4, P[2] * .9, -.25, 0, 7); c.stroke(); c.restore(); } D.text(c, 'Passing ' + P[0], P.x, 200 + P[2] * 2.4 + 26, { size: 15, align: 'center', color: '#fff' }); }
        st.stars.forEach(s => { c.save(); D.glow(c, '#ffe066', 12); D.sparkle(c, s.x, s.y, 9, '#ffe066'); c.restore(); });
        st.rocks.forEach(a => rock(c, a));
        if (st.rings) st.rings.opts.forEach((o, i) => { const x = st.rings.x, y = LANES[i]; c.save(); D.glow(c, '#7fd0ff', 18); c.strokeStyle = '#9fe0ff'; c.lineWidth = 7; c.beginPath(); c.ellipse(x, y, 22, 58, 0, 0, 7); c.stroke(); c.restore();
          c.save(); c.fillStyle = 'rgba(20,20,80,.8)'; const w = Math.max(90, o.o.length * 8.4 + 20); D.rr(c, x - 30 - w, y - 16, w, 32, 10); c.fill(); c.restore(); D.text(c, o.o, x - 30 - w / 2, y + 6, { size: 15, align: 'center', color: '#fff' }); });
        if (!(pl.inv > 0 && Math.floor(A.t * 12) % 2)) rocket(c, PX, pl.y, 0, A.t);
        if (st.q) { c.save(); c.fillStyle = 'rgba(255,255,255,.92)'; D.rr(c, W / 2 - 300, 44, 600, 44, 14); c.fill(); c.restore(); D.text(c, st.q.text, W / 2, 73, { size: 17, align: 'center', color: '#1a1f5a' }); }
        /* fuel */ c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; D.rr(c, 14, H - 34, 200, 20, 10); c.fill(); D.glossRect(c, 14, H - 34, 2 * st.fuel, 20, 10, st.fuel < 25 ? '#ff5d5d' : '#4be37a'); c.restore(); D.text(c, 'FUEL', 222, H - 19, { size: 13, color: '#fff' });
        for (let i = 0; i < PLANETS.length; i++) { c.save(); c.globalAlpha = i < st.pi ? 1 : .3; D.gloss(c, W - 230 + i * 30, H - 24, 9, PLANETS[i][1]); c.restore(); }
      },
      hud() { return { mid: `CHECKPOINT ${st.done}/${st.need}` }; }
    };
  }
  function preview(c, t) { sky(c, t); D.gloss(c, 760, 170, 70, '#e0a46c'); [[600, 380, 24], [820, 420, 18], [480, 120, 20]].forEach(([x, y, r], i) => rock(c, { x: x - (t * 80 + i * 200) % 700 + 200, y, r, rot: t })); rocket(c, 300, 290 + Math.sin(t * 2) * 40, -.15, t);
    c.save(); D.glow(c, '#ffe066', 12); D.sparkle(c, 420, 230, 10, '#ffe066'); D.sparkle(c, 520, 330, 8, '#ffe066'); c.restore(); }
  AR.reg({ id: 'rocket', subject: 'Earth & Space', diff: 'Medium', title: 'Rocket Run', sub: 'Fly to Neptune and answer space questions to refuel', topic: 'Solar system', color: '#ff7a59',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2"/><path d="M12 15l-3-3a22 22 0 0 1 2-4A13 13 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2z"/></svg>',
    intro: 'Pilot your rocket from Earth all the way to <b>Neptune</b>. Your fuel keeps dropping, so fly through the ring with the <b>right answer</b> to refuel.',
    how: ['Steer up and down with <b>↑ ↓</b> or <b>W S</b> (or drag on a touch screen).', 'Read the question at the top, then fly through the ring with the correct answer.', 'Dodge asteroids and grab stars for bonus points. Reach 12 checkpoints to win.'],
    keys: '<kbd>↑</kbd><kbd>↓</kbd> steer', pad: { dirs: ['up', 'down'] },
    recap: 'Earth rotates once a day (day and night) and revolves around the Sun once a year. Its tilted axis causes the seasons, and gravity keeps the planets in orbit.', winTitle: 'Welcome to Neptune!', loseTitle: 'Mission over', make, preview });
})();
