import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mapData2 } from "./public/map.js";
import * as d3 from "d3-geo";
import * as geoJsonData from "./Countries.json" assert { type: "json" };
import Country from "./public/country.js";

//map geoJson to country class

let countries = geoJsonData.features.map((feature) => {
  let properties = feature.properties;
  let bbox = feature.bbox;
  let polygons;

  if (feature.geometry.type === "Polygon") {
    let polygon = feature.geometry.coordinates[0].map((coord) => {
      let [longitude, latitude] = coord;
      let [x1, z1] = longLatToXZ([longitude, latitude]);
      return {
        x: x1,
        z: z1,
      };
    });
    polygons = [polygon];
  } else if (feature.geometry.type === "MultiPolygon") {
    polygons = feature.geometry.coordinates.map((coords) => {
      return coords[0].map((coord) => {
        let [longitude, latitude] = coord;
        let [x1, z1] = longLatToXZ([longitude, latitude]);
        return {
          x: x1,
          z: z1,
        };
      });
    });
  }

  return new Country(properties, polygons, bbox);
});

//test
let test = getRandomPointInCountry(countries[0]);
console.log(test);

const testgeometry = new THREE.BoxGeometry(5, 5, 5);
const testmaterial = new THREE.MeshBasicMaterial({ color: 0xdc143c });
const testvoxelMesh = new THREE.Mesh(testgeometry, testmaterial);
testvoxelMesh.position.x = test[0];
testvoxelMesh.position.z = test[1];

//new earth map

// Rotate your map data
var mapData = mapData2;

// Create a scene
const scene = new THREE.Scene();

scene.add(testvoxelMesh);

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
camera.position.set(-2.7322606070108852, 1154.994758902392, 358.00240601068845);
camera.lookAt(0, 0, 0);

//map
generateMap();
//clouds
//rain
let raindrops = [];
let numberOfRaindrops = 1000;
// Initialize raindrops
// for (let i = 0; i < numberOfRaindrops; i++) {
//   let raindrop = {
//     position: [Math.random() * mapWidth, Math.random() * mapHeight], // start position
//     velocity: [0, -1], // velocity (falling down)
//   };

//   raindrops.push(raindrop);
// }
// //old raindrops
// let geometry = new THREE.BoxGeometry(1, 1, 1);
// let material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
// let voxel = new THREE.InstancedMesh(geometry, material, numberOfRaindrops);
// scene.add(voxel);
// const dummy = new THREE.Object3D();
// let raindropTimers = [];
// let instanceCounter = 0;

// for (let i = 0; i < mapData.length; i++) {
//   for (let j = 0; j < mapData[i].length; j++) {
//     if (mapData[i][j] === 1) {
//       if (Math.random() < 0.05) {
//         let position = new THREE.Vector3(-i, Math.random() * 20 + 300, j);
//         let velocity = new THREE.Vector3(0, -1, 0); // All raindrops have the same speed

//         // Add this velocity and position to the arrays
//         raindropPositions.push(position);
//         raindropVelocities.push(velocity);

//         // Add a randomized timer for each raindrop
//         raindropTimers.push(Math.random() * 5);

//         dummy.position.copy(position);
//         dummy.updateMatrix();
//         voxel.setMatrixAt(instanceCounter++, dummy.matrix);
//       }
//     }
//   }
// }
// voxel.instanceMatrix.needsUpdate = true;

// Animation loop
function animate() {
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

function bresenhamLine(x0, y0, x1, y1) {
  let dx = Math.abs(x1 - x0),
    sx = x0 < x1 ? 1 : -1;
  let dy = -Math.abs(y1 - y0),
    sy = y0 < y1 ? 1 : -1;
  let err = dx + dy,
    e2;

  let points = [];
  while (true) {
    points.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
  }
  return points;
}

function generateMap() {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x006600 });

  let totalVoxels = 0;
  for (let country of countries) {
    for (let polygon of country.polygons) {
      for (let i = 0; i < polygon.length - 1; i++) {
        let line = bresenhamLine(
          polygon[i].x,
          polygon[i].z,
          polygon[i + 1].x,
          polygon[i + 1].z
        );
        totalVoxels += line.length;
      }
    }
  }

  const voxelMesh = new THREE.InstancedMesh(geometry, material, totalVoxels);
  scene.add(voxelMesh);
  const dummy = new THREE.Object3D();
  let instanceCounter = 0;

  for (let country of countries) {
    for (let polygon of country.polygons) {
      for (let i = 0; i < polygon.length - 1; i++) {
        let line = bresenhamLine(
          polygon[i].x,
          polygon[i].z,
          polygon[i + 1].x,
          polygon[i + 1].z
        );
        for (let point of line) {
          dummy.position.set(point.x, 0, point.y);
          dummy.updateMatrix();
          voxelMesh.setMatrixAt(instanceCounter++, dummy.matrix);
        }
      }
    }
  }

  voxelMesh.instanceMatrix.needsUpdate = true;
}

function longLatToXZ([longitude, latitude]) {
  // Define your projection
  let projection = d3.geoEquirectangular();

  // You might want to scale and translate your projection depending on the size of your scene
  let scale = 1000; // This should be set depending on your scene size
  let translateX = 0; // Center of your scene in x
  let translateY = 0; // Center of your scene in z

  projection = projection.scale(scale).translate([translateX, translateY]);

  // Now you can project your longitude and latitude to x and z

  let projected = projection([longitude, latitude]);

  let x = Math.ceil(projected[0]);
  let z = Math.ceil(projected[1]);

  return [x, z];
}

function getRandomPointInCountry(country) {
  let bbox = country.bbox; // Assuming that bbox is [minX, minZ, maxX, maxZ]
  let point;
  do {
    point = getRandomPointInBoundingBox(bbox);
    console.log(country.polygons[0]);
  } while (!pointInPolygon(point, country.polygons[0]));

  return point;
}

function pointInPolygon(point, polygon) {
  let n = polygon.length;
  let is_in = false;
  let x = point[0];
  let y = point[1];
  let x1, x2, y1, y2;

  for (var i = 0; i < n - 1; ++i) {
    x1 = polygon[i].x;
    x2 = polygon[i + 1].x;
    y1 = polygon[i].z;
    y2 = polygon[i + 1].z;

    if (y < y1 != y < y2 && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
      is_in = !is_in;
    }
  }

  return is_in;
}
function isLeft(P0, P1, P2) {
  return (
    (P1[0] - P0[0]) * (P2[1] - P0[1]) - (P2[0] - P0[0]) * (P1[1] - P0[1]) > 0
  );
}

function getRandomPointInBoundingBox(bbox) {
  let randLong = randomInRange(bbox[0], bbox[2]);
  let randLat = randomInRange(bbox[1], bbox[3]);

  let [x, z] = longLatToXZ([randLong, randLat]);
  return [x, z];
}
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}
