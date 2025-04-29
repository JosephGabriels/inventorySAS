import { useState } from 'react'
import { RiAlertLine } from 'react-icons/ri'
import { userAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

const formStyles = {
  wrapper: "max-w-md mx-auto bg-[#1a1f2e] rounded-xl shadow-lg border border-[#31394d]/50 p-6",
  warningAlert: "mb-6 p-4 bg-red-900/30 border border-red-500/50 text-red-200 rounded-lg flex items-center gap-3",
  inputGroup: "space-y-2 mb-4",
  label: "block text-sm font-medium text-gray-300",
  input: `w-full px-4 py-2.5 bg-[#151b29] border border-[#31394d] rounded-lg
    text-gray-100 placeholder-gray-500
    focus:ring-2 focus:ring-orange-500/50 focus:border-transparent
    transition-all duration-200`,
  button: `w-full py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 
    hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg 
    transform transition-all duration-200 hover:scale-[1.02] 
    shadow-lg shadow-orange-500/20`
}

export const SecuritySection = () => {
  const { user } = useAuth(); // Add this line
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await userAPI.changePassword({
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
        new_password_confirm: confirmPassword.trim() // Add this line
      });

      // Clear form after successful update
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (error: any) {
      const errorMessage = error.response?.data?.new_password_confirm?.[0] 
        || error.response?.data?.detail 
        || 'Failed to change password';
      
      toast.error(errorMessage);
      console.error('Password change error:', error.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={formStyles.wrapper}>
      <h2 className="text-xl font-bold text-white mb-2">Change Password</h2>
      <p className="text-gray-400 mb-6">Please enter your current password and choose a new one</p>

      {user?.force_password_change && (
        <div className={formStyles.warningAlert}>
          <RiAlertLine className="text-xl text-red-400" />
          <p>You must change your password before continuing</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={formStyles.inputGroup}>
          <label className={formStyles.label}>
            Current Password
          </label>
          <input
            type="password"
            name="old_password"
            className={formStyles.input}
            placeholder="Enter your current password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className={formStyles.inputGroup}>
          <label className={formStyles.label}>
            New Password
          </label>
          <input
            type="password"
            name="new_password"
            className={formStyles.input}
            placeholder="Enter new password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className={formStyles.inputGroup}>
          <label className={formStyles.label}>
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirm_password"
            className={formStyles.input}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className={formStyles.button} disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}