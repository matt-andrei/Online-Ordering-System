import { useState, useEffect } from "react";
import axios from "axios";
import { FaSpinner, FaDownload, FaCalendarAlt } from "react-icons/fa";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import SalesReport from "./reports/SalesReport";
import InventoryReport from "./reports/InventoryReport";
import PrescriptionReport from "./reports/PrescriptionReport";
import { toast } from "react-toastify";

const ReportsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    endDate: new Date(),
    key: "selection",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reportType, setReportType] = useState("sales");
  const [reportData, setReportData] = useState({
    sales: {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      salesByDate: [],
      topProducts: [],
    },
    inventory: {
      totalProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiringItems: 0,
      stockLevels: [],
    },
    prescriptions: {
      totalPrescriptions: 0,
      pendingVerifications: 0,
      verifiedPrescriptions: 0,
      rejectedPrescriptions: 0,
      prescriptionTrends: [],
    },
  });

  useEffect(() => {
    if (dateRange?.startDate && dateRange?.endDate) {
      fetchReportData();
    }
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;

    setLoading(true);
    try {
      const startDate = dateRange.startDate.toISOString().split("T")[0];
      const endDate = dateRange.endDate.toISOString().split("T")[0];

      const response = await axios.get(
        `http://127.0.0.1:8000/api/reports/${reportType}/`,
        {
          params: {
            start_date: startDate,
            end_date: endDate,
          },
        }
      );

      setReportData((prev) => ({
        ...prev,
        [reportType]: response.data,
      }));
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to fetch report data");
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!dateRange?.startDate || !dateRange?.endDate) return;

    try {
      const startDate = dateRange.startDate.toISOString().split("T")[0];
      const endDate = dateRange.endDate.toISOString().split("T")[0];

      const response = await axios.post(
        `http://127.0.0.1:8000/api/reports/${reportType}/`,
        {
          start_date: startDate,
          end_date: endDate,
        },
        {
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${reportType}_report_${startDate}_to_${endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Report exported successfully");
    } catch (err) {
      console.error("Failed to export report:", err);
      toast.error("Failed to export report");
    }
  };

  const handleDateRangeChange = (ranges) => {
    setDateRange(ranges.selection);
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6 flex-1">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports Management</h1>
        <div className="flex gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="bg-white px-4 py-2 rounded-md shadow flex items-center gap-2 hover:bg-gray-50"
            >
              <FaCalendarAlt />
              {dateRange?.startDate?.toLocaleDateString()} -{" "}
              {dateRange?.endDate?.toLocaleDateString()}
            </button>
            {showDatePicker && (
              <div className="absolute right-0 mt-2 z-10 bg-white shadow-lg rounded-lg">
                <DateRangePicker
                  ranges={[dateRange]}
                  onChange={handleDateRangeChange}
                  months={1}
                  direction="horizontal"
                  showDateDisplay={false}
                  showMonthAndYearPickers={true}
                  rangeColors={["#3B82F6"]}
                />
              </div>
            )}
          </div>
          <button
            onClick={handleExport}
            className="bg-blue-500 text-white px-4 py-2 rounded-md shadow flex items-center gap-2 hover:bg-blue-600"
          >
            <FaDownload /> Export Report
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setReportType("sales")}
            className={`px-4 py-2 rounded-md ${
              reportType === "sales"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Sales Report
          </button>
          <button
            onClick={() => setReportType("inventory")}
            className={`px-4 py-2 rounded-md ${
              reportType === "inventory"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Inventory Report
          </button>
          <button
            onClick={() => setReportType("prescriptions")}
            className={`px-4 py-2 rounded-md ${
              reportType === "prescriptions"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Prescription Report
          </button>
        </div>
      </div>

      <div className="bg-white shadow-[0_3px_10px_rgb(0,0,0,0.2)] rounded-lg p-6">
        {reportType === "sales" && <SalesReport data={reportData.sales} />}
        {reportType === "inventory" && (
          <InventoryReport data={reportData.inventory} />
        )}
        {reportType === "prescriptions" && (
          <PrescriptionReport data={reportData.prescriptions} />
        )}
      </div>
    </div>
  );
};

export default ReportsManagement;
