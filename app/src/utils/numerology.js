// Локальний (клієнтський) розрахунок числа долі — лише для миттєвого показу
// в ID-картці на головному екрані, поки бекенд рахує точний текстовий розбір.
// Формат дати: YYYY-MM-DD
export function calcLifePathLocal(dateStr) {
  if (!dateStr) return null
  const digits = dateStr.replace(/-/g, '')
  let sum = digits.split('').reduce((a, b) => a + parseInt(b, 10), 0)
  while (sum > 9 && ![11, 22, 33].includes(sum)) {
    sum = String(sum).split('').reduce((a, b) => a + parseInt(b, 10), 0)
  }
  return sum
}

const LIFE_PATH_LABELS = {
  1: 'Лідер', 2: 'Миротворець', 3: 'Творець', 4: 'Будівник', 5: 'Шукач',
  6: 'Опікун', 7: 'Філософ', 8: 'Повелитель', 9: 'Гуманіст',
  11: 'Візіонер', 22: 'Архітектор', 33: 'Наставник',
}

export function lifePathLabel(num) {
  return LIFE_PATH_LABELS[num] || ''
}

// 10 продуктів меню «Розрахувати». Лише ті, що мають segment,
// реально порахуються через generateCalculation (бекенд поки підтримує
// тільки general/love/money) — решта показують заглушку «Незабаром».
export const PRODUCTS = [
  { id: 'general', segment: 'general', title: 'Персональний розрахунок', desc: 'Повний код за датою народження', priceOld: 630, priceNew: 129 },
  { id: 'ancestry', segment: null, title: 'Призначення роду', desc: 'Родовий код і успадковані таланти', priceOld: 900, priceNew: 351 },
  { id: 'love', segment: 'love', title: 'Кохання', desc: 'Сумісність, кармічні уроки стосунків', priceOld: 900, priceNew: 351 },
  { id: 'pair', segment: null, title: 'Сумісність пари', desc: 'Повна матриця двох людей', priceOld: 900, priceNew: 351 },
  { id: 'family', segment: null, title: 'Гармонія в сім\'ї', desc: 'Код стосунків між рідними', priceOld: 900, priceNew: 351 },
  { id: 'money', segment: 'money', title: 'Гроші', desc: 'Грошовий потік і фінансовий код', priceOld: 900, priceNew: 351 },
  { id: 'career', segment: null, title: 'Робота та кар\'єра', desc: 'Твій професійний код успіху', priceOld: 900, priceNew: 351 },
  { id: 'personalYear', segment: null, title: 'Персональний рік', desc: 'Енергія поточного 9-річного циклу', priceOld: 900, priceNew: 351 },
  { id: 'babyName', segment: null, title: 'Ім\'я для дитини', desc: 'Число імені в гармонії з долею', priceOld: 900, priceNew: 351 },
  { id: 'luckyDate', segment: null, title: 'Вдала дата', desc: 'Найкращий день для важливої події', priceOld: 900, priceNew: 351 },
]
