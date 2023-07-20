import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as d3 from "d3-geo";
import * as geoJsonData from "./Countries.json" assert { type: "json" };
import Country from "./public/country.js";
import Papa from "papaparse";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import gsap from "gsap";

var popData = await getPopulationData();
console.log(popData);

//new earth map
let countries = geoJsonData.features.map((feature) => {
  let properties = feature.properties;
  let bbox = feature.bbox;
  let polygons;

  if (feature.geometry.type === "Polygon") {
    let polygon = feature.geometry.coordinates[0].map((coord) => {
      let [longitude, latitude] = coord;
      let [x1, z1] = longLatToXZ([longitude, latitude], feature.bbox);
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
        let [x1, z1] = longLatToXZ([longitude, latitude], feature.bbox);
        return {
          x: x1,
          z: z1,
        };
      });
    });
  }

  return new Country(properties, polygons, bbox);
});

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

// // Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // For smooth rotation
// controls.dampingFactor = 0.1;
// controls.enableZoom = true;

// Initial camera position
camera.position.set(0, 100, 500);
camera.lookAt(0, 0, 0);

//test

let currentIndex = 0;

// Function to generate the current country
function renderCountry() {
  // Dispose of old country to free up memory
  while (scene.children.length > 0) {
    const object = scene.children[0];
    object.parent.remove(object);
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  }

  // Render new country
  generateUnit(countries[currentIndex]);
}
// Creating dropdown
let dropdown = document.createElement("select");
countries.forEach((country, index) => {
  let option = document.createElement("option");
  option.value = index;
  option.text = country.properties["ADMIN"];
  dropdown.appendChild(option);
});
document.body.appendChild(dropdown);

// Event listener for dropdown
dropdown.addEventListener("change", (event) => {
  currentIndex = event.target.value;
  renderCountry();
});

// Initial country rendering
renderCountry();

//map
function generateUnit(country) {
  CountryNameBackgroundText(country.properties["ADMIN"]);
  generateCountryMap(country);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

animate();

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
function generateCountryMap(country, centerPosition) {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x006600 });
  const lines = [];
  for (let polygon of country.polygons) {
    for (let i = 0; i < polygon.length - 1; i++) {
      lines.push(
        bresenhamLine(
          polygon[i].x,
          polygon[i].z,
          polygon[i + 1].x,
          polygon[i + 1].z
        )
      );
    }
  }

  const totalVoxels = lines.reduce((acc, line) => acc + line.length, 0);
  const voxelMesh = new THREE.InstancedMesh(geometry, material, totalVoxels);
  scene.add(voxelMesh);

  const dummy = new THREE.Object3D();
  let instanceCounter = 0;

  for (let line of lines) {
    for (let point of line) {
      dummy.position.set(point.x, 0, point.y);
      dummy.updateMatrix();
      voxelMesh.setMatrixAt(instanceCounter++, dummy.matrix);
    }
  }

  voxelMesh.instanceMatrix.needsUpdate = true;
}

function longLatToXZ([longitude, latitude], bbox) {
  // Define your projection
  let projection = d3.geoEquirectangular();

  // You might want to scale and translate your projection depending on the size of your scene
  let scale = 1000; // This should be set depending on your scene size
  let translateX = 0; // Center of your scene in x
  let translateY = 0; // Center of your scene in z

  projection = projection.scale(scale).translate([translateX, translateY]);

  // Now you can project your longitude and latitude to x and z

  let projected = projection([longitude, latitude]);
  const [centerX, centerZ] = getCenterPointInBoundingBox(bbox);
  let projected2 = projection([centerX, centerZ]);

  let x = Math.ceil(projected[0]) - projected2[0];
  let z = Math.ceil(projected[1]) - projected2[1];

  return [x, z];
}

function getPointsInCountry(country) {
  let bbox = country.bbox; // Assuming that bbox is [minX, minZ, maxX, maxZ]
  let points = [];
  let stepSize = 1; // Determines the density of the grid
  console.log(country.name);
  let [minX, minZ] = longLatToXZ([bbox[0], bbox[1]]);
  let [maxX, maxZ] = longLatToXZ([bbox[2], bbox[3]]);

  for (let x = minX; x <= maxX; x += stepSize) {
    if (minZ <= maxZ) {
      for (let z = minZ; z <= maxZ; z += stepSize) {
        let point = [x, z];
        for (let s = 0; s < country.polygons.length; s++)
          if (pointInPolygon(point, country.polygons[s])) {
            points.push(point);
          }
      }
    } else {
      for (let z = maxZ; z <= minZ; z += stepSize) {
        let point = [x, z];
        for (let s = 0; s < country.polygons.length; s++)
          if (pointInPolygon(point, country.polygons[s])) {
            points.push(point);
          }
      }
    }
  }
  return points;
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

function getCenterPointInBoundingBox(bbox) {
  let Long = (bbox[2] + bbox[0]) / 2;
  let Lat = (bbox[3] + bbox[1]) / 2;

  return [Long, Lat];
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

async function getPopulationData() {
  try {
    const response = await fetch("./PopulationData.csv");
    const data = await response.text();
    const results = Papa.parse(data, { header: true }); // set header option to true if your data has a header
    return results.data; // parsed data
  } catch (error) {
    console.error("Error:", error);
  }
}
function extractPopulationData(popData, country) {
  let matchingCountry = popData.find(
    (p) => p["Data Source"] === country.properties["ADMIN"]
  );
  if (matchingCountry != null) return matchingCountry["__parsed_extra"][63];

  // console.log(country.properties["ADMIN"]);
  return null;
}

function getRandomColor() {
  var r = Math.floor(Math.random() * 128 + 127).toString(16);
  var g = Math.floor(Math.random() * 128 + 127).toString(16);
  var b = Math.floor(Math.random() * 128 + 127).toString(16);
  return "#" + r + g + b;
}
function CountryNameBackgroundText(name) {
  const loader = new FontLoader();

  loader.load("./fonts/VCR OSD Mono_Regular.json", function (font) {
    const geometry = new TextGeometry(name, {
      font: font,
      size: 30,
      height: 2,
    });
    const textMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xad4000 })
    );
    geometry.computeBoundingBox();
    const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;

    textMesh.position.x = -textWidth / 2;
    textMesh.position.z = -400;

    scene.add(textMesh);
  });
}
