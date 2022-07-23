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
            ref="upload"
            action="#"
            :auto-upload="false"
            :on-change="addFile"
            :on-remove="removeFile">
            <el-button slot="trigger" size="medium" type="primary">Select files</el-button>
            <el-button style="margin-left: 10px;" size="medium" type="success" @click="insertLayers">Add to current map</el-button>
          </el-upload>
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
      allDataUploaded: [] ,
      fileNameList: [],
     }
  },

  methods: {
    addFile(file, fileList) {
      this.fileNameList.push(file.name);
      let self = this;
      let reader = new FileReader();

      // if (this.containsDuplicates(this.fileNameList))
      // {
      //   this.$message({
      //     message: 'Warning, this is a duplicated GeoJson.',
      //     type: 'warning'
      //   });
      // }
      // else
      // {
      //   reader.readAsText(file.raw);
      //   reader.onload = function() {
      //     let data = JSON.parse(reader.result);
      //     self.allDataUploaded.push(data);
      //   }
      // }

      reader.readAsText(file.raw);
      reader.onload = function() {
        let data = JSON.parse(reader.result);
        self.allDataUploaded.push(data);
      }
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
    },

    removeFile(file, fileList) {
      var position = this.fileNameList.indexOf(file.name);
      this.fileNameList.splice(position, 1);
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
  width: 100vh;
  position: absolute;
  top: 100px;
  left: 35%;
  overflow: visible;
}

#upload-data-button {
  position: absolute;
  top: 20px;
  right: 30px;
  padding: 10px;
  border-radius: 10px;
}
</style>
