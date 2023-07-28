export function calcPosFromLatLonRad(lat, lon, radius) {
  var phi = (90 - lat) * (Math.PI / 180);
  var theta = (lon + 180) * (Math.PI / 180);

  x = -(radius * Math.sin(phi) * Math.cos(theta));
  z = radius * Math.sin(phi) * Math.sin(theta);
  y = radius * Math.cos(phi);

  return [x, y, z];
}

export function getMapData() {
  const mapData = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  return mapData;
}

export function getAsciiMap() {
  const fs = require("fs");

  // Read the ASCII file
  const asciiData = fs.readFileSync(
    "C:/Users/User/Desktop/rasters/ASCIIPLSWORK.asc",
    "utf-8"
  );

  // Split the file into lines
  let lines = asciiData.split("\n");

  // Remove the header lines (usually the first 6 lines in an ASCII grid file)
  lines = lines.slice(6);

  // Initialize the 2D array
  let gridData = [];

  // Iterate over each line
  for (let line of lines) {
    // Split the line into its components
    let values = line.split(" ");

    // Convert the values from strings to numbers
    values = values.map(Number);

    // Add the row of values to the grid data
    gridData.push(values);
  }

  // Now gridData is a 2D array of your ASCII grid data
  console.log(gridData);
}
