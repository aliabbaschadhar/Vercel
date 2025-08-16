import express from "express"
import cors from "cors"
import simpleGit from "simple-git"
import { generate } from "./utils"


const app = express()
const PORT = process.env.PORT || 3000


app.use(cors())
app.use(express.json())

app.get("/", (req, res) => {
  res.json({ "msg": "Hello World" })
})


app.post("/deploy", async (req, res) => {
  const { repoUrl } = req.body
  console.log(repoUrl)
  const id = generate()
  await simpleGit().clone(repoUrl, `output/${id}`)
  res.json({ id: id })
})



app.listen(PORT, () => {
  console.log("Server is running on port:", PORT)
})