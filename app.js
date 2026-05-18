// INITIAL SETUP
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
resizeCanvas();

// VARIABLES PRINCIPALES DEL JUEGO
let gameActive = false;
let score = 0;
let maxScore = 0;

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const currentScoreElement = document.getElementById("current-score");

const btnProyectos = document.getElementById("btn-volver-proyectos");
const btnAtras = document.getElementById("btn-atras-inicio");

// PROPIEDADES DEL JUGADOR
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

// VARIABLES DEL MOTOR DE OBSTÁCULOS
let obstacles = [];
let obstacleTimer = 0;
let obstacleInterval = 100; 
let gameSpeed = 5;         

// ANIMACIÓN DE FONDO PARA EL MENÚ (MATRIX / TECH STYLE)
let menuBackgroundElements = [];
let menuFloorScroll = 0;

// CONTROLES DE PULSACIÓN CONTINUA
let isPressing = false;

function handlePressStart(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "BUTTON" || e.target.tagName === "A") return;
    e.preventDefault(); 
    isPressing = true;
}
function handlePressEnd() { isPressing = false; }

window.addEventListener("touchstart", handlePressStart, { passive: false });
window.addEventListener("touchend", handlePressEnd);
window.addEventListener("touchcancel", handlePressEnd);
window.addEventListener("mousedown", handlePressStart);
window.addEventListener("mouseup", handlePressEnd);

// ==========================================
// 🛡️ SISTEMA DE USUARIOS & LOCALSTORAGE
// ==========================================
let currentUser = null;

// Selectores Auth
const menuPrincipal = document.getElementById("menu-principal");
const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");

const userWelcome = document.getElementById("user-welcome");
const loggedUsername = document.getElementById("logged-username");

const btnShowLogin = document.getElementById("btn-show-login");
const btnShowRegister = document.getElementById("btn-show-register");
const btnLogout = document.getElementById("btn-logout");

// Inicializar base de datos local si no existe
if (!localStorage.getItem("cyberUsers")) {
    localStorage.setItem("cyberUsers", JSON.stringify([]));
}

// Cargar clasificaciones al inicio
actualizarLeaderboard();

// Cambiar de menús
btnShowLogin.addEventListener("click", () => { menuPrincipal.classList.add("hidden"); formLogin.classList.remove("hidden"); });
btnShowRegister.addEventListener("click", () => { menuPrincipal.classList.add("hidden"); formRegister.classList.remove("hidden"); });
document.getElementById("btn-cancel-login").addEventListener("click", () => { formLogin.classList.add("hidden"); menuPrincipal.classList.remove("hidden"); });
document.getElementById("btn-cancel-register").addEventListener("click", () => { formRegister.classList.add("hidden"); menuPrincipal.classList.remove("hidden"); });

// REGISTRO CON TUS REGLAS STRICTAS
document.getElementById("btn-submit-register").addEventListener("click", () => {
    const name = document.getElementById("reg-name").value.trim();
    const lastname = document.getElementById("reg-lastname").value.trim();
    const email = document.getElementById("reg-email").value.trim().toLowerCase();
    const pass1 = document.getElementById("reg-pass1").value;
    const pass2 = document.getElementById("reg-pass2").value;
    const errorEl = document.getElementById("register-error");

    errorEl.innerText = "";

    if (!name || !lastname || !email || !pass1 || !pass2) {
        errorEl.innerText = "⚠️ Todos los campos son obligatorios.";
        return;
    }
    if (pass1 !== pass2) {
        errorEl.innerText = "⚠️ Las contraseñas no coinciden.";
        return;
    }
    
    // Reglas de contraseña: Mínimo 9 caracteres, 1 mayúscula, 1 minúscula, 1 número
    const regexValidar = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{9,}$/;
    if (!regexValidar.test(pass1)) {
        errorEl.innerText = "⚠️ Contraseña inválida. Mínimo 9 letras, incluye una Mayúscula, una Minúscula y un Número.";
        return;
    }

    let usuarios = JSON.parse(localStorage.getItem("cyberUsers"));
    if (usuarios.find(u => u.email === email)) {
        errorEl.innerText = "⚠️ Este correo ya está registrado.";
        return;
    }

    // Guardar usuario nuevo
    const nuevoUsuario = { name, lastname, email, password: pass1, maxScore: 0 };
    usuarios.push(nuevoUsuario);
    localStorage.setItem("cyberUsers", JSON.stringify(usuarios));

    alert("¡Identidad Hacker creada con éxito! Ya puedes iniciar sesión.");
    formRegister.classList.add("hidden");
    formLogin.classList.remove("hidden");
});

