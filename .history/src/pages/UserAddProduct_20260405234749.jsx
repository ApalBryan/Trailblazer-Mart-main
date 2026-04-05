import React, { useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

function UserAddProduct() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "Student Seller",
    price: "",
    stock: "1",
    description: "",
    imageUrl: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, "products"), {
        ...formData,
        category: "Student Listings", // ✅ AUTOMATICALLY SET
        sellerId: currentUser.uid,    // ✅ Track for revenue logic
        sellerName: currentUser.displayName || "Anonymous Student",
        price: Number(formData.price),
        stock: Number(formData.stock),
        inStock: true,
        createdAt: serverTimestamp(),
      });

      alert("Item listed successfully!");
      navigate("/user-dashboard");
    } catch (error) {
      console.error(error);
      alert("Error listing item.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-2xl rounded-3xl my-10 border border-blue-50">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sell Your Item</h1>
        <p className="text-sm text-gray-500">Your item will be listed under <span className="text-blue-600 font-bold">Student Listings</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Product Name</label>
          <input required name="name" onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all" placeholder="e.g. Second-hand Lab Gown" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Price (₱)</label>
            <input required type="number" name="price" onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all" placeholder="0.00" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Stock</label>
            <input required type="number" name="stock" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-blue-600 uppercase ml-1">Photo URL</label>
          <input required name="imageUrl" onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all" placeholder="Link to item photo" />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-blue-700 transition-all uppercase tracking-tighter">
          {loading ? "Posting..." : "List Product"}
        </button>
      </form>
    </div>
  );
}

export default UserAddProduct;