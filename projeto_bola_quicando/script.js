const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// x, y ---> Posicionar o objeto
// raio ---> Define o tamanho da bola
// vx ---> Define a velocidade horizontal
// vy ---> Define a velocidade vertical

const player = {
    x: 40,
    y: 160,
    raio: 16,
    vx: 120,
    vy: 100
};

let last = 0;

function update(dt) {

    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Bateu na parede esquerda ou direita?
    if (player.x - player.raio < 0 || player.x + player.raio > canvas.width) {
        player.vx *= -1;
    }

    // Bateu em cima ou embaixo?
    if (player.y - player.raio < 0 || player.y + player.raio > canvas.height) {
        player.vy *= -1;
    }
}

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#4ade80";

    // Desenha a bola como um círculo
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.raio, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.fillText("DeltaTime - dt independe da taxa de quadros", 12, 20);
}

function loop(ts) {

    if (!last) {
        last = ts;
    }

    const dt = Math.min(0.05, (ts - last) / 1000);

    last = ts;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}

// eu uso dt porque ele deixa o movimento da bola independente da taxa de quadros.

requestAnimationFrame(loop);
