module.exports = {
  sensorReading: {
    messageType: String,
    deviceId: String,
    topic: String,
    timestamp: Date,
    sensorId: String,
    sensorType: String,
    sensorReading: Number
  },
  controlSignal: {
    messageType: String,
    deviceId: String,
    topic: String,
    timestamp: Date,
    signal: String
  }
}