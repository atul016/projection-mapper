#!/bin/sh
# Serves this folder at http://localhost:8765 and opens it in your browser (Mac or Linux).
# Opening index.html directly works too, except for YouTube zones: YouTube refuses pages opened as files.
cd "$(dirname "$0")" || exit 1
PORT=8765
URL="http://localhost:$PORT/"
open_url() { if command -v open >/dev/null; then open "$1"; else xdg-open "$1"; fi; }

if curl -s -o /dev/null "$URL"; then   # already running
  open_url "$URL"
  exit 0
fi
if ! command -v python3 >/dev/null; then
  echo "Needs Python 3 to run a local server. Install it from https://www.python.org, or just open index.html."
  exit 1
fi
python3 -m http.server "$PORT" --bind 127.0.0.1 &
sleep 1
open_url "$URL"
echo "Projection Mapper is running at $URL - close this window (or press Ctrl+C) to stop it."
wait
