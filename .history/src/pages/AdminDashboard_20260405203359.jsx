import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();

  const [stats, setStats] = useState({
    revenue: 0,
    users: 0,
    products: 0,
    pending: 0,
    completed: 0
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH DATA
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        const productsSnapshot = await getDocs(collection(db, "products"));
        const usersSnapshot = await getDocs(collection(db, "users"));

        let totalRevenue = 0;
        let pendingOrders = 0;
        let completedOrders = 0;

        ordersSnapshot.forEach((doc) => {
          const data = doc.data();

          totalRevenue += data.total || 0;

          if (data.status === "pending") pendingOrders++;
          if (data.status === "completed") completedOrders++;
        });

        const productsData = [];
        productsSnapshot.forEach((docItem) => {
          productsData.push({
            id: docItem.id,
            ...docItem.data()
          });
        });

        setProducts(productsData);

        setStats({
          revenue: totalRevenue,
          users: usersSnapshot.size,
          products: productsSnapshot.size,
          pending: pendingOrders,
          completed: completedOrders
        });

      } catch (error) {
        console.error("Error fetching stats:", error);
      }

      setLoading(false);
    };

    fetchStats();
  }, []);

  // 🔥 TOGGLE STOCK (AUTO SET STOCK TO 0 IF OUT)
  const toggleStock = async (id, currentStatus) => {
    try {
      const productRef = doc(db, "products", id);

      await updateDoc(productRef, {
        inStock: !currentStatus,
        stock: !currentStatus ? 1 : 0 // if turning ON → default 1, OFF → 0
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                inStock: !currentStatus,
                stock: !currentStatus ? 1 : 0
              }
            : p
        )
      );

    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  // 🔥 UPDATE STOCK (PCS)
  const updateStock = async (id, value) => {
    const newStock = Number(value);

    try {
      const productRef = doc(db, "products", id);

      await updateDoc(productRef, {
        stock: newStock,
        inStock: newStock > 0
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                stock: newStock,
                inStock: newStock > 0
              }
            : p
        )
      );

    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };

  // AUTH CHECK
  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" />;
  }

  if (loading) return <p className="text-center">Loading dashboard...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

        <div className="bg-green-500 text-white p-5 rounded-lg shadow text-center">
          <p>Total Revenue</p>
          <p className="text-2xl font-bold">
            ₱{stats.revenue.toLocaleString()}
          </p>
        </div>

        <div className="bg-purple-500 text-white p-5 rounded-lg shadow text-center">
          <p>Total Users</p>
          <p className="text-2xl font-bold">{stats.users}</p>
        </div>

        <div className="bg-gray-800 text-white p-5 rounded-lg shadow text-center">
          <p>Completed Orders</p>
          <p className="text-2xl font-bold">{stats.completed}</p>
        </div>

        <div className="bg-yellow-500 text-white p-5 rounded-lg shadow text-center">
          <p>Pending Orders</p>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>

        <div className="bg-blue-500 text-white p-5 rounded-lg shadow text-center">
          <p>Products</p>
          <p className="text-2xl font-bold">{stats.products}</p>
        </div>

      </div>

      {/* PRODUCT MANAGEMENT */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Manage Products</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded-lg shadow flex flex-col gap-3"
            >
              <img
                src={product.image}
                alt={product.size}
                className="h-32 object-contain mx-auto"
              />

              <div>
                <p className="font-semibold">{product.brand}</p>
                <p className="text-sm text-gray-600">{product.size}</p>
              </div>

              <p className="font-bold">₱{product.price}</p>

              {/* ✅ STOCK INPUT */}
              <div>
                <label className="text-xs text-gray-500">Stock (pcs)</label>
                <input
                  type="number"
                  value={product.stock ?? 0}
                  onChange={(e) =>
                    updateStock(product.id, e.target.value)
                  }
                  className="w-full mt-1 px-2 py-1 border rounded text-sm"
                  min="0"
                />
              </div>

              {/* STATUS */}
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full w-fit
                  ${product.inStock
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                  }`}
              >
                {product.inStock
                  ? `In Stock (${product.stock ?? 0})`
                  : "Out of Stock"}
              </span>

              {/* TOGGLE BUTTON */}
              <button
                onClick={() => toggleStock(product.id, product.inStock)}
                className={`mt-2 py-2 rounded-lg text-sm font-semibold transition
                  ${product.inStock
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-green-500 text-white hover:bg-green-600"
                  }`}
              >
                {product.inStock ? "Mark Out of Stock" : "Mark In Stock"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;