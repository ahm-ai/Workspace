# Path to your Git repository
REPO_PATH=~/Documents/my-next-project
IGNORE_FOLDERS=$2
FILES_FOLDER="files"

# Save uncommitted changes to a stash
# git -C "$REPO_PATH" stash push -m "temp-stash-for-lint-script"

# Switch to main branch and update
git -C "$REPO_PATH" checkout main
git -C "$REPO_PATH" pull

# Switch back to your working branch
git -C "$REPO_PATH" checkout -

# Reapply stashed changes
# git -C "$REPO_PATH" stash pop

# Get list of modified JavaScript and TypeScript files compared to main branch
MODIFIED_FILES=$(git -C "$REPO_PATH" diff --name-only main...HEAD | grep -E '\.(js|ts|jsx|tsx)$')

# Filter out files in ignored folders
FILTERED_FILES=()
for file in $MODIFIED_FILES; do
    if [[ ! $file =~ $IGNORE_FOLDERS ]]; then
        FILTERED_FILES+=("$file")
    fi
done

# Create files folder and copy modified files
for file in "${FILTERED_FILES[@]}"; do
    # Extract directory path from the file path
    dir_path=$(dirname "$FILES_FOLDER/$file")

    # Create directory if it doesn't exist
    mkdir -p "$dir_path"

    # Copy file to the files folder, maintaining directory structure
    cp "$REPO_PATH/$file" "$FILES_FOLDER/$file"
done

# Run ESLint on these files and move them back
for file in "${FILTERED_FILES[@]}"; do
    npx eslint --fix "$FILES_FOLDER/$file" --config "./.eslintrc.json"
    # Move the linted file back to its original location
    mv "$FILES_FOLDER/$file" "$REPO_PATH/$file"
done

# RUN AS ./react_lint.sh /path/to/your/repo 'node_modules|dist'
