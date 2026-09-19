// session.js
// "Сеанс" — асинхронна генерація ВСІХ 5 пунктів сегмента одразу після оплати.
// Мінімальна тривалість 7 хвилин (свідома преміальна пауза), сповіщення на email
// після завершення. Firestore-документ у sessions/{sessionId} — тригер запускає
// фонову обробку, що НЕ прив'язана до тривалості HTTP-запиту.

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const gc = require('./generateCalculation.js');

const db = admin.firestore();

const MIN_SESSION_DURATION_MS = 7 * 60 * 1000; // 7 хвилин

// ⚠️ Потрібен ключ від Resend (https://resend.com) — без нього email не надсилається,
// лише пишеться в лог. Домен відправника має бути верифікований у Resend.
const RESEND_API_KEY = 'ВСТАВ_СЮДИ_СВІЙ_RESEND_API_KEY';
const EMAIL_FROM = 'Numira <noreply@numira.app>';

// ---------- startSession: валідація + створення job-документа, відповідає одразу ----------
exports.startSession = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const { userId, segment, personId } = req.body;
    if (!userId || !segment) {
      res.status(400).json({ error: 'Потрібні userId, segment' });
      return;
    }
    if (!gc.SEGMENT_POINTS[segment]) {
      res.status(400).json({ error: `Невідомий сегмент: ${segment}` });
      return;
    }

    const hasAccess = await gc.checkUserPurchase(userId, segment);
    if (!hasAccess) {
      res.status(402).json({ error: 'Цей розрахунок ще не оплачено', needsPayment: true });
      return;
    }

    let dates;
    let ownerLabel = 'self';

    if (personId) {
      const personDoc = await db.collection('users').doc(userId).collection('people').doc(personId).get();
      if (!personDoc.exists) {
        res.status(404).json({ error: 'Профіль людини не знайдено' });
        return;
      }
      const p = personDoc.data();
      if (!p.birthDate || !p.motherBirthDate || !p.fatherBirthDate) {
        res.status(412).json({ error: "Не всі обов'язкові дати заповнені для цієї людини" });
        return;
      }
      if (segment === 'love' && !p.partnerBirthDate) {
        res.status(412).json({ error: 'Потрібна дата народження партнера' });
        return;
      }
      dates = {
        userDate: p.birthDate,
        motherDate: p.motherBirthDate,
        fatherDate: p.fatherBirthDate,
        partnerDate: p.partnerBirthDate || null,
      };
      ownerLabel = personId;
    } else {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        res.status(404).json({ error: 'Користувача не знайдено' });
        return;
      }
      const u = userDoc.data();
      if (!u.birthDate || !u.motherBirthDate || !u.fatherBirthDate) {
        res.status(412).json({ error: "Не всі обов'язкові дати заповнені (своя, мами, тата)" });
        return;
      }
      let partnerDate = null;
      if (segment === 'love') {
        if (!u.partnerBirthDate) {
          res.status(412).json({ error: 'Потрібна дата народження партнера' });
          return;
        }
        partnerDate = u.partnerBirthDate;
      }
      dates = { userDate: u.birthDate, motherDate: u.motherBirthDate, fatherDate: u.fatherBirthDate, partnerDate };
    }

    const sessionId = `${segment}_${ownerLabel}`;
    const sessionRef = db.collection('users').doc(userId).collection('sessions').doc(sessionId);

    const existing = await sessionRef.get();
    if (existing.exists && existing.data().status === 'processing') {
      res.status(200).json({ sessionId, status: 'processing' });
      return;
    }
    if (existing.exists && existing.data().status === 'ready') {
      res.status(200).json({ sessionId, status: 'ready' });
      return;
    }

    await sessionRef.set({
      segment,
      personId: personId || null,
      dates,
      status: 'processing',
      progress: 0,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ sessionId, status: 'processing' });
  } catch (error) {
    console.error('startSession error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ---------- processSession: Firestore-тригер, фонова обробка (не прив'язана до HTTP) ----------
exports.processSession = functions
  .runWith({ timeoutSeconds: 540, memory: '256MB' })
  .firestore.document('users/{userId}/sessions/{sessionId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const { segment, personId, dates } = snap.data();
    const points = gc.SEGMENT_POINTS[segment];
    const sessionRef = snap.ref;
    const startedAt = Date.now();

    try {
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const cacheKey = personId ? `${personId}_${segment}_${point}` : `${segment}_${point}`;
        const cacheRef = db.collection('users').doc(userId).collection('calculations').doc(cacheKey);

        const cached = await cacheRef.get();
        if (!cached.exists) {
          const { resultValue, numbersText, kbFragment } = gc.PREPARE_FN[segment](point, dates);
          if (kbFragment) {
            const isFree = gc.FREE_POINTS[segment] === point;
            const userPrompt = gc.buildUserPrompt({
              segmentLabel: gc.SEGMENT_LABELS[segment],
              pointLabel: gc.POINT_LABELS[point],
              accessLabel: isFree ? '🆓 безкоштовний' : '🔒 оплачений',
              numbersText,
              kbFragment,
            });
            const text = await gc.callGemini(userPrompt);
            await cacheRef.set({
              segment,
              point,
              resultValue,
              text,
              personId: personId || null,
              generatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }

        await sessionRef.update({ progress: Math.round(((i + 1) / points.length) * 90) });
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SESSION_DURATION_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_SESSION_DURATION_MS - elapsed));
      }

      await sessionRef.update({
        status: 'ready',
        progress: 100,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const userDoc = await db.collection('users').doc(userId).get();
      const email = userDoc.exists ? userDoc.data().email : null;
      if (email) {
        await sendReadyEmail(email, gc.SEGMENT_LABELS[segment]).catch((e) =>
          console.error('email send failed:', e)
        );
      }
    } catch (error) {
      console.error('processSession error:', error);
      await sessionRef.update({ status: 'error', error: String(error) });
    }
  });

// ---------- getSession: статус для polling з фронтенду ----------
exports.getSession = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const { userId, sessionId } = req.query;
    if (!userId || !sessionId) {
      res.status(400).json({ error: 'Потрібні userId, sessionId' });
      return;
    }
    const doc = await db.collection('users').doc(userId).collection('sessions').doc(sessionId).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Сесію не знайдено' });
      return;
    }
    const { dates, ...safe } = doc.data();
    res.status(200).json(safe);
  } catch (error) {
    console.error('getSession error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ---------- getProductStatus: оплата + стан сесії одним запитом ----------
exports.getProductStatus = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const { userId, segment, personId } = req.query;
    if (!userId || !segment) {
      res.status(400).json({ error: 'Потрібні userId, segment' });
      return;
    }

    const purchased = await gc.checkUserPurchase(userId, segment);
    const sessionId = `${segment}_${personId || 'self'}`;
    const sessionDoc = await db.collection('users').doc(userId).collection('sessions').doc(sessionId).get();

    res.status(200).json({
      purchased,
      sessionId,
      session: sessionDoc.exists
        ? { status: sessionDoc.data().status, progress: sessionDoc.data().progress || 0 }
        : null,
    });
  } catch (error) {
    console.error('getProductStatus error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ---------- getSessionResults: усі 5 готових пунктів сесії (self або persionId) ----------
exports.getSessionResults = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const { userId, segment, personId } = req.query;
    if (!userId || !segment) {
      res.status(400).json({ error: 'Потрібні userId, segment' });
      return;
    }
    const points = gc.SEGMENT_POINTS[segment];
    if (!points) {
      res.status(400).json({ error: `Невідомий сегмент: ${segment}` });
      return;
    }

    const results = [];
    for (const point of points) {
      const cacheKey = personId ? `${personId}_${segment}_${point}` : `${segment}_${point}`;
      const doc = await db.collection('users').doc(userId).collection('calculations').doc(cacheKey).get();
      if (doc.exists) {
        const { point: p, resultValue, text } = doc.data();
        results.push({ point: p, resultValue, text });
      }
    }

    res.status(200).json({ results });
  } catch (error) {
    console.error('getSessionResults error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ---------- getCalculations: список готових розрахунків для "Мої розрахунки" ----------
exports.getCalculations = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  try {
    const { userId } = req.query;
    if (!userId) {
      res.status(400).json({ error: 'Потрібен userId' });
      return;
    }

    const sessionsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('sessions')
      .where('status', '==', 'ready')
      .get();

    const results = sessionsSnap.docs.map((d) => {
      const data = d.data();
      return {
        sessionId: d.id,
        segment: data.segment,
        personId: data.personId || null,
        completedAt: data.completedAt ? data.completedAt.toDate().toISOString() : null,
      };
    });

    res.status(200).json({ calculations: results });
  } catch (error) {
    console.error('getCalculations error:', error);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ---------- Email через Resend API ----------
async function sendReadyEmail(to, segmentLabel) {
  if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('ВСТАВ')) {
    console.log('RESEND_API_KEY не задано — email не надіслано (лише лог)');
    return;
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: `Твій розрахунок "${segmentLabel}" готовий 🔮`,
      html: `<p>Вітаємо!</p><p>Твій персональний нумерологічний розрахунок «${segmentLabel}» готовий. Відкрий застосунок Numira, щоб переглянути результат.</p>`,
    }),
  });
}
