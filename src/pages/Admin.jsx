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
  const [imageUrl, setImageUrl] = useState(""); // URL input
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!brand || !model || !price || !imageUrl) {
      alert("All fields are required!");
      return;
    }

    if (isNaN(Number(price))) {
      alert("Price must be a number");
      return;
    }

    setLoading(true);

    try {
      // Debug log to see what we’re submitting
      console.log("Submitting product:", {
        brand,
        model,
        price: Number(price),
        image: imageUrl,
        userId: currentUser.uid,
      });

      // Add product to Firestore
      await addDoc(collection(db, "products"), {
        brand,
        model,
        price: Number(price),
        image: imageUrl,
        createdAt: serverTimestamp(),
      });

      alert("Product added successfully!");

      // Reset form
      setBrand("");
      setModel("");
      setPrice("");
      setImageUrl("");

    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product. Make sure your Firestore rules allow your user to write.");
    } finally {
      setLoading(false);
    }
  };

  // Optional: Admin check on render
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

        <input
          type="text"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="border p-2 w-full rounded"
        />

        {/* Live preview */}
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