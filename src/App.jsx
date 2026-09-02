import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import PrivateLayout from './components/PrivateLayout'
import { CartProvider } from './context/CartContext'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/*"
            element={
              isLoggedIn ? (
                <PrivateLayout onLogout={() => setIsLoggedIn(false)} />
              ) : (
                <PublicLayout onLogin={() => setIsLoggedIn(true)} />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
