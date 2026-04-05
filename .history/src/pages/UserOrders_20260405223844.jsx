import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
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
        id: d.id, // Internal Firebase ID
        ...d.data(),
      }));

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

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* DIGITAL SLIP MODAL */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white max-w-sm w-full rounded-lg shadow-xl p-6 border-t-8 border-blue-600">
            <h2 className="text-center font-bold text-xl mb-1">Reservation Slip</h2>
            <p className="text-center text-[10px] text-gray-400 mb-4 uppercase tracking-widest">UniHub Marketplace</p>
            
            <div className="space-y-2 text-sm border-y py-4 mb-4">
              <div className="flex justify-between">
                <strong>Slip No:</strong> 
                <span className="font-mono text-blue-700 font-bold">
                  {/* Displays the readable Reservation Number instead of long alphanumeric ID */}
                  {selectedSlip.reservationId}
                </span>
              </div>
              <div className="flex justify-between"><strong>Status:</strong> <span>{selectedSlip.status}</span></div>
              <div className="flex justify-between"><strong>Student ID:</strong> <span>{selectedSlip.studentId}</span></div>
            </div>

            <div className="mb-6 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-bold text-gray-400 mb-2">RESERVED ITEMS</p>
              {selectedSlip.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50">
                  <span className="truncate pr-4">{item.name || `${item.brand} ${item.model}`}</span>
                  <span className="font-bold">x{item.quantity || item.qty}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mb-6 pt-2">
              <span className="font-bold">Total Amount:</span>
              <span className="text-lg font-black text-blue-700">₱{selectedSlip.total?.toLocaleString()}</span>
            </div>

            <button 
              onClick={() => setSelectedSlip(null)}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-2">Purchase History</h1>
      <p className="text-gray-500 mb-8 font-medium">Track your reservation numbers for campus claiming.</p>

      <div className="space-y-4">
        {orders.filter(o => !o.hidden).map((order, index) => {
          const status = order.status || "Pending Payment";
          const config = statusConfig[status] || statusConfig["Pending Payment"];

          return (
            <div key={order.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  {/* REPLACE ID with Numeric Index or Reservation Number */}
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                    {orders.length - index}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-mono">Ref: {order.reservationId}</p>
                    <p className="text-sm font-bold text-gray-800">
                      {order.createdAt?.toDate() ? order.createdAt.toDate().toLocaleDateString() : "Date N/A"}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${config.cls}`}>
                  {config.label}
                </span>
              </div>

              <div className="flex justify-between items-end border-t pt-4">
                <div>
                  <p className="text-xs text-gray-400">Total Price</p>
                  <p className="text-xl font-black text-gray-900">₱{order.total?.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setSelectedSlip(order)}
                  className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition"
                >
                  Show Slip
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UserOrders;