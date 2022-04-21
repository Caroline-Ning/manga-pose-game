let video;
let poseNet;
let pose;
let skeleton;
let brain; //store neural network
let poseLabel = "n"; //n means null

const S_PREPARE = 0;  //first stage, prepare
const S_PLAY = 1; //second stage, play
const S_DONE = 2; // third stage, store board
const N_MAXTIME = 10; //seconds to prepare
const N_ROUND = 10; //rounds
const N_TIME_PERROUND = 10; //one round last for
const N_TIME_RECO = 2; //time for recognize
const N_IMGS = 5 //number of images


let curStage = -1;   //current stage
let startTime;         // millisecond, for second stage, start time for each round


let round = -1;        // round for play
let recoStartTime;     // start time for recognize the pose
let imgIndex = [];        // an array to save 5 random numbers, sech as 01342
let score;         
let bonus;             
let imgs = [];			   // store all images

let touched;           // see if one key is pressed (for stage 3)

function setup() {
  gameInit(); //game initialization
  video = createCapture(VIDEO);
  createCanvas(640, 480);
  video.hide();
  //when model is ready, call back and log ready
  poseNet = ml5.poseNet(video, modelReady);
  //everytime the model detect a pose, trigger got poses - store pose and skeleton
  poseNet.on("pose", gotPoses);
  let options = { //to train new model
    inputs: 34, //17 pairs x.y
    outputs: 5, //5 postures
    task: "classification",
    debug: true,
  };
  brain = ml5.neuralNetwork(options); //my new neural network
  const modelInfo = { //store my trained model information
    model: "./model/model.json",
    metadata: "./model/model_meta.json",
    weights: "./model/model.weights.bin",
  };
  brain.load(modelInfo, brainLoaded); //load my own model, then go to classify
}

function brainLoaded() {
  console.log("classification model Ready");
  classifyPose();
}
function classifyPose() {
  if (pose) {
    let inputs = []; //push everything in a long long long array
    for (let i = 0; i < pose.keypoints.length; i++) {
      let x = pose.keypoints[i].position.x;
      let y = pose.keypoints[i].position.y;
      inputs.push(x);
      inputs.push(y);
    }
    brain.classify(inputs, gotResult); //use built-in classify function, get my result
  } else {
    setTimeout(classifyPose, 100); //if no pose, wait for 100 mlsec
  }
}

function gotResult(error, results) {
  if (results[0].confidence > 0.75) {
    poseLabel = results[0].label;
  }
  // console.log(poseLabel);
  classifyPose();
}
//poses: built-in variable
function gotPoses(poses) {
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
  }
}
function modelReady() {
  console.log("poseNet Ready");
}

function draw() {
  push();
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0);
  stroke(255);
  strokeWeight(5);
  //draw the skeleton in white
  if (pose) {
    for (i = 0; i < skeleton.length; i++) {
      let a = skeleton[i][0];
      let b = skeleton[i][1];
      line(a.position.x, a.position.y, b.position.x, b.position.y);
    }
  }
  console.log(poseLabel);
  pop();

  gamePlay(); //trigger play here
}

function keyPressed() {
  touched = true; //one key is pressed
}

function gameInit() {
  imgs[0] = loadImage("./images/imgA.png");
  imgs[1] = loadImage("./images/imgB.png");
  imgs[2] = loadImage("./images/imgC.png");
  imgs[3] = loadImage("./images/imgD.png");
  imgs[4] = loadImage("./images/imgE.png");
  imgs[5] = loadImage("./images/imgN.png");

  enterStage(S_PREPARE); //go to prepare stage
}


