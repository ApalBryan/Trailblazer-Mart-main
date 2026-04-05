import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Layout
import Navbar from "./components/Navbar";

// Public Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import Cart from "./pages/Cart";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// User Pages
import UserOrders from "./pages/UserOrders";
// ✅ Added User Seller Pages
import UserDashboard from "./pages/UserDashboard";
import UserAddProduct from "./pages/UserAddProduct";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminPageWrapper from "./pages/Admin";
import AdminOrders from "./pages/AdminOrders";

// ─── Route Definitions ────────────────────────────────────────────────────────

const PUBLIC_ROUTES = [
  { path: "/",         element: <Home />     },
  { path: "/products", element: <Products /> },
  { path: "/cart",     element: <Cart />     },
];

const AUTH_ROUTES = [
  { path: "/login",  element: <Login />  },
  { path: "/signup", element: <Signup /> },
];

const USER_ROUTES = [
  { path: "/orders", element: <UserOrders /> },
  // ✅ Added Seller Routes to User Section
  { path: "/user-dashboard", element: <UserDashboard /> },
  { path: "/sell-item", element: <UserAddProduct /> },
];

const ADMIN_ROUTES = [
  { path: "/admin/dashboard",   element: <AdminDashboard />   },
  { path: "/admin/add-product", element: <AdminPageWrapper /> },
  { path: "/admin/orders",      element: <AdminOrders />      },
];

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <Router>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 font-sans antialiased tracking-tight">
        <Routes>
          {PUBLIC_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {AUTH_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {USER_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}

          {ADMIN_ROUTES.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </main>
    </Router>
  );
}

export default App;