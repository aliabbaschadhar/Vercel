import express from "express"
import cors from "cors"
import { generate } from "./utils"
import simpleGit from "simple-git"
import path from "path"
import { getAllFiles } from "./file"
import { uploadFile } from "./aws"
import { createClient } from "redis"


const app = express()
const PORT = process.env.PORT || 3000
const publisher = createClient()


app.use(express.json())
app.use(cors())
publisher.connect()


app.post("/deploy", async (req, res) => {
  const { repoUrl } = req.body
  if (!repoUrl) {
    return res.status(400).json({ error: "Repository URL is required" })
  }

  const id = generate()
  await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`))

  const files = getAllFiles(path.join(__dirname, `output/${id}`))
  console.log(files)

  files.forEach(async (file) => {
    // /users/aliabbaschadhar/vercel/dist/output/randomstring/src/app.tsx
    // --> slice(__dirname.length) will remove the string till /dist and result would be /output/randomstring/src/app.tsx
    await uploadFile(file.slice(__dirname.length + 1), file)
  })

  // Push the id to redis queue
  publisher.lPush("build-queue", id)

  res.status(200).json({ message: "Deployment triggered", id })
})


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})