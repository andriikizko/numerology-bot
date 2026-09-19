// account.js
// Повне видалення акаунту користувача — документ + усі підколекції
// (calculations, sessions, people, purchases) рекурсивно.

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.deleteAccount = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'Потрібен userId' });
      return;
    }

    const userRef = db.collection('users').doc(userId);
    await db.recursiveDelete(userRef);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('deleteAccount error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});
