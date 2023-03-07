const fs = require('fs');
const path = require('path');
const originPath = [
    '/Users/home/Documents/NodeFull-Stack/apps/_OCR/package.json'
];



const toPath= '/Users/home/Documents/AhTools/LinterTs/src'

let  files =  process.argv.slice(2);
files  = files.map(el => el.replace(/\/ /gi, "/"))
files  = files.map(el => el.replace(/\"/gi, ""))



console.log(files);
backupFiles(files, toPath);


// Validate the source directory path
if (!sourcePath) {
  console.error('Usage: node index.js <source directory>');
  process.exit(1);
} else if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isDirectory()) {
  console.error('Invalid source directory:', sourcePath);
  process.exit(1);
}




// Copy the directory recursively
// copyFilesToBackup(sourcePath, destinationPath);

//  git status --porcelain | cut -c3- | xargs node ~/Documents/AhTools/jsUtils/cloneDir.js     
// git status --porcelain | cut -c3- | sed "s|^|'$(pwd)/|" | sed "s|$|'|" | tr '\n' ' ' | xargs node ~/Documents/AhTools/jsUtils/cloneDir.js     



function backupFiles(origin, to = "") {
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
