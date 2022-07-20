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
        <span class="preLabel">File Path: </span>
        <el-input placeholder="input project path"
                  v-model="projectPath" show-password
                  style="width: 220px" size="small"
                  @blur="processMetaData"></el-input>
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
      projectPath: "",

      // map info
      totalLayerList: [],
      map: undefined,
      zoom: 14,
      center: [42.401090, -83.557090],

      // initial layer info
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      featureUrl: "https://tiles.arcgis.com/tiles/QUg4M9ZDNdUHdQcy/arcgis/rest/services/202206_Arbor_Hills_SnifferDRONE_CH4_Change/MapServer",
    }
  },

  methods: {
    connectToAGOL(e) {
      e.preventDefault();
      var self = this;
      this.serverAuth(tokenURL, this.username, this.password, function(error, response) {
        if (error) {
          self.$notify.error({
            title: 'Error',
            message: error.details[0]
          });
        } else {
          self.stillInLogin = false;
          self.$notify({
            title: 'Success',
            message: 'Hello, ' + self.username,
            type: 'success'
          });
          esri.tiledMapLayer({
            url: self.featureUrl,
            minZoom: 10,
            maxZoom: 19,
            token: response.token
          }).addTo(self.map);
        }
      });
    },

    processMetaData() {

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
</style>
