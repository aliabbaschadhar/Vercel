import { createClient } from "redis"

const subscriber = createClient()
subscriber.connect()

async function main() {
  while (true) {
    const response = await subscriber.brPop("build-queue", 0)
    console.log(response)
  }
}

main()