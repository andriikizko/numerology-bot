# 🔮 Numerology Bot - Admin Panel
Administrativa платформа для управління користувачами, платежами та аналітикою Numerology Bot

---

## 📋 Вимоги

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Firebase Project** з Firestore
- **Web API ключ** від Firebase

---

## 🚀 Установка

### 1. Клонування та установка залежностей

```bash
cd admin
npm install
```

### 2. Конфігурація .env

Скопіюйте `.env.example` до `.env`:

```bash
cp .env.example .env
```

Знайдіть ваші Firebase ключі в **Firebase Console** → Project Settings:

```env
VITE_FIREBASE_API_KEY=AIzaSyD...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

### 3. Запуск розвитку

```bash
npm run dev
```

Admin Panel буде доступний на http://localhost:3001

### 4. Build для production

```bash
npm run build
```

Результат буде в папці `dist/`

---

## 📊 Функції

### 📈 Dashboard
- **Статистика користувачів** — всього, платників, з гороскопом
- **Фінансові метрики** — дохід, конверсія, середня вартість
- **Щоденні показники** — нові користувачі, платежі, дохід
- **Графіки конверсії** — візуалізація показників

### 👥 Користувачи
- Таблиця всіх користувачів
- Фільтрація (куплено розрахунок, гороскоп)
- Пошук по імені чи ID
- Статус підписок та платежів
- Дата реєстрації

### 💳 Платежи
- Таблиця всіх платежів
- Фільтрація (успішні, невдалі)
- Сума платежу
- LiqPay ID та статус
- Дата платежу

### 💬 Підтримка (CRM)
- Список всіх запитів користувачів
- Фільтрація (нові, вирішені)
- Перегляд повного запиту
- Позначення як вирішеного
- DM інтеграція з Telegram

### 📈 Аналітика
- **Метрики продукту** — користувачи розрахунку, гороскопу
- **Фінансові показники** — ARPU, LTV, CAC, дохід
- **Конверсія** — % платників, retention
- **Рекомендації** — автоматичні поради по оптимізації

---

## 🗂️ Структура проекту

```
admin/
├── src/
│   ├── components/
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Users.jsx
│   │   ├── Payments.jsx
│   │   ├── Support.jsx
│   │   └── Analytics.jsx
│   ├── services/
│   │   ├── firebaseConfig.js
│   │   └── adminService.js
│   ├── styles/
│   │   ├── global.css
│   │   ├── layout.css
│   │   └── pages.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── .env.example
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

---

## 🔗 Integration

### Firebase Firestore
Admin Panel читає дані з Firestore collection:

```
users/
├── {tg_id}/
│   ├── tg_id
│   ├── num_name
│   ├── path_number
│   ├── report_purchased
│   ├── horoscope_subscribed
│   └── payments/
│       └── {payment_id}/

horoscopes_sent/
└── {doc_id}/

support_chats/
└── {chat_id}/
```

### Реал-тайм оновлення
Даний не оновлюються автоматично. Перезавантажте сторінку для отримання нових даних.

---

## 🎨 Дизайн система

### Кольори
- **Primary**: #6366f1 (Indigo)
- **Success**: #10b981 (Green)
- **Error**: #ef4444 (Red)
- **Warning**: #f59e0b (Amber)

### Компоненти
- **Cards** — основний контейнер інформації
- **Tables** — для списків даних
- **Badges** — для статусів
- **Buttons** — для дій
- **Inputs** — для пошуку та фільтрації

---

## 📱 Responsive

Admin Panel адаптивна для:
- **Desktop** (1200px+) — повна версія з sidebar
- **Tablet** (768px-1200px) — зменшений sidebar
- **Mobile** (< 768px) — приховати sidebar, горизонтальне меню

---

## 🔐 Безпека

Admin Panel отримує дані з Firebase Firestore:
- ✅ Всі дані захищені Firebase Security Rules
- ✅ Потребує аутентифікації (наступна фаза)
- ✅ HTTPS на production

**Наступна фаза:** Додати Firebase Auth для admin users

---

## 🐛 DEBUG

Встановіть DEBUG режим:

```bash
VITE_DEBUG=true npm run dev
```

---

## 📥 Deploy на Vercel

### 1. Приготування

```bash
git add .
git commit -m "Add admin panel"
git push origin main
```

### 2. Vercel Deploy

```bash
vercel deploy
```

### 3. Environment Variables

На Vercel додайте змінні з `.env.example`

---

## 📊 Приклад запиту (тільки для розробки)

Отримати всіх користувачів:

```javascript
import { getAllUsers } from './services/adminService'

const users = await getAllUsers()
console.log(users)
```

---

## 🔄 Обновлення версії

```bash
npm update
```

---

## ⚠️ Known Issues

- [ ] Реал-тайм оновлення (потребує WebSocket)
- [ ] Аутентифікація admin users (потребує Firebase Auth)
- [ ] Export даних (CSV/PDF)
- [ ] Граф платежів (потребує charting library)

---

## 🚀 Наступні функції (Phase 3)

- [ ] Firebase Authentication для admin
- [ ] Реал-тайм оновлення з Firestore
- [ ] Граф платежів та користувачів
- [ ] Export даних
- [ ] Email повідомлення користувачам
- [ ] Кастомні камерун

---

**Статус:** MVP Admin Panel готова ✅

Завантажуйте сервісні дані та управління платформою з веб-інтерфейсу!
