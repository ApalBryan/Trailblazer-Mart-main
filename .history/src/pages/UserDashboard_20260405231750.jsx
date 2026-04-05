import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

function UserDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ revenue: 0, activeListings: 0, soldItems: 0 });

  useEffect(() => {
    const fetchUserStats = async () => {
      // 1. Get User's Products
      const pQuery = query(collection(db, "products"), where("sellerId", "==", currentUser.uid));
      const pSnap = await getDocs(pQuery);
      
      // 2. Get User's Sales (Orders containing their products)
      const oSnap = await getDocs(collection(db, "orders"));
      let userRevenue = 0;
      let itemsSold = 0;

      oSnap.docs.forEach(doc => {
        const order = doc.data();
        if (order.status === "Claimed") {
          order.items?.forEach(item => {
            // Check if the item in the order belongs to THIS user
            if (item.sellerId === currentUser.uid) {
              userRevenue += (item.price * item.quantity);
              itemsSold += item.quantity;
            }
          });
        }
      });

      setStats({
        revenue: userRevenue,
        activeListings: pSnap.size,
        soldItems: itemsSold
      });
    };

    if (currentUser) fetchUserStats();
  }, [currentUser]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Seller Dashboard</h1>
          <p className="text-gray-500 font-medium">Manage your campus listings and earnings</p>
        </div>
        <Link to="/user-add-product" className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-100 hover:scale-105 transition-transform">
          + Sell New Item
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* REVENUE - Filtered to ONLY this user */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">My Total Revenue</p>
          <h2 className="text-4xl font-black text-green-600">₱{stats.revenue.toLocaleString()}</h2>
          <p className="text-xs text-gray-400 mt-2">From claimed reservations</p>
        </div>

        {/* ACTIVE LISTINGS */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Listings</p>
          <h2 className="text-4xl font-black text-blue-600">{stats.activeListings}</h2>
          <p className="text-xs text-gray-400 mt-2">Items currently on marketplace</p>
        </div>

        {/* ITEMS SOLD */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Items Sold</p>
          <h2 className="text-4xl font-black text-gray-900">{stats.soldItems}</h2>
          <p className="text-xs text-gray-400 mt-2">Successfully claimed by buyers</p>
        </div>
      </div>
      
      {/* NO "USERS" SECTION HERE PER YOUR REQUEST */}
    </div>
  );
}

export default UserDashboard;