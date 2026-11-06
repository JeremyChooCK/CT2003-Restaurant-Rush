@echo off
REM Compiles the game into .\out (needs JDK 17 or newer).
cd /d "%~dp0"
if exist out rmdir /s /q out
dir /s /b src\*.java > sources.txt
javac --release 17 -encoding UTF-8 -d out @sources.txt
if errorlevel 1 (del sources.txt & exit /b 1)
del sources.txt
echo Build complete. Run with run.bat
