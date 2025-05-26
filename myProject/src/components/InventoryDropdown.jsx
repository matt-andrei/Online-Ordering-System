import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaClipboardList } from "react-icons/fa";

export default function InventoryDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  return (
    <div>
      <button
        onClick={toggleDropdown}
        className="w-full p-2 rounded hover:bg-gray-200 flex items-center gap-x-2 text-gray-700"
      >
        <FaClipboardList />
        <span className="text-left">Inventory Management</span>
      </button>

      {isOpen && (
        <div className="ml-6 flex flex-col gap-y-1 mt-1">
          <Link
            to="/inventory"
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2 text-sm text-gray-700"
          >
            Inventory
          </Link>
          <Link
            to="/expired"
            className="p-2 rounded hover:bg-gray-200 flex items-center gap-x-2 text-sm text-gray-700"
          >
            Expired Products
          </Link>
        </div>
      )}
    </div>
  );
}
