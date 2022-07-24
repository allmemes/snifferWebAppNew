import L from 'leaflet'

export default class layerInfo {
  constructor(inputObject) {
    if (inputObject.options)
    {
      this.name = inputObject.options.url.split("/").at(-3);
      // tilelayer object. {options: {}, functions: {}}
    }
    else
    {
      this.name = inputObject.name;
      // geoJson: {name: xxx, geometry: {"type": "Polygon", "coordinates": []}}
    }

    this.visible = true;

    if (inputObject.geometry)
    {
      var center = [];
      if (inputObject.geometry.coordinates[0][0][1])
      {
        center.push(inputObject.geometry.coordinates[0][0][1]);
        center.push(inputObject.geometry.coordinates[0][0][0]);
      }
      else
      {
        center.push(inputObject.geometry.coordinates[0][1]);
        center.push(inputObject.geometry.coordinates[0][0]);
      }
      this.center = center;
    }
    else
    {
      this.center = undefined;
    }

    if (inputObject.geometry)
    {
      var geoJsonStruct = {
      "type": "FeatureCollection",
      "features": [{"type": "Feature", "properties": {}}]};
      geoJsonStruct.features[0]["geometry"] = inputObject.geometry;
      this.layerObject = L.geoJSON(geoJsonStruct);
    }
    else
    {
      this.layerObject = inputObject;
    }
  }

  addToMap(map) {
    this.layerObject.addTo(map);
  }

  removeFromMap() {
    this.layerObject.remove();
    console.log("Will need to be deleted from database");
  }

  show() {
    if (this.layerObject.options.url)
    {
      this.layerObject.setOpacity(1);
    }
    else
    {
      this.layerObject.setStyle({opacity: 1, fillOpacity: 0.5});
    }
  }

  hide()
  {
    if (this.layerObject.options.url)
    {
      this.layerObject.setOpacity(0);
    }
    else
    {
      this.layerObject.setStyle({opacity: 0, fillOpacity: 0});
    }
  }
}