#!/bin/bash
cd /home/kavia/workspace/code-generation/resident-directory-management-system-303803-303822/resident_directory_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

