@echo off
REM Starts the NodeMart store at http://localhost:3000
cd /d "%~dp0"
if not exist node_modules call npm install
if not exist data\shop.db call npm run setup
echo.
echo   Store:  http://localhost:3000
echo   Admin:  http://localhost:3000/admin
echo.
call npm run dev
pause
