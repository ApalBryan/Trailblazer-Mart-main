import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Products() {
  const [phones, setPhones] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

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

  // Matching categories to the Admin selection
  const categories = ["All", "Official University Merchandise", "Student Listings"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-black">Explore Collections</h1>

      <div className="flex flex-wrap gap-3 mb-10 border-b pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
              selectedCategory === cat
                ? "bg-black text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {phones.length === 0 ? (
        <p className="text-gray-500 italic">No products available yet.</p>
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