import { S3 } from "aws-sdk"
import path from "path"
import { configDotenv } from "dotenv"
import fs from "fs"
import { waitForDebugger } from "inspector"
configDotenv()

const s3 = new S3({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  endpoint: process.env.CLOUDFLARE_BUCKETS_ENDPOINT
})

// prefix ==> output/id (without leading slash)
export async function downloadS3Folder(prefix: string) {
  try {
    console.log('Downloading from S3 prefix:', prefix)

    // Get all the files from S3 with pagination support
    let allFiles: any[] = []
    let continuationToken: string | undefined = undefined

    do {
      const params: any = {
        Bucket: "vercel",
        Prefix: prefix,
        MaxKeys: 1000 // Get up to 1000 files per request
      }

      if (continuationToken) {
        params.ContinuationToken = continuationToken
      }

      const response = await s3.listObjectsV2(params).promise()

      if (response.Contents) {
        allFiles = allFiles.concat(response.Contents)
      }

      continuationToken = response.NextContinuationToken // Provided by aws-sdk in response
      console.log(`Fetched ${response.Contents?.length || 0} files, total so far: ${allFiles.length}`)

    } while (continuationToken)

    console.log('S3 response - total files found:', allFiles.length)

    if (allFiles.length === 0) {
      console.log('No files found with prefix:', prefix)
      return
    }

    // Log all found files for debugging
    console.log('Files to download:')
    allFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.Key} (${file.Size} bytes)`)
    })

    const allPromises = allFiles.map(({ Key }) => {
      return new Promise<void>((resolve, reject) => {
        if (!Key) {
          resolve()
          return
        }

        console.log('Downloading file:', Key)

        // __dirname ==> /home/aliabbaschadhar/Programming/Vercel/Vercel-Deploy-Service/dist
        // Key ==> output/hello/index.html
        const finalOutputPath = path.join(__dirname, Key)
        const dirName = path.dirname(finalOutputPath)

        try {
          if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true })
            console.log('Created directory:', dirName)
          }

          const outputFile = fs.createWriteStream(finalOutputPath)

          // Handle stream errors
          const readStream = s3.getObject({
            Bucket: "vercel",
            Key: Key
          }).createReadStream()

          readStream.on('error', (error) => {
            console.error('Error downloading file from S3:', Key, error)
            reject(error)
          })

          outputFile.on('error', (error) => {
            console.error('Error writing file to disk:', finalOutputPath, error)
            reject(error)
          })

          outputFile.on('finish', () => {
            console.log('Successfully downloaded:', Key, 'to', finalOutputPath)
            resolve()
          })

          readStream.pipe(outputFile)

        } catch (error) {
          console.error('Error processing file:', Key, error)
          reject(error)
        }
      })
    })

    console.log('Starting download of', allPromises.length, 'files')
    await Promise.all(allPromises)
    console.log('All files downloaded successfully')

  } catch (error) {
    console.error('Error in downloadS3Folder:', error)
    throw error
  }
}

export async function copyBuildCode(id: string) {
  const folderPath = path.join(__dirname, `output/${id}/dist`)
  console.log(folderPath) // /home/aliabbaschadhar/Programming/Vercel/Vercel-Deploy-Service/dist/output/yzc7n/dist
  const allFiles: string[] = getAllFiles(folderPath) || []

  allFiles.forEach((file) => {
    uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file)
  })
  console.log("All files uploaded successfully!")
}

export async function uploadFile(fileName: string, localFilePath: string) {
  const fileContent = fs.readFileSync(localFilePath)
  try {
    const response = await s3.upload({
      Body: fileContent,
      Bucket: "vercel",
      Key: fileName
    }).promise()

    if (response) {
      console.log(`File: ${fileName} uploaded successfully.`)
    }
  } catch (error) {
    console.error("Error happened while uploading files ", error)
    throw error
  }
}

export function getAllFiles(folderPath: string) {
  let response: string[] = []

  // Read all entries (files and folders) in the current directory
  const allFilesAndFolders: string[] = fs.readdirSync(folderPath)

  // Process each entry
  allFilesAndFolders.forEach(fileOrFolder => {
    const fullPath = path.join(folderPath, fileOrFolder) // Get absolute path
    if (fs.statSync(fullPath).isDirectory()) {
      // If entry is a directory, recursively collect its files
      response = response.concat(getAllFiles(fullPath))
    } else {
      // If entry is a file, add its path to the response
      response.push(fullPath)
    }
  })

  return response // Return all collected file paths
}