import axios from 'axios'
import toast from 'react-hot-toast'
import type { Product } from '../hooks/useProducts'
import { CategoryFormData, StockMovement } from '../types'

// Update baseURL logic to handle production URLs
const baseURL = import.meta.env.PROD 
  ? 'https://inventorysas.onrender.com'  // Your production API URL
  : import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Update the axios instance configuration
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,  // Increase timeout to 30 seconds
  timeoutErrorMessage: 'Server took too long to respond'
})

// Setup authentication token from localStorage if it exists
const token = localStorage.getItem('accessToken')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add request interceptor with timeout handling
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.PROD) {
      config.baseURL = 'https://inventorysas.onrender.com'
    }
    
    // Add request timestamp
    config.metadata = { startTime: new Date() }
    
    // Log slow requests
    const requestTimeout = setTimeout(() => {
      console.warn('Slow request:', {
        url: config.url,
        method: config.method,
        duration: new Date().getTime() - config.metadata.startTime.getTime()
      })
    }, 5000)  // Log requests taking more than 5 seconds
    
    config.metadata.timeoutId = requestTimeout
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor for token refresh, debugging, and retry logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config } = error
    
    // Only retry GET requests
    if (!config || !config.method || config.method.toLowerCase() !== 'get') {
      return Promise.reject(error)
    }

    // Set up retry count
    config.retryCount = config.retryCount || 0

    // Maximum retry attempts
    const MAX_RETRIES = 3

    if (config.retryCount >= MAX_RETRIES) {
      return Promise.reject(error)
    }

    // Increase retry count
    config.retryCount += 1

    // Exponential backoff delay
    const backoff = Math.min(1000 * (Math.pow(2, config.retryCount) - 1), 10000)

    // Wait for backoff time
    await new Promise(resolve => setTimeout(resolve, backoff))

    // Return the promise for the retry
    return api(config)
  }
)

// Authentication API
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  password_confirm: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface UserData {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  first_name: string;
  last_name: string;
  force_password_change?: boolean;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: UserData;
}

export const authAPI = {
  login: (credentials: LoginCredentials) => 
    api.post<TokenResponse>('/api/token/', credentials),
  
  register: (data: RegisterData) => 
    api.post<TokenResponse>('/api/auth/register/', data),
  
  refreshToken: (refreshToken: string) => 
    api.post<{access: string}>('/api/token/refresh/', { refresh: refreshToken }),
  
  getCurrentUser: () => 
    api.get<UserData>('/api/users/me/'),
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete api.defaults.headers.common['Authorization'];
    return Promise.resolve();
  }
}

// User Management API
export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    const response = await api.get<UserData[]>('/api/users/')
    return response.data
  } catch (error) {
    console.error('Users API Error:', error)
    throw error
  }
}

export const createUser = async (userData: Omit<RegisterData, 'password_confirm'> & { password: string }): Promise<UserData> => {
  try {
    const response = await api.post<UserData>('/api/users/', userData)
    return response.data
  } catch (error) {
    console.error('Create User Error:', error)
    throw error
  }
}

export const updateUser = async (id: number, userData: Partial<UserData>): Promise<UserData> => {
  try {
    const response = await api.put<UserData>(`/api/users/${id}/`, userData)
    return response.data
  } catch (error) {
    console.error('Update User Error:', error)
    throw error
  }
}

export const deleteUser = async (id: number): Promise<void> => {
  try {
    await api.delete(`/api/users/${id}/`)
  } catch (error) {
    console.error('Delete User Error:', error)
    throw error
  }
}
// Types
export interface Category {
  id: number
  name: string
  description: string
}

export interface Supplier {
  id: number
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  tax_id: string
  payment_terms: string
  created_at: string
  updated_at: string
}

// Add type checking for API responses
interface ApiResponse<T> {
  data: T[];
  status: number;
  message?: string;
}

// Products
export interface ProductData {
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  category: number;
  supplier: number;
  primary_image?: File;
}

// Add these interfaces after your existing interfaces
export interface DairyStats {
  total_sales: number;
  total_revenue: number;
  average_daily_sales: number;
}

