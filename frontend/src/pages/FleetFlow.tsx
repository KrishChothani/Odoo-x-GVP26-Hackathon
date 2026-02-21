import React, { useState, useEffect } from 'react';
import { dashboardAPI, DashboardKPIs, Trip } from '../services/api';
import { Plus, Search, Filter as FilterIcon } from 'lucide-react';

const FleetFlow: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [selectedVehicleType] = useState('');
  const [selectedStatus] = useState('');
  const [selectedRegion] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch KPIs
  const fetchKPIs = async () => {
    try {
      const filters: any = {};
      if (selectedVehicleType) filters.vehicleType = selectedVehicleType;
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedRegion) filters.region = selectedRegion;

      const data = await dashboardAPI.getKPIs(filters);
      setKpis(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fetch table data
  const fetchTableData = async () => {
    try {
      const filters: any = {
        page: currentPage,
        limit: 10,
      };
      if (selectedVehicleType) filters.vehicleType = selectedVehicleType;
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedRegion) filters.region = selectedRegion;
      if (searchQuery) filters.search = searchQuery;

      const data = await dashboardAPI.getTableData(filters);
      setTrips(data.trips);
      setTotalPages(data.pagination.totalPages);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchKPIs(), fetchTableData()]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Reload data when filters change
  useEffect(() => {
    if (!loading) {
      fetchKPIs();
      fetchTableData();
    }
  }, [selectedVehicleType, selectedStatus, selectedRegion, searchQuery, currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Fleet Flow</h1>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Group by</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FilterIcon className="w-4 h-4" />
            <span>Filter</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <span>Sort by...</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            <span>New Trip</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            <span>New Vehicle</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Active Fleet */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Active Fleet</p>
          <p className="text-4xl font-bold text-green-600">
            {kpis?.kpis.activeFleet || 220}
          </p>
        </div>

        {/* Maintenance Alerts */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Maintenance Alert</p>
          <p className="text-4xl font-bold text-orange-600">
            {kpis?.kpis.maintenanceAlerts || 180}
          </p>
        </div>

        {/* Pending Cargo */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Pending Cargo</p>
          <p className="text-4xl font-bold text-purple-600">
            {kpis?.kpis.pendingCargo || 20}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {trips.length > 0 ? (
              trips.map((trip) => (
                <tr key={trip._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.vehicle?.licensePlate || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trip.driver?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      trip.status === 'DISPATCHED'
                        ? 'bg-orange-100 text-orange-800'
                        : trip.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No trips found. Click "New Trip" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FleetFlow;
