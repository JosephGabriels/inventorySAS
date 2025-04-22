import { useState } from 'react'
import { RiBarChartBoxLine, RiShoppingCart2Line, RiArchiveLine, RiAlertLine, RiCloseLine, RiCalendarLine } from 'react-icons/ri'
import { useSales } from '../hooks/useSales'
import { useQuery, useMutation } from '@tanstack/react-query'
import { productAPI, salesAPI, type Sale, type SaleItem } from '../services/api'
import type { Product } from '../hooks/useProducts'
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

// Add or update these interfaces
interface SaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

interface Product {
  id: number;
  name: string;
  quantity: number;
  // ...other product fields
}

interface Sale {
  id: number;
  items: SaleItem[];
  total_amount: number;
  payment_method: string;
  created_at: string;
}

// Types for enhanced sale items with product details
interface SaleItemWithProduct extends SaleItem {
  product_name?: string;
  subtotal: number;
}

interface SaleWithItems extends Sale {
  items: SaleItemWithProduct[];
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

// Statistics Card Component
const StatsCard = ({ title, value, icon, color, trend }: StatsCardProps) => (
  <div className={`bg-gradient-to-br from-${color}-900/90 to-${color}-800/50 rounded-xl p-6 shadow-xl border border-${color}-700/30 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}>
    <div className={`w-12 h-12 flex items-center justify-center rounded-full bg-${color}-500/20 text-${color}-400 shadow-inner`}>
      {icon}
    </div>
    <p className="text-gray-400">{title}</p>
    <p className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text mt-1">{value}</p>
    {trend && (
      <span className={`${trend.isUp ? 'text-green-400' : 'text-red-400'} font-medium`}>
        {trend.value}%
        <span className="text-gray-400 text-xs ml-2">vs last month</span>
      </span>
    )}
  </div>
);

// Sale Details Modal Component
const SaleDetailsModal = ({ sale, products, onClose }: { sale: Sale | null, products: Product[], onClose: () => void }) => {
  if (!sale) return null;

  const itemsWithDetails = sale.items.map(item => {
    // Use product_name from the item itself
    return {
      ...item,
      product_name: item.product_name || `Product #${item.product}`,
      subtotal: Number(item.quantity) * Number(item.unit_price)
    };
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Sale Details</h2>
            <p className="text-gray-400 text-sm">
              Receipt #{sale.id} • {sale.payment_method.toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <RiCloseLine size={24} />
          </button>
        </div>

        <table className="w-full mb-6">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="text-left py-2 px-4 text-gray-400">Product</th>
              <th className="text-center py-2 px-4 text-gray-400">Qty</th>
              <th className="text-right py-2 px-4 text-gray-400">Price</th>
              <th className="text-right py-2 px-4 text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {itemsWithDetails.map((item, index) => (
              <tr key={index} className="border-t border-gray-700">
                <td className="py-2 px-4 text-white">{item.product_name}</td>
                <td className="py-2 px-4 text-gray-300 text-center">{item.quantity}</td>
                <td className="py-2 px-4 text-gray-300 text-right">
                  Ksh {Number(item.unit_price).toLocaleString()}
                </td>
                <td className="py-2 px-4 text-gray-300 text-right">
                  Ksh {item.subtotal.toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="border-t border-gray-700 bg-gray-800/30">
              <td colSpan={3} className="py-2 px-4 text-right text-gray-400">Total:</td>
              <td className="py-2 px-4 text-right text-white">
                Ksh {Number(sale.total_amount).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-gray-400 text-sm">
          <p>Date: {new Date(sale.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

// Recent Activity Component
const RecentActivity = ({ products, onSaleClick }: { products: Product[], onSaleClick: (sale: Sale) => void }) => {
  const { sales = [], isLoading, error } = useSales();

  const recentSales = [...sales]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 30);

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/70 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
      <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        {recentSales.map((sale: Sale) => (
          <div 
            key={sale.id}
            onClick={() => onSaleClick(sale)}
            className="flex items-center p-4 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer"
          >
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className="text-white">#{sale.id}</span>
                <span className="text-orange-400">
                  Ksh {Number(sale.total_amount).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {sale.items.map(item => item.product_name).join(', ')}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(sale.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isLoadingSaleDetails, setIsLoadingSaleDetails] = useState(false);

  // Fetch products for stats cards and modal
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: productAPI.getAll
  });

  // Fetch sales for stats cards
  const { sales = [] } = useSales();

  // Fetch detailed sale information when a sale is clicked
  const fetchSaleDetails = async (saleId: number) => {
    setIsLoadingSaleDetails(true);
    try {
      const response = await salesAPI.getOne(saleId);
      setSelectedSale(response.data);
    } catch (error) {
      console.error('Failed to fetch sale details:', error);
    } finally {
      setIsLoadingSaleDetails(false);
    }
  };

  // Handle click on a sale item
  const handleSaleClick = async (sale: Sale) => {
    if (productsLoading || products.length === 0) {
      toast.error('Loading product data...');
      return;
    }
    setIsLoadingSaleDetails(true);
    try {
      const response = await salesAPI.getOne(sale.id);
      setSelectedSale(response.data);
    } catch (error) {
      console.error('Failed to fetch sale details:', error);
      toast.error('Failed to load sale details');
    } finally {
      setIsLoadingSaleDetails(false);
    }
  };

  // Modal loading state
  const SaleDetailsLoading = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 shadow-2xl border border-gray-700/50 animate-slideUp">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h2 className="text-xl font-bold text-white">Loading Sale Details...</h2>
          <button
            onClick={handleCloseModal}
            className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700/50 transition-colors"
            aria-label="Close"
          >
            <RiCloseLine size={24} />
          </button>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Fetching sale details...</p>
        </div>
      </div>
    </div>
  );

  // Close the sale details modal
  const handleCloseModal = () => {
    setSelectedSale(null);
  };
  
  // Calculate total products
  const totalProducts = products.length;
  
  // Calculate low stock items
  const lowStockItems = products.filter((product: Product) => product.quantity <= 5).length;
  
  // Calculate total sales amount
  const totalSalesAmount = sales.reduce((total, sale) => total + Number(sale.total_amount), 0);
  
  // Calculate monthly revenue (sales from the current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySales = sales.filter(sale => {  
    const saleDate = new Date(sale.created_at);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
  });
  const monthlyRevenue = monthlySales.reduce((total, sale) => total + Number(sale.total_amount), 0);

  // Add these chart data preparation functions
  const getDailySalesData = () => {
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i)
      const start = startOfDay(date)
      const end = endOfDay(date)
      
      const daySales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= start && saleDate <= end
      })

      return {
        date: format(date, 'MMM dd'),
        sales: daySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
        items: daySales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
        )
      }
    }).reverse()

    return dailyData
  }

  const getTopProducts = () => {
    // Initialize map to store product sales data
    const productMap = new Map();

    // Process each sale and its items
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product;
        const product = products.find(p => p.id === productId);
        const productName = product?.name || `Product #${productId}`;
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            name: productName,
            quantity: 0,
            revenue: 0
          });
        }

        const productData = productMap.get(productId);
        productData.quantity += Number(item.quantity);
        productData.revenue += Number(item.quantity) * Number(item.unit_price);
        productMap.set(productId, productData);
      });
    });

    // Convert map to array and sort by quantity
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5) // Show top 5 products
      .map(product => ({
        name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
        quantity: product.quantity,
        revenue: Math.round(product.revenue)
      }));

    return topProducts;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#151b29] to-[#1f2b3e] p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">Dashboard</h1>
        <p className="mt-2 text-gray-400 max-w-2xl">
          Welcome to your inventory dashboard. Get a quick overview of your key metrics and recent sales activity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Products"
          value={totalProducts.toLocaleString()}
          icon={<RiArchiveLine className="w-6 h-6" />}
          color="blue"
          trend={{ value: 8, isUp: true }}
        />
        <StatsCard
          title="Low Stock Items"
          value={lowStockItems}
          icon={<RiAlertLine className="w-6 h-6" />}
          color="amber"
          trend={{ value: 12, isUp: lowStockItems > 0 ? false : true }}
        />
        <StatsCard
          title="Total Sales"
          value={`Ksh ${totalSalesAmount.toLocaleString()}`}
          icon={<RiShoppingCart2Line className="w-6 h-6" />}
          color="green"
          trend={{ value: 24, isUp: true }}
        />
        <StatsCard
          title="Monthly Revenue"
          value={`Ksh ${monthlyRevenue.toLocaleString()}`}
          icon={<RiBarChartBoxLine className="w-6 h-6" />}
          color="orange"
          trend={{ value: 18, isUp: true }}
        />
      </div>

      {/* Add Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 mb-8">
        {/* Sales Trend Chart */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/70 rounded-xl p-6 shadow-xl border border-gray-700/30">
          <h3 className="text-lg font-semibold text-white mb-4">Sales Trend (Last 7 Days)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getDailySalesData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#F97316" 
                  name="Sales (Ksh)"
                />
                <Line 
                  type="monotone" 
                  dataKey="items" 
                  stroke="#3B82F6" 
                  name="Items Sold"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/70 rounded-xl p-6 shadow-xl border border-gray-700/30">
          <h3 className="text-lg font-semibold text-white mb-4">Top 5 Products</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={getTopProducts()}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  label={{ value: 'Quantity Sold', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  label={{ value: 'Revenue (Ksh)', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '0.5rem',
                    padding: '8px'
                  }}
                  formatter={(value, name) => [
                    name === 'revenue' ? `Ksh ${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Units Sold'
                  ]}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  dataKey="quantity" 
                  fill="#F97316" 
                  name="Units Sold"
                  yAxisId="left"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#3B82F6" 
                  name="Revenue"
                  yAxisId="right"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <RecentActivity products={products} onSaleClick={handleSaleClick} />

      {/* Sale details modal */}
      {isLoadingSaleDetails && <SaleDetailsLoading />}
      
      {!isLoadingSaleDetails && selectedSale && (
        <SaleDetailsModal 
          sale={selectedSale} 
          products={products}
          onClose={handleCloseModal}
        />
      )}

      {/* Custom styles for animations */}
      <style>
        {`
          .animate-fadeIn {
            animation: fadeIn 0.3s ease forwards;
          }
                
          .animate-slideUp {
            animation: slideUp 0.4s ease forwards;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slideUp {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.5);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(249, 115, 22, 0.4);
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(249, 115, 22, 0.6);
          }
        `}
      </style>
    </div>
  )
}