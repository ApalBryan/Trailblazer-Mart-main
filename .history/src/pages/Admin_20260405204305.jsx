import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

function Admin() {
  const [product, setProduct] = useState({
    brand: "",
    size: "",
    price: "",
    image: "",
    category: "Official University Merchandise", // Added category to state
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "products"), {
        ...product,
        price: Number(product.price),
        stock: 1,
        inStock: true
      });
      alert("Product added successfully!");
      setProduct({ brand: "", size: "", price: "", image: "", category: "Official University Merchandise" });
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md flex flex-col gap-4">
        <input
          type="text"
          placeholder="Brand"
          value={product.brand}
          onChange={(e) => setProduct({ ...product, brand: e.target.value })}
          className="border p-2 rounded"
          required
        />
        
        <input
          type="text"
          placeholder="Size"
          value={product.size}
          onChange={(e) => setProduct({ ...product, size: e.target.value })}
          className="border p-2 rounded"
          required
        />

        {/* --- ONLY ADDED THIS DROPDOWN --- */}
        <select
          value={product.category}
          onChange={(e) => setProduct({ ...product, category: e.target.value })}
          className="border p-2 rounded bg-gray-50 text-sm"
        >
          <option value="Official University Merchandise">Official University Merchandise</option>
          <option value="Student Listings">Student Listings</option>
        </select>

        <input
          type="number"
          placeholder="Price"
          value={product.price}
          onChange={(e) => setProduct({ ...product, price: e.target.value })}
          className="border p-2 rounded"
          required
        />
        
        <input
          type="text"
          placeholder="Image URL"
          value={product.image}
          onChange={(e) => setProduct({