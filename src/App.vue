<template>
  <div id="app">
    <div id="loginBox">
    <!-- initial pop up for authentication -->
    <el-dialog class="initDialog" title="Welcome to Sniffer webapp" width="25%"
                :show-close="false"
                :visible.sync="stillInLogin"
                :modal-append-to-body="false"
              :close-on-click-modal="false">
      <!-- input, password and metaData -->
      <div class="infoBox">
        <span class="preLabel">Username: </span>
        <el-input placeholder="input username" v-model="username" style="width: 200px" size="small"></el-input>
      </div>
      <div class="infoBox">
        <span class="preLabel">Password: </span>
        <el-input placeholder="input password" v-model="password" show-password style="width: 200px" size="small"></el-input>
      </div>
      <!-- project file uploading div -->
      <div class="infoBox">
        <el-upload
            class="MDupload"
            ref="MDupload"
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-exceed="exceedWarning"
            :on-change="readMetaData"
            :on-remove="clearMetaData">
            <el-button slot="trigger" size="small" type="primary">Select metadata</el-button>
          </el-upload>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="connectToAGOL">Connect to Arcgis Online</el-button>
      </span>
    </el-dialog>
    </div>

    <!-- content view on the left -->
    <TableContent/>
    <!-- map itself -->
    <div id='MapView' v-loading="loading"></div>
    <!-- top button bar -->
    <TopBar/>
  </div>
</template>

<script>
import TableContent from './components/TableContent.vue'
import TopBar from './components/TopBar.vue'
import L from 'leaflet'
import GeoJsonLayer from './jsTools/GeoJsonLayer.js';
import TileLayer from './jsTools/TileLayer.js';
import FeatureLayer from './jsTools/FeatureLayer.js';

const esri = require("esri-leaflet");
const tokenURL = "https://www.arcgis.com/sharing/rest/generateToken"

