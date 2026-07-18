import { useEffect, useState } from "react";
import { Heart, X, ShoppingCart, Check } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchWishlist,
  selectWishlistIds,
  selectWishlistProducts,
  selectWishlistLoading,
  toggleWishlist,
} from "../store/wishlistSlice";
import { selectAllProducts } from "../store/productsSlice";
import { addToCart } from "../store/cartSlice";
import { selectUser } from "../store/authSlice";
import Editable from "../components/editable/Editable";
import PageLoadingState from "../components/PageLoadingState";
import { showErrorPopup } from "../utils/notificationCenter";

function WishlistCard({ product, onRemove }) {
  const dispatch = useDispatch();
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    const result = await dispatch(addToCart(product));
    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Could not add product to cart.", {
        title: "Could not add item",
        details: `Product: ${product.name}`,
      });
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const imgSrc =
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    `https://placehold.co/300x300/f0ebe8/8B6914?text=${encodeURIComponent(product.name?.charAt(0) || "?")}`;

  return (
    <Editable
      as="div"
      kind="button"
      group="wishlist-card"
      label="Wishlist Card Background"
      className="bg-white rounded-md shadow-card overflow-hidden relative"
    >
      {/* Remove button */}
      <button
        onClick={() => onRemove(product)}
        className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Remove from wishlist"
      >
        <X size={14} className="text-maroon" />
      </button>

      {/* Image */}
      <Link to={`/product/${product.productId || product.id}`} className="block">
        <img loading="lazy"
          src={imgSrc}
          alt={product.name}
          className="w-full aspect-square object-cover hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/300x300/f0ebe8/8B6914?text=${encodeURIComponent(
              product.name?.charAt(0) || "?"
            )}`;
          }}
        />
      </Link>

      <div className="p-3">
        <Editable as="p" group="wishlist-item-name" label="Wishlist Item Name"
          className="text-sm text-gray-800 line-clamp-2 mb-1 font-medium">
          {product.name}
        </Editable>

        <div className="flex items-baseline gap-2 mb-2">
          <Editable as="span" group="wishlist-item-price" label="Wishlist Price"
            className="text-sm font-bold text-brand">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </Editable>
          {product.mrp > product.price && (
            <span className="text-xs text-gray-600 line-through">
              ₹{Number(product.mrp).toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-sm transition-all duration-200 ${
            added ? "bg-green-500 text-white" : "bg-cta-buy text-white hover:opacity-90"
          }`}
        >
          {added ? (
            <><Check size={13} /> Added!</>
          ) : (
            <><ShoppingCart size={13} /> Add to Cart</>
          )}
        </button>
      </div>
    </Editable>
  );
}

export default function Wishlist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const wishlistIds = useSelector(selectWishlistIds);
  const apiWishlistProducts = useSelector(selectWishlistProducts);
  const wishlistLoading = useSelector(selectWishlistLoading);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (user) dispatch(fetchWishlist());
  }, [dispatch, user]);

  const handleRemove = async (product) => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    const result = await dispatch(toggleWishlist(product));
    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Could not update wishlist.", {
        title: "Wishlist update failed",
        details: `Product: ${product.name}`,
      });
    }
  };

  const allProducts = useSelector(selectAllProducts);

  const fallbackProducts = wishlistIds
    .map((id) =>
      allProducts.find(
        (p) => String(p.id) === String(id) || String(p.productId) === String(id),
      ),
    )
    .filter(Boolean);
  const wishlistProducts =
    apiWishlistProducts.length > 0 ? apiWishlistProducts : fallbackProducts;

  if (wishlistLoading && wishlistProducts.length === 0) {
    return <PageLoadingState label="Loading your wishlist..." />;
  }

  if (wishlistProducts.length === 0) {
    return (
      <Editable as="div" kind="button" id="wishlist-empty-card" label="Wishlist Empty Card"
        className="bg-white rounded-md shadow-card py-20 flex flex-col items-center gap-4">
        <Heart size={56} className="text-gray-200" />
        <div className="text-center">
          <Editable as="p" id="wishlist-empty-title" label="Wishlist Empty Title"
            className="text-gray-700 font-semibold text-lg mb-1">
            Your wishlist is empty
          </Editable>
          <Editable as="p" id="wishlist-empty-text" label="Wishlist Empty Subtitle"
            className="text-sm text-gray-500">
            Tap ❤️ on any product to save it here
          </Editable>
        </div>
        <Editable as={Link} to="/" kind="button" id="wishlist-shop-btn" label="Shop Now Button"
          className="bg-brand text-white text-sm font-semibold px-8 py-2.5 rounded-sm mt-2">
          Shop Now
        </Editable>
      </Editable>
    );
  }

  return (
    <div>
      <Editable as="h1" id="wishlist-heading" label="Wishlist Page Heading"
        className="font-display font-semibold text-xl text-gray-900 mb-1">
        My Wishlist
      </Editable>
      <Editable as="p" id="wishlist-subtext" label="Wishlist Subtext"
        className="text-sm text-gray-500 mb-4">
        {wishlistProducts.length} saved {wishlistProducts.length === 1 ? "item" : "items"}
      </Editable>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {wishlistProducts.map((product) => (
          <WishlistCard
            key={product.productId || product.id}
            product={product}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
