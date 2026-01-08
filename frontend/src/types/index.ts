export interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff';
  is_active: boolean;
  is_admin: boolean;  // Computed property from backend
  is_manager: boolean;  // Computed property from backend
  force_password_change: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface SaleItem {
  id: number;
  sale: number;
  product: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface CategoryFormData {
  name: string;
  description: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'staff';
}

export interface StockMovement {
  id: number;
  product: number;
  movement_type: 'in' | 'out';
  quantity: number;
  reason: string;
  notes?: string;
  created_at: string;
}