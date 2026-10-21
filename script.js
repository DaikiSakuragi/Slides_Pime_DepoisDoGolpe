/* =====================================================================
   DEPOIS DO GOLPE — apresentação web
   Índice
     1. Referências do DOM e estado global
     2. Navegação (setas, teclado, botões)
     3. Slide 1 · Capa (silhuetas e vídeo)
     4. Transição 1 → 2 · Rachadura
     5. Transição 2 → 3 · Tiros
     6. Slide 3 · Carrossel
     7. Transição 3 → 4 · Sangue líquido
     8. Slide 4 · Roteiro (abas)
     9. Slide 5 · Direção de arte (caderno)
    10. Slide 6 · Fotografia (câmera e polaroid)
   ===================================================================== */


/* ============ 1. DOM E ESTADO GLOBAL ============ */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Marca o contêiner com `.is-empty` enquanto a foto colada no HTML não existir. */
function watchEmptyImage(img, holder) {
  const mark = () => holder.classList.toggle('is-empty', !img.naturalWidth);
  img.addEventListener('load', mark);
  img.addEventListener('error', mark);
  if (img.complete) mark();
}

const stage  = $('#stage');
const slide1 = $('#slide1');
const slide2 = $('#slide2');
const slide3 = $('#slide3');
const slide4 = $('#slide4');
const slide5 = $('#slide5');
const slide6 = $('#slide6');
const video  = $('#myVideo');

const LAST_SLIDE = 6;
const state = { slide: 1, busy: false };

/** Trava a navegação durante uma transição. */
function lock() {
  state.busy = true;
  syncNav();
}

/** Libera a navegação; se `slide` for passado, também registra o slide atual. */
function unlock(slide) {
  if (slide) state.slide = slide;
  state.busy = false;
  syncNav();
}

/** Alterna `.active-slide` entre dois slides com fade (3 a 6). */
function swapActive(from, to) {
  if (from) from.classList.remove('active-slide');
  if (to) to.classList.add('active-slide');
}


/* ============ 2. NAVEGAÇÃO ============ */
const slPrev = $('#slPrev');
const slNext = $('#slNext');

function syncNav() {
  if (slPrev) slPrev.disabled = state.busy || state.slide === 1;
  if (slNext) slNext.disabled = state.busy || state.slide === LAST_SLIDE;
}

function goNext() {
  if (state.busy) return;
  const actions = {
    1: crackToNext,
    2: shootToSlide3,
    3: () => (carousel.index < carousel.cards.length - 1 ? goToCard(carousel.index + 1) : bleedToSlide4()),
    4: toSlide5,
    5: toSlide6
  };
  const action = actions[state.slide];
  if (action) action();
}

function goPrev() {
  if (state.busy) return;
  const actions = {
    2: backToCover,
    3: () => (carousel.index > 0 ? goToCard(carousel.index - 1) : backFromSlide3()),
    4: backFromSlide4,
    5: backFromSlide5,
    6: backFromSlide6
  };
  const action = actions[state.slide];
  if (action) action();
}

window.addEventListener('keydown', e => {
  if (document.body.classList.contains('nb-lightbox-open')) return;
  const next = ['ArrowRight', 'PageDown', ' '].includes(e.key);
  const prev = ['ArrowLeft', 'PageUp'].includes(e.key);
  if (!next && !prev) return;
  e.preventDefault();
  if (next) goNext(); else goPrev();
});

if (slPrev) slPrev.addEventListener('click', e => { e.stopPropagation(); slPrev.blur(); goPrev(); });
if (slNext) slNext.addEventListener('click', e => { e.stopPropagation(); slNext.blur(); goNext(); });

syncNav();


/* ============ 3. SLIDE 1 · CAPA ============ */
document.addEventListener('click', () => {
  if (video && video.paused) video.play();
});

const JUAN_SRC = 'fotos/Juan_Glass.png';
const ERNESTO_SRC = 'fotos/Ernesto_Glass.png';

