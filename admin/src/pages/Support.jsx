import { useEffect, useState } from 'react'
import { getSupportChats, updateSupportChatStatus } from '../services/adminService'
import '../styles/pages.css'

export default function Support() {
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('new')
  const [selectedChat, setSelectedChat] = useState(null)

  useEffect(() => {
    async function loadChats() {
      const data = await getSupportChats()
      setChats(data)
      setLoading(false)
    }
    loadChats()
  }, [])

  const filtered = chats.filter(chat => {
    if (filter === 'new') return chat.status === 'new'
    if (filter === 'resolved') return chat.status === 'resolved'
    return true
  })

  async function handleStatusChange(chatId, newStatus) {
    const success = await updateSupportChatStatus(chatId, newStatus)
    if (success) {
      setChats(chats.map(c => 
        c.id === chatId ? { ...c, status: newStatus } : c
      ))
      if (selectedChat?.id === chatId) {
        setSelectedChat({ ...selectedChat, status: newStatus })
      }
    }
  }

  if (loading) {
    return <div className="page"><p>⏳ Завантаження чатів...</p></div>
  }

  return (
    <div className="page">
      <h2>💬 Підтримка користувачів ({filtered.length})</h2>

      <div className="filters">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Всі запити</option>
          <option value="new">🆕 Нові</option>
          <option value="resolved">✅ Вирішені</option>
        </select>
      </div>

      <div className="support-container">
        <div className="chats-list">
          {filtered.map(chat => (
            <div 
              key={chat.id}
              className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
              onClick={() => setSelectedChat(chat)}
            >
              <div className="chat-header">
                <div className="chat-user">
                  <strong>{chat.num_name}</strong>
                  <span className="chat-id">#{chat.tg_id}</span>
                </div>
                <div className={`chat-badge ${chat.status}`}>
                  {chat.status === 'new' ? '🆕 Новий' : '✅ Вирішений'}
                </div>
              </div>
              <div className="chat-preview">{chat.message?.slice(0, 50)}...</div>
              <div className="chat-date">
                {chat.created_at?.toDate?.().toLocaleDateString('uk-UA')}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-detail">
          {selectedChat ? (
            <>
              <div className="detail-header">
                <div>
                  <h3>{selectedChat.num_name}</h3>
                  <p className="tg-link">@{selectedChat.tg_id}</p>
                </div>
                <div className={`status-badge ${selectedChat.status}`}>
                  {selectedChat.status === 'new' ? '🆕 Новий' : '✅ Вирішений'}
                </div>
              </div>

              <div className="message-box">
                <p>{selectedChat.message}</p>
              </div>

              <div className="detail-footer">
                <div className="date-info">
                  Отримано: {selectedChat.created_at?.toDate?.().toLocaleDateString('uk-UA')}
                </div>
                <div className="actions">
                  {selectedChat.status === 'new' ? (
                    <button 
                      onClick={() => handleStatusChange(selectedChat.id, 'resolved')}
                      className="btn btn-success"
                    >
                      ✅ Позначити як вирішено
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange(selectedChat.id, 'new')}
                      className="btn btn-neutral"
                    >
                      🔄 Повернути в новi
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Обрати запит підтримки для перегляду</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
