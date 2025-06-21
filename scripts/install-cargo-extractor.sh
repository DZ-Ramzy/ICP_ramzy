#!/bin/bash

# Check if candid-extractor is installed
if ! command -v candid-extractor &> /dev/null; then
    echo "candid-extractor not found. Installing..."
    cargo install candid-extractor
    
    # Verify installation was successful
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install candid-extractor"
        exit 1
    fi
    echo "candid-extractor installed successfully"
else
    echo "candid-extractor is already installed"
fi