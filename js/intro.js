// Steven Widinata — 3D intro: my journey drawn as a constellation, then a warp into the site.
// A line traces an "S" and a "W" star by star; four of the stars are chapters (SD, SMP, SMA, BINUS)
// and light up with their year as the line reaches them. Click and the camera flies into the last one.
// Plays once per browser session. Skipped for deep links (#section) and reduced motion.
'use strict';

const Intro = (() => {
  const html = document.documentElement;
  const root = document.querySelector('.intro');
  if (!root) return { replay() {} };

  const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  const canvas = root.querySelector('.intro__canvas');
  const startBtn = root.querySelector('.intro__start');
  const skipBtn = root.querySelector('.intro__skip');
  const labels = [...root.querySelectorAll('.intro__label')];
  const flash = document.querySelector('.flash');
  const site = document.querySelector('.site');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  const CAM_Z = 100, FOV = 60, STAR = 1400, LINES = 600;

  // The constellation, traced as one path: an S, then a W. Units: letter height = 1.
  const SHAPE = [
    [-.28, .40], [-.45, .50], [-.68, .48], [-.80, .30], [-.66, .10], [-.44, -.04], [-.30, -.24], [-.40, -.44], [-.62, -.50], [-.82, -.38],
    [.00, .50], [.20, -.50], [.45, .15], [.70, -.50], [.92, .50],
  ];
  const CHAPTERS = { 3: 0, 8: 1, 11: 2, 14: 3 }; // path index -> label index (2013, 2019, 2022, 2026)
  const BRIDGE = 9;                               // the pen lifts between the S and the W (no line drawn)
  const T0 = .45, T_DRAW = 2.5;                 // when the line starts, and how long it takes

  let gl, renderer, scene, camera, group, sprite;
  let con, PTS = [], cum = [], total = 1, nodes = [], segGeo, SEG, hot = -1; // the constellation
  let starGeo, SP, lineGeo, lineMat, LP, LZ;                                  // background stars, warp streaks
  let visW = 0, visH = 0, state = 'off', tStart = 0, tWarp = 0, last = 0, raf = 0, readyTimer = 0;
  const m = { nx: 0, ny: 0, sx: -1e4, sy: -1e4 };
  const v3 = { x: 0, y: 0 };

  /* ---------- setup ---------- */
  let loading = null;
  const loadThree = () => loading || (loading = new Promise((res, rej) => {
    if (window.THREE) return res();
    const s = document.createElement('script');
    s.src = THREE_URL;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = res;
    s.onerror = rej;
    document.head.append(s);
  }));

  const webglOk = () => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  };

  const makeSprite = () => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(.22, 'rgba(255,255,255,.85)');
    gr.addColorStop(.55, 'rgba(255,255,255,.14)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  };

  async function setup() {
    if (gl !== undefined) return;
    if (reduce || !webglOk()) { gl = false; return; }
    try {
      await Promise.race([loadThree(), wait(6000).then(() => { throw new Error('three.js timed out'); })]);
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setClearColor(0x0E0C0A, 1);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, .1, 2000);
      camera.position.z = CAM_Z;
      group = new THREE.Group();
      scene.add(group);
      sprite = makeSprite();
      size();
      buildStars();
      buildLines();
      gl = true;
    } catch (e) {
      gl = false;
    }
  }

  function size() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.fov = FOV;
    camera.updateProjectionMatrix();
    visH = 2 * CAM_Z * Math.tan(FOV * Math.PI / 360);
    visW = visH * camera.aspect;
  }

  /* ---------- the constellation ---------- */
  const glow = (color, opacity = 1) => new THREE.Sprite(new THREE.SpriteMaterial({
    map: sprite, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
  }));

  function buildConstellation() {
    if (con) {
      group.remove(con);
      con.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    }
    con = new THREE.Group();
    const unit = Math.min(visW * .56 / 1.74, visH * .32), lift = visH * .14;
    PTS = SHAPE.map(([x, y]) => new THREE.Vector3((x - .05) * unit, y * unit + lift, 0));
    cum = [0];
    for (let i = 1; i < PTS.length; i++) cum[i] = cum[i - 1] + PTS[i].distanceTo(PTS[i - 1]);
    total = cum[cum.length - 1];

    // the line: one segment per hop, grown each frame
    SEG = new Float32Array((PTS.length - 1) * 6);
    const col = new Float32Array(SEG.length);
    for (let i = 0; i < PTS.length - 1; i++) {
      const k = i === BRIDGE ? 0 : .7;
      col.set([.95 * k, .9 * k, .82 * k, .95 * k, .9 * k, .82 * k], i * 6);
    }
    segGeo = new THREE.BufferGeometry();
    segGeo.setAttribute('position', new THREE.BufferAttribute(SEG, 3).setUsage(THREE.DynamicDrawUsage));
    segGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    con.add(new THREE.LineSegments(segGeo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    })));

    // the stars: chapters are bigger, brass, and send out a slow pulse
    nodes = PTS.map((p, i) => {
      const ch = CHAPTERS[i] ?? -1;
      const s = glow(ch >= 0 ? 0xE9CD93 : 0xF2EDE6);
      s.position.copy(p);
      s.scale.setScalar(.0001);
      con.add(s);
      let halo = null;
      if (ch >= 0) {
        halo = glow(0xD4A97A, 0);
        halo.position.copy(p);
        con.add(halo);
      }
      return { s, halo, ch, at: cum[i], size: unit * (ch >= 0 ? .17 : .09), lit: -1, sx: -1e4, sy: -1e4 };
    });
    group.add(con);
  }

  // where a star sits on screen right now (follows the tilt)
  const project = (obj) => {
    const v = obj.getWorldPosition(new THREE.Vector3()).project(camera);
    v3.x = (v.x + 1) / 2 * innerWidth;
    v3.y = (1 - v.y) / 2 * innerHeight;
    return v3;
  };

  function updateConstellation(t) {
    const p = clamp((t - T0) / T_DRAW, 0, 1);
    const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const L = e * total;
    for (let i = 0; i < PTS.length - 1; i++) {
      const a = PTS[i], b = PTS[i + 1], k = i * 6;
      const f = clamp((L - cum[i]) / (cum[i + 1] - cum[i] || 1), 0, 1);
      SEG[k] = a.x; SEG[k + 1] = a.y; SEG[k + 2] = a.z;
      SEG[k + 3] = a.x + (b.x - a.x) * f; SEG[k + 4] = a.y + (b.y - a.y) * f; SEG[k + 5] = 0;
    }
    segGeo.attributes.position.needsUpdate = true;

    group.updateMatrixWorld();
    let best = 34, nextHot = -1;
    nodes.forEach((n, i) => {
      if (n.lit < 0 && t >= T0 && L >= n.at - .001) {
        n.lit = t;
        if (n.ch >= 0) labels[n.ch].classList.add('is-on');
      }
      let k = 0;
      if (n.lit >= 0) {
        const a = (t - n.lit) / .4;
        k = a < 1 ? a + Math.sin(a * Math.PI) * .5 : 1 + Math.sin(t * 2.2 + i) * .07; // pop, then a soft twinkle
      }
      if (i === hot) k *= 1.6;
      n.s.scale.setScalar(Math.max(.0001, n.size * k));
      if (n.halo) {
        const ph = n.lit >= 0 ? ((t - n.lit) % 2.6) / 2.6 : 0;
        n.halo.scale.setScalar(n.size * (1 + ph * 2.4));
        n.halo.material.opacity = n.lit >= 0 ? (1 - ph) * .45 : 0;
      }
      const s = project(n.s);
      n.sx = s.x; n.sy = s.y;
      if (n.ch >= 0) labels[n.ch].style.transform = `translate(${s.x}px, ${s.y}px)`;
      const d = Math.hypot(s.x - m.sx, s.y - m.sy);
      if (n.lit >= 0 && d < best) { best = d; nextHot = i; }
    });
    if (nextHot !== hot) {
      hot = nextHot;
      labels.forEach((l, j) => l.classList.toggle('is-hot', hot >= 0 && nodes[hot].ch === j));
      root.classList.toggle('is-pointing', hot >= 0);
    }
  }

  /* ---------- background stars and warp streaks ---------- */
  function buildStars() {
    SP = new Float32Array(STAR * 3);
    const col = new Float32Array(STAR * 3);
    for (let i = 0; i < STAR; i++) {
      SP[i * 3] = (Math.random() - .5) * 700;
      SP[i * 3 + 1] = (Math.random() - .5) * 450;
      SP[i * 3 + 2] = -1000 + Math.random() * 1020;
      col.set(Math.random() < .75 ? [.82, .79, .75] : [.72, .57, .41], i * 3);
    }
    starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(SP, 3).setUsage(THREE.DynamicDrawUsage));
    starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 1.6, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8 });
    group.add(new THREE.Points(starGeo, mat));
  }

  function resetLine(i, initial) {
    const a = Math.random() * Math.PI * 2, r = 10 + Math.random() * 230;
    LP[i * 6] = LP[i * 6 + 3] = Math.cos(a) * r;
    LP[i * 6 + 1] = LP[i * 6 + 4] = Math.sin(a) * r * .65;
    LZ[i] = initial ? -1000 + Math.random() * 1000 : -1000 - Math.random() * 200;
    LP[i * 6 + 2] = LP[i * 6 + 5] = LZ[i];
  }
  function buildLines() {
    LP = new Float32Array(LINES * 6);
    LZ = new Float32Array(LINES);
    const col = new Float32Array(LINES * 6);
    for (let i = 0; i < LINES; i++) { resetLine(i, true); col.set([.95, .93, .9, .45, .32, .2], i * 6); }
    lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(LP, 3).setUsage(THREE.DynamicDrawUsage));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    scene.add(new THREE.LineSegments(lineGeo, lineMat));
  }

  /* ---------- animation ---------- */
  function loop() {
    const now = performance.now();
    const dt = Math.min(3, Math.max(0, now - last) / 16.667);
    last = now;

    if (state === 'form') {
      updateConstellation((now - tStart) / 1000);
      for (let i = 0; i < STAR; i++) { const k = i * 3 + 2; SP[k] += .06 * dt; if (SP[k] > 20) SP[k] -= 1020; }
      starGeo.attributes.position.needsUpdate = true;
      const ry = m.nx * .22 + Math.sin(now * .0003) * .04, rx = -m.ny * .12;
      group.rotation.y += (ry - group.rotation.y) * .04 * dt;
      group.rotation.x += (rx - group.rotation.x) * .04 * dt;
    } else if (state === 'warp') {
      // fly into the 2026 star: the constellation grows around it while it slides to the centre,
      // stars stretch into streaks, the view widens, then a soft flash
      const t = (now - tWarp) / 1000, s = Math.min(1, t / 1.5);
      const z = 1 + 9 * s * s * s, P = PTS[PTS.length - 1];
      con.scale.setScalar(z);
      con.position.set(-P.x * z + P.x * (1 - s), -P.y * z + P.y * (1 - s), 0);
      const fade = Math.max(0, 1 - t * .85);
      con.children.forEach((o) => { if (!o.isSprite || o.material.opacity > fade) o.material.opacity = fade; });
      const speed = (1.5 + 60 * s * s) * dt;
      for (let i = 0; i < STAR; i++) { const k = i * 3 + 2; SP[k] += speed * .7; if (SP[k] > 20) SP[k] -= 1020; }
      starGeo.attributes.position.needsUpdate = true;
      const len = speed * 6;
      for (let i = 0; i < LINES; i++) {
        LZ[i] += speed * 1.2;
        if (LZ[i] > CAM_Z - 2) resetLine(i, false);
        LP[i * 6 + 2] = LZ[i];
        LP[i * 6 + 5] = LZ[i] - len;
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineMat.opacity = Math.min(.9, s * 1.4);
      camera.fov = FOV + 38 * s * s;
      camera.updateProjectionMatrix();
      group.rotation.z += .004 * dt * s;
      if (t > 1.55) flash.classList.add('on');
      if (t > 2.05) { finish(); return; }
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }

  /* ---------- flow ---------- */
  const lockSite = (on) => {
    html.classList.toggle('intro-on', on);
    if (site) site.inert = on;
  };
  const remember = () => { try { sessionStorage.setItem('introSeen', '1'); } catch (e) { /* private mode */ } };

  function ready() {
    if (state !== 'form' && state !== 'static') return;
    root.classList.add('is-ready');
    startBtn.focus({ preventScroll: true });
  }

  async function begin() {
    lockSite(true);
    root.classList.remove('is-ready', 'is-warping', 'is-leaving', 'is-pointing');
    labels.forEach((l) => l.classList.remove('is-on', 'is-hot'));
    state = 'loading';
    await setup();
    if (state !== 'loading') return; // skipped while loading
    clearTimeout(readyTimer);
    if (!gl) {
      root.classList.add('intro--static');
      state = 'static';
      readyTimer = setTimeout(ready, 300);
      return;
    }
    root.classList.remove('intro--static');
    size();
    group.rotation.set(0, 0, 0);
    buildConstellation();
    hot = -1;
    lineMat.opacity = 0;
    for (let i = 0; i < LINES; i++) resetLine(i, true);
    lineGeo.attributes.position.needsUpdate = true;
    state = 'form';
    tStart = last = performance.now();
    readyTimer = setTimeout(ready, (T0 + T_DRAW + .3) * 1000);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (state === 'form') {
      state = 'warp';
      tWarp = last = performance.now();
      clearTimeout(readyTimer);
      root.classList.add('is-warping');
      root.classList.remove('is-ready', 'is-pointing');
    } else if (state === 'static') {
      state = 'warp';
      root.classList.add('is-warping');
      if (reduce) { finish(); return; }
      flash.classList.add('on');
      setTimeout(finish, 480);
    }
  }

  function finish() {
    state = 'off';
    cancelAnimationFrame(raf);
    clearTimeout(readyTimer);
    root.classList.remove('is-warping', 'is-ready', 'is-leaving');
    lockSite(false);
    remember();
    flash.classList.add('out');
    requestAnimationFrame(() => flash.classList.remove('on'));
    setTimeout(() => flash.classList.remove('out'), 1200);
  }

  function skip() {
    if (state === 'off' || state === 'leaving') return;
    state = 'leaving';
    clearTimeout(readyTimer);
    root.classList.add('is-leaving');
    setTimeout(() => {
      cancelAnimationFrame(raf);
      state = 'off';
      root.classList.remove('is-leaving', 'is-ready', 'is-warping', 'is-pointing');
      lockSite(false);
      remember();
    }, reduce ? 0 : 560);
  }

  /* ---------- input ---------- */
  const point = (e) => {
    m.nx = e.clientX / innerWidth * 2 - 1;
    m.ny = -(e.clientY / innerHeight * 2 - 1);
    m.sx = e.clientX; m.sy = e.clientY;
  };
  root.addEventListener('pointermove', point);
  root.addEventListener('pointerdown', point); // a tap picks a star on phones
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { m.nx = m.ny = 0; m.sx = m.sy = -1e4; } });
  startBtn.addEventListener('click', start);
  skipBtn.addEventListener('click', skip);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('intro-on')) skip(); });

  let rz;
  addEventListener('resize', () => {
    if (!gl) return;
    clearTimeout(rz);
    rz = setTimeout(() => {
      size();
      if (state === 'form') {
        const formed = root.classList.contains('is-ready');
        buildConstellation();
        hot = -1;
        if (formed) { // already drawn: rebuild it finished, without replaying the line
          tStart = performance.now() - 10000;
          nodes.forEach((n) => { n.lit = 0; });
        }
      }
    }, 200);
  });

  if (html.classList.contains('intro-on')) begin();

  return {
    replay() {
      if (state !== 'off') return;
      scrollTo({ top: 0, behavior: 'instant' });
      begin();
    },
  };
})();

document.querySelector('.footer__replay')?.addEventListener('click', () => Intro.replay());
