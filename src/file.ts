import fs from "fs" // Node.js file system module for reading directories and file stats
import path from "path" // Node.js module for handling file paths

// Recursively collects all file paths from a directory and its subdirectories
export const getAllFiles = (folderPath: string) => {
  let response: string[] = [] // Stores all found file paths

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