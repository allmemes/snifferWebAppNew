<template>
  <div id="TopBar">
    <!-- 1, add button and pop up window -->
    <el-button id="add-data-button" @click="addVisible = true">+ Add Data To Map</el-button>
      <!-- pop up -->
      <el-dialog :visible.sync="addVisible"
                  :modal-append-to-body="false"
                class="dialog" title="Upload data from local computer"
                @close="clearAddedData"
                :close-on-click-modal="false">
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
    <el-button id="upload-data-button" @click="append">Append Current View and Upload</el-button>
    <!-- pop up -->
    <!-- <el-dialog :visible.sync="uploadVisible"
                :modal-append-to-body="false"
              class="dialog" title="Select layers and append"
              :close-on-click-modal="false">
              This is for uploading.
    </el-dialog> -->
  </div>
</template>

<script>
// import mapInfo from '../jsTools/mapInfo.js'
import GeoJsonLayer from '../jsTools/GeoJsonLayer.js';

export default {
  name: 'TopBar',
  data () {
    return {
      // visible controls
      addVisible: false,

      // uploaded files.
      bufferList: [],
      fileNames: new Set(),
     }
  },

  methods: {
    updateBuffer(scope) {
      this.bufferList[scope.$index] = scope.row;
    },

    addFile(file, fileList) {
      // clean file name nad type check
      debugger;
      var self = this;
      let fileReader = new FileReader();
      fileReader.readAsText(file.raw);
      fileReader.onload = function() {
        var type = fileReader.result[0];
        if ((type == "I" && self.$parent.inspectionType == "SnifferDrone")
                ||
            (type == "T" && self.$parent.inspectionType == "Inficon"))
            {
              self.$notify.error({
                title: 'Error',
                message: "Incorrect csv type for the current inspection task"
              });
              fileList.splice(fileList.indexOf(file), 1);
            }
        else
        {
          var inputCsvName = file.name.split(".csv")[0];
          if (self.$parent.uploadedNames.has(inputCsvName))
          {
            self.$message({
              message: 'File already added.',
              type: 'warning'
            });
            fileList.splice(fileList.indexOf(file), 1);
          }
          else
          {
            if (self.fileNames.has(file.name))
            {
              self.$message({
                message: 'Dupicated files.',
                type: 'warning'
              });
              fileList.splice(fileList.indexOf(file), 1);
            }
            else
            {
              self.fileNames.add(file.name);
              self.bufferList.push(self.$parent.defaultBuffer);
            }
          }
        }
      }
    },

    insertLayers() {
      // ui control
      this.$parent.loading = true;
      var self = this;

      // data transfer variables
      var emptyFiles = "";
      var form = new FormData();

      // load data onto form.
      var bufferText = this.bufferList.toString();
      form.append("bufferText", bufferText + "," + this.$parent.inspectionType[0]);

      var uploadedFiles = this.$refs.upload.uploadFiles;
      for (let i = 0; i < uploadedFiles.length; i++)
      {
        var csvName = uploadedFiles[i].name.split(".csv")[0];
        form.append(csvName, uploadedFiles[i].raw);
        this.$parent.uploadedNames.add(csvName);
      }

      // send form to back end.
      fetch('http://127.0.0.1:5000/buffer', {
        method: 'POST',
        body: form
      }).then(response => response.json()).then(data => {
        // receive data, add to map, insert into table list
        for (var key in data)
        {
          var tableName = key;
          if (Object.keys(data[key]).length !== 0)
          {
            for (var key2 in data[key])
            {
              var name = key2;
              if (data[key][key2])
              {
                var dataObject = JSON.parse(data[key][key2].replaceAll("'", '"'));
                var newGeoJson = new GeoJsonLayer(name, dataObject, tableName);
                newGeoJson.addToMap(self.$parent.map);
                self.$parent.myLayers.push(newGeoJson);
              }
              else
              {
                emptyFiles = emptyFiles + name.split("-")[0] + ", ";
              }
            }
          }
        }
        if (emptyFiles.length > 0)
        {
          var warn = emptyFiles.slice(0, -2);
          self.$notify({
            title: 'Warning',
            message: "No peaks created for " + warn,
            type: 'warning'
          });
        }
        self.$parent.loading = false;
        self.addVisible = false;
      });
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
    },

    append()
    {
      console.log("this is for appending");

    },

    // async readInput(file) {
    //   let result = await new Promise((resolve) => {
    //       let fileReader = new FileReader();
    //       fileReader.onload = (e) => resolve(fileReader.result);
    //       fileReader.readAsText(file.raw);
    //   })
    //   return result[0];
    // }
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
  right: 290px;
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