import PropTypes from "prop-types";

export default function ProductModal({
  showModal,
  setShowModal,
  formData,
  handleInputChange,
  handleImageChange,
  handleFormSubmit,
  resetFormData,
}) {
  const defaultImageUrl = "https://placehold.co/400x400?text=No+Image";

  const handleClose = () => {
    setShowModal(false);
    resetFormData();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white shadow-[-10px_-10px_30px_4px_rgba(0,0,0,0.1),_10px_10px_30px_4px_rgba(45,78,255,0.15)] rounded-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">
          {formData.id ? "Edit Product" : "Add Product"}
        </h2>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Flex container for form fields */}
          <div className="grid grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-gray-600 text-sm font-medium">
                Product Name
              </label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-gray-600 text-sm font-medium">
                Brand Name
              </label>
              <input
                type="text"
                name="brand_name"
                value={formData.brand_name}
                onChange={handleInputChange}
                placeholder="Enter brand name"
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-gray-600 text-sm font-medium">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                <option value="Liquid">Liquid</option>
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Topical">Topical</option>
                <option value="Suppositories">Suppositories</option>
                <option value="Drops">Drops</option>
                <option value="Injection">Injection</option>
                <option value="Inhaler">Inhaler</option>
                <option value="Others">Others</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-gray-600 text-sm font-medium">
                Price (₱)
              </label>
              <input
                type="number"
                name="price"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Enter price"
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-gray-600 text-sm font-medium">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                placeholder="Enter product description"
                className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                rows="3"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="col-span-2">
            <label className="block text-gray-600 text-sm font-medium">
              Product Image
            </label>
            <div className="flex items-center gap-4">
              <img
                src={
                  formData.image
                    ? URL.createObjectURL(formData.image)
                    : defaultImageUrl
                }
                alt="Product"
                className="w-32 h-32 object-cover rounded-md mx-auto"
              />
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-gray-700 bg-blue-500 hover:bg-blue-600 text-white rounded-md py-2"
              />
            </div>
          </div>

          {/* Requires Prescription Checkbox */}
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              name="requires_prescription"
              checked={formData.requires_prescription}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />

            <label className="text-gray-700 text-sm font-medium">
              Requires Prescription
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-center space-x-4 mt-4">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-600 transition"
            >
              {formData.id ? "Update" : "Add"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="bg-gray-500 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-600 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ProductModal.propTypes = {
  showModal: PropTypes.bool.isRequired,
  setShowModal: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    id: PropTypes.number,
    product_name: PropTypes.string.isRequired,
    brand_name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    description: PropTypes.string,
    requires_prescription: PropTypes.bool.isRequired,
    image: PropTypes.object,
  }).isRequired,
  handleInputChange: PropTypes.func.isRequired,
  handleImageChange: PropTypes.func.isRequired,
  handleFormSubmit: PropTypes.func.isRequired,
  resetFormData: PropTypes.func.isRequired,
};
