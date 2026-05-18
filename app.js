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
let distanceTraveled = 0; 

const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const currentScoreElement = document.getElementById("current-score");

const btnProyectos = document.getElementById("btn-volver-proyectos");
const btnAtras = document.getElementById("btn-atras-inicio");

// PROPIEDADES DEL JUGADOR
const player = {
    x: 70, 
    y: 0,
    size: 22,          
    vy: 0,
    gravity: 0.54,     // Un pelín más de gravedad para evitar el efecto flotante
    jumpForce: -9.8,   // Fuerza de salto equilibrada para la nueva gravedad
    isGrounded: false,
    angle: 0,          
    trail: []          
};

const groundHeight = 70; 

// VARIABLES DEL MOTOR DE OBSTÁCULOS
let obstacles = [];
let spawnQueue = []; 
let minDistanceTimer = 0; 
let gameSpeed = 4.4;      

// ANIMACIÓN DE FONDO PARA EL MENÚ
let menuBackgroundElements = [];
let menuFloorScroll = 0;

// CONTROLES DE PULSACIÓN CONTINUA
let isPressing = false;

function handlePressStart(e) {
    if (!gameActive) return; 
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

// ==========================================
// 🛡️ SISTEMA DE USUARIOS & LOCALSTORAGE (FIXED)
// ==========================================
let currentUser = null;

const menuPrincipal = document.getElementById("menu-principal");
const formLogin = document.getElementById("form-login");
const formRegister = document.getElementById("form-register");
const userWelcome = document.getElementById("user-welcome");
const loggedUsername = document.getElementById("logged-username");
const btnShowLogin = document.getElementById("btn-show-login");
const btnShowRegister = document.getElementById("btn-show-register");
const btnLogout = document.getElementById("btn-logout");

if (!localStorage.getItem("cyberUsers")) {
    localStorage.setItem("cyberUsers", JSON.stringify([]));
}

actualizarLeaderboard();

btnShowLogin.addEventListener("click", () => { menuPrincipal.classList.add("hidden"); formLogin.classList.remove("hidden"); });
btnShowRegister.addEventListener("click", () => { menuPrincipal.classList.add("hidden"); formRegister.classList.remove("hidden"); });
document.getElementById("btn-cancel-login").addEventListener("click", () => { formLogin.classList.add("hidden"); menuPrincipal.classList.remove("hidden"); });
document.getElementById("btn-cancel-register").addEventListener("click", () => { formRegister.classList.add("hidden"); menuPrincipal.classList.remove("hidden"); });

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

    const nuevoUsuario = { name, lastname, email, password: pass1, maxScore: 0 };
    usuarios.push(nuevoUsuario);
    localStorage.setItem("cyberUsers", JSON.stringify(usuarios));

    alert("¡Identidad Hacker creada con éxito! Ya puedes iniciar sesión.");
    formRegister.classList.add("hidden");
    formLogin.classList.remove("hidden");
});

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
    if (!list) return; // Salvaguarda en caso de que no se cargue a tiempo el DOM
    list.innerHTML = "";
    let usuarios = JSON.parse(localStorage.getItem("cyberUsers")) || [];
    usuarios.sort((a, b) => b.maxScore - a.maxScore);
    usuarios.slice(0, 5).forEach((u, index) => {
        const li = document.createElement("li");
        if (currentUser && u.email === currentUser.email) li.className = "top-player";
        li.innerHTML = `<span>${index + 1}. ${u.name.toUpperCase()}</span> <span>${String(u.maxScore).padStart(4, '0')}</span>`;
        list.appendChild(li);
    });
}

// ==========================================
// 🎮 MOTOR DE MAPEO CON CAMPO VISUAL AMPLIADO
// ==========================================

function startGame() {
    gameActive = true;
    score = 0;
    gameSpeed = 4.4; 
    distanceTraveled = 0;
    obstacles = []; 
    spawnQueue = [];
    player.trail = [];
    player.angle = 0;
    minDistanceTimer = 0; 
    currentScoreElement.innerText = "0000";
    
    player.y = canvas.height - groundHeight - player.size;
    player.vy = 0;
    player.isGrounded = true;

    btnProyectos.classList.add("hidden"); 
    btnAtras.classList.remove("hidden");  
    overlay.style.display = "none";
    requestAnimationFrame(gameLoop);
}

