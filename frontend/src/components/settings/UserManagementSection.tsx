import { useState, useEffect } from 'react'
import { 
  RiAddLine, 
  RiEditLine, 
  RiDeleteBinLine,
  RiSearchLine,
  RiUserLine,
  RiShieldUserLine,
  RiTeamLine,
  RiCheckLine,
  RiCloseLine,
  RiToggleLine,
  RiUserSettingsLine
} from 'react-icons/ri'
import { 
  fetchUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  toggleUserActive,
  changeUserRole,
  UserData 
} from '../../services/api'
import toast from 'react-hot-toast'

interface UserManagementSectionProps {
  currentUser: UserData | null
}

interface UserFormData {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'staff'
  is_active: boolean
}

export const UserManagementSection = ({ currentUser }: UserManagementSectionProps) => {
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'staff',
    is_active: true
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, filterRole, filterStatus])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (error) {
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => 
        filterStatus === 'active' ? user.is_active : !user.is_active
      )
    }

    setFilteredUsers(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (selectedUser) {
        // Update user - don't send password if empty
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: formData.is_active
        }
        
        if (formData.password) {
          updateData.password = formData.password
        }
        
        await updateUser(selectedUser.id, updateData)
        toast.success('User updated successfully')
      } else {
        // Create new user
        await createUser({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role
        })
        toast.success('User created successfully')
      }
      
      loadUsers()
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      resetForm()
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 
                      (selectedUser ? 'Failed to update user' : 'Failed to create user')
      toast.error(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (user: UserData) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot deactivate your own account")
      return
    }

    try {
      await toggleUserActive(user.id)
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`)
      loadUsers()
    } catch (error) {
      toast.error('Failed to toggle user status')
    }
  }

  const handleChangeRole = async (user: UserData, newRole: 'admin' | 'manager' | 'staff') => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot change your own role")
      return
    }

    try {
      await changeUserRole(user.id, newRole)
      toast.success(`User role changed to ${newRole} successfully`)
      loadUsers()
    } catch (error) {
      toast.error('Failed to change user role')
    }
  }

  const handleDelete = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account")
      return
    }
    
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId)
        toast.success('User deleted successfully')
        loadUsers()
      } catch (error) {
        toast.error('Failed to delete user')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'staff',
      is_active: true
    })
    setSelectedUser(null)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <RiShieldUserLine className="w-4 h-4" />
      case 'manager':
        return <RiUserSettingsLine className="w-4 h-4" />
      default:
        return <RiUserLine className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'manager':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <RiTeamLine className="text-3xl text-purple-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.is_active).length}
              </p>
            </div>
            <RiCheckLine className="text-3xl text-green-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl p-4 border border-orange-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Admins</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <RiShieldUserLine className="text-3xl text-orange-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Managers</p>
              <p className="text-2xl font-bold text-white">
                {users.filter(u => u.role === 'manager').length}
              </p>
            </div>
            <RiUserSettingsLine className="text-3xl text-blue-400" />
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:max-w-xs">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Add User Button */}
          <button
            onClick={() => {
              resetForm()
              setIsAddModalOpen(true)
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20"
          >
            <RiAddLine className="text-xl" />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-dark-800 rounded-xl shadow-lg overflow-hidden border border-dark-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <RiUserLine className="mx-auto text-5xl text-gray-600 mb-3" />
            <p className="text-gray-400">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                          {user.first_name?.[0]}{user.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-gray-400">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{user.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={user.id === currentUser?.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          user.is_active 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                        } ${user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {user.is_active ? <RiCheckLine /> : <RiCloseLine />}
                        {user.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.date_joined).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setFormData({
                              username: user.username,
                              email: user.email,
                              password: '',
                              first_name: user.first_name,
                              last_name: user.last_name,
                              role: user.role,
                              is_active: user.is_active
                            })
                            setIsEditModalOpen(true)
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                          title="Edit user"
                        >
                          <RiEditLine className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={user.id === currentUser?.id}
                          className={`p-2 text-gray-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors ${
                            user.id === currentUser?.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Delete user"
                        >
                          <RiDeleteBinLine className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-2xl w-full border border-dark-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                {selectedUser ? <RiEditLine /> : <RiAddLine />}
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setIsEditModalOpen(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <RiCloseLine className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password {selectedUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
                  required={!selectedUser}
                  placeholder={selectedUser ? 'Leave blank to keep current password' : 'Enter password'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'staff' })}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500/50 focus:border-transparent"
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  Admin: Full system access • Manager: Can manage inventory • Staff: Limited access
                </p>
              </div>

              {selectedUser && (
                <div className="flex items-center gap-3 p-4 bg-dark-700 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-orange-500 bg-dark-600 border-dark-500 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-300 cursor-pointer">
                    Active User (Uncheck to deactivate account)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dark-700">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setIsEditModalOpen(false)
                    resetForm()
                  }}
                  className="px-6 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : (selectedUser ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
