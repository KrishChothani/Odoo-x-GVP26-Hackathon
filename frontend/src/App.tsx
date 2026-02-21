import { Route, Routes } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import DashboardPage from './pages/DashboardPage';
import FleetFlow from './pages/FleetFlow';
import VehicleRegistry from './pages/VehicleRegistry';
import TripDispatcher from './pages/TripDispatcher';
import Maintenance from './pages/Maintenance';
import TripExpense from './pages/TripExpense';
import Performance from './pages/Performance';
import Analytics from './pages/Analytics';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/email-verified" element={<EmailVerifiedPage />} />
      <Route path="/dashboard" element={<DashboardPage />}>
        <Route index element={<FleetFlow />} />
        <Route path="vehicle-registry" element={<VehicleRegistry />} />
        <Route path="trip-dispatcher" element={<TripDispatcher />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="trip-expense" element={<TripExpense />} />
        <Route path="performance" element={<Performance />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}

export default App;
