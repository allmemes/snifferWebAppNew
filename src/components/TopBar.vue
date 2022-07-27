<template>
  <div id="TopBar">
    <!-- 1, add button and pop up window -->
    <el-button id="add-data-button" @click="addVisible = true">+ Add Data To Map</el-button>
      <!-- pop up -->
      <el-dialog :visible.sync="addVisible"
                  :modal-append-to-body="false"
                class="dialog" title="Upload data from local computer"
                @close="clearAddedData">
          <!-- uploader -->
          <el-upload
            class="upload"
            style="width:300px"
            ref="upload"
            action="#"
            :auto-upload="false"
            :on-change="addFile"
            :before-remove="removeFile">
            <el-button slot="trigger" size="medium" type="primary">Select files</el-button>
            <el-button style="margin-left: 10px;" size="medium" type="success" @click="insertLayers">Add to current map</el-button>
          </el-upload>
          <!-- buffer table -->
          <el-table
            v-if="bufferList.length !== 0"
            empty-text="..."
            :data="bufferList"
            id="bufferList"
            :cell-style="{padding: '2px', height: '20px'}">
             <el-table-column width="85">
              <template slot-scope="scope">
                <span>buffer(m):</span>
              </template>
            </el-table-column>
            <el-table-column width="60">
              <template slot-scope="scope">
                <input v-model="scope.row" style="height: 19.2px; width:25px" @change="updateBuffer(scope)"/>
              </template>
            </el-table-column>
          </el-table>
      </el-dialog>

    <!-- 2, upload button and pop up window -->
    <el-button id="upload-data-button" @click="uploadVisible = true">Upload Data To Field Map</el-button>
    <!-- pop up -->
    <el-dialog :visible.sync="uploadVisible"
                :modal-append-to-body="false"
              class="dialog" title="Merge current data and save">This is for uploading.

    </el-dialog>
  </div>
</template>

<script>

export default {
  name: 'TopBar',
  data () {
    return {
      // visible controls
      addVisible: false,
      uploadVisible: false,

      // uploaded files.
      bufferList: [],
      fileNames: new Set(),
     }
  },

  methods: {
    updateBuffer(scope) {
      this.bufferList[scope.$index] = parseInt(scope.row);
    },

    addFile(file, fileList) {
      if (this.fileNames.has(file.name))
      {
        this.$message({
          message: 'Dupicated files.',
          type: 'warning'
        });
        fileList.splice(fileList.indexOf(file), 1);
      }
      else
      {
        this.fileNames.add(file.name);
        this.bufferList.push(this.$parent.defaultBuffer);
      }
    },

    insertLayers() {
      console.log(this.$refs.upload.uploadFiles);
      console.log(this.bufferList);

      // send name, bufferdistance, and data to backend.
      // this.fileNameList.push(file.name);
      // let self = this;
      // let reader = new FileReader();

      // reader.readAsText(file.raw);
      // reader.onload = function() {
      //   let data = JSON.parse(reader.result);
      //   self.allDataUploaded.push(data);
      // }
    },

    containsDuplicates(array) {
      if (array.length !== new Set(array).size) {
        return true;
      }
      return false;
    },

    clearAddedData() {
      this.$refs.upload.clearFiles();
      this.fileNames.clear();
      this.bufferList.length = 0;
    },

    removeFile(file, fileList) {
      var position = fileList.indexOf(file);
      this.bufferList.splice(position, 1);
      this.fileNames.delete(file.name);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#TopBar{
  position: absolute;
  height: 1vh;
  width: 100%;
  z-index: 500;
}

#merge-data-button {
  position: absolute;
  top: 20px;
  right: 410px;
  padding: 10px;
  border-radius: 10px;
}

#add-data-button  {
  position: absolute;
  top: 20px;
  right: 240px;
  padding: 10px;
  border-radius: 10px;
}

.dialog {
  width: 140vh;
  position: absolute;
  top: 100px;
  left: 20%;
  overflow: visible;
}

#upload-data-button {
  position: absolute;
  top: 20px;
  right: 30px;
  padding: 10px;
  border-radius: 10px;
}

#bufferList {
  position: absolute;
  width: 28%;
  right: 10px;
  top: 86px;
}
</style>