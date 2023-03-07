#!/bin/sh


# Get list of modified JavaScript files using git status command
js_files=$(git status --porcelain | grep "^ M" | grep ".js$" | cut -c4-)

# Loop through each modified JavaScript file and apply the changes
for file in $js_files; do
  # Check if file exists
  if [ -e "$file" ]; then
    # Check if first line contains "coverage"
    if head -n 1 "$file" | grep -q "coverage"; then
      # Replace the first line with coverage percentage
      coverage_percent=75 # Replace with actual coverage percentage
      sed -i "1s/.*/Coverage: $coverage_percent%/" "$file"
      echo "Modified $file"
    else
      # Add a new line with coverage percentage
      coverage_percent=75 # Replace with actual coverage percentage
      sed -i "1iCoverage: $coverage_percent%" "$file"
      echo "Modified $file"
    fi
  else
    echo "File not found: $file"
  fi
done