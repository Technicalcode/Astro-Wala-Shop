const categoryIdOf = (category) => {
  if (category && typeof category === "object") {
    return category._id || category.id || "";
  }

  return category || "";
};

/**
 * Returns the customer-facing category label for a product or category value.
 * Category IDs remain useful for filtering and routing, but should never be
 * rendered as the category label.
 */
export const getCategoryDisplayName = (productOrCategory, categories = []) => {
  if (!productOrCategory) return "Uncategorized";

  const isProduct = typeof productOrCategory === "object" && (
    "category" in productOrCategory ||
    "category_id" in productOrCategory ||
    "categoryName" in productOrCategory
  );
  const category = isProduct
    ? productOrCategory.category_id || productOrCategory.category
    : productOrCategory;
  const embeddedName = isProduct
    ? productOrCategory.categoryName ||
      (productOrCategory.category_id && typeof productOrCategory.category_id === "object"
        ? productOrCategory.category_id.name
        : productOrCategory.category && typeof productOrCategory.category === "object"
          ? productOrCategory.category.name
          : "")
    : typeof category === "object"
      ? category.name
      : "";

  if (typeof embeddedName === "string" && embeddedName.trim()) {
    return embeddedName.trim();
  }

  const categoryId = String(categoryIdOf(category));
  return categories.find((item) => String(item.id || item._id) === categoryId)?.name || "Uncategorized";
};
