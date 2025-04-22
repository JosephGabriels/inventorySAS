import {
  RiAddLine,
  RiSearchLine,
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiCalendarLine,
  RiFilter3Line,
} from 'react-icons/ri'

interface StockMovement {
  id: number
  type: 'in' | 'out'
  productName: string
  quantity: number
  reason: string
  date: string
  user: string
  reference?: string
}

const mockMovements: StockMovement[] = [
  {
    id: 1,
    type: 'in',
    productName: 'Laptop XPS 15',
    quantity: 25,
    reason: 'Restock',
    date: '2025-04-19 09:30',
    user: 'John Doe',
    reference: 'PO-2025-001',
  },
  {
    id: 2,
    type: 'out',
    productName: 'Wireless Mouse',
    quantity: 5,
    reason: 'Sale',
    date: '2025-04-19 10:15',
    user: 'Jane Smith',
    reference: 'SO-2025-042',
  },
  // Add more mock movements as needed
]

export const StockMovements = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Stock Movements</h1>
          <p className="mt-1 text-sm text-gray-400">
            Track inventory changes
          </p>
        </div>
        <div className="flex space-x-3">
          <button className="btn-secondary flex items-center">
            <RiFilter3Line className="mr-2" />
            Filter
          </button>
          <button className="btn-primary flex items-center">
            <RiAddLine className="mr-2" />
            Record Movement
          </button>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search movements..."
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="input-field pl-10"
              />
            </div>
            <select className="input-field">
              <option value="">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {mockMovements.map((movement) => (
          <div
            key={movement.id}
            className="card p-4 flex items-center space-x-4"
          >
            <div
              className={`p-3 rounded-full Ksh {
                movement.type === 'in'
                  ? 'bg-green-500/10 text-green-500'
                  : 'bg-red-500/10 text-red-500'
              }`}
            >
              {movement.type === 'in' ? (
                <RiArrowUpCircleLine className="w-6 h-6" />
              ) : (
                <RiArrowDownCircleLine className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    {movement.productName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {movement.reason} • Ref: {movement.reference}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-medium Ksh {
                      movement.type === 'in'
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {movement.type === 'in' ? '+' : '-'}
                    {movement.quantity}
                  </p>
                  <p className="text-sm text-gray-400">{movement.date}</p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Processed by {movement.user}
                </p>
                <button className="text-sm text-primary-500 hover:text-primary-400">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button className="btn-secondary">Load More</button>
      </div>
    </div>
  )
}