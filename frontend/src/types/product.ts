export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: string;  // Note: Changed to string since API returns decimal as string
  cost_price: string;  // Note: Changed to string since API returns decimal as string
  category: number;
  category_name: string;
  supplier: number;
  supplier_name: string;
  created_at: string;
  updated_at: string;
}