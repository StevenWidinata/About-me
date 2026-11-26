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
      'Thirteen games, from a full-physics slingshot game to Chess, Sudoku and Brick Breaker',
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
};

(() => {
  const room = $('#room');
  if (!room) return;
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
    field('code').href = p.code;
  };

  // the door frame's box on screen, and the full screen, as keyframes
  const frames = (door) => {
    const r = $('.door__frame', door).getBoundingClientRect();
    return [
      { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: `${r.width / 2}px ${r.width / 2}px 2px 2px`, filter: 'brightness(.6)' },
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

  $$('.door').forEach((door) => door.addEventListener('click', () => (door.dataset.project ? open(door) : rattle(door))));
  $('.room__back', room).addEventListener('click', close);
  room.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  document.addEventListener('langchange', () => { if (room.open && current) fill(current.dataset.project); });
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

/* ---------- Door row on phones: hide the swipe hint once used, drop the edge fade at the end ---------- */
(() => {
  const hall = $('.hall'), row = $('.hall__row');
  if (!hall || !row) return;
  row.addEventListener('scroll', () => {
    hall.classList.add('is-scrolled');
    hall.classList.toggle('is-end', row.scrollLeft + row.clientWidth >= row.scrollWidth - 8);
  }, { passive: true });
})();
