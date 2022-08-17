export default class TileLayer
{
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

  removeFromMap() {
    this.layerObject.remove();
    window.alert("Delete success");
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