const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const speedLabel = document.getElementById("speedLabel");
const overlay = document.getElementById("overlay");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");

const gridSize = 24;
const tileCount = canvas.width / gridSize;
const startSpeed = 150;
const minSpeed = 72;

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem("snakeBestScore") || 0);
let gameTimer = null;
let gameOver = false;
let paused = false;
let tickSpeed = startSpeed;

bestScoreEl.textContent = bestScore;

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  tickSpeed = startSpeed;
  gameOver = false;
  paused = false;
  food = createFood();
  updateHud();
  draw();
}

function startGame() {
  resetGame();
  overlay.classList.add("hidden");
  pauseButton.textContent = "暂停";
  runTimer();
}

function runTimer() {
  clearInterval(gameTimer);
  gameTimer = setInterval(moveSnake, tickSpeed);
}

function moveSnake() {
  if (paused || gameOver) return;

  direction = nextDirection;
  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const willEat = head.x === food.x && head.y === food.y;

  if (hitWall(head) || hitSelf(head, willEat)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (willEat) {
    score += 10;
    tickSpeed = Math.max(minSpeed, startSpeed - Math.floor(score / 30) * 10);
    food = createFood();
    updateHud();
    runTimer();
  } else {
    snake.pop();
  }

  draw();
}

function setDirection(newDirection) {
  const isOpposite =
    newDirection.x + direction.x === 0 &&
    newDirection.y + direction.y === 0;

  if (!isOpposite) {
    nextDirection = newDirection;
  }
}

function createFood() {
  let nextFood;

  do {
    nextFood = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some((part) => part.x === nextFood.x && part.y === nextFood.y));

  return nextFood;
}

function hitWall(head) {
  return head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
}

function hitSelf(head, willEat) {
  const body = willEat ? snake : snake.slice(0, -1);
  return body.some((part) => part.x === head.x && part.y === head.y);
}

function updateHud() {
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  speedLabel.textContent = `${Math.round((startSpeed / tickSpeed) * 10) / 10}x`;
}

function endGame() {
  gameOver = true;
  clearInterval(gameTimer);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snakeBestScore", String(bestScore));
  }

  updateHud();
  overlay.classList.remove("hidden");
  overlay.querySelector("h1").textContent = "游戏结束";
  overlay.querySelector("p").textContent = `本局得分 ${score}，再来一把？`;
  startButton.textContent = "重新开始";
}

function draw() {
  ctx.fillStyle = "#cdddbf";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= tileCount; i += 1) {
    const pos = i * gridSize;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? "#123f2c" : "#256f48";
    roundRect(part.x * gridSize + 2, part.y * gridSize + 2, gridSize - 4, gridSize - 4, 6);
  });
}

function drawFood() {
  const centerX = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;

  ctx.fillStyle = "#e24a3b";
  ctx.beginPath();
  ctx.arc(centerX, centerY, gridSize * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();
}

function togglePause() {
  if (gameOver || overlay.classList.contains("hidden") === false) return;

  paused = !paused;
  pauseButton.textContent = paused ? "继续" : "暂停";
}

document.addEventListener("keydown", (event) => {
  const keys = {
    ArrowUp: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 }
  };

  if (event.key === " ") {
    event.preventDefault();
    togglePause();
  }

  if (keys[event.key]) {
    event.preventDefault();
    setDirection(keys[event.key]);
  }
});

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (event) => {
  const touch = event.changedTouches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}, { passive: true });

canvas.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    setDirection(deltaX > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
  } else {
    setDirection(deltaY > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
  }
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => {
    const directions = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 }
    };

    setDirection(directions[button.dataset.dir]);
  });
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);

resetGame();

