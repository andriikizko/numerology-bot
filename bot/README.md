# 🔮 Numerology Bot — довідкова папка

Ця папка містить **довідкові копії** робочого backend-коду для GitHub
(публічний репозиторій).

⚠️ **Реальний, робочий бекенд деплоїться з Firebase Cloud Functions**
(`firebase deploy --only functions`), не з цієї папки напряму.

## Файли

- `functions_backend.js` — копія основного файлу Cloud Functions (без секретів,
  з `process.env.*` замість реальних ключів)
- `calculations.js` — детерміновані формули нумерологічних розрахунків
- `knowledgeBase.js` — парсер бази знань (markdown → фрагмент за запитом)
- `generateCalculation.js` — Cloud Function, що генерує персональні розрахунки
  через Gemini API на основі `knowledge-base/`
- `knowledge-base/` — база знань (15 пунктів, 3 продукти: Загальний/Кохання/Гроші)

## Історія

Раніше тут був окремий Node.js/Express бот (`src/bot.js`, `src/server.js`),
який планувалось деплоїти на Render/Vercel/Fly.io. Цей підхід не запрацював
(проблеми з платними планами й env variables) — проєкт перейшов на Firebase
Cloud Functions, і застарілий код видалено з репозиторію.
