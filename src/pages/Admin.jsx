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
  const [stock, setStock] = useState(""); // ✅ NEW
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ VALIDATION
    if (!brand || !model || !price || !imageUrl || stock === "") {
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
      console.log("Submitting product:", {
        brand,
        model,
        price: Number(price),
        stock: numericStock,
        image: imageUrl,
        userId: currentUser.uid,
      });

      // ✅ ADD PRODUCT WITH STOCK
      await addDoc(collection(db, "products"), {
        brand,
        model,
        price: Number(price),
        stock: numericStock,              // ✅ SAVE STOCK
        inStock: numericStock > 0,        // ✅ AUTO STATUS
        image: imageUrl,
        createdAt: serverTimestamp(),
      });

      alert("Product added successfully!");

      // ✅ RESET FORM
      setBrand("");
      setModel("");
      setPrice("");
      setStock(""); // ✅ reset
      setImageUrl("");

    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Check Firestore rules.");
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

        {/* Preview */}
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

export default Admin;