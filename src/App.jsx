import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MentorDashboard from './pages/MentorDashboard';
import AdminPanel from './pages/AdminPanel';
import ActivityLog from './pages/ActivityLog';
import Maintenance from './pages/Maintenance';

function AppRoutes() {
    const { currentUser } = useAuth();

    // if production and not admin and now between 2026-02-21 10:00:00 EST and 2026-02-21 17:59:59 EST
    if (import.meta.env.PROD && !currentUser?.isAdmin && Date.now() >= Date.UTC(2026, 1, 21, 15, 0, 0, 0) && Date.now() <= Date.UTC(2026, 1, 21, 15, 30, 0, 0)) {
        return <Maintenance />;
    }

    return (
        <Routes>
            {/* Public routes */}
            <Route
                path="/login"
                element={currentUser ? <Navigate to="/dashboard" replace /> : <Login />}
            />
            <Route
                path="/register"
                element={currentUser ? <Navigate to="/dashboard" replace /> : <Register />}
            />

            {/* Protected routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/mentor"
                element={
                    <ProtectedRoute requiredRole="mentor">
                        <MentorDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute requiredRole="admin">
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/activity/:type"
                element={
                    <ProtectedRoute>
                        <ActivityLog />
                    </ProtectedRoute>
                }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;
