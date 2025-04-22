import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { salesAPI, type Sale, type SaleItem } from '../services/api'
import { format, startOfToday } from 'date-fns'
import {
  RiCalendarLine,
  RiFileListLine,
  RiPrinterLine,
} from 'react-icons/ri'
import { Dialog } from '@headlessui/react'
import { toast } from 'react-hot-toast'

const Sales = () => {
  // Initialize with today's date
  const today = startOfToday()
  const [startDate, setStartDate] = useState(format(today, 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(today, 'yyyy-MM-dd'))
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)

  // Query with both dates
  const { data: sales = [], isLoading, error, refetch } = useQuery<Sale[]>({
    queryKey: ['sales', startDate, endDate],
    queryFn: () => salesAPI.getAll({ startDate, endDate }),
    enabled: Boolean(startDate), // Only run when we have at least a start date
  })

  // Refetch when dates change
  useEffect(() => {
    refetch()
  }, [startDate, endDate, refetch])

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setStartDate(value)
      // If end date is before new start date, set end date to start date
      if (endDate && endDate < value) {
        setEndDate(value)
      }
    } else {
      setEndDate(value)
    }
  }

  // Calculate totals safely
  const totalSales = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading sales data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Error loading sales data</div>
      </div>
    )
  }

  const handlePrintReceipt = async (sale: Sale) => {
    try {
      if (!sale || !sale.items) {
        toast.error('Invalid sale data');
        return;
      }

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error('Could not create print document');
      }

      const subtotal = Number(sale.total_amount);
      const vat = subtotal * 0.16; // 16% VAT
      const total = subtotal; // Total is already including VAT

      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Sales Receipt</title>
            <style>
              @page { size: 80mm 297mm; margin: 0; }
              body { 
                font-family: 'Courier New', monospace;
                margin: 0;
                padding: 10mm;
                color: #000;
                line-height: 1.5;
              }
              .receipt {
                width: 72mm;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 5mm;
                padding-bottom: 3mm;
                border-bottom: 1px dashed #000;
              }
              .company-name {
                font-size: 16pt;
                font-weight: bold;
                margin: 0;
              }
              .company-details {
                font-size: 8pt;
                margin: 2mm 0;
              }
              .receipt-info {
                margin: 3mm 0;
                font-size: 9pt;
              }
              .items {
                width: 100%;
                border-collapse: collapse;
                margin: 3mm 0;
                font-size: 9pt;
              }
              .items th, .items td {
                text-align: left;
                padding: 1mm 2mm;
              }
              .items .amount {
                text-align: right;
              }
              .totals {
                margin-top: 3mm;
                padding-top: 3mm;
                border-top: 1px solid #000;
                font-size: 9pt;
              }
              .totals p {
                display: flex;
                justify-content: space-between;
                margin: 1mm 0;
              }
              .footer {
                margin-top: 5mm;
                padding-top: 3mm;
                border-top: 1px dashed #000;
                text-align: center;
                font-size: 8pt;
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <p class="company-name">DAIRY SHOP</p>
                <p class="company-details">
                  123 Main Street<br>
                  Nairobi, Kenya<br>
                  Tel: +254 123 456 789
                </p>
              </div>

              <div class="receipt-info">
                <p>Receipt #: ${sale.id}</p>
                <p>Date: ${format(new Date(sale.created_at), 'PPpp')}</p>
                <p>Payment: ${sale.payment_method.toUpperCase()}</p>
              </div>

              <table class="items">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th class="amount">Price</th>
                    <th class="amount">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${sale.items.map(item => `
                    <tr>
                      <td>${item.product_name}</td>
                      <td>${item.quantity}</td>
                      <td class="amount">${Number(item.unit_price).toFixed(2)}</td>
                      <td class="amount">${(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="totals">
                <p><span>Subtotal:</span> <span>Ksh ${(subtotal - vat).toFixed(2)}</span></p>
                <p><span>VAT (16%):</span> <span>Ksh ${vat.toFixed(2)}</span></p>
                <p style="font-weight: bold;">
                  <span>TOTAL:</span> <span>Ksh ${total.toFixed(2)}</span>
                </p>
              </div>

              <div class="footer">
                <p>Thank you for your business!</p>
                <p>Please come again</p>
                <p>${format(new Date(), 'PPpp')}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      
      doc.close();
      iframe.contentWindow?.print();
      
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);

    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to print receipt');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Sales History</h1>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
              max={format(today, 'yyyy-MM-dd')}
              className="bg-dark-800 text-white px-3 py-2 rounded-lg border border-dark-700"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
              min={startDate}
              max={format(today, 'yyyy-MM-dd')}
              className="bg-dark-800 text-white px-3 py-2 rounded-lg border border-dark-700"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-white mt-1">
                Ksh {totalSales.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <RiFileListLine className="h-6 w-6 text-primary-500" />
            </div>
          </div>
        </div>
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-white mt-1">
                {sales.length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <RiCalendarLine className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-dark-900">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Receipt #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {sales.map((sale) => (
                <tr 
                  key={sale.id}
                  className="hover:bg-dark-700 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedSale(sale)
                    setIsDetailsOpen(true)
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-white">
                    #{sale.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {format(new Date(sale.created_at), 'PPp')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-500/20 text-primary-400">
                      {sale.payment_method.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-white">
                    Ksh {Number(sale.total_amount).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePrintReceipt(sale)
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <RiPrinterLine className="h-5 w-5" />
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
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-dark-800 rounded-xl p-6 max-w-2xl w-full shadow-xl border border-dark-700">
            {selectedSale && (
              <>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-bold text-white">
                      Sale Details
                    </Dialog.Title>
                    <p className="text-gray-400 mt-1">Receipt #{selectedSale.id}</p>
                  </div>
                  <button
                    onClick={() => handlePrintReceipt(selectedSale)}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-dark-700"
                  >
                    <RiPrinterLine className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-dark-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Date</p>
                      <p className="text-white mt-1">
                        {format(new Date(selectedSale.created_at), 'PPpp')}
                      </p>
                    </div>
                    <div className="bg-dark-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Payment Method</p>
                      <p className="text-white mt-1">
                        {selectedSale.payment_method.toUpperCase()}
                      </p>
                    </div>
                    <div className="bg-dark-900 p-4 rounded-lg">
                      <p className="text-gray-400 text-sm">Total Amount</p>
                      <p className="text-white mt-1">
                        Ksh {Number(selectedSale.total_amount).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Sale Details Modal Items Table */}
                  <div className="bg-dark-900 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-dark-800">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                            Product
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-400 uppercase">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                            Unit Price
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700">
                        {selectedSale.items && selectedSale.items.map((item: SaleItem) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 text-white">
                              {item.product_name}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-300">
                              Ksh {Number(item.unit_price).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right text-white">
                              Ksh {(item.quantity * Number(item.unit_price)).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsDetailsOpen(false)}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  )
}

export default Sales