import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEdit, FaPlus, FaSearch, FaEye, FaEyeSlash } from "react-icons/fa";
import PropTypes from "prop-types";

function InventoryModal({ product, onClose, refreshBatches }) {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDepletedBatches, setShowDepletedBatches] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    batch_code: "",
    quantity: 0,
    expiration_date: "",
    date_received: new Date().toISOString().split("T")[0],
    is_active: true,
  });

  const fetchBatchesForProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `http://127.0.0.1:8000/api/product/${product.id}/batches/`
      );

      // Process batches to handle expired ones
      const processedBatches = await Promise.all(
        response.data.map(async (batch) => {
          if (batch.is_expired && batch.is_active) {
            try {
              // Update batch to inactive and set stock_out to current quantity
              await axios.put(
                `http://127.0.0.1:8000/api/product/${product.id}/batches/${batch.id}/update/`,
                {
                  ...batch,
                  is_active: false,
                  stock_out: batch.quantity, // Set stock_out to current quantity for expired batches
                }
              );

              return {
                ...batch,
                is_active: false,
                stock_out: batch.quantity,
              };
            } catch (error) {
              console.error("Error processing expired batch:", error);
              return batch;
            }
          }
          return batch;
        })
      );

      // Sort batches by expiration date (earliest first)
      const sortedBatches = processedBatches.sort(
        (a, b) => new Date(a.expiration_date) - new Date(b.expiration_date)
      );

      setBatches(sortedBatches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to fetch batches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchesForProduct();
  }, [product]);

  useEffect(() => {
    // Filter batches based on search term and depleted status
    const filtered = batches.filter((batch) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        batch.batch_code.toLowerCase().includes(searchLower) ||
        batch.expiration_date.toLowerCase().includes(searchLower) ||
        (batch.is_expired && "expired".includes(searchLower)) ||
        (!batch.is_active && "inactive".includes(searchLower)) ||
        (batch.is_active &&
          !batch.is_expired &&
          "active".includes(searchLower));

      // If batch is depleted (quantity = 0) and we're not showing depleted batches, filter it out
      if (batch.quantity === 0 && !showDepletedBatches) {
        return false;
      }

      return matchesSearch;
    });
    setFilteredBatches(filtered);
  }, [searchTerm, batches, showDepletedBatches]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Validate batch code to only accept numbers
    if (name === "batch_code" && value !== "") {
      if (!/^\d+$/.test(value)) {
        toast.error("Batch code must contain only numbers");
        return;
      }
    }

    // Validate date received and expiration date
    if (name === "expiration_date" && formData.date_received) {
      const expirationDate = new Date(value);
      const receivedDate = new Date(formData.date_received);

      if (expirationDate < receivedDate) {
        toast.error("Expiration date cannot be earlier than date received");
        return;
      }
    }

    if (name === "date_received" && formData.expiration_date) {
      const expirationDate = new Date(formData.expiration_date);
      const receivedDate = new Date(value);

      if (expirationDate < receivedDate) {
        toast.error("Date received cannot be later than expiration date");
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      // Validate batch code
      if (!/^\d+$/.test(formData.batch_code)) {
        toast.error("Batch code must contain only numbers");
        return;
      }

      // Validate dates
      const expirationDate = new Date(formData.expiration_date);
      const receivedDate = new Date(formData.date_received);

      if (expirationDate < receivedDate) {
        toast.error("Expiration date cannot be earlier than date received");
        return;
      }

      // Format the batch data according to the backend expectations
      const batchData = {
        batch_code: formData.batch_code,
        quantity: parseInt(formData.quantity),
        expiration_date: formData.expiration_date,
        date_received: formData.date_received,
        is_active: true,
        product: product.id,
      };

      const response = await axios.post(
        `http://127.0.0.1:8000/api/product/${product.id}/batches/create/`,
        batchData
      );

      if (response.data) {
        toast.success("Batch added successfully!");
        setAddModalOpen(false);
        resetFormData();
        fetchBatchesForProduct();
        refreshBatches?.();
      }
    } catch (error) {
      console.error("Error adding batch:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to add batch";
      toast.error(errorMessage);
    }
  };

  const handleEditBatch = async (e) => {
    e.preventDefault();
    try {
      // Validate batch code
      if (!/^\d+$/.test(formData.batch_code)) {
        toast.error("Batch code must contain only numbers");
        return;
      }

      // Validate dates
      const expirationDate = new Date(formData.expiration_date);
      const receivedDate = new Date(formData.date_received);

      if (expirationDate < receivedDate) {
        toast.error("Expiration date cannot be earlier than date received");
        return;
      }

      // Format the batch data according to the backend expectations
      const updatedBatch = {
        batch_code: formData.batch_code,
        quantity: parseInt(formData.quantity),
        expiration_date: formData.expiration_date,
        date_received: formData.date_received,
        is_active: formData.is_active,
        product: product.id,
      };

      // Only update if there are actual changes
      if (JSON.stringify(updatedBatch) !== JSON.stringify(selectedBatch)) {
        const response = await axios.put(
          `http://127.0.0.1:8000/api/product/${product.id}/batches/${selectedBatch.id}/update/`,
          updatedBatch
        );

        if (response.data) {
          toast.success("Batch updated successfully!");
          setEditModalOpen(false);
          setSelectedBatch(null);
          resetFormData();
          fetchBatchesForProduct();
          refreshBatches?.();
        }
      } else {
        toast.info("No changes were made to the batch.");
        setEditModalOpen(false);
        setSelectedBatch(null);
        resetFormData();
      }
    } catch (error) {
      console.error("Error updating batch:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to update batch";
      toast.error(errorMessage);
    }
  };

  const resetFormData = () => {
    setFormData({
      batch_code: "",
      quantity: 0,
      expiration_date: "",
      date_received: new Date().toISOString().split("T")[0],
      is_active: true,
    });
  };

  const handleEdit = (batch) => {
    setSelectedBatch(batch);
    setFormData({
      batch_code: batch.batch_code,
      quantity: batch.quantity,
      expiration_date: batch.expiration_date,
      date_received: batch.date_received,
      is_active: batch.is_active,
    });
    setEditModalOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-lg p-6 w-3/4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Batches - {product.product_name}
          </h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowDepletedBatches(!showDepletedBatches)}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex items-center gap-2"
            >
              {showDepletedBatches ? (
                <>
                  <FaEyeSlash /> Hide Depleted
                </>
              ) : (
                <>
                  <FaEye /> Show Depleted
                </>
              )}
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 flex items-center gap-2"
            >
              <FaPlus /> Add New Batch
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by batch code, expiration date, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-200 table-auto">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-4 py-2 text-left">Batch Code</th>
                <th className="px-4 py-2 text-left">Date Received</th>
                <th className="px-4 py-2 text-left">Expiration Date</th>
                <th className="px-4 py-2 text-left">Quantity</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.length > 0 ? (
                filteredBatches.map((batch) => {
                  const isExpired =
                    new Date(batch.expiration_date) < new Date();
                  const isLowStock =
                    batch.quantity <= (product.low_stock_threshold || 10) &&
                    batch.quantity > 0;
                  const isOutOfStock = batch.quantity <= 0;

                  let status = {
                    label: "Active",
                    bg: "bg-green-100",
                    text: "text-green-800",
                  };

                  if (isExpired) {
                    status = {
                      label: "Expired",
                      bg: "bg-red-100",
                      text: "text-red-800",
                    };
                  } else if (!batch.is_active) {
                    status = {
                      label: "Inactive",
                      bg: "bg-gray-100",
                      text: "text-gray-800",
                    };
                  } else if (isOutOfStock) {
                    status = {
                      label: "Depleted",
                      bg: "bg-red-100",
                      text: "text-red-800",
                    };
                  } else if (isLowStock) {
                    status = {
                      label: "Low Stock",
                      bg: "bg-yellow-100",
                      text: "text-yellow-800",
                    };
                  }

                  return (
                    <tr
                      key={batch.id}
                      className={`border-t text-gray-700 hover:bg-gray-50 ${
                        isOutOfStock ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-4 py-2">{batch.batch_code}</td>
                      <td className="px-4 py-2">
                        {formatDate(batch.date_received)}
                      </td>
                      <td className="px-4 py-2">
                        {formatDate(batch.expiration_date)}
                      </td>
                      <td className="px-4 py-2">{batch.quantity}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(batch)}
                            disabled={isExpired}
                            className={`${
                              isExpired
                                ? "bg-gray-400 cursor-not-allowed opacity-50"
                                : "bg-blue-500 hover:bg-blue-600"
                            } text-white px-3 py-1 rounded-md flex items-center gap-1 relative group`}
                            title={
                              isExpired
                                ? "Cannot edit expired batch"
                                : "Edit batch"
                            }
                          >
                            <FaEdit /> Edit
                            {isExpired && (
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                Cannot edit expired batch
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-2 text-center text-gray-500"
                  >
                    {searchTerm
                      ? "No batches match your search."
                      : "No batches found for this product."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {/* Add Batch Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white shadow-lg rounded-lg p-6 w-1/3">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Add New Batch
              </h2>
              <form onSubmit={handleAddBatch}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={product.product_name}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Product ID
                  </label>
                  <input
                    type="text"
                    value={product.id}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    name="batch_code"
                    value={formData.batch_code}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    pattern="\d*"
                    title="Please enter only numbers"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Date Received
                  </label>
                  <input
                    type="date"
                    name="date_received"
                    value={formData.date_received}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    max={formData.expiration_date}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    min={formData.date_received}
                  />
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalOpen(false);
                      resetFormData();
                    }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-6 py-2 rounded-md font-medium hover:bg-green-600"
                  >
                    Add Batch
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Batch Modal */}
        {editModalOpen && selectedBatch && (
          <div className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm">
            <div className="bg-white shadow-lg rounded-lg p-6 w-1/3">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Edit Batch - {selectedBatch.batch_code}
              </h2>
              <form onSubmit={handleEditBatch}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={product.product_name}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Product ID
                  </label>
                  <input
                    type="text"
                    value={product.id}
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                    disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Batch Code
                  </label>
                  <input
                    type="text"
                    name="batch_code"
                    value={formData.batch_code}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    pattern="\d*"
                    title="Please enter only numbers"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    min="0"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Date Received
                  </label>
                  <input
                    type="date"
                    name="date_received"
                    value={formData.date_received}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    max={formData.expiration_date}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    min={formData.date_received}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="is_active"
                    value={formData.is_active}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </select>
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModalOpen(false);
                      setSelectedBatch(null);
                      resetFormData();
                    }}
                    className="bg-gray-500 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-600"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

InventoryModal.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    product_name: PropTypes.string.isRequired,
    low_stock_threshold: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  refreshBatches: PropTypes.func,
};

export default InventoryModal;
