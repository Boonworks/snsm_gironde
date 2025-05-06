const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// === Image de la mer
const waterTexture = new Image();
waterTexture.src = "water-texture2.png";
let waterOffsetY = 0;

// === Image du jet ski
const jetSkiImage = new Image();
jetSkiImage.src = 'jet.png';

const keys = { left: false, right: false, space: false };

document.addEventListener("keydown", (e) => {
  if (e.code === "ArrowLeft") keys.left = true;
  if (e.code === "ArrowRight") keys.right = true;
  if (e.code === "Space") keys.space = true;
});
document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowLeft") keys.left = false;
  if (e.code === "ArrowRight") keys.right = false;
  if (e.code === "Space") keys.space = false;
});

// === invincible début

let invincible = true;
let invincibleStartTime = 0;
const invincibleDuration = 3000; // en millisecondes (3s)


// === Joueur
const player = {
  x: 200,
  y: 300,
  width: 30,
  height: 40,
  speedX: 5,
  speedY: 0,
  maxUpSpeed: -4,
  maxDownSpeed: 2,
  accelRate: -0.2,
  decelRate: 0.1,
  imageSizeX: 60,
  imageSizeY: 80,
  currentRotation: 5,
  rotationSpeed: 2
};

let collisions = 0; // total au lieu de collisionsInARow
const maxCollisions = 5;
let score = 0;
let gameOver = false;
let scrollSpeed = 1.5;

const gateWidth = 80;
const waveSpacing = 150;
let waves = [];
let splashs = [];
let shakeTime = 0;
let trailLeft = [];
let trailRight = [];

const restartBtn = document.getElementById("restartBtn");
restartBtn.addEventListener("click", () => resetGame());

function createWave(y) {
  const gates = [];
  const numberOfGates = Math.random() < 0.3 ? 2 : 1;
  const minGateX = 10;
  const maxGateX = canvas.width - gateWidth - 10;
  const usedZones = [];

  for (let i = 0; i < numberOfGates; i++) {
    let gateX, tries = 0;
    do {
      gateX = Math.random() * (maxGateX - minGateX) + minGateX;
      tries++;
    } while (usedZones.some(x => Math.abs(x - gateX) < gateWidth + 20) && tries < 10);
    usedZones.push(gateX);
    gates.push(gateX);
  }

  return { y, gates, scored: false };
}

for (let i = 0; i < 6; i++) waves.push(createWave(i * -waveSpacing));

// =___________________________________________________________________UPDATE

