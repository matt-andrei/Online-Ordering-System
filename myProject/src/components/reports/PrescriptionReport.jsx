import React from "react";
import PropTypes from "prop-types";

const PrescriptionReport = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Total Prescriptions
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {data.totalPrescriptions}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">
            Pending Verification
          </h3>
          <p className="text-2xl font-bold text-yellow-600">
            {data.pendingVerifications}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Verified</h3>
          <p className="text-2xl font-bold text-green-600">
            {data.verifiedPrescriptions}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Rejected</h3>
          <p className="text-2xl font-bold text-red-600">
            {data.rejectedPrescriptions}
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Prescription Trends
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Number of Prescriptions</th>
              </tr>
            </thead>
            <tbody>
              {data.prescriptionTrends.map((trend, index) => (
                <tr key={index} className="border-t">
                  <td className="px-4 py-2">{trend.date}</td>
                  <td className="px-4 py-2">{trend.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

PrescriptionReport.propTypes = {
  data: PropTypes.shape({
    totalPrescriptions: PropTypes.number.isRequired,
    pendingVerifications: PropTypes.number.isRequired,
    verifiedPrescriptions: PropTypes.number.isRequired,
    rejectedPrescriptions: PropTypes.number.isRequired,
    prescriptionTrends: PropTypes.arrayOf(
      PropTypes.shape({
        date: PropTypes.string.isRequired,
        count: PropTypes.number.isRequired,
      })
    ).isRequired,
  }).isRequired,
};

export default PrescriptionReport;
