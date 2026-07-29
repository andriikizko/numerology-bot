const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { Telegraf } = require("telegraf");
const crypto = require("crypto");
const axios = require("axios");

admin.initializeApp();
const db = admin.firestore();

const BOT_TOKEN = process.env.BOT_TOKEN;
const LIQPAY_PUBLIC_KEY = process.env.LIQPAY_PUBLIC_KEY;
const LIQPAY_PRIVATE_KEY = process.env.LIQPAY_PRIVATE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const bot = new Telegraf(BOT_TOKEN);

// ==================== TELEGRAM BOT ====================

bot.start((ctx) => {
  ctx.reply("🌟 Вітаємо в світі Нумерології!", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🔮 Відкрити додаток", web_app: { url: "https://numerology-bot-app.vercel.app" } }]
      ]
    }
  });
});

exports.botWebhook = functions.https.onRequest((req, res) => {
  bot.handleUpdate(req.body).then(() => res.send("OK"));
});

// ==================== USER API ====================

exports.registerUser = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const userData = req.body;
    
    await db.collection("users").doc(String(userData.telegramId)).set(userData);
    
    res.status(200).json({ success: true, user: userData });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

exports.getUser = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");

  try {
    const telegramId = req.query.id;
    const doc = await db.collection("users").doc(telegramId).get();
    
    if (doc.exists) {
      res.status(200).json(doc.data());
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// ==================== GEMINI API ====================

async function callGemini(prompt) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GEMINI_API_KEY
        }
      }
    );
    
    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API error:", error.response?.data || error.message);
    throw error;
  }
}

exports.generateHoroscope = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { number, name, date } = req.body;
    
    const prompt = `Ти - нумеролог. Щоденний гороскоп (200-300 слів):
Число: ${number}
Ім'я: ${name}
Дата: ${date}

Структура:
1) Енергія дня
2) Позитивні можливості
3) На що звернути увагу
4) Порада дня

Мова: Українська, надихаючий стиль.`;

    const horoscope = await callGemini(prompt);
    
    res.status(200).json({ horoscope });
  } catch (error) {
    console.error("Horoscope generation error:", error);
    res.status(500).json({ error: "Failed to generate horoscope" });
  }
});

exports.generateReport = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { number, name, birthDate } = req.body;
    
    const prompt = `Ти - майстер нумеролог. Створи ПОВНИЙ персональний звіт (800-1000 слів):
Число: ${number}
Ім'я: ${name}
Дата народження: ${birthDate}

Структура:
1) Повна характеристика числа (якості, риси, потенціал)
2) Сильні сторони і таланти
3) Виклики і області розвитку
4) Рекомендації:
   - Кар'єра та фінанси
   - Відносини та любов
   - Здоров'я та благополуччя
   - Особистісний ріст
5) Практичні поради

Мова: Українська, професійний стиль.`;

    const report = await callGemini(prompt);
    
    res.status(200).json({ report });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// ==================== LIQPAY PAYMENTS ====================

exports.createPayment = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const { userId, type, amount } = req.body;
    
    const orderId = `${type}_${userId}_${Date.now()}`;
    
    const paymentData = {
      public_key: LIQPAY_PUBLIC_KEY,
      version: "3",
      action: type === "horoscope" ? "subscribe" : "pay",
      amount: amount / 100,
      currency: "UAH",
      description: type === "report" 
        ? "Персональний нумерологічний розрахунок" 
        : "Підписка на щоденний гороскоп",
      order_id: orderId,
      server_url: "https://us-central1-numerology-bot-109da.cloudfunctions.net/liqpayWebhook",
    };
    
    if (type === "horoscope") {
      paymentData.subscribe = "1";
      paymentData.subscribe_date_start = new Date().toISOString().split("T")[0];
      paymentData.subscribe_periodicity = "month";
    }
    
    const data = Buffer.from(JSON.stringify(paymentData)).toString("base64");
    const signature = crypto
      .createHash("sha1")
      .update(LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY)
      .digest("base64");
    
    const paymentUrl = `https://www.liqpay.ua/api/3/checkout?data=${data}&signature=${signature}`;
    
    res.status(200).json({ paymentUrl, orderId });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
});

exports.liqpayWebhook = functions.https.onRequest(async (req, res) => {
  try {
    const { data, signature } = req.body;
    
    const hash = crypto
      .createHash("sha1")
      .update(LIQPAY_PRIVATE_KEY + data + LIQPAY_PRIVATE_KEY)
      .digest("base64");
    
    if (hash !== signature) {
      return res.status(400).send("Invalid signature");
    }
    
    const decoded = Buffer.from(data, "base64").toString();
    const payment = JSON.parse(decoded);
    
    if (payment.status === "success" || payment.status === "subscribed") {
      const [type, userId] = payment.order_id.split("_");
      
      await db.collection("payments").add({
        user_id: userId,
        order_id: payment.order_id,
        type: type,
        amount: payment.amount,
        status: "success",
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      const userRef = db.collection("users").doc(userId);
      
      if (type === "report") {
        await userRef.update({
          reportPurchased: true,
          horoscopePaidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        
        await bot.telegram.sendMessage(
          userId, 
          "✅ Платіж успішний! Ваш персональний розрахунок готовий.\n\n🎁 Бонус: Гороскоп активовано на 30 днів!"
        );
      } else if (type === "horoscope") {
        await userRef.update({
          horoscopePaidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        
        await bot.telegram.sendMessage(
          userId,
          "✅ Підписка на гороскоп активована! Щодня о 08:00 отримуватимете персональний гороскоп."
        );
      }
    }
    
    res.send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error");
  }
});

// ==================== ЩОДЕННА РОЗСИЛКА ГОРОСКОПІВ ====================
// Тимчасово відключено - буде додано окремо через Cloud Scheduler v2