// Products API
export const productAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/api/products/')
      return response.data
    } catch (error) {
      console.error('Products API Error:', error)
      throw error
    }
  },
  create: async (data: ProductData) => {
    const response = await api.post('/api/products/', data)
    return response.data
  },
  update: async (id: number, data: ProductData) => {
    const response = await api.patch(`/api/products/${id}/`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/api/products/${id}/`)
    return response.data
  }
}

// Categories API
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get('/api/categories/')
    return response.data
  },
  
  create: (data: CategoryFormData) => 
    api.post('/api/categories/', data),
  
  update: (id: number, data: CategoryFormData) =>
    api.put(`/api/categories/${id}/`, data),
  
  delete: async (id: number) => {
    await api.delete(`/api/categories/${id}/`)
  }
}

// Suppliers API
export const supplierAPI = {
  getAll: async (): Promise<Supplier[]> => {
    try {
      const response = await api.get('/api/suppliers/')
      console.log('Suppliers response:', response.data)
      return response.data
    } catch (error) {
      console.error('Suppliers API Error:', error)
      throw error
    }
  },
  create: async (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/api/suppliers/', data)
    return response.data
  },
  update: async (id: number, data: Partial<Supplier>) => {
    const response = await api.patch(`/api/suppliers/${id}/`, data)
    return response.data
  },
  delete: async (id: number) => {
    const response = await api.delete(`/api/suppliers/${id}/`)
    return response.data
  }
}

// Stock Movements
interface StockMovementResponse {
  results: StockMovement[]
  hasMore: boolean
  total: number
}

export const stockMovementAPI = {
  getAll: async ({ search, date, type, page }: {
    search?: string
    date?: string
    type?: string
    page?: number
  }): Promise<StockMovementResponse> => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (date) params.append('date', date)
      if (type) params.append('type', type)
      if (page) params.append('page', String(page))

      // Fix: Add /api/ prefix to the URL
      const response = await api.get(`/api/stock-movements/?${params}`)
      return {
        results: response.data || [],
        hasMore: response.data.length === 10,
        total: response.data.length
      }
    } catch (error) {
      console.error('Stock movements API error:', error)
      return {
        results: [],
        hasMore: false,
        total: 0
      }
    }
  },
  
  // Add other stock movement methods
  create: async (data: { product: string; type: 'in' | 'out'; quantity: number; reason: string }) => {
    const response = await api.post('/api/stock-movements/', data)
    return response.data
  },
  
  update: async (id: number, data: { product: string; type: 'in' | 'out'; quantity: number; reason: string }) => {
    const response = await api.put(`/api/stock-movements/${id}/`, data)
    return response.data
  },
  
  delete: async (id: number) => {
    await api.delete(`/api/stock-movements/${id}/`)
  }
}

// Sales
export interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Sale {
  id: number;
  payment_method: 'cash' | 'card' | 'mobile';
  total_amount: number;
  created_at: string;
  created_by: number | null;
  created_by_username: string;
  items: SaleItem[];
}

export interface CreateSaleData {
  payment_method: 'cash' | 'card' | 'mobile';
  total_amount: number;
  items: SaleItem[];
}

// Add this interface for print data
export interface PrintReceiptData {
  id: number;
  items: Array<{
    product: {
      name: string;
      unit_price: number;
    };
    quantity: number;
  }>;
  total_amount: number;
  payment_method: string;
  created_at: string;
  receipt_number?: string;
}

export const salesAPI = {
  getAll: async ({ startDate, endDate }: { startDate?: string; endDate?: string } = {}) => {
    try {
      let url = '/api/sales/'
      const params = new URLSearchParams()
      
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      
      // Add params to URL if they exist
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await api.get<Sale[]>(url)
      return response.data || []
    } catch (error) {
      console.error('Failed to fetch sales:', error)
      return []
    }
  },
  getOne: (id: number) => api.get<Sale>(`/api/sales/${id}/`),
  create: (data: CreateSaleData) => api.post<Sale>('/api/sales/', data),
  recordSale: (data: CreateSaleData) => api.post<Sale>('/api/sales/record/', data),
  getAnalytics: (params?: { days?: number; group_by?: 'product' | 'category' }) =>
    api.get('/api/sales/analytics/', { params }),
  printReceipt: async (saleData: PrintReceiptData) => {
    try {
      if (!saleData || !saleData.items || !Array.isArray(saleData.items)) {
        throw new Error('Invalid sale data for printing');
      }

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Could not create print document');
      }

      const subtotal = Number(saleData.total_amount) || 0;
      const vat = subtotal * 0.16;
      const total = subtotal + vat;

      const formattedItems = saleData.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          unit_price: Number(item.product.unit_price) || 0
        },
        quantity: Number(item.quantity) || 0
      }));

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Sales Receipt</title>
            <style>
              @page { size: 80mm 297mm; margin: 0; }
              body { 
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 10mm;
                color: #000;
              }
              .receipt { width: 70mm; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 5mm; }
              .items { width: 100%; margin: 5mm 0; }
              .items th, .items td { padding: 1mm; text-align: left; }
              .total { text-align: right; margin-top: 5mm; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>Sales Receipt</h2>
                <p>Receipt #: ${saleData.receipt_number || saleData.id}</p>
                <p>Date: ${new Date(saleData.created_at).toLocaleString()}</p>
                <p>Payment: ${saleData.payment_method.toUpperCase()}</p>
              </div>
              
              <table class="items">
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
                ${formattedItems.map(item => `
                  <tr>
                    <td>${item.product.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.product.unit_price.toFixed(2)}</td>
                    <td>${(item.quantity * item.product.unit_price).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
              
              <div class="total">
                <p>Subtotal: ${subtotal.toFixed(2)}</p>
                <p>VAT (16%): ${vat.toFixed(2)}</p>
                <p><strong>Total: ${total.toFixed(2)}</strong></p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      doc.close();
      iframe.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      throw new Error('Failed to print receipt');
    }
  }
}

