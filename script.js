/* =====================================================================
   DEPOIS DO GOLPE — apresentação web
   Índice
     1. Referências do DOM e estado global
     2. Áudio (volume geral + efeitos sintetizados)
     3. Navegação (setas, teclado, botões)
     4. Slide 1 · Capa (silhuetas e vídeo)
     5. Transição 1 → 2 · Rachadura
     6. Transição 2 → 3 · Tiros
     7. Slide 3 · Carrossel
     8. Transição 3 → 4 · Censura
     9. Slide 4 · Roteiro (abas)
    10. Slide 5 · Direção de arte (caderno)
    11. Slide 6 · Fotografia (câmera e polaroid)
    12. Transições 4 → 5 · 5 → 6 · 6 → 7 (explosão, fogo, cortina de sangue) e slide 7
    13. Controle de volume
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
const slide7 = $('#slide7');
const video  = $('#myVideo');

const SVG_NS = 'http://www.w3.org/2000/svg';
const LAST_SLIDE = 7;
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

/** Alterna `.active-slide` entre dois slides com fade (3 a 7). */
function swapActive(from, to) {
  if (from) from.classList.remove('active-slide');
  if (to) to.classList.add('active-slide');
}


/* ============ 2. ÁUDIO ============ */
let audioCtx, master;
const sound = { volume: 0.5, muted: false };
const gainFor = () => (sound.muted ? 0 : sound.volume * sound.volume); // curva quadrática: mais fino em volumes baixos

/** Cria o contexto de áudio sob demanda (o navegador só permite após um clique/tecla). */
function ac() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    master = audioCtx.createGain();
    master.gain.value = gainFor();
    master.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

/** Ruído filtrado com decaimento. `at` = atraso em segundos. */
function noise(at, dur, { type = 'lowpass', f0 = 2000, f1, q = 1, vol = 1, pow = 3 } = {}) {
  const c = ac(), t = c.currentTime + at;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, pow);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

/** Tom que desliza de f0 para f1. */
function tone(at, dur, { type = 'sine', f0 = 100, f1 = f0, vol = 0.8 } = {}) {
  const c = ac(), t = c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

/** Envolve um efeito: se o áudio falhar, a apresentação segue sem som. */
const sfx = fn => (...a) => { try { fn(...a); } catch (e) { /* sem áudio */ } };

const bang = sfx(() => {                       // tiro
  noise(0, 0.4, { f0: 2200, vol: 1, pow: 4 });
  tone(0, 0.3, { f0: 150, f1: 40, vol: 0.9 });
});

const crackSound = sfx(() => {                 // rachadura (1 → 2)
  for (let i = 0; i < 10; i++)
    noise(i * 0.06 + Math.random() * 0.04, 0.06, { type: 'highpass', f0: 1800 + Math.random() * 2500, vol: 0.7, pow: 2 });
  noise(0.1, 1.3, { f0: 260, f1: 60, vol: 1, pow: 1.5 });
  tone(0.7, 0.9, { f0: 80, f1: 28, vol: 0.9 });
});

const shatterSound = sfx(() => {               // cacos caindo (2 → 3)
  for (let i = 0; i < 22; i++)
    noise(i * 0.05 + Math.random() * 0.05, 0.09, { type: 'bandpass', f0: 3000 + Math.random() * 4000, q: 6, vol: 0.5, pow: 2 });
  noise(0, 0.8, { f0: 900, f1: 150, vol: 0.6, pow: 2 });
});

const censorSound = sfx(() => {                // censura (3 → 4)
  for (let i = 0; i < 8; i++) {                // tarjas batendo, uma a uma
    noise(i * 0.07, 0.12, { f0: 700, f1: 120, vol: 0.55, pow: 3 });
    tone(i * 0.07, 0.1, { f0: 160, f1: 60, vol: 0.35 });
  }
  tone(0.95, 0.6, { f0: 95, f1: 28, vol: 1 }); // carimbo
  noise(0.95, 0.35, { f0: 1000, f1: 100, vol: 1, pow: 3 });
  noise(1.55, 0.7, { type: 'bandpass', f0: 300, f1: 1400, q: 0.8, vol: 0.45, pow: 1 }); // tarjas saindo
});

const bombSound = sfx(() => {                  // explosão (4 → 5)
  tone(0, 1.6, { f0: 70, f1: 22, vol: 1 });
  noise(0, 2.4, { f0: 1400, f1: 70, vol: 1.2, pow: 2 });
  noise(0.05, 0.3, { type: 'highpass', f0: 3000, vol: 0.8, pow: 3 });
  tone(0.35, 1.8, { f0: 4200, vol: 0.05 });    // zumbido no ouvido
});

const fireSound = sfx(() => {                  // fogo (5 → 6)
  noise(0, 0.5, { type: 'bandpass', f0: 500, f1: 1800, q: 0.7, vol: 0.8, pow: 0.5 });
  noise(0.2, 2, { type: 'bandpass', f0: 900, q: 0.5, vol: 0.45, pow: 0.4 });
  for (let i = 0; i < 28; i++)
    noise(0.2 + Math.random() * 1.9, 0.03, { type: 'highpass', f0: 2500 + Math.random() * 3000, vol: 0.8, pow: 1 });
});

const bloodSound = sfx(() => {                 // cortina de sangue (6 → 7)
  tone(0, 2.3, { type: 'sawtooth', f0: 55, f1: 38, vol: 0.18 });
  noise(0, 1.0, { f0: 200, f1: 60, vol: 0.8, pow: 0.8 });
  tone(1.0, 0.5, { f0: 90, f1: 30, vol: 1 });
  noise(1.0, 0.5, { f0: 500, f1: 80, vol: 0.9, pow: 2 });
  for (let i = 0; i < 7; i++) tone(1.3 + i * 0.22, 0.12, { f0: 900, f1: 250, vol: 0.3 });
});

const printSound = sfx(() => {                 // impressora da câmera
  tone(0, 1, { type: 'sawtooth', f0: 70, f1: 110, vol: 0.15 });
  noise(0, 0.9, { type: 'bandpass', f0: 300, q: 3, vol: 0.25, pow: 0.3 });
});

const whoosh = sfx(() => noise(0, 0.5, { type: 'bandpass', f0: 400, f1: 1500, q: 0.8, vol: 0.4, pow: 1 })); // ao voltar


/* ============ 3. NAVEGAÇÃO ============ */
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
    5: toSlide6,
    6: toSlide7
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
    6: backFromSlide6,
    7: backFromSlide7
  };
  const action = actions[state.slide];
  if (action) { whoosh(); action(); }
}

