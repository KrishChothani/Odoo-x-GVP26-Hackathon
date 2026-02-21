import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, User } from '../services/api';
import { 
  LogOut, 
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Fuel,
  Wrench,
  FileText,
  Calendar
} from 'lucide-react';

const FinancialAnalystDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Check authentication and role
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Only financial analysts can access this dashboard
      if (parsedUser.role !== 'FINANCIAL_ANALYST') {
        navigate('/login');
        return;
      }
    }
    
    setLoading(false);
  }, [navigate]);

  // Logout handler
  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Financial Analyst Portal</h1>
                <p className="text-sm text-gray-500">Audit Operations & Analyze Costs</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role.replace('_', ' ')}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Financial Overview</h2>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Operating Cost</p>
              <DollarSign className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$0</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">0% vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Fuel Expenses</p>
              <Fuel className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$0</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600">0% vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Maintenance Cost</p>
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$0</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-green-600">0% vs last period</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Cost Per Mile</p>
              <BarChart3 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">$0</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600">0% vs last period</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses, vehicles, reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
              <FileText className="w-4 h-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button className="border-b-2 border-emerald-500 py-4 px-1 text-sm font-medium text-emerald-600">
                Expense Analysis
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Fuel Audit
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Maintenance ROI
              </button>
              <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                Cost Breakdown
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center py-12">
              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No financial data yet</h3>
              <p className="text-gray-500 mb-6">
                Expense records and financial analytics will appear here once data is available
              </p>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Fuel Cost Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Fuel Cost Breakdown</h3>
              <Fuel className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Fuel Purchased</span>
                <span className="font-medium text-gray-900">0 gallons</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Price/Gallon</span>
                <span className="font-medium text-gray-900">$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Most Efficient Vehicle</span>
                <span className="font-medium text-gray-900">N/A</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Least Efficient Vehicle</span>
                <span className="font-medium text-gray-900">N/A</span>
              </div>
            </div>
          </div>

          {/* Maintenance ROI */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Maintenance ROI</h3>
              <Wrench className="w-5 h-5 text-blue-500" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Preventive Maintenance</span>
                <span className="font-medium text-gray-900">$0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Emergency Repairs</span>
                <span className="font-medium text-gray-900">$0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cost Savings Ratio</span>
                <span className="font-medium text-green-600">0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Downtime Cost</span>
                <span className="font-medium text-gray-900">$0/day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Responsibilities */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Financial Analyst Responsibilities</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
              <span className="text-gray-700">Audit and analyze all fleet operational expenses</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
              <span className="text-gray-700">Monitor fuel consumption patterns and identify cost-saving opportunities</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
              <span className="text-gray-700">Calculate maintenance ROI and cost-benefit analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
              <span className="text-gray-700">Track cost per mile and cost per trip metrics</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
              <span className="text-gray-700">Generate financial reports and budget forecasts</span>
            </li>
            <li className="flex items-start gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600 mt-0.5" />
              <span className="text-gray-700">Identify underperforming assets and recommend cost optimizations</span>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default FinancialAnalystDashboard;