function placeSilhouette({ imgId, glassId, src, x, w, svgAlign, cssAlign, boxY, boxH }) {
  const img = document.getElementById(imgId);
  if (!img) return;

  img.setAttribute('x', x);
  img.setAttribute('y', boxY);
  img.setAttribute('width', w);
  img.setAttribute('height', boxH);
  img.setAttribute('preserveAspectRatio', svgAlign);

  const cx = x + w / 2;
  img.setAttribute('transform', `translate(${cx} 0) scale(-1 1) translate(${-cx} 0)`);

  const glass = document.getElementById(glassId);
  if (!glass) return;

  Object.assign(glass.style, {
    left: x + 'px',
    top: boxY + 'px',
    width: w + 'px',
    height: boxH + 'px',
    transform: 'scaleX(-1)',
    webkitMaskImage: `url("${src}")`,
    maskImage: `url("${src}")`,
    webkitMaskPosition: cssAlign,
    maskPosition: cssAlign
  });
}

function layoutSilhouettes() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const boxH = H * 1.10;
  const boxY = H * 0.05;
  const overlapLeft = 100;
  const overlapRight = 120;
  const ernestoX = W / 2 - overlapRight;

  placeSilhouette({
    imgId: 'imgJuan', glassId: 'glassJuan', src: JUAN_SRC,
    x: 0, w: W / 2 + overlapLeft,
    svgAlign: 'xMinYMax meet', cssAlign: 'left bottom', boxY, boxH
  });
  placeSilhouette({
    imgId: 'imgErnesto', glassId: 'glassErnesto', src: ERNESTO_SRC,
    x: ernestoX, w: W - ernestoX,
    svgAlign: 'xMaxYMax meet', cssAlign: 'right bottom', boxY, boxH
  });
}

layoutSilhouettes();
window.addEventListener('resize', layoutSilhouettes);


/* ============ 4. TRANSIÇÃO 1 → 2 · RACHADURA ============ */
const SVG_NS = 'http://www.w3.org/2000/svg';

function makeCrack() {
  const steps = 16;
  const pts = [];
  let x = 50;
  for (let i = 0; i <= steps; i++) {
    x += (Math.random() - 0.5) * 9;
    x = Math.max(42, Math.min(58, x));
    pts.push([x, (i / steps) * 100]);
  }
  return pts;
}

const fmt = n => n.toFixed(2);

function pointsToPath(pts) {
  return pts.map((p, i) => (i ? 'L' : 'M') + fmt(p[0]) + ' ' + fmt(p[1])).join(' ');
}

function makeBranches(pts) {
  return [3, 6, 9, 12, 14].map(idx => {
    const [bx, by] = pts[idx];
    const dir = Math.random() > 0.5 ? 1 : -1;
    const mid = [bx + dir * (2 + Math.random() * 3), by + 2 + Math.random() * 2];
    const end = [mid[0] + dir * (2 + Math.random() * 4), mid[1] + 1 + Math.random() * 3];
    return `M${fmt(bx)} ${fmt(by)} L${fmt(mid[0])} ${fmt(mid[1])} L${fmt(end[0])} ${fmt(end[1])}`;
  });
}

function svgPath(d, className) {
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  p.setAttribute('class', className);
  p.setAttribute('pathLength', '1');
  return p;
}

function clip(el, polygon) {
  el.style.clipPath = polygon;
  el.style.webkitClipPath = polygon;
}

