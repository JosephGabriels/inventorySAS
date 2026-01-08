import { useState } from 'react'
import {
  RiUserSettingsLine,
  RiLockLine,
  RiTeamLine,
  RiStore3Line,
  RiSettings3Line,
  RiPaletteLine,
  RiNotification3Line,
  RiShieldCheckLine,
} from 'react-icons/ri'
import { useAuth } from '../contexts/AuthContext'
import { SecuritySection } from '../components/settings/SecuritySection'
import { UserManagementSection } from '../components/settings/UserManagementSection'
import { BusinessSection } from '../components/settings/BusinessSection'
import { ProfileSection } from '../components/settings/ProfileSection'

interface SettingsSection {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  adminOnly: boolean
  color: string
}

const settingsSections: SettingsSection[] = [
  {
    id: 'profile',
    name: 'Profile Settings',
    icon: RiUserSettingsLine,
    description: 'Manage your personal information and preferences',
    adminOnly: false,
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'security',
    name: 'Security',
    icon: RiLockLine,
    description: 'Password and security settings',
    adminOnly: false,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'business',
    name: 'Business Settings',
    icon: RiStore3Line,
    description: 'Configure your business information',
    adminOnly: true,
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'users',
    name: 'User Management',
    icon: RiTeamLine,
    description: 'Manage system users and permissions',
    adminOnly: true,
    color: 'from-orange-500 to-orange-600',
  },
]

export const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const { user, isAdmin } = useAuth()

  // Filter sections based on user role
  const filteredSections = settingsSections.filter(section => 
    !section.adminOnly || (section.adminOnly && isAdmin())
  )

  const activeConfig = settingsSections.find(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <div className="bg-dark-800/50 backdrop-blur-sm border-b border-dark-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <RiSettings3Line className="text-orange-500" />
                Settings
              </h1>
              <p className="text-gray-400 mt-1">Manage your account and system preferences</p>
            </div>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-dark-700/50 rounded-lg border border-dark-600">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-gray-400">@{user?.username}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 sticky top-24 overflow-hidden">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Navigation
              </h2>
              <nav className="space-y-2 overflow-y-auto max-h-[calc(100vh-12rem)]">
                {filteredSections.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? `bg-gradient-to-r ${section.color} text-white shadow-lg`
                          : 'text-gray-400 hover:text-white hover:bg-dark-700'
                      }`}
                    >
                      <Icon className={`text-xl ${isActive ? 'text-white' : ''}`} />
                      <span className="font-medium">{section.name}</span>
                    </button>
                  )
                })}
              </nav>

              {/* User Role Badge */}
              <div className="mt-6 pt-6 border-t border-dark-700">
                <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg">
                  <RiShieldCheckLine className="text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-400">Your Role</p>
                    <p className="text-sm font-medium text-white capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Section Header */}
            {activeConfig && (
              <div className="mb-6">
                <div className={`inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r ${activeConfig.color} rounded-xl shadow-lg`}>
                  <activeConfig.icon className="text-2xl text-white" />
                  <div>
                    <h2 className="text-xl font-bold text-white">{activeConfig.name}</h2>
                    <p className="text-sm text-white/80">{activeConfig.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 shadow-xl">
              {activeSection === 'profile' && <ProfileSection />}
              {activeSection === 'security' && <SecuritySection />}
              {activeSection === 'business' && <BusinessSection />}
              {activeSection === 'users' && <UserManagementSection currentUser={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
