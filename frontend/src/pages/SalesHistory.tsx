import { useState } from 'react'
import { useSales } from '../hooks/useSales'
import { format } from 'date-fns'
import {
  RiFileTextLine,
  RiPrinterLine,
  RiSearchLine,
  RiFilterLine,
  RiCalendarLine,
  RiCloseLine,
  RiMoneyDollarCircleLine,
  RiShoppingCartLine
} from 'react-icons/ri'
import { Dialog, Transition } from '@headlessui/react'
import { salesAPI, type Sale, type PrintReceiptData } from '../services/api'
import toast from 'react-hot-toast'

export const SalesHistory = () => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const { sales = [], isLoading } = useSales()

  const handlePrint = async (sale: Sale) => {
    try {
      const printData: PrintReceiptData = {
        id: sale.id,
        items: sale.items.map(item => ({
          product: {
            name: item.product_name || `Product #${item.product}`,
            unit_price: Number(item.unit_price)
          },
          quantity: item.quantity
        })),
        total_amount: Number(sale.total_amount),
        payment_method: sale.payment_method,
        created_at: sale.created_at,
        receipt_number: `INV-${sale.id.toString().padStart(4, '0')}`
      }
      await salesAPI.printReceipt(printData)
      toast.success('Printing receipt...')
    } catch (error) {
      toast.error('Failed to print receipt')
    }
  }

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.id.toString().includes(searchTerm) ||
      sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = !dateFilter || sale.created_at.includes(dateFilter)
    return matchesSearch && matchesDate
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Sales History</h1>
        <div className="flex gap-4">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales..."
              className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Amount</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-dark-700/50 transition-colors">
                  <td className="px-6 py-4 text-gray-300">#{sale.id}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${sale.payment_method === 'cash' ? 'bg-green-500/20 text-green-400' : 
                        sale.payment_method === 'card' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-orange-500/20 text-orange-400'}`}>
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    Ksh {Number(sale.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => {
                        setSelectedSale(sale)
                        setIsModalOpen(true)
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <RiFileTextLine className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePrint(sale)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <RiPrinterLine className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black/75" />
          
          <div className="relative bg-dark-800 rounded-xl shadow-xl max-w-2xl w-full mx-auto p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <RiCloseLine className="w-6 h-6" />
            </button>

            {selectedSale && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Dialog.Title className="text-xl font-bold text-white">
                      Sale Details #{selectedSale.id}
                    </Dialog.Title>
                    <p className="text-gray-400 mt-1">
                      {format(new Date(selectedSale.created_at), 'PPpp')}
                    </p>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-sm font-medium
                    ${selectedSale.payment_method === 'cash' ? 'bg-green-500/20 text-green-400' : 
                      selectedSale.payment_method === 'card' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-orange-500/20 text-orange-400'}`}>
                    {selectedSale.payment_method.toUpperCase()}
                  </span>
                </div>

                <div className="border-t border-dark-700 -mx-6 px-6 pt-6">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 text-sm">
                        <th className="text-left font-medium pb-4">Item</th>
                        <th className="text-right font-medium pb-4">Qty</th>
                        <th className="text-right font-medium pb-4">Price</th>
                        <th className="text-right font-medium pb-4">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-700">
                      {selectedSale.items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-4 text-white">
                            {item.product_name || `Product #${item.product}`}
                          </td>
                          <td className="py-4 text-right text-gray-300">{item.quantity}</td>
                          <td className="py-4 text-right text-gray-300">
                            Ksh {Number(item.unit_price).toLocaleString()}
                          </td>
                          <td className="py-4 text-right text-white">
                            Ksh {(Number(item.unit_price) * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="pt-6 text-right text-gray-400">Total</td>
                        <td className="pt-6 text-right text-xl font-bold text-white">
                          Ksh {Number(selectedSale.total_amount).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => handlePrint(selectedSale)}
                    className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    <RiPrinterLine className="w-5 h-5 mr-2" />
                    Print Receipt
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  )
}