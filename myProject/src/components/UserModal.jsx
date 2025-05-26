import React from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function UserModal({
  showModal,
  setShowModal,
  formData,
  handleInputChange,
  handleFormSubmit,
  resetFormData,
  confirmPassword,
  setConfirmPassword,
  passwordError,
  setPasswordError,
}) {
  if (!showModal) return null;

  const handleClose = () => {
    resetFormData();
    setConfirmPassword("");
    setPasswordError("");
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData) {
      console.error("formData is undefined");
      return;
    }

    if (
      (!formData.id || formData.password) &&
      formData.password !== confirmPassword
    ) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError("");

    const success = await handleFormSubmit(e);

    if (success) {
      const message = formData.id
        ? `${formData.first_name} ${formData.last_name} has been successfully updated.`
        : `${formData.first_name} ${formData.last_name} has been successfully added.`;

      toast.success(message);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-lg p-6 w-[500px]">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          {formData.id ? "Edit User" : "Add User"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First & Last Name */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                placeholder="Enter first name"
                className="w-full px-3 py-2 bg-gray-100 rounded-md"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                placeholder="Enter last name"
                className="w-full px-3 py-2 bg-gray-100 rounded-md"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter username"
              className="w-full px-3 py-2 bg-gray-100 rounded-md"
              required
            />
          </div>

          {/* Password & Confirm Password */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter password"
                className="w-full px-3 py-2 bg-gray-100 rounded-md"
                required={!formData.id}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600">
                Re-enter Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 bg-gray-100 rounded-md"
                required={!formData.id}
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              User Role
            </label>
            <select
              name="userrole"
              value={formData.userrole}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-gray-100 rounded-md"
              required
            >
              <option value="Customer">Customer</option>
              <option value="Pharmacy Staff">Pharmacy Staff</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {formData.id ? "Edit" : "Add"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
