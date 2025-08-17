import { createClient } from "redis"
import { downloadS3Folder } from "./aws"

const subscriber = createClient()
subscriber.connect()

async function main() {
  while (true) {
    const response = await subscriber.brPop("build-queue", 0)
    console.log(response)

    // Download the react project from S3 to build the project
    const id = response?.element
    await downloadS3Folder(`/output/${id}`)
  }
}

main()