function crackToNext() {
  if (state.busy || state.slide !== 1) return;
  lock();

  const pts = makeCrack();
  const edge = pts.map(p => `${fmt(p[0])}% ${fmt(p[1])}%`).join(', ');

  const clone = slide1.cloneNode(true);
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  clone.style.pointerEvents = 'none';
  stage.appendChild(clone);

  const cloneVideo = $('video', clone);
  if (cloneVideo && video) {
    cloneVideo.currentTime = video.currentTime;
    cloneVideo.play().catch(() => {});
  }

  slide1.classList.add('half', 'half-left');
  clone.classList.add('half', 'half-right');
  clip(slide1, `polygon(0% 0%, ${edge}, 0% 100%)`);
  clip(clone, `polygon(100% 0%, ${edge}, 100% 100%)`);
  clone.style.zIndex = 2;

  const crack = document.createElementNS(SVG_NS, 'svg');
  crack.setAttribute('id', 'crack');
  crack.setAttribute('viewBox', '0 0 100 100');
  crack.setAttribute('preserveAspectRatio', 'none');
  crack.appendChild(svgPath(pointsToPath(pts), 'main'));
  makeBranches(pts).forEach(d => crack.appendChild(svgPath(d, 'branch')));
  stage.appendChild(crack);

  stage.classList.add('shake');
  requestAnimationFrame(() => requestAnimationFrame(() => crack.classList.add('draw')));

  setTimeout(() => {
    crack.style.opacity = 0;
    slide1.classList.add('split');
    clone.classList.add('split');
    slide2.classList.add('show');
  }, 700);

  setTimeout(() => {
    stage.classList.remove('shake');
    clone.remove();
    crack.remove();
    slide1.style.display = 'none';
    unlock(2);
  }, 2000);
}

function backToCover() {
  if (state.busy || state.slide !== 2) return;
  lock();

  slide1.style.transition = 'opacity .8s ease';
  slide1.style.opacity = 0;
  slide1.style.display = '';
  slide1.classList.remove('half', 'half-left', 'split');
  clip(slide1, 'none');

  requestAnimationFrame(() => requestAnimationFrame(() => {
    slide1.style.opacity = 1;
    slide2.classList.remove('show');
  }));

  setTimeout(() => {
    slide1.style.transition = '';
    unlock(1);
  }, 850);
}


/* ============ 5. TRANSIÇÃO 2 → 3 · TIROS ============ */
let audioCtx;

/** Estampido sintetizado (ruído + grave). */
function bang() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const sr = audioCtx.sampleRate;

    const buf = audioCtx.createBuffer(1, sr * 0.4, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
    }

    const noise = audioCtx.createBufferSource();
    noise.buffer = buf;
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2200;
    noise.connect(lowpass).connect(audioCtx.destination);
    noise.start(t);

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.3);
  } catch (e) { /* áudio indisponível: segue sem som */ }
}

function addHole(xPercent, yPercent) {
  const hole = document.createElement('div');
  hole.className = 's3hole';
  hole.style.left = xPercent + '%';
  hole.style.top = yPercent + '%';

  let lines = '';
  const n = 9 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const angle = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const r = 18 + Math.random() * 30;
    const mx = Math.cos(angle) * r * 0.55, my = Math.sin(angle) * r * 0.55;
    const ex = Math.cos(angle) * r,        ey = Math.sin(angle) * r;
    lines += `<line x1="0" y1="0" x2="${mx}" y2="${my}" stroke="#fff" stroke-opacity=".85" stroke-width=".9" stroke-linecap="round"/>`;
    lines += `<line x1="${mx}" y1="${my}" x2="${ex}" y2="${ey}" stroke="#fff" stroke-opacity=".6" stroke-width=".6" stroke-linecap="round"/>`;
  }

  hole.innerHTML = `<svg viewBox="-50 -50 100 100">${lines}
    <circle r="6" fill="rgba(0,0,0,.65)" stroke="rgba(255,255,255,.55)" stroke-width=".8"/>
    <circle r="3" fill="#000"/></svg>`;

  slide2.appendChild(hole);
  hole.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 120 });
}

function fireShot(x, y) {
  bang();
  addHole(x, y);
  const k = 7 + Math.random() * 7;
  const rx = (Math.random() - 0.5) * 2 * k;
  const ry = (Math.random() - 0.5) * 2 * k;
  stage.animate([
    { transform: 'translate(0,0)' },
    { transform: `translate(${rx}px,${ry}px)` },
    { transform: 'translate(0,0)' }
  ], { duration: 170 });
}

