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
          width="230"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column
          width="80">
          <template slot-scope="scope">
            <el-checkbox v-model="scope.row.visible"></el-checkbox>
            <el-button
            size="mini"
            type="danger"
            style="margin-left: 5px;"
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
      tableData: this.$parent.totalLayerList,
     }
  },

  methods: {
    recenter(row, column, cell, event) {
      this.$parent.center = row.center;
    },

    handleDelete(index) {
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
