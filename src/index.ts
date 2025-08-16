import express from "express"
import cors from "cors"


const app = express()
const PORT = process.env.PORT || 3000


app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.json({ "msg": "Hello World" })
})

app.post("/deploy", (req, res) => {
  const { repoUrl } = req.body
  console.log(repoUrl)

  res.json({ msg: repoUrl })
})



app.listen(PORT, () => {
  console.log("Server is running on port:", PORT)
})