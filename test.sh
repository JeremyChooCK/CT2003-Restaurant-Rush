#!/bin/sh
# Compiles the game and the rule checks, then runs the checks.
set -e
cd "$(dirname "$0")"
rm -rf out-test
find src test -name "*.java" > sources.txt
javac --release 17 -encoding UTF-8 -d out-test @sources.txt
rm sources.txt
java -cp out-test restaurantrush.RuleChecks
