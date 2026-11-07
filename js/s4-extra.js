/* Estaciones 9–13: fermentación, respiración anaerobia, palabras clave, resumen, preguntas. */
(function () {
  'use strict';
  const T = THREE;
  const C = M.COL;
  const V = (x, y, z) => new T.Vector3(x, y, z || 0);

  /* ===================== 9. SIN OXÍGENO: FERMENTACIÓN ===================== */
  const FERM = {
    none: { n: 'Sin fermentación', ring: 0xb6c2cf },
    lac: { n: 'Fermentación láctica', ring: C.lactato, prod: 'Lactato' },
    alc: { n: 'Fermentación alcohólica', ring: C.etanol, prod: 'Etanol' },
  };
  App.add({
    id: 'fermentacion',
    nav: 'Sin oxígeno',
    kicker: 'Sección 9 · Cuando falta oxígeno',
    title: '¿Qué ocurre cuando falta oxígeno?',
    place: 'citosol',
    legend: ['C', 'O', 'NAD', 'NADH', 'e', 'ATP'],
    frame: { look: [0.2, 0.25, 0], dir: [0, 0.1, 1], w: 11.2, h: 6.6 },
    rotate: { yaw: 0.7, pitch: 0.3 },
    html: `
      <p>La glucólisis puede continuar si dispone de <b>NAD⁺</b>.</p>
      <p>El NAD⁺ recibe electrones y se transforma en NADH. Para mantener la glucólisis, la célula necesita recuperar NAD⁺.</p>
      <p>La <b>fermentación</b> permite recuperar ese NAD⁺.</p>
      <div class="seg wide three" id="mode">
        <button data-v="none">Sin fermentación</button>
        <button data-v="lac" class="on">Láctica</button>
        <button data-v="alc">Alcohólica</button>
      </div>
      <div class="controls"><button class="btn primary" id="run">⏸ Pausar</button><button class="btn ghost" id="reset">↺ Reiniciar</button></div>
      <div class="alert hide" id="alert">La glucólisis se detiene. No hay NAD⁺ disponible.</div>
      <div class="counters">
        <div class="ct"><i style="background:${M.hex(C.glucosa)}"></i><b id="c-glu">0</b><span>Glucosas usadas</span></div>
        <div class="ct"><i style="background:${M.hex(C.atp)}"></i><b id="c-atp">0</b><span>ATP formado</span></div>
        <div class="ct"><i style="background:${M.hex(C.nad)}"></i><b id="c-nad">4</b><span>NAD⁺ disponible</span></div>
        <div class="ct"><i style="background:${M.hex(C.lactato)}"></i><b id="c-prod">0</b><span id="c-prod-n">Lactato</span></div>
      </div>
      <p class="note">Prueba: selecciona «Sin fermentación». Observa qué pasa con el NAD⁺.</p>
      <div class="callout">La glucólisis aporta <b>2 ATP netos</b> por glucosa. <b>La fermentación no añade más ATP.</b></div>
      <div class="two cards">
        <div class="card mini" data-m="lac"><h3>Fermentación láctica</h3><p>Produce <b>lactato</b> y recupera NAD⁺.</p><p>Ocurre en algunas bacterias. Nuestras células musculares también pueden aumentar esta vía durante un esfuerzo intenso.</p></div>
        <div class="card mini" data-m="alc"><h3>Fermentación alcohólica</h3><p>Produce <b>etanol y CO₂</b>. También recupera NAD⁺.</p><p>Las levaduras usan esta vía. En la preparación del pan, el CO₂ ayuda a que la masa aumente de volumen.</p></div>
      </div>
    `,
    build(ctx) {
      const root = ctx.root;
      const GX = -2.7, FX = 2.6, Y = 0.3;
      const gRing = new T.Mesh(new T.TorusGeometry(0.95, 0.12, 14, 64), M.mat(C.glucosa));
      gRing.position.set(GX, Y, 0);
      const fMat = M.own(FERM.lac.ring);
      const fRing = new T.Mesh(new T.TorusGeometry(0.95, 0.12, 14, 64), fMat);
      fRing.position.set(FX, Y, 0);
      root.add(gRing, fRing);
      E.label('Glucólisis', [GX, Y + 1.35, 0], { cls: 'tag' });
      const fLab = E.label('Fermentación', [FX, Y + 1.35, 0], { cls: 'tag' });
      // carriles
      const track = (pts, hex) => {
        const cv = new T.CatmullRomCurve3(pts.map((p) => V(p[0], p[1], -0.2)));
        const m = new T.Mesh(new T.TubeGeometry(cv, 60, 0.03, 6, false), M.mat(hex));
        root.add(m);
      };
      track([[FX - 0.5, Y + 0.85], [0, Y + 2.1], [GX + 0.5, Y + 0.85]], 0x9cc3fb);
      track([[GX + 0.5, Y - 0.85], [0, Y - 2.1], [FX - 0.5, Y - 0.85]], 0x5b8def);
      track([[GX + 0.95, Y], [FX - 0.95, Y]], 0x7dd3c7);
      E.label('NAD⁺ regresa', [0, Y + 2.45, 0], { cls: 'tag small' });
      E.label('NADH', [0, Y - 2.45, 0], { cls: 'tag small' });
      E.label('Piruvato', [0, Y + 0.35, 0], { cls: 'tag small teal' });

      // masa de pan (solo fermentación alcohólica)
      const dough = new T.Mesh(new T.SphereGeometry(0.6, 32, 20), M.mat(0xf1d9a7, { rough: 0.8 }));
      dough.scale.set(1.3, 0.7, 1.1);
      dough.position.set(4.7, -2.15, 0);
      const bowl = new T.Mesh(new T.CylinderGeometry(0.95, 0.7, 0.5, 32, 1, true), M.mat(0x94a3b8, { side: T.DoubleSide }));
      bowl.position.set(4.7, -2.45, 0);
      root.add(dough, bowl);
      const doughLab = E.label('Masa de pan', [4.7, -3.0, 0.6], { cls: 'tag small' });

      const S = { mode: 'lac', run: true, glu: 0, atp: 0, prod: 0, co2: 0, glyBusy: false, fermBusy: false };
      const nadSpots = [[-4.1, 1.75], [-4.65, 1.15], [-4.65, 0.45], [-4.1, -0.2], [-4.65, -0.85], [-4.1, -1.45]];
      const free = []; // NAD+ libres en la glucólisis
      const wPyr = [], wNad = [];
      for (let i = 0; i < 4; i++) {
        const n = M.carrier('NAD+');
        n.position.set(nadSpots[i][0], nadSpots[i][1], 0);
        root.add(n);
        free.push(n);
      }
      function relayout() {
        free.forEach((n, i) => { if (!n.userData.moving) n.position.set(nadSpots[i % 6][0], nadSpots[i % 6][1], 0); });
      }
      function show() {
        App.setCount(ctx, '#c-glu', S.glu);
        App.setCount(ctx, '#c-atp', S.atp);
        App.setCount(ctx, '#c-nad', free.length);
        App.setCount(ctx, '#c-prod', S.prod);
        ctx.$('#c-prod-n').textContent = S.mode === 'alc' ? 'Etanol' : 'Lactato';
        const stuck = free.length < 2 && !S.glyBusy && (S.mode === 'none');
        ctx.$('#alert').classList.toggle('hide', !stuck);
        fMat.color.setHex(FERM[S.mode].ring);
        fLab.set(S.mode === 'none' ? 'Sin fermentación' : FERM[S.mode].n);
        dough.visible = bowl.visible = S.mode === 'alc' || S.co2 > 0;
        doughLab.show(dough.visible);
        ctx.$$('.card.mini').forEach((c) => c.classList.toggle('on', c.dataset.m === S.mode));
      }
      const waitSpot = (i, row) => V(FX + 1.35 + (i % 3) * 0.12, Y + (row ? -0.95 : 0.55) - Math.floor(i / 1) * 0.0, 0.2 + i * 0.06);

      async function glycolysis() {
        S.glyBusy = true;
        const glu = M.skeleton(6, { layout: 'ring', color: C.glucosa });
        glu.scale.setScalar(0.55);
        glu.position.set(GX - 1.4, Y + 2.6, 0);
        root.add(glu);
        await E.move(glu, V(GX, Y, 0), 0.8);
        const ns = free.splice(0, 2);
        ns.forEach((n) => (n.userData.moving = true));
        relayout();
        show();
        await Promise.all(ns.map((n, i) => E.move(n, V(GX + (i ? 0.35 : -0.35), Y - 0.55, 0.3), 0.5)));
        root.remove(glu);
        await Promise.all(ns.map((n) => M.charge(root, V(GX, Y, 0.2), n, 'NADH', 0.4)));
        // 2 ATP
        const atps = [0, 1].map((i) => {
          const a = M.atp(3);
          a.position.set(GX, Y, 0.4);
          a.scale.setScalar(0.6);
          root.add(a);
          return a;
        });
        atps.forEach((a, i) => {
          E.move(a, V(GX - 0.6 + i * 1.2, Y + 1.0, 0.5), 0.6).then(() => E.fade(a, 0, 0.5)).then(() => root.remove(a));
        });
        S.atp += 2;
        S.glu++;
        show();
        // piruvatos y NADH viajan a la fermentación
        const pyrs = [0, 1].map(() => {
          const p = M.skeleton(3, { color: C.piruvato });
          p.scale.setScalar(0.6);
          p.position.set(GX + 0.9, Y, 0.1);
          root.add(p);
          return p;
        });
        const jobs = [];
        pyrs.forEach((p, i) => jobs.push(E.move(p, V(FX - 1.2 - i * 0.6, Y + 0.0, 0.1), 1.2, { delay: i * 0.25 }).then(() => wPyr.push(p))));
        ns.forEach((n, i) => {
          const cv = new T.CatmullRomCurve3([V(GX + 0.4, Y - 0.6, 0.3), V(0, Y - 2.1, 0.3), V(FX - 0.6, Y - 0.85, 0.3)]);
          jobs.push(E.anim(1.4, (k) => n.position.copy(cv.getPoint(k)), { delay: i * 0.25 }).then(() => wNad.push(n)));
        });
        await Promise.all(jobs);
        layoutWaiting();
        S.glyBusy = false;
        show();
      }
      function layoutWaiting() {
        wPyr.forEach((p, i) => { if (!p.userData.busy) E.move(p, V(FX + 1.5 + (i % 2) * 0.75, Y + 0.85 + Math.floor(i / 2) * 0.45, 0.2), 0.3); });
        wNad.forEach((n, i) => { if (!n.userData.busy) E.move(n, V(FX + 1.5 + (i % 2) * 0.95, Y - 0.9 - Math.floor(i / 2) * 0.45, 0.2), 0.3); });
      }
      async function ferment() {
        S.fermBusy = true;
        const p = wPyr.shift(), n = wNad.shift();
        p.userData.busy = n.userData.busy = true;
        layoutWaiting();
        await Promise.all([E.move(p, V(FX, Y + 0.15, 0.2), 0.5), E.move(n, V(FX, Y - 0.5, 0.3), 0.5)]);
        const mode = S.mode;
        if (mode === 'alc') {
          // sale un carbono como CO2
          const at = p.userData.atoms;
          M.unlink(p, at[1], at[2]);
          const where = M.rootPos(at[2]);
          p.remove(at[2]);
          const c = M.co2();
          c.scale.setScalar(0.6);
          c.position.copy(where);
          root.add(c);
          E.move(c, V(4.7 + E.rand(-0.3, 0.3), -1.9, 0.4), 1.0, { arc: 0.6 }).then(() => {
            root.remove(c);
            S.co2++;
            const k = Math.min(1.6, 1 + S.co2 * 0.05);
            E.anim(0.4, (e) => dough.scale.set(1.3 * (k - 0.07 * (1 - e)), 0.7 * (k - 0.07 * (1 - e)), 1.1 * (k - 0.07 * (1 - e))));
          });
        }
        // los electrones del NADH pasan al piruvato
        const es = n.userData.es.map((e0) => {
          const e = M.electron();
          e.position.copy(M.rootPos(e0));
          root.add(e);
          return e;
        });
        M.setCarrier(n, 'NAD+');
        await Promise.all(es.map((e) => E.move(e, M.rootPos(p), 0.45)));
        es.forEach((e) => root.remove(e));
        p.userData.halo.material.color.setHex(mode === 'alc' ? C.etanol : C.lactato);
        const t = M.text(mode === 'alc' ? 'Etanol' : 'Lactato', { size: 0.42 });
        t.position.set(0, -0.85, 0.4);
        p.add(t);
        S.prod++;
        show();
        // el producto sale; el NAD+ regresa a la glucólisis
        E.move(p, V(FX + 0.4, Y - 2.6, 0.2), 1.1).then(() => E.fade(p, 0, 0.5)).then(() => root.remove(p));
        const cv = new T.CatmullRomCurve3([V(FX - 0.4, Y + 0.6, 0.3), V(0, Y + 2.1, 0.3), V(GX + 0.5, Y + 0.85, 0.3)]);
        S.fermBusy = false;
        await E.anim(1.3, (k) => n.position.copy(cv.getPoint(k)));
        n.userData.busy = false;
        n.userData.moving = false;
        free.push(n);
        relayout();
        show();
      }
      ctx.$('#mode').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (S.mode !== b.dataset.v) S.prod = 0;
        S.mode = b.dataset.v;
        ctx.$$('#mode button').forEach((x) => x.classList.toggle('on', x === b));
        show();
      });
      ctx.$('#run').addEventListener('click', () => {
        S.run = !S.run;
        ctx.$('#run').textContent = S.run ? '⏸ Pausar' : '▶ Continuar';
      });
      ctx.$('#reset').addEventListener('click', () => App.reload());
      show();
      let cool = 0.3;
      return {
        update(dt, t) {
          gRing.rotation.z = t * (S.glyBusy ? 1.5 : 0.2);
          fRing.rotation.z = -t * (S.fermBusy ? 1.5 : 0.2);
          if (!S.run) return;
          cool -= dt;
          if (!S.glyBusy && free.length >= 2 && cool <= 0) { cool = 0.6; glycolysis(); }
          if (!S.fermBusy && S.mode !== 'none' && wPyr.length && wNad.length) ferment();
          show();
        },
      };
    },
  });

  /* ===================== 10. RESPIRACIÓN ANAEROBIA ===================== */
  App.add({
    id: 'anaerobia',
    nav: 'Respiración anaerobia',
    kicker: 'Sección 10 · Otros seres vivos',
    title: '¿Qué es la respiración anaerobia?',
    place: 'bacteria',
    legend: ['e', 'Hp', 'O', 'N', 'H'],
    frame: { look: [-0.4, -0.2, 0], dir: [0, 0.07, 1], w: 11.6, h: 6.6 },
    rotate: { yaw: 0.7, pitch: 0.35 },
    html: `
      <p>Algunas bacterias y arqueas realizan <b>respiración anaerobia</b>.</p>
      <p>Esta ruta <b>sí usa</b> una cadena de transporte de electrones.</p>
      <p>Sin embargo, el receptor final es una sustancia distinta del oxígeno. Por ejemplo, el receptor final puede ser <b>nitrato</b>.</p>
      <p>Elige el receptor final de los electrones:</p>
      <div class="seg wide three" id="acc">
        <button data-v="o2" class="on">Oxígeno</button>
        <button data-v="no3">Nitrato</button>
        <button data-v="ferm">Fermentación</button>
      </div>
      <div class="card info" id="acc-info"></div>
      <p class="note">Las bacterias no tienen mitocondrias. Su cadena de transporte de electrones está en la membrana celular. Las proteínas de su cadena son diferentes, pero la función es la misma.</p>
      <p>La cantidad de ATP depende del organismo y de la ruta utilizada.</p>
      <table class="tbl compare">
        <thead><tr><th>Característica</th><th>Fermentación</th><th>Respiración anaerobia</th></tr></thead>
        <tbody>
          <tr><td>¿Necesita oxígeno?</td><td>No</td><td>No</td></tr>
          <tr><td>¿Usa una cadena de transporte de electrones?</td><td><b>No</b></td><td><b>Sí</b></td></tr>
          <tr><td>¿Cuánto ATP se obtiene?</td><td>Generalmente, 2 ATP netos de la glucólisis</td><td>La cantidad varía</td></tr>
        </tbody>
      </table>
      <div class="callout"><b>Fermentación y respiración anaerobia son procesos distintos.</b></div>
    `,
    build(ctx) {
      const root = ctx.root;
      const top = new T.Mesh(new T.PlaneGeometry(13.4, 3.2), M.mat(0xe2f3e8));
      top.position.set(0, 1.85, -1.65);
      const bot = new T.Mesh(new T.PlaneGeometry(13.4, 3.4), M.mat(0xeaf6d8));
      bot.position.set(0, -1.95, -1.65);
      root.add(top, bot);
      const P = M.chain(root, { plain: true, noII: true });
      E.label('Exterior de la bacteria', [-5.6, 2.95, 0], { cls: 'tag', anchor: 'r' });
      E.label('Interior de la bacteria', [-5.6, -3.2, 0], { cls: 'tag', anchor: 'r' });
      E.label('Membrana celular', [-5.75, 0, 1.5], { cls: 'tag small', anchor: 'r' });
      E.label('Cadena de transporte de electrones', [-1.5, 1.75, 0.6], { cls: 'tag small' });
      const chainParts = [P.I, P.III, P.IV, P.c];
      const accLab = E.label('', [2.4, -2.55, 0.6], { cls: 'tag' });
      const block = E.label('La fermentación no usa esta cadena.', [-1.0, -1.8, 0.8], { cls: 'tag warn', hidden: true });
      const INFO = {
        o2: '<h3>Respiración aerobia</h3><p>El <b>oxígeno</b> recibe los electrones al final de la cadena. Se forma <b>agua</b>.</p><p>Así ocurre en nuestras células.</p>',
        no3: '<h3>Respiración anaerobia</h3><p>El <b>nitrato (NO₃⁻)</b> recibe los electrones al final de la cadena. Se forma <b>nitrito (NO₂⁻)</b>.</p><p>No usa oxígeno, pero sí usa la cadena.</p>',
        ferm: '<h3>Fermentación</h3><p>La fermentación <b>no usa</b> una cadena de transporte de electrones.</p><p>Solo la glucólisis forma ATP: generalmente, 2 ATP netos por glucosa.</p>',
      };
      let acc = 'o2';
      const greyMats = [];
      chainParts.forEach((p) => p.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); greyMats.push([o.material, o.material.color.clone()]); } }));
      function setAcc(v) {
        acc = v;
        ctx.$$('#acc button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
        ctx.$('#acc-info').innerHTML = INFO[v];
        accLab.set(v === 'o2' ? 'Receptor final: O₂' : v === 'no3' ? 'Receptor final: nitrato' : 'Sin receptor final');
        const grey = new T.Color(0xd1d5db);
        greyMats.forEach(([m, c]) => m.color.copy(c).lerp(grey, v === 'ferm' ? 0.75 : 0));
        block.show(v === 'ferm');
      }
      ctx.$('#acc').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) setAcc(b.dataset.v);
      });
      setAcc('o2');
      const pm = M.mat(C.proton);
      async function pumpUp(x) {
        const p = new T.Mesh(M.geo.lo, pm);
        p.scale.setScalar(0.075);
        p.position.set(x, -2.4, 0.4);
        root.add(p);
        await E.move(p, V(x, 0.9, 0.95), 0.9);
        await E.move(p, V(x + E.rand(-1, 1), E.rand(1.4, 2.6), 0.4), 0.8);
        await E.wait(1.2);
        root.remove(p);
      }
      async function run() {
        if (acc === 'ferm') { await E.wait(0.5); return; }
        const mode = acc;
        const es = [0, 1].map((i) => {
          const e = M.electron();
          e.position.set(-3.8 + i * 0.14, -2.6, 1.05);
          root.add(e);
          return e;
        });
        const hop = async (pts, d) => { for (const q of pts) await Promise.all(es.map((e, i) => E.move(e, V(q[0] + i * 0.14 - 0.07, q[1], 1.05), d))); };
        await hop([[-3.8, -1.35], [-4.3, -0.1]], 0.35);
        for (let i = 0; i < 3; i++) pumpUp(-4.3 + (i - 1) * 0.2);
        await hop([[-0.9, 0.1]], 0.45);
        for (let i = 0; i < 3; i++) pumpUp(-0.9 + (i - 1) * 0.2);
        await hop([[0.22, 1.05], [1.35, 0.1]], 0.35);
        pumpUp(1.35);
        await hop([[1.35, -0.8], [1.35, -1.55]], 0.35);
        es.forEach((e) => root.remove(e));
        let a, b;
        if (mode === 'o2') { a = M.oAtom(); b = M.h2o; } else { a = M.nitrate(); b = M.nitrite; }
        a.position.set(1.35, -1.6, 0.6);
        root.add(a);
        await E.scale(a, 1.25, 0.15);
        root.remove(a);
        const prod = b();
        prod.position.set(1.35, -1.6, 0.6);
        root.add(prod);
        const pl = E.label(mode === 'o2' ? 'H₂O' : 'NO₂⁻', prod, { cls: 'tag small', off: [0, 0.42, 0] });
        await E.move(prod, V(2.6 + E.rand(-0.2, 0.6), -3.0, 0.6), 1.3);
        pl.show(false);
        await E.fade(prod, 0, 0.5);
        root.remove(prod);
      }
      // receptor esperando
      const waitO = M.o2();
      waitO.position.set(2.4, -2.05, 0.6);
      const waitN = M.nitrate();
      waitN.position.set(2.4, -2.05, 0.6);
      root.add(waitO, waitN);
      (async function loop() {
        const g = E.gen;
        while (g === E.gen) {
          run();
          await E.wait(2.2);
        }
      })();
      return {
        update(dt, t) {
          waitO.visible = acc === 'o2';
          waitN.visible = acc === 'no3';
          waitN.rotation.z = t * 0.5;
          if (P.rotor && acc !== 'ferm') P.rotor.rotation.y += dt * 1.6;
        },
      };
    },
  });

  /* ===================== 11. PALABRAS CLAVE ===================== */
  const WORDS = [
    ['glucosa', 'Glucosa', 'Azúcar de seis carbonos que la célula puede usar como fuente de energía.'],
    ['atp', 'ATP', 'Molécula que transfiere energía para el trabajo celular.'],
    ['adp', 'ADP', 'Molécula que puede recibir un fosfato para formar ATP.'],
    ['piruvato', 'Piruvato', 'Molécula de tres carbonos que se forma en la glucólisis.'],
    ['acetil', 'Acetil-CoA', 'Molécula que lleva un grupo de dos carbonos al ciclo de Krebs.'],
    ['nadh', 'NADH y FADH₂', 'Transportadores de electrones.'],
    ['h', 'Protones, o H⁺', 'Partículas que se acumulan a un lado de la membrana interna.'],
    ['sintasa', 'ATP sintasa', 'Proteína que usa el flujo de protones para formar ATP.'],
  ];
  App.add({
    id: 'palabras',
    nav: 'Palabras clave',
    kicker: 'Sección 11 · Vocabulario',
    title: 'Palabras clave',
    legend: ['C', 'P', 'ATP', 'NADH', 'FADH', 'e', 'Hp', 'CoA'],
    frame: { look: [0, 0, 0], dir: [0, 0.15, 1], w: 4.6, h: 4.2 },
    rotate: { yaw: 3.2, pitch: 0.5 },
    html: `
      <p>Pulsa una palabra. La imagen muestra el modelo 3D de la palabra.</p>
      <div class="words" id="words">
        ${WORDS.map(([k, w]) => `<button data-w="${k}">${w}</button>`).join('')}
      </div>
      <div class="card info big" id="def"></div>
      <table class="tbl gloss">
        <thead><tr><th>Palabra</th><th>Significado</th></tr></thead>
        <tbody>${WORDS.map(([k, w, d]) => `<tr data-w="${k}"><td><b>${w}</b></td><td>${d}</td></tr>`).join('')}</tbody>
      </table>
    `,
    build(ctx) {
      const root = ctx.root;
      const holder = new T.Group();
      root.add(holder);
      let lab = null;
      function model(k) {
        const g = new T.Group();
        if (k === 'glucosa') {
          const s = M.skeleton(6, { layout: 'ring', color: C.glucosa });
          s.scale.setScalar(2);
          g.add(s);
        } else if (k === 'atp' || k === 'adp') {
          const a = M.atp(k === 'atp' ? 3 : 2, { size: 0.3 });
          a.scale.setScalar(2.4);
          g.add(a);
          if (k === 'adp') {
            const pi = M.pi();
            pi.scale.setScalar(2.4);
            pi.position.set(1.65, -0.6, 0);
            g.add(pi);
            a.position.x = -0.35;
          }
        } else if (k === 'piruvato') {
          const s = M.skeleton(3, { color: C.piruvato });
          s.scale.setScalar(2.2);
          g.add(s);
        } else if (k === 'acetil') {
          const s = M.skeleton(2, { color: C.acetil });
          const c = M.coa();
          c.position.set(0.76, 0, 0);
          s.add(c);
          s.scale.setScalar(2.0);
          s.position.x = -0.7;
          g.add(s);
        } else if (k === 'nadh') {
          const a = M.carrier('NADH');
          a.scale.setScalar(2);
          a.position.y = 0.75;
          const b = M.carrier('FADH2');
          b.scale.setScalar(2);
          b.position.y = -0.85;
          g.add(a, b);
        } else if (k === 'h') {
          const mem = new T.Mesh(new T.BoxGeometry(4, 0.5, 1.6), M.mat(C.inner));
          mem.position.y = -0.6;
          g.add(mem);
          for (let i = 0; i < 22; i++) {
            const p = M.sphere(0.12, C.proton);
            p.position.set(E.rand(-1.8, 1.8), E.rand(-0.05, 1.5), E.rand(-0.7, 0.7));
            g.add(p);
          }
          for (let i = 0; i < 3; i++) {
            const p = M.sphere(0.12, C.proton);
            p.position.set(E.rand(-1.8, 1.8), E.rand(-1.6, -1.1), E.rand(-0.7, 0.7));
            g.add(p);
          }
        } else if (k === 'sintasa') {
          const s = M.synthase();
          s.scale.setScalar(0.8);
          s.position.y = 1.0;
          s.userData.label.visible = false;
          g.add(s);
          g.userData.rotor = s.userData.rotor;
        }
        return g;
      }
      function choose(k) {
        while (holder.children.length) { const c = holder.children[0]; holder.remove(c); M.dispose(c); }
        const m = model(k);
        holder.add(m);
        holder.userData.rotor = m.userData.rotor;
        m.scale.setScalar(0.01);
        E.scale(m, 1, 0.45, { ease: E.ease.back });
        const w = WORDS.find((x) => x[0] === k);
        ctx.$('#def').innerHTML = `<h3>${w[1]}</h3><p>${w[2]}</p>`;
        ctx.$$('#words button').forEach((b) => b.classList.toggle('on', b.dataset.w === k));
        ctx.$$('.gloss tr[data-w]').forEach((r) => r.classList.toggle('on', r.dataset.w === k));
      }
      ctx.$('#words').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) choose(b.dataset.w); });
      ctx.$$('.gloss tr[data-w]').forEach((r) => r.addEventListener('click', () => choose(r.dataset.w)));
      choose('glucosa');
      return {
        update(dt, t) {
          holder.rotation.y = Math.sin(t * 0.6) * 0.5;
          if (holder.userData.rotor) holder.userData.rotor.rotation.y += dt * 2;
        },
      };
    },
  });

  /* ===================== 12. RESUMEN ===================== */
  const SUM = [
    ['Divide', 'Glucólisis', 'Una glucosa se transforma en dos piruvatos.', 'Citosol'],
    ['Prepara', 'Oxidación del piruvato', 'Se forma acetil-CoA y sale CO₂.', 'Matriz'],
    ['Completa el ciclo', 'Ciclo de Krebs', 'Sale más CO₂ y se cargan transportadores de electrones.', 'Matriz'],
    ['Forma mucho ATP', 'Fosforilación oxidativa', 'La energía de los electrones permite formar la mayor parte del ATP.', 'Membrana interna'],
  ];
  App.add({
    id: 'resumen',
    nav: 'Resumen',
    kicker: 'Sección 12 · Resumen para recordar',
    title: 'Resumen',
    legend: ['C', 'O', 'ATP', 'NADH'],
    frame: { look: [0, 0, 0], dir: [0, 0.35, 1], w: 13.2, h: 4.6 },
    rotate: { yaw: 0.6, pitch: 0.3 },
    html: `
      <p class="motto"><span>Divide</span> → <span>prepara</span> → <span>completa el ciclo</span> → <span>forma mucho ATP</span></p>
      <p>Pulsa una etapa. La imagen muestra esa etapa.</p>
      <ol class="sumlist" id="sum">
        ${SUM.map(([v, n, d, l], i) => `<li data-i="${i}"><div class="sv">${v}</div><div><b>${n}:</b> ${d}<span class="where">${l}</span></div></li>`).join('')}
      </ol>
      <div class="three-facts">
        <div class="fact" style="--c:${M.hex(C.atp)}"><b>ATP</b><span>Transfiere energía para el trabajo celular.</span></div>
        <div class="fact" style="--c:${M.hex(C.nadh)}"><b>NADH y FADH₂</b><span>Transportan electrones.</span></div>
        <div class="fact" style="--c:${M.hex(C.O)}"><b>Oxígeno</b><span>Recibe los electrones al final de la cadena y permite formar agua.</span></div>
      </div>
      <div class="controls"><button class="btn primary" data-go="quiz">Comprueba lo que aprendiste →</button></div>
    `,
    build(ctx) {
      const root = ctx.root;
      const XS = [-4.8, -1.6, 1.6, 4.8];
      const isles = XS.map((x, i) => {
        const g = new T.Group();
        g.position.x = x;
        const base = new T.Mesh(new T.CylinderGeometry(1.25, 1.35, 0.25, 48), M.own([C.cytosol, C.matrix, C.matrix, 0xfbd5dd][i]));
        base.position.y = -1.0;
        g.add(base);
        root.add(g);
        E.label(`${i + 1}. ${SUM[i][0]}`, [x, -1.5, 1.2], { cls: 'tag', anchor: 'b' });
        E.pickable(base, i);
        return g;
      });
      // 1: glucosa → 2 piruvatos
      const p1 = M.skeleton(3, { color: C.piruvato }); p1.position.set(-0.55, 0.45, 0); p1.scale.setScalar(0.7);
      const p2 = M.skeleton(3, { color: C.piruvato }); p2.position.set(0.55, -0.1, 0); p2.scale.setScalar(0.7);
      isles[0].add(p1, p2);
      // 2: acetil-CoA + CO2
      const ac = M.skeleton(2, { color: C.acetil }); const coa = M.coa(); coa.position.set(0.76, 0, 0); ac.add(coa); ac.position.set(-0.4, -0.1, 0); ac.scale.setScalar(0.8);
      const co = M.co2(); co.position.set(0.3, 0.75, 0);
      isles[1].add(ac, co);
      // 3: ciclo
      const ring = new T.Mesh(new T.TorusGeometry(0.75, 0.07, 10, 60), M.mat(0xf6a5b3));
      ring.position.y = 0.1;
      const runner = M.skeleton(4, { color: C.ciclo });
      runner.scale.setScalar(0.45);
      isles[2].add(ring, runner);
      // 4: ATP sintasa + ATP
      const syn = M.synthase();
      syn.userData.label.visible = false;
      syn.scale.setScalar(0.55);
      syn.position.y = 0.75;
      isles[3].add(syn);
      const atps = [0, 1, 2].map((i) => { const a = M.atp(3, { label: false }); a.scale.setScalar(0.6); a.position.set(0.85, -0.5 + i * 0.4, 0.3); isles[3].add(a); return a; });
      for (let i = 0; i < 3; i++) root.add(Object.assign(M.arrow(XS[i] + 1.35, XS[i + 1] - 1.35, -0.9), {}));

      let sel = -1;
      function choose(i) {
        sel = i;
        ctx.$$('#sum li').forEach((li) => li.classList.toggle('on', +li.dataset.i === i));
        E.frame(i < 0 ? { look: [0, 0, 0], dir: [0, 0.35, 1], w: 13.2, h: 4.6 } : { look: [XS[i], 0, 0], dir: [0, 0.3, 1], w: 3.6, h: 3.6 }, 0.8);
      }
      ctx.$('#sum').addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (!li) return;
        const i = +li.dataset.i;
        choose(sel === i ? -1 : i);
      });
      E.on('pick', (k) => { if (k != null) choose(sel === k ? -1 : k); });
      ctx.$('[data-go]').addEventListener('click', () => App.go(App.stations.findIndex((s) => s.id === 'quiz')));
      return {
        update(dt, t) {
          const a = t * 1.2;
          runner.position.set(Math.cos(a) * 0.75, 0.1 + Math.sin(a) * 0.75, 0.1);
          syn.userData.rotor.rotation.y += dt * 2;
          atps.forEach((x, i) => (x.position.y = -0.5 + i * 0.4 + Math.sin(t * 2 + i) * 0.05));
          isles.forEach((g, i) => (g.children[0].material.emissiveIntensity = 0));
          p1.rotation.z = Math.sin(t) * 0.1;
          p2.rotation.z = -Math.sin(t) * 0.1;
        },
      };
    },
  });

  /* ===================== 13. COMPRUEBA LO QUE APRENDISTE ===================== */
  const Q = [
    ['¿Para qué sirve el ATP?', ['Transporta oxígeno por la sangre.', 'Transfiere energía para el trabajo celular.', 'Divide la glucosa en dos partes.'], 1, 'El ATP transfiere energía para el trabajo celular. Por ejemplo, permite mover los músculos y transportar sustancias.', 'que-es'],
    ['¿Dónde ocurre la glucólisis?', ['En el citosol.', 'En la matriz mitocondrial.', 'En la membrana mitocondrial interna.'], 0, 'La glucólisis ocurre en el citosol. El citosol es la parte líquida del citoplasma.', 'glucolisis'],
    ['¿Cuántos piruvatos se forman a partir de una glucosa?', ['1 piruvato.', '6 piruvatos.', '2 piruvatos.'], 2, 'Una glucosa se transforma en 2 piruvatos.', 'glucolisis'],
    ['¿Cuántos carbonos tiene cada piruvato?', ['3 carbonos.', '2 carbonos.', '6 carbonos.'], 0, 'La glucosa tiene 6 carbonos. Cada piruvato tiene 3 carbonos.', 'glucolisis'],
    ['¿Qué etapas liberan CO₂?', ['La glucólisis y el ciclo de Krebs.', 'La oxidación del piruvato y el ciclo de Krebs.', 'Solo la fosforilación oxidativa.'], 1, 'La oxidación del piruvato libera 2 CO₂. El ciclo de Krebs libera 4 CO₂. La glucólisis no libera CO₂.', 'co2'],
    ['¿Qué transportan el NADH y el FADH₂?', ['Glucosa.', 'Oxígeno.', 'Electrones.'], 2, 'El NADH y el FADH₂ transportan electrones que llevan energía.', 'krebs'],
    ['¿Dónde se acumulan los protones?', ['En el espacio intermembranal.', 'En el citosol.', 'En la matriz mitocondrial.'], 0, 'La cadena mueve los protones de la matriz al espacio intermembranal. Allí se acumulan.', 'fosforilacion'],
    ['¿Qué función tiene la ATP sintasa?', ['Libera CO₂.', 'Usa el flujo de protones para formar ATP.', 'Entrega electrones al oxígeno.'], 1, 'Los protones regresan a la matriz por la ATP sintasa. La ATP sintasa usa ese flujo para formar ATP.', 'fosforilacion'],
    ['¿Qué función cumple el oxígeno?', ['Forma la glucosa.', 'Entrega electrones al NADH.', 'Recibe los electrones al final de la cadena y forma agua.'], 2, 'El oxígeno recibe los electrones al final de la cadena. Después, se combina con protones y forma agua.', 'fosforilacion'],
    ['¿Qué etapa produce la mayor parte del ATP?', ['La fosforilación oxidativa.', 'La glucólisis.', 'El ciclo de Krebs.'], 0, 'La fosforilación oxidativa produce aproximadamente 26–28 ATP por glucosa.', 'balance'],
    ['¿Por qué la fermentación permite que continúe la glucólisis?', ['Porque produce mucho ATP.', 'Porque recupera NAD⁺.', 'Porque usa oxígeno.'], 1, 'La glucólisis necesita NAD⁺. La fermentación recupera el NAD⁺. La fermentación no añade más ATP.', 'fermentacion'],
    ['¿Qué diferencia existe entre fermentación y respiración anaerobia?', ['La fermentación necesita oxígeno. La respiración anaerobia no necesita oxígeno.', 'No existe ninguna diferencia.', 'La respiración anaerobia usa una cadena de transporte de electrones. La fermentación no la usa.'], 2, 'Las dos no necesitan oxígeno. Solo la respiración anaerobia usa una cadena de transporte de electrones.', 'anaerobia'],
  ];
  App.add({
    id: 'quiz',
    nav: 'Comprueba',
    kicker: 'Sección 13 · Comprueba lo que aprendiste',
    title: 'Comprueba lo que aprendiste',
    legend: ['ATP'],
    frame: { look: [0, 1.1, 0], dir: [0, 0.25, 1], w: 6.4, h: 5.9 },
    rotate: { yaw: 3.2, pitch: 0.3 },
    html: `
      <p>Responde sin mirar el texto. Cada respuesta correcta añade 1 ATP a tu pila.</p>
      <div class="quiz" id="quiz"></div>
    `,
    build(ctx) {
      const root = ctx.root;
      const mito = M.miniMito(1.8);
      mito.scale.setScalar(1.3);
      mito.position.y = 2.6;
      root.add(mito);
      const dots = Q.map((_, i) => {
        const d = M.sphere(0.13, 0xcbd5e1);
        const a = (i / Q.length) * Math.PI * 2;
        d.position.set(Math.cos(a) * 2.4, 2.6 + Math.sin(a) * 0.5, Math.sin(a) * 1.2);
        root.add(d);
        return d;
      });
      const pad = new T.Mesh(new T.CylinderGeometry(0.7, 0.7, 0.06, 40), M.mat(0xcbd5e1));
      pad.position.y = -0.6;
      root.add(pad);
      const gold = M.mat(C.atp, { rough: 0.3 });
      const coins = [];
      const scoreLab = E.label('0 ATP', [0, -0.95, 0.6], { cls: 'tag gold big', anchor: 'b' });
      let qi = 0, score = 0;
      const wrong = [];
      const box = ctx.$('#quiz');
      function addCoin() {
        const m = new T.Mesh(M.geo.coin, gold);
        const y = -0.52 + coins.length * 0.13;
        m.position.set(0, y + 3, 0);
        root.add(m);
        coins.push(m);
        E.anim(0.5, (k) => (m.position.y = y + 3 * (1 - k)), { ease: E.ease.in });
      }
      function render() {
        if (qi >= Q.length) return finish();
        const [q, opts] = Q[qi];
        box.innerHTML = `
          <div class="q-head"><span>Pregunta ${qi + 1} de ${Q.length}</span><span>${score} correctas</span></div>
          <div class="q-bar"><i style="width:${(qi / Q.length) * 100}%"></i></div>
          <h2 class="q">${q}</h2>
          <div class="opts">${opts.map((o, i) => `<button data-i="${i}"><span class="L">${'ABC'[i]}</span>${o}</button>`).join('')}</div>
          <div class="fb hide" id="fb"></div>`;
        box.querySelector('.opts').addEventListener('click', answer, { once: false });
      }
      function answer(e) {
        const b = e.target.closest('button');
        if (!b || box.querySelector('.opts').classList.contains('done')) return;
        const [, , ok, why, go] = Q[qi];
        const i = +b.dataset.i;
        const right = i === ok;
        box.querySelector('.opts').classList.add('done');
        box.querySelectorAll('.opts button').forEach((x, j) => {
          x.disabled = true;
          if (j === ok) x.classList.add('ok');
          else if (j === i) x.classList.add('bad');
        });
        dots[qi].material = M.mat(right ? 0x22c55e : 0xef4444);
        if (right) { score++; addCoin(); } else wrong.push(qi);
        scoreLab.set(score + ' ATP');
        const st = App.stations.find((s) => s.id === go);
        const fb = box.querySelector('#fb');
        fb.className = 'fb ' + (right ? 'ok' : 'bad');
        fb.innerHTML = `<b>${right ? '✓ Correcto.' : '✗ Incorrecto.'}</b> ${why}
          <div class="fb-row">${right ? '' : `<button class="btn ghost small" data-review="${go}">Repasa: ${st ? st.nav : ''}</button>`}
          <button class="btn primary" id="nextq">${qi + 1 < Q.length ? 'Siguiente pregunta →' : 'Ver resultado →'}</button></div>`;
        fb.querySelector('#nextq').addEventListener('click', () => { qi++; render(); });
        const rv = fb.querySelector('[data-review]');
        if (rv) rv.addEventListener('click', () => App.go(App.stations.findIndex((s) => s.id === go)));
      }
      function finish() {
        const msg = score === Q.length ? '¡Excelente! Respondiste todas las preguntas bien.' : score >= 9 ? 'Muy bien. Repasa las preguntas incorrectas.' : 'Repasa las estaciones de las preguntas incorrectas. Después, intenta otra vez.';
        box.innerHTML = `
          <div class="final">
            <div class="final-n">${score}<span>/ ${Q.length}</span></div>
            <p>${msg}</p>
            ${wrong.length ? `<div class="review"><h3>Para repasar</h3><ul>${wrong.map((w) => `<li><button class="link" data-go="${Q[w][4]}">${Q[w][0]}</button></li>`).join('')}</ul></div>` : ''}
            <div class="controls"><button class="btn primary" id="again">↺ Responder otra vez</button></div>
          </div>`;
        box.querySelector('#again').addEventListener('click', () => App.reload());
        box.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => App.go(App.stations.findIndex((s) => s.id === b.dataset.go))));
      }
      render();
      return {
        update(dt, t) {
          mito.rotation.y = t * 0.5;
          mito.rotation.x = Math.sin(t * 0.4) * 0.3;
        },
      };
    },
  });
})();
