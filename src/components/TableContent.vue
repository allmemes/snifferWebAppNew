<template>
  <div id="Table">
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
  </div>
</template>

<script>
export default {
  name: 'TableContent',
  data () {
    return {
      tableData: this.$parent.myLayers,
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
      var row = this.tableData[index];
      row.removeFromMap();
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
    },
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
</style>
