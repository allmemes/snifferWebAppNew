<template>
  <div id="Table">
    <!-- table div -->
      <el-table
        :data="tableData"
        style="width: 100%"
        empty-text="Empty"
        @row-dblclick="recenter">
        <el-table-column
          label="Content"
          width="300"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          width="75">
          <template slot-scope="scope">
            <el-checkbox v-model="scope.row.visible" @change="showLayer(scope.row)"></el-checkbox>
            <el-button
            size="mini"
            type="danger"
            style="margin-left: 5px; width: 30px"
            @click="handleDelete(scope.$index)">X</el-button>
          </template>
        </el-table-column>
      </el-table>
      <!-- delete confirm dialog -->
      <el-dialog
        id="deleteConfirmBox"
        title="Warning"
        :visible="deleteVisible"
        width="35%"
        :close-on-click-modal="false"
        :modal-append-to-body="false"
        :show-close="false"
        center>
        <span>Are you sure you want to delete this layer?</span>
        <span slot="footer" class="dialog-footer">
          <el-button @click="deleteVisible = false">Cancel</el-button>
          <el-button type="primary" @click="deleteLayer()">Confirm</el-button>
        </span>
      </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'TableContent',
  data () {
    return {
      tableData: this.$parent.myLayers,
      deleteVisible: false,
      deleteIndex: undefined,
     }
  },

  methods: {
    /**
    * This function is to make each layer to be focused onto by double click, if there is no geojson attribute for the layer
    * which means they are mostly tile layer and feature layer, then they will be bring to the front.
    * @param row each row inside the tableData is a reference to the layer itself, which is geojson layer, tile layer, or feature layer.
    * @return null
    */
    recenter(row) {
      if (row.center)
      {
        this.$parent.map.setView(row.center);
      }
      if (!row.center)
      {
        row.layerObject.bringToFront();
      }
    },


    /**
    * This function is called on every layer to show or hide themselves, which is by calling the show and hide function
    * for each layer object. 
    * @param row each row inside the tableData is a reference to the layer itself, which is geojson layer, tile layer, or feature layer.
    * @return null
    */
    showLayer(row) {
      if (row.visible)
      {
          row.show(this.$parent.map);
      }
      else
      {
          row.hide(this.$parent.map);
      }
    },


    /**
    * This function is to make the delete confirmation dialog appear, whenever a layer is about to be deleted.
    * @param index the int index that indicates among all the layers, the layer at which index is being deleted.
    * @return null
    */
    handleDelete(index) {
      this.deleteIndex = index;
      this.deleteVisible = true;
    },

  
    /**
    * This function is called on every layer to delete themselves from the map. If the layer being delete is geojson layer, then
    * it will also communicate with the back end to delete their geojson data from the database. For other layers, they are just
    * being removed from the map.
    * This is the function following the function above, where the deleteIndex is palying the role of indicating which layer to 
    * deleted.
    * Also, when deleting the layers, the csv name tracker will be used again, it will check whether all three or two layers
    * created from one csv has been deleted all or not. If the cout is reduced to 0, then delete the key value pairs.
    * @param null
    * @return null
    */
    deleteLayer()
    {
      this.deleteVisible = false;
      var index = this.deleteIndex;
      var row = this.tableData[index];
      row.removeFromMap(this);
      // check csv prefix recorder, remove if all two/three created layers are all removed.
      var parentFileRecorder = this.$parent.fileRecorder;
      var rowName = row.name.split("-")[0];
      if (rowName in parentFileRecorder)
      {
        parentFileRecorder[rowName] -= 1;
        if (parentFileRecorder[rowName] == 0)
        {
          delete parentFileRecorder[rowName];
        }
      }
      this.tableData.splice(index, 1);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#Table {
  flex: 0 0 370px;
  z-index: 1000;
  overflow: auto;
}

#bufferBox {
  margin-left: 40px;
  margin-right: 5px;
}

#deleteConfirmBox {
  width: 150vh;
  position: absolute;
  top: 100px;
  left: 80px;
}
</style>
