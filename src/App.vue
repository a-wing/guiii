<template>
  <div id="app">
    <br/>
    <el-row type="flex" class="row-bg" justify="center">
      <el-col :xs="22" :sm="20" :md="18" :lg="16" :xl="12">
        <div v-for="(cmd, index) in buttons">
          <el-col :xs="24" :sm="12" :md="12" :lg="12" :xl="12" style="margin: 12px 0">
            <el-button type="success" plain @click="send(index)" :loading=cmd.status>{{ cmd.name }}</el-button>
          </el-col>
        </div>
      </el-col>
    </el-row>

  </div>
</template>

<script>
import io from 'socket.io-client'

export default {
  name: 'app',
  data () {
    return {
      buttons: []
    }
  },
  created() {
    this.socket = io()

    this.socket.emit('get commands', '')
    this.socket.on('get commands', (msg) => {
      this.buttons = JSON.parse(msg).map(item => Object.assign({status: false}, item))

      //console.log(JSON.parse(msg))
    })
  },
  methods: {
    send(button_id) {
      console.log('===========================')

      this.buttons[button_id].status = true

      this.socket.emit('chat message', this.buttons[button_id].value)
      this.socket.on('chat message', (msg) => {
        this.buttons[button_id].status = false
        console.log(msg)
      })
    }
  }
}
</script>

