#!/bin/bash

# Create a directory for global git hooks if it doesn't already exist
mkdir -p ~/git_hooks

# Navigate to the git_hooks directory
cd ~/git_hooks

# Create a pre-push hook
cat << 'EOF' > pre-push
#!/bin/sh

# Get the name of the current branch
branch_name=$(git rev-parse --abbrev-ref HEAD)

# Check if the branch name contains '_workspace'
if echo "$branch_name" | grep -q "_workspace"; then
    echo "ERROR: You cannot push branches containing '_workspace' to remote."
    exit 1
fi

exit 0
EOF

# Make the pre-push script executable
chmod +x pre-push

# Configure git to use the global hooks path
git config --global core.hooksPath ~/git_hooks

echo "🚀 Global git hook setup completed."
