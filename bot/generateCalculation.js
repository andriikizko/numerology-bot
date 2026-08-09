// generateCalculation.js
// Firebase Cloud Function, що об'єднує:
// 1) детермінований розрахунок (calculations.js)
// 2) вибір фрагменту бази знань (knowledgeBase.js)
// 3) генерацію тексту через Gemini API
// 4) кешування результату у Firestore

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const calc = require('./calculations.js');
const kb = require('./knowledgeBase.js');

const db = admin.firestore();

// ⚠️ КЛЮЧ ЗАШИТО НАПРЯМУ В КОД — цей файл НІКОЛИ не повинен потрапити в git push.
// Перевір, що generateCalculation.js доданий у .gitignore локального репозиторію,
// або що в GitHub заливається лише версія-заглушка з process.env.GEMINI_KEY.
const GEMINI_API_KEY = 'ВСТАВ_СЮДИ_СВІЙ_НОВИЙ_КЛЮЧ';
const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ---------- SYSTEM PROMPT (константа, як зафіксовано в промт-документі) ----------
const SYSTEM_PROMPT = `
Ти — досвідчений нумеролог, що пише персональні розрахунки для преміального
застосунку. Твоє завдання — НЕ вигадувати нумерологічні трактування самостійно,
а компонувати зв'язний, глибокий, теплий текст ВИКЛЮЧНО на основі наданого
фрагмента бази знань, підставляючи в нього конкретні розраховані числа
користувача.

СТРОГІ ПРАВИЛА:
1. Не використовуй жодної інформації про нумерологію поза наданим фрагментом
   бази знань. Якщо в базі немає трактування для якогось аспекту — не вигадуй
   його, а пропусти.
2. Числа, надані в запиті, є остаточними й точними — не перераховуй їх і не
   став під сумнів.
3. Обов'язкова структура відповіді: спочатку РОЗГОРНУТИЙ ОПИС, потім окремий,
   рівноцінний за обсягом РОЗГОРНУТИЙ ВИСНОВОК (синтез + конкретна порада).
4. Тон: теплий, підбадьорливий, чесний — без надмірного містицизму.
5. Для платних пунктів завершуй реченням, що підкреслює цінність інформації.
6. Обсяг: опис ≈150-250 слів, висновок ≈150-250 слів.
7. НІКОЛИ не давай медичних, юридичних чи прямих фінансових інвестиційних порад.
8. Пиши українською мовою, живим стилем, без канцеляризмів.
`.trim();

