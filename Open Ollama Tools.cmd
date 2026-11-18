@echo off
setlocal DisableDelayedExpansion
if defined OLLAMA_TOOLS_DIR goto configured
set "companion=%~dp0..\..\Ollama\Start Ollama Tools.cmd"
if exist "%companion%" goto launch
set "companion=%~dp0..\Ollama\Start Ollama Tools.cmd"
goto check
:configured
set "companion=%OLLAMA_TOOLS_DIR%\Start Ollama Tools.cmd"
:check
if exist "%companion%" goto launch
echo Ollama Tools could not be found. Set OLLAMA_TOOLS_DIR to the folder containing Start Ollama Tools.cmd. 1>&2
exit /b 1
:launch
"%companion%" "--source=repo:GAME"
