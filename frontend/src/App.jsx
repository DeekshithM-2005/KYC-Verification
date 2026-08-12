import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import VerifierDashboard from './pages/VerifierDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import VerifyIntegrity from './pages/VerifyIntegrity';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <Toaster position="top-right" />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Citizen']} />}>
              <Route path="/citizen-dashboard" element={<CitizenDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['Verifier']} />}>
              <Route path="/verifier-dashboard" element={<VerifierDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['Company']} />}>
              <Route path="/company-dashboard" element={<CompanyDashboard />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['Verifier', 'Company']} />}>
              <Route path="/verify-integrity/:userId" element={<VerifyIntegrity />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
            
          </Routes>
          </BrowserRouter>
        </WalletProvider>
      </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
