// ===== RETRO TETRIS - Jogo Completo =====

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// Cores retrô das peças
const COLORS = [
    null,
    '#00d9ff', // I - Cyan
    '#ffe66d', // O - Yellow
    '#a66cff', // T - Purple
    '#4ecca3', // S - Green
    '#e94560', // Z - Red/Pink
    '#3a86ff', // J - Blue
    '#ff9f1c'  // L - Orange
];

// Formas das peças (matriz de rotação)
const SHAPES = [
    null,
    // I
    [
        [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
        [[0,0,1,0], [0,0,1,0], [0,0,1,0], [0,0,1,0]],
        [[0,0,0,0], [0,0,0,0], [1,1,1,1], [0,0,0,0]],
        [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]]
    ],
    // O
    [
        [[0,2,2,0], [0,2,2,0], [0,0,0,0], [0,0,0,0]],
        [[0,2,2,0], [0,2,2,0], [0,0,0,0], [0,0,0,0]],
        [[0,2,2,0], [0,2,2,0], [0,0,0,0], [0,0,0,0]],
        [[0,2,2,0], [0,2,2,0], [0,0,0,0], [0,0,0,0]]
    ],
    // T
    [
        [[0,3,0,0], [3,3,3,0], [0,0,0,0], [0,0,0,0]],
        [[0,3,0,0], [0,3,3,0], [0,3,0,0], [0,0,0,0]],
        [[0,0,0,0], [3,3,3,0], [0,3,0,0], [0,0,0,0]],
        [[0,3,0,0], [3,3,0,0], [0,3,0,0], [0,0,0,0]]
    ],
    // S
    [
        [[0,4,4,0], [4,4,0,0], [0,0,0,0], [0,0,0,0]],
        [[0,4,0,0], [0,4,4,0], [0,0,4,0], [0,0,0,0]],
        [[0,0,0,0], [0,4,4,0], [4,4,0,0], [0,0,0,0]],
        [[4,0,0,0], [4,4,0,0], [0,4,0,0], [0,0,0,0]]
    ],
    // Z
    [
        [[5,5,0,0], [0,5,5,0], [0,0,0,0], [0,0,0,0]],
        [[0,0,5,0], [0,5,5,0], [0,5,0,0], [0,0,0,0]],
        [[0,0,0,0], [5,5,0,0], [0,5,5,0], [0,0,0,0]],
        [[0,5,0,0], [5,5,0,0], [5,0,0,0], [0,0,0,0]]
    ],
    // J
    [
        [[6,0,0,0], [6,6,6,0], [0,0,0,0], [0,0,0,0]],
        [[0,6,6,0], [0,6,0,0], [0,6,0,0], [0,0,0,0]],
        [[0,0,0,0], [6,6,6,0], [0,0,6,0], [0,0,0,0]],
        [[0,6,0,0], [0,6,0,0], [6,6,0,0], [0,0,0,0]]
    ],
    // L
    [
        [[0,0,7,0], [7,7,7,0], [0,0,0,0], [0,0,0,0]],
        [[0,7,0,0], [0,7,0,0], [0,7,7,0], [0,0,0,0]],
        [[0,0,0,0], [7,7,7,0], [7,0,0,0], [0,0,0,0]],
        [[7,7,0,0], [0,7,0,0], [0,7,0,0], [0,0,0,0]]
    ]
];

// Elementos DOM
const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');

const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const highscoreEl = document.getElementById('highscore');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');

// Estado do jogo
let board = [];
let current = null;
let next = null;
let score = 0;
let lines = 0;
let level = 1;
let highscore = parseInt(localStorage.getItem('retroTetrisHigh') || '0');
let dropInterval = 1000;
let lastDrop = 0;
let isPlaying = false;
let isPaused = false;
let isClearing = false;
let animationId = null;

function pad(num, size) {
    let s = String(num);
    while (s.length < size) s = '0' + s;
    return s;
}

highscoreEl.textContent = pad(highscore, 6);

// ===== FUNÇÕES DE TABULEIRO =====
function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
    // Bloco sólido estilo 8-bit
    ctx.fillStyle = color;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);

    // Highlight superior/esquerda (pixel art)
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, 3);
    ctx.fillRect(x * size + 1, y * size + 1, 3, size - 2);

    // Sombra inferior/direita
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x * size + size - 4, y * size + 1, 3, size - 2);
    ctx.fillRect(x * size + 1, y * size + size - 4, size - 2, 3);
}

