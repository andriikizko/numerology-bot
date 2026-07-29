import admin from 'firebase-admin';

let db;

export function initFirebase() {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_PRIVATE_KEY_BASE64 || '', 'base64').toString() ||
      '{}'
    );

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }

    db = admin.firestore();
    console.log('✅ Firebase инициализирован');
  } catch (error) {
    console.error('❌ Firebase init error:', error.message);
    throw error;
  }
}

export async function getUser(tgId) {
  try {
    const doc = await db.collection('users').doc(String(tgId)).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function createUser(tgId, userData) {
  try {
    const userRef = db.collection('users').doc(String(tgId));
    await userRef.set({
      tg_id: tgId,
      tg_name: userData.tg_name || '',
      birth_date: userData.birth_date,
      path_number: userData.path_number,
      num_name: userData.num_name,
      created_at: admin.firestore.Timestamp.now(),
      report_purchased: false,
      report_purchased_at: null,
      horoscope_subscribed: false,
      horoscope_trial_until: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ),
      horoscope_paid_until: null,
      horoscope_enabled: true
    });
    return true;
  } catch (error) {
    console.error('Error creating user:', error);
    return false;
  }
}

export async function updateUserHoroscope(tgId, months = 1) {
  try {
    const paidUntil = new Date();
    paidUntil.setMonth(paidUntil.getMonth() + months);

    await db.collection('users').doc(String(tgId)).update({
      horoscope_subscribed: true,
      horoscope_paid_until: admin.firestore.Timestamp.fromDate(paidUntil)
    });
    return true;
  } catch (error) {
    console.error('Error updating horoscope:', error);
    return false;
  }
}

export async function activateReport(tgId) {
  try {
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30);

    await db.collection('users').doc(String(tgId)).update({
      report_purchased: true,
      report_purchased_at: admin.firestore.Timestamp.now(),
      horoscope_subscribed: true,
      horoscope_trial_until: admin.firestore.Timestamp.fromDate(trialEndDate)
    });
    return true;
  } catch (error) {
    console.error('Error activating report:', error);
    return false;
  }
}

export async function savePayment(tgId, paymentData) {
  try {
    const paymentRef = db.collection('users').doc(String(tgId)).collection('payments').doc();
    await paymentRef.set({
      order_id: paymentData.order_id,
      type: paymentData.type,
      amount: paymentData.amount,
      status: paymentData.status,
      liqpay_id: paymentData.liqpay_id,
      created_at: admin.firestore.Timestamp.now(),
      updated_at: admin.firestore.Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error saving payment:', error);
    return false;
  }
}

export async function saveHoroscopeSent(tgId, numName, pathNumber) {
  try {
    await db.collection('horoscopes_sent').doc().set({
      tg_id: tgId,
      num_name: numName,
      path_number: pathNumber,
      date: admin.firestore.Timestamp.now(),
      status: 'sent'
    });
  } catch (error) {
    console.error('Error saving horoscope log:', error);
  }
}

export async function saveSupportChat(tgId, tgName, numName, message) {
  try {
    await db.collection('support_chats').doc().set({
      tg_id: tgId,
      tg_name: tgName,
      num_name: numName,
      message: message,
      created_at: admin.firestore.Timestamp.now(),
      status: 'new'
    });
    return true;
  } catch (error) {
    console.error('Error saving support chat:', error);
    return false;
  }
}

export async function getAllUsersWithHoroscope() {
  try {
    const snapshot = await db.collection('users')
      .where('horoscope_subscribed', '==', true)
      .get();

    const users = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const now = new Date();
      
      const trialEnd = data.horoscope_trial_until?.toDate?.();
      const paidEnd = data.horoscope_paid_until?.toDate?.();
      
      const isActive = 
        (trialEnd && trialEnd > now) || 
        (paidEnd && paidEnd > now);

      if (isActive) {
        users.push(data);
      }
    });

    return users;
  } catch (error) {
    console.error('Error getting horoscope users:', error);
    return [];
  }
}

export async function getTotalStats() {
  try {
    const usersSnap = await db.collection('users').get();
    const paymentsSnap = await db.collection('users')
      .where('report_purchased', '==', true)
      .get();

    return {
      total_users: usersSnap.size,
      paid_users: paymentsSnap.size,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return null;
  }
}
