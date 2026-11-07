#!/bin/sh
# Compiles the game into ./out (needs JDK 17 or newer).
set -e
cd "$(dirname "$0")"
rm -rf out
find src -name "*.java" > sources.txt
javac --release 17 -encoding UTF-8 -d out @sources.txt
rm sources.txt
echo "Build complete. Run with ./run.sh"
