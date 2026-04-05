import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
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

        ordersArray.sort(
          (a, b) =>
            (b.createdAt?.toMillis() || 0) -
            (a.createdAt?.toMillis() || 0)
        );

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

      // 🚫 Prevent double deny
      if (order.status === "Denied") {
        alert("This order is already denied.");
        return;
      }

      await runTransaction(db, async (transaction) => {
        // ✅ ONLY restore pcs when denied
        if (newStatus === "Denied") {
          for (const item of order.items) {
            const productId = item.productId ?? item.id;

            if (!productId) {
              console.warn("Missing product ID:", item);
              continue;
            }

            const productRef = doc(db, "products", productId);
            const snap = await transaction.get(productRef);

            if (!snap.exists()) {
              console.warn("Product not found:", productId);
              continue;
            }

            // 🔥 IMPORTANT: use PCS (not stock)
            const currentPcs = snap.data().pcs || 0;

            const qty = item.quantity ?? item.qty ?? 0;

            transaction.update(productRef, {
              pcs: currentPcs + qty,
              inStock: true,
            });
          }
        }

        // ✅ update order inside transaction
        transaction.update(orderRef, { status: newStatus });
      });

      // UI update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status: newStatus } : o
        )
      );

      alert(`Order ${order.reservationId} updated to ${newStatus}`);
    } catch (error) {
      console.error(error);
      alert("Failed to update status.");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const s = searchTerm.toLowerCase();

    const matchesOrder = order.reservationId?.toLowerCase().includes(s);
    const matchesStudent = order.studentId?.toLowerCase().includes(s);

    const matchesProduct = order.items?.some(
      (item) =>
        item.brand?.toLowerCase().includes(s) ||
        item.model?.toLowerCase().includes(s) ||
        item.name?.toLowerCase().includes(s)
    );

    return matchesOrder || matchesStudent || matchesProduct;
  });

  if (!currentUser || !isAdmin) return <Navigate to="/login" />;
  if (loading)
    return (
      <div className="p-10 text-center font-bold">
        Accessing Admin Panel...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-black mb-6">Order Management</h1>

      <input
        type="text"
        placeholder="Search..."
        className="w-full p-3 mb-6 border rounded"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid gap-6">
        {filteredOrders.map((order) => {
          const isPending =
            !order.status || order.status === "Pending Payment";
          const isReserved = order.status === "Reserved";

          return (
            <div key={order.id} className="border p-4 rounded bg-white">
              <p className="font-bold">
                Order ID: {order.reservationId}
              </p>
              <p>Student: {order.studentId}</p>

              {order.items?.map((item, i) => (
                <p key={i}>
                  {item.name} x{item.quantity ?? item.qty}
                </p>
              ))}

              <p>Status: {order.status || "Pending Payment"}</p>

              {isPending && (
                <>
                  <button
                    onClick={() =>
                      updateOrderStatus(order, "Reserved")
                    }
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() =>
                      updateOrderStatus(order, "Denied")
                    }
                  >
                    Deny
                  </button>
                </>
              )}

              {isReserved && (
                <button
                  onClick={() =>
                    updateOrderStatus(order, "Claimed")
                  }
                >
                  Claim
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminOrders;