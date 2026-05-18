// INITIAL SETUP
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();

// GAME VARIABLES
let gameActive = false;
let score = 0;
let maxScore = localStorage.getItem("cyberRunnerMaxScore") || 0;

document.getElementById("max-score").innerText = String(maxScore).padStart(4, '0');

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const currentScoreElement = document.getElementById("current-score");

// PLAYER PROPERTIES
const player = {
    x: 60,
    y: 0,
    size: 30,
    vy: 0,
    gravity: 0.6,
    jumpForce: -12,
    isGrounded: false
};

const groundHeight = 80; // Suelo un pelín más alto para mejor visibilidad móvil

// START ENGINE
function startGame() {
    gameActive = true;
    score = 0;
    currentScoreElement.innerText = "0000";
    
    player.y = canvas.height - groundHeight - player.size;
    player.vy = 0;
    player.isGrounded = true;

    overlay.style.display = "none";
    requestAnimationFrame(gameLoop);
}

// LOGIC UPDATE
function update() {
    if (!gameActive) return;

    player.vy += player.gravity;
    player.y += player.vy;

    const groundY = canvas.height - groundHeight - player.size;

    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
    }
}

// JUMP CONTROLS
function playerJump() {
    if (gameActive && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
    }
}

window.addEventListener("touchstart", (e) => {
    if (e.target.tagName !== "BUTTON" && e.target.tagName !== "A") {
        playerJump();
    }
});

window.addEventListener("mousedown", (e) => {
    if (e.target.tagName !== "BUTTON" && e.target.tagName !== "A") {
        playerJump();
    }
});

startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startGame();
});

// DRAW GRAPHICS
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dibujar Suelo de Neón
    ctx.strokeStyle = "#00ffaa";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffaa";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight);
    ctx.lineTo(canvas.width, canvas.height - groundHeight);
    ctx.stroke();

    // 2. Dibujar Jugador (Hacker Box)
    ctx.fillStyle = "#00d2ff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00d2ff";
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.strokeRect(player.x, player.y, player.size, player.size);

    ctx.shadowBlur = 0; // Limpiar sombras
}

// LOOP MAIN ENGINE
function gameLoop() {
    if (!gameActive) return;

    update();
    draw();
    requestAnimationFrame(gameLoop);
}
