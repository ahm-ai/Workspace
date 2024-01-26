# Path to your Git repository
REPO_PATH=~/Downloads/ts_node_app/
IGNORE_FOLDERS=$2

# Save uncommitted changes to a stash
git -C "$REPO_PATH" stash push -m "temp-stash-for-lint-script"

# Switch to main branch and update
git -C "$REPO_PATH" checkout main
git -C "$REPO_PATH" pull

# Switch back to your working branch
git -C "$REPO_PATH" checkout -

# Reapply stashed changes
git -C "$REPO_PATH" stash pop

# Get list of modified JavaScript and TypeScript files compared to main branch
MODIFIED_FILES=$(git -C "$REPO_PATH" diff --name-only main...HEAD | grep -E '\.(js|ts|jsx|tsx)$')

# Echo in green color
for file in "${MODIFIED_FILES[@]}"; do
    echo -e "\033[0;32m$file\033[0m"
done


# Filter out files in ignored folders
FILTERED_FILES=()
for file in $MODIFIED_FILES; do
    if [[ ! $file =~ $IGNORE_FOLDERS ]]; then
        FILTERED_FILES+=("$file")
    fi
done


# Run ESLint on these files
for file in "${FILTERED_FILES[@]}"; do
    npx eslint "$REPO_PATH/$file" --config "./.eslintrc.js" --resolve-plugins-relative-to . --parser-options="{\"project\": \"$REPO_PATH/tsconfig.json\"}"

done

# RUN AS ./react_lint.sh /path/to/your/repo 'node_modules|dist'
