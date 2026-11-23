// Steven Widinata — the 3D space behind everything: a sun with the 8 planets on their orbits,
// a deep starfield and comets. The intro uses it up close (and lets you drag to orbit);
// the site shows the whole system from far away, dimmed, slowly turning.
'use strict';

const Space = (() => {
  const html = document.documentElement;
  const canvas = document.querySelector('.space');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = Math.min(innerWidth, innerHeight) < 700;
  const none = { ok: false, setMode() {}, onFrame() {}, offFrame() {} };

  const webglOk = () => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
    } catch (e) { return false; }
  };
  if (!canvas || !window.THREE || !webglOk()) {
    if (canvas) canvas.hidden = true;
    return none;
  }

  const T = THREE;
  const CAM_Z = 100, FOV = 60;
  const SYS = new T.Vector3(0, 8, -260); // where the sun sits, behind the name
  const TILT = .42;                       // the orbit plane leans towards us so orbits read as ellipses

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: !phone, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    canvas.hidden = true;
    return none;
  }
  renderer.setClearColor(0x0E0C0A, 1);
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(FOV, innerWidth / innerHeight, .1, 3000);
  const world = new T.Group();      // everything you can orbit around in the intro
  world.rotation.order = 'YXZ';
  scene.add(world);

  /* ---------- small helpers ---------- */
  const paint = (w, h, fn) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    fn(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  };
  const rand = (a, b) => a + Math.random() * (b - a);

  // soft round glow, used for stars, the sun's halo and comet heads
  const glowTex = paint(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(.22, 'rgba(255,255,255,.85)');
    gr.addColorStop(.55, 'rgba(255,255,255,.14)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
  });
  const haloTex = paint(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,236,190,1)');
    gr.addColorStop(.18, 'rgba(255,200,120,.55)');
    gr.addColorStop(.45, 'rgba(255,160,80,.14)');
    gr.addColorStop(1, 'rgba(255,140,60,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
  });

  /* ---------- planet textures, painted in code ---------- */
  const TW = phone ? 256 : 512, TH = TW / 2;

  const bands = (stops, wobble = 3, seed = Math.random() * 10) => (g, w, h) => {
    for (let y = 0; y < h; y++) {
      const v = y / h;
      let i = 0;
      while (i < stops.length - 2 && v > stops[i + 1][0]) i++;
      const [p0, c0] = stops[i], [p1, c1] = stops[i + 1];
      const f = Math.min(1, Math.max(0, (v - p0) / (p1 - p0)));
      const mix = (a, b) => Math.round(a + (b - a) * f);
      g.fillStyle = `rgb(${mix(c0[0], c1[0])},${mix(c0[1], c1[1])},${mix(c0[2], c1[2])})`;
      for (let x = 0; x < w; x += 8) {
        const off = Math.sin(x / w * Math.PI * 6 + y * .15 + seed) * wobble;
        g.fillRect(x, y + off, 8, 1.6);
      }
    }
  };
  const blotches = (g, w, h, n, colors, rMin, rMax, alpha = 1) => {
    g.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[i % colors.length];
      g.beginPath();
      g.ellipse(Math.random() * w, Math.random() * h, rand(rMin, rMax) * 1.6, rand(rMin, rMax), 0, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  const solid = (c) => (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); };

  const PAINT = {
    mercury: (g, w, h) => {
      solid('#8e8780')(g, w, h);
      blotches(g, w, h, 70, ['#6f6a65', '#a7a19a', '#5d5853'], w * .004, w * .018, .55);
    },
    venus: (g, w, h) => {
      bands([[0, [222, 190, 128]], [.3, [236, 210, 160]], [.55, [210, 172, 110]], [.8, [232, 205, 150]], [1, [214, 182, 122]]], 6)(g, w, h);
      blotches(g, w, h, 30, ['#f1dfb4', '#c9a56a'], w * .02, w * .05, .18);
    },
    earth: (g, w, h) => {
      solid('#1f4f8f')(g, w, h);
      blotches(g, w, h, 26, ['#2f6a35', '#4a7d3a', '#7d7248', '#386b2f'], w * .025, w * .07, .95); // land
      g.fillStyle = 'rgba(240,244,248,.95)';                                                          // ice caps
      g.fillRect(0, 0, w, h * .07); g.fillRect(0, h * .93, w, h * .07);
      blotches(g, w, h, 40, ['rgba(255,255,255,.75)'], w * .01, w * .04, .55);                      // clouds
    },
    mars: (g, w, h) => {
      solid('#b4532c')(g, w, h);
      blotches(g, w, h, 40, ['#8e3d1f', '#c96b3e', '#7a3418'], w * .01, w * .05, .6);
      g.fillStyle = 'rgba(245,240,235,.9)';
      g.fillRect(0, 0, w, h * .05);
    },
    jupiter: (g, w, h) => {
      bands([[0, [196, 168, 132]], [.12, [226, 206, 176]], [.22, [170, 118, 80]], [.32, [234, 220, 196]], [.42, [186, 130, 88]],
        [.5, [238, 226, 204]], [.6, [176, 124, 86]], [.7, [228, 212, 186]], [.82, [160, 116, 84]], [1, [204, 178, 144]]], 4)(g, w, h);
      g.fillStyle = 'rgba(180,82,56,.9)';                                                             // the Great Red Spot
      g.beginPath(); g.ellipse(w * .66, h * .62, w * .045, h * .05, 0, 0, Math.PI * 2); g.fill();
    },
    saturn: bands([[0, [206, 186, 140]], [.2, [228, 208, 160]], [.38, [200, 172, 118]], [.5, [236, 218, 172]],
      [.65, [212, 186, 132]], [.82, [226, 204, 156]], [1, [196, 172, 126]]], 2),
    uranus: bands([[0, [150, 210, 218]], [.5, [172, 224, 230]], [1, [146, 204, 214]]], 1),
    neptune: (g, w, h) => {
      bands([[0, [52, 86, 196]], [.3, [66, 104, 214]], [.5, [48, 78, 184]], [.7, [70, 110, 220]], [1, [44, 72, 176]]], 2)(g, w, h);
      g.fillStyle = 'rgba(28,40,110,.8)';
      g.beginPath(); g.ellipse(w * .4, h * .58, w * .03, h * .035, 0, 0, Math.PI * 2); g.fill();
    },
  };

  // sizes and orbits are artistic (the real ones would put Neptune off the screen)
  const PLANETS = [
    { id: 'mercury', r: 2.4, orbit: 36 },
    { id: 'venus', r: 4.0, orbit: 50 },
    { id: 'earth', r: 4.2, orbit: 66 },
    { id: 'mars', r: 3.2, orbit: 82 },
    { id: 'jupiter', r: 11.2, orbit: 114 },
    { id: 'saturn', r: 9.2, orbit: 152, ring: [12.4, 21.6] },
    { id: 'uranus', r: 6.2, orbit: 188 },
    { id: 'neptune', r: 6.0, orbit: 220 },
  ];
  const R_SUN = 16;
  // the explorable space on the intro: a sphere around the whole system and the starting view
  const BORDER_C = new T.Vector3(0, 4, -170), BORDER_R = 390;

  /* ---------- the solar system ---------- */
  const system = new T.Group();   // positioned + tilted
  const plane = new T.Group();    // the orbit plane, turns slowly on the site
  system.position.copy(SYS);
  system.rotation.x = TILT;
  system.add(plane);
  world.add(system);

  const seg = phone ? 20 : 40;
  const sunTex = paint(TW, TH, (g, w, h) => {
    solid('#ffcf6e')(g, w, h);
    blotches(g, w, h, 160, ['#ffb347', '#fff0c0', '#ff9f3a'], w * .004, w * .02, .45);
  });
  const sun = new T.Mesh(new T.SphereGeometry(R_SUN, seg, seg), new T.MeshBasicMaterial({ map: sunTex }));
  plane.add(sun);
  const halo = new T.Sprite(new T.SpriteMaterial({ map: haloTex, color: 0xffffff, transparent: true, opacity: .9, blending: T.AdditiveBlending, depthWrite: false }));
  halo.scale.setScalar(R_SUN * 5.2);
  const corona = new T.Sprite(new T.SpriteMaterial({ map: haloTex, color: 0xffd9a0, transparent: true, opacity: .28, blending: T.AdditiveBlending, depthWrite: false }));
  corona.scale.setScalar(R_SUN * 13);
  sun.add(halo, corona);
  plane.add(new T.PointLight(0xfff1dc, 2.1, 0, 0));
  scene.add(new T.AmbientLight(0xffffff, .16));

  const orbitMat = new T.LineBasicMaterial({ color: 0xF2EDE6, transparent: true, opacity: .13, depthWrite: false });
  const planets = PLANETS.map((p, i) => {
    const pts = [];
    for (let k = 0; k <= 128; k++) { const a = k / 128 * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit)); }
    plane.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), orbitMat));

    const pivot = new T.Group();  // turns around the sun
    pivot.rotation.y = Math.random() * Math.PI * 2;
    plane.add(pivot);
    const mesh = new T.Mesh(
      new T.SphereGeometry(p.r, seg, Math.round(seg * .75)),
      new T.MeshLambertMaterial({ map: paint(TW, TH, PAINT[p.id]) }),
    );
    mesh.position.x = p.orbit;
    mesh.rotation.z = .2 + i * .03;
    pivot.add(mesh);

    if (p.ring) {
      const [inner, outer] = p.ring;
      const geo = new T.RingGeometry(inner, outer, phone ? 48 : 96, 1);
      const pos = geo.attributes.position, uv = geo.attributes.uv, v = new T.Vector3();
      for (let k = 0; k < pos.count; k++) { v.fromBufferAttribute(pos, k); uv.setXY(k, (v.length() - inner) / (outer - inner), .5); }
      const ringTex = paint(256, 4, (g) => {
        for (let x = 0; x < 256; x++) {
          const f = x / 256;
          const a = (.35 + .45 * Math.abs(Math.sin(f * 21))) * (f < .06 || f > .96 ? .3 : 1) * (f > .62 && f < .67 ? .15 : 1);
          g.fillStyle = `rgba(${220 - f * 40},${200 - f * 45},${160 - f * 50},${a})`;
          g.fillRect(x, 0, 1, 4);
        }
      });
      const ring = new T.Mesh(geo, new T.MeshBasicMaterial({ map: ringTex, transparent: true, side: T.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2 + .45;
      mesh.add(ring);
    }
    return { id: p.id, r: p.r, mesh, pivot, speed: .5 * Math.pow(36 / p.orbit, 1.5), spin: .3 + Math.random() * .4 };
  });

  /* ---------- deep starfield, all around ---------- */
  const STARS = phone ? 1400 : 2800;
  {
    const pos = new Float32Array(STARS * 3), col = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      const r = rand(900, 1600), a = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(ph) * Math.cos(a), r * Math.cos(ph) * .8, r * Math.sin(ph) * Math.sin(a)], i * 3);
      const k = rand(.45, 1);
      col.set(Math.random() < .78 ? [.95 * k, .93 * k, .9 * k] : [.83 * k, .66 * k, .48 * k], i * 3);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    world.add(new T.Points(geo, new T.PointsMaterial({
      size: 6.6, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    })));
  }

  /* ---------- the border of the explorable space: dots that glow only near the camera ---------- */
  const borderMat = new T.ShaderMaterial({
    uniforms: { uScale: { value: 1 }, uOn: { value: 0 }, map: { value: glowTex } },
    vertexShader: `
      attribute vec3 tint; varying float vA; varying vec3 vC; uniform float uScale; uniform float uOn;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float d = distance(wp.xyz, cameraPosition);
        vA = uOn * smoothstep(170.0, 40.0, d) * .75;
        vC = tint;
        vec4 mv = viewMatrix * wp;
        gl_PointSize = 3.2 * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map; varying float vA; varying vec3 vC;
      void main() { gl_FragColor = vec4(vC, vA) * texture2D(map, gl_PointCoord); }`,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
  });
  {
    const n = phone ? 1400 : 2600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    const gold = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {           // evenly spread over the sphere (Fibonacci)
      const y = 1 - (i + .5) / n * 2, rr = Math.sqrt(1 - y * y), a = i * gold;
      pos.set([BORDER_C.x + Math.cos(a) * rr * BORDER_R, BORDER_C.y + y * BORDER_R, BORDER_C.z + Math.sin(a) * rr * BORDER_R], i * 3);
      col.set(Math.random() < .6 ? [.95, .9, .82] : [.83, .66, .48], i * 3);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('tint', new T.BufferAttribute(col, 3));
    const border = new T.Points(geo, borderMat);
    border.frustumCulled = false;
    world.add(border);
  }

  /* ---------- glowing trails (comets and the intro's comet) ---------- */
  // points with their own size and alpha, so a tail can taper and fade
  const trailMat = new T.ShaderMaterial({
    uniforms: { uScale: { value: 1 }, map: { value: glowTex } },
    vertexShader: `
      attribute float size; attribute float alpha; attribute vec3 tint;
      varying float vA; varying vec3 vC; uniform float uScale;
      void main() {
        vA = alpha; vC = tint;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * uScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform sampler2D map; varying float vA; varying vec3 vC;
      void main() { gl_FragColor = vec4(vC, vA) * texture2D(map, gl_PointCoord); }`,
    transparent: true, depthWrite: false, blending: T.AdditiveBlending,
  });
  const updateScale = () => {
    const s = renderer.getPixelRatio() * innerHeight / (2 * Math.tan(camera.fov * Math.PI / 360));
    trailMat.uniforms.uScale.value = s;
    borderMat.uniforms.uScale.value = s;
  };

  // a trail of n points; draw(fn) places point k (0 = head) and gives its size, alpha and colour
  function makeTrail(n) {
    const geo = new T.BufferGeometry();
    const P = new Float32Array(n * 3), S = new Float32Array(n), A = new Float32Array(n), C = new Float32Array(n * 3);
    geo.setAttribute('position', new T.BufferAttribute(P, 3).setUsage(T.DynamicDrawUsage));
    geo.setAttribute('size', new T.BufferAttribute(S, 1).setUsage(T.DynamicDrawUsage));
    geo.setAttribute('alpha', new T.BufferAttribute(A, 1).setUsage(T.DynamicDrawUsage));
    geo.setAttribute('tint', new T.BufferAttribute(C, 3).setUsage(T.DynamicDrawUsage));
    const points = new T.Points(geo, trailMat);
    points.frustumCulled = false;
    return {
      points, n, P, S, A, C,
      commit() { ['position', 'size', 'alpha', 'tint'].forEach((k) => { geo.attributes[k].needsUpdate = true; }); },
      dispose() { if (points.parent) points.parent.remove(points); geo.dispose(); },
    };
  }

  /* ---------- background comets, every 4–8 s ---------- */
  const comets = [];
  let nextComet = 0;
  const v1 = new T.Vector3(), v2 = new T.Vector3();
  function spawnComet(now) {
    const dist = rand(200, 520), halfH = dist * Math.tan(camera.fov * Math.PI / 360), halfW = halfH * camera.aspect;
    const dir = Math.random() < .5 ? 1 : -1;
    const a = new T.Vector3(-dir * halfW * 1.25, halfH * rand(.1, .9), -dist);
    const b = new T.Vector3(dir * halfW * 1.25, a.y - halfH * rand(.5, 1.3), -dist + rand(-60, 60));
    camera.localToWorld(a); camera.localToWorld(b);
    const t = makeTrail(phone ? 40 : 64);
    scene.add(t.points);
    const len = a.distanceTo(b);
    comets.push({ t, a, b, t0: now, dur: rand(2.4, 3.8) * 1000, warm: Math.random() < .5, head: rand(3.2, 5) * dist / 300, step: dist * rand(.22, .34) / len / t.n });
  }
  function updateComets(now) {
    if (!nextComet) nextComet = now + rand(1500, 3500);
    if (now > nextComet && !html.classList.contains('room-open')) { spawnComet(now); nextComet = now + rand(4000, 8000); }
    for (let i = comets.length - 1; i >= 0; i--) {
      const c = comets[i], u = (now - c.t0) / c.dur;
      if (u > 1.25) { c.t.dispose(); comets.splice(i, 1); continue; }
      const fade = Math.min(1, u * 6, (1.25 - u) * 5);
      const n = c.t.n;
      for (let k = 0; k < n; k++) {
        const uk = u - k * c.step, f = k / n;
        v1.copy(c.a).lerp(c.b, uk);
        c.t.P.set([v1.x, v1.y, v1.z], k * 3);
        c.t.S[k] = c.head * (k === 0 ? 2.6 : 1.4 * (1 - f));
        c.t.A[k] = uk < 0 ? 0 : fade * (k === 0 ? 1 : Math.pow(1 - f, 1.7) * .8);
        c.t.C.set(c.warm ? [1, .86 - f * .25, .68 - f * .35] : [.98, .97 - f * .1, .95 - f * .2], k * 3);
      }
      c.t.commit();
    }
  }

  /* ---------- camera modes ---------- */
  let mode = 'site', visW = 0, visH = 0;
  const hooks = new Set();

  function size() {
    const cap = mode === 'site' ? 1.25 : phone ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, cap));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    visH = 2 * CAM_Z * Math.tan(FOV * Math.PI / 360);
    visW = visH * camera.aspect;
    if (mode === 'site') placeSiteCamera();
    updateScale();
  }

  // the whole system from far away, at a slight angle
  function placeSiteCamera() {
    const half = Math.tan(FOV * Math.PI / 360);
    const d = Math.max(460, 270 / (half * Math.min(camera.aspect, 1.6)));
    camera.position.set(SYS.x, SYS.y + Math.sin(.3) * d, SYS.z + Math.cos(.3) * d);
    camera.lookAt(SYS);
  }

  function setMode(next) {
    mode = next;
    html.classList.toggle('space-site', mode === 'site');
    camera.fov = FOV;
    world.rotation.set(0, 0, 0);
    world.position.set(0, 0, 0);
    borderMat.uniforms.uOn.value = 0;
    if (mode === 'intro') {
      plane.rotation.y = 0;
      camera.position.set(0, 0, CAM_Z);
      camera.lookAt(0, 0, 0);
    }
    size();
    if (reduce) render(performance.now());
    else start();
  }

  /* ---------- loop ---------- */
  let last = 0, raf = 0, running = false;
  function render(now) {
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!reduce) {
      planets.forEach((p) => { p.pivot.rotation.y += p.speed * .35 * dt; p.mesh.rotation.y += p.spin * dt; });
      sun.rotation.y += .05 * dt;
      if (mode === 'site') plane.rotation.y += .012 * dt;
      updateComets(now);
    }
    hooks.forEach((fn) => fn(now, dt));
    renderer.render(scene, camera);
  }
  function loop(now) {
    if (!running) return;
    // on the site, rest while the tab is hidden or a project room covers the page
    if (!(mode === 'site' && html.classList.contains('room-open'))) render(now);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduce || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  let rz;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => { size(); if (reduce) render(performance.now()); }, 150);
  });

  setMode(html.classList.contains('intro-on') ? 'intro' : 'site');

  return {
    ok: true, THREE: T, scene, camera, world, renderer, glowTex, phone, CAM_Z, FOV,
    get visW() { return visW; },
    get visH() { return visH; },
    get current() { return mode; },
    setMode,
    makeTrail,
    updateScale,
    onFrame: (fn) => hooks.add(fn),
    offFrame: (fn) => hooks.delete(fn),
    sunWorld: (out = new T.Vector3()) => sun.getWorldPosition(out),
    sun, R_SUN, planets, BORDER_C, BORDER_R,
    showBorder: (on) => { borderMat.uniforms.uOn.value = on ? 1 : 0; },
  };
})();