window.addEventListener('keydown', e => {
  if (document.body.classList.contains('nb-lightbox-open')) return;
  if (e.target.closest && e.target.closest('#volume')) return; // setas ajustam o volume
  const next = ['ArrowRight', 'PageDown', ' '].includes(e.key);
  const prev = ['ArrowLeft', 'PageUp'].includes(e.key);
  if (!next && !prev) return;
  e.preventDefault();
  if (next) goNext(); else goPrev();
});

if (slPrev) slPrev.addEventListener('click', e => { e.stopPropagation(); slPrev.blur(); goPrev(); });
if (slNext) slNext.addEventListener('click', e => { e.stopPropagation(); slNext.blur(); goNext(); });

syncNav();


/* ============ 4. SLIDE 1 · CAPA ============ */
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


/* ============ 5. TRANSIÇÃO 1 → 2 · RACHADURA ============ */
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
  crackSound();

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


/* ============ 6. TRANSIÇÃO 2 → 3 · TIROS ============ */
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
  setTimeout(() => { shatterSound(); shatter(lastX, lastY); }, shatterAt);

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


/* ============ 7. SLIDE 3 · CARROSSEL ============ */
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


/* ============ 8. TRANSIÇÃO 3 → 4 · CENSURA ============ */
/* Tarjas pretas de censura cobrem a tela, um carimbo "CENSURADO" bate com tremor,
   o slide muda por baixo e as tarjas saem pelo outro lado. */
function bleedToSlide4() {
  if (state.busy || state.slide !== 3 || !slide4) return;
  lock();
  censorSound();

  const BARS = 8;
  const fx = makeFx('fx-censor');
  const bars = [];
  for (let i = 0; i < BARS; i++) {
    const bar = document.createElement('div');
    bar.className = 'fx-bar';
    bar.style.top = (i * 100 / BARS) + '%';
    bar.style.height = (100 / BARS + 0.3) + '%';
    bar.style.transform = 'translateX(-101%)';
    fx.appendChild(bar);
    bars.push(bar);
    bar.animate(
      [{ transform: 'translateX(-101%)' }, { transform: 'translateX(0)' }],
      { duration: 380, delay: i * 70, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }
    );
  }

  const stamp = document.createElement('div');
  stamp.className = 'fx-stamp';
  stamp.textContent = 'CENSURADO';
  fx.appendChild(stamp);

  setTimeout(() => {                           // carimbo bate
    stamp.animate([
      { transform: 'translate(-50%,-50%) rotate(-8deg) scale(3.2)', opacity: 0 },
      { transform: 'translate(-50%,-50%) rotate(-8deg) scale(1)', opacity: 1 }
    ], { duration: 160, easing: 'cubic-bezier(.3,0,.7,1)', fill: 'forwards' });
    shakeStage(700, 18);
  }, 950);

  setTimeout(() => {                           // troca escondida pelas tarjas
    cutSwap(slide3, slide4);
    stamp.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    bars.forEach((bar, i) => bar.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(101%)' }],
      { duration: 450, delay: i * 60, easing: 'cubic-bezier(.7,0,.8,.3)', fill: 'forwards' }
    ));
  }, 1500);

  setTimeout(() => { fx.remove(); unlock(4); }, 2450);
}

