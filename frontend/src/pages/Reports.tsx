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
  const [reportType, setReportType] = useState('dairy');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timePeriod, setTimePeriod] = useState<number>(1); // Default to 1 day
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false);
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  
  // Function to fetch report data based on report type
  const fetchReportData = async (type: string, days = timePeriod) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      let url = '';
      let params: any = {};
      
      // Set URL and params based on report type
      switch (type) {
        case 'dairy':
          url = `${baseURL}/api/dairy/stats`;
          break;
        case 'sales':
          url = `${baseURL}/api/sales/analytics`;
          params.group_by = 'date';
          break;
        case 'inventory':
          url = `${baseURL}/api/inventory/analytics`;
          break;
        case 'financial':
          url = `${baseURL}/api/sales/analytics`;
          params.group_by = 'payment_method';
          break;
        case 'audit':
          url = `${baseURL}/api/audit/logs`;
          break;
        default:
          url = `${baseURL}/api/sales/analytics`;
          params.group_by = 'category';
      }
      
      // Add time parameters
      if (isCustomDate && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      } else {
        params.days = days;
      }
      
      const response = await axios.get(url, { params });
      setReportData(response.data);
      
      // Process data if it's dairy report
      if (type === 'dairy') {
        processDairyData(response.data);
      } else {
        setCategoryData(response.data);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      setError(`Failed to fetch ${type} data. Please ensure the API server is running.`);
      setIsLoading(false);
    }
  };
  
  // Process dairy data specifically
  const processDairyData = (data: any) => {
    setDairyStats(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // Extract data from the report response
      const { total_stats, analytics } = data;
      
      // Find dairy category data
      const dairyCategory = analytics?.find(
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
    // Initial data fetch
    fetchReportData(reportType);
    
    // Set up automatic refresh interval
    const intervalId = setInterval(() => {
      fetchReportData(reportType);
    }, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval, reportType, timePeriod, isCustomDate, startDate, endDate]);

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
    fetchReportData(reportType);
  };
  
  // Handle report type change
  const handleReportTypeChange = (type: string) => {
    setReportType(type);
    fetchReportData(type);
  };
  
  // Handle time period change
  const handleTimePeriodChange = (days: number) => {
    setTimePeriod(days);
    setIsCustomDate(false);
    fetchReportData(reportType, days);
  };
  
  // Toggle custom date mode
  const handleCustomDateToggle = () => {
    const newValue = !isCustomDate;
    setIsCustomDate(newValue);
    
    if (newValue) {
      // Set default date range if switching to custom
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      
      setStartDate(lastWeek.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  // Loading state for initial page load
  if (productsLoading || salesLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RiLoader4Line className="animate-spin text-primary-500 w-10 h-10" />
      </div>
    );
  }

  // Render the report content based on selected type
  const renderReportContent = () => {
    // Show error if there's one
    if (error) {
      return (
        <div className="text-red-500 p-4 text-center card">
          {error}
        </div>
      );
    }
    
    // Show loading if loading
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <RiLoader4Line className="animate-spin text-primary-500 w-10 h-10" />
        </div>
      );
    }

    // Render the appropriate report content based on type
    switch (reportType) {
      case 'dairy':
        return renderDairyStats();
      case 'sales':
        return renderSalesStats();
      case 'inventory':
        return renderInventoryStats();
      case 'financial':
        return renderFinancialStats();
      case 'audit':
        return renderAuditStats();
      default:
        return renderDairyStats();
    }
  };
  
  // Render dairy statistics
  const renderDairyStats = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Dairy Products - Daily Report</h3>
          <button 
            onClick={() => fetchReportData('dairy')}
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
  
  // Render sales statistics
  const renderSalesStats = () => {
    if (!reportData || !reportData.analytics) {
      return (
        <div className="text-gray-400 p-4 text-center">
          No sales data available for the selected period.
        </div>
      );
    }
    
    const { analytics, total_stats } = reportData;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Sales Report</h3>
          <button 
            onClick={() => fetchReportData('sales')}
            className="text-primary-500 hover:text-primary-400 flex items-center"
          >
            <RiRefreshLine className="mr-1" />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Total Revenue</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {total_stats?.revenue?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Total Transactions</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              {total_stats?.count?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Avg. Transaction</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {total_stats?.count ? (total_stats.revenue / total_stats.count).toFixed(2) : '0.00'}
            </p>
          </div>
        </div>
        
        {/* Sales by Date/Period Table */}
        <div className="card p-4">
          <h4 className="text-md font-medium text-white mb-4">Sales by Date</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="py-2 px-4 text-left text-gray-400">Date</th>
                  <th className="py-2 px-4 text-right text-gray-400">Transactions</th>
                  <th className="py-2 px-4 text-right text-gray-400">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-dark-700">
                    <td className="py-2 px-4 text-white">
                      {item.date || new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 text-right text-white">
                      {item.count || item.transaction_count || '1'}
                    </td>
                    <td className="py-2 px-4 text-right text-white">
                      Ksh {(item.total_revenue || item.revenue || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render inventory statistics
  const renderInventoryStats = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Inventory Report</h3>
          <button 
            onClick={() => fetchReportData('inventory')}
            className="text-primary-500 hover:text-primary-400 flex items-center"
          >
            <RiRefreshLine className="mr-1" />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Total Products</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              {products.length}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Inventory Value</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {inventoryValue.toLocaleString()}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Low Stock Items</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              {lowStockItems.length} items
            </p>
          </div>
        </div>
        
        {/* Inventory Items Table */}
        <div className="card p-4">
          <h4 className="text-md font-medium text-white mb-4">Low Stock Items</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="py-2 px-4 text-left text-gray-400">Product</th>
                  <th className="py-2 px-4 text-right text-gray-400">Current Stock</th>
                  <th className="py-2 px-4 text-right text-gray-400">Value</th>
                  <th className="py-2 px-4 text-right text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.slice(0, 10).map((product: Product) => (
                  <tr key={product.id} className="border-b border-dark-700">
                    <td className="py-2 px-4 text-white">{product.name}</td>
                    <td className="py-2 px-4 text-right text-white">{product.quantity}</td>
                    <td className="py-2 px-4 text-right text-white">
                      Ksh {(product.quantity * Number(product.unit_price)).toLocaleString()}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render financial statistics
  const renderFinancialStats = () => {
    if (!reportData || !reportData.analytics) {
      return (
        <div className="text-gray-400 p-4 text-center">
          No financial data available for the selected period.
        </div>
      );
    }
    
    const { analytics, total_stats } = reportData;
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Financial Report</h3>
          <button 
            onClick={() => fetchReportData('financial')}
            className="text-primary-500 hover:text-primary-400 flex items-center"
          >
            <RiRefreshLine className="mr-1" />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Total Revenue</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {total_stats?.revenue?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Total Cost</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {total_stats?.cost?.toLocaleString() || '0'}
            </p>
          </div>
          
          <div className="card p-4">
            <h4 className="text-md font-medium text-white">Total Profit</h4>
            <p className="text-2xl font-bold text-primary-500 mt-2">
              Ksh {total_stats?.profit?.toLocaleString() || '0'}
            </p>
          </div>
        </div>
        
        {/* Payment Methods Table */}
        <div className="card p-4">
          <h4 className="text-md font-medium text-white mb-4">Sales by Payment Method</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="py-2 px-4 text-left text-gray-400">Payment Method</th>
                  <th className="py-2 px-4 text-right text-gray-400">Transactions</th>
                  <th className="py-2 px-4 text-right text-gray-400">Revenue</th>
                  <th className="py-2 px-4 text-right text-gray-400">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((item: any, index: number) => {
                  const percentage = total_stats?.revenue 
                    ? ((item.total_revenue / total_stats.revenue) * 100).toFixed(1) 
                    : '0';
                    
                  return (
                    <tr key={index} className="border-b border-dark-700">
                      <td className="py-2 px-4 text-white capitalize">
                        {item.payment_method || 'Unknown'}
                      </td>
                      <td className="py-2 px-4 text-right text-white">
                        {item.count || item.transaction_count || '0'}
                      </td>
                      <td className="py-2 px-4 text-right text-white">
                        Ksh {(item.total_revenue || item.revenue || 0).toLocaleString()}
                      </td>
                      <td className="py-2 px-4 text-right text-white">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Render audit statistics
  const renderAuditStats = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Audit Report</h3>
          <button 
            onClick={() => fetchReportData('audit')}
            className="text-primary-500 hover:text-primary-400 flex items-center"
          >
            <RiRefreshLine className="mr-1" />
            Refresh
          </button>
        </div>
        
        <div className="card p-4 text-center text-gray-400">
          <p>Audit functionality is under development.</p>
          <p>Please check back later for detailed activity logs.</p>
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

      {/* Report Type & Time Selection */}
      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row md:space-x-4 mb-4">
          <div className="flex-1">
            <select 
              className="input-field w-full"
              value={reportType}
              onChange={(e) => handleReportTypeChange(e.target.value)}
            >
              <option value="">Select Report Type</option>
              {reportTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="flex-1 flex space-x-2 mb-4 md:mb-0">
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
        </div>
        
        {isCustomDate && (
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1">
              <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="input-field pl-10 w-full"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="relative flex-1">
              <RiCalendarLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                className="input-field pl-10 w-full"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button 
              onClick={() => fetchReportData(reportType)}
              className="btn-primary whitespace-nowrap"
            >
              Generate
            </button>
          </div>
        )}
      </div>

      {/* Report Content Section */}
      {reportType && (
        <div className="card p-6 mb-6">
          {renderReportContent()}
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
              onClick={() => fetchReportData(reportType)}
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
              <button 
                className="btn-primary flex-1"
                onClick={() => handleReportTypeChange(type.id)}
              >
                Generate
              </button>
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