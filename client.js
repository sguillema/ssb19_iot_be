var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://localhost:1883')

client.on('connect', function () {
  client.subscribe('presence', function (err) {
    if (!err) {
      // client.publish('blah', 'Hello mqtt')
      console.log("Sending packet")
      client.publish('presence', 'Hello mqttpie')
    }
  })
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic)
  console.log(message.toString())
  client.end()
})