```sh

    prompt --location="./" --ignore=folder1,folder2 --wordignore=word1,word2 --includeonly=js,ts --output=custom_output.txt

```




```sh

function prompt() {
    local location=""
    local excludeFolders=""
    local ignoreFileNames=""
    local includeExtOnly=""
    local ignorePatterns=""
    local output=""
    local maxDepth=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --location=*)
                location="${1#*=}"
                ;;
            --excludeFolders=*)
                excludeFolders="${1#*=}"
                ;;
            --ignoreFileNames=*)
                ignoreFileNames="${1#*=}"
                ;;
            --includeExtOnly=*)
                includeExtOnly="${1#*=}"
                ;;
            --ignorePatterns=*)
                ignorePatterns="${1#*=}"
                ;;
            --output=*)
                output="${1#*=}"
                ;;
            --maxDepth=*)
                maxDepth="${1#*=}"
                ;;
            *)
                echo "Unknown option: $1"
                return 1
                ;;
        esac
        shift
    done

    # Construct the command
    local cmd="node ~/Documents/Workspace/code2p/code2pCompress.js"

    # Add options to the command if they're set
    [[ -n "$location" ]] && cmd+=" --location=$(printf %q "$location")"
    [[ -n "$excludeFolders" ]] && cmd+=" --excludeFolders=$(printf %q "$excludeFolders")"
    [[ -n "$ignoreFileNames" ]] && cmd+=" --ignoreFileNames=$(printf %q "$ignoreFileNames")"
    [[ -n "$includeExtOnly" ]] && cmd+=" --includeExtOnly=$(printf %q "$includeExtOnly")"
    [[ -n "$ignorePatterns" ]] && cmd+=" --ignorePatterns=$(printf %q "$ignorePatterns")"
    [[ -n "$output" ]] && cmd+=" --output=$(printf %q "$output")"
    [[ -n "$maxDepth" ]] && cmd+=" --maxDepth=$(printf %q "$maxDepth")"

    # Execute the command
    echo "Executing: $cmd"  # Debug line
    eval "$cmd"
}

```






```sh

prompt \
  --location="./" \
  --excludeFolders="" \
  --ignoreFileNames="" \
  --includeExtOnly="" \
  --ignorePatterns="" \
  --output="output.txt" \
  --maxDepth=5

```