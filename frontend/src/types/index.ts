export interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
  role: string;
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
  role: string;
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