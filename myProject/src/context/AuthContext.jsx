import { useState, createContext, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://127.0.0.1:8000/api/token/", {
        username: credentials.username,
        password: credentials.password,
      });

      const { access, refresh, userrole, username } = response.data;

      // Fetch user details to get the ID
      const userResponse = await axios.get(
        `http://127.0.0.1:8000/api/users/fetch/`
      );

      const userDetails = userResponse.data.find(
        (user) => user.username === username
      );

      if (!userDetails) {
        throw new Error("User details not found");
      }

      const userData = {
        id: userDetails.id,
        username,
        userrole,
        accessToken: access,
        refreshToken: refresh,
      };

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      setLoading(false);
      return true;
    } catch (err) {
      setError("Invalid credentials");
      setLoading(false);
      return false;
    }
  };

  // Method to refresh the access token using the refresh token
  const refreshAccessToken = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || !storedUser.refreshToken) return;

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/token/refresh/",
        {
          refresh: storedUser.refreshToken,
        }
      );

      const { access } = response.data;

      // Update the access token
      storedUser.accessToken = access;
      setUser(storedUser);
      localStorage.setItem("user", JSON.stringify(storedUser));
      return true;
    } catch (err) {
      setError("Failed to refresh token.");
      logout();
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{ user, error, loading, login, logout, refreshAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