function update() {
  if (gameOver) return;

  if (keys.left && player.x > 0) player.x -= player.speedX;
  if (keys.right && player.x + player.width < canvas.width) player.x += player.speedX;

  if (keys.space) {
    player.speedY += player.accelRate;
    if (player.speedY < player.maxUpSpeed) player.speedY = player.maxUpSpeed;
  } else {
    player.speedY += player.decelRate;
    if (player.speedY > player.maxDownSpeed) player.speedY = player.maxDownSpeed;
  }

  player.y += player.speedY;

  if (player.y + player.height >= canvas.height) {
    gameOver = true;
    restartBtn.style.display = "block";
    shakeTime = 0;
    return;
  }

  if (player.y < 0) player.y = 0;

  scrollSpeed = Math.min(5, 1.5 + Math.floor(score / 5) * 0.5);

  for (let wave of waves) {
    wave.y += scrollSpeed;

    if (!wave.scored && wave.y > player.y + player.height) {
      let passed = wave.gates.some(gateX =>
        player.x + player.width > gateX && player.x < gateX + gateWidth
      );

      if (passed) {
        score++;
      } else if (!invincible) {
        collisions++;
        player.speedY = -1;
        createSplash(player.x + player.width / 2, player.y + player.height / 2);
        shakeTime = 5;
      
        if (collisions >= maxCollisions) {
          gameOver = true;
          restartBtn.style.display = "block";
          shakeTime = 0;
        }
      }
      
      wave.scored = true;
    }
  }

  if (waves[0].y > canvas.height + 100) {
    waves.shift();
    const lastY = waves[waves.length - 1].y;
    waves.push(createWave(lastY - waveSpacing));
  }

  const targetRotation = getJetSkiTargetRotation();
  if (player.currentRotation < targetRotation) {
    player.currentRotation = Math.min(player.currentRotation + player.rotationSpeed, targetRotation);
  } else if (player.currentRotation > targetRotation) {
    player.currentRotation = Math.max(player.currentRotation - player.rotationSpeed, targetRotation);
  }

  splashs = splashs.filter(s => {
    s.radius += 1.5;
    s.alpha -= 0.05;
    return s.alpha > 0;
  });

  if (shakeTime > 0) shakeTime--;

  const angleRad = player.currentRotation * Math.PI / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const backX = player.x + player.width / 2;
  const backY = player.y + player.height;
  const jitter = 2.5;
  const trailOffset = 10;

  const leftX = backX - trailOffset * cos + trailOffset * sin + (Math.random() - 0.5) * jitter;
  const leftY = backY - trailOffset * sin - trailOffset * cos + (Math.random() - 0.5) * jitter;
  const rightX = backX + trailOffset * cos + trailOffset * sin + (Math.random() - 0.5) * jitter;
  const rightY = backY + trailOffset * sin - trailOffset * cos + (Math.random() - 0.5) * jitter;

  trailLeft.push({ x: leftX, y: leftY, alpha: 1 });
  trailRight.push({ x: rightX, y: rightY, alpha: 1 });

  if (trailLeft.length > 30) trailLeft.shift();
  if (trailRight.length > 30) trailRight.shift();
  for (let i = 0; i < trailLeft.length; i++) {
    trailLeft[i].alpha -= 0.03;
    trailRight[i].alpha -= 0.03;
  }

  waterOffsetY += scrollSpeed / 2;
  if (waterOffsetY >= canvas.height) waterOffsetY = 0;


  if (invincible && Date.now() - invincibleStartTime > invincibleDuration) {
    invincible = false;
  }
  
}


// =___________________________________________________________________FUNCTION

function getJetSkiTargetRotation() {
  if (keys.space && keys.left) return -45;
  if (keys.space && keys.right) return 45;
  if (keys.left && !keys.space) return -90;
  if (keys.right && !keys.space) return 90;
  return 0;
}

function createSplash(x, y) {
  splashs.push({ x, y, radius: 5, alpha: 1 });
}


// =___________________________________________________________________DRAW_WAVE

 

