import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaTrash } from "react-icons/fa";

function ExpiredProducts() {
  const [expiredBatches, setExpiredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchExpiredBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("http://127.0.0.1:8000/api/batches/");

      // Get all batches and fetch their product details
      const batches = response.data;
      const expired = batches.filter((batch) => {
        const expirationDate = new Date(batch.expiration_date);
        const today = new Date();
        return expirationDate < today && batch.is_active;
      });

      // Fetch product details for each batch
      const batchesWithProducts = await Promise.all(
        expired.map(async (batch) => {
          try {
            const productResponse = await axios.get(
              `http://127.0.0.1:8000/api/products/${batch.product}/`
            );
            return {
              ...batch,
              product: productResponse.data,
            };
          } catch (error) {
            console.error(
              `Error fetching product details for batch ${batch.id}:`,
              error
            );
            return batch;
          }
        })
      );

      setExpiredBatches(batchesWithProducts);
    } catch (error) {
      console.error("Error fetching expired batches:", error);
      setError("Failed to fetch expired products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiredBatches();
  }, []);

  const handleDelete = async (batchId) => {
    if (window.confirm("Are you sure you want to delete this expired batch?")) {
      try {
        await axios.delete(`http://127.0.0.1:8000/api/batches/${batchId}/`);
        toast.success("Batch deleted successfully");
        fetchExpiredBatches();
      } catch (error) {
        console.error("Error deleting batch:", error);
        toast.error(error.response?.data?.detail || "Failed to delete batch");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 flex-1">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold mb-4">Expired Products</h1>
      </div>

      <div className="bg-white shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Expired Batches</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">Batch Code</th>
                <th className="py-3 px-4 text-left">Product Name</th>
                <th className="py-3 px-4 text-left">Brand</th>
                <th className="py-3 px-4 text-left">Expiration Date</th>
                <th className="py-3 px-4 text-left">Quantity</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expiredBatches.length > 0 ? (
                expiredBatches.map((batch) => (
                  <tr key={batch.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{batch.batch_code}</td>
                    <td className="py-3 px-4">
                      {batch.product?.product_name || "Unknown Product"}
                      {batch.product?.requires_prescription && (
                        <span className="ml-2 text-xs text-purple-600">
                          (RX)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {batch.product?.brand_name || "Unknown Brand"}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(batch.expiration_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">{batch.quantity}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                        Expired
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleDelete(batch.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 flex items-center gap-1"
                        title="Delete Batch"
                      >
                        <FaTrash /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="py-3 px-4 text-center text-gray-500"
                  >
                    No expired products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ExpiredProducts;
