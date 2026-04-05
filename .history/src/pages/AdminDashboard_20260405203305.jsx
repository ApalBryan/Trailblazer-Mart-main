import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, addDoc, onSnapshot } from "firebase/firestore";

function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();

  // Stats State
  const [stats, setStats] = useState({ revenue: 0, users: 0, products: 0, pending: 0, completed: 0 });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Product Form State
  const [newProduct, setNewProduct] = useState({
    brand: "",
    size: "",
    price: "",
    image: "",
    category: "Official University Merchandise", // Default Category
    stock: 1,
    inStock: true
  });

  // Real-time Fetching
  useEffect(() => {
    const unsubscribeProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);
      setStats(prev => ({ ...prev, products: snapshot.size }));
    });

    const fetchOrdersAndUsers = async () => {
      try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        const usersSnap = await getDocs(collection(db, "users"));
        
        let rev = 0, pend = 0, comp = 0;
        ordersSnap.forEach(doc => {
          const data = doc.data();
          rev += data.total || 0;
          if (data.status === "pending") pend++;
          if (data.status === "completed") comp++;
        });

        setStats(prev => ({ ...prev, revenue: rev, users: usersSnap.size, pending: pend, completed: comp }));
      } catch (err) { console.error(err); }
      setLoading(false);
    };

    fetchOrdersAndUsers();
    return () => unsubscribeProducts();
  }, []);

  // Handlers
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "products"), {
        ...newProduct,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock)
      });
      alert("Product Added!");
      setNewProduct({ brand: "", size: "", price: "", image: "", category: "Official University Merchandise", stock: 1, inStock: true });
    } catch (err) { alert("Error adding product"); }
  };

  const updateStock = async (id, value) => {
    const val = Number(value);
    await updateDoc(doc(db, "products", id), { stock: val, inStock: val > 0 });
  };

  if (!currentUser || !isAdmin) return <Navigate to="/login" />;
  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* STATS TILES */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
        <div className="bg-green-600 text-white p-4 rounded-lg shadow">
          <p className="text-sm opacity-80">Total Revenue</p>
          <p className="text-2xl font-bold">₱{stats.revenue.toLocaleString()}</p>
        </div>
        <div className="bg-purple-600 text-white p-4 rounded-lg shadow"><p className="text-sm opacity-80">Users</p><p className="text-2xl font-bold">{stats.users}</p></div>
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow"><p className="text-sm opacity-80">Completed</p><p className="text-2xl font-bold">{stats.completed}</p></div>
        <div className="bg-yellow-500 text-white p-4 rounded-lg shadow"><p className="text-sm opacity-80">Pending</p><p className="text-2xl font-bold">{stats.pending}</p></div>
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow"><p className="text-sm opacity-80">Products</p><p className="text-2xl font-bold">{stats.products}</p></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* ADD PRODUCT FORM */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Add New Product</h2>
          <form onSubmit={handleAddProduct} className="bg-white p-6 rounded-xl shadow-sm flex flex-col gap-4">
            <input type="text" placeholder="Brand/Name" className="border p-2 rounded text-sm" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} required />
            <input type="text" placeholder="Size" className="border p-2 rounded text-sm" value={newProduct.size} onChange={e => setNewProduct({...newProduct, size: e.target.value})} required />
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 ml-1">Category</label>
              <select 
                className="border p-2 rounded text-sm bg-gray-50"
                value={newProduct.category}
                onChange={e => setNewProduct({...newProduct, category: e.target.value})}
              >
                <option value="Official University Merchandise">Official University Merchandise</option>
                <option value="Student Listings">Student Listings</option>
              </select>
            </div>

            <input type="number" placeholder="Price" className="border p-2 rounded text-sm" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} required />
            <input type="text" placeholder="Image URL" className="border p-2 rounded text-sm" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} required />
            <button className="bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700">Add Product</button>
          </form>
        </div>

        {/* PRODUCT LIST */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Manage Inventory</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-1 rounded uppercase ${
                  product.category === "Student Listings" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {product.category || "Uncategorized"}
                </span>
                <div className="flex gap-4">
                  <img src={product.image} className="w-20 h-20 object-contain bg-gray-50 rounded" alt="" />
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{product.brand}</p>
                    <p className="text-xs text-gray-500 mb-2">{product.size}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Stock:</span>
                      <input 
                        type="number" 
                        className="w-16 border rounded px-1 text-sm" 
                        value={product.stock} 
                        onChange={(e) => updateStock(product.id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;