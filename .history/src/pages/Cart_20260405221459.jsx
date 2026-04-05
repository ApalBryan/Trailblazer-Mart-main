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
  
  // State for Digital Reservation Slip
  const [showSlip, setShowSlip] = useState(false);
  const [slipData, setSlipData] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleOrder = async () => {
    if (!currentUser) {
      showToast("Please log in to place an order", "error");
      return;
    }

    setLoading(true);

    try {
      // 1. UPDATE STOCK SAFELY
      for (const item of cartItems) {
        const productRef = doc(db, "products", item.id);
        await runTransaction(db, async (transaction) => {
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) throw new Error("Product does not exist!");
          const productData = productSnap.data();
          const currentStock = productData.stock || 0;
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

      // 2. PREPARE RESERVATION DATA
      const reservationId = `RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const newSlip = {
        reservationId: reservationId,
        studentId: currentUser.studentId || currentUser.uid.substring(0, 8), // Fallback if studentId is missing
        items: cartItems.map(item => ({ name: `${item.brand} ${item.model}`, qty: item.quantity })),
        total: totalPrice,
        reservationDate: new Date().toLocaleDateString(),
        status: "Pending Payment",
        adminVerificationTag: "UNITHUB-VERIFIED-REF",
      };

      // 3. SAVE ORDER TO FIRESTORE
      await addDoc(collection(db, "orders"), {
        ...newSlip,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // 4. SHOW SLIP AND SUCCESS
      setSlipData(newSlip);
      setShowSlip(true);
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
      {/* DIGITAL RESERVATION SLIP MODAL */}
      {showSlip && slipData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white max-w-md w-full rounded-lg shadow-2xl overflow-hidden border-t-8 border-blue-600">
            <div className="p-6">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Reservation Slip</h2>
                <p className="text-sm text-gray-500 italic">UniHub Marketplace Proof of Intent</p>
              </div>
              
              <div className="space-y-3 border-y py-4 my-4">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-600">Reservation ID:</span>
                  <span className="font-mono text-blue-700 font-bold">{slipData.reservationId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-600">Student ID:</span>
                  <span className="text-gray-800">{slipData.studentId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-600">Date:</span>
                  <span className="text-gray-800">{slipData.reservationDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-600">Status:</span>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold uppercase">
                    {slipData.status}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Order Items</p>
                {slipData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-700">
                    <span>{item.name}</span>
                    <span className="font-bold">x{item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-3 rounded text-[10px] text-gray-500 text-center uppercase tracking-widest border border-dashed border-gray-300">
                Admin Tag: {slipData.adminVerificationTag}
              </div>

              <button 
                onClick={() => setShowSlip(false)}
                className="w-full mt-6 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition"
              >
                Close & Finish
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <p className="cart-item-price"><span>₱{item.price}</span> per unit</p>
                    </div>

                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => addToCart(item, 1)}>+</button>
                    </div>

                    <div className="cart-item-total">
                      ₱{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-divider" />

              <div className="cart-summary">
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
                  {loading ? "Processing Slip..." : "Place Order & Get Slip"}
                </button>
                <button onClick={clearCart} className="btn-secondary">Clear Cart</button>
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