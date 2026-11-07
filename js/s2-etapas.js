/* Estaciones 3–5: glucólisis, oxidación del piruvato, ciclo de Krebs. */
(function () {
  'use strict';
  const T = THREE;
  const C = M.COL;
  const V = (x, y, z) => new T.Vector3(x, y, z || 0);
  const tmp = new T.Vector3();
  // posición de un objeto en coordenadas del pivote (raíz de la escena)
  function rootPos(o) {
    o.getWorldPosition(tmp);
    return E.pivot.worldToLocal(tmp.clone());
  }
  M.rootPos = rootPos;

  // Electrones que vuelan de un punto a un transportador y lo cargan.
  async function charge(root, fromObj, carrier, kind, dur) {
    const from = fromObj.isVector3 ? fromObj : rootPos(fromObj);
    const es = carrier.userData.es.map(() => {
      const e = M.electron();
      e.position.copy(from);
      root.add(e);
      return e;
    });
    await Promise.all(es.map((e, i) => E.move(e, rootPos(carrier.userData.es[i]), dur || 0.6, { arc: 0.25, delay: i * 0.08 })));
    es.forEach((e) => root.remove(e));
    M.setCarrier(carrier, kind);
    await E.scale(carrier, 1.25, 0.12).then(() => E.scale(carrier, 1, 0.18));
  }
  M.charge = charge;

  function resultBox(items) {
    return `<div class="result hide" id="result"><div class="result-h">Resultado por cada glucosa</div><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`;
  }
  function counters(list) {
    return `<div class="counters">${list.map(([id, n, c]) => `<div class="ct"><i style="background:${c}"></i><b id="${id}">0</b><span>${n}</span></div>`).join('')}</div>`;
  }

  /* ===================== 3. GLUCÓLISIS ===================== */
  App.add({
    id: 'glucolisis',
    nav: 'Glucólisis',
    kicker: 'Sección 3 · Etapa 1 · Citosol',
    title: 'Glucólisis',
    place: 'citosol',
    ledger: true,
    legend: ['C', 'P', 'ATP', 'NAD', 'NADH', 'e'],
    frame: { look: [0, 0.05, 0], dir: [0, 0.1, 1], w: 9.8, h: 6.0 },
    rotate: { yaw: 0.7, pitch: 0.3 },
    html: `
      <p>La glucosa tiene <b>6 átomos de carbono</b>.</p>
      <p>La célula transforma una glucosa en <b>2 piruvatos</b>. Cada piruvato tiene <b>3 átomos de carbono</b>.</p>
      <p class="formula">Glucosa (6 C) → 2 piruvatos (3 C)</p>
      <p>Pulsa «Siguiente paso». Observa cada paso en la imagen.</p>
      <ol class="steplist" id="sl">
        <li>La célula usa 2 ATP. Cada ATP entrega un fosfato a la glucosa.</li>
        <li>La glucosa se divide en dos partes. Cada parte tiene 3 carbonos.</li>
        <li>Cada parte entrega electrones a un NAD⁺. Se forman 2 NADH. Cada parte también recibe un fosfato (Pi).</li>
        <li>Las dos partes entregan 4 fosfatos al ADP. Se forman 4 ATP y 2 piruvatos.</li>
      </ol>
      <div class="controls"><button class="btn primary" id="step">Siguiente paso →</button></div>
      ${counters([['c-used', 'ATP usados', M.hex(C.adp || 0xfde68a)], ['c-made', 'ATP formados', M.hex(C.atp)], ['c-net', 'ATP netos', M.hex(C.atp)], ['c-nadh', 'NADH', M.hex(C.nadh)]])}
      <p class="note">El <b>NADH</b> transporta electrones que llevan energía.</p>
      <div class="callout">La glucólisis <b>no usa oxígeno</b> directamente.</div>
      ${resultBox(['2 piruvatos', '2 ATP netos', '2 NADH'])}
    `,
    build(ctx) {
      const root = ctx.root;
      const glu = M.skeleton(6, { layout: 'ring', color: C.glucosa, label: 'Glucosa', labelY: -0.98, size: 0.32 });
      glu.position.set(0, 0.25, 0);
      root.add(glu);
      const A = glu.userData.atoms;
      const follow = []; // fosfatos unidos a un átomo
      const cnt = { used: 0, made: 0, nadh: 0 };
      function show() {
        App.setCount(ctx, '#c-used', cnt.used);
        App.setCount(ctx, '#c-made', cnt.made);
        const n = cnt.made - cnt.used;
        App.setCount(ctx, '#c-net', n > 0 ? '+' + n : n);
        App.setCount(ctx, '#c-nadh', cnt.nadh);
      }
      const atpIn = [M.atp(3), M.atp(3)];
      atpIn[0].position.set(-3.9, 1.6, 0);
      atpIn[1].position.set(-3.9, -1.1, 0);
      atpIn.forEach((a) => root.add(a));
      const lUsed = E.label('2 ATP', [-3.9, 2.25, 0], { cls: 'tag' });

      const halves = [[A[2], A[1], A[0]], [A[3], A[4], A[5]]];
      const centers = [V(-1.8, 0, 0), V(1.8, 0, 0)];
      const halfHalo = [], halfLab = [];
      centers.forEach((c) => {
        const h = M.glow(0x9fd6c6, 1.9, { normal: true, opacity: 0.5 });
        h.position.copy(c).setZ(-0.25);
        h.renderOrder = -1;
        M.alpha(h, 0);
        glu.add(h);
        halfHalo.push(h);
        const t = M.text('3 C', { size: 0.3 });
        t.position.copy(c).add(V(0, -0.62, 0.3));
        t.visible = false;
        glu.add(t);
        halfLab.push(t);
      });

      const s1 = async () => {
        lUsed.show(false);
        await Promise.all(atpIn.map((a, i) => E.move(a, i ? V(-1.3, -1.0, 0) : V(-1.3, 1.55, 0), 0.8)));
        const tgt = [A[0], A[3]];
        await Promise.all(atpIn.map(async (a, i) => {
          const p = M.sphere(0.105, C.P);
          p.position.copy(rootPos(a.userData.ps[2]));
          root.add(p);
          M.setP(a, 2);
          const off = V(0, i ? -0.36 : 0.36, 0);
          const dest = rootPos(tgt[i]).add(off);
          await E.move(p, dest, 0.7, { arc: 0.3 });
          follow.push({ p, a: tgt[i], off });
        }));
        cnt.used = 2; show();
        atpIn.forEach((a, i) => { E.move(a, V(-4.1, i ? -2.2 : 2.2, 0), 1.0); E.fade(a, 0.45, 1.0); });
        E.label('2 ADP', [-4.1, 2.85, 0], { cls: 'tag muted' });
        await E.wait(0.6);
      };
      const s2 = async () => {
        M.unlink(glu, A[2], A[3]);
        M.unlink(glu, A[5], A[0]);
        E.fade(glu.userData.halo, 0, 0.5);
        glu.userData.label.visible = false;
        const lay = M.layout(3, 'chain');
        const from = A.map((a) => a.position.clone());
        const to = new Map();
        halves.forEach((h, i) => h.forEach((a, j) => to.set(a, lay[j].clone().add(centers[i]))));
        const off3 = follow[1].off.clone();
        await E.anim(1.1, (k) => {
          A.forEach((a, i) => a.position.lerpVectors(from[i], to.get(a), k));
          follow[1].off.lerpVectors(off3, V(0, 0.36, 0), k);
          M.refresh(glu);
        });
        halfHalo.forEach((h) => E.fade(h, 1, 0.4));
        halfLab.forEach((t) => (t.visible = true));
        await E.wait(0.3);
      };
      const nads = [];
      const s3 = async () => {
        const jobs = centers.map(async (c, i) => {
          const n = M.carrier('NAD+');
          n.position.set(c.x, -2.8, 0);
          root.add(n);
          nads.push(n);
          await E.move(n, V(c.x, -0.95, 0), 0.7);
          await charge(root, V(c.x, 0.25, 0.1), n, 'NADH', 0.55);
          await E.move(n, V(i ? 0.6 : -0.6, -2.35, 0), 0.7);
          cnt.nadh++; show();
          // fosfato del citosol
          const pi = M.sphere(0.105, C.P);
          pi.position.set(c.x - 0.6, 2.8, 0);
          root.add(pi);
          const atom = i ? halves[1][2] : halves[0][0];
          const off = V(0, 0.36, 0);
          await E.move(pi, rootPos(atom).add(off), 0.6);
          follow.push({ p: pi, a: atom, off });
        });
        await Promise.all(jobs);
        E.label('2 NADH', [0, -2.95, 0], { cls: 'tag' });
        await E.wait(0.2);
      };
      const s4 = async () => {
        const adps = [];
        const xs = [-2.25, -1.35, 1.35, 2.25];
        xs.forEach((x) => {
          const a = M.atp(2);
          a.position.set(x, 3.0, 0);
          root.add(a);
          adps.push(a);
        });
        await Promise.all(adps.map((a, i) => E.move(a, V(xs[i], 1.45, 0), 0.7, { delay: i * 0.06 })));
        // cada mitad entrega sus 2 fosfatos
        const byX = (a, b) => rootPos(a.p).x - rootPos(b.p).x;
        const order = follow.filter((f) => halves[0].includes(f.a)).sort(byX)
          .concat(follow.filter((f) => halves[1].includes(f.a)).sort(byX));
        follow.length = 0;
        await Promise.all(order.map(async (f, i) => {
          await E.move(f.p, rootPos(adps[i].userData.ps[2]), 0.55, { delay: i * 0.1, arc: 0.2 });
          root.remove(f.p);
          M.setP(adps[i], 3);
          cnt.made++; show();
          await E.scale(adps[i], 1.3, 0.12).then(() => E.scale(adps[i], 1, 0.15));
        }));
        await Promise.all(adps.map((a, i) => E.move(a, V(-1.65 + i * 1.1, 2.35, 0), 0.6)));
        E.label('4 ATP', [0, 2.95, 0], { cls: 'tag gold' });
        halfHalo.forEach((h) => h.material.color.setHex(C.piruvato));
        halfLab.forEach((t) => M.retext(t, 'Piruvato (3 C)'));
        App.record('glu', { atp: 2, nadh: 2 });
        ctx.$('#result').classList.remove('hide');
        await E.wait(0.2);
      };
      App.stepper(ctx, { button: '#step', list: '#sl', steps: [s1, s2, s3, s4], reset: () => App.reload(), again: '↺ Repetir la glucólisis' });
      show();
      return {
        update() {
          follow.forEach((f) => f.p.position.copy(rootPos(f.a)).add(f.off));
        },
      };
    },
  });

  /* ===================== 4. OXIDACIÓN DEL PIRUVATO ===================== */
  App.add({
    id: 'piruvato',
    nav: 'Oxidación del piruvato',
    kicker: 'Sección 4 · Etapa 2 · Matriz mitocondrial',
    title: 'Oxidación del piruvato',
    place: 'matriz',
    ledger: true,
    legend: ['C', 'O', 'NAD', 'NADH', 'e', 'CoA'],
    frame: { look: [0.2, 0, 0], dir: [0, 0.1, 1], w: 10.4, h: 6.2 },
    rotate: { yaw: 0.7, pitch: 0.3 },
    html: `
      <p>Los dos piruvatos entran en la mitocondria.</p>
      <p>Cada piruvato pierde un carbono. Ese carbono sale como dióxido de carbono, o <b>CO₂</b>.</p>
      <p>El grupo de dos carbonos que queda se une a la <b>coenzima A</b>. Así se forma <b>acetil-CoA</b>.</p>
      <p class="formula">2 piruvatos → 2 acetil-CoA + 2 CO₂</p>
      <ol class="steplist" id="sl">
        <li>Los 2 piruvatos entran en la matriz mitocondrial.</li>
        <li>Cada piruvato pierde un carbono. El carbono sale como CO₂.</li>
        <li>Cada piruvato entrega electrones a un NAD⁺. Se forman 2 NADH.</li>
        <li>Cada grupo de 2 carbonos se une a la coenzima A. Se forman 2 acetil-CoA.</li>
      </ol>
      <div class="controls"><button class="btn primary" id="step">Siguiente paso →</button></div>
      ${counters([['c-co2', 'CO₂', '#8b95a5'], ['c-nadh', 'NADH', M.hex(C.nadh)], ['c-acc', 'Acetil-CoA', M.hex(C.acetil)], ['c-atp', 'ATP', M.hex(C.atp)]])}
      <div class="callout">Esta etapa <b>no produce ATP</b> directamente.</div>
      ${resultBox(['2 acetil-CoA', '2 CO₂', '2 NADH'])}
    `,
    build(ctx) {
      const root = ctx.root;
      // fondo: citosol | membranas | matriz
      const D = 0.9;
      const cyt = new T.Mesh(new T.PlaneGeometry(4.6, 7), M.mat(C.cytosol));
      cyt.position.set(-4.3, 0, -1.3);
      const mat = new T.Mesh(new T.PlaneGeometry(7.6, 7), M.mat(C.matrix));
      mat.position.set(2.75, 0, -1.3);
      const ims = new T.Mesh(new T.PlaneGeometry(0.62, 7), M.mat(C.ims));
      ims.position.set(-1.7, 0, -1.3);
      root.add(cyt, mat, ims);
      const outer = new T.Mesh(new T.BoxGeometry(0.2, 7, D), M.mat(C.outer));
      outer.position.set(-2.0, 0, -0.1);
      const inner = new T.Mesh(new T.BoxGeometry(0.2, 7, D), M.mat(C.inner));
      inner.position.set(-1.4, 0, -0.1);
      root.add(outer, inner);
      [1.1, -1.1].forEach((y) => {
        [-2.0, -1.4].forEach((x) => {
          const ch = new T.Mesh(new T.TorusGeometry(0.24, 0.07, 10, 24), M.mat(0x6ec6a8));
          ch.rotation.y = Math.PI / 2;
          ch.position.set(x, y, 0.45);
          root.add(ch);
        });
      });
      E.label('Citosol', [-4.4, 2.75, 0], { cls: 'tag' });
      E.label('Matriz mitocondrial', [2.7, 2.75, 0], { cls: 'tag' });
      E.label('Membrana externa', [-2.0, -2.85, 0.6], { cls: 'tag small', anchor: 'l', off: [-0.1, 0, 0] });
      E.label('Membrana interna', [-1.4, -2.85, 0.6], { cls: 'tag small', anchor: 'r', off: [0.1, 0, 0] });

      const cnt = { co2: 0, nadh: 0, acc: 0 };
      function show() {
        App.setCount(ctx, '#c-co2', cnt.co2);
        App.setCount(ctx, '#c-nadh', cnt.nadh);
        App.setCount(ctx, '#c-acc', cnt.acc);
        App.setCount(ctx, '#c-atp', 0);
      }
      const pyr = [1.15, -1.15].map((y) => {
        const p = M.skeleton(3, { color: C.piruvato, label: 'Piruvato', size: 0.28 });
        p.position.set(-4.3, y, 0.2);
        root.add(p);
        return p;
      });
      const s1 = async () => {
        await Promise.all(pyr.map((p, i) => E.move(p, V(-2.7, p.position.y, 0.2), 0.6, { delay: i * 0.1 })));
        await Promise.all(pyr.map((p, i) => E.move(p, V(1.0, i ? -1.35 : 1.35, 0.2), 1.1, { delay: i * 0.1 })));
      };
      const s2 = async () => {
        await Promise.all(pyr.map(async (p, i) => {
          const at = p.userData.atoms;
          const c3 = at[2];
          M.unlink(p, at[1], c3);
          const where = rootPos(c3);
          p.remove(c3);
          const co2 = M.co2();
          co2.position.copy(where);
          co2.scale.setScalar(0.3);
          root.add(co2);
          await E.scale(co2, 1, 0.3);
          await E.move(co2, V(4.3, i ? 0.25 : 1.05, 0.2), 1.0, { arc: 0.3 });
          cnt.co2++; show();
        }));
        E.label('2 CO₂', [4.3, 1.6, 0.2], { cls: 'tag' });
        pyr.forEach((p) => (p.userData.label.visible = false));
      };
      const s3 = async () => {
        await Promise.all(pyr.map(async (p, i) => {
          const n = M.carrier('NAD+');
          n.position.set(4.6, i ? -0.8 : 0.8, 0.2);
          root.add(n);
          await E.move(n, V(2.2, p.position.y + (i ? -0.85 : 0.85), 0.2), 0.7);
          await charge(root, rootPos(p), n, 'NADH', 0.5);
          await E.move(n, V(3.2 + i * 1.05, -2.6, 0.2), 0.8);
          cnt.nadh++; show();
        }));
        E.label('2 NADH', [3.7, -3.1, 0.2], { cls: 'tag' });
      };
      const s4 = async () => {
        await Promise.all(pyr.map(async (p, i) => {
          const coa = M.coa();
          coa.position.set(4.4, i ? -1.6 : 1.6, 0.2);
          root.add(coa);
          await E.move(coa, V(p.position.x + 0.56, p.position.y, 0.2), 0.8);
          p.add(coa);
          coa.position.set(0.56, 0, 0);
          p.userData.halo.material.color.setHex(C.acetil);
          const t = M.text('Acetil-CoA', { size: 0.28 });
          t.position.set(0.2, -0.6, 0.3);
          p.add(t);
          cnt.acc++; show();
          await E.scale(p, 1.15, 0.15).then(() => E.scale(p, 1, 0.2));
        }));
        App.record('pir', { nadh: 2, co2: 2 });
        ctx.$('#result').classList.remove('hide');
      };
      App.stepper(ctx, { button: '#step', list: '#sl', steps: [s1, s2, s3, s4], reset: () => App.reload(), again: '↺ Repetir la oxidación' });
      show();
      return { update() {} };
    },
  });

  /* ===================== 5. CICLO DE KREBS ===================== */
  App.add({
    id: 'krebs',
    nav: 'Ciclo de Krebs',
    kicker: 'Sección 5 · Etapa 3 · Matriz mitocondrial',
    title: 'Ciclo de Krebs',
    place: 'matriz',
    ledger: true,
    legend: ['C', 'O', 'CoA', 'NADH', 'FADH', 'ATP'],
    frame: { look: [0.6, 0.15, 0], dir: [0, 0.08, 1], w: 10.6, h: 6.9 },
    rotate: { yaw: 0.7, pitch: 0.35 },
    html: `
      <p>El acetil-CoA aporta <b>dos carbonos</b> al ciclo.</p>
      <p>El ciclo transforma varias moléculas. Durante el proceso, el ciclo libera CO₂ y carga transportadores de electrones.</p>
      <p>Se llama <b>ciclo</b> porque regenera la molécula que recibe al grupo acetilo. Esa molécula tiene 4 carbonos.</p>
      <p>Cada glucosa permite que el ciclo dé <b>dos vueltas</b>. Pulsa «Dar una vuelta».</p>
      <div class="controls"><button class="btn primary" id="turn">⟳ Dar una vuelta (1 de 2)</button></div>
      ${counters([['c-turn', 'Vueltas', '#fb7185'], ['c-co2', 'CO₂', '#8b95a5'], ['c-nadh', 'NADH', M.hex(C.nadh)], ['c-fadh', 'FADH₂', M.hex(C.fadh)], ['c-atp', 'ATP equivalentes', M.hex(C.atp)]])}
      <p class="note">El <b>FADH₂</b>, igual que el NADH, transporta electrones.</p>
      <p class="note">En el ciclo se forma ATP o una molécula parecida (GTP). Por eso, la guía dice «ATP equivalentes».</p>
      <div class="callout">Todavía <b>no se ha formado la mayor parte del ATP</b>.</div>
      <div class="result hide" id="result"><div class="result-h">Resultado de las dos vueltas</div><ul><li>4 CO₂</li><li>6 NADH</li><li>2 FADH₂</li><li>2 ATP equivalentes</li></ul></div>
    `,
    build(ctx) {
      const root = ctx.root;
      const CX = -1.6, CY = 0.1, R = 2.15;
      const ring = new T.Mesh(new T.TorusGeometry(R, 0.06, 10, 120), M.mat(0xf6a5b3));
      ring.position.set(CX, CY, -0.3);
      root.add(ring);
      const ang = (s) => Math.PI / 2 - (s * Math.PI * 2) / 8;
      const posAt = (a) => V(CX + Math.cos(a) * R, CY + Math.sin(a) * R, 0);
      for (let s = 0; s < 8; s++) {
        const d = M.sphere(0.09, 0xf27a8f);
        d.position.copy(posAt(ang(s))).setZ(-0.3);
        root.add(d);
      }
      // flechas de sentido
      for (let s = 0; s < 8; s++) {
        const a = ang(s + 0.5);
        const cone = new T.Mesh(new T.ConeGeometry(0.11, 0.26, 14), M.mat(0xf27a8f));
        cone.position.copy(posAt(a)).setZ(-0.3);
        cone.rotation.z = a + Math.PI; // tangente en sentido horario
        root.add(cone);
      }
      const centerLab = M.text('Ciclo de Krebs', { size: 0.34, color: '#9f1239' });
      centerLab.position.set(CX, CY, 0);
      root.add(centerLab);

      // bandeja de resultados
      const TX = 1.95;
      const rows = { co2: 2.15, nadh: 1.25, fadh: -0.25, atp: -1.05 };
      const rowLab = { co2: 'CO₂', nadh: 'NADH', fadh: 'FADH₂', atp: 'ATP' };
      Object.entries(rows).forEach(([k, y]) => E.label(rowLab[k], [TX - 0.25, y, 0], { cls: 'tag small', anchor: 'l' }));
      const tray = { co2: 0, nadh: 0, fadh: 0, atp: 0 };
      const slot = (k) => {
        const i = tray[k];
        if (k === 'nadh') return V(TX + 0.65 + (i % 3) * 0.98, rows.nadh - (i < 3 ? 0 : 0.62), 0);
        return V(TX + 0.6 + i * (k === 'co2' ? 1.05 : 1.0) + (k === 'atp' ? 0.1 : 0), rows[k], 0);
      };

      let carrier = null, n = 4, a0 = ang(0);
      function makeCarrier(nc) {
        const at = carrier ? carrier.position.clone() : posAt(a0);
        if (carrier) root.remove(carrier);
        carrier = M.skeleton(nc, { color: C.ciclo, label: nc + ' C', labelY: -0.55, size: 0.3 });
        carrier.position.copy(at);
        root.add(carrier);
        n = nc;
      }
      makeCarrier(4);
      const lRecv = E.label('Recibe el acetilo (4 C)', carrier, { cls: 'tag', anchor: 'b', off: [0, -0.85, 0] });
      lRecv.target = posAt(a0).toArray();
      lRecv.off = [0, -0.85, 0];

      const cnt = { turn: 0, co2: 0, nadh: 0, fadh: 0, atp: 0 };
      function show() { Object.keys(cnt).forEach((k) => App.setCount(ctx, '#c-' + k, cnt[k])); }
      show();

      async function travel(s0, s1) {
        const a1 = ang(s0), a2 = ang(s1);
        await E.anim(0.55 * (s1 - s0), (k) => carrier.position.copy(posAt(a1 + (a2 - a1) * k)), { ease: E.ease.io });
      }
      async function emit(kind) {
        const from = carrier.position.clone();
        let o;
        if (kind === 'co2') {
          o = M.co2();
        } else if (kind === 'nadh') {
          o = M.carrier('NAD+');
        } else if (kind === 'fadh') {
          o = M.carrier('FAD');
        } else {
          o = M.atp(2);
        }
        o.position.copy(from).add(V(0, 0, 0.4));
        o.scale.setScalar(0.4);
        root.add(o);
        E.scale(o, 1, 0.3);
        if (kind === 'nadh') await charge(root, from, o, 'NADH', 0.4);
        else if (kind === 'fadh') await charge(root, from, o, 'FADH2', 0.4);
        else if (kind === 'atp') { await E.wait(0.2); M.setP(o, 3); }
        else await E.wait(0.3);
        const dest = slot(kind);
        tray[kind]++;
        await E.move(o, dest, 0.8, { ease: E.ease.io });
        cnt[kind]++;
        show();
      }
      async function loseCarbon() {
        const from = carrier.position.clone();
        makeCarrier(n - 1);
        await E.scale(carrier, 1.15, 0.12).then(() => E.scale(carrier, 1, 0.12));
        return from;
      }

      async function oneTurn() {
        lRecv.show(false);
        // llega el acetil-CoA
        const acc = M.skeleton(2, { color: C.acetil, label: 'Acetil-CoA', labelY: -0.55, size: 0.26 });
        const coa = M.coa();
        coa.position.set(0.76, 0, 0);
        acc.add(coa);
        const top = posAt(ang(0));
        acc.position.set(top.x - 0.4, top.y + 2.3, 0.4);
        root.add(acc);
        await E.move(acc, V(top.x - 0.2, top.y + 0.75, 0.4), 0.8);
        acc.remove(coa);
        coa.position.copy(rootPos(acc)).add(V(0.76, 0, 0));
        root.add(coa);
        E.move(coa, V(top.x + 1.6, top.y + 2.4, 0.4), 1.0);
        E.fade(coa, 0, 1.0);
        await E.move(acc, carrier.position, 0.45);
        root.remove(acc);
        makeCarrier(6);
        await E.scale(carrier, 1.2, 0.15).then(() => E.scale(carrier, 1, 0.15));
        await travel(0, 2);
        await loseCarbon();
        await Promise.all([emit('co2'), emit('nadh')]);
        await travel(2, 3);
        await loseCarbon();
        await Promise.all([emit('co2'), emit('nadh')]);
        await travel(3, 4);
        await emit('atp');
        await travel(4, 5);
        await emit('fadh');
        await travel(5, 7);
        await emit('nadh');
        await travel(7, 8);
        carrier.position.copy(posAt(ang(0)));
        lRecv.show(true);
        cnt.turn++;
        show();
      }
      const btn = ctx.$('#turn');
      btn.addEventListener('click', async () => {
        if (cnt.turn >= 2) { App.reload(); return; }
        btn.disabled = true;
        const g = E.gen;
        await oneTurn();
        if (g !== E.gen) return;
        btn.disabled = false;
        if (cnt.turn === 1) btn.textContent = '⟳ Dar una vuelta (2 de 2)';
        else {
          btn.textContent = '↺ Repetir las dos vueltas';
          App.record('krebs', { co2: 4, nadh: 6, fadh: 2, atp: 2 });
          ctx.$('#result').classList.remove('hide');
        }
      });
      return {
        update(dt, t) {
          if (carrier) carrier.rotation.z = Math.sin(t * 1.5) * 0.08;
        },
      };
    },
  });
})();
