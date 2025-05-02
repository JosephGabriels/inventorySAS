import { useState, useEffect } from 'react'
import { 
  RiAddLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiAlertLine 
} from 'react-icons/ri'
import { fetchUsers, createUser, updateUser, deleteUser, UserData } from '../../services/api'
import toast from 'react-hot-toast'
import { RegisterData } from '@/types';

interface UserManagementSectionProps {
  currentUser: UserData | null
}

export const UserManagementSection = ({ currentUser }: UserManagementSectionProps) => {
  const [users, setUsers] = useState<UserData[]>([])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_admin: false,
    is_active: true
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (error) {
      toast.error('Failed to load users')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, formData)
        toast.success('User updated successfully')
      } else {
        await createUser(formData)
        toast.success('User created successfully')
      }
      loadUsers()
      setIsAddModalOpen(false)
      setIsEditModalOpen(false)
      resetForm()
    } catch (error) {
      toast.error(selectedUser ? 'Failed to update user' : 'Failed to create user')
    }
  }

  const handleCreateUser = async (data: Omit<RegisterData, 'password_confirm'>) => {
    try {
      await userAPI.register({
        ...data,
        role: data.is_admin ? 'admin' : 'user'
      });
      toast.success('User created successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleDelete = async (userId: number) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account")
      return
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
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
      is_admin: false,
      is_active: true
    })
    setSelectedUser(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">User Management</h2>
        <button
          onClick={() => {
            resetForm()
            setIsAddModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 
            text-white rounded-lg transition-colors"
        >
          <RiAddLine />
          Add User
        </button>
      </div>

      <div className="bg-dark-800 rounded-xl shadow-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-dark-700/50">
                <td className="px-6 py-4 text-white">
                  {user.first_name} {user.last_name}
                </td>
                <td className="px-6 py-4 text-gray-300">{user.username}</td>
                <td className="px-6 py-4 text-gray-300">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${user.is_admin ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {user.is_admin ? 'Admin' : 'Staff'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      setFormData({
                        username: user.username,
                        email: user.email,
                        password: '',
                        first_name: user.first_name,
                        last_name: user.last_name,
                        is_admin: user.is_admin,
                        is_active: user.is_active
                      })
                      setIsEditModalOpen(true)
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <RiEditLine className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    disabled={user.id === currentUser?.id}
                  >
                    <RiDeleteBinLine className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Updated User Form Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                    required
                  />
                </div>
              </div>

              {/* Existing form fields */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password {selectedUser && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
                  required={!selectedUser}
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_admin}
                    onChange={e => setFormData({ ...formData, is_admin: e.target.checked })}
                    className="form-checkbox text-orange-500"
                  />
                  <span className="text-sm text-gray-300">Admin User</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                    className="form-checkbox text-orange-500"
                  />
                  <span className="text-sm text-gray-300">Active</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setIsEditModalOpen(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                >
                  {selectedUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}