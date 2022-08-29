/** Modified esri tileLayer object.
 * contains add, remove, show, and hide functions.
 * show and hide functions are achieved by modifying the opacity.
 */

export default class TileLayer
{
  /** constructor to create the geojson layer, with default visible to be true.
   *  type is a string that is used to distinguish between feature layer and tile layer.
   *  the actual layerObject is a reference to the leaflet geojson object.
   *  name is obtained by modifying the url.
   */
  constructor(inputObject, type)
  {
    this.name = inputObject.options.url.split("/").at(-3);
    this.visible = true;
    this.layerObject = inputObject;
    this.type = type;
  }

  addToMap(map) {
    this.layerObject.addTo(map);
  }

  removeFromMap(parentComponent) {
    this.layerObject.remove();
    parentComponent.$notify({
      title: 'Success',
      message: 'Delete success',
      type: 'success'
    });
  }

  show(map) {
    if (this.type == "asbuilt")
    {
      this.layerObject.setOpacity(0.5);
    }
    else
    {
      this.layerObject.setOpacity(1);
    }
  }

  hide(map)
  {
    this.layerObject.setOpacity(0);
  }
}