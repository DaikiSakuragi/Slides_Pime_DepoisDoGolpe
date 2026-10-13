/* ============ CAPA: POSICIONA SILHUETAS ============ */
const video = document.getElementById('myVideo');
document.addEventListener('click', () => { if (video && video.paused) video.play(); });

const JUAN_SRC    = 'fotos/Juan_Glass.png';
const ERNESTO_SRC = 'fotos/Ernesto_Glass.png';

function layoutSilhouettes() {
  const W = window.innerWidth;
  const H = window.innerHeight;

  const boxH = H * 1.10;
  const boxY = H * 0.05;

  const overlapLeft  = 100;
  const overlapRight = 120;

  function place(imgId, glassId, src, x, w, svgAlign, cssAlign) {
    const el = document.getElementById(imgId);
    if(!el) return;
    el.setAttribute('x', x);
    el.setAttribute('y', boxY);
    el.setAttribute('width', w);
    el.setAttribute('height', boxH);
    el.setAttribute('preserveAspectRatio', svgAlign);
    const cx = x + w / 2;
    el.setAttribute('transform', `translate(${cx} 0) scale(-1 1) translate(${-cx} 0)`);

    const g = document.getElementById(glassId);
    if(!g) return;
    g.style.left   = x + 'px';
    g.style.top    = boxY + 'px';
    g.style.width  = w + 'px';
    g.style.height = boxH + 'px';
    g.style.transform = 'scaleX(-1)';
    g.style.webkitMaskImage = `url("${src}")`;
    g.style.maskImage       = `url("${src}")`;
    g.style.webkitMaskPosition = cssAlign;
    g.style.maskPosition       = cssAlign;
  }

  place('imgJuan', 'glassJuan', JUAN_SRC, 0, W / 2 + overlapLeft, 'xMinYMax meet', 'left bottom');
  const exStart = W / 2 - overlapRight;
  place('imgErnesto', 'glassErnesto', ERNESTO_SRC, exStart, W - exStart, 'xMaxYMax meet', 'right bottom');
}

layoutSilhouettes();
window.addEventListener('resize', layoutSilhouettes);

/* ============ ESTADOS GLOBAIS DE NAVEGAÇÃO ============ */
const stage  = document.getElementById('stage');
const slide1 = document.getElementById('slide1');
const slide2 = document.getElementById('slide2');
const slide3 = document.getElementById('slide3');

let currentSlide = 1; // 1, 2 ou 3
let busy = false;

/* ============ TRANSIÇÃO SLIDE 1 -> SLIDE 2 (RACHADURA) ============ */
function makeCrack() {
  const steps = 16;
  const pts = [];
  let x = 50;
  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * 100;
    x += (Math.random() - 0.5) * 9;
    x = Math.max(42, Math.min(58, x));
    pts.push([x, y]);
  }
  return pts;
}

function ptsToPath(pts) {
  return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
}

function makeBranches(pts) {
  const branches = [];
  [3, 6, 9, 12, 14].forEach(idx => {
    const [bx, by] = pts[idx];
    const dir = Math.random() > 0.5 ? 1 : -1;
    const mid = [bx + dir * (2 + Math.random() * 3), by + 2 + Math.random() * 2];
    const end = [mid[0] + dir * (2 + Math.random() * 4), mid[1] + 1 + Math.random() * 3];
    branches.push(`M${bx.toFixed(2)} ${by.toFixed(2)} L${mid[0].toFixed(2)} ${mid[1].toFixed(2)} L${end[0].toFixed(2)} ${end[1].toFixed(2)}`);
  });
  return branches;
}

