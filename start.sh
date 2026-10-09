#!/usr/bin/env bash
echo "========================================================"
echo "      Telegram Web - Messenjerni ishga tushirish"
echo "========================================================"
echo ""

if ! command -v node &> /dev/null
then
    echo "[XATOLIK] Noutbukingizda Node.js o'rnatilmagan!"
    echo "Iltimos, https://nodejs.org saytidan Node.js ni o'rnating."
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Kutubxonalar o'rnatilmoqda (npm install)..."
    npm install
fi

echo ""
echo "========================================================"
echo "Server ishga tushmoqda..."
echo "Brauzerda oching: http://localhost:3000"
echo "Chiqish uchun: Ctrl + C bosing"
echo "========================================================"
echo ""

npm run dev
