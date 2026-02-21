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
  role: 'MANAGER' | 'DISPATCHER';
  licenceNumber?: string;
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
  role: 'MANAGER' | 'DISPATCHER';
  isActive: boolean;
  licenceNumber?: string;
  licenceExpiry?: string;
  licenceImage?: string;
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

    // Add dispatcher-specific fields
    if (data.role === 'DISPATCHER') {
      if (data.licenceNumber) formData.append('licenceNumber', data.licenceNumber);
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

export interface Trip {
  _id: string;
  tripNumber: string;
  vehicle: {
    _id: string;
    name: string;
    model: string;
    licensePlate: string;
    vehicleType: string;
  };
  driver: {
    _id: string;
    name: string;
    phone: string;
  };
  cargo?: {
    _id: string;
    cargoNumber: string;
    weight: number;
  };
  status: 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  origin: {
    address: string;
  };
  destination: {
    address: string;
  };
  scheduledStartTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  createdAt: string;
}

export interface TableDataResponse {
  trips: Trip[];
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

export default api;
