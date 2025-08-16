import fs from "fs"
import path from "path"

export const getAllFiles = (folderPath: string) => {
  let response: string[] = []

  const allFilesAndFolders = fs.readdirSync(folderPath)

  allFilesAndFolders.forEach(fileOrFolder => {
    const fullPath = path.join(folderPath, fileOrFolder)
    if (fs.statSync(fullPath).isDirectory()) {
      response = response.concat(getAllFiles(fullPath))
    } else {
      response.push(fullPath)
    }
  })

  return response
}