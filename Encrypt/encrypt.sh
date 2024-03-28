#!/bin/bash

# The string to be encrypted
input_string="Hello, World!"

# Check if the encryption password is set as an environment variable
if [ -z "$ENCRYPTION_PASSWORD" ]; then
    echo "Error: The ENCRYPTION_PASSWORD environment variable is not set."
    exit 1
fi

# Function to encrypt the string
encrypt_string() {
    local input_string=$1

    # Check if the encryption password is set as an environment variable
    if [ -z "$ENCRYPTION_PASSWORD" ]; then
        echo "Error: The ENCRYPTION_PASSWORD environment variable is not set."
        return 1
    fi

    # Encrypt the string using AES-256 encryption
    encrypted_string=$(echo -n "$input_string" | openssl enc -aes-256-cbc -a -salt -pass env:ENCRYPTION_PASSWORD)

    echo "$encrypted_string"
}

# Encrypt the input string
encrypted_string=$(encrypt_string "$input_string")

echo "Original string: $input_string"
echo "Encrypted string: $encrypted_string"
