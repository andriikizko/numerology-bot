import { Telegraf, Markup } from 'telegraf';
import dotenv from 'dotenv';
import {
  getUser,
  createUser,
  updateUserHoroscope,
  activateReport,
  savePayment,
  saveSupportChat,
  initFirebase
} from './services/firebase.js';
import {
  parseDate,
  calculatePathNumber,
  getNumName
} from './services/numerology.js';
import {
  getDailyHoroscope,
  formatHoroscope
} from './services/horoscope.js';
import {
  generateLiqPayLink,
  extractOrderInfo
} from './services/liqpay.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

initFirebase();

const EMOJIS = {
  today: '📅',
  calculation: '🔮',
  offers: '✨',
  profile: '👤',
  support: '💬',
  payment: '💳',
  success: '✅',
  error: '❌',
  warning: '⚠️',
  gift: '🎁',
  back: '⬅️'
};

bot.command('start', async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);

  if (user) {
    await ctx.reply(
      `${EMOJIS.profile} Вітаємо, ${user.num_name}!\n\nЧисло долі: ${user.path_number}`,
      showMainMenu()
    );
    return;
  }

  await ctx.reply(
    `🌟 Вітаємо в світі нумерології!\n\nДля початку введіть вашу дату народження (ДД.ММ.РРРР):\n\nНаприклад: 15.03.1990`
  );
  ctx.session = ctx.session || {};
  ctx.session.registering = true;
});

bot.on('text', async (ctx) => {
  const userId = String(ctx.from.id);

  if (ctx.session?.registering) {
    const parsedDate = parseDate(ctx.message.text);

    if (!parsedDate) {
      await ctx.reply('❌ Неправильний формат.\n\nСпробуйте ще раз (ДД.ММ.РРРР):');
      return;
    }

    const pathNumber = calculatePathNumber(parsedDate);
    const numName = getNumName(pathNumber);

    await createUser(userId, {
      tg_name: ctx.from.first_name,
      birth_date: parsedDate.iso,
      path_number: pathNumber,
      num_name: numName
    });

    ctx.session.registering = false;

    await ctx.reply(
      `✨ Чудово! Ви народилися під числом ${pathNumber}\n\n🌟 Ваше нумерологічне ім'я: ${numName}\n\n🎁 Ви отримали 7 днів безкоштовного гороскопу!`,
      showMainMenu()
    );
  }
});

function showMainMenu() {
  return Markup.inlineKeyboard([
    [Markup.button.callback(`${EMOJIS.today} Сьогодні`, 'today')],
    [Markup.button.callback(`${EMOJIS.calculation} Персональний розрахунок`, 'calc')],
    [Markup.button.callback(`${EMOJIS.offers} Спеціальні пропозиції`, 'offers')],
    [Markup.button.callback(`${EMOJIS.profile} Профіль`, 'profile')]
  ]);
}

bot.action('today', async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);

  if (!user) {
    await ctx.reply('Спочатку введіть дату народження');
    return;
  }

  const horoscope = getDailyHoroscope(user.path_number);
  const formatted = formatHoroscope(user, horoscope);

  await ctx.editMessageText(
    formatted,
    Markup.inlineKeyboard([
      [Markup.button.callback(`${EMOJIS.back} Назад`, 'back')]
    ])
  );
});

bot.action('calc', async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);

  if (!user) return;

  if (user.report_purchased) {
    await ctx.editMessageText(
      `✅ Ви вже маєте доступ до персонального розрахунку!`,
      Markup.inlineKeyboard([
        [Markup.button.callback(`${EMOJIS.back} Назад`, 'back')]
      ])
    );
    return;
  }

  const paymentLink = generateLiqPayLink(userId, 'report', 249);

  const message = `${EMOJIS.calculation} Персональний розрахунок
💰 249 грн

✅ Детальний аналіз вашого числа долі
✅ Рекомендації на кожен день
✅ 30 днів гороскопу в подарунок`;

  await ctx.editMessageText(
    message,
    Markup.inlineKeyboard([
      [Markup.button.url(`${EMOJIS.payment} Оплатити 249 грн`, paymentLink.url)],
      [Markup.button.callback(`${EMOJIS.back} Назад`, 'back')]
    ])
  );
});

bot.action('offers', async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);

  if (!user) return;

  const price = user.report_purchased ? 30 : 50;
  const paymentLink = generateLiqPayLink(userId, 'horoscope', price);

  const message = `${EMOJIS.offers} Спеціальні пропозиції

📅 Щоденний гороскоп
💰 ${price} грн/місяць
(Передплата автоматично поновлюється)

Статус: ${user.horoscope_paid_until ? '✅ Активна' : '🎁 Trial 7 днів'}`;

  await ctx.editMessageText(
    message,
    Markup.inlineKeyboard([
      [Markup.button.url(`📅 Купити гороскоп (${price} грн)`, paymentLink.url)],
      [Markup.button.callback(`${EMOJIS.back} Назад`, 'back')]
    ])
  );
});

bot.action('profile', async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);

  if (!user) return;

  const reportStatus = user.report_purchased ? '✅ Придбаний' : '❌ Не придбаний';
  let horoscopeStatus = '❌ Неактивна';

  if (user.horoscope_trial_until) {
    const trialEnd = user.horoscope_trial_until.toDate?.();
    const daysLeft = Math.ceil((trialEnd - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) horoscopeStatus = `🎁 Trial (${daysLeft} днів)`;
  }

  if (user.horoscope_paid_until) {
    const paidEnd = user.horoscope_paid_until.toDate?.();
    const daysLeft = Math.ceil((paidEnd - new Date()) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0) horoscopeStatus = `✅ Активна (${daysLeft} днів)`;
  }

  const message = `${EMOJIS.profile} Ваш профіль

🌟 Нумерологічне ім'я: ${user.num_name}
🔢 Число долі: ${user.path_number}
📅 Дата народження: ${user.birth_date}

📊 Статус:
${reportStatus} Розрахунок
${horoscopeStatus} Гороскоп`;

  await ctx.editMessageText(
    message,
    Markup.inlineKeyboard([
      [Markup.button.callback(`${EMOJIS.support} Написати підтримці`, 'support')],
      [Markup.button.callback(`${EMOJIS.back} Назад`, 'back')]
    ])
  );
});

bot.action('support', async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);

  if (!user) return;

  await saveSupportChat(
    userId,
    ctx.from.first_name,
    user.num_name,
    'User clicked support'
  );

  await ctx.editMessageText(
    `${EMOJIS.support} Напишіть нам:\n\n@numerology_support\n\nВкажіть ваше нумерологічне ім'я: ${user.num_name}`,
    Markup.inlineKeyboard([
      [Markup.button.callback(`${EMOJIS.back} Назад`, 'back')]
    ])
  );
});

bot.action('back', async (ctx) => {
  const userId = String(ctx.from.id);
  const user = await getUser(userId);

  if (user) {
    await ctx.editMessageText(
      `${EMOJIS.profile} Вітаємо, ${user.num_name}!\n\nЧисло долі: ${user.path_number}`,
      showMainMenu()
    );
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

bot.launch();

console.log('🤖 Bot запущений...');
