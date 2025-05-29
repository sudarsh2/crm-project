import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './components/Login';
import Logout from './pages/Logout';
import PrivateRoute from './components/PrivateRoute';
import Customers from './pages/Customers';
import CreateCustomer from "./pages/create_customer";
import CustomerDetails from './pages/customer_details';
import FollowUpsPage from './pages/FollowUpsPage';
import ColdCalls from './pages/ColdCalls';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Protected routes with Layout */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/customers" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetails />} />
            <Route path="/cold_calls" element={<ColdCalls />} />
            <Route path="/create_customer" element={<CreateCustomer />} />
            <Route path="/follow-ups" element={<FollowUpsPage />} />
            <Route path="/todays_followups" element={<FollowUpsPage  />} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