function drawBoard() {
    ctx.fillStyle = '#05050a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grade sutil
    ctx.strokeStyle = 'rgba(0, 217, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(canvas.width, y * BLOCK_SIZE);
        ctx.stroke();
    }

    // Blocos fixos
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                drawBlock(ctx, x, y, COLORS[board[y][x]]);
            }
        }
    }

    // Peça atual
    if (current) {
        const shape = SHAPES[current.type][current.rotation];
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    drawBlock(ctx, current.x + x, current.y + y, COLORS[current.type]);
                }
            }
        }
        
        // Ghost piece (sombra de queda)
        const ghostY = getGhostY();
        ctx.globalAlpha = 0.25;
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                if (shape[y][x]) {
                    drawBlock(ctx, current.x + x, ghostY + y, COLORS[current.type]);
                }
            }
        }
        ctx.globalAlpha = 1;
    }
}

function drawNext() {
    // Limpa completamente o canvas (corrige o bug da peça anterior não sumir)
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    nextCtx.fillStyle = '#0a0a12';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (!next) return;

    const shape = SHAPES[next][0];
    const size = 24;
    // Centralizar
    let minX = 4, maxX = 0, minY = 4, maxY = 0;
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (shape[y][x]) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }
    }
    const offsetX = (nextCanvas.width - (maxX - minX + 1) * size) / 2 - minX * size;
    const offsetY = (nextCanvas.height - (maxY - minY + 1) * size) / 2 - minY * size;

    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (shape[y][x]) {
                nextCtx.fillStyle = COLORS[next];
                nextCtx.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, size - 2);
                
                nextCtx.fillStyle = 'rgba(255,255,255,0.35)';
                nextCtx.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, size - 2, 3);
                nextCtx.fillRect(offsetX + x * size + 1, offsetY + y * size + 1, 3, size - 2);
            }
        }
    }
}

// ===== LÓGICA DAS PEÇAS =====
function randomPiece() {
    return Math.floor(Math.random() * 7) + 1;
}

function spawnPiece() {
    current = {
        type: next || randomPiece(),
        x: 3,
        y: 0,
        rotation: 0
    };
    next = randomPiece();
    drawNext();

    if (collision(current.x, current.y, current.rotation)) {
        gameOver();
    }
}

function collision(nx, ny, rotation) {
    const shape = SHAPES[current.type][rotation];
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (shape[y][x]) {
                const boardX = nx + x;
                const boardY = ny + y;
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
                if (boardY >= 0 && board[boardY][boardX]) return true;
            }
        }
    }
    return false;
}

function getGhostY() {
    let y = current.y;
    while (!collision(current.x, y + 1, current.rotation)) {
        y++;
    }
    return y;
}

function mergePiece() {
    const shape = SHAPES[current.type][current.rotation];
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            if (shape[y][x]) {
                const boardY = current.y + y;
                if (boardY >= 0) {
                    board[boardY][current.x + x] = current.type;
                }
            }
        }
    }
}

function clearLines() {
    // Encontra as linhas completas
    const fullRows = [];
    for (let y = 0; y < ROWS; y++) {
        if (board[y].every(cell => cell !== 0)) {
            fullRows.push(y);
        }
    }

    if (fullRows.length === 0) {
        spawnPiece();
        updateUI();
        return;
    }

    // Inicia o efeito de flash
    isClearing = true;
    let flashCount = 0;
    const maxFlashes = 6; // quantas vezes pisca

    function flashEffect() {
        flashCount++;

        // Alterna entre branco e a cor original
        const flashOn = flashCount % 2 === 1;

        drawBoard();

        // Desenha o flash nas linhas completas
        if (flashOn) {
            ctx.fillStyle = '#ffffff';
            fullRows.forEach(y => {
                ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, BLOCK_SIZE);
            });
            // Borda amarela no flash (efeito retrô)
            ctx.fillStyle = '#ffe66d';
            fullRows.forEach(y => {
                ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, 3);
                ctx.fillRect(0, (y + 1) * BLOCK_SIZE - 3, canvas.width, 3);
            });
        }

        if (flashCount < maxFlashes) {
            setTimeout(flashEffect, 60); // velocidade do piscar
        } else {
            // Remove as linhas de verdade
            let cleared = fullRows.length;

            // Remove de baixo para cima para não bagunçar os índices
            for (let i = fullRows.length - 1; i >= 0; i--) {
                board.splice(fullRows[i], 1);
                board.unshift(Array(COLS).fill(0));
            }

            // Pontuação clássica
            const points = [0, 100, 300, 500, 800];
            score += points[cleared] * level;
            lines += cleared;

            isClearing = false;
            updateUI(); // updateUI cuida do nível e velocidade
            spawnPiece();
            drawBoard();
        }
    }

    flashEffect();
}

