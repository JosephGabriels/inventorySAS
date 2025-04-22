import { useQuery } from '@tanstack/react-query';
import { productAPI, type ProductData } from '../services/api';

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  category: number;
  supplier: number;
  category_name: string;
  supplier_name: string;
  created_at: string;
  updated_at: string;
}

export const useProducts = () => {
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const result = await productAPI.getAll();
      return result || []; // Ensure we never return undefined
    }
  });

  return { products, isLoading, error };
}