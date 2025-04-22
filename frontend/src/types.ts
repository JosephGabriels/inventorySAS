export interface Product {
  id: number
  name: string
  sku: string
  description: string
  quantity: number
  unit_price: number
  cost_price: number
  category: number
  category_name: string
  supplier: number
  supplier_name: string
  created_at: string
  updated_at: string
}

export interface ProductFormData {
  name: string
  sku: string
  description: string
  quantity: number
  unit_price: number
  cost_price: number
  category: number | ''
  supplier: number | ''
}

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
}