// ---------- Виклик Gemini API ----------
async function callGemini(userPrompt) {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API помилка: ${response.status} ${errText}`);
  }
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// ---------- Побудова user-промта під конкретний пункт ----------
function buildUserPrompt({ segmentLabel, pointLabel, accessLabel, numbersText, kbFragment }) {
  return `
КОНТЕКСТ ЗАПИТУ:
Продукт: ${segmentLabel}
Пункт: ${pointLabel}
Статус доступу: ${accessLabel}

РОЗРАХОВАНІ ЧИСЛА КОРИСТУВАЧА (точні, не перераховувати):
${numbersText}

ФРАГМЕНТ БАЗИ ЗНАНЬ (використовувати ВИКЛЮЧНО цей матеріал):
${kbFragment}

ЗАВДАННЯ:
Згенеруй персональний текст-розрахунок для цього користувача за цим пунктом,
дотримуючись усіх правил із системного промта.
`.trim();
}

// ---------- Формування набору чисел і фрагменту бази під конкретний пункт ----------
function prepareGeneral(point, dates) {
  const { userDate, motherDate, fatherDate } = dates;

  switch (point) {
    case 'lifePath': {
      const lp = calc.calculateLifePath(userDate);
      const arcana = calc.calculateTarotArcana(lp.rawSum);
      const temperament = calc.calculateTemperament(userDate);
      return {
        resultValue: lp.value,
        numbersText: `Число долі = ${lp.value}\nАркан Таро = ${arcana.name}\nТемперамент = ${temperament.type} (${temperament.odd} непарних / ${temperament.even} парних цифр)`,
        kbFragment: kb.getKnowledgeFragment('general', 'lifePath', lp.value),
      };
    }
    case 'birthdayNumber': {
      const bn = calc.calculateBirthdayNumber(userDate);
      const group = calc.getCheiroGroup(bn.rawDay);
      return {
        resultValue: bn.value,
        numbersText: `Число дня народження = ${bn.value}\nГрупа Cheiro = ${group}`,
        kbFragment: kb.getKnowledgeFragment('general', 'birthdayNumber', bn.value),
      };
    }
    case 'personalCycle': {
      const today = new Date();
      const year = calc.calculatePersonalYear(userDate, today.getFullYear());
      const month = calc.calculatePersonalMonth(year, today.getMonth() + 1);
      const day = calc.calculatePersonalDay(month, today.getDate());
      return {
        resultValue: year,
        numbersText: `Персональний рік = ${year}\nПерсональний місяць = ${month}\nПерсональний день = ${day}`,
        kbFragment: kb.getKnowledgeFragment('general', 'personalCycle', year),
      };
    }
    case 'karmicDebt': {
      const kd = calc.calculateKarmicDebt(userDate);
      const matrix = calc.calculatePsychoMatrix(userDate);
      const family = calc.calculateFamilyCode(userDate, motherDate, fatherDate);
      const value = kd.hasKarmicDebt ? kd.karmicNumber : 'none';
      return {
        resultValue: value,
        numbersText: `Кармічний борг = ${kd.hasKarmicDebt ? kd.karmicNumber : 'відсутній'}\nВідсутні числа матриці = ${matrix.missingNumbers.join(', ') || 'немає'}\nРодовий сценарій = ${family.scenario} (число долі матері=${family.motherLP}, батька=${family.fatherLP})`,
        kbFragment: kb.getKnowledgeFragment('general', 'karmicDebt', value),
      };
    }
    default:
      throw new Error(`Невідомий пункт: ${point}`);
  }
}

// ---------- Формування чисел і фрагменту бази — сегмент "Кохання" ----------
function prepareLove(point, dates) {
  const { userDate, motherDate, fatherDate, partnerDate } = dates;
  if (!partnerDate) {
    throw new functions.https.HttpsError('failed-precondition', 'Потрібна дата народження партнера');
  }

  switch (point) {
    case 'compatibility': {
      const comp = calc.calculateCompatibility(userDate, partnerDate);
      return {
        resultValue: `${comp.lifePathA}-${comp.lifePathB}`,
        numbersText: `Число долі користувача = ${comp.lifePathA} (${comp.groupA})\nЧисло долі партнера = ${comp.lifePathB} (${comp.groupB})\nСпільна стихійна група = ${comp.sameGroup ? 'так' : 'ні'}`,
        kbFragment: kb.getCompatibilityFragment(comp.lifePathA, comp.lifePathB),
      };
    }
    case 'relationshipYears': {
      const today = new Date();
      const yearUser = calc.calculatePersonalYear(userDate, today.getFullYear());
      const yearPartner = calc.calculatePersonalYear(partnerDate, today.getFullYear());
      const monthUser = calc.calculatePersonalMonth(yearUser, today.getMonth() + 1);
      const monthPartner = calc.calculatePersonalMonth(yearPartner, today.getMonth() + 1);
      return {
        resultValue: `${yearUser}-${yearPartner}`,
        numbersText: `Персональний рік користувача = ${yearUser}\nПерсональний рік партнера = ${yearPartner}\nПерсональний місяць користувача = ${monthUser}\nПерсональний місяць партнера = ${monthPartner}`,
        kbFragment: kb.getSectionByHeading('love.otherPoints', 'Пункт 2.2'),
      };
    }
    case 'relationshipMatrix': {
      const matrix = calc.calculatePsychoMatrix(userDate);
      return {
        resultValue: `sector2_${matrix.matrix[2]}_sector6_${matrix.matrix[6]}`,
        numbersText: `Повторів цифри 2 (чуттєвість) у матриці = ${matrix.matrix[2]}\nПовторів цифри 6 (вірність) у матриці = ${matrix.matrix[6]}`,
        kbFragment: kb.getSectionByHeading('love.otherPoints', 'Пункт 2.3'),
      };
    }
    case 'relationshipChallenges': {
      const { challenges } = calc.calculateChallengesAndPinnacles(userDate);
      const mainChallenge = challenges.reduce((a, b) => (b > a ? b : a));
      return {
        resultValue: mainChallenge,
        numbersText: `Головний виклик пари (найсильніший з 4) = ${mainChallenge}\nУсі виклики = ${challenges.join(', ')}`,
        kbFragment: kb.getSectionByHeading('love.otherPoints', 'Пункт 2.4'),
      };
    }
    case 'relationshipKarmicDebt': {
      const userKd = calc.calculateKarmicDebt(userDate);
      const partnerKd = calc.calculateKarmicDebt(partnerDate);
      let scenario;
      if (userKd.hasKarmicDebt && partnerKd.hasKarmicDebt && userKd.karmicNumber === partnerKd.karmicNumber) {
        scenario = 'збіг';
      } else if (userKd.hasKarmicDebt || partnerKd.hasKarmicDebt) {
        scenario = 'лише_в_одного';
      } else {
        scenario = 'немає_в_жодного';
      }
      return {
        resultValue: scenario,
        numbersText: `Кармічний борг користувача = ${userKd.hasKarmicDebt ? userKd.karmicNumber : 'немає'}\nКармічний борг партнера = ${partnerKd.hasKarmicDebt ? partnerKd.karmicNumber : 'немає'}\nСценарій = ${scenario}`,
        kbFragment: kb.getSectionByHeading('love.otherPoints', 'Пункт 2.5'),
      };
    }
    default:
      throw new Error(`Невідомий пункт love: ${point}`);
  }
}

// ---------- Формування чисел і фрагменту бази — сегмент "Гроші" ----------
function prepareMoney(point, dates) {
  const { userDate } = dates;

  switch (point) {
    case 'moneyFlow': {
      const flow = calc.calculateMoneyFlow(userDate);
      const risk = calc.calculateInvestmentRisk(userDate);
      return {
        resultValue: flow,
        numbersText: `Число грошового потоку = ${flow}\nЧисло інвестиційного ризику = ${risk.value} (${risk.level})`,
        kbFragment: kb.getSectionByHeading('money.allPoints', `ГРОШОВИЙ ПОТІК ${flow}`),
      };
    }
    case 'wealthMatrix': {
      const matrix = calc.calculatePsychoMatrix(userDate);
      const wealthCells = [4, 5, 6].map((n) => matrix.matrix[n]);
      const careerCells = [1, 5, 9].map((n) => matrix.matrix[n]);
      return {
        resultValue: `wealth_${wealthCells.join('_')}_career_${careerCells.join('_')}`,
        numbersText: `Комірки багатства (4,5,6) = ${wealthCells.join(', ')}\nКомірки кар'єри (1,5,9) = ${careerCells.join(', ')}`,
        kbFragment: kb.getSectionByHeading('money.allPoints', 'Пункт 3.2'),
      };
    }
    case 'financialKarmicDebt': {
      const kd = calc.calculateKarmicDebt(userDate);
      const isFinancial = kd.hasKarmicDebt && [13, 14].includes(kd.karmicNumber);
      return {
        resultValue: isFinancial ? kd.karmicNumber : 'none',
        numbersText: `Кармічний борг = ${kd.hasKarmicDebt ? kd.karmicNumber : 'немає'}\nФінансово релевантний (13 чи 14) = ${isFinancial ? 'так' : 'ні'}`,
        kbFragment: kb.getSectionByHeading('money.allPoints', 'Пункт 3.3'),
      };
    }
    case 'financialYear': {
      const today = new Date();
      const year = calc.calculatePersonalYear(userDate, today.getFullYear());
      return {
        resultValue: year,
        numbersText: `Персональний рік (фінансовий фокус) = ${year}`,
        kbFragment: kb.getSectionByHeading('money.allPoints', 'Пункт 3.4'),
      };
    }
    case 'financialChallenges': {
      const { challenges } = calc.calculateChallengesAndPinnacles(userDate);
      const mainChallenge = challenges.reduce((a, b) => (b > a ? b : a));
      return {
        resultValue: mainChallenge,
        numbersText: `Головний фінансовий виклик = ${mainChallenge}\nУсі виклики = ${challenges.join(', ')}`,
        kbFragment: kb.getSectionByHeading('money.allPoints', 'Пункт 3.5'),
      };
    }
    default:
      throw new Error(`Невідомий пункт money: ${point}`);
  }
}



