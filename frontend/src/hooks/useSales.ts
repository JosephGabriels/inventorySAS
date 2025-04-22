import { useQuery } from '@tanstack/react-query'
import { salesAPI } from '../services/api'

export const useSales = () => {
  const { data: sales = [], isLoading, error } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const result = await salesAPI.getAll()
      return result || [] // Ensure we never return undefined
    }
  })

  return { sales, isLoading, error }
}