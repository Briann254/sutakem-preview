/* Sutakem Solutions · site behaviour. No dependencies. */
(() => {
  'use strict';

  const WA_NUMBER = '254790444921';
  const EMAIL = 'sutakemsolutions@gmail.com';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const waLink = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ---------- boot: full sequence once per session ---------- */
  const boot = $('#boot');
  let seen = false;
  try { seen = sessionStorage.getItem('sut-boot') === '1'; sessionStorage.setItem('sut-boot', '1'); } catch (e) { /* storage blocked */ }
  if (seen || reduced) {
    document.documentElement.classList.add('quick');
    boot.classList.add('skip');
  }
  setTimeout(() => boot.remove(), 2200);

  /* ---------- header, progress bar, floating CTA ---------- */
  const header = $('.site-header');
  const progress = $('#progress');
  const fab = $('.wa-fab');
  const hero = $('#hero');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 20);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    fab.classList.toggle('show', y > hero.offsetHeight * 0.7);
    statementTick();
    stepsTick();
  };

  /* ---------- mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const navLinks = $('#navLinks');
  const setMenu = open => {
    menuBtn.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
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
  const clocks = $$('[data-clock]');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tickClock = () => { const t = fmt.format(new Date()) + ' EAT'; clocks.forEach(c => (c.textContent = t)); };
  tickClock(); setInterval(tickClock, 1000);

  /* ---------- hero: tracking reticle + feed tilt ---------- */
  const reticle = $('#reticle');
  const read = $('#reticleRead');
  const nvr = $('.nvr');
  $('.feed-main').insertAdjacentHTML('beforeend', '<span class="scan" aria-hidden="true"></span>');
  if (matchMedia('(hover: hover)').matches && !reduced) {
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

  /* ---------- reveal on scroll, staggered within a parent ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
    revealIO.observe(el);
  });

  // one-shot "in" for the printing receipt and the SSD race
  const onceIO = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); onceIO.unobserve(e.target); } });
  }, { threshold: 0.35 });
  ['#receiptZone', '#race'].forEach(s => onceIO.observe($(s)));

  /* ---------- service channels: tap to open on touch ---------- */
  $$('.ch').forEach(ch => {
    ch.addEventListener('click', () => {
      const on = !ch.classList.contains('on');
      $$('.ch').forEach(c => c.classList.remove('on'));
      ch.classList.toggle('on', on);
    });
  });

  /* ---------- workbench tabs ---------- */
  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
    $$('.tab-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tab.dataset.tab));
  }));

  /* ---------- statement: words light up as you scroll ---------- */
  const stText = $('#statementText');
  const goldWords = new Set(['Reliable', 'Professional', 'tailored', 'never', 'sleeps.']);
  stText.innerHTML = stText.textContent.trim().split(/\s+/)
    .map(w => `<span class="w${goldWords.has(w) ? ' gold' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', stText);
  function statementTick() {
    const r = stText.getBoundingClientRect();
    const p = clamp((innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35), 0, 1);
    const lit = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('lit', i < lit));
  }

  /* ---------- process line fills with scroll ---------- */
  const steps = $('#steps');
  function stepsTick() {
    const r = steps.getBoundingClientRect();
    steps.style.setProperty('--p', clamp((innerHeight * 0.75 - r.top) / (r.height + 120), 0, 1).toFixed(3));
  }

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
  const MAX_CAMS = 24;
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
    // TODO(human): decide Sutakem's sizing rule. This default picks the smallest
    // standard size that fits, with no spare channels for adding cameras later.
    if (cameraCount === 0) return null;
    const sizes = [4, 8, 16, 32];
    const channels = sizes.find(s => s >= cameraCount) ?? 32;
    return { channels, label: `${channels}-channel NVR` };
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
  const closeLb = () => { lb.hidden = true; lastFocus?.focus(); };
  $$('.proof-item').forEach(b => b.addEventListener('click', () => {
    lastFocus = b;
    const img = $('img', b);
    lbImg.src = b.dataset.full; lbImg.alt = img.alt;
    lb.hidden = false; $('#lbClose').focus();
  }));
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!lb.hidden) closeLb(); setMenu(false); } });

  $('#year').textContent = new Date().getFullYear();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();
})();
