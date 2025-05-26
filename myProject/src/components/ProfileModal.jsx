import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";
import OrderHistory from "./OrderHistory";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Pencil } from "lucide-react";

const LogoutConfirmationModal = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm ">
    <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-xl shadow-lg p-8 max-w-sm w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <LogOut className="w-6 h-6 text-red-600" /> Confirm Logout
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

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, refreshAccessToken, logout } = useAuth();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    birthdate: "",
    address: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();

  // Fetch latest user profile from backend when modal opens
  useEffect(() => {
    const fetchProfile = async () => {
      if (user && user.id && isOpen) {
        try {
          const response = await axios.get(
            `http://127.0.0.1:8000/api/users/${user.id}/`
          );
          setForm({
            first_name: response.data.first_name || "",
            last_name: response.data.last_name || "",
            phone: response.data.phone || "",
            birthdate: response.data.birthdate || "",
            address: response.data.address || "",
            username: response.data.username || "",
          });
        } catch (err) {
          toast.error("Failed to load profile data.");
        }
      }
    };
    fetchProfile();
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/users/update-delete/${user.id}/`,
        form
      );
      toast.success("Profile updated successfully!");
      refreshAccessToken && refreshAccessToken();
      onClose();
    } catch (error) {
      let msg = "Failed to update profile.";
      if (error.response?.data) {
        const err = error.response.data;
        if (err.username) msg = "Username is already taken.";
        else if (err.detail) msg = err.detail;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    toast.success("You have been logged out successfully!");
    setShowLogoutConfirm(false);
    onClose();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col relative border-t-8 border-blue-600">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-blue-700 text-3xl font-bold z-10"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        {/* Profile Header */}
        <div className="flex flex-col items-center justify-center pt-8 pb-4 border-b bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl">
          <div className="bg-blue-200 rounded-full p-4 mb-2">
            <User className="w-12 h-12 text-blue-700" />
          </div>
          <div className="text-xl font-bold text-gray-800">
            {form.first_name} {form.last_name}
          </div>
          <div className="text-blue-700 text-sm font-mono">
            @{form.username}
          </div>
        </div>
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8">
          {/* Edit Profile Section */}
          <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Pencil className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-700 text-lg">
                Edit Profile
              </span>
            </div>
            <form className="space-y-4" onSubmit={handleSave}>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-600">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-600">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-600">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="text-xs font-semibold text-gray-600">
                    Birthdate
                  </label>
                  <input
                    type="date"
                    name="birthdate"
                    value={form.birthdate}
                    onChange={handleChange}
                    className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-600">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-600">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-200"
                  required
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  <Pencil className="w-4 h-4" />
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
          {/* Divider */}
          <div className="border-t border-blue-200 my-2"></div>
          {/* Order History Section */}
          <div className="bg-white rounded-xl shadow p-6 border border-blue-100">
            <OrderHistory userId={user.id} />
          </div>
        </div>
        {/* Logout Button */}
        <div className="p-6 border-t flex justify-center bg-blue-50 rounded-b-2xl">
          <button
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 flex items-center gap-2 shadow"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
        {showLogoutConfirm && (
          <LogoutConfirmationModal
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={confirmLogout}
          />
        )}
      </div>
    </div>
  );
};

ProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ProfileModal;
