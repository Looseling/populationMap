import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mapData2 } from "./public/map.js";

// Rotate your map data
var mapData = rotate90DegreesCounterClockwise(mapData2);

// Create a scene
const scene = new THREE.Scene();

// Create a camera
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // For smooth rotation
controls.dampingFactor = 0.1;
controls.enableZoom = true;

// Initial camera position
camera.position.set(0, 500, 0);
camera.lookAt(0, 0, 0);

// Create a voxel for each 'land' cell in the map data
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// // Create a group to hold all voxels
// const voxels = new THREE.Group();
// scene.add(voxels);

// for (let i = 0; i < mapData.length; i++) {
//   for (let j = 0; j < mapData[i].length; j++) {
//     // If the cell is land, create a voxel
//     if (mapData[i][j] === 1) {
//       const cube = new THREE.Mesh(geometry, material);
//       cube.position.set(-i, j, 0); // Use negative 'j' to flip the map
//       voxels.add(cube);
//     }
//   }
// }

const geometry = new THREE.BufferGeometry();
const vertices = [];
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

for (let i = 0; i < mapData.length; i++) {
  for (let j = 0; j < mapData[i].length; j++) {
    // If the cell is land, create a voxel
    if (mapData[i][j] === 1) {
      vertices.push(
        -i,
        j,
        0, // voxel 1 corner 1
        -i,
        j + 1,
        0, // voxel 1 corner 2
        -i + 1,
        j,
        0 // voxel 1 corner 3
        // ... add the rest corners for the voxel
      );
    }
  }
}

geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices, 3)
);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Required for smooth rotation with OrbitControls
  controls.update();
  renderer.render(scene, camera);
}

animate();

function rotate90DegreesCounterClockwise(matrix) {
  // Copy the original matrix
  let copy = [...matrix];

  // Create a new matrix by mapping each (x, y) position to (y, x), then reverse the entire matrix
  let rotated = copy[0]
    .map((val, index) => copy.map((row) => row[index]))
    .reverse();
  return rotated;
}
