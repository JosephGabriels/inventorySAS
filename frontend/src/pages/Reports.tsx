import {
  RiDownloadLine,
  RiCalendarLine,
  RiBarChartBoxLine,
  RiPieChartLine,
  RiLineChartLine,
  RiFileTextLine,
  RiLoader4Line,
  RiRefreshLine,
  RiShoppingCartLine,
  RiMoneyDollarCircleLine,
  RiPriceTag3Line
} from 'react-icons/ri'
import { useSales } from '../hooks/useSales'
import { useProducts, Product } from '../hooks/useProducts'
import { useState, useEffect } from 'react'
import axios from 'axios'

interface ReportType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

interface SalesAnalytics {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  total_stats: {
    revenue: number;
    cost: number;
    profit: number;
    quantity: number;
  };
  analytics: Array<{
    product__category__name: string;
    total_quantity: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
  }>;
}

interface DairyStats {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  profitPercentage: number;
  totalQuantity: number;
  isLoading: boolean;
  error: string | null;
}

const reportTypes: ReportType[] = [
  {
    id: 'dairy',
    name: 'Dairy Report',
    description: 'Daily sales and profits for dairy products',
    icon: <RiBarChartBoxLine className="w-6 h-6" />,
  },
  {
    id: 'sales',
    name: 'Sales Report',
    description: 'Analyze sales performance and trends',
    icon: <RiBarChartBoxLine className="w-6 h-6" />,
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Stock levels and movement analysis',
    icon: <RiPieChartLine className="w-6 h-6" />,
  },
  {
    id: 'financial',
    name: 'Financial Report',
    description: 'Revenue, costs, and profit analysis',
    icon: <RiLineChartLine className="w-6 h-6" />,
  },
  {
    id: 'audit',
    name: 'Audit Report',
    description: 'Detailed activity and changes log',
    icon: <RiFileTextLine className="w-6 h-6" />,
  },
]

