import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebaseConfig'
import '../styles/pages.css'

const emptyCard = () => ({
  id: `card_${Date.now()}`,
  tag: '',
  title: '',
  desc: '',
  cta: 'Дізнатись',
  image: null,
  gradient: 'linear-gradient(135deg, #D64A7A 0%, #7a2a5a 55%, #3a1a40 100%)',
  overlayOpacity: 0.3,
})

export default function HomeCards() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'content', 'homeCards'))
        if (snap.exists() && Array.isArray(snap.data().cards)) {
          setCards(snap.data().cards)
        } else {
          setCards([emptyCard(), emptyCard()])
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateCard = (index, field, value) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
    setSaved(false)
  }

  const handleImageUpload = (index, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateCard(index, 'image', reader.result)
    reader.readAsDataURL(file)
  }

  const addCard = () => setCards((prev) => [...prev, emptyCard()])
  const removeCard = (index) => setCards((prev) => prev.filter((_, i) => i !== index))

  const handleSave = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'content', 'homeCards'), { cards })
      setSaved(true)
    } catch (e) {
      console.error(e)
      alert('Помилка збереження: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="page"><p>⏳ Завантаження…</p></div>
  }

  return (
    <div className="page">
      <h2>🖼️ Картки головного екрана</h2>
      <p style={{ color: '#888', marginBottom: 20 }}>
        Ці картки показуються в горизонтальному скролері "Для тебе" в Mini App.
      </p>

      {cards.map((card, i) => (
        <div key={card.id} className="card-editor" style={{
          border: '1px solid #333', borderRadius: 12, padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <strong>Картка {i + 1}</strong>
            <button onClick={() => removeCard(i)} style={{ color: '#e55', background: 'none', border: 'none', cursor: 'pointer' }}>
              ✕ Видалити
            </button>
          </div>

          <label>Тег (маленький підпис зверху)</label>
          <input type="text" value={card.tag} onChange={(e) => updateCard(i, 'tag', e.target.value)} style={{ width: '100%', marginBottom: 8 }} />

          <label>Заголовок</label>
          <input type="text" value={card.title} onChange={(e) => updateCard(i, 'title', e.target.value)} style={{ width: '100%', marginBottom: 8 }} />

          <label>Опис</label>
          <input type="text" value={card.desc} onChange={(e) => updateCard(i, 'desc', e.target.value)} style={{ width: '100%', marginBottom: 8 }} />

          <label>Текст кнопки</label>
          <input type="text" value={card.cta} onChange={(e) => updateCard(i, 'cta', e.target.value)} style={{ width: '100%', marginBottom: 8 }} />

          <label>Фото фону (замінює градієнт)</label>
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(i, e.target.files[0])} style={{ marginBottom: 8 }} />
          {card.image && (
            <div style={{ marginBottom: 8 }}>
              <img src={card.image} alt="" style={{ maxWidth: 200, borderRadius: 8 }} />
              <button onClick={() => updateCard(i, 'image', null)} style={{ marginLeft: 10 }}>Прибрати фото</button>
            </div>
          )}

          {card.image && (
            <>
              <label>Прозорість темної накладки на фото (0 = без накладки, 1 = чорне)</label>
              <input
                type="range" min="0" max="1" step="0.05"
                value={card.overlayOpacity || 0}
                onChange={(e) => updateCard(i, 'overlayOpacity', parseFloat(e.target.value))}
                style={{ width: '100%', marginBottom: 8 }}
              />
            </>
          )}

          {!card.image && (
            <>
              <label>CSS-градієнт фону (якщо без фото)</label>
              <input type="text" value={card.gradient} onChange={(e) => updateCard(i, 'gradient', e.target.value)} style={{ width: '100%', marginBottom: 8 }} />
            </>
          )}

          <div style={{
            marginTop: 12, borderRadius: 12, padding: 16, minHeight: 100,
            background: card.image
              ? `linear-gradient(rgba(0,0,0,${card.overlayOpacity || 0}), rgba(0,0,0,${card.overlayOpacity || 0})), url(${card.image}) center/cover`
              : card.gradient,
            color: '#fff',
          }}>
            <div style={{ fontSize: 11, opacity: 0.8, textTransform: 'uppercase' }}>{card.tag}</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{card.title}</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>{card.desc}</div>
          </div>
        </div>
      ))}

      <button onClick={addCard} style={{ marginRight: 12 }}>+ Додати картку</button>
      <button onClick={handleSave} disabled={saving} style={{ background: '#D64A7A', color: '#fff', padding: '8px 20px', border: 'none', borderRadius: 8 }}>
        {saving ? 'Збереження…' : saved ? '✓ Збережено' : 'Зберегти всі картки'}
      </button>
    </div>
  )
}
