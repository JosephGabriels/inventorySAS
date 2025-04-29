import { useState, useEffect } from 'react'
import {
  RiUserSettingsLine,
  RiNotification3Line,
  RiPaletteLine,
  RiBellLine,
  RiLockLine,
  RiGlobalLine,
  RiTeamLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiStore3Line,
  RiSave3Line,
  RiAlertLine,
} from 'react-icons/ri'
import { useAuth } from '../contexts/AuthContext'
import { 
  UserData, 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  businessSettingsAPI,
  BusinessSettings,
  userPasswordAPI
} from '../services/api'
import toast from 'react-hot-toast'
import { SecuritySection } from '../components/settings/SecuritySection'
import { UserManagementSection } from '../components/settings/UserManagementSection'

const settingsSections = [
  {
    id: 'business',
    name: 'Business Settings',
    icon: RiStore3Line,
    description: 'Configure your business information',
    adminOnly: true,
  },
  {
    id: 'profile',
    name: 'Profile Settings',
    icon: RiUserSettingsLine,
    description: 'Update your personal information and preferences',
    adminOnly: false,
  },
  {
    id: 'notifications',
    name: 'Notifications',
    icon: RiNotification3Line,
    description: 'Configure your notification preferences',
    adminOnly: false,
  },
  {
    id: 'appearance',
    name: 'Appearance',
    icon: RiPaletteLine,
    description: 'Customize the look and feel of your interface',
    adminOnly: false,
  },
  {
    id: 'alerts',
    name: 'Alert Settings',
    icon: RiBellLine,
    description: 'Set up inventory and stock alerts',
    adminOnly: false,
  },
  {
    id: 'security',
    name: 'Security',
    icon: RiLockLine,
    description: 'Manage your security preferences',
    adminOnly: false,
  },
  {
    id: 'system',
    name: 'System',
    icon: RiGlobalLine,
    description: 'Configure system-wide settings',
    adminOnly: false,
  },
  {
    id: 'users',
    name: 'User Management',
    icon: RiTeamLine,
    description: 'Add, edit, and remove system users',
    adminOnly: true,
  },
]

const formStyles = {
  wrapper: "max-w-md mx-auto bg-[#1a1f2e] rounded-xl shadow-lg border border-[#31394d]/50 p-6",
  warningAlert: "mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-3",
  inputGroup: "space-y-2 mb-6",
  label: "block text-sm font-medium text-gray-300",
  input: `w-full px-4 py-3 bg-[#151b29] border border-[#31394d] rounded-lg
    text-gray-100 placeholder-gray-500
    focus:ring-2 focus:ring-orange-500/50 focus:border-transparent
    transition-all duration-200`,
  button: `w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 
    hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg 
    transform transition-all duration-200 hover:scale-[1.02] 
    focus:ring-2 focus:ring-orange-500/50 focus:ring-offset-2 focus:ring-offset-[#1a1f2e]
    shadow-lg shadow-orange-500/20`
}

export const Settings = () => {
  const [activeSection, setActiveSection] = useState('profile')
  const { user, isAdmin } = useAuth()

  // Filter sections based on user role
  const filteredSections = settingsSections.filter(section => 
    !section.adminOnly || (section.adminOnly && isAdmin())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <div className="text-sm">
          <span className="text-gray-400">Current user:</span>
          <span className="text-white ml-2 font-medium">{user?.username}</span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections.map((section) => (
          <div
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className="bg-[#1a1f2e] p-4 rounded-xl border border-[#31394d]/50 
              hover:border-orange-500/30 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <section.icon className="text-xl text-orange-500" />
              </div>
              <div>
                <h3 className="font-medium text-white">{section.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{section.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Section Content */}
      {activeSection === 'security' && <SecuritySection user={user} />}
      {activeSection === 'users' && <UserManagementSection currentUser={user} />}
      {/* Add other sections similarly */}
    </div>
  )
}