import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Light
scene.add(new THREE.AmbientLight(0xffffff, 1));

// Materials
const sphereMat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xff00ff });

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // smooth drag
controls.dampingFactor = 0.1;

// Helpers
const createSphere = (pos) => {
  const geo = new THREE.SphereGeometry(1, 16, 16);
  const sphere = new THREE.Mesh(geo, sphereMat);
  sphere.position.copy(pos);
  scene.add(sphere);
};

const createEdge = (start, end) => {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const geo = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
  const edge = new THREE.Mesh(geo, edgeMat);

  edge.position.copy(mid);
  edge.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  scene.add(edge);
};

// Lattice
const gridSize = 7;
const spacing = 4;
const points = [];

for (let x = 0; x < gridSize; x++) {
  for (let y = 0; y < gridSize; y++) {
    for (let z = 0; z < gridSize; z++) {
      const pos = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
      points.push(pos);
      createSphere(pos);
    }
  }
}

for (const a of points) {
  for (const b of points) {
    const dist = a.distanceTo(b);
    if (dist > 0 && dist <= spacing + 0.01) {
      createEdge(a, b);
    }
  }
}

// Animate
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
