#!/bin/bash

# ==============================================================================
# Dynamic FFmpeg Screen Recording Script (macOS)
# ==============================================================================
# This script automatically detects the correct device indices for screen
# and audio capture before starting the FFmpeg recording process.
# ==============================================================================

# --- Configuration ---
# Adjust these names if your system lists them differently.
# You can find the exact names using: ffmpeg -f avfoundation -list_devices true -i ""
SCREEN_DEVICE_NAME="Capture screen 0"
AUDIO_DEVICE_NAME="MacBook Pro Microphone" # Set your preferred microphone name here

# Recording parameters (adjust as needed)
OUTPUT_FILENAME="screen_recording_$(date +%Y%m%d_%H%M%S).mp4" # Dynamic filename
FRAMERATE="30"
VIDEO_CODEC="libx264"
VIDEO_PRESET="ultrafast" # faster encoding, less CPU, larger file (options: veryfast, fast, medium, slow, veryslow)
VIDEO_CRF="23"           # **UPDATED** Quality (0=lossless, 51=worst, ~18=high quality, 23=default/good balance). Higher value = smaller file size.
PIXEL_FORMAT="yuv420p"   # Good compatibility
AUDIO_CODEC="aac"
AUDIO_BITRATE="128k"
# --- End Configuration ---

echo "--- Starting Dynamic Screen Recorder ---"
echo "Detecting devices..."

# Get the list of devices (redirect stderr to stdout for parsing)
# The '|| true' prevents the script from exiting if ffmpeg exits with an error just listing devices
DEVICE_LIST=$(ffmpeg -f avfoundation -list_devices true -i "" 2>&1 || true)

# Check if device list retrieval worked (basic check)
if ! echo "$DEVICE_LIST" | grep -q "AVFoundation"; then
    echo "Error: Could not retrieve device list from FFmpeg."
    exit 1
fi

# Find Screen Index using awk
# -F'[][]' sets delimiters to '[' and ']', so $4 becomes the index number within the second bracket pair (e.g., [4])
SCREEN_IDX=$(echo "$DEVICE_LIST" | awk -F'[][]' -v name="$SCREEN_DEVICE_NAME" '$0 ~ name {print $4; exit}')

# Find Audio Index using awk
AUDIO_IDX=$(echo "$DEVICE_LIST" | awk -F'[][]' -v name="$AUDIO_DEVICE_NAME" '$0 ~ name {print $4; exit}')

# --- Validation ---
# Check if Screen Index was found
if [ -z "$SCREEN_IDX" ]; then
    echo "Error: Could not find screen device named '$SCREEN_DEVICE_NAME'."
    echo "--------------------------------------------------"
    echo "Available video devices:"
    echo "$DEVICE_LIST" | grep 'AVFoundation video devices' -A 10 | grep '\[[0-9]*\]'
    echo "--------------------------------------------------"
    echo "Please check SCREEN_DEVICE_NAME in the script configuration."
    exit 1
else
    # Trim potential leading/trailing whitespace just in case
    SCREEN_IDX=$(echo "$SCREEN_IDX" | awk '{$1=$1};1')
    echo "Found Screen: Index [$SCREEN_IDX] ('$SCREEN_DEVICE_NAME')"
fi

# Check if Audio Index was found
RECORD_AUDIO=true
INPUT_SPEC=""
AUDIO_OPTS=""

if [ -z "$AUDIO_IDX" ]; then
    echo "Warning: Could not find audio device named '$AUDIO_DEVICE_NAME'."
    echo "--------------------------------------------------"
    echo "Available audio devices:"
    echo "$DEVICE_LIST" | grep 'AVFoundation audio devices' -A 10 | grep '\[[0-9]*\]'
    echo "--------------------------------------------------"
    echo "Recording video only. Check AUDIO_DEVICE_NAME in the script if you need audio."
    RECORD_AUDIO=false
    INPUT_SPEC="$SCREEN_IDX" # Input is just the screen index
    AUDIO_OPTS=""            # No audio options needed
else
    # Trim potential leading/trailing whitespace just in case
    AUDIO_IDX=$(echo "$AUDIO_IDX" | awk '{$1=$1};1')
    echo "Found Audio:  Index [$AUDIO_IDX] ('$AUDIO_DEVICE_NAME')"
    INPUT_SPEC="${SCREEN_IDX}:${AUDIO_IDX}" # Input is screen:audio
    AUDIO_OPTS="-c:a $AUDIO_CODEC -b:a $AUDIO_BITRATE" # Include audio options
fi

# --- Construct and Run FFmpeg Command ---
echo "--------------------------------------------------"
echo "Starting FFmpeg recording..."
echo "Input Spec: $INPUT_SPEC"
echo "Output file: $OUTPUT_FILENAME"
echo "Press 'q' or Ctrl+C in this terminal to stop recording."
echo "--------------------------------------------------"

# Basic check if indices look like numbers before running ffmpeg
if ! [[ "$SCREEN_IDX" =~ ^[0-9]+$ ]]; then
    echo "Error: Extracted screen index '$SCREEN_IDX' does not appear to be a valid number."
    exit 1
fi
if $RECORD_AUDIO && ! [[ "$AUDIO_IDX" =~ ^[0-9]+$ ]]; then
     echo "Error: Extracted audio index '$AUDIO_IDX' does not appear to be a valid number."
     exit 1
fi


ffmpeg -f avfoundation \
       -framerate "$FRAMERATE" \
       -i "$INPUT_SPEC" \
       -c:v "$VIDEO_CODEC" \
       -preset "$VIDEO_PRESET" \
       -crf "$VIDEO_CRF" \
       -pix_fmt "$PIXEL_FORMAT" \
       $AUDIO_OPTS \
       "$OUTPUT_FILENAME"

# Check FFmpeg exit status
FFMPEG_EXIT_CODE=$?
if [ $FFMPEG_EXIT_CODE -ne 0 ] && [ $FFMPEG_EXIT_CODE -ne 255 ]; then
    # Exit code 255 often means user interruption (Ctrl+C or 'q'), which is normal.
    echo "Warning: FFmpeg exited with status code $FFMPEG_EXIT_CODE."
fi

echo "--- Recording stopped. File saved as $OUTPUT_FILENAME ---"

exit 0
