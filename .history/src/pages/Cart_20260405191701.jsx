import React, { useState } from "react";
import { useCart } from "../contexts/CartContext";
import { collection, addDoc, serverTimestamp, doc, runTransaction } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function Cart() {
  const { cartItems, addToCart, removeFromCart, clearCart, totalPrice } = useCart();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // 🔥 UPDATED ORDER FUNCTION (WITH STOCK REDUCTION)
  const handleOrder = async () => {
    if (!currentUser) {
      showToast("Please log in to place an order", "error");
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. UPDATE STOCK SAFELY (PREVENT OVERSELLING)
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);

        await runTransaction(db, async (transaction) => {
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            throw new Error("Product does not exist!");
          }

          const productData = productSnap.data();
          const currentStock = productData.stock || 0;

          // ❌ Prevent overselling
          if (currentStock < item.quantity) {
            throw new Error(`Not enough stock for ${productData.brand}`);
          }

          const newStock = currentStock - item.quantity;

          transaction.update(productRef, {
            stock: newStock,
            inStock: newStock > 0,
          });
        });
      }

      // ✅ 2. SAVE ORDER
      await addDoc(collection(db, "orders"), {
        userId: currentUser.uid,
        items: cartItems,
        total: totalPrice,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      // ✅ 3. SUCCESS
      showToast("Order placed successfully! 🎉", "success");
      clearCart();

    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to place order.", "error");
    } finally {
      setLoading(false);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <div className="cart-root">
        <div className="cart-container">

          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="empty-icon">🛒</div>
              <h2 className="empty-title">Your cart is empty</h2>
              <p className="empty-subtitle">Add some products to get started</p>
            </div>
          ) : (
            <>
              <div className="cart-header">
                <h1 className="cart-title">Shopping Cart</h1>
                <span className="cart-count">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
              </div>

              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-icon">📱</div>

                    <div className="cart-item-info">
                      <p className="cart-item-name">{item.brand} {item.model}</p>
                      <p className="cart-item-price">
                        <span>₱{item.price}</span> per unit
                      </p>
                    </div>

                    <div className="cart-item-controls">
                      <button
                        className="qty-btn qty-btn-minus"
                        onClick={() => removeFromCart(item.id)}
                      >
                        −
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button
                        className="qty-btn qty-btn-plus"
                        onClick={() => addToCart(item, 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="cart-item-total">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-divider" />

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₱{totalPrice.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span className="total-amount">₱{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div className="cart-actions">
                <button
                  onClick={handleOrder}
                  className={`btn-primary${loading ? " loading" : ""}`}
                  disabled={loading}
                >
                  {loading ? "Placing Order…" : "Place Order"}
                </button>
                <button onClick={clearCart} className="btn-secondary">
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`toast ${toast.type} ${toast.show ? "show" : ""}`}>
        {toast.message}
      </div>
    </>
  );
}

export default Cart;