# 🔮 Numerology Bot
Telegram SaaS для персональних нумерологічних розрахунків та щоденних гороскопів

---

## 📋 Вимоги

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Firebase Project** (Firestore)
- **Telegram Bot Token** (BotFather @BotFather)
- **LiqPay Account** (для платежів)

---

## 🚀 Установка

### 1. Клонування та установка залежностей

```bash
cd bot
npm install
```

### 2. Конфігурація .env

Скопіюйте `.env.example` до `.env` та заповніть значення:

```bash
cp .env.example .env
```

Відредагуйте `.env`:

```env
BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
FIREBASE_PROJECT_ID=your-firebase-project
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase@your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
LIQPAY_PUBLIC_KEY=your_liqpay_public_key
LIQPAY_PRIVATE_KEY=your_liqpay_private_key
PORT=3000
NODE_ENV=production
```

### 3. Запуск Bot

```bash
npm start
```

Або в режимі розробки:

```bash
npm run dev
```

---

## 📱 Як користуватися Bot

### З Telegram

1. Запустіть bot: `@numerology_bot`
2. Введіть дату народження у форматі: `ДД.ММ.РРРР`
3. Bot розрахує ваше число долі
4. Оберіть потрібну функцію:
   - **📅 Сьогодні** — щоденний гороскоп
   - **🔮 Персональний розрахунок** — детальний аналіз (249 грн)
   - **✨ Спеціальні пропозиції** — передплата на гороскоп
   - **👤 Профіль** — ваші дані

---

## 💻 API Endpoints

### Webhook для LiqPay
```
POST /liqpay-webhook
```
Отримує платежі від LiqPay, активує відповідні функції

### Перевірка здоров'я
```
GET /health
```
Повертає статус сервера

### Статистика
```
GET /stats
```
Повертає кількість активних користувачів з гороскопом

---

## 📊 Структура кодом

```
bot/
├── src/
│   ├── bot.js              # Основний Telegram Bot
│   ├── server.js           # Express сервер для webhook'ів
│   └── services/
│       ├── firebase.js     # Operace с Firestore
│       ├── numerology.js   # Розрахунки чисел долі
│       ├── horoscope.js    # Генерація гороскопів
│       └── liqpay.js       # Інтеграція LiqPay
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔑 Ключові функції

### Нумерологія
- Розрахунок числа долі за датою народження
- 9 основних чисел + 3 Master числа (11, 22, 33)
- Унікальні имена та описи для кожного числа

### Гороскопи
- 10 різних гороскопів для кожного числа
- Щоденна ротація гороскопів
- Автоматична розсилка о 08:00 (Europe/Kyiv)

### Платежи
- LiqPay інтеграція
- Два типи покупок:
  - Персональний розрахунок (249 грн, разовий)
  - Передплата на гороскоп (30-50 грн/місяць)
- Автоматична активація після успішного платежу

### Підтримка
- CRM для запитів користувачів
- DM форма в Telegram

---

## 📧 Розсилка гороскопів

Гороскопи розсилаються автоматично **щодня о 08:00** (Europe/Kyiv)

Для цього використовується **node-cron** з розпорядженням:
```
0 8 * * * (щодня о 08:00)
```

---

## 🔧 Розробка

### Додавання нового гороскопу

Редагуйте `src/services/horoscope.js`:

```javascript
const HOROSCOPES = {
  7: [
    "Гороскоп 1...",
    "Гороскоп 2...",
    // ...
  ]
};
```

### Додавання нового числа

Редагуйте `src/services/numerology.js`:

```javascript
const NUM_NAMES = {
  // ...
  13: 'Нова назва'
};
```

---

## 🐛 DEBUG

Встановіть рівень логування:

```bash
LOG_LEVEL=debug npm start
```

---

## 📝 Ліцензія

Приватний проект

---

## 📞 Контакти

Для питань: @numerology_support

---

**Статус:** MVP Phase 1 ✅ (Bot Core Logic готова)
