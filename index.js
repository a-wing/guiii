
//import YAML from 'yaml'
const YAML = require('yaml')
const fs = require('fs')
const config = YAML.parse(fs.readFileSync('./config.yml', 'utf8'))

//console.log(config)
//const port = process.env.PORT || 3000

const { exec } = require('child_process')

const serve = require('koa-static')
const Koa = require('koa')
const app = new Koa()


const auth = require('basic-auth')
const compare = require('tsscmp')

// custom 401 handling
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    if (401 == err.status) {
      ctx.status = 401
      ctx.set('WWW-Authenticate', 'Basic')
      ctx.body = 'cant haz that'
    } else {
      throw err
    }
  }
})

app.use(aaa({ name: 'aa', pass: 'aa' }))

function aaa(opts) {
  opts = opts || {}

  if (!opts.name && !opts.pass)
    throw new Error('Basic auth `name` and/or `pass` is required')

  if (!opts.realm) opts.realm = 'Secure Area'

    return function basicAuth(ctx, next) {
      const user = auth(ctx);
      //if ( !user || (opts.name && !compare(opts.name, user.name)) || (opts.pass && !compare(opts.pass, user.pass)) )
      if (!user || !check(user.name, user.pass))
        return ctx.throw(
          401,
          null,
          {
            headers: {
              'WWW-Authenticate': 'Basic realm="' + opts.realm.replace(/"/g, '\\"') + '"'
            }
          }
        )
        return next()
    }
}


app.use(serve(__dirname + '/dist'))

const server = require('http').Server(app.callback())

//const io = require('socket.io')(app)
const io = require('socket.io')(server)


function check (name, pass) {
  let matching = config.accounts.filter((account) => {
    return compare(name, account.user) && compare(pass, account.pass)
  })

  //console.log(matching)
  return matching.length ? true : false
}


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


//app.listen(config.server.port)
server.listen(config.server.port)

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

