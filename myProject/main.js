import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mapData2 } from "./public/map.js";
var clock = new THREE.Clock();
// Rotate your map data
var mapData = mapData2;
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
let geometry = new THREE.BoxGeometry(1, 1, 1);
let material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
let voxel = new THREE.InstancedMesh(geometry, material, 10000);
scene.add(voxel);
const dummy = new THREE.Object3D();
let raindropTimers = [];
let instanceCounter = 0;

for (let i = 0; i < mapData.length; i++) {
  for (let j = 0; j < mapData[i].length; j++) {
    if (mapData[i][j] === 1) {
      if (Math.random() < 0.05) {
        let position = new THREE.Vector3(-i, Math.random() * 20 + 300, j);
        let velocity = new THREE.Vector3(0, -1, 0); // All raindrops have the same speed

        // Add this velocity and position to the arrays
        raindropPositions.push(position);
        raindropVelocities.push(velocity);

        // Add a randomized timer for each raindrop
        raindropTimers.push(Math.random() * 5);

        dummy.position.copy(position);
        dummy.updateMatrix();
        voxel.setMatrixAt(instanceCounter++, dummy.matrix);
      }
    }
  }
}
voxel.instanceMatrix.needsUpdate = true;

// Animation loop
function animate() {
  let deltaTime = clock.getDelta(); // get the time since last frame in seconds
  updateRaindrops(deltaTime);
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

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
          dummy.position.set(-i, Math.random() * 20 + 300, j);
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
        dummy.position.set(-i, 0, j);
        dummy.updateMatrix();
        cube.setMatrixAt(instanceCounter++, dummy.matrix);
      }
    }
  }
  cube.instanceMatrix.needsUpdate = true;
}

function createRainDrop() {}
function updateRaindrops(deltaTime) {
  for (let i = 0; i < raindropPositions.length; i++) {
    let velocity = raindropVelocities[i];
    let position = raindropPositions[i];
    let timer = raindropTimers[i];

    timer -= deltaTime;
    if (timer <= 0) {
      // Reset the raindrop's position and timer
      position.y = Math.random() * 20 + 300;
      timer = Math.random() * 5;
    } else {
      // Apply gravity to the velocity
      velocity.y += -9.8 * deltaTime;
    }

    // Update position based on velocity and time
    position.add(velocity.clone().multiplyScalar(deltaTime));

    // Update the positions of the instances
    dummy.position.copy(position);
    dummy.updateMatrix();
    voxel.setMatrixAt(i, dummy.matrix);

    // Save the updated timer
    raindropTimers[i] = timer;
  }
  voxel.instanceMatrix.needsUpdate = true;
}