const ProductPerformanceTable = ({ data }: { data: SalesAnalytics['analytics'] }) => (
  <div className="bg-[#1a1f2e] rounded-xl overflow-hidden shadow-2xl border border-gray-800/50">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#232838]">
            <th className="px-6 py-4 text-left">
              <div className="flex items-center space-x-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <RiBarChartBoxLine className="w-4 h-4" />
                <span>Category</span>
              </div>
            </th>
            <th className="px-6 py-4">
              <div className="flex items-center justify-end space-x-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <RiShoppingCartLine className="w-4 h-4" />
                <span>Units Sold</span>
              </div>
            </th>
            <th className="px-6 py-4">
              <div className="flex items-center justify-end space-x-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <RiMoneyDollarCircleLine className="w-4 h-4" />
                <span>Revenue</span>
              </div>
            </th>
            <th className="px-6 py-4">
              <div className="flex items-center justify-end space-x-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <RiPriceTag3Line className="w-4 h-4" />
                <span>Cost</span>
              </div>
            </th>
            <th className="px-6 py-4">
              <div className="flex items-center justify-end space-x-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <RiLineChartLine className="w-4 h-4" />
                <span>Profit</span>
              </div>
            </th>
            <th className="px-6 py-4">
              <div className="flex items-center justify-end space-x-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                <RiPieChartLine className="w-4 h-4" />
                <span>Margin</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {data.map((item, index) => {
            const margin = ((item.profit / item.total_revenue) * 100);
            return (
              <tr 
                key={index} 
                className="transition-colors hover:bg-gray-800/30 group"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-orange-500 mr-3"></div>
                    <span className="text-white font-medium group-hover:text-orange-400 transition-colors">
                      {item.product__category__name || 'Uncategorized'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-300 font-medium">
                    {item.total_quantity.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-300 font-medium">
                    Ksh {item.total_revenue.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-gray-300 font-medium">
                    Ksh {item.total_cost.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-semibold ${
                    item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    Ksh {item.profit.toLocaleString()}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end space-x-3">
                    <div className="w-24 h-2 rounded-full bg-gray-800">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          margin >= 30 ? 'bg-emerald-500' : 
                          margin >= 20 ? 'bg-orange-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, margin))}%` }}
                      />
                    </div>
                    <span className={`font-semibold text-sm ${
                      margin >= 30 ? 'text-emerald-400' : 
                      margin >= 20 ? 'text-orange-400' : 
                      'text-red-400'
                    }`}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export const Reports = () => {
  const { products, isLoading: productsLoading } = useProducts();
  const { sales, isLoading: salesLoading } = useSales();
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dairyStats, setDairyStats] = useState<DairyStats>({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    profitPercentage: 0,
    totalQuantity: 0,
    isLoading: false,
    error: null
  });
  const [categoryData, setCategoryData] = useState<SalesAnalytics | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute refresh by default

  // Function to fetch category analytics data
  const fetchCategoryAnalytics = async (days = 1) => {
    setDairyStats(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${baseURL}/api/sales/analytics?days=${days}&group_by=category`);
      setCategoryData(response.data);
      
      // Find dairy category data and calculate stats
      const dairyCategory = response.data.analytics.find(
        (item: any) => item.product__category__name?.toLowerCase() === 'dairy'
      );
      
      if (dairyCategory) {
        const totalSales = dairyCategory.total_revenue || 0;
        const totalCost = dairyCategory.total_cost || 0;
        const totalProfit = dairyCategory.profit || 0;
        const profitPercentage = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
        
        setDairyStats({
          totalSales,
          totalCost,
          totalProfit,
          profitPercentage,
          totalQuantity: dairyCategory.total_quantity || 0,
          isLoading: false,
          error: null
        });
      } else {
        setDairyStats({
          totalSales: 0,
          totalCost: 0,
          totalProfit: 0,
          profitPercentage: 0,
          totalQuantity: 0,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('Error fetching category analytics:', error);
      setDairyStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch dairy statistics'
      }));
    }
  };

  // Fetch data on component mount and set up refresh interval
  useEffect(() => {
    fetchCategoryAnalytics();
    
    // Set up automatic refresh interval
    const intervalId = setInterval(() => {
      fetchCategoryAnalytics();
    }, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  // Calculate statistics from real data in real-time
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);

  // Calculate total sales from the last 30 days
  const recentSales = sales?.filter(sale => new Date(sale.created_at) >= last30Days) || [];
  const totalSales = recentSales.reduce((total, sale) => total + Number(sale.total_amount), 0);
  
  // Calculate sales growth percentage using real data if available
  const previousPeriodSales = categoryData?.total_stats?.revenue || 0;
  const currentPeriodSales = totalSales;
  const salesGrowth = previousPeriodSales > 0 
    ? ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100 
    : 0;

  // Calculate inventory value
  const inventoryValue = products?.reduce((total: number, product: Product) => 
    total + (Number(product.unit_price) * product.quantity), 0) || 0;
  
  // Calculate low stock items
  const lowStockItems = products?.filter((product: Product) => product.quantity <= 5) || [];
  const lowStockPercentage = products?.length 
    ? Math.round((lowStockItems.length / products.length) * 100) 
    : 0;

  // Sort sales by date for recent reports
  const recentReports = [...(sales || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)
    .map(sale => ({
      id: sale.id,
      name: `Sales Report #${sale.id}`,
      date: new Date(sale.created_at),
      type: 'sales'
    }));

  // Calculate average profit margin from real sales data
  const calculateProfitMargin = () => {
    if (!categoryData?.total_stats) return 30; // Default fallback value
    
    const { revenue, cost } = categoryData.total_stats;
    if (!revenue || revenue === 0) return 0;
    
    return ((revenue - cost) / revenue) * 100;
  };
  
  const profitMargin = calculateProfitMargin();

  // Trigger a manual refresh of the dairy data
  const handleRefreshDairyData = () => {
    fetchCategoryAnalytics();
  };

  // Loading state
  if (productsLoading || salesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RiLoader4Line className="animate-spin text-primary-500 w-10 h-10" />
      </div>
    );
  }

  // Render the dairy statistics section
  const renderDairyStats = () => {
    if (dairyStats.isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <RiLoader4Line className="animate-spin text-primary-500 w-10 h-10" />
        </div>
      );
    }

    if (dairyStats.error) {
      return (
        <div className="text-red-500 p-4 text-center">
          {dairyStats.error}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Dairy Products - Daily Report</h3>
          <button 
            onClick={handleRefreshDairyData}
            className="text-primary-500 hover:text-primary-400 flex items-center"
          >
            <RiRefreshLine className="mr-1" />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Daily Sales</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {dairyStats.totalSales.toLocaleString()}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Daily Profit</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {dairyStats.totalProfit.toLocaleString()}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Profit Margin</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              {dairyStats.profitPercentage.toFixed(2)}%
            </p>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-white">Units Sold Today</h4>
            <span className="text-primary-500 text-sm">{dairyStats.totalQuantity} items</span>
          </div>
          <div className="w-full bg-dark-700 h-4 rounded-full">
            <div 
              className="bg-primary-500 h-4 rounded-full" 
              style={{ width: `${Math.min(100, (dairyStats.totalQuantity / 100) * 100)}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Based on today's sales data
          </p>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Reports</h1>
          <p className="mt-1 text-sm text-gray-400">
            Generate and analyze reports
          </p>
        </div>
        <button className="btn-primary flex items-center">
          <RiDownloadLine className="mr-2" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Total Sales</h3>
            <span className="text-green-500">+{salesGrowth}%</span>
          </div>
          <p className="text-2xl font-bold text-primary-500 mt-2">Ksh {totalSales.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Last 30 days</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Inventory Value</h3>
            <span className="text-primary-500">Current</span>
          </div>
          <p className="text-2xl font-bold text-primary-500 mt-2">Ksh {inventoryValue.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-1">Current stock value</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Low Stock</h3>
            <span className="text-red-500">{lowStockItems.length} items</span>
          </div>
          <p className="text-2xl font-bold text-primary-500 mt-2">{lowStockPercentage}%</p>
          <p className="text-sm text-gray-400 mt-1">Of total inventory</p>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Profit Margin</h3>
            <span className="text-green-500">Real-time</span>
          </div>
          <p className="text-2xl font-bold text-primary-500 mt-2">{profitMargin.toFixed(1)}%</p>
          <p className="text-sm text-gray-400 mt-1">Based on current sales data</p>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <select 
              className="input-field w-full"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="">Select Report Type</option>
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="input-field pl-10"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="relative">
              <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="input-field pl-10"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="btn-primary">Generate</button>
          </div>
        </div>
      </div>

      {/* Dairy Reports Section */}
      {reportType === 'dairy' && (
        <div className="card p-6 mb-6">
          {renderDairyStats()}
        </div>
      )}

      {categoryData && categoryData.analytics && (
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium text-white">Product Performance</h3>
              <p className="text-sm text-gray-400">Category-wise sales and profit analysis</p>
            </div>
            <button 
              onClick={handleRefreshDairyData}
              className="text-primary-500 hover:text-primary-400 flex items-center"
            >
              <RiRefreshLine className="mr-1" />
              Refresh
            </button>
          </div>
          <ProductPerformanceTable data={categoryData.analytics} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((type) => (
          <div key={type.id} className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-primary-500/10 text-primary-500">
                {type.icon}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">{type.name}</h3>
                <p className="text-sm text-gray-400">{type.description}</p>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button className="btn-primary flex-1">Generate</button>
              <button className="btn-secondary flex items-center justify-center">
                <RiDownloadLine className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6">
        <h3 className="text-lg font-medium text-white mb-4">Recent Reports</h3>
        <div className="space-y-4">
          {recentReports.length > 0 ? (
            recentReports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0"
              >
                <div className="flex items-center space-x-3">
                  <RiFileTextLine className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-white">{report.name}</p>
                    <p className="text-sm text-gray-400">
                      Generated {report.date.toLocaleDateString()} at {report.date.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <button className="text-primary-500 hover:text-primary-400">
                  Download
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-400 py-4 text-center">
              No reports generated yet. Use the form above to create a new report.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}