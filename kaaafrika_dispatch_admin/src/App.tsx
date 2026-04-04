import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DispatchersPage } from './pages/dispatchers/DispatchersPage';
import { DispatcherDetailPage } from './pages/dispatchers/DispatcherDetailPage';
import { DeliveriesPage } from './pages/deliveries/DeliveriesPage';
import { DeliveryDetailPage } from './pages/deliveries/DeliveryDetailPage';
import { WalletPage } from './pages/wallet/WalletPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { LiveMapPage } from './pages/live-map/LiveMapPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="dispatchers" element={<DispatchersPage />} />
              <Route path="dispatchers/:id" element={<DispatcherDetailPage />} />
              <Route path="deliveries" element={<DeliveriesPage />} />
              <Route path="deliveries/:id" element={<DeliveryDetailPage />} />
              <Route path="live-map" element={<LiveMapPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: '500',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              padding: '10px 16px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
