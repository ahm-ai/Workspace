import chalk from 'chalk';
import fs from 'fs/promises';

// GitLab API URL
const GITLAB_API = 'https://gitlab.com/api/v4';

// Environment variables
const GITLAB_USERNAME = process.env.GITLAB_USERNAME;
const PRIVATE_TOKEN = process.env.PRIVATE_TOKEN;

// Dracula theme colors
const draculaPink = '#ff79c6';
const draculaPurple = '#bd93f9';
const draculaGreen = '#50fa7b';

// Function to fetch MRs
async function fetchMRs() {
  const response = await fetch(
    `${GITLAB_API}/merge_requests?state=opened&author_username=${GITLAB_USERNAME}`,
    {
      headers: {
        'PRIVATE-TOKEN': PRIVATE_TOKEN
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Function to display MRs
function displayMRs(mrs) {
  console.log(chalk.bold('Your Open Merge Requests:'));
  console.log(chalk.bold('=========================='));

  mrs.forEach(mr => {
    console.log(chalk.hex(draculaPink)(`MR ID: ${mr.iid}`));
    console.log(`Title: ${mr.title}`);
    console.log(chalk.hex(draculaPurple)(`Source Branch: ${mr.source_branch}`));
    console.log(chalk.hex(draculaGreen)(`Target Branch: ${mr.target_branch}`));
    console.log(`MR Link: ${mr.web_url}`);
    console.log();
  });
}

// Function to save specific MR data as JSON
async function saveMRsAsJson(mrs) {
  const simplifiedMRs = mrs.map(mr => ({
    id: mr.iid,
    title: mr.title,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    url: mr.web_url
  }));

  const jsonData = JSON.stringify(simplifiedMRs, null, 2);
  await fs.writeFile('gitlab/merge_requests.json', jsonData);
  console.log(chalk.blue('Merge requests saved to merge_requests.json'));
}

// Main execution
async function main() {
  try {
    const mrs = await fetchMRs();

    if (mrs.length === 0) {
      console.log(chalk.yellow('No open Merge Requests found.'));
    } else {
      displayMRs(mrs);
      await saveMRsAsJson(mrs);
    }
  } catch (error) {
    console.error(chalk.red('Error fetching merge requests:'), error);
  }
}

main();

