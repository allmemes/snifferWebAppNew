import L from 'leaflet'

export default class layerInfo {
  constructor(name, inputObject, DBtable) {
    // possible bug: geojson without a name!!!
    if (name)
    {
      this.name = name;
    }
    else
    {
      this.name = inputObject.options.url.split("/").at(-3);
    }

    this.visible = true;

    if (inputObject.coordinates)
    {
      var center = [];
      if (inputObject.coordinates[0][0][1])
      {
        center.push(inputObject.coordinates[0][0][1]);
        center.push(inputObject.coordinates[0][0][0]);
      }
      else
      {
        center.push(inputObject.coordinates[0][1]);
        center.push(inputObject.coordinates[0][0]);
      }
      this.center = center;
    }
    else
    {
      this.center = undefined;
    }

    if (inputObject.coordinates)
    {
      var geoJsonStruct = {
      "type": "FeatureCollection",
      "features": [{"type": "Feature", "properties": {}}]};
      geoJsonStruct.features[0]["geometry"] = inputObject;
      this.layerObject = L.geoJSON(geoJsonStruct);
    }
    else
    {
      this.layerObject = inputObject;
    }

    if (DBtable)
    {
      this.DBtable = DBtable;
    }
    else
    {
      this.DBtable = undefined;
    }
  }

  addToMap(map) {
    this.layerObject.addTo(map);
  }

  removeFromMap() {
    this.layerObject.remove();
    if (this.DBtable)
    {
      fetch("http://127.0.0.1:5000/delete/" + this.DBtable + "/" + this.name, { method: "delete" })
        .then(response => response.json())
        .then(data => {
          if (data["status"] === 200)
          {
            window.alert("Delete from database success");
          }
          else
          {
            window.alert("Delete from database fail");
          }
        })
    }
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