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
          <!-- buffer table, which allows the user to input buffer distance, whenever a csv is uploaded -->
          <el-table
            v-if="bufferList.length !== 0"
            empty-text="..."
            :data="bufferList"
            id="bufferList"
            :cell-style="{padding: '2px', height: '20px'}">
             <el-table-column width="95">
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
                    <el-collapse-item title="Points/Path data appending result: " name="1">
                      <div class="results" v-for="k in points">Finished: <span>{{k}}</span></div>
                    </el-collapse-item>
                    <el-collapse-item title="Peaks data appending result: " name="2">
                      <div class="results" v-for="l in peakSuccess">Success: <span>{{l}}</span></div>
                      <div class="results" v-for="m in peakFail">Error: <span>{{m}}</span></div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
                <div id="collapseBox">
                  <el-collapse v-model="collapse2">
                    <el-collapse-item title="Buffer data appending result: " name="1">
                      <div class="results" v-for="i in bufferSuccess">Success: <span>{{i}}</span></div>
                      <div class="results" v-for="j in bufferFail">Error: <span>{{j}}</span></div>
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
      // binded list variable for those two collapses that indicate which collapses are "open" in default.
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
      // set used for checking duplicated uploading files.
      fileNames: new Set(),
      parentFileRecorder: this.$parent.fileRecorder,
     }
  },

  methods: {
    /**
    * This function is to update the buffer distance at the corresponding index inside the buffer list
    * The buffer list will be turned into string and passed to the back end later. 
    * @param scope reference to the row inside the buffer table, scope.$index will give the index of the buffer
    * distance that the user is modifying. 
    * @return null
    */
    updateBuffer(scope) {
      this.bufferList[scope.$index] = scope.row;
    },


    /**
    * This function is to listen to the csv uploading event, ie, whenever the user is uploading a csv that will be sent to 
    * the back end for processing. 
    * 1, it will first check if the first character inside the csv data itself is different from the current inspection type,
    * if different, then abort this uploading and report the error.
    * 2, if the csv type is correponding to the current insepction type, it will keep checking if the csv name is present in
    * the csv name tracker keys. If exists, it means this specific csv has already gone through the process of being sent to
    * the back end and rerender at the front end. This layer is probably displaying itself in the map now, thus reproting
    * error and abort the uploading.
    * 3, if the csv name is not inside the csv name tracker, keep checking if this csv name has already been uploaded into the ui.
    * If already exists, abort the uploading and report the error. This process is different from above in that it is checking
    * whether you add the same file through file explorer.
    * 4, if nothing goes wrong, add the csv file to the uploading list and add the csv name to the duplicated file name set.
    * @param file the file that is being uploaded, contains names attribute, .raw will give its data.
    * @param fileList the entire list of files being uploaded.
    * @return null
    */
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


    /**
    * This function is called when user click on the add to current map button.
    * 1, it will first start up the loading screen on the map, and then it prepares the formData that
    * will be used to communicate with the back end.
    * 2, information about inspection type, and buffer list will be added to the form. 
    * 3, loop through the uploaded list, add their csv name as key, file themselves as the value. 
    * form data strcuture: 
    * {
        "bufferText": "bufferDistance1, bufferDistance2.....",
        "task": "S" for sniffer drone task, or "I" for inficon task,
        "csv name1": csv file1,
        "csv name2": csv file2.... 
        (The number of csv files are the same as the number of buffer distance in the bufferText)
       }
      4, after receiving the response from the back end, it will load the data based on the json structure: 
          {
            tableName1: {
                dataName1: geojson1,
                dataName2: geojson2 .... 
                },
            tableName2: {
                dataName3: geojson3....
            }
          }. When loading the data, it will create the geojson layer and push the layers into the layer list
          that is used to be shown in the table content to the left. Also, their add to map function will be
          called to show them on the map.
      5, later, since now whatever layers that are showing up now suggest that they have been officially added
      to the map, and their csv name will be added to the csv name tracker, and their values will be added up
      to 3 or 2 based on whether peaks are present or not. 
      6, when peaks are not present (this can be told by checking if there is a case where the layer name (key)
      is passed back, but with no geojson information as value). If this is the case, set up a string variable
      to record all the csv names who has no peaks data.
      7, if some csv has no peaks, show their information, remove the loading screen and reset the visibility
      controls.
    * @param null
    * @return null
    */
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
            title: 'Information',
            message: "No peaks created for " + warn,
            type: 'success',
            duration: 0
          });
        }
        self.$parent.loading = false;
        self.addVisible = false;
      });
    },


    /**
    * This function is clear all uploaded files, filenames, and buffer list to empty whenever user click on the
    * x mark to close the appending dialog.
    * @param null
    * @return null
    */
    clearAddedData() {
      this.$refs.upload.clearFiles();
      this.fileNames.clear();
      this.bufferList.length = 0;
    },


    /**
    * This function is called whenever user remove one single file from the uploading file list.
    * it will remove that file based on the index, remove the bufferdistance at the corresponding
    * index inside the buffer list, and remove the name from the name set used for checking the 
    * duplicated files.
    * @param file the file that is being uploaded, contains names attribute, .raw will give its data.
    * @param fileList the entire list of files being uploaded.
    * @return null
    */
    removeFile(file, fileList) {
      var position = fileList.indexOf(file);
      this.bufferList.splice(position, 1);
      this.fileNames.delete(file.name);
    },


    /**
    * This function is called when user click on the upload to agol button.
    * 1, it will first restart the loading screen, prepare the form data similar to the buffer function.
    * 2, then it will loop through current APPENDABLE layers, this mainly refers to the geojson layers, 
    * since only they have the appendable attributes. 
    * 3, if there is no appendable layers, report the error.
    * 4, if there is, add username, password, inspection type, and other basic information into the form
    * 5, based on the inspection type, add corresponding target layer urls into the form.
    * 6, send form through fetch api to the back end. form structure:
    *   form structure for the sniffer drone task
        {
            "userName": xxxxx,
            "passWord": xxxxx,
            "sourceLayers": "csvlayer1, csvLayer2, csvLayer3...." (follow the format of csvname + '-type'),
            "task": "S",
            "bufferUrl": xxxxxx,
            "peaksUrl": xxxxx,
            "pointsUrl": xxxx
        }
        form structure for inficon task:
        {
            "userName": xxxxx,
            "passWord": xxxxx,
            "sourceLayers": "csvlayer1, csvLayer2, csvLayer3...." (follow the format of csvname + '-type'),
            "task": "I",
            "inficonPoints": xxxxxx,
            "inficonBuffer": xxxxx
        }
      7, when response is passed back, receive the response and render the result through v-for syntax.
      response structure:
      {
        "task": "SnifferDrone" or "Inficon",
        six lists that indicate the appending status.
      }
    * @param null
    * @return null
    */
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
            // self.bufferSuccess.push("92003117_20220718_1307_IRW0027.csv-buffer");
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
  width: 160vh;
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
  width: 220vh;
  position: absolute;
  top: 0px;
  left: 5%;
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