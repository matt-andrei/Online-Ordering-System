import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import PropTypes from "prop-types";
import ProductDetailModal from "./ProductDetailModal";

const ProductCard = ({ product, onAddToCart, cartItems }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

    // Check current quantity in cart
    const currentCartItem = cartItems.find((item) => item.id === product.id);
    const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;

    setLoading(true);
    try {
      // Get active batches
      const response = await axios.get(
        `http://127.0.0.1:8000/api/product/${product.id}/batches/active/`
      );

      const batches = response.data;
      if (!batches || batches.length === 0) {
        toast.error("No active batches available for this product");
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
        toast.error("This product is out of stock");
        return;
      }

      // Check if adding one more would exceed batch quantity
      if (currentQuantity + 1 > availableBatch.quantity) {
        // Try to get the next available batch
        const nextBatch = batches.find(
          (batch) =>
            batch.id !== availableBatch.id &&
            batch.quantity >= currentQuantity + 1
        );

        if (nextBatch) {
          // Add product to cart with next batch information
          onAddToCart({
            id: product.id,
            product_name: product.product_name,
            price: product.price,
            quantity: 1,
            batch_id: nextBatch.id,
            image: product.image,
            requires_prescription: product.requires_prescription,
          });
        } else {
          toast.error(
            `Only ${availableBatch.quantity} items available in this batch`
          );
          return;
        }
      } else {
        // Add product to cart with current batch information
        onAddToCart({
          id: product.id,
          product_name: product.product_name,
          price: product.price,
          quantity: 1,
          batch_id: availableBatch.id,
          image: product.image,
          requires_prescription: product.requires_prescription,
        });
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.response?.status === 404) {
        toast.error("No active batches available for this product");
      } else {
        toast.error("Failed to add product to cart");
      }
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color and text
  const getStatusBadge = () => {
    if (!product.is_available) {
      return {
        text: "Out of Stock",
        color: "bg-red-100 text-red-700",
      };
    }
    if (product.is_low_stock) {
      return {
        text: "Low Stock",
        color: "bg-yellow-100 text-yellow-700",
      };
    }
    return {
      text: "In Stock",
      color: "bg-green-100 text-green-700",
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      <div
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="aspect-square mb-4 relative">
          <img
            src={product.image || "/placeholder.png"}
            alt={product.product_name}
            className="w-full h-full object-contain"
          />
        </div>

        <h3 className="text-lg font-semibold mb-1 line-clamp-2">
          {product.product_name}
        </h3>
        <p className="text-gray-600 mb-2 text-sm">{product.category}</p>

        <div className="flex flex-wrap gap-2 mb-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.color}`}
          >
            {statusBadge.text}
          </span>
          {product.requires_prescription && (
            <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
              Requires Prescription
            </span>
          )}
        </div>

        <p className="text-blue-600 font-bold mb-4">₱{product.price}</p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart();
          }}
          disabled={loading || !product.is_available}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="inline-block mr-2" />
          {loading
            ? "Adding..."
            : !product.is_available
            ? "Out of Stock"
            : "Add to Cart"}
        </button>
      </div>

      <ProductDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
        onAddToCart={onAddToCart}
        cartItems={cartItems}
      />
    </>
  );
};

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.number.isRequired,
    product_name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    requires_prescription: PropTypes.bool,
    is_available: PropTypes.bool,
    is_low_stock: PropTypes.bool,
    category: PropTypes.string.isRequired,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default ProductCard;
