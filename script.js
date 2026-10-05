const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const stateEl = document.getElementById('state');
const bestEl = document.getElementById('snake-best');
const heartsEl = document.getElementById('hearts');

const CELL = 24;
const COLS = canvas.width / CELL;
const ROWS = canvas.height / CELL;
const TICK_MS = 150;
const MAX_HEARTS = 3;

const STATES = {
    READY: 'PRONTO',
    PLAYING: 'JOGANDO',
    PAUSED: 'PAUSADO',
    OVER: 'GAME OVER'
};

let state = STATES.READY;
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 10, y: 10, golden: false };
let enemy = { x: 2, y: 2 };
let score = 0;
let hearts = MAX_HEARTS;
let acc = 0;
let last = 0;
let enemyMoveCounter = 0;
let best = Number(localStorage.getItem('snake-best') || 0);
bestEl.textContent = best;

// Manchas decorativas fixas do cenário.
const stains = Array.from({ length: 30 }, (_, i) => ({
    x: ((i * 37 + 23) % canvas.width),
    y: ((i * 71 + 41) % canvas.height),
    r: 5 + ((i * 13) % 13),
    rotation: ((i * 29) % 360) * Math.PI / 180
}));

function reset() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);

    snake = [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY }
    ];

    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    hearts = MAX_HEARTS;
    enemyMoveCounter = 0;

    scoreEl.textContent = score;
    updateHearts();
    spawnApple();
    spawnEnemy();
    state = STATES.READY;
    stateEl.textContent = state;
}

function updateHearts() {
    heartsEl.textContent = '❤️'.repeat(hearts) + '🖤'.repeat(MAX_HEARTS - hearts);
}

function occupiedBySnake(x, y) {
    return snake.some(segment => segment.x === x && segment.y === y);
}

function spawnApple() {
    let candidate;
    do {
        candidate = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS),
            golden: Math.random() < 0.15
        };
    } while (occupiedBySnake(candidate.x, candidate.y) || (candidate.x === enemy.x && candidate.y === enemy.y));

    food = candidate;
}

function spawnEnemy() {
    const safeDistance = 7;
    let candidate;

    do {
        candidate = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
        };
    } while (
        occupiedBySnake(candidate.x, candidate.y) ||
        Math.abs(candidate.x - snake[0].x) + Math.abs(candidate.y - snake[0].y) < safeDistance
    );

    enemy = candidate;
}

function setDirection(x, y) {
    if (dir.x + x === 0 && dir.y + y === 0) return;
    nextDir = { x, y };
}

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();

    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
        event.preventDefault();
    }

    if (key === 'arrowup' || key === 'w') setDirection(0, -1);
    if (key === 'arrowdown' || key === 's') setDirection(0, 1);
    if (key === 'arrowleft' || key === 'a') setDirection(-1, 0);
    if (key === 'arrowright' || key === 'd') setDirection(1, 0);

    if (key === 'r') {
        reset();
        return;
    }

    if (key === ' ') {
        if (state === STATES.PLAYING) state = STATES.PAUSED;
        else if (state === STATES.PAUSED || state === STATES.READY) state = STATES.PLAYING;
        stateEl.textContent = state;
    }

    if (state === STATES.READY && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        state = STATES.PLAYING;
        stateEl.textContent = state;
    }
});

function loseHeart(reason) {
    hearts -= 1;
    updateHearts();

    if (hearts <= 0) {
        state = STATES.OVER;
        stateEl.textContent = STATES.OVER;
        saveBest();
        return;
    }

    // Após o dano, recoloca a cobra no centro para dar uma nova chance.
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
        { x: midX, y: midY },
        { x: midX - 1, y: midY },
        { x: midX - 2, y: midY }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    spawnEnemy();

    // Evita deixar a maçã em cima da nova posição.
    if (occupiedBySnake(food.x, food.y)) spawnApple();

    state = STATES.PLAYING;
    stateEl.textContent = `${reason} • VIDA PERDIDA`;
}

function saveBest() {
    if (score > best) {
        best = score;
        localStorage.setItem('snake-best', String(best));
        bestEl.textContent = best;
    }
}

