// ========================
// 🐱 Cat Snake — со свайпами
// ========================

const CELL = 24;
const GRID = 20;
const W = CELL * GRID;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const boardWrapper = document.getElementById('board-wrapper');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const lengthEl = document.getElementById('length');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startBtn = document.getElementById('start-btn');

// Состояние
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let score = 0;
let best = +(localStorage.getItem('catSnakeBest') || 0);
let foodCount = 0;
let level = 1;
let stepInterval = 160;
let stepCounter = 0;
let lastTime = 0;
let isRunning = false;
let isPaused = false;
let animId = null;
let eatFlash = 0;

// ========================
// 🎨 Хелперы рисования
// ========================
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

// ========================
// Поле
// ========================
function drawGrid() {
  ctx.fillStyle = '#1a1024';
  ctx.fillRect(0, 0, W, W);

  ctx.strokeStyle = 'rgba(255, 183, 224, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, W);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(W, i * CELL);
    ctx.stroke();
  }
}

function draw() {
  drawGrid();

  // Еда
  if (food) {
    const px = food.x * CELL;
    const py = food.y * CELL;

    const t = performance.now() / 300;
    const scale = 1 + Math.sin(t) * 0.05;
    const offset = (CELL - CELL * scale) / 2;

    ctx.save();
    ctx.translate(px + offset, py + offset);
    ctx.scale(scale, scale);
    if (food.type === 'fish') drawFish(ctx, 0, 0, CELL);
    else drawMouse(ctx, 0, 0, CELL);
    ctx.restore();
  }

  // Тело
  for (let i = snake.length - 1; i >= 0; i--) {
    const seg = snake[i];
    const px = seg.x * CELL;
    const py = seg.y * CELL;

    if (i === 0) {
      drawCatFace(ctx, px, py, CELL, {
        color: '#ff8fc8',
        face: '#ffe3f1',
        pupilDX: direction.x,
        pupilDY: direction.y,
        closed: false,
      });
    } else {
      const t = i / Math.max(1, snake.length - 1);
      const hue = 330 - t * 60;
      drawCatFace(ctx, px, py, CELL, {
        color: `hsl(${hue}, 80%, 72%)`,
        face: `hsl(${hue}, 90%, 92%)`,
        closed: true,
      });
    }
  }

  if (eatFlash > 0) {
    ctx.fillStyle = `rgba(255, 200, 240, ${eatFlash * 0.4})`;
    ctx.fillRect(0, 0, W, W);
  }
}

// ========================
// Логика
// ========================
function spawnFood() {
  const occupied = new Set(snake.map(s => s.x + ',' + s.y));
  const free = [];
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (!occupied.has(x + ',' + y)) free.push({ x, y });
    }
  }
  if (free.length === 0) return;
  const spot = free[Math.floor(Math.random() * free.length)];

  const type = (foodCount > 0 && foodCount % 5 === 0) ? 'fish' : 'mouse';
  food = { x: spot.x, y: spot.y, type };
}

function eatFood() {
  const points = food.type === 'fish' ? 3 : 1;
  score += points;
  foodCount++;
  eatFlash = 1;

  const newLevel = Math.floor(foodCount / 5) + 1;
  if (newLevel !== level) {
    level = newLevel;
    stepInterval = Math.max(70, 160 - (level - 1) * 10);
  }

  if (score > best) {
    best = score;
    localStorage.setItem('catSnakeBest', best);
  }

  spawnFood();
  updateHUD();
}

function updateHUD() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
  lengthEl.textContent = snake.length;
  levelEl.textContent = level;
}

function tick() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
    gameOver();
    return;
  }

  const growing = food && head.x === food.x && head.y === food.y;
  const checkLen = growing ? snake.length : snake.length - 1;
  for (let i = 0; i < checkLen; i++) {
    if (snake[i].x === head.x && snake[i].y === head.y) {
      gameOver();
      return;
    }
  }

  snake.unshift(head);

  if (growing) eatFood();
  else snake.pop();
}

// ========================
// Игровой цикл
// ========================
function loop(time = 0) {
  if (!isRunning) return;

  if (!isPaused) {
    if (!lastTime) lastTime = time;
    const delta = time - lastTime;
    lastTime = time;

    stepCounter += delta;
    while (stepCounter >= stepInterval) {
      stepCounter -= stepInterval;
      tick();
      if (!isRunning) return;
    }

    if (eatFlash > 0) eatFlash = Math.max(0, eatFlash - delta / 200);

    draw();
  }

  animId = requestAnimationFrame(loop);
}

function startGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  foodCount = 0;
  level = 1;
  stepInterval = 160;
  stepCounter = 0;
  lastTime = 0;
  eatFlash = 0;
  isRunning = true;
  isPaused = false;

  spawnFood();
  updateHUD();
  overlay.classList.add('hidden');

  if (animId) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function gameOver() {
  isRunning = false;
  if (animId) cancelAnimationFrame(animId);
  overlayTitle.textContent = '😿 Игра окончена';
  overlayText.innerHTML = `Очки: <b>${score}</b><br>Длина: <b>${snake.length}</b><br>Рекорд: <b>${best}</b>`;
  startBtn.textContent = 'Заново';
  overlay.classList.remove('hidden');
}

function togglePause() {
  if (!isRunning) return;
  isPaused = !isPaused;
  if (isPaused) {
    overlayTitle.textContent = '😴 Пауза';
    overlayText.textContent = 'Свайп или Space — продолжить';
    startBtn.textContent = 'Продолжить';
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
    lastTime = performance.now();
  }
}

// ========================
// 🎯 Управление — клавиатура
// ========================
function tryDir(x, y) {
  if (direction.x + x === 0 && direction.y + y === 0) return;
  nextDirection = { x, y };
}

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault();
    if (!isRunning) startGame();
    else togglePause();
    return;
  }

  if (!isRunning || isPaused) return;

  switch (e.key) {
    case 'ArrowUp': case 'w': case 'W':    tryDir(0, -1); break;
    case 'ArrowDown': case 's': case 'S':  tryDir(0, 1);  break;
    case 'ArrowLeft': case 'a': case 'A':  tryDir(-1, 0); break;
    case 'ArrowRight': case 'd': case 'D': tryDir(1, 0);  break;
  }
});
// ========================
// 📱 Управление — свайпы
// ========================

const SWIPE_THRESHOLD = 24;       // минимальная длина свайпа в px
const TAP_MAX_MOVE = 14;          // движение меньше — это тап
const TAP_MAX_TIME = 280;         // длительность тапа в ms

let touchStart = null;

function onTouchStart(e) {
  if (e.touches.length !== 1) return;

  // Тапы по кнопкам и ссылкам не перехватываем — пусть браузер сам обработает
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

  if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;

  if (absX > absY) {
    tryDir(dx > 0 ? 1 : -1, 0);
  } else {
    tryDir(0, dy > 0 ? 1 : -1);
  }

  touchStart.handled = true;
}

function onTouchEnd(e) {
  if (!touchStart) return;

  const duration = performance.now() - touchStart.startTime;
  const touch = e.changedTouches[0];
  const dx = touch ? touch.clientX - touchStart.x : 0;
  const dy = touch ? touch.clientY - touchStart.y : 0;
  const moved = Math.max(Math.abs(dx), Math.abs(dy));

  // Короткий тап — пауза (только если игра запущена)
  if (!touchStart.handled && moved < TAP_MAX_MOVE && duration < TAP_MAX_TIME) {
    if (isRunning) togglePause();
  }

  touchStart = null;
}

function onTouchCancel() {
  touchStart = null;
}

document.addEventListener('touchstart', onTouchStart, { passive: true });
document.addEventListener('touchend', onTouchEnd, { passive: true });
document.addEventListener('touchcancel', onTouchCancel, { passive: true });

// Блокируем скролл во время свайпа (только когда палец уже на экране)
document.addEventListener('touchmove', (e) => {
  if (touchStart) {
    e.preventDefault();
    onTouchMove(e);
  }
}, { passive: false });

// Запрещаем контекстное меню на игровом поле (долгий тап)
boardWrapper.addEventListener('contextmenu', (e) => e.preventDefault());

// ========================
// 🎯 Кнопка старта — работает и мышкой, и пальцем
// ========================
function handleStartBtn(e) {
  e.preventDefault();
  e.stopPropagation();
  if (isRunning && isPaused) togglePause();
  else startGame();
}

startBtn.addEventListener('click', handleStartBtn);
startBtn.addEventListener('touchend', handleStartBtn, { passive: false });

// ========================
// Init
// ========================
bestEl.textContent = best;
drawGrid();