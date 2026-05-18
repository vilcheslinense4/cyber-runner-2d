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

// VARIABLES DE NAVEGACIÓN
const btnProyectos = document.getElementById("btn-volver-proyectos");
const btnAtras = document.getElementById("btn-atras-inicio");

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

const groundHeight = 80;

// --- NUEVAS VARIABLES PARA OBSTÁCULOS ---
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 90; // Cada cuántos frames sale un obstáculo nuevo
let gameSpeed = 5;         // Velocidad de movimiento del juego

// CONTROLES DE PULSACIÓN CONTINUA
let isPressing = false;

function handlePressStart(e) {
    if (e.target.tagName === "BUTTON" || e.target.tagName === "A") return;
    e.preventDefault(); 
    isPressing = true;
}

function handlePressEnd() {
    isPressing = false;
}

window.addEventListener("touchstart", handlePressStart, { passive: false });
window.addEventListener("touchend", handlePressEnd);
window.addEventListener("touchcancel", handlePressEnd);
window.addEventListener("mousedown", handlePressStart);
window.addEventListener("mouseup", handlePressEnd);

// START ENGINE
function startGame() {
    gameActive = true;
    score = 0;
    gameSpeed = 5;
    obstacles = []; // Limpiamos obstáculos de la partida anterior
    obstacleTimer = 0;
    currentScoreElement.innerText = "0000";
    
    player.y = canvas.height - groundHeight - player.size;
    player.vy = 0;
    player.isGrounded = true;

    btnProyectos.classList.add("hidden"); 
    btnAtras.classList.remove("hidden");  

    overlay.style.display = "none";
    requestAnimationFrame(gameLoop);
}

// LOGIC UPDATE
function update() {
    if (!gameActive) return;

    // Salto continuo
    if (isPressing && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
    }

    player.vy += player.gravity;
    player.y += player.vy;

    const groundY = canvas.height - groundHeight - player.size;

    if (player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
    }

    // --- LOGICA DE OBSTÁCULOS ---
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
        // Creamos un obstáculo con altura aleatoria
        let obsHeight = Math.floor(Math.random() * 30) + 30; // Altura entre 30px y 60px
        obstacles.push({
            x: canvas.width,
            y: canvas.height - groundHeight - obsHeight,
            width: 20,
            height: obsHeight
        });
        obstacleTimer = 0;
    }

    // Mover y procesar obstáculos
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;

        // Colisión con el jugador (Caja AABB)
        if (
            player.x < obstacles[i].x + obstacles[i].width &&
            player.x + player.size > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.size > obstacles[i].y
        ) {
            gameOver();
            return;
        }

        // Si el obstáculo sale de la pantalla, sumamos punto
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score++;
            currentScoreElement.innerText = String(score).padStart(4, '0');
            
            // Subir la velocidad poco a poco para que sea más difícil
            if (score % 5 === 0) {
                gameSpeed += 0.5;
            }
        }
    }
}

// FUNCTION: GAME OVER
function gameOver() {
    gameActive = false;
    isPressing = false;

    // Comprobar récord máximo
    if (score > maxScore) {
        maxScore = score;
        localStorage.setItem("cyberRunnerMaxScore", maxScore);
        document.getElementById("max-score").innerText = String(maxScore).padStart(4, '0');
    }

    // Cambiar mensaje del menú y reabrirlo
    document.getElementById("game-message").innerText = `⚠️ SISTEMA CAÍDO. SCORE: ${String(score).padStart(4, '0')}. REINTENTAR...`;
    
    btnAtras.classList.add("hidden");       
    btnProyectos.classList.remove("hidden"); 
    overlay.style.display = "flex";
}

// ACCIÓN DEL BOTÓN "INICIAR CORE"
startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startGame();
});

// ACCIÓN DEL BOTÓN "ATRÁS"
btnAtras.addEventListener("click", (e) => {
    e.stopPropagation(); 
    gameActive = false; 
    isPressing = false;
    btnAtras.classList.add("hidden");       
    btnProyectos.classList.remove("hidden"); 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("game-message").innerText = "> PULSA PARA INICIAR TRANSMISIÓN DE DATOS...";
    overlay.style.display = "flex";
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

    // 3. Dibujar Obstáculos (Barreras rojas láser de ciberseguridad)
    ctx.fillStyle = "#ff0055";
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.shadowColor = "#ff0055";
    for (let obs of obstacles) {
        ctx.shadowBlur = 12;
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    }

    ctx.shadowBlur = 0; // Limpiar sombras
}

// LOOP MAIN ENGINE
function gameLoop() {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
