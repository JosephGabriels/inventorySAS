import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supplierAPI } from '../services/api'
import { 
  RiAddLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiPhoneLine, 
  RiMailLine,
  RiUserLine,
  RiMapPinLine,
  RiFileTextLine 
} from 'react-icons/ri'
import { AxiosError } from 'axios'

interface Supplier {
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

interface SupplierFormData {
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  tax_id: string
  payment_terms: string
}

const initialFormData: SupplierFormData = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  tax_id: '',
  payment_terms: ''
}

export const Suppliers = () => {
  const queryClient = useQueryClient()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData)

  const { data: suppliers = [], isLoading, error } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: supplierAPI.getAll,
    retry: 1,
    onError: (error: Error) => {
      console.error('Failed to fetch suppliers:', error)
    }
  })

  const addSupplier = useMutation({
    mutationFn: (data: SupplierFormData) => supplierAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setIsAddModalOpen(false)
      setFormData(initialFormData)
    },
    onError: (error: AxiosError) => {
      handleApiError(error, 'Failed to add supplier')
    }
  })

  const updateSupplier = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierFormData }) =>
      supplierAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setEditingSupplier(null)
      setFormData(initialFormData)
    },
    onError: (error: AxiosError) => {
      handleApiError(error, 'Failed to update supplier')
    }
  })

  const deleteSupplier = useMutation({
    mutationFn: supplierAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    }
  })

  const handleApiError = (error: AxiosError, defaultMessage: string) => {
    console.error('API Error:', error)
    if (error.response?.data && typeof error.response.data === 'object') {
      const errorMessages = Object.entries(error.response.data)
        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
        .join('\n')
      alert(`${defaultMessage}:\n${errorMessages}`)
    } else {
      alert(defaultMessage)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSupplier) {
        await updateSupplier.mutateAsync({
          id: editingSupplier.id,
          data: formData
        })
      } else {
        await addSupplier.mutateAsync(formData)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting supplier:', error)
        alert('Failed to delete supplier. Please try again.')
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
        Error loading suppliers: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181e29] p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Suppliers</h1>
          <p className="mt-1 text-gray-400">Manage your product suppliers and partnerships</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg
            shadow-lg hover:shadow-orange-500/20 transition-all duration-200 
            flex items-center space-x-2"
        >
          <RiAddLine className="text-xl" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.map((supplier) => (
          <div 
            key={supplier.id} 
            className="bg-[#232b3e] rounded-xl shadow-lg hover:shadow-2xl 
              transition-all duration-200 overflow-hidden border border-[#31394d]"
          >
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-4">{supplier.name}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center text-gray-300">
                  <div className="w-8 h-8 bg-[#2c3446] rounded-lg flex items-center justify-center">
                    <RiUserLine className="text-orange-400" />
                  </div>
                  <span className="ml-3">{supplier.contact_person}</span>
                </div>

                <div className="flex items-center text-gray-300">
                  <div className="w-8 h-8 bg-[#2c3446] rounded-lg flex items-center justify-center">
                    <RiMailLine className="text-orange-400" />
                  </div>
                  <span className="ml-3">{supplier.email}</span>
                </div>

                <div className="flex items-center text-gray-300">
                  <div className="w-8 h-8 bg-[#2c3446] rounded-lg flex items-center justify-center">
                    <RiPhoneLine className="text-orange-400" />
                  </div>
                  <span className="ml-3">{supplier.phone}</span>
                </div>

                <div className="flex items-start text-gray-300">
                  <div className="w-8 h-8 bg-[#2c3446] rounded-lg flex items-center justify-center">
                    <RiMapPinLine className="text-orange-400" />
                  </div>
                  <span className="ml-3">{supplier.address}</span>
                </div>

                {supplier.tax_id && (
                  <div className="flex items-center text-gray-300">
                    <div className="w-8 h-8 bg-[#2c3446] rounded-lg flex items-center justify-center">
                      <RiFileTextLine className="text-orange-400" />
                    </div>
                    <span className="ml-3">Tax ID: {supplier.tax_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card Actions */}
            <div className="border-t border-[#31394d] p-4 bg-[#1f2937] flex space-x-3">
              <button
                onClick={() => {
                  setFormData({
                    name: supplier.name,
                    contact_person: supplier.contact_person,
                    email: supplier.email,
                    phone: supplier.phone,
                    address: supplier.address,
                    tax_id: supplier.tax_id,
                    payment_terms: supplier.payment_terms
                  })
                  setEditingSupplier(supplier)
                }}
                className="flex-1 py-2 bg-[#232b3e] hover:bg-[#2c3446] text-orange-400
                  rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                <RiEditLine className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(supplier.id)}
                className="px-4 py-2 bg-[#232b3e] hover:bg-red-500/10 text-red-400
                  rounded-lg transition-colors duration-200"
              >
                <RiDeleteBinLine />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {(isAddModalOpen || editingSupplier) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#232b3e] rounded-xl w-full max-w-md shadow-2xl border border-[#31394d]
            transform transition-all duration-200">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                        text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_person: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                        text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 h-24"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Tax ID
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Payment Terms
                  </label>
                  <textarea
                    value={formData.payment_terms}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_terms: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-[#1f2937] border border-[#31394d] rounded-lg
                      text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500 h-24"
                  />
                </div>
                <div className="flex space-x-4 mt-8">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white
                      rounded-lg transition-colors duration-200"
                  >
                    {editingSupplier ? 'Update' : 'Add'} Supplier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false)
                      setEditingSupplier(null)
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