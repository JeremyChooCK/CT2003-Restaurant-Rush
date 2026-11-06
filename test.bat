@echo off
REM Compiles the game and the rule checks, then runs the checks.
cd /d "%~dp0"
if exist out-test rmdir /s /q out-test
dir /s /b src\*.java test\*.java > sources.txt
javac --release 17 -encoding UTF-8 -d out-test @sources.txt
if errorlevel 1 (del sources.txt & exit /b 1)
del sources.txt
java -cp out-test restaurantrush.RuleChecks
