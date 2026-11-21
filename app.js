/* Sutakem Solutions · site behaviour.
   One animation loop drives everything scroll-linked, so the page keeps
   moving in both directions instead of animating once and going still. */
(() => {
  'use strict';

  const WA_NUMBER = '254790444921';
  const EMAIL = 'sutakemsolutions@gmail.com';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const waLink = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const FACTS = window.SUTAKEM_FACTS || {};

  /* ---------- boot: full sequence once per session ---------- */
  const boot = $('#boot');
  let seen = false;
  try { seen = sessionStorage.getItem('sut-boot') === '1'; sessionStorage.setItem('sut-boot', '1'); } catch (e) { /* storage blocked */ }
  if (seen || reduced) { document.documentElement.classList.add('quick'); boot.classList.add('skip'); }
  setTimeout(() => boot.remove(), 2200);

  /* ---------- smooth scroll (Lenis), with plain-scroll fallback ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
  }
  const header = $('.site-header');
  const headerH = () => header.offsetHeight;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' || id === '#' ? document.body : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target === document.body ? 0 : target, { offset: -headerH() - 8, duration: 1.4 });
    else (target === document.body ? scrollTo({ top: 0 }) : target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }));
  });

  /* ---------- mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $$('a', navLinks).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- active nav link ---------- */
  const navMap = new Map($$('.nav-links a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a]));
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navMap.forEach(a => a.classList.remove('active'));
      navMap.get(e.target.id)?.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) navIO.observe(s); });

  /* ---------- live clock, Nairobi time ---------- */
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tickClock = () => { const t = fmt.format(new Date()) + ' EAT'; $$('[data-clock]').forEach(c => (c.textContent = t)); };
  tickClock(); setInterval(tickClock, 1000);

  /* ---------- facts.js: real proof, rendered only when present ---------- */
  /**
   * Decide which four items the proof band under the hero shows.
   * `defaults` are true today (read from the client's own install photos);
   * `facts` are the client's confirmed numbers (null until he sends them).
   * Return up to 4 items: { value: string, count?: number, label: string }.
   */
  function buildProofItems(facts, defaults) {
    // TODO(human): choose how confirmed numbers replace the photo-based defaults.
    // Current behaviour: confirmed numbers first, then defaults, capped at four.
    const real = [];
    if (facts.yearsInBusiness) real.push({ value: `${facts.yearsInBusiness}+`, count: facts.yearsInBusiness, label: 'years installing security across Kenya' });
    if (facts.sitesInstalled) real.push({ value: `${facts.sitesInstalled}+`, count: facts.sitesInstalled, label: 'homes, offices, schools and shops secured' });
    if (facts.camerasInstalled) real.push({ value: `${facts.camerasInstalled}+`, count: facts.camerasInstalled, label: 'cameras installed and supported' });
    return [...real, ...defaults].slice(0, 4);
  }

  const band = $('#proofBand');
  const defaults = $$('.pb', band).map(pb => {
    const b = $('b', pb);
    return { value: b.textContent, count: b.dataset.count ? +b.dataset.count : undefined, label: $('span', pb).textContent };
  });
  const items = buildProofItems(FACTS, defaults);
  band.innerHTML = items.map(it => `<div class="pb reveal"><b class="mono"${it.count ? ` data-count="${it.count}" data-suffix="${String(it.value).replace(/^[\d,]+/, '')}"` : ''}>${it.value}</b><span>${it.label}</span></div>`).join('');

  if (FACTS.testimonials?.length || FACTS.clients?.length) {
    const voices = $('#voices');
    voices.hidden = false;
    $('#voiceGrid').innerHTML = (FACTS.testimonials || []).map(t => {
      const q = document.createElement('div'); q.textContent = t.quote;
      const n = document.createElement('div'); n.textContent = t.name;
      const r = document.createElement('div'); r.textContent = t.role || '';
      return `<figure class="voice reveal"><blockquote>“${q.innerHTML}”</blockquote><figcaption><b>${n.innerHTML}</b><span>${r.innerHTML}</span></figcaption></figure>`;
    }).join('');
    if (FACTS.clients?.length) {
      $('#clients').hidden = false;
      const row = FACTS.clients.map(c => { const s = document.createElement('span'); s.textContent = c; return s.outerHTML + '<i>✦</i>'; }).join('');
      $('#clientsTrack').innerHTML = row + row;
    }
  }
  if (FACTS.brands?.length) {
    const p = document.createElement('p');
    p.className = 'brands mono reveal';
    p.textContent = 'BRANDS WE INSTALL · ' + FACTS.brands.join(' · ').toUpperCase();
    $('.channels').after(p);
  }
  const promises = [FACTS.responseTime, FACTS.warranty, ...(FACTS.compliance || [])].filter(Boolean);
  if (promises.length) {
    const g = $('#guarantees');
    g.hidden = false;
    g.innerHTML = '<p class="mono t-label">In writing</p><ul></ul>';
    promises.forEach(t => { const li = document.createElement('li'); li.textContent = t; $('ul', g).append(li); });
  }
  const foot = [FACTS.location, FACTS.hours].filter(Boolean).join(' · ');
  if (foot) $('#footFacts').textContent = ' · ' + foot.toUpperCase();

  /* ---------- split section headings into words for a masked rise ---------- */
  $$('.head h2, .foot-cta h2').forEach(h2 => {
    let i = 0;
    const wrapWords = (text, em) => text.split(/(\s+)/).map(part => {
      if (!part.trim()) return part;
      const inner = em ? `<em>${part}</em>` : part;
      return `<span class="wd"><i style="--i:${i++}">${inner}</i></span>`;
    }).join('');
    h2.innerHTML = [...h2.childNodes].map(n => n.nodeType === 3 ? wrapWords(n.textContent, false) : wrapWords(n.textContent, true)).join('');
  });

  /* ---------- statement words ---------- */
  const stText = $('#statementText');
  const goldWords = new Set(['survey', 'quote.', 'test', 'same', 'team']);
  stText.innerHTML = stText.textContent.trim().split(/\s+/)
    .map(w => `<span class="w${goldWords.has(w) ? ' gold' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', stText);

  /* ---------- reveals that replay: on when entering, reset when the element drops below the fold ---------- */
  const countUp = el => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduced) { el.textContent = target + suffix; return; }
    const t0 = performance.now(), dur = 1400;
    const step = now => {
      const p = clamp((now - t0) / dur, 0, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1 && el.isConnected) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        $$('[data-count]', e.target).forEach(countUp);
      } else if (e.boundingClientRect.top > 0) {
        e.target.classList.remove('in');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
    revealIO.observe(el);
  });
  const replayIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add('in');
      else if (e.boundingClientRect.top > 0) e.target.classList.remove('in');
    });
  }, { threshold: 0.35 });
  ['#receiptZone', '#race'].forEach(s => replayIO.observe($(s)));

  /* ---------- hero feeds keep cutting between cameras, like a real NVR ---------- */
  const POOL = [
    { src: 'hero-feed.jpg', cap: 'CAM 01 · PERIMETER', alt: 'Dome CCTV camera with live views on a laptop and phone' },
    { src: 'access.jpg', cap: 'CAM 02 · ACCESS', alt: 'Fingerprint access control reader at an office door' },
    { src: 'network.jpg', cap: 'CAM 03 · SERVER ROOM', alt: 'Network switch with neatly patched cables' },
    { src: 'cctv.jpg', cap: 'CAM 04 · FRONT WALL', alt: 'Twin outdoor cameras on a house wall' },
    { src: 'site-school.jpg', cap: 'CAM 05 · CAMPUS WALL', alt: 'Sixteen-camera wall covering a school campus' },
    { src: 'etims.jpg', cap: 'CAM 06 · TILL', alt: 'ETR and eTIMS devices at a till' },
    { src: 'site-office.jpg', cap: 'CAM 07 · RECEPTION', alt: 'Office CCTV monitor showing reception' }
  ];
  POOL.forEach(p => { const i = new Image(); i.src = `assets/img/${p.src}`; });
  const feeds = $$('[data-feed]').map(f => ({ el: f, img: $('img', f), cap: $('figcaption', f), cur: +f.dataset.feed }));
  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe($('#hero'));
  let cutTurn = 0;
  if (!reduced) setInterval(() => {
    if (!heroVisible || document.hidden) return;
    const order = [1, 2, 1, 2, 0];
    const f = feeds[order[cutTurn++ % order.length]];
    const used = new Set(feeds.map(x => x.cur));
    let next = (f.cur + 1) % POOL.length;
    while (used.has(next)) next = (next + 1) % POOL.length;
    f.el.classList.add('cut');
    setTimeout(() => {
      const p = POOL[next];
      f.img.src = `assets/img/${p.src}`; f.img.alt = p.alt; f.cap.textContent = p.cap; f.cur = next;
    }, 160);
    setTimeout(() => f.el.classList.remove('cut'), 480);
  }, 2600);

  /* ---------- hero: tracking reticle + feed tilt ---------- */
  const hero = $('#hero');
  const reticle = $('#reticle');
  const read = $('#reticleRead');
  const nvr = $('.nvr');
  $('.feed-main').insertAdjacentHTML('beforeend', '<span class="scan" aria-hidden="true"></span>');
  if (canHover && !reduced) {
    let raf = 0, px = 0, py = 0;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        reticle.style.transform = `translate(${px}px, ${py}px)`;
        read.textContent = `TRK ${String(Math.round(px)).padStart(3, '0')}·${String(Math.round(py)).padStart(3, '0')}`;
        const dx = px / r.width - 0.5, dy = py / r.height - 0.5;
        nvr.style.setProperty('--ry', `${-8 + dx * 10}deg`);
        nvr.style.setProperty('--rx', `${4 - dy * 8}deg`);
      });
    });
    hero.addEventListener('pointerleave', () => { nvr.style.setProperty('--ry', '-8deg'); nvr.style.setProperty('--rx', '4deg'); });
  }

  /* ---------- cursor light on panels, tilt on channels, magnetic CTAs ---------- */
  if (canHover && !reduced) {
    $$('.panel, .planner-panel, .planner-stage, .survey-form, .contact-tile, .sector-grid li, .voice').forEach(el => {
      el.insertAdjacentHTML('afterbegin', '<span class="glow" aria-hidden="true"></span>');
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
    $$('.ch').forEach(ch => {
      ch.addEventListener('pointermove', e => {
        const r = ch.getBoundingClientRect();
        const dx = (e.clientX - r.left) / r.width - 0.5, dy = (e.clientY - r.top) / r.height - 0.5;
        ch.style.setProperty('--ty', `${(dx * 7).toFixed(2)}deg`);
        ch.style.setProperty('--tx', `${(-dy * 7).toFixed(2)}deg`);
      });
    });
    $$('.btn-gold, .wa-fab').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.22}px ${(e.clientY - r.top - r.height / 2) * 0.32}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  }

  /* ---------- service channels: tap to open on touch ---------- */
  $$('.ch').forEach(ch => ch.addEventListener('click', () => {
    const on = !ch.classList.contains('on');
    $$('.ch').forEach(c => c.classList.remove('on'));
    ch.classList.toggle('on', on);
  }));

  /* ---------- workbench tabs ---------- */
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
    $$('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
  }));

  /* ==========================================================================
     THE LOOP: everything tied to scroll position or scroll speed
     ========================================================================== */
  const progress = $('#progress');
  const fab = $('.wa-fab');
  const heroCopy = $('.hero-copy');
  const swirl = $('.hero-swirl');
  const ticker = $('.ticker-track');
  const steps = $$('.step');
  const story = $('.story');
  const svMedia = $$('.sv-media');
  const svStep = $('#svStep');
  const svBar = $('#svBar');

  // parallax: only elements currently on screen are measured each frame
  const para = new Set();
  const paraIO = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? para.add(e.target) : para.delete(e.target))), { rootMargin: '10% 0px' });
  $$('.proof-item img, .ch img, .sv-frame').forEach(el => { el.dataset.parallax ||= el.classList.contains('sv-frame') ? '0.06' : '0.12'; paraIO.observe(el); });

  let tickX = 0, skew = 0, lastY = scrollY, activeStep = -1, tickHalf = 0;
  const measureTicker = () => { tickHalf = ticker.scrollWidth / 2; };
  measureTicker(); addEventListener('resize', measureTicker);

  function frame(time) {
    lenis?.raf(time);
    const y = scrollY, vh = innerHeight;
    const vel = lenis ? lenis.velocity : y - lastY;
    lastY = y;

    header.classList.toggle('scrolled', y > 20);
    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    fab.classList.toggle('show', y > hero.offsetHeight * 0.7);

    if (!reduced) {
      // ticker: always drifting, speeds up and leans with scroll velocity, reverses with direction
      const dir = vel < -0.2 ? -1 : 1;
      tickX -= (0.55 + Math.min(Math.abs(vel), 60) * 0.35) * dir;
      if (tickHalf) { if (tickX <= -tickHalf) tickX += tickHalf; if (tickX > 0) tickX -= tickHalf; }
      skew = lerp(skew, clamp(vel * -0.35, -10, 10), 0.12);
      ticker.style.transform = `translate3d(${tickX}px,0,0) skewX(${skew.toFixed(2)}deg)`;

      // hero drifts up and fades as you leave it; swirl turns with scroll
      if (y < vh * 1.2) {
        heroCopy.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        heroCopy.style.opacity = String(clamp(1 - y / (vh * 0.85), 0, 1));
        nvr.parentElement.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
      }
      swirl.style.rotate = `${time * 0.006 + y * 0.08}deg`;

      para.forEach(el => {
        const box = el.parentElement.getBoundingClientRect();
        const p = (box.top + box.height / 2 - vh / 2) / vh;
        el.style.setProperty('--py', `${(-p * +el.dataset.parallax * box.height).toFixed(1)}px`);
      });
    }

    // statement words light up with scroll
    const sr = stText.getBoundingClientRect();
    if (sr.top < vh && sr.bottom > 0) {
      const lit = Math.round(clamp((vh * 0.85 - sr.top) / (sr.height + vh * 0.35), 0, 1) * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }

    // pinned process story: the step nearest the middle of the screen drives the viewer
    const str = story.getBoundingClientRect();
    if (str.top < vh && str.bottom > 0) {
      let best = 0, bestD = Infinity;
      steps.forEach((s, i) => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - vh / 2);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best !== activeStep) {
        activeStep = best;
        steps.forEach((s, i) => s.classList.toggle('active', i === best));
        svMedia.forEach((m, i) => m.classList.toggle('on', i === best));
        svStep.textContent = String(best + 1).padStart(2, '0');
      }
      svBar.style.transform = `scaleX(${clamp((vh / 2 - str.top) / str.height, 0, 1).toFixed(3)})`;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ==========================================================================
     COVERAGE PLANNER
     Plan space is 100 × 64 units. Walls block a camera's view, so the
     coverage number and the red blind-spot dots are honest about rooms.
     ========================================================================== */
  const SITES = {
    home: {
      label: 'Home',
      walls: [[40, 4, 40, 18], [40, 24, 40, 40], [4, 40, 16, 40], [24, 40, 40, 40], [40, 24, 48, 24], [56, 24, 66, 24],
        [66, 4, 66, 10], [66, 16, 66, 40], [66, 46, 66, 60], [66, 30, 74, 30], [82, 30, 96, 30]],
      labels: [['Living', 22, 22], ['Kitchen', 53, 14], ['Bed 1', 81, 17], ['Bed 2', 81, 45], ['Dining', 53, 42], ['Compound · Gate', 22, 51]],
      auto: [[6, 6], [94, 6], [6, 58], [94, 58], [53, 58]]
    },
    office: {
      label: 'Office',
      walls: [[4, 40, 12, 40], [20, 40, 60, 40], [60, 4, 60, 12], [60, 20, 60, 52], [60, 28, 70, 28], [78, 28, 96, 28],
        [76, 28, 76, 36], [76, 42, 76, 60], [60, 44, 66, 44], [72, 44, 76, 44], [34, 40, 34, 50]],
      labels: [['Open plan', 32, 22], ['Boardroom', 78, 16], ['Server', 68, 36], ['Manager', 86, 45], ['Reception', 19, 51], ['Lobby', 47, 51]],
      auto: [[6, 6], [58, 6], [94, 6], [6, 58], [58, 58], [94, 58]]
    },
    school: {
      label: 'School',
      walls: [[4, 26, 10, 26], [16, 26, 34, 26], [40, 26, 58, 26], [64, 26, 82, 26], [88, 26, 96, 26],
        [28, 4, 28, 26], [52, 4, 52, 26], [76, 4, 76, 26], [4, 34, 12, 34], [18, 34, 30, 34], [30, 34, 30, 60]],
      labels: [['Class 1', 16, 15], ['Class 2', 40, 15], ['Class 3', 64, 15], ['Lab', 86, 15], ['Corridor', 50, 30.6], ['Admin', 17, 47], ['Grounds', 63, 47]],
      auto: [[6, 6], [30, 6], [54, 6], [94, 6], [6, 30], [94, 30], [32, 58], [94, 58]]
    },
    shop: {
      label: 'Shop',
      walls: [[70, 4, 70, 14], [70, 20, 70, 60], [70, 36, 78, 36], [84, 36, 96, 36], [4, 44, 22, 44], [30, 44, 30, 52]],
      shelves: [[14, 12, 40, 3], [14, 22, 40, 3], [14, 32, 40, 3]],
      labels: [['Shop floor', 34, 8], ['Till', 16, 53], ['Entrance', 50, 56.5], ['Store', 83, 20], ['Office', 83, 48]],
      door: [44, 60, 56, 60],
      auto: [[6, 6], [68, 6], [6, 42], [68, 42], [94, 6], [94, 58]]
    }
  };
  const OUT = { x0: 4, y0: 4, x1: 96, y1: 60 };
  const RANGE = 30;               // how far one camera usefully sees, in plan units
  const HALF_FOV = Math.PI / 4;   // 90° lens
  const STEP = 1.6;               // coverage sample spacing
  const MAX_CAMS = 40;
  const NS = 'http://www.w3.org/2000/svg';

  const plan = $('#plan');
  const gRooms = $('#planRooms'), gCones = $('#planCones'), gCams = $('#planCams');
  const hint = $('#planHint');
  const planWrap = $('.plan-wrap');
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  planWrap.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let siteKey = 'home';
  let cams = [];
  let coverage = 0;

  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };

  function drawSite() {
    const s = SITES[siteKey];
    gRooms.replaceChildren();
    gRooms.append(el('rect', { class: 'room', x: OUT.x0, y: OUT.y0, width: OUT.x1 - OUT.x0, height: OUT.y1 - OUT.y0 }));
    (s.shelves || []).forEach(([x, y, w, h]) => gRooms.append(el('rect', { x, y, width: w, height: h, rx: .4, fill: 'rgba(236,241,255,.10)', stroke: 'rgba(236,241,255,.3)', 'stroke-width': .2 })));
    s.walls.forEach(([x1, y1, x2, y2]) => gRooms.append(el('line', { class: 'wall', x1, y1, x2, y2 })));
    gRooms.append(el('rect', { class: 'outer', x: OUT.x0, y: OUT.y0, width: OUT.x1 - OUT.x0, height: OUT.y1 - OUT.y0 }));
    if (s.door) {
      const [x1, y1, x2, y2] = s.door;
      gRooms.append(el('line', { x1, y1, x2, y2, stroke: '#071029', 'stroke-width': 1.4 }));
      gRooms.append(el('line', { class: 'door', x1, y1, x2, y2 }));
    }
    s.labels.forEach(([t, x, y]) => { const n = el('text', { class: 'label', x, y, 'text-anchor': 'middle' }); n.textContent = t; gRooms.append(n); });
    $('#roSite').textContent = s.label;
  }

  // does segment p→q cross segment a→b?
  function crosses(px, py, qx, qy, ax, ay, bx, by) {
    const d = (qx - px) * (by - ay) - (qy - py) * (bx - ax);
    if (d === 0) return false;
    const t = ((ax - px) * (by - ay) - (ay - py) * (bx - ax)) / d;
    const u = ((ax - px) * (qy - py) - (ay - py) * (qx - px)) / d;
    return t > 0.0001 && t < 0.9999 && u >= 0 && u <= 1;
  }

  function sees(cam, x, y, walls) {
    const dx = x - cam.x, dy = y - cam.y;
    const dist = Math.hypot(dx, dy);
    if (dist > RANGE) return false;
    if (dist > 0.5) {
      let a = Math.atan2(dy, dx) - cam.a;
      a = Math.atan2(Math.sin(a), Math.cos(a));
      if (Math.abs(a) > HALF_FOV) return false;
    }
    for (const w of walls) if (crosses(cam.x, cam.y, x, y, w[0], w[1], w[2], w[3])) return false;
    return true;
  }

  function render() {
    const walls = SITES[siteKey].walls;
    // canvas size follows the element
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(rect.width * dpr)) { canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); }
    const sx = canvas.width / 100, sy = canvas.height / 64;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let total = 0, covered = 0;
    for (let y = OUT.y0 + STEP / 2; y < OUT.y1; y += STEP) {
      for (let x = OUT.x0 + STEP / 2; x < OUT.x1; x += STEP) {
        total++;
        const hit = cams.some(c => sees(c, x, y, walls));
        if (hit) {
          covered++;
          ctx.fillStyle = 'rgba(232,181,58,.30)';
          ctx.fillRect((x - STEP / 2) * sx + .5, (y - STEP / 2) * sy + .5, STEP * sx - 1, STEP * sy - 1);
        } else if (cams.length) {
          ctx.fillStyle = 'rgba(255,59,59,.38)';
          ctx.beginPath(); ctx.arc(x * sx, y * sy, Math.max(1, .22 * sx), 0, 7); ctx.fill();
        }
      }
    }
    coverage = total ? Math.round((covered / total) * 100) : 0;

    // cones (direction only) and camera pins
    gCones.replaceChildren(); gCams.replaceChildren();
    cams.forEach((c, i) => {
      const a1 = c.a - HALF_FOV, a2 = c.a + HALF_FOV;
      const d = `M${c.x} ${c.y} L${c.x + RANGE * Math.cos(a1)} ${c.y + RANGE * Math.sin(a1)} A${RANGE} ${RANGE} 0 0 1 ${c.x + RANGE * Math.cos(a2)} ${c.y + RANGE * Math.sin(a2)}Z`;
      gCones.append(el('path', { class: 'cone', d }));
      const g = el('g', { class: 'cam', 'data-i': i });
      g.append(el('circle', { class: 'halo', cx: c.x, cy: c.y, r: 1.6 }));
      g.append(el('line', { x1: c.x, y1: c.y, x2: c.x + 3.4 * Math.cos(c.a), y2: c.y + 3.4 * Math.sin(c.a), stroke: '#F5CE6B', 'stroke-width': .5, 'stroke-linecap': 'round' }));
      g.append(el('circle', { class: 'body', cx: c.x, cy: c.y, r: 1.6 }));
      const t = el('text', { x: c.x, y: c.y + .05 }); t.textContent = i + 1; g.append(t);
      gCams.append(g);
    });
    updateReadout();
  }

  function updateReadout() {
    const n = cams.length;
    $('#covPct').textContent = coverage;
    $('#roCams').textContent = n;
    const rec = recommendRecorder(n);
    $('#roRec').textContent = rec ? rec.label : '–';
    $('#gFill').style.strokeDashoffset = String(314.16 * (1 - coverage / 100));
    $('#gFill').style.stroke = coverage >= 85 ? '#3BE38A' : coverage >= 60 ? '#E8B53A' : '#FF7A45';
    $('#roNote').textContent = !n ? 'Place your first camera on the plan.'
      : rec?.custom ? 'Big site. We design systems this size on a free survey. Book it on WhatsApp below.'
      : coverage < 60 ? 'Big blind spots (red). Try entrances, corners and corridors.'
      : coverage < 85 ? 'Good start. A site survey usually finds the last blind spots.'
      : 'Strong coverage. Let us confirm it on site.';
    const send = $('#sendPlan');
    if (n) {
      send.href = waLink(planSummary(true));
      send.target = '_blank'; send.rel = 'noopener';
    } else {
      send.href = '#survey'; send.removeAttribute('target');
    }
    survey.setPlan(n ? planSummary(false) : '');
  }

  function planSummary(full) {
    const rec = recommendRecorder(cams.length);
    const core = `${SITES[siteKey].label}: ${cams.length} camera${cams.length === 1 ? '' : 's'}, ${coverage}% coverage${rec ? `, ${rec.label}` : ''}`;
    return full ? `Hello Sutakem, I used your coverage planner.\n\n${core}.\n\nI'd like a free site survey to confirm it.` : core;
  }

  /**
   * Pick a recorder (NVR/DVR) size for the number of cameras on the plan.
   * Returns null for zero cameras, else { channels, label }.
   */
  function recommendRecorder(cameraCount) {
    // Sutakem rule: always leave at least 2 spare channels for future cameras.
    // If no standard recorder can do that (31+ cameras), it's a custom design job.
    const SPARE = 2;
    if (cameraCount === 0) return null;
    const channels = [4, 8, 16, 32].find(size => size - cameraCount >= SPARE);
    if (!channels) return { channels: null, custom: true, label: 'Custom system' };
    return { channels, label: `${channels}-channel NVR · ${channels - cameraCount} spare` };
  }

  // pointer: tap empty space to place, drag to aim, tap a camera to remove, drag a camera to re-aim
  const toPlan = e => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(plan.getScreenCTM().inverse());
    return { x: clamp(p.x, OUT.x0 + .8, OUT.x1 - .8), y: clamp(p.y, OUT.y0 + .8, OUT.y1 - .8) };
  };
  let drag = null;
  let pending = 0;
  const schedule = () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; render(); }); };

  plan.addEventListener('pointerdown', e => {
    e.preventDefault();
    const p = toPlan(e);
    const hitI = cams.findIndex(c => Math.hypot(c.x - p.x, c.y - p.y) < 2.6);
    if (hitI >= 0) {
      drag = { i: hitI, moved: false, existing: true };
    } else {
      if (cams.length >= MAX_CAMS) return;
      const cx = (OUT.x0 + OUT.x1) / 2, cy = (OUT.y0 + OUT.y1) / 2;
      cams.push({ x: p.x, y: p.y, a: Math.atan2(cy - p.y, cx - p.x) });
      drag = { i: cams.length - 1, moved: false, existing: false };
      hint.style.opacity = '0';
      render();
    }
    plan.setPointerCapture(e.pointerId);
  });
  plan.addEventListener('pointermove', e => {
    if (!drag) return;
    const c = cams[drag.i];
    const raw = new DOMPoint(e.clientX, e.clientY).matrixTransform(plan.getScreenCTM().inverse());
    if (Math.hypot(raw.x - c.x, raw.y - c.y) > 2) {
      drag.moved = true;
      c.a = Math.atan2(raw.y - c.y, raw.x - c.x);
      schedule();
    }
  });
  const endDrag = () => {
    if (drag && drag.existing && !drag.moved) { cams.splice(drag.i, 1); render(); }
    drag = null;
  };
  plan.addEventListener('pointerup', endDrag);
  plan.addEventListener('pointercancel', () => { drag = null; });

  $$('.site-tab').forEach(btn => btn.addEventListener('click', () => {
    $$('.site-tab').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', String(b === btn)); });
    siteKey = btn.dataset.site; cams = []; hint.style.opacity = '1';
    drawSite(); render();
  }));
  $('#clearPlan').addEventListener('click', () => { cams = []; hint.style.opacity = '1'; render(); });
  $('#autoPlace').addEventListener('click', () => {
    const cx = (OUT.x0 + OUT.x1) / 2, cy = (OUT.y0 + OUT.y1) / 2;
    cams = SITES[siteKey].auto.map(([x, y]) => ({ x, y, a: Math.atan2(cy - y, cx - x) }));
    hint.style.opacity = '0';
    render();
  });
  new ResizeObserver(() => render()).observe(planWrap);

  /* ==========================================================================
     SURVEY WORK ORDER
     ========================================================================== */
  const survey = (() => {
    const chosen = new Set();
    const list = $('#ticketList');
    const planLabel = $('#ticketPlanLabel'), planEl = $('#ticketPlan');
    const d = new Date();
    const ref = `SUT-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    $('#ticketRef').textContent = ref;
    let planText = '';
    const val = id => $(id).value.trim();

    function message() {
      const lines = ['Hello Sutakem Solutions,', '', `I'd like to book a free site survey (ref ${ref}).`];
      if (chosen.size) lines.push('', 'Services:', ...[...chosen].map(s => `- ${s}`));
      if (planText) lines.push('', `Coverage plan: ${planText}`);
      const details = [['Name', val('#fName')], ['Phone', val('#fPhone')], ['Location', val('#fLoc')], ['Site', val('#fMsg')]].filter(([, v]) => v);
      if (details.length) lines.push('', ...details.map(([k, v]) => `${k}: ${v}`));
      lines.push('', 'Thank you.');
      return lines.join('\n');
    }
    function sync() {
      list.replaceChildren();
      if (!chosen.size) list.innerHTML = '<li class="empty">No services selected yet.</li>';
      chosen.forEach(s => { const li = document.createElement('li'); li.textContent = s; list.append(li); });
      planLabel.hidden = planEl.hidden = !planText;
      planEl.textContent = planText;
      const msg = message();
      $('#sendWa').href = waLink(msg);
      $('#sendMail').href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Free site survey request ${ref}`)}&body=${encodeURIComponent(msg)}`;
    }
    function toggle(chip, force) {
      const v = chip.dataset.val;
      const on = force ?? !chosen.has(v);
      on ? chosen.add(v) : chosen.delete(v);
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', String(on));
      sync();
    }
    $$('.chip').forEach(c => { c.setAttribute('aria-pressed', 'false'); c.addEventListener('click', () => toggle(c)); });
    ['#fName', '#fPhone', '#fLoc', '#fMsg'].forEach(id => $(id).addEventListener('input', sync));
    $$('[data-preselect]').forEach(a => a.addEventListener('click', () => {
      const chip = $$('.chip').find(c => c.dataset.val === a.dataset.preselect);
      if (chip) toggle(chip, true);
    }));
    sync();
    return {
      setPlan(text) {
        planText = text;
        if (text) { const cctv = $$('.chip').find(c => c.dataset.val === 'CCTV surveillance'); if (cctv && !chosen.has('CCTV surveillance')) toggle(cctv, true); }
        sync();
      }
    };
  })();

  drawSite();
  render();

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  let lastFocus = null;
  const closeLb = () => { lb.hidden = true; lenis?.start(); lastFocus?.focus(); };
  $$('.proof-item').forEach(b => b.addEventListener('click', () => {
    lastFocus = b;
    const img = $('img', b);
    lbImg.src = b.dataset.full; lbImg.alt = img.alt;
    lb.hidden = false; lenis?.stop(); $('#lbClose').focus();
  }));
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!lb.hidden) closeLb(); setMenu(false); } });

  $('#year').textContent = new Date().getFullYear();
})();