function hardDrop() {
    if (isClearing) return;
    while (!collision(current.x, current.y + 1, current.rotation)) {
        current.y++;
        score += 2;
    }
    lockPiece();
}

function lockPiece() {
    if (isClearing) return;
    mergePiece();
    clearLines(); // clearLines cuida de spawnPiece e updateUI
}

// ===== CONTROLES =====
function move(dx) {
    if (!isPlaying || isPaused || isClearing) return;
    if (!collision(current.x + dx, current.y, current.rotation)) {
        current.x += dx;
    }
}

function softDrop() {
    if (!isPlaying || isPaused || isClearing) return;
    if (!collision(current.x, current.y + 1, current.rotation)) {
        current.y++;
        score += 1;
        updateUI();
    } else {
        lockPiece();
    }
}

function rotate() {
    if (!isPlaying || isPaused || isClearing) return;
    const newRot = (current.rotation + 1) % 4;
    
    // Wall kick simples
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
        if (!collision(current.x + kick, current.y, newRot)) {
            current.x += kick;
            current.rotation = newRot;
            return;
        }
    }
}

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;
    if (isPaused) {
        overlayTitle.textContent = 'PAUSADO';
        overlayMsg.textContent = 'Pressione P ou clique para continuar';
        startBtn.textContent = 'CONTINUAR';
        overlay.classList.remove('hidden');
        pauseBtn.textContent = 'CONTINUAR';
    } else {
        overlay.classList.add('hidden');
        pauseBtn.textContent = 'PAUSAR';
        lastDrop = performance.now();
        gameLoop(performance.now());
    }
}

// ===== UI =====
function updateUI() {
    // A cada 1000 pontos sobe de nível e aumenta a velocidade
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
        level = newLevel;
        // Quanto maior o nível, mais rápido (mínimo 80ms)
        dropInterval = Math.max(80, 1000 - (level - 1) * 90);
    }

    scoreEl.textContent = pad(score, 6);
    linesEl.textContent = pad(lines, 3);
    levelEl.textContent = pad(level, 2);
    
    if (score > highscore) {
        highscore = score;
        highscoreEl.textContent = pad(highscore, 6);
        localStorage.setItem('retroTetrisHigh', highscore);
    }
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    
    overlayTitle.textContent = 'GAME OVER';
    overlayMsg.textContent = `Pontuacao: ${score} | Linhas: ${lines}`;
    startBtn.textContent = 'JOGAR NOVAMENTE';
    overlay.classList.remove('hidden');
    pauseBtn.disabled = true;
}

function startGame() {
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    dropInterval = 1000;
    isClearing = false;
    next = randomPiece();
    spawnPiece();
    isPlaying = true;
    isPaused = false;
    lastDrop = performance.now();
    
    overlay.classList.add('hidden');
    pauseBtn.disabled = false;
    pauseBtn.textContent = 'PAUSAR';
    updateUI();
    gameLoop(performance.now());
}

// ===== GAME LOOP =====
function gameLoop(timestamp) {
    if (!isPlaying || isPaused) return;

    // Não desce peça enquanto está no efeito de limpar linha
    if (!isClearing && timestamp - lastDrop > dropInterval) {
        if (!collision(current.x, current.y + 1, current.rotation)) {
            current.y++;
        } else {
            lockPiece();
        }
        lastDrop = timestamp;
    }

    // Só redesenha se não estiver no meio do flash
    if (!isClearing) {
        drawBoard();
    }
    animationId = requestAnimationFrame(gameLoop);
}

// ===== EVENTOS =====
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    switch (e.key) {
        case 'ArrowLeft':
            move(-1);
            break;
        case 'ArrowRight':
            move(1);
            break;
        case 'ArrowDown':
            softDrop();
            break;
        case 'ArrowUp':
            rotate();
            break;
        case ' ':
            if (!isPlaying) {
                startGame();
            } else if (!isPaused) {
                hardDrop();
            }
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
    
    if (isPlaying && !isPaused && !isClearing) drawBoard();
});

startBtn.addEventListener('click', () => {
    if (isPaused) {
        togglePause();
    } else {
        startGame();
    }
});

pauseBtn.addEventListener('click', togglePause);

restartBtn.addEventListener('click', () => {
    if (isPlaying) {
        cancelAnimationFrame(animationId);
    }
    startGame();
});

// Desenho inicial
drawBoard();
drawNext();