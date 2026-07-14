import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Star, Edit2, Trash2, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Editable from "../../components/editable/Editable";
import {
  deleteReview,
  fetchMyReviews,
  selectMyReviews,
  selectReviewsError,
  selectReviewsLoading,
  updateReview,
} from "../../store/reviewSlice";
import { showErrorPopup } from "../../utils/notificationCenter";

export default function AccountReviews() {
  const dispatch = useDispatch();
  const reviews = useSelector(selectMyReviews);
  const loading = useSelector(selectReviewsLoading);
  const error = useSelector(selectReviewsError);
  const [editingReview, setEditingReview] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    dispatch(fetchMyReviews());
  }, [dispatch]);

  const handleDelete = async (review) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    const result = await dispatch(deleteReview({ id: review.id, productId: review.productId }));
    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Could not delete review.", {
        title: "Review was not deleted",
        details: `Product: ${review.productName || review.productId}`,
      });
    }
  };

  const handleEdit = (review) => {
    setEditingReview({ ...review });
    setHoverRating(0);
  };

  const saveEdit = async (event) => {
    event.preventDefault();

    const result = await dispatch(
      updateReview({
        id: editingReview.id,
        rating: editingReview.rating,
        title: editingReview.title,
        comment: editingReview.comment,
      }),
    );

    if (result.type?.endsWith("/rejected")) {
      showErrorPopup(result.payload || "Could not update review.", {
        title: "Review was not updated",
        details: `Product: ${editingReview.productName || editingReview.productId}`,
      });
      return;
    }

    setEditingReview(null);
  };

  if (loading) {
    return (
      <Editable as="div" kind="button" id="reviews-loading-card" label="Reviews Loading Card" className="bg-white rounded-md shadow-card py-16 text-center">
        <p className="text-gray-600">Loading your reviews...</p>
      </Editable>
    );
  }

  if (reviews.length === 0) {
    return (
      <Editable as="div" kind="button" id="reviews-empty-card" label="Reviews Empty Card" className="bg-white rounded-md shadow-card py-16 flex flex-col items-center gap-3">
        <MessageSquare size={44} className="text-gray-300" />
        <p className="text-gray-600">{error || "You haven't written any reviews yet."}</p>
        <Link to="/account/orders" className="bg-brand text-white text-sm font-semibold px-6 py-2.5 rounded-sm mt-2">Review Past Orders</Link>
      </Editable>
    );
  }

  return (
    <>
      <Editable as="div" kind="button" id="reviews-main-card" label="Reviews Main Card Background" className="bg-white rounded-md shadow-card p-4 sm:p-6">
        <Editable as="h1" id="reviews-heading" label="Reviews Page Heading" className="font-display font-semibold text-xl text-gray-900 mb-6">
          My Reviews
        </Editable>

        <div className="flex flex-col gap-6">
          {reviews.map((review) => (
            <Editable key={review.id} as="div" kind="button" group="review-card" label="Review Card Background" className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-48 shrink-0">
                  <Link to={`/product/${review.productId}`} className="block group">
                    <img loading="lazy"
                      src={review.productImage}
                      alt=""
                      className="w-full h-32 object-cover rounded-md border border-gray-100 group-hover:opacity-90 transition-opacity"
                    />
                    <h3 className="font-medium text-gray-900 text-sm mt-2 group-hover:text-brand line-clamp-2">{review.productName}</h3>
                  </Link>
                </div>

                <div className="flex-1 bg-gray-50 rounded-md p-4 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={14} className={star <= review.rating ? "text-gold fill-gold" : "text-gray-300"} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString("en-IN")}</span>
                  </div>

                  <p className="text-sm font-semibold text-gray-900">{review.title}</p>
                  <p className="text-sm text-gray-700 mt-1">{review.comment}</p>

                  <div className="flex items-center gap-4 text-xs font-medium mt-4 pt-3 border-t border-gray-200">
                    <button onClick={() => handleEdit(review)} className="text-blue-600 hover:underline flex items-center gap-1">
                      <Edit2 size={12} /> Edit Review
                    </button>
                    <button onClick={() => handleDelete(review)} className="text-red-600 hover:underline flex items-center gap-1">
                      <Trash2 size={12} /> Delete Review
                    </button>
                  </div>
                </div>
              </div>
            </Editable>
          ))}
        </div>
      </Editable>

      {editingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <Editable as="div" kind="button" id="review-modal-bg" label="Review Modal Background" className="bg-white rounded-md shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Edit Your Review</h3>
              <button onClick={() => setEditingReview(null)} className="text-gray-400 hover:text-gray-900">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-4 flex flex-col gap-4">
              <p className="text-sm font-medium text-gray-700">{editingReview.productName}</p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2" onMouseLeave={() => setHoverRating(0)}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= (hoverRating || editingReview.rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onClick={() => setEditingReview({ ...editingReview, rating: star })}
                        className="focus:outline-none transition-transform hover:scale-110 cursor-pointer p-1 -m-1"
                      >
                        <Star size={24} className={isFilled ? "text-gold fill-gold" : "text-gray-300"} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Review Title</label>
                <input
                  required
                  maxLength={120}
                  value={editingReview.title || ""}
                  onChange={(event) => setEditingReview({ ...editingReview, title: event.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Your Review</label>
                <textarea
                  required
                  rows={4}
                  value={editingReview.comment}
                  onChange={(event) => setEditingReview({ ...editingReview, comment: event.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-brand resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setEditingReview(null)} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2">
                  Cancel
                </button>
                <Editable as="button" kind="button" id="review-save-btn" label="Save Review Button" type="submit" className="bg-brand text-white text-sm font-semibold px-6 py-2 rounded-sm hover:opacity-90">
                  Update Review
                </Editable>
              </div>
            </form>
          </Editable>
        </div>
      )}
    </>
  );
}
