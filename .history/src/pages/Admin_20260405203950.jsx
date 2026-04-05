import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function Admin() {
  const [product, setProduct] = useState({
    brand: "",
    size: "",
    price: "",
    image: "",
    category: "Official University Merchandise", // Default category
    stock: 1,
    inStock: true
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure numerical values are stored as numbers for stats/filters
      await addDoc(collection(db, "products"), {
        ...product,
        price: Number(product.price),
        stock: Number(product.stock)
      });
      
      alert("Product added successfully!");
      
      // Clear form
      setProduct({ 
        brand: "", size: "", price: "", image: "", 
        category: "Official University Merchandise", 
        stock: 1, inStock: true 
      });
    } catch (error) {
      console.error("Error adding product: ", error);
      alert("Failed to add product.");
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-2">Add New Product</h2>
        
        <input
          type="text"
          placeholder="Brand/Name"
          value={product.brand}
          onChange={(e) => setProduct({ ...product, brand: e.target.value })}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
        
        <input
          type="text"
          placeholder="Size (e.g., Medium, 11 oz)"
          value={product.size}
          onChange={(e) => setProduct({ ...product, size: e.target.value })}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />

        {/* --- CATEGORY SELECTOR --- */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-bold uppercase ml-1">Product Category</label>
          <select
            value={product.category}
            onChange={(e) => setProduct({ ...product, category: e.target.value })}
            className="border p-2 rounded bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Official University Merchandise">Official University Merchandise</option>
            <option value="Student Listings">Student Listings</option>
          </select>
        </div>

        <input
          type="number"
          placeholder="Price (₱)"
          value={product.price}
          onChange={(e) => setProduct({ ...product, price: e.target.value })}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />
        
        <input
          type="text"
          placeholder="Image URL"
          value={product.image}
          onChange={(e) => setProduct({ ...product, image: e.target.value })}
          className="border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
          required
        />

        <button 
          type="submit" 
          className="bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition-colors shadow-sm"
        >
          Add Product
        </button>
      </form>
    </div>
  );
}

export default Admin;