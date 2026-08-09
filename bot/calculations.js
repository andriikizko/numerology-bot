// calculations.js
// Детерміновані розрахунки нумерологічних чисел.
// ВАЖЛИВО: тут НЕМАЄ звернень до Gemini чи будь-якого AI — тільки чиста математика.
// Дата на вхід у форматі 'YYYY-MM-DD'.

/** Звести число до 1 цифри, зберігаючи майстер-числа 11, 22, 33 */
function reduceNumber(num, keepMaster = true) {
  while (num > 9) {
    if (keepMaster && (num === 11 || num === 22 || num === 33)) return num;
    num = String(num)
      .split('')
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return num;
}

/** Розкласти дату на масив цифр (для сум і матриці) */
function dateDigits(dateStr) {
  return dateStr.replace(/-/g, '').split('').map(Number);
}

// ---------- 1.1 ЧИСЛО ДОЛІ ----------
function calculateLifePath(dateStr) {
  const digits = dateDigits(dateStr);
  const sum = digits.reduce((a, b) => a + b, 0);
  return {
    value: reduceNumber(sum),
    rawSum: sum, // потрібно для Аркана Таро
  };
}

// ---------- Аркан Таро (з raw sum, без фінального зведення) ----------
function calculateTarotArcana(rawSum) {
  const arcanaIndex = rawSum % 22;
  const arcanaNames = [
    'Блазень', 'Маг', 'Верховна Жриця', 'Імператриця', 'Імператор',
    'Ієрофант', 'Закохані', 'Колісниця', 'Сила', 'Відлюдник',
    'Колесо Фортуни', 'Справедливість', 'Повішений', 'Смерть', 'Помірність',
    'Диявол', 'Вежа', 'Зірка', 'Місяць', 'Сонце',
    'Суд', 'Світ',
  ];
  return { index: arcanaIndex, name: arcanaNames[arcanaIndex] };
}

// ---------- Число темпераменту (парні/непарні цифри дати) ----------
function calculateTemperament(dateStr) {
  const digits = dateDigits(dateStr);
  const odd = digits.filter((d) => d % 2 === 1).length;
  const even = digits.filter((d) => d % 2 === 0).length;
  let type;
  if (odd > even) type = 'холерико-сангвінічний';
  else if (even > odd) type = 'флегматично-меланхолійний';
  else type = 'змішаний';
  return { odd, even, type };
}

// ---------- 1.2 ЧИСЛО ДНЯ НАРОДЖЕННЯ ----------
function calculateBirthdayNumber(dateStr) {
  const day = parseInt(dateStr.split('-')[2], 10);
  return { value: reduceNumber(day), rawDay: day };
}

// ---------- Сумісність за днем народження (група Cheiro) ----------
function getCheiroGroup(day) {
  const groups = {
    Сонце: [1, 10, 19, 28],
    Місяць: [2, 11, 20, 29],
    Юпітер: [3, 12, 21, 30],
    'Уран/Раху': [4, 13, 22, 31],
    Меркурій: [5, 14, 23],
    Венера: [6, 15, 24],
    Нептун: [7, 16, 25],
    Сатурн: [8, 17, 26],
    Марс: [9, 18, 27],
  };
  for (const [group, days] of Object.entries(groups)) {
    if (days.includes(day)) return group;
  }
  return null;
}

// ---------- 1.3 ПЕРСОНАЛЬНИЙ РІК/МІСЯЦЬ/ДЕНЬ ----------
function calculatePersonalYear(dateStr, targetYear) {
  const [, month, day] = dateStr.split('-').map(Number);
  const sum = day + month + targetYear;
  return reduceNumber(sum, false); // майстер-числа тут не використовують
}

function calculatePersonalMonth(personalYear, targetMonth) {
  return reduceNumber(personalYear + targetMonth, false);
}

function calculatePersonalDay(personalMonth, targetDay) {
  return reduceNumber(personalMonth + targetDay, false);
}

function calculateNineYearCyclePosition(personalYear) {
  return personalYear; // позиція в циклі = сам персональний рік (1-9)
}

// ---------- 1.4 ВИКЛИКИ ТА ПІКИ ----------
function calculateChallengesAndPinnacles(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const m = reduceNumber(month, false);
  const d = reduceNumber(day, false);
  const y = reduceNumber(year, false);

  const challenge1 = Math.abs(m - d);
  const challenge2 = Math.abs(d - y);
  const challenge3 = Math.abs(challenge1 - challenge2);
  const challenge4 = Math.abs(m - y);

  const pinnacle1 = reduceNumber(m + d);
  const pinnacle2 = reduceNumber(d + y);
  const pinnacle3 = reduceNumber(pinnacle1 + pinnacle2);
  const pinnacle4 = reduceNumber(m + y);

  return {
    challenges: [challenge1, challenge2, challenge3, challenge4],
    pinnacles: [pinnacle1, pinnacle2, pinnacle3, pinnacle4],
  };
}

/** Визначити, який з 4 етапів актуальний зараз (36 - число долі = вік завершення етапу 1) */
function getCurrentLifeStage(birthDateStr, lifePathValue, todayStr = new Date().toISOString().slice(0, 10)) {
  const birthYear = parseInt(birthDateStr.split('-')[0], 10);
  const currentYear = parseInt(todayStr.split('-')[0], 10);
  const age = currentYear - birthYear;
  const stage1End = 36 - (lifePathValue > 9 ? reduceNumber(lifePathValue) : lifePathValue);
  if (age <= stage1End) return 1;
  if (age <= stage1End + 9) return 2;
  if (age <= stage1End + 18) return 3;
  return 4;
}

// ---------- 1.5 КАРМІЧНІ БОРГИ ----------
function calculateKarmicDebt(dateStr) {
  const digits = dateDigits(dateStr);
  const rawSum = digits.reduce((a, b) => a + b, 0);
  const karmicNumbers = [13, 14, 16, 19];

  // Перевірка проміжних сум на шляху до фінального зведення
  let current = rawSum;
  const intermediates = [current];
  while (current > 9) {
    current = String(current).split('').reduce((a, b) => a + parseInt(b, 10), 0);
    intermediates.push(current);
  }

  const found = intermediates.find((n) => karmicNumbers.includes(n));
  return { hasKarmicDebt: !!found, karmicNumber: found || null };
}

// ---------- Психоматриця Александрова (квадрат 3×3) ----------
function calculatePsychoMatrix(dateStr) {
  const digits = dateDigits(dateStr).filter((d) => d !== 0); // нулі не враховуються
  const matrix = {};
  for (let i = 1; i <= 9; i++) matrix[i] = 0;
  digits.forEach((d) => {
    matrix[d] = (matrix[d] || 0) + 1;
  });
  const missingNumbers = Object.entries(matrix)
    .filter(([, count]) => count === 0)
    .map(([num]) => parseInt(num, 10));
  return { matrix, missingNumbers };
}

// ---------- 2.1 СУМІСНІСТЬ ПАРТНЕРІВ ----------
const ELEMENT_GROUPS = {
  'вогонь/повітря': [1, 5, 7],
  земля: [2, 4, 8],
  'вода/творчість': [3, 6, 9],
};

function getElementGroup(lifePathValue) {
  const base = lifePathValue > 9 ? reduceNumber(lifePathValue) : lifePathValue;
  for (const [group, nums] of Object.entries(ELEMENT_GROUPS)) {
    if (nums.includes(base)) return group;
  }
  return null;
}

function calculateCompatibility(dateA, dateB) {
  const lifePathA = calculateLifePath(dateA).value;
  const lifePathB = calculateLifePath(dateB).value;
  return {
    lifePathA,
    lifePathB,
    groupA: getElementGroup(lifePathA),
    groupB: getElementGroup(lifePathB),
    sameGroup: getElementGroup(lifePathA) === getElementGroup(lifePathB),
  };
}

// ---------- 3.1 ГРОШОВИЙ ПОТІК + РИЗИК ----------
function calculateMoneyFlow(dateStr) {
  const lifePath = calculateLifePath(dateStr).value;
  const birthday = calculateBirthdayNumber(dateStr).value;
  const base = (lifePath > 9 ? reduceNumber(lifePath) : lifePath) + birthday;
  return reduceNumber(base, false);
}

function calculateInvestmentRisk(dateStr) {
  const { challenges } = calculateChallengesAndPinnacles(dateStr);
  const lifePath = calculateLifePath(dateStr).value;
  const base = challenges[0] + (lifePath > 9 ? reduceNumber(lifePath) : lifePath);
  const value = reduceNumber(base, false);
  let level;
  if (value <= 3) level = 'низький';
  else if (value <= 6) level = 'середній';
  else level = 'високий';
  return { value, level };
}

// ---------- Родовий код (дати батьків) ----------
function calculateFamilyCode(userDate, motherDate, fatherDate) {
  const userLP = calculateLifePath(userDate).value;
  const motherLP = calculateLifePath(motherDate).value;
  const fatherLP = calculateLifePath(fatherDate).value;

  const matchesMother = userLP === motherLP;
  const matchesFather = userLP === fatherLP;
  const parentsSum = reduceNumber(
    (motherLP > 9 ? reduceNumber(motherLP) : motherLP) +
      (fatherLP > 9 ? reduceNumber(fatherLP) : fatherLP),
    false,
  );
  const isSynthesis = parentsSum === (userLP > 9 ? reduceNumber(userLP) : userLP);

  let scenario;
  if (matchesMother || matchesFather) scenario = 'пряме_успадкування';
  else if (isSynthesis) scenario = 'синтез_родів';
  else scenario = 'нова_гілка';

  return { userLP, motherLP, fatherLP, matchesMother, matchesFather, isSynthesis, scenario };
}

module.exports = {
  reduceNumber,
  calculateLifePath,
  calculateTarotArcana,
  calculateTemperament,
  calculateBirthdayNumber,
  getCheiroGroup,
  calculatePersonalYear,
  calculatePersonalMonth,
  calculatePersonalDay,
  calculateNineYearCyclePosition,
  calculateChallengesAndPinnacles,
  getCurrentLifeStage,
  calculateKarmicDebt,
  calculatePsychoMatrix,
  calculateCompatibility,
  calculateMoneyFlow,
  calculateInvestmentRisk,
  calculateFamilyCode,
};
