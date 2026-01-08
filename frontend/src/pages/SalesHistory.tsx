import { useState, useMemo } from 'react'
import { useSales } from '../hooks/useSales'
import { format } from 'date-fns'
import {
  RiFileTextLine,
  RiPrinterLine,
  RiSearchLine,
  RiCalendarLine,
  RiCloseLine,
  RiUserLine
} from 'react-icons/ri'
import { Dialog } from '@headlessui/react'
import { salesAPI, type Sale } from '../services/api'
import toast from 'react-hot-toast'

export const SalesHistory = () => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Fetch sales with date parameters
  const { data: sales = [], isLoading } = useSales(startDate, endDate)

  // Filter sales by search term
  const filteredSales = useMemo(() => {
    return sales
      .filter(sale => {
        const searchLower = searchTerm.toLowerCase()
        const searchMatch = 
          sale.id.toString().includes(searchLower) ||
          sale.payment_method.toLowerCase().includes(searchLower) ||
          (sale.customer?.name?.toLowerCase().includes(searchLower)) ||
          sale.items.some(item => 
            item.product_name?.toLowerCase().includes(searchLower)
          );
        return searchMatch;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [sales, searchTerm]);

  // Date change handlers with validation
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setStartDate(newDate);
    if (endDate && newDate > endDate) {
      setEndDate(newDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (!startDate) {
      setStartDate(newDate);
    }
    setEndDate(newDate);
  };

  // Handle print receipt
  const handlePrint = async (sale: Sale) => {
    try {
      const printData = {
        id: sale.id,
        items: sale.items.map(item => ({
          product: {
            name: item.product_name || `Product #${item.product}`,
            unit_price: Number(item.unit_price)
          },
          quantity: Number(item.quantity)
        })),
        total_amount: Number(sale.total_amount),
        amount_paid: Number(sale.amount_paid),
        balance_due: Number(sale.balance_due),
        payment_method: sale.payments.map(p => p.payment_method).join(', '),
        payments: sale.payments,
        created_at: sale.created_at,
        receipt_number: sale.id
      };
      await salesAPI.printReceipt(printData);
      toast.success('Receipt sent to printer');
    } catch (error) {
      toast.error('Failed to print receipt');
    }
  };

  // Get payment method from payments or use 'cash' as default
  const getPaymentMethod = (sale: Sale) => {
    if (sale.payments && sale.payments.length > 0) {
      return sale.payments[0].payment_method;
    }
    return 'cash';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Sales History</h1>
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sales, customers..."
            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative">
          <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent w-44"
            value={startDate}
            onChange={handleStartDateChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            placeholder="Start Date"
          />
        </div>
        <span className="text-gray-400">to</span>
        <div className="relative">
          <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            className="pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent w-44"
            value={endDate}
            onChange={handleEndDateChange}
            max={format(new Date(), 'yyyy-MM-dd')}
            min={startDate}
            placeholder="End Date"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
              toast.success('Date filter cleared');
            }}
            className="p-2 text-gray-400 hover:text-white focus:outline-none"
            title="Clear date filter"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="bg-dark-800 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Customer</th>
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
                  <td className="px-6 py-4">
                    {sale.customer ? (
                      <div className="flex items-center gap-2">
                        <RiUserLine className="text-gray-400" size={14} />
                        <span className="text-white">{sale.customer.name}</span>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Walk-in</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${getPaymentMethod(sale) === 'cash' ? 'bg-green-500/20 text-green-400' : 
                        getPaymentMethod(sale) === 'card' ? 'bg-blue-500/20 text-blue-400' :
                        getPaymentMethod(sale) === 'credit' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-orange-500/20 text-orange-400'}`}>
                      {getPaymentMethod(sale).toUpperCase()}
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
                      title="View Details"
                    >
                      <RiFileTextLine className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handlePrint(sale)}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Print Receipt"
                    >
                      <RiPrinterLine className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No sales found for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="relative bg-dark-800 rounded-xl shadow-xl max-w-2xl w-full mx-auto p-6">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <RiCloseLine className="w-6 h-6" />
            </button>

            {selectedSale && (
              <div className="space-y-6">
                {/* Header with customer info */}
                <div className="flex justify-between items-start">
                  <div>
                    <Dialog.Title className="text-xl font-bold text-white">
                      Sale Details #{selectedSale.id}
                    </Dialog.Title>
                    <p className="text-gray-400 mt-1">
                      {format(new Date(selectedSale.created_at), 'PPpp')}
                    </p>
                    
                    {/* Customer Info */}
                    {selectedSale.customer && (
                      <div className="mt-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                        <RiUserLine className="text-yellow-400" size={16} />
                        <div>
                          <p className="text-yellow-200 font-medium text-sm">{selectedSale.customer.name}</p>
                          {(selectedSale.customer.phone || selectedSale.customer.email) && (
                            <p className="text-gray-400 text-xs">
                              {selectedSale.customer.phone && <span>{selectedSale.customer.phone}</span>}
                              {selectedSale.customer.phone && selectedSale.customer.email && <span> • </span>}
                              {selectedSale.customer.email && <span>{selectedSale.customer.email}</span>}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-1 rounded-full text-sm font-medium block
                      ${getPaymentMethod(selectedSale) === 'cash' ? 'bg-green-500/20 text-green-400' : 
                        getPaymentMethod(selectedSale) === 'card' ? 'bg-blue-500/20 text-blue-400' :
                        getPaymentMethod(selectedSale) === 'credit' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-orange-500/20 text-orange-400'}`}>
                      {getPaymentMethod(selectedSale).toUpperCase()}
                    </span>
                    {selectedSale.status !== 'paid' && (
                      <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium block
                        ${selectedSale.status === 'partial' ? 'bg-blue-500/20 text-blue-400' : 
                          'bg-gray-500/20 text-gray-400'}`}>
                        {selectedSale.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Table */}
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
                      {selectedSale.balance_due > 0 && (
                        <tr>
                          <td colSpan={3} className="text-right text-gray-400">Balance Due</td>
                          <td className="text-right text-orange-400 font-bold">
                            Ksh {Number(selectedSale.balance_due).toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>

                {/* Payment History */}
                {selectedSale.payments && selectedSale.payments.length > 1 && (
                  <div className="bg-dark-900/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Payment History</h4>
                    <div className="space-y-2">
                      {selectedSale.payments.map((payment, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              payment.payment_method === 'cash' ? 'bg-green-400' :
                              payment.payment_method === 'credit' ? 'bg-yellow-400' :
                              'bg-blue-400'
                            }`}></span>
                            <span className="text-white capitalize">{payment.payment_method}</span>
                            {payment.created_by_username && (
                              <span className="text-gray-500">({payment.created_by_username})</span>
                            )}
                          </div>
                          <span className="text-orange-300">Ksh {Number(payment.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4">
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
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

