# 🔗 Admin Panel Integration Guide

Як integratы Admin Panel з Bot та Server

---

## 🏗️ Architecture

```
                    ┌─────────────┐
                    │  Telegram   │
                    │    Users    │
                    └──────┬──────┘
                           │
                ┌──────────┴──────────┐
                │                    │
            ┌───▼────┐          ┌────▼──────┐
            │   Bot  │          │  Browser  │
            │Railway │          │  (Admin)  │
            └───┬────┘          └────┬──────┘
                │                    │
                └────────┬───────────┘
                         │
                  ┌──────▼──────┐
                  │  Firestore  │
                  │  (Database) │
                  └─────────────┘
```

---

## 📋 Firebase Collections

Admin Panel читає з цих collections:

### `users/{tg_id}`
```javascript
{
  tg_id: "123456789",
  tg_name: "Ivan",
  birth_date: "1990-03-15",
  path_number: 7,
  num_name: "Філософ",
  created_at: Timestamp,
  report_purchased: true,
  report_purchased_at: Timestamp,
  horoscope_subscribed: true,
  horoscope_trial_until: Timestamp,
  horoscope_paid_until: Timestamp
}
```

### `users/{tg_id}/payments/{payment_id}`
```javascript
{
  order_id: "report_123456789_1234567890",
  type: "report",
  amount: 249,
  status: "success",
  liqpay_id: "123456789",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### `horoscopes_sent/{doc_id}`
```javascript
{
  tg_id: "123456789",
  num_name: "Філософ",
  path_number: 7,
  date: Timestamp,
  status: "sent"
}
```

### `support_chats/{chat_id}`
```javascript
{
  tg_id: "123456789",
  tg_name: "Ivan",
  num_name: "Філософ",
  message: "Користувач запитав про...",
  created_at: Timestamp,
  status: "new" | "resolved"
}
```

---

## 🔐 Firebase Security Rules

Admin Panel потребує читання з цих collections. Встановіть Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Дозвіл на читання користувачів (для admin)
    match /users/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Дозвіл на читання гороскопів
    match /horoscopes_sent/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    
    // Дозвіл на читання та оновлення підтримки
    match /support_chats/{document=**} {
      allow read: if request.auth != null;
      allow update: if request.resource.data.keys().hasOnly(['status']);
      allow create, delete: if false;
    }
  }
}
```

**Примітка:** Наступна фаза буде включати Firebase Auth для admin users.

---

## 🚀 Development Setup

### 1. Запуск Bot

```bash
cd ../bot
npm install
npm start
```

### 2. Запуск Server (для webhook)

```bash
cd ../bot
npm run start:server
```

### 3. Запуск Admin Panel

```bash
cd admin
npm install
npm run dev
```

Тепер у вас є:
- Bot: слухає Telegram
- Server: обробляє webhook'и
- Admin Panel: http://localhost:3001

---

## 📊 Дані, які видно в Admin Panel

### Dashboard
- ✅ Всього користувачів
- ✅ Платників розрахунку
- ✅ Користувачів гороскопу
- ✅ Загальний дохід
- ✅ Конверсія

### Users
- ✅ Список користувачів
- ✅ Número долі
- ✅ Дата народження
- ✅ Статус розрахунку
- ✅ Статус гороскопу

### Payments
- ✅ Список платежів
- ✅ Статус (успішний/невдалий)
- ✅ Сума
- ✅ LiqPay ID

### Support
- ✅ Список запитів
- ✅ Статус (новий/вирішений)
- ✅ Позначення як вирішено

### Analytics
- ✅ ARPU, LTV, CAC
- ✅ Конверсія, retention
- ✅ Рекомендації

---

## 🔄 Data Flow

### User Registration Flow

```
1. User joins Bot
   ↓
2. Bot saves to users/{tg_id}
   ↓
3. Admin Panel reads users/{tg_id}
   ↓
4. Dashboard shows new user count
```

### Payment Flow

```
1. User pays via LiqPay
   ↓
2. LiqPay sends webhook to Server
   ↓
3. Server validates signature
   ↓
4. Server saves to users/{tg_id}/payments/{payment_id}
   ↓
5. Server updates users/{tg_id} (report_purchased=true)
   ↓
6. Admin Panel reads payments collection
   ↓
7. Dashboard shows revenue update
```

### Support Flow

```
1. User clicks support in Bot
   ↓
2. Bot saves to support_chats/{chat_id}
   ↓
3. Admin Panel reads support_chats
   ↓
4. Admin updates status to "resolved"
   ↓
5. Bot could send message (future feature)
```

---

## 🐛 Troubleshooting

### Admin Panel не показує дані

**Перевір:**
1. Firebase API ключ в `.env` правильний?
2. Firestore collections існують?
3. Security Rules дозволяють читання?
4. Bot та Server записують дані?

### Невдалі платежі видно як "success"

**Причина:** Server не обновляє статус  
**Рішення:** Перевір LiqPay webhook налаштування

### Нові користувачи не видно в Admin Panel

**Причина:** Кеш браузера  
**Рішення:** Перезавантажте сторінку

---

## 🔧 Майбутні Удосконалення

### Phase 3.1 - Firebase Auth
```javascript
// Admin Panel з аутентифікацією
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const auth = getAuth()
await signInWithEmailAndPassword(auth, email, password)
```

### Phase 3.2 - Реал-тайм оновлення
```javascript
// Subscribe до змін Firestore
import { onSnapshot } from 'firebase/firestore'

onSnapshot(collection(db, 'users'), (snapshot) => {
  setUsers(snapshot.docs.map(doc => doc.data()))
})
```

### Phase 3.3 - Email повідомлення
```javascript
// Надіслати email користувачам
import { httpsCallable } from 'firebase/functions'

const sendEmail = httpsCallable(functions, 'sendEmail')
await sendEmail({ userId, template: 'welcome' })
```

---

## 📈 Monitoring

### Ключові метрики для моніторингу

1. **User Growth** — нові користувачи на день
2. **Conversion Rate** — % платників
3. **ARPU** — середня вартість на користувача
4. **Churn** — % користувачів що втекли
5. **Revenue** — MRR, дохід на день

### Де видити метрики

- **Dashboard** — швидкий огляд
- **Analytics** — детальна розбивка

---

## 🚀 Production Deployment

### Admin Panel на Vercel

```bash
# 1. Коміт
git commit -am "Add admin panel"
git push origin main

# 2. Vercel deploy
vercel deploy

# 3. Додай змінні в Vercel
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
```

### Bot на Railway

```bash
# Вже розгорнуто
# Додай админа для доступу до Analytics API
```

### Server на Vercel

```bash
# Вже розгорнуто
# Webhook готовий
```

---

## 📝 Чек-лист Setup

- [ ] Firebase Firestore collections створені
- [ ] Bot пише користувачів в Firestore
- [ ] Server пише платежи в Firestore
- [ ] Admin Panel читає з Firestore
- [ ] Security Rules налаштовані
- [ ] `.env` заповнений для Admin Panel
- [ ] Admin Panel локально працює (http://localhost:3001)
- [ ] Дані видно в Dashboard

---

**Admin Panel готова до використання!** 🚀

Запускай Bot + Server + Admin Panel і почни моніторити платформу.
