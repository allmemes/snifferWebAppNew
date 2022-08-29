import L from 'leaflet'

/** Modified esri geojson layer object.
 * contains add, remove, show, and hide functions.
 * show and hide functions are achieved by modifying the opacity.
 */

export default class GeoJsonLayer
{
  /** constructor to create the geojson layer, with default visible to be true, appendable to be true
   *  center attribute is obtained by finding the first point's coordinate from the geojson attribute.
   *  the actual layerObject is a reference to the leaflet geojson object.
   */
  constructor(name, inputObject, DBtable)
  {
    this.name = name;
    this.appendable = true;
    this.visible = true;

    var center = [];
    if (inputObject.type[0] === "M")
    {
      center.push(inputObject.coordinates[0][0][0][1]);
      center.push(inputObject.coordinates[0][0][0][0]);
    }
    else if (inputObject.type[0] === "P")
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
    // create the general structure of a geojson.
    var geoJsonStruct = {
      "type": "FeatureCollection",
      "features": [{"type": "Feature", "properties": {}}]};
    geoJsonStruct.features[0]["geometry"] = inputObject;
    this.layerObject = L.geoJSON(geoJsonStruct);

    this.DBtable = DBtable;
  }

  addToMap(map) {
    this.layerObject.addTo(map);
  }

  removeFromMap(parentComponent) {
    /** delete function will first calling leaflet remove function to remove this layer from the map.
     * then it will call the delete api to the back end, reporting success status accoordingly.
     */
    this.layerObject.remove();
    fetch("http://127.0.0.1:5000/delete/" + this.DBtable + "/" + this.name, { method: "delete" })
      .then(response => response.json())
      .then(data => {
        if (data["status"] === 200)
        {
          parentComponent.$notify({
            title: 'Success',
            message: 'Delete from database success',
            type: 'success'
          });
        }
        else
        {
          parentComponent.$notify({
            title: 'Error',
            message: "Delete from database fail"
          });
        }
      })
  }

  show(map) {
    this.layerObject.setStyle({opacity: 1, fillOpacity: 0.5});
  }

  hide(map)
  {
    this.layerObject.setStyle({opacity: 0, fillOpacity: 0});
  }
}