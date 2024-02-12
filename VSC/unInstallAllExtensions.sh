#!/bin/bash

# List all installed VS Code extensions
echo "Listing all installed extensions:"
code --list-extensions

# Loop through each extension and uninstall it
code --list-extensions | while read extension; do
    echo "Uninstalling extension: $extension"
    code --uninstall-extension $extension
done

echo "All extensions have been uninstalled."
