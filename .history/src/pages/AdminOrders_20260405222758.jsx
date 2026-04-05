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
  const [searchTerm, setSearchTerm] = useState(""); // For searching Reservation IDs

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));
        const ordersArray = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        // Sort newest first
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
          // Note: ensure your cart stores item.id (the product doc id)
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

      // Update local state to reflect UI change
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      );
      
      alert(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update status.");
    }
  };

  // Filter orders based on Search Term (Reservation ID or Student ID)
  const filteredOrders = orders.filter(order => 
    order.reservationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser || !isAdmin) return <Navigate to="/login" />;
  if (loading) return <div className="p-10 text-center">Loading Admin Dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Reservations: {orders.length}</p>
        </div>
      </div>

      {/* SEARCH BAR - CRITICAL FOR DEFENSE */}
      <div className="mb-6">
        <input 
          type="text"
          placeholder="Search Reservation ID or Student ID..."
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No matching reservations found.</p>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border rounded-xl shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {order.reservationId || "NO-ID"}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                    order.status === "Claimed" ? "bg-green-100 text-green-700" :
                    order.status === "Denied" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.status || "Pending Payment"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-800">Student: {order.studentId}</h2>
                <p className="text-sm text-gray-600">
                  {order.items?.map(item => `${item.brand || item.name} (x${item.quantity})`).join(", ")}
                </p>
                <p className="text-xs text-gray-400">
                  {order.createdAt?.toDate() ? order.createdAt.toDate().toLocaleString() : "Date unknown"}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <p className="text-xl font-black text-gray-800">₱{order.total?.toLocaleString()}</p>
                
                {/* ACTION BUTTONS */}
                <div className="flex gap-2">
                  {/* Show specific buttons based on current status to simulate a real workflow */}
                  {(order.status === "Pending Payment" || !order.status) && (
                    <>