import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StormGuestAuth from './pages/StormGuestAuth';
import SmartGuestAdmin from './pages/SmartGuestAdmin';
import StormGuestHotelPanel from './pages/StormGuestHotelPanel';
import SmartGuestCRM from './pages/SmartGuestCRM';

// Auth Guard component
function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to the appropriate dashboard if they try to access a panel they shouldn't
    if (userRole === 'super_admin') return <Navigate to="/admin" replace />;
    if (userRole === 'hotel_manager') return <Navigate to="/hotel" replace />;
    if (userRole === 'reception') return <Navigate to="/crm" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StormGuestAuth />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <SmartGuestAdmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/hotel"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hotel_manager']}>
              <StormGuestHotelPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crm"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'hotel_manager', 'reception']}>
              <SmartGuestCRM />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
