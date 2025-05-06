import React, { useEffect, useState } from "react";
import { Layout } from "antd";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import AppHeader from "./components/Header";
import Sidebar from "./components/Sidebar";
import LoginPage from "./components/Auth/login";
import RegisterPage from "./components/Auth/register";
import Dashboard from "./components/Dashboard/Dashboard";
import { useAuthStore } from "./Store/stores";
import LoadingSpinner from "./components/LoadingSpinner";
import ProfilePage from "./components/Auth/ProfilePage";
import StoresPage from "./components/StoresPages/singleStore";
import ProductsPage from "./components/StoresPages/AllProducts";
import AddCategory from "./components/StoresPages/AddCategory";
import AddProductPage from "./components/StoresPages/AddProduct";
import SupplierList from "./components/StoresPages/SupplierPage";
import CategoryManagement from "./components/StoresPages/CategoriesPage";
import Home from "./Dummy/Home";
import CustomerPage from "./components/StoresPages/CustomerPage";
import SalesPage from "./components/StoresPages/SalesPage";
import InventoryPage from "./components/StoresPages/InventoryPage";
import SubscriptionPage from "./components/Auth/Subcription";
import StartScreen from "./components/SplashScreen";
import SalesReportPage from "./components/Dashboard/GenerateReport";
import SalesReportComponent from "./components/Dashboard/GenerateReport";
import ProfitReportComponent from "./components/Dashboard/ProfitReport";
import InventoryDashboard from "./components/StoresPages/InventoryPage";
import PrescriptionViewerPage from "./components/StoresPages/PrescriptonViewerPage";
// import EnhancedPOS from "./components/POS/POS2";
// import POSHomePage from "./components/POS/POS2";
// import PharmacyPOS from "./components/POS/POS2";

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, token, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const { user, token } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const location = useLocation(); // Get current route

  // Hide Sidebar for POS route
  const hideSidebar =
    location.pathname === "/store/pos" || location.pathname === "/";

  const hideHeaderAndSidebar = location.pathname === "/"; // Hide both Header and Sidebar on / path

  // Check for existing session on app load
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <div className="">
        {user && token && !hideHeaderAndSidebar && <AppHeader />}
        <Layout>
          <div className="">
            {/* Conditionally render Sidebar */}
            {user && token && !hideSidebar && <Sidebar />}
            <Layout.Content
              style={{
                marginLeft: user && token && !hideSidebar ? 240 : 0,
                marginTop: 0,
                padding: 0,
                minHeight: "calc(100vh - 64px)",
              }}
            >
              <main className="main-content">
                <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/login"
                    element={
                      user && token ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <LoginPage />
                      )
                    }
                  />
                  <Route path="/" element={<StartScreen />} />
                  <Route
                    path="/register"
                    element={
                      user && token ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <RegisterPage />
                      )
                    }
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stores"
                    element={
                      <ProtectedRoute>
                        <StoresPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/products"
                    element={
                      <ProtectedRoute>
                        <ProductsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-category"
                    element={
                      <ProtectedRoute>
                        <AddCategory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-product"
                    element={
                      <ProtectedRoute>
                        <AddProductPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/sales-report"
                    element={
                      <ProtectedRoute>
                        <SalesReportComponent />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/suppliers"
                    element={
                      <ProtectedRoute>
                        <SupplierList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/profit"
                    element={
                      <ProtectedRoute>
                        <ProfitReportComponent />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/categories"
                    element={
                      <ProtectedRoute>
                        <CategoryManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/pos"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/customers"
                    element={
                      <ProtectedRoute>
                        <CustomerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/sales"
                    element={
                      <ProtectedRoute>
                        <SalesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/store/inventory"
                    element={
                      <ProtectedRoute>
                        <InventoryDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/subscription"
                    element={
                      <ProtectedRoute>
                        <SubscriptionPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/prescriptions/view/:customerId/:prescriptionId"
                    element={<PrescriptionViewerPage />}
                  />
                </Routes>
              </main>
            </Layout.Content>
          </div>
        </Layout>
      </div>
    </Layout>
  );
};

export default App;
