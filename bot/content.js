// content.js
// Контент, що редагується через Admin Panel (Firestore напряму), а Mini App
// читає через цей публічний GET-ендпоінт (без Firebase SDK на фронті).

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

// Дефолтні картки, якщо в Firestore ще нічого не налаштовано через адмінку
const DEFAULT_HOME_CARDS = [
  {
    id: 'marathon',
    tag: 'Друга воронка',
    title: 'Марафон успіху',
    desc: 'Скоро — програма для глибшої трансформації',
    cta: 'Дізнатись',
    image: null,
    gradient: 'linear-gradient(135deg, #D64A7A 0%, #7a2a5a 55%, #3a1a40 100%)',
    overlayOpacity: 0,
  },
  {
    id: 'numerolog',
    tag: 'Консультація',
    title: 'Записатися на сеанс нумеролога',
    desc: 'Живе спілкування з фахівцем',
    cta: 'Записатись',
    image: null,
    gradient: 'linear-gradient(160deg, #4a3418 0%, #241c10 60%, #0d0d0d 100%)',
    overlayOpacity: 0,
  },
];

exports.getHomeCards = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const snap = await db.collection('content').doc('homeCards').get();
    if (snap.exists && Array.isArray(snap.data().cards) && snap.data().cards.length > 0) {
      res.status(200).json({ cards: snap.data().cards });
      return;
    }
    res.status(200).json({ cards: DEFAULT_HOME_CARDS });
  } catch (error) {
    console.error('getHomeCards error:', error);
    res.status(200).json({ cards: DEFAULT_HOME_CARDS });
  }
});
