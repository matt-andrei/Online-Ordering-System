import { useState, useEffect } from "react";
import { X, ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";

const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  onAddToCart,
  cartItems,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [batchInfo, setBatchInfo] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && product) {
      fetchBatchInfo();
    }
  }, [isOpen, product]);

  const fetchBatchInfo = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/product/${product.id}/batches/active/`
      );
      const batches = response.data;

      if (!batches || batches.length === 0) {
        setBatchInfo(null);
        return;
      }

      // Find the first batch with quantity > 0
      const availableBatch = batches.find((batch) => batch.quantity > 0);
      if (!availableBatch) {
        // If no batch has quantity, set all batches as inactive
        await Promise.all(
          batches.map((batch) =>
            axios.put(
              `http://127.0.0.1:8000/api/product/${product.id}/batches/${batch.id}/update/`,
              { is_active: false }
            )
          )
        );
        setBatchInfo(null);
        return;
      }

      setBatchInfo(availableBatch);
    } catch (error) {
      console.error("Error fetching batch info:", error);
      toast.error("Failed to load product details");
      setBatchInfo(null);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }

    // Check if trying to add a different prescription product when another one exists in cart
    if (product.requires_prescription) {
      const hasDifferentPrescriptionProduct = cartItems.some(
        (item) => item.requires_prescription && item.id !== product.id
      );
      if (hasDifferentPrescriptionProduct) {
        toast.error(
          "You can only have one type of prescription product in your cart at a time"
        );
        return;
      }
    }

    if (!batchInfo) {
      toast.error("No active batch available for this product");
      return;
    }

    // Check current quantity in cart
    const currentCartItem = cartItems.find((item) => item.id === product.id);
    const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;

    if (currentQuantity + quantity > batchInfo.quantity) {
      // Try to get the next available batch
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/product/${product.id}/batches/active/`
        );
        const batches = response.data;

        // Find the next batch with sufficient quantity
        const nextBatch = batches.find(
          (batch) =>
            batch.id !== batchInfo.id &&
            batch.quantity >= currentQuantity + quantity
        );

        if (nextBatch) {
          setBatchInfo(nextBatch);
          toast.info("Switched to next available batch");
        } else {
          toast.error(
            `Only ${batchInfo.quantity} items available in this batch`
          );
          return;
        }
      } catch (error) {
        toast.error("Selected quantity exceeds available stock");
        return;
      }
    }

    setLoading(true);
    try {
      onAddToCart({
        id: product.id,
        product_name: product.product_name,
        price: product.price,
        quantity: quantity,
        batch_id: batchInfo.id,
        image: product.image,
        requires_prescription: product.requires_prescription,
      });

      onClose();
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add product to cart");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-lg w-full max-w-2xl p-0 max-h-[90vh] overflow-y-auto shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center px-8 pt-6 pb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {product.product_name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {/* Main Content */}
        <div className="flex flex-col md:flex-row gap-8 px-8 py-6 items-center md:items-start">
          {/* Left: Product Image */}
          <div className="flex-shrink-0 flex items-center justify-center w-full md:w-64 h-full">
            <img
              src={product.image || "/placeholder.png"}
              alt={product.product_name}
              className="w-56 h-40 object-contain rounded-lg"
            />
          </div>
          {/* Right: Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-2 text-left">
              <div className="flex gap-8">
                <div>
                  <span className="block text-xs text-gray-500">Brand</span>
                  <span className="block font-medium text-gray-800">
                    {product.brand_name}
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-gray-500">Category</span>
                  <span className="block font-medium text-gray-800">
                    {product.category}
                  </span>
                </div>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Price</span>
                <span className="block text-lg font-bold text-blue-600">
                  ₱{product.price}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">
                  Stock Status
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${
                    !product.is_available
                      ? "bg-red-100 text-red-700"
                      : product.is_low_stock
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {!product.is_available
                    ? "Out of Stock"
                    : product.is_low_stock
                    ? "Low Stock"
                    : "In Stock"}
                </span>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Description</span>
                <span className="block text-gray-700 text-sm">
                  {product.description}
                </span>
              </div>
              {batchInfo && (
                <>
                  <div>
                    <span className="block text-xs text-gray-500">
                      Current Batch Details
                    </span>
                    <span className="block text-gray-700 text-sm">
                      Expiration Date:{" "}
                      {new Date(batchInfo.expiration_date).toLocaleDateString()}
                    </span>
                    <span className="block text-gray-700 text-sm">
                      Quantity: {batchInfo.quantity}
                    </span>
                  </div>
                </>
              )}
              {/* Prescription Warning */}
              {product.requires_prescription && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                  <p className="text-yellow-700 text-sm">
                    This product requires a prescription. You will need to
                    upload your prescription before checkout.
                  </p>
                </div>
              )}
            </div>
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={loading || !batchInfo || batchInfo.quantity === 0}
              className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
            >
              <ShoppingCart className="inline-block mr-2" />
              {loading
                ? "Adding..."
                : !batchInfo || batchInfo.quantity === 0
                ? "Out of Stock"
                : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ProductDetailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    product_name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    requires_prescription: PropTypes.bool,
    brand_name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    is_available: PropTypes.bool,
    is_low_stock: PropTypes.bool,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default ProductDetailModal;
