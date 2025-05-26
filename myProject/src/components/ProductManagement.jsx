import React, { useState, useEffect } from "react";
import axios from "axios";
import ProductModal from "./ProductModal";
import { toast } from "react-toastify";
import { FaEdit, FaPlus, FaSearch } from "react-icons/fa";

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    product_name: "",
    brand_name: "",
    category: "",
    price: "",
    description: "",
    requires_prescription: false,
    image: null,
  });

  // Fetch all products from backend
  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/products/");
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const resetFormData = () => {
    setFormData({
      product_name: "",
      brand_name: "",
      category: "",
      price: "",
      description: "",
      requires_prescription: false,
      image: null,
    });
  };

  // Handle input changes from form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  // Handle form submission (add or update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    for (const key in formData) {
      if (formData[key] !== null && formData[key] !== "") {
        formDataToSend.append(key, formData[key]);
      }
    }

    try {
      if (selectedProduct) {
        // Update existing product
        await axios.put(
          `http://127.0.0.1:8000/api/products/${selectedProduct.id}/`,
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        toast.success(`${selectedProduct.product_name} updated successfully.`);
      } else {
        // Add new product
        await axios.post(
          "http://127.0.0.1:8000/api/products/",
          formDataToSend,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        toast.success(`${formData.product_name} added successfully.`);
      }

      fetchProducts();
      resetFormData();
      setShowModal(false);
    } catch (error) {
      if (error.response && error.response.data) {
        const firstError = Object.values(error.response.data)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setFormData({
      id: product.id,
      product_name: product.product_name,
      brand_name: product.brand_name,
      category: product.category,
      price: product.price,
      description: product.description || "",
      requires_prescription: product.requires_prescription || false,
      image: null,
    });
    setShowModal(true);
  };

  return (
    <div className="p-6 flex-1">
      <div className="flex justify-between mb-6 items-center">
        <h1 className="text-3xl font-bold mb-4">Product Management</h1>
        <button
          onClick={() => {
            setSelectedProduct(null);
            resetFormData();
            setShowModal(true);
          }}
          className="bg-blue-700 text-white px-5 py-2.5 rounded-lg hover:bg-blue-800 flex items-center gap-2 shadow-md"
        >
          <FaPlus /> Add Product
        </button>
      </div>

      <div className="bg-white shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by product name, brand, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 pl-10"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <svg
                className="animate-spin h-8 w-8 text-blue-700"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              {searchTerm
                ? "No products match your search."
                : "No products found."}
            </div>
          ) : (
            <table className="w-full border-collapse rounded-lg">
              <thead>
                <tr className="bg-gray-200 text-gray-700">
                  <th className="py-3 px-4 text-left">Product Name</th>
                  <th className="py-3 px-4 text-left">Brand</th>
                  <th className="py-3 px-4 text-left">Category</th>
                  <th className="py-3 px-4 text-left">Price</th>
                  <th className="py-3 px-4 text-left">Stock Status</th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-t hover:bg-blue-50 transition-colors duration-150"
                  >
                    <td className="py-3 px-4">{product.product_name}</td>
                    <td className="py-3 px-4">{product.brand_name}</td>
                    <td className="py-3 px-4">{product.category}</td>
                    <td className="py-3 px-4">₱{product.price}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-md font-semibold ${
                          product.is_out_of_stock
                            ? "bg-red-100 text-red-700"
                            : product.is_low_stock
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.is_out_of_stock
                          ? "Out of Stock"
                          : product.is_low_stock
                          ? "Low Stock"
                          : "In Stock"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 flex items-center gap-1 shadow-sm"
                        title="Edit Product"
                      >
                        <FaEdit /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <ProductModal
          showModal={showModal}
          setShowModal={setShowModal}
          formData={formData}
          handleInputChange={handleInputChange}
          handleImageChange={handleImageChange}
          handleFormSubmit={handleFormSubmit}
          resetFormData={resetFormData}
        />
      )}
    </div>
  );
}
