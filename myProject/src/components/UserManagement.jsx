import React, { useState, useEffect } from "react";
import axios from "axios";
import UserModal from "./UserModal";
import { toast } from "react-toastify";
import { FaUserEdit, FaPlus } from "react-icons/fa";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchRole, setSearchRole] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    first_name: "",
    last_name: "",
    username: "",
    password: "",
    userrole: "Customer",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/users/");
        setUsers(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesRole = searchRole ? user.userrole === searchRole : true;
    const matchesText =
      user.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.username.toLowerCase().includes(searchText.toLowerCase());
    return matchesRole && matchesText;
  });

  const resetFormData = () => {
    setFormData({
      id: null,
      first_name: "",
      last_name: "",
      username: "",
      password: "",
      userrole: "Customer",
    });
    setConfirmPassword("");
    setPasswordError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }

    setPasswordError("");

    try {
      if (formData.id) {
        const response = await axios.put(
          `http://127.0.0.1:8000/api/users/update-delete/${formData.id}/`,
          formData
        );
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === formData.id ? response.data : user
          )
        );
      } else {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/users/create/",
          formData
        );
        setUsers((prevUsers) => [...prevUsers, response.data]);
      }

      return true; // ✅ Indicate success
    } catch (error) {
      console.error("Error submitting user:", error);

      // Handle username uniqueness error
      if (error.response?.data?.username) {
        toast.error(
          "Username is already taken. Please choose a different username."
        );
        return false;
      }

      // Handle other validation errors
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      toast.error(`Error: ${errorMessage}`);
      return false;
    }
  };

  const handleEditClick = (user) => {
    setFormData({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      password: "",
      userrole: user.userrole,
    });
    setConfirmPassword("");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    resetFormData();
    setShowModal(false);
  };

  return (
    <div className="p-6 flex-1">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-3xl font-bold mb-4">User Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 flex items-center gap-2 shadow-md"
        >
          <FaPlus /> Add User
        </button>
      </div>

      <div className="bg-white shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name or username..."
              className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select
              className="border px-4 py-2 rounded-lg"
              onChange={(e) => setSearchRole(e.target.value)}
              value={searchRole}
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Pharmacy Staff">Pharmacy Staff</option>
              <option value="Customer">Customer</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg
                className="animate-spin h-8 w-8 text-blue-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              No users found.
            </div>
          ) : (
            <table className="w-full border-collapse rounded-lg">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4 text-left">ID</th>
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">User Role</th>
                  <th className="py-3 px-4 text-left">Username</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t hover:bg-blue-50 transition-colors duration-150"
                  >
                    <td className="py-3 px-4">{user.id}</td>
                    <td className="py-3 px-4">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-md font-semibold ${
                          user.userrole === "Admin"
                            ? "bg-blue-100 text-blue-700"
                            : ""
                        }`}
                      >
                        {user.userrole}
                      </span>
                    </td>
                    <td className="py-3 px-4">{user.username}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEditClick(user)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 flex items-center gap-1 shadow-sm"
                        title="Edit User"
                      >
                        <FaUserEdit /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <UserModal
          showModal={showModal}
          setShowModal={setShowModal}
          formData={formData}
          handleInputChange={handleInputChange}
          handleFormSubmit={handleFormSubmit}
          resetFormData={resetFormData}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          passwordError={passwordError}
          setPasswordError={setPasswordError}
        />
      )}
    </div>
  );
}
