// =====================================================================
// 🐱 Cat Snake — Эрмитаж  |  Step 2: + зум для смартфонов
// =====================================================================

// ---------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------
const CONFIG = {
  // Поле
  CELL: 24,
  GRID: 20,

  // Скорость
  STEP_START: 160,
  STEP_MIN: 70,
  STEP_STEP: 10,
  FOOD_PER_LEVEL: 5,

  // Еда
  FISH_EVERY: 5,
  POINTS_MOUSE: 1,
  POINTS_FISH: 3,
  FISH_CHANCE: 0.15,

  // Управление свайпами
  SWIPE_THRESHOLD: 24,
  TAP_MAX_MOVE: 14,
  TAP_MAX_TIME: 280,

  // Хранилище
  LS_BEST: 'catSnakeBest',
  LS_ZOOM: 'catSnakeZoom',

  // Зум
  ZOOM_MIN: 0.6,
  ZOOM_MAX: 1.4,
  ZOOM_STEP: 0.15,
  ZOOM_DEFAULT: 1.0,
  ZOOM_BASE_FACTOR: 0.7,   // базовый размер = 70% доступного
  ZOOM_MOBILE_BP: 720,     // ширина, ниже которой включается мобильный режим
  ZOOM_DESKTOP_SIZE: 480,  // фикс. размер канваса на ПК
  ZOOM_SAFE_TOP: 160,      // запас под HUD сверху
  ZOOM_SAFE_SIDE: 20,      // запас по бокам
};

// Размер поля в пикселях (логический, для отрисовки)
const W = CONFIG.CELL * CONFIG.GRID;

// ---------------------------------------------------------------------
// DOM
// ---------------------------------------------------------------------
const canvas        = document.getElementById('game');
const ctx           = canvas.getContext('2d');
const boardWrapper  = document.getElementById('board-wrapper');
const scoreEl       = document.getElementById('score');
const bestEl        = document.getElementById('best');
const lengthEl      = document.getElementById('length');
const levelEl       = document.getElementById('level');
const overlay       = document.getElementById('overlay');
const overlayTitle  = document.getElementById('overlay-title');
const overlayText   = document.getElementById('overlay-text');
const startBtn      = document.getElementById('start-btn');

// Зум UI
const zoomInBtn     = document.getElementById('zoom-in');
const zoomOutBtn    = document.getElementById('zoom-out');
const zoomResetBtn  = document.getElementById('zoom-reset');
const zoomIndicator = document.getElementById('zoom-indicator');

// ---------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------
const state = {
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: null,
  score: 0,
  best: +(localStorage.getItem(CONFIG.LS_BEST) || 0),
  foodCount: 0,
  level: 1,
  stepInterval: CONFIG.STEP_START,
  stepCounter: 0,
  lastTime: 0,
  isRunning: false,
  isPaused: false,
  animId: null,
  eatFlash: 0,
  zoom: 1.0, // инициализируется ниже
};

// ---------------------------------------------------------------------
// RENDER — рисование
// ---------------------------------------------------------------------
const S = (size) => size / 32;

