

import chalk from 'chalk';
import fs from 'fs';
import { dirname, join } from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the JSON file
const mergeRequestsPath = join(__dirname, 'merge_requests.json');
const mergeRequests = JSON.parse(fs.readFileSync(mergeRequestsPath, 'utf8'));

// Function to display merge requests
function displayMergeRequests() {
  mergeRequests.forEach((mr, index) => {
    console.log(chalk.green(`${index + 1}.`) + chalk.yellow(` [${mr.sourceBranch}]`) + ` ${mr.title}`);
  });
}

// Function to execute git commands
function executeGitCommands(sourceBranch, targetBranch) {
  const commands = [
    'git stash',
    `git checkout ${sourceBranch}`,
    `git pull origin ${targetBranch} --rebase`
  ];

  console.log(chalk.cyan("Git commands to be executed:"));
  commands.forEach(cmd => console.log(chalk.yellow(cmd)));

  // Execute the commands
  // commands.forEach(cmd => {
  //   exec(cmd, (error, stdout, stderr) => {
  //     if (error) {
  //       console.error(`Error executing ${cmd}: ${error}`);
  //       return;
  //     }
  //     console.log(`Executed: ${cmd}`);
  //     console.log(stdout);
  //   });
  // });
}

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display merge requests and prompt for selection
console.log(chalk.cyan("Select a merge request:"));
displayMergeRequests();

rl.question('Enter the number of the merge request: ', (answer) => {
  const index = parseInt(answer) - 1;
  if (index >= 0 && index < mergeRequests.length) {
    const selectedMR = mergeRequests[index];
    console.log(`You selected: ${selectedMR.title}`);
    executeGitCommands(selectedMR.sourceBranch, selectedMR.targetBranch);
  } else {
    console.log('Invalid selection');
  }
  rl.close();
});