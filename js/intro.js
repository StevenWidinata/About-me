// Steven Widinata — 3D intro: stars swirl into my name, then warp into the site.
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
  const flash = document.querySelector('.flash');
  const site = document.querySelector('.site');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const CAM_Z = 100, FOV = 60, STAR = 1400, LINES = 600;
  let gl, renderer, scene, camera, group, sprite;
  let textGeo, textMat, textPts, N = 0, B, S, O, V, D, P;   // name particles: base, start, offset, velocity, delay, phase
  let starGeo, SP, lineGeo, lineMat, LP, LZ;                // background stars, warp streaks
  let visW = 0, visH = 0, state = 'off', tStart = 0, tWarp = 0, last = 0, raf = 0, readyTimer = 0;
  const m = { nx: 0, ny: 0, wx: 1e4, wy: 1e4, on: false };

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
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setClearColor(0x0E0C0A, 1);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, .1, 2000);
      camera.position.z = CAM_Z;
      group = new THREE.Group();
      scene.add(group);
      sprite = makeSprite();
      textMat = new THREE.PointsMaterial({ size: 1, map: sprite, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
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

  /* ---------- the name, sampled from text drawn on a 2D canvas ---------- */
  function sampleName() {
    const two = innerWidth / innerHeight < 1.15;
    const lines = two ? ['Steven', 'Widinata'] : ['Steven Widinata'];
    const W = 1600, H = two ? 900 : 440;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const font = (px) => `400 ${px}px "Instrument Serif", Georgia, serif`;
    let px = two ? 380 : 270;
    g.font = font(px);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > W * .94) { px *= W * .94 / widest; g.font = font(px); }
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lines.length - 1) / 2) * px * .92));

    const data = g.getImageData(0, 0, W, H).data;
    let filled = 0;
    for (let i = 3; i < data.length; i += 16) if (data[i] > 128) filled++;
    filled *= 4;
    const target = innerWidth < 700 ? 3400 : 7000;
    const step = Math.max(2, Math.round(Math.sqrt(filled / target)));
    const pts = [];
    let minX = W, maxX = 0, minY = H, maxY = 0;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        if (data[(y * W + x) * 4 + 3] > 128) {
          pts.push(x, y);
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    return { pts, minX, maxX, minY, maxY, step };
  }

  function buildText() {
    const s = sampleName(), pts = s.pts;
    N = pts.length / 2;
    const tw = (s.maxX - s.minX) || 1, th = (s.maxY - s.minY) || 1;
    const scale = Math.min(visW * .8 / tw, visH * .42 / th);
    const cx = (s.minX + s.maxX) / 2, cy = (s.minY + s.maxY) / 2;
    const lift = visH * .07, jit = s.step * scale * .5;
    B = new Float32Array(N * 3); S = new Float32Array(N * 3); O = new Float32Array(N * 3); V = new Float32Array(N * 3);
    D = new Float32Array(N); P = new Float32Array(N);
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    // mostly bone white, some tan and caramel
    const pal = [[.95, .93, .9], [.95, .93, .9], [.95, .93, .9], [.83, .66, .48], [.69, .51, .35]];
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      B[k] = (pts[i * 2] - cx) * scale + (Math.random() - .5) * jit;
      B[k + 1] = -(pts[i * 2 + 1] - cy) * scale + lift + (Math.random() - .5) * jit;
      B[k + 2] = (Math.random() - .5) * 2.5;
      const r = 90 + Math.random() * 260, a = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      S[k] = r * Math.sin(ph) * Math.cos(a);
      S[k + 1] = r * Math.sin(ph) * Math.sin(a) * .7;
      S[k + 2] = -Math.abs(r * Math.cos(ph)) - 40;
      D[i] = Math.random() * .8 + (B[k] / visW + .5) * .4; // letters settle roughly left to right
      P[i] = Math.random() * Math.PI * 2;
      col.set(pal[(Math.random() * pal.length) | 0], k);
      pos[k] = S[k]; pos[k + 1] = S[k + 1]; pos[k + 2] = S[k + 2];
    }
    if (textPts) { group.remove(textPts); textGeo.dispose(); }
    textGeo = new THREE.BufferGeometry();
    textGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    textGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    textMat.size = Math.max(.9, s.step * scale * 1.7);
    textMat.opacity = .95;
    textPts = new THREE.Points(textGeo, textMat);
    group.add(textPts);
  }

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
      // particles swirl in from a sphere and settle into the letters; the cursor pushes them away
      const pos = textGeo.attributes.position.array;
      const t = (now - tStart) / 1000, R = visW * .075, R2 = R * R, damp = Math.pow(.9, dt);
      for (let i = 0; i < N; i++) {
        const k = i * 3;
        let p = (t - D[i]) / 2.1;
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        const e = 1 - Math.pow(1 - p, 3);
        const x = S[k] + (B[k] - S[k]) * e, y = S[k + 1] + (B[k + 1] - S[k + 1]) * e;
        let z = S[k + 2] + (B[k + 2] - S[k + 2]) * e;
        const a = (1 - e) * 2.4, ca = Math.cos(a), sa = Math.sin(a);
        const rx = x * ca - y * sa, ry = x * sa + y * ca;
        z += Math.sin(t * 1.3 + P[i]) * .7 * e;
        if (m.on && e > .9) {
          const dx = rx + O[k] - m.wx, dy = ry + O[k + 1] - m.wy, d2 = dx * dx + dy * dy;
          if (d2 < R2) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 1.8 * dt;
            O[k] += dx / d * f; O[k + 1] += dy / d * f; O[k + 2] += f * 1.6;
          }
        }
        O[k] *= damp; O[k + 1] *= damp; O[k + 2] *= damp;
        pos[k] = rx + O[k]; pos[k + 1] = ry + O[k + 1]; pos[k + 2] = z + O[k + 2];
      }
      textGeo.attributes.position.needsUpdate = true;
      for (let i = 0; i < STAR; i++) { const k = i * 3 + 2; SP[k] += .06 * dt; if (SP[k] > 20) SP[k] -= 1020; }
      starGeo.attributes.position.needsUpdate = true;
      const ry = m.nx * .22 + Math.sin(now * .0003) * .04, rx = -m.ny * .12;
      group.rotation.y += (ry - group.rotation.y) * .04 * dt;
      group.rotation.x += (rx - group.rotation.x) * .04 * dt;
    } else if (state === 'warp') {
      // the name bursts outward, stars stretch into streaks, the view widens, then a soft flash
      const pos = textGeo.attributes.position.array;
      const t = (now - tWarp) / 1000, s = Math.min(1, t / 1.5);
      const speed = (1.5 + 60 * s * s) * dt, boost = (1 + t * 5) * dt;
      for (let i = 0; i < N * 3; i++) pos[i] += V[i] * boost;
      textGeo.attributes.position.needsUpdate = true;
      textMat.opacity = Math.max(0, .95 - t * .7);
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
    root.classList.remove('is-ready', 'is-warping', 'is-leaving');
    state = 'loading';
    const fonts = document.fonts ? Promise.race([document.fonts.load('400 120px "Instrument Serif"'), wait(1800)]).catch(() => {}) : null;
    await Promise.all([setup(), fonts]);
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
    buildText();
    lineMat.opacity = 0;
    for (let i = 0; i < LINES; i++) resetLine(i, true);
    lineGeo.attributes.position.needsUpdate = true;
    state = 'form';
    tStart = last = performance.now();
    readyTimer = setTimeout(ready, 2100);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (state === 'form') {
      state = 'warp';
      tWarp = last = performance.now();
      clearTimeout(readyTimer);
      root.classList.add('is-warping');
      root.classList.remove('is-ready');
      const pos = textGeo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const k = i * 3, d = Math.hypot(pos[k], pos[k + 1]) || 1, sp = .4 + Math.random() * 1.1;
        V[k] = pos[k] / d * sp; V[k + 1] = pos[k + 1] / d * sp; V[k + 2] = 1 + Math.random() * 2.5;
      }
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
      root.classList.remove('is-leaving', 'is-ready', 'is-warping');
      lockSite(false);
      remember();
    }, reduce ? 0 : 560);
  }

  /* ---------- input ---------- */
  root.addEventListener('pointermove', (e) => {
    m.nx = e.clientX / innerWidth * 2 - 1;
    m.ny = -(e.clientY / innerHeight * 2 - 1);
    m.wx = m.nx * visW / 2;
    m.wy = m.ny * visH / 2;
    m.on = true;
  });
  root.addEventListener('pointerleave', () => { m.on = false; m.nx = m.ny = 0; });
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
        buildText();
        if (formed) tStart = performance.now() - 10000; // already formed: skip the swirl
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
