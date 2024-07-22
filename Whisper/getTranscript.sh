#!/bin/bash

# Check if Whisper CLI is installed
command -v whisper >/dev/null 2>&1 || { echo >&2 "whisper CLI is required but not installed. Aborting."; exit 1; }

# Check if a directory was provided
if [ $# -eq 0 ]; then
    echo "Please provide the directory containing video chunks as an argument."
    exit 1
fi

chunks_dir="$1"
base_name=$(basename "$chunks_dir")
base_name=${base_name%_chunks}

# Create output directory for transcripts
mkdir -p "${base_name}_transcripts"

# Process each chunk with Whisper, specifying English as the language
for chunk in "$chunks_dir"/*.mov; do
    chunk_name=$(basename "$chunk")
    output_name="${chunk_name%.*}"
    whisper "$chunk" --model base --language English --output_dir "${base_name}_transcripts"
done

# Combine all transcripts into a single file
find "${base_name}_transcripts" -name "*.txt" -exec cat {} + > "${base_name}_full_transcript.txt"

echo "Processing complete. Full transcript is available in ${base_name}_full_transcript.txt"