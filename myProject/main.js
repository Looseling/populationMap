import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mapData2 } from "./public/map.js";

// Rotate your map data
var mapData = rotate90DegreesCounterClockwise(mapData2);
let raindropPositions = [];
let raindropVelocities = [];
// Create a scene
const scene = new THREE.Scene();

// Create a camera
const aspectRatio = window.innerWidth / window.innerHeight;
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setClearColor(0xffea00);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // For smooth rotation
controls.dampingFactor = 0.1;
controls.enableZoom = true;

// Initial camera position
camera.position.set(0, 500, 0);
camera.lookAt(0, 0, 0);

let totalCells = 0;
for (let i = 0; i < mapData.length; i++) {
  for (let j = 0; j < mapData[i].length; j++) {
    if (mapData[i][j] === 1) {
      totalCells++;
    }
  }
}
//map
generateMap();
//clouds
generateClouds();
//rainDrops
createRainDrop();
// Animation loop
function animate() {
  requestAnimationFrame(animate);

  //rainDrops fall
  // for (let i = 0; i < raindropPositions.length; i++) {
  //   // Update position
  //   raindropPositions[i].add(raindropVelocities[i]);

  //   // Update matrix
  //   dummy.position.copy(raindropPositions[i]);
  //   dummy.updateMatrix();
  //   voxel.setMatrixAt(i, dummy.matrix);
  // }
  // voxel.instanceMatrix.needsUpdate = true;
  //
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

function generateClouds() {
  const cloudGeometry = new THREE.BoxGeometry(15, 15, 15); // Cloud shape (you can modify this)
  const cloudMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White clouds
  const cloud = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, 10000);
  scene.add(cloud);
  const dummy = new THREE.Object3D();
  let instanceCounter = 0;

  for (let i = 0; i < mapData.length; i++) {
    for (let j = 0; j < mapData[i].length; j++) {
      if (i % 10 === 0)
        if (Math.random() < 0.05) {
          dummy.position.set(-i, j, Math.random() * 20 - 300);
          console.log(i);
          dummy.updateMatrix();
          cloud.setMatrixAt(instanceCounter++, dummy.matrix);
        }
    }
  }
  cloud.instanceMatrix.needsUpdate = true;
}

function generateMap() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x006600 });
  const cube = new THREE.InstancedMesh(geometry, material, totalCells);
  scene.add(cube);
  const dummy = new THREE.Object3D();
  let instanceCounter = 0;

  for (let i = 0; i < mapData.length; i++) {
    for (let j = 0; j < mapData[i].length; j++) {
      if (mapData[i][j] === 1) {
        dummy.position.set(-i, j, 0);
        dummy.updateMatrix();
        cube.setMatrixAt(instanceCounter++, dummy.matrix);
      }
    }
  }
  cube.instanceMatrix.needsUpdate = true;
}

function createRainDrop() {
  let geometry = new THREE.BoxGeometry(1, 1, 1);
  let material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  let voxel = new THREE.InstancedMesh(geometry, material, 10000);

  scene.add(voxel);
  const dummy = new THREE.Object3D();
  let instanceCounter = 0;
  for (let i = 0; i < mapData.length; i++) {
    for (let j = 0; j < mapData[i].length; j++) {
      if (mapData[i][j] === 1) {
        if (Math.random() < 0.05) {
          dummy.position.set(-i, j, Math.random() * 20 - 300);
          dummy.updateMatrix();
          voxel.setMatrixAt(instanceCounter++, dummy.matrix);
          raindropPositions.push(
            new THREE.Vector3(-i, j, Math.random() * 20 - 300)
          );
          raindropVelocities.push(new THREE.Vector3(0, 0, 1)); // For example, drop down at a rate of 0.1 units per frame
        }
      }
    }
  }
  voxel.instanceMatrix.needsUpdate = true;
}
