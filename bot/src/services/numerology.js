const NUM_NAMES = {
  1: 'Лідер',
  2: 'Дипломат',
  3: 'Творець',
  4: 'Практик',
  5: 'Дослідник',
  6: 'Опікун',
  7: 'Філософ',
  8: 'Амбіціозний',
  9: 'Учитель',
  11: 'Визіонер',
  22: 'Архітектор',
  33: 'Учитель Вознесіння'
};

const NUM_DESCRIPTIONS = {
  1: 'Природний лідер, активний, незалежний',
  2: 'Чутливий, миролюбивий, дипломатичний',
  3: 'Творчий, комунікабельний, оптимістичний',
  4: 'Надійний, практичний, трудолюбивий',
  5: 'Свободолюбивий, адаптивний, енергійний',
  6: 'Відповідальний, турботливий, стабільний',
  7: 'Аналітичний, духовний, інтуїтивний',
  8: 'Амбіціозний, впевнений, матеріально успішний',
  9: 'Мудрий, милосердний, універсальний',
  11: 'Вдохновенний, чутливий, духовний учитель',
  22: 'Великий будівничий, вплив на світ',
  33: 'Вищий рівень любові та служіння'
};

export function parseDate(dateString) {
  const regex = /(\d{1,2})\.(\d{1,2})\.(\d{4})/;
  const match = dateString.trim().match(regex);
  
  if (!match) return null;
  
  const day = parseInt(match[1]);
  const month = parseInt(match[2]);
  const year = parseInt(match[3]);
  
  const date = new Date(year, month - 1, day);
  
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  
  if (date > new Date()) {
    return null;
  }
  
  if (year < 1900) {
    return null;
  }
  
  return {
    day,
    month,
    year,
    iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  };
}

export function calculatePathNumber(date) {
  const dateStr = date.iso;
  const [year, month, day] = dateStr.split('-').map(Number);
  
  let sum = day + month + year;
  
  while (sum >= 10 && ![11, 22, 33].includes(sum)) {
    sum = String(sum).split('').reduce((a, b) => a + parseInt(b), 0);
  }
  
  return sum;
}

export function getNumName(number) {
  return NUM_NAMES[number] || 'Невідомо';
}

export function getNumDescription(number) {
  return NUM_DESCRIPTIONS[number] || 'Узнайте більше про своє число';
}

export function getAllNumbers() {
  return Object.keys(NUM_NAMES).map(num => ({
    number: parseInt(num),
    name: NUM_NAMES[num],
    description: NUM_DESCRIPTIONS[num]
  }));
}
