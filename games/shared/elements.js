/* Educator Space · shared element data for the chemistry games (Element Wars, Build an Atom).
   E: [Z, symbol, name, standard atomic weight, category, state at 25 °C, discovery year (0 = known since ancient times), credited country]
   Discovery credits follow the commonly cited discoverers; a few are shared or disputed, and those list both countries.
   TREND: [atomic radius in pm (calculated, Clementi 1967), first ionization energy in kJ/mol, Pauling electronegativity or null]
   for the main-group elements used in the trend games. */
(function (g) {
  const E = [
    [1, 'H', 'Hydrogen', 1.008, 'nonmetal', 'gas', 1766, 'United Kingdom'],
    [2, 'He', 'Helium', 4.0026, 'noble', 'gas', 1868, 'France & United Kingdom'],
    [3, 'Li', 'Lithium', 6.94, 'alkali', 'solid', 1817, 'Sweden'],
    [4, 'Be', 'Beryllium', 9.0122, 'alkaline', 'solid', 1798, 'France'],
    [5, 'B', 'Boron', 10.81, 'metalloid', 'solid', 1808, 'France & United Kingdom'],
    [6, 'C', 'Carbon', 12.011, 'nonmetal', 'solid', 0, ''],
    [7, 'N', 'Nitrogen', 14.007, 'nonmetal', 'gas', 1772, 'United Kingdom'],
    [8, 'O', 'Oxygen', 15.999, 'nonmetal', 'gas', 1774, 'Sweden & United Kingdom'],
    [9, 'F', 'Fluorine', 18.998, 'halogen', 'gas', 1886, 'France'],
    [10, 'Ne', 'Neon', 20.180, 'noble', 'gas', 1898, 'United Kingdom'],
    [11, 'Na', 'Sodium', 22.990, 'alkali', 'solid', 1807, 'United Kingdom'],
    [12, 'Mg', 'Magnesium', 24.305, 'alkaline', 'solid', 1808, 'United Kingdom'],
    [13, 'Al', 'Aluminium', 26.982, 'post', 'solid', 1825, 'Denmark'],
    [14, 'Si', 'Silicon', 28.085, 'metalloid', 'solid', 1824, 'Sweden'],
    [15, 'P', 'Phosphorus', 30.974, 'nonmetal', 'solid', 1669, 'Germany'],
    [16, 'S', 'Sulfur', 32.06, 'nonmetal', 'solid', 0, ''],
    [17, 'Cl', 'Chlorine', 35.45, 'halogen', 'gas', 1774, 'Sweden'],
    [18, 'Ar', 'Argon', 39.948, 'noble', 'gas', 1894, 'United Kingdom'],
    [19, 'K', 'Potassium', 39.098, 'alkali', 'solid', 1807, 'United Kingdom'],
    [20, 'Ca', 'Calcium', 40.078, 'alkaline', 'solid', 1808, 'United Kingdom'],
    [21, 'Sc', 'Scandium', 44.956, 'transition', 'solid', 1879, 'Sweden'],
    [22, 'Ti', 'Titanium', 47.867, 'transition', 'solid', 1791, 'United Kingdom'],
    [23, 'V', 'Vanadium', 50.942, 'transition', 'solid', 1801, 'Mexico'],
    [24, 'Cr', 'Chromium', 51.996, 'transition', 'solid', 1797, 'France'],
    [25, 'Mn', 'Manganese', 54.938, 'transition', 'solid', 1774, 'Sweden'],
    [26, 'Fe', 'Iron', 55.845, 'transition', 'solid', 0, ''],
    [27, 'Co', 'Cobalt', 58.933, 'transition', 'solid', 1735, 'Sweden'],
    [28, 'Ni', 'Nickel', 58.693, 'transition', 'solid', 1751, 'Sweden'],
    [29, 'Cu', 'Copper', 63.546, 'transition', 'solid', 0, ''],
    [30, 'Zn', 'Zinc', 65.38, 'transition', 'solid', 0, ''],
    [31, 'Ga', 'Gallium', 69.723, 'post', 'solid', 1875, 'France'],
    [32, 'Ge', 'Germanium', 72.630, 'metalloid', 'solid', 1886, 'Germany'],
    [33, 'As', 'Arsenic', 74.922, 'metalloid', 'solid', 1250, 'Germany'],
    [34, 'Se', 'Selenium', 78.971, 'nonmetal', 'solid', 1817, 'Sweden'],
    [35, 'Br', 'Bromine', 79.904, 'halogen', 'liquid', 1826, 'France'],
    [36, 'Kr', 'Krypton', 83.798, 'noble', 'gas', 1898, 'United Kingdom'],
    [37, 'Rb', 'Rubidium', 85.468, 'alkali', 'solid', 1861, 'Germany'],
    [38, 'Sr', 'Strontium', 87.62, 'alkaline', 'solid', 1790, 'United Kingdom'],
    [39, 'Y', 'Yttrium', 88.906, 'transition', 'solid', 1794, 'Finland'],
    [40, 'Zr', 'Zirconium', 91.224, 'transition', 'solid', 1789, 'Germany'],
    [41, 'Nb', 'Niobium', 92.906, 'transition', 'solid', 1801, 'United Kingdom'],
    [42, 'Mo', 'Molybdenum', 95.95, 'transition', 'solid', 1778, 'Sweden'],
    [43, 'Tc', 'Technetium', 98, 'transition', 'solid', 1937, 'Italy'],
    [44, 'Ru', 'Ruthenium', 101.07, 'transition', 'solid', 1844, 'Russia'],
    [45, 'Rh', 'Rhodium', 102.91, 'transition', 'solid', 1804, 'United Kingdom'],
    [46, 'Pd', 'Palladium', 106.42, 'transition', 'solid', 1802, 'United Kingdom'],
    [47, 'Ag', 'Silver', 107.87, 'transition', 'solid', 0, ''],
    [48, 'Cd', 'Cadmium', 112.41, 'transition', 'solid', 1817, 'Germany'],
    [49, 'In', 'Indium', 114.82, 'post', 'solid', 1863, 'Germany'],
    [50, 'Sn', 'Tin', 118.71, 'post', 'solid', 0, ''],
    [51, 'Sb', 'Antimony', 121.76, 'metalloid', 'solid', 0, ''],
    [52, 'Te', 'Tellurium', 127.60, 'metalloid', 'solid', 1782, 'Austria (now Romania)'],
    [53, 'I', 'Iodine', 126.90, 'halogen', 'solid', 1811, 'France'],
    [54, 'Xe', 'Xenon', 131.29, 'noble', 'gas', 1898, 'United Kingdom'],
    [55, 'Cs', 'Caesium', 132.91, 'alkali', 'solid', 1860, 'Germany'],
    [56, 'Ba', 'Barium', 137.33, 'alkaline', 'solid', 1808, 'United Kingdom'],
    [57, 'La', 'Lanthanum', 138.91, 'lanthanide', 'solid', 1839, 'Sweden'],
    [58, 'Ce', 'Cerium', 140.12, 'lanthanide', 'solid', 1803, 'Sweden & Germany'],
    [59, 'Pr', 'Praseodymium', 140.91, 'lanthanide', 'solid', 1885, 'Austria'],
    [60, 'Nd', 'Neodymium', 144.24, 'lanthanide', 'solid', 1885, 'Austria'],
    [61, 'Pm', 'Promethium', 145, 'lanthanide', 'solid', 1945, 'United States'],
    [62, 'Sm', 'Samarium', 150.36, 'lanthanide', 'solid', 1879, 'France'],
    [63, 'Eu', 'Europium', 151.96, 'lanthanide', 'solid', 1901, 'France'],
    [64, 'Gd', 'Gadolinium', 157.25, 'lanthanide', 'solid', 1880, 'Switzerland'],
    [65, 'Tb', 'Terbium', 158.93, 'lanthanide', 'solid', 1843, 'Sweden'],
    [66, 'Dy', 'Dysprosium', 162.50, 'lanthanide', 'solid', 1886, 'France'],
    [67, 'Ho', 'Holmium', 164.93, 'lanthanide', 'solid', 1878, 'Sweden & Switzerland'],
    [68, 'Er', 'Erbium', 167.26, 'lanthanide', 'solid', 1843, 'Sweden'],
    [69, 'Tm', 'Thulium', 168.93, 'lanthanide', 'solid', 1879, 'Sweden'],
    [70, 'Yb', 'Ytterbium', 173.05, 'lanthanide', 'solid', 1878, 'Switzerland'],
    [71, 'Lu', 'Lutetium', 174.97, 'lanthanide', 'solid', 1907, 'France'],
    [72, 'Hf', 'Hafnium', 178.49, 'transition', 'solid', 1923, 'Denmark'],
    [73, 'Ta', 'Tantalum', 180.95, 'transition', 'solid', 1802, 'Sweden'],
    [74, 'W', 'Tungsten', 183.84, 'transition', 'solid', 1783, 'Spain'],
    [75, 'Re', 'Rhenium', 186.21, 'transition', 'solid', 1925, 'Germany'],
    [76, 'Os', 'Osmium', 190.23, 'transition', 'solid', 1803, 'United Kingdom'],
    [77, 'Ir', 'Iridium', 192.22, 'transition', 'solid', 1803, 'United Kingdom'],
    [78, 'Pt', 'Platinum', 195.08, 'transition', 'solid', 1748, 'Spain'],
    [79, 'Au', 'Gold', 196.97, 'transition', 'solid', 0, ''],
    [80, 'Hg', 'Mercury', 200.59, 'transition', 'liquid', 0, ''],
    [81, 'Tl', 'Thallium', 204.38, 'post', 'solid', 1861, 'United Kingdom'],
    [82, 'Pb', 'Lead', 207.2, 'post', 'solid', 0, ''],
    [83, 'Bi', 'Bismuth', 208.98, 'post', 'solid', 1753, 'France'],
    [84, 'Po', 'Polonium', 209, 'post', 'solid', 1898, 'France'],
    [85, 'At', 'Astatine', 210, 'halogen', 'solid', 1940, 'United States'],
    [86, 'Rn', 'Radon', 222, 'noble', 'gas', 1900, 'Germany'],
    [87, 'Fr', 'Francium', 223, 'alkali', 'solid', 1939, 'France'],
    [88, 'Ra', 'Radium', 226, 'alkaline', 'solid', 1898, 'France'],
    [89, 'Ac', 'Actinium', 227, 'actinide', 'solid', 1899, 'France'],
    [90, 'Th', 'Thorium', 232.04, 'actinide', 'solid', 1829, 'Sweden'],
    [91, 'Pa', 'Protactinium', 231.04, 'actinide', 'solid', 1913, 'Germany'],
    [92, 'U', 'Uranium', 238.03, 'actinide', 'solid', 1789, 'Germany'],
    [93, 'Np', 'Neptunium', 237, 'actinide', 'solid', 1940, 'United States'],
    [94, 'Pu', 'Plutonium', 244, 'actinide', 'solid', 1940, 'United States'],
    [95, 'Am', 'Americium', 243, 'actinide', 'solid', 1944, 'United States'],
    [96, 'Cm', 'Curium', 247, 'actinide', 'solid', 1944, 'United States'],
    [97, 'Bk', 'Berkelium', 247, 'actinide', 'solid', 1949, 'United States'],
    [98, 'Cf', 'Californium', 251, 'actinide', 'solid', 1950, 'United States'],
    [99, 'Es', 'Einsteinium', 252, 'actinide', 'solid', 1952, 'United States'],
    [100, 'Fm', 'Fermium', 257, 'actinide', 'unknown', 1952, 'United States'],
    [101, 'Md', 'Mendelevium', 258, 'actinide', 'unknown', 1955, 'United States'],
    [102, 'No', 'Nobelium', 259, 'actinide', 'unknown', 1966, 'Russia (USSR)'],
    [103, 'Lr', 'Lawrencium', 266, 'actinide', 'unknown', 1961, 'United States & Russia (USSR)'],
    [104, 'Rf', 'Rutherfordium', 267, 'transition', 'unknown', 1964, 'Russia (USSR) & United States'],
    [105, 'Db', 'Dubnium', 268, 'transition', 'unknown', 1968, 'Russia (USSR) & United States'],
    [106, 'Sg', 'Seaborgium', 269, 'transition', 'unknown', 1974, 'United States'],
    [107, 'Bh', 'Bohrium', 270, 'transition', 'unknown', 1981, 'Germany'],
    [108, 'Hs', 'Hassium', 269, 'transition', 'unknown', 1984, 'Germany'],
    [109, 'Mt', 'Meitnerium', 278, 'unknown', 'unknown', 1982, 'Germany'],
    [110, 'Ds', 'Darmstadtium', 281, 'unknown', 'unknown', 1994, 'Germany'],
    [111, 'Rg', 'Roentgenium', 282, 'unknown', 'unknown', 1994, 'Germany'],
    [112, 'Cn', 'Copernicium', 285, 'unknown', 'unknown', 1996, 'Germany'],
    [113, 'Nh', 'Nihonium', 286, 'unknown', 'unknown', 2004, 'Japan'],
    [114, 'Fl', 'Flerovium', 289, 'unknown', 'unknown', 1998, 'Russia & United States'],
    [115, 'Mc', 'Moscovium', 290, 'unknown', 'unknown', 2003, 'Russia & United States'],
    [116, 'Lv', 'Livermorium', 293, 'unknown', 'unknown', 2000, 'Russia & United States'],
    [117, 'Ts', 'Tennessine', 294, 'unknown', 'unknown', 2010, 'Russia & United States'],
    [118, 'Og', 'Oganesson', 294, 'unknown', 'unknown', 2002, 'Russia & United States']
  ];

  const TREND = {
    H: [53, 1312, 2.20], He: [31, 2372, null],
    Li: [167, 520, 0.98], Be: [112, 900, 1.57], B: [87, 801, 2.04], C: [67, 1086, 2.55], N: [56, 1402, 3.04], O: [48, 1314, 3.44], F: [42, 1681, 3.98], Ne: [38, 2081, null],
    Na: [190, 496, 0.93], Mg: [145, 738, 1.31], Al: [118, 578, 1.61], Si: [111, 787, 1.90], P: [98, 1012, 2.19], S: [88, 1000, 2.58], Cl: [79, 1251, 3.16], Ar: [71, 1521, null],
    K: [243, 419, 0.82], Ca: [194, 590, 1.00], Ga: [136, 579, 1.81], Ge: [125, 762, 2.01], As: [114, 947, 2.18], Se: [103, 941, 2.55], Br: [94, 1140, 2.96], Kr: [88, 1351, 3.00],
    Rb: [265, 403, 0.82], Sr: [219, 550, 0.95], In: [156, 558, 1.78], Sn: [145, 709, 1.96], Sb: [133, 834, 2.05], Te: [123, 869, 2.10], I: [115, 1008, 2.66], Xe: [108, 1170, 2.60],
    Cs: [298, 376, 0.79], Ba: [253, 503, 0.89]
  };

  const CAT = {
    alkali: ['Alkali metal', '#ff5d8f'], alkaline: ['Alkaline earth metal', '#ff9a5c'], transition: ['Transition metal', '#46d39a'],
    post: ['Post-transition metal', '#7fb2ff'], metalloid: ['Metalloid', '#e6d35a'], nonmetal: ['Reactive nonmetal', '#57d6f0'],
    halogen: ['Halogen', '#b98bff'], noble: ['Noble gas', '#c9a6ff'], lanthanide: ['Lanthanide', '#ffb3d9'], actinide: ['Actinide', '#ff8fb0'],
    unknown: ['Properties not yet measured', '#7a86a8']
  };

  /* where each element sits in the 18-column table: row 1–7, f-block rows 9–10 */
  function pos(Z) {
    const starts = [[1, 1], [3, 2], [11, 3], [19, 4], [37, 5], [55, 6], [87, 7]];
    if (Z >= 57 && Z <= 71) return { row: 9, col: Z - 57 + 3, period: 6, group: null };
    if (Z >= 89 && Z <= 103) return { row: 10, col: Z - 89 + 3, period: 7, group: null };
    let period = 1; for (const [s, p] of starts) if (Z >= s) period = p;
    let col;
    if (period === 1) col = Z === 1 ? 1 : 18;
    else if (period <= 3) { const i = Z - starts[period - 1][0]; col = i < 2 ? i + 1 : i + 11; }
    else if (period <= 5) col = Z - starts[period - 1][0] + 1;
    else { const i = Z - starts[period - 1][0]; col = i < 2 ? i + 1 : i - 13; }
    return { row: period, col, period, group: col };
  }

  const ELEMENTS = E.map(([Z, sym, name, mass, cat, state, year, country]) => {
    const p = pos(Z), t = TREND[sym];
    return { Z, sym, name, mass, cat, state, year, country, ...p,
      radius: t ? t[0] : null, ie: t ? t[1] : null, en: t ? t[2] : null };
  });
  const BY_SYM = Object.fromEntries(ELEMENTS.map(e => [e.sym, e]));

  /* ── electron configurations ── */
  const L = 'spdf';
  const ORDER = []; /* Madelung (n + l) filling order */
  for (let s = 1; s <= 8; s++) for (let l = Math.min(3, s - 1); l >= 0; l--) { const n = s - l; if (n > l && n <= 7) ORDER.push([n, l]); }
  const key = (n, l) => n + L[l];
  /* known ground-state exceptions to the filling order: electrons moved between subshells */
  const EXC = {
    24: { '4s': -1, '3d': 1 }, 29: { '4s': -1, '3d': 1 },
    41: { '5s': -1, '4d': 1 }, 42: { '5s': -1, '4d': 1 }, 44: { '5s': -1, '4d': 1 }, 45: { '5s': -1, '4d': 1 }, 46: { '5s': -2, '4d': 2 }, 47: { '5s': -1, '4d': 1 },
    57: { '4f': -1, '5d': 1 }, 58: { '4f': -1, '5d': 1 }, 64: { '4f': -1, '5d': 1 },
    78: { '6s': -1, '5d': 1 }, 79: { '6s': -1, '5d': 1 },
    89: { '5f': -1, '6d': 1 }, 90: { '5f': -2, '6d': 2 }, 91: { '5f': -1, '6d': 1 }, 92: { '5f': -1, '6d': 1 }, 93: { '5f': -1, '6d': 1 }, 96: { '5f': -1, '6d': 1 },
    103: { '6d': -1, '7p': 1 }
  };
  const EXC_WHY = {
    24: 'A half-filled 3d set (five unpaired electrons) is extra stable, so one 4s electron moves into 3d.',
    29: 'A completely filled 3d set is extra stable, so one 4s electron moves into 3d.',
    41: 'The 4d and 5s energies are very close, so niobium ends up with one 5s electron.',
    42: 'Like chromium above it: a half-filled 4d set is extra stable.',
    44: 'The 4d and 5s energies are very close in period 5, so ruthenium keeps only one 5s electron.',
    45: 'The 4d and 5s energies are very close in period 5, so rhodium keeps only one 5s electron.',
    46: 'Palladium is the strangest case: both 5s electrons drop into 4d to fill it completely.',
    47: 'Like copper above it: a completely filled 4d set is extra stable.',
    57: 'Lanthanum puts its first inner electron in 5d instead of 4f.',
    58: 'In cerium the 4f and 5d energies are nearly equal, so one electron sits in each.',
    64: 'A half-filled 4f set (seven electrons) is extra stable, so the next electron goes to 5d.',
    78: 'The 5d and 6s energies are very close, so platinum keeps only one 6s electron.',
    79: 'Like copper and silver: a completely filled 5d set is extra stable.',
    89: 'Actinium puts its first inner electron in 6d instead of 5f.',
    90: 'Thorium places both inner electrons in 6d instead of 5f.',
    91: 'The 5f and 6d energies are nearly equal in the early actinides.',
    92: 'The 5f and 6d energies are nearly equal in the early actinides.',
    93: 'The 5f and 6d energies are nearly equal in the early actinides.',
    96: 'A half-filled 5f set (seven electrons) is extra stable, so the next electron goes to 6d.',
    103: 'Relativistic effects in this heavy atom lower the 7p energy below 6d.'
  };
  const CAP = l => 2 * (2 * l + 1);

  /* configuration for Z protons and e electrons: neutral atom (with exceptions), then ions */
  function config(Z, e) {
    if (e == null) e = Z;
    const c = {}; let left = Math.min(Z, 118);
    for (const [n, l] of ORDER) { if (left <= 0) break; const k = Math.min(CAP(l), left); c[key(n, l)] = k; left -= k; }
    if (EXC[Z]) for (const k in EXC[Z]) c[k] = (c[k] || 0) + EXC[Z][k];
    if (e < Z) { /* cations lose electrons from the highest n first, then the highest l */
      let r = Z - e;
      while (r > 0) { const ks = Object.keys(c).filter(k => c[k] > 0).sort((a, b) => (+b[0] - +a[0]) || (L.indexOf(b[1]) - L.indexOf(a[1]))); if (!ks.length) break; c[ks[0]]--; r--; }
    } else if (e > Z) { /* anions gain electrons in filling order */
      let r = e - Z;
      for (const [n, l] of ORDER) { if (r <= 0) break; const k = key(n, l), have = c[k] || 0, room = CAP(l) - have; if (room > 0) { const add = Math.min(room, r); c[k] = have + add; r -= add; } }
    }
    return ORDER.map(([n, l]) => ({ n, l, k: key(n, l), e: c[key(n, l)] || 0 })).filter(s => s.e > 0);
  }
  /* the simple filling-order prediction, with no exceptions applied */
  function aufbau(e) { const out = []; let left = e; for (const [n, l] of ORDER) { if (left <= 0) break; const k = Math.min(CAP(l), left); out.push({ n, l, k: key(n, l), e: k }); left -= k; } return out; }
  const sup = n => String(n).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
  const fmt = cfg => cfg.map(s => s.k + sup(s.e)).join(' ');
  const NOBLE = [[86, 'Rn'], [54, 'Xe'], [36, 'Kr'], [18, 'Ar'], [10, 'Ne'], [2, 'He']];
  function nobleFmt(Z, e) {
    const cfg = config(Z, e), total = cfg.reduce((a, s) => a + s.e, 0);
    for (const [nz, ns] of NOBLE) {
      if (nz >= total) continue;
      const core = config(nz); const rest = [];
      let ok = true; const coreMap = Object.fromEntries(core.map(s => [s.k, s.e]));
      for (const s of cfg) { const ce = coreMap[s.k] || 0; if (s.e < ce) { ok = false; break; } if (s.e > ce) rest.push({ ...s, e: s.e - ce }); }
      for (const k in coreMap) if (!cfg.some(s => s.k === k)) ok = false;
      if (ok) return '[' + ns + '] ' + fmt(rest);
    }
    return fmt(cfg);
  }
  /* Slater's rules: effective nuclear charge felt by one electron in subshell (n, l) */
  function zeff(Z, e, n, l) {
    const cfg = config(Z, e); const grp = (sn, sl) => (sl <= 1 ? sn + 'sp' : sn + L[sl]);
    const me = grp(n, l); let S = 0;
    for (const s of cfg) {
      const g2 = grp(s.n, s.l); let cnt = s.e; if (s.n === n && s.l === l) cnt -= 1; if (cnt <= 0) continue;
      if (g2 === me) S += cnt * (n === 1 ? 0.30 : 0.35);
      else if (l <= 1) { if (s.n === n - 1) S += cnt * 0.85; else if (s.n < n - 1) S += cnt * 1.0; else if (s.n === n && s.l >= 2) S += 0; /* none */ }
      else { const before = s.n < n || (s.n === n && s.l < l); if (before) S += cnt * 1.0; }
    }
    return { zeff: Z - S, S };
  }

  g.CHEM = { ELEMENTS, BY_SYM, CAT, ORDER, EXC, EXC_WHY, CAP, config, aufbau, fmt, nobleFmt, zeff, sup, L };
})(window);