function drawWave(wave) {

  const y = wave.y;
  const waveHeight = 20;
  const foamHeight = 60;

  const segments = [];
  const sortedGates = [...wave.gates].sort((a, b) => a - b);

  if (sortedGates.length === 0) {
    segments.push({ x: 0, width: canvas.width });
  } else {
    if (sortedGates[0] > 0) {
      segments.push({ x: 0, width: sortedGates[0] });
    }

    for (let i = 0; i < sortedGates.length; i++) {
      const gateStart = sortedGates[i];
      const gateEnd = gateStart + gateWidth;
      const nextGateStart = sortedGates[i + 1] || canvas.width;

      if (gateEnd < nextGateStart) {
        segments.push({ x: gateEnd, width: nextGateStart - gateEnd });
      }
    }
  }







  for (let seg of segments) {
    // 🌊 Mousse étalée (derrière la vague, vers le haut)
    const foamGradient = ctx.createLinearGradient(0, y - foamHeight, 0, y);
    foamGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    foamGradient.addColorStop(1, "rgba(255, 255, 255, 0.6)");


    // Applique la mousse partout
    ctx.fillStyle = foamGradient;
    ctx.fillRect(seg.x, y - foamHeight, seg.width, foamHeight);
    
    // 🪄 Découpe la mousse dans les zones des arcs (côté intérieur des portes)
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "black"; // couleur peu importe
    
    
    for (let gateX of wave.gates) {
      const radius = foamHeight;
      const arcY = y - foamHeight;
    
      // Quart de cercle à gauche (centre DANS la porte, vers la droite)
      ctx.beginPath();
      ctx.moveTo(gateX + radius, arcY + radius);
      ctx.arc(gateX + radius, arcY + radius, radius, Math.PI, Math.PI * 1.5); // vers l'intérieur
      ctx.closePath();
      ctx.fill();
    
      // Quart de cercle à droite (centre DANS la porte, vers la gauche)
      ctx.beginPath();
      ctx.moveTo(gateX + gateWidth - radius, arcY + radius);
      ctx.arc(gateX + gateWidth - radius, arcY + radius, radius, Math.PI * 1.5, 0); // vers l'intérieur
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    


 
      for (let gateX of wave.gates) {
      const radius = foamHeight;
      const arcY = y - foamHeight;
    
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "magenta"; 
    
      // Quart de cercle à gauche (orienté vers la droite)
      ctx.beginPath();
      ctx.arc(gateX - radius, arcY + radius, radius, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();
    
      // Quart de cercle à droite (orienté vers la gauche)
      ctx.beginPath();
      ctx.arc(gateX + gateWidth + radius, arcY + radius, radius, Math.PI, Math.PI * 1.5);
      ctx.stroke();
    
      ctx.restore();
    } 
    


    // 🌊 Crête douce (bas de la vague, légère surbrillance)
    const crestGradient = ctx.createLinearGradient(0, y - 10, 0, y + 10);
    crestGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    crestGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.6)");
    crestGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = crestGradient;
    ctx.fillRect(seg.x, y - 10, seg.width, waveHeight);

     // 🔴 Hitbox (optionnel pour debug)
     /*  ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.moveTo(seg.x, y);
      ctx.lineTo(seg.x + seg.width, y);
      ctx.stroke();  */
  }
}



// =___________________________________________________________________DRAW

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

 

  ctx.save();
  if (shakeTime > 0) {
    const dx = (Math.random() - 0.5) * 10;
    const dy = (Math.random() - 0.5) * 10;
    ctx.translate(dx, dy);
  }

 /*  for (let wave of waves) {
    ctx.fillStyle = "white";
    ctx.fillRect(0, wave.y, canvas.width, 5);



  
    for (let gateX of wave.gates) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out"; // rend les zones transparentes
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.fillRect(gateX, wave.y, gateWidth, 5);
      ctx.restore();
    }
  } */


    for (let wave of waves) {
      drawWave(wave);
    }
    
  


  ctx.globalCompositeOperation = "destination-over";
  if (waterTexture.complete) {
    ctx.drawImage(waterTexture, 0, waterOffsetY % canvas.height, canvas.width, canvas.height);
    ctx.drawImage(waterTexture, 0, (waterOffsetY % canvas.height) - canvas.height, canvas.width, canvas.height);
  }
  ctx.globalCompositeOperation = "source-over"; // remet à la normale
  

  for (let splash of splashs) {
    ctx.beginPath();
    ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${splash.alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.lineWidth = 2;
  for (let i = 1; i < trailLeft.length; i++) {
    const prevL = trailLeft[i - 1], currL = trailLeft[i];
    const prevR = trailRight[i - 1], currR = trailRight[i];
    const alpha = currL.alpha.toFixed(2);
    ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;

    ctx.beginPath(); ctx.moveTo(prevL.x, prevL.y); ctx.lineTo(currL.x, currL.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(prevR.x, prevR.y); ctx.lineTo(currR.x, currR.y); ctx.stroke();
  }

  const radians = player.currentRotation * Math.PI / 180;
  ctx.save();
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  ctx.translate(centerX, centerY);
  ctx.rotate(radians);
  ctx.drawImage(jetSkiImage, -player.imageSizeX / 2, -player.imageSizeY / 2, player.imageSizeX, player.imageSizeY);
  ctx.restore();

  ctx.fillStyle = "rgb(0, 0, 0)";
ctx.font = "30px Abril Fatface";
ctx.fillText(score, 20, 40);


  /* ctx.strokeStyle = "red";
  ctx.strokeRect(player.x, player.y, player.width, player.height); //DEBUG CADRE ROUGE JOUEUR
 */
  ctx.restore();
}


// =___________________________________________________________________GAME


function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  player.x = 200;
  player.y = 300;
  player.speedY = 0;
  collisions = 0;
  score = 0;
  gameOver = false;
  waves = [];
  for (let i = 0; i < 6; i++) waves.push(createWave(i * -waveSpacing));
  restartBtn.style.display = "none";

  invincible = true;
  invincibleStartTime = Date.now();
}

gameLoop();

window.addEventListener("keydown", function (e) {
  if (!gameOver && ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
}, { passive: false });
