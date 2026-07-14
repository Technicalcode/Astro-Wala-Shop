import { Helmet } from "react-helmet-async";
import Editable from "../components/editable/Editable";
import CategoryGrid from "../components/CategoryGrid";

export default function AllCategories() {
  return (
    <Editable as="div" id="all-categories-page" kind="button" label="All Categories Page" className="py-8">
      <Helmet>
        <title>All Categories | AstroMart</title>
        <meta name="description" content="Browse all product categories at AstroMart, including gemstones, rudraksha, yantras, pooja samagri, and more." />
      </Helmet>
      <Editable as="h1" id="all-categories-title" kind="button" label="Categories Title" className="text-3xl font-display font-semibold text-center text-gray-900 mb-8">
        Shop by Category
      </Editable>
      <CategoryGrid />
    </Editable>
  );
}
