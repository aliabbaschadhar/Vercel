import { exec } from "child_process"
import path from "path"

export function buildProjects(id: string) {
  return new Promise<void>((resolve, reject) => {
    // Construct the path to the output directory for a specific 'id'
    const cwd = path.join(__dirname, `output/${id}`)

    // Execute 'npm install' and 'npm run build' in the specified directory
    // This installs dependencies and builds the project located at 'cwd'
    const child = exec("npm install && npm run build", { cwd })

    child.stdout?.on("data", (data) => {
      console.log("stdout:", data)
    })
    child.stderr?.on("data", (data) => {
      console.log("stderr:", data)
    })

    child.on("close", (code) => {
      if (code === 0) {
        console.log("All projects build completely")
        resolve()
      } else {
        reject(new Error(`Build process exited with code ${code}`))
      }
    })
    child.on("error", (err) => {
      reject(err)
    })
  })
}