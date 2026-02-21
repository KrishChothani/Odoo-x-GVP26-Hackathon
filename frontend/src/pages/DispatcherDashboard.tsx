import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  authAPI, 
  User, 
  tripAPI, 
  Trip, 
  TripCreateData,
  vehicleAPI,
  Vehicle,
  driverAPI,
  AvailableDriver
} from '../services/api';
import { 
  LogOut, 
  Plus, 
  Search,
  MapPin,
  CheckCircle,
  X,
  Send,
  Ban,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const DispatcherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  // const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10;

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Available vehicles and drivers
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);

  // Form state
  const [formData, setFormData] = useState<TripCreateData>({
    vehicleId: '',
    driverId: '',
    origin: { address: '' },
    destination: { address: '' },
    cargoWeight: 0,
    distance: 0,
    estimatedDuration: 0,
    scheduledStartTime: '',
    notes: '',
  });

  // Check authentication
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
      
      if (parsedUser.role !== 'DISPATCHER' && parsedUser.role !== 'FLEET_MANAGER') {
        navigate('/login');
        return;
      }
    }
    
    setLoading(false);
  }, [navigate]);

  // Load trips
  const loadTrips = async () => {
    try {
      setLoading(true);
      const response = await tripAPI.getAll({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      setTrips(response.data.trips);
      setTotalPages(response.data.pagination.totalPages);
      setTotalCount(response.data.pagination.totalCount);
    } catch (error: any) {
      console.error('Error loading trips:', error);
      alert(error.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await tripAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Load available vehicles and drivers
  const loadAvailableResources = async () => {
    try {
      const vehiclesRes = await vehicleAPI.getAll({ status: 'AVAILABLE', isActive: true, limit: 100 });
      const driversRes = await driverAPI.getAvailableDrivers();
      
      setAvailableVehicles(vehiclesRes.data.vehicles);
      setAvailableDrivers(driversRes.data.drivers);
    } catch (error) {
      console.error('Error loading resources:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadTrips();
      loadStats();
    }
  }, [currentPage, searchQuery, statusFilter, user]);

  // Create trip
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate vehicle capacity
    const selectedVehicle = availableVehicles.find(v => v._id === formData.vehicleId);
    if (selectedVehicle && formData.cargoWeight > selectedVehicle.maxLoadCapacity) {
      alert(`Cargo weight (${formData.cargoWeight}kg) exceeds vehicle capacity (${selectedVehicle.maxLoadCapacity}kg)`);
      return;
    }
    
    try {
      await tripAPI.create(formData);
      alert('Trip created successfully!');
      setShowCreateModal(false);
      resetForm();
      loadTrips();
      loadStats();
      loadAvailableResources();
    } catch (error: any) {
      alert(error.message || 'Failed to create trip');
    }
  };

  // Dispatch trip
  const handleDispatch = async (tripId: string) => {
    if (!confirm('Dispatch this trip? Vehicle and driver will be marked as ON_TRIP.')) return;
    
    try {
      await tripAPI.dispatch(tripId);
      alert('Trip dispatched successfully!');
      loadTrips();
      loadStats();
    } catch (error: any) {
      alert(error.message || 'Failed to dispatch trip');
    }
  };

  // Cancel trip
  const handleCancel = async (tripId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;
    
    try {
      await tripAPI.cancel(tripId, reason);
      alert('Trip cancelled successfully!');
      loadTrips();
      loadStats();
    } catch (error: any) {
      alert(error.message || 'Failed to cancel trip');
    }
  };

  // Delete trip
  const handleDelete = async (tripId: string) => {
    if (!confirm('Delete this trip? This action cannot be undone.')) return;
    
    try {
      await tripAPI.delete(tripId);
      alert('Trip deleted successfully!');
      loadTrips();
      loadStats();
    } catch (error: any) {
      alert(error.message || 'Failed to delete trip');
    }
  };

  // Open create modal
  const openCreateModal = () => {
    loadAvailableResources();
    setShowCreateModal(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      vehicleId: '',
      driverId: '',
      origin: { address: '' },
      destination: { address: '' },
      cargoWeight: 0,
      distance: 0,
      estimatedDuration: 0,
      scheduledStartTime: '',
      notes: '',
    });
  };

  // Logout
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      DISPATCHED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !user) {
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
              <MapPin className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trip Dispatcher</h1>
                <p className="text-sm text-gray-500">Create & Manage Trips</p>
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
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Statistics Cards */}
        {stats && stats.totalStats && stats.totalStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalStats[0].totalTrips}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completedTrips.length > 0 ? stats.completedTrips[0].count : 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(stats.totalStats[0].totalDistance)} km
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-orange-600">
                    ₹{Math.round(stats.totalStats[0].totalRevenue).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips..."
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
                <option value="DRAFT">Draft</option>
                <option value="DISPATCHED">Dispatched</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>New Trip</span>
            </button>
          </div>
        </div>

        {/* Trips Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trip #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo (kg)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Loading trips...
                    </td>
                  </tr>
                ) : trips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No trips found. Click "New Trip" to create one.
                    </td>
                  </tr>
                ) : (
                  trips.map((trip) => (
                    <tr key={trip._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{trip.tripNumber}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{trip.vehicle.licensePlate}</div>
                          <div className="text-sm text-gray-500">{trip.vehicle.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{trip.driver.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-green-600" />
                            <span className="truncate max-w-[150px]">{trip.origin.address}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-red-600" />
                            <span className="truncate max-w-[150px]">{trip.destination.address}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{trip.cargoWeight} kg</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {trip.status === 'DRAFT' && (
                            <>
                              <button
                                onClick={() => handleDispatch(trip._id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Dispatch"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(trip._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
                            <button
                              onClick={() => handleCancel(trip._id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Cancel"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
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
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(currentPage - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * limit, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Trip Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Create New Trip</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateTrip} className="space-y-4">
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
                        <option value="">Choose available vehicle...</option>
                        {availableVehicles.map(vehicle => (
                          <option key={vehicle._id} value={vehicle._id}>
                            {vehicle.licensePlate} - {vehicle.name} ({vehicle.vehicleType}) - Max: {vehicle.maxLoadCapacity}kg
                          </option>
                        ))}
                      </select>
                      {availableVehicles.length === 0 && (
                        <p className="text-xs text-red-600 mt-1">No available vehicles. All vehicles may be on trips or out of service.</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Driver * (ON_DUTY only)
                      </label>
                      <select
                        required
                        value={formData.driverId}
                        onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select a driver --</option>
                        {availableDrivers.map((driver) => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} - {driver.licenceNumber || 'No Licence'} ({driver.licenceType || 'N/A'}) - Completed: {driver.tripStats.completedTrips}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {availableDrivers.length} ON_DUTY driver{availableDrivers.length !== 1 ? 's' : ''} available
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Origin Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.origin.address}
                        onChange={(e) => setFormData({...formData, origin: { address: e.target.value }})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Mumbai Warehouse, MH"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Destination Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.destination.address}
                        onChange={(e) => setFormData({...formData, destination: { address: e.target.value }})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Delhi Distribution Center, DL"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cargo Weight (kg) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.cargoWeight}
                        onChange={(e) => setFormData({ ...formData, cargoWeight: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 450"
                      />
                      {formData.vehicleId && formData.cargoWeight > 0 && (
                        <p className={`text-xs mt-1 ${
                          formData.cargoWeight <= (availableVehicles.find(v => v._id === formData.vehicleId)?.maxLoadCapacity || 0)
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {formData.cargoWeight <= (availableVehicles.find(v => v._id === formData.vehicleId)?.maxLoadCapacity || 0)
                            ? '✓ Within capacity'
                            : '✗ Exceeds vehicle capacity!'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Distance (km)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.distance}
                        onChange={(e) => setFormData({ ...formData, distance: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 1400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Duration (hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.estimatedDuration}
                        onChange={(e) => setFormData({ ...formData, estimatedDuration: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 24"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scheduled Start Time *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.scheduledStartTime}
                        onChange={(e) => setFormData({ ...formData, scheduledStartTime: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        rows={3}
                        placeholder="Additional trip details..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Trip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatcherDashboard;
