const mosca = require('mosca')
const config = require('./config')
const schemas = require('./schemas')
const mongoose = require('mongoose')
const express = require('express')
const app = express()
const port = 3000

/** Mongoose initiatlisation */
mongoose.connect(config.db)
const SensorReading = mongoose.model('SensorReading', schemas.sensorReading)

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
    console.log('Published', packet.payload)
    if (packet.payload) {
      let payload = packet.payload.toString()
      /** Create our object that will be stored in our DB */
      let entry = new SensorReading({
        deviceId: payload[0],
        topic: payload[1],
        timestamp: new Date(), // payload.slice(2, 6)
        sensorId: payload[6],
        sensorType: payload[7],
        sensorReading: Number(payload.slice(8, 11))
        // deviceId: '0',
        // topic: 'a',
        // timestamp: new Date(),
        // sensorId: 'a',
        // sensorType: 'a',
        // sensorReading: 000
      })
      /** Write our object as a document in the DB */
      SensorReading(entry).save().then(res => {
        console.log('Entry written to DB')
      })
    }
  })
  
  server.on('ready', setup)
  
  // fired when the mqtt server is ready
  function setup() {
    console.log('Mosca server is up and running')
  }
}