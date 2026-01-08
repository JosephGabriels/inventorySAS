import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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
  RiMoneyDollarCircleLine,
  RiUser3Line,
} from 'react-icons/ri'

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
}

const NavItem = ({ to, icon, label, end = false }: { to: string; icon: React.ReactNode; label: string; end?: boolean }) => (
  <NavLink
    to={to}
    end={end}
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
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: RiDashboardLine },
    { name: 'Point of Sale', href: '/point-of-sale', icon: RiShoppingCart2Line },
    { name: 'Cash', href: '/cash', icon: RiMoneyDollarCircleLine },
    { name: 'Sales History', href: '/sales', icon: RiFileListLine },
    { name: 'Products', href: '/products', icon: RiArchiveLine },
    { name: 'Categories', href: '/categories', icon: RiPriceTag3Line },
    { name: 'Suppliers', href: '/suppliers', icon: RiUserSettingsLine },
    { name: 'Customers', href: '/customers', icon: RiUser3Line },
    { name: 'Stock Movements', href: '/stock-movements', icon: RiExchangeLine },
    { name: 'Reports', href: '/reports', icon: RiFileChartLine },
    { name: 'Dairy Reports', href: '/dairy-reports', icon: RiBarChartBoxLine },
    { name: 'Settings', href: '/settings', icon: RiSettings4Line },
  ]

  return (
    <div className="w-64 bg-dark-800 border-r border-dark-700 flex-shrink-0">
      <nav className="mt-5 px-3 space-y-1">
        {navigation.map((item) => (
          <NavItem key={item.href} to={item.href} icon={<item.icon />} label={item.name} end={item.href === '/'} />
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