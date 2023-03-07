const fs = require('fs');
const path = require('path');

let  files =  process.argv.slice(3);
const preFixLocation =  "LinterTs/src";



// To Restore create bash script
// find LinterTs/src -type f -not -name '*.DS_Store'

restoreDir(files, preFixLocation)


function restoreDir(filesList, preFix="") {

  filesList.forEach((file) => {

    const destinationPath = path.join(file.replace(preFix, "")); // create backup path

    try {
      const absoluteFilePath = path.resolve(file);
      fs.copyFileSync(absoluteFilePath, destinationPath); // copy file to backup directory
      console.log([`✨ ${destinationPath}`]);
    } catch (err) {
      console.error(`Error copying file: ${err.message}`);
    }


  });

  fs.rmdir(preFixLocation, { recursive: true }, (err) => {
  if (err) {
    console.error(`Error deleting folder: ${err}`);
  } else {
    console.log(`Folder ${preFixLocation} deleted successfully`);
  }
});
}



