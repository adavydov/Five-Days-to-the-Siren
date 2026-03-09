const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const dayCounter = document.getElementById('day-counter');
const woodCounter = document.getElementById('wood-counter');
const foodCounter = document.getElementById('food-counter');
const metalCounter = document.getElementById('metal-counter');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const keys = {};

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
  lastTime: 0,
  day: 1,
  player: {
    x: 80,
    y: 300,
    width: 24,
    height: 24,
    speed: 180,
  },
  resources: {
    wood: 0,
    food: 0,
    metal: 0,
  },
  pickups: [
    { x: 110, y: 70, type: 'wood', label: 'Дерево', color: '#8b5a2b' },
    { x: 260, y: 40, type: 'wood', label: 'Дерево', color: '#8b5a2b' },
    { x: 505, y: 250, type: 'food', label: 'Еда', color: '#e25d48' },
    { x: 565, y: 330, type: 'food', label: 'Еда', color: '#e25d48' },
    { x: 70, y: 330, type: 'metal', label: 'Металл', color: '#a0a8b5' },
    { x: 150, y: 280, type: 'metal', label: 'Металл', color: '#a0a8b5' },
  ],
};

function startGame() {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  gameState.running = true;
  gameState.lastTime = performance.now();
  updateHud();
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
  collectResources();
}

function keepPlayerOnMap() {
  const maxX = canvas.width - gameState.player.width;
  const maxY = canvas.height - gameState.player.height;

  if (gameState.player.x < 0) gameState.player.x = 0;
  if (gameState.player.y < 0) gameState.player.y = 0;
  if (gameState.player.x > maxX) gameState.player.x = maxX;
  if (gameState.player.y > maxY) gameState.player.y = maxY;
}

function collectResources() {
  const player = gameState.player;

  gameState.pickups = gameState.pickups.filter((pickup) => {
    if (isTouching(player, pickup)) {
      gameState.resources[pickup.type] += 1;
      updateHud();
      return false;
    }

    return true;
  });
}

function isTouching(player, pickup) {
  const pickupSize = 18;

  return (
    player.x < pickup.x + pickupSize &&
    player.x + player.width > pickup.x &&
    player.y < pickup.y + pickupSize &&
    player.y + player.height > pickup.y
  );
}

function updateHud() {
  dayCounter.textContent = String(gameState.day);
  woodCounter.textContent = String(gameState.resources.wood);
  foodCounter.textContent = String(gameState.resources.food);
  metalCounter.textContent = String(gameState.resources.metal);
}

function draw() {
  drawMap();
  drawResources();
  drawTyunya();
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawZone(mapZones.forest);
  drawZone(mapZones.village);
  drawZone(mapZones.bunker);

  // Дверь бункера
  ctx.fillStyle = '#464b55';
  ctx.fillRect(90, 300, 40, 100);
}

function drawZone(zone) {
  ctx.fillStyle = zone.color;
  ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

  ctx.strokeStyle = '#223045';
  ctx.lineWidth = 2;
  ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.fillText(zone.name, zone.x + 10, zone.y + 22);
}

function drawResources() {
  gameState.pickups.forEach((pickup) => {
    ctx.fillStyle = pickup.color;
    ctx.fillRect(pickup.x, pickup.y, 18, 18);

    ctx.fillStyle = '#111111';
    ctx.font = '10px Arial';
    ctx.fillText(pickup.label, pickup.x - 4, pickup.y - 4);
  });
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
