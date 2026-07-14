import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { fomoNames, fomoCities, fomoActions } from "../data/fomoData";
import { useSelector } from "react-redux";
import { selectAllProducts } from "../store/productsSlice";

const MIN_GAP_MS = 14000;
const MAX_GAP_MS = 26000;
const VISIBLE_MS = 6000;

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FomoNotification() {
  const allProducts = useSelector(selectAllProducts);
  const [toast, setToast] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const hideTimer = useRef(null);
  const scheduleTimer = useRef(null);

  useEffect(() => {
    if (dismissed || !allProducts.length) return;

    const showRandomToast = () => {
      const product = randomItem(allProducts);
      setToast({
        name: randomItem(fomoNames),
        city: randomItem(fomoCities),
        action: randomItem(fomoActions),
        product,
        minutesAgo: 1 + Math.floor(Math.random() * 14),
      });

      hideTimer.current = setTimeout(() => {
        setToast(null);
        scheduleNext();
      }, VISIBLE_MS);
    };

    const scheduleNext = () => {
      const gap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
      scheduleTimer.current = setTimeout(showRandomToast, gap);
    };

    scheduleNext();

    return () => {
      clearTimeout(hideTimer.current);
      clearTimeout(scheduleTimer.current);
    };
  }, [allProducts, dismissed]);

  if (!toast || dismissed) return null;

  return (
    <div className="fixed bottom-5 left-5 z-50 max-w-[300px] animate-[fadeInUp_0.3s_ease-out]">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 flex gap-3 items-center">
        <img
          src={toast.product.image}
          alt=""
          className="h-12 w-12 rounded-md object-cover shrink-0 border border-gray-100"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] text-gray-800 leading-snug">
            <span className="font-semibold">{toast.name}</span> from {toast.city}{" "}
            {toast.action}{" "}
            <Link
              to={`/product/${toast.product.id}`}
              className="font-medium text-brand hover:underline"
              onClick={() => setToast(null)}
            >
              {toast.product.name.length > 32
                ? toast.product.name.slice(0, 32) + "…"
                : toast.product.name}
            </Link>
          </p>
          <p className="text-[10.5px] text-gray-400 mt-0.5">{toast.minutesAgo} mins ago</p>
        </div>
        <button
          onClick={() => {
            setToast(null);
            setDismissed(true);
          }}
          aria-label="Dismiss notification"
          className="text-gray-300 hover:text-gray-500 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
