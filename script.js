class AssetsLoader {
  constructor(assets) {
    this.images = assets.images || {};
    this.sounds = assets.sounds || {};
    this.loadedImages = {};
    this.loadedSounds = {};

    this.loadPromise = this.loadAll();
  }

  loadAll() {
    return Promise.all([this.loadImages(), this.loadSounds()]);
  }

  loadImages() {
    const imagePromises = [];

    for (const key in this.images) {
      if (this.images.hasOwnProperty(key)) {
        const imagePath = this.images[key];
        const image = new Image();
        image.src = imagePath;

        const imagePromise = new Promise((resolve) => {
          image.onload = () => {
            this.loadedImages[key] = image;
            resolve();
          };
        });

        imagePromises.push(imagePromise);
      }
    }

    return Promise.all(imagePromises);
  }

  loadSounds() {
    const soundPromises = [];

    for (const key in this.sounds) {
      if (this.sounds.hasOwnProperty(key)) {
        const soundPath = this.sounds[key];
        const audio = new Audio(soundPath);

        const soundPromise = new Promise((resolve) => {
          audio.addEventListener("canplaythrough", () => {
            this.loadedSounds[key] = audio;
            resolve();
          });
        });

        soundPromises.push(soundPromise);
      }
    }

    return Promise.all(soundPromises);
  }

  // You can still add more methods here for other asset types or perform additional actions

  // Example method to get a loaded image
  getImage(key) {
    return this.loadedImages[key];
  }

  // Example method to get a loaded sound
  getSound(key) {
    return this.loadedSounds[key];
  }

  // Example method to perform some action with the loaded assets
  playSound(key) {
    const audio = this.getSound(key);
    if (audio) {
      audio.play();
    } else {
      console.error(`Sound with key '${key}' not found.`);
    }
  }
}

const assets = {
  images: {
    raven: "/img/raven.png",
    blast: "/img/boom.png",
  },
  sounds: {
    blast: "/audio/blast.wav",
  },
};
const assetsManager = new AssetsLoader(assets);

const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");

const canvas = document.getElementById("main_canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const collisionCanvas = document.getElementById("collision_canvas");
const collisionCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;

function gameStart() {
  startScreen.querySelector("#play-btn").addEventListener("click", () => {
    setTimeout(() => {
      collisionCanvas.classList.remove("hidden");
      canvas.classList.remove("hidden");
      startScreen.classList.add("hidden");

      gamePlayMode();
    }, 400);
  });
  collisionCanvas.classList.add("hidden");
  canvas.classList.add("hidden");
  endScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
}
function displayGameOver(score) {
  endScreen.querySelector("#play-btn").addEventListener("click", () => {
    setTimeout(() => {
      collisionCanvas.classList.remove("hidden");
      canvas.classList.remove("hidden");
      endScreen.classList.add("hidden");

      gamePlayMode();
    }, 400);
  });
  endScreen.querySelector("#score").textContent = score;
  collisionCanvas.classList.add("hidden");
  canvas.classList.add("hidden");
  endScreen.classList.remove("hidden");
}
function gamePlayMode() {
  ctx.font = "50px impact";

  let score = 0;
  let gameOver = false;

  let timeToMakeRaven = 0;
  let ravenInterval = 850;
  let ravensSpeedModifier = 4;
  const gameDifficultyIncreaseRate = 10;
  let gameLevelTimeCounter = 0;

  let lastTime = 0;

  let ravens = [];

  class Raven {
    constructor() {
      this.directionX = Math.random() * ravensSpeedModifier + 2;
      this.directionY = Math.random() * ravensSpeedModifier - 2.5;
      this.markedForDeletion = false;
      this.image = assetsManager.getImage("raven");
      this.spriteWidth = 271;
      this.spriteHeight = 194;
      this.sizeModifier = Math.random() * 0.2 + 0.3;
      this.width = this.spriteWidth * this.sizeModifier;
      this.height = this.spriteHeight * this.sizeModifier;
      this.x = canvas.width;
      this.y =
        Math.random() * ((35 / 100) * canvas.height - this.height) +
        ((35 / 100) * canvas.height - this.height);
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

      if (
        this.y < (35 / 100) * canvas.height - this.height ||
        this.y > (70 / 100) * canvas.height - this.height
      ) {
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
      this.image = assetsManager.getImage("blast");
      this.spriteWidth = 200;
      this.spriteHeight = 179;
      this.size = size;
      this.x = x;
      this.y = y;
      this.frame = 0;
      this.sound = new Audio(assetsManager.getSound("blast").src);
      this.sound.volume = 0.3;
      this.timeSinceLastFrame = 0;
      this.frameInterval = 150;
      this.markedForDeletion = false;
      this.angle = Math.random() * 6.2;
    }

    update(deltaTime) {
      if (this.frame == 0) {
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
      }
    });
  });

  function animate(timesLap) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);

    let deltaTime = timesLap - lastTime;
    lastTime = timesLap;
    timeToMakeRaven += deltaTime;

    // Game difficulty increment logic:
    if (gameLevelTimeCounter > 15000) {
      // in every 15 seconds the difficulty of the game will increase
      gameLevelTimeCounter = 0;

      ravenInterval -= gameDifficultyIncreaseRate;
      ravensSpeedModifier += 2;
    } else {
      gameLevelTimeCounter += deltaTime;
    }

    // adding new raven and sorting array;
    if (timeToMakeRaven > ravenInterval) {
      ravens.push(new Raven());
      timeToMakeRaven = 0;

      ravens.sort((a, b) => {
        return a.width - b.width;
      });
    }

    // display score
    drawScore();

    // draw animation frames:
    [...ravens, ...explosions].forEach((object) => object.update(deltaTime));
    [...ravens, ...explosions].forEach((object) => object.draw());

    // remove unwanted objects from the game:
    ravens = ravens.filter((object) => !object.markedForDeletion);
    explosions = explosions.filter((object) => !object.markedForDeletion);

    // Game over logic:
    if (!gameOver) requestAnimationFrame(animate);
    else return displayGameOver(score);
  }
  animate(0);
}

assetsManager.loadPromise.then(gameStart);
