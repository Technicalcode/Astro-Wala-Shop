let sequence = 0;
const MINIMUM_VISIBLE_MS = 300;
const activeRequests = new Map();
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener());
};

export const beginNetworkActivity = () => {
  sequence += 1;
  const token = sequence;
  activeRequests.set(token, Date.now());
  notify();
  return token;
};

export const endNetworkActivity = (token) => {
  const startedAt = activeRequests.get(token);
  if (startedAt === undefined) return;

  const finish = () => {
    if (!activeRequests.delete(token)) return;
    notify();
  };
  const remaining = MINIMUM_VISIBLE_MS - (Date.now() - startedAt);

  if (remaining > 0) {
    setTimeout(finish, remaining);
    return;
  }

  finish();
};

export const withNetworkActivity = async (request) => {
  const token = beginNetworkActivity();

  try {
    return await request();
  } finally {
    endNetworkActivity(token);
  }
};

export const subscribeToNetworkActivity = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getNetworkActivitySnapshot = () => activeRequests.size > 0;
