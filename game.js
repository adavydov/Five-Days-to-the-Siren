const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');
const dayCounter = document.getElementById('day-counter');
const hintText = document.getElementById('murlik-hint');
const dayTime = document.getElementById('day-time');
const woodCounter = document.getElementById('wood-counter');
const foodCounter = document.getElementById('food-counter');
const metalCounter = document.getElementById('metal-counter');
const statusMessage = document.getElementById('status-message');
const sirenAlert = document.getElementById('siren-alert');
const sirenFlash = document.getElementById('siren-flash');
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
const MAX_DAYS = 5;

const mapZones = {
  forest: {
    name: 'Лес',
    x: 0,
    y: 0,
    width: 640,
    height: 130,
    color: '#4d7f42',
  },
  village: {
    name: 'Деревня',
    x: 430,
    y: 210,
    width: 210,
    height: 190,
    color: '#c9b180',
  },
  bunker: {
    name: 'Бункер',
    x: 20,
    y: 240,
    width: 180,
    height: 160,
    color: '#6b6f79',
  },
};

const gameState = {
  running: false,
  paused: false,
  lastTime: 0,
  day: 1,
  dayTimer: 0,
  hintTimer: 0,
  dayProgress: 0,
  sirenStarted: false,
  zombies: [],
  spawnTimer: 0,
  resources: {
    wood: 0,
    food: 0,
    metal: 0,
  },
  pickups: [],
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

function resetGameState() {
function startGame() {
  resetGame();
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
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
  updateHud();
  statusMessage.textContent = 'Собирай ресурсы и держись ближе к бункеру.';
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  gameState.day = 1;
  gameState.dayProgress = 0;
  gameState.sirenStarted = false;
  gameState.zombies = [];
  gameState.spawnTimer = 0;
  gameState.resources.wood = 0;
  gameState.resources.food = 0;
  gameState.resources.metal = 0;
  gameState.pickups = createPickups();
  gameState.player.x = 80;
  gameState.player.y = 300;
  sirenAlert.classList.add('hidden');
  sirenFlash.classList.add('hidden');
  sirenFlash.classList.remove('active');
}

function createPickups() {
  return [
    { x: 70, y: 40, width: 14, height: 14, type: 'wood', color: '#8f5e30', label: 'Д' },
    { x: 145, y: 78, width: 14, height: 14, type: 'wood', color: '#8f5e30', label: 'Д' },
    { x: 230, y: 95, width: 14, height: 14, type: 'wood', color: '#8f5e30', label: 'Д' },
    { x: 535, y: 250, width: 14, height: 14, type: 'food', color: '#e6c652', label: 'Е' },
    { x: 500, y: 315, width: 14, height: 14, type: 'food', color: '#e6c652', label: 'Е' },
    { x: 585, y: 340, width: 14, height: 14, type: 'food', color: '#e6c652', label: 'Е' },
    { x: 220, y: 300, width: 14, height: 14, type: 'metal', color: '#b8beca', label: 'М' },
    { x: 440, y: 200, width: 14, height: 14, type: 'metal', color: '#b8beca', label: 'М' },
  ];
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
  if (keys.w || keys.arrowup) gameState.player.y -= moveSpeed;
  if (keys.s || keys.arrowdown) gameState.player.y += moveSpeed;
  if (keys.a || keys.arrowleft) gameState.player.x -= moveSpeed;
  if (keys.d || keys.arrowright) gameState.player.x += moveSpeed;

  keepPlayerOnMap();
  collectPickups();
  updateDayTimer(deltaTime);

  if (gameState.sirenStarted) {
    updateZombies(deltaTime);
    checkLoseState();
  }
}

function collectPickups() {
  for (let i = gameState.pickups.length - 1; i >= 0; i -= 1) {
    const pickup = gameState.pickups[i];

    if (isColliding(gameState.player, pickup)) {
      gameState.resources[pickup.type] += 1;
      gameState.pickups.splice(i, 1);
      statusMessage.textContent = `Собрано: ${getResourceName(pickup.type)}.`;
      updateHud();
    }
  }
}

function getResourceName(type) {
  if (type === 'wood') return 'дерево';
  if (type === 'food') return 'еда';
  return 'металл';
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
  woodCounter.textContent = String(gameState.resources.wood);
  foodCounter.textContent = String(gameState.resources.food);
  metalCounter.textContent = String(gameState.resources.metal);
}

function startSiren() {
  if (gameState.sirenStarted) return;

  gameState.sirenStarted = true;
  statusMessage.textContent = '🚨 СИРЕНА! Беги в бункер и избегай зомби!';
  sirenAlert.classList.remove('hidden');
  sirenFlash.classList.remove('hidden');
  sirenFlash.classList.add('active');
  playSirenSound();

  setTimeout(() => {
    sirenAlert.classList.add('hidden');
  }, 2500);

  setTimeout(() => {
    sirenFlash.classList.add('hidden');
    sirenFlash.classList.remove('active');
  }, 1800);
}

function playSirenSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) return;

  const audioContext = new AudioContextClass();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = 'sawtooth';
  oscillator.frequency.setValueAtTime(520, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 0.3);
  oscillator.frequency.linearRampToValueAtTime(520, audioContext.currentTime + 0.6);

  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.65);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.65);

  oscillator.onended = () => {
    audioContext.close();
  };
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

    keepZombieOutOfBunker(zombie);
  }
}

function keepZombieOutOfBunker(zombie) {
  if (!isColliding(zombie, gameState.bunker)) return;

  const bunkerCenterX = gameState.bunker.x + gameState.bunker.width / 2;
  const bunkerCenterY = gameState.bunker.y + gameState.bunker.height / 2;
  const zombieCenterX = zombie.x + zombie.width / 2;
  const zombieCenterY = zombie.y + zombie.height / 2;

  const dx = zombieCenterX - bunkerCenterX;
  const dy = zombieCenterY - bunkerCenterY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      zombie.x = gameState.bunker.x + gameState.bunker.width;
    } else {
      zombie.x = gameState.bunker.x - zombie.width;
    }
  } else if (dy > 0) {
    zombie.y = gameState.bunker.y + gameState.bunker.height;
  } else {
    zombie.y = gameState.bunker.y - zombie.height;
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
  drawPickups();
  drawTyunya();

  if (gameState.paused) {
    drawPauseOverlay();
  }
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
    ctx.fillStyle = 'rgba(180, 30, 30, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawPickups() {
  for (const pickup of gameState.pickups) {
    ctx.fillStyle = pickup.color;
    ctx.fillRect(pickup.x, pickup.y, pickup.width, pickup.height);

    ctx.fillStyle = '#1f2230';
    ctx.font = '10px Arial';
    ctx.fillText(pickup.label, pickup.x + 3, pickup.y + 10);
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

function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(18, 24, 36, 0.45)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.fillText('Пауза', canvas.width / 2 - 45, canvas.height / 2);
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
