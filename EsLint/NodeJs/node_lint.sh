# Path to your Git repository
REPO_PATH=$1
IGNORE_FOLDERS=$2

# Switch to main branch and update
git -C "$REPO_PATH" checkout main
git -C "$REPO_PATH" pull

# Switch back to your working branch
git -C "$REPO_PATH" checkout -

# Get list of modified JavaScript and TypeScript files compared to main branch
MODIFIED_FILES=$(git -C "$REPO_PATH" diff --name-only main...HEAD | grep -E '\.(js|ts|jsx|tsx)$')

# Filter out files in ignored folders
FILTERED_FILES=()
for file in $MODIFIED_FILES; do
    if [[ ! $file =~ $IGNORE_FOLDERS ]]; then
        FILTERED_FILES+=("$file")
    fi
done

# Echo in green color
for file in "${FILTERED_FILES[@]}"; do
    echo -e "\033[0;32m$file\033[0m"
done

# Run ESLint on these files in one line
npx eslint $(printf "%s " "${FILTERED_FILES[@]/#/$REPO_PATH/}") --config "./.eslintrc.js"

# RUN AS ./react_lint.sh /path/to/your/repo 'node_modules|dist'
