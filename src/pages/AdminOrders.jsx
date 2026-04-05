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
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchOrders = async () => {
      try {
        const snapshot = await getDocs(collection(db, "orders"));

        const ordersArray = snapshot.docs.map((docItem) => ({
          id: docItem.id,
          ...docItem.data(),
        }));

        // ✅ SORT NEWEST FIRST
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

  // 🔥 APPROVE / DENY
  const updateOrderStatus = async (order, status) => {
    try {
      const orderRef = doc(db, "orders", order.id);

      // 🔁 RESTORE STOCK IF DENIED
      if (status === "denied") {
        for (const item of order.items) {
          if (!item.id) continue;

          const productRef = doc(db, "products", item.id);

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

      await updateDoc(orderRef, { status });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status } : o
        )
      );

    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  if (!currentUser) return <Navigate to="/login" />;

  if (loading) return <p>Loading orders...</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;

  return (
    <div className="max-w-6xl mx-auto p-4">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Orders</h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border p-4 rounded shadow">

            <h2 className="font-bold mb-2">Order ID: {order.id}</h2>

            <p><strong>User ID:</strong> {order.userId}</p>

            <p>
              <strong>Status:</strong>{" "}
              <span className={`font-bold ${
                order.status === "approved"
                  ? "text-green-600"
                  : order.status === "denied"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}>
                {order.status || "pending"}
              </span>
            </p>

            {order.createdAt?.toDate && (
              <p className="text-sm text-gray-500">
                {order.createdAt.toDate().toLocaleString()}
              </p>
            )}

            <p><strong>Total:</strong> ₱{order.total ?? 0}</p>

            <div className="mt-2">
              <strong>Items:</strong>
              {order.items?.map((item, index) => (
                <p key={index}>
                  {item.brand} {item.model} x {item.quantity}
                </p>
              ))}
            </div>

            <div className="mt-3 flex gap-2">

              {/* APPROVE / DENY */}
              {(!order.status || order.status === "pending") && (
                <>
                  <button
                    onClick={() => updateOrderStatus(order, "approved")}
                    className="bg-green-600 text-white px-3 py-1 rounded"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => updateOrderStatus(order, "denied")}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Deny
                  </button>
                </>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminOrders;