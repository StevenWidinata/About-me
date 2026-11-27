// Steven Widinata — site scripts
'use strict';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Language (EN/ID) ---------- */
let lang = 'en';
const t = (s) => (lang === 'id' && ID[s]) || s;

(() => {
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const EN_META = { title: document.title, description: $('meta[name="description"]').content };

  // 1. Elements whose inner markup is a key (e.g. headings with an <em>)
  const els = $$('body *').filter((el) => el.children.length && !el.closest('svg, script') && ID[norm(el.innerHTML)]);
  els.forEach((el) => { el.dataset.i18nEl = ''; el._en = norm(el.innerHTML); });

  // 2. Plain text nodes outside those elements
  const texts = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode());) {
    const key = norm(n.nodeValue);
    if (key && ID[key] && !n.parentElement.closest('[data-i18n-el], script')) {
      const [, lead, trail] = n.nodeValue.match(/^(\s*)[\s\S]*?(\s*)$/);
      texts.push({ n, key, lead, trail });
    }
  }

  // 3. Attributes
  const attrs = [];
  $$('[aria-label], img[alt]').forEach((el) => ['aria-label', 'alt'].forEach((a) => {
    const v = el.getAttribute(a);
    if (v && ID[v]) attrs.push({ el, a, key: v });
  }));

  const btn = $('.lang-toggle');
  const apply = (next) => {
    lang = next;
    const id = lang === 'id';
    document.documentElement.lang = lang;
    els.forEach((el) => { el.innerHTML = id ? ID[el._en] : el._en; });
    texts.forEach(({ n, key, lead, trail }) => { n.nodeValue = lead + (id ? ID[key] : key) + trail; });
    attrs.forEach(({ el, a, key }) => el.setAttribute(a, id ? ID[key] : key));
    const meta = id ? ID_META : EN_META;
    document.title = meta.title;
    $('meta[name="description"]').content = meta.description;
    btn.textContent = id ? 'ID' : 'EN';
    btn.setAttribute('aria-label', id ? 'Ganti bahasa ke English' : 'Switch language to Bahasa Indonesia');
    document.dispatchEvent(new Event('langchange'));
  };

  btn.addEventListener('click', () => {
    const next = lang === 'id' ? 'en' : 'id';
    localStorage.setItem('lang', next);
    apply(next);
  });
  apply(localStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('id') ? 'id' : 'en'));
})();


/* ---------- Header: scrolled state, mobile menu, active link ---------- */
(() => {
  const header = $('.header');
  const nav = $('#nav');
  const toggle = $('.menu-toggle');

  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', t(open ? 'Close menu' : 'Open menu'));
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav__link').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });

  // Highlight the link of the section currently in view
  const links = new Map($$('.nav__link').map((a) => [a.hash.slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((a) => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
      const a = links.get(en.target.id);
      if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));
})();


/* ---------- Journey: the path fills and stars light up as you scroll ---------- */
(() => {
  const line = $('.timeline');
  if (!line) return;
  const items = $$('.timeline__item', line);
  let ticking = false;

  const update = () => {
    ticking = false;
    const r = line.getBoundingClientRect();
    const mark = innerHeight * .6; // the "reading point" on screen
    const p = Math.min(1, Math.max(0, (mark - r.top) / r.height));
    line.style.setProperty('--progress', p.toFixed(4));
    items.forEach((it) => {
      const star = $('.timeline__star', it).getBoundingClientRect();
      it.classList.toggle('is-lit', star.top < mark);
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
})();


/* ---------- Toast + copy-to-clipboard (Discord has no profile URL) ---------- */
const toast = (() => {
  const el = $('.toast');
  let timer;
  return (msg) => {
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('is-visible'), 2200);
  };
})();

$$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(btn.dataset.copy);
    toast(`${t('Copied to clipboard')}: ${btn.dataset.copy}`);
  } catch {
    toast(`Discord: ${btn.dataset.copy}`);
  }
}));

