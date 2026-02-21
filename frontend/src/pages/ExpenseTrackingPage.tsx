import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  expenseAPI, 
  FuelLogCreateData,
  VehicleCostSummary,
  AllVehiclesCostsResponse,
} from '../services/api';
import { vehicleAPI, Vehicle } from '../services/api';
import { driverAPI, AvailableDriver } from '../services/api';
import { authAPI } from '../services/api';
import { 
  Plus, 
  Fuel,
  Wrench,
  DollarSign,
  X,
  Receipt,
} from 'lucide-react';

const ExpenseTrackingPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  
  // Vehicle costs state
  const [vehicleCosts, setVehicleCosts] = useState<VehicleCostSummary[]>([]);
  const [summary, setSummary] = useState<AllVehiclesCostsResponse['data']['summary'] | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modals
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showMiscModal, setShowMiscModal] = useState(false);
  
  // Form data for fuel
  const [fuelFormData, setFuelFormData] = useState<FuelLogCreateData>({
    expenseCategory: 'FUEL',
    vehicleId: '',
    driverId: '',
    fuelType: 'DIESEL',
    liters: 0,
    costPerLiter: 0,
    odometerReading: 0,
    fuelDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
  });
  
  // Form data for misc expense
  const [miscFormData, setMiscFormData] = useState<FuelLogCreateData>({
    expenseCategory: 'MISC',
    vehicleId: '',
    driverId: '',
    miscExpenseType: 'TOLL',
    miscDescription: '',
    totalCost: 0,
    odometerReading: 0,
    fuelDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
  });
  
  // Dropdowns data
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.getCurrentUser();
        const currentUser = response.data;
        setUser(currentUser);
        
        const allowedRoles = ['FLEET_MANAGER', 'DISPATCHER', 'FINANCIAL_ANALYST'];
        if (!allowedRoles.includes(currentUser.role)) {
          alert('Access denied. This page is for authorized personnel only.');
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  // Load vehicle costs
  useEffect(() => {
    if (user) {
      loadVehicleCosts();
    }
  }, [user, startDate, endDate]);

  const loadVehicleCosts = async () => {
    try {
      setLoading(true);
      const response = await expenseAPI.getAllVehiclesCosts(
        startDate || undefined,
        endDate || undefined
      );
      setVehicleCosts(response.data.vehicles);
      setSummary(response.data.summary);
    } catch (error: any) {
      console.error('Failed to load vehicle costs:', error);
      alert(error.response?.data?.message || 'Failed to load vehicle costs');
    } finally {
      setLoading(false);
    }
  };

  const loadDropdownData = async () => {
    try {
      const vehiclesResponse = await vehicleAPI.getAll({ isActive: true, limit: 100 });
      setVehicles(vehiclesResponse.data.vehicles || []);
      
      const driversResponse = await driverAPI.getAllDrivers();
      setDrivers(driversResponse.data.drivers || []);
    } catch (error: any) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const openFuelModal = () => {
    loadDropdownData();
    setFuelFormData({
      expenseCategory: 'FUEL',
      vehicleId: '',
      driverId: '',
      fuelType: 'DIESEL',
      liters: 0,
      costPerLiter: 0,
      odometerReading: 0,
      fuelDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
    });
    setShowFuelModal(true);
  };

  const openMiscModal = () => {
    loadDropdownData();
    setMiscFormData({
      expenseCategory: 'MISC',
      vehicleId: '',
      driverId: '',
      miscExpenseType: 'TOLL',
      miscDescription: '',
      totalCost: 0,
      odometerReading: 0,
      fuelDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
    });
    setShowMiscModal(true);
  };

  const handleCreateFuelExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!fuelFormData.vehicleId || !fuelFormData.driverId || !fuelFormData.liters || !fuelFormData.costPerLiter) {
        alert('Please fill in all required fields');
        return;
      }

      await expenseAPI.create(fuelFormData);
      alert('Fuel expense added successfully!');
      setShowFuelModal(false);
      loadVehicleCosts();
    } catch (error: any) {
      console.error('Failed to create fuel expense:', error);
      alert(error.response?.data?.message || 'Failed to create fuel expense');
    }
  };

  const handleCreateMiscExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!miscFormData.vehicleId || !miscFormData.driverId || !miscFormData.totalCost) {
        alert('Please fill in all required fields');
        return;
      }

      await expenseAPI.create(miscFormData);
      alert('Misc expense added successfully!');
      setShowMiscModal(false);
      loadVehicleCosts();
    } catch (error: any) {
      console.error('Failed to create misc expense:', error);
      alert(error.response?.data?.message || 'Failed to create misc expense');
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && vehicleCosts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expense data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trip & Expense Tracking</h1>
        <p className="text-sm text-gray-600 mt-1">Track all vehicle operational costs</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Fuel Cost</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(summary.totalFuelCost)}
                </p>
              </div>
              <Fuel className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Misc Cost</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(summary.totalMiscCost)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Total Maintenance</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(summary.totalMaintenanceCost)}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Grand Total</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(summary.grandTotal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={openFuelModal}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
            >
              <Fuel className="h-5 w-5 mr-2" />
              Add Fuel
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={openMiscModal}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Misc Expense
            </button>
          </div>
        </div>
      </div>

      {/* Vehicle Costs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Plate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fuel Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Misc Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicleCosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No expense data available. Add fuel or misc expenses to see vehicle costs.
                  </td>
                </tr>
              ) : (
                vehicleCosts.map((vehicle) => (
                  <tr key={vehicle.vehicleId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicle.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="font-mono font-semibold">{vehicle.licensePlate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {vehicle.vehicleType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                      {formatCurrency(vehicle.fuelCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                      {formatCurrency(vehicle.miscCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                      {formatCurrency(vehicle.maintenanceCost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-bold">
                      {formatCurrency(vehicle.totalCost)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {vehicleCosts.length > 0 && summary && (
              <tfoot className="bg-gray-100">
                <tr className="font-bold">
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-900">
                    TOTAL ({summary.totalVehicles} vehicles)
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-blue-700">
                    {formatCurrency(summary.totalFuelCost)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-purple-700">
                    {formatCurrency(summary.totalMiscCost)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-orange-700">
                    {formatCurrency(summary.totalMaintenanceCost)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-800 font-extrabold">
                    {formatCurrency(summary.grandTotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add Fuel Expense Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add Fuel Expense</h2>
              <button
                onClick={() => setShowFuelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateFuelExpense} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={fuelFormData.vehicleId}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.licensePlate} - {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={fuelFormData.driverId}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, driverId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={fuelFormData.fuelType}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, fuelType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DIESEL">Diesel</option>
                    <option value="PETROL">Petrol</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">Electric</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liters <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={fuelFormData.liters || ''}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, liters: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cost per Liter (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={fuelFormData.costPerLiter || ''}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, costPerLiter: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Cost (₹)
                  </label>
                  <input
                    type="number"
                    disabled
                    value={((fuelFormData.liters || 0) * (fuelFormData.costPerLiter || 0)).toFixed(2)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Odometer Reading (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={fuelFormData.odometerReading || ''}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, odometerReading: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={fuelFormData.fuelDate as string}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, fuelDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Station
                  </label>
                  <input
                    type="text"
                    value={fuelFormData.fuelStation || ''}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, fuelStation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={fuelFormData.paymentMethod}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="COMPANY_CARD">Company Card</option>
                    <option value="FUEL_CARD">Fuel Card</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={fuelFormData.notes || ''}
                    onChange={(e) => setFuelFormData({ ...fuelFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Add Fuel Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Misc Expense Modal */}
      {showMiscModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Add Misc Expense</h2>
              <button
                onClick={() => setShowMiscModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateMiscExpense} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={miscFormData.vehicleId}
                    onChange={(e) => setMiscFormData({ ...miscFormData, vehicleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.licensePlate} - {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={miscFormData.driverId}
                    onChange={(e) => setMiscFormData({ ...miscFormData, driverId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Driver</option>
                    {drivers.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={miscFormData.miscExpenseType}
                    onChange={(e) => setMiscFormData({ ...miscFormData, miscExpenseType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="TOLL">Toll</option>
                    <option value="PARKING">Parking</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="PERMITS">Permits</option>
                    <option value="FINES">Fines</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={miscFormData.totalCost || ''}
                    onChange={(e) => setMiscFormData({ ...miscFormData, totalCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Odometer Reading (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={miscFormData.odometerReading || ''}
                    onChange={(e) => setMiscFormData({ ...miscFormData, odometerReading: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={miscFormData.fuelDate as string}
                    onChange={(e) => setMiscFormData({ ...miscFormData, fuelDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={miscFormData.paymentMethod}
                    onChange={(e) => setMiscFormData({ ...miscFormData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="COMPANY_CARD">Company Card</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={miscFormData.miscDescription || ''}
                    onChange={(e) => setMiscFormData({ ...miscFormData, miscDescription: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Describe the expense..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Add Misc Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowMiscModal(false)}
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

export default ExpenseTrackingPage;
