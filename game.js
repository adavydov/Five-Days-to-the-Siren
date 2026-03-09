const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');

const dayCounter = document.getElementById('day-counter');
const dayTime = document.getElementById('day-time');
const woodCount = document.getElementById('wood-count');
const metalCount = document.getElementById('metal-count');
const foodCount = document.getElementById('food-count');
const ammoCount = document.getElementById('ammo-count');
const workbenchState = document.getElementById('workbench-state');
const gunState = document.getElementById('gun-state');

const hintText = document.getElementById('murlik-hint');
const statusMessage = document.getElementById('status-message');
const sirenAlert = document.getElementById('siren-alert');

const craftMenu = document.getElementById('craft-menu');
const craftGunButton = document.getElementById('craft-gun');
const craftAmmoButton = document.getElementById('craft-ammo');
const craftCloseButton = document.getElementById('craft-close');

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const DAY_DURATION = 20;
const MAX_DAYS = 5;
const keys = {};

const mapZones = {
  forest: { x: 0, y: 0, width: 640, height: 130, color: '#4d7f42' },
  village: { x: 430, y: 210, width: 210, height: 190, color: '#c9b180' },
  bunker: { x: 20, y: 240, width: 180, height: 160, color: '#6b6f79' },
};

const gameState = {
  running: false,
  paused: false,
  lastTime: 0,
  day: 1,
  dayProgress: 0,
  sirenStarted: false,
  victoryReady: false,
  craftingOpen: false,
  nearWorkbench: false,
  nearBunker: false,
  resources: { wood: 0, metal: 0, food: 0 },
  inventory: { hasWorkbench: false, hasGun: false, ammo: 0 },
  resourceNodes: [],
  zombies: [],
  bullets: [],
  spawnTimer: 0,
  player: { x: 80, y: 300, width: 24, height: 24, speed: 180, lastDirection: 'right' },
  bunker: { x: 30, y: 260, width: 140, height: 110 },
  workbenchSpot: { x: 52, y: 286, width: 48, height: 38 },
};

function createResourceNodes() {
  return [
    { type: 'wood', x: 80, y: 55, width: 20, height: 20, active: true },
    { type: 'wood', x: 220, y: 78, width: 20, height: 20, active: true },
    { type: 'wood', x: 330, y: 40, width: 20, height: 20, active: true },
    { type: 'food', x: 500, y: 270, width: 20, height: 20, active: true },
    { type: 'food', x: 575, y: 320, width: 20, height: 20, active: true },
    { type: 'metal', x: 380, y: 300, width: 20, height: 20, active: true },
    { type: 'metal', x: 220, y: 330, width: 20, height: 20, active: true },
  ];
}

function resetGame() {
  gameState.running = true;
  gameState.paused = false;
  gameState.day = 1;
  gameState.dayProgress = 0;
  gameState.sirenStarted = false;
  gameState.victoryReady = false;
  gameState.craftingOpen = false;
  gameState.nearWorkbench = false;
  gameState.nearBunker = false;
  gameState.resources = { wood: 0, metal: 0, food: 0 };
  gameState.inventory = { hasWorkbench: false, hasGun: false, ammo: 0 };
  gameState.resourceNodes = createResourceNodes();
  gameState.zombies = [];
  gameState.bullets = [];
  gameState.spawnTimer = 0;
  gameState.player.x = 80;
  gameState.player.y = 300;
  gameState.player.lastDirection = 'right';
  gameState.lastTime = performance.now();

  craftMenu.classList.add('hidden');
  sirenAlert.classList.add('hidden');
  pauseButton.textContent = 'Пауза';
  setMessage('Собери ресурсы для верстака.');
  updateHud();
  updateMurlikHint();
}

function startGame() {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resetGame();
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  resetGame();
  draw();
}

function togglePause() {
  if (!gameState.running) return;
  gameState.paused = !gameState.paused;

  if (gameState.paused) {
    pauseButton.textContent = 'Продолжить';
    setMessage('Пауза.');
    return;
  }

  pauseButton.textContent = 'Пауза';
  gameState.lastTime = performance.now();
}

function update(deltaTime) {
  if (!gameState.craftingOpen) {
    updatePlayerMovement(deltaTime);
  }

  collectResources();
  updateNearbyFlags();
  updateDayTimer(deltaTime);
  updateBullets(deltaTime);

  if (gameState.sirenStarted) {
    updateZombies(deltaTime);
    checkLoseState();
  }

  updateMurlikHint();
}

