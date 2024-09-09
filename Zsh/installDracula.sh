#!/bin/bash

# Create a temporary directory
temp_dir=$(mktemp -d)

# Clone the repository into the temporary directory
git clone https://github.com/dracula/powerlevel10k.git "$temp_dir" && \
cd "$temp_dir" && \

# Copy configuration files
cp ./files/.p10k.zsh ~/.p10k.zsh && \

# Clean up: remove the temporary directory
cd && \
rm -rf "$temp_dir" && \

# Print success message
echo "Powerlevel10k has been installed and configured successfully!" && \
echo "Please restart your terminal or run 'source ~/.zshrc' to apply changes."