// INICIO DE SESIÓN
document.getElementById("btn-submit-login").addEventListener("click", () => {
    const email = document.getElementById("login-email").value.trim().toLowerCase();
    const pass = document.getElementById("login-password").value;
    const errorEl = document.getElementById("login-error");

    let usuarios = JSON.parse(localStorage.getItem("cyberUsers"));
    let user = usuarios.find(u => u.email === email && u.password === pass);

    if (!user) {
        errorEl.innerText = "⚠️ Credenciales incorrectas.";
        return;
    }

    currentUser = user;
    maxScore = user.maxScore;
    document.getElementById("max-score").innerText = String(maxScore).padStart(4, '0');
    
    loggedUsername.innerText = `${user.name.toUpperCase()}_`;
    userWelcome.classList.remove("hidden");
    btnShowLogin.classList.add("hidden");
    btnShowRegister.classList.add("hidden");
    btnLogout.classList.remove("hidden");

    formLogin.classList.add("hidden");
    menuPrincipal.classList.remove("hidden");
    actualizarLeaderboard();
});

// CERRAR SESIÓN
btnLogout.addEventListener("click", () => {
    currentUser = null;
    maxScore = 0;
    document.getElementById("max-score").innerText = "0000";
    userWelcome.classList.add("hidden");
    btnShowLogin.classList.remove("hidden");
    btnShowRegister.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    actualizarLeaderboard();
});

function actualizarLeaderboard() {
    const list = document.getElementById("leaderboard-list");
    list.innerHTML = "";
    let usuarios = JSON.parse(localStorage.getItem("cyberUsers")) || [];
    
    // Ordenar de mayor a menor récord
    usuarios.sort((a, b) => b.maxScore - a.maxScore);
    
    // Mostrar top 5
    usuarios.slice(0, 5).forEach((u, index) => {
        const li = document.createElement("li");
        if (currentUser && u.email === currentUser.email) li.className = "top-player";
        li.innerHTML = `<span>${index + 1}. ${u.name.toUpperCase()}</span> <span>${String(u.maxScore).padStart(4, '0')}</span>`;
        list.appendChild(li);
    });
}

// ==========================================
// 🎮 MOTOR Y LÓGICA DEL JUEGO
// ==========================================

function startGame() {
    gameActive = true;
    score = 0;
    gameSpeed = 5;
    obstacles = []; 
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

function update() {
    if (!gameActive) return;

    player.vy += player.gravity;
    player.y += player.vy;

    let onPlatform = false;
    let groundY = canvas.height - groundHeight - player.size;

    // Generador aleatorio de obstáculos
    obstacleTimer++;
    if (obstacleTimer >= obstacleInterval) {
        const types = ['pincho', 'bloque', 'puente'];
        const randomType = types[Math.floor(Math.random() * types.length)];
        let obsWidth = 30, obsHeight = 30;
        
        if (randomType === 'puente') { obsWidth = 90; obsHeight = 20; }

        obstacles.push({
            x: canvas.width,
            y: canvas.height - groundHeight - obsHeight,
            width: obsWidth,
            height: obsHeight,
            type: randomType
        });
        
        obstacleInterval = Math.floor(Math.random() * 40) + 80;
        obstacleTimer = 0;
    }

    // Colisiones inteligentes
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        let collision = player.x < obs.x + obs.width &&
                        player.x + player.size > obs.x &&
                        player.y < obs.y + obs.height &&
                        player.y + player.size > obs.y;

        if (collision) {
            if (obs.type === 'pincho') {
                gameOver();
                return;
            } else {
                let overlapX = Math.min(player.x + player.size - obs.x, obs.x + obs.width - player.x);
                let overlapY = Math.min(player.y + player.size - obs.y, obs.y + obs.height - player.y);

                if (overlapX > overlapY) {
                    if (player.vy > 0 && player.y + player.size - player.vy <= obs.y + 4) {
                        player.y = obs.y - player.size;
                        player.vy = 0;
                        player.isGrounded = true;
                        onPlatform = true;
                    } else {
                        gameOver();
                        return;
                    }
                } else {
                    gameOver();
                    return;
                }
            }
        }

        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score++;
            currentScoreElement.innerText = String(score).padStart(4, '0');
            if (score % 5 === 0) gameSpeed += 0.4;
        }
    }

    if (!onPlatform && player.y >= groundY) {
        player.y = groundY;
        player.vy = 0;
        player.isGrounded = true;
    }

    if (isPressing && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
    }
}