function updatePlayerMovement(deltaTime) {
  const moveSpeed = gameState.player.speed * deltaTime;

  if (keys.w || keys.arrowup) {
    gameState.player.y -= moveSpeed;
    gameState.player.lastDirection = 'up';
  }
  if (keys.s || keys.arrowdown) {
    gameState.player.y += moveSpeed;
    gameState.player.lastDirection = 'down';
  }
  if (keys.a || keys.arrowleft) {
    gameState.player.x -= moveSpeed;
    gameState.player.lastDirection = 'left';
  }
  if (keys.d || keys.arrowright) {
    gameState.player.x += moveSpeed;
    gameState.player.lastDirection = 'right';
  }

  keepPlayerOnMap();
}

function updateNearbyFlags() {
  gameState.nearBunker = isColliding(gameState.player, gameState.bunker);
  gameState.nearWorkbench = isColliding(gameState.player, gameState.workbenchSpot);

  if (gameState.craftingOpen) return;

  if (!gameState.inventory.hasWorkbench && gameState.nearBunker) {
    if (canBuildWorkbench()) {
      setMessage('Нажми E, чтобы собрать верстак.');
    } else {
      setMessage('Для верстака нужно: дерево 3, металл 1.');
    }
    return;
  }

  if (gameState.inventory.hasWorkbench && gameState.nearWorkbench) {
    setMessage('Нажми E, чтобы открыть верстак.');
  }
}

function canBuildWorkbench() {
  return gameState.resources.wood >= 3 && gameState.resources.metal >= 1;
}

function updateDayTimer(deltaTime) {
  gameState.dayProgress += deltaTime;

  if (gameState.dayProgress >= DAY_DURATION) {
    gameState.dayProgress = 0;
    gameState.day += 1;

    if (gameState.day === MAX_DAYS) {
      startSiren();
    }

    if (gameState.day > MAX_DAYS) {
      gameState.victoryReady = true;
      gameState.sirenStarted = false;
      if (gameState.zombies.length === 0) {
        triggerWin();
        return;
      }
    }
  }

  updateHud();
}

function updateHud() {
  const currentDay = Math.min(gameState.day, MAX_DAYS);
  const timeLeft = Math.max(0, Math.ceil(DAY_DURATION - gameState.dayProgress));

  dayCounter.textContent = String(currentDay);
  dayTime.textContent = String(timeLeft);
  woodCount.textContent = String(gameState.resources.wood);
  metalCount.textContent = String(gameState.resources.metal);
  foodCount.textContent = String(gameState.resources.food);
  ammoCount.textContent = String(gameState.inventory.ammo);
  workbenchState.textContent = gameState.inventory.hasWorkbench ? 'есть' : 'нет';
  gunState.textContent = gameState.inventory.hasGun ? 'есть' : 'нет';
}

function collectResources() {
  for (const node of gameState.resourceNodes) {
    if (!node.active || !isColliding(gameState.player, node)) continue;

    node.active = false;
    gameState.resources[node.type] += 1;
    setMessage(`Собрано: ${resourceName(node.type)}.`);
    updateHud();
  }
}

function resourceName(type) {
  if (type === 'wood') return 'дерево';
  if (type === 'metal') return 'металл';
  return 'еда';
}

function handleInteract() {
  if (!gameState.running || gameState.paused) return;

  updateNearbyFlags();

  if (!gameState.inventory.hasWorkbench && gameState.nearBunker) {
    craftWorkbench();
    return;
  }

  if (gameState.inventory.hasWorkbench && gameState.nearWorkbench) {
    toggleCraftMenu();
  }
}

function craftWorkbench() {
  if (!canBuildWorkbench()) {
    setMessage('Для верстака нужно: дерево 3, металл 1.');
    return;
  }

  gameState.resources.wood -= 3;
  gameState.resources.metal -= 1;
  gameState.inventory.hasWorkbench = true;
  updateHud();
  setMessage('Верстак собран. Подойди ближе и нажми E.');
}

function toggleCraftMenu() {
  gameState.craftingOpen = !gameState.craftingOpen;
  craftMenu.classList.toggle('hidden', !gameState.craftingOpen);
  if (gameState.craftingOpen) {
    setMessage('Верстак открыт. Выбери действие.');
  }
}

