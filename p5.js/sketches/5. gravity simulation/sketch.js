const G = 1;
const n = 0;

let bodies = [];
let particles = [];

function createPolarBodies(r, v, mArr) {
  let offset = createVector(width / 2, height / 2);
  let n = mArr.length;
  let config = [];

  for (let i = 0; i < n; i++) {
    let angle = (2 * PI * i) / n;
    config.push({
      px: r * cos(angle) + offset.x,
      py: r * sin(angle) + offset.y,
      vx: -v * sin(angle),
      vy: v * cos(angle),
      m: mArr[i]
    });
  }

  return config;
}

function setup() {
  createCanvas(1200, 600);

  let size = 50;
  let mArr = [size * 3, size * 2, size, size * 3, size * 2, size, size * 3, size * 2, size];
  bodyConfig = createPolarBodies(200, 5, mArr);

  for (let i = 0; i < n; i++) particles.push(new Particle());
  for (let j = 0; j < bodyConfig.length; j++) bodies.push(new Body(bodyConfig[j]));
}

function draw() {
  fill(0, 0, 0, 25);
  rect(0, 0, width, height);

  for (let b of bodies) b.computeGravity(bodies);
  for (let p of particles) p.computeGravity(bodies);
  for (let b of bodies) b.update();
  for (let p of particles) p.update();
  for (let b of bodies) b.display();
  for (let p of particles) p.display();
}

class Particle {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    this.acc = createVector();
    this.mass = 1;
  }

  computeGravity(bodies) {
    this.acc.set(0, 0);
    for (let b of bodies) {
      let force = p5.Vector.sub(b.pos, this.pos);
      let distSq = constrain(force.magSq(), 25, 2500);
      let strength = (G * this.mass * b.mass) / distSq;
      force.setMag(strength / this.mass);
      this.acc.add(force);
    }
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
  }

  display() {
    fill(255);
    ellipse(this.pos.x, this.pos.y, this.mass * 2);
  }
}

class Body {
  constructor({ px, py, vx, vy, m }) {
    this.pos = createVector(px, py);
    this.vel = createVector(vx, vy);
    this.acc = createVector();
    this.mass = m;
  }

  computeGravity(others) {
    this.acc.set(0, 0);
    for (let b of others) {
      if (b === this) continue;
      let force = p5.Vector.sub(b.pos, this.pos);
      let distSq = constrain(force.magSq(), 25, 2500);
      let strength = (G * this.mass * b.mass) / distSq;
      force.setMag(strength / this.mass);
      this.acc.add(force);
    }
  }

  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
  }

  display() {
    noStroke();
    fill(255, 0, 0);
    ellipse(this.pos.x, this.pos.y, this.mass * 0.25);
  }
}
