import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  RiDashboardLine,
  RiArchiveLine,
  RiPriceTag3Line,
  RiUserSettingsLine,
  RiExchangeLine,
  RiFileChartLine,
  RiSettings4Line,
  RiShoppingCart2Line,
  RiBarChartBoxLine,
  RiFileListLine,
} from 'react-icons/ri'
import { useAuth } from '../../contexts/AuthContext'
import { useBusiness } from '../../contexts/BusinessContext'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
}

const NavItem = ({ to, icon, label }: NavItemProps) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        isActive
          ? 'bg-primary-500/10 text-primary-500'
          : 'text-gray-400 hover:bg-dark-700 hover:text-white'
      }`
    }
  >
    <span className="text-xl mr-3">{icon}</span>
    {label}
  </NavLink>
)

export const Sidebar = () => {
  const { user } = useAuth()
  const { businessSettings } = useBusiness()
  const [businessName, setBusinessName] = useState('Inventory Management System')
  
  useEffect(() => {
    if (businessSettings && businessSettings.business_name) {
      setBusinessName(businessSettings.business_name)
    }
  }, [businessSettings])
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: RiDashboardLine },
    { name: 'Point of Sale', href: '/point-of-sale', icon: RiShoppingCart2Line },
    { name: 'Sales History', href: '/sales', icon: RiFileListLine },
    { name: 'Products', href: '/products', icon: RiArchiveLine },
    { name: 'Categories', href: '/categories', icon: RiPriceTag3Line },
    { name: 'Suppliers', href: '/suppliers', icon: RiUserSettingsLine },
    { name: 'Stock Movements', href: '/stock-movements', icon: RiExchangeLine },
    { name: 'Reports', href: '/reports', icon: RiFileChartLine },
    { name: 'Dairy Reports', href: '/dairy-reports', icon: RiBarChartBoxLine },
    { name: 'Settings', href: '/settings', icon: RiSettings4Line },
  ]

  return (
    <div className="w-64 bg-dark-800 border-r border-dark-700 flex-shrink-0">
      <div className="h-16 flex items-center px-6">
        <h1 className="text-xl font-bold text-white">{businessName}</h1>
      </div>
      <nav className="mt-5 px-3 space-y-1">
        {navigation.map((item) => (
          <NavItem key={item.href} to={item.href} icon={<item.icon />} label={item.name} />
        ))}
      </nav>
      <div className="absolute bottom-0 w-64 p-4 bg-dark-800 border-t border-dark-700">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user ? user.first_name?.[0] + user.last_name?.[0] : "?"}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">
              {user ? `${user.first_name} ${user.last_name}` : 'Guest'}
            </p>
            <p className="text-xs text-gray-400">{user?.role || 'User'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}