// Dairy API
export const dairyAPI = {
  getStats: async (days: number = 1): Promise<DairyStats | null> => {
    try {
      const response = await api.get('/api/dairy/stats', {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dairy stats:', error);
      if (error.response?.status === 502) {
        toast.error('Server temporarily unavailable');
      } else {
        toast.error('Failed to fetch dairy statistics');
      }
      return null;
    }
  },

  getAnalytics: async (days: number = 1) => {
    try {
      const response = await api.get('/api/dairy/stats', {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dairy analytics:', error);
      if (error.response?.status === 502) {
        toast.error('Server temporarily unavailable');
      } else {
        toast.error('Failed to fetch dairy analytics');
      }
      return null;
    }
  }
};

// Business Settings
export interface BusinessSettings {
  id?: number;
  business_name: string;
  address: string;
  phone: string;
  email: string;
  tax_rate: number;
  updated_at?: string;
  updated_by?: number | null;
}

export const businessSettingsAPI = {
  getSettings: async () => {
    const response = await api.get<BusinessSettings[]>('/api/business-settings/');
    return response.data && response.data.length > 0 ? response.data[0] : null;
  },

  updateSettings: async (settings: Partial<BusinessSettings>) => {
    const currentSettings = await businessSettingsAPI.getSettings();
    
    if (currentSettings?.id) {
      const response = await api.patch<BusinessSettings>(
        `/api/business-settings/${currentSettings.id}/`,
        settings
      );
      return response.data;
    } else {
      const response = await api.post<BusinessSettings>(
        '/api/business-settings/',
        settings
      );
      return response.data;
    }
  }
};

interface ChangePasswordData {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export const userAPI = {
  updateProfile: async (userId: number, data: Partial<UserData>) => {
    const response = await api.patch<UserData>(`/api/users/${userId}/`, data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordData) => {
    try {
      const response = await api.post('/api/users/change_password/', data);
      return response.data;
    } catch (error: any) {
      console.error('Password change error:', error.response?.data);
      throw error;
    }
  }
};


