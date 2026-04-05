import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"; // Import this for linking
import ProductCard from "../components/ProductCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Products() {
  const [phones, setPhones] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Get the category from the URL (e.g., ?category=iPhone)
  // If no category is in the URL, it defaults to "All"
  const selectedCategory = searchParams.get("category") || "All";

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPhones(productsArray);
    });
    return () => unsubscribe();
  }, []);

  const categories = ["All", "iPhone", "Samsung", "Google", "Accessories"];

  // 2. Function to update the URL when a button is clicked
  const handleCategoryClick = (cat) => {
    if (cat === "All") {
      setSearchParams({}); // Clears the URL back to /products
    } else {
      setSearchParams({ category: cat }); // Updates URL to /products?category=Name
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Explore Collections</h1>

      {/* --- CATEGORY SECTION --- */}
      <div className="flex flex-wrap gap-4 mb-10 border-b border-gray-100 pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`relative px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              selectedCategory === cat
                ? "bg-black text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-black"
            }`}
          >
            {cat}
            {selectedCategory === cat && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-black rounded-full"></span>
            )}
          </button>
        ))}
      </div>

      {phones.length === 0 ? (
        <p className="text-gray-500 italic text-center py-10">Fetching the latest tech...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {phones
            .filter((phone) => 
              selectedCategory === "All" || phone.category === selectedCategory
            )
            .map((phone) => (
              <ProductCard key={phone.id} phone={phone} />
            ))}
        </div>
      )}
    </div>
  );
}

export default Products;