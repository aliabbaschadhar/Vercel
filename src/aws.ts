import { S3 } from "aws-sdk"
import { configDotenv } from "dotenv"
import fs from "fs"
configDotenv()

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_BUCKETS_ENDPOINT
})

// fileName ===> output/12312/src/App.tsx
// filePath ===> /Users/aliabbaschadhar/vercel/dist/output/12312/src/App.tsx

export const uploadFile = async (fileName: string, localFilePath: string) => {
  console.log("called");
  const fileContent = fs.readFileSync(localFilePath);
  const response = await s3.upload({
    Body: fileContent,
    Bucket: "vercel",
    Key: fileName,
  }).promise();

  console.log(response)
}
