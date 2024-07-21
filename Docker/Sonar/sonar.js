
const { execSync } = require('child_process');

const SONAR_URL = 'http://localhost:9000';
const SONAR_USER = 'admin';
const SONAR_PASS = process.env.SONAR_PASS; 
const PROJECT_KEY = 'project';

async function fetchSonarIssues() {
  const response = await fetch(
    `${SONAR_URL}/api/issues/search?componentKeys=${PROJECT_KEY}`,
    {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${SONAR_USER}:${SONAR_PASS}`).toString('base64')
      }
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

function formatIssues(issues) {
  return issues.map(issue => 
    `${issue.component}:${issue.line}:${issue.message} [${issue.severity}]`
  ).join('\n');
}

async function main() {
  try {
    const data = await fetchSonarIssues();
    const formattedIssues = formatIssues(data.issues);
    console.log(formattedIssues);

    // Write formatted issues to a temporary file
    const fs = require('fs');
    // const tempFile = '/tmp/sonar_issues.txt';
    // fs.writeFileSync(tempFile, formattedIssues);

    // Run reviewdog command
    // const reviewdogCmd = `cat ${tempFile} | reviewdog -f=checkstyle -reporter=github-pr-review`;
    // execSync(reviewdogCmd, { stdio: 'inherit' });

    // Clean up temp file
    fs.unlinkSync(tempFile);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();