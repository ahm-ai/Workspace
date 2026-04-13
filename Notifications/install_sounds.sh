#!/bin/bash
# Install custom .aiff sounds as macOS alert sounds
# Copies all .aiff files from this directory to ~/Library/Sounds/

SOUNDS_DIR="$HOME/Library/Sounds"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "$SOUNDS_DIR"

count=0
for file in "$SCRIPT_DIR"/*.aiff; do
    [ -f "$file" ] || continue
    name=$(basename "$file")
    cp "$file" "$SOUNDS_DIR/$name"
    echo "Installed: $name"
    ((count++))
done

if [ "$count" -eq 0 ]; then
    echo "No .aiff files found."
else
    echo "Done. $count sound(s) installed to $SOUNDS_DIR"
    echo "Go to System Settings > Sound > Alert sound to select them."
fi
