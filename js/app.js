/* Navegación entre estaciones, panel de texto, marcador de la glucosa y leyenda. */
(function () {
  'use strict';
  const App = (window.App = { stations: [] });
  App.add = (s) => App.stations.push(s);

  const LEG = {
    C: ['Carbono', M.COL.C, 'ball'],
    O: ['Oxígeno', M.COL.O, 'ball'],
    H: ['Hidrógeno', M.COL.H, 'ball'],
    N: ['Nitrógeno', M.COL.N, 'ball'],
    P: ['Fosfato (Pi)', M.COL.P, 'ball'],
    ATP: ['ATP', M.COL.atp, 'ball'],
    NADH: ['NADH (con electrones)', M.COL.nadh, 'pill'],
    NAD: ['NAD⁺ (sin electrones)', M.COL.nad, 'pill'],
    FADH: ['FADH₂ (con electrones)', M.COL.fadh, 'pill'],
    FAD: ['FAD (sin electrones)', M.COL.fad, 'pill'],
    e: ['Electrón (e⁻)', M.COL.electron, 'ball'],
    Hp: ['Protón (H⁺)', M.COL.proton, 'ball'],
    CoA: ['Coenzima A', M.COL.coa, 'pill'],
  };

  // Lo que produce una glucosa en cada etapa (se completa al terminar cada animación)
  const ledger = {};
  const LEDGER_KEYS = [
    ['atp', 'ATP', M.COL.atp],
    ['nadh', 'NADH', M.COL.nadh],
    ['fadh', 'FADH₂', M.COL.fadh],
    ['co2', 'CO₂', 0x8b95a5],
  ];
  App.record = function (stage, vals) {
    ledger[stage] = vals;
    renderLedger(true);
  };
  App.ledgerTotal = function () {
    const t = { atp: 0, nadh: 0, fadh: 0, co2: 0 };
    Object.values(ledger).forEach((v) => Object.keys(t).forEach((k) => (t[k] += v[k] || 0)));
    return t;
  };
  App.resetLedger = function () {
    Object.keys(ledger).forEach((k) => delete ledger[k]);
    renderLedger(false);
  };
  const STAGES = [['glu', 'Glucólisis'], ['pir', 'Oxidación del piruvato'], ['krebs', 'Ciclo de Krebs'], ['fosf', 'Fosforilación oxidativa']];
  function renderLedger(bump) {
    const el = document.getElementById('ledger');
    const t = App.ledgerTotal();
    el.innerHTML =
      `<div class="ledger-h">Tu glucosa ha producido</div>` +
      `<div class="ledger-row">` +
      LEDGER_KEYS.map(([k, n, c]) => `<div class="lc" data-k="${k}"><i style="background:${M.hex(c)}"></i><b>${t[k]}</b><span>${n}</span></div>`).join('') +
      `</div><div class="ledger-stages">` +
      STAGES.map(([k, n], i) => `<span class="${ledger[k] ? 'done' : ''}" title="${n}">${ledger[k] ? '✓' : i + 1}</span>`).join('') +
      `</div>`;
    if (bump) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  let cur = -1;
  let switching = 0;
  const $ = (s) => document.querySelector(s);

  App.start = function () {
    E.init($('#stage'));
    const nav = $('#steps');
    nav.innerHTML = App.stations.map((s, i) => `<button data-i="${i}" title="${s.nav}"><span class="n">${i}</span><span class="t">${s.nav}</span></button>`).join('');
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) App.go(+b.dataset.i);
    });
    $('#prev').addEventListener('click', () => App.go(cur - 1));
    $('#next').addEventListener('click', () => App.go(cur + 1));
    $('#resetView').addEventListener('click', () => E.resetView());
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight') App.go(cur + 1);
      if (e.key === 'ArrowLeft') App.go(cur - 1);
    });
    window.addEventListener('hashchange', () => {
      const i = indexOfHash();
      if (i !== cur) App.go(i);
    });
    renderLedger(false);
    App.go(indexOfHash(), true);
  };
  function indexOfHash() {
    const h = location.hash.slice(1);
    const i = App.stations.findIndex((s) => s.id === h);
    return i < 0 ? 0 : i;
  }

  App.go = function (i, first) {
    if (i < 0 || i >= App.stations.length) return;
    if (i === cur && !first) return;
    const token = ++switching;
    const stage = $('#stage');
    stage.classList.add('switching');
    setTimeout(() => {
      if (token !== switching) return;
      build(i);
      requestAnimationFrame(() => stage.classList.remove('switching'));
    }, first ? 0 : 220);
  };

  App.reload = function () {
    const token = ++switching;
    const stage = $('#stage');
    stage.classList.add('switching');
    setTimeout(() => {
      if (token !== switching) return;
      build(cur);
      requestAnimationFrame(() => stage.classList.remove('switching'));
    }, 200);
  };

  function build(i) {
    cur = i;
    const st = App.stations[i];
    E.clear();
    const body = $('#panel-body');
    body.innerHTML =
      (st.kicker ? `<div class="kicker">${st.kicker}</div>` : '') +
      `<h1>${st.title}</h1>` + st.html;
    $('#panel').scrollTop = 0;
    body.scrollTop = 0;
    window.scrollTo({ top: 0 });

    const stage = $('#stage');
    stage.dataset.place = st.place || 'neutral';
    const PL = { citosol: 'Citosol', matriz: 'Matriz mitocondrial', membrana: 'Membrana mitocondrial interna', celula: 'Célula', mito: 'Mitocondria', bacteria: 'Bacteria' };
    $('#place').innerHTML = st.place && PL[st.place] ? `<span>Lugar</span>${PL[st.place]}` : '';
    $('#place').classList.toggle('hide', !(st.place && PL[st.place]));
    $('#legend').innerHTML = (st.legend || [])
      .map((k) => LEG[k])
      .filter(Boolean)
      .map(([n, c, sh]) => `<span class="lg"><i class="${sh}" style="background:${M.hex(c)}"></i>${n}</span>`)
      .join('');
    $('#ledger').classList.toggle('hide', !st.ledger);
    $('#hint').classList.toggle('hide', st.rotate && st.rotate.on === false);
    $('#resetView').classList.toggle('hide', st.rotate && st.rotate.on === false);

    E.setRotation(st.rotate || {});
    if (st.frame) E.frame(st.frame, 0);
    const ctx = {
      panel: body,
      $: (s) => body.querySelector(s),
      $$: (s) => Array.from(body.querySelectorAll(s)),
      root: E.root(),
    };
    const api = st.build ? st.build(ctx) : null;
    if (api && api.update) E.setUpdate(api.update);

    document.querySelectorAll('#steps button').forEach((b, j) => {
      b.classList.toggle('on', j === i);
      b.classList.toggle('seen', j < i);
    });
    const onBtn = document.querySelector('#steps button.on');
    if (onBtn) onBtn.scrollIntoView({ block: 'nearest', inline: 'center' });
    $('#prev').disabled = i === 0;
    $('#next').disabled = i === App.stations.length - 1;
    $('#next').textContent = i === App.stations.length - 1 ? 'Fin' : 'Siguiente →';
    $('#count').textContent = `${i + 1} / ${App.stations.length}`;
    if (location.hash.slice(1) !== st.id) history.replaceState(null, '', '#' + st.id);
    document.title = `${st.nav} · Respiración celular`;
  }

  // Botón de pasos: ejecuta una lista de acciones asíncronas, una por pulsación.
  App.stepper = function (ctx, opts) {
    const btn = ctx.$(opts.button);
    const list = opts.list ? ctx.$$(opts.list + ' li') : [];
    let k = 0, busy = false;
    const label = btn.textContent;
    function mark() {
      list.forEach((li, j) => {
        li.classList.toggle('done', j < k);
        li.classList.toggle('now', j === k && busy);
      });
    }
    btn.addEventListener('click', async () => {
      if (busy) return;
      if (k >= opts.steps.length) {
        if (opts.reset) { opts.reset(); k = 0; mark(); btn.textContent = label; }
        return;
      }
      busy = true;
      btn.disabled = true;
      mark();
      const g = E.gen;
      await opts.steps[k]();
      if (g !== E.gen) return;
      k++;
      busy = false;
      btn.disabled = false;
      mark();
      if (k >= opts.steps.length) {
        btn.textContent = opts.again || 'Repetir';
        if (opts.done) opts.done();
      }
    });
    mark();
    return { get k() { return k; } };
  };

  App.setCount = function (ctx, sel, v) {
    const el = ctx.$(sel);
    if (!el) return;
    if (el.textContent !== String(v)) {
      el.textContent = v;
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    }
  };
})();
