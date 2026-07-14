import { useEffect, useSyncExternalStore } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import {
  dismissNotification,
  getNotificationsSnapshot,
  showErrorPopup,
  subscribeToNotifications,
} from "../utils/notificationCenter";

const iconByType = {
  error: AlertTriangle,
  success: CheckCircle2,
  info: Info,
};

const colorByType = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function ErrorPopupCenter() {
  const notifications = useSyncExternalStore(
    subscribeToNotifications,
    getNotificationsSnapshot,
    () => [],
  );

  useEffect(() => {
    const handleError = (event) => {
      showErrorPopup(event.error || event.message, {
        title: "Unexpected page error",
        details: "The page encountered an unexpected problem. Refresh the page if the issue continues.",
      });
    };
    const handleRejection = (event) => {
      showErrorPopup(event.reason, {
        title: "Request failed unexpectedly",
        details: "A background operation could not be completed.",
      });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed right-3 top-3 z-[10000] flex w-[calc(100%-1.5rem)] max-w-md flex-col gap-2 sm:right-4 sm:top-4"
      aria-live="assertive"
      aria-atomic="false"
    >
      {notifications.map((notification) => {
        const Icon = iconByType[notification.type] || AlertTriangle;
        return (
          <div
            key={notification.id}
            role={notification.type === "error" ? "alert" : "status"}
            className={`rounded-md border p-4 shadow-xl ${colorByType[notification.type] || colorByType.error}`}
          >
            <div className="flex items-start gap-3">
              <Icon size={20} className="mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="mt-1 break-words text-sm leading-5">{notification.message}</p>
                {(notification.status || notification.details) && (
                  <details className="mt-2 text-xs">
                    <summary className="cursor-pointer font-medium">View details</summary>
                    <div className="mt-1.5 whitespace-pre-wrap break-words rounded bg-white/60 px-2 py-1.5">
                      {notification.status ? `Status: ${notification.status}` : ""}
                      {notification.status && notification.details ? "\n" : ""}
                      {notification.details}
                    </div>
                  </details>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissNotification(notification.id)}
                className="shrink-0 rounded p-1 opacity-70 hover:bg-black/5 hover:opacity-100"
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

