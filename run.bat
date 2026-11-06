@echo off
REM Runs the game. Extra options are passed on, e.g. run.bat --seed 7
cd /d "%~dp0"
java -cp out restaurantrush.Main %*
