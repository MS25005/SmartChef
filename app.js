const express = require('express')
let app = new express()

app.use(express.static('static'));

//health check
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
})


app.listen(8000, () => {
    console.log("Server is running...")
})