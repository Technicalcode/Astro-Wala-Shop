import { showErrorPopup } from "../utils/notificationCenter";

const getActionTitle = (type = "") => {
  if (type.startsWith("cart/")) return "Cart action failed";
  if (type.startsWith("wishlist/")) return "Wishlist action failed";
  if (type.startsWith("orders/")) return "Order action failed";
  if (type.startsWith("reviews/")) return "Review action failed";
  if (type.startsWith("products/")) return "Product request failed";
  if (type.startsWith("categories/")) return "Category request failed";
  return "Request failed";
};

export const errorNotificationMiddleware = () => (next) => (action) => {
  const result = next(action);

  if (
    !action.meta?.fromChannel &&
    action.type?.endsWith("/rejected") &&
    !action.meta?.aborted &&
    !action.meta?.condition
  ) {
    const message = action.payload || action.error?.message || "The request could not be completed.";
    showErrorPopup(message, {
      title: getActionTitle(action.type),
      details: `Operation: ${action.type.replace(/\/rejected$/, "")}`,
    });
  }

  return result;
};

