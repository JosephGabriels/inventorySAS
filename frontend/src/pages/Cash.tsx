import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportAPI } from '../services/api'
import { RiMoneyDollarCircleLine, RiCalendarLine, RiUserLine } from 'react-icons/ri'
import { format } from 'date-fns'

export const Cash = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })

  const { data: report, isLoading } = useQuery({
    queryKey: ['cash-report', dateRange],
    queryFn: () => reportAPI.getCashReport(dateRange.startDate, dateRange.endDate)
  })

  const formatCurrency = (amount: any) => {
    const value = typeof amount === 'number' ? amount : parseFloat(amount || 0)
    return `Ksh ${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <RiMoneyDollarCircleLine className="text-orange-500" />
          Cash Management
        </h1>

        <div className="flex items-center gap-4 bg-dark-800 p-2 rounded-lg border border-dark-700">
          <div className="flex items-center gap-2">
            <RiCalendarLine className="text-gray-400" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="bg-transparent text-white border-none focus:ring-0 text-sm"
            />
          </div>
          <span className="text-gray-600">to</span>
          <div className="flex items-center gap-2">
            <RiCalendarLine className="text-gray-400" />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="bg-transparent text-white border-none focus:ring-0 text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-dark-800 p-6 rounded-xl border border-dark-700">
              <p className="text-gray-400 text-sm mb-1">Total Collections</p>
              <h3 className="text-2xl font-bold text-white">{formatCurrency(report.total_amount)}</h3>
            </div>
            {report.summary.map((s: any) => (
              <div key={s.payment_method} className="bg-dark-800 p-6 rounded-xl border border-dark-700">
                <p className="text-gray-400 text-sm mb-1">{s.payment_method.toUpperCase()}</p>
                <h3 className="text-2xl font-bold text-white">{formatCurrency(s.total_amount)}</h3>
                <p className="text-xs text-gray-500 mt-1">{s.count} transactions</p>
              </div>
            ))}
          </div>

          {/* Transactions List */}
          <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
            <div className="p-4 border-b border-dark-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Payment Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-dark-900/50 text-gray-400 text-sm">
                    <th className="px-6 py-4 font-medium">Date/Time</th>
                    <th className="px-6 py-4 font-medium">Sale ID</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Method</th>
                    <th className="px-6 py-4 font-medium">Cashier</th>
                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {report.payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-dark-700/30 transition-colors">
                      <td className="px-6 py-4 text-white text-sm">
                        {new Date(payment.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        #{payment.sale}
                      </td>
                      <td className="px-6 py-4">
                        {payment.customer_name ? (
                          <div className="flex items-center gap-2">
                            <RiUserLine className="text-gray-400" size={14} />
                            <span className="text-white text-sm">{payment.customer_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Walk-in</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.payment_method === 'cash' ? 'bg-green-500/20 text-green-400' :
                          payment.payment_method === 'card' ? 'bg-blue-500/20 text-blue-400' :
                          payment.payment_method === 'credit' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {payment.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {payment.created_by_username}
                      </td>
                      <td className="px-6 py-4 text-white text-sm font-medium text-right">
                        {formatCurrency(Number(payment.amount))}
                      </td>
                    </tr>
                  ))}
                  {report.payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        No transactions found for the selected period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          Failed to load report data
        </div>
      )}
    </div>
  )
}
