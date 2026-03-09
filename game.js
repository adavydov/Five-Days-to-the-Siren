const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const dayCounter = document.getElementById('day-counter');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const keys = {};

const gameState = {
  running: false,
  lastTime: 0,
  day: 1,
  player: {
    x: 80,
    y: 300,
    width: 24,
    height: 24,
    speed: 180,
  },
};

function startGame() {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameState.running = true;
  gameState.lastTime = performance.now();
  dayCounter.textContent = String(gameState.day);
  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  const moveSpeed = gameState.player.speed * deltaTime;

  if (keys['w'] || keys['arrowup']) {
    gameState.player.y -= moveSpeed;
  }
  if (keys['s'] || keys['arrowdown']) {
    gameState.player.y += moveSpeed;
  }
  if (keys['a'] || keys['arrowleft']) {
    gameState.player.x -= moveSpeed;
  }
  if (keys['d'] || keys['arrowright']) {
    gameState.player.x += moveSpeed;
  }

  keepPlayerOnMap();
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

  // Тело
  ctx.fillStyle = '#ff9bc8';
  ctx.fillRect(x, y, width, height);

  // Глаза
  ctx.fillStyle = '#1f2230';
  ctx.fillRect(x + 5, y + 6, 4, 4);
  ctx.fillRect(x + 15, y + 6, 4, 4);

  // Подпись
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText('Тюня', x - 2, y - 6);
}

function gameLoop(currentTime) {
  if (!gameState.running) return;

  const deltaTime = (currentTime - gameState.lastTime) / 1000;
  gameState.lastTime = currentTime;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

function handleKeyDown(event) {
  keys[event.key.toLowerCase()] = true;
}

function handleKeyUp(event) {
  keys[event.key.toLowerCase()] = false;
}

startButton.addEventListener('click', startGame);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
