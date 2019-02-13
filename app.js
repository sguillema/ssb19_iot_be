var mosca = require('mosca')
var config = require('./config')
var schemas = require('./schemas')
var mongoose = require('mongoose')

/** Mongoose initiatlisation */
mongoose.connect(config.db)
const SensorReading = mongoose.model('SensorReading', schemas.sensorReading)

/** Mosca */
var ascoltatore = {
  //using ascoltatore
  type: 'mongo',
  url: config.db,
  pubsubCollection: 'ascoltatori',
  mongo: {}
}

var settings = {
  port: 1883,
  backend: ascoltatore
}

var server = new mosca.Server(settings)

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