import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  runTransaction
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

function AdminOrders() {
  const { currentUser, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));
        const ordersArray = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        ordersArray.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setOrders(ordersArray);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentUser]);

  const updateOrderStatus = async (order, newStatus) => {
    try {
      const orderRef = doc(db, "orders", order.id);

      if (newStatus === "Denied") {
        for (const item of order.items) {
          const productRef = doc(db, "products", item.id || item.productId); 
          await runTransaction(db, async (transaction) => {
            const snap = await transaction.get(productRef);
            if (!snap.exists()) return;
            const currentStock = snap.data().stock || 0;
            transaction.update(productRef, {
              stock: currentStock + item.quantity,
              inStock: true,
            });
          });
        }
      }

      await updateDoc(orderRef, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)));
      alert(`Order ${order.reservationId} updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  };

  // ✅ ENHANCED FILTER: Searches Order ID, Student ID, AND Product Names
  const filteredOrders = orders.filter(order => {
    const s = searchTerm.toLowerCase();
    const matchesOrder = order.reservationId?.toLowerCase().includes(s);
    const matchesStudent = order.studentId?.toLowerCase().includes(s);
    
    // Check if any product in the items array matches the search term
    const matchesProduct = order.items?.some(item => 
      (item.brand?.toLowerCase().includes(s)) || 
      (item.model?.toLowerCase().includes(s)) || 
      (item.name?.toLowerCase().includes(s))
    );

    return matchesOrder || matchesStudent || matchesProduct;
  });

  if (!currentUser || !isAdmin) return <Navigate to="/login" />;
  if (loading) return <div className="p-10 text-center font-bold">Accessing Admin Panel...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-gray-500 text-sm">Verify payments and track product distributions</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border font-bold text-blue-600">
          Total Orders: {orders.length}
        </div>
      </div>

      {/* SEARCH BAR - Supports Order ID, Student ID, and Product Search */}
      <div className="mb-8 relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input 
          type="text"
          placeholder="Search by Order ID, Student ID, or Product Name..."
          className="w-full p-4 pl-12 border-2 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 outline-none border-gray-100 focus:border-blue-500 transition-all text-sm font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No matching orders or products found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = !order.status || order.status === "Pending Payment";
            const isReserved = order.status === "Reserved";

            return (
              <div key={order.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-lg transition-all">
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* ✅ BLUE COLOR BORDER TAG (Matching UserOrders) */}
                    <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-200 uppercase tracking-tighter shadow-sm">
                      Order ID: {order.reservationId}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase border ${
                      order.status === "Claimed" ? "bg-green-50 text-green-700 border-green-200" :
                      order.status === "Denied" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}>
                      {order.status || "Pending Payment"}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Student: {order.studentId}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                          <span className="text-xs font-bold text-gray-700">{item.brand || item.name} {item.model || ''}</span>
                          <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded-md font-black">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300"></span>
                    Ordered on {order.createdAt?.toDate() ? order.createdAt.toDate().toLocaleString() : "Unknown"}
                  </p>
                </div>

                <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0">
                  <div className="text-left lg:text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Transaction</p>
                    <p className="text-2xl font-black text-blue-900">₱{order.total?.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {isPending && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order, "Reserved")}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-2.5 px-5 rounded-xl transition shadow-lg shadow-blue-100"
                        >
                          Confirm Payment
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order, "Denied")}
                          className="bg-white border-2 border-red-50 text-red-500 hover:bg-red-50 text-[11px] font-black py-2.5 px-5 rounded-xl transition"
                        >
                          Deny
                        </button>
                      </>
                    )}

                    {isReserved && (
                      <button
                        onClick={() => updateOrderStatus(order, "Claimed")}
                        className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-black py-3 px-8 rounded-xl transition shadow-lg shadow-green-100"
                      >
                        Mark as Claimed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminOrders;