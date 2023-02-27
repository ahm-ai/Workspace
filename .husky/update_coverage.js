const fs = require('fs');
const { execSync } = require('child_process');

// Get list of modified JavaScript files using git status command
const gitStatus = execSync('git diff --cached --name-status').toString();
const jsFiles = gitStatus
  .split('\n')
  .filter(line => line.trim().startsWith('M') && line.endsWith('.js'))
  .map(line => line.replace('M', '').trim());


console.log(jsFiles);

// Loop through each modified JavaScript file and apply the changes
for (const filePath of jsFiles) {
  // Read file
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if first line contains "coverage"
  const lines = content.split('\n');
  let firstLine = lines[0];
  console.log(firstLine);
  if (firstLine.includes('// Coverage')) {
    // Replace the first line with coverage percentage
    const coveragePercent = 95; // Replace with actual coverage percentage
    firstLine = `// Coverage: ${coveragePercent}%`;
    lines[0] = firstLine;
  } else {
    // Add a new line with coverage percentage
    const coveragePercent = 75; // Replace with actual coverage percentage
    const newLine = `// Coverage: ${coveragePercent}%`;
    lines.unshift(newLine);
  }

  // Write back to file
  content = lines.join('\n');
  fs.writeFileSync(filePath, content);

    // Stage the modified file
  execSync(`git add ${filePath}`);
}
