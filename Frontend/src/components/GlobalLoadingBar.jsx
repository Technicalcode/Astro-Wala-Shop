import { useSyncExternalStore } from "react";
import {
  getNetworkActivitySnapshot,
  subscribeToNetworkActivity,
} from "../utils/networkActivity";

export default function GlobalLoadingBar() {
  const active = useSyncExternalStore(
    subscribeToNetworkActivity,
    getNetworkActivitySnapshot,
    () => false,
  );

  if (!active) return null;

  return (
    <div
      className="global-loading-bar"
      role="progressbar"
      aria-label="Loading page data"
      aria-valuetext="Loading"
    >
      <span className="global-loading-bar__indicator" />
    </div>
  );
}
