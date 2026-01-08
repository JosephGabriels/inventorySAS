import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { customerAPI } from '../services/api'
import { RiAddLine, RiEdit2Line, RiDeleteBin6Line, RiCloseLine, RiUser3Line, RiMailLine, RiPhoneLine, RiMapPinLine } from 'react-icons/ri'
import toast from 'react-hot-toast'

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const initialFormData: CustomerFormData = {
  name: '',
  email: '',
  phone: '',
  address: ''
}

export const Customers = () => {
  const queryClient = useQueryClient()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | number | null>(null)

  // Customers query
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: customerAPI.getAll
  })

  // Add customer mutation
  const addCustomer = useMutation({
    mutationFn: (data: CustomerFormData) => customerAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsAddModalOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      toast.success('Customer added successfully')
    },
    onError: (error: unknown) => {
      console.error('Failed to add customer:', error)
      toast.error('Failed to add customer')
    }
  })

  // Update customer mutation
  const updateCustomer = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerFormData> }) => customerAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setIsAddModalOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      toast.success('Customer updated successfully')
    },
    onError: (error: unknown) => {
      console.error('Failed to update customer:', error)
      toast.error('Failed to update customer')
    }
  })

  // Delete customer mutation
  const deleteCustomer = useMutation({
    mutationFn: (id: number) => customerAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer deleted successfully')
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete customer')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingId) {
        await updateCustomer.mutateAsync({ 
          id: Number(editingId), 
          data: formData
        })
      } else {
        await addCustomer.mutateAsync(formData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save customer')
    }
  }

  const handleEdit = (customer: { id: number; name: string; email?: string; phone?: string; address?: string }) => {
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
    })
    setEditingId(customer.id)
    setIsAddModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer.mutate(id)
    }
  }

  const handleCancel = () => {
    setIsAddModalOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }

  const filteredCustomers = customers.filter((customer: { name: string; email?: string; phone?: string }) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (customer.phone && customer.phone.includes(searchTerm))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151b29] to-[#1f2b3e] p-6 relative">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Customers Management</h1>
        
        {/* Search Bar */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 mr-4">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customers by name, email, or phone..."
              className="w-full p-4 pl-12 bg-[#232b3e]/80 backdrop-blur-sm rounded-xl text-white border border-[#31394d]/50 focus:border-orange-500 transition-all focus:outline-none shadow-lg"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Add Customer Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 rounded-xl shadow-lg border border-orange-500/50
              bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all 
              text-white font-semibold text-lg focus:outline-none transform hover:scale-[1.02] duration-300"
            aria-label="Add Customer"
            type="button"
          >
            <RiAddLine size={24} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-lg">No customers found</p>
          <p className="text-sm mt-2">Try adjusting your search or add a new customer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCustomers.map((customer: { id: number; name: string; email?: string; phone?: string; address?: string; created_at?: string }) => (
            <div
              key={customer.id}
              className="bg-gradient-to-br from-[#2a3346] to-[#2c3649] rounded-xl shadow-lg p-6 border border-[#31394d]/70 hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300 relative group"
            >
              {/* Edit/Delete Buttons */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleEdit(customer)}
                  className="p-2 rounded-full bg-[#232b3e]/80 hover:bg-orange-500 text-orange-400 hover:text-white transition-colors shadow-md"
                  title="Edit"
                >
                  <RiEdit2Line size={20} />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 rounded-full bg-[#232b3e]/80 hover:bg-red-600 text-red-400 hover:text-white transition-colors shadow-md"
                  title="Delete"
                >
                  <RiDeleteBin6Line size={20} />
                </button>
              </div>
              
              {/* Card Content */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                    <RiUser3Line size={24} className="text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-orange-300 transition-colors">
                    {customer.name}
                  </h2>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="space-y-2 mt-4">
                {customer.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <RiMailLine size={16} />
                    <span className="text-sm truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <RiPhoneLine size={16} />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <RiMapPinLine size={16} />
                    <span className="text-sm truncate">{customer.address}</span>
                  </div>
                )}
              </div>
              
              {/* Created At */}
              {customer.created_at && (
                <div className="mt-4 pt-4 border-t border-[#31394d]/50">
                  <p className="text-xs text-gray-500">
                    Added: {new Date(customer.created_at).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-gradient-to-b from-[#232b3e] to-[#1a2133] p-8 rounded-2xl w-full max-w-xl shadow-2xl border border-[#31394d]/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#343d52]/70 transition-colors"
              >
                <RiCloseLine size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-300">Customer Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full border-none rounded-lg p-3.5 bg-[#31394d]/80 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 shadow-inner"
                  required
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border-none rounded-lg p-3.5 bg-[#31394d]/80 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 shadow-inner"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block mb-1.5 text-sm font-medium text-gray-300">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full border-none rounded-lg p-3.5 bg-[#31394d]/80 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 shadow-inner"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Address</label>
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full border-none rounded-md p-3 bg-[#31394d] text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Enter address"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  {editingId ? 'Update Customer' : 'Add Customer'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-[#31394d] hover:bg-[#232b3e] text-gray-200 font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

