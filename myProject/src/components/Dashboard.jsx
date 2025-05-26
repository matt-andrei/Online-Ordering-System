import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import {
  FaUsers,
  FaBox,
  FaExclamationTriangle,
  FaShoppingCart,
  FaClock,
  FaChartLine,
} from "react-icons/fa";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="text-white text-xl" />
      </div>
    </div>
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired,
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    lowStockProducts: 0,
    expiredProducts: 0,
    outOfStock: 0,
    pendingOrders: 0,
    totalSales: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch statistics
        const statsResponse = await axios.get(
          "http://127.0.0.1:8000/api/dashboard/stats/"
        );
        setStats(statsResponse.data);

        // Fetch recent orders
        const ordersResponse = await axios.get(
          "http://127.0.0.1:8000/api/dashboard/recent-orders/"
        );
        setRecentOrders(ordersResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Total Customers"
              value={stats.totalCustomers}
              icon={FaUsers}
              color="bg-blue-500"
            />
            <StatCard
              title="Low Stock Products"
              value={stats.lowStockProducts}
              icon={FaBox}
              color="bg-yellow-500"
            />
            <StatCard
              title="Expired Products"
              value={stats.expiredProducts}
              icon={FaExclamationTriangle}
              color="bg-red-500"
            />
            <StatCard
              title="Out of Stock"
              value={stats.outOfStock}
              icon={FaBox}
              color="bg-red-600"
            />
            <StatCard
              title="Pending Orders"
              value={stats.pendingOrders}
              icon={FaClock}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Sales"
              value={`₱${stats.totalSales.toLocaleString()}`}
              icon={FaChartLine}
              color="bg-green-500"
            />
          </div>

          {/* Recent Orders Section */}
          <div className="shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            {recentOrders.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No recent orders found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₱{order.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : order.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {/*<div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center gap-2">
              <FaShoppingCart /> New Order
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-300 flex items-center justify-center gap-2">
              <FaBox /> Add Product
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors duration-300 flex items-center justify-center gap-2">
              <FaUsers /> Add Customer
            </button>
            <button className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-300 flex items-center justify-center gap-2">
              <FaChartLine /> View Reports
            </button>
          </div>*/}
        </>
      )}
    </div>
  );
}
