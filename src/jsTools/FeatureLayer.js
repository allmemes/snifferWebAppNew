/** Modified esri feature layer object.
 * contains add, remove, show, and hide functions.
 * For this object, show and hide are actually reusing the add and remove function from the normal leaflet tilelayer object
 */

export default class FeatureLayer
{
  /** constructor to create the feature layer, with default visible to be true. 
   *  the actual layerObject is a reference to the leaflet geojson object.
   *  the name attribute is obtained based on the url.
   *  type is a string that is used to distinguish between feature layer and tile layer.
   */
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