function backFromSlide4() {
  if (state.busy || state.slide !== 4) return;
  lock();
  swapActive(slide4, slide3);
  setTimeout(() => unlock(3), 500);
}


/* ============ 9. SLIDE 4 · ROTEIRO ============ */
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


/* ============ 10. SLIDE 5 · DIREÇÃO DE ARTE ============ */
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

/* --- Tela cheia: foto única ou carrossel (usada também no slide 6) --- */
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


/* ============ 11. SLIDE 6 · FOTOGRAFIA (CÂMERA) ============ */
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


/* ============ 12. TRANSIÇÕES 4 → 5 · 5 → 6 · 6 → 7 E SLIDE 7 ============ */

/** Camada de efeitos por cima do palco. */
function makeFx(extra = '') {
  const el = document.createElement('div');
  el.className = 'fx-layer ' + extra;
  stage.appendChild(el);
  return el;
}

/** Troca de slide sem fade (o efeito por cima esconde o corte). */
function cutSwap(from, to) {
  [from, to].forEach(s => (s.style.transition = 'none'));
  swapActive(from, to);
  void to.offsetWidth;
  [from, to].forEach(s => (s.style.transition = ''));
}

/** Tremor que vai diminuindo. */
function shakeStage(ms = 900, amp = 16) {
  const n = 12, frames = [{ transform: 'translate(0,0)' }];
  for (let i = 1; i < n; i++) {
    const k = amp * (1 - i / n);
    frames.push({ transform: `translate(${(Math.random() - 0.5) * 2 * k}px, ${(Math.random() - 0.5) * 2 * k}px)` });
  }
  frames.push({ transform: 'translate(0,0)' });
  stage.animate(frames, { duration: ms });
}

/* --- 4 → 5 · EXPLOSÃO (carro-bomba) --- */
function toSlide5() {
  if (state.busy || state.slide !== 4 || !slide5) return;
  lock();
  bombSound();

  const fx = makeFx();
  fx.innerHTML = '<div class="fx-boom-glow"></div><div class="fx-shock"></div><div class="fx-shock s2"></div><div class="fx-dust"></div><div class="fx-flash"></div>';
  const [glow, s1, s2, dust, flash] = fx.children;

  for (let i = 0; i < 30; i++) {
    const d = document.createElement('i');
    d.className = 'fx-debris';
    const size = 4 + Math.random() * 14;
    d.style.width = size + 'px';
    d.style.height = size * (0.5 + Math.random()) + 'px';
    fx.appendChild(d);
    const a = Math.random() * Math.PI * 2, dist = 300 + Math.random() * 700;
    d.animate([
      { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist + 150}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }
    ], { duration: 900 + Math.random() * 700, delay: 60, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both' });
  }

  const ring = (el, delay) => el.animate([
    { transform: 'translate(-50%,-50%) scale(.1)', opacity: 0.95 },
    { transform: 'translate(-50%,-50%) scale(9)', opacity: 0 }
  ], { duration: 1100, delay, easing: 'cubic-bezier(.1,.6,.3,1)' });
  ring(s1, 0); ring(s2, 140);

  glow.animate([{ opacity: 0 }, { opacity: 1, offset: .1 }, { opacity: 0 }], { duration: 1000 });
  flash.animate([{ opacity: 0 }, { opacity: 1, offset: .08 }, { opacity: 1, offset: .25 }, { opacity: 0 }], { duration: 1300, easing: 'ease-out' });
  dust.animate([{ opacity: 0 }, { opacity: .85, offset: .25 }, { opacity: 0 }], { duration: 1900 });

  shakeStage(1000, 22);
  setTimeout(() => cutSwap(slide4, slide5), 140);   // corte escondido pelo clarão
  setTimeout(() => { fx.remove(); unlock(5); }, 1900);
}

function backFromSlide5() {
  if (state.busy || state.slide !== 5) return;
  lock();
  pauseMusic();
  swapActive(slide5, slide4);
  setTimeout(() => unlock(4), 650);
}

/* --- 5 → 6 · CADERNO QUEIMANDO (queima de arquivo) --- */
function toSlide6() {
  if (state.busy || state.slide !== 5 || !slide6) return;
  lock();
  pauseMusic();
  fireSound();

  // filtro que deixa a borda do fogo irregular
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
  svg.style.position = 'fixed';
  svg.innerHTML = `<filter id="burnWarp" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="2" seed="3" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="40" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  document.body.appendChild(svg);

  const fx = makeFx('fx-burn');
  const clone = slide5.cloneNode(true);                       // mantém o id raiz (o CSS do slide depende dele)
  clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
  clone.classList.add('burning');
  clone.setAttribute('aria-hidden', 'true');
  const fire = document.createElement('div');
  fire.className = 'fx-fire';
  fx.append(clone, fire);

  cutSwap(slide5, slide6);   // o slide 6 já está por baixo, aparecendo conforme o papel queima

  const dur = 2100, t0 = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const b = -10 + 125 * Math.pow(p, 1.3);
    fx.style.setProperty('--b', b.toFixed(2));

    if (b > 0 && b < 100 && Math.random() < 0.8) {
      const e = document.createElement('i');
      e.className = 'fx-ember';
      e.style.left = Math.random() * 100 + '%';
      e.style.bottom = b + '%';
      fx.appendChild(e);
      e.animate([
        { transform: 'translate(0,0)', opacity: 1 },
        { transform: `translate(${(Math.random() - 0.5) * 120}px, ${-100 - Math.random() * 220}px)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 700, easing: 'ease-out' }).onfinish = () => e.remove();
    }

    if (p < 1) { requestAnimationFrame(step); return; }
    fx.remove(); svg.remove();
    unlock(6);
    printPhoto(photo.tabs[0]);   // a câmera imprime a primeira foto ao entrar
  }
  requestAnimationFrame(step);
}

