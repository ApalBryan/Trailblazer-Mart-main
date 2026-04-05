import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function UserOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  useEffect(() => {
    if (!currentUser) return;

    // 🔥 REAL-TIME LISTENER
    const q = query(
      collection(db, "orders"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let ordersArray = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          items: d.data().items || [],
        }));

        // ✅ SORT NEWEST FIRST
        ordersArray.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        setOrders(ordersArray);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        showToast("Failed to load orders.", "error");
        setLoading(false);
      }
    );

    // ✅ CLEANUP LISTENER
    return () => unsubscribe();
  }, [currentUser]);

  const clearHistory = async () => {
    if (!window.confirm("Clear all order history? This cannot be undone.")) return;

    setClearing(true);

    try {
      const userOrders = orders.filter((order) => !order.hidden);

      const updates = userOrders.map((order) =>
        updateDoc(doc(db, "orders", order.id), { hidden: true })
      );

      await Promise.all(updates);

      setOrders((prev) => prev.map((o) => ({ ...o, hidden: true })));

      showToast("Order history cleared.", "success");
    } catch (error) {
      console.error("Error clearing history:", error);
      showToast("Failed to clear history.", "error");
    } finally {
      setClearing(false);
    }
  };

  const statusConfig = {
    approved: { label: "Approved", cls: "status-approved" },
    denied: { label: "Denied", cls: "status-denied" },
    pending: { label: "Pending", cls: "status-pending" },
  };

  if (!currentUser) {
    return (
      <div className="orders-root">
        <div className="orders-container">
          <div className="orders-empty">
            <div className="empty-icon">🔒</div>
            <h2 className="empty-title">Sign in to view orders</h2>
            <p className="empty-subtitle">
              Your order history will appear here once you're logged in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-root">
        <div className="orders-container">
          <div className="orders-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-line short" />
                <div className="skeleton-line medium" />
                <div className="skeleton-line long" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const visibleOrders = orders.filter((order) => !order.hidden);

  return (
    <div className="orders-root">
      <div className="orders-container">

        {/* HEADER */}
        <div className="orders-header">
          <div>
            <h1 className="orders-title">My Orders</h1>
            <p className="orders-subtitle">
              {visibleOrders.length === 0
                ? "No orders placed yet"
                : `${visibleOrders.length} order${
                    visibleOrders.length !== 1 ? "s" : ""
                  } found`}
            </p>
          </div>

          {visibleOrders.length > 0 && (
            <button
              onClick={clearHistory}
              disabled={clearing}
              className="btn-clear"
            >
              {clearing ? "Clearing…" : "Clear History"}
            </button>
          )}
        </div>

        {/* EMPTY */}
        {visibleOrders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">🗒️</div>
            <h2 className="empty-title">No orders yet</h2>
            <p className="empty-subtitle">
              Your past orders will show up here once you place one.
            </p>
          </div>
        ) : (
          <div className="orders-list">
            {visibleOrders.map((order) => {
              const status = order.status || "pending";
              const { label, cls } =
                statusConfig[status] || statusConfig.pending;

              return (
                <div key={order.id} className="order-card">

                  {/* HEADER */}
                  <div className="order-card-header">
                    <div className="order-meta">
                      <span className="order-id">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>

                      {order.createdAt?.toDate && (
                        <span className="order-date">
                          {order.createdAt
                            .toDate()
                            .toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                        </span>
                      )}
                    </div>

                    <span className={`order-status ${cls}`}>
                      {label}
                    </span>
                  </div>

                  <div className="order-divider" />

                  {/* ITEMS */}
                  <div className="order-items">
                    {order.items.length > 0 ? (
                      order.items.map((item, index) => (
                        <div key={item.id || index} className="order-item-row">
                          <div className="order-item-icon">📦</div>

                          <div className="order-item-info">
                            <span className="order-item-name">
                              {item.brand || "Unknown Brand"}{" "}
                              {item.model || "Unknown Model"}
                            </span>

                            <span className="order-item-qty">
                              Qty: {item.quantity || 1}
                            </span>
                          </div>

                          {item.price && (
                            <span className="order-item-price">
                              ₱{(item.price * (item.quantity || 1)).toLocaleString()}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="order-no-items">
                        No item details available.
                      </p>
                    )}
                  </div>

                  {/* TOTAL */}
                  <div className="order-card-footer">
                    <span className="order-total-label">Order Total</span>
                    <span className="order-total-value">
                      ₱{Number(order.total || 0).toLocaleString()}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TOAST */}
      <div className={`toast ${toast.show ? "show" : ""} ${toast.type}`}>
        {toast.message}
      </div>
    </div>
  );
}

export default UserOrders;