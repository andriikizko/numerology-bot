import { useState, useEffect } from 'react'
import Loading from './components/Loading'
import Registration from './components/Registration'
import Survey from './components/Survey'
import Calculating from './components/Calculating'
import Home from './components/Home'
import ProductDetail from './components/ProductDetail'
import MyData from './components/MyData'
import MyCalculations from './components/MyCalculations'
import AddPerson from './components/AddPerson'
import { API } from './services/api'

// stage: 'boot' | 'loading' | 'registration' | 'survey' | 'calculating' | 'app'
// view (only when stage === 'app'): 'home' | 'product' | 'myData' | 'myCalculations' | 'addPerson'
const App = () => {
  const [user, setUser] = useState(null)
  const [stage, setStage] = useState('boot')
  const [view, setView] = useState('home')
  const [activeProduct, setActiveProduct] = useState(null)
  const [activeTarget, setActiveTarget] = useState('self')
  const [addPersonReturnView, setAddPersonReturnView] = useState('myData')
  const [peopleVersion, setPeopleVersion] = useState(0)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    let userId = null

    if (tg && tg.initDataUnsafe?.user) {
      tg.expand()
      tg.ready()
      userId = tg.initDataUnsafe.user.id
    } else {
      userId = localStorage.getItem('numerology_user_id')
    }

    if (userId) {
      loadUserData(userId)
    } else {
      setStage('loading')
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId && stage === 'app') {
        loadUserData(userId, true)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadUserData = async (userId, silent = false) => {
    try {
      const response = await fetch(`${API.getUser}?id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        if (!silent) {
          setStage(data.birthDate ? 'app' : 'survey')
        }
      } else if (!silent) {
        setStage('loading')
      }
    } catch (error) {
      console.error('Помилка завантаження:', error)
      if (!silent) setStage('loading')
    }
  }

  const handleLoadingDone = () => setStage('registration')

  const handleRegistered = (userData) => {
    setUser(userData)
    setStage('survey')
  }

  const handleSurveyFinished = (userData) => {
    setUser(userData)
    setStage('calculating')
  }

  const handleCalculatingDone = () => {
    setStage('app')
    setView('home')
  }

  const handleUserUpdate = (updatedUser) => setUser(updatedUser)

  const openProduct = (product, personId) => {
    setActiveProduct(product)
    setActiveTarget(personId || 'self')
    setView('product')
  }
  const backToHome = () => setView('home')

  const openAddPerson = (returnView) => {
    setAddPersonReturnView(returnView)
    setView('addPerson')
  }
  const handlePersonSaved = () => {
    setPeopleVersion((v) => v + 1)
    setView(addPersonReturnView)
  }

  if (stage === 'boot') return null
  if (stage === 'loading') return <Loading onDone={handleLoadingDone} />
  if (stage === 'registration') return <Registration onRegister={handleRegistered} />
  if (stage === 'survey') return <Survey user={user} onFinish={handleSurveyFinished} />
  if (stage === 'calculating') return <Calculating user={user} onDone={handleCalculatingDone} />

  // stage === 'app'
  return (
    <div className="app-frame">
      {view === 'home' && (
        <Home
          user={user}
          onOpenProduct={openProduct}
          onOpenMyData={() => setView('myData')}
          onOpenMyCalculations={() => setView('myCalculations')}
        />
      )}
      {view === 'product' && (
        <ProductDetail
          key={`${activeProduct?.id}_${activeTarget}_${peopleVersion}`}
          user={user}
          product={activeProduct}
          initialTarget={activeTarget}
          peopleVersion={peopleVersion}
          onUserUpdate={handleUserUpdate}
          onBack={backToHome}
          onAddPerson={() => openAddPerson('product')}
        />
      )}
      {view === 'myData' && (
        <MyData
          user={user}
          peopleVersion={peopleVersion}
          onUserUpdate={handleUserUpdate}
          onBack={backToHome}
          onAddPerson={() => openAddPerson('myData')}
        />
      )}
      {view === 'myCalculations' && (
        <MyCalculations user={user} onOpenProduct={openProduct} onBack={backToHome} />
      )}
      {view === 'addPerson' && (
        <AddPerson user={user} onSaved={handlePersonSaved} onBack={() => setView(addPersonReturnView)} />
      )}
    </div>
  )
}

export default App