export default {
  name: 'App',
  components: {
    TableContent,
    TopBar,
  },

  data () {
    return {
      // login info
      stillInLogin: true,
      username: "",
      password: "",
      // database info and default buffer distance.
      localDB: "",
      defaultBuffer: undefined,
      // Project file info
      inspectionType: undefined,
      fileDict: undefined,
      // list with references to the layers.
      myLayers: [],

      // initial map info
      loading: false,
      map: undefined,
      center: undefined,
      zoom: 15,
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',

      // this object is to track how each input csv is splited into peaks, buffer, and path and reloaded in the front end. 
      // when a csv is uploaded and sent to back end to create peaks, buffer, and path, this object will include a key value
      // pair, where key is the csv name, and value is 3 (if all peaks, buffer, and path are created) or 2 (if only buffer 
      // and path are created). Whenever a layer derived from a csv is deleted, the value will -1. If the value becomes 0, 
      // it means all related layer is deleted. Then we remove the key from the object, meaning the same csv can be added again.
      fileRecorder: {},
    }
  },

  methods: {
    /**
    * This function is called when user click on the connect to agol button.
    * 1, it will first do the authorization.
    * 2, after authorization, it will use the token generated to create esri tile layer and feature layer as background for
    * an inspection, if their urls are provided in the project file.
    * 3, then those created esri layers will be used to create modified object called TileLayer or FeatureLayer, those objects
    * are used, since their visibility, name, and other attributes can be extracted into similar objects, which are easier to 
    * be managed.
    * 4, after this, we go deeper to the connect to database function.
    * @param event
    * @return null
    */
    connectToAGOL(e) {
      e.preventDefault();
      var self = this;
      this.serverAuth(tokenURL, this.username, this.password, function(error, response) {
        if (error)
        {
          self.$notify.error({
            title: 'Error',
            message: error.details[0]
          });
        }
        else
        {
          if (self.fileDict["imagery"])
          {
            var imagery = esri.tiledMapLayer({
                url: self.fileDict["imagery"],
                crossOrigin: true,
                token: response.token});
            var imageryLayer = new TileLayer(imagery, "imagery");
            self.myLayers.push(imageryLayer);
          }
          if (self.fileDict["asbuilt"])
          {
            var asbuilt = esri.tiledMapLayer({
                url: self.fileDict["asbuilt"],
                crossOrigin: true,
                opacity: 0.5,
                token: response.token});
            var asbuiltLayer = new TileLayer(asbuilt, "asbuilt");
            self.myLayers.push(asbuiltLayer);
          }
          if (self.fileDict["flightplans"])
          {
            var flightPlan = new esri.FeatureLayer({
                url: self.fileDict["flightplans"],
                color: "grey",
                crossOrigin: true,
                token: response.token});
            var flightPlanLayer = new FeatureLayer(flightPlan, "flightplans");
            self.myLayers.push(flightPlanLayer);
          }
          if (self.fileDict["boundary"])
          {
            var boundary = new esri.FeatureLayer({
                url: self.fileDict["boundary"],
                fillOpacity: 0,
                opacity: 1,
                color: "black",
                weight: 5,
                crossOrigin: true,
                token: response.token});
            var boundaryLayer = new FeatureLayer(boundary, "boundary");
            self.myLayers.push(boundaryLayer);
          }
          // Access local database and fetch all data second.
          self.connectToDB();
        }
      });
    },


    /**
    * This function mainly talks to the back end and retrieve any initial data presented and render them in leaflet in front end.
    * 1, it consists of a fetch api call to the back end, sending database path with the format of {"DBpath": xxxxxx}. 
    * 2, if previously created database is missing and an error is return, it will clear all the previous esri layers and restart
    * the entire process. 
    * 3, if connected successfully, but it is an empty database, a warning is returned. 
    * 4, if there are any data present in database, jsonify the json sent from back end, track their layer names (2 or 3 mentioend
    * above), create geojson, and add them into the current map.
    * 5, only after all those are successful, we add the background esri layers into the map and show success information.
    * @param null
    * @return null
    */
    connectToDB() {
      var self = this;
      const requestOptions = {
        method: "post",
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({"DBpath": this.localDB})
      };
      fetch("http://127.0.0.1:5000/accessDB", requestOptions)
        .then(response => response.json())
        .then(data => {
          if (data.error)
          {
            self.$notify.error({
              title: 'Error',
              message: "The database you created previously is missing"
            });
            // clear the layer list after authentication if local database is missing.
            self.myLayers.length = 0;
          }
          else {
            // reaching here means local data added properly or the database is empty.
            if (Object.keys(data).length === 0){
              self.$notify({
                title: 'Warning',
                message: 'You have an empty database',
                type: 'warning'
              });
            }
            else
            {
              for (var key in data) {
                var tableName = key;
                for (var key2 in data[key])
                {
                  var name = key2;
                  var csvKey = name.split("-")[0];
                  if (csvKey in self.fileRecorder)
                  {
                    self.fileRecorder[csvKey] += 1;
                  }
                  else
                  {
                    self.fileRecorder[csvKey] = 1;
                  }
                  var dataObject = JSON.parse(data[key][key2].replaceAll("'", '"'));
                  var newGeoJson = new GeoJsonLayer(name, dataObject, tableName);
                  newGeoJson.addToMap(self.map);
                  self.myLayers.push(newGeoJson);
                }
              }
            }
            // only after local database is working properly can we render the authenticated maps and finish then entire click event.
            for (let i = 0; i < self.myLayers.length; i++)
            {
              self.myLayers[i].addToMap(self.map);
            }
            self.stillInLogin = false;
            self.map.setView(self.center);
            self.$notify({
              title: 'Success',
              message: 'Hello, ' + self.username + ". Today's inspection type is " + self.inspectionType,
              type: 'success',
              duration: 5000
            });
          }
        });
    },


    /**
    * This function is to read the project file and extract url, inspection type, etc from it. 
    * This happens when user click on the upload project file button. The file capacity is only 1. 
    * @param file
    * @return null
    */
    readMetaData(file) {
      let self = this;
      let reader = new FileReader();
      reader.readAsText(file.raw);
      reader.onload = function() {
        let data = JSON.parse(reader.result);
        // key error checking?
        self.localDB = data["dataBaseName"];
        self.defaultBuffer = data["Default Buffer Radius"];
        self.inspectionType = data["Inspection Type"];
        self.fileDict = data["List of Layers and types"];
        self.center = data["Site Center"];
      }
    },


    /**
    * This function is called whenever a project file is removed from the uploading box, hence reseting the file dictioanrys to undefined.
    * @param null
    * @return null
    */
    clearMetaData() {
      this.fileDict = undefined;
    },


    /**
    * This function is called when user tries to upload more than one project files.
    * @param null
    * @return null
    */
    exceedWarning() {
      this.$notify({
        title: 'Warning',
        message: 'There can only be 1 project file',
        type: 'warning'
      });
    },


    /**
    * This function is to user the username and password to do the authorizations
    * @param server 
    * @param username string for username
    * @param password string for passwrod
    * @param callback callback functions after the authorization
    * @return null
    */
    serverAuth (server, username, password, callback) {
      esri.post(server, {
        username: username,
        password: password,
        f: 'json',
        expiration: 86400,
        client: 'referer',
        referer: window.location.origin
      }, callback);
    }
  },

  

    /**
    * This mounted hooks is to initialize map when the app runs and add the background layer.
    * @param null
    * @return null
    */
  mounted() {
    this.map = L.map("MapView", {
    zoom: this.zoom
    });
    L.tileLayer(this.url,
    {attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.map);
    // this.map.locate({setView : true, maxZoom : this.zoom});
  },
}
</script>

<style>
#app {
  height: 100vh;
  display: flex;
}

#MapView {
  flex: 1
}

#loginBox {
  width: 100vh;
  position: absolute;
  top: 100px;
  left: 80px;
  overflow: visible;
}

.infoBox {
  margin-top: 5px;
  display: flex;
}

.preLabel {
  padding-top: 6px;
  margin-right: 5px;
}

.MDupload {
  margin-top: 10px;
}
</style>