import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as d3 from "d3-geo";
import * as geoJsonData from "./Countries.json" assert { type: "json" };
import Country from "./public/country.js";
import Papa from "papaparse";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import gsap from "gsap";
import Chart from "chart.js/auto";

var popData = await getPopulationData();
var populationNumber = 0;
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
const aspectRatio =
  document.getElementById("threeContainer").clientWidth /
  document.getElementById("threeContainer").clientHeight;
const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 10000);

// Create a renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(
  document.getElementById("threeContainer").clientWidth,
  document.getElementById("threeContainer").clientHeight
);
document.getElementById("threeContainer").appendChild(renderer.domElement);
renderer.setClearColor(0x502f4c);

// // Controls
// const controls = new OrbitControls(camera, renderer.domElement);
// controls.enableDamping = true; // For smooth rotation
// controls.dampingFactor = 0.1;
// controls.enableZoom = true;

// Initial camera position
camera.position.set(0, 100, 300);
camera.lookAt(0, 0, 0);
//Camera Movement
window.addEventListener("contextmenu", function () {
  gsap.to(camera.position, {
    z: 500,
    duration: 1.5,
  });
});

//test
//rain
const rainDropVelocity = new THREE.Vector3(0, -5, 0);
const boxGeometry = new THREE.BoxGeometry(5, 5, 5);
const dummyRain = new THREE.Object3D();
let currentIndex = 0;
let currentCountry = null;
// Function to generate the current country
function renderCountry() {
  // Dispose of old country to free up memory
  while (scene.children.length > 0) {
    const object = scene.children[0];
    object.parent.remove(object);
  }

  // Render new country
  let position = new THREE.Vector3(0, 0, 0); // Center of the screen
  populationNumber = extractPopulationData(
    popData,
    countries[currentIndex],
    63
  );
  currentCountry = generateUnit(countries[currentIndex], position);
}

// Creating dropdown
let dropdown = document.getElementById("myDropdown");
//style
dropdown.style.width = "100%";
dropdown.style.padding = "10px";
dropdown.style.fontFamily = "'Press Start 2P', cursive";
dropdown.style.backgroundColor = "rgba(35, 13, 25, 0.8)";
dropdown.style.border = "2px solid black";
dropdown.style.color = "white";
dropdown.style.outline = "none";
dropdown.style.fontSize = "1em";
dropdown.style.cursor = "pointer";
dropdown.style.WebkitAppearance =
  "none"; /* Removes default chrome and safari style */
dropdown.style.MozAppearance = "none"; /* Removes default Firefox style */
dropdown.style.appearance = "none"; /* Removes the default select box style */

// Populate dropdown
countries.forEach((country, index) => {
  let option = document.createElement("option");
  option.value = index;
  option.text = country.properties["ADMIN"];
  dropdown.appendChild(option);
});

// Event listener for dropdown
dropdown.addEventListener("change", (event) => {
  currentIndex = event.target.value;
  renderCountry();
});

// Initial country rendering
renderCountry();

//map
function generateUnit(country, position) {
  CountryNameBackgroundText(country.properties["ADMIN"], position);
  generateCountryMap(country, position);
  setupCountries(country);
  populationNumber = extractPopulationData(popData, country, 63);
  var eblan = extractPopulationData2(popData, country);
  DataColumn(eblan);
  return country;
}
//rain logic

function setupCountries(country) {
  country.voxels = getPointsInCountry(country);
  const populationRaindrops = Math.ceil(populationNumber / 10000);
  const countryColor = new THREE.Color(getRandomColor());
  const materialRain = new THREE.MeshBasicMaterial({ color: countryColor });

  country.voxelRain = new THREE.InstancedMesh(
    boxGeometry,
    materialRain,
    populationRaindrops
  );
  country.raindropStates = setupRaindropStates(country, populationRaindrops);
  country.highestVoxels = new Map();

  scene.add(country.voxelRain);
}

function setupRaindropStates(country, raindropCount) {
  const states = new Array(raindropCount);
  for (let i = 0; i < raindropCount; i++) {
    const rainCoordIndex = Math.floor(Math.random() * country.voxels.length);
    states[i] = {
      position: new THREE.Vector3(
        country.voxels[rainCoordIndex][0],
        190,
        country.voxels[rainCoordIndex][1]
      ),
      velocity: rainDropVelocity,
      isFalling: Math.random() > 0.5,
    };
    updateRaindropMatrix(country.voxelRain, states[i].position, i);
  }
  return states;
}

function updateRaindropMatrix(voxelRain, position, index) {
  dummyRain.position.copy(position);
  dummyRain.updateMatrix();
  voxelRain.setMatrixAt(index, dummyRain.matrix);
  voxelRain.instanceMatrix.needsUpdate = true;
}

