import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { productAPI } from '../services/api'
import toast from 'react-hot-toast'

interface StockNotification {
  id: string
  productId: number
  productName: string
  message: string
  type: 'warning' | 'error'
  timestamp: Date
  quantity: number
  threshold: number
}

interface NotificationsContextType {
  notifications: StockNotification[]
  unreadCount: number
  markAsRead: () => void
  removeNotification: (productId: number) => void
  clearAll: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<StockNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Define removeNotification function
  const removeNotification = useCallback((productId: number) => {
    setNotifications(prev => prev.filter(n => n.productId !== productId))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  // Define clearAll function
  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const checkStockLevels = useCallback(async () => {
    try {
      const products = await productAPI.getAll()
      products.forEach(product => {
        const threshold = product.minimum_stock || 10
        if (product.quantity <= threshold) {
          const existingNotification = notifications.find(n => n.productId === product.id)
          if (!existingNotification || existingNotification.quantity !== product.quantity) {
            const newNotification: StockNotification = {
              id: `stock-${product.id}-${Date.now()}`,
              productId: product.id,
              productName: product.name,
              quantity: product.quantity,
              threshold,
              message: product.quantity === 0
                ? `OUT OF STOCK: ${product.name} needs immediate restock!`
                : `Low stock warning: ${product.name} (${product.quantity}/${threshold} units)`,
              type: product.quantity === 0 ? 'error' : 'warning',
              timestamp: new Date()
            }

            setNotifications(prev => {
              const filtered = prev.filter(n => n.productId !== product.id)
              return [newNotification, ...filtered]
            })
            setUnreadCount(prev => prev + 1)
          }
        }
      })
    } catch (error) {
      console.error('Failed to check stock levels:', error)
    }
  }, [notifications])

  useEffect(() => {
    checkStockLevels()
    const interval = setInterval(checkStockLevels, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [checkStockLevels])

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead: () => setUnreadCount(0),
      removeNotification,
      clearAll
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider')
  }
  return context
}