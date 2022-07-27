<template>
  <div id="Table">
    <template>
      <el-table
        :data="tableData"
        style="width: 100%"
        empty-text="Empty"
        @row-dblclick="recenter">
        <el-table-column
          label="Content"
          width="240"
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
    </template>

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
    },

    showLayer(row) {
      // var self = this;
      if (row.visible)
      {
        row.show();
        // row.removeFromMap();
        // row.addToMap(self.$parent.map);
      }
      else
      {
        row.hide();
      }
    },

    handleDelete(index) {
      this.tableData[index].removeFromMap();
      this.tableData.splice(index, 1);
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#Table {
  flex: 0 0 20%;
  z-index: 1000;
}

#bufferBox {
  margin-left: 40px;
  margin-right: 5px;
}
</style>
