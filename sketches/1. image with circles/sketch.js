let z;
let img;
let spots;
let circles;

function preload() {
  img = loadImage("mask.png");
}

function setup() {

  img.loadPixels();
  circles = [];
  spots = [];
  z = 0;

  for (let x = 0; x < img.width; x++) {
    for (let y = 0; y < img.height; y++) {
      let index = x + y * img.width;
      let c = img.pixels[index * 4];
      if (brightness([c]) > 1) {
        spots.push(createVector(x, y));
      }
    }
  }

  createCanvas(img.width, img.height);
}

class Circle {

  constructor(x, y) {
    this.growing = true;
    this.r = 1;
    this.x = x;
    this.y = y;
    this.c = [random(0, 255), 0, z - 50];
  }

  show() {
    noFill();
    strokeWeight(2);
    stroke(this.c[0], this.c[1], this.c[2]);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
  }

  grow() {
    if (this.growing) { this.r += 0.05; }
  }

  edge() {
    if (this.x + this.r > width || this.x - this.r < 0 || 
      this.y + this.r > height || this.y - this.r < 0) {
        return false;
      }
  }
}

function draw() {

  background(0);
  frameRate(40);

  let fails = 0;
  let count = 0;
  let total = 25;

  while (count < total && fails < 1000) {
    let circ = newCircle();
    if (circ != null) {
      circles.push(circ);
      count++;
    } else {
      fails++;
    }
  }

  for (let i = 0; i < circles.length; i++) {

    let current = circles[i];

    if (current.growing) {

      if (current.edge()) {
        current.growing = false;
      
      }

      else {
        for (let j = 0; j < circles.length; j++) {
          let other = circles[j];
          if (other != current) {
            let d = dist(current.x, current.y, other.x, other.y);
            if (d - 2 <= current.r + other.r) {
              current.growing = false;
              break;
            }
          }
        }
      }

    }

    current.show();
    current.grow();
    z += 0.0025;
  }

}

function newCircle() {
  let i = int(random(0, spots.length));
  let x = spots[i].x;
  let y = spots[i].y;
  let valid = true;

  for (let i = 0; i < circles.length; i++) {
    let c = circles[i];
    let d = dist(c.x, c.y, x, y);
    if (d < c.r) { valid = false; break; }
  }

  return valid ? new Circle(x, y) : null;
}