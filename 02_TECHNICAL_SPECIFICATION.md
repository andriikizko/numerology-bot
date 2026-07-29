# 🏗️ ТЕХНІЧНА СПЕЦИФІКАЦІЯ
## Numerology Telegram Bot Architecture

---

## 1. АРХІТЕКТУРА СИСТЕМИ

```
┌─────────────────────────────────────────────────────────────┐
│                     USER (Telegram App)                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    Telegram Bot API
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌──────▼──────┐    ┌─────▼─────┐
   │   Bot   │      │   Webhook   │    │   Cloud   │
   │ (Node   │      │  (LiqPay)   │    │ Scheduler │
   │  .js)   │      │   Express   │    │(Functions)│
   └────┬────┘      └──────┬──────┘    └─────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │      Firebase Cloud Functions      │
        │  ├─ Daily Horoscope (Pub/Sub)       │
        │  ├─ LiqPay Webhook Handler         │
        │  └─ Utility Functions              │
        └──────────────────┬──────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │      Firebase Firestore (DB)        │
        │  ├─ users/                          │
        │  ├─ payments/                       │
        │  ├─ support_chats/                  │
        │  └─ horoscopes_queue/               │
        └──────────────────┬──────────────────┘
        
        
        ┌──────────────────────────────────────┐
        │       Admin Panel (React Web)        │
        │  ├─ Users Tab                        │
        │  ├─ Payments Tab                     │
        │  ├─ Support Chat Tab                 │
        │  └─ Analytics Tab                    │
        └──────────────────┬──────────────────┘
                           │
                  Firestore Admin SDK
```

---

## 2. КОМПОНЕНТИ СИСТЕМИ

### 2.1 TELEGRAM BOT (Node.js + Telegraf)

#### Стек:
```
- Runtime: Node.js 18.x
- Framework: Telegraf v4.14.0
- Database Client: Firebase Admin SDK v12.0.0
- HTTP: Axios v1.6.0
- Deployment: Cloud Run (Google Cloud)
```

#### Файлова структура:
```
bot/
├── src/
│   ├── bot.js              (основний вхід)
│   ├── commands/
│   │   ├── start.js        (реєстрація)
│   │   ├── today.js        (щоденний гороскоп)
│   │   ├── calc.js         (розрахунок)
│   │   ├── offers.js       (пропозиції)
│   │   └── profile.js      (профіль)
│   ├── services/
│   │   ├── numerology.js   (логіка розрахунків)
│   │   ├── firebase.js     (CRUD операції)
│   │   ├── liqpay.js       (генерація платежів)
│   │   └── telegram.js     (помічні функції)
│   ├── middleware/
│   │   ├── auth.js         (перевірка користувача)
│   │   └── error.js        (обробка помилок)
│   └── config/
│       └── constants.js    (конфіги, тексти)
├── .env
├── package.json
└── Dockerfile
```

#### Основні функції:

**1. Handle /start**
```javascript
bot.start(async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);
  
  if (user) {
    // Вже зареєстрований
    return showMenu(ctx, user);
  }
  
  // Нова реєстрація
  ctx.session.registering = true;
  ctx.reply('Введіть дату народження (ДД.ММ.РРРР)');
});
```

**2. Регулювання дати**
```javascript
bot.on('text', async (ctx) => {
  if (ctx.session?.registering) {
    const date = parseDate(ctx.message.text);
    if (!date) {
      return ctx.reply('❌ Неправильний формат');
    }
    
    const pathNum = calculatePathNumber(date);
    const numName = getNumName(pathNum);
    
    await saveUser(ctx.from.id, {
      birth_date: date,
      path_number: pathNum,
      num_name: numName,
      horoscope_trial_until: addDays(new Date(), 7)
    });
    
    showMenu(ctx, { num_name: numName });
  }
});
```