function drawCatFace(ctx, px, py, size, opts) {
  const { color, face, pupilDX = 0, pupilDY = 0, closed = false } = opts;
  const s = S(size);
  const X = (v) => px + v * s;
  const Y = (v) => py + v * s;

  // Ушки
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(X(6), Y(13));
  ctx.lineTo(X(4.5), Y(3));
  ctx.lineTo(X(13), Y(9));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(X(26), Y(13));
  ctx.lineTo(X(27.5), Y(3));
  ctx.lineTo(X(19), Y(9));
  ctx.closePath();
  ctx.fill();

  // Внутренние ушки
  ctx.fillStyle = '#ff9bb5';
  ctx.beginPath();
  ctx.moveTo(X(7.3), Y(12));
  ctx.lineTo(X(6.3), Y(5.5));
  ctx.lineTo(X(11.3), Y(9.7));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(X(24.7), Y(12));
  ctx.lineTo(X(25.7), Y(5.5));
  ctx.lineTo(X(20.7), Y(9.7));
  ctx.closePath();
  ctx.fill();

  // Голова
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.arc(X(16), Y(18), 11 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Глаза
  ctx.fillStyle = '#2a1a33';
  ctx.strokeStyle = '#2a1a33';
  ctx.lineWidth = Math.max(1, 1.6 * s);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const eyeY = 16.5;
  const leftX = 11.5;
  const rightX = 20.5;
  const eyeR = 1.8 * s;

  if (closed) {
    ctx.beginPath();
    ctx.moveTo(X(leftX - 2), Y(eyeY + 1));
    ctx.lineTo(X(leftX), Y(eyeY - 1.5));
    ctx.lineTo(X(leftX + 2), Y(eyeY + 1));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X(rightX - 2), Y(eyeY + 1));
    ctx.lineTo(X(rightX), Y(eyeY - 1.5));
    ctx.lineTo(X(rightX + 2), Y(eyeY + 1));
    ctx.stroke();
  } else {
    const offsetX = pupilDX * 0.9;
    const offsetY = pupilDY * 0.9;

    ctx.beginPath();
    ctx.arc(X(leftX), Y(eyeY), eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X(rightX), Y(eyeY), eyeR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(X(leftX - 0.7 + offsetX), Y(eyeY - 0.7 + offsetY), eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X(rightX - 0.7 + offsetX), Y(eyeY - 0.7 + offsetY), eyeR * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a1a33';
  }

  // Носик
  ctx.fillStyle = '#ff7a95';
  ctx.beginPath();
  ctx.moveTo(X(14.4), Y(20.5));
  ctx.lineTo(X(17.6), Y(20.5));
  ctx.lineTo(X(16), Y(22));
  ctx.closePath();
  ctx.fill();

  // Ротик
  ctx.strokeStyle = '#2a1a33';
  ctx.lineWidth = Math.max(0.8, 1 * s);
  ctx.beginPath();
  ctx.moveTo(X(13.5), Y(22.6));
  ctx.quadraticCurveTo(X(14.75), Y(24), X(16), Y(22.6));
  ctx.quadraticCurveTo(X(17.25), Y(24), X(18.5), Y(22.6));
  ctx.stroke();
}

function drawMouse(ctx, px, py, size) {
  const s = S(size);
  const X = (v) => px + v * s;
  const Y = (v) => py + v * s;

  ctx.strokeStyle = '#9b8ba3';
  ctx.lineWidth = 1.4 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(24), Y(22));
  ctx.quadraticCurveTo(X(30), Y(24), X(29), Y(30));
  ctx.stroke();

  ctx.fillStyle = '#9b8ba3';
  ctx.beginPath();
  ctx.arc(X(11), Y(11), 4.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(X(21), Y(11), 4.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff9bb5';
  ctx.beginPath();
  ctx.arc(X(11), Y(11), 2.4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(X(21), Y(11), 2.4 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b6a8bd';
  ctx.beginPath();
  ctx.ellipse(X(16), Y(20), 9 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2a1a33';
  ctx.beginPath();
  ctx.arc(X(13), Y(18), 1.3 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(X(19), Y(18), 1.3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff7a95';
  ctx.beginPath();
  ctx.arc(X(16), Y(22.5), 1.5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawFish(ctx, px, py, size) {
  const s = S(size);
  const X = (v) => px + v * s;
  const Y = (v) => py + v * s;

  ctx.save();
  ctx.shadowColor = '#ffcc4d';
  ctx.shadowBlur = 10 * s;

  ctx.fillStyle = '#ffa72e';
  ctx.beginPath();
  ctx.moveTo(X(24), Y(16));
  ctx.lineTo(X(30), Y(10));
  ctx.lineTo(X(30), Y(22));
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffc247';
  ctx.beginPath();
  ctx.ellipse(X(14), Y(16), 10 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.ellipse(X(13), Y(16), 2 * s, 6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(X(18), Y(16), 1.5 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(X(9.5), Y(14), 2.4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a1a33';
  ctx.beginPath();
  ctx.arc(X(9.5), Y(14), 1.2 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#a86b00';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.arc(X(7), Y(17), 1.4 * s, 0, Math.PI);
  ctx.stroke();
}

function drawGrid() {
  ctx.fillStyle = '#1a1024';
  ctx.fillRect(0, 0, W, W);

  ctx.strokeStyle = 'rgba(255, 183, 224, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= CONFIG.GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CONFIG.CELL, 0);
    ctx.lineTo(i * CONFIG.CELL, W);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CONFIG.CELL);
    ctx.lineTo(W, i * CONFIG.CELL);
    ctx.stroke();
  }
}

function draw() {
  drawGrid();

  if (state.food) {
    const { CELL } = CONFIG;
    const px = state.food.x * CELL;
    const py = state.food.y * CELL;
    const t = performance.now() / 300;
    const scale = 1 + Math.sin(t) * 0.05;
    const offset = (CELL - CELL * scale) / 2;

    ctx.save();
    ctx.translate(px + offset, py + offset);
    ctx.scale(scale, scale);
    if (state.food.type === 'fish') drawFish(ctx, 0, 0, CELL);
    else drawMouse(ctx, 0, 0, CELL);
    ctx.restore();
  }

  for (let i = state.snake.length - 1; i >= 0; i--) {
    const seg = state.snake[i];
    const px = seg.x * CONFIG.CELL;
    const py = seg.y * CONFIG.CELL;

    if (i === 0) {
      drawCatFace(ctx, px, py, CONFIG.CELL, {
        color: '#ff8fc8',
        face: '#ffe3f1',
        pupilDX: state.direction.x,
        pupilDY: state.direction.y,
        closed: false,
      });
    } else {
      const t = i / Math.max(1, state.snake.length - 1);
      const hue = 330 - t * 60;
      drawCatFace(ctx, px, py, CONFIG.CELL, {
        color: `hsl(${hue}, 80%, 72%)`,
        face: `hsl(${hue}, 90%, 92%)`,
        closed: true,
      });
    }
  }

  if (state.eatFlash > 0) {
    ctx.fillStyle = `rgba(255, 200, 240, ${state.eatFlash * 0.4})`;
    ctx.fillRect(0, 0, W, W);
  }
}

// ---------------------------------------------------------------------
// LOGIC
// ---------------------------------------------------------------------
function spawnFood() {
  const occupied = new Set(state.snake.map(s => s.x + ',' + s.y));
  const free = [];
  for (let y = 0; y < CONFIG.GRID; y++) {
    for (let x = 0; x < CONFIG.GRID; x++) {
      if (!occupied.has(x + ',' + y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return;

  const spot = free[Math.floor(Math.random() * free.length)];

  const forcedFish = state.foodCount > 0 && state.foodCount % CONFIG.FISH_EVERY === 0;
  const randomFish = Math.random() < CONFIG.FISH_CHANCE;
  const type = (forcedFish || randomFish) ? 'fish' : 'mouse';

  state.food = { x: spot.x, y: spot.y, type };
}

function eatFood() {
  const points = state.food.type === 'fish' ? CONFIG.POINTS_FISH : CONFIG.POINTS_MOUSE;
  state.score += points;
  state.foodCount++;
  state.eatFlash = 1;

  const newLevel = Math.floor(state.foodCount / CONFIG.FOOD_PER_LEVEL) + 1;
  if (newLevel !== state.level) {
    state.level = newLevel;
    state.stepInterval = Math.max(
      CONFIG.STEP_MIN,
      CONFIG.STEP_START - (state.level - 1) * CONFIG.STEP_STEP
    );
  }

  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(CONFIG.LS_BEST, state.best);
  }

  spawnFood();
  updateHUD();
}

function updateHUD() {
  scoreEl.textContent  = state.score;
  bestEl.textContent   = state.best;
  lengthEl.textContent = state.snake.length;
  levelEl.textContent  = state.level;
}

function tick() {
  state.direction = state.nextDirection;

  const head = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y,
  };

  if (head.x < 0 || head.x >= CONFIG.GRID || head.y < 0 || head.y >= CONFIG.GRID) {
    gameOver();
    return;
  }

  const growing = state.food && head.x === state.food.x && head.y === state.food.y;
  const checkLen = growing ? state.snake.length : state.snake.length - 1;
  for (let i = 0; i < checkLen; i++) {
    if (state.snake[i].x === head.x && state.snake[i].y === head.y) {
      gameOver();
      return;
    }
  }

  state.snake.unshift(head);
  if (growing) eatFood();
  else state.snake.pop();
}

// ---------------------------------------------------------------------
// LOOP
// ---------------------------------------------------------------------
function loop(time = 0) {
  if (!state.isRunning) return;

  if (!state.isPaused) {
    if (!state.lastTime) state.lastTime = time;
    const delta = time - state.lastTime;
    state.lastTime = time;

    state.stepCounter += delta;
    while (state.stepCounter >= state.stepInterval) {
      state.stepCounter -= state.stepInterval;
      tick();
      if (!state.isRunning) return;
    }

    if (state.eatFlash > 0) state.eatFlash = Math.max(0, state.eatFlash - delta / 200);

    draw();
  }

  state.animId = requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------
// GAME CONTROL
// ---------------------------------------------------------------------
function startGame() {
  state.snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.score = 0;
  state.foodCount = 0;
  state.level = 1;
  state.stepInterval = CONFIG.STEP_START;
  state.stepCounter = 0;
  state.lastTime = 0;
  state.eatFlash = 0;
  state.isRunning = true;
  state.isPaused = false;

  spawnFood();
  updateHUD();
  overlay.classList.add('hidden');

  if (state.animId) cancelAnimationFrame(state.animId);
  state.animId = requestAnimationFrame(loop);
}

function gameOver() {
  state.isRunning = false;
  if (state.animId) cancelAnimationFrame(state.animId);
  overlayTitle.textContent = '😿 Игра окончена';
  overlayText.innerHTML = `Очки: <b>${state.score}</b><br>Длина: <b>${state.snake.length}</b><br>Рекорд: <b>${state.best}</b>`;
  startBtn.textContent = 'Заново';
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (!state.isRunning) return;
  state.isPaused = !state.isPaused;
  if (state.isPaused) {
    overlayTitle.textContent = '😴 Пауза';
    overlayText.textContent = 'Свайп или Space — продолжить';
    startBtn.textContent = 'Продолжить';
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    state.lastTime = performance.now();
  }
}

// ---------------------------------------------------------------------
// INPUT — клавиатура
// ---------------------------------------------------------------------
function tryDir(x, y) {
  if (state.direction.x + x === 0 && state.direction.y + y === 0) return;
  state.nextDirection = { x, y };
}

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (!state.isRunning) startGame();
    else togglePause();
    return;
  }
  if (!state.isRunning || state.isPaused) return;

  switch (e.key) {
    case 'ArrowUp':    case 'w': case 'W': tryDir(0, -1); break;
    case 'ArrowDown':  case 's': case 'S': tryDir(0, 1);  break;
    case 'ArrowLeft':  case 'a': case 'A': tryDir(-1, 0); break;
    case 'ArrowRight': case 'd': case 'D': tryDir(1, 0);  break;
  }
});

// ---------------------------------------------------------------------
// INPUT — свайпы
// ---------------------------------------------------------------------
let touchStart = null;

function onTouchStart(e) {
  if (e.touches.length !== 1) return;
  if (e.target.closest('button, a')) return;

  const t = e.touches[0];
  touchStart = {
    x: t.clientX,
    y: t.clientY,
    startTime: performance.now(),
    handled: false,
  };
}

function onTouchMove(e) {
  if (!touchStart || touchStart.handled) return;

  const t = e.touches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (Math.max(absX, absY) < CONFIG.SWIPE_THRESHOLD) return;

  if (absX > absY) tryDir(dx > 0 ? 1 : -1, 0);
  else             tryDir(0, dy > 0 ? 1 : -1);

  touchStart.handled = true;
}

function onTouchEnd(e) {
  if (!touchStart) return;

  const duration = performance.now() - touchStart.startTime;
  const touch = e.changedTouches[0];
  const dx = touch ? touch.clientX - touchStart.x : 0;
  const dy = touch ? touch.clientY - touchStart.y : 0;
  const moved = Math.max(Math.abs(dx), Math.abs(dy));

  if (!touchStart.handled && moved < CONFIG.TAP_MAX_MOVE && duration < CONFIG.TAP_MAX_TIME) {
    if (state.isRunning) togglePause();
  }

  touchStart = null;
}

function onTouchCancel() {
  touchStart = null;
}

document.addEventListener('touchstart', onTouchStart, { passive: true });
document.addEventListener('touchend', onTouchEnd, { passive: true });
document.addEventListener('touchcancel', onTouchCancel, { passive: true });

document.addEventListener('touchmove', (e) => {
  if (touchStart) {
    e.preventDefault();
    onTouchMove(e);
  }
}, { passive: false });

boardWrapper.addEventListener('contextmenu', (e) => e.preventDefault());

// ---------------------------------------------------------------------
// ZOOM — управление масштабом для смартфонов
// ---------------------------------------------------------------------

// Доступное пространство под канвас
function getAvailableSize() {
  // На ПК — фиксированный
  if (window.innerWidth > CONFIG.ZOOM_MOBILE_BP) {
    return CONFIG.ZOOM_DESKTOP_SIZE;
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxW = vw - CONFIG.ZOOM_SAFE_SIDE;
  const maxH = vh - CONFIG.ZOOM_SAFE_TOP;
  return Math.max(200, Math.min(maxW, maxH, CONFIG.ZOOM_DESKTOP_SIZE));
}

// Применить текущий zoom к канвасу
function applyZoom() {
  if (window.innerWidth > CONFIG.ZOOM_MOBILE_BP) {
    // На ПК — убираем inline-стили, размер из CSS = 480×480
    canvas.style.width = '';
    canvas.style.height = '';
    return;
  }

  const avail = getAvailableSize();
  const size = Math.round(avail * CONFIG.ZOOM_BASE_FACTOR * state.zoom);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
}

// Индикатор «100%» показывается на 1.2 сек
let zoomIndicatorTimer = null;
function showZoomIndicator() {
  if (!zoomIndicator) return;
  zoomIndicator.textContent = Math.round(state.zoom * 100) + '%';
  zoomIndicator.classList.add('show');
  clearTimeout(zoomIndicatorTimer);
  zoomIndicatorTimer = setTimeout(() => {
    zoomIndicator.classList.remove('show');
  }, 1200);
}

// Обновить состояние кнопок (disable на краях диапазона)
function updateZoomButtons() {
  if (zoomInBtn)  zoomInBtn.disabled  = state.zoom >= CONFIG.ZOOM_MAX - 1e-6;
  if (zoomOutBtn) zoomOutBtn.disabled = state.zoom <= CONFIG.ZOOM_MIN + 1e-6;
  if (zoomResetBtn) zoomResetBtn.disabled = Math.abs(state.zoom - CONFIG.ZOOM_DEFAULT) < 1e-6;
}

// Установить зум (с клампом и сохранением)
function setZoom(value, showIndicator = true) {
  const clamped = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, value));
  const rounded = Math.round(clamped * 100) / 100;

  if (rounded === state.zoom) return;

  state.zoom = rounded;
  try { localStorage.setItem(CONFIG.LS_ZOOM, String(state.zoom)); } catch (e) {}

  applyZoom();
  updateZoomButtons();
  if (showIndicator) showZoomIndicator();
}

function zoomIn()  { setZoom(state.zoom + CONFIG.ZOOM_STEP); }
function zoomOut() { setZoom(state.zoom - CONFIG.ZOOM_STEP); }
function zoomReset() { setZoom(CONFIG.ZOOM_DEFAULT); }

// Навесить обработчики на кнопки зума
function initZoomControls() {
  const bind = (btn, handler) => {
    if (!btn) return;
    const fire = (e) => {
      e.preventDefault();
      e.stopPropagation();
      handler();
    };
    btn.addEventListener('click', fire);
    btn.addEventListener('touchend', fire, { passive: false });
    // защита от двойного вызова click + touchend
    let lastFire = 0;
    btn.addEventListener('pointerdown', (e) => {
      const now = performance.now();
      if (now - lastFire < 250) { e.preventDefault(); return; }
      lastFire = now;
    });
  };
  bind(zoomInBtn, zoomIn);
  bind(zoomOutBtn, zoomOut);
  bind(zoomResetBtn, zoomReset);
}

// Реагируем на изменение размера окна / поворот экрана
window.addEventListener('resize', () => { applyZoom(); });
window.addEventListener('orientationchange', () => {
  setTimeout(applyZoom, 100);
});

// ---------------------------------------------------------------------
// BUTTONS
// ---------------------------------------------------------------------
function handleStartBtn(e) {
  e.preventDefault();
  e.stopPropagation();
  if (state.isRunning && state.isPaused) togglePause();
  else startGame();
}

startBtn.addEventListener('click', handleStartBtn);
startBtn.addEventListener('touchend', handleStartBtn, { passive: false });

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------
(function init() {
  // Загружаем сохранённый зум
  const saved = parseFloat(localStorage.getItem(CONFIG.LS_ZOOM));
  if (Number.isFinite(saved)) {
    state.zoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, saved));
  } else {
    state.zoom = CONFIG.ZOOM_DEFAULT;
  }

  bestEl.textContent = state.best;
  drawGrid();

  applyZoom();
  updateZoomButtons();
  initZoomControls();
})();