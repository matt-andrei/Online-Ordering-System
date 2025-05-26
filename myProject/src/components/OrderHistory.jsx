import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";

const statusIcon = (status) => {
  switch (status) {
    case "Completed":
      return <CheckCircle className="inline w-5 h-5 text-green-600 mr-1" />;
    case "Pending":
      return <Clock className="inline w-5 h-5 text-yellow-500 mr-1" />;
    case "Processing":
      return (
        <Loader2 className="inline w-5 h-5 text-blue-500 animate-spin mr-1" />
      );
    case "Cancelled":
      return <XCircle className="inline w-5 h-5 text-red-600 mr-1" />;
    default:
      return null;
  }
};

const OrderHistory = ({ userId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/orders/");
        // Filter orders by userId
        const userOrders = response.data.filter(
          (order) => order.customer === userId
        );
        setOrders(userOrders);
      } catch {
        toast.error("Failed to fetch order history.");
      } finally {
        setLoading(false);
      }
    };
    if (userId) fetchOrders();
  }, [userId]);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-2 text-blue-700 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" /> Order History
      </h3>
      {loading ? (
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="animate-spin w-5 h-5" /> Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500">No orders found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="py-2 px-4 text-left">Order ID</th>
                <th className="py-2 px-4 text-left">Date</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr
                  key={order.id}
                  className={
                    idx % 2 === 0
                      ? "bg-white hover:bg-blue-50 transition-colors"
                      : "bg-blue-50 hover:bg-blue-100 transition-colors"
                  }
                >
                  <td className="py-2 px-4 font-medium">{order.id}</td>
                  <td className="py-2 px-4">
                    {new Date(order.order_date).toLocaleString()}
                  </td>
                  <td className="py-2 px-4 flex items-center">
                    {statusIcon(order.status)}
                    <span>{order.status}</span>
                  </td>
                  <td className="py-2 px-4 text-blue-700 font-semibold">
                    ₱{order.total_amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

OrderHistory.propTypes = {
  userId: PropTypes.number.isRequired,
};

export default OrderHistory;
