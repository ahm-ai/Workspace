#!/bin/bash
# Configure Claude Code to play a selected sound when a task completes

set -e

SETTINGS="$HOME/.claude/settings.json"
NOTIFICATIONS_DIR="$(cd "$(dirname "$0")" && pwd)/../Notifications"
SOUNDS_DIR="$HOME/Library/Sounds"

if [ ! -d "$NOTIFICATIONS_DIR" ]; then
    echo "Error: Notifications directory not found at $NOTIFICATIONS_DIR"
    exit 1
fi

shopt -s nullglob
SOUNDS=("$NOTIFICATIONS_DIR"/*.aiff "$NOTIFICATIONS_DIR"/*.wav "$NOTIFICATIONS_DIR"/*.mp3 "$NOTIFICATIONS_DIR"/*.m4a)
shopt -u nullglob

if [ ${#SOUNDS[@]} -eq 0 ]; then
    echo "Error: no sound files found in $NOTIFICATIONS_DIR"
    exit 1
fi

SELECTED=""
if [ -n "$1" ]; then
    for s in "${SOUNDS[@]}"; do
        base="$(basename "$s")"
        if [ "$base" = "$1" ] || [ "${base%.*}" = "$1" ]; then
            SELECTED="$s"
            break
        fi
    done
    if [ -z "$SELECTED" ]; then
        echo "Error: sound '$1' not found in $NOTIFICATIONS_DIR"
        exit 1
    fi
else
    echo "Available notification sounds:"
    i=1
    for s in "${SOUNDS[@]}"; do
        echo "  $i) $(basename "$s")"
        i=$((i + 1))
    done
    printf "Select a sound [1-%d]: " "${#SOUNDS[@]}"
    read -r CHOICE
    if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt "${#SOUNDS[@]}" ]; then
        echo "Invalid selection."
        exit 1
    fi
    SELECTED="${SOUNDS[$((CHOICE - 1))]}"
fi

SOUND_FILE="$(basename "$SELECTED")"

mkdir -p "$SOUNDS_DIR"
cp "$SELECTED" "$SOUNDS_DIR/$SOUND_FILE"
echo "Installed $SOUND_FILE to $SOUNDS_DIR"

SOUND_FILE="$SOUND_FILE" python3 -c "
import json, os

path = os.path.expanduser('~/.claude/settings.json')
sound = os.environ['SOUND_FILE']

try:
    with open(path) as f:
        settings = json.load(f)
except FileNotFoundError:
    settings = {}

settings.setdefault('hooks', {})
settings['hooks']['Stop'] = [
    {
        'hooks': [
            {
                'type': 'command',
                'command': f'afplay ~/Library/Sounds/{sound}',
                'timeout': 10
            }
        ]
    }
]

os.makedirs(os.path.dirname(path), exist_ok=True)
with open(path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')

print(f'Done. Claude Code will now play {sound} when a task completes.')
"
