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
  
  // State for viewing an old slip
  const [selectedSlip, setSelectedSlip] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

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

      ordersArray.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setOrders(ordersArray);
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // ✅ Updated Status Configuration to match Admin workflow
  const statusConfig = {
    "Pending Payment": { label: "Pending", cls: "bg-yellow-100 text-yellow-700" },
    "Reserved": { label: "Reserved", cls: "bg-blue-100 text-blue-700" },
    "Claimed": { label: "Claimed", cls: "bg-green-100 text-green-700" },
    "Denied": { label: "Denied", cls: "bg-red-100 text-red-700" },
  };

  const visibleOrders = orders.filter((order) => !order.hidden);

  return (
    <div className="max-w-4xl mx-auto p-6">
      
      {/* SLIP MODAL (For viewing old slips) */}
      {selectedSlip && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white max-w-sm w-full rounded-lg shadow-xl p-6 border-t-8 border-blue-600">
            <h2 className="text-center font-bold text-xl mb-4">Reservation Slip</h2>
            <div className="space-y-2 text-sm border-b pb-4 mb-4">
              <div className="flex justify-between"><strong>ID:</strong> <span className="font-mono text-blue-600">{selectedSlip.reservationId}</span></div>
              <div className="flex justify-between"><strong>Status:</strong> <span>{selectedSlip.status}</span></div>
              <div className="flex justify-between"><strong>Student ID:</strong> <span>{selectedSlip.studentId}</span></div>
            </div>
            <div className="mb-6">
              {selectedSlip.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name || `${item.brand} ${item.model}`}</span>
                  <span>x{item.quantity || item.qty}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setSelectedSlip(null)}
              className="w-full bg-gray-800 text-white py-2 rounded font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">My Purchase Intentions</h1>
        <p className="text-gray-500">Track your reservations and slips</p>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <p className="text-gray-400">No active reservations found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleOrders.map((order) => {
            const status = order.status || "Pending Payment";
            const config = statusConfig[status] || statusConfig["Pending Payment"];

            return (
              <div key={order.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-mono text-gray-400">REF: {order.reservationId}</span>
                      <h3 className="text-lg font-bold text-gray-800">
                        {order.items?.length} Item{order.items?.length !== 1 ? 's' : ''} Reserved
                      </h3>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${config.cls}`}>
                      {config.label}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-gray-600">
                        <span>{item.brand} {item.model}</span>
                        <span>x{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <p className="text-xl font-black">₱{order.total?.toLocaleString()}</p>
                    
                    {/* VIEW SLIP BUTTON - Key for the Student */}
                    <button 
                      onClick={() => setSelectedSlip(order)}
                      className="text-blue-600 text-sm font-bold hover:underline"
                    >
                      View Digital Slip
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UserOrders;