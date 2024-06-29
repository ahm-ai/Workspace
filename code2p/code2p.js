const fs = require('fs');
const path = require('path');

function generateFileTree(rootPath, ignoredItems = [], outputPath = 'file_tree.txt') {
    let output = `Project Path: ${rootPath}\n\nSource Tree:\n\n\`\`\`\n`;
    const fileContents = {};

    function shouldIgnore(itemPath, item) {
        const isDirectory = fs.statSync(itemPath).isDirectory();
        const extension = path.extname(item);
        
        return ignoredItems.some(ignoredItem => 
            (isDirectory && ignoredItem === item) || 
            (!isDirectory && (ignoredItem === item || ignoredItem === extension))
        );
    }

    function buildTree(currentPath, prefix = '', isLast = true) {
        const items = fs.readdirSync(currentPath)
            .filter(item => !shouldIgnore(path.join(currentPath, item), item));

        items.forEach((item, index) => {
            const itemPath = path.join(currentPath, item);
            const stats = fs.statSync(itemPath);
            const isLastItem = index === items.length - 1;
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            const linePrefix = prefix + (isLast ? '└── ' : '├── ');

            output += `${linePrefix}${item}\n`;

            if (stats.isDirectory()) {
                buildTree(itemPath, newPrefix, isLastItem);
            } else {
                try {
                    const content = fs.readFileSync(itemPath, 'utf8');
                    const relativePath = path.relative(rootPath, itemPath);
                    fileContents[relativePath] = content;
                } catch (error) {
                    console.error(`Error reading file ${itemPath}: ${error.message}`);
                }
            }
        });
    }

    buildTree(rootPath, '', true);
    output += '```\n';

    // Add file contents to the output
    for (const [filePath, content] of Object.entries(fileContents)) {
        const fullPath = path.join(rootPath, filePath);
        output += `\n\`${fullPath}\`:\n\n\`\`\`\`\`\`${path.extname(filePath).slice(1)}\n${content}\n\`\`\`\`\`\`\n`;
    }

    fs.writeFileSync(outputPath, output);
    console.log(`File tree and contents have been written to ${outputPath}`);
}



// Usage
// Get project path from environment variable or use default
const projectPath = process.env.FOLDER_PATH || '<FOLDER_PATH>';

// Get additional folders to ignore from environment variable
const additionalFolders = process.env.FOLDERIGNORE ? process.env.FOLDERIGNORE.split(',') : [];

const defaultIgnoredItems = ['node_modules', '.git', 'dist', '.DS_Store', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac', '.aac', '.wma', '.m4a', '.flv', '.avi', '.mov', '.wmv', '.mkv', '.mpg', '.mpeg', '.3gp', '.json', '.lock'];

// Combine default ignored items with additional folders
const ignoredItems = [...defaultIgnoredItems, ...additionalFolders];

generateFileTree(projectPath, ignoredItems);

// export FOLDER_PATH="<PATH>" 
// export FOLDERIGNORE="folder1,folder2"  
// node code2p.js