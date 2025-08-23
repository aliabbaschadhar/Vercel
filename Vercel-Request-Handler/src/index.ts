import { configDotenv } from "dotenv"
import express from "express"
import { S3 } from "aws-sdk"
configDotenv()

const app = express()
const PORT = process.env.PORT || 3001
const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_BUCKETS_ENDPOINT
})

app.get("/*", async (req, res) => {
  //hello.novaHost.com
  const host = req.hostname;
  const id = host.split(".")[0] //==> [hello,novaHost,com]

  const filePath = req.path
  const contents = await s3.getObject({
    Bucket: "vercel",
    Key: `dist/${id}/${filePath}`
  }).promise();

  const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? "text/css" : "application/javascript"
  res.set("Content-Type", type)
  res.send(contents.Body)
})

app.listen(PORT, () => {
  console.log("Request Handler Server is running on port:3001")
})