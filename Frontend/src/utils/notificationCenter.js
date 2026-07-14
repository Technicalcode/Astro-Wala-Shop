let sequence = 0;
let notifications = [];
let snapshot = notifications;
const listeners = new Set();
const recentFingerprints = new Map();

const notify = () => {
  snapshot = notifications;
  listeners.forEach((listener) => listener());
};

const cleanText = (value) => String(value || "").trim();

const redactSensitiveDetails = (value) =>
  cleanText(value)
    .replace(/Bearer\s+[\w.-]+/gi, "Bearer [redacted]")
    .replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[token redacted]")
    .replace(/(api[_-]?key|password|secret|token)\s*[:=]\s*\S+/gi, "$1=[redacted]");

const getDefaultTitle = (type, status, message) => {
  if (type === "info") return "Notification";
  if (type === "success") return "Success";
  if (status === 401 || /expired token|login again|unauthorized/i.test(message)) {
    return "Session expired";
  }
  if (status === 403) return "Action not allowed";
  if (status === 404) return "Information not found";
  if (status === 409) return "Request could not be completed";
  if (status >= 500) return "Server error";
  if (/failed to fetch|network|connect to the server/i.test(message)) {
    return "Connection problem";
  }
  return "Something went wrong";
};

export const dismissNotification = (id) => {
  const next = notifications.filter((notification) => notification.id !== id);
  if (next.length === notifications.length) return;
  notifications = next;
  notify();
};

export const showNotification = ({
  type = "error",
  title,
  message,
  details = "",
  status = 0,
  duration,
} = {}) => {
  const normalizedMessage = cleanText(message) || "An unexpected error occurred.";
  const normalizedDetails = redactSensitiveDetails(details);
  const fingerprint = `${type}:${normalizedMessage}`;
  const now = Date.now();
  const previous = recentFingerprints.get(fingerprint) || 0;

  if (now - previous < 1500) return null;
  recentFingerprints.set(fingerprint, now);
  if (recentFingerprints.size > 100) {
    const oldestFingerprint = recentFingerprints.keys().next().value;
    recentFingerprints.delete(oldestFingerprint);
  }

  sequence += 1;
  const id = sequence;
  const notification = {
    id,
    type,
    title: cleanText(title) || getDefaultTitle(type, Number(status), normalizedMessage),
    message: normalizedMessage,
    details: normalizedDetails,
    status: Number(status) || 0,
  };

  notifications = [...notifications.slice(-2), notification];
  notify();

  const timeoutMs = duration ?? (type === "error" ? 0 : 5000);
  if (timeoutMs > 0) setTimeout(() => dismissNotification(id), timeoutMs);
  return id;
};

export const showErrorPopup = (error, options = {}) => {
  const source = error && typeof error === "object" ? error : {};
  const message =
    options.message || source.message || source.error || cleanText(error) || "An unexpected error occurred.";

  return showNotification({
    ...options,
    type: "error",
    message,
    details: options.details || source.details || "",
    status: options.status || source.status || 0,
  });
};

export const showInfoPopup = (message, options = {}) =>
  showNotification({ ...options, type: options.type || "info", message });

export const subscribeToNotifications = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getNotificationsSnapshot = () => snapshot;
