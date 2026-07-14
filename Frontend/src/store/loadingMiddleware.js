import {
  beginNetworkActivity,
  endNetworkActivity,
} from "../utils/networkActivity";

const requestTokens = new Map();

export const loadingMiddleware = () => (next) => (action) => {
  if (!action.meta?.fromChannel && action.meta?.requestId) {
    if (action.type.endsWith("/pending")) {
      const previousToken = requestTokens.get(action.meta.requestId);
      if (previousToken) endNetworkActivity(previousToken);
      requestTokens.set(action.meta.requestId, beginNetworkActivity());
    }

    if (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")) {
      const token = requestTokens.get(action.meta.requestId);
      if (token) {
        endNetworkActivity(token);
        requestTokens.delete(action.meta.requestId);
      }
    }
  }

  return next(action);
};

