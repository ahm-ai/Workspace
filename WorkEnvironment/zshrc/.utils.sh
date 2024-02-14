combineList() {
    # Check if at least two arguments are given (at least one input file and the output file)
    if [ "$#" -lt 2 ]; then
        echo "Usage: $0 <file1> <file2> ... <output_markdown_file>"
        exit 1
    fi

    # The last argument is the output file
    output_file="${@: -1}"

    # Create or empty the output file if it already exists
    # >"$output_file"

    # Loop through all arguments except the last one
    for file in "${@:1:$#-1}"; do
        # Check if the file is a regular file
        if [ -f "$file" ]; then
            echo "Adding $file to $output_file"
            # Optionally, add the filename as a Markdown header
            echo "## $(basename "$file")" >>"$output_file"
            # Append the content of the file to the output file
            cat "$file" >>"$output_file"
            # Add a newline to separate contents
            echo -e "\n" >>"$output_file"
        else
            echo "Warning: $file is not a valid file. Skipping."
        fi
    done

    echo "Combination complete. Output: $output_file"
}

combineAllFromFolder() {
    # Check if exactly two arguments are given
    if [ "$#" -ne 2 ]; then
        echo "Usage: $0 <directory_of_files> <output_markdown_file>"
        exit 1
    fi

    input_directory=$1
    output_file=$2

    # Check if the input directory exists
    if [ ! -d "$input_directory" ]; then
        echo "The specified directory does not exist."
        exit 1
    fi

    # Create or empty the output file if it already exists
    # >"$output_file"

    # Loop through each file in the directory
    for file in "$input_directory"/*; do
        # Check if the file is a regular file
        if [ -f "$file" ]; then
            echo "Adding $(basename "$file") to $output_file"
            # Optionally, add the filename as a Markdown header
            echo "## $(basename "$file")" >>"$output_file"
            # Append the content of the file to the output file
            cat "$file" >>"$output_file"
            # Add a newline to separate contents
            echo -e "\n" >>"$output_file"
        fi
    done

    echo "Combination complete. Output: $output_file"

}