**3. Callback buttons**
```javascript
bot.action('today', async (ctx) => {
  const user = await getUser(String(ctx.from.id));
  const horoscope = getDailyHoroscope(user.path_number);
  ctx.editMessageText(horoscope);
});

bot.action('calc', async (ctx) => {
  const payment = generateLiqPayLink(ctx.from.id, 'report', 249);
  ctx.reply('Оплатите 249 грн', Markup.inlineKeyboard([
    [Markup.button.url('💳 Оплатить', payment.url)]
  ]));
});
```

---

### 2.2 FIREBASE CLOUD FUNCTIONS

#### 2.2.1 Daily Horoscope Function (Pub/Sub Trigger)

```javascript
exports.sendDailyHoroscope = functions
  .pubsub.schedule('0 8 * * *')
  .timeZone('Europe/Kyiv')
  .onRun(async (context) => {
    // 1. Get all users with active horoscope
    const snapshot = await db
      .collection('users')
      .where('horoscope_subscribed', '==', true)
      .get();
    
    // 2. For each user
    for (const doc of snapshot.docs) {
      const user = doc.data();
      
      // 3. Check subscription status
      if (!isHoroscipeActive(user)) continue;
      
      // 4. Get horoscope
      const horoscope = getDailyHoroscope(user.path_number);
      
      // 5. Send via Telegram
      await bot.telegram.sendMessage(
        user.tg_id,
        formatHoroscope(user, horoscope)
      );
      
      // 6. Log
      await logHoroscopeSent(user.tg_id, new Date());
    }
  });
```

**Де працює:** Google Cloud Platform (Pub/Sub scheduler)  
**Запуск:** Кожний день о 08:00 за часом Київа  
**Таймаут:** 540 секунд (9 хвилин)  
**Retry:** 2 разу при помилці  

---

#### 2.2.2 LiqPay Webhook Handler (HTTP Trigger)

```javascript
exports.liqpayWebhook = functions
  .https.onRequest(async (req, res) => {
    try {
      const { data, signature } = req.body;
      
      // 1. Verify signature
      if (!verifyLiqPaySignature(data, signature)) {
        return res.status(403).json({ error: 'Invalid signature' });
      }
      
      // 2. Parse payment data
      const payment = JSON.parse(Buffer.from(data, 'base64'));
      
      // 3. Handle by type
      if (payment.action === 'pay') {
        await handlePayment(payment);
      } else if (payment.action === 'subscribe') {
        await handleSubscription(payment);
      }
      
      res.json({ status: 'ok' });
    } catch (error) {
      logError(error);
      res.status(500).json({ error: error.message });
    }
  });

async function handlePayment(payment) {
  if (payment.status !== 'success') return;
  
  const { order_id, amount, liqpay_order_id } = payment;
  const [type, userId] = order_id.split('_');
  
  if (type === 'report') {
    // Report purchase
    await db.collection('users').doc(userId).update({
      report_purchased: true,
      report_purchased_at: new Date(),
      horoscope_subscribed: true,
      horoscope_trial_until: addDays(new Date(), 30)
    });
    
    // Save payment record
    await db.collection('users').doc(userId).collection('payments').add({
      order_id,
      type: 'report',
      amount: 249,
      status: 'success',
      liqpay_id: liqpay_order_id,
      created_at: new Date()
    });
    
    // Send report to user
    const report = generatePersonalReport(...)
    await sendReportToUser(userId, report);
    
  } else if (type === 'horoscope') {
    // Horoscope purchase
    await db.collection('users').doc(userId).update({
      horoscope_paid_until: addMonths(new Date(), 1)
    });
    
    // Save payment record
    await db.collection('users').doc(userId).collection('payments').add({
      order_id,
      type: 'horoscope',
      amount: parseInt(payment.amount),
      status: 'success',
      liqpay_id: liqpay_order_id,
      created_at: new Date()
    });
  }
}
```