$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ---------- Scroll reveal ---------- */
(() => {

  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in');
    setTimeout(() => { en.target.style.transitionDelay = ''; }, 1200); // keep hover snappy afterwards
    io.unobserve(en.target);
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });

  // stagger siblings inside the same grid
  $$('.reveal').forEach((el) => {
    const i = [...el.parentElement.children].filter((c) => c.classList.contains('reveal')).indexOf(el);
    el.style.transitionDelay = `${Math.min(i, 4) * 80}ms`;
    io.observe(el);
  });
})();

/* ---------- Project doors: open the door, walk through, see the project ---------- */
const PROJECTS = {
  mewing: {
    name: 'Mewing Academy',
    kind: 'AI · Education',
    img: 'assets/covers/mewing-academy.jpg',
    host: 'mewing-academy-beta.vercel.app',
    url: 'https://mewing-academy-beta.vercel.app',
    code: 'https://github.com/StevenWidinata/Mewing-Academy',
    desc: 'An accessible, AI-powered learning playground for kids. Students answer with their hands: on-device camera AI reads their gestures, so learning stays inclusive for every ability.',
    points: [
      'Students answer questions with hand gestures',
      'The gesture AI runs on the device with MediaPipe',
      'Built so kids of every ability can take part',
    ],
    tech: ['React', 'TypeScript', 'MediaPipe', 'Express'],
  },
  zero: {
    name: 'ZeroSignal',
    kind: 'Games · Full-stack',
    img: 'assets/covers/zerosignal.jpg',
    host: 'zerosignal-three.vercel.app',
    url: 'https://zerosignal-three.vercel.app',
    code: 'https://github.com/StevenWidinata/ZeroSignal',
    desc: 'A collection of quick arcade games for killing boredom, with real leaderboards. Every score is checked by the server, so nobody can cheat their way to the top.',
    points: [
      'Fourteen games, from a full-physics slingshot game to Chess, Sudoku and Brick Breaker',
      'Play Chess, Checkers and Sonar online against a friend',
      'The server replays every move, so the leaderboard stays fair',
      'Play straight away, and sign up only to save scores',
    ],
    tech: ['React', 'TypeScript', 'matter-js', 'Rust', 'PostgreSQL'],
  },
  glitch: {
    name: 'Glitch Type',
    kind: 'Games · Typing',
    img: 'assets/covers/glitch-type.jpg',
    host: 'glitch-type.vercel.app',
    url: 'https://glitch-type.vercel.app',
    code: 'https://github.com/StevenWidinata/glitch_type',
    desc: 'A neon typing trainer that plays like an arcade. Shoot down word asteroids from a black hole or repair a corrupted transmission before it breaks. No login: everything runs in the browser.',
    points: [
      'Pick a mode by grabbing a crate with a claw machine',
      'A daily challenge, plus stats with a weak-key heatmap',
      'Words in English and Bahasa Indonesia',
    ],
    tech: ['TypeScript', 'Vite', 'Canvas 2D', 'Web Audio', 'matter-js'],
  },
  sketchy: {
    name: 'Sketchy',
    kind: 'Games · Multiplayer',
    img: 'assets/covers/sketchy.jpg',
    host: 'sketchy-swart.vercel.app',
    url: 'https://sketchy-swart.vercel.app',
    code: 'https://github.com/StevenWidinata/sketchy',
    desc: 'A realtime drawing and guessing game for 2 to 20 friends. One player draws a word, everyone else races to guess it in chat. Share a 5-letter code and play in any browser, no sign-up.',
    points: [
      '20 word categories, in English or Bahasa Indonesia',
      'Pen, fill bucket and undo, with mouse, finger or stylus',
      'Every drawing replays as a timelapse at the end',
      'Guessers never receive the word, so nobody can peek',
    ],
    tech: ['React', 'TypeScript', 'Supabase Realtime', 'Vercel Functions', 'Canvas 2D'],
  },
  reelo: {
    name: 'Reelo',
    kind: 'Android app · Habits',
    img: 'assets/covers/reelo.jpg',
    host: 'stevenwidinata.github.io/reelo-site',
    url: 'https://stevenwidinata.github.io/reelo-site/',
    code: 'https://github.com/OneillAlim/reelo',
    cta: 'Get the app',
    desc: 'An Android app that keeps your TikTok streaks alive and counts the reels you watch on TikTok, YouTube Shorts and Instagram, with a pixel mascot that gets tired the more you scroll.',
    points: [
      'Sends your streak messages for you every night at 00.00',
      'Counts new reels, not swipes, so scrolling back never counts twice',
      'Four pixel mascots, one for each app, with five moods',
      'No internet permission: your data never leaves the phone',
    ],
    tech: ['Kotlin', 'Android', 'Accessibility Service', 'Home screen widgets'],
  },
};

