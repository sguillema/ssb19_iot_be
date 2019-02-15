const mosca = require('mosca')
const config = require('./config')
const schemas = require('./schemas')
const mongoose = require('mongoose')
const express = require('express')
const app = express()
const port = 3000
const sensorType = {
  temperature1dec: 'A'
}
const messageType = {
  sensorReading: '0',
  controlSignal: '1'  
}
const signalType = {
  off: '0',
  on: '1',
  reset: '2',
  sleep: '3',
  wake: '4',
  high: '5',
  medium: '6',
  low: '7'
}

/** Mongoose initiatlisation */
mongoose.connect(config.db)
const SensorReading = mongoose.model('SensorReading', schemas.sensorReading)
const ControlSignal = mongoose.model('ControlSignal', schemas.controlSignal)

/** Mosca */
let ascoltatore = {
  //using ascoltatore
  type: 'mongo',
  url: config.db,
  pubsubCollection: 'ascoltatori',
  mongo: {}
}

let settings = {
  port: 1883,
  backend: ascoltatore
}

let server // This is our mosca server variable

/** Classic endpoint :) */
app.get('/', (req, res) => res.send('Hello World!'))

/** GET - Check the broker status */
app.get('/status', (req, res) => {
  let tempApp = express().listen(settings.port, () => {
    res.send({
      val: false,
      msg: 'Broker is NOT running. You may restart it by doing a GET request to \'/reset\'\n'
    })
    tempApp.close()
  }).on('error', (err) => {
    res.send({
      val: true,
      msg: 'Broker is up and running! You may restart it by doing a GET request to \'/reset\'\n'
    })
    tempApp.close()
  })
})

/** GET - Reset the broker */
app.get('/reset', (req, res) => {
  try {
    server.close()
    main()
    res.send({
      msg: 'Restarting MQTT Broker \n'
    })
  } catch(err) {
    res.send({
      msg: 'Failed to start MQTT Broker. Reason: '+err
    })
  }
})

app.listen(port, () => {
  console.log(`Server listening on ${port}!`)
  main()
  console.log(`Mosca MQTT broker running on ${settings.port}`)
})

function main() { 
  console.log(`Starting Mosca server...`)
  server = new mosca.Server(settings)
  
  server.on('clientConnected', function(client) {
      console.log('client connected', client.id)
  })
  
  // fired when a message is received
  server.on('published', function(packet, client) {
    // console.log('Published', packet.payload.toString());
    // console.log('Published', packet.payload, typeof(packet.payload), Buffer.isBuffer(packet.payload))
    if (packet.payload && Buffer.isBuffer(packet.payload)) {

      let payload = packet.payload.toString()
      // console.log(`Payload ${payload}`)
      let entry
      switch (payload[0]) {
        case messageType.sensorReading : {
          /** Create our object that will be stored in our DB */
          let formattedReading = Number(payload.slice(9, 12))

          switch (payload[8]) {
            case sensorType.temperature1dec : {
              formattedReading = parseFloat(formattedReading.toString().slice(0,2)+'.'+formattedReading.toString().slice(2))
            }
          }

          entry = new SensorReading({
            messageType: payload[0],
            deviceId: payload[1],
            topic: payload[2],
            timestamp: new Date(), // payload.slice(3, 7)
            sensorId: payload[7],
            sensorType: payload[8],
            sensorReading: formattedReading
          })

          /** Write our object as a document in the DB */
          SensorReading(entry).save().then(res => {
            console.log(`Sensor Reading entry written to DB -- Payload ${payload}`)
            break
          })
        }

        case messageType.controlSignal : {
          /** Create our object that will be stored in our DB */
          entry = new ControlSignal({
            messageType: payload[0],
            deviceId: payload[1],
            topic: payload[2],
            timestamp: new Date(), // payload.slice(3, 7)
            signal: payload[7]
          })

          /** Write our object as a document in the DB */
          ControlSignal(entry).save().then(res => {
            console.log(`Control Signal entry written to DB -- Payload ${payload}`)
            break
          })
        }

        default : {
          console.log(`Unknown payload ${packet.payload}`)
        }
      }
    }
  })
  
  server.on('ready', setup)
  
  // fired when the mqtt server is ready
  function setup() {
    console.log('Mosca server is up and running')
  }
}