import React from "react";
import PropTypes from "prop-types";

const SalesReport = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Sales</h3>
          <p className="text-2xl font-bold text-blue-600">
            ₱{data.totalSales.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
          <p className="text-2xl font-bold text-green-600">
            {data.totalOrders}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Average Order Value
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            ₱{data.averageOrderValue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Top Selling Products
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Quantity Sold</th>
                <th className="px-4 py-2 text-left">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((product, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{product.name}</td>
                  <td className="px-4 py-2">{product.quantity}</td>
                  <td className="px-4 py-2">
                    ₱{product.revenue.toLocaleString()}
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

SalesReport.propTypes = {
  data: PropTypes.shape({
    totalSales: PropTypes.number.isRequired,
    totalOrders: PropTypes.number.isRequired,
    averageOrderValue: PropTypes.number.isRequired,
    topProducts: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        quantity: PropTypes.number.isRequired,
        revenue: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default SalesReport;
