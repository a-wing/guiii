const port = process.env.PORT || 3000

const { exec } = require('child_process')

const app = require('http').createServer(handler)
const io = require('socket.io')(app)
const fs = require('fs')

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
      console.info(data.toString())
      io.emit('get commands', data.toString())
    })
  })

  socket.on('chat message', (msg) => {
    console.info(msg)

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