function generarEstructuraAleatoria() {
    const estructuras = [
        'escalera_ritmica', 
        'doble_pincho_suelo', 
        'puente_con_obstaculo', 
        'gran_precipicio', 
        'tunel_laser', 
        'plataformas_flotantes_secuenciales'
    ];
    const seleccion = estructuras[Math.floor(Math.random() * estructuras.length)];
    let baseFloorY = canvas.height - groundHeight;

    switch(seleccion) {
        case 'escalera_ritmica':
            spawnQueue.push({ type: 'bloque', xOffset: 0, y: baseFloorY - 22, w: 22, h: 22 });
            spawnQueue.push({ type: 'bloque', xOffset: 144, y: baseFloorY - 44, w: 22, h: 44 });
            spawnQueue.push({ type: 'bloque', xOffset: 288, y: baseFloorY - 66, w: 22, h: 66 });
            break;

        case 'doble_pincho_suelo':
            spawnQueue.push({ type: 'pincho', xOffset: 0, y: baseFloorY - 22, w: 20, h: 22 });
            spawnQueue.push({ type: 'pincho', xOffset: 20, y: baseFloorY - 22, w: 20, h: 22 });
            break;

        case 'puente_con_obstaculo':
            spawnQueue.push({ type: 'puente', xOffset: 0, y: baseFloorY - 40, w: 120, h: 15 });
            spawnQueue.push({ type: 'pincho', xOffset: 50, y: baseFloorY - 62, w: 20, h: 22 });
            break;

        case 'gran_precipicio':
            spawnQueue.push({ type: 'vacio', xOffset: 0, y: baseFloorY, w: 75, h: groundHeight });
            break;

        case 'tunel_laser':
            spawnQueue.push({ type: 'puente', xOffset: 0, y: baseFloorY - 50, w: 110, h: 15 });
            break;

        case 'plataformas_flotantes_secuenciales':
            spawnQueue.push({ type: 'vacio', xOffset: 0, y: baseFloorY, w: 180, h: groundHeight });
            spawnQueue.push({ type: 'puente', xOffset: 10, y: baseFloorY - 32, w: 45, h: 12 });
            spawnQueue.push({ type: 'puente', xOffset: 100, y: baseFloorY - 60, w: 45, h: 12 });
            break;
    }
}