function craftGun() {
  if (!gameState.inventory.hasWorkbench) return;
  if (gameState.inventory.hasGun) {
    setMessage('Пистолет уже собран.');
    return;
  }

  if (gameState.resources.wood < 1 || gameState.resources.metal < 3) {
    setMessage('Для пистолета нужно: дерево 1, металл 3.');
    return;
  }

  gameState.resources.wood -= 1;
  gameState.resources.metal -= 3;
  gameState.inventory.hasGun = true;
  updateHud();
  setMessage('Пистолет готов. Теперь сделай пули.');
}

function craftAmmo() {
  if (!gameState.inventory.hasWorkbench) return;

  if (gameState.resources.metal < 1) {
    setMessage('Для пуль нужен металл 1.');
    return;
  }

  gameState.resources.metal -= 1;
  gameState.inventory.ammo += 6;
  updateHud();
  setMessage('Пули сделаны: +6.');
}

function shoot() {
  if (!gameState.running || gameState.craftingOpen || gameState.paused) return;

  if (!gameState.inventory.hasGun) {
    setMessage('Сначала собери пистолет на верстаке.');
    return;
  }

  if (gameState.inventory.ammo <= 0) {
    setMessage('Нет пуль. Сделай их на верстаке.');
    return;
  }

  gameState.inventory.ammo -= 1;
  updateHud();

  const bullet = {
    x: gameState.player.x + gameState.player.width / 2 - 3,
    y: gameState.player.y + gameState.player.height / 2 - 3,
    width: 6,
    height: 6,
    speed: 300,
    dx: 0,
    dy: 0,
  };

  if (gameState.player.lastDirection === 'up') bullet.dy = -1;
  if (gameState.player.lastDirection === 'down') bullet.dy = 1;
  if (gameState.player.lastDirection === 'left') bullet.dx = -1;
  if (gameState.player.lastDirection === 'right') bullet.dx = 1;

  gameState.bullets.push(bullet);
}

function updateBullets(deltaTime) {
  const activeBullets = [];

  for (const bullet of gameState.bullets) {
    bullet.x += bullet.dx * bullet.speed * deltaTime;
    bullet.y += bullet.dy * bullet.speed * deltaTime;

    if (isOutOfMap(bullet)) continue;

    let hitZombie = false;
    for (let i = gameState.zombies.length - 1; i >= 0; i -= 1) {
      if (!isColliding(bullet, gameState.zombies[i])) continue;
      gameState.zombies.splice(i, 1);
      hitZombie = true;
      break;
    }

    if (!hitZombie) activeBullets.push(bullet);
  }

  gameState.bullets = activeBullets;

  if (gameState.victoryReady && gameState.zombies.length === 0) {
    triggerWin();
  }
}

function isOutOfMap(entity) {
  return (
    entity.x + entity.width < 0 ||
    entity.x > canvas.width ||
    entity.y + entity.height < 0 ||
    entity.y > canvas.height
  );
}

