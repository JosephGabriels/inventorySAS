import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Dashboard } from './pages/Dashboard'
import { PointOfSale } from './pages/PointOfSale'
import { Products } from './pages/Products'
import { Categories } from './pages/Categories'
import { Suppliers } from './pages/Suppliers'
import { StockMovements } from './pages/StockMovements'
import { Reports } from './pages/Reports'
import { Settings } from './pages/Settings'
import { DairyReports } from './pages/DairyReports'
import Sales from './pages/Sales'
import Login from './pages/Login'
import Register from './pages/Register'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from './contexts/AuthContext'
import { BusinessProvider } from './contexts/BusinessContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/layout/Layout'

interface AppProps {}

export const App: React.FC<AppProps> = () => {
  return (
    <AuthProvider>
      <BusinessProvider>
        <div className="min-h-screen bg-dark-900">
        <Routes>
          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected application routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="point-of-sale" element={<PointOfSale />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="stock-movements" element={<StockMovements />} />
            <Route path="reports" element={<Reports />} />
            <Route path="dairy-reports" element={<DairyReports />} />
            <Route path="sales" element={<Sales />} />
            <Route 
              path="settings" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Settings />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-dark-800 text-white',
            duration: 3000,
            style: {
              background: '#1F2937',
              color: '#fff',
            },
          }}
        />
        </div>
        <ReactQueryDevtools initialIsOpen={false} />
      </BusinessProvider>
    </AuthProvider>
  )
}

export default App