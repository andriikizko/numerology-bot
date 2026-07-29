import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  where,
  orderBy,
  limit,
  QueryConstraint
} from 'firebase/firestore'
import { db } from './firebaseConfig'

export async function getAllUsers() {
  try {
    const snapshot = await getDocs(collection(db, 'users'))
    const users = []
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() })
    })
    return users.sort((a, b) => b.created_at?.toDate?.() - a.created_at?.toDate?.())
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

export async function getUserDetails(userId) {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId))
    if (docSnap.exists()) {
      const user = { id: docSnap.id, ...docSnap.data() }
      
      const paymentsSnap = await getDocs(
        collection(db, 'users', userId, 'payments')
      )
      user.payments = []
      paymentsSnap.forEach(doc => {
        user.payments.push({ id: doc.id, ...doc.data() })
      })
      
      return user
    }
    return null
  } catch (error) {
    console.error('Error fetching user details:', error)
    return null
  }
}

export async function getAllPayments() {
  try {
    const users = await getAllUsers()
    const allPayments = []

    for (const user of users) {
      try {
        const snapshot = await getDocs(
          collection(db, 'users', user.id, 'payments')
        )
        snapshot.forEach(doc => {
          allPayments.push({
            id: doc.id,
            user_id: user.id,
            user_name: user.num_name,
            tg_id: user.tg_id,
            ...doc.data()
          })
        })
      } catch (e) {
        console.error(`Error fetching payments for user ${user.id}:`, e)
      }
    }

    return allPayments.sort((a, b) => b.created_at?.toDate?.() - a.created_at?.toDate?.())
  } catch (error) {
    console.error('Error fetching all payments:', error)
    return []
  }
}

export async function getSupportChats() {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'support_chats'),
        orderBy('created_at', 'desc'),
        limit(100)
      )
    )
    const chats = []
    snapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() })
    })
    return chats
  } catch (error) {
    console.error('Error fetching support chats:', error)
    return []
  }
}

export async function updateSupportChatStatus(chatId, status) {
  try {
    await updateDoc(doc(db, 'support_chats', chatId), { status })
    return true
  } catch (error) {
    console.error('Error updating chat status:', error)
    return false
  }
}

export async function getAnalytics() {
  try {
    const users = await getAllUsers()
    const payments = await getAllPayments()

    const totalUsers = users.length
    const paidUsers = users.filter(u => u.report_purchased).length
    const horoscopeUsers = users.filter(u => u.horoscope_subscribed).length
    
    const totalRevenue = payments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const successPayments = payments.filter(p => p.status === 'success').length
    const failedPayments = payments.filter(p => p.status === 'failure').length

    return {
      total_users: totalUsers,
      paid_users: paidUsers,
      horoscope_users: horoscopeUsers,
      total_revenue: totalRevenue,
      success_payments: successPayments,
      failed_payments: failedPayments,
      conversion_rate: totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0
    }
  } catch (error) {
    console.error('Error calculating analytics:', error)
    return null
  }
}

export async function getDailyStats() {
  try {
    const users = await getAllUsers()
    const payments = await getAllPayments()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayUsers = users.filter(u => {
      const createdAt = u.created_at?.toDate?.()
      return createdAt && createdAt >= today
    })

    const todayPayments = payments.filter(p => {
      const createdAt = p.created_at?.toDate?.()
      return createdAt && createdAt >= today && p.status === 'success'
    })

    const todayRevenue = todayPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    return {
      new_users: todayUsers.length,
      new_payments: todayPayments.length,
      daily_revenue: todayRevenue
    }
  } catch (error) {
    console.error('Error calculating daily stats:', error)
    return null
  }
}
