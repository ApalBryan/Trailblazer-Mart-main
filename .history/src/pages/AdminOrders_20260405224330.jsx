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

        ordersArray.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

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

      // RESTORE STOCK IF DENIED
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

      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
      
      alert(`Order ${order.reservationId} updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  };

  const filteredOrders = orders.filter(order => 
    order.reservationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser || !isAdmin) return <Navigate to="/login" />;
  if (loading) return <div className="p-10 text-center font-bold">Accessing Admin Panel...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-gray-500 text-sm">Control and verify student purchase intentions</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border font-bold text-blue-600">
          Total: {orders.length}
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="mb-6 relative">
        <input 
          type="text"
          placeholder="Search by Order ID (e.g. RES-...) or Student ID"
          className="w-full p-4 pl-12 border rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none border-gray-200 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span className="absolute left-4 top-4 opacity-30">🔍</span>
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center bg-white p-20 rounded-3xl border-2 border-dashed">
            <p className="text-gray-400">No matching orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isPending = !order.status || order.status === "Pending Payment";
            const isReserved = order.status === "Reserved";

            return (
              <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow">
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {/* ✅ UPDATED LABEL: Order ID */}
                    <span className="text-[11px] font-black bg-blue-600 text-white px-3 py-1 rounded-full tracking-tighter">
                      Order ID: {order.reservationId}
                    </span>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                      order.status === "Claimed" ? "bg-green-100 text-green-700" :
                      order.status === "Denied" ? "bg-red-100 text-red-700" :
                      "bg-