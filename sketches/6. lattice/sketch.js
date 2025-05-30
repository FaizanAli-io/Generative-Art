import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const spacing = 16;
const gridSize = 3;
const decayRate = 0.01;
const movementSpeed = 0.1;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 10, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 1));

const sphereMat = new THREE.MeshStandardMaterial({ color: 0x00ffff });
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xff00ff });

const n = 4;
const boxSize = gridSize * spacing * n;
const boxGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
const boxMat = new THREE.LineBasicMaterial({ color: 0x99ccff });
const edgesGeo = new THREE.EdgesGeometry(boxGeo);
const boxWireframe = new THREE.LineSegments(edgesGeo, boxMat);
boxWireframe.position.set(0, 0, 0);
scene.add(boxWireframe);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;

const createSphere = (pos) => {
  const geo = new THREE.SphereGeometry(4, 16, 16);
  const sphere = new THREE.Mesh(geo, sphereMat);
  sphere.position.copy(pos);
  scene.add(sphere);
  return sphere;
};

const createEdge = (start, end) => {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  const geo = new THREE.CylinderGeometry(1, 1, length, 8);
  const edge = new THREE.Mesh(geo, edgeMat);

  edge.position.copy(mid);
  edge.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  scene.add(edge);
  return edge;
};

const nodes = {};
const edges = {};

for (let x = 0; x < gridSize; x++) {
  for (let y = 0; y < gridSize; y++) {
    for (let z = 0; z < gridSize; z++) {
      const key = `${x},${y},${z}`;
      const cf = (gridSize - 1) / 2;
      const pos = new THREE.Vector3((x - cf) * spacing, (y - cf) * spacing, (z - cf) * spacing);
      nodes[key] = { pos, shape: createSphere(pos) };
    }
  }
}

const dirs = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1]
];

for (let x = 0; x < gridSize; x++) {
  for (let y = 0; y < gridSize; y++) {
    for (let z = 0; z < gridSize; z++) {
      const key = `${x},${y},${z}`;
      const node = nodes[key];

      for (const [dx, dy, dz] of dirs) {
        const nx = x + dx,
          ny = y + dy,
          nz = z + dz;

        if (nx < 0 || ny < 0 || nz < 0 || nx >= gridSize || ny >= gridSize || nz >= gridSize)
          continue;

        const nkey = `${nx},${ny},${nz}`;
        const edge1 = `${key} - ${nkey}`;
        const edge2 = `${nkey} - ${key}`;

        if (edge1 in edges || edge2 in edges) continue;
        edges[edge1] = createEdge(node.pos, nodes[nkey].pos);
      }
    }
  }
}

const adjacency = {};

for (const key in nodes) adjacency[key] = [];

for (const edgeKey in edges) {
  const [a, b] = edgeKey.split(" - ");
  adjacency[a].push(b);
  adjacency[b].push(a);
}

function getComponents() {
  const visited = new Set();
  const components = [];

  for (const node in adjacency) {
    if (visited.has(node)) continue;

    const queue = [node];
    const group = [];
    visited.add(node);

    while (queue.length) {
      const curr = queue.pop();
      group.push(curr);

      for (const neighbor of adjacency[curr]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(group);
  }

  return components;
}

let separationGroups = [];

let separatedComponents = new Set();

function startSeparation(components) {
  const allGroups = components.map((group) => ({ group, id: group.slice().sort().join(",") }));

  for (const id of separatedComponents) {
    if (!allGroups.some((g) => g.id === id)) {
      separatedComponents.delete(id);
    }
  }

  separationGroups = separationGroups.filter((group) => {
    const id = group.nodes.slice().sort().join(",");
    return separatedComponents.has(id);
  });

  const newGroups = allGroups.filter(({ id }) => !separatedComponents.has(id));

  if (newGroups.length !== 2) return;

  const dir = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(1),
    THREE.MathUtils.randFloatSpread(1),
    THREE.MathUtils.randFloatSpread(1)
  )
    .normalize()
    .multiplyScalar(movementSpeed);

  for (let i = 0; i < 2; i++) {
    const { group, id } = newGroups[i];
    separatedComponents.add(id);
    separationGroups.push({
      nodes: group,
      dir: i === 0 ? dir.clone() : dir.clone().negate()
    });
  }
}

function separate() {
  const halfSize = boxSize / 2;

  for (const group of separationGroups) {
    for (const key of group.nodes) {
      const node = nodes[key];
      node.pos.add(group.dir);

      ["x", "y", "z"].forEach((axis) => {
        if (node.pos[axis] >= halfSize || node.pos[axis] < -halfSize) {
          group.dir[axis] *= -1;
        }
      });

      node.shape.position.copy(node.pos);
    }

    for (const edgeKey in edges) {
      const [a, b] = edgeKey.split(" - ");
      if (group.nodes.includes(a) && group.nodes.includes(b)) {
        const edge = edges[edgeKey];
        edge.position.add(group.dir);
      }
    }
  }
}

function decay() {
  const keys = Object.keys(edges);
  if (keys.length === 0) return;

  if (!decay.current) {
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    decay.current = { key: randKey, edge: edges[randKey] };
  }

  const { key, edge } = decay.current;
  if (!edge) return;

  edge.scale.x = Math.max(0, edge.scale.x - decayRate);
  edge.scale.z = Math.max(0, edge.scale.z - decayRate);

  if (edge.scale.x === 0 && edge.scale.z === 0) {
    const [a, b] = key.split(" - ");
    adjacency[a] = adjacency[a].filter((n) => n !== b);
    adjacency[b] = adjacency[b].filter((n) => n !== a);

    delete edges[key];
    scene.remove(edge);
    decay.current = null;

    const comps = getComponents();
    if (comps.length > 1) {
      startSeparation(comps);
    }
  }
}

function animate() {
  decay();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  if (separationGroups.length) separate();
}

animate();