/* ---------- The hall: doors on a curved wall; drag, swipe, arrows or keys turn the room ---------- */
const Hall = (() => {
  const hall = $('.hall'), row = $('.hall__row');
  if (!hall || !row) return { bring: async () => {} };
  const slots = $$('.slot', row);
  const prev = $('[data-turn="-1"]', hall), next = $('[data-turn="1"]', hall);
  const STEP = 0.36; // radians between neighbouring doors
  let cur = (slots.length - 1) / 2 | 0, target = cur, spacing = 260, radius = 600, anim = 0;

  const measure = () => {
    const dw = parseFloat(getComputedStyle(row).getPropertyValue('--door-w')) || 196;
    spacing = Math.max(dw * (row.clientWidth < 700 ? 1.5 : 1.15), Math.min(row.clientWidth * .24, dw * 1.45));
    radius = spacing / Math.sin(STEP);
  };

  const layout = () => {
    slots.forEach((el, i) => {
      const o = i - cur, far = Math.abs(o), a = o * STEP;
      const x = Math.sin(a) * radius, z = -(1 - Math.cos(a)) * radius;
      el.style.transform = `translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${a.toFixed(4)}rad)`;
      el.style.zIndex = String(100 - Math.round(far * 10));
      const show = far < 2.7;
      el.style.opacity = show ? String(Math.min(1, 2.9 - far)) : '0';
      el.style.visibility = show ? '' : 'hidden';
      el.style.filter = far > .05 ? `brightness(${(1 - Math.min(far, 2.5) * .14).toFixed(2)})` : '';
    });
    prev.disabled = target <= 0;
    next.disabled = target >= slots.length - 1;
  };

  // turn the room to a slot; resolves when it faces you
  const go = (to) => new Promise((done) => {
    target = Math.max(0, Math.min(slots.length - 1, Math.round(to)));
    cancelAnimationFrame(anim);
    const from = cur, dist = target - from;
    if (reduceMotion || Math.abs(dist) < .001) { cur = target; layout(); done(); return; }
    const dur = Math.min(900, 380 + Math.abs(dist) * 160), t0 = performance.now();
    const tick = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      cur = from + dist * (1 - Math.pow(1 - k, 3));
      layout();
      if (k < 1) anim = requestAnimationFrame(tick); else done();
    };
    anim = requestAnimationFrame(tick);
  });

  const indexOf = (el) => slots.indexOf(el.closest('.slot'));
  const bring = (el) => (indexOf(el) === Math.round(cur) && Math.abs(cur - Math.round(cur)) < .01 ? Promise.resolve() : go(indexOf(el)));

  prev.addEventListener('click', () => go(target - 1));
  next.addEventListener('click', () => go(target + 1));
  hall.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    go(target + (e.key === 'ArrowLeft' ? -1 : 1));
  });
  // tabbing to a door or mascot turns the room to it
  row.addEventListener('focusin', (e) => { const i = indexOf(e.target); if (i >= 0 && i !== target) go(i); });

  // drag / swipe: only becomes a drag after a few pixels, so clicks still work
  let drag = null, justDragged = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: cur, on: false, lx: e.clientX, lt: e.timeStamp, v: 0 };
  });
  row.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.on) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - drag.y)) return;
      drag.on = true;
      row.setPointerCapture(e.pointerId);
      row.classList.add('is-dragging');
      cancelAnimationFrame(anim);
    }
    const dt = Math.max(1, e.timeStamp - drag.lt);
    drag.v = (e.clientX - drag.lx) / dt;
    drag.lx = e.clientX; drag.lt = e.timeStamp;
    cur = Math.max(-.4, Math.min(slots.length - .6, drag.from - dx / spacing));
    target = Math.round(cur);
    layout();
  });
  const end = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.on) {
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 0);
      row.classList.remove('is-dragging');
      go(cur - drag.v * 160 / spacing);
    }
    drag = null;
  };
  row.addEventListener('pointerup', end);
  row.addEventListener('pointercancel', end);
  // a drag that ends over a button shouldn't also click it
  row.addEventListener('click', (e) => { if (justDragged) { e.stopPropagation(); e.preventDefault(); } }, true);

  addEventListener('resize', () => { measure(); layout(); });
  measure();
  layout();
  return { bring };
})();

