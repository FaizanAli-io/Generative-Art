const G = 1;
const n = 100;

let bodies = [];
let particles = [];

const red = [255, 0, 0];
const blue = [0, 0, 255];
const green = [0, 255, 0];

function createPolarBodies(n, r, v, mass, offset, color) {
  let bodies = [];

  for (let i = 0; i < n; i++) {
    let angle = (2 * PI * i) / n;
    bodies.push({
      px: r * cos(angle) + offset.x,
      py: r * sin(angle) + offset.y,
      vx: -v * sin(angle),
      vy: v * cos(angle),
      c: color,
      m: mass
    });
  }

  return bodies;
}

function setup() {
  createCanvas(1400, 800);

  let center = createVector(width / 2, height / 2);
  // bodyConfig = createPolarBodies(1, 0, 0, 25, center, red);
  // bodyConfig = [...bodyConfig, ...createPolarBodies(4, 200, 10, 100, center, red)];
  bodyConfig = createPolarBodies(6, 200, 5, 100, center, blue);

  let planets = [];
  for (const body of bodyConfig) {
    planets = [
      ...planets,
      ...createPolarBodies(4, 25, 0.1, 25, createVector(body.px, body.py), blue)
    ];
  }

  // bodyConfig[0].px += -100;

  // let i = 0;
  // for (const planet of planets) {
  //   planet.px += 50;
  //   if (++i % 2) planet.m *= 2;
  // }

  // bodyConfig = [...bodyConfig, ...planets];

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
    this.mass = random(1, 3);
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
  constructor({ px, py, vx, vy, c, m }) {
    this.pos = createVector(px, py);
    this.vel = createVector(vx, vy);
    this.acc = createVector();
    this.color = c;
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
    fill(...this.color);
    ellipse(this.pos.x, this.pos.y, this.mass * 0.25);
  }
}
