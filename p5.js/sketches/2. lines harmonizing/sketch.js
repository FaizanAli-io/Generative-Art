let layers = 5;
let rotStripe = 0; // rotation of each stripe; try 10 or 90;
let minYchange = 0; // these two ranges determine line overlap and width
let maxYchange = 20;

// try lines = true with high alph or lines = false with low alph (100)
let alph = 255;
let lines = true;
let colRand = true;
let filling = true;

let sw = 2; // line width
let colorLines = false; // false for black lines
let extraBlack = 0; // 1 for some black line and white fills; 0 for neither; -2 for fewer colors;
let extraBlackAlph = 255; // out of 255 - used if extraBlack=1 & lines, filling, colorLines all true, low alph, high sw
let r, g, b;

sw = 2;
alph = 0;
layers = 10;
rotStripe = 30;
minYchange = 0;
maxYchange = 20;

function nextState() {
  if (layers >= 1) {
    layers -= 0.5;
  }
  if (rotStripe > 0) {
    rotStripe--;
  }
  alph++;
  setup();
}

function setup() {
  let canv = createCanvas(windowWidth - 20, windowHeight - 20);
  canv.mousePressed(nextState);

  if (lines == true) {
    stroke(0, 0, 0, extraBlackAlph);
    strokeWeight(sw);
  } else {
    noStroke();
  }

  angleMode(DEGREES);

  let end = height / 2 + 500;

  for (let i = 0; i < layers; i++) {
    let y1;

    if (i == 0) {
      y1 = -height / 2 - 300;
    } else {
      y1 = -height / 2 + (height / layers) * i;
    }

    let y2 = y1,
      y3 = y1,
      y4 = y1,
      y5 = y1,
      y6 = y1;

    let rotLayer = random(359);
    let rotThisStripe = 0;

    while (
      (y1 < end) &
      (y2 < end) &
      (y3 < end) &
      (y4 < end) &
      (y5 < end) &
      (y6 < end) &
      (-maxYchange < minYchange)
    ) {
      y1 += random(minYchange, maxYchange);
      y2 += random(minYchange, maxYchange);
      y3 += random(minYchange, maxYchange);
      y4 += random(minYchange, maxYchange);
      y5 += random(minYchange, maxYchange);
      y6 += random(minYchange, maxYchange);

      r = random(256);
      g = random(256);
      b = random(256);

      if (filling == true) {
        fill(r, g, b, alph);
      } else {
        noFill();
      }

      if (colorLines == true) {
        stroke(r, g, b, alph);
      }

      push();

      translate(width / 2, height / 2);
      rotThisStripe += rotStripe;
      rotate(rotThisStripe + rotLayer);
      let xStart = -width / 2;

      beginShape();

      curveVertex(xStart - 300, height / 2 + 500);
      curveVertex(xStart - 300, y1);
      curveVertex(xStart + (width / 5) * 1, y2);
      curveVertex(xStart + (width / 5) * 2, y3);
      curveVertex(xStart + (width / 5) * 3, y4);
      curveVertex(xStart + (width / 5) * 4, y5);
      curveVertex(width / 2 + 300, y6);
      curveVertex(width / 2 + 300, height / 2 + 500);

      endShape(CLOSE);

      pop();
    }
  }
}
