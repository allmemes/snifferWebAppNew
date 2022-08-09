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
      defaultBuffer: undefined,
      // AGOL feature urls.
      metaData: [],
      // list with references to the layers.
      myLayers: [],

      // initial map info
      loading: false,
      map: undefined,
      zoom: 15,
      center: [42.401090, -83.557090],
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      uploadedNames: new Set(),
    }
  },

  methods: {
    connectToAGOL(e) {
      // check if input metaData Json format is problematic.
      if (this.metaData.length == 0)
      {
        this.$notify.error({
          title: 'Error',
          message: "Project json is empty or invalid"
        });
      }
      else
      {
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
            // Do the authentication and save the layers first.
            for (let i = 0; i < self.metaData.length; i++)
            {
              // url error checking ?
              var newInput = esri.tiledMapLayer({
                url: self.metaData[i],
                minZoom: 10,
                maxZoom: 19,
                token: response.token
              });
              var newLayer = new mapInfo(undefined, newInput, undefined);
              // only save the layer list but not show them.
              self.myLayers.push(newLayer);
            }
            // Access local database and fetch all data second.
            self.connectToDB()
          }
        });
      }
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
                message: 'It is an empty database',
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
                  self.uploadedNames.add(name);
                  var dataObject = JSON.parse(data[key][key2].replaceAll("'", '"'));
                  var newGeoJson = new mapInfo(name, dataObject, tableName);
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
            self.metaData.length = 0;
            self.stillInLogin = false;
            self.$notify({
              title: 'Success',
              message: 'Hello, ' + self.username,
              type: 'success'
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
        // key error checking.
        self.localDB = data["dataBasePath"];
        self.defaultBuffer = data["Default Buffer Radius"];
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