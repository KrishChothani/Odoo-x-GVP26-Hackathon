import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import DashboardPage from './pages/DashboardPage';
import DispatcherDashboard from './pages/DispatcherDashboard';
import DriverDashboard from './pages/DriverDashboard';
import SafetyOfficerDashboard from './pages/SafetyOfficerDashboard';
import FinancialAnalystDashboard from './pages/FinancialAnalystDashboard';
import FleetFlow from './pages/FleetFlow';
import VehicleRegistry from './pages/VehicleRegistry';
import TripDispatcher from './pages/TripDispatcher';
import MaintenancePage from './pages/MaintenancePage';
import ExpenseTrackingPage from './pages/ExpenseTrackingPage';
import DriverPerformancePage from './pages/DriverPerformancePage';
import AnalyticsPage from './pages/AnalyticsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/email-verified" element={<EmailVerifiedPage />} />
      
      {/* Manager Dashboard - Full Feature Access */}
      <Route path="/dashboard" element={<DashboardPage />}>
        <Route index element={<FleetFlow />} />
        <Route path="vehicle-registry" element={<VehicleRegistry />} />
        <Route path="trip-dispatcher" element={<TripDispatcher />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="trip-expense" element={<ExpenseTrackingPage />} />
        <Route path="driver-performance" element={<DriverPerformancePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      
      {/* Dispatcher Dashboard - Trip Creation & Assignment */}
      <Route path="/dispatcher-portal" element={<DispatcherDashboard />} />
      
      {/* Maintenance Portal - Service & Repairs (FLEET_MANAGER, DISPATCHER) */}
      <Route path="/maintenance-portal" element={<MaintenancePage />} />
      
      {/* Expense Tracking Portal - Fuel & Operational Costs (FLEET_MANAGER, DISPATCHER, FINANCIAL_ANALYST, DRIVER) */}
      <Route path="/expense-portal" element={<ExpenseTrackingPage />} />
      
      {/* Driver Performance Portal - Compliance & Safety (FLEET_MANAGER, SAFETY_OFFICER) */}
      <Route path="/driver-performance-portal" element={<DriverPerformancePage />} />
      
      {/* Analytics Portal - Operational Analytics & Financial Reports (FLEET_MANAGER, FINANCIAL_ANALYST) */}
      <Route path="/analytics-portal" element={<AnalyticsPage />} />
      
      {/* Driver Dashboard - Trip Execution Only */}
      <Route path="/driver-portal" element={<DriverDashboard />} />
      
      {/* Safety Officer Dashboard - Compliance Monitoring */}
      <Route path="/safety-officer-portal" element={<SafetyOfficerDashboard />} />
      
      {/* Financial Analyst Dashboard - Cost Analysis */}
      <Route path="/financial-analyst-portal" element={<FinancialAnalystDashboard />} />
    </Routes>
  );
}

export default App;
