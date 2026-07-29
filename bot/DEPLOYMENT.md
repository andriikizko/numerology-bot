# 🚀 Deployment Guide
Інструкції по розгортанню Numerology Bot на production

---

## Опції розгортання

### 1️⃣ Vercel (РЕКОМЕНДУЄТЬСЯ для Webhook)
Ідеально для serverless функцій LiqPay webhook

**Переваги:**
- ✅ Безкоштовно (до 1 млн запитів/місяця)
- ✅ Автоматичні оновлення
- ✅ CDN + HTTPS
- ✅ Легко інтегрується з Telegram

**Недоліки:**
- ❌ Холодні старти (перший запит медленніший)
- ❌ Виконання обмежено 10 сек

**Підходить для:** Server (webhook)

---

### 2️⃣ Railway.app (РЕКОМЕНДУЄТЬСЯ для Bot)
Добре для постійних процесів

**Переваги:**
- ✅ Дешево ($5/місяц за starter)
- ✅ 24/7 вкл
- ✅ Вбудоване DB
- ✅ Простий deploy

**Недоліки:**
- ⚠️ Виставляє публічний IP (можливо заблокує Telegram)

**Підходить для:** Bot

---

### 3️⃣ Heroku (DEPRECATED - більше FREE tier)
Не рекомендується, переходити на альтернативи

---

### 4️⃣ Render.com
Хороша альтернатива Heroku

**Переваги:**
- ✅ Безкоштовний tier (обмежено)
- ✅ Простий deploy з GitHub
- ✅ Docker support

**Підходить для:** Bot + Server

---

## 🏆 Мій рекомендований setup

### Production архітектура:

```
┌─────────────────────────────────────────────────────┐
│                   Telegram Users                    │
└────────────────────────┬────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
    ┌───▼────┐                       ┌────▼──────┐
    │  Bot   │                       │   Server   │
    │Railway │                       │  Vercel    │
    └───┬────┘                       └────┬───────┘
        │                                 │
        └────────────┬────────────────────┘
                     │
              ┌──────▼──────┐
              │  Firestore  │
              │  (Firebase) │
              └─────────────┘

LiqPay ──────────► Vercel Webhook ──────► Firestore
```

---

## 📦 Варіант 1: Bot на Railway + Server на Vercel

### A) Deploy Bot на Railway.app

#### Крок 1: Приготування
```bash
cd bot
git init
git add .
git commit -m "Initial commit"
git branch -M main
```

#### Крок 2: Посилання на GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/numerology-bot.git
git push -u origin main
```

#### Крок 3: Railway Deploy
1. Перейти на https://railway.app/
2. "Create New Project"
3. "Deploy from GitHub repo"
4. Обрати твій репозиторій
5. Додати змінні .env:
   - BOT_TOKEN
   - FIREBASE_PROJECT_ID
   - FIREBASE_PRIVATE_KEY
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_DATABASE_URL
   - LIQPAY_PUBLIC_KEY
   - LIQPAY_PRIVATE_KEY
6. Railway автоматично запустить `npm start`

#### Крок 4: Telegram webhook
Railway дасть публічний URL, наприклад: `https://your-app.railway.app`

Але Telegram Bot не потребує webhook за замовчуванням — він використовує polling.

---

### B) Deploy Server на Vercel

#### Крок 1: Переозначення структури для Vercel

Створи `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ]
}
```

Створи `src/webhook.js` (для Vercel serverless):

```javascript
import express from 'express';
import { initFirebase } from './services/firebase.js';
import { 
  verifyLiqPaySignature, 
  parseLiqPayResponse,
  extractOrderInfo 
} from './services/liqpay.js';
import {
  activateReport,
  updateUserHoroscope,
  savePayment
} from './services/firebase.js';

initFirebase();
const app = express();

app.use(express.json());

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, signature } = req.body;

    if (!verifyLiqPaySignature(data, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const response = parseLiqPayResponse(data);
    const orderInfo = extractOrderInfo(response.order_id);
    const { type, userId } = orderInfo;

    await savePayment(userId, {
      order_id: response.order_id,
      type,
      amount: parseFloat(response.amount),
      status: response.status,
      liqpay_id: response.liqpay_order_id
    });

    if (response.status === 'success') {
      if (type === 'report') {
        await activateReport(userId);
      } else if (type === 'horoscope') {
        await updateUserHoroscope(userId, 1);
      }
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
```

#### Крок 2: Deploy на Vercel

```bash
npm i -g vercel
vercel login
vercel deploy
```

Vercel дасть URL: `https://your-app.vercel.app/api/liqpay-webhook`

---

## 🔄 Гороскопи Розсилка

### Проблема: Vercel вимирує після 10 сек
Гороскопи розсилаються 7-10 сек — може не завершитися

### Рішення 1: CloudTasks (Google Cloud)
```javascript
import tasks from '@google-cloud/tasks';

const client = new tasks.CloudTasksClient();

async function scheduleHoroscope() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const queue = 'daily-horoscope';
  const location = 'europe-west1';
  
  const parent = client.queuePath(project, location, queue);
  
  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: 'https://your-app.vercel.app/api/send-horoscopes'
    }
  };
  
  await client.createTask({ parent, task });
}
```

### Рішення 2: Separate CronJob сервер
Розгорни окремий мініserver на **Railway** тільки для гороскопів

```javascript
// cron-server.js
import cron from 'node-cron';
import { sendDailyHoroscopes } from './services/horoscope.js';

cron.schedule('0 8 * * *', sendDailyHoroscopes, {
  timezone: 'Europe/Kyiv'
});
```

Deploy на Railway окремо, тільки цей процес.

---

## 📝 Туман: Как обновлять код

### Bot на Railway:
```bash
git commit -am "Fix: xyz"
git push origin main
# Railway автоматично перезапустить
```

### Server на Vercel:
```bash
git commit -am "Fix: webhook"
git push origin main
# Vercel автоматично перереднотрудит
```

---

## ✅ Перевірка після Deploy

```bash
# Bot здоровий?
curl https://your-bot.railway.app/health

# Server відповідає?
curl -X POST https://your-server.vercel.app/liqpay-webhook

# Гороскопи розсилаються?
# Чекай о 08:00 UTC+2
```

---

## 🔑 Environment Variables

### Railway (Bot)
```
BOT_TOKEN=...
FIREBASE_*=...
```

### Vercel (Server)
```
LIQPAY_*=...
FIREBASE_*=...
```

Ніколи не комітьте `.env` файл!

---

## 💰 Вартість Production

| Сервіс | Вартість | Причина |
|--------|----------|---------|
| Railway (Bot) | $5-10/місяц | 24/7 вкл |
| Vercel (Server) | FREE | <1M запитів/місяц |
| Firebase (Firestore) | FREE | <1GB сховищ |
| Telegram API | FREE | Telegram платить |
| **TOTAL** | **~$5-10/месяц** | Дешево для MVP |

---

**Status:** Готово до production deploy ✅
