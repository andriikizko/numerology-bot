# 🚀 COMPLETE PROJECT SETUP
Інструкції по запуску повного Numerology Bot проекту

---

## 📦 Project Structure

```
numerology-bot/
├── bot/                          # Telegram Bot
│   ├── src/
│   │   ├── bot.js               # Bot на Telegraf
│   │   ├── server.js            # Express для webhook
│   │   └── services/
│   │       ├── firebase.js      # Firestore
│   │       ├── numerology.js    # Розрахунки
│   │       ├── horoscope.js     # Гороскопи
│   │       └── liqpay.js        # Платежи
│   ├── package.json
│   └── README.md
│
├── admin/                        # Admin Panel
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── App.jsx
│   ├── package.json
│   └── README.md
│
├── docs/                         # Документація
│   ├── 00_PROJECT_INDEX.md
│   ├── 01_FUNCTIONAL_SPECIFICATION.md
│   ├── ...
│   └── 07_TELEGRAM_EMOJI_SYSTEM.md
│
└── README.md
```

---

## 🔧 Prerequisites

### Системні вимоги
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git** для version control

### Зовнішні сервіси
- **Firebase Project** (Firestore + Auth)
- **Telegram Bot** (токен від @BotFather)
- **LiqPay API** (для платежів)

### Аккаунти
1. [Firebase Console](https://console.firebase.google.com/) — проект з Firestore
2. [Telegram BotFather](https://t.me/BotFather) — отримай токен
3. [LiqPay](https://www.liqpay.ua/) — API ключи
4. [Railway.app](https://railway.app/) — хостинг Bot
5. [Vercel.com](https://vercel.com/) — хостинг Admin Panel

---

## 📋 Step-by-Step Setup

### 1️⃣ Firebase Setup

#### 1.1 Створи Firebase Project

```bash
# 1. Перейди на Firebase Console
# https://console.firebase.google.com/

# 2. Create new project
# - Name: numerology-bot
# - Location: Europe

# 3. Enable Firestore Database
# - Start in production mode
# - Location: europe-west1

# 4. Create Web App
# - Copy Web API credentials
```

#### 1.2 Security Rules

В Firestore → Rules, встанови:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId=**} {
      allow read, write: if request.auth != null;
    }
    match /horoscopes_sent/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /support_chats/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2️⃣ Telegram Bot Setup

#### 2.1 Отримай Bot Token

```bash
# 1. Напиши @BotFather в Telegram
# 2. /newbot
# 3. Обери ім'я: numerology_bot
# 4. Отримаєш токен: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

### 3️⃣ LiqPay Setup

#### 3.1 Отримай API ключі

```bash
# 1. Реєстрація на https://www.liqpay.ua/
# 2. API Settings → Merchant
# 3. Copy:
#    - Public Key: pk_...
#    - Private Key: sk_...
```

### 4️⃣ Installation

#### 4.1 Клонуй репозиторій

```bash
git clone https://github.com/YOUR_USERNAME/numerology-bot.git
cd numerology-bot
```

#### 4.2 Bot Setup

```bash
cd bot

# Встанови залежності
npm install

# Налаштуй .env
cp .env.example .env

# Відредагуй .env з реальними ключами:
# BOT_TOKEN=123456:ABC-DEF...
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
# FIREBASE_CLIENT_EMAIL=firebase@your-project.iam.gserviceaccount.com
# LIQPAY_PUBLIC_KEY=pk_...
# LIQPAY_PRIVATE_KEY=sk_...
```

#### 4.3 Admin Panel Setup

```bash
cd ../admin

# Встанови залежності
npm install

# Налаштуй .env
cp .env.example .env

# Відредагуй .env з Firebase Web API ключами:
# VITE_FIREBASE_API_KEY=AIzaSyD...
# VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# VITE_FIREBASE_PROJECT_ID=your-project-id
# VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

---

## 🏃 Running Locally

### 1️⃣ Terminal 1 — Bot

```bash
cd bot
npm start
```

Вихід:
```
🤖 Bot запущений...
```

### 2️⃣ Terminal 2 — Server (webhook)

```bash
cd bot
npm run start:server
```

Вихід:
```
🌐 Server запущений на порту 3000
📨 Гороскопи розсилаються щодня о 08:00 (Europe/Kyiv)
```

### 3️⃣ Terminal 3 — Admin Panel

```bash
cd admin
npm run dev
```

Вихід:
```
  VITE v5.0.8  ready in 234 ms

  ➜  Local:   http://localhost:3001/
  ➜  press h to show help
```

---

## ✅ Test Locally

### 1️⃣ Test Bot

```bash
# В Telegram знайди @YOUR_BOT_NAME
# /start
# Введи дату народження: 15.03.1990
# Спробуй кнопки: 📅, 🔮, ✨, 👤
```

### 2️⃣ Test Payments (Sandbox)

LiqPay має sandbox для тестування:

```bash
# Використай тест-ключі в .env
LIQPAY_PUBLIC_KEY=pk_sandbox_...
LIQPAY_PRIVATE_KEY=sk_sandbox_...

# В Bot натисни "Персональний розрахунок"
# Буде переадресовано на LiqPay sandbox
# Заповни дані тестової карти:
# Card: 4111111111111111
# CVV: 123
# Дата: 12/25
```

### 3️⃣ Test Admin Panel

```bash
# Перейди на http://localhost:3001
# Вибери Dashboard

# Можеш бачити:
# ✅ Кількість користувачів
# ✅ Платежи
# ✅ Гороскопи
```

---

## 🚀 Production Deployment

### 1️⃣ Bot на Railway

```bash
# 1. Зареєструйся на https://railway.app/
# 2. Create New Project
# 3. Deploy from GitHub
# 4. Обери репо: numerology-bot
# 5. Додай environment variables з .env
# 6. Railway автоматично запустить npm start
```

Доступ:
```
Bot URL: https://your-app.railway.app
```

### 2️⃣ Server на Vercel

```bash
# 1. Зареєструйся на https://vercel.com/
# 2. Import Project
# 3. Select GitHub repo: numerology-bot
# 4. Configure:
#    - Root Directory: bot/
#    - Build Command: npm install
# 5. Add environment variables
# 6. Deploy

# 6. Налаштуй Webhook URL в LiqPay:
# https://your-app.vercel.app/liqpay-webhook
```

### 3️⃣ Admin Panel на Vercel

```bash
# 1. Vercel → Add new project
# 2. Select GitHub repo: numerology-bot
# 3. Configure:
#    - Root Directory: admin/
#    - Build Command: npm run build
#    - Output Directory: dist
# 4. Add environment variables
# 5. Deploy

# Доступ: https://your-admin.vercel.app
```

---

## 📊 Post-Launch Checklist

- [ ] Bot запущений та слухає Telegram
- [ ] Server обробляє webhook'и
- [ ] Admin Panel показує дані
- [ ] Платежи обробляються в LiqPay
- [ ] Гороскопи розсилаються о 08:00
- [ ] Support запити логуються
- [ ] Firebase Firestore містить дані користувачів
- [ ] Database backup налаштований
- [ ] Monitoring та alerting (на майбутнє)

---

## 🔍 Monitoring & Logs

### Bot Logs

```bash
# На Railway
# Settings → Logs
# або
tail -f /path/to/logs/bot.log
```

### Server Logs

```bash
# На Vercel
# Deployments → Logs
# або перевір LiqPay webhook status
```

### Admin Panel

```bash
# На Vercel
# Deployments → Logs
# або відкрий Browser DevTools (F12)
```

### Firebase

```bash
# Перейди на Firebase Console
# Firestore → Collections
# Переглянь дані користувачів та платежів
```

---

## 🐛 Troubleshooting

### Bot не запускається

```bash
# Перевір Bot Token
echo $BOT_TOKEN

# Перевір Firebase ключі
cat .env | grep FIREBASE

# Перевір залежності
npm list telegraf firebase-admin
```

### Webhook не отримує платежи

```bash
# 1. Перевір LiqPay ключі в .env
# 2. Перевір webhook URL на LiqPay site
# 3. Перевір Server logs на Vercel
# 4. Перевір LiqPay signature validation
```

### Admin Panel не показує дані

```bash
# 1. Перевір Firebase Web API ключ в .env
# 2. Перевір Firestore Rules
# 3. Перевір консоль браузера (F12)
# 4. Перевір Network tab для Firebase запитів
```

### Гороскопи не розсилаються

```bash
# 1. Перевір Server cron налаштування
# 2. Перевір Cloud Functions логи
# 3. Перевір timezone (Europe/Kyiv)
# 4. Перевір що користувачи мають horoscope_subscribed=true
```

---

## 📞 Support

### Для розробників
- Telegram: @YOUR_USERNAME
- Email: your@email.com
- Docs: `/mnt/user-data/outputs/`

### Для користувачів
- Telegram Bot: @numerology_bot
- Support Chat: DM в Bot

---

## 🎯 Next Steps (Phase 3)

1. **Firebase Auth** — Додай аутентифікацію для admin
2. **Email Notifications** — Надіслання email користувачам
3. **Analytics API** — REST API для графіків
4. **iOS/Android** — React Native мобільний додаток
5. **Telegram Mini App** — Інтеграція з Telegram Web App

---

## 📚 Documentation

Повна документація:

```
/outputs/
├── 00_PROJECT_INDEX.md
├── 01_FUNCTIONAL_SPECIFICATION.md
├── 02_TECHNICAL_SPECIFICATION.md
├── 03_UI_UX_SPECIFICATION.md
├── 04_TESTING_CHECKLIST.md
├── 05_ROADMAP_AND_TIMELINE.md
├── 06_ICON_STRATEGY.md
├── 07_TELEGRAM_EMOJI_SYSTEM.md
└── bot/
    ├── README.md
    └── DEPLOYMENT.md
```

---

## ✨ Congratulations!

Ти маєш повнофункціональну SaaS платформу:

✅ **Telegram Bot** — 24/7 користувачі  
✅ **Payment Processing** — LiqPay інтеграція  
✅ **Daily Horoscopes** — Автоматичні розсилки  
✅ **Admin Dashboard** — Моніторинг платформи  
✅ **Firestore Database** — Масштабуюча база даних  

**Вихідні:** ~$5-10/месяц 💰

---

**Ready to launch?** 🚀

```bash
cd bot && npm start
```

Успіхів! 🎉
