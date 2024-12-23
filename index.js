var screen = document.getElementById("gamePlay");
var display = document.getElementById("dataDisplay");
var ctx = screen.getContext("2d");
var birdPic = new Image();
birdPic.src = "./bird.png";
var backgroundPic = new Image();
backgroundPic.src = "./background.png";
var topPipePic = new Image();
topPipePic.src = "./top_pipe.png";
var bottomPipePic = new Image();
bottomPipePic.src = "./bottom_pipe.png";
// ctx.drawImage(birdPic, 20, 0, 60, 50);

var gravity = 0.09;
var flap_stregth = -4;

var numberOfPipes = 4;
var pipeWidth = 75;
var pipeSpacing = 450;
var pipeSpeed = 2.75;
var pipeGap = 150;

var totalBirds = 1000;
let birdsAlive = 0;
var mutation = 0.001; // Max value of 2 - will make every bird random every round

var bestScore = 0;
let frame = 0;

class WeightSet {
  constructor(l1, l2, l3, l4, l5, l6, l7, l8) {
    this.l1 = l1;
    this.l2 = l2;
    this.l3 = l3;
    this.l4 = l4;
    this.l5 = l5;
    this.l6 = l6;
    this.l7 = l7;
    this.l8 = l8;
  }
  clone() {
    return new WeightSet(
      this.l1,
      this.l2,
      this.l3,
      this.l4,
      this.l5,
      this.l6,
      this.l7,
      this.l8,
    );
  }
}

class bird {
  constructor(height, vel, weights, score, life) {
    this.height = height;
    this.vel = vel;
    this.weights = weights;
    this.score = score;
    this.life = life;
  }

  jump() {
    this.vel = flap_stregth;
  }
}

class pipePair {
  constructor(horizontal, bottom) {
    this.horizontal = horizontal;
    this.bottom = bottom;
  }
}

let birds = [];
let pipePairs = [];

// Could be switched to save multiple birds weights in an array
let bestWeights = new WeightSet(0, 0, 0, 0, 0, 0, 0, 0);

function startRound() {
  pipePairs = [];
  pipePairs.push(new pipePair(600, 800 - Math.random() * 600));
  for (i = 0; i < totalBirds; i++) {
    birds.push(new bird(screen.height / 2, 0, tweakWeights(bestWeights), 0, true));
  }
  birdsAlive = totalBirds;
  gameLoop();
}

function tweakWeights(weights) {
  let newWeights = weights.clone();
  newWeights.l1 += (Math.random() - 0.5) * mutation;
  newWeights.l2 += (Math.random() - 0.5) * mutation;
  newWeights.l3 += (Math.random() - 0.5) * mutation;
  newWeights.l4 += (Math.random() - 0.5) * mutation;
  newWeights.l5 += (Math.random() - 0.5) * mutation;
  newWeights.l6 += (Math.random() - 0.5) * mutation;
  newWeights.l7 += (Math.random() - 0.5) * mutation;
  newWeights.l8 += (Math.random() - 0.5) * mutation;
  return newWeights;
}

function gameLoop() {
  display.innerText = `Best score: ${bestScore}`;
  // ctx.clearRect(0, 0, screen.width, screen.height);
  ctx.drawImage(backgroundPic, 0, 0, screen.width, screen.height);

  let farthestPipeSpot = 0;
  for (let pipePair of pipePairs) {
    pipePair.horizontal -= pipeSpeed;
    let theDistance = pipePair.horizontal;
    let theHeight = pipePair.bottom;
    ctx.drawImage(topPipePic, theDistance - 121, -1000 - pipeGap + theHeight, pipeWidth * 4.1, 1000);
    ctx.drawImage(bottomPipePic, theDistance - 117, theHeight, pipeWidth * 4.1, 1000);
    if (pipePair.horizontal >= farthestPipeSpot) {
      farthestPipeSpot = pipePair.horizontal;
    }
  }

  if (pipePairs.length < numberOfPipes) {
    let nextPipe = farthestPipeSpot + pipeSpacing;
    pipePairs.push(new pipePair(nextPipe, 800 - Math.random() * 600));
  }

  if (pipePairs[0].horizontal < -pipeWidth) {
    pipePairs.shift();
  }

  for (let bird of birds) {
    if (bird.life == true) {
      if (
        bird.height < 0 ||
        bird.height > 800 ||
        (pipePairs[0].horizontal < pipeWidth - 10 &&
          bird.height + 50 > pipePairs[0].bottom) ||
        (pipePairs[0].horizontal < pipeWidth - 10 &&
          bird.height > pipePairs[0].bottom + pipeGap - 25) ||
        (pipePairs[0].horizontal < pipeWidth - 10 &&
          bird.height < pipePairs[0].bottom - pipeGap - 10)
      ) {
        bird.life = false;
        birdsAlive -= 1;
      }
      bird.score += 1;
      bird.vel += gravity;
      bird.height += bird.vel;
      if (evaluateNetwork(bird, pipePairs[0]) == true) {
        bird.jump();
      }
      const rotateAngle = Math.PI * 1.45 + (bird.vel + 10) / 7.5; // messed around with values til it looked good
      ctx.save();
      ctx.translate(35, bird.height + 25);
      ctx.rotate(rotateAngle);
      ctx.drawImage(birdPic, -30, -25, 60, 50);
      ctx.restore();
    }
  }
  if (birdsAlive > 0) {
    requestAnimationFrame(gameLoop);
  } else {
    for (let bird of birds) {
      if (bird.score > bestScore) {
        bestScore = bird.score;
        bestWeights = bird.weights;
      }
    }
    startRound();
  } // This code will either keep the game running, or save best weights, and then starts a new round

  frame++;

  ctx.fillStyle = "#fff";
  ctx.font = "18px Arial";

  ctx.fillText(`Birds alive: ${birdsAlive}`, 10, 25);
}

function evaluateNetwork(bird, pipePair) {
  let node1 = pipePair.horizontal - 80;
  if (node1 < 100) {
    node1 = 100;
  }

  let node2 = bird.height - pipePair.bottom;
  let node3 = bird.vel;
  // Node 1 is set to only be positive, and the distance from the pipe
  // Node 2 is the difference in heights
  // Node 3 is the birds velocity
  let node4 =
    node1 * bird.weights.l1 + node2 * bird.weights.l2 + node3 * bird.weights.l3;
  let node5 =
    node1 * bird.weights.l4 + node2 * bird.weights.l5 + node3 * bird.weights.l6;
  let node6 = node4 * bird.weights.l7 + node5 * bird.weights.l8;
  if (node6 >= 0) {
    return true;
  }
  return false;
}

startRound();
