/* Motor 3D: renderer, cámara, animaciones, etiquetas HTML y selección con el puntero. */
(function () {
  'use strict';
  const T = THREE;
  T.ColorManagement.legacyMode = false;

  const E = (window.E = {});
  let renderer, scene, camera, pivot, stageEl, labelLayer;
  let W = 1, H = 1;
  let tweens = [];
  let labels = [];
  let pickables = [];
  let handlers = {};
  let updater = null;
  let frameSpec = null;
  const rot = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, lim: [0.8, 0.3], on: true };
  const ray = new T.Raycaster();
  const ndc = new T.Vector2();
  const tmp = new T.Vector3();
  let clock = 0;
  let paused = false;

  E.ease = {
    lin: (k) => k,
    io: (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
    out: (k) => 1 - Math.pow(1 - k, 3),
    in: (k) => k * k * k,
    back: (k) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
    },
  };

  E.init = function (el) {
    stageEl = el;
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.localClippingEnabled = true;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = 'gl';
    el.appendChild(renderer.domElement);
    labelLayer = document.createElement('div');
    labelLayer.className = 'labels';
    el.appendChild(labelLayer);

    scene = new T.Scene();
    camera = new T.PerspectiveCamera(36, 1, 0.1, 400);
    scene.add(new T.HemisphereLight(0xffffff, 0x9fb0bf, 0.95));
    const key = new T.DirectionalLight(0xffffff, 0.85);
    key.position.set(4, 8, 7);
    scene.add(key);
    const fill = new T.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-6, -3, 5);
    scene.add(fill);
    pivot = new T.Group();
    scene.add(pivot);
    E.scene = scene;
    E.camera = camera;
    E.pivot = pivot;
    E.renderer = renderer;

    new ResizeObserver(resize).observe(el);
    resize();
    bindPointer(renderer.domElement);
    document.addEventListener('visibilitychange', () => (paused = document.hidden));

    let last = performance.now();
    function loop(now) {
      requestAnimationFrame(loop);
      let dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (paused) return;
      clock += dt;
      stepTweens(dt);
      // giro suave del pivote
      rot.yaw += (rot.tyaw - rot.yaw) * Math.min(1, dt * 7);
      rot.pitch += (rot.tpitch - rot.pitch) * Math.min(1, dt * 7);
      pivot.rotation.set(rot.pitch, rot.yaw, 0);
      if (updater) updater(dt, clock);
      renderer.render(scene, camera);
      updateLabels();
    }
    requestAnimationFrame(loop);
  };

  function resize() {
    const r = stageEl.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    if (frameSpec) applyFrame(frameSpec, 0);
  }

  /* ---------- animaciones ---------- */
  E.gen = 0;
  E.anim = function (dur, fn, o) {
    o = o || {};
    const g = E.gen;
    return new Promise((res) => {
      tweens.push({ t: -(o.delay || 0), dur: Math.max(0.0001, dur), fn, ease: o.ease || E.ease.io, res, g });
    });
  };
  E.wait = (s) => E.anim(s, () => {}, { ease: E.ease.lin });
  E.until = async function (cond, step) {
    while (!cond()) await E.wait(step || 0.1);
  };
  function stepTweens(dt) {
    const list = tweens;
    tweens = [];
    const keep = [];
    for (const tw of list) {
      if (tw.g !== E.gen) continue;
      tw.t += dt;
      if (tw.t < 0) { keep.push(tw); continue; }
      const k = Math.min(1, tw.t / tw.dur);
      tw.fn(tw.ease(k), k);
      if (k >= 1) tw.res();
      else keep.push(tw);
    }
    tweens = keep.concat(tweens);
  }
  E.move = function (obj, to, dur, o) {
    const from = obj.position.clone();
    const dest = to.isVector3 ? to.clone() : new T.Vector3(to[0], to[1], to[2]);
    const arc = (o && o.arc) || 0;
    return E.anim(dur, (k) => {
      obj.position.lerpVectors(from, dest, k);
      if (arc) obj.position.y += Math.sin(Math.PI * k) * arc;
    }, o);
  };
  E.scale = function (obj, to, dur, o) {
    const from = obj.scale.x;
    return E.anim(dur, (k) => obj.scale.setScalar(from + (to - from) * k), o);
  };
  E.fade = function (obj, to, dur, o) {
    const from = obj.userData.alpha == null ? 1 : obj.userData.alpha;
    return E.anim(dur, (k) => M.alpha(obj, from + (to - from) * k), o);
  };

  /* ---------- cámara ---------- */
  // spec: {look:[x,y,z], dir:[x,y,z], w: ancho visible, h: alto visible}
  E.frame = function (spec, dur) {
    frameSpec = spec;
    return applyFrame(spec, dur || 0);
  };
  function framePos(spec) {
    const fov = (camera.fov * Math.PI) / 180;
    const t = Math.tan(fov / 2);
    const dist = Math.max(spec.h / (2 * t), spec.w / (2 * t * camera.aspect)) * (spec.pad || 1.08);
    const look = new T.Vector3().fromArray(spec.look || [0, 0, 0]);
    const dir = new T.Vector3().fromArray(spec.dir || [0, 0.15, 1]).normalize();
    return { pos: look.clone().addScaledVector(dir, dist), look };
  }
  let camLook = new T.Vector3();
  function applyFrame(spec, dur) {
    const { pos, look } = framePos(spec);
    if (!dur) {
      camera.position.copy(pos);
      camLook.copy(look);
      camera.lookAt(look);
      return Promise.resolve();
    }
    const p0 = camera.position.clone();
    const l0 = camLook.clone();
    return E.anim(dur, (k) => {
      camera.position.lerpVectors(p0, pos, k);
      camLook.lerpVectors(l0, look, k);
      camera.lookAt(camLook);
    });
  }

  E.setRotation = function (o) {
    o = o || {};
    rot.on = o.on !== false;
    rot.lim = [o.yaw == null ? 0.8 : o.yaw, o.pitch == null ? 0.3 : o.pitch];
    rot.tyaw = rot.yaw = o.y0 || 0;
    rot.tpitch = rot.pitch = o.p0 || 0;
  };
  E.resetView = function () { rot.tyaw = 0; rot.tpitch = 0; };

  /* ---------- puntero: arrastrar para girar, pulsar para elegir ---------- */
  function bindPointer(cv) {
    let down = null;
    cv.addEventListener('pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, yaw: rot.tyaw, pitch: rot.tpitch, moved: 0, id: e.pointerId };
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    });
    cv.addEventListener('pointermove', (e) => {
      if (down) {
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        down.moved = Math.max(down.moved, Math.abs(dx) + Math.abs(dy));
        if (rot.on && down.moved > 4) {
          rot.tyaw = clamp(down.yaw + dx * 0.006, -rot.lim[0], rot.lim[0]);
          if (e.pointerType !== 'touch') rot.tpitch = clamp(down.pitch + dy * 0.004, -rot.lim[1], rot.lim[1]);
          stageEl.classList.add('dragging');
        }
        return;
      }
      const hit = pick(e);
      cv.style.cursor = hit ? 'pointer' : rot.on ? 'grab' : 'default';
      if (handlers.hover) handlers.hover(hit ? hit.userData.pick : null);
    });
    const end = (e) => {
      if (!down) return;
      const wasClick = down.moved < 6;
      down = null;
      stageEl.classList.remove('dragging');
      if (wasClick && e.type === 'pointerup') {
        const hit = pick(e);
        if (handlers.pick) handlers.pick(hit ? hit.userData.pick : null);
      }
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('pointerleave', () => {
      if (!down && handlers.hover) handlers.hover(null);
    });
  }
  function pick(e) {
    if (!pickables.length) return null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    for (const h of hits) {
      let o = h.object, vis = true;
      while (o) { if (!o.visible) { vis = false; break; } o = o.parent; }
      if (vis) return h.object;
    }
    return null;
  }
  E.pickable = function (mesh, key) {
    mesh.userData.pick = key;
    pickables.push(mesh);
  };
  E.on = function (name, fn) { handlers[name] = fn; };

  /* ---------- etiquetas HTML que siguen a objetos 3D ---------- */
  E.label = function (html, target, o) {
    o = o || {};
    const el = document.createElement('div');
    el.className = 'l3 ' + (o.cls || '');
    el.innerHTML = html;
    labelLayer.appendChild(el);
    const L = {
      el, target, an: ({ c: '-50%,-50%', t: '-50%,-100%', b: '-50%,0', r: '0,-50%', l: '-100%,-50%' })[o.anchor || 'c'], off: o.off || [0, 0, 0], shown: true, local: !!o.local,
      show(v) { this.shown = v; el.classList.toggle('hide', !v); return this; },
      set(h) { el.innerHTML = h; return this; },
    };
    if (o.hidden) L.show(false);
    labels.push(L);
    return L;
  };
  function updateLabels() {
    for (const L of labels) {
      if (!L.shown) continue;
      let visible = true;
      if (L.target.isObject3D) {
        let o = L.target;
        while (o) { if (!o.visible) { visible = false; break; } o = o.parent; }
        L.target.getWorldPosition(tmp);
      } else {
        tmp.fromArray(L.target);
        pivot.localToWorld(tmp);
      }
      tmp.x += L.off[0]; tmp.y += L.off[1]; tmp.z += L.off[2];
      tmp.project(camera);
      if (!visible || tmp.z > 1) { L.el.style.opacity = '0'; continue; }
      L.el.style.opacity = '';
      const x = ((tmp.x + 1) / 2) * W, y = ((1 - tmp.y) / 2) * H;
      L.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(${L.an})`;
    }
  }

  /* ---------- limpiar la escena al cambiar de estación ---------- */
  E.clear = function () {
    E.gen++;
    tweens = [];
    for (const L of labels) L.el.remove();
    labels = [];
    pickables = [];
    handlers = {};
    updater = null;
    while (pivot.children.length) {
      const c = pivot.children[0];
      pivot.remove(c);
      M.dispose(c);
    }
  };
  E.setUpdate = (fn) => (updater = fn);
  E.root = () => pivot;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  E.clamp = clamp;
  E.rand = (a, b) => a + Math.random() * (b - a);
  E.v3 = (x, y, z) => new T.Vector3(x, y, z);
})();
