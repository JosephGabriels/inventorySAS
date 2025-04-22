import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productAPI, categoryAPI, supplierAPI } from '../services/api'
import { RiAddLine, RiEdit2Line, RiDeleteBin6Line, RiCloseLine } from 'react-icons/ri'
import toast from 'react-hot-toast'

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  category: number;
  supplier: number;
  category_name?: string;
  supplier_name?: string;
}

// API expects numbers for category and supplier
interface ProductData {
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  category: number;
  supplier: number;
}

// Form data uses strings for select values
interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  category: string;
  supplier: string;
}

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  description: '',
  quantity: 0,
  unit_price: 0,
  cost_price: 0,
  category: '',
  supplier: ''
}

export const Products = () => {
  const queryClient = useQueryClient()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>(initialFormData)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | number | null>(null)

  // Products query
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll
  })

  // Add product mutation
  const addProduct = useMutation({
    mutationFn: productAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsAddModalOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      toast.success('Product added successfully')
    },
    onError: (error: unknown) => {
      console.error('Failed to add product:', error)
      toast.error('Failed to add product')
    }
  })

  // Update product mutation
  const updateProduct = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ProductData }) => productAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setIsAddModalOpen(false)
      setFormData(initialFormData)
      setEditingId(null)
      toast.success('Product updated successfully')
    },
    onError: (error: unknown) => {
      console.error('Failed to update product:', error)
      toast.error('Failed to update product')
    }
  })

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: productAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted successfully')
    },
    onError: (error: unknown) => {
      toast.error('Failed to delete product')
    }
  })

  // Categories query
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: categoryAPI.getAll
  })

  // Suppliers query
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: supplierAPI.getAll
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert form data to API format with proper types
    const productData: ProductData = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description,
      quantity: formData.quantity,
      unit_price: formData.unit_price,
      cost_price: formData.cost_price,
      category: formData.category ? Number(formData.category) : 0,
      supplier: formData.supplier ? Number(formData.supplier) : 0
    }
    
    try {
      if (editingId) {
        await updateProduct.mutateAsync({ 
          id: Number(editingId), 
          data: productData
        })
      } else {
        await addProduct.mutateAsync(productData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('Failed to save product')
    }
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      quantity: product.quantity,
      unit_price: product.unit_price,
      cost_price: product.cost_price,
      category: product.category.toString(),
      supplier: product.supplier.toString(),
    })
    setEditingId(product.id)
    setIsAddModalOpen(true)
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate(id)
    }
  }

  const handleCancel = () => {
    setIsAddModalOpen(false)
    setFormData(initialFormData)
    setEditingId(null)
  }

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.supplier_name && product.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151b29] to-[#1f2b3e] p-6 relative">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Products Management</h1>
        
        {/* Search Bar */}
        <div className="flex items-center justify-between">
          <div className="relative flex-1 mr-4">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search products by name, SKU, category..."
              className="w-full p-4 pl-12 bg-[#232b3e]/80 backdrop-blur-sm rounded-xl text-white border border-[#31394d]/50 focus:border-orange-500 transition-all focus:outline-none shadow-lg"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Add Product Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 rounded-xl shadow-lg border border-orange-500/50
              bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all 
              text-white font-semibold text-lg focus:outline-none transform hover:scale-[1.02] duration-300"
            aria-label="Add Item"
            type="button"
          >
            <RiAddLine size={24} />
            Add Product
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg">No products found</p>
          <p className="text-sm mt-2">Try adjusting your search or add a new product</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product: Product) => (
            <div
              key={product.id}
              className="bg-gradient-to-br from-[#2a3346] to-[#2c3649] rounded-xl shadow-lg p-6 border border-[#31394d]/70 hover:shadow-2xl hover:border-orange-500/30 transition-all duration-300 relative group"
            >
              {/* Edit/Delete Buttons */}
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  onClick={() => handleEdit(product)}
                  className="p-2 rounded-full bg-[#232b3e]/80 hover:bg-orange-500 text-orange-400 hover:text-white transition-colors shadow-md"
                  title="Edit"
                >
                  <RiEdit2Line size={20} />
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="p-2 rounded-full bg-[#232b3e]/80 hover:bg-red-600 text-red-400 hover:text-white transition-colors shadow-md"
                  title="Delete"
                >
                  <RiDeleteBin6Line size={20} />
                </button>
              </div>
              
              {/* Card Content */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white group-hover:text-orange-300 transition-colors">{product.name}</h2>
                <div className="flex items-center flex-wrap gap-2 mt-2">
                  <span className="px-2 py-1 bg-[#343d52]/50 rounded-md text-sm text-gray-400">
                    SKU: {product.sku}
                  </span>
                  {product.category_name && (
                    <span className="px-2 py-1 bg-[#343d52]/50 rounded-md text-sm text-gray-400">
                      {product.category_name}
                    </span>
                  )}
                  {product.supplier_name && (
                    <span className="px-2 py-1 bg-[#343d52]/50 rounded-md text-sm text-gray-400">
                      {product.supplier_name}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6">
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-300 text-transparent bg-clip-text">
                    Ksh {Number(product.unit_price).toLocaleString()}
                  </span>
                  <p className="text-gray-400 text-xs mt-1">
                    Cost: Ksh {Number(product.cost_price).toLocaleString()}
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  product.quantity > 10 ? 'bg-green-500/20 text-green-300' : 
                  product.quantity > 0 ? 'bg-yellow-500/20 text-yellow-300' : 
                  'bg-red-500/20 text-red-300'
                }`}>
                  {product.quantity > 10 ? 'In Stock' : product.quantity > 0 ? 'Low Stock' : 'Out of Stock'}: {product.quantity}
                </div>
              </div>
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
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-[#343d52]/70 transition-colors"
              >
                <RiCloseLine size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-300">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border-none rounded-lg p-3.5 bg-[#31394d]/80 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 shadow-inner"
                    required
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block mb-1.5 text-sm font-medium text-gray-300">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                    className="w-full border-none rounded-lg p-3.5 bg-[#31394d]/80 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-orange-500 shadow-inner"
                    required
                    placeholder="Unique product identifier"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border-none rounded-md p-3 bg-[#31394d] text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                  rows={2}
                  placeholder="Description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full border-none rounded-md p-3 bg-[#31394d] text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                    required
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Unit Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})}
                    className="w-full border-none rounded-md p-3 bg-[#31394d] text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Cost Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={e => setFormData({...formData, cost_price: Number(e.target.value)})}
                    className="w-full border-none rounded-md p-3 bg-[#31394d] text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500"
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full border-none rounded-md p-3 bg-[#31394d] text-gray-100 focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-300">Supplier</label>
                  <select
                    value={formData.supplier}
                    onChange={e => setFormData({...formData, supplier: e.target.value})}
                    className="w-full border-none rounded-md p-3 bg-[#31394d] text-gray-100 focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  {editingId ? 'Update Product' : 'Add Product'}
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