import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:2590/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});
console.log(api); 
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    const message = error.response?.data?.message || 'An error occurred';
    
    // If unauthorized, clear local storage and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(new Error(message));
  }
);

// ─────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST' | 'DRIVER';
  licenceNumber?: string;
  licenceType?: 'BIKE' | 'TRUCK' | 'VAN_TEMPO';
  licenceExpiry?: string;
  licenceImage?: File;
}

export interface LoginData {
  email?: string;
  phone?: string;
  passwordHash: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST' | 'DRIVER';
  isActive: boolean;
  licenceNumber?: string;
  licenceType?: 'BIKE' | 'TRUCK' | 'VAN_TEMPO';
  licenceExpiry?: string;
  licenceImage?: string;
  dutyStatus?: 'ON_DUTY' | 'OFF_DUTY' | 'ON_TRIP';
  tripStats?: {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    acceptedTrips: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('passwordHash', data.passwordHash);
    formData.append('role', data.role);

    // Add driver-specific fields
    if (data.role === 'DRIVER') {
      if (data.licenceNumber) formData.append('licenceNumber', data.licenceNumber);
      if (data.licenceType) formData.append('licenceType', data.licenceType);
      if (data.licenceExpiry) formData.append('licenceExpiry', data.licenceExpiry);
      if (data.licenceImage) formData.append('licenceImage', data.licenceImage);
    }

    const response = await api.post('/users/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/users/login', data);
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    await api.post('/users/logout');
  },

  /**
   * Get current user
   */
  getCurrentUser: async (): Promise<{ success: boolean; data: User }> => {
    const response = await api.get('/users/current-user');
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post('/users/refresh-token');
    return response.data;
  },

  /**
   * Send password reset email
   */
  sendResetPasswordEmail: async (email: string): Promise<void> => {
    await api.post('/users/send-reset-password-link', { email });
  },

  /**
   * Reset password
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/users/reset-password', { token, newPassword });
  },

  /**
   * Verify email
   */
  verifyEmail: async (token: string): Promise<void> => {
    await api.get(`/users/verify-email?token=${token}`);
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email: string): Promise<void> => {
    await api.post('/users/resend-email-verification', { email });
  },
};

// ─────────────────────────────────────────────
// Driver API
// ─────────────────────────────────────────────

export interface AvailableDriver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  licenceNumber?: string;
  licenceType?: 'BIKE' | 'TRUCK' | 'VAN_TEMPO';
  licenceExpiry?: string;
  dutyStatus: 'ON_DUTY' | 'OFF_DUTY' | 'ON_TRIP';
  tripStats: {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    acceptedTrips: number;
  };
}

export interface AvailableDriversResponse {
  success: boolean;
  data: {
    drivers: AvailableDriver[];
    count: number;
  };
  message: string;
}

export interface DriverPerformance {
  _id: string;
  name: string;
  email: string;
  phone: string;
  licenceNumber: string;
  licenceType?: 'BIKE' | 'TRUCK' | 'VAN_TEMPO';
  licenceExpiry?: string;
  licenceImage?: string;
  isLicenseExpired: boolean;
  daysUntilExpiry: number | null;
  dutyStatus: 'ON_DUTY' | 'OFF_DUTY' | 'ON_TRIP';
  isActive: boolean;
  tripStats: {
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    completionRate: number;
  };
  joinedDate: string;
}

export interface DriverPerformanceResponse {
  success: boolean;
  data: {
    drivers: DriverPerformance[];
    count: number;
  };
  message: string;
}

