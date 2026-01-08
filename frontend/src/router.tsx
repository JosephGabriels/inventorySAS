import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Categories } from './pages/Categories'
import { Suppliers } from './pages/Suppliers'
import { Customers } from './pages/Customers'
import Sales from './pages/Sales'
import { StockMovements } from './pages/StockMovements'
import { Settings } from './pages/Settings'
import { Reports } from './pages/Reports'
import { PointOfSale } from './pages/PointOfSale'
import ProtectedRoute from './components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Dashboard />
      },
      {
        path: 'products',
        element: <Products />
      },
      {
        path: 'categories',
        element: <Categories />
      },
      {
        path: 'suppliers',
        element: <Suppliers />
      },
      {
        path: 'customers',
        element: <Customers />
      },
      {
        path: 'sales',
        element: <Sales />
      },
      {
        path: 'point-of-sale',
        element: <PointOfSale />
      },
      {
        path: 'stock-movements',
        element: <StockMovements />
      },
      {
        path: 'reports',
        element: <Reports />
      },
      {
        path: 'settings',
        element: <Settings />
      }
    ]
  }
])