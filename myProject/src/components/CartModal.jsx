import React from "react";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import axios from "axios";

const CartModal = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateCart,
  onRemoveItem,
  onCheckout,
}) => {
  if (!isOpen) return null;

  const calculateTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      // Get the current item
      const item = cartItems.find((item) => item.id === itemId);
      if (!item || !item.batch_id) return;

      // Check batch quantity
      const response = await axios.get(
        `http://127.0.0.1:8000/api/product/${itemId}/batches/active/`
      );
      const batches = response.data;
      const currentBatch = batches.find((batch) => batch.id === item.batch_id);

      if (!currentBatch) {
        toast.error("Batch no longer available");
        onRemoveItem(itemId);
        return;
      }

      if (newQuantity > currentBatch.quantity) {
        toast.error(
          `Only ${currentBatch.quantity} items available in this batch`
        );
        return;
      }

      onUpdateCart(itemId, newQuantity);
    } catch (error) {
      console.error("Error checking batch quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  const handleRemoveItem = (itemId) => {
    onRemoveItem(itemId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto mb-4">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500">Your cart is empty</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.product_name}
                    className="w-16 h-16 object-contain"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.product_name}</h3>
                    <p className="text-blue-600">₱{item.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-medium">Total:</span>
            <span className="text-xl font-bold text-blue-600">
              ₱{calculateTotal()}
            </span>
          </div>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Continue Shopping
            </button>
            <button
              onClick={onCheckout}
              disabled={cartItems.length === 0}
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

CartModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      product_name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
      image: PropTypes.string,
      batch_id: PropTypes.number,
    })
  ).isRequired,
  onUpdateCart: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
};

export default CartModal;
