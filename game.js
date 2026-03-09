const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');

const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');
const dayCounter = document.getElementById('day-counter');
const hintText = document.getElementById('murlik-hint');
const dayTime = document.getElementById('day-time');
const woodCount = document.getElementById('wood-count');
const metalCount = document.getElementById('metal-count');
const foodCount = document.getElementById('food-count');
const workbenchState = document.getElementById('workbench-state');
const gunState = document.getElementById('gun-state');
const ammoCount = document.getElementById('ammo-count');

const craftMenu = document.getElementById('craft-menu');
const craftWorkbenchButton = document.getElementById('craft-workbench');
const craftGunButton = document.getElementById('craft-gun');
const craftAmmoButton = document.getElementById('craft-ammo');
const craftCloseButton = document.getElementById('craft-close');

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
  forest: { x: 0, y: 0, width: 640, height: 130, color: '#4d7f42' },
  village: { x: 430, y: 210, width: 210, height: 190, color: '#c9b180' },
  bunker: { x: 20, y: 240, width: 180, height: 160, color: '#6b6f79' },
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
  bullets: [],
  hitEffects: [],
  spawnTimer: 0,
  craftingOpen: false,
  nearWorkbench: false,
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
    lastDirection: 'right',
  },
  bunker: { x: 30, y: 260, width: 140, height: 110 },
  workbenchSpot: { x: 52, y: 286, width: 48, height: 38 },
  resources: { wood: 0, metal: 0, food: 0 },
  inventory: { hasWorkbench: false, hasGun: false, ammo: 0 },
  resourceNodes: [],
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
  setMessage('Собирай ресурсы в лесу и деревне. Подготовься до Сирены.');
  statusMessage.textContent = 'Собирай ресурсы и держись ближе к бункеру.';
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  gameState.day = 1;
  gameState.dayProgress = 0;
  gameState.sirenStarted = false;
  gameState.zombies = [];
  gameState.bullets = [];
  gameState.hitEffects = [];
  gameState.spawnTimer = 0;
  gameState.craftingOpen = false;
  gameState.nearWorkbench = false;
  gameState.player.x = 80;
  gameState.player.y = 300;
  gameState.player.lastDirection = 'right';
  gameState.resources.wood = 0;
  gameState.resources.metal = 0;
  gameState.resources.food = 0;
  gameState.inventory.hasWorkbench = false;
  gameState.inventory.hasGun = false;
  gameState.inventory.ammo = 0;
  gameState.resourceNodes = createResourceNodes();
  closeCraftingMenu();
}

function update(deltaTime) {
  if (!gameState.craftingOpen) {
    updatePlayerMovement(deltaTime);
  }

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
  collectResources();
  updateWorkbenchHint();
  updateBullets(deltaTime);
  updateHitEffects(deltaTime);

  if (gameState.sirenStarted) {
    updateZombies(deltaTime);
    checkLoseState();
  }
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
  woodCount.textContent = String(gameState.resources.wood);
  metalCount.textContent = String(gameState.resources.metal);
  foodCount.textContent = String(gameState.resources.food);
  workbenchState.textContent = gameState.inventory.hasWorkbench ? 'есть' : 'нет';
  gunState.textContent = gameState.inventory.hasGun ? 'есть' : 'нет';
  ammoCount.textContent = String(gameState.inventory.ammo);
}

function collectResources() {
  for (const node of gameState.resourceNodes) {
    if (!node.active) continue;
    if (!isColliding(gameState.player, node)) continue;

    node.active = false;
    gameState.resources[node.type] += 1;

    const resourceNames = {
      wood: 'дерево',
      metal: 'металл',
      food: 'еда',
    };

    setMessage(`Собран ресурс: ${resourceNames[node.type]}.`);
    updateHud();
  }
}

function updateWorkbenchHint() {
  gameState.nearWorkbench = isColliding(gameState.player, gameState.workbenchSpot);

  if (!gameState.nearWorkbench || gameState.craftingOpen) {
    return;
  }

  if (gameState.inventory.hasWorkbench) {
    setMessage('Нажми E, чтобы использовать верстак.');
  } else {
    setMessage('Нажми E, чтобы собрать верстак.');
  }
}

function openCraftingMenu() {
  if (!gameState.nearWorkbench || !gameState.running) return;

  gameState.craftingOpen = true;
  craftMenu.classList.remove('hidden');
  refreshCraftButtons();

  if (gameState.inventory.hasWorkbench) {
    setMessage('Выбери предмет для крафта.');
  } else {
    setMessage('Сначала собери верстак.');
  }
}

function closeCraftingMenu() {
  gameState.craftingOpen = false;
  craftMenu.classList.add('hidden');
}

function refreshCraftButtons() {
  const hasWorkbench = gameState.inventory.hasWorkbench;

  craftWorkbenchButton.disabled = hasWorkbench;
  craftGunButton.disabled = !hasWorkbench || gameState.inventory.hasGun;
  craftAmmoButton.disabled = !hasWorkbench;
}

function craftWorkbench() {
  if (gameState.inventory.hasWorkbench) {
    setMessage('Верстак уже собран.');
    return;
  }

  if (gameState.resources.wood < 3 || gameState.resources.metal < 1) {
    setMessage('Не хватает ресурсов: нужно дерево x3 и металл x1.');
    return;
  }

  gameState.resources.wood -= 3;
  gameState.resources.metal -= 1;
  gameState.inventory.hasWorkbench = true;

  setMessage('Верстак собран! Теперь можно крафтить оружие и пули.');
  updateHud();
  refreshCraftButtons();
}

