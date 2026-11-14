@echo off
chcp 65001 >nul
echo ============================================================================
echo   HE THONG DAT LICH BAO DUONG O TO TRUC TUYEN XYZ (RELEASE v1.0)
echo   Nhom thuc hien: Nguyen Minh Quang - Huynh Bao Huy - Tran Ngoc Ton Tri
echo ============================================================================
echo.

cd /d "%~dp0"

REM 1. Tu dong tao file backend\.env tu .env.example neu chua co
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy /Y "backend\.env.example" "backend\.env" >nul
        echo [OK] Da tu dong khoi tao file cau hinh backend\.env
    )
)

REM 2. Kiem tra Docker de khoi dong PostgreSQL (cong 5434) va FastAPI Backend (cong 8000)
where docker >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Dang khoi dong PostgreSQL 18 (Docker cong 5434) va Backend API (cong 8000)...
    pushd backend
    docker compose up -d
    where uv >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        start "XYZ Backend API - Port 8000" cmd /k "uv run uvicorn app.main:app --reload --port 8000"
    ) else (
        start "XYZ Backend API - Port 8000" cmd /k "python -m uvicorn app.main:app --reload --port 8000"
    )
    popd
    timeout /t 2 /nobreak >nul
) else (
    echo [THONG BAO] May chua bat Docker. Phan mem se chay o Che do Trai nghiem Truc tuyen
    echo voi day du du lieu dong nhat 100%% voi backend/db/seed.sql!
)

REM 3. Khoi dong Giao dien Nguoi dung Frontend (cong 3000 khop CORS Backend)
echo [2/2] Dang mo Giao dien Nguoi dung tai http://localhost:3000 ...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    python "frontend\run_frontend.py"
) else (
    start "" "frontend\index.html"
)
