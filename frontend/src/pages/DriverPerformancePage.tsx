import { useState, useEffect } from 'react';
import { 
  User, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  TrendingUp,
  Shield,
  Ban,
  CheckSquare
} from 'lucide-react';
import { driverAPI, DriverPerformance } from '../services/api';

const DriverPerformancePage = () => {
  const [drivers, setDrivers] = useState<DriverPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<DriverPerformance | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDriverPerformance();
  }, []);

  const loadDriverPerformance = async () => {
    try {
      setLoading(true);
      const response = await driverAPI.getDriverPerformance();
      setDrivers(response.data.drivers);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load driver performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedDriver) return;

    try {
      setActionLoading(true);
      await driverAPI.suspendDriver(selectedDriver._id, suspendReason);
      await loadDriverPerformance();
      setShowSuspendModal(false);
      setSelectedDriver(null);
      setSuspendReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to suspend driver');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (driver: DriverPerformance) => {
    if (!confirm(`Are you sure you want to unsuspend ${driver.name}?`)) return;

    try {
      setActionLoading(true);
      await driverAPI.unsuspendDriver(driver._id);
      await loadDriverPerformance();
    } catch (err: any) {
      alert(err.message || 'Failed to unsuspend driver');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getExpiryStatus = (driver: DriverPerformance) => {
    if (!driver.licenceExpiry) return { text: 'Not Set', color: 'text-gray-500', bgColor: 'bg-gray-100' };
    
    if (driver.isLicenseExpired) {
      return { text: 'Expired', color: 'text-red-600', bgColor: 'bg-red-100' };
    }

    if (driver.daysUntilExpiry !== null && driver.daysUntilExpiry <= 30) {
      return { text: `${driver.daysUntilExpiry} days left`, color: 'text-orange-600', bgColor: 'bg-orange-100' };
    }

    return { text: 'Valid', color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 70) return 'text-blue-600';
    if (rate >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Driver Performance & Safety</h1>
                <p className="text-sm text-gray-600">Monitor compliance, licenses, and performance metrics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Drivers</p>
                <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Drivers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.isActive).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expired Licenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.isLicenseExpired).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter(d => d.daysUntilExpiry !== null && d.daysUntilExpiry > 0 && d.daysUntilExpiry <= 30).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded-full">
                <Ban className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold text-gray-900">
                  {drivers.filter(d => !d.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Expiry
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No drivers found</p>
                    </td>
                  </tr>
                ) : (
                  drivers.map((driver) => {
                    const expiryStatus = getExpiryStatus(driver);
                    return (
                      <tr key={driver._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                              <div className="text-sm text-gray-500">{driver.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.licenceNumber}</div>
                          {driver.licenceType && (
                            <div className="text-xs text-gray-500">{driver.licenceType}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${driver.isLicenseExpired ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(driver.licenceExpiry)}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${expiryStatus.bgColor} ${expiryStatus.color}`}>
                            {expiryStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <TrendingUp className={`w-4 h-4 ${getCompletionRateColor(driver.tripStats.completionRate)}`} />
                            <span className={`text-sm font-bold ${getCompletionRateColor(driver.tripStats.completionRate)}`}>
                              {driver.tripStats.completionRate}%
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {driver.tripStats.completedTrips}/{driver.tripStats.totalTrips} trips
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {driver.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                Suspended
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              driver.dutyStatus === 'ON_DUTY' ? 'bg-blue-100 text-blue-800' :
                              driver.dutyStatus === 'ON_TRIP' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {driver.dutyStatus.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {driver.isActive ? (
                            <button
                              onClick={() => {
                                setSelectedDriver(driver);
                                setShowSuspendModal(true);
                              }}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnsuspend(driver)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <CheckSquare className="w-4 h-4" />
                              Unsuspend
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      {showSuspendModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Suspend Driver</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to suspend <strong>{selectedDriver.name}</strong>? 
              They will not be able to be assigned to trips until unsuspended.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Suspension (Optional)
              </label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g., License expired, Safety violation, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSelectedDriver(null);
                  setSuspendReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? 'Suspending...' : 'Suspend Driver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverPerformancePage;