const Room = (() => {
  const room = $('#room');
  if (!room) return { open: async () => {} };
  const field = (k) => $(`[data-room="${k}"]`, room);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let current = null, portal = null, busy = false;

  const fill = (id) => {
    const p = PROJECTS[id];
    field('kind').textContent = t(p.kind);
    field('host').textContent = p.host;
    field('img').src = p.img;
    field('img').alt = `${t('Home page of')} ${p.name}`;
    field('name').textContent = p.name;
    field('desc').textContent = t(p.desc);
    field('points').replaceChildren(...p.points.map((s) => Object.assign(document.createElement('li'), { textContent: t(s) })));
    field('tech').replaceChildren(...p.tech.map((s) => Object.assign(document.createElement('li'), { textContent: s })));
    field('url').href = p.url;
    $('span', field('url')).textContent = t(p.cta || 'Visit the live site');
    field('code').href = p.code;
  };

  // the doorway's (or the booth window's) box on screen, and the full screen, as keyframes
  const frames = (door) => {
    const win = $('.booth__window', door);
    const r = (win || $('.door__frame', door)).getBoundingClientRect();
    const radius = win ? '6px' : `${r.width / 2}px ${r.width / 2}px 2px 2px`;
    return [
      { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: radius, filter: 'brightness(.6)' },
      { left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px`, borderRadius: '0px', filter: 'brightness(1)' },
    ];
  };

  const open = async (door) => {
    if (busy) return;
    busy = true;
    current = door;
    fill(door.dataset.project);
    door.classList.add('is-open');
    if (!reduceMotion && Element.prototype.animate) {
      await wait(420);
      const f = frames(door);
      portal = document.createElement('div');
      portal.className = 'portal';
      portal.style.backgroundImage = `url("${PROJECTS[door.dataset.project].img}")`;
      Object.assign(portal.style, f[0]);
      document.body.append(portal);
      await portal.animate(f, { duration: 850, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished;
    }
    document.documentElement.classList.add('room-open');
    room.showModal();
    room.scrollTop = 0;
    $('.room__back', room).focus({ preventScroll: true });
    busy = false;
  };

  const close = async () => {
    if (busy || !room.open) return;
    busy = true;
    room.classList.add('is-closing');
    await wait(reduceMotion ? 0 : 280);
    room.close();
    room.classList.remove('is-closing');
    document.documentElement.classList.remove('room-open');
    if (portal) {
      await portal.animate(frames(current).reverse(), { duration: 700, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished;
      portal.remove();
      portal = null;
    }
    current.classList.remove('is-open');
    current.focus({ preventScroll: true });
    busy = false;
  };

  const rattle = (door) => {
    door.classList.remove('is-rattling');
    void door.offsetWidth;
    door.classList.add('is-rattling');
    toast(t('This door is still locked. A new project is being built behind it.'));
  };

  $$('.door').forEach((door) => door.addEventListener('click', () => (door.dataset.project ? Hall.bring(door).then(() => open(door)) : rattle(door))));
  $('.room__back', room).addEventListener('click', close);
  room.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  document.addEventListener('langchange', () => { if (room.open && current) fill(current.dataset.project); });
  return { open };
})();

/* ---------- Mascots: click one and it does its trick, says hi, then opens its door ---------- */
(() => {
  // Frame numbers refer to the sprite sheets in assets/mascots (rendered from each project's own drawing code).
  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const CAST = {
    mewy: { blink: 1, trick: [2, 3, 2, 2, 3, 2], fps: 6, end: 2, line: 'Mew! Press start.' },
    ping: { blink: 1, trick: range(16, 27), fps: 12, end: 0, line: "Hi, I'm Ping. Pick a game, any game." },
    shift: { blink: 1, trick: [...range(3, 10), ...range(3, 10), 2, 2, 2, 2], fps: 12, end: 2, line: 'Ready? Type fast.' },
    reelo: { blink: 1, trick: [2, 2, 2, 2, 2, 2, 2, 2, 2], fps: 10, end: 2, line: 'Roll it!' },
    raccoon: { line: "Draw badly. I'll judge." },
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const mascots = $$('.mascot');
  if (!mascots.length) return;
  const frame = (el, f) => { const s = $('.mascot__sprite', el); if (s) s.style.setProperty('--f', f); };
  let busy = false, inView = false;

  const play = (el, c) => new Promise((done) => {
    if (!c.trick || reduceMotion) { if (c.end != null) frame(el, c.end); done(); return; }
    let i = 0;
    const id = setInterval(() => {
      frame(el, c.trick[i++]);
      if (i >= c.trick.length) { clearInterval(id); done(); }
    }, 1000 / c.fps);
  });

  const greet = async (el) => {
    if (busy) return;
    busy = true;
    const c = CAST[el.dataset.mascot], door = $('.door', el.closest('.slot'));
    await Hall.bring(el);
    $('.bubble', el).textContent = t(c.line);
    el.classList.add('is-trick', 'is-talking');
    await Promise.all([play(el, c), wait(1400)]);
    el.classList.remove('is-trick');
    await Room.open(door);
    el.classList.remove('is-talking');
    frame(el, 0);
    busy = false;
  };
  mascots.forEach((el) => el.addEventListener('click', () => greet(el)));

  // now and then someone blinks (only while the hall is on screen)
  if (!reduceMotion) {
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }).observe($('.hall'));
    const blink = () => {
      const pick = mascots.filter((m) => CAST[m.dataset.mascot].blink != null && !m.classList.contains('is-trick'));
      const m = pick[Math.floor(Math.random() * pick.length)];
      if (inView && m && !busy) { frame(m, CAST[m.dataset.mascot].blink); setTimeout(() => frame(m, 0), 140); }
      setTimeout(blink, 1200 + Math.random() * 2600);
    };
    setTimeout(blink, 1500);
  }
})();

/* ---------- Easter egg: click the logo 5 times quickly for a meteor shower ---------- */
(() => {
  const logo = $('.brand');
  let clicks = 0, timer;
  const shower = () => {
    const colors = ['var(--accent)', 'var(--accent-2)', 'var(--brass-hi)', 'rgb(var(--star))', 'rgb(var(--star-warm))'];
    for (let i = 0; i < 28; i++) {
      const m = document.createElement('span');
      m.className = 'meteor';
      m.style.left = `${Math.random() * 110 - 5}vw`;
      m.style.top = `${Math.random() * 40 - 20}vh`;
      m.style.setProperty('--c', colors[i % colors.length]);
      m.style.animationDelay = `${Math.random() * 1.2}s`;
      m.style.animationDuration = `${.9 + Math.random() * .8}s`;
      document.body.append(m);
      m.addEventListener('animationend', () => m.remove());
    }
    toast(t('You found the meteor shower! Make a wish.'));
  };
  logo.addEventListener('click', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { clicks = 0; }, 1500);
    if (++clicks === 5) { clicks = 0; if (!reduceMotion) shower(); else toast(t('You found the meteor shower! Make a wish.')); }
  });
})();
