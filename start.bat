@echo off
chcp 65001 >nul
title 气象台Hub

echo ========================================
echo    气象台Hub - 启动中...
echo ========================================
echo.

:: 获取脚本所在目录
set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: 检查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)

:: 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

:: 安装后端依赖（如果需要）
if not exist ".venv" (
    echo [1/3] 创建 Python 虚拟环境...
    python -m venv .venv
    call .venv\Scripts\activate.bat
    pip install -r backend\requirements.txt -q
) else (
    echo [1/3] Python 虚拟环境已存在
)

:: 安装同步服务依赖（如果需要）
if not exist "sync-server\node_modules" (
    echo [2/3] 安装同步服务依赖...
    cd sync-server
    npm install
    cd ..
) else (
    echo [2/3] 同步服务依赖已安装
)

echo [3/3] 启动服务...
echo.

:: 启动后端
echo [启动] 后端服务 (端口 8000)...
start "AI-Backend" cmd /k "cd /d %PROJECT_DIR%backend && ..\.venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

:: 启动同步服务
echo [启动] 同步服务 (端口 3001)...
start "AI-Sync" cmd /k "cd /d %PROJECT_DIR%sync-server && node server.js"

:: 等待服务启动
timeout /t 3 /nobreak >nul

:: 启动桌面应用（如果已构建）
if exist "src-tauri\target\release\ai-student-hub.exe" (
    echo [启动] 桌面应用...
    start "" "src-tauri\target\release\ai-student-hub.exe"
) else if exist "src-tauri\target\debug\ai-student-hub.exe" (
    echo [启动] 桌面应用...
    start "" "src-tauri\target\debug\ai-student-hub.exe"
) else (
    echo [提示] 桌面应用未构建，使用浏览器访问 http://localhost:3000
    start http://localhost:3000
)

echo.
echo ┌─────────────────────────────────────┐
echo │  服务地址:                          │
echo │  后端 API: http://localhost:8000    │
echo │  同步服务: http://localhost:3001    │
echo │  桌面应用: 气象台Hub                │
echo └─────────────────────────────────────┘
echo.
echo 关闭此窗口不会停止服务
echo 需手动关闭各服务窗口或使用任务管理器
echo.
pause
