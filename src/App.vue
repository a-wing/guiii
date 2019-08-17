<template>
  <div id="app">
    <br/>
    <el-row type="flex" class="row-bg" justify="center">
      <el-col :xs="22" :sm="20" :md="18" :lg="16" :xl="12">
        <div v-for="(cmd, index) in buttons">
          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" style="margin: 12px 0">
            <el-button type="success" plain @click="send(index)" :loading=cmd.status>{{ cmd.name ? cmd.name : cmd.file }}</el-button>
          </el-col>
        </div>
      </el-col>
    </el-row>

  </div>
</template>

<script>
//import io from 'socket.io-client'
import jsonrpc from 'jsonrpc-lite'

export default {
  name: 'app',
  data () {
    return {
      socket: {},
      buttons: []
    }
  },
  created() {
    console.log("created")
    //this.socket = io()

    //this.socket.emit('get commands', '')
    //this.socket.on('get commands', (msg) => {
    //  this.buttons = JSON.parse(msg).map(item => Object.assign({status: false}, item))
    //  //console.log(JSON.parse(msg))
    //})

    //ws = new WebSocket("./guiii/link");
    this.connect(`ws://${window.location.host}/guiii/link`);
  },
  methods: {
    connect(addr) {
      let ws = new WebSocket(addr)
        console.log(ws)

      ws.onopen = (ev) => {
        console.log("open")
        this.getSchema()
      }

      ws.onclose = (ev) => {
        console.log("close")
      }

      ws.onmessage = (ev) => {
        console.log("onmessage")
        //console.log(ev)
        //console.log(JSON.parse(ev.data))
        console.log(ev.data)

         try {
        if (JSON.parse(ev.data) instanceof Array) {
        this.buttons = JSON.parse(ev.data).map(item => Object.assign({status: false}, item))
        }
         } catch {
           console.log("not json")

         }
      }

      ws.onerror = (ev) => {
        console.log("error")
      }
      this.socket = ws
      //this.test()
    },
    getSchema() {
      //setTimeout(() => {
        this.socket.send(JSON.stringify(jsonrpc.request('init', 'get_schema')));
      //}, 1000);
    },
    send(button_id) {
      console.log('===========================')

      this.socket.send(JSON.stringify(jsonrpc.request(String(Date.parse(new Date())), this.buttons[button_id].file)));
      //this.buttons[button_id].status = true

      //this.socket.emit('chat message', this.buttons[button_id].value)
      //this.socket.on('chat message', (msg) => {
      //  this.buttons[button_id].status = false
      //  console.log(msg)
      //})
    }
  }
}
</script>

