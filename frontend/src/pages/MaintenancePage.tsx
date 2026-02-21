import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  authAPI,
  User,
  maintenanceAPI,
  ServiceLog,
  ServiceLogCreateData,
  vehicleAPI,
  Vehicle,
  MaintenanceStatsResponse,
} from '../services/api';
import {
  Plus,
  Search,
  Play,
  CheckCircle,
  X,
  Wrench,
  AlertCircle,
  DollarSign,
  Trash2,
} from 'lucide-react';

const MaintenancePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ServiceLog | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 15;

  // Stats
  const [stats, setStats] = useState<MaintenanceStatsResponse['data']['stats'] | null>(null);

  // Available vehicles (for creation)
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  // Form state
  const [formData, setFormData] = useState<ServiceLogCreateData>({
    vehicleId: '',
    issueOrService: '',
    description: '',
    serviceType: 'REPAIR',
    scheduledDate: new Date().toISOString().split('T')[0],
    estimatedCost: 0,
    odometerReading: 0,
    serviceProvider: 'In-House',
    mechanicName: '',
    notes: '',
    priority: 'MEDIUM',
  });

  // Complete form state
  const [completeData, setCompleteData] = useState({
    cost: 0,
    notes: '',
    odometerReading: 0,
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        const currentUser = response.data;
        
        // Only FLEET_MANAGER and DISPATCHER can access
        if (!['FLEET_MANAGER', 'DISPATCHER'].includes(currentUser.role)) {
          alert('Access denied: Only Fleet Managers and Dispatchers can access maintenance');
          navigate('/dashboard');
          return;
        }
        
        setUser(currentUser);
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Load service logs
  const loadServiceLogs = async () => {
    try {
      setLoading(true);
      const response = await maintenanceAPI.getAll({
        search: searchQuery,
        status: statusFilter as any,
        priority: priorityFilter as any,
        page: currentPage,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      setServiceLogs(response.data.serviceLogs);
      setTotalPages(response.data.pagination.totalPages);
      setTotalCount(response.data.pagination.totalCount);
    } catch (error: any) {
      console.error('Error loading service logs:', error);
      alert(error.message || 'Failed to load service logs');
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await maintenanceAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load available vehicles (not IN_SHOP, not ON_TRIP)
  const loadAvailableVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll({ 
        status: 'AVAILABLE', 
        isActive: true, 
        limit: 100 
      });
      setAvailableVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadServiceLogs();
      loadStats();
    }
  }, [currentPage, searchQuery, statusFilter, priorityFilter, user]);

  // Handle create service log
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicleId || !formData.issueOrService) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await maintenanceAPI.create(formData);
      alert('Service log created successfully! Vehicle moved to IN_SHOP.');
      setShowCreateModal(false);
      resetForm();
      loadServiceLogs();
      loadStats();
    } catch (error: any) {
      console.error('Error creating service log:', error);
      alert(error.response?.data?.message || 'Failed to create service log');
    }
  };

  // Handle start service
  const handleStartService = async (logId: string) => {
    if (!confirm('Start this service?')) return;

    try {
      await maintenanceAPI.start(logId);
      alert('Service started successfully!');
      loadServiceLogs();
      loadStats();
    } catch (error: any) {
      console.error('Error starting service:', error);
      alert(error.response?.data?.message || 'Failed to start service');
    }
  };

  // Handle complete service
  const handleCompleteService = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedLog) return;

    try {
      await maintenanceAPI.complete(selectedLog._id, completeData);
      alert('Service completed successfully! Vehicle returned to AVAILABLE.');
      setShowCompleteModal(false);
      setSelectedLog(null);
      setCompleteData({ cost: 0, notes: '', odometerReading: 0 });
      loadServiceLogs();
      loadStats();
    } catch (error: any) {
      console.error('Error completing service:', error);
      alert(error.response?.data?.message || 'Failed to complete service');
    }
  };

  // Handle cancel service
  const handleCancelService = async (logId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      await maintenanceAPI.cancel(logId, reason);
      alert('Service cancelled successfully! Vehicle returned to AVAILABLE.');
      loadServiceLogs();
      loadStats();
    } catch (error: any) {
      console.error('Error cancelling service:', error);
      alert(error.response?.data?.message || 'Failed to cancel service');
    }
  };

  // Handle delete service
  const handleDeleteService = async (logId: string) => {
    if (!confirm('Delete this service log? Vehicle will be returned to AVAILABLE.')) return;

    try {
      await maintenanceAPI.delete(logId);
      alert('Service log deleted successfully!');
      loadServiceLogs();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting service:', error);
      alert(error.response?.data?.message || 'Failed to delete service log');
    }
  };

  const openCreateModal = () => {
    loadAvailableVehicles();
    setShowCreateModal(true);
  };

  const openCompleteModal = (log: ServiceLog) => {
    setSelectedLog(log);
    setCompleteData({
      cost: log.estimatedCost || 0,
      notes: log.notes || '',
      odometerReading: log.odometerReading || 0,
    });
    setShowCompleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      issueOrService: '',
      description: '',
      serviceType: 'REPAIR',
      scheduledDate: new Date().toISOString().split('T')[0],
      estimatedCost: 0,
      odometerReading: 0,
      serviceProvider: 'In-House',
      mechanicName: '',
      notes: '',
      priority: 'MEDIUM',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'HIGH': return 'bg-orange-100 text-orange-700';
      case 'CRITICAL': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Maintenance & Service Logs</h1>
        <p className="text-sm text-gray-600">Preventative and reactive health tracking</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.statusBreakdown.reduce((acc, curr) => acc + curr.count, 0)}
                  </p>
                </div>
                <Wrench className="text-blue-600" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Shop Now</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.vehiclesInShop?.length || 0}
                  </p>
                </div>
                <AlertCircle className="text-orange-600" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.statusBreakdown.find(s => s._id === 'COMPLETED')?.count || 0}
                  </p>
                </div>
                <CheckCircle className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{stats.costAnalysis?.[0]?.totalCost?.toLocaleString() || '0'}
                  </p>
                </div>
                <DollarSign className="text-gray-600" size={32} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Action Bar */}
          <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3 items-center flex-1 min-w-[300px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by log number, issue, or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="NEW">New</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Create New Service
            </button>
          </div>

          {/* Service Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Log ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue/Service</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Loading service logs...
                    </td>
                  </tr>
                ) : serviceLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No service logs found
                    </td>
                  </tr>
                ) : (
                  serviceLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {log.logNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.vehicle.licensePlate}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.vehicle.name} ({log.vehicle.vehicleType})
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.issueOrService}</p>
                          <p className="text-xs text-gray-500">{log.serviceType}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(log.scheduledDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ₹{log.cost.toLocaleString()}
                          </p>
                          {log.estimatedCost > 0 && (
                            <p className="text-xs text-gray-500">
                              Est: ₹{log.estimatedCost.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(log.priority)}`}>
                          {log.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {log.status === 'NEW' && (
                            <>
                              <button
                                onClick={() => handleStartService(log._id)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Start Service"
                              >
                                <Play size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteService(log._id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                          {(log.status === 'NEW' || log.status === 'IN_PROGRESS') && (
                            <>
                              <button
                                onClick={() => openCompleteModal(log)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                title="Complete Service"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleCancelService(log._id)}
                                className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                                title="Cancel Service"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * limit + 1} to {Math.min(currentPage * limit, totalCount)} of {totalCount} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">New Service</h2>
              <p className="text-sm text-gray-600 mt-1">Vehicle will be moved to IN_SHOP status</p>
            </div>

            <form onSubmit={handleCreateService} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vehicle *
                  </label>
                  <select
                    required
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Vehicle --</option>
                    {availableVehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.licensePlate} - {vehicle.name} ({vehicle.vehicleType})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {availableVehicles.length} available vehicle{availableVehicles.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue/Service *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.issueOrService}
                    onChange={(e) => setFormData({ ...formData, issueOrService: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Engine Issue, Oil Change, Brake Replacement"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="REPAIR">Repair</option>
                    <option value="PREVENTATIVE">Preventative</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="EMERGENCY">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Provider
                  </label>
                  <input
                    type="text"
                    value={formData.serviceProvider}
                    onChange={(e) => setFormData({ ...formData, serviceProvider: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="In-House or external garage name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mechanic Name
                  </label>
                  <input
                    type="text"
                    value={formData.mechanicName}
                    onChange={(e) => setFormData({ ...formData, mechanicName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Detailed description of the issue or service needed"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Additional notes or instructions"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Create Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Service Modal */}
      {showCompleteModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Complete Service</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedLog.logNumber} - {selectedLog.vehicle.licensePlate}
              </p>
            </div>

            <form onSubmit={handleCompleteService} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Final Cost (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={completeData.cost}
                    onChange={(e) => setCompleteData({ ...completeData, cost: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Odometer Reading (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={completeData.odometerReading}
                    onChange={(e) => setCompleteData({ ...completeData, odometerReading: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Completion Notes
                  </label>
                  <textarea
                    value={completeData.notes}
                    onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Work completed, parts replaced, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Complete Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(false);
                    setSelectedLog(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
