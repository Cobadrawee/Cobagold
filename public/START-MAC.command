#!/bin/bash
set -e
cd "$(dirname "$0")"

PORT=5173

echo "Starting local server at http://localhost:${PORT}/"
echo "Close this window to stop the server."

(sleep 1 && open "http://localhost:${PORT}/") >/dev/null 2>&1 &

python3 -m http.server "${PORT}"