**Де працює:** Cloud Functions (HTTP endpoint)  
**URL:** `https://REGION-PROJECT_ID.cloudfunctions.net/liqpayWebhook`  
**Auth:** LiqPay webhook IP whitelist (налаштовується у LiqPay)  

---

### 2.3 ADMIN PANEL (React + Vite)

#### Стек:
```
- Framework: React 18
- Build: Vite
- State: React Hooks (useState, useEffect)
- DB Client: Firebase Firestore SDK
- Auth: Firebase Authentication (простий)
- Deploy: Vercel або Firebase Hosting
```

#### Структура:
```
admin/
├── src/
│   ├── App.jsx             (layout, tabs)
│   ├── components/
│   │   ├── UsersTab.jsx    (таблиця користувачів)
│   │   ├── PaymentsTab.jsx (таблиця платежів)
│   │   ├── SupportTab.jsx  (чати підтримки)
│   │   └── StatsCard.jsx   (статистика)
│   ├── services/
│   │   └── firebase.js     (CRUD операції)
│   └── styles/
│       └── index.css
├── index.html
├── vite.config.js
└── package.json
```

#### Основні вкладки:

**1. Users Tab**
```javascript
// Таблиця: ID | Ім'я | Число | Дата | Розрахунок | Гороскоп | Дата реєстрації
// Функції:
// - Пошук по ID
// - Фільтр по статусу
// - Експорт в CSV
```

**2. Payments Tab**
```javascript
// Таблиця: ID платежу | Користувач | Тип | Сума | Статус | Дата
// Функції:
// - Сортування
// - Фільтр по статусу (success/pending)
// - Аналітика (сума за день/тиждень/місяць)
```

**3. Support Tab**
```javascript
// Список запитів з повідомленнями
// Функції:
// - Копіювати ID користувача
// - Позначити як "replied"/"closed"
// - Швидкі відповіді (templates)
```

**4. Stats Card**
```javascript
// Показуємо:
// - Total Users
// - Paid Users (% конверсії)
// - Total Revenue (MRR)
// - Active Subscriptions
// - DAU/WAU/MAU (графіки)
```

---

## 3. DATABASE SCHEMA (Firebase Firestore)

### Collection: `users`
```
/users/{tg_id} (document)
  ├── tg_id: Integer
  ├── tg_name: String
  ├── birth_date: String (YYYY-MM-DD)
  ├── path_number: Integer (1-9, 11, 22, 33)
  ├── num_name: String
  ├── created_at: Timestamp
  ├── report_purchased: Boolean
  ├── report_purchased_at: Timestamp
  ├── horoscope_subscribed: Boolean
  ├── horoscope_trial_until: Timestamp
  ├── horoscope_paid_until: Timestamp (null якщо тільки trial)
  ├── horoscope_enabled: Boolean (soft delete)
  │
  └── payments/ (subcollection) {payment_id} (document)
      ├── order_id: String
      ├── type: String (report | horoscope)
      ├── amount: Number (UAH)
      ├── status: String (success | pending | failed)
      ├── liqpay_id: String (LiqPay transaction ID)
      ├── created_at: Timestamp
      └── updated_at: Timestamp
```

### Collection: `horoscopes_sent` (логування)
```
/horoscopes_sent/{doc_id}
  ├── tg_id: Integer
  ├── num_name: String
  ├── path_number: Integer
  ├── date: Timestamp
  ├── status: String (sent | failed)
  └── error_msg: String (якщо failed)
```

### Collection: `support_chats`
```
/support_chats/{chat_id}
  ├── tg_id: Integer
  ├── tg_name: String
  ├── num_name: String
  ├── message: String
  ├── created_at: Timestamp
  ├── status: String (new | replied | closed)
  ├── admin_reply: String
  └── replied_at: Timestamp
```

---

## 4. API ENDPOINTS

### Webhook Endpoints

#### POST /liqpay-webhook
**Вхід:**
```json
{
  "data": "base64_encoded_payment_data",
  "signature": "hmac_sha1_signature"
}
```