/** Quebra o slide 2 em triângulos que caem a partir do ponto (cx, cy). */
function shatter(cx, cy) {
  const cols = 4, rows = 3;
  const grid = [];

  for (let r = 0; r <= rows; r++) {
    grid[r] = [];
    for (let c = 0; c <= cols; c++) {
      let x = (c / cols) * 100;
      let y = (r / rows) * 100;
      if (c > 0 && c < cols) x += (Math.random() - 0.5) * (100 / cols) * 0.7;
      if (r > 0 && r < rows) y += (Math.random() - 0.5) * (100 / rows) * 0.7;
      grid[r][c] = [x, y];
    }
  }

  const tris = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = grid[r][c], b = grid[r][c + 1], d = grid[r + 1][c], e = grid[r + 1][c + 1];
      if ((r + c) % 2) tris.push([a, b, d], [b, e, d]);
      else tris.push([a, b, e], [a, e, d]);
    }
  }

  const box = document.createElement('div');
  box.id = 's3shards';
  stage.appendChild(box);

  const shards = tris.map(t => {
    const gx = (t[0][0] + t[1][0] + t[2][0]) / 3;
    const gy = (t[0][1] + t[1][1] + t[2][1]) / 3;

    // O clone mantém as classes (.slide-members.show), então o visual se preserva.
    const el = slide2.cloneNode(true);
    el.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    el.removeAttribute('id');
    el.style.transition = 'none';
    el.style.visibility = 'visible';
    el.style.transformOrigin = `${gx}% ${gy}%`;
    clip(el, 'polygon(' + t.map(p => p[0] + '% ' + p[1] + '%').join(',') + ')');
    box.appendChild(el);

    return { el, gx, gy };
  });

  slide2.style.visibility = 'hidden';

  shards.forEach(({ el, gx, gy }) => {
    const dist = Math.hypot(gx - cx, gy - cy) / 100;
    const delay = dist * 450 + Math.random() * 120;
    const dx = (gx - cx) * 3 + (Math.random() - 0.5) * 120;
    const rot = (Math.random() - 0.5) * 140;

    el.animate([
      { transform: 'none' },
      { transform: `translate(${dx}px, 120vh) rotate(${rot}deg)` }
    ], { duration: 1300, delay, easing: 'cubic-bezier(.5,0,1,.55)', fill: 'forwards' });
  });
}

function shootToSlide3() {
  if (state.busy || state.slide !== 2) return;
  lock();

  // [atraso em ms, x%, y%]
  const shots = [[0, 28, 34], [520, 72, 26], [900, 40, 68], [1180, 80, 62], [1380, 18, 70], [1520, 50, 46]];
  const [lastDelay, lastX, lastY] = shots[shots.length - 1];
  const shatterAt = lastDelay + 260;

  shots.forEach(([t, x, y]) => setTimeout(() => fireShot(x, y), t));
  setTimeout(() => shatter(lastX, lastY), shatterAt);

  setTimeout(() => {
    $$('#s3shards').forEach(b => b.remove());
    $$('.s3hole', slide2).forEach(h => h.remove());
    slide2.classList.remove('show');

    swapActive(null, slide3);
    carousel.index = 0;
    updateCarousel();
    unlock(3);
  }, shatterAt + 1600);
}

function backFromSlide3() {
  if (state.busy || state.slide !== 3) return;
  lock();

  swapActive(slide3, null);
  slide2.style.visibility = '';
  slide2.classList.add('show');

  setTimeout(() => unlock(2), 800);
}


/* ============ 6. SLIDE 3 · CARROSSEL ============ */
const carousel = {
  track: $('#carouselTrack'),
  cards: $$('.carousel-card'),
  bars: $('#barsContainer'),
  index: 0
};

function buildCarouselBars() {
  if (!carousel.cards.length || !carousel.bars) return;
  carousel.bars.innerHTML = '';
  carousel.cards.forEach((_, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar-indicator' + (i === 0 ? ' active' : '');
    bar.addEventListener('click', () => goToCard(i));
    carousel.bars.appendChild(bar);
  });
}

