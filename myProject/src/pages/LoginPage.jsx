import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // <-- fix: use `react-router-dom` instead of `react-router`
import { useAuth } from "../context/AuthContext";
import image from "../assets/la-plaza.png";

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const { login, user, error } = useAuth(); // <-- include user here
  const navigate = useNavigate();
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.userrole === "Customer") {
        navigate("/catalog");//put /catalog to connect with customer page
      } else if (user.userrole === "Admin") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(credentials);
    if (!success) {
      setLocalError("Invalid username or password");
    }
  };

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-gradient-to-b from-teal-600 to-teal-800">
      <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-300 w-96">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
            <img
              src={image}
              alt="La-Plaza Pharmacy Logo"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <h1 className="text-center text-xl font-bold text-gray-700">
          Online Ordering System
        </h1>

        {(error || localError) && (
          <div className="bg-red-100 text-red-800 p-2 w-full text-center border border-red-400 rounded mt-2">
            <i className="text-xs">{error || localError}</i>
          </div>
        )}

        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label
              htmlFor="username"
              className="text-sm font-semibold text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              onChange={handleChange}
              className="border border-gray-400 rounded p-2"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              onChange={handleChange}
              className="border border-gray-400 rounded p-2"
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="bg-teal-600 text-white p-2 w-full rounded-md font-bold hover:bg-teal-700">
            Login
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-teal-600 font-bold hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