function crackToNext() {
  if (busy || currentSlide !== 1) return;
  busy = true;

  const pts = makeCrack();
  const leftPoly  = 'polygon(0% 0%, ' + pts.map(p => p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%').join(', ') + ', 0% 100%)';
  const rightPoly = 'polygon(100% 0%, ' + pts.map(p => p[0].toFixed(2) + '% ' + p[1].toFixed(2) + '%').join(', ') + ', 100% 100%)';

  const clone = slide1.cloneNode(true);
  clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  clone.style.pointerEvents = 'none';
  stage.appendChild(clone);

  const cloneVideo = clone.querySelector('video');
  if (cloneVideo && video) {
    cloneVideo.currentTime = video.currentTime;
    cloneVideo.play().catch(() => {});
  }

  slide1.classList.add('half', 'half-left');
  clone.classList.add('half', 'half-right');
  slide1.style.clipPath = leftPoly;
  slide1.style.webkitClipPath = leftPoly;
  clone.style.clipPath = rightPoly;
  clone.style.webkitClipPath = rightPoly;
  clone.style.zIndex = 2;

  const svgNS = 'http://www.w3.org/2000/svg';
  const crack = document.createElementNS(svgNS, 'svg');
  crack.setAttribute('id', 'crack');
  crack.setAttribute('viewBox', '0 0 100 100');
  crack.setAttribute('preserveAspectRatio', 'none');

  const main = document.createElementNS(svgNS, 'path');
  main.setAttribute('d', ptsToPath(pts));
  main.setAttribute('class', 'main');
  main.setAttribute('pathLength', '1');
  crack.appendChild(main);

  makeBranches(pts).forEach(d => {
    const b = document.createElementNS(svgNS, 'path');
    b.setAttribute('d', d);
    b.setAttribute('class', 'branch');
    b.setAttribute('pathLength', '1');
    crack.appendChild(b);
  });
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
    currentSlide = 2;
    busy = false;
  }, 2000);
}

function backToCover() {
  if (busy || currentSlide !== 2) return;
  busy = true;

  slide1.style.transition = 'opacity .8s ease';
  slide1.style.opacity = 0;
  slide1.style.display = '';
  slide1.classList.remove('half', 'half-left', 'split');
  slide1.style.clipPath = 'none';
  slide1.style.webkitClipPath = 'none';

  requestAnimationFrame(() => requestAnimationFrame(() => {
    slide1.style.opacity = 1;
    slide2.classList.remove('show');
  }));

  setTimeout(() => {
    slide1.style.transition = '';
    currentSlide = 1;
    busy = false;
  }, 850);
}

/* ============ LÓGICA DO CARROSSEL (SLIDE 3) ============ */
const track = document.getElementById('carouselTrack');
const cards = document.querySelectorAll('.carousel-card');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const barsContainer = document.getElementById('barsContainer');

let currentIndex = 0;

if (cards.length > 0) {
  barsContainer.innerHTML = '';
  cards.forEach((_, idx) => {
    const bar = document.createElement('div');
    bar.classList.add('bar-indicator');
    if (idx === 0) bar.classList.add('active');
    bar.addEventListener('click', () => goToCard(idx));
    barsContainer.appendChild(bar);
  });
}

function updateCarousel() {
  if (!cards.length || !track) return;
  
  const cardWidth = cards[0].offsetWidth + 30;
  const offset = -currentIndex * cardWidth - (cardWidth / 2);
  
  track.style.transform = `translateX(${offset}px)`;

  cards.forEach((card, idx) => {
    if (idx === currentIndex) card.classList.add('active');
    else card.classList.remove('active');
  });

  const bars = document.querySelectorAll('.bar-indicator');
  bars.forEach((bar, idx) => {
    if (idx === currentIndex) bar.classList.add('active');
    else bar.classList.remove('active');
  });
}

function goToCard(index) {
  if (index < 0) currentIndex = 0;
  else if (index >= cards.length) currentIndex = cards.length - 1;
  else currentIndex = index;
  updateCarousel();
}

if (prevBtn) prevBtn.addEventListener('click', () => goToCard(currentIndex - 1));
if (nextBtn) nextBtn.addEventListener('click', () => goToCard(currentIndex + 1));

