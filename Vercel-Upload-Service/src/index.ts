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

// console.log(__dirname) // /home/aliabbaschadhar/Programming/Vercel/Vercel-Upload-Service/dist

app.post("/deploy", async (req, res) => {
  const { repoUrl } = req.body
  if (!repoUrl) {
    return res.status(400).json({ error: "Repository URL is required" })
  }

  try {
    const id = generate()
    console.log(`Starting deployment for ID: ${id}`)

    // Clone the repository
    await simpleGit().clone(repoUrl, path.join(__dirname, `output/${id}`))
    console.log(`Repository cloned for ID: ${id}`)

    const files = getAllFiles(path.join(__dirname, `output/${id}`))
    console.log(`Found ${files.length} files to upload for ID: ${id}`)

    // Wait for ALL files to upload before proceeding
    const uploadPromises = files.map(async (file) => {
      // /users/aliabbaschadhar/vercel/dist/output/randomstring/src/app.tsx
      // --> slice(__dirname.length) will remove the string till /dist and result would be /output/randomstring/src/app.tsx
      const s3Key = file.slice(__dirname.length + 1)
      console.log(`Uploading: ${s3Key}`)
      return uploadFile(s3Key, file) // Upload to S3 bucket
    })

    // Wait for ALL uploads to complete
    await Promise.all(uploadPromises)
    console.log(`All ${files.length} files uploaded successfully for ID: ${id}`)

    // Only push to queue AFTER all files are uploaded
    await publisher.lPush("build-queue", id)
    console.log(`Build queued for ID: ${id}`)

    await publisher.hSet("status", id, "uploaded")
    console.log("Status: Uploaded")

    res.status(200).json({ message: "Deployment triggered", id })
  } catch (error) {
    console.error('Deployment error:', error)
    res.status(500).json({ error: "Deployment failed" })
  }
})


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})