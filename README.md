# Telegram Web - Real-Time Messenger

Telegram uslubidagi zamonaviy, to'liq funksional va tezkor veb-messenjer. WebSocket orqali real vaqtda xabarlar, ovozli xabar yozish va tinglash, rasm va fayllar yuklash, guruhlar va lichkalar.

---

## 💻 Noutbukda / Kompyuterda Ishga Tushirish Qo'llanmasi

Agar siz loyihani yuklab olgan bo'lsangiz va u ishlamayotgan bo'lsa, quyidagi oddiy qadamlarni bajaring:

### ⚠️ Muhim eslatma:
To'g'ridan-to'g'ri `index.html` faylini sichqoncha bilan 2 marta bosib ochib bo'lmaydi! Chunki bu to'liq serverli ilova (Express backend + WebSocket + Vite frontend). Ilova ishlashi uchun server ishga tushishi kerak.

---

### 1-Qadam: Node.js o'rnatilganligini tekshirish
Noutbukingizda **Node.js** dasturi o'rnatilgan bo'lishi shart (18 yoki 20+ versiyasi tavsiya etiladi).
- Agar o'rnatilmagan bo'lsa: [https://nodejs.org](https://nodejs.org) saytiga kiring va **LTS** versiyasini yuklab olib, o'rnating.

---

### 2-Qadam: Eng oson yo'l (Windows uchun)
Loyiha papkasidagi **`start.bat`** faylini sichqoncha bilan 2 marta bosing!
U avtomatik ravishda:
1. Node.js bor-yo'qligini tekshiradi
2. Kerakli kutubxonalarni o'rnatadi (`npm install`)
3. Serverni ishga tushiradi (`npm run dev`)
4. Brauzeringizda **http://localhost:3000** manzilini ochsangiz bo'ldi!

---

### 3-Qadam: Terminal yoki buyruqlar satri (CMD / PowerShell / Mac Terminal) orqali:

1. Terminalni oching va loyiha papkasiga kiring:
   ```bash
   cd loyiha_papkasi
   ```

2. Barcha kutubxonalarni o'rnating:
   ```bash
   npm install
   ```

3. Serverni ishga tushiring:
   ```bash
   npm run dev
   ```

4. Brauzeringizni (Chrome, Edge, Safari yoki Firefox) ochib quyidagi manzilga kiring:
   👉 **http://localhost:3000**

---

## 🔑 Sinov uchun tayyor hisoblar (Demo akkauntlar):

| Foydalanuvchi nomi (Username) | Parol | Ism |
|---|---|---|
| `durov` | `123456` | Pavel Durov |
| `alisher_dev` | `123456` | Alisher Qodirov |
| `dildora_art` | `123456` | Dildora Karimova |

Yoki "Ro'yxatdan o'tish" (Register) tugmasi orqali yangi akkaunt ochishingiz yoki "Mehmon sifatida kirish" tugmasini bosishingiz mumkin.

---

## 🛠️ Port band bo'lsa (Port 3000 busy):
Agar 3000-port boshqa dastur tomonidan band bo'lsa:
- **Windows (CMD):**
  ```cmd
  set PORT=3001 && npm run dev
  ```
- **Mac / Linux:**
  ```bash
  PORT=3001 npm run dev
  ```
va brauzerda `http://localhost:3001` manziliga kiring.
