import axios from 'axios'
import toast from 'react-hot-toast'
import type { Product } from '../hooks/useProducts'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create an axios instance with the base URL
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Setup authentication token from localStorage if it exists
const token = localStorage.getItem('accessToken')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add request interceptor for authorization and debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    })
    
    // Don't set Content-Type for FormData, axios will set it automatically with boundary
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }
    
    // Add the token to the header if it exists and isn't already set
    const token = localStorage.getItem('accessToken')
    if (token && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for token refresh and debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    return response
  },
  async (error) => {
    const originalRequest = error.config
    
    // Handle token expiration (401 unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const refreshResponse = await axios.post(`${baseURL}/api/token/refresh/`, {
            refresh: refreshToken
          })
          
          const { access: newAccessToken } = refreshResponse.data
          
          // Store the new token
          localStorage.setItem('accessToken', newAccessToken)
          
          // Update default headers
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
          
          // Update the original request headers
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
          
          // Retry the original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        delete api.defaults.headers.common['Authorization']
        
        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    // Display error messages
    if (error.response?.data) {
      const errorData = error.response.data
      let message = 'An error occurred'
      
      if (typeof errorData === 'string') {
        message = errorData
      } else if (typeof errorData === 'object') {
        const messages = []
        for (const [key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            messages.push(`${key}: ${value.join(', ')}`)
          } else if (typeof value === 'string') {
            messages.push(`${key}: ${value}`)
          }
        }
        message = messages.join('\n')
      }
      
      toast.error(message)
    } else {
      toast.error('An error occurred. Please try again.')
    }
    
    return Promise.reject(error)
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
  getAll: async (): Promise<Category[]> => {
    try {
      console.log('Fetching categories...')
      const response = await api.get('/api/categories/')
      
      // Check if response exists and has data
      if (!response || !response.data) {
        console.error('Invalid categories response:', response)
        throw new Error('Failed to fetch categories: Invalid response')
      }
      
      // Log successful response
      console.log('Categories response:', response.data)
      
      // Return the data array or empty array as fallback
      return Array.isArray(response.data) ? response.data : []
    } catch (error: any) {
      console.error('Categories fetch error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      throw new Error(`Failed to fetch categories: ${error.message}`)
    }
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
export const stockMovementAPI = {
  getAll: () => api.get('/api/stock-movements/'),
  create: (data: any) => api.post('/api/stock-movements/', data),
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

// Business Settings
export interface BusinessSettings {
  id?: number;
  business_name: string;
  logo?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  currency?: string;
  updated_at?: string;
  updated_by?: number | null;
}

export const businessSettingsAPI = {
  getSettings: async (): Promise<BusinessSettings> => {
    try {
      const response = await api.get('/api/business-settings/')
      // Return the first item or a default object
      return response.data.length > 0 
        ? response.data[0] 
        : { business_name: 'Inventory Management System' }
    } catch (error) {
      console.error('Business Settings API Error:', error)
      return { business_name: 'Inventory Management System' }
    }
  },
  
  updateSettings: async (settings: BusinessSettings): Promise<BusinessSettings> => {
    try {
      if (settings.id) {
        const response = await api.patch(`/api/business-settings/${settings.id}/`, settings)
        return response.data
      } else {
        const response = await api.post('/api/business-settings/', settings)
        return response.data
      }
    } catch (error) {
      console.error('Update Business Settings Error:', error)
      throw error
    }
  }
}

// Password Management
export const userPasswordAPI = {
  changePassword: async (old_password: string, new_password: string) => {
    const response = await axios.post('/api/users/change_password/', {
      old_password,
      new_password
    });
    return response.data;
  }
}

// Reports API - for real-time data across all report types
export interface DailyStats {
  date: string;
  total_sales: number;
  total_cost: number;
  profit: number;
  items_sold: number;
  top_products: Array<{
    product__name: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface MonthlyStats {
  month: string;
  total_sales: number;
  total_cost: number;
  profit: number;
  items_sold: number;
  growth_rate: number;
}

export interface InventoryReport {
  total_products: number;
  total_value: number;
  low_stock: number;
  by_category: Array<{
    category__name: string;
    count: number;
    value: number;
  }>;
}

export interface SalesAnalytics {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  total_stats: {
    revenue: number;
    cost: number;
    profit: number;
    quantity: number;
  };
  analytics: Array<{
    product__category__name?: string;
    product__name?: string;
    total_quantity: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
  }>;
}

export interface DairyStats {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  total_stats: {
    revenue: number;
    cost: number;
    profit: number;
    quantity: number;
  };
  dairy_products: Array<{
    product__name: string;
    total_quantity: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
  }>;
  categories_used: string[];
}

export const reportsAPI = {
  // Get sales analytics by product or category
  getSalesAnalytics: (params: { days?: number, group_by?: 'product' | 'category', start_date?: string, end_date?: string }) => 
    api.get<SalesAnalytics>('/api/sales/analytics', { params }),
  
  // Get daily stats 
  getDailyStats: () => api.get<DailyStats>('/api/stats/daily'),
  
  // Get monthly stats
  getMonthlyStats: () => api.get<MonthlyStats[]>('/api/stats/monthly'),
  
  // Get yearly stats
  getYearlyStats: () => api.get<MonthlyStats[]>('/api/stats/yearly'),
  
  // Get inventory report
  getInventoryReport: () => api.get<InventoryReport>('/api/reports/inventory'),
  
  // Get financial report
  getFinancialReport: (params: { start_date?: string, end_date?: string }) => 
    api.get('/api/reports/financial', { params }),
  
  // Get audit report
  getAuditReport: (params: { start_date?: string, end_date?: string }) => 
    api.get('/api/reports/audit', { params }),
    
  // Generate a custom report
  generateReport: (data: { type: string, start_date?: string, end_date?: string }) =>
    api.post('/api/reports/generate', data),
    
  // Get dairy stats
  getDairyStats: (params: { days?: number, start_date?: string, end_date?: string }) =>
    api.get<DairyStats>('/api/dairy-stats', { params }),
    
  // Get product performance data
  getProductPerformance: (params: { days?: number, category_id?: number }) =>
    api.get<SalesAnalytics>('/api/products/performance', { params }),
};


