# Path to your Git repository
REPO_PATH=$1

# Switch to main branch and update
git -C "$REPO_PATH" checkout main
git -C "$REPO_PATH" pull

# Switch back to your working branch
git -C "$REPO_PATH" checkout -

# Get list of modified JavaScript and TypeScript files compared to main branch
MODIFIED_FILES=$(git -C "$REPO_PATH" diff --name-only main...HEAD | grep -E '\.(js|ts|jsx|tsx)$')

# Echo in green color
echo -e "\033[0;32m$MODIFIED_FILES\033[0m"

# Run ESLint on these files
for file in $MODIFIED_FILES; do
        npx eslint "$REPO_PATH/$file"
done
