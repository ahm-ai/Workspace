const fs = require('fs');
const path = require('path');
const os = require('os');

function generateFileTree(rootPath, ignoredItems = [], ignoredWords = [], outputPath = 'file_tree.txt') {
    rootPath = rootPath.replace(/^~(?=$|\/|\\)/, os.homedir());
    if (!fs.existsSync(rootPath)) {
        console.error(`Error: The directory "${rootPath}" does not exist.`);
        process.exit(1);
    }
    
    let output = `Project Path: ${rootPath}\n\nSource Tree:\n`;
    const fileContents = {};

    function shouldIgnore(itemPath, item) {
        if (item.startsWith('.') && !ignoredItems.includes(item)) return true; // Ignore hidden files unless explicitly included
        const isDirectory = fs.statSync(itemPath).isDirectory();
        const extension = path.extname(item);
        
        if (ignoredItems.some(ignoredItem => 
            (isDirectory && ignoredItem === item) || 
            (!isDirectory && (ignoredItem === item || ignoredItem === extension))
        )) {
            return true;
        }

        // Check if file name contains any of the ignored words
        if (!isDirectory && ignoredWords.some(word => item.toLowerCase().includes(word.toLowerCase()))) {
            return true;
        }

        return false;
    }

    function buildTree(currentPath, prefix = '', isLast = true) {
        let items;
        try {
            items = fs.readdirSync(currentPath)
                .filter(item => !shouldIgnore(path.join(currentPath, item), item));
        } catch (error) {
            console.error(`Error reading directory ${currentPath}: ${error.message}`);
            return;
        }

        items.forEach((item, index) => {
            const itemPath = path.join(currentPath, item);
            let stats;
            try {
                stats = fs.statSync(itemPath);
            } catch (error) {
                console.error(`Error accessing ${itemPath}: ${error.message}`);
                return;
            }

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
    output += '\n';

    // Add file contents to the output
    for (const [filePath, content] of Object.entries(fileContents)) {
        const fullPath = path.join(rootPath, filePath);
        output += `${fullPath}:\n\n ${path.extname(filePath).slice(1)}\n${content} \n`;
    }

    try {
        fs.writeFileSync(outputPath, output);
        console.log(`File tree and contents have been written to ${outputPath}`);
    } catch (error) {
        console.error(`Error writing to ${outputPath}: ${error.message}`);
    }
}

// CLI argument parsing
const args = process.argv.slice(2);
const projectPath = args[0] || process.env.FOLDER_PATH || '.';
const additionalFolders = (args[1] || process.env.FOLDERIGNORE || '').split(',').filter(Boolean);
const ignoredWords = (args[2] || process.env.WORDIGNORE || '').split(',').filter(Boolean);
const defaultIgnoredItems = ['node_modules', '.git', 'dist', '.DS_Store', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac', '.aac', '.wma', '.m4a', '.flv', '.avi', '.mov', '.wmv', '.mkv', '.mpg', '.mpeg', '.3gp', '.json', '.lock'];

// Combine default ignored items with additional folders
const ignoredItems = [...defaultIgnoredItems, ...additionalFolders];

generateFileTree(projectPath, ignoredItems, ignoredWords);


// Run Example:
// ```

// node script.js /path/to/project ignored_folder1,ignored_folder2 ignoreWord1,ignoreWord2

// ```