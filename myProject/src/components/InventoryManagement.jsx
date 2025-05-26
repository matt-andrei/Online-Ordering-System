import React, { useEffect, useState } from "react";
import axios from "axios";
import InventoryModal from "./InventoryModal";
import { toast } from "react-toastify";

function InventoryManagement() {
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [productStats, setProductStats] = useState({});
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBatches = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/batches/");
      setBatches(response.data);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to fetch batches. Please try again.");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/products/");
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Please try again.");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchBatches(), fetchProducts()]);
      } catch (error) {
        setError("Failed to load inventory data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const stats = {};
    products.forEach((product) => {
      const id = product.id;
      const productBatches = batches.filter((batch) => batch.product === id);

      // Calculate stock metrics
      const totalStockIn = productBatches.reduce(
        (sum, batch) => sum + (batch.quantity || 0),
        0
      );
      const totalExpired = productBatches.reduce((sum, batch) => {
        if (batch.is_expired && batch.is_active) {
          return sum + batch.quantity;
        }
        return sum;
      }, 0);

      // Calculate available stock (excluding expired items)
      const available = productBatches.reduce((sum, batch) => {
        if (!batch.is_expired && batch.is_active) {
          return sum + batch.quantity;
        }
        return sum;
      }, 0);

      // Calculate low stock threshold
      const lowStockThreshold = product.low_stock_threshold || 10;
      const isLowStock = available <= lowStockThreshold && available > 0;
      const isOutOfStock = available <= 0;

      stats[id] = {
        productId: id,
        productName: product.product_name,
        brandName: product.brand_name,
        category: product.category,
        totalStockIn,
        totalExpired,
        available,
        isLowStock,
        isOutOfStock,
        requiresPrescription: product.requires_prescription,
        batches: productBatches,
        lowStockThreshold,
      };
    });

    setProductStats(stats);
  }, [batches, products]);

  const getStockStatus = (stats) => {
    if (!stats.batches || stats.batches.length === 0) {
      return {
        label: "No Batch",
        bg: "bg-gray-100",
        text: "text-gray-800",
      };
    }

    if (stats.totalExpired > 0) {
      return {
        label: "Has Expired Items",
        bg: "bg-red-100",
        text: "text-red-800",
      };
    } else if (stats.isOutOfStock) {
      return {
        label: "Out of Stock",
        bg: "bg-red-100",
        text: "text-red-800",
      };
    } else if (stats.isLowStock) {
      return {
        label: "Low Stock",
        bg: "bg-yellow-100",
        text: "text-yellow-800",
      };
    }
    return {
      label: "In Stock",
      bg: "bg-green-100",
      text: "text-green-800",
    };
  };

  const filteredProducts = products.filter((product) => {
    const stats = productStats[product.id] || {};
    const searchLower = searchTerm.toLowerCase();
    return (
      product.product_name.toLowerCase().includes(searchLower) ||
      product.brand_name.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      String(product.id).includes(searchLower)
    );
  });

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
        <h1 className="text-3xl font-bold mb-4">Inventory Management</h1>
      </div>

      <div className="bg-white shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by product name, brand, category, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">ID</th>
                <th className="py-3 px-4 text-left">Product Name</th>
                <th className="py-3 px-4 text-left">Brand</th>
                <th className="py-3 px-4 text-left">Category</th>
                <th className="py-3 px-4 text-left">Total Stock</th>
                <th className="py-3 px-4 text-left">Expired</th>
                <th className="py-3 px-4 text-left">Available</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((prod) => {
                const stats = productStats[prod.id] || {
                  totalStockIn: 0,
                  totalExpired: 0,
                  available: 0,
                  productName: prod.product_name,
                  brandName: prod.brand_name,
                  category: prod.category,
                  isLowStock: false,
                  isOutOfStock: true,
                };

                const stockStatus = getStockStatus(stats);

                return (
                  <tr key={prod.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{prod.id}</td>
                    <td className="py-3 px-4">
                      {stats.productName}
                      {prod.requires_prescription && (
                        <span className="ml-2 text-xs text-purple-600">
                          (RX)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{stats.brandName}</td>
                    <td className="py-3 px-4">{stats.category}</td>
                    <td className="py-3 px-4">{stats.totalStockIn}</td>
                    <td className="py-3 px-4">{stats.totalExpired}</td>
                    <td className="py-3 px-4">{stats.available}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-semibold ${stockStatus.bg} ${stockStatus.text}`}
                      >
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedProduct(prod)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                      >
                        View Batches
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedProduct && (
        <InventoryModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          refreshBatches={() => {
            fetchBatches();
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}

export default InventoryManagement;
