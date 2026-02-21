import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileDown,
  DollarSign,
  Fuel,
  Wrench,
  TrendingDown,
  Download,
  Calendar,
  Filter,
} from 'lucide-react';
import { analyticsAPI, VehicleAnalytic, MonthlyReportData } from '../services/api';

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [exportMonth, setExportMonth] = useState<string>('');
  const [exportYear, setExportYear] = useState<string>(new Date().getFullYear().toString());
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getOperationalAnalytics(startDate, endDate, selectedVehicle);
      setAnalyticsData(response.data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      alert(error.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    loadAnalytics();
  };

  const handleFilterReset = () => {
    setStartDate('');
    setEndDate('');
    setSelectedVehicle('');
    setTimeout(() => loadAnalytics(), 100);
  };

  const exportToCSV = async () => {
    if (!exportMonth || !exportYear) {
      alert('Please select month and year for export');
      return;
    }
    try {
      setExportLoading(true);
      const response = await analyticsAPI.getMonthlyReport(exportMonth, exportYear);
      const reportData: MonthlyReportData = response.data;

      // Generate CSV content
      let csvContent = `Monthly Fleet Report - ${exportMonth}/${exportYear}\n\n`;

      // Summary section
      csvContent += 'SUMMARY\n';
      csvContent += `Metric,Value\n`;
      csvContent += `Total Vehicles,${reportData.summary.totalVehicles}\n`;
      csvContent += `Total Trips,${reportData.summary.totalTrips}\n`;
      csvContent += `Total Drivers,${reportData.summary.totalDrivers}\n`;
      csvContent += `Total Fuel Cost,₹${reportData.summary.totalFuelCost.toFixed(2)}\n`;
      csvContent += `Total Maintenance Cost,₹${reportData.summary.totalMaintenanceCost.toFixed(2)}\n`;
      csvContent += `Total Payroll,₹${reportData.summary.totalPayroll.toFixed(2)}\n\n`;

      // Driver Payroll section
      csvContent += 'DRIVER PAYROLL\n';
      csvContent += 'Driver Name,Email,Licence Number,Total Trips,Completed Trips,Base Salary,Trip Bonus,Total Pay\n';
      reportData.driverPayroll.forEach((driver) => {
        csvContent += `${driver.driverName},${driver.email},${driver.licenceNumber},${driver.totalTrips},${driver.completedTrips},₹${driver.baseSalary},₹${driver.tripBonus},₹${driver.totalPay}\n`;
      });
      csvContent += '\n';

      // Vehicle Health Audit section
      csvContent += 'VEHICLE HEALTH AUDIT\n';
      csvContent += 'Vehicle Name,License Plate,Status,Odometer,Service Count,Maintenance Cost,Fuel Cost,Health Status\n';
      reportData.vehicleHealthAudit.forEach((vehicle) => {
        csvContent += `${vehicle.vehicleName},${vehicle.licensePlate},${vehicle.status},${vehicle.odometer} km,${vehicle.serviceCount},₹${vehicle.totalMaintenanceCost.toFixed(2)},₹${vehicle.totalFuelCost.toFixed(2)},${vehicle.healthStatus}\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `fleet-report-${exportMonth}-${exportYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Report exported successfully!');
    } catch (error: any) {
      console.error('Error exporting report:', error);
      alert(error.response?.data?.message || 'Failed to export report');
    } finally {
      setExportLoading(false);
    }
  };

  const exportToPDF = async () => {
    if (!exportMonth || !exportYear) {
      alert('Please select month and year for export');
      return;
    }
    try {
      setExportLoading(true);
      const response = await analyticsAPI.getMonthlyReport(exportMonth, exportYear);
      const reportData: MonthlyReportData = response.data;

      // Create a printable HTML page
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups for PDF export');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fleet Report - ${exportMonth}/${exportYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1e40af; text-align: center; }
            h2 { color: #3b82f6; margin-top: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #3b82f6; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f3f4f6; }
            .summary-box { background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .summary-item { margin: 8px 0; font-size: 14px; }
            .label { font-weight: bold; color: #1e40af; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>FleetFlow Monthly Report</h1>
          <p style="text-align: center; color: #6b7280;">Period: ${exportMonth}/${exportYear}</p>
          
          <div class="summary-box">
            <h2>Summary</h2>
            <div class="summary-item"><span class="label">Total Vehicles:</span> ${reportData.summary.totalVehicles}</div>
            <div class="summary-item"><span class="label">Total Trips:</span> ${reportData.summary.totalTrips}</div>
            <div class="summary-item"><span class="label">Total Drivers:</span> ${reportData.summary.totalDrivers}</div>
            <div class="summary-item"><span class="label">Total Fuel Cost:</span> ₹${reportData.summary.totalFuelCost.toFixed(2)}</div>
            <div class="summary-item"><span class="label">Total Maintenance Cost:</span> ₹${reportData.summary.totalMaintenanceCost.toFixed(2)}</div>
            <div class="summary-item"><span class="label">Total Payroll:</span> ₹${reportData.summary.totalPayroll.toFixed(2)}</div>
          </div>
          
          <h2>Driver Payroll</h2>
          <table>
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>Email</th>
                <th>Licence #</th>
                <th>Trips</th>
                <th>Completed</th>
                <th>Base Salary</th>
                <th>Bonus</th>
                <th>Total Pay</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.driverPayroll.map(driver => `
                <tr>
                  <td>${driver.driverName}</td>
                  <td>${driver.email}</td>
                  <td>${driver.licenceNumber}</td>
                  <td>${driver.totalTrips}</td>
                  <td>${driver.completedTrips}</td>
                  <td>₹${driver.baseSalary}</td>
                  <td>₹${driver.tripBonus}</td>
                  <td><strong>₹${driver.totalPay}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>Vehicle Health Audit</h2>
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Status</th>
                <th>Odometer</th>
                <th>Services</th>
                <th>Maint. Cost</th>
                <th>Fuel Cost</th>
                <th>Health</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.vehicleHealthAudit.map(vehicle => `
                <tr>
                  <td>${vehicle.vehicleName}</td>
                  <td>${vehicle.licensePlate}</td>
                  <td>${vehicle.status}</td>
                  <td>${vehicle.odometer} km</td>
                  <td>${vehicle.serviceCount}</td>
                  <td>₹${vehicle.totalMaintenanceCost.toFixed(2)}</td>
                  <td>₹${vehicle.totalFuelCost.toFixed(2)}</td>
                  <td>${vehicle.healthStatus}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      alert(error.response?.data?.message || 'Failed to export PDF');
    } finally {
      setExportLoading(false);
    }
  };

  const getROIColor = (roi: number) => {
    if (roi >= 20) return 'text-green-600';
    if (roi >= 10) return 'text-blue-600';
    if (roi >= 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 15) return 'bg-green-100 text-green-800';
    if (efficiency >= 10) return 'bg-blue-100 text-blue-800';
    if (efficiency >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-blue-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  const { fleetSummary, expenseBreakdown, vehicleAnalytics, topPerformers, underPerformers, monthlyTrends } = analyticsData;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Operational Analytics & Financial Reports
        </h1>
        <p className="text-gray-600 mt-2">Data-driven insights for fleet management decisions</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
              placeholder="End Date"
            />
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">All Vehicles</option>
              {vehicleAnalytics.map((v: VehicleAnalytic) => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.vehicleName} - {v.licensePlate}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleFilterApply}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Apply
          </button>
          <button
            onClick={handleFilterReset}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Fuel className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">{fleetSummary.fleetFuelEfficiency.toFixed(2)}</span>
          </div>
          <h3 className="text-lg font-semibold">Fleet Fuel Efficiency</h3>
          <p className="text-blue-100 text-sm">km/L average</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">{fleetSummary.fleetROI.toFixed(1)}%</span>
          </div>
          <h3 className="text-lg font-semibold">Fleet ROI</h3>
          <p className="text-green-100 text-sm">Return on Investment</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">₹{fleetSummary.fleetCostPerKm.toFixed(2)}</span>
          </div>
          <h3 className="text-lg font-semibold">Cost per KM</h3>
          <p className="text-purple-100 text-sm">Average operating cost</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 opacity-80" />
            <span className="text-3xl font-bold">₹{(fleetSummary.totalProfit / 1000).toFixed(1)}K</span>
          </div>
          <h3 className="text-lg font-semibold">Total Profit</h3>
          <p className="text-orange-100 text-sm">Revenue - Operating Cost</p>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            Expense Breakdown
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Fuel className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Fuel Expenses</p>
                  <p className="text-sm text-gray-600">
                    {((expenseBreakdown.fuel / expenseBreakdown.total) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">₹{(expenseBreakdown.fuel / 1000).toFixed(1)}K</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Wrench className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="font-semibold text-gray-900">Maintenance</p>
                  <p className="text-sm text-gray-600">
                    {((expenseBreakdown.maintenance / expenseBreakdown.total) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-600">₹{(expenseBreakdown.maintenance / 1000).toFixed(1)}K</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileDown className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="font-semibold text-gray-900">Miscellaneous</p>
                  <p className="text-sm text-gray-600">
                    {((expenseBreakdown.miscellaneous / expenseBreakdown.total) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-purple-600">₹{(expenseBreakdown.miscellaneous / 1000).toFixed(1)}K</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
              <div>
                <p className="font-bold text-gray-900 text-lg">Total Operating Cost</p>
              </div>
              <span className="text-3xl font-bold text-gray-900">₹{(expenseBreakdown.total / 1000).toFixed(1)}K</span>
            </div>
          </div>
        </div>

        {/* Monthly Trends Chart */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Monthly Cost Trends (Last 6 Months)
          </h2>
          <div className="space-y-3">
            {monthlyTrends.slice(-6).map((trend: any, index: number) => {
              const maxCost = Math.max(...monthlyTrends.map((t: any) => t.totalCost));
              const barWidth = (trend.totalCost / maxCost) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{trend.month}</span>
                    <span className="text-sm font-bold text-gray-900">₹{(trend.totalCost / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full flex items-center justify-end px-2 transition-all"
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="text-xs text-white font-semibold">
                        F: ₹{(trend.fuelCost / 1000).toFixed(1)}K | M: ₹{(trend.maintenanceCost / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top and Under Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            Top Performers (by ROI)
          </h2>
          <div className="space-y-3">
            {topPerformers.slice(0, 5).map((vehicle: VehicleAnalytic, index: number) => (
              <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{vehicle.vehicleName}</p>
                    <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${getROIColor(vehicle.roi)}`}>{vehicle.roi.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">{vehicle.fuelEfficiency.toFixed(1)} km/L</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Under Performers */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-600" />
            Needs Attention (by ROI)
          </h2>
          <div className="space-y-3">
            {underPerformers.slice(0, 5).map((vehicle: VehicleAnalytic, index: number) => (
              <div key={vehicle.vehicleId} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{vehicle.vehicleName}</p>
                    <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${getROIColor(vehicle.roi)}`}>{vehicle.roi.toFixed(1)}%</p>
                  <p className="text-xs text-gray-600">{vehicle.fuelEfficiency.toFixed(1)} km/L</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle Analytics Table */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Vehicle Performance Analytics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Fuel Efficiency</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">ROI</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Cost/km</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Distance</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Operating Cost</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Revenue</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Trips</th>
              </tr>
            </thead>
            <tbody>
              {vehicleAnalytics.map((vehicle: VehicleAnalytic) => (
                <tr key={vehicle.vehicleId} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-gray-900">{vehicle.vehicleName}</p>
                      <p className="text-sm text-gray-600">{vehicle.licensePlate}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {vehicle.vehicleType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getEfficiencyColor(vehicle.fuelEfficiency)}`}>
                      {vehicle.fuelEfficiency.toFixed(2)} km/L
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-lg font-bold ${getROIColor(vehicle.roi)}`}>
                      {vehicle.roi.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    ₹{vehicle.costPerKm.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {vehicle.totalDistance.toFixed(0)} km
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">
                    ₹{vehicle.totalOperatingCost.toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">
                    ₹{vehicle.totalRevenue.toFixed(0)}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 font-medium">
                    {vehicle.totalTrips}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-600" />
          Export Monthly Reports
        </h2>
        <p className="text-gray-600 mb-4">Generate comprehensive reports for monthly payroll and health audits</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-600" />
            <select
              value={exportMonth}
              onChange={(e) => setExportMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Select Month</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
            <input
              type="number"
              value={exportYear}
              onChange={(e) => setExportYear(e.target.value)}
              placeholder="Year"
              className="px-3 py-2 border rounded-lg w-24"
              min="2020"
              max="2030"
            />
          </div>
          <button
            onClick={exportToCSV}
            disabled={exportLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FileDown className="w-5 h-5" />
            {exportLoading ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={exportToPDF}
            disabled={exportLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <FileDown className="w-5 h-5" />
            {exportLoading ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
