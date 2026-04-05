import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, query, where } from "firebase/firestore";

function UserDashboard() {
  const { currentUser } = useAuth(); // Removed isAdmin check

  const [stats, setStats] = useState({
    revenue: 0,
    products: 0,
    pending: 0,
    completed: 0
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (!currentUser) return;

      try {
        // 1. Fetch only orders that contain THIS user's products
        const ordersSnapshot = await getDocs(collection(db, "orders"));
        
        // 2. Fetch only products created by THIS user
        const productsQuery = query(
          collection(db, "products"), 
          where("sellerId", "==", currentUser.uid)
        );
        const productsSnapshot = await getDocs(productsQuery);

        let myTotalRevenue = 0;
        let myPendingOrders = 0;
        let myCompletedOrders = 0;

        ordersSnapshot.forEach((orderDoc) => {
          const data = orderDoc.data();
          
          // Check if any item in this order belongs to the current user
          const myItemsInOrder = data.items?.filter(item => item.sellerId === currentUser.uid) || [];
          
          if (myItemsInOrder.length > 0) {
            // Calculate revenue only from the user's items in that order
            const orderValueForMe = myItemsInOrder.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
            myTotalRevenue += orderValueForMe;

            if (data.status === "pending") myPendingOrders++;
            if (data.status === "completed") myCompletedOrders++;
          }
        });

        const myProductsData = productsSnapshot.docs.map(docItem => ({
          id: docItem.id,
          ...docItem.data()
        }));

        setProducts(myProductsData);

        setStats({
          revenue: myTotalRevenue,
          products: productsSnapshot.size, // Only counts student's own products
          pending: myPendingOrders,
          completed: myCompletedOrders
        });

      } catch (error) {
        console.error("Error fetching user stats:", error);
      }
      setLoading(false);
    };

    fetchUserStats();
  }, [currentUser]);

  // 🔥 STOCK MANAGEMENT LOGIC (Same as admin but scoped to user items)
  const toggleStock = async (id, currentStatus) => {
    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, {
        inStock: !currentStatus,
        stock: !currentStatus ? 1 : 0
      });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !currentStatus, stock: !currentStatus ? 1 : 0 } : p));
    } catch (err) { console.error(err); }
  };

  const updateStock = async (id, value) => {
    const newStock = Number(value);
    try {
      const productRef = doc(db, "products", id);
      await updateDoc(productRef, { stock: newStock, inStock: newStock > 0 });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock, inStock: newStock > 0 } : p));
    } catch (err) { console.error(err); }
  };

  if (!currentUser) return <Navigate to="/login" />;
  if (loading) return <div className="p-10 text-center font-bold">Loading Seller Dashboard...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">SELLER DASHBOARD</h1>
          <p className="text-slate-500 font-medium">Manage your campus listings and sales.</p>
        </div>
        <Link 
          to="/" 
          className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition"
        >
          ← Back to Store
        </Link>
      </div>

      {/* STATS - Users excluded as requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-900/20">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">My Revenue</p>
          <p className="text-3xl font-bold">₱{stats.revenue.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg shadow-slate-900/20">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">My Products</p>
          <p className="text-3xl font-bold">{stats.products}</p>
        </div>

        <div className="bg-amber-500 text-white p-6 rounded-2xl shadow-lg shadow-amber-900/20">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Active Sales</p>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </div>

        <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-900/20">
          <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Fulfilled</p>
          <p className="text-3xl font-bold">{stats.completed}</p>
        </div>
      </div>

      {/* PRODUCT LIST */}
      <div className="mt-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">MY LISTINGS</h2>
          <Link to="/sell-item" className="text-sm font-bold text-blue-600 hover:underline">+ Add New Item</Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
              <img src={product.image} alt={product.name} className="h-40 w-full object-contain mb-4" />
              
              <div className="mb-4">
                <p className="font-bold text-slate-900">{product.name || product.brand}</p>
                <p className="text-sm text-slate-500">{product.size}</p>
                <p className="text-lg font-black text-emerald-600">₱{product.price}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400">Stock Count</label>
                  <input
                    type="number"
                    value={product.stock ?? 0}
                    onChange={(e) => updateStock(product.id, e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    min="0"
                  />
                </div>

                <button
                  onClick={() => toggleStock(product.id, product.inStock)}
                  className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                    product.inStock
                      ? "bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                  }`}
                >
                  {product.inStock ? "Deactivate Listing" : "Activate Listing"}
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-slate-400 font-bold">You haven't listed any products yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;