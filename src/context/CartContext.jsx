import { useMemo, useState } from 'react'
import CartContext from './cart-context'
const DELIVERY_FEE = 4.99
const TAX_RATE = 0.08

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = (product, variant, quantity = 1) => {
    setItems((currentItems) => {
      const itemKey = `${product.slug}-${variant.size}`
      const existingItem = currentItems.find((item) => item.key === itemKey)

      if (existingItem) {
        return currentItems.map((item) =>
          item.key === itemKey ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }

      return [
        ...currentItems,
        {
          key: itemKey,
          slug: product.slug,
          title: product.title,
          category: product.category,
          size: variant.size,
          sizeLabel: variant.label,
          price: Number(variant.price),
          image: variant.image,
          quantity,
        },
      ]
    })
  }

  const updateQuantity = (key, quantity) => {
    setItems((currentItems) =>
      quantity < 1
        ? currentItems.filter((item) => item.key !== key)
        : currentItems.map((item) => (item.key === key ? { ...item, quantity } : item)),
    )
  }

  const removeItem = (key) => updateQuantity(key, 0)
  const clearCart = () => setItems([])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const delivery = items.length ? DELIVERY_FEE : 0
    const tax = subtotal * TAX_RATE

    return {
      subtotal,
      delivery,
      tax,
      total: subtotal + delivery + tax,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    }
  }, [items])

  const value = { items, addItem, updateQuantity, removeItem, clearCart, ...totals }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

