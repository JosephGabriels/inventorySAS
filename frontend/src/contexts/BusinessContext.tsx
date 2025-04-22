import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { businessSettingsAPI, BusinessSettings } from '../services/api';
import toast from 'react-hot-toast';

interface BusinessContextType {
  businessSettings: BusinessSettings;
  loading: boolean;
  error: string | null;
  updateBusinessSettings: (settings: BusinessSettings) => Promise<void>;
  refreshBusinessSettings: () => Promise<void>;
}

// Default settings to handle API errors - matches interface exactly
const defaultBusinessSettings: BusinessSettings = {
  business_name: 'Inventory Management System',
  id: 0,
  address: '',
  phone: '',
  email: '',
  tax_id: '',
  currency: 'USD',
  updated_at: new Date().toISOString(),
  updated_by: null
};

const BusinessContext = createContext<BusinessContextType>({
  businessSettings: defaultBusinessSettings,
  loading: false,
  error: null,
  updateBusinessSettings: async () => {},
  refreshBusinessSettings: async () => {},
});

export const useBusiness = () => useContext(BusinessContext);

interface BusinessProviderProps {
  children: ReactNode;
}

export const BusinessProvider: React.FC<BusinessProviderProps> = ({ children }) => {
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(defaultBusinessSettings);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinessSettings = async () => {
    try {
      setLoading(true);
      const settings = await businessSettingsAPI.getSettings();
      setBusinessSettings(settings);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch business settings:', err);
      setError('Failed to load business settings');
      
      // Don't show toast during initial load to avoid disrupting user experience
      // Only show errors for explicit refresh attempts
      if (!loading) {
        toast.error('Failed to load business settings');
      }
      
      // Keep using default settings if fetch fails
      // No need to change businessSettings state as it already has defaults
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessSettings = async (settings: BusinessSettings) => {
    try {
      setLoading(true);
      const updatedSettings = await businessSettingsAPI.updateSettings(settings);
      setBusinessSettings(updatedSettings);
      toast.success('Business settings updated successfully');
    } catch (err) {
      console.error('Failed to update business settings:', err);
      setError('Failed to update business settings');
      toast.error('Failed to update business settings');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinessSettings();
  }, []);

  const value = {
    businessSettings,
    loading,
    error,
    updateBusinessSettings,
    refreshBusinessSettings: fetchBusinessSettings,
  };

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
};