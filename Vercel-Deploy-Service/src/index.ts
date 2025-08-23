import { createClient } from "redis"
import { downloadS3Folder } from "./aws"

const subscriber = createClient()
subscriber.connect()

async function main() {
  while (true) {
    try {
      console.log("hello")
      const response = await subscriber.brPop("build-queue", 0)
      console.log("Hello")
      // 0 means wait indefinitely until an item is available in the list.
      console.log('Received from queue:', response)

      // Download the react project from S3 to build the project
      const id = response?.element
      if (!id) {
        console.log('No ID received from queue')
        continue
      }

      console.log('Processing deployment ID:', id)

      // Use the correct prefix format (no leading slash)
      await downloadS3Folder(`output/${id}`)
      console.log('Download completed for ID:', id)

    } catch (error) {
      console.error('Error in main loop:', error)
      // Continue the loop even if there's an error
    }
  }
}

main().catch(console.error)