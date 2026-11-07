/* Estaciones 0–2: inicio, idea principal, lugares. */
(function () {
  'use strict';
  const T = THREE;
  const C = M.COL;

  M.arrow = function (x0, x1, y, hex) {
    const g = new T.Group();
    const len = x1 - x0;
    const shaft = new T.Mesh(M.geo.cyl, M.mat(hex || 0x94a3b8));
    shaft.scale.set(0.06, len - 0.35, 0.06);
    shaft.rotation.z = -Math.PI / 2;
    shaft.position.set(x0 + (len - 0.35) / 2, y, 0);
    const head = new T.Mesh(new T.ConeGeometry(0.18, 0.4, 20), M.mat(hex || 0x94a3b8));
    head.rotation.z = -Math.PI / 2;
    head.position.set(x1 - 0.2, y, 0);
    g.add(shaft, head);
    return g;
  };

  /* ===================== 0. INICIO ===================== */
  App.add({
    id: 'inicio',
    nav: 'Inicio',
    kicker: 'Un viaje al interior de la célula',
    title: 'Respiración celular',
    place: 'celula',
    legend: ['C', 'ATP'],
    frame: { look: [0, 0, 0], dir: [0.15, 0.25, 1], w: 7.6, h: 7.4 },
    rotate: { yaw: 3.2, pitch: 0.4 },
    html: `
      <p class="lead">Tus células necesitan energía para trabajar. Las células obtienen esa energía de la glucosa.</p>
      <p>En esta página, sigues una glucosa. Ves cómo la célula transforma la glucosa paso a paso.</p>
      <div class="card howto">
        <h3>Cómo usar esta página</h3>
        <ul>
          <li><b>Arrastra</b> la imagen 3D para girarla.</li>
          <li><b>Pulsa</b> los botones para iniciar cada animación.</li>
          <li><b>Pulsa «Siguiente»</b> para ir a la estación siguiente.</li>
        </ul>
      </div>
      <p class="note">Cada color tiene un solo significado. La leyenda, debajo de la imagen, indica el significado de cada color.</p>
      <div class="map">
        <div class="map-h">El viaje tiene 4 etapas</div>
        <ol class="route">
          <li><b>Glucólisis</b><span>Citosol</span></li>
          <li><b>Oxidación del piruvato</b><span>Matriz</span></li>
          <li><b>Ciclo de Krebs</b><span>Matriz</span></li>
          <li><b>Fosforilación oxidativa</b><span>Membrana interna</span></li>
        </ol>
      </div>
      <button class="btn primary big" data-go="1">Empezar el viaje →</button>
    `,
    build(ctx) {
      const root = ctx.root;
      ctx.$('[data-go]').addEventListener('click', () => App.go(1));
      const world = new T.Group();
      root.add(world);

      const cell = new T.Mesh(new T.SphereGeometry(3.2, 64, 48), M.mat(0x8cc9ec, { opacity: 0.2 }));
      world.add(cell);
      const rimG = new T.Mesh(new T.TorusGeometry(3.2, 0.035, 8, 160), M.mat(0x5aa9d6));
      world.add(rimG);
      const nucleus = new T.Mesh(new T.SphereGeometry(1.0, 40, 30), M.mat(0x9d8df1, { opacity: 0.8 }));
      nucleus.position.set(-1.0, 0.35, -0.6);
      world.add(nucleus);
      const nuc2 = M.sphere(0.35, 0x7462d8);
      nuc2.position.set(-0.85, 0.5, -0.1);
      world.add(nuc2);

      const mitos = [];
      const spots = [[1.5, 0.9, 0.4, 0.4], [1.1, -1.2, 0.9, -0.5], [-0.6, -1.7, 0.2, 0.9], [2.0, -0.2, -1.2, 1.4], [-1.9, -0.6, 1.2, -0.2], [0.2, 1.8, -0.8, 2.2]];
      spots.forEach(([x, y, z, r]) => {
        const m = M.miniMito(1.1);
        m.position.set(x, y, z);
        m.rotation.set(r * 0.4, r, r * 0.7);
        m.scale.setScalar(0.85);
        world.add(m);
        mitos.push(m);
      });

      // glucosas que entran a la célula
      const glus = [];
      for (let i = 0; i < 5; i++) {
        const g = M.skeleton(6, { layout: 'ring', color: C.glucosa });
        g.scale.setScalar(0.45);
        world.add(g);
        glus.push({ g, t: i / 5, a: (i / 5) * Math.PI * 2, tgt: mitos[i % mitos.length] });
      }
      const sparks = [];
      for (let i = 0; i < 8; i++) {
        const s = M.atp(3, { size: 0.3 });
        s.scale.setScalar(0.6);
        s.visible = false;
        world.add(s);
        sparks.push({ s, t: 1 + Math.random() });
      }

      E.label('Membrana celular', [0, 3.2, 0], { cls: 'tag', anchor: 't', off: [0, 0.15, 0] });
      E.label('Núcleo', nucleus, { cls: 'tag', off: [0, 1.15, 0], anchor: 't' });
      E.label('Mitocondria', mitos[0], { cls: 'tag', off: [0, 0.55, 0], anchor: 't' });
      E.label('Glucosa', glus[0].g, { cls: 'tag', off: [0, 0.45, 0], anchor: 't' });

      const v = new T.Vector3();
      return {
        update(dt, t) {
          world.rotation.y += dt * 0.12;
          glus.forEach((o) => {
            o.t += dt * 0.11;
            if (o.t > 1) { o.t = 0; o.a = Math.random() * Math.PI * 2; o.tgt = mitos[(Math.random() * mitos.length) | 0]; }
            const start = v.set(Math.cos(o.a) * 4.6, Math.sin(o.a * 1.7) * 1.5, Math.sin(o.a) * 4.6);
            const k = E.ease.io(o.t);
            o.g.position.lerpVectors(start, o.tgt.position, k);
            o.g.rotation.z = t * 0.6 + o.a;
            const sc = 0.45 * (o.t > 0.85 ? 1 - (o.t - 0.85) / 0.15 : Math.min(1, o.t * 8));
            o.g.scale.setScalar(Math.max(0.001, sc));
          });
          sparks.forEach((p, i) => {
            p.t += dt * 0.5;
            if (p.t > 1) {
              p.t = 0;
              const m = mitos[(Math.random() * mitos.length) | 0];
              p.s.position.copy(m.position);
              p.o = m.position.clone().add(new T.Vector3(E.rand(-1, 1), E.rand(0.4, 1.2), E.rand(-1, 1)));
              p.from = m.position.clone();
              p.s.visible = true;
            }
            if (p.o) {
              p.s.position.lerpVectors(p.from, p.o, E.ease.out(p.t));
              p.s.scale.setScalar(0.55 * Math.sin(Math.PI * Math.min(1, p.t)));
            }
          });
        },
      };
    },
  });

  /* ===================== 1. ¿QUÉ ES? ===================== */
  App.add({
    id: 'que-es',
    nav: '¿Qué es?',
    kicker: 'Sección 1 · Idea principal',
    title: '¿Qué es la respiración celular?',
    place: 'celula',
    legend: ['C', 'O', 'H', 'ATP'],
    frame: { look: [0.7, 0.2, 0], dir: [0, 0.12, 1], w: 11.2, h: 5.2 },
    rotate: { yaw: 0.6, pitch: 0.3 },
    html: `
      <p>La respiración celular es un conjunto de reacciones químicas.</p>
      <p>La célula transforma la glucosa y libera energía. La célula usa parte de esa energía para formar <b>ATP</b>.</p>
      <p>El <b>ATP</b> es una molécula que transfiere energía para el trabajo celular. Por ejemplo, el ATP permite mover los músculos y transportar sustancias.</p>
      <div class="eq">
        <span class="chip" style="--c:${M.hex(C.glucosa)}">Glucosa</span><span class="op">+</span>
        <span class="chip" style="--c:${M.hex(C.O)}">Oxígeno</span><span class="op">→</span>
        <span class="chip" style="--c:#8b95a5">Dióxido de carbono</span><span class="op">+</span>
        <span class="chip" style="--c:#60a5fa">Agua</span><span class="op">+</span>
        <span class="chip" style="--c:${M.hex(C.atp)}">Energía</span>
      </div>
      <p class="formula">C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O</p>
      <div class="controls">
        <button class="btn primary" id="go">▶ Iniciar la reacción</button>
      </div>
      <div class="energy hide" id="energy">
        <div class="energy-h">¿Adónde va la energía?</div>
        <div class="ebar"><span class="e-atp">Se conserva en el ATP</span><span class="e-heat">Se libera como calor</span></div>
        <p class="small">Parte de la energía se conserva en el ATP. Otra parte se libera como calor. El calor ayuda a mantener la temperatura de tu cuerpo.</p>
      </div>
      <div class="callout warn">
        <b>Respirar no es lo mismo que la respiración celular.</b>
        <div class="two">
          <div><h4>Respirar</h4><p>Ocurre en los pulmones. Permite obtener oxígeno y eliminar dióxido de carbono.</p></div>
          <div><h4>Respiración celular</h4><p>Ocurre en las células. Las células usan ese oxígeno en sus reacciones químicas.</p></div>
        </div>
      </div>
    `,
    build(ctx) {
      const root = ctx.root;
      const GX = -3.4;
      const glu = M.skeleton(6, { layout: 'ring', color: C.glucosa, label: 'Glucosa', labelY: -0.95, size: 0.32 });
      glu.position.set(GX, 0.3, 0);
      root.add(glu);
      const o2s = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        const o = M.o2();
        o.position.set(GX + Math.cos(a) * 1.35, 0.3 + Math.sin(a) * 1.25, 0);
        o.rotation.z = a;
        root.add(o);
        o2s.push(o);
      }
      const tagO2 = E.label('6 O₂', [GX + 1.5, 1.55, 0], { cls: 'tag' });
      root.add(M.arrow(-1.6, -0.1, 0.3));

      const prods = new T.Group();
      root.add(prods);
      const co2s = [], h2os = [], atps = [];
      for (let i = 0; i < 6; i++) {
        const c = M.co2();
        c.userData.slot = new T.Vector3(0.75 + (i % 2) * 1.15, 1.55 - Math.floor(i / 2) * 0.55, 0);
        c.visible = false;
        prods.add(c);
        co2s.push(c);
        const w = M.h2o();
        w.userData.slot = new T.Vector3(3.3 + (i % 2) * 0.85, 1.55 - Math.floor(i / 2) * 0.55, 0);
        w.visible = false;
        prods.add(w);
        h2os.push(w);
      }
      for (let i = 0; i < 4; i++) {
        const a = M.atp(3);
        a.userData.slot = new T.Vector3(0.85 + i * 1.12, -1.05, 0);
        a.visible = false;
        prods.add(a);
        atps.push(a);
      }
      const heats = [];
      for (let i = 0; i < 10; i++) {
        const h = M.glow(0xff7a45, 0.7, { opacity: 0.7, normal: true });
        h.visible = false;
        prods.add(h);
        heats.push(h);
      }
      const flash = M.glow(0xffe08a, 0.1, { opacity: 1 });
      flash.position.copy(glu.position);
      root.add(flash);
      const lCO2 = E.label('6 CO₂', [1.32, 2.15, 0], { cls: 'tag', hidden: true });
      const lH2O = E.label('6 H₂O', [3.72, 2.15, 0], { cls: 'tag', hidden: true });
      const lE = E.label('Energía en el ATP', [2.5, -1.6, 0], { cls: 'tag gold', hidden: true });
      const lHeat = E.label('Calor', [5.4, -1.95, 0], { cls: 'tag heat', hidden: true });

      let ran = false;
      let heatOn = false;
      ctx.$('#go').addEventListener('click', async () => {
        if (ran) { App.reload(); return; }
        ran = true;
        const b = ctx.$('#go');
        b.disabled = true;
        tagO2.show(false);
        await Promise.all(o2s.map((o, i) => E.move(o, glu.position.clone().add(new T.Vector3(Math.cos(i) * 0.3, Math.sin(i) * 0.3, 0.2)), 1.0, { delay: i * 0.05 })));
        await E.anim(0.35, (k) => flash.scale.setScalar(0.1 + k * 3.2));
        glu.visible = false;
        o2s.forEach((o) => (o.visible = false));
        E.label('Glucosa + 6 O₂', [GX, 0.3, 0], { cls: 'tag muted' });
        E.anim(0.6, (k) => { flash.scale.setScalar(3.3 * (1 - k) + 0.01); });
        const jobs = [];
        co2s.concat(h2os).forEach((m, i) => {
          m.position.copy(glu.position);
          m.visible = true;
          jobs.push(E.move(m, m.userData.slot, 1.1, { delay: i * 0.05, arc: 0.6, ease: E.ease.out }));
        });
        atps.forEach((m, i) => {
          m.position.copy(glu.position);
          m.visible = true;
          jobs.push(E.move(m, m.userData.slot, 1.1, { delay: 0.3 + i * 0.08, arc: -0.4, ease: E.ease.out }));
        });
        heatOn = true;
        await Promise.all(jobs);
        lCO2.show(true); lH2O.show(true); lE.show(true); lHeat.show(true);
        ctx.$('#energy').classList.remove('hide');
        b.disabled = false;
        b.textContent = '↺ Repetir la reacción';
      });

      return {
        update(dt, t) {
          glu.rotation.z = Math.sin(t * 0.8) * 0.15;
          if (!heatOn) return;
          heats.forEach((h, i) => {
            const p = (t * 0.35 + i / heats.length) % 1;
            h.visible = true;
            h.position.set(5.1 + (i % 3) * 0.3 + Math.sin(t * 1.3 + i) * 0.12, -1.5 + p * 1.9, -0.3);
            h.material.opacity = 0.55 * Math.sin(Math.PI * p);
            h.scale.setScalar(0.5 + p * 0.6);
          });
        },
      };
    },
  });

  /* ===================== 2. ¿DÓNDE OCURRE? ===================== */
  const PARTS = {
    citosol: { n: 'Citosol', d: 'El citosol es la parte líquida del citoplasma.', s: 'Aquí ocurre la <b>glucólisis</b>.' },
    externa: { n: 'Membrana externa', d: 'La membrana externa rodea la mitocondria.', s: 'Separa la mitocondria del citosol.' },
    ims: { n: 'Espacio intermembranal', d: 'El espacio intermembranal está entre las dos membranas de la mitocondria.', s: 'Aquí se acumulan <b>protones</b> durante la fosforilación oxidativa.' },
    interna: { n: 'Membrana mitocondrial interna', d: 'La membrana interna está dentro de la membrana externa. Tiene muchos pliegues.', s: 'Aquí ocurre la <b>fosforilación oxidativa</b>.' },
    crestas: { n: 'Crestas', d: 'Las crestas son los pliegues de la membrana interna.', s: 'Los pliegues dan más superficie a la membrana interna. Así, la membrana tiene espacio para más proteínas de la fosforilación oxidativa.' },
    matriz: { n: 'Matriz mitocondrial', d: 'La matriz es el espacio interior de la mitocondria.', s: 'Aquí ocurren la <b>oxidación del piruvato</b> y el <b>ciclo de Krebs</b>.' },
  };
  App.add({
    id: 'donde',
    nav: '¿Dónde?',
    kicker: 'Sección 2 · Lugares',
    title: '¿Dónde ocurre?',
    place: 'mito',
    legend: ['C'],
    frame: { look: [-0.2, 0.15, 0], dir: [0, 0.12, 1], w: 11.2, h: 6.4 },
    rotate: { yaw: 0.9, pitch: 0.45 },
    html: `
      <p>En nuestras células, la respiración celular comienza en el <b>citosol</b>. Después continúa en las <b>mitocondrias</b>.</p>
      <p>La imagen muestra una mitocondria cortada por la mitad. <b>Pulsa</b> una parte de la imagen o <b>pulsa</b> un botón.</p>
      <div class="parts" id="parts">
        ${Object.entries(PARTS).map(([k, p]) => `<button data-p="${k}">${p.n}</button>`).join('')}
      </div>
      <div class="card info" id="info"><p class="muted">Elige una parte para ver su función.</p></div>
      <table class="tbl">
        <thead><tr><th>Lugar</th><th>Función</th></tr></thead>
        <tbody>
          <tr data-p="citosol"><td><b>Citosol</b></td><td>Aquí ocurre la glucólisis.</td></tr>
          <tr data-p="matriz"><td><b>Matriz mitocondrial</b></td><td>Aquí ocurren la oxidación del piruvato y el ciclo de Krebs.</td></tr>
          <tr data-p="interna"><td><b>Membrana mitocondrial interna</b></td><td>Aquí ocurre la fosforilación oxidativa.</td></tr>
          <tr data-p="ims"><td><b>Espacio intermembranal</b></td><td>Aquí se acumulan protones durante la fosforilación oxidativa.</td></tr>
        </tbody>
      </table>
    `,
    build(ctx) {
      const root = ctx.root;
      const mito = M.mitoCut();
      root.add(mito);
      const P = mito.userData.parts;
      const D = mito.userData.D;
      const cytMat = M.own(C.cytosol, { side: T.DoubleSide });
      const cyt = new T.Mesh(new T.PlaneGeometry(11.8, 6.3), cytMat);
      cyt.position.z = -D - 0.35;
      root.add(cyt);
      for (let i = 0; i < 4; i++) {
        const g = M.skeleton(6, { layout: 'ring', color: C.glucosa });
        g.scale.setScalar(0.38);
        g.position.set([-5.2, -4.6, 4.9, 5.3][i], [2.4, -2.3, 2.3, -2.0][i], -0.2);
        root.add(g);
      }
      E.pickable(cyt, 'citosol');
      E.pickable(P.outer, 'externa');
      E.pickable(P.ims, 'ims');
      E.pickable(P.inner, 'interna');
      E.pickable(P.matrix, 'matriz');

      const L = {
        citosol: E.label('Citosol', [-5.0, 1.9, 0], { cls: 'tag' }),
        externa: E.label('Membrana externa', [-0.9, 1.75, D], { cls: 'tag', anchor: 't', off: [0, 0.18, 0] }),
        ims: E.label('Espacio intermembranal', [-1.6, -1.6, 0], { cls: 'tag ptr-u', anchor: 'b', off: [0, -0.32, 0] }),
        interna: E.label('Membrana interna', [2.7 + 1.45, 0.5, D], { cls: 'tag ptr-r', anchor: 'l', off: [0, 0, 0] }),
        crestas: E.label('Crestas', [0.65, -0.35, D], { cls: 'tag', anchor: 't', off: [0, -0.1, 0] }),
        matriz: E.label('Matriz', [-2.55, 0.15, 0], { cls: 'tag' }),
      };
      // ajustes de posición: algunas etiquetas fuera de la figura
      L.ims.target = [-2.2, -1.6, D];
      L.interna.target = [4.05, 0.55, D];

      const mats = { citosol: [cytMat], externa: [P.outerMat], ims: [P.imsMat], interna: [P.innerMat], crestas: [P.innerMat], matriz: [P.matrixMat] };
      const all = [cytMat, P.outerMat, P.imsMat, P.innerMat, P.matrixMat];
      const baseCol = new Map(all.map((m) => [m, m.color.clone()]));
      let sel = null, hov = null;
      const white = new T.Color(0xffffff);
      function paint() {
        const on = sel || hov;
        all.forEach((m) => {
          const lit = on && mats[on].includes(m);
          m.color.copy(baseCol.get(m));
          if (on && !lit) m.color.lerp(white, 0.3);
          m.emissive.copy(baseCol.get(m));
          m.emissiveIntensity = lit ? 0.35 : 0;
        });
        Object.entries(L).forEach(([k, l]) => l.el.classList.toggle('on', k === on));
      }
      function choose(k) {
        sel = k;
        paint();
        ctx.$$('#parts button').forEach((b) => b.classList.toggle('on', b.dataset.p === k));
        ctx.$$('.tbl tr[data-p]').forEach((r) => r.classList.toggle('on', r.dataset.p === k));
        const p = PARTS[k];
        ctx.$('#info').innerHTML = p ? `<h3>${p.n}</h3><p>${p.d}</p><p class="what">${p.s}</p>` : '<p class="muted">Elige una parte para ver su función.</p>';
      }
      ctx.$('#parts').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (b) choose(b.dataset.p);
      });
      ctx.$$('.tbl tr[data-p]').forEach((r) => r.addEventListener('click', () => choose(r.dataset.p)));
      E.on('pick', (k) => { if (k) choose(k); });
      E.on('hover', (k) => { if (k !== hov) { hov = k; paint(); } });
      choose('matriz');
      return {
        update(dt, t) {
          const pulse = 0.25 + 0.15 * Math.sin(t * 3);
          const on = sel || hov;
          if (on) mats[on].forEach((m) => (m.emissiveIntensity = pulse));
        },
      };
    },
  });
})();
