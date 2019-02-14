const express = require('express')
const app = express()
const port = 1883

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
  process.exit(0)
}).on('error', (err) => {
  console.log(err)
  process.exit(0)
})