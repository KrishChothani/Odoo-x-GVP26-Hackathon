import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { authAPI, User } from '../services/api';
import { LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

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
      
      // Redirect users to their appropriate portals
      switch (parsedUser.role) {
        case 'DRIVER':
          navigate('/driver-portal');
          return;
        case 'DISPATCHER':
          navigate('/dispatcher-portal');
          return;
        case 'SAFETY_OFFICER':
          navigate('/safety-officer-portal');
          return;
        case 'FINANCIAL_ANALYST':
          navigate('/financial-analyst-portal');
          return;
        case 'FLEET_MANAGER':
          // This is the correct dashboard for fleet managers
          break;
        default:
          navigate('/login');
          return;
      }
    }
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar className="w-64 fixed h-screen" />

      {/* Main Content */}
      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">FleetFlow</h1>
              <div className="flex items-center gap-4">
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

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
