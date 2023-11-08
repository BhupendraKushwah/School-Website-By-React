const express = require('express')
const db = require('./db')
const app = express()
const port = 3000

db()
app.use(express.json())

app.use('/admin', require('./Routes/Admin/Admin'))
app.use('/teacher', require('./Routes/TeacherRoutes/TeacherRoute'))
app.use('/student',require('./Routes/StudentRoutes/StudentRoutes'))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})