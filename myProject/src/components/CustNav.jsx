import { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext"; // Removed unused import
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Home, Menu, User, X } from "lucide-react";
import PropTypes from "prop-types";
import ProfileModal from "./ProfileModal";
import axios from "axios";
import { toast } from "react-toastify";
import image from "../assets/la-plaza.png";

const CustNav = ({
  onSearch,
  cartItemsCount,
  onCartClick,
  onCategorySelect,
}) => {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/categories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategoryModalOpen(false);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 left-0 w-full bg-white z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-2 min-w-fit">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200">
                <img
                  src={image}
                  alt="La-Plaza Pharmacy Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-lg font-bold text-gray-800 whitespace-nowrap">
                La Plaza Pharmacy
              </span>
            </div>

            {/* Search Bar (flex-grow) */}
            <div className="flex-1 flex justify-center">
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search Product..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </div>
            </div>

            {/* User and Cart Icons */}
            <div className="flex items-center gap-2 min-w-fit">
              {/* Profile Button */}
              <button
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                onClick={() => setProfileOpen(true)}
                aria-label="Profile"
              >
                <User className="w-7 h-7 text-gray-600" />
              </button>
              {/* Cart Button */}
              <button
                className="p-2 relative rounded-full hover:bg-gray-100 transition-colors duration-200"
                onClick={onCartClick}
                aria-label="Cart"
              >
                <ShoppingCart className="h-6 w-6 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-semibold">
                  {cartItemsCount || 0}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center h-16">
            <button
              className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                currentSection === "home" ? "text-blue-600" : "text-gray-600"
              }`}
              onClick={() => {
                setCurrentSection("home");
                navigate("/");
              }}
              aria-label="Home"
            >
              <Home className="h-6 w-6" />
              <span className="text-xs font-medium">Home</span>
            </button>
            <button
              className={`flex flex-col items-center gap-1 transition-colors duration-200 ${
                currentSection === "categories"
                  ? "text-blue-600"
                  : "text-gray-600"
              }`}
              onClick={() => {
                setCurrentSection("categories");
                setCategoryModalOpen(true);
              }}
              aria-label="Categories"
            >
              <Menu className="h-6 w-6" />
              <span className="text-xs font-medium">Categories</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer for bottom nav */}
      <div className="h-16"></div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setProfileOpen(false)}
      />

      {/* Categories Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Categories</h2>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {loading ? (
              <div className="text-center py-4">Loading categories...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCategorySelect("All")}
                  className={`p-3 rounded-lg text-left transition-colors ${
                    selectedCategory === "All"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  All Products
                </button>
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleCategorySelect(category.value)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.value
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

CustNav.propTypes = {
  onSearch: PropTypes.func,
  cartItemsCount: PropTypes.number,
  onCartClick: PropTypes.func.isRequired,
  onCategorySelect: PropTypes.func,
};

export default CustNav;
