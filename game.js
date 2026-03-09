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
const ammoCount = document.getElementById('ammo-count');
const hintText = document.getElementById('murlik-hint');
const statusMessage = document.getElementById('status-message');

const craftMenu = document.getElementById('craft-menu');
const craftGunButton = document.getElementById('craft-gun');
const craftAmmoButton = document.getElementById('craft-ammo');
const craftCloseButton = document.getElementById('craft-close');

const sirenAlert = document.getElementById('siren-alert');
const sirenFlash = document.getElementById('siren-flash');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const keys = {};
const DAY_DURATION = 6;
const MAX_DAYS = 5;

const murlikHints = [
  'Мурлик: Собери припасы и держись ближе к бункеру.',
  'Мурлик: Темп быстрее, не откладывай крафт на потом.',
  'Мурлик: Лес богат деревом, но не теряй время.',
  'Мурлик: Пули решают всё после Сирены.',
  'Мурлик: Пятый день! К бункеру и не паникуй.',
];

const mapZones = {
  forest: { x: 0, y: 0, width: 940, height: 175, color: '#4d7f42' },
  village: { x: 600, y: 230, width: 300, height: 250, color: '#c9b180' },
  bunker: { x: 35, y: 315, width: 245, height: 180, color: '#6b6f79' },
};

const gameState = {
  running: false,
  paused: false,
  craftingOpen: false,
  nearWorkbench: false,
  lastTime: 0,
  day: 1,
  dayProgress: 0,
  hintTimer: 0,
  sirenStarted: false,
  spawnTimer: 0,
  resources: { wood: 0, metal: 0, food: 0 },
  inventory: { hasWorkbench: false, hasGun: false, ammo: 0 },
  player: {
    x: 120,
    y: 390,
    width: 24,
    height: 24,
    speed: 220,
    lastDirection: 'right',
  },
  bunker: { x: 55, y: 340, width: 180, height: 140 },
  workbenchSpot: { x: 95, y: 385, width: 60, height: 42 },
  resourceNodes: [],
  zombies: [],
  bullets: [],
  hitEffects: [],
};

function createResourceNodes() {
  return [
    { type: 'wood', x: 90, y: 55, width: 22, height: 22, active: true },
    { type: 'wood', x: 230, y: 80, width: 22, height: 22, active: true },
    { type: 'wood', x: 390, y: 62, width: 22, height: 22, active: true },
    { type: 'wood', x: 535, y: 115, width: 22, height: 22, active: true },
    { type: 'food', x: 670, y: 280, width: 22, height: 22, active: true },
    { type: 'food', x: 790, y: 340, width: 22, height: 22, active: true },
    { type: 'food', x: 865, y: 430, width: 22, height: 22, active: true },
    { type: 'metal', x: 300, y: 350, width: 22, height: 22, active: true },
    { type: 'metal', x: 560, y: 245, width: 22, height: 22, active: true },
    { type: 'metal', x: 640, y: 205, width: 22, height: 22, active: true },
  ];
}

function resetGameState() {
  gameState.running = true;
  gameState.paused = false;
  gameState.craftingOpen = false;
  gameState.nearWorkbench = false;
  gameState.day = 1;
  gameState.dayProgress = 0;
  gameState.hintTimer = 0;
  gameState.sirenStarted = false;
  gameState.spawnTimer = 0;
  gameState.resources = { wood: 0, metal: 0, food: 0 };
  gameState.inventory = { hasWorkbench: false, hasGun: false, ammo: 0 };
  gameState.player.x = 120;
  gameState.player.y = 390;
  gameState.player.lastDirection = 'right';
  gameState.resourceNodes = createResourceNodes();
  gameState.zombies = [];
  gameState.bullets = [];
  gameState.hitEffects = [];
  gameState.lastTime = performance.now();

  pauseButton.textContent = 'Пауза';
  gameScreen.classList.remove('is-paused');
  hintText.textContent = murlikHints[0];
  sirenAlert.classList.add('hidden');
  sirenFlash.classList.add('hidden');
  sirenFlash.classList.remove('active');
  setMessage('');
  closeCraftingMenu();
  updateHud();
}

