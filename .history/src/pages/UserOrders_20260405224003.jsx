import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

function UserOrders() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let ordersArray = snapshot.docs.map((d) => ({
        id: d.id, 
        ...d.data(),
      }));

      // Sort Newest First
      ordersArray.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setOrders(ordersArray);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const statusConfig = {
    "Pending Payment": { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
    "Reserved": { label: "Reserved", cls: "bg-blue-100 text-blue-700" },
    "Claimed": { label: "Claimed", cls: "bg-green-100 text-green-700" },
    "Denied": { label: "Denied", cls: "bg-red-100 text-red-700" },
  };

  if (loading) return <div className="p-10 text-center font-bold text-blue-600">Loading your history...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      
      {/* SLIP MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-blue-600 p-4 text-center text-white">
              <h2 className="font-black text-lg tracking-tight">RESERVATION SLIP</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Reference Number</p>
                <h3 className="text-2xl font-mono font-black text-blue-700">
                  {selectedSlip.reservationId}
                </h3>
              </div>

              <div className="space-y-3 py-4 border-y border-dashed border-gray-200 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Status:</span>
                  <span className="font-bold text-gray-800 uppercase">{selectedSlip.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Student ID:</span>
                  <span className="font-bold text-gray-800">{selectedSlip.studentId}</span>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Items Summary</p>
                {selectedSlip.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-gray-700 truncate max-w-[200px]">
                      {item.name || `${item.brand} ${item.model}`}
                    </span>
                    <span className="font-bold text-blue-600">x{item.quantity || item.qty}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-6">
                <span className="font-bold text-gray-600">Total</span>
                <span className="text-xl font-black text-gray-900">₱{selectedSlip.total?.toLocaleString()}</span>
              </div>

              <button 
                onClick={() => setSelectedSlip(null)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Close Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8 mt-4">
        <h1 className="text-2xl font-black text-gray-900">Order History</h1>
        <p className="text-sm text-gray-500">Track your reservations for UniHub Marketplace</p>
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No orders found.</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = order.status || "Pending Payment";
            const config = statusConfig[status] || statusConfig["Pending Payment"];

            return (
              <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${config.cls}`}>
                    {status === "Claimed" ? "✅" : status === "Denied" ? "❌" : "📦"}
                  </div>
                  <div>
                    <p className="text-[11px] font-mono font-bold text-blue-600 tracking-tighter">
                      REF: {order.reservationId}
                    </p>
                    <h4 className="font-bold text-gray-800 text-sm">
                      {order.items?.length} {order.items?.length === 1 ? 'Item' : 'Items'} Reserved
                    </h4>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">
                      {order.createdAt?.toDate() ? order.createdAt.toDate().toDateString() : "Date Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">Total</p>
                    <p className="text-lg font-black text-gray-900">₱{order.total?.toLocaleString()}</p>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedSlip(order)}
                    className="bg-gray-900 text-white text-xs font-black px-5 py-2.5 rounded-lg hover:bg-blue-600 transition-all uppercase tracking-tight"
                  >
                    Show Slip
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserOrders;