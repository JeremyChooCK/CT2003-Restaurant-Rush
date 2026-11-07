#!/bin/sh
# Runs the game. Extra options are passed on, e.g. ./run.sh --seed 7
cd "$(dirname "$0")"
java -cp out restaurantrush.Main "$@"
