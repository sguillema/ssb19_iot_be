var mqtt = require('mqtt')
// var client  = mqtt.connect('mqtt://localhost:1883')
var client  = mqtt.connect('mqtt://turtle.summerstudio.xyz:1883')

client.on('connect', function () {
  // client.subscribe('presence', function (err) {
  //   if (!err) {
  //     // client.publish('blah', 'Hello mqtt')
  //     console.log("Sending packet")
  //     // client.publish('presence', 'Hello mqttpie')
  //     client.publish('SoilSensor1', '000')
  //   }
  // })
  
  console.log("Sending packet")
  setInterval(()=>{
    for(i = 1; i < 4; i++) {
      let j = i
      setTimeout(()=>client.publish('test', j.toString()), 1000)
    }
  }, 1000)
})

client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic)
  console.log(message.toString())
  client.end()
})