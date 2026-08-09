// knowledgeBase.js
// Доступ до бази знань. Замість дублювання ~191000 символів тексту в JS-об'єкт,
// модуль читає markdown-файли бази безпосередньо і витягує потрібну секцію
// за заголовком. Це виключає розсинхронізацію між "джерелом правди" (markdown,
// який редагує копірайтер/маркетолог) і кодом.

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.join(__dirname, 'knowledge-base'); // сюди кладуться .md файли бази

// Мапа: сегмент+пункт → файл бази знань
const FILE_MAP = {
  'general.lifePath': 'baza-01-chyslo-doli.md',
  'general.birthdayNumber': 'baza-02-chyslo-dnya.md',
  'general.personalCycle': 'baza-03-personalnyi-cykl.md',
  'general.challengesPinnacles': 'baza-04-vyklyky-piky.md',
  'general.karmicDebt': 'baza-05-karmichni-borgy.md',
  'general.conclusion': 'baza-06-vysnovky-segment1.md',
  'love.compatibility': 'baza-07-suminst-partneriv.md',
  'love.otherPoints': 'baza-08-kohannya-inshi-punkty.md',
  'money.allPoints': 'baza-09-groshi-vsi-punkty.md',
  'love.conclusion': 'baza-10-vysnovky-segment-2-3.md',
  'money.conclusion': 'baza-10-vysnovky-segment-2-3.md',
};

const fileCache = {}; // читаємо файл з диску один раз, тримаємо в пам'яті процесу

function readFile(fileName) {
  if (fileCache[fileName]) return fileCache[fileName];
  const filePath = path.join(BASE_DIR, fileName);
  const content = fs.readFileSync(filePath, 'utf-8');
  fileCache[fileName] = content;
  return content;
}

/**
 * Витягти секцію markdown за текстом заголовка (### чи ##).
 * Повертає текст від заголовка до наступного заголовка того ж або вищого рівня.
 */
function extractSection(content, headingText) {
  const lines = content.split('\n');
  let startIdx = -1;
  let headingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,4})\s+(.*)$/);
    if (match && match[2].toUpperCase().includes(headingText.toUpperCase())) {
      startIdx = i;
      headingLevel = match[1].length;
      break;
    }
  }
  if (startIdx === -1) return null;

  let endIdx = lines.length;
  for (let i = startIdx + 1; i < lines.length; i++) {
    const match = lines[i].match(/^(#{1,4})\s+/);
    if (match && match[1].length <= headingLevel) {
      endIdx = i;
      break;
    }
  }
  return lines.slice(startIdx, endIdx).join('\n').trim();
}

/**
 * Головна функція: отримати фрагмент бази знань за сегментом, пунктом і значенням.
 * Приклад: getKnowledgeFragment('general', 'lifePath', 9)
 *          → повертає секцію "### ЧИСЛО ДОЛІ 9" з baza-01-chyslo-doli.md
 */
function getKnowledgeFragment(segment, point, value) {
  const key = `${segment}.${point}`;
  const fileName = FILE_MAP[key];
  if (!fileName) {
    throw new Error(`Немає файлу бази знань для ${key}. Перевір FILE_MAP.`);
  }
  const content = readFile(fileName);

  // Заголовки в базі мають формат "ЧИСЛО ДОЛІ 9", "ЧИСЛО ДНЯ 6",
  // "КАРМІЧНИЙ БОРГ 13", "ПЕРСОНАЛЬНИЙ РІК 8" тощо — формуємо пошуковий рядок
  const headingSearchMap = {
    lifePath: (v) => (typeof v === 'string' && v.startsWith('master') ? `МАЙСТЕР-ЧИСЛО ${v.replace('master', '')}` : `ЧИСЛО ДОЛІ ${v}`),
    birthdayNumber: (v) => `ЧИСЛО ДНЯ ${v}`,
    karmicDebt: (v) => (v === 'none' ? 'ВІДСУТНІСТЬ КАРМІЧНОГО БОРГУ' : `КАРМІЧНИЙ БОРГ ${v}`),
    personalCycle: (v) => `ПЕРСОНАЛЬНИЙ РІК ${v}`,
  };

  const headingFn = headingSearchMap[point];
  const searchText = headingFn ? headingFn(value) : String(value);

  const section = extractSection(content, searchText);
  if (!section) {
    console.warn(`Секцію "${searchText}" не знайдено у файлі ${fileName}`);
  }
  return section;
}

/** Отримати методологічний блок висновку для сегменту (не залежить від конкретного значення) */
function getConclusionMethodology(segment) {
  const key = `${segment}.conclusion`;
  const fileName = FILE_MAP[key];
  return readFile(fileName); // блоки висновків цілком невеликі, повертаємо весь файл/секцію
}

/**
 * Генеричний доступ: витягти секцію з довільного файлу бази за довільним
 * текстом заголовка. Потрібно для пунктів, де структура заголовків нестандартна
 * (напр. пари сумісності "1↔6", чи цілі методологічні пункти "Пункт 2.2").
 */
function getSectionByHeading(fileKey, headingText) {
  const fileName = FILE_MAP[fileKey];
  if (!fileName) throw new Error(`Немає файлу для ключа ${fileKey}`);
  const content = readFile(fileName);
  return extractSection(content, headingText);
}

/**
 * Спеціальна логіка для сумісності партнерів: спершу шукаємо явну пару
 * (напр. "1↔6" в гармонійних/напружених міжгрупових розділах), якщо не
 * знайдено — повертаємо секцію відповідної стихійної групи цілком (де
 * перелічені всі пари в межах групи як **1-1:**, **1-5:** тощо).
 */
function getCompatibilityFragment(lifePathA, lifePathB) {
  const fileName = FILE_MAP['love.compatibility'];
  const content = readFile(fileName);

  const pairDirect = extractSection(content, `${lifePathA}↔${lifePathB}`);
  if (pairDirect) return pairDirect;
  const pairReverse = extractSection(content, `${lifePathB}↔${lifePathA}`);
  if (pairReverse) return pairReverse;

  const ELEMENT_GROUPS = {
    'Група вогонь/повітря': [1, 5, 7],
    'Група земля': [2, 4, 8],
    'Група вода/творчість': [3, 6, 9],
  };
  const findGroup = (num) => {
    const base = num > 9 ? String(num).split('').reduce((a, b) => a + +b, 0) : num;
    return Object.entries(ELEMENT_GROUPS).find(([, nums]) => nums.includes(base))?.[0];
  };
  const groupA = findGroup(lifePathA);
  const groupSection = extractSection(content, groupA);
  return groupSection; // містить всі пари групи, включно з потрібною
}

/** Скинути кеш файлів (корисно в dev-режимі при редагуванні бази знань) */
function clearCache() {
  Object.keys(fileCache).forEach((k) => delete fileCache[k]);
}

module.exports = {
  getKnowledgeFragment,
  getConclusionMethodology,
  getSectionByHeading,
  getCompatibilityFragment,
  clearCache,
};
