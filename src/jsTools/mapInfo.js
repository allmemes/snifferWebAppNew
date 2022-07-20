export default class geoJsonInfo {
  constructor(name, visible, bufferDis, geometry) {
    this.name = name;
    this.visible = visible;

    var center = [];
    center.push(geometry["coordinates"][0][0][1]);
    center.push(geometry["coordinates"][0][0][0]);
    this.center = center;

    this.bufferDis = bufferDis;
    var geoJsonStruct = {
      "type": "FeatureCollection",
      "features": [{"type": "Feature", "properties": {}}]};
      geoJsonStruct["features"][0]["geometry"] = geometry;
    this.geoJson = geoJsonStruct;
  }
}