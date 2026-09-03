import { BrowserRouter, Route, Routes } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import { CartProvider } from './context/CartContext'

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}

export default App
