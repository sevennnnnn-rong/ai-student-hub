@echo off
cd /d "%~dp0netease-service"
echo [netease-service] Starting NeteaseCloudMusicApi...
node server.js
