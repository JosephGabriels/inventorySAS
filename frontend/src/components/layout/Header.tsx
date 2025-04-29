import { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiNotification3Line,
  RiSunLine,
  RiMoonLine,
  RiLogoutBoxRLine,
} from 'react-icons/ri'
import { useAuth } from '../../contexts/AuthContext'
import { useBusiness } from '../../contexts/BusinessContext'
import { useNotifications } from '../../contexts/NotificationsContext'

export const Header = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { businessSettings } = useBusiness()
  const { notifications, unreadCount, markAsRead, removeNotification, clearAll } = useNotifications()
  const [isDark, setIsDark] = useState(true)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [businessName, setBusinessName] = useState('Inventory Management System')

  useEffect(() => {
    if (businessSettings && businessSettings.business_name) {
      setBusinessName(businessSettings.business_name)
      // Also update document title
      document.title = businessSettings.business_name
    }
  }, [businessSettings])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="h-16 bg-dark-800 border-b border-dark-700">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{businessName}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="relative p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={() => {
              setIsNotificationsOpen(true)
              markAsRead()
            }}
          >
            <span className="sr-only">View notifications</span>
            <RiNotification3Line className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 ring-2 ring-dark-800 text-xs text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
          >
            {isDark ? (
              <RiSunLine className="h-6 w-6" />
            ) : (
              <RiMoonLine className="h-6 w-6" />
            )}
          </button>

          <div className="h-6 w-px bg-dark-700" />

          <div className="flex items-center">
            <button
              type="button"
              className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span className="sr-only">Open user menu</span>
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user ? user.first_name?.[0] + user.last_name?.[0] : "?"}
                </span>
              </div>
            </button>
            <span className="ml-2 text-sm text-gray-300">
              {user ? `${user.first_name} ${user.last_name}` : 'Guest'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg flex items-center"
            title="Logout"
          >
            <RiLogoutBoxRLine className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Transition appear show={isNotificationsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsNotificationsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-start justify-end p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-96 transform overflow-hidden rounded-lg bg-dark-800 shadow-xl transition-all">
                  <div className="p-4 border-b border-dark-700">
                    <div className="flex justify-between items-center">
                      <Dialog.Title className="text-lg font-semibold text-white">
                        Stock Alerts
                      </Dialog.Title>
                      <button
                        onClick={clearAll}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Clear all
                      </button>
                    </div>
                  </div>

                  <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <span className="text-gray-400">No notifications</span>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-dark-700 ${
                            notification.type === 'error'
                              ? 'bg-red-500/10'
                              : 'bg-yellow-500/10'
                          }`}
                        >
                          <div className="flex justify-between">
                            <h3 className="font-medium text-white">
                              {notification.productName}
                            </h3>
                            <button
                              onClick={() => removeNotification(notification.productId)}
                              className="text-gray-400 hover:text-white"
                            >
                              ×
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-gray-300">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-400">
                              {new Date(notification.timestamp).toLocaleString()}
                            </span>
                            <button
                              onClick={() => {
                                navigate(`/products?id=${notification.productId}`)
                                setIsNotificationsOpen(false)
                              }}
                              className="text-sm text-primary-500 hover:text-primary-400"
                            >
                              View Product →
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </header>
  )
}