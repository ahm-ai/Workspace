const fs = require('fs');
const path = require('path');
const os = require('os');

function compressContent(content, fileExtension) {
    // Remove comments based on file type
    switch (fileExtension) {
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
        case '.css':
        case '.go':
            content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1'); // Remove multi-line and single-line comments
            break;
        case '.html':
            content = content.replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
            break;
        case '.py':
            content = content.replace(/#.*$/gm, ''); // Remove Python comments
            content = content.replace(/'''[\s\S]*?'''|"""[\s\S]*?"""/g, ''); // Remove Python docstrings
            break;
        // Add more cases for other file types as needed
    }

    // Trim whitespace and remove empty lines
    content = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join(' ');

    // Remove extra spaces
    content = content.replace(/\s+/g, ' ');

    return content;
}

function generateFileTree(rootPath, ignoredItems = [], ignoredPatterns = [], includeOnly = [], outputPath = 'file_tree.txt') {
    rootPath = rootPath.replace(/^~(?=$|\/|\\)/, os.homedir());
    if (!fs.existsSync(rootPath)) {
        console.error(`Error: The directory "${rootPath}" does not exist.`);
        process.exit(1);
    }
    
    let output = `Project Path: ${rootPath}\n\n`;
    output += `Source Tree:\n\n\`\`\`\n`;
    const fileContents = {};

    function shouldInclude(itemPath, item) {
        const isDirectory = fs.statSync(itemPath).isDirectory();
        const extension = path.extname(item);
        const baseName = path.basename(item, extension);
        
        // Check for ignored patterns (applied to both files and folders)
        if (ignoredPatterns.some(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(item) || regex.test(baseName) || regex.test(extension);
        })) {
            return false;
        }

        // For directories, we only need to check ignored patterns and items
        if (isDirectory) {
            return !ignoredItems.includes(item);
        }
        
        // If includeOnly is not empty, only include files with specified extensions
        if (includeOnly.length > 0) {
            return includeOnly.includes(extension);
        }

        // Default behavior: include all files not explicitly ignored
        if (item.startsWith('.') || ignoredItems.includes(item)) return false;

        if (ignoredItems.some(pattern => new RegExp(pattern).test(itemPath))) return false;

        return true;
    }

    function buildTree(currentPath, prefix = '', isLast = true) {
        let items;
        try {
            items = fs.readdirSync(currentPath)
                .filter(item => shouldInclude(path.join(currentPath, item), item));
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
                    let content = fs.readFileSync(itemPath, 'utf8');
                    const fileExtension = path.extname(itemPath);
                    content = compressContent(content, fileExtension);
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

    try {
        fs.writeFileSync(outputPath, output);
        console.log(`File tree and compressed contents have been written to ${outputPath}`);
    } catch (error) {
        console.error(`Error writing to ${outputPath}: ${error.message}`);
    }
}

// Updated CLI argument parsing
const args = process.argv.slice(2);
let projectPath = '.';
let excludeFolders = [];
let ignorePatterns = [];
let includeExtOnly = [];
let outputFileName = 'file_tree.txt';

args.forEach(arg => {
    const [key, value] = arg.split('=');
    switch (key) {
        case '--location':
            projectPath = value;
            break;
        case '--excludeFolders':
            excludeFolders = value.split(',').filter(Boolean);
            break;
        case '--ignorePatterns':
            ignorePatterns = value.split(',').filter(Boolean);
            break;
        case '--includeExtOnly':
            includeExtOnly = value.split(',').filter(Boolean).map(ext => ext.startsWith('.') ? ext : `.${ext}`);
            break;
        case '--output':
            outputFileName = value;
            break;
    }
});

// Use environment variables as fallback
projectPath = projectPath || process.env.FOLDER_PATH || '.';
excludeFolders = excludeFolders.length ? excludeFolders : (process.env.FOLDERIGNORE || '').split(',').filter(Boolean);
ignorePatterns = ignorePatterns.length ? ignorePatterns : (process.env.PATTERNIGNORE || '').split(',').filter(Boolean);
includeExtOnly = includeExtOnly.length ? includeExtOnly : (process.env.INCLUDEONLY || '').split(',').filter(Boolean).map(ext => ext.startsWith('.') ? ext : `.${ext}`);
outputFileName = outputFileName || process.env.OUTPUT_FILE || 'file_tree.txt';

const defaultIgnoredItems = ['node_modules', '.git', 'dist', '.DS_Store', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.mp4', '.webm', '.ogg', '.mp3', '.wav', '.flac', '.aac', '.wma', '.m4a', '.flv', '.avi', '.mov', '.wmv', '.mkv', '.mpg', '.mpeg', '.3gp', '.json', '.lock'];

// Combine default ignored items with additional folders
const ignoredItems = [...defaultIgnoredItems, ...excludeFolders];

generateFileTree(projectPath, ignoredItems, ignorePatterns, includeExtOnly, outputFileName);