import React, { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function Admin() {
  const { currentUser, isAdmin } = useAuth();
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Official University Merchandise"); // Default category
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!brand || !model || !price || !imageUrl || !category) {
      alert("All fields are required!");
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, "products"), {
        brand,
        size: model, // Saving 'model' state as 'size' to match your dashboard
        price: Number(price),
        image: imageUrl,
        category: category, // 🔥 THIS SAVES THE CATEGORY
        inStock: true,
        stock: 1,
        createdAt: serverTimestamp(),
      });

      alert("Product added successfully!");
      setBrand("");
      setModel("");
      setPrice("");
      setImageUrl("");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !isAdmin) return <Navigate to="/login" />;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <form onSubmit={handleSubmit} className="max-w-md bg-white p-6 rounded shadow space-y-4">
        
        {/* CATEGORY DROPDOWN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Section</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 w-full rounded bg-gray-50"
          >
            <option value="Official University Merchandise">Official University Merchandise</option>
            <option value="Student Listings">Student Listings</option>
          </select>
        </div>

        <input type="text" placeholder="Product Name / Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="border p-2 w-full rounded" />
        <input type="text" placeholder="Size (e.g. Medium, 11oz)" value={model} onChange={(e) => setModel(e.target.value)} className="border p-2 w-full rounded" />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} className="border p-2 w-full rounded" />
        <input type="text" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="border p-2 w-full rounded" />

        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 w-full rounded hover:bg-blue-700">
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default Admin;