function enterStage(stage) {
  switch (stage) {
    case S_PREPARE:
      break;
    case S_PLAY:
      console.log('enter S_play')
      //initialize for this stage
      round = 0;  
      score = 0;  
      recoStartTime = 0;  
      bonus = false; 
      genImgIndex(N_IMGS, N_ROUND)//generate image index (5 numbers random norepeat)
      break;
    case S_DONE:
      touched = false;
      break;
  }

  startTime = Math.floor(Date.now()); //prepare start
  console.log('prepare start' + startTime)
  curStage = stage; //current stage is S_PREAPARE, trigger in gamePlay()
                    //current stage is play, trigger play()
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

//see new number if it's in the previous numbers
function dupFound(num, last) {
  var found = false;

  for (i = 0; i <= last; i++) {
    if (num == imgIndex[i]) {
      found = true;
    }
  }

  return found;
}

//generate an random array with 5 numbers, different from each other
function genImgIndex(totalImage, totalRound) {
  for (i = 0; i < totalImage; i++) {
    do {
      imgIndex[i] = getRndInteger(0, totalImage); 
    } while (dupFound(imgIndex[i], i - 1)); 
  }

  var j = 0;
  for (i = totalImage; i < totalRound; i++) {
    imgIndex[i] = imgIndex[j];
    j++;
    if (j >= totalImage)
      j = 0;
  }
}

// if current stage ==sth, trigger sth
function gamePlay() {
  switch (curStage) {
    case S_PREPARE:
      prepare();
      break;
    case S_PLAY:
      play();
      break;
    case S_DONE:
      scoreboard();
      break;
  }
}

// stage 1, prepare
function prepare() {
  var eclapse;
  //time from prepare start to now, to do countdown
  eclapse = (Math.floor(Date.now()) - startTime) / 1000;  //sec
  console.log('eclapse=' + eclapse)

  //show countdown num, maxtime: first countdown number
  if (eclapse <= N_MAXTIME) {
    textSize(100)
    fill(255, 220, 0)
    textAlign(CENTER)
    text(Math.floor(N_MAXTIME - eclapse), 60, 100); 
  } else { //if countdown finish, go to play stage
    enterStage(S_PLAY);
  }
}

// stage 3
function scoreboard() {
  if (touched) {
    enterStage(S_PREPARE);
  } else {
    //show score
    rectMode(CENTER)
    fill(90,90,90,150)
    noStroke()
    rect(video.width/2,video.height / 2-40,video.width-50,video.height-190)
    textSize(70)
    fill(255, 220, 0)
    textAlign(CENTER)
    text('Score: '+score, video.width/2, 170); 
    textSize(38)
    text("Press Any Key to Restart", video.width/2, video.height / 2);
  }

}

function play() {
  var eclapse;
  eclapse = (Math.floor(Date.now()) - startTime) / 1000;  
  if ((eclapse > N_TIME_PERROUND) && !bonus) {  //if you take a long time and no bonus, game over
    enterStage(S_DONE);
    return;
  }
  if (bonus) {  //if you trigger bonus
    nextRound(); //then go to next round
    return;
  }
  showAndCheck();
}


// if round reaches max, go to stage 3
function nextRound() {
  if (round == (N_ROUND - 1)) {
    enterStage(S_DONE);
  } else {
    round++;
    bonus = false;
    startTime = Math.floor(Date.now());
    recoStartTime = 0;
  }
}

// see if pose matches, see if trigger bonus
function showAndCheck() {
  var index = -1;  // 
  image(imgs[imgIndex[round]], 0, 0);   // sample img
  //the text when playing
  textAlign(CENTER)
  rectMode(CENTER)
  fill(90,90,90,150)
  noStroke()
  rect(video.width/2+120,70,330,90)
  fill(255,220,0)
  textSize(80)
  text('Score: '+score, video.width/2+120, 100); // show current score



if (poseLabel != "n") {
    index = poseLabel.charCodeAt(0) - ('a').charCodeAt(0); //ascii number, represent your pose
    image(imgs[index], 0, video.height/2);    // if you have a pose, show your pose
  }
  else{
    image(imgs[5], 0, video.height/2);    // if you got stand straight show n
  }


  if (recoStartTime <= 0) { //if you still have time
    if (index == imgIndex[round]) {
      recoStartTime = Math.floor(Date.now()); //time when you make the right pose
    }
  } else {
    if (index != imgIndex[round]) {
      recoStartTime = 0;  //if your pose is wrong (not 2 secs yet), recognize time turn to zero
    }
  }

  if (recoStartTime > 0) {
    var eclapse;
    eclapse = (Math.floor(Date.now()) - recoStartTime) / 1000;  //the right pose lasts for .. secs
    if (eclapse >= N_TIME_RECO) {    //last enough time, trigger bonus, get score
      bonus = true;
      score++;
    }
  }

}