function backFromSlide6() {
  if (state.busy || state.slide !== 6) return;
  lock();
  swapActive(slide6, slide5);
  setTimeout(() => unlock(5), 650);
}

/* --- 6 → 7 · CORTINA DE SANGUE --- */
function bloodCurtainSvg() {
  let drips = '', x = 0;
  while (x < 100) {
    const w = 2 + Math.random() * 5, len = 6 + Math.random() * 24;
    drips += `<rect x="${x.toFixed(2)}" y="94" width="${w.toFixed(2)}" height="${(len + 6).toFixed(2)}" rx="${(w / 2).toFixed(2)}"/>`;
    x += w + Math.random() * 2;
  }
  return `<svg viewBox="0 0 100 130" preserveAspectRatio="none">
    <defs><linearGradient id="bloodGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a0000"/><stop offset=".6" stop-color="#9a0505"/><stop offset="1" stop-color="#6e0000"/>
    </linearGradient></defs>
    <g fill="url(#bloodGrad)"><rect x="0" y="0" width="100" height="100"/>${drips}</g></svg>`;
}

function toSlide7() {
  if (state.busy || state.slide !== 6 || !slide7) return;
  lock();
  bloodSound();

  const fx = makeFx();
  const layer = document.createElement('div');
  layer.className = 'fx-blood';
  layer.innerHTML = bloodCurtainSvg();
  fx.appendChild(layer);

  const dur = 2500;
  layer.animate([
    { transform: 'translateY(-100%)', easing: 'cubic-bezier(.55,0,.9,.6)' },   // despenca
    { transform: 'translateY(0)', offset: .4 },                                // impacto
    { transform: 'translateY(0)', offset: .5, easing: 'cubic-bezier(.5,0,.3,1)' },
    { transform: 'translateY(100%)' }                                          // escorre pra fora
  ], { duration: dur, fill: 'forwards' });

  setTimeout(() => { cutSwap(slide6, slide7); shakeStage(700, 12); }, dur * 0.44);
  setTimeout(() => { fx.remove(); unlock(7); }, dur + 50);
}

function backFromSlide7() {
  if (state.busy || state.slide !== 7) return;
  lock();
  swapActive(slide7, slide6);
  setTimeout(() => unlock(6), 650);
}


/* ============ 13. CONTROLE DE VOLUME ============ */
const volBtn = $('#volBtn');
const volRange = $('#volRange');

function applyVolume() {
  if (master) master.gain.value = gainFor();
  if (notebook.audio) notebook.audio.volume = sound.muted ? 0 : sound.volume; // a música do caderno também
  volBtn.textContent = sound.muted || sound.volume === 0 ? '🔇' : sound.volume < 0.5 ? '🔉' : '🔊';
  volRange.value = Math.round(sound.volume * 100);
}
volRange.addEventListener('input', () => { sound.volume = volRange.value / 100; sound.muted = false; applyVolume(); });
volRange.addEventListener('change', () => volRange.blur());   // devolve as setas do teclado aos slides
volBtn.addEventListener('click', () => { sound.muted = !sound.muted; applyVolume(); volBtn.blur(); });
applyVolume();