let contours = [];
let currentContourIndex = 0;
let x = [];
let y = [];
let fourierX;
let fourierY;
let time = 0;
let paths = [];
const CANVAS_WIDTH = 1200; // Increased canvas width
const CANVAS_HEIGHT = 1200; // Increased canvas height
const SCALE_FACTOR = 200; // Adjust scaling factor to fit contours
const BOX_SIZE = 500; // Size of the box to fit contours
const START_X = 0; // Starting X coordinate for positioning
const START_Y = 0; // Starting Y coordinate for positioning
let maxRadiusX = 0;
let maxRadiusY = 0;
let drawContour = false;
let scaledContours = [];

function preload() {
  // Load the JSON file
  jsonData = loadJSON('sketches/sketch 3/contours.json', data => {
    // Scale and position contours
    contours = Object.values(data);
    scaleContours();
    drawContour = true;
    loadContour(0); // Load the first contour initially
  }, (error) => {
    console.error("Error loading JSON:", error);
  });
}

function scaleContours() {
  contours.forEach(contour => {
    let x = contour.map(point => point[0]);
    let y = contour.map(point => point[1]);

    // Find the bounding box of the contour
    let minX = Math.min(...x);
    let maxX = Math.max(...x);
    let minY = Math.min(...y);
    let maxY = Math.max(...y);

    // Compute scaling factors
    let scaleX = BOX_SIZE / (maxX - minX);
    let scaleY = BOX_SIZE / (maxY - minY);

    // Compute the centroid
    let centroidX = (minX + maxX) / 2;
    let centroidY = (minY + maxY) / 2;

    // Scale and position the contour
    let scaledContour = contour.map(point => [
      START_X + (point[0] - centroidX) * scaleX,
      START_Y + (point[1] - centroidY) * scaleY
    ]);

    scaledContours.push(scaledContour);
  });
}

function loadContour(index) {
  if (index < scaledContours.length) {
    let contourData = scaledContours[index];
    x = contourData.map(point => point[0]);
    y = contourData.map(point => point[1]);

    // Compute Fourier coefficients
    fourierX = dft(x);
    fourierY = dft(y);

    // Find the maximum radius for scaling
    maxRadiusX = Math.max(...fourierX.map(f => f.amp));
    maxRadiusY = Math.max(...fourierY.map(f => f.amp));

    // Calculate the centroid of the contour
    let sumX = 0;
    let sumY = 0;
    for (let i = 0; i < x.length; i++) {
      sumX += x[i];
      sumY += y[i];
    }
    centroidOffsetX = sumX / x.length;
    centroidOffsetY = sumY / y.length;

    // Initialize path for the new contour
    time = 0;
    paths[currentContourIndex] = [];
  }
}

function dft(signal) {
  let N = signal.length;
  let result = [];
  for (let k = 0; k < N; k++) {
    let re = 0;
    let im = 0;
    for (let n = 0; n < N; n++) {
      let angle = (TWO_PI * k * n) / N;
      re += signal[n] * cos(angle);
      im -= signal[n] * sin(angle);
    }
    result.push({
      freq: k,
      amp: sqrt(re * re + im * im) / N, // Normalize by N
      phase: atan2(im, re)
    });
  }
  return result;
}

function epiCycles(x, y, rotation, fourier, maxRadius) {
  for (let i = 0; i < fourier.length; i++) {
    let prevx = x;
    let prevy = y;
    let freq = fourier[i].freq;
    let radius = fourier[i].amp * SCALE_FACTOR / maxRadius; // Scale and normalize
    let phase = fourier[i].phase;
    x += radius * cos(freq * time + phase + rotation);
    y += radius * sin(freq * time + phase + rotation);

    stroke(255, 100);
    noFill();
    ellipse(prevx, prevy, radius * 2);
    stroke(255);
    line(prevx, prevy, x, y);
  }
  return createVector(x, y);
}

function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  frameRate(30); // Set the frame rate to control animation speed
}

function draw() {
  background(0);

  if (drawContour && fourierX && fourierY) {
    // Draw each contour independently
    for (let i = 0; i <= currentContourIndex; i++) {
      let path = paths[i];
      let contourData = scaledContours[i];
      
      // Compute absolute position based on centroid and contour position
      let offsetX = CANVAS_WIDTH / 2 - centroidOffsetX * SCALE_FACTOR;
      let offsetY = CANVAS_HEIGHT / 2 - centroidOffsetY * SCALE_FACTOR;
      
      let vx = epiCycles(offsetX, offsetY, 0, fourierX, maxRadiusX);
      let vy = epiCycles(offsetX, offsetY, HALF_PI, fourierY, maxRadiusY);
      let v = createVector(vx.x, vy.y);
      path.unshift(v);

      // Draw the current path
      stroke(255);
      beginShape();
      noFill();
      for (let j = 0; j < path.length; j++) {
        vertex(path[j].x, path[j].y);
      }
      endShape();
    }

    // Update time for animation
    const dt = TWO_PI / fourierY.length;
    time += dt;

    if (time > TWO_PI) {
      time = 0;
      currentContourIndex++;
      if (currentContourIndex < scaledContours.length) {
        loadContour(currentContourIndex);
      } else {
        // Optionally reset or stop if all contours are drawn
        noLoop(); // Stops the draw loop once all contours are processed
      }
    }
  } else {
    console.log("Fourier data not yet available");
  }
}
