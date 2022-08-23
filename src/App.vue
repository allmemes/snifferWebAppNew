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
        <el-input placeholder="input username" v-model="username" style="width: 220px" size="small"></el-input>
      </div>
      <div class="infoBox">
        <span class="preLabel">Password: </span>
        <el-input placeholder="input password" v-model="password" show-password style="width: 220px" size="small"></el-input>
      </div>
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
      fileRecorder: {},
    }
  },

  methods: {
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

    readMetaData(file) {
      let self = this;
      let reader = new FileReader();
      reader.readAsText(file.raw);
      reader.onload = function() {
        let data = JSON.parse(reader.result);
        // key error checking?
        self.localDB = data["dataBasePath"];
        self.defaultBuffer = data["Default Buffer Radius"];
        self.inspectionType = data["Inspection Type"];
        self.fileDict = data["List of Layers and types"];
        self.center = data["Site Center"];
      }
    },

    clearMetaData() {
      this.fileDict = undefined;
    },

    exceedWarning() {
      this.$notify({
        title: 'Warning',
        message: 'There can only be 1 project file',
        type: 'warning'
      });
    },

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