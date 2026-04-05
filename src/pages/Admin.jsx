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
<<<<<<< HEAD
  const [stock, setStock] = useState(""); // ✅ NEW
  const [imageUrl, setImageUrl] = useState("");
=======
  const [imageUrl, setImageUrl] = useState(""); 
  const [category, setCategory] = useState("Official University Merchandise"); // Default category
>>>>>>> 7ca5d25 (Update core pages: Admin, Products, Cart, and User Orders logic)
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

<<<<<<< HEAD
    // ✅ VALIDATION
    if (!brand || !model || !price || !imageUrl || stock === "") {
=======
    if (!brand || !model || !price || !imageUrl || !category) {
>>>>>>> 7ca5d25 (Update core pages: Admin, Products, Cart, and User Orders logic)
      alert("All fields are required!");
      return;
    }

    if (isNaN(Number(price)) || isNaN(Number(stock))) {
      alert("Price and Stock must be numbers");
      return;
    }

    const numericStock = Number(stock);

    setLoading(true);

    try {
<<<<<<< HEAD
      console.log("Submitting product:", {
        brand,
        model,
        price: Number(price),
        stock: numericStock,
        image: imageUrl,
        userId: currentUser.uid,
      });

      // ✅ ADD PRODUCT WITH STOCK
=======
>>>>>>> 7ca5d25 (Update core pages: Admin, Products, Cart, and User Orders logic)
      await addDoc(collection(db, "products"), {
        brand,
        model,
        price: Number(price),
        stock: numericStock,              // ✅ SAVE STOCK
        inStock: numericStock > 0,        // ✅ AUTO STATUS
        image: imageUrl,
        category, // Saved to Firestore
        createdAt: serverTimestamp(),
      });

      alert("Product added successfully!");

      // ✅ RESET FORM
      setBrand("");
      setModel("");
      setPrice("");
      setStock(""); // ✅ reset
      setImageUrl("");
      setCategory("Official University Merchandise");

    } catch (error) {
      console.error("Error adding product:", error);
<<<<<<< HEAD
      alert("Error adding product. Check Firestore rules.");
=======
      alert("Error adding product.");
>>>>>>> 7ca5d25 (Update core pages: Admin, Products, Cart, and User Orders logic)
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <form
        onSubmit={handleSubmit}
        className="max-w-md bg-white p-6 rounded shadow space-y-4"
      >
        {/* CATEGORY DROPDOWN MOVED TO TOP */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-400 font-bold uppercase ml-1">Select Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border p-2 w-full rounded bg-gray-50 font-semibold"
          >
            <option value="Official University Merchandise">Official University Merchandise</option>
            <option value="Student Listings">Student Listings</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <input
          type="text"
          placeholder="Size"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="border p-2 w-full rounded"
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border p-2 w-full rounded"
        />

        {/* ✅ NEW STOCK INPUT */}
        <input
          type="number"
          placeholder="Stock (pcs)"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="border p-2 w-full rounded"
          min="0"
        />

        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="border p-2 w-full rounded"
        />

<<<<<<< HEAD
        {/* Preview */}
=======
>>>>>>> 7ca5d25 (Update core pages: Admin, Products, Cart, and User Orders logic)
        {imageUrl && (
          <div className="mt-2">
            <p className="text-gray-500 text-sm">Preview:</p>
            <img
              src={imageUrl}
              alt="Preview"
              className="w-32 h-32 object-cover rounded border"
            />
          </div>
        )}

        {/* ✅ STOCK PREVIEW */}
        {stock !== "" && (
          <p className="text-sm text-gray-600">
            Status:{" "}
            <span className={Number(stock) > 0 ? "text-green-600" : "text-red-600"}>
              {Number(stock) > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full font-bold"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default Admin;