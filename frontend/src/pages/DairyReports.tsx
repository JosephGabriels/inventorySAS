import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  RiBarChartBoxLine, 
  RiLoader4Line, 
  RiRefreshLine,
  RiDownloadLine,
  RiCalendarLine
} from 'react-icons/ri'

interface DairyStats {
  totalSales: number;
  totalCost: number;
  totalProfit: number;
  profitPercentage: number;
  totalQuantity: number;
  isLoading: boolean;
  error: string | null;
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

export const DairyReports = () => {
  const [dairyStats, setDairyStats] = useState<DairyStats>({
    totalSales: 0,
    totalCost: 0,
    totalProfit: 0,
    profitPercentage: 0,
    totalQuantity: 0,
    isLoading: true,
    error: null
  });
  const [categoriesUsed, setCategoriesUsed] = useState<string[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [dairyProducts, setDairyProducts] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute refresh by default
  const [timePeriod, setTimePeriod] = useState<number>(1); // Default to 1 day
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);

  // Function to fetch category analytics data
  const fetchDairyAnalytics = async (days = timePeriod) => {
    setDairyStats(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const url = `${baseURL}/api/dairy/stats`;
      const params = isCustomDate && startDate && endDate 
        ? { start_date: startDate, end_date: endDate }
        : { days };
      
      const response = await axios.get(url, { params });
      
      // Extract data from the dairy stats response
      const { total_stats, categories_used, product_count, message, dairy_products } = response.data;
      
      // Set any informational message
      setMessage(message || null);
      
      // Set categories used and product count
      setCategoriesUsed(categories_used || []);
      setProductCount(product_count || 0);
      
      // Set dairy products list
      setDairyProducts(dairy_products || []);
      
      if (total_stats) {
        const totalSales = total_stats.revenue || 0;
        const totalCost = total_stats.cost || 0;
        const totalProfit = total_stats.profit || 0;
        const profitPercentage = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
        
        setDairyStats({
          totalSales,
          totalCost,
          totalProfit,
          profitPercentage,
          totalQuantity: total_stats.quantity || 0,
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
      console.error('Error fetching dairy analytics:', error);
      setDairyStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to fetch dairy statistics. Please ensure the API server is running.'
      }));
    }
  };

  // Fetch data on component mount and set up refresh interval
  useEffect(() => {
    fetchDairyAnalytics();
    
    // Set up automatic refresh interval
    const intervalId = setInterval(() => {
      fetchDairyAnalytics();
    }, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval, timePeriod, isCustomDate, startDate, endDate]);

  // Trigger a manual refresh of the dairy data
  const handleRefreshDairyData = () => {
    fetchDairyAnalytics();
  };

  // Handle time period change
  const handleTimePeriodChange = (days: number) => {
    setTimePeriod(days);
    setIsCustomDate(false);
  };

  // Toggle custom date mode
  const handleCustomDateToggle = () => {
    setIsCustomDate(!isCustomDate);
    if (!isCustomDate) {
      // Set default date range if switching to custom
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  // Generate report
  const handleGenerateReport = () => {
    fetchDairyAnalytics();
  };

  // Loading state
  if (dairyStats.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RiLoader4Line className="animate-spin text-primary-500 w-10 h-10" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dairy Reports</h1>
          <p className="mt-1 text-sm text-gray-400">
            Real-time dairy product sales and profit statistics
          </p>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleRefreshDairyData}
            className="btn-secondary flex items-center"
          >
            <RiRefreshLine className="mr-2" />
            Refresh Data
          </button>
          <button className="btn-primary flex items-center">
            <RiDownloadLine className="mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 flex space-x-2">
            <button 
              onClick={() => handleTimePeriodChange(1)}
              className={`btn-sm flex-1 ${timePeriod === 1 && !isCustomDate ? 'btn-primary' : 'btn-secondary'}`}
            >
              Today
            </button>
            <button 
              onClick={() => handleTimePeriodChange(7)}
              className={`btn-sm flex-1 ${timePeriod === 7 && !isCustomDate ? 'btn-primary' : 'btn-secondary'}`}
            >
              Week
            </button>
            <button 
              onClick={() => handleTimePeriodChange(30)}
              className={`btn-sm flex-1 ${timePeriod === 30 && !isCustomDate ? 'btn-primary' : 'btn-secondary'}`}
            >
              Month
            </button>
            <button 
              onClick={handleCustomDateToggle}
              className={`btn-sm flex-1 ${isCustomDate ? 'btn-primary' : 'btn-secondary'}`}
            >
              Custom
            </button>
          </div>
          
          {isCustomDate && (
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
              <button 
                onClick={handleGenerateReport}
                className="btn-primary"
              >
                Generate
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className="bg-blue-900/50 border border-blue-700 text-blue-100 p-4 rounded-lg mb-6">
          <p className="flex items-center">
            <span className="mr-2">ℹ️</span>
            <span>{message}</span>
          </p>
        </div>
      )}
      
      {dairyStats.error ? (
        <div className="text-red-500 p-4 text-center card">
          {dairyStats.error}
        </div>
      ) : (
        <>
          {/* Main Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Total Sales</h3>
                <span className="text-primary-500">
                  {categoriesUsed.length > 0 ? 
                    `${categoriesUsed.join(', ')}` : 
                    'Dairy'
                  }
                </span>
              </div>
              <p className="text-2xl font-bold text-primary-500 mt-2">
                Ksh {dairyStats.totalSales.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {isCustomDate ? 'Custom period' : timePeriod === 1 ? 'Today' : timePeriod === 7 ? 'Last 7 days' : 'Last 30 days'}
              </p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Total Profit</h3>
                <span className="text-green-500">Real-time</span>
              </div>
              <p className="text-2xl font-bold text-primary-500 mt-2">
                Ksh {dairyStats.totalProfit.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {isCustomDate ? 'Custom period' : timePeriod === 1 ? 'Today' : timePeriod === 7 ? 'Last 7 days' : 'Last 30 days'}
              </p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Items Sold</h3>
                <span className="text-primary-500">{dairyStats.totalQuantity} units</span>
              </div>
              <p className="text-2xl font-bold text-primary-500 mt-2">
                {dairyStats.totalQuantity.toLocaleString()}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {isCustomDate ? 'Custom period' : timePeriod === 1 ? 'Today' : timePeriod === 7 ? 'Last 7 days' : 'Last 30 days'}
              </p>
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-white">Profit Margin</h3>
                <span className="text-green-500">Real-time</span>
              </div>
              <p className="text-2xl font-bold text-primary-500 mt-2">{dairyStats.profitPercentage.toFixed(2)}%</p>
              <p className="text-sm text-gray-400 mt-1">
                {isCustomDate ? 'Custom period' : timePeriod === 1 ? 'Today' : timePeriod === 7 ? 'Last 7 days' : 'Last 30 days'}
              </p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Performance Metrics</h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-medium text-white">Sales Target</h4>
                  <span className="text-primary-500 text-sm">
                    {dairyStats.totalSales.toLocaleString()} / 10,000 Ksh
                  </span>
                </div>
                <div className="w-full bg-dark-700 h-4 rounded-full">
                  <div 
                    className="bg-primary-500 h-4 rounded-full" 
                    style={{ width: `${Math.min(100, (dairyStats.totalSales / 10000) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {Math.min(100, Math.round((dairyStats.totalSales / 10000) * 100))}% of daily target
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-medium text-white">Profit Goal</h4>
                  <span className="text-primary-500 text-sm">
                    {dairyStats.totalProfit.toLocaleString()} / 3,000 Ksh
                  </span>
                </div>
                <div className="w-full bg-dark-700 h-4 rounded-full">
                  <div 
                    className="bg-green-500 h-4 rounded-full" 
                    style={{ width: `${Math.min(100, (dairyStats.totalProfit / 3000) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {Math.min(100, Math.round((dairyStats.totalProfit / 3000) * 100))}% of daily target
                </p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-md font-medium text-white">Units Sold</h4>
                  <span className="text-primary-500 text-sm">
                    {dairyStats.totalQuantity.toLocaleString()} / 100 units
                  </span>
                </div>
                <div className="w-full bg-dark-700 h-4 rounded-full">
                  <div 
                    className="bg-blue-500 h-4 rounded-full" 
                    style={{ width: `${Math.min(100, (dairyStats.totalQuantity / 100) * 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  {Math.min(100, Math.round((dairyStats.totalQuantity / 100) * 100))}% of daily target
                </p>
              </div>
            </div>
          </div>

          {/* Product Details Table */}
          {dairyProducts && dairyProducts.length > 0 && (
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Product Performance</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="py-2 px-4 text-left text-gray-400">Product</th>
                      <th className="py-2 px-4 text-right text-gray-400">Quantity</th>
                      <th className="py-2 px-4 text-right text-gray-400">Revenue</th>
                      <th className="py-2 px-4 text-right text-gray-400">Profit</th>
                      <th className="py-2 px-4 text-right text-gray-400">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dairyProducts.map((product: any, index: number) => (
                      <tr key={index} className="border-b border-dark-700">
                        <td className="py-2 px-4 text-white">{product.product__name}</td>
                        <td className="py-2 px-4 text-right text-white">{product.total_quantity}</td>
                        <td className="py-2 px-4 text-right text-white">Ksh {product.total_revenue.toLocaleString()}</td>
                        <td className="py-2 px-4 text-right text-white">Ksh {product.profit.toLocaleString()}</td>
                        <td className="py-2 px-4 text-right text-white">
                          {product.total_revenue > 0 ? 
                            ((product.profit / product.total_revenue) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-white mb-4">Additional Information</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-gray-400">Categories Included</span>
                <span className="text-white font-medium">
                  {categoriesUsed.length > 0 ? 
                    categoriesUsed.join(', ') : 
                    'None found'
                  }
                </span>
              </div>
              
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-gray-400">Total Products</span>
                <span className="text-white font-medium">{productCount}</span>
              </div>
              
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-gray-400">Refresh Interval</span>
                <span className="text-white font-medium">Every minute</span>
              </div>
              
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-gray-400">Average Cost per Item</span>
                <span className="text-white font-medium">
                  Ksh {dairyStats.totalQuantity ? (dairyStats.totalCost / dairyStats.totalQuantity).toFixed(2) : '0.00'}
                </span>
              </div>
              
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-gray-400">Average Profit per Item</span>
                <span className="text-white font-medium">
                  Ksh {dairyStats.totalQuantity ? (dairyStats.totalProfit / dairyStats.totalQuantity).toFixed(2) : '0.00'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white font-medium">{new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DairyReports