function updateCarousel() {
  const { track, cards } = carousel;
  if (!cards.length || !track) return;

  const cardWidth = cards[0].offsetWidth + 30;
  track.style.transform = `translateX(${-carousel.index * cardWidth - cardWidth / 2}px)`;

  cards.forEach((card, i) => card.classList.toggle('active', i === carousel.index));
  $$('.bar-indicator').forEach((bar, i) => bar.classList.toggle('active', i === carousel.index));
}

function goToCard(i) {
  carousel.index = Math.max(0, Math.min(i, carousel.cards.length - 1));
  updateCarousel();
}

buildCarouselBars();
$('#prevBtn')?.addEventListener('click', () => goToCard(carousel.index - 1));
$('#nextBtn')?.addEventListener('click', () => goToCard(carousel.index + 1));
window.addEventListener('resize', updateCarousel);


/* ============ 7. TRANSIÇÃO 3 → 4 · SANGUE LÍQUIDO ============ */
function createLiquidFilter() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  Object.assign(svg.style, { position: 'fixed', width: '1px', height: '1px', left: '-10px', top: '-10px', overflow: 'hidden' });

  const filter = document.createElementNS(SVG_NS, 'filter');
  const noise = document.createElementNS(SVG_NS, 'feTurbulence');
  const displacement = document.createElementNS(SVG_NS, 'feDisplacementMap');

  const set = (el, attrs) => Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  set(filter, { id: 'liquidDistortion', x: '-20%', y: '-20%', width: '140%', height: '160%' });
  set(noise, { type: 'fractalNoise', baseFrequency: '0.008 0.025', numOctaves: '2', seed: '7', result: 'noise' });
  set(displacement, { in: 'SourceGraphic', in2: 'noise', scale: '0', xChannelSelector: 'R', yChannelSelector: 'G' });

  filter.append(noise, displacement);
  const defs = document.createElementNS(SVG_NS, 'defs');
  defs.appendChild(filter);
  svg.appendChild(defs);

  return { svg, displacement };
}

function bleedToSlide4() {
  if (state.busy || state.slide !== 3 || !slide4) return;
  lock();

  const duration = 1500;
  const start = performance.now();
  const rect = slide3.getBoundingClientRect();

  // Cópia do slide 3 (IDs mantidos: o CSS dos cards depende deles).
  const overlay = slide3.cloneNode(true);
  overlay.classList.add('liquid-transition-layer');
  overlay.setAttribute('aria-hidden', 'true');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    margin: '0',
    zIndex: '99999',
    pointerEvents: 'none'
  });

  const { svg, displacement } = createLiquidFilter();
  document.body.append(svg, overlay);

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = progress * progress * (3 - 2 * progress);

    displacement.setAttribute('scale', String(Math.round(eased * 85)));
    overlay.style.transform = `translateY(${eased * 12}vh) scaleY(${1 + eased * 0.12})`;

    if (progress < 1) {
      requestAnimationFrame(frame);
      return;
    }

    swapActive(slide3, slide4);
    overlay.remove();
    svg.remove();
    unlock(4);
  }

  requestAnimationFrame(frame);
}

function backFromSlide4() {
  if (state.busy || state.slide !== 4) return;
  lock();
  swapActive(slide4, slide3);
  setTimeout(() => unlock(3), 500);
}


/* ============ 8. SLIDE 4 · ROTEIRO ============ */
const scriptTabs = $$('.script-tab');
const scriptPanels = $$('.script-panel');

function activateScriptTab(tab) {
  scriptTabs.forEach(t => {
    const on = t === tab;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
  });
  scriptPanels.forEach(panel => {
    const on = panel.id === `panel-${tab.dataset.panel}`;
    panel.hidden = !on;
    panel.classList.toggle('active', on);
  });
}
scriptTabs.forEach(tab => tab.addEventListener('click', () => activateScriptTab(tab)));


