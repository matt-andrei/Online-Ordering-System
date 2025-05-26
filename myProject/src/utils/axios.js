import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.accessToken) {
      config.headers.Authorization = `Bearer ${user.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user?.refreshToken) {
          const response = await axios.post(
            "http://localhost:8000/api/token/refresh/",
            {
              refresh: user.refreshToken,
            }
          );

          const { access } = response.data;

          // Update the token in localStorage
          user.accessToken = access;
          localStorage.setItem("user", JSON.stringify(user));

          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${access}`;

          // Retry the original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem("user");
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
