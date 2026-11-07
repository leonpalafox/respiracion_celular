/* Modelos 3D: átomos, moléculas, transportadores, ATP, mitocondria y membrana. */
(function () {
  'use strict';
  const T = THREE;
  const M = (window.M = {});

  // Un color para cada cosa. El mismo color tiene siempre el mismo significado.
  const COL = (M.COL = {
    C: 0x3a404c, O: 0xe5484d, H: 0xf3f5f8, N: 0x2f6fe0, P: 0xf08a24,
    glucosa: 0x84cc16, piruvato: 0x14b8a6, acetil: 0x0891b2, coa: 0x6366f1,
    ciclo: 0xfb7185, lactato: 0xb7791f, etanol: 0x64748b,
    atp: 0xfacc15, nadh: 0x2563eb, nad: 0x9cc3fb, fadh: 0x7c3aed, fad: 0xc9b8fb,
    proton: 0xdb2777, electron: 0x06b6d4,
    outer: 0xf59e5b, inner: 0xf27a8f, matrix: 0xfbd3ad, ims: 0xf7c6d6, cytosol: 0xcfe6f6,
    complejo: 0x7cc7f2, sintasa: 0x34c48b,
  });
  M.hex = (c) => '#' + c.toString(16).padStart(6, '0');

  const shared = new Set();
  const G = (M.geo = {
    sph: new T.SphereGeometry(1, 28, 18),
    lo: new T.SphereGeometry(1, 14, 10),
    cyl: new T.CylinderGeometry(1, 1, 1, 16),
    pill: new T.CapsuleGeometry(0.17, 0.52, 6, 18),
    coin: new T.CylinderGeometry(0.42, 0.42, 0.11, 32),
  });
  Object.values(G).forEach((g) => shared.add(g));

  const mats = {};
  M.mat = function (hex, o) {
    o = o || {};
    const key = [hex, o.opacity, o.emissive, o.side, o.rough, o.flat].join('|');
    if (mats[key]) return mats[key];
    const m = new T.MeshStandardMaterial({
      color: hex,
      roughness: o.rough == null ? 0.42 : o.rough,
      metalness: 0.04,
      transparent: o.opacity != null && o.opacity < 1,
      opacity: o.opacity == null ? 1 : o.opacity,
      emissive: o.emissive ? hex : 0x000000,
      emissiveIntensity: o.emissive || 0,
      side: o.side || T.FrontSide,
      flatShading: !!o.flat,
      depthWrite: !(o.opacity != null && o.opacity < 0.6),
    });
    shared.add(m);
    mats[key] = m;
    return m;
  };
  // material propio (no compartido): para objetos que cambian de color o transparencia
  M.own = function (hex, o) {
    const m = M.mat(hex, o).clone();
    m.transparent = true;
    m.userData.base = m.opacity;
    return m;
  };

  M.dispose = function (obj) {
    obj.traverse((o) => {
      if (o.geometry && !shared.has(o.geometry)) o.geometry.dispose();
      if (o.material) {
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach((m) => { if (!shared.has(m)) m.dispose(); });
      }
    });
  };

  // Transparencia de un grupo completo. Clona materiales compartidos la primera vez.
  M.alpha = function (obj, a) {
    obj.userData.alpha = a;
    obj.traverse((o) => {
      if (!o.material) return;
      if (shared.has(o.material)) {
        o.material = o.material.clone();
        o.material.userData.base = o.material.opacity;
      }
      const m = o.material;
      if (m.userData.base == null) m.userData.base = m.opacity;
      m.transparent = true;
      m.opacity = m.userData.base * a;
    });
    obj.visible = a > 0.01;
  };

  M.sphere = function (r, hex, o) {
    const m = new T.Mesh(o && o.lo ? G.lo : G.sph, M.mat(hex, o));
    m.scale.setScalar(r);
    return m;
  };
  M.bond = function (a, b, r, hex) {
    const m = new T.Mesh(G.cyl, M.mat(hex || 0xc7d0da));
    m.userData.r = r || 0.055;
    M.placeBond(m, a, b);
    return m;
  };
  const up = new T.Vector3(0, 1, 0);
  M.placeBond = function (m, a, b) {
    const d = new T.Vector3().subVectors(b, a);
    const len = d.length();
    m.position.copy(a).addScaledVector(d, 0.5);
    m.scale.set(m.userData.r, Math.max(0.001, len), m.userData.r);
    if (len > 1e-6) m.quaternion.setFromUnitVectors(up, d.divideScalar(len));
  };

  /* ---------- texto como sprite ---------- */
  const texCache = {};
  function textTexture(text, o) {
    const key = [text, o.color, o.bg, o.border, o.weight].join('|');
    if (texCache[key]) return texCache[key];
    const fs = 72;
    const font = `${o.weight || 600} ${fs}px Fredoka, "Atkinson Hyperlegible", system-ui, sans-serif`;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    g.font = font;
    const tw = Math.ceil(g.measureText(text).width);
    const w = tw + (o.bg ? 64 : 40), h = 112;
    c.width = w; c.height = h;
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    if (o.bg) {
      const r = 40;
      g.beginPath();
      g.moveTo(r + 4, 4); g.arcTo(w - 4, 4, w - 4, h - 4, r); g.arcTo(w - 4, h - 4, 4, h - 4, r);
      g.arcTo(4, h - 4, 4, 4, r); g.arcTo(4, 4, w - 4, 4, r); g.closePath();
      g.fillStyle = o.bg; g.fill();
      if (o.border) { g.lineWidth = 6; g.strokeStyle = o.border; g.stroke(); }
    } else {
      g.lineJoin = 'round';
      g.lineWidth = 16;
      g.strokeStyle = o.stroke || 'rgba(255,255,255,0.96)';
      g.strokeText(text, w / 2, h / 2 + 4);
    }
    g.fillStyle = o.color || '#1e293b';
    g.fillText(text, w / 2, h / 2 + 4);
    const tex = new T.CanvasTexture(c);
    tex.encoding = T.sRGBEncoding;
    tex.anisotropy = 4;
    tex.userData.aspect = w / h;
    shared.add(tex);
    texCache[key] = tex;
    return tex;
  }
  M.text = function (text, o) {
    o = o || {};
    const tex = textTexture(text, o);
    const mat = new T.SpriteMaterial({ map: tex, depthTest: !!o.depthTest, depthWrite: false, transparent: true });
    const s = new T.Sprite(mat);
    const sc = o.size || 0.3;
    s.scale.set(sc * tex.userData.aspect, sc, 1);
    s.renderOrder = 20;
    s.userData.size = sc;
    s.userData.opts = o;
    return s;
  };
  M.retext = function (s, text, o) {
    o = Object.assign({}, s.userData.opts, o || {});
    const tex = textTexture(text, o);
    s.material.map = tex;
    s.material.needsUpdate = true;
    s.scale.set(s.userData.size * tex.userData.aspect, s.userData.size, 1);
    s.userData.opts = o;
  };

  /* ---------- brillo (sprite radial) ---------- */
  let glowTex = null;
  M.glow = function (hex, size, o) {
    if (!glowTex) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      glowTex = new T.CanvasTexture(c);
      shared.add(glowTex);
    }
    const add = !(o && o.normal);
    const s = new T.Sprite(new T.SpriteMaterial({
      map: glowTex, color: hex, transparent: true, depthWrite: false,
      blending: add ? T.AdditiveBlending : T.NormalBlending, opacity: (o && o.opacity) || 0.9,
    }));
    s.scale.setScalar(size);
    return s;
  };

  /* ---------- moléculas simples ---------- */
  function ballStick(atoms, bonds) {
    const g = new T.Group();
    const ms = atoms.map(([e, r, x, y, z]) => {
      const m = M.sphere(r, COL[e]);
      m.position.set(x, y, z || 0);
      g.add(m);
      return m;
    });
    bonds.forEach(([a, b]) => g.add(M.bond(ms[a].position, ms[b].position, 0.045)));
    g.userData.atoms = ms;
    return g;
  }
  M.co2 = () => ballStick([['C', 0.17, 0, 0], ['O', 0.16, -0.34, 0], ['O', 0.16, 0.34, 0]], [[0, 1], [0, 2]]);
  M.o2 = () => ballStick([['O', 0.16, -0.15, 0], ['O', 0.16, 0.15, 0]], [[0, 1]]);
  M.oAtom = () => ballStick([['O', 0.17, 0, 0]], []);
  M.h2o = function () {
    const a = (104.5 / 2) * (Math.PI / 180);
    return ballStick([
      ['O', 0.17, 0, 0], ['H', 0.1, Math.sin(a) * 0.27, -Math.cos(a) * 0.27], ['H', 0.1, -Math.sin(a) * 0.27, -Math.cos(a) * 0.27],
    ], [[0, 1], [0, 2]]);
  };
  M.nitrate = function () {
    const at = [['N', 0.15, 0, 0]];
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i * 2 * Math.PI) / 3;
      at.push(['O', 0.15, Math.cos(a) * 0.3, Math.sin(a) * 0.3]);
    }
    return ballStick(at, [[0, 1], [0, 2], [0, 3]]);
  };
  M.nitrite = function () {
    const at = [['N', 0.15, 0, 0]];
    [-0.5, 0.5].forEach((s) => at.push(['O', 0.15, Math.sin(s * 2.1) * 0.3, -Math.cos(s * 2.1) * 0.3 + 0.1]));
    return ballStick(at, [[0, 1], [0, 2]]);
  };

  M.proton = () => M.sphere(0.075, COL.proton, { lo: true });
  M.electron = function () {
    const g = new T.Group();
    g.add(M.sphere(0.06, COL.electron, { emissive: 0.6, lo: true }));
    g.add(M.glow(COL.electron, 0.42));
    return g;
  };

  /* ---------- esqueleto de carbonos (glucosa, piruvato, acetilo...) ---------- */
  M.layout = function (n, kind) {
    const out = [];
    if (kind === 'ring') {
      for (let i = 0; i < n; i++) {
        const a = Math.PI / 2 + (i * 2 * Math.PI) / n;
        out.push(new T.Vector3(Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0));
      }
    } else {
      for (let i = 0; i < n; i++) out.push(new T.Vector3((i - (n - 1) / 2) * 0.42, i % 2 ? 0.13 : -0.13, 0));
    }
    return out;
  };
  // Crea un grupo de carbonos con enlaces que siguen a los átomos.
  M.skeleton = function (n, o) {
    o = o || {};
    const g = new T.Group();
    const pos = M.layout(n, o.layout || 'chain');
    const atoms = pos.map((p) => {
      const a = M.sphere(0.19, COL.C);
      a.position.copy(p);
      g.add(a);
      return a;
    });
    g.userData.atoms = atoms;
    g.userData.bonds = [];
    const closed = o.layout === 'ring';
    for (let i = 0; i < n - 1 + (closed ? 1 : 0); i++) M.link(g, atoms[i], atoms[(i + 1) % n]);
    if (o.color != null) {
      const halo = M.glow(o.color, 1.6 + n * 0.12, { normal: true, opacity: 0.55 });
      halo.position.z = -0.25;
      halo.renderOrder = -1;
      g.add(halo);
      g.userData.halo = halo;
    }
    if (o.label) {
      const t = M.text(o.label, { size: o.size || 0.3, color: '#0f172a' });
      t.position.set(0, o.labelY == null ? -0.62 : o.labelY, 0.3);
      g.add(t);
      g.userData.label = t;
    }
    return g;
  };
  M.link = function (g, a, b) {
    const m = M.bond(a.position, b.position, 0.05);
    g.add(m);
    g.userData.bonds.push({ m, a, b });
    return m;
  };
  M.unlink = function (g, a, b) {
    const bs = g.userData.bonds;
    for (let i = bs.length - 1; i >= 0; i--) {
      const x = bs[i];
      if ((x.a === a && x.b === b) || (x.a === b && x.b === a)) { g.remove(x.m); bs.splice(i, 1); }
    }
  };
  M.refresh = function (g) {
    g.userData.bonds.forEach((x) => M.placeBond(x.m, x.a.position, x.b.position));
  };

  /* ---------- ATP / ADP ---------- */
  M.atp = function (nP, o) {
    o = o || {};
    const g = new T.Group();
    const c = new T.Group();
    c.position.x = -0.24;
    g.add(c);
    const body = M.sphere(0.2, COL.atp);
    c.add(body);
    const ps = [];
    for (let i = 0; i < 3; i++) {
      const p = M.sphere(0.105, COL.P);
      p.position.set(0.3 + i * 0.21, 0, 0);
      c.add(p);
      ps.push(p);
    }
    const bonds = ps.map((p, i) => {
      const b = M.bond(i ? ps[i - 1].position : body.position, p.position, 0.04);
      c.add(b);
      return b;
    });
    const lab = M.text('ATP', { size: o.size || 0.26, color: '#3f2d00' });
    lab.position.set(0.22, 0.34, 0.1);
    if (o.label !== false) c.add(lab);
    g.userData = { ps, bonds, lab, n: 3, alpha: 1 };
    M.setP(g, nP == null ? 3 : nP);
    return g;
  };
  M.setP = function (g, n) {
    g.userData.n = n;
    g.userData.ps.forEach((p, i) => (p.visible = i < n));
    g.userData.bonds.forEach((b, i) => (b.visible = i < n));
    M.retext(g.userData.lab, n === 3 ? 'ATP' : 'ADP');
  };
  M.pi = function () {
    const g = new T.Group();
    g.add(M.sphere(0.105, COL.P));
    const t = M.text('Pi', { size: 0.2, color: '#5a2a00' });
    t.position.set(0, 0.24, 0.1);
    g.add(t);
    return g;
  };

  /* ---------- transportadores de electrones: NADH, NAD+, FADH2, FAD ---------- */
  const CARR = {
    NADH: { c: COL.nadh, t: 'NADH', e: true, ink: '#ffffff' },
    'NAD+': { c: COL.nad, t: 'NAD⁺', e: false, ink: '#0b2a66' },
    FADH2: { c: COL.fadh, t: 'FADH₂', e: true, ink: '#ffffff' },
    FAD: { c: COL.fad, t: 'FAD', e: false, ink: '#2e1065' },
  };
  M.carrier = function (kind) {
    const g = new T.Group();
    const body = new T.Mesh(G.pill, M.own(CARR[kind].c));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    const lab = M.text(CARR[kind].t, { size: 0.24, color: CARR[kind].ink, stroke: 'rgba(0,0,0,0)' });
    lab.position.z = 0.2;
    g.add(lab);
    const es = [-0.2, 0.2].map((x) => {
      const e = M.electron();
      e.position.set(x, 0.27, 0.05);
      g.add(e);
      return e;
    });
    g.userData = { body, lab, es, kind, alpha: 1 };
    M.setCarrier(g, kind);
    return g;
  };
  M.setCarrier = function (g, kind) {
    const d = CARR[kind];
    g.userData.kind = kind;
    g.userData.body.material.color.setHex(d.c);
    M.retext(g.userData.lab, d.t, { color: d.ink });
    g.userData.es.forEach((e) => (e.visible = d.e));
  };

  /* ---------- coenzima A (cola) ---------- */
  M.coa = function () {
    const g = new T.Group();
    const m = new T.Mesh(G.pill, M.mat(COL.coa));
    m.rotation.z = Math.PI / 2;
    m.scale.set(0.8, 0.8, 0.8);
    g.add(m);
    const t = M.text('CoA', { size: 0.22, color: '#ffffff', stroke: 'rgba(0,0,0,0)' });
    t.position.z = 0.2;
    g.add(t);
    return g;
  };

  /* ---------- mitocondria pequeña (vista externa) ---------- */
  M.miniMito = function (len) {
    len = len || 1.6;
    const g = new T.Group();
    const shell = new T.Mesh(new T.CapsuleGeometry(0.42, len, 8, 24), M.mat(COL.outer, { opacity: 0.55 }));
    shell.rotation.z = Math.PI / 2;
    g.add(shell);
    const pts = [];
    const n = 7;
    for (let i = 0; i <= n * 8; i++) {
      const u = i / (n * 8);
      const x = (u - 0.5) * (len + 0.2);
      pts.push(new T.Vector3(x, Math.sin(u * n * Math.PI * 2) * 0.27, 0));
    }
    const tube = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 120, 0.05, 8, false), M.mat(COL.inner));
    g.add(tube);
    return g;
  };

  /* ---------- mitocondria en corte (diagrama 3D) ---------- */
  function stadium(L, r, n) {
    // contorno de estadio con n puntos, sentido antihorario
    const pts = [];
    const per = 2 * L + 2 * Math.PI * r;
    for (let i = 0; i < n; i++) {
      let s = (i / n) * per;
      if (s < L) { pts.push([L / 2 - s, r]); continue; }
      s -= L;
      if (s < Math.PI * r) { const a = Math.PI / 2 + s / r; pts.push([-L / 2 + Math.cos(a) * r, Math.sin(a) * r]); continue; }
      s -= Math.PI * r;
      if (s < L) { pts.push([-L / 2 + s, -r]); continue; }
      s -= L;
      const a = -Math.PI / 2 + s / r;
      pts.push([L / 2 + Math.cos(a) * r, Math.sin(a) * r]);
    }
    return pts;
  }
  // membrana interna con crestas (pliegues)
  function innerCurve(L, r, depth, topX, botX, w) {
    const pts = [];
    const fold = (x0, side) => {
      // side = +1 arriba (baja hacia el centro), -1 abajo
      const yb = side * r, yt = side * (r - depth);
      const dir = side > 0 ? -1 : 1; // recorrido: arriba de derecha a izquierda, abajo de izquierda a derecha
      const xa = x0 - dir * w, xb = x0 + dir * w;
      const steps = 10;
      for (let i = 0; i <= steps; i++) pts.push([xa, yb + ((yt - yb) * i) / steps]);
      for (let i = 1; i < 12; i++) {
        const a = Math.PI * (i / 12);
        pts.push([x0 - dir * w * Math.cos(a), yt - side * w * Math.sin(a)]);
      }
      for (let i = 0; i <= steps; i++) pts.push([xb, yt + ((yb - yt) * i) / steps]);
    };
    const seg = (x1, x2, y) => { const n = Math.max(2, Math.ceil(Math.abs(x2 - x1) / 0.1)); for (let i = 0; i < n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y]); };
    // arriba: de x=L/2 a -L/2
    const tops = topX.slice().sort((a, b) => b - a);
    let x = L / 2;
    tops.forEach((x0) => { seg(x, x0 + w, r); fold(x0, 1); x = x0 - w; });
    seg(x, -L / 2, r);
    for (let i = 0; i < 30; i++) { const a = Math.PI / 2 + (Math.PI * i) / 30; pts.push([-L / 2 + Math.cos(a) * r, Math.sin(a) * r]); }
    const bots = botX.slice().sort((a, b) => a - b);
    x = -L / 2;
    bots.forEach((x0) => { seg(x, x0 - w, -r); fold(x0, -1); x = x0 + w; });
    seg(x, L / 2, -r);
    for (let i = 0; i < 30; i++) { const a = -Math.PI / 2 + (Math.PI * i) / 30; pts.push([L / 2 + Math.cos(a) * r, Math.sin(a) * r]); }
    return pts;
  }
  function wall(pts, z0, z1, mat) {
    const pos = [], idx = [];
    pts.forEach(([x, y]) => { pos.push(x, y, z0, x, y, z1); });
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      idx.push(2 * i, 2 * j, 2 * i + 1, 2 * i + 1, 2 * j, 2 * j + 1);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return new T.Mesh(geo, mat);
  }
  function rim(pts, z, rad, mat) {
    const v = pts.map(([x, y]) => new T.Vector3(x, y, z));
    return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(v, true, 'catmullrom', 0.0), v.length * 2, rad, 6, true), mat);
  }
  function shapeOf(pts) {
    const s = new T.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    s.closePath();
    return s;
  }
  M.mitoCut = function (o) {
    o = o || {};
    const L = o.L || 5.4, R = o.R || 1.75, Ri = o.Ri || 1.45, D = o.D || 0.55;
    const g = new T.Group();
    const outerPts = stadium(L, R, 260);
    const innerPts = innerCurve(L, Ri, 1.75, [-1.95, -0.65, 0.65, 1.95], [-1.3, 0, 1.3], 0.1);
    const parts = {};
    parts.outerMat = M.own(COL.outer, { side: T.DoubleSide });
    parts.innerMat = M.own(COL.inner, { side: T.DoubleSide });
    parts.outer = wall(outerPts, -D, D, parts.outerMat);
    parts.inner = wall(innerPts, -D * 0.92, D * 0.92, parts.innerMat);
    g.add(parts.outer, parts.inner);
    const rimO = new T.MeshStandardMaterial({ color: 0xd9772f, roughness: 0.5 });
    const rimI = new T.MeshStandardMaterial({ color: 0xd65a72, roughness: 0.5 });
    g.add(rim(outerPts, D, 0.045, rimO), rim(innerPts, D * 0.92, 0.04, rimI));
    // espacio intermembranal (fondo entre las dos membranas)
    const imsShape = shapeOf(outerPts);
    imsShape.holes.push(shapeOf(innerPts.slice().reverse()));
    parts.imsMat = M.own(COL.ims, { side: T.DoubleSide });
    parts.ims = new T.Mesh(new T.ShapeGeometry(imsShape), parts.imsMat);
    parts.ims.position.z = -D * 0.95;
    parts.matrixMat = M.own(COL.matrix, { side: T.DoubleSide });
    parts.matrix = new T.Mesh(new T.ShapeGeometry(shapeOf(innerPts)), parts.matrixMat);
    parts.matrix.position.z = -D * 0.9;
    g.add(parts.ims, parts.matrix);
    // gránulos en la matriz
    const dots = new T.Group();
    for (let i = 0; i < 40; i++) {
      const x = E.rand(-L / 2 - 0.6, L / 2 + 0.6), y = E.rand(-0.9, 0.9);
      const s = M.sphere(0.04, 0xe8b48d, { lo: true });
      s.position.set(x, y, E.rand(-D * 0.8, -D * 0.2));
      dots.add(s);
    }
    g.add(dots);
    g.userData = { parts, L, R, Ri, D, innerPts, outerPts };
    return g;
  };

  /* ---------- membrana (bicapa de fosfolípidos) ---------- */
  M.membrane = function (o) {
    o = o || {};
    const w = o.w || 12, d = o.d || 3.2, sp = 0.27;
    const g = new T.Group();
    const nx = Math.floor(w / sp), nz = Math.floor(d / sp);
    const im = new T.InstancedMesh(G.lo, M.mat(o.head || 0xf4a3b4), nx * nz * 2);
    const m4 = new T.Matrix4();
    let k = 0;
    for (let s = -1; s <= 1; s += 2)
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) {
          const x = -w / 2 + (i + 0.5) * sp + (j % 2 ? sp / 2 : 0) - sp / 4;
          const z = -d / 2 + (j + 0.5) * sp;
          m4.makeScale(0.125, 0.125, 0.125).setPosition(x, s * 0.36, z);
          im.setMatrixAt(k++, m4);
        }
    g.add(im);
    const core = new T.Mesh(new T.BoxGeometry(w, 0.55, d), M.mat(o.core || 0xfbe7c6));
    g.add(core);
    return g;
  };
})();