window.addEventListener('resize', updateCarousel);

/* ============ TRANSIÇÃO SLIDE 2 -> SLIDE 3 (TIROS) ============ */
let audioCtx;
const flash = document.createElement('div');
flash.id = 's3flash';
document.body.appendChild(flash);

const cssTiros = document.createElement('style');
cssTiros.textContent = `
  #s3flash{position:fixed;inset:0;background:#fff;opacity:0;z-index:60;pointer-events:none}
  .s3hole{position:absolute;width:280px;height:280px;margin:-140px 0 0 -140px;z-index:30;pointer-events:none}
  .s3hole svg{width:100%;height:100%;overflow:visible}
  #s3shards{position:absolute;inset:0;z-index:25;overflow:hidden;pointer-events:none}
`;
document.head.appendChild(cssTiros);

function bang() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime, sr = audioCtx.sampleRate;
    const buf = audioCtx.createBuffer(1, sr * 0.4, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
    const n = audioCtx.createBufferSource(); n.buffer = buf;
    const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    n.connect(lp).connect(audioCtx.destination); n.start(t);
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.18);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.3);
  } catch (e) {}
}

function addHole(xp, yp) {
  const h = document.createElement('div');
  h.className = 's3hole';
  h.style.left = xp + '%';
  h.style.top  = yp + '%';

  let lines = '';
  const n = 9 + Math.floor(Math.random() * 5);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const r = 18 + Math.random() * 30;
    const mx = Math.cos(a) * r * 0.55, my = Math.sin(a) * r * 0.55;
    const ex = Math.cos(a) * r,        ey = Math.sin(a) * r;
    lines += `<line x1="0" y1="0" x2="${mx}" y2="${my}" stroke="#fff" stroke-opacity=".85" stroke-width=".9" stroke-linecap="round"/>`;
    lines += `<line x1="${mx}" y1="${my}" x2="${ex}" y2="${ey}" stroke="#fff" stroke-opacity=".6" stroke-width=".6" stroke-linecap="round"/>`;
  }
  h.innerHTML = `<svg viewBox="-50 -50 100 100">${lines}
    <circle r="6" fill="rgba(0,0,0,.65)" stroke="rgba(255,255,255,.55)" stroke-width=".8"/>
    <circle r="3" fill="#000"/></svg>`;
  slide2.appendChild(h);
  h.animate([{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 120 });
}

