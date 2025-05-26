import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import PropTypes from "prop-types";

const CheckoutModal = ({ isOpen, onClose, cartItems, onOrderComplete }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const { user } = useAuth();

  if (!isOpen) return null;

  // Check if any item requires prescription
  const requiresPrescription = cartItems.some(
    (item) => item.requires_prescription
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to place an order");
      return;
    }

    // Validate cart items
    const invalidItems = cartItems.filter(
      (item) => !item.batch_id || !item.quantity || !item.price
    );
    if (invalidItems.length > 0) {
      toast.error("Invalid cart items detected. Please try again.");
      return;
    }

    // Check for prescription requirements
    if (requiresPrescription && !prescriptionFile) {
      toast.error(
        "Please upload a prescription for prescription-required products"
      );
      return;
    }

    // Check for payment proof when using online payment
    if (paymentMethod === "ONLINE" && !paymentProof) {
      toast.error("Please upload proof of payment for online payment");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      const pickupDateTime = `${pickupDate}T${pickupTime}`;

      // Add order data
      const orderData = {
        order_items: cartItems.map((item) => ({
          batch_id: parseInt(item.batch_id),
          quantity: parseInt(item.quantity),
          price_at_time: parseFloat(item.price),
        })),
        payment_method: paymentMethod,
        delivery_method: "PICKUP",
        pickup_date: pickupDateTime,
        notes: notes || "",
      };

      formData.append("order_data", JSON.stringify(orderData));

      // Add prescription file if required
      if (requiresPrescription && prescriptionFile) {
        formData.append("prescription_file", prescriptionFile);
      }

      // Add payment proof if using online payment
      if (paymentMethod === "ONLINE" && paymentProof) {
        formData.append("payment_proof", paymentProof);
      }

      // Submit order with prescription
      await axios.post("http://127.0.0.1:8000/api/orders/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.accessToken}`,
        },
      });

      toast.success("Order placed successfully!");
      onOrderComplete();
      onClose();
    } catch (error) {
      let errorMessage = "Failed to place order. Please try again.";

      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === "object") {
          if (errorData.order_items) {
            errorMessage = Array.isArray(errorData.order_items)
              ? errorData.order_items.join(", ")
              : errorData.order_items;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      if (type === "prescription") {
        setPrescriptionFile(file);
      } else if (type === "payment") {
        setPaymentProof(file);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="Cash">Cash</option>
                <option value="ONLINE">Online Payment</option>
              </select>
            </div>

            {/* Payment Proof Upload */}
            {paymentMethod === "ONLINE" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Proof of Payment (Required)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "payment")}
                  className="w-full p-2 border rounded-lg"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Please upload a screenshot of your payment (max 5MB)
                </p>
              </div>
            )}

            {/* Pickup Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pickup Time
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  min="09:00"
                  max="17:00"
                  step="1800"
                  className="w-full p-2 border rounded-lg"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: 9:00 AM - 5:00 PM
                </p>
              </div>
            </div>

            {/* Prescription Upload */}
            {requiresPrescription && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prescription Upload (Required)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "prescription")}
                  className="w-full p-2 border rounded-lg"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Please upload a clear image of your prescription (max 5MB)
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows="3"
                placeholder="Any special instructions..."
              />
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t bg-gray-50">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

CheckoutModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  cartItems: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      product_name: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      quantity: PropTypes.number.isRequired,
      batch_id: PropTypes.number.isRequired,
      requires_prescription: PropTypes.bool,
    })
  ).isRequired,
  onOrderComplete: PropTypes.func.isRequired,
};

export default CheckoutModal;
