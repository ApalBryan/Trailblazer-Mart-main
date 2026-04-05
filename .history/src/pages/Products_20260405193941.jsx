import { useSearchParams } from "react-router-dom"; // Add this import

function Products() {
  const [phones, setPhones] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get category from URL (e.g., ?category=iPhone), default to "All"
  const selectedCategory = searchParams.get("category") || "All";

  // Function to update the URL when a button is clicked
  const handleCategoryClick = (cat) => {
    if (cat === "All") {
      setSearchParams({}); // Clear the URL
    } else {
      setSearchParams({ category: cat }); // Update URL to ?category=CatName
    }
  };

  // ... keep your useEffect and categories array the same ...

  return (
    <div>
       {/* Update your buttons to use the new handleCategoryClick function */}
       {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)} 
            className={`... same classes as before ...`}
          >
            {cat}
          </button>
       ))}
       
       {/* Filter logic remains the same because it uses selectedCategory */}
    </div>
  );
}