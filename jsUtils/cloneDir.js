const fs = require('fs');
const path = require('path');

let  files =  process.argv.slice(2);
files  = files.map(el => el.replace(/\/ /gi, "/"))
files  = files.map(el => el.replace(/\"/gi, ""))

const toPath= '/Users/home/Documents/AhTools/LinterTs/src'

copyFilesFromTo(files, toPath);

// From Git
// git status --porcelain | cut -c3- | xargs node ~/Documents/AhTools/jsUtils/cloneDir.js     
// git status --porcelain | cut -c3- | sed "s|^|'$(pwd)/|" | sed "s|$|'|" | tr '\n' ' ' | xargs node ~/Documents/AhTools/jsUtils/cloneDir.js     



function copyFilesFromTo(origin, to = "") {
  const backupDir = path.join(to); // full path to backup directory

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir); // create backup directory if it doesn't exist
  }

  origin.forEach((file) => {

    const backupPath = path.join(backupDir, file); // create backup path

    const fileDir = path.dirname(backupPath); // get directory of the file
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true }); // create directory if it doesn't exist
    }

    try {
      const absoluteFilePath = path.resolve(file);
      fs.copyFileSync(absoluteFilePath, backupPath); // copy file to backup directory
      console.log([`✨ ${backupPath}`]);
    } catch (err) {
      console.error(`Error copying file: ${err.message}`);
    }
  });
}
