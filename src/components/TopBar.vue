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
    <el-button id="upload-data-button" @click="append">Upload current view to AGOL</el-button>
    <!-- appending result pop up -->
    <el-dialog :visible.sync="resultVisible"
              :modal-append-to-body="false"
              class="resultDialog"
              :title="title"
              :close-on-click-modal="false"
              @close="resultVisible = false">
              <!-- result collapse items -->
              <div id="collapseHolder">
                <div id="collapseBox">
                  <el-collapse v-model="collapse1">
                    <el-collapse-item title="Buffer data appending result: " name="2">
                      <div class="results" v-for="i in bufferSuccess">Success: <span>{{i}}</span></div>
                      <div class="results" v-for="j in bufferFail">Error: <span>{{j}}</span></div>
                    </el-collapse-item>
                    <el-collapse-item title="Points/Path data appending result: " name="1">
                      <div class="results" v-for="k in points">Finished: <span>{{k}}</span></div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
                <div id="collapseBox">
                  <el-collapse v-model="collapse2" id="innerCollapseBox">
                    <el-collapse-item title="Peaks data appending result: " name="1">
                      <div class="results" v-for="l in peakSuccess">Success: <span>{{l}}</span></div>
                      <div class="results" v-for="m in peakFail">Error: <span>{{m}}</span></div>
                    </el-collapse-item>
                    <el-collapse-item title="Layers with invalid appending format: " name="2">
                      <div class="results" v-for="n in invalidJson">Invalid: <span>{{n}}</span></div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
              <span slot="footer" class="dialog-footer">
                <el-button type="primary" @click="resultVisible = false">Confirm</el-button>
              </span>
    </el-dialog>
  </div>
</template>

<script>
import GeoJsonLayer from '../jsTools/GeoJsonLayer.js';

export default {
  name: 'TopBar',
  data () {
    return {
      // visible controls
      addVisible: false,
      resultVisible: false,
      collapse1: ['1', '2'],
      collapse2: ['1', '2'],
      title: undefined,

      // result list for appending.
      bufferSuccess: undefined,
      bufferFail: undefined,
      peakSuccess: undefined,
      peakFail: undefined,
      invalidJson: undefined,
      points: undefined,

      // uploaded files.
      bufferList: [],
      fileNames: new Set(),
      parentFileRecorder: this.$parent.fileRecorder,
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
          var inputCsvName = file.name;
          if (inputCsvName in self.parentFileRecorder)
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
      form.append("task", this.$parent.inspectionType[0]);
      form.append("bufferText", bufferText);

      var uploadedFiles = this.$refs.upload.uploadFiles;
      for (let i = 0; i < uploadedFiles.length; i++)
      {
        var csvName = uploadedFiles[i].name;
        form.append(csvName, uploadedFiles[i].raw);
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
              var csvKey = key2.split("-")[0];
              if (data[key][key2])
              {
                var dataObject = JSON.parse(data[key][key2].replaceAll("'", '"'));
                var newGeoJson = new GeoJsonLayer(key2, dataObject, tableName);
                newGeoJson.addToMap(self.$parent.map);
                self.$parent.myLayers.push(newGeoJson);
                if (csvKey in self.parentFileRecorder)
                {
                  self.parentFileRecorder[csvKey] += 1;
                }
                else
                {
                  self.parentFileRecorder[csvKey] = 1;
                }
              }
              else
              {
                emptyFiles = emptyFiles + csvKey + ", ";
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
            type: 'warning',
            duration: 0
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
      debugger;
      // ui control.
      this.$parent.loading = true;
      var self = this;

      // prepare appending task form.
      var form = new FormData();

      // first check what layers have not been appened.
      var allCurrentLayers = this.$parent.myLayers;
      var sourceLayerList = [];
      for (let i = 0; i < allCurrentLayers.length; i++)
      {
        if (allCurrentLayers[i].appendable == true)
        {
          sourceLayerList.push(allCurrentLayers[i].name);
        }
      }
      if (sourceLayerList.length == 0)
      {
        this.$parent.loading = false;
        this.$notify({
          title: 'Warning',
          message: 'You do not have any appendable layers',
          type: 'warning'
        });
      }
      else
      {
        form.append("sourceLayers", sourceLayerList.toString());
        form.append("task", this.$parent.inspectionType[0]);
        form.append("userName", this.$parent.username);
        form.append("passWord", this.$parent.password);
        var targetUrls = this.$parent.fileDict;
        if (this.$parent.inspectionType == "SnifferDrone")
        {
          form.append("bufferUrl", targetUrls["dronebuffer"]);
          form.append("peaksUrl", targetUrls["peaks"]);
          form.append("pointsUrl", targetUrls["dronepoints"]);
        }
        else
        {
          form.append("inficonPoints", targetUrls["manualpoints"]);
          form.append("inficonBuffer", targetUrls["manualbuffer"]);
        }

        // set request to back end.
        fetch('http://127.0.0.1:5000/append', {
          method: 'POST',
          body: form
        }).then(response => response.json()).then(data => {
          if (data)
          {
            debugger;
            self.$parent.loading = false;
            self.resultVisible = true;
            self.title = data["task"] + " Uploading Results";
            self.bufferSuccess = data["bufferSuccess"];
            // self.bufferSuccess.push("some_test_failing.csv");
            self.bufferFail = data["bufferFail"];
            // self.bufferFail.push("some_test_failing.csv");
            self.peakSuccess = data["peaksSuccess"];
            self.peakFail = data["peaksFail"];
            self.invalidJson = data["invalidJson"];
            self.points = data["pointsAppended"];
          }
        })
      }
    },
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
  right: 45px;
  padding: 10px;
  border-radius: 10px;
}

#bufferList {
  position: absolute;
  width: 28%;
  right: 10px;
  top: 86px;
}

.resultDialog {
  width: 200vh;
  position: absolute;
  top: 0px;
  left: 10%;
  overflow: visible;
}

#collapseHolder {
  width: 100%;
  display: flex;
}

#collapseBox {
  width: 50%;
  margin-left: 3px;
  margin-right: 3px;
  padding-left: 3px;
  padding-right: 3px;
  border-color: lightgrey;
  border-radius: 8px;
  border-style: solid;
  border-width: 3px;
}

.results {
  color: dimgray;
  font-size: 13px;
}
</style>