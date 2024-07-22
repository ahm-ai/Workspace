#!/bin/bash

# Check if ffmpeg is installed
command -v ffmpeg >/dev/null 2>&1 || { echo >&2 "ffmpeg is required but not installed. Aborting."; exit 1; }

# Check if a file was provided
if [ $# -eq 0 ]; then
    echo "Please provide a .mov file as an argument."
    exit 1
fi

input_file="$1"
base_name="${input_file%.*}"
chunk_duration="300" # 5 minutes in seconds

# Create output directory
mkdir -p "${base_name}_chunks"

# Split the video into chunks
ffmpeg -i "$input_file" -c copy -map 0 -segment_time $chunk_duration -f segment -reset_timestamps 1 "${base_name}_chunks/chunk_%03d.mov"

echo "Video splitting complete. Chunks are available in ${base_name}_chunks directory."

