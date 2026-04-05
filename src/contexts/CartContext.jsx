import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {

  // ✅ LOAD CART FROM LOCAL STORAGE
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // ✅ SAVE CART TO LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // ✅ ADD TO CART WITH QUANTITY + STOCK LIMIT
  const addToCart = (product, qty = 1) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);

      if (exists) {
        const newQuantity = exists.quantity + qty;

        // ❌ Prevent exceeding stock
        if (newQuantity > product.stock) {
          alert("⚠️ Exceeds available stock!");
          return prev;
        }

        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // ❌ Prevent adding more than stock initially
      if (qty > product.stock) {
        alert("⚠️ Exceeds available stock!");
        return prev;
      }

      return [...prev, { ...product, quantity: qty }];
    });
  };

  // REMOVE ONE ITEM
  const removeFromCart = (productId) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // CLEAR CART
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart"); // optional cleanup
  };

  // TOTAL PRICE
  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        totalPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
}