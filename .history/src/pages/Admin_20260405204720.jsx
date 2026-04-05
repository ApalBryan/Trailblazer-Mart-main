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
  const [category, setCategory] = useState("Official University Merchandise"); // Added category state
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Updated validation to include category
    if (!brand || !model || !price || !imageUrl || !category) {
      alert("All fields are required!");
      return;
    }

    if (isNaN(Number(price))) {
      alert("Price must be a number");
      return;
    }

    setLoading(true);

    try {
      // Add product to Firestore including category
      await addDoc(collection(db, "products"), {
        brand,
        model,
        price: Number(price),
        image: imageUrl,
        category, // Added category to database document
        createdAt: serverTimestamp(),
      });

      alert("Product added successfully!");

      // Reset form
      setBrand("");
      setModel("");
      setPrice("");
      setImageUrl("");
      setCategory("Official University Merchandise");

    } catch (error) {
      console.error("Error adding product:", error);
      alert("Error adding product.");
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

        {/* --- 