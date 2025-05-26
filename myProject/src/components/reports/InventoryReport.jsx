import React from "react";
import PropTypes from "prop-types";

const InventoryReport = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Total Products
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {data.totalProducts}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Low Stock Items
          </h3>
          <p className="text-2xl font-bold text-yellow-600">
            {data.lowStockItems}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">
            {data.outOfStockItems}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Expiring Soon</h3>
          <p className="text-2xl font-bold text-orange-600">
            {data.expiringItems}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Stock Levels
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Current Stock</th>
                <th className="px-4 py-2 text-left">Threshold</th>
                <th className="px-4 py-2 text-left">Price</th>
                <th className="px-4 py-2 text-left">Total Value</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.stockLevels.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">{item.category}</td>
                  <td className="px-4 py-2">{item.current}</td>
                  <td className="px-4 py-2">{item.threshold}</td>
                  <td className="px-4 py-2">₱{item.price.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    ₱{(item.current * item.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-semibold ${
                        item.current <= item.threshold
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.current <= item.threshold
                        ? "Low Stock"
                        : "Adequate"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

InventoryReport.propTypes = {
  data: PropTypes.shape({
    totalProducts: PropTypes.number.isRequired,
    lowStockItems: PropTypes.number.isRequired,
    outOfStockItems: PropTypes.number.isRequired,
    expiringItems: PropTypes.number.isRequired,
    stockLevels: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        category: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        current: PropTypes.number.isRequired,
        threshold: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default InventoryReport;
