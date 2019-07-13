import * as fs from "fs";

export function readFolderFiles(folderPath: string): Promise<string[]> {
  return new Promise(function(resolve, reject) {
    fs.readdir(folderPath, (err, filePaths: string[]) => {
        if (err) {
          reject(err);
        }

        resolve(filePaths);
      });
  });
}

export function readFile(filePath: string): Promise<string> {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, "utf8", function(err, text) {
      if (err) {
        reject(err);
      }

      resolve(text);
    });
  });
}
