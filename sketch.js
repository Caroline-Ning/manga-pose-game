let video;
let poseNet;
let pose = [];
let skeleton = [];
let brain; //store neural network
let state = "waiting";
let targetLable; //YAB

function keyPressed() {
  if (key == "s") {
    //press s to save data
    brain.saveData();
  } else {
    //press a target Key (Y/A/B), then start to collect
    targetLable = key;
    console.log(targetLable);
    setTimeout(function () {
      state = "collecting";
      console.log("collecting");
      setTimeout(function () {
        console.log("not collecting");
        state = "waiting";
      }, 10000); //10 secs for collecting the poses, then turn to waiting;
    }, 10000); //wait for 10 secs, then start collecting
  }
}

function setup() {
  createCanvas(1000, 1000);
  video = createCapture(VIDEO);
  video.hide();
  //when model is ready, call back and log ready
  poseNet = ml5.poseNet(video, modelReady);
  //everytime the model detect a pose, callback
  poseNet.on("pose", gotPoses);
  let options = {
    inputs: 34, //17 pairs x.y
    outputs: 5, // 5 postures
    task: "classification",
    debug: true,
  };
  brain = ml5.neuralNetwork(options); //my new neural network
}
//poses: built-in variable
function gotPoses(poses) {
  /*will log poses=objects
object{
  0
    pose{
      keypoints:{
        0:
         part:nose;
         position(x,y);
         score:xx;
        1:
        2:
      }
      nose:{
        core:
        x:
        y:
      }
    }
    skeleton{
      ...
    }
  }*/
  //confidence score: the probability that the value is no more than 10% greater than the true value of the property
  if (poses.length > 0) {
    pose = poses[0].pose;
    skeleton = poses[0].skeleton;
    if (state == "collecting") {
      let inputs = []; //a plain array with every x y in 17 parts
      for (i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }

      let target = [targetLable];
      brain.addData(inputs, target);
    }
  }
}

function modelReady() {
  console.log("poseNet Ready");
}

function draw() {
  translate(video.width, 0);
  scale(-1, 1);
  image(video, 0, 0, video.width, video.height);
  stroke(255);
  strokeWeight(10);
  for (i = 0; i < skeleton.length; i++) {
    let a = skeleton[i][0];
    let b = skeleton[i][1];
    line(a.position.x, a.position.y, b.position.x, b.position.y);
  }
}
