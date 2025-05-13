import { useState, useEffect } from 'react'
import { api, dairyAPI } from '../services/api'  // Import both api instance and dairyAPI
import { 
  RiBarChartBoxLine, 
  RiLoader4Line, 
  RiRefreshLine,
  RiDownloadLine,
  RiCalendarLine
} from 'react-icons/ri'

// Update the interfaces to match the API response
interface DairyStats {
  categories_used: string[];
  dairy_products: Array<{
    product__name: string;
    product__id: number;
    total_quantity: number;
    total_revenue: number;
    total_cost: number;
    profit: number;
  }>;
  debug_info: {
    dairy_categories_count: number;
    dairy_products_count: number;
    date_range: string;
    data_source: string;
  };
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  total_stats: {
    cost: number;
    profit: number;
    quantity: number;
    revenue: number;
  };
}

export const DairyReports = () => {
  const [dairyStats, setDairyStats] = useState<DairyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriesUsed, setCategoriesUsed] = useState<string[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [dairyProducts, setDairyProducts] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number>(60000); // 1 minute refresh by default
  const [timePeriod, setTimePeriod] = useState<number>(1); // Default to 1 day
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);

  // Update the fetch function
  const fetchDairyAnalytics = async (days = timePeriod) => {
    setIsLoading(true);
    try {
      const response = await dairyAPI.getStats(days);
      if (response) {
        setDairyStats(response);
        setCategoriesUsed(response.categories_used);
        setProductCount(response.debug_info.dairy_products_count);
        setDairyProducts(response.dairy_products);
      }
    } catch (error) {
      console.error('Error fetching dairy analytics:', error);
      setError('Failed to fetch dairy statistics');
    } finally {
      setIsLoading(false);
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

  // Update the loading check
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RiLoader4Line className="animate-spin text-primary-500 w-10 h-10" />
      </div>
    );
  }

  // Update the statistics display
  const renderStatistics = () => {
    if (!dairyStats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Total Sales</h3>
            <span className="text-primary-500">Dairy</span>
          </div>
          <p className="text-2xl font-bold text-primary-500 mt-2">
            Ksh {dairyStats.total_stats.revenue.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {dairyStats.period.start_date} to {dairyStats.period.end_date}
          </p>
        </div>
        {/* Add other stat cards similarly */}
      </div>
    );
  };

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
      
      {error ? (
        <div className="text-red-500 p-4 text-center card">
          {error}
        </div>
      ) : (
        <>
          {renderStatistics()}

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
                  Ksh {dairyStats?.total_stats.quantity ? (dairyStats.total_stats.cost / dairyStats.total_stats.quantity).toFixed(2) : '0.00'}
                </span>
              </div>
              
              <div className="flex justify-between border-b border-dark-700 pb-2">
                <span className="text-gray-400">Average Profit per Item</span>
                <span className="text-white font-medium">
                  Ksh {dairyStats?.total_stats.quantity ? (dairyStats.total_stats.profit / dairyStats.total_stats.quantity).toFixed(2) : '0.00'}
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