function startSiren() {
  if (gameState.sirenStarted) return;
  gameState.sirenStarted = true;
  setMessage('🚨 Сирена! Зомби идут.');
  sirenAlert.classList.remove('hidden');

  setTimeout(() => {
    sirenAlert.classList.add('hidden');
  }, 2000);
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

function spawnZombie() {
  gameState.zombies.push({
    x: Math.random() * (canvas.width - 20),
    y: 20 + Math.random() * 70,
    width: 20,
    height: 20,
    speed: 75,
  });
}

function keepZombieOutOfBunker(zombie) {
  if (!isColliding(zombie, gameState.bunker)) return;

  if (zombie.x < gameState.bunker.x) zombie.x = gameState.bunker.x - zombie.width;
  else if (zombie.x > gameState.bunker.x + gameState.bunker.width) zombie.x = gameState.bunker.x + gameState.bunker.width;
  else if (zombie.y < gameState.bunker.y) zombie.y = gameState.bunker.y - zombie.height;
  else zombie.y = gameState.bunker.y + gameState.bunker.height;
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

function updateMurlikHint() {
  if (!gameState.running) return;

  if (gameState.sirenStarted) {
    hintText.textContent = 'Мурлик: Сирена! Прячься в бункере или отбивайся.';
    return;
  }

  if (!gameState.inventory.hasWorkbench) {
    if (gameState.resources.wood < 3) {
      hintText.textContent = 'Мурлик: Нам нужно больше дерева. Ищи его в лесу.';
      return;
    }

    if (gameState.resources.metal < 1) {
      hintText.textContent = 'Мурлик: Металл пригодится для верстака. Поищи рядом с деревней.';
      return;
    }

    hintText.textContent = 'Мурлик: Возвращайся в бункер. Там можно собрать верстак.';
    return;
  }

  if (!gameState.inventory.hasGun) {
    hintText.textContent = 'Мурлик: Теперь на верстаке можно собрать пистолет.';
    return;
  }

  if (gameState.inventory.ammo <= 0) {
    hintText.textContent = 'Мурлик: Без пуль пистолет бесполезен. Сделай патроны.';
    return;
  }

  hintText.textContent = 'Мурлик: Отлично! Держись ближе к бункеру до Сирены.';
}

function triggerWin() {
  gameOver('win');
}

function gameOver(result) {
  gameState.running = false;
  gameState.craftingOpen = false;
  craftMenu.classList.add('hidden');

  if (result === 'win') {
    setMessage('🎉 Победа! Ты пережила Сирену и зачистила угрозу.');
  } else {
    setMessage('💀 Поражение! Зомби поймали Тюню вне бункера.');
  }
}

function setMessage(text) {
  statusMessage.textContent = text;
}

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
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
  drawResourceNodes();
  drawWorkbench();
  drawTyunya();
  drawBullets();
  drawZombies();
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = mapZones.forest.color;
  ctx.fillRect(mapZones.forest.x, mapZones.forest.y, mapZones.forest.width, mapZones.forest.height);

  ctx.fillStyle = mapZones.village.color;
  ctx.fillRect(mapZones.village.x, mapZones.village.y, mapZones.village.width, mapZones.village.height);

  ctx.fillStyle = mapZones.bunker.color;
  ctx.fillRect(mapZones.bunker.x, mapZones.bunker.y, mapZones.bunker.width, mapZones.bunker.height);

  ctx.fillStyle = '#464b55';
  ctx.fillRect(70, 300, 60, 70);

  if (gameState.sirenStarted) {
    ctx.fillStyle = 'rgba(180, 30, 30, 0.25)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawResourceNodes() {
  for (const node of gameState.resourceNodes) {
    if (!node.active) continue;
    if (node.type === 'wood') ctx.fillStyle = '#7f4f2a';
    if (node.type === 'metal') ctx.fillStyle = '#a6b1c3';
    if (node.type === 'food') ctx.fillStyle = '#f05d6f';
    ctx.fillRect(node.x, node.y, node.width, node.height);
  }
}

function drawWorkbench() {
  const spot = gameState.workbenchSpot;
  if (gameState.inventory.hasWorkbench) {
    ctx.fillStyle = '#9c6f3a';
    ctx.fillRect(spot.x, spot.y, spot.width, spot.height);
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.fillText('Верстак', spot.x - 2, spot.y - 8);
  } else {
    ctx.strokeStyle = '#d9e3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(spot.x, spot.y, spot.width, spot.height);
  }
}

function drawTyunya() {
  const player = gameState.player;
  ctx.fillStyle = '#ff9bc8';
  ctx.fillRect(player.x, player.y, player.width, player.height);

  ctx.fillStyle = '#1f2230';
  ctx.fillRect(player.x + 5, player.y + 6, 4, 4);
  ctx.fillRect(player.x + 15, player.y + 6, 4, 4);
}

function drawBullets() {
  for (const bullet of gameState.bullets) {
    ctx.fillStyle = '#ffd65a';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function drawZombies() {
  for (const zombie of gameState.zombies) {
    ctx.fillStyle = '#7ce38b';
    ctx.fillRect(zombie.x, zombie.y, zombie.width, zombie.height);
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
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === 'e') {
    event.preventDefault();
    if (gameState.craftingOpen) {
      toggleCraftMenu();
    } else {
      handleInteract();
    }
  }

  if (event.code === 'Space') {
    event.preventDefault();
    shoot();
  }

  if (key === 'p') {
    togglePause();
  }
}

function handleKeyUp(event) {
  keys[event.key.toLowerCase()] = false;
}

startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', restartGame);
craftGunButton.addEventListener('click', craftGun);
craftAmmoButton.addEventListener('click', craftAmmo);
craftCloseButton.addEventListener('click', toggleCraftMenu);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

hintText.textContent = 'Мурлик: Собери дерево и металл для верстака.';
