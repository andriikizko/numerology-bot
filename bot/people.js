// people.js
// Профілі "інших людей" — для замовлення розрахунку не собі, а комусь ще
// (наприклад, дитині чи партнеру). Зберігаються в users/{userId}/people/{personId}.

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const db = admin.firestore();

exports.addPerson = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { userId, name, birthDate, motherBirthDate, fatherBirthDate, partnerBirthDate } = req.body;
    if (!userId || !name || !birthDate) {
      res.status(400).json({ error: "Потрібні userId, name, birthDate" });
      return;
    }

    const personRef = db.collection('users').doc(userId).collection('people').doc();
    const person = {
      name,
      birthDate,
      motherBirthDate: motherBirthDate || null,
      fatherBirthDate: fatherBirthDate || null,
      partnerBirthDate: partnerBirthDate || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await personRef.set(person);

    res.status(200).json({ personId: personRef.id, ...person });
  } catch (error) {
    console.error('addPerson error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

exports.getPeople = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const { userId } = req.query;
    if (!userId) {
      res.status(400).json({ error: 'Потрібен userId' });
      return;
    }
    const snap = await db.collection('users').doc(userId).collection('people').get();
    const people = snap.docs.map((d) => ({ personId: d.id, ...d.data() }));
    res.status(200).json({ people });
  } catch (error) {
    console.error('getPeople error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

exports.updatePerson = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { userId, personId, ...fields } = req.body;
    if (!userId || !personId) {
      res.status(400).json({ error: 'Потрібні userId, personId' });
      return;
    }
    await db.collection('users').doc(userId).collection('people').doc(personId).set(fields, { merge: true });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('updatePerson error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});
