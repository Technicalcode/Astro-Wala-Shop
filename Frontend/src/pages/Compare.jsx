import { X, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCompareList, clearCompare, toggleCompare } from "../store/compareSlice";
import { addToCart, selectCartItems } from "../store/cartSlice";
import { selectCategories } from "../store/categoriesSlice";
import Editable from "../components/editable/Editable";
import { getCategoryDisplayName } from "../utils/categoryDisplay";

export default function Compare() {
  const compareList = useSelector(selectCompareList);
  const cartItems = useSelector(selectCartItems);
  const categories = useSelector(selectCategories);
  const dispatch = useDispatch();

  if (compareList.length === 0) {
    return (
      <Editable as="div" kind="button" id="compare-empty-card" label="Compare Empty Card"
        className="bg-white rounded-md shadow-card py-20 flex flex-col items-center gap-4">
        <Editable as="p" id="compare-empty-text" label="Compare Empty Text"
          className="text-gray-500 text-center">
          No products to compare yet.<br />
          <span className="text-sm">Add products using the "Compare" button on product cards.</span>
        </Editable>
        <Editable as={Link} to="/" kind="button" id="compare-shop-btn" label="Browse Products Button"
          className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm">
          Browse Products
        </Editable>
      </Editable>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Editable as="h1" id="compare-heading" label="Compare Page Heading"
          className="font-display font-bold text-xl text-gray-900">
          Compare Products
        </Editable>
        <button onClick={() => dispatch(clearCompare())}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-maroon">
          <X size={15} /> Clear All
        </button>
      </div>

      <Editable as="div" kind="button" id="compare-table-card" label="Compare Table Background"
        className="bg-white rounded-md shadow-card overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          {/* Product images & names */}
          <thead>
            <tr>
              <Editable as="th" id="compare-col-header" label="Compare Label Column"
                className="py-4 px-4 text-left text-xs font-semibold text-gray-500 uppercase w-32">
                Feature
              </Editable>
              {compareList.map((p) => (
                <th key={p.id} className="py-4 px-4 text-center relative">
                  <button onClick={() => dispatch(toggleCompare(p))}
                    className="absolute top-2 right-2 text-gray-300 hover:text-maroon">
                    <X size={14} />
                  </button>
                  <img loading="lazy" src={p.images?.[0] || p.image} alt={p.name}
                    className="w-20 h-20 object-cover rounded-md mx-auto mb-2"
                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80?text=?"; }} />
                  <Editable as="p" group="compare-product-name" label="Compare Product Name"
                    className="font-semibold text-gray-900 text-xs line-clamp-2">
                    {p.name}
                  </Editable>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Price */}
            <tr className="border-t border-gray-100">
              <Editable as="td" group="compare-field-label" label="Compare Field Label"
                className="py-3 px-4 text-gray-500 font-medium text-xs uppercase">Price</Editable>
              {compareList.map((p) => (
                <td key={p.id} className="py-3 px-4 text-center">
                  <Editable as="span" group="compare-price" label="Compare Price"
                    className="font-semibold text-brand">
                    ₹{p.price?.toLocaleString("en-IN")}
                  </Editable>
                  {p.mrp > p.price && (
                    <span className="block text-xs text-gray-600 line-through">
                      ₹{p.mrp?.toLocaleString("en-IN")}
                    </span>
                  )}
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr className="border-t border-gray-100 bg-gray-50">
              <Editable as="td" group="compare-field-label" label="Compare Field Label"
                className="py-3 px-4 text-gray-500 font-medium text-xs uppercase">Rating</Editable>
              {compareList.map((p) => (
                <td key={p.id} className="py-3 px-4 text-center">
                  <Editable as="span" group="compare-rating" label="Compare Rating"
                    className="text-amber-500 font-semibold">
                    ⭐ {p.rating?.toFixed(1)}
                  </Editable>
                </td>
              ))}
            </tr>

            {/* Brand */}
            <tr className="border-t border-gray-100">
              <Editable as="td" group="compare-field-label" label="Compare Field Label"
                className="py-3 px-4 text-gray-500 font-medium text-xs uppercase">Brand</Editable>
              {compareList.map((p) => (
                <Editable as="td" key={p.id} group="compare-brand" label="Compare Brand"
                  className="py-3 px-4 text-center text-gray-700">{p.brand}</Editable>
              ))}
            </tr>

            {/* Category */}
            <tr className="border-t border-gray-100 bg-gray-50">
              <Editable as="td" group="compare-field-label" label="Compare Field Label"
                className="py-3 px-4 text-gray-500 font-medium text-xs uppercase">Category</Editable>
              {compareList.map((p) => (
                <Editable as="td" key={p.id} group="compare-category" label="Compare Category"
                  className="py-3 px-4 text-center text-gray-700 capitalize">{getCategoryDisplayName(p, categories)}</Editable>
              ))}
            </tr>

            {/* Add to Cart */}
            <tr className="border-t border-gray-200">
              <td className="py-4 px-4" />
              {compareList.map((p) => {
                const inCart = cartItems.some((item) => item.id === p.id);
                return (
                  <td key={p.id} className="py-4 px-4 text-center">
                    {inCart ? (
                      <Editable
                        as="div"
                        kind="button"
                        group="compare-added-btn"
                        label="Added Button"
                        className="bg-green-600 text-white text-xs font-semibold px-4 py-2 rounded-sm inline-flex items-center justify-center gap-1 cursor-default"
                      >
                        <Check size={14} /> Added
                      </Editable>
                    ) : (
                      <Editable
                        as="button"
                        kind="button"
                        group="compare-add-cart-btn"
                        label="Compare Add to Cart Button"
                        onClick={() => dispatch(addToCart(p))}
                        className="bg-cta-buy text-white text-xs font-semibold px-4 py-2 rounded-sm inline-flex items-center justify-center"
                      >
                        Add to Cart
                      </Editable>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </Editable>
    </div>
  );
}