function fireShot(x, y) {
  bang();
  addHole(x, y);
  flash.animate([{ opacity: .55 }, { opacity: 0 }], { duration: 150 });
  const k = 7 + Math.random() * 7;
  const rx = (Math.random() - .5) * 2 * k, ry = (Math.random() - .5) * 2 * k;
  stage.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${rx}px,${ry}px)` }, { transform: 'translate(0,0)' }], { duration: 170 });
}

function shatter(cx, cy) {
  const cols = 4, rows = 3;
  const pts = [];
  for (let r = 0; r <= rows; r++) {
    pts[r] = [];
    for (let c = 0; c <= cols; c++) {
      let x = c / cols * 100, y = r / rows * 100;
      if (c > 0 && c < cols) x += (Math.random() - .5) * (100 / cols) * .7;
      if (r > 0 && r < rows) y += (Math.random() - .5) * (100 / rows) * .7;
      pts[r][c] = [x, y];
    }
  }
  const tris = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const a = pts[r][c], b = pts[r][c + 1], d = pts[r + 1][c], e = pts[r + 1][c + 1];
    if ((r + c) % 2) { tris.push([a, b, d], [b, e, d]); }
    else             { tris.push([a, b, e], [a, e, d]); }
  }

  const box = document.createElement('div');
  box.id = 's3shards';
  stage.appendChild(box);

  const made = tris.map(t => {
    const gx = (t[0][0] + t[1][0] + t[2][0]) / 3;
    const gy = (t[0][1] + t[1][1] + t[2][1]) / 3;
    const el = slide2.cloneNode(true);
    el.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    el.style.transition = 'none';
    el.style.visibility = 'visible';
    el.style.transformOrigin = gx + '% ' + gy + '%';
    const poly = 'polygon(' + t.map(p => p[0] + '% ' + p[1] + '%').join(',') + ')';
    el.style.clipPath = poly;
    el.style.webkitClipPath = poly;
    box.appendChild(el);
    return { el, gx, gy };
  });

  slide2.style.visibility = 'hidden';

  made.forEach(({ el, gx, gy }) => {
    const dist  = Math.hypot(gx - cx, gy - cy) / 100;
    const delay = dist * 450 + Math.random() * 120;
    const dx    = (gx - cx) * 3 + (Math.random() - .5) * 120;
    const rot   = (Math.random() - .5) * 140;
    el.animate(
      [{ transform: 'none' }, { transform: `translate(${dx}px, 120vh) rotate(${rot}deg)` }],
      { duration: 1300, delay, easing: 'cubic-bezier(.5,0,1,.55)', fill: 'forwards' }
    );
  });
  return box;
}

function shootToSlide3() {
  if (busy || currentSlide !== 2) return;
  busy = true;

  const seq = [[0,28,34],[520,72,26],[900,40,68],[1180,80,62],[1380,18,70],[1520,50,46]];
  const last = seq[seq.length - 1];

  seq.forEach(([t, x, y]) => setTimeout(() => {
    try { fireShot(x, y); } catch (e) {}
  }, t));

  const tShatter = last[0] + 260;
  setTimeout(() => {
    try { shatter(last[1], last[2]); } catch (e) {}
  }, tShatter);

  setTimeout(() => {
    document.querySelectorAll('#s3shards').forEach(b => b.remove());
    slide2.querySelectorAll('.s3hole').forEach(h => h.remove());
    slide2.classList.remove('show');
    
    slide3.classList.add('active-slide');
    currentIndex = 0;
    updateCarousel();
    
    currentSlide = 3;
    busy = false;
  }, tShatter + 1600);
}

function backFromSlide3() {
  if (busy || currentSlide !== 3) return;
  busy = true;

  slide3.classList.remove('active-slide');
  slide2.style.visibility = '';
  slide2.classList.add('show');
  
  setTimeout(() => {
    currentSlide = 2;
    busy = false;
  }, 800);
}

/* ============ NAVEGAÇÃO: TECLADO + SETAS NA TELA ============ */
function goNext() {
  if (busy) return;
  if (currentSlide === 1) crackToNext();
  else if (currentSlide === 2) shootToSlide3();
  else if (currentSlide === 3) goToCard(currentIndex + 1);
}

function goPrev() {
  if (busy) return;
  if (currentSlide === 3) {
    if (currentIndex > 0) goToCard(currentIndex - 1);
    else backFromSlide3();
  } else if (currentSlide === 2) {
    backToCover();
  }
}

window.addEventListener('keydown', e => {
  const next = e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ';
  const prev = e.key === 'ArrowLeft'  || e.key === 'PageUp';
  if (!next && !prev) return;
  e.preventDefault();
  if (next) goNext(); else goPrev();
});

/* setas na tela (canto inferior direito) */
const slPrev = document.getElementById('slPrev');
const slNext = document.getElementById('slNext');

if (slPrev) slPrev.addEventListener('click', e => { e.stopPropagation(); slPrev.blur(); goPrev(); });
if (slNext) slNext.addEventListener('click', e => { e.stopPropagation(); slNext.blur(); goNext(); });

setInterval(() => {
  if (slPrev) slPrev.disabled = busy || currentSlide === 1;
  if (slNext) slNext.disabled = busy || (currentSlide === 3 && currentIndex === cards.length - 1);
}, 120);

console.log('apresentação carregada');