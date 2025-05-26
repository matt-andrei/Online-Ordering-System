import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Package,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:8000/api/orders/");
      setOrders(response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setStatusLoading(true);
    try {
      await axios.put(`http://localhost:8000/api/orders/${orderId}/status/`, {
        status: newStatus,
      });

      // Update the orders list
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      // Update selected order if it's the one being updated
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setStatusLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return "₱0.00";
    }
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.id).includes(searchTerm);

    const matchesStatus =
      filterStatus === "All" || order.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "Processing":
        return <Clock size={16} className="text-blue-500" />;
      case "Cancelled":
        return <XCircle size={16} className="text-red-500" />;
      case "Pending":
      default:
        return <AlertTriangle size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getPrescriptionStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const canProcessOrder = (order) => {
    if (order.status !== "Pending") return false;
    if (order.requires_prescription) {
      return order.prescription_status === "Approved";
    }
    return true;
  };

  return (
    <div className="p-6 flex-1">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Orders List */}
        <div className="md:w-2/3 bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between mb-4 relative z-0">
            <div className="relative flex-1 mr-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-10">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(order.order_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatPrice(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(order.status)}
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                          {order.requires_prescription && (
                            <span
                              className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getPrescriptionStatusColor(
                                order.prescription_status
                              )}`}
                            >
                              RX: {order.prescription_status || "Pending"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-teal-600 hover:text-teal-900 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="md:w-1/3 bg-white rounded-lg shadow-lg p-6">
          {selectedOrder ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Order #{selectedOrder.id}
              </h2>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                {selectedOrder.requires_prescription && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Prescription:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getPrescriptionStatusColor(
                        selectedOrder.prescription_status
                      )}`}
                    >
                      {selectedOrder.prescription_status || "Pending"}
                    </span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span>{selectedOrder.payment_method_display}</span>
                </div>
                {selectedOrder.payment_method === "ONLINE" && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Payment Proof:</span>
                    {selectedOrder.payment_proof_url ? (
                      <a
                        href={selectedOrder.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Proof
                      </a>
                    ) : (
                      <span className="text-gray-500">Not provided</span>
                    )}
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Customer:</span>
                  <span>{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Order Date:</span>
                  <span>{formatDate(selectedOrder.order_date)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Pickup Date:</span>
                  <span>{formatDate(selectedOrder.pickup_date)}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 block mb-1">Notes:</span>
                    <p className="text-gray-800">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">
                  Order Items
                </h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items &&
                    selectedOrder.items.map((item) => {
                      const subtotal = item.quantity * item.price_at_time;
                      return (
                        <div key={item.id} className="p-3">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">
                              {item.product_name}
                              {item.batch?.product?.requires_prescription && (
                                <span className="ml-2 text-xs text-purple-600">
                                  (RX Required)
                                </span>
                              )}
                            </span>
                            <span>{formatPrice(subtotal)}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.quantity} x {formatPrice(item.price_at_time)}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-4 text-right font-bold">
                  Total: {formatPrice(selectedOrder.total_amount)}
                </div>
              </div>

              {/* Order actions */}
              <div className="flex flex-col gap-2">
                {selectedOrder.status === "Pending" && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id, "Processing")
                    }
                    disabled={statusLoading || !canProcessOrder(selectedOrder)}
                    className={`py-2 px-4 rounded-md flex items-center justify-center gap-2 
                      ${
                        canProcessOrder(selectedOrder)
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                  >
                    <Clock size={20} />
                    Process Order
                    {selectedOrder.requires_prescription &&
                      selectedOrder.prescription_status !== "Approved" && (
                        <span className="text-xs">
                          (Needs Prescription Approval)
                        </span>
                      )}
                  </button>
                )}

                {selectedOrder.status === "Processing" && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id, "Completed")
                    }
                    disabled={statusLoading}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Complete Order
                  </button>
                )}

                {(selectedOrder.status === "Pending" ||
                  selectedOrder.status === "Processing") && (
                  <button
                    onClick={() =>
                      handleUpdateStatus(selectedOrder.id, "Cancelled")
                    }
                    disabled={statusLoading}
                    className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
                  >
                    <XCircle size={20} />
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
              <Package size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500">Select an order to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
