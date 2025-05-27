// Parameters for controlling the animation
let centerX = -0.7436438870371587;
let centerY = 0.1318259043691406;
let zoom = 1;
let zoomSpeed = 0.01;
let maxIterations = 100;
let colorMode = 2;
let colorCycle = 0;
let resolutionScale = 2;
let frameSkip = 0;
let colorTable = [];

function setup() {
  createCanvas(1300, 640);
  pixelDensity(1);

  // Create a button to toggle color modes
  let colorButton = createButton("Toggle Color Mode");
  colorButton.position(10, height + 10);
  colorButton.mousePressed(() => {
    colorMode = (colorMode + 1) % 3;
  });

  // Create a slider for iteration depth
  let iterSlider = createSlider(50, 300, 100, 10);
  iterSlider.position(150, height + 10);
  iterSlider.input(() => {
    maxIterations = iterSlider.value();
  });

  // Create a slider for resolution
  let resSlider = createSlider(1, 4, 2, 1);
  resSlider.position(300, height + 10);
  resSlider.input(() => {
    resolutionScale = resSlider.value();
  });

  // Pre-calculate color lookup table
  initColorTable();
}

// Pre-calculate colors for faster rendering
function initColorTable() {
  colorTable = [];
  for (let i = 0; i < 1000; i++) {
    let norm = i / 1000;

    // Rainbow color scheme
    let hue = (norm * 360) % 360;
    let rgbValues = hsvToRgb(hue, 1, 1);

    colorTable.push(rgbValues);
  }
}

function draw() {
  // Increase zoom level every few frames
  if (frameCount % (frameSkip + 1) === 0) {
    zoom *= 1 + zoomSpeed;
    colorCycle += 0.5;

    // Calculate the bounds based on current zoom and center point
    let xmin = centerX - 2.5 / zoom;
    let xmax = centerX + 2.5 / zoom;
    let ymin = centerY - 2.5 / zoom;
    let ymax = centerY + 2.5 / zoom;

    // Optimization: Render at lower resolution
    let scaledWidth = width / resolutionScale;
    let scaledHeight = height / resolutionScale;

    loadPixels();

    // Web Workers would be ideal here, but we'll use loop optimization instead
    for (let x = 0; x < scaledWidth; x++) {
      for (let y = 0; y < scaledHeight; y++) {
        let a = map(x, 0, scaledWidth, xmin, xmax);
        let b = map(y, 0, scaledHeight, ymin, ymax);

        // Use optimized Mandelbrot calculation
        let result = calculateMandelbrot(a, b, maxIterations);
        let n = result.iterations;
        let z = result.z;

        // Calculate normalized iteration count with smoothing
        let norm = n;
        if (n < maxIterations) {
          norm = n - Math.log2(Math.log2(z)) + 4.0;
        }
        norm = map(norm, 0, maxIterations, 0, 1);

        // Apply different color schemes using lookup tables when possible
        let r, g, b2;

        if (colorMode === 0) {
          // Rainbow color scheme
          let hue = (norm * 360 + colorCycle) % 360;
          let colorIndex = Math.floor((hue / 360) * 1000) % 1000;
          let rgbColor = colorTable[colorIndex];
          r = rgbColor[0];
          g = rgbColor[1];
          b2 = rgbColor[2];
          if (n >= maxIterations) {
            r = 0;
            g = 0;
            b2 = 0;
          }
        } else if (colorMode === 1) {
          // Blue-gold color scheme
          r = n < maxIterations ? 255 * Math.sin(0.3 * norm * Math.PI + colorCycle / 30) : 0;
          g =
            n < maxIterations
              ? 255 * Math.sin(0.3 * norm * Math.PI + Math.PI / 2 + colorCycle / 30)
              : 0;
          b2 =
            n < maxIterations
              ? 255 * Math.sin(0.3 * norm * Math.PI + Math.PI + colorCycle / 30)
              : 0;
        } else {
          // Fire color scheme
          r = n < maxIterations ? 255 * Math.sqrt(norm) : 0;
          g = n < maxIterations ? 255 * Math.pow(norm, 3) : 0;
          b2 = n < maxIterations ? 255 * Math.sin(norm * Math.PI) : 0;
        }

        // Apply to all pixels in the scaled block
        for (let dx = 0; dx < resolutionScale; dx++) {
          for (let dy = 0; dy < resolutionScale; dy++) {
            if (x * resolutionScale + dx < width && y * resolutionScale + dy < height) {
              let pix = (x * resolutionScale + dx + (y * resolutionScale + dy) * width) * 4;
              pixels[pix + 0] = r;
              pixels[pix + 1] = g;
              pixels[pix + 2] = b2;
              pixels[pix + 3] = 255;
            }
          }
        }
      }
    }

    updatePixels();
  }

  // Display current zoom level
  fill(255);
  noStroke();
  rect(0, 0, 150, 30);
  fill(0);
  text("Zoom: " + zoom.toFixed(2), 10, 20);
}

// Optimized Mandelbrot calculation
function calculateMandelbrot(ca, cb, maxIter) {
  let a = 0;
  let b = 0;
  let n = 0;

  // Optimization: Check if point is in main bulb or period-2 bulb
  const q = (ca - 0.25) * (ca - 0.25) + cb * cb;
  if (q * (q + (ca - 0.25)) < 0.25 * cb * cb || (ca + 1) * (ca + 1) + cb * cb < 0.0625) {
    return { iterations: maxIter, z: 0 };
  }

  // Use fewer iterations for points that are likely to escape quickly
  let localMaxIter = maxIter;
  if (ca > 0 || Math.abs(cb) > 1.5) {
    localMaxIter = Math.min(maxIter, 50);
  }

  // Use optimized loop
  let aa = 0;
  let bb = 0;
  let z = 0;

  for (n = 0; n < localMaxIter; n++) {
    aa = a * a;
    bb = b * b;
    z = aa + bb;

    if (z > 4) break;

    b = 2 * a * b + cb;
    a = aa - bb + ca;
  }

  return { iterations: n, z: z };
}

// Convert HSV to RGB color space
function hsvToRgb(h, s, v) {
  let r, g, b;

  let i = Math.floor(h / 60) % 6;
  let f = h / 60 - Math.floor(h / 60);
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return [r * 255, g * 255, b * 255];
}

// Mouse click to set new center point
function mousePressed() {
  if (mouseY < height) {
    let xmin = centerX - 2.5 / zoom;
    let xmax = centerX + 2.5 / zoom;
    let ymin = centerY - 2.5 / zoom;
    let ymax = centerY + 2.5 / zoom;

    centerX = map(mouseX, 0, width, xmin, xmax);
    centerY = map(mouseY, 0, height, ymin, ymax);
  }
}

// Keyboard controls
function keyPressed() {
  // Space to pause/resume zooming
  if (key === " ") {
    zoomSpeed = zoomSpeed === 0 ? 0.01 : 0;
  }
  // R to reset view
  if (key === "r" || key === "R") {
    centerX = -0.7436438870371587;
    centerY = 0.1318259043691406;
    zoom = 1;
  }
  // Up/down arrows to control zoom speed
  if (keyCode === UP_ARROW) {
    zoomSpeed += 0.001;
  }
  if (keyCode === DOWN_ARROW) {
    zoomSpeed = max(0, zoomSpeed - 0.001);
  }
  // F key to toggle frame skipping
  if (key === "f" || key === "F") {
    frameSkip = (frameSkip + 1) % 5;
  }
}
