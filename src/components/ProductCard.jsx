import { useState } from "react";
import { useCart } from "../contexts/CartContext";

function ProductCard({ phone }) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const stock = phone.stock ?? 0;
  const isInStock = stock > 0;

  const handleAddToCart = () => {
    if (!isInStock) {
      alert("⚠️ This product is out of stock!");
      return;
    }

    if (quantity < 1) {
      alert("⚠️ Invalid quantity!");
      return;
    }

    if (quantity > stock) {
      alert("⚠️ Not enough stock available!");
      return;
    }

    addToCart(phone, quantity);

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

      {/* Image */}
      <div className="relative bg-slate-50 px-6 pt-6 pb-4">
        <img
          src={phone.image}
          alt={phone.model}
          className="w-full h-44 object-contain"
        />

        <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded
          ${isInStock ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
          {isInStock ? `In Stock (${stock})` : "Out of Stock"}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        <div>
          <p className="text-xs text-amber-500">{phone.brand}</p>
          <h2 className="font-semibold">{phone.model}</h2>
        </div>

        <p className="font-bold text-lg">₱{phone.price}</p>

        <p className="text-xs text-gray-500">Available: {stock} pcs</p>

        {/* ✅ QUANTITY INPUT */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            max={stock}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-16 px-2 py-1 border rounded text-sm"
          />
          <span className="text-xs text-gray-500">pcs</span>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleAddToCart}
          disabled={!isInStock}
          className={`py-2 rounded text-sm font-semibold
            ${!isInStock
              ? "bg-gray-300 text-gray-500"
              : added
              ? "bg-green-500 text-white"
              : "bg-black text-white hover:bg-amber-400 hover:text-black"
            }`}
        >
          {added ? "Added!" : isInStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </div>
  );
}

export default ProductCard;