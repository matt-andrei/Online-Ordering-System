import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import image from "../assets/la-plaza.png";
import { toast } from "react-toastify";

export default function SignupPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    birthdate: "",
    address: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        birthdate: form.birthdate,
        address: form.address,
        username: form.username,
        password: form.password,
        userrole: "Customer",
      };
      await axios.post("http://127.0.0.1:8000/api/users/create/", payload);
      toast.success("Account created successfully! Please log in.");
      navigate("/");
    } catch (error) {
      let msg = "Failed to create account. Please try again.";
      if (error.response?.data) {
        const err = error.response.data;
        if (err.username) msg = "Username is already taken.";
        else if (err.password) msg = err.password;
        else if (err.detail) msg = err.detail;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-b from-teal-600 to-teal-800">
      <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-300 w-[600px] max-w-full">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <img
              src={image}
              alt="La-Plaza Pharmacy Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <h1 className="text-center text-3xl font-bold text-gray-700 mb-2">
          Sign Up
        </h1>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-gray-700">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="border border-gray-400 rounded p-2"
                placeholder="Enter your first name"
                required
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="border border-gray-400 rounded p-2"
                placeholder="Enter your last name"
                required
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="border border-gray-400 rounded p-2"
                placeholder="Enter your phone number"
                required
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-gray-700">
                Birth Date
              </label>
              <input
                type="date"
                name="birthdate"
                value={form.birthdate}
                onChange={handleChange}
                className="border border-gray-400 rounded p-2"
                placeholder="Enter your birthdate"
                required
              />
            </div>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="border border-gray-400 rounded p-2"
              placeholder="Enter your address"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="border border-gray-400 rounded p-2"
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="border border-gray-400 rounded p-2"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="border border-gray-400 rounded p-2"
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="bg-teal-600 text-white p-2 w-full rounded-md font-bold hover:bg-teal-700"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="/" className="text-teal-600 font-bold hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
