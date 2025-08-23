import { S3 } from "aws-sdk"
import path from "path"
import { configDotenv } from "dotenv"
import fs from "fs"
configDotenv()

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_BUCKETS_ENDPOINT
})

// prefix ==> /output/id
export async function downloadS3Folder(prefix: string) {
  console.log(prefix)

  // Get all the files from S3
  const allFiles = await s3.listObjectsV2({
    Bucket: "vercel",
    Prefix: prefix
  }).promise()

  // [output/hello/index.html, output/hello/index.css ]
  const allPromises = allFiles.Contents?.forEach(async ({ Key }) => {
    return new Promise(async (resolve) => {
      if (!Key) {
        resolve()
        return
      }

      // __dirname ==> /home/aliabbaschadhar/Programming/Vercel/Vercel-Deploy-Service/dist
      // Key ==> output/hello/index.html
      const finalOutputPath = path.join(__dirname, Key);
      const dirName = path.dirname(finalOutputPath)

      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true })
      }

      const outputFile = fs.createWriteStream(finalOutputPath)

      s3.getObject({
        Bucket: "vercel",
        Key: Key || ""
      }).createReadStream().pipe(outputFile).on("end", () => {
        resolve()
      })
      // first data is received and then using writeStream it is written to local file.

    })
  }) || []

  await Promise.all(allPromises.filter(x => x !== undefined))
}