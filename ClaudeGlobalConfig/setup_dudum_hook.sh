#!/bin/bash
# Configure Claude Code to play the "dudum" sound when a task completes

SETTINGS="$HOME/.claude/settings.json"
SOUND_SRC="$(cd "$(dirname "$0")" && pwd)/../Notifications/dudum.aiff"
SOUNDS_DIR="$HOME/Library/Sounds"

# Ensure the sound is installed
if [ ! -f "$SOUNDS_DIR/dudum.aiff" ]; then
    mkdir -p "$SOUNDS_DIR"
    if [ -f "$SOUND_SRC" ]; then
        cp "$SOUND_SRC" "$SOUNDS_DIR/dudum.aiff"
        echo "Installed dudum.aiff to $SOUNDS_DIR"
    else
        echo "Error: dudum.aiff not found at $SOUND_SRC"
        exit 1
    fi
fi

# Update the Stop hook in Claude Code settings to use dudum
python3 -c "
import json, os, sys

path = os.path.expanduser('~/.claude/settings.json')
with open(path) as f:
    settings = json.load(f)

settings['hooks'] = settings.get('hooks', {})
settings['hooks']['Stop'] = [
    {
        'hooks': [
            {
                'type': 'command',
                'command': 'afplay ~/Library/Sounds/dudum.aiff',
                'timeout': 10
            }
        ]
    }
]

with open(path, 'w') as f:
    json.dump(settings, f, indent=2)
    f.write('\n')

print('Done. Claude Code will now play dudum when a task completes.')
"
#  afplay ~/Library/Sounds/dudum.aiff