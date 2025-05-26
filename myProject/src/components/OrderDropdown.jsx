import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaPrescriptionBottleAlt } from "react-icons/fa";

export default function OrderDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div>
      <button
        onClick={toggleDropdown}
        className="w-full p-2 rounded hover:bg-gray-200 flex items-center gap-x-2 text-gray-700"
      >
        <FaPrescriptionBottleAlt />
        <span className="text-left">Order Management</span>
      </button>

      {isOpen && (
        <div className="ml-6 flex flex-col gap-y-1 mt-1">
          <Link
            to="/orders"
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2 text-sm text-gray-700"
          >
            Orders
          </Link>
          <Link
            to="/prescription-verification"
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2 text-sm text-gray-700"
          >
            Prescription Verification
          </Link>
        </div>
      )}
    </div>
  );
}
