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
          width="260"
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
        width="30%"
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

    handleDelete(index) {
      this.deleteIndex = index;
      this.deleteVisible = true;
    },

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
  flex: 0 0 330px;
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
