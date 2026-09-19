import { useEffect } from 'react'

const Loading = ({ onDone }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="screen loading-screen">
      <div className="loading-content">
        <div className="loading-headline fade-in">
          Знайдемо та розшифруємо<br />твій особистий код успіху…
        </div>
        <div className="loading-subtitle fade-in">Числа мають значення</div>
        <div className="loading-appname fade-in">Numira app</div>
        <div className="loading-mark fade-in"><img src="/logo-pink.png" alt="Numira" /></div>
      </div>
    </div>
  )
}

export default Loading
