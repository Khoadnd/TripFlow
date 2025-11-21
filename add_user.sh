#!/bin/bash
# Script to add a new user to the database

# Ensure we are in the project root or can find the server dir
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

if [ -d "$SCRIPT_DIR/server" ]; then
    cd "$SCRIPT_DIR/server"
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    node add_user.js
else
    echo "Error: server directory not found."
    exit 1
fi
