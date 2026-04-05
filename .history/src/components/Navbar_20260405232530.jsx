import logo from "../assets/logo.png"
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function Sidebar() {
  const { currentUser, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(true); // Sidebar is open by default
  const [scrolled, setScrolled] = useState(false); // optional: can remove for sidebar

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // 🔥 Link styling function
  const linkClass = ({ isActive }) =>
    `relative text-sm font-medium tracking-wide transition-all duration-300 ${
      isActive ? "text-amber-400" : "text-slate-300 hover:text-white"
    } after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:rounded-full after:bg-amber-400 after:transition-all after:duration-300 ${
      isActive ? "after:w-full" : "after:w-0 hover:after:w-full"
    }`;

  const commonLinks = (
    <>
      {/* Public */}
      <NavLink to="/" className={linkClass}>
        Home
      </NavLink>
      <NavLink to="/products" className={linkClass}>
        Products
      </NavLink>

      {!isAdmin && (
        <NavLink to="/cart" className={linkClass}>
          Cart
        </NavLink>
      )}

      {/* Admin */}
      {isAdmin && (
        <>
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `text-xs font-semibold tracking-widest uppercase px-3 py-1.5 rounded-md transition-all duration-300 ${
                isActive
                  ? "bg-amber-400 text-slate-900 shadow"
                  : "border border-slate-600 text-slate-300 hover:border-amber-400 hover:text-amber-400"
              }`
            }
          >
            Dashboard
          </NavLink>

          <NavLink to="/admin/add-product" className={linkClass}>
            Add Product
          </NavLink>

          <NavLink to="/admin/orders" className={linkClass}>
            Manage Orders
          </NavLink>
        </>
      )}

      {/* Auth */}
      {currentUser ? (
        <>
          {!isAdmin && (
            <NavLink to="/orders" className={linkClass}>
              My Orders
            </NavLink>
          )}

          <button
            onClick={handleLogout}
            className="text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-md border border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500 hover:text-white transition-all duration-300 w-full text-left"
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <NavLink to="/login" className={linkClass}>
            Login
          </NavLink>

          <NavLink
            to="/signup"
            className={({ isActive }) =>
              `text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-md transition-all duration-300 ${
                isActive
                  ? "bg-amber-400 text-slate-900 shadow"
                  : "bg-amber-400/10 border border-amber-400/40 text-amber-400 hover:bg-amber-400 hover:text-slate-900"
              } w-full text-left`
            }
          >
            Sign Up
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <div className="flex">
      {/* Sidebar */}
      <aside
  className={`fixed left-0 top-0 h-full w-64 bg-[#3D348B] border-r border-white/10 shadow-lg p-6 flex flex-col justify-start gap-6 transition-transform duration-300 ${
    open ? "translate-x-0" : "-translate-x-full"
  }`}
>
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 mb-6">
          <img
          src={logo}
          alt="MerchStore Logo"
          className="w-9 h-9 object-contain"
        />

        <span className="font-semibold text-white tracking-tight text-lg">
          TrailBlazer<span className="text-amber-400">Mart</span>
        </span>
        </NavLink>

        {/* Links */}
        <nav className="flex flex-col gap-4">{commonLinks}</nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden absolute top-4 right-4 p-2"
          onClick={() => setOpen(!open)}
        >
          <span className="text-white font-bold">{open ? "×" : "☰"}</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-6">{/* Your page content goes here */}</main>
    </div>
  );
}

export default Sidebar;