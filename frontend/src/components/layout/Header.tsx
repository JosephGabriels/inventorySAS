import { useState, useEffect } from 'react'
import {
  RiSearchLine,
  RiNotification3Line,
  RiSunLine,
  RiMoonLine,
  RiLogoutBoxRLine,
} from 'react-icons/ri'
import { useAuth } from '../../contexts/AuthContext'
import { useBusiness } from '../../contexts/BusinessContext'

export const Header = () => {
  const { user, logout } = useAuth()
  const { businessSettings } = useBusiness()
  const [isDark, setIsDark] = useState(true)
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
        <div className="flex-1 flex items-center">
          <h1 className="text-xl font-bold text-white mr-4">{businessName}</h1>
          <div className="max-w-lg w-full lg:max-w-xs relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiSearchLine className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search inventory..."
              className="block w-full pl-10 pr-3 py-2 border border-dark-700 rounded-md leading-5 bg-dark-900 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-dark-800 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="ml-4 flex items-center space-x-4">
          <button
            type="button"
            className="relative p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <span className="sr-only">View notifications</span>
            <RiNotification3Line className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-primary-500 ring-2 ring-dark-800" />
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
            className="ml-4 p-2 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg flex items-center"
            title="Logout"
          >
            <RiLogoutBoxRLine className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  )
}