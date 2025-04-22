import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryAPI } from '../services/api'
import { RiAddLine, RiEditLine, RiDeleteBinLine } from 'react-icons/ri'
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

interface Category {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
}

interface CategoryFormData {
  name: string
  description: string
}

const initialFormData: CategoryFormData = {
  name: '',
  description: ''
}

export const Categories = () => {
  const queryClient = useQueryClient()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData)

  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll,
    retry: 1,
    onError: (error: Error) => {
      console.error('Failed to fetch categories:', error)
      toast.error(`Error loading categories: ${error.message}`)
    }
  })

  const addCategory = useMutation({
    mutationFn: (data: CategoryFormData) => categoryAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setIsAddModalOpen(false)
      setFormData(initialFormData)
      toast.success('Category added successfully')
    },
    onError: (error: AxiosError) => {
      handleApiError(error, 'Failed to add category')
    }
  })

  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryFormData }) =>
      categoryAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setEditingCategory(null)
      setFormData(initialFormData)
      toast.success('Category updated successfully')
    },
    onError: (error: AxiosError) => {
      handleApiError(error, 'Failed to update category')
    }
  })

  const deleteCategory = useMutation({
    mutationFn: categoryAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted successfully')
    },
    onError: (error: AxiosError) => {
      handleApiError(error, 'Failed to delete category')
    }
  })

  const handleApiError = (error: AxiosError, defaultMessage: string) => {
    console.error('API Error:', error)
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorMessages = Object.entries(error.response.data)
        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
        .join('\n')
      toast.error(`${defaultMessage}:\n${errorMessages}`)
    } else {
      toast.error(defaultMessage)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await updateCategory.mutateAsync({
          id: editingCategory.id,
          data: formData
        })
      } else {
        await addCategory.mutateAsync(formData)
      }
    } catch (error) {
      // Error will be handled by mutation error callbacks
      console.error('Form submission error:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory.mutateAsync(id)
      } catch (error) {
        // Error will be handled by mutation error callbacks
        console.error('Delete error:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-primary-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500">
        Error loading categories: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181e29] p-6">
      {/* Enhanced Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Categories</h1>
          <p className="mt-1 text-gray-400">Organize your products with categories</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-lg
            shadow-lg hover:shadow-orange-500/20 transition-all duration-200 
            flex items-center space-x-2"
        >
          <RiAddLine className="text-xl" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Enhanced Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories?.map((category) => (
          <div 
            key={category.id} 
            className="bg-[#232b3e] rounded-xl shadow-lg hover:shadow-2xl 
              transition-all duration-200 group overflow-hidden border border-[#31394d]"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-400 
                transition-colors">{category.name}</h3>
              <p className="text-gray-400 text-sm">{category.description}</p>
              
              <div className="mt-4 text-xs text-gray-500">
                Created: {new Date(category.created_at).toLocaleDateString()}
              </div>
            </div>

            <div className="border-t border-[#31394d] p-4 bg-[#1f2937] flex space-x-3">
              <button
                onClick={() => {
                  setFormData({
                    name: category.name,
                    description: category.description
                  })
                  setEditingCategory(category)
                }}
                className="flex-1 py-2 bg-[#232b3e] hover:bg-[#2c3446] text-orange-400
                  rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <RiEditLine className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(category.id)}
                className="px-4 py-2 bg-[#232b3e] hover:bg-red-500/10 text-red-400
                  rounded-lg transition-colors duration-200"
              >
                <RiDeleteBinLine />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Modal */}
      {(isAddModalOpen || editingCategory) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#232b3e] rounded-xl w-full max-w-md shadow-2xl border border-[#31394d]
            transform transition-all duration-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500
                      focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500
                      focus:border-transparent outline-none resize-none h-32"
                  />
                </div>

                <div className="flex space-x-4 mt-8">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white
                      rounded-lg transition-colors duration-200"
                  >
                    {editingCategory ? 'Update' : 'Add'} Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setEditingCategory(null)
                      setFormData(initialFormData)
                    }}
                    className="flex-1 px-6 py-3 bg-[#2c3446] hover:bg-[#343d52] text-gray-300
                      rounded-lg transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}