function animateRaindrops(currentIndex) {
  var country = countries[currentIndex];
  for (let i = 0; i < country.raindropStates.length; i++) {
    const state = country.raindropStates[i];
    if (!state.isFalling && Math.random() > 0.98) state.isFalling = true;
    if (state.isFalling) {
      state.position.add(state.velocity);
      const highest =
        country.highestVoxels.get(`${state.position.x},${state.position.z}`) ||
        0;
      if (state.position.y <= highest) {
        state.position.y = highest + 5;
        state.isFalling = false;
        country.highestVoxels.set(
          `${state.position.x},${state.position.z}`,
          state.position.y
        );
      } else {
        updateRaindropMatrix(country.voxelRain, state.position, i);
      }
    }
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (currentCountry) {
    animateRaindrops(currentIndex);
  }

  renderer.render(scene, camera);
}

// Initial setup
setupCountries(countries[0]);
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
          polygon[i].x + centerPosition.x,
          polygon[i].z + centerPosition.z,
          polygon[i + 1].x + centerPosition.x,
          polygon[i + 1].z + centerPosition.z
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
  let scale = 500; // This should be set depending on your scene size
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
  let [minX, minZ] = longLatToXZ([bbox[0], bbox[1]], bbox);
  let [maxX, maxZ] = longLatToXZ([bbox[2], bbox[3]], bbox);

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
function extractPopulationData(popData, country, id) {
  let matchingCountry = popData.find(
    (p) => p["Data Source"] === country.properties["ADMIN"]
  );
  if (matchingCountry != null) return matchingCountry["__parsed_extra"][id];

  // console.log(country.properties["ADMIN"]);
  return null;
}
function extractPopulationData2(popData, country) {
  let matchingCountry = popData.find(
    (p) => p["Data Source"] === country.properties["ADMIN"]
  );
  if (matchingCountry != null) return matchingCountry["__parsed_extra"];

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
      new THREE.MeshBasicMaterial({ color: 0xf9f4f5 })
    );
    geometry.computeBoundingBox();
    const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;

    textMesh.position.x = -textWidth / 2;
    textMesh.position.z = -400;
    textMesh.position.y = 100;

    scene.add(textMesh);
  });
}

let previousTextMesh = null; // Variable to store the previous textMesh

function CountryYearBackgroundText(year) {
  const loader = new FontLoader();

  loader.load("./fonts/VCR OSD Mono_Regular.json", function (font) {
    const geometry = new TextGeometry(year.toString(), {
      font: font,
      size: 30,
      height: 2,
    });
    const textMesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color: 0xf9f4f5 })
    );
    geometry.computeBoundingBox();
    const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;

    textMesh.position.x = -textWidth / 2;
    textMesh.position.z = -400;
    textMesh.position.y = 150;

    // Remove the old textMesh from the scene if it exists
    if (previousTextMesh) {
      scene.remove(previousTextMesh);
    }

    // Add the new textMesh to the scene
    scene.add(textMesh);

    // Update the previousTextMesh to the current one
    previousTextMesh = textMesh;
  });

  console.log(1);
}

let chartInstance = null;

async function DataColumn(country) {
  var data = [];
  for (let i = 1; i < 63; i++) {
    data.push({ year: 1960 + i, count: country[i] });
  }

  if (chartInstance) {
    // If chart instance exists, update data
    chartInstance.data.labels = data.map((row) => row.year);
    chartInstance.data.datasets[0].data = data.map((row) => row.count);
    chartInstance.update(); // Important: Update the chart
  } else {
    // If not, create a new instance
    chartInstance = new Chart(document.getElementById("acquisitions"), {
      type: "bar",
      data: {
        labels: data.map((row) => row.year),
        datasets: [
          {
            label: "Population by year",
            data: data.map((row) => row.count),
            backgroundColor: "#32746D",
          },
        ],
      },
      options: {
        onClick: function (evt, activeElements) {
          const dataIndex = activeElements[0].index;
          const clickedDataset =
            this.data.datasets[activeElements[0].datasetIndex];
          const label = this.data.labels[dataIndex];
          const value = clickedDataset.data[dataIndex];

          // Remove all children from the scene
          while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }
          console.log(dataIndex + "-------");
          populationNumber = extractPopulationData(
            popData,
            countries[currentIndex],
            dataIndex + 1
          );
          generateUnit(countries[currentIndex], new THREE.Vector3(0, 0, 0));
          // Call your function here
          CountryYearBackgroundText(label);
        },
      },
    });
  }
}