export const driverAPI = {
  /**
   * Get all available drivers (ON_DUTY status)
   * For trip creation - returns drivers who can be assigned
   */
  getAvailableDrivers: async (): Promise<AvailableDriversResponse> => {
    const response = await api.get('/users/available-drivers');
    return response.data;
  },

  /**
   * Get all active drivers (regardless of duty status)
   * For expense tracking and other purposes
   */
  getAllDrivers: async (): Promise<AvailableDriversResponse> => {
    const response = await api.get('/users/all-drivers');
    return response.data;
  },

  /**
   * Get driver performance data
   * Includes license info, completion rates, and compliance status
   */
  getDriverPerformance: async (): Promise<DriverPerformanceResponse> => {
    const response = await api.get('/users/driver-performance');
    return response.data;
  },

  /**
   * Suspend a driver (prevent assignment)
   */
  suspendDriver: async (driverId: string, reason?: string): Promise<any> => {
    const response = await api.patch(`/users/suspend-driver/${driverId}`, { reason });
    return response.data;
  },

  /**
   * Unsuspend a driver (allow assignment)
   */
  unsuspendDriver: async (driverId: string): Promise<any> => {
    const response = await api.patch(`/users/unsuspend-driver/${driverId}`);
    return response.data;
  },

  /**
   * Toggle driver duty status between ON_DUTY and OFF_DUTY
   * Driver can only toggle their own status
   */
  toggleDutyStatus: async (): Promise<any> => {
    const response = await api.patch('/users/toggle-duty-status');
    return response.data;
  },
};

// ─────────────────────────────────────────────
// Dashboard API
// ─────────────────────────────────────────────

export interface DashboardKPIs {
  kpis: {
    activeFleet: number;
    maintenanceAlerts: number;
    utilizationRate: number;
    pendingCargo: number;
  };
  stats: {
    totalVehicles: number;
    totalTrips: number;
    activeTrips: number;
    completedTrips: number;
  };
}

export interface TableDataResponse {
  trips: any[]; // Using legacy Trip structure
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOptions {
  vehicleTypes: string[];
  regions: string[];
  statusOptions: string[];
}

export const dashboardAPI = {
  /**
   * Get dashboard KPIs
   */
  getKPIs: async (filters?: {
    vehicleType?: string;
    status?: string;
    region?: string;
  }): Promise<DashboardKPIs> => {
    const params = new URLSearchParams();
    if (filters?.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.region) params.append('region', filters.region);

    const response = await api.get(`/dashboard/kpis?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get dashboard table data
   */
  getTableData: async (filters?: {
    page?: number;
    limit?: number;
    vehicleType?: string;
    status?: string;
    region?: string;
    search?: string;
  }): Promise<TableDataResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/dashboard/table?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get filter options
   */
  getFilterOptions: async (): Promise<FilterOptions> => {
    const response = await api.get('/dashboard/filters');
    return response.data.data;
  },
};

// ─────────────────────────────────────────────
// Vehicle API
// ─────────────────────────────────────────────

export interface Vehicle {
  _id: string;
  name: string;
  model: string;
  licensePlate: string;
  vehicleType: 'TRUCK' | 'VAN' | 'BIKE';
  maxLoadCapacity: number;
  odometer: number;
  status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'OUT_OF_SERVICE';
  region: string;
  assignedDriver?: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    licenceNumber?: string;
  };
  currentTrip?: any;
  fuelEfficiency?: number;
  acquisitionCost?: number;
  insuranceExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDue?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleCreateData {
  name: string;
  model: string;
  licensePlate: string;
  vehicleType: 'TRUCK' | 'VAN' | 'BIKE';
  maxLoadCapacity: number;
  odometer?: number;
  region?: string;
}

export interface VehicleUpdateData extends Partial<VehicleCreateData> {
  status?: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'OUT_OF_SERVICE';
  fuelEfficiency?: number;
  acquisitionCost?: number;
  insuranceExpiry?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDue?: string;
}

export interface VehicleFilters {
  status?: string;
  vehicleType?: string;
  region?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VehicleListResponse {
  success: boolean;
  data: {
    vehicles: Vehicle[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
  message: string;
}

export interface VehicleResponse {
  success: boolean;
  data: Vehicle;
  message: string;
}

export interface VehicleStatsResponse {
  success: boolean;
  data: {
    statusBreakdown: Array<{ _id: string; count: number }>;
    typeBreakdown: Array<{ _id: string; count: number }>;
    totalStats: Array<{
      totalVehicles: number;
      activeVehicles: number;
      totalCapacity: number;
      averageOdometer: number;
    }>;
  };
  message: string;
}

export const vehicleAPI = {
  /**
   * Create a new vehicle
   */
  create: async (data: VehicleCreateData): Promise<VehicleResponse> => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },

  /**
   * Get all vehicles with filters
   */
  getAll: async (filters?: VehicleFilters): Promise<VehicleListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vehicleType) params.append('vehicleType', filters.vehicleType);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/vehicles?${params.toString()}`);
    return response.data;
  },

  /**
   * Get vehicle by ID
   */
  getById: async (id: string): Promise<VehicleResponse> => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  /**
   * Update vehicle
   */
  update: async (id: string, data: VehicleUpdateData): Promise<VehicleResponse> => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },

  /**
   * Toggle out of service status
   */
  toggleService: async (id: string): Promise<VehicleResponse> => {
    const response = await api.patch(`/vehicles/${id}/toggle-service`);
    return response.data;
  },

  /**
   * Delete vehicle
   */
  delete: async (id: string): Promise<VehicleResponse> => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },

  /**
   * Get vehicle statistics
   */
  getStats: async (): Promise<VehicleStatsResponse> => {
    const response = await api.get('/vehicles/stats');
    return response.data;
  },
};

// ─────────────────────────────────────────────
// TRIP TYPES
// ─────────────────────────────────────────────

export interface TripOriginDestination {
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface Trip {
  _id: string;
  tripNumber: string;
  vehicle: {
    _id: string;
    name: string;
    model: string;
    licensePlate: string;
    vehicleType: string;
    maxLoadCapacity: number;
    status: string;
    odometer: number;
  };
  driver: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    licenceNumber: string;
    licenceType: string;
    dutyStatus: string;
  };
  cargo?: any;
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  origin: TripOriginDestination;
  destination: TripOriginDestination;
  cargoWeight: number;
  distance: number;
  estimatedDuration: number;
  scheduledStartTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  fuelConsumed: number;
  fuelCost: number;
  revenue: number;
  notes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TripCreateData {
  vehicleId: string;
  driverId: string;
  origin: TripOriginDestination;
  destination: TripOriginDestination;
  cargoWeight: number;
  distance?: number;
  estimatedDuration?: number;
  scheduledStartTime: string;
  notes?: string;
}

export interface TripUpdateData {
  vehicleId?: string;
  driverId?: string;
  origin?: TripOriginDestination;
  destination?: TripOriginDestination;
  cargoWeight?: number;
  distance?: number;
  estimatedDuration?: number;
  scheduledStartTime?: string;
  notes?: string;
}

export interface TripCompleteData {
  finalOdometer?: number;
  fuelConsumed?: number;
  fuelCost?: number;
  revenue?: number;
  notes?: string;
}

export interface TripFilters {
  status?: string;
  vehicleId?: string;
  driverId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TripListResponse {
  success: boolean;
  message: string;
  data: {
    trips: Trip[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

export interface TripResponse {
  success: boolean;
  message: string;
  data: Trip;
}

export interface TripStatsResponse {
  success: boolean;
  message: string;
  data: {
    statusBreakdown: Array<{ _id: string; count: number }>;
    totalStats: Array<{
      totalTrips: number;
      totalCargoWeight: number;
      totalDistance: number;
      totalRevenue: number;
      totalFuelCost: number;
      totalFuelConsumed: number;
    }>;
    completedTrips: Array<{
      count: number;
      avgDistance: number;
      avgRevenue: number;
    }>;
    costPerKm: number;
  };
}

// ─────────────────────────────────────────────
// TRIP API
// ─────────────────────────────────────────────

export const tripAPI = {
  /**
   * Create a new trip
   */
  create: async (data: TripCreateData): Promise<TripResponse> => {
    const response = await api.post('/trips', data);
    return response.data;
  },

  /**
   * Get all trips with filters
   */
  getAll: async (filters?: TripFilters): Promise<TripListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.driverId) params.append('driverId', filters.driverId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/trips?${params.toString()}`);
    return response.data;
  },

  /**
   * Get trip by ID
   */
  getById: async (id: string): Promise<TripResponse> => {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  },

  /**
   * Update trip (DRAFT only)
   */
  update: async (id: string, data: TripUpdateData): Promise<TripResponse> => {
    const response = await api.put(`/trips/${id}`, data);
    return response.data;
  },

  /**
   * Dispatch trip (DRAFT → DISPATCHED)
   */
  dispatch: async (id: string): Promise<TripResponse> => {
    const response = await api.patch(`/trips/${id}/dispatch`);
    return response.data;
  },

  /**
   * Complete trip (DISPATCHED → COMPLETED)
   */
  complete: async (id: string, data: TripCompleteData): Promise<TripResponse> => {
    const response = await api.patch(`/trips/${id}/complete`, data);
    return response.data;
  },

  /**
   * Cancel trip
   */
  cancel: async (id: string, reason?: string): Promise<TripResponse> => {
    const response = await api.patch(`/trips/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Delete trip (DRAFT only)
   */
  delete: async (id: string): Promise<TripResponse> => {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  },

  /**
   * Get trip statistics
   */
  getStats: async (): Promise<TripStatsResponse> => {
    const response = await api.get('/trips/stats');
    return response.data;
  },
};

// ─────────────────────────────────────────────
// Maintenance & Service Logs API
// ─────────────────────────────────────────────

export interface ServiceLog {
  _id: string;
  logNumber: string;
  vehicle: {
    _id: string;
    name: string;
    model: string;
    licensePlate: string;
    vehicleType: 'TRUCK' | 'VAN' | 'BIKE';
    status: 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'OUT_OF_SERVICE';
    region?: string;
    odometer?: number;
  };
  issueOrService: string;
  description?: string;
  serviceType: 'PREVENTATIVE' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY';
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  cost: number;
  estimatedCost: number;
  odometerReading?: number;
  serviceProvider: string;
  mechanicName?: string;
  partsReplaced?: Array<{
    partName: string;
    partCost: number;
    quantity: number;
  }>;
  notes?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role?: string;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceLogCreateData {
  vehicleId: string;
  issueOrService: string;
  description?: string;
  serviceType?: 'PREVENTATIVE' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY';
  scheduledDate: string;
  estimatedCost?: number;
  odometerReading?: number;
  serviceProvider?: string;
  mechanicName?: string;
  partsReplaced?: Array<{
    partName: string;
    partCost: number;
    quantity: number;
  }>;
  notes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ServiceLogUpdateData {
  issueOrService?: string;
  description?: string;
  serviceType?: 'PREVENTATIVE' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY';
  scheduledDate?: string;
  estimatedCost?: number;
  cost?: number;
  odometerReading?: number;
  serviceProvider?: string;
  mechanicName?: string;
  partsReplaced?: Array<{
    partName: string;
    partCost: number;
    quantity: number;
  }>;
  notes?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ServiceLogCompleteData {
  cost?: number;
  notes?: string;
  odometerReading?: number;
  partsReplaced?: Array<{
    partName: string;
    partCost: number;
    quantity: number;
  }>;
}

export interface ServiceLogFilters {
  status?: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  vehicleId?: string;
  serviceType?: 'PREVENTATIVE' | 'REPAIR' | 'INSPECTION' | 'EMERGENCY';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ServiceLogListResponse {
  success: boolean;
  data: {
    serviceLogs: ServiceLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
  message: string;
}

export interface ServiceLogResponse {
  success: boolean;
  data: {
    serviceLog: ServiceLog;
    vehicle?: any;
  };
  message: string;
}

export interface MaintenanceStatsResponse {
  success: boolean;
  data: {
    stats: {
      statusBreakdown: Array<{ _id: string; count: number }>;
      priorityBreakdown: Array<{ _id: string; count: number }>;
      costAnalysis: Array<{
        totalCost: number;
        totalEstimatedCost: number;
        avgCost: number;
        maxCost: number;
      }>;
      recentServices: Array<{
        logNumber: string;
        issueOrService: string;
        status: string;
        cost: number;
        scheduledDate: string;
        vehicleInfo: {
          name: string;
          licensePlate: string;
        };
      }>;
      vehiclesInShop: Array<{
        logNumber: string;
        issueOrService: string;
        status: string;
        scheduledDate: string;
        vehicleInfo: {
          name: string;
          licensePlate: string;
        };
      }>;
    };
  };
  message: string;
}

export const maintenanceAPI = {
  /**
   * Create new service log (auto sets vehicle to IN_SHOP)
   */
  create: async (data: ServiceLogCreateData): Promise<ServiceLogResponse> => {
    const response = await api.post('/maintenance', data);
    return response.data;
  },

  /**
   * Get all service logs with filters
   */
  getAll: async (filters?: ServiceLogFilters): Promise<ServiceLogListResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.vehicleId) params.append('vehicleId', filters.vehicleId);
    if (filters?.serviceType) params.append('serviceType', filters.serviceType);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get(`/maintenance?${params.toString()}`);
    return response.data;
  },

  /**
   * Get single service log by ID
   */
  getById: async (id: string): Promise<ServiceLogResponse> => {
    const response = await api.get(`/maintenance/${id}`);
    return response.data;
  },

  /**
   * Update service log
   */
  update: async (id: string, data: ServiceLogUpdateData): Promise<ServiceLogResponse> => {
    const response = await api.put(`/maintenance/${id}`, data);
    return response.data;
  },

  /**
   * Start service (NEW -> IN_PROGRESS)
   */
  start: async (id: string): Promise<ServiceLogResponse> => {
    const response = await api.patch(`/maintenance/${id}/start`);
    return response.data;
  },

  /**
   * Complete service (returns vehicle to AVAILABLE)
   */
  complete: async (id: string, data?: ServiceLogCompleteData): Promise<ServiceLogResponse> => {
    const response = await api.patch(`/maintenance/${id}/complete`, data || {});
    return response.data;
  },

  /**
   * Cancel service (returns vehicle to AVAILABLE)
   */
  cancel: async (id: string, reason?: string): Promise<ServiceLogResponse> => {
    const response = await api.patch(`/maintenance/${id}/cancel`, { reason });
    return response.data;
  },

  /**
   * Delete service log (NEW only, returns vehicle to AVAILABLE)
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/maintenance/${id}`);
    return response.data;
  },

  /**
   * Get maintenance statistics
   */
  getStats: async (): Promise<MaintenanceStatsResponse> => {
    const response = await api.get('/maintenance/stats');
    return response.data;
  },
};

// ============================================
// EXPENSE & FUEL TRACKING API
// ============================================

/**
 * Fuel Log Interface
 */
export interface FuelLog {
  _id: string;
  logNumber: string;
  expenseCategory: 'FUEL' | 'MISC';
  trip?: {
    _id: string;
    tripNumber: string;
    status: string;
    distance: number;
    origin: { address: string };
    destination: { address: string };
    actualStartTime?: Date;
    actualEndTime?: Date;
    cargoWeight?: number;
  };
  vehicle: {
    _id: string;
    name: string;
    licensePlate: string;
    vehicleType: string;
    odometer: number;
    fuelEfficiency?: number;
    maxLoadCapacity?: number;
    region?: string;
  };
  driver: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    licenceNumber?: string;
    licenceType?: string;
    dutyStatus?: string;
  };
  fuelType?: 'DIESEL' | 'PETROL' | 'CNG' | 'ELECTRIC';
  liters?: number;
  costPerLiter?: number;
  totalCost: number;
  miscExpenseType?: 'TOLL' | 'PARKING' | 'CLEANING' | 'PERMITS' | 'FINES' | 'OTHER';
  miscDescription?: string;
  fuelDate: Date;
  fuelStation?: string;
  location?: string;
  odometerReading: number;
  receiptImage?: string;
  notes?: string;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'COMPANY_CARD' | 'FUEL_CARD';
  distanceCovered?: number;
  fuelEfficiency?: number;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    role: string;
    phone?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fuel Log Create Data
 */
export interface FuelLogCreateData {
  expenseCategory: 'FUEL' | 'MISC';
  tripId?: string;
  vehicleId: string;
  driverId: string;
  // Fuel-specific fields
  fuelType?: 'DIESEL' | 'PETROL' | 'CNG' | 'ELECTRIC';
  liters?: number;
  costPerLiter?: number;
  // Misc expense fields
  miscExpenseType?: 'TOLL' | 'PARKING' | 'CLEANING' | 'PERMITS' | 'FINES' | 'OTHER';
  miscDescription?: string;
  // Common fields
  totalCost?: number;
  fuelDate?: Date | string;
  fuelStation?: string;
  location?: string;
  odometerReading: number;
  receiptImage?: string;
  notes?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'COMPANY_CARD' | 'FUEL_CARD';
  distanceCovered?: number;
}

/**
 * Fuel Log Update Data
 */
export interface FuelLogUpdateData {
  fuelType?: 'DIESEL' | 'PETROL' | 'CNG' | 'ELECTRIC';
  liters?: number;
  costPerLiter?: number;
  fuelDate?: Date | string;
  fuelStation?: string;
  location?: string;
  odometerReading?: number;
  receiptImage?: string;
  notes?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'COMPANY_CARD' | 'FUEL_CARD';
  distanceCovered?: number;
}

/**
 * Fuel Log Filters
 */
export interface FuelLogFilters {
  vehicleId?: string;
  tripId?: string;
  driverId?: string;
  fuelType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Fuel Log List Response
 */
export interface FuelLogListResponse {
  success: boolean;
  data: {
    fuelLogs: FuelLog[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
  message: string;
}

/**
 * Fuel Log Response
 */
export interface FuelLogResponse {
  success: boolean;
  data: FuelLog;
  message: string;
}

/**
 * Vehicle Operational Costs Response
 */
export interface VehicleOperationalCostsResponse {
  success: boolean;
  data: {
    vehicle: {
      id: string;
      name: string;
      licensePlate: string;
      vehicleType: string;
      currentOdometer: number;
    };
    dateRange: {
      startDate: string;
      endDate: string;
    };
    fuelCosts: {
      totalCost: number;
      totalLiters: number;
      totalDistance: number;
      logCount: number;
      avgCostPerLiter: number;
      avgFuelEfficiency: number;
    };
    maintenanceCosts: {
      totalCost: number;
      serviceCount: number;
      avgCost: number;
    };
    totalOperationalCost: number;
    costPerKm: number;
  };
  message: string;
}

/**
 * Vehicle Analytics Response
 */
export interface VehicleAnalyticsResponse {
  success: boolean;
  data: {
    vehicle: {
      id: string;
      name: string;
      licensePlate: string;
      vehicleType: string;
      status: string;
      currentOdometer: number;
      fuelEfficiency: number;
      assignedDriver?: {
        _id: string;
        name: string;
        email: string;
        phone: string;
      };
    };
    periodMonths: number;
    fuelTrends: Array<{
      _id: { year: number; month: number };
      totalCost: number;
      totalLiters: number;
      totalDistance: number;
      avgEfficiency: number;
      count: number;
    }>;
    maintenanceTrends: Array<{
      _id: { year: number; month: number };
      totalCost: number;
      count: number;
    }>;
    tripStats: {
      totalTrips: number;
      totalDistance: number;
      totalRevenue: number;
      avgDistance: number;
    };
    recentFuelLogs: FuelLog[];
    recentMaintenance: Array<{
      _id: string;
      logNumber: string;
      issueOrService: string;
      cost: number;
      completedAt: Date;
      serviceType: string;
    }>;
  };
  message: string;
}

/**
 * Trip Expense Summary Response
 */
export interface TripExpenseSummaryResponse {
  success: boolean;
  data: {
    trip: {
      id: string;
      tripNumber: string;
      status: string;
      distance: number;
      origin: { address: string };
      destination: { address: string };
      vehicle: any;
      driver: any;
      cargo: any;
      revenue: number;
      actualStartTime?: Date;
      actualEndTime?: Date;
    };
    fuelExpenses: {
      logs: FuelLog[];
      totalCost: number;
      totalLiters: number;
      logCount: number;
    };
    profitability: {
      revenue: number;
      fuelCost: number;
      netProfit: number;
    };
  };
  message: string;
}

/**
 * Expense Stats Response
 */
export interface ExpenseStatsResponse {
  success: boolean;
  data: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    fuelStats: {
      totalFuelCost: number;
      totalLiters: number;
      totalLogs: number;
      avgCostPerLog: number;
      avgLitersPerLog: number;
    };
    fuelTypeBreakdown: Array<{
      _id: string;
      totalCost: number;
      totalLiters: number;
      count: number;
    }>;
    topSpendingVehicles: Array<{
      vehicleId: string;
      vehicleName: string;
      licensePlate: string;
      vehicleType: string;
      totalCost: number;
      totalLiters: number;
      logCount: number;
    }>;
  };
  message: string;
}

/**
 * All Vehicles Costs Response
 */
export interface VehicleCostSummary {
  vehicleId: string;
  licensePlate: string;
  name: string;
  vehicleType: string;
  fuelCost: number;
  miscCost: number;
  maintenanceCost: number;
  totalCost: number;
}

export interface AllVehiclesCostsResponse {
  success: boolean;
  data: {
    dateRange: {
      startDate: string;
      endDate: string;
    };
    summary: {
      totalVehicles: number;
      totalFuelCost: number;
      totalMiscCost: number;
      totalMaintenanceCost: number;
      grandTotal: number;
    };
    vehicles: VehicleCostSummary[];
  };
  message: string;
}

/**
 * Expense API object with all expense-related methods
 */
export const expenseAPI = {
  /**
   * Create new fuel log
   */
  create: async (data: FuelLogCreateData): Promise<FuelLogResponse> => {
    const response = await api.post('/expenses/fuel', data);
    return response.data;
  },

  /**
   * Get all fuel logs with filters
   */
  getAll: async (filters?: FuelLogFilters): Promise<FuelLogListResponse> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    const response = await api.get(`/expenses/fuel?${params.toString()}`);
    return response.data;
  },

  /**
   * Get fuel log by ID
   */
  getById: async (id: string): Promise<FuelLogResponse> => {
    const response = await api.get(`/expenses/fuel/${id}`);
    return response.data;
  },

  /**
   * Update fuel log
   */
  update: async (id: string, data: FuelLogUpdateData): Promise<FuelLogResponse> => {
    const response = await api.put(`/expenses/fuel/${id}`, data);
    return response.data;
  },

  /**
   * Delete fuel log
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/expenses/fuel/${id}`);
    return response.data;
  },

  /**
   * Get vehicle operational costs (Fuel + Maintenance)
   */
  getVehicleCosts: async (vehicleId: string, startDate?: string, endDate?: string): Promise<VehicleOperationalCostsResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/expenses/vehicle/${vehicleId}/costs?${params.toString()}`);
    return response.data;
  },

  /**
   * Get vehicle analytics and trends
   */
  getVehicleAnalytics: async (vehicleId: string, months?: number): Promise<VehicleAnalyticsResponse> => {
    const params = new URLSearchParams();
    if (months) params.append('months', String(months));
    const response = await api.get(`/expenses/vehicle/${vehicleId}/analytics?${params.toString()}`);
    return response.data;
  },

  /**
   * Get trip expense summary
   */
  getTripSummary: async (tripId: string): Promise<TripExpenseSummaryResponse> => {
    const response = await api.get(`/expenses/trip/${tripId}/summary`);
    return response.data;
  },

  /**
   * Get expense statistics
   */
  getStats: async (startDate?: string, endDate?: string): Promise<ExpenseStatsResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/expenses/stats?${params.toString()}`);
    return response.data;
  },

  /**
   * Get all vehicles with their aggregated costs
   */
  getAllVehiclesCosts: async (startDate?: string, endDate?: string): Promise<AllVehiclesCostsResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const response = await api.get(`/expenses/vehicles/all-costs?${params.toString()}`);
    return response.data;
  },
};

// ─────────────────────────────────────────────
// Analytics API
// ─────────────────────────────────────────────

export interface VehicleAnalytic {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  vehicleType: string;
  fuelEfficiency: number;
  totalDistance: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalMiscCost: number;
  totalOperatingCost: number;
  totalRevenue: number;
  roi: number;
  costPerKm: number;
  lastTripCostPerKm: number;
  totalTrips: number;
  acquisitionCost: number;
}

export interface FleetSummary {
  totalVehicles: number;
  totalDistance: number;
  totalRevenue: number;
  totalOperatingCost: number;
  totalProfit: number;
  fleetFuelEfficiency: number;
  fleetCostPerKm: number;
  fleetROI: number;
  totalTrips: number;
}

export interface ExpenseBreakdown {
  fuel: number;
  maintenance: number;
  miscellaneous: number;
  total: number;
}

export interface MonthlyTrend {
  month: string;
  fuelCost: number;
  miscCost: number;
  maintenanceCost: number;
  totalCost: number;
}

export interface OperationalAnalyticsResponse {
  statusCode: number;
  data: {
    fleetSummary: FleetSummary;
    expenseBreakdown: ExpenseBreakdown;
    vehicleAnalytics: VehicleAnalytic[];
    topPerformers: VehicleAnalytic[];
    underPerformers: VehicleAnalytic[];
    monthlyTrends: MonthlyTrend[];
  };
  message: string;
  success: boolean;
}

export interface DriverPayroll {
  driverId: string;
  driverName: string;
  email: string;
  licenceNumber: string;
  totalTrips: number;
  completedTrips: number;
  baseSalary: number;
  tripBonus: number;
  totalPay: number;
}

export interface VehicleHealthAudit {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  status: string;
  odometer: number;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDue: Date | null;
  insuranceExpiry: Date | null;
  serviceCount: number;
  totalMaintenanceCost: number;
  totalFuelCost: number;
  healthStatus: string;
}

export interface MonthlyReportData {
  reportPeriod: {
    month: string;
    year: string;
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalVehicles: number;
    totalTrips: number;
    totalDrivers: number;
    totalFuelCost: number;
    totalMaintenanceCost: number;
    totalPayroll: number;
  };
  driverPayroll: DriverPayroll[];
  vehicleHealthAudit: VehicleHealthAudit[];
  fuelLogs: any[];
  serviceLogs: any[];
}

export interface MonthlyReportResponse {
  statusCode: number;
  data: MonthlyReportData;
  message: string;
  success: boolean;
}

export const analyticsAPI = {
  /**
   * Get operational analytics
   */
  getOperationalAnalytics: async (
    startDate?: string,
    endDate?: string,
    vehicleId?: string
  ): Promise<OperationalAnalyticsResponse> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (vehicleId) params.append('vehicleId', vehicleId);
    const response = await api.get(`/analytics/operational?${params.toString()}`);
    return response.data;
  },

  /**
   * Get monthly report data for export
   */
  getMonthlyReport: async (month: string, year: string): Promise<MonthlyReportResponse> => {
    const response = await api.get(`/analytics/monthly-report?month=${month}&year=${year}`);
    return response.data;
  },
};

export default api;

