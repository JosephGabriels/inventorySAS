import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { userAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { RiSave3Line } from 'react-icons/ri'

export const ProfileSection = () => {
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || ''
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user?.id) {
        throw new Error('User not found');
      }

      const formattedData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim()
      };

      const updatedUser = await userAPI.updateProfile(user.id, formattedData);
      updateUserData(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Update error:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            First Name
          </label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Last Name
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Email Address
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          required
        />
      </div>

      {error && (
        <div className="text-red-400 bg-red-400/10 p-4 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`flex items-center justify-center w-full px-4 py-2 rounded-lg text-white transition-colors
          ${isLoading ? 'bg-orange-500/50 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            <RiSave3Line className="mr-2" />
            Save Changes
          </>
        )}
      </button>
    </form>
  )
}