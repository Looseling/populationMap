export default class Country {
  constructor(properties, polygons, bbox) {
    this.properties = properties;
    this.polygons = polygons;
    this.bbox = bbox;
    this.raindropStates = [];
    this.voxelRain = null;
    this.highestVoxels = [];
    this.velocities = [];
  }

  get voxels() {
    return this._voxels;
  }

  set voxels(value) {
    this._voxels = value;
  }
}
