import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, User, driverAPI, tripAPI } from '../services/api';
import { 
  LogOut, 
  User as UserIcon, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  AlertCircle,
  MapPin,
  Power
} from 'lucide-react';

interface TripStats {
  totalTrips: number;
  completed: number;
  cancelled: number;
  inProgress: number;
  accepted: number;
}

interface Trip {
  _id: string;
  tripNumber: string;
  origin: {
    address: string;
    coordinates?: { latitude: number; longitude: number };
  };
  destination: {
    address: string;
    coordinates?: { latitude: number; longitude: number };
  };
  cargo: string;
  distance: string;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  assignedAt: string;
  vehicle: {
    name: string;
    licensePlate: string;
  };
}

const DriverDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<TripStats>({
    totalTrips: 0,
    completed: 0,
    cancelled: 0,
    inProgress: 0,
    accepted: 0,
  });
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      // Only drivers can access this dashboard
      if (parsedUser.role !== 'DRIVER') {
        navigate('/login');
        return;
      }
    }
    
    // Load driver data
    loadDriverData();
  }, [navigate]);

  const loadDriverData = async () => {
    try {
      // Use stored user trip stats
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.tripStats) {
          setStats({
            totalTrips: parsedUser.tripStats.totalTrips || 0,
            completed: parsedUser.tripStats.completedTrips || 0,
            cancelled: parsedUser.tripStats.cancelledTrips || 0,
            inProgress: 0, // Calculated from active trips
            accepted: parsedUser.tripStats.acceptedTrips || 0,
          });
        }
      }
      
      // Fetch driver's trips from API (automatically filtered by driver ID on backend)
      try {
        const response = await tripAPI.getAll({});
        if (response?.success && response?.data?.trips) {
          setTrips(response.data.trips);
          
          // Update in-progress count from active trips (DISPATCHED trips)
          const inProgressCount = response.data.trips.filter(
            (trip: Trip) => trip.status === 'DISPATCHED'
          ).length;
          
          setStats(prev => ({ ...prev, inProgress: inProgressCount }));
        } else {
          // No trips or failed to fetch, just set empty array
          setTrips([]);
        }
      } catch (apiError) {
        console.error('Error fetching trips:', apiError);
        // Set empty trips array so component can still render
        setTrips([]);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
    } finally {
      // Always set loading to false to allow component to render
      setLoading(false);
    }
  };

  // Duty status toggle
  const handleDutyStatusToggle = async () => {
    try {
      // Call API to update duty status
      const response = await driverAPI.toggleDutyStatus();
      
      if (response.success) {
        const newStatus = response.data.dutyStatus;
        
        // Update local state and localStorage
        if (user) {
          const updatedUser = { ...user, dutyStatus: newStatus };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        alert(`Duty status changed to ${newStatus.replace('_', ' ')}`);
      }
    } catch (error: any) {
      console.error('Error toggling duty status:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update duty status';
      alert(errorMessage);
    }
  };

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

  // Trip actions
  const handleCompleteTrip = async (tripId: string) => {
    try {
      // Call API to complete trip
      const response = await tripAPI.complete(tripId, {});
      
      if (response.success) {
        alert('Trip completed successfully! Vehicle is now available and duty status updated.');
        
        // Reload driver data to refresh trips and stats
        await loadDriverData();
        
        // Refresh user data to get updated tripStats
        const userResponse = await authAPI.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data.user);
          localStorage.setItem('user', JSON.stringify(userResponse.data.user));
        }
      }
    } catch (error: any) {
      console.error('Error completing trip:', error);
      const errorMessage = error.response?.data?.message || 'Failed to complete trip';
      alert(errorMessage);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;
    
    try {
      // TODO: API call to cancel trip
      console.log('Cancelling trip:', tripId, 'Reason:', reason);
      alert('Trip cancelled');
      loadDriverData();
    } catch (error) {
      console.error('Error cancelling trip:', error);
      alert('Failed to cancel trip');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'DISPATCHED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getReliabilityScore = () => {
    if (stats.totalTrips === 0) return 'N/A';
    const successRate = ((stats.completed / stats.totalTrips) * 100).toFixed(1);
    return `${successRate}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading user data...</div>
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
              <UserIcon className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Driver Portal</h1>
                <p className="text-sm text-gray-500">Trip Management & Profile</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Duty Status Toggle */}
              <button
                onClick={handleDutyStatusToggle}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  user?.dutyStatus === 'ON_DUTY'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Power className="w-4 h-4" />
                {user?.dutyStatus === 'ON_DUTY' ? 'On Duty' : 'Off Duty'}
              </button>
              
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
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
        {/* Driver Profile & Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Driver Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Profile Info */}
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-3 rounded-full">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Driver</p>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>

            {/* Reliability Score */}
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Reliability Score</p>
                <p className="text-2xl font-bold text-gray-900">{getReliabilityScore()}</p>
                <p className="text-xs text-gray-500">{stats.completed} completed</p>
              </div>
            </div>

            {/* License Info */}
            {user?.licenceNumber && (
              <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg">
                <div className="bg-purple-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">License</p>
                  <p className="text-lg font-semibold text-gray-900">{user.licenceNumber}</p>
                  {user.licenceExpiry && (
                    <p className="text-xs text-gray-500">
                      Exp: {new Date(user.licenceExpiry).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
              <div className="bg-orange-100 p-3 rounded-full">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact</p>
                <p className="text-lg font-semibold text-gray-900">{user?.phone}</p>
                <p className="text-xs text-gray-500">Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <p className="text-sm text-gray-600">Total Trips</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTrips}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-sm text-gray-600">Completed</p>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
            <p className="text-3xl font-bold text-orange-600">{stats.inProgress}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-500" />
              <p className="text-sm text-gray-600">Accepted</p>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.accepted}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-gray-600">Cancelled</p>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">My Trips</h2>
          </div>
          
          {trips.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No active trips assigned</p>
              <p className="text-sm text-gray-400 mt-1">New trips will appear here when assigned by the manager</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {trips.map((trip) => (
                <div key={trip._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{trip.tripNumber}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(trip.status)}`}>
                          {trip.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">Route</p>
                          <p className="text-sm font-medium text-gray-900">{trip.origin.address} → {trip.destination.address}</p>
                          <p className="text-xs text-gray-500 mt-1">{trip.distance}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Vehicle</p>
                          <p className="text-sm font-medium text-gray-900">{trip.vehicle.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{trip.vehicle.licensePlate}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {trip.status === 'DISPATCHED' && (
                        <>
                          <button
                            onClick={() => handleCompleteTrip(trip._id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                          >
                            Complete Trip
                          </button>
                          <button
                            onClick={() => handleCancelTrip(trip._id)}
                            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                          >
                            Cancel Trip
                          </button>
                        </>
                      )}
                      
                      {trip.status === 'COMPLETED' && (
                        <span className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md">
                          ✓ Completed
                        </span>
                      )}
                      
                      {trip.status === 'CANCELLED' && (
                        <span className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md">
                          ✗ Cancelled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