**Вихід:**
```json
{
  "status": "ok"
}
```

**Статус коди:**
- 200: OK
- 403: Invalid signature
- 400: Missing data
- 500: Server error

---

## 5. ІНТЕГРАЦІЇ

### 5.1 Telegram Bot API
```
Endpoint: https://api.telegram.org/bot{TOKEN}/
Methods:
  - sendMessage
  - editMessageText
  - sendDocument
  - answerCallbackQuery
```

### 5.2 LiqPay
```
Генерація платежу:
  POST https://www.liqpay.ua/api/3/action
  
Перевірка платежу:
  POST https://www.liqpay.ua/api/3/action
  
Webhook:
  POST https://YOUR_SERVER/liqpay-webhook
```

### 5.3 Firebase
```
- Firestore: https://firestore.googleapis.com/v1/
- Cloud Functions: https://cloudfunctions.googleapis.com/v1/
- Cloud Scheduler: https://cloudscheduler.googleapis.com/v1/
```

---

## 6. DEPLOYMENT

### 6.1 Telegram Bot (Cloud Run)

```bash
# Build Docker image
docker build -t gcr.io/PROJECT_ID/numerology-bot .

# Deploy
gcloud run deploy numerology-bot \
  --image gcr.io/PROJECT_ID/numerology-bot \
  --platform managed \
  --region europe-west1 \
  --set-env-vars BOT_TOKEN=xxx,LIQPAY_PUBLIC=xxx,LIQPAY_PRIVATE=xxx \
  --memory 512Mi \
  --cpu 1 \
  --timeout 540
```

### 6.2 Cloud Functions

```bash
# Deploy daily horoscope
firebase deploy --only functions:sendDailyHoroscope

# Deploy webhook
firebase deploy --only functions:liqpayWebhook
```

### 6.3 Admin Panel (Vercel)

```bash
# Deploy
vercel deploy --prod
```

---

## 7. ENVIRONMENT VARIABLES

```env
# Telegram
BOT_TOKEN=123:ABC_XYZ
SUPPORT_CHAT_ID=-1001234567890

# Firebase
FIREBASE_PROJECT_ID=project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase@project.iam.gserviceaccount.com

# LiqPay
LIQPAY_PUBLIC_KEY=your_public_key
LIQPAY_PRIVATE_KEY=your_private_key

# Server
PORT=8080
NODE_ENV=production
LOG_LEVEL=info
```

---

## 8. МОНІТОРИНГ І ЛОГУВАННЯ

### 8.1 Cloud Logging
```
- Bot errors: ERROR
- Payments: INFO
- Horoscope sending: INFO
- Webhooks: DEBUG
```

### 8.2 Метрики (Cloud Monitoring)
```
- Bot message count (per day)
- Horoscope send success rate
- LiqPay webhook latency
- Firestore read/write operations
```

### 8.3 Алерти
```
- Webhook failures > 10 за годину
- Horoscope function timeout
- Firestore quota exceeded
- Bot token invalid
```

---

## 9. DEVELOPMENT ENVIRONMENT

### Setup

```bash
# Clone repository
git clone https://github.com/user/numerology-bot.git
cd numerology-bot

# Install dependencies
npm install

# Setup Firebase
firebase init
firebase login

# Create .env
cp .env.example .env
# Заповнити BOT_TOKEN, LIQPAY ключі, тощо

# Run bot locally
npm run dev

# Run Cloud Function locally
firebase emulators:start
```

### Testing
```bash
npm test
npm run test:coverage
npm run lint
```

---

## 10. ВЕРСІОНУВАННЯ

### Database
- Firestore auto-backup (щодня)
- Snapshot перед major releases

### Code
- Git flow (main/develop/feature)
- Tags для releases (v1.0.0, тощо)
- Changelog.md

---

**Дата документу:** 15 січня 2024  
**Версія:** 1.0 MVP  
**Статус:** ✅ Готово до розробки