function craftGun() {
  if (!gameState.inventory.hasWorkbench) {
    setMessage('Сначала собери верстак.');
    return;
  }

  if (gameState.inventory.hasGun) {
    setMessage('Пистолет уже есть.');
    return;
  }

  if (gameState.resources.wood < 1 || gameState.resources.metal < 3) {
    setMessage('Не хватает ресурсов: нужно дерево x1 и металл x3.');
    return;
  }

  gameState.resources.wood -= 1;
  gameState.resources.metal -= 3;
  gameState.inventory.hasGun = true;

  setMessage('Пистолет готов! Нужны пули для стрельбы.');
  updateHud();
  refreshCraftButtons();
}

function craftAmmo() {
  if (!gameState.inventory.hasWorkbench) {
    setMessage('Сначала собери верстак.');
    return;
  }

  if (gameState.resources.metal < 1) {
    setMessage('Не хватает металла: нужно металл x1.');
    return;
  }

  gameState.resources.metal -= 1;
  gameState.inventory.ammo += 6;

  setMessage('Пули готовы: +6.');
  updateHud();
  refreshCraftButtons();
}

function shoot() {
  if (!gameState.running || gameState.craftingOpen) return;

  if (!gameState.inventory.hasGun) {
    setMessage('Сначала собери пистолет на верстаке.');
    return;
  }

  if (gameState.inventory.ammo <= 0) {
    setMessage('Нет пуль. Сделай пули на верстаке.');
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

    if (isOutOfMap(bullet)) {
      continue;
    }

    let hitZombie = false;

    for (let i = gameState.zombies.length - 1; i >= 0; i -= 1) {
      const zombie = gameState.zombies[i];
      if (!isColliding(bullet, zombie)) continue;

      gameState.zombies.splice(i, 1);
      gameState.hitEffects.push({ x: zombie.x + 8, y: zombie.y + 8, life: 0.25 });
      setMessage('Зомби повержен!');
      hitZombie = true;
      break;
    }

    if (!hitZombie) {
      activeBullets.push(bullet);
    }
  }

  gameState.bullets = activeBullets;
}

function updateHitEffects(deltaTime) {
  const effects = [];
  for (const effect of gameState.hitEffects) {
    effect.life -= deltaTime;
    if (effect.life > 0) effects.push(effect);
  }
  gameState.hitEffects = effects;
}

function isOutOfMap(entity) {
  return (
    entity.x + entity.width < 0 ||
    entity.x > canvas.width ||
    entity.y + entity.height < 0 ||
    entity.y > canvas.height
  );
  woodCounter.textContent = String(gameState.resources.wood);
  foodCounter.textContent = String(gameState.resources.food);
  metalCounter.textContent = String(gameState.resources.metal);
}

function startSiren() {
  if (gameState.sirenStarted) return;

  gameState.sirenStarted = true;
  setMessage('🚨 СИРЕНА! Зомби идут. Держись в бункере и отбивайся.');
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
  closeCraftingMenu();

  if (result === 'win') {
    setMessage('🎉 Победа! Ты продержалась до конца пятого дня!');
  } else {
    setMessage('💀 Поражение! Зомби поймали Тюню вне бункера.');
  }
}

function setMessage(text) {
  statusMessage.textContent = text;
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
  drawResourceNodes();
  drawWorkbench();
  drawTyunya();
  drawBullets();
  drawPickups();
  drawTyunya();

  if (gameState.paused) {
    drawPauseOverlay();
  }
  drawZombies();
  drawHitEffects();
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
  const { x, y, width, height } = gameState.workbenchSpot;

  if (gameState.inventory.hasWorkbench) {
    ctx.fillStyle = '#9c6f3a';
    ctx.fillRect(x, y, width, height);
    ctx.fillStyle = '#5d3e1d';
    ctx.fillRect(x + 3, y + 4, width - 6, 6);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText('Верстак', x - 2, y - 8);
  } else {
    ctx.strokeStyle = '#d9e3ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
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

function drawBullets() {
  for (const bullet of gameState.bullets) {
    ctx.fillStyle = '#ffd65a';
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
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

function drawHitEffects() {
  for (const effect of gameState.hitEffects) {
    const size = 12 * effect.life;
    ctx.fillStyle = 'rgba(255, 235, 150, 0.8)';
    ctx.fillRect(effect.x - size / 2, effect.y - size / 2, size, size);
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
      closeCraftingMenu();
    } else {
      openCraftingMenu();
    }
  }

  if (event.code === 'Space') {
    event.preventDefault();
    shoot();
  keys[event.key.toLowerCase()] = true;

  if (event.key.toLowerCase() === 'p') {
    togglePause();
  }
}

function handleKeyUp(event) {
  keys[event.key.toLowerCase()] = false;
}

startButton.addEventListener('click', startGame);
craftWorkbenchButton.addEventListener('click', craftWorkbench);
craftGunButton.addEventListener('click', craftGun);
craftAmmoButton.addEventListener('click', craftAmmo);
craftCloseButton.addEventListener('click', closeCraftingMenu);
pauseButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', restartGame);
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
