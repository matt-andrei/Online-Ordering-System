import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuth } from "./context/AuthContext";
import UserPage from "./pages/UserPage";
import ProductPage from "./pages/ProductPage";
import InventoryPage from "./pages/InventoryPage";
import ExpiredPage from "./pages/ExpiredPage";
import OrderPage from "./pages/OrderPage";
import PrescriptionPage from "./pages/PrescriptionPage";
import ReportsPage from "./pages/ReportsPage";
import CatalogPage from "./pages/CatalogPage";
import SignupPage from "./pages/SignupPage";
import { ToastContainer, toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css";

const PrivateRoute = ({ element }) => {
  const { user } = useAuth();
  return user ? element : <Navigate to="/" />;
};

function App() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("You have logged out successfully!"); // Show success toast
  };

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute element={<DashboardPage />} />}
          />
          <Route
            path="/user"
            element={<PrivateRoute element={<UserPage />} />}
          />
          <Route
            path="/product"
            element={<PrivateRoute element={<ProductPage />} />}
          />
          <Route
            path="/orders"
            element={<PrivateRoute element={<OrderPage />} />}
          />
          <Route
            path="/prescription-verification"
            element={<PrivateRoute element={<PrescriptionPage />} />}
          />
          <Route
            path="/inventory"
            element={<PrivateRoute element={<InventoryPage />} />}
          />
          <Route
            path="/expired"
            element={<PrivateRoute element={<ExpiredPage />} />}
          />
          <Route
            path="/reports"
            element={<PrivateRoute element={<ReportsPage />} />}
          />
          <Route
            path="/catalog"
            element={<PrivateRoute element={<CatalogPage />} />}
          />
        </Routes>
      </Router>

      {/* Toast container for showing notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