/* ============ 9. SLIDE 5 · DIREÇÃO DE ARTE ============ */
const notebook = {
  tabs: $$('.nb-tab'),
  paper: $('.nb-paper'),
  current: 'ambientacao',
  busy: false,
  audio: $('#nbAudio'),
  cassette: $('.nb-cassette'),
  now: $('#nbNow')
};

// Espiral: anéis metálicos
(function buildSpiral() {
  const spiral = $('#nbSpiral');
  if (!spiral) return;
  for (let i = 0; i < 14; i++) {
    const ring = document.createElement('div');
    ring.className = 'nb-ring';
    spiral.appendChild(ring);
  }
})();

function pauseMusic() {
  if (notebook.audio) notebook.audio.pause();
}

/* --- Virada de página ---
   A folha da direita da aba atual é copiada e gira 180° em volta da espiral.
   Embaixo dela já está a aba nova, então nada escurece nem pisca: no fim,
   o verso da folha é idêntico à página esquerda da aba nova. */
const prefersFlat = () => window.matchMedia('(max-width: 760px), (prefers-reduced-motion: reduce)').matches;

function makeLeafFace(page, extraClass) {
  const face = page.cloneNode(true);
  face.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  if (extraClass) face.classList.add(extraClass);
  return face;
}

function finishFlip(name) {
  notebook.current = name;
  notebook.busy = false;
}

function openNotebookTab(name) {
  if (notebook.busy || name === notebook.current) return;
  const current = document.getElementById('spread-' + notebook.current);
  const next = document.getElementById('spread-' + name);
  if (!current || !next) return;
  notebook.busy = true;

  notebook.tabs.forEach(t => {
    const on = t.dataset.spread === name;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
  });
  if (notebook.current === 'musica') pauseMusic();

  // Telas estreitas ou movimento reduzido: troca com fade
  if (prefersFlat()) {
    current.hidden = true;
    next.hidden = false;
    next.classList.add('fade-in');
    setTimeout(() => { next.classList.remove('fade-in'); finishFlip(name); }, 360);
    return;
  }

  const curRight = $('.nb-right', current);
  const nextLeft = $('.nb-left', next);

  next.classList.add('under');
  next.hidden = false;

  const leaf = document.createElement('div');
  leaf.className = 'nb-leaf';
  leaf.setAttribute('aria-hidden', 'true');
  leaf.append(makeLeafFace(curRight), makeLeafFace(nextLeft, 'nb-leaf-back'));
  notebook.paper.appendChild(leaf);
  curRight.style.visibility = 'hidden';

  const flip = leaf.animate(
    [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }],
    { duration: 900, easing: 'cubic-bezier(.45,0,.25,1)', fill: 'forwards' }
  );
  flip.onfinish = () => {
    next.classList.remove('under');
    current.hidden = true;
    curRight.style.visibility = '';
    leaf.remove();
    finishFlip(name);
  };
}
notebook.tabs.forEach(t => t.addEventListener('click', () => openNotebookTab(t.dataset.spread)));

/* --- Fotos coladas no HTML --- */
$$('.nb-frame img, .nb-mini img').forEach(img => watchEmptyImage(img, img.closest('.nb-frame, .nb-mini')));

/* --- Tela cheia: foto única ou carrossel --- */
const lightbox = {
  el: $('#nbLightbox'),
  img: $('#nbLbImg'),
  caption: $('#nbLbCaption'),
  count: $('#nbLbCount'),
  slides: [],
  index: 0,
  opener: null,
  onClose: null
};

const isLightboxOpen = () => document.body.classList.contains('nb-lightbox-open');

function showLightboxSlide(i) {
  const total = lightbox.slides.length;
  lightbox.index = (i + total) % total;
  const slide = lightbox.slides[lightbox.index];
  lightbox.img.src = slide.src;
  lightbox.img.alt = slide.alt;
  lightbox.caption.textContent = slide.alt;
  lightbox.count.textContent = `${lightbox.index + 1} / ${total}`;
}

/**
 * Abre a tela cheia. Sem `custom`, lê as fotos do próprio frame (.nb-gallery).
 * Com `custom` = { slides, index, onClose }, usa a lista fornecida (slide 6).
 */
