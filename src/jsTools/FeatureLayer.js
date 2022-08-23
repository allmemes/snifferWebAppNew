export default class FeatureLayer
{
  constructor(inputObject, type)
  {
    this.name = inputObject.options.url.split("/").at(-4);
    this.visible = true;
    this.layerObject = inputObject;
    this.type = type;
  }

  addToMap(map) {
    this.layerObject.addTo(map);
  }

  removeFromMap(parentComponent) {
    this.layerObject.remove();
    // window.alert("Delete success");
    parentComponent.$notify({
      title: 'Success',
      message: 'Delete success',
      type: 'success'
    });
  }

  show(map) {
    map.addLayer(this.layerObject);
  }

  hide(map)
  {
    // Side notes: it seems that setting opacity to control the visbility of esri feature layer
    // is not doable, everytime the map resizes, another same esri feature layer will reapear
    // on the map with default style. Thus, the old way of map.add/remove method is used here,
    // although it is less efficient than controling the opacity.
    map.removeLayer(this.layerObject);
    // this.layerObject.setStyle({opacity: 0, fillOpacity: 0});
  }
}