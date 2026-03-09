const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');
const dayCounter = document.getElementById('day-counter');
const hintText = document.getElementById('murlik-hint');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const keys = {};
const DAY_DURATION = 20;

const murlikHints = [
  'Мурлик: Собери припасы и держись ближе к бункеру.',
  'Мурлик: В лесу тише, но после сирены там опаснее.',
  'Мурлик: Если устал — жми «Пауза», я подожду.',
  'Мурлик: Говорят, сирена включается сама, когда небо краснеет.',
  'Мурлик: Последний день близко. Не отходи далеко от укрытия.',
];

const gameState = {
  running: false,
  paused: false,
  lastTime: 0,
  day: 1,
  dayTimer: 0,
  hintTimer: 0,
  player: {
    x: 80,
    y: 300,
    width: 24,
    height: 24,
    speed: 180,
  },
};

function resetGameState() {
  gameState.running = true;
  gameState.paused = false;
  gameState.lastTime = performance.now();
  gameState.day = 1;
  gameState.dayTimer = 0;
  gameState.hintTimer = 0;
  gameState.player.x = 80;
  gameState.player.y = 300;

  dayCounter.textContent = String(gameState.day);
  hintText.textContent = murlikHints[0];
  pauseButton.textContent = 'Пауза';
  gameScreen.classList.remove('is-paused');
}

function startGame() {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resetGameState();
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  resetGameState();
  draw();
}

function togglePause() {
  if (!gameState.running) return;

  gameState.paused = !gameState.paused;

  if (gameState.paused) {
    pauseButton.textContent = 'Продолжить';
    gameScreen.classList.add('is-paused');
    hintText.textContent = 'Мурлик: Время замерло. Нажми «Продолжить», когда будешь готов.';
    return;
  }

  pauseButton.textContent = 'Пауза';
  gameScreen.classList.remove('is-paused');
  gameState.lastTime = performance.now();
  updateHintByDay();
}

function update(deltaTime) {
  const moveSpeed = gameState.player.speed * deltaTime;

  if (keys.w || keys.arrowup) {
    gameState.player.y -= moveSpeed;
  }
  if (keys.s || keys.arrowdown) {
    gameState.player.y += moveSpeed;
  }
  if (keys.a || keys.arrowleft) {
    gameState.player.x -= moveSpeed;
  }
  if (keys.d || keys.arrowright) {
    gameState.player.x += moveSpeed;
  }

  keepPlayerOnMap();
  updateDayProgress(deltaTime);
  updateHintRotation(deltaTime);
}

function updateDayProgress(deltaTime) {
  if (gameState.day >= 5) return;

  gameState.dayTimer += deltaTime;
  if (gameState.dayTimer < DAY_DURATION) return;

  gameState.day += 1;
  gameState.dayTimer = 0;
  dayCounter.textContent = String(gameState.day);
  updateHintByDay();
}

function updateHintRotation(deltaTime) {
  gameState.hintTimer += deltaTime;

  if (gameState.hintTimer < 8) return;

  gameState.hintTimer = 0;
  updateHintByDay();
}

function updateHintByDay() {
  const hintIndex = Math.min(gameState.day - 1, murlikHints.length - 1);
  hintText.textContent = murlikHints[hintIndex];
}

function keepPlayerOnMap() {
  const maxX = canvas.width - gameState.player.width;
  const maxY = canvas.height - gameState.player.height;

  if (gameState.player.x < 0) gameState.player.x = 0;
  if (gameState.player.y < 0) gameState.player.y = 0;
  if (gameState.player.x > maxX) gameState.player.x = maxX;
  if (gameState.player.y > maxY) gameState.player.y = maxY;
}

function draw() {
  drawMap();
  drawTyunya();

  if (gameState.paused) {
    drawPauseOverlay();
  }
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Лес
  ctx.fillStyle = '#4d7f42';
  ctx.fillRect(0, 0, canvas.width, 120);

  // Деревня
  ctx.fillStyle = '#c9b180';
  ctx.fillRect(430, 220, 200, 150);

  // Бункер
  ctx.fillStyle = '#6b6f79';
  ctx.fillRect(30, 260, 140, 110);
  ctx.fillStyle = '#464b55';
  ctx.fillRect(70, 300, 60, 70);
}

function drawTyunya() {
  const { x, y, width, height } = gameState.player;

  ctx.fillStyle = '#ff9bc8';
  ctx.fillRect(x, y, width, height);

  ctx.fillStyle = '#1f2230';
  ctx.fillRect(x + 5, y + 6, 4, 4);
  ctx.fillRect(x + 15, y + 6, 4, 4);

  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('Тюня', x - 2, y - 6);
}

function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(18, 24, 36, 0.45)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText('Пауза', canvas.width / 2 - 45, canvas.height / 2);
}

function gameLoop(currentTime) {
  if (!gameState.running) return;

  const deltaTime = (currentTime - gameState.lastTime) / 1000;
  gameState.lastTime = currentTime;

  if (!gameState.paused) {
    update(deltaTime);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function handleKeyDown(event) {
  keys[event.key.toLowerCase()] = true;

  if (event.key.toLowerCase() === 'p') {
    togglePause();
  }
}

function handleKeyUp(event) {
  keys[event.key.toLowerCase()] = false;
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', restartGame);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
