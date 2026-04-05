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
  const [reservationSlip, setReservationSlip] = useState(null); // State for the slip

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

      // 2. GENERATE RESERVATION DETAILS
      const reservationId = `RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const orderData = {
        reservationId: reservationId,
        studentId: currentUser.studentId || currentUser.uid.slice(0, 8), // Uses studentId if available
        userId: currentUser.uid,
        items: cartItems,
        total: totalPrice,
        status: "Pending Payment", // Match your defense requirement
        reservationDate: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        adminVerificationTag: "VERIFIED_LISTING" 
      };

      // 3. SAVE TO FIRESTORE
      await addDoc(collection(db, "orders"), orderData);

      // 4. SHOW SLIP & SUCCESS
      setReservationSlip(orderData); // Set the slip to show on screen
      showToast("Reservation Success! 🎉", "success");
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
          {/* DIGITAL RESERVATION SLIP MODAL/VIEW */}
          {reservationSlip && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full border-t-8 border-blue-600">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold uppercase">Digital Reservation Slip</h2>
                  <p className="text-xs text-gray-500">UniHub Marketplace</p>
                </div>
                
                <div className="space-y-2 text-sm border-y py-4 my-4">
                  <div className="flex justify-between"><span>Reservation ID:</span> <span className="font-mono font-bold text-blue-600">{reservationSlip.reservationId}</span></div>
                  <div className="flex justify-between"><span>Student ID:</span> <span className="font-bold">{reservationSlip.studentId}</span></div>
                  <div className="flex justify-between"><span>Date:</span> <span>{reservationSlip.reservationDate}</span></div>
                  <div className="flex justify-between"><span>Status:</span> <span className="text-orange-500 font-bold">{reservationSlip.status}</span></div>
                </div>

                <div className="mb-4">
                  <p className="font-bold text-xs uppercase mb-1">Items:</p>
                  {reservationSlip.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.brand} x{item.quantity}</span>
                      <span>₱{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center bg-gray-100 p-2 text-[10px] text-gray-600 rounded">
                  {reservationSlip.adminVerificationTag} - Reference for Cashier Validation
                </div>

                <button 
                  onClick={() => setReservationSlip(null)} 
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded font-bold"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="cart-empty">
               <div className="empty-icon">🛒</div>
               <h2 className="empty-title">Your cart is empty</h2>
            </div>
          ) : (
            <>
              {/* Existing Header and Items List */}
              <div className="cart-header">
                <h1 className="cart-title">Shopping Cart</h1>
              </div>

              <div className="cart-items">
                {cartItems.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <p className="cart-item-name">{item.brand} {item.model}</p>
                      <p className="cart-item-price">₱{item.price}</p>
                    </div>
                    {/* ... (Your existing controls) */}
                  </div>
                ))}
              </div>

              <div className="cart-actions">
                <button onClick={handleOrder} className={`btn-primary${loading ? " loading" : ""}`} disabled={loading}>
                  {loading ? "Generating Slip…" : "Place Order & Get Slip"}
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