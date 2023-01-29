#!/bin/bash



echo "Please select an option:"
echo "1. Option 1"
echo "2. Option 2"
echo "3. Option 3"
echo "4. Quit"

while true; do
    read -p "Enter your selection: " selection

    case $selection in
        1)
            echo "You selected option 1."
            break
            ;;
        2)
            echo "You selected option 2."
            break
            ;;
        3)
            echo "You selected option 3."
            break
            ;;
        4)
            break
            ;;
        *)
            echo "Invalid selection."
            ;;
    esac
done
