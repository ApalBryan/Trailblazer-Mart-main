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
  
  // States for the Reservation Slip
  const [showSlip, setShowSlip] = useState(false);
  const [slipData, setSlipData] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // ✅ FIX: This function now fully wipes the slip from memory
  const handleCloseSlip = () => {
    setShowSlip(false);
    setSlipData(null); // This ensures the slip is "gone" from the history/state
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

      // 2. GENERATE SLIP DATA
      const reservationId = `RES-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const newSlip = {
        reservationId: reservationId,
        studentId: currentUser.studentId || currentUser.uid.substring(0, 8),
        items: cartItems.map(item => ({ name: `${item.brand} ${item.model}`, qty: item.quantity })),
        total: totalPrice,
        reservationDate: new Date().toLocaleDateString(),
        status: "Pending Payment",
        adminVerificationTag: "UNITHUB-VERIFIED-REF",
      };

      // 3. SAVE TO FIRESTORE
      await addDoc(collection(db, "orders"), {
        ...newSlip,
        userId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // 4. TRIGGER SLIP MODAL & WIPE CART
      setSlipData(newSlip);
      setShowSlip(true);
      clearCart(); // Cart becomes empty immediately
      showToast("Order placed successfully!", "success");

    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to place order.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* DIGITAL RESERVATION SLIP MODAL - Controlled by showSlip */}
      {showSlip && slipData && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[999] p-4">
          <div className="bg-white max-w-md w-full rounded-lg shadow-2xl p-6 border-t-8 border-blue-600">
            <h2 className="text-xl font-bold text-center uppercase tracking-tight">Digital Reservation Slip</h2>
            <p className="text-center text-xs text-gray-400 mb-4 italic">Proof of Intent to Purchase</p>
            
            <div className="space-y-2 border-y py-4 mb-4 text-sm">
              <div className="flex justify-between"><strong>Reservation ID:</strong> <span className="font-mono font-bold text-blue-600">{slipData.reservationId}</span></div>
              <div className="flex justify-between"><strong>Student ID:</strong> <span>{slipData.studentId}</span></div>
              <div className="flex justify-between"><strong>Date:</strong> <span>{slipData.reservationDate}</span></div>
              <div className="flex justify-between"><strong>Status:</strong> <span className="text-orange-600 font-bold uppercase">{slipData.status}</span></div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 mb-2">RESERVED ITEMS:</p>
              {slipData.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                  <span>{item.name}</span>
                  <span className="font-bold text-gray-600">x{item.qty}</span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-gray-400 text-center bg-gray-50 p-2 rounded mb-6">
              Verification Tag: {slipData.adminVerificationTag}
            </div>

            <button 
              onClick={handleCloseSlip}
              className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition"
            >
              Close & Finish
            </button>
          </div>
        </div>
      )}

      <div className="cart-root">
        <div className="cart-container">
          {cartItems.length === 0 ? (
            <div className="cart-empty text-center py-20">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-bold">Your cart is empty</h2>
              <p className="text-gray-500">Go back to marketplace to add items.</p>
            </div>
          ) : (
            <>
              {/* Existing Cart Table/Items UI stays here */}
              <div className="cart-header mb-6">
                <h1 className="text-3xl font-bold">Shopping Cart</h1>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between p-4 bg-white border rounded">
                    <div>
                      <p className="font-bold">{item.brand} {item.model}</p>
                      <p className="text-sm">₱{item.price}</p>
                    </div>
                    <div className="font-bold">₱{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t pt-4 flex justify-between text-2xl font-bold">
                <span>Total</span>
                <span>₱{totalPrice.toLocaleString()}</span>
              </div>

              <div className="mt-6 flex gap-4">
                <button
                  onClick={handleOrder}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 rounded font-bold"
                >
                  {loading ? "Generating Slip..." : "Place Order & Get Slip"}
                </button>
                <button onClick={clearCart} className="px-6 py-3 border rounded text-gray-500 font-bold">
                  Clear Cart
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`toast ${toast.show ? "show" : ""} ${toast.type}`}>
        {toast.message}
      </div>
    </>
  );
}

export default Cart;