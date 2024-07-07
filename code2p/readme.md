```sh

    prompt --location="./" --ignore=folder1,folder2 --wordignore=word1,word2 --includeonly=js,ts --output=custom_output.txt

```


```sh

function prompt() {

    local location=""
    local ignore=""
    local wordignore=""
    local includeonly=""
    local output=""

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --location=*)
                location="${1#*=}"
                ;;
            --ignore=*)
                ignore="${1#*=}"
                ;;
            --wordignore=*)
                wordignore="${1#*=}"
                ;;
            --includeonly=*)
                includeonly="${1#*=}"
                ;;
            --output=*)
                output="${1#*=}"
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
    [[ -n "$location" ]] && cmd+=" location=$location"
    [[ -n "$ignore" ]] && cmd+=" ignore=$ignore"
    [[ -n "$wordignore" ]] && cmd+=" wordignore=$wordignore"
    [[ -n "$includeonly" ]] && cmd+=" includeonly=$includeonly"
    [[ -n "$output" ]] && cmd+=" output=$output"

    # Execute the command
    eval "$cmd"
}


```