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
        <!-- <span class="preLabel">File Path: </span>
        <el-input placeholder="input project path"
                  v-model="projectPath" show-password
                  style="width: 220px" size="small"
                  @blur="processMetaData"></el-input> -->
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="connectToAGOL">Connect to Arcgis Online</el-button>
      </span>
    </el-dialog>
    </div>

    <!-- content view on the left -->
    <TableContent/>
    <!-- map itself -->
    <div id='MapView'></div>
    <!-- top button bar -->
    <TopBar/>
  </div>
</template>

<script>
import TableContent from './components/TableContent.vue'
import TopBar from './components/TopBar.vue'
import L from 'leaflet'
import mapInfo from './jsTools/mapInfo.js'

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
      // AGOL feature urls.
      metaData: [],
      // list with references to the layers.
      myLayers: [],

      // initial map info
      map: undefined,
      zoom: 15,
      center: [42.401090, -83.557090],
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    }
  },

  methods: {
    connectToAGOL(e) {
      if (this.metaData.length == 0)
      {
        this.$notify.error({
          title: 'Error',
          message: "Project file is empty or invalid"
        });
      }
      else
      {
        // 1, pass database path to flask.
        // Create new sqlite if not exist. Load data back if there is data inside sqlite.
        // sample geoJson format: {name: xxx, geometry: {"type": "Polygon", "coordinates": []}}
        var jsonInput = {
            "type": "Polygon",
            "coordinates": [
              [
                [
                  -83.56849193572998,
                  42.39554091720936
                ],
                [
                  -83.55626106262207,
                  42.39344912341609
                ],
                [
                  -83.55681896209717,
                  42.397727717992005
                ],
                [
                  -83.56849193572998,
                  42.39554091720936
                ]
              ]
            ]
          };
        var newGeoJson = new mapInfo({name: "testJson", geometry: jsonInput});
        newGeoJson.addToMap(this.map);
        this.myLayers.push(newGeoJson);



        // 2, authentication and push required WMS in metaData.
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
            for (let i = 0; i < self.metaData.length; i++)
            {
              // url error checking ?
              var newInput = esri.tiledMapLayer({
                url: self.metaData[i],
                minZoom: 10,
                maxZoom: 19,
                token: response.token
              });
              var newLayer = new mapInfo(newInput);
              newLayer.addToMap(self.map);
              self.myLayers.push(newLayer);
            }
            self.$notify({
              title: 'Success',
              message: 'Hello, ' + self.username,
              type: 'success'
            });
            self.metaData.length = 0;
          }
        });
      }
      // 3, close the dialog and clear the metaData array.
      this.stillInLogin = false;
    },

    connectToDB() {
      // const response = fetch(window.location)
    },

    readMetaData(file) {
      let self = this;
      let reader = new FileReader();
      reader.readAsText(file.raw);
      reader.onload = function() {
        let data = JSON.parse(reader.result);
        // key error checking.
        self.localDB = data["dataBasePath"];
        for (let i = 0; i < data["List of Layers and types"].length; i++)
        {
          self.metaData.push(data["List of Layers and types"][i][0]);
        }
      }
    },

    clearMetaData() {
      this.metaData.length = 0;
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
    center: this.center,
    zoom: this.zoom});
    L.tileLayer(this.url,
    {attribution:'&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'}).addTo(this.map);
  }
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