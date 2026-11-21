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
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const waLink = text => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const FACTS = window.SUTAKEM_FACTS || {};

  /* ---------- smooth scroll (Lenis), with plain-scroll fallback ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
  const header = $('.site-header');
  const goTo = target => {
    const top = target === 'top';
    if (lenis) lenis.scrollTo(top ? 0 : target, { offset: -header.offsetHeight - 8, duration: 1.4 });
    else top ? scrollTo({ top: 0 }) : target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' || id === '#' ? 'top' : document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    goTo(target);
  });

  /* ---------- full-screen menu (phones/tablets) ---------- */
  const menuBtn = $('#menuBtn');
  const sheet = $('#menuSheet');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    sheet.setAttribute('aria-hidden', String(!open));
    document.documentElement.classList.toggle('menu-open', open);
    if (lenis) open ? lenis.stop() : lenis.start();
  }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));

  /* ---------- floating nav: gold pill follows hover and the section in view ---------- */
  const island = $('.island');
  const pill = $('.island-pill');
  const links = $$('a', island);
  let activeLink = null;
  const movePill = a => {
    if (!a) { pill.style.opacity = '0'; return; }
    pill.style.opacity = '1';
    pill.style.width = `${a.offsetWidth}px`;
    pill.style.transform = `translateX(${a.offsetLeft}px)`;
  };
  links.forEach(a => a.addEventListener('pointerenter', () => movePill(a)));
  island.addEventListener('pointerleave', () => movePill(activeLink));
  const navIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      const a = links.find(l => l.getAttribute('href') === `#${e.target.id}`);
      if (e.isIntersecting) activeLink = a;
      else if (activeLink === a) activeLink = null;
      links.forEach(l => l.classList.toggle('active', l === activeLink));
      if (!island.matches(':hover')) movePill(activeLink);
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  links.forEach(a => { const s = document.querySelector(a.getAttribute('href')); if (s) navIO.observe(s); });

  /* ---------- live clock, Nairobi time ---------- */
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tickClock = () => { const t = fmt.format(new Date()) + ' EAT'; $$('[data-clock]').forEach(c => (c.textContent = t)); };
  tickClock(); setInterval(tickClock, 1000);

  /* ==========================================================================
     FACTS: real proof from facts.js, shown only when present
     ========================================================================== */
  // Sutakem rule: 24/7 support always shows; confirmed numbers replace the photo-based ones.
  function buildProofItems(facts, defaults) {
    const always = defaults.find(d => d.value === '24/7');
    const photo = defaults.filter(d => d !== always);
    const real = [];
    if (facts.yearsInBusiness) real.push({ value: `${facts.yearsInBusiness}+`, count: facts.yearsInBusiness, label: 'years installing security across Kenya' });
    if (facts.sitesInstalled) real.push({ value: `${facts.sitesInstalled}+`, count: facts.sitesInstalled, label: 'homes, offices, schools and shops secured' });
    if (facts.camerasInstalled) real.push({ value: `${facts.camerasInstalled}+`, count: facts.camerasInstalled, label: 'cameras installed and supported' });
    return [...real, ...photo].slice(0, 3).concat(always ? [always] : []);
  }
  const band = $('#proofBand');
  const defaults = $$('.pb', band).map(pb => {
    const b = $('b', pb);
    return { value: b.textContent, count: b.dataset.count ? +b.dataset.count : undefined, label: $('span', pb).textContent };
  });
  band.innerHTML = buildProofItems(FACTS, defaults).map(it =>
    `<div class="pb reveal"><b class="mono"${it.count ? ` data-count="${it.count}" data-suffix="${esc(String(it.value).replace(/^[\d,]+/, ''))}"` : ''}>${esc(it.value)}</b><span>${esc(it.label)}</span></div>`).join('');

  if (FACTS.testimonials?.length || FACTS.clients?.length) {
    $('#voices').hidden = false;
    $('#voiceGrid').innerHTML = (FACTS.testimonials || []).map(t =>
      `<figure class="voice reveal"><blockquote>“${esc(t.quote)}”</blockquote><figcaption><b>${esc(t.name)}</b><span>${esc(t.role || '')}</span></figcaption></figure>`).join('');
    if (FACTS.clients?.length) {
      $('#clients').hidden = false;
      const row = FACTS.clients.map(c => `<span>${esc(c)}</span><i>✦</i>`).join('');
      $('#clientsTrack').innerHTML = row + row;
    }
  }
  if (FACTS.brands?.length) {
    const p = document.createElement('p');
    p.className = 'brands mono reveal';
    p.textContent = 'BRANDS WE INSTALL · ' + FACTS.brands.join(' · ').toUpperCase();
    $('.layers-box').after(p);
  }
  const promises = [FACTS.responseTime, FACTS.warranty, ...(FACTS.compliance || [])].filter(Boolean);
  if (promises.length) {
    const g = $('#guarantees');
    g.hidden = false;
    g.innerHTML = '<p class="mono t-label">In writing</p><ul>' + promises.map(t => `<li>${esc(t)}</li>`).join('') + '</ul>';
  }
  const foot = [FACTS.location, FACTS.hours].filter(Boolean).join(' · ');
  if (foot) $('#footFacts').textContent = ' · ' + foot.toUpperCase();

  /* ---------- split section headings into words for a masked rise ---------- */
  $$('.head h2, .foot-cta h2').forEach(h2 => {
    let i = 0;
    const wrapWords = (text, em) => text.split(/(\s+)/).map(part => {
      if (!part.trim()) return part;
      return `<span class="wd"><i style="--i:${i++}">${em ? `<em>${part}</em>` : part}</i></span>`;
    }).join('');
    h2.innerHTML = [...h2.childNodes].map(n => wrapWords(n.textContent, n.nodeType !== 3)).join('');
  });

  /* ---------- statement words ---------- */
  const stText = $('#statementText');
  const goldWords = new Set(['install', 'answer', 'Day', 'night.']);
  stText.innerHTML = stText.textContent.trim().split(/\s+/)
    .map(w => `<span class="w${goldWords.has(w) ? ' gold' : ''}">${w}</span>`).join(' ');
  const words = $$('.w', stText);

  /* ---------- reveals that replay when you scroll back down to them ---------- */
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
      if (e.isIntersecting) { e.target.classList.add('in'); $$('[data-count]', e.target).forEach(countUp); }
      else if (e.boundingClientRect.top > 0) e.target.classList.remove('in');
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
  replayIO.observe($('#receiptZone'));

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
  const hero = $('#hero');
  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
  let cutTurn = 0;
  if (!reduced) setInterval(() => {
    if (!heroVisible || document.hidden) return;
    const f = feeds[[1, 2, 1, 2, 0][cutTurn++ % 5]];
    const used = new Set(feeds.map(x => x.cur));
    let next = (f.cur + 1) % POOL.length;
    while (used.has(next)) next = (next + 1) % POOL.length;
    f.el.classList.add('cut');
    setTimeout(() => { const p = POOL[next]; f.img.src = `assets/img/${p.src}`; f.img.alt = p.alt; f.cap.textContent = p.cap; f.cur = next; }, 160);
    setTimeout(() => f.el.classList.remove('cut'), 480);
  }, 2600);

  const nvr = $('.nvr');

  /* ==========================================================================
     LAYERS OF PROTECTION
     ========================================================================== */
  const LAYERS = [
    { key: 'Perimeter', img: 'cctv.jpg', title: 'Stop problems at the fence.',
      why: 'Your first line of defence: a fence that deters, and an alarm that tells you the moment someone tries.',
      items: ['Electric fence installation', 'Alarm systems', 'Perimeter cameras on walls and gates'] },
    { key: 'Entry', img: 'access.jpg', title: 'Decide who gets in.',
      why: 'Fingerprint, card or code at the door, an intercom at the gate, and a record of who came in and when.',
      items: ['Access control systems', 'Intercom systems', 'Biometric time & attendance for staff'] },
    { key: 'Watch', img: 'site-office.jpg', title: 'See everything, from anywhere.',
      why: 'HD and IP cameras recording around the clock, and you can watch them live from your phone.',
      items: ['HD & IP CCTV installation', '24/7 recording', 'Remote viewing on your phone'] },
    { key: 'Connect', img: 'network.jpg', title: 'A network that just works.',
      why: 'Cameras, door readers and your office all run on the network. We cable it neatly and set up WiFi that reaches every room.',
      items: ['Structured cabling', 'WiFi installation & optimisation', 'Router & switch configuration', 'Office & home networking'] },
    { key: 'Business', img: 'etims.jpg', title: 'Keep the business running.',
      why: 'Compliant receipts on every sale, computers that work, and an office desk for the everyday jobs.',
      items: ['eTIMS & ETR repair, installation and ERP integration', 'Laptop repairs and RAM, SSD & OS upgrades', 'Windows, MS Office & antivirus', 'Printing, card design, KRA & eCitizen services'] }
  ];
  LAYERS.forEach(l => { const i = new Image(); i.src = `assets/img/${l.img}`; });
  const detail = $('#layerDetail');
  const tabs = $$('#layerTabs button');
  const rings = $$('.ring');
  const timerBar = $('#layerTimer');
  const LAYER_MS = 6000;
  let layer = -1, layerAuto = !reduced, layerStart = performance.now(), layersVisible = false;

  function showLayer(i) {
    if (i === layer) return;
    layer = i;
    const L = LAYERS[i];
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; t.classList.toggle('on', k === i); });
    rings.forEach((r, k) => { r.classList.toggle('on', k === i); r.classList.toggle('past', k < i); });
    detail.classList.remove('swap'); void detail.offsetWidth; detail.classList.add('swap');
    detail.innerHTML = `
      <div class="ld-img"><img src="assets/img/${L.img}" alt=""><span class="mono">LAYER ${String(i + 1).padStart(2, '0')} · ${L.key.toUpperCase()}</span></div>
      <div class="ld-body">
        <h3>${L.title}</h3>
        <p>${L.why}</p>
        <ul>${L.items.map(x => `<li>${x}</li>`).join('')}</ul>
        <a class="btn btn-line btn-sm" href="${waLink(`Hello Sutakem, I'd like to ask about ${L.key.toLowerCase()} security (${L.items[0]}).`)}" target="_blank" rel="noopener">Ask about this on WhatsApp</a>
      </div>`;
    layerStart = performance.now();
  }
  const pick = i => { layerAuto = false; timerBar.style.transform = 'scaleX(0)'; showLayer(i); };
  tabs.forEach((t, i) => t.addEventListener('click', () => pick(i)));
  rings.forEach(r => r.addEventListener('click', () => pick(+r.dataset.layer)));
  $('#layerTabs').addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    const n = (layer + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + LAYERS.length) % LAYERS.length;
    pick(n); tabs[n].focus();
  });
  new IntersectionObserver(([e]) => { layersVisible = e.isIntersecting; if (layersVisible) layerStart = performance.now(); }, { threshold: 0.3 }).observe($('.layers-box'));
  showLayer(0);

  /* ==========================================================================
     FIND YOUR SETUP (3 questions, plain-language result, no fake numbers)
     ========================================================================== */
  const SIZES = { small: 'Small', medium: 'Medium', large: 'Large' };
  const WORRIES = { breakins: 'Break-ins and theft', visitors: 'Who comes and goes', away: 'Seeing the place when away', staff: 'Staff attendance', wifi: 'Slow internet', etims: 'eTIMS compliance', computers: 'Failing computers' };
  const RECS = {
    fence: { name: 'Electric fence', chip: 'Electric fence', why: 'Stops intruders at the boundary, before they reach the building.' },
    alarm: { name: 'Alarm system', chip: 'Alarm system', why: 'Alerts you the moment a door or window is forced.' },
    access: { name: 'Access control at the main door', chip: 'Access control', why: 'Only the right people get in, with a record of when.' },
    intercom: { name: 'Intercom at the gate', chip: 'Intercom & biometrics', why: 'See and talk to visitors before you open.' },
    attendance: { name: 'Biometric time & attendance', chip: 'Intercom & biometrics', why: 'Staff clock in with a fingerprint, so timesheets are accurate.' },
    cctv: { name: 'CCTV with phone viewing', chip: 'CCTV cameras', why: 'Covers entrances and key areas, records 24/7, and you can watch from your phone.' },
    wifi: { name: 'WiFi and structured cabling', chip: 'Networking & WiFi', why: 'Reliable internet in every room, and the backbone cameras need.' },
    etims: { name: 'eTIMS & ETR setup', chip: 'ETR / eTIMS', why: 'Compliant receipts on every sale, connected to your accounts.' },
    it: { name: 'Computer repairs & upgrades', chip: 'Computer repairs & upgrades', why: 'Faster, dependable machines with SSD and RAM upgrades.' }
  };
  const ORDER = ['fence', 'alarm', 'access', 'intercom', 'attendance', 'cctv', 'wifi', 'etims', 'it'];

  /**
   * Turn the visitor's answers into a starting list of services.
   * place: 'home' | 'office' | 'school' | 'shop' | 'estate' | 'warehouse'
   * worries: Set of keys from WORRIES. size: 'small' | 'medium' | 'large'
   * Returns keys of RECS; they are shown in ORDER (outer layer first).
   */
  function recommendFor(place, worries, size) {
    // Sutakem rules: shops always get eTIMS (it's a legal requirement), and homes
    // with a compound (medium or large) always get an electric fence suggestion.
    const out = new Set();
    if (place === 'shop') out.add('etims');
    if (place === 'home' && size !== 'small') out.add('fence');
    const hasCompound = ['estate', 'warehouse', 'school'].includes(place) || (place === 'home' && size !== 'small');
    if (worries.has('breakins')) { if (hasCompound) out.add('fence'); out.add('alarm'); out.add('cctv'); }
    if (worries.has('visitors')) { out.add(hasCompound && place !== 'school' ? 'intercom' : 'access'); out.add('cctv'); }
    if (worries.has('away')) out.add('cctv');
    if (worries.has('staff')) out.add('attendance');
    if (worries.has('wifi')) out.add('wifi');
    if (worries.has('etims')) out.add('etims');
    if (worries.has('computers')) out.add('it');
    if (size === 'large' && out.has('cctv')) out.add('wifi');
    return [...out];
  }

  function visitChecks(place, size) {
    const byPlace = { home: 'Your gate, compound and doors', estate: 'Gates, common areas and parking', office: 'Reception, records and server rooms', school: 'Gates, classrooms, labs and the boundary', shop: 'Till, entrance and stock areas', warehouse: 'Loading bays, yard and boundary' };
    const list = [byPlace[place], 'Where the recorder and screen should live', 'Power and internet points'];
    if (size !== 'small') list.push('Cable routes between rooms and outside');
    if (size === 'large') list.push('Distances and links between buildings', 'Dark areas that need night vision');
    return list;
  }

  const wz = { step: 0, place: null, worries: new Set(), size: null };
  const wzSteps = $$('.wz-step');
  const wzNext = $('#wzNext'), wzBack = $('#wzBack');
  const answered = s => (s === 0 ? !!wz.place : s === 1 ? wz.worries.size > 0 : s === 2 ? !!wz.size : true);
  let autoTimer = 0;

  function wzGo(s) {
    clearTimeout(autoTimer);
    wz.step = s;
    wzSteps.forEach((el, i) => el.classList.toggle('active', i === s));
    $('#wzBar').style.transform = `scaleX(${s / 3})`;
    $('#wzCount').textContent = s < 3 ? `QUESTION ${s + 1} OF 3` : 'YOUR STARTING POINT';
    wzBack.disabled = s === 0;
    wzNext.disabled = !answered(s);
    wzNext.hidden = s === 3;
    wzNext.innerHTML = s === 2 ? 'See my setup <svg class="ic"><use href="#i-arrow"/></svg>' : 'Next <svg class="ic"><use href="#i-arrow"/></svg>';
    if (s === 3) wzResult();
  }
  function wzResult() {
    const keys = recommendFor(wz.place, wz.worries, wz.size);
    const recs = ORDER.filter(k => keys.includes(k)).map(k => RECS[k]);
    const placeName = wz.place;
    $('#wzTag').textContent = `${SIZES[wz.size].toUpperCase()} ${placeName.toUpperCase()} · ${wz.worries.size} CONCERN${wz.worries.size === 1 ? '' : 'S'}`;
    $('#wzTitle').textContent = recs.length ? `Where we would start for your ${placeName}` : 'Let us look at it together';
    $('#wzRecs').innerHTML = recs.length
      ? recs.map((r, i) => `<li style="--i:${i}"><b>${r.name}</b><span>${r.why}</span></li>`).join('')
      : '<li><b>A free site visit</b><span>Tell us what is going on and we will suggest the right setup on site.</span></li>';
    $('#wzChecks').innerHTML = visitChecks(wz.place, wz.size).map(c => `<li>${c}</li>`).join('');
    const worryText = [...wz.worries].map(w => WORRIES[w]).join(', ');
    const summary = `${SIZES[wz.size]} ${placeName} · concerns: ${worryText}${recs.length ? ` · suggested start: ${recs.map(r => r.name).join(', ')}` : ''}`;
    $('#wzSend').href = waLink(`Hello Sutakem, I used "Find your setup" on your website.\n\nPlace: ${SIZES[wz.size]} ${placeName}\nConcerns: ${worryText}\n${recs.length ? `Suggested start: ${recs.map(r => r.name).join(', ')}\n` : ''}\nI'd like a free site visit.`);
    $('#wzBook').onclick = () => { recs.forEach(r => survey.select(r.chip)); survey.setSetup(summary); };
    $('#wzBar').style.transform = 'scaleX(1)';
  }
  $$('.wz-options').forEach(group => {
    const q = group.dataset.q, many = group.dataset.mode === 'many';
    $$('button', group).forEach(b => {
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        const v = b.dataset.val;
        if (many) {
          wz.worries.has(v) ? wz.worries.delete(v) : wz.worries.add(v);
          b.classList.toggle('on', wz.worries.has(v));
          b.setAttribute('aria-pressed', String(wz.worries.has(v)));
          wzNext.disabled = !answered(wz.step);
        } else {
          wz[q] = v;
          $$('button', group).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
          wzNext.disabled = false;
          const from = wz.step;
          autoTimer = setTimeout(() => { if (wz.step === from) wzGo(from + 1); }, 300);
        }
      });
    });
  });
  wzNext.addEventListener('click', () => { if (answered(wz.step)) wzGo(wz.step + 1); });
  wzBack.addEventListener('click', () => wzGo(Math.max(0, wz.step - 1)));

  /* ==========================================================================
     SITE VISIT REQUEST
     ========================================================================== */
  const survey = (() => {
    const chosen = new Set();
    const list = $('#ticketList');
    const planLabel = $('#ticketPlanLabel'), planEl = $('#ticketPlan');
    const d = new Date();
    const ref = `SUT-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;
    $('#ticketRef').textContent = ref;
    let setupText = '';
    const val = id => $(id).value.trim();
    const chips = $$('.chip');

    function message() {
      const lines = ['Hello Sutakem Solutions,', '', `I'd like to book a free site visit (ref ${ref}).`];
      if (chosen.size) lines.push('', 'I need help with:', ...[...chosen].map(s => `- ${s}`));
      if (setupText) lines.push('', `From "Find your setup": ${setupText}`);
      const details = [['Name', val('#fName')], ['Phone', val('#fPhone')], ['Location', val('#fLoc')], ['Notes', val('#fMsg')]].filter(([, v]) => v);
      if (details.length) lines.push('', ...details.map(([k, v]) => `${k}: ${v}`));
      lines.push('', 'Thank you.');
      return lines.join('\n');
    }
    function sync() {
      list.innerHTML = chosen.size ? [...chosen].map(s => `<li>${esc(s)}</li>`).join('') : '<li class="empty">Nothing selected yet.</li>';
      planLabel.hidden = planEl.hidden = !setupText;
      planEl.textContent = setupText;
      const msg = message();
      $('#sendWa').href = waLink(msg);
      $('#sendMail').href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Free site visit request ${ref}`)}&body=${encodeURIComponent(msg)}`;
    }
    function toggle(chip, force) {
      const v = chip.dataset.val;
      const on = force ?? !chosen.has(v);
      on ? chosen.add(v) : chosen.delete(v);
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', String(on));
      sync();
    }
    chips.forEach(c => { c.setAttribute('aria-pressed', 'false'); c.addEventListener('click', () => toggle(c)); });
    ['#fName', '#fPhone', '#fLoc', '#fMsg'].forEach(id => $(id).addEventListener('input', sync));
    const select = v => { const c = chips.find(x => x.dataset.val === v); if (c) toggle(c, true); };
    $$('[data-preselect]').forEach(a => a.addEventListener('click', () => select(a.dataset.preselect)));
    sync();
    return { select, setSetup(text) { setupText = text; sync(); } };
  })();

  /* ==========================================================================
     THE LOOP: everything tied to scroll position, scroll speed or time
     ========================================================================== */
  const fab = $('.wa-fab');
  const heroCopy = $('.hero-copy');
  const swirl = $('.hero-swirl');
  const ticker = $('.ticker-track');
  const para = new Set();
  const paraIO = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? para.add(e.target) : para.delete(e.target))), { rootMargin: '10% 0px' });
  $$('.note-img img').forEach(el => paraIO.observe(el));

  let tickX = 0, skew = 0, lastY = scrollY, tickHalf = 0;
  const measure = () => { tickHalf = ticker.scrollWidth / 2; movePill(activeLink); };
  measure(); addEventListener('resize', measure);
  document.fonts?.ready.then(measure);

  function frame(time) {
    lenis?.raf(time);
    const y = scrollY, vh = innerHeight;
    const vel = lenis ? lenis.velocity : y - lastY;
    lastY = y;

    header.classList.toggle('scrolled', y > 20);
    fab.classList.toggle('show', y > hero.offsetHeight * 0.7);

    if (!reduced) {
      const dir = vel < -0.2 ? -1 : 1;
      tickX -= (0.55 + Math.min(Math.abs(vel), 60) * 0.35) * dir;
      if (tickHalf) { if (tickX <= -tickHalf) tickX += tickHalf; if (tickX > 0) tickX -= tickHalf; }
      skew = lerp(skew, clamp(vel * -0.35, -10, 10), 0.12);
      ticker.style.transform = `translate3d(${tickX}px,0,0) skewX(${skew.toFixed(2)}deg)`;

      if (y < vh * 1.2) {
        heroCopy.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        heroCopy.style.opacity = String(clamp(1 - y / (vh * 0.85), 0, 1));
        nvr.parentElement.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
      }
      swirl.style.rotate = `${time * 0.006 + y * 0.08}deg`;

      para.forEach(el => {
        const box = el.parentElement.getBoundingClientRect();
        const p = (box.top + box.height / 2 - vh / 2) / vh;
        el.style.setProperty('--py', `${(-p * 0.12 * box.height).toFixed(1)}px`);
      });

      // layers cycle on their own until someone picks one
      if (layerAuto && layersVisible && !document.hidden) {
        const p = (time - layerStart) / LAYER_MS;
        timerBar.style.transform = `scaleX(${clamp(p, 0, 1).toFixed(3)})`;
        if (p >= 1) showLayer((layer + 1) % LAYERS.length);
      }
    }

    const sr = stText.getBoundingClientRect();
    if (sr.top < vh && sr.bottom > 0) {
      const lit = Math.round(clamp((vh * 0.85 - sr.top) / (sr.height + vh * 0.35), 0, 1) * words.length);
      words.forEach((w, i) => w.classList.toggle('lit', i < lit));
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('#lbImg');
  let lastFocus = null;
  const closeLb = () => { lb.hidden = true; lenis?.start(); lastFocus?.focus(); };
  $$('.note-img').forEach(b => b.addEventListener('click', () => {
    lastFocus = b;
    lbImg.src = b.dataset.full; lbImg.alt = $('img', b).alt;
    lb.hidden = false; lenis?.stop(); $('#lbClose').focus();
  }));
  lb.addEventListener('click', e => { if (e.target !== lbImg) closeLb(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') { if (!lb.hidden) closeLb(); setMenu(false); } });

  $('#year').textContent = new Date().getFullYear();
})();
