@echo off
chcp 65001 >nul
echo ========================================================
echo       Telegram Web - Messenjerni ishga tushirish
echo ========================================================
echo.

:: 1. Node.js o'rnatilganligini tekshirish
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [XATOLIK] Noutbukingizda Node.js o'rnatilmagan!
    echo.
    echo Iltimos, quyidagi rasmiy saytdan Node.js (LTS versiya) ni yuklab oling:
    echo 👉 https://nodejs.org
    echo.
    echo O'rnatgandan so'ng, ushbu faylni (start.bat) qayta bosing.
    echo.
    pause
    exit /b
)

:: 2. Agar node_modules bo'lmasa, kutubxonalarni o'rnatish
if not exist "node_modules\" (
    echo Kutubxonalar o'rnatilmoqda (npm install)... Iltimos, kuting...
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [XATOLIK] npm install da muammo yuz berdi. Internet aloqasini tekshiring.
        pause
        exit /b
    )
)

echo.
echo ========================================================
echo Server ishga tushmoqda...
echo Brauzerda oching: http://localhost:3000
echo Chiqish uchun: Ctrl + C bosing
echo ========================================================
echo.

:: 3. Serverni ishga tushirish
call npm run dev
pause
