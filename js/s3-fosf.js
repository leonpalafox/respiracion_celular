/* Estaciones 6–8: fosforilación oxidativa, balance de ATP, origen del CO2. */
(function () {
  'use strict';
  const T = THREE;
  const C = M.COL;
  const V = (x, y, z) => new T.Vector3(x, y, z || 0);

  function blob(spheres, hex, label) {
    const g = new T.Group();
    const m = M.mat(hex, { rough: 0.55 });
    spheres.forEach(([x, y, r, z]) => {
      const s = new T.Mesh(M.geo.sph, m);
      s.scale.setScalar(r);
      s.position.set(x, y, z || 0);
      g.add(s);
    });
    if (label) {
      const t = M.text(label, { size: 0.34, color: '#0c4a6e' });
      const [x, y] = spheres[0];
      t.position.set(x, y, 0.7);
      g.add(t);
    }
    return g;
  }
  M.blob = blob;

  // Cadena de transporte de electrones + ATP sintasa sobre una membrana.
  // Se usa en la estación 6 y, simplificada, en la estación 10.
  M.synthase = function () {
    const syn = new T.Group();
    const rotor = new T.Group();
    const n = 10;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const s = new T.Mesh(new T.CapsuleGeometry(0.13, 0.5, 4, 10), M.mat(i % 2 ? 0x2fa77a : 0x6fd6ac));
      s.position.set(Math.cos(a) * 0.48, 0, Math.sin(a) * 0.48);
      rotor.add(s);
    }
    const stalk = new T.Mesh(M.geo.cyl, M.mat(0x2fa77a));
    stalk.scale.set(0.11, 1.35, 0.11);
    stalk.position.y = -0.85;
    rotor.add(stalk);
    syn.add(rotor);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const s = M.sphere(0.32, i % 2 ? C.sintasa : 0x8fe3bf);
      s.position.set(Math.cos(a) * 0.4, -1.85, Math.sin(a) * 0.4);
      syn.add(s);
    }
    const cap = M.sphere(0.25, C.sintasa);
    cap.position.y = -2.3;
    syn.add(cap);
    const arm = new T.Mesh(M.geo.cyl, M.mat(0x2fa77a));
    arm.scale.set(0.07, 2.0, 0.07);
    arm.position.set(0.8, -0.9, 0);
    syn.add(arm);
    const armTop = M.sphere(0.2, 0x2fa77a);
    armTop.position.set(0.8, 0.0, 0);
    syn.add(armTop);
    const t = M.text('ATP sintasa', { size: 0.3, color: '#065f46' });
    t.position.set(0, -2.85, 0.6);
    syn.add(t);
    syn.userData.rotor = rotor;
    syn.userData.label = t;
    return syn;
  };

  M.chain = function (root, o) {
    o = o || {};
    const mem = M.membrane({ w: o.w || 12.4, d: 1.5 });
    root.add(mem);
    const parts = {};
    const lb = (t) => (o.plain ? null : t);
    parts.I = blob([[-4.3, 0.05, 0.55], [-4.75, 0.1, 0.45], [-3.85, -0.75, 0.42], [-3.8, -1.35, 0.4]], C.complejo, lb('I'));
    if (!o.noII) parts.II = blob([[-2.6, -0.45, 0.4], [-2.6, -1.05, 0.38]], 0x9ec9f5, lb('II'));
    parts.III = blob([[-0.9, 0.1, 0.55], [-1.3, 0.1, 0.45], [-0.5, 0.1, 0.45], [-0.9, -0.7, 0.42], [-0.9, 0.82, 0.32]], C.complejo, lb('III'));
    parts.IV = blob([[1.35, 0.1, 0.55], [1.8, 0.05, 0.42], [1.35, -0.72, 0.42], [1.35, 0.82, 0.32]], C.complejo, lb('IV'));
    parts.c = blob([[0.22, 1.05, 0.2]], 0xf9a8d4);
    Object.values(parts).forEach((p) => { p.position.z = 0.35; root.add(p); });
    if (!o.noSynthase) {
      const syn = M.synthase();
      syn.position.set(4.2, 0, 0.35);
      root.add(syn);
      parts.syn = syn;
      parts.rotor = syn.userData.rotor;
    }
    return parts;
  };

  /* ===================== 6. FOSFORILACIÓN OXIDATIVA ===================== */
  App.add({
    id: 'fosforilacion',
    nav: 'Fosforilación oxidativa',
    kicker: 'Sección 6 · Etapa 4 · Membrana mitocondrial interna',
    title: 'Fosforilación oxidativa',
    place: 'membrana',
    ledger: true,
    legend: ['NADH', 'NAD', 'FADH', 'e', 'Hp', 'O', 'H', 'ATP'],
    frame: { look: [0, -0.1, 0], dir: [0, 0.07, 1], w: 12.6, h: 6.6 },
    rotate: { yaw: 0.75, pitch: 0.35 },
    html: `
      <p>Esta etapa produce <b>la mayor parte del ATP</b>.</p>
      <p>Incluye dos procesos: la <b>cadena de transporte de electrones</b> y la <b>quimiósmosis</b>.</p>
      <p>Pulsa un botón para entregar electrones a la cadena.</p>
      <div class="controls wrap">
        <button class="btn primary" id="b-nadh">Entregar 1 NADH</button>
        <button class="btn violet" id="b-fadh">Entregar 1 FADH₂</button>
        <button class="btn ghost" id="b-all">Entregar todo</button>
      </div>
      <div class="toggle-row">
        <span>Oxígeno en la matriz:</span>
        <div class="seg" id="oxy"><button data-v="1" class="on">Sí</button><button data-v="0">No</button></div>
      </div>
      <div class="alert hide" id="alert">La cadena está detenida. Sin oxígeno, los electrones no tienen receptor final.</div>
      ${'' /* contadores */}
      <div class="counters">
        <div class="ct"><i style="background:${M.hex(C.nadh)}"></i><b id="c-nadh">10</b><span>NADH por entregar</span></div>
        <div class="ct"><i style="background:${M.hex(C.fadh)}"></i><b id="c-fadh">2</b><span>FADH₂ por entregar</span></div>
        <div class="ct"><i style="background:${M.hex(C.atp)}"></i><b id="c-atp">0</b><span>ATP formado</span></div>
      </div>
      <div class="gauge">
        <div class="gauge-h">Protones (H⁺)</div>
        <div class="gbar"><span>Espacio intermembranal</span><div class="gtrack"><div class="gfill" id="g-ims"></div></div><b id="c-ims">0</b></div>
        <div class="gbar"><span>Matriz</span><div class="gtrack"><div class="gfill low" id="g-mat"></div></div><b id="c-mat">6</b></div>
      </div>
      <ol class="steplist big" id="sl">
        <li><b>Los transportadores entregan electrones.</b> El NADH y el FADH₂ entregan electrones a una cadena de proteínas. Estas proteínas están en la membrana interna.</li>
        <li><b>La cadena mueve protones.</b> Los electrones pasan por la cadena y liberan energía. La cadena usa esa energía para mover protones (H⁺) de la matriz al espacio intermembranal.</li>
        <li><b>Los protones se acumulan.</b> Hay más protones en el espacio intermembranal que en la matriz. Esta diferencia permite realizar trabajo cuando los protones regresan.</li>
        <li><b>Los protones regresan por la ATP sintasa.</b> Los protones regresan a la matriz por una proteína llamada ATP sintasa. Este paso forma parte de la quimiósmosis.</li>
        <li><b>Se forma ATP.</b> La ATP sintasa usa el flujo de protones para formar ATP: <span class="formula inline">ADP + Pi → ATP</span></li>
      </ol>
      <div class="card">
        <h3>¿Qué función cumple el oxígeno?</h3>
        <p>El oxígeno recibe los electrones al final de la cadena. Después, el oxígeno se combina con protones y forma <b>agua</b>.</p>
        <p><b>Sin oxígeno, esta cadena no puede continuar de forma normal en nuestras células.</b> Selecciona «No» en «Oxígeno» y observa la cadena.</p>
      </div>
      <p class="note">En este modelo, 1 NADH mueve 10 protones. 1 FADH₂ mueve 6 protones. La ATP sintasa usa aproximadamente 4 protones para formar 1 ATP. Así, el modelo forma hasta 28 ATP. Los valores reales varían: aproximadamente 26–28 ATP.</p>
      <div class="controls"><button class="btn ghost small" id="b-reset">↺ Reiniciar esta etapa</button></div>
    `,
    build(ctx) {
      const root = ctx.root;
      // fondos
      const top = new T.Mesh(new T.PlaneGeometry(13.4, 3.2), M.mat(C.ims));
      top.position.set(0, 1.85, -1.65);
      const bot = new T.Mesh(new T.PlaneGeometry(13.4, 3.4), M.mat(C.matrix));
      bot.position.set(0, -1.95, -1.65);
      root.add(top, bot);
      const P = M.chain(root);
      E.label('Espacio intermembranal', [-6.1, 2.95, 0], { cls: 'tag', anchor: 'r' });
      E.label('Matriz mitocondrial', [-6.1, -3.2, 0], { cls: 'tag', anchor: 'r' });
      E.label('Membrana interna', [-6.2, 0, 1.5], { cls: 'tag small', anchor: 'r' });
      const lO2 = E.label('O₂', [2.05, -2.35, 0.3], { cls: 'tag small' });
      const lStop = E.label('¡Sin receptor final!', [1.35, -1.55, 0.6], { cls: 'tag warn', hidden: true });
      const lATP = E.label('ATP: 0', [5.4, -2.5, 0.3], { cls: 'tag gold' });

      const S = { nadh: 10, fadh: 2, atp: 0, used: 0, oxy: true, waiting: 0, acc: 0 };
      const pool = [];
      const matP = [];
      const pm = M.mat(C.proton);
      function mkProton() {
        const p = new T.Mesh(M.geo.lo, pm);
        p.scale.setScalar(0.075);
        root.add(p);
        return p;
      }
      for (let i = 0; i < 6; i++) {
        const p = mkProton();
        p.position.set(E.rand(-5.5, 5.5), E.rand(-3.0, -1.0), E.rand(-1.0, 1.0));
        p.userData.v = V(E.rand(-1, 1), E.rand(-1, 1), E.rand(-1, 1)).multiplyScalar(0.4);
        matP.push(p);
      }
      const o2 = M.o2();
      o2.position.set(2.05, -2.0, 0.3);
      root.add(o2);

      function flash(i) {
        const li = ctx.$$('#sl li')[i];
        if (!li) return;
        li.classList.add('hit');
        clearTimeout(li._t);
        li._t = setTimeout(() => li.classList.remove('hit'), 1400);
      }
      function show() {
        App.setCount(ctx, '#c-nadh', S.nadh);
        App.setCount(ctx, '#c-fadh', S.fadh);
        App.setCount(ctx, '#c-atp', S.atp);
        App.setCount(ctx, '#c-ims', pool.length);
        ctx.$('#g-ims').style.width = Math.min(100, (pool.length / 60) * 100) + '%';
        ctx.$('#g-mat').style.width = (6 / 60) * 100 + '%';
        ctx.$('#b-nadh').disabled = S.nadh <= 0;
        ctx.$('#b-fadh').disabled = S.fadh <= 0;
        ctx.$('#b-all').disabled = S.nadh + S.fadh <= 0;
        lATP.set('ATP: ' + S.atp);
        lStop.show(!S.oxy && S.waiting > 0);
        lO2.show(S.oxy);
        o2.visible = S.oxy;
      }
      async function pump(x) {
        const p = mkProton();
        p.position.set(x + E.rand(-0.4, 0.4), -2.6, E.rand(-0.5, 0.5));
        await E.move(p, V(x, -1.2, 0.95), 0.45);
        await E.move(p, V(x, 0.9, 0.95), 0.5);
        await E.move(p, V(x + E.rand(-1.4, 1.4), E.rand(1.0, 2.6), E.rand(-1, 1)), 0.4);
        p.userData.v = V(E.rand(-1, 1), E.rand(-1, 1), E.rand(-1, 1)).multiplyScalar(0.5);
        pool.push(p);
        flash(2);
        show();
      }
      async function hop(es, pts, dur) {
        for (const q of pts) await Promise.all(es.map((e, i) => E.move(e, V(q[0] + i * 0.14 - 0.07, q[1], 1.05), dur)));
      }
      async function deliver(kind) {
        if (!S.oxy) {
          ctx.$('#alert').classList.remove('hide');
          return;
        }
        if (kind === 'NADH' ? S.nadh <= 0 : S.fadh <= 0) return;
        if (kind === 'NADH') S.nadh--; else S.fadh--;
        show();
        const isN = kind === 'NADH';
        const dock = isN ? V(-3.8, -2.05, 0.6) : V(-2.6, -1.75, 0.6);
        const car = M.carrier(isN ? 'NADH' : 'FADH2');
        car.position.set(dock.x - 1.6, -3.1, 0.6);
        root.add(car);
        await E.move(car, dock, 0.7);
        flash(0);
        const es = car.userData.es.map((e0) => {
          const e = M.electron();
          e.position.copy(M.rootPos(e0));
          root.add(e);
          return e;
        });
        M.setCarrier(car, isN ? 'NAD+' : 'FAD');
        E.move(car, V(dock.x - 1.2, -3.2, 0.6), 1.2).then(() => E.fade(car, 0, 0.5)).then(() => root.remove(car));
        if (isN) {
          await hop(es, [[-3.8, -1.35], [-4.3, -0.1]], 0.35);
          flash(1);
          for (let i = 0; i < 4; i++) pump(-4.3 + (i - 1.5) * 0.18);
          await hop(es, [[-2.6, -0.05], [-0.9, 0.1]], 0.35);
        } else {
          await hop(es, [[-2.6, -1.05], [-2.6, -0.1], [-0.9, 0.1]], 0.35);
          flash(1);
        }
        for (let i = 0; i < 4; i++) pump(-0.9 + (i - 1.5) * 0.18);
        await hop(es, [[0.22, 1.05], [1.35, 0.1]], 0.35);
        for (let i = 0; i < 2; i++) pump(1.35 + (i - 0.5) * 0.2);
        await hop(es, [[1.35, -0.8]], 0.35);
        // el oxígeno recibe los electrones
        S.waiting++;
        show();
        await E.until(() => S.oxy, 0.15);
        S.waiting--;
        show();
        const ox = M.oAtom();
        ox.position.set(2.05, -2.0, 0.3);
        root.add(ox);
        await Promise.all([E.move(ox, V(1.35, -1.55, 0.6), 0.4), hop(es, [[1.35, -1.55]], 0.4)]);
        es.forEach((e) => root.remove(e));
        const hs = [0, 1].map((i) => {
          const h = mkProton();
          h.position.set(1.35 + (i ? 0.9 : -0.9), -2.6, 0.6);
          return h;
        });
        await Promise.all(hs.map((h, i) => E.move(h, V(1.35 + (i ? 0.2 : -0.2), -1.75, 0.6), 0.45)));
        hs.forEach((h) => root.remove(h));
        root.remove(ox);
        const w = M.h2o();
        w.position.set(1.35, -1.6, 0.6);
        root.add(w);
        const wl = E.label('H₂O', w, { cls: 'tag small', off: [0, 0.4, 0] });
        await E.move(w, V(E.rand(-0.5, 0.6), -2.9, 0.6), 1.4);
        wl.show(false);
        await E.fade(w, 0, 0.6);
        root.remove(w);
      }
      // la ATP sintasa usa los protones acumulados
      async function through(p) {
        flash(3);
        await E.move(p, V(4.2 + 0.48, 0.9, 0.5), 0.35);
        await E.move(p, V(4.2 + 0.48, -0.45, 0.5), 0.35);
        const n = ++S.used;
        rotorTarget += (Math.PI * 2) / 10;
        if (n % 4 === 0) makeATP();
        await E.move(p, V(4.9 + E.rand(-0.3, 0.3), -1.4, 0.6), 0.3);
        root.remove(p);
      }
      async function makeATP() {
        flash(4);
        const a = M.atp(2);
        a.position.set(3.4, -2.6, 0.7);
        root.add(a);
        const pi = M.pi();
        pi.position.set(5.0, -3.0, 0.7);
        root.add(pi);
        await Promise.all([E.move(a, V(3.95, -2.35, 0.8), 0.35), E.move(pi, V(4.5, -2.35, 0.8), 0.35)]);
        root.remove(pi);
        M.setP(a, 3);
        S.atp++;
        App.record('fosf', { atp: S.atp });
        show();
        await E.scale(a, 1.3, 0.12).then(() => E.scale(a, 1, 0.15));
        await E.move(a, V(5.2 + E.rand(-0.3, 0.6), -3.3, 0.8), 0.9);
        await E.fade(a, 0, 0.4);
        root.remove(a);
      }

      ctx.$('#b-nadh').addEventListener('click', () => deliver('NADH'));
      ctx.$('#b-fadh').addEventListener('click', () => deliver('FADH2'));
      ctx.$('#b-all').addEventListener('click', async () => {
        if (!S.oxy) { ctx.$('#alert').classList.remove('hide'); return; }
        while ((S.nadh > 0 || S.fadh > 0) && S.oxy) {
          deliver(S.nadh > 0 ? 'NADH' : 'FADH2');
          await E.wait(0.7);
        }
      });
      ctx.$('#b-reset').addEventListener('click', () => App.reload());
      ctx.$('#oxy').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        S.oxy = b.dataset.v === '1';
        ctx.$$('#oxy button').forEach((x) => x.classList.toggle('on', x === b));
        ctx.$('#alert').classList.toggle('hide', S.oxy);
        show();
      });
      show();

      let rotorTarget = 0, rotorA = 0;
      return {
        update(dt, t) {
          const step = (p, lo, hi) => {
            const v = p.userData.v;
            v.x += E.rand(-1, 1) * dt * 2; v.y += E.rand(-1, 1) * dt * 2; v.z += E.rand(-1, 1) * dt * 2;
            v.clampLength(0, 0.7);
            p.position.addScaledVector(v, dt);
            ['x', 'y', 'z'].forEach((k, i) => {
              if (p.position[k] < lo[i]) { p.position[k] = lo[i]; v[k] = Math.abs(v[k]); }
              if (p.position[k] > hi[i]) { p.position[k] = hi[i]; v[k] = -Math.abs(v[k]); }
            });
          };
          pool.forEach((p) => { if (!p.userData.busy) step(p, [-5.8, 0.85, -0.8], [5.8, 2.9, 1.2]); });
          matP.forEach((p) => step(p, [-5.8, -3.1, -0.8], [5.8, -0.9, 1.2]));
          // ritmo de la ATP sintasa: más protones acumulados = flujo más rápido
          const free = pool.filter((p) => !p.userData.busy);
          const rate = free.length ? Math.min(7, 0.8 + free.length * 0.3) : 0;
          S.acc += dt * rate;
          while (S.acc >= 1 && free.length) {
            S.acc -= 1;
            free.sort((a, b) => Math.abs(a.position.x - 4.2) - Math.abs(b.position.x - 4.2));
            const p = free.shift();
            p.userData.busy = true;
            pool.splice(pool.indexOf(p), 1);
            show();
            through(p);
          }
          if (!free.length) S.acc = 0;
          rotorA += (rotorTarget - rotorA) * Math.min(1, dt * 6);
          if (P.rotor) P.rotor.rotation.y = rotorA;
          o2.rotation.z = Math.sin(t * 2) * 0.3;
        },
      };
    },
  });

  /* ===================== 7. ¿CUÁNTO ATP? ===================== */
  const CALC = {
    hab: { rows: [2, 0, 2, [26, 28]], tot: 'Aproximadamente 30–32', fos: 'Aproximadamente 26–28', name: 'Cálculo habitual' },
    cla: { rows: [2, 0, 2, [32, 34]], tot: '36–38', fos: '32–34', name: 'Cálculo clásico' },
  };
  App.add({
    id: 'balance',
    nav: '¿Cuánto ATP?',
    kicker: 'Sección 7 · Balance',
    title: '¿Cuánto ATP se obtiene?',
    legend: ['ATP'],
    frame: { look: [0, 1.7, 0], dir: [0, 0.22, 1], w: 9.4, h: 5.6 },
    rotate: { yaw: 0.8, pitch: 0.25 },
    html: `
      <p>Todos los valores siguientes corresponden a <b>una glucosa</b>. Cada moneda dorada es 1 ATP.</p>
      <div class="seg wide" id="calc"><button data-v="hab" class="on">Cálculo habitual<small>30–32 ATP</small></button><button data-v="cla">Cálculo clásico<small>36–38 ATP</small></button></div>
      <table class="tbl num">
        <thead><tr><th>Etapa</th><th>ATP obtenido</th></tr></thead>
        <tbody>
          <tr><td>Glucólisis</td><td>2 netos</td></tr>
          <tr><td>Oxidación del piruvato</td><td>0</td></tr>
          <tr><td>Ciclo de Krebs</td><td>2 equivalentes</td></tr>
          <tr class="hl"><td>Fosforilación oxidativa</td><td id="t-fos">Aproximadamente 26–28</td></tr>
          <tr class="tot"><td><b>Total estimado</b></td><td><b id="t-tot">Aproximadamente 30–32</b></td></tr>
        </tbody>
      </table>
      <p>La cantidad puede variar.</p>
      <p class="note" id="why">El cálculo habitual usa estos valores: 1 NADH forma aproximadamente 2,5 ATP. 1 FADH₂ forma aproximadamente 1,5 ATP.</p>
      <div class="callout warn"><b>Tu guía escolar usa el cálculo clásico de 36–38 ATP.</b> Para el examen, confirma qué cálculo pide tu docente.</div>
      <div class="callout">La idea principal es la misma en los dos cálculos: <b>la mayor parte del ATP se forma durante la fosforilación oxidativa</b>.</div>
    `,
    build(ctx) {
      const root = ctx.root;
      const floor = new T.Mesh(new T.CylinderGeometry(4.9, 4.9, 0.12, 64), M.mat(0xdbe4ee));
      floor.position.y = -0.1;
      root.add(floor);
      const XS = [-3.3, -1.1, 1.1, 3.3];
      const NAMES = ['Glucólisis', 'Oxidación del piruvato', 'Ciclo de Krebs', 'Fosforilación oxidativa'];
      const gold = M.mat(C.atp, { rough: 0.3 });
      const ghost = M.mat(C.atp, { opacity: 0.35, rough: 0.3 });
      XS.forEach((x, i) => {
        const pad = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.05, 40), M.mat(0xcbd5e1));
        pad.position.set(x, 0, 0);
        root.add(pad);
        E.label(NAMES[i], [x, -0.05, 0.9], { cls: 'tag small', anchor: 'b' });
      });
      const coins = new T.Group();
      root.add(coins);
      const valLabs = XS.map((x) => E.label('', [x, 0.3, 0], { cls: 'tag gold', anchor: 't' }));
      const totLab = E.label('', [0, 5.4, 0], { cls: 'tag big' });
      let mode = 'hab';
      function build() {
        E.gen++; // cancela animaciones anteriores
        while (coins.children.length) coins.remove(coins.children[0]);
        const c = CALC[mode];
        ctx.$('#t-fos').textContent = c.fos;
        ctx.$('#t-tot').textContent = c.tot;
        ctx.$('#why').textContent = mode === 'hab'
          ? 'El cálculo habitual usa estos valores: 1 NADH forma aproximadamente 2,5 ATP. 1 FADH₂ forma aproximadamente 1,5 ATP.'
          : 'El cálculo clásico usa estos valores: 1 NADH forma 3 ATP. 1 FADH₂ forma 2 ATP.';
        totLab.set(`Total: ${c.tot} ATP`);
        c.rows.forEach((v, i) => {
          const lo = Array.isArray(v) ? v[0] : v, hi = Array.isArray(v) ? v[1] : v;
          valLabs[i].set(Array.isArray(v) ? `${lo}–${hi}` : String(v));
          valLabs[i].target = [XS[i], 0.15 + hi * 0.13 + 0.15, 0];
          for (let k = 0; k < hi; k++) {
            const m = new T.Mesh(M.geo.coin, k < lo ? gold : ghost);
            const y = 0.09 + k * 0.13;
            m.position.set(XS[i], y + 4, 0);
            m.rotation.y = k * 0.4;
            m.visible = false;
            coins.add(m);
            const d = (i === 3 ? 0.35 : 0) + k * (i === 3 ? 0.03 : 0.12);
            E.anim(0.35, (e) => { m.visible = true; m.position.y = y + 4 * (1 - e); }, { delay: d, ease: E.ease.in });
          }
        });
      }
      ctx.$('#calc').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b || b.dataset.v === mode) return;
        mode = b.dataset.v;
        ctx.$$('#calc button').forEach((x) => x.classList.toggle('on', x === b));
        build();
      });
      build();
      return { update(dt, t) { coins.rotation.y = 0; } };
    },
  });

  /* ===================== 8. ¿DE DÓNDE SALE EL CO2? ===================== */
  App.add({
    id: 'co2',
    nav: '¿De dónde sale el CO₂?',
    kicker: 'Sección 8 · Seguir los carbonos',
    title: '¿De dónde sale el dióxido de carbono?',
    legend: ['C', 'O'],
    frame: { look: [0, 0.3, 0], dir: [0, 0.1, 1], w: 9.4, h: 6.4 },
    rotate: { yaw: 0.7, pitch: 0.3 },
    html: `
      <p>Los carbonos de la glucosa terminan formando CO₂.</p>
      <p>Cada carbono de la imagen tiene un número. Pulsa «Siguiente etapa». Observa adónde va cada carbono.</p>
      <ol class="steplist" id="sl">
        <li><b>Glucólisis:</b> la glucosa se divide en 2 piruvatos. <b>No sale CO₂.</b></li>
        <li><b>Oxidación del piruvato:</b> sale 1 carbono de cada piruvato. <b>Salen 2 CO₂.</b></li>
        <li><b>Ciclo de Krebs:</b> salen los 4 carbonos restantes. <b>Salen 4 CO₂.</b></li>
      </ol>
      <div class="controls"><button class="btn primary" id="step">Siguiente etapa →</button></div>
      <div class="counters"><div class="ct"><i style="background:#8b95a5"></i><b id="c-co2">0</b><span>CO₂ liberados (de 6)</span></div></div>
      <div class="callout"><b>La glucólisis no libera CO₂.</b></div>
      <div class="result hide" id="result"><div class="result-h">Por cada glucosa</div><ul><li>La oxidación del piruvato libera 2 CO₂.</li><li>El ciclo de Krebs libera 4 CO₂.</li><li>En total se liberan <b>6 CO₂</b>.</li></ul></div>
    `,
    build(ctx) {
      const root = ctx.root;
      const glu = M.skeleton(6, { layout: 'ring', color: C.glucosa, label: 'Glucosa', labelY: -0.98, size: 0.3 });
      glu.position.set(0, -0.6, 0);
      root.add(glu);
      const A = glu.userData.atoms;
      const nums = A.map((a, i) => {
        const t = M.text(String(i + 1), { size: 0.26, color: '#ffffff', stroke: 'rgba(0,0,0,0)' });
        a.add(t);
        t.scale.multiplyScalar(1 / 0.19);
        t.position.set(0, 0, 1.2);
        return t;
      });
      // bandeja de CO2
      const tray = new T.Mesh(new T.BoxGeometry(7.4, 0.08, 1.2), M.mat(0xdfe6ee));
      tray.position.set(0, 2.25, -0.2);
      root.add(tray);
      E.label('CO₂ liberado', [-3.65, 2.65, 0], { cls: 'tag', anchor: 'l' });
      const slots = [0, 1, 2, 3, 4, 5].map((i) => V(-2.9 + i * 1.2, 2.65, 0));
      let used = 0, co2n = 0;
      const tags = [];
      async function release(atom, stage) {
        const where = M.rootPos(atom);
        atom.visible = false;
        const c = M.co2();
        c.position.copy(where);
        root.add(c);
        const n = M.text(String(A.indexOf(atom) + 1), { size: 0.26, color: '#ffffff', stroke: 'rgba(0,0,0,0)' });
        n.position.set(0, 0, 0.25);
        c.add(n);
        const s = slots[used++];
        await E.move(c, s, 1.0, { arc: 0.4 });
        tags.push(E.label(stage, [s.x, 3.15, 0], { cls: 'tag small ' + (stage === 'Krebs' ? 'rose' : 'teal') }));
        co2n++;
        App.setCount(ctx, '#c-co2', co2n);
      }
      const pl = [];
      const s1 = async () => {
        M.unlink(glu, A[2], A[3]);
        M.unlink(glu, A[5], A[0]);
        E.fade(glu.userData.halo, 0, 0.4);
        glu.userData.label.visible = false;
        const lay = M.layout(3, 'chain');
        const from = A.map((a) => a.position.clone());
        // los carbonos 3 y 4 quedan en el extremo del piruvato que sale primero
        const to = new Map();
        [A[0], A[1], A[2]].forEach((a, j) => to.set(a, lay[j].clone().add(V(-1.9, 0, 0))));
        [A[3], A[4], A[5]].forEach((a, j) => to.set(a, lay[j].clone().add(V(1.9, 0, 0))));
        await E.anim(1.0, (k) => { A.forEach((a, i) => a.position.lerpVectors(from[i], to.get(a), k)); M.refresh(glu); });
        pl.push(E.label('Piruvato', [-1.9, -1.35, 0], { cls: 'tag teal' }));
        pl.push(E.label('Piruvato', [1.9, -1.35, 0], { cls: 'tag teal' }));
        E.label('0 CO₂ en la glucólisis', [0, 0.6, 0], { cls: 'tag' });
      };
      const s2 = async () => {
        M.unlink(glu, A[1], A[2]);
        M.unlink(glu, A[3], A[4]);
        await Promise.all([release(A[2], 'Piruvato'), release(A[3], 'Piruvato')]);
        pl.forEach((l) => l.set('Acetilo (2 C)'));
      };
      const s3 = async () => {
        M.unlink(glu, A[0], A[1]);
        M.unlink(glu, A[4], A[5]);
        pl.forEach((l) => l.show(false));
        for (const a of [A[0], A[1], A[4], A[5]]) await release(a, 'Krebs');
        ctx.$('#result').classList.remove('hide');
      };
      App.stepper(ctx, { button: '#step', list: '#sl', steps: [s1, s2, s3], reset: () => App.reload(), again: '↺ Repetir' });
      return { update() {} };
    },
  });
})();
