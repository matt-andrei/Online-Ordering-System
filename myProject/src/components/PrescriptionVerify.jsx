import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CheckCircle, XCircle, FileText, Search } from "lucide-react";

const PrescriptionVerify = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Pending");

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:8000/api/prescriptions/"
      );
      setPrescriptions(response.data);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status) => {
    if (!selectedPrescription) return;

    try {
      await axios.post(
        `http://localhost:8000/api/prescriptions/${selectedPrescription.id}/verify/`,
        {
          status: status,
          verification_notes: verificationNote,
        }
      );

      // Update the list
      setPrescriptions(
        prescriptions.map((p) =>
          p.id === selectedPrescription.id
            ? { ...p, status: status, verification_notes: verificationNote }
            : p
        )
      );
      toast.success(`Prescription ${status.toLowerCase()}`);
      setSelectedPrescription(null);
      setVerificationNote("");
    } catch (error) {
      console.error("Error verifying prescription:", error);
      toast.error("Failed to verify prescription");
    }
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.customer_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.product_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || prescription.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 flex-1">
      <h1 className="text-3xl font-bold mb-6">Prescription Verification</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Prescriptions List */}
        <div className="md:w-2/3 bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between mb-4 relative z-0">
            <div className="relative flex-1 mr-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search prescriptions..."
                className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 w-full bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="text-center py-10">
              <FileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No prescriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPrescriptions.map((prescription) => (
                    <tr key={prescription.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {prescription.customer_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {prescription.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {prescription.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(
                          prescription.uploaded_at
                        ).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            prescription.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : prescription.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {prescription.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPrescription(prescription)}
                          className="text-teal-600 hover:text-teal-900 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Prescription Details */}
        <div className="md:w-1/3 bg-white rounded-lg shadow-lg p-6">
          {selectedPrescription ? (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Prescription Details
              </h2>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-1">Status</p>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    selectedPrescription.status === "Approved"
                      ? "bg-green-100 text-green-800"
                      : selectedPrescription.status === "Rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {selectedPrescription.status}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-1">Customer</p>
                <p className="font-medium">
                  {selectedPrescription.customer_name}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-1">Product</p>
                <p className="font-medium">
                  {selectedPrescription.product_name}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-1">Quantity</p>
                <p className="font-medium">{selectedPrescription.quantity}</p>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-1">Date Uploaded</p>
                <p className="font-medium">
                  {new Date(selectedPrescription.uploaded_at).toLocaleString()}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 text-sm mb-1">Prescription Image</p>
                <div className="mt-2 border rounded-lg p-2">
                  <a
                    href={selectedPrescription.prescription_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-800 flex items-center gap-2"
                  >
                    <FileText size={18} />
                    View Prescription
                  </a>
                </div>
              </div>

              {selectedPrescription.status === "Pending" ? (
                <>
                  <div className="mb-6">
                    <label
                      htmlFor="verificationNote"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Verification Note
                    </label>
                    <textarea
                      id="verificationNote"
                      rows="3"
                      className="w-full border rounded-md p-2 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Enter any notes about the prescription..."
                      value={verificationNote}
                      onChange={(e) => setVerificationNote(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleVerify("Approved")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify("Rejected")}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
                    >
                      <XCircle size={20} />
                      Reject
                    </button>
                  </div>
                </>
              ) : (
                <div className="mb-6">
                  <p className="text-gray-600 text-sm mb-1">
                    Verification Notes
                  </p>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-800">
                      {selectedPrescription.verification_notes ||
                        "No notes provided"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
              <FileText size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500">
                Select a prescription to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionVerify;
