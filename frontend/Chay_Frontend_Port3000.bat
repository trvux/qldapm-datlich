@echo off
chcp 65001 >nul
echo ============================================================================
echo   XYZ AUTO SERVICE CENTER - FRONTEND SERVER (http://localhost:3000)
echo   Phu trach: Tran Ngoc Ton Tri (Viec #24, #26, #31, #32)
echo ============================================================================
cd /d "%~dp0"
python run_frontend.py
pause
