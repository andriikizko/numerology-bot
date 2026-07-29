import express from 'express';
import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import {
  activateReport,
  updateUserHoroscope,
  savePayment,
  getAllUsersWithHoroscope,
  saveHoroscopeSent,
  initFirebase
} from './services/firebase.js';
import {
  verifyLiqPaySignature,
  parseLiqPayResponse,
  extractOrderInfo
} from './services/liqpay.js';
import {
  getDailyHoroscope,
  formatHoroscope
} from './services/horoscope.js';

dotenv.config();
initFirebase();

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/liqpay-webhook', async (req, res) => {
  try {
    const { data, signature } = req.body;

    if (!verifyLiqPaySignature(data, signature)) {
      console.error('Invalid LiqPay signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const response = parseLiqPayResponse(data);

    if (!response) {
      return res.status(400).json({ error: 'Invalid response' });
    }

    const orderInfo = extractOrderInfo(response.order_id);

    if (!orderInfo) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    const { type, userId } = orderInfo;
    const { status, liqpay_order_id, amount } = response;

    await savePayment(userId, {
      order_id: response.order_id,
      type: type,
      amount: parseFloat(amount),
      status: status,
      liqpay_id: liqpay_order_id
    });

    if (status === 'success') {
      if (type === 'report') {
        await activateReport(userId);
        await bot.telegram.sendMessage(
          userId,
          '✅ Спасибо за оплату!\n\n🔮 Ваш персональний розрахунок активовано.\n\n📚 Перейдіть у профіль для перегляду деталей.'
        );
      } else if (type === 'horoscope') {
        await updateUserHoroscope(userId, 1);
        await bot.telegram.sendMessage(
          userId,
          '✅ Передплата активована!\n\n📅 Ви отримуватимете щоденний гороскоп на 30 днів.'
        );
      }
    } else if (status === 'failure') {
      await bot.telegram.sendMessage(userId, '❌ Платіж відхилено. Спробуйте ще раз.');
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

async function sendDailyHoroscopes() {
  try {
    console.log('📨 Розсилаю гороскопи...');
    const users = await getAllUsersWithHoroscope();

    for (const user of users) {
      try {
        const horoscope = getDailyHoroscope(user.path_number);
        const formatted = formatHoroscope(user, horoscope);

        await bot.telegram.sendMessage(user.tg_id, formatted);
        await saveHoroscopeSent(user.tg_id, user.num_name, user.path_number);

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error sending horoscope to ${user.tg_id}:`, error.message);
      }
    }

    console.log(`✅ Гороскопи розіслані ${users.length} користувачам`);
  } catch (error) {
    console.error('Error in daily horoscope task:', error);
  }
}

cron.schedule('0 8 * * *', sendDailyHoroscopes, {
  timezone: 'Europe/Kyiv'
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/stats', async (req, res) => {
  try {
    const users = await getAllUsersWithHoroscope();
    res.json({
      horoscope_users: users.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Server запущений на порту ${PORT}`);
  console.log(`📨 Гороскопи розсилаються щодня о 08:00 (Europe/Kyiv)`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
