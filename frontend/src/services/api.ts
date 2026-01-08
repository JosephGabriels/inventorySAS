import axios from 'axios'
import toast from 'react-hot-toast'
import type { Product } from '../hooks/useProducts'
import { CategoryFormData, StockMovement } from '../types'

// Update baseURL logic to handle production URLs
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
    // Ensure all requests have the correct baseURL
    if (!config.baseURL) {
      config.baseURL = baseURL;
    }
    
    // Add trailing slash if missing and no query parameters
    if (config.url && !config.url.includes('?') && !config.url.endsWith('/')) {
      config.url = `${config.url}/`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
)

// Add response interceptor for token refresh and debugging
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check your connection.');
    } else if (error.response?.status === 502) {
      toast.error('Server is temporarily unavailable.');
    }

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
  is_active: boolean;
  is_admin: boolean;  // Computed property from backend
  is_manager: boolean;  // Computed property from backend
  force_password_change: boolean;
  date_joined: string;
  last_login: string | null;
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

export const toggleUserActive = async (id: number): Promise<UserData> => {
  try {
    const response = await api.post<{ message: string; user: UserData }>(`/api/users/${id}/toggle_active/`)
    return response.data.user
  } catch (error) {
    console.error('Toggle User Active Error:', error)
    throw error
  }
}

