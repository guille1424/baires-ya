import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sales from "./pages/Sales";
import Orders from "./pages/Orders";
import WebOrders from "./pages/WebOrders";
import Inventory from "./pages/Inventory";
import Import from "./pages/Import";
import Customers from "./pages/Customers";
import StoreLayout from "./components/public/StoreLayout";
import StoreHome from "./pages/public/StoreHome";
import ProductDetail from "./pages/public/ProductDetail";
import CustomerLogin from "./pages/public/CustomerLogin";
import CustomerRegister from "./pages/public/CustomerRegister";
import CustomerProfile from "./pages/public/CustomerProfile";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/inventory" replace />;
  return <>{children}</>;
}

function App() {
  const { isAuthenticated, role } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Tienda E-commerce) */}
        <Route
          path="/"
          element={
            <StoreLayout>
              <StoreHome />
            </StoreLayout>
          }
        />
        <Route
          path="/producto/:barcode"
          element={
            <StoreLayout>
              <ProductDetail />
            </StoreLayout>
          }
        />
        <Route
          path="/ingresar"
          element={
            <StoreLayout>
              <CustomerLogin />
            </StoreLayout>
          }
        />
        <Route
          path="/registro"
          element={
            <StoreLayout>
              <CustomerRegister />
            </StoreLayout>
          }
        />
        <Route
          path="/mi-cuenta"
          element={
            <StoreLayout>
              <CustomerProfile />
            </StoreLayout>
          }
        />

        {/* Rutas de Administración */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </AdminRoute>
          }
        />
        <Route
          path="/web-orders"
          element={
            <ProtectedRoute>
              <Layout>
                <WebOrders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Layout>
                <Sales />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <Layout>
                <Import />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout>
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
