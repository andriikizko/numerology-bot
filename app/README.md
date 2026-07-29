# 🔮 Numerology Telegram Mini App

React додаток для Telegram з нумерологічними розрахунками і гороскопами.

## Структура

```
/app
├── src/
│   ├── App.jsx                    # Головний компонент
│   ├── index.jsx                  # Точка входу
│   ├── components/
│   │   ├── Registration.jsx       # Реєстрація користувача
│   │   ├── MainMenu.jsx          # Головне меню (5 розділів)
│   │   ├── Today.jsx             # Щоденний гороскоп (FREE)
│   │   ├── PersonalReport.jsx    # Персональний розрахунок (249 грн)
│   │   ├── Offers.jsx            # Пропозиції (30/50 грн/міс)
│   │   └── Profile.jsx           # Профіль користувача
│   └── styles/
│       └── App.css               # Стилі
├── index.html
├── package.json
└── vite.config.js
```

## Інсталяція

```bash
cd app
npm install
npm run dev
```

## Деплой на Vercel

```bash
cd app
npm run build
```

Потім пушити на GitHub в папку `/app` і Vercel автоматично задеплойить.

## Функціональність

### 1. Реєстрація
- Вхід через Telegram
- Введення нумерологічного імени
- Введення дати народження
- Автоматичний розрахунок числа долі
- 7 днів безкоштовного試用

### 2. Головне Меню (5 розділів)
- **📅 Сьогодні** - Щоденний гороскоп (Gemini API, FREE)
- **📊 Персональний Розрахунок** - 249 грн (Gemini API, LiqPay)
- **✨ Пропозиції** - Гороскоп 30/50 грн/місяць (LiqPay Рекурентно)
- **👤 Профіль** - Дані користувача і статус підписок

### 3. API Інтеграція

#### Gemini API
- Базовий гороскоп (FREE) - 3-4 речення
- Повний розрахунок (249 грн) - 800-1000 слів
- Щоденні гороскопи - 200-300 слів

#### LiqPay API
- Одноразові платежі (249 грн за розрахунок)
- Рекурентні платежи (30/50 грн за гороскоп)

#### Firebase
- Зберігання даних користувача
- Статус підписок
- Пробний період

## Змінні Оточення

```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_LIQPAY_PUBLIC_KEY=your_liqpay_public
VITE_LIQPAY_PRIVATE_KEY=your_liqpay_private
```

## Структура Користувача

```javascript
{
  telegramId: 123456789,
  name: "Філософ",
  birthDate: "15.03.1990",
  pathNumber: 7,
  numberName: "Філософ",
  createdAt: "2024-01-15T10:00:00Z",
  trialUntil: "2024-01-22T10:00:00Z",
  horoscopePaidUntil: null,
  reportPurchased: false
}
```

## Деплой Чеклист

- [ ] Firebase налаштовано
- [ ] Gemini API ключ готовий
- [ ] LiqPay ключи готові (тестові → продакшн)
- [ ] GitHub репо оновлено
- [ ] Vercel деплоїв
- [ ] Telegram Mini App URL визначений
- [ ] Webhook настроєний

## Ціни

- **Персональний Розрахунок:** 249 грн (+ 30 днів гороскопу)
- **Гороскоп (нові користувачі):** 50 грн/місяць
- **Гороскоп (були розраховані):** 30 грн/місяць
- **Trial:** 7 днів безкоштовно

## Tech Stack

- React 18
- Vite
- Firebase
- Gemini API
- LiqPay API
- Telegram Web App API
