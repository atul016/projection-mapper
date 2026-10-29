#!/bin/sh
# Double-click on a Mac. Same as start.sh, but Finder runs .command files in Terminal.
exec "$(dirname "$0")/start.sh"