function moveEnemy() {
    // O perseguidor anda a cada 2 ticks e escolhe o eixo que mais aproxima da cabeça.
    const head = snake[0];
    const dx = head.x - enemy.x;
    const dy = head.y - enemy.y;
    const options = [];

    if (Math.abs(dx) >= Math.abs(dy)) {
        if (dx !== 0) options.push({ x: Math.sign(dx), y: 0 });
        if (dy !== 0) options.push({ x: 0, y: Math.sign(dy) });
    } else {
        if (dy !== 0) options.push({ x: 0, y: Math.sign(dy) });
        if (dx !== 0) options.push({ x: Math.sign(dx), y: 0 });
    }

    options.push({ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 });

    for (const move of options) {
        const nx = enemy.x + move.x;
        const ny = enemy.y + move.y;
        if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
            enemy = { x: nx, y: ny };
            break;
        }
    }
}

function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS;

    if (hitWall) {
        loseHeart('PAREDE');
        return;
    }

    const hitBody = snake.some((segment, index) => index > 0 && segment.x === head.x && segment.y === head.y);
    if (hitBody) {
        loseHeart('CORPO');
        return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += food.golden ? 10 : 1;
        scoreEl.textContent = score;
        spawnApple();
    } else {
        snake.pop();
    }

    enemyMoveCounter += 1;
    if (enemyMoveCounter >= 2) {
        enemyMoveCounter = 0;
        moveEnemy();
    }

    const enemyHit = enemy.x === head.x && enemy.y === head.y;
    if (enemyHit) {
        loseHeart('O QUADRADO TE PEGOU');
        return;
    }
}

function drawBackground() {
    ctx.fillStyle = '#16833c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pequenas manchas verde-escuras espalhadas pelo campo.
    for (const stain of stains) {
        ctx.save();
        ctx.translate(stain.x, stain.y);
        ctx.rotate(stain.rotation);
        ctx.fillStyle = 'rgba(5, 73, 31, 0.42)';
        ctx.beginPath();
        ctx.ellipse(0, 0, stain.r * 1.35, stain.r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawApple() {
    const cx = food.x * CELL + CELL / 2;
    const cy = food.y * CELL + CELL / 2 + 1;

    ctx.fillStyle = food.golden ? '#facc15' : '#ef4444';
    ctx.beginPath();
    ctx.arc(cx - 5, cy + 1, 7, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy + 1, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#854d0e';
    ctx.fillRect(cx - 1, cy - 11, 3, 7);

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(cx + 5, cy - 9, 5, 2.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawEnemy() {
    const x = enemy.x * CELL + 3;
    const y = enemy.y * CELL + 3;
    ctx.fillStyle = '#050505';
    ctx.fillRect(x, y, CELL - 6, CELL - 6);
}

function drawSnakeSegment(segment, index) {
    const pad = index === 0 ? 2 : 3;
    const x = segment.x * CELL + pad;
    const y = segment.y * CELL + pad;
    const size = CELL - pad * 2;

    ctx.fillStyle = index === 0 ? '#4ade80' : '#22c55e';
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
}

function drawSnakeEyes() {
    const head = snake[0];
    const baseX = head.x * CELL + CELL / 2;
    const baseY = head.y * CELL + CELL / 2;

    let eyeOffsetX = 5;
    let eyeOffsetY = 5;
    if (dir.x === 1) eyeOffsetX = 7;
    if (dir.x === -1) eyeOffsetX = -7;
    if (dir.y === 1) eyeOffsetY = 7;
    if (dir.y === -1) eyeOffsetY = -7;

    const side = dir.x !== 0 ? 5 : 5;
    const eyes = dir.x !== 0
        ? [{ x: baseX + eyeOffsetX, y: baseY - side }, { x: baseX + eyeOffsetX, y: baseY + side }]
        : [{ x: baseX - side, y: baseY + eyeOffsetY }, { x: baseX + side, y: baseY + eyeOffsetY }];

    for (const eye of eyes) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(eye.x, eye.y, 1.7, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawOverlay() {
    if (state === STATES.PLAYING) return;

    ctx.fillStyle = 'rgba(2, 44, 23, 0.62)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Segoe UI';
    ctx.fillText(state, canvas.width / 2, canvas.height / 2 - 8);

    ctx.font = '16px Segoe UI';
    const message = state === STATES.OVER
        ? 'Pressione R para reiniciar'
        : 'Pressione ESPAÇO ou uma seta para jogar';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 28);
}

function draw() {
    drawBackground();
    drawApple();
    drawEnemy();

    snake.forEach(drawSnakeSegment);
    drawSnakeEyes();
    drawOverlay();
}

function loop(timestamp) {
    const dt = last ? timestamp - last : 0;
    last = timestamp;

    if (state === STATES.PLAYING) {
        acc += dt;
        while (acc >= TICK_MS) {
            tick();
            acc -= TICK_MS;
            if (state !== STATES.PLAYING) break;
        }
    }

    draw();
    requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);