function startGame() {
  startScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  resetGame();
  requestAnimationFrame(gameLoop);
}

function restartGame() {
  resetGameState();
}

function togglePause() {
  if (!gameState.running) return;
  gameState.paused = !gameState.paused;

  if (gameState.paused) {
    pauseButton.textContent = 'Продолжить';
    gameScreen.classList.add('is-paused');
    setMessage('Пауза. Нажми «Продолжить» или P.');
    return;
  }

  pauseButton.textContent = 'Пауза';
  gameState.lastTime = performance.now();
  setMessage('Игра продолжается.');
}

function gameLoop(timestamp) {
  if (!gameState.running) {
    draw();
    return;
  }

  if (!gameState.paused) {
    const deltaTime = Math.min((timestamp - gameState.lastTime) / 1000, 0.05);
    update(deltaTime);
    draw();
  }

  gameState.lastTime = timestamp;
  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  if (!gameState.craftingOpen) {
    updatePlayerMovement(deltaTime);
  }

  collectResources();
  updateDayTimer(deltaTime);
  updateHintRotation(deltaTime);
  updateWorkbenchHint();
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

function keepPlayerOnMap() {
  gameState.player.x = Math.max(0, Math.min(canvas.width - gameState.player.width, gameState.player.x));
  gameState.player.y = Math.max(0, Math.min(canvas.height - gameState.player.height, gameState.player.y));
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

function updateHintRotation(deltaTime) {
  gameState.hintTimer += deltaTime;

  if (gameState.hintTimer >= 8) {
    gameState.hintTimer = 0;
    const dayIndex = Math.max(0, Math.min(gameState.day - 1, murlikHints.length - 1));
    hintText.textContent = murlikHints[dayIndex];
  }
}

function collectResources() {
  for (const node of gameState.resourceNodes) {
    if (!node.active || !isColliding(gameState.player, node)) continue;

    node.active = false;
    gameState.resources[node.type] += 1;

    const names = { wood: 'дерево', metal: 'металл', food: 'еда' };
    setMessage(`Собрано: ${names[node.type]}.`);
    updateHud();
  }
}

function updateWorkbenchHint() {
  gameState.nearWorkbench = isColliding(gameState.player, gameState.workbenchSpot);

  if (gameState.craftingOpen || !gameState.nearWorkbench) return;

  if (gameState.inventory.hasWorkbench) {
    setMessage('Нажми E, чтобы открыть верстак.');
  } else {
    setMessage('Нажми E рядом с местом верстака.');
  }
}

function openCraftingMenu() {
  if (!gameState.running || !gameState.nearWorkbench) return;

  updateNearbyFlags();

  if (gameState.inventory.hasWorkbench) {
    setMessage('Выбери крафт.');
  } else {
    setMessage('Сначала собери верстак.');
  }

function closeCraftingMenu() {
  gameState.craftingOpen = false;
  craftMenu.classList.add('hidden');
}

function refreshCraftButtons() {
  craftWorkbenchButton.disabled = gameState.inventory.hasWorkbench;
  craftGunButton.disabled = !gameState.inventory.hasWorkbench || gameState.inventory.hasGun;
  craftAmmoButton.disabled = !gameState.inventory.hasWorkbench;
}

function craftWorkbench() {
  if (gameState.inventory.hasWorkbench) {
    setMessage('Верстак уже собран.');
    return;
  }
  if (gameState.resources.wood < 3 || gameState.resources.metal < 1) {
    setMessage('Нужно дерево x3 и металл x1.');
    return;
  }

  gameState.resources.wood -= 3;
  gameState.resources.metal -= 1;
  gameState.inventory.hasWorkbench = true;
  setMessage('Верстак готов.');
  updateHud();
  setMessage('Верстак собран. Подойди ближе и нажми E.');
}

function toggleCraftMenu() {
  gameState.craftingOpen = !gameState.craftingOpen;
  craftMenu.classList.toggle('hidden', !gameState.craftingOpen);
  if (gameState.craftingOpen) {
    setMessage('Верстак открыт. Выбери действие.');
  }
  if (gameState.inventory.hasGun) {
    setMessage('Пистолет уже собран.');
    return;
  }
  if (gameState.resources.wood < 1 || gameState.resources.metal < 3) {
    setMessage('Нужно дерево x1 и металл x3.');
    return;
  }

  gameState.resources.wood -= 1;
  gameState.resources.metal -= 3;
  gameState.inventory.hasGun = true;
  setMessage('Пистолет собран!');
  updateHud();
  setMessage('Пистолет готов. Теперь сделай пули.');
}

function craftAmmo() {
  if (!gameState.inventory.hasWorkbench) {
    setMessage('Сначала собери верстак.');
    return;
  }
  if (gameState.resources.metal < 1) {
    setMessage('Нужен металл x1.');
    return;
  }

  gameState.resources.metal -= 1;
  gameState.inventory.ammo += 6;
  setMessage('Пули: +6.');
  updateHud();
  setMessage('Пули сделаны: +6.');
}

function shoot() {
  if (!gameState.running || gameState.craftingOpen) return;
  if (!gameState.inventory.hasGun) {
    setMessage('Сначала собери пистолет.');
    return;
  }
  if (gameState.inventory.ammo <= 0) {
    setMessage('Нет пуль.');
    return;
  }

  gameState.inventory.ammo -= 1;
  updateHud();

  const bullet = {
    x: gameState.player.x + gameState.player.width / 2 - 3,
    y: gameState.player.y + gameState.player.height / 2 - 3,
    width: 6,
    height: 6,
    speed: 340,
    dx: 0,
    dy: 0,
  };

  if (gameState.player.lastDirection === 'up') bullet.dy = -1;
  if (gameState.player.lastDirection === 'down') bullet.dy = 1;
  if (gameState.player.lastDirection === 'left') bullet.dx = -1;
  if (gameState.player.lastDirection === 'right') bullet.dx = 1;

  if (bullet.dx === 0 && bullet.dy === 0) {
    bullet.dx = 1;
  }

  gameState.bullets.push(bullet);
}

function updateBullets(deltaTime) {
  const aliveBullets = [];

  for (const bullet of gameState.bullets) {
    bullet.x += bullet.dx * bullet.speed * deltaTime;
    bullet.y += bullet.dy * bullet.speed * deltaTime;

    if (isOutOfMap(bullet)) continue;

    let hitZombie = false;
    for (let i = gameState.zombies.length - 1; i >= 0; i -= 1) {
      if (!isColliding(bullet, gameState.zombies[i])) continue;

      const zombie = gameState.zombies[i];
      gameState.zombies.splice(i, 1);
      gameState.hitEffects.push({ x: zombie.x + 10, y: zombie.y + 10, life: 0.25 });
      setMessage('Зомби повержен!');
      hitZombie = true;
      break;
    }

    if (!hitZombie) {
      aliveBullets.push(bullet);
    }
  }

  gameState.bullets = aliveBullets;
}

function updateHitEffects(deltaTime) {
  const aliveEffects = [];

  for (const effect of gameState.hitEffects) {
    effect.life -= deltaTime;
    if (effect.life > 0) aliveEffects.push(effect);
  }

  gameState.hitEffects = aliveEffects;
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
  setMessage('🚨 СИРЕНА! Беги в бункер!');
  sirenAlert.classList.remove('hidden');

  setTimeout(() => {
    sirenAlert.classList.add('hidden');
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
  oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(860, audioContext.currentTime + 0.3);
  oscillator.frequency.linearRampToValueAtTime(500, audioContext.currentTime + 0.6);

  gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.65);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.65);
  oscillator.onended = () => audioContext.close();
}

function updateZombies(deltaTime) {
  gameState.spawnTimer -= deltaTime;
  if (gameState.spawnTimer <= 0) {
    spawnZombie();
    gameState.spawnTimer = 1.4;
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
  const side = Math.floor(Math.random() * 3);
  const zombie = { width: 20, height: 20, speed: 82 };

  if (side === 0) {
    zombie.x = Math.random() * (canvas.width - zombie.width);
    zombie.y = 8;
  } else if (side === 1) {
    zombie.x = canvas.width - zombie.width - 8;
    zombie.y = 160 + Math.random() * (canvas.height - 200);
  } else {
    zombie.x = 300 + Math.random() * (canvas.width - 320);
    zombie.y = canvas.height - zombie.height - 8;
  }

  gameState.zombies.push(zombie);
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
    zombie.x = dx > 0 ? gameState.bunker.x + gameState.bunker.width : gameState.bunker.x - zombie.width;
  } else {
    zombie.y = dy > 0 ? gameState.bunker.y + gameState.bunker.height : gameState.bunker.y - zombie.height;
  }
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

function isColliding(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function setMessage(text) {
  statusMessage.textContent = text;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap();
  drawResourceNodes();
  drawWorkbenchSpot();
  drawBullets();
  drawZombies();
  drawHitEffects();
  drawPlayer();
}

function drawMap() {
  drawZone(mapZones.forest, 'Лес');
  drawZone(mapZones.village, 'Деревня');
  drawZone(mapZones.bunker, 'Бункер');

  ctx.strokeStyle = '#b9c4e4';
  ctx.lineWidth = 2;
  ctx.strokeRect(gameState.bunker.x, gameState.bunker.y, gameState.bunker.width, gameState.bunker.height);
}

function drawZone(zone, label) {
  ctx.fillStyle = zone.color;
  ctx.fillRect(zone.x, zone.y, zone.width, zone.height);

  ctx.fillStyle = '#1f2230';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(label, zone.x + 12, zone.y + 28);
}

function drawResourceNodes() {
  for (const node of gameState.resourceNodes) {
    if (!node.active) continue;

    if (node.type === 'wood') ctx.fillStyle = '#8f5e30';
    if (node.type === 'food') ctx.fillStyle = '#e6c652';
    if (node.type === 'metal') ctx.fillStyle = '#b8beca';

    ctx.fillRect(node.x, node.y, node.width, node.height);
    ctx.fillStyle = '#1f2230';
    ctx.font = 'bold 12px Arial';
    const text = node.type === 'wood' ? 'Д' : node.type === 'food' ? 'Е' : 'М';
    ctx.fillText(text, node.x + 6, node.y + 15);
  }
}

function drawWorkbenchSpot() {
  ctx.fillStyle = '#503a2a';
  ctx.fillRect(
    gameState.workbenchSpot.x,
    gameState.workbenchSpot.y,
    gameState.workbenchSpot.width,
    gameState.workbenchSpot.height,
  );

  ctx.fillStyle = '#f4f7ff';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Верстак', gameState.workbenchSpot.x + 5, gameState.workbenchSpot.y + 24);
}

function drawPlayer() {
  ctx.fillStyle = '#4ba3ff';
  ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(gameState.player.x + 5, gameState.player.y + 5, 5, 5);
  ctx.fillRect(gameState.player.x + 14, gameState.player.y + 5, 5, 5);
}

function drawZombies() {
  ctx.fillStyle = '#8cd15f';
  for (const zombie of gameState.zombies) {
    ctx.fillRect(zombie.x, zombie.y, zombie.width, zombie.height);
  }
}

function drawBullets() {
  ctx.fillStyle = '#ffcb3d';
  for (const bullet of gameState.bullets) {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  }
}

function drawHitEffects() {
  for (const effect of gameState.hitEffects) {
    ctx.fillStyle = 'rgba(255, 120, 120, 0.8)';
    ctx.beginPath();
    ctx.arc(effect.x, effect.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (key === 'e') {
    if (gameState.craftingOpen) {
      toggleCraftMenu();
    } else {
      handleInteract();
    }
  }

  if (key === ' ') {
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
craftWorkbenchButton.addEventListener('click', craftWorkbench);
craftGunButton.addEventListener('click', craftGun);
craftAmmoButton.addEventListener('click', craftAmmo);
craftCloseButton.addEventListener('click', closeCraftingMenu);
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);

updateHud();
