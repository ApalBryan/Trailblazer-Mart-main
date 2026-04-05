import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Products() {
  const [phones, setPhones] = useState([]);
  // 1. Add state for the selected category
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

  // 2. Define your list of categories
  const categories = ["All", "iPhone", "Samsung", "Google", "Accessories"];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {/* 3. Add the Category Buttons UI */}
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedCategory === cat
                ? "bg-black text-white border-black"
                : "bg-white text-gray-600 border-gray-300 hover:border-black"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {phones.length === 0 ? (
        <p className="text-gray-500">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* 4. Filter the phones BEFORE mapping them */}
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