function openLightbox(frame, custom) {
  const cover = $('img', frame);
  if (!cover || !cover.naturalWidth) return; // espaço ainda sem foto

  let startIndex = 0;
  if (custom) {
    lightbox.slides = custom.slides.map(({ src, alt }) => ({ src, alt }));
    lightbox.onClose = custom.onClose || null;
    startIndex = custom.index || 0;
  } else {
    const photos = frame.dataset.lightbox === 'gallery'
      ? [cover, ...$$('.nb-gallery img', frame)]
      : [cover];
    lightbox.slides = photos.map(p => ({ src: p.currentSrc || p.src, alt: p.alt }));
    lightbox.onClose = null;
  }
  lightbox.opener = frame;

  lightbox.el.classList.toggle('single', lightbox.slides.length < 2);
  showLightboxSlide(startIndex);
  lightbox.el.hidden = false;
  document.body.classList.add('nb-lightbox-open');
  $('.nb-lb-close', lightbox.el).focus();
}

function closeLightbox() {
  const { index, onClose } = lightbox;
  lightbox.el.hidden = true;
  lightbox.onClose = null;
  document.body.classList.remove('nb-lightbox-open');
  if (lightbox.opener) lightbox.opener.focus();
  if (onClose) onClose(index);
}

$$('.nb-frame[data-lightbox]').forEach(frame => {
  frame.addEventListener('click', () => openLightbox(frame));
  frame.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation(); // não deixa a barra de espaço avançar o slide
    openLightbox(frame);
  });
});

$('.nb-lb-close', lightbox.el).addEventListener('click', closeLightbox);
$('.nb-lb-prev', lightbox.el).addEventListener('click', () => showLightboxSlide(lightbox.index - 1));
$('.nb-lb-next', lightbox.el).addEventListener('click', () => showLightboxSlide(lightbox.index + 1));
lightbox.el.addEventListener('click', e => {
  // foto única: qualquer clique fecha; carrossel: só o fundo (as setas continuam funcionando)
  const single = lightbox.el.classList.contains('single');
  if (e.target === lightbox.el || (single && !e.target.closest('.nb-lb-nav'))) closeLightbox();
});

window.addEventListener('keydown', e => {
  if (!isLightboxOpen()) return;
  if (e.key === 'Escape') closeLightbox();
  else if (e.key === 'ArrowRight' && lightbox.slides.length > 1) showLightboxSlide(lightbox.index + 1);
  else if (e.key === 'ArrowLeft' && lightbox.slides.length > 1) showLightboxSlide(lightbox.index - 1);
});

/* --- Protótipo de música --- */
if (notebook.audio) {
  const setPlaying = on => notebook.cassette.classList.toggle('playing', on);
  notebook.audio.addEventListener('play', () => setPlaying(true));
  notebook.audio.addEventListener('pause', () => setPlaying(false));
  notebook.audio.addEventListener('ended', () => setPlaying(false));
  notebook.audio.addEventListener('error', () => {
    setPlaying(false);
    notebook.now.textContent = 'Adicione o arquivo: ' + notebook.audio.getAttribute('src');
  });
}

/* --- Transição 4 ↔ 5 (fade) --- */
function toSlide5() {
  if (state.busy || state.slide !== 4 || !slide5) return;
  lock();
  swapActive(slide4, slide5);
  setTimeout(() => unlock(5), 650);
}

function backFromSlide5() {
  if (state.busy || state.slide !== 5) return;
  lock();
  pauseMusic();
  swapActive(slide5, slide4);
  setTimeout(() => unlock(4), 650);
}

/* ============ 10. SLIDE 6 · FOTOGRAFIA (CÂMERA) ============ */
const photo = {
  tabs: $$('.ph-tab'),
  wrap: $('.ph-print-wrap'),
  print: $('#phPrint'),
  img: $('#phImg'),
  label: $('#phLabel'),
  caption: $('#phCaption'),
  flash: $('.ph-flash'),
  prev: $('.ph-prev'),
  next: $('.ph-next'),
  current: null, // aba selecionada
  slides: [],    // fotos da aba atual: { src, alt }
  index: 0,      // foto atual dentro da aba
  timer: null
};

