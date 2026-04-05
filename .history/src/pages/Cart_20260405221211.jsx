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
  
  // New State for the Reservation Slip
  const [reservationSlip, setReservationSlip] = useState(null);

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

      // 2. GENERATE SLIP DATA (Legitimacy for Defense)
      const resId = `RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const slipData = {
        reservationId: resId,
        studentId: currentUser.studentId || currentUser.uid.substring(0, 8),
        userId: currentUser.uid,
        items: cartItems.map(i => ({ name: `${i.brand} ${i.model}`, qty: i.quantity })),
        total: totalPrice,
        status: "Pending Payment",
        reservationDate: new Date().toLocaleDateString(),
        adminVerificationTag: "UNITHUB-OFFICIAL-REF",
        createdAt: serverTimestamp(),
      };

      // 3. SAVE ORDER
      await addDoc(collection(db, "orders"), slipData);

      // 4. SHOW SLIP & SUCCESS
      setReservationSlip(slipData);
      showToast("Reservation successful!", "success");
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
          
          {/* DIGITAL RESERVATION SLIP (Post-Order View) */}
          {reservationSlip && (
            <div className="reservation-slip-overlay" style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
            }}>
              <div className="slip-card" style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '8px', maxWidth: '400px', width: '100%',
                borderTop: '10px solid #2563eb'
              }}>
                <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>DIGITAL RESERVATION SLIP</h2>
                <hr style={{ margin: '15px 0' }} />
                
                <div style={{ fontSize: '14px', lineHeight: '2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Reservation ID:</strong> {reservationSlip.reservationId}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Student ID:</strong> {reservationSlip.studentId}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Date:</strong> {reservationSlip.reservationDate}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Status:</strong> <span style={{ color: '#d97706', fontWeight: 'bold' }}>{reservationSlip.status}</span></div>
                </div>

                <div style={{ marginTop: '15px', border: '1px dashed #ccc', padding: '10px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold' }}>ITEMS:</p>
                  {reservationSlip.items.map((item, idx) => (
                    <div key={idx} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.name} (x{item.qty})</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '10px', color: '#666' }}>
                  <p>Verification Tag: {reservationSlip.adminVerificationTag}</p>
                  <p>Present this to the cashier for validation.</p>
                </div>

                <button 
                  onClick={() => setReservationSlip(null)}
                  style={{ width: '100%', marginTop: '20px', backgroundColor: '#2563eb', color: 'white', padding: '10px', borderRadius: '5px', fontWeight: 'bold' }}
                >
                  Close & Continue Shopping
                </button>
              </div>
            </div>
          )}

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
                    {/* ... (Existing controls) */}
                    <div className="cart-item-controls">
                      <button className="qty-btn" onClick={() => removeFromCart(item.id)}>−</button>
                      <span className="qty-value">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => addToCart(item, 1)}>+</button>
                    </div>
                    <div className="cart-item-total">₱{(item.price * item.quantity).toLocaleString()}</div>
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
                  {loading ? "Processing..." : "Place Order & Get Slip"}
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