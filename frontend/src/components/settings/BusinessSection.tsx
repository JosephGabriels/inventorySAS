import React, { useState, useEffect } from 'react';
import { businessSettingsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { RiSave3Line } from 'react-icons/ri';
import { useAuth } from '../../contexts/AuthContext';

interface BusinessSettings {
  id?: number;
  business_name: string;
  address: string;
  phone: string;
  email: string;
  tax_rate: number;
}

export const BusinessSection = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings>({
    business_name: '',
    address: '',
    phone: '',
    email: '',
    tax_rate: 0
  });

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await businessSettingsAPI.getSettings();
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        toast.error('Failed to load business settings');
        console.error('Error loading business settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedData = {
        business_name: settings.business_name.trim(),
        address: settings.address?.trim() || '',
        phone: settings.phone?.trim() || '',
        email: settings.email?.trim() || '',
        tax_rate: Number(settings.tax_rate) || 0,
        updated_by: user?.id || null
      };

      const updatedSettings = await businessSettingsAPI.updateSettings(formattedData);
      setSettings(updatedSettings);
      toast.success('Business settings updated successfully');
    } catch (error: any) {
      console.error('Update error:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !settings.business_name) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Business Name *
        </label>
        <input
          type="text"
          value={settings.business_name}
          onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
          className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Address
        </label>
        <textarea
          value={settings.address}
          onChange={(e) => setSettings({ ...settings, address: e.target.value })}
          className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Phone
          </label>
          <input
            type="tel"
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Tax Rate (%)
        </label>
        <input
          type="number"
          value={settings.tax_rate}
          onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) })}
          className="mt-1 block w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white"
          step="0.1"
          min="0"
          max="100"
        />
      </div>

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
  );
};