function update() {
    if (!gameActive) return;

    distanceTraveled += gameSpeed * 0.05;

    player.vy += player.gravity;
    player.y += player.vy;

    player.trail.push({ x: player.x, y: player.y });
    if (player.trail.length > 8) player.trail.shift(); 

    if (!player.isGrounded) {
        player.angle += 0.1; 
    } else {
        let targetAngle = Math.round(player.angle / (Math.PI / 2)) * (Math.PI / 2);
        player.angle += (targetAngle - player.angle) * 0.3; 
    }

    let onPlatform = false;
    let groundY = canvas.height - groundHeight - player.size;
    let actualGroundY = groundY; 

    minDistanceTimer -= gameSpeed;
    if (minDistanceTimer <= 0 && spawnQueue.length === 0) {
        generarEstructuraAleatoria();
        
        let currentX = canvas.width + 60; 
        let maxSpread = 0;

        while (spawnQueue.length > 0) {
            let item = spawnQueue.shift();
            obstacles.push({
                x: currentX + item.xOffset,
                y: item.y,
                width: item.w,
                height: item.h,
                type: item.type
            });
            if (item.xOffset + item.w > maxSpread) {
                maxSpread = item.xOffset + item.w;
            }
        }
        minDistanceTimer = maxSpread + 320; 
    }

    for (let obs of obstacles) {
        if (obs.type === 'vacio') {
            if (player.x + 4 > obs.x && player.x + player.size - 4 < obs.x + obs.width) {
                actualGroundY = canvas.height + 100; 
            }
        }
    }

    if (player.y > canvas.height) {
        gameOver();
        return;
    }

    // RESOLUCIÓN DE COLISIONES
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        if (obs.type === 'vacio') {
            if (obs.x + obs.width < 0) obstacles.splice(i, 1);
            continue;
        }

        let collision = player.x + 2 < obs.x + obs.width &&
                        player.x + player.size - 2 > obs.x &&
                        player.y < obs.y + obs.height &&
                        player.y + player.size > obs.y;

        if (collision) {
            if (obs.type === 'pincho') {
                gameOver();
                return;
            } else if (obs.type === 'bloque' || obs.type === 'puente') {
                let feetY = player.y + player.size;
                let prevFeetY = feetY - player.vy;

                if (player.vy >= 0 && prevFeetY <= obs.y + 12) {
                    player.y = obs.y - player.size;
                    player.vy = 0;
                    player.isGrounded = true;
                    onPlatform = true;
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
            if (score % 6 === 0) gameSpeed += 0.3; 
        }
    }

    if (!onPlatform) {
        if (player.y >= actualGroundY) {
            player.y = actualGroundY;
            player.vy = 0;
            player.isGrounded = true;
        } else {
            player.isGrounded = false;
        }
    }

    if (isPressing && player.isGrounded) {
        player.vy = player.jumpForce;
        player.isGrounded = false;
    }
}

function gameOver() {
    gameActive = false;
    isPressing = false;

    // Sincronización impecable del récord local en caliente
    if (currentUser) {
        if (score > currentUser.maxScore) {
            currentUser.maxScore = score; // Actualizar objeto activo en RAM
            maxScore = score;
            document.getElementById("max-score").innerText = String(maxScore).padStart(4, '0');
            
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

startBtn.addEventListener("click", (e) => { e.stopPropagation(); startGame(); });
btnAtras.addEventListener("click", (e) => {
    e.stopPropagation(); gameActive = false; isPressing = false;
    btnAtras.classList.add("hidden"); btnProyectos.classList.remove("hidden");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById("game-message").innerText = "> PULSA PARA INICIAR TRANSMISIÓN DE DATOS...";
    overlay.style.display = "flex";
    requestAnimationFrame(menuLoop);
});

// DRAW GRAPHICS
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!gameActive) {
        menuFloorScroll = (menuFloorScroll + 2) % 40;
        if (Math.random() < 0.04) {
            menuBackgroundElements.push({
                x: canvas.width,
                y: Math.random() * (canvas.height - 160) + 40,
                text: Math.random() > 0.5 ? "0" : "1",
                speed: Math.random() * 0.8 + 0.4,
                opacity: Math.random() * 0.15 + 0.04
            });
        }
        for (let i = menuBackgroundElements.length - 1; i >= 0; i--) {
            let data = menuBackgroundElements[i];
            data.x -= data.speed;
            ctx.fillStyle = `rgba(0, 210, 255, ${data.opacity})`;
            ctx.font = "14px Courier New";
            ctx.fillText(data.text, data.x, data.y);
            if (data.x < -10) menuBackgroundElements.splice(i, 1);
        }
    }

    ctx.strokeStyle = "#00ffaa";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffaa";
    
    let baseFloorY = canvas.height - groundHeight;
    let vaciosActivos = obstacles.filter(o => o.type === 'vacio');
    
    if (vaciosActivos.length === 0) {
        ctx.beginPath();
        ctx.moveTo(0, baseFloorY);
        ctx.lineTo(canvas.width, baseFloorY);
        ctx.stroke();
    } else {
        let startX = 0;
        vaciosActivos.sort((a,b) => a.x - b.x);
        
        for (let v of vaciosActivos) {
            if (v.x > startX) {
                ctx.beginPath();
                ctx.moveTo(startX, baseFloorY);
                ctx.lineTo(v.x, baseFloorY);
                ctx.stroke();
            }
            startX = v.x + v.width;
        }
        if (startX < canvas.width) {
            ctx.beginPath();
            ctx.moveTo(startX, baseFloorY);
            ctx.lineTo(canvas.width, baseFloorY);
            ctx.stroke();
        }
    }

    if (!gameActive) {
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(0, 255, 170, 0.25)";
        for (let x = -menuFloorScroll; x < canvas.width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, baseFloorY);
            ctx.lineTo(x - 20, canvas.height);
            ctx.stroke();
        }
    }

    // RENDER JUGADOR
    if (gameActive) {
        player.trail.forEach((t, index) => {
            ctx.fillStyle = `rgba(0, 210, 255, ${index * 0.05})`;
            ctx.fillRect(t.x, t.y, player.size, player.size);
        });

        ctx.save();
        ctx.translate(player.x + player.size / 2, player.y + player.size / 2);
        ctx.rotate(player.angle);
        
        ctx.fillStyle = "#00d2ff";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#00d2ff";
        
        ctx.fillRect(-player.size / 2, -player.size / 2, player.size, player.size);
        ctx.strokeRect(-player.size / 2, -player.size / 2, player.size, player.size);
        ctx.restore();
    }

    // RENDER OBSTÁCULOS
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

    // BARRA DE PROGRESO SUPERIOR
    if (gameActive) {
        let barWidth = canvas.width * 0.4;
        let barX = (canvas.width - barWidth) / 2;
        let barY = 15;
        let progress = (distanceTraveled % 100) / 100; 

        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(barX, barY, barWidth, 4);

        ctx.fillStyle = "#00ffaa";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#00ffaa";
        ctx.fillRect(barX, barY, barWidth * progress, 4);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Courier New";
        ctx.textAlign = "center";
        ctx.fillText(`${Math.floor(progress * 100)}%`, canvas.width / 2, barY + 16);
        ctx.textAlign = "left"; 
    }
}

// LOOPS
function menuLoop() {
    if (!gameActive) {
        draw();
        requestAnimationFrame(menuLoop);
    }
}
menuLoop();

function gameLoop() {
    if (!gameActive) { requestAnimationFrame(menuLoop); return; }
    update();
    draw();
    requestAnimationFrame(gameLoop);
}
