const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Array of file extensions or names to ignore
const ignoredFiles = [
  '.lock',
  'package-lock.json',
  'yarn.lock',
  '.gitignore',
  '.DS_Store',
  '.env',
  'package.json',
];

// Parse command line arguments
const shouldMinify = false;

function shouldIgnoreFile(filePath) {
  const fileName = path.basename(filePath);
  const fileExtension = path.extname(filePath);
  return ignoredFiles.some(ignore => 
    filePath.endsWith(ignore) || fileName === ignore || fileExtension === ignore
  );
}

function simpleMinify(code) {
  return code
    .replace(/\/\/.*?$/gm, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/^\s+|\s+$/gm, '') // Trim leading and trailing spaces
    .replace(/;\s*/g, ';') // Remove spaces after semicolons
    .replace(/{\s*/g, '{').replace(/\s*}/g, '}') // Remove spaces around curly braces
    .replace(/,\s*/g, ',') // Remove spaces after commas
    .replace(/:\s*/g, ':') // Remove spaces after colons
    .replace(/\s*\(\s*/g, '(').replace(/\s*\)\s*/g, ')') // Remove spaces around parentheses
    .replace(/\s*=>\s*/g, '=>') // Remove spaces around arrow functions
    .replace(/\s*<\s*/g, '<').replace(/\s*>\s*/g, '>'); // Remove spaces around angle brackets (for TypeScript generics)
}

async function getGitDiffFiles() {
  return new Promise((resolve, reject) => {
    exec('git df main', (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing git command: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`Git command stderr (non-fatal): ${stderr}`);
      }
      const files = stdout.trim().split('\n').map(line => {
        const parts = line.split('\t');
        return parts.length > 1 ? parts[1].trim() : null;
      }).filter(file => file !== null && !shouldIgnoreFile(file));
      resolve(files);
    });
  });
}

async function getFileContent(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    if (shouldMinify && ['.js', '.ts', '.tsx'].includes(path.extname(filePath))) {
      content = simpleMinify(content);
    }
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return `Unable to read file content: ${error.message}`;
  }
}

async function main() {
  try {
    console.log('Starting git diff script...');
    console.log(`Minify option: ${shouldMinify ? 'enabled' : 'disabled'}`);
    const files = await getGitDiffFiles();
    console.log(`Found ${files.length} modified files (after ignoring specified files).`);

    let output = '';

    for (const file of files) {
      console.log(`Processing file: ${file}`);
      const content = await getFileContent(file);
      output += `File: ${file}\n\nContent:\n${content}\n\n${'='.repeat(80)}\n\n`;
    }

    const outputFile = 'git_diff_output.txt';
    await fs.writeFile(outputFile, output);
    console.log(`Git diff output has been written to ${outputFile}`);
  } catch (error) {
    console.error(`An error occurred in main function: ${error.message}`);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

main().catch(error => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});