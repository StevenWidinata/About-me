// Steven Widinata — intro: a comet sweeps across the solar system and leaves a trail of stars,
// the trail gathers into my name, and "Start my journey" dives into the sun.
// Drag anywhere to orbit the scene; hover the name to ripple its stars.
// Plays once per browser session. Skipped for deep links (#section) and reduced motion.
'use strict';

const Intro = (() => {
  const html = document.documentElement;
  const root = document.querySelector('.intro');
  if (!root) return { replay() {} };

  const startBtn = root.querySelector('.intro__start');
  const skipBtn = root.querySelector('.intro__skip');
  const flash = document.querySelector('.flash');
  const site = document.querySelector('.site');
  const S = typeof Space !== 'undefined' ? Space : { ok: false, setMode() {} };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeInOut = (p) => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  // timeline, in seconds from the start (about 4.5 s until the button shows)
  const T_SWEEP = .4, SWEEP = 1.5;   // the comet crosses the screen
  const T_GATHER = 1.7, GATHER = 1.8; // the trail flies into the letters, left to right
  const T_READY = 4.5;                // tagline + button fade in
  const WARP = 2.35;                  // flight into the sun

  let T, nameGroup, textGeo, textMat, textPts, comet;
  let N = 0, B, U, TD, J, W, G, C, PH, O, K, V, WS;
  let state = 'off', tStart = 0, tWarp = 0, readyTimer = 0;
  let camFrom, sunPos, lookFrom;

  /* ---------- the name, sampled from text drawn on a 2D canvas ---------- */
  function sampleName() {
    const two = innerWidth / innerHeight < 1.15;
    const lines = two ? ['Steven', 'Widinata'] : ['Steven Widinata'];
    const Wc = 1600, Hc = two ? 900 : 440;
    const c = document.createElement('canvas');
    c.width = Wc; c.height = Hc;
    const g = c.getContext('2d');
    const font = (px) => `400 ${px}px "Instrument Serif", Georgia, serif`;
    let px = two ? 380 : 270;
    g.font = font(px);
    const widest = Math.max(...lines.map((l) => g.measureText(l).width));
    if (widest > Wc * .94) { px *= Wc * .94 / widest; g.font = font(px); }
    g.fillStyle = '#fff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    lines.forEach((l, i) => g.fillText(l, Wc / 2, Hc / 2 + (i - (lines.length - 1) / 2) * px * .92));

    const data = g.getImageData(0, 0, Wc, Hc).data;
    let filled = 0;
    for (let i = 3; i < data.length; i += 16) if (data[i] > 128) filled++;
    filled *= 4;
    const target = S.phone ? 3400 : 7000;
    const step = Math.max(2, Math.round(Math.sqrt(filled / target)));
    const pts = [];
    let minX = Wc, maxX = 0, minY = Hc, maxY = 0;
    for (let y = 0; y < Hc; y += step) {
      for (let x = 0; x < Wc; x += step) {
        if (data[(y * Wc + x) * 4 + 3] > 128) {
          pts.push(x, y);
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    return { pts, minX, maxX, minY, maxY, step };
  }

  // the comet's path across the screen (u: 0 → 1, left → right), in front of the sun
  const path = (u, out) => {
    const vw = S.visW, vh = S.visH;
    out.x = -vw * .62 + u * vw * 1.24;
    out.y = vh * (.2 - .2 * u) + vh * .07 * Math.sin(Math.PI * u);
    out.z = 8 + 6 * Math.sin(Math.PI * u);
    return out;
  };

  function buildText() {
    const s = sampleName(), pts = s.pts;
    N = pts.length / 2;
    const vw = S.visW, vh = S.visH;
    const tw = (s.maxX - s.minX) || 1, th = (s.maxY - s.minY) || 1;
    const scale = Math.min(vw * .8 / tw, vh * .42 / th);
    const cx = (s.minX + s.maxX) / 2, cy = (s.minY + s.maxY) / 2;
    const lift = vh * .07, jit = s.step * scale * .5;
    B = new Float32Array(N * 3); J = new Float32Array(N * 3); W = new Float32Array(N * 3); C = new Float32Array(N * 3);
    O = new Float32Array(N * 3); K = new Float32Array(N * 3); V = new Float32Array(N * 3); WS = new Float32Array(N * 3);
    U = new Float32Array(N); TD = new Float32Array(N); G = new Float32Array(N); PH = new Float32Array(N);
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    const pal = [[.95, .93, .9], [.95, .93, .9], [.95, .93, .9], [.83, .66, .48], [.69, .51, .35]]; // bone white, some tan and caramel
    const p = { x: 0, y: 0, z: 0 };
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      B[k] = (pts[i * 2] - cx) * scale + (Math.random() - .5) * jit;
      B[k + 1] = -(pts[i * 2 + 1] - cy) * scale + lift + (Math.random() - .5) * jit;
      B[k + 2] = (Math.random() - .5) * 2.5;
      // each star drops from the comet where it passes above its letter
      U[i] = clamp(.5 + B[k] / (vw * 1.24) + (Math.random() - .5) * .03, 0, 1);
      TD[i] = T_SWEEP + U[i] * SWEEP;
      path(U[i], p);
      const r = Math.pow(Math.random(), 1.6) * vh * .06, a = Math.random() * Math.PI * 2;
      J[k] = p.x + Math.cos(a) * r - Math.random() * vw * .02;
      J[k + 1] = p.y + Math.sin(a) * r;
      J[k + 2] = p.z + (Math.random() - .5) * 6;
      // the trail drifts a little, and sinks slowly, before it gathers
      W[k] = (Math.random() - .6) * vw * .03;
      W[k + 1] = (Math.random() - .65) * vh * .05;
      W[k + 2] = (Math.random() - .5) * 8;
      G[i] = T_GATHER + U[i] * .7 + Math.random() * .2;
      // each star curves in on its own path
      const ca = Math.random() * Math.PI * 2, cr = vh * (.04 + Math.random() * .1);
      C[k] = Math.cos(ca) * cr; C[k + 1] = Math.sin(ca) * cr; C[k + 2] = (Math.random() - .5) * 20;
      PH[i] = Math.random() * Math.PI * 2;
      K.set(pal[(Math.random() * pal.length) | 0], k);
      pos[k] = J[k]; pos[k + 1] = J[k + 1]; pos[k + 2] = J[k + 2];
    }
    nameBox = [Infinity, -Infinity, Infinity, -Infinity];
    for (let i = 0; i < N; i++) {
      const x = B[i * 3], y = B[i * 3 + 1];
      if (x < nameBox[0]) nameBox[0] = x; if (x > nameBox[1]) nameBox[1] = x;
      if (y < nameBox[2]) nameBox[2] = y; if (y > nameBox[3]) nameBox[3] = y;
    }
    if (textPts) { nameGroup.remove(textPts); textGeo.dispose(); }
    textGeo = new T.BufferGeometry();
    textGeo.setAttribute('position', new T.BufferAttribute(pos, 3).setUsage(T.DynamicDrawUsage));
    textGeo.setAttribute('color', new T.BufferAttribute(col, 3).setUsage(T.DynamicDrawUsage));
    textMat.size = Math.max(.9, s.step * scale * 1.7);
    textMat.opacity = 1;
    textPts = new T.Points(textGeo, textMat);
    textPts.frustumCulled = false;
    nameGroup.add(textPts);
  }

  /* ---------- drag to orbit, hover to ripple ---------- */
  const orbit = { yaw: 0, pitch: 0, vy: 0, vp: 0, down: false, moved: false, x: 0, y: 0, id: 0 };
  const hover = { on: false, sx: 0, sy: 0, lx: 1e4, ly: 1e4 };
  let ray, plane, hit, ndc;

  // where the pointer touches the name's plane, in the name's own coordinates
  function pointerOnName() {
    if (!hover.on) { hover.lx = hover.ly = 1e4; return; }
    ndc.set(hover.sx / innerWidth * 2 - 1, -(hover.sy / innerHeight * 2 - 1));
    ray.setFromCamera(ndc, S.camera);
    plane.set(new T.Vector3(0, 0, 1), 0).applyMatrix4(nameGroup.matrixWorld);
    if (ray.ray.intersectPlane(plane, hit)) {
      nameGroup.worldToLocal(hit);
      hover.lx = hit.x; hover.ly = hit.y;
    } else hover.lx = hover.ly = 1e4;
  }

  /* ---------- free flight (computers only, once the name has formed) ---------- */
  // phones keep "drag to orbit the whole scene"; with a mouse, the camera itself flies:
  // drag looks around, the wheel and WASD / arrow keys move, the border sphere keeps you in
  let mouseMode = false;
  const fly = { on: false, touched: false, sway: 1, pos: null, vel: null, keys: new Set() };
  let fwd, side, tmp, dn;
  const pitchMax = () => (mouseMode ? 1.45 : 1.2);
  const interact = () => { fly.touched = true; glide = follow = null; }; // any input takes the controls back

  const onUi = (e) => e.target.closest('button, a');
  root.addEventListener('pointerdown', (e) => {
    if (onUi(e) || state !== 'form' || (mouseMode && !fly.on)) return;
    Object.assign(orbit, { down: true, moved: false, x: e.clientX, y: e.clientY, id: e.pointerId, vy: 0, vp: 0 });
    root.setPointerCapture?.(e.pointerId);
  });
  root.addEventListener('pointermove', (e) => {
    hover.on = e.pointerType === 'mouse' || orbit.down;
    hover.sx = e.clientX; hover.sy = e.clientY;
    if (!orbit.down) return;
    const dx = e.clientX - orbit.x, dy = e.clientY - orbit.y;
    if (!orbit.moved && Math.hypot(dx, dy) < 4) return;
    if (!orbit.moved) { orbit.moved = true; root.classList.add('is-dragging'); interact(); }
    orbit.x = e.clientX; orbit.y = e.clientY;
    const k = mouseMode ? .0022 : .0035; // looking around turns slower than orbiting the scene
    orbit.yaw += dx * k;
    orbit.pitch = clamp(orbit.pitch + dy * k, -pitchMax(), pitchMax());
    orbit.vy = clamp(dx * k, -.04, .04); orbit.vp = clamp(dy * k, -.04, .04); // glide speed after release
  });
  root.addEventListener('wheel', (e) => {
    if (!fly.on || state !== 'form') return;
    e.preventDefault();
    const d = clamp(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1), -120, 120);
    S.camera.getWorldDirection(tmp);
    fly.vel.addScaledVector(tmp, d * 1.4); // scroll down = fly forward
    interact();
  }, { passive: false });

  const KEYS = { w: 'f', arrowup: 'f', s: 'b', arrowdown: 'b', a: 'l', arrowleft: 'l', d: 'r', arrowright: 'r' };
  addEventListener('keydown', (e) => {
    if (!fly.on || state !== 'form' || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = KEYS[e.key.toLowerCase()];
    if (!k) return;
    if (e.key.startsWith('Arrow')) e.preventDefault();
    fly.keys.add(k);
    interact();
  });
  addEventListener('keyup', (e) => { const k = KEYS[e.key.toLowerCase()]; if (k) fly.keys.delete(k); });
  addEventListener('blur', () => fly.keys.clear());

  // push the camera out of a sphere (the sun, a planet), or back inside one (the border)
  function keepOut(c, min) {
    dn.subVectors(fly.pos, c);
    const l = dn.length();
    if (l >= min) return;
    dn.divideScalar(l || 1);
    fly.pos.copy(c).addScaledVector(dn, min);
    const v = fly.vel.dot(dn);
    if (v < 0) fly.vel.addScaledVector(dn, -v);
  }
  function keepIn(c, max) {
    dn.subVectors(fly.pos, c);
    const l = dn.length();
    if (l <= max) return;
    dn.divideScalar(l);
    fly.pos.copy(c).addScaledVector(dn, max);
    const v = fly.vel.dot(dn);
    if (v > 0) fly.vel.addScaledVector(dn, -v);
  }

  function updateFly(now, dt, f60) {
    const cam = S.camera;
    if (!orbit.down) {
      orbit.yaw += orbit.vy * f60; orbit.vy *= Math.pow(.92, f60);
      orbit.pitch = clamp(orbit.pitch + orbit.vp * f60, -pitchMax(), pitchMax()); orbit.vp *= Math.pow(.92, f60);
    }
    // the idle sway fades out as soon as you start exploring
    if (fly.touched) fly.sway = Math.max(0, fly.sway - dt * 1.2);
    const sw = fly.sway;
    cam.rotation.set(orbit.pitch + Math.sin(now * .00023) * .012 * sw, orbit.yaw + Math.sin(now * .0003) * .02 * sw, 0);
    if (fly.on && (glide || follow)) {
      steer(now);
    } else if (fly.on) {
      if (fly.keys.size) {
        cam.getWorldDirection(fwd);
        side.crossVectors(fwd, cam.up).normalize();
        const a = 9 * f60;
        if (fly.keys.has('f')) fly.vel.addScaledVector(fwd, a);
        if (fly.keys.has('b')) fly.vel.addScaledVector(fwd, -a);
        if (fly.keys.has('r')) fly.vel.addScaledVector(side, a);
        if (fly.keys.has('l')) fly.vel.addScaledVector(side, -a);
      }
      if (fly.vel.length() > 260) fly.vel.setLength(260);
      fly.pos.addScaledVector(fly.vel, dt);
      fly.vel.multiplyScalar(Math.pow(.93, f60));
    }
    if (fly.on) {
      keepIn(S.BORDER_C, S.BORDER_R - 50); // stop short of the shell so it's in view
      bodies.forEach((b) => keepOut(b.mesh.getWorldPosition(tmp), b.r * (b.id === 'sun' ? 1.8 : 1.6)));
    }
    cam.position.copy(fly.pos);
    cam.updateMatrixWorld();
    if (fly.on) {
      overTarget = hover.on && !orbit.down ? pick(hover.sx, hover.sy) : null;
      root.classList.toggle('is-over-target', !!overTarget);
      root.classList.toggle('has-moved', fly.pos.distanceTo(home) > 40 || Math.abs(wrap(orbit.yaw)) > .5 || Math.abs(orbit.pitch) > .5);
      updateLabels();
    }
  }

  /* ---------- click to fly: a planet, the sun, or my name ---------- */
  const homeBtn = root.querySelector('.intro__home');
  const labelEls = {};
  root.querySelectorAll('.intro__labels span').forEach((el) => { labelEls[el.dataset.body] = el; });
  let bodies = [], glide = null, follow = null, overTarget = null, home, bp, lp, nameBox;
  const wrap = (a) => a - Math.PI * 2 * Math.round(a / (Math.PI * 2));

  // what's under the pointer: the nearest planet or the sun, else the name
  function pick(sx, sy) {
    ndc.set(sx / innerWidth * 2 - 1, -(sy / innerHeight * 2 - 1));
    ray.setFromCamera(ndc, S.camera);
    const o = ray.ray.origin, dir = ray.ray.direction;
    let best = null, bestD = Infinity;
    for (const b of bodies) {
      b.mesh.getWorldPosition(bp);
      lp.subVectors(bp, o);
      const along = lp.dot(dir);
      if (along <= 0) continue;
      const rr = Math.max(b.r * 1.3, along * .018); // small or far planets stay easy to hit
      if (lp.lengthSq() - along * along < rr * rr && along < bestD) { bestD = along; best = b; }
    }
    if (best) return best;
    plane.set(new T.Vector3(0, 0, 1), 0).applyMatrix4(nameGroup.matrixWorld);
    if (nameBox && ray.ray.intersectPlane(plane, hit)) {
      nameGroup.worldToLocal(hit);
      if (hit.x > nameBox[0] && hit.x < nameBox[1] && hit.y > nameBox[2] && hit.y < nameBox[3]) return 'name';
    }
    return null;
  }

  // the yaw / pitch that look from `from` at `at`
  const aim = (from, at) => {
    lp.subVectors(at, from);
    const l = lp.length() || 1;
    return [Math.atan2(-lp.x, -lp.z), Math.asin(clamp(lp.y / l, -1, 1))];
  };

  function flyTo(target) {
    if (!fly.on) return;
    follow = null;
    fly.vel.set(0, 0, 0);
    orbit.vy = orbit.vp = 0;
    fly.touched = true;
    let offset = null;
    if (target !== 'name') {
      // stop on my side of it, a little above, far enough to see all of it
      target.mesh.getWorldPosition(bp);
      offset = new T.Vector3().subVectors(fly.pos, bp);
      offset.y += offset.length() * .25;
      offset.setLength(target.id === 'sun' ? target.r * 4 : Math.max(target.r * 5, target.ext * 2.9)); // Saturn: fit its rings
    }
    const to = offset ? bp.clone().add(offset) : home;
    glide = { t0: performance.now(), dur: clamp(1.2 + fly.pos.distanceTo(to) / 400, 1.2, 2.2) * 1000, from: fly.pos.clone(), y0: orbit.yaw, p0: orbit.pitch, target, offset };
  }

  // glide towards the target, then keep following it as it orbits
  const goal = new Float32Array(2);
  function steer(now) {
    const g = glide || follow;
    let at, to;
    if (g.target === 'name') { to = home; at = lp.set(0, 0, 0).clone(); }
    else {
      g.target.mesh.getWorldPosition(bp);
      to = bp.clone().add(g.offset);
      at = bp.clone();
      at.y -= g.offset.length() * .17; // aim a little below it, so it sits above the tagline and button
    }
    if (glide) {
      const p = clamp((now - glide.t0) / glide.dur, 0, 1), e = easeInOut(p);
      fly.pos.lerpVectors(glide.from, to, e);
      goal.set(aim(to, at));
      orbit.yaw = glide.y0 + wrap(goal[0] - glide.y0) * e;
      orbit.pitch = glide.p0 + (goal[1] - glide.p0) * e;
      if (p >= 1) { follow = glide.target === 'name' ? null : glide; glide = null; }
    } else {
      fly.pos.copy(to);
      goal.set(aim(to, at));
      orbit.yaw = goal[0]; orbit.pitch = goal[1];
    }
    S.camera.rotation.set(orbit.pitch, orbit.yaw, 0);
  }

  // a planet's name shows when you hover it or fly close to it
  function updateLabels() {
    const cam = S.camera, half = Math.tan(cam.fov * Math.PI / 360);
    cam.getWorldDirection(fwd);
    for (const b of bodies) {
      const el = labelEls[b.id];
      if (!el) continue;
      b.mesh.getWorldPosition(bp);
      lp.subVectors(bp, cam.position);
      const dist = lp.length(), ahead = lp.dot(fwd) > 0;
      const on = ahead && (overTarget === b || dist < b.r * 8);
      el.classList.toggle('is-on', on);
      if (!on) continue;
      bp.project(cam);
      const x = (bp.x + 1) / 2 * innerWidth, y = (1 - bp.y) / 2 * innerHeight;
      const pr = b.ext / (dist * half) * innerHeight / 2; // the planet's (or its rings') radius on screen
      el.style.transform = `translate(${x.toFixed(1)}px, ${(y - pr - 10).toFixed(1)}px) translate(-50%, -100%)`;
    }
  }
  const hideLabels = () => Object.values(labelEls).forEach((el) => el.classList.remove('is-on'));
  homeBtn?.addEventListener('click', () => flyTo('name'));
  const release = () => {
    orbit.down = false;
    root.classList.remove('is-dragging');
  };
  root.addEventListener('pointerup', (e) => {
    // a press that didn't drag is a click: fly to whatever is under it
    if (mouseMode && fly.on && orbit.down && !orbit.moved && state === 'form') {
      const t = pick(e.clientX, e.clientY);
      if (t) flyTo(t);
    }
    release();
  });
  root.addEventListener('pointercancel', release);
  root.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hover.on = false; });

  /* ---------- the intro comet ---------- */
  const cp = { x: 0, y: 0, z: 0 };
  function drawComet(t) {
    const u = (t - T_SWEEP) / SWEEP;
    if (u > 1.4) { if (comet) { comet.dispose(); comet = null; } return; }
    if (!comet) { comet = S.makeTrail(S.phone ? 60 : 90); nameGroup.add(comet.points); }
    const n = comet.n, fade = clamp(Math.min((u + .05) * 8, (1.4 - u) * 4), 0, 1);
    for (let k = 0; k < n; k++) {
      const uk = u - k * .0034, f = k / n;
      path(uk, cp);
      comet.P[k * 3] = cp.x; comet.P[k * 3 + 1] = cp.y; comet.P[k * 3 + 2] = cp.z;
      comet.S[k] = k === 0 ? 7 : 4.2 * (1 - f) + .4;
      comet.A[k] = uk < 0 || u < 0 ? 0 : fade * (k === 0 ? 1 : Math.pow(1 - f, 1.5) * .85);
      comet.C.set([1, .93 - f * .2, .8 - f * .35], k * 3);
    }
    comet.commit();
  }

  /* ---------- every frame ---------- */
  function frame(now, dt) {
    const f60 = dt * 60;
    if (state === 'form') {
      const t = (now - tStart) / 1000;
      if (mouseMode) updateFly(now, dt, f60);
      else {
        // orbit: glide after release, plus a slow idle sway
        if (!orbit.down) {
          orbit.yaw += orbit.vy * f60; orbit.vy *= Math.pow(.92, f60);
          orbit.pitch = clamp(orbit.pitch + orbit.vp * f60, -1.2, 1.2); orbit.vp *= Math.pow(.92, f60);
        }
        S.world.rotation.set(orbit.pitch + Math.sin(now * .00023) * .03, orbit.yaw + Math.sin(now * .0003) * .05, 0);
      }
      S.world.updateMatrixWorld();
      pointerOnName();
      drawComet(t);
      updateName(t, f60);
    } else if (state === 'warp') {
      const t = (now - tWarp) / 1000;
      // the name scatters outward in 3D and fades while the camera dives into the sun
      const pos = textGeo.attributes.position.array, col = textGeo.attributes.color.array;
      const out = 1 - Math.exp(-t * 1.3), dim = Math.max(0, 1 - t / 1.9);
      for (let i = 0; i < N * 3; i++) { pos[i] = WS[i] + V[i] * out; col[i] = K[i] * dim; }
      textGeo.attributes.position.needsUpdate = true;
      textGeo.attributes.color.needsUpdate = true;
      const p = clamp(t / WARP, 0, 1), e = Math.pow(p, 2.2);
      S.camera.position.lerpVectors(camFrom, sunPos, e * .985);
      const look = lookFrom.clone().lerp(sunPos, clamp(t / .8, 0, 1));
      S.camera.lookAt(look);
      S.camera.fov = S.FOV + 14 * e;
      S.camera.updateProjectionMatrix();
      S.updateScale();
      if (t > 1.95) flash.classList.add('on');
      if (t > WARP) finish();
    }
  }

  function updateName(t, f60) {
    const pos = textGeo.attributes.position.array, col = textGeo.attributes.color.array;
    const R = S.visW * .075, R2 = R * R, damp = Math.pow(.9, f60);
    for (let i = 0; i < N; i++) {
      const k = i * 3;
      let x, y, z, br, mix;
      if (t < TD[i]) {                       // not dropped yet
        col[k] = col[k + 1] = col[k + 2] = 0;
        continue;
      }
      const sinceDrop = t - TD[i];
      if (t < G[i]) {                         // hanging in the comet's trail
        const d = 1 - Math.exp(-sinceDrop * 1.1);
        x = J[k] + W[k] * d; y = J[k + 1] + W[k + 1] * d; z = J[k + 2] + W[k + 2] * d;
        br = .45 + .9 * Math.exp(-sinceDrop * 2.6) + .15 * Math.sin(t * 9 + PH[i]);
        mix = 0;
      } else {                                // curving into its letter
        const dg = 1 - Math.exp(-(G[i] - TD[i]) * 1.1);
        const x0 = J[k] + W[k] * dg, y0 = J[k + 1] + W[k + 1] * dg, z0 = J[k + 2] + W[k + 2] * dg;
        const p = clamp((t - G[i]) / GATHER, 0, 1), e = easeInOut(p), a = 1 - e;
        const mx = (x0 + B[k]) / 2 + C[k], my = (y0 + B[k + 1]) / 2 + C[k + 1], mz = (z0 + B[k + 2]) / 2 + C[k + 2];
        x = a * a * x0 + 2 * a * e * mx + e * e * B[k];
        y = a * a * y0 + 2 * a * e * my + e * e * B[k + 1];
        z = a * a * z0 + 2 * a * e * mz + e * e * B[k + 2] + Math.sin(t * 1.3 + PH[i]) * .7 * e;
        br = .45 + .55 * e;
        mix = e;
        if (p >= 1) {                         // formed: hover pushes the stars aside, then they flow back
          const dx = x + O[k] - hover.lx, dy = y + O[k + 1] - hover.ly, d2 = dx * dx + dy * dy;
          if (d2 < R2 && !(orbit.down && orbit.moved)) {
            const d = Math.sqrt(d2) || 1, f = (1 - d / R) * 1.8 * f60;
            O[k] += dx / d * f; O[k + 1] += dy / d * f; O[k + 2] += f * 1.6;
          }
          br = .86 + .14 * Math.sin(t * 2.1 + PH[i]);
        }
      }
      O[k] *= damp; O[k + 1] *= damp; O[k + 2] *= damp;
      pos[k] = x + O[k]; pos[k + 1] = y + O[k + 1]; pos[k + 2] = z + O[k + 2];
      // trail stars glow warm white, then take their letter colour
      col[k] = (1 * (1 - mix) + K[k] * mix) * br;
      col[k + 1] = (.92 * (1 - mix) + K[k + 1] * mix) * br;
      col[k + 2] = (.8 * (1 - mix) + K[k + 2] * mix) * br;
    }
    textGeo.attributes.position.needsUpdate = true;
    textGeo.attributes.color.needsUpdate = true;
  }

  /* ---------- flow ---------- */
  const lockSite = (on) => {
    html.classList.toggle('intro-on', on);
    if (site) site.inert = on;
  };
  const remember = () => { try { sessionStorage.setItem('introSeen', '1'); } catch (e) { /* private mode */ } };

  let built = false;
  function setup() {
    if (built) return;
    built = true;
    T = S.THREE;
    nameGroup = new T.Group();
    textMat = new T.PointsMaterial({ size: 1, map: S.glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    ray = new T.Raycaster(); plane = new T.Plane(); hit = new T.Vector3(); ndc = new T.Vector2();
    fly.pos = new T.Vector3(); fly.vel = new T.Vector3();
    fwd = new T.Vector3(); side = new T.Vector3(); tmp = new T.Vector3(); dn = new T.Vector3();
    bp = new T.Vector3(); lp = new T.Vector3(); home = new T.Vector3(0, 0, S.CAM_Z);
    bodies = [{ id: 'sun', r: S.R_SUN, ext: S.R_SUN, mesh: S.sun }, ...S.planets.map((p) => ({ id: p.id, r: p.r, ext: p.ext, mesh: p.mesh }))];
    S.onFrame(frame);
  }

  function ready() {
    if (state !== 'form' && state !== 'static') return;
    root.classList.add('is-ready');
    startBtn.focus({ preventScroll: true });
    if (state === 'form' && mouseMode) {
      fly.on = true;
      S.showBorder(true);
      root.classList.add('is-exploring');
    }
  }

  function resetFly() {
    fly.on = false;
    fly.touched = false;
    fly.sway = 1;
    fly.keys.clear();
    if (fly.pos) { fly.pos.set(0, 0, S.CAM_Z); fly.vel.set(0, 0, 0); }
    glide = follow = overTarget = null;
    hideLabels();
    root.classList.remove('is-exploring', 'has-moved', 'is-over-target');
  }

  async function begin() {
    lockSite(true);
    root.classList.remove('is-ready', 'is-warping', 'is-leaving', 'is-dragging');
    state = 'loading';
    clearTimeout(readyTimer);
    if (!S.ok) {
      root.classList.add('intro--static');
      state = 'static';
      readyTimer = setTimeout(ready, 300);
      return;
    }
    const fonts = document.fonts ? Promise.race([document.fonts.load('400 120px "Instrument Serif"'), wait(1800)]).catch(() => {}) : null;
    await fonts;
    if (state !== 'loading') return; // skipped while loading
    setup();
    S.setMode('intro');
    S.world.add(nameGroup);
    mouseMode = matchMedia('(hover: hover) and (pointer: fine)').matches;
    S.camera.rotation.order = 'YXZ';
    resetFly();
    Object.assign(orbit, { yaw: 0, pitch: 0, vy: 0, vp: 0, down: false, moved: false });
    O && O.fill(0);
    buildText();
    state = 'form';
    tStart = performance.now();
    readyTimer = setTimeout(ready, T_READY * 1000);
  }

  function start() {
    if (state === 'form') {
      state = 'warp';
      tWarp = performance.now();
      clearTimeout(readyTimer);
      root.classList.add('is-warping');
      root.classList.remove('is-ready');
      if (comet) { comet.dispose(); comet = null; }
      // freeze where every star is, and send it outward
      const pos = textGeo.attributes.position.array;
      WS.set(pos);
      const vw = S.visW;
      for (let i = 0; i < N; i++) {
        const k = i * 3, d = Math.hypot(pos[k], pos[k + 1]) || 1, sp = vw * (.18 + Math.random() * .5);
        V[k] = pos[k] / d * sp + (Math.random() - .5) * vw * .25;
        V[k + 1] = pos[k + 1] / d * sp + (Math.random() - .5) * vw * .25;
        V[k + 2] = (Math.random() - .35) * vw * .8;
      }
      // dive from wherever you are: turn from what you're looking at towards the sun
      glide = follow = null;
      fly.keys.clear();
      camFrom = S.camera.position.clone();
      lookFrom = mouseMode
        ? camFrom.clone().add(S.camera.getWorldDirection(new T.Vector3()).multiplyScalar(60))
        : new T.Vector3(0, 0, 0);
      sunPos = S.sunWorld(new T.Vector3());
    } else if (state === 'static') {
      state = 'warp';
      root.classList.add('is-warping');
      flash.classList.add('on');
      setTimeout(finish, 480);
    }
  }

  function cleanup() {
    clearTimeout(readyTimer);
    if (comet) { comet.dispose(); comet = null; }
    if (nameGroup && nameGroup.parent) nameGroup.parent.remove(nameGroup);
    resetFly();
    S.setMode('site');
    lockSite(false);
    remember();
  }

  function finish() {
    state = 'off';
    root.classList.remove('is-warping', 'is-ready', 'is-leaving');
    cleanup();
    flash.classList.add('out');
    requestAnimationFrame(() => flash.classList.remove('on'));
    setTimeout(() => flash.classList.remove('out'), 1200);
  }

  function skip() {
    if (state === 'off' || state === 'leaving' || state === 'warp') return;
    state = 'leaving';
    clearTimeout(readyTimer);
    root.classList.add('is-leaving');
    setTimeout(() => {
      state = 'off';
      root.classList.remove('is-leaving', 'is-ready', 'is-warping');
      cleanup();
    }, 560);
  }

  startBtn.addEventListener('click', start);
  skipBtn.addEventListener('click', skip);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('intro-on')) skip(); });

  let rz;
  addEventListener('resize', () => {
    if (!S.ok) return;
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (state !== 'form') return;
      const formed = root.classList.contains('is-ready');
      buildText(); // Space has already resized; positions follow the clock, so this carries on seamlessly
      if (formed) tStart = Math.min(tStart, performance.now() - 20000);
    }, 260);
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
