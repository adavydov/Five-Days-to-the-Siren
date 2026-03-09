const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const dayCounter = document.getElementById('day-counter');
const dayTime = document.getElementById('day-time');
const statusMessage = document.getElementById('status-message');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const keys = {};
const DAY_DURATION = 20;
const MAX_DAYS = 5;

const gameState = {
  running: false,
  lastTime: 0,
  day: 1,
  dayProgress: 0,
  sirenStarted: false,
  zombies: [],
  spawnTimer: 0,
  player: {
    x: 80,
    y: 300,
    width: 24,
    height: 24,
    speed: 180,
  },
  bunker: {
    x: 30,
    y: 260,
    width: 140,
    height: 110,
  },
};

function startGame() {
  resetGame();
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameState.running = true;
  gameState.lastTime = performance.now();
  updateHud();
  statusMessage.textContent = 'Собирайся и держись ближе к бункеру.';
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  gameState.day = 1;
  gameState.dayProgress = 0;
  gameState.sirenStarted = false;
  gameState.zombies = [];
  gameState.spawnTimer = 0;
  gameState.player.x = 80;
  gameState.player.y = 300;
}

function update(deltaTime) {
  const moveSpeed = gameState.player.speed * deltaTime;

  if (keys.w || keys.arrowup) gameState.player.y -= moveSpeed;
  if (keys.s || keys.arrowdown) gameState.player.y += moveSpeed;
  if (keys.a || keys.arrowleft) gameState.player.x -= moveSpeed;
  if (keys.d || keys.arrowright) gameState.player.x += moveSpeed;

  keepPlayerOnMap();
  updateDayTimer(deltaTime);

  if (gameState.sirenStarted) {
    updateZombies(deltaTime);
    checkLoseState();
  }
}

function updateDayTimer(deltaTime) {
  gameState.dayProgress += deltaTime;

  while (gameState.dayProgress >= DAY_DURATION && gameState.day <= MAX_DAYS) {
    gameState.dayProgress -= DAY_DURATION;
    gameState.day += 1;

    if (gameState.day === MAX_DAYS) {
      startSiren();
    }

    if (gameState.day > MAX_DAYS) {
      triggerWin();
      return;
    }
  }

  updateHud();
}

function updateHud() {
  const currentDay = Math.min(gameState.day, MAX_DAYS);
  const timeLeft = Math.max(0, Math.ceil(DAY_DURATION - gameState.dayProgress));
  dayCounter.textContent = String(currentDay);
  dayTime.textContent = String(timeLeft);
}

function startSiren() {
  if (gameState.sirenStarted) return;

  gameState.sirenStarted = true;
  statusMessage.textContent = '🚨 СИРЕНА! Беги в бункер и избегай зомби!';
}

function updateZombies(deltaTime) {
  gameState.spawnTimer -= deltaTime;

  if (gameState.spawnTimer <= 0) {
    spawnZombie();
    gameState.spawnTimer = 2;
  }

  for (const zombie of gameState.zombies) {
    const dx = gameState.player.x - zombie.x;
    const dy = gameState.player.y - zombie.y;
    const distance = Math.hypot(dx, dy) || 1;

    zombie.x += (dx / distance) * zombie.speed * deltaTime;
    zombie.y += (dy / distance) * zombie.speed * deltaTime;
  }
}

function spawnZombie() {
  gameState.zombies.push({
    x: Math.random() * (canvas.width - 20),
    y: 20 + Math.random() * 70,
    width: 20,
    height: 20,
    speed: 75,
  });
}

function checkLoseState() {
  if (isPlayerInBunker()) return;

  for (const zombie of gameState.zombies) {
    if (isColliding(gameState.player, zombie)) {
      gameOver('lose');
      return;
    }
  }
}

function isPlayerInBunker() {
  return isColliding(gameState.player, gameState.bunker);
}

function triggerWin() {
  gameOver('win');
}

function gameOver(result) {
  gameState.running = false;

  if (result === 'win') {
    statusMessage.textContent = '🎉 Победа! Ты продержалась до конца пятого дня!';
  } else {
    statusMessage.textContent = '💀 Поражение! Зомби поймали Тюню вне бункера.';
  }
}

function isColliding(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
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
  drawZombies();
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#4d7f42';
  ctx.fillRect(0, 0, canvas.width, 120);

  ctx.fillStyle = '#c9b180';
  ctx.fillRect(430, 220, 200, 150);

  ctx.fillStyle = '#6b6f79';
  ctx.fillRect(gameState.bunker.x, gameState.bunker.y, gameState.bunker.width, gameState.bunker.height);
  ctx.fillStyle = '#464b55';
  ctx.fillRect(70, 300, 60, 70);

  if (gameState.sirenStarted) {
    ctx.fillStyle = 'rgba(180, 30, 30, 0.35)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
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

function drawZombies() {
  for (const zombie of gameState.zombies) {
    ctx.fillStyle = '#7ce38b';
    ctx.fillRect(zombie.x, zombie.y, zombie.width, zombie.height);

    ctx.fillStyle = '#1f2230';
    ctx.fillRect(zombie.x + 4, zombie.y + 5, 3, 3);
    ctx.fillRect(zombie.x + 12, zombie.y + 5, 3, 3);
  }
}

function gameLoop(currentTime) {
  if (!gameState.running) {
    draw();
    return;
  }

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
