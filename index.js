const port = process.env.PORT || 3000

const { exec } = require('child_process')

const app = require('http').createServer(handler)
const io = require('socket.io')(app)
const fs = require('fs')

function getCmdSh (path, callback) {
  fs.readdir(path, (err, files) => {
    files.forEach((file) => {
      fs.readFile(`${path}/${file}`, (err, data) => {
        //console.info(data.toString())
        let lineName = data.toString().split('\n').filter((line) => {
          return line.match('# name:')
        })

        //console.info(lineName[0].split(':')[1])
        //console.info(file)

        callback({
          'name': lineName[0].split(':')[1],
          'value': file
        })

      })
    })
  })
}

let commands = []

getCmdSh('scripts', (cmd) => {
  //console.info('=================')
  //console.info(cmd)
  commands.push(cmd)
})


app.listen(port)

function handler (req, res) {
  //console.log(req.url)
  if(req.url === '/') {
    fs.readFile(__dirname + '/index.html', (err, data) => {
      if (err) {
        res.writeHead(500)
        return res.end('Error loading index.html')
      }
      res.end(data)
    })
  } else {
    fs.readFile(__dirname + req.url, (err, data) => {
      if (err) {
        res.writeHead(500)
        return res.end(`Error loading ${req.url}`)
      }
      res.end(data)
    })

  }
}

io.on('connection', (socket) => {
  socket.on('get commands', () => {
    fs.readFile(__dirname + '/commands.json', (err, data) => {
      if (err) { return }
      //console.info(data.toString())
      //io.emit('get commands', data.toString())
      //let commands = JSON.parse(data.toString())

      JSON.parse(data.toString()).forEach( (cmd) => {
        commands.push(cmd)
      })

      //getCmdSh('scripts', (cmd) => {
      //  commands.push(cmd)
      //})

      console.log(commands)
      io.emit('get commands', JSON.stringify(commands))
    })
  })

  socket.on('chat message', (msg) => {
    console.info(msg)
    console.log(typeof(msg))
    if (msg.match(/.*\.sh$/)) {
      console.log(`exec shell ${msg}`)
      msg = `sh scripts/${msg}`
    }

    exec(msg, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`)
        console.log(`stderr: ${stderr}`)
        return;
      }
      io.emit('chat message', stdout)
      console.log(`stdout: ${stdout}`)
    })
  })
})