// ---------- Головна Cloud Function (onRequest, як і решта функцій проєкту) ----------
exports.generateCalculation = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { userId, segment, point } = req.body;
    if (!userId || !segment || !point) {
      res.status(400).json({ error: 'Потрібні userId, segment, point' });
      return;
    }

    const cacheKey = `${segment}_${point}`;
    const cacheRef = db.collection('users').doc(userId).collection('calculations').doc(cacheKey);

    if (point !== 'personalCycle') {
      const cached = await cacheRef.get();
      if (cached.exists) {
        res.status(200).json(cached.data());
        return;
      }
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: 'Користувача не знайдено' });
      return;
    }
    const { birthDate, motherBirthDate, fatherBirthDate } = userDoc.data();
    if (!birthDate || !motherBirthDate || !fatherBirthDate) {
      res.status(412).json({ error: "Не всі обов'язкові дати заповнені (своя, мами, тата)" });
      return;
    }

    let partnerDate = null;
    if (segment === 'love') {
      const partnerDoc = await db.collection('users').doc(userId).collection('partners').doc('current').get();
      if (!partnerDoc.exists || !partnerDoc.data().birthDate) {
        res.status(412).json({ error: 'Потрібна дата народження партнера' });
        return;
      }
      partnerDate = partnerDoc.data().birthDate;
    }

    const FREE_POINTS = { general: 'lifePath', love: 'compatibility', money: 'moneyFlow' };
    const isFree = FREE_POINTS[segment] === point;
    if (!isFree) {
      const hasAccess = await checkUserPurchase(userId, segment);
      if (!hasAccess) {
        res.status(402).json({ error: 'Цей пункт вимагає оплати', needsPayment: true });
        return;
      }
    }

    const dates = { userDate: birthDate, motherDate: motherBirthDate, fatherDate: fatherBirthDate, partnerDate };
    const PREPARE_FN = { general: prepareGeneral, love: prepareLove, money: prepareMoney };
    const { resultValue, numbersText, kbFragment } = PREPARE_FN[segment](point, dates);

    if (!kbFragment) {
      res.status(500).json({ error: `Фрагмент бази знань не знайдено для ${segment}.${point}=${resultValue}` });
      return;
    }

    const segmentLabels = { general: 'Загальний Розрахунок', love: 'Кохання та Сумісність', money: 'Гроші' };
    const pointLabels = {
      lifePath: 'Число долі',
      birthdayNumber: 'Число дня народження',
      personalCycle: 'Персональний рік/місяць/день',
      karmicDebt: 'Кармічні борги',
      compatibility: 'Число сумісності партнерів',
      relationshipYears: 'Персональні роки стосунків',
      relationshipMatrix: 'Матриця — сектор стосунків',
      relationshipChallenges: 'Виклики у стосунках',
      relationshipKarmicDebt: 'Кармічні борги пари',
      moneyFlow: 'Число грошового потоку',
      wealthMatrix: "Матриця багатства і кар'єри",
      financialKarmicDebt: 'Кармічні борги щодо фінансів',
      financialYear: 'Персональний рік — фінансовий фокус',
      financialChallenges: 'Виклики у фінансовому контексті',
    };

    const userPrompt = buildUserPrompt({
      segmentLabel: segmentLabels[segment],
      pointLabel: pointLabels[point],
      accessLabel: isFree ? '🆓 безкоштовний' : '🔒 оплачений',
      numbersText,
      kbFragment,
    });

    const generatedText = await callGemini(userPrompt);

    const result = {
      segment,
      point,
      resultValue,
      text: generatedText,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (point !== 'personalCycle') {
      await cacheRef.set(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('generateCalculation error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

async function checkUserPurchase(userId, segment) {
  const purchaseDoc = await db.collection('users').doc(userId).collection('purchases').doc(segment).get();
  return purchaseDoc.exists && purchaseDoc.data().status === 'paid';
}
