#!/bin/bash

echo "Signage Frontend Setup & Run"

echo "changing directory"
# Go to the frontend directory
#cd src/web_frontend || exit

if [ ! -d "node_modules" ] || [ package-lock.json -nt node_modules ]; then
  echo "Installing/updating packages..."
  npm ci
else
  echo "Dependencies up to date."
fi

npm run dev
