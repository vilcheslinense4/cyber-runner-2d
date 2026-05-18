// ==========================================
// CONFIGURACIÓN DEL MOTOR DEL JUEGO (CANVAS)
// ==========================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Forzar el tamaño interno del lienzo para que sea nítido y responsivo
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();

// ==========================================
// ESTADO GLOBAL DEL JUEGO
// ==========================================
let gameActive = false;
let score = 0;
let maxScore = localStorage.getItem("cyberRunnerMaxScore") || 0;

// Actualizar HUD inicial de puntuación máxima
document.getElementById("max-score").innerText = String(maxScore).padStart(4, '0');

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const gameMessage = document.getElementById("game-message");
const currentScoreElement = document.getElementById("current-score");

// ==========================================
// PROPIEDADES DEL PERSONAJE (AVATAR HACKER)
// ==========================================
const player = {
    x: 50,
    y: 0,
    size: 30,
    vy: 0,          // Velocidad en el eje Y
    gravity: 0.6,   // Fuerza que lo empuja hacia abajo
    jumpForce: -12, // Fuerza del impulso hacia arriba
    isGrounded: false
};

// Altura fija para el suelo del juego
const groundHeight = 60;

// ==========================================
// FUNCIÓN DE INICIO
// ==========================================
function startGame() {
    gameActive = true;
    score = 0;
    currentScoreElement.innerText = "0000";
    
    // Posición inicial del jugador encima del suelo
    player.y = canvas.height - groundHeight - player.size;
    player.vy = 0;
    player.isGrounded = true;

    overlay.style.display = "none";
    
    // Arrancar el bucle del juego
    requestAnimationFrame(gameLoop);
}

// ==========================================
// LOGICA DE FÍSICAS (ACTUALIZACIÓN)
// ==========================================
function update() {
    if (!gameActive) return;

    // Aplicar gravedad si no está tocando el suelo
    player.vy += player.gravity;
    player.y += player.vy;

    // Calcular la posición exacta del suelo en tiempo real
    const groundY = canvas.height - groundHeight - player.size;

    // Detección de colisión con el suelo
    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
    }
}

// ==========================================
// CONTROL DE SALTO (EVENTOS TÁCTILES Y CLIC)
// ==========================================
function playerJump() {
    if (gameActive && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
    }
}

// Escuchar toques en la pantalla del móvil o clics de ratón para saltar
window.addEventListener("touchstart", (e) => {
    // Evitar que el botón de volver atrás o el de iniciar core se confundan con un salto
    if (e.target.tagName !== "BUTTON" && e.target.tagName !== "A") {
        playerJump();
    }
});

window.addEventListener("mousedown", (e) => {
    if (e.target.tagName !== "BUTTON" && e.target.tagName !== "A") {
        playerJump();
    }
});

// Registrar evento para el botón de inicio
startBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Evita que el clic dispare un salto inmediato
    startGame();
});

// ==========================================
// RENDERIZADO (DIBUJAR EN PANTALLA)
// ==========================================
function draw() {
    // Limpiar por completo el lienzo en cada fotograma
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dibujar el Suelo Ciberpunk (Línea de red de neón)
    ctx.strokeStyle = "#00ffaa";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffaa";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight);
    ctx.lineTo(canvas.width, canvas.height - groundHeight);
    ctx.stroke();

    // 2. Dibujar al Protagonista (Cubo de energía de neón)
    ctx.fillStyle = "#00d2ff";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00d2ff";
    
    ctx.fillRect(player.x, player.y, player.size, player.size);
    ctx.strokeRect(player.x, player.y, player.size, player.size);

    // Resetear las sombras para que no afecten a otros elementos futuros
    ctx.shadowBlur = 0;
}

// ==========================================
// EL BUCLE PRINCIPAL (60 FPS)
// ==========================================
function gameLoop() {
    if (!gameActive) return;

    update();
    draw();

    // Volver a llamar al bucle en el próximo frame del navegador
    requestAnimationFrame(gameLoop);
}
