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

export const driverAPI = {
  /**
   * Get all available drivers (ON_DUTY status)
   * For trip creation - returns drivers who can be assigned
   */
  getAvailableDrivers: async (): Promise<AvailableDriversResponse> => {
    const response = await api.get('/users/available-drivers');
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

export default api;
