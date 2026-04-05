import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Products() {
  const [phones, setPhones] = useState([]);

  useEffect(() => {
    // 🔥 REAL-TIME LISTENER
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsArray = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPhones(productsArray);
    });

    // ✅ CLEANUP LISTENER
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {phones.length === 0 ? (
        <p className="text-gray-500">No products available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {phones.map((phone) => (
            <ProductCard key={phone.id} phone={phone} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;