function gameOver() {
    gameActive = false;
    isPressing = false;

    // Guardar marcador si hay cuenta logueada
    if (currentUser) {
        if (score > currentUser.maxScore) {
            currentUser.maxScore = score;
            maxScore = score;
            document.getElementById("max-score").innerText = String(maxScore).padStart(4, '0');
            
            // Actualizar en base de datos local
            let usuarios = JSON.parse(localStorage.getItem("cyberUsers"));
            let idx = usuarios.findIndex(u => u.email === currentUser.email);
            if (idx !== -1) {
                usuarios[idx].maxScore = score;
                localStorage.setItem("cyberUsers", JSON.stringify(usuarios));
            }
        }
    }

    document.getElementById("game-message").innerText = `⚠️ CORE COLAPSADO. SCORE: ${String(score).padStart(4, '0')}`;
    btnAtras.classList.add("hidden");       
    btnProyectos.classList.remove("hidden"); 
    overlay.style.display = "flex";
    actualizarLeaderboard();
}

// DRAW GRAPHICS & ANIMACIÓN DE MENÚ
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- LOGICA DE LA ANIMACIÓN DE FONDO ---
    if (!gameActive) {
        menuFloorScroll = (menuFloorScroll + 2) % 40;
        if (Math.random() < 0.03) { // Generar datos flotantes de fondo
            menuBackgroundElements.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - 150),
                text: Math.random() > 0.5 ? "0" : "1",
                speed: Math.random() * 1 + 0.5,
                opacity: Math.random() * 0.2 + 0.05
            });
        }
        // Mover y pintar datos flotantes
        for (let i = menuBackgroundElements.length - 1; i >= 0; i--) {
            let data = menuBackgroundElements[i];
            data.x -= data.speed;
            ctx.fillStyle = `rgba(0, 210, 255, ${data.opacity})`;
            ctx.font = "14px Courier New";
            ctx.fillText(data.text, data.x, data.y);
            if (data.x < -10) menuBackgroundElements.splice(i, 1);
        }
    }

    // 1. Suelo de Neón animado en el menú
    ctx.strokeStyle = "#00ffaa";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffaa";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - groundHeight);
    ctx.lineTo(canvas.width, canvas.height - groundHeight);
    ctx.stroke();

    // Líneas secundarias del suelo para notar el movimiento del menú
    if (!gameActive) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0, 255, 170, 0.3)";
        for (let x = -menuFloorScroll; x < canvas.width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height - groundHeight);
            ctx.lineTo(x - 20, canvas.height);
            ctx.stroke();
        }
    }

    // 2. Jugador (Solo se pinta si se está jugando)
    if (gameActive) {
        ctx.fillStyle = "#00d2ff";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00d2ff";
        ctx.fillRect(player.x, player.y, player.size, player.size);
        ctx.strokeRect(player.x, player.y, player.size, player.size);
    }

    // 3. Dibujar Obstáculos
    for (let obs of obstacles) {
        if (obs.type === 'pincho') {
            ctx.fillStyle = "#ff0055"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.shadowBlur = 15; ctx.shadowColor = "#ff0055";
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y + obs.height); ctx.lineTo(obs.x + obs.width / 2, obs.y); ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        } else if (obs.type === 'bloque') {
            ctx.fillStyle = "#ffaa00"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = "#ffaa00";
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height); ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        } else if (obs.type === 'puente') {
            ctx.fillStyle = "#bd00ff"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = "#bd00ff";
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height); ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
        }
    }
    ctx.shadowBlur = 0; 
}

// ANIMACIÓN EN MENÚ O BUCLE ACTIVO
function menuLoop() {
    if (!gameActive) {
        draw();
        requestAnimationFrame(menuLoop);
    }
}
menuLoop(); // Lanzamos la animación continua de fondo

function gameLoop() {
    if (!gameActive) { requestAnimationFrame(menuLoop); return; }
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// EVENTOS DE NAVEGACIÓN PRINCIPAL
startBtn.addEventListener("click", (e) => { e.stopPropagation(); startGame(); });
btnAtras.addEventListener("click", (e) => {
    e.stopPropagation(); gameActive = false; isPressing = false;
    btnAtras.classList.add("hidden"); btnProyectos.classList.remove("hidden");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("game-message").innerText = "> PULSA PARA INICIAR TRANSMISIÓN DE DATOS...";
    overlay.style.display = "flex";
    requestAnimationFrame(menuLoop);
});
