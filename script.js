const canvas = document.getElementById("main_canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const collisionCanvas = document.getElementById("collision_canvas");
const collisionCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

ctx.font = "50px impact";

let score = 0;
let missed = 0;
let gameOver = false;

let timeToMakeRaven = 0;
let ravenInterval = 500;
let lastTime = 0;

let ravens = [];

class Raven {
  constructor() {
    this.directionX = Math.random() * 5 + 3;
    this.directionY = Math.random() * 5 - 2.5;
    this.markedForDeletion = false;
    this.image = new Image();
    this.image.src = "/img/raven.png";
    this.spriteWidth = 271;
    this.spriteHeight = 194;
    this.sizeModifier = Math.random() * 0.3 + 0.3;
    this.width = this.spriteWidth * this.sizeModifier;
    this.height = this.spriteHeight * this.sizeModifier;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - this.height);
    this.frame = 0;
    this.maxFrame = 4;
    this.timeSinceFlapped = 0;
    this.flapInterval = Math.random() * 50 + 50;
    this.randomColors = [
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
      Math.floor(Math.random() * 255),
    ];
    this.color = `rgba(${this.randomColors[0]},${this.randomColors[1]},${this.randomColors[2]})`;
  }

  update(delatTime) {
    this.x -= this.directionX;
    this.y -= this.directionY;

    if (this.y < 0 || this.y > canvas.height - this.height) {
      this.directionY *= -1;
    }

    if (this.x < 0 - this.width) {
      this.markedForDeletion = true;
    }

    this.timeSinceFlapped += delatTime;
    if (this.timeSinceFlapped > this.flapInterval) {
      if (this.frame > this.maxFrame) this.frame = 0;
      else this.frame++;
      this.timeSinceFlapped = 0;
    }

    // game over logic:
    if (this.x + this.width < 0) {
      missed++;
      gameOver = true;
    }
  }

  draw() {
    collisionCtx.fillStyle = this.color;
    collisionCtx.fillRect(this.x, this.y, this.width, this.height);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.fillText("Score: " + score, 50, 75);
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 55, 80);
}

let explosions = [];

class Explosion {
  constructor(x, y, size) {
    this.image = new Image();
    this.image.src = "/img/boom.png";
    this.spriteWidth = 200;
    this.spriteHeight = 179;
    this.size = size;
    this.x = x;
    this.y = y;
    this.frame = 0;
    this.sound = new Audio();
    this.sound.src = "/audio/blast.wav";
    this.timeSinceLastFrame = 0;
    this.frameInterval = 150;
    this.markedForDeletion = false;
    this.angle = Math.random() * 6.2;
  }

  update(deltaTime) {
    if (this.frame === 0) {
      this.sound.play();
    }

    this.timeSinceLastFrame += deltaTime;
    if (this.timeSinceLastFrame > this.frameInterval) {
      this.frame++;
      this.timeSinceLastFrame = 0;
      if (this.frame > 5) {
        this.markedForDeletion = true;
      }
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(
      this.image,
      this.frame * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      0 - this.size / 2,
      0 - this.size / 4,
      this.size,
      this.size
    );
    ctx.restore();
  }
}

window.addEventListener("click", (e) => {
  const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);
  const pc = detectPixelColor.data;

  ravens.forEach((object) => {
    if (
      object.randomColors[0] == pc[0] &&
      object.randomColors[1] == pc[1] &&
      object.randomColors[2] == pc[2]
    ) {
      // Collision detected
      object.markedForDeletion = true;
      score++;

      explosions.push(new Explosion(e.x, e.y, object.width));
      console.log(explosions);
    }
  });
});

function displayGameOver() {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.font = "5rem impact";
  ctx.fillText(`Game Over!`, canvas.width / 2, canvas.height / 2);
  ctx.fillStyle = "black";
  ctx.textAlign = "right";
  ctx.font = "2.5rem sans-serif";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 1.6);
  ctx.fillStyle = "yellow";
  ctx.textAlign = "right";
  ctx.font = "2.5rem sans-serif";
  ctx.fillText(
    `Score: ${score}`,
    canvas.width / 2 + 5,
    canvas.height / 1.6 + 5
  );
}

function animate(timesLap) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  collisionCtx.clearRect(0, 0, canvas.width, canvas.height);

  let deltaTime = timesLap - lastTime;
  lastTime = timesLap;
  timeToMakeRaven += deltaTime;
  if (timeToMakeRaven > ravenInterval) {
    ravens.push(new Raven());
    timeToMakeRaven = 0;

    ravens.sort((a, b) => {
      return a.width - b.width;
    });
  }
  drawScore();
  [...ravens, ...explosions].forEach((object) => object.update(deltaTime));
  [...ravens, ...explosions].forEach((object) => object.draw());
  ravens = ravens.filter((object) => !object.markedForDeletion);
  explosions = explosions.filter((object) => !object.markedForDeletion);

  if (!gameOver) requestAnimationFrame(animate);
  else displayGameOver();
}
animate(0);
