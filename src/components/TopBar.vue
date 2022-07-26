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
            :on-remove="removeFile">
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
             <el-table-column width="65">
              <template slot-scope="scope">
                <span>buffer:</span>
              </template>
            </el-table-column>
            <el-table-column width="60">
              <template slot-scope="scope">
                <input :value="scope.row" size="mini" style="height: 19.2px; width:25px"/>
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
import layerInfo from '../jsTools/mapInfo.js'

export default {
  name: 'TopBar',
  data () {
    return {
      // visible controls
      addVisible: false,
      uploadVisible: false,

      // clear during remove? ->fileList.
      bufferList: [],
      allDataUploaded: [] ,
      fileNameList: [],
     }
  },

  methods: {
    addFile(file, fileList) {
      this.fileNameList.push(file.name);
      let self = this;
      let reader = new FileReader();

      reader.readAsText(file.raw);
      reader.onload = function() {
        let data = JSON.parse(reader.result);
        self.allDataUploaded.push(data);
      }
      this.bufferList.push(this.$parent.defaultBuffer);
    },

    insertLayers() {
      for (var i = 0; i < this.allDataUploaded.length; i++)
      {
        var newData = new geoJsonInfo(this.fileNameList[i], true, 0, this.allDataUploaded[i]);
        this.$parent.totalLayerList.push(newData);
      }
      this.$parent.center = this.$parent.totalLayerList[0].center;
      this.addVisible = false;
      console.log(this.$parent.map);
    },

    containsDuplicates(array) {
      if (array.length !== new Set(array).size) {
        return true;
      }
      return false;
    },

    clearAddedData() {
      this.$refs.upload.clearFiles();
      this.allDataUploaded.length = 0;
      this.fileNameList.length = 0;
      this.bufferList.length = 0;
    },

    removeFile(file, fileList) {
      var position = this.fileNameList.indexOf(file.name);
      this.fileNameList.splice(position, 1);

      this.bufferList.splice(position, 1);
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