export const changeUserRole = async (id: number, role: 'admin' | 'manager' | 'staff'): Promise<UserData> => {
  try {
    const response = await api.post<{ message: string; user: UserData }>(`/api/users/${id}/change_role/`, { role })
    return response.data.user
  } catch (error) {
    console.error('Change User Role Error:', error)
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

// Terminal API
export interface Terminal {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const terminalAPI = {
  getAll: async (params?: { active_only?: boolean }) => {
    const response = await api.get<Terminal[]>('/api/terminals/', { params });
    return response.data;
  },
  getOne: (id: number) => api.get<Terminal>(`/api/terminals/${id}/`),
  create: (data: Partial<Terminal>) => api.post<Terminal>('/api/terminals/', data),
  update: (id: number, data: Partial<Terminal>) => api.patch<Terminal>(`/api/terminals/${id}/`, data),
  delete: (id: number) => api.delete(`/api/terminals/${id}/`)
};

// Sales
export interface SaleItem {
  id?: number;
  product?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  total_price?: number;
}

export interface Payment {
  id?: number;
  sale?: number;
  payment_method: 'cash' | 'card' | 'mobile';
  amount: number;
  notes?: string;
  created_at?: string;
  created_by_username?: string;
}

export interface Sale {
  id: number;
  status: 'paid' | 'partial' | 'pending';
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  created_at: string;
  created_by: number | null;
  created_by_username: string;
  items: SaleItem[];
  payments: Payment[];
  customer?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
  } | null;
}

export interface CreateSaleData {
  total_amount: number;
  terminal?: number;
  items: SaleItem[];
  payments: Omit<Payment, 'id' | 'sale' | 'created_at' | 'created_by_username'>[];
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
  amount_paid?: number;
  balance_due?: number;
  payment_method: string;
  payments?: Payment[];
  created_at: string;
  receipt_number?: string;
  cashier_name?: string;
  businessSettings?: BusinessSettings;
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

      const total = Number(saleData.total_amount) || 0;
      const amountPaid = Number(saleData.amount_paid) || total;
      const balanceDue = Number(saleData.balance_due) || 0;
      const settings = saleData.businessSettings;
      const currency = settings?.currency || 'KSH';

      const formattedItems = saleData.items.map(item => ({
        ...item,
        product: {
          ...item.product,
          unit_price: Number(item.product.unit_price) || 0
        },
        quantity: Number(item.quantity) || 0
      }));

      // VAT calculations
      const VAT_RATE = 0.16;
      const vatable = total / (1 + VAT_RATE);
      const vatAmt = total - vatable;
      // Amount in words helper
      function numberToWords(num) {
        // Simple version for Ksh only
        const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        if (num === 0) return "Zero";
        if (num < 20) return a[num];
        if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");
        if (num < 1000) return a[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numberToWords(num % 100) : "");
        if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numberToWords(num % 1000) : "");
        return num.toString();
      }
      const amountWords = numberToWords(Math.round(total)) + ' Shillings Only';
      // Payment lines
      const paymentLines = saleData.payments && saleData.payments.length > 0
        ? saleData.payments.map(p => `<tr><td colspan="2">Tendered (${p.payment_method.toUpperCase()})</td><td style="text-align:right;">${Number(p.amount).toFixed(2)}</td></tr>`).join('')
        : `<tr><td colspan="2">Tendered (${saleData.payment_method.toUpperCase()})</td><td style="text-align:right;">${amountPaid.toFixed(2)}</td></tr>`;
      // Change line
      const change = amountPaid - total;
      const changeLine = change > 0 ? `<tr><td colspan="2">Change</td><td style="text-align:right;">${change.toFixed(2)}</td></tr>` : '';
      // POS/Receipt/PIN
      const posNumber = saleData.terminal ? saleData.terminal : 'N/A';
      const receiptNo = saleData.receipt_number || saleData.id;
      const pin = settings?.tax_id || 'N/A';
      // Tagline
      const tagline = settings?.tagline || 'Where quality meets affordability';
      // eTIMS signature placeholder
      const etimsSig = 'RCPT-XXXXXX...';
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Sales Receipt</title>
            <style>
              @page { size: 80mm 297mm; margin: 0; }
              body { font-family: 'Courier New', monospace; margin: 0; padding: 10mm; color: #000; line-height: 1.4; }
              .receipt { width: 70mm; margin: 0 auto; }
              .header { text-align: center; margin-bottom: 2mm; border-bottom: 1px dashed #000; padding-bottom: 2mm; }
              .header h2 { margin: 0; font-size: 14pt; }
              .header p { margin: 1mm 0; font-size: 8pt; }
              .tagline { font-size: 9pt; margin-bottom: 2mm; }
              .meta { font-size: 8pt; margin-bottom: 2mm; }
              .meta span { margin-right: 8px; }
              .items { width: 100%; margin: 2mm 0; border-collapse: collapse; font-size: 9pt; }
              .items th, .items td { padding: 1mm 1mm; }
              .items th { border-bottom: 1px solid #000; text-align: left; }
              .items td { border-bottom: 1px dotted #ccc; }
              .totals { margin-top: 2mm; font-size: 10pt; }
              .totals td { padding: 1mm 1mm; }
              .footer { margin-top: 4mm; text-align: center; font-size: 8pt; border-top: 1px dashed #000; padding-top: 2mm; }
              .etims { font-size: 7pt; color: #666; margin-top: 2mm; }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <h2>${settings?.business_name || 'SALES RECEIPT'}</h2>
                ${settings?.address ? `<p>${settings.address}</p>` : ''}
                ${settings?.phone ? `<p>Tel: ${settings.phone}</p>` : ''}
                ${settings?.email ? `<p>${settings.email}</p>` : ''}
                <p class="tagline">${tagline}</p>
              </div>
              <div class="meta">
                <span><b>POS:</b> ${posNumber}</span>
                <span>${new Date(saleData.created_at || Date.now()).toLocaleString()}</span><br/>
                <span><b>Receipt:</b> ${receiptNo}</span><br/>
                <span><b>PIN:</b> ${pin}</span>
              </div>
              <table class="items">
                <thead>
                  <tr><th>DESCRIPTION</th><th>QTY</th><th style="text-align:right;">EXT</th></tr>
                </thead>
                <tbody>
                  ${formattedItems.map(item => `
                    <tr>
                      <td>${item.product.name}</td>
                      <td>${item.quantity}</td>
                      <td style="text-align:right;">${(item.quantity * item.product.unit_price).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <table class="totals" style="width:100%;">
                <tr><td>Subtotal</td><td></td><td style="text-align:right;">${total.toFixed(2)}</td></tr>
                <tr><td><b>TOTAL</b></td><td></td><td style="text-align:right;"><b>${total.toFixed(2)}</b></td></tr>
                ${paymentLines}
                ${changeLine}
                <tr><td colspan="3" style="text-align:center;">${amountWords.toUpperCase()}</td></tr>
              </table>
              <div class="totals" style="margin-top:2mm;">
                <div><b>TAX DETAILS</b></div>
                <div>VATABLE ${vatable.toFixed(2)}</div>
                <div>VAT AMT ${vatAmt.toFixed(2)}</div>
              </div>
              <div class="etims">KRA eTIMS<br/>Sig: ${etimsSig}</div>
              <div class="footer">
                <div>Served by: ${saleData.cashier_name || 'Cashier'}</div>
                <div>Thank you for your purchase!</div>
                <div style="margin-top:2mm;font-weight:bold;">*** Powering Your Business ***</div>
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
  address: string;
  phone: string;
  email: string;
  tax_id: string;
  currency: string;
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
        '/api/business-settings/' + currentSettings.id + '/',
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

// Add dairy API endpoints
export const dairyAPI = {
  getStats: async (days: number = 1) => {
    try {
      const response = await api.get('api/dairy/stats', {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dairy stats:', error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to fetch dairy statistics');
      }
      return null;
    }
  },

  getAnalytics: async (days: number = 1) => {
    try {
      const response = await api.get('api/dairy/stats', {
        params: { days }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dairy analytics:', error);
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to fetch dairy analytics');
      }
      return null;
    }
  }
};

// Customer API
export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

export const customerAPI = {
  getAll: async (): Promise<Customer[]> => {
    const response = await api.get('/api/customers/');
    return response.data;
  },
  create: async (data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> => {
    const response = await api.post('/api/customers/', data);
    return response.data;
  },
  update: async (id: number, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.patch(`/api/customers/${id}/`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/customers/${id}/`);
  },
};

// Cash Report API
export const reportAPI = {
  getCashReport: async (startDate: string, endDate: string) => {
    const response = await api.get('/api/cash-report/', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  }
};