/** Zumbido curto de motor de impressão. */
function printSound() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const lowpass = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(70, t);
    osc.frequency.linearRampToValueAtTime(120, t + 0.35);
    osc.frequency.linearRampToValueAtTime(80, t + 0.9);
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 380;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + 0.95);
    osc.connect(lowpass).connect(gain).connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + 1);
  } catch (e) { /* sem áudio: segue sem som */ }
}

/** Lê, do HTML, as fotos da galeria ligada à aba (data-gallery). */
function readGallery(tab) {
  const gallery = document.getElementById(tab.dataset.gallery);
  return gallery ? $$('img', gallery).map(img => ({ src: img.getAttribute('src'), alt: img.alt })) : [];
}

/** Imprime a foto `i` da aba atual. `quick` = impressão mais rápida (troca dentro da mesma aba). */
function showPhoto(i, quick = false) {
  const total = photo.slides.length;
  if (!total) return;

  photo.index = (i + total) % total;
  const slide = photo.slides[photo.index];
  const tabName = photo.current.textContent.trim();
  const duration = quick ? 1500 : 2200;

  photo.print.classList.remove('printing', 'is-empty');
  photo.flash.classList.remove('fire');
  photo.img.alt = slide.alt;
  photo.img.src = slide.src;
  photo.label.textContent = total > 1 ? `${tabName} · ${photo.index + 1}/${total}` : tabName;
  photo.caption.textContent = slide.alt;

  // setas só aparecem quando há mais de uma foto, e somem durante a impressão
  photo.wrap.classList.toggle('has-many', total > 1);
  photo.wrap.classList.add('is-printing');
  photo.wrap.style.setProperty('--print-time', duration + 'ms');
  clearTimeout(photo.timer);
  photo.timer = setTimeout(() => photo.wrap.classList.remove('is-printing'), duration);

  void photo.print.offsetWidth; // reinicia as animações
  photo.flash.classList.add('fire');
  photo.print.classList.add('printing');
  printSound();
}

/** Seleciona a aba e imprime a primeira foto da sequência. */
function printPhoto(tab) {
  photo.current = tab;
  photo.tabs.forEach(t => {
    const on = t === tab;
    t.classList.toggle('active', on);
    t.setAttribute('aria-selected', String(on));
  });
  photo.slides = readGallery(tab);
  showPhoto(0);
}

photo.tabs.forEach(tab => tab.addEventListener('click', () => {
  if (tab !== photo.current) printPhoto(tab);
}));
photo.prev.addEventListener('click', () => showPhoto(photo.index - 1, true));
photo.next.addEventListener('click', () => showPhoto(photo.index + 1, true));

watchEmptyImage(photo.img, photo.print);

// Clique na foto: tela cheia com a sequência da aba (ao fechar, a polaroid acompanha a última foto vista)
function openPhotoLightbox() {
  openLightbox(photo.print, {
    slides: photo.slides,
    index: photo.index,
    onClose: i => { if (i !== photo.index) showPhoto(i, true); }
  });
}
photo.print.addEventListener('click', openPhotoLightbox);
photo.print.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  e.stopPropagation();
  openPhotoLightbox();
});

// Transição 5 ↔ 6 (fade) — a câmera imprime a primeira foto ao entrar
function toSlide6() {
  if (state.busy || state.slide !== 5 || !slide6) return;
  lock();
  pauseMusic();
  swapActive(slide5, slide6);
  setTimeout(() => {
    unlock(6);
    printPhoto(photo.tabs[0]);
  }, 650);
}

function backFromSlide6() {
  if (state.busy || state.slide !== 6) return;
  lock();
  swapActive(slide6, slide5);
  setTimeout(() => unlock(5), 650);
}