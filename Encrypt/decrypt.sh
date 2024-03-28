#!/bin/bash

# The string to be encrypted
encrypted_string="U2FsdGVkX1+rrUFvidif3qvtNd5htN56scAgBqIQ8mFgQFclbe/Bmibf/+KT6h9E"

# Check if the encryption password is set as an environment variable
if [ -z "$ENCRYPTION_PASSWORD" ]; then
    echo "Error: The ENCRYPTION_PASSWORD environment variable is not set."
    exit 1
fi

# Function to decrypt the encrypted string
decrypt_string() {
    local encrypted_string=$1

    # Check if the encryption password is set as an environment variable
    if [ -z "$ENCRYPTION_PASSWORD" ]; then
        echo "Error: The ENCRYPTION_PASSWORD environment variable is not set."
        return 1
    fi

    # Decrypt the encrypted string using AES-256 decryption
    decrypted_string=$(echo $encrypted_string | openssl enc -aes-256-cbc -d -a -salt -pass env:ENCRYPTION_PASSWORD)

    echo "$decrypted_string"
}

echo "Original string: $encrypted_string"
# Decrypt the encrypted string
decrypted_string=$(decrypt_string "$encrypted_string")

echo "Decrypted string: $decrypted_string"
