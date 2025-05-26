import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import image from "../assets/la-plaza.png";
import { FaChartBar, FaUsers, FaBoxOpen, FaChartLine } from "react-icons/fa";
import InventoryDropdown from "./InventoryDropdown";
import OrderDropdown from "./OrderDropdown";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

const LogoutConfirmationModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Confirm Logout
      </h3>
      <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
);

LogoutConfirmationModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

export default function NavBar() {
  const { logout, user } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    toast.success("You have been logged out successfully!");
    setShowLogoutConfirm(false);
  };

  // Function to render navigation items based on user role
  const renderNavItems = () => {
    if (user?.userrole === "Pharmacy Staff") {
      return (
        <>
          <Link
            to="/dashboard"
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2"
          >
            <FaChartBar /> <span>Dashboard</span>
          </Link>
          <OrderDropdown />
          <Link
            to="/product"
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2"
          >
            <FaBoxOpen /> <span>Product Management</span>
          </Link>
          <InventoryDropdown />
        </>
      );
    }

    // Admin sees all items
    return (
      <>
        <Link
          to="/dashboard"
          className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2"
        >
          <FaChartBar /> <span>Dashboard</span>
        </Link>
        <Link
          to="/user"
          className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2"
        >
          <FaUsers /> <span>User Management</span>
        </Link>
        <OrderDropdown />
        <Link
          to="/product"
          className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2"
        >
          <FaBoxOpen /> <span>Product Management</span>
        </Link>
        <InventoryDropdown />
        <Link
          to="/reports"
          className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2"
        >
          <FaChartLine /> <span>Reports</span>
        </Link>
      </>
    );
  };

  return (
    <>
      <div className="h-screen w-64 bg-gray-100 p-5 flex flex-col fixed left-0 top-0 overflow-y-auto p-6">
        {/* Logo and Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <img
              src={image}
              alt="La-Plaza Pharmacy Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="text-sm font-bold text-gray-800 leading-tight">
            Online Ordering System
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-y-3 text-gray-700 flex-grow">
          {renderNavItems()}
        </div>

        {/* Logout */}
        <div className="mt-auto">
          <span className="font-semibold text-gray-500 text-sm">Settings</span>
          <button
            onClick={handleLogoutClick}
            className="w-full text-left p-2 text-red-600 font-semibold hover:bg-gray-200 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {showLogoutConfirm && (
        <LogoutConfirmationModal
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </>
  );
}
